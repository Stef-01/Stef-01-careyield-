import { beforeEach, describe, expect, it } from "vitest";
import { getStore, resetStore } from "@/booking/store";
import { getConsole, onboardPractice, resetConsole } from "@/console/store";
import { evaluateGuardrails, DEFAULT_GUARDRAILS } from "@/guardrails/monitors";
import { isSuppressed } from "@/privacy/privacy";
import { getPrivacy, resetPrivacy } from "@/privacy/state";
import { deletePatientEverywhere, exportForPatient } from "@/privacy/store";
import {
  getComplaints,
  openComplaintCount,
  resetComplaints,
  resolveInStore,
  submitComplaint,
  triageInStore,
} from "./store";
import { intakeComplaint, resolveComplaint, triageComplaint, validateIntake } from "./workflow";

const AT = "2026-08-09T05:00:00Z";
const STAFF = "manager@demo.practice.example";

describe("W43 workflow transitions", () => {
  const base = intakeComplaint({ channel: "phone", summary: "Unhappy about a message", wantsOptOut: false }, "cmp-1", AT);

  it("intake validates: a real summary always; patient id only when opting out", () => {
    expect(validateIntake({ channel: "phone", summary: "hm", wantsOptOut: false })).toHaveProperty("summary");
    expect(validateIntake({ channel: "phone", summary: "Please stop contacting me", wantsOptOut: true })).toHaveProperty("patientId");
    expect(validateIntake({ channel: "phone", summary: "Please stop contacting me", wantsOptOut: true, patientId: "pat-1" })).toEqual({});
  });

  it("resolution requires triage first, and words", () => {
    const untriaged = resolveComplaint(base, "done", AT, STAFF);
    expect(untriaged.ok).toBe(false);
    if (!untriaged.ok) expect(untriaged.errors).toHaveProperty("form");
    const triaged = triageComplaint(base, "serious", AT, STAFF);
    const tooShort = resolveComplaint(triaged, "ok", AT, STAFF);
    expect(tooShort.ok).toBe(false);
    if (!tooShort.ok) expect(tooShort.errors).toHaveProperty("resolution");
    const resolved = resolveComplaint(triaged, "Apologised and confirmed opt-out", AT, STAFF);
    expect(resolved.ok && resolved.complaint.status).toBe("resolved");
  });

  it("resolved complaints are immutable and the timeline records every step", () => {
    const triaged = triageComplaint(base, "urgent", AT, STAFF);
    const result = resolveComplaint(triaged, "Handled by practice manager", AT, STAFF);
    if (!result.ok) throw new Error("expected resolution");
    const resolved = result.complaint;
    expect(triageComplaint(resolved, "low", AT, STAFF)).toEqual(resolved);
    expect(resolved.timeline.map((t) => t.event)).toEqual([
      "received via phone",
      "triaged as urgent",
      "resolved",
    ]);
  });
});

describe("W43 store + opt-out side effect", () => {
  beforeEach(() => {
    resetComplaints();
    resetStore();
  });

  it("a complaint with opt-out closes every outstanding offer for the patient, immediately", () => {
    const before = getStore().state.invitations.filter((i) => i.patientId === "pat-1");
    expect(before.every((i) => i.status === "sent")).toBe(true);
    const errors = submitComplaint(
      { channel: "sms_reply", summary: "Do not message me again", patientId: "pat-1", wantsOptOut: true },
      AT,
    );
    expect(errors).toEqual({});
    const after = getStore().state.invitations.filter((i) => i.patientId === "pat-1");
    expect(after.every((i) => i.status === "opted_out")).toBe(true);
    expect(getStore().state.auditEvents.at(-1)).toMatchObject({
      kind: "patient_opted_out",
      subjectId: "pat-1",
    });
    expect(getComplaints().complaints[0]?.optOutApplied).toBe(true);
  });

  it("open complaints feed the W16 zero-tolerance monitor", () => {
    submitComplaint({ channel: "phone", summary: "Unhappy about timing", wantsOptOut: false }, AT);
    const alerts = evaluateGuardrails(
      {
        invitationsSent: 100,
        optedOut: 0,
        generatedAttended: 20,
        generatedDna: 1,
        openComplaints: openComplaintCount(),
      },
      DEFAULT_GUARDRAILS,
    );
    expect(alerts).toMatchObject([{ monitor: "complaints", severity: "critical" }]);
    triageInStore("cmp-1", "low", AT, STAFF);
    expect(resolveInStore("cmp-1", "Explained and apologised", AT, STAFF)).toEqual({});
    expect(openComplaintCount()).toBe(0);
  });
});

// W51 audit fixes. Each test pins a confirmed finding: "no further contact" has to be
// durable and honestly reported, and "delete everywhere" has to reach this store.
describe("W51 complaint opt-out is durable and honestly reported", () => {
  beforeEach(() => {
    resetComplaints();
    resetStore();
    resetPrivacy();
  });

  it("records a suppression that survives re-ingest, not just today's offers", () => {
    submitComplaint(
      { channel: "sms_reply", summary: "Do not message me again", patientId: "pat-1", wantsOptOut: true },
      AT,
    );
    expect(isSuppressed(getPrivacy().suppressions, "pat-1")).toBe(true);
    expect(getComplaints().complaints[0]).toMatchObject({
      optOutApplied: true,
      optOutMatchedPatient: true,
    });
  });

  it("an identifier that matched nothing is flagged, never reported as a clean opt-out", () => {
    submitComplaint(
      { channel: "phone", summary: "Stop contacting me", patientId: "pat 1", wantsOptOut: true },
      AT,
    );
    const record = getComplaints().complaints[0]!;
    expect(record.optOutMatchedPatient).toBe(false);
    expect(record.timeline.at(-1)?.event).toMatch(/matched no held record/);
    // The real patient's offers are untouched — which is exactly why staff are told.
    expect(getStore().state.invitations.some((i) => i.patientId === "pat-1" && i.status === "sent")).toBe(true);
  });

  it("attributes the opt-out audit event to the console practice", () => {
    resetConsole();
    onboardPractice({ name: "Demo Family Practice", timezone: "Australia/Sydney", holdoutPercent: 10 }, AT, STAFF);
    submitComplaint(
      { channel: "phone", summary: "Please stop", patientId: "pat-1", wantsOptOut: true },
      AT,
    );
    expect(getStore().state.auditEvents.at(-1)?.practiceId).toBe(getConsole().practices[0]?.practice.id);
  });
});

describe("W51 patient erasure reaches the complaints store", () => {
  beforeEach(() => {
    resetComplaints();
    resetStore();
    resetPrivacy();
  });

  it("exports complaints held under the identifier and scrubs them on erasure", () => {
    submitComplaint(
      { channel: "front_desk", summary: "Unhappy about the message wording", patientId: "pat-1", wantsOptOut: false },
      AT,
    );
    expect(exportForPatient("pat-1", AT).complaints).toHaveLength(1);

    const deletion = deletePatientEverywhere("pat-1", AT);
    expect(deletion.removed.complaints).toBe(1);
    // The raw identifier must not survive an erasure the console reports as complete.
    expect(getComplaints().complaints.every((c) => c.patientId !== "pat-1")).toBe(true);
    expect(JSON.stringify(getComplaints().complaints)).not.toContain("pat-1");
    const after = exportForPatient("pat-1", AT);
    expect(after.complaints).toEqual([]);
    expect(after.held).toBe(false);
  });

  it("an erased patient with only a complaint is still reported as held before erasure", () => {
    submitComplaint(
      { channel: "email", summary: "Complaint from a patient with no offers", patientId: "pat-unknown", wantsOptOut: false },
      AT,
    );
    expect(exportForPatient("pat-unknown", AT).held).toBe(true);
    deletePatientEverywhere("pat-unknown", AT);
    expect(exportForPatient("pat-unknown", AT).held).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { getStore, resetStore } from "@/booking/store";
import { evaluateGuardrails, DEFAULT_GUARDRAILS } from "@/guardrails/monitors";
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

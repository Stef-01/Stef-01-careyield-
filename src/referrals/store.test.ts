// W137 (unit half): cross-practice isolation, and the erasure obligation the record-class
// registry demanded. The browser half is e2e/referrals.spec.ts — a second practice is not
// reachable from one browser session, so asserting isolation there would be theatre (W83).

import { beforeEach, describe, expect, it } from "vitest";
import type { PatientId, PracticeId } from "@/domain/types";
import { deletePatientEverywhere } from "@/privacy/store";
import { resetAllStores } from "@/lib/stores";
import type { AcceptanceAct } from "./acceptance";
import { buildReferral, type ReferralDocument } from "./document";
import type { ReferralEvent } from "./leakage";
import { recordReturn, type ReturnReport } from "./return-report";
import {
  addAcceptanceActs,
  addReferralDocuments,
  addReferralEvents,
  addReturnReports,
  resetReferralRail,
  returnFor,
  scrubPatientFromReferrals,
  sentBy,
  sentTo,
} from "./store";

const A = "prac-a" as PracticeId;
const B = "prac-b" as PracticeId;
const C = "prac-c" as PracticeId;

function doc(over: { id?: string; from?: string; to?: string; patient?: string } = {}): ReferralDocument {
  const result = buildReferral(
    {
      referralId: over.id ?? "ref-1",
      fromPracticeId: over.from ?? "prac-a",
      toPracticeId: over.to ?? "prac-b",
      patientId: over.patient ?? "pat-1",
      createdAt: "2026-02-01",
      createdBy: "clin-a",
      reason: "extended_scope",
      request: "procedure",
      conditionCode: null,
      recordedFactCodes: [],
      narrative: null,
    },
    "2026-08-11",
  );
  if (!result.ok) throw new Error(`fixture rejected: ${result.errors.join(", ")}`);
  return result.document;
}

function ret(referralId: string, patientId: string): ReturnReport {
  const result = recordReturn({
    referralId,
    fromPracticeId: "prac-a",
    toPracticeId: "prac-b",
    patientId,
    outcome: "seen_care_returned",
    reportedAt: "2026-03-01",
    reportedBy: "clin-b",
    seenOn: "2026-02-20",
    narrative: null,
    referralWrittenOn: "2026-02-01",
  });
  if (!result.ok) throw new Error(`fixture rejected: ${result.errors.join(", ")}`);
  return result.report;
}

beforeEach(() => {
  resetAllStores();
  resetReferralRail();
});

describe("W137 cross-practice isolation", () => {
  beforeEach(() => {
    addReferralDocuments([
      doc({ id: "ref-1", from: "prac-a", to: "prac-b" }),
      doc({ id: "ref-2", from: "prac-b", to: "prac-a" }),
      doc({ id: "ref-3", from: "prac-c", to: "prac-c-other", patient: "pat-9" }),
    ]);
  });

  it("shows a practice only what it sent", () => {
    expect(sentBy(A).map((d) => d.referralId)).toEqual(["ref-1"]);
    expect(sentBy(B).map((d) => d.referralId)).toEqual(["ref-2"]);
  });

  it("shows a practice only what was sent to it", () => {
    expect(sentTo(A).map((d) => d.referralId)).toEqual(["ref-2"]);
    expect(sentTo(B).map((d) => d.referralId)).toEqual(["ref-1"]);
  });

  it("a third practice's referral is absent from both reads", () => {
    // Absent, not filtered later: the practice id is the query. A third practice's referral
    // must not appear on either side of anybody else's console.
    for (const practice of [A, B]) {
      expect(JSON.stringify([sentBy(practice), sentTo(practice)])).not.toContain("ref-3");
      expect(JSON.stringify([sentBy(practice), sentTo(practice)])).not.toContain("pat-9");
    }
    expect(sentBy(C).map((d) => d.referralId)).toEqual(["ref-3"]);
  });

  it("the two reads are separate, and neither includes the other's rows", () => {
    // Not one function with a flag: the two sides have different jobs, and a `bothSides`
    // boolean is one mistaken argument from showing a practice a list it should not act on.
    const sent = sentBy(A).map((d) => d.referralId);
    const received = sentTo(A).map((d) => d.referralId);
    expect(sent.some((id) => received.includes(id))).toBe(false);
  });

  it("orders by referral id, carrying no priority", () => {
    addReferralDocuments([doc({ id: "ref-0", from: "prac-a", to: "prac-b" })]);
    expect(sentBy(A).map((d) => d.referralId)).toEqual(["ref-0", "ref-1"]);
  });
});

describe("W137 erasure reaches the rail, on both sides", () => {
  const acts: AcceptanceAct[] = [
    {
      kind: "sent", referralId: "ref-1", at: "2026-02-01", by: "clin-a",
      fromPracticeId: A, toPracticeId: B, patientId: "pat-1" as PatientId,
    },
    { kind: "accepted", referralId: "ref-1", at: "2026-02-03", by: "clin-b", byPracticeId: B },
  ];
  const events: ReferralEvent[] = [
    { practiceId: A, patientId: "pat-1" as PatientId, referralId: "ref-1", kind: "referral_written", at: "2026-02-01" },
  ];

  beforeEach(() => {
    addReferralDocuments([doc({ id: "ref-1" }), doc({ id: "ref-2", patient: "pat-2" })]);
    addAcceptanceActs(acts);
    addReferralEvents(events);
    addReturnReports([ret("ref-1", "pat-1")]);
  });

  it("removes the erased patient's referral from BOTH practices' views", () => {
    // The point of declaring this store `stored` in W106's registry: the receiving practice
    // holding a copy does not make it somebody else's problem.
    scrubPatientFromReferrals("pat-1");
    expect(sentBy(A).map((d) => d.referralId)).toEqual(["ref-2"]);
    expect(sentTo(B).map((d) => d.referralId)).toEqual(["ref-2"]);
  });

  it("takes the acceptance acts, chain events and return report with it", () => {
    // A chain about a deleted referral is a dangling obligation nobody can act on.
    const removed = scrubPatientFromReferrals("pat-1");
    expect(removed).toEqual({ documents: 1, acts: 2, events: 1, returns: 1 });
    expect(returnFor("ref-1")).toBeNull();
  });

  it("leaves another patient's referral untouched", () => {
    scrubPatientFromReferrals("pat-1");
    expect(sentBy(A).map((d) => d.referralId)).toEqual(["ref-2"]);
    expect(sentBy(A)[0]?.patientId).toBe("pat-2");
  });

  it("leaves no trace of the erased patient anywhere in the rail", () => {
    scrubPatientFromReferrals("pat-1");
    expect(JSON.stringify([sentBy(A), sentTo(B), returnFor("ref-1")])).not.toContain("pat-1");
  });

  it("is reached by deletePatientEverywhere, not only when called directly", () => {
    // The failure W51 found: a store erasure does not compose with is a store the console
    // reports as clean while a raw patientId survives in it.
    const record = deletePatientEverywhere("pat-1", "2026-08-11T00:00:00Z");
    expect(sentBy(A).map((d) => d.referralId)).toEqual(["ref-2"]);
    expect(record.removed.referrals).toBe(1);
  });

  it("removes nothing for a patient with no referrals", () => {
    expect(scrubPatientFromReferrals("pat-nobody")).toEqual({
      documents: 0, acts: 0, events: 0, returns: 0,
    });
    expect(sentBy(A)).toHaveLength(2);
  });
});

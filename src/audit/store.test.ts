import { beforeEach, describe, expect, it } from "vitest";
import { getAudit, pendingVisits, recordOutcome, resetAudit } from "@/audit/store";

beforeEach(() => {
  resetAudit();
});

describe("audit store", () => {
  it("seeds three pending visits and no outcomes", () => {
    const state = getAudit();
    expect(pendingVisits(state)).toHaveLength(3);
    expect(state.outcomes).toHaveLength(0);
  });

  it("records a valid outcome and removes the visit from pending", () => {
    const first = getAudit().visits[0]!.appointmentId;
    const result = recordOutcome({
      appointmentId: first,
      usefulness: ["medication_reviewed"],
      clinicianJudgedReasonable: true,
    });
    expect(result).toEqual({ ok: true });
    expect(getAudit().outcomes).toHaveLength(1);
    expect(pendingVisits(getAudit()).map((v) => v.appointmentId)).not.toContain(first);
  });

  it("refuses an unknown visit", () => {
    expect(recordOutcome({ appointmentId: "apt-nope", usefulness: [], clinicianJudgedReasonable: false })).toEqual({
      ok: false,
      error: "unknown_visit",
    });
  });

  it("refuses a second record for the same visit", () => {
    const first = getAudit().visits[0]!.appointmentId;
    recordOutcome({ appointmentId: first, usefulness: ["preventive_care"], clinicianJudgedReasonable: true });
    expect(
      recordOutcome({ appointmentId: first, usefulness: ["referral_made"], clinicianJudgedReasonable: true }),
    ).toEqual({ ok: false, error: "already_recorded" });
    expect(getAudit().outcomes).toHaveLength(1);
  });

  it("propagates validation errors from the submission rules", () => {
    const first = getAudit().visits[0]!.appointmentId;
    expect(
      recordOutcome({ appointmentId: first, usefulness: ["unnecessary", "referral_made"], clinicianJudgedReasonable: false }),
    ).toEqual({ ok: false, error: "unnecessary_conflict" });
    expect(getAudit().outcomes).toHaveLength(0);
  });
});

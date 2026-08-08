import { describe, expect, it } from "vitest";
import type { Clinician, ClinicianId, Patient, PatientId, PracticeId } from "@/domain/types";
import {
  DEFAULT_CONFIG,
  eligibleForClinician,
  evaluateEligibility,
} from "./eligibility";
import { generatePractice } from "@/synthetic/generate";

const TODAY = "2026-08-08";
const practiceId = "prac-1" as PracticeId;

const clinician: Clinician = {
  id: "cli-1" as ClinicianId,
  practiceId,
  displayName: "Dr Test",
  participating: true,
};

function basePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "pat-1" as PatientId,
    practiceId,
    usualClinicianId: clinician.id,
    smsConsent: true,
    optedOut: false,
    lastAttendedAt: "2025-09-01", // ~11 months ago
    futureBookingAt: null,
    activeRecall: false,
    chronicCare: true,
    holdout: false,
    ...overrides,
  };
}

describe("W4 eligibility rules engine", () => {
  it("accepts the canonical returning patient", () => {
    expect(evaluateEligibility(basePatient(), clinician, DEFAULT_CONFIG, TODAY, 0)).toEqual({
      eligible: true,
    });
  });

  const exclusionCases: Array<[string, Partial<Patient>, number, string]> = [
    ["opted out is terminal", { optedOut: true }, 0, "opted_out"],
    ["no SMS consent", { smsConsent: false }, 0, "no_sms_consent"],
    ["holdout arm never invited", { holdout: true }, 0, "holdout_arm"],
    ["active recall never duplicated", { activeRecall: true }, 0, "active_recall"],
    ["existing near-term booking", { futureBookingAt: "2026-08-20" }, 0, "future_booking"],
    ["never attended = not a returning patient", { lastAttendedAt: null }, 0, "never_attended"],
    ["seen too recently", { lastAttendedAt: "2026-07-01" }, 0, "seen_too_recently"],
    ["different usual clinician", { usualClinicianId: "cli-9" as ClinicianId }, 0, "not_usual_clinician"],
  ];

  for (const [name, overrides, invites, reason] of exclusionCases) {
    it(name, () => {
      const result = evaluateEligibility(
        basePatient(overrides),
        clinician,
        DEFAULT_CONFIG,
        TODAY,
        invites,
      );
      expect(result).toEqual({ eligible: false, reason });
    });
  }

  it("enforces the contact-frequency cap", () => {
    const result = evaluateEligibility(basePatient(), clinician, DEFAULT_CONFIG, TODAY, 2);
    expect(result).toEqual({ eligible: false, reason: "invite_cap_reached" });
  });

  it("non-participating clinician blocks everything", () => {
    const result = evaluateEligibility(
      basePatient(),
      { ...clinician, participating: false },
      DEFAULT_CONFIG,
      TODAY,
      0,
    );
    expect(result).toEqual({ eligible: false, reason: "clinician_not_participating" });
  });

  it("distant future booking outside the block window does not exclude", () => {
    const result = evaluateEligibility(
      basePatient({ futureBookingAt: "2026-12-01" }),
      clinician,
      { ...DEFAULT_CONFIG, futureBookingBlockDays: 30 },
      TODAY,
      0,
    );
    expect(result).toEqual({ eligible: true });
  });

  it("chronicCareOnly narrows the pool", () => {
    const result = evaluateEligibility(
      basePatient({ chronicCare: false }),
      clinician,
      { ...DEFAULT_CONFIG, chronicCareOnly: true },
      TODAY,
      0,
    );
    expect(result).toEqual({ eligible: false, reason: "not_chronic_care" });
  });

  it("runs against the synthetic practice at scale with a full audit tally", () => {
    const data = generatePractice({
      seed: 42,
      patientCount: 12_000,
      clinicianCount: 10,
      scheduleWeeks: 1,
      todayIso: TODAY,
    });
    const target = data.clinicians[0];
    if (!target) throw new Error("no clinician generated");
    const { eligible, exclusionTally } = eligibleForClinician(
      data.patients,
      target,
      DEFAULT_CONFIG,
      TODAY,
      new Map(),
    );
    const excluded = Object.values(exclusionTally).reduce((a, b) => a + b, 0);
    expect(eligible.length + excluded).toBe(12_000);
    expect(eligible.length).toBeGreaterThan(0);
    // Usual-clinician-only across 10 GPs: no more than ~a tenth of the panel per GP.
    expect(eligible.length).toBeLessThan(1_500);
    // Every eligible patient satisfies the invariants the message layer depends on.
    for (const p of eligible) {
      expect(p.smsConsent && !p.optedOut && !p.holdout && !p.activeRecall).toBe(true);
    }
  });
});

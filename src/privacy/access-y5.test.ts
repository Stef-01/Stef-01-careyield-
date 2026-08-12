// W266 verify gate: "every `stored` and `derived` class is either represented in the export or
// refused with a written reason; both directions against the register."
//
// The register is the cheap half. The half with teeth is that the export is RUN: a register saying
// `complaintsForPatient` covers complaints and never calling it is a register of names, and names
// are what the referral rail had for three years while being erased on request and never
// disclosed on one.
//
// So a synthetic patient is seeded into every store the export claims to cover, the real
// `exportForPatient` is called, and each claimed field is required to come back non-empty. And the
// seed is proved to have landed first — an export over stores that hold nothing returns an empty
// payload and every "is it there" assertion would be checking the same absence.

import { describe, expect, it, beforeEach } from "vitest";
import {
  ACCESS_PATHS,
  accessCoverage,
  accessErasureDisagreements,
  accountableClasses,
  includedModules,
} from "./access-y5";
import { ERASURE_PATHS, scrubbedModules } from "./erasure-y5";
import { RECORD_CLASSES } from "./record-classes";
import { exportForPatient, deletePatientEverywhere } from "./store";
import { getStore } from "@/booking/store";
import { getComplaints } from "@/complaints/store";
import {
  addAcceptanceActs,
  addReferralDocuments,
  referralIdsForPatient,
  referralsForPatient,
} from "@/referrals/store";
import { STORE_RESETTERS } from "@/lib/stores";
import type {
  AppointmentId,
  ClinicianId,
  InvitationId,
  PatientId,
  PracticeId,
} from "@/domain/types";

const NOW = "2026-08-13T23:00:00Z";
const PRAC = "prac-1" as PracticeId;
const PATIENT = "pat-w266-synthetic" as PatientId;

function seed(): void {
  getStore().state = {
    invitations: [
      { id: "inv-w266" as InvitationId, practiceId: PRAC, patientId: PATIENT, clinicianId: "c1" as ClinicianId, sessionDate: "2026-08-10", status: "booked", sentAt: "2026-08-10T09:00:00Z" },
    ],
    appointments: [
      { id: "apt-w266" as AppointmentId, practiceId: PRAC, clinicianId: "c1" as ClinicianId, startsAt: "2026-08-11T09:00:00+10:00", status: "attended", patientId: PATIENT, generatedByInvitation: true },
    ],
    auditEvents: [
      { practiceId: PRAC, kind: "invitation_booked", at: "2026-08-10T10:00:00Z", subjectId: PATIENT as string, detail: "" },
    ],
  };

  getComplaints().complaints.push({
    id: "cmp-w266",
    practiceId: PRAC as string,
    at: NOW,
    channel: "phone",
    summary: "Synthetic complaint for the W266 access sweep.",
    status: "open",
    severity: null,
    patientId: PATIENT as string,
    optOutApplied: false,
    optOutMatchedPatient: null,
    timeline: [],
    resolution: null,
  });

  addReferralDocuments([
    { referralId: "ref-w266", practiceId: PRAC, patientId: PATIENT, writtenAt: NOW } as unknown as Parameters<typeof addReferralDocuments>[0][number],
  ]);
  // A second row type, so the shared derivation is exercised rather than only the document scan.
  addAcceptanceActs([
    { referralId: "ref-w266-act", kind: "sent", practiceId: PRAC, patientId: PATIENT, at: NOW } as unknown as Parameters<typeof addAcceptanceActs>[0][number],
  ]);
}

describe("W266 every held or derived class has a stated disposition, both directions", () => {
  it("accounts for everything W106 says is held or derived", () => {
    const coverage = accessCoverage();
    expect(coverage.unaccounted, "a class an access request never decided about").toEqual([]);
    expect(coverage.stale, "a disposition for a class W106 no longer holds").toEqual([]);
    expect(accountableClasses().length, "nothing is accountable, so this checks nothing").toBeGreaterThan(10);
    expect(new Set(ACCESS_PATHS.map((p) => p.module)).size).toBe(ACCESS_PATHS.length);
  });

  it("argues every withholding rather than omitting it", () => {
    // "Not exported" and "nobody thought about it" are indistinguishable from outside, which is
    // the whole reason this register exists rather than a shorter list of what IS exported.
    for (const entry of ACCESS_PATHS) {
      if (entry.disposition.kind === "included") {
        expect(entry.disposition.field.length, `${entry.module} names no field`).toBeGreaterThan(3);
        expect(entry.disposition.how.length, `${entry.module} says nothing about how`).toBeGreaterThan(60);
      } else {
        expect(entry.disposition.why.length, `${entry.module} is omitted without an argument`).toBeGreaterThan(150);
      }
    }
    const derived = RECORD_CLASSES.filter((c) => c.handling === "derived").map((c) => c.module);
    expect(derived.length, "nothing is derived, so the withholding argument is untested").toBeGreaterThan(5);
    for (const module of derived) {
      const entry = ACCESS_PATHS.find((p) => p.module === module);
      expect(entry!.disposition.kind, `${module} is derived and exported`).toBe("withheld");
    }
  });
});

describe("W266 access and erasure agree about the same records", () => {
  it("finds no store erased without being disclosed, or disclosed without being erased", () => {
    // THE FINDING, AS A STANDING CHECK. Both directions are real failures with opposite
    // consequences: erased-not-disclosed means the practice deleted more than it ever admitted
    // holding; disclosed-not-erased means it told the patient about records their request would
    // not remove. Neither is visible from inside either function.
    const disagreements = accessErasureDisagreements();
    expect(disagreements.erasedNotDisclosed, "erasure clears a store the export never mentions").toEqual([]);
    expect(disagreements.disclosedNotErased, "the export carries a store erasure leaves behind").toEqual([]);
    expect(scrubbedModules().length, "erasure clears nothing, so the symmetry is vacuous").toBeGreaterThan(2);
  });

  it("would notice the gap this unit closed", () => {
    // The rigged control. Removing the referral rail's disposition reproduces the state the tree
    // was in from W137 until now — erased on request, never disclosed on one — and the check must
    // report it. Without this, "no disagreements" could mean the property holds or could mean the
    // comparison never had anything to compare.
    const withoutReferrals = ACCESS_PATHS.filter((p) => p.module !== "src/referrals/store.ts");
    expect(accessErasureDisagreements(withoutReferrals).erasedNotDisclosed).toEqual([
      "src/referrals/store.ts",
    ]);
  });

  it("exports the class erasure deliberately keeps, which is not a disagreement", () => {
    // `privacy/state.ts` is exported (the suppression flag) and deliberately never erased. The
    // check has to know the difference between that and a store erasure forgot, or it would force
    // one of the two registers to lie.
    const kept = ERASURE_PATHS.filter((p) => p.disposition.kind === "kept_deliberately");
    expect(kept.map((p) => p.module)).toEqual(["src/privacy/state.ts"]);
    expect(includedModules()).toContain("src/privacy/state.ts");
    expect(accessErasureDisagreements().disclosedNotErased).toEqual([]);
  });
});

describe("W266 the export is run, and every claimed field comes back", () => {
  beforeEach(() => {
    for (const reset of Object.values(STORE_RESETTERS)) reset();
  });

  it("returns nothing for a patient nobody holds anything about", () => {
    const empty = exportForPatient(PATIENT, NOW);
    expect(empty.held, "the export claims to hold records for an unseeded patient").toBe(false);
    expect(empty.referrals.documents).toEqual([]);
  });

  it("carries every store the register says it does, none of them empty", () => {
    // Non-vacuity first: an export over stores that hold nothing returns an empty payload, and
    // every "is it there" assertion below would be checking the same absence.
    seed();
    const held = exportForPatient(PATIENT, NOW);
    expect(held.held, "the seed did not reach the export").toBe(true);
    expect(held.invitations.length, "booking rail empty").toBeGreaterThan(0);
    expect(held.appointments.length, "no appointment exported").toBeGreaterThan(0);
    expect(held.auditEvents.length, "no audit event exported").toBeGreaterThan(0);
    expect(held.complaints.length, "complaints store empty").toBeGreaterThan(0);
    expect(held.referrals.documents.length, "THE W266 GAP: referrals absent from the export").toBeGreaterThan(0);
    expect(held.referrals.acts.length, "the shared derivation missed a row type").toBeGreaterThan(0);
  });

  it("makes `held` true from any store the export covers", () => {
    // A store added to the payload and left out of `held` returns records under a heading saying
    // nothing is held — the reverse of the gap this unit closed, and just as wrong.
    addReferralDocuments([
      { referralId: "ref-w266-only", practiceId: PRAC, patientId: PATIENT, writtenAt: NOW } as unknown as Parameters<typeof addReferralDocuments>[0][number],
    ]);
    const referralsOnly = exportForPatient(PATIENT, NOW);
    expect(referralsOnly.invitations).toEqual([]);
    expect(referralsOnly.complaints).toEqual([]);
    expect(referralsOnly.held, "records returned under a heading saying nothing is held").toBe(true);
  });

  it("tells the patient about exactly what erasure then removes", () => {
    // The two verbs, driven end to end against one patient. What the export named is gone, and
    // the export over the same patient afterwards holds nothing.
    seed();
    const before = exportForPatient(PATIENT, NOW);
    const referralsNamed =
      before.referrals.documents.length + before.referrals.acts.length;
    expect(referralsNamed).toBeGreaterThan(1);

    const record = deletePatientEverywhere(PATIENT, NOW);
    expect(record.removed.referrals, "the deletion record undercounts what access disclosed").toBe(
      before.referrals.documents.length,
    );

    const after = exportForPatient(PATIENT, NOW);
    expect(after.held, "records survive an erasure the export reported on").toBe(false);
    expect(after.referrals.documents).toEqual([]);
    expect(after.referrals.acts).toEqual([]);
  });

  it("shares one derivation between the two verbs", () => {
    // Two copies of "which referrals are this patient's" would let access and erasure disagree
    // about the same records, and the rail links a patient through four row types so there are
    // four chances to differ. One function, two callers, asserted rather than assumed.
    seed();
    const ids = referralIdsForPatient(PATIENT);
    const read = referralsForPatient(PATIENT);
    expect(ids.size).toBeGreaterThan(1);
    expect(new Set([...read.documents.map((d) => d.referralId), ...read.acts.map((a) => a.referralId)])).toEqual(
      ids,
    );
  });
});

// W272 verify gate, finding 1: the console's access export answers for the practice reading it.
//
// THE FIXTURE IS THE UNIT. W266's own test seeds ONE practice and asserts each field comes back
// non-empty, which is exactly right for the question it was asking and is why the cross-practice
// case was never exercised — the same shape as Y4-1, where a cross-tenant read survived two years
// because no test had two tenants. So everything here is seeded for TWO practices and one patient
// who is known to both, plus a third referral between two OTHER practices that the reader is not
// party to at all.
//
// The assertions come in pairs on purpose: for every "practice A does not see B's record" there is
// a "practice A does see its own", because a scoping bug that returned nothing would satisfy every
// exclusion in this file.

import { beforeEach, describe, expect, it } from "vitest";
import {
  REFUSED_SCOPING_SHAPES,
  SCOPED_EXPORT_NOTE,
  consoleExportFor,
} from "./console-export";
import { exportForPatient } from "./store";
import { getStore } from "@/booking/store";
import { getComplaints } from "@/complaints/store";
import { addReferralDocuments, addAcceptanceActs } from "@/referrals/store";
import { STORE_RESETTERS } from "@/lib/stores";
import type {
  AppointmentId,
  ClinicianId,
  InvitationId,
  PatientId,
  PracticeId,
} from "@/domain/types";

const NOW = "2026-08-13T23:30:00Z";
const MINE = "prac-1" as PracticeId;
const THEIRS = "prac-2" as PracticeId;
const ELSEWHERE_A = "prac-8" as PracticeId;
const ELSEWHERE_B = "prac-9" as PracticeId;
const PATIENT = "pat-w272-synthetic" as PatientId;

const invitation = (id: string, practiceId: PracticeId) => ({
  id: id as InvitationId,
  practiceId,
  patientId: PATIENT,
  clinicianId: "c1" as ClinicianId,
  sessionDate: "2026-08-10",
  status: "booked" as const,
  sentAt: "2026-08-10T09:00:00Z",
});

const appointment = (id: string, practiceId: PracticeId) => ({
  id: id as AppointmentId,
  practiceId,
  clinicianId: "c1" as ClinicianId,
  startsAt: "2026-08-11T09:00:00+10:00",
  status: "attended" as const,
  patientId: PATIENT,
  generatedByInvitation: true,
});

const complaint = (id: string, practiceId: PracticeId) => ({
  id,
  practiceId: practiceId as string,
  at: NOW,
  channel: "phone" as const,
  summary: "Synthetic complaint for the W272 scoping fixture.",
  status: "open" as const,
  severity: null,
  patientId: PATIENT as string,
  optOutApplied: false,
  optOutMatchedPatient: null,
  timeline: [],
  resolution: null,
});

const referral = (referralId: string, from: PracticeId, to: PracticeId) =>
  ({
    referralId,
    fromPracticeId: from,
    toPracticeId: to,
    patientId: PATIENT,
    createdAt: NOW,
    createdBy: "dr.author@demo.practice.example",
    narrative: {
      text: "Clinician-authored text, which is what makes an unscoped export a disclosure.",
      authoredBy: "dr.author@demo.practice.example",
    },
  }) as unknown as Parameters<typeof addReferralDocuments>[0][number];

beforeEach(() => {
  for (const reset of Object.values(STORE_RESETTERS)) reset();
  getStore().state = {
    invitations: [invitation("inv-mine", MINE), invitation("inv-theirs", THEIRS)],
    appointments: [appointment("apt-mine", MINE), appointment("apt-theirs", THEIRS)],
    auditEvents: [
      { practiceId: MINE, kind: "invitation_booked", at: NOW, subjectId: PATIENT as string, detail: "" },
      { practiceId: THEIRS, kind: "invitation_booked", at: NOW, subjectId: PATIENT as string, detail: "" },
    ],
  };
  getComplaints().complaints.push(complaint("cmp-mine", MINE), complaint("cmp-theirs", THEIRS));
  addReferralDocuments([
    // I sent one, I received one, and one is between two practices I am not party to.
    referral("ref-i-sent", MINE, THEIRS),
    referral("ref-i-received", THEIRS, MINE),
    referral("ref-not-mine", ELSEWHERE_A, ELSEWHERE_B),
  ]);
  addAcceptanceActs([
    { referralId: "ref-i-sent", kind: "accepted", byPracticeId: THEIRS, at: NOW, by: "them@x.example" } as unknown as Parameters<typeof addAcceptanceActs>[0][number],
    { referralId: "ref-not-mine", kind: "accepted", byPracticeId: ELSEWHERE_B, at: NOW, by: "other@x.example" } as unknown as Parameters<typeof addAcceptanceActs>[0][number],
  ]);
});

describe("W272 the fixture holds more than one practice, which is the whole point", () => {
  it("gives the unscoped export everything, so the exclusions below mean something", () => {
    // Non-vacuity for every assertion in this file. If the seed had not landed, an empty scoped
    // export would satisfy each "does not contain" check perfectly.
    const whole = exportForPatient(PATIENT, NOW);
    expect(whole.held).toBe(true);
    expect(whole.invitations).toHaveLength(2);
    expect(whole.appointments).toHaveLength(2);
    expect(whole.auditEvents).toHaveLength(2);
    expect(whole.complaints).toHaveLength(2);
    expect(whole.referrals.documents).toHaveLength(3);
    expect(whole.referrals.acts).toHaveLength(2);
  });
});

describe("W272 a practice sees its own records and no other practice's", () => {
  it("keeps every collection to the reading practice", () => {
    const mine = consoleExportFor(PATIENT, MINE, NOW);
    expect(mine.practiceId).toBe(MINE);
    expect(mine.invitations.map((i) => String(i.id))).toEqual(["inv-mine"]);
    expect(mine.appointments.map((a) => String(a.id))).toEqual(["apt-mine"]);
    expect(mine.auditEvents.every((e) => String(e.practiceId) === MINE)).toBe(true);
    expect(mine.complaints.map((c) => c.id)).toEqual(["cmp-mine"]);
  });

  it("shows a referral this practice is party to, sent OR received", () => {
    // Party, not author. Scoping to `fromPracticeId` would hide from the receiving practice the
    // document it is currently working from.
    const mine = consoleExportFor(PATIENT, MINE, NOW);
    expect(mine.referrals.documents.map((d) => d.referralId).sort()).toEqual([
      "ref-i-received",
      "ref-i-sent",
    ]);
  });

  it("withholds the referral between two other practices, narrative and all", () => {
    // THE FINDING. Before this unit the page rendered `JSON.stringify(exportForPatient(id))`, so an
    // operator at prac-1 read a GP at prac-8's free-text narrative about this patient.
    const mine = consoleExportFor(PATIENT, MINE, NOW);
    const serialised = JSON.stringify(mine);
    expect(mine.referrals.documents.map((d) => d.referralId)).not.toContain("ref-not-mine");
    expect(serialised).not.toContain(ELSEWHERE_A);
    expect(serialised).not.toContain(ELSEWHERE_B);
    // And the acts follow their document rather than being left behind.
    expect(mine.referrals.acts.map((a) => a.referralId)).toEqual(["ref-i-sent"]);
  });

  it("names no other practice anywhere in the payload", () => {
    // The whole serialised body, not the stamp alone — Y4-1's shape was a correct-looking envelope
    // over another practice's rows. `prac-2` is legitimately present, because this practice is
    // party to referrals with it; `prac-8` and `prac-9` must not be.
    const serialised = JSON.stringify(consoleExportFor(PATIENT, MINE, NOW));
    const named = new Set(serialised.match(/\bprac-\d+\b/g) ?? []);
    expect([...named].sort()).toEqual(["prac-1", "prac-2"]);
  });

  it("answers differently for the other practice, from the same stores", () => {
    // A scoping that ignored its argument would return the same thing for both.
    const mine = consoleExportFor(PATIENT, MINE, NOW);
    const theirs = consoleExportFor(PATIENT, THEIRS, NOW);
    expect(theirs.invitations.map((i) => String(i.id))).toEqual(["inv-theirs"]);
    expect(theirs.complaints.map((c) => c.id)).toEqual(["cmp-theirs"]);
    expect(JSON.stringify(theirs)).not.toEqual(JSON.stringify(mine));
  });

  it("is a subset of the unscoped export, never something new", () => {
    // The narrowing is built by filtering the product's answer, so this is structural rather than
    // hopeful — and it is what stops the scoped export becoming a second derivation that drifts.
    const whole = exportForPatient(PATIENT, NOW);
    const mine = consoleExportFor(PATIENT, MINE, NOW);
    const wholeIds = new Set(whole.referrals.documents.map((d) => d.referralId));
    for (const document of mine.referrals.documents) {
      expect(wholeIds).toContain(document.referralId);
    }
    expect(mine.invitations.length).toBeLessThanOrEqual(whole.invitations.length);
    expect(mine.complaints.length).toBeLessThanOrEqual(whole.complaints.length);
  });
});

describe("W272 `held` describes what this practice holds", () => {
  it("is true when this practice holds something", () => {
    expect(consoleExportFor(PATIENT, MINE, NOW).held).toBe(true);
  });

  it("is FALSE for a practice holding nothing, even though the product holds plenty", () => {
    // The inverse of the defect W266 fixed. Carrying the unscoped `held` across would print
    // "records are held" above an empty document, which is a worse lie than the one it replaced.
    const stranger = consoleExportFor(PATIENT, "prac-99" as PracticeId, NOW);
    expect(exportForPatient(PATIENT, NOW).held, "the product holds nothing, so this proves nothing").toBe(
      true,
    );
    expect(stranger.held).toBe(false);
    expect(stranger.invitations).toEqual([]);
    expect(stranger.referrals.documents).toEqual([]);
  });

  it("becomes true on referrals alone", () => {
    // A practice party only to a referral still holds something, and a `held` derived from the
    // rail collections alone would say it does not.
    for (const reset of Object.values(STORE_RESETTERS)) reset();
    addReferralDocuments([referral("ref-only", MINE, THEIRS)]);
    const mine = consoleExportFor(PATIENT, MINE, NOW);
    expect(mine.invitations).toEqual([]);
    expect(mine.held).toBe(true);
  });
});

describe("W272 the narrowing is stated, and the count is not", () => {
  it("says what is not shown without saying how much", () => {
    // The one place in this tree where silently narrowing is the fix rather than the defect: the
    // count would disclose that the patient is known to another practice.
    expect(SCOPED_EXPORT_NOTE).toContain("not shown here");
    expect(SCOPED_EXPORT_NOTE).toContain("not counted");
    expect(SCOPED_EXPORT_NOTE).not.toMatch(/\d/);
  });

  it("puts no count of withheld records on the payload", () => {
    const keys = Object.keys(consoleExportFor(PATIENT, MINE, NOW));
    for (const forbidden of ["withheld", "elsewhere", "otherPractices", "hiddenCount", "omitted"]) {
      expect(keys, `the export counts what it withheld via ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("names the six shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_SCOPING_SHAPES).sort()).toEqual([
      "carrying_held_across",
      "counting_what_was_withheld",
      "fixing_it_in_the_page",
      "re_reading_every_store_with_a_practice",
      "scoping_by_author",
      "scoping_the_unscoped_export",
    ]);
    for (const [name, why] of Object.entries(REFUSED_SCOPING_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_SCOPING_SHAPES.scoping_the_unscoped_export).toContain("W266");
  });
});

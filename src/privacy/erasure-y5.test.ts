// W265 verify gate: "every `stored` class in W106 is reached by the scrub, checked in both
// directions; a class added without a scrub path fails."
//
// The both-directions check is the cheap half. The half with teeth is that the scrub is RUN: a
// register naming `scrubPatientFromComplaints` and never calling it is a register of names, and
// names are what this tree had when the same defect was found twice. So a synthetic patient is
// seeded into every store that can hold one, `deletePatientEverywhere` is called for real, and
// every store W51's registry knows about is swept for the identifier.
//
// AND THE SWEEP IS PROVED NON-VACUOUS BEFORE IT IS TRUSTED. A sweep over stores that never held
// the patient returns clean, which is the exact shape of the failure it exists to catch — so the
// identifier must be FOUND first, in each store, or the test fails for that reason instead.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { adoptedModuleNames } from "@/quality/unit-headers";
import {
  ERASURE_PATHS,
  captureStores,
  erasureCoverage,
  residualHits,
  scrubbedModules,
} from "./erasure-y5";
import { RECORD_CLASSES, storedClasses } from "./record-classes";
import { deletePatientEverywhere } from "./store";
import { getPrivacy } from "./state";
import { patientRef } from "./privacy";
import { getStore } from "@/booking/store";
import { getComplaints } from "@/complaints/store";
import { addReferralDocuments } from "@/referrals/store";
import { STORE_RESETTERS } from "@/lib/stores";
import type {
  AppointmentId,
  ClinicianId,
  InvitationId,
  PatientId,
  PracticeId,
} from "@/domain/types";

const SRC = path.join(__dirname, "..");
const NOW = "2026-08-13T22:00:00Z";
const PRAC = "prac-1" as PracticeId;
/** Obviously synthetic, and distinctive enough that a substring sweep cannot match by accident. */
const PATIENT = "pat-w265-synthetic" as PatientId;
const OTHER = "pat-w265-untouched" as PatientId;

/** Seed the three stores the scrub is required to clear, through their own writers. */
function seed(): void {
  const rail = getStore();
  rail.state = {
    invitations: [
      { id: "inv-w265" as InvitationId, practiceId: PRAC, patientId: PATIENT, clinicianId: "c1" as ClinicianId, sessionDate: "2026-08-10", status: "booked", sentAt: "2026-08-10T09:00:00Z" },
      { id: "inv-w265-b" as InvitationId, practiceId: PRAC, patientId: OTHER, clinicianId: "c1" as ClinicianId, sessionDate: "2026-08-10", status: "sent", sentAt: "2026-08-10T09:00:00Z" },
    ],
    appointments: [
      { id: "apt-w265" as AppointmentId, practiceId: PRAC, clinicianId: "c1" as ClinicianId, startsAt: "2026-08-11T09:00:00+10:00", status: "attended", patientId: PATIENT, generatedByInvitation: true },
    ],
    auditEvents: [
      { practiceId: PRAC, kind: "invitation_booked", at: "2026-08-10T10:00:00Z", subjectId: PATIENT as string, detail: "" },
    ],
  };

  getComplaints().complaints.push({
    id: "cmp-w265",
    practiceId: PRAC as string,
    at: NOW,
    channel: "phone",
    summary: "Synthetic complaint for the W265 erasure sweep.",
    status: "open",
    severity: null,
    patientId: PATIENT as string,
    optOutApplied: false,
    optOutMatchedPatient: null,
    timeline: [],
    resolution: null,
  });

  addReferralDocuments([
    {
      id: "ref-w265",
      practiceId: PRAC,
      patientId: PATIENT,
      writtenAt: NOW,
    } as unknown as Parameters<typeof addReferralDocuments>[0][number],
  ]);
}

describe("W265 every stored class has a stated disposition, both directions", () => {
  it("covers W106's stored classes and declares none it no longer stores", () => {
    const coverage = erasureCoverage();
    expect(coverage.unreached, "a stored class erasure may not reach").toEqual([]);
    expect(coverage.stale, "a disposition for a class W106 no longer stores").toEqual([]);
    expect(storedClasses().length, "nothing is stored, so this checks nothing").toBeGreaterThan(3);
    expect(new Set(ERASURE_PATHS.map((p) => p.module)).size).toBe(ERASURE_PATHS.length);
  });

  it("says why, at length, for anything the scrub does not clear", () => {
    // The two non-scrubbed dispositions are the ones a reader will challenge, so they carry the
    // argument rather than a label. A one-word exemption is how a store stops being erased.
    for (const entry of ERASURE_PATHS) {
      if (entry.disposition.kind === "scrubbed") {
        expect(entry.disposition.how.length, `${entry.module} names no scrub step`).toBeGreaterThan(60);
      } else {
        expect(entry.disposition.why.length, `${entry.module} is exempted without an argument`).toBeGreaterThan(150);
      }
    }
    expect(ERASURE_PATHS.filter((p) => p.disposition.kind === "kept_deliberately")).toHaveLength(1);
    expect(ERASURE_PATHS.filter((p) => p.disposition.kind === "different_subject")).toHaveLength(1);
    expect(scrubbedModules()).toEqual([
      "src/booking/store.ts",
      "src/complaints/store.ts",
      "src/referrals/store.ts",
    ]);
  });

  it("finds that Year 5 added no stored class, rather than assuming it", () => {
    // A re-derivation reporting "unchanged" is the one to be suspicious of, so the claim is read
    // off the tree: every Y5-or-later module that W106 classifies, and what it classifies it as.
    //
    // W281 SUBTRACTED THE ADOPTED MODULES, and finding out why is worth more than the subtraction.
    // This derivation reads a header to answer "when did this module ARRIVE". W281 gave headers to
    // eleven modules that had none, four of which were written outside the unit loop in 2026 and
    // so carry the unit that ADOPTED them. `src/interest/store.ts` is `stored`, and it turned this
    // red as a Year-5 arrival — a module four years old, unchanged, that had simply become
    // legible. A header names the owning unit; it is not a date of birth.
    const adopted = adoptedModuleNames();
    const y5Classified = RECORD_CLASSES.filter((c) => {
      if (adopted.has(c.module)) return false;
      const full = path.join(SRC, "..", c.module);
      const header = readFileSync(full, "utf8").split("\n")[0]?.match(/^\/\/ W(\d+)/);
      return header ? Number(header[1]) >= 209 : false;
    });
    expect(y5Classified.length, "no Y5 module is classified, so this proves nothing").toBeGreaterThan(3);
    expect(
      y5Classified.filter((c) => c.handling === "stored").map((c) => c.module),
      "a Y5 module stores patient identity and erasure has no path to it",
    ).toEqual([]);
  });
});

describe("W265 the scrub is run, and the whole store surface is swept", () => {
  beforeEach(() => {
    for (const reset of Object.values(STORE_RESETTERS)) reset();
  });

  it("sweeps each stored class through the resetter its register names", () => {
    // Every path the scrub must clear has to be READABLE by the sweep, and that requirement is
    // what found this unit's defect: `resetReferralRail` returned `void`, so the store W137 added
    // to `deletePatientEverywhere` — added precisely because a store erasure does not reach is a
    // store the console reports as clean — was the one store the whole-surface sweep could not
    // see. Erasure was not broken. It was unverifiable from outside, which is the condition under
    // which both previous erasure defects survived.
    const { live, unreadable } = captureStores();
    for (const entry of ERASURE_PATHS) {
      if (entry.disposition.kind === "different_subject") {
        expect(entry.sweptVia, `${entry.module} is swept and should not be`).toBeNull();
        continue;
      }
      expect(entry.sweptVia, `${entry.module} names no resetter to be read through`).not.toBeNull();
      expect(unreadable, `${entry.module} is stored and cannot be swept`).not.toContain(entry.sweptVia);
      expect(Object.keys(live), `${entry.sweptVia} is not a store W51 registers`).toContain(entry.sweptVia);
    }
  });

  it("finds the patient in every store the scrub must clear, BEFORE erasing", () => {
    // The non-vacuity guard, and it is the whole reason the sweep below means anything: a sweep
    // over stores that never held the patient returns clean, which is the exact failure shape it
    // exists to catch. W51's and W137's findings both looked like this from the outside.
    const { live } = captureStores();
    seed();
    const before = residualHits(PATIENT, live);
    for (const entry of ERASURE_PATHS) {
      if (entry.disposition.kind !== "scrubbed") continue;
      expect(before, `${entry.module} never held the patient, so erasing it proves nothing`).toContain(
        entry.sweptVia,
      );
    }
  });

  it("leaves the identifier in no store W51's registry knows about", () => {
    // THE PROPERTY, in the only form a console can honestly claim: not "the complaints store is
    // clean" and not "the referral rail is clean", but that the identifier is gone from the whole
    // set of stores. Composed from W51's registry, which is checked against the source tree — so a
    // store added without registering breaks that suite rather than quietly escaping this one.
    const { live } = captureStores();
    expect(Object.keys(live).length, "no store could be read, so the sweep is empty").toBeGreaterThan(8);
    seed();
    expect(
      residualHits(PATIENT, live).length,
      "the seed did not reach the captured stores",
    ).toBeGreaterThan(0);

    deletePatientEverywhere(PATIENT, NOW);

    expect(
      residualHits(PATIENT, live),
      "the identifier survived an erasure the console reports as complete",
    ).toEqual([]);
  });

  it("keeps the deletion record and the suppression, and neither holds the identifier", () => {
    seed();
    deletePatientEverywhere(PATIENT, NOW);
    const privacy = getPrivacy();
    expect(privacy.deletions.length, "no deletion record was kept").toBe(1);
    expect(privacy.suppressions.length, "no suppression was kept").toBe(1);
    // Kept deliberately — and safe to keep only because both hold a one-way ref, never the id.
    expect(privacy.deletions[0]!.ref).toBe(patientRef(PATIENT));
    expect(JSON.stringify(privacy.deletions)).not.toContain(PATIENT);
    expect(JSON.stringify(privacy.suppressions)).not.toContain(PATIENT);
  });

  it("erases one patient and not the one beside them", () => {
    seed();
    deletePatientEverywhere(PATIENT, NOW);
    expect(JSON.stringify(getStore().state), "the other patient was erased too").toContain(OTHER);
  });
});

describe("W265 the second erasure path, on a different subject", () => {
  it("is keyed on an email rather than a patient, and the tree says so", () => {
    // Two erasure paths on two identities. Nothing said so anywhere before this register, and an
    // unwritten distinction between two collections of personal information is how one of them
    // ends up handled like the other.
    const entry = ERASURE_PATHS.find((p) => p.module === "src/interest/store.ts");
    expect(entry!.disposition.kind).toBe("different_subject");
    const source = readFileSync(path.join(SRC, "interest/store.ts"), "utf8");
    expect(source, "the interest store's erasure is no longer keyed on an email").toContain(
      "eraseInterestSignups(email: string",
    );
    expect(source, "the interest store now takes a patient id").not.toMatch(/\bpatientId\b/);
  });
});

describe("W265 the register is reachable from the registers that own its facts", () => {
  it("names only modules W106 declares, spelled the way W106 spells them", () => {
    const known = new Set(RECORD_CLASSES.map((c) => c.module));
    for (const entry of ERASURE_PATHS) {
      expect(known, `${entry.module} is not a record class`).toContain(entry.module);
    }
  });

  it("sweeps every store the tree exports a resetter for", () => {
    // W51's registry is checked against the source by `stores.test.ts`; this asserts the sweep
    // composes THAT rather than a second list, so the two cannot drift apart.
    const exported = new Set<string>();
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) {
          for (const m of readFileSync(full, "utf8").matchAll(/^export function (reset[A-Za-z0-9_]*)\s*\(/gm)) {
            exported.add(m[1]!);
          }
        }
      }
    };
    walk(SRC);
    expect(exported.size).toBeGreaterThan(10);
    // `resetAllStores` is the registry's own front door rather than a store — W51 exports it from
    // the same module and `stores.test.ts` excludes it for the same reason.
    expect([...exported].filter((n) => n !== "resetAllStores" && !(n in STORE_RESETTERS))).toEqual([]);
  });
});

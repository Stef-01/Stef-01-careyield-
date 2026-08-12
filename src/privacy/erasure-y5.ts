// W265: erasure at five years — every stored record class, and how the scrub reaches it.
//
// Erasure is the one control in this tree that has been found broken twice, by two people, two
// years apart, each time by somebody NOTICING. W51 found the complaints store surviving a
// "delete everywhere"; W137 found the GP-to-GP rail doing the same. Both are fixed, both wrote the
// same sentence into `deletePatientEverywhere` — *a store that erasure does not reach is a store
// the console reports as clean while a raw patientId survives in it* — and neither left behind
// anything that would catch the third one.
//
// WHAT WAS ACTUALLY MISSING IS NOT A SCRUB. It is the property. Erasure is tested store by store,
// by whoever wrote each store: `privacy.test.ts` checks the deletion record carries no raw id,
// `workflow.test.ts` checks the complaints store. Each is a good test of one store. **Nothing
// asserts that after an erasure the identifier is gone from the WHOLE set of stores**, which is
// the only form of the claim a console can honestly make — and it is exactly the form that would
// have caught W51's and W137's findings without anybody noticing anything.
//
// So this unit composes rather than adds: W51's `STORE_RESETTERS` already enumerates every
// in-memory store in the tree, checked against the source so a store added without registering
// breaks the suite. Each resetter returns the live state object it installs. Capture those, seed a
// synthetic patient, run the real `deletePatientEverywhere`, and sweep every captured store for
// the identifier. The registry that exists to stop a store being forgotten by the demo launcher
// turns out to be exactly the registry needed to stop one being forgotten by erasure.
//
// THREE DISPOSITIONS, BECAUSE "REACHED BY THE SCRUB" IS NOT THE ONLY CORRECT ANSWER and a register
// with one answer would force two lies:
//
//   `src/privacy/state.ts` is `stored` and is DELIBERATELY NOT ERASED. It holds the deletion
//   records and the suppression list, and W106's own rationale says why: a deletion record must
//   prove a deletion happened and a suppression must outlive the data it protects. Erasing them
//   would defeat both. It keeps a one-way `patientRef`, never the identifier.
//
//   `src/interest/store.ts` is `stored` and is keyed on a DIFFERENT SUBJECT. The people in it are
//   not patients of any subscribing practice; erasure there is `eraseInterestSignups(email)`. So
//   this tree has TWO erasure paths on two identities, and nothing said so anywhere — an unwritten
//   distinction between two collections of personal information is how one ends up handled like
//   the other.
//
// WHAT THE Y5 RE-DERIVATION FOUND, stated because a re-derivation reporting "unchanged" is the one
// to be suspicious of: **the scrub's job did not grow in Year 5.** Y5 added thirty-seven modules
// and not one new `stored` class — every capacity, interop, API and vertical module was built to
// hold no patient identity, and W106 classified each as it landed. That is a real answer rather
// than an absence of work, and it is checked here rather than asserted, so the day a Y5-or-later
// module does store patient identity this fails until somebody gives it a scrub path.
//
// FOUNDER GATE (plan §4): synthetic only. The sweep seeds an obviously-synthetic identifier into
// in-memory stores and erases it; no real patient data exists anywhere in this tree.

import { STORE_RESETTERS } from "@/lib/stores";
import { storedClasses, type RecordClass } from "./record-classes";

export type ErasureDisposition =
  /** `deletePatientEverywhere` reaches it. `how` names the composition step. */
  | { kind: "scrubbed"; how: string }
  /** Erasing it would defeat erasure itself. */
  | { kind: "kept_deliberately"; why: string }
  /** Not keyed on a patient at all — a different collection with its own erasure path. */
  | { kind: "different_subject"; why: string };

export interface ErasurePath {
  /** The module, as W106 spells it. Checked against `storedClasses()` in both directions. */
  module: string;
  disposition: ErasureDisposition;
  /**
   * The key in W51's `STORE_RESETTERS` through which the whole-surface sweep reads this store,
   * or `null` where it is not an in-memory store at all.
   *
   * Required for anything the scrub must clear, and that requirement is what found this unit's
   * defect: `resetReferralRail` returned `void`, so the store W137 added to erasure was the one
   * store the sweep could not see.
   */
  sweptVia: string | null;
}

export const ERASURE_PATHS: readonly ErasurePath[] = [
  {
    module: "src/booking/store.ts",
    sweptVia: "resetStore",
    disposition: {
      kind: "scrubbed",
      how: "`deletePatientEverywhere` runs W33's `deletePatient` over the rail dataset: invitations and their audit events are removed outright, and an attended appointment loses its patient link so the slot's history survives the person's records.",
    },
  },
  {
    module: "src/complaints/store.ts",
    sweptVia: "resetComplaints",
    disposition: {
      kind: "scrubbed",
      how: "`scrubPatientFromComplaints`, composed into `deletePatientEverywhere` at W51 — the first store found surviving a deletion the console reported as complete.",
    },
  },
  {
    module: "src/referrals/store.ts",
    sweptVia: "resetReferralRail",
    disposition: {
      kind: "scrubbed",
      how: "`scrubPatientFromReferrals`, composed at W137 for the same reason as complaints: the GP-to-GP rail holds patient-linked records on both sides of a handover, so 'everywhere' has to include the referrals another practice was sent.",
    },
  },
  {
    module: "src/privacy/state.ts",
    sweptVia: "resetPrivacy",
    disposition: {
      kind: "kept_deliberately",
      why: "It holds the deletion records and the suppression list, and both must outlive the data they are about: a deletion record proves a deletion happened, and a suppression must outlive the data it protects, or a re-import silently re-enables contact. Both hold a one-way `patientRef` rather than an identifier, which is what makes keeping them safe — and this unit asserts the identifier itself is absent from them.",
    },
  },
  {
    module: "src/interest/store.ts",
    // File-backed JSONL rather than an in-memory store, so W51's registry does not know it.
    sweptVia: null,
    disposition: {
      kind: "different_subject",
      why: "Community interest signups: a name and an email for somebody who asked to hear about Meherr, who is not a patient of any subscribing practice. `deletePatientEverywhere(patientId)` cannot reach it and should not — its own erasure is `eraseInterestSignups(email)`, keyed on a different identity. This tree has two erasure paths on two subjects, and until this register nothing said so.",
    },
  },
];

export interface ErasureCoverage {
  /** Stored classes with no declared erasure path — a store erasure may not reach. */
  unreached: string[];
  /** Declared paths for modules W106 no longer stores — a register describing code that moved. */
  stale: string[];
}

/** Both directions, W102's shape. A `stored` class added tomorrow fails until it is dispositioned. */
export function erasureCoverage(
  stored: readonly RecordClass[] = storedClasses(),
  declared: readonly ErasurePath[] = ERASURE_PATHS,
): ErasureCoverage {
  const declaredModules = new Set(declared.map((p) => p.module));
  const storedModules = new Set(stored.map((c) => c.module));
  return {
    unreached: [...storedModules].filter((m) => !declaredModules.has(m)).sort(),
    stale: [...declaredModules].filter((m) => !storedModules.has(m)).sort(),
  };
}

/** The modules erasure is required to clear. */
export function scrubbedModules(declared: readonly ErasurePath[] = ERASURE_PATHS): string[] {
  return declared.filter((p) => p.disposition.kind === "scrubbed").map((p) => p.module).sort();
}

/**
 * Every in-memory store, by the name W51's registry knows it under, reset and captured live.
 *
 * Composed rather than restated: `STORE_RESETTERS` is checked against the source tree, so a store
 * added without registering breaks that suite — which means it cannot be missing from this sweep
 * either. A resetter returning nothing is reported rather than skipped silently; a store this
 * cannot read is a store this cannot clear, and the caller has to know which.
 */
export function captureStores(): { live: Record<string, unknown>; unreadable: string[] } {
  const live: Record<string, unknown> = {};
  const unreadable: string[] = [];
  for (const [name, reset] of Object.entries(STORE_RESETTERS)) {
    const state = reset();
    if (state && typeof state === "object") live[name] = state;
    else unreadable.push(name);
  }
  return { live, unreadable };
}

/**
 * Which captured stores still contain the identifier.
 *
 * A whole-surface sweep rather than a per-store check, because per-store is what this tree already
 * had when the same defect was found twice. Serialisation is the right depth: a raw identifier
 * anywhere in a store's state — a key, a nested field, an audit detail string — is a survival.
 */
export function residualHits(identifier: string, stores: Record<string, unknown>): string[] {
  return Object.entries(stores)
    .filter(([, state]) => {
      try {
        return JSON.stringify(state)?.includes(identifier) ?? false;
      } catch {
        // A store that cannot be serialised cannot be swept, and saying so beats reporting clean.
        return true;
      }
    })
    .map(([name]) => name)
    .sort();
}

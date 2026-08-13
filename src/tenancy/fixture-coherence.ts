// W276: does the demo fixture belong to a practice anybody can sign in as?
//
// W272 found that it did not. `SEED_PRACTICE_ID` was `prac-demo` while the console mints `prac-1`
// for the first practice onboarded — so every practice-scoped console page read an empty rail, and
// **the one page that showed the seeded data was the privacy export, because it was the only
// unscoped one**. The incoherence and the cross-tenant defect were holding each other up: the
// export looked like it worked, and the fixture looked like it was wired.
//
// W280 then found the same shape from the other side. `sessionAppointmentType` matched a clinician
// id with no practice in the query, and its only defence was that the seeded rail held one
// practice's sessions. Both units end at the same sentence: **a property of the fixture was doing
// the work of a property of the code**, and nothing checked the fixture.
//
// So this checks it, and the rule is the one both findings imply: EVERY PRACTICE ID A SEEDED STORE
// HOLDS MUST BE ONE THE CONSOLE WOULD MINT. Not "looks plausible" and not "is in a constant
// somewhere" — the mintable set is obtained by onboarding practices into a fresh console and
// reading back the ids it assigns, so the comparison is against the thing that actually decides.
//
// THE IDS ARE READ BY RUNNING THE STORES, NOT BY GREPPING THEM, and the difference is not
// theoretical: `src/audit/store.ts` and `src/complaints/store.ts` both contain the string
// `"prac-console"` in comments ABOUT the defect W206 removed. A source scan reports two stores
// seeded under an id no console can mint, and both reports are wrong.
//
// AND SIX STORES CANNOT BE CHECKED AT ALL, WHICH IS THIS UNIT'S FINDING. Ten of W51's sixteen
// resetters hand back the state they install; six return `void`, so nothing outside them can see
// what they seeded. They are not clean — they are UNREADABLE, and a register that listed them as
// holding no practice identity would be reporting an absence of evidence as evidence of absence.
// W265 hit the same wall from the erasure side and changed one resetter's return type to get past
// it. Each of the six carries the same one-line remedy here.
//
// FOUNDER GATE (plan §4): synthetic only. Onboarding writes two practices into the console store,
// which `mintableIds` resets before and the caller resets after — stated on the function, because
// an exported helper with an undocumented effect on shared state is W221's finding.

import { onboardPractice, practiceRecord, resetConsole } from "@/console/store";
import { STORE_RESETTERS } from "@/lib/stores";
import type { PracticeId } from "@/domain/types";

/** How much of a store's seeded state is visible from outside it. */
export type Readability =
  /** The resetter hands back the state it installed, so its practice ids can be read. */
  | { kind: "readable" }
  /**
   * The resetter returns `void`. Nothing outside the module can see what it seeded, so this
   * register cannot say whether its fixture is coherent — only that nobody can tell.
   */
  | { kind: "opaque"; remedy: string };

export interface SeededStore {
  /** The key W51's registry holds it under. */
  resetter: string;
  module: string;
  readability: Readability;
  /** What this store seeds, and whether a practice is part of it. */
  note: string;
}

/** The one-line change that makes a store's fixture checkable. Same sentence for the same gap. */
const RETURN_THE_STATE =
  "Return the state the resetter installs, as ten of W51's sixteen already do and as W265 changed `resetReferralRail` to do for the erasure sweep. It is a one-line change and it is the only thing standing between this store and being checkable from outside.";

/**
 * Every store W51 resets, and whether its seeded practice identity can be read.
 *
 * Checked against `STORE_RESETTERS` in both directions: a resetter with no entry here is a store
 * nobody has classified, and an entry naming a resetter W51 no longer has is stale.
 */
export const SEEDED_STORES: readonly SeededStore[] = [
  {
    resetter: "resetAudit",
    module: "src/audit/store.ts",
    readability: { kind: "readable" },
    note: "Seeds attended appointments under `AUDIT_SEED_PRACTICE_ID`. Holds practice identity, and it is the identity the console mints.",
  },
  {
    resetter: "resetStore",
    module: "src/booking/store.ts",
    readability: { kind: "readable" },
    note: "The synthetic rail: invitations and appointments under `SEED_PRACTICE_ID`. This is the store W272 found seeded under a practice no session could act for.",
  },
  {
    resetter: "resetCapability",
    module: "src/capability/store.ts",
    readability: { kind: "readable" },
    note: "Resets to empty. Statements are written by a console session, so a seeded one would be a claim nobody made.",
  },
  {
    resetter: "resetInterestState",
    module: "src/capability/store.ts",
    readability: { kind: "readable" },
    note: "Resets to empty. Interest signups are keyed on the email somebody gave, not on a practice.",
  },
  {
    resetter: "resetComplaints",
    module: "src/complaints/store.ts",
    readability: { kind: "readable" },
    note: "Resets to empty. The `prac-1` in this module is an argument default at intake, not a seed — which is why this register reads the store rather than its source.",
  },
  {
    resetter: "resetConsole",
    module: "src/console/store.ts",
    readability: { kind: "readable" },
    note: "Resets to zero practices, which is the state a fresh install is in. It is also the authority this register compares against: onboarding is what mints an id.",
  },
  {
    resetter: "resetOps",
    module: "src/ops/store.ts",
    readability: { kind: "readable" },
    note: "Resets to empty. Pauses and feed evidence are recorded against a practice that already exists.",
  },
  {
    resetter: "resetPrivacy",
    module: "src/privacy/state.ts",
    readability: { kind: "readable" },
    note: "Resets to empty suppressions and deletion records, both keyed by a hashed patient reference rather than by a practice.",
  },
  {
    resetter: "resetReferralRail",
    module: "src/referrals/store.ts",
    readability: { kind: "readable" },
    note: "Resets to empty. W265 changed this resetter's return type from `void` for exactly the reason this register exists — it was the one store an erasure sweep could not see.",
  },
  {
    resetter: "resetRegisters",
    module: "src/registers/store.ts",
    readability: { kind: "readable" },
    note: "Seeds guideline register content, which is clinical material with no practice attached — the same content for every practice, by design.",
  },
  {
    resetter: "resetEducation",
    module: "src/education/store.ts",
    readability: { kind: "opaque", remedy: RETURN_THE_STATE },
    note: "Unreadable from outside. Education items are curated per practice, so this is the opaque store most likely to hold a practice id.",
  },
  {
    resetter: "resetVerticals",
    module: "src/verticals/store.ts",
    readability: { kind: "opaque", remedy: RETURN_THE_STATE },
    note: "Unreadable from outside. Vertical assemblies are bound to practices by W160, so a seeded binding would carry one.",
  },
  {
    resetter: "resetLedger",
    module: "src/credentials/ledger.ts",
    readability: { kind: "opaque", remedy: RETURN_THE_STATE },
    note: "Unreadable from outside. Credential verification events name the practice that recorded them.",
  },
  {
    resetter: "resetVault",
    module: "src/credentials/vault.ts",
    readability: { kind: "opaque", remedy: RETURN_THE_STATE },
    note: "Unreadable from outside. Evidence documents are held for a clinician at a practice, and W109 isolates them for that reason.",
  },
  {
    resetter: "resetRateLimits",
    module: "src/lib/rate-limit.ts",
    readability: { kind: "opaque", remedy: RETURN_THE_STATE },
    note: "Unreadable from outside. Counters are keyed by request identity rather than by practice, so this is the opaque store least likely to hold one — least likely is not the same as checked.",
  },
  {
    resetter: "resetPathwayRegistry",
    module: "src/pathways/registry.ts",
    readability: { kind: "opaque", remedy: RETURN_THE_STATE },
    note: "Unreadable from outside. It seeds from `SHIPPED_PATHWAYS`, which is empty and pinned empty under G5 — so this one is argued rather than observed, and the argument is a different unit's.",
  },
];

/** Both spellings the tree uses, matching W277's detector rather than inventing a third. */
const PRACTICE_ID = /"(prac(?:tice)?-[A-Za-z0-9_-]+)"/g;

/**
 * The practice ids each readable store holds after a reset.
 *
 * SIDE EFFECT, STATED: this RUNS every resetter, so every in-memory store is left in its seeded
 * state. That is what reading a fixture costs, and W221's finding is that the cost belongs on the
 * function rather than in whoever discovers it.
 */
export function seededPractices(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const entry of SEEDED_STORES) {
    const reset = STORE_RESETTERS[entry.resetter];
    if (!reset) continue;
    const state = reset();
    if (state === undefined) continue; // opaque; reported separately rather than as empty
    const ids = [...new Set([...JSON.stringify(state).matchAll(PRACTICE_ID)].map((m) => m[1]!))];
    out.set(entry.resetter, ids.sort());
  }
  return out;
}

/**
 * The ids the console actually assigns, obtained by onboarding rather than by reading a constant.
 *
 * SIDE EFFECT, STATED: resets the console store and onboards `count` synthetic practices into it.
 * The caller resets afterwards — the test does, and it is the only caller.
 */
export function mintableIds(count: number, todayIso: string): string[] {
  resetConsole();
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const refusals = onboardPractice(
      { name: `Coherence Probe ${i + 1}`, timezone: "Australia/Sydney", holdoutPercent: 10 },
      todayIso,
      `probe-${i + 1}@demo.practice.example`,
    );
    if (Object.keys(refusals).length > 0) break;
    const record = practiceRecord(`prac-${i + 1}` as PracticeId);
    if (record) ids.push(String(record.practice.id));
  }
  return ids;
}

export interface CoherenceViolations {
  /** A store seeded under a practice id the console would never mint. */
  incoherent: Array<{ resetter: string; practiceId: string }>;
  /** A W51 resetter this register does not classify. */
  undeclared: string[];
  /** An entry naming a resetter W51 no longer holds. */
  stale: string[];
  /** An opaque store whose entry states no remedy. */
  opaqueWithoutRemedy: string[];
}

/**
 * Every disagreement, in both directions.
 *
 * PURE, and taking the seeded ids as an argument rather than reading them, so the check can be
 * driven against a deliberately incoherent fixture without touching the tree's own stores. The
 * gate asks for exactly that proof, and a checker that could only be pointed at a healthy tree
 * could not supply it.
 */
export function coherenceViolations(
  seeded: ReadonlyMap<string, readonly string[]>,
  mintable: readonly string[],
  declared: readonly SeededStore[] = SEEDED_STORES,
  resetterNames: readonly string[] = Object.keys(STORE_RESETTERS),
): CoherenceViolations {
  const mintableSet = new Set(mintable);
  const declaredNames = new Set(declared.map((d) => d.resetter));

  const incoherent: CoherenceViolations["incoherent"] = [];
  for (const [resetter, ids] of seeded) {
    for (const practiceId of ids) {
      if (!mintableSet.has(practiceId)) incoherent.push({ resetter, practiceId });
    }
  }

  return {
    incoherent: incoherent.sort((a, b) => a.resetter.localeCompare(b.resetter)),
    undeclared: resetterNames.filter((n) => !declaredNames.has(n)).sort(),
    stale: declared.map((d) => d.resetter).filter((n) => !resetterNames.includes(n)).sort(),
    opaqueWithoutRemedy: declared
      .filter((d) => d.readability.kind === "opaque" && d.readability.remedy.trim().length < 40)
      .map((d) => d.resetter)
      .sort(),
  };
}

/** The stores this register cannot see into. Reported, because unreadable is not clean. */
export function opaqueStores(declared: readonly SeededStore[] = SEEDED_STORES): SeededStore[] {
  return declared.filter((d) => d.readability.kind === "opaque");
}

/**
 * Ways of writing this check that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly weakening the check.
 */
export const REFUSED_COHERENCE_SHAPES: Readonly<Record<string, string>> = {
  grepping_the_source_for_practice_ids:
    "Scanning each store's source for `prac-` literals. Both `src/audit/store.ts` and `src/complaints/store.ts` contain `\"prac-console\"` in comments ABOUT the defect W206 removed, so a source scan reports two stores seeded under an unmintable id and both reports are wrong. The stores are run and their state is read.",
  comparing_against_a_constant:
    "Checking seeded ids against `SEED_PRACTICE_ID` or a written pattern. That is comparing the fixture against itself: W272's defect was that the constant and the console disagreed, and a check reading the constant would have agreed with the wrong side. The mintable set comes from onboarding into a fresh console, which is the thing that actually assigns ids.",
  reporting_opaque_stores_as_clean:
    "Listing the six stores whose resetter returns `void` as holding no practice identity. Nothing outside them can see what they seeded, so that would be recording an absence of evidence as evidence of absence — and the store W265 had to change to run an erasure sweep was one of exactly this kind.",
  a_check_that_cannot_be_shown_failing:
    "Reading the tree's own stores inside the checker. The gate asks for the check to be proved on a deliberately incoherent seed, and a function that can only be pointed at this tree cannot be shown failing without breaking the tree to do it. The checker is pure and takes the fixture as an argument.",
  one_direction_only:
    "Failing on an incoherent seed and saying nothing about a store nobody classified. A resetter with no entry here is a store this register is silent about while looking complete, which is W102's stale direction and the failure that makes a register misleading rather than merely incomplete.",
};

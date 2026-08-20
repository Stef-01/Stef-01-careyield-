// W345: the escape hatches, re-read against what the tree can observe today.
//
// EVERY REGISTER IN THIS TREE HAS A WAY OF SAYING *NOT THIS ONE*. A bound whose limit nothing could
// lift is `inherent`; a bound whose predicate nobody derived is `never_derived`; a wait no mechanism
// could see is `unobservable`; a blind spot no witness could be handed to is `undemonstrated`. Each
// is correct at the moment it is written and each can never fail, which is exactly what makes it the
// cheap answer — and the cheap answer taken sixty times is a register of things nobody looks at
// again. Sixty was the count this unit opened on. No number is pinned in this paragraph —
// `hatchesInTree` derives the population and `REVIEWED_AT_W345` is checked against it in both
// directions, so a figure written here would be a second answer with nothing keeping it honest,
// which is W293's rule about counts in headers.
//
// ONE OF THE FOUR REASONS IS A CLAIM ABOUT THE TREE and the other three are judgements, so the
// re-reading splits in two. W295's `NOT_CALLABLE` says the module exports no detector taking a
// root, which a scan can contradict; `inherent`, `never_derived` and `unobservable` say what could be observed
// at all, and re-reading those is a reading this register RECORDS rather than makes. Fifty-five were
// read and left with their arguments, which is what the gate asks for and what a `still_correct` row
// means: somebody looked.
//
// THE OTHER FIVE ARE WHERE THE SCAN SPOKE. Thirty-three entries share the `NOT_CALLABLE` sentence
// and five of their modules now export a detector taking a root — W282 moved the walks into
// `tree-walks.ts`, W291's rule of taking the register as an argument was applied one register at a
// time. The remedy each hatch NAMES had been built and nobody went back to the declaration.
//
// AND DRIVING THE FIVE SPLIT THEM THREE WAYS, which is the half a scan cannot do.
//
//   *Outgrown.* `tree-walks.ts` and `security/reachability.ts` are plain conversions: a file under
//   `reports/` and a module reached only through `await import()` are planted, each register stays
//   silent about its witness and speaks about its control, and two bounds that could never fail
//   became two that can.
//
//   *Refuted.* `security/page-reach.ts` said a route added inside an existing class's directory
//   inherits that class's allowance without anybody deciding it should. Planting one returns it as
//   `unclassified`: the classes NAME their routes rather than matching by path, and adding a route
//   to a class is somebody deciding. The sentence had been false since it was written and sat
//   behind `NOT_CALLABLE` where nothing could contradict it — W323's shape, found by planting
//   rather than by reading. The corrected bound is about the allowance being class-wide, and that
//   one demonstrates.
//
//   *Misfiled.* `route-coverage.ts` and `empty-list-sweep.ts` were never about callability. Their
//   bounds are about FALSE POSITIVES — a spec covering a route by a computed path read as
//   uncovered, an assertion evidenced in a helper read as unevidenced — and W295's register
//   demonstrates by SILENCE, so planting either witness produces a hit and a hit is a refutation
//   there. Both were driven at W345 and both returned their witness exactly as their bound says.
//   They keep the hatch under a new sentence, `NOT_A_SILENCE`, which names the missing arm.
//
// WHAT THIS DOES NOT PROVE is `HATCH_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads registers and source text.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { BLIND_SPOTS, NOT_CALLABLE } from "./blind-spots";
import { STATED_BOUNDS } from "./bounds";
import { ENDING_REGISTERS, allEndings } from "./self-ending";

/** The four ways this tree says a check cannot be made to fail. */
export type HatchKind = "inherent" | "never_derived" | "unobservable" | "undemonstrated";

export interface Hatch {
  /** `<register>::<site>`, stable across edits above it. */
  id: string;
  kind: HatchKind;
}

/**
 * Every escape hatch the tree holds, derived from the registers that hold them.
 *
 * DERIVED RATHER THAN LISTED, so one arriving is unreviewed rather than unnoticed. The three
 * registers keep their own shapes and this reads each in its own terms — a `Lifting`, a
 * `Blindness`, an `Ending` — because a fourth register with a fourth shape should have to be
 * taught to this function rather than quietly matching a pattern.
 */
export function hatchesInTree(root: string): Hatch[] {
  const out: Hatch[] = [];
  for (const bound of STATED_BOUNDS) {
    if (bound.lifting.kind === "inherent") {
      out.push({ id: `bounds::${bound.module}::${bound.name}`, kind: "inherent" });
    }
    if (bound.lifting.kind === "remedy" && bound.lifting.lifted.kind === "never_derived") {
      out.push({ id: `bounds::${bound.module}::${bound.name}`, kind: "never_derived" });
    }
  }
  for (const [module, blindness] of Object.entries(BLIND_SPOTS)) {
    if (blindness.kind === "undemonstrated") out.push({ id: `blind-spots::${module}`, kind: "undemonstrated" });
  }
  for (const ending of allEndings(root, ENDING_REGISTERS)) {
    if (ending.ending.kind === "unobservable") out.push({ id: `self-ending::${ending.id}`, kind: "unobservable" });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** What re-reading a hatch found. */
export type Verdict =
  /** The argument still holds. It is LEFT as it is — the argument is already written where it lives. */
  | { kind: "still_correct" }
  /** The tree can observe it now, and the declaration has been converted. */
  | { kind: "outgrown"; what: string }
  /** The sentence was not true of the register it describes. Corrected, and the correction demonstrated. */
  | { kind: "refuted"; was: string; found: string }
  /** Real, but filed under a reason that is not the reason. */
  | { kind: "misfiled"; why: string };

export interface Review {
  id: string;
  verdict: Verdict;
}

/**
 * Every hatch in the tree, re-read at W345.
 *
 * `still_correct` CARRIES NO NEW PROSE ON PURPOSE. The gate asks that a hatch the tree has not
 * outgrown be left with its argument, and its argument is already written beside it; restating
 * fifty-five of them here would be a second copy that goes stale against the original, which is the
 * shape this loop keeps finding. What the row records is that somebody looked — and the list is
 * exhaustive rather than defaulted, so a hatch ARRIVING after this unit is unreviewed rather than
 * silently blessed.
 */
export const REVIEWED_AT_W345: readonly Review[] = [
  {
    id: "blind-spots::src/quality/tree-walks.ts",
    verdict: {
      kind: "outgrown",
      what:
        "`sourceModules` takes a root, so the union-of-its-callers bound is a two-line plant: a module under `reports/` — one of the excluded directories — is invisible to the walk while the same module under `src/` is returned. Converted to `demonstrated` with that pair.",
    },
  },
  {
    id: "blind-spots::src/security/reachability.ts",
    verdict: {
      kind: "outgrown",
      what:
        "`reachableFrom` takes a root and its entry files. A page reaching a module only through an `await import()` in its body is planted beside one reaching a module statically, and the walk returns the second and not the first — which is the direction the bound says matters. Converted to `demonstrated`.",
    },
  },
  {
    id: "blind-spots::src/security/page-reach.ts",
    verdict: {
      kind: "refuted",
      was:
        "Route classes are matched by path, so a route added inside an existing class's directory inherits that class's allowance without anybody deciding it should.",
      found:
        "`diffReach` returns a route planted at `app/console/planted/page.tsx` in `unclassified`. `ROUTE_CLASSES` NAMES its routes and `diffReach` reports every served route no class claims, so nothing is inherited by living in a directory and adding a route to a class is exactly somebody deciding. The bound was false from the day it was written and `NOT_CALLABLE` is why nobody found out. Replaced with the limit that IS true — an allowance is class-wide, so a route reaching an area some other route in its class needs is silently inside it — and that one is demonstrated: a console route reaching `messaging` goes unreported, one reaching `docx` does not.",
    },
  },
  {
    id: "blind-spots::src/quality/route-coverage.ts",
    verdict: {
      kind: "misfiled",
      why:
        "`coverageDiff` takes a root, so callability was never the reason. The bound is about a FALSE POSITIVE: a spec that navigates with a computed path covers the route and is read as not covering it. Driven — a planted spec building the path from two fragments lands in `unresolvedLiteral` and a literal one does not — the witness comes back as a HIT, and W295 demonstrates by silence, where a hit is a refutation. The hatch stays under `NOT_A_SILENCE`.",
    },
  },
  {
    id: "blind-spots::src/quality/empty-list-sweep.ts",
    verdict: {
      kind: "misfiled",
      why:
        "Same shape and the same correction. `unevidencedEmptyLists` takes a root; the bound is about the sweep reporting a real assertion as unevidenced when its non-emptiness was established in a helper. Driven, the helper-evidenced file is reported and the inline-evidenced one is not — the witness is a hit again. `NOT_A_SILENCE` rather than `NOT_CALLABLE`.",
    },
  },
  { id: "blind-spots::src/api/surface.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/capacity/copy-lint.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/capacity/coupling.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/credentials/vault.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/directory/dossier-claims.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/domain/schema-consistency.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/education/advice-lint.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/interop/credentials.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/lib/source-hygiene.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/lib/stores.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/messaging/send-path.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/privacy/automated-decisions.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/privacy/capacity-privacy.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/privacy/erasure-y5.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/privacy/outcomes-privacy.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/privacy/record-classes.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/audit-y5.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/blind-spots.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/bounds.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/declaration-tax.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/dossier-q18.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/g5-rehearsal.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/latent-findings.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/latent-y5.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/negative-probes.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/page-suite.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/hardening-q26.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/private-copies.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/register-census.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/scan-text.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/quality/self-defeating.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/referrals/scoping.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/reporting/retention.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/tenancy/two-tenant.test.ts", verdict: { kind: "still_correct" } },
  { id: "blind-spots::src/verticals/assembly.test.ts", verdict: { kind: "still_correct" } },
  { id: "bounds::src/demo/path.ts::PATH_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/founder/outstanding.ts::FOUNDER_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/blind-spots.ts::BLIND_SPOT_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/citations.ts::CITATION_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/claim-classes.ts::CLAIM_CLASS_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/closing-state.ts::CLOSING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/controls.ts::CONTROL_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/declaration-tax.ts::TAX_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/deferrals.ts::DEFERRAL_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/console/waiting.ts::WAITING_BOUND", verdict: { kind: "still_correct" } },
  // W342: back to `inherent` because its one liftable clause was LIFTED, which is the opposite of
  // the drift this register watches for. W338 typed it `remedy` for the clause about an id-shaped
  // token nothing reads; `unknownIdsInCell` reads it now, and what is left — the dossier's prose,
  // and a row blocked on the wrong gate — is judgement rather than a check somebody could write.
  { id: "bounds::src/quality/dossier-derived.ts::DOSSIER_BOUND", verdict: { kind: "still_correct" } },
  // W350: `inherent` on arrival, because its one liftable clause was LIFTED — W337's predicate had
  // been written to notice `proseWaits` by name and went false the moment it existed. What is left
  // is a wait with no unit id in it, which needs a reading of what an event is rather than a
  // resolution of a name: a judgement over arbitrary prose, not a check somebody could write.
  { id: "bounds::src/quality/quarter-mutants-q27.ts::Q27_MUTANT_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/self-ending.ts::ENDING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/founder-page-facts.ts::PAGE_FACT_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/hardening-q23.ts::HARDENING_BOUND", verdict: { kind: "still_correct" } },
  // W343: `inherent` on arrival and read on arrival, which is the only honest way a pass adds a
  // hatch to a register that watches for hatches nobody re-reads. Independence is a property of who
  // reads; the loop has the builders it has.
  { id: "bounds::src/quality/hardening-q28.ts::Q28_HARDENING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/hardening-q27.ts::Q27_HARDENING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/hardening-q26.ts::Q26_HARDENING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/hardening-q24.ts::HARDENING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/hardening-q25.ts::Q25_HARDENING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/manifest.ts::MANIFEST_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/planting.ts::PLANTING_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/quarter-mutants-q28.ts::Q28_MUTANT_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/quarter-mutants.ts::QUARTER_MUTANT_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/register-counts.ts::COUNT_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/repository-clean.ts::CLEAN_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/self-defeating.ts::REMEDY_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/unit-headers.ts::HEADER_CITATION_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/unasked-facts.ts::UNASKED_BOUND", verdict: { kind: "still_correct" } },
  { id: "bounds::src/quality/unrun.ts::UNRUN_BOUND", verdict: { kind: "still_correct" } },
  { id: "self-ending::W319::Q17 action 1", verdict: { kind: "still_correct" } },
  { id: "self-ending::W319::Q9 action 1", verdict: { kind: "still_correct" } },
];

export interface HatchDefect {
  id: string;
  what: string;
}

/**
 * The re-reading, checked in three directions.
 *
 * THE THIRD IS THE ONE THAT MADE THIS UNIT WORTH BUILDING. `NOT_CALLABLE` is not an opinion — it
 * says the module exports no detector taking a root — so an entry using it while the module does is
 * a declaration the tree has contradicted, and that is derivable rather than argued. It is also the
 * arm that stays useful after this unit: the five are converted, so it reports nothing today and
 * fires the next time a register gains the export its own hatch says it lacks.
 */
export function hatchDefects(
  root: string,
  reviewed: readonly Review[] = REVIEWED_AT_W345,
  found: readonly Hatch[] = hatchesInTree(root),
): HatchDefect[] {
  const out: HatchDefect[] = [];
  const byId = new Map(reviewed.map((r) => [r.id, r.verdict]));

  for (const hatch of found) {
    if (!byId.has(hatch.id)) out.push({ id: hatch.id, what: "is an escape hatch nobody re-read" });
  }
  for (const { id, verdict } of reviewed) {
    // A verdict is a claim about whether the hatch is STILL THERE, and the two halves point
    // opposite ways: `still_correct` and `misfiled` say it is, `outgrown` and `refuted` say this
    // unit took it away. So each is checked against the tree in its own direction — a converted
    // declaration that is somehow still a hatch is the failure that matters, and one direction
    // would have reported all four conversions as stale rows the moment they worked.
    const live = found.some((h) => h.id === id);
    const claimsLive = verdict.kind === "still_correct" || verdict.kind === "misfiled";
    if (claimsLive && !live) {
      out.push({ id, what: "is re-read here as a live hatch and the tree no longer holds it" });
    }
    if (!claimsLive && live) {
      out.push({ id, what: "is recorded here as converted and is still an escape hatch" });
    }
  }
  for (const module of callableDetectorsBorrowingTheSentence(root)) {
    out.push({
      id: `blind-spots::${module}`,
      what: "says its detector cannot be called from outside, and the module exports one taking a root",
    });
  }
  return out.sort((a, b) => `${a.id}${a.what}`.localeCompare(`${b.id}${b.what}`));
}

/** Modules whose blind spot borrows `NOT_CALLABLE` while exporting a detector that takes a root. */
export function callableDetectorsBorrowingTheSentence(root: string): string[] {
  const out: string[] = [];
  for (const [module, blindness] of Object.entries(BLIND_SPOTS)) {
    if (blindness.kind !== "undemonstrated" || blindness.whyNotPlantable !== NOT_CALLABLE) continue;
    const full = path.join(root, module);
    if (!existsSync(full)) continue;
    // A detector a witness can be handed to is an exported function whose FIRST parameter is a
    // root. The signature may wrap, which W333 found the composed-copy register missing.
    if (/^export function [A-Za-z0-9_]+\(\s*\n?\s*root: string/m.test(readFileSync(full, "utf8"))) {
      out.push(module);
    }
  }
  return out.sort();
}

/** What this re-reading does not prove. */
export const HATCH_BOUND =
  "One of the four reasons is checkable and three are not. `NOT_CALLABLE` says something about the " +
  "tree and a scan can contradict it; `inherent`, `never_derived` and `unobservable` say what could " +
  "be observed at all, and re-reading those is a judgement this register RECORDS rather than makes. " +
  "So a `still_correct` row is a note that somebody looked, not a derivation that they were right, " +
  "and a hatch whose argument quietly stopped being true stays green here until the next reader " +
  "disagrees with it. THE CHECKABLE ARM IS NARROWER THAN IT LOOKS: it asks whether a module exports " +
  "a function taking a root, which is whether a witness COULD be handed in and never whether the " +
  "witness would settle the question — the two entries reclassified `NOT_A_SILENCE` are exactly " +
  "that case, callable the whole time and no better demonstrated for it, and nothing derives THAT " +
  "reason, because a bound's polarity is a property of its sentence rather than of its module. AND " +
  "THE REFUTATION WAS A BY-PRODUCT: `page-reach.ts`'s bound was found false because this unit " +
  "planted against it, not because anything asked whether a bound is true of its register, and " +
  "nothing in the tree asks that of the entries no witness has ever been put in front of. What " +
  "would settle the two reclassified here is a `Blindness` arm that demonstrates a bound by NOISE " +
  "rather than by silence, which nobody has written. Finally, nothing here dates a review. A " +
  "re-reading is pinned to the unit that did it, so the " +
  "way to know these are stale is that the unit is old — which is the shape W294 puts a review date " +
  "on for acceptances and this deliberately does not copy, because a hatch has no expiry that is " +
  "not just somebody looking again.";

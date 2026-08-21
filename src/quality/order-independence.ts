// W167: order-dependence, made mechanical.
//
// A fold turns a collection into one answer. When two records tie on whatever the fold compares,
// the answer becomes whichever one the input happened to list first — and the input order comes
// from a store query, an ingest, or a `Map` iteration, none of which anybody chose. So the bug
// is not that the fold is wrong; it is that the fold is RIGHT ONLY ABOUT THE ORDER IT WAS GIVEN,
// and nothing in the code says so.
//
// This is not hypothetical in this tree. W118's `pathwayAt` picked "the most recently published
// version at or before this instant" with a `reduce`, and on two versions published at the same
// timestamp it returned the superseded one — which W128 then found only because a mutation check
// showed the guard compensating for it was untested. That bug was invisible to review, to types
// and to every existing test, and the shape recurs: three of this tree's twelve fold modules had
// the same tie-sensitivity when this register was first built.
//
// Two things make it mechanical rather than another thing to remember.
//
//   THE REGISTER IS CHECKED AGAINST THE TREE, both directions, the way W102's surface census and
//   W106's record classes are. A new fold site fails the suite until it is declared; a declared
//   site that no longer exists fails too, because a register describing code that has moved
//   reads as coverage. Nothing here depends on anyone remembering the rule.
//
//   EVERY ENTRY CARRIES A DISPOSITION, and there are only two: a tie-break TEST, or a written
//   RATIONALE for why ties cannot arise or cannot matter. "Someone looked at it" is not one of
//   them. Most sums earn a rationale in a sentence — addition is commutative — and that is the
//   point: the cheap cases stay cheap, so the expensive ones stand out.
//
// The property helper is deliberately tiny. It runs the fold over a collection and over its
// reverse and requires the same answer, because "both orders, same answer" is the whole property
// and a more elaborate harness would be a thing to maintain rather than a thing to use.

import { readFileSync } from "node:fs";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/**
 * Assert a fold gives the same answer whichever way round its input arrives.
 *
 * Takes the records ALREADY TIED on the fold's comparison key — constructing the tie is the
 * caller's job, because only the caller knows what this fold compares. A helper that guessed
 * would pass on collections that never tie, which is the vacuous version of this test.
 */
export function foldIsOrderIndependent<T, R>(
  fold: (items: readonly T[]) => R,
  tiedRecords: readonly T[],
): { stable: boolean; forward: R; reversed: R } {
  const forward = fold(tiedRecords);
  const reversed = fold([...tiedRecords].reverse());
  return { stable: JSON.stringify(forward) === JSON.stringify(reversed), forward, reversed };
}

export type Disposition =
  /** A test that constructs a tie and pins the answer. */
  | { kind: "tie_break_test"; test: string }
  /** Why a tie cannot arise, or cannot change the answer. */
  | { kind: "rationale"; why: string };

export interface FoldSite {
  /** Repo-relative module path. */
  module: string;
  /** How many folds it contains, so adding one to a declared module still fails. */
  folds: number;
  disposition: Disposition;
}

/**
 * Every module that folds a collection to one answer.
 *
 * Ordered by path. `folds` is a count rather than a line number on purpose: line numbers churn
 * with every edit above them, and a register that fails on unrelated edits gets its numbers
 * bumped without anyone reading the code.
 */
export const FOLD_SITES: readonly FoldSite[] = [
  {
    module: "src/capacity/backtest.ts",
    folds: 2,
    disposition: {
      kind: "rationale",
      why: "TWO last-element reads, and the register caught me declaring one — `historyBefore` stamps the truncated history's end date, and the score stamps the period it covers. Both read the LAST scorable week's date. The list is W222's `weeks`, already sorted by ISO date and unable to tie — sessions are grouped by (clinician, date), so one clinician has at most one per date. The fold reads a DATE off the last element rather than returning the record, the same argument src/capacity/model.ts and src/outcomes/time-to-escalation.ts make. The walk-forward loop itself is an index scan, not a fold: each week is scored against a truncation of the history before it, so no element's result depends on any later element having been visited.",
    },
  },
  {
    module: "src/capacity/drift.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "W228 reads the LAST week of the frozen history to stamp its basis. The list is W222's `weeks`, sorted by ISO date and unable to tie — sessions are grouped by (clinician, date), so one clinician has at most one per date. It reads a DATE off the last element rather than returning the record; the same argument src/capacity/model.ts and src/capacity/backtest.ts make.",
    },
  },
  {
    module: "src/capacity/model.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "W222 reads the LAST recorded week's date to stamp a pattern's basis. The list is sorted by ISO date on the line above, and two entries cannot tie: sessions are grouped by (clinician, date), so one clinician has at most one session per date. The fold reads a DATE off the last element rather than returning the record, which is the same argument src/outcomes/time-to-escalation.ts makes.",
    },
  },
  {
    module: "src/demo/clinicians.ts",
    folds: 2,
    disposition: {
      kind: "rationale",
      why: "Both fold to a scalar total over a fixed synthetic roster. Addition is commutative, and the roster is a literal in the same file rather than anything a store ordered.",
    },
  },
  {
    // W188: a same-day join/leave pair is a real tie on a day-granular date, and the tie-break
    // is a safety decision rather than a guess — see the test.
    module: "src/directory/membership.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/directory/membership.test.ts :: W188 a join and a leave on the same day resolve to NOT a member, either way round",
    },
  },
  {
    module: "src/engine/continuity.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Sums a number array before dividing. Floating-point addition is not strictly associative, but the inputs are same-magnitude ratios in [0,1] and the result feeds a displayed percentage, so no reordering can move it by a displayable amount.",
    },
  },
  {
    module: "src/guardrails/condition-monitors.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Math.max over a severity RANK, returning the number rather than the alert. Two alerts of equal severity yield the same rank either way round, so the answer cannot depend on order.",
    },
  },
  {
    // W243, and THE REGISTER FOUND IT RATHER THAN THE AUTHOR. `atIso` is day-granular, so a
    // consent and a withdrawal recorded on the same day tie, the sort is stable, and the answer
    // would have fallen back to the caller's array order — a store deciding whether a record is
    // disclosed. The tie decides between `given` and `withdrawn`, the most consequential pair
    // there. The break puts the withdrawal last, which is that module's own stated rule — a
    // consent is read narrowly and a withdrawal broadly — and is the same resolution
    // src/directory/membership.ts makes further up, for the same reason.
    module: "src/interop/consent-to-disclose.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/interop/consent-to-disclose.test.ts :: W167 a consent and a withdrawal on the same day resolve to withdrawn, either way round",
    },
  },
  {
    module: "src/messaging/approval.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/messaging/approval.test.ts :: W167 two withdrawals at the same instant pick the same one",
    },
  },
  {
    module: "src/outcomes/response-console.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "W220 sums how many cells W218 withheld, so the page can explain them once rather than per row. Addition over a set, to a scalar: no element's contribution depends on any other's position, and the input arrives already sorted by `disclosableGraph`. A test asserts the count equals the same predicate applied independently, so the fold cannot drift from what it claims to count.",
    },
  },
  {
    // W176: declared as the register intends — a new fold site fails the suite until it is here.
    module: "src/outcomes/time-to-escalation.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Takes the last element of a list sorted by day count and reads the NUMBER off it rather than returning the record. Two measurements tied on days give the same number either way round, so there is nothing to break — the same argument as src/pms/ingest.ts. The sort itself already tie-breaks by key.",
    },
  },
  {
    module: "src/pathways/approval.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/pathways/approval.test.ts :: W167 two attestations at the same instant name the same attester",
    },
  },
  {
    module: "src/pathways/audit.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Takes the final element of an append-only trail that REFUSES an event dated before the last one (`out_of_order`). The last element is the latest by construction, so there is no tie to break — the ordering is enforced at write time rather than recovered at read time.",
    },
  },
  {
    // W168: found by widening the detector past `.reduce(`. This one WAS defective — a same-day
    // given/refused pair resolved by array order — and is fixed in the same unit.
    module: "src/pathways/consent.ts",
    folds: 2,
    disposition: {
      kind: "tie_break_test",
      test: "src/pathways/consent.test.ts :: W168: two decisions on one day do not resolve by array order",
    },
  },
  {
    module: "src/pathways/versioning.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Takes the final element of a list where replay guarantees at most one version in force at an instant. The index is belt-and-braces rather than a selection, and W128's mutation check already proved the surrounding rule is tested rather than compensated for.",
    },
  },
  {
    module: "src/pms/ingest.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Folds to the maximum capturedAt VALUE, not to the record holding it. Two records sharing the maximum produce the same string either way round.",
    },
  },
  {
    module: "src/quality/import-cycles.ts",
    folds: 2,
    disposition: {
      kind: "rationale",
      why: "Neither is a fold over a collection whose order could vary: both are the top-of-stack peek of an EXPLICIT work stack in W381's iterative Tarjan, `work[work.length - 1]`, which is the recursion the language would otherwise hold on the call stack. `work` is a private local, pushed and popped by this function alone, and 'the frame currently being expanded' is a definition rather than a choice among equals — two frames cannot share the top of a stack. The traversal it drives is order-SENSITIVE in the ordinary way any depth-first search is, so the module fixes the two orders it depends on rather than arguing they do not matter: the roots are walked over `[...graph.keys()].sort()`, and each component is `.sort()`ed before it is recorded. Both are already pinned — `cyclicComponents` returns the same components in the same order on the same tree, and W381's suite asserts the membership of each rather than a position within it.",
    },
  },
  {
    // W178: the register caught the corpus on its first run — the corpus's own pre-fix
    // reconstructions are folds, because they are copies of folds. Declared rather than
    // excluded by name: an excluded file is a place to hide something (W168's rule).
    module: "src/quality/order-regressions.ts",
    folds: 5,
    disposition: {
      kind: "tie_break_test",
      test: "src/quality/order-regressions.test.ts :: the fixture still discriminates the fix",
    },
  },
  {
    module: "src/quality/tautology-sweep.ts",
    folds: 2,
    disposition: {
      kind: "rationale",
      why: "Two last-element reads, and neither collection can be in any other order. `enclosingTest` takes the last `it(` opening that starts before the assertion's offset, and the list comes from `matchAll` over the file's own text, which yields matches in position order by construction rather than from any collection whose order a caller or a store could vary. 'The last opening before this offset' IS the definition of the enclosing test — there is no tie to break, because two openings cannot share a start index. The value read is the test's TITLE, not a record, which is the same argument src/capacity/model.ts makes. W331 added the second for the same reason in the same shape: `preservedFrom` takes the last BINDING declared before an assertion, from a list built by `matchAll` over the same text, and 'the nearest preceding declaration' is likewise a definition rather than a choice among equals.",
    },
  },
  {
    module: "src/referrals/store.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/referrals/store.test.ts :: W142 a corrected return report is not lost to array order",
    },
  },
  {
    module: "src/security/audit-gate.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Takes the final element of a review list written by hand in `audit-allowlist.ts`, in the order the reviews happened. Not a query result and not an ingest — the order is the author's, which is the one case where position IS the fact.",
    },
  },
  {
    module: "src/sim/fleet-y5.ts",
    folds: 5,
    disposition: {
      kind: "rationale",
      why: "FIVE integer sums and no selection among them. One totals a session pattern's offerable slots before a forecast is asked for; four total counts across the fleet's practices before two shares are divided out. Integer addition is commutative, every divisor is a count taken from the same pass, and none of the five returns an element — so there is no record whose identity could depend on which order the runs happened to be in, which is the failure the register exists for.",
    },
  },
  {
    module: "src/sim/fleet.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Sums integer send counts across runs before dividing. Integer addition is commutative and the divisor does not depend on order.",
    },
  },
  {
    module: "src/sim/scale.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Sums measured per-practice durations to project a total. Same-magnitude addends, and the projection is reported to whole milliseconds.",
    },
  },
  {
    module: "src/spine/spine.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Folds events onto a log with `append`, which is order-PRESERVING by design — the spine's whole purpose is that sequence is meaningful. Reordering the input is a different history, not the same one seen differently, and W10's sequence check is what guards it.",
    },
  },
  {
    module: "src/tenancy/multisite.ts",
    folds: 3,
    disposition: {
      kind: "rationale",
      why: "Three integer sums across sites for the aggregate totals. Commutative, and W97 asserts the totals carry no per-site field that could make position observable.",
    },
  },
  {
    module: "src/tenancy/rollout.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Sums error counts to decide whether a plan has any. Commutative, and the decision is against zero.",
    },
  },
  {
    module: "src/verticals/binding.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/verticals/binding.test.ts :: W167 two acceptances at the same instant resolve the same way",
    },
  },
  {
    // W252: the register caught this file on its first run, which is the register working.
    module: "src/verticals/scale.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "The one fold sums member counts across the specs being measured, and addition is commutative — there is no comparison to tie on. The module's own subject is this property: `orderDependence` runs the gate list, the blocked-count rollup and the whole assembly forwards and backwards and reports any disagreement in words, and `checkVerticalScaleBudgets` turns each disagreement into a violation. A tie-break test here would be a test of `+`.",
    },
  },
];

// W168 widened this. It matched `.reduce(` only, and W167's ledger row concluded from that
// "there are no sort-then-take-first sites". There were five: `.at(-1)` and `[xs.length - 1]`
// fold a collection to one answer just as much as a reduce does, and one of them — consent — was
// order-dependent and is fixed in this unit. A detector that cannot see a whole family of folds
// reports zero for that family, and zero reads as clean.
//
// The patterns are assembled from fragments so this module does not match ITSELF, which is
// W153's trick for the same problem: the alternative is excluding the file by name, and an
// excluded file is a place to hide something.
const FOLD_RE = new RegExp(
  [
    ["\\.redu", "ce\\("].join(""),
    ["\\.a", "t\\(-1\\)"].join(""),
    ["\\[\\s*[\\w.]+\\.len", "gth - 1\\s*\\]"].join(""),
  ].join("|"),
  "g",
);

/** Modules under `root` that fold a collection, with how many folds each contains. */
export function discoverFoldSites(root: string): Array<{ module: string; folds: number }> {
  const found: Array<{ module: string; folds: number }> = [];

  // W341: the shared walk. Tests are excluded by `sourceModules` already; the second filter stays
  // because this register's rule is `.test.` ANYWHERE in the name — a fold in a test is the test's
  // own arithmetic — and narrowing that to the shared walk's suffix rule would be a behaviour
  // change smuggled in under a de-duplication.
  for (const full of sourceModules(root)) {
    const entry = full.slice(full.lastIndexOf("/") + 1);
    if (entry.includes(".test.")) continue;
    // W168: comments are stripped first. A fold NAMED IN PROSE is not a fold, and this
    // module's own header naming the patterns was enough to make it match itself. Counting
    // comment mentions also inflates a declared count, which then has to be "corrected" by
    // somebody who has not read the code — the failure mode a register exists to prevent.
    // W295: STRING LITERALS BLANKED TOO. Comments were already subtracted (W168) because a fold
    // NAMED IN PROSE is not a fold; the same is true of a fold quoted inside a fixture, and this
    // register reported W295's own module because its bound sentence names `.reduce(` and
    // `.at(-1)` as the patterns it looks for. Same defect one layer over, same remedy.
    const source = prepareForScan(readFileSync(full, "utf8"));
    const count = (source.match(FOLD_RE) ?? []).length;
    // Repo-relative with posix separators on every platform: the register is written
    // with "/" and Windows walks produce "\", which read as 20 phantom drifts.
    if (count > 0) found.push({ module: full.slice(root.length + 1).replaceAll("\\", "/"), folds: count });
  }
  return found.sort((a, b) => a.module.localeCompare(b.module));
}

export interface FoldRegisterDiff {
  /** Modules that fold but are not declared. */
  undeclared: string[];
  /** Declared modules that no longer fold — a register describing code that has moved. */
  stale: string[];
  /** Declared modules whose fold count has changed: a fold was added or removed. */
  countChanged: Array<{ module: string; declared: number; actual: number }>;
}

export function diffFoldRegister(
  actual: ReadonlyArray<{ module: string; folds: number }>,
  declared: readonly FoldSite[] = FOLD_SITES,
): FoldRegisterDiff {
  const declaredBy = new Map(declared.map((d) => [d.module, d]));
  const actualBy = new Map(actual.map((a) => [a.module, a]));

  return {
    undeclared: actual.filter((a) => !declaredBy.has(a.module)).map((a) => a.module).sort(),
    stale: declared.filter((d) => !actualBy.has(d.module)).map((d) => d.module).sort(),
    countChanged: actual
      .filter((a) => declaredBy.has(a.module) && declaredBy.get(a.module)!.folds !== a.folds)
      .map((a) => ({ module: a.module, declared: declaredBy.get(a.module)!.folds, actual: a.folds }))
      .sort((x, y) => x.module.localeCompare(y.module)),
  };
}

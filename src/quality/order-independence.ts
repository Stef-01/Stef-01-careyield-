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

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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
    module: "src/demo/clinicians.ts",
    folds: 2,
    disposition: {
      kind: "rationale",
      why: "Both fold to a scalar total over a fixed synthetic roster. Addition is commutative, and the roster is a literal in the same file rather than anything a store ordered.",
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
    module: "src/messaging/approval.ts",
    folds: 1,
    disposition: {
      kind: "tie_break_test",
      test: "src/messaging/approval.test.ts :: W167 two withdrawals at the same instant pick the same one",
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
    module: "src/pms/ingest.ts",
    folds: 1,
    disposition: {
      kind: "rationale",
      why: "Folds to the maximum capturedAt VALUE, not to the record holding it. Two records sharing the maximum produce the same string either way round.",
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
];

const FOLD_RE = /\.reduce\(/g;

/** Modules under `root` that fold a collection, with how many folds each contains. */
export function discoverFoldSites(root: string): Array<{ module: string; folds: number }> {
  const found: Array<{ module: string; folds: number }> = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      // Tests are excluded: a fold in a test is the test's own arithmetic, not a product answer.
      if (!entry.endsWith(".ts") || entry.includes(".test.")) continue;
      const source = readFileSync(full, "utf8");
      const count = (source.match(FOLD_RE) ?? []).length;
      if (count > 0) found.push({ module: full.slice(root.length + 1), folds: count });
    }
  };

  walk(join(root, "src"));
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

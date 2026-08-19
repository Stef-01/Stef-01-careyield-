// W349: Q26's own modules, mutated — and the two the harness cannot reach.
//
// W332 BUILT THIS FOR Q25 AND IT RAN IN TWELVE MINUTES. Pointed at Q26 the same harness did not
// finish in fifty. The population is eleven modules and ninety-two mutants, which is half again as
// large as Q25's six and sixty-eight — nowhere near four times the work. What made the difference
// is one module.
//
// THE QUARTER ADDED THE HARNESS'S OWN MODULE. `src/quality/quarter-mutants.ts` has a header naming
// W332, W332 is inside Q26, and its sibling suite is `quarter-mutants.test.ts` — the full mutation
// run. So sweeping Q26 means running the sweep, once per mutant, and its two mutants cost more than
// the other ninety together: with them the run does not finish, and without them it takes seven
// minutes. A harness whose population can contain the harness does not compose with itself, and
// nothing said so until somebody pointed it at the quarter that added it.
//
// AND ONE MODULE HAS NO SIBLING SUITE AT ALL. W334's `src/console/setup-gaps.ts` is tested from
// `src/demo/path.test.ts`, which `siblingSuite` cannot see, so `allMutants` skips it silently and
// its mutants were never in the ninety-two. W332's own test asserts `quarterModulesWithNoSuite` is
// empty and passes — because it asks that of Q25's range, where it is true. The exclusion is real
// either way; what this unit adds is that it is DECLARED and resolved rather than silent.
//
// BOTH EXCLUSIONS ARE CHECKED AGAINST THE TREE. A row pleading that a module's suite runs the sweep
// must name a suite that really imports the runner, and a row pleading no sibling suite must name a
// module that really has none. An exclusion nobody can contradict is how a population quietly stops
// being a quarter, which is the shape W343 found in this module's own signature.
//
// TWO SURVIVORS, AND ONE OF THEM WAS FIXED RATHER THAN RECORDED. The run found three. The second —
// `controls.ts`'s `pending` lookup — is the survivor W332 recorded in `claim-classes.ts`, whose
// remedy it wrote down and left for W331, which did not apply it; W337 then wrote `controls.ts` on
// the same pattern and the hole arrived with it. Recording it a second time is how it would arrive
// a third. `controls.test.ts` now drives the arm with a row that has NOT landed and requires
// silence, which kills the mutant, and this register holds the two that remain.
//
// WHAT THIS DOES NOT PROVE is `Q26_MUTANT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Mutants are applied inside a copied tree.

import { readFileSync } from "node:fs";
import path from "node:path";
import { type Survivor } from "./mutation-sampling";
import { siblingSuite } from "./mutation-sampling";
import { type UnitRange, quarterModules } from "./quarter-mutants";

/** The quarter this unit measured. A range, for the reason `QUARTER_AT_W332` gives. */
export const QUARTER_AT_W349: UnitRange = { first: 326, last: 338 };

/** Why a module the quarter added is outside the sweep. */
export type Unreachable =
  /**
   * Its sibling suite IS a mutation run, so mutating it runs the sweep.
   *
   * `suite` is resolved: it must import the runner, or the row is describing a file that has moved.
   */
  | { kind: "runs_the_sweep"; suite: string; why: string }
  /** `siblingSuite` finds nothing, so `allMutants` never built a mutant for it. */
  | { kind: "no_sibling_suite"; testedFrom: string; why: string };

export interface Excluded {
  module: string;
  reason: Unreachable;
}

/**
 * The modules Q26 added that this sweep cannot measure, and why.
 *
 * TWO, AND NEITHER IS A CHOICE ABOUT EFFORT. One cannot be run because running it runs this; the
 * other was never in the population because the walk that builds mutants could not find a suite for
 * it. Declaring them is what turns "ninety mutants over ten modules" from a measurement of a
 * quarter into a measurement of the part of a quarter this harness reaches.
 */
export const EXCLUDED_AT_W349: readonly Excluded[] = [
  {
    module: "src/quality/quarter-mutants.ts",
    reason: {
      kind: "runs_the_sweep",
      suite: "src/quality/quarter-mutants.test.ts",
      why: "Its sibling suite is W332's full run over Q25. Each of its two mutants therefore costs a complete mutation sweep, and the pair alone exceeded a fifty-minute budget the other ninety mutants finish inside seven. This is not a slow test: it is a harness whose population contains the harness, and the only way to measure those two lines is a different instrument.",
    },
  },
  {
    module: "src/console/setup-gaps.ts",
    reason: {
      kind: "no_sibling_suite",
      testedFrom: "src/demo/path.test.ts",
      why: "W334 put its checks in the demo path's walk rather than beside the module, which is right for a notice whose subject is four console pages. `siblingSuite` looks for `<module>.test.ts` and finds nothing, so `allMutants` skipped it without saying so — the module was never in the ninety-two and no count would have shown it missing.",
    },
  },
];

export interface PopulationDefect {
  module: string;
  what: string;
}

/**
 * The population, derived — and the exclusions resolved against the tree.
 *
 * THREE DIRECTIONS. A module the quarter added that nothing measures and nothing excuses fails; an
 * excusal for a module the quarter no longer holds fails; and an excusal whose own claim the tree
 * contradicts fails, which is the arm that keeps `runs_the_sweep` from becoming the easy way to
 * shorten a run.
 */
export function populationDefects(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W349,
  range: UnitRange = QUARTER_AT_W349,
): PopulationDefect[] {
  const out: PopulationDefect[] = [];
  const added = quarterModules(root, range);
  const excused = new Map(excluded.map((e) => [e.module, e.reason]));

  for (const { module, reason } of excluded) {
    if (!added.includes(module)) {
      out.push({ module, what: "is excused from the sweep and the quarter did not add it" });
      continue;
    }
    const suite = siblingSuite(root, module);
    if (reason.kind === "runs_the_sweep") {
      if (suite !== reason.suite) {
        out.push({ module, what: `names ${reason.suite} as its suite and the tree says ${suite}` });
      } else if (!/\brunMutants\b/.test(readFileSync(path.join(root, suite), "utf8"))) {
        out.push({ module, what: `is excused because ${suite} runs the sweep, and it does not` });
      }
    }
    if (reason.kind === "no_sibling_suite" && suite !== null) {
      out.push({ module, what: `is excused as having no sibling suite, and ${suite} is one` });
    }
  }
  for (const module of added) {
    if (excused.has(module)) continue;
    if (siblingSuite(root, module) === null) {
      out.push({ module, what: "is in the quarter, has no sibling suite, and nothing excuses it" });
    }
  }
  return out.sort((a, b) => `${a.module}${a.what}`.localeCompare(`${b.module}${b.what}`));
}

/** Every module of Q26 this sweep actually runs over. */
export function q26Population(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W349,
  range: UnitRange = QUARTER_AT_W349,
): string[] {
  const excused = new Set(excluded.map((e) => e.module));
  return quarterModules(root, range).filter((m) => !excused.has(m));
}

/**
 * The survivors of the full run over Q26's reachable modules, each with its kind and its argument.
 *
 * W296'S TYPE AND W296'S FOUR KINDS, unchanged: a survivor is a question rather than a verdict, and
 * which of the four it is can only be settled by reading. The run found three; the third is fixed
 * in `controls.test.ts` and is not here, because a register recording a hole somebody has just
 * closed is the stale direction W332's own report arm exists to catch.
 *
 * W358 REMOVED A PAIR OF ROWS FOR THE SAME REASON, and they should never have been added. W357 read a
 * sweep of `self-ending.ts` taken before W352 landed and recorded both of `proseWaits`'s guards as
 * uncaught — W352 had already driven them, with six tests against a planted ledger. Re-running the
 * quarter is what reported it: the full run said two declared survivors are now caught, and
 * flipping each guard by hand fired four and five tests respectively. A measurement is only about
 * the tree it was taken on, and a survivor register is the one place that is easy to forget.
 */
export const SURVIVORS_AT_W349: readonly Survivor[] = [
  {
    id: 'src/quality/controls.ts :: and-to-or :: return check !== undefined && check.run(CLOSING_ROW, root, "W900").length > 0;',
    reason: {
      kind: "unreached",
      why: "THE SAME SHAPE Q25 PRODUCED IN `claim-classes.ts`, in the module W337 wrote from it. The guard's FALSE branch cannot be taken while `CLOSING_CHECKS` holds an entry with id `sha-shape`, and it does — so `check` is never undefined and no test reaches the line the mutant changes. Flipped to `||` the expression would throw rather than return false, which is a real difference over a state the tree does not have. The `check` is computed inside a `fires` closure from an imported constant, so it cannot be injected either: reaching it means deleting `sha-shape` from W315's register, at which point W337's own `names an export the module does not have` arm fires first. Left as a guard rather than removed, because the alternative is code that assumes a register's contents.",
    },
  },
  {
    id: 'src/quality/dossier-derived.ts :: eq-to-neq :: } else if (started && line.trim() === "") break;',
    reason: {
      kind: "equivalent",
      why: "The branch ends a markdown table, and it is reached only for a line that does NOT start with `|`. In the dossier every table is followed by a blank line, so `=== \"\"` stops there; flipped to `!== \"\"` the loop does not stop at the blank line and stops at the next non-pipe line instead — which, there being nothing between, is the same row set. It is equivalent over the document this register parses rather than over markdown in general: a dossier with prose immediately under a table would separate them, and the fixture that would prove it is a document nobody has a reason to write. Recorded as equivalent with that scope named rather than as a hole, because calling it uncaught would claim a defect the tree cannot exhibit.",
    },
  },
];

/** What a green full run over Q26 does not prove. */
export const Q26_MUTANT_BOUND =
  "IT MEASURES THE PART OF A QUARTER THIS HARNESS CAN REACH, which is a narrower claim than W332's " +
  "sentence made for Q25 and the narrowing is this unit's finding rather than its excuse. Two of " +
  "the quarter's modules are outside the run — one because sweeping it runs the sweep, one because " +
  "the walk that builds mutants could not find its suite — so the lines that decide whether a " +
  "mutation register works, and the lines that decide what an operator is told when setup is " +
  "unfinished, are the two the register cannot speak about. THE EXCLUSIONS RESOLVE AND THE " +
  "REASONS DO NOT: a check confirms that the named suite runs the sweep and that the other module " +
  "has no sibling, and nothing checks that excusing them was right. W332'S LIMITS ALL STILL HOLD " +
  "underneath — five textual operators are not the mutation space, a caught mutant means some " +
  "assertion noticed rather than that it was about the change, and the population is derived from " +
  "headers, so a module whose header names the wrong unit is measured as part of the wrong quarter. " +
  "AND THE RATIO IS THE OTHER HALF OF THE STORY: Q26 laid thirteen units and added eleven modules " +
  "where Q25 added six, so this quarter's new work is much better covered than the last — while " +
  "everything either quarter EXTENDED still falls outside both populations and back into W296's " +
  "sample, which draws four mutants from this one.";

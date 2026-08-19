// W362: the survivors register over Q27's modules.
//
// W332'S INSTRUMENT, THIRD QUARTER RUNNING, AND THE POINT IS THE COMPARISON. Q25 and Q26 were each
// swept and each left a handful of survivors that a reader had to settle one at a time; what the
// third run buys is a trend the tree can read rather than an anecdote — whether the registers this
// build keeps adding are getting harder to break, or whether each quarter simply produces its own
// small pile of holes.
//
// Q27'S THEME MAKES THIS RUN A PARTICULAR QUESTION. That quarter was about a fact the tree already
// held that nothing read, and its own hardening pass found the pattern in the quarter's own
// machinery — a derivation named in several registers' prose and called by nothing, a private ledger
// parse the copy register could not see, an exemption keyed per site and applied per file. Every
// one of those is a check that reads as working. A mutation run asks the same question with a
// different instrument: change a line and see whether anything notices.
//
// THE POPULATION IS THE QUARTER'S OWN MODULES, derived from the unit each header names rather than
// listed, so a module whose header moves leaves the quarter without anybody editing this file. Q27
// added eleven; one of them yields no mutant at all under W296's five operators, which is recorded
// here rather than left to look like a module that passed.
//
// WHAT THIS DOES NOT PROVE is `Q27_MUTANT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Mutants are written into a copied tree.

import type { UnitRange } from "./quarter-mutants";
import { quarterModules, quarterMutants } from "./quarter-mutants";
import type { Survivor } from "./mutation-sampling";
import { siblingSuite } from "./mutation-sampling";
import type { Excluded } from "./quarter-mutants-q26";

/** W349's shape, re-exported so a reader of this quarter need not chase the previous one. */
export type { Excluded };

/** Q27, as the ledger holds it. */
export const QUARTER_AT_W362: UnitRange = { first: 339, last: 351 };

/**
 * The modules Q27 added that this sweep cannot measure, and why.
 *
 * ONE, AND IT IS THE SAME SHAPE Q26 DECLARED ONE QUARTER EARLIER. `quarter-mutants-q26.ts`'s
 * sibling suite IS the Q26 mutation run, so each of its mutants costs a complete sweep — the
 * recursion W349 hit when its own population contained `quarter-mutants.ts`. That this recurs is
 * itself worth recording: every quarter that measures the previous quarter's sweep adds a module
 * whose suite is a sweep, and the exclusion will be here again next quarter unless the instrument
 * changes.
 */
export const EXCLUDED_AT_W362: readonly Excluded[] = [
  {
    module: "src/quality/quarter-mutants-q26.ts",
    reason: {
      kind: "runs_the_sweep",
      suite: "src/quality/quarter-mutants-q26.test.ts",
      why: "Its sibling suite is W349's full run over Q26 — six hundred seconds of subprocess per invocation. Each mutant this module yields would pay that cost, which is the same recursion W349 declared about `quarter-mutants.ts` and for the same reason: a harness whose population contains a harness cannot measure itself inside its own budget. What would lift it is an instrument that runs a suite without spawning the suite's own sweep, not a longer timeout.",
    },
  },
];

/** A module the quarter added that yields no mutant under W296's operators. */
export interface Unmutated {
  module: string;
  why: string;
}

/**
 * Modules in the population that the operators find nothing to change in.
 *
 * DECLARED RATHER THAN INVISIBLE, which is the distinction W349's exclusions were about one level
 * down: a module contributing zero mutants and a module the sweep never reached read identically in
 * a survivor count. This one is in the population, was walked, and simply holds no line any of the
 * five operators matches.
 */
export const UNMUTATED_AT_W362: readonly Unmutated[] = [
  {
    module: "src/console/waiting.ts",
    why: "W346's notice. It holds one exported predicate whose body is three early returns on a discriminated union and two exported constants — no equality against a literal, no boolean operator joining two conditions, no comparison and no arithmetic, which is the whole of W296's operator set. A module with nothing to mutate is a module this instrument says nothing about, and saying so is the difference between that and a module it cleared.",
  },
];

/**
 * The modules this sweep really runs over: the quarter's own, minus what it cannot reach.
 *
 * TAKES THE EXCLUSIONS AND THE RANGE, both of them, because W343's finding was a population
 * function whose arguments could not be varied and W355's was a parameter nobody ever varied.
 */
export function q27Population(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W362,
  range: UnitRange = QUARTER_AT_W362,
): string[] {
  const excused = new Set(excluded.map((e) => e.module));
  return quarterModules(root, range).filter((module) => !excused.has(module));
}

export interface PopulationDefect {
  module: string;
  what: string;
}

/**
 * Where the register and the quarter disagree, in four directions.
 *
 * The arms are W349's, plus one it did not need: a module declared to yield no mutant that now
 * yields some is a record describing a file that has grown a branch, and it reads as coverage.
 */
export function populationDefects(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W362,
  range: UnitRange = QUARTER_AT_W362,
  unmutated: readonly Unmutated[] = UNMUTATED_AT_W362,
): PopulationDefect[] {
  const out: PopulationDefect[] = [];
  const added = quarterModules(root, range);

  for (const { module, reason } of excluded) {
    if (!added.includes(module)) {
      out.push({ module, what: "is excused from the sweep and the quarter did not add it" });
      continue;
    }
    if (reason.kind === "no_sibling_suite" && siblingSuite(root, module) !== null) {
      out.push({ module, what: "is excused as having no sibling suite and has one" });
    }
    if (reason.kind === "runs_the_sweep" && siblingSuite(root, module) !== reason.suite) {
      out.push({ module, what: `is excused as running the sweep and its suite is not ${reason.suite}` });
    }
  }
  for (const module of added) {
    if (siblingSuite(root, module) === null && !excluded.some((e) => e.module === module)) {
      out.push({ module, what: "was added by the quarter, has no sibling suite and nothing excuses it" });
    }
  }
  const recorded = new Set(unmutated.map((u) => u.module));
  for (const { module } of unmutated) {
    if (!added.includes(module)) {
      out.push({ module, what: "is recorded as yielding no mutant and the quarter did not add it" });
    }
  }
  // AND THE OTHER DIRECTION, which W362's own break found missing: a check that only walks the
  // recorded rows says nothing when the record is emptied, so a module the operators fall silent
  // on would join the population and read as measured. Both arms, or the register is a list.
  const excused = new Set(excluded.map((e) => e.module));
  for (const module of added) {
    if (excused.has(module) || recorded.has(module)) continue;
    if (siblingSuite(root, module) === null) continue;
    if (quarterMutants(root, [module]).length === 0) {
      out.push({ module, what: "yields no mutant under the operators and nothing records that" });
    }
  }
  return out.sort((a, b) => `${a.module}${a.what}`.localeCompare(`${b.module}${b.what}`));
}

/**
 * The survivors of the full run over Q27's reachable modules, each with its kind and its argument.
 *
 * W296'S TYPE AND W296'S FOUR KINDS, unchanged for the third quarter: a survivor is a question
 * rather than a verdict, and which of the four it is can only be settled by reading.
 *
 * EMPTY BECAUSE THE RUN FOUND NOTHING LEFT, not because nobody ran it. The survivor W362 did find
 * was fixed in `typed-names.test.ts` rather than recorded here, per W357. An empty survivors
 * register and a harness nobody ever started look identical from outside, so this sentence is the
 * only thing that separates them — W369.
 */
export const SURVIVORS_AT_W362: readonly Survivor[] = [];

/**
 * THE ONE THIS RUN FOUND, AND WHY THE LIST ABOVE IS EMPTY RATHER THAN UNRUN.
 *
 * The run covered every reachable module the quarter added, and exactly one mutant survived: flipping `s.kind === "unit"` to
 * its inverse in `unitFieldTypings` left `typed-names.test.ts` entirely green. The inverted filter
 * returns a WIDER field set — it shares `by`, `id` and `value` with the unit fields — so
 * `looseTwins` still found nothing and the strict-typing floor still cleared. A wrong answer bigger
 * than the right one, passing every assertion over it, which is W353's shape and Q28's theme.
 *
 * W357'S FINDING IS WHY IT IS NOT A ROW. That unit showed remedies get written into survivor
 * registers and never built — four of them, the oldest sitting since W296. So this one was applied
 * in the same unit that found it: `typed-names.test.ts` now names a field only the OTHER kinds
 * carry and requires it to be absent, and the mutant dies. An empty survivor list is a claim, and
 * the run below is what stands behind it.
 */
export const CLOSED_BY_W362 = "src/quality/typed-names.ts :: eq-to-neq :: s.kind === \"unit\"";

/** What a green full run does not prove. */
export const Q27_MUTANT_BOUND =
  "IT RUNS W296'S FIVE OPERATORS, which is not the mutation space: a module can be riddled with " +
  "holes none of the five reaches, and a module they find NOTHING to change in gets no verdict at " +
  "all — `UNMUTATED_AT_W362` records the one this quarter has rather than letting it read as " +
  "cleared. IT MEASURES ONLY WHAT A QUARTER ADDED, and Q27's work was mostly registers of its own " +
  "rather than extensions, which makes this population wider than Q26's and still narrower than " +
  "the quarter: every line the quarter changed in an OLDER module is somebody else's population " +
  "and falls back into W296's standing sample. THE DERIVATION IS THE HEADER, so a module whose " +
  "header names the wrong unit is measured against the wrong quarter and no check here can tell. " +
  "AND A CAUGHT MUTANT IS NOT A TESTED LINE: the suite went red, which says some assertion " +
  "noticed, not that the assertion was about the thing that changed.";

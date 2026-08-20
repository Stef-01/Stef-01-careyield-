// W374: the survivors register over Q28's modules.
//
// W332'S INSTRUMENT, FOURTH QUARTER RUNNING, AND THE POINT IS STILL THE COMPARISON. Q25 and Q26
// each left a handful of survivors a reader had to settle one at a time; Q27's run found exactly
// one and its unit closed it rather than recording it. What a fourth run buys is whether that was
// a trend or a good week.
//
// Q28'S THEME MAKES THIS RUN A PARTICULAR QUESTION. That quarter was about the DIRECTION a check
// fails in, and about making a check loud where its failure moves toward looking correct. A
// mutation run asks exactly that with a different instrument: change a line and see whether
// anything notices. A survivor is a check whose failure direction is toward green, measured rather
// than argued — which is the one thing the quarter's own units could not do for themselves.
//
// AND W362 MADE A PREDICTION THIS RUN CHECKS. It excluded `quarter-mutants-q26.ts` because that
// module's sibling suite IS the Q26 sweep, and wrote down that "the exclusion will be here again
// next quarter unless the instrument changes". It is: `quarter-mutants-q27.ts` is excluded here for
// the same reason, in the same words, one quarter on. A prediction a register made about itself and
// then met is worth more than the exclusion it explains.
//
// THE POPULATION IS THE QUARTER'S OWN MODULES, derived from the unit each header names rather than
// listed, so a module whose header moves leaves the quarter without anybody editing this file. Q28
// added twelve; eleven are reachable and every one of them yields at least one mutant, which is why
// `UNMUTATED_AT_W374` is empty and why `populationDefects` drives that arm rather than trusting it.
//
// WHAT THIS DOES NOT PROVE is `Q28_MUTANT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Mutants are written into a copied tree.

import type { UnitRange } from "./quarter-mutants";
import { quarterModules, quarterMutants } from "./quarter-mutants";
import type { Survivor } from "./mutation-sampling";
import { siblingSuite } from "./mutation-sampling";
import type { Excluded } from "./quarter-mutants-q26";
import type { Unmutated } from "./quarter-mutants-q27";

/** W349's shape, re-exported so a reader of this quarter need not chase two quarters back. */
export type { Excluded };
/** W362's shape, same reason. */
export type { Unmutated };

/** Q28, as the ledger holds it. */
export const QUARTER_AT_W374: UnitRange = { first: 352, last: 364 };

/**
 * The modules Q28 added that this sweep cannot measure, and why.
 *
 * ONE, AND IT IS THE THIRD QUARTER RUNNING THAT IT IS THE SAME ONE. W349 declared the recursion
 * about `quarter-mutants.ts`, W362 declared it about `quarter-mutants-q26.ts` and said it would
 * recur, and here it is about `quarter-mutants-q27.ts`. Each quarter that measures the previous
 * quarter's sweep adds a module whose suite is a sweep, so the population grows one permanent
 * exclusion per quarter — which is a property of the instrument rather than of any of these
 * modules, and is the shape `Q28_MUTANT_BOUND` names.
 */
export const EXCLUDED_AT_W374: readonly Excluded[] = [
  {
    module: "src/quality/quarter-mutants-q27.ts",
    reason: {
      kind: "runs_the_sweep",
      suite: "src/quality/quarter-mutants-q27.test.ts",
      why: "Its sibling suite is W362's full run over Q27 — hundreds of seconds of subprocess per invocation. Each mutant this module yields would pay that cost, which is W349's recursion and W362's, unchanged: a harness whose population contains a harness cannot measure itself inside its own budget. What would lift it is an instrument that runs a suite without spawning the suite's own sweep, not a longer timeout.",
    },
  },
];

/**
 * Modules in the population that the operators find nothing to change in.
 *
 * EMPTY THIS QUARTER, and that is a measurement rather than an omission: all eleven reachable
 * modules yield mutants, the fewest being two. W362 had one such module and recorded it so it could
 * not read as cleared; this quarter has none, and `populationDefects` walks the population looking
 * for one on every run so the emptiness cannot go stale.
 */
export const UNMUTATED_AT_W374: readonly Unmutated[] = [];

/**
 * The modules this sweep really runs over: the quarter's own, minus what it cannot reach.
 *
 * TAKES THE EXCLUSIONS AND THE RANGE, both of them — W343's finding was a population function whose
 * arguments could not be varied and W355's was a parameter nobody ever varied.
 */
export function q28Population(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W374,
  range: UnitRange = QUARTER_AT_W374,
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
 * W362's arms, unchanged, and the fourth is the one that matters most this quarter because
 * `UNMUTATED_AT_W374` is empty: a check that only walked the recorded rows would say nothing at all
 * over an empty register, so a module the operators fall silent on would join the population and
 * read as measured.
 */
export function populationDefects(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W374,
  range: UnitRange = QUARTER_AT_W374,
  unmutated: readonly Unmutated[] = UNMUTATED_AT_W374,
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
 * The survivors of the full run over Q28's reachable modules, each with its kind and its argument.
 *
 * W296'S TYPE AND W296'S FOUR KINDS, unchanged for the fourth quarter: a survivor is a question
 * rather than a verdict, and which of the four it is can only be settled by reading.
 *
 * EMPTY BECAUSE THE RUN CLOSED WHAT IT FOUND, not because nobody ran it — an empty survivors
 * register and a harness nobody started look identical from outside, which is W369's point and why
 * `CLOSED_BY_W374` is beside this one. The four are named there.
 */
export const SURVIVORS_AT_W374: readonly Survivor[] = [];

/**
 * THE FOUR THIS RUN FOUND, AND WHY THE LIST ABOVE IS EMPTY RATHER THAN UNRUN.
 *
 * W357'S FINDING IS WHY THEY ARE NOT ROWS. That unit showed remedies get written into survivor
 * registers and never built — four of them, the oldest sitting since W296 — so W362 applied its one
 * in the unit that found it and this run does the same with all four.
 *
 * TWO ARE ONE LINE, and it is W354's worked example: `readers` is filtered by `f.module !== module
 * && mentions.test(f.text)`, and BOTH halves could be flipped without a red suite. Every assertion
 * over that function read the DIRECTION the count moves, and both mutants move it the same way. A
 * direction is the finding; the reader set is what produces it, and nothing pinned it. The suite
 * now requires that no fact lists its own module as a reader and that no fact is read by nearly the
 * whole tree.
 *
 * THE THIRD IS A LOOKUP NOBODY CHECKED THE IDENTITY OF. `finding(id)` in W360's pass matched
 * `f.id === id`; inverted it returns the first finding that is NOT the one asked for, and the only
 * assertion over it was about a `disposition.kind` the neighbour happened to share.
 *
 * THE FOURTH IS THIS REGISTER'S OWN SUBJECT ARRIVING IN W353's INSTRUMENT, AND IT TOOK TWO GOES.
 * `behaviourOf` answers "narrows" whenever the degenerate reading is not GREATER than the honest
 * one, so a selector that answers the same on both — or nothing on either — reads as narrowing. The
 * first fix required a `narrows` row to narrow strictly, which killed the mutant in this repository
 * and NOT in the sweep: `copyTree` does not copy `.git`, so that row's honest reading came out of an
 * empty log and was zero in the only tree the sweep runs in. The row now takes a fabricated log. A
 * selector whose honest input depends on the ambient tree measures nothing where it is measured,
 * which is a sharper version of the finding than the one the sweep first reported.
 */
export interface Closed {
  /** The mutant, as the sweep names it. */
  id: string;
  /**
   * Where the fix landed, and the distinction is real.
   *
   * NAMED `file` RATHER THAN `fixedIn`, which is W372's register catching this one: the first draft
   * invented a seventh key for a module path, and `handListedRegisters` reads six — so this
   * register was invisible to the register whose subject is registers like it. Using the tree's
   * existing word costs nothing and is the difference between being seen and being missed.
   *
   * A fix in the SUITE leaves the mutated line exactly as it was and adds an assertion over it. A
   * fix in the MODULE replaces the line, so the id above names code the tree no longer holds — and
   * a register that asserted every closed survivor's line still existed would be demanding that no
   * fix ever touch the thing it fixed.
   */
  file: string;
  where: "suite" | "module";
}

export const CLOSED_BY_W374: readonly Closed[] = [
  {
    id: "src/quality/flattering-numbers.ts :: and-to-or :: readers: files.filter((f) => f.module !== module && mentions.test(f.text)).map((f) => f.module),",
    file: "src/quality/flattering-numbers.test.ts",
    where: "suite",
  },
  {
    id: "src/quality/flattering-numbers.ts :: neq-to-eq :: readers: files.filter((f) => f.module !== module && mentions.test(f.text)).map((f) => f.module),",
    file: "src/quality/flattering-numbers.test.ts",
    where: "suite",
  },
  {
    id: "src/quality/hardening-q27.ts :: eq-to-neq :: const found = FINDINGS.find((f) => f.id === id);",
    file: "src/quality/hardening-q27.test.ts",
    where: "suite",
  },
  {
    id: 'src/quality/superset.ts :: eq-to-neq :: honest: (root) => (claimCommit(GIT_LOG(root), "W352") === null ? 0 : 1),',
    file: "src/quality/superset.ts",
    where: "module",
  },
];

/** What a green full run does not prove. */
export const Q28_MUTANT_BOUND =
  "IT RUNS W296'S FIVE OPERATORS, which is not the mutation space: a module can be riddled with " +
  "holes none of the five reaches, and a module they find NOTHING to change in gets no verdict at " +
  "all. IT MEASURES ONLY WHAT A QUARTER ADDED, so every line Q28 changed in an OLDER module — and " +
  "this quarter changed many, because most of its units taught existing registers a new arm — is " +
  "somebody else's population and falls back into W296's standing sample. THE DERIVATION IS THE " +
  "HEADER, so a module whose header names the wrong unit is measured against the wrong quarter and " +
  "no check here can tell. AND A CAUGHT MUTANT IS NOT A TESTED LINE: the suite went red, which " +
  "says some assertion noticed, not that the assertion was about the thing that changed. THE " +
  "EXCLUSION IS PERMANENT AND GROWING, which is the limit this quarter makes visible rather than " +
  "the one it inherits: each quarter that sweeps the previous quarter adds a module whose sibling " +
  "suite is itself a sweep, so the instrument loses exactly one module of its own making every " +
  "time it runs, and no run can measure the run before it.";

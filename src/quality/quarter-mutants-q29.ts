// W386: the survivors register over Q29's modules.
//
// W332'S INSTRUMENT, FIFTH QUARTER RUNNING, AND THE COMPARISON IS THE WHOLE POINT. Q25 and Q26 each
// left a handful of survivors a reader had to settle one at a time; Q27 found one and closed it;
// Q28 found four and closed all four. A fifth run says whether closing-what-you-find has become the
// habit or was two good weeks.
//
// Q29'S THEME MAKES THIS RUN A PARTICULAR QUESTION, and it is the sharpest pairing yet. That
// quarter was about POPULATIONS — which things a check is over, and whether the set it walks is the
// set it claims. A mutation run is the same question asked from underneath: it changes a line and
// asks whether anything notices, which is a measurement of what the suites are ACTUALLY over rather
// than of what they say. W383's pass had already found two of the quarter's registers keyed to a
// spelling their own sibling unit had named; this run asks the complementary question of the same
// modules and does not depend on a reader noticing anything.
//
// W362'S PREDICTION, MET FOR THE THIRD TIME. It excluded `quarter-mutants-q26.ts` because that
// module's sibling suite IS the Q26 sweep, and wrote that the exclusion "will be here again next
// quarter unless the instrument changes". W374 recorded it about `quarter-mutants-q27.ts`; this run
// records it about `quarter-mutants-q28.ts`, in the same words, one quarter on. A register that
// predicted its own future exclusion and has now met that prediction three times is making a claim
// about the instrument rather than an excuse about a module.
//
// THE POPULATION IS THE QUARTER'S OWN MODULES, derived from the unit each header names rather than
// listed, so a module whose header moves leaves the quarter without anybody editing this file. Q29
// added twelve; eleven are reachable, and every one of them yields at least two mutants, which is
// why `UNMUTATED_AT_W386` is empty and why `populationDefects` walks for one on every run rather
// than trusting the emptiness.
//
// WHAT THIS DOES NOT PROVE is `Q29_MUTANT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Mutants are written into a copied tree.

import type { UnitRange } from "./quarter-mutants";
import { quarterModules, quarterMutants } from "./quarter-mutants";
import type { Survivor } from "./mutation-sampling";
import { siblingSuite } from "./mutation-sampling";
import type { Excluded } from "./quarter-mutants-q26";
import type { Unmutated } from "./quarter-mutants-q27";
import type { Closed } from "./quarter-mutants-q28";

/** W349's shape, re-exported so a reader of this quarter need not chase three quarters back. */
export type { Excluded };
/** W362's shape, same reason. */
export type { Unmutated };
/** W374's shape, same reason — and shared rather than redeclared, which is W341's rule. */
export type { Closed };

export const QUARTER_AT_W386: UnitRange = { first: 365, last: 377 };

/**
 * The modules Q29 added that this sweep cannot measure, and why.
 *
 * ONE, AND IT IS THE FOURTH QUARTER RUNNING THAT IT IS THE SAME ONE. W349 declared the recursion
 * about `quarter-mutants.ts`, W362 declared it about `quarter-mutants-q26.ts` and predicted it
 * would recur, W374 recorded it about `quarter-mutants-q27.ts`, and here it is about
 * `quarter-mutants-q28.ts`. Each quarter that measures the previous quarter's sweep adds a module
 * whose suite is a sweep, so the population loses exactly one module per quarter — a property of
 * the instrument rather than of any of these modules, and the shape `Q29_MUTANT_BOUND` names.
 */
export const EXCLUDED_AT_W386: readonly Excluded[] = [
  {
    module: "src/quality/quarter-mutants-q28.ts",
    reason: {
      kind: "runs_the_sweep",
      suite: "src/quality/quarter-mutants-q28.test.ts",
      why: "Its sibling suite is W374's full run over Q28 — hundreds of seconds of subprocess per invocation, and the longest single file in this tree's gate. Each mutant this module yields would pay that cost, which is W349's recursion, W362's and W374's, unchanged: a harness whose population contains a harness cannot measure itself inside its own budget. What would lift it is an instrument that runs a suite without spawning the suite's own sweep, not a longer timeout. AND THE PREDICTION IS RE-ISSUED HERE, because W374 met W362's and did not pass it on: the exclusion will be here again next quarter, about this module's own sibling, unless that instrument arrives. A prediction that stops being restated is a limit that gets rediscovered instead of tracked.",
    },
  },
];

/**
 * Modules in the population that the operators find nothing to change in.
 *
 * ONE, AND THIS RUN MADE IT ITSELF — which is worth more than the empty list it replaced. Every one
 * of the eleven reachable modules yielded mutants when the sweep started; `hardening-q28.ts` yielded
 * two, both from its private copy of `finding(id)`, and one of those was a survivor. Closing it by
 * SHARING the lookup rather than copying the fix a third time removed the only lines in that module
 * the five operators can reach, so a module that had a verdict now has none.
 *
 * THAT IS THE BOUND'S FIRST CLAUSE ARRIVING FROM AN UNEXPECTED DIRECTION. "A module they find
 * nothing to change in gets no verdict at all" was written about modules that happen to hold no
 * comparison; here the sweep's own remedy produced one. The right fix and the loss of measurement
 * are the same edit, and nothing about that is avoidable — a pass record that reported this as a
 * clean quarter with an empty unmutated list would be hiding it.
 */
export const UNMUTATED_AT_W386: readonly Unmutated[] = [
  {
    module: "src/quality/hardening-q28.ts",
    why: "Q29's pass record: findings, dispositions, the units read, and a `finding(id)` that was its only line any of the five operators could reach. W386's sweep found the identity mutant in that lookup — the same one W374 closed one quarter earlier in Q27's copy of the same function — and closed it by moving the function to `hardening-q22.ts` where all three passes share it. What is left here is a register of literals: a range, two string lists, an array of findings and a bound. No comparison, no conjunction, no threshold, so the operators find nothing and this module has no verdict from this instrument until it grows one.",
  },
];

/**
 * The modules this sweep really runs over: the quarter's own, minus what it cannot reach.
 *
 * TAKES THE EXCLUSIONS AND THE RANGE, both of them — W343's finding was a population function whose
 * arguments could not be varied and W355's was a parameter nobody ever varied.
 */
export function q29Population(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W386,
  range: UnitRange = QUARTER_AT_W386,
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
 * W362's arms, and the fourth is again the one that matters because `UNMUTATED_AT_W386` is empty: a
 * check that only walked the recorded rows would say nothing at all over an empty register, so a
 * module the operators fall silent on would join the population and read as measured.
 */
export function populationDefects(
  root: string,
  excluded: readonly Excluded[] = EXCLUDED_AT_W386,
  range: UnitRange = QUARTER_AT_W386,
  unmutated: readonly Unmutated[] = UNMUTATED_AT_W386,
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
 * The survivors of the full run over Q29's reachable modules, each with its kind and its argument.
 *
 * W296'S TYPE AND W296'S FOUR KINDS, unchanged for the fifth quarter: a survivor is a question
 * rather than a verdict, and which of the four it is can only be settled by reading.
 *
 * EMPTY BECAUSE THE RUN CLOSED WHAT IT FOUND, not because nobody ran it — an empty survivors
 * register and a harness nobody started look identical from outside, which is W369's point and why
 * `CLOSED_BY_W386` is beside this one. The five are named there.
 */
export const SURVIVORS_AT_W386: readonly Survivor[] = [];

/**
 * THE FIVE THIS RUN FOUND, AND WHY THE LIST ABOVE IS EMPTY RATHER THAN UNRUN.
 *
 * W357'S FINDING IS WHY THEY ARE NOT ROWS. That unit showed remedies get written into survivor
 * registers and never built — four of them, the oldest sitting since W296 — so W362 applied its one
 * in the unit that found it, W374 did the same with all four of its own, and this run does the same
 * with all five.
 *
 * ONE OF THEM IS THE SAME MUTANT W374 ALREADY CLOSED, AND THAT IS THIS RUN'S REAL FINDING. Q28's
 * pass had `finding(id)` matching `f.id === id`; inverted, it returns the first finding that is NOT
 * the one asked for, and every caller reads `disposition.kind` off the result, which the neighbour
 * usually shares. W374's sweep found exactly this in Q27's copy of the function and closed it in
 * Q27's SUITE. One quarter later the identical mutant is alive in Q28's copy, because a fix applied
 * to one copy is not applied to the copy beside it — and a sweep can only ever see the copy that
 * happens to fall inside the quarter it is measuring. There were three copies. There is one
 * function now, `findingIn` in `hardening-q22.ts`, pinned once in that module's suite and on all
 * three passes, so a fourth pass inherits the pin rather than the hole. W386's own reason for
 * existing is on the line here: a survivors register that closes instances and not classes buys the
 * next quarter's sweep the same finding again.
 *
 * TWO ARE ONE PROBE, AND BOTH ARE W293's RULE INSIDE A HORIZON ARM. W367's gate row built its
 * declared marker by filtering the real `MARKERS` for an unrelated module and relabelling it, then
 * read the answer with `.some((d) => d.module === …)`. Neither comparison could be inverted with a
 * test noticing: ANY marker relabelled to the planted module serves as well as that one, and the
 * `.some` runs over a list that is empty in precisely the case it is asked about, where every
 * predicate answers false. The probe plants its own marker and reads a length now, so both arms are
 * its own and neither borrows a fact about a module it is not testing.
 *
 * TWO ARE ONE CONJUNCTION IN W371's DYNAMIC-ROUTE MATCHER. A dynamic route counts as reached when
 * something links BELOW its prefix — `t.startsWith(prefix) && t !== prefix` — and widening that
 * `&&` to `||` makes it true for essentially every target. The suite stayed green because every
 * case in it linked something, and none asserted the shape that must read as UNLINKED: a link to
 * the bare prefix, where the parent page exists and nothing reaches an instance. That case is
 * driven now, beside the one that must read as linked.
 */
export const CLOSED_BY_W386: readonly Closed[] = [
  {
    id: "src/quality/hardening-q28.ts :: eq-to-neq :: const found = FINDINGS.find((f) => f.id === id);",
    file: "src/quality/hardening-q22.ts",
    where: "module",
  },
  {
    id: 'src/quality/horizon-q29-gate.ts :: eq-to-neq :: const marker = MARKERS.filter((m) => m.module === "src/quality/private-copies.ts").map((m) => ({',
    file: "src/quality/horizon-q29-gate.ts",
    where: "module",
  },
  {
    id: 'src/quality/horizon-q29-gate.ts :: eq-to-neq :: nonMemberSeen: censusDefects(marker, site).some((d) => d.module === "src/planted/scanner.ts"),',
    file: "src/quality/horizon-q29-gate.ts",
    where: "module",
  },
  {
    id: "src/quality/reached-pages.ts :: and-to-or :: return [...links.keys()].some((t) => t.startsWith(prefix) && t !== prefix);",
    file: "src/quality/reached-pages.test.ts",
    where: "suite",
  },
  {
    id: "src/quality/reached-pages.ts :: and-to-or :: return [...opened].some((t) => t.startsWith(prefix) && t !== prefix);",
    file: "src/quality/reached-pages.test.ts",
    where: "suite",
  },
];

/** What a green full run does not prove. */
export const Q29_MUTANT_BOUND =
  "IT RUNS W296'S FIVE OPERATORS, which is not the mutation space: a module can be riddled with " +
  "holes none of the five reaches, and a module they find NOTHING to change in gets no verdict at " +
  "all. IT MEASURES ONLY WHAT A QUARTER ADDED, so every line Q29 changed in an OLDER module — and " +
  "this quarter changed many, because most of its units taught existing registers a new arm — is " +
  "somebody else's population and falls back into W296's standing sample. THE DERIVATION IS THE " +
  "HEADER, so a module whose header names the wrong unit is measured against the wrong quarter and " +
  "no check here can tell. AND A CAUGHT MUTANT IS NOT A TESTED LINE: the suite went red, which " +
  "says some assertion noticed, not that the assertion was about the thing that changed. THE " +
  "EXCLUSION IS PERMANENT AND GROWING, inherited and re-met rather than newly found: each quarter " +
  "that sweeps the previous quarter adds a module whose sibling suite is itself a sweep, so the " +
  "instrument loses one module of its own making every time it runs, and no run can measure the " +
  "run before it. AND THE COST IS NOW PART OF THE LIMIT: this file's sibling suite joins a gate " +
  "that already carries four of these sweeps, each hundreds of seconds of subprocess, which is why " +
  "the growth above is not merely untidy — the instrument that would lift the exclusion is the " +
  "same one that would make the gate affordable, and neither exists.";

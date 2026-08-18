// W339: a bound that names a failure nothing reads.
//
// EVERY REGISTER IN THIS TREE STATES A BOUND, and a bound's job is to say what a green check does
// not prove. That makes each one a specification: *here is a condition, and nothing reports it.*
// Written down, in a sentence the tree requires, and read by people.
//
// TWICE IN TWO QUARTERS SOMETHING WALKED THROUGH A DOOR A BOUND HAD NAMED.
//
//   W328. `PLANTING_BOUND` said *a helper in a non-test module is invisible to it* — and W322's
//   write into the repository came from `declaration-tax.ts`, driven by `manifest.ts`, both register
//   modules. The excused class exactly, in the sentence that excused it.
//
//   W331. The same bound said *a suite that forgets its `afterAll` leaks a temporary directory,
//   which no register here reads.* Four callers had forgotten and the build box was holding 426
//   copies and 3.6 GB of `/tmp`. The sentence was right, and had been right for a quarter.
//
// A BOUND IS A CLAIM WITH NO CLOCK ON IT. W294 gave acceptances a review date and W318 gave
// deferrals a unit; a bound has neither, so it can be accurate on the day it ships and describe a
// door somebody walked through a quarter later, and nothing anywhere goes back to look.
//
// SO THE POPULATION IS DERIVED AND THE CLASSIFICATION IS DECLARED. A bound whose sentence contains
// one of `GAP_PHRASES` is naming something it cannot see; nineteen of the tree's bounds do. Each
// gets a row saying which of three things is true — a check reads it now, a check could be written
// and is owed to a named unit, or nothing could report it. The third is the honest majority and it
// is the one to watch grow, which is why it argues itself every time.
//
// THE RULE IS A SENTENCE AND CANNOT BE OTHERWISE. Whether a condition is OBSERVABLE is a judgement
// about what a program could be written to see, and `UNREAD_RULE` states it for a reader. What is
// mechanical is that every bound naming a gap has a row, that the quoted condition is still in the
// sentence, and that a `read_by` names an export the tree really has.
//
// WHAT THIS DOES NOT PROVE is `UNREAD_BOUND`, exported below and read by W297's register — which
// makes this register subject to itself, and its own row says so.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the tree's own bounds.

import { readFileSync } from "node:fs";
import path from "node:path";
// TYPE-ONLY, AND THAT IS THE WHOLE OF IT. `bounds.ts` imports `UNREAD_BOUND` from here to put it
// in `STATED_BOUNDS`, so a value import in this direction is a cycle — and W305 recorded exactly
// what that costs: whichever module loads second sees the other's constants as `undefined`, so the
// bound entries came out with `text: undefined` and the phrase scan crashed on the first row. The
// bounds are a PARAMETER instead, which is W289's rule and removes the cycle rather than ordering
// around it.
import type { StatedBound } from "./bounds";

/**
 * The rule, stated so a reader can apply it to a bound this register cannot judge.
 *
 * Deliberately a sentence, for W317's reason: the mechanical half is a phrase scan, and a rule
 * narrowed to what a scan can see would have missed both instances that produced this unit — each
 * was found by somebody reading a sentence they had themselves written a quarter earlier.
 */
export const UNREAD_RULE =
  "A bound names a CONDITION when its sentence describes a state this tree could be in and says " +
  "nothing reports it. Ask two questions of every such sentence, in order. First: could a check be " +
  "written that reports the condition by reading what this repository contains? If the answer is " +
  "no — because the condition is an input nobody has thought of, or a judgement about what a " +
  "sentence means — the bound is doing all the work available and the row says so. If the answer " +
  "is yes, ask the second question: is it written? A bound whose answer is yes and no is a " +
  "specification for a check somebody decided not to write, and it will read as a caveat until the " +
  "day something walks through it. Both instances that produced this unit were of that shape, and " +
  "in both the sentence was accurate and a quarter old.";

/**
 * The phrases a bound uses when it is naming something nothing sees.
 *
 * A CLOSED VOCABULARY AND ITS OWN LIMIT. This tree writes its bounds in a house style — `invisible`
 * to it, `no register` reads it, the sweep `cannot see` — so the population is derivable. A bound
 * that names a gap in words not here is outside this register, which is the class of bound W267
 * states about `readdirSync` and has the same remedy: the vocabulary grows and says so.
 */
export const GAP_PHRASES: readonly string[] = [
  "invisible",
  "nothing here reads",
  "no register",
  "nothing notices",
  "cannot see",
  "would report the tree clean",
  "nothing reads",
  "no check",
  "nothing checks",
  "no sweep",
  "nothing in this tree",
];

/** How a named condition stands. */
export type ConditionReading =
  /** A check reports it today. `check` is `module::export` and is resolved against the module. */
  | { kind: "read_by"; check: string; how: string }
  /**
   * A check could be written and is not, and a unit is named for it.
   *
   * W318's clock, applied to a bound. The unit must exist and must not have landed — `unread-bounds`
   * borrows W329's standing check for that, because a promise aimed at a finished unit is the defect
   * W329 removed from deferrals and there is no reason a bound should get to keep it.
   */
  | { kind: "owed"; by: `W${number}`; why: string }
  /** Nothing could report it. The honest majority, and the one to watch. */
  | { kind: "not_observable"; why: string };

/** One condition a bound names, with where it stands. */
export interface NamedCondition {
  /** `module::NAME`. */
  bound: string;
  /** A phrase from the bound's own sentence, resolved against its text — W258's rule. */
  condition: string;
  reading: ConditionReading;
}

/**
 * Every condition the tree's bounds name, classified.
 *
 * ONE ROW PER CONDITION RATHER THAN PER BOUND, because `PLANTING_BOUND` names three and two of them
 * are the instances this unit exists for. A register keyed to bounds would have folded the finding
 * into a sentence about a file.
 */
export const NAMED_CONDITIONS: readonly NamedCondition[] = [
  {
    bound: "src/quality/unasked-facts.ts::UNASKED_BOUND",
    condition: "asked for by somebody this register cannot see",
    reading: {
      kind: "not_observable",
      why: "The condition is that a fact reached through syntax the parse does not read — a namespace import, a dynamic `import()`, a re-export shape it misses — is reported unasked. Nothing can report THAT, and the reason is not effort: knowing this register missed a reader means having resolved the reader, and a thing that resolved the reader would not have missed it. The remedy is a wider parse, which closes the gap rather than reporting it, and the sentence would still be true afterwards of whatever the wider parse misses — W267's class about `readdirSync`, arriving in an import graph.",
    },
  },
  {
    bound: "src/quality/unasked-facts.ts::UNASKED_BOUND",
    condition: "is invisible here, which is the larger half of the tree",
    reading: {
      kind: "not_observable",
      why: "The condition is a derivation nobody asks for in a module no route reaches. Widening the population to the whole tree is trivial and would report several hundred functions — nearly every quality register exports for its own suite and is right to. What makes one of those a DEFECT is that the module ought to be served, and that is a judgement about the product rather than a property of the import graph. So the condition is real, and no check can read it: the reading is the same one W340 makes seventy-one times by hand in the population it did take.",
    },
  },
  {
    bound: "src/quality/planting.ts::PLANTING_BOUND",
    condition: "a suite that forgets its `afterAll` leaks a temporary directory, which no register here reads",
    reading: {
      kind: "read_by",
      check: "src/quality/repository-clean.ts::artefactsPresent",
      how: "W331 built the sweep after four callers had forgotten and the box held 426 copies. The condition is reported now; the sentence was accurate for a quarter and read by nobody, which is the first of the two instances that produced this register.",
    },
  },
  {
    bound: "src/quality/planting.ts::PLANTING_BOUND",
    condition: "A stated bound names a way in, and nothing in this tree notices the day something walks through it",
    reading: {
      kind: "read_by",
      check: "src/quality/unread-bounds.ts::conditionDefects",
      how: "THIS REGISTER, and the sentence is the reason it exists — W328 wrote it after finding the first instance and W331 quoted it after finding the second. A bound naming a gap now has a row that must say whether anything reads it, so the day something walks through is the day a row goes stale rather than a quarter later.",
    },
  },
  {
    bound: "src/quality/planting.ts::PLANTING_BOUND",
    condition: "A plant written with `fs/promises`, an `appendFileSync` or a shell-out is invisible to it",
    reading: {
      kind: "not_observable",
      why: "The W267 `readdirSync` class: a write spelled a way the sweep does not scan for. Widening the scan is a unit and would leave the same sentence true of whatever the wider version misses, so no check reports *a plant written some way nobody anticipated*.",
    },
  },
  {
    bound: "src/quality/closing-state.ts::CLOSING_BOUND",
    condition: "a fourth row-dependent check written the same welded way is invisible here",
    reading: {
      kind: "read_by",
      check: "src/quality/close-gate.ts::weldedLedgerTests",
      how: "W326 named the welded ledger-reading test files rather than leaving the limit as a sentence, so a fourth one arrives in a list somebody can shorten. The bound's wording predates that and still reads as though nothing looks.",
    },
  },
  {
    bound: "src/quality/close-gate.ts::CLOSE_GATE_BOUND",
    condition: "A check welded inside a `.test.ts` exports nothing, so no register here can run it against a planted ledger",
    reading: {
      kind: "read_by",
      check: "src/quality/close-gate.ts::weldedLedgerTests",
      how: "The same list, in the bound that built it. Reaching those checks still needs W289's remedy; what is read is WHICH ones are unreachable, which is the part a reader can act on.",
    },
  },
  {
    bound: "src/quality/register-counts.ts::COUNT_BOUND",
    condition: "It also says nothing about counts in PROSE",
    reading: {
      kind: "read_by",
      check: "src/quality/prose-numbers.ts::claimDefects",
      how: "W314 built exactly this and the sentence was never updated — a bound describing a gap the tree closed two quarters ago. The clearest instance of what a claim with no clock does: it stays accurate about its own register and false about the tree.",
    },
  },
  {
    bound: "src/quality/scan-text.ts::SCAN_BOUND",
    condition: "A scan added tomorrow that reads raw text without saying why is invisible here",
    reading: {
      kind: "read_by",
      check: "src/quality/scan-text.ts::scanSiteDiff",
      how: "The register's own both-directions diff reports a module that starts preparing text and is not declared. What the sentence is really about is a scan that reads RAW text and never asks for the preparation, which the diff cannot see — but the arriving-scan half is read, and the row splits the two rather than leaving the sentence to carry both.",
    },
  },
  {
    bound: "src/quality/dossier-derived.ts::DOSSIER_BOUND",
    condition: "a cell naming an id the ledger does not hold is INVISIBLE here",
    reading: {
      kind: "owed",
      by: "W342",
      why: "W342 resolves every register field that names a unit, a module or an export against the tree, which is this condition one level up. W338 already re-typed this bound from `inherent` to `remedy` for it, so the promise is made in two places and the unit is one that must answer it.",
    },
  },
  {
    bound: "src/quality/deferrals.ts::DEFERRAL_BOUND",
    condition: "A hardening pass whose findings never reach `allHardeningFindings` is invisible here",
    reading: {
      kind: "owed",
      by: "W340",
      why: "A hardening register nobody passes in has ZERO readers, which is W340's subject read from the low end: it derives every exported list by how many modules call it, and a finding register reaching none is the case its own gate is about.",
    },
  },
  {
    bound: "src/quality/self-ending.ts::ENDING_BOUND",
    condition: "a sentence in a header saying a thing holds until some unit lands is still a declaration with an event in it and still nothing reads it",
    reading: {
      kind: "owed",
      by: "W350",
      why: "A wait written in prose is a claim in prose, which is what W350 re-reads: every claim the horizon makes about a fact the tree holds, read by a check or declared unread. W318 typed the FIELD and left the paragraph, and this is the paragraph.",
    },
  },
  {
    bound: "src/quality/unrun.ts::UNRUN_BOUND",
    condition: "a require, a path built at runtime, or a dynamic import written with a relative specifier is invisible",
    reading: {
      kind: "not_observable",
      why: "A path BUILT AT RUNTIME cannot be resolved by reading source at all, and the sentence bundles it with two shapes that could be scanned. Splitting the row would leave the unscannable half saying the same thing, so the bound is doing the work available — and W333's own first draft named two modules as unrun that a suite reached by exactly that route, which is the sentence earning its place.",
    },
  },
  {
    bound: "src/quality/controls.ts::CONTROL_BOUND",
    condition: "a control nobody planned is not ungoverned here, it is invisible",
    reading: {
      kind: "not_observable",
      why: "The gate reads a planning document, and `control` has no derivation independent of it: every candidate definition — an exported check, a register, a test — is broader than what the horizon means, so a scan would report hundreds of things nobody called controls. Naming what counts is the judgement the document exists to record.",
    },
  },
  {
    bound: "src/quality/controls.ts::CONTROL_BOUND",
    condition: "whether a sentence about what a moment cannot see is accurate is a judgement",
    reading: {
      kind: "not_observable",
      why: "Reading a sentence for truth rather than presence. W295 does the nearest observable thing — plant a witness and require silence — and it reaches only registers whose detector is callable, which is a narrower claim than the one this clause makes.",
    },
  },
  {
    bound: "src/quality/claim-classes.ts::CLAIM_CLASS_BOUND",
    condition: "whether the sentence ARGUES what the answer says it argues is a judgement no check makes",
    reading: {
      kind: "not_observable",
      why: "The quote is resolved against the document, which is presence; whether the quoted sentence supports the conclusion drawn from it is a reading. A horizon rewritten to suit an answer satisfies every mechanical check available and that is what the bound says.",
    },
  },
  {
    bound: "src/quality/self-defeating.ts::REMEDY_BOUND",
    condition: "Nothing here reads a fix and asks whether it carries its own defect",
    reading: {
      kind: "not_observable",
      why: "W317's own subject: whether a mechanism has a defect's defining property is a judgement over arbitrary code. The register catches one SHAPE and says so, and the rule beside it is written for a reader precisely because the general question has no scan.",
    },
  },
  {
    bound: "src/quality/self-defeating.ts::REMEDY_BOUND",
    condition: "THE SWEEP CANNOT SEE MORE THAN `assertionsIn` RETURNS, which is not proven exhaustive",
    reading: {
      kind: "not_observable",
      why: "A parser being exhaustive is a property of the parser, not a state of the tree, and W317 has a demonstration that this one is not: an assertion visible by eye that the parse did not return, with the responsible shape not reproducible in a fixture. Nothing can report *the parse missed something* without a second parser nobody has written.",
    },
  },
  {
    bound: "src/founder/outstanding.ts::FOUNDER_BOUND",
    condition: "nothing checks that a blocker is the right blocker",
    reading: {
      kind: "not_observable",
      why: "A correct attribution and a mistaken one are the same text in the same column, which W311 established when it re-typed this bound `inherent` rather than leaving a remedy nobody could build. It takes somebody reading the unit and disagreeing.",
    },
  },
  {
    bound: "src/quality/quarter-mutants.ts::QUARTER_MUTANT_BOUND",
    condition: "a module whose header names the wrong unit is in the wrong quarter's population and no check can tell",
    reading: {
      kind: "not_observable",
      why: "W281 resolves the header's unit against the ledger, which is existence. Which unit actually wrote a file is in the commit record and not in the tree, so nothing reading this repository's contents can contradict a header that names a real unit that did not write it.",
    },
  },
  {
    bound: "src/quality/assertion-vocabulary.ts::VOCABULARY_BOUND",
    condition: "A spelling nobody has thought of yet is invisible",
    reading: {
      kind: "not_observable",
      why: "The W267 `readdirSync` class, named as such in the sentence itself. No check reports the existence of a spelling its author did not anticipate; the register grows when one arrives, which is a remedy for the instance rather than for the class.",
    },
  },
  {
    bound: "src/quality/citations.ts::CITATION_BOUND",
    condition: "A register that parses the format with an index, a regex or a destructuring helper is invisible to it",
    reading: {
      kind: "not_observable",
      why: "The same class. The sweep reads one call shape and a fourth implementation written some other way is outside it, which is why W301's consolidation is held by a sweep for the shape it removed rather than by a claim about all of them.",
    },
  },
  {
    bound: "src/quality/self-reference.ts::SELF_REFERENCE_BOUND",
    condition: "a fragment table assembled some third way is invisible to it",
    reading: {
      kind: "not_observable",
      why: "The same class again, and this one is measured: the sweep sees two written shapes because the tree held two, and W295's fixtures split their tokens rather than the sweep widening to guess a third.",
    },
  },
  {
    bound: "src/quality/prose-numbers.ts::PROSE_BOUND",
    condition: "A claim phrased any other way is invisible to it",
    reading: {
      kind: "not_observable",
      why: "A number is a claim only when it counts something the vocabulary names, and a sentence claiming a quantity without one — *as many entries as the census* — is outside any scan keyed to nouns. The vocabulary grows when a countable thing arrives, which the register says and does.",
    },
  },
  {
    bound: "src/quality/register-counts.ts::COUNT_BOUND",
    condition: "A register size pinned to a constant, to an arithmetic expression or to another register's length is invisible to it",
    reading: {
      kind: "not_observable",
      why: "The W267 class, and W290's own register carries the argued instances rather than the sweep widening to catch every arithmetic form. A pin written as `N - 1` is a pin the sweep does not read and no check reports the ones nobody has written yet.",
    },
  },
  {
    bound: "src/quality/tautology-sweep.ts::SWEEP_BOUND",
    condition: "A tautology that needs a TYPE to see it is invisible here",
    reading: {
      kind: "not_observable",
      why: "The sweep reads text and the condition is a fact about types — a const whose initialiser fixes it, a generic that collapses to a literal. Reporting it needs a type checker walking assertions, which is a different tool rather than a wider regex.",
    },
  },
  {
    bound: "src/quality/tautology-sweep.ts::SWEEP_BOUND",
    condition: "the same assertion written through a helper, or through a further assignment, is invisible to it",
    reading: {
      kind: "not_observable",
      why: "W316 follows ONE hop by design, because following arbitrarily many is dataflow analysis. The operations it trusts are a declared list for the same reason, and W331 found the flat binding map behind it reporting a real assertion as a tautology — widening the walk makes that class worse rather than better.",
    },
  },
  {
    bound: "src/quality/unread-bounds.ts::UNREAD_BOUND",
    condition: "a bound naming a gap in words this vocabulary does not hold is outside this register",
    reading: {
      kind: "not_observable",
      why: "THIS REGISTER'S OWN ROW, and it belongs here for the reason W305's manifest carries itself: a register that quietly omitted itself would be the omission it exists to report. The condition is the W267 class one more time — a house style is a convention, and a bound written outside it names its gap in words no scan was told about.",
    },
  },
];

/** Bounds whose sentence names something nothing sees. */
export function boundsNamingAGap(bounds: readonly StatedBound[]): StatedBound[] {
  return bounds.filter((b) => GAP_PHRASES.some((p) => b.text.toLowerCase().includes(p)));
}

export interface ConditionDefect {
  bound: string;
  what: string;
}

/**
 * The register against the tree's bounds, in four directions.
 *
 * A bound naming a gap with no row; a row whose quoted condition its bound no longer contains; a
 * `read_by` naming an export the module does not have; and a row for a bound the tree has dropped.
 */
export function conditionDefects(
  root: string,
  bounds: readonly StatedBound[],
  declared: readonly NamedCondition[] = NAMED_CONDITIONS,
): ConditionDefect[] {
  const out: ConditionDefect[] = [];
  const byId = new Map(bounds.map((b) => [`${b.module}::${b.name}`, b]));
  const rowed = new Set(declared.map((c) => c.bound));

  for (const bound of boundsNamingAGap(bounds)) {
    const id = `${bound.module}::${bound.name}`;
    if (!rowed.has(id)) out.push({ bound: id, what: "names a gap and no row says whether anything reads it" });
  }

  for (const row of declared) {
    const bound = byId.get(row.bound);
    if (bound === undefined) {
      out.push({ bound: row.bound, what: "is a row here and the tree states no such bound" });
      continue;
    }
    if (!bound.text.includes(row.condition)) {
      out.push({ bound: row.bound, what: `quotes a condition the bound no longer states: "${row.condition.slice(0, 60)}"` });
    }
    if (row.reading.kind === "read_by") {
      const [module, name] = row.reading.check.split("::");
      let body = "";
      try {
        body = readFileSync(path.join(root, module ?? ""), "utf8");
      } catch {
        out.push({ bound: row.bound, what: `is read by \`${row.reading.check}\`, whose module is not in the tree` });
        continue;
      }
      if (!new RegExp(`export (function|const) ${name}\\b`).test(body)) {
        out.push({ bound: row.bound, what: `is read by \`${row.reading.check}\`, which ${module} does not export` });
      }
    }
  }
  return out.sort((a, b) => `${a.bound}${a.what}`.localeCompare(`${b.bound}${b.what}`));
}

/** What a green register does not prove. */
export const UNREAD_BOUND =
  "The population is a phrase scan over a house style, so a bound naming a gap in words this " +
  "vocabulary does not hold is outside this register — the class W267 states about `readdirSync`, " +
  "with the same remedy: the vocabulary grows and says so. AND THE CLASSIFICATION IS THE " +
  "JUDGEMENT. Whether a condition could be reported by reading this repository is a question about " +
  "programs nobody has written, so `not_observable` is an argument rather than a derivation, and it " +
  "is the majority of the rows — which makes it the class to watch, exactly as `inherent` is in " +
  "W297's register and for the same reason: it can never go stale. A row wrongly filed there " +
  "retires a real specification and nothing here can tell. What the register does buy is that the " +
  "sentence and the answer sit beside each other, so a gap the tree closes leaves a row saying " +
  "somebody reads it rather than a paragraph still claiming nobody does — which W339 found to be " +
  "the case for several of them on the day it was written.";

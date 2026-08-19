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
    bound: "src/quality/quarter-mutants-q27.ts::Q27_MUTANT_BOUND",
    condition: "a module they find NOTHING to change in gets no verdict at all",
    reading: {
      kind: "read_by",
      check: "src/quality/quarter-mutants-q27.ts::populationDefects",
      how: "THE GAP THE SENTENCE NAMES IS THE ONE THING HERE THAT IS READ. `populationDefects` walks the population, builds each module's mutants, and reports any module yielding none that `UNMUTATED_AT_W362` does not record — both directions, so a module falling silent joins the register and a record for a module that has grown a branch fails. The clause exists because a survivor count cannot tell an unmutated module from a cleared one; what closes it is that the register cannot go quiet without the build stopping. The bound's OTHER clauses — five operators, the quarter-only population, a caught mutant not being a tested line — are inherent to the instrument and are argued as such in `escape-hatches.ts`.",
    },
  },
  {
    bound: "src/console/zero-meaning.ts::ZERO_MEANING_BOUND",
    condition: "a page that renders a number some other way is outside the population entirely",
    reading: {
      kind: "owed",
      by: "W371",
      why: "The gap is real and the tree already holds one instance of it: `/console/referrals` renders its day-two emptiness as a LIST, so the page's most important zero is not in this population and is covered only because W346's register holds the route. What would read it is a derivation of what a COMPONENT renders rather than of what an expression is called — `ZERO_MEANING_BOUND` names it as the remedy and `bounds.ts` carries the predicate that goes false when somebody builds it. W361 OWED THIS TO W363 AND W363 DID NOT ANSWER IT: that unit re-read which way each named check fails, which is a different question from what a check is over, and W339's clock fired the moment it landed. Re-pointed at W371, whose own gate is the link graph — the derivation this condition has been waiting for.",
    },
  },
  {
    bound: "src/quality/hardening-q27.ts::Q27_HARDENING_BOUND",
    condition: "the kind a reader does not notice missing",
    reading: {
      kind: "not_observable",
      why: "The condition is that a pass's own completeness cannot be checked — it reports what one reader saw in one range of diff, and Q27's theme is an answer the tree holds that nothing reads. Nothing could report THAT about a review: knowing the pass missed a finding means having the finding, and a check that had it would be the pass. A second reader is a different pass rather than an observation of this one's gap, and the tree's own registers are exactly the instrument the defect hides from — every one of them found the quarter green. The nearest thing to a remedy is what W349 and W352 already are: a mutation sweep and a driving test finding what a reader did not, one quarter late.",
    },
  },
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
    bound: "src/quality/horizon-claims.ts::HORIZON_CLAIM_BOUND",
    condition: "a claim written plainly is invisible here",
    reading: {
      kind: "not_observable",
      why: "Reading every sentence of a planning document would mean deciding which prose is a claim about the tree, which is a judgement rather than a derivation — the class this tree has refused three times, in W168's folds named in comments, W288's assertions quoted in fixtures and W295's patterns quoted inside a bound. What the register uses instead is the AUTHOR'S OWN emphasis, so the population is chosen by whoever wrote the document rather than by whoever audits it, and a plain claim somebody wants read gets bolded rather than argued about.",
    },
  },
  {
    bound: "src/quality/horizon-claims.ts::HORIZON_CLAIM_BOUND",
    condition: "nothing here notices the day one of them becomes checkable",
    reading: {
      kind: "not_observable",
      why: "A claim moves from `unread` to checkable when somebody writes a check that reads it, and no derivation can notice a check that does not exist yet — it would have to know which future assertion answers which sentence. What the tree does instead is put the review on a clock the plan already runs: the next quarter's expansion re-reads this gate, which is the same posture W294 takes with an acceptance's review date rather than a watcher.",
    },
  },
  {
    bound: "src/quality/timelines.ts::TIMELINE_BOUND",
    condition: "a sentence claiming an order and never declared here is unread",
    reading: {
      kind: "not_observable",
      why: "An order claim is a sentence in English — *since W89*, *the second quarter running*, *W310 fixed it and the copies kept the old answer* — and finding them by shape would mean deciding which prose is a claim about the commit record, which is a reading rather than a derivation. The tree has refused that class of scan three times for the same reason: a detector that half-understands prose reports confidently about sentences nobody meant that way, and the remedy is worse than the gap. What IS derivable, and what this register does, is check the ones somebody wrote down — so the population grows by a reader noticing rather than by a walk, and the bound's own predicate reads that growth.",
    },
  },
  {
    bound: "src/quality/timelines.ts::TIMELINE_BOUND",
    condition: "if the state arrived in a different commit the register will confirm a wrong claim precisely",
    reading: {
      kind: "not_observable",
      why: "The register resolves the commit a claim NAMES and reads its date; whether that commit is really where the state arrived is a judgement about a diff, which is the same limit W310's bound states about blockers and W258's about citations — a correct citation and a mistaken one are the same text in the same field. A derivation would have to decide what a `state` is in general, which nothing here can do; what the register does instead is make the naming explicit, so a reader checking one claim has a commit to open rather than a memory to trust.",
    },
  },
  {
    bound: "src/quality/typed-names.ts::TYPED_NAME_BOUND",
    condition: "a register that builds its citations with a template literal is unchecked",
    reading: {
      kind: "not_observable",
      why: "A name that does not exist until the program runs cannot be read out of the program's text, and this register reads text. Evaluating the modules instead would mean importing every register in the tree to look at its values — a different unit, a heavier one, and one that trades a text scan for running code to find out what it says. The two modules that build citations this way are named in the sentence rather than left for the reader to find, which is the most a text scan can honestly do about a name it cannot see.",
    },
  },
  {
    bound: "src/quality/typed-names.ts::TYPED_NAME_BOUND",
    condition: "a unit id behind a field nothing else in the tree declares is reported by nobody",
    reading: {
      kind: "not_observable",
      why: "The typing arm compares a field name with the same field name, and a field declared once has nothing to be compared against. The alternative is a rule — every field carrying a unit id must be typed `UnitId` — which is a decision about this tree's conventions rather than a derivation from it, and a register enforcing it would be reporting a preference as a defect. What the tree can honestly say is where it disagrees with itself, and that is what this register says.",
    },
  },
  {
    bound: "src/quality/private-copies.ts::PRIVATE_COPY_BOUND",
    condition: "A copy of either parse written in `scripts/`, in `e2e/`, or in a `.mts` file is invisible to it",
    reading: {
      kind: "not_observable",
      why: "The W267 class, inherited rather than restated: this register reads TEXT, and a walk assembled from a library call it does not name is invisible to a text scan by construction. Reading it would take a TypeScript parse of the whole tree resolving what each import can do, which this tree has considered three times and refused three times — the cost is a second implementation of the compiler, and the failure mode of the cheap version is a scan that reports confidently about spellings it half-understands. The honest position is the sentence, which is why it is here rather than in a register nobody could write.",
    },
  },
  {
    bound: "src/quality/private-copies.ts::PRIVATE_COPY_BOUND",
    condition: "a private copy of `prepareForScan`, `fixtureText` or `withTree` is a defect nothing here reports",
    reading: {
      kind: "read_by",
      check: "src/quality/bounds.ts::staleBounds",
      how: "The clause is a LIVE PREDICATE rather than a sentence: `stillOpen` asks whether `SHARED_PARSES` still holds fewer than three rows, so the day a unit brings a third parse in here the bound goes stale and the register that watches bounds says so. What that reads is the REGISTER — how many parses it watches — and not the tree, so a copy of `withTree` sitting in a module today is still unreported. `preparationCopies` in `scan-text.ts` covers two of the shared preparations, which is the reason those two are named in the sentence and excluded from the gap.",
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
    condition: "a cell naming an id the ledger does not hold WAS invisible here",
    reading: {
      kind: "read_by",
      check: "src/quality/dossier-derived.ts::unknownIdsInCell",
      how: "W342 ANSWERED IT, which is what an `owed` row is for. The cell is read twice now: once against the ledger's own ids, which is how `SUP-1` is visible at all, and once for the SHAPE, so a token that resolves to no row is reported instead of matching nothing. W339 recorded the promise, the row close made the clock fire when W342 landed without it, and the check went in rather than the promise being re-pointed at a later unit.",
    },
  },
  {
    bound: "src/quality/deferrals.ts::DEFERRAL_BOUND",
    condition: "A hardening pass whose findings never reach `allHardeningFindings` was invisible here",
    reading: {
      kind: "read_by",
      check: "src/quality/deferrals.ts::registerDiff",
      how: "W343 ANSWERED IT, AND THE CONDITION WAS TRUE WHEN IT DID. The sentence had been carried since W329 while four call sites each hand-wrote the same list of four registers — so Q25's pass and Q26's own never reached this clock or W318's, for two quarters, in the register that states the risk. `registerDiff` compares the modules a caller collects with the hardening registers the tree HOLDS, in both directions, and the collected names live once beside the collector. What is still unread is the sentence's first clause, that a deferral can name the wrong unit and resolve perfectly, which no derivation can reach.",
    },
  },
  {
    bound: "src/quality/self-ending.ts::ENDING_BOUND",
    condition: "What is left is the wait with no unit id in it",
    reading: {
      kind: "read_by",
      check: "src/quality/self-ending.ts::proseWaits",
      how: "W350 ANSWERED THE HALF THAT HAD A REMEDY rather than re-pointing it, which is what an `owed` row is for: `proseWaits` resolves every `until W<n>` in a first-party module's comments against the ledger, and the tree holds one live wait — `registers/store.test.ts` on W56, since Year 1. What the row now reads is the REMAINDER the rewritten bound states: a wait with no unit id in it, which `proseWaits` cannot resolve because there is no name to resolve. The register reports the ones it can and the sentence keeps the ones it cannot, which is the honest split rather than a promise.",
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
    bound: "src/quality/quarter-mutants-q26.ts::Q26_MUTANT_BOUND",
    condition: "nothing checks that excusing them was right",
    reading: {
      kind: "read_by",
      check: "src/quality/quarter-mutants-q26.ts::populationDefects",
      how: "PARTLY, AND THE HALF IT READS IS THE HALF THAT ROTS. The condition is that a module can be excused from the sweep for a reason nobody tests. `populationDefects` resolves each excusal against the tree — a row pleading that its suite runs the sweep must name a suite that really imports the runner, and a row pleading no sibling suite must name a module that really has none — so an excusal cannot outlive the fact it rests on. What stays unread is whether excusing a module was the right call at all, which is a judgement about how to spend a sweep rather than a property of the tree, and the bound says so in the same sentence. Recorded as read rather than not-observable because the arm that exists is the one that would have caught `runs_the_sweep` becoming the cheap way to shorten any slow run.",
    },
  },
  {
    bound: "src/console/waiting.ts::WAITING_BOUND",
    condition: "EMPTY IS THE PAGE'S OWN WORD AND NOTHING CHECKS IT",
    reading: {
      kind: "not_observable",
      why: "The condition is a page that computes its rows, renders none, and passes `empty: false` — so the notice stays silent on exactly the screen it exists for. Reporting it means knowing what the page RENDERED, which is a browser rather than a wider scan: `e2e/waiting-path.spec.ts` does it for the two routes the walk names, by requiring the notice on a practice it has just driven into that state, and can say nothing about a page nobody put in the walk. So no export reports it and none could — a register that ran every console page to compare a prop against the DOM would be the e2e suite with a different name, which is the class `PATH_BOUND` already states one register over. The narrower half is chosen rather than missing: `WAITING_BOUND` argues why the page answers for its own emptiness, and the alternative re-derives four screens' worth of state to tell each of them what it already knows.",
    },
  },
  {
    bound: "src/quality/exemption-reach.ts::REACH_BOUND",
    condition: "An exemption welded inside a function",
    reading: {
      kind: "read_by",
      check: "src/quality/exemption-reach.ts::appliedExemptions",
      how: "THE GAP THE SENTENCE NAMES IS THE ONE THING HERE THAT IS READ. `appliedExemptions` walks the tree and reports the maps a detector takes as a defaulted parameter, and the census arm fails in both directions — a module that starts applying one joins the population without a hand edit, and a row naming a map no detector takes is reported. What the scan cannot reach is an exemption with no parameter at all, and that is exactly why the bound's predicate reads this function rather than the table: the day the scan grows past the idiom, the sentence stops describing this register.",
    },
  },
  {
    bound: "src/quality/exemption-reach.ts::REACH_BOUND",
    condition: "might reach the whole directory and this register would report it identically",
    reading: {
      kind: "not_observable",
      why: "A pair says the reach exceeds the key by at least one step. Measuring the DISTANCE means planting instances at every grain between the key and the tree — a sibling in the same test, the same file, the same directory, the same quarter — and asking which of them the exemption still covers, which is a different register rather than another arm of this one. What this one can say honestly is bounded by what one pair can show, and the sentence says so instead of implying more.",
    },
  },
  {
    bound: "src/quality/exemption-reach.ts::REACH_BOUND",
    condition: "`wider` IS NOT `WRONG`",
    reading: {
      kind: "not_observable",
      why: "Whether a wide reach is acceptable is a judgement about the check it silences — a file-grained key is the honest grain when the check itself is file-grained — and no derivation settles it. The register deliberately reports `wider` as a standing rather than a defect, and this row exists so that the choice is on the record instead of looking like an omission: nothing here will ever fail because an exemption reaches past its key, only because the reach is undeclared or has changed.",
    },
  },
  {
    bound: "src/quality/flattering-numbers.ts::FIGURE_BOUND",
    condition: "A FIGURE SPELLED AS THE LENGTH OF A LIST IS INVISIBLE HERE",
    reading: {
      kind: "not_observable",
      why: "The condition is a count taken by a CALLER rather than returned by a derivation — `unaskedFacts(root).length`, the very figure W354 is named after. Reporting it means deciding which of this tree's thousands of `.length` reads is a figure somebody quotes and which is a loop bound, and that is a judgement about what a number MEANS rather than a property of the source. The remedy is a wider scan, which closes the gap rather than reporting it, and the sentence would still be true of whatever the wider scan misses — W267's class, arriving at a return type.",
    },
  },
  {
    bound: "src/quality/flattering-numbers.ts::FIGURE_BOUND",
    condition: "A BLINDING IS ONE MISTAKE, NOT ALL OF THEM",
    reading: {
      kind: "not_observable",
      why: "The condition is a figure that behaves one way for the mistake a row wrote and another way for a mistake nobody thought of. A check that could enumerate the mistakes a derivation is vulnerable to would not have needed the row, and the register says so: what it measures is the direction of ONE blinding, chosen by a reader. Nothing can report the blinding nobody chose.",
    },
  },
  {
    bound: "src/quality/flattering-numbers.ts::FIGURE_BOUND",
    condition: "IS ABOUT A CONTRADICTION AND NOT ABOUT A READER",
    reading: {
      kind: "not_observable",
      why: "The condition is the distinction between a wrong number that CAN be caught and one somebody is actually catching. Whether a person reads a screen is not a fact about this repository, and the register deliberately measures the half that is: a second door that disagrees. No check can close the other half, and the row is here so nobody reads `loud` as `noticed`.",
    },
  },
  {
    bound: "src/quality/shared-excuses.ts::EXCUSE_BOUND",
    condition: "A SENTENCE GIVEN ONCE IS INVISIBLE HERE",
    reading: {
      kind: "not_observable",
      why: "Not because the reasons given once cannot be listed — they can, and there are hundreds — but because the list would BE the tree's prose. Every reason field is a sentence nothing can contradict until somebody writes a falsifier for it, so a report at threshold one restates the register's own definition as a defect list and settles nothing. What is not observable is which single-given reason is load-bearing enough to matter, and that is a reader deciding, which is what the threshold stands in for.",
    },
  },
  {
    bound: "src/quality/shared-excuses.ts::EXCUSE_BOUND",
    condition: "A FALSIFIER SETTLES ONE CLAUSE, NOT A SENTENCE",
    reading: {
      kind: "not_observable",
      why: "A check that could tell whether a falsifier covers all of a sentence would have to enumerate the clauses of an English sentence and decide which are claims about the tree. `NOT_A_SILENCE` is the instance: one clause is a fact about a type declaration and the other is a reading of a bound's polarity, and no scan separates them. The register does the observable half instead — each row states the clause its falsifier reads, and the suite checks that the clause is not the sentence.",
    },
  },
  {
    bound: "src/quality/shared-excuses.ts::EXCUSE_BOUND",
    condition: "THE SCAN READS A FIELD NAME",
    reading: {
      kind: "not_observable",
      why: "Same shape as the first clause and worth stating separately, because the escape is different: a reason spelled under `what`, `how` or `note` is out of the population, and a report of every long prose string in a field this register does not call a reason would return most of the object literals in the tree. Telling a reason from a description is a reading of what the author meant the field to do, and no scan makes it.",
    },
  },
  {
    bound: "src/quality/shared-excuses.ts::EXCUSE_BOUND",
    condition: "TWO SPELLINGS OF ONE SENTENCE ARE TWO EXCUSES",
    reading: {
      kind: "read_by",
      check: "src/quality/shared-excuses.ts::variantsOfDeclaredSentences",
      how: "Reports every sentence given once that opens the same way as a sentence the register declares shared. It finds the tree's one instance — a W314 row explaining the word `one`, typed a third time with two words changed — so the clause is a live report rather than a warning. It reads the narrow half deliberately: the general normalisation the bound names as the remedy would also merge sentences an author meant to differ.",
    },
  },
  {
    bound: "src/quality/superset.ts::SUPERSET_BOUND",
    condition: "A selector nobody declared can widen unwatched",
    reading: {
      kind: "read_by",
      check: "src/quality/superset.ts::undeclaredPopulations",
      how: "PARTLY, AND THE HALF IT READS IS THE HALF THAT ROTS. The condition is that the population of selectors is a list somebody wrote. `undeclaredPopulations` resolves that list against W267's census — every register the census holds takes something and narrows it, so a walking module with no row here is named rather than assumed absent. What stays unread is a derivation that narrows a population W267 never saw it walk, which is that register's own bound arriving one module over.",
    },
  },
  {
    bound: "src/quality/superset.ts::SUPERSET_BOUND",
    condition:
      "A selector that narrows on the declared input and widens on some other one reads clean here",
    reading: {
      kind: "not_observable",
      why: "The condition is a selector with a SECOND degenerate input nobody thought of. Reporting it means knowing which inputs a function cannot understand, which is the question the row was written to answer — a check that could enumerate them would not have needed the row. The remedy is a wider row rather than a report, and the sentence stays true afterwards of whatever the wider row misses: W267's class, arriving in an argument list instead of a walk.",
    },
  },
  {
    bound: "src/quality/superset.ts::SUPERSET_BOUND",
    condition: "A selector returning the same NUMBER of the wrong things is invisible to this",
    reading: {
      kind: "not_observable",
      why: "The condition is a selector that narrows to the right SIZE and the wrong members. Reporting it means comparing SETS, and a register comparing sets holds the right answer — which is the thing the selector was asked for, so the register would be the selector. The measurement is a count because a count is what an outside observer can take, and the bound says so in the same sentence.",
    },
  },
  {
    bound: "src/quality/empty-populations.ts::EMPTY_BOUND",
    condition: "a register emptied at runtime, built by a function that happens to return nothing, or spelled across lines is invisible to it",
    reading: {
      kind: "not_observable",
      why: "THREE GAPS IN ONE CLAUSE AND ALL THREE STOP AT THE SAME PLACE. Seeing a register that is empty at RUNTIME means evaluating the module, and W367 proved in this exact neighbourhood that a module's exported values depend on which file entered the graph first — so a register reading values would report a different population per importer, which is worse than reporting none. Seeing that a FUNCTION returns nothing means claiming it returns nothing on every run, which is not a walk. And the line-anchored read is the price of the distinction the register is built on: a multi-line match finds declarations quoted inside comments and strings, so widening it trades a gap this bound names for a class of false reports it would not.",
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
  "the case for several of them on the day it was written. AND THE `owed` ARM IS EMPTY NOW. Three " +
  "conditions were promised to a later unit when this register was written; W342 read one, W350 " +
  "read another and the third was answered by the unit it named. What is left is every row either " +
  "naming a check or arguing that nothing could report it, which is the state the register was " +
  "built to reach and also the state in which its own liveness comes from the argument in each " +
  "row rather than from a clock.";

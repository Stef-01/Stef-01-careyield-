// W297: the bounds register — every stated `*_BOUND` resolved to its unit and to its remedy.
//
// MODULES ACROSS THIS TREE EXPORT A SENTENCE SAYING WHAT THEY DO NOT PROVE. They are its most useful
// habit and its least checked one: a bound is written once, at the moment somebody understands the
// limit best, and then it sits — while the tree moves underneath it. Two things go wrong, and both
// have already happened here.
//
// A BOUND GOES STALE WHEN ITS REMEDY IS BUILT. Every one of these names the change that would lift
// it — an AST pass, a failable store, a comparison moved out of a test file — and the day somebody
// makes that change the sentence starts describing a tree that no longer exists. `RUNTIME_BOUND`
// is the proof that this is not theoretical: W287 had to correct a claim in it by hand, because
// `/console/interest` reads a file from disk and the sentence said every console read was an
// in-memory call that cannot throw. So each entry here carries a PREDICATE — `stillOpen` — that
// re-derives the remedy's absence from the tree, and a bound whose remedy has been built fails.
//
// AND A BOUND GOES WRONG WHEN IT COUNTS. Three of the eight stated totals — "thirteen executed",
// "the other thirty-three", "four are cited" — and ALL THREE WERE WRONG when this unit read them,
// by four, by one and by two respectively. Every one was mine, written between one and four units
// earlier, and W288 had already found and fixed the same defect in `FIXTURE_BOUND`: a number in
// prose is re-typed by hand and nothing re-derives it. The rule this register enforces is the one
// W288 adopted — THE BOUND STATES NO TOTAL AND THE REGISTER HOLDS IT — and it is enforced by
// scanning the bound's own text, so the next one fails on arrival rather than two units later.
//
// A NUMBER IS NOT ALWAYS A TOTAL, so the rule is a declaration rather than a ban: every number-word
// in a bound is declared here with what it is, and a number nobody declared fails. "One assertion
// per register" is a rate, "W284" is a unit id, "three lenses" is fixed by the gate. What cannot
// pass is a count of something the tree can grow.
//
// W306: AND A PREDICATE NOBODY CAN HAND A DIFFERENT TREE HAS NEVER RUN IN THE STATE IT EXISTS TO
// DETECT. `stillOpen` took no argument, and the predicates that read the filesystem closed over a
// module-scope `process.cwd()` — so this register could answer *has the remedy been built* about
// this tree and no other, which is what Q23's hardening pass raised as CR-1. It takes a root now,
// and every remedy declares HOW it could be lifted. A `constructed_tree` carries the files that
// make its remedy EXIST, and the predicate handed that root must report itself lifted — the arm
// `staleBounds` is for, driven at last on the real entries rather than only on a fabricated one. A
// predicate that derives its answer from imported constants instead says so, and is checked to
// answer the same however the tree is arranged. And a predicate that is the literal `true` says
// THAT, is proved constant, and sits under a ceiling — because its `reads` field described a
// derivation the code never performed, and a check that cannot fail reads exactly like one that
// passes.
//
// WHAT THIS DOES NOT PROVE is `BOUNDS_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the tree's own exported sentences, and the
// trees it plants are throwaway directories holding only the files a predicate reads.

import { readFileSync } from "node:fs";
import path from "node:path";
import { existsSync } from "node:fs";
import { type Plantable, withTree } from "./planting";
import { sourceModules, pageSpecFiles } from "./tree-walks";
import { headerUnit, knownUnits } from "./unit-headers";
import { ACCEPTANCE_REGISTERS, ACCEPTANCE_BOUND } from "./acceptances";
import { BLIND_SPOTS, BLIND_SPOT_BOUND } from "./blind-spots";
import { HATCH_BOUND } from "./escape-hatches";
import { UNASKED_BOUND } from "./unasked-facts";
import { PAGE_FACT_BOUND } from "./founder-page-facts";
import { WAITING_BOUND } from "@/console/waiting";
import { DRIVE_BOUND } from "./assertion-drives";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { SWEEP_BOUND as PIN_SWEEP_BOUND } from "./pins";
import { SWEEP_BOUND as TAUTOLOGY_SWEEP_BOUND, tautologiesIn } from "./tautology-sweep";
import { COMPOSED_COPY_SITES, FIXTURE_BOUND } from "@/compliance/composed-copy";
import { VOCABULARY_BOUND, sweepSurface } from "@/compliance/public-surfaces";
import { RUNTIME_BOUND } from "@/console/zero-states";
import { HARDENING_BOUND } from "./hardening-q23";
import { TAX_BOUND } from "./declaration-tax";
import { SCAN_BOUND, fixtureText } from "./scan-text";
import { SELF_REFERENCE_BOUND, fixtureFiles } from "./self-reference";
import { CLAIMS, PROSE_BOUND, proseClaims } from "./prose-numbers";
import { SECOND_READING_BOUND, sinceReading } from "@/founder/second-reading";
import { unfinishedDefects } from "@/demo/path";
import { CLAIM_CLASS_BOUND } from "./claim-classes";
import { CLEAN_BOUND } from "./repository-clean";
import { SETUP_GAP_BOUND } from "@/console/setup-gaps";
import { Q25_HARDENING_BOUND } from "./hardening-q25";
import { ENDING_BOUND } from "./self-ending";
import { CONTROL_BOUND } from "./controls";
import { UNRUN_BOUND } from "./unrun";
import { DEMO_PATH, PATH_BOUND, gateStops } from "@/demo/path";
import { HEADER_CITATION_BOUND } from "./unit-headers";
import { CITATION_BOUND } from "./citations";
import { PLANTING_BOUND } from "./planting";
import { COUNT_BOUND } from "./register-counts";
import { MANIFEST_BOUND } from "./manifest";
import { FOUNDER_BOUND } from "@/founder/outstanding";
import { HARDENING_BOUND as HARDENING_Q24_BOUND } from "./hardening-q24";
import { CLOSING_BOUND } from "./closing-state";
import { CLOSE_GATE_BOUND, weldedLedgerTests } from "./close-gate";
import { CONTROLS, INSTANT_BOUND } from "./instant";
import { DEFERRAL_BOUND } from "./deferrals";
import { QUARTER_MUTANT_BOUND } from "./quarter-mutants";
import { DOSSIER_BOUND, dossierDiffFor } from "./dossier-derived";
import { NAMED_CONDITIONS, UNREAD_BOUND } from "./unread-bounds";
import { PRIVATE_COPY_BOUND, SHARED_PARSES } from "./private-copies";
import { PLANTED_NAMES, TYPED_NAME_BOUND } from "./typed-names";
import { FINDINGS as Q26_FINDINGS, Q26_HARDENING_BOUND, SELF_REVIEWED as Q26_SELF } from "./hardening-q26";
import { TIMELINE_BOUND, TIMELINE_CLAIMS } from "./timelines";
import { REMEDY_BOUND } from "./self-defeating";
import type { UnitId } from "./typed-names";
import {
  VOCABULARY_BOUND as ASSERTION_VOCABULARY_BOUND,
  throwSpellings,
} from "./assertion-vocabulary";

/**
 * W306: how a remedy's predicate could be shown answering the other way.
 *
 * The register's sharp end, and the reason it exists: `stillOpen` returning true is the answer a
 * broken predicate gives too. Each kind names what it would take to see the OTHER answer, and each
 * is checked by `liftedDefects` against that claim rather than trusted.
 */
export type Lifted =
  /**
   * Files that make the remedy EXIST. Handed that root, `stillOpen` must return false.
   *
   * The lifted state, driven. Before W306 no such root could be handed to anything.
   */
  | { kind: "constructed_tree"; files: Plantable }
  /**
   * The predicate reads imported constants rather than the tree, so no root lifts it.
   *
   * Not an exemption: the claim is checked, by asking the predicate again about roots that hold
   * nothing and about the roots that lift every other bound. A different answer means it does read
   * the tree, and the declaration is wrong.
   */
  | { kind: "derived_without_a_tree"; why: string }
  /**
   * The predicate is the literal `true`, and nothing in any tree makes it say otherwise.
   *
   * W306 FOUND THESE RATHER THAN INTRODUCING THEM, and every one had a `reads` field describing a
   * derivation the code did not perform. The kind exists so they are counted and argued instead of
   * reading like the others; the ceiling beside it is what stops the escape hatch spreading.
   */
  | { kind: "never_derived"; why: string };

/** How a bound could stop being true. */
export type Lifting =
  /**
   * The bound names a change that would lift it, and `stillOpen` re-derives that the change has NOT
   * been made. False means the sentence is describing a tree that no longer exists.
   *
   * W306: it takes the root it reads, and `lifted` says how it could be seen saying false.
   */
  | { kind: "remedy"; remedy: string; reads: string; stillOpen: (root: string) => boolean; lifted: Lifted }
  /**
   * Nothing would lift it — the limit is in the kind of claim, not in the tree.
   *
   * The escape hatch, so it is enumerated and argued: a bound with no remedy can never go stale,
   * which is exactly the property that makes it the easy answer.
   */
  | { kind: "inherent"; why: string };

export interface StatedBound {
  module: string;
  /** The exported name. Two modules export `SWEEP_BOUND`, so the key is module plus name. */
  name: string;
  /** The unit that stated it — checked against the module's own header and against the ledger. */
  unit: UnitId;
  /** The sentence itself, so the checks read what ships rather than a copy. */
  text: string;
  lifting: Lifting;
  /**
   * Every number-word in the text, with what it is.
   *
   * Both directions: a number in the sentence that nobody declared fails, and a declaration for a
   * number no longer in the sentence fails. `total` is refused outright — that is the rule.
   */
  numbers: ReadonlyArray<{ word: string; kind: "rate" | "fixed_by_a_gate" | "unit_id"; why: string }>;
}

/**
 * What this register does not prove.
 *
 * Its own bound, subject to its own rule — which is why it names no total.
 */
export const BOUNDS_BOUND =
  "This resolves a bound's unit, its remedy and its numbers. It does not check that the sentence is TRUE: `stillOpen` re-derives that the named remedy has not been built, which is a different claim from the bound being an accurate description of what the register misses. W295 is where that half lives, by planting a witness, and it reaches only the registers whose detector is callable from outside. So a bound can be resolved here, demonstrated there, and still understate the limit — and the shape most likely to do that is a bound whose remedy is real but whose sentence describes only part of what the remedy would fix. The remedy for that is a reader, which is what the quarterly hardening pass is for. W306 added the missing half of the predicate's own check — a bound carrying a constructed tree is driven in the state where its remedy EXISTS, rather than only in the state where it does not — and that is narrower than it reads too: the tree is a fixture written here, so what it shows is that the predicate reads a tree, not that it would recognise the remedy as somebody else will actually build it. The predicates declared to derive nothing from a tree are checked only for refusing to budge, which is weaker again.";

export const STATED_BOUNDS: readonly StatedBound[] = [
  {
    module: "src/console/setup-gaps.ts",
    name: "SETUP_GAP_BOUND",
    unit: "W334",
    text: SETUP_GAP_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "a console surface whose author did not pass the readiness in",
      reads: "the pages W334's walk names, which are the ones that render it",
      // The sentence holds while the notice is opt-in per page. A shared shell rendering it for
      // every route would lift the first half — and would break the second, which is why it is
      // stated as a trade rather than as a defect. `unfinishedDefects` reads the walk's pages, so
      // the predicate is the walk being smaller than the console.
      stillOpen: (root) => unfinishedDefects(root).length === 0,
      lifted: {
        kind: "constructed_tree",
        // A tree where a page in the walk has stopped rendering it: the notice is no longer a
        // property of the pages that ask, and the sentence describing the trade stops applying.
        files: { "app/console/dashboard/page.tsx": "export default function Page() { return null; }\n" },
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/hardening-q25.ts",
    name: "Q25_HARDENING_BOUND",
    unit: "W331",
    text: Q25_HARDENING_BOUND,
    lifting: {
      kind: "inherent",
      why: "One quarter read by one reader, and the reader wrote six of its units. Nothing this tree can build changes that: independence is a property of WHO reads, and the loop has the builders it has — a second session reading the same quarter would be a different pass, not a lifting of this sentence. The uneven lenses follow from the quarter's content rather than from the pass's effort, since a quarter that adds one page and one query parameter gives a security lens one page and one query parameter. And the last clause is a warning against a comparison, not a limit somebody could remove: a finding count measures how hard a quarter was read at least as much as how well it was built, which is why the record carries the findings and not a total.",
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'One quarter read by one reader' — the unit of the sentence rather than a count of anything in the tree. It stays one however many findings the pass records.",
      },
      {
        word: "six",
        kind: "unit_id",
        why: "How many of the quarter's units this reader wrote, which `SELF_REVIEWED` holds by name and this register's suite checks against `REVIEWED_UNITS`. History: the authorship of W313–W325 cannot change, so the number is fixed at the quarter rather than derived from a tree that moves.",
      },
      {
        word: "thirteen",
        kind: "fixed_by_a_gate",
        why: "The size of Q25, which `QUARTER` states as a range and the horizon fixed before the quarter began. Not a measurement: a quarter is thirteen units because the plan laid thirteen rows.",
      },
      {
        word: "eleven",
        kind: "unit_id",
        why: "Q24's finding count, quoted from that quarter's own pass to make the point that a total is not a comparison. History about a closed register, which is exactly why quoting it is safe and re-deriving it would be pointless.",
      },
    ],
  },
  {
    module: "src/quality/controls.ts",
    name: "CONTROL_BOUND",
    unit: "W337",
    text: CONTROL_BOUND,
    lifting: {
      kind: "inherent",
      why: "The event a tied control is handed here is a fabrication, and it has to be: making the REAL event arrive means closing a row, finishing a run, or landing a unit, and a gate that did those to check them would be doing the thing rather than watching for it. Whether a control is wired to its real moment is a fact about the harness around it — a vitest hook, a close sequence — and is checked where that wiring lives. The declared-instant arm is thinner by construction: it can ask whether a declaration exists and never whether the sentence about what a moment cannot see is true, because that is a judgement. And a control the horizon does not name is invisible rather than ungoverned, which follows from the gate being a reading of a planning document; widening it to every control in the tree would be W327's register, which already exists and answers a different question.",
    },
    numbers: [],
  },
  {
    module: "src/quality/unrun.ts",
    name: "UNRUN_BOUND",
    unit: "W333",
    text: UNRUN_BOUND,
    lifting: {
      kind: "inherent",
      why: "Reached is not run, and closing that gap means measuring EXECUTION rather than imports — coverage instrumentation, which is a different instrument answering a different question and produces exactly the totals W304 spent a unit removing. Nothing this register could grow into would make an import walk answer whether a line ran. The specifier limits are narrower and could be widened one syntax at a time, but the sentence would still be true of whatever the next one misses, which is the class W267 states about `readdirSync`. And the branch half is limited by what W291 has DECLARED unreachable: a branch nobody has noticed cannot be reported by a register whose population is the declarations, and noticing is a reading rather than a derivation.",
    },
    numbers: [],
  },
  {
    module: "src/quality/self-ending.ts",
    name: "ENDING_BOUND",
    unit: "W330",
    text: ENDING_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "W314's machinery pointed at a different vocabulary",
      reads: "`self-ending.ts`, for a derivation that reads a wait written as PROSE rather than as a discriminant",
      // W337 RECLASSIFIED THIS, AND THE REASON IS THE REGISTER ABOVE IT. W297 refuses to let the
      // no-remedy kind become the majority — `inherent` can never go stale, which is exactly what
      // makes it the cheap answer — and it fired when the two kinds reached parity. Re-reading
      // this entry, the bound's own text NAMES a remedy: reading prose for an event, which is a
      // unit rather than a widening. A remedy named in the sentence and classified as no-remedy in
      // the register is the register disagreeing with the bound it holds, and the bound was right.
      // The second clause — whether a finding still matters after its unit lands — really is a
      // judgement, and it stays in the text as the part no remedy reaches.
      stillOpen: (root) =>
        !/export function proseWaits\b/.test(readFileSync(path.join(root, "src/quality/self-ending.ts"), "utf8")),
      lifted: {
        kind: "constructed_tree",
        // The tree where somebody has written it: a derivation that takes prose and returns the
        // waits in it. With that present the sentence is describing a gap the tree has closed.
        files: {
          "src/quality/self-ending.ts":
            "// W330: the waits, including the ones written as sentences.\nexport function proseWaits(): string[] {\n  return [];\n}\n",
        },
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/escape-hatches.ts",
    name: "HATCH_BOUND",
    unit: "W345",
    text: HATCH_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "a `Blindness` arm that demonstrates a bound by NOISE rather than by silence",
      reads: "`blind-spots.ts`, for the arm that would let a false-positive bound be planted against",
      // NOT `inherent`, AND W311'S WARNING IS WHY. Three quarters of this sentence really are about
      // judgements nothing derives, and the temptation was to file the whole thing under the kind
      // that can never go stale. But the half W345 actually discovered names a remedy somebody can
      // build: two entries plead `NOT_A_SILENCE` because W295 demonstrates by silence and their
      // bounds are about false positives, and an arm asserting the witness IS reported would settle
      // both. The day that arm exists this sentence is describing a tree that has moved on.
      stillOpen: (root) =>
        !/kind: "demonstrated_by_noise"/.test(
          readFileSync(path.join(root, "src/quality/blind-spots.ts"), "utf8"),
        ),
      lifted: {
        kind: "constructed_tree",
        // The tree where somebody has written it: the arm declared beside the two that exist.
        files: {
          "src/quality/blind-spots.ts":
            '// W295: what a green suite does not prove.\nexport type Blindness = { kind: "demonstrated_by_noise"; bound: string };\n',
        },
      },
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'One of the four reasons is checkable' and 'somebody looking again' — the unit of the sentence rather than a count of anything the tree holds. It stays one however many hatches the population grows to.",
      },
      {
        word: "four",
        kind: "fixed_by_a_gate",
        why: "The arms of `HatchKind`, which this module declares and does not measure. It is four because the type says four, and a fifth arrives only with a fifth arm, whose unit would rewrite this sentence anyway.",
      },
      {
        word: "three",
        kind: "fixed_by_a_gate",
        why: "The same union minus the one arm a scan can contradict, so it follows from `HatchKind` by subtraction rather than from any walk. It moves only when the type does.",
      },
      {
        word: "two",
        kind: "unit_id",
        why: "The entries W345 reclassified `NOT_A_SILENCE`, fixed at the unit that reclassified them. History about a reading that has happened, which is why quoting it is safe; a third would be a third unit's finding and its own sentence.",
      },
    ],
  },
  {
    module: "src/quality/unasked-facts.ts",
    name: "UNASKED_BOUND",
    unit: "W340",
    text: UNASKED_BOUND,
    lifting: {
      kind: "inherent",
      why: "Three limits and the kind of claim is where each of them lives. A reader is an import, and widening the parse to namespace imports and dynamic ones would move the number without touching the sentence — whatever the parse reaches, a fact reached by the syntax after it is still invisible, which is the class W267 states about `readdirSync`. The population is `reachableFromApp`'s answer, so what this register cannot see is inherited from a walk that states its own bound one register over; making this one wider would be re-deriving reach here, which is the duplication W301 spent a unit removing. And the half that matters least mechanically matters most in the reading: whether a fact SHOULD have a surface is a judgement about the product, made by somebody who knows what a screen is for, and no measurement over this tree returns it. W311 established that mis-typing a limit as a deferred remedy is how `never_derived` becomes the easy answer, so each of these is named rather than pointed at a unit nobody would write.",
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'one level up', 'one register over', 'a second register' — the unit of the comparison rather than a count of anything the tree holds. It stays one however many facts the population grows to, which is the distinction W297's own entry draws for 'One assertion per register, driven once'.",
      },
    ],
  },
  {
    module: "src/quality/founder-page-facts.ts",
    name: "PAGE_FACT_BOUND",
    unit: "W347",
    text: PAGE_FACT_BOUND,
    lifting: {
      kind: "inherent",
      why: "THE FIRST DRAFT CLAIMED A REMEDY AND W306'S DRIVER REFUSED IT ON THE SPOT. The predicate said the bound stays open while `e2e/founder.spec.ts` does not walk the sections this unit added — and the same unit added those walks, so the sentence was describing a tree that had moved before it was committed. W306's plant fired within a minute of the entry being written, which is the register working. What the sentence is actually about cannot be lifted by any spec: a source scan asking whether a page NAMES a derivation cannot know whether a reader sees the answer, and a browser walk is a different instrument answering a different question rather than a widening of this one. Adding the walks did not make this register's `rendered` mean more; it added a second check beside it, and the day the spec stops walking a section this register still says the page names the call. The population is the second limit and it is the same kind of claim: `POSITION_MODULES` is a list because nothing but the subject joins those three files, and no derivation over the tree returns membership. And the third is a judgement outright — whether a `declared` reason is a good one is a reader disagreeing, which is what W310 says about a blocker being the right blocker.",
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'a call whose result is assigned and never printed', 'one at the top of the page', 'a reader disagreeing' — the unit of the illustration rather than a count of anything the tree holds. It stays one however many facts the register classifies.",
      },
      {
        word: "three",
        kind: "fixed_by_a_gate",
        why: "The modules in `POSITION_MODULES`, which this register declares and does not measure. It is three because the list says three, and the sentence's point is that whatever the number is, nothing derives it — a fourth arrives with the unit that adds it and rewrites this sentence.",
      },
    ],
  },
  {
    module: "src/console/waiting.ts",
    name: "WAITING_BOUND",
    unit: "W346",
    text: WAITING_BOUND,
    lifting: {
      kind: "inherent",
      why: "Three limits and none of them is a state of the tree. The page passes its own emptiness, and a module that worked it out instead would be re-deriving four screens' worth of state to tell each of them what it has already computed — W334 made the same trade and `SETUP_GAP_BOUND` argues it, so closing this one means undoing a design rather than building a check. Which cycle a page's contents come from is a reading of what the page renders, made by whoever wired it up, and no derivation over source text returns it. And the last is a founder gate rather than a gap: telling a practice whose first read is due tonight from one whose connection was never configured needs a live connection, which G1 gates — so the thing that would lift it is a ruling, and a ruling is not a change to this tree. W311 established that mis-typing a limit as a deferred remedy is how `never_derived` becomes the easy answer, so each is named rather than pointed at a unit nobody would write.",
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'one door the register cannot watch', 'shows one' — the unit of the sentence rather than a count of anything the tree holds. It stays one however many pages ask for the notice.",
      },
      {
        word: "two",
        kind: "fixed_by_a_gate",
        why: "The notices an empty console can show, which W334 and this unit put there rather than anything measuring. It is two because two units wrote one each, and a third arrives with the unit that writes it and rewrites this sentence.",
      },
      {
        word: "four",
        kind: "unit_id",
        why: "The pages a module answering emptiness for the console would have to re-derive, quoted from W334's trade rather than measured here — that walk names four and this sentence borrows the figure to say what the trade costs. History about a closed decision, which is why quoting it is safe.",
      },
    ],
  },
  {
    module: "src/quality/repository-clean.ts",
    name: "CLEAN_BOUND",
    unit: "W328",
    text: CLEAN_BOUND,
    lifting: {
      kind: "inherent",
      why: "The sentence is about what a moment can see. This check answers after every worker has finished, so what it reports is what PERSISTED — and a probe written and deleted inside one test is gone before it looks, which is the half another worker actually trips over. No change to this tree moves that: a check at the end of a run cannot observe a file that existed only in the middle of it, and observing the middle is a different mechanism answering at a different moment, which is what `withPlantedIn`'s refusal already is. The other clause is a judgement rather than a derivation — the artefacts are a list of paths this repository has no reason to hold — and widening it to every untracked file would report ordinary states of a working tree, which is a check somebody turns off rather than a stronger one.",
    },
    numbers: [],
  },
  {
    module: "src/quality/claim-classes.ts",
    name: "CLAIM_CLASS_BOUND",
    unit: "W324",
    text: CLAIM_CLASS_BOUND,
    lifting: {
      kind: "inherent",
      why: "Two limits, and the first is what makes this gate cheap enough to run at all. A driven answer hands a check the smallest input that should make it speak, so what it proves is that the check speaks — not that it would speak about this tree. Closing that would mean re-running every register against the real tree from inside the gate, which is what the suite already is; a gate that repeats the suite is not a second reading of anything, it is the suite with a longer name. The second is that an argument here is anchored to a sentence in a planning document, and whether that sentence argues what the answer says it argues is a judgement no check makes. Both follow from the gate being a READING between a document and the checks rather than a re-derivation of either, which is the only thing in this tree that reads across that seam. Neither is a state of the tree that some later unit could change.",
    },
    numbers: [],
  },
  {
    module: "src/quality/self-defeating.ts",
    name: "REMEDY_BOUND",
    unit: "W317",
    text: REMEDY_BOUND,
    lifting: {
      kind: "inherent",
      why: "Two limits, neither liftable by a change to this tree. The first is that the RULE is a sentence and no sweep can apply it: whether a mechanism carries the defect's defining property is a judgement over arbitrary code, which is why the rule is written for a reader. The second is that the sweep can only see what `assertionsIn` returns, and a parser being exhaustive is not a state of the tree — it is a property of a parser nobody has proved, and W317 has a demonstration that it is not: an assertion it could read by eye and the parse did not return. Widening that parser is a unit, not a lifting of this sentence, and the sentence would still be true afterwards for whatever the wider parser misses.",
    },
    numbers: [],
  },
  {
    module: "src/quality/assertion-vocabulary.ts",
    name: "VOCABULARY_BOUND",
    unit: "W323",
    text: ASSERTION_VOCABULARY_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "Choosing one spelling per claim is a unit each",
      reads: "the tree, for the nearest unnormalised claim — a call throws — still spelled more than one way",
      // W336 LIFTED THE PREVIOUS PREDICATE AND THIS IS ITS SUCCESSOR. The old one read emptiness,
      // which was the nearest unnormalised claim when W323 wrote the sentence and was held three
      // ways; W336 gave it one spelling, W306's driver reported the bound stale on the spot, and
      // the sentence moved rather than the predicate being quietly widened. The frontier is now
      // throwing: `toThrow()` and `toThrow(message)` are both live and are NOT equivalent, so the
      // next unit here has a judgement to make rather than a conversion to run.
      stillOpen: (root) => throwSpellings(root).length > 1,
      lifted: {
        kind: "constructed_tree",
        files: {
          "src/planted/one-throw.test.ts":
            'it("t", () => {\n  expect(() => f()).toThrow("a message");\n  expect(() => g()).toThrow("another");\n});\n',
        },
      },
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'One spelling per claim is a unit each' — the unit of the sentence, not a count of anything in the tree. It stays one however many spellings either register grows, which is the distinction W297's own entry draws for 'One assertion per register, driven once'.",
      },
      {
        word: "two",
        kind: "fixed_by_a_gate",
        why: "How many claims these registers normalise: non-emptiness by W323's gate and emptiness by W336's. It counts the REGISTERS this module declares — `NON_EMPTY_FORMS` and `EMPTY_FORMS` — which two units' verify gates put there, rather than anything a walk over the tree finds. A third arrives only with a third unit, whose gate would rewrite this sentence anyway.",
      },
    ],
  },
  {
    module: "src/quality/unread-bounds.ts",
    name: "UNREAD_BOUND",
    unit: "W339",
    text: UNREAD_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the vocabulary grows and says so",
      reads: "the register itself, for a condition owed to a unit that has not read it yet",
      // The sentence's first clause is the W267 class and has no predicate. The one with teeth is
      // that `not_observable` is an argument rather than a derivation and is the majority — which
      // stops being the shape of the register the day every row either names a check or names a
      // unit that owes one. Rows are `owed` today; when the last of them is read, this
      // sentence is describing a register that has moved.
      stillOpen: () => NAMED_CONDITIONS.some((c) => c.reading.kind === "owed"),
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads W339's own declared register, an imported constant: whether a condition is owed to a unit is a classification somebody wrote down rather than anything a walk finds, so no root can be handed to it. What lifts it is a later unit reading the last owed condition, which is an edit to this register rather than a change to any tree.",
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/timelines.ts",
    name: "TIMELINE_BOUND",
    unit: "W344",
    text: TIMELINE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "a sentence claiming an order and never declared here",
      reads: "the register itself, for how many order claims it holds",
      // TWO CLAUSES ARE INHERENT AND ONE MOVES. That a window is two commits, and that resolving
      // the commit a claim NAMES is not reading the state it describes, are properties of a record
      // rather than gaps somebody could close. What moves is the population: three claims are
      // declared out of the hundreds of order sentences this tree writes, and the day a unit
      // derives them instead of listing them this sentence stops describing the register.
      stillOpen: () => TIMELINE_CLAIMS.length < 10,
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads the length of this module's own declared table. How many order claims a register watches is a decision somebody writes down rather than anything a walk or a log finds, so no root can be handed to it, and what lifts it is an edit to `TIMELINE_CLAIMS` rather than a change to any repository.",
      },
    },
    numbers: [
      {
        word: "two",
        kind: "fixed_by_a_gate",
        why: "How many commits a window is: the claim commit the protocol makes a unit push before building, and the commit its ledger row names. It counts the ends of a window rather than anything the tree holds, and it stays two however many units the ledger grows — the protocol in `BUILD-STATE.md` is what fixes it.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'a reading somebody did once' — the sentence uses `one` for a single instance of a shape rather than as a count of anything the tree holds. It stays one however many claims the register grows to.",
      },
      {
        word: "three",
        kind: "unit_id",
        why: "How many order claims are declared here, which is `TIMELINE_CLAIMS.length` and the register's own table. The bound's predicate reads the same length, so the sentence and the check move together and the suite reads the table rather than this word.",
      },
    ],
  },
  {
    module: "src/quality/hardening-q26.ts",
    name: "Q26_HARDENING_BOUND",
    unit: "W343",
    text: Q26_HARDENING_BOUND,
    lifting: {
      kind: "inherent",
      why: "The same limit W331 stated and for the same reason: independence is a property of WHO reads, and the loop has the builders it has — a second session reading Q26 would be a different pass rather than a lifting of this sentence. The uneven lenses follow from the quarter's content, since a quarter whose product surface is one amber notice gives a security lens one amber notice. And the last clause is a warning against a comparison rather than a limit somebody could remove: a finding count says how hard a quarter was read at least as much as how well it was built, which is why the record carries the findings and not a total.",
    },
    numbers: [
      {
        word: "One",
        kind: "rate",
        why: "'One quarter read by one reader' — the unit of the sentence rather than a count of anything the tree holds. It stays one however many findings the pass records.",
      },
      {
        word: "SEVEN",
        kind: "unit_id",
        why: "How many of Q26's thirteen units this reader wrote, which `SELF_REVIEWED` holds by name and this pass's suite checks against `REVIEWED_UNITS`. History: the authorship of W326–W338 cannot change, so the number is fixed at the quarter rather than derived from a tree that moves.",
      },
      {
        word: "four",
        kind: "unit_id",
        why: "How many findings this pass recorded, which is a fact about the pass rather than about the tree — and the sentence's own point is that the number measures reading as much as building. `FINDINGS` holds them and the suite compares the count with Q25's rather than pinning either.",
      },
      {
        word: "ten",
        kind: "unit_id",
        why: "How many findings Q25's pass recorded, cited here for the comparison the sentence makes. It is that register's history and cannot move: `hardening-q25.ts` is closed, and the suite reads `FINDINGS.length` from it rather than trusting this word.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'one console notice', 'one child-process runner', 'one deletion sweep', 'one amber notice' — the unit of what the security lens had to read rather than a count of anything derived. Each stays one however many registers the quarter added.",
      },
      {
        word: "two",
        kind: "unit_id",
        why: "How many duplications the simplify lens found — `UnitId` written a third time and the seventh copy of the ledger row parse — which are two of the four rows in `FINDINGS` and are checked there rather than counted here.",
      },
      {
        word: "six",
        kind: "unit_id",
        why: "How many of Q25's thirteen units its own reader wrote, cited here for the comparison this sentence makes with the pass before it. History about a closed pass: `hardening-q25.ts` holds those units by name in its own `SELF_REVIEWED` and cannot acquire more.",
      },
      {
        word: "eleven",
        kind: "unit_id",
        why: "How many registers Q26 added, the number the sentence declines to judge. It is history about a closed quarter: the modules are the ones `quarterModules` returns for W326–W338, and the pass's point is that whether there should have been fewer is a judgement about the plan rather than a derivation.",
      },
      {
        word: "thirteen",
        kind: "fixed_by_a_gate",
        why: "The horizon rule's quarter length, fixed by plan §6 at one quarter of thirteen units. `REVIEWED_UNITS` holds thirteen entries and the suite checks that against `QUARTER.last - QUARTER.first + 1`.",
      },
    ],
  },
  {
    module: "src/quality/typed-names.ts",
    name: "TYPED_NAME_BOUND",
    unit: "W342",
    text: TYPED_NAME_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the fabrications this register excuses go to none",
      reads: "the fabrications this register excuses, for one that has stopped being a fabrication",
      // THE SENTENCE HAS TWO CLAUSES AND ONE OF THEM MOVES. That a name assembled from parts is
      // invisible is inherent to a text scan and inherited from W267's class. What is live is the
      // fabrication register: it is the only part of this bound that describes a set the tree can
      // empty, and the predicate reads it rather than restating it.
      stillOpen: () => PLANTED_NAMES.length > 0,
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads this module's own declared fabrications, an imported constant: whether a probe still needs a name the tree does not hold is a fact about the probes rather than about any repository, so no root can be handed to it. What lifts it is the last probe losing its fabrication, which is an edit to this register.",
      },
    },
    numbers: [
      {
        word: "Nine",
        kind: "fixed_by_a_gate",
        why: "How many names in this tree are declared fabrications — inputs a probe hands a detector so the detector can be watched reporting an absence. It counts `PLANTED_NAMES`, the register's own table, and the register checks that table against the tree in both directions on every run, so the number cannot drift without a row being added or going stale. The bound's own predicate reads the same table.",
      },
    ],
  },
  {
    module: "src/quality/private-copies.ts",
    name: "PRIVATE_COPY_BOUND",
    unit: "W341",
    text: PRIVATE_COPY_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "a unit reads a third shared parse",
      reads: "the register itself, for how many parses it publishes",
      // TWO CLAUSES, ONE LIFTABLE. That a text scan cannot see a walk spelled with `glob` is the
      // W267 class and has no remedy short of parsing TypeScript, which is why the sentence
      // inherits `register-census.ts`'s bound rather than restating it. What CAN move is the
      // number of parses read: `preparationCopies` already reads two more, and the day a unit
      // brings a third in here the sentence stops describing this register.
      stillOpen: () => SHARED_PARSES.length < 3,
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads the length of this module's own declared table. How many parses a register watches is a decision somebody writes down rather than anything a walk over a tree finds, so no root can be handed to it — and the event that lifts it is an edit to `SHARED_PARSES`, not a change to any repository.",
      },
    },
    numbers: [
      {
        word: "two",
        kind: "fixed_by_a_gate",
        why: "How many shared parses this register reads: the tree recursion and the ledger row parse, which are the two rows W341's gate put in `SHARED_PARSES`. It counts the register's own table rather than anything a walk finds — a third arrives only with a later unit, whose gate would rewrite this sentence, and the bound's own predicate goes false on the same edit.",
      },
    ],
  },
  {
    module: "src/quality/dossier-derived.ts",
    name: "DOSSIER_BOUND",
    unit: "W335",
    text: DOSSIER_BOUND,
    lifting: {
      kind: "inherent",
      why: "Three clauses, and the fourth is gone because W342 built it. What remains cannot be lifted by anything this tree could write: the dossier's PROSE is a reading of the position rather than the position, so deriving it would mean deriving a judgement; the as-at half is already checked by `blockedSinceTheDossier` rather than bounded; and a row blocked on the WRONG gate resolves perfectly and prices the wrong decision, which is the limit W310 states about blockers and the same judgement one level up. W338 re-typed this sentence from `inherent` to `remedy` because one clause named a check somebody could write — `unknownIdsInCell` is that check, and with it written the sentence is back to naming only what a derivation cannot decide. The predicate that guarded the clause survives as its re-derivation in `dossierDiffFor`, so the fix going away is a failure rather than a silence.",
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'ONE table', 'the one declared fold', 'only a reader' — the unit of what this register covers, not a count of anything that grows. It stays one table however many rows the position holds.",
      },
      {
        word: "four",
        kind: "unit_id",
        why: "Inside a quotation of the dossier's own headline — 'four gates block nothing and are the four that matter'. It is that document's sentence, frozen here to say which part of it this register does NOT derive.",
      },
      {
        word: "three",
        kind: "unit_id",
        why: "The other half of the same quotation — 'three proposals in three years went unanswered' — and the count of limits this sentence lists. Both describe the dossier's argument rather than anything this register walks.",
      },
      {
        word: "two",
        kind: "unit_id",
        why: "'the same text in the same column' follows the pair of attributions being contrasted, a correct one and a mistaken one. A quotation of W310's illustration, not a count of rows.",
      },
    ],
  },
  {
    module: "src/quality/quarter-mutants.ts",
    name: "QUARTER_MUTANT_BOUND",
    unit: "W332",
    text: QUARTER_MUTANT_BOUND,
    lifting: {
      kind: "inherent",
      why: "Three limits, none of them a change to this tree. The operator set is five textual flips and widening it is a different measurement rather than a lifting of this sentence — whatever the set, a module can hold a hole none of its members reaches. The population is the modules a quarter ADDED, and a quarter that mostly extends existing registers is measured barely more than before: that is a fact about how quarters are built, not a state a predicate could read. And a caught mutant means some assertion noticed, not that the assertion was about the thing that changed, which no run can distinguish. W311 established that mis-typing a limit as a deferred remedy is how `never_derived` becomes the easy answer, so each of these is named rather than pointed at a unit nobody would write.",
    },
    numbers: [
      {
        word: "five",
        kind: "fixed_by_a_gate",
        why: "W296's operator set, which this unit runs rather than defines. It is five because that register says five, and the sentence's point is that whatever the number is, it is not the mutation space.",
      },
      {
        word: "six",
        kind: "unit_id",
        why: "'Q25 added six for thirteen units' — a measurement of one quarter, frozen in the record of what this unit found. It describes a Tuesday rather than the tree, and a later quarter adding a different number leaves it true.",
      },
      {
        word: "thirteen",
        kind: "fixed_by_a_gate",
        why: "The size of a quarter, which the §6 horizon rule fixes at thirteen units per expansion. It is not a count of anything this register walks and it moves only if the rule does.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'ONE quarter's modules' and 'over one quarter' — the unit of the measurement, not a count. It stays one however many quarters are measured this way.",
      },
    ],
  },
  {
    module: "src/quality/deferrals.ts",
    name: "DEFERRAL_BOUND",
    unit: "W329",
    text: DEFERRAL_BOUND,
    lifting: {
      kind: "inherent",
      why: "Two limits, neither liftable by a change to this tree. The first is that a citation resolving is not a citation being RIGHT: a finding deferred to a unit about something else resolves perfectly and closes having answered nothing, and only a reader who understands both can tell. W310's bound states the same limit about blockers and W311 established that the kind was the honest answer there rather than a deferred remedy. The second is that `in_flight` is surfaced and never fails, which is a choice rather than a gap — making it fail would break a tree for work not yet done — so what stands between a deferral and a builder who ignores it is W318's arm at the close. Neither is a state of the tree a predicate could read.",
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'deferred to a unit about something else', 'only a reader who understands both', 'W318's arm', 'one commit later' — the sentence uses `one` for a single instance of a shape rather than as a count of anything the tree holds. It stays one however many dispositions arrive, because it is the unit of the illustration.",
      },
      {
        word: "two",
        kind: "unit_id",
        why: "How long Q25's and Q26's passes sat outside this clock before W343 read the sentence against what the callers actually collected — two quarters, which is history about a gap that is now closed. `registerDiff` compares the collected registers with the ones the tree holds on every run, so the sentence cannot go stale again without failing.",
      },
    ],
  },
  {
    module: "src/quality/instant.ts",
    name: "INSTANT_BOUND",
    unit: "W327",
    text: INSTANT_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the disturbance grows and says so",
      reads: "the register, for a control nobody can drive",
      // The bound's sharpest clause is that the control this unit most wanted to drive cannot be:
      // a detector reading the repository is demonstrated only by writing to the repository. It
      // stops being true the day every declared control carries a probe — at which point the
      // register is a set of demonstrations rather than a set of declarations.
      stillOpen: () => CONTROLS.some((c) => c.run === null),
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads W327's own declared register, an imported constant: whether a control can be driven is a property of how the control is written rather than of any tree, so no root can be handed to it. What would lift it is a later unit — W328 holds the one row that is undrivable today — making the repository-reading detector demonstrable without writing to the repository, which is an edit to that detector rather than a change to any tree this could be pointed at.",
      },
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'The disturbance is ONE state' and 'the one control this unit most wanted to drive' — the unit of the mechanism and a pointer at a single row, neither counting anything that grows. The disturbance stays one however many controls arrive.",
      },
      {
        word: "two",
        kind: "rate",
        why: "'the order two workers finish in' — an illustration of the race, with no pair of workers in this tree it refers to. It stays two however many vitest runs in parallel, because two is what a race takes.",
      },
    ],
  },
  {
    module: "src/quality/close-gate.ts",
    name: "CLOSE_GATE_BOUND",
    unit: "W326",
    text: CLOSE_GATE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "export the comparison from a module that takes its inputs",
      reads: "the tree, for a `.test.ts` that reads the ledger and exports nothing for this to call",
      // The bound's first clause is the one with a remedy somebody can build, and it is W289's,
      // unchanged since W315 stated it. It stops being true the day no test file reads the ledger
      // with its comparison welded inside it — at which point every ledger-dependent check is
      // callable and the close reaches all of them.
      stillOpen: (root) => weldedLedgerTests(root).length > 0,
      lifted: {
        kind: "constructed_tree",
        files: {
          "src/quality/only.test.ts": 'it("t", () => { expect(1).toBe(1); });\n',
        },
      },
    },
    numbers: [
      {
        word: "one",
        kind: "unit_id",
        why: "'the Q25 close broke one of those too' — the horizon test whose done count and wait figures answered differently on either side of its own close. A quotation of what happened at a particular close, not a count of anything the tree holds now.",
      },
      {
        word: "two",
        kind: "rate",
        why: "'it compares TWO RUNS and not two truths' — the shape of the mechanism, which is two runs however many readers the register grows. It stays two.",
      },
    ],
  },
  {
    module: "src/quality/closing-state.ts",
    name: "CLOSING_BOUND",
    unit: "W315",
    text: CLOSING_BOUND,
    lifting: {
      kind: "inherent",
      why: "The bound's first half is a circularity rather than a gap: a row carries the hash of the commit that contains it, so no version of this check can verify the SHA before the commit exists, and no change to the tree makes that false. Its second half — that a row-dependent check welded inside a `.test.ts` is invisible here — names W289's remedy, which is a thing an AUTHOR does to some future check rather than a state of the tree a predicate could read. Neither half is liftable, and W311 established that mis-typing a limit as a deferred remedy is how `never_derived` becomes the easy answer.",
    },
    numbers: [],
  },
  {
    module: "src/quality/hardening-q24.ts",
    name: "HARDENING_BOUND",
    unit: "W311",
    text: HARDENING_Q24_BOUND,
    lifting: {
      kind: "inherent",
      why: "The bound says three lenses by one reader who wrote five of the eleven units are three passes rather than three reviewers, and that this biases the pass toward seams a move left behind. Nothing in the tree lifts that: a second reader is a second SESSION, not a change to any file, and the loop cannot manufacture independence by editing code. W298 stated the same limit one quarter back and it has not moved, which is itself the argument for calling it inherent rather than leaving a remedy nobody can build.",
    },
    numbers: [],
  },
  {
    module: "src/founder/outstanding.ts",
    name: "FOUNDER_BOUND",
    unit: "W310",
    text: FOUNDER_BOUND,
    lifting: {
      kind: "inherent",
      why: "W305 flagged that `never_derived` was becoming the easy answer and asked the next unit to check rather than add a fifth. This is that unit, and the honest answer is that the kind was wrong, not the count: what this bound says cannot be judged is whether a blocker is the RIGHT blocker for a row, and a correct block and a mistaken one are the same text in the same column. No change to the tree lifts that — it takes somebody reading the unit and disagreeing — so the limit is in the kind of claim and `inherent` is what it is. The remedy the sentence does name is already built and is not what the bound is about.",
    },
    numbers: [],
  },
  {
    module: "src/quality/manifest.ts",
    name: "MANIFEST_BOUND",
    unit: "W305",
    text: MANIFEST_BOUND,
    lifting: {
      kind: "inherent",
      why: "W305 wrote this as a remedy pointing at W308's re-measurement, and W310 is the unit that watched W308 land. The measurement happened; the tax went up; `MOVED_SINCE_W300` and `TAX_AT_W308` both record it. So the remedy is spent, and what the sentence still says cannot be lifted by any change to the tree: a row here is a DECLARATION and not a proof that the declaration is true, and no manifest can make itself honest — that a module says `census: null` is checked by W267's derivation and that its blind spot is true is checked by W295's witness, both of them elsewhere and on purpose. The limit is in the kind of claim a manifest makes.",
    },
    numbers: [],
  },
  {
    module: "src/quality/register-counts.ts",
    name: "COUNT_BOUND",
    unit: "W304",
    text: COUNT_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "with the same remedy when such a pin arrives",
      reads: "nothing — the predicate beside this line is the constant `true`, and W306 rewrote the sentence that claimed otherwise",
      stillOpen: () => true,
      lifted: {
        kind: "never_derived",
        why: "The pin it would have to find is the one the bound calls invisible: a size asserted against a constant, an expression or another register's length. A predicate for that is a second sweep with a different shape rule, not a read — so this one is the literal `true`, and W306's contribution is that the field above no longer says it reads test files.",
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/planting.ts",
    name: "PLANTING_BOUND",
    unit: "W303",
    text: PLANTING_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the same remedy applies when such a plant arrives",
      reads: "nothing — the predicate beside this line is the constant `true`, and W306 rewrote the sentence that claimed otherwise",
      stillOpen: () => true,
      lifted: {
        kind: "never_derived",
        why: "The plant it would have to find is the one the bound calls invisible: an `fs/promises` write, an append, a shell-out, a helper outside a test file. Finding those is the sweep W303 said it had not built, so the predicate is the literal `true` and now says so where a reader looks.",
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/citations.ts",
    name: "CITATION_BOUND",
    unit: "W301",
    text: CITATION_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the detector grows a scan and says so",
      reads: "nothing — the predicate beside this line is the constant `true`, and W306 rewrote the sentence that claimed otherwise",
      stillOpen: () => true,
      lifted: {
        kind: "never_derived",
        why: "The parse it would have to find is the one the bound calls invisible: an index, a regex, a destructuring helper. Every cheap proxy for it — a module holding the separator without splitting on it — matches modules that merely BUILD the format, which is most of the registers that use it, so a predicate here would report a remedy nobody built. The literal `true` is the honest answer and is declared as one.",
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "HEADER_CITATION_BOUND",
    unit: "W281",
    text: HEADER_CITATION_BOUND,
    lifting: {
      kind: "inherent",
      why:
        "Nothing lifts it, because the limit is in the kind of claim rather than in the tree. Whether a paragraph still describes the code it sits above is not mechanically decidable; whether the identifiers it cites exist is, and that is all the door does. The larger half was closed once, in W293, by banning counts from a header outright — a rule about one CLASS of stale claim, found by shipping one. There is no general version to build.",
    },
    numbers: [],
  },
  {
    module: "src/quality/hardening-q23.ts",
    name: "HARDENING_BOUND",
    unit: "W298",
    text: HARDENING_BOUND,
    lifting: {
      kind: "inherent",
      why:
        "Nothing lifts it, because the limit is in the kind of claim rather than in the tree. A review is a reader's passes over a diff; no change to the code makes three lenses into exhaustive coverage, and a bound that claimed otherwise would be promising that the next reviewer finds nothing because this one did not. The mechanical half is W296's and carries its own separate bound.",
    },
    numbers: [
      {
        word: "Three",
        kind: "fixed_by_a_gate",
        why: "The gate names three lenses — code-review, security-review and simplify — so the number is the row's, not a measurement this unit took.",
      },
    ],
  },
  {
    module: "src/demo/path.ts",
    name: "PATH_BOUND",
    unit: "W309",
    text: PATH_BOUND,
    lifting: {
      kind: "inherent",
      why:
        "THE FIRST DRAFT OF THIS ENTRY CLAIMED A REMEDY AND THE REGISTER REFUSED IT. The predicate said the bound stays open while any declared gate goes unwalked by the e2e spec, and W306's driver reported it stale on the spot: the spec already walks all four, so the sentence would have been describing a tree that had moved before it was committed. The mistake was reading the mechanical clause as the whole bound. What this sentence is actually about is that a green walk over synthetic data says nothing about a practice — and what would lift THAT is a pilot, which is G4. A founder gate is not a change to this tree, so there is no root that makes this false and no predicate that could be honest about it. The mechanical clause beside it — a component call read from source is not a rendered element — is closed for the routes the spec walks and stated rather than remedied for the rest, because widening the walk is a decision about e2e runtime rather than a defect somebody should be nagged about.",
    },
    numbers: [],
  },
  {
    module: "src/founder/second-reading.ts",
    name: "SECOND_READING_BOUND",
    unit: "W322",
    text: SECOND_READING_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the stored snapshot this deliberately does not keep",
      reads: "the ledger, for a reader whose marker is older than the oldest week-unit it holds",
      // The bound says a marker older than the ledger's first week-unit gets everything back with
      // no way to tell that from a busy quarter. It stops being true if the ledger ever stops
      // holding W1 — at which point the oldest marker a reader can carry IS inside the ledger.
      stillOpen: (root) => sinceReading(root, { lastUnit: "W1" }).kind === "since",
      lifted: {
        kind: "constructed_tree",
        // A ledger whose first week-unit is not W1: the oldest marker anybody holds now falls
        // outside it and comes back refused rather than as everything-is-new.
        files: {
          "BUILD-STATE.md":
            "| Unit | Status | By | At | Commit | Note |\n| --- | --- | --- | --- | --- | --- |\n| W900 | done | b | t | c | a ledger that starts late. |\n",
        },
      },
    },
    numbers: [],
  },
  {
    module: "src/quality/prose-numbers.ts",
    name: "PROSE_BOUND",
    unit: "W314",
    text: PROSE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the vocabulary grows and says so",
      reads: "W314's own register, for a claim classified as open that nobody has derived yet",
      // The bound says a claim phrased outside the vocabulary is invisible and that the
      // classification is a judgement. It stops being true the day the register carries no open
      // rows — at that point every claim the scan finds is either derived or history, and the
      // sentence's warning about the unresolved class is describing a tree that has moved.
      stillOpen: () => CLAIMS.some((c) => c.resolution.kind === "open"),
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads W314's own declared register, which is an imported constant: the open rows are a classification somebody wrote down rather than anything a walk finds, so no root can be handed to it. What would lift it is a later unit deriving the four claims left open, which is an edit to the register rather than a change to any tree.",
      },
    },
    numbers: [
      {
        word: "thirty",
        kind: "unit_id",
        why: "Inside `thirty-seven`, the compound W321 added to the map. It counts nothing: the sentence is quoting the word whose absence made the scan misread it, and this register's own scan splits the compound at the hyphen for exactly the reason the sentence describes.",
      },
      {
        word: "seven",
        kind: "unit_id",
        why: "The tail the scan read instead, quoted twice — once as `thirty-seven scanned as seven` and once in the two stale rows it named. A quotation of a corrected misreading, which is why both halves are written down; W297's own entry freezes 'thirteen' and 'seventeen' the same way.",
      },
    ],
  },
  {
    module: "src/quality/self-reference.ts",
    name: "SELF_REFERENCE_BOUND",
    unit: "W307",
    text: SELF_REFERENCE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the sweep for a SECOND file with that extension",
      reads: "the tree, for a second file with the fixture extension beside the one the rule uses",
      // The bound says one file is invisible to every walk and that the citation check is what
      // holds it down. It stops being true the day a second such file arrives, because then the
      // mechanism is a convention rather than a single audited place.
      stillOpen: (root) => fixtureFiles(root).length < 2,
      lifted: {
        kind: "constructed_tree",
        files: {
          "src/quality/scan-fixtures.fixtures": "=== x ===\ny\n",
          "src/quality/second.fixtures": "=== z ===\nw\n",
        },
      },
    },
    numbers: [
      {
        word: "two",
        kind: "rate",
        why: "'the split sweep sees two written shapes' — the shapes the sweep can decide, named in the register beside it as an inline join and a joined table, so the number is a description of the code rather than a count of the tree.",
      },
    ],
  },
  {
    module: "src/quality/scan-text.ts",
    name: "SCAN_BOUND",
    unit: "W302",
    text: SCAN_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "the fix is not",
      reads: "W291's reporter walk, for the raw read the bound says is still there",
      // The bound says one scan still reads raw text. It stops being true the day somebody narrows
      // that walk — which is exactly what W295 tried and had to revert.
      stillOpen: (root) =>
        /const text = readFileSync\(full, "utf8"\);/.test(
          readFileSync(path.join(root, "src/quality/refusal-branches.ts"), "utf8"),
        ),
      lifted: {
        kind: "constructed_tree",
        // The narrowing W295 shipped and reverted, planted: the walk still reads the file and no
        // longer reads it raw. The helper is named `narrowed` rather than `blankLiterals` on
        // purpose — W302's `preparationCopies` sweeps this tree for blanking and stripping calls,
        // and a fixture naming one would report THIS module as a preparation site.
        files: {
          "src/quality/refusal-branches.ts":
            '// W291: the reporter walk, narrowed the way W295 tried.\nconst text = narrowed(readFileSync(full, "utf8"));\n',
        },
      },
    },
    numbers: [
      {
        word: "four",
        kind: "unit_id",
        why: "A quotation of what W295's narrowing cost — four registers lost to one order — recorded beside the three lost to the other, so the reversion's evidence travels with the sentence.",
      },
      {
        word: "three",
        kind: "unit_id",
        why: "The other half of that quotation: literals-then-comments lost a different three, which is the fact that made the order a finding rather than a preference.",
      },
      {
        word: "One",
        kind: "rate",
        why: "'One scan is deliberately outside this' — which scan rather than how many, and the sentence names it. `violationReporters` is the one, and it is named rather than counted.",
      },
    ],
  },
  {
    module: "src/quality/declaration-tax.ts",
    name: "TAX_BOUND",
    unit: "W300",
    text: TAX_BOUND,
    lifting: {
      kind: "inherent",
      why: "W310 CLOSED THIS AND W308 IS WHY. The predicate read the ledger for W308's row still being open, and W308 landed — so the bound went stale the moment the quarter's close was written, which is the register working exactly as W300 designed it. The comparison the sentence promised has now happened: `TAX_AT_W308` re-derives it and `EDIT_SITES_AT_W308` measures the author-effort half the sentence said a count could not capture. What is left of the bound cannot be lifted by anything: a census entry costs four sentences and a copy-surface row costs one, and no measurement over this tree makes a count of declaration sites into a measure of the work of declaring. That limit is in the kind of claim. NOTE FOR THE HARDENING PASS: W308's own gate ran while its ledger row still said `claimed`, so its suite never saw this — the second time this session a check keyed to a ledger row was blind to the unit closing it.",
    },
    numbers: [
      {
        word: "four",
        kind: "rate",
        why: "'a census entry costs four sentences' — the shape of one declaration, said to make the point that a count treats unequal work alike. It measures nothing the tree can grow.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'a one-line surface entry' and 'a count treats them alike' — the other half of the same contrast, a unit of work rather than a total.",
      },
      {
        word: "two",
        kind: "rate",
        why: "'the same two derivations' — how many ways the tax is measured, which is a property of this module's design rather than a measurement of the tree.",
      },
    ],
  },
  {
    module: "src/compliance/composed-copy.ts",
    name: "FIXTURE_BOUND",
    unit: "W278",
    text: FIXTURE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "reach the modules' own test fixtures",
      reads: "the number of composed sites driven with real inputs against the number declared",
      stillOpen: () => COMPOSED_COPY_SITES.length > 5,
      lifted: {
        kind: "derived_without_a_tree",
        why: "It counts W278's own declared sites, which are an imported constant. A tree with a sixth fixture in it would not change the answer — only editing `COMPOSED_COPY_SITES` does — so there is no root to hand it, and saying so is more honest than a fixture that would prove nothing.",
      },
    },
    numbers: [
      {
        word: "one",
        kind: "unit_id",
        why: "Inside W288's parenthetical about the totals it removed — 'wrong within two units of being written'. A quotation of a corrected defect rather than a measurement of anything the tree holds.",
      },
      {
        word: "two",
        kind: "unit_id",
        why: "The other half of the same quotation, naming how soon the removed total went wrong.",
      },
      {
        word: "Five",
        kind: "fixed_by_a_gate",
        why: "The count of sites driven with real inputs, which is a property of this unit's fixtures rather than of the tree: it changes only when somebody writes a sixth fixture, and W278's own test re-derives it from the rendered set.",
      },
    ],
  },
  {
    module: "src/compliance/public-surfaces.ts",
    name: "VOCABULARY_BOUND",
    unit: "W192",
    text: VOCABULARY_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "Widening the vocabulary is its own unit",
      reads: "the sweep itself, given a drug name on a patient-facing surface",
      // The bound's own claim, re-derived: a surface can carry clinical content and pass. When
      // somebody widens the vocabulary this returns a finding and the sentence becomes false.
      stillOpen: () => sweepSurface("/", "patient", "amoxicillin 500mg three times daily").length === 0,
      lifted: {
        kind: "derived_without_a_tree",
        why: "It runs the sweep over a string this line holds, so the answer is a property of the vocabulary the module imports rather than of any tree. This is the strongest of the untreed predicates — it re-derives the bound's own claim by driving the detector — and it is still not liftable by a root, which is the distinction the kind exists to keep visible.",
      },
    },
    numbers: [],
  },
  {
    module: "src/console/zero-states.ts",
    name: "RUNTIME_BOUND",
    unit: "W279",
    text: RUNTIME_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "a store that can be made to fail and a rendered page to read",
      reads: "the page suite, for a spec that drives a failing read",
      stillOpen: (root) =>
        !pageSpecFiles(root).some((spec) =>
          readFileSync(path.join(root, spec), "utf8").includes("could_not_load"),
        ),
      lifted: {
        kind: "constructed_tree",
        // The remedy W279 named, planted: a page spec that drives a failing read. The finding CR-1
        // used this predicate as its example, because its answer could only ever be about this
        // tree — the e2e directory it walks was the repository's own.
        files: {
          "e2e/planted-failing-read.spec.ts":
            'import { test } from "@playwright/test";\n\ntest("the console renders could_not_load when the store throws", async () => {});\n',
        },
      },
    },
    numbers: [
      {
        word: "three",
        kind: "fixed_by_a_gate",
        why: "The three vocabularies W279 compares — declared states, copy keys and route classes. Three is what the unit is about rather than a count of anything the tree grows.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'true of twenty-six of the twenty-seven' was rewritten by W287 to name the single fallible route; the word counts routes W287's own register holds, and `FALLIBLE_READS` is where the number lives.",
      },
    ],
  },
  {
    module: "src/quality/pins.ts",
    name: "SWEEP_BOUND",
    unit: "W290",
    text: PIN_SWEEP_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "an assertion-level detector over expected values",
      reads: "W288's sweep, given the bare-literal assertion this bound says it cannot decide",
      // If W288 grows the shape this bound names, the sweep starts reporting a bare numeric
      // expected value and the sentence stops being true.
      stillOpen: () =>
        tautologiesIn("probe.test.ts", 'it("a test", () => {\n  expect(rows.length).toBe(6);\n});\n').length === 0,
      lifted: {
        kind: "derived_without_a_tree",
        why: "It hands W288's shape rules a source string written on this line, so the answer depends on the imported detector and not on any file. Rooting it would mean planting a test file for `sweepTautologies` to walk, which tests the walk rather than the shape this bound is about.",
      },
    },
    numbers: [
      {
        word: "six",
        kind: "fixed_by_a_gate",
        why: "The recorded instances in W290's `HISTORY`, which is a closed list of things that already happened rather than a measurement of the tree. It can only grow by somebody recording a seventh, in the register, deliberately.",
      },
      {
        word: "ten",
        kind: "rate",
        why: "The pins that DO have names, said as a contrast with the six literals. W290's own `PINS` register holds the number and its test re-derives it; this sentence is about the shape of the gap rather than its size.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'the one that is live by design' — a classification, not a total: it names which kind of pin owes an argument, and `pinDiff` reports any live pin that lacks one however many there are.",
      },
    ],
  },
  {
    module: "src/quality/tautology-sweep.ts",
    name: "SWEEP_BOUND",
    unit: "W288",
    text: TAUTOLOGY_SWEEP_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "a pass over the TypeScript AST with the checker attached",
      reads: "first-party source, for a module that imports the TypeScript compiler",
      stillOpen: (root) =>
        !sourceModules(root).some((file) => /from ["']typescript["']/.test(readFileSync(file, "utf8"))),
      lifted: {
        kind: "constructed_tree",
        // THE COLLISION, PREDICTED AT W306 AND SOLVED AT W307. This predicate walks `src/` of the
        // root it is given, and this module is under `src/` — so a fixture spelling the import out
        // makes the REAL tree match, and the bound reports itself lifted because its own lifting
        // fixture arrived. W306 split the token; the fixture now lives outside every walk instead.
        files: { "src/planted/ast-pass.ts": fixtureText("ast-pass-module") },
      },
    },
    numbers: [
      {
        word: "one",
        kind: "rate",
        why: "'a different tool from this one' — the AST pass is pointed at as another tool, so the word is a pronoun for this module rather than a count of anything.",
      },

      {
        word: "three",
        kind: "fixed_by_a_gate",
        why: "The shapes the sweep decides, which `SHAPE_ARGUMENTS` holds and W288's test re-derives against a pinned set. The sentence says a clean sweep means 'none of the three shapes', so the word is the claim's scope rather than a measurement.",
      },
      {
        word: "four",
        kind: "rate",
        why: "'the four accepted hits in four different files' — the canary for the literal-blanking, and the point is that they sit in DIFFERENT files rather than how many there are. `ACCEPTED_TAUTOLOGIES` holds the count and W288's test pins it.",
      },
    ],
  },
  {
    module: "src/quality/assertion-drives.ts",
    name: "DRIVE_BOUND",
    unit: "W289",
    text: DRIVE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "until the comparison moves out of the test file",
      reads: "the census, for registers whose assertion is still unprovable",
      stillOpen: () =>
        TREE_DERIVED_REGISTERS.some((r) => r.assertion.kind === "assertion_unproven"),
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads W267's census, an imported constant listing what each register proves. The remedy — a comparison moved out of a test file — is recorded in that constant when it happens, so the lifting event is an edit to the register rather than a change to any tree this could be pointed at.",
      },
    },
    numbers: [
      {
        word: "One",
        kind: "rate",
        why: "'One assertion per register, driven once' — the unit of the claim, not a count of registers. It stays one however many registers arrive.",
      },
      {
        word: "four",
        kind: "rate",
        why: "'a register with four arms has three that nothing here touches' — an illustration of the ratio, with no register in the tree it refers to.",
      },
      {
        word: "three",
        kind: "rate",
        why: "The other half of the same illustration — 'four arms, three untouched' is the ratio the sentence is about, and no register in the tree is being counted by it.",
      },
      {
        word: "thirteen",
        kind: "unit_id",
        why: "Inside W297's parenthetical recording that this sentence USED to say thirteen when seventeen were executed. It is a quotation of a corrected error, which is why the correction says both numbers.",
      },
      {
        word: "seventeen",
        kind: "unit_id",
        why: "The other half of that quotation. Both are frozen in the record of the defect rather than describing the tree now — the tree's numbers live in the census.",
      },
    ],
  },
  {
    module: "src/quality/acceptances.ts",
    name: "ACCEPTANCE_BOUND",
    unit: "W294",
    text: ACCEPTANCE_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "Moving those comparisons out of their test files is W289's remedy",
      reads: "the acceptance registers, for one still re-derived only inside its own test",
      stillOpen: () =>
        ACCEPTANCE_REGISTERS.some((r) => r.rederivation.kind === "rederived_in_its_own_test"),
      lifted: {
        kind: "derived_without_a_tree",
        why: "It reads W294's own register of acceptance registers, an imported constant. The same shape as the drive bound beside it, and for the same reason: what would lift it is somebody re-classifying a register, which is an edit rather than a tree.",
      },
    },
    numbers: [
      {
        word: "four",
        kind: "unit_id",
        why: "Inside W297's parenthetical recording that this sentence used to say four cited and one by-review while the register held three and two. A quotation of the corrected error.",
      },
      {
        word: "one",
        kind: "unit_id",
        why: "The second half of that quotation — the sentence used to say one register was by-review, and the parenthetical records both the wrong number and the right one so the correction is legible.",
      },
      {
        word: "three",
        kind: "unit_id",
        why: "The corrected value, in the same parenthetical — how many registers are actually cited to an assertion in their own test file, recorded beside the number the sentence used to claim.",
      },
      {
        word: "two",
        kind: "unit_id",
        why: "The fourth number in the same quotation, and the reason a bound that records its own correction has to declare all of them.",
      },
    ],
  },
  {
    module: "src/quality/blind-spots.ts",
    name: "BLIND_SPOT_BOUND",
    unit: "W295",
    text: BLIND_SPOT_BOUND,
    lifting: {
      kind: "inherent",
      why: "It says a demonstrated bound proves ONE witness went unseen and cannot enumerate a detector's blind spots, because a detector's false negatives are not a finite list anybody can write down. No change to the tree lifts that; a sharper harness would demonstrate more witnesses and the sentence would still be true. An `inherent` entry can never go stale, which is exactly why the kind is enumerated here rather than available for the asking.",
    },
    numbers: [
      {
        word: "two",
        kind: "rate",
        why: "'a witness the register misses because it was malformed rather than because of the shape the sentence names' is the two-way distinction this word introduces, not a count of witnesses or registers.",
      },
      {
        word: "one",
        kind: "rate",
        why: "'proves that ONE witness went unseen' — the unit of what a demonstration buys, not a count of demonstrations.",
      },
    ],
  },
  {
    module: "src/quality/bounds.ts",
    name: "BOUNDS_BOUND",
    unit: "W297",
    text: BOUNDS_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "The remedy for that is a reader",
      reads: "W295's register, for a bound this one resolves that nothing has ever planted a witness against",
      stillOpen: () =>
        STATED_BOUNDS.some(
          (b) => BLIND_SPOTS[b.module]?.kind !== "demonstrated",
        ),
      lifted: {
        kind: "derived_without_a_tree",
        why: "It compares this register against W295's, both imported constants. A bound demonstrated by planting a witness is recorded there, so the lifting event is an entry arriving in that register — and this module reading itself is the reason its own predicate cannot be given a tree that differs from the one it was compiled with.",
      },
    },
    numbers: [],
  },
];

const NUMBER_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

/**
 * Every number-word a bound's text uses, in the case it uses.
 *
 * Word-bounded, so `one` does not match `none` and `ten` does not match `often` — the near-miss
 * W269's `namesAnotherPractice` hit and fixed the same way. Compound words like `twenty-seven` are
 * reported by their first part, which is enough to require a declaration.
 */
export function numberWordsIn(text: string): string[] {
  const found: string[] = [];
  for (const word of NUMBER_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    for (const match of text.matchAll(re)) found.push(match[0]);
  }
  return [...new Set(found)].sort();
}

export interface BoundDefect {
  /** `module::name`. */
  bound: string;
  what: string;
}

/**
 * Bounds whose remedy has been built — the sentence now describes a tree that is gone.
 *
 * W306: takes the root each predicate reads. Before that it took none, and the two predicates that
 * walk the filesystem closed over `process.cwd()` at module scope, so this function could be asked
 * about the repository and nothing else.
 */
export function staleBounds(
  root: string,
  bounds: readonly StatedBound[] = STATED_BOUNDS,
): BoundDefect[] {
  return bounds
    .filter((b) => b.lifting.kind === "remedy" && !b.lifting.stillOpen(root))
    .map((b) => ({
      bound: `${b.module}::${b.name}`,
      what: `the remedy it names has been built: ${(b.lifting as { remedy: string }).remedy}`,
    }));
}

/** Every lifting fixture in the register, merged — a tree in which every remedy that has one exists. */
function everyLiftingTree(bounds: readonly StatedBound[]): Plantable {
  const files: Record<string, string> = {};
  for (const bound of bounds) {
    if (bound.lifting.kind !== "remedy") continue;
    if (bound.lifting.lifted.kind !== "constructed_tree") continue;
    Object.assign(files, bound.lifting.lifted.files);
  }
  return files;
}

/**
 * W306: every remedy predicate driven against the claim its `lifted` declaration makes.
 *
 * THE UNIT. `staleBounds` asks each predicate whether the remedy is absent and every one says yes,
 * which is also what a predicate that had stopped deciding would say. This asks the other question:
 * can it ever say no.
 *
 * - `constructed_tree` — the files are planted and the predicate is asked again. Still open means
 *   it is not reading the tree it claims to read, and its clean answer above proved nothing.
 * - `derived_without_a_tree` — the predicate is asked about a bare root and about the root that
 *   lifts every other bound, and must not budge. A different answer means it does read the tree
 *   after all, and the declaration next to it is a description of code somebody stopped writing.
 * - `never_derived` — the same two roots, and the answer must be `true` for both. The kind says the
 *   predicate is a constant; this is what makes that a checked claim rather than a note.
 *
 * The opposite direction — a predicate stuck at `false` — is `staleBounds` in the same suite, which
 * would report every bound in the register as stale. The pair is the both-directions rule; neither
 * half is worth anything alone.
 */
export function liftedDefects(
  root: string,
  bounds: readonly StatedBound[] = STATED_BOUNDS,
): BoundDefect[] {
  const out: BoundDefect[] = [];
  const everything = everyLiftingTree(bounds);
  for (const bound of bounds) {
    if (bound.lifting.kind !== "remedy") continue;
    const id = `${bound.module}::${bound.name}`;
    const { stillOpen, lifted } = bound.lifting;
    if (lifted.kind === "constructed_tree") {
      if (withTree(lifted.files, (planted) => stillOpen(planted))) {
        out.push({ bound: id, what: "reads a tree in which its remedy EXISTS and still reports it absent" });
      }
      continue;
    }
    const here = stillOpen(root);
    const elsewhere = [withTree({}, (bare) => stillOpen(bare)), withTree(everything, (all) => stillOpen(all))];
    if (elsewhere.some((answer) => answer !== here)) {
      out.push({ bound: id, what: `is declared ${lifted.kind} and answers differently for a different root` });
    } else if (lifted.kind === "never_derived" && here !== true) {
      out.push({ bound: id, what: "is declared never_derived and is not the constant its declaration claims" });
    }
  }
  return out.sort((a, b) => `${a.bound}${a.what}`.localeCompare(`${b.bound}${b.what}`));
}

/**
 * Numbers in a bound's text that nobody declared, and declarations for numbers no longer there.
 *
 * The rule W288 adopted and this register enforces: a bound states no total. Enforced as a
 * declaration rather than a ban, because a number is not always a total — but an undeclared one is
 * the shape that goes wrong, and all three that had gone wrong were undeclared.
 */
export function numberDefects(bounds: readonly StatedBound[] = STATED_BOUNDS): BoundDefect[] {
  const out: BoundDefect[] = [];
  for (const bound of bounds) {
    const id = `${bound.module}::${bound.name}`;
    const found = new Set(numberWordsIn(bound.text).map((w) => w.toLowerCase()));
    const declared = new Set(bound.numbers.map((n) => n.word.toLowerCase()));
    for (const word of found) {
      if (!declared.has(word)) out.push({ bound: id, what: `states "${word}" and does not say what it is` });
    }
    for (const word of declared) {
      if (!found.has(word)) out.push({ bound: id, what: `declares "${word}", which the sentence no longer uses` });
    }
  }
  return out.sort((a, b) => `${a.bound}${a.what}`.localeCompare(`${b.bound}${b.what}`));
}

/**
 * Bounds whose unit or remedy does not resolve.
 *
 * A unit the ledger does not have, a unit that is not the one the module's own header claims, or a
 * remedy phrase that does not appear in the sentence it is supposed to summarise. All three are
 * citations, and W284's lesson is that a citation nobody resolves reads as coverage.
 */
export function unresolvedBounds(
  root: string,
  ledger: string,
  bounds: readonly StatedBound[] = STATED_BOUNDS,
): BoundDefect[] {
  const units = knownUnits(ledger);
  const out: BoundDefect[] = [];
  for (const bound of bounds) {
    const id = `${bound.module}::${bound.name}`;
    const n = Number(bound.unit.slice(1));
    if (!units.has(n)) out.push({ bound: id, what: `names ${bound.unit}, which the ledger does not have` });
    const file = path.join(root, bound.module);
    const stated = existsSync(file) ? headerUnit(readFileSync(file, "utf8")) : null;
    if (stated !== n) {
      out.push({ bound: id, what: `names ${bound.unit} and the module's header says W${stated}` });
    }
    if (bound.lifting.kind === "remedy" && !bound.text.includes(bound.lifting.remedy)) {
      out.push({ bound: id, what: `names a remedy the sentence does not contain` });
    }
  }
  return out.sort((a, b) => `${a.bound}${a.what}`.localeCompare(`${b.bound}${b.what}`));
}

/** Every `export const *_BOUND` under `root/src`, as `module::name`. */
export function boundsInTree(root: string): string[] {
  const found: string[] = [];
  for (const file of sourceModules(root)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/^export const ([A-Z][A-Z0-9_]*_BOUND)\b/gm)) {
      found.push(`${path.relative(root, file).split(path.sep).join("/")}::${match[1]}`);
    }
  }
  return found.sort();
}


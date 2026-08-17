// W297: the bounds register — every stated `*_BOUND` resolved to its unit and to its remedy.
//
// EIGHT MODULES EXPORT A SENTENCE SAYING WHAT THEY DO NOT PROVE. They are this tree's most useful
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
import { HEADER_CITATION_BOUND } from "./unit-headers";
import { CITATION_BOUND } from "./citations";
import { PLANTING_BOUND } from "./planting";
import { COUNT_BOUND } from "./register-counts";
import { MANIFEST_BOUND } from "./manifest";

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
  unit: string;
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
    module: "src/quality/manifest.ts",
    name: "MANIFEST_BOUND",
    unit: "W305",
    text: MANIFEST_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "W308 re-measures whether the tax moved",
      reads: "nothing — the predicate beside this line is the constant `true`, in W306's sense and by its rule",
      stillOpen: () => true,
      lifted: {
        kind: "never_derived",
        why: "W306's shape, and this bound is a clean case for it. The remedy is a MEASUREMENT a later unit takes, not a state of the tree a predicate could read: `manifestDiff` already returns empty, so a predicate over the tree would say `lifted` while the thing the sentence promises — W308 re-deriving the tax and reporting whether it moved — has not happened. So the predicate is the literal `true` and the reason is written here rather than implied by a function that reads nothing.",
      },
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
      kind: "remedy",
      remedy: "the same two derivations over the tree Q24 leaves behind, which is W308's whole job",
      reads: "the ledger, for W308's row still being open",
      // The bound says the number is good for comparison with itself and names W308 as the
      // comparison. It stops being true the day W308 lands, which is the quarter's own close.
      stillOpen: (root) =>
        !/^\| W308 \| done \|/m.test(readFileSync(path.join(root, "BUILD-STATE.md"), "utf8")),
      lifted: {
        kind: "constructed_tree",
        // A ledger in which the quarter's close has landed. This is the one bound in the register
        // whose remedy is SCHEDULED, so its lifted state is a tree the loop is going to build.
        files: {
          "BUILD-STATE.md":
            "| W308 | done | planted | 2026-08-17T00:00Z | 0000000 | the second measurement, planted so this predicate can be seen answering the other way. |\n",
        },
      },
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


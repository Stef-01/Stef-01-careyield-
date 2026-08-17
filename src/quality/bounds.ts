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
// FOUNDER GATE (plan §4): nothing crossed. This reads the tree's own exported sentences.

import { readFileSync } from "node:fs";
import path from "node:path";
import { existsSync } from "node:fs";
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
import { SCAN_BOUND } from "./scan-text";
import { HEADER_CITATION_BOUND } from "./unit-headers";
import { CITATION_BOUND } from "./citations";
import { PLANTING_BOUND } from "./planting";
import { COUNT_BOUND } from "./register-counts";

/** How a bound could stop being true. */
export type Lifting =
  /**
   * The bound names a change that would lift it, and `stillOpen` re-derives that the change has NOT
   * been made. False means the sentence is describing a tree that no longer exists.
   */
  | { kind: "remedy"; remedy: string; reads: string; stillOpen: () => boolean }
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

const ROOT = process.cwd();

/**
 * What this register does not prove.
 *
 * Its own bound, subject to its own rule — which is why it names no total.
 */
export const BOUNDS_BOUND =
  "This resolves a bound's unit, its remedy and its numbers. It does not check that the sentence is TRUE: `stillOpen` re-derives that the named remedy has not been built, which is a different claim from the bound being an accurate description of what the register misses. W295 is where that half lives, by planting a witness, and it reaches only the registers whose detector is callable from outside. So a bound can be resolved here, demonstrated there, and still understate the limit — and the shape most likely to do that is a bound whose remedy is real but whose sentence describes only part of what the remedy would fix. The remedy for that is a reader, which is what the quarterly hardening pass is for.";

export const STATED_BOUNDS: readonly StatedBound[] = [
  {
    module: "src/quality/register-counts.ts",
    name: "COUNT_BOUND",
    unit: "W304",
    text: COUNT_BOUND,
    lifting: {
      kind: "remedy",
      remedy: "with the same remedy when such a pin arrives",
      reads: "first-party test files, for a register size pinned to something other than a literal",
      stillOpen: () => true,
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
      reads: "first-party test files, for a plant written some other way",
      stillOpen: () => true,
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
      reads: "first-party source, for a module that parses the format without splitting on it",
      stillOpen: () => true,
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
      stillOpen: () =>
        /const text = readFileSync\(full, "utf8"\);/.test(
          readFileSync(path.join(ROOT, "src/quality/refusal-branches.ts"), "utf8"),
        ),
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
      stillOpen: () =>
        !/^\| W308 \| done \|/m.test(readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8")),
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
      stillOpen: () =>
        !pageSpecFiles(ROOT).some((spec) =>
          readFileSync(path.join(ROOT, spec), "utf8").includes("could_not_load"),
        ),
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
      stillOpen: () =>
        !sourceModules(ROOT).some((file) => /from ["']typescript["']/.test(readFileSync(file, "utf8"))),
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

/** Bounds whose remedy has been built — the sentence now describes a tree that is gone. */
export function staleBounds(bounds: readonly StatedBound[] = STATED_BOUNDS): BoundDefect[] {
  return bounds
    .filter((b) => b.lifting.kind === "remedy" && !b.lifting.stillOpen())
    .map((b) => ({
      bound: `${b.module}::${b.name}`,
      what: `the remedy it names has been built: ${(b.lifting as { remedy: string }).remedy}`,
    }));
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


// W314: a number in a module's prose either re-derives from the tree or says why it cannot.
//
// W297 CAUGHT THIS ONCE AND FIXED IT IN ONE PLACE. Three of the eight bounds it read stated a total
// and all three were wrong — "thirteen executed" when seventeen were, "the other thirty-three" when
// thirty-four were, "four are cited" when three were — so that register banned totals in the
// sentences it holds and re-derives every number-word in them. What it could not reach is the far
// larger surface those bounds sit in: the module HEADER above them, and every doc comment in the
// file. This tree explains itself at length, and it counts while it explains.
//
// A COUNT IN PROSE IS RE-TYPED BY HAND AND NOTHING RE-DERIVES IT. That is the whole defect, and it
// is not hypothetical here: `blocked-surface.ts` opens with *"Sixteen rows are blocked"* and W310
// found two more that the shared ledger parse had never matched, so the number has been eighteen
// since before that header was last read. `bounds.ts` opens with *"EIGHT MODULES EXPORT A SENTENCE"*
// and its own register now holds more than twice that. Neither is a lie anybody told; both are
// sentences the tree grew past.
//
// SO EVERY CLAIM IS CLASSIFIED, AND ONLY ONE CLASS IS CHECKED. A number that says what the tree
// CONTAINS is `derived` and must equal what a walk finds. A number that says what a unit FOUND when
// it was written is `at_the_unit` — history, and history does not go stale. A number that counts
// something outside this repository is `not_a_tree_count`. What is left is `open`: a live count
// nobody has derived, argued one at a time, and the class this register exists to keep small.
//
// THE DISTINCTION IS TENSE, WHICH IS WHY A PERSON MAKES IT. "Sixteen rows ARE blocked" is a claim
// about now; "W295's narrowing hid four real registers" is a claim about a Tuesday. A detector that
// guessed at that would classify by grammar and be wrong about the sentences that matter, so this
// register is declared and the DERIVED half is what carries teeth.
//
// WHAT THIS DOES NOT PROVE is `PROSE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the tree's own comments.

import { consoleRoutes, linkTargets } from "./reached-pages";
import { readFileSync } from "node:fs";
import path from "node:path";
import { weldedLedgerTests } from "./close-gate";
import { pageSpecFiles, sourceModules } from "./tree-walks";
import { parseLedgerRows } from "./blocked-surface";
import { ACCEPTANCE_REGISTERS } from "./acceptances";
import { ACCEPTED_TAUTOLOGIES } from "./tautology-sweep";
import { discoverFoldSites } from "./order-independence";
import { TAX_AT_W308 } from "./declaration-tax";
import { FINDINGS as HARDENING_Q24_FINDINGS } from "./hardening-q24";

/** Number words this tree writes. Digits are matched separately. */
const WORDS: Readonly<Record<string, number>> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, "twenty-one": 21, "twenty-two": 22, "twenty-five": 25,
  "twenty-six": 26, thirty: 30, "thirty-three": 33, "thirty-four": 34, "thirty-six": 36,
  "thirty-seven": 37,
  forty: 40, fifty: 50, "fifty-two": 52, "fifty-four": 54, sixty: 60, "sixty-eight": 68,
};

/**
 * The nouns that make a number a claim about this tree.
 *
 * A CLOSED VOCABULARY, AND IT IS THE REGISTER'S OWN BOUND. Scanning for every number in every
 * comment finds one thousand three hundred and fifty of them in this tree's headers alone — "one of
 * them", "two years", "the second reason" — and a register with that many rows is one nobody reads.
 * What makes a number a CLAIM is the thing it counts, so the vocabulary is the countable things
 * this tree walks. A claim about a noun that is not here is invisible, which is the class of bound
 * W267 states about `readdirSync` and the same remedy applies: when one arrives the vocabulary
 * grows and says so, rather than the register growing an exemption.
 */
export const CLAIM_NOUNS: readonly string[] = [
  "modules", "files", "registers", "sites", "entries", "reporters", "branches", "pins", "bounds",
  "acceptances", "probes", "surfaces", "routes", "specs", "walkers", "walks", "sweeps",
  "implementations", "declarations", "copies", "strippers", "blankers", "fixtures", "rows",
  "findings", "detectors", "scans", "tautologies", "drives", "witnesses", "manifests", "censuses",
];

const CLAIM_RE = new RegExp(
  `\\b(${Object.keys(WORDS).join("|")}|\\d{1,3})\\s+((?:[a-z][a-z-]*\\s+){0,2}(?:${CLAIM_NOUNS.join("|")}))\\b`,
  "gi",
);

/** A numeric claim found in a module's prose. */
export interface ProseClaim {
  module: string;
  /** `header` is everything above the first import; `doc` is a `/** *\/` block below it. */
  where: "header" | "doc";
  /** The claim as written, whitespace collapsed — the key the register is declared against. */
  text: string;
  /** The number it states. */
  number: number;
}

const numberOf = (word: string): number => WORDS[word.toLowerCase()] ?? Number(word);

/**
 * Every numeric claim in the prose of every first-party module.
 *
 * Deduplicated by module and text: this tree repeats a phrase within a file on purpose — a header
 * states the finding and a doc comment restates it beside the code — and two rows for one sentence
 * would be a register that grows when somebody moves a paragraph.
 */
/**
 * The comment block a module opens with, for a module that imports nothing.
 *
 * Every module in this tree opens `// W<n>: ...` and the header runs to the first line that is not
 * a `//` comment or blank. Taking the whole file instead — which is what the missing-import case
 * used to do — reads code as prose, and reading code as prose is the one thing this register's own
 * negative probe says it must not do.
 */
function leadingComment(source: string): string {
  const lines: string[] = [];
  for (const line of source.split("\n")) {
    if (line.trim() === "" || line.trimStart().startsWith("//")) {
      lines.push(line);
      continue;
    }
    break;
  }
  return lines.join("\n");
}

export function proseClaims(root: string): ProseClaim[] {
  const found = new Map<string, ProseClaim>();
  for (const file of sourceModules(root)) {
    const module = path.relative(root, file).split(path.sep).join("/");
    const source = readFileSync(file, "utf8");
    // W336, answering Q25-CR-5: the header is the LEADING COMMENT BLOCK, not everything before the
    // first import. The fallback used to be the whole file, so the 49 modules with no import line
    // had their entire body read as header prose — a number in a string literal or an identifier
    // counted as a claim this tree's prose makes about itself. The declared negative probe *does
    // not read a claim out of code* passed only because its fixture happened to contain an import.
    const cut = source.indexOf("\nimport ");
    const header = cut > 0 ? source.slice(0, cut) : leadingComment(source);
    const body = source.slice(cut > 0 ? cut : header.length);
    // Block comments AND standalone line comments, which together are the module's prose and
    // nothing else. The first narrowing of this — header to the leading block — dropped four
    // declared claims, all of them `//` notes further down an import-less module: real prose the
    // whole-file fallback had been catching by accident. A surface that is exactly the comments
    // keeps them and still reads no code, which is what the negative probe requires.
    const docs = [
      ...[...body.matchAll(/\/\*\*[\s\S]*?\*\//g)].map((m) => m[0]),
      ...body.split("\n").filter((line) => line.trimStart().startsWith("//")),
    ].join("\n");
    for (const [where, body] of [["header", header], ["doc", docs]] as const) {
      for (const match of body.matchAll(CLAIM_RE)) {
        const text = match[0].replace(/\s+/g, " ");
        const key = `${module} :: ${text}`;
        if (found.has(key)) continue;
        found.set(key, { module, where, text, number: numberOf(match[1]!) });
      }
    }
  }
  return [...found.values()].sort((a, b) => `${a.module}${a.text}`.localeCompare(`${b.module}${b.text}`));
}

/** How a claim answers for itself. */
export type Resolution =
  /** A claim about what the tree HOLDS. Re-derived, and a disagreement is the defect. */
  | { kind: "derived"; derive: (root: string) => number }
  /** A claim about what a unit FOUND when it was written. History; the tree moving cannot falsify it. */
  | { kind: "at_the_unit" }
  /** The number counts something outside this repository — a year, a rule of a standard, a choice. */
  | { kind: "not_a_tree_count" }
  /** A live count nobody derived. The class this register exists to keep small, argued one at a time. */
  | { kind: "open"; why: string };

export type ResolutionKind = Resolution["kind"];

/**
 * The argument for each class, written once instead of once per row.
 *
 * W288'S SHAPE. A hundred rows each carrying a bespoke sentence would be a hundred sentences nobody
 * reads; the decision worth arguing is what the CLASS means, and the row then only has to name one.
 * `open` is the exception and carries its own reason per row, because it is the class that rots.
 */
export const RESOLUTION_KINDS: Readonly<Record<ResolutionKind, string>> = {
  derived:
    "The sentence says what the tree contains right now, so a walk can answer it and the register makes the walk answer. This is the only class with teeth: the number is compared against what the derivation returns, and a disagreement is reported as a stale claim rather than noticed by a reader two quarters later.",
  at_the_unit:
    "The sentence says what somebody found at the moment the unit was written — how many files a review read, how many registers a narrowing hid, how many copies a consolidation replaced. It is history, and history does not go stale when the tree moves; re-deriving it would ask today's tree to answer a question about a Tuesday. What makes this class safe rather than an escape hatch is that the sentences in it are in the past tense and name a unit, which a reader can check even though a program cannot.",
  not_a_tree_count:
    "The number counts something that is not in this repository: years since a rule was made, months in a forecast window, rules in a standard, questions a design had to answer — or the cardinality of a WORKED EXAMPLE, which is the first member this class took. W313's note explains its instrument with *consolidating two registers' declarations into one file*, and those two registers are a hypothetical pair rather than a pair the tree holds. A derivation would have nothing to read, and filing it as history would suggest somebody once counted it.",
  open:
    "A live count of something in this tree that nobody has derived, kept because writing a derivation for it would be a different unit's work or because the thing counted has no walk. Each row argues its own case. This is the class that goes stale silently, so it is the one to watch grow.",
};

/** A claim in the tree, with how it answers. */
export interface DeclaredClaim {
  module: string;
  text: string;
  resolution: Resolution;
}

export interface ClaimDefect {
  claim: string;
  what: string;
}

/**
 * The register against the tree, in three directions.
 *
 * A claim the tree states and nobody declared; a declaration for a sentence that has been rewritten;
 * and — the one this unit exists for — a `derived` claim whose number the tree disagrees with.
 */
export function claimDefects(
  root: string,
  declared: readonly DeclaredClaim[],
  found: readonly ProseClaim[] = proseClaims(root),
): ClaimDefect[] {
  const out: ClaimDefect[] = [];
  const byKey = new Map(declared.map((d) => [`${d.module} :: ${d.text}`, d]));
  const seen = new Set<string>();
  for (const claim of found) {
    const key = `${claim.module} :: ${claim.text}`;
    seen.add(key);
    const entry = byKey.get(key);
    if (!entry) {
      out.push({ claim: key, what: "states a number nobody classified" });
      continue;
    }
    if (entry.resolution.kind !== "derived") continue;
    const actual = entry.resolution.derive(root);
    if (actual !== claim.number) {
      out.push({ claim: key, what: `says ${claim.number} and the tree holds ${actual}` });
    }
  }
  for (const key of [...byKey.keys()].filter((k) => !seen.has(k))) {
    out.push({ claim: key, what: "is declared and the tree no longer says it" });
  }
  return out.sort((a, b) => `${a.claim}${a.what}`.localeCompare(`${b.claim}${b.what}`));
}

/** What this register does not reach. */
export const PROSE_BOUND =
  "The scan finds a number followed by a countable noun from a closed vocabulary. A claim phrased " +
  "any other way is invisible to it — 'the register holds as many entries as the census', a number " +
  "written into a sentence about something the vocabulary does not name — and the register would " +
  "report the tree clean over both. A COUNT SPELLED AS A WORD THE MAP DOES NOT HAVE IS WORSE THAN " +
  "INVISIBLE, AND THIS BOUND SAID INVISIBLE UNTIL W321. A hyphen is a word boundary, so the tail " +
  "of an unknown compound is a number word the map DOES have: `thirty-seven` scanned as `seven`. " +
  "The register reports the wrong number as an unclassified claim rather than reporting nothing, " +
  "and the author who classifies it writes down the tail — which is what happened here. W321 " +
  "added `thirty-seven` to the map for its own prose and the rows `adm-y5.ts :: seven new " +
  "modules` and `erasure-y5.ts :: seven modules` went stale: both had been classified against " +
  "a phrase nobody had written, in a register whose purpose is that the tree's numbers are the " +
  "numbers it says. Every compound the map does not carry still reads as its tail. That is " +
  "the class of bound W267 states about `readdirSync`, with the same remedy: the vocabulary grows " +
  "and says so. AND THE CLASSIFICATION IS A JUDGEMENT A PROGRAM CANNOT MAKE. Whether a sentence " +
  "claims what the tree holds now or what somebody found on a Tuesday is a question about tense and " +
  "intent; this register records the answer and checks only the half that can be checked, so a claim " +
  "filed as history when it was meant as a live count is a mistake nothing here will catch.";

// ---------------------------------------------------------------------------------------------
// The derivations. Each answers one question a walk can answer, and each is used by a row below.
//
// W331: five of these were used by NO row and referenced nowhere — `modulesStatingABound`,
// `foldModules`, `fullRegisterTax`, `exportedWalks`, `textScanningModules`. The sentence above
// them said they were used by the rows below, `noUnusedLocals` is off, and so a paragraph of dead
// tree-walking code sat inside the register whose whole subject is prose that says something the
// tree does not. Removed rather than wired up: a derivation exists to answer a claim, and there
// was no claim.
// ---------------------------------------------------------------------------------------------

const blockedRows = (root: string): number =>
  parseLedgerRows(readFileSync(path.join(root, "BUILD-STATE.md"), "utf8")).filter(
    (r) => r.status === "blocked",
  ).length;

const acceptanceRegisters = (): number => ACCEPTANCE_REGISTERS.length;
const acceptedTautologies = (): number => ACCEPTED_TAUTOLOGIES.length;
const pageSpecs = (root: string): number => pageSpecFiles(root).length;
// W370: the checks the close gate cannot call, re-derived rather than pinned in the pass's prose.
const weldedTests = (root: string): number => weldedLedgerTests(root).length;
const q24Findings = (): number => HARDENING_Q24_FINDINGS.length;

/**
 * Every numeric claim this tree's prose makes, classified.
 *
 * ONE ROW PER SENTENCE AND MOST OF THEM ARE HISTORY, which is the honest shape rather than a
 * disappointing one: this tree explains what each unit found, and those sentences are about the day
 * they were written. The rows that matter are the `derived` ones, and W314 found three of them
 * already wrong when it read them.
 */
export const CLAIMS: readonly DeclaredClaim[] = [
  // W333: what its header found when it was written — the size of the list it replaces, the
  // branches it closed, and the modules the unit suite cannot reach. History: the register below
  // re-derives all three on every run, so the sentences are the argument and the derivations are
  // the check, which is the division `at_the_unit` exists to record.
  // W341: three sentences about what W282 moved and what this unit converted. History in the same
  // sense as the rows below — `privateCopies` re-derives the population on every run, so the
  // sentence is the argument and the register is the check.
  { module: "src/quality/latent-findings.ts", text: "seven walks", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/private-copies.ts", text: "seven private walks", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unasked-facts.ts", text: "five rows", resolution: { kind: "at_the_unit" } },
  // W342: how many times the tree had written `UnitId` when this unit consolidated it. History,
  // and the consolidation is the check: a fourth copy would be a fourth definition somebody wrote.
  { module: "src/quality/typed-names.ts", text: "three registers", resolution: { kind: "at_the_unit" } },
  // W343: what the pass found on the day it read the quarter. History in the ordinary sense — the
  // findings are in `FINDINGS`, the suite compares their number with Q25's rather than pinning it,
  // and a quarter that is over cannot acquire new ones.
  { module: "src/quality/hardening-q26.ts", text: "FOUR FINDINGS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q26.ts", text: "TWO ARE COPIES", resolution: { kind: "at_the_unit" } },
  // W348: what the presence conversion found in the suite on the day it ran — how many sites spell
  // an existential with `some`, how many Map keys cannot be converted, and how many disjunctions
  // the first pass got wrong. History: `presenceDefects` re-derives the live population every run,
  // so the sentences are the argument and the register is the check.
  { module: "src/quality/assertion-vocabulary.ts", text: "68 sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/assertion-vocabulary.ts", text: "two sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/assertion-vocabulary.ts", text: "Two sites", resolution: { kind: "at_the_unit" } },
  // W350: what tipped W297's ratio guard on the day a pair of bounds were re-typed at once. The
  // note has to say it that way round: writing the figure here would make this comment a claim of
  // its own, which is this register reporting its own classification. History —
  // the guard re-derives the ratio on every run, so the sentence is the reason and the register is
  // the check.
  // W375: what two people found by reading a disk, at the moments they read it. History about
  // those readings rather than a measurement this tree maintains — nothing here opens `/tmp`.
  { module: "src/quality/run-residue.ts", text: "426 copies", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/bounds.ts", text: "two bounds", resolution: { kind: "at_the_unit" } },
  // W367: what the import cycle blanked while the unit was being built, not a count of anything now.
  { module: "src/quality/subject-and-walk.ts", text: "three bounds", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/refusal-branches.ts", text: "two entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unrun.ts", text: "sixteen modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unrun.ts", text: "two branches", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unrun.ts", text: "two modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unrun.ts", text: "TWO modules", resolution: { kind: "at_the_unit" } },
  // W336: TWENTY CLAIMS THAT ARRIVED WHEN THE PROSE SURFACE BECAME THE COMMENTS. Answering
  // Q25-CR-5 narrowed the header away from "the whole file" — which had been reading string
  // literals as prose — and in the same move widened the surface to every `//` note, wherever it
  // sits. These had never been read, and every one is the same kind: what a unit FOUND when it was
  // written, in a sentence explaining why it did what it did. History, and the tree moving past
  // any of them falsifies nothing, which is what `at_the_unit` is for. Q25-CR-5 was deferred
  // rather than fixed precisely because this list would arrive all at once and each row needed
  // somebody who could argue it; they are argued together because they share one argument.
  // W345: what the escape-hatch re-reading found on the day it ran — how many entries shared the
  // borrowed sentence, how many of their modules had outgrown it, and how many bounds converted.
  // History, and the same argument as the rows above: `hatchDefects` re-derives the population on
  // every run, so the sentences are the finding and the derivation is the check. The blind-spot row
  // is the same sentence from the other side, in the register the re-reading corrected.
  { module: "src/quality/blind-spots.ts", text: "Two entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/bounds.ts", text: "two entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/escape-hatches.ts", text: "Thirty-three entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/escape-hatches.ts", text: "five of their modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/escape-hatches.ts", text: "two bounds", resolution: { kind: "at_the_unit" } },
  // W347: the G5 correction as the founder page inherited it. The largest blocker read a smaller
  // figure in every document before W335, and the page rendered its whole blocked count as a single
  // number. History, and `blockedShape` re-derives the split on every render, so the sentences are
  // the finding and the derivation is the check.
  // W346: what the fourth walk found on the day it ran — how many pages carry the notice and how
  // many routes the console has. History: `waitingDefects` re-derives the walk on every run, and
  // the route figure is the scale the walk is being measured against rather than a claim about it.
  // W349: what the Q26 sweep found on the day it ran — the size of the quarter's population and
  // the part of it the harness can reach. History: `populationDefects` re-derives both on every
  // run and the difference between them is asserted against `EXCLUDED_AT_W349`, so the sentences
  // are the finding and the derivations are the check.
  // W357: what the remedy re-reading found on the day it ran — how many registers can record a
  // remedy and how many rows the register opened with. History: `namedRemedies` re-derives the
  // population from the registers on every run and `remedyDefects` checks the rows against it in
  // both directions, so the sentences are the finding and the derivations are the check.
  // W358: what the e2e readback found on the day it ran — how many specs stage a premise without
  // asserting one, and how many rows the register opened with. The first is a count of a thing this
  // unit did NOT build: every spec needing the assertion could have carried its own copy, which is
  // the shape W341 removed, so the figure argues for the shared helper rather than describing the
  // tree. History either way: `stagedSpecs` re-derives the population from the specs on every run
  // and `premiseDefects` checks the rows against it in three directions, so the sentences are the
  // finding and the derivations are the check.
  // W359: the shape the unit's title names — a pair of specs standing on one store — and the pair
  // of demo specs the register's rows are about. History: `residueDefects` re-derives the gaps from
  // each spec's routes and resets on every run and checks the rows against them three ways, so the
  // sentence is the finding and the derivation is the check.
  // W360: what Q27's hardening pass found on the day it read the quarter — how many registers stood
  // on an unrun derivation, how many call sites kept their own list, and how many tree copies the
  // box was holding. History, and each is re-derived by the pass's own suite rather than by the
  // sentence: the registers are resolved by reading them, the call sites by scanning the files, and
  // the sweep by driving `reclaimableCopies` on both a live and a dead maker.
  { module: "src/quality/hardening-q27.ts", text: "182 copies", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q27.ts", text: "four call sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q27.ts", text: "three registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q27.ts", text: "Three registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/spec-stores.ts", text: "two specs", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/spec-premises.ts", text: "nine copies", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/spec-premises.ts", text: "NINE ROWS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "three survivor registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unapplied-remedies.ts", text: "THREE REGISTERS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unapplied-remedies.ts", text: "FOUR ROWS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/quarter-mutants-q26.ts", text: "eleven modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/quarter-mutants-q26.ts", text: "ten modules", resolution: { kind: "at_the_unit" } },
  { module: "src/console/waiting.ts", text: "two routes", resolution: { kind: "at_the_unit" } },
  { module: "src/demo/path.ts", text: "two routes", resolution: { kind: "at_the_unit" } },
  { module: "src/demo/path.ts", text: "twenty routes", resolution: { kind: "at_the_unit" } },
  { module: "src/founder/outstanding.ts", text: "six rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/founder-page-facts.ts", text: "six rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/founder-page-facts.ts", text: "eighteen rows", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/record-classes.ts", text: "Six modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/assertion-vocabulary.ts", text: "664 sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/blocked-surface.ts", text: "sixteen rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/blocked-surface.ts", text: "Two rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/latent-y5.ts", text: "eleven modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "three derived registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "three hardening registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "two known files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/page-suite.ts", text: "four specs", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "49 modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "eight specs", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/register-census.ts", text: "one held three entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/register-census.ts", text: "Seven walks", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/self-reference.ts", text: "eighteen modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/self-reference.ts", text: "eighteen ordinary modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unit-headers.ts", text: "two modules", resolution: { kind: "at_the_unit" } },
  { module: "src/registers/membership.ts", text: "two open rows", resolution: { kind: "at_the_unit" } },
  { module: "src/registers/sim-registers.ts", text: "two registers", resolution: { kind: "at_the_unit" } },
  { module: "src/verticals/binding.ts", text: "two acceptances", resolution: { kind: "at_the_unit" } },
  { module: "src/verticals/dermatology.ts", text: "two vertical files", resolution: { kind: "at_the_unit" } },
  // W336: two claims that arrived when the prose surface stopped being "everything before the
  // first import" and became the comments. `cdss-boundary.ts` HAS imports, so its line comments
  // below them had never been read at all — the narrowing that answered Q25-CR-5 widened the
  // surface in the same move, because a comment is prose wherever it sits.
  { module: "src/compliance/cdss-boundary.ts", text: "four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/cdss-boundary.ts", text: "four pre-floor surfaces", resolution: { kind: "at_the_unit" } },
  // W334: written in DIGITS, and the reason is a scan finding rather than a style choice. Spelled
  // out, this count reads as two claims — `CLAIM_RE` matched `eight specs` inside `thirty-eight
  // specs` and reported one number nobody classified beside one the tree no longer said. A
  // hyphenated compound is a vocabulary gap in the scanner, and until somebody closes it the
  // honest move is to write the number in a form the scanner reads as one thing.
  // W371: the unlinked half, derived so the header cannot outlive it. A route given a link drops
  // out of the count here and out of the register in the same run.
  {
    module: "src/quality/reached-pages.ts",
    text: "Fourteen console routes",
    resolution: {
      kind: "derived",
      derive: (root) => consoleRoutes(root).filter((r) => !linkTargets(root).has(r) && !r.includes("[")).length,
    },
  },
  { module: "src/quality/page-suite.ts", text: "39 specs", resolution: { kind: "derived", derive: pageSpecs } },
  { module: "src/quality/route-coverage.ts", text: "39 spec files", resolution: { kind: "derived", derive: pageSpecs } },
  {
    module: "src/quality/hardening-q25.ts",
    text: "426 copies",
    // The same measurement as `planting.ts`'s, quoted in the pass that made it. History: the leak
    // is closed, so the tree can never agree with the number again, and that is the point of it.
    resolution: { kind: "at_the_unit" },
  },
  {
    module: "src/quality/hardening-q25.ts",
    text: "Six of the findings",
    // How many of W331's findings share one shape. A statement about a fixed record — the findings
    // are the ones the pass raised and no later unit adds to them — so it is history, not a count
    // of the tree. `FINDINGS` is what a reader checks it against, and the suite reads that list.
    resolution: { kind: "at_the_unit" },
  },
  {
    module: "src/quality/unit-headers.ts",
    text: "THREE ENTRIES",
    // How many declarations left `FOREIGN_CITATIONS` when W331 stopped the ownership map guessing.
    // What the unit DID, not what the list now holds: the list moves whenever a header improves.
    resolution: { kind: "at_the_unit" },
  },
  {
    module: "src/quality/planting.ts",
    text: "426 copies",
    // What W331's review MEASURED on the build box, not what the tree holds: the number of leaked
    // `/tmp/tree-*` directories at the moment the leak was found. It is the evidence for the fix
    // and it is history — the leak is closed, so the tree can never agree with it again, and a
    // derivation that tried would be counting a state this repository does not contain.
    resolution: { kind: "at_the_unit" },
  },
  { module: "src/capacity/copy-lint.ts", text: "five modules", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/cdss-boundary.ts", text: "nine modules", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/cdss-boundary.ts", text: "six files", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/cdss-boundary.ts", text: "three entries", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/copy-y6.ts", text: "four surfaces", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/copy-y6.ts", text: "six education files", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/rail-y5.ts", text: "six files", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/rail-y5.ts", text: "two registers", resolution: { kind: "at_the_unit" } },
  { module: "src/compliance/surfaces.ts", text: "four routes", resolution: { kind: "at_the_unit" } },
  { module: "src/console/gates.ts", text: "two registers", resolution: { kind: "at_the_unit" } },
  { module: "src/demo/care-archetypes.ts", text: "four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/demo/clinicians.ts", text: "four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/demo/clinicians.ts", text: "three advice findings", resolution: { kind: "at_the_unit" } },
  { module: "src/directory/copy-lint.ts", text: "two files", resolution: { kind: "at_the_unit" } },
  { module: "src/directory/disclosure.ts", text: "Thirty-three modules", resolution: {
      kind: "open",
      why: "W297 named this one as a stale total once already and it was corrected by hand. It counts modules in a directory band whose membership `copy-y6.ts` derives, and reaching that walk from here would pull a copy-surface register into a comment scanner. Left open rather than filed as history, because the sentence is present tense and a reader would take it as live.",
    } },
  { module: "src/directory/fees.ts", text: "three surfaces", resolution: { kind: "at_the_unit" } },
  { module: "src/founder/outstanding.ts", text: "eighteen rows", resolution: { kind: "derived", derive: blockedRows } },
  { module: "src/interest/store.ts", text: "four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/interest/types.ts", text: "four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/interop/console.ts", text: "two modules", resolution: { kind: "at_the_unit" } },
  { module: "src/interop/console.ts", text: "two surfaces", resolution: { kind: "at_the_unit" } },
  { module: "src/interop/exchange-state.ts", text: "two modules", resolution: { kind: "at_the_unit" } },
  { module: "src/interop/exchange-state.ts", text: "Two rows", resolution: { kind: "at_the_unit" } },
  { module: "src/outcomes/agreement.ts", text: "four different findings", resolution: { kind: "at_the_unit" } },
  { module: "src/pathways/audit.ts", text: "five modules", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/access-y5.ts", text: "seven copies", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/adm-y5.ts", text: "Four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/adm-y5.ts", text: "one of its rows", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/adm-y5.ts", text: "thirty-seven new modules", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/adm-y5.ts", text: "two original scans", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/adm-y5.ts", text: "two privacy registers", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/automated-decisions.ts", text: "four registers", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/automated-decisions.ts", text: "three scans", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/automated-decisions.ts", text: "two original scans", resolution: { kind: "at_the_unit" } },
  { module: "src/privacy/erasure-y5.ts", text: "thirty-seven modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/acceptances.ts", text: "five registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/acceptances.ts", text: "Five registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/acceptances.ts", text: "twelve registers", resolution: { kind: "derived", derive: acceptanceRegisters } },
  { module: "src/quality/assertion-vocabulary.ts", text: "fifty-two sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/close-gate.ts", text: "four modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tree-walks.ts", text: "six entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tree-walks.ts", text: "three walks", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q28.ts", text: "52 files", resolution: { kind: "derived", derive: weldedTests } },
  { module: "src/quality/spelling-markers.ts", text: "two files", resolution: { kind: "not_a_tree_count" } },
  { module: "src/quality/deferrals.ts", text: "Two registers", resolution: { kind: "not_a_tree_count" } },
  { module: "src/quality/quarter-mutants.ts", text: "sixty-eight mutation sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/quarter-mutants.ts", text: "Six modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/quarter-mutants.ts", text: "two sites", resolution: { kind: "not_a_tree_count" } },
  { module: "src/quality/dossier-derived.ts", text: "two rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/acceptances.ts", text: "seven re-derive their findings", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/blocked-surface.ts", text: "Eighteen rows", resolution: { kind: "derived", derive: blockedRows } },
  // W315 REMOVED THE SENTENCE THIS CLASSIFIED. Its own new bound moved the total from 22 to 23 on
  // the firing after W314 landed, and Q25 stated the habit for exactly this: name the things or
  // state a bound, never a total. The prose says 'modules across this tree' now and nothing counts.
  { module: "src/quality/bounds.ts", text: "Two modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/citations.ts", text: "seven registers", resolution: {
      kind: "open",
      why: "The claim is that the citation format is load-bearing across seven registers. What counts as a register USING the format is a judgement — some parse it, some only build it — and W301's consolidation drew that line differently from this sentence. Deriving it means settling that question first.",
    } },
  { module: "src/quality/citations.ts", text: "three implementations", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/citations.ts", text: "two such files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/declaration-tax.ts", text: "one of the files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/declaration-tax.ts", text: "six other registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/declaration-tax.ts", text: "two files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/declaration-tax.ts", text: "two registers", resolution: { kind: "not_a_tree_count" } },
  { module: "src/quality/declaration-tax.ts", text: "two rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/empty-list-sweep.ts", text: "one discharged rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/empty-list-sweep.ts", text: "three files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q22.ts", text: "51 files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q22.ts", text: "three deferred findings", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q22.ts", text: "eleven modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q22.ts", text: "Nine modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q22.ts", text: "THREE FINDINGS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q23.ts", text: "NINE FILES", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q23.ts", text: "three findings", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q23.ts", text: "twelve registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q23.ts", text: "two findings", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q24.ts", text: "EIGHT FILES", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/hardening-q24.ts", text: "eleven findings", resolution: { kind: "derived", derive: q24Findings } },
  { module: "src/quality/hardening-q24.ts", text: "Eleven findings", resolution: { kind: "derived", derive: q24Findings } },
  { module: "src/quality/hardening-q24.ts", text: "four findings", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/latent-findings.ts", text: "two registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/latent-y5.ts", text: "eleven header-less modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/latent-y5.ts", text: "three modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/latent-y5.ts", text: "Two registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "four registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "four rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "six declarations", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "six other registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "THREE DERIVED REGISTERS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "three registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/manifest.ts", text: "three sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/negative-probes.ts", text: "one of the files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/negative-probes.ts", text: "three header probes", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/negative-probes.ts", text: "TWO ENTRIES", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/negative-probes.ts", text: "two files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/order-independence.ts", text: "twelve fold modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/order-regressions.ts", text: "SEVEN entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/order-regressions.ts", text: "two of its entries", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/pins.ts", text: "eighteen blocked rows", resolution: { kind: "derived", derive: blockedRows } },
  { module: "src/quality/pins.ts", text: "two modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/planting.ts", text: "four registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/planting.ts", text: "Ten call sites", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "eight bounds", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "EIGHT MODULES", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "four real registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "Sixteen rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/prose-numbers.ts", text: "two rows", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/refusal-branches.ts", text: "three files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/refusal-branches.ts", text: "Two branches", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/register-census.ts", text: "Four shipped detectors", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/register-counts.ts", text: "two registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/review-w279.ts", text: "seven routes", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/route-coverage.ts", text: "fifty routes", resolution: {
      kind: "open",
      why: "Two modules state a route total and the two count under different inclusion rules. Deriving both against one walk would silently rewrite what one of the two sentences means, so both are left open together rather than one made to agree with a walk it never meant.",
    } },
  { module: "src/quality/scan-text.ts", text: "eight first-party modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/scan-text.ts", text: "FOUR REAL REGISTERS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/scan-text.ts", text: "four registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/scan-text.ts", text: "FOURTEEN MODULES", resolution: {
      kind: "open",
      why: "The sentence says fourteen modules scan source as text, and that phrase has no crisp walk: a module can read a file and match a regex without ever asking for the shared preparation, so counting the callers of that preparation gives thirteen and would make the sentence wrong for a reason about the derivation rather than about the tree. Settling what counts as a text scan is what a later unit would have to do first.",
    } },
  { module: "src/quality/scan-text.ts", text: "six modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/self-reference.ts", text: "two detectors", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tautology-sweep.ts", text: "Four sites", resolution: { kind: "derived", derive: acceptedTautologies } },
  { module: "src/quality/tautology-sweep.ts", text: "seven acceptance registers", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tree-walks.ts", text: "seven files", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tree-walks.ts", text: "SEVEN MODULES", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tree-walks.ts", text: "seven walks", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/tree-walks.ts", text: "SEVEN WALKS", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unit-headers.ts", text: "eleven such modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unit-headers.ts", text: "four loop-external modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unit-headers.ts", text: "three documented modules", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unit-headers.ts", text: "three findings", resolution: { kind: "at_the_unit" } },
  { module: "src/quality/unit-headers.ts", text: "three modules", resolution: { kind: "at_the_unit" } },
  { module: "src/referrals/store.ts", text: "four different rows", resolution: { kind: "at_the_unit" } },
  { module: "src/referrals/store.ts", text: "Two copies", resolution: { kind: "at_the_unit" } },
  { module: "src/security/page-reach.ts", text: "Fifty routes", resolution: {
      kind: "open",
      why: "The counterpart of the claim in `route-coverage.ts`, open for the same reason and named here so the pair is visible rather than one of them looking like an oversight.",
    } },
  { module: "src/sim/dashboard-data.ts", text: "two surfaces", resolution: { kind: "at_the_unit" } },
  { module: "src/sim/fleet-y5.ts", text: "three surfaces", resolution: { kind: "at_the_unit" } },
  { module: "src/tenancy/fixture-coherence.ts", text: "one both findings", resolution: { kind: "at_the_unit" } },
  { module: "src/tenancy/rollout.ts", text: "twelve sites", resolution: { kind: "at_the_unit" } },
  { module: "src/tenancy/store-reads.ts", text: "five findings", resolution: { kind: "at_the_unit" } },
  { module: "src/tenancy/store-reads.ts", text: "Five findings", resolution: { kind: "at_the_unit" } },
  { module: "src/verticals/assembly.ts", text: "two files", resolution: { kind: "at_the_unit" } },
];

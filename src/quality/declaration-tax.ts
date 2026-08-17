// W300: the declaration tax, measured — what one new module costs before anything watches it.
//
// Q24's premise, from `HORIZON-Q24.md`: *adding a single module to `src/` now requires declaring it
// in six other registers.* That sentence came from counting by hand while writing the quarter, and
// a quarter whose gate is a number cannot start from a number somebody remembered. So this measures
// it, and W308 re-derives the same measurement over whatever tree Q24 leaves behind.
//
// A DECLARATION SITE IS DERIVED, NOT LISTED — and it is derived twice, because the two derivations
// answer different questions and disagreeing is informative:
//
//   `demandingRegisters` PLANTS a module in a copy of the tree and runs every register whose walk
//   takes a root. A register that reports the plant is a place the build FAILS until somebody
//   declares it. That is the tax with teeth, and it is executed rather than counted.
//
//   `namingSites` reads the tree for files that name an existing module's path. That is the tax as
//   an author experiences it — the files that had to be opened — and it catches the sites a planted
//   module cannot reach, because their comparison lives inside a `.test.ts` that exports nothing.
//   W200's namespace loader is exactly one of those: it is a `const` in a test file, it fails on
//   arrival, and no plant from outside can make it say so.
//
// AND THE TAX IS NOT FLAT, which is the finding the hand-count could not have produced. A module
// with a header and nothing else is demanded by ONE plantable register — plus W200's namespace
// loader, which no plant can reach. A module that walks the tree, states a bound, exports a
// violation reporter and names a pin is demanded by six, and the quarter's hand-count of "six"
// turns out to have been the cost of a REGISTER rather than of a module. That is the shape of the
// finding: the modules that pay most are the registers themselves, which is why the number grew in
// the quarter that added twelve of them, and why one of the six is downstream of the census entry
// rather than of the module — declaring a walk in W267 creates a place it must be declared in W295.
//
// FOUNDER GATE (plan §4): nothing crossed. Synthetic module bodies planted into a temporary copy.

import { readFileSync } from "node:fs";
import path from "node:path";
import { sourceModules, testModules } from "./tree-walks";
import { fixtureText, prepareForScan } from "./scan-text";
import { copySurfaceMembers } from "@/compliance/copy-y6";
import { discoverFoldSites } from "./order-independence";
import { findInstructionSinks } from "@/security/instruction-sinks";
import { treeWalkingFiles } from "./register-census";
import { violationReporters } from "./refusal-branches";
import { acceptanceCarryingModules } from "./acceptances";
import { boundsInTree } from "./bounds";
import { pinsInTree } from "./pins";
import { headerViolations } from "./unit-headers";
import { manifestDiff } from "./manifest";

/** A planted module's shape, named by what it contains rather than by what it is for. */
export type ModuleShape =
  | "plain"
  | "walks_the_tree"
  | "states_a_bound"
  | "reports_violations"
  | "a_full_register";

/**
 * The body planted for each shape.
 *
 * Every one carries a valid `// W<n>` header, because a module without one is a different defect
 * and would make `unit-headers` fire for a reason this measurement is not about.
 */
export const SHAPE_BODIES: Readonly<Record<ModuleShape, string>> = {
  plain: "// W300: a planted plain module.\nexport const VALUE = 1;\n",
  walks_the_tree:
    '// W300: a planted module that walks the tree.\nimport { readdirSync } from "node:fs";\nexport const entries = () => readdirSync("src");\n',
  states_a_bound:
    "// W300: a planted module stating a bound.\nexport const PLANTED_BOUND =\n  \"a sentence about what this does not prove\";\n",
  // W307: the two bodies carrying a reporter signature come from the fixture file. Written here,
  // `violationReporters` reads THIS module as a reporter — it reads raw source on purpose.
  reports_violations: fixtureText("shape-reports-violations"),
  a_full_register: fixtureText("shape-a-full-register"),
};

/** A register whose walk takes a root, and whether it reports a module planted at `planted`. */
export interface Demand {
  /** The census entry this probe is for. */
  file: string;
  demands: (root: string, planted: string) => boolean;
}

const names = (found: readonly string[], planted: string) => found.some((f) => f.includes(planted));

/**
 * Every plantable register, probed.
 *
 * The population is DERIVED: `declaration-tax.test.ts` checks it against the census's
 * `mutated_tree` entries that live in a non-test module, in both directions. A `.test.ts` register
 * is excluded because its detector is not callable from outside — W289's finding, and the reason
 * `namingSites` exists beside this.
 */
export const DEMANDS: readonly Demand[] = [
  {
    file: "src/compliance/copy-y6.ts",
    demands: (root, planted) => names(copySurfaceMembers(root), planted),
  },
  {
    file: "src/compliance/surfaces.ts",
    // Routes come from `app/`; a module under `src/` is not a surface and this must stay silent.
    demands: () => false,
  },
  {
    file: "src/quality/order-independence.ts",
    demands: (root, planted) => names(discoverFoldSites(root).map((f) => f.module), planted),
  },
  {
    file: "src/security/instruction-sinks.ts",
    demands: (root, planted) => names(findInstructionSinks(root, ["src"]).map((h) => h.file), planted),
  },
  {
    file: "src/security/reachability.ts",
    // Reach starts at a page; a module nothing imports is not reachable and must not be reported.
    demands: () => false,
  },
  {
    file: "src/quality/route-coverage.ts",
    demands: () => false,
  },
  {
    file: "src/quality/bounds.ts",
    demands: (root, planted) => names(boundsInTree(root), planted),
  },
  {
    file: "src/quality/blind-spots.ts",
    // Downstream of the census: a module that walks earns a census entry, and every census entry
    // must state a bound. The plant does not reach it, the ENTRY does — which is the cascade.
    demands: (root, planted) => names(treeWalkingFiles(root, ["src"]), planted),
  },
  {
    file: "src/quality/acceptances.ts",
    demands: (root, planted) => names(acceptanceCarryingModules(root), planted),
  },
  {
    file: "src/quality/tautology-sweep.ts",
    // Sweeps `*.test.ts`; a planted module is not a test file.
    demands: () => false,
  },
  {
    file: "src/quality/refusal-branches.ts",
    demands: (root, planted) => names(violationReporters(root).map((r) => r.module), planted),
  },
  {
    file: "src/quality/register-census.ts",
    demands: (root, planted) => names(treeWalkingFiles(root, ["src"]), planted),
  },
  {
    file: "src/security/page-reach.ts",
    demands: () => false,
  },
  {
    file: "src/quality/latent-y5.ts",
    // Anchors findings, not modules.
    demands: () => false,
  },
  {
    file: "src/quality/pins.ts",
    demands: (root, planted) => names(pinsInTree(root).map((p) => p.module), planted),
  },
  {
    file: "src/quality/mutation-sampling.ts",
    demands: () => false,
  },
  {
    file: "src/quality/manifest.ts",
    // W305's row register. A planted module IS watched — it walks, or states a bound — and the
    // manifest has no row for it, so this is the seventh place a module must be declared. Which is
    // the honest accounting: the manifest did not remove a declaration site, it replaced three
    // with one and added itself.
    demands: (root, planted) => names(manifestDiff(root).unknown, planted),
  },
  {
    file: "src/quality/register-counts.ts",
    // A planted MODULE carries no assertions, so the size sweep asks nothing of it.
    demands: () => false,
  },
  {
    file: "src/quality/planting.ts",
    // W303's planter sweep reads test files; a planted MODULE is not one, so it costs nothing.
    demands: () => false,
  },
  {
    file: "src/quality/citations.ts",
    // W301's separator sweep asks nothing of a module that does not parse the citation format, so
    // a planted module costs it nothing — the same answer as the other content-conditional
    // registers here, and the reason the tax is measured per register rather than counted.
    demands: () => false,
  },
  {
    file: "src/quality/empty-list-sweep.ts",
    demands: () => false,
  },
  {
    file: "src/quality/page-suite.ts",
    demands: () => false,
  },
  {
    file: "src/quality/unit-headers.ts",
    demands: (root, planted) =>
      names(headerViolations(root, readFileSync(path.join(root, "BUILD-STATE.md"), "utf8")), planted),
  },
  {
    file: "src/quality/tree-walks.ts",
    // It holds the walks and no declared list of its own.
    demands: () => false,
  },
  {
    file: "src/quality/latent-findings.ts",
    demands: () => false,
  },
  {
    file: "src/quality/self-reference.ts",
    // Asks about modules that assemble a literal from fragments, which a planted module does not do.
    // It demands nothing of an arriving module, and is in the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/scan-text.ts",
    // Asks about modules that PREPARE text, which a planted module does not do. It demands nothing
    // of an arriving module and is in the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/declaration-tax.ts",
    // ITSELF, and it demands nothing: this register measures the tax rather than levying one, so a
    // planted module owes it no declaration. It is in the population because the census holds it
    // and the population is derived from the census — exempting the measurer from the measurement
    // would be the register answering its own question (W201).
    demands: () => false,
  },
];

/** The registers that report a module planted at `planted`, in file order. */
export function demandingRegisters(root: string, planted: string): string[] {
  return DEMANDS.filter((d) => d.demands(root, planted))
    .map((d) => d.file)
    .sort();
}

/**
 * Files under `src/` that name a module's path — the tax as an author experiences it.
 *
 * Comments subtracted, because a module discussed in prose is not a module declared: this tree's
 * notes cite each other's paths constantly, and counting those would inflate the number the whole
 * quarter is measured against.
 */
export function namingSites(root: string, module: string): string[] {
  const found: string[] = [];
  for (const file of [...sourceModules(root), ...testModules(root)]) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (rel === module) continue;
    // W302: the shared preparation. Literals are KEPT — a declaration IS a string literal, so
    // blanking them would make every site disappear and this measurement read as zero.
    const text = prepareForScan(readFileSync(file, "utf8"), { literals: "kept" });
    if (text.includes(module)) found.push(rel);
  }
  return found.sort();
}

/**
 * What each shape cost when this quarter opened.
 *
 * A FROZEN MEASUREMENT, which is the one kind of pinned number this tree allows: W308 re-derives
 * the live figure and reports the difference, so a baseline that moved would destroy the comparison
 * it exists for. Declared in W290's `PINS` as such rather than left to be read as a live count.
 */
export const TAX_AT_W300: Readonly<Record<ModuleShape, number>> = {
  plain: 1,
  walks_the_tree: 3,
  states_a_bound: 2,
  reports_violations: 2,
  a_full_register: 6,
};

/** A shape whose cost has moved since the baseline, and what moved it. */
export interface Movement {
  shape: ModuleShape;
  /** The live cost now. */
  now: number;
  /** The register that arrived or departed, and why it changed the figure. */
  why: string;
}

/**
 * Every shape costing something other than `TAX_AT_W300`, argued.
 *
 * THE BASELINE IS NOT BUMPED AND THAT IS THE WHOLE POINT of freezing it: W308 re-derives the live
 * figure and compares, so a baseline that moved with the tree would destroy the comparison it
 * exists for. What moves instead is this list, which is a NAMED set rather than a count — W290's
 * rule — so a shape whose cost changes for a reason nobody wrote down fails rather than being
 * absorbed into a number somebody edited.
 */
export const MOVED_SINCE_W300: readonly Movement[] = [
  // ONE CAUSE, FOUR SHAPES. `manifestDiff` reports any module that walks the tree, states a bound
  // or reports violations and has no row in W305's manifest — so every shape carrying one of those
  // properties costs exactly one more than it did, and `plain`, which carries none, is unmoved.
  // That the four moved together by the same amount is the evidence the cause is a single register
  // rather than four coincidences.
  {
    shape: "walks_the_tree",
    now: 4,
    why: "W305's manifest. A module that walks must have a row there, and `manifestDiff` reports it unknown until it does.",
  },
  {
    shape: "states_a_bound",
    now: 3,
    why: "W305's manifest. `STATED_BOUNDS` keeps its own list, so a module stating a bound is watched by `bounds.ts` — and the manifest must have heard of it too.",
  },
  {
    shape: "reports_violations",
    now: 3,
    why: "W305's manifest. A `*Diff` or `*Violations` export makes `refusal-branches.ts` watch the module, and `manifestDiff` requires a row for anything watched.",
  },
  {
    shape: "a_full_register",
    now: 7,
    why: "W305's manifest, and this is the figure the quarter's premise turns on. Six was the cost of a register at W300; the manifest replaced three declaration sites with one row and then added itself as a site, so a full register now costs seven. THE TAX WENT UP. What went down is the number of files and schemas an author has to find, which this measurement does not capture and should not be read as claiming — W308 re-derives both.",
  },
];

export interface TaxDiff {
  /** A shape costing something the baseline and the movement list together do not account for. */
  unaccounted: string[];
  /** A declared movement whose shape now costs exactly what the baseline said. */
  stale: string[];
}

/** The live measurement against the baseline plus the declared movement, both directions. */
/**
 * W308 takes its own pair rather than copying this function. A second `taxDiffW308` would have been
 * four lines and the quarter's own subject — one mechanism written twice — so the record and the
 * movement list are parameters and the defaults are W300's.
 *
 * THE COMMENT IS HERE RATHER THAN INSIDE THE PARAMETER LIST, and that is not a style choice: with
 * it between the parameters, W291's reporter walk stopped finding this function at all. It reads a
 * return type from the next 300 characters after the name, and three lines of prose push `): TaxDiff`
 * past that. Recorded as `REPORTER-1` in W210's register rather than fixed here — the fix reveals
 * this walk matching its own quoted fixture, which is a chain rather than a line.
 */
export function taxDiff(
  live: Readonly<Record<ModuleShape, number>>,
  against: Readonly<Record<ModuleShape, number>> = TAX_AT_W300,
  movement: readonly Movement[] = MOVED_SINCE_W300,
): TaxDiff {
  const moved = new Map(movement.map((m) => [m.shape, m.now]));
  const unaccounted: string[] = [];
  const stale: string[] = [];
  for (const [shape, baseline] of Object.entries(against) as [ModuleShape, number][]) {
    const expected = moved.get(shape) ?? baseline;
    if (live[shape] !== expected) unaccounted.push(`${shape}: costs ${live[shape]}, declared ${expected}`);
    if (moved.has(shape) && live[shape] === baseline) stale.push(shape);
  }
  return { unaccounted: unaccounted.sort(), stale: stale.sort() };
}

/** What this measurement does not prove. */
export const TAX_BOUND =
  "This counts the registers that REPORT a planted module and the files that NAME an existing one. Neither is the same as the work of declaring it: a census entry costs four sentences and a copy-surface entry costs one, and a count treats them alike. Nor does it reach the sites whose comparison lives inside a `.test.ts` — W200's namespace loader fails the build on arrival and no plant from outside can make it say so, which is why `namingSites` is measured beside the plant rather than instead of it. What the number is good for is comparison with itself: the same two derivations over the tree Q24 leaves behind, which is W308's whole job. A quarter that made declaring a module pleasanter without moving either derivation would not show up here, and should not be claimed.";

// ---------------------------------------------------------------------------------------------
// W308: the same measurement, re-run at the end of the quarter it was written to judge.
// ---------------------------------------------------------------------------------------------

/**
 * The live figure at W308, recorded beside W300's baseline.
 *
 * THE QUARTER'S OWN GATE, AND IT DID NOT PASS IT. `HORIZON-Q24.md` says: *W300 records what adding
 * one module costs today, and W308 re-derives the same measurement at the end. A quarter that made
 * the tree feel tidier without moving that number would have failed.* The number moved. It went UP,
 * by one, on four of the five shapes — every shape that carries a watched property, because W305's
 * manifest reports any module it has not heard of and `plain` carries nothing to be heard about.
 *
 * That is recorded here rather than argued away. What Q24 actually did to this number is add a
 * register to it; what it did for an author is measured separately below, because the two are
 * different facts and W305's note claiming the second must not be read as answering the first.
 *
 * FROZEN THE SAME WAY W300'S IS. A later unit that moves the cost adds a row to `MOVED_SINCE_W308`
 * naming what moved it — it does not edit this record, because a record somebody edits to match the
 * tree is not a record.
 */
export const TAX_AT_W308: Readonly<Record<ModuleShape, number>> = {
  plain: 1,
  walks_the_tree: 4,
  states_a_bound: 3,
  reports_violations: 3,
  a_full_register: 7,
};

/**
 * Shapes whose cost has moved since W308's record.
 *
 * EMPTY AT THE MOMENT IT WAS WRITTEN, and it exists anyway for the reason W305's does: W310 and
 * W311 were still to land when this was measured, and a record with no way to account for a later
 * movement gets edited instead of extended. A unit that adds a register adds a row here.
 */
export const MOVED_SINCE_W308: readonly Movement[] = [];

/** A module added in Q24, and the files somebody had to edit to declare it. */
export interface EditSites {
  module: string;
  shape: ModuleShape;
  /** The files that name it, which is where its declarations live. */
  files: number;
  why: string;
}

/**
 * The OTHER number, which W305 claimed and did not measure.
 *
 * Its note says the tax went up while *"the number of files and schemas an author has to find"*
 * went down, and hands the re-derivation here. Both halves are checkable and both are checked:
 * `manifest.ts` names a module declared this quarter, and `register-census.ts` and
 * `refusal-branches.ts` — the two files that used to hold those rows — no longer do. One file where
 * there were two, so a full register costs ONE FEWER FILE TO EDIT and one more register reporting.
 *
 * THE TWO NUMBERS MOVED IN OPPOSITE DIRECTIONS AND ONLY ONE OF THEM WAS THE GATE. Recording that
 * plainly is the point; a quarter that reported only the second would be answering a question
 * nobody asked it.
 *
 * AND THE RECORD PERTURBS ITS OWN SUBJECT, which is this tree's most familiar shape arriving in a
 * measurement rather than in a scan. Naming a module here makes this file one of the files that
 * name it, so one of the two rows below counts a file that exists because the row does. It is
 * recorded rather than corrected for — see that row.
 */
export const EDIT_SITES_AT_W308: readonly EditSites[] = [
  {
    module: "src/quality/self-reference.ts",
    shape: "a_full_register",
    files: 8,
    why: "W307's register, declared after the manifest landed. The copy surface and its namespace loader, W295's blind spots, W297's bounds, this measurement's own probe list, W292's negative probes, W302's scan sites, and the manifest — where before W305 the last of those was two files.",
  },
  {
    module: "src/demo/path.ts",
    shape: "states_a_bound",
    files: 5,
    why: "W309's path register: the copy surface, its loader, W297's bounds, the manifest — and THIS RECORD, which is the fifth. Naming a module in order to count the files that name it adds one, and the count moved from four to five the moment the row above was written. It is left in rather than narrowed away: an exclusion for the observer is a scan tuned until it agrees with the answer, which W279 refused and W295 proved costly. The full register beside it does not move, because `declaration-tax.ts` already named it in `DEMANDS` — so the perturbation is visible on one row and absent on the other, which is the clearest evidence of what it is.",
  },
];

/** Where a declaration for a module of this shape goes, as the tree spells it. */
const CONSOLIDATED_INTO = "src/quality/manifest.ts";
const CONSOLIDATED_FROM = ["src/quality/register-census.ts", "src/quality/refusal-branches.ts"];

/**
 * The consolidation W305 claimed, re-derived rather than believed.
 *
 * Returns what is wrong with the claim, empty when it holds. Both halves: the manifest must hold
 * the declaration, and the files it replaced must no longer hold one.
 */
export function consolidationDefects(root: string, module: string): string[] {
  const sites = namingSites(root, module);
  const out: string[] = [];
  if (!sites.includes(CONSOLIDATED_INTO)) {
    out.push(`${module} is not declared in ${CONSOLIDATED_INTO}`);
  }
  for (const from of CONSOLIDATED_FROM.filter((f) => sites.includes(f))) {
    out.push(`${module} is still declared in ${from}, so the consolidation did not happen`);
  }
  return out.sort();
}

/**
 * What Q24 did to the number it was measured by, said plainly.
 *
 * W308's gate: *a quarter that did not move it saying so rather than claiming otherwise.* It moved,
 * and it moved the wrong way, so the sentence says that first.
 */
export const QUARTER_VERDICT =
  "Q24 SET ITSELF A MEASURED GATE AND MISSED IT. `HORIZON-Q24.md` said the quarter would be judged " +
  "on what adding one module costs, and that a quarter which made the tree feel tidier without " +
  "moving that number would have failed. The number moved UP: a full register cost six declarations " +
  "at W300 and costs seven now, and every shape carrying a watched property moved by the same one, " +
  "because W305's manifest reports a module it has not heard of and is itself a register that " +
  "reports. The one shape that did not move is the one with nothing to be heard about. " +
  "WHAT THE QUARTER DID INSTEAD IS REAL AND IS A DIFFERENT NUMBER. An author declaring a full " +
  "register edits one file fewer than before, because the census row and the refusal branches now " +
  "share a row in one file — re-derived here rather than taken from the note that claimed it. " +
  "Twelve mechanisms were consolidated, four classes of duplicated discipline were removed, and " +
  "none of that is visible in the figure the quarter chose to be judged by. THE HONEST READING IS " +
  "THAT THE GATE WAS THE WRONG INSTRUMENT rather than that the work did not happen: counting the " +
  "registers that report an undeclared module counts controls, and consolidating controls without " +
  "removing any is supposed to leave that count where it was or raise it. Naming a better " +
  "instrument is a decision for the quarter close, not a repair to make here — a gate rewritten by " +
  "the unit it judges is not a gate.";

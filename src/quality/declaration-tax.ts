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
// WHAT THIS DOES NOT PROVE is `TAX_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Synthetic module bodies planted into a temporary copy.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sourceModules, testModules } from "./tree-walks";
import { fixtureText, prepareForScan } from "./scan-text";
import { withPlantedIn } from "./planting";
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
    file: "src/quality/self-defeating.ts",
    // Reads `*.test.ts` for equality assertions; a planted MODULE carries none, so it costs nothing.
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
    file: "src/quality/import-cycles.ts",
    // Its population is CYCLES, and a planted module with one import is not in one — outside by
    // construction. A module joining a knot owes a row, which is the register's point.
    demands: () => false,
  },
  {
    file: "src/quality/moments.ts",
    // Its population is the CENSUS, and a planted module joins that only by being declared in the
    // manifest — which is a cost of the census rather than of a module arriving.
    demands: () => false,
  },
  {
    file: "src/quality/run-residue.ts",
    // Its population is `rmSync` sites, and the probe plants a module that removes nothing —
    // outside by construction. A module that removes something does owe a row, which is the
    // register's point rather than a cost of a module arriving.
    demands: () => false,
  },
  {
    file: "src/quality/patient-populations.ts",
    // Its population is functions taking a collection of PATIENTS, and the probe plants a plain
    // module — outside by construction. A product rule arriving does owe a row, which is the
    // register's point rather than a cost of a module arriving.
    demands: () => false,
  },
  {
    file: "src/quality/reached-pages.ts",
    // Its population is console ROUTES, and the probe plants a module under `src/` — outside by
    // construction. A route arriving does owe a row, which is the register's point rather than a
    // cost of a module arriving.
    demands: () => false,
  },
  {
    file: "src/quality/empty-populations.ts",
    // Its population is registers that ship EMPTY, and the probe plants a plain module with no
    // register at all — outside by construction. A module arriving with an empty register does owe
    // a row, which is the register's whole point, but that is a cost of the register rather than a
    // cost of arriving.
    demands: () => false,
  },
  {
    file: "src/quality/horizon-directions.ts",
    // It reads a planning document, so a module planted under `src/` is outside its population by
    // construction — the token would have to be quoted in the horizon first, which a plant cannot do.
    demands: () => false,
  },
  {
    file: "src/quality/defaulted-registers.ts",
    // A planted module with no defaulted parameter is outside its population by construction, and
    // one WITH a defaulted register would be reported — but the probe plants a plain module, so the
    // honest cost of arriving is nothing.
    demands: () => false,
  },
  {
    file: "src/console/zero-meaning.ts",
    // It watches `app/console/**/page.tsx`, so a module planted under `src/` is outside its
    // population by construction. Zero is the honest cost: a new register owes this one nothing.
    demands: () => false,
  },
  {
    file: "src/quality/spec-stores.ts",
    // It watches `e2e/` against `app/`, so a module planted under `src/` is outside its population
    // by construction. Zero is the honest cost: a new register owes this one nothing.
    demands: () => false,
  },
  {
    file: "src/quality/spec-premises.ts",
    // It watches `e2e/`, so a module planted under `src/` is outside its population by
    // construction rather than by an omission. Zero is the honest cost: a new register does not
    // owe this one a row, and pretending otherwise would inflate the tax measurement.
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
    file: "src/quality/assertion-vocabulary.ts",
    // Asks how a test spells *this list is non-empty*. A planted MODULE is not a test file and
    // makes no assertion, so it owes this register nothing — an arriving module pays the census,
    // the blind spot, the negative probe and the drive, and pays nothing here. In the population
    // because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/quarter-mutants.ts",
    // Asks which mutants a quarter's own suites miss. A planted module names no unit in any
    // quarter's range and has no sibling suite, so it is outside this population entirely — an
    // arriving module pays the census, the blind spot, the negative probe and the drive, and pays
    // nothing here. In the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/instant.ts",
    // Asks whether a declared control's answer moves with state outside the tree. A planted module
    // is not a declared control, so it owes this register nothing — an arriving module pays the
    // census, the blind spot, the negative probe and the drive, and pays nothing here. In the
    // population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/close-gate.ts",
    // Asks which modules read the ledger. A planted module names no ledger primitive and opens no
    // ledger, so it owes this register nothing — an arriving module pays the census, the blind
    // spot, the negative probe and the drive, and pays nothing here. In the population because the
    // census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/deferrals.ts",
    // Asks which hardening passes the clock collects. A planted register shape is not a hardening
    // pass and records no findings, so it owes this register nothing. In the population because the
    // census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/typed-names.ts",
    // Asks whether a register's declared names resolve. A planted register shape declares no unit,
    // module or export name, so it owes this register nothing — an arriving module pays the census,
    // the blind spot, the negative probe and the drive, and pays nothing here. In the population
    // because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/private-copies.ts",
    // Asks which modules hold their own copy of a parse this tree shares. A planted register shape
    // holds neither a directory recursion nor a ledger row regex, so it owes this register nothing
    // — an arriving module pays the census, the blind spot, the negative probe and the drive, and
    // pays nothing here. In the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/prose-numbers.ts",
    // Demands a classification of any module whose header states a numeric claim. A planted module
    // carries no such claim in any of the five shapes, so it owes this register nothing — and the
    // register is in the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/unasked-facts.ts",
    // Asks which derivations on the SERVED surface nothing imports. A planted module is reached by
    // no route, so it falls outside the population entirely and the register has no question for it
    // — the bound below says so in its own words. It demands nothing on arrival and is in the
    // population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/unrun.ts",
    // Asks which modules no test file can reach. A planted module arrives with no test importing
    // it, so it WOULD be reported — but the demand is on the arriving module's author only when
    // the register holds a declaration for it, and a plant is not declared. It demands nothing on
    // arrival and is in the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/self-ending.ts",
    // Asks whether a module CONSTRUCTS a declaration keyed to a future event. A planted module
    // spells no wait, so it owes this register nothing on arrival — and a module that does spell
    // one is not an ordinary arrival but a register of waits, which is the point. In the population
    // because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/derivable-lists.ts",
    // Asks whether each hand-listed register's membership could be derived. A planted module
    // exports no register whose entries name a module path, so it owes this one nothing on arrival
    // — and a module that did would be reported as a hand-listed register no row classifies rather
    // than demanded of. In the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/exemption-reach.ts",
    // Asks how far each exemption this tree APPLIES reaches past its own key. A planted module
    // declares no detector taking a defaulted exemption parameter, so it owes this register
    // nothing on arrival — and a module that did would be reported as an exemption no row measures
    // rather than demanded of. In the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/flattering-numbers.ts",
    // Asks which way an error moves each figure the tree DERIVES, measured by calling it. A planted
    // module exports no counting function reachable from the app, so it owes this register nothing
    // on arrival — and a module that did would be reported as a figure no row classifies rather
    // than demanded of. In the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/shared-excuses.ts",
    // Asks which sentences MORE THAN ONE entry already gives. A planted module has no entries and
    // shares no sentence with anything, so it owes this register nothing on arrival — and a module
    // that did borrow one would be reported as a sentence no row reads rather than demanded of.
    // In the population because the census holds it.
    demands: () => false,
  },
  {
    file: "src/quality/superset.ts",
    // Asks what each DECLARED selector does when handed an input it cannot understand. A planted
    // module adds no row to that table, so it owes this register nothing on arrival — an arriving
    // module can move the SIZE a selector returns and cannot make one widen. In the population
    // because the census holds it.
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

/** Where an author goes to satisfy one register's demand. Several registers share a file. */
export interface DeclarationHome {
  /** The register that reports an undeclared module — a `DEMANDS` file. */
  register: string;
  /** The files somebody edits to satisfy it. */
  files: readonly string[];
  why: string;
}

/**
 * W313: THE OTHER INSTRUMENT, and the one W308's note asked the quarter close to name.
 *
 * W300 counts the REGISTERS that report a module undeclared. That is the tax with teeth and it is
 * the wrong unit for the question Q24 was actually asking, which W308 discovered by missing its own
 * gate: consolidating two registers' declarations into one file leaves both registers reporting, so
 * the count stays where it was or rises, while the work of declaring genuinely falls. Counting
 * registers counts CONTROLS. An author does not edit a control; an author edits a FILE.
 *
 * So this maps each register to the file somebody opens to satisfy it, and the two instruments are
 * run over the same planted shapes. Where they disagree is exactly where registers share a home —
 * which is what W305's manifest did and what W300's instrument cannot see by construction.
 *
 * DECLARED RATHER THAN DERIVED, and the reason is the same one W263 gives for its release paths: a
 * purely derived mapping would absorb a new register silently. `homeDiff` checks it against
 * `DEMANDS` in both directions, so a register arriving without a home fails and a home naming a
 * register the census does not have fails.
 */
export const DECLARATION_HOMES: readonly DeclarationHome[] = [
  {
    register: "src/compliance/copy-y6.ts",
    files: ["src/compliance/cdss-boundary.ts", "src/compliance/cdss-boundary.test.ts"],
    why: "W200's copy surface and the namespace loader beside it. TWO files for one register, which is the disagreement pointing the other way: a register can cost more than one edit as easily as several can cost one, and an instrument that assumed a register was a file would be wrong in both directions.",
  },
  {
    register: "src/quality/register-census.ts",
    files: ["src/quality/manifest.ts"],
    why: "W267's census entry, which W305 moved into the manifest. Before that it was `register-census.ts` itself.",
  },
  {
    register: "src/quality/refusal-branches.ts",
    files: ["src/quality/manifest.ts"],
    why: "W291's branches, moved into the manifest by W305 — the SAME file as the census entry above, which is the whole of what the consolidation bought and the whole of what W300's instrument could not report.",
  },
  {
    register: "src/quality/manifest.ts",
    files: ["src/quality/manifest.ts"],
    why: "W305's own row, in the file it declares. A module needs a row here whatever else it needs, so this is the one home that is never shared with a different file.",
  },
  {
    register: "src/quality/blind-spots.ts",
    files: ["src/quality/blind-spots.ts"],
    why: "W295's witness and probe, deliberately NOT moved into the manifest — W305 folded them in, the fold moved a walk out of this module, and four rows of its coverage fell over behind it.",
  },
  {
    register: "src/quality/bounds.ts",
    files: ["src/quality/bounds.ts"],
    why: "W297's stated bound. Kept out of the manifest because a module states several bounds, each with its own unit and lifting, so it is not a per-module fact.",
  },
  {
    register: "src/quality/pins.ts",
    files: ["src/quality/pins.ts"],
    why: "W290's classification, kept out of the manifest for the same reason as the bounds: a module pins several constants and each needs its own argument.",
  },
  {
    register: "src/quality/order-independence.ts",
    files: ["src/quality/order-independence.ts"],
    why: "W167's fold site with its tie-break argument.",
  },
  {
    register: "src/security/instruction-sinks.ts",
    files: ["src/security/instruction-sinks.ts"],
    why: "W153's sink declaration.",
  },
  {
    register: "src/quality/acceptances.ts",
    files: ["src/quality/acceptances.ts"],
    why: "W294's acceptance register, with the review date the clock reads.",
  },
  {
    register: "src/quality/unit-headers.ts",
    files: [],
    why: "NO FILE AT ALL, and it is the instrument's most useful row. W281's header check is satisfied by writing the module's own header correctly — there is no register to add a line to. A register that costs no declaration is invisible to an instrument counting files and reported by one counting registers, which is the disagreement in its purest form and the reason both are kept.",
  },
];

/** The distinct files an author edits to declare a module planted at `planted`. */
export function editSites(root: string, planted: string): string[] {
  const home = new Map(DECLARATION_HOMES.map((h) => [h.register, h.files]));
  const files = new Set<string>();
  for (const register of demandingRegisters(root, planted)) {
    for (const file of home.get(register) ?? []) files.add(file);
  }
  return [...files].sort();
}

export interface HomeDiff {
  /** A register that can report an undeclared module and has no home declared. */
  unhomed: string[];
  /** A home for a register the probe population does not hold. */
  stale: string[];
  /** A home naming a file that is not in the tree. */
  missing: string[];
}

/** The home register against the probe population, in every direction it can be wrong. */
export function homeDiff(
  root: string,
  homes: readonly DeclarationHome[] = DECLARATION_HOMES,
  probes: readonly Demand[] = DEMANDS,
): HomeDiff {
  const declared = new Set(homes.map((h) => h.register));
  const population = new Set(probes.map((p) => p.file));
  // A register that never reports anything needs no home: it levies no declaration.
  const levying = probes.filter((p) => SHAPES.some((shape) => reportsShape(root, p, shape))).map((p) => p.file);
  return {
    unhomed: levying.filter((r) => !declared.has(r)).sort(),
    stale: [...declared].filter((r) => !population.has(r)).sort(),
    missing: homes
      .flatMap((h) => h.files)
      .filter((f) => !existsSync(path.join(root, f)))
      .sort(),
  };
}

/** Every shape, so both instruments can be run over the same population. */
export const SHAPES = Object.keys(SHAPE_BODIES) as ModuleShape[];

/** Whether one probe reports a module of this shape, planted into a copy of `root`. */
function reportsShape(root: string, probe: Demand, shape: ModuleShape): boolean {
  const planted = "src/planted/w313-probe.ts";
  return withPlantedIn(root, { [planted]: SHAPE_BODIES[shape] }, () => probe.demands(root, "w313-probe"));
}

/**
 * What an author edits, per shape, measured at W313.
 *
 * FROZEN THE SAME WAY W300'S AND W308'S ARE, and read beside them rather than instead of them. A
 * later unit that moves it adds a row to `MOVED_SINCE_W313`.
 */
export const AUTHOR_TAX_AT_W313: Readonly<Record<ModuleShape, number>> = {
  plain: 2,
  walks_the_tree: 4,
  states_a_bound: 4,
  reports_violations: 3,
  a_full_register: 6,
};

/**
 * Shapes whose author-cost has moved since W313's record.
 *
 * EMPTY, AND EMPTY THE WAY `MOVED_SINCE_W308` IS: the mechanism exists ahead of the movement it
 * records, because a record with no way to account for a later movement gets edited instead of
 * extended. W369 found this one saying nothing about its own emptiness while its sibling above
 * argued the case properly — which is exactly how an empty register stops being distinguishable
 * from a dead one.
 */
export const MOVED_SINCE_W313: readonly Movement[] = [];

/**
 * Why the two instruments give the number they give, per shape.
 *
 * THE NUMBERS ARE NOT REPEATED HERE. `TAX_AT_W308` holds what the register instrument reports and
 * `AUTHOR_TAX_AT_W313` holds what the file instrument reports; a third copy of either would be the
 * pinned-count class W304 removed and W308 re-introduced. What this holds is the ARGUMENT, which
 * cannot be derived from anything.
 */
export const INSTRUMENT_NOTES: Readonly<Record<ModuleShape, string>> = {
  plain: "EDITING COSTS MORE THAN REPORTING, which is the direction nobody expected. A module with a header and nothing else is reported by one register — W200's copy surface — and satisfying it takes TWO files, the surface and the namespace loader beside it. So the cheapest possible module already costs more work than the register count says, and every reading of W300's figure has understated the floor.",
  walks_the_tree: "The instruments agree by coincidence rather than by construction: the copy surface costs two files for one report and the census shares the manifest with the manifest's own row, so a gap of plus-one and a gap of minus-one cancel. A shape where two numbers agree for different reasons is the strongest argument for keeping both.",
  states_a_bound: "Editing costs more again — the bound lives in its own register and the copy surface still costs two files. W297 keeps `STATED_BOUNDS` out of the manifest deliberately, because a module states several bounds each with its own unit and lifting, so this gap is a decision rather than an omission.",
  reports_violations: "The instruments agree, and here it IS by construction: the branches live in the manifest with the module's own row, so the only excess is the copy surface's second file, and the only saving is that same manifest sharing.",
  a_full_register: "THE SHAPE THE QUARTER WAS ABOUT, and the one where the consolidation finally shows. Three registers — the census, the branches and the manifest's own row — share one file, so three reports cost one edit. Before W305 the same module cost the same seven reports and EIGHT edits. W300's instrument could not see the difference, which is exactly why W308 reported a quarter of consolidation as a failure.",
};

export interface Disagreement {
  shape: ModuleShape;
  /** W300's instrument: registers that report the module undeclared. */
  reporting: number;
  /** W313's: distinct files somebody opens. */
  editing: number;
  why: string;
}

/**
 * Both instruments over the same planted shapes, live.
 *
 * The whole of W313's gate: run them over one population and let the disagreement be visible
 * instead of arguing about which is right. A caller comparing these against the two frozen records
 * is comparing measurements, not re-deriving a number stored twice.
 */
export function bothInstruments(root: string): Disagreement[] {
  return SHAPES.map((shape) => {
    const planted = "src/planted/w313-shape.ts";
    return withPlantedIn(root, { [planted]: SHAPE_BODIES[shape] }, () => ({
      shape,
      reporting: demandingRegisters(root, "w313-shape").length,
      editing: editSites(root, "w313-shape").length,
      why: INSTRUMENT_NOTES[shape],
    }));
  });
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

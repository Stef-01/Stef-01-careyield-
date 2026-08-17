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
import { prepareForScan } from "./scan-text";
import { copySurfaceMembers } from "@/compliance/copy-y6";
import { discoverFoldSites } from "./order-independence";
import { findInstructionSinks } from "@/security/instruction-sinks";
import { treeWalkingFiles } from "./register-census";
import { violationReporters } from "./refusal-branches";
import { acceptanceCarryingModules } from "./acceptances";
import { boundsInTree } from "./bounds";
import { pinsInTree } from "./pins";
import { headerViolations } from "./unit-headers";

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
  walks_the_tree: [
    "// W300: a planted module that walks the tree.\n",
    'import { readdirSync } from "node:fs";\n',
    'export const entries = () => readdirSync("src");\n',
  ].join(""),
  states_a_bound:
    "// W300: a planted module stating a bound.\nexport const PLANTED_BOUND =\n  \"a sentence about what this does not prove\";\n",
  reports_violations: [
    "// W300: a planted module reporting violations.\n",
    "export function planted",
    "Violations(\n  input: readonly string[],\n): string[] {\n  return [...input];\n}\n",
  ].join(""),
  a_full_register: [
    "// W300: a planted module shaped like one of this tree's registers.\n",
    'import { readdirSync } from "node:fs";\n',
    "export const PLANTED_AT_W300 = 3;\n",
    "export const PLANTED_BOUND =\n  \"a sentence about what this does not prove\";\n",
    "export function planted",
    "Diff(\n  root: string,\n): string[] {\n  return readdirSync(root);\n}\n",
  ].join(""),
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

/** What this measurement does not prove. */
export const TAX_BOUND =
  "This counts the registers that REPORT a planted module and the files that NAME an existing one. Neither is the same as the work of declaring it: a census entry costs four sentences and a copy-surface entry costs one, and a count treats them alike. Nor does it reach the sites whose comparison lives inside a `.test.ts` — W200's namespace loader fails the build on arrival and no plant from outside can make it say so, which is why `namingSites` is measured beside the plant rather than instead of it. What the number is good for is comparison with itself: the same two derivations over the tree Q24 leaves behind, which is W308's whole job. A quarter that made declaring a module pleasanter without moving either derivation would not show up here, and should not be claimed.";

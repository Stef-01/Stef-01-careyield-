// W303: one planting harness, and a probe that cannot outlive its test.
//
// SEVENTEEN FILES IN THIS TREE PLANT A FILE IN FRONT OF A DETECTOR. It is how every register built
// since W267 proves it notices anything, and it grew four independent harnesses: `withRoot` builds
// a bare root holding only what a detector reads, two files declare their own `withPlanted`, and
// seven copy `src/` into a temporary directory in `beforeAll`.
//
// TWO OF THE FOUR CANNOT LEAVE A PROBE BEHIND AND TWO CAN, which is the finding rather than the
// duplication. `withRoot` and `withPlanted` take the probe as a CALLBACK and remove the file in a
// `finally`, so there is no path where the plant outlives it. The `plant()` helpers in
// `pins.test.ts` and `unit-headers.test.ts` return after writing, and their callers remove the file
// on the line after the assertions:
//
//     plant("src/quality/w281-probe-none.ts", "export const NOTHING = 1;\n");
//     expect(headerCensus(COPY, LEDGER).missing).toContain("src/quality/w281-probe-none.ts");
//     rmSync(path.join(COPY, "src/quality/w281-probe-none.ts"));   // ← not reached on failure
//
// A FAILING ASSERTION SKIPS THE CLEANUP, and the probe then sits in the copied tree for every later
// test in that file. Ten call sites are written this way. The consequence is not a leaked file —
// the copy is a temp directory and goes at `afterAll` — it is that ONE failure becomes a cascade of
// failures in tests that have nothing wrong with them, which is the worst possible moment to make a
// suite harder to read. This tree has spent a quarter on checks that do not notice; a check that
// misreports its neighbours when it fires is the same defect wearing the other face.
//
// SO THE FIX IS THE SHAPE, NOT THE DILIGENCE. The gate asks for a probe left behind to be "made
// impossible rather than cleaned up", and the way to make it impossible is to export no way to
// plant without a scope: every function here takes the probe and removes what it wrote in a
// `finally`. There is no `plant()` to call and forget.
//
// TWO SHAPES, BOTH KEPT, because they answer different questions. `withTree` builds a root holding
// ONLY the files given — right when a detector's answer should depend on nothing else, and the
// reason W291 could drive arms the real tree cannot produce. `withPlantedIn` adds files to a tree
// that already exists — right when the question is what a detector says about a REAL tree with one
// thing added, which is W267's whole subject. Collapsing them would lose that distinction.
//
// FOUNDER GATE (plan §4): nothing crossed. Everything written goes into a temporary directory that
// is removed before the call returns.

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { typescriptFiles } from "./tree-walks";

/** Files to plant, keyed by path relative to the tree they are planted in. */
export type Plantable = Readonly<Record<string, string>>;

function write(root: string, files: Plantable): string[] {
  const written: string[] = [];
  for (const [rel, contents] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents, "utf8");
    written.push(full);
  }
  return written;
}

/**
 * A throwaway root holding ONLY the files given, removed when the probe returns.
 *
 * W291's harness, unchanged in behaviour and moved here. Right when a detector's answer should
 * depend on nothing but what it was handed — a register driven against the real tree proves nothing
 * about the arms a healthy tree cannot produce.
 */
export function withTree<T>(files: Plantable, probe: (root: string) => T): T {
  const root = mkdtempSync(path.join(tmpdir(), "plant-"));
  try {
    write(root, files);
    return probe(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * Plant into a tree that already exists, and remove exactly what was planted.
 *
 * THE `finally` IS THE POINT. Ten call sites used to plant, assert, and remove on the next line, so
 * a failing assertion left the probe behind and every later test in the file ran against a tree
 * with a probe in it. There is no unscoped version of this function to reach for.
 */
export function withPlantedIn<T>(root: string, files: Plantable, probe: () => T): T {
  const written = write(root, files);
  try {
    return probe();
  } finally {
    for (const full of written) rmSync(full, { force: true });
  }
}

/** The directories a copied tree needs for the tree-reading registers to behave as they do here. */
export const COPIED_DIRECTORIES = ["src", "app", "e2e", "supabase", "docs", "scripts"] as const;

/** The root files a copied tree needs. `BUILD-STATE.md` because four registers read the ledger. */
export const COPIED_FILES = ["vitest.config.ts", "package.json", "tsconfig.json", "BUILD-STATE.md"] as const;

export interface CopyOptions {
  /** Subset of `COPIED_DIRECTORIES`, for a suite that only reads `src/`. */
  directories?: readonly string[];
  /** Symlink `node_modules`, which only a harness that RUNS the copy needs. */
  withNodeModules?: boolean;
}

/**
 * Copy the tree into a temporary directory. The caller removes it; `afterAll` is the usual place.
 *
 * Returned rather than scoped, because a copy costs a second and the suites that use one share it
 * across every test in the file. That is the one place a scope would be wrong, and it is why this
 * is the only function here that hands back a path — what it hands back is a temp directory, so the
 * thing the gate calls impossible is planting into the REPOSITORY, not holding a copy.
 */
export function copyTree(root: string, options: CopyOptions = {}): string {
  const copy = mkdtempSync(path.join(tmpdir(), "tree-"));
  for (const dir of options.directories ?? COPIED_DIRECTORIES) {
    try {
      cpSync(path.join(root, dir), path.join(copy, dir), { recursive: true });
    } catch {
      // A tree without `scripts/` is still a tree; a missing directory is not a failure to copy.
    }
  }
  for (const file of COPIED_FILES) {
    try {
      cpSync(path.join(root, file), path.join(copy, file));
    } catch {
      // Same.
    }
  }
  if (options.withNodeModules) symlinkSync(path.join(root, "node_modules"), path.join(copy, "node_modules"));
  return copy;
}

/**
 * Test files that write into a tree without going through a scoped planter.
 *
 * WHY A SWEEP AND NOT JUST A SHARED FUNCTION: W301's lesson, one unit old. Deleting four
 * implementations does not stop a fifth arriving, and nothing about a shared helper makes the next
 * author find it. A `writeFileSync` in a test file that does not come from this module is a plant
 * whose lifetime nobody has thought about.
 *
 * `mutation-sampling.test.ts` is the declared exception and the reason this returns a list rather
 * than a boolean: it writes a mutated module and restores the original, which is a substitution
 * rather than a plant, and it cannot use `withPlantedIn` because the file it writes already exists.
 */
export const WRITES_WITHOUT_A_PLANTER: Readonly<Record<string, string>> = {
  "src/quality/mutation-sampling.test.ts":
    "Substitutes a mutated module for a real one and writes the original back, rather than adding a file and removing it. `withPlantedIn` deletes what it wrote, which for an existing file would delete the file — so this one restores instead, in its own `finally`, per module rather than per mutant.",
  "src/quality/blocked-surface.test.ts":
    "Writes a fabricated `BUILD-STATE.md` into a temporary root it makes itself, and rewrites it between assertions to grow and shrink the blocked surface. Nothing is planted into a copied tree; the root exists only for the ledger text.",
  "src/pilot/casestudy.test.ts":
    "Rewrites a golden report under `UPDATE_GOLDEN`, into `reports/` — a gitignored directory of artefacts a developer regenerates on purpose. Not a plant: nothing is put in front of a detector, and the write does not happen on an ordinary run at all.",
  "src/report/weekly.test.ts":
    "The same golden rewrite behind the same environment variable, for the weekly report. Untracked output, regenerated deliberately.",
  "src/sim/fleet.test.ts":
    "Writes `reports/load-w48.md`, the load-simulation report W48 exists to produce. It goes into the repository's gitignored `reports/` directory rather than a temporary one BECAUSE a developer is meant to read it after the run; the artefact is the point.",
  "src/sim/harness.test.ts":
    "Writes `reports/sim-26w.md` for the same reason — the twenty-six-week simulation's output, kept for a reader rather than asserted and discarded.",
  "src/registers/multi-sim.test.ts":
    "Writes `reports/registers-w75.md`, the multi-register simulation's output. Same shape and same reason as the two above.",
  "src/collateral/collateral.test.ts":
    "Writes the built deck and one-pager into a temporary output directory to prove they open — an artefact the test produces, not a probe planted in front of a detector.",
  "src/capability/routing-sim.test.ts":
    "Writes a simulation report into a temporary directory, for the same reason: an output being checked, not a file planted for a scan to notice.",
  "src/interest/store.test.ts":
    "Writes the append-only signup file the store under test reads, into a temporary directory. The file IS the subject rather than a probe.",
  "src/compliance/composed-copy.test.ts":
    "Copies the tree and edits a copy-carrying module in place to prove the composed-copy linter reads the edit, restoring it afterwards — a substitution, like the mutation sampler's.",
};

export interface PlanterDiff {
  /** A test file that writes files and neither imports a planter nor is declared. */
  undeclared: string[];
  /** A declared file that no longer writes anything. */
  stale: string[];
}

/**
 * Both directions, W102's shape, so a fifth harness cannot arrive quietly.
 *
 * Takes the register as an argument — W291's rule, and the reason both arms can be shown firing.
 */
export function planterDiff(
  root: string,
  declared: Readonly<Record<string, string>> = WRITES_WITHOUT_A_PLANTER,
): PlanterDiff {
  const writers: string[] = [];
  for (const file of typescriptFiles(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (!rel.endsWith(".test.ts")) continue;
    const text = readFileSync(file, "utf8");
    if (!/\bwriteFileSync\s*\(/.test(text)) continue;
    if (text.includes('from "./planting"') || text.includes('from "@/quality/planting"')) continue;
    writers.push(rel);
  }
  return {
    undeclared: writers.filter((f) => !(f in declared)).sort(),
    stale: Object.keys(declared).filter((f) => !writers.includes(f)).sort(),
  };
}

/** What a green `planterDiff` does not prove. */
export const PLANTING_BOUND =
  "The sweep reads `writeFileSync` in a `*.test.ts`. A plant written with `fs/promises`, an " +
  "`appendFileSync`, a shell-out or a helper in a non-test module is invisible to it — the class " +
  "of bound W267 states about `readdirSync`, and the same remedy applies when such a plant arrives. " +
  "It also says nothing about the copies themselves: a suite that forgets its `afterAll` leaks a " +
  "temporary directory, which no register here reads, and the operating system rather than this " +
  "tree is what eventually collects it.";

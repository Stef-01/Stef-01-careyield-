// W303: one planting harness, and a probe that cannot outlive its test.
//
// FILES ALL OVER THIS TREE PLANT A FILE IN FRONT OF A DETECTOR. It is how every register built
// since W267 proves it notices anything, and it grew a separate harness almost every time:
// `withRoot` builds a bare root holding only what a detector reads, `register-census.test.ts` and
// `negative-probes.test.ts` each declare a `withPlanted`, W300's `withShape` plants one module
// shape at a time, and `pins.test.ts` and `unit-headers.test.ts` each have a bare `plant()`.
//
// MOST OF THEM CANNOT LEAVE A PROBE BEHIND, AND TWO CAN, which is the finding rather than the
// duplication. `withRoot`, both `withPlanted`s and `withShape` take the probe as a CALLBACK and
// remove the file in a `finally`, so there is no path where the plant outlives it. The `plant()`
// helpers return after writing, and their callers remove the file on the line after the assertions:
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
// NO COUNTS APPEAR ABOVE, and that is W293's rule applied after breaking it. The first draft of
// this header said "four independent harnesses" and "two of the four", written before `withShape`
// was found — so it contradicted its own commit message on the day it shipped. It is the third
// header this session to state a number the code disagreed with, and W298's `headerNamesUnknown`
// does not catch it because a count is not an identifier. Naming the harnesses instead of counting
// them costs a line and cannot go stale by arithmetic.
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
// WHAT THIS DOES NOT PROVE is `PLANTING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Everything written goes into a temporary directory that
// is removed before the call returns.

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { typescriptFiles } from "./tree-walks";

/** Files to plant, keyed by path relative to the tree they are planted in. */
export type Plantable = Readonly<Record<string, string>>;

function write(root: string, files: Plantable): string[] {
  const written: string[] = [];
  const base = path.resolve(root);
  for (const [rel, contents] of Object.entries(files)) {
    const full = path.resolve(base, rel);
    // W370: THE GUARD CHECKED THE ROOT AND NOT THE KEYS. `refuseTheRepository` exists so a probe
    // cannot be written into the tree other test workers are reading, and it inspects the root it
    // is handed — while `path.join(root, rel)` with a `..` in the key walks straight back out of
    // that root and past the check. Nothing in this tree passes such a key today; the point is that
    // the one thing this harness refuses was one relative path away, and a guard that can be
    // stepped around is the direction Q28 is about.
    //
    // `resolve` RATHER THAN `join`, AND THAT IS THE SECOND WAY OUT. `join` treats an ABSOLUTE key
    // as a suffix — `path.join("/a/b", "/etc/x")` is `/a/b/etc/x` — so an absolute key would land
    // inside the root and pass a check written for `..`. `resolve` discards the base for it, which
    // is what puts it outside and gets it refused. Both are driven.
    if (!full.startsWith(base + path.sep)) {
      throw new Error(
        `plant refuses the key ${rel}: it resolves outside the tree it is planted in ` +
          `(${full}). A probe that escapes its root is written where nothing will remove it.`,
      );
    }
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
 * Refuse to plant into the repository itself.
 *
 * THE RESIDUE WAS NEVER THE BUG. `withPlantedIn` removes the files it wrote, so a plant into the
 * real tree looked harmless and left only an empty `src/planted/` behind. What it actually did was
 * write into a tree OTHER TEST WORKERS ARE WALKING: a register in another file listed the probe
 * module and then read it a moment after the `finally` removed it, and failed with `ENOENT` on a
 * path nothing in its own suite had ever heard of. It read as a flake for two firings — the failing
 * file was different each time, because the file that loses the race is whichever one is walking.
 *
 * A copy costs a second and cannot be raced. Every site that planted into `process.cwd()` was a
 * manifest branch-driver reaching for the nearest tree; there is now no nearest tree to reach for.
 */
function refuseTheRepository(root: string): void {
  const repository = process.cwd();
  const resolved = path.resolve(root);
  if (resolved === repository || resolved.startsWith(repository + path.sep)) {
    throw new Error(
      `withPlantedIn refuses to plant into the repository (${path.relative(repository, resolved) || "."}): ` +
        "other test workers walk this tree and will read a probe that is about to be deleted. " +
        "Plant into `copyTree(root)` instead.",
    );
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
  refuseTheRepository(root);
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
export const COPIED_FILES = [
  "vitest.config.ts",
  // W328: the config NAMES this file, so a copy without it cannot start vitest at all. The
  // mutation sampler runs the suite inside a copy, and leaving this out made every mutant die of a
  // missing hook rather than of the suite catching it — eight declared survivors read as caught in
  // one run, which is what a harness looks like when it has stopped measuring its subject.
  "vitest.global-setup.ts",
  "package.json",
  "tsconfig.json",
  "BUILD-STATE.md",
] as const;

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
/**
 * Copies made this process, removed when it exits.
 *
 * W331's finding, and the number is why it is a sweep rather than a note. `copyTree`'s contract
 * says the caller removes it and `afterAll` is the usual place — and four callers did not, one of
 * them copying the whole tree PER CALL. The build box was holding 426 copies and 3.6 GB of `/tmp`.
 * A contract that four of its callers get wrong is a contract the harness should keep instead:
 * W303's own words are that a probe left behind by an interrupted run is made impossible rather
 * than cleaned up, and the same argument applies one level up. Callers that already remove their
 * copy still should — this frees during the run, the sweep only catches what is left.
 */
const copies: string[] = [];
let sweeping = false;

export function copyTree(root: string, options: CopyOptions = {}): string {
  // W343: THE NAME CARRIES ITS OWNER. The run-level sweep used to take every `tree-*` whose mtime
  // fell inside the run's window, which is not ownership: a sibling loop session — normal in this
  // tree, where two builders run `pnpm verify` at once — starts AFTER this run does, so all of its
  // live copies sit inside the window and were deleted under it. A pid is the cheapest true
  // statement of who made a directory, and worker threads share the process's, which is exactly the
  // set the teardown may remove.
  const copy = mkdtempSync(path.join(tmpdir(), `tree-${process.pid}-`));
  copies.push(copy);
  if (!sweeping) {
    sweeping = true;
    process.once("exit", () => {
      for (const dir of copies) rmSync(dir, { recursive: true, force: true });
    });
  }
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
  "src/quality/quarter-mutants.ts":
    "The same substitution, in a module rather than a test. W332's runner takes its reader and its writer as a parameter so the loop can be driven off a map — `FILE_IO` is the real pair, and it is the only write here. The restore is in a `finally` per module, and the whole thing runs inside a copied tree. It is a non-test module because W289's remedy asked for one: welded inside a test file, the loop cannot be shown reporting a survivor without spawning a hundred seconds of subprocess.",
  "src/quality/unapplied-remedies.test.ts":
    "The same substitution as `mutation-sampling.test.ts` above and for its reason: it writes a mutated module over a real one inside a copied tree and writes the original back in a `finally`, because `withPlantedIn` deletes what it wrote and the file it writes already exists. W357 drives four mutants this way to prove the remedies recorded against them are built rather than written down.",
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
  "src/quality/unit-headers.test.ts":
    "Plants header probes into a copied tree with `writeFileSync` beside its `withPlantedIn` calls, for the cases that need the file to outlive one scope — a probe written, read by two derivations, then removed by the test's own `rmSync`. It used to be exempt for importing the planter, which said nothing about the writes it does not route through it.",
  "src/quality/self-reference.test.ts":
    "Writes fixture modules into a copied tree for the detectors that must see a planted instance, alongside the planter for the ones that do not. Same shape and same reason as the header probes above, and it was exempt on the same weak ground.",
  "src/quality/planting.ts":
    "The planter itself. Its `write` is the mechanism every declared and undeclared plant in this list is measured against, so a rule that sent it through a planter would be sending it through itself. It is here rather than exempted in code because W328 found it dropping out of its own population silently — the line that tests whether a file imports the planter contains the words it tests for.",
  "src/interest/store.ts":
    "The append-only signup store, which writes the file it exists to keep. A product module writing product data at the path it was configured with: nothing is planted, nothing is put in front of a detector, and the write is the module's whole purpose rather than a fixture for one. W328 added it when the sweep's population widened past test files, which is where W322's leak had been living.",
  "src/compliance/composed-copy.test.ts":
    "Copies the tree and edits a copy-carrying module in place to prove the composed-copy linter reads the edit, restoring it afterwards — a substitution, like the mutation sampler's.",
};

export interface PlanterDiff {
  /** A module that writes files and neither imports a planter nor is declared. */
  undeclared: string[];
  /** A declared file that no longer writes anything. */
  stale: string[];
}

/**
 * Both directions, W102's shape, so a fifth harness cannot arrive quietly.
 *
 * THE POPULATION IS EVERY MODULE AND NOT ONLY THE TEST FILES, which is W328's correction and is
 * owed to this register's own bound. That sentence said *a helper in a non-test module is invisible
 * to it* — and then W322 met exactly that: the write that landed in the repository came from
 * `declaration-tax.ts`, a register module, driven by `manifest.ts`, another one. The bound named
 * the class before it arrived and nothing in this tree turns a named class into a check on the day
 * it stops being hypothetical, so the sweep stayed narrow through the whole event it described.
 *
 * AND THE EXEMPTION IS GONE. It used to pass any file that IMPORTED a planter, which is a claim
 * about a file made from a fact about one line of it: `mutation-sampling.test.ts` gained a
 * `copyTree` import in this very unit and its raw write — declared, and still a real write —
 * silently left the population. A file that plants only through the harness never calls
 * `writeFileSync` at all, so it is out of the population by construction and needs no special
 * case; a file that calls it says why. The substring form had also exempted THIS file from its own
 * sweep, since the line testing for `from "./planting"` contained `from "./planting"`.
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
    const raw = readFileSync(file, "utf8");
    // W302's preparation: a register that quotes a write as a FIXTURE is not a register that
    // writes. `blind-spots.ts` carries both spellings of this call in probe bodies, and the first
    // draft of the widened population reported it for the strings it hands to a planted tree.
    const text = prepareForScan(raw, { comments: "subtracted", literals: "blanked" });
    if (!/\bwriteFileSync\s*\(/.test(text)) continue;
    writers.push(rel);
  }
  return {
    undeclared: writers.filter((f) => !(f in declared)).sort(),
    stale: Object.keys(declared).filter((f) => !writers.includes(f)).sort(),
  };
}

/** What a green `planterDiff` does not prove. */
export const PLANTING_BOUND =
  "The sweep reads `writeFileSync` in any module under `src/`. A plant written with `fs/promises`, " +
  "an `appendFileSync` or a shell-out is invisible to it — the class of bound W267 states about " +
  "`readdirSync`, and the same remedy applies when such a plant arrives. THE CLAUSE THAT USED TO " +
  "SIT BESIDE THOSE IS GONE, and how it went is worth more than the sentence was: this bound also " +
  "excused a helper in a non-test module, and then W322's plant into the repository came from " +
  "`declaration-tax.ts` driven by `manifest.ts`, both of them register modules — the excused class exactly. " +
  "A stated bound names a way in, and nothing in this tree notices the day something walks through " +
  "it, so the sweep stayed narrow through the whole event it had predicted. What it still says " +
  "nothing about is the copies themselves: a suite that forgets its `afterAll` leaks a temporary " +
  "directory, which no register here reads, and the operating system rather than this tree is what " +
  "eventually collects it. Nor does it reach WHERE a write lands — a module using the harness and " +
  "handing it the repository passed this sweep every day W322's leak was live, which is why the " +
  "refusal that stops it is a runtime check and not a reading of source.";

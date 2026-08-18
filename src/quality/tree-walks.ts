// W282: the tree-derivations, given roots — so the registers built on them can be shown to notice.
//
// W267 enumerated the twenty-seven files that derive something from the tree and found that almost
// none had ever been shown a file arriving, which is the one event they all exist to catch. The
// reason was structural rather than careless: **a walk can only be tested by pointing it at a
// different tree, and only a detector that takes a root can be pointed anywhere.** Every unproven
// entry in that census carries the same one-line remedy — *export the walk from a module with a
// `root` parameter, the way `discoverFoldSites(root)` and `reachableFromApp(root)` already do.*
// This is that remedy, applied in a batch.
//
// SEVEN WALKS MOVED, AND THEY MOVED HERE RATHER THAN INTO SEVEN MODULES. Each was a private
// function inside the test file that owned it, and each is the same shape: walk the tree, keep the
// files matching some rule, return paths. Seven near-identical `readdirSync` recursions is the
// duplication W51 wrote its store registry against and W248 wrote the vertical assembly against —
// *one bespoke copy is a file, two are a pattern nobody declared, and the third gets written by
// copying whichever of the two its author found first.* Four of these seven were already
// character-for-character the same function under two names.
//
// AND THE POINT IS NOT TIDINESS. It is that the next author writing a register gets a ROOTED walk
// by default. A fresh `readdirSync` inside a new test file is how every one of these became
// unprovable, and it is the cheapest thing in the world to write; the fix that lasts is making the
// rooted version the one that is already there.
//
// WHAT THIS DOES NOT CLAIM. Moving a walk does not make its register correct — it makes the
// register's walk OBSERVABLE, which is a smaller and different thing. `register-census.test.ts`
// plants a file in a copied tree per walk and requires each to report it; that is the proof, and
// it lives with the census rather than here, because a module that proved itself would be
// answering its own question.
//
// FOUNDER GATE (plan §4): nothing crossed. These read file names and file text.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * The directories no walk in this tree wants, in one place.
 *
 * EXPORTED BY W327 BECAUSE THERE WERE THREE ANSWERS TO ONE QUESTION. This set had six entries,
 * `register-census.ts` kept its own with three, and `self-reference.ts` recursed with none — so
 * three walks over "the tree" meant three different trees, and the one with no list answered about
 * `node_modules`. What a walk excludes is a fact about the repository rather than about the walk,
 * which is why it belongs here and is imported rather than restated.
 */
export const EXCLUDED_DIRECTORIES: ReadonlySet<string> = new Set([
  "node_modules",
  ".git",
  ".next",
  "test-results",
  "playwright-report",
  "reports",
]);

const SKIP_DIRS = EXCLUDED_DIRECTORIES;

/**
 * Every file under `dir`, recursively, skipping the directories no walk here wants.
 *
 * EXPORTED BY W341, AND THAT IS THE UNIT'S POINT. W282 moved seven walks here so each could be
 * given a root, and W327 exported the skip list so there would be one answer to what the tree is —
 * but both shared the ANSWERS and left the recursion private, so a module with a question these
 * seven do not answer still had to write `readdirSync` again. `self-reference.ts` is the proof: it
 * needed the walk WITHOUT an extension filter (its whole mechanism is a fixture extension no walk
 * matches), imported the shared skip list, and then had to copy the recursion around it. Its copy
 * had since grown a guard this one did not have — see below — which is a fix landing in the copy
 * and never reaching the original, the exact direction of travel a private copy causes.
 */
export function filesUnder(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir).sort();
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    if (SKIP_DIRS.has(entry)) return [];
    const full = path.join(dir, entry);
    try {
      return statSync(full).isDirectory() ? filesUnder(full) : [full];
    } catch {
      // W341, from `self-reference.ts`: a path `readdirSync` listed and `statSync` cannot resolve
      // is a broken symlink. Skipping it is the only honest answer — it is not a file this tree
      // holds — and throwing here would take every register built on this walk down with it.
      return [];
    }
  });
}

/** Repo-relative, posix separators on every platform. */
function rel(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

/**
 * Every non-test TypeScript module under `root/src`, as absolute paths.
 *
 * The shared recursion four of the seven walks below were each holding their own copy of.
 */
export function sourceModules(root: string): string[] {
  return filesUnder(path.join(root, "src")).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  );
}

/**
 * W290: every TypeScript file under `src/`, tests INCLUDED.
 *
 * Separate from `sourceModules` rather than a flag on it, because the difference is the finding:
 * four of the tree's ten pinned constants live in `.test.ts` files, so a sweep for pins built on
 * the source-only walk would have reported six and called itself complete.
 */
export function typescriptFiles(root: string): string[] {
  return filesUnder(path.join(root, "src")).filter((f) => f.endsWith(".ts"));
}

/**
 * W116: every file tooling has to be able to read as text.
 *
 * Walks the whole repository rather than `src/`, which is why it keeps its own extension list.
 */
export function textFiles(root: string): string[] {
  return filesUnder(root).filter((f) => /\.(ts|tsx|md|json|css|mjs|mts|sql|yml|yaml)$/.test(f));
}

/**
 * W51: every `export function resetX()` in the tree, by name.
 *
 * `resetAllStores` is excluded: it is the registry's own front door rather than a store, which is
 * the exclusion `stores.test.ts` already made and W265's sweep had to make again from outside.
 */
export function exportedResetters(root: string): string[] {
  const found = new Set<string>();
  for (const file of sourceModules(root)) {
    for (const m of readFileSync(file, "utf8").matchAll(/^export function (reset[A-Za-z0-9_]*)\s*\(/gm)) {
      if (m[1] !== "resetAllStores") found.add(m[1]!);
    }
  }
  return [...found].sort();
}

/**
 * W106: every module holding a `globalThis`-backed store — one that can retain data across
 * requests, and therefore one erasure has to reach.
 */
export function storeModules(root: string): string[] {
  return sourceModules(root)
    .filter((file) => /globalThis as \{/.test(readFileSync(file, "utf8")))
    .map((file) => rel(root, file))
    .sort();
}

/** W2/W18/W55: every SQL migration, in order, joined — the schema the domain types answer to. */
export function migrationFiles(root: string): string[] {
  return filesUnder(path.join(root, "supabase", "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function migrationSql(root: string): string {
  return migrationFiles(root)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
}

/** W250: the vertical DECLARATIONS — everything under `src/verticals/` that is not machinery. */
export function verticalModules(root: string, machinery: ReadonlySet<string>): string[] {
  const dir = path.join(root, "src", "verticals");
  return readdirSync(dir)
    .filter(
      (f) =>
        f.endsWith(".ts") &&
        !f.endsWith(".test.ts") &&
        !f.endsWith(".types.ts") &&
        !machinery.has(f),
    )
    .sort();
}

/** W208/W268: the gate-dossier tests, which DOSSIER-1's predicate scans for an unbounded read. */
export function dossierTestFiles(root: string): string[] {
  const dir = path.join(root, "src", "quality");
  return readdirSync(dir)
    .filter((f) => /^gate-dossier-.*\.test\.ts$/.test(f))
    .sort();
}

/**
 * W275: the page suite's spec files — every rendered surface the gate can run.
 *
 * Rooted like the rest, because the register built on it has to be shown a spec ARRIVING: a spec
 * added and never run is exactly the silent exclusion W275 exists to make impossible.
 */
export function pageSpecFiles(root: string): string[] {
  return filesUnder(path.join(root, "e2e"))
    .filter((f) => f.endsWith(".spec.ts"))
    .map((file) => rel(root, file))
    .sort();
}

/**
 * W288: every `*.test.ts` under `root/src` — the files the tautology sweep reads.
 *
 * The counterpart to `sourceModules`, which excludes exactly these. Rooted for the same reason as
 * the rest: a sweep for assertions that cannot fail has to be shown a test file ARRIVING, or it
 * reports a clean tree while a new file's tautologies sit outside its list.
 */
export function testModules(root: string): string[] {
  return filesUnder(path.join(root, "src")).filter((f) => f.endsWith(".test.ts"));
}

/** W210's live condition: modules whose first line is not a `// W<n>` header. */
export function modulesWithNoUnitHeader(root: string): string[] {
  return sourceModules(root)
    .filter((file) => !/^\/\/ W\d+/.test(readFileSync(file, "utf8").split("\n")[0] ?? ""))
    .map((file) => rel(root, file))
    .sort();
}

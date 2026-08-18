// W333: what a green suite does not run — named, module by module and branch by branch.
//
// A GREEN SUITE IS GREEN ABOUT WHAT IT RAN. Everything else it is silent about, and silence and
// success look identical from outside. This tree has two shapes of that silence and had counted
// both: `UNTESTED_AT_W296` listed sixteen modules with no sibling suite, and W291's register held
// two branches nobody could construct. A list of sixteen paths is named in the weakest sense —
// nobody can tell from it which modules are exercised elsewhere and which are not exercised at all.
//
// SO THE QUESTION IS REACHABILITY, NOT ADJACENCY. Twelve of the sixteen are reached by some other
// suite through ordinary imports; a sibling file is a convention, not a measurement. Walking from
// every `*.test.ts` through its imports leaves TWO modules the unit suite cannot reach at all, and
// both are the same kind: imported only by a page, so Playwright runs them and vitest cannot.
// That is worth saying out loud, because a mutation sampler reporting "no mutant survived" over a
// module nothing could have executed is reporting on nothing.
//
// AND THE WALK MISSES DYNAMIC IMPORTS, which is why the first derivation here said FOUR. Both
// `collateral` builders are reached by `await import("@/collateral/deck")` — a real edge the
// static walk does not follow — and a register that had shipped the first answer would have named
// two modules as unrun that a suite runs on every green build.
//
// WHAT THIS DOES NOT PROVE is `UNRUN_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads imports.

import { readFileSync } from "node:fs";
import path from "node:path";
import { reachableFrom, reachableFromApp } from "@/security/reachability";
import { REFUSAL_BRANCHES, type RefusalBranch } from "./refusal-branches";
import { sourceModules, typescriptFiles } from "./tree-walks";

/** Who runs a module the unit suite cannot reach. */
export type RunBy =
  /** The e2e suite reaches it through a page. Playwright runs it; vitest cannot. */
  | { kind: "e2e"; why: string }
  /** Nothing runs it. The honest worst case, and the one that must never be a surprise. */
  | { kind: "nothing"; why: string };

export interface UnrunModule {
  module: string;
  runBy: RunBy;
}

/**
 * The modules declared unreachable by the unit suite, each argued.
 *
 * NAMED WITH A REASON RATHER THAN LISTED, which is the whole of W333's gate. Both entries are the
 * same shape today and are still written out separately: a shared reason is a reason each of them
 * has, not a category to file them under, and the day one stops being page-only its entry has to
 * be rewritten rather than silently covered by a sentence about the other.
 */
export const UNRUN_MODULES: readonly UnrunModule[] = [
  {
    module: "src/console/clinician-identity.ts",
    runBy: {
      kind: "e2e",
      why: "W81's answer to *which clinician is the signed-in person* — imported by the credentials and education pages and by nothing else. The e2e suite signs in and loads both, so it executes; the unit suite has no path to it, and its mutants would be reported as unkilled by a sampler that never ran them. What a sibling suite would add is the case the pages do not exercise: an email that matches no clinician, which the console never reaches because it signs in as one who does.",
    },
  },
  {
    module: "src/synthetic/referrals.ts",
    runBy: {
      kind: "e2e",
      why: "W95's synthetic referral histories, imported by the outreach page alone. Every other synthetic generator is imported by a test that asserts its shape; this one is generated straight into a page. A sibling suite would pin what the outreach console depends on — that the histories are deterministic under a seed and that no row carries a real-looking identifier — neither of which any assertion in this tree makes today.",
    },
  },
];

/** A module a test file reaches only through `await import("@/…")`, which the static walk misses. */
export function dynamicallyImported(root: string, testFiles: readonly string[]): string[] {
  const found = new Set<string>();
  for (const file of testFiles) {
    for (const m of readFileSync(file, "utf8").matchAll(/import\s*\(\s*["']@\/([^"']+)["']\s*\)/g)) {
      found.add(path.join(root, "src", `${m[1]!}.ts`));
    }
  }
  return [...found].sort();
}

/**
 * Every module under `src/` that no `*.test.ts` can reach, statically or dynamically.
 *
 * The entry points are the test files themselves, so this answers *what could this suite possibly
 * execute* rather than *what has a file beside it*. Dynamic imports are added as entry points
 * because the shared walk does not follow them — see the header, and `UNRUN_BOUND` for what that
 * still leaves.
 */
export function unreachedByUnitSuite(root: string): string[] {
  const all = typescriptFiles(root);
  const tests = all.filter((f) => f.endsWith(".test.ts"));
  const dynamic = dynamicallyImported(root, tests).filter((f) => all.includes(f));
  const seen = new Set(reachableFrom(root, [...tests, ...dynamic]).files);
  return sourceModules(root)
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .filter((m) => !m.endsWith(".test.ts") && !seen.has(m))
    .sort();
}

/** A branch its own register says nobody can construct, with the fixture that would. */
export function unreachedBranches(
  branches: readonly RefusalBranch[] = REFUSAL_BRANCHES,
): Array<{ id: string; fixture: string }> {
  return branches
    .flatMap((b) =>
      b.reach.kind === "unreached"
        ? [{ id: `${b.module}::${b.fn}::${b.branch}`, fixture: b.reach.fixture }]
        : [],
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

export interface UnrunDefect {
  what: string;
  subject: string;
}

/**
 * Both directions over the modules, plus the claim each declaration makes about who DOES run it.
 *
 * The third arm is the one worth having: an entry saying `e2e` is a claim that the page suite
 * reaches the module, and `reachableFromApp` can answer it. Without that a declaration could say
 * anything, and the reason a module is unrun is exactly what a reader needs to be true.
 */
export function unrunDefects(
  root: string,
  declared: readonly UnrunModule[] = UNRUN_MODULES,
): UnrunDefect[] {
  const found = unreachedByUnitSuite(root);
  const byModule = new Map(declared.map((d) => [d.module, d.runBy]));
  const fromApp = new Set(reachableFromApp(root).files);
  const out: UnrunDefect[] = [];
  for (const module of found) {
    if (!byModule.has(module)) {
      out.push({ subject: module, what: "no test suite reaches it and nothing here says why" });
    }
  }
  for (const { module, runBy } of declared) {
    if (!found.includes(module)) {
      out.push({ subject: module, what: "is declared unreachable and the unit suite reaches it" });
      continue;
    }
    if (runBy.kind === "e2e" && !fromApp.has(module)) {
      out.push({ subject: module, what: "is declared reachable from a page and no page reaches it" });
    }
  }
  return out.sort((a, b) => `${a.subject}${a.what}`.localeCompare(`${b.subject}${b.what}`));
}

/** What this does not prove. */
export const UNRUN_BOUND =
  "REACHED IS NOT RUN. This walks imports, so a module every suite imports and no assertion ever " +
  "calls counts as reached — the question it answers is what the suite COULD execute, which is " +
  "the ceiling on what it does. Coverage instrumentation answers the other question and this " +
  "deliberately is not that: a coverage number is a total, and W304's lesson is that a total is " +
  "the thing nobody edits when it moves. What is added instead is the floor nobody had: a module " +
  "no test can reach is a module no test result is about, whatever the number says. The walk also " +
  "follows only `from \"...\"` and `import(\"@/...\")`; a require, a path built at runtime, or a " +
  "dynamic import written with a relative specifier is invisible, and the first draft of this " +
  "register named as unrun a pair of modules that a suite reaches by exactly that route. And " +
  "the branch half is narrower still: it reports what W291's register DECLARES unreachable, so a " +
  "branch nobody has noticed is unreachable is not here — being declared is the whole of what " +
  "makes it visible, which is why the arm that reports such a branch is driven on a planted " +
  "example rather " +
  "than on this tree.";

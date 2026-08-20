// W382: a hook wired to a moment its case never reaches.
//
// W375 FOUND ONE AND FIXED IT, AND THE SHAPE IS GENERAL. The sweep that reclaims an interrupted
// run's temporary trees was wired into vitest's `teardown` and nowhere else — and `teardown` is
// exactly the hook an interrupted run does not get. The failure the sweep exists for was the one
// ending its moment could not see, so it ran on every run that did not need it and on none that
// did. W360 measured what that came to: 182 directories, 2.0 GB, from a day of killed runs.
//
// THE QUESTION THIS REGISTER ASKS is not whether a hook is correct but whether the ending it fires
// under includes the ending its failure arises under. Three endings are enough to separate them:
// a run that COMPLETES, a run that FAILS, and a run that is INTERRUPTED. `after`-shaped hooks fire
// under the first two and not the third, which is fine for a hook whose failure cannot survive the
// process and is a hole for a hook that removes something from a disk.
//
// SO THE POPULATION IS EVERY HOOK AND THE SUBJECT IS THE RECLAIMING ONES. A `beforeEach` that
// assigns a fresh object exists for isolation: skip it and nothing outlives the run, because the
// thing it reclaims is memory. A hook that calls `rmSync` is different in kind — what it removes
// is on a disk, and a disk is what an interrupted run leaves behind.
//
// WHAT IT FOUND: eleven temporary-directory prefixes in this tree and two of them swept. `tree-`
// and `plant-` carry the maker's pid and W375's run-level sweep reclaims them; `w263-`, `w267-`,
// `w278-`, `w281-`, `w290-`, `w292-`, `w300-`, `w334-`, `w381-` and `careyield-interest-` carried
// no owner and were removed only by the `afterAll` that an interrupted run skips. Every one of
// those is the defect W375 fixed, still standing in nine other files — including one this same
// loop wrote the unit before. The remedy is a third owned prefix, `probe-`, and it is applied.
//
// WHAT THIS DOES NOT PROVE is `HOOK_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own harness wiring.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { filesUnder } from "./tree-walks";
import { copyMaker } from "./repository-clean";

/** How a run can end. Three, because three is what separates the moments. */
export type Ending = "completed" | "failed" | "interrupted";

export const ENDINGS: readonly Ending[] = ["completed", "failed", "interrupted"];

/** When a hook runs, named for the event rather than for the function that spells it. */
export type MomentKind =
  | "run_setup"
  | "run_teardown"
  | "process_exit"
  | "suite_before_all"
  | "suite_after_all"
  | "per_test_before"
  | "per_test_after";

/**
 * The endings each moment fires under.
 *
 * THIS TABLE IS THE ONE THING HERE THAT IS NOT DERIVED, and it is four facts about a harness
 * rather than a judgement about this tree. `run_setup` runs before anything can fail, so every
 * ending of the run BEFORE it has already happened by the time it reads a disk — that is what
 * makes it the moment W375 moved the sweep to. `run_teardown` and every `after`-shaped hook run
 * when the run finishes, whether green or red, and are skipped when the process is killed.
 * `process_exit` is narrower still: vitest runs its workers as THREADS, so a handler registered
 * inside one never fires at all, which W331 found by counting eight surviving copies after a
 * green run. That is recorded here as `completed` only, and the register's suite measures it.
 */
export const FIRES_UNDER: Readonly<Record<MomentKind, readonly Ending[]>> = {
  run_setup: ["completed", "failed", "interrupted"],
  run_teardown: ["completed", "failed"],
  process_exit: ["completed"],
  suite_before_all: ["completed", "failed", "interrupted"],
  suite_after_all: ["completed", "failed"],
  per_test_before: ["completed", "failed", "interrupted"],
  per_test_after: ["completed", "failed"],
};

/** How a hook is spelled, and the moment that spelling means. */
const SPELLINGS: ReadonlyArray<readonly [string, MomentKind]> = [
  ["beforeAll", "suite_before_all"],
  ["afterAll", "suite_after_all"],
  ["beforeEach", "per_test_before"],
  ["afterEach", "per_test_after"],
  ["onTestFinished", "per_test_after"],
  ["onTestFailed", "per_test_after"],
];

/** What a hook body reclaims, and where the thing it reclaims lives. */
export type Reclaims =
  /** Removes a path. What it removes survives the process, so the moment matters. */
  | "outside_the_process"
  /** Restores mocks, timers or module state. The process ending reclaims it either way. */
  | "in_process"
  /** Arranges rather than reclaims. Nothing outlives the hook not running. */
  | "nothing";

/** A hook, where it is, when it runs and what it reclaims. */
export interface HookSite {
  /** Repo-relative, posix separators. */
  module: string;
  moment: MomentKind;
  /** 1-based, so a reader can go to it. */
  line: number;
  reclaims: Reclaims;
}

const REMOVES = /\b(?:rmSync|unlinkSync|rmdirSync)\s*\(|\b(?:rm|unlink)\s*\(/;
const IN_PROCESS = /\b(?:restoreAllMocks|resetAllMocks|clearAllMocks|unstubAllEnvs|unstubAllGlobals|useRealTimers|useFakeTimers|resetModules)\s*\(/;

/** The body of a call whose opening paren is at `open`, by balancing brackets. */
function callBody(code: string, open: number): string {
  let depth = 1;
  let i = open + 1;
  while (i < code.length && depth > 0) {
    const c = code[i];
    if (c === "(" || c === "{" || c === "[") depth += 1;
    else if (c === ")" || c === "}" || c === "]") depth -= 1;
    i += 1;
  }
  return code.slice(open, i);
}

/**
 * Every function this module defines, by name, with its body.
 *
 * ONE LEVEL OF THIS IS THE DIFFERENCE BETWEEN SEEING W375'S CASE AND NOT. The sweep the whole unit
 * is about is spelled `sweepTreeCopies(startedAt)` inside `setup` and `teardown` — a hook whose
 * body names no removal at all and does nothing but call a helper beside it. A reading that
 * stopped at the hook's own text would have found the register's own subject to be reclaiming
 * nothing.
 */
export function localBodies(code: string): Map<string, string> {
  const bodies = new Map<string, string>();
  for (const m of code.matchAll(/^(?:export )?(?:async )?function (\w+)\s*\(/gm)) {
    const brace = code.indexOf("{", m.index! + m[0].length);
    if (brace !== -1) bodies.set(m[1]!, callBody(code, brace));
  }
  for (const m of code.matchAll(/^(?:export )?const (\w+)\s*=\s*(?:async\s*)?\(/gm)) {
    const arrow = code.indexOf("=>", m.index! + m[0].length);
    if (arrow === -1) continue;
    const open = code.indexOf("{", arrow);
    bodies.set(m[1]!, open === -1 || open > code.indexOf(";", arrow) ? code.slice(arrow, code.indexOf(";", arrow)) : callBody(code, open));
  }
  return bodies;
}

/**
 * What a body does, by what it calls, following a call to a function defined beside it.
 *
 * Removal wins: a hook that removes a path is the subject, whatever else it also does.
 */
export function reclaimsOf(body: string, locals: ReadonlyMap<string, string> = new Map()): Reclaims {
  let text = body;
  for (const [name, local] of locals) {
    if (local !== body && new RegExp(String.raw`\b${name}\s*\(`).test(body)) text += local;
  }
  if (REMOVES.test(text)) return "outside_the_process";
  if (IN_PROCESS.test(text)) return "in_process";
  return "nothing";
}

/** Every file the harness can wire a hook into: `src/`, `e2e/`, and the config at the root. */
export function hookFiles(root: string): string[] {
  return [
    ...filesUnder(path.join(root, "src")).filter((f) => f.endsWith(".ts")),
    ...filesUnder(path.join(root, "e2e")).filter((f) => f.endsWith(".ts")),
    path.join(root, "vitest.global-setup.ts"),
  ];
}

/**
 * Every lifecycle and process hook this tree wires, with its moment and what it reclaims.
 *
 * COMMENTS SUBTRACTED AND LITERALS BLANKED, in that order (W295's rule): blanking preserves
 * offsets, which is what lets a body be found by balancing brackets, and a brace inside a string
 * would otherwise close a hook early. The call NAMES survive blanking, which is all this reads.
 */
export function hookSites(root: string): HookSite[] {
  const sites: HookSite[] = [];
  for (const file of hookFiles(root)) {
    let source: string;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = prepareForScan(source, { comments: "subtracted", literals: "blanked" });
    const lineOf = (offset: number) => code.slice(0, offset).split("\n").length;
    const locals = localBodies(code);

    for (const [spelling, moment] of SPELLINGS) {
      const re = new RegExp(String.raw`^\s*(?:test\.)?${spelling}\(`, "gm");
      for (const m of code.matchAll(re)) {
        const open = m.index! + m[0].length - 1;
        sites.push({ module: rel, moment, line: lineOf(m.index!), reclaims: reclaimsOf(callBody(code, open), locals) });
      }
    }
    // `process.once("exit", …)` and `process.on("exit", …)`: the moment vitest's worker threads
    // never reach, which is why W328's sweep lives in the global setup instead.
    for (const m of code.matchAll(/process\.(?:once|on)\(/g)) {
      const open = m.index! + m[0].length - 1;
      sites.push({
        module: rel,
        moment: "process_exit",
        line: lineOf(m.index!),
        reclaims: reclaimsOf(callBody(code, open), locals),
      });
    }
    // The run-level pair. They are exported functions rather than callbacks, so they are found by
    // the export and not by a call: vitest's `globalSetup` calls them by name.
    if (rel === "vitest.global-setup.ts") {
      for (const [name, moment] of [
        ["setup", "run_setup"],
        ["teardown", "run_teardown"],
      ] as ReadonlyArray<readonly [string, MomentKind]>) {
        const m = new RegExp(String.raw`^export function ${name}\(`, "m").exec(code);
        if (!m) continue;
        const open = m.index + m[0].length - 1;
        const after = code.indexOf("{", open);
        sites.push({
          module: rel,
          moment,
          line: lineOf(m.index),
          reclaims: reclaimsOf(callBody(code, after), locals),
        });
      }
    }
  }
  return sites.sort((a, b) => a.module.localeCompare(b.module) || a.line - b.line);
}

/**
 * Every temporary-directory name a module can leave on a disk, as the prefix it carries.
 *
 * Two ways to make one and both count. A literal `mkdtempSync(path.join(tmpdir(), "w300-"))` gives
 * its prefix directly; a call to `copyTree` or `withTree` makes a directory the PLANTER named, so
 * the prefix is the planter's rather than this module's. A module that makes neither leaves nothing
 * of its own behind, and its removals are about somebody else's directory.
 */
export function tempPrefixes(source: string): string[] {
  const code = prepareForScan(source, { comments: "subtracted", literals: "kept" });
  const found = new Set<string>();
  for (const m of code.matchAll(/mkdtempSync\(\s*path\.join\(\s*tmpdir\(\)\s*,\s*([`"'])([^`"'$]*)/g)) {
    if (m[2] !== "") found.add(m[2]!);
  }
  for (const m of code.matchAll(/\bmkdtempSync\(\s*path\.join\(\s*tmpdir\(\)\s*,\s*probeDirPrefix\(/g)) {
    void m;
    found.add("probe-");
  }
  if (/\bcopyTree\s*\(/.test(code)) found.add("tree-");
  if (/\bwithTree\s*\(/.test(code)) found.add("plant-");
  return [...found].sort();
}

/** Whether W375's run-level sweep would ever reclaim a directory carrying this prefix. */
export const sweptPrefix = (prefix: string): boolean => copyMaker(`${prefix.replace(/-$/, "")}-1-x`) !== null;

/** A reclaiming hook whose failure has an ending its moment does not see. */
export interface Unreached {
  module: string;
  moment: MomentKind;
  line: number;
  /** The endings the hook is skipped on. */
  missed: Ending[];
  /** The prefixes its module builds that nothing sweeps. */
  unswept: string[];
}

/**
 * Every reclaiming hook whose failure has an ending its moment does not fire under, uncovered.
 *
 * THERE IS NO EXEMPTION MAP HERE AND THAT IS THE RESULT, not an omission. Both covers are derived
 * on every run — the module's temporary names are all swept, or the same module reclaims again at
 * a moment nothing skips — and the tree needed no third. A written excuse is a claim nobody
 * re-reads; the two facts above are re-derived from the source each time, so a module that stops
 * calling `copyTree`, or a sweep that loses its `setup` half, falls into the report by itself.
 *
 * THE DERIVATION IS PER MODULE AND NOT PER HOOK, which over-reports rather than under-reports: a
 * file that removes a swept tree copy in one hook and an unswept probe directory in another is
 * reported at both. That is the safe direction for a defect register and it is stated in the
 * bound, and the remedy — an owned prefix — clears both at once.
 */
export function unreachedReclaimers(
  root: string,
  sites: readonly HookSite[] = hookSites(root),
): Unreached[] {
  const prefixesOf = new Map<string, string[]>();
  const names = (module: string): string[] => {
    if (!prefixesOf.has(module)) {
      let source = "";
      try {
        source = readFileSync(path.join(root, module), "utf8");
      } catch {
        source = "";
      }
      prefixesOf.set(module, tempPrefixes(source));
    }
    return prefixesOf.get(module)!;
  };
  const unswept = (module: string): string[] => names(module).filter((p) => !sweptPrefix(p));
  const always = new Set(
    sites
      .filter((s) => s.reclaims === "outside_the_process" && FIRES_UNDER[s.moment].length === ENDINGS.length)
      .map((s) => s.module),
  );

  return sites
    .filter((s) => s.reclaims === "outside_the_process")
    .filter((s) => FIRES_UNDER[s.moment].length !== ENDINGS.length)
    .filter((s) => !always.has(s.module))
    // THE DERIVED SWEEP COVER, AND IT REQUIRES A NAME TO SWEEP. A module that builds no temporary
    // directory of its own gets no cover from this: the global setup builds none and removes other
    // runs', which is the case W375 met and the case a `length === 0` reading would have excused.
    .filter((s) => names(s.module).length === 0 || unswept(s.module).length > 0)
    .map((s) => ({
      module: s.module,
      moment: s.moment,
      line: s.line,
      missed: ENDINGS.filter((e) => !FIRES_UNDER[s.moment].includes(e)),
      unswept: unswept(s.module),
    }));
}

export const HOOK_BOUND =
  "THE ENDINGS THIS TABLE NAMES ARE NOT EVERY WAY A RUN CAN END. `completed`, `failed` and " +
  "`interrupted` are enough to separate the moments this tree wires, and they are not a partition " +
  "of what can happen to a process: a run that exhausts memory, a run whose worker crashes while " +
  "the main process survives, and a machine that loses power are each their own ending, and the " +
  "first of those would move rows in `FIRES_UNDER` if anybody worked it out. SECOND, `FIRES_UNDER` " +
  "IS THE ONE TABLE HERE NOBODY DERIVED. The run-level pair is measured by this register's suite, " +
  "by killing a real child run; the rest is read from the harness's contract and from what W331 " +
  "and W375 found by counting directories. A harness upgrade that changed when `afterAll` runs " +
  "would leave this table describing the old one, and nothing here would notice. THIRD, THE COVER " +
  "DERIVATION IS PER MODULE AND THE SUBJECT IS A HOOK. A module that removes a swept copy in one " +
  "hook and an unswept directory in another is reported at both, and a module that removes a " +
  "directory some OTHER module built is reported at neither. FOURTH, `reclaims` IS READ FROM THE " +
  "CALL NAMES IN A BODY, following a call to a function defined beside it by exactly ONE level: a " +
  "hook calling a helper that calls the remover reads as reclaiming nothing, and a hook naming " +
  "`rmSync` inside a branch that never runs reads as a reclaimer. FIFTH, AND THIS IS THE REMEDY " +
  "THE SENTENCE OWES: a `finally` read as a moment is not built. `withTree` and several suites " +
  "remove their directory in a `finally`, which a kill skips exactly as it skips an `afterAll` — " +
  "the same defect at a construct this population excludes by definition. The prefixes those " +
  "files build are swept now, because W382 renamed them with the rest; what is missing is a check " +
  "that would say so, and a new `finally` removing a hand-named directory passes here in silence.";

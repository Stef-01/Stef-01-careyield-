// W385: once per file, or once per run.
//
// A CHECK THAT READS SHARED MUTABLE STATE HAS AN ANSWER THAT DEPENDS ON WHEN IT RAN. The suite
// runs its files in parallel, so "when" is not a thing anybody controls: a pair of files that touch the
// same thing get whichever interleaving the pool happened to produce, and a check written as
// though it were alone is right most of the time and wrong on the run nobody can reproduce.
//
// THE FIRST QUESTION IS WHAT IS ACTUALLY SHARED, AND IT IS MEASURED HERE RATHER THAN ASSUMED. This
// suite runs each test file in a FORKED PROCESS of its own — measured, by writing a variable in one
// file and reading it in another, and by watching a pair of files report different pids. So
// `process.env` is per file. A module-level counter is per file. Nothing in a process is shared
// with anything in another one, which leaves exactly one thing that is: THE DISK.
//
// AND THAT IS WHERE THE DEFECT WAS. `unread-bounds.test.ts` and `repository-clean.test.ts` both
// create `src/planted` INSIDE THE REPOSITORY to drive W331's artefact sweep, and both open with
// `expect(artefactsPresent(ROOT)).toEqual([])` as their control. A pair of files, a single path, no
// sequencing: if the pool runs them together, one file's control sees the other file's directory
// and the gate goes red with nothing wrong. `artefactsPresent` takes its root as a parameter, so
// the fix is to hand one of them a copy — which is what W385 did.
//
// THE THIRD THING MEASURED HERE IS THE ONE W375 GOT RIGHT FOR THE WRONG REASON. A handler
// registered with `process.once("exit")` inside a test file never runs, and `run-residue.ts` says
// that is because vitest runs its workers as THREADS — *the thread ends and the process does not*.
// It does not: the workers are forked processes with pids of their own, and the handler still never
// fires, because vitest tears a worker down rather than letting it exit. The conclusion held and
// the reason did not, which is the kind of sentence a register is for.
//
// WHAT THIS DOES NOT PROVE is `SHARED_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own test files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { typescriptFiles } from "./tree-walks";

/** A thing more than one check could reach. */
export type Shared =
  /** Environment variables. */
  | "process_env"
  /** A module-level binding, mutated by the tests in a file. */
  | "the_module_registry"
  /** A handler registered for the process ending. */
  | "a_process_exit_handler"
  /** The repository itself: one directory, and every file in the run sees the same one. */
  | "the_repository";

/** How far a piece of shared state actually reaches. */
export type Scope =
  /** Reset for every test file, because every file gets a process of its own. */
  | "per_file"
  /** One of them for the whole run, whatever order the files execute in. */
  | "per_run"
  /** Registered and never reached. */
  | "never_runs";

/**
 * What the harness gives each kind, measured rather than read from documentation.
 *
 * THE TWO THAT DECIDE ANYTHING ARE DRIVEN BY THIS REGISTER'S SUITE, with real child runs: a
 * variable written in one file and read in another, and an exit handler registered in a file that
 * is allowed to finish. The other rows follow from the first — a forked process per file is what
 * makes a module-level binding per file — and the bound says so.
 */
export const SCOPE_GIVEN: Readonly<Record<Shared, Scope>> = {
  process_env: "per_file",
  the_module_registry: "per_file",
  a_process_exit_handler: "never_runs",
  the_repository: "per_run",
};

/** A test file touching something shared, and which way. */
export interface StateSite {
  /** Repo-relative, posix separators. */
  module: string;
  shared: Shared;
  access: "reads" | "writes";
}

const ENV_WRITE = /process\.env\.[A-Z0-9_]+\s*=|delete\s+process\.env\.|stubEnv\s*\(/;
const ENV_READ = /process\.env\.[A-Z0-9_]+/;
const EXIT_HANDLER = /process\.(?:once|on)\(\s*["'`]exit/;
/** A write whose path is built from the repository root, which this tree spells `ROOT`. */
/** A read of what the repository holds right now, rather than of a copy. */
const ROOT_STATE_READ = /(?:artefactsPresent|uncleanMessage)\(\s*ROOT\b/;

/** The write calls whose target is a path, with which argument the target is. */
const WRITES: ReadonlyArray<readonly [string, number]> = [
  ["mkdirSync", 0],
  ["writeFileSync", 0],
  ["appendFileSync", 0],
  ["rmSync", 0],
  ["rmdirSync", 0],
  ["unlinkSync", 0],
  // A copy's TARGET is its second argument. Its first is a source, and half these files open by
  // copying `path.join(ROOT, "src")` somewhere else — a read of the repository, not a write to it.
  ["cpSync", 1],
];

/** The arguments of a call whose opening paren is at `open`, split at depth zero. */
function argumentsOf(code: string, open: number): string[] {
  let depth = 0;
  let i = open;
  let last = open + 1;
  const args: string[] = [];
  for (; i < code.length; i += 1) {
    const c = code[i]!;
    if ("({[".includes(c)) depth += 1;
    else if (")}]".includes(c)) {
      depth -= 1;
      if (depth === 0) break;
    } else if (c === "," && depth === 1) {
      args.push(code.slice(last, i).trim());
      last = i + 1;
    }
  }
  args.push(code.slice(last, i).trim());
  return args;
}

/**
 * Every path inside the repository that a file WRITES.
 *
 * READ FROM THE NAME OF A BINDING, WHICH IS A CONVENTION AND NOT A DERIVATION — `ROOT` is what this
 * tree calls the repository in every file that has one, and `COPY` is what it calls a copy of it.
 * The bound says what that misses. What the shape buys is that the answer is a PATH rather than a
 * file, so a pair writing the same place is visible as the pair it is; and that the TARGET
 * argument is read rather than the whole call, because `cpSync(path.join(ROOT, "src"), …)` reads
 * the repository and writes somewhere else, and counting it was the first thing this got wrong.
 */
export function repositoryWrites(source: string): string[] {
  const code = prepareForScan(source, { comments: "subtracted", literals: "kept" });
  const inRepo = (expression: string): string | null =>
    /^path\.join\(\s*ROOT\s*,\s*"([^"]+)"\s*\)$/.exec(expression)?.[1] ?? null;

  const aliases = new Map<string, string>();
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*(path\.join\(\s*ROOT\s*,\s*"[^"]+"\s*\))/g)) {
    const where = inRepo(m[2]!);
    if (where !== null) aliases.set(m[1]!, where);
  }

  const written = new Set<string>();
  for (const [call, which] of WRITES) {
    for (const m of code.matchAll(new RegExp(String.raw`\b${call}\(`, "g"))) {
      const args = argumentsOf(code, m.index! + m[0].length - 1);
      const target = args[which];
      if (target === undefined) continue;
      const where = inRepo(target) ?? aliases.get(target) ?? null;
      if (where !== null) written.add(where);
    }
  }
  return [...written].sort();
}

/** Every test file in the tree, as a repo-relative path with its prepared source. */
function testFiles(root: string): Array<{ module: string; source: string }> {
  return typescriptFiles(root)
    .filter((f) => f.endsWith(".test.ts"))
    .map((f) => ({
      module: path.relative(root, f).split(path.sep).join("/"),
      source: readFileSync(f, "utf8"),
    }));
}

/** Every test file that touches something shared, with which thing and which way. */
export function stateSites(root: string): StateSite[] {
  const sites: StateSite[] = [];
  for (const { module, source } of testFiles(root)) {
    const code = prepareForScan(source, { comments: "subtracted", literals: "kept" });
    if (ENV_WRITE.test(code)) sites.push({ module, shared: "process_env", access: "writes" });
    else if (ENV_READ.test(code)) sites.push({ module, shared: "process_env", access: "reads" });
    if (EXIT_HANDLER.test(code)) {
      sites.push({ module, shared: "a_process_exit_handler", access: "writes" });
    }
    if (repositoryWrites(source).length > 0) {
      sites.push({ module, shared: "the_repository", access: "writes" });
    } else if (ROOT_STATE_READ.test(code)) {
      sites.push({ module, shared: "the_repository", access: "reads" });
    }
  }
  return sites.sort((a, b) => `${a.module}${a.shared}`.localeCompare(`${b.module}${b.shared}`));
}

/** A path inside the repository that more than one test file writes. */
export interface Clash {
  /** The path, repo-relative. */
  where: string;
  /** Every file that writes it, sorted. */
  files: string[];
}

/**
 * Every place a pair of test files write the same path inside the repository.
 *
 * THIS IS THE WHOLE RULE AND IT IS NARROW ON PURPOSE. One writer is a file arranging its own
 * fixture; two are a race, because the pool decides which runs first and nothing here does. The
 * suite's other shared state is per file — a process each — so the disk is the only place two
 * files can reach each other at all, which is a measurement rather than an assumption.
 */
export function orderDependent(root: string, files = testFiles(root)): Clash[] {
  const byPath = new Map<string, string[]>();
  for (const { module, source } of files) {
    for (const where of repositoryWrites(source)) {
      byPath.set(where, [...(byPath.get(where) ?? []), module]);
    }
  }
  return [...byPath]
    .filter(([, holders]) => holders.length > 1)
    .map(([where, holders]) => ({ where, files: holders.sort() }))
    .sort((a, b) => a.where.localeCompare(b.where));
}

export const SHARED_BOUND =
  "THE REPOSITORY WRITES ARE FOUND BY THE NAME OF A BINDING. `ROOT` is what this tree calls the " +
  "repository in every file that has it, and `COPY` is what it calls a copy — a convention held " +
  "by habit rather than by anything that would fail. A file resolving the repository some other " +
  "way, or building its path through a helper, writes the same disk and appears in no answer " +
  "here. The remedy is a path resolved rather than a binding named: ask where an expression lands " +
  "instead of what it is spelled. SECOND, `SCOPE_GIVEN` IS MEASURED FOR WHAT IT MEASURES AND " +
  "INFERRED FOR THE REST. The suite drives `process_env` and `a_process_exit_handler` with real " +
  "child runs and takes the module registry from the same fact — a forked process per file — " +
  "rather than probing it separately, so a harness that shared a registry between files without " +
  "sharing an environment would leave that row wrong and nothing here would notice. THIRD, TWO " +
  "WRITERS OF A PATH IS THE RULE AND NOT THE WHOLE RACE. A file writing a path while another " +
  "READS the directory above it is the same defect and is invisible to this: the reads are " +
  "counted and never paired, because every register suite in this tree walks the repository and " +
  "pairing them all would report the population against a single writer. FOURTH, IT SAYS NOTHING " +
  "ABOUT ORDER WITHIN A FILE. Tests in a file share a process and a module registry by design, " +
  "and a test depending on an earlier test beside it is a defect this register is not looking for.";

// W328: the run-level moment. Vitest calls `setup` once before any worker starts and `teardown`
// once after every worker has finished — the only moment that sees a residue left by any file in
// the run, whatever order the files happened to execute in.
//
// The derivation lives in `src/quality/repository-clean.ts` and is read by that module's suite too;
// this file is the wiring, and it lives outside `src/` because it is configuration rather than a
// module of the product — the registers walk `src/`, and a hook they would each have to declare
// pays a tax for being in a place it does not belong.

import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { uncleanMessage } from "./src/quality/repository-clean";

/**
 * Temporary tree copies this run left behind, removed.
 *
 * W331 CLOSED THE LEAK AT THE CALLERS AND `copyTree` SWEEPS AT PROCESS EXIT — and eight copies
 * still survived a full verify, because vitest runs its workers as THREADS. A handler registered
 * with `process.once("exit")` inside a worker thread never fires: the thread ends, the process does
 * not, and the module instance holding the list is unreachable from anywhere that will run again.
 * So the sweep lives here, in the one hook guaranteed to run in the main process after every worker.
 *
 * IT LIVES OUTSIDE `src/` DELIBERATELY. The first version was a function in `repository-clean.ts`,
 * and its `readdirSync` made W267's census classify that module as a tree walker — which it is not;
 * it reads the system temp directory, and a census row saying otherwise would be a declaration that
 * misdescribes its subject. This is harness plumbing about `/tmp`, not a property of the repository.
 *
 * `since` is the run's start, so a copy belonging to a DIFFERENT run in the same container is left
 * alone. Removing every `tree-*` unconditionally would delete a concurrent suite's tree under it.
 */
function sweepTreeCopies(since: number): void {
  for (const entry of readdirSync(tmpdir())) {
    if (!entry.startsWith("tree-")) continue;
    const full = path.join(tmpdir(), entry);
    try {
      if (statSync(full).mtimeMs >= since) rmSync(full, { recursive: true, force: true });
    } catch {
      // Gone already, or not ours to read. Either way there is nothing to sweep.
    }
  }
}

let startedAt = 0;

export function setup(): void {
  // The one thing the first half is for: the moment the run began, so the teardown can tell this
  // run's temporary trees from a concurrent run's and sweep only its own.
  startedAt = Date.now();
}

/**
 * Whether this run is the REPOSITORY's run, rather than a suite running inside a copy of it.
 *
 * W331, AND THE SWEEP BROKE THE MUTATION SAMPLER BEFORE THIS EXISTED. W296 runs `npx vitest` as a
 * child process with its cwd set to a tree copy, so the child loads this hook too — and its
 * teardown deleted the copy it was itself running in, because writing a mutant into that copy had
 * touched the directory and brought it inside the child's own time window. A control that answers
 * about the wrong tree, which is the class the quarter this pass reviews was named after.
 *
 * A copy is made from a list of directories that does not include `.git`, so the marker is the one
 * thing the repository has and no copy of it does.
 */
function isTheRepository(): boolean {
  return existsSync(path.join(process.cwd(), ".git"));
}

export function teardown(): void {
  // Vitest runs its workers as THREADS, so `process.once("exit")` inside one never fires. This is
  // the only hook guaranteed to run in the main process after every worker has finished.
  if (!isTheRepository()) return;
  sweepTreeCopies(startedAt);
  const message = uncleanMessage(process.cwd());
  if (message !== null) throw new Error(message);
}

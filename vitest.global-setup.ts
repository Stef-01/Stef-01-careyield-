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
import { ownedByThisRun, reclaimableCopies, uncleanMessage } from "./src/quality/repository-clean";

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
 * OWNERSHIP IS THE PID, NOT THE CLOCK, and W343 found the difference by reading this sentence
 * against what the code does. `since` is the run's START, so it excludes a copy made BEFORE this
 * run and nothing else: a sibling session that begins later — normal here, where two builders run
 * `pnpm verify` at once — has every one of its live copies inside this run's window, and this swept
 * them out from under it. The symptom is an `ENOENT` in the other session's suite on a path it
 * created itself, which is the flake W313 chased for a different cause. `copyTree` now stamps the
 * maker's pid into the name and this removes only its own; the window stays as a second condition,
 * because a pid is reused eventually and a directory older than this run is not this run's.
 */
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists and belongs to somebody else. ESRCH means it is gone.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function sweepTreeCopies(since: number): void {
  for (const entry of reclaimableCopies(readdirSync(tmpdir()), process.pid, isAlive)) {
    const full = path.join(tmpdir(), entry);
    const mine = ownedByThisRun(entry, process.pid);
    try {
      // W360: THE WINDOW APPLIES TO THIS RUN'S OWN COPIES ONLY. It was there so a directory older
      // than the run would not be taken as this run's, which is a question about OUR pid being
      // reused. A dead maker's copy has no such doubt and is older than this run by construction —
      // applying the window to it is what made the sweep unable to reclaim anything at all.
      if (!mine || statSync(full).mtimeMs >= since) rmSync(full, { recursive: true, force: true });
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
  // W375: AND THE SWEEP RUNS HERE TOO, WHICH IS THE MOMENT THE CASE IT EXISTS FOR IS ACTUALLY
  // REACHABLE. W360 gave the sweep the ability to reclaim a dead maker's copy and wired it into
  // `teardown` only — the hook an INTERRUPTED run never gets to. So residue from a killed run sat
  // through the whole of the next run, and if that run was killed too it sat through that one as
  // well: the 182 copies and 2.0 GB W360 measured came from a day of sessions where `pnpm verify`
  // had been killed, and every one of those runs had a teardown that never ran. A dead maker's
  // directory is reclaimable at any instant — that is what "dead" means — so the earliest moment a
  // run can act is the right one. `startedAt` is set first because the window it feeds only ever
  // applies to this run's OWN copies, of which there are none yet.
  if (isTheRepository()) sweepTreeCopies(startedAt);
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

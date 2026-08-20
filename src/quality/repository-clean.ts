// W328: the artefacts a run must not leave in the repository, checked at a moment that sees them all.
//
// W322 FOUND A PLANT THAT WROTE INTO THE REPOSITORY OTHER TEST WORKERS WERE WALKING and stopped it
// at the source: `withPlantedIn` refuses a root inside the repository. It also left a residue check
// behind — an assertion that the tree holds no `src/planted/` — and that check is the reason this
// unit exists, because it answers about an INSTANT. It reads the repository at the moment it
// happens to execute, and vitest runs files in parallel, so it passes whenever it runs before
// whatever writes. A green result from it means "nothing had been written when I looked", which is
// not the claim anybody reads it as making.
//
// SO THE CHECK MOVES TO A MOMENT THAT DOMINATES THE RUN. `globalTeardown` runs once, after every
// worker has finished, and the artefacts here are PERSISTENT: the planting harness removes the file
// it wrote and not the directory it had to create, so the shadow of a write outlives the write by
// design. A moment after everything is the only moment that sees all of them.
//
// WHAT IT CANNOT SEE IS THE WRITE ITSELF, and that half is not covered here — a probe created and
// deleted inside one test is invisible at the end of the run, and it is the FILE, not the folder,
// that another worker lists and then fails to open. That half is `withPlantedIn`'s runtime refusal,
// which answers at the write. Two mechanisms, two moments, and neither is the other's backup.
//
// WHAT THIS DOES NOT PROVE is `CLEAN_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads directory entries.

import { existsSync } from "node:fs";
import path from "node:path";

/** An artefact a run must not leave behind, and what its presence means. */
export interface Artefact {
  /** Path relative to the repository root. */
  where: string;
  /** What it is the shadow of, for whoever meets it. */
  means: string;
}

/**
 * The artefacts, listed rather than derived.
 *
 * A DERIVATION WOULD BE `git status`, and this deliberately is not that. An untracked file is an
 * ordinary state of a working tree — a scratch note, an editor's leavings, a report a developer
 * asked for. What is listed here is narrower: a path nothing in this repository has a reason to
 * create, whose existence is evidence of a specific mechanism having run somewhere it should not.
 */
export const ARTEFACTS: readonly Artefact[] = [
  {
    where: "src/planted",
    means:
      "The planting harness creates the directory it writes into and removes only the file, so this folder is the shadow of a plant that landed in the repository rather than in a copy of it. W322 found the cause — three manifest branch-drivers handing `homeDiff` the repository — and made `withPlantedIn` refuse a root inside the tree. A folder here again means a writer that does not go through it.",
  },
];

/**
 * The name a tree copy carries so its maker can be told from anybody else's.
 *
 * W343: OWNERSHIP IS THE PID, NOT THE CLOCK. The teardown swept every `/tmp/tree-*` inside this
 * run's time window, which excludes a copy made before the run and NOTHING ELSE — so a sibling
 * session starting later had all of its live copies inside the window and this deleted them under
 * it. Overlapping sessions are the normal state of this tree; the ledger is the lock because of it.
 */
export const treeCopyPrefix = (pid: number): string => `tree-${pid}-`;

/**
 * The prefixes a run's temporary directories carry, each ending in the maker's pid.
 *
 * W375: `plant-` WAS NOT ONE OF THEM. `withTree` removes its directory in a `finally`, which covers
 * a probe that throws and not a run that is killed — and with no pid in the name there was nothing
 * a later run could safely reclaim, because it could not tell an abandoned one from a live
 * sibling's. Two prefixes, one rule.
 *
 * W382: `probe-` IS THE THIRD, AND IT IS THE SAME FINDING NINE MORE TIMES. The two above are what
 * the PLANTER builds; nine files built a temporary directory by hand, each named for the unit that
 * wrote it — `w263-`, `w267-`, `w278-`, `w281-`, `w290-`, `w292-`, `w300-`, `w334-`, `w381-` — plus
 * one named for the product. None carried a maker, so none could be reclaimed, and each was removed
 * only by the `afterAll` or the `finally` that an interrupted run skips. They share one prefix now
 * because the sweep's question is `whose is this and is that process alive`, which has nothing to
 * do with which unit built it.
 */
export const TEMP_PREFIXES = ["tree", "plant", "probe"] as const;

/** A hand-built probe directory's name, owned by the run that makes it. */
export const probeDirPrefix = (pid: number): string => `probe-${pid}-`;

/** Whether an entry is one of this process's own temporary directories. */
export const ownedByThisRun = (entry: string, pid: number): boolean =>
  TEMP_PREFIXES.some((prefix) => entry.startsWith(`${prefix}-${pid}-`));


/** The pid a tree copy's name carries, or null when the entry is not one of ours. */
export function copyMaker(entry: string): number | null {
  // BUILT FROM `TEMP_PREFIXES` RATHER THAN SPELLING THEM AGAIN. W344's class: this regex and that
  // list were two copies of one fact when W382 read them, and W382 went to add a third prefix and found only one of
  // them said so. A copy that has to be edited twice is a copy that will be edited once.
  const match = new RegExp(String.raw`^(?:${TEMP_PREFIXES.join("|")})-(\d+)-`).exec(entry);
  return match ? Number(match[1]) : null;
}

/**
 * The copies no live process could still be using: ours, and any dead maker's.
 *
 * W360: W343 MADE OWNERSHIP THE PID AND THE SWEEP STOPPED RECLAIMING ANYTHING. The teardown it
 * fixed exists for ONE case — residue from a run that was interrupted, because a run that finishes
 * removes its own copies at process exit. An interrupted run has a DIFFERENT pid, so a sweep
 * matching only this process's name can never touch the case it was built for. W331 found 426
 * copies and 3.6 GB of `/tmp`; this box was holding 182 and 2.0 GB when the pass looked, and every
 * register that could have said so watches the repository rather than the temp directory.
 *
 * `alive` is the parameter because liveness is the one thing a pure function cannot ask. Signal 0
 * is the ordinary probe — it checks permission to signal and delivers nothing — and a pid that has
 * been reused belongs to a process that is running, so the answer errs toward keeping a directory.
 */
export function reclaimableCopies(
  entries: readonly string[],
  pid: number,
  alive: (maker: number) => boolean,
): string[] {
  return entries
    .filter((entry) => {
      const maker = copyMaker(entry);
      if (maker === null) return false;
      return maker === pid || !alive(maker);
    })
    .sort();
}

/** Which artefacts the repository holds RIGHT NOW. The instant is the parameter, not the answer. */
export function artefactsPresent(root: string, artefacts: readonly Artefact[] = ARTEFACTS): string[] {
  return artefacts.filter((a) => existsSync(path.join(root, a.where))).map((a) => a.where).sort();
}

/**
 * The sentence a run fails with, or null when the repository is clean.
 *
 * Returned rather than thrown so the moment this is called at is the caller's decision — the
 * teardown throws, a test asserts, and both read the same derivation.
 */
export function uncleanMessage(root: string, artefacts: readonly Artefact[] = ARTEFACTS): string | null {
  const present = artefactsPresent(root, artefacts);
  if (present.length === 0) return null;
  const lines = present.map((where) => {
    const artefact = artefacts.find((a) => a.where === where)!;
    return `  ${where} — ${artefact.means}`;
  });
  return `The test run left artefacts in the repository:\n${lines.join("\n")}`;
}

/** What this does not prove. */
export const CLEAN_BOUND =
  "This answers at the end of the run and reports what PERSISTS. A probe written and deleted " +
  "inside a single test is gone before this looks, and that transient file is the half that hurts: " +
  "another worker walking the tree lists it and then fails to open it, which is how the defect " +
  "behind this was met on separate firings, more than once, before anybody could name it. So a green " +
  "result here says the run " +
  "left nothing, not that the run wrote nothing, and the difference is the whole of what " +
  "`withPlantedIn`'s refusal covers instead. Nor is the list of artefacts derived: it names paths " +
  "this repository has no reason to hold, which is a judgement somebody made, and a mechanism " +
  "leaving its shadow somewhere unlisted leaves this quiet. What would widen it is a record of the " +
  "tree before the run compared with the tree after, which is `git status` and a different unit — " +
  "an untracked file is an ordinary state of a working tree and reporting them all is a " +
  "check somebody turns off. AND IT WATCHES THE REPOSITORY AND NOTHING ELSE, which is the sentence " +
  "W375 added because its absence let the same finding be made by hand and then remade later: " +
  "the residue that actually accumulates is " +
  "under the system TEMP directory, this register names no path there, and so a run could leave " +
  "gigabytes of abandoned tree copies and read green here every time. `reclaimableCopies` above " +
  "decides what may be swept and `run-residue.ts` records where every removal is written, but " +
  "neither is this check — nothing in this tree lists `/tmp` and reports what it finds, and the " +
  "occasions it mattered were each a person looking at a disk.";

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
  "check somebody turns off.";

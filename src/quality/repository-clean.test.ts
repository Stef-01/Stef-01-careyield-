// W328 verify gate: "whatever still writes `src/planted/` into the repository identified by
// instrumentation and reproduced deliberately, with PLANT-1 disposed on evidence rather than on
// quiet runs."
//
// WHAT THE INSTRUMENTATION FOUND IS THAT NOTHING WRITES IT ANY MORE, and the interesting part is
// what it took to be allowed to say so. A file was placed at `src/planted` so that any `mkdirSync`
// on that path would fail loudly rather than succeed quietly, and `pnpm verify` — typecheck, the
// whole suite, the build, the audit gate and the e2e run — was run against it. Every collision it
// produced was inside a temp tree that had COPIED the landmine, and not one was a write to the
// repository. That is evidence about a run, which is the strongest thing available and is still
// not the same as a proof about every run, which is why the check below exists at all.

import { existsSync, mkdirSync, rmdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ARTEFACTS,
  CLEAN_BOUND,
  artefactsPresent,
  copyMaker,
  reclaimableCopies,
  treeCopyPrefix,
  uncleanMessage,
} from "./repository-clean";

const ROOT = process.cwd();

describe("W328 the repository holds no artefact of its own test run", () => {
  it("is clean, at the instant this happens to run", () => {
    // Deliberately worded. This assertion is the one W328 exists to distrust: it answers about the
    // moment it executes at, and vitest runs files in parallel, so on its own it says only that
    // nothing had been written when it looked. The claim that the RUN left nothing is the
    // teardown's, and it is the same derivation read at a moment that dominates every worker.
    expect(artefactsPresent(ROOT)).toEqual([]);
    expect(uncleanMessage(ROOT)).toBeNull();
  });

  it("answers about an instant, which is the defect this unit is about", () => {
    // THE ORDER-DEPENDENCE, MADE VISIBLE rather than argued. The same check, over the same
    // repository, one line apart, gives opposite answers — so "which instant" is the whole
    // question, and an in-suite assertion cannot choose one.
    const planted = path.join(ROOT, "src/planted");
    expect(artefactsPresent(ROOT), "the tree was already dirty, so this proves nothing").toEqual([]);
    mkdirSync(planted, { recursive: true });
    try {
      expect(artefactsPresent(ROOT)).toEqual(["src/planted"]);
    } finally {
      rmdirSync(planted);
    }
    expect(artefactsPresent(ROOT)).toEqual([]);
  });

  it("names what the artefact is the shadow of, rather than reporting a path", () => {
    const message = uncleanMessage(ROOT, [{ where: "src", means: "a reason somebody wrote down" }]);
    expect(message).toContain("src — a reason somebody wrote down");
    expect(message).toContain("left artefacts in the repository");
  });

  it("says nothing when the artefact is absent, so the message is the finding", () => {
    expect(uncleanMessage(ROOT, [{ where: "a-path-nothing-creates", means: "x" }])).toBeNull();
    expect(artefactsPresent(ROOT, [{ where: "a-path-nothing-creates", means: "x" }])).toEqual([]);
  });

  it("gives every artefact a reason a reader can act on", () => {
    for (const artefact of ARTEFACTS) {
      expect(artefact.means.length, `${artefact.where} says nothing about what it means`).toBeGreaterThan(150);
      expect(existsSync(path.join(ROOT, artefact.where)), `${artefact.where} is in the tree`).toBe(false);
    }
  });

  it("says what the end of a run cannot see", () => {
    expect(CLEAN_BOUND).toContain("written and deleted");
    expect(CLEAN_BOUND).toContain("left nothing, not that the run wrote nothing");
  });
});

describe("W360 which tree copies a run may remove", () => {
  // BOTH DECISIONS DRIVEN, and both arrived as mutation survivors in this module's own sweep: the
  // rule was written, the pass's suite exercised it, and the fixtures that separate each comparison
  // from its inverse lived in the WRONG FILE. A guard is only driven where its module's suite is.

  it("takes this process's own copies, and a copy of a maker that has died", () => {
    // The case the sweep exists for. A finished run removes its own copies at exit; only an
    // INTERRUPTED one leaves residue, and its pid is by definition not this one.
    const mine = `${treeCopyPrefix(process.pid)}AaBbCc`;
    const dead = "tree-999002-DdEeFf";
    expect(reclaimableCopies([mine, dead], process.pid, () => false)).toEqual([dead, mine].sort());
  });

  it("leaves a LIVE maker's copies alone, which is the whole reason ownership is asked", () => {
    // Separates `maker === pid` from its inverse: with the comparison flipped, this run's own copy
    // stops being reclaimable and a live sibling's starts — the exact swap W343's finding was about,
    // in the other direction.
    const mine = `${treeCopyPrefix(process.pid)}AaBbCc`;
    const live = "tree-999003-GgHhIi";
    const taken = reclaimableCopies([mine, live], process.pid, (maker) => maker === 999_003);
    expect(taken, "this run cannot clean up after itself").toContain(mine);
    expect(taken, "a live sibling's copy is swept out from under it").not.toContain(live);
  });

  it("never touches a directory the naming rule does not cover, whatever the predicate says", () => {
    // Separates `maker === null` from its inverse. Flipped, an entry with no pid in its name falls
    // through to the liveness question — and nothing is alive under a maker that does not exist, so
    // every unrelated `/tmp` directory this run could read would become reclaimable.
    const alien = "tree-legacy-XyZ";
    expect(copyMaker(alien)).toBeNull();
    expect(copyMaker("tree-4242-AbC")).toBe(4242);
    expect(
      reclaimableCopies([alien, "not-a-tree-copy"], process.pid, () => false),
      "a directory this rule never named is deleted anyway",
    ).toEqual([]);
  });
});

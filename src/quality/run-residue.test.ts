// W375 verify gate: "the run-level sweep shown reclaiming a copy an interrupted run left, or the
// gap declared with what would close it; W360's two gigabytes driven as the case; a
// repository-clean register that watches only the repository says so."
//
// THE FIRST CLAUSE IS SHOWN RATHER THAN DECLARED, which is why the sweep's reachability is asserted
// against the harness text rather than described: `sweepTreeCopies` is now reached from `setup` as
// well as `teardown`, and a later edit that tidies the setup call out fails here.
//
// The planted sources live in `scan-fixtures.fixtures` — a scan for `rmSync(` written as a string
// literal in this file would be a site the register reports, and a scan for a CALL written here
// would be the mention it exists to ignore. W307's file, W295's rule.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  HARNESS_FILE,
  RECLAMATION_AT_W375,
  TEMP_RESIDUE_BOUND,
  type Reclamation,
  callersOf,
  reclamationSites,
  residueDefects,
} from "./run-residue";
import { CLEAN_BOUND, copyMaker, ownedByThisRun, reclaimableCopies } from "./repository-clean";
import { fixtureText } from "./scan-text";
import { withTree } from "./planting";

const ROOT = process.cwd();
const SITES = reclamationSites(ROOT);
const harness = () => readFileSync(path.join(ROOT, HARNESS_FILE), "utf8");
const only = (site: string, rows: readonly Reclamation[]) =>
  residueDefects(ROOT, rows).filter((d) => d.site === site);

describe("W375 every place this tree removes what it made says what a kill leaves", () => {
  it("passes, over the tree as it stands", () => {
    expect(residueDefects(ROOT)).toEqual([]);
  });

  it("derives the sites rather than listing them", () => {
    expect(SITES.length).toBeGreaterThan(5);
    expect(RECLAMATION_AT_W375.map((r) => r.site).sort()).toEqual(
      SITES.map((s) => `${s.file}::${s.fn}`).sort(),
    );
    // Evidence that an empty result above is a finding: with nothing declared, every site reports.
    expect(residueDefects(ROOT, []).length).toBeGreaterThan(5);
    // The harness is in the population and is outside every walk, which is why it is named.
    expect(SITES.some((s) => s.file === HARNESS_FILE)).toBe(true);
  });

  it("reads a removal written with rmSync and not one written any other way", () => {
    // W267'S DISTINCTION and the mutation the census entry names: the walk reaches a file nobody
    // told it about. The negative beside it is the shape the bound calls invisible — a removal
    // written with `fs/promises`, which this register cannot see and must not claim to.
    const found = withTree(
      {
        "src/planted/sync.ts": fixtureText("removal-by-rmsync"),
        "src/planted/promised.ts": fixtureText("removal-by-promise"),
      },
      (root) => reclamationSites(root).map((s) => `${s.file}::${s.fn}`),
    );
    expect(found).toEqual(["src/planted/sync.ts::clears"]);
  });

  it("reports a removal nothing has said anything about", () => {
    const missing = RECLAMATION_AT_W375.filter((r) => r.site !== "src/quality/planting.ts::withTree");
    expect(only("src/quality/planting.ts::withTree", missing)).toEqual([
      {
        site: "src/quality/planting.ts::withTree",
        what: "removes something and nothing says what a killed run leaves there",
      },
    ]);
  });

  it("reports a row for a removal this tree does not have", () => {
    const orphan: Reclamation[] = [
      { site: "src/gone.ts::goneSweep", reachedFrom: [], afterKill: "y".repeat(130) },
    ];
    expect(only("src/gone.ts::goneSweep", orphan)).toEqual([
      { site: "src/gone.ts::goneSweep", what: "is recorded here and removes nothing in this tree" },
    ]);
  });

  it("reports a caller the row names that does not call it", () => {
    const wrong = RECLAMATION_AT_W375.map((r) =>
      r.site === `${HARNESS_FILE}::sweepTreeCopies` ? { ...r, reachedFrom: ["setup", "teardown", "isAlive"] } : r,
    );
    expect(only(`${HARNESS_FILE}::sweepTreeCopies`, wrong)).toEqual([
      {
        site: `${HARNESS_FILE}::sweepTreeCopies`,
        what: "is recorded as reached from isAlive, which does not call it",
      },
    ]);
  });

  it("reports a caller the row leaves out, which is how a hook grows quietly", () => {
    const partial = RECLAMATION_AT_W375.map((r) =>
      r.site === `${HARNESS_FILE}::sweepTreeCopies` ? { ...r, reachedFrom: ["teardown"] } : r,
    );
    expect(only(`${HARNESS_FILE}::sweepTreeCopies`, partial)).toEqual([
      { site: `${HARNESS_FILE}::sweepTreeCopies`, what: "is reached from setup and the row does not say so" },
    ]);
  });

  it("reports a row that names no consequence, because a site without one is a list entry", () => {
    const bare = RECLAMATION_AT_W375.map((r) =>
      r.site === "src/quality/planting.ts::withTree" ? { ...r, afterKill: "it is left" } : r,
    );
    expect(only("src/quality/planting.ts::withTree", bare)).toEqual([
      {
        site: "src/quality/planting.ts::withTree",
        what: "is recorded without an argument about what survives a kill",
      },
    ]);
  });
});

describe("W375 the caller scan reads a call, and both drafts of it read something else", () => {
  it("does not read a call out of a string literal", () => {
    expect(callersOf(fixtureText("call-in-a-string"), "copyTree")).toEqual([]);
  });

  it("does not stop reading at a backtick in prose, which is what blanking without stripping does", () => {
    // The failure this drives is silence, not noise: the first draft returned NO callers for the
    // harness because a backticked name in a doc comment opened a template literal that swallowed
    // the rest of the file.
    expect(callersOf(fixtureText("call-under-a-backtick"), "sweeps")).toEqual(["calls"]);
  });
});

describe("W375 the sweep now reaches the case it was built for", () => {
  it("is called from setup as well as teardown, which is the fix this unit is", () => {
    // THE UNIT, asserted against the harness rather than described. W360 gave the sweep the ability
    // to reclaim a dead maker's directory and wired it into `teardown` only — the hook an
    // interrupted run never reaches — so residue sat through the whole of the following run.
    expect(callersOf(harness(), "sweepTreeCopies").sort()).toEqual(["setup", "teardown"]);
    expect(harness()).toContain("if (isTheRepository()) sweepTreeCopies(startedAt);");
  });

  it("reclaims a dead maker's tree copy AND its planted roots, which is W360's two gigabytes", () => {
    // THE CASE, driven. W360 measured 182 directories and 2.0 GB left by a day of killed runs; the
    // sweep it shipped could take the `tree-` half and never the `plant-` half, because those
    // carried no maker at all. Both halves now belong to the same rule.
    const dead = 999_001;
    const live = process.pid;
    const isAlive = (pid: number) => pid === live;
    const entries = [
      `tree-${dead}-abandoned`,
      `plant-${dead}-abandoned`,
      `tree-${live}-mine`,
      `plant-${live}-mine`,
      "tree-with-no-maker-in-its-name",
      "unrelated-directory",
    ];
    expect(reclaimableCopies(entries, live, isAlive)).toEqual(
      [`plant-${dead}-abandoned`, `plant-${live}-mine`, `tree-${dead}-abandoned`, `tree-${live}-mine`].sort(),
    );
    // The half that was unreachable before this unit, named on its own so the fix is legible.
    expect(reclaimableCopies(entries, live, isAlive)).toContain(`plant-${dead}-abandoned`);
    // A LIVE SIBLING'S COPIES ARE STILL NEVER TAKEN, which is W343's finding and the reason the
    // name carries a pid at all. Two builders run `pnpm verify` at once in this tree.
    const sibling = 999_003;
    const bothAlive = (pid: number) => pid === live || pid === sibling;
    expect(reclaimableCopies([`tree-${sibling}-live`, `plant-${sibling}-live`], live, bothAlive)).toEqual([]);
  });

  it("names a planted root by its maker, so a later run can tell it from a live one", () => {
    expect(copyMaker("plant-4242-xyz")).toBe(4242);
    expect(copyMaker("plant-nopid")).toBe(null);
    expect(ownedByThisRun("plant-4242-xyz", 4242)).toBe(true);
    expect(ownedByThisRun("plant-4242-xyz", 4243)).toBe(false);
    // And the source really makes the name that way, so the rule above is about this tree.
    expect(readFileSync(path.join(ROOT, "src/quality/planting.ts"), "utf8")).toContain(
      "mkdtempSync(path.join(tmpdir(), `plant-${process.pid}-`))",
    );
  });
});

describe("W375 the register says what it is and what it is not", () => {
  it("makes the repository-clean register say what it watches", () => {
    // The gate's third clause. The register that could have caught two gigabytes twice watches the
    // working tree, and until now its bound did not say the temp directory was outside it.
    expect(CLEAN_BOUND).toContain("IT WATCHES THE REPOSITORY AND NOTHING ELSE");
    expect(CLEAN_BOUND).toContain("TEMP directory");
  });

  it("states what a green run does not cover", () => {
    expect(TEMP_RESIDUE_BOUND.length).toBeGreaterThan(600);
    expect(TEMP_RESIDUE_BOUND).toContain("IT READS WHERE A REMOVAL IS WRITTEN, NOT WHETHER ANYTHING IS LEFT");
    expect(TEMP_RESIDUE_BOUND).toContain("THE SWEEP IT DESCRIBES IS NOT DRIVEN HERE");
  });
});

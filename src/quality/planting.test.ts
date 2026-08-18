// W303 verify gate: "`withRoot`, `withPlanted` and the census tree-copy unified behind one API,
// every existing plant still planting, and a probe left behind by an interrupted run made
// impossible rather than cleaned up."
//
// THE LAST CLAUSE IS THE UNIT AND IT IS DRIVEN, not argued. A probe is planted, the probe THROWS,
// and the file must be gone anyway — which is what the two unscoped helpers this unit deleted could
// not do, because their callers removed the file on the line after the assertions and a failing
// assertion never reached it.

import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  COPIED_DIRECTORIES,
  PLANTING_BOUND,
  WRITES_WITHOUT_A_PLANTER,
  copyTree,
  planterDiff,
  withPlantedIn,
  withTree,
} from "./planting";
import { withRoot } from "./refusal-branches";

const ROOT = process.cwd();

describe("W322 a plant cannot land in the repository, because other workers walk it", () => {
  it("refuses a root inside the repository, naming the copy as the fix", () => {
    // THE DEFECT THIS REPLACES was three manifest branch-drivers calling `homeDiff(process.cwd())`.
    // `homeDiff` plants, so driving a branch wrote a probe module into the tree every other test
    // worker was walking; two suites died once each with ENOENT on a path they had never heard of,
    // in runs where every file passed alone. Scoping the cleanup was never going to help — the file
    // exists for as long as the probe runs, and that is the whole window.
    expect(() => withPlantedIn(ROOT, { "src/planted/w322-probe.ts": "export const x = 1;\n" }, () => 1)).toThrow(
      "refuses to plant into the repository",
    );
    expect(() => withPlantedIn(path.join(ROOT, "src"), {}, () => 1)).toThrow("copyTree");
  });

  it("plants nothing, so the refusal is not merely a message", () => {
    // A refusal that threw AFTER writing would leave exactly the residue this is about.
    try {
      withPlantedIn(ROOT, { "src/planted/w322-probe.ts": "export const x = 1;\n" }, () => 1);
    } catch {
      // The throw is the point; what it left behind is what is asserted.
    }
    expect(existsSync(path.join(ROOT, "src/planted")), "the refusal wrote before it refused").toBe(false);
  });

  it("leaves the repository holding no planted directory at all", () => {
    // The residue check, kept live. `withPlantedIn` creates the parent directory it writes into and
    // removes only the file, so a folder here is the fingerprint of a plant that reached the tree —
    // by this harness or by any future one that bypasses it.
    expect(existsSync(path.join(ROOT, "src/planted")), "something planted into the repository").toBe(false);
  });

  it("still plants into a copy, which is the tree the refusal points at", () => {
    const copy = copyTree(ROOT, { directories: ["src"] });
    try {
      const planted = withPlantedIn(copy, { "src/planted/w322-probe.ts": "export const x = 1;\n" }, () =>
        existsSync(path.join(copy, "src/planted/w322-probe.ts")),
      );
      expect(planted, "the refusal caught a copy, which would make every planting suite unrunnable").toBe(true);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });
});

describe("W303 a probe cannot outlive its scope, even when the probe throws", () => {
  it("removes what it planted after a probe that throws", () => {
    // THE GATE'S OWN WORDS, DRIVEN. This is the case the deleted helpers got wrong: ten call sites
    // planted, asserted, and removed on the next line, so one failing assertion left the probe in
    // the copied tree for every later test in that file.
    const copy = copyTree(ROOT, { directories: ["src"] });
    const probe = path.join(copy, "src/quality/w303-probe.ts");
    try {
      expect(() =>
        withPlantedIn(copy, { "src/quality/w303-probe.ts": "export const x = 1;\n" }, () => {
          expect(existsSync(probe), "the plant did not happen, so the cleanup proves nothing").toBe(true);
          throw new Error("the probe failed, as a failing assertion does");
        }),
      ).toThrow("the probe failed");
      expect(existsSync(probe), "a failing probe left its plant behind").toBe(false);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });

  it("removes a constructed root after a probe that throws", () => {
    let seen = "";
    expect(() =>
      withTree({ "src/x.ts": "export const x = 1;\n" }, (root) => {
        seen = root;
        expect(existsSync(path.join(root, "src/x.ts"))).toBe(true);
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(seen).not.toBe("");
    expect(existsSync(seen), "a failing probe left its whole tree behind").toBe(false);
  });

  it("removes only what it planted, leaving the tree it planted into", () => {
    // The other direction: a cleanup that removed the copy would take the suite's shared tree with
    // it, and every later test in the file would read an empty directory.
    const copy = copyTree(ROOT, { directories: ["src"] });
    try {
      withPlantedIn(copy, { "src/quality/w303-probe.ts": "export const x = 1;\n" }, () => undefined);
      expect(existsSync(path.join(copy, "src/quality/planting.ts")), "the copy was deleted").toBe(true);
      expect(existsSync(path.join(copy, "src/quality/w303-probe.ts"))).toBe(false);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });

  it("plants more than one file, and removes all of them", () => {
    const copy = copyTree(ROOT, { directories: ["src"] });
    try {
      withPlantedIn(
        copy,
        { "src/a.ts": "export const a = 1;\n", "src/nested/b.ts": "export const b = 2;\n" },
        () => {
          expect(existsSync(path.join(copy, "src/a.ts"))).toBe(true);
          expect(existsSync(path.join(copy, "src/nested/b.ts"))).toBe(true);
        },
      );
      expect(existsSync(path.join(copy, "src/a.ts"))).toBe(false);
      expect(existsSync(path.join(copy, "src/nested/b.ts"))).toBe(false);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });
});

describe("W303 one API, and the old names still name it", () => {
  it("hands `withRoot` back to its twenty-six callers, unchanged", () => {
    // W291's harness moved rather than being reimplemented, so the callers did not have to be
    // touched — and the re-export is checked to be the same function rather than a lookalike.
    expect(withRoot).toBe(withTree);
  });

  it("copies the directories the tree-reading registers need", () => {
    // Seven suites hand-rolled this list; four of them omitted `scripts/`, which W267's census
    // walks — a copy missing it reports a different census than the tree does, and W296 hit
    // exactly that as a red baseline before the omission was found.
    expect([...COPIED_DIRECTORIES]).toContain("scripts");
    expect([...COPIED_DIRECTORIES]).toContain("src");
    const copy = copyTree(ROOT);
    try {
      for (const dir of COPIED_DIRECTORIES) {
        expect(existsSync(path.join(copy, dir)), `${dir} was not copied`).toBe(true);
      }
      expect(existsSync(path.join(copy, "BUILD-STATE.md")), "the ledger four registers read").toBe(true);
      // And it is a COPY: editing it cannot reach the repository.
      expect(copy.startsWith(ROOT)).toBe(false);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });

  it("survives a tree that is missing a directory, rather than failing to copy at all", () => {
    const bare = withTree({ "src/x.ts": "export const x = 1;\n" }, (root) => copyTree(root));
    try {
      expect(existsSync(path.join(bare, "src/x.ts"))).toBe(true);
      expect(existsSync(path.join(bare, "e2e"))).toBe(false);
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });
});

describe("W303 a fifth harness cannot arrive quietly", () => {
  it("finds every writing test file declared or going through a planter", () => {
    expect(planterDiff(ROOT)).toEqual({ undeclared: [], stale: [] });
  });

  it("argues each declared writer, and each really does write", () => {
    expect(Object.keys(WRITES_WITHOUT_A_PLANTER).length).toBeGreaterThan(4);
    for (const [file, why] of Object.entries(WRITES_WITHOUT_A_PLANTER)) {
      expect(why.length, `${file} is exempted without a reason`).toBeGreaterThan(80);
      expect(readFileSync(path.join(ROOT, file), "utf8"), `${file} no longer writes`).toMatch(
        /\bwriteFileSync\s*\(/,
      );
    }
  });

  it("reports a writer that neither imports a planter nor is declared", () => {
    const diff = planterDiff(ROOT, {});
    expect(diff.undeclared.length).toBeGreaterThan(4);
    expect(diff.undeclared).toContain("src/quality/mutation-sampling.test.ts");
  });

  it("reports a declaration for a file that no longer writes", () => {
    expect(planterDiff(ROOT, { "src/quality/pins.test.ts": "gone" }).stale).toEqual([
      "src/quality/pins.test.ts",
    ]);
  });

  it("counts a non-test module that writes, which W328 corrected", () => {
    // W303 EXCLUDED THESE ON PURPOSE and the bound said so: *a helper in a non-test module is
    // invisible to it*. Then W322's leak came from `declaration-tax.ts`, driven by `manifest.ts` —
    // two register modules — so the excluded class was the class the defect lived in. The sweep is
    // over every module now, and the writers that are not plants are declared with their reason.
    const undeclared = planterDiff(ROOT, {}).undeclared;
    expect(undeclared, "a non-test module that writes is out of the population again").toContain(
      "src/quality/planting.ts",
    );
    expect(planterDiff(ROOT).undeclared, "the declared writers are not accepted").toEqual([]);
  });

  it("does not count a file that goes through the harness, however it names it", () => {
    // A file that plants only through `withPlantedIn` never calls `writeFileSync` itself, so it is
    // out of the population by construction rather than by an exemption. That is the whole reason
    // W328 could delete the exemption: it was doing no work that the population did not already do.
    const undeclared = planterDiff(ROOT, {}).undeclared;
    for (const migrated of ["src/quality/pins.test.ts", "src/quality/register-census.test.ts"]) {
      expect(undeclared, `${migrated} plants outside the harness again`).not.toContain(migrated);
    }
  });

  it("counts a file that imports the harness AND writes on its own, which the exemption hid", () => {
    // THE DEFECT THE EXEMPTION CARRIED, driven. It passed a file for one line of it — the import —
    // and said nothing about the writes that do not go through what was imported. This unit gave
    // `mutation-sampling.test.ts` a `copyTree` import, and its declared raw write left the
    // population on the spot: a declaration going stale because the file it describes got quieter.
    const both = withTree(
      {
        "src/quality/importer.ts": [
          'import { writeFileSync } from "node:fs";',
          'import { withTree } from "./planting";',
          'export const w = () => { withTree({}, () => 0); writeFileSync("x", "y"); };',
        ].join("\n"),
      },
      (root) => planterDiff(root, {}).undeclared,
    );
    expect(both, "importing the planter still launders a raw write").toContain("src/quality/importer.ts");
  });

  it("says what the sweep cannot see", () => {
    expect(PLANTING_BOUND).toMatch(/appendFileSync|fs\/promises/);
    expect(PLANTING_BOUND).toMatch(/W267/);
  });
});

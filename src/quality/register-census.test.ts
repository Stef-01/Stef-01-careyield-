// W267 verify gate: "each named register is proved to notice, by a mutation in this unit's own
// test that moves the tree under it and asserts the register fails."
//
// MOVING THE TREE MEANS MOVING A TREE. `src/` and `app/` are copied into a temporary directory,
// a file is added to the copy, and the detector is pointed at it. Nothing is written into the
// repository — which matters more than tidiness here, because half this tree's registers scan for
// exactly the kind of file these probes are, and a probe left behind would fail four other suites
// while looking like a real defect.
//
// The six below are the ones whose detectors take a root. The others cannot be given a
// second tree at all, and `walkUnproven` is where that is recorded with the one-line change that
// would fix each — see the module note for why that is a structural fact rather than an oversight.

import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  TREE_DERIVED_REGISTERS,
  censusDiff,
  treeWalkingFiles,
  walkProven,
  walkUnproven,
} from "./register-census";
import { discoverSurfaces, diffCensus, parseCensus } from "@/compliance/surfaces";
import { diffFoldRegister, discoverFoldSites } from "./order-independence";
import {
  INSTRUCTION_SINK_MARKERS,
  findInstructionSinks,
  undeclaredInstructionSinks,
} from "@/security/instruction-sinks";
import { reachableFromApp, stripComments } from "@/security/reachability";
import { copySurfaceMembers } from "@/compliance/copy-y6";
import { DORMANT_MODULES, diffReach } from "@/security/page-reach";
import { readFileSync } from "node:fs";

const ROOT = process.cwd();

/** A copy of the tree that probes can be planted into. Built once; each probe cleans up after itself. */
let COPY = "";

beforeAll(() => {
  COPY = mkdtempSync(path.join(tmpdir(), "w267-"));
  cpSync(path.join(ROOT, "src"), path.join(COPY, "src"), { recursive: true });
  cpSync(path.join(ROOT, "app"), path.join(COPY, "app"), { recursive: true });
});

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

/** Plant a file into the copy, run the probe, remove it. The copy returns to the tree's own shape. */
function withPlanted<T>(relPath: string, contents: string, probe: () => T): T {
  const full = path.join(COPY, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, contents, "utf8");
  try {
    return probe();
  } finally {
    rmSync(full, { force: true });
  }
}

describe("W267 the census describes the tree, in both directions", () => {
  it("finds the walkers at all", () => {
    const found = treeWalkingFiles(ROOT);
    expect(found.length).toBeGreaterThan(20);
  });

  it("does not count a walk that is only named in a comment", () => {
    // W173'S GUARD, AND THE FIRST VERSION OF IT WAS VACUOUS — worth recording, because the unit
    // is about exactly this. It asserted that `stripComments` removes comments, which is a fact
    // about `stripComments`. Deleting the call from `treeWalkingFiles` altogether left the whole
    // file green, because no module in this tree happens to name the walk in a comment only. The
    // assertion tested the stripper; nothing tested that the DETECTOR uses it.
    //
    // So it is a planted file now. Same distinction the unit exists to draw, found in its own
    // test by the mutation discipline it was written to apply to everything else.
    const call = ["readdir", "Sync("].join("");
    const planted = "src/w267-probe-comment-only.ts";
    const found = withPlanted(
      planted,
      `// This module explains ${call}"src") and never calls one.\nexport const value = 1;\n`,
      () => treeWalkingFiles(COPY),
    );
    expect(found, "a walk named in prose was counted as a walk").not.toContain(planted);
    // And the file really did contain the phrase, so the probe is not passing on a typo.
    const withCode = withPlanted(
      planted,
      `import { ${["readdir", "Sync"].join("")} } from "node:fs";\nexport const value = () => ${call}"src");\n`,
      () => treeWalkingFiles(COPY),
    );
    expect(withCode, "the same file in CODE is not counted either, so the probe proves nothing").toContain(
      planted,
    );
  });

  it("scans app/ and scripts/, not only src/", () => {
    // Also found by mutation: narrowing the roots to `["src"]` changed no answer, because nothing
    // outside `src/` walks the tree today. A default nobody can observe is a default that quietly
    // stops being true, so a probe is planted outside `src/`.
    const planted = "app/w267-probe-app-walker.ts";
    const found = withPlanted(
      planted,
      `import { ${["readdir", "Sync"].join("")} } from "node:fs";\nexport const entries = () => ${["readdir", "Sync("].join("")}"app");\n`,
      () => treeWalkingFiles(COPY),
    );
    expect(found, "a tree walker outside src/ is invisible to the census").toContain(planted);
  });

  it("declares every walker and no file that has stopped walking", () => {
    const diff = censusDiff(treeWalkingFiles(ROOT));
    expect(diff.undeclared, "a file walks the tree and no register knows").toEqual([]);
    expect(diff.stale, "a declared walker no longer walks").toEqual([]);
    expect(new Set(TREE_DERIVED_REGISTERS.map((r) => r.file)).size).toBe(TREE_DERIVED_REGISTERS.length);
  });

  it("is subject to itself", () => {
    // A register of registers that exempted itself would be answering its own question — W201's
    // rule about the one exclusion it allows, and states.
    expect(treeWalkingFiles(ROOT)).toContain("src/quality/register-census.ts");
  });

  it("says what each derives, what it checks, and how it is proved", () => {
    for (const entry of TREE_DERIVED_REGISTERS) {
      expect(entry.derives.length, `${entry.file} says nothing about what it derives`).toBeGreaterThan(30);
      expect(entry.checkedAgainst.length, `${entry.file} names nothing it checks against`).toBeGreaterThan(20);
      if (entry.proof.kind === "mutated_tree") {
        expect(entry.proof.mutation.length, `${entry.file} names no mutation`).toBeGreaterThan(40);
      } else {
        expect(entry.proof.remedy.length, `${entry.file} records no remedy`).toBeGreaterThan(60);
      }
    }
  });

  it("cites content proofs that exist, by name", () => {
    // W258's rule: a citation nobody resolved reads as coverage. Both halves — the file, and the
    // `it(...)` name after the `::`.
    const cited = TREE_DERIVED_REGISTERS.filter(
      (r) => r.proof.kind === "walk_unproven" && r.proof.contentProof,
    );
    expect(cited.length, "no content proof is cited, so this checks nothing").toBeGreaterThan(5);
    for (const entry of cited) {
      const proof = entry.proof as { contentProof: string };
      const [file, assertion] = proof.contentProof.split(" :: ");
      expect(
        readFileSync(path.join(ROOT, file!), "utf8"),
        `${proof.contentProof} names an assertion that does not exist`,
      ).toContain(assertion!);
    }
  });
});

describe("W267 the finding: a proved content scanner is not a proved walk", () => {
  it("records that most walks have never seen a file arrive", () => {
    // THE UNIT. Each of these files exists to catch one event — a file arriving in the tree that
    // nobody declared — and has never been shown a file arriving. Several prove their CONTENT
    // scanner rigorously, which is the distinction that hid this: a scanner that fires perfectly
    // over a file list missing the new file reports nothing, cleanly, forever.
    const unproven = walkUnproven();
    expect(unproven.length).toBeGreaterThan(15);
    expect(walkProven().length).toBe(7);
    expect(unproven.length + walkProven().length).toBe(TREE_DERIVED_REGISTERS.length);
    // And the harsh reading is not the fair one, so the census carries both facts.
    const withContentProof = unproven.filter(
      (r) => (r.proof as { contentProof: string | null }).contentProof !== null,
    );
    expect(withContentProof.length, "the census flattens careful work into 'unproven'").toBeGreaterThan(5);
  });

  it("gives every unproven walk a remedy rather than a shrug", () => {
    // W210's lesson: a finding recorded without the condition that would make it actionable sits
    // for two years. Every entry names the change that makes its walk provable.
    for (const entry of walkUnproven()) {
      const proof = entry.proof as { remedy: string };
      expect(proof.remedy, `${entry.file} records no remedy`).toMatch(/root|parameter/);
    }
  });
});

describe("W267 the detectors that take a root, proved by moving the tree", () => {
  it("W102's route census notices a page that was not there", () => {
    const before = discoverSurfaces(path.join(COPY, "app")).map((s) => s.path);
    const after = withPlanted(
      "app/w267-probe/page.tsx",
      "export default function Probe() {\n  return null;\n}\n",
      () => discoverSurfaces(path.join(COPY, "app")).map((s) => s.path),
    );
    expect(before, "the probe route already existed").not.toContain("/w267-probe");
    expect(after, "the route census did not see a new page").toContain("/w267-probe");
    const census = parseCensus(readFileSync(path.join(ROOT, "docs/COMPLIANCE-DOSSIER.md"), "utf8"));
    expect(
      diffCensus(after.map((p) => ({ path: p, kind: "page" as const, file: "" })), census).unmapped,
      "the diff did not report the new route as unmapped",
    ).toContain("/w267-probe");
  });

  it("W271's route reach notices a page that reaches a dormant module", () => {
    // Planted rather than described: the route is new AND it imports something no route may
    // reach, so one probe drives both halves of W271's diff.
    const dormant = DORMANT_MODULES[0]!.module;
    const specifier = `@/${dormant.replace(/^src\//, "").replace(/\.ts$/, "")}`;
    const before = diffReach(COPY);
    expect(before.unclassified, "the probe route already existed").toEqual([]);
    expect(before.wokenDormant, "a route already reaches a dormant module").toEqual([]);
    const after = withPlanted(
      "app/w271-probe/page.tsx",
      `import * as dormant from "${specifier}";\n\nexport default function Probe() {\n  void dormant;\n  return null;\n}\n`,
      () => diffReach(COPY),
    );
    expect(after.unclassified, "the reach register did not see a new route").toContain("/w271-probe");
    expect(
      after.wokenDormant.map((w) => w.module),
      "the reach register did not see the dormant module being reached",
    ).toContain(dormant);
  });

  it("W167's fold register notices a module that folds", () => {
    const planted = "src/w267-probe-fold.ts";
    const found = withPlanted(
      planted,
      "export function total(xs: number[]): number {\n  return xs.reduce((a, b) => a + b, 0);\n}\n",
      () => discoverFoldSites(COPY),
    );
    expect(found.map((f) => f.module), "the fold walk did not see a new folding module").toContain(planted);
    expect(
      diffFoldRegister(found).undeclared,
      "the fold register did not report the new module",
    ).toContain(planted);
    // And it is gone again, so the copy is the tree's own shape for the next probe.
    expect(discoverFoldSites(COPY).map((f) => f.module)).not.toContain(planted);
  });

  it("W153's instruction-sink scanner notices a file naming a model endpoint", () => {
    // The marker is taken from the register rather than written here: W153 assembles its markers
    // from fragments precisely so this file does not become a hit itself.
    const marker = INSTRUCTION_SINK_MARKERS[0]!;
    const planted = "src/w267-probe-sink.ts";
    const hits = withPlanted(planted, `export const url = ${JSON.stringify(marker)};\n`, () =>
      findInstructionSinks(COPY, ["src", "app"]),
    );
    expect(hits.map((h) => h.file), "the sink walk did not see the planted file").toContain(planted);
    expect(
      undeclaredInstructionSinks(hits).map((h) => h.file),
      "the sink register did not report it undeclared",
    ).toContain(planted);
  });

  it("W107's reachability walk notices a page reaching a new module", () => {
    const target = "src/w267-probe-reached.ts";
    const before = new Set(reachableFromApp(COPY).files);
    expect(before, "the probe target was already reachable").not.toContain(target);
    const after = withPlanted(target, "export const value = 1;\n", () =>
      withPlanted(
        "app/w267-probe-page/page.tsx",
        'import { value } from "@/w267-probe-reached";\n\nexport default function Probe() {\n  return value;\n}\n',
        () => new Set(reachableFromApp(COPY).files),
      ),
    );
    expect(after, "reachability did not follow the new page's import").toContain(target);
  });

  it("W200's copy surface notices a module the register must cover", () => {
    // W270 moved this walk out of a test file and into a module with a root, which is the remedy
    // this census recorded for it — so it is provable now, and proved here rather than promised.
    const planted = "src/w267-probe-y6-module.ts";
    const members = withPlanted(
      planted,
      "// W999: a probe module with a unit header the copy surface must cover.\nexport const value = 1;\n",
      () => copySurfaceMembers(COPY),
    );
    expect(members, "the copy surface did not see a new module above the floor").toContain(planted);
    expect(copySurfaceMembers(COPY), "the probe survived the probe").not.toContain(planted);
  });

  it("this census notices a new tree-walking file", () => {
    // FOURTEENTH INSTANCE OF THE RECURRING COLLISION, arriving as a whole FILE rather than a
    // sentence: a probe for "a file that walks the tree" has to contain a tree walk, so writing it
    // literally made this test file a hit in its own census. W153's remedy rather than an
    // exemption — the call is assembled from fragments, so the file genuinely does not contain one.
    const walkCall = ["readdir", "Sync("].join("");
    const planted = "src/w267-probe-walker.ts";
    const found = withPlanted(
      planted,
      `import { ${["readdir", "Sync"].join("")} } from "node:fs";\n\nexport const entries = () => ${walkCall}"src");\n`,
      () => treeWalkingFiles(COPY),
    );
    expect(found, "the census did not see a new walker").toContain(planted);
    expect(censusDiff(found).undeclared, "the census did not report it undeclared").toContain(planted);
  });

  it("leaves nothing behind in the copy or the tree", () => {
    // Every probe cleans up in a `finally`, and the tree is never written to at all. Checked,
    // because a probe left behind fails four other suites while looking like a real defect.
    expect(treeWalkingFiles(COPY)).toEqual(treeWalkingFiles(ROOT));
    expect(treeWalkingFiles(ROOT).some((f) => f.includes("w267-probe"))).toBe(false);
  });
});

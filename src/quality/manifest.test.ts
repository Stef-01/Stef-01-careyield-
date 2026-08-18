// W305 verify gate: "a single per-module declaration from which the copy surface, the census, the
// drives and the blind spots are derived; the six registers agree with it in both directions, and a
// module declared once is watched by all of them."
//
// THE LAST CLAUSE CANNOT BE DRIVEN AGAINST THE REAL MANIFEST, and noticing that is most of the
// work. Every module in this tree is already declared, so "declared once, watched by all" is true
// of the real manifest the way "no counterexample" is true of an empty set. The derivations take
// their entries as an argument for exactly this reason — W289's remedy, applied to a register whose
// whole content is a list — so the clause is driven on ONE CONSTRUCTED ROW no register has seen.
//
// AND THE GATE NAMED FOUR THINGS TO DERIVE, OF WHICH THIS DERIVES THREE. The blind spots were
// folded in, the fold moved a walk out of `blind-spots.ts`, and four rows of that register's
// coverage fell over behind it. It was reverted rather than shipped, and the reason is a test
// below rather than a sentence in a commit message.

import { describe, expect, it } from "vitest";
import {
  MANIFEST,
  MANIFEST_BOUND,
  type ModuleEntry,
  REFUSAL_BRANCHES,
  TREE_DERIVED_REGISTERS,
  deriveBranches,
  deriveCensus,
  manifestDiff,
} from "./manifest";
import { BLIND_SPOTS } from "./blind-spots";
import { withTree } from "./planting";
import { STATED_BOUNDS } from "./bounds";
import { PINS } from "./pins";

const ROOT = process.cwd();

/** One row nothing in this tree has ever declared, carrying both halves. */
const CONSTRUCTED: ModuleEntry = {
  module: "src/planted/newcomer.ts",
  census: {
    derives: "a constructed walk",
    checkedAgainst: "a constructed register",
    proof: { kind: "mutated_tree", mutation: "a constructed mutation" },
    assertion: {
      kind: "driven_here",
      claim: "a constructed claim",
      mutation: "a constructed assertion mutation",
    },
  },
  branches: [{ fn: "plantedDiff", branch: "undeclared", reach: { kind: "driven", drive: () => true } }],
};

describe("W305 one row, and every register derived from it sees it", () => {
  it("watches a module declared ONCE in every derivation", () => {
    // THE GATE'S LAST CLAUSE. One row, and it has to turn up in each register derived from it —
    // the whole claim the manifest makes, and the one a complete tree cannot demonstrate.
    const entries = [CONSTRUCTED];
    expect(deriveCensus(entries).map((c) => c.file)).toEqual(["src/planted/newcomer.ts"]);
    expect(deriveBranches(entries).map((b) => b.module)).toEqual(["src/planted/newcomer.ts"]);
  });

  it("carries the row's content through, not just its name", () => {
    // A derivation that produced the right KEYS and dropped the content would pass the test above.
    const [census] = deriveCensus([CONSTRUCTED]);
    expect(census!.derives).toBe("a constructed walk");
    expect(census!.checkedAgainst).toBe("a constructed register");
    expect(deriveBranches([CONSTRUCTED])[0]!.branch).toBe("undeclared");
  });

  it("lets a module declare nothing but itself, and derives nothing from it", () => {
    // The negative. `census: null` is a claim, and a derivation that invented an entry for it would
    // make the census disagree with the tree in the direction nobody checks.
    const bare: ModuleEntry = { module: "src/planted/bare.ts", census: null, branches: [] };
    expect(deriveCensus([bare])).toEqual([]);
    expect(deriveBranches([bare])).toEqual([]);
  });

  it("declares each module once and only once", () => {
    // The property the whole unit is named for, and the one thing the merge could have broken:
    // three lists keyed by module became one list OF modules, so a duplicated key is now a
    // duplicated module rather than a module with two entries.
    const seen = MANIFEST.map((e) => e.module);
    expect(seen.length, "a module is declared twice").toBe(new Set(seen).size);
  });
});

describe("W305 the derived registers are the registers", () => {
  it("is what the census and the branches actually are", () => {
    // Not an equality between two lists — an identity. `TREE_DERIVED_REGISTERS` IS `deriveCensus()`,
    // which is why no both-directions diff is written for the two: there are no two things.
    expect(TREE_DERIVED_REGISTERS).toEqual(deriveCensus());
    expect(REFUSAL_BRANCHES).toEqual(deriveBranches());
    expect(TREE_DERIVED_REGISTERS.length + REFUSAL_BRANCHES.length).toBeGreaterThan(0);
  });

  it("declares a row for every module that owns a blind spot, which stayed where it was", () => {
    // THE FOURTH DERIVATION THE GATE ASKED FOR, AND THE ONE THIS UNIT DID NOT DO. A blind spot is
    // not data: each is a `probe` that plants a tree and runs another register's detector, so
    // moving them here moved a WALK — `treeWalkingFiles` stopped seeing `blind-spots.ts` on the
    // first run afterwards, its census entry went stale, and its negative probe and its drive went
    // with it. Folding in a register cost that register four rows of coverage, so the fold was
    // reverted and the reason written down. What holds instead is the pairing: every module with a
    // blind spot is a module this manifest has heard of.
    const declared = new Set(MANIFEST.map((e) => e.module));
    expect(Object.keys(BLIND_SPOTS).filter((m) => !declared.has(m))).toEqual([]);
    expect(Object.keys(BLIND_SPOTS).length).toBeGreaterThan(0);
  });

  it("re-exports the same objects from the modules that used to own them", async () => {
    // The three registers now say `export { X } from "./manifest"`. A lookalike re-declared in the
    // old file would satisfy every consumer and quietly restore the second declaration point, so
    // the identity is asserted rather than the shape.
    const [census, branches] = await Promise.all([
      import("./register-census"),
      import("./refusal-branches"),
    ]);
    expect(census.TREE_DERIVED_REGISTERS).toBe(TREE_DERIVED_REGISTERS);
    expect(branches.REFUSAL_BRANCHES).toBe(REFUSAL_BRANCHES);
  });
});

describe("W305 the registers that kept their own lists agree with it, both directions", () => {
  it("knows every module this tree watches, and names none that has gone", () => {
    expect(manifestDiff(ROOT)).toEqual({ unknown: [], stale: [] });
  });

  it("reports a watched module with no row", () => {
    // Driven from outside on an EMPTY manifest, because the real one is complete — the arm is
    // unreachable against a healthy tree, which is the reason to hand it a sick one.
    expect(manifestDiff(ROOT, []).unknown.length).toBeGreaterThan(0);
  });

  it("reports a row naming a module that is not there", () => {
    const gone: ModuleEntry = { module: "src/gone.ts", census: null, branches: [] };
    expect(manifestDiff(ROOT, [...MANIFEST, gone]).stale).toEqual(["src/gone.ts"]);
  });

  it("reports a module for each way of being watched, one plant per way", () => {
    // FOUR SOURCES FEED THE WATCHED SET AND THREE OF THEM WERE UNDRIVEN. Deleting the pin source,
    // the reporter source or the walker source changed nothing measurable, because against the real
    // tree the same modules arrive through more than one of them — so a source could be dropped and
    // the register would stay green while quietly seeing less. Each is planted ALONE in a tree
    // holding nothing else, which is the only arrangement where the sources cannot cover for
    // each other.
    const only = (file: string, body: string) => withTree({ [file]: body }, (root) => manifestDiff(root, []).unknown);
    expect(only("src/planted/bound.ts", '// W305: a plant.\nexport const PLANTED_BOUND =\n  "a sentence";\n')).toEqual([
      "src/planted/bound.ts",
    ]);
    expect(only("src/planted/pin.ts", "// W305: a plant.\nexport const PLANTED_AT_W305 = 3;\n")).toEqual([
      "src/planted/pin.ts",
    ]);
    expect(
      only(
        "src/planted/reporter.ts",
        "// W305: a plant.\nexport function planted" + "Diff(x: readonly string[]): string[] {\n  return [...x];\n}\n",
      ),
    ).toEqual(["src/planted/reporter.ts"]);
    expect(
      only(
        "src/planted/walker.ts",
        '// W305: a plant.\nimport { readdirSync } from "node:fs";\nexport const walk = () => readdirSync("src");\n',
      ),
    ).toEqual(["src/planted/walker.ts"]);
  });

  it("reports a planted module that states a bound and has no row", () => {
    // The gate's "both directions" on a tree that differs from this one, so the arm is proved by a
    // module arriving rather than by a declaration being deleted.
    const planted = withTree(
      {
        "src/planted/newbound.ts":
          '// W305: a planted module stating a bound.\nexport const PLANTED_BOUND =\n  "a sentence about what this does not prove";\n',
      },
      (root) => manifestDiff(root, []).unknown,
    );
    expect(planted).toContain("src/planted/newbound.ts");
  });

  it("covers every module that states a bound or pins a constant", () => {
    // `STATED_BOUNDS` and `PINS` deliberately keep their own lists — a module states several bounds
    // and pins several constants, so neither is a per-module fact. What must hold is that the
    // manifest has heard of every module they name.
    const declared = new Set(MANIFEST.map((e) => e.module));
    const inScope = (m: string) => !m.endsWith(".test.ts");
    expect(STATED_BOUNDS.map((b) => b.module).filter(inScope).filter((m) => !declared.has(m))).toEqual([]);
    expect(PINS.map((p) => p.module).filter(inScope).filter((m) => !declared.has(m))).toEqual([]);
    expect(STATED_BOUNDS.length + PINS.length).toBeGreaterThan(0);
  });

  it("names the test files it lets through, rather than filtering them quietly", () => {
    // The narrowing above is a filter, and a filter in a test is an exemption. W293's lesson: an
    // exemption nobody can see is one nobody re-reads, so the files it covers are NAMED and the
    // list has to stay true — a test file that stops pinning falls out of `PINS` and fails here.
    const pinningTests = [...new Set(PINS.map((p) => p.module).filter((m) => m.endsWith(".test.ts")))].sort();
    expect(pinningTests).toEqual([
      "src/quality/gate-dossier-y5.test.ts",
      "src/quality/horizon-q22.test.ts",
      "src/quality/horizon-q23.test.ts",
      "src/quality/horizon-q24.test.ts",
      "src/quality/horizon-q25.test.ts",
      "src/quality/horizon-q26.test.ts",
      "src/quality/horizon-y6.test.ts",
    ]);
  });
});

describe("W305 what it does not claim", () => {
  it("says the tax is not flat and the other two lists are still separate", () => {
    expect(MANIFEST_BOUND).toMatch(/STATED_BOUNDS/);
    expect(MANIFEST_BOUND).toMatch(/W308/);
    expect(MANIFEST_BOUND, "the bound claims the tax is gone").toMatch(/still declared/);
  });
});

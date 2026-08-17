// W300 verify gate: "the register-declaration sites derived from the tree rather than listed, a
// planted module run through every one of them, and the count of places it must be declared
// recorded as a constant this quarter is measured against."
//
// DERIVED RATHER THAN LISTED IS THE FIRST CLAUSE AND THE ONE A HAND-COUNT FAILS. The population of
// probes is checked against W267's census — every `mutated_tree` entry living in a non-test module
// must have one, and a probe for a register the census does not have fails. The exclusion of
// `.test.ts` registers is W289's finding rather than a convenience, and `namingSites` measures the
// half a plant cannot reach.
//
// A PLANTED MODULE RUN THROUGH EVERY ONE OF THEM is the second, and it is run in a COPY of the
// tree — W267's harness and its reason: half this tree's registers scan for exactly the kind of
// file a probe is, so a probe left behind by an interrupted run fails four other suites while
// looking like a real defect.

import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DEMANDS,
  type ModuleShape,
  SHAPE_BODIES,
  TAX_AT_W300,
  TAX_BOUND,
  demandingRegisters,
  namingSites,
} from "./declaration-tax";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { withRoot } from "./refusal-branches";

const ROOT = process.cwd();
const PLANTED = "src/planted/w300-probe.ts";

/** A copy of the tree probes can be planted into. Built once; each probe cleans up after itself. */
let COPY = "";

beforeAll(() => {
  COPY = mkdtempSync(path.join(tmpdir(), "w300-"));
  cpSync(path.join(ROOT, "src"), path.join(COPY, "src"), { recursive: true });
  cpSync(path.join(ROOT, "app"), path.join(COPY, "app"), { recursive: true });
  cpSync(path.join(ROOT, "BUILD-STATE.md"), path.join(COPY, "BUILD-STATE.md"));
});

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

/** Plant one shape, measure, remove. The copy returns to the tree's own shape between probes. */
function withShape<T>(shape: ModuleShape, probe: () => T): T {
  const full = path.join(COPY, PLANTED);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, SHAPE_BODIES[shape], "utf8");
  try {
    return probe();
  } finally {
    rmSync(full, { force: true });
  }
}

describe("W300 the declaration sites are derived from the census, not listed", () => {
  it("probes every plantable register and no register the census does not have", () => {
    const plantable = TREE_DERIVED_REGISTERS.filter(
      (r) => r.proof.kind === "mutated_tree" && !r.file.endsWith(".test.ts"),
    ).map((r) => r.file);
    const probed = DEMANDS.map((d) => d.file);
    expect([...plantable].sort(), "a plantable register has no probe").toEqual([...probed].sort());
    expect(new Set(probed).size, "two probes for one register").toBe(probed.length);
    expect(probed.length).toBeGreaterThan(15);
  });

  it("says why a test-file register is outside the plant, rather than dropping it quietly", () => {
    // The exclusion is W289's finding: a detector welded inside a `.test.ts` exports nothing, so no
    // plant from outside can reach it. It is measured by `namingSites` instead, and the bound says
    // so — the alternative is a population that looks complete and is not.
    const excluded = TREE_DERIVED_REGISTERS.filter(
      (r) => r.proof.kind === "mutated_tree" && r.file.endsWith(".test.ts"),
    );
    expect(excluded.length, "no test-file register exists, so this excludes nothing").toBeGreaterThan(3);
    expect(TAX_BOUND).toContain("comparison lives inside a `.test.ts`");
  });
});

describe("W300 a planted module is run through every one of them", () => {
  it("costs what the baseline says, shape by shape", () => {
    // THE MEASUREMENT. Each shape is planted into a copy of the real tree and every probe is run.
    for (const [shape, expected] of Object.entries(TAX_AT_W300) as [ModuleShape, number][]) {
      const demanding = withShape(shape, () => demandingRegisters(COPY, PLANTED));
      expect(demanding, `${shape} costs ${demanding.length}, not ${expected}`).toHaveLength(expected);
    }
  });

  it("costs nothing when nothing is planted, so the numbers are the plant's", () => {
    // Non-vacuity, and the shape W295 had to learn: silence proves the measurement only if the
    // detectors were running. A clean tree must demand nothing, and the same probes on a planted
    // one must demand something.
    expect(demandingRegisters(COPY, PLANTED), "the copied tree was dirty before the plant").toEqual([]);
    expect(withShape("a_full_register", () => demandingRegisters(COPY, PLANTED)).length).toBeGreaterThan(0);
  });

  it("shows the tax is not flat, which the hand-count could not", () => {
    // The finding, and it corrects the quarter's own premise. `HORIZON-Q24.md` says adding a module
    // costs six declarations; measured, six is the cost of a module shaped like a REGISTER, and an
    // ordinary one costs a single plantable demand plus the namespace loader no plant can reach.
    // The modules that pay most are the registers themselves, which is why the number grew in the
    // quarter that added twelve of them.
    const plain = withShape("plain", () => demandingRegisters(COPY, PLANTED));
    const register = withShape("a_full_register", () => demandingRegisters(COPY, PLANTED));
    expect(register.length).toBeGreaterThan(plain.length);
    // Every register that demands a plain module demands the full one too: the cost accumulates
    // rather than trading off, which is what makes it a tax rather than a choice.
    expect(plain.every((f) => register.includes(f)), "a shape escaped a demand by being bigger").toBe(true);
  });

  it("names the cascade: a census entry is itself a declaration site", () => {
    // W267's entry is not the end of it. A module that walks earns a census entry, and every census
    // entry must then state a bound, carry an assertion proof and carry a negative probe — three
    // more places, downstream of the declaration rather than of the module.
    const walking = withShape("walks_the_tree", () => demandingRegisters(COPY, PLANTED));
    expect(walking).toContain("src/quality/register-census.ts");
    expect(walking, "the census entry's own downstream site is not counted").toContain(
      "src/quality/blind-spots.ts",
    );
  });
});

describe("W300 the sites an author opens are measured beside the ones a plant reaches", () => {
  it("finds the files that name a real module, and W200's loader is one of them", () => {
    // `namingSites` reaches what the plant cannot: the namespace loader is a `const` inside
    // `cdss-boundary.test.ts`, it fails the build the day a module arrives, and no detector call
    // from outside can be made to say so.
    const sites = namingSites(ROOT, "src/quality/bounds.ts");
    expect(sites.length, "nothing names a module this tree declares six ways").toBeGreaterThan(3);
    expect(sites).toContain("src/compliance/cdss-boundary.test.ts");
    expect(sites).toContain("src/compliance/cdss-boundary.ts");
  });

  it("subtracts comments, or a module discussed in prose reads as a module declared", () => {
    // This tree's notes cite each other's paths constantly — the collision every scan here has had
    // to handle, and inflating the quarter's own baseline with it would be the worst place for it.
    //
    // DRIVEN ON A CONSTRUCTED ROOT rather than against the real tree: the first draft asserted that
    // `register-census.ts` does not name this module, which was true until this unit earned a
    // census entry an hour later — a real declaration, correctly counted, breaking an assertion
    // that had meant to be about prose. Planted positive and planted negative say it directly.
    const target = "src/target/module.ts";
    const sites = withRoot(
      {
        "src/target/module.ts": "export const X = 1;\n",
        "src/talks/about-it.ts": `// A note mentioning ${target} and nothing else.\nexport const Y = 2;\n`,
        "src/declares/it.ts": `export const DECLARED = ["${target}"];\n`,
      },
      (root) => namingSites(root, target),
    );
    expect(sites, "a module named only in prose was counted as a declaration").toEqual([
      "src/declares/it.ts",
    ]);
  });

  it("reports nothing for a module nobody names", () => {
    // THE PATH IS BUILT RATHER THAN WRITTEN, and the first draft was not: a probe naming
    // `src/no-such-module.ts` as a literal made this test file name it, so `namingSites` found one
    // site and the assertion failed on its own fixture. Blanking string literals is not available
    // here — a real declaration IS a string literal — so the fixture splits the token, which is the
    // idiom `register-census.test.ts` uses for the same reason.
    expect(namingSites(ROOT, ["src/no-such", "-module.ts"].join(""))).toEqual([]);
  });
});

describe("W300 the baseline is frozen, and says what it is for", () => {
  it("records a number per shape, and the shapes are the ones that get planted", () => {
    expect(Object.keys(TAX_AT_W300).sort()).toEqual(Object.keys(SHAPE_BODIES).sort());
    for (const value of Object.values(TAX_AT_W300)) expect(value).toBeGreaterThan(0);
  });

  it("states what the measurement does not prove", () => {
    // W237's rule. And the sentence that matters most for a quarter measured against this: a
    // count treats a four-sentence census entry and a one-line surface entry alike.
    expect(TAX_BOUND).toContain("a count treats them alike");
    expect(TAX_BOUND).toContain("W308");
    expect(TAX_BOUND.length).toBeGreaterThan(400);
  });
});

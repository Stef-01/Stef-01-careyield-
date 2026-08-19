// W365 verify gate: "every census member carries a population with its derivation named and
// resolved; a member whose population nothing derives fails; a planted register with no population
// reported."
//
// THE LIVE ASSERTION IS ONE LINE and the whole point of this unit is that it is RESOLVED rather
// than declared: a row naming a walk is checked against the module calling it, both ways. So the
// arms below are driven on constructed modules where the answer is known — a module calling a walk
// its row does not name, a row claiming a recursion the module does not have, and a member with no
// row at all.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  POPULATIONS,
  POPULATION_BOUND,
  type Population,
  SHARED_WALKS,
  populationDefects,
  recursesItself,
  walksCalled,
} from "./populations";
import { TREE_DERIVED_REGISTERS, type TreeDerivedRegister } from "./register-census";
import { withTree } from "./planting";
import { fixtureText } from "./scan-text";

const ROOT = process.cwd();

const member = (file: string): TreeDerivedRegister => ({
  file,
  derives: "y".repeat(40),
  checkedAgainst: "y".repeat(30),
  proof: { kind: "walk_unproven", contentProof: null, remedy: "y".repeat(160) },
  assertion: { kind: "carries_no_assertion", claim: "y".repeat(70), why: "y".repeat(90) },
});

describe("W365 every census member says what it is over, in four directions", () => {
  it("passes, over the census as it stands", () => {
    expect(populationDefects(ROOT)).toEqual([]);
  });

  it("covers the census exactly, and the coverage is not a coincidence", () => {
    expect(POPULATIONS.map((p) => p.file).sort()).toEqual(
      TREE_DERIVED_REGISTERS.map((e) => e.file).sort(),
    );
    expect(POPULATIONS.length).toBeGreaterThan(70);
    // All three kinds are used, so none is a class nobody reached for.
    expect(new Set(POPULATIONS.map((p) => p.source.kind))).toEqual(
      new Set(["shared_walk", "own_recursion", "not_a_walk"]),
    );
  });

  it("reports a census member nothing says a population for", () => {
    expect(populationDefects(ROOT, [], [member("src/planted/thing.ts")])).toEqual([
      { file: "src/planted/thing.ts", what: "is in the census and nothing says what it is over" },
    ]);
  });

  it("reports a population for a file the census does not hold", () => {
    const orphan: Population[] = [
      { file: "src/gone.ts", source: { kind: "own_recursion" } },
    ];
    expect(populationDefects(ROOT, orphan, [])).toEqual([
      { file: "src/gone.ts", what: "has a population here and is not in the census" },
    ]);
  });

  it("reports a module calling a walk its row does not name, which is this quarter's whole subject", () => {
    const found = withTree(
      {
        "src/planted/wide.ts":
          fixtureText("a-module-calling-two-walks"),
      },
      (root) =>
        populationDefects(
          root,
          [{ file: "src/planted/wide.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } }],
          [member("src/planted/wide.ts")],
        ),
    );
    expect(found).toEqual([
      {
        file: "src/planted/wide.ts",
        what: "is recorded as walking sourceModules and calls sourceModules, typescriptFiles",
      },
    ]);
  });

  it("reports a row claiming a recursion the module does not have, and one claiming none while it walks", () => {
    const noRecursion = withTree(
      { "src/planted/quiet.ts": "export const a = 1;\n" },
      (root) =>
        populationDefects(
          root,
          [{ file: "src/planted/quiet.ts", source: { kind: "own_recursion" } }],
          [member("src/planted/quiet.ts")],
        ),
    );
    expect(noRecursion).toEqual([
      { file: "src/planted/quiet.ts", what: "is recorded as recursing itself and holds no recursion" },
    ]);

    const walksAnyway = withTree(
      {
        "src/planted/busy.ts":
          fixtureText("a-module-calling-one-walk"),
      },
      (root) =>
        populationDefects(
          root,
          [{ file: "src/planted/busy.ts", source: { kind: "not_a_walk", why: "y".repeat(130) } }],
          [member("src/planted/busy.ts")],
        ),
    );
    expect(walksAnyway).toEqual([
      { file: "src/planted/busy.ts", what: "is recorded as walking nothing and walks the tree" },
    ]);
  });

  it("reports a row claiming its own recursion while it uses a shared walk", () => {
    const found = withTree(
      {
        "src/planted/both.ts":
          fixtureText("a-module-calling-a-test-walk"),
      },
      (root) =>
        populationDefects(
          root,
          [{ file: "src/planted/both.ts", source: { kind: "own_recursion" } }],
          [member("src/planted/both.ts")],
        ),
    );
    expect(found).toEqual([
      { file: "src/planted/both.ts", what: "is recorded as recursing itself and calls testModules" },
    ]);
  });
});

describe("W365 a call is not a mention", () => {
  it("does not read an import list as a population", () => {
    // `instant.ts` is the live case and the reason this distinction exists: it imports eight walks
    // as DATA and calls none, because its subject IS the walks. A scan reading imports would give
    // the one module whose population is not a walk the widest population in the tree.
    const found = withTree(
      {
        "src/planted/lists.ts":
          fixtureText("a-module-listing-walks-without-calling-them"),
      },
      (root) => walksCalled(root, "src/planted/lists.ts"),
    );
    expect(found, "an import list was read as a population").toEqual([]);
  });

  it("reads a call, and reads every one of them", () => {
    const found = withTree(
      {
        "src/planted/calls.ts":
          fixtureText("a-module-calling-two-walks-by-name"),
      },
      (root) => walksCalled(root, "src/planted/calls.ts"),
    );
    expect(found).toEqual(["sourceModules", "textFiles"]);
  });

  it("tells a recursion from a module that has none", () => {
    const found = withTree(
      {
        "src/planted/deep.ts": fixtureText("private-tree-recursion"),
        "src/planted/flat.ts": "export const a = 1;\n",
      },
      (root) => [recursesItself(root, "src/planted/deep.ts"), recursesItself(root, "src/planted/flat.ts")],
    );
    expect(found).toEqual([true, false]);
  });
});

describe("W365 the register says what it is and what it is not", () => {
  it("names walks the tree really exports, resolved against the module that owns them", () => {
    // A list of walk names nothing resolves is a list of strings. Each is checked against
    // `tree-walks.ts`'s own exports, and the other direction too — a walk this tree shares that
    // this register does not know about would make every population row narrower than the truth.
    const owner = readFileSync(path.join(ROOT, "src/quality/tree-walks.ts"), "utf8");
    const exported = [...owner.matchAll(/^export function (\w+)/gm)].map((m) => m[1]!).sort();
    expect([...SHARED_WALKS].sort(), "the shared walks and the module that owns them disagree").toEqual(
      exported,
    );
  });

  it("argues every row it cannot derive", () => {
    for (const { file, source } of POPULATIONS) {
      if (source.kind !== "not_a_walk") continue;
      expect(source.why.length, `${file} is recorded as walking nothing without an argument`).toBeGreaterThan(
        120,
      );
    }
  });

  it("states what a green register does not cover", () => {
    expect(POPULATION_BOUND.length).toBeGreaterThan(600);
    expect(POPULATION_BOUND).toContain("NOT WHETHER IT IS THE RIGHT SET");
    expect(POPULATION_BOUND).toContain("A CALL IS READ AS TEXT");
  });
});

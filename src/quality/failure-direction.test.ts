// W352 verify gate: "every census member classified; a register whose declared direction its own
// suite contradicts fails; a planted register with no direction reported."
//
// THE DERIVATION IS DRIVEN ON CONSTRUCTED CENSUS ENTRIES, because the four combinations of proved
// walk and driven assertion are what the rule turns on and this tree does not hold all four in a
// state anybody can move. The live arm then runs the same comparison over the real census.

import { describe, expect, it } from "vitest";
import { TREE_DERIVED_REGISTERS } from "./manifest";
import {
  ARGUED_DIRECTIONS,
  DIRECTION_BOUND,
  type ArguedDirection,
  assertionDriven,
  derivedDirection,
  directionDefects,
  directionOf,
  directions,
  quietRegisters,
  walkProved,
} from "./failure-direction";
import type { TreeDerivedRegister } from "./register-census";

/** A census entry somebody constructed, so the rule can be shown answering about another tree. */
const entry = (
  file: string,
  proof: TreeDerivedRegister["proof"]["kind"],
  assertion: TreeDerivedRegister["assertion"]["kind"],
): TreeDerivedRegister =>
  ({
    file,
    derives: "a planted derivation",
    checkedAgainst: "a planted register",
    proof:
      proof === "mutated_tree"
        ? { kind: "mutated_tree", mutation: "a planted file is reported" }
        : { kind: "walk_unproven", contentProof: null, remedy: "give the walk a root" },
    assertion:
      assertion === "driven_here"
        ? { kind: "driven_here", claim: "a planted claim", mutation: "a planted mutation" }
        : assertion === "driven_by_branch"
          ? { kind: "driven_by_branch", claim: "c", mutation: "m", branch: "b" }
          : assertion === "carries_no_assertion"
            ? { kind: "carries_no_assertion", claim: "none of its own", why: "a prover" }
            : { kind: "assertion_unproven", claim: "c", mutation: "m", remedy: "export it" },
  }) as TreeDerivedRegister;

describe("W352 the direction the census settles", () => {
  it("reads a proved walk and a driven assertion as loud", () => {
    expect(derivedDirection(entry("src/a.ts", "mutated_tree", "driven_here"))).toBe("loud");
    expect(derivedDirection(entry("src/a.ts", "mutated_tree", "driven_by_branch"))).toBe("loud");
  });

  it("reads neither proved as failing toward looking correct", () => {
    expect(derivedDirection(entry("src/a.ts", "walk_unproven", "assertion_unproven"))).toBe(
      "toward_looking_correct",
    );
  });

  it("refuses to settle the mixed cases, which is what the argued rows are for", () => {
    expect(derivedDirection(entry("src/a.ts", "mutated_tree", "assertion_unproven"))).toBeNull();
    expect(derivedDirection(entry("src/a.ts", "mutated_tree", "carries_no_assertion"))).toBeNull();
  });

  it("reads the two halves apart, because the mixed case is the whole distinction", () => {
    const mixed = entry("src/a.ts", "mutated_tree", "assertion_unproven");
    expect(walkProved(mixed)).toBe(true);
    expect(assertionDriven(mixed)).toBe(false);
  });
});

describe("W352 the live census", () => {
  it("classifies every member, derived or argued", () => {
    expect(directionDefects(TREE_DERIVED_REGISTERS)).toEqual([]);
  });

  it("settles most of them without anybody's opinion", () => {
    // THE POINT OF THE DERIVATION. If the argued rows were the majority this would be a table of
    // adjectives, which is what the bound says it must not become. A floor rather than a pin.
    const all = directions(TREE_DERIVED_REGISTERS);
    expect(all.length).toBe(TREE_DERIVED_REGISTERS.length);
    expect(all.filter((d) => d.source === "derived").length).toBeGreaterThan(all.length / 2);
  });

  it("names the registers whose failure is quiet, rather than counting them", () => {
    // W290: a NAMED list moves deliberately and a count moves by accident. These four are named
    // because each is a register whose silence would read as the tree being clean.
    const quiet = quietRegisters(TREE_DERIVED_REGISTERS);
    expect(quiet).toContain("src/quality/register-census.test.ts");
    expect(quiet).toContain("src/security/reachability.ts");
    expect(quiet).toContain("src/lib/stores.test.ts");
    expect(quiet).toContain("src/privacy/record-classes.test.ts");
    expect(quiet.length).toBeGreaterThan(10);
  });

  it("argues every row the census leaves open, and argues nothing it settles", () => {
    const byFile = new Map(TREE_DERIVED_REGISTERS.map((e) => [e.file, e]));
    for (const row of ARGUED_DIRECTIONS) {
      expect(row.why.length, `${row.file} is argued without an argument`).toBeGreaterThan(120);
      const found = byFile.get(row.file);
      expect(found, `${row.file} is argued and is not in the census`).toBeDefined();
      expect(derivedDirection(found!), `${row.file} is argued and the census settles it`).toBeNull();
    }
  });

  it("holds both directions in the argued rows, so the arm is not one answer with a table", () => {
    expect(new Set(ARGUED_DIRECTIONS.map((a) => a.direction))).toEqual(
      new Set(["loud", "toward_looking_correct"]),
    );
  });
});

describe("W352 the arms, driven", () => {
  const census = [
    entry("src/planted/loud.ts", "mutated_tree", "driven_here"),
    entry("src/planted/open.ts", "mutated_tree", "assertion_unproven"),
  ];

  it("reports a register the census cannot settle and nobody argued", () => {
    expect(directionDefects(census, [])).toEqual([
      { file: "src/planted/open.ts", what: "the census cannot settle which way it fails and nobody argued it" },
    ]);
  });

  it("says nothing once somebody argues it", () => {
    const argued: ArguedDirection[] = [
      { file: "src/planted/open.ts", direction: "loud", why: "x".repeat(130) },
    ];
    expect(directionDefects(census, argued)).toEqual([]);
    expect(directionOf(census[1]!, argued)).toEqual({
      file: "src/planted/open.ts",
      direction: "loud",
      source: "argued",
    });
  });

  it("reports an argument the census contradicts, whichever way it points", () => {
    // THE ARM WITH TEETH. An opinion may fill a gap the derivation leaves; it may not overrule a
    // derivation — that would be the failure direction of a register of failure directions.
    const argued: ArguedDirection[] = [
      { file: "src/planted/open.ts", direction: "loud", why: "x".repeat(130) },
      { file: "src/planted/loud.ts", direction: "toward_looking_correct", why: "x".repeat(130) },
    ];
    expect(directionDefects(census, argued)).toEqual([
      { file: "src/planted/loud.ts", what: "is argued `toward_looking_correct` and the census derives `loud`" },
    ]);
  });

  it("reports an argument for a register the census no longer holds", () => {
    const argued: ArguedDirection[] = [
      { file: "src/planted/open.ts", direction: "loud", why: "x".repeat(130) },
      { file: "src/planted/gone.ts", direction: "loud", why: "x".repeat(130) },
    ];
    expect(directionDefects(census, argued)).toEqual([
      { file: "src/planted/gone.ts", what: "is argued and the census no longer holds it" },
    ]);
  });
});

describe("W352 the bound", () => {
  it("states that loud means one planted instance, and names the counter-example", () => {
    expect(DIRECTION_BOUND).toContain("ONE PLANTED INSTANCE");
    expect(DIRECTION_BOUND).toContain("W349");
    expect(DIRECTION_BOUND.length).toBeGreaterThan(500);
  });

  it("is true: a register the census calls loud can still be wrong in silence", () => {
    // The bound's own non-vacuity, W339's rule. W349's population failed open while its census
    // entry read as proved on BOTH halves — so the register this unit builds would have called it
    // loud on the day it was silently returning the whole repository.
    const failedOpen = entry("src/quality/quarter-mutants.ts", "mutated_tree", "driven_here");
    expect(derivedDirection(failedOpen)).toBe("loud");
    const live = TREE_DERIVED_REGISTERS.find((e) => e.file === "src/quality/quarter-mutants.ts");
    expect(live, "the counter-example is not in the census any more").toBeDefined();
    expect(directionOf(live!)!.direction, "the register that failed open is not called loud").toBe("loud");
  });
});

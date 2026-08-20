// W353 verify gate: "every exported derivation taking a population enumerated with what it returns
// when handed nothing it understands; one that widens rather than throws is reported; W349's
// `quarterModules` mis-call reproduced as the driven case."
//
// THE LIVE ARM RUNS THE ROWS AND THE DRIVEN ARM PLANTS A WIDENING SELECTOR, because the tree is
// not supposed to hold one and a register nobody has seen report anything is a register nobody has
// seen work. The driven case is the third thing: `quarterModules` handed the degenerate range,
// called here directly rather than through the table, so the reproduction is the failure itself
// and not this unit's opinion of it.

import { describe, expect, it } from "vitest";
import { copyTree, withPlantedIn } from "./planting";
import { QUARTER_AT_W332, quarterModules } from "./quarter-mutants";
import {
  SELECTORS,
  SUPERSET_BOUND,
  type Selector,
  behaviourOf,
  supersetDefects,
  undeclaredPopulations,
  wideningSelectors,
} from "./superset";
import type { TreeDerivedRegister } from "./register-census";
import { resolveName } from "./typed-names";

const ROOT = process.cwd();

/** A selector somebody constructed, so the rule can be shown answering about another tree. */
const planted = (name: string, honest: number, degenerate: number, expected: Selector["expected"]): Selector => ({
  name,
  what: "a planted population",
  honest: () => honest,
  degenerate: () => degenerate,
  expected,
  why: "a planted row",
});

/** A module whose header names a unit inside the quarter — a file arriving in the population. */
const ARRIVING = `// W${QUARTER_AT_W332.first}: a module planted by W353, to be counted.\nexport const x = 1;\n`;

/** The negative: the same shape, naming a unit the quarter does not hold. It must not be counted. */
const OUTSIDE = `// W${QUARTER_AT_W332.last + 1}: a module planted by W353, one unit past the quarter.\nexport const y = 1;\n`;

describe("W353 the tree's selectors", () => {
  it("has no selector that widens", () => {
    expect(wideningSelectors(ROOT)).toEqual([]);
  });

  it("has none whose behaviour disagrees with what it declares", () => {
    expect(supersetDefects(ROOT)).toEqual([]);
  });

  it("declares a selector that refuses and selectors that narrow, so the arm is not one answer", () => {
    expect(new Set(SELECTORS.map((s) => s.expected))).toEqual(new Set(["refuses", "narrows"]));
  });

  it("names a real export in every row", () => {
    for (const selector of SELECTORS) {
      expect(resolveName(ROOT, "export", selector.name), selector.name).toBe(true);
      expect(selector.why.length, `${selector.name} is declared without an argument`).toBeGreaterThan(120);
    }
  });
});

describe("W353 a `narrows` row must actually narrow", () => {
  it("answers strictly more on the honest input than on the degenerate one", () => {
    // W374's sweep found this: `behaviourOf` returns "narrows" whenever the degenerate answer is
    // not GREATER than the honest one, so a selector answering the same thing on both — or
    // nothing on either — reads as narrowing. Flipping `=== null` to `!== null` in the
    // `claimCommit` row made its honest reading zero, equal to its degenerate reading, and every
    // assertion here stayed green. A wrong answer that looks like the right one is this register's
    // own subject, arriving in the register.
    for (const selector of SELECTORS) {
      if (selector.expected !== "narrows") continue;
      const honest = selector.honest(ROOT);
      let degenerate: number | "refuses";
      try {
        degenerate = selector.degenerate(ROOT);
      } catch {
        continue;
      }
      if (degenerate === "refuses") continue;
      expect(honest, `${selector.name} narrows by answering nothing on the honest input`).toBeGreaterThan(
        degenerate,
      );
    }
  });
});

describe("W353 the driven case: W349's mis-call", () => {
  it("refuses a range whose ends are not numbers", () => {
    // THE REPRODUCTION. Before this unit the same call returned every module under `src/` — every
    // comparison against `NaN` is false, so a filter built on `<` and `>` keeps what it was asked
    // to drop. W343 typed the argument; the behaviour was untouched until here.
    expect(() => quarterModules(ROOT, { first: Number.NaN, last: Number.NaN })).toThrow(
      "not a range of units",
    );
  });

  it("refuses when either end alone is not a number", () => {
    expect(() => quarterModules(ROOT, { first: Number.NaN, last: 325 })).toThrow("not a range of units");
    expect(() => quarterModules(ROOT, { first: 313, last: Number.NaN })).toThrow("not a range of units");
    expect(() => quarterModules(ROOT, { first: 313, last: Number.POSITIVE_INFINITY })).toThrow(
      "not a range of units",
    );
  });

  it("still answers the honest range, and answers it smaller than the tree", () => {
    // NON-VACUITY: a guard that refused everything would pass the arm above and destroy the
    // register underneath it.
    const quarter = quarterModules(ROOT, QUARTER_AT_W332);
    expect(quarter.length).toBeGreaterThan(0);
    expect(quarter.length).toBeLessThan(quarterModules(ROOT, { first: 1, last: 9999 }).length);
  });

  it("narrows to nothing on a reversed range rather than refusing", () => {
    // The bound's second sentence, driven: a reversed range is a state a caller can mean, so it
    // answers emptily instead of throwing, and only the meaningless range is a mistake.
    expect(quarterModules(ROOT, { first: 325, last: 313 })).toEqual([]);
  });
});

describe("W353 the walk, on a copied tree", () => {
  it("notices a module arriving in the population it measures", () => {
    // W267'S PROOF, and the reason this register takes a root at all: every row hands somebody
    // else's walk a tree, so the measurement is only as alive as the tree it is pointed at. A
    // module whose header names a unit inside the quarter arrives, and the honest answer grows.
    const copy = copyTree(ROOT, { directories: ["src"] });
    const before = SELECTORS[0]!.honest(copy);
    const after = withPlantedIn(
      copy,
      { "src/planted/w353-arrival.ts": ARRIVING, "src/planted/w353-outside.ts": OUTSIDE },
      () => SELECTORS[0]!.honest(copy),
    );
    // W292'S NEGATIVE, planted in the same call: two modules arrive and the count moves by ONE,
    // so what the measurement reads is the header's unit rather than the file being new.
    expect(after).toBe(before + 1);
    expect(SELECTORS[0]!.honest(copy)).toBe(before);
  });

  it("still refuses the degenerate range on a tree that is not this one", () => {
    const copy = copyTree(ROOT, { directories: ["src"] });
    expect(behaviourOf(SELECTORS[0]!, copy)).toBe("refuses");
  });
});

describe("W353 the rule, driven", () => {
  it("calls a bigger degenerate answer widening", () => {
    expect(behaviourOf(planted("src/a.ts::wide", 3, 9, "narrows"), ROOT)).toBe("widens");
  });

  it("calls a smaller or equal one narrowing", () => {
    expect(behaviourOf(planted("src/a.ts::small", 9, 0, "narrows"), ROOT)).toBe("narrows");
    expect(behaviourOf(planted("src/a.ts::same", 9, 9, "narrows"), ROOT)).toBe("narrows");
  });

  it("calls a throw refusing", () => {
    const thrower: Selector = {
      ...planted("src/a.ts::refuser", 3, 0, "refuses"),
      degenerate: () => {
        throw new Error("no");
      },
    };
    expect(behaviourOf(thrower, ROOT)).toBe("refuses");
  });

  it("reports a planted selector that widens, by name", () => {
    const census = [planted("src/a.ts::wide", 3, 9, "narrows"), planted("src/b.ts::fine", 3, 1, "narrows")];
    expect(wideningSelectors(ROOT, census)).toEqual(["src/a.ts::wide"]);
    expect(supersetDefects(ROOT, census)).toEqual([
      { selector: "src/a.ts::wide", what: "is declared `narrows` and `widens`" },
    ]);
  });

  it("reports a selector declared to refuse that merely narrows", () => {
    // The direction that is easy to miss: an empty answer at a parse boundary is a fact somebody
    // reads about the tree, and the input that produced it was a mistake.
    expect(supersetDefects(ROOT, [planted("src/a.ts::quiet", 3, 0, "refuses")])).toEqual([
      { selector: "src/a.ts::quiet", what: "is declared `refuses` and `narrows`" },
    ]);
  });

  it("says nothing about a selector doing what it declares", () => {
    expect(supersetDefects(ROOT, [planted("src/a.ts::wide", 3, 9, "widens")])).toEqual([]);
  });
});

describe("W353 the population the register does not watch", () => {
  const census = (...files: string[]) => files.map((file) => ({ file }) as TreeDerivedRegister);

  it("names a walking register no selector declares", () => {
    expect(
      undeclaredPopulations(census("src/planted/w353-unwatched.ts"), [
        planted("src/planted/w353-watched.ts::x", 1, 0, "narrows"),
      ]),
    ).toEqual(["src/planted/w353-unwatched.ts"]);
  });

  it("says nothing about one a selector does declare", () => {
    expect(
      undeclaredPopulations(census("src/planted/w353-watched.ts"), [
        planted("src/planted/w353-watched.ts::x", 1, 0, "narrows"),
      ]),
    ).toEqual([]);
  });

  it("leaves test files out, because their population is whatever they were handed", () => {
    expect(undeclaredPopulations(census("src/planted/w353-thing.test.ts"), [])).toEqual([]);
  });

  it("is not empty against the live census, which is the bound saying so", () => {
    // NON-VACUITY OF THE BOUND'S PREDICATE. If this were empty the sentence would be describing a
    // register that watches everything, and `SUPERSET_BOUND`'s remedy would already be built.
    expect(undeclaredPopulations().length).toBeGreaterThan(0);
  });
});

describe("W353 the bound", () => {
  it("states that the population is declared and that size is the measure", () => {
    expect(SUPERSET_BOUND).toContain("THE POPULATION IS DECLARED");
    expect(SUPERSET_BOUND).toContain("SIZE IS");
    expect(SUPERSET_BOUND.length).toBeGreaterThan(500);
  });

  it("is true: a selector returning the same number of the wrong things reads clean", () => {
    // The bound's own non-vacuity, W339's rule. Equal sizes and a different answer entirely, and
    // this register calls it narrowing.
    expect(behaviourOf(planted("src/a.ts::swapped", 9, 9, "narrows"), ROOT)).toBe("narrows");
  });
});

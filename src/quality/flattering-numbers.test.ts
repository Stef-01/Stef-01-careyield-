// W354 verify gate: "each derived count classified as failing high, low or loudly, resolved
// against the derivation; a count whose error direction nobody declared fails; W340's thirty-five
// driven as the worked example."
//
// THE LIVE ARM MEASURES EVERY ROW BY CALLING IT and the driven arm plants the four ways a row can
// be wrong, because a register whose defect list has only ever been empty is a register nobody has
// seen work. The worked example is the third thing and the reason the unit exists: W340's count
// re-taken by the rule that produced it, so the DIRECTION is shown rather than described.

import { describe, expect, it } from "vitest";
import {
  FIGURES,
  FIGURE_BOUND,
  type Figure,
  countingFigures,
  figureDefects,
  measuredDirection,
  numberReturningExports,
  quietFigures,
  textScannedFacts,
} from "./flattering-numbers";
import { resolveName } from "./typed-names";
import { servedFacts, unaskedFacts } from "./unasked-facts";

const ROOT = process.cwd();

/** A figure somebody constructed, so the rule can be shown answering about another tree. */
const planted = (name: string, honest: number, blinded: number, direction: Figure["direction"]): Figure => ({
  name,
  what: "a planted figure",
  direction,
  why: "a planted row",
  probe: { honest: () => honest, blinded: () => blinded },
});

describe("W354 the tree's figures", () => {
  it("classifies every figure the tree derives, and names none it does not", () => {
    expect(figureDefects(ROOT)).toEqual([]);
  });

  it("counts, rather than merely returning a number", () => {
    // The narrowing is derived and both halves are real: every counting figure returns a number,
    // and the arithmetic ones the scan drops are a set somebody can look at.
    const all = numberReturningExports(ROOT);
    const counting = countingFigures(ROOT);
    expect(counting.length).toBeGreaterThan(5);
    expect(all.length).toBeGreaterThan(counting.length);
    for (const name of counting) expect(all).toContain(name);
    expect(all).toContain("src/mbs/items.ts::estimateRevenuePerVisit");
    expect(counting).not.toContain("src/mbs/items.ts::estimateRevenuePerVisit");
  });

  it("names a real export in every row", () => {
    for (const figure of FIGURES) {
      expect(resolveName(ROOT, "export", figure.name), figure.name).toBe(true);
      expect(figure.why.length, `${figure.name} is classified without an argument`).toBeGreaterThan(120);
    }
  });

  it("holds both quiet directions, so the arm is not one answer with a table", () => {
    expect(new Set(FIGURES.map((f) => f.direction))).toEqual(new Set(["low", "high", "not_a_count"]));
    const hatch = FIGURES.filter((f) => f.direction === "not_a_count");
    expect(hatch.length, "the escape hatch is the majority").toBeLessThan(FIGURES.length / 2);
  });

  it("finds not one figure in this tree that anything contradicts — the finding", () => {
    // THE Q28 RESULT, stated as a list rather than a count. Every figure here fails in silence:
    // no second door in this repository recomputes any of them a different way, so a wrong number
    // is quoted rather than questioned. `loud` is reachable — the driven arm below reaches it —
    // and nothing in this product is standing where it would be reached.
    expect(FIGURES.filter((f) => f.direction === "loud")).toEqual([]);
    // The same filter, over a direction the table DOES hold — so the empty answer above is a
    // measurement of this tree rather than of a comparison that never matches anything.
    expect(FIGURES.filter((f) => f.direction === "low").length).toBeGreaterThan(5);
    const quiet = quietFigures();
    expect(quiet).toContain("src/education/store.ts::scrubClinicianCpd");
    expect(quiet).toContain("src/capability/continuity-guard.ts::projectUsualGpShare");
    expect(quiet).toContain("src/complaints/store.ts::openComplaintCount");
    expect(quiet.length).toBeGreaterThan(8);
  });
});

describe("W354 the worked example: W340's thirty-five", () => {
  it("moves the count DOWN, which is why nobody went looking for the other half", () => {
    // THE REPRODUCTION, and the claim is the direction rather than either number. Prose about a
    // function is not a call; a rule that treats it as one invents readers; and an invented reader
    // can only ever turn an unasked fact into an asked one.
    const facts = servedFacts(ROOT);
    const resolved = unaskedFacts(ROOT, facts).length;
    const textScanned = unaskedFacts(ROOT, textScannedFacts(ROOT, facts)).length;
    expect(textScanned).toBeLessThan(resolved);
    expect(resolved).toBeGreaterThan(0);
  });

  it("excludes a fact's own module from its readers, and requires the name to appear", () => {
    // W374's sweep found both halves of this line unprotected: flipping `!==` to `===` and `&&` to
    // `||` each left every assertion above green, because they all read the DIRECTION the count
    // moves and both mutants move it the same way. A direction is the finding; the reader set is
    // what produces it, and it was pinned by nothing.
    const facts = servedFacts(ROOT);
    const scanned = textScannedFacts(ROOT, facts);
    expect(scanned.length).toBeGreaterThan(0);

    // `!==`: a module is not a reader of the fact it serves. With `===` the filter keeps exactly
    // the fact's own module, which mentions its own name in its own declaration.
    for (const fact of scanned) {
      const [module] = fact.id.split("::");
      expect(fact.readers, `${fact.id} lists its own module as a reader`).not.toContain(module);
    }

    // `&&`: BOTH halves have to hold. With `||` the filter keeps every file that is not the fact's
    // own, so every fact would come back with the SAME number of readers — one less than the tree.
    // Counted against each other rather than against a walk of the tree: this file has no business
    // recursing, and the first draft of this assertion made it a walker W267 had to declare.
    const widths = new Set(scanned.map((f) => f.readers.length));
    expect(widths.size, "every fact has the same reader count, so the name test is doing nothing").toBeGreaterThan(
      1,
    );
  });

  it("is the same measurement this register takes of everything else", () => {
    const facts = servedFacts(ROOT);
    expect(
      measuredDirection({
        honest: () => unaskedFacts(ROOT, facts).length,
        blinded: () => unaskedFacts(ROOT, textScannedFacts(ROOT, facts)).length,
      }),
    ).toBe("low");
  });

  it("is invisible to this register's own scan, which is what the bound says", () => {
    // NON-VACUITY OF THE BOUND. The count the unit is named after returns a LIST; the number is
    // taken by its caller, so no declared return type says `number` and the population misses it.
    expect(countingFigures(ROOT)).not.toContain("src/quality/unasked-facts.ts::unaskedFacts");
    expect(numberReturningExports(ROOT)).not.toContain("src/quality/unasked-facts.ts::unaskedFacts");
  });
});

describe("W354 the rule, driven", () => {
  it("reads a smaller blinded figure as low and a bigger one as high", () => {
    expect(measuredDirection({ honest: () => 9, blinded: () => 3 })).toBe("low");
    expect(measuredDirection({ honest: () => 3, blinded: () => 9 })).toBe("high");
  });

  it("reads a contradicted figure as loud, whichever way it moved", () => {
    expect(measuredDirection({ honest: () => 9, blinded: () => 3, contradicted: () => true })).toBe("loud");
    expect(measuredDirection({ honest: () => 3, blinded: () => 9, contradicted: () => true })).toBe("loud");
    expect(measuredDirection({ honest: () => 9, blinded: () => 3, contradicted: () => false })).toBe("low");
  });

  it("refuses to settle a blinding that moved nothing", () => {
    expect(measuredDirection({ honest: () => 9, blinded: () => 9 })).toBeNull();
  });

  it("reports a row whose measurement disagrees with its declaration", () => {
    expect(figureDefects(ROOT, [planted("src/a.ts::wrong", 9, 3, "high")], ["src/a.ts::wrong"])).toEqual([
      { figure: "src/a.ts::wrong", what: "is declared `high` and measures `low`" },
    ]);
  });

  it("reports a row driven by a blinding that moves nothing", () => {
    expect(figureDefects(ROOT, [planted("src/a.ts::still", 9, 9, "low")], ["src/a.ts::still"])).toEqual([
      { figure: "src/a.ts::still", what: "is driven by a blinding that moves nothing" },
    ]);
  });

  it("reports a direction nothing drives, and an escape hatch that drives one", () => {
    const undriven: Figure = { name: "src/a.ts::bare", what: "w", direction: "low", why: "y" };
    expect(figureDefects(ROOT, [undriven], ["src/a.ts::bare"])).toEqual([
      { figure: "src/a.ts::bare", what: "is declared `low` and nothing drives it" },
    ]);
    expect(
      figureDefects(ROOT, [{ ...planted("src/a.ts::hatch", 9, 3, "not_a_count") }], ["src/a.ts::hatch"]),
    ).toEqual([{ figure: "src/a.ts::hatch", what: "is declared `not_a_count` and supplies a probe" }]);
  });

  it("reports a `loud` row that names no second reader", () => {
    // THE ARM WITH TEETH. `loud` is the only classification that says somebody would find out, so
    // it is the one word a row may not simply assert.
    expect(figureDefects(ROOT, [planted("src/a.ts::claims", 9, 3, "loud")], ["src/a.ts::claims"])).toEqual([
      { figure: "src/a.ts::claims", what: "is declared `loud` and names no second reader" },
    ]);
    const real: Figure = {
      ...planted("src/a.ts::real", 9, 3, "loud"),
      probe: { honest: () => 9, blinded: () => 3, contradicted: () => true },
    };
    expect(figureDefects(ROOT, [real], ["src/a.ts::real"])).toEqual([]);
  });

  it("reports a figure the tree derives that no row classifies, and a row for one it does not", () => {
    expect(figureDefects(ROOT, [], ["src/a.ts::unclassified"])).toEqual([
      {
        figure: "src/a.ts::unclassified",
        what: "is a figure the tree derives and no row says which way it fails",
      },
    ]);
    expect(figureDefects(ROOT, [planted("src/a.ts::gone", 9, 3, "low")], [])).toEqual([
      { figure: "src/a.ts::gone", what: "is a row here and the tree derives no such figure" },
    ]);
  });
});

describe("W354 the bound", () => {
  it("states the length it cannot see and the contradiction `loud` rests on", () => {
    expect(FIGURE_BOUND).toContain("A FIGURE SPELLED AS THE LENGTH OF A LIST IS INVISIBLE HERE");
    expect(FIGURE_BOUND).toContain("A BLINDING IS ONE MISTAKE");
    expect(FIGURE_BOUND.length).toBeGreaterThan(500);
  });

  it("is true: one blinding settles one direction and says nothing about a second mistake", () => {
    // The bound's own non-vacuity, W339's rule. The same figure, blinded two ways, answers two
    // ways — and a row declares whichever way its own blinding went.
    const twoWays = { honest: () => 5 };
    expect(measuredDirection({ ...twoWays, blinded: () => 2 })).toBe("low");
    expect(measuredDirection({ ...twoWays, blinded: () => 8 })).toBe("high");
  });
});

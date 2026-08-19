// W367 verify gate: "every register whose bound states a wider subject than its derivation walks is
// reported; the gap named in the bound resolved against the walk; a claim and a walk that agree
// must be distinguishable from one that has never been compared."
//
// THE LAST CLAUSE IS THE ONE THAT SHAPES THIS FILE. A register that reported only mismatches would
// be silent about a bound nobody had ever read against its walk, and silent in exactly the same
// way it is silent about one that agrees. So the population is derived — every bound over a walk —
// and a member with no row is a defect in its own right, driven below on the real population.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripComments } from "@/security/reachability";
import {
  COMPARED_AT_W367,
  type Compared,
  SUBJECT_BOUND,
  boundedWalkers,
  flatten,
  subjectDefects,
} from "./subject-and-walk";
import { STATED_BOUNDS } from "./bounds";
import { POPULATIONS } from "./populations";

const ROOT = process.cwd();
const POPULATION = boundedWalkers(STATED_BOUNDS, POPULATIONS);

describe("W367 every bound over a walk has been read against it, in four directions", () => {
  it("passes, over the tree as it stands", () => {
    expect(subjectDefects(ROOT, STATED_BOUNDS, POPULATIONS)).toEqual([]);
  });

  it("derives the population from the bounds and the walks rather than from a list", () => {
    expect(POPULATION.length).toBeGreaterThan(25);
    // A proper subset both ways: not every bound sits over a walk, and not every walker states one.
    expect(POPULATION.length).toBeLessThan(STATED_BOUNDS.length);
    expect(POPULATION.length).toBeLessThan(POPULATIONS.length);
    expect(COMPARED_AT_W367.map((c) => c.bound).sort()).toEqual(POPULATION.map((p) => p.bound).sort());
  });

  it("reports a bound over a walk that nothing has compared, which is the clause the gate names", () => {
    const bounds = [{ module: "src/quality/pins.ts", name: "NEW_BOUND", text: "y".repeat(200) }];
    expect(subjectDefects(ROOT, bounds, POPULATIONS, [])).toEqual([
      {
        bound: "src/quality/pins.ts::NEW_BOUND",
        what: "states a bound over a walk and nothing has compared the two",
      },
    ]);
  });

  it("reports a comparison for something that is not a bound over a walk", () => {
    const orphan: Compared[] = [
      { bound: "src/gone.ts::GONE_BOUND", walk: ["sourceModules"], edge: { kind: "coincides", why: "y".repeat(130) } },
    ];
    expect(subjectDefects(ROOT, [], POPULATIONS, orphan)).toEqual([
      { bound: "src/gone.ts::GONE_BOUND", what: "is compared here and is not a bound over a walk" },
    ]);
  });

  it("reports a row read against the wrong walk, which is how a comparison goes stale", () => {
    const wrong: Compared[] = [
      {
        bound: "src/quality/pins.ts::SWEEP_BOUND",
        walk: ["sourceModules"],
        edge: { kind: "named", quote: "a named-constant sweep would have caught none of them" },
      },
    ];
    const bounds = STATED_BOUNDS.filter((b) => b.module === "src/quality/pins.ts" && b.name === "SWEEP_BOUND");
    expect(subjectDefects(ROOT, bounds, POPULATIONS, wrong)).toEqual([
      {
        bound: "src/quality/pins.ts::SWEEP_BOUND",
        what: "is compared against sourceModules and walks typescriptFiles",
      },
    ]);
  });

  it("reports a quote the bound does not say, which is the arm that reads as coverage", () => {
    const bogus: Compared[] = [
      {
        bound: "src/quality/pins.ts::SWEEP_BOUND",
        walk: ["typescriptFiles"],
        edge: { kind: "named", quote: "a sentence nobody ever wrote into this bound" },
      },
    ];
    const bounds = STATED_BOUNDS.filter((b) => b.module === "src/quality/pins.ts" && b.name === "SWEEP_BOUND");
    expect(subjectDefects(ROOT, bounds, POPULATIONS, bogus)).toEqual([
      {
        bound: "src/quality/pins.ts::SWEEP_BOUND",
        what: "quotes an edge the bound does not say: a sentence nobody ever wrote into this bound",
      },
    ]);
  });

  it("reports a bound recorded as walking narrower than it claims", () => {
    const unsaid: Compared[] = [
      {
        bound: "src/quality/pins.ts::SWEEP_BOUND",
        walk: ["typescriptFiles"],
        edge: { kind: "unsaid", why: "y".repeat(130) },
      },
    ];
    const bounds = STATED_BOUNDS.filter((b) => b.module === "src/quality/pins.ts" && b.name === "SWEEP_BOUND");
    expect(subjectDefects(ROOT, bounds, POPULATIONS, unsaid)).toEqual([
      {
        bound: "src/quality/pins.ts::SWEEP_BOUND",
        what: "walks narrower than it claims and the bound does not say so",
      },
    ]);
  });
});

describe("W367 the quote is resolved against the sentence, not against its formatting", () => {
  it("normalises whitespace on both sides, which is what makes a wrapped quote resolvable", () => {
    // NO BOUND IN THIS TREE CONTAINS A NEWLINE — they are `"…" + "…"` chains and the concatenation
    // joins without one — so `flatten` buys nothing on the bound side today. It is on the ROW side
    // that it earns its place: a quote written across two source lines in this file arrives with a
    // newline and two spaces in it, and a comparison reading formatting instead of words would
    // report rot on a row whose sentence is exactly right. Driven on a constructed pair rather than
    // asserted about the tree, because the tree does not currently have the shape.
    expect(flatten("a  b\n  c")).toBe("a b c");
    expect(STATED_BOUNDS.some((b) => b.text.includes("\n")), "a bound now wraps, so the note above is stale").toBe(
      false,
    );
    const wrapped = "a page that renders a number\n      some other way";
    expect(flatten(wrapped)).toBe("a page that renders a number some other way");
  });

  it("every named quote really is in the bound it is recorded against", () => {
    const textOf = new Map(STATED_BOUNDS.map((b) => [`${b.module}::${b.name}`, flatten(b.text)]));
    const named = COMPARED_AT_W367.filter((c) => c.edge.kind === "named");
    expect(named.length, "nothing is named, so the resolution checks nothing").toBeGreaterThan(25);
    for (const row of named) {
      const quote = flatten((row.edge as { quote: string }).quote);
      expect(textOf.get(row.bound), `${row.bound} quotes an edge it does not state`).toContain(quote);
      expect(quote.length, `${row.bound}'s quote is too short to be distinctive`).toBeGreaterThan(25);
    }
  });
});

describe("W367 no import order can blank a bound, which is the defect this file entered through", () => {
  // THIS SUITE IMPORTS `./subject-and-walk` BEFORE `./bounds`, and that ordering is the witness.
  // `bounds.ts` imports `SUBJECT_BOUND`, so entering the graph here used to re-enter `bounds.ts`
  // mid-evaluation — first directly, then through `POPULATIONS` → `register-census` → `manifest` —
  // and three bounds arrived with `text` undefined. The failure was a `TypeError` in `flatten`,
  // three frames from the cause, and it only appeared from this direction: the same code entered
  // through `bounds.ts` first was green. The fix was to leave the module with no runtime import at
  // all, which is what the first test below pins.
  it("holds no runtime import, so it cannot be a node in any cycle", () => {
    const source = stripComments(readFileSync(path.join(ROOT, "src/quality/subject-and-walk.ts"), "utf8"));
    const imports = source.split("\n").filter((line) => /^import\s/.test(line));
    expect(imports.length, "the module stopped importing, so this checks nothing").toBeGreaterThan(0);
    for (const line of imports) {
      expect(line, "a value import puts this module back in the cycle it was built out of").toContain("import type");
    }
  });

  it("sees every bound with its text intact from this direction", () => {
    const blank = (bounds: readonly { module: string; name: string; text: string }[]): string[] =>
      bounds.filter((b) => typeof b.text !== "string").map((b) => `${b.module}::${b.name}`);
    // The reader driven on the shape the cycle produced, so the empty result below is a finding
    // about the tree rather than a reader that never returns anything.
    expect(blank([{ module: "m.ts", name: "B_BOUND", text: undefined as unknown as string }])).toEqual(["m.ts::B_BOUND"]);
    expect(blank(STATED_BOUNDS), "a bound arrived undefined, so something re-entered bounds.ts mid-evaluation").toEqual(
      [],
    );
  });
});

describe("W367 the register says what it is and what it is not", () => {
  it("argues every row it does not resolve to a quote", () => {
    for (const { bound, edge } of COMPARED_AT_W367) {
      if (edge.kind === "named") continue;
      expect(edge.why.length, `${bound} is recorded without an argument`).toBeGreaterThan(120);
    }
    // `coincides` is a judgement and is kept rare on purpose; `unsaid` is the finding and is empty
    // because the one instance was fixed rather than recorded, which is W357's lesson.
    expect(COMPARED_AT_W367.filter((c) => c.edge.kind === "coincides").length).toBeLessThan(3);
    expect(COMPARED_AT_W367.filter((c) => c.edge.kind === "unsaid")).toEqual([]);
  });

  it("holds the finding this unit fixed, in the bound rather than in a note", () => {
    // The one bound over a walk that never said what its walk missed. `acceptanceCarryingModules`
    // walks `sourceModules`, which excludes test files, so an acceptance register in one would be
    // neither swept nor reported. Fixed in the sentence, per W357: a remedy recorded is not a
    // remedy applied.
    const acceptance = STATED_BOUNDS.find((b) => b.name === "ACCEPTANCE_BOUND")!;
    expect(flatten(acceptance.text)).toContain("an acceptance register in a test file is outside the walk entirely");
    expect(flatten(acceptance.text)).toContain("W367");
  });

  it("states what a green comparison does not cover", () => {
    expect(SUBJECT_BOUND.length).toBeGreaterThan(600);
    expect(SUBJECT_BOUND).toContain("NOT THAT THE EDGE IS THE RIGHT ONE");
    expect(SUBJECT_BOUND).toContain("`coincides` IS A JUDGEMENT");
  });
});

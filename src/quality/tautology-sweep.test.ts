// W288 verify gate: "a detector over `src/**/*.test.ts` for assertions whose expected value is
// entailed by their expression, proved on a planted tautology and on a planted real assertion;
// every hit fixed or accepted with a reason."
//
// PROVED ON A PLANTED REAL ASSERTION IS THE HALF THAT MATTERS. A sweep for vacuous checks that
// flags everything reads exactly like a thorough one, and the way its list gets cleared is by
// deleting tests that work. So every shape is driven twice — once with an assertion it must flag
// and once with the nearest real assertion it must not — and the near-misses are the tree's own:
// the determinism idiom, an `indexOf` against -1, a non-emptiness claim.
//
// The walk is proved separately from the shapes, because they fail differently: a shape that
// stopped deciding reports a clean file, and a walk that stopped descending reports a clean tree.

import { describe, expect, it } from "vitest";
import { withRoot } from "./refusal-branches";
import {
  ACCEPTED_TAUTOLOGIES,
  LENGTH_PRESERVING,
  NOT_LENGTH_PRESERVING,
  NOT_A_TAUTOLOGY,
  SHAPE_ARGUMENTS,
  SWEEP_BOUND,
  type TautologyShape,
  brokenAcceptances,
  sweepTautologies,
  tautologiesIn,
  unacceptedTautologies,
} from "./tautology-sweep";

const ROOT = process.cwd();
const shapesOf = (source: string) => tautologiesIn("t.test.ts", source).map((t) => t.shape);

/** A test body with the assertion in it, so `enclosingTest` and the wrapping are exercised too. */
const body = (assertion: string, imports = "") =>
  `${imports}\nit("a test", () => {\n  ${assertion}\n});\n`;

/** The same, under a named test inside a describe — the shape `brokenAcceptances` reads bodies from. */
const wrapped = (title: string, assertion: string) =>
  `describe("d", () => {\n  it(${JSON.stringify(title)}, () => {\n    ${assertion}\n  });\n});\n`;

describe("W288 each shape fires on the tautology and stays quiet on the real assertion", () => {
  it("both sides the same constant — but not two calls of the same function", () => {
    expect(shapesOf(body("expect(true).toBe(true);"))).toEqual(["both_sides_the_same_constant"]);
    expect(shapesOf(body("expect(ROWS.length).toBe(ROWS.length);"))).toEqual([
      "both_sides_the_same_constant",
    ]);
    // THE NEAR-MISS, and it is ten real assertions in this tree. Two calls are two evaluations:
    // a clock, a counter or a random salt inside `hash` fails this, which is what it is for.
    expect(shapesOf(body("expect(hash(TEXT)).toBe(hash(TEXT));"))).toEqual([]);
    // And a comparison of two genuinely different things is not a tautology either.
    expect(shapesOf(body("expect(a.length).toBe(b.length);"))).toEqual([]);
  });

  it("typeof of an imported binding — but not of a local one", () => {
    const imported = 'import { curate } from "@/education/curation";';
    expect(shapesOf(body('expect(typeof curate).toBe("function");', imported))).toEqual([
      "typeof_of_an_imported_binding",
    ]);
    // Equally entailed and deliberately unflagged: resolving a local declaration's type is a
    // type-checker's job, and guessing at it from text is the detector W279 refused to tune.
    expect(shapesOf(body('expect(typeof code).toBe("string");', imported))).toEqual([]);
  });

  it("a lower bound a count cannot break — but not one an index can", () => {
    expect(shapesOf(body("expect(rows.length).toBeGreaterThanOrEqual(0);"))).toEqual([
      "lower_bound_a_count_cannot_break",
    ]);
    expect(shapesOf(body("expect(seen.size).toBeGreaterThan(-1);"))).toEqual([
      "lower_bound_a_count_cannot_break",
    ]);
    // `indexOf` returns -1 on a miss, so this one says "the heading exists" and fails when it does
    // not. The matcher is identical; only the subject tells them apart.
    expect(shapesOf(body("expect(text.indexOf(heading)).toBeGreaterThan(-1);"))).toEqual([]);
    // One character of the expected value away from the tautology, and a real claim about the tree.
    expect(shapesOf(body("expect(rows.length).toBeGreaterThan(0);"))).toEqual([]);
    // A rate is a division, not a count: nothing in the text says it cannot go negative.
    expect(shapesOf(body("expect(score.rate).toBeGreaterThanOrEqual(0);"))).toEqual([]);
  });

  it("reads assertions that wrap, and skips ones that are commented out", () => {
    // Line-oriented scanning drops the wrapped ones silently, which is the arriving-file failure
    // at the granularity of a statement — this tree wraps whenever a failure message is passed.
    expect(shapesOf(body("expect(\n    true,\n    `a message`,\n  ).toBe(true);"))).toEqual([
      "both_sides_the_same_constant",
    ]);
    expect(shapesOf(body("// expect(true).toBe(true);\n  expect(x).toBe(y);"))).toEqual([]);
  });

  it("takes the subject and not the failure message", () => {
    // vitest's second argument is prose, and prose that happened to be parsed as the subject would
    // classify by whatever the author wrote in it.
    expect(shapesOf(body('expect(n.length, "expect(true).toBe(true)").toBeGreaterThan(0);'))).toEqual(
      [],
    );
  });

  it("argues every shape it can decide, and decides only the shapes it argues", () => {
    const decided = new Set<TautologyShape>([
      "both_sides_the_same_constant",
      "typeof_of_an_imported_binding",
      "lower_bound_a_count_cannot_break",
      "length_preserved_by_the_operation",
    ]);
    expect(new Set(Object.keys(SHAPE_ARGUMENTS) as TautologyShape[])).toEqual(decided);
    for (const [shape, why] of Object.entries(SHAPE_ARGUMENTS)) {
      expect(why.length, `${shape} is decided without an argument`).toBeGreaterThan(120);
    }
  });
});

describe("W288 the walk notices a test file arriving", () => {
  it("finds a planted tautology in a tree that is not this one", () => {
    // The other half of the register: a shape that decides perfectly over a file list missing the
    // new file reports nothing, cleanly, forever. Planted positive and planted negative together,
    // because a walk that returned every file would pass the positive on its own.
    const found = withRoot(
      {
        "src/planted/vacuous.test.ts": body("expect(true).toBe(true);"),
        "src/planted/real.test.ts": body("expect(hash(TEXT)).toBe(hash(TEXT));"),
        "src/planted/not-a-test.ts": body("expect(true).toBe(true);"),
      },
      (root) => sweepTautologies(root),
    );
    expect(found.map((t) => t.file)).toEqual(["src/planted/vacuous.test.ts"]);
    expect(found[0]!.line, "the hit does not point at the assertion").toBe(3);
    expect(found[0]!.test).toBe("a test");
  });
});

describe("W288 every hit in this tree is fixed or accepted, and the acceptance is checked", () => {
  it("leaves nothing unaccepted", () => {
    // THE UNIT. One hit was fixed rather than accepted — `expect(typeof consoleExportFor)` in
    // W272's hardening test, a runtime check of something tsc already refuses to let through.
    const open = unacceptedTautologies(ROOT);
    expect(open.map((t) => `${t.file}:${t.line} ${t.text}`), "assertions that cannot fail").toEqual([]);
  });

  it("still finds the accepted ones, so 'nothing unaccepted' is not 'nothing found'", () => {
    // Non-vacuity: if the sweep found nothing at all, the assertion above would be trivially true
    // and would stay true through any later breakage of the detector.
    const hits = sweepTautologies(ROOT);
    expect(hits.length).toBe(ACCEPTED_TAUTOLOGIES.length);
    expect(hits.length).toBeGreaterThan(3);
  });

  it("re-derives every acceptance from the file rather than trusting the reason", () => {
    // The sharp end. Each acceptance is 'the real assertion is a `@ts-expect-error`', and that is
    // a claim about the file — checked in both directions, so an acceptance for a hit that is gone
    // fails as loudly as a reason that has rotted.
    expect(brokenAcceptances(ROOT)).toEqual([]);
    for (const entry of ACCEPTED_TAUTOLOGIES) {
      expect(entry.condition).toBe("the test's real assertion is a @ts-expect-error");
      expect(entry.why.length, `${entry.file} is accepted without a reason`).toBeGreaterThan(120);
    }
    // W304: a CEILING. Acceptances are rules switched off, so their growth is what wants noticing;
    // a floor here would have let the register fill up quietly.
    expect(ACCEPTED_TAUTOLOGIES.length, "a tautology acceptance was added").toBeLessThanOrEqual(4);
  });

  it("reports an acceptance whose reason has rotted, and one whose hit is gone", () => {
    // Driving the mechanism rather than reading it — W291's rule — and the FIRST VERSION OF THIS
    // TEST DROVE THE WRONG ARM. It planted the accepted files with a test called "a test", so the
    // hit's id never matched an acceptance and every entry came back "no longer finds it"; the
    // `@ts-expect-error` condition was never evaluated at all. Deleting that condition left the
    // whole suite green, which the break run caught and reading never would have. Both arms are
    // now driven separately, because they are separate claims with opposite remedies.
    const planted = Object.fromEntries(
      ACCEPTED_TAUTOLOGIES.map((a) => [a.file, wrapped(a.test, "expect(true).toBe(true);")]),
    );
    const rotted = withRoot(planted, (root) => brokenAcceptances(root));
    expect(rotted).toHaveLength(ACCEPTED_TAUTOLOGIES.length);
    expect(
      rotted.every((b) => b.includes("a @ts-expect-error the test no longer has")),
      `every arm should be the rotted-reason one: ${rotted.join(" | ")}`,
    ).toBe(true);

    // The other direction: the reason is intact but the hit is gone, which means the acceptance is
    // now describing a tree that has moved. A FIFTH FILE CARRIES A REAL TAUTOLOGY, so the sweep's
    // result is non-empty while none of the accepted ids are in it — otherwise "this acceptance's
    // hit exists" would be satisfied by any hit anywhere, and a lookup that ignored the id would
    // pass. And the length is pinned, because `every` over an empty list is true.
    const gone = withRoot(
      {
        ...Object.fromEntries(
          ACCEPTED_TAUTOLOGIES.map((a) => [
            a.file,
            wrapped(a.test, "// @ts-expect-error — the compile-time assertion\n    expect(x).toBe(y);"),
          ]),
        ),
        "src/planted/elsewhere.test.ts": body("expect(true).toBe(true);"),
      },
      (root) => brokenAcceptances(root),
    );
    expect(gone).toHaveLength(ACCEPTED_TAUTOLOGIES.length);
    expect(gone.every((b) => b.includes("no longer finds it"))).toBe(true);
  });
});

describe("W288 what the sweep refuses to flag is written down", () => {
  it("names every near-miss, each with the argument for leaving it alone", () => {
    // W316 added three and the title used to say five. The NAMES are the register — a count beside
    // them is the pinned-count class CR-2 named, and this one moved on the first ordinary addition
    // after it was written.
    expect(Object.keys(NOT_A_TAUTOLOGY).sort()).toEqual([
      "a_length_after_an_operation_that_drops",
      "a_length_against_a_different_collection",
      "a_lower_bound_on_a_rate",
      "a_non_emptiness_claim",
      "a_result_of_a_function_the_sweep_does_not_know",
      "an_index_compared_against_minus_one",
      "comparing_two_calls_of_the_same_function",
      "typeof_of_a_local_binding",
    ]);
    for (const [name, why] of Object.entries(NOT_A_TAUTOLOGY)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(100);
    }
  });

  it("says what a clean sweep does not prove", () => {
    // W237's rule: the sentence a green tick invites a reader to forget belongs in the export, not
    // in a comment above it.
    expect(SWEEP_BOUND).toContain("TypeScript AST");
    expect(SWEEP_BOUND.length).toBeGreaterThan(300);
  });
});

describe("W316 the length a length-preserving operation cannot change", () => {
  // The direct form and the bound form, because this tree writes the second and almost never the
  // first: the transform is named on one line and asserted about on another.
  const direct = (assertion: string) => shapesOf(body(assertion));
  const bound = (setup: string, assertion: string) =>
    shapesOf(`it("a test", () => {\n  ${setup}\n  ${assertion}\n});\n`);

  it("fires on the operation whose result cannot be shorter, written either way", () => {
    // THE UNIT. `map` returns one element per element; asking whether it dropped one is asking the
    // language, not the code under test.
    expect(direct("expect(xs.map(f).length).toBe(xs.length);")).toEqual([
      "length_preserved_by_the_operation",
    ]);
    expect(direct("expect(xs.map(f)).toHaveLength(xs.length);")).toEqual([
      "length_preserved_by_the_operation",
    ]);
    expect(bound("const ys = xs.map(f);", "expect(ys).toHaveLength(xs.length);")).toEqual([
      "length_preserved_by_the_operation",
    ]);
    expect(bound("const ys = xs.map(f);", "expect(ys.length).toBe(xs.length);")).toEqual([
      "length_preserved_by_the_operation",
    ]);
  });

  it("refuses a filter, which is the operation whose whole job is to drop elements", () => {
    // THE NEAR-MISS THE GATE NAMES. `expect(xs.filter(f)).toHaveLength(xs.length)` says the
    // predicate accepted everything, which is usually the point of the test — and a sweep that
    // assumed any method on a collection preserved length would delete exactly those.
    expect(direct("expect(xs.filter(f)).toHaveLength(xs.length);")).toEqual([]);
    expect(direct("expect(xs.filter(f).length).toBe(xs.length);")).toEqual([]);
    expect(bound("const kept = xs.filter(f);", "expect(kept).toHaveLength(xs.length);")).toEqual([]);
    for (const op of Object.keys(NOT_LENGTH_PRESERVING)) {
      expect(direct(`expect(xs.${op}(f)).toHaveLength(xs.length);`), `${op} was read as preserving`).toEqual(
        [],
      );
    }
  });

  it("refuses a length checked against a DIFFERENT collection", () => {
    // The other half of the shape, and the half a subject-only check would miss: two collections
    // being the same size is a claim about the fixtures that a wrong fixture breaks.
    expect(direct("expect(xs.map(f)).toHaveLength(ys.length);")).toEqual([]);
    expect(bound("const zs = xs.map(f);", "expect(zs).toHaveLength(ys.length);")).toEqual([]);
  });

  it("refuses the result of a function it knows nothing about, which this tree really asserts", () => {
    // `match.test.ts` says `expect(explained).toHaveLength(candidates.length)` where `explained`
    // comes from `explainPlan`. That is the claim that the explainer produces one line per
    // candidate — the assertion the unit exists to protect, not to delete.
    expect(
      bound("const explained = explainPlan(candidates, SLOTS, plan);", "expect(explained).toHaveLength(candidates.length);"),
    ).toEqual([]);
    expect(bound("const consents = await a.listConsents();", "expect(consents).toHaveLength(patients.length);")).toEqual(
      [],
    );
  });

  it("declares the operations it trusts and the ones it refuses, each argued", () => {
    // Declared rather than guessed is the gate's own wording, and the register of what is ABSENT is
    // where the next author will look first.
    for (const [op, why] of Object.entries(LENGTH_PRESERVING)) {
      expect(why.length, `${op} is trusted without an argument`).toBeGreaterThan(80);
    }
    for (const [op, why] of Object.entries(NOT_LENGTH_PRESERVING)) {
      expect(why.length, `${op} is refused without an argument`).toBeGreaterThan(80);
    }
    // No operation may be in both lists, which is the one way this register could contradict itself
    // — and the check is shown FINDING a collision before it is trusted to report none, because an
    // empty list from a comparison nobody has seen fire is W293's whole subject.
    const overlap = (a: Readonly<Record<string, string>>, b: Readonly<Record<string, string>>) =>
      Object.keys(a).filter((op) => op in b);
    expect(overlap(LENGTH_PRESERVING, NOT_LENGTH_PRESERVING), "an operation is declared both ways").toEqual(
      [],
    );
    expect(overlap({ map: "a" }, { map: "b" }), "the overlap check cannot see a collision").toEqual(["map"]);
    expect(Object.keys(LENGTH_PRESERVING).length).toBeGreaterThan(4);
  });

  it("follows one hop and says so, rather than half-following two", () => {
    // The bound, driven. A second assignment is invisible — stated in `SWEEP_BOUND` rather than
    // implemented badly, because tracking assignments through a file is a type-checker's job.
    expect(bound("const ys = xs.map(f);\n  const zs = ys;", "expect(zs).toHaveLength(xs.length);")).toEqual([]);
    expect(SWEEP_BOUND).toContain("ONE hop");
  });

  it("finds one planted in a tree, so the shape is not only decidable in a string", () => {
    // W267's split: a shape that decides perfectly over a file list missing the new file reports a
    // clean tree forever. This tree contains no instance of the class, which is exactly why the
    // walk has to be shown one arriving.
    const found = withRoot(
      {
        "src/planted/preserved.test.ts": body("expect(xs.map(f)).toHaveLength(xs.length);"),
        "src/planted/dropped.test.ts": body("expect(xs.filter(f)).toHaveLength(xs.length);"),
      },
      (root) => sweepTautologies(root),
    );
    expect(found.map((t) => t.file)).toEqual(["src/planted/preserved.test.ts"]);
    expect(found[0]!.shape).toBe("length_preserved_by_the_operation");
  });
});

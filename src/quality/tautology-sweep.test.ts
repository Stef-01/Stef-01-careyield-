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
    expect(ACCEPTED_TAUTOLOGIES).toHaveLength(4);
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
  it("names the five near-misses, each with the argument for leaving it alone", () => {
    expect(Object.keys(NOT_A_TAUTOLOGY).sort()).toEqual([
      "a_lower_bound_on_a_rate",
      "a_non_emptiness_claim",
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

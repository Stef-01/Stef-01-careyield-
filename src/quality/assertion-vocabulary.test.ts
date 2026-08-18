// W323 verify gate: "the ways this tree currently spells the same assertion enumerated from the
// suite, one form chosen, the rest converted, and a planted variant reported."
//
// THE PLANTED VARIANT IS THE HALF THAT MATTERS. A register listing six spellings proves nothing
// about a scan that recognises one — and four of the six appear nowhere in this tree, so finding
// them is not available as evidence. Each form is planted as source and the scan must return it,
// each near miss is planted and the scan must refuse it, and the negatives are what make the
// positives mean anything.

import { describe, expect, it } from "vitest";
import {
  CANONICAL,
  NON_EMPTY_FORMS,
  NOT_THIS_CLAIM,
  VOCABULARY_BOUND,
  emptinessSpellings,
  formsIn,
  nonEmptyClaims,
  vocabularyDefects,
  CANONICAL_EMPTY,
  EMPTY_FORMS,
  NOT_A_COLLECTION,
  NOT_EMPTINESS,
  emptinessDefects,
  emptyFormsIn,
  throwSpellings,
} from "./assertion-vocabulary";
import { evidenceReport } from "./empty-list-sweep";
import { withRoot } from "./refusal-branches";

const ROOT = process.cwd();

describe("W323 one way to say a list is non-empty", () => {
  it("finds no claim spelled any other way", () => {
    // THE UNIT. Eight sites when this was written — five `not.toEqual([])`, three
    // `not.toHaveLength(0)` — every one of them converted here.
    expect(vocabularyDefects(ROOT), "a list said to be non-empty in some other spelling").toEqual([]);
  });

  it("is not vacuous: the tree really does make this claim, in the canonical form, everywhere", () => {
    // The failure this guards is the one that makes every sweep in this tree worthless: a scan
    // that returns nothing reports a clean tree and an empty tree identically.
    const claims = nonEmptyClaims(ROOT);
    expect(claims.length, "the scan found no non-emptiness claim at all").toBeGreaterThan(100);
    expect([...new Set(claims.map((c) => c.form))]).toEqual([CANONICAL]);
  });

  it("recognises every spelling it declares, planted rather than found", () => {
    // Four of the six are in no test file, and a declared form nobody has run the scan over is a
    // form that will not be recognised the day somebody writes it.
    for (const form of NON_EMPTY_FORMS) {
      expect(formsIn(form.planted), `${form.id} is declared and the scan does not read it`).toEqual([
        form.id,
      ]);
    }
  });

  it("refuses every near miss, which is what makes the recognition mean something", () => {
    // W292'S DISCRIMINATING PAIRS. The second entry is not hypothetical: the first draft of
    // `formOf` matched `xs.every((x) => x.f.length > 0)` on `.length >` in the subject, and that
    // claim is TRUE of an empty list.
    for (const miss of NOT_THIS_CLAIM) {
      expect(formsIn(miss.planted), `a shape that is not this claim was read as one`).toEqual([]);
    }
    // The ceiling written out here as well as declared, because W292's citation has to resolve to a
    // test that PLANTS its negative — a loop over an imported register reads as coverage and plants
    // nothing this file holds. Same subject and same shape as the canonical form, and it permits
    // zero, so a scan that read the subject and skipped the matcher would reverse it.
    expect(formsIn("expect(xs.length).toBeLessThan(3);")).toEqual([]);
  });

  it("reports a variant planted in the canonical form's place", () => {
    // The gate's last clause, driven end to end: the same assertion in a non-canonical spelling,
    // beside the canonical one, and only the first is reported.
    const planted = `
      it("t", () => {
        expect(rows.length).toBeGreaterThan(0);
        expect(rows).not.toHaveLength(0);
      });
    `;
    expect(formsIn(planted)).toEqual([CANONICAL, "not toHaveLength(0)"]);
  });

  it("argues every form and every near miss, and no two forms share an id", () => {
    for (const form of NON_EMPTY_FORMS) {
      expect(form.why.length, `${form.id} is a spelling nobody argued`).toBeGreaterThan(150);
      expect(form.planted, `${form.id} plants nothing`).toContain("expect(");
    }
    for (const miss of NOT_THIS_CLAIM) {
      expect(miss.why.length, `${miss.planted} is a near miss nobody argued`).toBeGreaterThan(150);
    }
    const ids = NON_EMPTY_FORMS.map((f) => f.id);
    expect([...new Set(ids)], "two forms share an id").toHaveLength(ids.length);
    expect(ids).toContain(CANONICAL);
  });

  it("can be pointed at a different canonical form, so the choice is an argument and not a weld", () => {
    // W289'S SHAPE. A comparison welded to one constant cannot be shown to reject anything: hand
    // it a different canonical form and every site in the tree must be reported.
    const other = vocabularyDefects(ROOT, "not equal []");
    expect(other.length, "the canonical form is welded in, so nothing here is proved").toBeGreaterThan(
      100,
    );
    expect(other.every((d) => d.what.includes("`not equal []`"))).toBe(true);
  });

  it("reads each spelling of the OPPOSITE claim apart, which is what the bound's predicate turns on", () => {
    // `VOCABULARY_BOUND` stays true while emptiness is still written several ways, and W297 drives
    // that predicate to false against a constructed tree. Planted one spelling at a time, because
    // a derivation that collapsed two of them would still report "more than one" over this tree
    // and the predicate would look alive while measuring something else.
    const only = (body: string) =>
      withRoot({ "src/planted/e.test.ts": `it("t", () => { ${body} });\n` }, (root) =>
        emptinessSpellings(root),
      );
    expect(only("expect(xs.length).toBe(0);")).toEqual(["count is 0"]);
    expect(only("expect(xs).toHaveLength(0);")).toEqual(["toHaveLength(0)"]);
    expect(only("expect(xs).toEqual([]);")).toEqual(["equal []"]);
    // And the negations are the claim this unit normalised, not this one.
    expect(only("expect(xs).not.toHaveLength(0);")).toEqual([]);
    // AND THE TREE NOW HOLDS ONE, which is what W336 did and what closed this predicate. The
    // spelling-by-spelling drives above are what keep the derivation honest afterwards: a scan
    // that had stopped reading two of the three forms would report the same single answer.
    expect(emptinessSpellings(ROOT)).toEqual(["equal []"]);
  });

  it("refuses the near misses of the OPPOSITE claim too, which nothing drove until W332", () => {
    // W332 RAN EVERY MUTANT IN THIS MODULE AND THREE SURVIVED, all in `emptinessSpellings` and all
    // the same shape: an `&&` in one of its three branches flipped to `||` and every planted input
    // gave the same answer. The positives were driven one spelling at a time and the NEGATIVES were
    // never driven at all — so each branch's second condition was load-bearing and unasserted.
    const only = (body: string) =>
      withRoot({ "src/planted/e.test.ts": `it("t", () => { ${body} });\n` }, (root) =>
        emptinessSpellings(root),
      );
    // A count with a matcher that is not an equality: the canonical NON-empty form, and reading it
    // as an emptiness claim would invert the whole register.
    expect(only("expect(xs.length).toBeGreaterThan(0);")).toEqual([]);
    // A count compared by equality to something that is not zero.
    expect(only("expect(xs.length).toBe(3);")).toEqual([]);
    // `toHaveLength` against a length that is not zero.
    expect(only("expect(xs).toHaveLength(3);")).toEqual([]);
    // An equality against a non-empty array literal.
    expect(only("expect(xs).toEqual([1]);")).toEqual([]);
    // And a matcher that is not `toHaveLength` against zero, which the second branch must refuse
    // on the MATCHER rather than on the expected value.
    expect(only("expect(xs).toBe(0);")).toEqual([]);
  });

  it("reads the two spellings of `throws` apart, which W336's predicate turns on", () => {
    // W332 RAN EVERY MUTANT IN THIS MODULE AND FOUND `throwSpellings` UNDRIVEN. W336 added it to
    // give `VOCABULARY_BOUND` a live predicate once emptiness was normalised, and nothing exercised
    // it — so flipping `=== ""` to `!== ""`, which swaps the two spellings for each other, changed
    // no answer any test read. The bound's own frontier was resting on an unasserted branch.
    const only = (body: string) =>
      withRoot({ "src/planted/t.test.ts": `it("t", () => { ${body} });\n` }, (root) =>
        throwSpellings(root),
      );
    expect(only("expect(() => f()).toThrow();")).toEqual(["throws at all"]);
    expect(only('expect(() => f()).toThrow("boom");')).toEqual(["throws with a message"]);
    // A negated throw is a claim that nothing is thrown, which is neither spelling.
    expect(only("expect(() => f()).not.toThrow();")).toEqual([]);
    // And an assertion that is not about throwing at all.
    expect(only("expect(f()).toBe(1);")).toEqual([]);
  });

  it("states what it does not cover, and moved when its remedy was built", () => {
    expect(VOCABULARY_BOUND).toContain("TWO claims");
    expect(VOCABULARY_BOUND, "the frontier is not named, so the sentence has no live predicate").toContain(
      "The nearest is throwing",
    );
    expect(VOCABULARY_BOUND.length).toBeGreaterThan(600);
  });
});

describe("W336 one way to say a thing is absent", () => {
  const only = (body: string) =>
    withRoot({ "src/planted/e.test.ts": `it("t", () => { ${body} });\n` }, (root) => emptinessDefects(root));

  it("says it one way, over the whole suite", () => {
    expect(emptinessDefects(ROOT)).toEqual([]);
  });

  it("reports a planted variant, one spelling at a time", () => {
    // W292's discrimination: each non-canonical form planted alone, so a scan that had collapsed
    // two of them would still report something and look alive while measuring one thing.
    expect(only("expect(xs).toHaveLength(0);").map((d) => d.what)).toEqual([
      "says a collection is empty as `toHaveLength(0)`, and this tree says it as `equal []`",
    ]);
    expect(only("expect(xs.length).toBe(0);").map((d) => d.what)).toEqual([
      "says a collection is empty as `count is 0`, and this tree says it as `equal []`",
    ]);
    expect(only("expect(xs).toEqual([]);"), "the canonical form is reported as a variant").toEqual([]);
  });

  it("refuses the shapes that are not this claim, each planted", () => {
    for (const near of NOT_EMPTINESS) {
      expect(only(near.planted), `${near.planted} was counted as this claim`).toEqual([]);
      expect(near.why.length, `${near.planted} is refused without an argument`).toBeGreaterThan(120);
    }
  });

  it("recognises every declared form, so a register nobody uses is still driven", () => {
    for (const form of EMPTY_FORMS) {
      expect(emptyFormsIn(form.planted), `${form.id} is declared and unrecognised`).toEqual([form.id]);
      expect(form.why.length, `${form.id} is declared without an argument`).toBeGreaterThan(80);
    }
    expect(EMPTY_FORMS[0]!.id, "the canonical form is not the one listed first").toBe(CANONICAL_EMPTY);
  });

  it("excuses a `.length` that is not a collection's, and only where it is argued", () => {
    // A FUNCTION HAS A `.length` TOO. `scopes.test.ts` asserts the arity of `grantedScopes`, and
    // the first run of this conversion rewrote it into a comparison between a function and an
    // empty array — a passing test broken to satisfy a vocabulary. Nothing in the source tells
    // the two apart, so the exceptions are named and both directions are checked.
    for (const [site, why] of Object.entries(NOT_A_COLLECTION)) {
      expect(why.length, `${site} is excused without an argument`).toBeGreaterThan(120);
    }
    // Both directions: with the exception dropped, the site is reported again.
    expect(emptinessDefects(ROOT, CANONICAL_EMPTY, {}).map((d) => d.site)).toEqual(
      Object.keys(NOT_A_COLLECTION),
    );
  });

  it("shares one definition of the claim with the bound's predicate", () => {
    // The two derivations disagreed before this unit: the older `emptinessSpellings` counted the
    // arity site the newer reading excludes, so the bound's predicate would have stayed open
    // while the register said the tree was clean.
    expect(emptinessSpellings(ROOT)).toEqual([CANONICAL_EMPTY]);
    expect(emptinessSpellings(ROOT, {}), "the exception list is not read by both").toContain("count is 0");
  });

  it("hands the emptiness register the spelling it could not see", () => {
    // W293'S GAP, WHICH IS WHY THIS UNIT IS WORTH MORE THAN A CONVERSION. `isEmptyList` knew
    // `toEqual([])` and `toHaveLength(0)` and not the count form, so assertions spelled that way
    // had never been asked for evidence at all.
    const seen = withRoot(
      { "src/planted/e.test.ts": 'it("t", () => { expect(rows.length).toBe(0); });\n' },
      (root) => evidenceReport(root).hits.map((h) => h.file),
    );
    expect(seen, "the count spelling is invisible to the emptiness register again").toContain(
      "src/planted/e.test.ts",
    );
  });
});

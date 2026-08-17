// W278 verify gate: "rendered output linted against fixtures rather than by export name, checked
// in both directions against a declared surface; a string added to a render function and to no
// export fails."
//
// THE LAST CLAUSE IS THE TEST OF THE WHOLE UNIT and it is driven directly: a sentence is planted
// inside a render function's body — exported from nothing — and the sweep has to find it. W200's
// register cannot, by construction, because it iterates exported VALUES.
//
// The fixture half is bounded and the bound is asserted rather than described: five of eighteen
// are called with real inputs, and `FIXTURE_BOUND` has to say so, because a green result over five
// reads as a green result over eighteen to anybody who does not count.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCEPTED_COMPOSED_FINDINGS,
  COMPOSED_COPY_SITES,
  FIXTURE_BOUND,
  REFUSED_COMPOSED_SHAPES,
  composingFunctions,
  proseLiteralsIn,
  unacceptedComposed,
} from "./composed-copy";
import { lintEducationCopy } from "@/education/advice-lint";
import { orderingBasis } from "@/directory/search";
import { describeAsk } from "@/outcomes/dashboard";
import { renderForecast } from "@/capacity/forecast";
import { renderOpening } from "@/capacity/opening";
import { feeCaveat } from "@/directory/fees";

const ROOT = path.resolve(__dirname, "../..");
const key = (s: { module: string; fn: string }) => `${s.module}::${s.fn}`;

describe("W278 the composing functions are found, not listed", () => {
  it("agrees with the declared surface in both directions", () => {
    // A nineteenth arrives failing; an entry whose function stopped composing is stale. Neither is
    // visible from one side.
    const found = composingFunctions(ROOT).map(key).sort();
    const declared = [...COMPOSED_COPY_SITES].map(key).sort();
    expect(found).toEqual(declared);
    expect(found).toHaveLength(23);
  });

  it("finds W200's own named example", () => {
    // The bound W200 states about itself names `search.ts`'s "Ordered by …". If this sweep did not
    // reach it, it would not be closing the thing it claims to close.
    expect(composingFunctions(ROOT).map(key)).toContain("src/directory/search.ts::orderingBasis");
  });

  it("describes what every site composes", () => {
    for (const site of COMPOSED_COPY_SITES) {
      expect(site.composes.length, `${key(site)} is declared without a description`).toBeGreaterThan(40);
    }
    expect(new Set(COMPOSED_COPY_SITES.map(key)).size).toBe(COMPOSED_COPY_SITES.length);
  });

  it("separates prose from identifiers, which is what the word count is for", () => {
    // Non-vacuity for the detector: it must NOT be finding every string-returning function. The
    // declared copy surfaces hold seventy of those and eighteen of them compose sentences.
    const composing = new Set(composingFunctions(ROOT).map(key));
    expect(composing.has("src/directory/disclosure.ts::declaredFields")).toBe(false);
    expect(composing.has("src/quality/tree-walks.ts::sourceModules")).toBe(false);
    expect(composing.size).toBeLessThan(30);
  });
});

describe("W278 every prose literal in every composing function is linted", () => {
  it("finds literals to lint, and they are sentences", () => {
    // Before the clean result means anything: a sweep that extracted nothing would pass.
    const all = COMPOSED_COPY_SITES.flatMap((site) => proseLiteralsIn(ROOT, site));
    expect(all.length).toBeGreaterThan(40);
    for (const literal of all) expect(literal.split(" ").length).toBeGreaterThan(3);
  });

  it("reaches the sentence W200 never could", () => {
    const literals = proseLiteralsIn(ROOT, {
      module: "src/directory/search.ts",
      fn: "orderingBasis",
    });
    expect(literals.some((l) => l.includes("not a ranking"))).toBe(true);
  });

  it("passes the advice rules on every one of them, bar what is accepted", () => {
    const findings = COMPOSED_COPY_SITES.flatMap((site) =>
      proseLiteralsIn(ROOT, site).flatMap((text) =>
        lintEducationCopy(text).map((v) => ({ ...site, rule: v.rule, match: v.match })),
      ),
    );
    expect(
      unacceptedComposed(findings).map((f) => `${f.module}::${f.fn} ${f.rule}: "${f.match}"`),
    ).toEqual([]);
    // Non-vacuity: the sweep DID produce a finding, so the clean result is an acceptance holding
    // rather than a sweep that found nothing.
    expect(findings.length).toBeGreaterThan(0);
  });

  it("keeps every acceptance live, with a date — both directions", () => {
    // W102's stale direction, on acceptances: one for a finding the sweep no longer produces reads
    // as coverage while quietly permitting something else. And W210's rule on the date.
    const produced = COMPOSED_COPY_SITES.flatMap((site) =>
      proseLiteralsIn(ROOT, site).flatMap((text) =>
        lintEducationCopy(text).map((v) => `${key(site)} ${v.rule} ${v.match}`),
      ),
    );
    for (const accepted of ACCEPTED_COMPOSED_FINDINGS) {
      expect(
        produced,
        `${accepted.module}::${accepted.fn} accepts a finding the sweep no longer produces`,
      ).toContain(`${accepted.module}::${accepted.fn} ${accepted.rule} ${accepted.match}`);
      expect(accepted.reviewBy, "an acceptance with no review date").toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(accepted.why.length, "an acceptance with no argument").toBeGreaterThan(200);
    }
    expect(ACCEPTED_COMPOSED_FINDINGS.length).toBe(1);
  });

  it("subtracts comments, or a QUOTED phrase inside one is extracted as copy", () => {
    // W198's collision, ninth instance — and this assertion had to be corrected before it could
    // fire. It first pointed at `describeAsk`, whose comment contains no quotation marks, so the
    // extractor could never have picked it up and removing the comment-stripping changed nothing:
    // a test that could not fail, guarding a line that turned out to be load-bearing elsewhere.
    //
    // `feeCaveat`'s comment carries the phrase "not what you will pay" IN QUOTES, explaining the
    // wording it must avoid. Unstripped, the extractor lifts the explanation and lints the tree's
    // own reasoning about copy as though it were copy.
    const site = { module: "src/directory/fees.ts", fn: "feeCaveat" };
    const literals = proseLiteralsIn(ROOT, site);
    expect(literals.length, "nothing was extracted, so this proves nothing").toBeGreaterThan(0);
    expect(
      literals.some((l) => l.includes("not what you will pay")),
      "a quoted phrase from a comment was extracted as copy",
    ).toBe(false);
    // And the phrase really is in the file, so the absence above is subtraction rather than luck.
    expect(readFileSync(path.join(ROOT, site.module), "utf8")).toContain('"not what you will pay"');
  });
});

describe("W278 a string added to a render function and to no export fails", () => {
  it("finds a planted sentence that nothing exports", () => {
    // THE GATE'S OWN SENTENCE, DRIVEN. The plant goes inside a function body — exported from
    // nothing — so W200's register cannot see it by construction, and this one must.
    //
    // PLANTED IN A COPY OF THE TREE, NOT IN THE TREE. W267's harness made the same choice and gave
    // the reason: half this tree's registers scan for exactly the kind of thing a probe is, so a
    // probe left behind by an interrupted run fails four other suites while looking like a real
    // defect. A `finally` that restores the file is not the same as never writing to it.
    const copy = mkdtempSync(path.join(tmpdir(), "w278-"));
    try {
      cpSync(path.join(ROOT, "src"), path.join(copy, "src"), { recursive: true });
      const file = path.join(copy, "src", "directory", "search.ts");
      const original = readFileSync(file, "utf8");
      const planted = original.replace(
        "export function orderingBasis(): string {",
        'export function orderingBasis(): string {\n  const planted = "We recommend you should start this treatment immediately today";\n  void planted;',
      );
      expect(planted, "the plant did not apply").not.toEqual(original);
      writeFileSync(file, planted, "utf8");

      const site = { module: "src/directory/search.ts", fn: "orderingBasis" };
      // Before: the tree's own copy of this function has no such sentence.
      //
      // "recommend" WOULD HAVE BEEN THE WRONG PROBE and this assertion caught it: the real
      // sentence is "This is not a ranking and not a recommendation", so a substring check on
      // `recommend` matches the tree's own copy and the before/after pair proves nothing. The
      // probe is a phrase that appears only in the plant.
      const PROBE = "immediately today";
      expect(proseLiteralsIn(ROOT, site).some((l) => l.includes(PROBE))).toBe(false);
      // After: the sweep pointed at the planted tree finds it, and the rules refuse it.
      const literals = proseLiteralsIn(copy, site);
      expect(literals.some((l) => l.includes(PROBE))).toBe(true);
      expect(
        literals.flatMap((text) => lintEducationCopy(text)).length,
        "the planted sentence passed the advice rules",
      ).toBeGreaterThan(0);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });
});

describe("W278 five of them are called, and the output is linted", () => {
  /** Real inputs only: refusal paths and declared vocabulary, which is what these say when empty. */
  const rendered: Array<{ site: string; text: string }> = [
    { site: "src/directory/search.ts::orderingBasis", text: orderingBasis() },
    { site: "src/outcomes/dashboard.ts::describeAsk", text: describeAsk("referral_written") },
    { site: "src/outcomes/dashboard.ts::describeAsk", text: describeAsk("not_a_declared_kind") },
    {
      site: "src/capacity/forecast.ts::renderForecast",
      text: renderForecast({ ok: false, errors: ["too_few_recorded_weeks", "no_slots_offered"] }),
    },
    {
      site: "src/capacity/opening.ts::renderOpening",
      text: renderOpening({ ok: false, errors: ["forecaster_never_scored"] }),
    },
    {
      site: "src/directory/fees.ts::feeCaveat",
      text: feeCaveat({ practiceId: "prac-1", lines: [], statedOn: "2026-08-14" }),
    },
  ];

  it("renders something on every fixture", () => {
    // A function returning "" would pass every lint below.
    for (const { site, text } of rendered) {
      expect(text.length, `${site} rendered nothing`).toBeGreaterThan(0);
    }
    expect(rendered.filter((r) => r.text.split(" ").length > 5).length).toBeGreaterThan(3);
  });

  it("passes the advice rules on the composed output, not just the literals", () => {
    // The half the literal sweep cannot do: `Ranked by ${basis}` has no offending literal at all,
    // and the offence appears only once the pieces are joined.
    const findings = rendered.flatMap(({ site, text }) =>
      lintEducationCopy(text).map((v) => `${site} ${v.rule}: "${v.match}"`),
    );
    expect(findings).toEqual([]);
  });

  it("still fires on composed text that breaks a rule, so the clean result means something", () => {
    const composed = `Ordered by need. ${"We recommend you start treatment immediately."}`;
    expect(lintEducationCopy(composed).length).toBeGreaterThan(0);
  });

  it("states the bound, and states it in terms nothing can silently outgrow", () => {
    // W237's rule, and W288 CAUGHT THE COMMENT THAT USED TO SIT HERE: *"the number is derived, so
    // the sentence cannot drift from the fixture list."* It was not derived. The assertion pinned
    // the literal phrase "Five of the eighteen" and nothing compared "eighteen" to the register's
    // length, so when the register reached twenty the sentence was wrong and the suite was green —
    // a check that could not catch the drift it existed for, which is Q23's whole subject.
    //
    // The fix is not a bigger number. A total written into prose has to be re-typed by whoever
    // adds a site, and that is the mechanism that failed; the sentence now names the driven FIVE,
    // which is the bound it exists to state, and leaves the total to the register.
    const covered = new Set(rendered.map((r) => r.site));
    expect(covered.size).toBe(5);
    expect(FIXTURE_BOUND).toContain("Five sites are driven");
    expect(FIXTURE_BOUND, "the bound names a total the register would have to keep in step").not.toMatch(
      /\b(eighteen|nineteen|twenty|twenty-one)\b/,
    );
    expect(FIXTURE_BOUND).toContain("remedy");
  });
});

describe("W278 what the sweep refuses is written down", () => {
  it("names the seven shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_COMPOSED_SHAPES).sort()).toEqual([
      "a_hand_kept_list",
      "an_acceptance_without_a_date",
      "claiming_w200_is_now_complete",
      "counting_characters_instead_of_words",
      "fixtures_invented_to_reach_a_number",
      "scanning_the_comments_too",
      "the_literal_sweep_alone",
    ]);
    for (const [name, why] of Object.entries(REFUSED_COMPOSED_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
  });

  it("refuses to claim W200's bound is entirely closed", () => {
    // JSX prose is still unreachable by either register. Saying so is the difference between a
    // bound that moved and a bound somebody stopped mentioning.
    expect(REFUSED_COMPOSED_SHAPES.claiming_w200_is_now_complete).toContain("JSX");
  });
});

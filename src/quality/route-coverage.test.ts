// W284 verify gate: "W271's route classes checked against the page suite's own coverage in both
// directions; a route with neither an exercise nor a written reason fails."
//
// THE REFUSAL BRANCH HAS NO LIVE INSTANCE, which is the honest result and not a gap: every one of
// the fifty declared routes is opened by a named spec, so nothing needed refusing. A branch with
// no instance is a branch nobody has seen work, so it is driven on a fabricated register — the
// same shape W276 used one unit earlier, and for the same reason: a checker that can only be
// pointed at a healthy tree cannot be shown failing without breaking the tree to do it.
//
// The claims are RESOLVED rather than counted. "Spec X opens route Y" is checked against spec X,
// because a citation nobody resolves reads as coverage.

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  REFUSED_COVERAGE_SHAPES,
  ROUTE_COVERAGE,
  coverageDiff,
  coverageIsClean,
  literalProbe,
  specOpens,
  specTexts,
} from "./route-coverage";
import { discoverSurfaces } from "@/compliance/surfaces";

const ROOT = path.resolve(__dirname, "../..");

describe("W284 the checker is shown failing before it is believed", () => {
  const specs = ["landing.spec.ts"];

  it("reports a route nobody classified, and an entry for a route that is gone", () => {
    const diff = coverageDiff(ROOT, [
      { route: "/gone", exercise: { kind: "literal", spec: "landing.spec.ts" } },
    ]);
    expect(diff.stale).toEqual(["/gone"]);
    // Every real route is now undeclared, which is the other direction.
    expect(diff.undeclared.length).toBeGreaterThan(40);
    void specs;
  });

  it("reports a citation naming a spec that does not exist", () => {
    const diff = coverageDiff(ROOT, [
      { route: "/", exercise: { kind: "literal", spec: "no-such.spec.ts" } },
    ]);
    expect(diff.missingSpec).toEqual(["/ -> no-such.spec.ts"]);
  });

  it("reports a literal claim whose spec does not open the route", () => {
    // THE CHECK THAT MAKES THIS MORE THAN A LIST. `landing.spec.ts` is a real spec and it does not
    // open the console, so the citation is refused rather than counted.
    const diff = coverageDiff(ROOT, [
      { route: "/console/roi", exercise: { kind: "literal", spec: "landing.spec.ts" } },
    ]);
    expect(diff.unresolvedLiteral).toEqual(["/console/roi"]);
  });

  it("reports a refusal with no argument", () => {
    // THE GATE'S OWN CLAUSE, driven on a fabricated entry because nothing in this tree is refused.
    const diff = coverageDiff(ROOT, [
      { route: "/finder", exercise: { kind: "refused", why: "not needed" } },
    ]);
    expect(diff.refusedWithoutReason).toEqual(["/finder"]);
  });

  it("accepts a refusal that argues its case", () => {
    // The other half: a refusal is a legitimate outcome, not a failure — provided somebody wrote
    // down why a page going unopened is acceptable.
    const diff = coverageDiff(ROOT, [
      {
        route: "/finder",
        exercise: {
          kind: "refused",
          why: "A worked example of an argued refusal, long enough to be an argument rather than a shrug, which is what the sixty-character floor is there to require of a real one.",
        },
      },
    ]);
    expect(diff.refusedWithoutReason).toEqual([]);
  });
});

describe("W284 a route is not matched by one that merely starts the same way", () => {
  it("does not read /console out of /console/capacity", () => {
    // Without this, every console spec appears to exercise the console root and the register goes
    // uniformly, uselessly green.
    expect(specOpens('await page.goto("/console/capacity");', "/console")).toBe(false);
    expect(specOpens('await page.goto("/console");', "/console")).toBe(true);
    expect(specOpens('await expect(page).toHaveURL("/console?x=1");', "/console")).toBe(true);
  });

  it("matches a dynamic route on its parent, because that is how it is opened", () => {
    // `/book/[token]` is never written as `/book/[token]`; it is opened as `/book/${token}`.
    expect(literalProbe("/book/[token]")).toBe("/book/");
    expect(literalProbe("/console/setup/[step]")).toBe("/console/setup/");
    expect(literalProbe("/console/roi")).toBe("/console/roi");
    expect(specOpens("await page.goto(`/book/${token}`);", "/book/[token]")).toBe(true);
    expect(specOpens('await page.goto("/console");', "/book/[token]")).toBe(false);
  });
});

describe("W284 the page suite opens every route this app serves", () => {
  it("has nothing to report at all", () => {
    // Asserted as one object so a field added to `CoverageDiff` cannot go unchecked.
    const diff = coverageDiff(ROOT);
    expect(diff).toEqual({
      undeclared: [],
      stale: [],
      missingSpec: [],
      unresolvedLiteral: [],
      refusedWithoutReason: [],
    });
    expect(coverageIsClean(diff)).toBe(true);
  });

  it("classifies every served route exactly once", () => {
    const served = discoverSurfaces(path.join(ROOT, "app")).map((s) => s.path).sort();
    const declared = ROUTE_COVERAGE.map((r) => r.route).sort();
    expect(declared).toEqual(served);
    expect(new Set(declared).size).toBe(declared.length);
    expect(declared.length).toBeGreaterThan(45);
  });

  it("refuses nothing, and says so by having no refusal", () => {
    // The honest result. If a later unit adds a route it cannot open, this number moves and the
    // refusal has to carry its argument.
    expect(ROUTE_COVERAGE.filter((r) => r.exercise.kind === "refused")).toEqual([]);
  });

  it("names only specs that exist, and reaches most of them", () => {
    const specs = specTexts(ROOT);
    expect(specs.size).toBeGreaterThan(30);
    const cited = new Set(
      ROUTE_COVERAGE.map((r) => (r.exercise.kind === "refused" ? null : r.exercise.spec)).filter(
        (s): s is string => s !== null,
      ),
    );
    for (const spec of cited) expect(specs.has(spec), `${spec} does not exist`).toBe(true);
    // Non-vacuity for the register: if one spec were cited for everything, resolving the citations
    // would be checking one file.
    expect(cited.size).toBeGreaterThan(20);
  });
});

describe("W284 the two routes the first draft got wrong", () => {
  it("finds no goto CALL for /finder or /practices, which is what misled the first pass", () => {
    // THE MISTAKE, PRESERVED AS AN ASSERTION. Extracting `goto("...")` calls misses both, and the
    // first draft of this register believed that miss and classified them as reachable only
    // through an iterated surface register.
    const all = [...specTexts(ROOT).values()].join("\n");
    expect(/goto\("\/finder"\)/.test(all)).toBe(false);
    expect(/goto\("\/practices"\)/.test(all)).toBe(false);
  });

  it("finds both paths written down, in arrays a call-shaped scan cannot see", () => {
    // And the correction: they ARE written down. A whole-file scan resolves them; a call-shaped
    // one cannot, any more than W276's source scan could tell a comment from a fixture.
    const specs = specTexts(ROOT);
    expect(specs.get("a11y.spec.ts")).toContain('"/finder"');
    expect(specs.get("landing.spec.ts")).toContain('"/practices"');
    for (const route of ["/finder", "/practices"]) {
      expect(ROUTE_COVERAGE.find((r) => r.route === route)!.exercise.kind).toBe("literal");
    }
  });
});

describe("W284 what the register refuses is written down", () => {
  it("names the five shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_COVERAGE_SHAPES).sort()).toEqual([
      "a_refusal_without_an_argument",
      "counting_a_spec_that_only_asserts_a_url",
      "matching_a_route_by_prefix",
      "scanning_for_goto_calls",
      "trusting_the_citation",
    ]);
    for (const [name, why] of Object.entries(REFUSED_COVERAGE_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_COVERAGE_SHAPES.scanning_for_goto_calls).toContain("W276");
  });
});

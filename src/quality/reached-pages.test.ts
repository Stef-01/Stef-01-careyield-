// W371 verify gate: "every console route enumerated against the specs that visit it, resolved
// through the link graph rather than through route strings; a route no spec reaches is reported;
// W363's `HORIZON_DIRECTION_BOUND` remedy applied to the citation half."
//
// THE MIDDLE CLAUSE IS WHY THE ARMS BELOW ARE PLANTED RATHER THAN ASSERTED. Over this tree every
// console route is opened by some spec, so the arm the gate names reports nothing today — and an
// arm nobody has seen fire is one nobody knows the shape of. Each is driven on a constructed tree
// where the condition really holds.
//
// The planted sources are written inline, which is safe here and not everywhere: `linkTargets`
// skips `.test.` files and `routesOpened` reads `e2e/**/*.spec.ts`, so neither walk can reach this
// one. A register whose walk DID reach its own test needs W307's fixture file instead.

import { describe, expect, it } from "vitest";
import {
  REACHED_AT_W371,
  REACHED_BOUND,
  type ReachedRoute,
  consoleRoutes,
  linkTargets,
  reachedDefects,
  routesOpened,
} from "./reached-pages";
import { withTree } from "./planting";

const ROOT = process.cwd();
const ROUTES = consoleRoutes(ROOT);
const page = (body: string) => `export default function P() {\n  return ${body};\n}\n`;
const only = (route: string, rows: readonly ReachedRoute[], root = ROOT) =>
  reachedDefects(root, rows).filter((d) => d.route === route);

describe("W371 every console route says how a person arrives at it", () => {
  it("passes, over the tree as it stands", () => {
    expect(reachedDefects(ROOT)).toEqual([]);
  });

  it("derives the population from the router rather than from a list", () => {
    expect(ROUTES.length).toBeGreaterThan(25);
    expect(REACHED_AT_W371.map((r) => r.route).sort()).toEqual([...ROUTES].sort());
    // The evidence that an empty result above is a finding: the same call, on a tree nobody has
    // classified, reports every route it holds.
    expect(reachedDefects(ROOT, []).length).toBeGreaterThan(25);
    expect(reachedDefects(ROOT, []).length).toBe(ROUTES.length);
  });

  it("reports a console route nothing says anything about", () => {
    expect(only("/console/dashboard", REACHED_AT_W371.filter((r) => r.route !== "/console/dashboard"))).toEqual([
      { route: "/console/dashboard", what: "is a console route and nothing says how anybody arrives at it" },
    ]);
  });

  it("reports a row for something that is not a console route", () => {
    const orphan: ReachedRoute[] = [{ route: "/console/gone", wayIn: { kind: "walked" } }];
    expect(only("/console/gone", orphan)).toEqual([
      { route: "/console/gone", what: "is recorded here and is not a console route" },
    ]);
  });

  it("reports a route recorded as linked that nothing links to, which is how a row goes stale", () => {
    const wrong = REACHED_AT_W371.map((r) =>
      r.route === "/console/verticals" ? { route: r.route, wayIn: { kind: "walked" as const } } : r,
    );
    expect(only("/console/verticals", wrong)).toEqual([
      { route: "/console/verticals", what: "is recorded as linked and nothing in this product links to it" },
    ]);
  });

  it("reports a pinned route that has been given a link, which is the direction that catches a quiet fix", () => {
    const tree = withTree(
      {
        "app/console/page.tsx": page('<a href="/console/quiet">quiet</a>'),
        "app/console/quiet/page.tsx": page("<p>quiet</p>"),
        "e2e/quiet.spec.ts": 'test("x", async ({ page }) => { await page.goto("/console/quiet"); });\n',
      },
      (root) =>
        reachedDefects(root, [
          { route: "/console", wayIn: { kind: "walked" } },
          { route: "/console/quiet", wayIn: { kind: "no_way_in", why: "nothing links to it" } },
        ]).filter((d) => d.route === "/console/quiet"),
    );
    expect(tree).toEqual([
      {
        route: "/console/quiet",
        what: "is recorded as reachable only by URL and is now linked from app/console/page.tsx",
      },
    ]);
  });

  it("reports a route no spec navigates to, which is the clause the gate names", () => {
    const tree = withTree(
      {
        "app/console/page.tsx": page('<a href="/console/unvisited">go</a>'),
        "app/console/unvisited/page.tsx": page("<p>nobody opens this</p>"),
        // The route's path IS in a spec — in an assertion about the URL, which is the reading W284
        // takes and the reading this register does not.
        "e2e/other.spec.ts":
          'test("x", async ({ page }) => { await page.goto("/console"); await expect(page).toHaveURL("/console/unvisited"); });\n',
      },
      (root) =>
        reachedDefects(root, [
          { route: "/console", wayIn: { kind: "no_way_in", why: "planted" } },
          { route: "/console/unvisited", wayIn: { kind: "walked" } },
        ]).filter((d) => d.route === "/console/unvisited"),
    );
    expect(tree).toEqual([
      { route: "/console/unvisited", what: "is a console route no spec navigates to" },
    ]);
  });
});

describe("W371 the link graph is read in both spellings, and the walk is not the mention", () => {
  it("reads an href attribute and an href field, because the navigation uses both", () => {
    const found = withTree(
      {
        "app/console/page.tsx": page('<a href="/console/attribute">a</a>'),
        "src/console/steps.ts": 'export const STEPS = [{ href: "/console/field" }];\n',
      },
      (root) => [...linkTargets(root).keys()].sort(),
    );
    expect(found).toEqual(["/console/attribute", "/console/field"]);
  });

  it("does not read a path out of a test file, which would be the register linking itself", () => {
    const found = withTree(
      { "src/console/steps.test.ts": 'const x = { href: "/console/from-a-test" };\n' },
      (root) => [...linkTargets(root).keys()],
    );
    expect(found).toEqual([]);
  });

  it("reads a navigation and not a mention, which is the whole difference from W284", () => {
    const found = withTree(
      {
        "e2e/a.spec.ts":
          'await page.goto("/console/opened");\nawait expect(page).toHaveURL("/console/mentioned");\n// see /console/commented\n',
      },
      (root) => [...routesOpened(root)],
    );
    expect(found).toEqual(["/console/opened"]);
  });

  it("cuts a template literal at its first interpolation, so a dynamic route is its static prefix", () => {
    const found = withTree(
      { "e2e/a.spec.ts": "await page.goto(`/console/setup/${step}`);\n" },
      (root) => [...routesOpened(root)],
    );
    expect(found).toEqual(["/console/setup/"]);
  });
});

describe("W371 the finding is pinned rather than excused", () => {
  it("holds the unlinked half by name, with an argument on every row", () => {
    const unlinked = REACHED_AT_W371.filter((r) => r.wayIn.kind !== "walked");
    expect(unlinked.length, "nothing is unlinked, so the pin holds nothing").toBeGreaterThan(10);
    for (const row of unlinked) {
      expect((row.wayIn as { why: string }).why.length, `${row.route} is pinned without an argument`).toBeGreaterThan(
        80,
      );
    }
    // Two classes and both are used: a page right to have no link, and a page that is the finding.
    expect(REACHED_AT_W371.filter((r) => r.wayIn.kind === "url_only").length).toBeGreaterThan(1);
    expect(REACHED_AT_W371.filter((r) => r.wayIn.kind === "no_way_in").length).toBeGreaterThan(9);
  });

  it("states what a green run does not cover", () => {
    expect(REACHED_BOUND.length).toBeGreaterThan(600);
    expect(REACHED_BOUND).toContain("A LINK IS NOT A PATH");
    expect(REACHED_BOUND).toContain("`no_way_in` IS A JUDGEMENT ABOUT PRODUCT");
  });
});

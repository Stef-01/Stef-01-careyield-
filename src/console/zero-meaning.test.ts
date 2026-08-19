// W361 verify gate: "every zero a console page renders classified as measured, waiting or unasked,
// each resolved against what the page derives it from; a zero rendered with no class reported; no
// founder gate crossed."
//
// THE LIVE ASSERTION IS ONE LINE and the rest is about whether it can fail. A register saying every
// zero is classified is trivially green over a population the scan returns empty, so the scan is
// driven on constructed pages: a count on a screen against a count in a condition, an interpolation
// against an attribute, and markup against the imports above it. Each of those distinctions cost
// this unit a wrong population before it cost a row.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  NOT_RUN_PHRASE,
  WAITING_NOTICE,
  ZERO_CLAIMS,
  ZERO_MEANING_BOUND,
  type ZeroClaim,
  zeroDefects,
  zeroSites,
} from "./zero-meaning";
import { withTree } from "@/quality/planting";
import { WAITING_PATH } from "@/demo/path";

const ROOT = process.cwd();
const SITES = zeroSites(ROOT);

describe("W361 every zero this console renders is classified, in four directions", () => {
  it("passes, over the console as it stands", () => {
    expect(zeroDefects(ROOT)).toEqual([]);
  });

  it("derives the population from the pages rather than from a list", () => {
    expect(SITES.length).toBeGreaterThan(20);
    for (const site of SITES) expect(site.route).toMatch(/^\/console/);
    // And it is a PROPER subset of the counts the pages mention: a scan that returned every
    // occurrence would make the classification meaningless, which is what the first draft did.
    expect(SITES.some((s) => s.expression === "entries.length")).toBe(false);
  });

  it("reports a count on a page that nothing classifies", () => {
    const found = withTree(
      {
        "app/console/thing/page.tsx":
          "export default function P() {\n  return (\n    <p>{rows.length} things</p>\n  );\n}\n",
      },
      (root) => zeroDefects(root, [], zeroSites(root)),
    );
    expect(found).toEqual([
      {
        site: "/console/thing :: rows.length",
        what: "renders a count and nothing says what a zero there would mean",
      },
    ]);
  });

  it("reports a classification for a count the page no longer renders", () => {
    const gone: ZeroClaim[] = [
      { route: "/console/thing", expression: "rows.length", meaning: { kind: "measured", how: "y".repeat(120) } },
    ];
    expect(zeroDefects(ROOT, gone, [])).toEqual([
      { site: "/console/thing :: rows.length", what: "is classified here and the page no longer renders it" },
    ]);
  });

  it("reports a wait on a page that says nothing about one, which is the arm the unit came from", () => {
    const found = withTree(
      {
        "app/console/thing/page.tsx":
          "export default function P() {\n  return (\n    <p>{rows.length} on this register</p>\n  );\n}\n",
      },
      (root) =>
        zeroDefects(
          root,
          [{ route: "/console/thing", expression: "rows.length", meaning: { kind: "waiting", how: "y".repeat(120) } }],
          zeroSites(root),
        ),
    );
    expect(found).toEqual([
      { site: "/console/thing :: rows.length", what: "is called a wait and the page says nothing about a cycle" },
    ]);
  });

  it("accepts a page that says it in its own words as well as one rendering the notice", () => {
    const said = withTree(
      {
        "app/console/thing/page.tsx":
          "export default function P() {\n  return (\n    <p>{rows.length} — not counted yet</p>\n  );\n}\n",
      },
      (root) =>
        zeroDefects(
          root,
          [{ route: "/console/thing", expression: "rows.length", meaning: { kind: "waiting", how: "y".repeat(120) } }],
          zeroSites(root),
        ),
    );
    expect(said, "a page naming its own wait is reported as saying nothing").toEqual([]);
    expect(NOT_RUN_PHRASE.test("Not counted yet")).toBe(true);
    expect(NOT_RUN_PHRASE.test("Nothing recorded"), "the phrase matches any empty state").toBe(false);
  });

  it("reports a measurement claimed on a route W346 says is waiting", () => {
    const claim: ZeroClaim[] = [
      {
        route: WAITING_PATH[0]!.route,
        expression: "summary.total",
        meaning: { kind: "measured", how: "y".repeat(120) },
      },
    ];
    const found = zeroDefects(ROOT, claim, [{ route: WAITING_PATH[0]!.route, expression: "summary.total" }]);
    expect(found).toEqual([
      {
        site: `${WAITING_PATH[0]!.route} :: summary.total`,
        what: "is called a measurement on a route W346 says is waiting for its first cycle",
      },
    ]);
  });
});

describe("W361 the scan reads what a reader sees, and not what decides it", () => {
  it("tells a count on the screen from a count in a condition", () => {
    // The distinction that more than halved the population. A count only ever
    // compared against zero renders no number; there is nothing for a reader to misread.
    const found = withTree(
      {
        "app/console/thing/page.tsx":
          "export default function P() {\n  return (\n    <div>\n" +
          '      {hidden.length === 0 ? <p>Nothing</p> : <p>Some</p>}\n' +
          "      <p>{shown.length}</p>\n    </div>\n  );\n}\n",
      },
      (root) => zeroSites(root).map((s) => s.expression),
    );
    expect(found).toEqual(["shown.length"]);
  });

  it("does not read a number put into a form field the reader typed it in", () => {
    const found = withTree(
      {
        "app/console/thing/page.tsx":
          "export default function P() {\n  return (\n" +
          '    <input name="gpCount" defaultValue={assumptions.gpCount} />\n  );\n}\n',
      },
      (root) => zeroSites(root).map((s) => s.expression),
    );
    expect(found, "an attribute was read as a number on the screen").toEqual([]);
  });

  it("reads the markup and not the imports above it", () => {
    // `import { readCount } from "@/ops/silence"` was a site until this narrowing: a brace is not
    // an interpolation just because it is a brace.
    const found = withTree(
      {
        "app/console/thing/page.tsx":
          'import { readCount } from "@/ops/silence";\nconst { gapCount } = summary;\n' +
          "export default function P() {\n  return (\n    <p>{rows.length}</p>\n  );\n}\n",
      },
      (root) => zeroSites(root).map((s) => s.expression),
    );
    expect(found).toEqual(["rows.length"]);
  });

  it("finds a count behind a conditional, which is where the first fix put one", () => {
    const found = withTree(
      {
        "app/console/thing/page.tsx":
          "export default function P() {\n  return (\n" +
          '    <dd>{counted ? counts.memberCount : "Not counted yet"}</dd>\n  );\n}\n',
      },
      (root) => zeroSites(root).map((s) => s.expression),
    );
    expect(found).toEqual(["counts.memberCount"]);
  });
});

describe("W361 the register says what it is and what it is not", () => {
  it("argues every row, and says which zeroes are findings", () => {
    for (const claim of ZERO_CLAIMS) {
      const text = claim.meaning.kind === "not_a_finding" ? claim.meaning.why : claim.meaning.how;
      expect(text.length, `${claim.route} :: ${claim.expression} is classified without an argument`).toBeGreaterThan(
        120,
      );
    }
    const duplicated = (claims: readonly ZeroClaim[]): string[] => {
      const keys = claims.map((c) => `${c.route} :: ${c.expression}`);
      return keys.filter((key, i) => keys.indexOf(key) !== i);
    };
    // Driven to a duplicate first: an empty list nobody has seen fill is a check nobody has run.
    const first = ZERO_CLAIMS[0]!;
    expect(duplicated([...ZERO_CLAIMS, first]), "the duplicate check cannot see a duplicate").toEqual([
      `${first.route} :: ${first.expression}`,
    ]);
    expect(duplicated(ZERO_CLAIMS), "one site is classified twice").toEqual([]);
    // All four kinds are used, so none of them is a class nobody reached for.
    expect(new Set(ZERO_CLAIMS.map((c) => c.meaning.kind))).toEqual(
      new Set(["measured", "waiting", "unasked", "not_a_finding"]),
    );
  });

  it("holds the finding that made the unit, and the page carries the fix", () => {
    // `seedCounts` has one caller in this tree and it is the e2e mock route, so `registersFor`
    // handed every real practice the constant `NO_COUNTS` and the page rendered it as a numeral.
    const store = readFileSync(path.join(ROOT, "src/registers/store.ts"), "utf8");
    expect(store, "the store cannot say whether anybody ever ran the register").toContain("counted:");
    const page = readFileSync(path.join(ROOT, "app/console/registers/page.tsx"), "utf8");
    expect(page, "the page renders the stand-in zero as a measurement again").toContain(
      "counted ? counts.memberCount",
    );
    expect(NOT_RUN_PHRASE.test(page), "the page stopped saying what it has not done").toBe(true);
  });

  it("states what a green register does not cover", () => {
    expect(ZERO_MEANING_BOUND.length).toBeGreaterThan(600);
    expect(ZERO_MEANING_BOUND).toContain("THE CLASSIFICATION IS ARGUED, NOT DERIVED");
    expect(ZERO_MEANING_BOUND).toContain("`not_a_finding` IS THE CLASS TO WATCH");
    expect(WAITING_NOTICE).toBe("<Waiting");
  });
});

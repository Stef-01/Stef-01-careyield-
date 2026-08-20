// W384 verify gate: the console's zero states are derived from what each page RENDERS, the
// population is a strict superset of W361's expression-name one, and the gap W361's bound named —
// `/console/referrals`, whose day-two zero is a list — is closed against the derivation.

import { afterAll, describe, expect, it } from "vitest";
import path from "node:path";
import {
  RENDERED_BOUND,
  SILENT_AT_W384,
  answered,
  beyondNamedCounts,
  blockSpans,
  consolePages,
  listRenders,
  renderedZeros,
  silentDiff,
  silentZeros,
  speaks,
  ternary,
} from "./rendered-zeros";
import { zeroSites } from "./zero-meaning";
import { copyTree, withPlantedIn } from "@/quality/planting";
import { fixtureText } from "@/quality/scan-text";
import { rmSync } from "node:fs";

const ROOT = path.resolve(__dirname, "..", "..");
const COPY = copyTree(ROOT);
afterAll(() => rmSync(COPY, { recursive: true, force: true }));

const PROBE = "app/console/probe/page.tsx";

/** What the register says about a planted page, by how its one list renders its zero. */
const plantedAs = (body: string): string[] =>
  withPlantedIn(COPY, { [PROBE]: body }, () =>
    renderedZeros(COPY)
      .filter((z) => z.route === "/console/probe")
      .map((z) => `${z.subject}:${z.renderedAs}`),
  );

describe("W384 the population", () => {
  it("finds the zeros this console renders, in all three shapes", () => {
    const zeros = renderedZeros(ROOT);
    // Guard against a vacuous pass: a walk returning nothing satisfies every assertion below.
    expect(zeros.length).toBeGreaterThan(50);
    for (const kind of ["number", "empty_state", "silent"] as const) {
      expect(zeros.filter((z) => z.renderedAs === kind).length, `no ${kind} zero`).toBeGreaterThan(0);
    }
    expect(consolePages(ROOT).length).toBeGreaterThan(20);
  });

  it("folds W361's counts in whole, so this is a superset rather than a rival", () => {
    const here = new Set(renderedZeros(ROOT).map((z) => `${z.route} :: ${z.subject}`));
    const named = zeroSites(ROOT).map((s) => `${s.route} :: ${s.expression}`);
    expect(named.length).toBeGreaterThan(10);
    for (const key of named) expect(here, `${key} left the population`).toContain(key);
  });

  it("descends into nested blocks, which is where a list's answer lives", () => {
    // W361's walk skipped past each block it found. The conditional that answers a list is almost
    // always the block the list sits INSIDE, so a walk that never descends cannot see it.
    const spans = blockSpans("<p>{a ? {b} : {c}}</p>");
    expect(spans.length).toBeGreaterThan(1);
    // And an attribute is not an interpolation the reader meets.
    expect(blockSpans('<input defaultValue={x} />')).toEqual([]);
  });

  it("tells a conditional from optional chaining, and a block that is neither", () => {
    expect(ternary("a ? b : c")).toEqual({ q: 2, c: 6 });
    expect(ternary("row?.id")).toBeNull();
    expect(ternary("rows.map((r) => r.id)")).toBeNull();
  });

  it("counts words on a screen, whether they are written there or named", () => {
    expect(speaks("<p>Nothing has been recorded here yet.</p>")).toBe(true);
    expect(speaks("<p>{COPY.libraryEmpty}</p>")).toBe(true);
    expect(speaks('<ul className="flex flex-col">{rows}</ul>')).toBe(false);
  });

  it("leaves out the three list renders that are not a zero anybody meets", () => {
    const body = fixtureText("zero-probe-excluded");
    const markup = body.slice(body.indexOf("return ("));
    // A module constant cannot be empty; a subject rooted at another map's parameter belongs to
    // its row; a map that is `join`ed builds a string. What is left is the page's own list.
    expect(listRenders(body, markup).map((l) => l.subject)).toEqual(["rows"]);
    // And it is the row-rendering occurrence rather than the joined one, which comes first.
    expect(markup.slice(listRenders(body, markup)[0]!.at).startsWith("rows.map((row) => (")).toBe(true);
  });
});

describe("W384 the gap W361's bound named", () => {
  it("holds `/console/referrals`'s zero, which the expression-name population cannot", () => {
    // The whole condition, driven. W361 finds a count by what it is CALLED; referrals renders its
    // day-two emptiness as a list of rows beside a sentence, so its most important zero was
    // outside that population entirely. It is inside this one.
    const named = zeroSites(ROOT).map((s) => `${s.route} :: ${s.expression}`);
    // W361 holds ONE zero on this route — `returned.count`, a number — and that is the whole of
    // its reach here. The two the page shows a reader on day two are lists, and they are not in it.
    expect(named.filter((k) => k.startsWith("/console/referrals"))).toEqual([
      "/console/referrals :: returned.count",
    ]);
    expect(beyondNamedCounts(ROOT)).toContain("/console/referrals :: received");
    expect(beyondNamedCounts(ROOT)).toContain("/console/referrals :: sent");
  });

  it("widens the answer and not only the population", () => {
    // A register that took a wider population and reported the same things would look exactly like
    // one that closed the gap.
    expect(beyondNamedCounts(ROOT).length).toBeGreaterThan(20);
    for (const key of beyondNamedCounts(ROOT)) {
      expect(zeroSites(ROOT).map((s) => `${s.route} :: ${s.expression}`)).not.toContain(key);
    }
  });
});

describe("W384 the rule", () => {
  it("agrees with the console as it stands, in both directions", () => {
    expect(silentDiff(ROOT)).toEqual({ undeclared: [], stale: [] });
  });

  it("reports a page that renders a list and says nothing when it is empty", () => {
    expect(plantedAs(fixtureText("zero-probe-silent"))).toEqual(["rows:silent"]);
    expect(
      withPlantedIn(COPY, { [PROBE]: fixtureText("zero-probe-silent") }, () => silentDiff(COPY).undeclared),
    ).toEqual(["/console/probe :: rows"]);
  });

  it("does not report the same list once the page answers it, in either idiom this tree writes", () => {
    // The control and its two variants. A ternary links the arms structurally; a pair of `&&`
    // blocks is linked by nothing but the subject they both test, and both are how this console
    // is written.
    expect(plantedAs(fixtureText("zero-probe-ternary"))).toEqual(["rows:empty_state"]);
    expect(plantedAs(fixtureText("zero-probe-and-blocks"))).toEqual(["rows:empty_state"]);
  });

  it("reports a declaration for a list that has started speaking", () => {
    const declared = [
      ...SILENT_AT_W384,
      { route: "/console/dashboard", subject: "gone.rows", what: "no longer rendered" },
    ];
    expect(silentDiff(ROOT, declared).stale).toEqual(["/console/dashboard :: gone.rows"]);
  });

  it("reads the arm the reader gets, not whichever arm happens to speak", () => {
    // The direction that makes the reading mean anything: words in the arm shown when the list is
    // NOT empty answer nothing, because the reader never sees them at the moment they would help.
    const spans = blockSpans("{rows.length === 0 ? <p /> : <ul>Some rows{rows.map((r) => r)}</ul>}");
    const markup = "{rows.length === 0 ? <p /> : <ul>Some rows{rows.map((r) => r)}</ul>}";
    const list = listRenders(markup, markup)[0]!;
    expect(answered(markup, spans, list)).toBe(false);
  });
});

describe("W384 the silent zeros are argued", () => {
  it("names a route this console holds, and says what the reader gets instead", () => {
    const routes = new Set(consolePages(ROOT).map((p) => p.route));
    for (const row of SILENT_AT_W384) {
      expect(routes, `${row.route} is not a console page`).toContain(row.route);
      expect(row.what.length, `${row.route} :: ${row.subject} is undeclared in substance`).toBeGreaterThan(150);
    }
    expect(SILENT_AT_W384.length).toBe(silentZeros(ROOT).length);
  });
});

describe("W384 the bound", () => {
  it("says what a sibling arm cannot reach, and which exclusion is a guess", () => {
    expect(RENDERED_BOUND.length).toBeGreaterThan(600);
    expect(RENDERED_BOUND).toContain("A SIBLING ARM IS NOT THE ONLY PLACE WORDS CAN BE");
    expect(RENDERED_BOUND).toContain("ONE OF THEM IS A GUESS");
  });
});

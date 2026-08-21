// W388 verify gate: every two-part citation in the tree is attributed to a subject and required to
// point at a test that runs it — W371's shape, over the whole tree instead of one register.

import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  CITED_BOUND,
  SUBJECTS_AT_W388,
  UNRUN_AT_W388,
  citationsInTree,
  enclosingObjects,
  exportsOf,
  subjectOf,
  testBody,
  uncalledCitations,
  type FoundCitation,
} from "./cited-checks";
import { resolveCitation } from "./citations";
import { fixtureText } from "./scan-text";
import { copyTree, withPlantedIn } from "./planting";
import { afterAll } from "vitest";
import { rmSync } from "node:fs";

const ROOT = path.resolve(__dirname, "..", "..");
const PROBE = "src/quality/cite-probe.ts";

/**
 * A copy of the tree, because a citation names a REAL test file and a bare planted root holds none.
 */
const COPY = copyTree(ROOT);
afterAll(() => rmSync(COPY, { recursive: true, force: true }));

/** What the rule says about a planted register, with nothing declared for it. */
const planted = (body: string) =>
  withPlantedIn(COPY, { [PROBE]: body }, () =>
    uncalledCitations(COPY, [], citationsInTree(COPY), []).filter((d) => d.citing === PROBE),
  );

describe("W388 the population", () => {
  it("finds the citations the tree holds, and takes only the two-part ones", () => {
    const found = citationsInTree(ROOT);
    // Guard against a vacuous pass: a walk returning nothing satisfies every assertion below.
    expect(found.length).toBeGreaterThan(50);
    for (const { citation } of found) expect(citation.split(" :: ")).toHaveLength(2);
    // A THREE-PART ID IS NOT A CITATION, which is W301's distinction at a new grain — and there are
    // more of those in this tree than there are citations, so taking the separator as the
    // population would have reported a hundred and forty-five non-events.
    expect(found.some((f) => f.citing === "src/quality/empty-list-sweep.ts")).toBe(false);
    expect(found.some((f) => f.citing === "src/quality/negative-probes.ts")).toBe(true);
  });

  it("reads a subject from the row AROUND a citation, not from the row it sits in", () => {
    // The reading that found none of them: a probe row is `{ register, negative: { citation } }`,
    // so the citation's innermost object carries no subject at all.
    const code = 'const rows = [{ register: "src/quality/x.ts", negative: { citation: "src/quality/x.test.ts :: t" } }];';
    const at = code.indexOf("src/quality/x.test.ts");
    expect(enclosingObjects(code, at).length).toBeGreaterThan(1);
    expect(subjectOf(code, at)).toBe("src/quality/x.ts");
    // And a row with no module key at all gets nothing, rather than the nearest literal above it.
    const bare = 'const rows = [{ note: "x", citation: "src/quality/x.test.ts :: t" }];';
    expect(subjectOf(bare, bare.indexOf("src/quality/x.test.ts"))).toBeNull();
  });

  it("reads the body of a `describe` as readily as an `it`, which W167's rows cite", () => {
    // The bug this found in itself: `W167 two withdrawals at the same instant pick the same one` is
    // a GROUP title, and a reading that assumed `it(` walked backwards into an earlier test.
    const group = testBody(ROOT, "src/messaging/approval.test.ts", "W167 two withdrawals at the same instant");
    expect(group).not.toBeNull();
    expect(group!).toContain("evaluateSendable");
    expect(testBody(ROOT, "src/messaging/approval.test.ts", "a title nobody wrote")).toBeNull();
  });

  it("reads a module's exports, and says nothing about one that has none", () => {
    expect(exportsOf(ROOT, "src/quality/citations.ts")).toContain("resolveCitation");
    expect(exportsOf(ROOT, "src/quality/nowhere.ts")).toEqual([]);
  });
});

describe("W388 the rule", () => {
  it("is silent over the tree as it stands", () => {
    expect(uncalledCitations(ROOT)).toEqual([]);
  });

  it("reports a citation pointing at a test that runs nothing its subject exports", () => {
    const reported = planted(fixtureText("cited-probe-runs-nothing"));
    expect(reported).toHaveLength(1);
    expect(reported[0]!.what).toContain("runs nothing");
  });

  it("does not report the same shape once the cited test runs the subject", () => {
    // The control and the variant differ in WHICH TEST is cited, and nothing else. `uncalledCitations`
    // is named here rather than reached through the local helper, because a probe row elsewhere
    // cites this test and this register reads NAMING — the rule applied to its own suite.
    const seen = withPlantedIn(COPY, { [PROBE]: fixtureText("cited-probe-runs-it") }, () =>
      uncalledCitations(COPY, [], citationsInTree(COPY), []).filter((d) => d.citing === PROBE),
    );
    expect(seen).toEqual([]);
  });

  it("reports a citation whose row names no module, rather than guessing one", () => {
    const reported = planted(fixtureText("cited-probe-no-subject"));
    expect(reported).toHaveLength(1);
    expect(reported[0]!.what).toContain("sits in no row naming a module");
  });

  it("reports a declaration for a citation the tree no longer holds", () => {
    const gone = [{ citation: "src/gone.test.ts :: a title", remedy: "x" }];
    const out = uncalledCitations(ROOT, SUBJECTS_AT_W388, citationsInTree(ROOT), [
      ...UNRUN_AT_W388,
      ...gone,
    ]);
    expect(out.map((d) => d.citation)).toEqual(["src/gone.test.ts :: a title"]);
  });

  it("still walks the tree with its own module excluded, which the exclusion has to earn", () => {
    // An excluded file is a place to hide something, so the exclusion is checked: planting a
    // register into a copy still reports it, and only this module's own rows are skipped.
    const seen = planted(fixtureText("cited-probe-runs-nothing"));
    expect(seen).toHaveLength(1);
    expect(citationsInTree(ROOT).some((f) => f.citing === "src/quality/cited-checks.ts")).toBe(false);
  });
});

describe("W388 every citation in the tree resolves, which is what this unit repaired", () => {
  it("resolves every one of them under W301's own resolver", () => {
    // SEVEN DID NOT WHEN THIS UNIT STARTED, in three registers no resolver reads: `rail-y5.ts`
    // paraphrased five group titles rather than quoting them, and `order-independence.ts` carried
    // two that named assertions nobody had written. W301 consolidated the resolver and nothing
    // pointed it at these rows, which is the gap the citation register was for.
    const unresolved = citationsInTree(ROOT)
      .map((f) => ({ f, result: resolveCitation(ROOT, f.citation) }))
      .filter(({ result }) => result !== true);
    expect(unresolved.map(({ f }) => `${f.citing}: ${f.citation}`)).toEqual([]);
  });

  it("would say so if one stopped resolving, so the sweep above is not silent for want of a subject", () => {
    expect(resolveCitation(ROOT, "src/quality/planting.test.ts :: a title nobody wrote")).toContain(
      "does not contain",
    );
  });
});

describe("W388 the declared rows are argued", () => {
  it("gives every unrun citation the change that would make it callable", () => {
    expect(UNRUN_AT_W388.length).toBeGreaterThan(5);
    const held = new Set(citationsInTree(ROOT).map((f) => f.citation));
    for (const row of UNRUN_AT_W388) {
      expect(held, `${row.citation} is declared and not held`).toContain(row.citation);
      expect(row.remedy.length, `${row.citation} is named without a change`).toBeGreaterThan(80);
    }
  });

  it("argues every subject it had to read by hand, and holds all three dispositions", () => {
    const held = new Set(citationsInTree(ROOT).map((f) => f.citation));
    for (const row of SUBJECTS_AT_W388) {
      expect(held, `${row.citation} is declared and not held`).toContain(row.citation);
      if (row.subject.kind !== "module") {
        expect(row.subject.why.length, `${row.citation} is disposed without a reason`).toBeGreaterThan(120);
      }
    }
    const kinds = new Set(SUBJECTS_AT_W388.map((r) => r.subject.kind));
    expect([...kinds].sort()).toEqual(["module", "no_module", "not_a_citation"]);
  });
});

describe("W388 the bound", () => {
  it("says that naming is not calling, and what a harness costs it", () => {
    expect(CITED_BOUND.length).toBeGreaterThan(600);
    expect(CITED_BOUND).toContain("naming is not calling");
    expect(CITED_BOUND).toContain("A THREE-PART ID " + "IS OUT OF THE POPULATION BY DEFINITION");
  });
});

/** Kept so the type is used where the suite reads a found citation's shape. */
export type _Found = FoundCitation;

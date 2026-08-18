// W287 verify gate: "`src/console/zero-states.ts` and its test read through the three lenses;
// every finding disposed with a date, and the hardening register's own `not reviewed` list is
// shortened by exactly this unit."
//
// The detector that produced the finding is proved in both directions against the real tree — one
// route must be reported and the other twenty-six must NOT — because "one route reaches disk" and
// "the scan only ever finds one thing" look identical from a green suite.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FALLIBLE_READS,
  FINDINGS,
  REVIEW_SCOPE,
  REVIEWED,
  fallibleConsoleReads,
  fallibleDiff,
} from "./review-w279";
import { CONSOLE_ZERO_STATES, REFUSED_ZERO_SHAPES, RUNTIME_BOUND, ZERO_STATE_COPY } from "@/console/zero-states";
import { NOT_REVIEWED, REVIEWED_BY_LATER_UNIT, unaccountedUnits, undisposed } from "./hardening-q22";
import { knownUnits } from "./unit-headers";

const ROOT = path.resolve(__dirname, "../..");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

describe("W287 every finding is disposed, with a date and a lens", () => {
  it("disposes all of them", () => {
    expect(undisposed(FINDINGS)).toEqual([]);
    for (const finding of FINDINGS) {
      expect(finding.raisedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(finding.unit, "a finding of this review blames another unit").toBe("W279");
      expect(finding.what.length).toBeGreaterThan(80);
    }
  });

  it("runs all three lenses over the unit it names", () => {
    expect([...new Set(FINDINGS.map((f) => f.lens))].sort()).toEqual([
      "code-review",
      "security-review",
      "simplify",
    ]);
    expect(knownUnits(LEDGER).has(Number(REVIEWED.unit.slice(1)))).toBe(true);
    expect(REVIEWED.commit).toMatch(/^[0-9a-f]{7,40}$/);
  });

  it("says what it read and what it deliberately did not", () => {
    // W285's lesson about range: a review that does not bound itself claims its dependencies too.
    expect(REVIEW_SCOPE).toMatch(/does NOT re-review/);
    expect(REVIEW_SCOPE).toMatch(/zero-states/);
  });

  it("defers nothing any more, because the one thing it would not do has been done", () => {
    // IT SAID `W288+` FOR THIRTY-ONE UNITS. W318 retyped the field so a range could not be
    // written, which forced it onto W334; W334 built the read it was waiting for, and the
    // disposition moved to `fixed` rather than to another unit. What this test now guards is that
    // nothing quietly goes back to deferred without a unit that exists to be deferred to.
    expect(FINDINGS.filter((f) => f.disposition.kind === "deferred")).toEqual([]);
    const answered = FINDINGS.find((f) => f.id === "W279-CR-2")!;
    expect(answered.disposition.kind).toBe("fixed");
    expect(answered.disposition.kind === "fixed" && answered.disposition.by).toBe("W334");
  });
});

describe("W287 the finding, measured against the import graph", () => {
  it("finds exactly one console route whose read reaches disk", () => {
    // The claim W279 made four times was a universal, so one counterexample settles it. Named
    // rather than counted: a count goes green again the day somebody adds another.
    expect(fallibleConsoleReads(ROOT)).toEqual(["/console/interest"]);
  });

  it("agrees with the register in both directions", () => {
    expect(fallibleDiff(ROOT)).toEqual({ undeclared: [], stale: [], withoutRemedy: [] });
    expect(Object.keys(FALLIBLE_READS)).toEqual(["/console/interest"]);
  });

  it("is not a scan that reports everything, proved on the routes that are in memory", () => {
    // Non-vacuity in the direction that matters. A detector answering "yes" for every route would
    // satisfy the assertion above only by accident of there being one entry, and would make the
    // register's both-directions check meaningless the moment a second route was declared.
    const inMemory = CONSOLE_ZERO_STATES.map((r) => r.route).filter((r) => r !== "/console/interest");
    expect(inMemory.length).toBeGreaterThan(20);
    const fallible = new Set(fallibleConsoleReads(ROOT));
    for (const route of inMemory) {
      expect(fallible.has(route), `${route} was reported as reading from disk`).toBe(false);
    }
  });

  it("reads each page's OWN closure, not the whole app's", () => {
    // The distinction the finding rests on: `reachableFromApp` says the app touches `node:fs` —
    // trivially true, and useless here. Per-route is what makes "this page's read can fail"
    // answerable, which is why W271 extracted `reachableFrom`.
    // Asserted on the IMPORT rather than on the absence of a word: this module's own prose
    // explains why `reachableFromApp` is the wrong walker here, so a scan for the name matches the
    // sentence banning it. W198's remedy — assert the structure, not the absence of a phrase.
    const self = readFileSync(path.join(__dirname, "review-w279.ts"), "utf8");
    expect(self).toContain("reachableFrom(root, [page])");
    expect(self).toMatch(/import \{ reachableFrom \} from "@\/security\/reachability"/);
  });
});

describe("W287 the false universal is corrected everywhere it was stated", () => {
  it("names the exception at all four sites that stated the universal", () => {
    // It was stated four times, so a correction applied to one leaves three quotable. Asserted as
    // PRESENCE of the exception rather than absence of the old sentence: each correction quotes
    // the claim it corrects — that is what makes it legible — so a scan for the old wording
    // matches the sentence retracting it. The recurring collision, and W198's remedy for it.
    const module = readFileSync(path.join(ROOT, "src/console/zero-states.ts"), "utf8");
    const spec = readFileSync(path.join(ROOT, "src/console/zero-states.test.ts"), "utf8");
    for (const [name, text] of [
      ["the module header", module.slice(0, module.indexOf("import type"))],
      ["the test", spec],
      ["RUNTIME_BOUND", RUNTIME_BOUND],
      ["the refusal", REFUSED_ZERO_SHAPES.declaring_could_not_load_everywhere ?? ""],
    ] as const) {
      expect(text, `${name} still states the universal without its exception`).toContain("W287");
      expect(text, `${name} does not name the route that disproves it`).toContain("/console/interest");
    }
  });

  it("names the exception where the universal used to be", () => {
    expect(RUNTIME_BOUND).toContain("/console/interest");
    expect(REFUSED_ZERO_SHAPES.declaring_could_not_load_everywhere).toContain("/console/interest");
    const interest = CONSOLE_ZERO_STATES.find((r) => r.route === "/console/interest")!;
    expect(interest.why, "the route still argues from where the data comes from").toMatch(/READ goes/);
  });

  it("upheld the refusal until the remedy existed, and then the remedy arrived", () => {
    // THE CONCLUSION HELD FOR AS LONG AS ITS REASON DID, which is the strongest thing a refusal
    // can do. W287 narrowed the argument, W279 declined to declare a state the page could not
    // render, and W334 built the read — so the declaration is now the true one rather than a
    // paper trail. What is checked here is the ORDER: the route declares it, and the remedy the
    // refusal named is the one that was built.
    expect(CONSOLE_ZERO_STATES.filter((r) => r.states.includes("could_not_load")).map((r) => r.route)).toEqual([
      "/console/interest",
    ]);
    expect(FALLIBLE_READS["/console/interest"]).toContain("REMEDY:");
  });

  it("keeps the copy register immutable, which was the simplify finding", () => {
    const module = readFileSync(path.join(ROOT, "src/console/zero-states.ts"), "utf8");
    expect(module).toContain("ZERO_STATE_COPY: Readonly<Record<ZeroState, CauseCopy>>");
    // And the union-keyed shape it was written for still holds: every state has copy.
    expect(Object.keys(ZERO_STATE_COPY).sort()).toEqual([
      "could_not_load",
      "nothing_arrived",
      "nothing_yet",
    ]);
  });
});

describe("W287 the hardening register's not-reviewed list is shortened by exactly this unit", () => {
  it("no longer lists W279, and still lists the two that remain", () => {
    // The gate's own words. "Shortened by exactly this unit" is checked as membership rather than
    // as a length: a list that lost W279 and gained something else is also shorter.
    expect(Object.keys(NOT_REVIEWED).sort()).toEqual(["W285", "W286"]);
    expect(NOT_REVIEWED.W279).toBeUndefined();
  });

  it("records who read it rather than back-dating it into W285's pass", () => {
    // W285 pinned its range at `3dcaf6b` precisely so it could not claim W279. Adding W279 to that
    // pass's reviewed list would undo the pin; it is recorded as reviewed by a LATER unit instead.
    expect(REVIEWED_BY_LATER_UNIT.W279).toBe("W287");
  });

  it("leaves every done Q22 unit accounted for", () => {
    expect(unaccountedUnits(LEDGER)).toEqual([]);
  });
});

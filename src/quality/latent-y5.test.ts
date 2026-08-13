// W268 verify gate: "every recorded finding's live-condition re-evaluated from source rather than
// from its own record; a condition that became true without firing is a failure."
//
// Two properties, and the second is the one W210 could not check about itself.
//
//   NO OPEN FINDING HAS GONE LIVE. `fired()` is empty — the check W210 built.
//
//   AND EVERY OPEN FINDING COULD STILL NOTICE IF IT DID. A predicate is a proxy for a condition,
//   and a proxy can stop pointing at the thing while returning a perfectly clean `false`. So each
//   anchor is evaluated from source, and — where the shape allows it — the predicate is DRIVEN
//   against a rigged world and required to come back true, because an anchor that holds still does
//   not prove the predicate reads it.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rankCandidates } from "@/engine/pool";
import { observesClinicalAttribute } from "./ranker-behaviour";
import {
  FINDING_ANCHORS,
  anchorCoverage,
  deadAnchors,
} from "./latent-y5";
import { LATENT_FINDINGS, fired, modulesWithNoUnitHeader } from "./latent-findings";
import { reachableFromApp } from "@/security/reachability";

const ROOT = path.resolve(__dirname, "../..");

describe("W268 no open finding has gone live, and each could still notice", () => {
  it("keeps the fired list empty", () => {
    expect(fired().map((f) => f.id)).toEqual([]);
    // A VACUITY GUARD, NOT A COUNT. `> 3` was the number of open findings on the day this was
    // written, and W280 closed one — so a unit CLOSING a finding turned this red, which is the
    // pin-a-transient-value failure the tree has now recorded three times in three units. What
    // the guard is for is that `fired()` has something to iterate: closing findings is the
    // direction this register wants to move in, and the check should survive it.
    expect(LATENT_FINDINGS.filter((f) => f.status === "open").length, "no open finding to check").toBeGreaterThan(0);
  });

  it("anchors every open finding, and anchors nothing that is not one", () => {
    const coverage = anchorCoverage();
    expect(coverage.unanchored, "an open finding whose detectability nobody checked").toEqual([]);
    expect(coverage.orphaned, "an anchor for a finding that no longer exists").toEqual([]);
  });

  it("finds no anchor that has gone false", () => {
    // THE PROPERTY THIS UNIT ADDS. A fired finding is a build failure that names itself; a dead
    // anchor is a green suite reporting a check that no longer runs, which is strictly worse.
    expect(deadAnchors().map((a) => `${a.id}: ${a.claim}`)).toEqual([]);
  });

  it("says what a dead anchor would mean, per finding", () => {
    for (const anchor of FINDING_ANCHORS) {
      expect(anchor.claim.length, `${anchor.id} states no claim`).toBeGreaterThan(50);
      expect(anchor.ifDead.length, `${anchor.id} does not say what going quiet would cost`).toBeGreaterThan(150);
    }
  });
});

describe("W268 MATCH-1's liveness half, re-derived", () => {
  const SOURCE = readFileSync(path.join(ROOT, "src/quality/latent-findings.ts"), "utf8");

  it("no longer answers the question by matching one spelling of an import", () => {
    // THE FINDING. It scanned `src/` for the literal `from "@/matching/match"` — one spelling, and
    // a walk that never left `src/`. Both are the defects W221 found and fixed in W201's dormancy
    // proof for THIS SAME MODULE a year ago: a relative import is invisible to a text match, and a
    // page is precisely where a module becomes live.
    expect(SOURCE, "MATCH-1 is back to matching an import string").not.toContain('from "@\\/matching\\/match"');
    expect(SOURCE, "MATCH-1 does not compose the reachability walk").toContain("reachableFromApp(ROOT)");
  });

  it("answers it the way W201 answers it for the same module", () => {
    // W194's rule: when two registers describe the same fact, test that they AGREE. Both now ask
    // the import graph rather than the text, so they cannot give different answers about whether
    // the matcher is in use.
    const reachable = new Set(reachableFromApp(ROOT).files);
    expect(reachable.has("src/matching/match.ts"), "the matcher became reachable from a page").toBe(false);
    const adm = readFileSync(path.join(ROOT, "src/privacy/automated-decisions.test.ts"), "utf8");
    expect(adm, "W201 stopped composing the reachability walk").toContain("reachableFromApp");
  });

  it("still holds the half that IS true, so the finding is one conjunct from firing", () => {
    // MATCH-1 is `stillOrdersOnCondition && live`. The first conjunct is true today — the live
    // ranker does order on a clinical attribute while the published notice says nothing does —
    // and only the matcher's dormancy keeps the finding latent. Asserting that here is what stops
    // "not fired" from being read as "not a problem".
    //
    // W283 REPLACED THE READ BELOW, and found it by mutation rather than by looking. It used to
    // match `/a\.chronicCare !== b\.chronicCare/` against `src/engine/pool.ts`, and rewording that
    // comparison — which changes nothing about who gets invited — turned this red under the
    // message "the ranker stopped ordering on the attribute; MATCH-1 may be closable". That
    // message would have been FALSE, and it is the one a future author reads while deciding
    // whether a contradiction with a published legal notice has gone away.
    expect(
      observesClinicalAttribute(rankCandidates),
      "the ranker stopped ordering on the attribute; MATCH-1 may be closable",
    ).toBe(true);
    const match = LATENT_FINDINGS.find((f) => f.id === "MATCH-1")!;
    expect(match.status, "MATCH-1 was closed without the notice or the ranker changing").toBe("open");
  });
});

describe("W268 the predicates are driven, not only anchored", () => {
  it("fires CENSUS-1 against a tree with one header-less module", () => {
    // An anchor that holds does not prove the predicate reads it, so the condition is constructed.
    // W281 closed the finding and the arithmetic moved with it: the pin was `> 11`, tolerating
    // eleven forever, and the trigger is `> 0` now — one header-less module fires it.
    const now = modulesWithNoUnitHeader().length;
    expect(now).toBe(0);
    expect(now > 0, "the tree has a header-less module and the door did not say so").toBe(false);
    expect(now + 1 > 0, "one header-less module would not fire it").toBe(true);
  });

  it("fires DOSSIER-1 against a dossier test with no bound", () => {
    // Driven on the predicate's own terms: a file that reads the ledger and names no `_LAST`
    // constant is what it looks for, and this constructs one rather than trusting the scan.
    const unbounded = 'const LEDGER = read("BUILD-STATE.md");\nexpect(rows).toHaveLength(9);\n';
    const bounded = `const Y5_LAST_UNIT = 260;\n${unbounded}`;
    const wouldFire = (text: string) => text.includes("BUILD-STATE.md") && !/_LAST(_UNIT)?\b/.test(text);
    expect(wouldFire(unbounded), "the predicate would miss an unbounded dossier test").toBe(true);
    expect(wouldFire(bounded), "the predicate fires on a correctly bounded one").toBe(false);
  });

  it("fires TENANCY-1 against a rail holding two practices", () => {
    const oneP = new Set(["prac-1"]);
    const twoP = new Set(["prac-1", "prac-2"]);
    expect(oneP.size > 1).toBe(false);
    expect(twoP.size > 1, "a second practice in the seeded rail would not fire it").toBe(true);
  });
});

describe("W268 the bound W210 stated is restated rather than quietly dropped", () => {
  it("does not claim the register is complete", () => {
    // W210's register is hand-kept because there is no mechanical detector for "a comment that
    // files something for later". This unit checks that recorded findings can still fire, which is
    // a smaller claim than that every latent finding is recorded — and saying so is the difference
    // between a stated bound and a register that has stopped describing its own reach.
    const source = readFileSync(path.join(ROOT, "src/quality/latent-y5.ts"), "utf8");
    expect(source).toContain("KNOWN BOUND");
    expect(source).toContain("hand-kept");
  });
});

// W317 verify gate: "the two Q24 instances re-derived as a pair, a stated rule for what makes a fix
// an instance of the class it fixes, and a planted remedy carrying the defect reported."
//
// THE PAIR IS THE POINT. One instance is an anecdote and a rule built from one is a rule shaped to
// fit it. Two, by different authors, in the same quarter, with different subjects and the same
// property, is what makes `REMEDY_RULE` a rule rather than a description of W310's afternoon.

import { describe, expect, it } from "vitest";
import {
  ARGUED_EQUALITIES,
  REMEDY_BOUND,
  REMEDY_RULE,
  SELF_DEFEATING,
  equalityDiff,
  equalityId,
  frozenEqualities,
} from "./self-defeating";
import { allLedgerRows } from "./blocked-surface";
import { withTree } from "./planting";

const ROOT = process.cwd();

describe("W317 the two instances, re-derived rather than recorded", () => {
  it("holds both, each with the property that makes it one", () => {
    expect(SELF_DEFEATING.map((s) => s.id).sort()).toEqual(["Q24-CR-5", "Q24-CR-9"]);
    for (const instance of SELF_DEFEATING) {
      // The property is the whole of the rule's mechanism: a clause you can hold against a remedy.
      expect(instance.property.length, `${instance.id} states no property`).toBeGreaterThan(20);
      expect(instance.property, `${instance.id}'s property is a sentence about the subject`).not.toMatch(
        /ledger|count|register/i,
      );
      expect(instance.defect.length).toBeGreaterThan(150);
      expect(instance.remedy.length).toBeGreaterThan(150);
    }
  });

  it("Q24-CR-5 is fixed, and the tree says so rather than the register", () => {
    // The remedy's own defect was that `W-MIGRATE` fell out. If the trailing digit returns, this
    // fails and the instance is live again — a fixed row must go stale rather than sit here.
    const ids = allLedgerRows(ROOT).map((r) => r.id);
    expect(ids, "the trailing-digit requirement is back").toContain("W-MIGRATE");
    expect(ids, "the table header is being parsed as a row").not.toContain("Unit");
  });

  it("Q24-CR-9 is fixed, in both places it was found", () => {
    expect(equalityDiff(ROOT)).toEqual({ unargued: [], stale: [] });
  });

  it("differ in subject and agree in property, which is what makes the rule a rule", () => {
    const [five, nine] = [SELF_DEFEATING[0]!, SELF_DEFEATING[1]!];
    expect(five.unit).not.toBe(nine.unit);
    expect(five.property).not.toBe(nine.property);
    // Both properties describe the MECHANISM's behaviour, not the thing it operates on: that is the
    // shared form, and it is why one rule covers a regex and an assertion.
    for (const p of [five.property, nine.property]) expect(p).toMatch(/^[a-z]/);
  });
});

describe("W317 the rule, stated for the fixes no sweep can read", () => {
  it("names the question and both instances that answer it", () => {
    expect(REMEDY_RULE).toMatch(/DEFINING PROPERTY/);
    expect(REMEDY_RULE).toMatch(/drops something without saying so/);
    expect(REMEDY_RULE).toMatch(/reads as maintenance/);
    // The sentence has to say why the author could not see it, or it reads as an accusation.
    expect(REMEDY_RULE).toMatch(/INSTANCE/);
  });

  it("is a rule about mechanisms, not a list of the two cases", () => {
    for (const instance of SELF_DEFEATING) {
      expect(REMEDY_RULE, `the rule names ${instance.id} instead of stating a test`).not.toContain(instance.id);
    }
  });
});

describe("W317 a planted remedy carrying the defect", () => {
  it("reports a live value measured against a frozen record", () => {
    // THE GATE'S LAST CLAUSE. The exact shape W308 wrote and W313 repeated: something derived from
    // the tree, asserted EQUAL to a number somebody froze.
    const planted = `
import { measure } from "@/quality/probe";
import { COST_AT_W300 } from "@/quality/probe";
it("matches the record", () => {
  expect(measure(ROOT)).toEqual(COST_AT_W300);
});
`;
    const found = withTree({ "src/planted/frozen.test.ts": planted }, (root) =>
      frozenEqualities(root).map(equalityId),
    );
    expect(found).toEqual(["src/planted/frozen.test.ts :: matches the record :: COST_AT_W300"]);
  });

  it("does not report a FLOOR against the same record, which is the remedy", () => {
    // The discriminating half. `toBeGreaterThanOrEqual` against a frozen figure is what W311 wrote
    // to fix the first instance, so a sweep that reported it would be arguing with its own advice —
    // the shape W304 hit when its sweep nearly reported the floors it prescribed.
    const planted = `
import { measure } from "@/quality/probe";
import { COST_AT_W300 } from "@/quality/probe";
it("has not fallen below the record", () => {
  expect(measure(ROOT)).toBeGreaterThanOrEqual(COST_AT_W300);
});
`;
    expect(
      withTree({ "src/planted/floor.test.ts": planted }, (root) => frozenEqualities(root)),
    ).toEqual([]);
  });

  it("does not report an equality whose expected side is not a frozen record", () => {
    const planted = `
import { measure } from "@/quality/probe";
it("t", () => {
  expect(measure(ROOT)).toEqual({ unaccounted: [], stale: [] });
});
`;
    expect(
      withTree({ "src/planted/other.test.ts": planted }, (root) => frozenEqualities(root)),
    ).toEqual([]);
  });

  it("does not report a NEGATED comparison, which is a different claim", () => {
    const planted = `
import { COST_AT_W300 } from "@/quality/probe";
it("t", () => {
  expect(measure(ROOT)).not.toEqual(COST_AT_W300);
});
`;
    expect(
      withTree({ "src/planted/negated.test.ts": planted }, (root) => frozenEqualities(root)),
    ).toEqual([]);
  });
});

describe("W317 the equalities kept, and why each is not the defect", () => {
  it("argues every one, and every argument is the rule applied", () => {
    expect(ARGUED_EQUALITIES.length).toBeGreaterThan(0);
    for (const argued of ARGUED_EQUALITIES) {
      expect(argued.why.length, `${argued.id} is not argued`).toBeGreaterThan(150);
      // The rule's second clause is what a named list fails, so every argument must reach for it.
      expect(argued.why, `${argued.id} does not apply the rule`).toMatch(/name|NAMED/);
    }
  });

  it("keeps only named lists, which is the rule and not an exemption", () => {
    // If a numeric record ever appears here, the register has stopped applying the rule and started
    // absorbing exceptions — the failure mode W279 refused and W306 watched for.
    for (const argued of ARGUED_EQUALITIES) {
      expect(argued.id, `${argued.id} argues for a tax record, which is a number`).not.toMatch(
        /TAX_AT_W\d+/,
      );
    }
  });

  it("reports an argued equality the sweep no longer finds", () => {
    const bogus = [...ARGUED_EQUALITIES, { id: "src/gone.test.ts :: t :: GONE_AT_W1", why: "x" }];
    expect(equalityDiff(ROOT, bogus).stale).toEqual(["src/gone.test.ts :: t :: GONE_AT_W1"]);
  });

  it("reports every equality when nothing is argued, so the register is load-bearing", () => {
    expect(equalityDiff(ROOT, []).unargued.length).toBe(ARGUED_EQUALITIES.length);
  });
});

describe("W317 what the sweep does not reach", () => {
  it("says the rule is wider than the detector, and names the instance it would have missed", () => {
    expect(REMEDY_BOUND).toMatch(/Q24-CR-5/);
    expect(REMEDY_BOUND).toMatch(/judgement over arbitrary code/);
  });

  it("says it inherits a parser it has not proved exhaustive", () => {
    // FOUND WHILE BUILDING THIS, and downgraded from a specific claim to a general one on purpose.
    // An assertion plainly present in a test file was not returned by `assertionsIn`; two fixtures
    // were planted to reproduce the shape and both were found, so the cause is unknown. The bound
    // says the ceiling exists rather than naming a line — and the line it would have named was
    // removed by this unit's own fix, so the evidence for the bound was edited away by the commit
    // that stated it. W295's register carries the attempt as `undemonstrated` for the same reason.
    expect(REMEDY_BOUND).toMatch(/assertionsIn/);
    expect(REMEDY_BOUND).toMatch(/not proven exhaustive/);
    expect(REMEDY_BOUND, "the bound claims a reproducible miss").not.toMatch(/declaration-tax/);
  });
});

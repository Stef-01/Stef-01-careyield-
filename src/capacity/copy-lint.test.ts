// W226 verify gate: "compliance linter; W201's ADM register updated in the same commit, which is
// the rule W201 made mechanical rather than hopeful."
//
// A linter nobody can show fires is a linter nobody has tested. So every rule is proved twice:
// once with a sentence a capacity surface would plausibly write, and once with the corrected
// version of that same sentence, which must pass. A rule that rejects everything is as useless
// as one that rejects nothing, and only the pair catches it.
//
// Then the reach: every string Q18 actually ships goes through the linter, and the module list
// is checked against the directory in both directions rather than remembered.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAPACITY_COPY_MODULES,
  CAPACITY_COPY_RULES,
  CAPACITY_RULE_COPY,
  CAPACITY_SURFACE_COPY,
  lintCapacityCopy,
  renderCompliantCapacityCopy,
} from "./copy-lint";
import { BACKTEST_REFUSAL_COPY, backtest, renderScore } from "./backtest";
import { FORECAST_REFUSAL_COPY, forecast, renderForecast } from "./forecast";
import { HISTORY_REFUSAL_COPY } from "./model";
import { OPENING_REFUSAL_COPY, REFUSED_OPENING_FIELDS, recommendOpening, renderOpening } from "./opening";
import { MESSAGE_BANNED_RULES } from "@/messaging/templates";
import { NOT_A_DECISION } from "@/privacy/automated-decisions";
import type { RecordedWeek, SessionPattern } from "./model";

const CAPACITY_DIR = path.join(process.cwd(), "src", "capacity");

const week = (dateIso: string, filled: number, offerable = 10): RecordedWeek => ({
  dateIso,
  filled,
  offerable,
  released: 0,
});

const PATTERN: SessionPattern = {
  practiceId: "prac-1",
  clinicianId: "cli-0",
  weekday: 4,
  weeks: [
    week("2026-01-01", 5),
    week("2026-01-08", 6),
    week("2026-01-15", 4),
    week("2026-01-22", 5),
    week("2026-01-29", 6),
    week("2026-02-05", 5),
  ],
  basis: { recordedWeeks: 6, fromIso: "2026-01-01", toIso: "2026-02-05" },
};

/** Each rule, with a sentence that breaks it and the corrected sentence that must not. */
const RULE_CASES: Array<{ rule: string; bad: string; good: string }> = [
  {
    rule: "no-future-promise",
    bad: "If you open 10 slots, 4 to 6 will fill.",
    good: "If you open 10 slots, 4 to 6 filled in the weeks on record.",
  },
  {
    rule: "no-opening-instruction",
    bad: "We recommend opening six slots on Thursday.",
    good: "Six slots on Thursday is within what this session has offered before.",
  },
  {
    rule: "no-patient-volume-claim",
    bad: "Opening these slots means 6 patients will be invited.",
    good: "Opening these slots adds six openings to Thursday's diary.",
  },
  {
    rule: "no-demand-claim",
    bad: "Thursday shows the highest unmet demand.",
    good: "Thursday shows the highest share of offered slots taken.",
  },
  {
    rule: "no-performance-judgement",
    bad: "Friday afternoons are badly under-utilised.",
    good: "Friday afternoons took the smallest share of the slots offered.",
  },
];

describe("W226 every rule fires, and its corrected form does not", () => {
  it("has a stated reason for every rule and no rule without one", () => {
    expect(Object.keys(CAPACITY_RULE_COPY).sort()).toEqual([...CAPACITY_COPY_RULES].sort());
    for (const rule of CAPACITY_COPY_RULES) {
      expect(CAPACITY_RULE_COPY[rule]!.length, rule).toBeGreaterThan(80);
    }
  });

  for (const { rule, bad, good } of RULE_CASES) {
    it(`${rule}: catches the tempting sentence and passes the corrected one`, () => {
      // Both halves matter. A rule that rejects everything is as useless as one that rejects
      // nothing, and only the pair distinguishes them.
      expect(lintCapacityCopy(bad).map((v) => v.rule), bad).toContain(rule);
      expect(lintCapacityCopy(good), good).toEqual([]);
    });
  }

  it("covers every declared rule with a case, in both directions", () => {
    // The register-completeness check applied to the test file itself: a rule added without a
    // case would otherwise ship untested, which is how a linter quietly stops meaning anything.
    expect(RULE_CASES.map((c) => c.rule).sort()).toEqual([...CAPACITY_COPY_RULES].sort());
  });

  it("reaches W6's shared vocabulary rather than copying it", () => {
    // W150's seam: a rule added to the message linter arrives here the same day. Proved with a
    // sentence this module declares NO pattern for, so the violation can only have come from the
    // delegation. My first attempt used a sentence neither linter matched and passed for the
    // wrong reason — the assertion now names which linter caught it.
    const shared = "This session was offered to patients who are overdue for a review.";
    const rules = lintCapacityCopy(shared).map((v) => v.rule);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(MESSAGE_BANNED_RULES, `${rule} did not come from the shared linter`).toContain(rule);
      expect(CAPACITY_COPY_RULES).not.toContain(rule);
    }
  });

  it("throws rather than returning findings, because a list nobody reads is not a gate", () => {
    expect(() => renderCompliantCapacityCopy(RULE_CASES[0]!.bad)).toThrow(/no-future-promise/);
    expect(renderCompliantCapacityCopy(RULE_CASES[0]!.good)).toBe(RULE_CASES[0]!.good);
  });
});

describe("W226 every string Q18 ships passes the linter", () => {
  const rendered = () => {
    const opening = recommendOpening(PATTERN, 10);
    return [
      ...Object.values(CAPACITY_SURFACE_COPY),
      ...Object.values(HISTORY_REFUSAL_COPY),
      ...Object.values(FORECAST_REFUSAL_COPY),
      ...Object.values(BACKTEST_REFUSAL_COPY),
      ...Object.values(OPENING_REFUSAL_COPY),
      renderForecast(forecast(PATTERN, 10)),
      renderScore(backtest(PATTERN)),
      renderOpening(opening),
    ];
  };

  it("lints the declared copy and the rendered sentences alike", () => {
    // The rendered strings matter more than the constants: a template composes fragments that
    // are each innocent, and the sentence a practice reads is the composition.
    for (const text of rendered()) {
      expect(lintCapacityCopy(text), text).toEqual([]);
    }
  });

  it("checks a real recommendation, not only its refusals", () => {
    // A corpus of nothing but refusals would pass this file while the happy path shipped
    // anything at all — the sentence a practice usually sees is the one that usually renders.
    const opening = recommendOpening(PATTERN, 10);
    expect(opening.ok, "the fixture produced no recommendation to lint").toBe(true);
    expect(renderOpening(opening)).toContain("filled in the weeks on record");
  });

  it("leaves the REVIEWER registers out, because they quote what they forbid", () => {
    // The first draft of this file linted `REFUSED_OPENING_FIELDS` and `CAPACITY_RULE_COPY` as
    // operator copy and flagged both — the registers were punished for naming the things they
    // exist to forbid. W200 draws the same line between copy a practice reads and prose a
    // reviewer reads. The exclusion is asserted the useful way round: these strings MUST fail
    // the operator lint, which is what makes leaving them out load-bearing rather than
    // convenient. If either ever passed cleanly it would have stopped quoting the forbidden
    // phrasing, and the register would have become a list of nice ideas.
    expect(REFUSED_OPENING_FIELDS.patients).toContain("who to invite");
    expect(lintCapacityCopy(REFUSED_OPENING_FIELDS.patients!).map((v) => v.rule)).toContain(
      "no-patient-volume-claim",
    );
    expect(lintCapacityCopy(CAPACITY_RULE_COPY["no-demand-claim"]!).map((v) => v.rule)).toContain(
      "no-demand-claim",
    );
  });

  it("says what a fill rate is NOT, on the surface rather than in a comment", () => {
    // The demand rule's positive half. A reader who is not told that uptake is not demand will
    // supply the reading themselves, because it is the one that needs no explanation.
    expect(CAPACITY_SURFACE_COPY.whatThisIsNot).toContain("not a measure of how many appointments");
    expect(CAPACITY_SURFACE_COPY.whatThisIsNot).toContain("turned people away");
    expect(CAPACITY_SURFACE_COPY.itIsYourDiary).toContain("your decision");
    // W234 rewrote this sentence: W232 established that acting on the page DOES change how many
    // people are messaged, so the old wording ("not connected to how many invitations go out")
    // was reassuring and wrong. The distinction the copy now has to keep is between what the
    // software does and what the practice does.
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).toContain("Meherr does not act on these figures");
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).toContain("Acting on them yourself does");
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).not.toMatch(/not connected to how many/);
  });
});

describe("W226 the reach is a registry, checked in both directions", () => {
  const modulesOnDisk = () =>
    readdirSync(CAPACITY_DIR)
      .filter((file) => file.endsWith(".ts") && !file.includes(".test."))
      .map((file) => `src/capacity/${file}`)
      .sort();

  /** Does this module export anything an operator could read? */
  const exportsOperatorCopy = (module: string) => {
    const source = readFileSync(path.join(process.cwd(), module), "utf8");
    return /export const \w*_COPY\b/.test(source);
  };

  it("declares every capacity module that exports operator copy", () => {
    const undeclared = modulesOnDisk().filter(
      (module) => exportsOperatorCopy(module) && !CAPACITY_COPY_MODULES.includes(module),
    );
    expect(undeclared, "capacity copy with no lint declaration").toEqual([]);
  });

  it("declares nothing that has stopped exporting copy", () => {
    // The direction that catches rot. A declaration outliving the copy it described reads as
    // coverage nobody has — W102's stale-row failure, which is the one nobody notices.
    const stale = CAPACITY_COPY_MODULES.filter(
      (module) => !modulesOnDisk().includes(module) || !exportsOperatorCopy(module),
    );
    expect(stale, "declarations for copy that is gone").toEqual([]);
  });

  it("finds copy to check, so the census cannot pass vacuously", () => {
    expect(modulesOnDisk().filter(exportsOperatorCopy).length).toBeGreaterThan(3);
  });
});

describe("W226 W201's ADM register is updated in the same commit", () => {
  it("classifies the recommendation, and says why it is not a decision about anybody", () => {
    const entry = NOT_A_DECISION["src/capacity/opening.ts"];
    expect(entry, "the recommendation is not classified").toBeDefined();
    expect(entry!.length).toBeGreaterThan(200);
  });

  it("names what would make it one, rather than only what it is today", () => {
    // W201's rule made mechanical rather than hopeful. "It decides nothing" is true while the
    // recommendation is wired to nothing; W231 is where the coupling to invitation volume lands,
    // and an entry that did not name that would be accurate today and misleading on the day it
    // shipped. The register has to carry the trigger, the way PRIV-3's row should have.
    const entry = NOT_A_DECISION["src/capacity/opening.ts"]!;
    expect(entry).toContain("W231");
    expect(entry).toMatch(/wired|coupl/i);
  });

  it("does NOT declare the linter itself, because the register would call that stale", () => {
    // My first draft added an entry for this module on the reasoning that a linter is part of
    // the surface it guards. W201's detector disagreed and was right: it enumerates modules that
    // take a decision ABOUT A PATIENT, and a declaration for one that does not is a stale row —
    // the failure W102 exists for, which makes a register actively misleading rather than merely
    // incomplete. The register caught the over-declaration in the same firing.
    expect(NOT_A_DECISION["src/capacity/copy-lint.ts"]).toBeUndefined();
  });
});

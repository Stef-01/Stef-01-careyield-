// W233 verify gate: "holdout-based only; refuses to answer without an arm rather than answering
// from the trend."
//
// Two halves. The refusal has to be STRUCTURAL — no signature through which an answer can arrive
// without an arm — and the arithmetic has to actually work when an arm is supplied, or "holdout
// only" is being asserted over a function that never answers anything.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./attribution";
import {
  ALL_CAPACITY_COMPARATORS,
  CAPACITY_EFFECT_WITHHELD_COPY,
  MIN_SESSIONS_PER_ARM,
  REFUSED_CAPACITY_COMPARATORS,
  SHIPPED_SESSION_ARMS,
  capacityEffect,
  capacityEffectForPractice,
  capacityWithheldCopy,
  type ArmAssignment,
  type SessionArm,
} from "./attribution";
import { lintCapacityCopy } from "./copy-lint";
import { MIN_ARM_PATIENTS } from "@/registers/attribution";
import type { RecordedUtilisation } from "./model";

const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/attribution.ts"), "utf8");

const day = (n: number) => `2026-03-${String(n).padStart(2, "0")}`;

const recordedSession = (clinicianId: string, dateIso: string, filled: number, offerable: number) => ({
  session: { practiceId: "prac-1", clinicianId, dateIso, weekday: 4, slots: offerable },
  filled,
  open: offerable - filled,
  released: 0,
});

/**
 * A trial: eight sessions each side, assigned a day before they ran.
 *
 * The opened arm offers 15 slots and fills 12; the usual arm offers 10 and fills 9. Note the
 * SHAPE of that fixture — the opened arm fills MORE slots and a LOWER share of them, which is the
 * case the outcome choice turns on and the reason the numbers are not simply "opened is better".
 */
const trial = (): { arm: SessionArm; recorded: RecordedUtilisation[] } => {
  const assignments: ArmAssignment[] = [];
  const recorded: RecordedUtilisation[] = [];
  for (let i = 0; i < 8; i += 1) {
    assignments.push({
      clinicianId: "cli-0",
      dateIso: day(1 + i),
      arm: "extra_slots_opened",
      assignedAtIso: "2026-02-01",
    });
    recorded.push(recordedSession("cli-0", day(1 + i), 12, 15));
    assignments.push({
      clinicianId: "cli-1",
      dateIso: day(1 + i),
      arm: "left_as_usual",
      assignedAtIso: "2026-02-01",
    });
    recorded.push(recordedSession("cli-1", day(1 + i), 9, 10));
  }
  return {
    arm: { practiceId: "prac-1", allocation: "randomised_before_the_session", assignments },
    recorded,
  };
};

describe("W233 no trial has been run, so the product cannot say", () => {
  it("ships no session arms", () => {
    expect(SHIPPED_SESSION_ARMS).toEqual([]);
  });

  it("refuses for a real practice rather than answering from the record", () => {
    // The shipped answer, and the one a practice gets today. Twenty-six weeks of recorded
    // sessions are sitting right there and produce no claim, which is the unit.
    const { recorded } = trial();
    const result = capacityEffectForPractice("prac-1", recorded);
    expect(result.claimed).toBe(false);
    if (result.claimed) throw new Error("unreachable");
    expect(result.withheld).toEqual(["no_session_arm"]);
    expect(capacityWithheldCopy(result)).toContain("sorted into two groups before");
  });

  it("has no function that turns recorded weeks into an effect", () => {
    // THE structural guarantee, and the reason it is asserted on signatures rather than on
    // behaviour: an overload taking only the record is the entire failure this unit prevents,
    // and it would look like a convenience.
    const exported = Object.entries(mod).filter(([, v]) => typeof v === "function");
    expect(exported.length).toBeGreaterThan(2);
    // Vacuity guard: the signature scan must SEE every exported function. A regex that matched
    // nothing would certify this property forever — W221's finding, where a dormancy proof
    // matched one import form and actively certified a false claim.
    const seen = [...SOURCE.matchAll(/^export function (\w+)\s*\(/gm)].map((m) => m[1]);
    expect(seen.sort()).toEqual(exported.map(([name]) => name).sort());
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([\s\S]*?)\)\s*:/gm)) {
      const [, name, params] = match;
      if (name === "capacityWithheldCopy") continue;
      expect(params!.replace(/\s+/g, " "), `${name} can answer without an arm`).toMatch(
        /arm: SessionArm|arms: readonly SessionArm\[\]/,
      );
    }
  });

  it("keeps the comparator a one-member union, W215's shape", () => {
    expect(ALL_CAPACITY_COMPARATORS).toEqual(["assigned_session_arm"]);
  });
});

describe("W233 the arithmetic works when an arm exists, or the refusal proves nothing", () => {
  it("reports the difference in slots filled per session", () => {
    // Non-vacuity for the whole file. A module that only ever refuses would pass every test
    // above while being useless the day somebody runs the trial.
    const { arm, recorded } = trial();
    const result = capacityEffect(arm, recorded);
    expect(result.claimed).toBe(true);
    if (!result.claimed) throw new Error(result.withheld.join(", "));
    expect(result.effect.openedMeanFilled).toBe(12);
    expect(result.effect.usualMeanFilled).toBe(9);
    expect(result.effect.difference).toBe(3);
    expect(result.effect.basis.openedSessions).toBe(8);
    expect(result.effect.basis.usualSessions).toBe(8);
  });

  it("measures a count, not a fill rate — the fixture is built so the two disagree", () => {
    // The second finding, made unavoidable by the fixture: the opened arm fills MORE slots
    // (12 vs 9) at a LOWER share of them (0.80 vs 0.90). A rate as the outcome would report this
    // practice as having got worse and advise closing the slots.
    const { arm, recorded } = trial();
    const result = capacityEffect(arm, recorded);
    if (!result.claimed) throw new Error(result.withheld.join(", "));
    expect(result.effect.difference).toBeGreaterThan(0);
    const openedRate = 12 / 15;
    const usualRate = 9 / 10;
    expect(openedRate).toBeLessThan(usualRate);
    // And the effect must not be the rate difference, which is negative.
    expect(result.effect.difference).not.toBeCloseTo(openedRate - usualRate);
  });

  it("reports a negative difference rather than treating it as an error", () => {
    const { arm, recorded } = trial();
    const worse = recorded.map((entry) =>
      entry.session.clinicianId === "cli-0" ? { ...entry, filled: 4, open: 11 } : entry,
    );
    const result = capacityEffect(arm, worse);
    if (!result.claimed) throw new Error(result.withheld.join(", "));
    expect(result.effect.difference).toBe(-5);
  });
});

describe("W233 an assignment made afterwards is a label, not an allocation", () => {
  it("refuses a split stamped after the sessions ran", () => {
    // The one property separating a trial from a post-hoc split. A late arm carries every
    // confound in `REFUSED_CAPACITY_COMPARATORS` while looking identical in the data structure.
    const { arm, recorded } = trial();
    const late: SessionArm = {
      ...arm,
      assignments: arm.assignments.map((a) => ({ ...a, assignedAtIso: "2026-04-01" })),
    };
    const result = capacityEffect(late, recorded);
    expect(result.claimed).toBe(false);
    if (result.claimed) throw new Error("unreachable");
    expect(result.withheld).toContain("assignment_did_not_precede_the_session");
  });

  it("refuses when even ONE assignment is late", () => {
    // Per assignment, not per trial: one row stamped afterwards is enough to make the split
    // post-hoc, and a majority rule here would let somebody relabel the interesting sessions.
    const { arm, recorded } = trial();
    const mostly: SessionArm = {
      ...arm,
      assignments: arm.assignments.map((a, i) =>
        i === 3 ? { ...a, assignedAtIso: "2026-04-01" } : a,
      ),
    };
    const result = capacityEffect(mostly, recorded);
    expect(result.claimed).toBe(false);
    if (result.claimed) throw new Error("unreachable");
    expect(result.withheld).toContain("assignment_did_not_precede_the_session");
  });

  it("accepts an assignment made the day before, so the check is not refusing everything", () => {
    const { arm, recorded } = trial();
    const justInTime: SessionArm = {
      ...arm,
      assignments: arm.assignments.map((a) => ({
        ...a,
        assignedAtIso: day(Number(a.dateIso.slice(-2)) - 1),
      })),
    };
    expect(capacityEffect(justInTime, recorded).claimed).toBe(true);
  });
});

describe("W233 the floor is about sessions, and is not W72's patient floor", () => {
  it("refuses an arm below the floor on either side", () => {
    const { arm, recorded } = trial();
    const thin: SessionArm = {
      ...arm,
      assignments: arm.assignments.filter((a, i) => a.arm === "left_as_usual" || i < 4),
    };
    const result = capacityEffect(thin, recorded);
    expect(result.claimed).toBe(false);
    if (result.claimed) throw new Error("unreachable");
    expect(result.withheld).toContain("arm_below_floor");
    // The counts survive the refusal — W72's shape: a withheld claim is not a missing count.
    expect(result.basis.usualSessions).toBe(8);
    expect(result.basis.openedFilled).toBeGreaterThan(0);
  });

  it("is not the patient floor, because a session is not a patient", () => {
    // This quarter's recurring mistake, refused by name. W231 found a number lifted across a
    // change of unit because both quantities were called a rate; reusing W72's 30 here would be
    // the same error because both are called an arm.
    expect(MIN_SESSIONS_PER_ARM).not.toBe(MIN_ARM_PATIENTS);
    expect(SOURCE).toContain("MIN_RECORDED_WEEKS");
  });

  it("is a constant, with no parameter through which it could be tuned", () => {
    // W215 allows an override; the posture hardened after W222 and W223. A floor passed at a
    // call site is one chosen after somebody has seen what they want to get past it.
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([\s\S]*?)\)\s*:/gm)) {
      expect(match[2]!.replace(/\s+/g, " "), `${match[1]} takes a floor`).not.toMatch(
        /floor|min[A-Z]|options/i,
      );
    }
  });
});

describe("W233 a session in the trial with nothing recorded is named, not dropped", () => {
  it("refuses rather than quietly excluding it", () => {
    // Dropping it would choose which sessions count, after the fact, on a criterion correlated
    // with whatever caused the gap. W235's rule about unmapped fields, one quarter early.
    const { arm, recorded } = trial();
    const missing = recorded.filter((entry) => entry.session.dateIso !== day(2));
    const result = capacityEffect(arm, missing);
    expect(result.claimed).toBe(false);
    if (result.claimed) throw new Error("unreachable");
    expect(result.withheld).toContain("assigned_session_not_recorded");
  });
});

describe("W233 every comparator without an arm is refused, by name", () => {
  it("names the confound each one carries", () => {
    expect(Object.keys(REFUSED_CAPACITY_COMPARATORS).sort()).toEqual([
      "before_and_after",
      "matched_or_synthetic_sessions",
      "opened_versus_not_opened",
      "the_fill_rate_as_the_outcome",
      "the_forecast_as_the_baseline",
      "trend_extrapolation",
    ]);
    for (const [id, why] of Object.entries(REFUSED_CAPACITY_COMPARATORS)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(150);
    }
  });

  it("records that W231's coupling makes opened-versus-not worse, not merely bad", () => {
    // The finding worth keeping: the coupling ships off, so this is not true today. It becomes
    // true silently the day a practice switches it on, which is how a confound arrives without
    // anybody adding one.
    expect(REFUSED_CAPACITY_COMPARATORS.opened_versus_not_opened).toContain("W231");
    expect(REFUSED_CAPACITY_COMPARATORS.opened_versus_not_opened).toContain("selection rule");
  });

  it("exports nothing that reads as one of them", () => {
    const named = Object.keys(mod).filter((name) =>
      /trend|baseline|matched|synthetic|beforeAfter|adjust|fit/i.test(name),
    );
    expect(named).toEqual([]);
  });
});

describe("W233 no patient reaches it, and the copy is safe", () => {
  it("has nowhere to put a person", () => {
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([\s\S]*?)\)\s*:/gm)) {
      expect(match[2]!.replace(/\s+/g, " "), `${match[1]} takes a person`).not.toMatch(
        /patient|candidate|person/i,
      );
    }
    expect(Object.keys(mod).filter((n) => /patient|candidate|person/i.test(n))).toEqual([]);
    const { arm, recorded } = trial();
    const result = capacityEffect(arm, recorded);
    if (!result.claimed) throw new Error(result.withheld.join(", "));
    expect(Object.keys(result.effect.basis).sort()).toEqual([
      "allocation",
      "comparator",
      "floor",
      "openedFilled",
      "openedSessions",
      "usualFilled",
      "usualSessions",
    ]);
  });

  it("passes W226's capacity linter, and every refusal explains itself", () => {
    const texts = Object.values(CAPACITY_EFFECT_WITHHELD_COPY);
    // W234 added `session_assigned_more_than_once`. The count is pinned so a refusal cannot be
    // added or removed without somebody editing this line — which is the pin working, not an
    // obstacle: it is how a fifth refusal gets read rather than merged.
    expect(texts.length).toBe(5);
    for (const text of texts) {
      expect(text.length).toBeGreaterThan(80);
      expect(lintCapacityCopy(text), `failed the capacity lint: ${text}`).toEqual([]);
    }
  });

  it("never renders a withheld claim as a zero", () => {
    // W215's rule, and the bug it was written for: `(incremental ?? 0)` printed a confident 0
    // for a practice that simply had no comparison group.
    const result = capacityEffectForPractice("prac-1", []);
    expect(result.claimed).toBe(false);
    const copy = capacityWithheldCopy(result);
    expect(copy).not.toBeNull();
    expect(copy).not.toMatch(/\b0\b/);
    expect(capacityWithheldCopy(capacityEffect(trial().arm, trial().recorded))).toBeNull();
  });
});

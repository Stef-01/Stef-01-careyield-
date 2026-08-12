// W224 verify gate: "back-test over the sim; the score is recorded and rendered beside the
// forecast, so a forecaster that is usually wrong cannot present as one that is usually right."
//
// Three properties, and the second is the one this unit is really for.
//
//   NO LOOKAHEAD. Scoring a forecast against data it was built from inflates every number and is
//   invisible in the output, because the output simply looks good. Proved by scoring against a
//   week whose value could not have been known from anything before it.
//
//   COVERAGE NEVER TRAVELS ALONE. A forecaster saying "0 to all of them" scores 100% and has
//   told nobody anything, so the test builds exactly that forecaster and asserts the rendering
//   makes it look as useless as it is.
//
//   THE MISSES ARE NAMED. A percentage lets a reader skip the failures.

import { describe, expect, it } from "vitest";
import * as backtestModule from "./backtest";
import { BACKTEST_REFUSAL_COPY, backtest, renderScore } from "./backtest";
import { MIN_RECORDED_WEEKS } from "./forecast";
import { historyFor, sessionsFrom, type RecordedWeek, type SessionPattern } from "./model";
import { generatePractice } from "@/synthetic/generate";

const pattern = (weeks: RecordedWeek[]): SessionPattern => ({
  practiceId: "prac-1",
  clinicianId: "cli-0",
  weekday: 4,
  weeks,
  basis: {
    recordedWeeks: weeks.length,
    fromIso: weeks[0]?.dateIso ?? "2026-01-01",
    toIso: weeks[weeks.length - 1]?.dateIso ?? "2026-01-01",
  },
});

const week = (dateIso: string, filled: number, offerable = 10): RecordedWeek => ({
  dateIso,
  filled,
  offerable,
  released: 0,
});

/** Six weeks, all identical: a forecaster with a very narrow range and a real track record. */
const STEADY = pattern([
  week("2026-01-01", 5),
  week("2026-01-08", 5),
  week("2026-01-15", 5),
  week("2026-01-22", 5),
  week("2026-01-29", 5),
  week("2026-02-05", 5),
]);

describe("W224 the score walks forward, with no lookahead", () => {
  it("scores a week the history could not have predicted as a miss", () => {
    // THE LOOKAHEAD TEST. Five steady weeks at 5/10, then one at 10/10. If the forecast for the
    // last week saw its own value the range would stretch to include it and this would pass as
    // covered — which is exactly how a leaking back-test reports a perfect score.
    const surprise = pattern([...STEADY.weeks.slice(0, 5), week("2026-02-05", 10)]);
    const result = backtest(surprise);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.misses.map((m) => m.dateIso)).toEqual(["2026-02-05"]);
    expect(result.score.misses[0]!.actual).toBe(10);
    expect(result.score.misses[0]!.by).toBeGreaterThan(0);
  });

  it("scores each week against the slots THAT week offered", () => {
    // Scoring on a capacity the practice never had would measure something nobody will ask.
    const varying = pattern([
      week("2026-01-01", 5, 10),
      week("2026-01-08", 5, 10),
      week("2026-01-15", 5, 10),
      week("2026-01-22", 5, 10),
      week("2026-01-29", 1, 2),
    ]);
    const result = backtest(varying);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 50% of 2 slots is 1, so the small week is inside the range rather than a miss.
    expect(result.score.misses).toEqual([]);
  });

  it("names the weeks it could not score rather than dropping them from the denominator", () => {
    // A score over "the weeks we could score", read as "the weeks", is a denominator chosen
    // after the fact. The first MIN_RECORDED_WEEKS have too little history to forecast from.
    const result = backtest(STEADY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.weeksSkipped).toBe(MIN_RECORDED_WEEKS);
    expect(result.score.weeksScored).toBe(STEADY.weeks.length - MIN_RECORDED_WEEKS);
    expect(renderScore(result)).toContain("could not be scored");
  });

  it("refuses to score a forecaster with no track record rather than giving it a good one", () => {
    const thin = pattern(STEADY.weeks.slice(0, MIN_RECORDED_WEEKS));
    const result = backtest(thin);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual(["too_few_recorded_weeks_to_score"]);
    expect(BACKTEST_REFUSAL_COPY.too_few_recorded_weeks_to_score).toContain(
      "not the same as a good one",
    );
  });
});

describe("W224 coverage never travels alone", () => {
  it("makes a wide-open forecaster score 100% and read as useless in the same sentence", () => {
    // THE ASSERTION THIS UNIT EXISTS FOR. Wildly varying history → the observed range spans
    // everything → every actual falls inside it → perfect coverage. The width is what says so.
    const wild = pattern([
      week("2026-01-01", 0),
      week("2026-01-08", 10),
      week("2026-01-15", 0),
      week("2026-01-22", 10),
      week("2026-01-29", 6),
      week("2026-02-05", 3),
    ]);
    const result = backtest(wild);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.coverageRate).toBe(1);
    expect(result.score.meanWidthOfSlots).toBe(1);

    const rendered = renderScore(result);
    expect(rendered).toContain("100%");
    expect(rendered).toContain("covered 100% of the slots offered");
    expect(rendered).toContain("A range covering most of the slots is easy to be right about");
  });

  it("shows a narrow, accurate forecaster as narrow AND accurate", () => {
    // The other direction: a score that flattered nobody would be as useless as one that
    // flattered everybody. Six identical weeks → a zero-width range that is always right.
    const result = backtest(STEADY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.coverageRate).toBe(1);
    expect(result.score.meanWidthOfSlots).toBe(0);
    expect(renderScore(result)).toContain("covered 0% of the slots offered");
  });

  it("renders both numbers or neither, and exports no coverage accessor of its own", () => {
    // The mechanism behind "cannot present as usually right": there is nothing to call that
    // returns a coverage percentage on its own, so no surface can render half of this.
    for (const name of Object.keys(backtestModule)) {
      expect(name, `"${name}" hands out coverage without width`).not.toMatch(
        /^(coverage|accuracy|hitRate|successRate|percentRight)/i,
      );
    }
    const rendered = renderScore(backtest(STEADY));
    expect(rendered).toContain("fell inside the range");
    expect(rendered).toContain("of the slots offered on average");
  });
});

describe("W224 the misses are listed, not counted", () => {
  it("names each week outside the range, with how far out it was", () => {
    // A percentage lets a reader skip the failures. Naming the weeks is what makes a bad
    // forecaster look bad — W120's rule about silence, applied to a score.
    const drifting = pattern([
      week("2026-01-01", 5),
      week("2026-01-08", 5),
      week("2026-01-15", 5),
      week("2026-01-22", 5),
      week("2026-01-29", 9),
      week("2026-02-05", 0),
    ]);
    const result = backtest(drifting);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.misses.map((m) => m.dateIso)).toEqual(["2026-01-29", "2026-02-05"]);
    expect(result.score.misses.map((m) => m.by)).toEqual([4, 5]);

    const rendered = renderScore(result);
    expect(rendered).toContain("2026-01-29 (9 filled");
    expect(rendered).toContain("out by 4");
    expect(rendered).toContain("2026-02-05 (0 filled");
  });

  it("says so positively when nothing fell outside, rather than printing an empty list", () => {
    // W205's rule: a line that appears only on the bad case makes its presence the signal.
    expect(renderScore(backtest(STEADY))).toContain("No recorded week fell outside the range");
  });

  it("carries the period it was scored over, so a score cannot be read against another one", () => {
    const result = backtest(STEADY);
    // W234 CORRECTED THIS, and the original assertion is why it survived W224: I pinned the
    // period I had written rather than the period scoring covered. Scoring starts at the floor,
    // so the first four weeks were never given a range — stamping them made the rendered line
    // claim four weeks more than it checked. W205's failure, locked in by its own test.
    expect(result.ok && result.score.basis).toEqual({
      fromIso: "2026-01-29",
      toIso: "2026-02-05",
      floor: MIN_RECORDED_WEEKS,
    });
    expect(renderScore(result)).toContain("Scored over 2026-01-29 to 2026-02-05");
    expect(result.ok && result.score.weeksScored, "the stamped period must span the scored weeks")
      .toBe(2);
  });
});

describe("W224 back-test over the synthetic practice", () => {
  const synthetic = generatePractice({
    seed: 11,
    patientCount: 900,
    clinicianCount: 3,
    scheduleWeeks: 10,
    todayIso: "2026-08-08",
  });
  const sessions = sessionsFrom(synthetic.appointments, synthetic.practice.id);

  it("scores a real pattern, and every score is checkable against its own basis", () => {
    const clinicianId = sessions[0]!.session.clinicianId;
    let scored = 0;
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const history = historyFor(sessions, clinicianId, weekday);
      if (!history.ok) continue;
      const result = backtest(history.pattern);
      if (!result.ok) continue;
      scored += 1;
      const { score } = result;
      // The arithmetic has to close: every scored week is covered or is a named miss.
      expect(score.covered + score.misses.length).toBe(score.weeksScored);
      expect(score.weeksScored + score.weeksSkipped).toBeGreaterThan(MIN_RECORDED_WEEKS);
      expect(score.coverageRate).toBeGreaterThanOrEqual(0);
      expect(score.coverageRate).toBeLessThanOrEqual(1);
      expect(score.meanWidthOfSlots).toBeGreaterThanOrEqual(0);
    }
    expect(scored, "the synthetic schedule produced no scorable pattern").toBeGreaterThan(0);
  });

  it("renders a score for a real pattern that carries both numbers and the period", () => {
    const clinicianId = sessions[0]!.session.clinicianId;
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const history = historyFor(sessions, clinicianId, weekday);
      if (!history.ok) continue;
      const result = backtest(history.pattern);
      if (!result.ok) continue;
      const rendered = renderScore(result);
      expect(rendered).toContain("fell inside the range");
      expect(rendered).toContain("of the slots offered on average");
      expect(rendered).toContain("Scored over");
      return;
    }
    throw new Error("no scorable pattern in the synthetic practice");
  });
});

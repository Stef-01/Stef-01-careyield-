// W228: a forecaster that has stopped tracking reality is REPORTED, never quietly fixed.
//
// W224 scores a forecaster over its whole history. That average hides the failure this unit is
// about: a session whose pattern changed three months ago still scores well, because the twenty
// weeks it used to get right outnumber the four it now gets wrong. The lifetime score goes on
// looking healthy while every recent week misses.
//
// AND THE OBVIOUS FIX IS THE DANGEROUS ONE. Having noticed the drift, the natural next line of
// code re-fits the range on recent weeks — and then nobody ever learns that the session changed,
// because the product absorbed it. W120's rule is the whole unit: REPORT THE DISAGREEMENT, DO NOT
// RESOLVE IT. A recalibration is a decision about a practice's diary taken by software that will
// not be in the room when somebody asks why Thursdays are different now.
//
// So this module has no way to change anything. It takes a pattern and returns a statement; no
// export adjusts, re-fits, tunes or corrects, and a test asserts that on the namespace, because
// `refresh()` is what such a function gets called.
//
// THE REASSURING READING REQUIRES PROOF — W179's rule, and here it inverts the usual reading of a
// monitor. "Tracking" is the comfortable verdict and the one nobody checks, so it is not
// reachable by default: without a full recent window there is no verdict at all, only
// `cannot_determine` and what would settle it. A drift monitor that says "fine" when it cannot
// tell is worse than no monitor, because it manufactures reassurance a reader would not otherwise
// have had.
//
// DRIFT IS A DIRECTION, NOT A THRESHOLD, and that is a deliberate refusal to introduce a tuned
// number. "Coverage fell below 60%" invites somebody to pick 60 after seeing the data — W222's
// warning about defaults, one module over. What this reports instead is a qualitative fact:
// every week in the recent window fell outside the range, AND all of them the same way.
//
// AGAINST A FROZEN RANGE, AND MY FIRST VERSION OF THIS RULE WAS UNFIREABLE WITHOUT IT. The first
// draft compared each recent week with W224's ordinary walk-forward forecast, and a fixture built
// to drift — eight steady weeks at 5/10 then four at 10/10 — came back `tracking`. The reason is
// the forecaster itself: its range is the min and max of every rate on record, so the FIRST
// surprising week widens it to cover the new level and every week after that is inside. A
// sustained shift is absorbed after one week, which means the rule as written could only ever
// have fired on a one-week blip. It was a monitor that could not detect the thing it was for.
//
// So the comparison freezes the forecaster at the start of the recent window: the range as it
// stood BEFORE those weeks, which is the range a practice was actually reading. That is the
// same truncation W224 uses to keep lookahead out of a back-test, pointed at a different
// question — not "has this forecaster been right" but "has the range they were shown stopped
// describing this session". W224's width finding is the other half of the same observation: the
// absorbed shift shows up there as a range that has quietly doubled in width.
//
// THE NUMBERS ARE SHOWN EVEN WHEN THE VERDICT IS `tracking`. A monitor that only speaks when it
// is alarmed teaches a reader that silence means agreement, and W120's rule is about reporting
// the disagreement rather than about reporting alarms. Recent and earlier coverage sit in every
// report, whatever the verdict.

import { backtest, type Miss } from "./backtest";
import { MIN_RECORDED_WEEKS, forecast } from "./forecast";
import type { SessionPattern } from "./model";

/**
 * How many recent scored weeks a drift verdict needs.
 *
 * Inherited from W223's floor rather than chosen: the same number of weeks it takes to make a
 * range is the number it takes to say the range has stopped fitting. A second constant would be
 * a second thing to keep true, and the first time they differed nobody would notice.
 */
export const DRIFT_WINDOW_WEEKS = MIN_RECORDED_WEEKS;

export type DriftVerdict =
  /** Recent weeks are not all missing the same way. Shown WITH the numbers, never alone. */
  | "tracking"
  /** Every week in the recent window missed, all in the same direction. */
  | "drifted"
  /** Not enough scored weeks to say either way. Never a synonym for `tracking`. */
  | "cannot_determine";

export type DriftDirection = "filling_more_than_the_record" | "filling_less_than_the_record";

export const DRIFT_VERDICT_COPY: Record<DriftVerdict, string> = {
  tracking:
    "Recent weeks are not all falling outside the range in the same direction. The numbers below are shown either way, so this is a statement about what was checked rather than an absence of news.",
  drifted:
    "Every recent week fell outside the range, all in the same direction. Something about this session has changed and the range no longer describes it. Nothing has been adjusted: what changed is for you to say, not for this product to absorb.",
  cannot_determine:
    "There are not enough scored weeks yet to say whether this range is still fitting. That is not the same as it fitting.",
};

export const DRIFT_DIRECTION_COPY: Record<DriftDirection, string> = {
  filling_more_than_the_record:
    "Recent weeks filled more than any week the range was built from.",
  filling_less_than_the_record:
    "Recent weeks filled less than any week the range was built from.",
};

export interface WindowCoverage {
  weeks: number;
  covered: number;
  /** The dates in this window, oldest first, so a reader can go and look at them. */
  dateIsos: readonly string[];
}

/**
 * The pattern as it stood before `dateIso` — the range a practice was actually reading then.
 *
 * W224's truncation, pointed at a different question. Without it the forecaster's own min/max
 * absorbs a level shift after one week and no sustained drift can ever be detected.
 */
function frozenBefore(pattern: SessionPattern, dateIso: string): SessionPattern {
  const weeks = pattern.weeks.filter((week) => week.dateIso < dateIso);
  return {
    ...pattern,
    weeks,
    basis: {
      recordedWeeks: weeks.length,
      fromIso: weeks[0]?.dateIso ?? pattern.basis.fromIso,
      toIso: weeks[weeks.length - 1]?.dateIso ?? pattern.basis.fromIso,
    },
  };
}

export interface DriftReport {
  verdict: DriftVerdict;
  /** Set only when the verdict is `drifted`; a direction without a drift would be a hint. */
  direction: DriftDirection | null;
  recent: WindowCoverage;
  earlier: WindowCoverage;
  /** The weeks in the recent window that fell outside, named rather than counted. */
  recentMisses: readonly Miss[];
  wouldSettleIt: readonly string[];
  basis: { window: number; floor: number };
}

/**
 * Has this session's range stopped fitting?
 *
 * Returns a statement. There is deliberately no second return value carrying a corrected pattern,
 * and no option that would produce one — see the module note. The caller's only move is to read
 * it and decide, which is the point.
 */
export function driftReport(pattern: SessionPattern): DriftReport {
  const scored = backtest(pattern);
  // Scored weeks are the scorable ones after the floor: below it `forecast` refuses, so those
  // weeks were never given a range to be right or wrong about.
  const scorable = pattern.weeks.filter((week) => week.offerable > 0);
  const scoredWeeks = scorable.slice(MIN_RECORDED_WEEKS);
  const walkForwardMiss = new Map(
    (scored.ok ? scored.score.misses : []).map((miss) => [miss.dateIso, miss]),
  );

  const recentWeeks = scoredWeeks.slice(-DRIFT_WINDOW_WEEKS);
  const earlierWeeks = scoredWeeks.slice(0, Math.max(0, scoredWeeks.length - DRIFT_WINDOW_WEEKS));
  const basis = { window: DRIFT_WINDOW_WEEKS, floor: MIN_RECORDED_WEEKS };

  // How the range was doing BEFORE the window — the forecaster's own walk-forward record.
  const earlier: WindowCoverage = {
    weeks: earlierWeeks.length,
    covered: earlierWeeks.filter((week) => !walkForwardMiss.has(week.dateIso)).length,
    dateIsos: earlierWeeks.map((week) => week.dateIso),
  };

  if (recentWeeks.length < DRIFT_WINDOW_WEEKS) {
    return {
      verdict: "cannot_determine",
      direction: null,
      // W234: COMPUTED, not hard-coded. The first version returned `covered: 0` here and
      // `renderDrift` printed it unconditionally, so a session whose recent weeks were all inside
      // the range read "0 inside the range" — a fabricated alarming number, in the module whose
      // whole point is not manufacturing verdicts. Walk-forward coverage is the honest figure
      // when there is no full window to freeze a range against.
      recent: {
        weeks: recentWeeks.length,
        covered: recentWeeks.filter((week) => !walkForwardMiss.has(week.dateIso)).length,
        dateIsos: recentWeeks.map((week) => week.dateIso),
      },
      earlier,
      recentMisses: [],
      wouldSettleIt: [
        `Record ${DRIFT_WINDOW_WEEKS - recentWeeks.length} more week(s) of this session, then this can be checked.`,
      ],
      basis,
    };
  }

  // The range as it stood at the start of the window, held still for every week in it — see the
  // module note. Re-forecasting per week would let the shift widen the range and hide itself.
  const frozen = frozenBefore(pattern, recentWeeks[0]!.dateIso);
  const recentMisses: Miss[] = [];
  let coveredRecently = 0;
  for (const week of recentWeeks) {
    const result = forecast(frozen, week.offerable);
    if (!result.ok) continue;
    const { low, high } = result.forecast;
    if (week.filled >= low && week.filled <= high) {
      coveredRecently += 1;
      continue;
    }
    recentMisses.push({
      dateIso: week.dateIso,
      actual: week.filled,
      low,
      high,
      by: week.filled < low ? low - week.filled : week.filled - high,
    });
  }

  const recent: WindowCoverage = {
    weeks: recentWeeks.length,
    covered: coveredRecently,
    dateIsos: recentWeeks.map((week) => week.dateIso),
  };

  const allMissed = recentMisses.length === recentWeeks.length;
  const directions = new Set(
    recentMisses.map((miss) =>
      miss.actual > miss.high ? "filling_more_than_the_record" : "filling_less_than_the_record",
    ),
  );
  const drifted = allMissed && directions.size === 1;

  return {
    verdict: drifted ? "drifted" : "tracking",
    direction: drifted ? ([...directions][0] as DriftDirection) : null,
    recent,
    earlier,
    recentMisses,
    wouldSettleIt: drifted
      ? [
          "Look at what changed about this session — its length, its clinician, the time it runs, or what the practice offers alongside it.",
          "Check whether you opened more slots in this session recently. W232 found this line missing: a practice acting on the capacity page is the one cause a reader of that page is most likely to have created themselves, and it was the only cause this list did not name.",
          "Nothing here has been adjusted. If the session genuinely changed, the range will follow as the new weeks accumulate.",
        ]
      : [],
    basis,
  };
}

/** The report as a practice reads it. The numbers are in every verdict, not only the alarming one. */
export function renderDrift(report: DriftReport): string {
  const lines = [DRIFT_VERDICT_COPY[report.verdict]];
  if (report.direction) lines.push(DRIFT_DIRECTION_COPY[report.direction]);
  lines.push(
    `Recent ${report.recent.weeks} scored week(s): ${report.recent.covered} inside the range. ` +
      `Earlier ${report.earlier.weeks} scored week(s): ${report.earlier.covered} inside the range.`,
  );
  if (report.recentMisses.length > 0) {
    lines.push(
      `Outside the range recently: ${report.recentMisses
        .map((miss) => `${miss.dateIso} (${miss.actual} filled, range ${miss.low}–${miss.high})`)
        .join("; ")}.`,
    );
  }
  for (const step of report.wouldSettleIt) lines.push(step);
  return lines.join("\n");
}

// W224: every forecast is scored against what actually happened.
//
// W223 built a range. A range is honest about uncertainty and says nothing at all about whether
// this forecaster has ever been right, and those are different questions — a practice reading
// "4 to 6 will fill" has no way to know whether that sentence has been accurate once. So the
// score travels with the forecast, and the way it is computed is the whole unit.
//
// COVERAGE ALONE REWARDS USELESSNESS, AND THIS IS THE POINT WORTH GETTING RIGHT. A forecaster
// that says "0 to 6 of 6" every week has perfect coverage and has told nobody anything. So the
// score carries WIDTH beside coverage and neither is reportable without the other: `scoreLine`
// emits both or neither, and a test asserts a wide-open forecaster scores 100% coverage AND is
// visibly useless in the same sentence. A number that can only be read one way is the only kind
// worth putting in front of a practice.
//
// WALK-FORWARD, WITH NO LOOKAHEAD. Week i is forecast from weeks 0..i-1 and compared with what
// week i actually recorded. The lookahead bug — scoring a forecast against data it was built
// from — is the classic failure of this exact code, it inflates every score, and it is invisible
// in the output because the numbers simply look good. So the sub-pattern handed to `forecast` is
// truncated before the week being scored, and a test proves the truncation by scoring a
// forecaster against a week whose value could not have been known.
//
// THE MISSES ARE LISTED, NOT COUNTED. A percentage lets a reader skip the failures; naming the
// weeks where the actual fell outside, and by how much, is what makes a bad forecaster look bad.
// W120's rule about silence, applied to a score rather than to a figure.
//
// AND SKIPPED WEEKS ARE NAMED. The first few weeks cannot be scored — there is not yet enough
// history to forecast from — and a score computed over "the weeks we could score" while reading
// as "the weeks" is a denominator quietly chosen after the fact. The count is carried.

import {
  MIN_RECORDED_WEEKS,
  forecast,
  type Forecast,
  type ForecastResult,
} from "./forecast";
import type { RecordedWeek, SessionPattern } from "./model";

export interface Miss {
  dateIso: string;
  /** What the record shows was filled that week. */
  actual: number;
  low: number;
  high: number;
  /** How far outside the range, in slots. Always positive on a miss. */
  by: number;
}

export interface BacktestScore {
  /** Weeks a forecast could be made for and compared against. */
  weeksScored: number;
  /**
   * Weeks that could not be scored because there was not yet enough history to forecast from.
   *
   * Carried because a score over "the weeks we could score", read as "the weeks", is a
   * denominator chosen after the fact.
   */
  weeksSkipped: number;
  covered: number;
  /** covered / weeksScored. Never reportable without `meanWidthOfSlots` — see the module note. */
  coverageRate: number;
  /**
   * Mean range width as a fraction of the slots offered that week.
   *
   * 1 means the forecaster said "anywhere from none to all of them". This is the number that
   * stops perfect coverage reading as skill.
   */
  meanWidthOfSlots: number;
  /** Every week the actual fell outside the range, oldest first. Listed, never only counted. */
  misses: readonly Miss[];
  basis: { fromIso: string; toIso: string; floor: number };
}

export type BacktestRefusal =
  /** Not enough recorded weeks to forecast one week and still have one left to score it against. */
  | "too_few_recorded_weeks_to_score";

export const BACKTEST_REFUSAL_COPY: Record<BacktestRefusal, string> = {
  too_few_recorded_weeks_to_score: `Scoring needs more than ${MIN_RECORDED_WEEKS} recorded weeks: enough to make a forecast from, and at least one more to check it against. Until then this forecaster has no track record, which is not the same as a good one.`,
};

export type BacktestResult =
  | { ok: true; score: BacktestScore }
  | { ok: false; errors: BacktestRefusal[] };

/** The pattern as it stood before week `index` — the only thing a forecast for it may see. */
function historyBefore(pattern: SessionPattern, index: number): SessionPattern {
  const weeks: readonly RecordedWeek[] = pattern.weeks.slice(0, index);
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

/**
 * Score this pattern's forecaster against its own recorded history, walking forward.
 *
 * Each week is forecast for the slots THAT WEEK actually offered, because scoring a forecaster on
 * a capacity the practice never had would measure something nobody will ever ask it.
 */
export function backtest(pattern: SessionPattern): BacktestResult {
  const scorable = pattern.weeks.filter((week) => week.offerable > 0);
  if (scorable.length <= MIN_RECORDED_WEEKS) {
    return { ok: false, errors: ["too_few_recorded_weeks_to_score"] };
  }

  const misses: Miss[] = [];
  let covered = 0;
  let scored = 0;
  let skipped = 0;
  let widthTotal = 0;

  for (let index = 0; index < scorable.length; index += 1) {
    const week = scorable[index]!;
    // The forecast for this week sees ONLY the weeks before it. Truncation, not a flag.
    const before: SessionPattern = historyBefore({ ...pattern, weeks: scorable }, index);
    const result: ForecastResult = forecast(before, week.offerable);
    if (!result.ok) {
      skipped += 1;
      continue;
    }
    const { low, high }: Forecast = result.forecast;
    scored += 1;
    widthTotal += (high - low) / week.offerable;
    if (week.filled >= low && week.filled <= high) covered += 1;
    else {
      misses.push({
        dateIso: week.dateIso,
        actual: week.filled,
        low,
        high,
        by: week.filled < low ? low - week.filled : week.filled - high,
      });
    }
  }

  return {
    ok: true,
    score: {
      weeksScored: scored,
      weeksSkipped: skipped,
      covered,
      coverageRate: scored === 0 ? 0 : covered / scored,
      meanWidthOfSlots: scored === 0 ? 0 : widthTotal / scored,
      misses,
      basis: {
        fromIso: scorable[0]!.dateIso,
        toIso: scorable[scorable.length - 1]!.dateIso,
        floor: MIN_RECORDED_WEEKS,
      },
    },
  };
}

/**
 * The score as a practice reads it — coverage and width in one sentence, or neither.
 *
 * A forecaster that is usually wrong cannot present as one that is usually right, and the
 * mechanism is that there is no way to render half of this. `renderScore` emits both numbers or
 * the refusal; there is no accessor here that returns a coverage percentage on its own, and a
 * test asserts the absence on the namespace.
 */
export function renderScore(result: BacktestResult): string {
  if (!result.ok) return result.errors.map((error) => BACKTEST_REFUSAL_COPY[error]).join(" ");
  const { weeksScored, weeksSkipped, covered, coverageRate, meanWidthOfSlots, misses, basis } =
    result.score;
  const pct = Math.round(coverageRate * 100);
  const width = Math.round(meanWidthOfSlots * 100);
  const lines = [
    `Checked against what actually happened: ${covered} of ${weeksScored} recorded weeks fell inside the range (${pct}%), ` +
      `and the range covered ${width}% of the slots offered on average. A range covering most of the slots is easy to be right about.`,
    `Scored over ${basis.fromIso} to ${basis.toIso}. ${weeksSkipped} week(s) could not be scored — there was not yet enough history to forecast from, and they are not counted either way.`,
  ];
  lines.push(
    misses.length === 0
      ? "No recorded week fell outside the range."
      : `Outside the range: ${misses
          .map((miss) => `${miss.dateIso} (${miss.actual} filled, range ${miss.low}–${miss.high}, out by ${miss.by})`)
          .join("; ")}.`,
  );
  return lines.join("\n");
}

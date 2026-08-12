// W223: "open six slots on Thursday → four to six fill" — an interval, never a point.
//
// W222 carries every recorded week individually and computes no average, deliberately, so that
// this unit derives a number rather than inheriting one. The derivation is the whole unit, and
// three things about it are decisions rather than arithmetic.
//
// THERE IS NO POINT ESTIMATE, AND THE TYPE IS WHY. `Forecast` has `low` and `high` and no third
// number. Not "and we recommend showing the range" — there is no `expected`, no `mean`, no
// `mostLikely` field for a console to reach for, and a test asserts the absence on the type's own
// keys. A practice manager given "5.2" will plan around 5.2; given "4 to 6" they plan around not
// knowing. W215 made `Comparator` a one-member union and W219 made `attributable` a literal
// `false` for the same reason: the honest thing has to be the only representable thing.
//
// THE INTERVAL IS THE OBSERVED RANGE, NOT A FITTED ONE. Between the recorded weeks, the fill rate
// ranged from x to y; applied to the slots being opened, that is the range. Nothing is fitted,
// smoothed, or assumed normal. A parametric interval would be defensible statistics and the wrong
// product: it produces a number with a confidence attached, and a confidence attached to eight
// observations of a GP's Thursday is a decoration. **The observed range cannot be more precise
// than the record, which is the property being bought.**
//
// The rounding widens rather than narrows — floor the low, ceil the high — because a forecast that
// is wrong in the narrow direction has told a practice it knows something it does not.
//
// AND THE FLOOR IS A CONSTANT, NOT A PARAMETER. `forecast()` takes no minimum-weeks argument and
// no options object that could grow one, so there is no call site at which somebody, having seen
// that a clinician has three recorded Thursdays, decides three is enough. W222 refused a default
// fill rate on exactly this reasoning and W196 refused a per-report aggregation floor before it.
// The refusal below the floor is W196's zero argument in a second place: a confident number over
// thin data and an honest refusal are different claims, and only one of them is true.
//
// A NOTE ON THE NARROW INTERVAL. Four weeks that all filled identically produce `low === high`,
// and that is reported as-is rather than widened. Widening it would be inventing uncertainty,
// which is the same sin as inventing precision and harder to notice. What protects the reader is
// the basis: the recorded rates travel with the figure, so "4 to 4 over four weeks" can be read
// for what it is.

import type { SessionPattern } from "./model";

/**
 * The fewest recorded weeks a forecast may rest on.
 *
 * Four: a month of the same weekday. Below that the "observed range" is one or two numbers and
 * the width of the interval says more about how little was recorded than about the session. Fixed
 * here, before anybody has looked at a particular clinician's history — see the module note.
 */
export const MIN_RECORDED_WEEKS = 4;

export type ForecastRefusal =
  /** Fewer recorded weeks than the floor. Not a wider interval — no interval. */
  | "too_few_recorded_weeks"
  /** Asked to forecast for no slots. There is nothing to fill. */
  | "no_slots_offered";

export const FORECAST_REFUSAL_COPY: Record<ForecastRefusal, string> = {
  too_few_recorded_weeks: `There are fewer than ${MIN_RECORDED_WEEKS} recorded weeks for this session, so there is no range to give. A number over this little history would look like a forecast and be a guess.`,
  no_slots_offered:
    "No slots were offered, so there is nothing to fill. This is not a forecast of zero.",
};

export interface ForecastBasis {
  recordedWeeks: number;
  fromIso: string;
  toIso: string;
  /**
   * The recorded fill rates the range was taken from, oldest first.
   *
   * Carried so a reader can check the interval rather than believe it — W196's rule, and the
   * thing that lets "4 to 4 over four weeks" be read for what it is.
   */
  observedRates: readonly number[];
  /** The floor this forecast had to clear, stated so the refusal is checkable. */
  floor: number;
}

/**
 * A range, and nothing that could be mistaken for a single answer.
 *
 * Deliberately three fields. A `expected`/`mean`/`mostLikely` here is the failure this unit
 * exists to prevent, and its absence is asserted on the object's own keys.
 */
export interface Forecast {
  slotsOffered: number;
  /** Fewest filled, at the lowest rate the record shows. Rounded down. */
  low: number;
  /** Most filled, at the highest rate the record shows. Rounded up, capped at what was offered. */
  high: number;
  basis: ForecastBasis;
}

export type ForecastResult =
  | { ok: true; forecast: Forecast }
  | { ok: false; errors: ForecastRefusal[] };

/**
 * Turn a recorded pattern into a range for a number of slots.
 *
 * Every refusal is returned, not the first — a caller that fixed one and hit the next would
 * otherwise learn about them one firing at a time.
 */
export function forecast(pattern: SessionPattern, slotsOffered: number): ForecastResult {
  const errors: ForecastRefusal[] = [];
  if (slotsOffered <= 0) errors.push("no_slots_offered");

  // Only weeks with an offerable slot carry a rate; a week with none has no denominator, which is
  // W222's refusal inherited rather than re-decided here.
  const rates = pattern.weeks
    .filter((week) => week.offerable > 0)
    .map((week) => week.filled / week.offerable);

  if (rates.length < MIN_RECORDED_WEEKS) errors.push("too_few_recorded_weeks");
  if (errors.length > 0) return { ok: false, errors };

  const lowest = Math.min(...rates);
  const highest = Math.max(...rates);

  return {
    ok: true,
    forecast: {
      slotsOffered,
      // Widen rather than narrow: a forecast wrong in the narrow direction has told a practice it
      // knows something it does not.
      low: Math.max(0, Math.floor(lowest * slotsOffered)),
      high: Math.min(slotsOffered, Math.ceil(highest * slotsOffered)),
      basis: {
        recordedWeeks: rates.length,
        fromIso: pattern.basis.fromIso,
        toIso: pattern.basis.toIso,
        observedRates: rates,
        floor: MIN_RECORDED_WEEKS,
      },
    },
  };
}

/**
 * The sentence a practice reads.
 *
 * Past tense about the record, present about the offer, and no verb that claims to know what will
 * happen. "Between four and six filled" is a fact about recorded weeks; "four to six will fill" is
 * a promise, and the difference is one word.
 */
export function renderForecast(result: ForecastResult): string {
  if (!result.ok) return result.errors.map((error) => FORECAST_REFUSAL_COPY[error]).join(" ");
  const { slotsOffered, low, high, basis } = result.forecast;
  const range = low === high ? `${low}` : `${low} to ${high}`;
  return (
    `Of ${slotsOffered} slots offered, ${range} filled in the weeks on record. ` +
    `Counted over ${basis.recordedWeeks} recorded weeks, ${basis.fromIso} to ${basis.toIso}. ` +
    `This is the range the record shows, not a prediction.`
  );
}

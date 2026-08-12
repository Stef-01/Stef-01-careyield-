// W225: a suggestion to a practice about its own diary — and the one thing it must never become.
//
// "Open six slots on Thursday" is operational advice about a practice's own schedule, which this
// product may give. "Open six slots on Thursday and invite these six people" is a decision about
// six named patients wearing an operational sentence, and it is one field away.
//
// THAT FIELD DOES NOT EXIST, AND ITS ABSENCE IS THE UNIT. `SessionOpening` names a practice, a
// clinician, a weekday and a number. There is no `patients`, no `candidates`, no `invite`, no
// `who` — and the guarantee is not that a filter removes them, because a filter is a line
// somebody can delete and its removal looks like a simplification. There is nowhere to put one.
// A test asserts it on the object's own keys, on every exported signature, and on the module
// namespace, because `openingFor(patient)` reads innocently. W219 refused a per-patient effect
// the same way and W213 made the matcher structurally blind by the same means.
//
// WHY A FILTER WOULD BE THE WRONG SHAPE HERE SPECIFICALLY. This module's whole input is a session
// pattern — a clinician, a weekday, counts. A patient list would have to be ADDED to produce one,
// which means the absence costs nothing to maintain and the presence would be a deliberate act.
// That asymmetry is what makes an absence a control rather than a habit.
//
// THE RECORD DOES NOT SPEAK ABOUT SESSIONS IT HAS NEVER SEEN. Asked about twelve slots when every
// recorded Thursday offered eight, the honest answer is not a scaled-up range — it is that the
// record says nothing about a Thursday that size. Extrapolating is where a forecast quietly turns
// into a promise, and the arithmetic for it is trivially available, which is why the refusal is
// explicit. W196 refuses a figure over no records; this refuses a figure over no comparable ones.
//
// AND THE SCORE TRAVELS, ALWAYS. W224's finding is that coverage alone rewards a forecaster who
// says "none to all of them" every week, so its score carries width beside coverage and emits
// both or neither. A recommendation is exactly where somebody would be tempted to show the range
// and leave the score behind — the range looks like a fact and the score looks like a caveat. So
// `SessionOpening` cannot be constructed without one: the score is a required field, not an
// option, and `recommendOpening` refuses outright when the forecaster has never been scored.
// An unproven forecaster making suggestions is the failure this composition exists to prevent.

import { backtest, type BacktestScore } from "./backtest";
import { forecast, type Forecast } from "./forecast";
import type { SessionPattern } from "./model";

export type OpeningRefusal =
  /** More slots than any recorded week of this session ever offered. The record cannot speak. */
  | "beyond_any_recorded_offering"
  /** The forecaster has never been scored, so a suggestion would carry no accuracy with it. */
  | "forecaster_never_scored"
  /** W223 refused the range itself; its reasons are carried rather than restated. */
  | "no_range_for_this_session";

export const OPENING_REFUSAL_COPY: Record<OpeningRefusal, string> = {
  beyond_any_recorded_offering:
    "No recorded week of this session ever offered this many slots, so the record has nothing to say about one that size. Scaling the smaller weeks up would be a guess wearing a range.",
  forecaster_never_scored:
    "There is not yet enough history to check this forecast against what actually happened, so there is no accuracy to show you alongside it. A suggestion without one is a number you have no way to judge.",
  no_range_for_this_session:
    "There is no range for this session, so there is nothing to base a suggestion on.",
};

/**
 * What the record supports opening, for one session.
 *
 * Note what is NOT here: nobody. Four identifiers of a session and two figures about it. See the
 * module note — the absence is the unit, and it is asserted on these keys.
 */
export interface SessionOpening {
  practiceId: string;
  clinicianId: string;
  weekday: number;
  /** The number of slots the question was asked about. */
  slots: number;
  /** W223's range for that number, composed rather than recomputed. */
  forecast: Forecast;
  /** W224's score. REQUIRED — a range cannot be handed over without its accuracy. */
  score: BacktestScore;
  /** The largest number of slots any recorded week of this session offered. */
  largestRecordedOffering: number;
}

export type OpeningResult =
  | { ok: true; opening: SessionOpening }
  | { ok: false; errors: OpeningRefusal[] };

/**
 * What the record supports, for a session and a number of slots.
 *
 * Takes a pattern and a count. It does not take, and could not use, a list of people.
 */
export function recommendOpening(pattern: SessionPattern, slots: number): OpeningResult {
  const errors: OpeningRefusal[] = [];

  const offerings = pattern.weeks.map((week) => week.offerable).filter((n) => n > 0);
  const largestRecordedOffering = offerings.length > 0 ? Math.max(...offerings) : 0;
  if (slots > largestRecordedOffering) errors.push("beyond_any_recorded_offering");

  const scored = backtest(pattern);
  if (!scored.ok) errors.push("forecaster_never_scored");

  const range = forecast(pattern, slots);
  if (!range.ok) errors.push("no_range_for_this_session");

  if (errors.length > 0 || !scored.ok || !range.ok) return { ok: false, errors };

  return {
    ok: true,
    opening: {
      practiceId: pattern.practiceId,
      clinicianId: pattern.clinicianId,
      weekday: pattern.weekday,
      slots,
      forecast: range.forecast,
      score: scored.score,
      largestRecordedOffering,
    },
  };
}

/**
 * Fields a session opening must never carry, with the reason each is refused.
 *
 * Data rather than a comment, so a later unit has to DELETE a stated refusal rather than quietly
 * widen an interface — W196's `REFUSED_FIGURES` shape, and the register a reviewer reads first.
 */
export const REFUSED_OPENING_FIELDS: Readonly<Record<string, string>> = {
  patients:
    "A list of who to invite. This is the whole line: a suggestion about a diary is operational, and the same sentence with six names attached is a decision about six people. W5's pool already decides who is eligible and W214's matcher decides who gets which slot; neither belongs in a sentence about how many slots to open.",
  candidateRef:
    "W213's pseudonym for a patient. A pseudonym is still a person — W221 found that out when it hid the matcher from the ADM register — so it is refused here by name as well as by type.",
  reason:
    "Why these patients need appointments. That is a clinical claim about a cohort, and it is the sentence that would turn a capacity tool into a triage.",
  urgency:
    "How soon the session should be opened. The record shows what filled; it says nothing about what is urgent, and G7's line is exactly here.",
};

/** The sentence a practice reads. The score is in it, not beside it — W224's rule. */
export function renderOpening(result: OpeningResult): string {
  if (!result.ok) return result.errors.map((error) => OPENING_REFUSAL_COPY[error]).join(" ");
  const { slots, forecast: range, score, largestRecordedOffering } = result.opening;
  const filled = range.low === range.high ? `${range.low}` : `${range.low} to ${range.high}`;
  return (
    `If you open ${slots} slots, ${filled} filled in the weeks on record. ` +
    `The largest this session has ever offered is ${largestRecordedOffering}. ` +
    `Over ${score.weeksScored} scored weeks this range covered what happened ` +
    `${score.covered} times, with an average width of ${Math.round(score.meanWidthOfSlots * 100)}% of the slots offered. ` +
    `It is your diary; this says what the record shows, and nothing about any patient.`
  );
}

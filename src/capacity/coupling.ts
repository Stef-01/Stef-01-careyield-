// W231: the forecast wired to how many people get a message — declared, recorded, and OFF.
//
// Every capacity unit since W222 has been read by a person and acted on by nobody. W225 said so
// in as many words ("wired to nothing: no code path takes it and changes what Meherr sends") and
// W226 recorded it as a TRIGGER rather than a fact, because the day that stops being true is the
// day a forecast starts deciding something about people. This is that unit, and it ships off.
//
// THE OBVIOUS IMPLEMENTATION IS A UNIT ERROR, and it is the first thing anybody would write.
// W5 sizes a batch as `ceil(openSlots / expectedResponseRate)`, where the rate is the hard-coded
// 0.25 in `DEFAULT_POOL_CONFIG` — commented "calibrated from history", which it has never been.
// The tempting fix is to calibrate it from W223's forecast. But W223's rate is SLOTS FILLED PER
// SLOT OFFERED and `expectedResponseRate` is BOOKINGS PER INVITATION SENT: different numerators,
// different denominators, and nothing in this tree records the second one. A session that filled
// 30 of 30 may have filled entirely from the front desk with no invitation sent at all.
// Substituting one for the other would divide by a number three to four times too large and cut
// the batch to a third, and it would look like a calibration. W226's `no-demand-claim` is the
// same observation about words: a fill rate measures uptake of what was offered.
//
// So the coupling does NOT touch the rate. It changes the QUESTION: not "how many slots are open
// today" but "how many does the record show still open at the end of the week", which is W229's
// spare, and which W223 can honestly answer because it is a statement about slots throughout.
//
// WHICH MEANS THIS COUPLING ONLY EVER SENDS FEWER MESSAGES, and that is the whole risk, stated
// plainly rather than buried under an efficiency argument. The spare is never more than the slots
// open, so the coupled batch is never larger than the uncoupled one. Sending fewer messages is
// the venture brief's own goal — "the fewest messages that fill the capacity" — and it is also
// this: A PATIENT WHO WOULD HAVE BEEN OFFERED AN APPOINTMENT IS NOT OFFERED ONE, because a model
// built from a diary said the slot would fill without them. That is the holdout arm's shape
// (W201 lists the holdout FIRST precisely because it withholds an offer) arriving without an
// experiment and without a disclosure. It is why `AUTOMATED_DECISIONS` carries a row for this
// module, why that row is `built_not_in_use`, and why the row's registry is the enablement list
// below: W201's test reads the list, so the published notice cannot stay dormant while a
// practice turns this on.
//
// THE CONSERVATIVE END, ALWAYS. The spare is a range, and the two ends are not equally tempting:
// the record's HIGHEST fill gives the fewest slots left over and therefore the biggest saving.
// This uses the LOWEST fill on record — the most slots left over, the most invitations — so the
// coupling never assumes a session will do better than its worst recorded week. A refusal in
// `REFUSED_COUPLINGS` names the other end, because it is one character away and it is the
// version somebody reaches for when the saving looks small.
//
// AND W228'S REPORT BECOMES A REFUSAL HERE. W228 built a drift monitor and deliberately gave it
// no way to change anything, because reporting is the right posture for something a person
// reads. This is the first thing that ACTS on a range, so this is where a drifted range has to
// stop rather than inform: acting on a forecast that has stopped describing the session is the
// exact harm W228 was built to notice, and `cannot_determine` stops it too, because "we cannot
// tell whether this still fits" is not a green light (W179's rule).
//
// SHIPPED OFF MEANS TWO THINGS, BOTH PINNED. `ENABLED_COUPLINGS` is empty, and nothing outside
// `src/capacity/` imports this module — the control is off and it is also not wired. A test
// asserts each, so switching either on is a visible edit to a test rather than a line nobody
// reads.
//
// FOUNDER GATE (plan §4): no patient reaches this module. It takes a session's recorded pattern
// and a count of slots and returns a count of messages. There is no field, parameter or export
// here through which a person could arrive, and W225's three-way absence is re-asserted rather
// than assumed, because this is the module closest to actually contacting somebody.

import { backtest, type BacktestScore } from "./backtest";
import { driftReport } from "./drift";
import { forecast } from "./forecast";
import type { SessionPattern } from "./model";
import { batchSize, type PoolConfig } from "@/engine/pool";

/**
 * The forecaster's record at the moment a practice decided to switch this on.
 *
 * Stamped rather than looked up later, because the question somebody will ask in two years is
 * not "is the forecaster good" but "what did they know when they decided" — and by then the
 * score has moved. W56's provenance argument, applied to a decision instead of a document.
 */
export interface CouplingEvidence {
  weeksScored: number;
  covered: number;
  meanWidthOfSlots: number;
}

/**
 * One practice turning the coupling on, with the reason it gave.
 *
 * A record rather than a boolean. The thing that has to survive is not "it is on" but WHO
 * decided, WHEN, WHY and ON WHAT — because the consequence of this setting is that some patients
 * are not sent a message, and a flag cannot answer for that.
 */
export interface CouplingEnablement {
  practiceId: string;
  /** The person at the practice who decided. A practice decision has somebody behind it. */
  decidedBy: string;
  decidedAtIso: string;
  /** In the practice's own words. Validated as an actual reason, not as a non-empty string. */
  reason: string;
  evidence: CouplingEvidence;
}

/**
 * Practices that have enabled the coupling. EMPTY, and pinned empty by its own test.
 *
 * This is the registry `AUTOMATED_DECISIONS` points at for the `forecast-invitation-volume` row,
 * so W201's test reads THIS ARRAY to check the published notice's "built, not in use" claim. A
 * practice enabling the coupling therefore fails the suite until the notice is updated, which is
 * the mechanism rather than the promise.
 */
export const ENABLED_COUPLINGS: readonly CouplingEnablement[] = [];

export type EnablementRejection =
  | "no_practice"
  | "no_decider"
  | "decided_at_missing_or_unreadable"
  | "reason_missing_or_too_short"
  | "evidence_missing"
  | "evidence_from_an_unscored_forecaster";

export const ENABLEMENT_REJECTION_COPY: Record<EnablementRejection, string> = {
  no_practice: "An enablement that does not say which practice it is for would apply to all of them.",
  no_decider:
    "Nobody is recorded as having decided this. The consequence of the setting is that some patients are not sent a message, and a setting with no author cannot be asked about later.",
  decided_at_missing_or_unreadable:
    "Without the date the decision was taken, the evidence stamped beside it cannot be placed against anything.",
  reason_missing_or_too_short:
    "A reason of a few characters is a box somebody cleared, not a decision somebody took. This setting changes who is contacted, so the reason has to be one a reader can weigh.",
  evidence_missing:
    "The forecaster's record at the moment of the decision is not stamped here, so what the practice was looking at when they decided cannot be reconstructed.",
  evidence_from_an_unscored_forecaster:
    "This was switched on over a forecaster that had never been checked against what actually happened. An unproven range deciding how many people are contacted is the failure the score exists to prevent.",
};

/**
 * The floor on a reason, as a constant rather than a parameter.
 *
 * W196's rule: a threshold passed in at a call site is a threshold chosen after somebody has seen
 * what they want to get past it. W210 made the same call about a finding's trigger statement.
 */
export const MIN_REASON_LENGTH = 40;

/** Validate one enablement record, returning every reason it is refused. */
export function rejectionsForEnablement(enablement: CouplingEnablement): EnablementRejection[] {
  const out: EnablementRejection[] = [];
  if (enablement.practiceId.trim() === "") out.push("no_practice");
  if (enablement.decidedBy.trim() === "") out.push("no_decider");
  if (!/^\d{4}-\d{2}-\d{2}/.test(enablement.decidedAtIso)) out.push("decided_at_missing_or_unreadable");
  if (enablement.reason.trim().length < MIN_REASON_LENGTH) out.push("reason_missing_or_too_short");

  const evidence = enablement.evidence as CouplingEvidence | undefined;
  if (!evidence) {
    out.push("evidence_missing");
    return out;
  }
  if (evidence.weeksScored <= 0) out.push("evidence_from_an_unscored_forecaster");
  return out;
}

/** The enablement for one practice, or null. Takes the list, so no answer arrives without one. */
export function enablementFor(
  enablements: readonly CouplingEnablement[],
  practiceId: string,
): CouplingEnablement | null {
  const valid = enablements.filter((e) => rejectionsForEnablement(e).length === 0);
  return valid.find((e) => e.practiceId === practiceId) ?? null;
}

export type CouplingRefusal =
  /**
   * More slots than any recorded week of this session ever offered.
   *
   * W234: the read-only `recommendOpening` has refused this since W225, and the module that ACTS
   * did not — so the one that only informs was stricter than the one that withholds invitations.
   * With a ten-slot record and twelve slots opened, the coupling sized a batch from a fill rate
   * the record never observed and halved the messages on it. Refusing here is W196's rule
   * ("a figure over no records") in the place where it costs somebody an appointment offer.
   */
  | "beyond_any_recorded_offering"
  /** The shipped state, and the ordinary answer. Not an error — see the module note. */
  | "not_enabled_for_this_practice"
  /** W223 refused the range; its reasons are carried rather than restated. */
  | "no_range_for_this_session"
  /** W224: an unscored forecaster does not get to decide how many people are contacted. */
  | "forecaster_never_scored"
  /** W228's report, become a refusal because this is the first thing that acts on a range. */
  | "forecaster_has_drifted"
  /** W228's third value. "We cannot tell whether this still fits" is not a green light. */
  | "drift_cannot_be_determined";

export const COUPLING_REFUSAL_COPY: Record<CouplingRefusal, string> = {
  beyond_any_recorded_offering:
    "No recorded week of this session ever offered this many slots, so the record has nothing to say about one that size. Sizing the message count from the smaller weeks would send fewer invitations on the strength of a rate that was never observed here.",
  not_enabled_for_this_practice:
    "This practice has not switched this on, so the number of messages is the one your own settings produce and the record has had no part in it.",
  no_range_for_this_session:
    "There is no range for this session, so there is nothing for the number of messages to rest on.",
  forecaster_never_scored:
    "This range has never been checked against what actually happened, so it does not get to change how many people are contacted.",
  forecaster_has_drifted:
    "Recent weeks all fell outside this range in the same direction, so it has stopped describing this session. Nothing has been adjusted and nothing has been sized from it.",
  drift_cannot_be_determined:
    "There are not enough scored weeks to say whether this range still fits this session. That is not the same as it fitting, so nothing has been sized from it.",
};

export type CouplingDirection = "fewer_messages" | "unchanged";

export interface CoupledVolume {
  /** What W5's own arithmetic produces from the slots open today. */
  uncoupled: number;
  /** What it produces from the slots the record shows still open at the end of the week. */
  coupled: number;
  /**
   * Which way this went. Never inferred by a reader from two numbers, and never absent.
   *
   * There are only two values, and the missing third is the point: this coupling cannot send
   * MORE messages, because the spare is never larger than the slots open. See the module note.
   */
  direction: CouplingDirection;
  basis: {
    openSlots: number;
    /** The most slots the record shows left over — the LOWEST fill on record, never the highest. */
    spareAtLowestRecordedFill: number;
    score: BacktestScore;
    enabledBy: string;
    enabledAtIso: string;
  };
}

export type CouplingResult =
  | { ok: true; volume: CoupledVolume }
  | { ok: false; errors: CouplingRefusal[] };

/**
 * How many messages to send for a session, with the record taken into account.
 *
 * Takes the enablement list explicitly rather than reading the shipped one, so a caller cannot
 * get a coupled number without saying which practice decided and on what — W227's shape, for the
 * same reason.
 *
 * Note what is NOT in this signature: no patient, no candidate, no panel. It answers with a
 * COUNT of messages; who receives them is W5's ranking and W4's eligibility, untouched here.
 */
export function coupledInvitationVolume(
  pattern: SessionPattern,
  openSlots: number,
  poolConfig: PoolConfig,
  enablements: readonly CouplingEnablement[],
): CouplingResult {
  const errors: CouplingRefusal[] = [];

  const enablement = enablementFor(enablements, pattern.practiceId);
  if (!enablement) errors.push("not_enabled_for_this_practice");

  const scored = backtest(pattern);
  if (!scored.ok) errors.push("forecaster_never_scored");

  const range = forecast(pattern, openSlots);
  if (!range.ok) errors.push("no_range_for_this_session");

  // W234. Same guard W225 has always had, in the module that acts rather than only the one that
  // informs — see the refusal's own note.
  const offerings = pattern.weeks.filter((w) => w.offerable > 0).map((w) => w.offerable);
  const largestRecordedOffering = offerings.length > 0 ? Math.max(...offerings) : 0;
  if (openSlots > largestRecordedOffering) errors.push("beyond_any_recorded_offering");

  // W228, composed rather than re-derived. A range that has stopped describing the session must
  // not size anything, and neither must one nobody can vouch for yet.
  const drift = driftReport(pattern);
  if (drift.verdict === "drifted") errors.push("forecaster_has_drifted");
  if (drift.verdict === "cannot_determine") errors.push("drift_cannot_be_determined");

  if (errors.length > 0 || !enablement || !scored.ok || !range.ok) return { ok: false, errors };

  // The LOWEST fill on record leaves the MOST slots over, so this is the conservative end and
  // the largest batch the coupling can produce. `forecast.low` is that lowest fill.
  const spareAtLowestRecordedFill = openSlots - range.forecast.low;
  const uncoupled = batchSize(openSlots, poolConfig);
  const coupled = batchSize(spareAtLowestRecordedFill, poolConfig);

  return {
    ok: true,
    volume: {
      uncoupled,
      coupled,
      direction: coupled === uncoupled ? "unchanged" : "fewer_messages",
      basis: {
        openSlots,
        spareAtLowestRecordedFill,
        score: scored.score,
        enabledBy: enablement.decidedBy,
        enabledAtIso: enablement.decidedAtIso,
      },
    },
  };
}

/**
 * What this coupling must never do, with the reason each is refused.
 *
 * Data rather than a comment — W196's `REFUSED_FIGURES` shape — so a later unit has to delete a
 * stated refusal rather than quietly add a line.
 */
export const REFUSED_COUPLINGS: Readonly<Record<string, string>> = {
  fill_rate_as_response_rate:
    "Setting `expectedResponseRate` from W223's forecast. It is the first thing anybody would write and it is a unit error: the forecast is slots filled per slot OFFERED and the pool config is bookings per invitation SENT. Different denominators, and this tree records only the first. Substituting one for the other divides by a number several times too large and cuts the batch to a fraction, while looking exactly like the calibration the code comment has been promising since W5.",
  the_flattering_end_of_the_range:
    "Sizing from the record's HIGHEST fill instead of its lowest. That leaves the fewest slots to cover and produces the biggest reduction in messages, which is why it is the end somebody reaches for when the saving looks small. It also assumes every future week does at least as well as the best week on record, which is the assumption W223 built an interval to avoid.",
  more_messages_than_uncoupled:
    "Sizing a batch LARGER than the practice's own settings produce. The record is being used here to say a session needs less help than it looks like it needs; letting it argue the other way would make a fitted number the reason somebody was contacted, rather than the reason somebody was not.",
  per_patient_volume:
    "Varying the number of messages by who is in the panel. This module returns a COUNT; which people it applies to is W4's eligibility and W5's ranking, and a count that changed with the panel would be a decision about the panel wearing a number.",
  enable_itself_on_evidence:
    "Switching on automatically once the forecaster scores well enough. The whole content of this unit is that a practice decides, with a reason a person wrote, and a threshold that flips the setting would replace that with a number somebody picked after seeing the data (W222's warning).",
  silently_absorbing_drift:
    "Carrying on when W228 says the range has stopped fitting. W228 deliberately cannot change anything because reporting is right for something a person reads; this acts, so here the report has to stop it. `cannot_determine` stops it too — not knowing whether a range still fits is not permission to size from it.",
};

/** The sentence a practice reads about one session's message count. */
export function renderCoupling(result: CouplingResult): string {
  if (!result.ok) return result.errors.map((error) => COUPLING_REFUSAL_COPY[error]).join(" ");
  const { uncoupled, coupled, basis } = result.volume;
  return (
    `Your settings size this session at ${uncoupled} messages. Of the ${basis.openSlots} slots open, ` +
    `the least any week on record filled leaves ${basis.spareAtLowestRecordedFill} still open, ` +
    `so ${coupled} messages are being sent instead. ` +
    `Switched on by ${basis.enabledBy} on ${basis.enabledAtIso}, over ${basis.score.weeksScored} scored weeks. ` +
    `Fewer messages means some patients who would have had one about this session do not.`
  );
}

// W233: did opening slots help? — a question this tree cannot answer, and the arm it would need.
//
// W215 asked the same question about MESSAGES and could answer it, because W8 randomises patients
// into an invited arm and a holdout arm before anybody is contacted. That arm exists, so the
// comparison exists. This unit asks it about OPENING SLOTS, and the arm does not exist: nobody
// has ever randomised sessions into "open extra" and "leave as usual". A practice opens slots
// because it judges it needs to.
//
// WHICH IS THE WHOLE PROBLEM, AND IT IS WORSE THAN MISSING DATA. The decision to open slots is
// CAUSED BY the same thing the opening would be measured against. Every comparator available
// without an arm is confounded in the direction that flatters the product:
//
//   BEFORE AND AFTER. A practice opens slots after a stretch of busy weeks, which are by
//   definition the unusual ones. Regression to the mean alone produces a change, and it will not
//   look like regression to the mean — it will look like the opening working.
//
//   OPENED VERSUS NOT OPENED. The sessions a practice chose to open are the ones it expected to
//   fill. Comparing them with the ones it left alone measures the practice's judgement about
//   demand, and reports it as the effect of the opening.
//
//   AND W231 MAKES THAT ONE ACTIVELY WORSE, which is the finding worth recording. The coupling
//   sends fewer messages to sessions the record says fill themselves — so once it is enabled the
//   sessions receiving the most help are exactly the ones the record says need it least. An
//   opened-versus-not comparison would then be measuring the coupling's own selection rule. The
//   coupling ships off, so this is not true today; it becomes true silently on the day a practice
//   switches it on, which is precisely how a confound arrives without anybody adding one.
//
// SO THE COMPARATOR IS A REQUIRED ARGUMENT OF A TYPE NOBODY CAN BUILD FROM THIS TREE'S DATA.
// W215 made its comparator a one-member union so a second is a visible widening; this goes one
// step further because the temptation here is not a second comparator but NO comparator. There
// is no function that takes recorded weeks and returns an effect. `capacityEffect` takes a
// `SessionArm` or it does not run, `SHIPPED_SESSION_ARMS` is empty, and a test asserts both —
// so "refuses to answer without an arm" is a signature, not a rule somebody remembers.
//
// THE OUTCOME IS A COUNT, NEVER A RATE, and this is the second finding. Open ten extra slots,
// five fill: five more people were seen and the fill RATE fell. A rate as the outcome reports a
// practice that successfully served more patients as having got worse, and recommends closing
// the slots. It is the third time this quarter the denominator has been the trap — W226's
// `no-demand-claim` (uptake is not demand) and W231's unit error (slots offered is not messages
// sent) are the same mistake wearing different clothes.
//
// THE ASSIGNMENT MUST PREDATE THE SESSION, and it is checked. An arm whose assignments were
// stamped after the sessions ran is not an arm; it is a labelling of what already happened, and
// it reintroduces every confound above while looking like a trial. This is the one property that
// distinguishes a real allocation from a post-hoc split, so it is the one the validator is built
// around.
//
// FOUNDER GATE (plan §4): no patient reaches this module. An assignment names a clinician, a
// weekday and a date; an outcome is a count of slots. There is nowhere here to put a person, and
// no per-session-per-patient answer to give — W215 refused a per-patient counterfactual for the
// same reason and by the same means.

import { MIN_RECORDED_WEEKS } from "./forecast";
import type { RecordedUtilisation } from "./model";

/**
 * Where a capacity effect may come from.
 *
 * One member, W215's shape, and the member names what it requires rather than what it is: the
 * sessions have to have been ASSIGNED to their arms, by something other than the practice's
 * judgement about which ones needed help.
 */
export type CapacityComparator = "assigned_session_arm";

export const ALL_CAPACITY_COMPARATORS: readonly CapacityComparator[] = ["assigned_session_arm"];

export type ArmName = "extra_slots_opened" | "left_as_usual";

export interface ArmAssignment {
  clinicianId: string;
  /** The session this assignment is about. */
  dateIso: string;
  arm: ArmName;
  /**
   * When the assignment was MADE. Must precede the session date.
   *
   * The single property separating an allocation from a label applied afterwards. See the module
   * note: a post-hoc split carries every confound this module exists to refuse, and looks
   * exactly like a trial in the data structure.
   */
  assignedAtIso: string;
}

/**
 * How a set of sessions was split into arms.
 *
 * One member, and it is not "the practice chose". A split made by judgement is the confound
 * rather than the control for it.
 */
export type Allocation = "randomised_before_the_session";

export interface SessionArm {
  practiceId: string;
  allocation: Allocation;
  assignments: readonly ArmAssignment[];
}

/**
 * Trials that have been run. EMPTY, and pinned empty by its own test.
 *
 * Not a founder gate — no gate covers randomising a practice's own diary. It is empty because
 * nobody has run one, and the honest consequence is that this product cannot today say whether
 * opening slots helps. That sentence is the deliverable; the arithmetic below is what becomes
 * available to somebody who runs the trial, and it is here so that the answer, when it exists,
 * is not computed a different way by whoever needs it first.
 */
export const SHIPPED_SESSION_ARMS: readonly SessionArm[] = [];

/**
 * The fewest sessions an arm needs before a difference is reported.
 *
 * DELIBERATELY NOT `MIN_ARM_PATIENTS`, and the reason is this quarter's recurring mistake: a
 * session is not a patient, and reusing W72's floor of 30 would be the same category error W231
 * found in the invitation arithmetic — a number lifted across a change of unit because both are
 * called an arm. This counts SESSIONS, so it is anchored to W223's floor on recorded weeks, the
 * only session-scale number this tree has argued for.
 *
 * A constant, never a parameter. W215 allows an override; the posture hardened after W222 and
 * W223, because a floor passed at a call site is one chosen after somebody has seen what they
 * want to get past it.
 */
export const MIN_SESSIONS_PER_ARM = MIN_RECORDED_WEEKS;

export type CapacityEffectRefusal =
  /** No trial has been run, so there is nothing to compare. The shipped answer. */
  | "no_session_arm"
  /** The split was not made in advance, so it labels what happened rather than allocating it. */
  | "assignment_did_not_precede_the_session"
  /** An arm has too few sessions for a difference between means to carry anything. */
  | "arm_below_floor"
  /** Assignments exist for sessions the record does not hold, so there is no outcome to read. */
  | "assigned_session_not_recorded";

export const CAPACITY_EFFECT_WITHHELD_COPY: Record<CapacityEffectRefusal, string> = {
  no_session_arm:
    "Nothing here can say whether opening slots helped. Answering that needs sessions to have been sorted into two groups before anyone decided which to open, and no practice has done that. The counts of what was recorded are still counts; the difference between busy weeks and quiet ones is not an answer to this question.",
  assignment_did_not_precede_the_session:
    "The groups were recorded after those sessions had already run, so they describe what happened rather than deciding it in advance. A split made afterwards carries the whole problem it was supposed to remove.",
  arm_below_floor:
    "One of the groups holds too few sessions for a difference between them to mean anything. The counts are still what was recorded; a difference of averages over a handful of sessions is noise with a decimal point.",
  assigned_session_not_recorded:
    "Some sessions in the trial have nothing recorded against them, so there is no result to read for those. Filling the gap by leaving them out would quietly choose which sessions count.",
};

export interface CapacityEffectBasis {
  comparator: CapacityComparator;
  allocation: Allocation;
  openedSessions: number;
  usualSessions: number;
  /** Slots filled, summed per arm. Counts, so the reader can check the means. */
  openedFilled: number;
  usualFilled: number;
  /** Stated so the refusal is checkable rather than believed. */
  floor: number;
}

export interface CapacityEffect {
  /**
   * Mean slots FILLED per session in each arm, and the difference.
   *
   * A count per session, never a fill rate — see the module note. A rate would report a practice
   * that opened ten slots and filled five as having got worse.
   */
  openedMeanFilled: number;
  usualMeanFilled: number;
  /** openedMeanFilled − usualMeanFilled. Negative is a real answer, not an error. */
  difference: number;
  basis: CapacityEffectBasis;
}

export type CapacityEffectResult =
  | { claimed: true; effect: CapacityEffect }
  | { claimed: false; withheld: CapacityEffectRefusal[]; basis: CapacityEffectBasis };

const EMPTY_BASIS: CapacityEffectBasis = {
  comparator: "assigned_session_arm",
  allocation: "randomised_before_the_session",
  openedSessions: 0,
  usualSessions: 0,
  openedFilled: 0,
  usualFilled: 0,
  floor: MIN_SESSIONS_PER_ARM,
};

/**
 * Did opening slots help, for one trial?
 *
 * Note the signature: the arm is REQUIRED and comes first. There is no overload that takes only
 * the recorded weeks, because that overload is the entire failure this unit exists to prevent —
 * every answer derivable from the record alone is confounded by the practice's own reason for
 * opening. `SHIPPED_SESSION_ARMS` is empty, so today this cannot be called with a real trial.
 */
export function capacityEffect(
  arm: SessionArm,
  recorded: readonly RecordedUtilisation[],
): CapacityEffectResult {
  const withheld: CapacityEffectRefusal[] = [];

  if (arm.assignments.length === 0) {
    return { claimed: false, withheld: ["no_session_arm"], basis: EMPTY_BASIS };
  }

  const filledFor = (assignment: ArmAssignment): number | null => {
    const found = recorded.find(
      (entry) =>
        entry.session.practiceId === arm.practiceId &&
        entry.session.clinicianId === assignment.clinicianId &&
        entry.session.dateIso === assignment.dateIso,
    );
    return found ? found.filled : null;
  };

  let openedSessions = 0;
  let usualSessions = 0;
  let openedFilled = 0;
  let usualFilled = 0;
  let anyLate = false;
  let anyMissing = false;

  for (const assignment of arm.assignments) {
    // The property that separates an allocation from a label. Checked per assignment rather than
    // per trial, because one late row is enough to make the split post-hoc.
    if (!(assignment.assignedAtIso < assignment.dateIso)) anyLate = true;
    const filled = filledFor(assignment);
    if (filled === null) {
      anyMissing = true;
      continue;
    }
    if (assignment.arm === "extra_slots_opened") {
      openedSessions += 1;
      openedFilled += filled;
    } else {
      usualSessions += 1;
      usualFilled += filled;
    }
  }

  const basis: CapacityEffectBasis = {
    comparator: "assigned_session_arm",
    allocation: arm.allocation,
    openedSessions,
    usualSessions,
    openedFilled,
    usualFilled,
    floor: MIN_SESSIONS_PER_ARM,
  };

  if (anyLate) withheld.push("assignment_did_not_precede_the_session");
  if (anyMissing) withheld.push("assigned_session_not_recorded");
  if (openedSessions < MIN_SESSIONS_PER_ARM || usualSessions < MIN_SESSIONS_PER_ARM) {
    withheld.push("arm_below_floor");
  }
  if (withheld.length > 0) return { claimed: false, withheld, basis };

  const openedMeanFilled = openedFilled / openedSessions;
  const usualMeanFilled = usualFilled / usualSessions;
  return {
    claimed: true,
    effect: {
      openedMeanFilled,
      usualMeanFilled,
      difference: openedMeanFilled - usualMeanFilled,
      basis,
    },
  };
}

/**
 * The answer for a practice today: there is no trial, so there is no answer.
 *
 * A named function rather than a caller reaching for `SHIPPED_SESSION_ARMS` and working it out,
 * because the working-it-out is where somebody substitutes the trend.
 */
export function capacityEffectForPractice(
  practiceId: string,
  recorded: readonly RecordedUtilisation[],
  arms: readonly SessionArm[] = SHIPPED_SESSION_ARMS,
): CapacityEffectResult {
  const arm = arms.find((candidate) => candidate.practiceId === practiceId);
  if (!arm) return { claimed: false, withheld: ["no_session_arm"], basis: EMPTY_BASIS };
  return capacityEffect(arm, recorded);
}

/**
 * Comparators this module refuses, with the confound each carries.
 *
 * Data rather than a comment — W196's `REFUSED_FIGURES` shape — so a later unit has to DELETE a
 * stated refusal rather than quietly add a function. Every one of these is respectable
 * arithmetic, which is the point: none of them is refused for being crude.
 */
export const REFUSED_CAPACITY_COMPARATORS: Readonly<Record<string, string>> = {
  before_and_after:
    "Comparing the weeks before a practice opened extra slots with the weeks after. A practice opens slots following a stretch of unusually busy weeks, and unusually busy weeks are followed by ordinary ones whatever anybody does. Regression to the mean produces a clean, sizeable, entirely spurious effect here, and it does not look like regression to the mean — it looks like the opening working.",
  opened_versus_not_opened:
    "Comparing the sessions a practice chose to open with the ones it left alone. The choice is made on an expectation about demand, so the two groups differ in exactly the way that inflates the estimate. This measures the practice's judgement and reports it as the effect of acting on it. W231's coupling makes it worse still: once enabled, the sessions getting the most help are the ones the record says need it least, so the comparison would be measuring a selection rule this product wrote.",
  trend_extrapolation:
    "Fitting a line through the recorded weeks and reading the slope as an effect. W227 refused this for seasonality and the objection is unchanged: a trend is a description of what happened, and calling the part after an intervention 'the effect' assumes the line would otherwise have continued, which is the counterfactual nobody has.",
  matched_or_synthetic_sessions:
    "Building a comparison group from similar sessions elsewhere, or a weighted composite of them. W215 refused exactly this for patients. A matched comparator is a model whose assumptions are invisible in the output, and a practice reads its confidence interval as a measurement.",
  the_fill_rate_as_the_outcome:
    "Measuring the effect as a change in fill RATE rather than in slots filled. Open ten extra slots and fill five: five more people were seen and the rate went down. A rate as the outcome reports a practice that served more patients as having got worse, and the advice that follows is to close the slots again.",
  the_forecast_as_the_baseline:
    "Using W223's range as what would have happened anyway. The range is built from the same session's own recorded weeks, so a session that changed is a session whose baseline changed with it — and W228 exists precisely because that range absorbs a shift after one week. A baseline that moves toward the thing it is measuring reports no effect where there is one, and an effect where there is none.",
};

/** The sentence to render when no claim can be made. Never a zero — W215's rule. */
export function capacityWithheldCopy(result: CapacityEffectResult): string | null {
  if (result.claimed) return null;
  return result.withheld.map((reason) => CAPACITY_EFFECT_WITHHELD_COPY[reason]).join(" ");
}

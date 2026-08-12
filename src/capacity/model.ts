// W222: sessions, slots and recorded utilisation — the model Q18's forecast will rest on.
//
// The forecast is W223. This unit is the thing underneath it, and it exists separately because
// the way a forecasting product goes wrong is almost never the arithmetic. It is the default: a
// session nobody has records for gets "about 70% fill, like the others", and from then on the
// number is indistinguishable from a measurement. So the load-bearing property of this module is
// a REFUSAL, and it is structural rather than remembered.
//
// THERE IS NO PARAMETER THROUGH WHICH A DEFAULT COULD ARRIVE. `historyFor` takes sessions and
// recorded appointments. No assumed rate, no fallback, no options object that could grow one —
// W196 took exactly this shape with its aggregation floors, for exactly this reason: a default
// passed at a call site is a default chosen after somebody has seen the data. A test asserts the
// absence on the signatures, not on the names.
//
// AND THIS MODULE COMPUTES NO AVERAGE. Not because averaging is wrong, but because an average is
// the first step of a forecast and putting it here would mean W223 inherits a number rather than
// deriving one. Every recorded week is carried individually, oldest first, with its basis. A test
// asserts no export reads as a prediction.
//
// THREE MODELLING DECISIONS THAT ARE NOT OBVIOUS:
//
//   A CANCELLED SLOT IS NEITHER FILLED NOR EMPTY. It was taken and then released, which is a
//   different fact from "nobody wanted it" and a different fact from "somebody came". Folding it
//   into either is a claim, and the flattering fold is available in both directions depending on
//   what you want the number to say. So `released` is counted separately and never silently
//   merged — the same three-valued discipline W170 applied to outcomes.
//
//   A RATE OVER ZERO SLOTS IS NOT ZERO PER CENT. A session with no slots has no utilisation, and
//   emitting 0 would put a session that does not exist alongside a session nobody booked. W196
//   refuses a figure over zero records for the same reason; this refuses the rate.
//
//   A SESSION IS DERIVED, NEVER STORED. It is a clinician, a date and the slots recorded against
//   them — read out of the appointment rail rather than kept as a second copy that can drift.
//   That is also why erasure needs nothing here: scrub the rail and these vanish.
//
// FOUNDER GATE (plan §4): nothing in this module reads a patient, a condition or an appointment
// reason. A slot is a slot. The counts are about a diary, and a test asserts the vocabulary
// cannot become clinical.

import type { Appointment } from "@/domain/types";

/** One clinician's slots on one date at one practice. Derived from the rail, never stored. */
export interface Session {
  practiceId: string;
  clinicianId: string;
  /** ISO date (YYYY-MM-DD), as the rail recorded it. */
  dateIso: string;
  /** 0 = Sunday. Carried so "Thursday sessions" is a fact rather than a string match. */
  weekday: number;
  slots: number;
}

/**
 * What the record says happened to a session's slots.
 *
 * `filled + open + released` is always `slots`, which a test pins: a disposition that went
 * missing would be a slot silently dropped from the denominator, and the rate would improve.
 */
export interface RecordedUtilisation {
  session: Session;
  /** Booked, attended, or recorded as a non-attendance. The slot was taken. */
  filled: number;
  /** Still open at the time of recording. */
  open: number;
  /** Taken and then released. Neither filled nor empty — see the module note. */
  released: number;
}

const WEEKDAY = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/**
 * Group recorded appointments into sessions, for one practice.
 *
 * Practice-scoped as the query rather than filtered afterwards — W123's rule, and W209's finding
 * about what happens when a store read forgets it.
 */
export function sessionsFrom(
  appointments: readonly Appointment[],
  practiceId: string,
): RecordedUtilisation[] {
  const byKey = new Map<string, RecordedUtilisation>();

  for (const appointment of appointments) {
    if (appointment.practiceId !== practiceId) continue;
    const dateIso = appointment.startsAt.slice(0, 10);
    const key = `${appointment.clinicianId}::${dateIso}`;
    const found = byKey.get(key) ?? {
      session: {
        practiceId,
        clinicianId: String(appointment.clinicianId),
        dateIso,
        weekday: WEEKDAY(dateIso),
        slots: 0,
      },
      filled: 0,
      open: 0,
      released: 0,
    };
    found.session.slots += 1;
    if (appointment.status === "open") found.open += 1;
    else if (appointment.status === "cancelled") found.released += 1;
    else found.filled += 1;
    byKey.set(key, found);
  }

  // Sorted by (date, clinician), so the result is a value rather than a rendering of the order
  // the rail happened to hold — W167's register, and the reason the tie-break is the id.
  return [...byKey.values()].sort(
    (a, b) =>
      a.session.dateIso.localeCompare(b.session.dateIso) ||
      a.session.clinicianId.localeCompare(b.session.clinicianId),
  );
}

export type RateRefusal =
  /** No slots at all, so there is no denominator. Not zero per cent — see the module note. */
  | "no_slots_recorded";

export type UtilisationRate =
  | { known: true; filledOfOfferable: number; basis: { filled: number; offerable: number } }
  | { known: false; refusal: RateRefusal };

/**
 * The fill rate of one recorded session, or a refusal.
 *
 * The denominator is filled + open — the slots that were ACTUALLY OFFERABLE. Released slots are
 * excluded from both sides rather than dropped from one: counting them as empty would punish a
 * session for a patient cancelling, and counting them as filled would credit it for a visit that
 * never happened. Excluding them says the record cannot tell, which is what is true.
 */
export function utilisationRate(recorded: RecordedUtilisation): UtilisationRate {
  const offerable = recorded.filled + recorded.open;
  if (offerable === 0) return { known: false, refusal: "no_slots_recorded" };
  return {
    known: true,
    filledOfOfferable: recorded.filled / offerable,
    basis: { filled: recorded.filled, offerable },
  };
}

export type HistoryRefusal =
  /** Nothing at all is recorded for this clinician on this weekday. THE unit's refusal. */
  | "no_recorded_history"
  /** Sessions exist but none of them had an offerable slot, so none carries a rate. */
  | "no_session_with_offerable_slots";

export const HISTORY_REFUSAL_COPY: Record<HistoryRefusal, string> = {
  no_recorded_history:
    "Nothing is recorded for this clinician on this day of the week, so there is nothing to work from. This is not a prediction of an empty diary — it is the absence of a history, and no number is offered in its place.",
  no_session_with_offerable_slots:
    "Sessions are recorded for this clinician on this day, and none of them had a slot that could be filled. There is no fill rate to read from that, so none is offered.",
};

export interface RecordedWeek {
  dateIso: string;
  filled: number;
  offerable: number;
  released: number;
}

export interface SessionPattern {
  practiceId: string;
  clinicianId: string;
  weekday: number;
  /**
   * One entry per recorded week, oldest first. NOT averaged, NOT smoothed, NOT extrapolated.
   *
   * W223 turns these into an interval. Averaging here would hand it a number to trust instead of
   * a series to reason about, and the caveats would be attached to the wrong unit.
   */
  weeks: readonly RecordedWeek[];
  /** W196's rule: the series is not readable without what it was counted over. */
  basis: { recordedWeeks: number; fromIso: string; toIso: string };
}

export type HistoryResult =
  | { ok: true; pattern: SessionPattern }
  | { ok: false; refusals: HistoryRefusal[]; wouldSettleIt: readonly string[] };

/**
 * Everything recorded for one clinician on one weekday, or a refusal saying why there is nothing.
 *
 * NOTE WHAT IS ABSENT FROM THE SIGNATURE: no assumed rate, no fallback, no options object. A
 * session with no recorded history produces a refusal and never a default, which is this unit's
 * whole gate — and the reason it is a signature property rather than a rule is that a default
 * parameter is a default somebody picks after seeing the data.
 */
export function historyFor(
  recorded: readonly RecordedUtilisation[],
  clinicianId: string,
  weekday: number,
): HistoryResult {
  const mine = recorded.filter(
    (r) => r.session.clinicianId === clinicianId && r.session.weekday === weekday,
  );
  if (mine.length === 0) {
    return {
      ok: false,
      refusals: ["no_recorded_history"],
      wouldSettleIt: [
        "Record at least one session for this clinician on this day of the week.",
      ],
    };
  }

  const weeks: RecordedWeek[] = [];
  for (const entry of mine) {
    const rate = utilisationRate(entry);
    if (!rate.known) continue;
    weeks.push({
      dateIso: entry.session.dateIso,
      filled: rate.basis.filled,
      offerable: rate.basis.offerable,
      released: entry.released,
    });
  }
  if (weeks.length === 0) {
    return {
      ok: false,
      refusals: ["no_session_with_offerable_slots"],
      wouldSettleIt: [
        "Record a session for this clinician on this day with at least one slot that could be filled.",
      ],
    };
  }

  weeks.sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  return {
    ok: true,
    pattern: {
      practiceId: mine[0]!.session.practiceId,
      clinicianId,
      weekday,
      weeks,
      basis: {
        recordedWeeks: weeks.length,
        fromIso: weeks[0]!.dateIso,
        toIso: weeks[weeks.length - 1]!.dateIso,
      },
    },
  };
}

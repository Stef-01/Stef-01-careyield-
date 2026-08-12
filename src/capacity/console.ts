// W229: the capacity console's view-model — and the two emptinesses it must never merge.
//
// This page can be blank for two reasons that lead a practice in OPPOSITE directions.
//
//   NO DATA. Nothing is recorded for this session, or not enough of it. The page knows nothing,
//   and the next move is to go and record something.
//
//   NO SPARE CAPACITY. The record is there, it has been read, and what it says is that every
//   slot this session offered was taken. The page knows a great deal, and the next move — if
//   there is one — is a decision about running another session, which this product does not make.
//
// Rendered as the same blank cell those are indistinguishable, and the comfortable reading wins:
// a practice manager looking at an empty capacity page concludes the diary is full. That is
// W170's rule about `not_recorded` arriving on a surface, and W220 made the same call about four
// silences one console over. Here there are two, they are the whole unit, and each has its own
// state, its own sentence and its own count.
//
// THE ROWS COME FROM THE DIARY, NEVER FROM THE ANSWERS, and this is the failure that would
// survive every unit test written against a view-model. Build the list by asking the forecaster
// what it can speak about and the sessions it cannot speak about VANISH — and a session that
// vanished from a page is indistinguishable from a session that does not exist. The practice's
// Tuesday clinic, unrecorded for six months, would simply not be there, and its absence would
// read as "we do not run one" rather than "we have no idea". So this enumerates every
// (clinician, weekday) the record holds and then asks about each; a session it cannot answer for
// is still a row, carrying why. A test asserts an unanswerable session survives onto the view.
//
// THE COUNTS ARE ALWAYS SHOWN, whatever they are — W228's rule from one module over. A page that
// only speaks up when it has something to flag teaches a reader that silence means agreement,
// and the three counts are exactly what separates "nothing recorded" from "nothing spare" at a
// glance, before any row is read.
//
// SPARE IS A SUBTRACTION FROM W223'S RANGE, NOT A SECOND ESTIMATE. Slots left over is
// `offered - filled`, and filled is already an interval, so the endpoints swap: the FEWEST left
// over corresponds to the record's highest fill. Nothing here derives a rate, and a test asserts
// it — recomputing one would be a second forecaster with no score against it, which is the
// failure W225 built a required field to prevent.
//
// WHAT THIS DELIBERATELY DOES NOT SHOW, so it is a decision rather than an omission: W228's
// drift verdict. A range whose staleness check exists and was not run is a real gap and it is
// named here rather than left for someone to notice — it is out of this unit because the unit is
// the two emptinesses, and wiring a per-session drift report costs a second walk-forward
// back-test on every row. W234 is Q18's hardening week and this is the first thing for it.
//
// FOUNDER GATE (plan §4): nothing here reads a patient. The view is built from W222's sessions —
// a clinician, a weekday and three counts — and W225's opening, whose type has no field a person
// could occupy. There is no send control and nothing on this page changes what Meherr sends.

import { HISTORY_REFUSAL_COPY, historyFor, type RecordedUtilisation } from "./model";
import { OPENING_REFUSAL_COPY, recommendOpening, type SessionOpening } from "./opening";

/**
 * How many of a session's slots the record shows were left open.
 *
 * The endpoints swap on purpose. `fewest` is what is left when the record's HIGHEST fill is
 * applied, `most` when its lowest is — subtracting an interval from a constant reverses it, and
 * writing them the other way round would put the reassuring number under the alarming label.
 */
export interface SpareSlots {
  fewest: number;
  most: number;
}

export type SessionReading =
  /** The record shows slots left open. The ordinary case. */
  | { kind: "spare_slots_recorded"; opening: SessionOpening; spare: SpareSlots }
  /** Every recorded week filled everything offered. A FINDING, not an absence — see the note. */
  | { kind: "no_spare_slots_recorded"; opening: SessionOpening }
  /** The record cannot answer for this session. The reasons travel with it, and so does the fix. */
  | { kind: "record_cannot_say"; because: readonly string[]; wouldSettleIt: readonly string[] };

export interface SessionRow {
  clinicianId: string;
  weekday: number;
  /** Recorded weeks behind this row, shown whatever the reading is, so a row is checkable. */
  recordedWeeks: number;
  reading: SessionReading;
}

export interface ReadingCounts {
  spare: number;
  noneSpare: number;
  cannotSay: number;
}

export type CapacityView =
  /**
   * No sessions at all. The PAGE-level absence, and the one that must not read as a full diary.
   */
  | { state: "no_diary_recorded"; copy: string; wouldSettleIt: readonly string[] }
  | { state: "sessions"; rows: readonly SessionRow[]; counts: ReadingCounts };

export const CAPACITY_CONSOLE_COPY = {
  noDiaryRecorded:
    "No sessions are recorded for this practice, so this page has nothing to read from. A blank page here is the absence of a diary, not a diary with nothing left in it — those two lead somewhere opposite, and until something is recorded this page cannot tell you which one you are looking at.",
  noSpareSlots:
    "Every week on record filled every slot this session offered, so the record shows none left over. That is a count of slots that were offered and taken. It says nothing about anybody who was not offered one.",
  spareSlots:
    "Some slots on record were still open at the end of the week. These figures are what the record shows was left over — not a target, and not a gap to be closed.",
  recordCannotSay:
    "The record cannot answer for this session. Below is why, and what would settle it.",
  countsAlwaysShown:
    "All three counts are shown whatever they are. A page that spoke up only when it had something to flag would teach you that silence means agreement.",
  spareIsSubtracted:
    "Slots left over is the slots offered minus the range that filled, so it carries the same width as that range and adds nothing to it.",
} as const;

export const NO_DIARY_WOULD_SETTLE_IT: readonly string[] = [
  "Record at least one session, with its slots, against a clinician at this practice.",
  "Check that the practice you are signed in to is the one whose diary you are looking for.",
];

/** The distinct sessions the record holds, as (clinician, weekday), in a stated order. */
function sessionKeys(recorded: readonly RecordedUtilisation[]): Array<[string, number]> {
  const seen = new Map<string, [string, number]>();
  for (const entry of recorded) {
    const { clinicianId, weekday } = entry.session;
    seen.set(`${weekday}::${clinicianId}`, [clinicianId, weekday]);
  }
  // Sorted by (weekday, clinician), so the page is a value rather than a rendering of whatever
  // order the rail happened to hold — W167's concern, made a property of the output.
  return [...seen.values()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
}

/**
 * What one session's record supports, asked at the largest offering that session has recorded.
 *
 * The size of the question is not a choice a caller gets to make here. W225 refuses to speak
 * about a session larger than any on record, so the largest recorded offering is the biggest
 * question the record can actually answer — and letting a caller pass a number would be a number
 * picked after seeing the answer, which is W222's and W196's objection to a parameter.
 */
function readingFor(
  recorded: readonly RecordedUtilisation[],
  clinicianId: string,
  weekday: number,
): { reading: SessionReading; recordedWeeks: number } {
  const history = historyFor(recorded, clinicianId, weekday);
  if (!history.ok) {
    return {
      recordedWeeks: 0,
      reading: {
        kind: "record_cannot_say",
        because: history.refusals.map((refusal) => HISTORY_REFUSAL_COPY[refusal]),
        wouldSettleIt: history.wouldSettleIt,
      },
    };
  }

  const { pattern } = history;
  const recordedWeeks = pattern.basis.recordedWeeks;
  const offerings = pattern.weeks.map((week) => week.offerable).filter((n) => n > 0);
  const largest = offerings.length > 0 ? Math.max(...offerings) : 0;

  const result = recommendOpening(pattern, largest);
  if (!result.ok) {
    return {
      recordedWeeks,
      reading: {
        kind: "record_cannot_say",
        because: result.errors.map((error) => OPENING_REFUSAL_COPY[error]),
        wouldSettleIt: [
          `Record more weeks of this session: ${largest} slots over ${recordedWeeks} week(s) is not yet enough to give a range and check it.`,
        ],
      },
    };
  }

  const { opening } = result;
  const spare: SpareSlots = {
    fewest: opening.slots - opening.forecast.high,
    most: opening.slots - opening.forecast.low,
  };
  // `most === 0` means even the lowest rate on record filled everything: there is no week in the
  // history where a slot was left over. That is a statement ABOUT THE RECORD and it is why this
  // is a reading rather than a blank — see the module note.
  if (spare.most === 0) return { recordedWeeks, reading: { kind: "no_spare_slots_recorded", opening } };
  return { recordedWeeks, reading: { kind: "spare_slots_recorded", opening, spare } };
}

/**
 * The capacity console, for one practice's recorded diary.
 *
 * Takes the sessions rather than reading them, so the practice scoping is the caller's query and
 * cannot be forgotten here — W123's rule, and W209's finding about a store read that forgot it.
 */
export function capacityConsoleView(recorded: readonly RecordedUtilisation[]): CapacityView {
  const keys = sessionKeys(recorded);
  if (keys.length === 0) {
    return {
      state: "no_diary_recorded",
      copy: CAPACITY_CONSOLE_COPY.noDiaryRecorded,
      wouldSettleIt: NO_DIARY_WOULD_SETTLE_IT,
    };
  }

  const rows: SessionRow[] = keys.map(([clinicianId, weekday]) => {
    const { reading, recordedWeeks } = readingFor(recorded, clinicianId, weekday);
    return { clinicianId, weekday, recordedWeeks, reading };
  });

  const counts: ReadingCounts = {
    spare: rows.filter((row) => row.reading.kind === "spare_slots_recorded").length,
    noneSpare: rows.filter((row) => row.reading.kind === "no_spare_slots_recorded").length,
    cannotSay: rows.filter((row) => row.reading.kind === "record_cannot_say").length,
  };

  return { state: "sessions", rows, counts };
}

/**
 * The sentence one row reads as, per reading.
 *
 * Here rather than in the page for W177's reason about duplicated caveats: two renderings of one
 * caveat drift, and the drift is invisible because nobody opens both at once.
 */
export function renderReading(reading: SessionReading): string {
  switch (reading.kind) {
    case "spare_slots_recorded":
      return (
        `Of ${reading.opening.slots} slots offered, ${reading.spare.fewest} to ${reading.spare.most} ` +
        `were still open at the end of the week, over ${reading.opening.forecast.basis.recordedWeeks} recorded weeks. ` +
        CAPACITY_CONSOLE_COPY.spareSlots
      );
    case "no_spare_slots_recorded":
      return (
        `Of ${reading.opening.slots} slots offered, none were still open at the end of any recorded week. ` +
        CAPACITY_CONSOLE_COPY.noSpareSlots
      );
    case "record_cannot_say":
      return `${CAPACITY_CONSOLE_COPY.recordCannotSay} ${reading.because.join(" ")}`;
  }
}

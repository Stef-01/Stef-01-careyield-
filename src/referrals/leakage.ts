// W93: leakage detection — the referral → appointment → completion state machine.
//
// W92 answers "which referrals have nothing recorded against them". This answers the harder
// question: what actually happened to a referral over time, and where in the chain it stopped.
// The distinction matters because the two stopping points need different responses — a
// referral with no appointment is a booking problem, one with an appointment and no letter is
// a correspondence problem, and telling a practice the wrong one wastes their time.
//
// The machine is REPLAYED from recorded events rather than derived from a current-state field,
// for the reason W10 built the event spine: a state column tells you where something is, and
// only a replay tells you how it got there. "Booked, cancelled, rebooked, completed" and
// "booked, completed" both end at completed, and only the first is worth a practice's
// attention.
//
// Two refusals carried forward from W92, because a state machine is where they would quietly
// be lost:
//
//   * NO INFERENCE FROM SILENCE. An event that never arrived is not an event. The machine
//     stalls in the last state it was actually told about; it never advances on the basis
//     that "enough time has passed that they must have gone".
//   * NO CLINICAL READING. Nothing about the specialty, the patient or the gap length changes
//     how a transition is interpreted.

import type { PatientId, PracticeId } from "@/domain/types";

export type ReferralEventKind =
  | "referral_written"
  | "appointment_recorded"
  | "appointment_cancelled"
  | "completion_recorded"
  | "referral_cancelled";

export interface ReferralEvent {
  practiceId: PracticeId;
  patientId: PatientId;
  referralId: string;
  kind: ReferralEventKind;
  at: string;
}

/** Where a referral stopped. Each is an observation about the record, not about a person. */
export type LeakageStage =
  | "not_written" // no referral_written event — the chain never started
  | "written_no_appointment" // written, nothing booked
  | "appointment_lost" // booked then cancelled, never rebooked
  | "attended_no_completion" // booked, nothing came back
  | "completed" // the chain finished
  | "withdrawn"; // the referral itself was cancelled

export interface ReferralTimeline {
  referralId: string;
  practiceId: PracticeId;
  patientId: PatientId;
  stage: LeakageStage;
  /** Every event applied, in order — the audit trail for the verdict. */
  applied: ReferralEvent[];
  /** Events refused, with why. A rejected event is never silently dropped. */
  rejected: Array<{ event: ReferralEvent; reason: "out_of_order" | "after_terminal" | "duplicate" }>;
  writtenOn: string | null;
  completedOn: string | null;
  /** True when the chain stopped somewhere short of completion or withdrawal. */
  leaked: boolean;
}

const TERMINAL: ReadonlySet<LeakageStage> = new Set(["completed", "withdrawn"]);

/** Which stage each event moves to, given where we are. Unlisted pairs are refused. */
function nextStage(current: LeakageStage, kind: ReferralEventKind): LeakageStage | null {
  if (kind === "referral_written") return current === "not_written" ? "written_no_appointment" : null;
  if (current === "not_written") return null; // nothing can happen before the referral exists

  switch (kind) {
    case "appointment_recorded":
      // Rebooking after a loss is a real and common path, so it is allowed explicitly.
      return current === "written_no_appointment" || current === "appointment_lost"
        ? "attended_no_completion"
        : null;
    case "appointment_cancelled":
      return current === "attended_no_completion" ? "appointment_lost" : null;
    case "completion_recorded":
      // A completion can arrive without an appointment ever being recorded — some services
      // send a letter and nothing else. Refusing it would invent leakage that did not happen.
      return current === "completed" ? null : "completed";
    case "referral_cancelled":
      return "withdrawn";
    default:
      return null;
  }
}

/**
 * Replay one referral's events into a stage.
 *
 * Events are applied in recorded order after a stable sort by time; an event that cannot
 * apply is rejected with a reason rather than skipped, because a replay that silently
 * discards input is not a replay.
 */
export function replayReferral(
  referralId: string,
  events: readonly ReferralEvent[],
  practiceId: PracticeId,
): ReferralTimeline {
  const mine = events
    .filter((e) => e.referralId === referralId && e.practiceId === practiceId)
    .slice()
    .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));

  let stage: LeakageStage = "not_written";
  const applied: ReferralEvent[] = [];
  const rejected: ReferralTimeline["rejected"] = [];
  let writtenOn: string | null = null;
  let completedOn: string | null = null;
  let patientId = "" as PatientId;

  for (const event of mine) {
    patientId = event.patientId;

    if (TERMINAL.has(stage)) {
      rejected.push({ event, reason: "after_terminal" });
      continue;
    }
    const next = nextStage(stage, event.kind);
    if (next === null) {
      rejected.push({
        event,
        reason: event.kind === "referral_written" ? "duplicate" : "out_of_order",
      });
      continue;
    }

    if (event.kind === "referral_written") writtenOn = event.at;
    if (event.kind === "completion_recorded") completedOn = event.at;
    stage = next;
    applied.push(event);
  }

  return {
    referralId,
    practiceId,
    patientId,
    stage,
    applied,
    rejected,
    writtenOn,
    completedOn,
    leaked: !TERMINAL.has(stage) && stage !== "not_written",
  };
}

export interface LeakageSummary {
  timelines: ReferralTimeline[];
  /** Count per stage — the practice-facing shape. */
  byStage: Record<LeakageStage, number>;
  leaked: number;
}

export function detectLeakage(
  events: readonly ReferralEvent[],
  practiceId: PracticeId,
): LeakageSummary {
  const ids = [...new Set(events.filter((e) => e.practiceId === practiceId).map((e) => e.referralId))].sort();
  const timelines = ids.map((id) => replayReferral(id, events, practiceId));

  const byStage: Record<LeakageStage, number> = {
    not_written: 0,
    written_no_appointment: 0,
    appointment_lost: 0,
    attended_no_completion: 0,
    completed: 0,
    withdrawn: 0,
  };
  for (const t of timelines) byStage[t.stage] += 1;

  return { timelines, byStage, leaked: timelines.filter((t) => t.leaked).length };
}

export const STAGE_COPY: Record<LeakageStage, string> = {
  not_written: "No referral record was found for this identifier.",
  written_no_appointment: "Referred, and no appointment with the service is recorded.",
  appointment_lost: "An appointment was recorded and then cancelled, with nothing recorded since.",
  attended_no_completion: "An appointment is recorded and nothing has come back from the service.",
  completed: "A completion is recorded — the chain finished.",
  withdrawn: "The referral was cancelled by the practice or the patient.",
};

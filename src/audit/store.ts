// W15: usefulness-audit store (mock, synthetic only — same globalThis posture as
// the W7 rail and W11 console stores; Supabase persistence replaces this when the
// live rail lands). Holds attended, invitation-generated appointments awaiting a
// GP audit, plus the outcome records captured so far.

import { validateSubmission, type UsefulnessSubmission, type ValidationError } from "@/audit/usefulness";
import type { AppointmentId, OutcomeRecord, PracticeId } from "@/domain/types";

export interface AuditableVisit {
  appointmentId: AppointmentId;
  patientLabel: string; // synthetic, de-identified ("Patient 4821") — never a real name
  attendedAt: string; // ISO datetime
}

export interface AuditState {
  practiceId: PracticeId;
  visits: AuditableVisit[];
  outcomes: OutcomeRecord[];
}

const PRACTICE_ID = "prac-console" as PracticeId;

function seed(): AuditState {
  return {
    practiceId: PRACTICE_ID,
    visits: [
      { appointmentId: "apt-501" as AppointmentId, patientLabel: "Patient 4821", attendedAt: "2026-09-01T09:30:00+10:00" },
      { appointmentId: "apt-502" as AppointmentId, patientLabel: "Patient 7302", attendedAt: "2026-09-01T10:15:00+10:00" },
      { appointmentId: "apt-503" as AppointmentId, patientLabel: "Patient 1188", attendedAt: "2026-09-02T14:00:00+10:00" },
    ],
    outcomes: [],
  };
}

const globalStore = globalThis as { __careyieldAudit?: AuditState };

export function getAudit(): AuditState {
  globalStore.__careyieldAudit ??= seed();
  return globalStore.__careyieldAudit;
}

export function resetAudit(): AuditState {
  globalStore.__careyieldAudit = seed();
  return globalStore.__careyieldAudit;
}

/** Visits with no outcome recorded yet — what the one-tap form shows. */
export function pendingVisits(state: AuditState): AuditableVisit[] {
  const done = new Set(state.outcomes.map((o) => o.appointmentId));
  return state.visits.filter((v) => !done.has(v.appointmentId));
}

export type RecordResult =
  | { ok: true }
  | { ok: false; error: ValidationError | "unknown_visit" | "already_recorded" };

/** Validate and persist one audit submission against the shared store. */
export function recordOutcome(submission: UsefulnessSubmission): RecordResult {
  const state = getAudit();
  const visit = state.visits.find((v) => v.appointmentId === submission.appointmentId);
  if (!visit) return { ok: false, error: "unknown_visit" };
  if (state.outcomes.some((o) => o.appointmentId === submission.appointmentId)) {
    return { ok: false, error: "already_recorded" };
  }
  const result = validateSubmission(submission, state.practiceId);
  if (!result.ok) return { ok: false, error: result.error };
  state.outcomes = [...state.outcomes, result.record];
  return { ok: true };
}

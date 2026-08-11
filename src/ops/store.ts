// W19: admin-ops store (mock, synthetic only — globalThis, same posture as the
// other phase-1 stores). Holds the safety switches and derives the invitation-queue
// view from the booking rail. Switch changes land in an audit trail.

import { getStore } from "@/booking/store";
import type { AuditEvent, InvitationStatus, PracticeId } from "@/domain/types";
import { ALL_CLEAR, setKillSwitch, setPracticePaused, type OpsSwitches } from "@/ops/switches";
import type { FeedEvidence } from "@/ops/silence";

export interface OpsState {
  switches: OpsSwitches;
  auditEvents: AuditEvent[];
  /**
   * W179: what is known about the appointment feed, or null for NOTHING KNOWN.
   *
   * Null is the honest default rather than an optimistic one. A fresh store has recorded no
   * observation of the feed, and the surface says exactly that instead of rendering a bare zero
   * a reader would take for a quiet week.
   */
  feed: FeedEvidence | null;
}

const globalStore = globalThis as { __careyieldOps?: OpsState };

function initial(): OpsState {
  return { switches: { ...ALL_CLEAR, pausedPracticeIds: [] }, auditEvents: [], feed: null };
}

export function getOps(): OpsState {
  globalStore.__careyieldOps ??= initial();
  return globalStore.__careyieldOps;
}

export function resetOps(): OpsState {
  globalStore.__careyieldOps = initial();
  return globalStore.__careyieldOps;
}

const QUEUE_STATUSES: InvitationStatus[] = ["queued", "sent", "booked", "expired", "opted_out"];

export interface QueueView {
  counts: Record<InvitationStatus, number>;
  /** The currently-outstanding offers (queued or sent) — the live queue. */
  outstanding: Array<{ id: string; patientId: string; sessionDate: string; status: InvitationStatus }>;
}

/** Invitation queue derived from the booking rail (the send/booking source of truth). */
export function queueView(): QueueView {
  const invitations = getStore().state.invitations;
  const counts = Object.fromEntries(QUEUE_STATUSES.map((s) => [s, 0])) as Record<InvitationStatus, number>;
  for (const inv of invitations) counts[inv.status]++;
  const outstanding = invitations
    .filter((i) => i.status === "queued" || i.status === "sent")
    .map((i) => ({ id: i.id, patientId: i.patientId, sessionDate: i.sessionDate, status: i.status }));
  return { counts, outstanding };
}

function audit(state: OpsState, at: string, subjectId: string, detail: string) {
  state.auditEvents.push({
    practiceId: subjectId as PracticeId,
    kind: "config_changed",
    at,
    subjectId,
    detail,
  });
}

export function applyKillSwitch(on: boolean, at: string): void {
  const state = getOps();
  if (state.switches.killSwitch === on) return;
  state.switches = setKillSwitch(state.switches, on);
  audit(state, at, "ops:kill-switch", `kill switch ${on ? "engaged" : "released"}`);
}

export function applyPracticePause(practiceId: string, paused: boolean, at: string): void {
  const state = getOps();
  if (state.switches.pausedPracticeIds.includes(practiceId) === paused) return;
  state.switches = setPracticePaused(state.switches, practiceId, paused);
  audit(state, at, practiceId, `practice sending ${paused ? "paused" : "resumed"}`);
}

/** W179: record what the feed did. Synthetic only in this phase — set by the sim and the mock route. */
export function recordFeedEvidence(feed: FeedEvidence | null): void {
  getOps().feed = feed;
}

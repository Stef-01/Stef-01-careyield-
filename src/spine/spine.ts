// W10: event spine — the immutable audit log every state change flows through.
// Events carry structured payloads (not prose) so the entire invitation/booking/opt-out/config
// state is reconstructable by folding the log from the start: the replay test IS the gate.
// The log is append-only: entries are frozen, sequence numbers are contiguous from 0, and
// verifyLog detects deletion or reordering.

import type {
  AppointmentId,
  Invitation,
  InvitationId,
  PatientId,
} from "@/domain/types";
import type { BookingResult } from "@/booking/rail";

export type SpineEvent =
  | { kind: "invitation_queued"; at: string; invitation: Invitation }
  | { kind: "invitation_sent"; at: string; invitationId: InvitationId }
  | {
      kind: "invitation_booked";
      at: string;
      invitationId: InvitationId;
      appointmentId: AppointmentId;
    }
  | { kind: "invitation_expired"; at: string; invitationId: InvitationId }
  | { kind: "invitation_opted_out"; at: string; invitationId: InvitationId }
  | { kind: "patient_opted_out"; at: string; patientId: PatientId }
  | { kind: "holdout_assigned"; at: string; patientId: PatientId; arm: "holdout" | "invite" }
  | { kind: "config_changed"; at: string; key: string; value: string };

export type LogEntry = SpineEvent & { readonly seq: number };
export type EventLog = readonly LogEntry[];

export const EMPTY_LOG: EventLog = Object.freeze([]);

/** Append-only: returns a new frozen log; the input log and entry are never mutated. */
export function append(log: EventLog, event: SpineEvent): EventLog {
  const entry = Object.freeze({ ...event, seq: log.length }) as LogEntry;
  return Object.freeze([...log, entry]) as EventLog;
}

export function appendAll(log: EventLog, events: SpineEvent[]): EventLog {
  return events.reduce(append, log);
}

/** Tamper check: sequence numbers must be exactly 0..n-1 in order. */
export function verifyLog(log: EventLog): boolean {
  return log.every((entry, i) => entry.seq === i);
}

/**
 * Spine events for one booking-rail transition, derived by diffing invitation statuses so
 * every transition the rail performed is captured whatever code path produced it.
 */
export function bookingEvents(
  before: Invitation[],
  result: BookingResult,
  at: string,
): SpineEvent[] {
  if (!result.ok) return [];
  const prior = new Map(before.map((i) => [i.id, i.status]));
  const events: SpineEvent[] = [];
  for (const inv of result.state.invitations) {
    const was = prior.get(inv.id);
    if (was === undefined || was === inv.status) continue;
    if (inv.status === "booked") {
      events.push({
        kind: "invitation_booked",
        at,
        invitationId: inv.id,
        appointmentId: result.appointmentId,
      });
    } else if (inv.status === "expired") {
      events.push({ kind: "invitation_expired", at, invitationId: inv.id });
    }
  }
  return events;
}

/** State reconstructable from the spine alone. */
export interface ReplayedState {
  /** Latest known state of every invitation that ever entered the log. */
  invitations: Map<InvitationId, Invitation>;
  /** Generated bookings: appointment → who filled it via which invitation. */
  bookings: Map<AppointmentId, { patientId: PatientId; invitationId: InvitationId }>;
  optedOutPatients: Set<PatientId>;
  holdoutArm: Map<PatientId, "holdout" | "invite">;
  /** Last-write-wins config by key. */
  config: Map<string, { value: string; at: string }>;
}

/** Fold the log from the start. Throws on events referencing unknown invitations —
 *  a spine that cannot replay cleanly is corrupt, not approximately fine. */
export function replay(log: EventLog): ReplayedState {
  if (!verifyLog(log)) throw new Error("event log failed sequence verification");
  const state: ReplayedState = {
    invitations: new Map(),
    bookings: new Map(),
    optedOutPatients: new Set(),
    holdoutArm: new Map(),
    config: new Map(),
  };
  const invitation = (id: InvitationId): Invitation => {
    const inv = state.invitations.get(id);
    if (!inv) throw new Error(`replay: event for unknown invitation ${id}`);
    return inv;
  };
  for (const event of log) {
    switch (event.kind) {
      case "invitation_queued":
        state.invitations.set(event.invitation.id, { ...event.invitation, status: "queued" });
        break;
      case "invitation_sent":
        state.invitations.set(event.invitationId, {
          ...invitation(event.invitationId),
          status: "sent",
          sentAt: event.at,
        });
        break;
      case "invitation_booked": {
        const inv = invitation(event.invitationId);
        state.invitations.set(inv.id, { ...inv, status: "booked" });
        state.bookings.set(event.appointmentId, { patientId: inv.patientId, invitationId: inv.id });
        break;
      }
      case "invitation_expired":
        state.invitations.set(event.invitationId, {
          ...invitation(event.invitationId),
          status: "expired",
        });
        break;
      case "invitation_opted_out":
        state.invitations.set(event.invitationId, {
          ...invitation(event.invitationId),
          status: "opted_out",
        });
        break;
      case "patient_opted_out":
        state.optedOutPatients.add(event.patientId);
        break;
      case "holdout_assigned":
        state.holdoutArm.set(event.patientId, event.arm);
        break;
      case "config_changed":
        state.config.set(event.key, { value: event.value, at: event.at });
        break;
    }
  }
  return state;
}

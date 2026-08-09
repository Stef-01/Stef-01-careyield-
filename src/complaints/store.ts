// W43: complaints store (mock, synthetic only — same globalThis posture as the other
// console stores). The opt-out side effect goes through the rail store so a complaint
// that says "stop contacting me" closes every outstanding offer immediately, and the
// audit trail records it. Open complaints ARE the practice notification: the console
// banner and the W16 guardrail monitor both read the same count.

import { getStore } from "@/booking/store";
import type { AuditEvent } from "@/domain/types";
import {
  intakeComplaint,
  resolveComplaint,
  triageComplaint,
  validateIntake,
  type ComplaintRecord,
  type ComplaintSeverity,
  type FieldErrors,
  type IntakeInput,
} from "./workflow";

export interface ComplaintsState {
  complaints: ComplaintRecord[];
  seq: number;
}

const globalStore = globalThis as { __careyieldComplaints?: ComplaintsState };

export function getComplaints(): ComplaintsState {
  globalStore.__careyieldComplaints ??= { complaints: [], seq: 1 };
  return globalStore.__careyieldComplaints;
}

export function resetComplaints(): ComplaintsState {
  globalStore.__careyieldComplaints = { complaints: [], seq: 1 };
  return globalStore.__careyieldComplaints;
}

export function openComplaintCount(): number {
  return getComplaints().complaints.filter((c) => c.status === "open").length;
}

/** Terminal opt-out through the rail: every queued/sent offer for the patient closes. */
function applyOptOutToRail(patientId: string, at: string): number {
  const rail = getStore();
  let closed = 0;
  const invitations = rail.state.invitations.map((inv) => {
    if (inv.patientId === patientId && (inv.status === "queued" || inv.status === "sent")) {
      closed++;
      return { ...inv, status: "opted_out" as const };
    }
    return inv;
  });
  const auditEvents: AuditEvent[] = [
    ...rail.state.auditEvents,
    {
      practiceId: rail.state.invitations[0]?.practiceId ?? ("prac-demo" as AuditEvent["practiceId"]),
      kind: "patient_opted_out",
      at,
      subjectId: patientId,
      detail: "opt-out via complaint intake",
    },
  ];
  rail.state = { ...rail.state, invitations, auditEvents };
  return closed;
}

export function submitComplaint(input: IntakeInput, at: string): FieldErrors {
  const errors = validateIntake(input);
  if (Object.keys(errors).length > 0) return errors;
  const state = getComplaints();
  const record = intakeComplaint(input, `cmp-${state.seq++}`, at);
  if (input.wantsOptOut && record.patientId) {
    applyOptOutToRail(record.patientId, at);
    record.optOutApplied = true;
    record.timeline.push({ at, event: "opt-out applied — no further contact", byEmail: null });
  }
  state.complaints.push(record);
  return {};
}

export function triageInStore(id: string, severity: ComplaintSeverity, at: string, byEmail: string): void {
  const state = getComplaints();
  state.complaints = state.complaints.map((c) =>
    c.id === id ? triageComplaint(c, severity, at, byEmail) : c,
  );
}

export function resolveInStore(id: string, resolution: string, at: string, byEmail: string): FieldErrors {
  const state = getComplaints();
  const target = state.complaints.find((c) => c.id === id);
  if (!target) return { form: "Unknown complaint." };
  const result = resolveComplaint(target, resolution, at, byEmail);
  if (!result.ok) return result.errors;
  state.complaints = state.complaints.map((c) => (c.id === id ? result.complaint : c));
  return {};
}

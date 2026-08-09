// W43: complaint/opt-out workflow — intake, triage, resolution. A complaint is the
// most important inbound signal the product has (W16 alerts on ANY open one), so the
// workflow is deliberately strict: intake never fails for the complainant, triage
// assigns severity explicitly, resolution requires words, and a complaint that asks
// for no further contact applies the opt-out through the terminal path immediately —
// not after triage, not after review.

import type { Complaint } from "@/guardrails/monitors";

export type ComplaintChannel = Complaint["channel"];
export type ComplaintSeverity = "low" | "serious" | "urgent";

/** W16's Complaint, extended with the workflow trail. Status semantics unchanged
 *  (open/resolved) so the W16 zero-tolerance monitor keeps counting correctly. */
export interface ComplaintRecord extends Complaint {
  severity: ComplaintSeverity | null; // null until triaged
  /** Patient identifier when the complainant could be linked; enables opt-out. */
  patientId: string | null;
  optOutApplied: boolean;
  timeline: Array<{ at: string; event: string; byEmail: string | null }>;
  resolution: string | null;
}

export interface IntakeInput {
  channel: ComplaintChannel;
  summary: string;
  patientId?: string;
  /** The complainant asked for no further contact. */
  wantsOptOut: boolean;
}

export interface FieldErrors {
  [field: string]: string;
}

export function validateIntake(input: IntakeInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.summary.trim().length < 5) errors.summary = "Describe the complaint (a few words at least).";
  if (input.wantsOptOut && !input.patientId?.trim()) {
    errors.patientId = "Opt-out needs the patient identifier so it can be applied.";
  }
  return errors;
}

export function intakeComplaint(input: IntakeInput, id: string, at: string): ComplaintRecord {
  return {
    id,
    practiceId: "prac-console",
    at,
    channel: input.channel,
    summary: input.summary.trim(),
    status: "open",
    severity: null,
    patientId: input.patientId?.trim() || null,
    optOutApplied: false, // the store flips this after the terminal opt-out is applied
    timeline: [{ at, event: `received via ${input.channel}`, byEmail: null }],
    resolution: null,
  };
}

export function triageComplaint(
  complaint: ComplaintRecord,
  severity: ComplaintSeverity,
  at: string,
  byEmail: string,
): ComplaintRecord {
  if (complaint.status === "resolved") return complaint; // resolved complaints are immutable
  return {
    ...complaint,
    severity,
    timeline: [...complaint.timeline, { at, event: `triaged as ${severity}`, byEmail }],
  };
}

export type ResolveResult =
  | { ok: true; complaint: ComplaintRecord }
  | { ok: false; errors: FieldErrors };

export function resolveComplaint(
  complaint: ComplaintRecord,
  resolution: string,
  at: string,
  byEmail: string,
): ResolveResult {
  if (complaint.status === "resolved") return { ok: true, complaint };
  if (complaint.severity === null) {
    return { ok: false, errors: { form: "Triage the complaint before resolving it." } };
  }
  if (resolution.trim().length < 5) return { ok: false, errors: { resolution: "Say what was done." } };
  return {
    ok: true,
    complaint: {
      ...complaint,
      status: "resolved",
      resolution: resolution.trim(),
      timeline: [...complaint.timeline, { at, event: "resolved", byEmail }],
    },
  };
}

// CareYield core domain model (W2).
// Storage-agnostic: mirrored 1:1 by supabase/migrations/0001_core.sql (consistency-tested).

export type PracticeId = string & { readonly __brand: "PracticeId" };
export type ClinicianId = string & { readonly __brand: "ClinicianId" };
export type PatientId = string & { readonly __brand: "PatientId" };
export type AppointmentId = string & { readonly __brand: "AppointmentId" };
export type InvitationId = string & { readonly __brand: "InvitationId" };

export interface Practice {
  id: PracticeId;
  name: string;
  timezone: string;
  holdoutRate: number; // 0..1, share of eligible patients held out for incrementality
}

export interface Clinician {
  id: ClinicianId;
  practiceId: PracticeId;
  displayName: string;
  participating: boolean; // opted into availability invitations
}

export interface Patient {
  id: PatientId;
  practiceId: PracticeId;
  usualClinicianId: ClinicianId | null;
  smsConsent: boolean;
  optedOut: boolean; // terminal for invitations
  lastAttendedAt: string | null; // ISO date
  futureBookingAt: string | null; // ISO date of next existing booking, if any
  activeRecall: boolean; // practice already managing a recall — never duplicate
  chronicCare: boolean; // ongoing-care marker (register membership)
  holdout: boolean; // control arm — never invited (W8 assigns; stored for stability)
}

export type AppointmentStatus =
  | "open" // unfilled bookable slot
  | "booked"
  | "attended"
  | "dna" // did not attend
  | "cancelled";

export interface Appointment {
  id: AppointmentId;
  practiceId: PracticeId;
  clinicianId: ClinicianId;
  startsAt: string; // ISO datetime
  status: AppointmentStatus;
  patientId: PatientId | null;
  generatedByInvitation: boolean; // booked via a CareYield invitation
}

export type InvitationStatus =
  | "queued"
  | "sent"
  | "booked"
  | "expired" // session filled or window passed
  | "opted_out";

export interface Invitation {
  id: InvitationId;
  practiceId: PracticeId;
  patientId: PatientId;
  clinicianId: ClinicianId;
  sessionDate: string; // ISO date of the availability window offered
  status: InvitationStatus;
  sentAt: string | null;
}

/** What happened in a generated visit — the usefulness audit (brief §Phase 1). */
export type VisitUsefulness =
  | "medication_reviewed"
  | "investigation_ordered"
  | "preventive_care"
  | "care_plan_updated"
  | "referral_made"
  | "follow_up_arranged"
  | "no_action_required"
  | "unnecessary";

export interface OutcomeRecord {
  appointmentId: AppointmentId;
  practiceId: PracticeId;
  usefulness: VisitUsefulness[];
  clinicianJudgedReasonable: boolean;
}

export type AuditEventKind =
  | "holdout_assigned"
  | "invitation_queued"
  | "invitation_sent"
  | "invitation_booked"
  | "invitation_expired"
  | "patient_opted_out"
  | "config_changed";

export interface AuditEvent {
  practiceId: PracticeId;
  kind: AuditEventKind;
  at: string; // ISO datetime
  subjectId: string; // invitation/patient/config id
  detail: string;
}

/** Registry mirrored by SQL tables — the W2 consistency test keys off this. */
export const DOMAIN_TABLES = [
  "practices",
  "clinicians",
  "patients",
  "appointments",
  "invitations",
  "outcome_records",
  "audit_events",
] as const;

export type DomainTable = (typeof DOMAIN_TABLES)[number];

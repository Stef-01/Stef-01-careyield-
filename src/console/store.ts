// W11: console store — the practice profile and its versioned eligibility rules
// config, in memory behind globalThis (same mock-persistence posture as the W7
// rail store; Supabase persistence replaces this at the wiring unit). Every rules
// change bumps the version and lands in the audit trail (config-as-audit, W10 spine
// captures it downstream).

import { DEFAULT_CONFIG, type EligibilityConfig } from "@/engine/eligibility";
import type { AuditEvent, ClinicianId, Practice, PracticeId } from "@/domain/types";
import {
  DEFAULT_SESSION_CONFIG,
  validateSessionConfig,
  type SessionConfig,
} from "@/session/config";
import { authorize, type Membership } from "@/tenancy/tenancy";

/** W41: the practice's own clinician roster, entered during self-serve setup. */
export interface ClinicianRecord {
  id: ClinicianId;
  displayName: string;
  /** Opted into availability invitations at all (the clinician's own choice). */
  participating: boolean;
}

export interface ConsoleState {
  practice: Practice | null;
  rulesConfig: EligibilityConfig;
  rulesVersion: number;
  auditEvents: AuditEvent[];
  memberships: Membership[]; // W18 — whoever onboards becomes owner
  clinicians: ClinicianRecord[]; // W41 — the roster W17 deferred
  sessionConfig: SessionConfig; // W41 — W17's dials, now practice-editable
  /**
   * W41: wizard steps the practice has explicitly saved. Seeded defaults validate
   * clean, so validity alone cannot prove a practice chose its settings — without
   * this, finishing setup would attest to wide-open defaults nobody ever saw.
   */
  acknowledgedSteps: string[];
  /** Set when the practice finishes the setup wizard; null while still in setup. */
  setupCompletedAt: string | null;
}

export interface FieldErrors {
  [field: string]: string;
}

const globalStore = globalThis as { __careyieldConsole?: ConsoleState };

function initial(): ConsoleState {
  return {
    practice: null,
    rulesConfig: { ...DEFAULT_CONFIG },
    rulesVersion: 1,
    auditEvents: [],
    memberships: [],
    clinicians: [],
    sessionConfig: { ...DEFAULT_SESSION_CONFIG },
    acknowledgedSteps: [],
    setupCompletedAt: null,
  };
}

export function getConsole(): ConsoleState {
  globalStore.__careyieldConsole ??= initial();
  return globalStore.__careyieldConsole;
}

export function resetConsole(): ConsoleState {
  globalStore.__careyieldConsole = initial();
  return globalStore.__careyieldConsole;
}

export interface OnboardingInput {
  name: string;
  timezone: string;
  holdoutPercent: number; // 0–50, UI-facing; stored as a 0..1 rate
}

export function validateOnboarding(input: OnboardingInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.trim().length < 2) errors.name = "Practice name is too short.";
  if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(input.timezone)) {
    errors.timezone = "Use an IANA timezone like Australia/Sydney.";
  }
  if (!Number.isFinite(input.holdoutPercent) || input.holdoutPercent < 0 || input.holdoutPercent > 50) {
    errors.holdoutPercent = "Holdout must be between 0 and 50 percent.";
  }
  return errors;
}

export function onboardPractice(input: OnboardingInput, at: string, ownerEmail: string): FieldErrors {
  const errors = validateOnboarding(input);
  if (Object.keys(errors).length > 0) return errors;
  const state = getConsole();
  // W26 hardening: onboarding is create-only. Re-running it would overwrite the
  // practice AND seat the caller as a fresh owner — a bypass of the W18 role model.
  if (state.practice) return { form: "This practice is already set up." };
  const practice: Practice = {
    id: "prac-console" as PracticeId,
    name: input.name.trim(),
    timezone: input.timezone,
    holdoutRate: input.holdoutPercent / 100,
  };
  state.practice = practice;
  state.memberships.push({ practiceId: practice.id, email: ownerEmail, role: "owner" });
  state.auditEvents.push({
    practiceId: practice.id,
    kind: "config_changed",
    at,
    subjectId: practice.id,
    detail: `practice onboarded: ${practice.name} (${practice.timezone}, holdout ${input.holdoutPercent}%)`,
  });
  return {};
}

export function validateRules(config: EligibilityConfig): FieldErrors {
  const errors: FieldErrors = {};
  const intField = (field: "minDaysSinceLastVisit" | "futureBookingBlockDays" | "maxInvitesPerQuarter", max: number) => {
    const value = config[field];
    if (!Number.isInteger(value) || value < 0 || value > max) {
      errors[field] = `Must be a whole number between 0 and ${max}.`;
    }
  };
  intField("minDaysSinceLastVisit", 3650);
  intField("futureBookingBlockDays", 365);
  intField("maxInvitesPerQuarter", 12);
  return errors;
}

export function updateRules(config: EligibilityConfig, at: string, byEmail: string): FieldErrors {
  const errors = validateRules(config);
  if (Object.keys(errors).length > 0) return errors;
  const state = getConsole();
  if (!state.practice) return { form: "Onboard the practice before changing rules." };
  // W18: rules changes are an owner/manager grant; clinicians and non-members are refused.
  const decision = authorize(state.memberships, byEmail, state.practice.id, "edit_rules");
  if (!decision.allowed) return { form: "Your role cannot change eligibility rules." };
  const changed = (Object.keys(config) as Array<keyof EligibilityConfig>)
    .filter((k) => state.rulesConfig[k] !== config[k])
    .map((k) => `${k}: ${String(state.rulesConfig[k])} -> ${String(config[k])}`);
  if (changed.length === 0) return {};
  state.rulesConfig = { ...config };
  state.rulesVersion += 1;
  state.auditEvents.push({
    practiceId: state.practice.id,
    kind: "config_changed",
    at,
    subjectId: `rules-v${state.rulesVersion}`,
    detail: changed.join("; "),
  });
  return {};
}

// --- W41: self-serve setup (clinician roster, session config, completion) -------
// Setup edits are the same class of grant as eligibility rules — they govern who
// gets contacted and when — so they authorize against "edit_rules" rather than
// widening the W18 action set. Every change is audited, like every other config
// change in this store.

function requireEditRules(state: ConsoleState, byEmail: string): FieldErrors | null {
  if (!state.practice) return { form: "Set up the practice before configuring it." };
  const decision = authorize(state.memberships, byEmail, state.practice.id, "edit_rules");
  if (!decision.allowed) return { form: "Your role cannot change this configuration." };
  return null;
}

function audit(state: ConsoleState, at: string, subjectId: string, detail: string): void {
  if (!state.practice) return;
  state.auditEvents.push({
    practiceId: state.practice.id,
    kind: "config_changed",
    at,
    subjectId,
    detail,
  });
}

export interface ClinicianInput {
  displayName: string;
  participating: boolean;
}

export function validateClinicians(inputs: readonly ClinicianInput[]): FieldErrors {
  const errors: FieldErrors = {};
  if (inputs.length === 0) errors.clinicians = "Add at least one clinician.";
  inputs.forEach((c, i) => {
    if (c.displayName.trim().length < 2) errors[`clinician-${i}`] = "Name is too short.";
  });
  const names = inputs.map((c) => c.displayName.trim().toLowerCase());
  if (new Set(names).size !== names.length) errors.clinicians = "Clinician names must be unique.";
  if (inputs.length > 0 && !inputs.some((c) => c.participating)) {
    errors.clinicians = "At least one clinician must be participating.";
  }
  return errors;
}

/** Replace the roster wholesale — the wizard edits it as one list. */
export function saveClinicians(
  inputs: readonly ClinicianInput[],
  at: string,
  byEmail: string,
): FieldErrors {
  const errors = validateClinicians(inputs);
  if (Object.keys(errors).length > 0) return errors;
  const state = getConsole();
  const denied = requireEditRules(state, byEmail);
  if (denied) return denied;

  state.clinicians = inputs.map((c, i) => ({
    id: `clin-${i + 1}` as ClinicianId,
    displayName: c.displayName.trim(),
    participating: c.participating,
  }));
  // Drop allowlisted ids that no longer exist, so session config can't reference
  // a clinician the practice just removed.
  const ids = new Set(state.clinicians.map((c) => c.id as string));
  const allowlist = state.sessionConfig.participatingClinicianIds;
  if (allowlist !== "all") {
    const kept = allowlist.filter((id) => ids.has(id));
    state.sessionConfig = {
      ...state.sessionConfig,
      participatingClinicianIds: kept.length > 0 ? kept : "all",
    };
  }
  audit(state, at, "setup:clinicians", `roster set to ${state.clinicians.length} clinician(s)`);
  return {};
}

export function saveSessionConfig(
  config: SessionConfig,
  at: string,
  byEmail: string,
): FieldErrors {
  const errors = validateSessionConfig(config);
  if (Object.keys(errors).length > 0) return errors;
  const state = getConsole();
  const denied = requireEditRules(state, byEmail);
  if (denied) return denied;
  if (config.participatingClinicianIds !== "all") {
    const known = new Set(state.clinicians.map((c) => c.id as string));
    if (!config.participatingClinicianIds.every((id) => known.has(id))) {
      return { participatingClinicianIds: "Unknown clinician selected." };
    }
  }
  state.sessionConfig = {
    ...config,
    fillableTypes: [...config.fillableTypes],
    schedulingWindow: { ...config.schedulingWindow },
  };
  audit(
    state,
    at,
    "setup:sessions",
    `types=${config.fillableTypes.join("/")}; protected=${Math.round(
      config.protectedCapacityFraction * 100,
    )}%; window=${config.schedulingWindow.startHour}-${config.schedulingWindow.endHour}`,
  );
  return {};
}

/** The checks a practice must satisfy before the loop may run for it. */
export interface SetupReadiness {
  practice: boolean;
  clinicians: boolean;
  sessions: boolean;
  rules: boolean;
  complete: boolean;
}

/**
 * A step counts as ready only when it is BOTH valid AND explicitly saved by the
 * practice. Validity alone would pass on seeded defaults, letting a practice
 * "complete" setup while never seeing the settings it is being credited with.
 */
export function setupReadiness(state: ConsoleState = getConsole()): SetupReadiness {
  const acknowledged = (step: string) => state.acknowledgedSteps.includes(step);
  const practice = state.practice !== null;
  const clinicians = state.clinicians.length > 0 && state.clinicians.some((c) => c.participating);
  const sessions =
    acknowledged("sessions") && Object.keys(validateSessionConfig(state.sessionConfig)).length === 0;
  const rules = acknowledged("rules") && Object.keys(validateRules(state.rulesConfig)).length === 0;
  return {
    practice,
    clinicians,
    sessions,
    rules,
    complete: state.setupCompletedAt !== null,
  };
}

/** Record that the practice explicitly saved a wizard step. Idempotent. */
export function acknowledgeSetupStep(step: string, byEmail: string): FieldErrors {
  const state = getConsole();
  const denied = requireEditRules(state, byEmail);
  if (denied) return denied;
  if (!state.acknowledgedSteps.includes(step)) state.acknowledgedSteps.push(step);
  return {};
}

/** Finish setup — refused while any prerequisite is unmet, so "ready" means ready. */
export function completeSetup(at: string, byEmail: string): FieldErrors {
  const state = getConsole();
  const denied = requireEditRules(state, byEmail);
  if (denied) return denied;
  // Keyed by the unmet prerequisite, so the wizard can name what is missing.
  const readiness = setupReadiness(state);
  if (!readiness.clinicians) return { clinicians: "Add at least one participating clinician first." };
  if (!readiness.sessions) return { fillableTypes: "Session settings are incomplete." };
  if (!readiness.rules) return { minDaysSinceLastVisit: "Eligibility rules are incomplete." };
  if (state.setupCompletedAt !== null) return {}; // idempotent
  state.setupCompletedAt = at;
  audit(state, at, "setup:complete", "practice setup completed");
  return {};
}

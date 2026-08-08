// W11: console store — the practice profile and its versioned eligibility rules
// config, in memory behind globalThis (same mock-persistence posture as the W7
// rail store; Supabase persistence replaces this at the wiring unit). Every rules
// change bumps the version and lands in the audit trail (config-as-audit, W10 spine
// captures it downstream).

import { DEFAULT_CONFIG, type EligibilityConfig } from "@/engine/eligibility";
import type { AuditEvent, Practice, PracticeId } from "@/domain/types";

export interface ConsoleState {
  practice: Practice | null;
  rulesConfig: EligibilityConfig;
  rulesVersion: number;
  auditEvents: AuditEvent[];
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

export function onboardPractice(input: OnboardingInput, at: string): FieldErrors {
  const errors = validateOnboarding(input);
  if (Object.keys(errors).length > 0) return errors;
  const state = getConsole();
  const practice: Practice = {
    id: "prac-console" as PracticeId,
    name: input.name.trim(),
    timezone: input.timezone,
    holdoutRate: input.holdoutPercent / 100,
  };
  state.practice = practice;
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

export function updateRules(config: EligibilityConfig, at: string): FieldErrors {
  const errors = validateRules(config);
  if (Object.keys(errors).length > 0) return errors;
  const state = getConsole();
  if (!state.practice) return { form: "Onboard the practice before changing rules." };
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

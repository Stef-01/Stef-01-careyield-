"use server";

import { redirect } from "next/navigation";
import {
  completeSetup,
  onboardPractice,
  saveClinicians,
  saveSessionConfig,
  updateRules,
  type ClinicianInput,
} from "@/console/store";
import { APPOINTMENT_TYPES, type SessionConfig } from "@/session/config";
import type { AppointmentType } from "@/domain/types";
import type { EligibilityConfig } from "@/engine/eligibility";
import { nextStep, type SetupStepSlug } from "@/console/setup-steps";
import { requireSession } from "../guard";

// Every action authorizes first (W13) and the store re-checks the role grant (W18).
// On success the wizard advances; on failure it returns to the same step with the
// error surfaced, so a practice is never bounced out of setup by a typo.

function onwards(step: SetupStepSlug, errors: Record<string, string>): never {
  if (Object.keys(errors).length > 0) {
    const first = Object.values(errors)[0] ?? "1";
    redirect(`/console/setup/${step}?error=${encodeURIComponent(first)}`);
  }
  const next = nextStep(step);
  redirect(next ? `/console/setup/${next}` : "/console");
}

export async function saveStepPractice(formData: FormData): Promise<void> {
  const email = await requireSession();
  const raw = formData.get("holdoutPercent");
  const errors = onboardPractice(
    {
      name: String(formData.get("name") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
      holdoutPercent: raw === null || raw === "" ? Number.NaN : Number(raw),
    },
    new Date().toISOString(),
    email,
  );
  onwards("practice", errors);
}

export async function saveStepClinicians(formData: FormData): Promise<void> {
  const email = await requireSession();
  const names = formData.getAll("clinicianName").map(String);
  const inputs: ClinicianInput[] = names
    .map((displayName, i) => ({
      displayName,
      // An unchecked box submits nothing, so participation is read positionally.
      participating: formData.getAll("participating").map(String).includes(String(i)),
    }))
    .filter((c) => c.displayName.trim().length > 0);
  onwards("clinicians", saveClinicians(inputs, new Date().toISOString(), email));
}

export async function saveStepSessions(formData: FormData): Promise<void> {
  const email = await requireSession();
  const chosen = formData.getAll("fillableTypes").map(String) as AppointmentType[];
  const allowlist = formData.getAll("participatingClinicianIds").map(String);
  const config: SessionConfig = {
    fillableTypes: chosen.filter((t) => APPOINTMENT_TYPES.includes(t)),
    participatingClinicianIds: allowlist.length > 0 ? allowlist : "all",
    protectedCapacityFraction: Number(formData.get("protectedCapacityPercent")) / 100,
    schedulingWindow: {
      startHour: Number(formData.get("startHour")),
      endHour: Number(formData.get("endHour")),
    },
  };
  onwards("sessions", saveSessionConfig(config, new Date().toISOString(), email));
}

export async function saveStepRules(formData: FormData): Promise<void> {
  const email = await requireSession();
  const config: EligibilityConfig = {
    minDaysSinceLastVisit: Number(formData.get("minDaysSinceLastVisit")),
    futureBookingBlockDays: Number(formData.get("futureBookingBlockDays")),
    maxInvitesPerQuarter: Number(formData.get("maxInvitesPerQuarter")),
    usualClinicianOnly: formData.get("usualClinicianOnly") === "on",
    chronicCareOnly: formData.get("chronicCareOnly") === "on",
  };
  onwards("rules", updateRules(config, new Date().toISOString(), email));
}

export async function finishSetup(): Promise<void> {
  const email = await requireSession();
  onwards("review", completeSetup(new Date().toISOString(), email));
}

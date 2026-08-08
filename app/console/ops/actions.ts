"use server";

import { redirect } from "next/navigation";
import { getConsole } from "@/console/store";
import { applyKillSwitch, applyPracticePause } from "@/ops/store";
import { authorize } from "@/tenancy/tenancy";
import { requireSession } from "../guard";

// Ops controls are a pause_sending grant (owner/manager). Server actions are
// independently-invocable endpoints, so authorize here (W13), not only in the page.
async function requirePauseGrant(): Promise<void> {
  const email = await requireSession();
  const state = getConsole();
  if (!state.practice) redirect("/console/onboarding");
  const decision = authorize(state.memberships, email, state.practice.id, "pause_sending");
  if (!decision.allowed) redirect("/console/ops?error=denied");
}

export async function toggleKillSwitch(formData: FormData): Promise<void> {
  await requirePauseGrant();
  applyKillSwitch(formData.get("engage") === "1", new Date().toISOString());
  redirect("/console/ops");
}

export async function togglePracticePause(formData: FormData): Promise<void> {
  await requirePauseGrant();
  const practiceId = getConsole().practice?.id;
  if (!practiceId) redirect("/console/onboarding");
  applyPracticePause(practiceId, formData.get("pause") === "1", new Date().toISOString());
  redirect("/console/ops");
}

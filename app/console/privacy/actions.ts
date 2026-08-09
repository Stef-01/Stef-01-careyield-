"use server";

// W33: privacy actions. Export and delete are owner/manager operations (edit_rules
// grant — the practice-stewardship tier). Server actions are independently-invocable
// endpoints, so the grant is checked here, not only in the page.

import { redirect } from "next/navigation";
import { getConsole } from "@/console/store";
import { deletePatientEverywhere } from "@/privacy/store";
import { authorize } from "@/tenancy/tenancy";
import { requireSession } from "../guard";

async function requirePrivacyGrant(): Promise<void> {
  const email = await requireSession();
  const state = getConsole();
  if (!state.practice) redirect("/console/onboarding");
  const decision = authorize(state.memberships, email, state.practice.id, "edit_rules");
  if (!decision.allowed) redirect("/console/privacy?error=denied");
}

export async function exportPatient(formData: FormData): Promise<void> {
  await requirePrivacyGrant();
  const patientId = String(formData.get("patientId") ?? "").trim();
  if (!patientId) redirect("/console/privacy?error=missing");
  redirect(`/console/privacy?export=${encodeURIComponent(patientId)}`);
}

export async function erasePatient(formData: FormData): Promise<void> {
  await requirePrivacyGrant();
  const patientId = String(formData.get("patientId") ?? "").trim();
  if (!patientId || formData.get("confirm") !== "on") {
    redirect("/console/privacy?error=confirm");
  }
  deletePatientEverywhere(patientId, new Date().toISOString());
  redirect("/console/privacy?deleted=1");
}

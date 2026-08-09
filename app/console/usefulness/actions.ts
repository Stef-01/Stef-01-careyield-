"use server";

import { redirect } from "next/navigation";
import { recordOutcome } from "@/audit/store";
import { getConsole } from "@/console/store";
import { authorize } from "@/tenancy/tenancy";
import { requireSession } from "../guard";

export async function submitUsefulness(formData: FormData): Promise<void> {
  // Server actions are independently-invocable endpoints — authorize first (W13).
  // A session alone is not authorization (W51): recordOutcome takes no caller
  // identity, so the membership grant has to be checked here or nowhere.
  const email = await requireSession();
  const state = getConsole();
  if (!state.practice) redirect("/console/onboarding");
  const decision = authorize(state.memberships, email, state.practice.id, "record_usefulness");
  if (!decision.allowed) redirect("/console/usefulness?error=denied");
  const appointmentId = formData.get("appointmentId");
  if (typeof appointmentId !== "string") redirect("/console/usefulness?error=1");
  const result = recordOutcome({
    appointmentId: appointmentId as string,
    usefulness: formData.getAll("usefulness").map(String),
    clinicianJudgedReasonable: formData.get("clinicianJudgedReasonable") === "on",
  });
  redirect(result.ok ? "/console/usefulness?saved=1" : `/console/usefulness?error=${result.error}`);
}

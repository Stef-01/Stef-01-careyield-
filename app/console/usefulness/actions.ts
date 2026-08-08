"use server";

import { redirect } from "next/navigation";
import { recordOutcome } from "@/audit/store";
import { requireSession } from "../guard";

export async function submitUsefulness(formData: FormData): Promise<void> {
  // Server actions are independently-invocable endpoints — authorize first (W13).
  await requireSession();
  const appointmentId = formData.get("appointmentId");
  if (typeof appointmentId !== "string") redirect("/console/usefulness?error=1");
  const result = recordOutcome({
    appointmentId: appointmentId as string,
    usefulness: formData.getAll("usefulness").map(String),
    clinicianJudgedReasonable: formData.get("clinicianJudgedReasonable") === "on",
  });
  redirect(result.ok ? "/console/usefulness?saved=1" : `/console/usefulness?error=${result.error}`);
}

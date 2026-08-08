"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession } from "@/console/session";
import { onboardPractice, updateRules } from "@/console/store";
import type { EligibilityConfig } from "@/engine/eligibility";
import { requireSession } from "./guard";

// Mock auth provider: any staff email signs in (synthetic phase — founder gate
// blocks production credentials; Supabase auth replaces this action's body).
export async function signIn(formData: FormData): Promise<void> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) redirect("/console/signin?error=1");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(email), { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/console");
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/console/signin");
}

export async function onboard(formData: FormData): Promise<void> {
  // Server actions are independently-invocable POST endpoints — authorize here,
  // not only in the page component that renders the form.
  const email = await requireSession();
  const errors = onboardPractice(
    {
      name: String(formData.get("name") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
      holdoutPercent: Number(formData.get("holdoutPercent")),
    },
    new Date().toISOString(),
    email,
  );
  if (Object.keys(errors).length > 0) redirect("/console/onboarding?error=1");
  redirect("/console");
}

export async function saveRules(formData: FormData): Promise<void> {
  const email = await requireSession();
  const config: EligibilityConfig = {
    minDaysSinceLastVisit: Number(formData.get("minDaysSinceLastVisit")),
    futureBookingBlockDays: Number(formData.get("futureBookingBlockDays")),
    maxInvitesPerQuarter: Number(formData.get("maxInvitesPerQuarter")),
    usualClinicianOnly: formData.get("usualClinicianOnly") === "on",
    chronicCareOnly: formData.get("chronicCareOnly") === "on",
  };
  const errors = updateRules(config, new Date().toISOString(), email);
  if (Object.keys(errors).length > 0) redirect("/console/rules?error=1");
  redirect("/console");
}

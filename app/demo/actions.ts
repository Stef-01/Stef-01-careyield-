"use server";

// W22: demo environment — one action resets every mock store to the scripted world
// and seats the presenter as the demo practice owner. Idempotent: launching again
// mid-demo returns everything to the start of the script.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resetAudit } from "@/audit/store";
import { resetStore } from "@/booking/store";
import { SESSION_COOKIE, signSession } from "@/console/session";
import { onboardPractice, resetConsole } from "@/console/store";
import { resetOps } from "@/ops/store";
import { resetPrivacy } from "@/privacy/store";

const DEMO_EMAIL = "presenter@demo.practice.example";

export async function launchDemo(): Promise<void> {
  resetConsole();
  resetStore();
  resetOps();
  resetAudit();
  resetPrivacy();
  const errors = onboardPractice(
    { name: "Demo Family Practice", timezone: "Australia/Sydney", holdoutPercent: 20 },
    new Date().toISOString(),
    DEMO_EMAIL,
  );
  if (Object.keys(errors).length > 0) throw new Error("demo seed failed onboarding validation");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(DEMO_EMAIL), { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/console");
}

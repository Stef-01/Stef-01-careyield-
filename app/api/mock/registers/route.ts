// W60: register-store introspection + reset for the Playwright e2e (synthetic only,
// same posture as the other /api/mock routes — removed when real persistence lands).

import { NextResponse, type NextRequest } from "next/server";
import type { PracticeId } from "@/domain/types";
import { getConsole } from "@/console/store";
import { assertMockRoutesEnabled } from "@/lib/mock-guard";
import { getRegisters, registersFor, resetRegisters, seedCounts } from "@/registers/store";

export const dynamic = "force-dynamic";

export async function GET() {
  assertMockRoutesEnabled();
  const practiceId = getConsole().practices[0]?.practice.id;
  return NextResponse.json({
    state: getRegisters(),
    forPractice: practiceId ? registersFor(practiceId) : [],
  });
}

export async function POST(request: NextRequest) {
  assertMockRoutesEnabled();
  const state = resetRegisters();
  // Give the current practice non-zero counts so the console renders something real
  // to look at. Synthetic, and replaced by W57/W58 once those engines exist.
  //
  // W361: `?uncounted=1` LEAVES THEM UNSEEDED, which is the state every practice outside a test
  // has always been in — `seedCounts` has no caller but this one. The console used to render that
  // as a bold zero under "On this register"; the walk that proves it does not needs a practice the
  // register has never been run for, and this is the only way to reach one.
  const practiceId = getConsole().practices[0]?.practice.id;
  if (practiceId && request.nextUrl.searchParams.get("uncounted") !== "1") {
    seedCounts(practiceId as PracticeId, {
      placeholder_register_a: { memberCount: 42, gapCount: 9 },
      placeholder_register_b: { memberCount: 17, gapCount: 3 },
    });
  }
  return NextResponse.json(state);
}

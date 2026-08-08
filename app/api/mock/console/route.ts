// W11: console-store introspection for the Playwright e2e suite (synthetic only,
// same posture as /api/mock/state — removed when real persistence lands).

import { NextResponse } from "next/server";
import { getConsole, resetConsole } from "@/console/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getConsole());
}

export async function POST() {
  return NextResponse.json(resetConsole());
}

// W11: console-store introspection for the Playwright e2e suite (synthetic only,
// same posture as /api/mock/state — removed when real persistence lands).

import { NextResponse } from "next/server";
import { resetComplaints } from "@/complaints/store";
import { getConsole, resetConsole } from "@/console/store";
import { resetPrivacy } from "@/privacy/store";
import { assertMockRoutesEnabled } from "@/lib/mock-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  assertMockRoutesEnabled();
  return NextResponse.json(getConsole());
}

export async function POST() {
  assertMockRoutesEnabled();
  resetPrivacy(); // W33 state rides along with the console reset in e2e
  resetComplaints(); // W43 likewise
  return NextResponse.json(resetConsole());
}

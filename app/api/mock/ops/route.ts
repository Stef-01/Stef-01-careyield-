// W19: ops introspection for the Playwright e2e suite (synthetic only; gated out
// of production by the W13 mock guard). Resetting also resets the booking rail so
// the queue view is deterministic.

import { NextResponse } from "next/server";
import { resetStore } from "@/booking/store";
import { getOps, queueView, resetOps } from "@/ops/store";
import { assertMockRoutesEnabled } from "@/lib/mock-guard";

export const dynamic = "force-dynamic";

function snapshot() {
  const ops = getOps();
  return { switches: ops.switches, auditEvents: ops.auditEvents, queue: queueView() };
}

export async function GET() {
  assertMockRoutesEnabled();
  return NextResponse.json(snapshot());
}

export async function POST() {
  assertMockRoutesEnabled();
  resetOps();
  resetStore();
  return NextResponse.json(snapshot());
}

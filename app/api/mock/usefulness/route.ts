// W15: usefulness-audit introspection for the Playwright e2e suite (synthetic
// only; gated out of production by the W13 mock guard).

import { NextResponse } from "next/server";
import { getAudit, pendingVisits, resetAudit } from "@/audit/store";
import { tallyOutcomes } from "@/audit/usefulness";
import { assertMockRoutesEnabled } from "@/lib/mock-guard";

export const dynamic = "force-dynamic";

function snapshot() {
  const state = getAudit();
  return {
    pending: pendingVisits(state).map((v) => ({ appointmentId: v.appointmentId, patientLabel: v.patientLabel })),
    outcomes: state.outcomes,
    tally: tallyOutcomes(state.outcomes),
  };
}

export async function GET() {
  assertMockRoutesEnabled();
  return NextResponse.json(snapshot());
}

export async function POST() {
  assertMockRoutesEnabled();
  resetAudit();
  return NextResponse.json(snapshot());
}

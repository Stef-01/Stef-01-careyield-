// W7: mock-rail introspection for the Playwright e2e suite. Synthetic data only —
// this route exposes the in-memory seed (and its signed booking links) so tests can
// drive the flow; it is removed when the mock rail is replaced by real persistence.

import { NextResponse } from "next/server";
import { getStore, resetStore } from "@/booking/store";
import { signBookingToken } from "@/booking/token";

export const dynamic = "force-dynamic";

function snapshot() {
  const store = getStore();
  return {
    invitations: store.state.invitations.map((i) => ({
      id: i.id,
      status: i.status,
      sessionDate: i.sessionDate,
      token: signBookingToken(i.id),
    })),
    appointments: store.state.appointments.map((a) => ({
      id: a.id,
      status: a.status,
      startsAt: a.startsAt,
      generatedByInvitation: a.generatedByInvitation,
    })),
    auditEvents: store.state.auditEvents,
  };
}

export async function GET() {
  return NextResponse.json(snapshot());
}

export async function POST() {
  resetStore();
  return NextResponse.json(snapshot());
}

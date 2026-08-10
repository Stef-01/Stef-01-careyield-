// W81: case-mix introspection + clinician-identity linking for the Playwright e2e
// (synthetic only, same posture as the other /api/mock routes).

import { NextRequest, NextResponse } from "next/server";
import type { ClinicianId } from "@/domain/types";
import { getInterestState, resetInterestState } from "@/capability/store";
import { getConsole } from "@/console/store";
import { assertMockRoutesEnabled } from "@/lib/mock-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  assertMockRoutesEnabled();
  return NextResponse.json({
    interests: Object.values(getInterestState().byKey),
    clinicians: getConsole().clinicians,
  });
}

/**
 * Reset, and optionally link a clinician to a sign-in identity so the console can tell
 * which clinician is signed in. The linking exists in the product (ClinicianRecord.email);
 * this route only sets it, because the W41 wizard does not collect it yet.
 */
export async function POST(request: NextRequest) {
  assertMockRoutesEnabled();
  resetInterestState();

  const email = request.nextUrl.searchParams.get("linkEmail");
  const state = getConsole();

  // Seed a roster entry if there is none. The e2e is testing the case-mix surface, not the
  // W41 wizard, so it should not have to drive the wizard to get a clinician to exist.
  if (state.clinicians.length === 0) {
    state.nextClinicianSeq += 1;
    state.clinicians.push({
      id: `clin-${state.nextClinicianSeq}` as ClinicianId,
      displayName: "Dr Amara Lee",
      participating: true,
      email: null,
    });
  }
  const clinician = state.clinicians[0];
  if (clinician) clinician.email = email;

  return NextResponse.json({ clinicians: state.clinicians });
}

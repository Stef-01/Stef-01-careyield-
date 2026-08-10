// W151: education seed + introspection for the Playwright e2e (synthetic only, same posture as
// the other /api/mock routes — removed when real persistence lands).
//
// The seed deliberately contains three things the page must handle rather than one: an item for
// a register the practice runs, an item for one it does NOT (which must appear as named
// out-of-scope rather than vanish), and a CPD entry belonging to a COLLEAGUE, which must not
// reach the signed-in clinician's record.

import { NextResponse, type NextRequest } from "next/server";
import { getConsole } from "@/console/store";
import { recordCpdEntry, type CpdEntry } from "@/education/cpd";
import type { EducationItem } from "@/education/curation";
import { addCpdEntries, addLibraryItems, getLibrary, resetEducation } from "@/education/store";
import { assertMockRoutesEnabled } from "@/lib/mock-guard";
import { setRegisterEnabled } from "@/registers/store";
import type { ClinicianId, ConditionCode } from "@/domain/types";

export const dynamic = "force-dynamic";

const ITEMS: EducationItem[] = [
  {
    itemId: "item-a1",
    conditionCode: "placeholder_register_a",
    title: "Placeholder material A1 — fixture only.",
    sourceRef: "signed-off-source-a1",
    relevantFactCodes: [],
  },
  {
    itemId: "item-a2",
    conditionCode: "placeholder_register_a",
    title: "Placeholder material A2 — fixture only.",
    sourceRef: "signed-off-source-a2",
    relevantFactCodes: [],
  },
  {
    itemId: "item-b1",
    conditionCode: "placeholder_register_b",
    title: "Placeholder material B1 — fixture only.",
    sourceRef: "signed-off-source-b1",
    relevantFactCodes: [],
  },
];

function cpd(entryId: string, clinicianId: string, at: string, itemId: string): CpdEntry {
  const result = recordCpdEntry(
    {
      entryId, clinicianId, kind: "opened", itemId,
      sourceRef: `signed-off-source-${itemId.replace("item-", "")}`,
      itemTitle: `Placeholder material ${itemId.replace("item-", "").toUpperCase()} — fixture only.`,
      at,
    },
    [],
  );
  if (!result.ok) throw new Error(result.errors.join(", "));
  return result.entry;
}

export async function GET() {
  assertMockRoutesEnabled();
  return NextResponse.json({ library: getLibrary() });
}

export async function POST(request: NextRequest) {
  assertMockRoutesEnabled();
  resetEducation();
  const console_ = getConsole();
  const email = request.nextUrl.searchParams.get("linkEmail");

  if (console_.clinicians.length < 2) {
    console_.clinicians.length = 0;
    console_.clinicians.push(
      { id: "clin-1" as ClinicianId, displayName: "Dr Demo One", participating: true, email: null },
      { id: "clin-2" as ClinicianId, displayName: "Dr Demo Two", participating: true, email: null },
    );
  }
  const mine = console_.clinicians[0];
  if (mine && email) mine.email = email;

  if (request.nextUrl.searchParams.get("empty") === "1") {
    return NextResponse.json({ library: getLibrary() });
  }

  // Register B is switched off for this practice, so its material is out of scope — a statement
  // about the PRACTICE, which the page names rather than hides (W145).
  const practiceId = console_.practice?.id;
  if (practiceId) setRegisterEnabled(practiceId, "placeholder_register_b" as ConditionCode, false);

  addLibraryItems(ITEMS);

  if (mine) {
    const own = cpd("cpd-1", mine.id, "2026-03-01", "item-a1");
    const correctable = cpd("cpd-2", mine.id, "2026-03-02", "item-a2");
    const correction = recordCpdEntry(
      {
        entryId: "cpd-3", clinicianId: mine.id, kind: "corrected", itemId: "item-a2",
        sourceRef: "signed-off-source-a2", itemTitle: correctable.itemTitle, at: "2026-03-04",
        correctsEntryId: "cpd-2", note: "Opened by accident on a shared screen.",
      },
      [correctable],
    );
    const entries = [own, correctable];
    if (correction.ok) entries.push(correction.entry);
    // A colleague's entry, which must never reach the signed-in clinician's record.
    const other = console_.clinicians[1];
    if (other) entries.push(cpd("cpd-colleague", other.id, "2026-03-03", "item-a1"));
    addCpdEntries(entries);
  }

  return NextResponse.json({ library: getLibrary(), clinicians: console_.clinicians });
}

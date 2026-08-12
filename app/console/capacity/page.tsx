// W229: what a practice's own diary recorded, on the page it opens.
//
// The view-model in `src/capacity/console.ts` decides which reading each session gets; this
// decides how to show it, and the whole design is one decision repeated:
//
//   THE TWO EMPTINESSES ARE NEVER THE SAME PIXEL. "Nothing left over" and "we cannot tell" are
//   both a row with no range on it, and rendered as the same dash a reader takes the first
//   meaning, because it is the one that needs no explanation. So a full session gets a written
//   sentence in the ordinary style — it is a FINDING — and an unanswerable one gets the amber
//   box this console uses for "no", with its reasons and what would settle it. There is no dash
//   anywhere on this page.
//
//   THE COUNTS SIT ABOVE THE TABLE AND ARE ALWAYS ALL THREE. A reader who never scrolls should
//   still be able to tell the difference this page exists for, and three counts do that in a
//   line. W228's rule: a page that speaks only when alarmed teaches a reader that silence means
//   agreement.
//
//   AND THE PAGE-LEVEL BLANK SAYS WHICH BLANK IT IS. A practice with no recorded diary sees a
//   sentence, not a grey table — because the failure this unit is gated on is exactly a manager
//   opening an empty capacity page and concluding the diary is full.
//
// The fixed sentences come from W226's `CAPACITY_SURFACE_COPY` and the view-model's own copy
// bundle, never written into this JSX: copy in a page is copy no linter reaches, which is W151's
// rule and the reason W226 pre-declared a surface bundle for this unit.
//
// No send control, and no control at all. Nothing on this page changes what Meherr does.

import { redirect } from "next/navigation";
import {
  CAPACITY_CONSOLE_COPY,
  capacityConsoleView,
  renderReading,
  type SessionRow,
} from "@/capacity/console";
import { CAPACITY_SURFACE_COPY } from "@/capacity/copy-lint";
import { sessionsFrom } from "@/capacity/model";
import { getConsole } from "@/console/store";
import { getSimResult } from "@/sim/dashboard-data";
import { authorize } from "@/tenancy/tenancy";
import { requirePractice } from "../guard";
import { ConsoleShell } from "../ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Capacity — Meherr" };

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const weekdayName = (weekday: number) => WEEKDAYS[weekday] ?? `Day ${weekday}`;

/**
 * One row's figure column.
 *
 * Three visibly different things, and never a dash. W197's rule about a blank cell: a reader
 * assumes the reading that needs no explanation, so every cell here says something.
 */
function Figure({ row }: { row: SessionRow }) {
  switch (row.reading.kind) {
    case "spare_slots_recorded":
      return (
        <span className="font-medium text-stone-900">
          {row.reading.spare.fewest}–{row.reading.spare.most} of {row.reading.opening.slots}
        </span>
      );
    case "no_spare_slots_recorded":
      return (
        <span className="font-medium text-stone-900" data-testid="figure-none-spare">
          none of {row.reading.opening.slots}
        </span>
      );
    case "record_cannot_say":
      return (
        <span className="font-medium text-amber-800" data-testid="figure-cannot-say">
          not recorded
        </span>
      );
  }
}

export default async function CapacityPage() {
  const { email, record } = await requirePractice();
  const console_ = getConsole();
  if (!authorize(console_.memberships, email, record.practice.id, "view_dashboard").allowed) {
    redirect("/console");
  }

  // Practice-scoped as the QUERY, not a later filter — W123's rule, and W209's finding.
  const recorded = sessionsFrom(getSimResult().appointments, record.practice.id);
  const view = capacityConsoleView(recorded);

  return (
    <ConsoleShell email={email}>
      <h1 className="text-2xl font-semibold tracking-tight">Capacity</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">{CAPACITY_SURFACE_COPY.whatThisIs}</p>
      <p className="mt-1 text-xs text-stone-500">
        Practice <code>{record.practice.id}</code>. Figures are from this tree&rsquo;s synthetic
        run and describe no real practice and no real person.
      </p>

      {view.state === "no_diary_recorded" ? (
        <section
          data-testid="capacity-no-diary"
          className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="font-medium text-amber-900">Nothing is recorded yet</h2>
          <p className="mt-2 text-sm text-amber-900">{view.copy}</p>
          <p className="mt-4 text-sm font-medium text-amber-900">What would settle it</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-900">
            {view.wouldSettleIt.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section data-testid="capacity-counts" className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-2xl font-semibold text-stone-900">{view.counts.spare}</p>
              <p className="mt-1 text-sm text-stone-600">
                sessions where the record shows slots left over
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-2xl font-semibold text-stone-900">{view.counts.noneSpare}</p>
              <p className="mt-1 text-sm text-stone-600">
                sessions where every recorded week filled every slot offered
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-2xl font-semibold text-stone-900">{view.counts.cannotSay}</p>
              <p className="mt-1 text-sm text-stone-600">
                sessions the record cannot answer for yet
              </p>
            </div>
          </section>
          <p data-testid="capacity-counts-note" className="mt-2 text-xs text-stone-500">
            {CAPACITY_CONSOLE_COPY.countsAlwaysShown}
          </p>

          <table className="mt-8 w-full text-sm" data-testid="capacity-table">
            <caption className="sr-only">
              Slots left open at the end of the week, by clinician and day of the week
            </caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-500">
                <th scope="col" className="pb-2 font-medium">
                  Session
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Weeks on record
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Slots left open
                </th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row) => (
                <tr
                  key={`${row.weekday}-${row.clinicianId}`}
                  className="border-t border-stone-100 align-top"
                  data-testid={`capacity-row-${row.clinicianId}-${row.weekday}`}
                >
                  <th scope="row" className="py-2 text-left font-normal text-stone-700">
                    {weekdayName(row.weekday)}, <code>{row.clinicianId}</code>
                  </th>
                  <td className="py-2 text-stone-700">{row.recordedWeeks}</td>
                  <td className="py-2">
                    <Figure row={row} />
                    <p className="mt-1 max-w-xl text-xs text-stone-500">
                      {renderReading(row.reading)}
                    </p>
                    {row.reading.kind === "record_cannot_say" && (
                      <ul className="mt-1 list-disc pl-5 text-xs text-amber-800">
                        {row.reading.wouldSettleIt.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <section className="mt-10 space-y-2 border-t border-stone-200 pt-6 text-xs text-stone-500">
        <p data-testid="capacity-not-demand">{CAPACITY_SURFACE_COPY.whatThisIsNot}</p>
        <p>{CAPACITY_CONSOLE_COPY.spareIsSubtracted}</p>
        <p data-testid="capacity-your-diary">{CAPACITY_SURFACE_COPY.itIsYourDiary}</p>
        <p data-testid="capacity-not-wired">{CAPACITY_SURFACE_COPY.notWiredToAnything}</p>
      </section>
    </ConsoleShell>
  );
}

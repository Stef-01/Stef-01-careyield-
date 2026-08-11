// W220: the response graph, on the page a practice opens.
//
// The view-model in `src/outcomes/response-console.ts` decides which silence a reader is looking
// at; this decides how to show it, and makes three calls worth stating.
//
//   THE FOUR SILENCES GET FOUR SECTIONS, not one list with an asterisk. "Answered", "nothing
//   recorded against", "withheld" and "never performed" lead a practice manager to four
//   different next actions, and merging any two of them into a nicer-looking table is how the
//   comfortable reading wins.
//
//   THE "NEVER PERFORMED" SECTION IS NOT COLLAPSED OR HIDDEN. It is the one that says what this
//   product does not do, which is the section a reader would skip and the section that stops
//   three empty rows being read as three failures. W199 made the same call about coverage.
//
//   AND THERE IS NO SEND CONTROL, deliberately and visibly. G9 is unratified, so these counts
//   have one reader: the practice they are about.

import { redirect } from "next/navigation";
import { getConsole } from "@/console/store";
import { buildResponseGraph, eventsFromSim, interventionsFromSim } from "@/outcomes/response-graph";
import {
  CELL_SUPPRESSION_COPY,
  type DisclosableCell,
} from "@/outcomes/graph-privacy";
import { RESPONSE_CONSOLE_COPY, responseConsoleView } from "@/outcomes/response-console";
import { getSimResult } from "@/sim/dashboard-data";
import { authorize } from "@/tenancy/tenancy";
import { requirePractice } from "../guard";
import { ConsoleShell } from "../ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Responses — Meherr" };

/**
 * The window this page covers.
 *
 * The calendar year in the synthetic phase, and stated on the page. W205's finding is the reason
 * it is a named constant rendered beside the figures rather than a heading somebody trusts: a
 * true count under a false period is the failure mode, and it is invisible.
 */
const PERIOD = { fromIso: "2026-01-01", toIso: "2026-12-31" };

const cellLabel = (cell: DisclosableCell) =>
  cell.to === null ? "nothing recorded against it" : cell.to.replace(/_/g, " ");

const kindLabel = (kind: string) => kind.replace(/_/g, " ");

export default async function ResponsesPage() {
  const { email, record } = await requirePractice();
  const console_ = getConsole();
  if (!authorize(console_.memberships, email, record.practice.id, "view_dashboard").allowed) {
    redirect("/console");
  }

  const sim = getSimResult();
  const interventions = interventionsFromSim(sim);
  const events = eventsFromSim(sim);
  const built = buildResponseGraph(interventions, events, PERIOD);
  const view = responseConsoleView(built.ok ? built.graph : null, events.length);

  return (
    <ConsoleShell email={email}>
      <h1 className="text-2xl font-semibold tracking-tight">Responses</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">{RESPONSE_CONSOLE_COPY.intro}</p>
      <p className="mt-1 text-xs text-stone-500">
        Covering {PERIOD.fromIso} to {PERIOD.toIso} inclusive. Practice{" "}
        <code>{record.practice.id}</code>.
      </p>

      {view.state === "empty" ? (
        <section
          data-testid="responses-empty"
          className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="font-medium text-amber-900">Nothing to show yet</h2>
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
          {view.disclosable.kinds.map((kind) => (
            <section
              key={kind.from}
              data-testid={`responses-kind-${kind.from}`}
              className="mt-8 rounded-xl border border-stone-200 bg-white p-6"
            >
              <h2 className="font-medium text-stone-900">{kindLabel(kind.from)}</h2>
              <p className="mt-1 text-xs text-stone-500">
                {kind.total === null
                  ? "Total withheld, so a withheld count above cannot be worked out by subtraction."
                  : `${kind.total} recorded in this period.`}
              </p>
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">
                  What was recorded after each {kindLabel(kind.from)}
                </caption>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-500">
                    <th scope="col" className="pb-2 font-medium">
                      What was recorded next
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kind.cells.map((cell) => (
                    <tr key={String(cell.to)} className="border-t border-stone-100">
                      <th scope="row" className="py-1.5 text-left font-normal text-stone-700">
                        {cellLabel(cell)}
                      </th>
                      <td className="py-1.5 text-stone-900">
                        {cell.suppression === null ? cell.count : "withheld"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/*
                W205's rule, and this branch exists because the e2e found it missing: a sentence
                that appears only on the incomplete case makes its PRESENCE the signal, and a
                reader who never sees it cannot tell "everything is answered" from "this page
                does not track that". Over the default synthetic run every offer has something
                recorded against it, so without the positive branch the distinction this unit is
                gated on was invisible on the page it was built for.
              */}
              {kind.cells.some((cell) => cell.to === null) ? (
                <p data-testid="nothing-recorded-note" className="mt-3 text-xs text-stone-500">
                  {RESPONSE_CONSOLE_COPY.nothingRecorded}
                </p>
              ) : (
                <p data-testid="all-recorded-note" className="mt-3 text-xs text-stone-500">
                  {RESPONSE_CONSOLE_COPY.allRecorded}
                </p>
              )}
            </section>
          ))}

          {view.withheldCellCount > 0 && (
            <p data-testid="responses-withheld" className="mt-4 text-sm text-stone-600">
              {RESPONSE_CONSOLE_COPY.withheld} {CELL_SUPPRESSION_COPY.withheld_to_protect_another_cell}
            </p>
          )}

          {view.disclosable.unobserved.length > 0 && (
            <section
              data-testid="responses-never-performed"
              className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6"
            >
              <h2 className="font-medium text-stone-900">Not done at all in this period</h2>
              <p className="mt-1 text-sm text-stone-600">
                {RESPONSE_CONSOLE_COPY.neverPerformed}
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm text-stone-700">
                {view.disclosable.unobserved.map((kind) => (
                  <li key={kind.kind}>{kindLabel(kind.kind)}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p data-testid="responses-not-sent" className="mt-8 text-xs text-stone-500">
        {RESPONSE_CONSOLE_COPY.notSent}
      </p>
    </ConsoleShell>
  );
}

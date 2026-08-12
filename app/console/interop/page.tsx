// W246: what left this practice, and what did not.
//
// The view-model in `src/interop/console.ts` decides which branch a practice gets; this decides
// how to show it, and the whole design is one decision repeated:
//
//   THERE IS NO ZERO ON THE EMPTY PAGE. A practice that has never exchanged anything does not see
//   a table of noughts — it sees a sentence saying nothing was ATTEMPTED, and the list of what
//   would have to be decided first. A zero is a measurement, and this is the absence of one;
//   rendered as a zero it invites the reader to conclude that sending was tried and produced
//   nothing, which is the opposite of true and the more reassuring of the two.
//
//   "LEFT, NOTHING CAME BACK" GETS THE AMBER BOX. It is not a failure and it is not a delivery,
//   and it is the only row that needs a person — so it is the only row this page emphasises. The
//   acknowledged and rejected rows are ordinary, because both are settled.
//
//   AND THE BOUND IS ON THE PAGE, NOT IN A COMMENT. This list is built from what LEFT, so a
//   message that never left leaves no row — and a reader who believes the page is complete reads
//   no rows as no problems. That sentence is rendered where the rows are, not in a footnote.
//
// The fixed sentences come from `INTEROP_CONSOLE_COPY` and W244's own copy maps, never written
// into this JSX: copy in a page is copy no linter reaches, which is W151's rule.
//
// NO CONTROL AT ALL, and here that is load-bearing rather than a house style. A retry button
// would be the most dangerous control in this product — one click on an unanswered row may put a
// second copy of a clinical document into another practice's records.

import { redirect } from "next/navigation";
import {
  INTEROP_CONSOLE_COPY,
  interopConsoleView,
  nothingCanBeSent,
  type ExchangeRow,
} from "@/interop/console";
import { getConsole } from "@/console/store";
import { authorize } from "@/tenancy/tenancy";
import { requirePractice } from "../guard";
import { ConsoleShell } from "../ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Interop — Meherr" };

const STATE_LABEL = {
  not_attempted: "never left",
  sent_no_response: "left, nothing came back",
  rejected_by_recipient: "refused by the recipient",
  acknowledged: "confirmed by the recipient",
} as const;

/**
 * One row's outcome cell.
 *
 * The unanswered one is visibly different, because it is the only one that needs somebody. Never
 * a dash and never a tick: W197's rule, and W244's refusal of a delivered boolean.
 */
function Outcome({ row }: { row: ExchangeRow }) {
  const unanswered = row.state === "sent_no_response";
  return (
    <>
      <span
        className={unanswered ? "font-medium text-amber-800" : "font-medium text-stone-900"}
        data-testid={`interop-state-${row.state}`}
      >
        {STATE_LABEL[row.state]}
      </span>
      <p className="mt-1 max-w-xl text-xs text-stone-500">{row.stateCopy}</p>
      <p
        className={unanswered ? "mt-1 max-w-xl text-xs text-amber-800" : "mt-1 max-w-xl text-xs text-stone-500"}
        data-testid={`interop-retry-${row.retry}`}
      >
        {row.retryCopy}
      </p>
    </>
  );
}

export default async function InteropPage() {
  const { email, record } = await requirePractice();
  const console_ = getConsole();
  if (!authorize(console_.memberships, email, record.practice.id, "view_dashboard").allowed) {
    redirect("/console");
  }

  // Practice-scoped as the QUERY — W123's rule, W209's finding.
  const view = interopConsoleView(record.practice.id);

  return (
    <ConsoleShell email={email}>
      <h1 className="text-2xl font-semibold tracking-tight">Interop</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">{INTEROP_CONSOLE_COPY.whatThisIs}</p>
      <p className="mt-1 text-xs text-stone-500">
        Practice <code>{record.practice.id}</code>. This tree exchanges nothing with any real
        system; every figure describes a synthetic run.
      </p>

      {view.state === "nothing_ever_attempted" ? (
        <section
          data-testid="interop-nothing-attempted"
          className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="font-medium text-amber-900">Nothing has been sent, and nothing tried</h2>
          <p className="mt-2 max-w-2xl text-sm text-amber-900">{view.copy}</p>
          <p className="mt-4 text-sm font-medium text-amber-900">
            What would have to be decided first
          </p>
          <ul className="mt-1 space-y-1 text-sm text-amber-900" data-testid="interop-blocked">
            {view.blocked.map((path) => (
              <li key={path.what}>
                {path.what} — waiting on {path.blockedBy.join(" and ")}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section data-testid="interop-counts" className="mt-8 grid gap-3 sm:grid-cols-4">
            {(
              [
                ["acknowledged", "confirmed by the recipient"],
                ["sent_no_response", "left, nothing came back"],
                ["rejected_by_recipient", "refused by the recipient"],
                ["not_attempted", "never left, so never recorded here"],
              ] as const
            ).map(([state, label]) => (
              <div key={state} className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="text-2xl font-semibold text-stone-900">{view.counts[state]}</p>
                <p className="mt-1 text-sm text-stone-600">{label}</p>
              </div>
            ))}
          </section>
          <p data-testid="interop-counts-note" className="mt-2 text-xs text-stone-500">
            {INTEROP_CONSOLE_COPY.countsAlwaysShown}
          </p>

          <table className="mt-8 w-full text-sm" data-testid="interop-table">
            <caption className="sr-only">
              Everything that left this practice, with what happened to each
            </caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-500">
                <th scope="col" className="pb-2 font-medium">
                  Sent
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Recipient
                </th>
                <th scope="col" className="pb-2 font-medium">
                  What happened
                </th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row) => (
                <tr
                  key={`${row.disclosure.disclosedAtIso}-${row.disclosure.recipientName}-${row.disclosure.kind}`}
                  className="border-t border-stone-100 align-top"
                >
                  <th scope="row" className="py-2 text-left font-normal text-stone-700">
                    {row.disclosure.disclosedAtIso}
                    <span className="block text-xs text-stone-500">
                      {row.disclosure.kind.replace(/_/g, " ")}
                    </span>
                  </th>
                  <td className="py-2 text-stone-700">{row.disclosure.recipientName}</td>
                  <td className="py-2">
                    <Outcome row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <section
        data-testid="interop-cannot-show"
        className="mt-10 rounded-xl border border-stone-200 bg-stone-50 p-6"
      >
        <h2 className="text-sm font-medium text-stone-900">What this page cannot tell you</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-stone-600">
          {view.cannotShow.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-2 border-t border-stone-200 pt-6 text-xs text-stone-500">
        <p data-testid="interop-not-delivered">
          {INTEROP_CONSOLE_COPY.sentNoResponseIsNotDelivered}
        </p>
        <p data-testid="interop-no-retry">{INTEROP_CONSOLE_COPY.noRetryControl}</p>
        <p data-testid="interop-no-patient">{INTEROP_CONSOLE_COPY.ledgerHoldsNoPatient}</p>
        {nothingCanBeSent() && (
          <p data-testid="interop-nothing-can-be-sent">
            There is no connection to any other system in this product, and no credential for one.
          </p>
        )}
      </section>
    </ConsoleShell>
  );
}

// W310: the founder's page — what exists, what is waiting, what one ruling releases.
//
// Every figure is read from `BUILD-STATE.md` and §4 of the plan at render time. Nothing on this
// page is typed: there is no list of gates here, no count of blocked units, and no sentence about
// a gate that §4 does not itself say. A written status page goes stale on the next firing.
//
// Copy discipline: this page is about BUILD STATUS. It holds no practice data, no patient data and
// nothing about anyone's care, and `FOUNDER_COPY` is linted for exactly that.

import {
  FOUNDER_COPY,
  builtSurface,
  outstandingRulings,
} from "@/founder/outstanding";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/console/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "What is waiting on you — Meherr" };

export default async function FounderPage() {
  // The session primitive directly, NOT `../guard`. `requireSession` lives beside `requirePractice`
  // in a module that resolves a practice, so importing it drags the whole console spine — domain,
  // engine, tenancy — onto a page that must reach none of them. W271 said so on the first run.
  const jar = await cookies();
  if (!verifySession(jar.get(SESSION_COOKIE)?.value)) redirect("/console/signin");

  const root = process.cwd();
  const built = builtSurface(root);
  const rulings = outstandingRulings(root);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{FOUNDER_COPY.title}</h1>
        <p className="text-stone-600">{FOUNDER_COPY.intro}</p>
        <p className="text-sm text-stone-500">{FOUNDER_COPY.noClinical}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{FOUNDER_COPY.builtHeading}</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg border border-stone-200 p-4">
            <dt className="text-sm text-stone-500">Units built</dt>
            <dd className="text-2xl font-semibold tabular-nums">{built.done}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-stone-200 p-4">
            <dt className="text-sm text-stone-500">Units waiting on a ruling</dt>
            <dd className="text-2xl font-semibold tabular-nums">{built.blocked}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-stone-200 p-4">
            <dt className="text-sm text-stone-500">Most recent unit</dt>
            <dd className="text-2xl font-semibold tabular-nums">{built.latestUnit}</dd>
            <dd className="text-sm text-stone-500">{built.latestAt}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{FOUNDER_COPY.blockedHeading}</h2>
        <p className="text-stone-600">{FOUNDER_COPY.noDecider}</p>

        <ol className="flex flex-col gap-6">
          {rulings.map((ruling) => (
            <li
              key={ruling.blocker}
              className="flex flex-col gap-3 rounded-lg border border-stone-200 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{ruling.blocker}</h3>
                <p className="text-sm text-stone-500 tabular-nums">
                  {ruling.waited.unitsSince} units built since {ruling.waited.sinceUnit}
                  {ruling.waited.sinceAt ? ` (${ruling.waited.sinceAt})` : ""}
                </p>
              </div>

              {ruling.gateText ? <p className="text-stone-700">{ruling.gateText}</p> : null}

              <p className="text-sm text-stone-500">
                {ruling.waited.kind === "standing"
                  ? FOUNDER_COPY.waitStanding
                  : FOUNDER_COPY.waitProposed}
              </p>

              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-stone-700">Who decides</p>
                <p className="text-stone-600">{ruling.whoDecides}</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-stone-700">
                  {FOUNDER_COPY.releasesHeading} ({ruling.releases.length})
                </p>
                <ul className="flex flex-col gap-2">
                  {ruling.releases.map((unit) => (
                    <li key={unit.id} className="text-sm text-stone-600">
                      <span className="font-medium tabular-nums text-stone-800">{unit.id}</span>{" "}
                      {unit.note.slice(0, 240)}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

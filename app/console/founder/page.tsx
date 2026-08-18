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
  blockedShape,
  builtSurface,
  founderDiff,
  gatesBlockingNothing,
  outstandingRulings,
} from "@/founder/outstanding";
import { RELEASE_PATHS, answerableByTheLoop } from "@/quality/blocked-surface";
import { SECOND_READING_COPY, sinceReading } from "@/founder/second-reading";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/console/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "What is waiting on you — Meherr" };

export default async function FounderPage({
  searchParams,
}: {
  // W322: the reading is carried in the LINK rather than stored. A saved snapshot of this page
  // would be a second copy of the ledger that can disagree with it, which is the class most of
  // this tree's registers exist to catch; a unit id in a URL has nothing to reconcile.
  searchParams: Promise<{ since?: string }>;
}) {
  // The session primitive directly, NOT `../guard`. `requireSession` lives beside `requirePractice`
  // in a module that resolves a practice, so importing it drags the whole console spine — domain,
  // engine, tenancy — onto a page that must reach none of them. W271 said so on the first run.
  const jar = await cookies();
  if (!verifySession(jar.get(SESSION_COOKIE)?.value)) redirect("/console/signin");

  const root = process.cwd();
  const built = builtSurface(root);
  const rulings = outstandingRulings(root);
  // W347: four things the tree already derived and this page did not show.
  const unblocking = gatesBlockingNothing(root);
  const shape = blockedShape(root);
  const diff = founderDiff(root);
  const disagreements = Object.values(diff).flat();
  const loopAnswers = answerableByTheLoop(RELEASE_PATHS);
  const since = (await searchParams).since;
  const reading = sinceReading(root, since ? { lastUnit: since } : null);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{FOUNDER_COPY.title}</h1>
        <p className="text-stone-600">{FOUNDER_COPY.intro}</p>
        <p className="text-sm text-stone-500">{FOUNDER_COPY.noClinical}</p>
      </header>

      {/* W322: three states, three sentences. An empty list here would tell a first-time reader
          that nothing has changed, about a period they have never seen. */}
      <section className="flex flex-col gap-3" data-testid="second-reading">
        <h2 className="text-xl font-semibold tracking-tight">{SECOND_READING_COPY.heading}</h2>
        {reading.kind === "first_reading" ? (
          <p className="text-stone-600" data-testid="reading-first">{SECOND_READING_COPY.firstReading}</p>
        ) : reading.kind === "unknown_unit" ? (
          <p className="text-stone-600" data-testid="reading-unknown">{SECOND_READING_COPY.unknownUnit}</p>
        ) : reading.quiet ? (
          <p className="text-stone-600" data-testid="reading-quiet">{SECOND_READING_COPY.quiet}</p>
        ) : (
          <div className="flex flex-col gap-2" data-testid="reading-since">
            <p className="text-sm text-stone-500">Measured from {reading.lastUnit}.</p>
            <p className="text-stone-700">
              {SECOND_READING_COPY.builtHeading}: {reading.built.map((b) => b.id).join(", ") || "none"}
            </p>
            <p className="text-stone-700">
              {SECOND_READING_COPY.blockedHeading}: {reading.blocked.map((b) => b.id).join(", ") || "none"}
            </p>
          </div>
        )}
      </section>

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

        {/* W347: the figure above is over every blocked ROW, and two of them are not week-units.
            The G5 correction read from the other end — a reader seeing one number cannot tell. */}
        <div className="flex flex-col gap-2" data-testid="blocked-shape">
          <h3 className="text-sm font-medium text-stone-700">{FOUNDER_COPY.shapeHeading}</h3>
          <p className="text-stone-600">{FOUNDER_COPY.shapeNote}</p>
          <p className="text-stone-700 tabular-nums" data-testid="shape-weeks">
            Week-units: {shape.weekUnits.length} ({shape.weekUnits.join(", ") || "none"})
          </p>
          <p className="text-stone-700 tabular-nums" data-testid="shape-other">
            Other rows: {shape.otherRows.length} ({shape.otherRows.join(", ") || "none"})
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{FOUNDER_COPY.blockedHeading}</h2>
        {/* W347: the claim was typed while `answerableByTheLoop` derived it and nothing read the
            derivation. Rendered, so the page cannot say the loop decides nothing while a path
            names it. */}
        <p className="text-stone-600" data-testid="who-decides-claim">
          {loopAnswers.length === 0 ? FOUNDER_COPY.noDecider : FOUNDER_COPY.loopAnswersSome}
        </p>

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

      {/* W347: the gates with NO rows behind them. A page organised by what is waiting cannot show
          these — there is nothing queued to list — and the plan has named them in prose at every
          horizon for six quarters without the founder's own page ever saying so. */}
      <section className="flex flex-col gap-4" data-testid="blocks-nothing">
        <h2 className="text-xl font-semibold tracking-tight">{FOUNDER_COPY.nothingBlockedHeading}</h2>
        <p className="text-stone-600">{FOUNDER_COPY.nothingBlockedIntro}</p>
        <ul className="flex flex-col gap-3">
          {unblocking.map((gate) => (
            <li
              key={gate.id}
              className="flex flex-col gap-1 rounded-lg border border-stone-200 p-4"
              data-testid="blocks-nothing-row"
            >
              <p className="font-semibold tracking-tight">{gate.id}</p>
              <p className="text-stone-700">{gate.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* W347: `founderDiff` has checked this page against its two documents since W310 and the
          page never showed the answer. Its own bound says a founder reading a page that is missing
          a row cannot know it is missing; now the page says whether anything is missing. */}
      <section className="flex flex-col gap-3" data-testid="agreement">
        <h2 className="text-xl font-semibold tracking-tight">{FOUNDER_COPY.agreementHeading}</h2>
        {disagreements.length === 0 ? (
          <p className="text-stone-600" data-testid="agreement-clean">{FOUNDER_COPY.agrees}</p>
        ) : (
          <ul className="flex flex-col gap-1" data-testid="agreement-dirty">
            {disagreements.map((item) => (
              <li key={item} className="text-stone-700">
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

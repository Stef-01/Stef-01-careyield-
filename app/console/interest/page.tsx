import { ConsoleShell } from "../ui";
import { requireSession } from "../guard";
import { listInterestSignups } from "@/interest/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community interest — CareYield" };

export default async function CommunityInterestPage() {
  const email = await requireSession();
  const signups = listInterestSignups();

  return (
    <ConsoleShell email={email}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">Demand evidence</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Community interest</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Unique, consented registrations from the Western Sydney community landing page.</p>
        </div>
        <a href="/api/interest/export" className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:border-stone-500">Download CSV</a>
      </div>

      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
        <span className="text-sm text-stone-500">Unique registrations</span>
        <strong className="mt-1 block text-4xl tracking-tight">{signups.length}</strong>
      </div>

      {signups.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">No registrations yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
          {signups.map((signup) => (
            <li key={signup.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto]">
              <div>
                <strong className="text-sm">{signup.name}</strong>
                <a href={`mailto:${signup.email}`} className="ml-2 text-sm text-stone-500 underline">{signup.email}</a>
                <p className="mt-2 text-sm text-stone-600">{signup.interests.join(" · ")}</p>
              </div>
              <time className="text-xs text-stone-500" dateTime={signup.createdAt}>{new Date(signup.createdAt).toLocaleString("en-AU")}</time>
            </li>
          ))}
        </ul>
      )}
    </ConsoleShell>
  );
}

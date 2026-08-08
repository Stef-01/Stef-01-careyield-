import Link from "next/link";
import { redirect } from "next/navigation";
import { getConsole } from "@/console/store";
import { requireSession } from "./guard";
import { ConsoleShell } from "./ui";

export const dynamic = "force-dynamic";

export default async function ConsoleHome() {
  const email = await requireSession();
  const state = getConsole();
  if (!state.practice) redirect("/console/onboarding");

  const rules = state.rulesConfig;
  const settings: Array<[string, string]> = [
    ["Minimum days since last visit", `${rules.minDaysSinceLastVisit} days`],
    ["Existing-booking block window", `${rules.futureBookingBlockDays} days`],
    ["Invitation cap per quarter", `${rules.maxInvitesPerQuarter}`],
    ["Usual GP only", rules.usualClinicianOnly ? "Yes" : "No"],
    ["Ongoing-care patients only", rules.chronicCareOnly ? "Yes" : "No"],
  ];

  return (
    <ConsoleShell email={email}>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{state.practice.name}</h1>
        <span className="text-sm text-stone-400">
          {state.practice.timezone} · holdout {Math.round(state.practice.holdoutRate * 100)}%
        </span>
      </div>

      <div className="mt-4 flex gap-4">
        <Link
          href="/console/dashboard"
          className="inline-block text-sm font-medium text-stone-700 underline hover:text-stone-900"
        >
          Incrementality dashboard
        </Link>
        <Link
          href="/console/usefulness"
          className="inline-block text-sm font-medium text-stone-700 underline hover:text-stone-900"
        >
          Usefulness audit
        </Link>
        <Link
          href="/console/ops"
          className="inline-block text-sm font-medium text-stone-700 underline hover:text-stone-900"
        >
          Admin ops
        </Link>
      </div>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-medium text-stone-900">Eligibility rules</h2>
          <span className="text-xs text-stone-400">version {state.rulesVersion}</span>
        </div>
        <dl className="divide-y divide-stone-100">
          {settings.map(([term, value]) => (
            <div key={term} className="flex justify-between py-2.5">
              <dt className="text-sm text-stone-500">{term}</dt>
              <dd className="text-sm font-medium text-stone-900">{value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/console/rules"
          className="mt-4 inline-block text-sm font-medium text-stone-700 underline hover:text-stone-900"
        >
          Edit rules
        </Link>
      </section>
    </ConsoleShell>
  );
}

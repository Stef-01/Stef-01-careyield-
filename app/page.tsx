// W23: public B2B landing page. Audience is general-practice owners and managers,
// never patients — copy is availability/measurement positioning only, with zero
// regulated therapeutic advertising. All copy lives in src/compliance/landing-copy
// and is lint-gated (src/compliance/landing.test.ts).

import Link from "next/link";
import { LANDING_COPY as C } from "@/compliance/landing-copy";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-stone-900">
      <header className="border-b border-stone-100">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">CareYield</span>
          <div className="flex items-center gap-6 text-sm text-stone-600">
            <a href="#how" className="hover:text-stone-900">{C.nav.product}</a>
            <a href="#measurement" className="hover:text-stone-900">{C.nav.measurement}</a>
            <Link href="/console/signin" className="font-medium text-stone-900 hover:underline">
              {C.nav.cta}
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-400">{C.hero.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {C.hero.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-stone-600">{C.hero.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="rounded-lg bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-700"
            >
              {C.hero.primaryCta}
            </Link>
            <Link
              href="/console/signin"
              className="rounded-lg border border-stone-300 px-6 py-3 font-medium text-stone-800 hover:border-stone-500"
            >
              {C.hero.secondaryCta}
            </Link>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-stone-100 py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight">{C.problem.heading}</h2>
          <p className="mt-4 max-w-2xl text-stone-600">{C.problem.body}</p>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-stone-100 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {C.steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-stone-200 p-6">
                <div className="text-sm font-semibold text-stone-400">{i + 1}</div>
                <h3 className="mt-2 font-medium text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Measurement */}
        <section id="measurement" className="border-t border-stone-100 py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight">{C.measurement.heading}</h2>
          <p className="mt-4 max-w-2xl text-stone-600">{C.measurement.body}</p>
          <ul className="mt-6 flex flex-col gap-2">
            {C.measurement.points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-stone-700">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-900" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance */}
        <section className="border-t border-stone-100 py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight">{C.compliance.heading}</h2>
          <p className="mt-4 max-w-2xl text-stone-600">{C.compliance.body}</p>
        </section>

        {/* CTA */}
        <section className="border-t border-stone-100 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">{C.cta.heading}</h2>
          <p className="mt-3 max-w-xl text-stone-600">{C.cta.body}</p>
          <Link
            href="/demo"
            className="mt-6 inline-block rounded-lg bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-700"
          >
            {C.cta.button}
          </Link>
        </section>
      </main>

      <footer className="border-t border-stone-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-8 text-sm text-stone-400">
          <span>{C.footer.tagline}</span>
          <span>{C.footer.note}</span>
        </div>
      </footer>
    </div>
  );
}

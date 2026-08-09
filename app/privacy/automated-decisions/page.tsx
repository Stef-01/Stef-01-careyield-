// W33: ADM-transparency statement (Privacy Act amendments, in force December 2026):
// a plain-English public page stating what CareYield automates, what it never
// automates, and the human controls — mirrored by the code (eligibility engine,
// founder gates, ops kill-switch).

export const metadata = { title: "Automated decisions — CareYield" };

export default function AutomatedDecisionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        How CareYield uses automated decision-making
      </h1>
      <p className="mt-4 text-sm leading-6 text-stone-500">
        This statement is published to meet the Privacy Act&apos;s automated-decision-making
        transparency requirements (in force December 2026) and is kept in step with the
        software itself.
      </p>

      <div className="mt-10 space-y-8 text-stone-700">
        <section>
          <h2 className="text-lg font-medium text-stone-900">What is automated</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>
              <strong>Eligibility filtering.</strong> Deterministic, practice-configured rules
              decide who may be offered an available appointment: recency of last visit,
              existing bookings, contact-frequency caps, consent and opt-out status. The rules
              are versioned and every exclusion is recorded with its reason.
            </li>
            <li>
              <strong>Ordering within the eligible group.</strong> Eligible patients are ranked
              by simple, explainable factors (ongoing-care flag, time since last visit) to
              decide who is offered a slot first.
            </li>
            <li>
              <strong>Send mechanics.</strong> Batch sizes, offer expiry when a session fills,
              and pausing when safety thresholds trip (opt-out rates, complaints).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-900">What is never automated</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>No clinical decision of any kind — no diagnosis, triage, or symptom assessment.</li>
            <li>
              No decision to deny care: not being sent an availability message never affects a
              patient&apos;s ability to book through the practice as usual.
            </li>
            <li>No inference from clinical notes, test results, or diagnoses — we do not process them.</li>
            <li>No automated re-enabling of contact after a patient opts out. Opt-out is permanent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-900">Human controls</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>The practice configures and can change every eligibility rule at any time.</li>
            <li>Practice staff can pause all sending instantly with one switch.</li>
            <li>
              A patient can stop all messages by replying STOP, and can ask their practice to
              access or delete the information CareYield holds.
            </li>
            <li>Every automated action is written to an audit log the practice can inspect.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

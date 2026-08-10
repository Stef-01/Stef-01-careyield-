// W33, revised at W102: ADM-transparency statement (Privacy Act 1988, APP 1.7, commencing
// 10 December 2026) — a plain-English public page stating what Meherr automates, what it never
// automates, and the human controls.
//
// W102 found this page materially out of date and fixed it here rather than only reporting it.
// Two things had gone wrong across Year 2:
//
//   1. It said "we do not process diagnoses". That became FALSE when W57 began reading recorded
//      condition flags from the practice's system and W92–W95 began reading referral records.
//      Nothing is inferred from symptoms — that boundary held — but "we do not process them" is
//      a claim about processing, not inference, and a published privacy statement that is wrong
//      about what data you handle is the sharpest kind of failure: it is the document a
//      regulator reads first.
//   2. It described three automated decisions. Year 2 added five more, including the one most
//      likely to matter to a patient — W84 can put a DIFFERENT GP's name on the offer than the
//      patient's usual one.
//
// Keep this page in the same commit as any change to what the software decides. The list below
// is written to be checkable against the code, not to be reassuring.

export const metadata = { title: "Automated decisions — Meherr" };

export default function AutomatedDecisionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        How Meherr uses automated decision-making
      </h1>
      <p className="mt-4 text-sm leading-6 text-stone-500">
        This statement is published to meet the Privacy Act&apos;s automated-decision-making
        transparency requirements, which commence on 10 December 2026, and is kept in step with
        the software itself. Last reviewed 10 August 2026.
      </p>

      <div className="mt-10 space-y-8 text-stone-700">
        <section>
          <h2 className="text-lg font-medium text-stone-900">What information is used</h2>
          <p className="mt-3 text-sm leading-6">
            Meherr reads what your practice has already recorded about you: when you last
            attended, appointments you have booked, whether you have opted out, the ongoing-care
            conditions your practice has flagged on your record, and referrals your practice has
            written. Some of that is health information. It is used to decide who to invite to an
            appointment and when — never to work anything out about your health.
          </p>
          <p className="mt-3 text-sm leading-6">
            Meherr does not read your consultation notes, test results or clinical
            correspondence, and does not receive them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-900">What is automated</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>
              <strong>Eligibility filtering.</strong> Deterministic, practice-configured rules
              decide who may be offered an available appointment: recency of last visit, existing
              bookings, contact-frequency caps, consent and opt-out status. The rules are
              versioned and every exclusion is recorded with its reason.
            </li>
            <li>
              <strong>Who is on a register.</strong> Where your practice runs a register for an
              ongoing condition, membership is taken from the flag your practice has already
              recorded, or added by the practice itself. It is never worked out from symptoms,
              medicines or anything else about you.
            </li>
            <li>
              <strong>When a scheduled review comes round.</strong> Against the interval your
              practice has set for that register — a calendar calculation, not a judgement about
              whether you need to be seen.
            </li>
            <li>
              <strong>Ordering within the eligible group.</strong> Eligible patients are ranked by
              simple, explainable factors (ongoing-care flag, time since last visit) to decide who
              is offered a slot first.
            </li>
            <li>
              <strong>Which GP the offer names.</strong> An offer normally names your usual GP. If
              your practice has turned this on for a particular register, and your usual GP does
              not meet the threshold that practice has set, the offer may name a different GP at
              the same practice instead. It never sends you outside your own practice, it never
              moves you when your usual GP does meet the threshold, and every such decision is
              recorded with its reason. Your practice sets a limit on how much of this can happen
              at all.
            </li>
            <li>
              <strong>Decisions not to contact you.</strong> Just as often, the automated decision
              is silence: if your practice already has its own recall running for you, if you have
              already told the practice why something did not go ahead, if you have had as many
              invitations as your practice allows, or if the appointment would be gone before the
              hours you agreed to be contacted in.
            </li>
            <li>
              <strong>Send mechanics.</strong> Batch sizes, offer expiry when a session fills, and
              pausing when safety thresholds trip (opt-out rates, complaints).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-900">What is never automated</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>No clinical decision of any kind — no diagnosis, triage, or symptom assessment.</li>
            <li>
              No decision to deny care: not being sent an availability message never affects your
              ability to book through the practice as usual.
            </li>
            <li>
              No inference about you. Nothing is concluded from your details that you or your
              practice did not record. Where a reason for something is held, somebody said it.
            </li>
            <li>
              No ranking of patients by need, risk or urgency, and no list of who is most at risk.
              Meherr decides who has an appointment offered to them, never who needs one.
            </li>
            <li>
              Nothing you are sent reveals why you were selected. A message prompted by a register
              or by a referral is word for word the same as any other appointment invitation.
            </li>
            <li>No automated re-enabling of contact after you opt out. Opt-out is permanent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-900">Human controls</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>The practice configures and can change every eligibility rule at any time.</li>
            <li>
              Every register, and the routing described above, is off unless your practice turns
              it on.
            </li>
            <li>Practice staff can pause all sending instantly with one switch.</li>
            <li>
              Your practice approves the exact wording of every message before any of it can be
              sent, and an edit of a single character withdraws that approval.
            </li>
            <li>
              You can stop all messages by replying STOP, and can ask your practice to access or
              delete the information Meherr holds.
            </li>
            <li>Every automated action is written to an audit log the practice can inspect.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

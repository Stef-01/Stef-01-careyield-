// W272: the access export, scoped to the practice that is reading it.
//
// Q21's security review found that `/console/privacy` renders `JSON.stringify(exportForPatient(id))`
// verbatim, and `exportForPatient` is deliberately unscoped. That was defensible while the payload
// was one practice's booking rows and complaints. W266 added the GP-to-GP referral rail to it —
// correctly, because erasure reached a store access did not — and the rail holds every practice's
// referrals, including the referring clinician's free-text narrative and their name. So an
// operator with `edit_rules` at ONE practice could type any patient identifier and read clinical
// text a GP at a different practice wrote about that patient.
//
// THE UNSCOPED DERIVATION IS RIGHT AND STAYS. `exportForPatient` is registered in W209's
// `STORE_READS` as `patient_keyed` on the argument that "the answer to 'what do you hold about me'
// is every practice's holding" — and that is true, of the PRODUCT. The defect is that the argument
// is about the SUBJECT'S entitlement and the reader on that page is a practice's staff member. One
// function was answering two different questions, and only one of them had been asked.
//
// So the split is by reader rather than by store: `exportForPatient` keeps answering the product's
// question and keeps its parity with `deletePatientEverywhere`, which is what W266 and W137 built
// and what an erasure sweep needs. This adds the console's question — what does THIS PRACTICE hold
// about this person — and the page asks that one.
//
// PARTY, NOT AUTHOR, DECIDES A REFERRAL. A referral has two practices and both are entitled to it:
// the sender wrote it and the receiver was asked to act on it. Scoping to `fromPracticeId` alone
// would hide from a receiving practice the document it is currently working from. So the rule is
// "this practice is named on the referral", and every act, event and return report follows the
// document rather than being scoped again — a return report belongs to the referral, which is
// W140's rule for `returnFor` and is inherited rather than re-decided.
//
// AND THE COUNT OF WHAT WAS DROPPED IS NOT REPORTED, WHICH IS THE OPPOSITE OF THIS TREE'S USUAL
// RULE AND IS DELIBERATE. Everywhere else, silently narrowing a result is the defect — W179 split
// a zero into two meanings for exactly that reason. Here, telling practice A "three referrals were
// withheld" would disclose that the patient is known to another practice, which is the fact being
// protected. The narrowing is stated on this module and in the copy, and the number is not.
//
// `held` IS RE-DERIVED FROM THE SCOPED CONTENTS, not carried. Carrying it would make the page say
// "records are held" above an empty document — the exact inverse of the defect W266 fixed, where
// the payload held records under a heading that said nothing was.

import type { ComplaintRecord } from "@/complaints/workflow";
import { getPrivacy, exportForPatient, type ConsoleExport } from "./store";
import { isSuppressed } from "./privacy";
import type { PatientReferrals } from "@/referrals/store";

/** One practice's answer to "what do you hold about this person". */
export interface ScopedConsoleExport extends Omit<ConsoleExport, "held"> {
  /** The practice this answer is for. Stamped, so a payload cannot be read out of context. */
  practiceId: string;
  /** Re-derived from what survived the scoping. See the module note. */
  held: boolean;
}

/**
 * The referral ids this practice is named on.
 *
 * Read off the documents the patient's bundle already contains rather than by asking the rail
 * again, so the scoping cannot answer about a referral the export never held.
 */
function referralIdsHere(referrals: PatientReferrals, practiceId: string): Set<string> {
  const ids = new Set<string>();
  for (const document of referrals.documents) {
    if (document.fromPracticeId === practiceId || document.toPracticeId === practiceId) {
      ids.add(document.referralId);
    }
  }
  // A return report names both practices too, and can exist for a referral whose document has
  // already been retained away. Missing it would drop a record this practice is entitled to.
  for (const report of referrals.returns) {
    if (report.fromPracticeId === practiceId || report.toPracticeId === practiceId) {
      ids.add(report.referralId);
    }
  }
  return ids;
}

function scopeReferrals(referrals: PatientReferrals, practiceId: string): PatientReferrals {
  const mine = referralIdsHere(referrals, practiceId);
  return {
    documents: referrals.documents.filter((d) => mine.has(d.referralId)),
    acts: referrals.acts.filter((a) => mine.has(a.referralId)),
    events: referrals.events.filter((e) => mine.has(e.referralId)),
    returns: referrals.returns.filter((r) => mine.has(r.referralId)),
  };
}

/**
 * What one practice holds about one patient.
 *
 * Built from the product-level export and then narrowed, rather than by re-reading every store
 * with a practice argument: the narrowing is then provably a SUBSET of what the unscoped answer
 * holds, and a store added to `exportForPatient` tomorrow arrives here as an unscoped field that
 * this unit's test fails on rather than as a field nobody remembered to scope.
 */
export function consoleExportFor(
  patientId: string,
  practiceId: string,
  nowIso: string,
): ScopedConsoleExport {
  const whole = exportForPatient(patientId, nowIso);

  const invitations = whole.invitations.filter((i) => String(i.practiceId) === practiceId);
  const appointments = whole.appointments.filter((a) => String(a.practiceId) === practiceId);
  const appointmentIds = new Set(appointments.map((a) => String(a.id)));
  // Outcomes carry no practice of their own; they belong to the appointment, so they follow it.
  const outcomes = whole.outcomes.filter((o) => appointmentIds.has(String(o.appointmentId)));
  const auditEvents = whole.auditEvents.filter((e) => String(e.practiceId) === practiceId);
  const complaints = whole.complaints.filter(
    (c: ComplaintRecord) => String(c.practiceId) === practiceId,
  );
  const referrals = scopeReferrals(whole.referrals, practiceId);

  const heldReferrals =
    referrals.documents.length +
    referrals.acts.length +
    referrals.events.length +
    referrals.returns.length;

  return {
    patientId,
    practiceId,
    generatedAt: whole.generatedAt,
    invitations,
    appointments,
    auditEvents,
    outcomes,
    complaints,
    referrals,
    // Read from the live suppression list rather than carried, so this stays true if the unscoped
    // export's own derivation of it ever changes.
    suppressed: isSuppressed(getPrivacy().suppressions, patientId),
    held:
      invitations.length + appointments.length + auditEvents.length + outcomes.length > 0 ||
      complaints.length > 0 ||
      heldReferrals > 0,
  };
}

/** Kept beside the export so the page cannot describe the scoping in words of its own. */
export const SCOPED_EXPORT_NOTE =
  "This is what this practice holds about this person. Records held by another practice are not shown here, and are not counted — saying how many there were would itself say that this person is known elsewhere.";

/**
 * Ways of fixing this that would have been worse, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly widening the export again.
 */
export const REFUSED_SCOPING_SHAPES: Readonly<Record<string, string>> = {
  scoping_the_unscoped_export:
    "Adding a practice argument to `exportForPatient` itself. It is the product's answer and it is what `deletePatientEverywhere` is checked against — W266 added the referral rail precisely so access and erasure could not disagree, and a practice filter there would break that parity and reintroduce the defect it fixed. The reader's question is a different question and gets a different function.",
  counting_what_was_withheld:
    "Reporting 'three records held elsewhere'. Everywhere else in this tree a silently narrowed result is the defect, and here it is the fix: the count would disclose that the patient is known to another practice, which is the fact being protected. The narrowing is stated on the module and in the copy; the number is not.",
  scoping_by_author:
    "Keeping only referrals this practice SENT. Both practices are named on a referral and both are entitled to it — the receiving practice is working from the document — so scoping by `fromPracticeId` would hide from a practice the referral it is currently acting on.",
  re_reading_every_store_with_a_practice:
    "Building the scoped answer from scratch against each store. It would be a second derivation of 'what is held about this patient', free to drift from the unscoped one — which is the two-copies defect W266 removed from the referral rail one week earlier. Narrowing the product's answer makes the scoped one a provable subset.",
  carrying_held_across:
    "Reusing the unscoped `held`. The page renders the document only when `held` is true, so carrying it would print 'records are held' above an empty export — the exact inverse of the defect W266 fixed, where records sat under a heading saying nothing was held.",
  fixing_it_in_the_page:
    "Filtering inside `page.tsx`. A projection that lives in a render function is one no test reaches without rendering, and the next surface that needs an export would write the filter again — differently.",
};

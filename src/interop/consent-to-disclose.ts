// W243: may this leave, and who said so.
//
// W239 built the record of what left and was explicit that it is EVIDENCE, NEVER PERMISSION —
// because a ledger consulted for permission makes a gap in the ledger into an authorisation. This
// is the permission, and it is a separate module for exactly that reason.
//
// THE FAILURE THIS UNIT GUARDS AGAINST IS NOT A DISCLOSURE WITH NO CONSENT. That one is obvious,
// somebody notices, and a branded type stops it in an afternoon. The failure is A DISCLOSURE
// CARRYING SOMEBODY ELSE'S CONSENT, OR A CONSENT FOR SOMETHING ELSE — a patient who agreed their
// summary could go to their new practice, and whose record goes to a commissioner under that
// agreement. It has a consent record attached, it passes every "is there a consent" check, and it
// is a disclosure the patient did not agree to. So the brand is not minted against a PATIENT and
// then applied to a disclosure: `AuthorisedDisclosure` CONTAINS the disclosure it authorises, and
// there is no way to hold one and swap the payload. W227's rule — an answer that does not say
// what it rests on — at the boundary where the answer is "yes, send it".
//
// A CONSENT IS READ NARROWLY AND A WITHDRAWAL BROADLY, because the two errors are not symmetric.
// Reading a consent one class too wide discloses a record to somebody the patient never named;
// reading a withdrawal one class too wide sends a practice back to ask again. So a consent must
// match the recipient class, the kind, the practice and the period, and a withdrawal for a patient
// withdraws everything recorded for that patient at that practice.
//
// SILENCE IS NEVER CONSENT (W135) AND NO TIMEOUT GRANTS IT (W134). Both inherited rather than
// restated, and the second one is subtler than it looks. Writing its test is what found the honest
// form of it: consent is NOT monotone in time, because asking "was this authorised on the day it
// was sent" replays a past date, and a consent recorded in May makes an April question answer
// `not_recorded` and a June one answer `given`. The rule is not "the verdict never improves"; it
// is that NO ELAPSED TIME AFTER THE LAST RECORDED ACT MOVES A VERDICT TOWARDS `given`. That is
// what W134's no-timeout rule actually says, it is checkable, and the loose version would have
// been a test that passed while forbidding the wrong thing.
//
// THE VERDICTS ARE FIVE, AND `out_of_scope` IS THE ONE THAT EARNS ITS KEEP. Silence and a consent
// that does not cover this disclosure are opposite instructions to the practice — one means ask
// the patient, the other means you already did and this is not what they said — and a model that
// returned "no consent" for both would hide the case where somebody is about to argue that the
// form on file covers it. It names which part did not match, because "out of scope" is dismissed
// and "they agreed to their new practice, not to a commissioner" is not.
//
// THE SUBJECTS STAY OUT OF THE LEDGER. W239's row deliberately has no patient on it — its
// `fact_of_sending_only` mode holds no patient identifier, and that is the argument its record
// class rests on. This unit needs the patients, so the authorisation holds them and the ledger row
// does not. There is deliberately no function here that writes a subject into a `Disclosure`, and
// a test asserts the authorisation's subjects cannot reach a rendered ledger row.
//
// FOUNDER GATE (plan §4): no consent is shipped and there is no store. Real recorded consents are
// statements by real patients; G9 is unratified, nothing has ever been disclosed, and the acts are
// parameters rather than state. The store is W202's, and W202 is blocked.

import type { PatientId, PracticeId } from "@/domain/types";
import type { Disclosure, DisclosureKind, RecipientClass } from "./disclosure-ledger";

/** How the consent reached the practice. Declared, because "we have it on file" is not a channel. */
export type ConsentChannel =
  | "signed_form"
  | "recorded_in_consultation"
  | "patient_portal_confirmation";

/**
 * What a patient agreed to, in the four dimensions a disclosure has.
 *
 * All four are required. A consent that does not say WHO it may go to is a consent to disclosure
 * in general, which is not a thing a patient can meaningfully give and not a thing this model will
 * represent.
 */
export interface ConsentScope {
  practiceId: PracticeId;
  recipientClass: RecipientClass;
  kind: DisclosureKind;
  /** The period of the patient's record they agreed could be disclosed. */
  coversFromIso: string;
  coversToIso: string;
}

interface ActBase {
  patientId: PatientId;
  practiceId: PracticeId;
  atIso: string;
  /** Who recorded it. W119's rule: an assertion has somebody behind it. */
  recordedBy: string;
}

export type ConsentAct =
  | (ActBase & {
      act: "given";
      scope: ConsentScope;
      channel: ConsentChannel;
      /**
       * When it stops being in force, or `null` for no end date.
       *
       * Required and nullable rather than optional, so a perpetual consent is something somebody
       * WROTE rather than something they left out. An omitted expiry that defaults to forever is
       * the quietest way to build a permanent permission.
       */
      expiresAtIso: string | null;
    })
  /**
   * A withdrawal, which is deliberately unscoped.
   *
   * It withdraws everything recorded for this patient at this practice. Narrowing a withdrawal to
   * the scope it names would leave a patient who said "stop sharing my records" still consented
   * for the three scopes they did not think to mention.
   */
  | (ActBase & { act: "withdrawn"; reason: string });

export type ConsentVerdict =
  /** A matching consent, recorded, in force at the moment asked about. */
  | "given"
  /** The patient withdrew. Broadly — see the module note. */
  | "withdrawn"
  /** A matching consent was given and has passed its end date. Not the same as never given. */
  | "expired"
  /** A consent exists for this patient and does not cover THIS disclosure. */
  | "out_of_scope"
  /** Nothing is recorded. Silence, reported as silence. */
  | "not_recorded";

/** Which dimension of the scope failed, so `out_of_scope` cannot be dismissed as a technicality. */
export type ScopeMismatch =
  | "different_practice"
  | "different_recipient_class"
  | "different_kind"
  | "period_not_covered";

export const SCOPE_MISMATCH_COPY: Record<ScopeMismatch, string> = {
  different_practice:
    "The consent on file was given to a different practice. A patient agreeing that one practice may disclose their record has not agreed that another may.",
  different_recipient_class:
    "The consent on file names a different kind of recipient. Agreeing that a summary may go to the practice taking over your care is not agreeing that your record may go to a commissioner or a payer.",
  different_kind:
    "The consent on file covers a different kind of disclosure. A referral document about one episode and a bundle of a patient's resources are not the same disclosure with different formatting.",
  period_not_covered:
    "The disclosure covers a period the consent does not. The consent is real and it is not a consent to this — W205's shape, where a true record under the wrong period reads as complete.",
};

export const CONSENT_VERDICT_COPY: Record<ConsentVerdict, string> = {
  given: "This patient recorded their agreement to this disclosure, and it is in force.",
  withdrawn:
    "This patient withdrew their agreement. It does not matter what was recorded before that, and nothing since restores it except the patient agreeing again.",
  expired:
    "This patient's agreement has passed its end date. That is not a refusal and it is not silence — they agreed once, and the agreement had an end. Ask them again.",
  out_of_scope:
    "This patient recorded an agreement, and it is not an agreement to this. Sending under it would be a disclosure they did not make, with a consent record attached that makes it look checked.",
  not_recorded:
    "Nothing is recorded for this patient. Nothing is being read into that: an absent answer is not agreement, and no amount of time turns it into one.",
};

/**
 * The verdict for one patient against one intended disclosure, at one moment.
 *
 * `asAtIso` is required rather than defaulted to now, because "is this authorised" and "was this
 * authorised when it was sent" are different questions and a default would silently answer the
 * first when somebody asked the second.
 */
export interface ConsentDecision {
  patientId: PatientId;
  verdict: ConsentVerdict;
  /** Populated only for `out_of_scope`, and it names which dimensions failed. */
  mismatches: readonly ScopeMismatch[];
  /** The act the verdict rests on, so the answer says what it rests on. Null when nothing does. */
  restsOn: ConsentAct | null;
  copy: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function mismatchesFor(scope: ConsentScope, want: ConsentScope): ScopeMismatch[] {
  const out: ScopeMismatch[] = [];
  if (scope.practiceId !== want.practiceId) out.push("different_practice");
  if (scope.recipientClass !== want.recipientClass) out.push("different_recipient_class");
  if (scope.kind !== want.kind) out.push("different_kind");
  // The consent must cover the WHOLE requested period. A consent covering half of it is a consent
  // to half a disclosure, and there is no such disclosure — this one either goes or it does not.
  if (
    !ISO_DATE.test(scope.coversFromIso) ||
    !ISO_DATE.test(scope.coversToIso) ||
    want.coversFromIso < scope.coversFromIso ||
    want.coversToIso > scope.coversToIso
  ) {
    out.push("period_not_covered");
  }
  return out;
}

/**
 * Decide for one patient.
 *
 * Reads the acts in recorded order and takes the LAST word rather than the most convenient one. A
 * withdrawal after a consent wins; a consent after a withdrawal wins too, because a patient may
 * change their mind back and refusing to let them would be this software overriding them.
 */
export function consentDecision(
  patientId: PatientId,
  want: ConsentScope,
  acts: readonly ConsentAct[],
  asAtIso: string,
): ConsentDecision {
  // Sorted by when, and TIED ACTS PUT THE WITHDRAWAL LAST. W167's fold register caught this: a
  // date-only `atIso` makes a consent and a withdrawal recorded on the same day indistinguishable,
  // `Array.prototype.sort` is stable, and the answer would then fall back to whatever order the
  // caller's array happened to be in — which is to say, to a store. The tie is not academic: it
  // decides between `given` and `withdrawn`, the most consequential pair here. Resolving it
  // towards the withdrawal is not a coin-toss made consistent, it is this module's own rule —
  // a consent is read narrowly and a withdrawal broadly — and W188 resolves a same-day join and
  // leave the same way for the same reason.
  const mine = acts
    .filter((a) => a.patientId === patientId && a.practiceId === want.practiceId)
    .filter((a) => a.atIso <= asAtIso)
    .slice()
    .sort(
      (a, b) =>
        a.atIso.localeCompare(b.atIso) ||
        Number(a.act === "withdrawn") - Number(b.act === "withdrawn"),
    );

  const decide = (
    verdict: ConsentVerdict,
    restsOn: ConsentAct | null,
    mismatches: readonly ScopeMismatch[] = [],
  ): ConsentDecision => ({
    patientId,
    verdict,
    mismatches,
    restsOn,
    copy: CONSENT_VERDICT_COPY[verdict],
  });

  const last = mine.at(-1);
  if (!last) return decide("not_recorded", null);
  if (last.act === "withdrawn") return decide("withdrawn", last);

  // The last act is a consent. Everything below is about THAT consent — an older one that happens
  // to match is not resurrected, because the patient's most recent statement is their statement.
  const mismatches = mismatchesFor(last.scope, want);
  if (mismatches.length > 0) return decide("out_of_scope", last, mismatches);
  if (last.expiresAtIso !== null && last.expiresAtIso <= asAtIso) return decide("expired", last);
  return decide("given", last);
}

declare const authorisedBrand: unique symbol;

/**
 * A disclosure that may leave, and the consent it leaves under.
 *
 * The brand carries THE DISCLOSURE rather than sitting beside it. An authorisation obtained for
 * one disclosure and applied to another is the failure this module exists for — it passes every
 * "is there a consent" check and is a disclosure nobody agreed to — and it is unrepresentable
 * here, because there is no authorisation that is not of a specific disclosure.
 */
export interface AuthorisedDisclosure {
  readonly [authorisedBrand]: true;
  readonly disclosure: Disclosure;
  /** Whose records are in it. Held HERE and deliberately not on the ledger row — see the note. */
  readonly subjects: readonly PatientId[];
  /** One per subject, every one `given`. The authorisation says what it rests on. */
  readonly restsOn: readonly ConsentDecision[];
}

export interface AuthorisationRefused {
  authorised: false;
  /** Every subject that did not consent, with the reason. Named, because a count is dismissed. */
  refusals: readonly ConsentDecision[];
  copy: string;
}

export type AuthorisationResult =
  | { authorised: true; authorisation: AuthorisedDisclosure }
  | AuthorisationRefused;

/**
 * The consent scope a disclosure requires, read off the disclosure itself.
 *
 * `ConsentScope` and `Disclosure` carry the same four dimensions — practice, recipient class,
 * kind, period — which is why the scope was derivable all along and why passing it separately was
 * never a capability, only a way to disagree. Exported so a caller can SHOW a patient what they
 * are being asked to agree to, which is the one legitimate use of a scope on its own.
 */
export function scopeOfDisclosure(disclosure: Disclosure): ConsentScope {
  return {
    practiceId: disclosure.practiceId as ConsentScope["practiceId"],
    recipientClass: disclosure.recipientClass,
    kind: disclosure.kind,
    coversFromIso: disclosure.periodFromIso,
    coversToIso: disclosure.periodToIso,
  };
}

/**
 * The only way to obtain an `AuthorisedDisclosure`.
 *
 * ALL SUBJECTS OR NONE. A disclosure whose unconsented subjects were quietly dropped is a
 * different disclosure from the one the operator asked to send, it looks complete at both ends,
 * and nobody finds out — W205's rule, and the reason the refusal names the patients instead: the
 * practice holds those identities already and "ask these three people" is the actionable sentence.
 */
export function authoriseDisclosure(
  disclosure: Disclosure,
  subjects: readonly PatientId[],
  acts: readonly ConsentAct[],
  asAtIso: string,
): AuthorisationResult {
  // DERIVED, NEVER PASSED. W247 found this taking the wanted scope as its own parameter and never
  // checking it described `disclosure` — so a caller who built the scope from a template, from a
  // previous send, or from a constant obtained a genuine brand-carrying authorisation whose
  // consent had been checked against a recipient, kind or period the disclosure did not have. It
  // passed every "is there a consent" check and was a disclosure nobody agreed to, which is the
  // exact sentence this module's own note calls unrepresentable. It was representable, and it was
  // one argument away. Deriving removes the parameter rather than validating it: a check somebody
  // can skip by passing the wrong thing is weaker than having nothing to pass.
  const want = scopeOfDisclosure(disclosure);
  const decisions = subjects.map((s) => consentDecision(s, want, acts, asAtIso));
  const refusals = decisions.filter((d) => d.verdict !== "given");
  if (subjects.length === 0) {
    // A disclosure of nobody's records is not a disclosure everybody consented to. Vacuous truth
    // is how an empty subject list becomes a general authorisation.
    return {
      authorised: false,
      refusals: [],
      copy: "This disclosure names no patients. An empty list is not everybody agreeing; it is nobody having been asked, and it must not authorise anything.",
    };
  }
  if (refusals.length > 0) {
    return {
      authorised: false,
      refusals,
      copy: `This disclosure is not being sent. ${refusals.length} of ${subjects.length} patient(s) in it have not agreed to it: ${refusals
        .map((r) => `${r.patientId} — ${CONSENT_VERDICT_COPY[r.verdict]}`)
        .join(" ")}`,
    };
  }
  return {
    authorised: true,
    authorisation: { disclosure, subjects: [...subjects], restsOn: decisions } as unknown as AuthorisedDisclosure,
  };
}

/**
 * Ways of manufacturing a consent, each refused with its reason.
 *
 * Data rather than a comment — W196's shape — so a later unit must DELETE a stated refusal rather
 * than quietly add a branch. The first one is not hypothetical: this tree already holds
 * `patient.smsConsent`, and reusing it here is one line.
 */
export const REFUSED_CONSENT_SOURCES: Readonly<Record<string, string>> = {
  a_scope_that_does_not_describe_the_disclosure:
    "Checking consent against a scope handed in beside the disclosure rather than read off it. W247 found this module doing exactly that: `authoriseDisclosure` took a `want` parameter and never compared it with the disclosure it was authorising, so a scope built from a template or a previous send produced a real authorisation for a recipient, kind or period nobody had agreed to — and it carried a consent record, which is what made it look checked. The scope is derived now, so there is nothing to disagree with.",
  reusing_sms_consent:
    "Reading `patient.smsConsent` as consent to disclose. It is ONE LINE and it is already in this tree, which is why it is listed first. Agreeing to receive a text message about an appointment is not agreeing that your medical record may be sent to a commissioner, a payer or another practice, and the two would be indistinguishable in the ledger afterwards.",
  silence_after_a_request:
    "Treating no reply to a consent request as agreement. W135's rule at the boundary where it costs the most: an absent answer is an absent answer, and the thing that makes this tempting is that the request went out, which feels like the practice did its part.",
  an_opt_out_window:
    "Telling patients they may object by a date and disclosing those who did not. It is silence with a deadline attached, and the deadline is what makes it look like a process rather than an assumption.",
  a_timeout_that_ripens:
    "Any rule under which elapsed time turns a non-consent into a consent. W134's no-timeout rule, which this module holds to the letter — no amount of time after the last recorded act moves a verdict towards `given`, and a test sweeps dates forward to prove it.",
  the_practice_consenting_for_the_patient:
    "A practice recording its own agreement on a patient's behalf. The practice is the discloser; a discloser who can supply the consent is not being gated by one.",
  a_prior_disclosure_as_precedent:
    "Reading last quarter's disclosure as authority for this one. It is W239's gap-as-authorisation failure arriving from the other side: the ledger would become the source of permission, and the ledger is evidence.",
  broad_consent_at_registration:
    "A form signed at registration covering any disclosure to anyone forever. Every dimension this model requires — recipient, kind, practice, period — exists so that a consent says what it is a consent TO, and a blanket one says only that a patient once signed something.",
};

/**
 * What this module deliberately does not do, and who owns it.
 *
 * Stated because each is a reasonable next thought, and two of them are gated rather than merely
 * unbuilt.
 */
export const OUT_OF_SCOPE_HERE: Readonly<Record<string, string>> = {
  storing_consents:
    "There is no store. Recorded consents are statements by real patients, G9 is unratified, nothing has ever been disclosed, and the acts are parameters. W202 owns the store and W202 is blocked.",
  disclosures_with_no_patient_subject:
    "Whether an aggregate figure below W196's floors is a disclosure of anybody's record is a question this unit is not entitled to answer, and answering it in code would be the answer. Nothing here exempts a disclosure from consent; a caller with no subjects gets a refusal, not a pass.",
  withdrawing_a_disclosure_already_made:
    "A withdrawal takes effect from its own moment. It does not un-send what left, and this module does not pretend otherwise — W239's ledger records what left precisely so that the question after a withdrawal has an answer.",
};

// W239: what left, to whom, and when — and the founder question this unit refuses to settle.
//
// W204 established the tree's retention posture and then found the tension inside it: recomputing
// reports rather than storing them makes erasure automatically effective, and that is the RIGHT
// default while nothing is sent — but "you cannot have accountable disclosure without keeping a
// copy of what you disclosed", so the day G9 opens the safest posture becomes the wrong one. It
// declared `PROPOSED_DISCLOSURE_LOG` and named an open question it was not entitled to answer.
// This unit builds the model and still does not answer it.
//
// THE QUESTION, IN W204'S OWN WORDS, is whether the log holds the FIGURES that were sent or only
// the fact of sending. Holding the figures answers the question fully and makes the log a lasting
// copy of practice-identifiable data; holding only the fact is cheap and half-useful. It is a
// founder call bundled with G9. `OPEN_QUESTION` carries it verbatim rather than paraphrased,
// because a paraphrase of a question somebody has to answer is a second version of the question.
//
// SO THE ANSWER IS ONE LINE — `PAYLOAD_MODE` — AND THAT IS THE WHOLE ENGINEERING PROBLEM. A
// one-line switch is easy. A one-line switch whose CONSEQUENCES also move is not, and a switch
// that flips quietly while its consequences stay where somebody wrote them down is worse than no
// switch at all. Flipping this one does something serious: it turns the ledger into a second
// lasting copy of practice-identifiable figures — which is precisely the thing W204 refused to
// create for reports, arriving one level up and wearing an accountability argument.
//
// SO NOTHING DOWNSTREAM OF THE SWITCH IS WRITTEN DOWN TWICE. The retention life, the questions
// the ledger can answer, the questions it cannot, the erasure obligation and the W106 record
// class are all DERIVED from the mode. `record-classes.ts` imports the derived class rather than
// restating it, so flipping the constant moves the privacy register in the same commit and
// cannot fail to. A model where one line silently changes a classification is the failure this
// arrangement exists to prevent.
//
// THE LEDGER IS EVIDENCE, NEVER PERMISSION. Nothing here decides whether a disclosure may happen.
// That is W202's consent (blocked on G9) and W243's consent-to-disclose model, and the separation
// is load-bearing rather than tidy: a ledger consulted to decide whether to send would make a GAP
// in the ledger into an authorisation, so the absence of a record would grant what the presence
// of one is supposed to evidence. There is no `mayDisclose` here and no function that reads the
// ledger and returns a permission.
//
// AND IT RECORDS WHAT LEFT, NOT WHAT SUCCEEDED. A ledger of successful sends answers "what did we
// successfully deliver", which is not the question. Data that left the building and was rejected
// still left the building, and the first question after a dispute is about the disclosure rather
// than about the acknowledgement. So the record is made of the ATTEMPT and the acknowledgement is
// three-valued — W170's rule, and the default that would cause harm here is `delivered`. W244
// owns the error semantics; this owns the shape that stops the harmful default being available.
//
// FOUNDER GATE (plan §4): G9 is unratified, so nothing has ever been disclosed and
// `SHIPPED_DISCLOSURES` is empty and pinned. No transport, no recipient allowlist and no delivery
// adapter — W202 and W203 are blocked, and this is the record they would write to, built ahead of
// them so the record is not designed in a hurry by whoever ships the first send.

import type { Handling } from "@/privacy/record-classes";

export type DisclosurePayloadMode =
  /** The log records that a disclosure happened, and not what was in it. */
  | "fact_of_sending_only"
  /** The log records the figures that were sent, and becomes a lasting copy of them. */
  | "figures_included";

/**
 * W204'S OPEN QUESTION, VERBATIM. Not this unit's to answer.
 *
 * Carried word for word rather than summarised: a paraphrase of a question somebody still has to
 * answer is a second version of the question, and the two drift.
 */
export const OPEN_QUESTION = {
  raisedBy: "W204 (src/reporting/retention.ts, PROPOSED_DISCLOSURE_LOG.openQuestion)",
  question:
    "Whether the log holds the FIGURES that were sent or only the fact of sending. Holding the figures makes the log answer the question fully and makes it a lasting copy of practice-identifiable data; holding only the fact makes it cheap and half-useful. This is a founder call bundled with G9, not a modelling detail.",
  answeredBy: null,
  howToAnswer:
    "Change `PAYLOAD_MODE` to the chosen value. Everything that follows from it — retention, what the ledger can and cannot answer, the erasure obligation and the W106 record class — is derived from that constant and moves with it.",
} as const;

/**
 * THE ONE LINE.
 *
 * Shipped as the conservative reading, which is not the same as the answer: with G9 unratified
 * nothing has been sent, so the cheap mode costs nothing today and the expensive one would create
 * a store of figures before there are any figures to store. That is a default, not a decision —
 * `OPEN_QUESTION.answeredBy` is null and stays null until a founder says otherwise.
 */
export const PAYLOAD_MODE: DisclosurePayloadMode = "fact_of_sending_only";

export interface ModeConsequence {
  /** Whether a ledger row carries the figures themselves. */
  holdsFigures: boolean;
  /**
   * W106's handling for this module, DERIVED — `record-classes.ts` imports it.
   *
   * A type-only import of W106's own union, so the two cannot disagree about the vocabulary
   * either. Type-only, because `record-classes.ts` imports the derived entry back and a value
   * import would be a runtime cycle.
   */
  w106Handling: Handling;
  /** Days a row lives. W204's proposed seven years, and the reason it differs by mode. */
  retentionDays: number;
  /** Questions a reader of the ledger can answer in this mode. */
  answers: readonly string[];
  /** Questions they cannot. Stated, because a half-useful log read as complete is the harm. */
  cannotAnswer: readonly string[];
  /** What erasure has to reach, which is the part that changes most between the two. */
  erasureObligation: string;
}

/**
 * What each answer to W204's question costs, as data.
 *
 * Both rows exist so the founder is choosing between two described things rather than approving a
 * sentence. The unchosen row is not dead code — it is the other half of the question.
 */
export const MODE_CONSEQUENCES: Readonly<Record<DisclosurePayloadMode, ModeConsequence>> = {
  fact_of_sending_only: {
    holdsFigures: false,
    // NOT `stored`, and the difference is the whole point of asking the question. W106's `stored`
    // means rows must be scrubbed on erasure and returned on an access request; a row in this
    // mode names a practice, a recipient, a period and a person AT THE PRACTICE who sent it, and
    // holds nothing about any patient. The first draft of this module made both modes `stored`,
    // which broke W106's pinned list of classes an erasure must reach — and, worse, flattened
    // exactly the distinction W204 was asking the founder to weigh.
    w106Handling: "no_patient_identity",
    retentionDays: 2555,
    answers: [
      "Did anything leave this practice, and when?",
      "Who received it, and what kind of thing was it?",
      "Who caused it to be sent, and was it acknowledged?",
    ],
    cannotAnswer: [
      "What did we tell them in Q2? — the figures are not held, so this is answerable only by recomputing from rails that have since moved on, which is to say not answerable.",
      "Did the figures we sent match what our own console showed at the time?",
    ],
    erasureObligation:
      "A row names a practice, a recipient, a period and a person at the practice who sent it. It holds no patient identifier and no figure derived from one, so an erasure under W33 has nothing to reach here — which is the same argument W204 made for not storing reports at all.",
  },
  figures_included: {
    holdsFigures: true,
    // `stored`, and this is the consequence with teeth: choosing this answer ADDS this module to
    // W106's list of classes an access request and an erasure must reach, which is a visible edit
    // to `record-classes.test.ts` rather than a silent one. That edit is the point — a founder
    // answering W204's question should have to look at the erasure obligation they are creating.
    w106Handling: "stored",
    retentionDays: 2555,
    answers: [
      "Did anything leave this practice, and when?",
      "Who received it, and what kind of thing was it?",
      "Who caused it to be sent, and was it acknowledged?",
      "What did we tell them in Q2? — answered fully, from the copy rather than by recomputing.",
    ],
    cannotAnswer: [],
    erasureObligation:
      "THIS IS THE COST, AND IT IS THE ONE W204 REFUSED FOR REPORTS. It also moves this module into W106's `stored` class — the list of classes an access request and an erasure must reach — which is a visible edit to the privacy register rather than a quiet one. The ledger becomes a second lasting copy of practice-identifiable figures derived from records with their own retention. Purge a patient under W33 and last quarter's disclosure row still contains the figures they were counted in — erasure reaching the source and not the derivative, which is W51's failure in a new place. Choosing this mode means accepting that the copy is deliberate and that its seven-year life outlives the erasure, which is defensible for a disclosure record and must be a decision rather than a side effect.",
  },
};

/** The consequences that actually apply, derived rather than restated. */
export function currentConsequence(): ModeConsequence {
  return MODE_CONSEQUENCES[PAYLOAD_MODE];
}

/**
 * W106's handling for this module, derived from the mode.
 *
 * `record-classes.ts` imports this rather than writing "stored" of its own, so the privacy
 * register cannot disagree with the switch. The rationale text is derived the same way.
 */
export const DISCLOSURE_LEDGER_RECORD_CLASS = {
  module: "src/interop/disclosure-ledger.ts",
  what: "The outbound disclosure ledger: what left a practice, to whom, and when",
  handling: currentConsequence().w106Handling,
  rationale: `W239's ledger, in \`${PAYLOAD_MODE}\` mode. ${currentConsequence().erasureObligation} Shipped EMPTY — G9 is unratified, nothing has ever been disclosed, and there is no transport here to disclose with. The handling and this rationale are DERIVED from \`PAYLOAD_MODE\`, so W204's open question cannot be answered without moving this classification in the same commit.`,
} as const;

/** Who a disclosure went to. Declared classes, never free text — see `REFUSED_LEDGER_BEHAVIOURS`. */
export type RecipientClass =
  /** A Primary Health Network or equivalent commissioning body. W202/W203's case. */
  | "phn_or_commissioner"
  /** Another practice, in the e-referral direction. */
  | "another_practice"
  /** A payer or insurer. G10 is unratified; declared so the class exists before the gate does. */
  | "payer_or_insurer"
  /** The practice itself, exporting its own data. Included because it is still an outbound copy. */
  | "the_practice_itself";

export type DisclosureKind = "reporting_summary" | "ereferral_document" | "fhir_resource_bundle";

/**
 * Whether the recipient confirmed receipt.
 *
 * Three-valued, and the missing default is the point: there is no `delivered` that a caller gets
 * by not saying anything. W170's rule, and the harmful reading here is the reassuring one — a
 * ledger that shows everything as delivered because nothing was recorded is worse than one that
 * shows nothing. W244 owns what the values MEAN at the protocol level; this owns the shape.
 */
export type Acknowledgement = "acknowledged" | "rejected_by_recipient" | "not_recorded";

export interface Disclosure {
  practiceId: string;
  recipientClass: RecipientClass;
  /** The specific recipient, as the practice named them. Not a hostname — there is no transport. */
  recipientName: string;
  kind: DisclosureKind;
  /** What period the disclosed thing covered, so a row is checkable against a rebuild. */
  periodFromIso: string;
  periodToIso: string;
  /** When it left. */
  disclosedAtIso: string;
  /** Who caused it. A disclosure with no author cannot be asked about. */
  disclosedBy: string;
  acknowledgement: Acknowledgement;
  /**
   * The figures, or a stated absence.
   *
   * Never `undefined`: a row must say whether the figures are absent BECAUSE OF THE MODE or absent
   * because there were none. Those are different facts and a missing key renders them the same.
   */
  payload: { held: false; why: string } | { held: true; figures: Readonly<Record<string, number>> };
}

/**
 * Disclosures that have happened. EMPTY, and pinned empty by its own test.
 *
 * G9 is unratified, W202 and W203 are blocked, and there is no transport in this tree. The ledger
 * is built ahead of them for W204's reason — the record of what left must not be designed in a
 * hurry by whoever ships the first send.
 */
export const SHIPPED_DISCLOSURES: readonly Disclosure[] = [];

export type DisclosureRejection =
  | "no_practice"
  | "no_recipient_named"
  | "no_author"
  | "disclosed_at_missing_or_unreadable"
  | "period_missing_or_unreadable"
  | "period_ends_before_it_starts"
  | "figures_held_against_the_declared_mode"
  | "figures_absent_without_a_stated_reason";

export const DISCLOSURE_REJECTION_COPY: Record<DisclosureRejection, string> = {
  no_practice: "A disclosure that does not say whose data left cannot be answered for by anybody.",
  no_recipient_named:
    "The recipient class says what kind of body received it; without the name, the row cannot answer the only question anybody asks of it.",
  no_author:
    "A disclosure with nobody recorded as having caused it is a disclosure nobody can be asked about, which is the situation the ledger exists to prevent.",
  disclosed_at_missing_or_unreadable:
    "Without the moment it left, the row cannot be placed against what the practice's own records said at the time.",
  period_missing_or_unreadable:
    "A disclosure of figures over an unstated period is a set of numbers with no denominator in time. W205's finding: a true count under a false period is invisible.",
  period_ends_before_it_starts:
    "The period runs backwards, so one of the two dates is wrong and neither can be trusted.",
  figures_held_against_the_declared_mode:
    "This row carries figures while the ledger is declared to hold only the fact of sending, or omits them while it is declared to hold them. A row that disagrees with the mode makes the mode a suggestion, and the mode is the answer to a founder question.",
  figures_absent_without_a_stated_reason:
    "The figures are absent and the row does not say why. Absent because the mode does not hold them and absent because there were none are different facts, and a reader cannot tell them apart from a blank.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Validate one row, returning every reason it is refused.
 *
 * Takes the mode explicitly rather than reading the constant, so a test can exercise both answers
 * to W204's question without editing the shipped default — W227's shape, for the same reason.
 */
export function rejectionsForDisclosure(
  disclosure: Disclosure,
  mode: DisclosurePayloadMode = PAYLOAD_MODE,
): DisclosureRejection[] {
  const out: DisclosureRejection[] = [];
  if (disclosure.practiceId.trim() === "") out.push("no_practice");
  if (disclosure.recipientName.trim() === "") out.push("no_recipient_named");
  if (disclosure.disclosedBy.trim() === "") out.push("no_author");
  if (!ISO_DATE.test(disclosure.disclosedAtIso)) out.push("disclosed_at_missing_or_unreadable");

  const datesReadable =
    ISO_DATE.test(disclosure.periodFromIso) && ISO_DATE.test(disclosure.periodToIso);
  if (!datesReadable) out.push("period_missing_or_unreadable");
  else if (disclosure.periodToIso < disclosure.periodFromIso) out.push("period_ends_before_it_starts");

  const shouldHold = MODE_CONSEQUENCES[mode].holdsFigures;
  if (disclosure.payload.held !== shouldHold) out.push("figures_held_against_the_declared_mode");
  if (!disclosure.payload.held && disclosure.payload.why.trim() === "") {
    out.push("figures_absent_without_a_stated_reason");
  }
  return out;
}

/**
 * The sentence a reader gets for one row.
 *
 * An unacknowledged disclosure renders as unacknowledged. There is no wording here under which a
 * row with `not_recorded` reads as delivered.
 */
export function renderDisclosure(disclosure: Disclosure): string {
  const acknowledgement = {
    acknowledged: "The recipient confirmed receipt.",
    rejected_by_recipient: "The recipient rejected it. It still left, which is why this row exists.",
    not_recorded:
      "No acknowledgement was recorded. That is not the same as delivered, and it is not the same as failed.",
  }[disclosure.acknowledgement];
  const figures = disclosure.payload.held
    ? `The figures sent are held on this row.`
    : `The figures are not held: ${disclosure.payload.why}`;
  return (
    `${disclosure.kind.replace(/_/g, " ")} covering ${disclosure.periodFromIso} to ${disclosure.periodToIso} ` +
    `left ${disclosure.practiceId} on ${disclosure.disclosedAtIso}, sent by ${disclosure.disclosedBy} ` +
    `to ${disclosure.recipientName} (${disclosure.recipientClass.replace(/_/g, " ")}). ` +
    `${acknowledgement} ${figures}`
  );
}

/**
 * Behaviours this ledger must never take on, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly adding a function.
 */
export const REFUSED_LEDGER_BEHAVIOURS: Readonly<Record<string, string>> = {
  the_ledger_as_permission:
    "Reading the ledger to decide whether a disclosure may happen. It is evidence, not authority, and the separation is load-bearing rather than tidy: a ledger consulted for permission makes a GAP in the ledger into an authorisation, so the absence of a record would grant exactly what the presence of one is supposed to evidence. Consent is W202's and W243's.",
  recording_only_successful_sends:
    "Writing a row only when the recipient acknowledged. Data that left the building and was rejected still left the building, and the first question after a dispute is about the disclosure rather than about the acknowledgement. A ledger of successes answers 'what did we successfully deliver', which is not the question anybody asks it.",
  a_delivered_default:
    "Defaulting `acknowledgement` when a caller does not set it. Every default here is wrong in a different way, and the tempting one — `acknowledged` — is wrong in the direction that reassures. The field is three-valued and required, so silence is recorded as silence.",
  free_text_recipients:
    "Letting the recipient class be an arbitrary string. The class is what makes a ledger answerable in aggregate — 'what have we sent to payers' is a question with an answer only if 'payer' is a value rather than a spelling.",
  upgrading_the_payload_quietly:
    "Starting to hold figures without changing `PAYLOAD_MODE`. That is the failure this module's whole arrangement exists to prevent: the mode is the answer to a founder's question, and a row carrying figures against it would make the founder's answer a suggestion. The validator refuses such a row in both directions.",
  deriving_the_record_class_by_hand:
    "Writing `handling: 'stored'` into W106's registry separately from the mode. The two would agree on the day somebody wrote them and disagree the first time the mode changed, and the disagreement would be invisible — which is the whole class of failure W102's both-directions registers exist against.",
};

// W201: what the software decides about a patient, enumerated and checked against the tree.
//
// The ADM-transparency page (APP 1.7, commencing 10 December 2026) was written at W33 and revised
// at W102, which found it materially out of date and said so in a comment: *keep this page in the
// same commit as any change to what the software decides.* That instruction was ignored for three
// years, which is what instructions in comments are for. Y3 and Y4 added a pathway engine, a
// GP-to-GP referral rail, outcome verdicts and a directory, and the published statement still
// described the Year 2 product.
//
// So the list stops being prose on a page and becomes a register the page renders, checked against
// the source in both directions. A module that decides something about a patient and is not
// declared here fails the suite. That is the difference the unit's gate asks for — "checked
// against the source rather than written from memory" — and writing it found three things memory
// had lost.
//
// THE HOLDOUT ARM WAS NEVER DISCLOSED AT ALL. W8 assigns every patient to an arm by hashing
// (practice, patient) at the practice's configured rate, and patients in the holdout arm are not
// invited — that is how the practice can tell whether any of this works. It is a decision, taken
// automatically, that withholds an offer of an appointment from a specific person, and it has been
// live since Year 1 and absent from the statement since Year 1. Everything else here is a decision
// that was disclosed late; this one is a decision that was never disclosed. It is first in the
// list for that reason.
//
// ESCALATION TO A HUMAN WAS NOT DISCLOSED EITHER. W73 ships four live triggers — a free-text
// reply, a complaint, repeated non-attendance, an opt-out carrying a message — each of which
// routes the patient to their usual GP. It is the most benign automated decision in the product
// and it is still one: something a patient did caused software to put them in front of a clinician.
//
// AND THE PATHWAY ENGINE IS BUILT BUT NOT IN USE, which is worth saying precisely rather than
// omitting. W120 evaluates recorded facts against criteria a practice has signed off, including
// escalation criteria. No pathway has been signed off — `SHIPPED_PATHWAYS` is empty behind G5 — so
// the decision is not being taken about anybody today. A notice that omitted it would be accurate
// now and wrong the day the gate opens; a notice that described it as live would be wrong now. So
// status is a field, and the test READS THE REGISTRY to check it: a decision claiming to be
// dormant whose content registry has filled up fails.
//
// The detector's bound, stated because a register that hides its bound is worse than no register:
// "touches a patient" is the union of TWO scans — modules naming a declared PERSON-REFERENCE
// term (of which there are three), and modules exporting a decision-outcome union (`*Reason`,
// `*Refusal`, `*Exclusion`, `*Verdict`). Neither is sound alone. (W221 first wrote "three scans"
// here while enumerating two: the wrong count, in the block whose stated job is stating the bound
// honestly. Caught by the review skill, which is the argument for running it.) The union scan misses `registers/escalation.ts`, which
// names its outcomes `EscalationRoute`; the identifier scan misses `engine/eligibility.ts`, which
// takes ids as plain strings.
//
// THE THIRD TERM WAS ADDED AT W221 AND THE HOLE IT CLOSED IS WORTH RECORDING, because the two
// controls involved were pulling in opposite directions. W213 deliberately stopped the matcher
// seeing a `Patient`: it receives a `MatchCandidate` carrying a `candidateRef`, a lossy projection
// with nowhere to put a clinical attribute, and that is what makes "position never depends on
// need" structural. The same decision made `src/matching/match.ts` INVISIBLE HERE — a module that
// decides which person is offered which appointment, undetected by the register that exists to
// enumerate exactly that. **A privacy control and a transparency register can hide something from
// each other**, and the only reason this was found is that W221's gate said RE-DERIVE rather than
// re-check.
//
// So the terms are declared data rather than a literal in a test, and adding a pseudonym for a
// person means adding it here — which is a visible edit in the file whose job is to notice people.

/**
 * How a person is referred to in this tree, with the reason each term counts.
 *
 * Read by `automated-decisions.test.ts` to decide which modules must be classified. A pseudonym
 * is still a person: W213's `candidateRef` identifies exactly one patient to whoever holds the
 * mapping, and the module that consumes it decides whether that patient is offered an appointment.
 */
export const PERSON_REFERENCE_TERMS: Readonly<Record<string, string>> = {
  PatientId: "The branded identifier. The obvious case, and the only one the detector had until W221.",
  patientId: "The field name, used where the branded type is not in scope.",
  candidateRef:
    "W213's pseudonym for a patient inside the matcher. Deliberately not a `Patient` — that is what keeps a clinical attribute out of the matcher — and precisely because of that it hid `src/matching/match.ts` from this register for a full quarter.",
};

/** Whether the decision is actually being taken about anybody today. */
export type DecisionStatus =
  /** Live: this is happening now, wherever a practice has the feature on. */
  | "in_use"
  /** Built, and taking no decisions, because the content it needs is gated and empty. */
  | "built_not_in_use";

/**
 * The content registry that makes a decision live, if it has one.
 *
 * Read by the test rather than trusted: `built_not_in_use` must point at an EMPTY registry and
 * `in_use` at a non-empty one. This is the check that makes `status` a fact about the tree instead
 * of a claim in a document.
 */
export interface ContentRegistry {
  module: string;
  exportName: string;
}

export interface AutomatedDecision {
  id: string;
  /** The bold lead-in on the page. */
  title: string;
  /** What is decided, addressed to the patient it is decided about. Rendered verbatim. */
  what: string;
  /** The modules that take it, as the tree spells them. */
  decidedBy: readonly string[];
  status: DecisionStatus;
  /** Null when the decision needs no signed-off content to run. */
  registry: ContentRegistry | null;
}

export const AUTOMATED_DECISIONS: readonly AutomatedDecision[] = [
  {
    id: "holdout-arm",
    title: "Whether you are in the group we deliberately leave alone.",
    what: "To know whether any of this helps, a share of patients at each practice is set aside and not sent availability messages at all. Which group you are in is worked out by a calculation on your patient number that always gives the same answer, not by anything about you or your health, and your practice sets the size of the group. Being in it does not change your care or your ability to book an appointment in the usual way; it means the practice is not messaging you about spare slots.",
    decidedBy: ["src/engine/holdout.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "eligibility-filtering",
    title: "Whether you may be offered an available appointment.",
    what: "Deterministic rules your practice configures: how recently you attended, appointments you already have, how often you have been contacted, consent and opt-out status. The rules are versioned and every exclusion is recorded with its reason, so your practice can ask why any single patient was or was not included.",
    decidedBy: [
      "src/engine/eligibility.ts",
      "src/engine/pool.ts",
      "src/engine/backfill.ts",
    ],
    status: "in_use",
    registry: null,
  },
  {
    id: "register-membership",
    title: "Whether you are on a register your practice runs.",
    what: "Membership is taken from the flag your practice has already recorded on your file, or added by the practice itself. It is never worked out from symptoms, medicines or anything else about you, and the source of every membership is recorded.",
    decidedBy: ["src/registers/membership.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "care-gap-timing",
    title: "When a scheduled appointment comes round.",
    what: "A calendar calculation against the interval your practice has set for that register — the time elapsed since a recorded date, not a judgement about whether you need to be seen. Your practice can also require this before anybody is contacted, which narrows who is messaged rather than widening it.",
    decidedBy: ["src/registers/caregap.ts", "src/registers/eligibility.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "ordering-within-the-eligible-group",
    title: "Who is offered a slot first.",
    what: "Patients already found eligible are put in an order using simple, explainable factors — whether your practice has flagged you for ongoing care, and how long since your last visit. It decides the order of offers, never who is more unwell.",
    decidedBy: ["src/registers/ranking.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "which-gp-the-offer-names",
    title: "Which GP the offer names.",
    what: "An offer normally names your usual GP. If your practice has turned this on for a particular register, and your usual GP does not meet the threshold that practice has set, the offer may name a different GP at the same practice instead. It never sends you outside your own practice, it never moves you when your usual GP does meet the threshold, and every such decision is recorded with its reason. Your practice sets a limit on how much of this can happen at all.",
    decidedBy: ["src/capability/routing.ts", "src/capability/experience.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "decisions-not-to-contact",
    title: "Decisions not to contact you.",
    what: "Just as often the automated decision is silence: if your practice already has its own recall running for you, if you have had as many invitations as your practice allows, if the appointment would be gone before the hours you agreed to be contacted in, or if a practice-wide safety threshold has paused sending. Silence is recorded with its reason in the same way a message is.",
    decidedBy: [
      "src/registers/recalls.ts",
      "src/messaging/preferences.ts",
      "src/guardrails/condition-monitors.ts",
      "src/registers/safety-rails.ts",
    ],
    status: "in_use",
    registry: null,
  },
  {
    id: "send-mechanics",
    title: "How and when a message actually goes out.",
    what: "Batch sizes, the wording template your practice has approved, and expiry of an offer once the session fills. An offer that has lapsed cannot be booked, which is the only way software here ever closes a door — and the appointment was gone in any case.",
    decidedBy: [
      "src/booking/rail.ts",
      "src/messaging/adapter.ts",
      "src/messaging/approval.ts",
    ],
    status: "in_use",
    registry: null,
  },
  {
    id: "escalation-to-a-human",
    title: "Whether something you did is put in front of your GP.",
    what: "Four things take you out of the automated loop and to your usual GP: replying to a message in your own words, a complaint being logged, repeatedly not attending appointments the software offered, and opting out with a message attached. The software reads none of it. It notices that you wrote something or that something happened, and hands it to a person, because an automated loop is the wrong thing to be talking to.",
    decidedBy: ["src/registers/escalation.ts", "src/outcomes/escalation-monitor.ts"],
    status: "in_use",
    registry: { module: "src/registers/escalation.ts", exportName: "SHIPPED_TRIGGERS" },
  },
  {
    id: "referral-follow-up",
    title: "Whether you are reminded about a referral that has not completed.",
    what: "Where your practice has written you a referral and nothing has come back, the software can notice that and offer you an appointment with your own practice to sort it out. It is the same availability message as any other and says nothing about why. It never contacts the other practice about you and never chases you about your health.",
    decidedBy: [
      "src/referrals/capture.ts",
      "src/referrals/leakage.ts",
      "src/referrals/outreach.ts",
    ],
    status: "in_use",
    registry: null,
  },
  {
    id: "referral-outcome-verdict",
    title: "What the record shows happened to your referral.",
    what: "The software forms a verdict on each referral — whether the record contains an appointment, a completion, or nothing yet — so a practice can see what has not closed. The verdict is a statement about which facts were recorded, never about whether the care was right, and \"nothing recorded\" is kept distinct from \"nothing happened\" because they are different.",
    decidedBy: ["src/outcomes/model.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "intervention-response-link",
    title: "Whether something in your record counts as an answer to something we did.",
    what: "Where your practice sent you an availability message or wrote a referral, the software links a later recorded fact — a booking, an attendance, a decline, an opt-out — to the thing that came before it, so the practice can see what its own actions led to. It links only facts somebody wrote down, only where the later fact is not recorded before the earlier one, and only kinds it has been told to expect. Where nothing is recorded it says nothing is recorded: that is never read as you having declined, ignored us, or made any choice at all. Your practice can see these counts on a page in its own console; they are counts, never a list of people, and nothing in it is a judgement about you or your health.",
    decidedBy: ["src/outcomes/response.ts"],
    status: "in_use",
    registry: null,
  },
  {
    id: "which-appointment-you-are-offered",
    title: "Which of several appointments you are offered.",
    what: "Built and not in use. Where a practice offers several appointments at once, the software works out who is offered which one: people who can take fewer of the offered times are matched first, so an appointment only one person can use is not given to somebody with five choices, and within that it takes the earliest time that suits you. It uses only the times your practice has recorded that you can attend and how many offers you already hold. It cannot see anything about your health — the calculation is not given it — and where two people are equally placed the tie is settled arbitrarily rather than by any judgement about either of them. No practice is using this yet.",
    decidedBy: ["src/matching/match.ts"],
    status: "built_not_in_use",
    registry: null,
  },
  {
    id: "forecast-invitation-volume",
    title: "Whether you are sent a message about a spare appointment, when your practice's own diary says the session usually fills.",
    what: "Built and not in use. Where a practice switches this on, the software looks at how full that clinician's sessions on that day of the week have been in the practice's own records, and sends messages for the slots the record suggests would still be free rather than for every slot open on the day. It can only ever send FEWER messages, never more, which means somebody who would have been told about a spare appointment is not told about it. It uses the least full week on record rather than the fullest, so it never assumes a session will do better than its worst week; it will not run at all where the pattern has recently stopped matching the records, or where there is not yet enough history to tell. Nothing about you is used — the calculation sees a count of appointment slots and no patient at all — and who is contacted, once the number is decided, is unchanged. Switching this on is a decision the practice takes and records with a reason. No practice has switched it on.",
    decidedBy: ["src/capacity/coupling.ts"],
    status: "built_not_in_use",
    registry: { module: "src/capacity/coupling.ts", exportName: "ENABLED_COUPLINGS" },
  },
  {
    id: "pathway-criteria",
    title: "Whether the facts on your file match a pathway your practice signed off.",
    what: "Built and not in use. Where a practice adopts a care pathway, the software compares facts already recorded on your file against the criteria in that pathway and flags the pathway for the practice to look at, including criteria that ask a clinician to look sooner. It reaches no conclusion about your health, it reads nothing but facts somebody recorded, and where a fact is missing it says so rather than assuming. No pathway has been signed off for use, so this decision is not currently being taken about anybody.",
    decidedBy: ["src/pathways/evaluation.ts", "src/pathways/consent.ts"],
    status: "built_not_in_use",
    registry: { module: "src/pathways/versioning.ts", exportName: "SHIPPED_PATHWAYS" },
  },
];

/**
 * What the software will not do, rendered on the same page.
 *
 * Here rather than in the page because the two lists are read together and a claim about what is
 * never automated is only as good as the enumeration it sits beside.
 */
export const NEVER_AUTOMATED: readonly string[] = [
  "No clinical decision of any kind — no diagnosis, no triage, no assessment of symptoms.",
  "No decision to deny care: not being sent an availability message never affects your ability to book through the practice as usual.",
  "No inference about you. Nothing is concluded from your details that you or your practice did not record. Where a reason for something is held, somebody said it.",
  "No ordering of patients by need or by how unwell they are, and no list of who is most at risk. Meherr decides who has an appointment offered to them, never who most needs one.",
  "No decision that your care has moved to another clinician. When your GP refers you, the receiving practice must record that it has taken you on; silence is never read as a handover.",
  "Nothing you are sent reveals why you were selected. A message prompted by a register or by a referral is word for word the same as any other appointment invitation.",
  "No automated re-enabling of contact after you opt out. Opt-out is permanent.",
];

/** What is read, rendered on the page. Kept beside the decisions because it is the input to them. */
export const INFORMATION_USED: readonly string[] = [
  "Meherr reads what your practice has already recorded about you: when you last attended, appointments you have booked, whether you have opted out, the ongoing-care conditions your practice has flagged on your record, and referrals your practice has written. Some of that is health information. It is used to decide who to invite to an appointment and when — never to work anything out about your health.",
  "Meherr does not read your consultation notes, test results or clinical correspondence, and does not receive them.",
];

export const HUMAN_CONTROLS: readonly string[] = [
  "The practice configures and can change every eligibility rule at any time.",
  "Every register, and the routing described above, is off unless your practice turns it on.",
  "Practice staff can pause all sending instantly with one switch.",
  "Your practice approves the exact wording of every message before any of it can be sent, and an edit of a single character withdraws that approval.",
  "You can stop all messages by replying STOP, and can ask your practice to access or delete the information Meherr holds.",
  "Every automated action is written to an audit log the practice can inspect.",
];

/**
 * Modules the detector reaches that take no automated decision about a patient, with the reason.
 *
 * The other half of the register, and the half that does the work: without it "every decision is
 * declared" is unfalsifiable, because nothing says what the complete set of candidates was. A
 * module here is a module somebody looked at and ruled out.
 */
export const NOT_A_DECISION: Readonly<Record<string, string>> = {
  "src/booking/store.ts": "The store behind the booking pages. It records the transitions the rail decides; it decides nothing.",
  "src/interop/credentials.ts":
    "W242 is the credentials posture: which connections this product would need, that it holds none, and that G1 is the founder decision blocking every one of them. It decides nothing about anybody — no patient, condition or appointment reason reaches it, and its only inputs are a slot name and a value it never reads. It is declared here because its refusal union trips the detector, which is the detector working as intended: this is the module that would sit between a decision and a real practice system, and the register that enumerates decisions should be able to see it even though the answer is that nothing is decided and nothing is connected.",
  "src/interop/exchange-state.ts":
    "W244 says what is known about one exchange with another system — nothing left, it left and nothing came back, it was refused, or it was confirmed — and whether sending again could duplicate a document. It decides nothing about a patient: its inputs are a transport outcome and its outputs are a state and a retry verdict, with no person anywhere in either. It appears here because its refusal-shaped union trips the detector, and that is the detector working as intended for a module at the boundary. The one decision it takes is deliberately a REFUSAL: where an exchange may already have arrived, it declines to authorise a retry rather than choosing for the practice, because whether a second copy of a clinical document is acceptable is a question about the recipient's system.",
  "src/interop/fhir.ts":
    "W235 maps this tree's records to FHIR R4 resources and back. It decides nothing about anybody: it copies fields a PMS already recorded from one shape into another, and takes no view on any patient. It is declared here because it names patient identifiers throughout, which is the detector working as intended — this is the boundary patient identity leaves through, and the register that enumerates decisions should be able to see it even though the answer is that no decision is taken. What the module DOES refuse is worth noting beside that: it will not map the chronic-care marker to a FHIR `Condition`, because doing so would have this product assert a clinical diagnosis about a named patient, and it will not export the holdout arm, which W201 lists first among the decisions this tree does take.",
  "src/capacity/attribution.ts":
    "W233 asks whether opening extra slots helped, and its whole content is that this product cannot say. It decides nothing about anybody: no patient, condition or appointment reason reaches it, and the only thing it reads is a count of slots filled per session. It decides nothing about a PRACTICE either, because answering the question needs sessions allocated to two groups before anyone chose which to open, no such trial has been run, and `SHIPPED_SESSION_ARMS` is empty. The refusal union it exports is about whether a measurement may be reported, not about a person.",
  "src/interop/consent-to-disclose.ts":
    "W243 decides whether a disclosure may leave, and the decision is not this software's — it is the patient's, recorded, and this module checks whether what they recorded covers what is about to be sent. It takes no view: there is no rule here under which a patient who recorded nothing is treated as agreeing, no elapsed time that turns silence into consent, and no input other than the acts a person wrote down. The one thing it decides on its own is to REFUSE, which is the only direction in which being wrong costs a practice a phone call rather than costing a patient a disclosure they did not agree to. Declared here because it names patients throughout and because a reader of this register should be able to satisfy themselves that consent is checked rather than assumed — and because the failure it guards against would LOOK like a decision about a person: a disclosure sent under a consent the patient gave for something else has a consent record attached and passes every check that only asks whether one exists. `REFUSED_CONSENT_SOURCES` names seven ways of manufacturing one, and the first is reusing this tree's own `smsConsent`.",
  "src/interop/terminology.ts":
    "W238 binds this tree's local catalogue codes to SNOMED CT-AU and LOINC. It decides nothing about anybody, and today it decides nothing at all: the catalogue ships EMPTY, so every code is refused. What it would decide if filled is not a decision about a patient either — it is whether a code somebody wrote down in a release may be sent as a coded concept, and the answer comes from a table a person checked, never from a match this software made. It is declared here because the guess it refuses would LOOK like a decision about a person: a nearest-display match or a parent-concept fallback puts a condition on a referral about a named patient that no clinician chose, and nothing at either end reports an error. `REFUSED_BINDING_STRATEGIES` names all five ways of doing it, and `inferred_from_fact_codes` is the one that is G7's line rather than a data-quality point.",
  "src/interop/ereferral.ts": "W236 renders W131's structured referral to an e-referral profile. It decides nothing: the reason and request are codes the referring clinician already chose, the recorded facts are referenced by code, and the clinician's own narrative is passed through byte for byte or its absence is named. Listed here because this is the boundary where composing a clinical summary would be most useful to whoever receives the document and would still be software writing about a patient — G7's fourth property, and `REFUSED_PROFILE_CONTENT` names the five ways of doing it.",
  "src/capacity/backtest.ts": "W224's forecast score. Walks a session's own recorded history forward, forecasts each week from the weeks before it, and compares the range with what the record shows was filled. It is a judgement about a FORECASTER, never about a patient: nothing here reads a person, a condition or a reason for an appointment, and the only thing it decides is whether this product's own range has been accurate.",
  "src/capacity/model.ts": "W222's capacity model. Groups a practice's own appointment slots into sessions and counts what the record says happened to them — filled, still open, or taken and released. It reads no patient, no condition and no appointment reason; the counts are about a diary. It takes no decision at all, and refuses to produce a number where there is no recorded history rather than defaulting one.",
  "src/capacity/opening.ts": "W225 suggests how many slots a practice might open on a given weekday, from what its own diary recorded. It decides nothing about anybody: the type has no field a person could occupy, no exported signature takes one, and `REFUSED_OPENING_FIELDS` states why each — including `candidateRef`, because W221 found that a pseudonym is still a person. **W226 added the trigger this entry was missing.** The suggestion is read by a person and wired to nothing: no code path takes it and changes what Meherr sends. W231 is where the coupling to invitation volume is built, shipped explicitly off — and on the day a practice can enable it, this stops being a suggestion somebody reads and becomes an input to how many patients are contacted, which is a decision this register already discloses under eligibility filtering. Then this row moves. Recording the trigger rather than only the present state is PRIV-3's lesson: a finding logged as \"not a problem yet\" and never re-read is how a modelling gap becomes a disclosure two years later.",
  "src/capacity/drift.ts": "W228 checks whether a session's own range has stopped describing it, by holding that range still and comparing it with the weeks since. It decides nothing about anybody — no patient, no condition and no clinical step reaches it — and, deliberately, it decides nothing about the forecast either: it reports the disagreement and has no way to resolve it, because a recalibration would absorb a change to a practice's diary that the practice should be told about.",
  "src/capacity/forecast.ts": "W223 turns W222's recorded weeks into a range for a session — how many of the slots a practice opens on a Thursday filled, in the weeks on record. It is about a SESSION, not a person: no patient or candidate reaches it, and its `ForecastRefusal` union is about whether a range may be given at all.",
  "src/complaints/store.ts": "Storage for complaints. The complaint is the practice's record and the store keeps it.",
  "src/complaints/workflow.ts": "Intake and resolution of a complaint by practice staff. Every step is a person acting.",
  "src/credentials/verification.ts": "A clinician's credential and who verified it. Nothing about a patient.",
  "src/directory/correction.ts": "What a clinician may change about their own directory profile.",
  "src/directory/fees.ts": "What a practice charges, as the practice states it.",
  "src/directory/membership.ts": "Which clinicians are in the network, on a basis the practice declares rather than one inferred.",
  "src/domain/types.ts": "The domain types. Declarations, no behaviour.",
  "src/education/provenance.ts": "Where a piece of education content came from.",
  "src/engine/arm-stability.ts": "A property check asserting a patient's arm survives a version change. It reads assignments and decides nothing.",
  "src/engine/attribution.ts": "Cohort arithmetic comparing the invited arm with the holdout arm. A statement about a group, never about a member of it.",
  "src/engine/continuity.ts": "Practice-level continuity measurement — what share of appointments were with a patient's usual GP.",
  "src/interest/types.ts": "The reasons a practice can pick on the interest form. Chosen by a person.",
  "src/loop/claims.ts": "Which build session may claim a ledger row. Engineering, not product.",
  "src/outcomes/graph-privacy.ts": "W218's disclosure form for a response graph. It withholds counts too small to publish and says so; it decides nothing about a patient, and the only thing it decides about the product is which of its own aggregate numbers may be shown. Nothing ships — `SHIPPED_DISCLOSABLE_GRAPHS` is pinned empty, because a non-empty registry would be the first thing in the tree cleared for disclosure and G9 is unratified.",
  "src/outcomes/counterfactual.ts": "W215's counterfactual. Cohort arithmetic over two arms — one measured rate applied to a known head count — and the same reason `src/engine/attribution.ts` gives applies here: a statement about a group, never about a member of it. It decides only whether the difference between the arms may be CLAIMED, which is a decision about arithmetic, and no exported function takes a patient.",
  "src/matching/explain.ts": "W213's explainability floor. It renders the reason a matching decision carries and REFUSES a plan that leaves anybody unaccounted for; it chooses nothing itself. The decision it constrains is W214's, and the projection here is what stops that decision from being able to read a clinical attribute at all.",
  "src/ops/store.ts": "Storage for the admin-operations console. It holds what staff did and what the rails recorded, and takes no view of its own.",
  "src/pathways/approval.ts": "The G5 sign-off workflow for pathway content. A decision about content, taken by people.",
  "src/pms/adapter.ts": "The read interface onto practice software.",
  "src/pms/contract.ts": "The contract every practice-software adapter must satisfy.",
  "src/pms/drift.ts": "Detects when a recorded fixture has drifted from the vendor's shape. Engineering.",
  "src/pms/fixtures.ts": "Synthetic recorded API responses used to test adapters.",
  "src/pms/ingest.ts": "Maps records read from practice software onto platform types. Reading is not deciding, and what is read is listed above.",
  "src/pms/synthetic.ts": "The synthetic practice-software adapter. No real patient exists behind it.",
  "src/pms/vendors.ts": "Vendor adapter skeletons behind a flag, with no credentials.",
  "src/privacy/privacy.ts": "Access, export and erasure. Executed when somebody asks, never on the software's initiative.",
  "src/privacy/record-classes.ts": "W106's register of where patient identity can live.",
  "src/privacy/store.ts": "Storage for access, correction and erasure requests and how they were answered. A record of what people asked for.",
  "src/quality/order-regressions.ts": "W178's corpus of past order-dependence defects. Engineering.",
  "src/referrals/acceptance.ts": "The opposite of an automated decision: it requires a receiving practice to record acceptance, and exists so that no handover is ever concluded by software.",
  "src/referrals/barriers.ts": "Records why a referral did not complete, from a reason a person entered.",
  "src/referrals/document.ts": "The referral document a GP writes. The product neither generates nor edits its clinical content.",
  "src/referrals/return-report.ts": "What the receiving practice sends back, as they sent it.",
  "src/referrals/store.ts": "Where referrals live for a running console.",
  "src/registers/analytics.ts": "Gap-closure rates by condition across a cohort. Group arithmetic.",
  "src/registers/attribution.ts": "Incrementality per register cohort, including when the cohort is too small to claim anything. Group arithmetic.",
  "src/registers/sim-registers.ts": "The register layer as the simulator sees it. Synthetic.",
  "src/outcomes/response-graph.ts": "W212 counts how interventions were answered, over the synthetic loop only. It aggregates facts already recorded and decides nothing about anybody; its `GraphRefusal` union is about whether a graph may be built at all, not about a patient.",
  "src/reporting/model.ts": "Figures about a practice that a commissioner could be told. Nothing is disclosed, and no figure can name a patient.",
  "src/reporting/suppression.ts": "Suppresses cells too small to disclose. It removes information rather than deciding anything about a person.",
  "src/security/audit-gate.ts": "The dependency-advisory gate. Engineering.",
  "src/sim/harness.ts": "The simulation harness. Synthetic patients only.",
  "src/spine/spine.ts": "The append-only event log every state change flows through. It records decisions; it takes none.",
  "src/synthetic/generate.ts": "Generates the synthetic practice. No real person is involved.",
  "src/synthetic/recalls.ts": "Generates synthetic practice-recall data so the coexistence rules can be exercised. No real recall and no real patient.",
  "src/synthetic/referrals.ts": "Generates synthetic referral histories for the outreach console and its end-to-end tests. Nobody in them exists.",
  "src/verticals/binding.ts": "Which version of a content bundle a practice is on.",
  "src/verticals/model.ts": "A content bundle, versioned as one thing.",
};

/** Every module the register accounts for, in either direction. */
export function declaredModules(): string[] {
  return [
    ...AUTOMATED_DECISIONS.flatMap((d) => d.decidedBy),
    ...Object.keys(NOT_A_DECISION),
  ].sort();
}

/** The page's own copy, as one string, for the compliance sweep. */
export function pageCopy(): string {
  return [
    ...INFORMATION_USED,
    ...AUTOMATED_DECISIONS.flatMap((d) => [d.title, d.what]),
    ...NEVER_AUTOMATED,
    ...HUMAN_CONTROLS,
  ].join("\n");
}

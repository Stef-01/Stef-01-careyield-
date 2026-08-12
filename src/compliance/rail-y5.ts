// W259: the five rail properties at five years — re-derived against Y5, not carried forward.
//
// W200 did this against Y4 and its value came from what carrying forward would have missed:
// property five's enforcement covered six files under `src/education/`, Y4 added operator copy in
// five other places, and none of it was ever linted. The rule was not weakened; A CONTROL DID NOT
// FOLLOW THE PRODUCT. That is the failure this unit exists to look for again, one year on.
//
// THE GATE NAMES Q17'S MATCHER SPECIFICALLY, and it is the right place to look: it is the first
// Y5 work that could have moved property one. So the re-derivation here is not prose about the
// matcher — every claim below has an assertion behind it in `rail-y5.test.ts`, run against the
// matcher's own types and output rather than against this file's description of them.
//
// AND THE ANSWER FOR THE MATCHER IS THAT IT SURVIVED ON CONSTRUCTION. W213 landed the
// explainability floor BEFORE any optimisation existed and made the guarantee a property of the
// type: `MatchCandidate` has nowhere to put a clinical attribute, `MatchSlot` has nowhere to put a
// clinician, and `candidateFrom` builds its result field by field so nothing new on `Patient` can
// flow through. Each of those is asserted, because "it survived" is the sentence a re-derivation
// is most likely to write without checking.
//
// WHAT THE RE-DERIVATION DID PRODUCE IS A CONTROL THAT FOLLOWS THE PRODUCT. W213's guarantee was
// tested against FOUR FIELDS SOMEBODY REMEMBERED — `chronicCare`, `activeRecall`, `lastAttendedAt`,
// `usualClinicianId` — and against a pin on the projection's own keys. Both are sound and neither
// is a census: nothing said what should happen when `Patient` grows an eleventh field. It has ten
// today and it has gained fields before. So `PATIENT_FIELD_CLASSIFICATION` declares every one of
// them, carried or withheld with the reason, checked against the type in both directions — a new
// field fails the suite until somebody says which it is. That is W200's own finding in its
// general form: the control now reads the product rather than a list.
//
// THE Y5 SURFACE THAT CARRIES THE SAME RISK AS THE MATCHER IS THE PLATFORM API, and it is worth
// saying plainly because it is this quarter's work. W253 publishes per-clinician capacity figures
// over HTTP for the first time. The product still orders nothing by performance — rows come back
// by (weekday, clinician), a declared non-clinical basis — and that is ASSERTED by permuting the
// figures and requiring the order not to move, rather than by reading the sort. What a caller does
// with the figures afterwards is theirs, which is W232's finding about a practice acting on a
// forecast, at a new boundary.
//
// FOUNDER GATES (plan §4): nothing here reads a patient record; the fixtures are synthetic.

import { RAIL_PROPERTIES } from "./cdss-boundary";

/** The first unit of Y5. Y5 is W209–W260. */
export const Y5_FIRST_UNIT = 209;

export interface Y5Rederivation {
  /** The property, as W200 ids it. Checked against `RAIL_PROPERTIES` in both directions. */
  propertyId: string;
  /** What Y5 added that could have broken it. Named, so the re-derivation has a subject. */
  y5Surface: string;
  /** Why it did not, in terms of what was BUILT rather than what was intended. */
  whyItSurvived: string;
  /** The assertion in this unit's test. A re-derivation nobody checked is a claim. */
  assertedBy: string;
}

export const Y5_REDERIVATIONS: readonly Y5Rederivation[] = [
  {
    propertyId: "never-selects-a-clinician",
    y5Surface:
      "Q17's deterministic matcher (W213/W214) assigns patients to appointments, and Q20's platform API (W253) publishes per-clinician capacity figures over HTTP for the first time. Either could have produced an ordering of clinicians: the matcher by preferring one, the API by returning rows a caller reads as a league table.",
    whyItSurvived:
      "The matcher cannot see a clinician at all — `MatchSlot` carries a slot id, a practice and a start time, so preferring one is not a line somebody could add, it is a field somebody would have to add to a declared shape. The API returns capacity rows ordered by (weekday, clinician), a declared basis with nothing clinical and nothing performance-related in it, and the order does not move when the figures do. What a caller does with the figures afterwards is theirs, which is W232's finding at a new boundary rather than a new breach.",
    assertedBy:
      "src/compliance/rail-y5.test.ts :: the matcher cannot see a clinician, and capacity row order does not follow the figures",
  },
  {
    propertyId: "never-decides-care-transferred",
    y5Surface:
      "Q19's interop rail (W236, W239, W244) renders referrals for another system, records what left and models what came back. A boundary that reports delivery is one step from reporting handover.",
    whyItSurvived:
      "W244 refuses a `delivered` boolean and splits the ambiguity into four states with no `unknown`, so `sent_no_response` cannot collapse into an arrival. W239's ledger records what LEFT rather than what succeeded, and W134's acceptance rail is untouched by any of it — nothing in Q19 produces an acceptance, and the matcher produces none either.",
    assertedBy:
      "src/compliance/rail-y5.test.ts :: nothing in Q17's matcher or Q19's rail produces an acceptance",
  },
  {
    propertyId: "never-concludes-from-silence",
    y5Surface:
      "Y5 is full of absences somebody would like resolved: a session with no recorded weeks (W222), an exchange with no answer (W244), a patient with no recorded consent (W243), an API endpoint whose read threw (W255), and a console with nothing to show (W246).",
    whyItSurvived:
      "Every one of them reports the absence rather than a value. W243 sweeps five years forward to prove no elapsed time turns silence into consent; W246 refuses to render a zero where nothing was attempted, because a zero is a measurement and this is the absence of one; W255 forwards nothing from a failed read rather than describing it; and the matcher offers nobody an appointment on the strength of an empty availability list — it produces a declared reason instead.",
    assertedBy:
      "src/compliance/rail-y5.test.ts :: an absent availability produces a declared reason, never an inference",
  },
  {
    propertyId: "writes-no-clinical-text",
    y5Surface:
      "Q19's e-referral profile (W236) is the first boundary where another practice reads what this tree emits, and Q19's terminology binding (W238) is the first place this tree could assert that two codes mean the same condition.",
    whyItSurvived:
      "W236 re-derived the property over a RENDERED document string by string rather than by reading the renderer: every string is a declared vocabulary member, a declared code, an identifier copied from the input, or text a clinician wrote. W238 ships an empty catalogue and refuses an unbound code rather than guessing, because a binding is a clinical assertion. The matcher's own reasons are a closed copy map, and it has no field for prose.",
    assertedBy:
      "src/compliance/rail-y5.test.ts :: the matcher's reasons are a closed vocabulary that passes W6's linter",
  },
  {
    propertyId: "informs-never-advises",
    y5Surface:
      "Y5 added roughly sixty modules with operator-facing copy — capacity, interop, the API and the verticals — which is the same shape as the Y4 gap that W200 found: copy arriving where the linter had never been pointed.",
    whyItSurvived:
      "W200's fix generalised, and this is the part worth recording. Its register decides membership by reading each module's own `// W<n>` header against `Y4_FIRST_UNIT`, so every Y5 module was compelled into the declared copy surface as it landed — without an edit to the detector and without anybody remembering. W226's capacity linter, W229's and W246's consoles, W243's consent verdicts and W255's refusal copy all entered that way, each declared at the moment it was written rather than swept up later. A hand-kept list would have covered the modules somebody remembered, which is exactly what it did in Y4.",
    assertedBy:
      "src/compliance/rail-y5.test.ts :: every Y5 module is inside W200's declared copy surface, by the same detector",
  },
];

/**
 * Every field on `Patient`, and whether the matcher may see it.
 *
 * THE CONTROL THIS RE-DERIVATION PRODUCED. W213's guarantee was tested against four fields
 * somebody remembered plus a pin on the projection's own keys — both sound, neither a census, and
 * nothing said what happens when `Patient` grows an eleventh field. Checked against the type in
 * both directions, so a new field fails the suite until somebody classifies it.
 */
export interface PatientFieldRule {
  field: string;
  /** Whether `candidateFrom` carries it into the matcher. */
  carried: boolean;
  /** Why. For a withheld field, what ordering by it would amount to. */
  why: string;
}

export const PATIENT_FIELD_CLASSIFICATION: readonly PatientFieldRule[] = [
  {
    field: "id",
    carried: true,
    why: "Carried as `candidateRef`, a pseudonym. The matcher must be able to tell two people apart to break a tie; it must not be able to tell anything else about them.",
  },
  {
    field: "practiceId",
    carried: true,
    why: "Carried, because tenancy is the query rather than a later filter — W123's rule, and the shape whose absence produced Y4-1.",
  },
  {
    field: "usualClinicianId",
    carried: false,
    why: "Withheld. Continuity is a clinical judgement about who should see somebody, and a matcher that knew a usual clinician would be choosing between clinicians for a patient — property one, directly.",
  },
  {
    field: "smsConsent",
    carried: false,
    why: "Withheld. Whether somebody may be contacted is W- eligibility's question and is settled before a candidate exists; carrying it here would let the matcher re-decide it, and a second place a contact rule lives is a place the two disagree.",
  },
  {
    field: "optedOut",
    carried: false,
    why: "Withheld, for the same reason as `smsConsent` and more sharply: an opt-out is terminal for invitations, so a candidate who opted out must not reach the matcher at all rather than reach it and be skipped.",
  },
  {
    field: "lastAttendedAt",
    carried: false,
    why: "Withheld, and it is the most dangerous one because it does not look clinical. 'Longest since last visit' is a proxy for need, it is the ordering a reasonable person reaches for, and W5's ranker uses it today — which is exactly why the matcher cannot see it.",
  },
  {
    field: "futureBookingAt",
    carried: false,
    why: "Withheld. Whether somebody already has an appointment is an eligibility question answered before matching; inside the matcher it would become a reason to prefer somebody, which is an ordering by need wearing a scheduling name.",
  },
  {
    field: "activeRecall",
    carried: false,
    why: "Withheld. A recall is the practice already managing somebody's care — a clinical marker, and ordering by it is ordering by how unwell the record says somebody is.",
  },
  {
    field: "chronicCare",
    carried: false,
    why: "Withheld. Register membership derived from PMS data, and the single clearest clinical attribute on the record. W235 refuses to export it for the same reason.",
  },
  {
    field: "holdout",
    carried: false,
    why: "Withheld. The experiment arm — W201 lists it first among the decisions this tree takes, and a matcher that could see it could act on it, which would make the arm a thing the product responds to rather than a thing it measures against.",
  },
];

/**
 * Ways of writing a re-derivation that is not one, each refused with its reason.
 *
 * Data rather than a comment — W196's shape. The gate's word is RE-DERIVED, and every entry here
 * is a way of producing a document that reads like one.
 */
export const REFUSED_REDERIVATION_SHORTCUTS: Readonly<Record<string, string>> = {
  a_still_true_line:
    "Writing 'still holds' against each property. It is the failure W200's gate was written against: four of its properties survived on their own construction and the fifth had quietly stopped being enforced anywhere, and no amount of re-reading would have told them apart. Every entry here names the Y5 SURFACE that could have broken it and the built thing that stopped it.",
  prose_with_no_assertion:
    "A re-derivation whose claims live only in this file. A claim about the matcher that is not run against the matcher is a claim about what somebody believes the matcher does, and this unit's whole subject is a control that had stopped matching the product.",
  citing_only_old_units:
    "Re-deriving against W134 and W123 rather than against what Y5 added. The old units are why the property exists; the question is whether five quarters of new product moved it. A test requires every entry to cite a Y5 unit.",
  testing_the_four_fields_somebody_remembered:
    "Checking that the matcher ignores `chronicCare` and `activeRecall` and calling that structural. It is the shape of the control before this unit: sound about the fields it names and silent about the eleventh. The classification is checked against the type instead.",
  reading_the_sort_instead_of_running_it:
    "Satisfying 'the order is not a ranking' by reading the comparator. It is right today and says nothing about a comparator somebody changes; permuting the figures and requiring the order not to move is the same claim, checked.",
};

/** The property ids this unit re-derives, for the both-directions check against W200. */
export const REDERIVED_PROPERTY_IDS = Y5_REDERIVATIONS.map((r) => r.propertyId);

/** W200's ids, so the two registers cannot drift apart without a failure. */
export const RAIL_PROPERTY_IDS = RAIL_PROPERTIES.map((p) => p.id);

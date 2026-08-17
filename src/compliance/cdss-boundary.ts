// W200: the G7 boundary, re-derived rather than assumed to have survived Y4.
//
// The Q11 dossier stated four properties the rail enforces, and W150 added a fifth. Each was true
// of the tree that existed when it was written. Y4 then added four quarters of product — verticals,
// outcome auditing, a public directory and reporting to third parties — and the unit's gate is
// explicit that the properties must be RE-DERIVED against that, not carried forward.
//
// Doing it turned up the thing carrying forward would have missed. Property five's enforcement is
// `lintEducationCopy`, and its declared surface is `EDUCATION_COPY_MODULES` — six files, all under
// `src/education/`. Y4 added operator-facing copy in verticals, outcomes, ops, the directory and
// reporting, and **none of it was ever linted**. Not a rule that was weakened; a control that did
// not follow the product. Properties one to four each had a Y4 surface that could have broken them
// and each survived on its own construction, which is what a re-derivation is for; property five
// survived on care, and care is not a control.
//
// SO THE DECLARED COPY SURFACE NOW COVERS EVERY Y4 MODULE, and the register is checked against the
// tree by reading the tree: `Y4_FIRST_UNIT` plus each module's own `// W<n>` header decides
// membership, so a Y4 module added tomorrow fails this unit's test until somebody says what its
// copy is. A hand-kept list of nine modules — which is what this register was on its first pass —
// covers the nine modules somebody remembered.
//
// EACH ENTRY SAYS WHICH EXPORTS AN OPERATOR READS, not which are strings. That distinction is
// load-bearing, because running the advice rules over every string export of Y4 flags eleven
// things and eight of them are the register machinery itself: the words a refusal has to quote in
// order to refuse them, and the reviewer notes explaining why a rule exists. It is the sixth
// instance of the pattern W198 named — a scan whose subject matter is the thing it bans matches
// the sentence doing the banning — and a heuristic would have to grow an exemption per collision.
// A declared surface asks the question that actually decides it: does a clinician or practice
// manager READ this text in the product?
//
// THE THREE REAL HITS ARE ACCEPTED, NOT REWORDED, AND THE RULE IS NOT LOOSENED. All three are in
// copy an operator does read, and the sharpest is `SILENCE_COPY` saying "No action needed", caught
// by `no-action-framing`. The tempting fix is to teach that rule about negation, and it is wrong:
// in W179's silence copy "no action needed" is a fact about a data feed, and in education copy
// "this pathway changed, no action needed" would be a clinical judgement about whether to review
// anybody. Same six characters, opposite meanings, and the difference is the surface — which is
// W192's finding arriving from the other direction. So the rule stays sharp and the acceptance is
// per module, per export, per matched string, with a date on it.
//
// KNOWN BOUND, stated rather than filed quietly: this register reaches EXPORTED copy. Prose
// composed inline inside a render function — `search.ts`'s "Ordered by …" is the clearest case —
// is not reachable by export name, and each entry's `notCopy` is where that has to be said out
// loud until a later unit lints rendered output against fixtures.

import { lintEducationCopy, type AdviceViolation } from "@/education/advice-lint";

/**
 * The first unit of Y4.
 *
 * Y4 is W157–W208. Used to read Y4 membership off each module's own header comment rather than
 * off a list, so the register cannot drift from the tree in the direction that matters — a module
 * arriving without a declaration.
 */
export const Y4_FIRST_UNIT = 157;

/** One of the five properties the CDSS boundary rests on. */
export interface RailProperty {
  id: string;
  /** The property, in the words the dossier used. */
  statement: string;
  /** The units that establish it. */
  establishedBy: readonly string[];
  /** What Y4 added that could have broken it, and why it did not. Re-derived, not carried. */
  y4Rederivation: string;
  /** The test that enforces it, so the property is not merely believed. */
  enforcedBy: string;
}

export const RAIL_PROPERTIES: readonly RailProperty[] = [
  {
    id: "never-selects-a-clinician",
    statement:
      "The product never selects a clinician. It answers 'may this clinician be offered this pathway' — a yes/no per clinician, deliberately not a ranking, because an ordered list of clinicians for a clinical pathway is a recommendation about who is better.",
    establishedBy: ["W123", "W82 (deliberately unused)"],
    y4Rederivation:
      "Y4 built the surface most likely to break this: W189's directory search literally takes a patient's need and returns clinicians. Re-derived rather than trusted — results are ordered by declared attributes with no clinical scoring, the ordering basis renders to the reader so the order is not mistaken for a judgement, W190 gives the clinician removal-only control over what is said about them, and W188 refuses to infer network membership from activity. The strongest new guard is W184/W187 refusing comparative claims in profile copy, which closes the prose route to the same recommendation, and W198 refusing price comparison, which closes the cheapest-first route to it.",
    enforcedBy: "src/directory/search.test.ts and src/directory/copy-lint.test.ts",
  },
  {
    id: "never-decides-care-transferred",
    statement:
      "The product never decides that care transferred. An explicit recorded acceptance is required; there is no timeout, no assumed handover, and no state in which nobody is watching.",
    establishedBy: ["W134", "W142"],
    y4Rederivation:
      "Q14 audits outcomes over that rail, which is where an inferred transfer would now appear. It does not infer one: W170's verdict is a statement about which events were RECORDED, `reached` requires an event evidencing the final stage, and there is no path returning it from an absence. W173's dashboard renders those verdicts and adds no arrival of its own.",
    enforcedBy: "src/outcomes/model.test.ts and src/referrals/acceptance.test.ts",
  },
  {
    id: "never-concludes-from-silence",
    statement:
      "The product never concludes from silence. It reports `unknown` rather than inferring, and reports disagreements between its state machines rather than resolving them.",
    establishedBy: ["W135", "W120"],
    y4Rederivation:
      "Y4 strengthened this rather than eroding it, and the strengthening is worth recording because it is the property most often lost by accident. W170 made `not_recorded` a first-class verdict that is never folded into failure; W179 split a zero into 'nothing happened' and 'nothing arrived', which are opposite operator actions; W171 refuses to report an absent escalation as 'none needed'; and W196 refuses to emit a figure at all over an empty basis, because a 0 sent to a commissioner reads as a fact about care.",
    enforcedBy: "src/outcomes/model.test.ts, src/ops/silence.test.ts, src/reporting/model.test.ts",
  },
  {
    id: "writes-no-clinical-text",
    statement:
      "The product writes no clinical text. G5 governs content Meherr publishes; a GP writing about their own patient is professional communication this product neither generates nor edits.",
    establishedBy: ["W131", "W139"],
    y4Rederivation:
      "Y4 added the two places clinical text could have entered and neither did. Every pathway, interval and education catalogue still ships empty behind G5, so there is no authored clinical content to write, and W191's dermatology vertical is a spec awaiting the same sign-off rather than shipped content. `/clinicians` carries clinical guidance and is the one live tension — W192 classified it professional and flagged the underlying question as the founder's, which is a disclosure decision rather than the product generating text.",
    enforcedBy: "src/compliance/public-surfaces.test.ts and the empty SHIPPED_* registries",
  },
  {
    id: "informs-never-advises",
    statement:
      "The product informs a clinician and never advises about a patient. 'This pathway changed on 3 March; here is what changed' informs; 'you should review this patient against the new criteria' advises, and the second sentence is one word from the first.",
    establishedBy: ["W144", "W150"],
    y4Rederivation:
      "THE ONE THAT DID NOT SURVIVE INTACT — not the property, but its enforcement. W150's declared copy surface is six files under src/education/, and every quarter of Y4 added operator copy outside it that no linter reached: W179's silence copy, W171 and W176's empty-state copy, W173's dashboard, W187 and W198's directory rendering, W196's refusals, W159's contradiction copy in the verticals console. Re-running the advice rules over all of it found no advice about any patient, so the property held; the control did not follow the product. This unit extends the declared surface to every Y4 module, reads membership off the tree rather than a list, and accepts the three operational collisions (W179, W158, W159) by module, export and matched string rather than blunting the rule that caught them.",
    enforcedBy: "src/compliance/cdss-boundary.test.ts (this unit) plus src/education/advice-lint.test.ts",
  },
];

/**
 * Operator-facing copy outside `src/education/`, declared per Y4 module.
 *
 * Every Y4 module appears, including the ones with no copy at all — the test enumerates Y4 from
 * the tree and fails on a module that is missing here, so "no copy" has to be SAID. An empty
 * `operatorCopy` with a reason is a declaration; an absent module is an oversight, and the two are
 * indistinguishable in a register that only lists what it covers.
 */
export interface CopySurface {
  module: string;
  /** Exports an operator reads. Linted. */
  operatorCopy: readonly string[];
  /** Why the module's other strings are not operator copy. */
  notCopy: string;
}

export const OPERATOR_COPY_SURFACES: readonly CopySurface[] = [
  {
    module: "src/capacity/opening.ts",
    operatorCopy: ["OPENING_REFUSAL_COPY"],
    notCopy:
      "REFUSED_OPENING_FIELDS is reviewer-facing — it argues, field by field, why a suggestion about a diary must not carry a person, and necessarily names the fields it refuses. `renderOpening` composes from counts and from the refusal copy.",
  },
  {
    module: "src/capacity/calendar.ts",
    operatorCopy: ["CALENDAR_REJECTION_COPY"],
    notCopy:
      "REFUSED_SEASONALITY is reviewer-facing — it argues, adjustment by adjustment, why a seasonal factor is not derived here, and necessarily names the ones it refuses. SHIPPED_HOLIDAYS is empty, and a holiday's own name and citation are gazette text rather than copy this product writes.",
  },
  {
    module: "src/capacity/forecast.ts",
    operatorCopy: ["FORECAST_REFUSAL_COPY"],
    notCopy:
      "`renderForecast` composes its sentence from counts, the recorded period and FORECAST_REFUSAL_COPY. MIN_RECORDED_WEEKS is a number. The joining prose is the known bound in W200's note, and it is checked instead by this unit's own test, which refuses any verb claiming to know the future.",
  },
  {
    module: "src/compliance/cdss-boundary.ts",
    operatorCopy: [],
    notCopy:
      "This register. Every string in it is written to a reviewer, and it necessarily quotes the advice language it is about — RAIL_PROPERTIES states the sentence that would count as advising in order to forbid it.",
  },
  {
    module: "src/compliance/public-surfaces.ts",
    operatorCopy: [],
    notCopy:
      "W192's sweep register. PUBLIC_SURFACES describes routes to a reviewer and ACCEPTED_FINDINGS quotes the exact matched text of each acceptance, which is the point of recording the match.",
  },
  {
    module: "src/directory/copy-lint.ts",
    operatorCopy: ["DIRECTORY_RULE_COPY"],
    notCopy:
      "NAME_WORD_EXCLUSIONS holds the banned words themselves, and FIELD_LINTING is a per-field disposition read by a reviewer.",
  },
  {
    module: "src/directory/correction.ts",
    operatorCopy: ["CORRECTION_COPY", "CORRECTION_EFFECT", "CORRECTION_REFUSAL_COPY"],
    notCopy:
      "REFUSED_CORRECTIONS explains to a reviewer why a control does not exist, and says the word 'specialist' in order to refuse it.",
  },
  {
    module: "src/directory/disclosure.ts",
    operatorCopy: ["DISCLOSURE_CAVEATS"],
    notCopy:
      "DISCLOSED_FIELDS and CLINICIAN_RECORD_CLASSES are W106-style classifications written for a reviewer, and they name the fields they refuse.",
  },
  {
    module: "src/directory/fees.ts",
    operatorCopy: ["BILLING_COPY", "FEE_REFUSAL_COPY"],
    notCopy:
      "FEE_RULE_COPY and REFUSED_FEE_FIELDS explain to a REVIEWER why a rule exists; RATING_RULE_OVER_BROAD is an engineering note filed for the next hardening week. None of the three renders to an operator, and all three necessarily quote the language they are about. The rendered caveat is checked by fees.test.ts through `lintFeeText`, which is the stricter directory rule set.",
  },
  {
    module: "src/directory/membership.ts",
    operatorCopy: ["MEMBERSHIP_BASIS_COPY", "JOIN_REFUSAL_COPY"],
    notCopy: "REFUSED_BASES is reviewer-facing, explaining why activity is not a membership basis.",
  },
  {
    module: "src/directory/profile.ts",
    operatorCopy: [],
    notCopy:
      "PROFILE_FIELDS and REFUSED_FIELDS are the field register and its refusals, both written to a reviewer. Profile copy itself is practice-supplied and linted at entry by copy-lint.",
  },
  {
    module: "src/directory/render.ts",
    operatorCopy: ["PROFESSION_COPY", "SCOPE_FRAMING", "REGISTRATION_FRAMING"],
    notCopy:
      "SPECIALIST_NOT_PUBLISHED is a refusal record — a rule name and the matched specialty — carried in a violation rather than rendered, and it holds the word 'specialist' because that is what it refuses. REGISTRATION_WORDS is vocabulary.",
  },
  {
    module: "src/directory/search.ts",
    operatorCopy: ["ORDERING"],
    notCopy:
      "REFUSED_SEARCH_FIELDS is reviewer-facing and names the fields it refuses, 'urgent' among them. `orderingBasis` composes its sentence inline from ORDERING's `describe` fields — the known bound in the module note; the parts are linted, the joining prose is not.",
  },
  {
    module: "src/engine/arm-stability.ts",
    operatorCopy: [],
    notCopy: "A test helper comparing experiment arms. No strings but identifiers and failure messages.",
  },
  {
    module: "src/matching/match.ts",
    operatorCopy: [],
    notCopy:
      "W214's matcher decides; W213's `MATCH_REASON_COPY` is where every sentence a practice reads about a decision lives, and this module composes nothing of its own. `REASONS_THIS_MATCHER_PRODUCES` holds reason identifiers, not prose.",
  },
  {
    module: "src/ops/silence.ts",
    operatorCopy: ["SILENCE_COPY"],
    notCopy:
      "CAUSE_ORDER is the cause enum in resolution order, and `explainSilence` picks an entry of SILENCE_COPY rather than writing anything of its own. Every rendered word in this module is in the declared export.",
  },
  {
    module: "src/outcomes/agreement.ts",
    operatorCopy: ["AGREEMENT_ANSWER_COPY"],
    notCopy: "DISAGREEMENT_BASES names the comparisons; the report renderer composes from the copy and counts.",
  },
  {
    module: "src/outcomes/audit-export.ts",
    operatorCopy: ["AUDIT_EXPORT_CAVEATS"],
    notCopy:
      "CONFIGURATION_KINDS is a kind list. The caveats are operator copy in the strongest sense — W149's rule is that they travel with the export, away from the product that would explain them.",
  },
  {
    module: "src/outcomes/attribution-v2.ts",
    operatorCopy: ["NOT_ATTRIBUTABLE_PER_KIND"],
    notCopy:
      "REFUSED_SCOPES is reviewer-facing — it argues, scope by scope, why a figure does not exist, and names the tempting ones in order to refuse them. The renderer composes from counts and from the one caveat that does render.",
  },
  {
    module: "src/outcomes/dashboard.ts",
    operatorCopy: ["DASHBOARD_BASIS", "SETTLEMENT_ASK_COPY"],
    notCopy:
      "REFERRAL_CHAIN holds event-kind identifiers, not prose, and `describeAsk` composes its sentence from SETTLEMENT_ASK_COPY and the stage that is missing.",
  },
  {
    module: "src/outcomes/escalation-monitor.ts",
    operatorCopy: ["EMPTY_REASON_COPY"],
    notCopy:
      "The remaining exports are functions and the report renderer, whose output is assembled from EMPTY_REASON_COPY and counts.",
  },
  {
    module: "src/outcomes/model.ts",
    operatorCopy: ["OUTCOME_VERDICT_COPY"],
    notCopy: "`summarise` composes its basis sentence from counts; the rest are types and folds.",
  },
  {
    module: "src/outcomes/response-graph.ts",
    operatorCopy: ["SPINE_NOT_RESPONSES"],
    notCopy:
      "SPINE_RESPONSE_KINDS is a translation table of event identifiers. The rendered graph composes from counts, W211's absence copy and the per-kind reasons in SPINE_NOT_RESPONSES, which is the only prose the module authors itself.",
  },
  {
    module: "src/outcomes/time-to-escalation.ts",
    operatorCopy: ["NO_MEASUREMENT_COPY", "WHY_NO_TARGET"],
    notCopy: "The renderer composes from those two and from measured day counts.",
  },
  {
    module: "src/privacy/console-export.ts",
    operatorCopy: ["SCOPED_EXPORT_NOTE"],
    notCopy:
      "The rest is the projection and its refusals. `SCOPED_EXPORT_NOTE` IS operator copy and is the only string here a practice manager reads: it sits above the export on `/console/privacy` and says that records held by another practice are not shown and are not counted. It is on the module rather than in the page so the page cannot describe the scoping in words of its own, and so the sweep reaches it — W200's own known bound is that prose composed inline in a render function is not reachable by export name. `REFUSED_SCOPING_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the author-scoped referral, the withheld-record count and the fix-it-in-the-page shortcut it exists to forbid.",
  },
  {
    module: "src/privacy/automated-decisions.ts",
    operatorCopy: [],
    notCopy:
      "W201's ADM notice, and the one module here whose copy is read by a PATIENT rather than an operator — so it answers to W192's sweep at the `patient_notice` audience, which `automated-decisions.test.ts` runs over exactly this text, and not to the advice rules. The distinction is not a dodge, it is the finding: `lintEducationCopy` bundles W6's patient-MESSAGE vocabulary, and a legal notice must say the words a message may not. Running it here flags five strings and all five are the notice refusing the thing — \"not a judgement about whether you need to be seen\", \"no diagnosis\", \"no list of who is most at risk\", \"does not read your test results\". Seventh instance of W198's pattern, and the second time the answer is the audience rather than the string. NOT_A_DECISION is reviewer-facing besides, naming decisions in order to rule them out.",
  },
  {
    module: "src/quality/latent-findings.ts",
    operatorCopy: [],
    notCopy:
      "W210's register of findings that are not yet defects. Every string is written to whoever reads the register — the defect, and the condition that would make it live — and it quotes the language of the defects it describes, PRIV-3's cross-practice reads among them.",
  },
  {
    module: "src/quality/order-independence.ts",
    operatorCopy: [],
    notCopy:
      "W167's fold register. Every string is a rationale addressed to whoever reads the register, and it argues about guarantees, which is why the benefit vocabulary matches it.",
  },
  {
    module: "src/quality/order-regressions.ts",
    operatorCopy: [],
    notCopy:
      "W178's regression corpus: the failures themselves, described to an engineer. It quotes the wording of past defects on purpose.",
  },
  {
    module: "src/reporting/model.ts",
    operatorCopy: ["FIGURE_REFUSAL_COPY"],
    notCopy:
      "REFUSED_FIGURES and AGGREGATION_FLOORS' `why` fields argue a threshold and a refusal to somebody reviewing them, not to an operator, and the floor rationales describe overdue intervals in order to explain the re-identification risk.",
  },
  {
    module: "src/reporting/suppression.ts",
    operatorCopy: [],
    notCopy:
      "NESTED_KINDS is a kind list and REFUSED_SUPPRESSION_TREATMENTS is reviewer-facing. `renderSuppressedReport` composes inline from figure kinds and the suppression marker — the known bound in the module note.",
  },
  {
    module: "src/reporting/report.ts",
    operatorCopy: ["REPORT_CAVEATS", "KIND_LABELS"],
    notCopy:
      "The remaining exports assemble and render the document. `REPORT_CAVEATS` and the coverage sentences are read by a practice manager, and they describe what the record holds and what it does not — never a patient, a condition or a next clinical step.",
  },
  {
    module: "src/reporting/retention.ts",
    operatorCopy: [],
    notCopy:
      "W204 declares how long a produced report lives. Every export here is reviewer-facing: `REPORT_RETENTION` and `PROPOSED_DISCLOSURE_LOG` argue a retention posture to somebody auditing it, and `REPORTING_ARTEFACTS` is a checklist of what this product does and does not keep. None of it reaches an operator, and none of it describes anybody's care.",
  },
  {
    module: "src/matching/explain.ts",
    operatorCopy: ["MATCH_REASON_COPY", "MATCH_FLOOR_BREACH_COPY"],
    notCopy:
      "The remaining exports are the reason union, the candidate projection and the floor check. `MATCH_REASON_COPY` is the sentence a practice manager reads about one appointment offer and `MATCH_FLOOR_BREACH_COPY` tells a reviewer why a plan was refused. Both are about capacity, recorded availability and practice-set limits; a test asserts neither can name a condition, a symptom or an urgency, because a reason is the one place a matcher gets to say WHY in words somebody reads.",
  },
  {
    module: "src/interop/ereferral.ts",
    operatorCopy: ["PROFILE_VOCABULARY", "PROFILE_REFUSAL_COPY"],
    notCopy:
      "The remaining exports are the code tables, the unmapped register and the renderer. `PROFILE_VOCABULARY` is the CLOSED SET of strings this module may originate — every one is about the document rather than about a patient, and the narrative-absent sentence exists so a receiving system can tell a clinician who wrote nothing from a system that sends nothing. `REFUSED_PROFILE_CONTENT` is reviewer-facing and necessarily describes the clinical prose it forbids. A test re-derives the property over a rendered profile: every string is a declared vocabulary member, a declared code, an identifier copied from the input, or text a clinician wrote.",
  },
  {
    module: "src/capacity/drift.ts",
    operatorCopy: ["DRIFT_VERDICT_COPY", "DRIFT_DIRECTION_COPY"],
    notCopy:
      "The remaining exports compute the verdict and render it. Both copy maps are read by a practice manager: what it means that a session's range has stopped fitting, which direction it moved, and — stated rather than implied — that nothing has been adjusted. None of it names a patient, a condition or a clinical step, and every string passes W226's capacity linter.",
  },
  {
    module: "src/interop/disclosure-ledger.ts",
    operatorCopy: ["DISCLOSURE_REJECTION_COPY"],
    notCopy:
      "The remaining exports are the ledger's types, the shipped (empty) list, the payload-mode switch and the consequences derived from it. `DISCLOSURE_REJECTION_COPY` is read by whoever wrote an incomplete disclosure row — why a row with no author, no period or figures disagreeing with the declared mode is refused. It describes a record of what left a practice, never a patient or a clinical step. `OPEN_QUESTION` and `MODE_CONSEQUENCES` are addressed to the founder deciding W204's question and `REFUSED_LEDGER_BEHAVIOURS` quotes the behaviours it forbids, so all three are reviewer-facing in W200's split.",
  },
  {
    module: "src/interop/exchange-state.ts",
    operatorCopy: ["EXCHANGE_STATE_COPY", "RETRY_VERDICT_COPY"],
    notCopy:
      "The remaining exports are the state and outcome unions, the declared outcome mapping and the two verdict functions. Both copy maps are read by whoever is looking at an exchange that did not come back: what is actually known about it — nothing left, it left and nothing came back, it was refused, it was confirmed — and whether sending again could duplicate a document at the other end. All of it describes a transport boundary and a document, never a patient or a clinical step. `OUTCOME_MAPPING` and `REFUSED_READINGS` are reviewer-facing in W200's split, because their whole content is arguing the readings they reject.",
  },
  {
    module: "src/interop/credentials.ts",
    operatorCopy: ["CREDENTIAL_REFUSAL_COPY"],
    notCopy:
      "The remaining exports are the declared connection slots, the (empty) credential list, the loader that always refuses, the live-connection constant and the literal scanner. `CREDENTIAL_REFUSAL_COPY` is read by whoever tried to connect this product to a real practice system — that no credential can be loaded, that the refusal is the loader's rather than a consequence of an empty list, and that G1 is a founder decision nobody has taken. It describes a gate, never a patient or a clinical step. `REFUSED_CREDENTIAL_POSTURES` is reviewer-facing in W200's split, since it exists to quote the mistakes it forbids.",
  },
  {
    module: "src/verticals/assembly.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W248's shared vertical machinery exports an evidence reader, a spec builder, two assembly calls and a gate list — no strings a clinician or practice manager reads. The one descriptive field it defines, `DeclaredMember.waitsOn`, holds text supplied by each vertical and is linted there, at the declaration, which is where the text actually exists.",
  },
  {
    module: "src/compliance/composed-copy.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W278 closes the bound this very register states about itself — prose composed inside a function body, unreachable by export name — and every string in it is addressed to whoever adds a render function: each site's `composes` says what it composes and for whom, `FIXTURE_BOUND` says which five of the eighteen are driven with real inputs and why the other thirteen are not, and the acceptance carries the argument for one word on one surface. `REFUSED_COMPOSED_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the hand-kept list, the character count and the invented fixture it exists to forbid. NOTE, because it is the interesting property: this module is now inside its OWN sweep's population, and its detector finds no composing function here — nothing in it returns prose.",
  },
  {
    module: "src/compliance/copy-y6.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W270's re-derivation of this register at the Y6 boundary: the year bands, the declared floor and the argument for where it sits, and the door for bringing a pre-floor surface in. Nobody but a developer reads it, and FLOOR_RATIONALE is the one long string — an argument about a scan's false-positive ratio, addressed to whoever next proposes sweeping backwards.",
  },
  {
    module: "src/console/zero-states.ts",
    operatorCopy: ["ZERO_STATE_COPY"],
    notCopy:
      "`ZERO_STATE_COPY` IS operator copy — three headlines, details and actions a practice manager reads on an empty console page — and it is declared here so the advice rules reach it, which is the whole reason W179's `SILENCE_COPY` is in this register too. The rest is the per-route classification and its arguments, addressed to whoever adds a console route: each entry says which zeros that route can show and why, and `RUNTIME_BOUND` says what the unit could not check. `REFUSED_ZERO_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the three-names-one-sentence collapse and the detector tuned until it agrees, both of which it exists to forbid.",
  },
  {
    module: "src/console/results-copy.ts",
    operatorCopy: ["RESULTS_COPY"],
    notCopy:
      "W42's practice-facing results page, brought into this register by W270's door — it is the clearest case of copy an operator reads that no register reached in four years. Every string in the module is that copy, so nothing here is excluded.",
  },
  {
    module: "src/pathways/approval.ts",
    operatorCopy: ["PATHWAY_REFUSAL_COPY"],
    notCopy:
      "SHIPPED_ATTESTATIONS is pinned empty behind G5 and holds no text a reader sees; the remaining exports run W119's two-person sign-off and produce branded values rather than sentences.",
  },
  {
    module: "src/registers/escalation.ts",
    operatorCopy: ["SHIPPED_TRIGGERS"],
    notCopy:
      "The remaining exports route a patient to their usual GP and return a declared EscalationRoute; the copy is the text of the four shipped triggers, which practice staff read on the escalation queue.",
  },
  {
    module: "src/audit/usefulness.ts",
    operatorCopy: ["USEFULNESS_OPTIONS"],
    notCopy:
      "The remaining exports record and aggregate what a clinician answered; the copy is the option labels the clinician picks from.",
  },
  {
    module: "src/quality/blocked-surface.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W263's blocked-surface budget is reviewer-facing and, above that, founder-facing: for each founder gate or named decision the ledger blocks a row on, whose ruling it is and which units it would release. Nobody in a practice reads it. Its longest strings are the `whoDecides` sentences, which describe rulings and their double-blocking and name no patient, condition or appointment reason. `blockedSurfaceViolations` returns unit ids and blocker names, never a record about anybody.",
  },
  {
    module: "src/quality/tree-walks.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W282's tree-derivations: seven walks, each taking a root, moved out of the test files that owned them so the registers built on them can be shown a file arriving. It returns file paths and function names and nothing else — no patient, condition or appointment reason appears in it, and it has no strings a clinician or practice manager reads.",
  },
  {
    module: "src/demo/clinicians.ts",
    operatorCopy: ["clinicians"],
    notCopy:
      "The type is the only other export and it is compile-time. Everything else in this module IS copy, which is the point of declaring it: 731 strings across every card the finder and demo render — names, focus lines, match lines, about paragraphs, experience, practical signals. It is the largest body of patient-facing prose in the tree and no copy control had read one word of it until W281 stamped its header. Every clinician is SYNTHETIC; no real practitioner is described.",
  },
  {
    module: "src/demo/care-archetypes.ts",
    operatorCopy: ["careArchetypes"],
    notCopy:
      "Nothing. Every export here is copy — the archetype titles, eyebrows, the patient's own words for what they are looking for, and the headline the finder shows back. 148 strings, synthetic throughout: no real person's request is reproduced. Declared at W281 with the module it feeds.",
  },
  {
    module: "src/interest/types.ts",
    operatorCopy: ["INTEREST_REASONS"],
    notCopy:
      "The remaining exports are types. `INTEREST_REASONS` is the three options a visitor ticks on the public community form, so it is rendered copy by any reading — and it had been covered by nothing since the form was built outside the unit loop in 2026.",
  },
  {
    module: "src/interest/store.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and checked rather than assumed — the lint found no reachable string in any export. This is the append-only signup store: it reads and writes JSONL, neutralises spreadsheet formulas on the way in, and returns records. It is declared because a module without a header is not clean but INVISIBLE, and W281's rule is that the census sees every module and then says which hold copy.",
  },
  {
    module: "src/quality/pins.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W290's pin register: every constant whose name follows the tree's pin conventions, what event moves it, and whether that event deserves to stop a build. Nobody but a developer reads it. Its longest strings are the arguments attached to each classification and a six-entry history of pins that went red on planned events; no patient, condition or appointment reason appears in it.",
  },
  {
    module: "src/quality/review-w279.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W287's review record for W279: the findings, their dispositions, and the register of console routes whose read can fail. Nobody but a developer reads it. Its longest strings are the finding about `/console/interest` reading a JSONL file and the remedy for it; no patient, condition or appointment reason appears in any of them, and it computes nothing about anybody — its input is an import graph.",
  },
  {
    module: "src/quality/hardening-q22.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W285's Q22 hardening record: each finding from the three review lenses, the unit it belongs to, its disposition and date, and which units the pass did and did not read. Nobody but a developer reads it. Its longest strings are the findings themselves — about a branch condition, a line-ending conversion and a duplicated regex — and no patient, condition or appointment reason appears in any of them.",
  },
  {
    module: "src/quality/page-suite.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W275's register of what the verify gate runs: which page specs are in it, which are excluded and why, and the four ways a spec can be dropped without anybody editing the register. Nobody but a developer reads it. Its strings are script names, Playwright config tokens and violation lines; no patient, condition or appointment reason appears in it.",
  },
  {
    module: "src/quality/unit-headers.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W281's header door: which modules carry a `// W<n>` header, which record their unit somewhere the census cannot read, and which name a unit the ledger does not have. Nobody but a developer reads it. Its strings are the rule itself and violation lines naming a module and a unit number; no patient, condition or appointment reason appears in it.",
  },
  {
    module: "src/quality/ranker-behaviour.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the reason is worth stating because this module is CLOSER to a clinical surface than most: it is the behavioural probe MATCH-1 uses to ask whether the invitation ranker orders on `chronicCare`. It reads the flag, so a reader could reasonably wonder. It never renders anything. Its output is two booleans and its strings are refusal messages for a developer holding a fixture that proves nothing — `the panel is not tied`, `did not return a permutation`. The four patients it constructs are synthetic, have no name, no condition and no appointment, and exist only to be handed to a sort function and thrown away. Nothing here describes a patient to anybody or suggests a next clinical step."
  },
  {
    module: "src/quality/latent-y5.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W268's re-derivation of W210's latent-finding register is reviewer-facing: for each open finding, the claim about the tree that must hold for its predicate to be ABLE to fire, and what a dead anchor would cost. Nobody but a developer reads it. Its longest strings are those `ifDead` arguments, which describe predicates and file layouts and name no patient, condition or appointment reason. Its functions return finding ids and anchors, never a record about anybody.",
  },
  {
    module: "src/quality/route-coverage.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W284 records which spec opens each of the fifty routes this app serves, and every string in it is a file name, a route path or an argument addressed to whoever adds a route — nothing here is rendered and no practice sees it. `REFUSED_COVERAGE_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the call-shaped scan, the prefix match and the unresolved citation it exists to forbid, including the one this unit's own first draft got wrong.",
  },
  {
    module: "src/quality/register-census.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W267's register of registers is reviewer-facing throughout: it enumerates the twenty-seven files that derive something from the tree, says what each derives and what it checks that against, and records whether its WALK has ever been shown to notice a file arriving. Nobody but a developer reads it. Its longest strings are the remedy sentences attached to each unproven walk — instructions to whoever fixes one, about a `root` parameter — and its `derives` fields name modules and registries. No patient, condition or appointment reason appears anywhere in it, and it computes nothing about anybody: its only input is the file tree and its only output is a list of file paths.",
  },
  {
    module: "src/privacy/access-y5.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W266's access register is reviewer-facing: for each record class W106 marks held or derived, whether the access export carries it and under which field, or the argument for why it does not. Nobody but a developer or an auditor reads it. Its longest strings are those arguments — including one sentence, shared by all seven derived classes, about why a reading recomputed at read time is not a record the practice holds. It names no patient, condition or appointment reason, and its functions return module names rather than records.",
  },
  {
    module: "src/privacy/erasure-y5.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W265's erasure register is reviewer-facing: for each record class W106 marks `stored`, it says how `deletePatientEverywhere` reaches it, or argues why it is deliberately kept (the deletion records and the suppression list, which must outlive the data they are about) or keyed on a different subject (community signups, whose people are not patients). Nobody but a developer or an auditor reads it. Its longest strings are those two arguments; they describe erasure machinery and name no patient, condition or appointment reason. `residualHits` and `captureStores` return store names, never contents.",
  },
  {
    module: "src/privacy/adm-y5.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W258's re-derivation of W201's decision register against Y5 is reviewer-facing throughout: ADM_REDERIVATIONS argues, claim by claim, what Y5 added that could have broken each property of the register and what actually happened — including three that broke. Nobody but a reviewer reads it. The copy a patient reads lives in `src/privacy/automated-decisions.ts`, which W200 declares separately as answering to W192's patient_notice sweep rather than to the advice rules, and W258 moved the notice\u2019s heading, standing paragraph and review line INTO that register precisely so the sweep reaches them \u2014 they were the only text on the published notice the page still wrote itself.",
  },
  {
    module: "src/verticals/scale.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W252's scale harness generates synthetic verticals and times how long the registers take to assess them; nobody reads its output but a developer running the suite. SYNTHETIC_WAITS_ON is one sentence attached to a generated member that describes nothing and will never be signed off, and WHAT_THE_NUMBER_IS_NOT is reviewer-facing — it argues, limit by limit, what a wall-clock measurement is not evidence of, which is the opposite of a claim about care. Both are run through lintLandingCopy and lintMessageText by this module's own test. The generator produces no member of the `interval` kind and no interval evidence, because an interval carries a cadence and a synthetic cadence would be a fabricated clinical claim.",
  },
  {
    module: "src/verticals/respiratory.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, on the same argument as the other two verticals. W250 declares which members a respiratory vertical would need and which founder gate blocks each — as a declared VALUE alongside the sentence, which is the defect this unit found in the prose-only version. The `waitsOn` notes are governance addressed to a founder rather than copy in the product, and every one is run through `lintLandingCopy` and `lintMessageText` by this vertical's own test. Nothing here says what a member is FOR; the type has no field to hold it. The condition word scan is this vertical's own, because a respiratory scope's tempting vocabulary is neither dermatology's nor women's health's — which is the third reason a shared word list would have been the wrong shape.",
  },
  {
    module: "src/verticals/womens-health.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness IS the classification. W248 declares which members a women's health vertical would need and which gate each waits on; the `waitsOn` notes are governance addressed to a founder, not copy in the product, and every one is run through `lintLandingCopy` and `lintMessageText` by this vertical's own test. Nothing here says what a member is FOR — that sentence is the clinical content G5 gates, and the type has no field to hold it. A test also scans the module for condition, procedure and cadence vocabulary, tighter than dermatology's list because the tempting words in this scope read like service categories rather than like clinical claims.",
  },
  {
    module: "src/interop/conformance.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification rather than an omission. W237 is a test harness: `FIXTURE_REJECTION_COPY` is read by whoever wrote a bad fixture, and `WHAT_THIS_PROVES` / `WHAT_THIS_DOES_NOT_PROVE` are addressed to a reviewer deciding how much a green run is worth. No clinician or practice manager sees any of it in the product, so linting it as operator copy would be W200's own category error — and these strings QUOTE what they warn about ('no receiving system has ever seen any of this'), which is the collision that split this register in the first place. The remaining exports are pure detectors and the contract itself.",
  },
  {
    module: "src/api/scopes.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W254 models what a MACHINE caller would be permitted to read, and nobody in the product reads any of it: each scope's `grants` sentence is addressed to whoever is granting a token, and `TOKEN_REFUSAL_COPY` is one line a developer gets instead of a credential. `REFUSED_SCOPE_SHAPES` is reviewer-facing in W200's split for the usual reason — its prose QUOTES the wildcard, the write scope and the retroactive widening it exists to forbid, and that collision already moved one of this unit's own source scans. The remaining exports are the scope union, the register, the pure permission check and a token issuer that always refuses.",
  },
  {
    module: "src/quality/g1-rehearsal.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W262 drives the first-connection path while every credential is still refused, and nobody in the product reads any of it: the stage observations are diagnostic strings a reviewer reads in a trace, and `WHAT_THIS_DOES_NOT_PROVE` is addressed to whoever would otherwise quote a green rehearsal as evidence that an integration works. `REFUSED_REHEARSAL_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the shortened walk, the boolean return and the faked credential it exists to forbid. The remaining exports are the stage union, the walk and the trace reader.",
  },
  {
    module: "src/sim/fleet-y5.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W269 runs fifty synthetic practices through the Y5 surfaces and reports numbers; every string in it is addressed to whoever reads a budget violation — `checkY5FleetBudgets` returns sentences like `p95 capacity 300.0ms > 250ms` because a boolean cannot be acted on, and the two share violations name the defect each end would mean. No clinician or practice manager sees any of it, and nothing here renders. `REFUSED_Y5_FLEET_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the carried-over cost envelope, the ceiling-only share and the fleet with nothing to refuse that it exists to forbid.",
  },
  {
    module: "src/security/page-reach.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W271 declares what each kind of route may and must reach, and every string in it is addressed to whoever adds a route or an import — the class explanations say what a public page or a console page is FOR, and each dormant entry says why a module must stay off every request path and what would legitimately bring it back. No clinician or practice manager sees any of it. `REFUSED_REACH_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the per-route matrix, the deny-list and the aggregate walk it exists to forbid.",
  },
  {
    module: "src/quality/g5-rehearsal.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W264 drives W119's two-person sign-off on content that means nothing, and no operator sees any of it: the stage observations are diagnostic strings a reviewer reads in a trace, and each refusal scenario is a sentence explaining an arrangement to whoever reads the drive. `SYNTHETIC_CRITERIA` carries the only strings that could be mistaken for copy, and they are the fixture rather than the product — their rationales say they stand for nothing and the test lints them with W121's clinical vocabulary check. `WHAT_THIS_DOES_NOT_PROVE` and `REFUSED_G5_REHEARSAL_SHAPES` are reviewer-facing in W200's split for the usual reason: their content QUOTES the plausible clinical fixture, the seeded registry and the single-refusal walk they exist to forbid.",
  },
  {
    module: "src/quality/gate-readiness.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W261 says what this tree DOES on the day a founder gate is answered, and it is addressed to that founder and to whoever does the work — no clinician or practice manager sees any of it in the product. Each `onTheDay` describes what becomes buildable and what remains blocked; each step is an instruction naming a file. `REFUSED_READINESS_SHAPES` is reviewer-facing in W200's split for the usual reason: its content is QUOTING the step-with-no-file, the effort estimate and the ordering it exists to forbid, and one of its entries describes pinning a count in order to refuse it.",
  },
  {
    module: "src/compliance/rail-y5.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification — this is the fourth register in this tree whose subject matter is the thing it forbids. W259 re-derives the five rail properties against Y5 for a reviewer deciding whether the boundary still holds, and no clinician or practice manager sees any of it in the product. `Y5_REDERIVATIONS` names, per property, the Y5 surface that could have broken it; `PATIENT_FIELD_CLASSIFICATION` says of every field on `Patient` whether the matcher may see it AND what ordering by it would amount to, which necessarily describes clinical markers in order to withhold them; and `REFUSED_REDERIVATION_SHORTCUTS` quotes the 'still holds' line it exists to prevent. Linting any of it as operator copy would be W200's own category error on the file that re-derives W200.",
  },
  {
    module: "src/api/refusals.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W255 governs what the platform API says instead of data, which is read by a practice's own developer over HTTP rather than by a clinician or practice manager in the product — and the copy itself lives in `API_REFUSAL_COPY` on `src/api/surface.ts`, which this module looks up rather than restates. `REFUSAL_BRANCHES` and `REFUSED_ERROR_BEHAVIOURS` are reviewer-facing in W200's split: their `saysNoMore` and reason columns exist to QUOTE the exception forwarding, the detail field and the stack trace they forbid, including the `Patient ${id} not found` shape that is the whole reason the unit exists. The remaining exports are the single refusal producer, the wrapped read and the patient-marker scan.",
  },
  {
    module: "src/api/surface.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W253's API is read by a practice's own developer over HTTP, not by a clinician or a practice manager in the product: `API_REFUSAL_COPY` is three sentences a caller gets instead of data, and every endpoint `summary` describes what a call returns. `REFUSED_API_SHAPES` is reviewer-facing in W200's split for the usual reason — its content is QUOTING the practice parameter, the write verb and the vacuous exclusion test it exists to forbid, and one of its entries had already collided with this unit's own source scan. The remaining exports are the context type, the endpoint register, the envelope and the dispatcher lookup.",
  },
  {
    module: "src/interop/console.ts",
    operatorCopy: ["INTEROP_CONSOLE_COPY", "WHAT_THIS_PAGE_CANNOT_SHOW"],
    notCopy:
      "The remaining exports are the view-model, the ledger-state inverse and the blocker derivation. `INTEROP_CONSOLE_COPY` and `WHAT_THIS_PAGE_CANNOT_SHOW` are what a practice manager reads on `/console/interop`: that nothing has been ATTEMPTED rather than that nothing was exchanged, that an unanswered exchange is neither a delivery nor a failure, that there is nothing to press because sending again may duplicate a clinical document at the other end, and — the one this surface exists for — that a list built from what LEFT can never show a failure to send. Every sentence is about this practice's own outbound records and the state of a connection; none names a patient, a condition or a clinical step, and a test runs all of them through W6's shared linter. `REFUSED_CONSOLE_BEHAVIOURS` is reviewer-facing in W200's split, since its content is naming the retry control and the delivered column it exists to forbid.",
  },
  {
    module: "src/interop/consent-to-disclose.ts",
    operatorCopy: ["CONSENT_VERDICT_COPY", "SCOPE_MISMATCH_COPY"],
    notCopy:
      "The remaining exports are the act union, the scope matcher and the single branded producer. `CONSENT_VERDICT_COPY` and `SCOPE_MISMATCH_COPY` are the sentences practice staff read when W243 declines to send: this patient recorded nothing, this patient withdrew, this patient's agreement has an end date, or — the one this unit exists for — this patient agreed to something else. Every string is about what a patient recorded and what a disclosure covers, never about their condition, their care or a next clinical step. `REFUSED_CONSENT_SOURCES` and `OUT_OF_SCOPE_HERE` are reviewer-facing in W200's split for the usual reason: their whole content is QUOTING the manufactured consents they forbid, starting with reusing this tree's own `smsConsent`.",
  },
  {
    module: "src/interop/terminology.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W238 binds local catalogue codes to SNOMED CT-AU and LOINC, and nobody in the product reads any of its strings: `BINDING_REJECTION_COPY` is addressed to whoever is filling the catalogue with a release open in front of them, and the `copy` a refusal carries is read by a reviewer looking at why a document went out without a coded concept. `REFUSED_BINDING_STRATEGIES` is reviewer-facing in W200's split for the same reason `REFUSED_MAPPINGS` is — its whole content is QUOTING the fake bindings it forbids, including deriving a condition code from recorded fact codes, so linting it as operator copy would flag the register for naming the thing it exists to prevent. The remaining exports are the system URIs, the (empty) catalogue, the loader and the single branded producer.",
  },
  {
    module: "src/interop/fhir.ts",
    operatorCopy: ["STATUS_REFUSAL_COPY"],
    notCopy:
      "The remaining exports are the mapping tables, the resource builders and the round-trip readers. `STATUS_REFUSAL_COPY` is the one sentence a person reads here: why an unfilled bookable slot cannot be exported as a FHIR Appointment. It describes a resource model, not a patient or a clinical step. `RESOURCE_MAPPINGS` and `REFUSED_MAPPINGS` are reviewer-facing in W200's split — their `why` and `wouldBecome` columns exist to QUOTE the mistakes they forbid, including the Condition mapping that would be a clinical assertion, so linting them as operator copy would flag the register for naming the thing it exists to prevent.",
  },
  {
    module: "src/capacity/attribution.ts",
    operatorCopy: ["CAPACITY_EFFECT_WITHHELD_COPY"],
    notCopy:
      "The remaining exports are the arm types, the shipped (empty) trial list, the session floor and the effect calculation. `CAPACITY_EFFECT_WITHHELD_COPY` is the sentence a practice reads when this product declines to say whether opening slots helped — no trial run, a split recorded after the sessions, an arm too thin, or a session with nothing recorded against it. Every one is a statement about what can be measured, never about a patient or a clinical step. `REFUSED_CAPACITY_COMPARATORS` is reviewer-facing in W200's split, since its whole content is naming the confounded comparisons it exists to forbid.",
  },
  {
    module: "src/capacity/console.ts",
    operatorCopy: ["CAPACITY_CONSOLE_COPY", "NO_DIARY_WOULD_SETTLE_IT"],
    notCopy:
      "The remaining exports build the capacity console's rows and render one of them. Both copy exports are read by a practice manager on `/console/capacity`: which of the two emptinesses they are looking at — a session that filled every slot it offered, or a session the record cannot answer for — and, when there is no diary at all, what would settle it. The distinction is the whole surface, because merged into one blank cell a reader takes the reassuring reading. Nothing here names a patient, a condition or a clinical step; every string passes W226's capacity linter, including the rendered rows rather than only the constants.",
  },
  {
    module: "src/capacity/coupling.ts",
    operatorCopy: ["COUPLING_REFUSAL_COPY", "ENABLEMENT_REJECTION_COPY"],
    notCopy:
      "The remaining exports are the enablement record, its validator, the shipped (empty) registry and the volume calculation. Both copy maps are read by a practice manager: why a session's message count was left to their own settings — not enabled, no range, an unscored forecaster, or a range W228 says has stopped fitting — and why an enablement record was refused. None of it names a patient, a condition or a clinical step; the subject throughout is a count of appointment slots and a count of messages. `REFUSED_COUPLINGS` is reviewer-facing in W200's split, since it quotes the mistakes it exists to forbid.",
  },
  {
    module: "src/capacity/copy-lint.ts",
    operatorCopy: ["CAPACITY_SURFACE_COPY"],
    notCopy:
      "The remaining exports are the lint rules and their explanations. `CAPACITY_SURFACE_COPY` is what a practice reads about the capacity figures themselves — what they are, what they are not, and that opening a session is the practice's decision. `CAPACITY_RULE_COPY` is reviewer-facing and deliberately QUOTES the phrasings it forbids, which is why a test asserts it fails the operator lint rather than passes it. Nothing here names a patient, a condition or a clinical step.",
  },
  {
    module: "src/capacity/backtest.ts",
    operatorCopy: ["BACKTEST_REFUSAL_COPY"],
    notCopy:
      "The remaining exports score a forecaster and render the score. `BACKTEST_REFUSAL_COPY` tells a practice why no track record is offered — and says explicitly that no track record is not the same as a good one. `renderScore` composes coverage, range width, the period scored and the named misses into one block, deliberately with no accessor that returns coverage alone. All of it describes this product's own accuracy about a diary; none of it names a patient, a condition or a clinical step.",
  },
  {
    module: "src/capacity/model.ts",
    operatorCopy: ["HISTORY_REFUSAL_COPY"],
    notCopy:
      "The remaining exports model sessions, their recorded dispositions and the fill rate. `HISTORY_REFUSAL_COPY` tells a practice why no number is offered for a clinician-weekday nobody has records for, and its whole job is to stop the absence being read as a prediction of an empty diary. It describes a diary and a record, never a patient, a condition or a next clinical step.",
  },
  {
    module: "src/outcomes/response-console.ts",
    operatorCopy: ["RESPONSE_CONSOLE_COPY", "EMPTY_READING_COPY", "EMPTY_WOULD_SETTLE_IT"],
    notCopy:
      "The remaining export is the view-model function. All three copy exports are read by a practice manager on the responses console: what the counts are, what each of the four silences means, and what to go and check when the page cannot tell a quiet period from an unrecorded one. None of it names a condition, describes a patient or suggests a clinical action — a test runs the whole bundle through the compliance linter and separately asserts the absence of clinical vocabulary.",
  },
  {
    module: "src/outcomes/graph-privacy.ts",
    operatorCopy: ["CELL_SUPPRESSION_COPY"],
    notCopy:
      "The remaining exports are the floor, the disclosable shape and its renderer. `CELL_SUPPRESSION_COPY` tells a reader why a count is withheld — because it describes too few people, or because publishing it would let another withheld number be recovered by subtraction. It describes the arithmetic of the disclosure, never a patient, a condition or a next clinical step, and a test asserts it carries no numeral at all so a withheld cell can never render as one.",
  },
  {
    module: "src/outcomes/counterfactual.ts",
    operatorCopy: ["COUNTERFACTUAL_WITHHELD_COPY"],
    notCopy:
      "The remaining exports are the comparator union, the figure and the refusal check. `COUNTERFACTUAL_WITHHELD_COPY` tells a practice manager why an impact figure is withheld — because there is no comparison group, or because an arm is too small for the arithmetic to carry a claim. It describes the measurement, never a patient, a condition or a next clinical step, and a test asserts the copy never reads as a zero.",
  },
  {
    module: "src/outcomes/response.ts",
    operatorCopy: ["RESPONSE_STATE_COPY", "RESPONSE_ABSENCE_COPY", "RESPONSE_REJECTION_COPY"],
    notCopy:
      "The remaining exports are the model and its declared kind table. `RESPONSE_STATE_COPY` is W170's own wording re-exported rather than rewritten, `RESPONSE_ABSENCE_COPY` is the sentence a surface uses instead of \"no response\", and the rejection copy tells an operator why an event was not linked. None of it describes a patient, a condition or a next clinical step.",
  },
  {
    module: "src/tenancy/two-tenant.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W277's two-tenant coverage register: which practice-scoped reads have been shown a second practice, the detector that decides, and its stated bound. Nobody but a developer reads it. Its strings are module and function names and one paragraph about a literal-counting detector; no patient, condition or appointment reason appears in it.",
  },
  {
    module: "src/tenancy/fixture-coherence.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty, and the emptiness is the classification. W276 checks whether the demo fixture belongs to a practice anybody can sign in as, and every string in it is addressed to whoever adds a store: each entry's `note` says what that store seeds, and each opaque one carries the one-line change that would make it readable. No clinician or practice manager sees any of it, and nothing here renders. `REFUSED_COHERENCE_SHAPES` is reviewer-facing in W200's split for the usual reason: its content QUOTES the source grep, the constant comparison and the clean-looking opaque store it exists to forbid.",
  },
  {
    module: "src/tenancy/store-reads.ts",
    operatorCopy: [],
    notCopy:
      "W209's scope registry. `STORE_MODULES` is a file list and every `reason` in `STORE_READS` is addressed to a reviewer asking why a read is not narrowed to one practice. None of it reaches an operator, and none of it describes a patient, a condition or a next clinical step — the strings are about the shape of the code, not about anybody's care.",
  },
  {
    module: "src/verticals/binding.ts",
    operatorCopy: ["RESOLUTION_COPY", "ACCEPT_REFUSAL_COPY"],
    notCopy: "The remaining exports resolve which version a practice has accepted.",
  },
  {
    module: "src/verticals/completeness.ts",
    operatorCopy: ["REMAINING_CHAIN"],
    notCopy: "`assessCompleteness` counts; the report renderer composes from REMAINING_CHAIN and those counts.",
  },
  {
    module: "src/verticals/consistency.ts",
    operatorCopy: ["CONTRADICTION_COPY"],
    notCopy: "The remaining exports find contradictions; the copy is what the console renders for each kind.",
  },
  {
    module: "src/verticals/dermatology.ts",
    operatorCopy: [],
    notCopy:
      "A vertical SPEC awaiting G5 sign-off, not shipped content: member ids, criteria keys and gate names. Nothing here renders to anybody until the gate opens, and what it will render then is clinical content the founder signs off, not copy this product writes.",
  },
  {
    module: "src/verticals/model.ts",
    operatorCopy: ["VERTICAL_REFUSAL_COPY"],
    notCopy:
      "`verticalHash` and `usableVertical` are structural — a hash and a predicate. The refusal copy is the only thing in the module an operator ever sees.",
  },
  {
    module: "src/verticals/store.ts",
    operatorCopy: [],
    notCopy:
      "An in-memory store of specs, and its strings are ids and criteria keys. What it holds is authored elsewhere and gated by G5; the store renders nothing.",
  },
  {
    module: "src/quality/blind-spots.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W295's register of blind spots is reviewer-facing throughout: one sentence per register saying what it cannot see, the witness that demonstrates it, and the positive control that makes the silence mean something. Its longest strings are those bounds and `BLIND_SPOT_BOUND`, all addressed to whoever adds a register. The fixtures it plants are synthetic source files — a walker, a fold, a spec, a pin — and nothing in it renders, holds a record, or names a patient, condition or appointment reason.",
  },
  {
    module: "src/quality/acceptances.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W294's register of acceptance registers is reviewer-facing throughout: seven registers, how each re-derives the finding behind its acceptances, and `ACCEPTANCE_BOUND`, which says which half runs and which half is only cited. It holds no copy of its own — every string it returns is an id built from a module path, a rule name and a review date read out of somebody else's register. Its longest strings are the arguments for why a by-review acceptance can never be re-swept, addressed to whoever adds one. No patient, condition or appointment reason appears anywhere in it.",
  },
  {
    module: "src/quality/assertion-drives.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W289's assertion drives are reviewer-facing throughout: nine comparisons handed an input they must reject, a resolver for the four citations W291 already drives, and the three census entries allowed to assert nothing. Its longest strings are `DRIVE_BOUND` and the docstrings arguing why a fabricated declared list is the only way to reach an assertion — addressed to whoever adds a register. Its fixtures are file paths, register ids and a split endpoint marker; no patient, condition or appointment reason appears anywhere in it, and every function returns a boolean or a list of module paths.",
  },
  {
    module: "src/quality/tautology-sweep.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W288's sweep for assertions that cannot fail is reviewer-facing throughout: three shape names, the argument for each, and the sentences attached to the five near-misses it deliberately leaves alone. Its longest strings are those arguments and `SWEEP_BOUND`, which are addressed to whoever widens the detector. `NOT_A_TAUTOLOGY` is reviewer-facing in W200's split for the usual reason: its content QUOTES the assertions it refuses to flag, including the determinism idiom this tree uses ten times. Nothing here renders and no practice sees it; its only input is the text of the tree's own test files and its only output is file paths and line numbers.",
  },
  {
    module: "src/quality/refusal-branches.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W291's branch register is reviewer-facing throughout: for each violation reporter in the tree, the arms it can produce and the input that makes each one fire. Its longest strings are the `fixture` sentences attached to the two arms nobody can construct today — instructions to whoever parameterises `EXCLUDED_SPECS` — and `REFUSED_BRANCH_SHAPES`, which is reviewer-facing in W200's split for the usual reason: its content QUOTES the citation-instead-of-execution and the line-coverage number it exists to forbid. The synthetic inputs it builds to drive each arm are file paths, register ids and spec names; no patient, condition or appointment reason appears anywhere in it.",
  },
  {
    module: "src/quality/empty-list-sweep.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W293's sweep for empty-list assertions whose source nothing shows able to fill. Nobody but a developer reads it. Its longest strings are the argument for the one accepted class, the note recording the self-evidencing bug it shipped with, and 131 debt rows that are file paths and test titles quoted from the tree's own suite; no patient, condition or appointment reason appears in any of them, and its only input is the text of test files.",
  },
  {
    module: "src/quality/negative-probes.ts",
    operatorCopy: [],
    notCopy:
      "Deliberately empty. W292's negative-probe register: for each of W267's proved walks, the file the detector must REFUSE, and the argument for why a detector that reported everything would get that one wrong. Nobody but a developer reads it. Its longest strings are those arguments — about folds versus maps, route conventions versus directories, and reachability versus existence — and the citations resolving the six negatives that were already driven. Its only inputs are file paths and the text of the tree's own tests; no patient, condition or appointment reason appears in it.",
  },
];

/**
 * A finding in operator copy that is accepted, with a reason and a date.
 *
 * W192's shape, and W53's before it: exact module, exact export, exact rule, exact matched string.
 * A rule accepted in general is a rule switched off, and the three entries below are the argument
 * for keeping this granular — each is the same rule doing its job on a surface where the sentence
 * means the opposite thing.
 */
export interface AcceptedCopyFinding {
  module: string;
  exportName: string;
  rule: string;
  /** The exact matched text. */
  match: string;
  why: string;
  /** ISO date. Past this, somebody looks again. */
  reviewBy: string;
}

export const ACCEPTED_COPY_FINDINGS: readonly AcceptedCopyFinding[] = [
  // W281's three, all from `src/demo/clinicians.ts` — the module CENSUS-1 said held no operator
  // copy. Reading them is what the adoption was for, and the honest result is the same as W270's:
  // no rule is being loosened, and the finding is that for a year there was no way to look.
  {
    module: "src/demo/clinicians.ts",
    exportName: "clinicians",
    rule: "no-benefit-claims",
    match: "specialist",
    why: "Two cards say specialist decisions belong to somebody else: \"he coordinates with psychiatrists and perinatal teams; specialist medication decisions remain within shared care\" and \"psychiatrist and perinatal-team coordination for specialist treatment\". The rule bans claiming to BE a specialist; both sentences say the opposite — they mark the boundary of what a GP does and name where the rest happens. Same direction as W270's acceptance for `escalation.ts`, where a promise about honouring an opt-out tripped the urgency rule. Plan §6 is stricter than the linter here — \"specialist\" must never sit next to a niche scope — and it is satisfied for the same reason: the word attaches to treatment held elsewhere, never to the clinician's own scope.",
    reviewBy: "2027-02-14",
  },
  {
    module: "src/demo/clinicians.ts",
    exportName: "clinicians",
    rule: "no-test-results-bait",
    match: "pathology",
    why: "\"On-site pathology\" in a card's practical signals, beside \"Mixed billing\" and \"9 min by train\". The rule exists for SMS: \"your pathology results are ready\" used as a reason to book is the disclosure this product never makes. This is a facility fact on a directory card, with no result, no patient and no prompt attached. The same words on a different surface — W192's finding, and the argument W200 accepted for `SILENCE_COPY`.",
    reviewBy: "2027-02-14",
  },
  // W270's five, all from the four pre-floor surfaces its door brought in. Each is the same shape
  // as the acceptance directly below for `SILENCE_COPY`: the same words mean different things on
  // different surfaces, so the rule stays sharp and the acceptance is per module, export, rule and
  // matched string, with a date. None of them is a rule being loosened; all four modules had gone
  // four years or more without any register reaching them, which is the finding.
  {
    module: "src/console/results-copy.ts",
    exportName: "RESULTS_COPY",
    rule: "no-diagnosis-or-condition",
    match: "Your results",
    why: "The heading of W42's PRACTICE-facing results page: the practice's own performance figures against its own held-back group. The rule bundles 'results' because in a patient message 'your results' means test results, which is a clinical disclosure this product never makes. Nobody reading this page is a patient, and the alternative headings all describe the page worse. Same words, opposite meaning, and the difference is the surface — W192's finding, which is also the argument for the acceptance below.",
    reviewBy: "2027-02-14",
  },
  {
    module: "src/console/results-copy.ts",
    exportName: "RESULTS_COPY",
    rule: "no-overdue-framing",
    match: "missed",
    why: "'A booking that is cancelled or missed never counts.' A methodology sentence about which appointments enter the practice's own figures. The rule bans overdue framing because telling a patient they missed something is pressure applied to a person; there is no person addressed here, and removing the word would make the counting rule less clear about the thing a practice manager most needs to know it excludes.",
    reviewBy: "2027-02-14",
  },
  {
    module: "src/pathways/approval.ts",
    exportName: "PATHWAY_REFUSAL_COPY",
    rule: "no-benefit-claims",
    match: "specialist",
    why: "'a specialist reviewer' names a role in Meherr's own two-person sign-off (W119) — who has to look at pathway content before it can be used. The rule bundles 'specialist' because a clinician claiming the title is a prohibited claim (W6, W184); a specialist reviewing our content is the opposite direction of the same word, which is exactly the acceptance this register already carries for `REMAINING_CHAIN`.",
    reviewBy: "2027-02-14",
  },
  {
    module: "src/registers/escalation.ts",
    exportName: "SHIPPED_TRIGGERS",
    rule: "no-urgency",
    match: "immediately",
    why: "'The opt-out is honoured immediately and permanently either way.' The urgency rule bans pressing a patient toward care; this is a promise about how fast a patient's own request takes effect, and softening it would weaken the one sentence that makes W73's opt-out trustworthy.",
    reviewBy: "2027-02-14",
  },
  {
    module: "src/audit/usefulness.ts",
    exportName: "USEFULNESS_OPTIONS",
    rule: "no-action-framing",
    match: "action needed",
    why: "The same string and the same argument as `SILENCE_COPY` below, on a different surface: a clinician picking from W22's usefulness options is recording what a visit was for, not being handed a task somebody decided was warranted. Accepted separately rather than by widening the existing entry, because an acceptance that covered two modules would stop naming which surface it was reasoned about.",
    reviewBy: "2027-02-14",
  },
  {
    module: "src/ops/silence.ts",
    exportName: "SILENCE_COPY",
    rule: "no-action-framing",
    match: "action needed",
    why: "W179's copy says 'No action needed' about an APPOINTMENT FEED — the connection is fine, the book is empty. The rule bans action framing because a task list implies somebody decided the task was warranted, and that reasoning is about patients; here the subject is a data connection and the sentence is the single most useful thing a practice manager can be told. Not fixed by teaching the rule about negation: in education copy 'this pathway changed, no action needed' WOULD be a clinical judgement, so the same words are acceptable here and unacceptable there, and the difference is the surface rather than the string.",
    reviewBy: "2027-02-11",
  },
  {
    module: "src/verticals/completeness.ts",
    exportName: "REMAINING_CHAIN",
    rule: "no-benefit-claims",
    match: "specialist",
    why: "'a specialist review and then a founder sign-off (G5)' describes Meherr's own content governance chain to whoever is watching a vertical fill up. The rule bundles 'specialist' because a clinician claiming to be one is a prohibited title claim (W6, W184); a specialist reviewing our pathway content is the opposite direction of the same word.",
    reviewBy: "2027-02-11",
  },
  {
    module: "src/verticals/consistency.ts",
    exportName: "CONTRADICTION_COPY",
    rule: "no-clinical-necessity",
    match: "require",
    why: "'Two pathways in this vertical require the same recorded fact with opposite polarity' — rendered in the verticals console. The rule bans telling anybody that care is required; this says what two PATHWAY DEFINITIONS require of a data field, which is a statement about configuration and mentions no patient.",
    reviewBy: "2027-02-11",
  },
];

export interface CopyFinding extends AdviceViolation {
  module: string;
  exportName: string;
}

/**
 * Every string reachable inside a declared export.
 *
 * Recursive, because operator copy is not always a flat record — `SILENCE_COPY` is a record of
 * objects, and a one-level walk would have returned nothing for it and reported it clean. The
 * test asserts a non-zero text count per declared export for exactly that reason: a lint over
 * nothing passes.
 */
export function copyTexts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) copyTexts(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) copyTexts(item, out);
  return out;
}

/**
 * Lint one declared surface's operator copy.
 *
 * Takes the module's namespace so the caller supplies the real exports — a register naming an
 * export that no longer exists is caught by the test rather than silently skipped here.
 */
export function lintOperatorCopy(
  surface: CopySurface,
  namespace: Record<string, unknown>,
): CopyFinding[] {
  const out: CopyFinding[] = [];
  for (const exportName of surface.operatorCopy) {
    for (const text of copyTexts(namespace[exportName])) {
      out.push(
        ...lintEducationCopy(text).map((v) => ({ ...v, module: surface.module, exportName })),
      );
    }
  }
  return out;
}

/** Findings with no acceptance. The list this unit exists to keep empty. */
export function unacceptedCopy(
  findings: readonly CopyFinding[],
  accepted: readonly AcceptedCopyFinding[] = ACCEPTED_COPY_FINDINGS,
): CopyFinding[] {
  return findings.filter(
    (f) =>
      !accepted.some(
        (a) =>
          a.module === f.module &&
          a.exportName === f.exportName &&
          a.rule === f.rule &&
          a.match.toLowerCase() === f.match.toLowerCase(),
      ),
  );
}

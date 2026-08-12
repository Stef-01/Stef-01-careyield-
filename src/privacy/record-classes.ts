// W106: every class of record that can hold a patient's identity, enumerated.
//
// W51 found the failure this exists to prevent: patient erasure covered the booking rail and
// missed the complaints store, so a raw patientId survived "delete everywhere" while the
// console reported no data held. The fix at the time was to compose the complaints store into
// the erasure path — correct, but it left the same trap set for the next store.
//
// Year 2 then added six more places patient identity can live. So this is the registry, and
// record-classes.test.ts checks it against the source tree: a store that holds a patientId
// and is not declared here fails the suite. A new record class cannot be added without an
// answer to "what happens to this on an access request, and on erasure?".
//
// `derived` is a first-class, reviewed answer — not an exemption. Register membership and
// care gaps are RECOMPUTED from PMS condition flags every cycle and never persisted, so
// erasing the source erases them; scrubbing them separately would be scrubbing a cache. That
// is a real property of those classes, and writing it down is what stops the next reader
// assuming it was an oversight.

export type Handling =
  /** Rows are stored and must be scrubbed on erasure and returned on an access request. */
  | "stored"
  /** Recomputed from another class every cycle; erasing the source erases these. */
  | "derived"
  /** Holds no patient identity at all. */
  | "no_patient_identity";

export interface RecordClass {
  /** The module that owns it, as the tree spells it. */
  module: string;
  what: string;
  handling: Handling;
  /** Why this handling is correct. Required — an undocumented classification is a guess. */
  rationale: string;
}

export const RECORD_CLASSES: readonly RecordClass[] = [
  {
    module: "src/booking/store.ts",
    what: "Invitations, appointments, audit events",
    handling: "stored",
    rationale: "The original W33 dataset: invitations and their audit events are removed, attended appointments lose their patient link so the slot history survives without the person.",
  },
  {
    module: "src/complaints/store.ts",
    what: "Complaint records and their patient link",
    handling: "stored",
    rationale: "W51 critical: this was the class erasure missed. The complaint is the practice's own handling record and stays; the patient link is scrubbed and the export returns them.",
  },
  {
    module: "src/audit/store.ts",
    what: "Usefulness outcome records",
    handling: "no_patient_identity",
    rationale: "W15 stores outcomes against an appointment id with a patient LABEL, never a patient id — deliberately de-identified at write time, so there is nothing to scrub.",
  },
  {
    module: "src/registers/store.ts",
    what: "Register catalogue and per-practice enable/disable",
    handling: "no_patient_identity",
    rationale: "W60 carries counts and practice choices only; membership itself is not persisted here.",
  },
  {
    module: "src/registers/membership.ts",
    what: "Register membership",
    handling: "derived",
    rationale: "W57 derives membership from PMS condition flags on every cycle and never persists it. Erasing the patient removes the flags, and membership disappears with them; scrubbing it separately would be scrubbing a cache.",
  },
  {
    module: "src/registers/caregap.ts",
    what: "Care gaps",
    handling: "derived",
    rationale: "W58 computes gaps from membership plus a cited interval at read time. Nothing is stored, so nothing survives erasure of the inputs.",
  },
  {
    module: "src/referrals/capture.ts",
    what: "Referrals and their completion state",
    handling: "derived",
    rationale: "W92 reads referrals from PMS-ingested data per run rather than holding its own copy; erasure at the source removes them.",
  },
  {
    module: "src/referrals/barriers.ts",
    what: "Barrier taxonomy against a referral",
    handling: "derived",
    rationale: "W94 records barriers as data attached to a referral, which is itself derived — and barriers are never inferred, so there is no independent store.",
  },
  {
    module: "src/referrals/store.ts",
    what: "Referral documents, acceptance acts, chain events and return reports",
    handling: "stored",
    rationale: "W137 holds patient-linked referral records on both sides of a GP-to-GP handover. On erasure the patient link must be removed from documents, acts, events and return reports alike — a referral naming a patient is patient identity wherever it sits, and the receiving practice holding a copy does not change that.",
  },
  {
    module: "src/education/store.ts",
    what: "Education library, case triggers and clinicians' CPD entries",
    handling: "no_patient_identity",
    rationale: "W151 holds CONTENT (material and triggers) plus CPD entries about CLINICIANS — what a person read and when. No entry carries a patient id: W148's triggers match fact CODES and W149's trail records an item, never the case that surfaced it. A patient erasure therefore has nothing to scrub here; the clinician's own rights over their trail are W149's, which makes it correctable by them and readable by nobody else.",
  },
  {
    module: "src/verticals/store.ts",
    what: "Declared verticals — which pathways, content, material and intervals each bundles",
    handling: "no_patient_identity",
    rationale: "W164 holds a list of REFERENCES to clinical content: version hashes, content ids, item ids, interval ids. There is no patient field on a vertical and no way to add one — a vertical says what a care model IS, never who is on it. Deliberately not practice-scoped either, for W127's reason: a vertical is a document. WHICH version a practice accepted is practice data and lives in W160's binding, not here.",
  },
  {
    module: "src/pathways/registry.ts",
    what: "Pathway catalogue and its sign-off attestations",
    handling: "no_patient_identity",
    rationale: "W127 holds clinical CONTENT and who reviewed it — versions, criteria, reviewer and signatory identities. There is no patient field on any event, so a patient erasure has nothing to scrub here. Deliberately not practice-scoped either: a pathway is a document, not practice data.",
  },
  {
    module: "src/credentials/ledger.ts",
    what: "Per-practice credential verification logs",
    handling: "no_patient_identity",
    rationale: "W113 stores W110's append-only lifecycle events — who submitted, checked and verified a CLINICIAN's credential, and when. No patient field exists on any event, so there is nothing to scrub on a patient erasure. As with the vault, the clinician's own rights over this history are a separate obligation from the patient-identity question this registry answers.",
  },
  {
    module: "src/credentials/vault.ts",
    what: "Evidence documents behind a clinician's credential",
    handling: "no_patient_identity",
    rationale: "W109 holds credentialing documents about CLINICIANS — a certificate scan, its subject and its uploader — and has no patient field to scrub. Note what this classification does NOT say: these are personal documents about identifiable people, and the clinician's own access and erasure rights are a separate obligation this registry does not cover, because the registry's question is patient identity. W112/W113 own that.",
  },
  {
    module: "src/capability/graph.ts",
    what: "Clinician interest, experience, competence",
    handling: "no_patient_identity",
    rationale: "W79's three fields are about CLINICIANS. Experience is a count of attended visits per condition and carries no patient id — W80 deliberately has no free-text or per-patient field.",
  },
  {
    module: "src/capability/store.ts",
    what: "Stated case-mix interest",
    handling: "no_patient_identity",
    rationale: "W81 records a clinician's own preference, keyed by clinician and condition.",
  },
  {
    module: "src/ops/store.ts",
    what: "Operational switches and queue view",
    handling: "no_patient_identity",
    rationale: "W19 holds practice-level switches; the queue view reads the rail rather than copying it.",
  },
  {
    module: "src/console/store.ts",
    what: "Practice profile, rules, roster, memberships",
    handling: "no_patient_identity",
    rationale: "Practice profile, eligibility rules, clinician roster and staff memberships — configuration about the practice and its people, with no patient record of any kind.",
  },
  {
    module: "src/lib/rate-limit.ts",
    what: "Rate-limit counters",
    handling: "no_patient_identity",
    rationale: "Keyed by action and coarse identifier, holds no patient record.",
  },
  {
    module: "src/privacy/state.ts",
    what: "Deletion records and the suppression list",
    handling: "stored",
    rationale: "Both hold a one-way patientRef rather than an identifier, BY DESIGN: a deletion record must prove a deletion happened and a suppression must outlive the data it protects. Erasing them would defeat both.",
  },
  {
    module: "src/interest/store.ts",
    what: "Community interest signups",
    handling: "stored",
    rationale: "Holds a name and email for people who are NOT patients of a subscribing practice — a different collection to everything else here (see the Y2 gate dossier). Access and erasure apply; it is file-backed rather than in-memory, so it is handled separately from the rail.",
  },
  // W180 — the Q14 outcome surface. Six modules, none of them a store, all declared anyway.
  //
  // The point of declaring a module that holds nothing is that "holds nothing" is a CLAIM, and
  // this registry is where claims about patient identity get written down and checked. Q14 built
  // an outcome rail on top of the referral rail; the privacy question for a rail built on a rail
  // is not "what does it store" but "does erasing the source empty it", and `derived` is the
  // answer W106 already has for exactly that.
  {
    module: "src/outcomes/dashboard.ts",
    what: "Referral outcome verdicts, per referral",
    handling: "derived",
    rationale:
      "W173 derives every verdict from the referral rail at read time and persists nothing. Patient identity does not survive the transform either: `ReferralEvent` carries a patientId and the chain events built from it carry only referralId, kind and at, so the verdict cannot name a patient. Erasing a patient from the rail (W137's scrub) removes their referrals and the verdicts go with them — composed, not remembered.",
  },
  {
    module: "src/outcomes/model.ts",
    what: "Outcome verdicts over a declared chain",
    handling: "no_patient_identity",
    rationale:
      "W170 folds `RecordedEvent { chainId, kind, at }`. A chain id is a referral id, not a person, and no field on an Outcome or an OutcomeSummary can hold patient identity — the type has nowhere to put one.",
  },
  {
    module: "src/outcomes/response-console.ts",
    what: "The responses console view-model: which silence a reader is shown",
    handling: "no_patient_identity",
    rationale:
      "W220 takes W218's already-disclosable graph — aggregate counts with small cells withheld — plus one integer, the number of recorded events, and returns either that graph or a named empty reading. There is no patient in any signature and no field on the view a patient identifier could occupy. Erasure is composed twice over: the counts derive from the synthetic loop's log, and the disclosable form has already dropped every chain id before this module sees it.",
  },
  {
    module: "src/capacity/model.ts",
    what: "Sessions and what the record says happened to their slots",
    handling: "no_patient_identity",
    rationale:
      "W222 groups a practice's own appointment rail into (clinician, date) sessions and counts filled, open and released slots. `Session` and `RecordedUtilisation` have no field a patient identifier could occupy — the projection reads status and clinician and nothing else — and W230 checks that over a real synthetic practice rather than by reading the type. ERASURE IS INVARIANT HERE, not composed: W33 keeps an attended slot and drops its patient link, so a capacity count is the same before and after an erasure. That is the property this class needs, and the stronger one: a figure that CHANGED when somebody was erased would disclose that an erasure had happened.",
  },
  {
    module: "src/capacity/forecast.ts",
    what: "A range for how many of a session's slots fill",
    handling: "no_patient_identity",
    rationale:
      "W223 turns W222's recorded weeks into a low and a high with a basis. Every input is a count; there is no patient in any signature and no field on a `Forecast` one could reach. RESIDUAL, NAMED RATHER THAN ASSUMED AWAY: a session with one offerable slot is a fact about one identifiable encounter, and this class is safe because these figures are read by the practice that already knows who was in that slot. If a capacity figure ever leaves the practice, W218's floor is the mechanism it needs and G9 is the ruling that would allow it.",
  },
  {
    module: "src/capacity/backtest.ts",
    what: "How often a session's range covered what happened",
    handling: "no_patient_identity",
    rationale:
      "W224 walks a session's recorded weeks forward and compares each range with what filled. The score holds counts, dates and the weeks that fell outside; the misses name a DATE, never a person. Same invariance as W222 — erasure keeps the slot and drops the link, so no score moves when somebody is erased.",
  },
  {
    module: "src/capacity/drift.ts",
    what: "Whether a session's range has stopped describing it",
    handling: "no_patient_identity",
    rationale:
      "W228 compares recent weeks with the range as it stood before them. It holds a verdict, two coverage windows and the dates that fell outside. No patient reaches it, and the report deliberately carries no corrected pattern — which is a control against recalibration rather than against identity, but is the reason there is nothing here for erasure to reach either.",
  },
  {
    module: "src/capacity/opening.ts",
    what: "How many slots the record supports opening on a weekday",
    handling: "no_patient_identity",
    rationale:
      "W225's suggestion. The strongest claim in this directory and the one W225 built its type for: `SessionOpening` has no `patients`, no `candidates`, no `candidateRef` and no `who`, and `REFUSED_OPENING_FIELDS` states why each is refused rather than leaving the absence to be read as an oversight. W230 re-derives that on the signatures and over real data.",
  },
  {
    module: "src/capacity/calendar.ts",
    what: "Declared public holidays and seasonal periods",
    handling: "no_patient_identity",
    rationale:
      "W227's calendar is data with a source, about dates rather than about anybody. Nothing seasonal is inferred from a practice's own history, so no patient record is read to produce it.",
  },
  {
    module: "src/interop/fhir.ts",
    what: "FHIR R4 resources built from this tree's records",
    handling: "derived",
    rationale:
      "W235 builds a FHIR `Patient`, `Practitioner`, `Organization` or `Appointment` from a domain record at read time and persists nothing, so erasing the source erases these — scrubbing them separately would be scrubbing a projection. Declared even though the register's detector only compels stores, because this is the boundary patient identity leaves through and a register of identity that could not see the exporter would be the wrong shape. What it emits is narrower than what it reads: consent state, the opt-out, the recall marker, the chronic-care flag and the holdout arm have no FHIR home here and are named in `RESOURCE_MAPPINGS` rather than dropped, so an access request answered from an exported resource is answering over less than the record holds — which is itself the reason the unmapped list is data a reviewer can read.",
  },
  {
    module: "src/capacity/attribution.ts",
    what: "Session arms for a capacity trial, and the effect measured over them",
    handling: "no_patient_identity",
    rationale:
      "W233 holds ARM ASSIGNMENTS — a clinician, a date, which group, and when the group was decided — plus counts of slots filled. No patient reaches it and the types have nowhere to put one; an assignment is about a session, not about who attended it. `SHIPPED_SESSION_ARMS` is empty, so today it holds nothing at all. Erasure invariance is the same as the rest of Q18 and for W230's reason: the outcome is a count of filled slots read off the appointment rail, and W33 keeps the slot while dropping the patient link, so an erasure does not move the figure — a capacity number that changed when somebody was erased would disclose that the erasure happened.",
  },
  {
    module: "src/capacity/console.ts",
    what: "The capacity console's view-model",
    handling: "no_patient_identity",
    rationale:
      "W229's view-model, declared by W230's directory census the firing it landed. It composes W222's sessions, W223's ranges, W224's scores and W228's drift verdicts for a page, and adds no field of its own that a patient could occupy — every input is already a count. Same erasure posture as the rest of the directory: invariant rather than composed, because W33 keeps the slot and drops the link, and a capacity figure that moved when somebody was erased would disclose that the erasure happened.",
  },
  {
    module: "src/capacity/coupling.ts",
    what: "The forecast-to-invitation-volume coupling and its enablement records",
    handling: "no_patient_identity",
    rationale:
      "W231 turns a session's recorded range into a COUNT of messages. No patient reaches it: the inputs are a session pattern, a slot count and a pool config, and the output is two integers and a direction. The records it does hold are about a PRACTICE STAFF MEMBER — who switched the coupling on, when, why, and the forecaster's score at that moment — which is the same class as W11's audit events and is retained deliberately, because the record of why some patients stopped being contacted is the one thing that must survive to answer for it. `ENABLED_COUPLINGS` is empty and pinned empty, so today it holds nothing at all. Erasure needs nothing here for the same reason as the rest of Q18: the counts derive from the appointment rail, and scrubbing the rail removes them.",
  },
  {
    module: "src/capacity/copy-lint.ts",
    what: "The sentences a capacity surface may say",
    handling: "no_patient_identity",
    rationale:
      "W226's linter and the surface copy it guards. It reads strings this product wants to show and holds nothing about anybody. Declared because W230's directory census runs in both directions, and a module left out of a completeness register is a module nobody re-derives.",
  },
  {
    module: "src/outcomes/graph-privacy.ts",
    what: "The disclosable form of a response graph, with small cells withheld",
    handling: "no_patient_identity",
    rationale:
      "W218. Holds the same aggregate counts W212 produces, minus the ones the floor withholds, and the withheld cells are carried as `null` with a reason rather than dropped. No chain id, no invitation id and no patient id: a test scans every string in a graph built over a real six-week run and asserts none of the 1,552 chain ids it was handed survived the aggregation, which is a stronger claim than the type makes. The class exists because W212 correctly flagged that a GRAPH can hold shape a single link cannot — a cell of one is a person even when no field names one — and this module is where that shape is removed. `SHIPPED_DISCLOSABLE_GRAPHS` is pinned empty: a non-empty registry would be the first thing in the tree cleared for disclosure, and G9 is unratified.",
  },
  {
    module: "src/outcomes/counterfactual.ts",
    what: "The counterfactual figure and its refusals",
    handling: "no_patient_identity",
    rationale:
      "W215 takes an `AttributionResult` — two arms as head counts and attended counts — and returns a difference or a refusal. There is no patient in any signature and no field on the figure or its basis a patient identifier could occupy, which is also why the per-patient counterfactual is refused structurally rather than by a rule somebody remembers. Erasure is composed: scrub a patient from the rail and they leave the counts W9 produces, with nothing here to remember to scrub.",
  },
  {
    module: "src/outcomes/response.ts",
    what: "The link between an intervention and a recorded fact that answers it",
    handling: "no_patient_identity",
    rationale:
      "W211 builds a `Response` from W170's `RecordedEvent { chainId, kind, at }` and an `Intervention { interventionId, practiceId, chainId, kind, at }`. Neither type has a field a patient identifier could go in, and the constructor copies only from those two, so the link is a statement about a chain and a practice. Erasure is COMPOSED for the same reason W180 gave: scrub the source rail and the events these rest on are gone, with nothing here to remember to scrub. W218 classifies the GRAPH built over this, which is a different question because a graph can hold shape a single link cannot.",
  },
  {
    module: "src/outcomes/attribution-v2.ts",
    what: "The practice-wide attributable claim, and per-kind counts that are not one",
    handling: "no_patient_identity",
    rationale:
      "W219 composes W215's arm figure and W212's graph. Both inputs are already counts — the arms are head-counts, the graph aggregates away the chain — and nothing here holds a chain id, let alone a patient. The stronger guarantee is on the SIGNATURES: no exported function takes a patient, asserted on parameters rather than names, because a per-patient effect estimate is unanswerable and is the input to a triage. Erasure is composed: scrub the source rail and the arms and edges these rest on are gone.",
  },
  {
    module: "src/outcomes/response-graph.ts",
    what: "Counts of how each kind of intervention was answered, over the synthetic loop",
    handling: "no_patient_identity",
    rationale:
      "W212 aggregates W211's links into edges holding an intervention kind, a response kind, a verdict, a count and a basis. No chain id and no patient id survives the aggregation — the edge type has nowhere to put one. W211's own entry flags that a GRAPH can hold shape a single link cannot, and that is right about SMALL CELLS rather than about identity: a count of one is a person, in the way W196's aggregation floors describe. It is not a live exposure here because nothing ships (`SHIPPED_RESPONSE_GRAPHS` is pinned empty) and the only builder takes a `SimResult`. **W218 settled the floor question in `src/outcomes/graph-privacy.ts`**, which is where a graph is put into disclosable form: this entry stays about what the type can hold, and that one is about what may be published from it.",
  },
  {
    module: "src/outcomes/escalation-monitor.ts",
    what: "Unrouted escalations, aged",
    handling: "no_patient_identity",
    rationale:
      "W171 keys a sighting on pathwayId, versionHash and factCode. An escalation is a question about a PATHWAY criterion, not about the record that triggered it, so nothing here identifies whose fact fired it.",
  },
  {
    module: "src/outcomes/time-to-escalation.ts",
    what: "Interval between a fact being recorded and an escalation firing",
    handling: "no_patient_identity",
    rationale:
      "W176 measures two instants on the same pathway criterion and carries no subject. The module argues at length that the interval is a fact about the record rather than about a person; the type is what makes that true rather than aspirational.",
  },
  {
    module: "src/outcomes/agreement.ts",
    what: "Specialist-agreement sample",
    handling: "no_patient_identity",
    rationale:
      "W172 samples pathway verdicts by their own identity to compare reviewer and engine, and holds no patient field. The sample is over VERDICTS, and a verdict names a pathway version rather than the person it was computed for.",
  },
  {
    module: "src/reporting/report.ts",
    what: "The reporting summary a practice reads about itself",
    handling: "derived",
    rationale:
      "W204. Recomputed from the practice's own live rails on every read and never persisted, so erasing a source record is automatically effective on every figure derived from it. Storing a produced report would create a second copy that erasure does not reach — W51's failure in a new place. `derived` here is the reviewed answer W106 requires and not an exemption: the claim that nothing is written is checked against the tree by src/reporting/retention.test.ts, and the day G9 opens a DISCLOSURE LOG becomes mandatory and is a stored class with its own life.",
  },
  {
    module: "src/outcomes/audit-export.ts",
    what: "Practice configuration audit trail, exported",
    handling: "no_patient_identity",
    rationale:
      "W177 exports practice CONFIGURATION history, and this is the class where that matters most: an export leaves the product, so erasure can never reach it — a downloaded file is gone. Holding no patient identity is therefore not a convenience here but the only handling that is safe, and the test asserts the absence rather than trusting it.",
  },
];

/** Classes whose rows must be reachable by an access request and removable by erasure. */
export function storedClasses(): RecordClass[] {
  return RECORD_CLASSES.filter((c) => c.handling === "stored");
}

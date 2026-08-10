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
];

/** Classes whose rows must be reachable by an access request and removable by erasure. */
export function storedClasses(): RecordClass[] {
  return RECORD_CLASSES.filter((c) => c.handling === "stored");
}

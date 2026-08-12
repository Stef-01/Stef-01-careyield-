// W266: what an access request returns — assembled from W106, and checked against erasure.
//
// APP 12 and APP 11.2 are two questions about one set of records: what do you hold about me, and
// what happens when I ask you to delete it. This tree has taken the second one seriously — it has
// been found broken twice and W265 made the property mechanical. **The first one had never been
// checked at all**, and the asymmetry is the unit's finding.
//
// THE FINDING: ERASURE REACHED A STORE ACCESS DID NOT. W137 composed the GP-to-GP referral rail
// into `deletePatientEverywhere`, writing the sentence W51 had written before it — *a store that
// erasure does not reach is a store the console reports as clean* — and added **no reader**. So
// for three years a patient asking what the practice held about them was not told about their
// referrals, and the same patient asking for deletion had them deleted. Nobody looked, because
// erasure was the verb that had been found broken and access was the verb nobody had a register
// for. W266 adds `referralsForPatient`, puts the rail in the export, and makes the symmetry a
// standing check rather than something for the next unit to notice.
//
// THE SYMMETRY IS THE CONTROL, AND IT IS CHEAP BECAUSE W265 ALREADY DID HALF OF IT. Every module
// erasure clears must be represented in the export or withheld with a written reason, and the
// register below is checked against `ERASURE_PATHS` in both directions. The two directions are
// two different failures and both are real: a store erased but not disclosed means the practice
// deleted more than it ever admitted holding; a store disclosed but not erased means it told the
// patient about records their request would not remove.
//
// AND THE DERIVATION IS SHARED, NOT COPIED. The referral rail links a patient through four
// different row types, so "which referrals are theirs" is a real derivation with four chances to
// differ. `referralIdsForPatient` is now the one answer and both verbs call it — because two
// copies would let access and erasure disagree about the same patient's records, in a way neither
// function could notice from inside itself.
//
// DERIVED CLASSES ARE WITHHELD, AND THE REASON IS NOT "THEY DO NOT MATTER". A derived class is
// recomputed from a source class at read time and persists nothing (W106's own definition), so
// exporting it would hand the patient the same records twice — once as the source rows they can
// check, and once as this product's reading of them. The second copy is the one that would be
// argued with, and it is not a record the practice holds. Each is withheld by name with that
// argument attached rather than silently omitted, because "not exported" and "nobody thought
// about it" are indistinguishable from outside.
//
// FOUNDER GATE (plan §4): synthetic only. Nothing here reaches a real record, and the export
// assembles what a practice already holds rather than deriving anything new about anybody.

import { ERASURE_PATHS, scrubbedModules } from "./erasure-y5";
import { RECORD_CLASSES, storedClasses, type RecordClass } from "./record-classes";

export type AccessDisposition =
  /** The export carries it. `field` names the key on `ConsoleExport` a reader will find it under. */
  | { kind: "included"; field: string; how: string }
  /** Not in the export, with the argument for why. Never a silent omission. */
  | { kind: "withheld"; why: string };

export interface AccessPath {
  /** The module, as W106 spells it. */
  module: string;
  disposition: AccessDisposition;
}

/** Why a `derived` class is not exported. One argument, so it cannot drift between seven copies. */
const DERIVED_IS_NOT_HELD =
  "A `derived` class is recomputed from a source class at read time and persists nothing, so the practice does not HOLD it — exporting it would hand the patient this product's reading of records they are already being given, and a reading is the thing that would be argued with rather than the record. The source class it derives from is in the export, which is what APP 12 is about.";

export const ACCESS_PATHS: readonly AccessPath[] = [
  {
    module: "src/booking/store.ts",
    disposition: {
      kind: "included",
      field: "invitations, appointments, auditEvents, outcomes",
      how: "W33's `exportPatientData` over the rail dataset — the invitations sent to them, the appointments they hold, the audit events about either, and the outcome records attached to their appointments.",
    },
  },
  {
    module: "src/complaints/store.ts",
    disposition: {
      kind: "included",
      field: "complaints",
      how: "`complaintsForPatient`, composed into `exportForPatient` at W51 alongside the scrub, because an access request covers a complaint the practice recorded about them.",
    },
  },
  {
    module: "src/referrals/store.ts",
    disposition: {
      kind: "included",
      field: "referrals",
      how: "`referralsForPatient`, added at W266 — the reader W137 never wrote. It shares `referralIdsForPatient` with the scrub, so access and erasure cannot disagree about which referrals are this patient's.",
    },
  },
  {
    module: "src/privacy/state.ts",
    disposition: {
      kind: "included",
      field: "suppressed",
      how: "Whether contact is suppressed for them, from W33's suppression list. The deletion records are NOT exported: a deletion record is about a person who asked to be erased and holds a one-way ref rather than an identifier, so it is not a record held about a living request.",
    },
  },
  {
    module: "src/interest/store.ts",
    disposition: {
      kind: "withheld",
      why: "A different subject, as W265's register records for the same module: the people in it are not patients of any subscribing practice, and `exportForPatient(patientId)` cannot reach them. Their own access path is `interestSignupsFor(email)`, keyed on the identity they gave. Exporting it here would require matching a patient to a signup by name or email, which is an inference this product does not make about anybody.",
    },
  },
  { module: "src/registers/membership.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
  { module: "src/registers/caregap.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
  { module: "src/referrals/capture.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
  { module: "src/referrals/barriers.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
  { module: "src/outcomes/dashboard.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
  { module: "src/interop/fhir.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
  { module: "src/reporting/report.ts", disposition: { kind: "withheld", why: DERIVED_IS_NOT_HELD } },
];

/** The classes an access request has to account for: everything W106 says is held or derived. */
export function accountableClasses(classes: readonly RecordClass[] = RECORD_CLASSES): RecordClass[] {
  return classes.filter((c) => c.handling !== "no_patient_identity");
}

export interface AccessCoverage {
  /** Held or derived classes with no stated disposition — a record nobody decided about. */
  unaccounted: string[];
  /** Dispositions for classes W106 no longer holds — a register describing code that moved. */
  stale: string[];
}

export function accessCoverage(
  classes: readonly RecordClass[] = accountableClasses(),
  declared: readonly AccessPath[] = ACCESS_PATHS,
): AccessCoverage {
  const declaredModules = new Set(declared.map((p) => p.module));
  const accountable = new Set(classes.map((c) => c.module));
  return {
    unaccounted: [...accountable].filter((m) => !declaredModules.has(m)).sort(),
    stale: [...declaredModules].filter((m) => !accountable.has(m)).sort(),
  };
}

export interface AccessErasureDisagreement {
  /** Erasure clears it and the export neither carries it nor says why. The W266 finding's shape. */
  erasedNotDisclosed: string[];
  /** The export carries it and erasure does not clear it. */
  disclosedNotErased: string[];
}

/**
 * Where the two verbs disagree about the same records.
 *
 * Both directions, because both are real failures with opposite consequences: a store erased but
 * never disclosed means the practice deleted more than it ever admitted holding, and a store
 * disclosed but never erased means it told the patient about records their request would not
 * remove. Neither is visible from inside either function.
 */
export function accessErasureDisagreements(
  access: readonly AccessPath[] = ACCESS_PATHS,
  erased: readonly string[] = scrubbedModules(),
): AccessErasureDisagreement {
  const included = new Set(
    access.filter((p) => p.disposition.kind === "included").map((p) => p.module),
  );
  const stated = new Set(access.map((p) => p.module));
  const erasedSet = new Set(erased);
  return {
    erasedNotDisclosed: erased.filter((m) => !stated.has(m)).sort(),
    disclosedNotErased: [...included]
      .filter((m) => !erasedSet.has(m) && !keptDeliberately().has(m))
      .sort(),
  };
}

/** Modules W265 records as deliberately kept — exported, and correctly not erased. */
function keptDeliberately(): Set<string> {
  return new Set(
    ERASURE_PATHS.filter((p) => p.disposition.kind === "kept_deliberately").map((p) => p.module),
  );
}

/** The `stored` classes the export must carry. Everything else has to argue its way out. */
export function includedModules(declared: readonly AccessPath[] = ACCESS_PATHS): string[] {
  const stored = new Set(storedClasses().map((c) => c.module));
  return declared
    .filter((p) => p.disposition.kind === "included" && stored.has(p.module))
    .map((p) => p.module)
    .sort();
}

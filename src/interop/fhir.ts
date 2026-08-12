// W235: the FHIR R4 mapping, as a declared table — and mostly as refusals.
//
// Q19 makes this tree talk to other systems. The mapping is the first unit because it is the one
// that decides what leaves, and the failure it exists to prevent is not a wrong field. It is a
// field that has no FHIR home and gets quietly dropped.
//
// A DROPPED BOOLEAN IS NOT A GAP ON THE WAY BACK. IT IS A LIE. Drop a string and it round-trips
// to `undefined`, which reads as "we do not know". Drop a BOOLEAN and it round-trips to `false`,
// which reads as "no" — and `no` is a claim. `optedOut: true` becomes `optedOut: false`, and a
// patient who told this practice to stop contacting them arrives at the other system as a
// patient who never did. That asymmetry between missing and false is W170's rule about
// `not_recorded`, arriving at a serialisation boundary where it is invisible: every field is
// present, every type checks, and the record is wrong in the one direction that causes harm.
//
// SO THERE IS NO FUNCTION HERE THAT RETURNS A `Patient`. `fromFhirPatient` returns a `Recovered`
// — the fields it could read, plus the NAMES of the ones it could not — and completing it into a
// domain record is the caller's problem precisely because completing it means inventing seven
// booleans. W233 refused an effect without an arm by the same means: the type has no way to give
// you the reassuring answer.
//
// THE MAPPING IS MOSTLY REFUSALS, AND THAT IS THE HONEST RESULT. Three of `Patient`'s ten fields
// have a FHIR home. The other seven are consent state, workflow markers and one research-arm
// assignment, and a mapping that looked complete would be the alarming one — it would mean
// somebody had found somewhere to put them.
//
// TWO OF THOSE REFUSALS ARE NOT ABOUT PLUMBING.
//
//   `chronicCare` HAS AN OBVIOUS FHIR HOME AND IT IS THE WRONG ONE. Map it to a `Condition` and
//   this product has asserted a clinical diagnosis about a named patient in a document another
//   system will read as clinical. It is a register-membership marker derived from PMS flags
//   (W57), not a finding anybody made, and G7's line runs exactly here. The arithmetic is
//   available, the FHIR resource is standard, and doing it would be the most consequential
//   single line in Q19.
//
//   `holdout` WOULD DISCLOSE THE EXPERIMENT. W201 lists the holdout arm first among automated
//   decisions because it withholds an offer. Exporting the arm assignment tells a third party
//   which patients this practice deliberately leaves alone, which is a fact about a research
//   design and not about the person's care.
//
// AND A STATUS VALUE COERCED IS WORSE THAN A FIELD DROPPED, because it is still present and now
// says something false. `AppointmentStatus.open` has no FHIR `Appointment.status` — an unfilled
// bookable slot is a FHIR `Slot`, a different resource with a different identity. Every nearby
// status means something else: `proposed` is an appointment somebody suggested, `waitlist` is a
// patient waiting for one. So the value table refuses `open` outright and `toFhirAppointment`
// returns a refusal rather than a resource, instead of picking the closest word.
//
// THE REGISTER IS CHECKED AGAINST THE DOMAIN TYPES IN BOTH DIRECTIONS (W102's shape), by reading
// `src/domain/types.ts` rather than by listing fields here. A field added to `Patient` tomorrow
// fails this unit's test until somebody says where it goes or why it does not go — which is the
// only version of this that survives contact with a growing model.
//
// FOUNDER GATES (plan §4): this module TRANSMITS NOTHING. It is a pure mapping over synthetic
// records; there is no endpoint, no client, no credential (W237 builds the conformance harness
// against recorded fixtures, and W242 owns the credential posture). Nothing here authors clinical
// text — every value is copied from a field a PMS already recorded.

import type { Appointment, AppointmentStatus, Clinician, Patient, Practice } from "@/domain/types";

/** The version this mapping targets. Stated, because R4 and R5 disagree about several of these. */
export const FHIR_VERSION = "4.0.1";

/**
 * The base for local code systems.
 *
 * Deliberately `example.invalid`: a real system URI is a published, resolvable identifier, and
 * inventing one that looks resolvable is W227's manufactured source in another costume. W238
 * binds these to SNOMED CT-AU and LOINC with provenance.
 */
export const LOCAL_SYSTEM = "https://example.invalid/fhir/CodeSystem";

export type MappedResource = "Patient" | "Practitioner" | "Organization" | "Appointment";

export interface FieldMapping {
  domainField: string;
  /** Where it goes, in FHIRPath. */
  fhirPath: string;
  /** Why that is the right home. */
  note: string;
}

export interface UnmappedField {
  domainField: string;
  /** Why it has no FHIR home here. */
  why: string;
  /**
   * What a naive round-trip would silently produce — the lie, written down.
   *
   * The most useful column in this table. "Dropped" is abstract; "arrives as a patient who never
   * opted out" is the sentence that stops somebody adding an extension to be helpful.
   */
  wouldBecome: string;
}

export interface ResourceMapping {
  resource: MappedResource;
  /** The interface in `src/domain/types.ts`, checked against the source in both directions. */
  domainType: string;
  mapped: readonly FieldMapping[];
  unmapped: readonly UnmappedField[];
}

export const RESOURCE_MAPPINGS: readonly ResourceMapping[] = [
  {
    resource: "Patient",
    domainType: "Patient",
    mapped: [
      { domainField: "id", fhirPath: "Patient.id", note: "The resource identity." },
      {
        domainField: "practiceId",
        fhirPath: "Patient.managingOrganization",
        note: "The practice holding the record, as an Organization reference.",
      },
      {
        domainField: "usualClinicianId",
        fhirPath: "Patient.generalPractitioner",
        note: "R4's field for the patient's nominated practitioner. Null becomes an absent element rather than an empty reference — an empty reference asserts there is one.",
      },
    ],
    unmapped: [
      {
        domainField: "smsConsent",
        why: "Consent is a resource in FHIR, not a flag on Patient. Putting it in a local extension would make a consent record that no receiving system is obliged to read, while looking like one that is.",
        wouldBecome: "A patient who consented arrives with no consent recorded, and one who did not arrives identically. The receiver cannot tell which, and the safe reading is not the default one.",
      },
      {
        domainField: "optedOut",
        why: "Same as consent, and this is the one that causes harm. An opt-out is a standing instruction from the patient, and there is nowhere on Patient to carry it that a receiver will honour.",
        wouldBecome: "`optedOut: true` round-trips to `false`. A patient who told this practice to stop contacting them arrives as a patient who never did.",
      },
      {
        domainField: "lastAttendedAt",
        why: "Derived rather than stored. In FHIR this is a query over Encounter or Appointment, and shipping it as a Patient field would create a second copy that goes stale.",
        wouldBecome: "An absent date, which reads as a patient who has never attended rather than one whose history lives in another resource.",
      },
      {
        domainField: "futureBookingAt",
        why: "Derived from the Appointment resources rather than stored, so in FHIR it is a query over the appointments themselves. Shipping it as a Patient field would create a second copy that goes stale the moment a booking moves, and a stale date here is the one that stops somebody being offered a slot.",
        wouldBecome: "An absent date, which reads as a patient with no upcoming appointment — the condition under which this product's own eligibility rules would consider contacting them.",
      },
      {
        domainField: "activeRecall",
        why: "A marker that the practice is already managing this patient's recall, so the loop must not duplicate it. It is workflow state belonging to this product, not a fact about the patient.",
        wouldBecome: "`false`, which reads as a patient nobody is following up — the exact condition under which another system might start.",
      },
      {
        domainField: "chronicCare",
        why: "THE DANGEROUS ONE. The obvious home is a `Condition`, and mapping it there would have this product assert a clinical diagnosis about a named patient in a document another system reads as clinical. It is a register-membership marker derived from PMS flags (W57), not a finding anybody made. G7's line runs exactly here.",
        wouldBecome: "`false`. Which is the wrong answer, and still a far better one than a fabricated Condition resource.",
      },
      {
        domainField: "holdout",
        why: "The research arm this patient was assigned to. W201 lists it first among automated decisions because it withholds an offer; exporting it tells a third party which patients a practice deliberately leaves alone, which is a fact about a study design rather than about the person's care.",
        wouldBecome: "`false`, placing every exported patient in the treatment arm — which would also silently corrupt any incrementality figure computed downstream.",
      },
    ],
  },
  {
    resource: "Practitioner",
    domainType: "Clinician",
    mapped: [
      { domainField: "id", fhirPath: "Practitioner.id", note: "The resource identity." },
      {
        domainField: "displayName",
        fhirPath: "Practitioner.name.text",
        note: "`name.text` rather than parsed given/family: this tree stores one display string and splitting it would be guessing at a person's name.",
      },
    ],
    unmapped: [
      {
        domainField: "practiceId",
        why: "A practitioner's association with an organisation is `PractitionerRole` in R4, a separate resource. Putting an organization reference on Practitioner would assert an employment relationship this tree does not record.",
        wouldBecome: "An absent association, which is correct — this tree genuinely does not know the employment relationship, only that the clinician appears in the practice's diary.",
      },
      {
        domainField: "participating",
        why: "Whether the clinician opted into availability invitations. A fact about this product's configuration, not about the practitioner.",
        wouldBecome: "`false`, which reads as a clinician who declined rather than one whose preference was never exported.",
      },
    ],
  },
  {
    resource: "Organization",
    domainType: "Practice",
    mapped: [
      { domainField: "id", fhirPath: "Organization.id", note: "The resource identity." },
      { domainField: "name", fhirPath: "Organization.name", note: "The practice's own name." },
    ],
    unmapped: [
      {
        domainField: "timezone",
        why: "R4 Organization has no timezone element. Every datetime exported here carries its own offset instead, which is the correct fix rather than a workaround.",
        wouldBecome: "Absent, and harmless — because no exported instant depends on it.",
      },
      {
        domainField: "holdoutRate",
        why: "The share of patients this practice holds out. A study parameter, refused for the same reason as `holdout` on Patient.",
        wouldBecome: "`0`, which reads as a practice running no holdout at all — a claim about the study, made by omission.",
      },
    ],
  },
  {
    resource: "Appointment",
    domainType: "Appointment",
    mapped: [
      { domainField: "id", fhirPath: "Appointment.id", note: "The resource identity." },
      { domainField: "startsAt", fhirPath: "Appointment.start", note: "An instant with its offset." },
      {
        domainField: "status",
        fhirPath: "Appointment.status",
        note: "Through a declared value table, not a cast. See `STATUS_MAPPING` — one of the five values has no R4 equivalent and is refused rather than approximated.",
      },
      {
        domainField: "practiceId",
        fhirPath: "Appointment.participant.actor (Organization)",
        note: "A participant reference, which is where R4 puts every party to an appointment.",
      },
      {
        domainField: "clinicianId",
        fhirPath: "Appointment.participant.actor (Practitioner)",
        note: "Same participant array.",
      },
      {
        domainField: "patientId",
        fhirPath: "Appointment.participant.actor (Patient)",
        note: "Absent for an unbooked slot rather than a null reference, since a null actor would assert a participant nobody can resolve.",
      },
      {
        domainField: "appointmentType",
        fhirPath: "Appointment.appointmentType",
        note: `A CodeableConcept against a LOCAL code system (${LOCAL_SYSTEM}), deliberately not a national one. W238 binds these with provenance; until then the code says where it came from rather than borrowing authority it has not earned.`,
      },
    ],
    unmapped: [
      {
        domainField: "generatedByInvitation",
        why: "Whether this booking came from a Meherr message. Provenance about this product, and R4 models provenance as its own resource rather than a flag.",
        wouldBecome: "`false` — an assertion that the booking had nothing to do with this product, which is exactly the causal claim W215 and W233 spend whole units refusing to make without evidence.",
      },
    ],
  },
];

export type StatusRefusal =
  /** An unfilled bookable slot is a FHIR `Slot`, not an `Appointment`. See the module note. */
  | "open_slot_is_not_an_appointment";

export const STATUS_REFUSAL_COPY: Record<StatusRefusal, string> = {
  open_slot_is_not_an_appointment:
    "An unfilled bookable slot has no `Appointment.status` in R4, because in R4 it is not an appointment at all — it is a `Slot`, a different resource with its own identity. Every nearby status means something else: `proposed` is an appointment somebody suggested, `waitlist` is a patient waiting for one. Sending the closest word would export a booking that does not exist.",
};

/**
 * Our five statuses against R4's, as a table.
 *
 * `null` is a refusal, not an omission — the entry is present so the gap is visible in the table
 * rather than inferred from the table being short.
 */
export const STATUS_MAPPING: Readonly<Record<AppointmentStatus, string | null>> = {
  open: null,
  booked: "booked",
  attended: "fulfilled",
  dna: "noshow",
  cancelled: "cancelled",
};

/** A FHIR resource, structurally. Hand-rolled: a dependency for four resources is not worth it. */
export type FhirResource = Record<string, unknown> & { resourceType: MappedResource; id: string };

const reference = (type: string, id: string) => ({ reference: `${type}/${id}` });

export function toFhirPatient(patient: Patient): FhirResource {
  const resource: FhirResource = {
    resourceType: "Patient",
    id: patient.id,
    managingOrganization: reference("Organization", patient.practiceId),
  };
  // Absent rather than a null reference: an empty reference asserts there is a practitioner and
  // that we could not name them, which is a different fact from there being none.
  if (patient.usualClinicianId !== null) {
    resource.generalPractitioner = [reference("Practitioner", patient.usualClinicianId)];
  }
  return resource;
}

export function toFhirPractitioner(clinician: Clinician): FhirResource {
  return {
    resourceType: "Practitioner",
    id: clinician.id,
    name: [{ text: clinician.displayName }],
  };
}

export function toFhirOrganization(practice: Practice): FhirResource {
  return { resourceType: "Organization", id: practice.id, name: practice.name };
}

export type AppointmentExport =
  | { ok: true; resource: FhirResource }
  | { ok: false; errors: StatusRefusal[] };

export function toFhirAppointment(appointment: Appointment): AppointmentExport {
  const status = STATUS_MAPPING[appointment.status];
  if (status === null) return { ok: false, errors: ["open_slot_is_not_an_appointment"] };

  const participant: Array<Record<string, unknown>> = [
    { actor: reference("Organization", appointment.practiceId), status: "accepted" },
    { actor: reference("Practitioner", appointment.clinicianId), status: "accepted" },
  ];
  if (appointment.patientId !== null) {
    participant.push({ actor: reference("Patient", appointment.patientId), status: "accepted" });
  }

  const resource: FhirResource = {
    resourceType: "Appointment",
    id: appointment.id,
    status,
    start: appointment.startsAt,
    participant,
  };
  if (appointment.appointmentType !== undefined) {
    resource.appointmentType = {
      coding: [{ system: `${LOCAL_SYSTEM}/appointment-type`, code: appointment.appointmentType }],
    };
  }
  return { ok: true, resource };
}

/**
 * What came back, and what could not.
 *
 * Deliberately NOT a `Patient`. Completing this into a domain record means inventing seven
 * booleans, so the type refuses to do it and hands the caller the names instead — see the module
 * note about a dropped boolean being a lie rather than a gap.
 */
export interface Recovered<T> {
  recovered: Partial<T>;
  /** Field names that were not carried by the resource. Named, never defaulted. */
  notRecovered: readonly string[];
}

const unmappedNames = (resource: MappedResource): string[] => {
  const mapping = RESOURCE_MAPPINGS.find((m) => m.resource === resource);
  if (!mapping) throw new Error(`no mapping declared for ${resource}`);
  return mapping.unmapped.map((field) => field.domainField);
};

const ref = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null) return null;
  const raw = (value as { reference?: unknown }).reference;
  return typeof raw === "string" ? (raw.split("/")[1] ?? null) : null;
};

export function fromFhirPatient(resource: FhirResource): Recovered<Patient> {
  const gp = Array.isArray(resource.generalPractitioner) ? resource.generalPractitioner[0] : null;
  const recovered: Partial<Patient> = {
    id: resource.id as Patient["id"],
    // `usualClinicianId` is mapped, so its absence IS recoverable as null — the resource carries
    // the distinction. That is the difference between this field and the seven below.
    usualClinicianId: (ref(gp) ?? null) as Patient["usualClinicianId"],
  };
  const practice = ref(resource.managingOrganization);
  if (practice !== null) recovered.practiceId = practice as Patient["practiceId"];
  return { recovered, notRecovered: unmappedNames("Patient") };
}

export function fromFhirPractitioner(resource: FhirResource): Recovered<Clinician> {
  const name = Array.isArray(resource.name) ? resource.name[0] : null;
  const text = typeof name === "object" && name !== null ? (name as { text?: unknown }).text : null;
  return {
    recovered: {
      id: resource.id as Clinician["id"],
      ...(typeof text === "string" ? { displayName: text } : {}),
    },
    notRecovered: unmappedNames("Practitioner"),
  };
}

export function fromFhirOrganization(resource: FhirResource): Recovered<Practice> {
  return {
    recovered: {
      id: resource.id as Practice["id"],
      ...(typeof resource.name === "string" ? { name: resource.name } : {}),
    },
    notRecovered: unmappedNames("Organization"),
  };
}

export function fromFhirAppointment(resource: FhirResource): Recovered<Appointment> {
  const participants = Array.isArray(resource.participant) ? resource.participant : [];
  const actorOf = (type: string): string | null => {
    for (const entry of participants) {
      const actor = (entry as { actor?: unknown }).actor;
      const raw = typeof actor === "object" && actor !== null ? (actor as { reference?: unknown }).reference : null;
      if (typeof raw === "string" && raw.startsWith(`${type}/`)) return raw.slice(type.length + 1);
    }
    return null;
  };

  const status = (Object.keys(STATUS_MAPPING) as AppointmentStatus[]).find(
    (key) => STATUS_MAPPING[key] !== null && STATUS_MAPPING[key] === resource.status,
  );

  const recovered: Partial<Appointment> = {
    id: resource.id as Appointment["id"],
    // Mapped, so absence is recoverable as null and carries the real distinction.
    patientId: actorOf("Patient") as Appointment["patientId"],
  };
  if (typeof resource.start === "string") recovered.startsAt = resource.start;
  if (status) recovered.status = status;
  const practice = actorOf("Organization");
  if (practice !== null) recovered.practiceId = practice as Appointment["practiceId"];
  const clinician = actorOf("Practitioner");
  if (clinician !== null) recovered.clinicianId = clinician as Appointment["clinicianId"];

  const coding = (resource.appointmentType as { coding?: Array<{ code?: unknown }> } | undefined)
    ?.coding?.[0]?.code;
  if (typeof coding === "string") {
    recovered.appointmentType = coding as NonNullable<Appointment["appointmentType"]>;
  }

  return { recovered, notRecovered: unmappedNames("Appointment") };
}

/**
 * Mappings this module refuses, with the reason each is refused.
 *
 * Data rather than a comment — W196's `REFUSED_FIGURES` shape — so a later unit has to DELETE a
 * stated refusal rather than quietly add an extension.
 */
export const REFUSED_MAPPINGS: Readonly<Record<string, string>> = {
  chronic_care_as_a_condition:
    "Mapping `chronicCare` to a FHIR `Condition`. It is the obvious home, it is one line, and it would have this product assert a clinical diagnosis about a named patient in a document another system reads as clinical. The flag is register membership derived from PMS data (W57), not a finding any clinician made. G7's line runs exactly here, and this is the most consequential single line available in Q19.",
  local_extensions_for_consent:
    "Carrying `smsConsent` and `optedOut` in extensions on Patient. An extension no receiving system is obliged to read, holding an instruction the patient gave about being contacted, is worse than an honest absence: it looks like the consent travelled. FHIR models consent as its own resource for this reason, and shipping one is a decision about disclosure rather than about mapping.",
  approximating_an_unmapped_status:
    "Choosing the nearest R4 status for `open`. `proposed`, `waitlist` and `pending` each already mean something specific and none of them means 'an unfilled slot in a diary'. A coerced value is worse than a dropped field because it is present and false.",
  inventing_a_resolvable_system_uri:
    "Giving the local appointment-type codes a system URI that looks like a published terminology. W227 refused a manufactured provenance for the same reason: a citation nobody can follow is worse than an honest local code, because it borrows authority it has not earned. W238 binds these properly.",
  defaulting_an_unrecovered_field:
    "Filling an unrecovered field with its zero value on the way back in. This is the whole unit: a dropped string returns `undefined` and reads as unknown, a dropped boolean returns `false` and reads as a denial. `Recovered` names what it could not read so nobody has to guess which happened.",
};

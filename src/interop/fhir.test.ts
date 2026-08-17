// W235 verify gate: "round-trip over synthetic records; an unmapped field is NAMED in the output
// rather than dropped silently."
//
// The round-trip is the easy half. The half that matters is the NAMING, because a mapping that
// silently drops a field round-trips perfectly on every field it kept — and passes any test that
// only compares what came back.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./fhir";
import {
  FHIR_VERSION,
  LOCAL_SYSTEM,
  REFUSED_MAPPINGS,
  RESOURCE_MAPPINGS,
  STATUS_MAPPING,
  STATUS_REFUSAL_COPY,
  fromFhirAppointment,
  fromFhirOrganization,
  fromFhirPatient,
  fromFhirPractitioner,
  toFhirAppointment,
  toFhirOrganization,
  toFhirPatient,
  toFhirPractitioner,
} from "./fhir";
import type {
  Appointment,
  AppointmentId,
  AppointmentStatus,
  Clinician,
  ClinicianId,
  Patient,
  PatientId,
  Practice,
  PracticeId,
} from "@/domain/types";

/** Narrow an export or fail loudly. A cast here would hide a refusal as an undefined resource. */
const exported = (result: ReturnType<typeof toFhirAppointment>) => {
  if (!result.ok) throw new Error(`export refused: ${result.errors.join(", ")}`);
  return result.resource;
};

const TYPES = readFileSync(path.join(process.cwd(), "src/domain/types.ts"), "utf8");
const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/fhir.ts"), "utf8");

/** The declared fields of one interface in `src/domain/types.ts`, read off the source. */
function domainFields(name: string): string[] {
  const match = TYPES.match(new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`interface ${name} not found — the census is reading nothing`);
  const fields = [...match[1]!.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]!);
  if (fields.length === 0) throw new Error(`interface ${name} parsed to zero fields`);
  return fields.sort();
}

// Synthetic only, and deliberately with every boolean set to the value that a silent drop would
// destroy: consented, opted out, recalled, chronic, held out. A fixture of `false`s would let the
// whole unit pass while the mapping dropped all seven.
const PATIENT: Patient = {
  id: "pat-1" as PatientId,
  practiceId: "prac-1" as PracticeId,
  usualClinicianId: "cli-0" as ClinicianId,
  smsConsent: true,
  optedOut: true,
  lastAttendedAt: "2026-01-14",
  futureBookingAt: "2026-09-01",
  activeRecall: true,
  chronicCare: true,
  holdout: true,
};

const CLINICIAN: Clinician = {
  id: "cli-0" as ClinicianId,
  practiceId: "prac-1" as PracticeId,
  displayName: "Dr Sam Okafor",
  participating: true,
};

const PRACTICE: Practice = {
  id: "prac-1" as PracticeId,
  name: "Demo Family Practice",
  timezone: "Australia/Melbourne",
  holdoutRate: 0.1,
};

const APPOINTMENT: Appointment = {
  id: "appt-1" as AppointmentId,
  practiceId: "prac-1" as PracticeId,
  clinicianId: "cli-0" as ClinicianId,
  startsAt: "2026-09-01T09:30:00+10:00",
  status: "attended",
  patientId: "pat-1" as PatientId,
  generatedByInvitation: true,
  appointmentType: "long",
};

describe("W235 the register covers every domain field, in both directions", () => {
  it("reads the domain types rather than a list written here", () => {
    // Vacuity guard for the census itself: if the parse returned nothing, every check below would
    // be comparing two empty sets. W221's finding — a proof that matches nothing certifies
    // whatever it was asked about.
    expect(domainFields("Patient").length).toBe(10);
    expect(domainFields("Appointment").length).toBe(8);
  });

  it("accounts for every field of every mapped type, exactly once", () => {
    // THE mechanism. A field added to `Patient` tomorrow fails here until somebody says where it
    // goes in FHIR or why it does not go — which is the only version of this that survives a
    // growing model. W102's shape.
    for (const mapping of RESOURCE_MAPPINGS) {
      const accounted = [
        ...mapping.mapped.map((f) => f.domainField),
        ...mapping.unmapped.map((f) => f.domainField),
      ];
      expect(new Set(accounted).size, `${mapping.resource} declares a field twice`).toBe(
        accounted.length,
      );
      expect(accounted.sort(), `${mapping.resource} does not match ${mapping.domainType}`).toEqual(
        domainFields(mapping.domainType),
      );
    }
  });

  it("covers all four resources and no invented one", () => {
    expect(RESOURCE_MAPPINGS.map((m) => m.resource).sort()).toEqual([
      "Appointment",
      "Organization",
      "Patient",
      "Practitioner",
    ]);
  });
});

describe("W235 an unmapped field is named, and its lie is written down", () => {
  it("names what a naive round-trip would produce, for every unmapped field", () => {
    // `wouldBecome` is the column that does the work. "Dropped" is abstract; "arrives as a patient
    // who never opted out" is the sentence that stops somebody adding a helpful extension.
    const unmapped = RESOURCE_MAPPINGS.flatMap((m) => m.unmapped);
    expect(unmapped.length).toBeGreaterThan(8);
    for (const field of unmapped) {
      expect(field.why.length, `${field.domainField} is unmapped without a reason`).toBeGreaterThan(80);
      expect(
        field.wouldBecome.length,
        `${field.domainField} does not say what a drop would produce`,
      ).toBeGreaterThan(40);
    }
  });

  it("names the boolean lie specifically, because it is not a gap", () => {
    // The unit's headline. Drop a string and it returns `undefined`, which reads as unknown; drop
    // a boolean and it returns `false`, which reads as a denial. The opt-out is the harmful case.
    const patient = RESOURCE_MAPPINGS.find((m) => m.resource === "Patient")!;
    const optedOut = patient.unmapped.find((f) => f.domainField === "optedOut")!;
    expect(optedOut.wouldBecome).toContain("round-trips to `false`");
    expect(optedOut.wouldBecome).toContain("never did");
  });

  it("returns the names in the round-trip, not just in the register", () => {
    // A register nobody reads at runtime is documentation. `notRecovered` puts the same names in
    // the caller's hands at the moment they would otherwise guess.
    const back = fromFhirPatient(toFhirPatient(PATIENT));
    expect([...back.notRecovered].sort()).toEqual([
      "activeRecall",
      "chronicCare",
      "futureBookingAt",
      "holdout",
      "lastAttendedAt",
      "optedOut",
      "smsConsent",
    ]);
  });

  it("never carries a field it also says it could not recover", () => {
    // FOUND BY A MUTATION, AND IT WAS THE WORST CASE. Setting `recovered.optedOut = false` while
    // still listing `optedOut` in `notRecovered` passed every other test in this file — the name
    // was there and the lie was there too, and a caller spreading `{...defaults, ...recovered}`
    // gets the lie regardless of having been told. The invariant was never "the names appear";
    // it is that the two sets are DISJOINT, so a named field is genuinely absent.
    const trips = [
      fromFhirPatient(toFhirPatient(PATIENT)),
      fromFhirPractitioner(toFhirPractitioner(CLINICIAN)),
      fromFhirOrganization(toFhirOrganization(PRACTICE)),
      fromFhirAppointment(exported(toFhirAppointment(APPOINTMENT))),
    ];
    for (const trip of trips) {
      expect(trip.notRecovered.length, "a round trip named nothing").toBeGreaterThan(0);
      for (const name of trip.notRecovered) {
        expect(
          Object.prototype.hasOwnProperty.call(trip.recovered, name),
          `${name} is named as unrecovered AND present on the record`,
        ).toBe(false);
      }
    }
  });

  it("has no function that returns a complete domain record", () => {
    // Structural, because completing a `Patient` here means inventing seven booleans. W233
    // refused an effect without an arm by the same means: the type cannot give the reassuring
    // answer. Asserted on the return types, since a reader would have to notice an absence.
    const seen = [...SOURCE.matchAll(/^export function (\w+)\s*\([\s\S]*?\)\s*:\s*([^{]+)\{/gm)];
    expect(seen.length).toBeGreaterThan(6);
    for (const [, name, returns] of seen) {
      if (!name!.startsWith("fromFhir")) continue;
      expect(returns!.trim(), `${name} returns a complete record`).toMatch(/^Recovered</);
    }
  });
});

describe("W235 the round trip preserves every mapped field", () => {
  it("round-trips a patient", () => {
    const back = fromFhirPatient(toFhirPatient(PATIENT)).recovered;
    expect(back.id).toBe(PATIENT.id);
    expect(back.practiceId).toBe(PATIENT.practiceId);
    expect(back.usualClinicianId).toBe(PATIENT.usualClinicianId);
  });

  it("round-trips a patient with no usual clinician as null, not as missing", () => {
    // `usualClinicianId` is MAPPED, so its absence is recoverable and means something. That is
    // exactly the difference between it and the seven unmapped fields, and it is worth pinning:
    // an absent element here is a real null, not an unknown.
    const back = fromFhirPatient(toFhirPatient({ ...PATIENT, usualClinicianId: null })).recovered;
    expect(back.usualClinicianId).toBeNull();
    expect("usualClinicianId" in back).toBe(true);
    // And no empty reference is emitted, because one would assert a practitioner we cannot name.
    expect(toFhirPatient({ ...PATIENT, usualClinicianId: null }).generalPractitioner).toBeUndefined();
  });

  it("round-trips a practitioner and an organization", () => {
    const clinician = fromFhirPractitioner(toFhirPractitioner(CLINICIAN)).recovered;
    expect(clinician).toEqual({ id: CLINICIAN.id, displayName: CLINICIAN.displayName });
    const practice = fromFhirOrganization(toFhirOrganization(PRACTICE)).recovered;
    expect(practice).toEqual({ id: PRACTICE.id, name: PRACTICE.name });
  });

  it("round-trips an appointment, including the participants", () => {
    const exported = toFhirAppointment(APPOINTMENT);
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(exported.errors.join(", "));
    const back = fromFhirAppointment(exported.resource).recovered;
    expect(back.id).toBe(APPOINTMENT.id);
    expect(back.startsAt).toBe(APPOINTMENT.startsAt);
    expect(back.status).toBe("attended");
    expect(back.practiceId).toBe(APPOINTMENT.practiceId);
    expect(back.clinicianId).toBe(APPOINTMENT.clinicianId);
    expect(back.patientId).toBe(APPOINTMENT.patientId);
    expect(back.appointmentType).toBe("long");
  });

  it("round-trips every exportable status", () => {
    for (const status of Object.keys(STATUS_MAPPING) as AppointmentStatus[]) {
      if (STATUS_MAPPING[status] === null) continue;
      const exported = toFhirAppointment({ ...APPOINTMENT, status });
      if (!exported.ok) throw new Error(`${status} refused unexpectedly`);
      expect(fromFhirAppointment(exported.resource).recovered.status).toBe(status);
    }
  });

  it("emits no participant for an unbooked slot rather than a null actor", () => {
    const exported = toFhirAppointment({ ...APPOINTMENT, status: "cancelled", patientId: null });
    if (!exported.ok) throw new Error(exported.errors.join(", "));
    const participants = exported.resource.participant as Array<Record<string, unknown>>;
    expect(participants).toHaveLength(2);
    expect(JSON.stringify(participants)).not.toContain("Patient/");
    expect(fromFhirAppointment(exported.resource).recovered.patientId).toBeNull();
  });
});

describe("W235 a status with no R4 equivalent is refused, never approximated", () => {
  it("refuses to export an open slot as an appointment", () => {
    // A coerced value is worse than a dropped field: it is present and it is false. In R4 an
    // unfilled bookable slot is a `Slot`, a different resource with its own identity.
    const exported = toFhirAppointment({ ...APPOINTMENT, status: "open", patientId: null });
    expect(exported.ok).toBe(false);
    if (exported.ok) throw new Error("unreachable");
    expect(exported.errors).toEqual(["open_slot_is_not_an_appointment"]);
    expect(STATUS_REFUSAL_COPY.open_slot_is_not_an_appointment).toContain("`Slot`");
  });

  it("keeps the gap visible in the table rather than short", () => {
    // `null` is present as an entry. A table that simply omitted `open` would leave a reader to
    // notice an absence, which is the failure W197 named about a blank cell.
    expect(Object.keys(STATUS_MAPPING).sort()).toEqual([
      "attended",
      "booked",
      "cancelled",
      "dna",
      "open",
    ]);
    expect(STATUS_MAPPING.open).toBeNull();
    // W304: the mapped statuses by NAME. The count said four without saying which four, so a
    // status remapped to null and another added would have kept it green.
    expect(
      Object.entries(STATUS_MAPPING)
        .filter(([, v]) => v !== null)
        .map(([k]) => k)
        .sort(),
    ).toEqual(["attended", "booked", "cancelled", "dna"]);
  });

  it("covers every AppointmentStatus the domain declares", () => {
    const declared = [...TYPES.matchAll(/^\s*\|\s*"(\w+)"\s*\/\/[^\n]*$|^\s*\|\s*"(\w+)"$/gm)];
    expect(declared.length).toBeGreaterThan(0);
    const statusBlock = TYPES.match(/export type AppointmentStatus =([\s\S]*?);/)![1]!;
    const values = [...statusBlock.matchAll(/"(\w+)"/g)].map((m) => m[1]!).sort();
    expect(Object.keys(STATUS_MAPPING).sort()).toEqual(values);
  });
});

describe("W235 what the mapping refuses to do", () => {
  it("never emits a Condition, and says why in the register", () => {
    // The most consequential single line available in Q19: `chronicCare` has an obvious FHIR home
    // and it is the wrong one. Asserted on the OUTPUT as well as the register, because a comment
    // is not a control.
    const emitted = JSON.stringify([
      toFhirPatient(PATIENT),
      toFhirPractitioner(CLINICIAN),
      toFhirOrganization(PRACTICE),
      exported(toFhirAppointment(APPOINTMENT)),
    ]);
    expect(emitted).not.toContain("Condition");
    expect(emitted).not.toContain("chronic");
    expect(REFUSED_MAPPINGS.chronic_care_as_a_condition).toContain("G7");
  });

  it("never exports consent state or the research arm", () => {
    const emitted = JSON.stringify(toFhirPatient(PATIENT));
    for (const leak of ["consent", "optedOut", "opted", "holdout", "recall"]) {
      expect(emitted.toLowerCase(), `the export leaks ${leak}`).not.toContain(leak.toLowerCase());
    }
    // And the fixture really does set them, or the scan above passes over nothing.
    expect(PATIENT.optedOut && PATIENT.holdout && PATIENT.smsConsent && PATIENT.chronicCare).toBe(true);
  });

  it("uses no extension anywhere, which is where all of that would arrive", () => {
    const emitted = JSON.stringify([
      toFhirPatient(PATIENT),
      exported(toFhirAppointment(APPOINTMENT)),
    ]);
    expect(emitted).not.toContain("extension");
  });

  it("borrows no terminology authority it has not earned", () => {
    // W227's manufactured-source rule at a code system. A URI that looks published and resolves
    // to nothing is worse than an honest local code; W238 binds these properly.
    expect(LOCAL_SYSTEM).toContain("example.invalid");
    const exported = toFhirAppointment(APPOINTMENT);
    if (!exported.ok) throw new Error(exported.errors.join(", "));
    expect(JSON.stringify(exported.resource)).toContain("example.invalid");
    expect(JSON.stringify(exported.resource)).not.toMatch(/snomed|loinc|hl7\.org\/fhir\/sid/i);
  });

  it("states a reason for each refusal, and pins the version it targets", () => {
    expect(Object.keys(REFUSED_MAPPINGS).sort()).toEqual([
      "approximating_an_unmapped_status",
      "chronic_care_as_a_condition",
      "defaulting_an_unrecovered_field",
      "inventing_a_resolvable_system_uri",
      "local_extensions_for_consent",
    ]);
    for (const [id, why] of Object.entries(REFUSED_MAPPINGS)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(150);
    }
    // R4 and R5 disagree about several of these, so the target is stated rather than assumed.
    expect(FHIR_VERSION).toBe("4.0.1");
  });
});

describe("W235 the mapping transmits nothing", () => {
  it("has no client, no endpoint and no credential", () => {
    expect(SOURCE).not.toMatch(/\bfetch\(|axios|XMLHttpRequest|https?:\/\/(?!example\.invalid)/);
    expect(SOURCE).not.toMatch(/apiKey|token|secret|bearer|Authorization/i);
    expect(Object.keys(mod).filter((n) => /send|post|push|sync|publish|client/i.test(n))).toEqual([]);
  });
});

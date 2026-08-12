// W237 verify gate: "contract tests against recorded synthetic fixtures in W27/W28's shape; no
// live endpoint exists to call."
//
// Two jobs. Run the contract over a synthetic bundle — which is W27's shape, imported and called
// — and separately PROVE EVERY DETECTOR FIRES, because a harness nobody has watched fail only
// establishes that the suite ran.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./conformance";
import {
  CAPTURED_FIXTURES,
  FIXTURE_REJECTION_COPY,
  WHAT_THIS_DOES_NOT_PROVE,
  WHAT_THIS_PROVES,
  coverageGaps,
  danglingReferences,
  declaredUnmappedNames,
  describeInteropContract,
  identityProblems,
  leakedFieldNames,
  referencesIn,
  rejectionsForFixture,
  type BundleResource,
  type RecordedFixture,
} from "./conformance";
import { ereferralProfile } from "./ereferral";
import { stripComments } from "@/security/reachability";
import {
  RESOURCE_MAPPINGS,
  toFhirAppointment,
  toFhirOrganization,
  toFhirPatient,
  toFhirPractitioner,
} from "./fhir";
import type { ReferralDocument } from "@/referrals/document";
import type {
  Appointment,
  AppointmentId,
  Clinician,
  ClinicianId,
  Patient,
  PatientId,
  Practice,
  PracticeId,
} from "@/domain/types";

const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/conformance.ts"), "utf8");

// Synthetic only. Every patient boolean is TRUE, so a leak of any of them is visible rather than
// indistinguishable from a default — W235's fixture rule, inherited deliberately.
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

const REFERRAL: ReferralDocument = {
  referralId: "ref-1",
  fromPracticeId: "prac-1",
  toPracticeId: "prac-2",
  patientId: "pat-1",
  createdAt: "2026-08-01T10:00:00+10:00",
  createdBy: "cli-0",
  reason: "extended_scope",
  request: "procedure",
  conditionCode: "local-diab-2",
  recordedFactCodes: ["fact-hba1c", "fact-egfr"],
  narrative: null,
};

/** The bundle under test: W235's four resources plus W236's profile, which is also a resource. */
function makeBundle(): BundleResource[] {
  const appointment = toFhirAppointment(APPOINTMENT);
  if (!appointment.ok) throw new Error(appointment.errors.join(", "));
  const profile = ereferralProfile(REFERRAL, true);
  if (!profile.ok) throw new Error(profile.errors.join(", "));
  return [
    toFhirPatient(PATIENT),
    toFhirPractitioner(CLINICIAN),
    toFhirOrganization(PRACTICE),
    appointment.resource,
    profile.profile as unknown as BundleResource,
  ];
}

const PROFILE_TYPE = (ereferralProfile(REFERRAL, true) as { profile: { resourceType: string } })
  .profile.resourceType;

// W27's shape, exactly: import the contract, call it, and the green run is the definition.
describeInteropContract("synthetic bundle", {
  makeBundle,
  expectedResourceTypes: ["Patient", "Practitioner", "Organization", "Appointment", PROFILE_TYPE],
  provenance: "authored_here_from_synthetic_records",
});

describe("W237 the harness declares what it proves, and what it does not", () => {
  it("ships no fixture captured from a real system", () => {
    // Pinned empty. This loop cannot record a real exchange, and a plausible capture with a
    // plausible citation would be a manufactured source — W227's rule. The whole value of a
    // captured fixture is that somebody else's system produced it.
    expect(CAPTURED_FIXTURES).toEqual([]);
  });

  it("says in the suite that no receiving system has ever seen any of this", () => {
    // The sentence a green tick invites a reader to forget, so it is data rather than a comment.
    expect(Object.keys(WHAT_THIS_DOES_NOT_PROVE).length).toBeGreaterThan(3);
    expect(Object.keys(WHAT_THIS_PROVES).length).toBeGreaterThan(2);
    expect(WHAT_THIS_DOES_NOT_PROVE.that_a_real_system_accepts_it).toContain("has ever seen");
    for (const [id, why] of Object.entries({ ...WHAT_THIS_PROVES, ...WHAT_THIS_DOES_NOT_PROVE })) {
      expect(why.length, `${id} is stated without an explanation`).toBeGreaterThan(100);
    }
  });

  it("refuses a fixture claiming a source it does not have, in BOTH directions", () => {
    const authored: RecordedFixture = {
      name: "x",
      provenance: "authored_here_from_synthetic_records",
      citation: null,
      resources: makeBundle(),
    };
    expect(rejectionsForFixture(authored)).toEqual([]);
    // Captured without a citation: the label is the only thing that made it worth more.
    expect(
      rejectionsForFixture({ ...authored, provenance: "captured_from_a_real_system" }),
    ).toEqual(["captured_without_a_citation"]);
    // And the flattering direction, which a one-way check would let through: an authored fixture
    // wearing a citation is claiming a provenance it does not have.
    expect(rejectionsForFixture({ ...authored, citation: "Some vendor sandbox, 2026" })).toEqual([
      "authored_with_a_citation",
    ]);
    expect(rejectionsForFixture({ ...authored, name: " ", resources: [] }).sort()).toEqual([
      "no_name",
      "no_resources",
    ]);
    for (const [id, copy] of Object.entries(FIXTURE_REJECTION_COPY)) {
      expect(copy.length, `${id} has no explanation`).toBeGreaterThan(80);
    }
  });
});

describe("W237 every detector has been seen to fire", () => {
  it("catches a resource with no type, no id, or a duplicate id", () => {
    expect(identityProblems(makeBundle())).toEqual([]);
    const bad: BundleResource[] = [
      { resourceType: "Patient", id: "pat-1" },
      { resourceType: "Patient", id: "pat-1" },
      { resourceType: "Patient" },
      { id: "x-1" },
    ];
    expect(identityProblems(bad).map((p) => p.problem).sort()).toEqual([
      "duplicate_id",
      "missing_id",
      "missing_resource_type",
    ]);
  });

  it("catches a reference pointing at nothing, and honours a declared external one", () => {
    // The most ordinary interop defect there is: it type-checks, it serialises, and the receiver
    // gets a document about somebody it cannot resolve.
    expect(danglingReferences(makeBundle(), declaredExternals())).toEqual([]);
    const orphaned: BundleResource[] = [
      { resourceType: "Appointment", id: "appt-9", participant: [{ actor: { reference: "Patient/pat-9" } }] },
    ];
    expect(danglingReferences(orphaned)).toEqual(["Patient/pat-9"]);
    // Declared external is allowed — pointing outside becomes a statement somebody made.
    expect(danglingReferences(orphaned, ["Patient/pat-9"])).toEqual([]);
  });

  it("finds references however deeply nested", () => {
    // The walker is the part that silently under-reports: a reference three levels down that the
    // scan never reaches makes every bundle look clean.
    const deep = { a: [{ b: { c: { reference: "Patient/pat-7" } } }] };
    expect(referencesIn(deep)).toEqual(["Patient/pat-7"]);
    expect(referencesIn(makeBundle()).length).toBeGreaterThan(3);
  });

  it("catches a declared-unmapped field leaking into the bundle", () => {
    expect(leakedFieldNames(makeBundle())).toEqual([]);
    const leaky: BundleResource[] = [
      { resourceType: "Patient", id: "pat-1", optedOut: false, extra: { holdout: true } },
    ];
    expect(leakedFieldNames(leaky)).toEqual(["holdout", "optedOut"]);
  });

  it("takes the union of BOTH interop registers, not one module's list", () => {
    // Checking per module leaves the next module free to leak the same field. `conditionCode` is
    // W236's and `optedOut` is W235's; both must be in scope for either bundle.
    const names = declaredUnmappedNames();
    expect(names).toContain("optedOut");
    expect(names).toContain("holdout");
    expect(names).toContain("conditionCode");
    expect(names).toContain("toPracticeId");
  });

  it("catches a resource type the bundle was supposed to exercise and does not", () => {
    // Every other check is per resource, so a missing type makes them vacuous and "conformant"
    // would mean "conformant for whatever we happened to include".
    expect(coverageGaps(makeBundle(), ["Patient", "Appointment"])).toEqual([]);
    expect(coverageGaps(makeBundle(), ["Patient", "Coverage", "Consent"])).toEqual([
      "Consent",
      "Coverage",
    ]);
  });

  it("would notice a non-deterministic builder", () => {
    let n = 0;
    const drifting = () => [{ resourceType: "Patient", id: `pat-${(n += 1)}` }];
    expect(JSON.stringify(drifting())).not.toBe(JSON.stringify(drifting()));
  });
});

describe("W237 the declared coverage tracks W235's mapping, in both directions", () => {
  it("exercises every resource W235 knows how to build", () => {
    // The census, so a fifth resource cannot be added to the mapping without a fixture for it.
    // Without this the coverage list is whatever somebody remembered on the day.
    const mapped = RESOURCE_MAPPINGS.map((m) => m.resource).sort();
    const present = [...new Set(makeBundle().map((r) => String(r.resourceType)))];
    for (const resource of mapped) {
      expect(present, `${resource} is mapped but never exercised by the harness`).toContain(resource);
    }
    // And W236's profile too, which is a resource even though it is not in W235's table.
    expect(present).toContain(PROFILE_TYPE);
  });
});

describe("W237 no live endpoint exists to call", () => {
  it("holds no client, no host and no credential", () => {
    // Structural rather than observed: "we did not call anything" stays true until somebody adds
    // a convenience, so it is asserted on the source and on the namespace.
    // ELEVENTH INSTANCE OF THE RECURRING COLLISION, and here the fix is W173's rather than
    // W198's: the words `endpoint` and `Authorization` appear in the module note precisely
    // BECAUSE it explains why neither exists in the code. Rewording the note would make it
    // worse, so the comments are subtracted and THE SUBTRACTION IS ASSERTED TO BE REAL before
    // anything is scanned — a stripper that silently returned its input would certify a clean
    // result over the same text.
    const code = stripComments(SOURCE);
    expect(code.length).toBeLessThan(SOURCE.length);
    expect(SOURCE, "the phrase that proves the subtraction is gone").toContain("NO LIVE ENDPOINT");
    expect(code, "comments were not actually removed").not.toContain("NO LIVE ENDPOINT");
    // And the stripper must not have eaten the code with them.
    expect(code).toContain("export function danglingReferences");

    expect(code).not.toMatch(/\bfetch\(|axios|XMLHttpRequest|WebSocket|node:https?/);
    expect(code).not.toMatch(/https?:\/\//);
    // Narrowed to CODE CONSTRUCTS, and the first version was not. Stripping the comments still
    // left the bare word `endpoint` — inside `WHAT_THIS_DOES_NOT_PROVE`, in the sentence saying a
    // real e-referral endpoint has never accepted any of this. That string is exported data and
    // it is exactly right, so W198's rule applies: a check must not push an author into worse
    // copy. The property is "no client, no host, no credential", and an English word in a
    // paragraph is none of the three.
    expect(code).not.toMatch(/\b(apiKey|baseUrl|bearerToken)\b|["']Authorization["']|\bendpoint\s*[:=]/i);
    expect(
      Object.keys(mod).filter((n) => /send|post|fetch|client|endpoint|transport|sync/i.test(n)),
    ).toEqual([]);
    // The guard that the namespace scan is looking at something.
    expect(Object.keys(mod).length).toBeGreaterThan(8);
  });

  it("takes the bundle from a builder, never from a caller-supplied address", () => {
    for (const match of stripComments(SOURCE).matchAll(/^export function (\w+)\s*\(([\s\S]*?)\)\s*:/gm)) {
      expect(match[2]!.replace(/\s+/g, " "), `${match[1]} takes an address`).not.toMatch(
        /url|host|address|uri:|port/i,
      );
    }
  });
});

/** The bundle's own external references: none, because every reference resolves inside it. */
function declaredExternals(): string[] {
  return [];
}

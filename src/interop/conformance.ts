// W237: the interop conformance harness — and an honest account of what it proves.
//
// W27 built this shape for the PMS side: a contract exported from a non-test module, imported and
// called from an implementation's own test file, so that a green run IS the definition of
// conformance. This is the same shape pointed at what LEAVES, and it needs one thing W27 did not.
//
// A CONFORMANCE SUITE WHOSE FIXTURE AND IMPLEMENTATION SHARE AN AUTHOR IS A MIRROR. W27's
// contract checks a read adapter against properties of the real world — a slot is open, a range
// filters, a read is idempotent — and the synthetic adapter can genuinely fail them. An interop
// conformance suite is different: the thing it would check us against is whether a REAL RECEIVING
// SYSTEM accepts what we send, and there is no such system here, by design and by gate. So every
// fixture is something this tree wrote, checked against a mapping this tree wrote, and it will
// pass forever while reading as "conformant with FHIR R4".
//
// That is not a reason to skip the harness. It is a reason to make the harness say what it is.
// `WHAT_THIS_PROVES` and `WHAT_THIS_DOES_NOT_PROVE` are exported data rather than a comment, every
// fixture carries its provenance, and `CAPTURED_FIXTURES` — examples taken from a real system —
// is EMPTY and pinned empty. The day somebody records a real exchange, the register makes the
// difference between the two kinds of fixture visible instead of letting the new one blend in.
//
// W56'S PROVENANCE RULE, AND W227'S REASON FOR THE EMPTINESS. A fixture claiming to be captured
// must say from what, when and by whom; the validator refuses one without. It ships empty because
// this loop cannot record a real exchange, and a plausible "captured" fixture with a plausible
// citation would be a manufactured source — which is worse than having none, because the whole
// value of a captured fixture is that somebody else's system produced it.
//
// A HARNESS THAT CANNOT FAIL IS THE META-VACUITY, so every detector here is a pure function that
// its own test feeds known-bad input to. "The suite is green" means something only if each check
// has been seen to fire.
//
// WHAT IT ACTUALLY CHECKS, and each is a real bug class rather than a restatement of the types:
//
//   DANGLING REFERENCES. A `Patient/pat-9` reference to a resource not in the bundle is the most
//   ordinary interop defect there is, it type-checks perfectly, and the receiving system sees a
//   document about somebody it cannot resolve. External references are allowed but must be
//   DECLARED by the fixture, so "it points outside" is a statement somebody made rather than the
//   default for anything unresolvable.
//
//   DECLARED-UNMAPPED FIELDS APPEARING ANYWAY. W235 and W236 each list the fields they refuse to
//   export. Checking that per module leaves the next module free to leak the same field, so the
//   harness takes the union of both registers and scans the whole bundle. This is where
//   `optedOut` and `holdout` would reappear.
//
//   COVERAGE, BECAUSE EVERY OTHER CHECK IS PER RESOURCE. A bundle with no Appointment in it
//   satisfies every appointment property vacuously, and "conformant" would then mean "conformant
//   for whatever we happened to include". The fixture declares the types it must exercise and the
//   harness fails if one is missing — and `conformance.test.ts` checks that declared set against
//   W235's mapping, so a fifth resource cannot be added without a fixture for it.
//
//   DETERMINISM. The same records must emit byte-identical output. An exchange that differs run
//   to run cannot be diffed, cached or acknowledged, and W27 made the same demand of a read.
//
// NO LIVE ENDPOINT EXISTS TO CALL, and that is structural rather than observed. Nothing here
// imports a client, holds a URL or takes a base address; there is no options object through which
// one could arrive. A test asserts it on the source and on the namespace, because "we did not
// call anything" is the kind of claim that stays true until somebody adds a convenience.
//
// FOUNDER GATES (plan §4): G1 covers anything live, and nothing here is. The bundles are built
// from synthetic records; no credential, no host, no transmission.

import { describe, expect, it } from "vitest";
import { RESOURCE_MAPPINGS } from "./fhir";
import { UNMAPPED_REFERRAL_FIELDS } from "./ereferral";

/** Anything with a resource type and an id — W235's resources and W236's profile alike. */
export type BundleResource = Record<string, unknown> & { resourceType?: unknown; id?: unknown };

export type FixtureProvenance =
  /** Written in this tree from synthetic records. Proves self-consistency and nothing more. */
  | "authored_here_from_synthetic_records"
  /** Taken from a real system's response. None exist — see `CAPTURED_FIXTURES`. */
  | "captured_from_a_real_system";

export interface RecordedFixture {
  name: string;
  provenance: FixtureProvenance;
  /**
   * Required when captured: what system, when, and by whom.
   *
   * Null is correct for an authored fixture — there is no source to cite, and inventing one would
   * be the manufactured provenance W227 refused.
   */
  citation: string | null;
  resources: readonly BundleResource[];
}

/**
 * Fixtures recorded from a real system. EMPTY, and pinned empty by its own test.
 *
 * Not a founder gate — no gate covers keeping an example of somebody else's JSON. It is empty
 * because this loop cannot record a real exchange, and a plausible capture with a plausible
 * citation would be a manufactured source. The whole value of a captured fixture is that another
 * system produced it, so one we wrote and labelled "captured" is worth less than nothing.
 */
export const CAPTURED_FIXTURES: readonly RecordedFixture[] = [];

export type FixtureRejection =
  | "no_name"
  | "no_resources"
  | "captured_without_a_citation"
  | "authored_with_a_citation";

export const FIXTURE_REJECTION_COPY: Record<FixtureRejection, string> = {
  no_name: "A fixture with no name cannot be referred to in a failure message, which is the only moment anybody reads one.",
  no_resources: "An empty fixture satisfies every per-resource check vacuously, so it would report conformance over nothing.",
  captured_without_a_citation:
    "A fixture claiming to come from a real system must say which system, when, and who recorded it. Without that it is an authored fixture wearing a stronger label, and the label is the only thing that made it worth more.",
  authored_with_a_citation:
    "An authored fixture carrying a citation is claiming a source it does not have. Refused in this direction too, because a register that only checks one direction lets the more flattering error through.",
};

/** Validate one fixture, returning every reason it is refused. */
export function rejectionsForFixture(fixture: RecordedFixture): FixtureRejection[] {
  const out: FixtureRejection[] = [];
  if (fixture.name.trim() === "") out.push("no_name");
  if (fixture.resources.length === 0) out.push("no_resources");
  const cited = (fixture.citation ?? "").trim() !== "";
  if (fixture.provenance === "captured_from_a_real_system" && !cited) {
    out.push("captured_without_a_citation");
  }
  if (fixture.provenance === "authored_here_from_synthetic_records" && cited) {
    out.push("authored_with_a_citation");
  }
  return out;
}

export const WHAT_THIS_PROVES: Readonly<Record<string, string>> = {
  internal_consistency:
    "That what this tree emits is well formed against its own declared mapping: every resource has a type and an id, every reference inside a bundle resolves or is declared external, no field either interop module declared unmapped appears in the output, and the same records emit the same bytes twice.",
  regression:
    "That a change to a mapping or a builder which breaks any of the above is caught the same day. This is the harness's real, ordinary value and it is not a small one.",
  round_trip:
    "That every resource read back through W235 recovers its mapped fields and names the fields it could not, so a silent drop cannot pass as a clean exchange.",
};

export const WHAT_THIS_DOES_NOT_PROVE: Readonly<Record<string, string>> = {
  that_a_real_system_accepts_it:
    "No receiving system has ever seen any of this. Conformance in the sense that matters commercially is whether a real e-referral endpoint accepts the document, and that cannot be known from here.",
  conformance_to_the_published_specification:
    "The fixtures encode this tree's reading of R4, not the specification. Where the reading is wrong, the fixture is wrong the same way and the suite is green — which is exactly why the fixture provenance is recorded rather than assumed.",
  that_the_codes_mean_what_we_think:
    "Every code in these fixtures is from a local system (W235's `example.invalid`). W238 binds real terminology with provenance; until then a green run says nothing about whether a receiver would understand the codes.",
  that_a_receiver_would_read_it_the_same_way:
    "A document can be structurally valid and still be misread — the unmapped consent state in W235 is the standing example. A green harness is not evidence that an absent field will be interpreted as absent rather than as false.",
};

export interface IdentityProblem {
  index: number;
  problem: "missing_resource_type" | "missing_id" | "duplicate_id";
  detail: string;
}

/** Resources missing a type or id, or sharing one. Pure, so its own test can make it fire. */
export function identityProblems(resources: readonly BundleResource[]): IdentityProblem[] {
  const out: IdentityProblem[] = [];
  const seen = new Map<string, number>();
  resources.forEach((resource, index) => {
    const type = resource.resourceType;
    const id = resource.id;
    if (typeof type !== "string" || type.trim() === "") {
      out.push({ index, problem: "missing_resource_type", detail: String(type) });
    }
    if (typeof id !== "string" || id.trim() === "") {
      out.push({ index, problem: "missing_id", detail: String(id) });
      return;
    }
    const key = `${String(type)}/${id}`;
    const first = seen.get(key);
    if (first !== undefined) {
      out.push({ index, problem: "duplicate_id", detail: `${key} also at index ${first}` });
    } else {
      seen.set(key, index);
    }
  });
  return out;
}

/** Every `Type/id` reference in a resource tree, however deeply nested. */
export function referencesIn(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) referencesIn(item, found);
    return found;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      if (key === "reference" && typeof child === "string") found.push(child);
      else referencesIn(child, found);
    }
  }
  return found;
}

/**
 * References that point at nothing in the bundle and were not declared external.
 *
 * The most ordinary interop defect there is: it type-checks, it serialises, and the receiver gets
 * a document about somebody it cannot resolve. External references are ALLOWED but must be
 * declared, so pointing outside is a statement somebody made rather than the fallback for
 * anything unresolvable.
 */
export function danglingReferences(
  resources: readonly BundleResource[],
  externalReferences: readonly string[] = [],
): string[] {
  const present = new Set<string>();
  for (const resource of resources) {
    if (typeof resource.resourceType === "string" && typeof resource.id === "string") {
      present.add(`${resource.resourceType}/${resource.id}`);
    }
  }
  const allowed = new Set(externalReferences);
  const dangling = new Set<string>();
  for (const resource of resources) {
    for (const found of referencesIn(resource)) {
      if (!present.has(found) && !allowed.has(found)) dangling.add(found);
    }
  }
  return [...dangling].sort();
}

/**
 * Field names both interop registers declare unmapped — the union, not one module's list.
 *
 * Checking per module leaves the next module free to leak the same field. This is where
 * `optedOut` and `holdout` would reappear.
 */
export function declaredUnmappedNames(): string[] {
  const fromResources = RESOURCE_MAPPINGS.flatMap((m) => m.unmapped.map((f) => f.domainField));
  const fromReferral = UNMAPPED_REFERRAL_FIELDS.map((f) => f.domainField);
  return [...new Set([...fromResources, ...fromReferral])].sort();
}

/** Declared-unmapped field names that appear as keys anywhere in the bundle. */
export function leakedFieldNames(
  resources: readonly BundleResource[],
  forbidden: readonly string[] = declaredUnmappedNames(),
): string[] {
  const banned = new Set(forbidden);
  const found = new Set<string>();
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value === "object" && value !== null) {
      for (const [key, child] of Object.entries(value)) {
        if (banned.has(key)) found.add(key);
        walk(child);
      }
    }
  };
  walk(resources);
  return [...found].sort();
}

/** Declared resource types the bundle does not actually contain. */
export function coverageGaps(
  resources: readonly BundleResource[],
  expected: readonly string[],
): string[] {
  const present = new Set(
    resources.map((r) => r.resourceType).filter((t): t is string => typeof t === "string"),
  );
  return expected.filter((type) => !present.has(type)).sort();
}

export interface InteropContractFixture {
  /** Build the bundle. Called twice, so the determinism check is a real one. */
  makeBundle: () => readonly BundleResource[];
  /** Resource types this bundle must exercise. A missing one fails rather than passing quietly. */
  expectedResourceTypes: readonly string[];
  /** References allowed to point outside the bundle, declared rather than assumed. */
  externalReferences?: readonly string[];
  /** How this fixture came to exist. Validated — see `rejectionsForFixture`. */
  provenance: FixtureProvenance;
  citation?: string | null;
}

/**
 * The interop contract. W27's shape: import this, call it, and a green run is the definition.
 *
 * Every check below is a pure function above, so `conformance.test.ts` can feed each one
 * known-bad input and watch it fire. A harness nobody has seen fail is a harness that proves the
 * suite ran.
 */
export function describeInteropContract(label: string, fixture: InteropContractFixture): void {
  describe(`interop contract: ${label}`, () => {
    const recorded = (): RecordedFixture => ({
      name: label,
      provenance: fixture.provenance,
      citation: fixture.citation ?? null,
      resources: fixture.makeBundle(),
    });

    it("is a valid fixture, and says where it came from", () => {
      expect(rejectionsForFixture(recorded())).toEqual([]);
    });

    it("emits something at all", () => {
      // W27's guard. Every per-resource check below is vacuous over an empty bundle, and an
      // empty bundle is what a broken builder produces.
      expect(fixture.makeBundle().length).toBeGreaterThan(0);
    });

    it("exercises every resource type it declares", () => {
      expect(coverageGaps(fixture.makeBundle(), fixture.expectedResourceTypes)).toEqual([]);
      expect(fixture.expectedResourceTypes.length).toBeGreaterThan(0);
    });

    it("gives every resource a type and a unique id", () => {
      expect(identityProblems(fixture.makeBundle())).toEqual([]);
    });

    it("leaves no reference pointing at nothing", () => {
      expect(danglingReferences(fixture.makeBundle(), fixture.externalReferences ?? [])).toEqual([]);
    });

    it("carries no field either interop register declares unmapped", () => {
      expect(leakedFieldNames(fixture.makeBundle())).toEqual([]);
    });

    it("emits the same bytes twice", () => {
      // An exchange that differs run to run cannot be diffed, cached or acknowledged. W27 made
      // the same demand of a read.
      expect(JSON.stringify(fixture.makeBundle())).toBe(JSON.stringify(fixture.makeBundle()));
    });

    it("states what a green run here does not prove", () => {
      // In the suite rather than in a document, because the sentence that matters — no receiving
      // system has ever seen any of this — is the one a green tick invites a reader to forget.
      expect(Object.keys(WHAT_THIS_DOES_NOT_PROVE).length).toBeGreaterThan(3);
      expect(WHAT_THIS_DOES_NOT_PROVE.that_a_real_system_accepts_it).toContain("has ever seen");
    });
  });
}

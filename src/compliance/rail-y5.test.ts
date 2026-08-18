// W259 verify gate: "W200's five rail properties re-derived; Q17's matching optimisation tested
// against them explicitly, since it is the first Y5 work that could have moved the line."
//
// EXPLICITLY is the instruction, and it is what separates this file from the register beside it.
// Every claim in `Y5_REDERIVATIONS` has an assertion here, run against the matcher's own types and
// output — because W200's finding was a control that had stopped matching the product, and a
// re-derivation written by re-reading is the exact method that would have missed it.
//
// The re-derivations themselves are checked the way W200 checked its own: both directions against
// `RAIL_PROPERTIES`, and every entry must cite a Y5 unit, so none of them is about the old tree.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PATIENT_FIELD_CLASSIFICATION,
  RAIL_PROPERTY_IDS,
  REDERIVED_PROPERTY_IDS,
  REFUSED_REDERIVATION_SHORTCUTS,
  Y5_FIRST_UNIT,
  Y5_REDERIVATIONS,
} from "./rail-y5";
import { OPERATOR_COPY_SURFACES, Y4_FIRST_UNIT } from "./cdss-boundary";
import {
  MATCH_REASON_COPY,
  candidateFrom,
  type MatchCandidate,
  type MatchSlot,
} from "@/matching/explain";
import { matchSlots } from "@/matching/match";
import { capacityConsoleView } from "@/capacity/console";
import { EXCHANGE_STATE_COPY } from "@/interop/exchange-state";
import { lintMessageText } from "@/messaging/templates";
import { lintEducationCopy } from "@/education/advice-lint";
import type { Patient, PatientId, PracticeId } from "@/domain/types";
import type { RecordedUtilisation } from "@/capacity/model";

const ROOT = process.cwd();
const read = (...parts: string[]) => readFileSync(path.join(ROOT, ...parts), "utf8");
const TYPES_SOURCE = read("src", "domain", "types.ts");
const EXPLAIN_SOURCE = read("src", "matching", "explain.ts");
const MATCH_SOURCE = read("src", "matching", "match.ts");

/** `Patient`'s fields, read off the type rather than listed here. */
function patientFields(): string[] {
  const shape = TYPES_SOURCE.match(/export interface Patient \{[\s\S]*?\n\}/)![0];
  return [...shape.matchAll(/^\s{2}(\w+)[?]?:/gm)].map((m) => m[1]!).sort();
}

const patient = (over: Partial<Patient> = {}): Patient => ({
  id: "pat-1" as PatientId,
  practiceId: "prac-1" as PracticeId,
  usualClinicianId: null,
  smsConsent: true,
  optedOut: false,
  lastAttendedAt: "2026-01-01",
  futureBookingAt: null,
  activeRecall: false,
  chronicCare: false,
  holdout: false,
  ...over,
});

const slot = (slotId: string, startsAt: string): MatchSlot => ({
  slotId,
  practiceId: "prac-1",
  startsAt,
});

describe("W259 the re-derivation is checked, not merely written", () => {
  it("covers every rail property and invents none", () => {
    // Both directions against W200's register, so the two cannot drift apart silently.
    expect([...REDERIVED_PROPERTY_IDS].sort()).toEqual([...RAIL_PROPERTY_IDS].sort());
    expect(new Set(REDERIVED_PROPERTY_IDS).size).toBe(REDERIVED_PROPERTY_IDS.length);
  });

  it("names a Y5 surface and a built reason for each, never a 'still holds'", () => {
    for (const entry of Y5_REDERIVATIONS) {
      expect(entry.y5Surface.length, `${entry.propertyId} names no Y5 surface`).toBeGreaterThan(80);
      expect(entry.whyItSurvived.length, `${entry.propertyId} is asserted, not re-derived`).toBeGreaterThan(200);
      expect(entry.assertedBy, `${entry.propertyId} names no assertion`).toContain("rail-y5.test.ts");
      expect(entry.whyItSurvived.toLowerCase()).not.toMatch(/still (holds|true)|unchanged since/);
    }
  });

  it("cites a Y5 unit in every entry, so none of them is about the old tree", () => {
    // W200's own check, one year on. The old units are why a property exists; the question is
    // whether five quarters of new product moved it.
    for (const entry of Y5_REDERIVATIONS) {
      const cited = [...`${entry.y5Surface} ${entry.whyItSurvived}`.matchAll(/\bW(\d+)\b/g)].map(
        (m) => Number(m[1]),
      );
      expect(cited.length, `${entry.propertyId} cites no unit`).toBeGreaterThan(0);
      expect(
        cited.some((u) => u >= Y5_FIRST_UNIT),
        `${entry.propertyId} re-derives against no Y5 unit`,
      ).toBe(true);
    }
  });

  it("names the five shortcuts it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_REDERIVATION_SHORTCUTS).sort()).toEqual([
      "a_still_true_line",
      "citing_only_old_units",
      "prose_with_no_assertion",
      "reading_the_sort_instead_of_running_it",
      "testing_the_four_fields_somebody_remembered",
    ]);
    for (const [name, why] of Object.entries(REFUSED_REDERIVATION_SHORTCUTS)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
  });
});

describe("W259 property one: the matcher cannot see a clinician, and order does not follow figures", () => {
  it("gives a slot nowhere to name a clinician", () => {
    // Preferring one is not a line somebody could add — it is a field somebody would have to add
    // to a declared shape, which is a visible change rather than an edit inside a sort.
    const shape = EXPLAIN_SOURCE.match(/export interface MatchSlot \{[\s\S]*?\n\}/)![0];
    expect(shape).toContain("slotId");
    expect(shape, "MatchSlot gained a clinician").not.toMatch(/clinician/i);
    const built: MatchSlot = slot("s1", "2026-06-01T09:00:00Z");
    expect(Object.keys(built).sort()).toEqual(["practiceId", "slotId", "startsAt"]);
  });

  it("never mentions a clinician anywhere in the matcher", () => {
    for (const [name, source] of [
      ["explain", EXPLAIN_SOURCE],
      ["match", MATCH_SOURCE],
    ] as const) {
      const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
      expect(code, `${name} reads a clinician`).not.toMatch(/clinicianId/);
    }
  });

  it("does not move capacity row order when the figures move", () => {
    // THE ASSERTION FOR THIS QUARTER'S SURFACE. W253 publishes per-clinician figures over HTTP for
    // the first time; a caller reading them as a league table would be reading an order the product
    // produced. Permuted rather than read, because reading the comparator proves it about today.
    const session = (clinicianId: string, dateIso: string, filled: number): RecordedUtilisation => ({
      session: { practiceId: "prac-1", clinicianId, dateIso, weekday: 4, slots: 10 },
      filled,
      open: 10 - filled,
      released: 0,
    });
    const weeks = ["2026-03-05", "2026-03-12", "2026-03-19", "2026-03-26", "2026-04-02", "2026-04-09"];
    const build = (aFill: number, bFill: number) =>
      weeks.flatMap((date) => [session("cli-a", date, aFill), session("cli-b", date, bFill)]);

    const aBest = capacityConsoleView(build(9, 2));
    const bBest = capacityConsoleView(build(2, 9));
    const order = (view: ReturnType<typeof capacityConsoleView>) =>
      view.state === "sessions" ? view.rows.map((r) => `${r.weekday}::${r.clinicianId}`) : [];

    expect(order(aBest).length, "the fixture produced no rows").toBeGreaterThan(1);
    expect(order(aBest), "row order followed the figures").toEqual(order(bBest));
    expect(order(aBest)).toEqual(["4::cli-a", "4::cli-b"]);
  });
});

describe("W259 property two: nothing in Y5's matcher or rail decides that care transferred", () => {
  it("produces no acceptance and no transfer anywhere in the matcher", () => {
    for (const source of [EXPLAIN_SOURCE, MATCH_SOURCE]) {
      expect(source).not.toMatch(/accepted|handed_back|careHolder|transferr?ed/i);
    }
  });

  it("keeps W244's four exchange states with no arrival among them", () => {
    // A boundary that reported delivery would be one step from reporting handover.
    expect(Object.keys(EXCHANGE_STATE_COPY).sort()).toEqual([
      "acknowledged",
      "not_attempted",
      "rejected_by_recipient",
      "sent_no_response",
    ]);
    expect(EXCHANGE_STATE_COPY.sent_no_response).toContain("not a delivery");
  });
});

describe("W259 property three: an absence produces a declared reason, never an inference", () => {
  it("offers nobody an appointment on the strength of an empty availability list", () => {
    const nobodyAvailable: MatchCandidate = candidateFrom(patient(), [], 0);
    const decisions = matchSlots([nobodyAvailable], [slot("s1", "2026-06-01T09:00:00Z")]);
    const serialised = JSON.stringify(decisions);
    expect(serialised).not.toContain("s1");
    // And the reason it was not offered is a DECLARED one rather than a silence.
    expect(serialised).toMatch(/reason/);
  });
});

describe("W259 property four: the matcher's reasons are a closed vocabulary", () => {
  it("has no field for prose and passes W6's linter on every reason", () => {
    for (const [reason, copy] of Object.entries(MATCH_REASON_COPY)) {
      expect(lintMessageText(copy), reason).toEqual([]);
      expect(copy.length, reason).toBeGreaterThan(10);
    }
    const shape = EXPLAIN_SOURCE.match(/export interface MatchExplanation \{[\s\S]*?\n\}/)![0];
    expect(shape, "an explanation grew a free-text field").not.toMatch(/note|comment|freeText|prose/i);
  });
});

describe("W259 property five: W200's detector followed the product without being told to", () => {
  it("has every Y5 module inside the declared copy surface, by the same detector", () => {
    // THE PART WORTH RECORDING. W200's register decides membership by reading each module's own
    // header against `Y4_FIRST_UNIT`, so Y5's modules were compelled in as they landed — no edit
    // to the detector, nobody remembering. A hand-kept list would have covered the modules
    // somebody remembered, which is exactly what it did in Y4.
    const declared = new Set(OPERATOR_COPY_SURFACES.map((s) => s.module));
    const y5Declared = [...declared].filter((m) => {
      const header = read(...m.split("/")).split("\n")[0] ?? "";
      const unit = header.match(/^\/\/ W(\d+)/);
      return unit !== null && Number(unit[1]) >= Y5_FIRST_UNIT;
    });
    expect(y5Declared.length, "no Y5 module reached the copy surface").toBeGreaterThan(15);
    expect(Y5_FIRST_UNIT).toBeGreaterThan(Y4_FIRST_UNIT);
  });

  it("has the advice linter still catching something, so the clean sweep means anything", () => {
    // The register's coverage is checked above; this checks the RULE is still sharp. A linter that
    // matched nothing would make W200's clean result over sixty Y5 modules worth nothing, which is
    // the vacuity failure this tree keeps finding in its own controls.
    expect(lintEducationCopy("Your practice recorded six sessions last month.")).toEqual([]);
    expect(
      lintEducationCopy("You should book a review appointment if this continues.").length,
      "the advice linter has stopped catching advice",
    ).toBeGreaterThan(0);
  });
});

describe("W259 the control this re-derivation produced", () => {
  it("classifies every field on Patient, and no field Patient does not have", () => {
    // W213's guarantee was tested against four fields somebody remembered plus a pin on the
    // projection's keys — both sound, neither a census. A new field on `Patient` now fails until
    // somebody says whether the matcher may see it.
    expect(PATIENT_FIELD_CLASSIFICATION.map((r) => r.field).sort()).toEqual(patientFields());
    expect(new Set(PATIENT_FIELD_CLASSIFICATION.map((r) => r.field)).size).toBe(
      PATIENT_FIELD_CLASSIFICATION.length,
    );
    for (const rule of PATIENT_FIELD_CLASSIFICATION) {
      expect(rule.why.length, `${rule.field} is classified without a reason`).toBeGreaterThan(60);
    }
  });

  it("agrees with what `candidateFrom` actually carries, in both directions", () => {
    // The classification is checked against the projection rather than believed. Carrying a field
    // declared withheld fails; withholding one declared carried fails too.
    const projected = new Set(Object.keys(candidateFrom(patient(), ["s1"], 0)));
    // `id` and `practiceId` arrive under the matcher's own names.
    const carriedAs: Record<string, string> = { id: "candidateRef", practiceId: "practiceId" };
    for (const rule of PATIENT_FIELD_CLASSIFICATION) {
      const name = carriedAs[rule.field] ?? rule.field;
      expect(projected.has(name), `${rule.field} is declared carried=${rule.carried}`).toBe(
        rule.carried,
      );
    }
    // Non-vacuity: the projection is not empty, so the loop above is checking something.
    expect(projected.size).toBeGreaterThan(2);
  });

  it("withholds every clinical field, and says what ordering by it would be", () => {
    const withheld = PATIENT_FIELD_CLASSIFICATION.filter((r) => !r.carried).map((r) => r.field);
    expect(withheld).toContain("chronicCare");
    expect(withheld).toContain("lastAttendedAt");
    expect(withheld).toContain("usualClinicianId");
    expect(withheld).toContain("holdout");
    // The one that does not look clinical is argued as the dangerous one.
    const lastAttended = PATIENT_FIELD_CLASSIFICATION.find((r) => r.field === "lastAttendedAt")!;
    expect(lastAttended.why).toContain("proxy for need");
  });

  it("still produces the same plan when a withheld field changes", () => {
    // The value-level check W213/W214 already made, kept rather than replaced: the census says
    // which fields, and this says the projection genuinely does not respond to them.
    const slots = [slot("s1", "2026-06-01T09:00:00Z"), slot("s2", "2026-06-01T10:00:00Z")];
    const ordinary = candidateFrom(patient({ chronicCare: false, activeRecall: false }), ["s1", "s2"], 0);
    const clinical = candidateFrom(patient({ chronicCare: true, activeRecall: true }), ["s1", "s2"], 0);
    expect(ordinary).toEqual(clinical);
    expect(JSON.stringify(matchSlots([ordinary], slots))).toBe(
      JSON.stringify(matchSlots([clinical], slots)),
    );
  });
});

// W219 verify gate: cohort-level only; per-patient effect estimates are refused BY ABSENCE — no
// function exists, asserted on the module namespace.
//
// The absences here need a different kind of test from the behaviours, so they get one: the
// namespace for names, every exported signature for parameters (W215's method, because
// `estimateFor` reads innocently), and the per-kind label as a LITERAL TYPE rather than a value a
// test hopes stays false.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_SIM_CONFIG, runSim } from "@/sim/harness";
import type { AttributionResult } from "@/engine/attribution";
import { buildResponseGraph, eventsFromSim, interventionsFromSim, type ResponseGraph } from "./response-graph";
import * as mod from "./attribution-v2";
import { NOT_ATTRIBUTABLE_PER_KIND, REFUSED_SCOPES, attributionV2, renderAttributionV2 } from "./attribution-v2";

const SOURCE = readFileSync(path.join(process.cwd(), "src/outcomes/attribution-v2.ts"), "utf8");
const PERIOD = { fromIso: "2026-08-08", toIso: "2026-09-19" };
const sim = runSim({ ...DEFAULT_SIM_CONFIG, weeks: 6 });


/**
 * A hand-built graph, because the sim cannot exercise either property that matters here.
 *
 * Six weeks of W12 produce ONE intervention kind, each answered exactly once — so a test over the
 * sim cannot tell `answered` from `recordedAnswers` (they are equal) and cannot tell an
 * alphabetical order from any other (there is one element). Both were green against mutations
 * that broke them. This fixture gives two kinds, one of them double-answered, and orders them so
 * that by-kind and by-volume disagree.
 */
const twoKinds = (): ResponseGraph => ({
  provenance: "synthetic_sim",
  basis: { source: "fixture", recordedFacts: 19, fromIso: PERIOD.fromIso, toIso: PERIOD.toIso },
  edges: [
    {
      from: "invitation_offered", to: "appointment_booked", verdict: "reached", count: 6,
      ordering: { clock: 6, recorded_link: 0 },
      basis: { source: "fixture", recordedFacts: 10, fromIso: PERIOD.fromIso, toIso: PERIOD.toIso },
    },
    {
      from: "invitation_offered", to: "appointment_attended", verdict: "reached", count: 4,
      ordering: { clock: 4, recorded_link: 0 },
      basis: { source: "fixture", recordedFacts: 10, fromIso: PERIOD.fromIso, toIso: PERIOD.toIso },
    },
    {
      from: "reminder_offered", to: "appointment_booked", verdict: "reached", count: 9,
      ordering: { clock: 9, recorded_link: 0 },
      basis: { source: "fixture", recordedFacts: 9, fromIso: PERIOD.fromIso, toIso: PERIOD.toIso },
    },
  ],
  unanswered: [
    {
      kind: "invitation_offered", count: 2, wouldSettleIt: ["appointment_booked"], copy: "nothing recorded",
      basis: { source: "fixture", recordedFacts: 10, fromIso: PERIOD.fromIso, toIso: PERIOD.toIso },
    },
  ],
  unobserved: [{ kind: "referral_sent", why: "not performed" }],
});

const graph = () => {
  const result = buildResponseGraph(interventionsFromSim(sim), eventsFromSim(sim), PERIOD);
  if (!result.ok) throw new Error(`graph refused: ${result.errors.join(", ")}`);
  return result.graph;
};

const arms = (invitedPatients: number, invitedAttended: number, holdoutPatients: number, holdoutAttended: number): AttributionResult =>
  ({
    inviteArm: {
      patients: invitedPatients,
      attended: invitedAttended,
      attendedPer1000: invitedPatients === 0 ? 0 : (invitedAttended * 1000) / invitedPatients,
    },
    holdoutArm: {
      patients: holdoutPatients,
      attended: holdoutAttended,
      attendedPer1000: holdoutPatients === 0 ? 0 : (holdoutAttended * 1000) / holdoutPatients,
    },
  }) as AttributionResult;

describe("W219 the only claim is the practice-wide one, composed rather than recomputed", () => {
  it("carries W215's figure, floors and all", () => {
    const view = attributionV2(arms(1000, 300, 500, 100), graph());
    expect(view.claim.claimed).toBe(true);
    if (!view.claim.claimed) return;
    // 500 held out attending 100 → 200 per 1000 → 1000 invited would have attended 200.
    expect(view.claim.figure.withoutTheIntervention).toBeCloseTo(200, 6);
    expect(view.claim.figure.difference).toBeCloseTo(100, 6);
  });

  it("withholds the claim when the arms cannot carry one, and still describes the kinds", () => {
    // A withheld claim is not a zero and not a gap. The descriptive half is unaffected, because
    // it never depended on the arms in the first place.
    const view = attributionV2(arms(1000, 300, 2, 0), graph());
    expect(view.claim.claimed).toBe(false);
    expect(view.perKind.length).toBeGreaterThan(0);
    expect(renderAttributionV2(view)).toContain("No practice-wide claim");
  });

  it("does not recompute a counterfactual of its own", () => {
    // Two implementations of the same arithmetic drift, and the drift is invisible because nobody
    // opens both files. W215 is imported; nothing here divides one arm by another.
    expect(SOURCE).toMatch(/import \{ counterfactual/);
    expect(SOURCE, "a rate is being computed here").not.toMatch(/attendedPer1000/);
  });
});

describe("W219 a per-kind figure is a description, and the label is a type", () => {
  it("marks every per-kind figure not attributable, with the reason attached", () => {
    for (const figure of attributionV2(arms(1000, 300, 500, 100), graph()).perKind) {
      // Literal `false`, so a future edit cannot flip it without changing a declared type.
      expect(figure.attributable).toBe(false);
      expect(figure.whyNotAttributable).toBe(NOT_ATTRIBUTABLE_PER_KIND);
      expect(figure.basis.recordedFacts).toBeGreaterThan(0);
    }
  });

  it("counts interventions that got an answer, not recorded answers", () => {
    // The distinction, on a fixture where the two DIFFER. Over the sim they are equal — one
    // answer per offer — so this test passed a mutation that summed the edges instead, which is
    // the arithmetic that double-counts people. Ten offers, two unanswered, ten recorded answers.
    const view = attributionV2(arms(1000, 300, 500, 100), twoKinds());
    const offers = view.perKind.find((f) => f.kind === "invitation_offered")!;
    expect(offers.interventions).toBe(10);
    expect(offers.answered, "answered must be interventions minus unanswered").toBe(8);
    expect(offers.recordedAnswers, "and recorded answers may exceed it").toBe(10);
  });

  it("attaches the caveat to every line rather than once at the top", () => {
    // These numbers travel individually, in screenshots and pasted into emails. A caveat in a
    // header does not travel with them.
    const rendered = renderAttributionV2(attributionV2(arms(1000, 300, 500, 100), graph()));
    const kindLines = rendered.split("\n").filter((l) => l.startsWith("- "));
    expect(kindLines.length).toBeGreaterThan(0);
    for (const line of kindLines) {
      const index = rendered.indexOf(line);
      expect(rendered.slice(index, index + line.length + 400)).toContain("Not attributable.");
    }
  });

  it("reports a kind the period never performed as such, not as a rate of zero", () => {
    const view = attributionV2(arms(1000, 300, 500, 100), graph());
    expect(view.notPerformed).toContain("referral_sent");
    for (const kind of view.notPerformed) {
      expect(view.perKind.some((f) => f.kind === kind), `${kind} has a descriptive figure`).toBe(false);
    }
    expect(renderAttributionV2(view)).toContain("This is not a rate of zero.");
  });
});

describe("W219 the refusals are absences, not rules somebody remembers", () => {
  it("exports no per-patient, per-clinician or ranking function", () => {
    const named = Object.keys(mod).filter((name) =>
      /patient|clinician|rank|best|effectFor|estimateFor|score/i.test(name),
    );
    expect(named).toEqual([]);
  });

  it("takes no patient in any exported signature", () => {
    // Checked on SIGNATURES rather than names, W215's method: `estimateFor(patient)` would pass a
    // name check, and "would this person have come anyway" is the input to a triage.
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      const params = match[2]!.replace(/\s+/g, " ");
      expect(params, `${match[1]} takes a patient`).not.toMatch(
        /\bpatient\b|\bpatientId\b|Patient\[\]|readonly Patient/i,
      );
    }
  });

  it("states a reason for every scope it refuses, and refuses the tempting one", () => {
    // `per_kind_effect` is the entry this unit exists for: the arithmetic is available and looks
    // respectable, and the assumption underneath it is false.
    for (const [scope, why] of Object.entries(REFUSED_SCOPES)) {
      expect(why.length, `${scope} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(Object.keys(REFUSED_SCOPES).sort()).toEqual([
      "per_clinician_effect",
      "per_kind_effect",
      "per_patient_effect",
      "ranked_kinds",
    ]);
  });

  it("never orders the kinds, because ordering descriptive numbers invites a causal reading", () => {
    // Emitted alphabetically by kind. A sort by response rate would be one line, and it is the
    // line that turns this module into the thing it refuses to be.
    // On a fixture with TWO kinds whose alphabetical and by-volume orders disagree: reminders
    // have more answers (9) than offers (8), so a sort by volume would put them first. Over the
    // sim there is one kind and this assertion was vacuous — a mutation ordering by `answered`
    // left it green.
    const view = attributionV2(arms(1000, 300, 500, 100), twoKinds());
    expect(view.perKind.map((f) => f.kind)).toEqual(["invitation_offered", "reminder_offered"]);
    expect(view.perKind[0]!.answered).toBeLessThan(view.perKind[1]!.answered);
    expect(SOURCE, "kinds are being ordered by a measured quantity").not.toMatch(
      /sort\([^)]*(answered|recordedAnswers|interventions)\b/,
    );
  });

  it("imports nothing that models or ranks", () => {
    for (const match of SOURCE.matchAll(/^import[^;]+from "([^"]+)"/gms)) {
      expect(match[1]!, "imports a ranking module").not.toMatch(/ranking|matching|routing/);
    }
  });
});

// W220 verify gate (unit half): "no clinical claim; the empty state distinguishes nothing
// happened from nothing recorded (W179)." The e2e and axe halves are in e2e/responses.spec.ts
// and e2e/a11y.spec.ts.
//
// The interesting assertions here are about which of FOUR silences a reader is shown, because
// the page can present all four at once and merging any two is the failure. Three of them are
// positive knowledge; the fourth is genuinely unknown, and W179's rule decides what to say then:
// the reassuring reading requires proof, and no proof is available.

import { describe, expect, it } from "vitest";
import {
  EMPTY_READING_COPY,
  EMPTY_WOULD_SETTLE_IT,
  RESPONSE_CONSOLE_COPY,
  responseConsoleView,
} from "./response-console";
import { buildResponseGraph, eventsFromSim, interventionsFromSim } from "./response-graph";
import type { ResponseGraph } from "./response-graph";
import { lintCopyBundle } from "@/compliance/landing";
import { DEFAULT_SIM_CONFIG, runSim } from "@/sim/harness";

const PERIOD = { fromIso: "2026-01-01", toIso: "2026-12-31" };

const simGraph = (): ResponseGraph => {
  const result = runSim({ ...DEFAULT_SIM_CONFIG, weeks: 6, patientCount: 1_500 });
  const built = buildResponseGraph(interventionsFromSim(result), eventsFromSim(result), PERIOD);
  if (!built.ok) throw new Error(`fixture refused: ${built.errors.join(", ")}`);
  return built.graph;
};

describe("W220 the empty state says WHICH emptiness it is", () => {
  it("refuses to call an empty period quiet, because it cannot tell", () => {
    // W179's load-bearing rule: the reassuring reading requires proof. "Nothing happened" is the
    // comfortable reading and the one nobody would check, so it is never reachable by default.
    const view = responseConsoleView(null, 0);
    expect(view.state).toBe("empty");
    if (view.state !== "empty") return;
    expect(view.reading).toBe("cannot_determine");
    expect(view.copy).toContain("cannot tell you");
    expect(view.copy).not.toMatch(/nothing happened|all quiet|no activity/i);
  });

  it("names a recording gap when answers exist and the interventions do not", () => {
    // Reachable: `eventsFromSim` and `interventionsFromSim` read the same log through different
    // filters. Telling this practice its week was quiet while its rail dropped every offer it
    // sent is the specific harm, and the page CAN tell here — so it must.
    const view = responseConsoleView(null, 42);
    expect(view.state).toBe("empty");
    if (view.state !== "empty") return;
    expect(view.reading).toBe("answers_without_interventions");
    expect(view.copy).toContain("gap on the sending side");
    expect(view.copy).toContain("not a quiet period");
  });

  it("gives every empty reading something to go and check", () => {
    // W120's move, and the reason an unknown is not a dead end: an unanswerable state becomes a
    // list of things somebody could do, not a number to interpret.
    for (const reading of Object.keys(EMPTY_READING_COPY) as (keyof typeof EMPTY_READING_COPY)[]) {
      expect(EMPTY_WOULD_SETTLE_IT[reading].length, reading).toBeGreaterThan(0);
      expect(EMPTY_READING_COPY[reading].length, reading).toBeGreaterThan(80);
    }
  });

  it("keeps never-performed separate from nothing-recorded, which are opposite facts", () => {
    // The two silences most easily merged. One says the product did nothing; the other says the
    // product did something and the record is silent about the result. A single "0" serves both.
    expect(RESPONSE_CONSOLE_COPY.neverPerformed).toContain("not a rate of zero");
    expect(RESPONSE_CONSOLE_COPY.nothingRecorded).toContain("statement about the record");
    expect(RESPONSE_CONSOLE_COPY.nothingRecorded).toContain("not counted as anybody declining");
    expect(RESPONSE_CONSOLE_COPY.neverPerformed).not.toBe(RESPONSE_CONSOLE_COPY.nothingRecorded);
  });

  it("has a POSITIVE form too, so the caveat's presence is not itself the signal", () => {
    // Found by the e2e failing: over the default synthetic run every offer has something
    // recorded against it, so the "nothing recorded" line never rendered and the distinction
    // this unit is gated on was invisible on the page it was built for. W205's rule — the
    // sentence must not appear only on the incomplete case.
    expect(RESPONSE_CONSOLE_COPY.allRecorded).toContain("something recorded against it");
    expect(RESPONSE_CONSOLE_COPY.allRecorded).not.toBe(RESPONSE_CONSOLE_COPY.nothingRecorded);
  });

  it("keeps withheld separate from both, because a reader assumes the explainable one", () => {
    expect(RESPONSE_CONSOLE_COPY.withheld).toContain("was measured");
    expect(RESPONSE_CONSOLE_COPY.withheld).toContain("not missing");
    expect(RESPONSE_CONSOLE_COPY.withheld).toContain("not a zero");
  });
});

describe("W220 the populated view over a real run", () => {
  it("shows the graph, and carries W218's disclosable form rather than the raw graph", () => {
    const view = responseConsoleView(simGraph(), 100);
    expect(view.state).toBe("graph");
    if (view.state !== "graph") return;
    expect(view.disclosable.kinds.length).toBeGreaterThan(0);
    expect(view.disclosable.floor).toBeGreaterThan(1);
  });

  it("shows the kinds the loop never performed, so empty rows are not read as failures", () => {
    // The synthetic loop only offers invitations, so three declared kinds are never performed.
    // Rendering them as absent counts would report three failures the product never attempted.
    const view = responseConsoleView(simGraph(), 100);
    if (view.state !== "graph") return;
    expect(view.disclosable.unobserved.map((u) => u.kind).sort()).toEqual([
      "material_surfaced",
      "referral_sent",
      "reminder_offered",
    ]);
  });

  it("counts the withheld cells, so the page can explain them once rather than per row", () => {
    const view = responseConsoleView(simGraph(), 100);
    if (view.state !== "graph") return;
    const actual = view.disclosable.kinds.reduce(
      (sum, kind) => sum + kind.cells.filter((cell) => cell.suppression !== null).length,
      0,
    );
    expect(view.withheldCellCount).toBe(actual);
  });
});

describe("W220 the page makes no clinical claim", () => {
  it("passes the compliance linter on every shipped string", () => {
    expect(
      lintCopyBundle({
        console: RESPONSE_CONSOLE_COPY,
        empty: EMPTY_READING_COPY,
        settle: EMPTY_WOULD_SETTLE_IT,
      }),
    ).toEqual([]);
  });

  it("says nothing about a condition, a person or what anybody should do clinically", () => {
    const all = [
      ...Object.values(RESPONSE_CONSOLE_COPY),
      ...Object.values(EMPTY_READING_COPY),
      ...Object.values(EMPTY_WOULD_SETTLE_IT).flat(),
    ].join(" ");
    expect(all).not.toMatch(/diabet|renal|condition|symptom|diagnos|treat|urgen|risk|should see/i);
  });

  it("states that nothing has been sent, because G9 is unratified", () => {
    // An absence nobody points at reads as a feature somebody forgot. W199's posture, and the
    // reason the sentence is data rather than JSX.
    expect(RESPONSE_CONSOLE_COPY.notSent).toContain("has been sent to anybody");
    expect(RESPONSE_CONSOLE_COPY.notSent).toContain("no control here that would");
  });

  it("says the counts are about facts, never about care or about one person", () => {
    expect(RESPONSE_CONSOLE_COPY.intro).toContain("facts somebody wrote down");
    expect(RESPONSE_CONSOLE_COPY.intro).toContain("none of it is about one person");
  });
});

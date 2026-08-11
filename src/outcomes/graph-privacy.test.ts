// W218 verify gate: "W106's record classes extended in the same commit; the graph holds no
// patient identity it does not need, and erasure reaches every class it does."
//
// The identity half is checked over a REAL sim run rather than over a hand-built fixture. A
// fixture proves the type has nowhere to put a chain id, which the type already says; a run
// proves the aggregation actually drops the 1,552 invitation ids it was handed. Those are
// different claims and only the second one can fail.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as graphPrivacy from "./graph-privacy";
import {
  CELL_SUPPRESSION_COPY,
  GRAPH_CELL_FLOOR,
  SHIPPED_DISCLOSABLE_GRAPHS,
  disclosableGraph,
  renderDisclosableGraph,
} from "./graph-privacy";
import {
  buildResponseGraph,
  eventsFromSim,
  interventionsFromSim,
  type ResponseGraph,
} from "./response-graph";
import { AGGREGATION_FLOORS } from "@/reporting/model";
import { RECORD_CLASSES } from "@/privacy/record-classes";
import { DEFAULT_SIM_CONFIG, runSim } from "@/sim/harness";

const GRAPH_SOURCE = readFileSync(
  path.join(process.cwd(), "src/outcomes/response-graph.ts"),
  "utf8",
);
const PERIOD = { fromIso: "2026-01-01", toIso: "2026-12-31" };

const simGraph = (): { graph: ResponseGraph; chainIds: string[] } => {
  const result = runSim({ ...DEFAULT_SIM_CONFIG, weeks: 6, patientCount: 1_500 });
  const interventions = interventionsFromSim(result);
  const events = eventsFromSim(result);
  const built = buildResponseGraph(interventions, events, PERIOD);
  if (!built.ok) throw new Error(`fixture refused: ${built.errors.join(", ")}`);
  return {
    graph: built.graph,
    chainIds: [...new Set([...interventions.map((i) => i.chainId), ...events.map((e) => e.chainId)])],
  };
};

/** Every string anywhere in a value, however deeply nested. */
const strings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
};

const fakeGraph = (
  cells: { to: string; count: number }[],
  unansweredCount: number,
  total: number,
): ResponseGraph => ({
  provenance: "synthetic_sim",
  basis: { source: "fixture", recordedFacts: total, ...PERIOD },
  edges: cells.map((cell) => ({
    from: "invitation_offered" as const,
    to: cell.to,
    verdict: "reached" as const,
    count: cell.count,
    ordering: { clock: cell.count, recorded_link: 0 },
    basis: { source: "fixture", recordedFacts: total, ...PERIOD },
  })),
  unanswered:
    unansweredCount === 0
      ? []
      : [
          {
            kind: "invitation_offered" as const,
            count: unansweredCount,
            wouldSettleIt: [],
            copy: "fixture",
            basis: { source: "fixture", recordedFacts: total, ...PERIOD },
          },
        ],
  unobserved: [],
});

describe("W218 the graph holds no patient identity it does not need", () => {
  it("drops every chain id the aggregation was handed, checked over a real run", () => {
    // The intermediate rows are keyed by `chainId`, which in this pipeline IS an invitation id —
    // a per-patient key. The type says the edge has nowhere to put one; this says the code does
    // not. A future edge carrying an example chain id "for debugging" passes review and fails here.
    const { graph, chainIds } = simGraph();
    expect(chainIds.length, "the fixture handed the aggregation no ids to drop").toBeGreaterThan(50);
    const published = strings(graph);
    for (const id of chainIds) {
      expect(published, `chain id ${id} survived aggregation`).not.toContain(id);
    }
  });

  it("publishes no string that looks like a per-record key at all", () => {
    // Broader than the id list, because the next leak will not be an id this run happened to
    // produce. Anything shaped like `inv-1234` or `pat-1234` is a record key, whatever made it.
    const { graph } = simGraph();
    for (const value of strings(graph)) {
      expect(value, `"${value}" reads as a record key`).not.toMatch(/\b(inv|pat|apt|ref)-\d+\b/);
    }
  });

  it("has no builder that takes anything but the synthetic loop", () => {
    // The erasure story, checked structurally. There is no path from the live rail into a graph,
    // so there is no stored derivative for erasure to reach — and if one is ever added, this
    // fails and the composition has to be re-argued rather than assumed.
    const signatures = [...GRAPH_SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)];
    const fromSim = signatures.filter(([, name]) => /FromSim$/.test(name!));
    expect(fromSim.length).toBeGreaterThan(1);
    for (const [, name, params] of fromSim) {
      expect(params!.replace(/\s+/g, " "), `${name} takes something other than a SimResult`).toMatch(
        /^\s*result: SimResult\s*$/,
      );
    }
  });

  it("ships nothing, so no graph has been cleared for disclosure", () => {
    expect(SHIPPED_DISCLOSABLE_GRAPHS).toEqual([]);
  });
});

describe("W218 a small cell is a person, and the floor is inherited", () => {
  it("derives its floor from W196's register rather than declaring a second one", () => {
    // A literal here would be a second number to keep true, and the first time the two differed
    // nobody would notice. Asserted as identity, so lowering W196's floor lowers this one.
    expect(GRAPH_CELL_FLOOR).toBe(AGGREGATION_FLOORS.referrals_written.floor);
    expect(GRAPH_CELL_FLOOR).toBeGreaterThan(1);
  });

  it("withholds a cell below the floor rather than publishing it", () => {
    const d = disclosableGraph(fakeGraph([{ to: "appointment_booked", count: 40 }, { to: "invitation_declined", count: 1 }], 59, 100));
    const declined = d.kinds[0]!.cells.find((c) => c.to === "invitation_declined")!;
    expect(declined.count).toBeNull();
    expect(declined.suppression).toBe("cell_below_floor");
  });

  it("withholds a SECOND cell, because one hidden cell in a published partition is not hidden", () => {
    // W197's finding, in the shape a closed partition takes: the edges plus the unanswered node
    // add up to the total, and the total is published, so subtraction recovers a single
    // suppressed cell exactly. This is the assertion the unit exists for.
    const d = disclosableGraph(
      fakeGraph([{ to: "appointment_booked", count: 40 }, { to: "invitation_declined", count: 1 }], 59, 100),
    );
    const withheld = d.kinds[0]!.cells.filter((c) => c.suppression !== null);
    expect(withheld.length).toBeGreaterThanOrEqual(2);
    expect(withheld.map((c) => c.suppression)).toContain("withheld_to_protect_another_cell");
    // And what remains published must not permit the subtraction.
    const publishedSum = d.kinds[0]!.cells.reduce((sum, c) => sum + (c.count ?? 0), 0);
    expect(d.kinds[0]!.total! - publishedSum, "one unknown left in the partition").toBeGreaterThan(0);
    expect(withheld.length, "at least two unknowns share the remainder").toBeGreaterThan(1);
  });

  it("withholds the TOTAL when there is no second cell to hide behind", () => {
    // The degenerate partition: one cell, below the floor. Suppressing it leaves the denominator
    // equal to it, so the denominator is the leak.
    const d = disclosableGraph(fakeGraph([{ to: "appointment_booked", count: 2 }], 0, 2));
    expect(d.kinds[0]!.total).toBeNull();
    expect(d.kinds[0]!.cells[0]!.count).toBeNull();
  });

  it("leaves a graph with no small cell entirely alone", () => {
    // The floor must not be a general blur: a graph that clears it publishes in full, or the
    // suppression itself becomes the signal (W120's rule about silence).
    const d = disclosableGraph(fakeGraph([{ to: "appointment_booked", count: 40 }, { to: "invitation_declined", count: 20 }], 40, 100));
    expect(d.kinds[0]!.cells.every((c) => c.suppression === null)).toBe(true);
    expect(d.kinds[0]!.total).toBe(100);
  });

  it("is order-independent, so the answer is a property of the graph", () => {
    const forwards = fakeGraph([{ to: "appointment_booked", count: 40 }, { to: "invitation_declined", count: 1 }], 59, 100);
    const backwards: ResponseGraph = { ...forwards, edges: [...forwards.edges].reverse() };
    expect(disclosableGraph(backwards)).toEqual(disclosableGraph(forwards));
  });

  it("renders a withheld cell as a named withholding, never as a gap or a zero", () => {
    const rendered = renderDisclosableGraph(
      disclosableGraph(fakeGraph([{ to: "appointment_booked", count: 40 }, { to: "invitation_declined", count: 1 }], 59, 100)),
    );
    expect(rendered).toContain("invitation_declined: withheld");
    expect(rendered).not.toMatch(/invitation_declined: 1\b/);
    for (const copy of Object.values(CELL_SUPPRESSION_COPY)) {
      expect(copy).toContain("It was counted");
      // Never a bare numeral: the failure is a withheld cell RENDERED as a number. Saying "it is
      // not a zero" in words is the opposite of that and is W197's own wording — the first
      // version of this assertion banned the word and so banned the correct sentence.
      expect(copy).not.toMatch(/\b\d+\b/);
    }
    expect(CELL_SUPPRESSION_COPY.cell_below_floor).toContain("not missing data");
    expect(CELL_SUPPRESSION_COPY.cell_below_floor).toContain("not a zero");
  });

  it("says nothing anywhere that a practice could read as a clinical claim", () => {
    const copy = [...Object.values(CELL_SUPPRESSION_COPY)].join(" ");
    expect(copy).not.toMatch(/diabet|renal|condition|symptom|risk|urgen|diagnos|treat/i);
  });
});

describe("W218 W106's record classes cover this in the same commit", () => {
  it("declares this module", () => {
    const declared = RECORD_CLASSES.find((c) => c.module === "src/outcomes/graph-privacy.ts");
    expect(declared, "the disclosure form is not classified").toBeDefined();
    expect(declared!.handling).toBe("no_patient_identity");
    expect(declared!.rationale.length).toBeGreaterThan(120);
  });

  it("settles the question W212's entry deferred rather than leaving the pointer dangling", () => {
    // W212 wrote "W218 is where the floor question is settled" into its own rationale. A forward
    // pointer that outlives the unit it points at is how a recorded finding becomes a closed one
    // in everybody's memory and nowhere else — PRIV-3's exact two-year failure.
    const graphClass = RECORD_CLASSES.find((c) => c.module === "src/outcomes/response-graph.ts")!;
    expect(graphClass.rationale).not.toMatch(/W218 is where/);
    expect(graphClass.rationale).toContain("W218");
  });
});

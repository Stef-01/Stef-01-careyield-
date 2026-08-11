// W218: what the response graph may disclose, and what it holds.
//
// W212 classified itself as `no_patient_identity` and was right about the type: an edge holds an
// intervention kind, a response kind, a verdict, a count and a basis, and there is nowhere on it
// for a chain id or a patient id. It then handed one question forward in writing — "a graph can
// hold shape a single link cannot… a count of one is a person" — and said W218 settles it. This
// is that.
//
// THE FIRST HALF IS THE EASY HALF: identity by value. The intermediate `Intervention` and
// `RecordedEvent` rows are keyed by `chainId`, which in the sim pipeline IS an invitation id —
// a per-patient key. The aggregation drops it, and this unit checks that it actually does, by
// scanning every string in a graph built over a real six-week run rather than by reading the
// type. A future edge carrying an example chain id "for debugging" is exactly the change that
// would pass review and fail that scan.
//
// THE SECOND HALF IS THE ONE W212 DEFERRED: a small cell is a person even when no field names
// one. `invitation_offered → invitation_declined: 1` says one identifiable thing happened to one
// person at a named practice, and a reader who knows the practice knows who. W196 declared
// floors for report figures before any report existed and W197 applied them; a graph is a report
// with a different shape, so it gets the same floor — DERIVED from `AGGREGATION_FLOORS` rather
// than written again, because a second number is the tuning W196 exists to prevent ("you compute
// the cell, see it is 3, and pick 3").
//
// AND THE THIRD THING, WHICH IS W197'S FINDING ONE LAYER OVER AND IS LIVE HERE. A graph publishes
// its own denominator: `basis.recordedFacts` is every intervention of that kind, and the edges
// plus the unanswered node partition it exactly. So suppressing ONE cell hides nothing —
// subtract the published cells from the total and the suppressed one falls out. W197 met this as
// two figures that could be differenced; here the arithmetic is closed by construction, which
// makes it worse. Suppression therefore continues until at least two cells are withheld, or the
// total itself is withheld when there is no second cell to hide behind.
//
// WITHHELD IS NOT MISSING AND IS NOT A ZERO. Every suppressed cell stays in the output, named,
// with its reason — W197's rule, and the reason `renderDisclosableGraph` prints the word rather
// than an absence.

import { AGGREGATION_FLOORS } from "@/reporting/model";
import type { InterventionKind } from "./response";
import type { ResponseGraph } from "./response-graph";

/**
 * The smallest cell a graph may publish.
 *
 * DERIVED, not declared. An intervention→response edge counts an administrative act — an offer
 * was made and something was recorded against it — which is `referrals_written`'s analogue in
 * W196's register, and that register already carries the argument: "a count of 1 or 2 in a small
 * practice is still traceable to individuals by anyone who knows the practice". A literal here
 * would be a second number to keep true, and the first time the two differed nobody would notice.
 */
export const GRAPH_CELL_FLOOR = AGGREGATION_FLOORS.referrals_written.floor;

export type CellSuppressionReason =
  /** The cell itself describes fewer people than the floor allows. */
  | "cell_below_floor"
  /**
   * The cell clears the floor and is withheld anyway, so the suppressed one cannot be recovered.
   *
   * W197's `complement_below_floor`, in the shape a closed partition takes: with one cell hidden
   * and a published total, subtraction is the whole attack.
   */
  | "withheld_to_protect_another_cell";

export const CELL_SUPPRESSION_COPY: Record<CellSuppressionReason, string> = {
  cell_below_floor:
    "Withheld: this describes fewer than the smallest number of people the product will publish about. It was counted — this is not missing data and it is not a zero.",
  withheld_to_protect_another_cell:
    "Withheld: publishing this would let another withheld number be worked out by subtraction, because these counts add up to a total that is also shown. It was counted.",
};

export interface DisclosableCell {
  /** The response kind, or `null` for the "nothing recorded against" cell. */
  to: string | null;
  /** Null when withheld. Withheld is a state, never a zero. */
  count: number | null;
  suppression: CellSuppressionReason | null;
}

export interface DisclosableKind {
  from: InterventionKind;
  /**
   * Every intervention of this kind. Null when withheld — which happens only when there is no
   * second cell to hide a suppressed one behind, and then the denominator is the leak.
   */
  total: number | null;
  cells: DisclosableCell[];
}

export interface DisclosableGraph {
  floor: number;
  kinds: DisclosableKind[];
  /** Kinds the loop never performed. Not a rate of zero — carried through from W212. */
  unobserved: readonly { kind: InterventionKind; why: string }[];
}

/**
 * Apply the floor to a graph, cell by cell and then to the complement.
 *
 * Order-independent: cells are chosen for suppression by (count, name), so the result is a
 * property of the graph rather than of the order W212 happened to emit its edges in — W167's
 * register, and the reason the tie-break is the name rather than the position.
 */
export function disclosableGraph(graph: ResponseGraph): DisclosableGraph {
  const kinds: DisclosableKind[] = [];
  const byKind = new Map<InterventionKind, { to: string | null; count: number }[]>();
  const totals = new Map<InterventionKind, number>();

  for (const edge of graph.edges) {
    byKind.set(edge.from, [...(byKind.get(edge.from) ?? []), { to: edge.to, count: edge.count }]);
    totals.set(edge.from, edge.basis.recordedFacts);
  }
  for (const node of graph.unanswered) {
    byKind.set(node.kind, [...(byKind.get(node.kind) ?? []), { to: null, count: node.count }]);
    totals.set(node.kind, node.basis.recordedFacts);
  }

  for (const [from, raw] of [...byKind.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    // Smallest first, name as the tie-break: suppressing the smallest costs the least
    // information, and a deterministic tie-break keeps the answer a property of the value.
    const ordered = [...raw].sort(
      (a, b) => a.count - b.count || String(a.to).localeCompare(String(b.to)),
    );
    const suppressed = new Map<string, CellSuppressionReason>();
    const key = (cell: { to: string | null }) => String(cell.to);

    for (const cell of ordered) {
      if (cell.count < GRAPH_CELL_FLOOR) suppressed.set(key(cell), "cell_below_floor");
    }
    // One hidden cell in a partition with a published total is not hidden. Hide the next
    // smallest until at least two are, or until there is nothing left to hide behind.
    if (suppressed.size === 1) {
      const next = ordered.find((cell) => !suppressed.has(key(cell)));
      if (next) suppressed.set(key(next), "withheld_to_protect_another_cell");
    }

    const totalWithheld = suppressed.size === 1;
    kinds.push({
      from,
      total: totalWithheld ? null : (totals.get(from) ?? 0),
      cells: ordered.map((cell) => {
        const reason = suppressed.get(key(cell)) ?? null;
        return { to: cell.to, count: reason === null ? cell.count : null, suppression: reason };
      }),
    });
  }

  return { floor: GRAPH_CELL_FLOOR, kinds, unobserved: graph.unobserved };
}

/** The disclosable graph as a reader sees it. Withheld cells are printed, never omitted. */
export function renderDisclosableGraph(disclosable: DisclosableGraph): string {
  const lines: string[] = [
    `Response graph — disclosable form. Smallest publishable cell: ${disclosable.floor}.`,
    "",
  ];
  for (const kind of disclosable.kinds) {
    lines.push(
      kind.total === null
        ? `${kind.from} (total withheld — see below):`
        : `${kind.from} (${kind.total} recorded):`,
    );
    for (const cell of kind.cells) {
      const label = cell.to === null ? "nothing recorded against it" : cell.to;
      lines.push(
        cell.suppression === null
          ? `- ${label}: ${cell.count}`
          : `- ${label}: withheld. ${CELL_SUPPRESSION_COPY[cell.suppression]}`,
      );
    }
    lines.push("");
  }
  for (const kind of disclosable.unobserved) lines.push(`- ${kind.kind}: ${kind.why}`);
  return lines.join("\n");
}

/**
 * PROPOSED FOR NOBODY — nothing ships.
 *
 * Same posture as `SHIPPED_RESPONSE_GRAPHS`, and here for a sharper reason: this module produces
 * the form of a graph that COULD be disclosed, and a non-empty registry would be the first thing
 * in the tree that had been cleared for disclosure. G9 is unratified.
 */
export const SHIPPED_DISCLOSABLE_GRAPHS: readonly DisclosableGraph[] = [];

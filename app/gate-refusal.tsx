// W309: the one place a founder gate is rendered to an operator.
//
// Ten console pages said some version of "this is synthetic" or "nothing is sent here" in their own
// words, and not one of them named the gate. That is a disclaimer rather than a refusal: it reads
// as an apology for a demo instead of a statement that a specific decision has not been made and
// this is what the product does until it is.
//
// The copy lives in `src/demo/gates.ts` — a LEAF with no filesystem in it. It started out beside
// the path register in `path.ts`, and W287's import-graph measurement reported `/console/dashboard`
// as a route reaching disk the moment this component pulled that register into a page. A page may
// import copy; it may not import a register that reads the tree. The sentence is written once and
// the page names only which gate stops it.

import { GATE_REFUSAL_COPY, type GateId } from "@/console/gates";

/** The refusal a screen shows where a founder gate stops the path it is part of. */
export function GateRefusal({ gate }: { gate: GateId }) {
  return (
    <p
      data-testid={`gate-refusal-${gate}`}
      className="mt-6 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
    >
      <strong className="font-semibold">Founder gate {gate}.</strong> {GATE_REFUSAL_COPY[gate]}
    </p>
  );
}

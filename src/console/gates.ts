// W309: the sentence a founder gate shows an operator, and nothing else.
//
// A LEAF IN THE CONSOLE'S OWN AREA, and two registers put it here rather than taste. It started in
// `src/demo/path.ts` beside the walk that declares where each gate stops — one file, one subject,
// and obviously right until the dashboard imported the component that renders it. W287 then
// reported `/console/dashboard` as a route reaching disk, because the register it had pulled in
// reads the tree; splitting the copy out fixed that and moved the problem, since W271's closed
// allowance does not let a console route reach `demo` at all. Widening that allowance to carry one
// constant would be trading a security boundary for a file's location. So the sentence an operator
// reads in the console lives in the console.
//
// FOUNDER GATE (plan §4): nothing crossed. These are sentences ABOUT the gates.

/** A founder gate as plan §4 spells it. */
export type GateId = "G1" | "G2" | "G3" | "G4";

/**
 * What each gate stops, in the operator's words.
 *
 * ONE SENTENCE PER GATE, IN ONE PLACE. Before this the same fact was written ten times across the
 * console in ten shapes, which is the finding Q23's hardening pass recorded about the citation
 * format and the reason W301 exists. The component renders these; no page writes its own.
 *
 * Each says what the product does INSTEAD, because a refusal that only says no leaves the reader to
 * guess whether the feature is missing or withheld — W48's rule about refusals, applied to a gate.
 */
export const GATE_REFUSAL_COPY: Readonly<Record<GateId, string>> = {
  G1:
    "This booking is written to this tree's own rail, not to a practice calendar. Connecting a real practice system needs credentials the founder has not issued.",
  G2:
    "Every person on this path is generated. Holding real patient records needs a privacy impact assessment the founder has not commissioned.",
  G3:
    "This message is composed and shown, and nothing is sent. Messaging real patients needs consent flows verified and templates approved by the founder.",
  G4:
    "These figures come from a simulated run rather than a practice. Measuring a real practice needs a pilot agreement and a holdout design the founder has signed.",
};

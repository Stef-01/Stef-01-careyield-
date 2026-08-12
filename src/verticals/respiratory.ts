// W250: the respiratory vertical — the third, and the one that proved the second's dedup was a lie.
//
// W248 moved the assembly into `assembly.ts` so the third vertical could not be a copy of the
// first. It could not, and this file is the evidence: a member list, a spec, four one-line
// re-exports, and no machinery. That part went as designed.
//
// WHAT THE THIRD VERTICAL DID FIND IS `gatesFor`. It deduplicated `waitsOn` STRINGS and called the
// result "the gates this vertical is waiting on". Dermatology's five members are blocked by ONE
// founder gate and two authoring acts, and it returned FIVE — three differently worded sentences
// about G5 plus two others. The dedup did nothing; the function's name was the only thing claiming
// otherwise. W248's own test asserted `gates.length < members.length` and passed, because women's
// health happened to word two members identically. **A test that certified a deduplication on the
// single fixture where it coincidentally occurred.**
//
// One vertical hid it, two hid it by luck, three make it undeniable: the question a founder asks
// is "which single ruling unblocks the most?", and across the tree's verticals G5 would appear as
// seven distinct strings for one decision. So `gate` is a declared VALUE now and the prose stays
// beside it — W227's rule about a reading that must not be inferred, applied to a register.
//
// WHO MUST ACT IS COMPOSED, NOT RESTATED. W158 already answers it per kind through
// `REMAINING_CHAIN`, and its report groups blockers by kind with the chain attached. This unit
// adds the gate axis, which is the one W158 does not have, and takes the actor axis from W158
// rather than writing a second version of it.
//
// FOUNDER GATE (plan §4): G5 blocks the pathway content (W251) and the interval. No clinical
// content is present, and the word scan for this scope is its own — a respiratory vertical's
// tempting vocabulary is not dermatology's and not women's health's, which is the third reason a
// shared word list would have been the wrong shape.

import {
  assembleVertical,
  blockedCountByGate,
  gatesFor,
  shippedEvidence,
  specFrom,
  verticalOutstanding,
  type BlockingGate,
  type DeclaredMember,
} from "./assembly";
import type { CompletenessReport, KnownMembers } from "./completeness";
import type { VerticalEvidence, VerticalResult, VerticalSpec } from "./model";

export const RESPIRATORY_MEMBERS: readonly DeclaredMember[] = [
  {
    kind: "pathway",
    ref: "resp-pathway-1",
    gate: "G5",
    waitsOn: "G5 — clinical content sign-off. W119's chain: a reviewer, then a signatory who is not the reviewer (W251).",
  },
  {
    kind: "pathway",
    ref: "resp-pathway-2",
    gate: "G5",
    waitsOn: "G5 — clinical content sign-off, the same chain as the first and a separate decision (W251).",
  },
  {
    kind: "content",
    ref: "resp-content-1",
    gate: "G5",
    waitsOn: "G5 — the founder signature on reviewed material (W69's ApprovedContent brand).",
  },
  {
    kind: "education_item",
    ref: "resp-education-1",
    gate: "none",
    waitsOn: "An author. No founder gate applies to material that makes no clinical claim (W151).",
  },
  {
    kind: "interval",
    ref: "resp-interval-1",
    gate: "G5",
    waitsOn: "G5 — the values ruling on cadence. Nobody can act until it lands (W56).",
  },
];

export const RESPIRATORY_SPEC: VerticalSpec = specFrom(
  "vert-respiratory",
  "Respiratory",
  RESPIRATORY_MEMBERS,
);

/** Assemble against what is signed off. Refuses today, and names every missing member. */
export function assembleRespiratory(
  evidence: VerticalEvidence = shippedEvidence(),
): VerticalResult {
  return assembleVertical(RESPIRATORY_SPEC, evidence);
}

/** W158's report: exactly which members are missing, and who must act on each. */
export function respiratoryOutstanding(
  evidence: VerticalEvidence = shippedEvidence(),
  known?: KnownMembers,
): CompletenessReport {
  return verticalOutstanding(RESPIRATORY_SPEC, evidence, known);
}

/** The founder gates this vertical is waiting on, deduplicated by value. */
export function respiratoryGates(): BlockingGate[] {
  return gatesFor(RESPIRATORY_MEMBERS);
}

/** How many of this vertical's members each gate blocks, worst first. */
export function respiratoryBlockers(): Array<{ gate: BlockingGate; count: number }> {
  return blockedCountByGate(RESPIRATORY_MEMBERS);
}

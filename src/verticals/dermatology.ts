// W191: the dermatology vertical, assembled against W157's model.
//
// This is the first vertical the tree declares as a concrete bundle rather than as a fixture, and
// the whole unit is a refusal. Nothing in it is signed off, nothing can be, and the deliverable
// is that the refusal is COMPLETE, NAMED and STABLE rather than a bare false.
//
// WHY DECLARE A VERTICAL NOBODY CAN USE. Because the alternative is discovering the shape of the
// blocker on the day somebody wants to ship it. W158 exists on the argument that "4 members not
// usable" is not a plan and "3 of these wait on one ruling and the fourth is a typo" is; the same
// argument applies a level up. A declared spec that refuses today tells the founder exactly what
// the dermatology decision costs — which members, which gates, whose signature — and it does so
// from code that will keep being true, rather than from a document that was true in August.
//
// WHAT IS AND IS NOT IN HERE, WHICH IS THE G5 LINE.
//
//   A member ref is a POINTER — a version hash, a record id. W157 made that choice so a spec
//   could never become a second copy of gated content, and it is exactly what makes this file
//   safe to write before any sign-off exists. Declaring that a dermatology vertical WOULD contain
//   two pathways is governance. Writing what those pathways say is clinical content, is W186, and
//   is blocked on G5.
//
//   SO THERE IS NO CLINICAL LANGUAGE HERE AT ALL, and a test asserts it against the tree's own
//   linters rather than against a fresh regex. W127 drew this line for a console page — show
//   governance, never content, summarise criteria as counts and never list them — and a spec file
//   is the same risk with a different file extension: the natural way to make a member list
//   readable is to describe what each member is FOR, and describing what a dermatology pathway is
//   for is describing clinical content.
//
//   Each member therefore carries the GATE IT WAITS ON and NOTHING ELSE. That is the field a
//   founder needs and the only one this file is entitled to hold.
//
// THE REFUSAL NAMES EVERY MEMBER, NOT THE FIRST. W157 already returns them all; this unit pins it
// for this spec, because the failure mode is a caller that fixes one member, re-runs, and finds
// another — n round trips through a two-person sign-off process, each one discovering a fact that
// was knowable at the start.

import {
  assembleVertical,
  gatesFor,
  shippedEvidence,
  specFrom,
  verticalOutstanding,
  type DeclaredMember,
} from "./assembly";
import type { VerticalEvidence, VerticalResult, VerticalSpec } from "./model";
import type { CompletenessReport, KnownMembers } from "./completeness";

// W248 moved `DeclaredMember` to `assembly.ts`. The rule it carries — three fields, and no
// sentence saying what a member is FOR, because for a clinical pathway that sentence is the
// content G5 gates — is now one type rather than a convention two vertical files happen to share.

export const DERMATOLOGY_MEMBERS: readonly DeclaredMember[] = [
  {
    kind: "pathway",
    ref: "derm-pathway-1",
    gate: "G5",
    waitsOn: "G5 — clinical content sign-off. W119's chain, in order: a reviewer, then a signatory who is not the reviewer.",
  },
  {
    kind: "pathway",
    ref: "derm-pathway-2",
    gate: "G5",
    waitsOn: "G5 — clinical content sign-off, same reviewer-then-signatory chain as the first.",
  },
  {
    kind: "content",
    ref: "derm-content-1",
    gate: "G5",
    waitsOn: "G5 — the founder signature on reviewed material (W69's ApprovedContent brand).",
  },
  {
    kind: "education_item",
    ref: "derm-education-1",
    gate: "none",
    waitsOn: "An author. No founder gate applies to material that makes no clinical claim (W151).",
  },
  {
    kind: "interval",
    ref: "derm-interval-1",
    gate: "G5",
    waitsOn: "G5 — the values ruling on cadence. Nobody can act until it lands (W56).",
  },
];

export const DERMATOLOGY_SPEC: VerticalSpec = specFrom(
  "vert-dermatology",
  "Dermatology",
  DERMATOLOGY_MEMBERS,
);

/**
 * What is signed off for dermatology today: nothing.
 *
 * DELEGATES to `shippedEvidence`, and W248 moved the body there because it was never about
 * dermatology — it read the tree's `SHIPPED_*` registries and returned what is signed off for
 * anything. Keeping a copy here once a second vertical existed would have meant two functions
 * claiming the same fact about the same registries, which is the objection this function's own
 * comment used to make about a hand-written empty object, one level up.
 */
export function dermatologyEvidence(): VerticalEvidence {
  return shippedEvidence();
}

/** Assemble the vertical against what is signed off. Refuses today, and says exactly why. */
export function assembleDermatology(
  evidence: VerticalEvidence = dermatologyEvidence(),
): VerticalResult {
  return assembleVertical(DERMATOLOGY_SPEC, evidence);
}

/**
 * The outstanding work, decomposed by who has to act.
 *
 * W158's report, applied rather than reimplemented. The list of missing refs is the same
 * information in the shape that hides the plan; this is the shape a founder can price.
 */
export function dermatologyOutstanding(
  evidence: VerticalEvidence = dermatologyEvidence(),
  known?: KnownMembers,
): CompletenessReport {
  return verticalOutstanding(DERMATOLOGY_SPEC, evidence, known);
}

/** The gates this vertical is waiting on, deduplicated, in declaration order. */
export function dermatologyGates(): string[] {
  return gatesFor(DERMATOLOGY_MEMBERS);
}

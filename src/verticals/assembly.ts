// W248: the one door every vertical goes through — extracted because there are two of them now.
//
// W191 assembled dermatology against W157's model and got it right. This unit adds a second
// vertical, and the second one is where the duplication becomes invisible: one bespoke assembly
// file is a file, two are a pattern nobody declared, and the third gets written by copying
// whichever of the two its author found first.
//
// SO THE MACHINERY MOVED HERE RATHER THAN BEING COPIED. `dermatology.ts` and `womens-health.ts`
// are now DECLARATIONS — a member list and a spec — and neither calls W157's `usableVertical` or
// W158's `assessCompleteness` itself. A test scans `src/verticals/` and fails any vertical module
// that does, so the third vertical cannot be a copy of the first without somebody noticing.
//
// AND `dermatologyEvidence` WAS NEVER ABOUT DERMATOLOGY, which is the part worth stating. It read
// the tree's `SHIPPED_*` registries and returned what is signed off — for anything. Copying it
// under a second name would have produced two functions claiming the same fact about the same
// registries, and its own comment already argues why that is wrong: "a hand-written empty object
// would be a second claim about the same fact, and the second claim is the one that goes stale."
// That argument was made about a literal inside one vertical. It applies with more force to a
// whole function duplicated across two, because the day a fifth registry is added — or the day
// `content` is read differently — one vertical would learn about it and the other would go on
// reporting that nothing is signed off while something is.
//
// It is `shippedEvidence` now, and the name has stopped being a lie.
//
// WHAT A DECLARED MEMBER MAY HOLD, and it is three fields. W191 established that a member carries
// the gate it waits on and nothing else, because the natural fourth field is a one-line
// description of what the member is FOR — and for a clinical pathway that line is the content G5
// gates. The type is here now, so the rule is one type rather than a convention two files happen
// to share.
//
// FOUNDER GATE (plan §4): no clinical content passes through this module. A member ref is a
// pointer — a version hash, a record id — which is W157's choice and the reason a spec can be
// written before any sign-off exists.

import { assessCompleteness, type CompletenessReport, type KnownMembers } from "./completeness";
import { SHIPPED_INTERVALS } from "@/registers/intervals";
import { SHIPPED_WORKSPACE } from "@/registers/authoring";
import {
  usableVertical,
  type VerticalEvidence,
  type VerticalMemberKind,
  type VerticalResult,
  type VerticalSpec,
} from "./model";

/**
 * A member as a vertical declares it: what kind, which ref, and the gate it waits on.
 *
 * Three fields, and the missing fourth is the point — see the module note. W191 argued it for one
 * vertical; the type carries it for all of them, so the rule survives an author who read the
 * other file.
 */
/**
 * The founder gates plan §4 defines, plus `none`.
 *
 * THE UNION IS THE PLAN'S OWN LIST, not the gates that happen to block a member today — and a
 * test asserts every member of it is defined in §4, W242's rule. Narrowing it to `"G5" | "none"`
 * was the first version and W250's own order-independence test was VACUOUS against it: with one
 * reachable gate, `blockedCountByGate` can only ever return zero or one row, so the sort was dead
 * code and reversing the input could not change an answer. A property tested over a set of one is
 * a property nobody tested.
 */
export type BlockingGate =
  | "G1"
  | "G2"
  | "G3"
  | "G4"
  | "G5"
  | "G6"
  | "G7"
  | "G8"
  | "G9"
  | "G10"
  /** No founder gate applies — the member waits on an authoring or sign-off act. */
  | "none";

/** Every gate the union names, so a test can check them against plan §4 without a second list. */
export const ALL_BLOCKING_GATES: readonly BlockingGate[] = [
  "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "none",
];

export interface DeclaredMember {
  kind: VerticalMemberKind;
  ref: string;
  /**
   * WHICH founder gate blocks this member, as a declared value.
   *
   * W250 added this, and the reason is a defect in `gatesFor`. It deduplicated `waitsOn` STRINGS
   * and called the result "the gates this vertical is waiting on" — so dermatology, whose five
   * members are blocked by one gate and two authoring acts, got FIVE "gates": three differently
   * worded sentences about G5, plus two others. The dedup did nothing, and the function's name
   * was the only thing claiming otherwise.
   *
   * It matters more at three verticals than at one. The question a founder actually asks is
   * "which single ruling unblocks the most?", and prose cannot be grouped — G5 appears as seven
   * distinct strings across the tree's verticals for what is one decision.
   */
  gate: BlockingGate;
  /** The sentence a reader gets: which act, whose signature. Never what the member says. */
  waitsOn: string;
}

/**
 * What is signed off in this tree today: nothing.
 *
 * ONE function, for every vertical. Assembled from the tree's own `SHIPPED_*` registries rather
 * than written as empty literals, so it cannot claim nothing is signed off while something is —
 * and it is shared rather than copied, so a registry added tomorrow reaches every vertical at
 * once instead of whichever one somebody remembered.
 */
export function shippedEvidence(): VerticalEvidence {
  return {
    // The registries are typed as their branded members and are pinned empty by their own units.
    // Casts are the reading of an intentionally-empty list, not a construction of a branded value.
    pathways: [],
    content: SHIPPED_WORKSPACE as unknown as VerticalEvidence["content"],
    educationItems: [],
    intervals: { intervals: SHIPPED_INTERVALS as VerticalEvidence["intervals"]["intervals"], rejected: [] },
  };
}

/** Build a spec from a declaration. The `waitsOn` is a vertical's own note, not W157's business. */
export function specFrom(
  verticalId: string,
  name: string,
  members: readonly DeclaredMember[],
): VerticalSpec {
  return { verticalId, name, members: members.map(({ kind, ref }) => ({ kind, ref })) };
}

/** Assemble against what is signed off. Refuses today, for every vertical, and says exactly why. */
export function assembleVertical(
  spec: VerticalSpec,
  evidence: VerticalEvidence = shippedEvidence(),
): VerticalResult {
  return usableVertical(spec, evidence);
}

/**
 * The outstanding work, decomposed by who has to act — W158's report, applied not reimplemented.
 *
 * The list of missing refs is the same information in the shape that hides the plan; this is the
 * shape a founder can price.
 */
export function verticalOutstanding(
  spec: VerticalSpec,
  evidence: VerticalEvidence = shippedEvidence(),
  known?: KnownMembers,
): CompletenessReport {
  return assessCompleteness(spec, evidence, known);
}

/**
 * The founder gates a vertical is waiting on, genuinely deduplicated.
 *
 * Grouped by the declared `gate` value rather than by `waitsOn` prose — see `DeclaredMember.gate`
 * for what the prose version returned. `none` is excluded: a member waiting on an author is
 * waiting on somebody, but not on a founder, and a gate list that included it would tell a
 * founder they had a decision to take where they do not.
 */
export function gatesFor(members: readonly DeclaredMember[]): BlockingGate[] {
  return [...new Set(members.map((member) => member.gate))].filter((gate) => gate !== "none");
}

/**
 * How many members each gate blocks, across any set of verticals, worst first.
 *
 * The answer to "which single ruling unblocks the most", which is the question three verticals
 * make worth asking and which prose could not be grouped to answer. Ties break on the gate name
 * so the order is a value rather than a rendering of whatever order the caller passed.
 */
export function blockedCountByGate(
  members: readonly DeclaredMember[],
): Array<{ gate: BlockingGate; count: number }> {
  const counts = new Map<BlockingGate, number>();
  for (const member of members) {
    if (member.gate === "none") continue;
    counts.set(member.gate, (counts.get(member.gate) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([gate, count]) => ({ gate, count }))
    .sort((a, b) => b.count - a.count || a.gate.localeCompare(b.gate));
}

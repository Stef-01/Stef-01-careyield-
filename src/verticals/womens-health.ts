// W248: the women's health vertical — a declaration, and nothing else.
//
// W191 wrote the first vertical and had to build the assembly alongside it. This is the second,
// and it deliberately contains NO ASSEMBLY AT ALL: a member list, a spec, and four one-line
// re-exports that call the shared machinery in `assembly.ts`. If this file had grown its own
// `womensHealthEvidence()` next to dermatology's, the tree would have had two functions claiming
// the same fact about the same registries, and the first registry change would have been learned
// by one of them.
//
// EVERYTHING HERE IS BLOCKED, AND THAT IS THE DELIVERABLE. W249 is the pathway content and it is
// blocked on G5. Nothing in this vertical is signed off, nothing can be, and the unit's value is
// that the refusal is complete, named and stable — so the founder can price the women's health
// decision from code that keeps being true rather than from a document that was true in August.
//
// THE G5 LINE, AND IT IS TIGHTER HERE THAN IT WAS FOR DERMATOLOGY. A member's `waitsOn` says which
// gate and whose signature; it never says what the member is FOR. That rule cost nothing in a
// dermatology file, where the tempting sentence names a skin condition and reads obviously
// clinical. It costs more here, because the tempting sentences in this scope — screening
// intervals, contraception, menopause, antenatal care — read like SERVICE CATEGORIES rather than
// like clinical content, and a service category with a recommended cadence attached is a clinical
// claim wearing an operational coat. Naming any of them would be W56's interval problem arriving
// through a spec file. So the refs are opaque and the notes are about gates.
//
// A REF IS A PLACEHOLDER, NOT A FABRICATED HASH. A real version hash is the hash of signed
// content; inventing one would put a fabricated identity into W160's migration path where it
// would look exactly like a real one. W191's rule, and the reason every ref here starts `wh-`.
//
// FOUNDER GATE (plan §4): G5 blocks the pathway content and the interval. No clinical content is
// present, and a test asserts it with the tree's own linters rather than a fresh regex.

import {
  assembleVertical,
  gatesFor,
  shippedEvidence,
  specFrom,
  verticalOutstanding,
  type DeclaredMember,
} from "./assembly";
import type { CompletenessReport, KnownMembers } from "./completeness";
import type { VerticalEvidence, VerticalResult, VerticalSpec } from "./model";

/**
 * What a women's health vertical would be made of, and what each member waits on.
 *
 * The two pathways are separate members rather than one, because they are signed off separately
 * and a vertical that bundled them would report one refusal where there are two decisions.
 */
export const WOMENS_HEALTH_MEMBERS: readonly DeclaredMember[] = [
  {
    kind: "pathway",
    ref: "wh-pathway-1",
    waitsOn: "G5 — clinical content Meherr publishes. Needs two-person sign-off per W119 (W249).",
  },
  {
    kind: "pathway",
    ref: "wh-pathway-2",
    waitsOn: "G5 — clinical content Meherr publishes. Needs two-person sign-off per W119 (W249).",
  },
  {
    kind: "content",
    ref: "wh-content-1",
    waitsOn: "A named reviewer and a signatory. W127's registry holds neither yet.",
  },
  {
    kind: "education_item",
    ref: "wh-education-1",
    waitsOn: "An author. No founder gate applies to material that makes no clinical claim (W151).",
  },
  {
    kind: "interval",
    ref: "wh-interval-1",
    waitsOn: "G5 — the values ruling on cadence. Nobody can act until it lands (W56).",
  },
];

export const WOMENS_HEALTH_SPEC: VerticalSpec = specFrom(
  "vert-womens-health",
  "Women's health",
  WOMENS_HEALTH_MEMBERS,
);

/** Assemble against what is signed off. Refuses today, and names every missing member. */
export function assembleWomensHealth(
  evidence: VerticalEvidence = shippedEvidence(),
): VerticalResult {
  return assembleVertical(WOMENS_HEALTH_SPEC, evidence);
}

/** The outstanding work, decomposed by who has to act. W158's report, applied. */
export function womensHealthOutstanding(
  evidence: VerticalEvidence = shippedEvidence(),
  known?: KnownMembers,
): CompletenessReport {
  return verticalOutstanding(WOMENS_HEALTH_SPEC, evidence, known);
}

/** The gates this vertical is waiting on, deduplicated, in declaration order. */
export function womensHealthGates(): string[] {
  return gatesFor(WOMENS_HEALTH_MEMBERS);
}

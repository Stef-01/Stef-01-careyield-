// W252 verify gate: "order-independence and a stated time budget over 20 synthetic verticals; the
// budget is asserted in the test body, W48's shape."
//
// W48's shape is three moves and the middle one is the one that matters: exercise the checker on a
// result that violates EVERY budget and assert it says so, then run the real thing and assert the
// violations are empty. A checker only ever run against passing input is a function nobody has seen
// work, and "no violations" from it is not a result.
//
// THE CAST LIVES HERE, and that is the design rather than an accident of where it was convenient.
// Every field of `VerticalEvidence` is branded — `ApprovedContent`'s own note says "only
// signOff()/usableContent() can produce this, so `as` is the only bypass" — so a populated evidence
// set can only be built by casting past the gate. In a shipped module that function would be a
// sign-off laundry: importable by product code, and at the type level indistinguishable from
// evidence that passed G5. In a test file it cannot be reached. `scale.ts` takes evidence as a
// parameter and contains no cast at all, and a test below asserts that.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./scale";
import {
  DEFAULT_VERTICAL_SCALE_BUDGETS,
  SYNTHETIC_MEMBER_KINDS,
  WHAT_THE_NUMBER_IS_NOT,
  checkVerticalScaleBudgets,
  evidenceEntries,
  orderDependence,
  runVerticalScale,
  syntheticVerticals,
  type ScaleFixture,
  type VerticalScaleResult,
} from "./scale";
import { ALL_BLOCKING_GATES, assembleVertical, gatesFor, type DeclaredMember } from "./assembly";
import { DERMATOLOGY_SPEC } from "./dermatology";
import { RESPIRATORY_SPEC } from "./respiratory";
import { WOMENS_HEALTH_SPEC } from "./womens-health";
import type { VerticalEvidence } from "./model";
import { lintLandingCopy } from "@/compliance/landing";
import { lintMessageText } from "@/messaging/templates";

const SOURCE = readFileSync(path.join(process.cwd(), "src/verticals/scale.ts"), "utf8");

/** The number the unit named. */
const VERTICALS = 20;
const BASE_MEMBERS_EACH = 40;
const BASE_EVIDENCE_PER_KIND = 3_000;

/**
 * Populated evidence, in a ref namespace no spec can ever match.
 *
 * `syn-evidence-` against the generator's `syn-<v>-<m>`: disjoint by construction, and asserted
 * below rather than assumed, so this fixture cannot make a vertical usable however large it grows.
 * Only the three fields `refsIn` reads are populated — a synthetic interval would have to carry a
 * cadence, which is a fabricated clinical claim wherever it is generated.
 */
function syntheticEvidence(perKind: number): VerticalEvidence {
  const pathways = Array.from({ length: perKind }, (_, i) => ({
    version: { versionHash: `syn-evidence-pathway-${i}` },
  }));
  const content = Array.from({ length: perKind }, (_, i) => ({
    record: { id: `syn-evidence-content-${i}` },
  }));
  const educationItems = Array.from({ length: perKind }, (_, i) => ({
    item: { itemId: `syn-evidence-item-${i}` },
  }));
  return {
    pathways: pathways as unknown as VerticalEvidence["pathways"],
    content: content as unknown as VerticalEvidence["content"],
    educationItems: educationItems as unknown as VerticalEvidence["educationItems"],
    intervals: { intervals: [], rejected: [] },
  };
}

function fixture(verticals: number, membersEach: number, perKind: number): ScaleFixture {
  const { specs, members } = syntheticVerticals({ verticals, membersEach });
  return { specs, members, evidence: syntheticEvidence(perKind) };
}

/**
 * The 4× leg scales MEMBERS AND EVIDENCE, holding the vertical count at twenty.
 *
 * Quadrupling the number of verticals would multiply both a linear and a quadratic implementation
 * by four and distinguish nothing. The defect this measurement exists to catch is members ×
 * evidence WITHIN one vertical, so those are the two dimensions that grow: linear work lands near
 * 4×, members × evidence near 16×.
 */
const BASE = fixture(VERTICALS, BASE_MEMBERS_EACH, BASE_EVIDENCE_PER_KIND);
const QUADRUPLED = fixture(VERTICALS, BASE_MEMBERS_EACH * 4, BASE_EVIDENCE_PER_KIND * 4);

describe("W252 the fixture is capable of showing what the budget claims", () => {
  it("is twenty verticals, with evidence in it", () => {
    // The finding this unit turns on. `shippedEvidence()` is empty, so twenty verticals assembled
    // against the shipped evidence complete instantly no matter how bad the algorithm is — the scan
    // whose cost the budget bounds never runs, and the budget certifies nothing.
    expect(BASE.specs).toHaveLength(VERTICALS);
    expect(evidenceEntries(BASE.evidence)).toBe(BASE_EVIDENCE_PER_KIND * 3);
    expect(evidenceEntries(BASE.evidence)).toBeGreaterThan(
      DEFAULT_VERTICAL_SCALE_BUDGETS.minEvidenceEntries,
    );
    expect(evidenceEntries(QUADRUPLED.evidence)).toBe(evidenceEntries(BASE.evidence) * 4);
    expect(QUADRUPLED.members.length).toBe(BASE.members.length * 4);
  });

  it("spans more than one gate, so an ordering defect has somewhere to show", () => {
    // W250's lesson, applied to its own fixture: every vertical member in the tree waits on G5, so
    // the gate list had one entry, the sort was unreachable, and deleting it passed.
    const gates = gatesFor(BASE.members);
    expect(gates.length).toBeGreaterThan(DEFAULT_VERTICAL_SCALE_BUDGETS.minGates);
    expect(gates.length).toBe(ALL_BLOCKING_GATES.filter((g) => g !== "none").length);
  });

  it("WOULD catch an unsorted gate list, which is what makes the order test non-vacuous", () => {
    // The rigged control. `gatesFor` before this unit returned Set-insertion order — first
    // appearance. This reproduces that implementation and shows it gives a DIFFERENT answer on this
    // fixture when the members are reversed. Without this assertion, "reversing changes nothing"
    // could mean the property holds or could mean the fixture cannot tell.
    const firstAppearance = (members: readonly DeclaredMember[]) =>
      [...new Set(members.map((m) => m.gate))].filter((g) => g !== "none");
    expect(firstAppearance(BASE.members)).not.toEqual(
      firstAppearance([...BASE.members].reverse()),
    );
    // And the shipped one does not.
    expect(gatesFor(BASE.members)).toEqual(gatesFor([...BASE.members].reverse()));
  });

  it("cannot fabricate a sign-off, however large it grows", () => {
    // The safety property that lets a benchmark cast past a brand at all. The evidence refs live in
    // a namespace disjoint from every generated member ref, so no synthetic vertical can resolve.
    const memberRefs = new Set(BASE.members.map((m) => m.ref));
    const evidenceRefs = [
      ...BASE.evidence.pathways.map((p) => p.version.versionHash),
      ...BASE.evidence.content.map((c) => c.record.id),
      ...BASE.evidence.educationItems.map((i) => i.item.itemId),
    ];
    expect(evidenceRefs.length).toBeGreaterThan(0);
    expect(evidenceRefs.filter((ref) => memberRefs.has(ref))).toEqual([]);
    for (const spec of BASE.specs) {
      expect(assembleVertical(spec, BASE.evidence).usable, spec.verticalId).toBe(false);
    }
  });

  it("does not make the tree's real verticals usable either", () => {
    // The fixture is loose in the same process as three real specs. If casting past the brand could
    // resolve one of them, the cast would have laundered a sign-off rather than sized an array.
    for (const spec of [DERMATOLOGY_SPEC, WOMENS_HEALTH_SPEC, RESPIRATORY_SPEC]) {
      expect(assembleVertical(spec, QUADRUPLED.evidence).usable, spec.verticalId).toBe(false);
    }
  });

  it("generates no interval member, because an interval carries a cadence", () => {
    expect(SYNTHETIC_MEMBER_KINDS).not.toContain("interval");
    expect(BASE.members.filter((m) => m.kind === "interval")).toEqual([]);
    expect(BASE.evidence.intervals.intervals).toEqual([]);
  });
});

describe("W252 the budget checker, exercised before it is trusted", () => {
  /** A result that violates every budget at once. W48's shape. */
  const BROKEN: VerticalScaleResult = {
    base: { verticals: 20, members: 800, evidenceEntries: 0, refused: 19, wallMs: 4_000 },
    quadrupled: { verticals: 20, members: 3_200, evidenceEntries: 0, refused: 20, wallMs: 64_000 },
    growthRatio: 16,
    gates: 1,
    orderDependence: ["the gate list changed when the members were reversed"],
  };

  it("names every violation in words", () => {
    const violations = checkVerticalScaleBudgets(BROKEN, DEFAULT_VERTICAL_SCALE_BUDGETS);
    expect(violations.some((v) => v.includes("total wall"))).toBe(true);
    expect(violations.some((v) => v.includes("the measurement is vacuous"))).toBe(true);
    expect(violations.some((v) => v.includes("fabricate sign-off"))).toBe(true);
    expect(violations.some((v) => v.includes("order-independence over a set of one"))).toBe(true);
    expect(violations.some((v) => v.includes("wall clock grew"))).toBe(true);
    expect(violations.some((v) => v.startsWith("order-dependent:"))).toBe(true);
  });

  it("refuses a measurement taken against empty evidence, even when it is fast and clean", () => {
    // THE FINDING, as a test. This is the result the unit as specified would have produced: twenty
    // verticals, instant, nothing out of order — and the per-member evidence scan never executed.
    const vacuous: VerticalScaleResult = {
      base: { verticals: 20, members: 800, evidenceEntries: 0, refused: 20, wallMs: 1 },
      quadrupled: { verticals: 20, members: 3_200, evidenceEntries: 0, refused: 20, wallMs: 4 },
      growthRatio: 4,
      gates: 10,
      orderDependence: [],
    };
    const violations = checkVerticalScaleBudgets(vacuous, DEFAULT_VERTICAL_SCALE_BUDGETS);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.every((v) => v.includes("vacuous"))).toBe(true);
  });

  it("refuses a base sample too fast to divide by", () => {
    const unmeasurable: VerticalScaleResult = {
      ...BROKEN,
      base: { ...BROKEN.base, evidenceEntries: 9_000, wallMs: 0 },
      quadrupled: { ...BROKEN.quadrupled, evidenceEntries: 36_000, refused: 20, wallMs: 0 },
      growthRatio: Number.NaN,
      gates: 10,
      orderDependence: [],
    };
    const violations = checkVerticalScaleBudgets(unmeasurable, DEFAULT_VERTICAL_SCALE_BUDGETS);
    expect(violations).toContain(
      "the base sample took no measurable time, so the growth ratio is not a number",
    );
  });
});

describe("W252 twenty synthetic verticals, against the stated budget", () => {
  const RESULT = runVerticalScale(BASE, QUADRUPLED);

  it("meets every budget", () => {
    // THE BUDGET, asserted in the test body. The numbers themselves live in
    // DEFAULT_VERTICAL_SCALE_BUDGETS so a change to them shows up as a diff on a constant.
    expect(DEFAULT_VERTICAL_SCALE_BUDGETS.maxWallMs).toBe(2_500);
    expect(DEFAULT_VERTICAL_SCALE_BUDGETS.maxGrowthRatio).toBe(8);
    expect(DEFAULT_VERTICAL_SCALE_BUDGETS.minEvidenceEntries).toBe(4_000);
    expect(DEFAULT_VERTICAL_SCALE_BUDGETS.minGates).toBe(2);
    expect(checkVerticalScaleBudgets(RESULT, DEFAULT_VERTICAL_SCALE_BUDGETS)).toEqual([]);
  });

  it("grows with the work rather than with the work squared", () => {
    // The half that answers "does this scale". Members and evidence both quadruple: linear work
    // lands near 4×, members × evidence near 16×. Reverting W252's hoist in `usableVertical` puts
    // this over 12 — which is the mutation that proves this assertion is load-bearing.
    expect(Number.isFinite(RESULT.growthRatio)).toBe(true);
    expect(RESULT.growthRatio).toBeLessThan(DEFAULT_VERTICAL_SCALE_BUDGETS.maxGrowthRatio);
  });

  it("measured something, which the wall clock alone would not prove", () => {
    expect(RESULT.base.refused).toBe(VERTICALS);
    expect(RESULT.base.members).toBe(VERTICALS * BASE_MEMBERS_EACH);
    expect(RESULT.base.wallMs).toBeGreaterThan(0);
    expect(RESULT.gates).toBeGreaterThan(1);
  });

  it("gives the same answers whichever order the population arrives in", () => {
    expect(orderDependence(BASE)).toEqual([]);
    expect(orderDependence(QUADRUPLED)).toEqual([]);
  });
});

describe("W252 the module ships no bypass and no clinical content", () => {
  it("contains no cast past a brand", () => {
    // The design claim, asserted rather than described. The evidence cast lives in this test file;
    // if it ever migrates into the module, product code can import a sign-off laundry.
    expect(SOURCE).not.toContain("as unknown as");
    expect(SOURCE).not.toContain("VerticalEvidence[");
    expect(SOURCE, "the module builds evidence instead of taking it").toContain(
      "evidence: VerticalEvidence",
    );
  });

  it("goes through the shared door like every other caller", () => {
    expect(SOURCE).not.toContain("usableVertical(");
    expect(SOURCE).toContain("assembleVertical(");
  });

  it("makes no clinical claim, checked with the tree's linters rather than a fresh regex", () => {
    // W139/W184's law: apply the linters, do not restate them.
    for (const text of [...WHAT_THE_NUMBER_IS_NOT, mod.SYNTHETIC_WAITS_ON]) {
      expect(lintLandingCopy(text), text.slice(0, 40)).toEqual([]);
      expect(lintMessageText(text), text.slice(0, 40)).toEqual([]);
    }
    for (const member of BASE.members.slice(0, 50)) {
      expect(lintLandingCopy(member.waitsOn), member.ref).toEqual([]);
      expect(lintMessageText(member.waitsOn), member.ref).toEqual([]);
    }
  });

  it("states what the number is not, rather than leaving a reader to infer it", () => {
    expect(WHAT_THE_NUMBER_IS_NOT.length).toBeGreaterThan(3);
    for (const limit of WHAT_THE_NUMBER_IS_NOT) {
      expect(limit.length, `a limit stated in ${limit.length} characters says nothing`).toBeGreaterThan(80);
    }
    expect(WHAT_THE_NUMBER_IS_NOT.join(" ")).toContain("not a complexity bound");
  });

  it("exports nothing that could carry content", () => {
    expect(Object.keys(mod).filter((n) => /content|criteri|body|descri/i.test(n))).toEqual([]);
  });
});

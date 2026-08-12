// W252: the vertical registers at N verticals — and what a wall-clock number is not evidence of.
//
// Year 4 has three verticals. The unit asks whether the registers still work at twenty, and the
// honest answer has two halves that are easy to confuse:
//
//   A TIME BUDGET IS A REGRESSION TRIPWIRE, NOT A COMPLEXITY PROOF. "Twenty verticals assembled in
//   under two seconds" is a fact about this machine on this afternoon. It catches the day somebody
//   makes the path a hundred times slower, and it says nothing at all about the SHAPE of the cost.
//   A quadratic algorithm over a small fixture passes a generous wall-clock budget every time.
//
//   THE GROWTH RATIO IS THE HALF THAT ANSWERS THE QUESTION. Measure the same work at 1× and at 4×
//   and compare the two wall clocks. Work that is linear in members plus evidence lands near 4×.
//   Work that is members TIMES evidence lands near 16×. The ratio is a property of the algorithm
//   and survives being run on a different machine; the milliseconds do not.
//
// AND THE FIXTURE HAD TO BE BUILT BEFORE EITHER NUMBER MEANT ANYTHING. `shippedEvidence()` returns
// empty arrays — nothing in this tree is signed off — so twenty verticals assembled against the
// shipped evidence complete instantly NO MATTER HOW BAD THE ALGORITHM IS. The scan whose cost the
// budget is supposed to bound never runs. That is this unit's finding, and it is the reason
// `checkVerticalScaleBudgets` refuses to certify a measurement taken against an empty evidence set:
// the vacuity guard is inside the checker rather than beside it, because a note saying "populate
// the evidence" is advice and a violation in words is a failure.
//
// WHAT THE FIXTURE FOUND, once it existed. Two defects, both in this tree's own machinery, both
// unobservable against the three real verticals:
//
//   `usableVertical` called `refsIn(evidence, member.kind)` INSIDE its per-member loop, and
//   `refsIn` builds a fresh Set over the whole evidence array on every call — so the work was
//   members × evidence. Invisible while the evidence is empty, and quadratic the day the gates
//   open: invisible exactly until the moment the feature starts being used.
//
//   `gatesFor` returned Set-insertion order, which is to say first-appearance, which is to say the
//   order the caller happened to list the verticals in. Every member in the tree waits on G5, so
//   the list had one entry and no order to get wrong. W250 wrote down that a property tested over
//   a set of one is a property nobody tested, fixed the rollup beside it, and left this one.
//
// WHY THE SYNTHETIC EVIDENCE IS NOT SUPPLIED FROM HERE. Every field of `VerticalEvidence` is a
// branded type or a validated catalogue: a caller cannot produce one without having passed the
// corresponding gate, which is W157's whole design and the reason an unsigned pathway cannot be
// PUT IN a usable vertical. Populating it for a benchmark means casting past that brand. A shipped
// module that exported the result would be a sign-off laundry — importable by product code, and
// indistinguishable at the type level from evidence that passed G5. So this module takes evidence
// as a PARAMETER and the cast lives in the test, where product code cannot reach it, and the
// checker below fails any sample in which a synthetic fixture produced a usable vertical.
//
// FOUNDER GATE (plan §4): no clinical content, and none can arrive through here. Synthetic members
// carry opaque refs in a `syn-` namespace and a `waitsOn` sentence about gates. The `interval` kind
// is deliberately absent from the generated members and from the fixture's evidence: the other
// three member kinds are identified by an opaque hash or id, but an interval carries a CADENCE, and
// a synthetic cadence is a fabricated clinical claim regardless of the array it is generated into.
// Three kinds are enough to measure a scan whose cost does not depend on which kind it scans.

import {
  ALL_BLOCKING_GATES,
  assembleVertical,
  blockedCountByGate,
  gatesFor,
  specFrom,
  type DeclaredMember,
} from "./assembly";
import type { VerticalEvidence, VerticalMemberKind, VerticalSpec } from "./model";

/**
 * The member kinds a synthetic vertical is built from.
 *
 * `interval` is missing on purpose — see the founder-gate note above. The absence is a constant
 * rather than a comment so a test can assert it.
 */
export const SYNTHETIC_MEMBER_KINDS: readonly VerticalMemberKind[] = [
  "pathway",
  "content",
  "education_item",
];

/** The one sentence every synthetic member carries. Says which act, never what the member is for. */
export const SYNTHETIC_WAITS_ON =
  "Synthetic member generated for a scale measurement. It waits on nothing, because it describes nothing and no reviewer will ever be asked to sign it off.";

/** Honest limits, stated where the number is, rather than in a document beside it. */
export const WHAT_THE_NUMBER_IS_NOT: readonly string[] = [
  "The wall-clock budget is a regression tripwire on one machine. It is not a complexity bound, and a quadratic path over a small fixture passes it comfortably.",
  "The growth ratio is measured over the REFUSAL path, because refusal is the path this tree actually runs: nothing is signed off, so every vertical refuses. The usable path — the filters and W159's contradiction search that run once every member resolves — is not measured here, and the day the gates open it will need its own.",
  "Twenty is the number the unit asked for, not a number derived from a forecast of how many verticals Meherr will publish.",
  "The fixture measures assembly and the two gate rollups. It does not measure W160's migration path, W162's binding, or anything that reads or writes a store.",
];

export interface SyntheticScale {
  verticals: number;
  membersEach: number;
}

/** Specs and their members, generated together so the two cannot disagree. */
export interface SyntheticVerticals {
  specs: readonly VerticalSpec[];
  members: readonly DeclaredMember[];
}

/**
 * N synthetic verticals, spanning every gate the plan defines.
 *
 * The gate assignment is round-robin over `ALL_BLOCKING_GATES` and that is load-bearing, not
 * decoration: order-independence over a fixture with ONE gate is the vacuous test W250 found in its
 * own work. A fixture that cannot distinguish first-appearance order from sorted order cannot show
 * an ordering defect, so the generator spreads the gates and a test asserts the spread is real.
 */
export function syntheticVerticals(scale: SyntheticScale): SyntheticVerticals {
  const specs: VerticalSpec[] = [];
  const members: DeclaredMember[] = [];
  for (let v = 0; v < scale.verticals; v++) {
    const own: DeclaredMember[] = [];
    for (let m = 0; m < scale.membersEach; m++) {
      own.push({
        kind: SYNTHETIC_MEMBER_KINDS[m % SYNTHETIC_MEMBER_KINDS.length]!,
        ref: `syn-${v}-${m}`,
        gate: ALL_BLOCKING_GATES[(v + m) % ALL_BLOCKING_GATES.length]!,
        waitsOn: SYNTHETIC_WAITS_ON,
      });
    }
    specs.push(specFrom(`syn-vertical-${v}`, `Synthetic vertical ${v}`, own));
    members.push(...own);
  }
  return { specs, members };
}

/** A generated population and the evidence it is assessed against. Evidence comes from outside. */
export interface ScaleFixture {
  specs: readonly VerticalSpec[];
  members: readonly DeclaredMember[];
  evidence: VerticalEvidence;
}

export interface ScaleSample {
  verticals: number;
  members: number;
  evidenceEntries: number;
  /** How many of the verticals refused. Anything less than all of them is a fabricated sign-off. */
  refused: number;
  wallMs: number;
}

export interface VerticalScaleResult {
  base: ScaleSample;
  quadrupled: ScaleSample;
  /** `quadrupled.wallMs / base.wallMs`. NaN when the base sample was too fast to measure. */
  growthRatio: number;
  /** How many distinct founder gates the base fixture spans. Below two, ordering is unobservable. */
  gates: number;
  /** Order-dependence found, in words. Empty is the passing answer. */
  orderDependence: readonly string[];
}

export interface VerticalScaleBudgets {
  /** Both samples together. A tripwire — see `WHAT_THE_NUMBER_IS_NOT`. */
  maxWallMs: number;
  /** The vacuity floor: below this the per-member evidence scan never ran. */
  minEvidenceEntries: number;
  /** The other vacuity floor: below this the fixture cannot show an ordering defect. */
  minGates: number;
  /** Linear work lands near 4×; members × evidence lands near 16×. */
  maxGrowthRatio: number;
}

export const DEFAULT_VERTICAL_SCALE_BUDGETS: VerticalScaleBudgets = {
  maxWallMs: 2_500,
  minEvidenceEntries: 4_000,
  minGates: 2,
  maxGrowthRatio: 8,
};

export function evidenceEntries(evidence: VerticalEvidence): number {
  return (
    evidence.pathways.length +
    evidence.content.length +
    evidence.educationItems.length +
    evidence.intervals.intervals.length
  );
}

/**
 * Assemble every spec against the evidence, and time it.
 *
 * WARMED BEFORE TIMED, and the direction matters. A cold first sample runs slow, which makes the
 * base leg of the ratio bigger, which makes the ratio SMALLER — the direction that hides a
 * quadratic path rather than inventing one. Everything not being measured is computed outside the
 * clock for the same reason.
 */
export function measureAssembly(
  specs: readonly VerticalSpec[],
  evidence: VerticalEvidence,
): ScaleSample {
  for (const spec of specs.slice(0, 2)) assembleVertical(spec, evidence);

  const members = specs.reduce((n, spec) => n + spec.members.length, 0);
  const entries = evidenceEntries(evidence);

  let refused = 0;
  const t0 = performance.now();
  for (const spec of specs) {
    if (!assembleVertical(spec, evidence).usable) refused++;
  }
  const wallMs = performance.now() - t0;

  return { verticals: specs.length, members, evidenceEntries: entries, refused, wallMs };
}

function assemblySummary(specs: readonly VerticalSpec[], evidence: VerticalEvidence): string {
  return JSON.stringify(
    specs
      .map((spec) => {
        const result = assembleVertical(spec, evidence);
        return {
          verticalId: spec.verticalId,
          usable: result.usable,
          unusable: result.usable ? [] : result.unusable.map((m) => m.member.ref).sort(),
        };
      })
      .sort((a, b) => a.verticalId.localeCompare(b.verticalId)),
  );
}

/**
 * W167's property over the whole population: does the answer depend on the order of the input?
 *
 * Returns findings in words rather than a boolean, because "something changed" sends the reader
 * back to the fixture to work out what.
 */
export function orderDependence(fixture: ScaleFixture): string[] {
  const found: string[] = [];
  const reversed = [...fixture.members].reverse();

  if (JSON.stringify(gatesFor(fixture.members)) !== JSON.stringify(gatesFor(reversed))) {
    found.push("the gate list changed when the members were reversed");
  }
  if (
    JSON.stringify(blockedCountByGate(fixture.members)) !==
    JSON.stringify(blockedCountByGate(reversed))
  ) {
    found.push("the blocked-count rollup changed when the members were reversed");
  }
  if (
    assemblySummary(fixture.specs, fixture.evidence) !==
    assemblySummary([...fixture.specs].reverse(), fixture.evidence)
  ) {
    found.push("a vertical's own assembly result changed when the verticals were assembled in the opposite order");
  }
  return found;
}

/** The two samples and the ratio between them. */
export function runVerticalScale(base: ScaleFixture, quadrupled: ScaleFixture): VerticalScaleResult {
  const baseSample = measureAssembly(base.specs, base.evidence);
  const quadSample = measureAssembly(quadrupled.specs, quadrupled.evidence);
  return {
    base: baseSample,
    quadrupled: quadSample,
    growthRatio: baseSample.wallMs > 0 ? quadSample.wallMs / baseSample.wallMs : Number.NaN,
    gates: gatesFor(base.members).length,
    orderDependence: orderDependence(base),
  };
}

/**
 * Violations in words, W48's shape — and two of them are about the MEASUREMENT rather than the
 * code under it.
 *
 * An empty evidence set and a single-gate fixture both produce a clean run over nothing. A checker
 * that reported "no violations" for either would be certifying that a scan it never executed is
 * fast enough, which is the failure this tree keeps finding under a green suite.
 */
export function checkVerticalScaleBudgets(
  result: VerticalScaleResult,
  budgets: VerticalScaleBudgets,
): string[] {
  const violations: string[] = [];

  const totalWall = result.base.wallMs + result.quadrupled.wallMs;
  if (totalWall > budgets.maxWallMs) {
    violations.push(`total wall ${Math.round(totalWall)}ms > ${budgets.maxWallMs}ms`);
  }

  const samples: ReadonlyArray<readonly [string, ScaleSample]> = [
    ["base", result.base],
    ["quadrupled", result.quadrupled],
  ];
  for (const [label, sample] of samples) {
    if (sample.evidenceEntries < budgets.minEvidenceEntries) {
      violations.push(
        `the ${label} sample ran against ${sample.evidenceEntries} evidence entries (floor ${budgets.minEvidenceEntries}) — the per-member evidence scan never ran, so the measurement is vacuous`,
      );
    }
    if (sample.refused !== sample.verticals) {
      violations.push(
        `the ${label} sample produced ${sample.verticals - sample.refused} usable vertical(s) from a synthetic fixture — a brand has been bypassed to fabricate sign-off`,
      );
    }
  }

  if (result.gates < budgets.minGates) {
    violations.push(
      `the fixture spans ${result.gates} gate(s) (floor ${budgets.minGates}) — order-independence over a set of one is a property nobody tested`,
    );
  }

  if (!Number.isFinite(result.growthRatio)) {
    violations.push("the base sample took no measurable time, so the growth ratio is not a number");
  } else if (result.growthRatio > budgets.maxGrowthRatio) {
    violations.push(
      `wall clock grew ${result.growthRatio.toFixed(1)}× when the work grew 4× (allowed ${budgets.maxGrowthRatio}×)`,
    );
  }

  for (const finding of result.orderDependence) {
    violations.push(`order-dependent: ${finding}`);
  }

  return violations;
}

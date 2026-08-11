// W219: attribution over the response graph — and the line the graph cannot cross.
//
// W9 counts two arms. W215 turns that into the one honest claim the product can make: what the
// invited arm attended, against what it would have attended at the holdout arm's observed rate,
// withheld below W72's floor. W212's graph then breaks the product's work down by KIND — offers,
// reminders, referrals, material — and the obvious next unit computes an effect per kind.
//
// IT CANNOT BE COMPUTED, AND SAYING SO IS THE UNIT.
//
// The holdout arm is not messaged AT ALL. It is a counterfactual for "Meherr ran here" and for
// nothing narrower. There is no arm that received offers but no reminders, no arm that received
// reminders but no referrals — so nothing in the recorded data separates the effect of one kind
// of intervention from the effect of another. "Reminders are answered 20% of the time" is a true
// sentence about a denominator; "reminders cause 20% of bookings" is a guess, and the distance
// between the two is a reader.
//
// The temptation is precise and worth naming, because the arithmetic is available and looks
// respectable: response rate per kind, compared across kinds, ranked. Every step is a division
// somebody can check, and the conclusion — this kind works better — rests on an assumption
// nothing in the data supports, that the people who got reminders were otherwise like the people
// who did not. They were not: they got reminders because their first offer went unanswered.
//
// SO THE MODULE SHIPS BOTH, LABELLED, AND THE LABEL IS A TYPE. A per-kind figure has
// `attributable: false` as a LITERAL, not a boolean — there is no value a future edit could set
// it to that would make a per-kind figure a claim, short of changing a declared type where a
// reviewer sees it. W215 made `Comparator` a one-member union for the same reason.
//
// PER-PATIENT IS REFUSED BY ABSENCE, checked on signatures rather than names (W215's method): a
// per-patient effect estimate is both unanswerable and the input to a triage, and `estimateFor`
// is an innocent-looking name.
//
// RESPONDED IS NOT THE SUM OF THE EDGES, and the difference matters. One offer can be answered
// twice — booked, then the appointment attended — so summing edge counts double-counts people.
// The number of interventions that got ANY answer is `interventions − unanswered`, both of which
// W212 carries separately and neither of which is a rate. Both are reported, with the reason they
// differ, because a reader who saw only the larger one would think more people answered than did.

import type { RecordedBasis } from "@/reporting/model";
import type { AttributionResult } from "@/engine/attribution";
import { counterfactual, type CounterfactualResult } from "./counterfactual";
import type { InterventionKind } from "./response";
import type { ResponseGraph } from "./response-graph";

/**
 * A per-kind figure: a description of what was recorded, never a claim about what caused it.
 *
 * `attributable` is the literal `false`. A per-kind figure that claimed causation would have to
 * change this type, which is a visible edit rather than a flipped flag.
 */
export interface DescriptiveKindFigure {
  kind: InterventionKind;
  /** How many interventions of this kind were recorded in the period. */
  interventions: number;
  /** How many of those got any recorded answer. Not the edge total — see the module note. */
  answered: number;
  /** Recorded answers, which can exceed `answered` because one offer can be answered twice. */
  recordedAnswers: number;
  attributable: false;
  whyNotAttributable: string;
  basis: RecordedBasis;
}

/** Why a per-kind figure is not a claim. One reason, because there is one reason. */
export const NOT_ATTRIBUTABLE_PER_KIND =
  "The holdout arm is not messaged at all, so it is a comparison for whether Meherr ran here and not for one kind of contact against another. Nobody received reminders but no offers. This counts what was recorded; it does not say what caused it.";

/**
 * Scopes this module refuses, with the reason each is refused.
 *
 * Data rather than a comment, so a later unit has to delete a stated refusal rather than quietly
 * add a function — W196's `REFUSED_FIGURES` shape.
 */
export const REFUSED_SCOPES: Readonly<Record<string, string>> = {
  per_patient_effect:
    "Would this person have come anyway. Unanswerable — nobody observes the same person both messaged and not — and it is the input to a triage, which is the G7 line. No function here takes a patient.",
  per_kind_effect:
    "The effect of reminders as distinct from offers. Not derivable from these arms; see NOT_ATTRIBUTABLE_PER_KIND. Answering it would need an arm that got one and not the other, which would be a trial design and a founder decision, not a calculation.",
  per_clinician_effect:
    "W83 refused ranking clinicians internally and W196 refused a per-clinician figure leaving the tree. An effect size per clinician is the same thing with arithmetic in front of it.",
  ranked_kinds:
    "An ordered list of which intervention works best. Each number in it is descriptive, and ordering descriptive numbers is how a reader is invited to read them as causal.",
};

export interface AttributionV2 {
  /** The only attributable figure: practice-wide, over the arms, with W215's floor applied. */
  claim: CounterfactualResult;
  /** Per-kind description. Never a claim; see the type. */
  perKind: readonly DescriptiveKindFigure[];
  /** Kinds the period recorded nothing for. Not rates of zero — W212's distinction, carried. */
  notPerformed: readonly InterventionKind[];
}

/**
 * Build the attribution view.
 *
 * Takes the arms and the graph, and composes W215 rather than recomputing it — two counterfactual
 * implementations would drift, and the drift would be invisible because nobody opens both files.
 */
export function attributionV2(
  attribution: AttributionResult,
  graph: ResponseGraph,
): AttributionV2 {
  const unansweredByKind = new Map(graph.unanswered.map((u) => [u.kind, u.count]));
  const interventionsByKind = new Map<InterventionKind, number>();
  const answersByKind = new Map<InterventionKind, number>();

  for (const edge of graph.edges) {
    interventionsByKind.set(edge.from, edge.basis.recordedFacts);
    answersByKind.set(edge.from, (answersByKind.get(edge.from) ?? 0) + edge.count);
  }
  for (const node of graph.unanswered) {
    interventionsByKind.set(node.kind, node.basis.recordedFacts);
  }

  const perKind: DescriptiveKindFigure[] = [...interventionsByKind.entries()]
    .map(([kind, interventions]) => ({
      kind,
      interventions,
      answered: interventions - (unansweredByKind.get(kind) ?? 0),
      recordedAnswers: answersByKind.get(kind) ?? 0,
      attributable: false as const,
      whyNotAttributable: NOT_ATTRIBUTABLE_PER_KIND,
      basis: {
        source: "the response graph (W212), over the recorded event spine",
        recordedFacts: interventions,
        fromIso: graph.basis.fromIso,
        toIso: graph.basis.toIso,
      },
    }))
    .sort((a, b) => a.kind.localeCompare(b.kind));

  return {
    claim: counterfactual(attribution),
    perKind,
    notPerformed: graph.unobserved.map((u) => u.kind).sort(),
  };
}

/**
 * Render it, with the label attached to every per-kind line rather than stated once at the top.
 *
 * A caveat in a header is a caveat a reader scrolls past; W177's finding about duplicated caveats
 * cuts the other way here, because these numbers travel individually in screenshots and emails.
 */
export function renderAttributionV2(view: AttributionV2): string {
  const lines: string[] = ["What can be attributed", ""];
  if (view.claim.claimed) {
    const f = view.claim.figure;
    lines.push(
      `Practice-wide: ${f.observed} attended, against ${f.withoutTheIntervention.toFixed(1)} expected at the holdout arm's observed rate. Difference ${f.difference.toFixed(1)}.`,
      `Counted over ${f.basis.invitedArmPatients} invited and ${f.basis.holdoutArmPatients} held out.`,
    );
  } else {
    lines.push("No practice-wide claim: the arms do not support one.");
  }

  lines.push("", "What is described but NOT attributed", "");
  for (const figure of view.perKind) {
    lines.push(
      `- ${figure.kind}: ${figure.answered} of ${figure.interventions} recorded interventions got an answer (${figure.recordedAnswers} answers recorded; one intervention can be answered more than once).`,
      `  Not attributable. ${figure.whyNotAttributable}`,
    );
  }

  if (view.notPerformed.length > 0) {
    lines.push("", `Not performed in this period: ${view.notPerformed.join(", ")}. This is not a rate of zero.`);
  }
  return lines.join("\n");
}

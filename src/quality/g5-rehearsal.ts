// W264: the two-person sign-off, driven end to end on content that means nothing.
//
// W261 wrote down what happens on the day G5 is answered. W262 drove G1's path while every
// credential stayed refused. This does the same for G5, and the difference between the two is
// the whole design of this module.
//
// G1'S REHEARSAL COULD NOT REACH THE OTHER SIDE OF ITS GATE. The loader refuses before it looks
// at the value, so the walk recorded the refusal and continued through the stages that need no
// credential. G5's gate is not like that: `usablePathway()` is a pure function of a version and
// its attestations, so a walk that supplies both REACHES THE OTHER SIDE and mints a
// `UsablePathway` — the branded type G5 exists to withhold. That is not a hole. It is W56's
// shape at the pathway boundary, stated plainly: THE WORKFLOW ENFORCES THE GATE, THE CATALOGUE
// HOLDS IT. `SHIPPED_PATHWAYS` and `SHIPPED_ATTESTATIONS` are empty, so nothing in the product
// has been signed by anyone; the mechanism that would sign it is exercised here, on content
// with no clinical meaning, and the two facts do not touch.
//
// WHICH MAKES THE CONTENT THE DANGEROUS PART, NOT THE WALK. A rehearsal is more convincing the
// more its fixture looks like the real thing — and writing plausible inclusion, exclusion and
// escalation criteria to make this read well WOULD BE THE G5 ACT, performed by a builder with
// no standing to perform it, sitting in the tree with a sign-off recorded against it. So the
// criteria name `synthetic.fact.*` codes that correspond to nothing, and the test runs W121's
// own clinical-vocabulary linter over every rationale in them. The rehearsal is allowed to
// exist because its content is empty of meaning, and that is checked rather than intended.
//
// AND THE REFUSALS ARE THE UNIT, NOT AN APPENDIX. The gate says "including the refusals", and
// the reason is that a workflow is only as good as the cases it turns down: `usablePathway`
// names nine, they encode nine separate decisions about what a sign-off has to be, and the
// obvious rehearsal proves ONE of them fires and calls the workflow exercised. `REFUSAL_DRIVES`
// arranges a scenario for each and records WHAT THE WORKFLOW ACTUALLY SAID, so a scenario that
// stops arranging what its name claims shows up as a mismatch instead of as a pass. The map is
// typed `Record<PathwayRefusal, …>`, so a tenth refusal added to the union fails to compile
// until somebody drives it.
//
// FOUNDER GATE (plan §4): G5 is unratified. Nothing here fills either shipped register, nothing
// reaches the console's registry, and the branded value the walk mints is used inside the walk
// and never handed back.

import {
  PATHWAY_REFUSAL_COPY,
  usablePathway,
  type PathwayAttestation,
  type PathwayAttestationKind,
  type PathwayRefusal,
  SHIPPED_ATTESTATIONS,
} from "@/pathways/approval";
import {
  replayPathway,
  versionHash,
  SHIPPED_PATHWAYS,
  type PathwayCriteria,
  type PathwayEvent,
  type PathwayVersion,
} from "@/pathways/versioning";
import { evaluatePathway, type RecordedFact } from "@/pathways/evaluation";
import { getPathwayAttestations, getPathwayEvents } from "@/pathways/registry";

/** The pathway id the rehearsal uses. Prefixed so it cannot be mistaken for a real one. */
export const SYNTHETIC_PATHWAY_ID = "synthetic.rehearsal.g5";

/**
 * The content the rehearsal signs off.
 *
 * EVERY FACT CODE IS A PLACEHOLDER AND EVERY RATIONALE SAYS SO. A criterion here is not a
 * simplified clinical rule, it is not a clinical rule at all — the codes correspond to nothing a
 * practice system records, and the test lints the rationales with the same vocabulary check
 * W121 applies to escalation text. Making this fixture read like real content would be the act
 * G5 withholds, so it deliberately reads like what it is.
 */
export const SYNTHETIC_CRITERIA: PathwayCriteria = {
  inclusion: [
    {
      factCode: "synthetic.fact.alpha",
      requires: "present",
      rationale:
        "A placeholder fact that stands for nothing. It exists so the sign-off workflow has a document to carry, and it says nothing about anyone.",
    },
  ],
  exclusion: [
    {
      factCode: "synthetic.fact.beta",
      requires: "present",
      rationale:
        "A second placeholder, on the other list, so the walk carries a version with more than one kind of criterion in it. It stands for nothing.",
    },
  ],
  escalation: [
    {
      factCode: "synthetic.fact.gamma",
      requires: "present",
      rationale:
        "A third placeholder. Its list would carry meaning in a real pathway; here it carries a name and nothing behind it.",
    },
  ],
};

export const SYNTHETIC_VERSION_HASH = versionHash(SYNTHETIC_CRITERIA);

/** Three people, because two stages asked of one person are one stage wearing two hats. */
const AUTHOR = "author@demo.practice.example";
const REVIEWER = "reviewer@demo.practice.example";
const FOUNDER = "founder@demo.practice.example";

/** A frozen timeline. Nothing here reads a clock — W48's rule, and a replay needs fixed order. */
const AT = {
  drafted: "2026-01-05T09:00:00.000Z",
  published: "2026-01-06T09:00:00.000Z",
  reviewed: "2026-01-07T09:00:00.000Z",
  signedOff: "2026-01-08T09:00:00.000Z",
  withdrawn: "2026-01-09T09:00:00.000Z",
  republished: "2026-01-10T09:00:00.000Z",
} as const;

const DRAFT: PathwayEvent = {
  pathwayId: SYNTHETIC_PATHWAY_ID,
  kind: "version_drafted",
  versionHash: SYNTHETIC_VERSION_HASH,
  at: AT.drafted,
  byEmail: AUTHOR,
  criteria: SYNTHETIC_CRITERIA,
};

const PUBLISH: PathwayEvent = {
  pathwayId: SYNTHETIC_PATHWAY_ID,
  kind: "version_published",
  versionHash: SYNTHETIC_VERSION_HASH,
  at: AT.published,
  byEmail: AUTHOR,
};

function attest(
  kind: PathwayAttestationKind,
  byEmail: string,
  at: string,
  revokedAt: string | null = null,
): PathwayAttestation {
  return {
    pathwayId: SYNTHETIC_PATHWAY_ID,
    versionHash: SYNTHETIC_VERSION_HASH,
    kind,
    byEmail,
    at,
    finding:
      "Rehearsal attestation against synthetic content. Nobody has reviewed anything clinical, because there is nothing clinical here to review.",
    revokedAt,
  };
}

const REVIEW = attest("specialist_review", REVIEWER, AT.reviewed);
const SIGN_OFF = attest("founder_sign_off", FOUNDER, AT.signedOff);

/** Replay the events and hand back the one version they all concern. */
function versionFrom(events: readonly PathwayEvent[]): PathwayVersion | null {
  return (
    replayPathway(events, SYNTHETIC_PATHWAY_ID).versions.find(
      (v) => v.versionHash === SYNTHETIC_VERSION_HASH,
    ) ?? null
  );
}

export type SignOffStage =
  /** Both shipped registers are empty before anything runs. */
  | "catalogue_empty_before"
  /** The synthetic version exists as a draft, replayed from events. */
  | "version_drafted"
  /** It is in force. Being in force and being signed off are separate facts. */
  | "version_published"
  /** Published and unsigned is UNUSABLE, and the refusal names which stage is missing. */
  | "unsigned_version_refused"
  /** A specialist who is not the author records a finding. */
  | "specialist_review_recorded"
  /** Still unusable. One signature is not two, and the refusal changes to say so. */
  | "sign_off_still_missing"
  /** A founder who is not the reviewer signs it off. */
  | "founder_sign_off_recorded"
  /** The gate opens for THIS version and the branded value exists. */
  | "version_became_usable"
  /** W120 accepts the brand — what sign-off is actually for. */
  | "usable_version_evaluated"
  /** Both shipped registers are still empty afterwards. */
  | "catalogue_empty_after"
  /** The console's registry never saw any of it. */
  | "registry_untouched";

export const ALL_SIGN_OFF_STAGES: readonly SignOffStage[] = [
  "catalogue_empty_before",
  "version_drafted",
  "version_published",
  "unsigned_version_refused",
  "specialist_review_recorded",
  "sign_off_still_missing",
  "founder_sign_off_recorded",
  "version_became_usable",
  "usable_version_evaluated",
  "catalogue_empty_after",
  "registry_untouched",
];

export interface SignOffStageOutcome {
  stage: SignOffStage;
  /** What the stage saw. A stage that observed nothing did not really run. */
  observed: string;
}

export type SignOffRehearsal =
  | { walked: true; stages: readonly SignOffStageOutcome[] }
  | { walked: false; stoppedAt: SignOffStage; why: string; stages: readonly SignOffStageOutcome[] };

/** The facts the evaluation stage reads. Synthetic codes, so they match nothing real either. */
const SYNTHETIC_FACTS: readonly RecordedFact[] = [
  {
    code: "synthetic.fact.alpha",
    state: "recorded_present",
    source: "practice_confirmed",
    recordedAt: AT.published,
    recordedBy: AUTHOR,
  },
  {
    code: "synthetic.fact.beta",
    state: "recorded_absent",
    source: "practice_confirmed",
    recordedAt: AT.published,
    recordedBy: AUTHOR,
  },
  {
    code: "synthetic.fact.gamma",
    state: "recorded_absent",
    source: "practice_confirmed",
    recordedAt: AT.published,
    recordedBy: AUTHOR,
  },
];

/**
 * Walk the sign-off from a draft to a usable version and out the other side.
 *
 * TAKES NOTHING AND RETURNS NO BRANDED VALUE. The `UsablePathway` the walk mints is used at the
 * one stage that needs it and then goes out of scope: handing it back would turn this module
 * into a source of the type G5 exists to withhold, reachable from anywhere by an import.
 *
 * A stop partway returns the stages that ran, W262's rule — the difference between "the gate
 * held at stage four" and "the gate held at stage eight" is the difference between a workflow
 * that refuses everything and one that refuses the right things.
 */
export function rehearseSignOff(): SignOffRehearsal {
  const stages: SignOffStageOutcome[] = [];
  const record = (stage: SignOffStage, observed: string) => stages.push({ stage, observed });
  const stop = (stoppedAt: SignOffStage, why: string): SignOffRehearsal => ({
    walked: false,
    stoppedAt,
    why,
    stages,
  });

  const registryBefore = {
    events: getPathwayEvents().length,
    attestations: getPathwayAttestations().length,
  };
  record(
    "catalogue_empty_before",
    `SHIPPED_PATHWAYS has ${SHIPPED_PATHWAYS.length}, SHIPPED_ATTESTATIONS has ${SHIPPED_ATTESTATIONS.length}`,
  );

  const draft = versionFrom([DRAFT]);
  if (!draft) return stop("version_drafted", "the draft event did not replay into a version");
  record("version_drafted", `${draft.pathwayId} ordinal ${draft.ordinal} is a ${draft.state}`);

  const events = [DRAFT, PUBLISH];
  const published = versionFrom(events);
  if (!published || published.state !== "published") {
    return stop("version_published", "the version did not come into force");
  }
  record("version_published", `in force from ${published.publishedAt} by ${published.publishedBy}`);

  const unsigned = usablePathway(published, []);
  if (unsigned.usable) return stop("unsigned_version_refused", "an unsigned version was usable");
  record("unsigned_version_refused", `refused: ${unsigned.reason}`);

  record("specialist_review_recorded", `${REVIEW.byEmail} at ${REVIEW.at}, author was ${AUTHOR}`);

  const reviewedOnly = usablePathway(published, [REVIEW]);
  if (reviewedOnly.usable) return stop("sign_off_still_missing", "one signature was enough");
  record("sign_off_still_missing", `refused: ${reviewedOnly.reason}`);

  record("founder_sign_off_recorded", `${SIGN_OFF.byEmail} at ${SIGN_OFF.at}`);

  const result = usablePathway(published, [REVIEW, SIGN_OFF]);
  if (!result.usable) return stop("version_became_usable", `still refused: ${result.reason}`);
  record(
    "version_became_usable",
    `reviewed by ${result.pathway.reviewedBy}, signed off by ${result.pathway.signedOffBy}`,
  );

  // The point of the brand: W120 will not take a version that has not been through this.
  const verdict = evaluatePathway(result.pathway, SYNTHETIC_FACTS);
  record(
    "usable_version_evaluated",
    `verdict ${verdict.outcome} against ${verdict.versionHash.slice(0, 8)}`,
  );

  record(
    "catalogue_empty_after",
    `SHIPPED_PATHWAYS has ${SHIPPED_PATHWAYS.length}, SHIPPED_ATTESTATIONS has ${SHIPPED_ATTESTATIONS.length}`,
  );

  const registryAfter = {
    events: getPathwayEvents().length,
    attestations: getPathwayAttestations().length,
  };
  record(
    "registry_untouched",
    `registry events ${registryBefore.events} to ${registryAfter.events}, attestations ${registryBefore.attestations} to ${registryAfter.attestations}`,
  );

  return { walked: true, stages };
}

/** The stages a rehearsal actually reached. Used by the test to catch a skip. */
export function signOffStagesReached(rehearsal: SignOffRehearsal): SignOffStage[] {
  return rehearsal.stages.map((s) => s.stage);
}

export interface RefusalDrive {
  /** How the scenario is arranged, in a sentence. */
  scenario: string;
  /** What `usablePathway` ACTUALLY said. Not asserted here — see the module note. */
  observed: PathwayRefusal | "usable" | "no_version";
}

/**
 * Every refusal, arranged and driven.
 *
 * TYPED `Record<PathwayRefusal, …>` ON PURPOSE: a refusal added to the union without a scenario
 * here is a compile error, so the both-directions check is the type system's rather than a list
 * somebody remembers to extend.
 *
 * Each entry records the reason the workflow gave rather than asserting the reason it expected.
 * A drive that checked its own expectation would report a pass when the scenario stopped
 * arranging what its name claims — the test compares, so a scenario that drifts shows up as the
 * wrong refusal instead of as green.
 */
export function driveEveryRefusal(): Record<PathwayRefusal, RefusalDrive> {
  const drive = (
    scenario: string,
    events: readonly PathwayEvent[],
    attestations: readonly PathwayAttestation[],
  ): RefusalDrive => {
    const version = versionFrom(events);
    if (!version) return { scenario, observed: "no_version" };
    const result = usablePathway(version, attestations);
    return { scenario, observed: result.usable ? "usable" : result.reason };
  };

  const withdrawnThenRepublished: readonly PathwayEvent[] = [
    DRAFT,
    PUBLISH,
    {
      pathwayId: SYNTHETIC_PATHWAY_ID,
      kind: "version_withdrawn",
      versionHash: SYNTHETIC_VERSION_HASH,
      at: AT.withdrawn,
      byEmail: FOUNDER,
      reason: "Withdrawn by the rehearsal so the walk can reach the post-withdrawal refusal.",
    },
    {
      pathwayId: SYNTHETIC_PATHWAY_ID,
      kind: "version_published",
      versionHash: SYNTHETIC_VERSION_HASH,
      at: AT.republished,
      byEmail: AUTHOR,
    },
  ];

  return {
    version_not_published: drive(
      "Drafted and never published. Sign-off says the content is acceptable; being in force is a different fact.",
      [DRAFT],
      [REVIEW, SIGN_OFF],
    ),
    not_reviewed: drive(
      "In force with no attestations against it at all, which is the state every version starts in.",
      [DRAFT, PUBLISH],
      [],
    ),
    not_signed_off: drive(
      "Reviewed by a specialist and waiting on the founder. One signature is not two.",
      [DRAFT, PUBLISH],
      [REVIEW],
    ),
    reviewer_was_the_author: drive(
      "The review is recorded by the person who drafted the version, so no second person looked.",
      [DRAFT, PUBLISH],
      [attest("specialist_review", AUTHOR, AT.reviewed), SIGN_OFF],
    ),
    signatory_was_the_reviewer: drive(
      "One person recorded both stages, collapsing two different questions into one.",
      [DRAFT, PUBLISH],
      [REVIEW, attest("founder_sign_off", REVIEWER, AT.signedOff)],
    ),
    sign_off_precedes_review: drive(
      "The sign-off is dated before the review it depends on, so it cannot have been informed by it.",
      [DRAFT, PUBLISH],
      [
        attest("specialist_review", REVIEWER, AT.signedOff),
        attest("founder_sign_off", FOUNDER, AT.reviewed),
      ],
    ),
    review_revoked: drive(
      "The only specialist review has been revoked, leaving a sign-off resting on nothing.",
      [DRAFT, PUBLISH],
      [attest("specialist_review", REVIEWER, AT.reviewed, AT.withdrawn), SIGN_OFF],
    ),
    sign_off_revoked: drive(
      "The review stands and the founder's sign-off has been revoked.",
      [DRAFT, PUBLISH],
      [REVIEW, attest("founder_sign_off", FOUNDER, AT.signedOff, AT.withdrawn)],
    ),
    attested_before_withdrawal: drive(
      "Signed off, withdrawn, then published again. The signatures predate the withdrawal, so they were made without knowing why it happened.",
      withdrawnThenRepublished,
      [REVIEW, SIGN_OFF],
    ),
  };
}

/**
 * What this rehearsal does NOT establish.
 *
 * Stated on the module because a green G5 rehearsal is exactly the thing somebody quotes as
 * "the sign-off process has been tested".
 */
export const WHAT_THIS_DOES_NOT_PROVE: readonly string[] = [
  "That anybody qualified has read any clinical content. The reviewer G5 waits for is a specialist reading real inclusion, exclusion and escalation criteria; the content here means nothing, so the walk exercises the recording of a review and not the reviewing.",
  "That the content a signed pathway would carry is safe. The workflow checks WHO signed and WHEN and never WHAT — deliberately, because judging criteria is clinical authorship and W120 and W121 both stop at the same line.",
  "That the blocked units become buildable. W161, W186, W249 and W251 wait on a ruling and on a specialist, not on a mechanism, and this shows the mechanism was the part that was never the obstacle.",
];

/**
 * Ways of writing this rehearsal that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather
 * than quietly weakening the walk.
 */
export const REFUSED_G5_REHEARSAL_SHAPES: Readonly<Record<string, string>> = {
  writing_plausible_clinical_criteria:
    "Making the fixture read like a real pathway so the rehearsal is convincing. That IS the act G5 withholds, performed by a builder with no standing to perform it and left in the tree with a sign-off recorded against it. The codes are `synthetic.fact.*`, and the rationales go through W121's clinical-vocabulary linter in the test rather than being trusted to be harmless.",
  seeding_the_registry:
    "Adding the walk's events to `src/pathways/registry.ts` so the console shows the rehearsal. The registry is what the sign-off dashboard reads, so this would put a signed-looking pathway on a real surface — and W127's whole point is that the dashboard's zero state and the product's real state are the same state. The walk carries its own arrays and the registry counts are a stage.",
  exporting_the_usable_pathway:
    "Returning the branded value the walk mints. `UsablePathway` is the type G5 exists to withhold, and a module that hands one back is a source of it reachable by an import from anywhere. The walk uses it at the one stage that needs it and drops it.",
  asserting_no_usable_pathway_can_exist:
    "Reading G5 as 'the brand must be unconstructible'. It is constructible, by the workflow, which is the point of having one — the gate is that `SHIPPED_PATHWAYS` and `SHIPPED_ATTESTATIONS` are empty, so nothing in the product has ever been through it. W56's shape: the loader enforces the gate, the values hold it.",
  stopping_at_the_first_refusal:
    "Driving `not_reviewed`, watching it fire, and calling the workflow exercised. There are nine refusals and they encode nine separate decisions about what a sign-off has to be — self-review, one person wearing both hats, a sign-off dated before its review, signatures that predate a withdrawal. Eight of those would never run.",
  asserting_the_refusals_inside_the_drive:
    "Letting each scenario assert the refusal it expects. A drive that checks its own expectation reports a pass when the scenario stops arranging what its name claims; recording what the workflow actually said means a scenario that drifts surfaces as the wrong refusal instead of as green.",
};

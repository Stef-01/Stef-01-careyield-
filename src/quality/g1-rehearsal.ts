// W262: the first connection, rehearsed while every credential is still refused.
//
// W261 wrote down what happens on the day G1 is answered. This DRIVES it — credential slot to
// first practice-scoped read — so the path is exercised rather than described, and the one thing
// it must not do is connect to anything.
//
// THE REFUSAL IS AN OBSERVATION, NOT A HALT, and that is the whole shape of this module. The
// obvious rehearsal asks the loader for a credential, gets `gate_not_ratified`, and stops —
// which proves the gate holds and proves NOTHING about the six steps after it. Those six are the
// ones that become the live path on the day the gate opens, and they are the ones nobody has
// driven end to end. So the loader's refusal is recorded as a stage outcome and the walk
// continues through the parts that do not need a credential, which is all of them: the console
// session resolves a practice, the scope model permits an endpoint, the dispatcher reads it, and
// the envelope stamps whose data it is.
//
// AND THE TEST FAILS IF A STEP WAS SKIPPED RATHER THAN EXERCISED. That is the gate's own wording
// and it decides the return type. A rehearsal that returns a boolean cannot tell "every stage
// ran and passed" from "stage two threw and the rest never happened" — both are a false, or worse,
// both are a true when the early return is the success path. So this returns a TRACE: each stage
// that ran appends what it observed, the test checks the trace against the declared stage list in
// both directions, and a stage that did not run is simply absent. Skipping becomes visible
// instead of becoming a pass.
//
// WHAT THE REHEARSAL CANNOT PROVE is stated rather than left to be assumed: that a real practice
// system answers. Nothing here contacts anything, so this is W237's argument at a different
// boundary — the harness proves the path is internally consistent and explicitly does not prove
// any real system accepts a call. The day G1 opens, that is still the first thing to find out.
//
// FOUNDER GATE (plan §4): G1 is unratified. `liveConnectionsPermitted()` is checked before the
// walk and again after it, because a rehearsal that left a switch flipped would be worse than no
// rehearsal.

import {
  CREDENTIAL_SLOTS,
  liveConnectionsPermitted,
  loadCredential,
} from "@/interop/credentials";
import { endpointFor } from "@/api/surface";
import { grantedScopes, permits } from "@/api/scopes";
import { readSafely } from "@/api/refusals";
import { activePracticeFor } from "@/console/store";

/**
 * The stages of a first connection, in the order they would happen.
 *
 * Declared as data so the trace can be checked against them in both directions — a stage the walk
 * never reaches is absent from the trace, and a trace naming a stage that is not declared fails
 * too.
 */
export type RehearsalStage =
  /** The tree declares it needs this connection at all. */
  | "credential_slot_declared"
  /** The loader refuses. Expected, recorded, and NOT the end of the walk. */
  | "credential_load_refused"
  /** The live-connection switch is off, checked before anything else runs. */
  | "live_connections_denied"
  /** A console session resolves to exactly one practice it is a member of. */
  | "session_resolved_to_practice"
  /** The scope model permits the endpoint for what that session is granted. */
  | "scope_permitted_endpoint"
  /** The endpoint reads, scoped to that practice as the query. */
  | "endpoint_read_scoped"
  /** The response says whose data it is. */
  | "response_envelope_stamped"
  /** The switch is still off afterwards. */
  | "live_connections_still_denied";

export const ALL_STAGES: readonly RehearsalStage[] = [
  "credential_slot_declared",
  "credential_load_refused",
  "live_connections_denied",
  "session_resolved_to_practice",
  "scope_permitted_endpoint",
  "endpoint_read_scoped",
  "response_envelope_stamped",
  "live_connections_still_denied",
];

export interface StageOutcome {
  stage: RehearsalStage;
  /** What the stage actually saw. A stage that observed nothing did not really run. */
  observed: string;
}

export type RehearsalRefusal =
  /** No console session for that email, so there is no practice to read for. */
  | "no_practice_for_session"
  /** The endpoint the rehearsal asks for is not declared. */
  | "unknown_endpoint";

export type Rehearsal =
  | { walked: true; stages: readonly StageOutcome[] }
  | { walked: false; refusal: RehearsalRefusal; stages: readonly StageOutcome[] };

export interface RehearsalInput {
  /** A console session's email. Membership is the grant — W166's rule, inherited. */
  email: string;
  /** Which endpoint to drive. Any declared one; the walk is the same for each. */
  endpointId: string;
  /** The practice cookie, which can narrow the choice and cannot widen it. */
  practicePreference?: string | null;
}

/**
 * Walk the whole path, recording what each stage saw.
 *
 * A REFUSAL PARTWAY THROUGH STILL RETURNS THE STAGES THAT RAN, so a caller can tell how far the
 * walk got. Returning only a failure would hide the difference between "stopped at stage one" and
 * "stopped at stage six", which is the difference between a gate holding and a path being broken.
 */
export function rehearseFirstConnection(input: RehearsalInput): Rehearsal {
  const stages: StageOutcome[] = [];
  const record = (stage: RehearsalStage, observed: string) => stages.push({ stage, observed });

  const slot = CREDENTIAL_SLOTS.find((s) => s.kind === "pms_read_api");
  if (slot) {
    record(
      "credential_slot_declared",
      `${slot.kind} for ${slot.system}, blocked by ${slot.blockedBy.join(" and ")}`,
    );
  }

  // The refusal is expected. It is recorded and the walk continues — see the module note.
  const load = loadCredential("pms_read_api", "a-well-formed-looking-value-that-is-never-read");
  if (!load.loaded) {
    record("credential_load_refused", `${load.refusal}; blocked by ${load.blockedBy.join(" and ")}`);
  }

  record("live_connections_denied", `liveConnectionsPermitted() = ${liveConnectionsPermitted()}`);

  const record_ = activePracticeFor(input.email, input.practicePreference ?? null);
  if (!record_) return { walked: false, refusal: "no_practice_for_session", stages };
  record("session_resolved_to_practice", `${input.email} acts for ${record_.practice.id}`);

  const endpoint = endpointFor(input.endpointId);
  if (!endpoint) return { walked: false, refusal: "unknown_endpoint", stages };

  const check = permits(endpoint, grantedScopes());
  if (!check.permitted) return { walked: false, refusal: "unknown_endpoint", stages };
  record("scope_permitted_endpoint", `${endpoint.id} permitted by ${check.scope}`);

  const outcome = readSafely(endpoint, { practiceId: record_.practice.id });
  if (!outcome.ok) return { walked: false, refusal: "unknown_endpoint", stages };
  record("endpoint_read_scoped", `${endpoint.id} read for ${record_.practice.id}`);

  record("response_envelope_stamped", `envelope names ${outcome.body.practiceId}`);
  record(
    "live_connections_still_denied",
    `liveConnectionsPermitted() = ${liveConnectionsPermitted()} after the walk`,
  );

  return { walked: true, stages };
}

/** The stages a rehearsal actually reached. Used by the test to catch a skip. */
export function stagesReached(rehearsal: Rehearsal): RehearsalStage[] {
  return rehearsal.stages.map((s) => s.stage);
}

/**
 * What this rehearsal does NOT establish.
 *
 * Stated on the module rather than left to a reader, because a green rehearsal is exactly the
 * thing somebody quotes as "the integration works".
 */
export const WHAT_THIS_DOES_NOT_PROVE: readonly string[] = [
  "That a real practice system answers. Nothing here contacts anything — there is no client, no endpoint and no network call in the walk — so this is W237's argument at another boundary: the path is internally consistent, and no real system has ever seen a byte of it.",
  "That the credential, once issued, is the right shape. The loader refuses before it looks at the value, on purpose, so the rehearsal exercises the refusal rather than any validation behind it.",
  "That a machine caller would be scoped correctly. A console session is granted every scope today, so the stage this walk exercises is the check running, not the check narrowing — W254 drives the narrowing directly, against the pure function.",
];

/**
 * Ways of writing this rehearsal that would prove less than it appears to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly shortening the walk.
 */
export const REFUSED_REHEARSAL_SHAPES: Readonly<Record<string, string>> = {
  stopping_at_the_refusal:
    "Ending the walk when the loader refuses. It proves the gate holds and proves nothing about the six stages after it — which are precisely the ones that become the live path on the day the gate opens, and the ones nobody has driven end to end. The refusal is recorded as an outcome and the walk continues.",
  returning_a_boolean:
    "Returning pass/fail instead of a trace. A boolean cannot tell 'every stage ran and passed' from 'stage two threw and the rest never happened', and on the worse reading an early return IS the success path. The trace makes a skipped stage absent rather than invisible.",
  a_stage_that_observes_nothing:
    "Recording a stage without what it saw. A stage whose `observed` is empty is a stage somebody added to the list rather than to the walk, and the test would then be counting names.",
  faking_the_credential:
    "Supplying a real-looking secret and asserting the walk reaches further. The loader refuses before it reads the value, so a real credential would change nothing — and putting one in a fixture is what W242's scanner exists to catch, as it did to W254.",
  leaving_a_switch_flipped:
    "Toggling `liveConnectionsPermitted` for the duration of the walk. A rehearsal that leaves a gate open is worse than no rehearsal, so the switch is checked before the walk and again after it, and both readings are stages in their own right.",
  claiming_the_integration_works:
    "Reading a green rehearsal as evidence that a real system accepts a call. `WHAT_THIS_DOES_NOT_PROVE` says so on the module, because that sentence is the one somebody will quote.",
};

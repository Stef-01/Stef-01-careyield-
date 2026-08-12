// W255: what the API says when it will not answer — and the branch W253 never wrote.
//
// THE FINDING, WHICH IS ABOUT MY OWN LAST UNIT. W253's dispatcher has three refusals and no error
// path at all: `endpoint.read(ctx)` is called bare. Every refusal it holds is a DELIBERATE one, so
// an endpoint that throws produces a response this product never wrote and never looked at — the
// framework's, whose body is a message somebody put in an `Error` for a developer to read. W242
// made exactly this point about credentials ("a defect of the ERROR PATH, which is the path nobody
// looks at until it runs") and the API shipped one unit later without one.
//
// That matters here more than in most places, because THE MESSAGE IN A THROWN ERROR IS WRITTEN
// FOR A DEVELOPER, and a developer writes `Patient ${id} not found`. Nobody reviews an exception
// message as an outbound disclosure, and on this surface it is one.
//
// SO THE READ IS WRAPPED AND THE ERROR IS DROPPED, NOT FORWARDED. `read_failed` carries a constant
// sentence. It says nothing about what went wrong, which is the trade this unit makes on purpose:
// a caller loses a diagnostic they were never entitled to, and the practice does not lose a
// patient identifier into somebody's logs. A refusal that quotes the exception is the same defect
// wearing a handler.
//
// EVERY REFUSAL BODY HAS ONE PRODUCER AND A CLOSED VOCABULARY. `refusalBody` is the only way to
// build one; the message is looked up from `API_REFUSAL_COPY` and is never assembled, never
// interpolated and never given the caller's input back. Reflection is how an error path leaks
// something it was never handed: echo the endpoint name and you have a mirror, echo the query and
// you have a bigger one.
//
// AND IT IS ASSERTED OVER EVERY BRANCH RATHER THAN SAMPLED, which is the gate's own word. The
// branches are declared here, checked against the dispatcher's source IN BOTH DIRECTIONS, and the
// scan runs over the union itself — so a refusal added by W254's scope model fails this suite
// until somebody drives it and shows what it says.
//
// FOUNDER GATE (plan §4): nothing here reads a patient record; the scan's markers are the shapes
// a patient identifier takes, and the fixtures that carry them are synthetic.

import {
  API_REFUSAL_COPY,
  API_REFUSAL_STATUS,
  apiResponse,
  type ApiEndpoint,
  type ApiRefusal,
  type ApiResponseBody,
  type ReadContext,
} from "./surface";
import { PERSON_REFERENCE_TERMS } from "@/privacy/automated-decisions";

/**
 * What a caller gets instead of data.
 *
 * Two fields, both closed: the refusal is a union member and the message is looked up. There is
 * nowhere here to put a detail, which is the point — a `detail` field is what an exception message
 * ends up in.
 */
export interface RefusalBody {
  refusal: ApiRefusal;
  message: string;
}

/** The only producer. Looked up, never assembled — see the module note about reflection. */
export function refusalBody(refusal: ApiRefusal): RefusalBody {
  return { refusal, message: API_REFUSAL_COPY[refusal] };
}

export function refusalResponse(refusal: ApiRefusal): Response {
  return Response.json(refusalBody(refusal), { status: API_REFUSAL_STATUS[refusal] });
}

/**
 * Read an endpoint, or refuse — and never forward what went wrong.
 *
 * THE BRANCH W253 DID NOT HAVE. The error is caught and dropped rather than described: its message
 * was written for a developer, and on this surface a developer's `Patient ${id} not found` is an
 * outbound disclosure nobody reviewed as one.
 */
export type ReadOutcome =
  | { ok: true; body: ApiResponseBody }
  | { ok: false; refusal: ApiRefusal };

/**
 * Returns the ENVELOPE rather than the raw data, so W253's one-envelope rule survives the wrap.
 * The dispatcher decides who; this decides whether there is an answer at all.
 */
export function readSafely(endpoint: ApiEndpoint, ctx: ReadContext): ReadOutcome {
  try {
    return { ok: true, body: apiResponse(endpoint, ctx) };
  } catch {
    // Deliberately no binding. A caught error that is not named cannot be logged into a response
    // by the next person to edit this function.
    return { ok: false, refusal: "read_failed" };
  }
}

/** One refusal, with what produces it and why a caller is told no more than this. */
export interface RefusalBranch {
  refusal: ApiRefusal;
  /** The condition, in the dispatcher's terms. */
  producedWhen: string;
  /** Why the message says what it says — and stops where it stops. */
  saysNoMore: string;
}

/**
 * Every branch, declared.
 *
 * Checked against the dispatcher's source in BOTH directions by this unit's test: a `refuse(...)`
 * call with no entry fails, and an entry with no call site is stale — which is the direction that
 * makes a register misleading rather than merely incomplete (W102's rule).
 */
export const REFUSAL_BRANCHES: readonly RefusalBranch[] = [
  {
    refusal: "no_session",
    producedWhen: "The session cookie is absent or does not verify.",
    saysNoMore:
      "It does not say whether the endpoint exists, whether any practice exists, or whether the caller was ever a member of one. An unauthenticated caller learns only that they are unauthenticated.",
  },
  {
    refusal: "no_practice",
    producedWhen: "The session verifies but the email is a member of no practice.",
    saysNoMore:
      "It does not name a practice, and it does not say whether the caller once belonged to one. A message that distinguished 'never a member' from 'removed' would be a fact about the practice's own staffing, disclosed to somebody who is not staff.",
  },
  {
    refusal: "unknown_endpoint",
    producedWhen: "The path segment matches no entry in the endpoint register.",
    saysNoMore:
      "It does not list what does exist and does not echo what was asked for. Echoing the segment back is a reflection, which is how an error path returns something it was never entitled to hold.",
  },
  {
    refusal: "read_failed",
    producedWhen: "An endpoint's read threw. W255's branch — W253 called `read` bare.",
    saysNoMore:
      "It says nothing at all about what went wrong. The exception's message was written for a developer, and a developer writes `Patient ${id} not found`; forwarding it puts an identifier in whatever reads the response. The caller loses a diagnostic they were never entitled to.",
  },
];

/**
 * The shapes a patient identifier takes in this tree, for the scan.
 *
 * The declared person-reference terms come from W201 rather than being re-listed, so a pseudonym
 * added there is scanned for here — W221's finding was that a privacy control and a transparency
 * register can hide something from each other, and this is the join.
 */
export const PATIENT_MARKERS: readonly RegExp[] = [
  /\bpat-[\w-]+/i,
  /\bpatient[\s_-]*id\b/i,
  ...Object.keys(PERSON_REFERENCE_TERMS).map((term) => new RegExp(`\\b${term}\\b`)),
  // A name-and-identifier pair is what an exception message looks like when it is helpful.
  /\bMRN\b|\bmedicare\b|\bdate of birth\b|\bdob\b/i,
];

/** Everything in `text` that looks like it identifies a person. Empty is the only passing answer. */
export function patientMarkersIn(text: string): string[] {
  return PATIENT_MARKERS.flatMap((pattern) => text.match(pattern) ?? []);
}

/**
 * Error-path behaviours this API refuses, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly adding a field to `RefusalBody`.
 */
export const REFUSED_ERROR_BEHAVIOURS: Readonly<Record<string, string>> = {
  forwarding_an_exception_message:
    "Putting `error.message` in the response. It is the single most likely way this surface discloses a patient, because an exception message is written for a developer and a helpful developer writes `Patient ${id} not found` — and nobody reviews an exception message as an outbound disclosure. `readSafely` does not even bind the caught error, so the next person to edit it has nothing to reach for.",
  a_detail_field:
    "Any `detail`, `cause`, `context` or `debug` field on `RefusalBody`. It would be empty on the day it was added and would hold an exception message within a quarter, because that is what such a field is for.",
  echoing_the_request:
    "Returning the endpoint segment, the query string or a header back to the caller. A reflection is how an error path returns something it was never entitled to hold, and it also turns a 404 into a probe that confirms what was asked.",
  distinguishing_absent_from_forbidden:
    "Answering 'no such practice' differently from 'not yours'. The difference is a fact about somebody else's practice, disclosed to somebody who is not in it — and it is the shape that makes an id enumerable.",
  logging_the_body_on_the_way_out:
    "Writing the response, the context or the caught error to a log from inside the handler. The refusal would be clean and the log would not, and a log is read by more people than a response.",
  a_stack_trace_in_any_environment:
    "Returning a stack in development because it is convenient. Development is where synthetic data lives today and where a real extract lands the first time somebody debugs with one, and an environment check is a control that fails open.",
};

// W253: a read-only platform API, where a practice cannot be named from outside.
//
// Y4-1 was the console rendering `getComplaints()` — the whole store — to whichever practice was
// signed in. The fix was `complaintsFor(practiceId)`, filtered as the query. That fix is right and
// IT IS NOT ENOUGH FOR AN API, because a page gets its practice id from the session and an
// endpoint is asked for one by a stranger. `GET /api/v1/capacity?practiceId=prac-2` is Y4-1 again
// with somebody choosing the id rather than nobody supplying it, and every scoped read in the tree
// would answer it correctly and disclosingly.
//
// SO THE PRACTICE IS NOT A PARAMETER. A reader here is handed a `ReadContext` whose only field is
// the practice id, and it never sees the request — there is no `Request`, no `searchParams`, no
// header and no body anywhere a reader could reach. That is not a rule about writing handlers; it
// is the type. A handler that wanted to honour `?practiceId=` has nothing to read it from.
//
// AND THERE IS ONE DOOR. Every endpoint is dispatched by a single route file, which resolves the
// practice from the session and calls `read`. You cannot add an unscoped endpoint to this API
// because there is nowhere to put one: a test counts the route files under the API root and fails
// on a second. W102's census catches a route nobody declared; this makes the route that would need
// declaring impossible to write.
//
// THE Y4-1 ASSERTION, DONE THE WAY IT SHOULD HAVE BEEN. The thing that let Y4-1 sit for two years
// is that `intakeComplaint` stamped a literal `"prac-console"` no console ever minted, so every
// complaint belonged to nobody — AND A TEST ASSERTING "PRACTICE A SEES NONE OF PRACTICE B'S
// COMPLAINTS" WOULD HAVE PASSED, over an empty set, for the wrong reason. Exclusion alone is
// vacuous. So the test here requires both directions over a world where BOTH practices have data:
// A's payload must exclude B's, B's must include B's, and the suite fails if no endpoint
// distinguishes them at all.
//
// READ-ONLY IS STRUCTURAL TOO. An `ApiEndpoint` has a `read` and no other verb, the route module
// exports `GET` and nothing else, and a test scans for the other methods rather than trusting the
// register. A write endpoint on a surface reached by a credential is W254's and W255's problem to
// have, not one to leave a door open for.
//
// FOUNDER GATES (plan §4): no credential and no authentication of a machine caller — the practice
// resolves from the console session that already exists, and W254 owns scopes and keys behind G1.
// Nothing here is a public surface; W192's sweep governs those and this is not one.

import type { PracticeId } from "@/domain/types";
import { capacityConsoleView } from "@/capacity/console";
import { sessionsFrom } from "@/capacity/model";
import { interopConsoleView } from "@/interop/console";
import { practiceRecord } from "@/console/store";
import { getSimResult } from "@/sim/dashboard-data";

/** The version segment. One, and it is in the path so a second cannot arrive by accident. */
export const API_VERSION = "v1";

/** Where the single dispatch route lives. Read by the test that counts the doors. */
export const API_ROUTE_ROOT = `app/api/${API_VERSION}`;

/**
 * Everything a reader is given.
 *
 * ONE FIELD, AND NO REQUEST. This is the unit: a reader that cannot see the request cannot honour
 * a practice named in it, so `?practiceId=` is not a thing to remember to ignore — it is a thing
 * with nowhere to be read. W213's shape, where a lossy projection is what makes a property
 * structural rather than observed.
 */
export interface ReadContext {
  readonly practiceId: PracticeId;
}

export interface ApiEndpoint {
  /** The URL segment, and the id in this register. */
  id: string;
  /** What a practice gets, in one line, for whoever is deciding whether to call it. */
  summary: string;
  /**
   * The read. Takes the context and nothing else.
   *
   * There is deliberately no `write`, no `mutate` and no second verb on this type: read-only is
   * the shape of the register rather than a promise in its documentation.
   */
  read: (ctx: ReadContext) => unknown;
}

/**
 * The practice's own record, projected.
 *
 * Explicitly built rather than spread, because `PracticeRecord` grows and a spread would export
 * whatever it grew. W213's lesson again: the projection is the control.
 */
function practiceSummary(ctx: ReadContext) {
  const record = practiceRecord(ctx.practiceId);
  if (!record) return { practiceId: ctx.practiceId, known: false as const };
  return {
    practiceId: record.practice.id,
    name: record.practice.name,
    known: true as const,
    clinicians: record.clinicians.length,
  };
}

export const API_ENDPOINTS: readonly ApiEndpoint[] = [
  {
    id: "practice",
    summary: "The practice this call is for: its id, its name and how many clinicians it has.",
    read: practiceSummary,
  },
  {
    id: "capacity",
    summary:
      "What this practice's own diary recorded, per session — the same readings as the capacity console, including the sessions the record cannot answer for.",
    // Practice-scoped as the QUERY, at the point the appointments are read — W123's rule, and the
    // reason this is a call into W222 rather than a filter over its result.
    read: (ctx) => capacityConsoleView(sessionsFrom(getSimResult().appointments, ctx.practiceId)),
  },
  {
    id: "interop",
    summary:
      "What has left this practice for another system, and what happened to each — including the statement that nothing has been attempted.",
    read: (ctx) => interopConsoleView(ctx.practiceId),
  },
];

/**
 * What a caller actually receives.
 *
 * THE ENVELOPE STAMPS THE PRACTICE, and that is W227's rule rather than a convenience: a payload
 * that does not say which practice it is for is an answer without its basis, and it gets cached,
 * forwarded and pasted into a ticket exactly like one that does. It also means the both-directions
 * cross-practice test has something universal to assert over — `capacityConsoleView` answers for a
 * practice without naming one, which is right for a view-model and would have left the test
 * checking exclusion alone. That is the vacuous half of Y4-1.
 *
 * Built here rather than in the route so there is one envelope as well as one door.
 */
export interface ApiResponseBody {
  endpoint: string;
  practiceId: PracticeId;
  data: unknown;
}

export function apiResponse(endpoint: ApiEndpoint, ctx: ReadContext): ApiResponseBody {
  return { endpoint: endpoint.id, practiceId: ctx.practiceId, data: endpoint.read(ctx) };
}

export function endpointFor(id: string): ApiEndpoint | null {
  return API_ENDPOINTS.find((endpoint) => endpoint.id === id) ?? null;
}

export type ApiRefusal =
  /** No signed-in session. There is no practice to answer for, so nothing is read. */
  | "no_session"
  /** A session, but it belongs to no practice. */
  | "no_practice"
  /** No endpoint by that name. */
  | "unknown_endpoint";

/**
 * What each refusal says.
 *
 * Deliberately uniform in what they DO NOT say: none of them reveals whether a practice, an
 * endpoint or a record exists beyond what the caller already has access to. W255 owns refusal
 * semantics properly; this is the shape that does not have to be walked back.
 */
export const API_REFUSAL_COPY: Record<ApiRefusal, string> = {
  no_session:
    "This call is not signed in. Nothing was read and nothing is being said about whether any practice or record exists.",
  no_practice:
    "This session does not act for a practice. Nothing was read.",
  unknown_endpoint: "There is no such endpoint in this version of the API.",
};

export const API_REFUSAL_STATUS: Record<ApiRefusal, number> = {
  no_session: 401,
  no_practice: 404,
  unknown_endpoint: 404,
};

/**
 * Shapes this API refuses, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit has to DELETE a stated refusal
 * rather than quietly add a parameter.
 */
export const REFUSED_API_SHAPES: Readonly<Record<string, string>> = {
  a_practice_parameter:
    "Any way of naming a practice in a request — `?practiceId=`, a body field, an `X-Practice-Id` header. It is Y4-1 with somebody CHOOSING the id rather than nobody supplying it, and every correctly scoped read in this tree would answer it correctly and disclosingly. `ReadContext` is the refusal: a reader has no request to read one from.",
  a_second_route_file:
    "A route under the API root that is not the dispatcher. One door is what makes practice resolution unskippable; two doors means the second one has to remember, and the whole class of finding behind PRIV-3 is things that had to be remembered.",
  any_write_verb:
    "A POST, PUT, PATCH or DELETE on this surface. An `ApiEndpoint` has a `read` and no other verb, so a write would need a new field on the type — which is a visible edit rather than an export appearing in a route file.",
  an_unfiltered_store_read:
    "Reading a whole store and filtering the result. W123's rule and Y4-1's fix note: the practice is the query. A filter applied afterwards is one refactor away from being dropped, and the version that drops it looks like a simplification.",
  spreading_a_record_into_a_response:
    "Returning `{ ...record }` for anything. The record grows, and a spread exports whatever it grew — which is how a field nobody meant to publish is published by a commit that did not touch this file.",
  an_exclusion_only_test:
    "Proving practice A cannot see practice B's data without proving B HAS any. That is the test Y4-1 would have passed for two years: the writer stamped an id no console ever minted, so every record belonged to nobody and every exclusion assertion held over an empty set.",
};

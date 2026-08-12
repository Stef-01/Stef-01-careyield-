// W253: the one door.
//
// Every endpoint in the platform API is dispatched here. That is the whole security argument: the
// practice is resolved ONCE, from the session, and a reader is handed a `ReadContext` that has no
// request in it — so an endpoint cannot honour a practice named by the caller, because it has
// nowhere to read one from.
//
// The `Request` is deliberately unused and deliberately not passed on. It is the only place in
// this API where a query string exists, and it stops here.
//
// GET and nothing else. A test scans this module for the other verbs rather than trusting the
// register, because an exported `POST` is one line and reads like an addition rather than a
// change of posture.

import { cookies } from "next/headers";
import { endpointFor, type ApiRefusal } from "@/api/surface";
import { grantedScopes, permits } from "@/api/scopes";
import { readSafely, refusalResponse } from "@/api/refusals";
import { SESSION_COOKIE, verifySession } from "@/console/session";
import { activePracticeFor } from "@/console/store";
import { PRACTICE_COOKIE } from "../../../console/guard";

export const dynamic = "force-dynamic";

// W255: one producer, so no branch can assemble its own body. The dispatcher decides WHICH
// refusal; it never decides what a refusal says.
function refuse(refusal: ApiRefusal): Response {
  return refusalResponse(refusal);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ endpoint: string }> },
): Promise<Response> {
  // `_request` is not read, and is not passed to anything below. See the module note.
  const jar = await cookies();
  const email = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!email) return refuse("no_session");

  // Membership is the grant and the cookie is only a preference — `activePracticeFor` honours it
  // only when the email is already a member, so a tampered cookie picks among practices the caller
  // already has and nothing else (W166's rule, inherited rather than restated).
  const record = activePracticeFor(email, jar.get(PRACTICE_COOKIE)?.value ?? null);
  if (!record) return refuse("no_practice");

  const { endpoint: id } = await params;
  const endpoint = endpointFor(id);
  if (!endpoint) return refuse("unknown_endpoint");

  // W254: the scope model is CONSULTED rather than merely declared — a register nobody calls is
  // documentation that reads as a control in an audit. A console session is granted every scope
  // (see `grantedScopes`), so this passes today and is the line that stops passing when a token
  // exists.
  if (!permits(endpoint, grantedScopes()).permitted) return refuse("insufficient_scope");

  // W255: the read is wrapped. W253 called it bare, so a throwing endpoint produced a response
  // this product never wrote — and an exception message is written for a developer.
  // The envelope is still built in `surface.ts` — `readSafely` wraps that call rather than
  // replacing it, so the route decides WHO and never what an answer or a refusal looks like.
  const outcome = readSafely(endpoint, { practiceId: record.practice.id });
  return outcome.ok ? Response.json(outcome.body) : refuse(outcome.refusal);
}

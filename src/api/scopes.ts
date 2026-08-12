// W254: what a token would be allowed to read — and why granting is the dangerous direction.
//
// W253 built the endpoints and resolves the practice from a console session. That is the right
// shape for a person signed into the console and it is not an API credential, so this unit models
// what a MACHINE caller would be permitted to read, ahead of there being one. G1 blocks the
// credential (W242), so nothing here is enforced against a token today — which is exactly when to
// decide it, rather than while somebody is waiting for an integration to work.
//
// THE HAZARD IS NOT A SCOPE THAT IS TOO WIDE ON THE DAY IT IS WRITTEN. Somebody notices that. The
// hazard is that A SCOPE GRANTS RETROACTIVELY: a token issued last year for `read:capacity` gains
// whatever endpoint is added to that scope tomorrow, and nobody re-consents, nobody is told, and
// the widening looks like adding a feature. It is W243's finding in another costume — a consent to
// a CLASS covers whatever later joins the class — and it is worse here because a token holder is
// not a patient somebody would think to ask.
//
// SO A SCOPE'S MEMBERSHIP IS DECLARED, PINNED AND CHECKED BOTH WAYS. Each scope lists its
// endpoints; the register is checked against the endpoint census in both directions, so an
// endpoint with no scope fails and a scope naming an endpoint that does not exist fails. And the
// membership is pinned by its own test, so adding an endpoint to an existing scope is not a
// one-line edit that passes — it fails until somebody writes down that every existing token just
// got wider.
//
// NO PRODUCTION CREDENTIAL ENTERS THE TREE, and the control is the LOADER rather than the
// emptiness — W242's shape, reused rather than restated. `issueToken` refuses on G1 before it
// looks at anything, so a list of tokens filling up would change nothing. W242's own literal
// scanner already sweeps `src/` and `app/` for pasted secrets; this unit adds no second scanner
// and instead asserts the first one covers this module.
//
// SCOPES ARE NOT ENFORCED AGAINST ANYTHING YET, AND THAT IS SAID RATHER THAN IMPLIED. A console
// session is a member of the practice reading their own practice's data, so it is granted every
// scope — `grantedScopes` says so in one place with the reason. `insufficient_scope` is a real
// branch with a real check, driven in this unit's tests; it cannot be provoked over HTTP until a
// token exists, which is recorded in W255's branch register rather than left for somebody to
// discover.
//
// FOUNDER GATE (plan §4): G1 is unratified. No token is issued, no key is stored, no scope is
// granted to any machine, and there is no environment variable that changes that.

import { BLOCKING_GATE } from "@/interop/credentials";
import { API_ENDPOINTS, type ApiEndpoint } from "./surface";

/**
 * A scope a token could carry.
 *
 * Read-only by construction: every name begins `read:`, and a test asserts it, because the surface
 * has no write and a `write:` scope would be the first sign that somebody is planning one.
 */
export type ApiScope = "read:practice" | "read:capacity" | "read:interop";

export interface ScopeDefinition {
  scope: ApiScope;
  /** What a holder may read, in the words somebody granting it would need. */
  grants: string;
  /**
   * The endpoints this scope reaches, exhaustively.
   *
   * Pinned by a test. Adding an endpoint here widens every token already issued for this scope,
   * retroactively and silently — so the pin makes it a failure rather than a one-line edit.
   */
  endpoints: readonly string[];
}

export const SCOPE_DEFINITIONS: readonly ScopeDefinition[] = [
  {
    scope: "read:practice",
    grants: "The practice's own identity: its id, its name and how many clinicians it has.",
    endpoints: ["practice"],
  },
  {
    scope: "read:capacity",
    grants:
      "What the practice's own diary recorded per session, including the sessions the record cannot answer for.",
    endpoints: ["capacity"],
  },
  {
    scope: "read:interop",
    grants:
      "What has left the practice for another system and what happened to each, including the statement that nothing has been attempted.",
    endpoints: ["interop"],
  },
];

export const ALL_SCOPES: readonly ApiScope[] = SCOPE_DEFINITIONS.map((d) => d.scope);

/**
 * The scope an endpoint requires, derived from the register rather than declared twice.
 *
 * Returns null when no scope reaches it, which the census test turns into a failure — an endpoint
 * outside every scope is one that either cannot be reached or is reached without one, and both are
 * worth failing a build over.
 */
export function scopeFor(endpoint: ApiEndpoint | string): ApiScope | null {
  const id = typeof endpoint === "string" ? endpoint : endpoint.id;
  return SCOPE_DEFINITIONS.find((d) => d.endpoints.includes(id))?.scope ?? null;
}

/** Endpoints a set of scopes reaches. The other direction, for a token holder's own listing. */
export function endpointsFor(scopes: readonly ApiScope[]): string[] {
  return SCOPE_DEFINITIONS.filter((d) => scopes.includes(d.scope))
    .flatMap((d) => d.endpoints)
    .sort();
}

export type ScopeCheck =
  | { permitted: true; scope: ApiScope }
  /** The endpoint is outside every granted scope. `required` is null when nothing reaches it. */
  | { permitted: false; required: ApiScope | null };

/**
 * May this caller read this endpoint.
 *
 * Pure and total, so it can be driven both ways by a test rather than only in the direction that
 * happens to occur — which matters because today it is never called with a narrow grant.
 */
export function permits(endpoint: ApiEndpoint | string, granted: readonly ApiScope[]): ScopeCheck {
  const required = scopeFor(endpoint);
  if (required === null) return { permitted: false, required: null };
  return granted.includes(required)
    ? { permitted: true, scope: required }
    : { permitted: false, required };
}

/**
 * What a console session is granted: everything.
 *
 * SAID IN ONE PLACE, WITH THE REASON, rather than left as an absence somebody later reads as an
 * oversight. A console session is a member of the practice reading their own practice's data, and
 * the scopes exist to constrain a MACHINE caller — which does not exist, because G1 blocks the
 * credential. The day a token exists this function is where it stops being every scope, and it
 * takes no argument today precisely so that change is visible.
 */
export function grantedScopes(): readonly ApiScope[] {
  return ALL_SCOPES;
}

export type TokenRefusal = "gate_not_ratified";

export const TOKEN_REFUSAL_COPY: Record<TokenRefusal, string> = {
  gate_not_ratified:
    "No API token can be issued. Giving a machine its own way into this product is a founder decision that has not been taken, and the refusal is this function's rather than a consequence of any list being empty.",
};

export type TokenResult = { issued: false; refusal: TokenRefusal; blockedBy: readonly string[] };

/**
 * Issue a token. Always refuses.
 *
 * W242's shape, reused rather than restated: the LOADER refuses, before it looks at what was
 * asked for, so the guarantee does not rest on a list having no rows. The requested scopes are
 * accepted and never read — their presence is what makes the refusal a statement about the GATE
 * rather than about a missing argument.
 */
export function issueToken(requestedScopes: readonly ApiScope[] = []): TokenResult {
  void requestedScopes;
  return { issued: false, refusal: "gate_not_ratified", blockedBy: [BLOCKING_GATE] };
}

/** Tokens this tree holds. `never[]`, so there is no shape a value could take here. */
export const SHIPPED_TOKENS: readonly never[] = [];

/**
 * Scope shapes this unit refuses, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly adding an endpoint to a scope.
 */
export const REFUSED_SCOPE_SHAPES: Readonly<Record<string, string>> = {
  a_scope_that_grows:
    "Adding an endpoint to an existing scope. IT IS RETROACTIVE: every token already issued for that scope reaches the new endpoint from the moment it is deployed, nobody re-consents and nobody is told, and the widening reads as adding a feature. It is W243's finding in another costume — a consent to a CLASS covers whatever later joins the class — and it is worse here, because a token holder is not somebody anybody would think to ask. The membership pin makes it a build failure instead.",
  a_wildcard_scope:
    "Any `read:*`, `api:all` or admin scope. A scope whose membership is a pattern cannot be pinned, so the widening above becomes invisible again — and the value of a scope is entirely in a grantor being able to read what it covers.",
  a_write_scope:
    "Any `write:` scope. The surface has no write verb (W253), so a write scope would be a grant with nothing behind it — and the first sign that somebody is planning one. Every scope name is asserted to begin `read:`.",
  inferring_scope_from_the_endpoint_name:
    "Deriving the required scope by string-munging the path. It agrees with the register on the day it is written and diverges the first time an endpoint is renamed, silently, in the direction of granting.",
  an_environment_variable_that_issues_tokens:
    "Letting a deployment setting mint a credential. G1 is a founder decision, and a decision that can be taken by a deployment setting is one that will be. `issueToken` refuses before it reads its argument.",
  scopes_that_are_declared_but_not_checked:
    "Shipping the register without `permits` being called anywhere. A scope model nobody consults is documentation, and it is the kind that reads as a control in an audit.",
};

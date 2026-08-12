// W254 verify gate: "scopes are declared data checked against the endpoint census in both
// directions; no production credential enters the tree."
//
// BOTH DIRECTIONS is the instruction and it is doing two jobs here. The ordinary one: an endpoint
// with no scope fails, and a scope naming an endpoint that does not exist fails. The one this unit
// is actually about: THE MEMBERSHIP OF EACH SCOPE IS PINNED, because adding an endpoint to an
// existing scope widens every token already issued for it — retroactively, silently, and looking
// like a feature. A census that only checked coverage would pass that edit happily.
//
// The credential half reuses W242 rather than restating it: `issueToken` refuses before it reads
// its argument, so the guarantee is the loader's and not the empty list's, and W242's own literal
// scanner is asserted to reach this module instead of a second scanner being written for it.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_SCOPES,
  REFUSED_SCOPE_SHAPES,
  SCOPE_DEFINITIONS,
  SHIPPED_TOKENS,
  TOKEN_REFUSAL_COPY,
  endpointsFor,
  grantedScopes,
  issueToken,
  permits,
  scopeFor,
  type ApiScope,
} from "./scopes";
import { API_ENDPOINTS, API_REFUSAL_COPY, API_ROUTE_ROOT } from "./surface";
import { REFUSAL_BRANCHES } from "./refusals";
import { BLOCKING_GATE, credentialShapedLiterals } from "@/interop/credentials";

const ROOT = process.cwd();
const SCOPES_SOURCE = readFileSync(path.join(ROOT, "src", "api", "scopes.ts"), "utf8");
const ROUTE_SOURCE = readFileSync(
  path.join(ROOT, API_ROUTE_ROOT, "[endpoint]", "route.ts"),
  "utf8",
);

const ENDPOINT_IDS = API_ENDPOINTS.map((e) => e.id).sort();

describe("W254 the register is checked against the endpoint census, both directions", () => {
  it("reaches every endpoint exactly once", () => {
    // An endpoint outside every scope either cannot be reached or is reached without one, and both
    // are worth failing a build over.
    const covered = SCOPE_DEFINITIONS.flatMap((d) => d.endpoints).sort();
    expect(covered).toEqual(ENDPOINT_IDS);
    expect(new Set(covered).size, "an endpoint is in two scopes").toBe(covered.length);
    for (const endpoint of API_ENDPOINTS) {
      expect(scopeFor(endpoint), `${endpoint.id} has no scope`).not.toBeNull();
    }
  });

  it("names no endpoint that does not exist", () => {
    // The stale direction — the one that makes a register misleading rather than incomplete.
    const known = new Set(ENDPOINT_IDS);
    for (const definition of SCOPE_DEFINITIONS) {
      for (const id of definition.endpoints) {
        expect(known.has(id), `${definition.scope} names ${id}, which is not an endpoint`).toBe(true);
      }
    }
  });

  it("PINS the membership of every scope, so a scope cannot grow quietly", () => {
    // THE ASSERTION THIS UNIT EXISTS FOR. Adding an endpoint to an existing scope widens every
    // token already issued for it — retroactively, with nobody re-consenting and nobody told, and
    // the edit reads as adding a feature. A coverage-only census would pass it. This does not.
    expect(
      SCOPE_DEFINITIONS.map((d) => [d.scope, [...d.endpoints].sort()] as const),
    ).toEqual([
      ["read:practice", ["practice"]],
      ["read:capacity", ["capacity"]],
      ["read:interop", ["interop"]],
    ]);
    expect(REFUSED_SCOPE_SHAPES.a_scope_that_grows).toContain("RETROACTIVE");
  });

  it("gives every scope a grant sentence somebody could read before granting it", () => {
    expect(ALL_SCOPES).toHaveLength(SCOPE_DEFINITIONS.length);
    expect(new Set(ALL_SCOPES).size).toBe(ALL_SCOPES.length);
    for (const definition of SCOPE_DEFINITIONS) {
      expect(definition.grants.length, definition.scope).toBeGreaterThan(40);
      expect(definition.endpoints.length, `${definition.scope} reaches nothing`).toBeGreaterThan(0);
    }
  });

  it("is read-only in its names, because the surface has no write verb", () => {
    for (const scope of ALL_SCOPES) {
      expect(scope, `${scope} is not a read scope`).toMatch(/^read:[a-z-]+$/);
    }
    // SCANNED OVER THE UNION DECLARATION, not the whole file. My first version scanned the source
    // and failed against `REFUSED_SCOPE_SHAPES`, whose prose quotes `write:` and `read:*` in order
    // to forbid them — W198's collision, the eighth instance in this tree, and the register is the
    // sentence so the scan is what has to move. The declaration is where a scope name can only be
    // a scope name.
    const union = SCOPES_SOURCE.match(/export type ApiScope =[\s\S]*?;/)![0];
    expect(union).toContain("read:practice");
    expect(union).not.toMatch(/write:|admin|api:all|read:\*/);
  });
});

describe("W254 the check itself, driven both ways", () => {
  it("permits an endpoint the caller's scopes reach", () => {
    expect(permits("capacity", ["read:capacity"])).toEqual({
      permitted: true,
      scope: "read:capacity",
    });
  });

  it("refuses an endpoint outside the granted scopes, and says which would reach it", () => {
    // Driven here because it cannot be provoked over HTTP: a console session is granted every
    // scope and no token exists. A branch never exercised is a branch that is wrong the first time
    // it runs — and this is the one that will run on the day G1 is ratified.
    expect(permits("capacity", ["read:practice"])).toEqual({
      permitted: false,
      required: "read:capacity",
    });
    expect(permits("capacity", [])).toEqual({ permitted: false, required: "read:capacity" });
  });

  it("refuses an endpoint no scope reaches at all, distinctly", () => {
    // `required: null` rather than a scope name — an endpoint outside the register is not a
    // permissions problem the caller can fix by asking for another scope.
    expect(permits("not-an-endpoint", ALL_SCOPES)).toEqual({ permitted: false, required: null });
  });

  it("lists the endpoints a scope set reaches, the other direction", () => {
    expect(endpointsFor(["read:practice", "read:interop"])).toEqual(["interop", "practice"]);
    expect(endpointsFor([])).toEqual([]);
    expect(endpointsFor(ALL_SCOPES)).toEqual(ENDPOINT_IDS);
  });

  it("grants a console session every scope, in one place and with the reason", () => {
    // Said rather than left as an absence somebody later reads as an oversight. A console session
    // is a member of the practice reading their own practice's data; the scopes constrain a
    // machine caller, which does not exist.
    expect([...grantedScopes()].sort()).toEqual([...ALL_SCOPES].sort());
    expect(grantedScopes.length, "grantedScopes took an argument").toBe(0);
    expect(SCOPES_SOURCE).toContain("A console session is a member of the practice");
  });

  it("is CONSULTED by the dispatcher rather than merely declared", () => {
    // A scope model nobody calls is documentation, and it is the kind that reads as a control in
    // an audit. `scopes_that_are_declared_but_not_checked` is a stated refusal.
    expect(ROUTE_SOURCE).toContain("permits(endpoint, grantedScopes())");
    expect(ROUTE_SOURCE).toContain('refuse("insufficient_scope")');
  });

  it("derives the required scope from the register rather than from the endpoint name", () => {
    // String-munging agrees with the register on the day it is written and diverges the first time
    // an endpoint is renamed — silently, in the direction of granting.
    expect(SCOPES_SOURCE).not.toMatch(/`read:\$\{/);
    expect(scopeFor("practice")).toBe("read:practice");
  });
});

describe("W254 the refusal is declared where W255 counts branches", () => {
  it("appears in W255's branch register with its unreachability recorded", () => {
    // The designed interaction: W255's census fails on a refusal nobody described, and this is the
    // refusal W255 said would arrive.
    const branch = REFUSAL_BRANCHES.find((b) => b.refusal === "insufficient_scope");
    expect(branch, "insufficient_scope is not in W255's register").toBeDefined();
    expect(branch!.producedWhen).toContain("Not reachable over HTTP today");
    expect(branch!.saysNoMore).toContain("does not name the scope");
    expect(API_REFUSAL_COPY.insufficient_scope).not.toMatch(/read:/);
  });
});

describe("W254 no production credential enters the tree", () => {
  it("refuses to issue a token, before it reads what was asked for", () => {
    // W242's shape reused: the LOADER refuses, so the guarantee is not the empty list's — filling
    // `SHIPPED_TOKENS` would change nothing.
    const result = issueToken(["read:practice", "read:capacity"]);
    expect(result.issued).toBe(false);
    expect(result.refusal).toBe("gate_not_ratified");
    expect(result.blockedBy).toEqual([BLOCKING_GATE]);
    expect(TOKEN_REFUSAL_COPY.gate_not_ratified).toContain("founder decision");
  });

  it("returns the same refusal for a nonsense request, so it is no scope oracle", () => {
    const nonsense = issueToken(["read:everything" as ApiScope]);
    expect(nonsense).toEqual(issueToken(["read:practice"]));
    expect(JSON.stringify(nonsense)).not.toContain("read:everything");
  });

  it("holds no token, and has no shape a token could take", () => {
    expect(SHIPPED_TOKENS).toEqual([]);
    expect(SCOPES_SOURCE).toContain("readonly never[]");
  });

  it("has no credential-shaped literal, checked with W242's own scanner", () => {
    // No second scanner: W242's already sweeps `src/` and `app/`, and a scanner aimed only at the
    // module that talks about credentials is aimed where one is least likely to be.
    expect(credentialShapedLiterals("src/api/scopes.ts", SCOPES_SOURCE)).toEqual([]);
    expect(credentialShapedLiterals("route.ts", ROUTE_SOURCE)).toEqual([]);
    // The scanner fires on a real one, so a clean result means something.
    //
    // ASSEMBLED FROM FRAGMENTS, and the reason is that my first version wrote the fixture as a
    // literal — which W242's own tree-wide sweep then found in THIS FILE and failed the build on.
    // The scanner was right: it sweeps `src/` and `app/` including tests, because a pasted secret
    // goes wherever somebody was working. So the fixture is built the way W153 and W167 build
    // theirs, out of pieces that are only a credential once joined.
    const fakeName = ["api", "Key"].join("");
    const fakeSecret = ["sk", "live", "0123456789abcdefghijklmn"].join("-");
    expect(
      credentialShapedLiterals("fixture.ts", `const ${fakeName} = ${JSON.stringify(fakeSecret)};`),
    ).not.toEqual([]);
  });

  it("cannot be switched on by a deployment setting", () => {
    // G1 is a founder decision, and a decision a deployment setting can take is one it will take.
    expect(SCOPES_SOURCE).not.toMatch(/process\.env|NODE_ENV/);
    expect(issueToken.length, "issueToken can be told to succeed").toBeLessThanOrEqual(1);
  });

  it("names the six scope shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_SCOPE_SHAPES).sort()).toEqual([
      "a_scope_that_grows",
      "a_wildcard_scope",
      "a_write_scope",
      "an_environment_variable_that_issues_tokens",
      "inferring_scope_from_the_endpoint_name",
      "scopes_that_are_declared_but_not_checked",
    ]);
    for (const [name, why] of Object.entries(REFUSED_SCOPE_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_SCOPE_SHAPES.a_scope_that_grows).toContain("W243");
  });
});

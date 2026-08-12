// W253 verify gate: "every endpoint takes a practice as the QUERY (W123's rule); no endpoint can
// return cross-practice data, asserted the way Y4-1 should have been."
//
// THE SECOND CLAUSE IS THE INSTRUCTION, AND IT IS ABOUT HOW TO ASSERT RATHER THAN WHAT. Y4-1 sat
// for two years partly because the writer stamped `"prac-console"`, an id no console ever minted,
// so every complaint belonged to nobody — and a test asserting "practice A sees none of practice
// B's complaints" WOULD HAVE PASSED, over an empty set, for the wrong reason. Exclusion alone is
// vacuous.
//
// So the cross-practice test below does three things rather than one: A's payload excludes B's
// marker, B's payload CONTAINS B's marker, and the suite fails outright if no endpoint
// distinguishes the two practices at all. The third is the guard the original never had.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  API_ENDPOINTS,
  API_REFUSAL_COPY,
  API_REFUSAL_STATUS,
  API_ROUTE_ROOT,
  API_VERSION,
  REFUSED_API_SHAPES,
  apiResponse,
  endpointFor,
  type ApiEndpoint,
  type ReadContext,
} from "./surface";
import { onboardPractice, resetConsole } from "@/console/store";
import type { PracticeId } from "@/domain/types";

const ROOT = process.cwd();
const ROUTE_DIR = path.join(ROOT, API_ROUTE_ROOT);
const SURFACE_SOURCE = readFileSync(path.join(ROOT, "src", "api", "surface.ts"), "utf8");

const routeFiles = (): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "route.ts" || entry === "route.tsx") out.push(full);
    }
  };
  walk(ROUTE_DIR);
  return out.sort();
};

const routeSource = (): string => readFileSync(routeFiles()[0]!, "utf8");

const A = "prac-1" as PracticeId;
const B = "prac-2" as PracticeId;

/** Two practices that BOTH have data. The whole point — see the file note. */
beforeEach(() => {
  resetConsole();
  const first = onboardPractice(
    { name: "Alpha Family Practice", timezone: "Australia/Sydney", holdoutPercent: 10 },
    "2026-08-13",
    "manager@demo.practice.example",
  );
  expect(first, "fixture practice A was refused").toEqual({});
  const second = onboardPractice(
    { name: "Beta Community Practice", timezone: "Australia/Melbourne", holdoutPercent: 10 },
    "2026-08-13",
    "manager@demo.practice.example",
  );
  expect(second, "fixture practice B was refused").toEqual({});
});

/**
 * The ENVELOPE, not the raw payload.
 *
 * My first version asserted over `endpoint.read(...)` and the capacity endpoint failed the
 * "answers for its own practice" half — correctly, because `capacityConsoleView` answers for a
 * practice without naming one, which is right for a view-model. The fix was in the API rather
 * than in the assertion: `apiResponse` stamps the practice, so every answer says what it rests on
 * (W227) and the both-directions check has something universal to hold.
 */
const payloadFor = (endpoint: ApiEndpoint, practiceId: PracticeId): string =>
  JSON.stringify(apiResponse(endpoint, { practiceId }));

describe("W253 the practice cannot be named from outside", () => {
  it("hands a reader one field, and no request", () => {
    // THE UNIT. A reader that cannot see the request cannot honour `?practiceId=`, so it is not a
    // thing to remember to ignore — it is a thing with nowhere to be read.
    const shape = SURFACE_SOURCE.match(/export interface ReadContext \{[\s\S]*?\n\}/)![0];
    expect(shape).toContain("practiceId");
    for (const forbidden of ["Request", "searchParams", "headers", "body", "url"]) {
      expect(shape, `ReadContext exposes ${forbidden}`).not.toContain(forbidden);
    }
    // One property, so a second cannot be slipped in beside the first.
    expect(shape.match(/^\s+readonly \w+/gm)).toHaveLength(1);
  });

  it("gives no endpoint a way to accept a practice from a caller", () => {
    const ctx: ReadContext = { practiceId: A };
    for (const endpoint of API_ENDPOINTS) {
      // One argument. A second would be where a request, a filter or an override arrives.
      expect(endpoint.read.length, `${endpoint.id} takes more than a context`).toBeLessThanOrEqual(1);
      expect(() => endpoint.read(ctx)).not.toThrow();
    }
  });

  it("reads no practice from the request in the route either", () => {
    // The route is the ONLY place a query string exists, and it stops there.
    const source = routeSource();
    expect(source).not.toMatch(/searchParams|_request\.(json|text|headers|url)\b/);
    expect(source).not.toMatch(/get\(["'`](x-)?practice/i);
    // The practice comes from the session, via the primitive that cannot widen access.
    expect(source).toContain("activePracticeFor");
    expect(source).toContain("verifySession");
  });
});

describe("W253 there is one door", () => {
  it("serves the whole API from a single route file", () => {
    // One door is what makes practice resolution unskippable. Two doors means the second one has
    // to remember, and the class of finding behind PRIV-3 is entirely things that had to be
    // remembered. W102's census catches an undeclared route; this makes it impossible to write.
    const files = routeFiles();
    expect(files, `more than one route under ${API_ROUTE_ROOT}`).toHaveLength(1);
    expect(files[0]).toContain(path.join("[endpoint]", "route.ts"));
  });

  it("exports GET and no write verb", () => {
    const source = routeSource();
    expect(source).toMatch(/export async function GET\b/);
    for (const verb of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(source, `the API route exports ${verb}`).not.toMatch(
        new RegExp(`export (async )?function ${verb}\\b`),
      );
    }
  });

  it("gives an endpoint a read and no other verb", () => {
    // Read-only is the shape of the type rather than a promise in the documentation: a write would
    // need a new field on `ApiEndpoint`, which is a visible edit rather than an export appearing.
    const shape = SURFACE_SOURCE.match(/export interface ApiEndpoint \{[\s\S]*?\n\}/)![0];
    expect(shape).toContain("read:");
    for (const verb of ["write", "mutate", "update", "delete", "create"]) {
      expect(shape, `ApiEndpoint carries a ${verb}`).not.toContain(`${verb}:`);
    }
  });

  it("resolves an endpoint by name and refuses an unknown one", () => {
    expect(endpointFor("capacity")?.id).toBe("capacity");
    expect(endpointFor("complaints")).toBeNull();
    expect(endpointFor("../practice")).toBeNull();
  });
});

describe("W253 no endpoint returns cross-practice data — asserted the way Y4-1 should have been", () => {
  it("excludes the other practice, INCLUDES its own, and proves the two differ", () => {
    // THE ASSERTION THE GATE NAMES. Three parts, and the third is the one Y4-1's fix never had:
    // exclusion over an empty set is free, and that is exactly the state the tree was in for two
    // years while every scoped read returned nothing because the writer stamped a bogus id.
    let distinguishing = 0;
    for (const endpoint of API_ENDPOINTS) {
      const forA = payloadFor(endpoint, A);
      const forB = payloadFor(endpoint, B);

      expect(forA, `${endpoint.id} leaked practice B into practice A's payload`).not.toContain(B);
      expect(forB, `${endpoint.id} leaked practice A into practice B's payload`).not.toContain(A);
      // Each answers for the practice it was asked about, so exclusion is not being achieved by
      // returning nothing to anybody.
      expect(forA, `${endpoint.id} does not answer for practice A at all`).toContain(A);
      expect(forB, `${endpoint.id} does not answer for practice B at all`).toContain(B);

      if (forA.replaceAll(A, "") !== forB.replaceAll(B, "")) distinguishing += 1;
    }
    // THE VACUITY GUARD. If every endpoint returned the same empty shell to both practices, every
    // assertion above would hold and this suite would be proving nothing.
    expect(
      distinguishing,
      "no endpoint distinguishes the two practices, so the exclusions above are vacuous",
    ).toBeGreaterThan(0);
  });

  it("names the other practice's own data, so the fixture is not empty on both sides", () => {
    // The half Y4-1's world could not have satisfied. Both practices exist, both have a name, and
    // each endpoint's own-practice payload is a real answer rather than an absence.
    const practice = endpointFor("practice")!;
    expect(payloadFor(practice, A)).toContain("Alpha Family Practice");
    expect(payloadFor(practice, B)).toContain("Beta Community Practice");
    expect(payloadFor(practice, A)).not.toContain("Beta Community Practice");
    expect(payloadFor(practice, B)).not.toContain("Alpha Family Practice");
  });

  it("answers a practice it has never heard of without inventing one", () => {
    // Not an error path this unit owns — W255 does — but the shape must not have to be walked
    // back: an unknown practice gets `known: false`, not another practice's record and not a throw.
    const payload = payloadFor(endpointFor("practice")!, "prac-999" as PracticeId);
    expect(payload).toContain('"known":false');
    expect(payload).not.toContain("Alpha Family Practice");
  });
});

describe("W253 the register and its refusals", () => {
  it("declares a summary for every endpoint, and one version", () => {
    expect(API_VERSION).toBe("v1");
    expect(API_ENDPOINTS.length).toBeGreaterThan(0);
    const ids = API_ENDPOINTS.map((e) => e.id);
    expect(new Set(ids).size, "two endpoints share an id").toBe(ids.length);
    for (const endpoint of API_ENDPOINTS) {
      expect(endpoint.summary.length, `${endpoint.id} has no summary`).toBeGreaterThan(40);
      expect(endpoint.id, `${endpoint.id} is not a plain segment`).toMatch(/^[a-z][a-z-]*$/);
    }
  });

  it("gives every refusal a sentence and a status, in both directions", () => {
    expect(Object.keys(API_REFUSAL_COPY).sort()).toEqual(Object.keys(API_REFUSAL_STATUS).sort());
    expect(Object.keys(API_REFUSAL_COPY).sort()).toEqual([
      "no_practice",
      "no_session",
      "unknown_endpoint",
    ]);
    for (const [refusal, copy] of Object.entries(API_REFUSAL_COPY)) {
      expect(copy.length, refusal).toBeGreaterThan(30);
      // No refusal says whether the thing asked for exists — that is W255's rule, and this is the
      // shape that does not have to be walked back to reach it.
      expect(copy.toLowerCase(), refusal).not.toMatch(/does not exist|not found for|no such practice/);
    }
  });

  it("names the six shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_API_SHAPES).sort()).toEqual([
      "a_practice_parameter",
      "a_second_route_file",
      "an_exclusion_only_test",
      "an_unfiltered_store_read",
      "any_write_verb",
      "spreading_a_record_into_a_response",
    ]);
    for (const [name, why] of Object.entries(REFUSED_API_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    // The one that is about METHOD rather than about code, because the gate asked for it.
    expect(REFUSED_API_SHAPES.an_exclusion_only_test).toContain("Y4-1");
    expect(REFUSED_API_SHAPES.a_practice_parameter).toContain("Y4-1");
  });

  it("builds its responses field by field rather than spreading a record", () => {
    // A spread exports whatever the record grew, in a commit that did not touch this file.
    //
    // SCANNED OVER CODE WITH THE STRINGS REMOVED, because the first version of this failed against
    // `REFUSED_API_SHAPES.spreading_a_record_into_a_response`, whose prose QUOTES `{ ...record }`
    // in order to forbid it. That is W198's collision — a scan whose subject matter is the thing it
    // bans matching the sentence doing the banning — and the register is the sentence, so the scan
    // is what has to move.
    const code = (source: string) =>
      source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/`(?:[^`\\]|\\.)*`/g, "``");
    expect(code(SURFACE_SOURCE)).not.toMatch(/\.\.\.record\b|\.\.\.practice\b/);
    expect(code(routeSource())).not.toMatch(/\.\.\.record\b/);
    // Non-vacuity for the stripper: it must still see real code.
    expect(code(SURFACE_SOURCE)).toContain("practiceRecord(ctx.practiceId)");
  });
});

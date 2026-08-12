// W255 verify gate: "no patient data on any error path, asserted over every refusal branch rather
// than sampled."
//
// RATHER THAN SAMPLED is the instruction, and it decides the shape of this file. Driving three
// error responses and scanning them is a sample; it passes on the day it is written and says
// nothing about the branch somebody adds next quarter. So the scan iterates the REFUSAL UNION
// ITSELF, the union is checked against the dispatcher's call sites in both directions, and the
// declared branches are checked against the union — which means W254's scope refusals will fail
// this suite until somebody drives them and shows what they say.
//
// The poison fixture is the other half. A branch that returns nothing is trivially clean, so the
// throwing endpoint carries a patient identifier IN THE EXCEPTION MESSAGE — which is exactly the
// shape a real one takes, because an exception message is written for a developer and a helpful
// developer writes `Patient ${id} not found`.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PATIENT_MARKERS,
  REFUSAL_BRANCHES,
  REFUSED_ERROR_BEHAVIOURS,
  patientMarkersIn,
  readSafely,
  refusalBody,
  refusalResponse,
} from "./refusals";
import {
  API_ENDPOINTS,
  API_REFUSAL_COPY,
  API_REFUSAL_STATUS,
  API_ROUTE_ROOT,
  type ApiEndpoint,
  type ApiRefusal,
} from "./surface";
import type { PracticeId } from "@/domain/types";

const ROOT = process.cwd();
const ROUTE_SOURCE = readFileSync(
  path.join(ROOT, API_ROUTE_ROOT, "[endpoint]", "route.ts"),
  "utf8",
);
const REFUSALS_SOURCE = readFileSync(path.join(ROOT, "src", "api", "refusals.ts"), "utf8");

const ALL_REFUSALS = Object.keys(API_REFUSAL_COPY) as ApiRefusal[];
const CTX = { practiceId: "prac-1" as PracticeId };

/** The shape a real leak takes: an identifier put in an exception message for a developer. */
const POISON = "Patient pat-9 (patientId pat-9, DOB 1984-02-11) not found in practice prac-1";
const throwing: ApiEndpoint = {
  id: "throwing",
  summary: "A fixture endpoint that fails the way a real one would, with a helpful message.",
  read: () => {
    throw new Error(POISON);
  },
};

describe("W255 every refusal branch, not a sample of them", () => {
  it("declares a branch for every refusal, and no branch for a refusal that does not exist", () => {
    // Both directions over the union. A refusal added by W254 fails here until it is described.
    expect(REFUSAL_BRANCHES.map((b) => b.refusal).sort()).toEqual([...ALL_REFUSALS].sort());
    expect(new Set(REFUSAL_BRANCHES.map((b) => b.refusal)).size).toBe(REFUSAL_BRANCHES.length);
    for (const branch of REFUSAL_BRANCHES) {
      expect(branch.producedWhen.length, branch.refusal).toBeGreaterThan(30);
      expect(branch.saysNoMore.length, `${branch.refusal} does not say where it stops`).toBeGreaterThan(80);
    }
  });

  it("matches the dispatcher's call sites in both directions", () => {
    // A `refuse(...)` with no entry is an undeclared branch; an entry with no call site is stale,
    // which is the direction that makes a register misleading rather than merely incomplete.
    const called = new Set(
      [...ROUTE_SOURCE.matchAll(/refuse\("([a-z_]+)"\)/g)].map((m) => m[1]!),
    );
    // `read_failed` is returned by `readSafely` and refused through `outcome.refusal`, so it is
    // named in the module that produces it rather than in a literal at the call site.
    called.add("read_failed");
    expect([...called].sort()).toEqual([...ALL_REFUSALS].sort());
    expect(REFUSALS_SOURCE).toContain('refusal: "read_failed"');
  });

  it("carries no patient marker in ANY refusal body, over the whole union", () => {
    // THE GATE'S ASSERTION, over the union rather than over three examples.
    for (const refusal of ALL_REFUSALS) {
      const body = refusalBody(refusal);
      const found = patientMarkersIn(JSON.stringify(body));
      expect(found, `${refusal} carries ${found.join(", ")}`).toEqual([]);
      expect(body.message, `${refusal} has no message`).toBe(API_REFUSAL_COPY[refusal]);
    }
  });

  it("gives every refusal a status, and no status without a refusal", () => {
    expect(Object.keys(API_REFUSAL_STATUS).sort()).toEqual([...ALL_REFUSALS].sort());
    for (const refusal of ALL_REFUSALS) {
      const status = API_REFUSAL_STATUS[refusal];
      expect(status, refusal).toBeGreaterThanOrEqual(400);
      expect(status, refusal).toBeLessThan(600);
    }
  });

  it("says nothing more in one refusal than in another about what exists", () => {
    // A 404 that reads differently from a 401 is how an id becomes enumerable. Neither may claim
    // that a thing does or does not exist.
    for (const refusal of ALL_REFUSALS) {
      const message = API_REFUSAL_COPY[refusal].toLowerCase();
      expect(message, refusal).not.toMatch(/does not exist|no such practice|not a member of|removed from/);
    }
  });
});

describe("W255 the branch W253 never wrote", () => {
  it("catches a throwing endpoint and forwards nothing of the exception", () => {
    // THE FINDING. W253 called `read` bare, so this response was the framework's — a body built
    // from a message somebody wrote for a developer.
    const outcome = readSafely(throwing, CTX);
    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.refusal).toBe("read_failed");

    const serialised = JSON.stringify(refusalBody("read_failed"));
    expect(serialised).not.toContain("pat-9");
    expect(serialised).not.toContain("1984-02-11");
    expect(serialised).not.toContain(POISON);
    expect(patientMarkersIn(serialised)).toEqual([]);
  });

  it("does not bind the caught error at all", () => {
    // A caught error that is never named cannot be logged into a response by the next person to
    // edit this function. `catch {` rather than `catch (error) {`.
    expect(REFUSALS_SOURCE).toMatch(/\}\s*catch\s*\{/);
    expect(REFUSALS_SOURCE).not.toMatch(/catch\s*\(\s*\w+\s*\)/);
  });

  it("still returns real data when the read does not throw, so the wrap is not a wall", () => {
    // Non-vacuity: a `readSafely` that always refused would pass every assertion above.
    for (const endpoint of API_ENDPOINTS) {
      const outcome = readSafely(endpoint, CTX);
      expect(outcome.ok, `${endpoint.id} was refused by the wrapper`).toBe(true);
      expect(outcome.ok && outcome.body.endpoint).toBe(endpoint.id);
      expect(outcome.ok && outcome.body.practiceId).toBe(CTX.practiceId);
    }
  });
});

describe("W255 the scan itself", () => {
  it("finds the markers it exists to find, so a clean result means something", () => {
    // A scanner that matched nothing would make every assertion in this file vacuous — which is
    // the same failure W253's cross-practice guard exists against, one surface along.
    expect(patientMarkersIn(POISON).length).toBeGreaterThan(0);
    expect(patientMarkersIn("patient pat-42 attended")).toContain("pat-42");
    expect(patientMarkersIn("their MRN is on file").length).toBeGreaterThan(0);
    expect(patientMarkersIn("nothing was read")).toEqual([]);
  });

  it("scans for the person-reference terms W201 declares, rather than a second list", () => {
    // W221's finding was that a privacy control and a transparency register can hide something
    // from each other. Reading W201's terms is the join, so a pseudonym added there is scanned
    // for here without anybody remembering to.
    expect(patientMarkersIn("candidateRef abc")).toContain("candidateRef");
    expect(patientMarkersIn("PatientId")).toContain("PatientId");
    expect(PATIENT_MARKERS.length).toBeGreaterThan(4);
  });
});

describe("W255 one producer, and nowhere to put a detail", () => {
  it("builds every refusal body through the single producer", () => {
    // The dispatcher decides WHICH refusal and never what one says. A branch that assembled its
    // own body is where an exception message ends up.
    expect(ROUTE_SOURCE).toContain("refusalResponse");
    expect(ROUTE_SOURCE).not.toMatch(/message:\s*[`"']/);
    expect(ROUTE_SOURCE).not.toMatch(/API_REFUSAL_COPY/);
  });

  it("has no field on the body a detail could occupy, optional ones included", () => {
    // MY FIRST VERSION OF THIS DID NOT FIRE. It counted `/^\s+\w+:/` and looked for `detail:`,
    // and adding `detail?: string` passed both — because `detail?:` is neither. Optional is
    // exactly how such a field arrives ("only set when we have something useful to say"), so the
    // one shape the assertion missed is the one it was written for.
    const shape = REFUSALS_SOURCE.match(/export interface RefusalBody \{[\s\S]*?\n\}/)![0];
    expect(shape.match(/^\s+\w+\??:/gm)).toHaveLength(2);
    for (const field of ["detail", "cause", "context", "debug", "stack", "error", "reason"]) {
      expect(shape, `RefusalBody carries a ${field}`).not.toMatch(
        new RegExp(`\\b${field}\\??:`),
      );
    }
  });

  it("echoes nothing the caller sent", () => {
    // Reflection is how an error path returns something it was never entitled to hold, and it
    // turns a 404 into a probe that confirms what was asked.
    const body = JSON.stringify(refusalBody("unknown_endpoint"));
    expect(body).not.toContain("throwing");
    for (const source of [REFUSALS_SOURCE]) {
      expect(source).not.toMatch(/message:\s*`[^`]*\$\{/);
    }
  });

  it("returns a Response whose body is exactly the refusal body", async () => {
    const response = refusalResponse("no_session");
    expect(response.status).toBe(API_REFUSAL_STATUS.no_session);
    await expect(response.json()).resolves.toEqual(refusalBody("no_session"));
  });

  it("names the six error-path behaviours it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_ERROR_BEHAVIOURS).sort()).toEqual([
      "a_detail_field",
      "a_stack_trace_in_any_environment",
      "distinguishing_absent_from_forbidden",
      "echoing_the_request",
      "forwarding_an_exception_message",
      "logging_the_body_on_the_way_out",
    ]);
    for (const [name, why] of Object.entries(REFUSED_ERROR_BEHAVIOURS)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_ERROR_BEHAVIOURS.a_stack_trace_in_any_environment).toContain("fails open");
  });

  it("writes nothing to a log from the handler or the wrapper", () => {
    // A refusal can be clean while a log is not, and a log is read by more people.
    for (const [name, source] of [
      ["route", ROUTE_SOURCE],
      ["refusals", REFUSALS_SOURCE],
    ] as const) {
      expect(source, `${name} logs`).not.toMatch(/console\.(log|error|warn|info)\(/);
    }
  });
});

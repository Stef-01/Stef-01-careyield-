// W262 verify gate: "the rehearsal drives W242's loader, W253's dispatcher and W209's scoped
// reads; `liveConnectionsPermitted()` stays false and the test fails if any step was skipped
// rather than exercised."
//
// THE LAST CLAUSE DECIDES THIS FILE. A rehearsal that returns pass/fail cannot distinguish "every
// stage ran" from "stage two returned early and the rest never happened" — and on the worse
// reading the early return IS the success path, so a shortened walk goes green. So the assertions
// are over the TRACE: every declared stage must appear, in order, having observed something, and
// a stage that did not run is absent rather than invisible.
//
// The three modules the gate names are driven by their real exports rather than mocked, because a
// rehearsal against doubles is a rehearsal of the doubles.

import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ALL_STAGES,
  REFUSED_REHEARSAL_SHAPES,
  WHAT_THIS_DOES_NOT_PROVE,
  rehearseFirstConnection,
  stagesReached,
} from "./g1-rehearsal";
import { liveConnectionsPermitted } from "@/interop/credentials";
import { onboardPractice, resetConsole } from "@/console/store";

const ROOT = process.cwd();
const SOURCE = readFileSync(path.join(ROOT, "src", "quality", "g1-rehearsal.ts"), "utf8");
const OWNER = "manager@demo.practice.example";

beforeEach(() => {
  resetConsole();
  expect(
    onboardPractice(
      { name: "Alpha Family Practice", timezone: "Australia/Sydney", holdoutPercent: 10 },
      "2026-08-13",
      OWNER,
    ),
    "fixture practice was refused",
  ).toEqual({});
});

const walk = (over: Partial<Parameters<typeof rehearseFirstConnection>[0]> = {}) =>
  rehearseFirstConnection({ email: OWNER, endpointId: "capacity", ...over });

describe("W262 the walk reaches every stage, and a skip is visible", () => {
  it("records every declared stage, in order, with nothing missing or invented", () => {
    // THE ASSERTION THE GATE NAMES. Both directions over the declared stage list: a stage the walk
    // never reaches is absent, and a trace naming a stage that is not declared fails too.
    const rehearsal = walk();
    expect(rehearsal.walked, "the walk did not complete").toBe(true);
    expect(stagesReached(rehearsal)).toEqual([...ALL_STAGES]);
  });

  it("gives every stage something it actually observed", () => {
    // A stage whose `observed` is empty is a stage somebody added to the list rather than to the
    // walk, and the check above would then be counting names.
    const rehearsal = walk();
    for (const stage of rehearsal.stages) {
      expect(stage.observed.length, `${stage.stage} observed nothing`).toBeGreaterThan(10);
      expect(stage.observed, `${stage.stage} observed a placeholder`).not.toMatch(/^(ok|done|true)$/i);
    }
  });

  it("returns the stages it DID reach when it stops partway", () => {
    // The difference between "stopped at stage one" and "stopped at stage six" is the difference
    // between a gate holding and a path being broken, and a bare failure hides it.
    const nobody = walk({ email: "stranger@example.invalid" });
    expect(nobody.walked).toBe(false);
    expect(!nobody.walked && nobody.refusal).toBe("no_practice_for_session");
    // It still got through the credential and switch stages, which do not need a session.
    expect(stagesReached(nobody)).toEqual([
      "credential_slot_declared",
      "credential_load_refused",
      "live_connections_denied",
    ]);
  });

  it("stops later for an unknown endpoint than for an unknown session", () => {
    // Non-vacuity for the partial trace: if every failure produced the same three stages, the
    // assertion above would be about the walk's beginning rather than about where it stopped.
    const noEndpoint = walk({ endpointId: "not-an-endpoint" });
    expect(noEndpoint.walked).toBe(false);
    expect(stagesReached(noEndpoint)).toContain("session_resolved_to_practice");
    expect(stagesReached(noEndpoint).length).toBeGreaterThan(3);
  });
});

describe("W262 the refusal is an observation, not a halt", () => {
  it("records the loader refusing and keeps walking", () => {
    // The obvious rehearsal stops here and proves nothing about the six stages that become the
    // live path. This one records `gate_not_ratified` and continues.
    const rehearsal = walk();
    const refusal = rehearsal.stages.find((s) => s.stage === "credential_load_refused");
    expect(refusal, "the loader refusal was not recorded").toBeDefined();
    expect(refusal!.observed).toContain("gate_not_ratified");
    expect(refusal!.observed).toContain("G1");
    // And the stages after it ran.
    expect(stagesReached(rehearsal)).toContain("endpoint_read_scoped");
  });

  it("declares the credential slot before asking for one", () => {
    const slot = walk().stages.find((s) => s.stage === "credential_slot_declared");
    expect(slot!.observed).toContain("pms_read_api");
    expect(slot!.observed).toContain("G1");
  });
});

describe("W262 nothing goes live, before or after", () => {
  it("checks the switch at both ends of the walk", () => {
    // A rehearsal that left a gate open would be worse than no rehearsal, so both readings are
    // stages in their own right rather than one check somebody trusts.
    const rehearsal = walk();
    const before = rehearsal.stages.find((s) => s.stage === "live_connections_denied")!;
    const after = rehearsal.stages.find((s) => s.stage === "live_connections_still_denied")!;
    expect(before.observed).toContain("false");
    expect(after.observed).toContain("false");
    expect(liveConnectionsPermitted(), "the walk left the switch flipped").toBe(false);
  });

  it("contacts nothing", () => {
    expect(SOURCE).not.toMatch(/\bfetch\(|node:https?|XMLHttpRequest|axios/);
  });

  it("supplies no credential-shaped value", () => {
    // W242's scanner sweeps this file too — it caught W254's own fixture — so the value handed to
    // the loader is deliberately not secret-shaped, and the loader never reads it anyway.
    expect(SOURCE).not.toMatch(/sk-live-|AKIA|ghp_/);
    expect(REFUSED_REHEARSAL_SHAPES.faking_the_credential).toContain("W242");
  });
});

describe("W262 the walk drives the three modules the gate names", () => {
  it("uses their real exports rather than doubles", () => {
    // A rehearsal against mocks is a rehearsal of the mocks.
    //
    // CHECKED PER SYMBOL, NOT PER MODULE PATH. My first version asserted the import STATEMENTS
    // were present, and a break that kept `from "@/interop/credentials"` while declaring a local
    // `const loadCredential = ...` above the walk passed it — a double sitting beside a real
    // import satisfies a path check completely. So each name is required to arrive FROM its
    // module, and nothing may redeclare one locally.
    const importedFrom = (name: string, module: string) =>
      new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*"${module}"`, "s").test(SOURCE);
    for (const [name, module] of [
      ["loadCredential", "@/interop/credentials"],
      ["liveConnectionsPermitted", "@/interop/credentials"],
      ["CREDENTIAL_SLOTS", "@/interop/credentials"],
      ["endpointFor", "@/api/surface"],
      ["permits", "@/api/scopes"],
      ["grantedScopes", "@/api/scopes"],
      ["readSafely", "@/api/refusals"],
      ["activePracticeFor", "@/console/store"],
    ] as const) {
      expect(importedFrom(name, module), `${name} does not come from ${module}`).toBe(true);
      expect(SOURCE, `${name} is shadowed by a local definition`).not.toMatch(
        new RegExp(`(const|function)\\s+${name}\\b`),
      );
    }
    expect(SOURCE).not.toMatch(/vi\.mock|jest\.mock|stub|fake[A-Z]/);
  });

  it("reads scoped to the practice the session resolved, not to one it was told", () => {
    // W209's rule and W253's: the practice comes from the session, and the envelope says which.
    const rehearsal = walk();
    const resolved = rehearsal.stages.find((s) => s.stage === "session_resolved_to_practice")!;
    const stamped = rehearsal.stages.find((s) => s.stage === "response_envelope_stamped")!;
    expect(resolved.observed).toContain("prac-1");
    expect(stamped.observed).toContain("prac-1");
  });

  it("passes the scope check through the model rather than around it", () => {
    const permitted = walk().stages.find((s) => s.stage === "scope_permitted_endpoint")!;
    expect(permitted.observed).toContain("read:capacity");
  });

  it("walks the same way for every declared endpoint", () => {
    // The path is the endpoint-independent part, so a rehearsal that only worked for one endpoint
    // would be a rehearsal of that endpoint.
    for (const endpointId of ["practice", "capacity", "interop"]) {
      const rehearsal = walk({ endpointId });
      expect(stagesReached(rehearsal), endpointId).toEqual([...ALL_STAGES]);
    }
  });
});

describe("W262 what it does not prove is on the module", () => {
  it("says a real system has still never seen any of this", () => {
    // A green rehearsal is exactly the thing somebody quotes as "the integration works".
    // W304: a non-vacuity floor, which is what the count guarded — the loop below is the check.
    expect(WHAT_THIS_DOES_NOT_PROVE.length, "the register says nothing").toBeGreaterThanOrEqual(3);
    expect(WHAT_THIS_DOES_NOT_PROVE[0]).toContain("no real system has ever seen a byte");
    for (const line of WHAT_THIS_DOES_NOT_PROVE) {
      expect(line.length).toBeGreaterThan(80);
    }
  });

  it("names the six shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_REHEARSAL_SHAPES).sort()).toEqual([
      "a_stage_that_observes_nothing",
      "claiming_the_integration_works",
      "faking_the_credential",
      "leaving_a_switch_flipped",
      "returning_a_boolean",
      "stopping_at_the_refusal",
    ]);
    for (const [name, why] of Object.entries(REFUSED_REHEARSAL_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_REHEARSAL_SHAPES.returning_a_boolean).toContain("early return IS the success path");
  });
});

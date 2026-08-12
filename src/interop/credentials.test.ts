// W242 verify gate: "no credential in the tree; the loader enforces the gate rather than the
// values doing it (W56's shape); G1 named as the blocker for anything live."
//
// The three clauses are checked separately on purpose. "No credential in the tree" is a scan.
// "The loader enforces the gate" is proved by handing the loader a credential that would
// otherwise be perfectly acceptable. "G1 named" is checked against plan §4, because a gate named
// in code and undefined in the plan is W208's failure.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./credentials";
import {
  BLOCKING_GATE,
  CREDENTIAL_REFUSAL_COPY,
  CREDENTIAL_SLOTS,
  REFUSED_CREDENTIAL_POSTURES,
  SHIPPED_CREDENTIALS,
  credentialShapedLiterals,
  liveConnectionsPermitted,
  loadCredential,
} from "./credentials";
import { stripComments } from "@/security/reachability";

const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/credentials.ts"), "utf8");
const PLAN = readFileSync(path.join(process.cwd(), "docs/FIVE-YEAR-PLAN.md"), "utf8");

/** A credential that would pass any sane validator. The point is that it is refused anyway. */
const WELL_FORMED = "a".repeat(48);
/** Distinctive enough that finding it anywhere in a refusal is unambiguous. */
const DISTINCTIVE = "W242-CANARY-9f3b2c7d5e1a4806";

function sourceFiles(root: string): Array<{ file: string; text: string }> {
  const out: Array<{ file: string; text: string }> = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next") continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      out.push({
        file: path.relative(process.cwd(), full),
        text: readFileSync(full, "utf8"),
      });
    }
  };
  walk(path.join(process.cwd(), root));
  return out;
}

describe("W242 the loader enforces the gate, not the values", () => {
  it("refuses a credential that would otherwise be perfectly acceptable", () => {
    // THE unit. If emptiness were the control, a well-formed credential for a declared slot would
    // load. It does not, so the guarantee survives somebody adding a row.
    const result = loadCredential("pms_read_api", WELL_FORMED);
    expect(result.loaded).toBe(false);
    if (result.loaded) throw new Error("unreachable");
    expect(result.refusal).toBe("gate_not_ratified");
    expect(result.blockedBy).toContain("G1");
  });

  it("refuses identically for a malformed one, giving away no oracle", () => {
    // The ordering. A loader that validated first would answer "your secret is the wrong shape" to
    // somebody holding a secret it was never going to accept. Same refusal, nothing about the
    // malformation, for an empty string and for junk alike.
    for (const supplied of ["", "x", "not-a-key", WELL_FORMED, undefined]) {
      const result = loadCredential("pms_read_api", supplied);
      if (result.loaded) throw new Error("a credential loaded");
      expect(result.refusal, `refusal differed for ${JSON.stringify(supplied)}`).toBe(
        "gate_not_ratified",
      );
    }
  });

  it("checks the gate before it resolves the slot", () => {
    // An unknown slot must also refuse on the gate rather than on the slot: "we do not have that
    // connection" is information about the tree that a caller holding a secret has not earned.
    const result = loadCredential("some-system-we-do-not-have", WELL_FORMED);
    if (result.loaded) throw new Error("unreachable");
    expect(result.refusal).toBe("gate_not_ratified");
    expect(result.blockedBy).toEqual([BLOCKING_GATE]);
  });

  it("never echoes the supplied value in the refusal", () => {
    // The ordinary way secrets leak, and a defect of the ERROR path — the one nobody exercises
    // until it runs. The whole result is serialised and scanned, not just the message.
    const result = loadCredential("fhir_exchange", DISTINCTIVE);
    expect(JSON.stringify(result)).not.toContain(DISTINCTIVE);
    expect(JSON.stringify(CREDENTIAL_REFUSAL_COPY)).not.toContain(DISTINCTIVE);
  });

  it("permits no live connection, and takes nothing that could change that", () => {
    // No environment variable, no config flag, no options object. A decision that can be taken by
    // a deployment setting is one that will be.
    expect(liveConnectionsPermitted()).toBe(false);
    const code = stripComments(SOURCE);
    expect(code.length).toBeLessThan(SOURCE.length);
    expect(SOURCE, "the phrase proving the subtraction is gone").toContain("FOUNDER GATES (plan §4)");
    expect(code, "comments were not removed").not.toContain("FOUNDER GATES (plan §4)");
    expect(code).not.toMatch(/process\.env|import\.meta\.env/);
    expect(code).toMatch(/export function liveConnectionsPermitted\(\): false/);
  });

  it("ships nothing, and the type has nowhere to put one", () => {
    expect(SHIPPED_CREDENTIALS).toEqual([]);
    // `never[]` rather than a credential type: emptiness is a consequence, and there is also no
    // shape a value could take here.
    expect(SOURCE).toContain("SHIPPED_CREDENTIALS: readonly never[]");
  });
});

describe("W242 G1 is named, and defined where it is named", () => {
  it("names the gate", () => {
    expect(BLOCKING_GATE).toBe("G1");
    for (const slot of CREDENTIAL_SLOTS) {
      expect(slot.blockedBy, `${slot.kind} names no gate`).toContain("G1");
    }
  });

  it("is defined in plan §4, not merely cited", () => {
    // W208's rule: every gate a blocked row names must be DEFINED in §4. A gate named in code and
    // undefined in the plan is a blocker nobody can act on.
    const named = new Set(CREDENTIAL_SLOTS.flatMap((slot) => slot.blockedBy));
    expect(named.size).toBeGreaterThan(1);
    for (const gate of named) {
      expect(PLAN, `${gate} is named here but not defined in the plan`).toMatch(
        new RegExp(`\\*\\*${gate}\\*\\*\\s*—`),
      );
    }
  });

  it("records every blocker on a slot, not just the first", () => {
    // The payer slot is blocked by G1 for the credential and G10 for the data flow. A register
    // holding one would show the slot opening the day the other was ratified — the more dangerous
    // direction to be wrong in.
    const payer = CREDENTIAL_SLOTS.find((slot) => slot.kind === "payer_api");
    expect(payer?.blockedBy).toEqual(["G1", "G10"]);
    const ereferral = CREDENTIAL_SLOTS.find((slot) => slot.kind === "ereferral_gateway");
    expect(ereferral?.blockedBy).toEqual(["G1", "G9"]);
  });

  it("declares what would be needed, with no value in the shape", () => {
    expect(CREDENTIAL_SLOTS.length).toBeGreaterThan(3);
    for (const slot of CREDENTIAL_SLOTS) {
      expect(Object.keys(slot).sort()).toEqual(["blockedBy", "kind", "system", "whyNeeded"]);
      expect(slot.whyNeeded.length, `${slot.kind} says nothing about why`).toBeGreaterThan(60);
    }
  });
});

describe("W242 no credential-shaped literal anywhere in the tree", () => {
  it("catches the shapes a real secret takes", () => {
    // The scanner is proved to fire before it is trusted. A scanner nobody has seen catch anything
    // is a scanner that proves the files were read.
    const bad = [
      'const apiKey = "' + "b".repeat(32) + '";',
      "client_secret: '" + "c".repeat(24) + "',",
      'const t = "sk-live-' + "d".repeat(20) + '";',
      'accessToken = `' + "e".repeat(40) + "`;",
    ].join("\n");
    const found = credentialShapedLiterals("probe.ts", bad);
    expect(found.length).toBe(4);
    // And it does not fire on ordinary code, or it would be a scanner nobody could keep green.
    expect(credentialShapedLiterals("probe.ts", 'const name = "Demo Family Practice";')).toEqual([]);
    expect(credentialShapedLiterals("probe.ts", "const apiKey = process.env.KEY;")).toEqual([]);
  });

  it("finds none in src/ or app/", () => {
    // Both trees, because a pasted secret goes wherever somebody was working — and a scanner
    // aimed at the module that talks about credentials is aimed at the one place a credential is
    // least likely to be.
    const files = [...sourceFiles("src"), ...sourceFiles("app")];
    expect(files.length, "the scan read no files").toBeGreaterThan(100);
    const found = files.flatMap(({ file, text }) =>
      credentialShapedLiterals(file, stripComments(text)),
    );
    expect(found.map((f) => `${f.file}: ${f.match}`)).toEqual([]);
  });

  it("would catch one planted in a real file", () => {
    // The scan above is only worth its green if it reads the files it claims to. This plants a
    // secret into the text of an actual module and requires the scanner to see it.
    const real = sourceFiles("src").find((f) => f.file.endsWith("src/interop/fhir.ts"));
    expect(real, "the probe target moved").toBeDefined();
    const planted = `${real!.text}\nconst clientSecret = "${"f".repeat(30)}";\n`;
    expect(credentialShapedLiterals(real!.file, stripComments(planted)).length).toBe(1);
  });
});

describe("W242 what the posture refuses to become", () => {
  it("states a reason for each refused posture", () => {
    expect(Object.keys(REFUSED_CREDENTIAL_POSTURES).sort()).toEqual([
      "a_scanner_that_only_reads_this_module",
      "an_environment_variable_switch",
      "echoing_the_value_in_a_refusal",
      "emptiness_as_the_control",
      "recording_only_the_first_blocker",
      "validating_before_gating",
    ]);
    for (const [id, why] of Object.entries(REFUSED_CREDENTIAL_POSTURES)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(150);
    }
  });

  it("exports no way to connect, asserted on shape rather than on names", () => {
    // TWELFTH INSTANCE OF THE RECURRING COLLISION. The first version scanned export names for
    // /connect/ and matched `liveConnectionsPermitted` — the function whose entire job is to say
    // connections are NOT permitted. The name is right, so W198 applies and the scan is what
    // changes; and unlike W231's case there is a better property available than a narrower name
    // list. A NETWORK CALL CANNOT BE SYNCHRONOUS, so the shape of the guarantee is that nothing
    // here is async: no `await`, no `async`, no function returning a Promise. That is structural
    // and it does not care what anything is called.
    const code = stripComments(SOURCE);
    expect(code, "something here is asynchronous").not.toMatch(/\basync\b|\bawait\b|Promise</);
    expect(code).not.toMatch(/\bfetch\(|axios|XMLHttpRequest|node:https?|https?:\/\//);
    for (const value of Object.values(mod)) {
      if (typeof value !== "function") continue;
      expect(value.constructor.name, "an exported function is async").toBe("Function");
    }
    expect(Object.values(mod).filter((v) => typeof v === "function").length).toBeGreaterThan(2);
  });
});

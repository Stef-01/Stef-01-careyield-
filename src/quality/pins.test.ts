// W290 verify gate: "every `*_AT_W<n>` and `*_LAST_UNIT` constant found from the tree and checked
// to be bounded rather than live; a pin that would go red on an ordinary expansion fails, and the
// sweep is proved on a planted live pin."
//
// The gate's "bounded rather than live" is the framing this unit had to correct — `BLOCKED_AT_W263`
// is live and is right — so what is checked is the property underneath it: every pin names what
// moves it, and a pin whose mover is ordinary work must argue for interrupting somebody.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DUPLICATE_PINS,
  HISTORY,
  PIN_NAME,
  PINS,
  SWEEP_BOUND,
  duplicateDiff,
  pinDiff,
  pinsInTree,
} from "./pins";
import { BLOCKED_AT_W263, blockedRows } from "./blocked-surface";
import { UNPROVEN_AT_W290, walkUnproven } from "./register-census";
import { Y5_FIRST_UNIT as RAIL_Y5 } from "@/compliance/rail-y5";
import { Y5_FIRST_UNIT as ADM_Y5 } from "@/privacy/adm-y5";

const ROOT = path.resolve(__dirname, "../..");

let COPY: string;

beforeAll(() => {
  COPY = mkdtempSync(path.join(tmpdir(), "w290-"));
  cpSync(path.join(ROOT, "src"), path.join(COPY, "src"), { recursive: true });
});

afterAll(() => {
  rmSync(COPY, { recursive: true, force: true });
});

function plant(relPath: string, contents: string): void {
  const full = path.join(COPY, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, contents, "utf8");
}

describe("W290 every pin in the tree is classified, both directions", () => {
  it("has nothing undeclared, stale or unargued", () => {
    expect(pinDiff(ROOT)).toEqual({
      undeclared: [],
      stale: [],
      liveWithoutArgument: [],
      unargued: [],
    });
  });

  it("swept something, and swept the tests too", () => {
    // Non-vacuity, and the second half is the finding: four of the ten pins live in `.test.ts`
    // files, so a sweep built on the source-only walk would have reported six and stopped.
    const found = pinsInTree(ROOT);
    expect(found).toHaveLength(PINS.length);
    expect(found.filter((p) => p.module.endsWith(".test.ts")).length).toBeGreaterThan(3);
    expect(found.filter((p) => !p.module.endsWith(".test.ts")).length).toBeGreaterThan(3);
  });

  it("classifies each as a floor, a range bound, or live with an argument", () => {
    const kinds = new Set(PINS.map((p) => p.classification.kind));
    expect([...kinds].sort()).toEqual(["floor", "live_by_design", "range_bound"]);
  });
});

describe("W290 the live pins, and why live is not the defect", () => {
  it("is the blocked surface and the unproven set, both of which really do fire", () => {
    // The gate says "bounded rather than live". These are the counterexamples that made the unit
    // classify by WHAT MOVES A PIN instead: a new blocked row is a founder gate arriving and a
    // register arriving unproven is W267's own event. Neither is ordinary work, and stopping the
    // build for either is the control rather than the noise.
    const live = PINS.filter((p) => p.classification.kind === "live_by_design");
    expect(live.map((p) => p.name).sort()).toEqual(["BLOCKED_AT_W263", "UNPROVEN_AT_W290"]);
    // Both are asserted against the tree, so "live" is a fact rather than a label.
    expect(blockedRows(ROOT)).toHaveLength(BLOCKED_AT_W263);
    expect(walkUnproven().map((r) => r.file).sort()).toEqual([...UNPROVEN_AT_W290].sort());
  });

  it("makes each argue for interrupting somebody, not merely declare itself live", () => {
    for (const pin of PINS) {
      if (pin.classification.kind !== "live_by_design") continue;
      expect(pin.classification.movedBy.length, `${pin.name} does not name its mover`).toBeGreaterThan(40);
      expect(
        pin.classification.whyStopping.length,
        `${pin.name} does not argue for the interruption`,
      ).toBeGreaterThan(200);
    }
  });

  it("replaced a count with a name, which is the unit's own remedy applied to itself", () => {
    // `UNPROVEN_AT_W290` exists because `walkProven().length` did not survive contact with five
    // consecutive units. The new pin is checked here to be the shape the old one was not: adding
    // a register that arrives already proved must not move it.
    const census = readFileSync(path.join(ROOT, "src/quality/register-census.test.ts"), "utf8");
    expect(census, "the census went back to counting proved walks").not.toMatch(
      /expect\(walkProven\(\)\.length\)\.toBe\(/,
    );
    expect(census).toContain("UNPROVEN_AT_W290");
  });

  it("refuses a live pin whose argument is missing", () => {
    // Both directions on the argument, since "declared live" is otherwise a way to opt out.
    const weak = [
      {
        module: "src/quality/x.ts",
        name: "THING_AT_W1",
        classification: { kind: "live_by_design" as const, movedBy: "stuff", whyStopping: "because" },
      },
    ];
    expect(pinDiff(ROOT, weak).liveWithoutArgument).toEqual(["src/quality/x.ts::THING_AT_W1"]);
  });
});

describe("W290 the sweep, proved on a planted pin", () => {
  it("reports a pin nothing classifies", () => {
    // The gate's own words. A planted `*_AT_W<n>` constant is exactly what an author adds when
    // they pin a count at the unit that measured it.
    plant("src/quality/w290-probe.ts", "// W290: probe.\nexport const REGISTERS_AT_W290 = 42;\n");
    const diff = pinDiff(COPY);
    expect(diff.undeclared).toContain("src/quality/w290-probe.ts::REGISTERS_AT_W290");
    rmSync(path.join(COPY, "src/quality/w290-probe.ts"));
    expect(pinDiff(COPY).undeclared, "the copied tree was dirty before the plant").toEqual([]);
  });

  it("reports a pin in a TEST file, which is where five of the six historically lived", () => {
    plant("src/quality/w290-probe.test.ts", "export const THINGS_AT_W290 = 7;\n");
    expect(pinDiff(COPY).undeclared).toContain("src/quality/w290-probe.test.ts::THINGS_AT_W290");
    rmSync(path.join(COPY, "src/quality/w290-probe.test.ts"));
  });

  it("does not report a constant that is not pin-shaped", () => {
    // The other direction, and it earns its place: a detector matching every SCREAMING_CASE export
    // would report most of this tree and the register would become a chore nobody reads.
    plant("src/quality/w290-probe-plain.ts", "// W290: probe.\nexport const DEFAULT_TIMEOUT = 30;\n");
    expect(pinDiff(COPY).undeclared).toEqual([]);
    rmSync(path.join(COPY, "src/quality/w290-probe-plain.ts"));
    expect(PIN_NAME.test("DEFAULT_TIMEOUT")).toBe(false);
    expect(PIN_NAME.test("BLOCKED_AT_W263")).toBe(true);
    expect(PIN_NAME.test("Q22_HORIZON_LAST_UNIT")).toBe(true);
  });

  it("notices a classified pin that has left the tree", () => {
    const declared = [...PINS, { module: "src/gone.ts", name: "GONE_AT_W1", classification: { kind: "floor" as const, why: "x".repeat(70) } }];
    expect(pinDiff(ROOT, declared).stale).toEqual(["src/gone.ts::GONE_AT_W1"]);
  });
});

describe("W290 a pin declared twice must be reconciled by something that resolves", () => {
  it("finds the tree's one duplicate reconciled", () => {
    expect(duplicateDiff(ROOT)).toEqual({ unreconciled: [], unresolved: [] });
    expect(Object.keys(DUPLICATE_PINS)).toEqual(["Y5_FIRST_UNIT"]);
  });

  it("is a duplicate that genuinely agrees, checked here as well as by its own test", () => {
    // Duplication is not banned — the privacy registers keep their own copy rather than importing
    // a number from compliance — so what is required is that somebody tied them together.
    expect(ADM_Y5).toBe(RAIL_Y5);
  });

  it("reports a duplicate nothing reconciles", () => {
    plant("src/quality/w290-dupe-a.ts", "// W290: probe.\nexport const DUPE_AT_W290 = 1;\n");
    plant("src/quality/w290-dupe-b.ts", "// W290: probe.\nexport const DUPE_AT_W290 = 1;\n");
    expect(duplicateDiff(COPY).unreconciled).toEqual(["DUPE_AT_W290"]);
    rmSync(path.join(COPY, "src/quality/w290-dupe-a.ts"));
    rmSync(path.join(COPY, "src/quality/w290-dupe-b.ts"));
    expect(duplicateDiff(COPY).unreconciled).toEqual([]);
  });
});

describe("W290 what the sweep cannot see, measured per instance", () => {
  it("records all six, and admits it would have caught one of them", () => {
    // The honest half. "We swept for pins" and "we swept for the pins that have names" are
    // different claims, and a bound stated as a sentence is the one nobody checks.
    expect(HISTORY).toHaveLength(6);
    expect(HISTORY.map((h) => h.unit)).toEqual(["W260", "W273", "W274", "W282", "W285", "W287"]);
    expect(HISTORY.filter((h) => h.namedConstant)).toEqual([]);
    for (const instance of HISTORY) {
      expect(instance.what.length, `${instance.unit} says too little to learn from`).toBeGreaterThan(60);
    }
  });

  it("states the bound and names where the remedy belongs", () => {
    expect(SWEEP_BOUND).toMatch(/bare numeric literal/);
    expect(SWEEP_BOUND).toMatch(/W288/);
  });

  it("cites units the ledger has", () => {
    const ledger = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
    for (const instance of HISTORY) {
      expect(ledger, `${instance.unit} is not a unit`).toContain(`| ${instance.unit} |`);
    }
  });
});

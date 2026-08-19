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
import { REVIEWED_AT_W345 } from "./escape-hatches";
import { UNASKED_AT_W340 } from "./unasked-facts";
import { EXCLUDED_AT_W349, SURVIVORS_AT_W349 } from "./quarter-mutants-q26";
import { REMEDIES_AT_W357 } from "./unapplied-remedies";
import { PREMISES_AT_W358 } from "./spec-premises";
import { RESIDUE_AT_W359 } from "./spec-stores";
import { DRIVEN_AT_W355 } from "./defaulted-registers";
import { BLOCKED_AT_W263, blockedRows } from "./blocked-surface";
import { withPlantedIn } from "./planting";
import { UNPROVEN_AT_W290, walkUnproven } from "./register-census";
import { emptyListDiff } from "./empty-list-sweep";
import { SURVIVORS_AT_W296, UNTESTED_AT_W296, untestedModules } from "./mutation-sampling";
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

/**
 * Plant into the copy for the duration of the probe, and remove it whatever happens.
 *
 * W303 REPLACED AN UNSCOPED `plant()` HERE. It wrote the file and returned; the caller removed it
 * on the line after the assertions, so a FAILING assertion skipped the cleanup and left the probe
 * in the copied tree for every later test in this file — one real failure becoming a cascade of
 * unrelated ones. The scope is the fix: there is no way to plant here without a `finally`.
 */
function planted<T>(relPath: string, contents: string, probe: () => T): T {
  return withPlantedIn(COPY, { [relPath]: contents }, probe);
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
    expect(live.map((p) => p.name).sort()).toEqual([
      "BLOCKED_AT_W263",
      "DRIVEN_AT_W355",
      "EXCLUDED_AT_W349",
      "PREMISES_AT_W358",
      "REMEDIES_AT_W357",
      "RESIDUE_AT_W359",
      "REVIEWED_AT_W345",
      "SURVIVORS_AT_W296",
      "SURVIVORS_AT_W332",
      "SURVIVORS_AT_W349",
      "UNASKED_AT_W340",
      "UNEVIDENCED_AT_W293",
      "UNPROVEN_AT_W290",
      "UNTESTED_AT_W296",
    ]);
    // Each is asserted against the tree, so "live" is a fact rather than a label.
    expect(blockedRows(ROOT)).toHaveLength(BLOCKED_AT_W263);
    expect(walkUnproven().map((r) => r.file).sort()).toEqual([...UNPROVEN_AT_W290].sort());
    // W293's is the third, and it fires on the same kind of event: an empty-list assertion
    // arriving with no evidence its source can fill.
    expect(emptyListDiff(ROOT)).toEqual({ newlyUnevidenced: [], nowEvidenced: [] });
    // W296's two fire on the same kind of event one level further out: a change to a module that
    // its suite does not notice, and a module with no suite that could.
    expect(untestedModules(ROOT)).toEqual([...UNTESTED_AT_W296]);
    expect(SURVIVORS_AT_W296.length).toBeGreaterThan(0);
    // W345's is the sixth, and its event is a declaration that a check cannot be made to fail
    // arriving in any of the three registers that hold them — or leaving, because a conversion has
    // to say which way it went.
    // W345's and W340's are the sixth and seventh, and each is driven against the whole tree in
    // its OWN suite — `escape-hatches.test.ts` and `unasked-facts.test.ts`. Re-deriving both here
    // is the duplication W301 spent a unit removing, and it is not free: each is a walk of every
    // module in the tree, in a file eleven other assertions already read. What belongs here is the
    // property this describe block is about — that the pin is a named list rather than a figure,
    // so neither direction can be satisfied by retyping a digit.
    expect(REVIEWED_AT_W345.every((r) => r.id.includes("::"))).toBe(true);
    expect(UNASKED_AT_W340.every((f) => /^src\/.+\.ts::[A-Za-z0-9_]+$/.test(f.id))).toBe(true);
    // W349's two are the same class one quarter on, and both are named lists rather than figures:
    // a module the sweep cannot reach, and a mutant its suite did not catch.
    expect(EXCLUDED_AT_W349.every((e) => e.module.endsWith(".ts"))).toBe(true);
    expect(SURVIVORS_AT_W349.every((s) => s.id.includes(" :: "))).toBe(true);
    // W357's is the same class again and the strictest of the three: every row names a mutant and
    // the suite drives each one, so `applied` cannot be true by assertion.
    expect(REMEDIES_AT_W357.every((r) => r.id.includes(" :: "))).toBe(true);
    // W358's is the same class over a different population: one row per spec that stages a premise
    // through the browser, keyed by the spec's path rather than counted.
    expect(PREMISES_AT_W358.every((p) => /^e2e\/.+\.spec\.ts$/.test(p.spec))).toBe(true);
    // W359's is the same class again, keyed by a PAIR — the spec and the store it reads — because
    // one spec can owe an argument for more than one store and a spec-level row would hide that.
    expect(RESIDUE_AT_W359.every((r) => r.store.endsWith("/store.ts"))).toBe(true);
    // W355's is the same class over signatures rather than files: one row per defaulted parameter
    // driven from outside its own suite, keyed by `module::fn::position` and carrying the files.
    expect(DRIVEN_AT_W355.every((r) => r.parameter.split("::").length === 3)).toBe(true);
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
    // Asserted INSIDE the scope: the plant exists only for the probe now, and keeping the
    // assertion here also keeps both halves reading the same expression, which is what W293's
    // evidence check follows.
    planted("src/quality/w290-probe.ts", "// W290: probe.\nexport const REGISTERS_AT_W290 = 42;\n", () => {
      expect(pinDiff(COPY).undeclared).toContain("src/quality/w290-probe.ts::REGISTERS_AT_W290");
    });
    expect(pinDiff(COPY).undeclared, "the copied tree was dirty before the plant").toEqual([]);
  });

  it("reports a pin in a TEST file, which is where five of the six historically lived", () => {
    planted("src/quality/w290-probe.test.ts", "export const THINGS_AT_W290 = 7;\n", () => {
      expect(pinDiff(COPY).undeclared).toContain("src/quality/w290-probe.test.ts::THINGS_AT_W290");
    });
  });

  it("does not report a constant that is not pin-shaped", () => {
    // The other direction, and it earns its place: a detector matching every SCREAMING_CASE export
    // would report most of this tree and the register would become a chore nobody reads.
    planted("src/quality/w290-probe-plain.ts", "// W290: probe.\nexport const DEFAULT_TIMEOUT = 30;\n", () => {
      expect(pinDiff(COPY).undeclared).toEqual([]);
    });
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
    withPlantedIn(
      COPY,
      {
        "src/quality/w290-dupe-a.ts": "// W290: probe.\nexport const DUPE_AT_W290 = 1;\n",
        "src/quality/w290-dupe-b.ts": "// W290: probe.\nexport const DUPE_AT_W290 = 1;\n",
      },
      () => {
        expect(duplicateDiff(COPY).unreconciled).toEqual(["DUPE_AT_W290"]);
      },
    );
    expect(duplicateDiff(COPY).unreconciled).toEqual([]);
  });
});

describe("W290 what the sweep cannot see, measured per instance", () => {
  it("records all six, and admits it would have caught one of them", () => {
    // The honest half. "We swept for pins" and "we swept for the pins that have names" are
    // different claims, and a bound stated as a sentence is the one nobody checks.
    // W304: the count is gone; the line below names every instance, which is strictly stronger.
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

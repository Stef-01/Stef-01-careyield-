// W327 verify gate: "every check whose answer depends on repository state at the moment it runs
// enumerated, each driven in isolation and inside a full run, and a planted order-dependent check
// reported."
//
// "IN ISOLATION AND INSIDE A FULL RUN" IS DRIVEN AS QUIET AND DISTURBED, and that is a stronger
// reading rather than a weaker one. Re-running a suite until a race shows is what made PLANT-1 read
// as a flake for two firings; W322's row records the failing file being different every time. The
// state a racing worker would have created is planted instead, so the difference is deterministic
// and the answer is the same on every machine.

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTROLS,
  type Control,
  INSTANT_BOUND,
  SHARED_STATE,
  disturb,
  instantDiff,
} from "./instant";
import { copyTree } from "./planting";
import { fixtureFiles } from "./self-reference";
import { STATED_BOUNDS } from "./bounds";

const ROOT = process.cwd();

/** A copy to disturb, removed however the test ends. */
function inCopy<T>(probe: (copy: string) => T): T {
  const copy = copyTree(ROOT);
  try {
    return probe(copy);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

describe("W327 no control answers differently because the shared state moved", () => {
  it("agrees with the tree", () => {
    expect(instantDiff(ROOT), "a control's answer moved with state outside this tree").toEqual([]);
  });

  it("reports a planted control that moves and does not say so", () => {
    // THE GATE'S OWN WORDS. A control reading the installed dependencies, declared stable — which
    // is what `fixtureFiles` was until this unit.
    const planted: Control = {
      id: "src/planted/reads-the-install.ts::everything",
      reads: "the installed dependencies",
      instant: "x".repeat(40),
      cannotSee: "y".repeat(40),
      mayMove: false,
      run: (root) => (existsSync(path.join(root, "node_modules")) ? [1, 2] : [1]),
    };
    expect(instantDiff(ROOT, [planted]).map((d) => d.control)).toEqual([planted.id]);
  });

  it("reports the other direction: declared to move, and standing still", () => {
    // An exemption that outlived its reason. W102's shape, on a declaration rather than a list.
    const frozen: Control = {
      id: "src/planted/never-moves.ts::frozen",
      reads: "the working directory",
      instant: "x".repeat(40),
      cannotSee: "y".repeat(40),
      mayMove: true,
      run: () => [1],
    };
    expect(instantDiff(ROOT, [frozen]).map((d) => d.what)).toEqual([
      "is declared to move with the shared state and did not, at 1",
    ]);
  });

  it("is not vacuous: the disturbance really lands, and the tree really has controls to drive", () => {
    // A disturbance that wrote nothing would report every control stable, which is the reading that
    // makes this whole register worthless.
    inCopy((copy) => {
      expect(existsSync(path.join(copy, "node_modules"))).toBe(false);
      disturb(copy);
      expect(existsSync(path.join(copy, "node_modules/a-dependency/shipped.fixtures"))).toBe(true);
      expect(existsSync(path.join(copy, "coverage/report.ts"))).toBe(true);
    });
    expect(CONTROLS.filter((c) => c.run !== null).length).toBeGreaterThan(8);
  });
});

describe("W327 Q24-CR-7: the walk that answered about the installed dependencies", () => {
  it("no longer moves when a dependency ships a fixture file", () => {
    // THE FIX, DRIVEN AT THE FUNCTION. Before this unit `fixtureFiles` recursed from the root with
    // no exclusions, so this planted file was returned and the count went from one to two.
    inCopy((copy) => {
      const before = fixtureFiles(copy);
      mkdirSync(path.join(copy, "node_modules/a-dependency"), { recursive: true });
      writeFileSync(path.join(copy, "node_modules/a-dependency/shipped.fixtures"), "=== a ===\nb\n");
      expect(fixtureFiles(copy), "an install still reaches the fixture sweep").toEqual(before);
    });
  });

  it("still moves for a fixture file this tree actually holds, which is the half that must not break", () => {
    // W292'S PAIR. A walk narrowed until it sees nothing would pass the test above and destroy the
    // mechanism: the sweep for a SECOND fixture file is what holds `SELF_REFERENCE_BOUND` down.
    inCopy((copy) => {
      const before = fixtureFiles(copy);
      writeFileSync(path.join(copy, "src/quality/second.fixtures"), "=== a ===\nb\n");
      expect(fixtureFiles(copy).length, "the sweep stopped seeing first-party fixture files").toBe(
        before.length + 1,
      );
    });
  });

  it("keeps `SELF_REFERENCE_BOUND` open when a dependency ships one, and lifts it when this tree does", () => {
    // The consequence, at the bound rather than at the walk. This is what a red suite would have
    // been caused by: W297 reporting a stated bound stale because of a lockfile.
    const bound = STATED_BOUNDS.find((b) => b.name === "SELF_REFERENCE_BOUND")!;
    if (bound.lifting.kind !== "remedy") throw new Error("SELF_REFERENCE_BOUND stopped naming a remedy");
    const stillOpen = bound.lifting.stillOpen;
    inCopy((copy) => {
      expect(stillOpen(copy), "the bound is not open on an undisturbed copy").toBe(true);
      mkdirSync(path.join(copy, "node_modules/a-dependency"), { recursive: true });
      writeFileSync(path.join(copy, "node_modules/a-dependency/shipped.fixtures"), "=== a ===\nb\n");
      expect(stillOpen(copy), "a dependency lifted a stated bound").toBe(true);
      writeFileSync(path.join(copy, "src/quality/second.fixtures"), "=== a ===\nb\n");
      expect(stillOpen(copy), "a real second fixture file no longer lifts it").toBe(false);
    });
  });

  it("survives a broken symlink, which used to throw through the bound predicate", () => {
    inCopy((copy) => {
      const { symlinkSync } = require("node:fs") as typeof import("node:fs");
      symlinkSync(path.join(copy, "src/nothing-here"), path.join(copy, "src/dangling.ts"));
      expect(() => fixtureFiles(copy)).not.toThrow();
    });
  });
});

describe("W327 the register says what it is", () => {
  it("names an export each control really has, or says why it cannot be driven", () => {
    for (const control of CONTROLS) {
      const [module, name] = control.id.split("::");
      if (control.run === null) {
        // The undrivable one is a citation rather than a call, so what has to resolve is the module.
        expect(existsSync(path.join(ROOT, module!)), `${control.id} names no module`).toBe(true);
        continue;
      }
      const body = require("node:fs").readFileSync(path.join(ROOT, module!), "utf8") as string;
      expect(
        new RegExp(`export (function|const) ${name}\\b`).test(body),
        `${control.id} names an export ${module} does not have`,
      ).toBe(true);
    }
  });

  it("argues every control's instant and what that instant cannot see", () => {
    for (const control of CONTROLS) {
      expect(control.instant.length, `${control.id} does not say which instant it answers at`).toBeGreaterThan(
        30,
      );
      expect(control.cannotSee.length, `${control.id} does not say what that instant misses`).toBeGreaterThan(
        30,
      );
      expect(SHARED_STATE[control.reads], `${control.id} reads a state nobody argued`).toBeDefined();
    }
  });

  it("argues each kind of shared state once, and names a writer for each", () => {
    for (const [state, why] of Object.entries(SHARED_STATE)) {
      expect(why.length, `${state} is a class nobody argued`).toBeGreaterThan(250);
    }
    // NAMED, NOT COUNTED — W304's rule, and the first draft broke it with `.length).toBe(3)`.
    // A fourth kind of shared state is a thing somebody has to describe, not a digit to retype.
    expect(Object.keys(SHARED_STATE).sort()).toEqual([
      "the installed dependencies",
      "the machine",
      "the working directory",
    ]);
    expect(new Set(CONTROLS.map((c) => c.reads)).size, "a declared state nothing reads").toBeGreaterThan(1);
  });

  it("carries the control that cannot be driven, and says so rather than leaving it out", () => {
    // THE ONE THIS UNIT MOST WANTED TO DRIVE. Leaving it out would have made the register read as
    // complete; `run: null` makes the gap a row somebody can see.
    const undrivable = CONTROLS.filter((c) => c.run === null);
    expect(undrivable.map((c) => c.id)).toEqual(["src/quality/latent-findings.ts::PLANT-2"]);
    expect(undrivable[0]!.cannotSee).toContain("LATER in the same run");
  });

  it("states what it does not cover", () => {
    expect(INSTANT_BOUND).toContain("CANNOT BE DRIVEN");
    expect(INSTANT_BOUND).toContain("A COUNT IS NOT AN ANSWER");
    expect(INSTANT_BOUND.length).toBeGreaterThan(700);
  });
});

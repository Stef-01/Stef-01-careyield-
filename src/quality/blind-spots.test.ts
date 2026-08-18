// W295 verify gate: "every tree-checked register carries a stated bound, checked to name something
// the register genuinely cannot see; a bound that restates the register's job fails."
//
// "GENUINELY CANNOT SEE" IS PLANTED, NOT JUDGED. Each demonstrated bound carries a witness with the
// property the sentence describes, and the register must stay silent about it. That makes the
// gate's second clause mechanical: a bound restating the register's job would have, as its witness,
// exactly the input the register exists to report — so the plant produces a hit and the bound is
// reported false. Nothing here scores vocabulary or overlaps prose, which is the detector W279
// refused to tune a quarter earlier.
//
// The mechanism is driven both ways in this file: a fabricated bound whose witness IS reported must
// come back false, and the eleven real ones must not.

import { describe, expect, it } from "vitest";
import {
  BLIND_SPOTS,
  BLIND_SPOT_BOUND,
  type Blindness,
  boundDiff,
  deadProbes,
  falseBounds,
} from "./blind-spots";
import { TREE_DERIVED_REGISTERS } from "./register-census";

const entries = Object.entries(BLIND_SPOTS);
const ofKind = (kind: Blindness["kind"]) => entries.filter(([, b]) => b.kind === kind);

describe("W295 every register in the census states what it cannot see", () => {
  it("covers the census in both directions", () => {
    // A register with no bound is the whole gap; a bound for a register that is gone is the
    // direction nobody catches, and it is what turns a register from incomplete into misleading.
    expect(boundDiff()).toEqual({ unstated: [], stale: [] });
    expect(entries).toHaveLength(TREE_DERIVED_REGISTERS.length);
    expect(entries.length).toBeGreaterThan(40);
  });

  it("states each bound as a sentence with something in it", () => {
    for (const [file, spot] of entries) {
      expect(spot.bound.length, `${file} states no bound`).toBeGreaterThan(100);
      if (spot.kind === "demonstrated") {
        expect(spot.witness.length, `${file} names no witness`).toBeGreaterThan(30);
        expect(spot.control.length, `${file} names no positive control`).toBeGreaterThan(30);
      } else {
        expect(spot.whyNotPlantable.length, `${file} is unplanted without a reason`).toBeGreaterThan(120);
      }
    }
  });

  it("reports a census entry that has no bound, so the census check is not decorative", () => {
    // Driven rather than read: the diff takes both sides, so it can be handed a census entry the
    // register does not cover and one the census no longer has.
    expect(boundDiff(BLIND_SPOTS, [{ file: "src/w295-probe.ts" }]).unstated).toEqual([
      "src/w295-probe.ts",
    ]);
    expect(boundDiff({ "src/gone.ts": BLIND_SPOTS["src/quality/pins.ts"]! }, []).stale).toEqual([
      "src/gone.ts",
    ]);
  });
});

describe("W295 a stated bound is planted, and the register stays silent", () => {
  it("demonstrates every bound it can, and none of them is refuted", () => {
    // THE UNIT. Each witness has the property its bound describes and is otherwise ordinary code;
    // the register must not report it. A hit means the sentence is false — either the register can
    // see the shape after all, or the sentence was describing what the register already does.
    expect(falseBounds(), "a register reports the shape its bound says it cannot see").toEqual([]);
    // W296: was `toHaveLength(11)` and moved on the first register added after this unit landed.
    // Fourth instance this quarter of the count-that-ordinary-work-moves shape W290 named, and the
    // same restatement: the property is that MOST bounds are demonstrated rather than merely
    // asserted, and `falseBounds()` above is what reads every one of them.
    expect(ofKind("demonstrated").length).toBeGreaterThanOrEqual(11);
    // AND THE CONTROL, which is what makes the silence above mean anything: each probe plants an
    // ordinary positive beside its witness, and the register must report THAT. A tree the detector
    // cannot read is silent about everything and would pass the assertion above on its own.
    expect(deadProbes(), "a probe's positive control went unseen, so nothing was demonstrated").toEqual([]);
  });

  it("reports a bound that restates the register's job, which is the gate's second clause", () => {
    // The discriminator, driven. This bound claims the census cannot see a module that walks with
    // `readdirSync` — which is precisely what it exists to find — so its witness is reported and the
    // bound comes back false. No prose is inspected to reach that answer.
    const restated: Record<string, Blindness> = {
      "src/quality/register-census.ts": {
        kind: "demonstrated",
        bound: "x".repeat(120),
        witness: "a module that walks the tree with readdirSync, which is the register's own subject",
        control: "the same module, which the register also reports",
        probe: () => ({ witnessSeen: true, controlSeen: true }),
      },
    };
    expect(falseBounds(restated)).toEqual([
      "src/quality/register-census.ts: the register reports its own stated blind spot, so the bound is false",
    ]);
  });

  it("reports a probe whose control went unseen, so a dead plant cannot pass as a demonstration", () => {
    // The control mechanism, driven. A detector that reported nothing at all — because the tree it
    // was pointed at is empty, or the scan never descended — has demonstrated nothing, and saying
    // so is the difference between this unit and a page of plausible sentences.
    const dead: Record<string, Blindness> = {
      "src/w295-probe.ts": {
        kind: "demonstrated",
        bound: "x".repeat(120),
        witness: "a witness",
        control: "a control",
        probe: () => ({ witnessSeen: false, controlSeen: false }),
      },
    };
    expect(deadProbes(dead)).toEqual([
      "src/w295-probe.ts: the control went unseen, so the detector was not running at all",
    ]);
    expect(falseBounds(dead), "a dead probe must not also read as a false bound").toEqual([]);
  });

  it("does not report a bound whose witness goes unseen, so the two answers differ", () => {
    // Non-vacuity for the check above: if `falseBounds` reported everything, the clean result over
    // the real eleven would be what a broken discriminator says too.
    const honest: Record<string, Blindness> = {
      "src/w295-probe.ts": {
        kind: "demonstrated",
        bound: "x".repeat(120),
        witness: "a witness nothing reports",
        control: "a control the detector does report",
        probe: () => ({ witnessSeen: false, controlSeen: true }),
      },
    };
    expect(falseBounds(honest)).toEqual([]);
  });

  it("counts an unplanted bound as unplanted rather than as demonstrated", () => {
    // The cheap way to a clean run would be to declare every bound `undemonstrated`, so the
    // undemonstrated side is CAPPED and each entry carries the reason it cannot be planted.
    //
    // W317 CONVERTED THIS FROM AN EQUALITY AND RAISED IT BY ONE. An equality here was a pinned
    // count that ordinary work moves — the class W304 removed — inside the register whose subject
    // is what a check cannot see, and it fired on a legitimate addition. A CEILING is what it
    // meant: growth is the regression, exactly as W304 argued for the acceptance registers, and
    // raising it is a deliberate act somebody has to write a reason for. The reason for this one:
    // W317 attempted a witness for its own bound, found the fixture was REPORTED rather than
    // missed, and recorded the attempt as `undemonstrated` instead of shipping a witness that
    // refutes the sentence it was meant to support.
    //
    // W345 RATCHETED IT BACK DOWN TO 35, which is what a ceiling is for. Three entries were behind
    // `NOT_CALLABLE` while their module exported a detector taking a root; each is now demonstrated
    // by a plant, and leaving the ceiling at 38 would have left room for them to drift back without
    // anybody writing a reason.
    //
    // W341 RAISED IT TO 36, and the reason is the kind a ceiling exists to make somebody write:
    // `private-copies.test.ts` is a PROVING file — it plants trees in front of the shared
    // recursion and exports nothing — so it joins `page-suite.test.ts` and `register-census.test.ts`
    // behind `NOT_CALLABLE` for the reason that sentence states rather than for a bound nobody
    // tried to demonstrate. The register it proves is demonstrated in the same commit, so the
    // count moved by one and the demonstrated count moved by one with it.
    expect(ofKind("undemonstrated").length).toBeLessThanOrEqual(36);
    expect(falseBounds(Object.fromEntries(ofKind("undemonstrated")))).toEqual([]);
  });
});

describe("W295 the register is subject to its own rule", () => {
  it("states its own bound rather than exempting itself", () => {
    // W201's rule: the one exclusion a register allows is the one it states. A unit about what
    // registers cannot see, silent about what IT cannot see, would be the clearest possible case.
    expect(BLIND_SPOT_BOUND).toContain("does not enumerate");
    expect(BLIND_SPOT_BOUND, "the bound does not admit a witness could pass for the wrong reason").toContain(
      "for the wrong reason",
    );
    expect(BLIND_SPOT_BOUND.length).toBeGreaterThan(500);
  });
});

// W297 verify gate: "each declared bound resolved to the unit that stated it and the remedy it
// names; a bound whose remedy has since been built fails as stale."
//
// RESOLVED MEANS READ BACK. The unit is checked against the ledger AND against the module's own
// `// W<n>` header, so a bound cannot be attributed to a unit that did not write the module; the
// remedy is checked to appear in the sentence it summarises, so the register cannot describe a
// remedy the bound never named. Both are citations, and W284's lesson is that an unresolved one
// reads as coverage.
//
// AND STALENESS IS RE-DERIVED, NOT REMEMBERED. Each remedy carries a predicate that reads the tree
// for the change it names — an AST import, a failing-read spec, a comparison still welded inside a
// test file — so the day somebody builds one, the sentence fails here rather than being noticed by
// a reader two quarters later. `RUNTIME_BOUND` is the precedent: W287 corrected a false claim in it
// by hand.
//
// The numbers rule is the second half and it caught three live defects, all in bounds written
// between one and four units before this one.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  BOUNDS_BOUND,
  STATED_BOUNDS,
  type StatedBound,
  boundsInTree,
  numberDefects,
  numberWordsIn,
  staleBounds,
  unresolvedBounds,
} from "./bounds";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const id = (b: StatedBound) => `${b.module}::${b.name}`;

describe("W297 the register covers every bound the tree states", () => {
  it("agrees with the tree in both directions", () => {
    // A bound added tomorrow arrives failing; a declared bound whose export is gone fails too, and
    // the second is the direction that turns a register from incomplete into misleading.
    expect(boundsInTree(ROOT)).toEqual([...STATED_BOUNDS].map(id).sort());
    expect(STATED_BOUNDS.length).toBeGreaterThan(6);
  });

  it("keys by module and name, because two modules export the same one", () => {
    // `pins.ts` and `tautology-sweep.ts` both export `SWEEP_BOUND`, so a register keyed by name
    // would silently hold one of them and report the other missing.
    const names = STATED_BOUNDS.map((b) => b.name);
    expect(names.filter((n) => n === "SWEEP_BOUND")).toHaveLength(2);
    expect(new Set(STATED_BOUNDS.map(id)).size).toBe(STATED_BOUNDS.length);
  });
});

describe("W297 every bound resolves to its unit and to its remedy", () => {
  it("resolves all of them", () => {
    expect(unresolvedBounds(ROOT, LEDGER)).toEqual([]);
  });

  it("reports a unit the ledger does not have, one the header contradicts, and an absent remedy", () => {
    // All three arms driven, because they fail differently: an invented unit, a real unit attached
    // to somebody else's module, and a remedy summarised from memory rather than from the sentence.
    const real = STATED_BOUNDS.find((b) => b.lifting.kind === "remedy")!;
    const invented = unresolvedBounds(ROOT, LEDGER, [{ ...real, unit: "W9999" }]);
    expect(invented.some((d) => d.what.includes("the ledger does not have"))).toBe(true);
    const misattributed = unresolvedBounds(ROOT, LEDGER, [{ ...real, unit: "W1" }]);
    expect(misattributed.some((d) => d.what.includes("the module's header says"))).toBe(true);
    const noRemedy = unresolvedBounds(ROOT, LEDGER, [
      { ...real, lifting: { kind: "remedy", remedy: "a phrase nobody wrote", reads: "x", stillOpen: () => true } },
    ]);
    expect(noRemedy.some((d) => d.what.includes("a remedy the sentence does not contain"))).toBe(true);
  });

  it("says what each predicate reads, so one that stopped meaning anything is visible", () => {
    for (const bound of STATED_BOUNDS) {
      if (bound.lifting.kind !== "remedy") continue;
      expect(bound.lifting.reads.length, `${id(bound)} says nothing about what it reads`).toBeGreaterThan(30);
    }
  });
});

describe("W297 a bound whose remedy has been built fails as stale", () => {
  it("finds none stale today", () => {
    // THE UNIT. Each predicate re-derives the absence of the change its sentence names.
    expect(staleBounds(), "a bound describing a tree that no longer exists").toEqual([]);
    expect(STATED_BOUNDS.filter((b) => b.lifting.kind === "remedy").length).toBeGreaterThan(5);
  });

  it("reports one whose remedy has been built", () => {
    // Driven: the predicate is a function, so it can be handed one that says the change is done.
    const built: StatedBound[] = [
      {
        module: "src/probe.ts",
        name: "PROBE_BOUND",
        unit: "W297",
        text: "a sentence naming a remedy",
        lifting: { kind: "remedy", remedy: "a remedy", reads: "the tree", stillOpen: () => false },
        numbers: [],
      },
    ];
    expect(staleBounds(built)).toEqual([
      { bound: "src/probe.ts::PROBE_BOUND", what: "the remedy it names has been built: a remedy" },
    ]);
    expect(staleBounds([{ ...built[0]!, lifting: { ...built[0]!.lifting, stillOpen: () => true } as never }])).toEqual(
      [],
    );
  });

  it("keeps the no-remedy kind enumerated, so it is not the easy answer", () => {
    // An `inherent` bound can never go stale, which is precisely why it would be the cheap way out.
    const inherent = STATED_BOUNDS.filter((b) => b.lifting.kind === "inherent");
    expect(inherent).toHaveLength(1);
    for (const bound of inherent) {
      expect((bound.lifting as { why: string }).why.length, `${id(bound)} claims no remedy without an argument`).toBeGreaterThan(
        200,
      );
    }
  });
});

describe("W297 a bound states no total it does not re-derive", () => {
  it("declares every number-word in every bound", () => {
    // THE SECOND HALF, and it found three live defects: "thirteen executed" when seventeen were,
    // "the other thirty-three" when thirty-four were, "four are cited" when three were. All three
    // were mine, all three were written within four units of this one, and W288 had already fixed
    // the same defect in `FIXTURE_BOUND` — which is why the rule is enforced rather than restated.
    expect(numberDefects(), "a bound states a number nobody classified").toEqual([]);
  });

  it("reports an undeclared number and a declaration the sentence has dropped", () => {
    const bare: StatedBound = {
      module: "src/probe.ts",
      name: "PROBE_BOUND",
      unit: "W297",
      text: "This covers seventeen registers.",
      lifting: { kind: "inherent", why: "x".repeat(210) },
      numbers: [],
    };
    expect(numberDefects([bare])).toEqual([
      { bound: "src/probe.ts::PROBE_BOUND", what: 'states "seventeen" and does not say what it is' },
    ]);
    const dropped: StatedBound = {
      ...bare,
      text: "This covers the registers.",
      numbers: [{ word: "seventeen", kind: "rate", why: "gone" }],
    };
    expect(numberDefects([dropped])).toEqual([
      {
        bound: "src/probe.ts::PROBE_BOUND",
        what: 'declares "seventeen", which the sentence no longer uses',
      },
    ]);
  });

  it("refuses `total` as a kind at the type level, which is the rule itself", () => {
    // A declaration saying "this is a total" would make the rule optional, so there is no such kind
    // to declare. Every number in the tree's bounds is a rate, a gate-fixed number or a quotation.
    const kinds = new Set(STATED_BOUNDS.flatMap((b) => b.numbers.map((n) => n.kind)));
    expect([...kinds].sort()).toEqual(["fixed_by_a_gate", "rate", "unit_id"]);
    for (const bound of STATED_BOUNDS) {
      for (const n of bound.numbers) {
        expect(n.why.length, `${id(bound)} declares "${n.word}" without saying what it is`).toBeGreaterThan(60);
      }
    }
  });

  it("matches whole words, or `one` is found inside `none`", () => {
    // W269's near-miss, same fix. A scanner without word boundaries reports a number in every
    // sentence and the rule becomes noise nobody can satisfy.
    expect(numberWordsIn("none of them, often, tension")).toEqual([]);
    expect(numberWordsIn("one and Three and seventeen")).toEqual(["Three", "one", "seventeen"]);
  });
});

describe("W297 the register states its own bound", () => {
  it("says what resolving a bound does not prove, and states no total doing it", () => {
    expect(BOUNDS_BOUND).toContain("does not check that the sentence is TRUE");
    expect(numberWordsIn(BOUNDS_BOUND), "the bounds register's own bound counts something").toEqual([]);
    expect(BOUNDS_BOUND.length).toBeGreaterThan(400);
  });
});

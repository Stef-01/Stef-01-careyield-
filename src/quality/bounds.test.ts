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
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BOUNDS_BOUND,
  type Lifting,
  STATED_BOUNDS,
  type StatedBound,
  boundsInTree,
  liftedDefects,
  numberDefects,
  numberWordsIn,
  staleBounds,
  unresolvedBounds,
} from "./bounds";
import { type Plantable, withTree } from "./planting";

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
      {
        ...real,
        lifting: {
          kind: "remedy",
          remedy: "a phrase nobody wrote",
          reads: "x",
          stillOpen: () => true,
          lifted: { kind: "never_derived", why: "a probe" },
        },
      },
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
    expect(staleBounds(ROOT), "a bound describing a tree that no longer exists").toEqual([]);
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
        lifting: {
          kind: "remedy",
          remedy: "a remedy",
          reads: "the tree",
          stillOpen: () => false,
          lifted: { kind: "derived_without_a_tree", why: "a probe" },
        },
        numbers: [],
      },
    ];
    expect(staleBounds(ROOT, built)).toEqual([
      { bound: "src/probe.ts::PROBE_BOUND", what: "the remedy it names has been built: a remedy" },
    ]);
    expect(
      staleBounds(ROOT, [{ ...built[0]!, lifting: { ...built[0]!.lifting, stillOpen: () => true } as never }]),
    ).toEqual([]);
  });

  it("keeps the no-remedy kind enumerated, so it is not the easy answer", () => {
    // An `inherent` bound can never go stale, which is precisely why it would be the cheap way out.
    const inherent = STATED_BOUNDS.filter((b) => b.lifting.kind === "inherent");
    // W298: was `toHaveLength(1)`. The property is that `inherent` stays the EXCEPTION — it can
    // never go stale, which is what makes it the cheap answer — so it is checked against the
    // bounds that do name a remedy rather than against a number that moves whenever one is added.
    const withRemedy = STATED_BOUNDS.filter((b) => b.lifting.kind === "remedy");
    expect(inherent.length, "the no-remedy kind stopped being the exception").toBeLessThan(
      withRemedy.length,
    );
    for (const bound of inherent) {
      expect((bound.lifting as { why: string }).why.length, `${id(bound)} claims no remedy without an argument`).toBeGreaterThan(
        200,
      );
    }
  });
});

describe("W306 every predicate is driven in the state its bound says has not arrived", () => {
  const remedyOf = (b: StatedBound) => b.lifting as Extract<Lifting, { kind: "remedy" }>;
  const constructed = STATED_BOUNDS.filter(
    (b) => b.lifting.kind === "remedy" && b.lifting.lifted.kind === "constructed_tree",
  );
  const probe: StatedBound = {
    module: "src/probe.ts",
    name: "PROBE_BOUND",
    unit: "W306",
    text: "a sentence naming a remedy",
    lifting: {
      kind: "remedy",
      remedy: "a remedy",
      reads: "the tree",
      stillOpen: () => true,
      lifted: { kind: "derived_without_a_tree", why: "a probe" },
    },
    numbers: [],
  };

  it("sweeps every remedy against the claim its lifting declaration makes", () => {
    // `staleBounds` above says every remedy is still absent, which is also what a predicate that
    // had stopped reading anything would say — and before this unit there was no root to hand one
    // to find out, because the type took none and the filesystem predicates closed over
    // `process.cwd()`. Q23's hardening pass raised exactly that as CR-1.
    expect(liftedDefects(ROOT), "a predicate that cannot be seen answering the other way").toEqual([]);
  });

  it("plants a tree in which the remedy EXISTS and requires the bound to go stale on it", () => {
    // THE UNIT, and it is read separately from the sweep because a sweep over an empty set of
    // constructed trees passes in silence: `liftedDefects` decides nothing about what it is not
    // given, so the count of bounds carrying a tree is the assertion that it was given anything.
    expect(constructed.length, "no bound carries a tree that would lift it").toBeGreaterThan(3);
    for (const bound of constructed) {
      const { stillOpen, lifted } = remedyOf(bound);
      const files = (lifted as { files: Plantable }).files;
      // Both directions on the same predicate: open about this tree, lifted about the planted one.
      // Either half alone passes for a predicate stuck on a constant.
      expect(stillOpen(ROOT), `${id(bound)} reports its remedy already built here`).toBe(true);
      expect(
        withTree(files, (planted) => stillOpen(planted)),
        `${id(bound)} was handed a tree holding its remedy and still reports it absent`,
      ).toBe(false);
      // And the register's own reporter says so, on a real entry. Until this unit the `stale` arm
      // could only be reached by fabricating a bound whose predicate returned false by fiat.
      expect(
        withTree(files, (planted) => staleBounds(planted, [bound]).map((d) => d.bound)),
        `${id(bound)} does not report itself stale in its own lifted tree`,
      ).toEqual([id(bound)]);
    }
  });

  it("reports a fixture that does not lift, a predicate that budges, and a constant that is not one", () => {
    // All three arms, because they are three different lies a declaration can tell.
    const unlifted: StatedBound = {
      ...probe,
      lifting: {
        ...remedyOf(probe),
        lifted: { kind: "constructed_tree", files: { "src/probe.ts": "export const x = 1;\n" } },
      },
    };
    expect(liftedDefects(ROOT, [unlifted])).toEqual([
      {
        bound: "src/probe.ts::PROBE_BOUND",
        what: "reads a tree in which its remedy EXISTS and still reports it absent",
      },
    ]);

    const budges: StatedBound = {
      ...probe,
      lifting: { ...remedyOf(probe), stillOpen: (root) => existsSync(path.join(root, "BUILD-STATE.md")) },
    };
    expect(liftedDefects(ROOT, [budges])).toEqual([
      {
        bound: "src/probe.ts::PROBE_BOUND",
        what: "is declared derived_without_a_tree and answers differently for a different root",
      },
    ]);

    const notConstant: StatedBound = {
      ...probe,
      lifting: {
        ...remedyOf(probe),
        stillOpen: () => false,
        lifted: { kind: "never_derived", why: "a probe" },
      },
    };
    expect(liftedDefects(ROOT, [notConstant])).toEqual([
      {
        bound: "src/probe.ts::PROBE_BOUND",
        what: "is declared never_derived and is not the constant its declaration claims",
      },
    ]);
  });

  it("names the predicates that are the literal `true`, and keeps them the exception", () => {
    // W306 FOUND THESE RATHER THAN INTRODUCING THEM. Three bounds carried `stillOpen: () => true`
    // beside a `reads` field describing a derivation over test files or source — a staleness check
    // that had never had a way to fire, written to read exactly like the ones that do. The kind is
    // enumerated so they are argued and visible; the property beside it is that they stay rarer
    // than the bounds actually driven, which is the same shape as `inherent` above.
    const never = STATED_BOUNDS.filter(
      (b) => b.lifting.kind === "remedy" && b.lifting.lifted.kind === "never_derived",
    );
    expect(never.map(id).sort()).toEqual([
      "src/quality/citations.ts::CITATION_BOUND",
      "src/quality/planting.ts::PLANTING_BOUND",
      "src/quality/register-counts.ts::COUNT_BOUND",
    ]);
    expect(never.length, "the constant kind stopped being the exception").toBeLessThan(constructed.length);
    for (const bound of never) {
      const { reads, lifted } = remedyOf(bound);
      expect(reads, `${id(bound)} still claims to read something`).toContain("the constant `true`");
      expect((lifted as { why: string }).why.length, `${id(bound)} is a constant without an argument`).toBeGreaterThan(
        200,
      );
    }
  });

  it("argues every untreed predicate, so a fixture nobody wrote is not the same as one nobody can write", () => {
    // The kind most likely to become the easy answer: declaring a predicate untreeable is how a
    // bound avoids carrying a fixture. Each says what it reads instead, and `liftedDefects` checks
    // the claim by asking it again about roots it has never seen.
    for (const bound of STATED_BOUNDS) {
      if (bound.lifting.kind !== "remedy") continue;
      const { lifted } = remedyOf(bound);
      if (lifted.kind === "constructed_tree") continue;
      expect(lifted.why.length, `${id(bound)} claims no tree can lift it without saying why`).toBeGreaterThan(150);
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

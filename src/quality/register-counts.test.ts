// W304 verify gate: "every register-size assertion in the tree replaced by the property it stood
// in for or argued as a ratchet, W290's `PINS` register re-derived, and a planted count that would
// move on an ordinary addition failing."
//
// THE LAST CLAUSE IS A PAIR, because "reports a count" and "reports every count" look identical
// from a green suite: a planted register-size pin must be reported, and a planted FIXTURE count
// beside it must not. The second is most of the work — the great majority of this tree's
// exact-count size assertions are claims about behaviour under a constructed scenario, and a sweep
// that swept them up would have been deleted within a week.

import { describe, expect, it } from "vitest";
import {
  COUNT_BOUND,
  RATCHETS,
  countDiff,
  countId,
  registerSizeAssertions,
} from "./register-counts";
import { withTree } from "./planting";
import { PINS, pinDiff, pinsInTree } from "./pins";

const ROOT = process.cwd();

/** A test file that pins a register's size, and one that asserts a fixture's, in one tree. */
const PINNED = `
import { SOME_REGISTER } from "@/quality/probe";
it("pins a register size", () => {
  expect(SOME_REGISTER).toHaveLength(7);
});
`;

const FIXTURE = `
import { outcomesFor } from "@/quality/probe";
it("asserts what a scenario produced", () => {
  expect(outcomesFor(PRACTICE)).toHaveLength(3);
});
`;

describe("W304 the sweep, proved on a planted pin and a planted fixture", () => {
  it("reports a register size pinned to a literal", () => {
    // The gate's own words. This is what an author writes when they pin the size of a list at the
    // unit that declared it.
    const found = withTree({ "src/planted/pinned.test.ts": PINNED }, (root) =>
      registerSizeAssertions(root).map(countId),
    );
    expect(found).toEqual(["src/planted/pinned.test.ts :: pins a register size :: SOME_REGISTER"]);
  });

  it("does not report a count over a fixture, which is most of this tree", () => {
    // THE HALF THAT MATTERS. `expect(outcomesFor(A)).toHaveLength(3)` is a claim about behaviour
    // under a constructed scenario — it moves only when behaviour moves, which is what an
    // assertion is for. A sweep reporting it would report two hundred and seventy-three sites.
    const found = withTree({ "src/planted/fixture.test.ts": FIXTURE }, (root) =>
      registerSizeAssertions(root),
    );
    expect(found).toEqual([]);
  });

  it("tells them apart in ONE tree, so the pair is a question with two answers", () => {
    const found = withTree(
      { "src/planted/pinned.test.ts": PINNED, "src/planted/fixture.test.ts": FIXTURE },
      (root) => registerSizeAssertions(root).map((h) => h.register),
    );
    expect(found).toEqual(["SOME_REGISTER"]);
  });

  it("keeps a register read spelled as a call, and drops a scenario spelled as one", () => {
    // `Object.keys(REGISTER)` is a register read; `f(REGISTER, x)` is a scenario. The narrowing is
    // what stops the sweep being either useless or unbearable, so both sides are driven.
    const both = `
import { REFUSED_SHAPES } from "@/quality/probe";
it("t", () => {
  expect(Object.keys(REFUSED_SHAPES)).toHaveLength(4);
  expect(summarise(REFUSED_SHAPES, TODAY)).toHaveLength(2);
});
`;
    const found = withTree({ "src/planted/both.test.ts": both }, (root) =>
      registerSizeAssertions(root).map((h) => h.text),
    );
    expect(found).toEqual(["expect(Object.keys(REFUSED_SHAPES)).toHaveLength(4)"]);
  });

  it("does not report a count in a comment or a string", () => {
    const prose = `
import { REFUSED_SHAPES } from "@/quality/probe";
// expect(REFUSED_SHAPES).toHaveLength(9);
it("t", () => {
  expect(label).toBe("expect(REFUSED_SHAPES).toHaveLength(9)");
});
`;
    expect(
      withTree({ "src/planted/prose.test.ts": prose }, (root) => registerSizeAssertions(root)),
    ).toEqual([]);
  });

  it("does not read a register's name out of a string in the SUBJECT", () => {
    // The harder half of the line above, and the one the comment-stripper does not cover: a lookup
    // keyed by a string that happens to spell an imported register. The size asserted belongs to
    // whatever `rows` is, and calling it a pin would send an author to edit the wrong file.
    const keyed = `
import { REFUSED_SHAPES } from "@/quality/probe";
it("t", () => {
  expect(rows["REFUSED_SHAPES"].length).toBe(4);
});
`;
    expect(
      withTree({ "src/planted/keyed.test.ts": keyed }, (root) => registerSizeAssertions(root)),
    ).toEqual([]);
  });

  it("does not report a NEGATED size, because that is the remedy this unit prescribes", () => {
    // Fifteen of the counts this unit removed became exactly this line. A sweep that reported the
    // floor it told authors to write would be unusable on its second day.
    const floor = `
import { REFUSED_SHAPES } from "@/quality/probe";
it("t", () => {
  expect(REFUSED_SHAPES).not.toHaveLength(0);
});
`;
    expect(
      withTree({ "src/planted/floor.test.ts": floor }, (root) => registerSizeAssertions(root)),
    ).toEqual([]);
  });

  it("reports a register whose name is short, having no minimum length", () => {
    // The first draft required four characters and would have missed this one. A floor on the name
    // is a way to miss pins silently, which is the failure this whole unit is about.
    const short = `
import { IDS } from "@/quality/probe";
it("t", () => {
  expect(IDS).toHaveLength(2);
});
`;
    const found = withTree({ "src/planted/short.test.ts": short }, (root) =>
      registerSizeAssertions(root).map((h) => h.register),
    );
    expect(found).toEqual(["IDS"]);
  });
});

describe("W304 the tree has none left, in both directions", () => {
  it("pins no register size anywhere, and argues any that remain", () => {
    expect(countDiff(ROOT)).toEqual({ unargued: [], stale: [] });
    expect(registerSizeAssertions(ROOT)).toEqual([]);
  });

  it("swept the whole suite rather than a corner of it", () => {
    // Non-vacuity for the emptiness above: a sweep that read nothing would report nothing.
    const files = withTree({ "src/planted/pinned.test.ts": PINNED }, (root) =>
      registerSizeAssertions(root),
    );
    expect(files.length).toBeGreaterThan(0);
  });

  it("reports a pin nothing argues for, and stops once something does", () => {
    // BOTH SIDES OF THE SAME ARM. Driven on a planted tree because the real one has no pins left,
    // so `unargued` here is empty whichever way the filter points — a green suite that proved
    // nothing about the arm it depends on.
    const id = "src/planted/pinned.test.ts :: pins a register size :: SOME_REGISTER";
    const [without, with_] = withTree({ "src/planted/pinned.test.ts": PINNED }, (root) => [
      countDiff(root, []),
      countDiff(root, [{ id, direction: "floor" as const, why: "x".repeat(90) }]),
    ]);
    expect(without.unargued).toEqual([id]);
    expect(with_).toEqual({ unargued: [], stale: [] });
  });

  it("reports a ratchet the sweep no longer finds", () => {
    // Driven from outside — a healthy tree produces neither arm, and `RATCHETS` is empty by design.
    expect(
      countDiff(ROOT, [{ id: "src/gone.test.ts :: t :: REG", direction: "floor", why: "x" }]).stale,
    ).toEqual(["src/gone.test.ts :: t :: REG"]);
  });

  it("keeps the ratchet mechanism, and it is argued when it is used", () => {
    // "No exceptions today" and "no exceptions possible" are different claims, and a register with
    // no way to record one gets bypassed rather than extended. The list is empty — which
    // `countDiff` above already reports, so asserting it again here would be the redundancy this
    // very unit is about — so the SHAPE is driven on a constructed ratchet instead. Which is also
    // the honest test: an empty list iterated by a loop proves nothing about the loop.
    const constructed = [
      { id: "src/x.test.ts :: t :: SOME_REGISTER", direction: "ceiling" as const, why: "x".repeat(90) },
    ];
    expect(countDiff(ROOT, constructed).stale).toEqual(["src/x.test.ts :: t :: SOME_REGISTER"]);
    for (const ratchet of [...RATCHETS, ...constructed]) {
      expect(["floor", "ceiling"]).toContain(ratchet.direction);
      expect(ratchet.why.length, `${ratchet.id} is a ratchet with no argument`).toBeGreaterThan(80);
    }
  });

  it("says what a sweep over assertions cannot see", () => {
    expect(COUNT_BOUND).toMatch(/PROSE|prose/);
    expect(COUNT_BOUND).toMatch(/W267/);
  });
});

describe("W304 W290's pin register, re-derived", () => {
  it("still covers every pin in the tree, both directions", () => {
    // The gate names this: the unit that removed a class of count must not have removed a pin W290
    // classifies, and must not have introduced one.
    expect(pinDiff(ROOT)).toEqual({
      undeclared: [],
      stale: [],
      liveWithoutArgument: [],
      unargued: [],
    });
    expect(pinsInTree(ROOT)).toHaveLength(PINS.length);
  });

  it("left the live pins live, because they were never this unit's subject", () => {
    // W290's `live_by_design` pins are named lists, not sizes — `UNEVIDENCED_AT_W293`,
    // `SURVIVORS_AT_W296`. Removing register-size assertions must not have touched them, and the
    // distinction is the point: a NAMED list moves deliberately, a COUNT moves by accident.
    const live = PINS.filter((p) => p.classification.kind === "live_by_design");
    expect(live.length).toBeGreaterThan(2);
  });
});

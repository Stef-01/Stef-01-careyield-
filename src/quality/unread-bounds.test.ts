// W339 verify gate: "every stated bound's sentence read for a condition it names and no register
// checks, each one either given a check or declared unreadable with its reason, and the two W331
// found driven as a pair."
//
// THE PAIR IS DRIVEN ON THE CHECKS THAT NOW READ THEM, not on the sentences. Both conditions were
// accurate when written and stayed unread for a quarter; what makes them answered is that
// something reports the condition today, so the drives make those checks SPEAK about the state the
// bound described rather than asserting that a row exists.

import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  GAP_PHRASES,
  NAMED_CONDITIONS,
  type NamedCondition,
  UNREAD_BOUND,
  UNREAD_RULE,
  boundsNamingAGap,
  conditionDefects,
} from "./unread-bounds";
import { STATED_BOUNDS, type StatedBound } from "./bounds";
import { artefactsPresent } from "./repository-clean";
import { planterDiff } from "./planting";
import { copyTree } from "./planting";

const ROOT = process.cwd();

/** A bound built to name a gap, for the arms that need one the tree does not hold. */
const planted = (text: string, name = "PLANTED_BOUND"): StatedBound => ({
  module: "src/planted/probe.ts",
  name,
  unit: "W339",
  text,
  lifting: { kind: "inherent", why: "x".repeat(210) },
  numbers: [],
});

describe("W339 every bound that names a gap says whether anything reads it", () => {
  it("agrees with the tree, in four directions", () => {
    expect(conditionDefects(ROOT, STATED_BOUNDS), "a bound names a gap and nothing says who reads it").toEqual(
      [],
    );
  });

  it("is not vacuous: the tree really is full of bounds naming gaps", () => {
    // Nineteen of the tree's bounds, and a scan finding none would pass every assertion below.
    expect(boundsNamingAGap(STATED_BOUNDS).length).toBeGreaterThan(10);
    expect(NAMED_CONDITIONS.length).toBeGreaterThan(boundsNamingAGap(STATED_BOUNDS).length);
    expect(boundsNamingAGap([planted("This says nothing about anything.")]), "a bound with no gap phrase").toEqual(
      [],
    );
  });

  it("reports a bound naming a gap that nobody has classified", () => {
    const found = conditionDefects(ROOT, [...STATED_BOUNDS, planted("A shape nobody wrote is invisible to it.")]);
    expect(found).toEqual([
      { bound: "src/planted/probe.ts::PLANTED_BOUND", what: "names a gap and no row says whether anything reads it" },
    ]);
  });

  it("reports a row whose bound no longer says what it quotes", () => {
    const rows: NamedCondition[] = [
      {
        bound: "src/planted/probe.ts::PLANTED_BOUND",
        condition: "a sentence the bound has since dropped",
        reading: { kind: "not_observable", why: "y".repeat(80) },
      },
    ];
    const found = conditionDefects(ROOT, [planted("A shape nobody wrote is invisible to it.")], rows);
    expect(found.map((d) => d.what)).toEqual([
      'quotes a condition the bound no longer states: "a sentence the bound has since dropped"',
    ]);
  });

  it("reports a row for a bound the tree does not state", () => {
    const rows: NamedCondition[] = [
      {
        bound: "src/planted/gone.ts::GONE_BOUND",
        condition: "anything",
        reading: { kind: "not_observable", why: "y".repeat(80) },
      },
    ];
    expect(conditionDefects(ROOT, STATED_BOUNDS, rows).map((d) => d.what)).toContain(
      "is a row here and the tree states no such bound",
    );
  });

  it("reports a `read_by` naming an export the module does not have", () => {
    const rows: NamedCondition[] = [
      {
        bound: "src/planted/probe.ts::PLANTED_BOUND",
        condition: "invisible",
        reading: { kind: "read_by", check: "src/quality/planting.ts::noSuchCheck", how: "y".repeat(80) },
      },
    ];
    const found = conditionDefects(ROOT, [planted("invisible")], rows);
    expect(found.map((d) => d.what)).toContain(
      "is read by `src/quality/planting.ts::noSuchCheck`, which src/quality/planting.ts does not export",
    );
  });
});

describe("W339 the two the quarter walked through, driven on the checks that read them now", () => {
  const RESIDUE = path.join(ROOT, "src/planted");

  afterEach(() => {
    if (existsSync(RESIDUE)) rmSync(RESIDUE, { recursive: true, force: true });
  });

  it("W331's: the leaked temporary directory, which no register read", () => {
    // `PLANTING_BOUND` said a suite forgetting its `afterAll` leaks a temp directory and nothing
    // reads it. Four callers had forgotten and the box held 426 copies. What answers it now is
    // W331's artefact sweep — driven here by creating the artefact it looks for and requiring it
    // to speak, then removing it.
    expect(artefactsPresent(ROOT), "the tree is not clean before the drive").toEqual([]);
    mkdirSync(RESIDUE, { recursive: true });
    expect(artefactsPresent(ROOT), "the sweep says nothing about a residue it exists to find").not.toEqual(
      [],
    );
    rmSync(RESIDUE, { recursive: true, force: true });
    expect(artefactsPresent(ROOT)).toEqual([]);
    // And the row says so, quoting the bound's own sentence.
    const row = NAMED_CONDITIONS.find((c) => c.condition.includes("forgets its `afterAll`"))!;
    expect(row.reading.kind).toBe("read_by");
  });

  it("W328's: the non-test module the plant sweep could not see", () => {
    // `PLANTING_BOUND` said a helper in a non-test module was invisible to it, and W322's write came
    // from two register modules — the excused class exactly. W328 widened the population, so a
    // non-test module that writes is reported unless it is declared.
    const copy = copyTree(ROOT, { directories: ["src"] });
    try {
      const diff = planterDiff(copy, {});
      expect(diff.undeclared, "the widened population sees no non-test writer").toContain(
        "src/quality/planting.ts",
      );
      expect(
        diff.undeclared.filter((f) => !f.endsWith(".test.ts")).length,
        "every writer it finds is a test file, so the widening bought nothing",
      ).toBeGreaterThan(1);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  });

  it("names both as read rather than owed, because both are", () => {
    const planting = NAMED_CONDITIONS.filter((c) => c.bound.endsWith("PLANTING_BOUND"));
    expect(planting.length, "the bound that produced this unit has no rows").toBeGreaterThan(2);
    expect(planting.filter((c) => c.reading.kind === "read_by")).toHaveLength(2);
  });
});

describe("W339 the register says what it is", () => {
  it("argues every reading, and every `owed` names a unit that can still answer", () => {
    for (const row of NAMED_CONDITIONS) {
      const argument =
        row.reading.kind === "read_by" ? row.reading.how : row.reading.why;
      expect(argument.length, `${row.bound} :: ${row.condition.slice(0, 40)} is unargued`).toBeGreaterThan(120);
    }
    // W329'S STANDING CHECK, BORROWED. A promise aimed at a unit that has landed is the defect W318
    // removed from deferrals, and a bound does not get to keep it.
    const ledger = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
    for (const row of NAMED_CONDITIONS) {
      const reading = row.reading;
      if (reading.kind !== "owed") continue;
      const line = ledger.split("\n").find((l) => l.startsWith(`| ${reading.by} | `));
      expect(line, `${reading.by} is owed a reading and is not a row`).toBeDefined();
      expect(line, `${reading.by} has landed and the condition is still owed`).not.toMatch(/^\| \w+ \| done \|/);
    }
  });

  it("keeps `not_observable` argued as the class it is, and carries its own row", () => {
    // The majority, and the one that can never go stale — W297's reason for enumerating `inherent`
    // and the same reason here.
    const unobservable = NAMED_CONDITIONS.filter((c) => c.reading.kind === "not_observable");
    expect(unobservable.length).toBeGreaterThan(NAMED_CONDITIONS.length / 2);
    expect(
      NAMED_CONDITIONS.some((c) => c.bound === "src/quality/unread-bounds.ts::UNREAD_BOUND"),
      "the register omits itself, which is the omission it reports",
    ).toBe(true);
  });

  it("states the rule for the judgement no scan makes", () => {
    expect(UNREAD_RULE).toContain("could a check be written");
    expect(UNREAD_RULE.length).toBeGreaterThan(600);
    expect(GAP_PHRASES.length).toBeGreaterThan(5);
  });

  it("states what it does not cover", () => {
    expect(UNREAD_BOUND).toContain("not_observable");
    expect(UNREAD_BOUND).toContain("W339 found to be");
    expect(UNREAD_BOUND.length).toBeGreaterThan(600);
  });
});

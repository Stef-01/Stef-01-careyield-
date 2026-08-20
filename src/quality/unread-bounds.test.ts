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
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  GAP_PHRASES,
  NAMED_CONDITIONS,
  type NamedCondition,
  UNREAD_BOUND,
  UNREAD_RULE,
  boundsNamingAGap,
  conditionDefects,
  staleOwedConditions,
} from "./unread-bounds";
import { STATED_BOUNDS, type StatedBound } from "./bounds";
import { artefactsPresent } from "./repository-clean";
import { planterDiff } from "./planting";
import { copyTree } from "./planting";
import { allLedgerRows } from "./blocked-surface";

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
  // W385: IN A COPY, NOT IN THE REPOSITORY. This drive used to create `src/planted` in the tree
  // itself — and so does `repository-clean.test.ts`, which owns the sweep. Two files, one path,
  // and the pool decides which runs first: whichever lost the race saw the other's directory in
  // its own `the tree is not clean before the drive` control and went red with nothing wrong.
  // `artefactsPresent` takes its root as a parameter, so a copy answers the same question and
  // shares nothing.
  const HOME = copyTree(ROOT, { directories: ["src"] });
  const RESIDUE = path.join(HOME, "src/planted");

  afterAll(() => rmSync(HOME, { recursive: true, force: true }));

  afterEach(() => {
    if (existsSync(RESIDUE)) rmSync(RESIDUE, { recursive: true, force: true });
  });

  it("W331's: the leaked temporary directory, which no register read", () => {
    // `PLANTING_BOUND` said a suite forgetting its `afterAll` leaks a temp directory and nothing
    // reads it. Four callers had forgotten and the box held 426 copies. What answers it now is
    // W331's artefact sweep — driven here by creating the artefact it looks for and requiring it
    // to speak, then removing it.
    expect(artefactsPresent(HOME), "the tree is not clean before the drive").toEqual([]);
    mkdirSync(RESIDUE, { recursive: true });
    expect(artefactsPresent(HOME), "the sweep says nothing about a residue it exists to find").not.toEqual(
      [],
    );
    rmSync(RESIDUE, { recursive: true, force: true });
    expect(artefactsPresent(HOME)).toEqual([]);
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
    // W341: the SHARED ledger parse. This read the row shape itself, which is the copy W310's fix
    // could not reach and W335 paid for twice.
    const rows = allLedgerRows(ROOT);
    for (const row of NAMED_CONDITIONS) {
      const reading = row.reading;
      if (reading.kind !== "owed") continue;
      const unit = rows.find((r) => r.id === reading.by);
      expect(unit, `${reading.by} is owed a reading and is not a row`).toBeDefined();
      expect(unit?.status, `${reading.by} has landed and the condition is still owed`).not.toBe("done");
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

describe("W370 the owed clock, made callable so a close can run it", () => {
  // W326's gate had nothing to call here: the comparison lived welded inside this suite, so a
  // promise going stale could only be found AFTER the close. It was, twice in one day. These drive
  // every branch of the lifted function against a ledger built for the purpose.
  const LEDGER_TEXT = [
    "| Unit | Status | Session | Claimed | SHA | What |",
    "| --- | --- | --- | --- | --- | --- |",
    "| W900 | done | builder-B | 2026-01-01T00:00Z | abc1234 | a landed row. |",
    "| W901 | claimed | builder-B | 2026-01-01T00:00Z | — | a row still in flight. |",
  ].join("\n");

  const owed = (by: `W${number}`): NamedCondition => ({
    bound: "src/planted/w370.ts::PLANTED_BOUND",
    condition: "a planted condition",
    reading: { kind: "owed", by, why: "a planted reason" },
  });

  it("reports a promise aimed at a unit that has landed", () => {
    expect(staleOwedConditions(LEDGER_TEXT, [owed("W900")])).toEqual([
      "src/planted/w370.ts::PLANTED_BOUND is owed a reading by W900, which has landed",
    ]);
  });

  it("says nothing about a promise aimed at a unit still in flight", () => {
    // The other direction, and the one that matters at a close: this is the state every live
    // promise is in, so a check that reported here would fail on every commit.
    expect(staleOwedConditions(LEDGER_TEXT, [owed("W901")])).toEqual([]);
  });

  it("reports a promise aimed at a unit the ledger does not hold at all", () => {
    expect(staleOwedConditions(LEDGER_TEXT, [owed("W999")])[0]).toContain("which is not a row");
  });

  it("looks at `owed` readings and nothing else", () => {
    const read: NamedCondition = {
      bound: "src/planted/w370.ts::PLANTED_BOUND",
      condition: "a planted condition",
      reading: { kind: "read_by", check: "src/planted/w370.ts::check", how: "a planted how" },
    };
    const never: NamedCondition = {
      bound: "src/planted/w370.ts::PLANTED_BOUND",
      condition: "a planted condition",
      reading: { kind: "not_observable", why: "a planted why" },
    };
    expect(staleOwedConditions(LEDGER_TEXT, [read, never])).toEqual([]);
    // And the same table WITH an owed row still reports, so the skip above is a filter rather than
    // a function that answers nothing.
    expect(staleOwedConditions(LEDGER_TEXT, [read, never, owed("W900")])).toHaveLength(1);
  });

  it("matches a promise to its own row and not to a neighbour", () => {
    // `r.id === reading.by`: with only W901 in flight, a promise aimed at W900 must still resolve
    // to W900's landed row rather than to whichever row the scan reached first.
    expect(staleOwedConditions(LEDGER_TEXT, [owed("W900"), owed("W901")])).toEqual([
      "src/planted/w370.ts::PLANTED_BOUND is owed a reading by W900, which has landed",
    ]);
  });
});

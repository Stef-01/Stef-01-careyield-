// W380: "the close is the moment nobody re-runs → verify: every check whose answer depends on a
// ledger row's status enumerated and driven at a simulated close; a check that passes before the
// close and fails after it is reported, and W326's own welded-check limit is closed or re-argued."
//
// THE LIVE RUN IS THE LAST TEST AND IT TAKES A MINUTE OR TWO. Everything above it is about the
// population and about whether the harness can report anything at all — which is what a reader
// should distrust first, because a harness that always answers "nothing flipped" and a tree where
// nothing flips are the same green.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  CLOSE_SENSITIVITY_BOUND,
  SENSITIVE_SUITES,
  type CloseSensitive,
  censusDefects,
  greenAgainst,
  readsARowStatus,
  RUNS_THE_HARNESS,
  runnableSuites,
  statusReadingSuites,
  hollowExcuses,
  suitesThatFlip,
  unsimulableCloses,
} from "./close-sensitivity";
import { type NamedCondition } from "./unread-bounds";
import { weldedLedgerTests } from "./close-gate";
import { closeRow } from "./closing-state";
import { copyTree, withPlantedInAsync } from "./planting";
import { parseLedgerRows } from "./blocked-surface";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
let COPY = "";

beforeAll(() => {
  COPY = copyTree(ROOT, { withNodeModules: true });
}, 180_000);

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

describe("W380 the suites a close could turn", () => {
  it("covers every one, and names none the derivation no longer holds", () => {
    expect(censusDefects(ROOT)).toEqual([]);
    // W293: both directions fire, on the same producer.
    expect(censusDefects(ROOT, SENSITIVE_SUITES.slice(1))).toHaveLength(1);
    expect(
      censusDefects(ROOT, [...SENSITIVE_SUITES, { suite: "src/quality/gone.test.ts" } as CloseSensitive]),
    ).toHaveLength(1);
  });

  it("is narrower than the files naming a ledger primitive, which is what makes it affordable", () => {
    // The bound's own claim, measured: running every welded file twice would be the whole tree.
    const welded = weldedLedgerTests(ROOT);
    const reading = statusReadingSuites(ROOT);
    expect(reading.length).toBeLessThan(welded.length);
    expect(reading.length).toBe(SENSITIVE_SUITES.length);
    // And the narrowing really excludes something: a file that names a primitive and reads no
    // status is in one population and not the other.
    expect(welded).toContain("src/quality/timelines.test.ts");
    expect(reading).not.toContain("src/quality/timelines.test.ts");
    expect(readsARowStatus(ROOT, "src/quality/horizon-q30.test.ts")).toBe(true);
  });

  it("subtracts its own suite, which it cannot run, and says so rather than filtering quietly", () => {
    // W349's recursion in a third register: this suite reads a row's status, so it joins its own
    // population. The first live run of this unit proved the point the hard way — a hundred vitest
    // processes and 15 GB of `/tmp`. The exclusion is named, still needs a row in the census, and
    // really removes something.
    expect(statusReadingSuites(ROOT)).toContain(RUNS_THE_HARNESS);
    expect(runnableSuites(ROOT)).not.toContain(RUNS_THE_HARNESS);
    expect(runnableSuites(ROOT)).toHaveLength(statusReadingSuites(ROOT).length - 1);
    expect(SENSITIVE_SUITES.map((s) => s.suite)).toContain(RUNS_THE_HARNESS);
  });

  it("says what each suite's answer turns on", () => {
    for (const entry of SENSITIVE_SUITES) {
      expect(entry.reads.length, `${entry.suite} says nothing about what it reads`).toBeGreaterThan(40);
    }
  });
});

describe("W380 the harness reports a flip, which is the only reason a green run means anything", () => {
  it("reports a suite that passes before a close and fails after it", async () => {
    // THE NON-VACUITY, and it is the whole test of the idea. A planted suite asserts that a
    // fabricated row is NOT done; closing that row turns it red; the harness must say so. Nothing
    // here is callable — the assertion is welded inside the plant, which is the point.
    const probe = "src/quality/close-probe.test.ts";
    const ledger = `${LEDGER}| W901 | claimed | builder-x | t | — | a planted row. |\n`;
    const found = await withPlantedInAsync(
      COPY,
      {
        [probe]:
          'import { readFileSync } from "node:fs";\n' +
          'import path from "node:path";\n' +
          'import { describe, expect, it } from "vitest";\n' +
          'describe("probe", () => {\n' +
          '  it("W901 has not landed", () => {\n' +
          '    const ledger = readFileSync(path.join(process.cwd(), "BUILD-STATE.md"), "utf8");\n' +
          '    expect(ledger).not.toContain("| W901 | done |");\n' +
          "  });\n" +
          "});\n",
      },
      async () => {
        // W293: BOUND HERE ON PURPOSE. The live arm below asserts `suitesThatFlip` is EMPTY, and
        // the sweep credits a witness by its producer — a `found` bound to `withPlantedInAsync`
        // evidences the planter, not the harness. This is the non-empty case for the same source.
        const flipped = await suitesThatFlip(COPY, ledger, [probe], "W901");
        expect(flipped, "the harness cannot see a check a close breaks").toEqual([probe]);
        return flipped;
      },
    );
    expect(found).toEqual([probe]);
  }, 300_000);

  it("does not report a suite the close leaves alone", async () => {
    const probe = "src/quality/close-probe.test.ts";
    const ledger = `${LEDGER}| W902 | claimed | builder-x | t | — | a planted row. |\n`;
    const found = await withPlantedInAsync(
      COPY,
      {
        [probe]:
          'import { describe, expect, it } from "vitest";\n' +
          'describe("probe", () => {\n  it("says nothing about the ledger", () => {\n    expect(1).toBe(1);\n  });\n});\n',
      },
      () => suitesThatFlip(COPY, ledger, [probe], "W902"),
    );
    expect(found, "the harness reports a suite a close does not touch").toEqual([]);
  }, 300_000);

  it("skips a suite that was already red, rather than calling it close-sensitive", async () => {
    // The flattering direction W354 is about, refused: a suite failing BEFORE the close has not
    // been turned by it, and reporting it would credit this harness with somebody else's break.
    const probe = "src/quality/close-probe.test.ts";
    const body =
      'import { describe, expect, it } from "vitest";\n' +
      'describe("probe", () => {\n  it("is red whatever the ledger says", () => {\n    expect(1).toBe(2);\n  });\n});\n';
    const found = await withPlantedInAsync(COPY, { [probe]: body }, () =>
      suitesThatFlip(COPY, LEDGER, [probe], "W903"),
    );
    expect(found).toEqual([]);
    // And the reading behind the skip is real: the suite really is red before anything is closed.
    expect(await withPlantedInAsync(COPY, { [probe]: body }, () => greenAgainst(COPY, LEDGER, probe))).toBe(false);
  }, 300_000);
});

describe("W380 the live tree, at a simulated close", () => {
  it(
    "closes each row in flight and turns no suite that reads a status",
    async () => {
      // W315's rule: ONE UNIT AT A TIME. Overlapping sessions are normal, so closing two rows
      // together would let one builder's defect read as the other's.
      // W392 FOUND THIS ARM DEPENDING ON THE FLEET'S TIMING, at a close, which is the class of
      // defect the whole register is about — pointed at the register. The guard below exists so a
      // green run cannot mean "nothing was closed", and it was written as `inFlight.length > 0`,
      // which is a fact about whether any OTHER session happens to hold a row at the moment the
      // gate runs. A quiet fleet is an ordinary state and it failed the build. A row of this
      // harness's own is planted when the tree has none, so what is closed is never nothing and
      // never depends on somebody else being awake.
      const live = parseLedgerRows(LEDGER)
        .filter((row) => row.status === "claimed")
        .map((row) => row.id);
      const PLANTED_ROW = "| W901 | claimed | builder-x | 2026-01-01T00:00Z | — | a planted row. |";
      const ledger = live.length > 0 ? LEDGER : `${LEDGER}${PLANTED_ROW}\n`;
      const inFlight = live.length > 0 ? live : ["W901"];
      expect(inFlight.length, "nothing was closed, so this check ran against nothing").toBeGreaterThan(0);
      // W380 RE-ARGUED THIS ARM ON ITS OWN CLOSE, and the exclusion is derived rather than listed.
      // A row a clock names as its discharger flips every suite that reads the clock, on every
      // run, because the discharge lives in that row's own diff and a planted ledger has none of
      // it. `unsimulableCloses` NAMES those rows; the arm below is about the others.
      for (const unit of inFlight) {
        const flipped = await suitesThatFlip(COPY, ledger, runnableSuites(ROOT), unit);
        const named = unsimulableCloses(ledger).filter((u) => u.unit === unit);
        if (named.length === 0) {
          expect(flipped, `closing ${unit} turns a suite that reads a row's status`).toEqual([]);
          continue;
        }
        // AND THE EXCLUSION HAS TO EARN ITSELF. A clock-named row is not waved through: it must
        // actually turn something, or the exclusion is covering nothing and belongs deleted. This
        // is the branch that keeps the arm from going quiet on a day when every row in flight is
        // clock-named — which is the day it would otherwise assert nothing at all.
        expect(
          hollowExcuses(named, flipped),
          `${unit} is excused by ${named.map((n) => n.bound).join(", ")} and turns nothing, so the excuse covers nothing`,
        ).toEqual([]);
      }
    },
    2_400_000,
  );

  it("names the rows whose close it cannot simulate, and stays silent when a clock names nobody in flight", () => {
    // W293: the arm above skips rows, so the skip needs same-producer evidence in BOTH directions
    // rather than a sentence. Driven on a planted ledger and planted clocks, so it says the same
    // thing on a day when no row in flight is owed anything.
    const ledger = [
      "| Unit | Status | Session | Claimed | SHA | What |",
      "| --- | --- | --- | --- | --- | --- |",
      "| W900 | claimed | builder-A | 2026-01-01T00:00Z | — | a row in flight a clock names. |",
      "| W901 | claimed | builder-B | 2026-01-01T00:00Z | — | a row in flight nothing names. |",
      "| W902 | done | builder-A | 2026-01-01T00:00Z | abc1234 | a landed row a clock names. |",
    ].join("\n");
    const owed = (by: `W${number}`): NamedCondition => ({
      bound: `src/planted/${by}.ts::PLANTED_BOUND`,
      condition: "a planted condition",
      reading: { kind: "owed", by, why: "a planted reason" },
    });
    // The row in flight that a clock names is excluded, and the bound that names it is carried so
    // a reader can go and look at the promise rather than take the exclusion on trust.
    expect(unsimulableCloses(ledger, [owed("W900")])).toEqual([
      { unit: "W900", bound: "src/planted/W900.ts::PLANTED_BOUND" },
    ]);
    // The other direction, twice. W901 is in flight and no clock names it, so the same call over
    // the same ledger leaves it out; and W902 is named by a clock but has already LANDED, so its
    // close is not being simulated at all and that promise is the one `close-gate.test.ts` reads
    // as a truth.
    expect(unsimulableCloses(ledger, [owed("W900")]).map((u) => u.unit)).not.toContain("W901");
    expect(unsimulableCloses(ledger, [owed("W902")])).toEqual([]);
    // And a clock reading that is not `owed` names nobody, so the filter is a filter.
    const readBy: NamedCondition = {
      bound: "src/planted/W900.ts::PLANTED_BOUND",
      condition: "a planted condition",
      reading: { kind: "read_by", check: "src/planted/W900.ts::check", how: "a planted how" },
    };
    expect(unsimulableCloses(ledger, [readBy])).toEqual([]);
  });

  it("refuses an excuse that covers nothing, which is the only thing keeping the skip honest", () => {
    const excused = [{ unit: "W900", bound: "src/planted/W900.ts::PLANTED_BOUND" }];
    // A row excused and turning NOTHING: the excuse is hollow and the arm must fail on it.
    expect(hollowExcuses(excused, [])).toEqual(["W900"]);
    // The same excuse over a row that really does turn a suite: earned, and silent.
    expect(hollowExcuses(excused, ["src/quality/unread-bounds.test.ts"])).toEqual([]);
    // And no excuse at all is not a hollow one — an empty answer for the right reason.
    expect(hollowExcuses([], [])).toEqual([]);
  });
});

describe("W380 the bound", () => {
  it("says the limit it closes and the one it buys", () => {
    expect(CLOSE_SENSITIVITY_BOUND).toContain("IT CLOSES W326's LIMIT AND BUYS A DIFFERENT ONE");
    expect(CLOSE_SENSITIVITY_BOUND).toContain("TEXT SCAN");
  });

  it("says it closes one row, and why", () => {
    expect(CLOSE_SENSITIVITY_BOUND).toContain("IT CLOSES ONE ROW");
  });

  it("says a pass/fail reading is not an attribution", () => {
    expect(CLOSE_SENSITIVITY_BOUND).toContain("NOT AN ATTRIBUTION");
  });

  it("keeps the close simulation shared rather than writing a second one", () => {
    // W341: `closeRow` is W315's, used rather than re-derived — this register writes no ledger
    // parse and no row rewriter of its own.
    expect(closeRow("| W1 | claimed | s | t | — | x |", "W1")).toContain("| W1 | done |");
    expect(readFileSync(path.join(ROOT, "src/quality/close-sensitivity.ts"), "utf8")).not.toContain(
      'cells[1] = "done"',
    );
  });
});

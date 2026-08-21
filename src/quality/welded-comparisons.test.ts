import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  WELDED_BOUND,
  WELDED_CHECKS,
  type WeldedCheck,
  weldedCensusDefects,
  weldedClassDefects,
  inherentlyWelded,
  movedOut,
  notComparisons,
  readsTheLiveLedger,
} from "./welded-comparisons";
import { LEDGER_READERS, weldedLedgerTests } from "./close-gate";
import { heldByOthers } from "./blocked-surface";
import { copyTree, withPlantedIn } from "./planting";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

describe("W379 the welded ledger checks, classified", () => {
  it("covers every one, and names none the derivation no longer holds", () => {
    expect(weldedCensusDefects(ROOT)).toEqual([]);
    // W293: both directions fire, on the same producer.
    expect(weldedCensusDefects(ROOT, WELDED_CHECKS.slice(1))).toHaveLength(1);
    expect(
      weldedCensusDefects(ROOT, [...WELDED_CHECKS, { file: "src/quality/gone.test.ts" } as WeldedCheck]),
    ).toHaveLength(1);
  });

  it("agrees with the tree about which files compare nothing, in both directions", () => {
    expect(weldedClassDefects(ROOT)).toEqual([]);
    // A row claiming it compares nothing while the file reads the live ledger.
    const hiding: WeldedCheck = {
      file: "src/quality/pins.test.ts",
      standing: { kind: "not_a_comparison", why: "a planted excuse" },
    };
    expect(weldedClassDefects(ROOT, [hiding])[0]?.what).toContain("reads the live ledger");
    // And the other way: a row claiming a comparison in a file that has none.
    const inventing: WeldedCheck = {
      file: "src/quality/timelines.test.ts",
      standing: { kind: "movable", change: "a planted change" },
    };
    expect(weldedClassDefects(ROOT, [inventing])[0]?.what).toContain("reads no live ledger");
  });

  it("re-derives the number W370 cited, and says how much of it was the wrong question", () => {
    // THE FINDING. W370's Q28-CR-1 quoted this population as `checks the close gate cannot call`.
    // The derivation behind it is `a file naming a ledger primitive`, which is wider: eleven of the
    // fifty-two compare nothing against the live ledger at all, and three of those PLANT a
    // fabricated one to drive an already-callable check — the pattern the gate wants, counted as
    // the defect.
    const population = weldedLedgerTests(ROOT);
    expect(population.length).toBe(WELDED_CHECKS.length);
    const comparing = population.filter((file) => readsTheLiveLedger(ROOT, file));
    expect(comparing.length).toBeLessThan(population.length);
    expect(notComparisons()).toHaveLength(population.length - comparing.length);
  });

  it("names the files whose comparison cannot leave a test, and argues each", () => {
    expect(inherentlyWelded()).toEqual([
      "src/quality/close-gate.test.ts",
      "src/quality/close-sensitivity.test.ts",
      "src/quality/closing-state.test.ts",
      "src/quality/welded-comparisons.test.ts",
    ]);
    for (const check of WELDED_CHECKS) {
      if (check.standing.kind !== "inherent") continue;
      expect(check.standing.why.length, `${check.file} is unargued`).toBeGreaterThan(200);
    }
  });

  it("gives every movable row the change that would move it", () => {
    for (const check of WELDED_CHECKS) {
      if (check.standing.kind !== "movable") continue;
      expect(check.standing.change.length, `${check.file} names no change`).toBeGreaterThan(60);
    }
  });
});

describe("W379 the one that was moved, which is the one that broke twice", () => {
  it("names the files it came out of and the export it went to", () => {
    expect(movedOut()).toEqual([
      "src/quality/horizon-q29.test.ts",
      "src/quality/horizon-q30.test.ts",
      // W390: the quarter after, calling the lifted comparison rather than writing a third copy —
      // which is what the move was for, and the first occasion since that shows it taking.
      "src/quality/horizon-q31.test.ts",
    ]);
    for (const check of WELDED_CHECKS) {
      if (check.standing.kind !== "moved") continue;
      const [module, name] = check.standing.to.split("::");
      const source = readFileSync(path.join(ROOT, module!), "utf8");
      expect(source, `${check.standing.to} is not exported`).toContain(`export function ${name}(`);
      // And the file it came out of now CALLS it rather than keeping a copy.
      expect(readFileSync(path.join(ROOT, check.file), "utf8"), `${check.file} kept its copy`).toContain(
        `${name}(`,
      );
    }
  });

  it("is registered with the close gate, which is the point of moving it", () => {
    // W379's own bound says these are two facts: a lifted function nobody registers is a comparison
    // in a nicer place.
    expect(LEDGER_READERS.map((r) => r.id)).toContain("src/quality/blocked-surface.ts::heldByOthers");
  });

  it("answers about a ledger that does not exist yet, which is why it can run at a close", () => {
    // The whole reason for taking TEXT. A row claimed by somebody else is reported; the closing
    // unit's own row is not; and a row the caller names as in flight is priced rather than missed.
    // A FABRICATED LEDGER, not the live one: the live tree has sibling rows genuinely in flight
    // while this runs, and an assertion over it would be about whichever session is working.
    const fabricated = [
      "| Unit | Status | Session | Claimed | SHA | What |",
      "| --- | --- | --- | --- | --- | --- |",
      "| W1 | claimed | builder-x | t | — | a row somebody else holds. |",
      "| W2 | claimed | builder-y | t | — | the closing row. |",
      "| W3 | done | builder-y | t | abc1234 | a landed row. |",
      "",
    ].join("\n");
    expect(heldByOthers(fabricated, 2)).toEqual(["W1"]);
    expect(heldByOthers(fabricated, 1), "the closing row is counted as somebody else's").toEqual([]);
    expect(heldByOthers(fabricated, 2, ["W1"]), "a named in-flight row is not subtracted").toEqual([]);
    // And a row ABOVE the closing unit is outside the window a horizon prices.
    expect(heldByOthers(fabricated, 0)).toEqual([]);
    // The live ledger, for the arm the close gate actually runs.
    expect(heldByOthers(LEDGER, 0)).toEqual([]);
  });

  it("reports a comparison that has come back inside a `.test.ts`", () => {
    // The arm the unit exists to keep: a suite that regrows a live-ledger comparison joins the
    // population, and a row saying it compares nothing is then contradicted.
    const copy = copyTree(ROOT, { directories: ["src"] });
    const regrown = withPlantedIn(
      copy,
      {
        "src/quality/timelines.test.ts":
          'import { readFileSync } from "node:fs";\n' +
          'import path from "node:path";\n' +
          'const ROOT = process.cwd();\n' +
          'export const ledger = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");\n',
      },
      () => weldedClassDefects(copy, [WELDED_CHECKS.find((c) => c.file === "src/quality/timelines.test.ts")!]),
    );
    expect(regrown[0]?.what).toContain("reads the live ledger");
  });
});

describe("W379 the bound", () => {
  it("says `movable` is a judgement and the largest class", () => {
    expect(WELDED_BOUND).toContain("`movable` IS A JUDGEMENT AND THE LARGEST CLASS");
    expect(WELDED_BOUND).toContain("the judgement is that the change COULD be run, not that it has been");
  });

  it("says the population is still a name scan", () => {
    expect(WELDED_BOUND).toContain("THE POPULATION IS STILL A NAME SCAN");
  });

  it("separates moving a comparison from running it at the close", () => {
    expect(WELDED_BOUND).toContain("MOVING A COMPARISON OUT IS NOT RUNNING IT AT THE CLOSE");
  });
});

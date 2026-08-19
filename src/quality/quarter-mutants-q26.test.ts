// W349 verify gate: "W332's full run over every module Q26 added, each survivor named with its
// kind and its argument, and the sampler's share of that population measured."
//
// THE RUN IS THE LAST TEST AND IT TAKES SEVEN MINUTES. Everything above it is about the population:
// which modules the quarter added, which two this harness cannot reach, and whether either excuse
// still describes the tree. Those arms are what a reader should distrust first — a sweep is honest
// about the mutants it runs and says nothing at all about the ones it never built.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  EXCLUDED_AT_W349,
  type Excluded,
  Q26_MUTANT_BOUND,
  QUARTER_AT_W349,
  SURVIVORS_AT_W349,
  populationDefects,
  q26Population,
} from "./quarter-mutants-q26";
import { FILE_IO, type UnitRange, quarterModules, quarterMutants, runMutants, sampledShare } from "./quarter-mutants";
import { OPERATORS, samplingReport, siblingSuite } from "./mutation-sampling";
import { copyTree, withTree } from "./planting";
import { parseLedgerRows } from "./blocked-surface";

const pexec = promisify(execFile);
const ROOT = process.cwd();
let COPY = "";

beforeAll(() => {
  COPY = copyTree(ROOT, { withNodeModules: true });
}, 180_000);

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

describe("W349 the population is Q26's own modules, minus the two the harness cannot reach", () => {
  it("agrees with the tree in three directions", () => {
    expect(populationDefects(ROOT)).toEqual([]);
  });

  it("takes its range from the ledger rather than trusting the constant", () => {
    const ids = new Set(parseLedgerRows(readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8")).map((r) => r.id));
    expect([...ids]).toContain(`W${QUARTER_AT_W349.first}`);
    expect([...ids]).toContain(`W${QUARTER_AT_W349.last}`);
  });

  it("is smaller than what the quarter added, and says by how much", () => {
    const added = quarterModules(ROOT, QUARTER_AT_W349);
    const run = q26Population(ROOT);
    expect(added.length - run.length).toBe(EXCLUDED_AT_W349.length);
    // The quarter really did add more than the last one, which is the ratio the bound argues from.
    expect(added.length).toBeGreaterThan(quarterModules(ROOT).length);
  });

  it("reports a module the quarter added that nothing measures and nothing excuses", () => {
    expect(populationDefects(ROOT, [EXCLUDED_AT_W349[0]!])).toEqual([
      {
        module: "src/console/setup-gaps.ts",
        what: "is in the quarter, has no sibling suite, and nothing excuses it",
      },
    ]);
  });

  it("reports an excusal for a module the quarter no longer holds", () => {
    const gone: Excluded[] = [{ ...EXCLUDED_AT_W349[0]!, module: "src/quality/pins.ts" }];
    expect(populationDefects(ROOT, gone).filter((d) => d.module === "src/quality/pins.ts")).toEqual([
      { module: "src/quality/pins.ts", what: "is excused from the sweep and the quarter did not add it" },
    ]);
  });

  it("reports an excusal whose own claim the tree contradicts, which is the arm that matters", () => {
    // A module pleading that its suite runs the sweep, naming a suite that does not. Without this
    // arm `runs_the_sweep` is the cheap way to shorten any run somebody finds slow.
    const lying: Excluded[] = [
      {
        module: "src/quality/controls.ts",
        reason: { kind: "runs_the_sweep", suite: "src/quality/controls.test.ts", why: "x".repeat(80) },
      },
    ];
    expect(populationDefects(ROOT, lying).filter((d) => d.module === "src/quality/controls.ts")).toEqual([
      {
        module: "src/quality/controls.ts",
        what: "is excused because src/quality/controls.test.ts runs the sweep, and it does not",
      },
    ]);
  });

  it("reports a no-suite excusal for a module that has one", () => {
    const wrong: Excluded[] = [
      {
        module: "src/quality/instant.ts",
        reason: { kind: "no_sibling_suite", testedFrom: "somewhere", why: "x".repeat(80) },
      },
    ];
    expect(populationDefects(ROOT, wrong).filter((d) => d.module === "src/quality/instant.ts")).toEqual([
      {
        module: "src/quality/instant.ts",
        what: "is excused as having no sibling suite, and src/quality/instant.test.ts is one",
      },
    ]);
  });

  it("derives membership from the header rather than from a list, on a planted pair", () => {
    // The rule the bound names, driven: a module whose header claims a unit OUTSIDE the range is
    // not in the quarter however it is spelled, and one inside it is. Planted rather than read,
    // because a population derived from a list would pass every other test in this file.
    const found = withTree(
      {
        "src/planted/inside.ts": '// W330: a module Q26 added.\nimport path from "node:path";\nexport const a = path;\n',
        "src/planted/outside.ts": '// W200: a module an older unit added.\nimport path from "node:path";\nexport const b = path;\n',
      },
      (root) => q26Population(root, []),
    );
    expect(found).toContain("src/planted/inside.ts");
    expect(found).not.toContain("src/planted/outside.ts");
  });

  it("holds the two exclusions the tree really has, each argued", () => {
    expect(EXCLUDED_AT_W349.map((e) => e.module).sort()).toEqual([
      "src/console/setup-gaps.ts",
      "src/quality/quarter-mutants.ts",
    ]);
    for (const { module, reason } of EXCLUDED_AT_W349) {
      expect(reason.why.length, `${module} is excused without an argument`).toBeGreaterThan(120);
    }
    // The self-referential one is the finding: its suite really does run the sweep.
    const suite = siblingSuite(ROOT, "src/quality/quarter-mutants.ts")!;
    expect(readFileSync(path.join(ROOT, suite), "utf8")).toContain("runMutants");
    // And the other really has no sibling, which is why it was never in the population.
    expect(siblingSuite(ROOT, "src/console/setup-gaps.ts")).toBeNull();
  });
});

describe("W349 what the standing sampler draws from this quarter", () => {
  it("measures the share rather than asserting it", () => {
    const drawn = sampledShare(ROOT, q26Population(ROOT));
    const all = quarterMutants(ROOT, q26Population(ROOT));
    expect(all.length).toBeGreaterThan(80);
    // The point W332 made about Q25, re-measured: the standing sampler's view of a whole quarter is
    // a handful of mutants, and it would read as coverage.
    expect(drawn.length).toBeLessThan(all.length / 10);
    expect(drawn.every((m) => all.some((a) => a.module === m.module))).toBe(true);
  });
});

describe("W349 every survivor names its kind and its argument", () => {
  it("names a real module, a real operator and a sentence", () => {
    const names = new Set(OPERATORS.map((o) => o.id));
    for (const survivor of SURVIVORS_AT_W349) {
      const [module, operator] = survivor.id.split(" :: ");
      expect([...names], `${survivor.id} names an operator W296 does not have`).toContain(operator!);
      expect(q26Population(ROOT), `${survivor.id} is not in the population`).toContain(module!);
      const why = survivor.reason.kind === "uncaught" ? survivor.reason.remedy : survivor.reason.why;
      expect(why.length, `${survivor.id} is recorded without an argument`).toBeGreaterThan(120);
    }
  });

  it("states what a green run does not cover", () => {
    expect(Q26_MUTANT_BOUND).toContain("THE PART OF A QUARTER THIS HARNESS CAN REACH");
    expect(Q26_MUTANT_BOUND).toContain("five textual operators");
    expect(Q26_MUTANT_BOUND.length).toBeGreaterThan(600);
  });
});

describe("W349 the full run over the quarter's reachable modules", () => {
  it(
    "catches every mutant but the ones this register names",
    async () => {
      const mutants = quarterMutants(ROOT, q26Population(ROOT));
      const suites = [...new Set(mutants.map((m) => m.suite))];

      let red: string[] = [];
      try {
        execFileSync("npx", ["vitest", "run", ...suites], { cwd: COPY, stdio: "pipe", maxBuffer: 1 << 28 });
      } catch (error) {
        const output =
          String((error as { stdout?: unknown }).stdout ?? "") +
          String((error as { stderr?: unknown }).stderr ?? "");
        red = [...new Set([...output.matchAll(/FAIL\s+(\S+\.test\.ts)/g)].map((m) => m[1]!))].sort();
      }
      const measurable = mutants.filter((m) => !red.includes(m.suite));
      expect(measurable.length, "nothing was measurable, so this test checks nothing").toBeGreaterThan(80);

      const survivors = await runMutants(
        COPY,
        measurable,
        async (suite) => {
          await pexec("npx", ["vitest", "run", suite], { cwd: COPY, maxBuffer: 1 << 28 });
        },
        FILE_IO,
      );

      const report = samplingReport(survivors, red, SURVIVORS_AT_W349);
      expect(report.unexplained, "a change nothing noticed and nothing here explains").toEqual([]);
      expect(report.stale, "a declared survivor the suite now catches").toEqual([]);
      expect(report.unmeasurable, "a suite was red before anything was mutated").toEqual([]);

      // Non-vacuity: if the harness never applied a mutant every one would read as caught, and if it
      // never ran a suite every one would survive.
      expect(survivors.length).toBe(SURVIVORS_AT_W349.length);
      expect(measurable.length - survivors.length, "nothing was caught, so the harness is inert").toBeGreaterThan(
        80,
      );
    },
    2_400_000,
  );
});

describe("W355 the defaulted register is handed a different value, at home", () => {
  // W355 found twelve defaulted parameters in this tree whose value no call anywhere supplied.
  // Two are here: both `populationDefects` and `q26Population` take the quarter's RANGE and neither
  // had ever been given one — the shape W343 recorded when `quarterModules` took a loose pair and
  // a wrong call returned the whole tree instead of six modules.

  it("takes the unit range it is given, not only Q26's", () => {
    const oneUnit: UnitRange = { first: QUARTER_AT_W349.first, last: QUARTER_AT_W349.first };
    expect(q26Population(ROOT, EXCLUDED_AT_W349, oneUnit).length, "a one-unit range read the whole quarter")
      .toBeLessThan(q26Population(ROOT).length);
  });

  it("reports against the range it is given, so a narrowed quarter is a different question", () => {
    const oneUnit: UnitRange = { first: QUARTER_AT_W349.first, last: QUARTER_AT_W349.first };
    const narrowed = populationDefects(ROOT, EXCLUDED_AT_W349, oneUnit);
    expect(narrowed, "a range that excludes every excused module reported nothing").not.toEqual(
      populationDefects(ROOT),
    );
  });
});

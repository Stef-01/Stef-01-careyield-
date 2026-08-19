// W362 verify gate: "W349's run over every module Q27 added, each survivor named with its kind and
// its argument, the modules the harness cannot reach declared and resolved, and the sampler's share
// of that population measured."
//
// THE RUN IS THE LAST TEST AND IT TAKES NINE MINUTES. Everything above it is about the population,
// which is what a reader should distrust first: a sweep is honest about the mutants it runs and
// says nothing at all about the ones it never built. Q27's population has two ways of saying
// nothing — a module the harness cannot reach, and a module the operators find no line to change
// in — and both are declared here rather than left to look like a clean result.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  CLOSED_BY_W362,
  EXCLUDED_AT_W362,
  type Excluded,
  Q27_MUTANT_BOUND,
  QUARTER_AT_W362,
  SURVIVORS_AT_W362,
  UNMUTATED_AT_W362,
  populationDefects,
  q27Population,
} from "./quarter-mutants-q27";
import { FILE_IO, type UnitRange, quarterModules, quarterMutants, runMutants, sampledShare } from "./quarter-mutants";
import { samplingReport, siblingSuite } from "./mutation-sampling";
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

describe("W362 the population is Q27's own modules, minus the one the harness cannot reach", () => {
  it("agrees with the tree in four directions", () => {
    expect(populationDefects(ROOT)).toEqual([]);
  });

  it("takes its range from the ledger rather than trusting the constant", () => {
    // W281's rule: a range typed by hand is a claim about the ledger, so it is resolved against it.
    const done = parseLedgerRows(readLedger()).map((r) => Number(r.id.slice(1)));
    expect(done, "the quarter's first unit is not a ledger row").toContain(QUARTER_AT_W362.first);
    expect(done, "the quarter's last unit is not a ledger row").toContain(QUARTER_AT_W362.last);
    expect(QUARTER_AT_W362.last - QUARTER_AT_W362.first + 1, "a quarter is thirteen units").toBe(13);
  });

  it("is smaller than what the quarter added, and says by how much", () => {
    const added = quarterModules(ROOT, QUARTER_AT_W362);
    const swept = q27Population(ROOT);
    // Named rather than counted, and asserted per module rather than as one equality against the
    // frozen register — which is W317's shape, and the reason the list is walked instead.
    for (const { module } of EXCLUDED_AT_W362) {
      expect(added, `${module} is excluded and the quarter did not add it`).toContain(module);
      expect(swept, `${module} is excluded and the sweep still runs it`).not.toContain(module);
    }
    for (const module of added) {
      if (EXCLUDED_AT_W362.some((e) => e.module === module)) continue;
      expect(swept, `${module} left the population and nothing excludes it`).toContain(module);
    }
  });

  it("reports a module the quarter added that nothing measures and nothing excuses", () => {
    const orphan = withTree(
      {
        "BUILD-STATE.md": ledgerRow(QUARTER_AT_W362.first),
        "src/planted/lonely.ts": `// W${QUARTER_AT_W362.first}: a module the quarter added.\nexport const a = 1;\n`,
      },
      (root) => populationDefects(root, [], { first: QUARTER_AT_W362.first, last: QUARTER_AT_W362.first }, []),
    );
    expect(orphan).toEqual([
      {
        module: "src/planted/lonely.ts",
        what: "was added by the quarter, has no sibling suite and nothing excuses it",
      },
    ]);
  });

  it("reports a record for a module the quarter no longer holds, which is the arm the planting found", () => {
    // The unmutated list was a module constant until the planted probe above reported it stale
    // against a one-unit range — a list this function reads and no caller could vary, which is
    // exactly W355's subject one unit earlier. It is a parameter now, and this drives it.
    expect(
      populationDefects(ROOT, EXCLUDED_AT_W362, QUARTER_AT_W362, [
        { module: "src/gone.ts", why: "y".repeat(130) },
      ]),
      // Two defects, not one, and the second is the arm added after this test's own break: swapping
      // the record for a bogus row leaves the real unmutated module unrecorded, and that is
      // reported too. Expecting only the stale row would have hidden the direction that matters.
    ).toEqual([
      { module: "src/console/waiting.ts", what: "yields no mutant under the operators and nothing records that" },
      { module: "src/gone.ts", what: "is recorded as yielding no mutant and the quarter did not add it" },
    ]);
  });

  it("reports an excusal for a module the quarter no longer holds", () => {
    const stale: Excluded[] = [
      {
        module: "src/gone.ts",
        reason: { kind: "no_sibling_suite", testedFrom: "src/x.test.ts", why: "y".repeat(80) },
      },
    ];
    expect(populationDefects(ROOT, stale)).toEqual([
      { module: "src/gone.ts", what: "is excused from the sweep and the quarter did not add it" },
    ]);
  });

  it("reports an excusal whose own claim the tree contradicts, which is the arm that matters", () => {
    const wrong: Excluded[] = [
      {
        module: "src/quality/quarter-mutants-q26.ts",
        reason: { kind: "no_sibling_suite", testedFrom: "src/x.test.ts", why: "y".repeat(80) },
      },
    ];
    expect(populationDefects(ROOT, wrong)).toEqual([
      {
        module: "src/quality/quarter-mutants-q26.ts",
        what: "is excused as having no sibling suite and has one",
      },
    ]);
  });

  it("reports a sweep-running excusal whose suite is not the one it names", () => {
    const wrong: Excluded[] = [
      {
        module: "src/quality/quarter-mutants-q26.ts",
        reason: { kind: "runs_the_sweep", suite: "src/quality/not-it.test.ts", why: "y".repeat(80) },
      },
    ];
    expect(populationDefects(ROOT, wrong)).toEqual([
      {
        module: "src/quality/quarter-mutants-q26.ts",
        what: "is excused as running the sweep and its suite is not src/quality/not-it.test.ts",
      },
    ]);
  });

  it("takes the exclusions and the range it is given, not only its own", () => {
    // W355'S REGISTER CAUGHT THIS UNIT WITHIN ONE FIRING. Both of `q27Population`'s parameters
    // shipped with nothing anywhere supplying them — a signature promising the population can be
    // asked a different question, and no call collecting the promise. Driven in both directions:
    // excusing nothing widens it, and a one-unit range narrows it.
    const withNothingExcused = q27Population(ROOT, []);
    expect(withNothingExcused, "the exclusions argument changed nothing").toContain(
      EXCLUDED_AT_W362[0]!.module,
    );

    const oneUnit: UnitRange = { first: QUARTER_AT_W362.first, last: QUARTER_AT_W362.first };
    expect(
      q27Population(ROOT, EXCLUDED_AT_W362, oneUnit).length,
      "a one-unit range read the whole quarter",
    ).toBeLessThan(q27Population(ROOT).length);
  });

  it("holds the one exclusion the tree really has, argued and resolved", () => {
    expect(EXCLUDED_AT_W362).toHaveLength(1);
    for (const { module, reason } of EXCLUDED_AT_W362) {
      expect(reason.why.length, `${module} is excused without an argument`).toBeGreaterThan(120);
      if (reason.kind === "runs_the_sweep") expect(siblingSuite(ROOT, module)).toBe(reason.suite);
    }
  });
});

describe("W362 a module the operators find nothing to change in says so", () => {
  it("really does yield no mutant, and the ones beside it do", () => {
    // The distinction this register adds to W349's: a module contributing zero mutants and a module
    // the sweep never reached read identically in a survivor count.
    const population = q27Population(ROOT);
    const mutants = quarterMutants(ROOT, population);
    for (const { module, why } of UNMUTATED_AT_W362) {
      expect(population, `${module} is recorded as unmutated and is not in the population`).toContain(module);
      expect(
        mutants.filter((m) => m.module === module),
        `${module} is recorded as yielding no mutant and yields some`,
      ).toEqual([]);
      expect(why.length, `${module} is recorded without an argument`).toBeGreaterThan(120);
    }
    expect(mutants.length, "nothing was mutated at all, so the record above says nothing").toBeGreaterThan(50);
  });

  it("reports an unmutated module nothing records, which is what the loop above cannot", () => {
    // W362'S OWN BREAK FOUND THIS. Emptying `UNMUTATED_AT_W362` left the test above green, because
    // a loop over the recorded rows says nothing when there are none — so a module the operators
    // fall silent on could join the population and read as measured. This is the other direction.
    expect(populationDefects(ROOT, EXCLUDED_AT_W362, QUARTER_AT_W362, [])).toEqual(
      UNMUTATED_AT_W362.map(({ module }) => ({
        module,
        what: "yields no mutant under the operators and nothing records that",
      })),
    );
  });
});

describe("W362 what the standing sampler draws from this quarter", () => {
  it("measures the share rather than asserting it", () => {
    const drawn = sampledShare(ROOT, q27Population(ROOT));
    const all = quarterMutants(ROOT, q27Population(ROOT));
    expect(all.length, "the population yields nothing, so the share means nothing").toBeGreaterThan(50);
    // W332's point about Q25 and W349's about Q26, re-measured a third time: the standing sampler's
    // view of a whole quarter is a handful of mutants, and it would read as coverage.
    expect(drawn.length).toBeLessThan(all.length / 10);
    expect(drawn.every((m) => all.some((a) => a.module === m.module))).toBe(true);
  });
});

describe("W362 every survivor names its kind and its argument", () => {
  it("names a real module, a real operator and a sentence", () => {
    const population = q27Population(ROOT);
    for (const survivor of SURVIVORS_AT_W362) {
      const [module] = survivor.id.split(" :: ");
      expect(population, `${survivor.id} names a module outside the population`).toContain(module);
      const text = survivor.reason.kind === "uncaught" ? survivor.reason.remedy : survivor.reason.why;
      expect(text.length, `${survivor.id} is recorded without an argument`).toBeGreaterThan(120);
    }
  });

  it("names the survivor this unit closed, and the tree carries the remedy", () => {
    // An empty survivor list has two readings — nothing survived, or nothing ran — and the second
    // is what W349's own bound warns about. This resolves the one the run found against the fix.
    expect(CLOSED_BY_W362).toContain("typed-names.ts");
    const suite = readFileSync(path.join(ROOT, "src/quality/typed-names.test.ts"), "utf8");
    expect(suite, "the remedy for W362's survivor is not in the tree").toContain(
      "reads UNIT fields, and not every field a name site happens to carry",
    );
  });

  it("states what a green run does not cover", () => {
    expect(Q27_MUTANT_BOUND.length).toBeGreaterThan(600);
    expect(Q27_MUTANT_BOUND).toContain("A CAUGHT MUTANT IS NOT A TESTED LINE");
    expect(Q27_MUTANT_BOUND).toContain("UNMUTATED_AT_W362");
  });
});

describe("W362 the full run over the quarter's reachable modules", () => {
  it(
    "catches every mutant, which is the first quarter that can be said of",
    async () => {
      const mutants = quarterMutants(ROOT, q27Population(ROOT));
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
      expect(measurable.length, "nothing was measurable, so this test checks nothing").toBeGreaterThan(50);

      const survivors = await runMutants(
        COPY,
        measurable,
        async (suite) => {
          await pexec("npx", ["vitest", "run", suite], { cwd: COPY, maxBuffer: 1 << 28 });
        },
        FILE_IO,
      );

      const report = samplingReport(survivors, red, SURVIVORS_AT_W362);
      expect(report.unexplained, "a change nothing noticed and nothing here explains").toEqual([]);
      expect(report.stale, "a declared survivor the suite now catches").toEqual([]);
      expect(report.unmeasurable, "a suite was red before anything was mutated").toEqual([]);

      // Non-vacuity: if the harness never applied a mutant every one would read as caught, and if
      // it never ran a suite every one would survive.
      expect(survivors.length).toBe(SURVIVORS_AT_W362.length);
      expect(measurable.length - survivors.length, "nothing was caught, so the harness is inert").toBeGreaterThan(
        50,
      );
    },
    2_400_000,
  );
});

function readLedger(): string {
  return readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
}

function ledgerRow(unit: number): string {
  return `| W${unit} | done | builder-A | 2026-01-01T00:00Z | abc1234 | a unit |\n`;
}

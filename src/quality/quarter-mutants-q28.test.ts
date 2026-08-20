// W374: "the survivors register over Q28's modules → verify: W349's run over every module Q28
// added, each survivor named with its kind and its argument, the modules the harness cannot reach
// declared and resolved, and the sampler's share of that population measured."
//
// THE RUN IS THE LAST TEST AND IT TAKES MINUTES. Everything above it is about the population, which
// is what a reader should distrust first: a sweep is honest about the mutants it runs and says
// nothing at all about the ones it never built. Q28's population has two ways of saying nothing — a
// module the harness cannot reach, and a module the operators find no line to change in — and this
// quarter has one of the first and NONE of the second, which is a measurement rather than a gap and
// is driven as one.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  EXCLUDED_AT_W374,
  Q28_MUTANT_BOUND,
  QUARTER_AT_W374,
  CLOSED_BY_W374,
  SURVIVORS_AT_W374,
  type Unmutated,
  UNMUTATED_AT_W374,
  populationDefects,
  q28Population,
} from "./quarter-mutants-q28";
import { UNMUTATED_AT_W362 } from "./quarter-mutants-q27";
import { FILE_IO, quarterModules, quarterMutants, runMutants, sampledShare } from "./quarter-mutants";
import { samplingReport, siblingSuite } from "./mutation-sampling";
import { copyTree } from "./planting";
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

describe("W374 the population is Q28's own modules, minus the one the harness cannot reach", () => {
  it("agrees with the tree in four directions", () => {
    expect(populationDefects(ROOT)).toEqual([]);
  });

  it("takes its range from the ledger rather than trusting the constant", () => {
    // W281's rule: a range typed by hand is a claim about the ledger, so it is resolved against it.
    const done = parseLedgerRows(readLedger()).map((r) => Number(r.id.slice(1)));
    expect(done, "the quarter's first unit is not a ledger row").toContain(QUARTER_AT_W374.first);
    expect(done, "the quarter's last unit is not a ledger row").toContain(QUARTER_AT_W374.last);
    expect(QUARTER_AT_W374.last - QUARTER_AT_W374.first + 1, "a quarter is thirteen units").toBe(13);
  });

  it("is smaller than what the quarter added, and says which module by name", () => {
    const added = quarterModules(ROOT, QUARTER_AT_W374);
    const swept = q28Population(ROOT);
    expect(added).toContain("src/quality/quarter-mutants-q27.ts");
    expect(swept).not.toContain("src/quality/quarter-mutants-q27.ts");
    expect(swept.length).toBe(added.length - EXCLUDED_AT_W374.length);
  });

  it("takes an exclusion list and a range it is given, not only its own", () => {
    // W355's rule: a defaulted register nobody ever varies is a parameter promising something
    // nobody has collected. Both of this function's are handed other values here.
    const own = q28Population(ROOT);
    const excusingNothing = q28Population(ROOT, []);
    expect(excusingNothing, "excusing nothing changes nothing").not.toEqual(own);
    expect(excusingNothing).toContain("src/quality/quarter-mutants-q27.ts");
    const overQ27 = q28Population(ROOT, [], { first: 339, last: 351 });
    expect(overQ27, "the range changes nothing, so it is decoration").not.toEqual(own);
    expect(overQ27).toContain("src/console/waiting.ts");
  });

  it("resolves the excluded module's reason against the tree", () => {
    for (const { module, reason } of EXCLUDED_AT_W374) {
      expect(quarterModules(ROOT, QUARTER_AT_W374), `${module} is not the quarter's`).toContain(module);
      if (reason.kind !== "runs_the_sweep") continue;
      // The excuse is that its sibling suite IS a sweep, so the suite it names has to be its
      // sibling AND has to be one: a test file that no longer runs a mutation sweep would leave
      // this exclusion describing a module that could be measured after all.
      expect(siblingSuite(ROOT, module)).toBe(reason.suite);
      const suite = readFileSync(path.join(ROOT, reason.suite), "utf8");
      expect(suite, `${reason.suite} does not run a sweep`).toContain("runMutants");
    }
  });

  it("reports an exclusion for a module the quarter did not add", () => {
    // W374's own mutation check found this arm undriven. An exclusion naming a module outside the
    // quarter is a row describing something the sweep was never going to reach.
    const defects = populationDefects(ROOT, [
      {
        module: "src/planted/w374-absent.ts",
        reason: { kind: "runs_the_sweep", suite: "src/planted/w374-absent.test.ts", why: "a planted reason" },
      },
    ]);
    expect(defects.map((d) => d.what)).toContain("is excused from the sweep and the quarter did not add it");
  });

  it("reports a module of the quarter that has no sibling suite and nothing excusing it", () => {
    // Driven over Q26's range with nothing excused, where such a module really exists — W349 had to
    // declare one. Over Q28's own range every module has a suite, so this arm would never fire and
    // a register that only walked its own quarter could not show that it works.
    const overQ26 = populationDefects(ROOT, [], { first: 326, last: 338 }, []);
    expect(overQ26.map((d) => d.what)).toContain(
      "was added by the quarter, has no sibling suite and nothing excuses it",
    );
  });

  it("skips the modules a register records as yielding nothing, rather than reporting them again", () => {
    // The other side of the unmutated arm: a module the register RECORDS as silent must not also
    // be reported as silent-and-unrecorded. Driven over Q27, where `src/console/waiting.ts` is both.
    const recorded = populationDefects(ROOT, [], { first: 339, last: 351 }, UNMUTATED_AT_W362);
    expect(recorded.map((d) => d.module)).not.toContain("src/console/waiting.ts");
    const unrecorded = populationDefects(ROOT, [], { first: 339, last: 351 }, []);
    expect(unrecorded.map((d) => d.module)).toContain("src/console/waiting.ts");
  });

  it("carries W362's prediction forward, which is the only reason the exclusion is not a surprise", () => {
    // W362 wrote that the exclusion "will be here again next quarter unless the instrument
    // changes". It is, one module along, for the same reason and in the same words — so this is a
    // prediction a register made about itself and then met, rather than a limit rediscovered.
    const previous = readFileSync(path.join(ROOT, "src/quality/quarter-mutants-q27.ts"), "utf8");
    expect(previous).toContain("the exclusion will be here again next quarter");
    expect(EXCLUDED_AT_W374.map((e) => e.module)).toEqual(["src/quality/quarter-mutants-q27.ts"]);
  });

  it("holds no unmutated module, and looks for one rather than assuming", () => {
    // W293: the empty list is a reading. Every reachable module is walked and each must yield at
    // least one mutant — the arm that would report a silent module fires on the live tree.
    // W293's rule, on the same producer: the list is shown holding one before it is asserted to
    // hold none, so the emptiness is a reading rather than a shape nothing could ever fill. W362's
    // register beside it really does hold one, which is what makes the shape's non-emptiness a
    // fact about this tree rather than about the type.
    const named = (extra: readonly Unmutated[]): string[] =>
      [...UNMUTATED_AT_W374, ...extra].map((u) => u.module);
    expect(named([{ module: "src/planted/w374.ts", why: "a planted row" }])).toEqual([
      "src/planted/w374.ts",
    ]);
    expect(named([])).toEqual([]);
    expect(UNMUTATED_AT_W362.map((u) => u.module).length).toBeGreaterThan(0);
    for (const module of q28Population(ROOT)) {
      expect(quarterMutants(ROOT, [module]).length, `${module} yields no mutant`).toBeGreaterThan(0);
    }
    // AND THE ARM REALLY REPORTS, driven on the quarter where such a module exists: over Q27's
    // range with nothing recorded, `src/console/waiting.ts` — the module W362 had to declare — comes
    // back as yielding no mutant and nothing recording it. An empty register here is a reading
    // because the same walk finds one when there is one to find.
    const overQ27 = populationDefects(ROOT, [], { first: 339, last: 351 }, []);
    expect(overQ27.map((d) => d.module), "the arm finds no silent module even where one is").toContain(
      "src/console/waiting.ts",
    );
  });

  it("measures the standing sampler's share of this quarter, which is the reason the sweep exists", () => {
    const drawn = sampledShare(ROOT, q28Population(ROOT));
    const all = quarterMutants(ROOT, q28Population(ROOT));
    expect(all.length, "the population yields nothing, so the share means nothing").toBeGreaterThan(50);
    // W332's point about Q25, W349's about Q26 and W362's about Q27, re-measured a fourth time: the
    // standing sampler's view of a whole quarter is a handful of mutants, and it would read as
    // coverage.
    expect(drawn.length).toBeLessThan(all.length / 10);
    expect(drawn.every((m) => all.some((a) => a.module === m.module))).toBe(true);
  });
});

describe("W374 every survivor names its kind and its argument", () => {
  it("names a real module, a real operator and a sentence", () => {
    const population = q28Population(ROOT);
    for (const survivor of SURVIVORS_AT_W374) {
      const [module] = survivor.id.split(" :: ");
      expect(population, `${survivor.id} is not in the population`).toContain(module);
      const argument =
        survivor.reason.kind === "uncaught" ? survivor.reason.remedy : survivor.reason.why;
      expect(argument.length, `${survivor.id} is unargued`).toBeGreaterThan(120);
    }
  });
});

describe("W374 the four this run closed", () => {
  it("names a real module and a real line for each", () => {
    const population = q28Population(ROOT);
    // W290's rule rather than a count: a NAMED list moves deliberately. The modules are pinned;
    // the length is whatever the names say it is.
    expect(CLOSED_BY_W374.map((c) => c.id.split(" :: ")[0])).toEqual([
      "src/quality/flattering-numbers.ts",
      "src/quality/flattering-numbers.ts",
      "src/quality/hardening-q27.ts",
      "src/quality/superset.ts",
    ]);
    for (const closed of CLOSED_BY_W374) {
      const [module, operator, line] = closed.id.split(" :: ");
      expect(population, `${module} is not in the population`).toContain(module);
      expect(["eq-to-neq", "neq-to-eq", "and-to-or", "or-to-and", "gt-to-gte"]).toContain(operator);
      // Where the fix landed decides what can be asserted. A fix in the SUITE leaves the mutated
      // line alone, so it must still be there; a fix in the MODULE replaced it, so requiring it
      // would be requiring that no fix touch the thing it fixed.
      const source = readFileSync(path.join(ROOT, module!), "utf8");
      if (closed.where === "suite") {
        expect(source, `${module} no longer holds the line ${operator} changed`).toContain(line!.trim());
      } else {
        expect(source, `${module} still holds the line the fix was supposed to replace`).not.toContain(
          line!.trim(),
        );
      }
      expect(readFileSync(path.join(ROOT, closed.file), "utf8"), `${closed.file} does not cite the run`).toContain(
        "W374",
      );
    }
  });

  it("closed them where they live rather than owing them to a later unit, which is W357's rule", () => {
    // Not recorded as owed. Three are assertions in the module's OWN sibling suite, so the mutant
    // dies where a reader of that module would look; one is a change to the module, because the
    // selector could not be measured in the tree the sweep runs in.
    expect(CLOSED_BY_W374.filter((c) => c.where === "suite").map((c) => c.file)).toEqual([
      "src/quality/flattering-numbers.test.ts",
      "src/quality/flattering-numbers.test.ts",
      "src/quality/hardening-q27.test.ts",
    ]);
    expect(CLOSED_BY_W374.filter((c) => c.where === "module").map((c) => c.file)).toEqual([
      "src/quality/superset.ts",
    ]);
  });
});

describe("W374 the bound", () => {
  it("says the exclusion is permanent and growing, which is this quarter's own limit", () => {
    expect(Q28_MUTANT_BOUND).toContain("THE EXCLUSION IS PERMANENT AND GROWING");
    expect(Q28_MUTANT_BOUND).toContain("no run can measure the run before it");
  });

  it("says a caught mutant is not a tested line", () => {
    expect(Q28_MUTANT_BOUND).toContain("A CAUGHT MUTANT IS NOT A TESTED LINE");
  });
});

describe("W374 the full run over the quarter's reachable modules", () => {
  it(
    "catches every mutant but the ones this register names",
    async () => {
      const mutants = quarterMutants(ROOT, q28Population(ROOT));
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

      const report = samplingReport(survivors, red, SURVIVORS_AT_W374);
      expect(report.unexplained, "a change nothing noticed and nothing here explains").toEqual([]);
      expect(report.stale, "a declared survivor the suite now catches").toEqual([]);
      expect(report.unmeasurable, "a suite was red before anything was mutated").toEqual([]);

      // Non-vacuity: if the harness never applied a mutant every one would read as caught, and if
      // it never ran a suite every one would survive.
      expect(survivors.length).toBe(SURVIVORS_AT_W374.length);
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

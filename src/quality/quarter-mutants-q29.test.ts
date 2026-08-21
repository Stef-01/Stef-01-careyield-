// W386: "The survivors register over Q29's modules → verify: W349's run over every module Q29
// added, each survivor named with its kind and its argument, the modules the harness cannot reach
// declared and resolved, and the sampler's share of that population measured."
//
// THE FULL RUN IS THE LAST TEST AND IT TAKES MINUTES. Everything above it is about the population —
// whether the set this sweep walks is the set the quarter added — which is the question Q29 itself
// was about and the one a green sweep over the wrong population would answer wrongly and quietly.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  CLOSED_BY_W386,
  EXCLUDED_AT_W386,
  Q29_MUTANT_BOUND,
  QUARTER_AT_W386,
  SURVIVORS_AT_W386,
  UNMUTATED_AT_W386,
  populationDefects,
  q29Population,
} from "./quarter-mutants-q29";
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

describe("W386 the population is the quarter's own modules", () => {
  it("agrees with the quarter in every direction it can disagree in", () => {
    expect(populationDefects(ROOT)).toEqual([]);
  });

  it("derives the quarter from the headers rather than holding a list", () => {
    const added = quarterModules(ROOT, QUARTER_AT_W386);
    expect(added.length).toBeGreaterThan(10);
    // Every module the quarter added really is one this quarter's units wrote, checked against the
    // ledger rather than believed: each of W365-W377 is a done row.
    const rows = parseLedgerRows(readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8"));
    for (let n = QUARTER_AT_W386.first; n <= QUARTER_AT_W386.last; n += 1) {
      const row = rows.find((r) => r.id === `W${n}`);
      expect(row?.status, `W${n} is not a landed row`).toBe("done");
    }
    // And the exclusion really removes something, so the population is a difference.
    expect(q29Population(ROOT).length).toBe(added.length - EXCLUDED_AT_W386.length);
  });

  it("takes its exclusions and its range from the caller, not only from its own defaults", () => {
    // W355'S RULE: a defaulted parameter nobody ever varies is a parameter that does not work.
    // Handed no exclusions, the module this sweep cannot reach comes back into the population.
    expect(q29Population(ROOT, [])).toContain("src/quality/quarter-mutants-q28.ts");
    expect(q29Population(ROOT)).not.toContain("src/quality/quarter-mutants-q28.ts");
    // Handed another quarter's range, it answers about that quarter — so the range is read rather
    // than decorative, and this register could measure a quarter it was not written for.
    const overQ28 = q29Population(ROOT, [], { first: 352, last: 364 });
    expect(overQ28).toContain("src/quality/quarter-mutants-q27.ts");
    expect(overQ28).not.toContain("src/quality/spelling-markers.ts");
    expect(q29Population(ROOT)).toContain("src/quality/spelling-markers.ts");
  });

  it("reports an excused module the quarter did not add", () => {
    const defects = populationDefects(ROOT, [
      ...EXCLUDED_AT_W386,
      {
        module: "src/planted/gone.ts",
        reason: { kind: "no_sibling_suite", testedFrom: "src/planted/other.test.ts", why: "w".repeat(130) },
      },
    ]);
    expect(defects.map((d) => d.module)).toContain("src/planted/gone.ts");
    expect(defects.map((d) => d.what)).toContain("is excused from the sweep and the quarter did not add it");
  });

  it("reports a module of the quarter that has no sibling suite and nothing excusing it", () => {
    // Driven over Q26's range with nothing excused, where such a module really exists. Over Q29's
    // own range every module has a suite, so this arm would never fire and a register that only
    // walked its own quarter could not show that it works.
    const overQ26 = populationDefects(ROOT, [], { first: 326, last: 338 }, []);
    expect(overQ26.map((d) => d.what)).toContain(
      "was added by the quarter, has no sibling suite and nothing excuses it",
    );
  });

  it("names the excluded module's real suite, and reports one that is wrong", () => {
    // The `runs_the_sweep` arm, both ways: the excuse names a suite, and the suite it names has to
    // be the module's own. An excuse pointing at the wrong file excuses nothing.
    for (const { module, reason } of EXCLUDED_AT_W386) {
      if (reason.kind !== "runs_the_sweep") continue;
      expect(siblingSuite(ROOT, module)).toBe(reason.suite);
    }
    const wrong = populationDefects(ROOT, [
      {
        module: "src/quality/quarter-mutants-q28.ts",
        reason: { kind: "runs_the_sweep", suite: "src/quality/not-its-suite.test.ts", why: "w".repeat(130) },
      },
    ]);
    expect(wrong.map((d) => d.what)).toContain(
      "is excused as running the sweep and its suite is not src/quality/not-its-suite.test.ts",
    );
  });

  it("carries W362's prediction forward, and re-issues it because W374 did not", () => {
    // W362 wrote that the exclusion "will be here again next quarter unless the instrument
    // changes". W374 MET that prediction and did not restate it, so the chain stopped at Q28 and
    // this quarter has to reach two files back for the sentence it is meeting. It is re-issued in
    // this module, which is the difference between a limit that is tracked and one rediscovered.
    const q27 = readFileSync(path.join(ROOT, "src/quality/quarter-mutants-q27.ts"), "utf8");
    const q28 = readFileSync(path.join(ROOT, "src/quality/quarter-mutants-q28.ts"), "utf8");
    const q29 = readFileSync(path.join(ROOT, "src/quality/quarter-mutants-q29.ts"), "utf8");
    expect(q27).toContain("the exclusion will be here again next quarter");
    expect(q28, "W374 met the prediction without passing it on").not.toContain(
      "the exclusion will be here again next quarter",
    );
    expect(q29).toContain("the exclusion will be here again next quarter");
    expect(EXCLUDED_AT_W386.map((e) => e.module)).toEqual(["src/quality/quarter-mutants-q28.ts"]);
  });

  it("holds the one module the operators fall silent on, and this run made it", () => {
    // NOT AN EMPTY LIST, AND THE ROW IS THIS RUN'S OWN DOING. `hardening-q28.ts` yielded two mutants
    // when the sweep started, both from its private `finding(id)`; closing the survivor by sharing
    // that function removed the only lines the five operators can reach in it. The right fix and
    // the loss of measurement were the same edit — so the register records a module with no verdict
    // rather than reporting a clean quarter.
    expect(UNMUTATED_AT_W386.map((u) => u.module)).toEqual(["src/quality/hardening-q28.ts"]);
    expect(quarterMutants(ROOT, ["src/quality/hardening-q28.ts"])).toEqual([]);
    expect(UNMUTATED_AT_W362.map((u) => u.module).length).toBeGreaterThan(0);
    // Every OTHER module in the population still yields something, walked rather than assumed.
    const recorded = new Set(UNMUTATED_AT_W386.map((u) => u.module));
    for (const module of q29Population(ROOT)) {
      if (recorded.has(module)) continue;
      expect(quarterMutants(ROOT, [module]).length, `${module} yields no mutant`).toBeGreaterThan(0);
    }
    // AND THE ARM REALLY REPORTS, driven over Q27's range where such a module exists.
    const overQ27 = populationDefects(ROOT, [], { first: 339, last: 351 }, []);
    expect(overQ27.map((d) => d.module), "the arm finds no silent module even where one is").toContain(
      "src/console/waiting.ts",
    );
  });

  it("measures the standing sampler's share of this quarter, which is the reason the sweep exists", () => {
    const drawn = sampledShare(ROOT, q29Population(ROOT));
    const all = quarterMutants(ROOT, q29Population(ROOT));
    expect(all.length, "the population yields nothing, so the share means nothing").toBeGreaterThan(50);
    // W332's point about Q25, W349's about Q26, W362's about Q27 and W374's about Q28, measured a
    // fifth time: the standing sampler's view of a whole quarter is a handful of mutants, and it
    // would read as coverage.
    expect(drawn.length).toBeLessThan(all.length / 10);
    expect(drawn.every((m) => all.some((a) => a.module === m.module))).toBe(true);
  });
});

describe("W386 every survivor names its kind and its argument", () => {
  it("names a real module, a real operator and a sentence", () => {
    const population = q29Population(ROOT);
    for (const survivor of SURVIVORS_AT_W386) {
      const [module] = survivor.id.split(" :: ");
      expect(population, `${survivor.id} is not in the population`).toContain(module);
      const argument = survivor.reason.kind === "uncaught" ? survivor.reason.remedy : survivor.reason.why;
      expect(argument.length, `${survivor.id} is unargued`).toBeGreaterThan(120);
    }
  });

  it("records what it closed, so an empty survivors list is a result rather than an unrun harness", () => {
    // W369'S POINT. An empty register and a harness nobody started look identical from outside, so
    // the five this run found are named with where each fix landed.
    // THE EMPTINESS IS NOT ASSERTED HERE, and that is deliberate. The full run below already
    // establishes it against the tree — `survivors.length` must equal this register's length, with
    // non-vacuity on both sides — so a bare `toEqual([])` in this arm would be a second, weaker
    // statement of the same claim with nothing behind it. What this arm is for is the other half:
    // that the emptiness has an explanation beside it rather than being a harness nobody started.
    expect(CLOSED_BY_W386.length).toBeGreaterThan(0);
    for (const closed of CLOSED_BY_W386) {
      const [module] = closed.id.split(" :: ");
      expect(q29Population(ROOT), `${closed.id} is not in the population`).toContain(module);
      expect(readFileSync(path.join(ROOT, closed.file), "utf8").length, `${closed.file} is not a file`)
        .toBeGreaterThan(0);
    }
    // Both kinds are here, which is what makes the distinction worth carrying.
    expect(new Set(CLOSED_BY_W386.map((c) => c.where))).toEqual(new Set(["suite", "module"]));
  });

  it("closed a mutant W374 had already closed once, one copy over", () => {
    // THE FINDING OF THIS RUN, re-derived rather than restated. Q27's and Q28's passes both held
    // their own `finding(id)`; W374 closed the identity mutant in Q27's copy, and it was alive in
    // Q28's a quarter later. There is one function now — a fourth pass inherits the pin.
    expect(CLOSED_BY_W386.map((c) => c.id)).toContain(
      "src/quality/hardening-q28.ts :: eq-to-neq :: const found = FINDINGS.find((f) => f.id === id);",
    );
    const q22 = readFileSync(path.join(ROOT, "src/quality/hardening-q22.ts"), "utf8");
    expect(q22, "the shared lookup is gone").toContain("export function findingIn(");
    for (const pass of ["q27", "q28", "q29"]) {
      const source = readFileSync(path.join(ROOT, `src/quality/hardening-${pass}.ts`), "utf8");
      expect(source, `${pass} kept its own copy of the lookup`).not.toContain("FINDINGS.find((f) => f.id === id)");
      expect(source, `${pass} does not use the shared lookup`).toContain("findingIn(FINDINGS, id)");
    }
  });
});

describe("W386 the bound", () => {
  it("says the exclusion is permanent and growing, and what the cost of that now is", () => {
    expect(Q29_MUTANT_BOUND).toContain("THE EXCLUSION IS PERMANENT AND GROWING");
    expect(Q29_MUTANT_BOUND).toContain("THE COST IS NOW PART OF THE LIMIT");
  });

  it("says a caught mutant is not a tested line", () => {
    expect(Q29_MUTANT_BOUND).toContain("A CAUGHT MUTANT IS NOT A TESTED LINE");
  });
});

describe("W386 the full run over the quarter's reachable modules", () => {
  it(
    "catches every mutant but the ones this register names",
    async () => {
      const mutants = quarterMutants(ROOT, q29Population(ROOT));
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
          await pexec("npx", ["vitest", "run", "--no-file-parallelism", suite], { cwd: COPY, maxBuffer: 1 << 28 });
        },
        FILE_IO,
      );

      const report = samplingReport(survivors, red, SURVIVORS_AT_W386);
      expect(report.unexplained, "a change nothing noticed and nothing here explains").toEqual([]);
      expect(report.stale, "a declared survivor the suite now catches").toEqual([]);
      expect(report.unmeasurable, "a suite was red before anything was mutated").toEqual([]);

      // Non-vacuity: if the harness never applied a mutant every one would read as caught, and if
      // it never ran a suite every one would survive.
      expect(survivors.length).toBe(SURVIVORS_AT_W386.length);
      expect(measurable.length - survivors.length, "nothing was caught, so the harness is inert").toBeGreaterThan(
        50,
      );
    },
    2_400_000,
  );
});

// W332 verify gate: "W296's sampling run over every module Q25 added, each survivor named with its
// kind and its argument, and a planted survivor reported."
//
// THE PLANTED SURVIVOR IS DRIVEN WITHOUT SPAWNING ANYTHING, which is what taking the executor as a
// parameter buys. W296's loop is welded inside its own test — W289's finding, in the module that
// records W289's finding — so the only way to see it report a survivor is to run the real thing for
// a hundred seconds. Here the executor is a function that answers from a table, so the loop's
// behaviour is asserted in milliseconds and the real run is left to assert the tree.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  QUARTER_AT_W332,
  QUARTER_MUTANT_BOUND,
  SURVIVORS_AT_W332,
  quarterModules,
  quarterModulesWithNoSuite,
  FILE_IO,
  quarterMutants,
  runMutants,
  sampledShare,
} from "./quarter-mutants";
import { type Mutant, mutantId, samplingReport } from "./mutation-sampling";
import { copyTree } from "./planting";
import { parseLedgerRows } from "./blocked-surface";

const ROOT = process.cwd();
let COPY = "";

beforeAll(() => {
  COPY = copyTree(ROOT, { withNodeModules: true });
}, 180_000);

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

describe("W332 the population is the quarter's own modules, derived", () => {
  it("names only modules whose header claims a unit in the range, and every one has a suite", () => {
    const modules = quarterModules(ROOT);
    expect(modules.length, "the quarter added no module, so this measures nothing").toBeGreaterThan(4);
    expect(quarterModulesWithNoSuite(ROOT), "a module the quarter added has no suite to catch anything").toEqual(
      [],
    );
  });

  it("takes its range from the ledger rather than trusting the constant", () => {
    // The quarter is a pair of numbers, and a pair of numbers is a thing somebody can mistype. Both
    // ends must be rows the ledger actually holds, or the population is over a range that is not a
    // quarter.
    const ids = new Set(parseLedgerRows(readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8")).map((r) => r.id));
    expect(ids.has(`W${QUARTER_AT_W332.first}`)).toBe(true);
    expect(ids.has(`W${QUARTER_AT_W332.last}`)).toBe(true);
  });

  it("shows what the standing sampler would have drawn, which is the reason this unit exists", () => {
    // THE FINDING, RE-DERIVED RATHER THAN WRITTEN DOWN. W296 samples at one in thirty-seven over the
    // whole tree, and over this quarter's modules that is a handful of sites at most — an answer
    // about a quarter's new work that would have read as coverage.
    const all = quarterMutants(ROOT);
    const sampled = sampledShare(ROOT);
    expect(all.length, "the quarter's modules hold no mutation site at all").toBeGreaterThan(40);
    expect(sampled.length * 10, "the sampler already covers this population, so the unit is moot").toBeLessThan(
      all.length,
    );
    expect(sampled.every((m) => all.some((a) => a.module === m.module && a.start === m.start))).toBe(true);
  });
});

describe("W332 the runner, driven on a table instead of a tree", () => {
  // NO FILESYSTEM AT ALL. `runMutants` takes its reader and its writer, so the whole loop runs over
  // a map — which is the difference between a planted survivor being a test and being a hundred
  // seconds of subprocess. W296's version could not do this because its loop lives inside its own
  // test file and exports nothing; that is W289's finding, in the module that records W289's
  // finding.
  const MODULE = "src/planted/subject.ts";
  const SOURCE = "export const f = (a: boolean, b: boolean) => a && b;\n";
  const FILE = path.join("/nowhere", MODULE);
  const MUTANT: Mutant = {
    module: MODULE,
    suite: "src/planted/subject.test.ts",
    operator: "and-to-or",
    line: 1,
    start: SOURCE.indexOf("&&"),
  };

  /** A tree that is a map. `written` keeps the order so the restore can be asserted, not assumed. */
  const memory = () => {
    const files = new Map([[FILE, SOURCE]]);
    const written: string[] = [];
    return {
      files,
      written,
      io: {
        read: (file: string) => files.get(file)!,
        write: (file: string, contents: string) => {
          files.set(file, contents);
          written.push(contents);
        },
      },
    };
  };

  it("reports nothing when the suite goes red, which is what caught means", async () => {
    const tree = memory();
    const survivors = await runMutants("/nowhere", [MUTANT], async () => {
      throw new Error("the suite failed");
    }, tree.io);
    expect(survivors, "a mutant whose suite went red was reported as surviving").toEqual([]);
    // The mutant was really applied — otherwise "caught" means nothing — and then put back.
    expect(tree.written[0], "no mutant was ever written").toContain("a || b");
    expect(tree.files.get(FILE), "the mutant outlived the run").toBe(SOURCE);
  });

  it("reports the survivor when the suite stays green, by the id W296 spells", async () => {
    const tree = memory();
    const survivors = await runMutants("/nowhere", [MUTANT], async () => {
      /* the suite passes, so nothing catches the change */
    }, tree.io);
    expect(survivors).toEqual([mutantId(MUTANT, SOURCE)]);
    expect(tree.files.get(FILE)).toBe(SOURCE);
  });

  it("restores the original when the runner throws part way through", async () => {
    // W303'S RULE, DRIVEN. A throw between the mutation and the restore leaves the tree mutated for
    // everything that runs after it, which in a copied tree is every remaining mutant in the file.
    const tree = memory();
    await expect(
      runMutants("/nowhere", [MUTANT], async () => {}, {
        read: tree.io.read,
        write: (file: string, contents: string) => {
          if (contents.includes("a || b")) throw new Error("the write failed");
          tree.io.write(file, contents);
        },
      }),
    ).rejects.toThrow("the write failed");
    expect(tree.files.get(FILE), "a throw left the tree mutated").toBe(SOURCE);
  });
});

describe("W332 every survivor is read, not merely listed", () => {
  it("gives each one a kind and an argument long enough to act on", () => {
    for (const survivor of SURVIVORS_AT_W332) {
      const argument =
        survivor.reason.kind === "uncaught" ? survivor.reason.remedy : survivor.reason.why;
      expect(argument.length, `${survivor.id} is named and nobody argued it`).toBeGreaterThan(200);
    }
  });

  it("names a module that exists and an operator W296 has", async () => {
    const { OPERATORS } = await import("./mutation-sampling");
    const names = new Set(OPERATORS.map((o) => o.id));
    for (const survivor of SURVIVORS_AT_W332) {
      const [module, operator] = survivor.id.split(" :: ");
      expect(names.has(operator!), `${survivor.id} names an operator W296 does not have`).toBe(true);
      expect(() => readFileSync(path.join(ROOT, module!), "utf8")).not.toThrow();
    }
  });

  it("states what it does not cover", () => {
    expect(QUARTER_MUTANT_BOUND).toContain("EXTENDED");
    expect(QUARTER_MUTANT_BOUND).toContain("five operators");
    expect(QUARTER_MUTANT_BOUND.length).toBeGreaterThan(600);
  });
});

describe("W332 the full run over the quarter's modules", () => {
  it(
    "catches every mutant but the ones this register names",
    async () => {
      const mutants = quarterMutants(ROOT);
      const suites = [...new Set(mutants.map((m) => m.suite))];

      // The baseline, for W296's reason: a suite already red in the copy makes every mutant in it
      // look caught, and the register would report a clean sweep over a broken fixture.
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
      expect(measurable.length, "nothing was measurable, so this test checks nothing").toBeGreaterThan(40);

      const survivors = await runMutants(
        COPY,
        measurable,
        async (suite) => {
          await pexec("npx", ["vitest", "run", suite], { cwd: COPY, maxBuffer: 1 << 28 });
        },
        FILE_IO,
      );

      const report = samplingReport(survivors, red, SURVIVORS_AT_W332);
      expect(report.unexplained, "a change nothing noticed and nothing here explains").toEqual([]);
      expect(report.stale, "a declared survivor the suite now catches").toEqual([]);
      expect(report.unmeasurable, "a suite was red before anything was mutated").toEqual([]);

      // Non-vacuity: if the harness never applied a mutant every one would read as caught, and if
      // it never ran a suite every one would survive.
      expect(survivors.length).toBe(SURVIVORS_AT_W332.length);
      expect(measurable.length - survivors.length, "nothing was caught, so the harness is inert").toBeGreaterThan(
        40,
      );
    },
    1_800_000,
  );
});

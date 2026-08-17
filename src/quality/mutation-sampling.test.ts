// W296 verify gate: "a sampled set of assertions removed one at a time in a copied tree, each
// required to turn its own suite red; survivors are reported by name rather than counted."
//
// THE FIRST CLAUSE IS UNSATISFIABLE AND THE UNIT SAYS SO RATHER THAN APPROXIMATING IT. Removing a
// passing assertion from a passing suite leaves it passing — that is arithmetic, not a property of
// this tree, and it was built and run before being argued away: forty-seven assertions deleted one
// at a time, thirty-nine suites stayed green, and the eight that went red did so because the
// deleted expression had a side effect or because splicing it out broke the parse. See the module
// header. What is kept is the second clause and the property the first was reaching for: the code
// is changed under a test, and the suite must notice.

import { execFile, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  OPERATORS,
  SAMPLE_RATE,
  SURVIVORS_AT_W296,
  UNTESTED_AT_W296,
  allMutants,
  applyMutant,
  mutantId,
  mutantsIn,
  sampleMutants,
  samplingReport,
  siblingSuite,
  untestedModules,
} from "./mutation-sampling";

const pexec = promisify(execFile);
const ROOT = process.cwd();
const readModule = (module: string) => readFileSync(path.join(ROOT, module), "utf8");
const CONCURRENCY = 4;

let COPY = "";

beforeAll(() => {
  COPY = mkdtempSync(path.join(tmpdir(), "w296-"));
  for (const dir of ["src", "app", "e2e", "supabase", "docs", "scripts"]) {
    cpSync(path.join(ROOT, dir), path.join(COPY, dir), { recursive: true });
  }
  for (const file of ["vitest.config.ts", "package.json", "tsconfig.json", "BUILD-STATE.md"]) {
    cpSync(path.join(ROOT, file), path.join(COPY, file));
  }
  // Symlinked rather than copied: the mutants never touch it and a real copy is the slow half.
  symlinkSync(path.join(ROOT, "node_modules"), path.join(COPY, "node_modules"));
}, 120_000);

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

/** Suites that fail in the copy BEFORE anything is mutated. Every mutant in them is unmeasurable. */
function redAtBaseline(suites: readonly string[]): string[] {
  try {
    execFileSync("npx", ["vitest", "run", ...suites], { cwd: COPY, stdio: "pipe", maxBuffer: 1 << 28 });
    return [];
  } catch (error) {
    const output = String((error as { stdout?: unknown }).stdout ?? "") +
      String((error as { stderr?: unknown }).stderr ?? "");
    return [...new Set([...output.matchAll(/FAIL\s+(\S+\.test\.ts)/g)].map((m) => m[1]!))].sort();
  }
}

describe("W296 the sample is drawn by arithmetic, not chosen", () => {
  it("takes every stride-th site over an order nobody arranged", () => {
    const all = allMutants(ROOT);
    const sample = sampleMutants(all, readModule);
    expect(all.length).toBeGreaterThan(1000);
    // Roughly one in `SAMPLE_RATE`, and "roughly" is honest: a hash does not divide evenly.
    expect(sample.length).toBeGreaterThan(all.length / SAMPLE_RATE / 2);
    expect(sample.length).toBeLessThan((all.length / SAMPLE_RATE) * 2);
    // Spread is the point: a sample concentrated in one module would measure one module.
    expect(new Set(sample.map((m) => m.module)).size).toBeGreaterThan(30);
  });

  it("only samples modules whose own suite could notice", () => {
    for (const mutant of sampleMutants(allMutants(ROOT), readModule)) {
      expect(siblingSuite(ROOT, mutant.module), `${mutant.module} has no sibling suite`).toBe(mutant.suite);
    }
  });

  it("names the modules it cannot sample, rather than leaving them out quietly", () => {
    // The second finding. A module with no sibling test produces no mutants, so it can never
    // produce a survivor — "nothing survived" over it is the vacuity, not a result.
    expect(untestedModules(ROOT)).toEqual([...UNTESTED_AT_W296]);
    expect(UNTESTED_AT_W296.length).toBeGreaterThan(10);
  });

  it("does not find a mutation site in a comment or a string", () => {
    // The collision this tree keeps recording: a module explaining `===` is not one comparing with
    // it, and this file's own operator table is full of the tokens it looks for.
    const prose = '// a note about === and &&\nexport const label = "a === b && c";\n';
    expect(mutantsIn("src/probe.ts", prose, "src/probe.test.ts")).toEqual([]);
    const real = "export const same = (a: number, b: number) => a === b && a >= 0;\n";
    expect(mutantsIn("src/probe.ts", real, "src/probe.test.ts").map((m) => m.operator)).toEqual([
      "eq-to-neq",
      "and-to-or",
      "gte-to-gt",
    ]);
  });

  it("applies the operator it names, and changes exactly one place", () => {
    const source = "export const f = (a: number, b: number) => a === b;\n";
    const mutant = mutantsIn("src/probe.ts", source, "src/probe.test.ts")[0]!;
    const mutated = applyMutant(source, mutant);
    expect(mutated).toContain("a !== b");
    expect(mutated).not.toContain("a === b");
    expect(mutated.length).toBe(source.length);
  });

  it("argues each operator, and inverts a decision rather than nudging a value", () => {
    expect(OPERATORS.length).toBeGreaterThan(3);
    for (const op of OPERATORS) {
      expect(op.why.length, `${op.id} is unargued`).toBeGreaterThan(60);
      expect(op.token).not.toBe(op.becomes);
    }
  });
});

describe("W296 the mutants, run against their own suites", () => {
  it(
    "catches all but the survivors this register names",
    async () => {
      const sample = sampleMutants(allMutants(ROOT), readModule);
      const suites = [...new Set(sample.map((m) => m.suite))];

      // THE BASELINE, and it is not ceremony: a suite already red in the copy makes every mutant
      // in it look caught, and the register would report perfect coverage over a broken fixture.
      const skipped = redAtBaseline(suites);
      const measurable = sample.filter((m) => !skipped.includes(m.suite));
      expect(measurable.length, "nothing was measurable, so this test checks nothing").toBeGreaterThan(30);

      // Grouped by module so two sampled sites in one file are never written concurrently. The
      // hash picks sites independently, so a module CAN contribute more than one — the stride
      // design could not, which is one more thing that changed when it was replaced.
      const byModule = new Map<string, typeof measurable>();
      for (const mutant of measurable) {
        const list = byModule.get(mutant.module) ?? [];
        list.push(mutant);
        byModule.set(mutant.module, list);
      }
      const groups = [...byModule.values()];

      const survivors: string[] = [];
      let next = 0;
      const worker = async () => {
        for (;;) {
          const group = groups[next++];
          if (!group) return;
          const file = path.join(COPY, group[0]!.module);
          const original = readFileSync(file, "utf8");
          for (const mutant of group) {
            writeFileSync(file, applyMutant(original, mutant), "utf8");
            let caught = false;
            try {
              await pexec("npx", ["vitest", "run", mutant.suite], { cwd: COPY, maxBuffer: 1 << 28 });
            } catch {
              caught = true;
            }
            if (!caught) survivors.push(mutantId(mutant, original));
          }
          writeFileSync(file, original, "utf8");
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));

      const report = samplingReport(survivors, skipped);
      expect(report.unexplained, "a change nothing noticed and nothing here explains").toEqual([]);
      expect(report.stale, "a declared survivor the suite now catches").toEqual([]);
      expect(report.unmeasurable, "a suite was red before anything was mutated").toEqual([]);

      // Non-vacuity, and it is the assertion that makes the three above mean anything: if every
      // mutant survived, `unexplained` would be long; if the harness never applied one, every
      // mutant would be "caught" and the survivor list would be empty for the wrong reason.
      expect(survivors.length).toBe(SURVIVORS_AT_W296.length);
      expect(measurable.length - survivors.length, "nothing was caught, so the harness is inert").toBeGreaterThan(
        25,
      );
    },
    600_000,
  );
});

describe("W296 every survivor is read, not merely listed", () => {
  it("gives each one a kind and a remedy long enough to act on", () => {
    for (const survivor of SURVIVORS_AT_W296) {
      expect(survivor.id).toMatch(/^src\/.+ :: .+ :: /);
      const reason = survivor.reason;
      const text = reason.kind === "uncaught" ? reason.remedy : reason.why;
      expect(text.length, `${survivor.id} is listed without being read`).toBeGreaterThan(150);
    }
  });

  it("names an operator the register has, and a module that exists", () => {
    // W258's rule: a row nobody can resolve rots into fiction.
    const operators = new Set(OPERATORS.map((o) => o.id));
    for (const survivor of SURVIVORS_AT_W296) {
      const [module, operator] = survivor.id.split(" :: ");
      expect(operators.has(operator!), `${survivor.id} names no such operator`).toBe(true);
      expect(siblingSuite(ROOT, module!), `${module} has no suite to have missed it`).not.toBeNull();
    }
  });

  it("separates a hole from a test that lives in another file", () => {
    // THE CORRECTION THAT MATTERS MOST HERE. The first run reported eight survivors and reading
    // them showed five were caught by a DIFFERENT suite — `validateClinicians` is exercised where
    // the setup wizard is tested, not in the store's own file. Publishing those five as holes
    // would have been false in the most damaging direction: a register that claims five defects
    // that are not defects teaches its readers to discount the three that are.
    const uncaught = SURVIVORS_AT_W296.filter((s) => s.reason.kind === "uncaught");
    const elsewhere = SURVIVORS_AT_W296.filter((s) => s.reason.kind === "caught_elsewhere");
    expect(uncaught.map((s) => s.id.split(" :: ")[0]).sort()).toEqual([
      "src/capability/experience.ts",
      "src/pathways/simulation.ts",
      "src/synthetic/generate.ts",
    ]);
    expect(elsewhere.length).toBeGreaterThan(4);
    for (const survivor of elsewhere) {
      const reason = survivor.reason as { caughtBy: string };
      // The catching suite is named and must exist — W258, a citation nobody resolved.
      for (const suite of reason.caughtBy.split(", ")) {
        expect(existsSync(path.join(ROOT, suite)), `${survivor.id} cites ${suite}`).toBe(true);
      }
    }
  });
});

describe("W296 the reporter's arms, driven from outside", () => {
  it("reports a survivor nothing explains", () => {
    expect(samplingReport(["src/x.ts :: eq-to-neq :: a === b"], [], []).unexplained).toEqual([
      "src/x.ts :: eq-to-neq :: a === b",
    ]);
  });

  it("reports a declared survivor the run caught", () => {
    const declared = [{ id: "src/x.ts :: eq-to-neq :: a === b", reason: { kind: "equivalent" as const, why: "x" } }];
    expect(samplingReport([], [], declared).stale).toEqual(["src/x.ts :: eq-to-neq :: a === b"]);
  });

  it("reports a suite that was red before anything was mutated", () => {
    expect(samplingReport([], ["src/x.test.ts"], []).unmeasurable).toEqual(["src/x.test.ts"]);
  });
});

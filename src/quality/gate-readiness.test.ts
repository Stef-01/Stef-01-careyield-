// W261 verify gate: "every step resolves to a module, registry or test that exists in the tree; a
// gate with no readiness path fails; counts derived from BUILD-STATE.md and pinned row-by-row."
//
// THE FIRST CLAUSE IS THE UNIT. A readiness path naming a file nobody has written reads like
// preparation and is worse than no path at all — somebody scheduling from it believes work exists
// that nobody has done. So every step's path is OPENED here, and its declared kind is checked
// against what the file actually is: a registry must export something, a test must be a test.
//
// The counts are derived rather than pinned, and that is a considered difference from W257 rather
// than a lapse. DOSSIER-1 is about a document that prices a SNAPSHOT — its numbers go stale when
// the next year is planned, which is why W257 is bounded to Year 5. A readiness path does not
// expire when a year is added, so a Y6 unit blocked on G5 moves the ledger and this register
// together and nothing breaks falsely. `pinning_the_blocked_counts` is a stated refusal.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GATE_READINESS, REFUSED_READINESS_SHAPES, type StepTarget } from "./gate-readiness";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const PLAN = readFileSync(path.join(ROOT, "docs", "FIVE-YEAR-PLAN.md"), "utf8");

/** Gates the plan's §4 defines, minus the one it records as cleared. */
const outstandingGates = (): string[] =>
  [...PLAN.matchAll(/^- \*\*(G\d+)\*\*(.*)$/gm)]
    .filter((m) => !/CLEARED/.test(m[2]!))
    .map((m) => m[1]!);

/** Units the ledger blocks on a decision, derived at read time — never pinned as a number. */
const blockedOn = (decision: string): string[] => {
  const pattern =
    decision === "Q17-action-1"
      ? /FOUNDER DECISION — Q17 action 1/
      : new RegExp(`FOUNDER GATE ${decision}\\b`);
  return [...LEDGER.matchAll(/^\| (W\d+) \| blocked \|(.*)$/gm)]
    .filter((m) => pattern.test(m[2]!))
    .map((m) => m[1]!);
};

describe("W261 every step resolves to something the tree has", () => {
  it("opens every path, and finds a file at each", () => {
    // THE ASSERTION THE UNIT EXISTS FOR. A step pointing at a module nobody wrote is the failure
    // mode this register is built against, and it is invisible to review.
    const missing: string[] = [];
    for (const entry of GATE_READINESS) {
      for (const step of entry.steps) {
        if (!existsSync(path.join(ROOT, step.path))) missing.push(`${entry.gate}: ${step.path}`);
      }
    }
    expect(missing, `steps pointing at files the tree does not have: ${missing.join(", ")}`).toEqual([]);
  });

  it("checks each step's declared kind against what the file actually is", () => {
    // A path that exists but is not what the step claims is the same defect one level down: a step
    // that says "registry" and lands on a page is a step nobody can follow either.
    const expectations: Record<StepTarget, (file: string, source: string) => boolean> = {
      module: (file, source) => /^src\/.*\.tsx?$/.test(file) && /export (function|const|class)/.test(source),
      registry: (file, source) => /^src\/.*\.ts$/.test(file) && /export const [A-Z_]+/.test(source),
      test: (file) => /\.test\.tsx?$/.test(file),
      document: (file) => /^docs\/.*\.md$/.test(file),
    };
    for (const entry of GATE_READINESS) {
      for (const step of entry.steps) {
        const source = readFileSync(path.join(ROOT, step.path), "utf8");
        expect(
          expectations[step.target](step.path, source),
          `${entry.gate}: ${step.path} is declared ${step.target} and is not one`,
        ).toBe(true);
      }
    }
  });

  it("gives every gate at least one step, written as an instruction", () => {
    for (const entry of GATE_READINESS) {
      expect(entry.steps.length, `${entry.gate} has no readiness path`).toBeGreaterThan(0);
      expect(entry.steps.length, `${entry.gate} has an implausible number of steps`).toBeLessThan(8);
      for (const step of entry.steps) {
        expect(step.step.length, `${entry.gate}: a step says nothing`).toBeGreaterThan(40);
        // An instruction rather than a description — the register is read by somebody doing it.
        expect(step.step, `${entry.gate}: "${step.step.slice(0, 30)}" is not an instruction`).toMatch(
          /^[A-Z]\w+/,
        );
      }
    }
  });
});

describe("W261 a gate with no readiness path fails", () => {
  it("covers every outstanding gate the plan defines, and invents none", () => {
    // Both directions against §4. A gate defined with no entry fails; an entry for a gate the plan
    // does not define fails too — the stale direction, which makes a register misleading.
    const declared = GATE_READINESS.map((e) => e.gate).filter((g) => /^G\d+$/.test(g));
    expect(declared.sort()).toEqual(outstandingGates().sort());
    expect(declared.length, "the plan defines no outstanding gate").toBeGreaterThan(5);
  });

  it("includes the one outstanding decision that is not a gate", () => {
    // W257 established it is the only item whose answer could require changing something already
    // published, so a register of gates alone would leave out the one with a published consequence.
    const q17 = GATE_READINESS.find((e) => e.gate === "Q17-action-1");
    expect(q17, "the Q17 decision has no readiness path").toBeDefined();
    expect(q17!.onTheDay).toContain("ALREADY PUBLISHED");
    expect(blockedOn("Q17-action-1"), "the ledger no longer blocks W217 on it").toEqual(["W217"]);
  });

  it("declares each decision exactly once", () => {
    const gates = GATE_READINESS.map((e) => e.gate);
    expect(new Set(gates).size, "a decision has two readiness paths").toBe(gates.length);
  });
});

describe("W261 the counts come from the ledger, row by row", () => {
  it("agrees with the ledger about what each decision blocks, decision by decision", () => {
    // Row by row, W207's shape: each entry checked on its own terms rather than by a total. And
    // DERIVED — a Y6 row blocked on G5 moves the ledger and this check together.
    const totals = GATE_READINESS.map((e) => [e.gate, blockedOn(e.gate).length] as const);
    const blockedRows = [...LEDGER.matchAll(/^\| W\d+ \| blocked \|/gm)].length;
    const accounted = totals.reduce((sum, [, n]) => sum + n, 0);
    expect(accounted, "a blocked row is attributed to no decision in this register").toBe(blockedRows);

    // And the decisions that release units are the ones whose `onTheDay` says what becomes
    // buildable, rather than every entry claiming a release.
    for (const [gate, count] of totals) {
      const entry = GATE_READINESS.find((e) => e.gate === gate)!;
      if (count > 0) {
        expect(entry.onTheDay, `${gate} blocks ${count} units and says nothing about them`).toMatch(
          /buildable|become|release/i,
        );
      }
    }
  });

  it("says of the four zero-blocking gates what they gate instead", () => {
    // W257's finding, carried into the readiness view rather than restated: a gate blocking no row
    // is not a gate costing nothing, and its entry has to earn its place another way.
    const zero = GATE_READINESS.filter((e) => /^G\d+$/.test(e.gate) && blockedOn(e.gate).length === 0);
    expect(zero.map((e) => e.gate).sort()).toEqual(["G1", "G2", "G4", "G7"]);
    for (const entry of zero) {
      expect(entry.onTheDay.length, `${entry.gate} blocks nothing and explains nothing`).toBeGreaterThan(
        100,
      );
    }
  });

  it("pins no blocked count as a literal, which is DOSSIER-1's failure", () => {
    // The considered difference from W257. A readiness path does not expire when a year is added,
    // so nothing here freezes a number that a Y6 row would falsify.
    const source = readFileSync(path.join(ROOT, "src", "quality", "gate-readiness.ts"), "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(code).not.toMatch(/blockedCount|unitsBlocked:\s*\d/);
    expect(REFUSED_READINESS_SHAPES.pinning_the_blocked_counts).toContain("DOSSIER-1");
  });
});

describe("W261 a readiness path never reads as a route to something live", () => {
  it("names the gates that still block after each one is answered", () => {
    // W245's double-blocking, generalised. Ratifying G10 releases no exchange because G1 blocks
    // the credential, and a register that omitted that would read as a route to a byte leaving.
    const g10 = GATE_READINESS.find((e) => e.gate === "G10")!;
    expect(g10.stillBlockedBy).toContain("G1");
    expect(g10.onTheDay).toContain("NO EXCHANGE IS RELEASED");

    const g3 = GATE_READINESS.find((e) => e.gate === "G3")!;
    expect(g3.stillBlockedBy).toEqual(["G1", "G2"]);

    // Every named blocker is itself a decision this register covers, so the graph closes.
    const known = new Set(GATE_READINESS.map((e) => e.gate));
    for (const entry of GATE_READINESS) {
      for (const blocker of entry.stillBlockedBy) {
        expect(known, `${entry.gate} waits on ${blocker}, which has no entry`).toContain(blocker);
        expect(blocker, `${entry.gate} lists itself as its own blocker`).not.toBe(entry.gate);
      }
    }
  });

  it("has at least one gate that releases nothing further, so the graph is not a cycle", () => {
    // Non-vacuity for the closure check above: if every entry waited on another, the register
    // would describe a deadlock and the assertion would still pass.
    const terminal = GATE_READINESS.filter((e) => e.stillBlockedBy.length === 0);
    expect(terminal.length, "every decision waits on another one").toBeGreaterThan(0);
    expect(terminal.map((e) => e.gate)).toContain("G5");
  });

  it("names the six shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_READINESS_SHAPES).sort()).toEqual([
      "a_gate_with_no_entry",
      "a_path_that_ends_at_a_gate",
      "a_step_with_no_file",
      "an_effort_estimate",
      "an_ordering",
      "pinning_the_blocked_counts",
    ]);
    for (const [name, why] of Object.entries(REFUSED_READINESS_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
  });

  it("attaches no effort estimate and no ordering to any step", () => {
    // Nothing here has been built, so a size would be a number with nothing behind it — and it
    // would be read as a commitment by whoever schedules from this register.
    for (const entry of GATE_READINESS) {
      for (const step of entry.steps) {
        expect(step.step, `${entry.gate} sizes a step`).not.toMatch(
          /\b\d+\s*(days?|weeks?|hours?|points?|sprints?)\b/i,
        );
        // Ordinals as SENTENCE CONNECTIVES, not as adjectives. My first version banned the word
        // "first" anywhere and fired on G4's "the guardrails that must be green before the first
        // send" — a noun phrase, and a true one. The check was imprecise rather than wrong in kind,
        // so it moved: W226 made the same correction when a copy rule banned the word "zero" and
        // thereby banned the correct sentence "it is not a zero".
        expect(step.step, `${entry.gate} numbers its steps`).not.toMatch(
          /^(First|Second|Third|Next|Then|Finally|Step \d)\b/,
        );
        expect(Object.keys(step)).toEqual(["step", "path", "target"]);
      }
    }
  });
});

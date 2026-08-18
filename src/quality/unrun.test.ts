// W333 verify gate: "every module with no sibling suite and every branch declared unreachable
// re-derived and NAMED rather than counted, and a planted unreached branch reported."
//
// THE LIVE ASSERTION IS ONE LINE and the rest is about whether it can fail. A register of what a
// suite does not run is the easiest kind in this tree to write vacuously: walk nothing, find
// nothing, report nothing, and agree with a green suite forever.

import { describe, expect, it } from "vitest";
import { UNTESTED_AT_W296, untestedModules } from "./mutation-sampling";
import { withTree } from "./planting";
import { driveBranches } from "./refusal-branches";
import {
  UNRUN_BOUND,
  UNRUN_MODULES,
  dynamicallyImported,
  unreachedBranches,
  unreachedByUnitSuite,
  unrunDefects,
} from "./unrun";

const ROOT = process.cwd();

describe("W333 what a green suite does not run", () => {
  it("agrees with the tree, in every direction", () => {
    expect(unrunDefects(ROOT)).toEqual([]);
  });

  it("names each one with a reason, rather than listing paths", () => {
    expect(UNRUN_MODULES.length).toBeGreaterThan(0);
    for (const { module, runBy } of UNRUN_MODULES) {
      expect(runBy.why.length, `${module} is declared without an argument`).toBeGreaterThan(200);
      expect(runBy.why, `${module} does not say what a suite would add`).toMatch(/would add|would pin/);
    }
  });

  it("separates unreachable from merely unaccompanied, which is what the old list conflated", () => {
    // W296's list is modules with no SIBLING suite — a convention. Most of them are reached by
    // some other suite through ordinary imports, and the difference is the whole finding.
    const unaccompanied = untestedModules(ROOT);
    const unreachable = unreachedByUnitSuite(ROOT);
    expect(unaccompanied.length).toBeGreaterThan(unreachable.length);
    for (const module of unreachable) {
      expect(unaccompanied, `${module} is unreachable and not even unaccompanied`).toContain(module);
    }
    expect(UNTESTED_AT_W296.length).toBe(unaccompanied.length);
  });

  it("reports a module nothing reaches and nothing here explains", () => {
    const undeclared = UNRUN_MODULES.filter((m) => m.module !== "src/synthetic/referrals.ts");
    expect(unrunDefects(ROOT, undeclared)).toEqual([
      { subject: "src/synthetic/referrals.ts", what: "no test suite reaches it and nothing here says why" },
    ]);
  });

  it("reports a declaration the suite has since caught up with", () => {
    const invented = [
      ...UNRUN_MODULES,
      { module: "src/quality/unrun.ts", runBy: { kind: "e2e" as const, why: "x".repeat(210) } },
    ];
    expect(unrunDefects(ROOT, invented).map((d) => d.subject)).toEqual(["src/quality/unrun.ts"]);
  });

  it("refuses an `e2e` claim no page backs up", () => {
    // The arm that stops a declaration saying anything: `reachableFromApp` is asked whether the
    // page suite really reaches what the entry claims it does.
    const lying = UNRUN_MODULES.map((m) =>
      m.module === "src/synthetic/referrals.ts"
        ? { module: "src/lib/rate-limit.ts", runBy: m.runBy }
        : m,
    );
    expect(unrunDefects(ROOT, lying).map((d) => d.what)).toContain(
      "is declared unreachable and the unit suite reaches it",
    );
  });

  it("follows a dynamic import, which the static walk does not", () => {
    // THE FIRST DRAFT SAID FOUR. Both `collateral` builders are reached only by
    // `await import("@/collateral/deck")`, and a register that shipped that answer would have
    // named two modules as unrun that a suite runs on every green build.
    expect(dynamicallyImported(ROOT, [`${ROOT}/src/collateral/collateral.test.ts`])).toContain(
      `${ROOT}/src/collateral/deck.ts`,
    );
    expect(unreachedByUnitSuite(ROOT)).not.toContain("src/collateral/deck.ts");
  });

  it("finds a module in a constructed tree that no test reaches", () => {
    // Driven on a tree of its own, because the live answer is two and a walk that had stopped
    // walking would also say two if the declarations happened to match.
    const found = withTree(
      {
        "src/orphan.ts": "export const orphan = 1;\n",
        "src/seen.ts": "export const seen = 2;\n",
        "src/seen.test.ts": 'import { seen } from "./seen";\nit("t", () => { expect(seen).toBe(2); });\n',
      },
      (root) => unreachedByUnitSuite(root),
    );
    expect(found).toEqual(["src/orphan.ts"]);
  });

  it("holds no branch its own register calls unreachable, and reports a planted one", () => {
    // W333 took the parameter both live ones asked for, so the tree holds none. The arm is driven
    // on a branch constructed here, which is what keeps it a check rather than a fact about today.
    const planted = {
      module: "src/planted/w333.ts",
      fn: "probe",
      branch: "an_arm_nobody_can_construct",
      reach: { kind: "unreached" as const, fixture: "the parameter it does not take" },
    };
    // W293: shown reporting one before it is asserted to report none, both times through the same
    // derivation, so an empty answer is a reading rather than a walk nobody drove.
    expect(unreachedBranches([planted])).toEqual([
      { id: "src/planted/w333.ts::probe::an_arm_nobody_can_construct", fixture: "the parameter it does not take" },
    ]);
    expect(unreachedBranches()).toEqual([]);
    const unreachedIn = (bs: Parameters<typeof driveBranches>[0]) => driveBranches(bs).unreached;
    expect(unreachedIn([planted])).toHaveLength(1);
    expect(unreachedIn(undefined)).toEqual([]);
  });

  it("says what reachable does not mean", () => {
    expect(UNRUN_BOUND).toContain("REACHED IS NOT RUN");
    expect(UNRUN_BOUND).toContain("a coverage number is a total");
  });
});

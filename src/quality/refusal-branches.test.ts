// W291 verify gate: "for each register with a refusal or violation branch, a test that reaches it;
// a branch with no reaching test is listed with the fixture that would reach it."
//
// "A TEST THAT REACHES IT" IS EXECUTED, NOT CITED. W284's register was built on the other idea —
// record which test covers what — and its own central citation resolved to `text.includes("/")`,
// a claim nobody had run. So every branch here carries the input that makes it fire and the input
// is called, and the drive is checked to DISTINGUISH: a fabricated branch whose input does not
// produce it must be reported, or "everything fired" would be what a broken driver says too.
//
// The register is checked against the tree in both directions, by a detector that separates a
// violation REPORTER from a renderer on its return type — a reporter returns a list or a record,
// a renderer returns prose. Shaped that way rather than by an exclusion list, because tuning a
// detector until it agrees with the answer is what W279 refused one quarter earlier.

import { describe, expect, it } from "vitest";
import {
  REFUSAL_BRANCHES,
  REFUSED_BRANCH_SHAPES,
  type RefusalBranch,
  driveBranches,
  violationReporters,
  withRoot,
} from "./refusal-branches";

const ROOT = process.cwd();
const id = (b: { module: string; fn: string; branch: string }) => `${b.module}::${b.fn}::${b.branch}`;
const names = (root: string) => violationReporters(root).map((r) => `${r.module}::${r.fn}`);

describe("W291 the register covers the tree's violation reporters, both directions", () => {
  it("names every reporter the tree has, and none it does not", () => {
    const found = new Set(names(ROOT));
    const declared = new Set(REFUSAL_BRANCHES.map((b) => `${b.module}::${b.fn}`));
    expect([...found].filter((f) => !declared.has(f)), "a reporter with no branch declared").toEqual([]);
    expect([...declared].filter((d) => !found.has(d)), "a branch for a reporter that is gone").toEqual([]);
    expect(found.size).toBe(6);
  });

  it("separates a reporter from a renderer on the return type", () => {
    // Non-vacuity for the detector: `renderDiff` matches the name pattern and returns prose, so a
    // detector matching on the name alone would pull a renderer into a register about refusals.
    const found = names(ROOT);
    expect(found).not.toContain("src/pathways/diff.ts::renderDiff");
    expect(found).toContain("src/quality/route-coverage.ts::coverageDiff");
  });

  it("notices a reporter ARRIVING, and a renderer arriving beside it", () => {
    // W267's demand, and the half of a register that almost none of this tree's twenty-seven prove:
    // a content scan that fires perfectly over a file list missing the new file reports nothing,
    // cleanly, forever. So the walk is pointed at a tree that differs from this one. Both a planted
    // POSITIVE and a planted NEGATIVE, because a walk that reported every match would pass the
    // first on its own.
    const planted = withRoot(
      {
        "src/planted/reporter.ts":
          "export function plantedViolations(\n  input: readonly string[],\n): string[] {\n  return [...input];\n}\n",
        "src/planted/renderer.ts": "export function plantedDiff(input: string): string {\n  return input;\n}\n",
      },
      (root) => names(root),
    );
    expect(planted, "a violation reporter arrives and the walk does not see it").toContain(
      "src/planted/reporter.ts::plantedViolations",
    );
    expect(planted, "a renderer arrives and the walk counts it as a reporter").not.toContain(
      "src/planted/renderer.ts::plantedDiff",
    );
  });

  it("declares every branch once, with a module, a function and an arm", () => {
    expect(new Set(REFUSAL_BRANCHES.map(id)).size).toBe(REFUSAL_BRANCHES.length);
    expect(REFUSAL_BRANCHES.length).toBe(21);
    for (const branch of REFUSAL_BRANCHES) {
      expect(branch.module).toMatch(/^src\/.*\.ts$/);
      expect(branch.branch.length, `${id(branch)} names no arm`).toBeGreaterThan(2);
    }
  });
});

describe("W291 every drivable branch is driven, and fires", () => {
  const report = driveBranches();

  it("has nothing that failed to fire", () => {
    // THE UNIT. Each of these is an arm the tree has never produced in anger, driven with an input
    // constructed to contain the defect it reports.
    expect(report.didNotFire).toEqual([]);
  });

  it("drives nineteen of the twenty-one", () => {
    const driven = REFUSAL_BRANCHES.filter((b) => b.reach.kind === "driven");
    expect(driven).toHaveLength(19);
    // Non-vacuity: if none were drivable, "nothing failed to fire" would be trivially true.
    expect(report.didNotFire.length + driven.length).toBeGreaterThan(15);
  });

  it("reports a drive that does NOT fire, so the clean result means something", () => {
    // The check that makes the check real. A driver that returned true regardless would satisfy
    // every assertion above.
    const fake: RefusalBranch[] = [
      {
        module: "src/fake.ts",
        fn: "fakeViolations",
        branch: "never_fires",
        reach: { kind: "driven", drive: () => false },
      },
    ];
    expect(driveBranches(fake).didNotFire).toEqual(["src/fake.ts::fakeViolations::never_fires"]);
  });

  it("drives each arm to ITS OWN branch, not merely to a non-empty result", () => {
    // A drive that returned "the register reported something" would pass while reaching a
    // different arm entirely. Two arms of one reporter are checked to be reached separately.
    const grew = REFUSAL_BRANCHES.find((b) => b.branch === "grew")!;
    const fell = REFUSAL_BRANCHES.find((b) => b.branch === "fell")!;
    expect(grew.reach.kind).toBe("driven");
    expect(fell.reach.kind).toBe("driven");
    // Opposite budgets, opposite arms: neither drive can be satisfied by the other's input.
    expect((grew.reach as { drive: () => boolean }).drive()).toBe(true);
    expect((fell.reach as { drive: () => boolean }).drive()).toBe(true);
  });
});

describe("W291 an unreachable branch names the fixture that would reach it", () => {
  const report = driveBranches();

  it("reports exactly the two nobody can construct today", () => {
    // Both are `pageSuiteViolations`, and both for the same structural reason: `EXCLUDED_SPECS` is
    // a module constant rather than an argument, so a caller cannot supply a stale or unreasoned
    // exclusion. Pinned so the number cannot grow quietly.
    expect(report.unreached).toEqual([
      "src/quality/page-suite.ts::pageSuiteViolations::excluded_spec_is_stale",
      "src/quality/page-suite.ts::pageSuiteViolations::excluded_without_a_reason",
    ]);
  });

  it("gives each one a remedy rather than a shrug", () => {
    // W210's rule: a finding recorded without the change that would make it actionable is the
    // kind that sits for two years.
    for (const branch of REFUSAL_BRANCHES) {
      if (branch.reach.kind !== "unreached") continue;
      expect(branch.reach.fixture.length, `${id(branch)} is unreached without a fixture`).toBeGreaterThan(120);
      expect(branch.reach.fixture, `${id(branch)}'s remedy names no change`).toMatch(
        /parameter|argument|Parameterise/,
      );
    }
  });

  it("does not fail on them, which is what keeps the honest answer cheap", () => {
    // If an unreachable arm failed the suite, the cheapest way to green would be deleting the
    // branch rather than reporting it.
    expect(report.didNotFire).not.toContain(report.unreached[0]);
    expect(REFUSED_BRANCH_SHAPES.failing_on_an_unreached_branch).toContain("delete the branch");
  });
});

describe("W291 what the drive refuses is written down", () => {
  it("names the five shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_BRANCH_SHAPES).sort()).toEqual([
      "an_unreached_branch_without_a_fixture",
      "citing_a_test_that_covers_it",
      "driving_it_with_the_tree_itself",
      "failing_on_an_unreached_branch",
      "using_a_line_coverage_number",
    ]);
    for (const [name, why] of Object.entries(REFUSED_BRANCH_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_BRANCH_SHAPES.citing_a_test_that_covers_it).toContain("W284");
  });
});

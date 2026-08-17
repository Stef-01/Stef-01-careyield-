// W291: the branch nobody executed.
//
// Q22 produced six vacuous checks in ten units and the hardening register named the sharpest:
// W284's route coverage resolved every citation except the root's, where `specOpens` branched on
// a property of the string and the check became `text.includes("/")` — true of every spec ever
// written. It sat over a claim that happened to be correct, and would have stayed green when it
// stopped being.
//
// EVERY ONE OF THOSE WAS FOUND BY DRIVING SOMETHING, and the common shape is narrower than "test
// your tests": each was a REFUSAL BRANCH — the arm of a register that reports a problem — which no
// fixture had ever reached. A register whose violation list is always empty is indistinguishable
// from a register that cannot produce one, and the tree has now shipped both.
//
// So this drives them. Six registers report violations, between them on twenty-one branches, and
// each branch here carries a `reach` that CONSTRUCTS the input that makes it fire and returns
// whether it did. Not a citation to a test that might cover it — W284's lesson is that a citation
// nobody resolves reads as coverage — and not a coverage percentage, which says a line executed
// and not that anything asserted on it.
//
// A BRANCH NOBODY CAN REACH IS ALLOWED AND MUST NAME ITS FIXTURE, which is the gate's own wording
// and the reason this is a register rather than a pass/fail. "Unreachable today" is a real answer:
// some branches need a store that can fail, and W279 recorded exactly that about
// `could_not_load`. What is refused is leaving it unsaid.
//
// THE FIXTURES ARE CONSTRUCTED, NEVER THE TREE'S OWN INPUT. Driving `coverageDiff(ROOT)` proves
// nothing about its `stale` arm, because this tree has no stale route — the input has to be built
// to contain the defect. Two branches need a filesystem to be wrong in a specific way, and those
// get a temporary root holding the three files the function reads, rather than the repository.
//
// FOUNDER GATE (plan §4): fabricated registry inputs and temporary directories. No store, no
// patient, no page.

import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fallibleDiff } from "./review-w279";
import { duplicateDiff, pinDiff } from "./pins";
import { coverageDiff } from "./route-coverage";
import { censusDiff } from "./register-census";
import { negativeDiff } from "./negative-probes";
import { headerViolations } from "./unit-headers";
import { pageSuiteViolations } from "./page-suite";
import { blockedSurfaceViolations } from "./blocked-surface";
import { coherenceViolations } from "@/tenancy/fixture-coherence";

/** A violation-reporting function found in the tree: the file it lives in and its name. */
export interface ReporterSite {
  module: string;
  fn: string;
}

/**
 * Every exported violation reporter under `root/src`: named `*Violations` or `*Diff`, and
 * returning something listy.
 *
 * A REPORTER IS SEPARATED FROM A RENDERER ON ITS RETURN TYPE. `renderDiff` matches the name
 * pattern and returns prose, so a name-only detector would pull a renderer into a register about
 * refusals. The alternative — an exclusion list — is a detector tuned until it agrees with the
 * answer, which W279 refused one quarter earlier and recorded rather than shipped.
 *
 * IT TAKES A ROOT, so W267's census gets a mutated-tree proof rather than a remedy sentence: the
 * walk is pointed at a constructed tree containing a planted reporter and must report it, and at
 * one containing a planted renderer and must not. A walk welded to `process.cwd()` can only ever
 * be read.
 */
export function violationReporters(root: string): ReporterSite[] {
  const out: ReporterSite[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next") continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) continue;
      const text = readFileSync(full, "utf8");
      // The signature may wrap, so the return type is read from the next 300 characters rather
      // than from the same line — three of the six in this tree wrap their parameters.
      for (const match of text.matchAll(/export function ([A-Za-z0-9_]*(?:Violations|Diff))\(/g)) {
        const returns = /\)\s*:\s*([A-Za-z0-9_[\]<>]+)/.exec(text.slice(match.index, match.index + 300))?.[1];
        if (!returns || returns === "string") continue;
        out.push({ module: path.relative(root, full).split(path.sep).join("/"), fn: match[1]! });
      }
    }
  };
  walk(path.join(root, "src"));
  return out.sort((a, b) => `${a.module}${a.fn}`.localeCompare(`${b.module}${b.fn}`));
}

/** How a branch is shown to fire, or why it cannot be. */
export type Reach =
  /** Drives the register with a constructed input; true when this branch reported. */
  | { kind: "driven"; drive: () => boolean }
  /** Not reachable today, with the fixture that would reach it. Required, not optional. */
  | { kind: "unreached"; fixture: string };

export interface RefusalBranch {
  module: string;
  fn: string;
  /** The arm being reached, as the register names it. */
  branch: string;
  reach: Reach;
}

/** A throwaway root holding only the files a register reads, removed when the probe returns. */
export function withRoot<T>(files: Record<string, string>, probe: (root: string) => T): T {
  const root = mkdtempSync(path.join(tmpdir(), "w291-"));
  try {
    for (const [rel, contents] of Object.entries(files)) {
      const full = path.join(root, rel);
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, contents, "utf8");
    }
    return probe(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const LEDGER_ROW = (n: number) => `| W${n} | done | builder-A | 2026-08-14T00:00Z | abc1234 | a row |`;

/**
 * Every refusal branch in the tree's violation-reporting registers, and how each is reached.
 *
 * Six registers, twenty-one branches. The inputs are constructed rather than borrowed from the
 * tree, because a healthy tree cannot produce any of them — which is exactly why they went
 * undriven long enough to be worth a unit.
 */
export const REFUSAL_BRANCHES: readonly RefusalBranch[] = [
  // ── W290's pin sweep ──────────────────────────────────────────────────────────────────────
  {
    module: "src/quality/pins.ts",
    fn: "pinDiff",
    branch: "undeclared",
    reach: { kind: "driven", drive: () => pinDiff(process.cwd(), []).undeclared.length > 0 },
  },
  {
    module: "src/quality/pins.ts",
    fn: "pinDiff",
    branch: "stale",
    reach: { kind: "driven", drive: () => pinDiff(process.cwd(), [{ module: "src/gone.ts", name: "GONE_AT_W1", classification: { kind: "floor" as const, why: "x".repeat(70) } }]).stale.length > 0 },
  },
  {
    module: "src/quality/pins.ts",
    fn: "pinDiff",
    branch: "liveWithoutArgument",
    reach: { kind: "driven", drive: () => pinDiff(process.cwd(), [{ module: "x", name: "A_AT_W1", classification: { kind: "live_by_design" as const, movedBy: "s", whyStopping: "b" } }]).liveWithoutArgument.length > 0 },
  },
  {
    module: "src/quality/pins.ts",
    fn: "pinDiff",
    branch: "unargued",
    reach: { kind: "driven", drive: () => pinDiff(process.cwd(), [{ module: "x", name: "B_AT_W1", classification: { kind: "floor" as const, why: "short" } }]).unargued.length > 0 },
  },
  {
    module: "src/quality/pins.ts",
    fn: "duplicateDiff",
    branch: "unreconciled",
    reach: { kind: "driven", drive: () => duplicateDiff(process.cwd(), {}).unreconciled.length > 0 },
  },
  {
    module: "src/quality/pins.ts",
    fn: "duplicateDiff",
    branch: "unresolved",
    reach: {
      kind: "driven",
      drive: () => duplicateDiff(process.cwd(), { Y5_FIRST_UNIT: "src/does-not-exist.ts" }).unresolved.length > 0,
    },
  },
  // ── W287's fallible console reads ─────────────────────────────────────────────────────────
  {
    module: "src/quality/review-w279.ts",
    fn: "fallibleDiff",
    branch: "undeclared",
    reach: {
      kind: "driven",
      drive: () => fallibleDiff(process.cwd(), {}).undeclared.length > 0,
    },
  },
  {
    module: "src/quality/review-w279.ts",
    fn: "fallibleDiff",
    branch: "stale",
    reach: {
      kind: "driven",
      drive: () => fallibleDiff(process.cwd(), { "/console/in-memory": "REMEDY: none needed" }).stale.length > 0,
    },
  },
  {
    module: "src/quality/review-w279.ts",
    fn: "fallibleDiff",
    branch: "withoutRemedy",
    reach: {
      kind: "driven",
      drive: () => fallibleDiff(process.cwd(), { "/console/interest": "no remedy stated" }).withoutRemedy.length > 0,
    },
  },
  // ── W284's route coverage ─────────────────────────────────────────────────────────────────
  {
    module: "src/quality/route-coverage.ts",
    fn: "coverageDiff",
    branch: "undeclared",
    reach: {
      kind: "driven",
      drive: () => coverageDiff(process.cwd(), []).undeclared.length > 0,
    },
  },
  {
    module: "src/quality/route-coverage.ts",
    fn: "coverageDiff",
    branch: "stale",
    reach: {
      kind: "driven",
      drive: () =>
        coverageDiff(process.cwd(), [
          { route: "/gone", exercise: { kind: "literal", spec: "landing.spec.ts" } },
        ]).stale.includes("/gone"),
    },
  },
  {
    module: "src/quality/route-coverage.ts",
    fn: "coverageDiff",
    branch: "missingSpec",
    reach: {
      kind: "driven",
      drive: () =>
        coverageDiff(process.cwd(), [
          { route: "/", exercise: { kind: "literal", spec: "no-such.spec.ts" } },
        ]).missingSpec.length > 0,
    },
  },
  {
    module: "src/quality/route-coverage.ts",
    fn: "coverageDiff",
    branch: "unresolvedLiteral",
    reach: {
      kind: "driven",
      drive: () =>
        coverageDiff(process.cwd(), [
          { route: "/console/roi", exercise: { kind: "literal", spec: "landing.spec.ts" } },
        ]).unresolvedLiteral.includes("/console/roi"),
    },
  },
  {
    module: "src/quality/route-coverage.ts",
    fn: "coverageDiff",
    branch: "refusedWithoutReason",
    reach: {
      kind: "driven",
      drive: () =>
        coverageDiff(process.cwd(), [
          { route: "/", exercise: { kind: "refused", why: "no" } },
        ]).refusedWithoutReason.includes("/"),
    },
  },

  // ── W276's fixture coherence ──────────────────────────────────────────────────────────────
  {
    module: "src/tenancy/fixture-coherence.ts",
    fn: "coherenceViolations",
    branch: "incoherent",
    reach: {
      kind: "driven",
      drive: () =>
        coherenceViolations(new Map([["resetStore", ["prac-demo"]]]), ["prac-1"]).incoherent.length > 0,
    },
  },
  {
    module: "src/tenancy/fixture-coherence.ts",
    fn: "coherenceViolations",
    branch: "undeclared",
    reach: {
      kind: "driven",
      drive: () => coherenceViolations(new Map(), ["prac-1"], [], ["resetNew"]).undeclared.length > 0,
    },
  },
  {
    module: "src/tenancy/fixture-coherence.ts",
    fn: "coherenceViolations",
    branch: "stale",
    reach: {
      kind: "driven",
      drive: () =>
        coherenceViolations(
          new Map(),
          ["prac-1"],
          [{ resetter: "resetGone", module: "src/gone.ts", readability: { kind: "readable" }, note: "x" }],
          [],
        ).stale.includes("resetGone"),
    },
  },
  {
    module: "src/tenancy/fixture-coherence.ts",
    fn: "coherenceViolations",
    branch: "opaqueWithoutRemedy",
    reach: {
      kind: "driven",
      drive: () =>
        coherenceViolations(
          new Map(),
          ["prac-1"],
          [
            {
              resetter: "resetSilent",
              module: "src/silent.ts",
              readability: { kind: "opaque", remedy: "shrug" },
              note: "x",
            },
          ],
          ["resetSilent"],
        ).opaqueWithoutRemedy.includes("resetSilent"),
    },
  },

  // ── W267's register census ────────────────────────────────────────────────────────────────
  {
    module: "src/quality/register-census.ts",
    fn: "censusDiff",
    branch: "undeclared",
    reach: { kind: "driven", drive: () => censusDiff(["src/nobody-declared.ts"], []).undeclared.length > 0 },
  },
  {
    module: "src/quality/register-census.ts",
    fn: "censusDiff",
    branch: "stale",
    reach: {
      kind: "driven",
      drive: () =>
        censusDiff(
          [],
          [
            {
              file: "src/gone.ts",
              derives: "x",
              checkedAgainst: "y",
              proof: { kind: "walk_unproven", contentProof: null, remedy: "z" },
              assertion: { kind: "carries_no_assertion", claim: "x", why: "y" },
            },
          ],
        ).stale.includes("src/gone.ts"),
    },
  },

  // ── W263's blocked-surface budget ─────────────────────────────────────────────────────────
  {
    module: "src/quality/blocked-surface.ts",
    fn: "blockedSurfaceViolations",
    branch: "grew",
    reach: {
      kind: "driven",
      drive: () => blockedSurfaceViolations(process.cwd(), 1).some((v) => v.includes("grew to")),
    },
  },
  {
    module: "src/quality/blocked-surface.ts",
    fn: "blockedSurfaceViolations",
    branch: "fell",
    reach: {
      kind: "driven",
      drive: () => blockedSurfaceViolations(process.cwd(), 999).some((v) => v.includes("fell to")),
    },
  },

  // ── W281's unit headers ───────────────────────────────────────────────────────────────────
  {
    module: "src/quality/unit-headers.ts",
    fn: "headerViolations",
    branch: "missing",
    reach: {
      kind: "driven",
      drive: () =>
        withRoot({ "src/probe.ts": "export const x = 1;\n" }, (root) =>
          headerViolations(root, LEDGER_ROW(1)).some((v) => v.includes("no `// W<n>` header")),
        ),
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    fn: "headerViolations",
    branch: "misplaced",
    reach: {
      kind: "driven",
      drive: () =>
        withRoot({ "src/probe.ts": "export const x = 1;\n// W1: recorded far from the top.\n" }, (root) =>
          headerViolations(root, LEDGER_ROW(1)).some((v) => v.includes("outside the header position")),
        ),
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    fn: "headerViolations",
    branch: "unknownUnit",
    reach: {
      kind: "driven",
      drive: () =>
        withRoot({ "src/probe.ts": "// W9999: a unit the ledger does not have.\nexport const x = 1;\n" }, (root) =>
          headerViolations(root, LEDGER_ROW(1)).some((v) => v.includes("does not have")),
        ),
    },
  },

  // ── W275's page-suite gate ────────────────────────────────────────────────────────────────
  {
    module: "src/quality/page-suite.ts",
    fn: "pageSuiteViolations",
    branch: "verify_does_not_chain_e2e",
    reach: {
      kind: "driven",
      drive: () =>
        withRoot(
          {
            "package.json": JSON.stringify({ scripts: { verify: "pnpm typecheck", e2e: "playwright test" } }),
            "playwright.config.ts": "export default {};\n",
            "e2e/probe.spec.ts": "// probe\n",
          },
          (root) => pageSuiteViolations(root).some((v) => v.includes("does not chain")),
        ),
    },
  },
  {
    module: "src/quality/page-suite.ts",
    fn: "pageSuiteViolations",
    branch: "runs_no_spec",
    reach: {
      kind: "driven",
      drive: () =>
        withRoot(
          {
            "package.json": JSON.stringify({ scripts: { verify: "pnpm e2e", e2e: "playwright test" } }),
            "playwright.config.ts": "export default {};\n",
          },
          (root) => pageSuiteViolations(root).some((v) => v.includes("runs no spec at all")),
        ),
    },
  },
  {
    module: "src/quality/page-suite.ts",
    fn: "pageSuiteViolations",
    branch: "suite_narrowed_by_a_filter",
    reach: {
      kind: "driven",
      drive: () =>
        withRoot(
          {
            "package.json": JSON.stringify({ scripts: { verify: "pnpm e2e", e2e: "playwright test --grep smoke" } }),
            "playwright.config.ts": "export default {};\n",
            "e2e/probe.spec.ts": "// probe\n",
          },
          (root) => pageSuiteViolations(root).some((v) => v.includes("narrows the suite")),
        ),
    },
  },
  {
    module: "src/quality/page-suite.ts",
    fn: "pageSuiteViolations",
    branch: "excluded_spec_is_stale",
    reach: {
      kind: "unreached",
      fixture:
        "`EXCLUDED_SPECS` is a module constant rather than an argument, so a stale exclusion cannot be constructed from outside — the only way to reach this arm is to delete a spec the register excludes, which is a change to the tree rather than a fixture. Give `pageSuiteViolations` an `excluded` parameter defaulting to the constant, exactly as `blockedSurfaceViolations` takes its budget and `coverageDiff` its declared list, and this becomes a two-line drive.",
    },
  },
  {
    module: "src/quality/page-suite.ts",
    fn: "pageSuiteViolations",
    branch: "excluded_without_a_reason",
    reach: {
      kind: "unreached",
      fixture:
        "The same shape as the stale arm above and the same one-line remedy: `EXCLUDED_SPECS` is read from module scope, so an exclusion with a short reason cannot be supplied by a caller. Parameterise it and this arm is reachable with a one-entry map.",
    },
  },
  // ── W292's negative probes ────────────────────────────────────────────────────────────────
  {
    module: "src/quality/negative-probes.ts",
    fn: "negativeDiff",
    branch: "unprobed",
    reach: { kind: "driven", drive: () => negativeDiff(undefined, []).unprobed.length > 0 },
  },
  {
    module: "src/quality/negative-probes.ts",
    fn: "negativeDiff",
    branch: "stale",
    reach: { kind: "driven", drive: () => negativeDiff([], undefined).stale.length > 0 },
  },
  {
    module: "src/quality/negative-probes.ts",
    fn: "negativeDiff",
    branch: "unsupportedExemption",
    reach: {
      kind: "driven",
      drive: () =>
        negativeDiff(
          [{ file: "src/x.ts", derives: "d", checkedAgainst: "c", proof: { kind: "mutated_tree", mutation: "m" } }],
          [{ register: "src/x.ts", negative: { kind: "no_detector_of_its_own", why: "asserted rather than earned" } }],
        ).unsupportedExemption.length > 0,
    },
  },
];

export interface BranchReport {
  /** Branches whose drive did not produce them — the list this unit exists to keep empty. */
  didNotFire: string[];
  /** Branches nobody can reach, each naming the fixture that would. Reported, not failed. */
  unreached: string[];
}

/** Drive every branch that claims to be drivable, and report what did not fire. */
export function driveBranches(
  branches: readonly RefusalBranch[] = REFUSAL_BRANCHES,
): BranchReport {
  const didNotFire: string[] = [];
  const unreached: string[] = [];
  for (const entry of branches) {
    const id = `${entry.module}::${entry.fn}::${entry.branch}`;
    if (entry.reach.kind === "unreached") {
      unreached.push(id);
      continue;
    }
    if (!entry.reach.drive()) didNotFire.push(id);
  }
  return { didNotFire: didNotFire.sort(), unreached: unreached.sort() };
}

/**
 * Ways of writing this that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly weakening the drive.
 */
export const REFUSED_BRANCH_SHAPES: Readonly<Record<string, string>> = {
  citing_a_test_that_covers_it:
    "Recording 'this branch is covered by that test' and checking nothing. W284's register was built on exactly that idea and its own central citation resolved to `text.includes(\"/\")` — a claim nobody had run. Every branch here carries the input that makes it fire, and the input is executed.",
  using_a_line_coverage_number:
    "Measuring branch coverage with a tool and calling the arm exercised. Coverage says a line executed; it does not say anything asserted on what the line produced, and the vacuous checks Q22 found were all lines that executed perfectly.",
  driving_it_with_the_tree_itself:
    "Calling `coverageDiff(ROOT)` and reading the result. A healthy tree produces none of these branches — that is what healthy means — so the input has to be CONSTRUCTED to contain the defect. A drive over the tree's own state proves the happy path and nothing else.",
  an_unreached_branch_without_a_fixture:
    "Listing a branch as unreachable and stopping. 'Unreachable today' is a legitimate answer — some arms need a store that can fail, which W279 recorded about `could_not_load` — but a finding with no remedy attached is the kind that sits for two years, which is W210's whole subject. Every unreached branch names the change that would reach it.",
  failing_on_an_unreached_branch:
    "Treating an unreachable arm as a defect. It would make the honest answer expensive and the dishonest one cheap: the way to a green suite would be to delete the branch rather than to report it. Unreached branches are reported by name and counted, and the count is pinned so it cannot grow quietly.",
};

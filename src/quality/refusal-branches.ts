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

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fallibleDiff } from "./review-w279";
import { duplicateDiff, pinDiff } from "./pins";
import { stripComments } from "@/security/reachability";
import { SCAN_SITES, blankLiterals, fixtureDiff, scanSiteDiff } from "./scan-text";
import { BLIND_SPOTS, boundDiff } from "./blind-spots";
import { coverageDiff } from "./route-coverage";
import { censusDiff } from "./register-census";
import { negativeDiff } from "./negative-probes";
import { UNEVIDENCED_AT_W293, emptyListDiff } from "./empty-list-sweep";
import { separatorDiff } from "./citations";
import { planterDiff, withTree, withTree as withRoot } from "./planting";
import { countDiff } from "./register-counts";
import { headerViolations } from "./unit-headers";
import { pageSuiteViolations } from "./page-suite";
import { blockedSurfaceViolations } from "./blocked-surface";
import { coherenceViolations } from "@/tenancy/fixture-coherence";
import { SELF_SCANNING, SPLIT_EXCEPTIONS, holderDiff, splitDiff } from "./self-reference";

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
      // W295: literals blanked, because a reporter written inside a FIXTURE STRING is not a
      // reporter — W295's own module quotes `export function plantedDiff(...)` as a planted probe
      // and this walk declared it a violation reporter the tree must have branches for.
      // RAW TEXT, DELIBERATELY. W295 tried narrowing this scan the way W288 narrowed the tautology
      // sweep — comments stripped, string literals blanked — because W295's fixtures quote
      // `export function planted...` as planted probes. Both narrowings HID REAL REPORTERS: the
      // literal scanner reads a `/` in prose as opening a regex and runs on to the next one,
      // swallowing the `export function` line after it, and which reporters vanished changed with
      // the order the two transforms ran in. A narrowing that silently drops registers is worse
      // than the collision it fixes, so this stays raw and W295's fixtures split the token
      // instead — the idiom `register-census.test.ts` already uses for its own planted walkers.
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

/**
 * A throwaway root holding only the files a register reads, removed when the probe returns.
 *
 * W303 moved the body to `@/quality/planting` and re-exports it here: this was one of four planting
 * harnesses, and two of the four could leave a probe behind. Re-exported under the name its
 * twenty-six callers already use.
 */
export { withRoot };

/**
 * Every refusal branch in the tree's violation-reporting registers, and how each is reached.
 *
 * Six registers, twenty-one branches. The inputs are constructed rather than borrowed from the
 * tree, because a healthy tree cannot produce any of them — which is exactly why they went
 * undriven long enough to be worth a unit.
 */
/** W291's refusal branches — declared in W305's manifest, beside each module's census entry. */
import { REFUSAL_BRANCHES } from "./manifest";
export { REFUSAL_BRANCHES };

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

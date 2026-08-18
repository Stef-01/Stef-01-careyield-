// W327: which instant a control answers at.
//
// A CHECK IN THIS TREE ANSWERS AT THE MOMENT SOMEBODY RUNS IT, and several of them are about
// moments the suite never occupies. Q26's subject, and Q25 produced the evidence four times: a
// close that happens after the gate, a deferral pointing at a unit nothing evaluates, a residue
// detector that passes whenever it runs before whatever plants, and a p95 budget that failed at
// 153.6ms in a full parallel run and passed three times out of three alone.
//
// THIS UNIT TAKES THE NARROW, MECHANICAL HALF: a control that reads SHARED MUTABLE STATE — state
// something other than the control can change while a run is in progress — does not answer about
// the tree. It answers about the tree AT AN INSTANT, and nothing says which.
//
// THE DISTURBANCE IS THE RACE MADE DETERMINISTIC. Re-running a suite and hoping to catch a race is
// what made PLANT-1 read as a flake for two firings: W322's row records the failing file being
// different each time, because the file that loses is whichever one is walking. So the state a
// racing worker would have created is PLANTED instead, into a copy of the tree, and every declared
// control is run twice over that one copy — once quiet, once disturbed. A control whose answer
// moves is instant-dependent, and it either says so here or fails.
//
// TWO MOVED ON THE FIRST RUN AND THEY ARE DIFFERENT IN KIND.
//
//   `fixtureFiles` WENT FROM ONE TO TWO, which is not a robustness question. `SELF_REFERENCE_BOUND`
//   opens exactly while `fixtureFiles(root).length < 2`, so a DEPENDENCY shipping one file with the
//   fixture extension lifts a stated bound — W297 then reports it stale and reddens the suite for
//   a reason that has nothing to do with anything in this repository. Q24-CR-7 raised the walk in
//   October and W318 retargeted it here; this is the unit it points at, so it is fixed rather than
//   passed on again.
//
//   `textFiles` GAINED A FILE FROM A TOOL'S OUTPUT DIRECTORY, and that one is not a defect. W116's
//   question is what tooling has to be able to read as text, and tooling reads the whole working
//   directory including the parts nobody committed. It is declared here with the instant it answers
//   at rather than narrowed, because narrowing it would answer a different question.
//
// AND ONE CONTROL CANNOT BE DRIVEN AT ALL, which is worth more than the two that can. W322's
// residue detector asks whether the REPOSITORY holds a planted directory. Driving it means creating
// that directory in the repository — the exact act it exists to catch, while other workers walk the
// tree. A control that reads the repository cannot be tested without writing to the repository.
// It is declared with `run: null` and the reason, and its remedy is W328's.
//
// WHAT THIS DOES NOT PROVE is `INSTANT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Everything is planted into a temporary copy.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { copyTree } from "./planting";
import {
  exportedResetters,
  modulesWithNoUnitHeader,
  pageSpecFiles,
  sourceModules,
  storeModules,
  testModules,
  textFiles,
  typescriptFiles,
} from "./tree-walks";
import { treeWalkingFiles } from "./register-census";
import { fixtureFiles } from "./self-reference";

/** State a control can read that something other than the control changes. */
export type SharedState = "the working directory" | "the installed dependencies" | "the machine";

/**
 * The three, argued once each.
 *
 * NOT A TAXONOMY FOR ITS OWN SAKE: each names a different WRITER, and the writer is what decides
 * whether a moving answer is a defect. A control that moves because a sibling test worker wrote
 * something has a bug; one that moves because somebody ran `pnpm install` is reading the wrong
 * tree; one that moves because the machine was busy is measuring the machine.
 */
export const SHARED_STATE: Readonly<Record<SharedState, string>> = {
  "the working directory":
    "Written by the test run itself. Vitest runs files in parallel workers over ONE checkout, so a harness that plants into the repository is writing into a tree other workers are reading — PLANT-1, which read as a flake for two firings because the file that loses the race is whichever one happens to be walking. This is the only shared state whose writer is inside the run, and the only one where the same command answers differently twice in a row.",
  "the installed dependencies":
    "Written by `pnpm install`, and by whatever a dependency chooses to ship. A walk that recurses from the repository root without excluding `node_modules` is reading sixty thousand files this tree did not write and cannot review, and its answer changes when a lockfile does. The failure is not slowness: it is that a claim about THIS tree turns out to be a claim about the registry.",
  "the machine":
    "Written by nothing in the repository. A wall-clock budget answers about the machine and the load on it — `sim/fleet.test.ts` failed its p95 at 153.6ms against 150ms inside a full parallel run and passed three times out of three alone, on the same commit. Nothing here fixes that class; it is named so a red budget is read as contention rather than as a regression.",
};

/** A control that reads shared state, with the instant it answers at. */
export interface Control {
  /** `module::export`, resolved against the module. */
  id: string;
  reads: SharedState;
  /** Which moment its answer describes, in the module's own terms. */
  instant: string;
  /** What that instant cannot see — the half a green answer does not cover. */
  cannotSee: string;
  /**
   * Whether its answer may legitimately move when the shared state does.
   *
   * BOTH DIRECTIONS ARE CHECKED: a control declared to move and standing still is a declaration
   * that has stopped being true, which is how an exemption outlives its reason.
   */
  mayMove: boolean;
  /**
   * Driven quiet and disturbed. `null` when driving it would require doing the thing it warns
   * about — see the note about the residue detector at the top of this file.
   */
  run: ((root: string) => readonly unknown[]) | null;
}

/**
 * The state a racing worker, an install, or a tool would have left behind.
 *
 * ONE DISTURBANCE FOR EVERY CONTROL, rather than one tailored to each. A per-control disturbance is
 * a detector tuned until it agrees with its author: the question is whether the answer depends on
 * state outside this tree, and the honest way to ask it is to add that state once and look.
 */
export function disturb(root: string): void {
  mkdirSync(path.join(root, "node_modules/a-dependency"), { recursive: true });
  writeFileSync(path.join(root, "node_modules/a-dependency/shipped.fixtures"), "=== a ===\nb\n");
  writeFileSync(path.join(root, "node_modules/a-dependency/shipped.ts"), "export const x = 1;\n");
  mkdirSync(path.join(root, "coverage"), { recursive: true });
  writeFileSync(path.join(root, "coverage/report.ts"), "export const y = 1;\n");
}

export const CONTROLS: readonly Control[] = [
  {
    id: "src/quality/self-reference.ts::fixtureFiles",
    reads: "the installed dependencies",
    instant:
      "The first-party directories, as of the moment it runs. It used to be the whole repository, which is what Q24-CR-7 raised and this unit fixed.",
    cannotSee:
      "A file with the fixture extension outside the first-party directories. That is the point: `SELF_REFERENCE_BOUND` opens while fewer than two exist, so before the fix a dependency shipping one lifted a stated bound and W297 reported it stale — a red suite caused by a lockfile.",
    mayMove: false,
    run: fixtureFiles,
  },
  {
    id: "src/quality/tree-walks.ts::textFiles",
    reads: "the working directory",
    instant:
      "The whole working directory as it stands on disk, committed or not, minus the excluded directories.",
    cannotSee:
      "The difference between what is tracked and what a tool left behind. W116 asks what tooling must be able to read as text and tooling reads the checkout, so this is the question actually being asked — but it means a dirty tree and a fresh clone give different answers, and a file this repository never committed can fail a hygiene check.",
    mayMove: true,
    run: textFiles,
  },
  {
    id: "src/quality/tree-walks.ts::sourceModules",
    reads: "the working directory",
    instant: "`src/` as of the moment it runs.",
    cannotSee:
      "Anything outside `src/`. Scoped by construction rather than by exclusion, which is why an install cannot reach it — most of this tree's walks are this shape and it is the reason only two moved.",
    mayMove: false,
    run: sourceModules,
  },
  {
    id: "src/quality/tree-walks.ts::typescriptFiles",
    reads: "the working directory",
    instant: "`src/` as of the moment it runs.",
    cannotSee: "Anything outside `src/`, for the same reason as `sourceModules`.",
    mayMove: false,
    run: typescriptFiles,
  },
  {
    id: "src/quality/tree-walks.ts::testModules",
    reads: "the working directory",
    instant: "`src/` as of the moment it runs.",
    cannotSee:
      "The `e2e/` specs, which are tests this walk does not return — a distinction W284's register depends on and which nothing about instants changes.",
    mayMove: false,
    run: testModules,
  },
  {
    id: "src/quality/tree-walks.ts::storeModules",
    reads: "the working directory",
    instant: "`src/` as of the moment it runs.",
    cannotSee: "A store outside `src/`, which this tree does not have and would not notice if it did.",
    mayMove: false,
    run: storeModules,
  },
  {
    id: "src/quality/tree-walks.ts::pageSpecFiles",
    reads: "the working directory",
    instant: "`e2e/` as of the moment it runs.",
    cannotSee: "A spec kept anywhere else, which is why W275's count is a floor rather than a total.",
    mayMove: false,
    run: pageSpecFiles,
  },
  {
    id: "src/quality/tree-walks.ts::exportedResetters",
    reads: "the working directory",
    instant: "`src/` as of the moment it runs.",
    cannotSee: "A resetter written some way the regex does not match, which is W51's own stated limit.",
    mayMove: false,
    run: exportedResetters,
  },
  {
    id: "src/quality/tree-walks.ts::modulesWithNoUnitHeader",
    reads: "the working directory",
    instant: "`src/` as of the moment it runs.",
    cannotSee: "A header naming a unit that does not exist, which is W281's question rather than this one.",
    mayMove: false,
    run: modulesWithNoUnitHeader,
  },
  {
    id: "src/quality/register-census.ts::treeWalkingFiles",
    reads: "the working directory",
    instant: "`src/`, `app/` and `scripts/` as of the moment it runs.",
    cannotSee:
      "A walk written in a directory it is not pointed at. It recurses from three named roots rather than from the repository, which is what keeps an install out of W267's census.",
    mayMove: false,
    run: (root) => treeWalkingFiles(root),
  },
  {
    id: "src/quality/latent-findings.ts::PLANT-2",
    reads: "the working directory",
    instant:
      "The repository, at whatever point in the run this trigger happens to execute — which is why it fired on one directory run and not on the three after it.",
    cannotSee:
      "A plant that happens LATER in the same run. It passes whenever it runs before whatever writes, so a green answer means *nothing had planted yet*, not *nothing plants*. W321's `pnpm verify` went green while leaving the residue behind.",
    mayMove: false,
    // NOT DRIVEN, AND THE REASON IS THE FINDING. Driving it means creating the planted directory in
    // this repository while other workers walk it — the act it exists to catch. A control that
    // reads the repository cannot be demonstrated without writing to the repository, which is why
    // its remedy is a unit of its own rather than a probe here. W328 holds it.
    run: null,
  },
];

/** A control whose answer moved when the shared state did. */
export interface Instability {
  control: string;
  what: string;
}

/**
 * Every declared control, run quiet and disturbed over ONE copied tree — both directions.
 *
 * NAMED `*Diff` BECAUSE IT IS ONE, and because W291's population is keyed on that name. It reports
 * a control whose answer moved and is not declared to, and a control declared to move that stood
 * still; declaring branches for a function outside W291's naming rule made REPORTER-1 fire, which
 * is the finding working — a register with arms nothing can find is a register that drops out.
 *
 * The copy is made once and disturbed in place, so the two answers differ by the disturbance and by
 * nothing else — comparing a real root against a copy would report every difference between them
 * as instability.
 */
export function instantDiff(root: string, controls: readonly Control[] = CONTROLS): Instability[] {
  const drivable = controls.filter((c) => c.run !== null);
  const copy = copyTree(root);
  try {
    const quiet = new Map(drivable.map((c) => [c.id, c.run!(copy).length]));
    disturb(copy);
    const out: Instability[] = [];
    for (const control of drivable) {
      const before = quiet.get(control.id)!;
      const after = control.run!(copy).length;
      if (after !== before && !control.mayMove) {
        out.push({
          control: control.id,
          what: `answers ${before} quiet and ${after} disturbed, and is not declared to move`,
        });
      }
      if (after === before && control.mayMove) {
        out.push({
          control: control.id,
          what: `is declared to move with the shared state and did not, at ${after}`,
        });
      }
    }
    return out.sort((a, b) => `${a.control}${a.what}`.localeCompare(`${b.control}${b.what}`));
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

/** What a green sweep does not prove. */
export const INSTANT_BOUND =
  "The disturbance is one state, chosen because it is the one this tree's evidence produced: a " +
  "dependency that ships files and a tool that writes a directory. A control reading shared state " +
  "some other way — an environment variable, a lockfile's contents, the order two workers finish " +
  "in — moves under a disturbance nobody planted here, and the register would report the tree " +
  "stable over all of it. That is the class of bound W267 states about `readdirSync`, with the " +
  "same remedy: the disturbance grows and says so. SECOND, AND SHARPER: THE ONE CONTROL THIS UNIT " +
  "MOST WANTED TO DRIVE CANNOT BE DRIVEN. A detector that reads the repository is demonstrated " +
  "only by writing to the repository, which is the act it exists to catch and which W322 forbade " +
  "for good reason, so it is declared and not proved. THIRD, A COUNT IS NOT AN ANSWER. Stability " +
  "is compared by length, so a control that swapped one file for another under disturbance reads " +
  "as stable here. Comparing contents would report every path difference between a copy and its " +
  "original, which is a different unit's problem. AND NOTHING HERE REACHES THE MACHINE: the " +
  "wall-clock class is named in `SHARED_STATE` and has no probe, because a budget that answers " +
  "about contention cannot be made to answer about anything else by planting a file.";

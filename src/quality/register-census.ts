// W267: every register that reads the tree, enumerated — and which of them has ever been shown
// to notice anything.
//
// `AUDIT-Y5.md` ended on a sentence this unit exists to act on: *a tree whose registers catch its
// own defects makes a self-reviewing auditor look effective, and the two are not the same thing.*
// Year 5's audit found one LOW finding because the registers got to everything else first. They
// are now this tree's principal control. **Nobody has ever checked that they would notice.**
//
// WHAT A REGISTER HERE IS. Twenty-six files derive something from the tree by walking it and check
// a declared list against what they found: W102's route census, W106's record classes, W167's fold
// sites, W200's copy surface, W201's decision register, W153's instruction sinks, W107's
// reachability, and nineteen more. Each exists for one failure: **a file arrives in the tree and
// nobody declares it.** That is the event they are all built to catch.
//
// AND ALMOST NONE OF THEM HAS EVER SEEN ONE ARRIVE. Reading all twenty-six turned up a distinction
// that had gone unnoticed because both halves are called "the scan":
//
//   Many of these files DO carry a fires-on-known-bad proof, and this tree is rigorous about it —
//   `credentials.test.ts` plants a secret into the text of a real module and requires the scanner
//   to see it; `send-path.test.ts` drives its pattern against four strings that must match. Both
//   prove the CONTENT SCANNER. Neither proves the WALK.
//
//   The walk is the other half, and it is the half the register is for. A content scanner that
//   fires perfectly over a file list missing the new file reports nothing, cleanly, forever. Not
//   one of the twenty-six proves its own walk by putting a file in front of it.
//
// WHY THAT WENT UNPROVED, AND IT IS STRUCTURAL RATHER THAN CARELESS. A walk can only be tested by
// pointing it at a DIFFERENT tree, and a detector can only be pointed at a different tree if it
// takes a root. Four shipped detectors do — `discoverSurfaces(appDir)`, `discoverFoldSites(root)`,
// `findInstructionSinks(root)`, `reachableFromApp(root)` — and this unit proves all four by
// copying the tree, adding a file, and requiring each to report it. The other twenty-two close
// over the repository root inside the test file that owns them: there is no second tree to give
// them, so the proof is not merely missing, it is **unavailable until somebody adds a parameter**.
// So every unproven entry below carries the one-line change that would make it provable, and a
// test requires it — a finding with no remedy attached is the kind that sits for two years, which
// is what W210 was written about.
//
// THIS MODULE IS SUBJECT TO ITSELF. `treeWalkingFiles` walks the tree, so `register-census.ts`
// appears in its own census and is proved the same way as the other four. A register of registers
// that exempted itself would be answering its own question, which is W201's rule about the one
// exclusion it allows and states.
//
// KNOWN BOUND, stated rather than filed quietly: "walks the tree" is detected as a call to
// `readdirSync(` in code with comments subtracted. A walker written with `glob`, `fs.opendir` or a
// shell-out would be invisible here, and the census would report clean over it. That is the same
// class of bound W201's detector states, and the same remedy applies — when one arrives, the
// detector grows a second scan and says so, rather than the register growing an exemption.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads source files and writes only into a
// temporary copy that never becomes part of the tree.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { stripComments } from "@/security/reachability";

/** How, if at all, this register's WALK has been shown to notice a file arriving. */
export type WalkProof =
  /**
   * Proved in `register-census.test.ts` by copying the tree, adding a file and requiring the
   * detector to report it. Available only where the detector takes a root.
   */
  | { kind: "mutated_tree"; mutation: string }
  /**
   * Not proved, and not provable from outside the file that owns it.
   *
   * `contentProof` is cited where the file DOES prove its content scanner fires, because the
   * distinction is the unit's finding and a register that flattened it would be unfair to work
   * that was done carefully. `remedy` is the change that would make the walk provable — required,
   * because a finding with no remedy attached is the kind that sits for two years.
   */
  | { kind: "walk_unproven"; contentProof: string | null; remedy: string };

/**
 * W289: how this register's ASSERTION — not its walk — has been shown to be able to fail.
 *
 * THE OTHER HALF OF W267'S FINDING. That unit split "the scan" into a content scanner and a walk
 * and proved the walks. Both halves can work and the register still catch nothing, because between
 * them sits the comparison — `expect(diff.undeclared).toEqual([])` — and nothing has ever handed
 * that comparison a declared list it should reject. A walk that notices an arriving file and a
 * diff that never reports it is a register that passes forever.
 *
 * AND THE STRUCTURAL REASON IS THE SAME ONE, ONE ARGUMENT OVER. W267: a walk can only be tested by
 * pointing it at a different tree, and only a detector that takes a `root` can be pointed anywhere.
 * Here: an assertion can only be tested by giving it a different DECLARED list, and only a
 * comparison exported as a function taking that list can be given one. Twenty-five of these
 * registers do their comparing inside a `.test.ts` file, which exports nothing — so the proof is
 * not merely missing, it is unavailable until somebody moves the comparison out.
 *
 * `claim` and `mutation` are required of every entry, including the ones that cannot be driven: a
 * register that cannot say what its assertion claims has not been read by anybody.
 */
export type AssertionProof =
  /** Driven in `assertion-drives.test.ts` by handing the comparison an input it must reject. */
  | { kind: "driven_here"; claim: string; mutation: string }
  /**
   * Already driven by W291's branch register. `branch` is a `REFUSAL_BRANCHES` id, and W289's test
   * RESOLVES it and CALLS it rather than recording it — W284's citation resolved to
   * `text.includes("/")`, which is what an unexecuted citation is worth.
   */
  | { kind: "driven_by_branch"; claim: string; mutation: string; branch: string }
  /** The comparison is not callable from outside, with the change that would make it callable. */
  | { kind: "assertion_unproven"; claim: string; mutation: string; remedy: string }
  /**
   * In the census for walking, but asserting nothing of its own.
   *
   * The escape hatch, so it is closed: `assertion-drives.test.ts` pins the exact set of files
   * allowed to use this, with the argument for each. Three today, and a fourth is a decision
   * somebody writes down rather than a kind somebody reaches for.
   */
  | { kind: "carries_no_assertion"; claim: string; why: string };

export interface TreeDerivedRegister {
  /** The file that walks the tree, as the tree spells it. */
  file: string;
  /** What it reads off the tree. */
  derives: string;
  /** The declared thing it compares that against. */
  checkedAgainst: string;
  proof: WalkProof;
  assertion: AssertionProof;
}

/** W267's census, one entry per module — declared in W305's manifest and re-exported here. */
import { TREE_DERIVED_REGISTERS } from "./manifest";
export { TREE_DERIVED_REGISTERS };

const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

/**
 * Every file under `root` that walks the tree.
 *
 * COMMENTS ARE SUBTRACTED FIRST, and the subtraction is asserted real by this unit's test. W173's
 * method, and it is needed here for the usual reason: this module's own note explains what it
 * looks for, and a note about a scan is not a scan. The bound — that a walker written with `glob`
 * or `fs.opendir` is invisible — is stated in the module note rather than hidden here.
 */
export function treeWalkingFiles(root: string, roots: readonly string[] = ["src", "app", "scripts"]): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx|mts)$/.test(entry)) continue;
      const code = stripComments(readFileSync(full, "utf8"));
      // W282 ADDED THE SECOND SCAN, and the module note's own bound said this was the remedy: when
      // a walker arrives that the first scan cannot see, the detector grows a scan and says so
      // rather than the register growing an exemption. Seven walks moved into `tree-walks.ts` to
      // be given roots, and a file that derives from the tree THROUGH a shared rooted walk still
      // derives from the tree — a census that lost them the moment they became provable would be
      // measuring how the walking is spelled rather than which registers do it.
      if (code.includes("readdirSync(") || code.includes('from "@/quality/tree-walks"') || code.includes('from "./tree-walks"')) {
        found.push(relative(root, full).split(sep).join("/"));
      }
    }
  };
  for (const dir of roots) walk(join(root, dir));
  return found.sort();
}

export interface CensusDiff {
  /** Files that walk the tree and are not declared here. */
  undeclared: string[];
  /** Declared files that no longer walk the tree — a register describing code that has moved. */
  stale: string[];
}

export function censusDiff(
  actual: readonly string[],
  declared: readonly TreeDerivedRegister[] = TREE_DERIVED_REGISTERS,
): CensusDiff {
  const declaredFiles = new Set(declared.map((d) => d.file));
  const actualFiles = new Set(actual);
  return {
    undeclared: actual.filter((f) => !declaredFiles.has(f)).sort(),
    stale: [...declaredFiles].filter((f) => !actualFiles.has(f)).sort(),
  };
}

/** The registers whose walk has never been shown to notice a file arriving. The finding. */
/**
 * The registers whose walk has never been shown a file arriving, BY NAME.
 *
 * W290 replaced a count here — `walkProven().length` — and the reason is written in the thing it
 * replaced: that assertion's comment had been amended by FIVE consecutive units (W275, W281, W282,
 * W288, W291), each explaining why the number had moved, none of them reading it. A pin five
 * authors edit in a row is a pin whose signal is noise.
 *
 * The property those units actually wanted is that this list only SHRINKS, and only by deliberate
 * work. A register arriving already proved — which W282 made the default by putting the rooted
 * walks in one module — does not touch it, which is why the count moved five times and this would
 * not have moved once. A register arriving UNPROVEN does move it, and should: that is the event
 * W267 exists to catch. A register losing its proof moves it too.
 */
export const UNPROVEN_AT_W290: readonly string[] = [
  "src/api/surface.test.ts",
  "src/capacity/copy-lint.test.ts",
  "src/capacity/coupling.test.ts",
  "src/credentials/vault.test.ts",
  "src/directory/dossier-claims.test.ts",
  "src/education/advice-lint.test.ts",
  "src/interop/credentials.test.ts",
  "src/messaging/send-path.test.ts",
  "src/privacy/automated-decisions.test.ts",
  "src/privacy/capacity-privacy.test.ts",
  "src/privacy/erasure-y5.test.ts",
  "src/privacy/outcomes-privacy.test.ts",
  "src/quality/audit-y5.test.ts",
  "src/quality/dossier-q18.test.ts",
  "src/quality/g5-rehearsal.test.ts",
  "src/referrals/scoping.test.ts",
  "src/reporting/retention.test.ts",
];

export function walkUnproven(
  declared: readonly TreeDerivedRegister[] = TREE_DERIVED_REGISTERS,
): TreeDerivedRegister[] {
  return declared.filter((d) => d.proof.kind === "walk_unproven");
}

/** The registers this unit proves by moving the tree under them. */
export function walkProven(
  declared: readonly TreeDerivedRegister[] = TREE_DERIVED_REGISTERS,
): TreeDerivedRegister[] {
  return declared.filter((d) => d.proof.kind === "mutated_tree");
}

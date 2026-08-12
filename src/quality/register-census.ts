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

export interface TreeDerivedRegister {
  /** The file that walks the tree, as the tree spells it. */
  file: string;
  /** What it reads off the tree. */
  derives: string;
  /** The declared thing it compares that against. */
  checkedAgainst: string;
  proof: WalkProof;
}

/** The one-line change that makes a welded walk provable. Same sentence for the same defect. */
const EXPORT_THE_WALK =
  "Export the walk from a module with a `root` parameter, the way `discoverFoldSites(root)` and `reachableFromApp(root)` already do, so it can be pointed at a tree that differs from this one.";

export const TREE_DERIVED_REGISTERS: readonly TreeDerivedRegister[] = [
  {
    file: "src/compliance/surfaces.ts",
    derives: "Every route the App Router serves, from the file conventions under `app/`.",
    checkedAgainst: "W102's surface census in the compliance dossier.",
    proof: {
      kind: "mutated_tree",
      mutation: "a new `page.tsx` is added under `app/` and `diffCensus` must report it unmapped",
    },
  },
  {
    file: "src/quality/order-independence.ts",
    derives: "Every module containing a fold, with how many folds each contains.",
    checkedAgainst: "W167's `FOLD_SITES`, each with a tie-break test or a written rationale.",
    proof: {
      kind: "mutated_tree",
      mutation: "a new module containing a fold is added under `src/` and `diffFoldRegister` must report it undeclared",
    },
  },
  {
    file: "src/security/instruction-sinks.ts",
    derives: "Every occurrence of a model-endpoint marker in first-party source, tests included.",
    checkedAgainst: "W153's `DECLARED_INSTRUCTION_SINKS`.",
    proof: {
      kind: "mutated_tree",
      mutation: "a file naming a model endpoint is added and `undeclaredInstructionSinks` must return it",
    },
  },
  {
    file: "src/security/reachability.ts",
    derives: "Every first-party module and npm package reachable from a request-serving path.",
    checkedAgainst: "W107's package allowance, and W201's dormancy proof for a decision not in use.",
    proof: {
      kind: "mutated_tree",
      mutation: "a page importing a previously unreachable module is added and `reachableFromApp` must reach it",
    },
  },
  {
    file: "src/quality/register-census.ts",
    derives: "Every file that walks the tree, by `readdirSync(` in code with comments subtracted.",
    checkedAgainst: "This register. It is subject to itself; see the module note.",
    proof: {
      kind: "mutated_tree",
      mutation: "a new tree-walking file is added and `censusDiff` must report it undeclared",
    },
  },
  {
    file: "src/api/surface.test.ts",
    derives: "Every route file under the API root, to prove there is exactly one.",
    checkedAgainst: "W253's single-dispatcher rule — an unscoped endpoint has nowhere to be written.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/api/surface.test.ts :: gives no endpoint a way to accept a practice from a caller",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/capacity/copy-lint.test.ts",
    derives: "Every capacity module carrying operator copy.",
    checkedAgainst: "W226's declared capacity copy surface.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/capacity/copy-lint.test.ts :: finds copy to check, so the census cannot pass vacuously",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/capacity/coupling.test.ts",
    derives: "Source across the tree, to prove no caller enables the coupling.",
    checkedAgainst: "W231's `ENABLED_COUPLINGS`, pinned empty.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/compliance/cdss-boundary.test.ts",
    derives: "Every Y4-or-later module, from each module's own `// W<n>` header.",
    checkedAgainst: "W200's `OPERATOR_COPY_SURFACES` and the `NAMESPACES` loader, both directions.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/compliance/cdss-boundary.test.ts :: still fires on advice, so the clean result means something",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/credentials/vault.test.ts",
    derives: "Every route under `app/`, to prove none serves an evidence document.",
    checkedAgainst: "W109's isolation rule and G6.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/directory/dossier-claims.test.ts",
    derives: "Directory source, to check the Q15 dossier's factual claims against it.",
    checkedAgainst: "W195's dossier claims, pinned row by row.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/domain/schema-consistency.test.ts",
    derives: "Every SQL migration, to check the domain types against the schema.",
    checkedAgainst: "`src/domain/types.ts`.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/education/advice-lint.test.ts",
    derives: "Every education module carrying copy.",
    checkedAgainst: "W150's `EDUCATION_COPY_MODULES`.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/education/advice-lint.test.ts :: catches a W6-only rule",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/interop/credentials.test.ts",
    derives: "Credential-shaped literals across the whole tree, tests included.",
    checkedAgainst: "W242's `SHIPPED_CREDENTIALS`, pinned empty behind G1.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/interop/credentials.test.ts :: would catch one planted in a real file",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/lib/source-hygiene.test.ts",
    derives: "Every source file, to require it be text tooling can read as text.",
    checkedAgainst: "W116's hygiene rules.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/lib/stores.test.ts",
    derives: "Every store module in the tree.",
    checkedAgainst: "W51's store registry, which had already drifted four stores when it was written.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/messaging/send-path.test.ts",
    derives: "Every module that could wire an SMS adapter.",
    checkedAgainst: "W182's rule that the send path is unwired — a control rather than a claim.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/messaging/send-path.test.ts :: the detector would notice a wired module",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/privacy/automated-decisions.test.ts",
    derives: "Every module that could be taking a decision about a patient, by three scans.",
    checkedAgainst: "W201's `AUTOMATED_DECISIONS` and `NOT_A_DECISION`, both directions.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/privacy/automated-decisions.test.ts :: states its own bound honestly, with every declared scan load-bearing",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/privacy/capacity-privacy.test.ts",
    derives: "Every capacity module, to check each is classified.",
    checkedAgainst: "W106's record classes.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/privacy/capacity-privacy.test.ts :: exports no scrub, because a scrub would mean this claim is false",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/privacy/outcomes-privacy.test.ts",
    derives: "Every Q14 outcome module, to check each is classified.",
    checkedAgainst: "W106's record classes, with erasure composed rather than remembered.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/privacy/record-classes.test.ts",
    derives: "Every store in the tree, so a NEW class fails the suite until it is handled.",
    checkedAgainst: "W106's `RECORD_CLASSES`.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/quality/audit-y5.test.ts",
    derives: "Seven sweeps over `src/` and `app/` — registries, date literals, focused tests and more.",
    checkedAgainst: "W256's audit findings, re-run from source rather than carried.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/quality/dossier-q18.test.ts",
    derives: "Capacity source, to check the Q18 dossier's arithmetic against the tree.",
    checkedAgainst: "W232's dossier, pinned row by row.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/quality/latent-findings.ts",
    derives: "Every module with no `// W<n>` header — one recorded finding's live condition.",
    checkedAgainst: "W210's `HEADERLESS_AT_W210`, so the count becoming worse fires the finding.",
    proof: {
      kind: "walk_unproven",
      contentProof: null,
      remedy:
        "`modulesWithNoUnitHeader()` is already exported and already a module rather than a test — it takes no root. Give it one, and this becomes provable without moving anything.",
    },
  },
  {
    file: "src/referrals/scoping.test.ts",
    derives: "The W103 scoping sweep across referral source.",
    checkedAgainst: "W140's triage, every hit written down.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
  },
  {
    file: "src/reporting/retention.test.ts",
    derives: "Reporting source, to prove a produced report is never persisted.",
    checkedAgainst: "W204's record class for the report, with a stated life.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/reporting/retention.test.ts :: enumerates the artefacts a reader would expect it to keep",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/verticals/assembly.test.ts",
    derives: "Every module under `src/verticals/` that is not declared machinery.",
    checkedAgainst: "W250's census — no vertical may re-implement the shared assembly.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/verticals/assembly.test.ts :: finds all three declarations, and no machinery among them",
      remedy: EXPORT_THE_WALK,
    },
  },
];

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
      if (stripComments(readFileSync(full, "utf8")).includes("readdirSync(")) {
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

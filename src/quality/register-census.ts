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
    file: "src/compliance/copy-y6.ts",
    derives: "Every module under `src/` with the unit its own header claims, and which of them the copy surface must cover.",
    checkedAgainst: "W200's `OPERATOR_COPY_SURFACES`, both directions — the membership rule this module now owns.",
    proof: {
      kind: "mutated_tree",
      mutation:
        "a module with a Y6 header is added under `src/` and `copySurfaceMembers` must report it as a member the register has to cover",
    },
  },
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
    file: "src/quality/route-coverage.ts",
    derives: "Every spec file under `e2e/`, and which of the app's routes each one's text opens.",
    checkedAgainst:
      "W284's route-coverage register, resolved rather than trusted — every citation is checked against the spec it names.",
    proof: {
      kind: "mutated_tree",
      mutation: "a citation is moved to a spec that does not open its route, and `coverageDiff` must report it unresolved",
    },
  },
  {
    file: "src/quality/tautology-sweep.ts",
    derives:
      "Every assertion in every `*.test.ts` under `src/`, classified against three shapes whose expected value follows from the assertion's own text.",
    checkedAgainst:
      "`ACCEPTED_TAUTOLOGIES`, in both directions: a hit with no acceptance fails, and an acceptance whose condition has stopped holding — or whose hit is gone — fails too.",
    proof: {
      kind: "mutated_tree",
      mutation:
        "three files are planted in a constructed root — a test with a tautology, a test with the real assertion it most resembles, and a non-test file carrying the same tautology — and only the first may be reported",
    },
  },
  {
    file: "src/quality/refusal-branches.ts",
    derives:
      "Every exported violation reporter under `src/` — named `*Violations` or `*Diff` and returning something other than prose — so a reporter cannot arrive without its refusal arms being driven.",
    checkedAgainst:
      "W291's `REFUSAL_BRANCHES`, both directions: a reporter with no branch declared and a branch for a reporter that is gone both fail.",
    proof: {
      kind: "mutated_tree",
      mutation:
        "a reporter and a renderer are planted together in a constructed root, and `violationReporters` must report the reporter and refuse the renderer — the negative planted alongside the positive, because a walk that matched everything would pass the positive on its own",
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
  // `src/compliance/cdss-boundary.test.ts` WAS HERE, and its removal is the census working in the
  // direction that usually goes unnoticed. W267 recorded its walk as `walk_unproven` with the
  // remedy "export the walk from a module with a `root` parameter"; W270 needed exactly that to
  // give the floor a door, so the walk moved into `copy-y6.ts` and the entry went stale. A
  // register describing code that has moved reads as coverage, so the stale half fired and this
  // comment is what the next reader finds instead of a silent deletion.
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
    proof: {
      kind: "mutated_tree",
      mutation: "a migration is added under `supabase/migrations` and `migrationSql` must contain its text",
    },
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
    proof: {
      kind: "mutated_tree",
      mutation: "a file with an extension the hygiene rules cover is added and `textFiles` must return it",
    },
  },
  {
    file: "src/lib/stores.test.ts",
    derives: "Every store module in the tree.",
    checkedAgainst: "W51's store registry, which had already drifted four stores when it was written.",
    proof: {
      kind: "mutated_tree",
      mutation: "a module exporting a new `reset*` function is added and `exportedResetters` must return its name",
    },
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
    file: "src/privacy/erasure-y5.test.ts",
    derives: "Every exported `reset*` function in the tree, to prove the erasure sweep reads W51's registry rather than a second list.",
    checkedAgainst: "W51's `STORE_RESETTERS`, so the sweep and the demo launcher cannot drift apart.",
    proof: {
      kind: "walk_unproven",
      contentProof: "src/privacy/erasure-y5.test.ts :: finds the patient in every store the scrub must clear, BEFORE erasing",
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
    proof: {
      kind: "mutated_tree",
      mutation: "a module holding a `globalThis`-backed store is added and `storeModules` must return it",
    },
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
    file: "src/security/page-reach.ts",
    derives: "What each route under `app/` can reach, per route, from its own file and its layout chain.",
    checkedAgainst:
      "W271's route classes — a closed area allowance and a positive requirement per class — and its dormant-module register.",
    proof: {
      kind: "mutated_tree",
      mutation: "a route is planted under `app/` that imports a declared-dormant module, and `diffReach` must report it both unclassified and waking the module",
    },
  },
  {
    file: "src/quality/g5-rehearsal.test.ts",
    derives: "Every non-test module under `src/` and `app/`, looking for an import of the G5 rehearsal.",
    checkedAgainst:
      "W264's rule that nothing the product ships imports it — the one route by which synthetic pathway content could reach a page.",
    proof: {
      kind: "walk_unproven",
      contentProof:
        "src/quality/g5-rehearsal.test.ts :: proves the linter would object to content that DID read clinically",
      remedy: EXPORT_THE_WALK,
    },
  },
  {
    file: "src/quality/latent-y5.ts",
    derives: "Gate-dossier test files under `src/quality/`, to check that DOSSIER-1's scan still has a subject to scan.",
    checkedAgainst: "W268's `FINDING_ANCHORS` — the claim that must hold for each open finding's predicate to be able to fire.",
    proof: {
      kind: "mutated_tree",
      mutation: "a `gate-dossier-*.test.ts` file is added and `dossierTestFiles` must return it, so DOSSIER-1's anchor can be shown its subject arriving",
    },
  },
  {
    file: "src/quality/register-census.test.ts",
    derives: "Nothing of its own — it imports the shared rooted walks to PLANT files in front of them, which is how W282's batch is proved.",
    checkedAgainst: "Each walk's own probe. It is a member because the widened detector counts deriving through `tree-walks`, and exempting the file that does the proving would be the register answering its own question.",
    proof: {
      kind: "mutated_tree",
      mutation: "it is the file that does the planting; every probe in it is a mutation of a copied tree",
    },
  },
  {
    file: "src/quality/page-suite.test.ts",
    derives: "The same spec walk, pointed at a tree with no `e2e/` directory — which is how the walk is proved rather than trusted.",
    checkedAgainst: "Nothing of its own. It is a member because W282's widened detector counts deriving through `tree-walks`, and exempting the file that does the proving would be the register answering its own question.",
    proof: {
      kind: "mutated_tree",
      mutation: "it IS the proof: `pageSpecFiles` must return every spec for this root and none for a root with no `e2e/`",
    },
  },
  {
    file: "src/quality/page-suite.ts",
    derives: "Every `*.spec.ts` under `e2e/`, to ask which of them the verify gate runs.",
    checkedAgainst: "`EXCLUDED_SPECS` — empty today — plus the verify script, the e2e script and the Playwright config, each of which can drop a spec without touching the others.",
    proof: {
      kind: "mutated_tree",
      mutation: "`pageSpecFiles` is pointed at a tree with no `e2e/` directory and must report no specs, and at this tree and must report all of them",
    },
  },
  {
    file: "src/quality/unit-headers.ts",
    derives: "Every module under `src/`, to read the unit its header claims — missing, misplaced, or naming a unit the ledger does not have.",
    checkedAgainst: "The ledger's own unit ids, and the door: all three lists must be empty. It replaced W210's `HEADERLESS_AT_W210` count at W281.",
    proof: {
      kind: "mutated_tree",
      mutation: "three files are planted in a copied tree — one with no header, one recording its unit at the end of the line, one naming W999 — and each must land in its own list while the other two stay empty",
    },
  },
  {
    file: "src/quality/tree-walks.ts",
    derives: "Seven tree-derivations, each taking a root: text files, exported resetters, store modules, migrations, vertical declarations, gate-dossier tests, and modules with no unit header.",
    checkedAgainst: "Nothing of its own — it IS the walking, and each caller checks its own register against what it returns.",
    proof: {
      kind: "mutated_tree",
      mutation: "every walk it exports is planted against in a copied tree, which is what moving them here was for",
    },
  },
  {
    file: "src/quality/latent-findings.ts",
    derives: "Every module with no `// W<n>` header — one recorded finding's live condition.",
    checkedAgainst: "W281's door in `unit-headers.ts` — the list must be EMPTY. It was `> HEADERLESS_AT_W210` until W281 retired that pin; a count tolerated eleven forever and could not notice one leaving as another arrived.",
    proof: {
      kind: "mutated_tree",
      mutation: "a module with no `// W<n>` header is added and `modulesWithNoUnitHeader` must return it",
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
    file: "src/tenancy/two-tenant.test.ts",
    derives: "Every test file in the tree, to ask which of them drives a practice-scoped read across two practices.",
    checkedAgainst: "W209's `practice_scoped` reads — every one must have a test that constructs at least two tenants.",
    proof: {
      kind: "mutated_tree",
      mutation: "the detector is pointed at a one-practice fixture and must report it single-tenant, which is the gate's own words",
    },
  },
  {
    file: "src/verticals/assembly.test.ts",
    derives: "Every module under `src/verticals/` that is not declared machinery.",
    checkedAgainst: "W250's census — no vertical may re-implement the shared assembly.",
    proof: {
      kind: "mutated_tree",
      mutation: "a module is added under `src/verticals/` and `verticalModules` must report it as a declaration",
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

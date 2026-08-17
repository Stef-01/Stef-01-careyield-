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

/** The one-line change that makes a welded walk provable. Same sentence for the same defect. */
const EXPORT_THE_WALK =
  "Export the walk from a module with a `root` parameter, the way `discoverFoldSites(root)` and `reachableFromApp(root)` already do, so it can be pointed at a tree that differs from this one.";

/**
 * W289: the one-line change that makes a welded ASSERTION provable. Same sentence for the same
 * defect, the way `EXPORT_THE_WALK` is one sentence for the walk half.
 */
const PARAMETERISE_THE_COMPARISON =
  "Move the comparison out of the test file and export it as a function taking the declared list as an argument — the way `censusDiff(found, declared)`, `diffFoldRegister(actual, declared)` and `pinDiff(root, declared)` already do — so it can be handed a declared list it must reject. A comparison written inside a `.test.ts` exports nothing, so there is no second declared list to give it.";

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
    assertion: {
      kind: "driven_here",
      claim:
        "Every module the membership rule makes a member is covered by W200's declared copy surface — per year band, so a band that stops being covered is visible rather than averaged away.",
      mutation:
        "`coverageByBand` is given an EMPTY declared list, and a band with modules in it must come back covered:0 rather than reporting full coverage of nothing.",
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
    assertion: {
      kind: "driven_here",
      claim:
        "Every route the App Router serves appears in W102's census, and every census row names a route that is served.",
      mutation:
        "`diffCensus` is given the tree's real surfaces and a census with one row removed, and must report that route unmapped.",
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
    assertion: {
      kind: "driven_here",
      claim:
        "Every module containing a fold is declared in W167's `FOLD_SITES` with a tie-break test or a rationale, and no declared module has stopped folding.",
      mutation:
        "`diffFoldRegister` is given the tree's real fold sites and a declared list with one module removed, and must report it undeclared.",
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
    assertion: {
      kind: "driven_here",
      claim:
        "No file names a model endpoint without a ruling in W153's `DECLARED_INSTRUCTION_SINKS`.",
      mutation:
        "`undeclaredInstructionSinks` is given a fabricated hit in a file nobody has declared, and must return it.",
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Nothing reachable from a request-serving path is outside W107's package allowance, and a decision declared dormant is reachable from nothing.",
      mutation:
        "An allowance with a package removed, over the tree's real reach, must report that package unallowed.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "driven_by_branch",
      claim:
        "Every route this app serves is opened by a named spec, and every citation resolves to a spec that opens it.",
      mutation:
        "A declared list naming a route the app does not serve must come back stale.",
      branch: "src/quality/route-coverage.ts::coverageDiff::stale",
    },
  },
  {
    file: "src/quality/blind-spots.ts",
    derives:
      "Nothing of the tree's own — it plants WITNESSES in front of eleven other registers' detectors and reads what each reports, which is how a stated bound is shown to be true rather than plausible.",
    checkedAgainst:
      "W267's census, both directions: a register with no stated bound fails, and a bound for a register the census no longer has fails.",
    proof: {
      kind: "mutated_tree",
      mutation:
        "it IS the planting: each of its eleven probes builds a tree containing a witness and a positive control, and the register it points at must report the second and not the first",
    },
    assertion: {
      kind: "driven_here",
      claim:
        "Every register in the census states what it cannot see, and every stated bound that can be planted is true — the register stays silent about its witness while reporting the control beside it.",
      mutation:
        "`boundDiff` is given a census entry the register does not cover and must report it unstated; `falseBounds` is given a bound whose witness IS reported and must report the bound false.",
    },
  },
  {
    file: "src/quality/acceptances.ts",
    derives:
      "Every module under `src/` that HOLDS acceptances — one that assigns a `reviewBy` date or exports an `ACCEPTED_*` list — which is the union of two shapes because either alone misses a real register.",
    checkedAgainst:
      "W294's `ACCEPTANCE_REGISTERS`, both directions: a module holding acceptances that no entry names fails, and a declared register that has stopped holding any fails.",
    proof: {
      kind: "mutated_tree",
      mutation:
        "a module assigning a review date and one merely naming the field in a type are planted together in a constructed root, and only the first may be reported",
    },
    assertion: {
      kind: "driven_here",
      claim:
        "Every acceptance in the tree carries a review date that is still in the future, and every acceptance whose sweep can be re-run still has a finding behind it.",
      mutation:
        "`expiredAcceptances` is given a date beyond every review date and must report all of them; `staleAcceptances` is given a register whose sweep reports nothing and must report its acceptance stale.",
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
    assertion: {
      kind: "driven_here",
      claim:
        "Every tautological assertion in the tree is accepted with a condition that still holds.",
      mutation:
        "A test file carrying a tautology is planted in a constructed root, and `unacceptedTautologies` must report it.",
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
    assertion: {
      kind: "driven_here",
      claim:
        "Every refusal arm of every violation reporter is driven with an input that makes it fire.",
      mutation:
        "`driveBranches` is given a branch whose drive returns false, and must report it as one that did not fire.",
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
    assertion: {
      kind: "driven_by_branch",
      claim:
        "Every file that walks the tree is declared here, and every declared file still walks.",
      mutation:
        "A found file that no entry names must come back undeclared.",
      branch: "src/quality/register-census.ts::censusDiff::undeclared",
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every API endpoint goes through W253's single scoped dispatcher, so an unscoped one has nowhere to be written.",
      mutation:
        "The declared dispatcher list with one endpoint removed, over the tree's real endpoints, must report it undispatched.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every string a practice reads on a capacity surface is inside W226's declared copy surface.",
      mutation:
        "The declared surface with one module removed must report that module's copy unlinted.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/capacity/coupling.test.ts",
    derives: "Source across the tree, to prove no caller enables the coupling.",
    checkedAgainst: "W231's `ENABLED_COUPLINGS`, pinned empty.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "W231's `ENABLED_COUPLINGS` is empty, so no capacity signal feeds a patient-facing decision.",
      mutation:
        "A declared list with one coupling in it must fail the emptiness claim.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "No route serves an evidence document without a grant, and nothing behind G6 is reachable.",
      mutation:
        "A fabricated route reading evidence without a grant must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/directory/dossier-claims.test.ts",
    derives: "Directory source, to check the Q15 dossier's factual claims against it.",
    checkedAgainst: "W195's dossier claims, pinned row by row.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every claim W195's dossier makes about the directory is true of the tree, row by row.",
      mutation:
        "A dossier row naming a control the tree does not have must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/domain/schema-consistency.test.ts",
    derives: "Every SQL migration, to check the domain types against the schema.",
    checkedAgainst: "`src/domain/types.ts`.",
    proof: {
      kind: "mutated_tree",
      mutation: "a migration is added under `supabase/migrations` and `migrationSql` must contain its text",
    },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every field the domain types declare exists in the schema, and nothing in the schema is undeclared.",
      mutation:
        "A declared type list with one field removed must report it undeclared.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every module holding education copy is in W150's `EDUCATION_COPY_MODULES` and is linted.",
      mutation:
        "The declared module list with one module removed must report it unlinted.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "W242's `SHIPPED_CREDENTIALS` is empty, so nothing behind G1 has been shipped.",
      mutation:
        "A declared list with one credential in it must fail the emptiness claim.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every file tooling has to read as text obeys W116's hygiene rules.",
      mutation:
        "A file breaking one hygiene rule — a tab, a CRLF line ending, a missing trailing newline — is planted, and the rule it breaks must report it while the others stay quiet.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every store in the tree is in W51's registry, which had already drifted four stores when it was written.",
      mutation:
        "The registry with one store removed, over the tree's real stores, must report it undeclared.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "The send path is unwired: no module calls a live SMS transport (W182, G3).",
      mutation:
        "A fabricated module calling a transport must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every automated decision is in W201's `AUTOMATED_DECISIONS` or argued into `NOT_A_DECISION`, both directions.",
      mutation:
        "A declared register with one decision removed must report it undeclared.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every store resetter W51 knows about is reached by the erasure sweep and by the demo launcher.",
      mutation:
        "A resetter list with one entry removed must report the sweep and the launcher out of step.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every capacity record is classified in W106's record classes.",
      mutation:
        "A class list with one record removed must report it unclassified.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/privacy/outcomes-privacy.test.ts",
    derives: "Every Q14 outcome module, to check each is classified.",
    checkedAgainst: "W106's record classes, with erasure composed rather than remembered.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every outcomes record is classified in W106's record classes, with erasure composed rather than remembered.",
      mutation:
        "A class list with one record removed must report it unclassified.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/privacy/record-classes.test.ts",
    derives: "Every store in the tree, so a NEW class fails the suite until it is handled.",
    checkedAgainst: "W106's `RECORD_CLASSES`.",
    proof: {
      kind: "mutated_tree",
      mutation: "a module holding a `globalThis`-backed store is added and `storeModules` must return it",
    },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every record the product holds is in W106's `RECORD_CLASSES`.",
      mutation:
        "A class list with one record removed must report it undeclared.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/quality/audit-y5.test.ts",
    derives: "Seven sweeps over `src/` and `app/` — registries, date literals, focused tests and more.",
    checkedAgainst: "W256's audit findings, re-run from source rather than carried.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every Year 5 audit finding is re-run from source rather than carried from the previous audit.",
      mutation:
        "A sweep whose finding has returned must report it, over a tree carrying the defect again.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
  },
  {
    file: "src/quality/dossier-q18.test.ts",
    derives: "Capacity source, to check the Q18 dossier's arithmetic against the tree.",
    checkedAgainst: "W232's dossier, pinned row by row.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every claim W232's dossier makes is true of the tree, row by row.",
      mutation:
        "A dossier row naming a control the tree does not have must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every route is in exactly one of W271's classes, reaches everything its class requires and nothing outside its allowance, and no route reaches a dormant module.",
      mutation:
        "A class list with one route removed must report that route unclassified, over the tree's real reach.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Nothing the product ships imports the G5 rehearsal, which is the one route by which synthetic pathway content could reach a page.",
      mutation:
        "A fabricated shipped module importing it must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "driven_here",
      claim:
        "Every open latent finding has an anchor, and every anchor's claim about the tree still holds — a dead anchor is a green suite reporting a check that no longer runs.",
      mutation:
        "`deadAnchors` is given an anchor whose `holds()` returns false, and must return it; `anchorCoverage` is given an open finding with no anchor, and must report it unanchored.",
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
    assertion: {
      kind: "carries_no_assertion",
      claim:
        "None of its own. It is the file that plants probes in front of the other walks.",
      why:
        "Its assertions are the other registers' walk proofs, so an assertion of its own would be this file checking itself. It is in the census because the widened detector counts deriving through `tree-walks`, and exempting the prover would be the register answering its own question.",
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
    assertion: {
      kind: "carries_no_assertion",
      claim:
        "None of its own. It proves `pageSpecFiles` by pointing it at a tree with no `e2e/`.",
      why:
        "Same shape as `register-census.test.ts`: a prover rather than a register. What it asserts belongs to `page-suite.ts`, which carries its own entry.",
    },
  },
  {
    file: "src/quality/pins.ts",
    derives: "Every pin-named exported constant under `src/`, tests included — `*_AT_W<n>`, `*_LAST_UNIT`, `*_FIRST_UNIT`, `*_SURFACE_FLOOR`.",
    checkedAgainst: "`PINS`, which classifies each by what event moves it; both directions, plus the argument a `live_by_design` pin owes for interrupting somebody.",
    proof: {
      kind: "mutated_tree",
      mutation: "a pin-named constant is planted in a copied tree — in a source file and again in a test file — and must be reported undeclared, while a plain SCREAMING_CASE constant planted beside it must not",
    },
    assertion: {
      kind: "driven_here",
      claim:
        "Every `*_AT_W<n>` and `*_LAST_UNIT` pin in the tree is declared in `PINS` and classified by what event moves it, and a `live_by_design` pin owes an argument for interrupting somebody.",
      mutation:
        "`pinDiff` is given an EMPTY declared list and must report the tree's real pins undeclared.",
    },
  },
  {
    file: "src/quality/empty-list-sweep.ts",
    derives:
      "Every `toEqual([])` and `toHaveLength(0)` in every `*.test.ts` under `src/`, with the `(producer, field)` pair each was read from and whether anything anywhere shows that pair holding something.",
    checkedAgainst:
      "`UNEVIDENCED_AT_W293` — the assertions nothing shows able to fill, by name — plus `GATE_PINNED_EMPTY`, the one class accepted with an argument rather than evidence.",
    proof: {
      kind: "mutated_tree",
      mutation:
        "two constructed test files differing in one line are swept — in the first the filtered list is literally `[]`, in the second the same filter runs over a collection the file first shows holding something — and only the first may be reported",
    },
    assertion: {
      kind: "driven_by_branch",
      claim:
        "Every empty-list assertion in the suite has evidence its source can fill, is a register a founder gate pins empty, or is named in the debt list — and the debt list can only shrink deliberately.",
      mutation:
        "The pin is emptied and all 131 unevidenced assertions must come back as new.",
      branch: "src/quality/empty-list-sweep.ts::emptyListDiff::newlyUnevidenced",
    },
  },
  {
    file: "src/quality/negative-probes.test.ts",
    derives: "Nothing of its own — it imports the shared rooted walks in order to plant a NEGATIVE beside each positive, which is what W292's discriminating pairs are made of.",
    checkedAgainst: "Each detector's own pair. It is a member because deriving through `tree-walks` counts, and exempting the file that does the proving would be the register answering its own question — `register-census.test.ts`'s precedent, one unit over.",
    proof: {
      kind: "mutated_tree",
      mutation: "it is the file that does the planting; every pair in it plants two files into a copied tree and asks the detector one question about both",
    },
    assertion: {
      kind: "driven_by_branch",
      claim:
        "Every walk W267 records as proved by mutation also has a NEGATIVE — a file it must refuse — and the exemption for a file with no detector of its own is supported by the census's own words rather than by declaring it.",
      mutation:
        "The probe register is emptied and every proved walk must come back unprobed.",
      branch: "src/quality/negative-probes.ts::negativeDiff::unprobed",
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
    assertion: {
      kind: "driven_by_branch",
      claim:
        "The verify gate runs the whole page suite: the verify script chains it, the e2e script runs specs, and no filter narrows it.",
      mutation:
        "A package.json whose verify script does not chain the suite must be reported.",
      branch: "src/quality/page-suite.ts::pageSuiteViolations::verify_does_not_chain_e2e",
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
    assertion: {
      kind: "driven_by_branch",
      claim:
        "Every module under `src/` records the unit that wrote it, in the header position, naming a unit the ledger has.",
      mutation:
        "A module with no `// W<n>` header must be reported missing.",
      branch: "src/quality/unit-headers.ts::headerViolations::missing",
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
    assertion: {
      kind: "carries_no_assertion",
      claim:
        "None of its own — it IS the walking, and each caller checks its own register against what it returns.",
      why:
        "A comparison here would have nothing to compare: the module holds no declared list. Its callers' entries carry the assertions, which is why W282 moved the walks rather than the registers.",
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
    assertion: {
      kind: "driven_here",
      claim:
        "No latent finding has fired: every open finding's trigger returns false, and W281's door list is empty rather than under a tolerated count.",
      mutation:
        "`fired` is given a finding whose trigger returns true, and must return it.",
    },
  },
  {
    file: "src/referrals/scoping.test.ts",
    derives: "The W103 scoping sweep across referral source.",
    checkedAgainst: "W140's triage, every hit written down.",
    proof: { kind: "walk_unproven", contentProof: null, remedy: EXPORT_THE_WALK },
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every referral read is scoped to its practice, with W140's triage written down for each hit.",
      mutation:
        "A triage list with one hit removed must report it untriaged.",
      remedy: PARAMETERISE_THE_COMPARISON,
    },
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "The weekly report has a record class in W204 with a stated life.",
      mutation:
        "A class list without the report must report it unclassified.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "Every `practice_scoped` read in W209's register has a test that constructs at least two tenants.",
      mutation:
        "A register entry whose test constructs one tenant must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
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
    assertion: {
      kind: "assertion_unproven",
      claim:
        "No vertical re-implements the shared assembly (W250's census).",
      mutation:
        "A vertical module carrying its own assembly must be reported.",
      remedy: PARAMETERISE_THE_COMPARISON,
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

// W305: one declaration point per module, and the registers derived from it.
//
// W300 MEASURED THE TAX and found it was six: a module shaped like one of this tree's registers had
// to be declared in six other registers before the build would go green, and the modules paying
// most were the registers themselves. That is why the figure grew in the quarter that added twelve
// of them. Q24's premise rests on it, so this is the remedy the measurement was taken for.
//
// THE FRAGMENTS FOR ONE MODULE WERE SCATTERED AND NEVER READ TOGETHER. A module's census entry said
// what it derives; its refusal branches sat in another file entirely; a blind spot in a third held
// the bound it cannot see past. Nothing checked that they described the same thing, and nothing
// could: they were separate lists that happened to share a key. The census entry for
// `register-counts.ts` and its branches were adjacent only in the sense that both existed.
//
// SO THE ROW IS THE DECLARATION AND THE REGISTERS ARE DERIVATIONS. `TREE_DERIVED_REGISTERS` and
// `REFUSAL_BRANCHES` are `deriveCensus()` and `deriveBranches()` over the rows below — the same
// values in the same shapes, with the same both-directions diffs still firing against the tree.
// What changed is that a module is declared ONCE, where a reviewer can see whether its halves agree.
//
// THE BLIND SPOTS WERE FOLDED IN AND THE FOLD WAS REVERTED, which is this unit's finding rather
// than a step it skipped. A blind spot is not data: each is a `probe` that builds a tree and runs
// another register's detector, so moving them here MOVED A WALK. `treeWalkingFiles` stopped seeing
// `blind-spots.ts` on the first run afterwards — correctly, it had stopped reading the tree — its
// census entry went stale, and its negative probe and its assertion drive went with it. Folding a
// register in cost that register four rows of coverage and left this file owning three registers'
// worth of self-description. The gate named four derivations; three are here, the fourth is
// declared not-done with its reason, and `manifest.test.ts` drives the pairing that holds instead.
//
// WHAT IS NOT DERIVED FROM THIS, AND WHY. `STATED_BOUNDS` and `PINS` are keyed by module too, and
// folding them in would have been mechanical. They stay because they are not per-MODULE facts: a
// module states several bounds and pins several constants, each with its own unit and its own
// lifting, and `bounds.ts` orders them by the claim rather than by the file. Both are checked
// against this manifest instead — a module declared here and pinning nothing is fine, but a bound
// or a pin in a module this manifest has not heard of is a module that slipped in unwatched.
//
// AND THE TAX WENT UP, WHICH IS THE HONEST NUMBER. `MOVED_SINCE_W300` records it: a full register
// cost six declarations and now costs seven, because this file replaced three sites with one and
// then added itself as a site. What went down is the number of files and schemas an author has to
// find, which W300's measurement does not capture and this must not be read as claiming. W308
// re-derives both, against a baseline deliberately left frozen.
//
// WHAT THIS DOES NOT PROVE is `MANIFEST_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Declarations about this tree's own modules.

import type { TreeDerivedRegister } from "./register-census";
import type { RefusalBranch } from "./refusal-branches";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { discoverSurfaces } from "@/compliance/surfaces";
import { copySurfaceMembers } from "@/compliance/copy-y6";
import { findInstructionSinks } from "@/security/instruction-sinks";
import { stripComments } from "@/security/reachability";
import { coherenceViolations } from "@/tenancy/fixture-coherence";
import { censusDiff, treeWalkingFiles } from "./register-census";
import { boundsInTree } from "./bounds";
import { DECLARATION_HOMES, TAX_AT_W300, homeDiff, taxDiff } from "./declaration-tax";
import { ENDING_REGISTERS, endingDiff } from "./self-ending";
import { BLIND_SPOTS, boundDiff } from "./blind-spots";
import { discoverFoldSites } from "./order-independence";
import { headerViolations } from "./unit-headers";
import { pageSuiteViolations } from "./page-suite";
import { blockedSurfaceViolations } from "./blocked-surface";
import { duplicateDiff, pinDiff, pinsInTree } from "./pins";
import { sweepTautologies } from "./tautology-sweep";
import { acceptanceCarryingModules } from "./acceptances";
import { violationReporters } from "./refusal-branches";
import { mutantsIn } from "./mutation-sampling";
import { CITATION_BOUND, separatorDiff } from "./citations";
import { PLANTING_BOUND, copyTree, planterDiff, withTree } from "./planting";
import { COUNT_BOUND, countDiff, registerSizeAssertions } from "./register-counts";
import { SCAN_SITES, blankLiterals, fixtureDiff, fixtureText, scanSiteDiff } from "./scan-text";
import { fallibleDiff } from "./review-w279";
import { founderDiff } from "@/founder/outstanding";
import { equalityDiff } from "./self-defeating";
import { SELF_SCANNING, SPLIT_EXCEPTIONS, holderDiff, splitDiff, splitSites } from "./self-reference";
import { coverageDiff } from "./route-coverage";
import { negativeDiff } from "./negative-probes";
import { UNEVIDENCED_AT_W293, emptyListDiff } from "./empty-list-sweep";
import { readerDiff } from "./close-gate";
import { instantDiff } from "./instant";
import { dispositionDefects } from "./deferrals";
import { OUTSTANDING_HEADING, dossierDiff } from "./dossier-derived";

/**
 * Everything one module owes the registers that watch it.
 *
 * A NULL IS A CLAIM, not an omission: `census: null` says this module walks nothing, and the
 * census's own tree-derivation will contradict it if that is false. The same for `blindSpot`.
 */
export interface ModuleEntry {
  module: string;
  /** Its census entry, minus the file — W267's row. */
  census: Omit<TreeDerivedRegister, "file"> | null;
  /** Its refusal branches, minus the module — W291's rows. A module may report several. */
  branches: readonly Omit<RefusalBranch, "module">[];
}

/**
 * The one-line change that makes a welded walk provable. Same sentence for the same defect.
 *
 * Moved here with the entries that use it: W267 wrote it, W295 wrote its own beside it, and both
 * are properties of a ROW rather than of the register that used to hold the rows.
 */
const EXPORT_THE_WALK =
  "Export the walk from a module with a `root` parameter, the way `discoverFoldSites(root)` and `reachableFromApp(root)` already do, so it can be pointed at a tree that differs from this one.";

/**
 * W289: the one-line change that makes a welded ASSERTION provable. Same sentence for the same
 * defect, the way `EXPORT_THE_WALK` is one sentence for the walk half.
 */
const PARAMETERISE_THE_COMPARISON =
  "Move the comparison out of the test file and export it as a function taking the declared list as an argument — the way `censusDiff(found, declared)`, `diffFoldRegister(actual, declared)` and `pinDiff(root, declared)` already do — so it can be handed a declared list it must reject. A comparison written inside a `.test.ts` exports nothing, so there is no second declared list to give it.";

/** Same sentence for the same defect — W267's posture for its unproven walks. */
const NOT_CALLABLE =
  "The detector and its comparison both live inside this register's own `.test.ts`, which exports nothing, so there is no way to hand it a witness from here. W289's remedy applies unchanged: export the scan from a module taking a root, and the bound below becomes a two-line plant.";

/**
 * A synthetic ledger row, for the probes that plant one.
 *
 * ONE OF THE MERGE'S FINDINGS. W295 held this as a string and W291 held it as a function of the
 * unit number, four hundred lines apart in different files, producing the same text — invisible
 * while the two lived apart, obvious the moment their rows became adjacent.
 */
/** A dossier holding exactly the rows given, for W335's arms. */
const PLANTED_DOSSIER = (rows: string) =>
  `${OUTSTANDING_HEADING}\n\n| Decision | Units blocked | Which | Open since |\n| --- | --- | --- | --- |\n${rows}\n\ntrailing prose\n`;

const LEDGER_ROW = (n: number) => `| W${n} | done | builder-A | 2026-08-14T00:00Z | abc1234 | a row |`;

/** What a green manifest does not prove. */
export const MANIFEST_BOUND =
  "A row here is a declaration, not a proof that the declaration is true. That a module says " +
  "`census: null` is checked by W267's own tree-derivation and that its blind spot is honest is " +
  "checked by W295's witness — this file makes both readable in the same place and neither of " +
  "them true. Nor does it flatten the tax to a lone edit: `STATED_BOUNDS` and `PINS` keep their " +
  "own lists because neither is a per-module fact, so a module stating a bound is still declared " +
  "in more places than this. What `manifestDiff` catches is the worse case — a module watched by " +
  "some register that this manifest has never heard of. It does not reach TEST FILES: several pin " +
  "a constant and W290 watches them, but none can hold a census entry, a blind spot or a refusal " +
  "branch, so a row here could never say anything. W308 has since re-measured the tax and " +
  "recorded that this manifest raised it, which settles the tax question and leaves this bound " +
  "saying what it always said.";
  "branch, so a row here would be one that could never say anything. W308 re-measures the tax.";
  "here would be one that could never say anything. And W308 re-measures whether the tax moved.";

/** Everything the four registers below are derived from: one row per module, and nothing twice. */
/**
 * A tree of its own for the drivers that PLANT, made once and shared.
 *
 * `homeDiff` plants a probe module into whatever tree it is handed, so handing it `process.cwd()`
 * wrote into the repository while other test workers were walking it — the `ENOENT` on a path the
 * failing suite had never heard of, seen twice before it was pinned. `withPlantedIn` now refuses a
 * root inside the repository outright, so these drivers need somewhere else to write. Lazy because
 * most runs drive no branch at all, and shared because a copy costs about a second.
 */
let plantableTreeCache: string | null = null;
function plantableTree(): string {
  plantableTreeCache ??= copyTree(process.cwd());
  return plantableTreeCache;
}

export const MANIFEST: readonly ModuleEntry[] = [
  {
    module: "src/compliance/copy-y6.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/compliance/surfaces.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/order-independence.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/security/instruction-sinks.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/security/reachability.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/route-coverage.ts",
    census: {
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
    branches: [
      {
        fn: "coverageDiff",
        branch: "undeclared",
        reach: {
          kind: "driven",
          drive: () => coverageDiff(process.cwd(), []).undeclared.length > 0,
        },
      },
      {
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
    ],
  },
  {
    module: "src/quality/self-reference.ts",
    census: {
      derives:
        "Every first-party module that still assembles a literal from fragments, and every module that loads a fixture from the file no walk reads.",
      checkedAgainst:
        "W307's `SPLIT_EXCEPTIONS` and `SELF_SCANNING.holders`, both directions: a split nobody argued fails, an argued split the sweep no longer finds fails, a declared holder that stopped loading a fixture fails, and a module loading one that no probe covers fails.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "the sweep is pointed at a constructed root holding a planted split and a module that merely joins an array of values, and only the first may be reported",
      },
      assertion: {
        kind: "driven_by_branch",
        claim:
          "Every detector whose fixture left the surface it reads reports a planted instance and does not report its own fixture, and the idiom that used to do this job is gone except where it is argued.",
        mutation:
          "An empty exception register must make every real split unargued.",
        branch: "src/quality/self-reference.ts::splitDiff::unargued",
      },
    },
    branches: [
      {
        fn: "splitDiff",
        branch: "unargued",
        reach: {
          kind: "driven",
          // The argued register is a parameter, so an empty one makes every real split unargued.
          drive: () => splitDiff(process.cwd(), []).unargued.length > 0,
        },
      },
      {
        fn: "splitDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            splitDiff(process.cwd(), [...SPLIT_EXCEPTIONS, { module: "src/gone.ts", why: "x" }]).stale.length > 0,
        },
      },
      {
        fn: "holderDiff",
        branch: "notLoading",
        reach: {
          kind: "driven",
          drive: () =>
            holderDiff(process.cwd(), [
              { ...SELF_SCANNING[0]!, holders: ["src/gone.ts"] },
            ]).notLoading.length > 0,
        },
      },
      {
        fn: "holderDiff",
        branch: "uncovered",
        reach: {
          kind: "driven",
          // No scan declared means every module that loads a fixture is uncovered.
          drive: () => holderDiff(process.cwd(), []).uncovered.length > 0,
        },
      },
    ],
  },
  {
    module: "src/demo/path.ts",
    // W309's path register reads NAMED page files and one already-proved walk rather than walking
    // the tree itself, so it carries no census row: `treeWalkingFiles` does not see it and a row
    // here would be a declaration nothing re-derives. It is in the manifest because it states a
    // bound, and W305's rule is that a module stating one cannot be a module this file has not
    // heard of.
    census: null,
    branches: [],
  },
  {
    module: "src/founder/second-reading.ts",
    // Reads the ledger through `allLedgerRows` rather than walking the tree, so W267's census does
    // not hold it — `treeWalkingFiles` does not see it and a row there would be a declaration
    // nothing re-derives. It is here because it states a bound.
    census: null,
    branches: [],
  },
  {
    module: "src/console/setup-gaps.ts",
    // Product copy and a pure derivation over `SetupReadiness`. It walks no tree, so W267's census
    // does not hold it; it is here because it states a bound.
    census: null,
    branches: [],
  },
  {
    module: "src/quality/hardening-q25.ts",
    // A record of a review rather than a walk of the tree, so W267's census does not hold it — the
    // same shape as the three hardening registers before it. Here because it states a bound.
    census: null,
    branches: [],
  },
  {
    module: "src/quality/controls.ts",
    // Reads a planning document and drives other registers; it walks no tree of its own, so W267's
    // census does not hold it and a row there would be a declaration nothing re-derives. It is
    // here because it states a bound.
    census: null,
    branches: [],
  },
  {
    module: "src/quality/unrun.ts",
    census: {
      derives:
        "Every module under `src/` that no `*.test.ts` can reach, following static imports from every test file plus the `import(\"@/…\")` edges the shared walk does not.",
      checkedAgainst:
        "W333's `UNRUN_MODULES`, in three directions: a module nothing reaches and nothing argues fails, an argued module the suite has since caught up with fails, and an entry claiming a page runs it when `reachableFromApp` says no page does fails.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a constructed tree holding one module a test imports and one nothing imports, where only the second may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every module this suite cannot execute is named, with who does run it and what a suite would add.",
        mutation:
          "A declaration is dropped and its module must be reported; a declaration is added for a module the suite reaches and must be reported the other way.",
      },
    },
    branches: [],
  },
  {
    module: "src/quality/self-ending.ts",
    census: {
      derives:
        "Every module under `src/` that CONSTRUCTS a declaration keyed to a future event — the discriminants `deferred`, `pending` and `remedy` in an object literal, read through W302's preparation with literals kept, because the marker is itself a literal.",
      checkedAgainst:
        "W330's `ENDING_REGISTERS` plus `WAIT_FIXTURES`, in both directions: a module spelling a wait that no register holds fails, and a register or fixture naming a module that has stopped spelling one fails.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a module constructing a wait is planted in a constructed root beside one that only COMPARES against the same discriminant, and only the first may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every declaration in this tree that is true only until something happens names the event, and the event is one something can read.",
        mutation:
          "A register is dropped from the list and its module must be reported as unregistered; a register naming a module the tree does not hold must be reported as stale.",
      },
    },
    branches: [
      {
        fn: "endingDiff",
        branch: "unregistered",
        reach: {
          kind: "driven",
          drive: () =>
            endingDiff(
              process.cwd(),
              ENDING_REGISTERS.filter((r) => r.module !== "src/quality/hardening-q22.ts"),
            ).unregistered.length > 0,
        },
      },
      {
        fn: "endingDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            endingDiff(process.cwd(), ENDING_REGISTERS, { "src/quality/gone.ts": "x" }).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/repository-clean.ts",
    // Reads directory entries at a path it names, so W267's census — which is about tree WALKS —
    // does not hold it and a row there would be a declaration nothing re-derives. It is here
    // because it states a bound.
    census: null,
    branches: [],
  },
  {
    module: "src/quality/claim-classes.ts",
    // Reads a planning document and drives other registers; it walks no tree of its own, so W267's
    // census does not hold it and a row there would be a declaration nothing re-derives. It is here
    // because it states a bound.
    census: null,
    branches: [],
  },
  {
    module: "src/quality/prose-numbers.ts",
    census: {
      derives:
        "Every numeric claim in a module header or doc comment under `src/` — a number followed by one of a closed vocabulary of countable nouns.",
      checkedAgainst:
        "W314's `CLAIMS`, in three directions: a claim nobody classified fails, a classification for a sentence that has been rewritten fails, and a claim declared `derived` whose number the tree disagrees with fails.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a module carrying a numeric claim in its header is planted in a constructed root beside one carrying the same words in code, and only the first may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every number this tree's prose states about itself is either re-derived from the tree or classified as history, as a count outside the repository, or as open with a reason.",
        mutation:
          "The four counts this tree records as having gone stale are replanted as headers with derivations that know the true number, and each must be reported.",
      },
    },
    branches: [],
  },
  {
    module: "src/quality/scan-text.ts",
    census: {
      derives:
        "Every module under `src/` that asks for the shared scan preparation, and every module that still writes its own comment-stripper or literal-blanker.",
      checkedAgainst:
        "W302's `SCAN_SITES`, both directions, and the rule that one stripper and one blanker exist in the tree.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "`scanSiteDiff` is handed a module list containing one that asks for the preparation and a declared list that does not name it, and must report it undeclared; handed the reverse, it must report the declaration stale",
      },
      assertion: {
        kind: "driven_by_branch",
        claim:
          "Every module preparing text for a scan is declared with the answers it wants and why, and the tree holds one comment-stripper and one literal-blanker.",
        mutation:
          "A module list naming a module the register does not know must come back undeclared.",
        branch: "src/quality/scan-text.ts::scanSiteDiff::undeclared",
      },
    },
    branches: [
      {
        fn: "scanSiteDiff",
        branch: "undeclared",
        reach: {
          kind: "driven",
          drive: () =>
            scanSiteDiff([{ module: "src/probe.ts", source: "prepareForScan(x);" }], []).undeclared.length > 0,
        },
      },
      {
        fn: "scanSiteDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () => scanSiteDiff([], SCAN_SITES).stale.length > 0,
        },
      },
      {
        fn: "fixtureDiff",
        branch: "unloaded",
        reach: {
          kind: "driven",
          // The declared side is a parameter, so the arm is reachable without touching the file: a tree
          // whose fixtures nobody cites has every block unloaded.
          drive: () => fixtureDiff(process.cwd(), []).unloaded.length > 0,
        },
      },
      {
        fn: "fixtureDiff",
        branch: "missing",
        reach: {
          kind: "driven",
          // The other arm needs a citation the file does not answer, which is the throw `fixtureText`
          // would produce at the call site — reported here before anybody runs into it.
          drive: () => fixtureDiff(process.cwd(), ["a-fixture-nobody-wrote"]).missing.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/declaration-tax.ts",
    census: {
      derives:
        "What one new module costs before anything watches it: the registers that REPORT a planted module, and the files that NAME an existing one.",
      checkedAgainst:
        "W267's census itself — the probe population is the census's plantable entries, both directions — and `TAX_AT_W300`, the frozen baseline W308 re-derives the live figure against.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "five module shapes are planted one at a time into a copy of the tree and every probe is run over each; an unplanted copy must demand nothing and a register-shaped plant must demand several",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "The measured tax matches the recorded baseline shape by shape, the probe population is exactly the census's plantable registers, and a module nobody names has no naming sites.",
        mutation:
          "`demandingRegisters` is run over a copy with nothing planted and must report none; `namingSites` is given a module path the tree does not hold and must report none.",
      },
    },
    branches: [
      {
        fn: "homeDiff",
        branch: "unhomed",
        reach: {
          kind: "driven",
          drive: () =>
            homeDiff(
              plantableTree(),
              DECLARATION_HOMES.filter((h) => h.register !== "src/quality/bounds.ts"),
            ).unhomed.length > 0,
        },
      },
      {
        fn: "homeDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            homeDiff(plantableTree(), [
              ...DECLARATION_HOMES,
              { register: "src/quality/not-a-register.ts", files: [], why: "x" },
            ]).stale.length > 0,
        },
      },
      {
        fn: "homeDiff",
        branch: "missing",
        reach: {
          kind: "driven",
          drive: () =>
            homeDiff(plantableTree(), [
              ...DECLARATION_HOMES,
              { register: "src/quality/bounds.ts", files: ["src/quality/gone.ts"], why: "x" },
            ]).missing.length > 0,
        },
      },
      {
        fn: "taxDiff",
        branch: "unaccounted",
        reach: {
          kind: "driven",
          drive: () => taxDiff({ ...TAX_AT_W300, plain: TAX_AT_W300.plain + 1 }).unaccounted.length > 0,
        },
      },
      {
        fn: "taxDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () => taxDiff({ ...TAX_AT_W300 }).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/bounds.ts",
    census: {
      derives:
        "Every `export const *_BOUND` under `src/` — the sentences this tree exports about what it does not prove.",
      checkedAgainst:
        "W297's `STATED_BOUNDS`, both directions: a bound the tree states and this register does not know fails, and a declared bound whose export is gone fails.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a module exporting a `*_BOUND` is planted in a constructed root beside one exporting a differently-named constant, and only the first may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every stated bound resolves to the unit that wrote its module and to a remedy its own sentence contains, the remedy has not been built, every predicate can be shown answering the other way or declares why it cannot, and every number-word in it is declared as something other than a total.",
        mutation:
          "`staleBounds` is given a bound whose `stillOpen` says the remedy is built and must report it; `liftedDefects` is given a bound whose lifting fixture does not lift it and must report that; `numberDefects` is given a sentence stating an undeclared number and must report that too.",
      },
    },
    branches: [],
  },
  {
    module: "src/quality/blind-spots.ts",
    census: {
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
    branches: [
      {
        fn: "boundDiff",
        branch: "unstated",
        reach: {
          kind: "driven",
          drive: () => boundDiff(BLIND_SPOTS, [{ file: "src/gone.ts" }]).unstated.includes("src/gone.ts"),
        },
      },
      {
        fn: "boundDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () => boundDiff(BLIND_SPOTS, []).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/acceptances.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/tautology-sweep.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/refusal-branches.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/register-census.ts",
    census: {
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
    branches: [
      {
        fn: "censusDiff",
        branch: "undeclared",
        reach: { kind: "driven", drive: () => censusDiff(["src/nobody-declared.ts"], []).undeclared.length > 0 },
      },
      {
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
    ],
  },
  {
    module: "src/api/surface.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/capacity/copy-lint.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/capacity/coupling.test.ts",
    census: {
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
    branches: [],
  },
  // `src/compliance/cdss-boundary.test.ts` WAS HERE, and its removal is the census working in the
  // direction that usually goes unnoticed. W267 recorded its walk as `walk_unproven` with the
  // remedy "export the walk from a module with a `root` parameter"; W270 needed exactly that to
  // give the floor a door, so the walk moved into `copy-y6.ts` and the entry went stale. A
  // register describing code that has moved reads as coverage, so the stale half fired and this
  // comment is what the next reader finds instead of a silent deletion.
  {
    module: "src/credentials/vault.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/directory/dossier-claims.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/domain/schema-consistency.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/education/advice-lint.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/interop/credentials.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/lib/source-hygiene.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/lib/stores.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/messaging/send-path.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/privacy/automated-decisions.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/privacy/erasure-y5.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/privacy/capacity-privacy.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/privacy/outcomes-privacy.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/privacy/record-classes.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/audit-y5.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/dossier-q18.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/security/page-reach.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/g5-rehearsal.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/latent-y5.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/register-census.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/page-suite.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/pins.ts",
    census: {
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
    branches: [
      {
        fn: "pinDiff",
        branch: "undeclared",
        reach: { kind: "driven", drive: () => pinDiff(process.cwd(), []).undeclared.length > 0 },
      },
      {
        fn: "pinDiff",
        branch: "stale",
        reach: { kind: "driven", drive: () => pinDiff(process.cwd(), [{ module: "src/gone.ts", name: "GONE_AT_W1", classification: { kind: "floor" as const, why: "x".repeat(70) } }]).stale.length > 0 },
      },
      {
        fn: "pinDiff",
        branch: "liveWithoutArgument",
        reach: { kind: "driven", drive: () => pinDiff(process.cwd(), [{ module: "x", name: "A_AT_W1", classification: { kind: "live_by_design" as const, movedBy: "s", whyStopping: "b" } }]).liveWithoutArgument.length > 0 },
      },
      {
        fn: "pinDiff",
        branch: "unargued",
        reach: { kind: "driven", drive: () => pinDiff(process.cwd(), [{ module: "x", name: "B_AT_W1", classification: { kind: "floor" as const, why: "short" } }]).unargued.length > 0 },
      },
      {
        fn: "duplicateDiff",
        branch: "unreconciled",
        reach: { kind: "driven", drive: () => duplicateDiff(process.cwd(), {}).unreconciled.length > 0 },
      },
      {
        fn: "duplicateDiff",
        branch: "unresolved",
        reach: {
          kind: "driven",
          drive: () => duplicateDiff(process.cwd(), { Y5_FIRST_UNIT: "src/does-not-exist.ts" }).unresolved.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/mutation-sampling.ts",
    census: {
      derives:
        "Every site in every module under `src/` where one of five character-level operators could flip a decision, paired with the module's own `*.test.ts` — and every module that has such a site and no suite at all.",
      checkedAgainst:
        "`SURVIVORS_AT_W296`, the sampled changes no suite noticed, and `UNTESTED_AT_W296`, the modules no sample can reach.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a module and a suite are constructed in a copied tree — one with a real comparison and one whose `===` appears only in a comment and a string — and only the first may yield a mutation site",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every sampled change to a module is turned red by that module's own suite, or is named here with the test that would catch it.",
        mutation:
          "`samplingReport` is handed a survivor no register declares and must report it unexplained.",
      },
    },
    branches: [],
  },
  {
    module: "src/quality/register-counts.ts",
    census: {
      derives:
        "Every assertion in every `*.test.ts` under `src/` that pins a declared register's SIZE to an integer literal, told apart from the far larger set of counts over a constructed fixture.",
      checkedAgainst:
        "`RATCHETS` — empty, because all seventeen were rewritten as the property each stood in for — in both directions.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a test pinning a register's size and a test counting a fixture's result are planted in one constructed tree, and only the first may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "No assertion in this tree pins the size of a declared register to a literal, so no ordinary addition can move one.",
        mutation:
          "`countDiff` is given a ratchet the sweep does not find and must report it stale.",
      },
    },
    branches: [
      {
        fn: "countDiff",
        branch: "unargued",
        reach: {
          kind: "driven",
          drive: () =>
            countDiff(process.cwd(), []).unargued.length > 0 ||
            // A healthy tree has none, which is the point of the unit — so the arm is driven on a
            // constructed tree holding one, the same way W291 drives every arm a clean tree refuses.
            withTree(
              { "src/planted/pin.test.ts": 'import { SOME_REGISTER } from "@/x";\nit("t", () => { expect(SOME_REGISTER).toHaveLength(7); });\n' },
              (root) => countDiff(root, []).unargued.length > 0,
            ),
        },
      },
      {
        fn: "countDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            countDiff(process.cwd(), [{ id: "src/gone.test.ts :: t :: REG", direction: "floor", why: "x" }]).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/planting.ts",
    census: {
      derives:
        "Every `*.test.ts` under `src/` that writes files, and whether it goes through a scoped planter or writes on its own.",
      checkedAgainst:
        "`WRITES_WITHOUT_A_PLANTER` — the suites that write an artefact or substitute a module rather than planting a probe — in both directions.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "the declared register is emptied and every writing test file must come back undeclared, and a declaration naming a file that writes nothing must come back stale",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "A probe planted in front of a detector cannot outlive the probe that planted it, because there is no exported way to plant without a scope.",
        mutation:
          "`planterDiff` is given an empty declared register and must report the tree's real writers undeclared.",
      },
    },
    branches: [
      {
        fn: "planterDiff",
        branch: "undeclared",
        reach: { kind: "driven", drive: () => planterDiff(process.cwd(), {}).undeclared.length > 0 },
      },
      {
        fn: "planterDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () => planterDiff(process.cwd(), { "src/quality/pins.test.ts": "gone" }).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/citations.ts",
    census: {
      derives:
        "Every file under `src/` that splits the `<file> :: <assertion>` separator, and whether it resolves through the shared resolver or splits a composite id instead.",
      checkedAgainst:
        "`SEPARATOR_NOT_A_CITATION` — the two files that split it for an id — in both directions, so a fifth independent resolver cannot arrive quietly.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "the declared register is emptied and both real separator-splitting files must come back undeclared, and a declaration naming a file that does not split it must come back stale",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every citation the tree carries resolves against the file it names, and every file that parses the format either uses the shared resolver or says why it is not resolving a citation.",
        mutation:
          "`separatorDiff` is given an empty declared register and must report the tree's real splitters undeclared.",
      },
    },
    branches: [
      {
        fn: "separatorDiff",
        branch: "undeclared",
        reach: { kind: "driven", drive: () => separatorDiff(process.cwd(), {}).undeclared.length > 0 },
      },
      {
        fn: "separatorDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () => separatorDiff(process.cwd(), { "src/quality/tree-walks.ts": "gone" }).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/empty-list-sweep.ts",
    census: {
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
    branches: [
      {
        fn: "emptyListDiff",
        branch: "newlyUnevidenced",
        reach: { kind: "driven", drive: () => emptyListDiff(process.cwd(), []).newlyUnevidenced.length > 0 },
      },
      {
        fn: "emptyListDiff",
        branch: "nowEvidenced",
        reach: {
          kind: "driven",
          drive: () =>
            emptyListDiff(process.cwd(), [...UNEVIDENCED_AT_W293, "src/gone.test.ts :: a test :: nothing"])
              .nowEvidenced.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/negative-probes.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/page-suite.ts",
    census: {
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
    branches: [
      {
        fn: "pageSuiteViolations",
        branch: "verify_does_not_chain_e2e",
        reach: {
          kind: "driven",
          drive: () =>
            withTree(
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
        fn: "pageSuiteViolations",
        branch: "runs_no_spec",
        reach: {
          kind: "driven",
          drive: () =>
            withTree(
              {
                "package.json": JSON.stringify({ scripts: { verify: "pnpm e2e", e2e: "playwright test" } }),
                "playwright.config.ts": "export default {};\n",
              },
              (root) => pageSuiteViolations(root).some((v) => v.includes("runs no spec at all")),
            ),
        },
      },
      {
        fn: "pageSuiteViolations",
        branch: "suite_narrowed_by_a_filter",
        reach: {
          kind: "driven",
          drive: () =>
            withTree(
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
        fn: "pageSuiteViolations",
        branch: "excluded_spec_is_stale",
        reach: {
          kind: "driven",
          // W333 took the parameter this branch's own unreachability note asked for, at W255.
          drive: () =>
            pageSuiteViolations(process.cwd(), { "e2e/never-written.spec.ts": "x".repeat(60) }).some((v) =>
              v.includes("is excluded and does not exist"),
            ),
        },
      },
      {
        fn: "pageSuiteViolations",
        branch: "excluded_without_a_reason",
        reach: {
          kind: "driven",
          // The same parameter reaches both, which is why the note said two lines rather than one
          // unit: an exclusion whose reason is too short to be a reason.
          drive: () =>
            pageSuiteViolations(process.cwd(), { "e2e/founder.spec.ts": "no" }).some((v) =>
              v.includes("is excluded without a reason"),
            ),
        },
      },
    ],
  },
  {
    module: "src/quality/unit-headers.ts",
    census: {
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
    branches: [
      {
        fn: "headerViolations",
        branch: "missing",
        reach: {
          kind: "driven",
          drive: () =>
            withTree({ "src/probe.ts": "export const x = 1;\n" }, (root) =>
              headerViolations(root, LEDGER_ROW(1)).some((v) => v.includes("no `// W<n>` header")),
            ),
        },
      },
      {
        fn: "headerViolations",
        branch: "misplaced",
        reach: {
          kind: "driven",
          drive: () =>
            withTree({ "src/probe.ts": "export const x = 1;\n// W1: recorded far from the top.\n" }, (root) =>
              headerViolations(root, LEDGER_ROW(1)).some((v) => v.includes("outside the header position")),
            ),
        },
      },
      {
        fn: "headerViolations",
        branch: "unknownUnit",
        reach: {
          kind: "driven",
          drive: () =>
            withTree({ "src/probe.ts": "// W9999: a unit the ledger does not have.\nexport const x = 1;\n" }, (root) =>
              headerViolations(root, LEDGER_ROW(1)).some((v) => v.includes("does not have")),
            ),
        },
      },
    ],
  },
  {
    module: "src/founder/outstanding.ts",
    // CENSUS: NULL, AND W267 IS WHY. The first draft gave this module a census entry and the
    // register said "a declared walker no longer walks" — correctly. `treeWalkingFiles` looks for a
    // module that ENUMERATES the tree; this one opens `BUILD-STATE.md` and `FIVE-YEAR-PLAN.md` by
    // name. Reading two known files is not a walk, and claiming a census row for it would have
    // bought a blind spot, a negative probe, an assertion drive and a place in W300's tax
    // measurement, all describing a walk that does not happen.
    census: null,
    branches: [
      {
        fn: "founderDiff",
        branch: "undescribed",
        reach: {
          kind: "driven",
          drive: () =>
            founderDiff(process.cwd(), [
              { blocker: "G404", kind: "founder_gate", whoDecides: "x", releases: ["W161"] },
            ]).undescribed.length > 0,
        },
      },
      {
        fn: "founderDiff",
        branch: "phantom",
        reach: {
          kind: "driven",
          drive: () =>
            founderDiff(process.cwd(), [
              { blocker: "G5", kind: "founder_gate", whoDecides: "The founder.", releases: ["W1"] },
            ]).phantom.length > 0,
        },
      },
      {
        fn: "founderDiff",
        branch: "unrendered",
        reach: {
          kind: "driven",
          drive: () => founderDiff(process.cwd(), []).unrendered.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/tree-walks.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/latent-findings.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/referrals/scoping.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/reporting/retention.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/tenancy/two-tenant.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/verticals/assembly.test.ts",
    census: {
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
    branches: [],
  },
  {
    module: "src/quality/review-w279.ts",
    census: null,
    branches: [
      {
        fn: "fallibleDiff",
        branch: "undeclared",
        reach: {
          kind: "driven",
          drive: () => fallibleDiff(process.cwd(), {}).undeclared.length > 0,
        },
      },
      {
        fn: "fallibleDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () => fallibleDiff(process.cwd(), { "/console/in-memory": "REMEDY: none needed" }).stale.length > 0,
        },
      },
      {
        fn: "fallibleDiff",
        branch: "withoutRemedy",
        reach: {
          kind: "driven",
          drive: () => fallibleDiff(process.cwd(), { "/console/interest": "no remedy stated" }).withoutRemedy.length > 0,
        },
      },
    ],
  },
  {
    module: "src/tenancy/fixture-coherence.ts",
    census: null,
    branches: [
      {
        fn: "coherenceViolations",
        branch: "incoherent",
        reach: {
          kind: "driven",
          drive: () =>
            coherenceViolations(new Map([["resetStore", ["prac-demo"]]]), ["prac-1"]).incoherent.length > 0,
        },
      },
      {
        fn: "coherenceViolations",
        branch: "undeclared",
        reach: {
          kind: "driven",
          drive: () => coherenceViolations(new Map(), ["prac-1"], [], ["resetNew"]).undeclared.length > 0,
        },
      },
      {
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
    ],
  },
  {
    module: "src/quality/blocked-surface.ts",
    census: null,
    branches: [
      {
        fn: "blockedSurfaceViolations",
        branch: "grew",
        reach: {
          kind: "driven",
          drive: () => blockedSurfaceViolations(process.cwd(), 1).some((v) => v.includes("grew to")),
        },
      },
      {
        fn: "blockedSurfaceViolations",
        branch: "fell",
        reach: {
          kind: "driven",
          drive: () => blockedSurfaceViolations(process.cwd(), 999).some((v) => v.includes("fell to")),
        },
      },
    ],
  },
  {
    module: "src/quality/negative-probes.ts",
    census: null,
    branches: [
      {
        fn: "negativeDiff",
        branch: "unprobed",
        reach: { kind: "driven", drive: () => negativeDiff(undefined, []).unprobed.length > 0 },
      },
      {
        fn: "negativeDiff",
        branch: "stale",
        reach: { kind: "driven", drive: () => negativeDiff([], undefined).stale.length > 0 },
      },
      {
        fn: "negativeDiff",
        branch: "unsupportedExemption",
        reach: {
          kind: "driven",
          drive: () =>
            negativeDiff(
              [{ file: "src/x.ts", derives: "d", checkedAgainst: "c", proof: { kind: "mutated_tree", mutation: "m" }, assertion: { kind: "carries_no_assertion" as const, claim: "a constructed register", why: "a fixture" }, }],
              [{ register: "src/x.ts", negative: { kind: "no_detector_of_its_own", why: "asserted rather than earned" } }],
            ).unsupportedExemption.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/manifest.ts",
    census: {
      derives:
        "Every module some register watches — one that states a bound, pins a constant, reports violations or walks the tree — checked against the rows declared here.",
      checkedAgainst:
        "`MANIFEST` itself, in both directions: a watched module with no row is unknown, a row naming a file that is gone is stale.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a module stating a bound is planted in a constructed tree with no row for it, and `manifestDiff` must report it unknown; a row is declared for a module that does not exist, and it must come back stale",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every module this tree watches has a row here, and every row names a module that exists.",
        mutation:
          "`manifestDiff` is given a manifest with a row removed and must report the module it named as unknown.",
      },
    },
    branches: [
      {
        fn: "manifestDiff",
        branch: "unknown",
        reach: {
          kind: "driven",
          drive: () => manifestDiff(process.cwd(), []).unknown.length > 0,
        },
      },
      {
        fn: "manifestDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            manifestDiff(process.cwd(), [
              { module: "src/gone.ts", census: null, branches: [] },
            ]).stale.includes("src/gone.ts"),
        },
      },
    ],
  },
  // ── Watched, and owing the three derived registers nothing ───────────────────────────────────
  //
  // THE MANIFEST'S FIRST RUN FOUND THESE and they are the reason it is worth having. Each states a
  // bound or pins a constant, so `bounds.ts` or `pins.ts` watches it — and none had a row in the
  // census, the blind spots or the branches, so there was nowhere the fact was written down. A row
  // with three nulls is not an empty row: it is this tree saying it knows the module exists and
  // that the module owes these three registers nothing.
  {
    module: "src/compliance/cdss-boundary.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/compliance/composed-copy.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/compliance/public-surfaces.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/compliance/rail-y5.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/console/zero-states.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/privacy/adm-y5.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/quality/assertion-drives.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/quality/self-defeating.ts",
    census: {
      derives:
        "Every assertion in every `*.test.ts` under `src/` comparing a LIVE value to a frozen `*_AT_W<n>` record by equality — the shape a remedy for a pinned count keeps taking.",
      checkedAgainst:
        "`ARGUED_EQUALITIES`, the named lists an equality is right for, in both directions.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "an assertion measuring a derived value against a frozen record is planted beside one taking a FLOOR against the same record, and only the first may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "No assertion in this tree measures a live derivation against a frozen record by equality except where the record is a named list, which cannot be satisfied by retyping a digit.",
        mutation:
          "`equalityDiff` is given an empty argued register and must report every equality the tree holds.",
      },
    },
    branches: [
      {
        fn: "equalityDiff",
        branch: "unargued",
        reach: {
          kind: "driven",
          drive: () => equalityDiff(process.cwd(), []).unargued.length > 0,
        },
      },
      {
        fn: "equalityDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            equalityDiff(process.cwd(), [{ id: "src/gone.test.ts :: t :: GONE_AT_W1", why: "x" }]).stale.length >
            0,
        },
      },
    ],
  },
  {
    module: "src/quality/assertion-vocabulary.ts",
    census: {
      derives:
        "Every assertion in every `*.test.ts` under `src/` that claims a collection has at least one element, in the six spellings `NON_EMPTY_FORMS` declares.",
      checkedAgainst:
        "`CANONICAL`, the one spelling this tree keeps — every claim found in any other form is reported.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "each declared spelling is planted as source and must be returned, and each of `NOT_THIS_CLAIM` is planted beside it and must not be — a floor, a ceiling, an `every` over elements, and the two un-negated emptiness claims",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "No test in this tree says a collection is non-empty except as `expect(xs.length).toBeGreaterThan(0)`, which is the only spelling the tree's other sweeps can see is about a count.",
        mutation:
          "`vocabularyDefects` is given a different canonical form and must report every site in the tree.",
      },
    },
    branches: [],
  },
  {
    module: "src/quality/unread-bounds.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/quality/dossier-derived.ts",
    census: null,
    branches: [
      {
        fn: "dossierDiff",
        branch: "no-row-for-a-live-decision",
        reach: {
          kind: "driven",
          drive: () =>
            dossierDiff(process.cwd(), PLANTED_DOSSIER("| **G0** — nothing | 0 | none | Y1 |")).some((d) =>
              d.what.includes("has no row for it"),
            ),
        },
      },
      {
        fn: "dossierDiff",
        branch: "a-row-the-ledger-blocks-nothing-on",
        reach: {
          kind: "driven",
          drive: () =>
            dossierDiff(process.cwd(), PLANTED_DOSSIER("| **G0** — nothing | 0 | none | Y1 |")).some((d) =>
              d.what.includes("the ledger blocks nothing on it"),
            ),
        },
      },
      {
        fn: "dossierDiff",
        branch: "a-unit-the-row-omits",
        reach: {
          kind: "driven",
          drive: () =>
            dossierDiff(process.cwd(), PLANTED_DOSSIER("| **G5** — content | 8 | W161 | Y3 |")).some((d) =>
              d.what.includes("does not name it"),
            ),
        },
      },
      {
        fn: "dossierDiff",
        branch: "a-count-that-disagrees-with-its-own-list",
        reach: {
          kind: "driven",
          drive: () =>
            dossierDiff(process.cwd(), PLANTED_DOSSIER("| **G3** — sms | 5 | W174 | Y1 |")).some((d) =>
              d.what.includes("states 5 units"),
            ),
        },
      },
    ],
  },
  {
    module: "src/quality/quarter-mutants.ts",
    census: {
      derives:
        "Every mutation site in every module whose header names a unit in one quarter's range — the modules that quarter ADDED — run one at a time against that module's own suite inside a copied tree.",
      checkedAgainst:
        "`SURVIVORS_AT_W332`, through W296's `samplingReport`, in both directions: a mutant nothing caught and nothing explains, and a declared survivor the suite now catches.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "the runner is handed a suite that throws and one that does not, over a module held in a map rather than on disk, and only the second may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "Every change these five operators can make to a module Q25 added is caught by that module's own suite, except the two named here with their kind and their argument.",
        mutation:
          "`samplingReport` is given a survivor this register does not name, and its `unexplained` arm must report it.",
      },
    },
    branches: [],
  },
  {
    module: "src/quality/deferrals.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/quality/instant.ts",
    census: {
      derives:
        "Every declared control's answer over one copied tree, run twice — once quiet and once with the state a racing worker, an install or a tool would have left behind.",
      checkedAgainst:
        "`CONTROLS`, in both directions: a control whose answer moves and is not declared to, and a control declared to move that stood still.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a control reading the installed dependencies is planted and declared stable, beside one declared to move that never does, and each must be reported for its own reason",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "No control in this tree answers differently because state outside the tree moved, except the one that is declared to and says which instant it answers at.",
        mutation:
          "`instantDiff` is given a planted control that reads `node_modules` and must report it.",
      },
    },
    branches: [
      {
        fn: "instantDiff",
        branch: "moved-and-undeclared",
        reach: {
          kind: "driven",
          drive: () =>
            instantDiff(process.cwd(), [
              {
                id: "src/planted/reads.ts::reads",
                reads: "the installed dependencies",
                instant: "x".repeat(40),
                cannotSee: "y".repeat(40),
                mayMove: false,
                run: (root) => (existsSync(path.join(root, "node_modules")) ? [1, 2] : [1]),
              },
            ]).length > 0,
        },
      },
      {
        fn: "instantDiff",
        branch: "declared-and-still",
        reach: {
          kind: "driven",
          drive: () =>
            instantDiff(process.cwd(), [
              {
                id: "src/planted/still.ts::still",
                reads: "the working directory",
                instant: "x".repeat(40),
                cannotSee: "y".repeat(40),
                mayMove: true,
                run: () => [1],
              },
            ]).length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/close-gate.ts",
    census: {
      derives:
        "Every first-party source module naming one of the ledger's parse entry points — `parseLedgerRows`, `allLedgerRows`, `blockedRows` — or opening `BUILD-STATE.md` itself.",
      checkedAgainst:
        "`LEDGER_READERS` and `NOT_A_CLOSING_CHECK` together, in both directions: a ledger-reading module is watched at the close or excused in writing.",
      proof: {
        kind: "mutated_tree",
        mutation:
          "a check whose answer changes when the row closes is planted beside one that reports the same before and after, and only the first may be reported",
      },
      assertion: {
        kind: "driven_here",
        claim:
          "No module reads the ledger without the close either running it or saying in writing why a close cannot break it.",
        mutation:
          "`readerDiff` is given an empty register and must report every ledger-naming module the tree holds.",
      },
    },
    branches: [
      {
        fn: "readerDiff",
        branch: "unwatched",
        reach: {
          kind: "driven",
          drive: () => readerDiff(process.cwd(), [], []).unwatched.length > 0,
        },
      },
      {
        fn: "readerDiff",
        branch: "stale",
        reach: {
          kind: "driven",
          drive: () =>
            readerDiff(process.cwd(), [], [{ module: "src/quality/gone.ts", why: "x" }]).stale.length > 0,
        },
      },
    ],
  },
  {
    module: "src/quality/closing-state.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/quality/hardening-q24.ts",
    census: null,
    branches: [],
  },
  {
    module: "src/quality/hardening-q23.ts",
    census: null,
    branches: [],
  },
];

// ── The four registers, derived ───────────────────────────────────────────────────────────────
//
// THEY LIVE HERE RATHER THAN IN THEIR OWN MODULES FOR A CONCRETE REASON, not tidiness. Each of the
// three registers is imported BY this manifest — a blind-spot probe calls `treeWalkingFiles`, a
// drive calls `censusDiff` — so declaring `BLIND_SPOTS = MANIFEST.flatMap(...)` inside
// `blind-spots.ts` puts a live cycle through a top-level array construction: whichever module is
// entered first finds the other half in its temporal dead zone, and ten suites fail to collect with
// `Cannot read properties of undefined`. A RE-EXPORT evaluates nothing, so the registers say
// `export { BLIND_SPOTS } from "./manifest"` and the cycle resolves. The cycle itself is not new —
// `blind-spots` and `refusal-branches` have imported each other since W295, surviving because every
// use is inside a thunk. This keeps that discipline instead of relying on it twice over.

/**
 * The three derivations, each taking the entries so they can be driven on a constructed manifest.
 *
 * TAKING AN ARGUMENT IS THE WHOLE OF W289's REMEDY and the reason the gate's last clause is
 * provable: the real manifest is complete, so "a module declared once is watched by all of them"
 * cannot be shown against it — every module is already declared. Handed ONE constructed row, the
 * three functions must each produce it.
 */
export function deriveCensus(entries: readonly ModuleEntry[] = MANIFEST): TreeDerivedRegister[] {
  return entries.flatMap((e) => (e.census ? [{ file: e.module, ...e.census }] : []));
}

export function deriveBranches(entries: readonly ModuleEntry[] = MANIFEST): RefusalBranch[] {
  return entries.flatMap((e) => e.branches.map((b) => ({ module: e.module, ...b })));
}

/** W267's census: every module here that declares a walk. */
export const TREE_DERIVED_REGISTERS: readonly TreeDerivedRegister[] = deriveCensus();

/** W291's refusal branches, in manifest order. A module may declare several. */
export const REFUSAL_BRANCHES: readonly RefusalBranch[] = deriveBranches();

export interface ManifestDiff {
  /** A module some register watches that has no row here. */
  unknown: string[];
  /** A row naming a module that is no longer in the tree. */
  stale: string[];
}

/**
 * The manifest against the registers that are NOT derived from it, both directions.
 *
 * THE THREE DERIVED REGISTERS ARE NOT CHECKED HERE AND SAYING WHY IS THE POINT. Their agreement
 * with the manifest is by construction — `TREE_DERIVED_REGISTERS` IS `deriveCensus()` — so
 * asserting it would be the tautology W304 spent a unit removing. What is worth checking is the
 * registers that kept their own lists: a module that states a bound, pins a constant or reports
 * violations, and that this manifest has never heard of, is a module that arrived unwatched.
 */
export function manifestDiff(root: string, entries: readonly ModuleEntry[] = MANIFEST): ManifestDiff {
  const declared = new Set(entries.map((e) => e.module));
  // TEST FILES ARE OUT OF SCOPE AND THAT IS A NARROWING, not an oversight. Six `.test.ts` files
  // pin a constant, so W290 watches them — but a test file cannot hold a census entry, a blind spot
  // or a refusal branch, so a row here would be a row that could never say anything. Stated in
  // `MANIFEST_BOUND` rather than left for the next reader to infer from a filter.
  const watched = new Set<string>(
    [
      ...boundsInTree(root).map((b) => b.split("::")[0]!),
      ...pinsInTree(root).map((p) => p.module),
      ...violationReporters(root).map((r) => r.module),
      ...treeWalkingFiles(root, ["src"]),
    ].filter((m) => !m.endsWith(".test.ts")),
  );
  const onDisk = (rel: string) => existsSync(path.join(root, rel));
  return {
    unknown: [...watched].filter((m) => !declared.has(m)).sort(),
    stale: entries.map((e) => e.module).filter((m) => !onDisk(m)).sort(),
  };
}

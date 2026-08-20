// W289: every register proves one ASSERTION can fail, not just its walk.
//
// W267 SPLIT "THE SCAN" IN TWO AND PROVED ONE HALF. A register that derives something from the
// tree has a content scanner, a walk, and — between them and unremarked — a COMPARISON: the line
// that takes what the walk found, holds it against the declared list, and fails. W267 found that
// almost nothing had ever shown its walk noticing a file arriving, and fixed it. Nothing has ever
// shown a comparison rejecting a declared list it should reject.
//
// AND THAT IS NOT A THEORETICAL GAP. A walk that works, a scanner that works and a diff that never
// reports anything is a register which passes forever while reading as this tree's principal
// control — which is precisely what `AUDIT-Y5.md` was uneasy about and what W284's `specOpens`
// turned out to be at the level of one route.
//
// THE STRUCTURAL REASON IS W267'S, ONE ARGUMENT OVER. A walk can only be tested by pointing it at a
// different tree, so only a detector taking a `root` can be tested. An assertion can only be tested
// by handing it a different DECLARED list, so only a comparison exported as a function taking that
// list can be tested. MOST of the census's registers do their comparing inside a `.test.ts`
// file, and a test file exports nothing: there is no second declared list to give it, and the
// proof is unavailable rather than merely absent. Each of those carries the one-line change.
//
// THE DRIVEN ONES ARE EXECUTED, NOT CITED. Some here, the rest already covered by
// W291's branch register — and those are RESOLVED and CALLED rather than recorded, because
// W284's central citation resolved to `text.includes("/")` and nobody had run it. A citation this
// register cannot resolve fails; a citation naming a branch W291 lists as unreachable fails too.
//
// WHAT THIS IS NOT. It is not a second copy of W291. That register asks, of six violation
// reporters, whether every ARM has ever been produced; this asks, of EVERY census
// register, whether the ONE assertion that is the register's point can fail at all. Where they
// meet, this cites and executes rather than rewriting the drive.
//
// WHAT THIS DOES NOT PROVE is `DRIVE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Fabricated declared lists and temporary directories.

import { diffCensus, discoverSurfaces, parseCensus } from "@/compliance/surfaces";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { samplingReport } from "./mutation-sampling";
import { momentDefects } from "./moments";
import { RECLAMATION_AT_W375, residueDefects as tempResidueDefects } from "./run-residue";
import { RULES_AT_W373, ruleDefects } from "./patient-populations";
import { REACHED_AT_W371, reachedDefects } from "./reached-pages";
import { emptyPopulationDefects } from "./empty-populations";
import { separatorDiff } from "./citations";
import { planterDiff } from "./planting";
import { countDiff } from "./register-counts";
import { manifestDiff } from "./manifest";
import { equalityDiff } from "./self-defeating";
import { coverageByBand } from "@/compliance/copy-y6";
import { diffFoldRegister, discoverFoldSites } from "./order-independence";
import { undeclaredInstructionSinks } from "@/security/instruction-sinks";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { REFUSAL_BRANCHES, type RefusalBranch, driveBranches, withRoot } from "./refusal-branches";
import { type Exemption, reachDefects } from "./exemption-reach";
import { type Checker, type ListedRegister, checkerDefects } from "./derivable-lists";
import { anchorCoverage, deadAnchors } from "./latent-y5";
import { LATENT_FINDINGS, fired } from "./latent-findings";
import { pinDiff } from "./pins";
import { demandingRegisters, namingSites } from "./declaration-tax";
import { numberDefects, staleBounds, unresolvedBounds } from "./bounds";
import { BLIND_SPOTS, NOT_CALLABLE, boundDiff, falseBounds } from "./blind-spots";
import { unaskedDefects, unaskedFacts } from "./unasked-facts";
import { allAcceptances, expiredAcceptances, staleAcceptances } from "./acceptances";
import { unacceptedTautologies } from "./tautology-sweep";
import { fixtureToken } from "./scan-text";
import { claimDefects } from "./prose-numbers";
import { type Figure, figureDefects } from "./flattering-numbers";
import { type Excuse, excuseDefects, excuses } from "./shared-excuses";
import { type Selector, type Widening, supersetDefects } from "./superset";
import { endingDiff } from "./self-ending";
import { PREMISES_AT_W358, premiseDefects, stagedSpecs } from "./spec-premises";
import { residueDefects } from "./spec-stores";
import { ZERO_CLAIMS, zeroDefects } from "@/console/zero-meaning";
import { DRIVEN_AT_W355, defaultDefects, defaultedParameters } from "./defaulted-registers";
import { horizonDefects, horizonTokens } from "./horizon-directions";
import { unreachedByUnitSuite } from "./unrun";
import { vocabularyDefects } from "./assertion-vocabulary";
import { readerDiff } from "./close-gate";
import { SHARED_PARSES, copyDefects } from "./private-copies";
import { nameDefects } from "./typed-names";
import { registerDiff } from "./deferrals";
import { instantDiff } from "./instant";
import { SURVIVORS_AT_W332 } from "./quarter-mutants";

/**
 * A comparison handed an input it must reject, keyed by the register the census names.
 *
 * Each returns whether the register REPORTED — so a drive that silently stopped reaching its
 * comparison is a failure here rather than a quiet pass, which is the same distinction W291 draws
 * between "nothing fired" and "nothing was driven".
 */
export type Drive = (root: string) => boolean;

/** A date past every review date in the tree. Named, not inline — see the acceptances drive. */
const BEYOND_EVERY_REVIEW = "2099-01-01";

export const ASSERTION_DRIVES: Readonly<Record<string, Drive>> = {
  "src/quality/moments.ts": (root) =>
    momentDefects(root, [{ file: "src/quality/no-such-module.ts" }], []).some((d) =>
      d.what.includes("answers at no moment"),
    ),

  "src/quality/run-residue.ts": (root) =>
    tempResidueDefects(
      root,
      RECLAMATION_AT_W375.map((r) =>
        r.site === "vitest.global-setup.ts::sweepTreeCopies" ? { ...r, reachedFrom: ["teardown"] } : r,
      ),
    ).some((d) => d.what.includes("is reached from setup")),

  "src/quality/patient-populations.ts": (root) =>
    ruleDefects(root, new Map(), RULES_AT_W373).some((d) =>
      d.what.startsWith("is described here and nothing runs it"),
    ),

  "src/quality/reached-pages.ts": (root) =>
    reachedDefects(root, REACHED_AT_W371.filter((r) => r.route !== "/console")).some(
      (d) => d.route === "/console",
    ),

  "src/quality/empty-populations.ts": (root) =>
    emptyPopulationDefects(root, [
      { module: "src/gone.ts", name: "GONE_REGISTER", emptiness: { kind: "by_design", quote: "a sentence no module makes" } },
    ]).length > 0,

  "src/quality/citations.ts": (root) => separatorDiff(root, {}).undeclared.length > 0,

  "src/quality/planting.ts": (root) => planterDiff(root, {}).undeclared.length > 0,

  "src/quality/self-defeating.ts": (root) => {
    void root;
    return equalityDiff(process.cwd(), []).unargued.length > 0;
  },

  "src/quality/manifest.ts": (root) =>
    manifestDiff(root, [{ module: "src/gone.ts", census: null, branches: [] }]).stale.length > 0,

  "src/quality/blind-spots.ts": (root) => {
    void root;
    const unstated = boundDiff(BLIND_SPOTS, [{ file: "src/w289-probe.ts" }]).unstated.length > 0;
    const refuted =
      falseBounds({
        "src/w289-probe.ts": {
          kind: "demonstrated",
          bound: "a".repeat(120),
          witness: "a witness the register reports",
          control: "a control it also reports",
          probe: () => ({ witnessSeen: true, controlSeen: true }),
        },
      }).length > 0;
    return unstated && refuted;
  },

  "src/quality/register-counts.ts": (root) =>
    countDiff(root, [{ id: "src/gone.test.ts :: t :: REG", direction: "floor", why: "x" }]).stale.length > 0,

  "src/quality/mutation-sampling.ts": () => {
    // W296's report, handed a survivor no register declares. The runner spawns processes and lives
    // in the test; the COMPARISON is what this register drives, which is the distinction W289 is
    // about — a walk and a run are not an assertion.
    return samplingReport(["src/x.ts :: eq-to-neq :: a === b"], [], []).unexplained.length > 0;
  },

  "src/compliance/surfaces.ts": (root) => {
    // The census with one row removed, against the tree's real surfaces.
    const surfaces = discoverSurfaces(path.join(root, "app"));
    const census = parseCensus(readFileSync(path.join(root, "docs/COMPLIANCE-DOSSIER.md"), "utf8"));
    return diffCensus(surfaces, census.slice(1)).unmapped.length > 0;
  },

  "src/quality/order-independence.ts": (root) => {
    const found = discoverFoldSites(root);
    return diffFoldRegister(found, []).undeclared.length > 0;
  },

  "src/security/instruction-sinks.ts": (root) => {
    // The found side rather than the declared one: `DECLARED_INSTRUCTION_SINKS` is a module
    // constant, but a hit nobody has ruled on is the input the comparison exists to reject, and it
    // can be fabricated. Same assertion, reachable from the other end.
    //
    // THE MARKER LIVES OUTSIDE THIS FILE, and the first draft wrote it here — W153's scanner found
    // the probe's own literal and reported this module as an undeclared instruction sink. The
    // twelfth instance of the collision W237 recorded; W289 split the token, and W307 moved it out
    // of the surface instead, which is the rule rather than the workaround.
    void root;
    return (
      undeclaredInstructionSinks([
        { file: "src/w289-probe.ts", marker: fixtureToken("openai-endpoint-host") },
      ]).length > 0
    );
  },

  "src/compliance/copy-y6.ts": (root) => {
    // An empty declared surface: every band with modules in it must come back uncovered. A band
    // reporting full coverage of nothing is the failure this drive rules out.
    const bands = coverageByBand(root, []);
    const populated = bands.filter((b) => b.modules > 0);
    return populated.length > 0 && populated.every((b) => b.covered === 0);
  },

  "src/quality/acceptances.ts": (root) => {
    // Both arms of W294's register, each given the input it exists to reject: a date beyond every
    // review date must expire every acceptance, and a register whose sweep produces nothing must
    // report its acceptance stale.
    //
    // THE PROBE'S DATE IS NAMED RATHER THAN WRITTEN INLINE, for the reason the split marker above
    // is split: W294's detector looks for `reviewBy:` followed by a literal, which is what a module
    // HOLDING acceptances does, and a fixture written that way made this file look like an eighth
    // acceptance register. Naming the constant is ordinary code, not a contortion, and it leaves
    // the detector's rule intact rather than carving an exemption into it.
    void root;
    const expired = expiredAcceptances(BEYOND_EVERY_REVIEW).length === allAcceptances().length;
    const stale = staleAcceptances([
      {
        unit: "W289",
        module: "src/w289-probe.ts",
        register: "PROBE",
        entries: () => [{ id: "W289::probe", reviewBy: BEYOND_EVERY_REVIEW, why: "a probe" }],
        rederivation: { kind: "rederived_here", sweep: "nothing", stale: () => ["W289::probe"] },
      },
    ]);
    return expired && stale.length > 0;
  },

  "src/quality/bounds.ts": (root) => {
    const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
    const probe = {
      module: "src/w289-probe.ts",
      name: "PROBE_BOUND" as const,
      unit: "W9999" as const,
      text: "a sentence stating seventeen of something",
      lifting: {
        kind: "remedy" as const,
        remedy: "a remedy nobody wrote",
        reads: "x",
        stillOpen: () => false,
        // W306: the lifting declaration this probe would need to satisfy `liftedDefects`. It says
        // the predicate reads no tree, which is true of `() => false` and is exactly the claim
        // `liftedDefects` checks — so the probe below is also the drive for a bound stuck closed.
        lifted: { kind: "derived_without_a_tree" as const, why: "a probe, and it reads nothing" },
      },
      numbers: [],
    };
    return (
      staleBounds(root, [probe]).length > 0 &&
      numberDefects([probe]).length > 0 &&
      unresolvedBounds(root, ledger, [probe]).length > 0
    );
  },

  "src/quality/assertion-vocabulary.ts": (root) => {
    // W323's comparison, handed a canonical form the tree does not use. Every non-emptiness claim
    // in the tree is then in the wrong spelling, so the arm that must fire is the only arm there
    // is — and the point is that the choice is an argument rather than a constant welded in.
    return vocabularyDefects(root, "not equal []").length > 100;
  },

  "src/quality/quarter-mutants.ts": (root) => {
    // W332's register, read through W296's reporter: a survivor the run found and this register
    // does not name. The arm that must fire is `unexplained` — a change nothing in the quarter's
    // own suites noticed and nobody has written down.
    void root;
    return (
      samplingReport(["src/planted/x.ts :: and-to-or :: a && b"], [], SURVIVORS_AT_W332).unexplained.length > 0
    );
  },

  "src/quality/instant.ts": (root) => {
    // W327's comparison, handed a control that reads the installed dependencies and is declared
    // stable — which is exactly what `fixtureFiles` was before this unit. The arm that must fire is
    // the one saying an answer moved with state outside this tree.
    return (
      instantDiff(root, [
        {
          id: "src/planted/reads-the-install.ts::everything",
          reads: "the installed dependencies",
          instant: "x".repeat(40),
          cannotSee: "y".repeat(40),
          mayMove: false,
          run: (planted) => (existsSync(path.join(planted, "node_modules")) ? [1, 2] : [1]),
        },
      ]).length > 0
    );
  },

  "src/quality/deferrals.ts": (root) => {
    // W343's comparison with nothing collected, which is the state where every hardening pass in
    // the tree is outside the clock — the sentence `DEFERRAL_BOUND` carried for two quarters.
    return registerDiff(root, []).uncollected.length > 0;
  },

  "src/quality/typed-names.ts": (root) => {
    // W342's resolution, driven on a constructed tree so the answer is not this tree's zero: a
    // register naming a module nothing holds must be reported, and the register with no
    // fabrications declared must report it as unresolved rather than excuse it.
    void root;
    return withRoot(
      { "src/planted/w342-drive.ts": 'export const ROWS = [{ module: "src/planted/absent-forever.ts" }];\n' },
      (planted) => nameDefects(planted, undefined, []).some((d) => d.kind === "unresolved"),
    );
  },

  "src/quality/private-copies.ts": (root) => {
    // W341's comparison with the declaration table emptied, which is the state where every private
    // copy in the tree is undeclared. The arm that must fire is the one saying a module holds a
    // copy of a shared parse and says nothing about why.
    return copyDefects(root, SHARED_PARSES, []).some((d) => d.kind === "undeclared");
  },

  "src/quality/close-gate.ts": (root) => {
    // W326's comparison with both registers emptied, which is the state where every ledger-reading
    // module in the tree is unwatched. The arm that must fire is the one saying a module reads the
    // ledger and no closing check knows.
    return readerDiff(root, [], []).unwatched.length > 0;
  },

  "src/quality/unasked-facts.ts": (root) => {
    // W340's comparison, driven in a constructed tree so the answer is not this tree's seventy-one.
    // One page, one export it imports and one it does not: only the second may be reported, and a
    // declaration for it must silence the register.
    void root;
    return withRoot(
      {
        "app/page.tsx": 'import { asked } from "@/facts";\nexport default function P() { return asked(); }\n',
        "src/facts.ts": "export function asked(): number {\n  return 1;\n}\nexport function unread(): number {\n  return 2;\n}\n",
      },
      (planted) => {
        const found = unaskedFacts(planted);
        if (found.length !== 1 || found[0] !== "src/facts.ts::unread") return false;
        return (
          unaskedDefects(planted, [{ id: "src/facts.ts::unread", why: { kind: "no_surface_asks", where: "a page could render it and none does, which is the whole register" } }], found)
            .length === 0
        );
      },
    );
  },

  "src/quality/unrun.ts": (root) => {
    // W333's comparison, driven in a constructed tree so the answer is not this tree's two. One
    // module a test imports and one nothing imports: only the second may be reported, and a
    // declaration for it must silence the register.
    void root;
    return withRoot(
      {
        "src/orphan.ts": "export const orphan = 1;\n",
        "src/seen.ts": "export const seen = 2;\n",
        "src/seen.test.ts": 'import { seen } from "./seen";\nit("t", () => { expect(seen).toBe(2); });\n',
      },
      (planted) => {
        const found = unreachedByUnitSuite(planted);
        return found.length === 1 && found[0] === "src/orphan.ts";
      },
    );
  },

  "src/quality/self-ending.ts": (root) => {
    // W330's comparison, driven in both directions against a register of exactly one wait. The
    // planted module spells one and no register holds it, so `unregistered` must fire; declaring
    // the module must silence it; and a register naming a module the tree does not hold must fire
    // the other arm. Driven rather than described, because a diff that only ever returns two empty
    // lists is indistinguishable from one that reads nothing.
    void root;
    return withRoot(
      {
        "src/planted/w289-wait.ts":
          'export const x = { disposition: { kind: "deferred", why: "y", by: "W1" } };\n',
      },
      (planted) => {
        const none = endingDiff(planted, [], {});
        const declared = endingDiff(
          planted,
          [
            {
              unit: "W330",
              module: "src/planted/w289-wait.ts",
              register: "x",
              entries: () => [],
              rechecked: { kind: "ended_here" },
            },
          ],
          {},
        );
        const gone = endingDiff(
          planted,
          [
            {
              unit: "W330",
              module: "src/planted/w289-absent.ts",
              register: "x",
              entries: () => [],
              rechecked: { kind: "ended_here" },
            },
          ],
          {},
        );
        return (
          none.unregistered.includes("src/planted/w289-wait.ts") &&
          declared.unregistered.length === 0 &&
          gone.stale.includes("src/planted/w289-absent.ts")
        );
      },
    );
  },

  "src/quality/prose-numbers.ts": (root) => {
    // W314's comparison, handed a claim the register does not classify. The planted module states
    // one in its header and the declared list is empty, so the arm that must fire is the one that
    // says a number went past unread.
    void root;
    return withRoot(
      { "src/planted/w289-prose.ts": "// W1: four registers walk this tree.\nexport const x = 1;\n" },
      (planted) =>
        claimDefects(planted, []).some((d) => d.what.includes("nobody classified")) &&
        claimDefects(planted, [
          { module: "src/planted/w289-prose.ts", text: "four registers", resolution: { kind: "at_the_unit" } },
        ]).length === 0,
    );
  },

  "src/quality/declaration-tax.ts": (root) => {
    // Both arms of W300's measurement, each given the input it exists to refuse: an unplanted tree
    // must demand nothing, and a module path the tree does not hold must have no naming sites.
    const quiet = demandingRegisters(root, "src/planted/w289-never-planted.ts").length === 0;
    const unnamed = namingSites(root, fixtureToken("absent-module-path-w289")).length === 0;
    return quiet && unnamed;
  },

  "src/quality/pins.ts": (root) => pinDiff(root, []).undeclared.length > 0,

  "src/quality/derivable-lists.ts": (root) => {
    // W372's comparison, handed a row citing a callable the module does not export, one citing a
    // test file that does not name the register, and one that resolves. The rows are constructed
    // rather than planted on disk: what a row holds is a CITATION, so what this comparison has to
    // reject is a table.
    const row = (checker: Checker): ListedRegister => ({
      id: "src/quality/bounds.ts::STATED_BOUNDS",
      membership: { kind: "derived", by: checker },
    });
    const noCallable = checkerDefects(root, [
      row({ kind: "callable", name: "src/quality/bounds.ts::w289Missing" }),
    ]);
    const wrongFile = checkerDefects(root, [
      row({ kind: "welded", file: "src/quality/pins.test.ts" }),
    ]);
    const clean = checkerDefects(root, [
      row({ kind: "callable", name: "src/quality/bounds.ts::unresolvedBounds" }),
    ]);
    return noCallable.length === 1 && wrongFile.length === 1 && clean.length === 0;
  },

  "src/quality/exemption-reach.ts": (root) => {
    // W368's comparison, handed a row whose probe never applied, one declaring `exact` over an
    // exemption that silences the sibling too, and one whose reading matches. The rows are
    // constructed rather than planted on disk: a reach row holds a FUNCTION, so what this
    // comparison has to reject is a table rather than a file.
    const row = (name: string, reach: Exemption["reach"]): Exemption => ({
      module: `src/planted/w289-${name}.ts`,
      map: "PLANTED",
      detector: "src/planted/w289.ts::check",
      key: "a planted key",
      subject: "a planted subject",
      reach,
    });
    const noControl = reachDefects(root, [
      row("nocontrol", { kind: "exact", probe: () => ({ named: false, sibling: false }) }),
    ]);
    const tooWide = reachDefects(root, [
      row("toowide", { kind: "exact", probe: () => ({ named: true, sibling: true }) }),
    ]);
    const clean = reachDefects(root, [
      row("clean", { kind: "exact", probe: () => ({ named: true, sibling: false }) }),
    ]);
    return noControl.length === 1 && tooWide.length === 1 && clean.length === 0;
  },

  "src/quality/flattering-numbers.ts": (root) => {
    // W354's comparison, handed a row whose declaration its derivation contradicts and one whose
    // blinding moves nothing. The rows are constructed rather than planted on disk: what a figure
    // row holds is a pair of FUNCTIONS, so the input this comparison must reject is a table.
    const row = (name: string, honest: number, blinded: number, direction: Figure["direction"]): Figure => ({
      name,
      what: "a planted figure",
      direction,
      why: "a planted row",
      probe: { honest: () => honest, blinded: () => blinded },
    });
    const wrongWay = figureDefects(root, [row("src/planted/w289-fig.ts::wrong", 9, 3, "high")], [
      "src/planted/w289-fig.ts::wrong",
    ]);
    const unmoved = figureDefects(root, [row("src/planted/w289-fig.ts::still", 9, 9, "low")], [
      "src/planted/w289-fig.ts::still",
    ]);
    const clean = figureDefects(root, [row("src/planted/w289-fig.ts::fine", 9, 3, "low")], [
      "src/planted/w289-fig.ts::fine",
    ]);
    return wrongWay.length === 1 && unmoved.length === 1 && clean.length === 0;
  },

  "src/quality/shared-excuses.ts": (root) => {
    // W356's comparison, handed a row whose sentence the tree does not share, one that nothing can
    // contradict and says nothing about what would settle it, and one the tree contradicts today.
    // The rows are constructed rather than planted on disk: an excuse row holds a FUNCTION, so what
    // this comparison has to reject is a table rather than a file. Each variant goes in BESIDE the
    // real rows, because the register's first arm reports every shared sentence the table handed to
    // it does not read — pass the planted row alone and all of them come back, which is a different
    // defect answering for the one being driven.
    const beside = (over: Partial<Excuse>): readonly Excuse[] => [
      ...excuses().filter((excuse) => excuse.text !== NOT_CALLABLE),
      {
        name: "w289-planted",
        text: NOT_CALLABLE,
        claim: "a planted claim",
        falsifier: () => [],
        why: "a planted row",
        ...over,
      },
    ];
    const clean = excuseDefects(root, beside({}));
    const unshared = excuseDefects(root, beside({ text: "a planted sentence nothing in this tree gives" }));
    const contradicted = excuseDefects(root, beside({ falsifier: () => ["src/planted/w289.ts"] }));
    const unsettled = excuseDefects(root, beside({ falsifier: null }));
    return (
      clean.length === 0 &&
      unshared.length === 2 &&
      contradicted.length === 1 &&
      unsettled.length === 1
    );
  },

  "src/quality/superset.ts": (root) => {
    // W353's comparison, handed a selector that widens and one that refuses where it should not.
    // The rows are constructed rather than planted on disk: what a selector row holds is a pair of
    // FUNCTIONS, so the input this comparison must reject is a table and not a file.
    const row = (name: string, honest: number, degenerate: number, expected: Widening): Selector => ({
      name,
      what: "a planted population",
      honest: () => honest,
      degenerate: () => degenerate,
      expected,
      why: "a planted row",
    });
    const widens = supersetDefects(root, [row("src/planted/w289-wide.ts::wide", 3, 9, "narrows")]);
    const quiet = supersetDefects(root, [row("src/planted/w289-quiet.ts::quiet", 3, 0, "refuses")]);
    const clean = supersetDefects(root, [row("src/planted/w289-fine.ts::fine", 3, 1, "narrows")]);
    return widens.length === 1 && quiet.length === 1 && clean.length === 0;
  },

  "src/quality/latent-y5.ts": (root) => {
    void root;
    const dead = deadAnchors([
      {
        id: "W289-PROBE",
        claim: "a claim about the tree that is false",
        holds: () => false,
        ifDead: "the probe",
      },
    ]);
    const unanchored = anchorCoverage(LATENT_FINDINGS, []).unanchored;
    return dead.length > 0 && unanchored.length > 0;
  },

  "src/quality/latent-findings.ts": (root) => {
    void root;
    return (
      fired([
        {
          id: "W289-PROBE",
          what: "a probe",
          recordedBy: "W289",
          triggerStatement: "always",
          trigger: () => true,
          status: "open",
        },
      ]).length > 0
    );
  },

  "src/quality/refusal-branches.ts": (root) => {
    void root;
    return (
      driveBranches([
        {
          module: "src/w289-probe.ts",
          fn: "probeViolations",
          branch: "never_fires",
          reach: { kind: "driven", drive: () => false },
        },
      ]).didNotFire.length > 0
    );
  },

  "src/quality/horizon-directions.ts": (root) => {
    // Both stale directions off the real horizon: an answer kept for a token the document does not
    // name, and a `not_a_check` for one that resolves to a module. The arriving direction is driven
    // in the module's own suite against a token added to the derived population.
    const tokens = horizonTokens(root);
    const gone = horizonDefects(root, [{ token: "vanished", standing: { kind: "not_a_check", why: "x" } }], []);
    const wrong = horizonDefects(
      root,
      [{ token: "page-reach.ts", standing: { kind: "not_a_check", why: "x" } }],
      tokens.filter((t) => t.token === "page-reach.ts"),
    );
    return gone.length > 0 && wrong.length > 0;
  },

  "src/quality/defaulted-registers.ts": (root) => {
    // Both stale directions off one record: files the tree disagrees with, and a record for a
    // parameter the tree does not hold. The arriving direction — a defaulted register nothing
    // supplies — is driven on a planted tree in the module's own suite, where such a module can
    // be made to exist.
    const params = defaultedParameters(root);
    const first = DRIVEN_AT_W355[0]!;
    const drifted = defaultDefects(root, [{ parameter: first.parameter, drivenBy: ["src/nowhere.ts"] }], params);
    const gone = defaultDefects(root, [{ parameter: "src/gone.ts::gone::2", drivenBy: ["src/x.ts"] }], []);
    return drifted.length > 0 && gone.length > 0;
  },

  "src/console/zero-meaning.ts": (root) => {
    // Both stale directions off one register: a classification for a count nothing renders, and a
    // count rendered with nothing classifying it. The arriving direction is driven on a planted
    // page in the module's own suite, where a console page can be made to exist.
    const orphan = zeroDefects(root, ZERO_CLAIMS, []);
    const unclassified = zeroDefects(root, [], [{ route: "/console/w289", expression: "rows.length" }]);
    return orphan.length > 0 && unclassified.length > 0;
  },

  "src/quality/spec-stores.ts": (root) => {
    // Both stale directions off one register: an argument for a spec that already resets the store,
    // and an argument for a spec the suite does not hold. The arriving direction is driven on a
    // planted tree in the module's own suite, where a store can be made to exist.
    const closed = residueDefects(root, [{ spec: "e2e/ops.spec.ts", store: "src/ops/store.ts", why: "x" }], [
      "e2e/ops.spec.ts",
    ]);
    const gone = residueDefects(root, [{ spec: "e2e/gone.spec.ts", store: "src/ops/store.ts", why: "x" }], []);
    return closed.length > 0 && gone.length > 0;
  },

  "src/quality/spec-premises.ts": (root) => {
    // Both directions off ONE input, because the register's two arms fail opposite ways: an
    // arriving spec nothing tracks is a gap, and a tracked spec that has stopped staging is a row
    // describing a file that moved. A drive exercising only the first would leave the arm that
    // reads as coverage undriven.
    const staged = stagedSpecs(root);
    const arriving = premiseDefects(root, PREMISES_AT_W358, [...staged, "e2e/w289-probe.spec.ts"]);
    const departed = premiseDefects(root, PREMISES_AT_W358, staged.slice(1));
    return arriving.length > 0 && departed.length > 0;
  },

  "src/quality/tautology-sweep.ts": (root) => {
    // Its declared side is `ACCEPTED_TAUTOLOGIES`, a module constant, so the input comes from the
    // other end: a test file carrying a tautology that no acceptance covers.
    void root;
    return withRoot(
      {
        "src/w289-probe/vacuous.test.ts": 'it("a probe", () => {\n  expect(true).toBe(true);\n});\n',
      },
      (planted) => unacceptedTautologies(planted).length > 0,
    );
  },
};

/** Every census entry whose assertion this unit claims is driven, by file. */
export function drivenRegisters(): string[] {
  return TREE_DERIVED_REGISTERS.filter((r) => r.assertion.kind === "driven_here")
    .map((r) => r.file)
    .sort();
}

/**
 * Resolve a `driven_by_branch` citation to W291's branch, or say why it does not resolve.
 *
 * RESOLVED, NOT RECORDED. A citation that names a branch W291 does not have, or names one W291
 * itself lists as unreachable, is worth nothing and says so here rather than reading as coverage.
 */
export function resolveBranch(
  id: string,
  branches: readonly RefusalBranch[] = REFUSAL_BRANCHES,
): { drive: () => boolean } | string {
  const branch = branches.find((b) => `${b.module}::${b.fn}::${b.branch}` === id);
  if (!branch) return `${id}: cited, and W291 has no such branch`;
  if (branch.reach.kind !== "driven") return `${id}: cited, and W291 lists it as unreachable`;
  return { drive: branch.reach.drive };
}

/**
 * Census entries allowed to assert nothing of their own, and why each is one.
 *
 * The escape hatch, closed by enumeration. Three are provers — they plant files in front of other
 * registers' walks — and one is the shared walking itself, which holds no declared list to compare
 * anything against. A fifth entry here is a decision somebody writes down.
 *
 * W341 ADDED THE THIRD PROVER, and it is the one that proves the shared walking: `filesUnder` was
 * private until W341 exported it, and the file that points it at a fixture-extension file and at a
 * skipped directory asserts nothing else.
 */
export const ASSERTS_NOTHING: readonly string[] = [
  "src/quality/hardening-q26.test.ts",
  "src/quality/page-suite.test.ts",
  "src/quality/private-copies.test.ts",
  "src/quality/register-census.test.ts",
  "src/quality/tree-walks.ts",
];

/**
 * What a green run of this register does not prove.
 *
 * One assertion per register, which is the gate's word and its limit: a register with four arms
 * has one of them driven here, and the other three are W291's question where the register is a
 * violation reporter and nobody's question where it is not.
 */
export const DRIVE_BOUND =
  "One assertion per register, driven once. That is the gate's demand and it is not the same as 'this register works': a comparison can reject the input this drive gives it and still miss a different one, and a register with four arms has three that nothing here touches. What a clean run means is narrower and worth saying plainly — every register in the census names a claim and the mutation that breaks it, some of those mutations have been executed and did break it, and the rest cannot be executed at all until the comparison moves out of the test file. THE UNEXECUTABLE ONES ARE THE FINDING, not the driven ones, and they are the majority. (W297 removed the totals this sentence carried. It said thirteen executed while seventeen were, because four registers arrived after it was written — the same defect W288 found in `FIXTURE_BOUND`, in a sentence about how narrow a claim should be. The counts live in the census, where the suite reads them.)";

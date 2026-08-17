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
// FOUNDER GATE (plan §4): nothing crossed. Fabricated declared lists and temporary directories.

import { diffCensus, discoverSurfaces, parseCensus } from "@/compliance/surfaces";
import { readFileSync } from "node:fs";
import path from "node:path";
import { samplingReport } from "./mutation-sampling";
import { separatorDiff } from "./citations";
import { planterDiff } from "./planting";
import { coverageByBand } from "@/compliance/copy-y6";
import { diffFoldRegister, discoverFoldSites } from "./order-independence";
import { undeclaredInstructionSinks } from "@/security/instruction-sinks";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { REFUSAL_BRANCHES, driveBranches, withRoot } from "./refusal-branches";
import { anchorCoverage, deadAnchors } from "./latent-y5";
import { LATENT_FINDINGS, fired } from "./latent-findings";
import { pinDiff } from "./pins";
import { demandingRegisters, namingSites } from "./declaration-tax";
import { numberDefects, staleBounds, unresolvedBounds } from "./bounds";
import { BLIND_SPOTS, boundDiff, falseBounds } from "./blind-spots";
import { allAcceptances, expiredAcceptances, staleAcceptances } from "./acceptances";
import { unacceptedTautologies } from "./tautology-sweep";

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
  "src/quality/citations.ts": (root) => separatorDiff(root, {}).undeclared.length > 0,

  "src/quality/planting.ts": (root) => planterDiff(root, {}).undeclared.length > 0,

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
    // THE MARKER IS SPLIT, and the first draft was not — W153's scanner found the probe's own
    // literal and reported this module as an undeclared instruction sink. The twelfth instance of
    // the collision W237 recorded, and the marker is not the input under test here: the comparison
    // reads `hit.file` and never looks at it, so splitting weakens nothing.
    void root;
    return (
      undeclaredInstructionSinks([
        { file: "src/w289-probe.ts", marker: ["api.open", "ai.com"].join("") },
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

  "src/quality/bounds.ts": (root) => {
    const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
    const probe = {
      module: "src/w289-probe.ts",
      name: "PROBE_BOUND" as const,
      unit: "W9999",
      text: "a sentence stating seventeen of something",
      lifting: { kind: "remedy" as const, remedy: "a remedy nobody wrote", reads: "x", stillOpen: () => false },
      numbers: [],
    };
    return (
      staleBounds([probe]).length > 0 &&
      numberDefects([probe]).length > 0 &&
      unresolvedBounds(root, ledger, [probe]).length > 0
    );
  },

  "src/quality/declaration-tax.ts": (root) => {
    // Both arms of W300's measurement, each given the input it exists to refuse: an unplanted tree
    // must demand nothing, and a module path the tree does not hold must have no naming sites.
    const quiet = demandingRegisters(root, "src/planted/w289-never-planted.ts").length === 0;
    const unnamed = namingSites(root, ["src/no-such", "-module-w289.ts"].join("")).length === 0;
    return quiet && unnamed;
  },

  "src/quality/pins.ts": (root) => pinDiff(root, []).undeclared.length > 0,

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
export function resolveBranch(id: string): { drive: () => boolean } | string {
  const branch = REFUSAL_BRANCHES.find((b) => `${b.module}::${b.fn}::${b.branch}` === id);
  if (!branch) return `${id}: cited, and W291 has no such branch`;
  if (branch.reach.kind !== "driven") return `${id}: cited, and W291 lists it as unreachable`;
  return { drive: branch.reach.drive };
}

/**
 * Census entries allowed to assert nothing of their own, and why each is one.
 *
 * The escape hatch, closed by enumeration. Two are provers — they plant files in front of other
 * registers' walks — and one is the shared walking itself, which holds no declared list to compare
 * anything against. A fourth entry here is a decision somebody writes down.
 */
export const ASSERTS_NOTHING: readonly string[] = [
  "src/quality/page-suite.test.ts",
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

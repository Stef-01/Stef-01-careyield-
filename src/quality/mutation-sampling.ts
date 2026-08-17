// W296: mutation sampling — the code changed under a test, and its suite must notice.
//
// THE ROW ASKS FOR SOMETHING THAT CANNOT HAPPEN, and finding that out is the first half of the
// unit. Its words are *"a sampled set of assertions removed one at a time in a copied tree, each
// required to turn its own suite red"*. **Removing a passing assertion from a passing suite leaves
// it passing.** That is not a fact about this tree, it is arithmetic: the assertion did not fail
// before it was deleted, so deleting it removes no failure.
//
// It was built that way first rather than argued away. Forty-seven assertions, one per file, each
// deleted in a copied tree with its own suite re-run: THIRTY-NINE stayed green. The eight that went
// red are worse than the thirty-nine, because none of them went red for the reason the row wanted —
// they went red because the deleted expression had a side effect a later line depended on, or
// because splicing it out left syntax the transpiler rejected. A check whose positives are all
// accidents is a check that would have reported "39 assertions in this tree are worthless" and been
// wrong about every one of them.
//
// WHAT THE ROW WAS REACHING FOR IS THE OPPOSITE DIRECTION, and this tree already does it by hand:
// every ledger row for the last thirty units ends "mutation-checked, five breaks", and every one of
// those breaks CHANGED THE CODE and watched the suite. That is mutation sampling as the term is
// used everywhere else, and it is the property underneath the row's sentence: not *is this
// assertion removable*, but **IS THERE A CHANGE TO THE CODE THIS SUITE WOULD FAIL TO NOTICE**.
//
// So a mutant is a change to a MODULE and the suite that must catch it is that module's own. Five
// operators, each a single character-level edit that flips a decision the code makes; a mutant that
// its sibling suite does not turn red is a SURVIVOR, reported by name — the gate's own words, kept.
//
// A SURVIVOR IS A QUESTION, NOT A VERDICT. It can be equivalent (the flip changes no observable
// behaviour), unreached (no test exercises the line), or a real hole. The three are told apart by
// reading, so each accepted survivor says which it is.
//
// WHY A STRIDE AND NOT A CHOSEN SET. A hand-picked set of mutants is a set chosen by the person who
// believes the tests hold, which is the shape this tree keeps finding behind a green suite. The
// sample walks every mutation site in a fixed order and takes every Nth, so what gets tested is
// decided by arithmetic. `SAMPLE_STRIDE` is the whole of the selection policy.
//
// THE BASELINE IS CHECKED BEFORE EVERY MUTATION. A suite already red in the copy would make every
// mutant in its module look caught, and the register would report perfect coverage over a broken
// fixture. A module whose baseline is not green is skipped AND REPORTED.
//
// WHAT THIS CANNOT SEE:
//
//   ONE OPERATOR SET. Five textual operators is not the mutation space; a module can be riddled
//   with holes none of these five reaches. The register measures what these five found.
//
//   THE SIBLING SUITE ONLY. A mutant is run against its module's own `*.test.ts`. A change another
//   file would have caught reads as a survivor here. Deliberate — a module relying on someone
//   else's test is not obviously fine — but it makes a survivor a question.
//
//   MODULES WITH NO SIBLING SUITE ARE NOT SAMPLED AT ALL, and that is the second finding rather
//   than a gap: they are named in `UNTESTED_AT_W296`, because "no mutant survived" over a module
//   nothing could have tested is the vacuity this whole quarter has been about.
//
//   THE SAMPLE IS NOT THE SUITE. Nothing here licenses "this tree's tests are load bearing". It
//   licenses "of the mutants arithmetic picked, these are the ones nothing noticed".
//
// FOUNDER GATE (plan §4): nothing crossed. Mutations are written into a temporary copy of the tree
// that is deleted when the run ends; the repository is never written to.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { sourceModules } from "./tree-walks";
import { blankLiterals } from "./tautology-sweep";

/** A single character-level edit that flips a decision the code makes. */
export interface Operator {
  id: string;
  /** Matched on code with comments subtracted and string CONTENTS blanked. */
  token: string;
  becomes: string;
  why: string;
}

/**
 * The operator set, and it is short on purpose.
 *
 * Each one inverts a branch rather than perturbing a value, because a suite that misses an inverted
 * branch has a hole a reader can act on, while one that misses `n + 1` may simply not care about
 * that number. Order matters: the longer tokens are tried first, so `!==` is never read as `=`.
 */
export const OPERATORS: readonly Operator[] = [
  { id: "eq-to-neq", token: "===", becomes: "!==", why: "An equality test taken the other way. If no test notices, nothing distinguishes the two branches." },
  { id: "neq-to-eq", token: "!==", becomes: "===", why: "The same flip from the other side, so a module written with negative comparisons is sampled as thoroughly as one written with positive ones." },
  { id: "and-to-or", token: "&&", becomes: "||", why: "A conjunction widened to a disjunction: every guard that required both conditions now needs one." },
  { id: "gte-to-gt", token: ">=", becomes: ">", why: "The boundary case of a threshold — the off-by-one a register's floor exists to hold." },
  { id: "lte-to-lt", token: "<=", becomes: "<", why: "The same boundary from the other side, so a module written with ascending comparisons is sampled as thoroughly as one written with descending ones." },
];

export interface Mutant {
  /** The module changed. */
  module: string;
  /** The suite that must notice — the module's own `*.test.ts`. */
  suite: string;
  operator: string;
  line: number;
  /** Offset into the COMMENT-STRIPPED text, which is what the mutation is applied to. */
  start: number;
}

/** `module :: operator :: line-of-code`. The code, so a row survives a line moving. */
export function mutantId(mutant: Mutant, source: string): string {
  const code = stripComments(source);
  const lineText = code.split("\n")[mutant.line - 1]?.trim() ?? "";
  return `${mutant.module} :: ${mutant.operator} :: ${lineText}`;
}

/** The sibling suite for a module, or null when it has none. */
export function siblingSuite(root: string, module: string): string | null {
  const suite = module.replace(/\.ts$/, ".test.ts");
  return existsSync(path.join(root, suite)) ? suite : null;
}

/**
 * Every mutation site in one module.
 *
 * Comments are subtracted and string contents blanked before matching, for the reason this tree
 * keeps rediscovering: a module explaining `===` in prose is not a module comparing with it.
 */
export function mutantsIn(module: string, source: string, suite: string): Mutant[] {
  const code = stripComments(source);
  const scan = blankLiterals(code);
  const out: Mutant[] = [];
  const taken = new Set<number>();
  for (const op of OPERATORS) {
    let from = 0;
    for (;;) {
      const at = scan.indexOf(op.token, from);
      if (at < 0) break;
      from = at + op.token.length;
      // A longer operator already claimed these characters — `!==` contains no `==` this cares
      // about, but `>=` sits inside `>=` only once and the guard keeps the sample honest anyway.
      if ([...taken].some((t) => Math.abs(t - at) < 3)) continue;
      taken.add(at);
      out.push({
        module,
        suite,
        operator: op.id,
        line: code.slice(0, at).split("\n").length,
        start: at,
      });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Every mutation site in every module that HAS a sibling suite, in a stable order.
 *
 * Modules with no sibling suite are not sampled and are not silently dropped — `untestedModules`
 * names them, because a module nothing could have tested contributes no survivors and would
 * otherwise read as covered.
 */
export function allMutants(root: string): Mutant[] {
  return sourceModules(root)
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .sort()
    .flatMap((module) => {
      const suite = siblingSuite(root, module);
      return suite ? mutantsIn(module, readFileSync(path.join(root, module), "utf8"), suite) : [];
    });
}

/** Modules with a mutation site and no suite of their own to notice it. */
export function untestedModules(root: string): string[] {
  return sourceModules(root)
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .filter((module) => {
      if (siblingSuite(root, module)) return false;
      return mutantsIn(module, readFileSync(path.join(root, module), "utf8"), "").length > 0;
    })
    .sort();
}

/**
 * The selection policy, and all of it: one site in `SAMPLE_RATE` picked by hashing its own name.
 *
 * A STRIDE WAS THE FIRST DESIGN AND IT RE-ROLLED ITSELF. Taking every Nth site over a sorted list
 * means inserting one module shifts every index after it, so the sample changes wholesale whenever
 * ordinary work adds a file — and the survivor rows, which are the unit's output, churn with it.
 * That is the pin-a-value-ordinary-work-moves shape W290 spent a unit on, arriving one level up: in
 * the SAMPLE rather than in a constant. Caught by adding this very module and watching the sample
 * change under it.
 *
 * Hashing each site's own id fixes it: whether a site is sampled depends on that site and nothing
 * else, so a new module contributes its own sites and moves none of the existing ones. Same tree,
 * same sample; a bigger tree, a superset.
 */
export const SAMPLE_RATE = 37;

/** FNV-1a. Small, dependency-free and obviously deterministic — the three properties that matter. */
export function siteHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function sampleMutants(
  mutants: readonly Mutant[],
  source: (module: string) => string,
  rate: number = SAMPLE_RATE,
): Mutant[] {
  return mutants.filter((m) => siteHash(mutantId(m, source(m.module))) % rate === 0);
}

/** The module with one operator applied. Comments are already gone; offsets are into that text. */
export function applyMutant(source: string, mutant: Mutant): string {
  const op = OPERATORS.find((o) => o.id === mutant.operator);
  if (!op) throw new Error(`no such operator: ${mutant.operator}`);
  const code = stripComments(source);
  return `${code.slice(0, mutant.start)}${op.becomes}${code.slice(mutant.start + op.token.length)}`;
}

/** Why a mutant its suite did not catch is allowed to stand. */
export type SurvivorReason =
  /** The flip changes no observable behaviour. Not a hole; there is nothing to catch. */
  | { kind: "equivalent"; why: string }
  /** No test reaches the line at all — a coverage gap rather than an assertion gap. */
  | { kind: "unreached"; why: string }
  /**
   * The module's OWN suite misses it and another file catches it.
   *
   * Added after the first run reported eight survivors and reading them showed five were of this
   * kind. Calling those "uncaught" would have been false in the most damaging direction — a
   * register claiming five holes that are not holes teaches its readers to discount it.
   */
  | { kind: "caught_elsewhere"; caughtBy: string; why: string }
  /** Nothing in the tree notices. The finding, with what would catch it. */
  | { kind: "uncaught"; remedy: string };

export interface Survivor {
  id: string;
  reason: SurvivorReason;
}

/**
 * Sampled mutants their own suite did not turn red, BY NAME.
 *
 * The gate's words are "survivors are reported by name rather than counted", and W290's reason
 * applies underneath: a count of survivors is a number somebody edits when the sample moves, and
 * the edit looks like maintenance. A name says which change went unnoticed, so the next reader can
 * disagree with the reason attached to it.
 */
export const SURVIVORS_AT_W296: readonly Survivor[] = [
  {
    id: "src/capability/experience.ts :: lte-to-lt :: return date >= window.fromIso && date <= window.toIso;",
    reason: {
      kind: "uncaught",
      remedy:
        "Narrowing `<=` to `<` drops every appointment falling ON the window's last day, and one file imports this module — its own — so nothing anywhere notices. The fixtures put appointments inside the window rather than on its edges. REMEDY: a case-mix window whose `toIso` is exactly one fixture appointment's date, asserted to include it; the same for `fromIso` on the other side.",
    },
  },
  {
    id: "src/pathways/simulation.ts :: eq-to-neq :: if (rows.length === 0) return [];",
    reason: {
      kind: "uncaught",
      remedy:
        "Inverting the empty guard makes `countTable` render a heading and no rows for a populated table, and emit a table for an empty one. Nothing catches it, because every simulation fixture has rows and no test renders a report with an empty count table. REMEDY: render a simulation whose count table is empty and assert the section is absent, which is the claim the guard makes.",
    },
  },
  {
    id: "src/synthetic/generate.ts :: neq-to-eq :: futureBookingRate: rate((p) => p.futureBookingAt !== null),",
    reason: {
      kind: "uncaught",
      remedy:
        "The reported rate becomes its own complement, and TEN files import this generator without one of them checking it. Synthetic-cohort statistics are the input to every sim in the tree, so a rate reported inside-out is a fixture that silently stops matching the scenario it names. REMEDY: generate a cohort and assert `futureBookingRate` equals the share of patients whose `futureBookingAt` is set, computed from the returned patients rather than from the same expression.",
    },
  },
  {
    id: "src/console/store.ts :: eq-to-neq :: if (inputs.length === 0) errors.clinicians = \"Add at least one clinician.\";",
    reason: {
      kind: "caught_elsewhere",
      caughtBy: "src/console/setup.test.ts, src/tenancy/two-tenant.test.ts",
      why: "`validateClinicians` is exercised where the setup wizard is tested rather than in the store's own suite. Twenty-two files import this module; the empty-roster refusal is checked in two of them.",
    },
  },
  {
    id: "src/console/store.ts :: neq-to-eq :: if (allowlist !== \"all\") {",
    reason: {
      kind: "caught_elsewhere",
      caughtBy: "src/console/setup.test.ts, src/tenancy/two-tenant.test.ts",
      why: "The same module and the same reason: the allowlist branch belongs to the setup flow, and the flow's tests hold it. The store's own suite covers storage rather than the rules layered over it.",
    },
  },
  {
    id: "src/interest/store.ts :: gte-to-gt :: return Number.isNaN(at) || at >= cutoff;",
    reason: {
      kind: "caught_elsewhere",
      caughtBy: "src/compliance/cdss-boundary.test.ts",
      why: "The retention cutoff's boundary is held by the copy-surface suite rather than by the store's own — an odd place for it to live, and worth knowing, but the boundary IS checked.",
    },
  },
  {
    id: "src/interop/ereferral.ts :: eq-to-neq :: else if (value && typeof value === \"object\") Object.values(value).forEach(walk);",
    reason: {
      kind: "caught_elsewhere",
      caughtBy: "src/compliance/cdss-boundary.test.ts",
      why: "The recursive walk over a referral payload is covered by the compliance suite, which reads every string the payload can produce and therefore notices when the walk stops descending.",
    },
  },
  {
    id: "src/sim/harness.ts :: neq-to-eq :: a.patientId !== null &&",
    reason: {
      kind: "caught_elsewhere",
      caughtBy: "src/pilot/casestudy.test.ts, src/report/weekly.test.ts",
      why: "The harness has twenty-three importers, and the filter that excludes unattributed appointments is held by the REPORTS built on top of it rather than by the harness's own suite — the case study and the weekly report both go red when it is flipped. Worth knowing where the check lives, but the check exists.",
    },
  },
];

/**
 * Modules with a mutation site and no suite of their own, BY NAME.
 *
 * The second finding, and it is not a gap in the sample — it is what the sample cannot reach. A
 * module with no sibling test contributes no mutants, so it can never produce a survivor, so a
 * clean survivor list says nothing whatever about it. Naming them is the difference between "no
 * mutant survived" and "no mutant was possible", which is this quarter's whole subject.
 */
export const UNTESTED_AT_W296: readonly string[] = [
  "src/capability/store.ts",
  "src/collateral/deck.ts",
  "src/collateral/figures.ts",
  "src/collateral/one-pager.ts",
  "src/complaints/store.ts",
  "src/console/clinician-identity.ts",
  "src/engine/backfill.ts",
  "src/lib/demo-guard.ts",
  "src/lib/rate-limit.ts",
  "src/messaging/adapter.ts",
  "src/pms/adapter.ts",
  "src/quality/tree-walks.ts",
  "src/synthetic/recalls.ts",
  "src/synthetic/referrals.ts",
  "src/synthetic/rng.ts",
  "src/tenancy/tenancy.ts",
];

export interface SamplingReport {
  /** A mutant nothing caught and nothing here explains. */
  unexplained: string[];
  /** A declared survivor the run caught after all — the register describing a test since improved. */
  stale: string[];
  /** Suites skipped because their baseline was red. Reported, never silently dropped. */
  unmeasurable: string[];
}

/**
 * Both directions over one run's results.
 *
 * Takes the observed survivors as an argument rather than running anything: the runner spawns
 * processes and belongs in the test, and a reporter that cannot be called with a constructed input
 * cannot be shown firing. W291's rule.
 */
export function samplingReport(
  observed: readonly string[],
  skipped: readonly string[],
  declared: readonly Survivor[] = SURVIVORS_AT_W296,
): SamplingReport {
  const declaredIds = new Set(declared.map((s) => s.id));
  const seen = new Set(observed);
  return {
    unexplained: [...seen].filter((id) => !declaredIds.has(id)).sort(),
    stale: [...declaredIds].filter((id) => !seen.has(id)).sort(),
    unmeasurable: [...skipped].sort(),
  };
}

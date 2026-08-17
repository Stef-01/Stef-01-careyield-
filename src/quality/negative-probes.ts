// W292: every proved walk in W267's census, shown a file it must REFUSE.
//
// W267 found that almost none of this tree's registers had ever been shown a file arriving, and
// W282 fixed that in a batch: twenty-four of the forty-one now carry a `mutated_tree` proof —
// a file planted in a copied tree, and the detector required to report it.
//
// EVERY ONE OF THOSE PROOFS IS SATISFIED BY A DETECTOR THAT REPORTS EVERYTHING. That is the whole
// of this unit. `return everything` passes "the walk saw the new file" perfectly, forever, for all
// twenty-four — and the register it feeds then reports the entire tree as undeclared, or, far more
// likely, is quietly narrowed by whoever has to make the suite green again until it agrees. A walk
// proved only on a positive is proved against the failure mode nobody has, and unproved against
// the one this tree keeps finding.
//
// THE PROOF THAT DISCRIMINATES IS A PAIR. A planted POSITIVE the detector must report, and beside
// it a planted NEGATIVE it must not — where the negative is placed in the same directory, given
// the same shape, and differs only in the one property the detector is supposed to key on. A
// module using `.map(` beside one using `.reduce(`. A `.tsx` helper beside a `page.tsx`. A module
// nothing imports beside one a page imports. Each pair is a question with two answers, and only a
// detector that reads the property gets both right.
//
// WHY THIS IS A SEPARATE REGISTER RATHER THAN A FIELD ON W267's. Two reasons, and the second is the
// honest one. The census entry says what the register derives; whether its detector DISCRIMINATES
// is a fact about the proof rather than about the register, and W267's `mutation` field already
// carries the positive. The second: W289 is extending `TREE_DERIVED_REGISTERS` in another session
// as this is written, and two units rewriting the same twenty-four literals is a rebase argument
// that teaches nobody anything. Keyed by register file, checked against `walkProven()` in both
// directions, so the two cannot drift apart whichever lands first.
//
// SIX WERE ALREADY DISCRIMINATING, and they are recorded as such rather than re-driven. W288's
// sweep plants a real assertion and a non-test file beside its tautology; W291's reporter census
// plants a renderer beside its reporter; W267's own comment-only probe; W290's `DEFAULT_TIMEOUT`;
// W281's three header probes, each of which asserts the other two lists stayed empty; W277's
// one-practice fixture. Each is cited to the `it(...)` that drives it AND to the negative it
// plants, and both halves are resolved against the file — W258's rule, because a citation nobody
// resolved reads as coverage.
//
// TWO ENTRIES HAVE NO DETECTOR TO DISCRIMINATE. `register-census.test.ts` and `page-suite.test.ts`
// are census members because they import the shared rooted walks in order to PLANT files in front
// of them; they derive nothing of their own. That is an exemption, so it is checked rather than
// asserted: the arm requires the census's own words for such an entry — "Nothing of its own" — to
// be present in what it says it derives or checks against. An exemption whose condition is read
// from the thing being exempted cannot be granted by writing it here.
//
// WHAT THIS CANNOT SEE, and it is the same class of bound W267 stated about `glob`. A pair proves
// the detector reads SOME property that separates these two files. It does not prove it reads the
// RIGHT one: a detector keying on the filename `w292-neg-` would pass every pair in this register.
// Nothing here rules that out, and the remedy is not a better negative — it is that the negatives
// are written to differ from their positives only in the property under test, which is a matter of
// authorship rather than of checking. Stated so the next reader does not have to find it.
//
// FOUNDER GATE (plan §4): nothing crossed. This plants files into a temporary copy of the tree and
// reads what detectors say about them.

import { readFileSync } from "node:fs";
import path from "node:path";
import { TREE_DERIVED_REGISTERS, walkProven, type TreeDerivedRegister } from "./register-census";

/** How a proved walk has been shown to REFUSE a file, rather than only to report one. */
export type NegativeCase =
  /**
   * Driven in this unit's own test: the negative is planted beside the positive in a copied tree,
   * and the detector must report the first and refuse the second in one call.
   */
  | { kind: "driven_here"; plants: string; aBroadDetectorWouldReportIt: string }
  /**
   * Already discriminating when this unit was written. `citation` is `file :: it(...) title` and
   * `plants` is a string from the negative itself; BOTH are resolved against the file, because a
   * citation that only names a test proves the test exists rather than that it plants a negative.
   */
  | { kind: "already_driven"; citation: string; plants: string }
  /**
   * The entry derives nothing of its own — it is one of the files that does the planting. Checked
   * against the census's own description rather than granted here; see `EXEMPT_PHRASE`.
   */
  | { kind: "no_detector_of_its_own"; why: string };

export interface NegativeProbe {
  /** The census entry, by the file it names. */
  register: string;
  negative: NegativeCase;
}

/**
 * The phrase a census entry must use about itself for the no-detector exemption to be available.
 *
 * The point of reading it from the census rather than from here: an entry stops being exempt the
 * day somebody gives it a detector and rewrites what it derives, without anybody remembering to
 * come back to this file.
 */
export const EXEMPT_PHRASE = "Nothing of its own";

export const NEGATIVE_PROBES: readonly NegativeProbe[] = [
  {
    register: "src/compliance/copy-y6.ts",
    negative: {
      kind: "driven_here",
      plants: "a module whose header names a unit BELOW the copy-surface floor",
      aBroadDetectorWouldReportIt:
        "The membership rule is `unit >= COPY_SURFACE_FLOOR`, and a detector that read the header without reading the number — or read only that a header is present — would make every module in the tree a member and the floor would silently stop existing.",
    },
  },
  {
    register: "src/compliance/surfaces.ts",
    negative: {
      kind: "driven_here",
      plants: "a `.tsx` file in a new directory under `app/` that is not a route convention file",
      aBroadDetectorWouldReportIt:
        "Routes are read from the App Router's file CONVENTIONS, not from the directory tree; a walk that turned every directory containing a `.tsx` into a route would invent surfaces the app does not serve, and the compliance census would carry them.",
    },
  },
  {
    register: "src/quality/order-independence.ts",
    negative: {
      kind: "driven_here",
      plants: "a module whose only array calls are `.map(` and `.filter(`",
      aBroadDetectorWouldReportIt:
        "A fold is order-DEPENDENT and a map is not, which is the whole distinction W167's register turns on; a scan for chained array methods would report most of this tree and the register would become a list nobody reads.",
    },
  },
  {
    register: "src/security/instruction-sinks.ts",
    negative: {
      kind: "driven_here",
      plants: "a module naming a plain HTTPS URL that is not a model endpoint",
      aBroadDetectorWouldReportIt:
        "W153 exists to find a path by which text could reach a model, and a scan for any URL would report every fetch in the tree — turning a control with an empty allowlist into one with a long one, which is how an allowlist stops being read.",
    },
  },
  {
    register: "src/security/reachability.ts",
    negative: {
      kind: "driven_here",
      plants: "a module under `src/` that no page imports",
      aBroadDetectorWouldReportIt:
        "Reachability is the difference between a module the request path can execute and one that merely exists; a walk that returned every file under `src/` would make W107's package allowance and W201's dormancy proof both trivially satisfied and both meaningless.",
    },
  },
  {
    register: "src/quality/route-coverage.ts",
    negative: {
      kind: "driven_here",
      plants: "the same new route, with a register that declares it",
      aBroadDetectorWouldReportIt:
        "`undeclared` is a difference against the register, so a detector that skipped the lookup would report all twenty-seven served routes as undeclared — and the register's both-directions check would be the thing quietly deleted to make the suite green.",
    },
  },
  {
    register: "src/quality/tree-walks.ts",
    negative: {
      kind: "driven_here",
      plants: "a `.test.ts` file beside the source module, for the walk that excludes tests",
      aBroadDetectorWouldReportIt:
        "`sourceModules` is defined by what it leaves out — four registers built on it ask questions about product code — and a walk that returned every `.ts` would put every test file into the store census, the resetter registry and the header door at once.",
    },
  },
  {
    register: "src/domain/schema-consistency.test.ts",
    negative: {
      kind: "driven_here",
      plants: "a non-`.sql` file in the migrations directory",
      aBroadDetectorWouldReportIt:
        "The schema the domain types answer to is the SQL and nothing else; a walk that joined every file in the directory would put a README's prose into the text the type consistency check greps, and the check would start passing on words.",
    },
  },
  {
    register: "src/lib/source-hygiene.test.ts",
    negative: {
      kind: "driven_here",
      plants: "a file with a binary extension",
      aBroadDetectorWouldReportIt:
        "W116's rule is that these files must be readable AS TEXT, so the walk's extension list is the rule; a walk returning every file would fail the suite on the first image anybody commits, and the fix under pressure is to weaken the rule.",
    },
  },
  {
    register: "src/lib/stores.test.ts",
    negative: {
      kind: "driven_here",
      plants: "a module with a `reset*` function that is NOT exported",
      aBroadDetectorWouldReportIt:
        "W51's registry is the set of doors erasure has to reach, and a private helper is not one; a scan for the word `reset` would put unreachable names into the registry, and the erasure sweep that checks the registry against itself would then be checking a list against a list.",
    },
  },
  {
    register: "src/privacy/record-classes.test.ts",
    negative: {
      kind: "driven_here",
      plants: "a module that mentions `globalThis` without holding a store on it",
      aBroadDetectorWouldReportIt:
        "W106 classifies modules that RETAIN data across requests; a scan for the identifier would classify feature detection as a store, and a record-class register with false members is one whose real members stop being read individually.",
    },
  },
  {
    register: "src/security/page-reach.ts",
    negative: {
      kind: "driven_here",
      plants: "a new route beside the probe that imports no dormant module",
      aBroadDetectorWouldReportIt:
        "`wokenDormant` is W201's dormancy proof — a decision not in use — and a detector that reported every route as waking every dormant module would make the proof unfalsifiable while looking maximally strict.",
    },
  },
  {
    register: "src/quality/latent-y5.ts",
    negative: {
      kind: "driven_here",
      plants: "a `gate-dossier-*` module that is not a test file",
      aBroadDetectorWouldReportIt:
        "DOSSIER-1's anchor asks whether its predicate still has a subject to scan, and the subject is the gate-dossier TESTS; a walk matching the prefix alone would find a subject in a helper module and report the anchor live when it is dead.",
    },
  },
  {
    register: "src/quality/page-suite.ts",
    negative: {
      kind: "driven_here",
      plants: "a `.ts` helper under `e2e/` that is not a spec",
      aBroadDetectorWouldReportIt:
        "The register asks which specs the verify gate RUNS, and Playwright runs `*.spec.ts`; counting helpers as specs would report coverage the gate does not execute, which is the silent exclusion W275 exists to make impossible, inverted.",
    },
  },
  {
    register: "src/quality/latent-findings.ts",
    negative: {
      kind: "driven_here",
      plants: "a module that DOES carry a `// W<n>` header",
      aBroadDetectorWouldReportIt:
        "CENSUS-1's live condition is a door pinned EMPTY, so a detector returning every module would fail the suite on a healthy tree — and a door that is red on a healthy tree is a door somebody removes.",
    },
  },
  {
    register: "src/verticals/assembly.test.ts",
    negative: {
      kind: "driven_here",
      plants: "a `.types.ts` file in the verticals directory",
      aBroadDetectorWouldReportIt:
        "W250's census counts vertical DECLARATIONS, and the excluded shapes — tests, type modules, declared machinery — are the rule rather than housekeeping; a walk returning the directory would report the shared assembly itself as a vertical re-implementing the shared assembly.",
    },
  },
  {
    register: "src/quality/empty-list-sweep.ts",
    negative: {
      kind: "already_driven",
      citation:
        "src/quality/empty-list-sweep.test.ts :: stays quiet when the same assertion has a witness one line above",
      plants: "expect(rows.length).toBeGreaterThan(0);",
    },
  },
  {
    register: "src/quality/acceptances.ts",
    negative: {
      kind: "already_driven",
      citation:
        "src/quality/acceptances.test.ts :: notices a register ARRIVING in a tree that is not this one",
      plants: "src/planted/reader.ts",
    },
  },
  {
    register: "src/quality/bounds.ts",
    negative: {
      kind: "already_driven",
      citation:
        "src/quality/bounds.test.ts :: matches whole words, or `one` is found inside `none`",
      plants: "none of them, often, tension",
    },
  },
  {
    register: "src/quality/blind-spots.ts",
    negative: {
      kind: "already_driven",
      citation:
        "src/quality/blind-spots.test.ts :: reports a probe whose control went unseen, so a dead plant cannot pass as a demonstration",
      plants: "controlSeen: false",
    },
  },
  {
    register: "src/quality/tautology-sweep.ts",
    negative: {
      kind: "already_driven",
      citation: "src/quality/tautology-sweep.test.ts :: finds a planted tautology in a tree that is not this one",
      plants: "src/planted/real.test.ts",
    },
  },
  {
    register: "src/quality/refusal-branches.ts",
    negative: {
      kind: "already_driven",
      citation: "src/quality/refusal-branches.test.ts :: notices a reporter ARRIVING, and a renderer arriving beside it",
      plants: "src/planted/renderer.ts",
    },
  },
  {
    register: "src/quality/register-census.ts",
    negative: {
      kind: "already_driven",
      citation: "src/quality/register-census.test.ts :: does not count a walk that is only named in a comment",
      plants: "w267-probe-comment-only",
    },
  },
  {
    register: "src/quality/pins.ts",
    negative: {
      kind: "already_driven",
      citation: "src/quality/pins.test.ts :: does not report a constant that is not pin-shaped",
      plants: "DEFAULT_TIMEOUT",
    },
  },
  {
    register: "src/quality/unit-headers.ts",
    negative: {
      kind: "already_driven",
      citation: "src/quality/unit-headers.test.ts :: catches a module whose unit is recorded where the census cannot read it",
      plants: "a misplaced unit was reported as no unit",
    },
  },
  {
    register: "src/tenancy/two-tenant.test.ts",
    negative: {
      kind: "already_driven",
      citation: "src/tenancy/two-tenant.test.ts :: reports a single-practice test as single-tenant",
      plants: "one practice read as two",
    },
  },
  {
    register: "src/quality/register-census.test.ts",
    negative: {
      kind: "no_detector_of_its_own",
      why: "It is the file that plants W282's batch in front of the shared rooted walks. Its negatives are the ones those walks are given, which are in this register under the walks' own entries.",
    },
  },
  {
    register: "src/quality/negative-probes.test.ts",
    negative: {
      kind: "no_detector_of_its_own",
      why: "It is this unit's own planting file — it derives nothing, it plants the pairs. Exempting it is the same call `register-census.test.ts` gets, and it is granted on the same evidence: the census's own description of what it derives.",
    },
  },
  {
    register: "src/quality/page-suite.test.ts",
    negative: {
      kind: "no_detector_of_its_own",
      why: "It is `page-suite.ts`'s proving file — it points `pageSpecFiles` at a tree with no `e2e/` at all, which is the extreme negative. The discriminating pair for that walk is under `src/quality/page-suite.ts`.",
    },
  },
];

export interface NegativeDiff {
  /** A walk proved on a positive with no negative case declared. The unit's own subject. */
  unprobed: string[];
  /** A declared negative for a register that is no longer proved by mutation, or is gone. */
  stale: string[];
  /** An exemption the census's own words do not support. */
  unsupportedExemption: string[];
}

/**
 * Both directions, W102's shape, plus the arm that keeps the exemption from being an opt-out.
 *
 * Takes both registers as arguments — W291's rule rather than a preference: a reporter whose arms
 * cannot be reached from outside cannot be shown firing, and this one has three.
 */
export function negativeDiff(
  registers: readonly TreeDerivedRegister[] = TREE_DERIVED_REGISTERS,
  probes: readonly NegativeProbe[] = NEGATIVE_PROBES,
): NegativeDiff {
  const proved = walkProven(registers).map((r) => r.file);
  const provedSet = new Set(proved);
  const byRegister = new Map(probes.map((p) => [p.register, p]));
  const described = new Map(registers.map((r) => [r.file, `${r.derives} ${r.checkedAgainst}`]));

  return {
    unprobed: proved.filter((f) => !byRegister.has(f)).sort(),
    stale: probes.map((p) => p.register).filter((f) => !provedSet.has(f)).sort(),
    unsupportedExemption: probes
      .filter(
        (p) =>
          p.negative.kind === "no_detector_of_its_own" &&
          !(described.get(p.register) ?? "").includes(EXEMPT_PHRASE),
      )
      .map((p) => p.register)
      .sort(),
  };
}

/**
 * Resolve an `already_driven` citation against the file it names.
 *
 * Returns what is missing rather than a boolean, because "the citation is wrong" and "the negative
 * has been deleted from a test that still exists" are different repairs.
 */
export function unresolvedCitations(
  root: string,
  probes: readonly NegativeProbe[] = NEGATIVE_PROBES,
): string[] {
  const out: string[] = [];
  for (const probe of probes) {
    if (probe.negative.kind !== "already_driven") continue;
    const [file, title] = probe.negative.citation.split(" :: ");
    let source: string;
    try {
      source = readFileSync(path.join(root, file ?? ""), "utf8");
    } catch {
      out.push(`${probe.negative.citation} — no such file`);
      continue;
    }
    if (!source.includes(title ?? "")) out.push(`${probe.negative.citation} — no such test`);
    else if (!source.includes(probe.negative.plants)) {
      out.push(`${probe.negative.citation} — the test no longer plants \`${probe.negative.plants}\``);
    }
  }
  return out.sort();
}

/** What one planted pair says about one detector. Both halves, from one call each. */
export interface PairResult {
  reportsPositive: boolean;
  reportsNegative: boolean;
}

/**
 * Does this detector separate the two files, or merely see them?
 *
 * The predicate the whole unit turns on, and it is exported so the test can drive it against a
 * detector that reports EVERYTHING — the gate's own sentence, which is otherwise a claim about
 * code nobody wrote.
 */
export function discriminates(result: PairResult): boolean {
  return result.reportsPositive && !result.reportsNegative;
}

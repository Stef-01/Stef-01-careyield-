// W294: the acceptance registers, re-derived — and the review date nobody was enforcing.
//
// AN ACCEPTANCE IS A RULE SWITCHED OFF FOR ONE STRING. This tree has ten registers of them:
// advice-linter findings accepted on operator copy, on composed copy and on public pages, hardening
// findings accepted after a review, tautologies accepted because the real assertion is a
// `@ts-expect-error`, and dependency advisories accepted in the audit gate. Every one carries a
// `reviewBy` date, because an exception with no expiry is a rule that was quietly deleted.
//
// THE FINDING IS THAT THE DATE WAS DECORATION IN FIVE OF THE SEVEN. W205 caught this once, in
// W200's register, and its comment is still there: *it was `> "2026-08-11"`, so every acceptance
// passed forever — the review date was recorded and never enforced, which is a control that looks
// exactly like a control that works.* The fix went into that one file. **Five registers written
// after it repeat the defect**: W274's public-surface acceptances, W278's composed-copy acceptance,
// W285's and W287's hardening dispositions and W288's tautology acceptances check the date's SHAPE
// — `/^\d{4}-\d{2}-\d{2}$/` — and never compare it to a clock. A `reviewBy` of 1999-01-01 passes
// all five today.
//
// SO THE CLOCK COMPARISON LIVES HERE, ONCE, FOR ALL SEVEN. W205's lesson travelled as a comment in
// one file and a comment does not travel; W282's rule is the one that works — make the shared
// version the one that is already there. A register added tomorrow is caught by the census below
// before anybody has to remember.
//
// RE-DERIVATION IS THE OTHER HALF, AND THE THREE KINDS ARE NOT WORTH THE SAME. An acceptance whose
// finding the sweep no longer produces is stale, and a stale acceptance reads as coverage while
// permitting something else. Where the sweep is callable from a module, this file RUNS it. Where it
// lives inside the register's own test — W289's finding, one file over — this file resolves a
// citation to that test, which is weaker and is labelled weaker: W284's central citation resolved
// to `text.includes("/")`. And a hardening finding was produced by somebody READING a diff, so
// there is no sweep to re-run and the date is the only thing keeping it live, which is exactly why
// the date had to start working.
//
// WHAT THIS DOES NOT PROVE is `ACCEPTANCE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads registers the tree already exports.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";
import { ACCEPTED_COPY_FINDINGS } from "@/compliance/cdss-boundary";
import { ACCEPTED_COMPOSED_FINDINGS, COMPOSED_COPY_SITES, proseLiteralsIn } from "@/compliance/composed-copy";
import { ACCEPTED_FINDINGS } from "@/compliance/public-surfaces";
import { AUDIT_ALLOWLIST } from "@/security/audit-allowlist";
import { lintEducationCopy } from "@/education/advice-lint";
import { ACCEPTED_TAUTOLOGIES, brokenAcceptances } from "./tautology-sweep";
import { FINDINGS as HARDENING_Q22_FINDINGS, type HardeningFinding } from "./hardening-q22";
import { FINDINGS as Q23_FINDINGS } from "./hardening-q23";
import { FINDINGS as Q24_FINDINGS } from "./hardening-q24";
import { FINDINGS as Q25_FINDINGS } from "./hardening-q25";
import { FINDINGS as W279_REVIEW_FINDINGS } from "./review-w279";

/** One acceptance, flattened out of whichever register holds it. */
export interface Acceptance {
  /** `<unit>::<identity within the register>`, stable across edits above it. */
  id: string;
  /** ISO date. Past this, somebody looks again — and now something says so. */
  reviewBy: string;
  /** The argument for switching the rule off here. */
  why: string;
}

/** How the finding behind an acceptance is checked to still exist. */
export type Rederivation =
  /** The sweep is callable and is called below; the closure returns the acceptances gone stale. */
  | { kind: "rederived_here"; sweep: string; stale: () => string[] }
  /**
   * The comparison lives inside the register's own test, which exports nothing — W289's finding.
   * `citation` is `<file> :: <assertion text>` and is RESOLVED against the file, not recorded.
   * Weaker than running it, and labelled so rather than counted the same.
   */
  | { kind: "rederived_in_its_own_test"; citation: string }
  /** No sweep produced it: somebody read a diff. The date is the whole of its liveness. */
  | { kind: "by_review"; why: string };

export interface AcceptanceRegister {
  /** The unit that wrote the register. */
  unit: string;
  /** The module the register lives in, as the tree spells it. */
  module: string;
  /** The export, or the field carrying the dispositions. */
  register: string;
  entries: () => Acceptance[];
  rederivation: Rederivation;
}

const hardeningAcceptances = (
  unit: string,
  findings: readonly HardeningFinding[],
): Acceptance[] =>
  findings
    .flatMap((f) =>
      f.disposition.kind === "accepted"
        ? [{ id: `${unit}::${f.id}`, reviewBy: f.disposition.reviewBy, why: f.disposition.why }]
        : [],
    );

export const ACCEPTANCE_REGISTERS: readonly AcceptanceRegister[] = [
  {
    module: "src/quality/hardening-q25.ts",
    unit: "W331",
    register: "FINDINGS",
    entries: () => hardeningAcceptances("W331", Q25_FINDINGS),
    rederivation: {
      kind: "rederived_in_its_own_test",
      citation:
        "src/quality/hardening-q25.test.ts :: SEC-1: the founder page's reader is still the only new module on a request path",
    },
  },
  {
    module: "src/quality/hardening-q24.ts",
    unit: "W311",
    register: "FINDINGS",
    entries: () => hardeningAcceptances("W311", Q24_FINDINGS),
    rederivation: {
      kind: "rederived_in_its_own_test",
      citation: "src/quality/hardening-q24.test.ts :: Q24-SEC-1: exactly one module in the quarter is reachable from a page",
    },
  },
  {
    unit: "W298",
    module: "src/quality/hardening-q23.ts",
    register: "FINDINGS",
    entries: () => hardeningAcceptances("W298", Q23_FINDINGS),
    rederivation: {
      kind: "rederived_in_its_own_test",
      citation: "src/quality/hardening-q23.test.ts :: SEC-1: the three checked properties still hold",
    },
  },
  {
    unit: "W53",
    module: "src/security/audit-allowlist.ts",
    register: "AUDIT_ALLOWLIST",
    entries: () =>
      AUDIT_ALLOWLIST.map((e) => ({ id: `W53::${e.advisory}`, reviewBy: e.reviewBy, why: e.reason })),
    rederivation: {
      kind: "rederived_in_its_own_test",
      citation:
        "src/security/audit-gate.test.ts :: reports a stale allowlist entry without breaking the build",
    },
  },
  {
    unit: "W200",
    module: "src/compliance/cdss-boundary.ts",
    register: "ACCEPTED_COPY_FINDINGS",
    entries: () =>
      ACCEPTED_COPY_FINDINGS.map((a) => ({
        id: `W200::${a.module}#${a.exportName}:${a.rule}:${a.match}`,
        reviewBy: a.reviewBy,
        why: a.why,
      })),
    rederivation: {
      kind: "rederived_in_its_own_test",
      // The sweep needs the namespace loader, which is a `const` inside the test file — the exact
      // shape W289 found twenty-five times over.
      citation: "src/compliance/cdss-boundary.test.ts :: no longer produces ${accepted.rule}",
    },
  },
  {
    unit: "W274",
    module: "src/compliance/public-surfaces.ts",
    register: "ACCEPTED_FINDINGS",
    entries: () =>
      ACCEPTED_FINDINGS.map((a) => ({
        id: `W274::${a.path}:${a.rule}:${a.match}`,
        reviewBy: a.reviewBy,
        why: a.why,
      })),
    rederivation: {
      kind: "rederived_in_its_own_test",
      citation: "src/compliance/public-surfaces.test.ts :: subtracts only the exact finding",
    },
  },
  {
    unit: "W278",
    module: "src/compliance/composed-copy.ts",
    register: "ACCEPTED_COMPOSED_FINDINGS",
    entries: () =>
      ACCEPTED_COMPOSED_FINDINGS.map((a) => ({
        id: `W278::${a.module}::${a.fn}:${a.rule}:${a.match}`,
        reviewBy: a.reviewBy,
        why: a.why,
      })),
    rederivation: {
      kind: "rederived_here",
      sweep: "proseLiteralsIn + lintEducationCopy over COMPOSED_COPY_SITES",
      stale: () => {
        const root = process.cwd();
        const produced = new Set(
          COMPOSED_COPY_SITES.flatMap((site) =>
            proseLiteralsIn(root, site).flatMap((text) =>
              lintEducationCopy(text).map((v) => `${site.module}::${site.fn}:${v.rule}:${v.match}`),
            ),
          ),
        );
        return ACCEPTED_COMPOSED_FINDINGS.filter(
          (a) => !produced.has(`${a.module}::${a.fn}:${a.rule}:${a.match}`),
        ).map((a) => `W278::${a.module}::${a.fn}:${a.rule}:${a.match}`);
      },
    },
  },
  {
    unit: "W285",
    module: "src/quality/hardening-q22.ts",
    register: "HARDENING_Q22_FINDINGS (accepted dispositions)",
    entries: () => hardeningAcceptances("W285", HARDENING_Q22_FINDINGS),
    rederivation: {
      kind: "by_review",
      why: "The finding came from reading the quarter's diff through three lenses, not from a sweep. There is nothing to re-run: the diff is in history and the reading was a person's. So the date is the whole of this acceptance's liveness, which is the argument for making the date work rather than for exempting the register from it.",
    },
  },
  {
    unit: "W287",
    module: "src/quality/review-w279.ts",
    register: "W279_REVIEW_FINDINGS (accepted dispositions)",
    entries: () => hardeningAcceptances("W287", W279_REVIEW_FINDINGS),
    rederivation: {
      kind: "by_review",
      why: "Same shape as W285's: a unit's diff read through three lenses, with the findings disposed. No sweep produced them and none can re-produce them, so the review date is the only thing that brings anybody back to it.",
    },
  },
  {
    unit: "W288",
    module: "src/quality/tautology-sweep.ts",
    register: "ACCEPTED_TAUTOLOGIES",
    entries: () =>
      ACCEPTED_TAUTOLOGIES.map((a) => ({
        id: `W288::${a.file}::${a.test}`,
        reviewBy: a.reviewBy,
        why: a.why,
      })),
    rederivation: {
      kind: "rederived_here",
      sweep: "brokenAcceptances — the hit is still found AND the @ts-expect-error is still there",
      stale: () => brokenAcceptances(process.cwd()),
    },
  },
];

/** Every acceptance in the tree, from every register, in one shape. */
export function allAcceptances(
  registers: readonly AcceptanceRegister[] = ACCEPTANCE_REGISTERS,
): Acceptance[] {
  return registers.flatMap((r) => r.entries());
}

/**
 * Acceptances whose review date has passed, compared against a date the CALLER supplies.
 *
 * PARAMETERISED, which is W289's rule and the reason this one can be driven: the caller that
 * matters passes the real clock, and the test that proves the comparison works passes a fabricated
 * date. A checker welded to `new Date()` can only be read — and reading is what let five registers
 * ship a date nothing compared to anything.
 */
export function expiredAcceptances(
  today: string,
  registers: readonly AcceptanceRegister[] = ACCEPTANCE_REGISTERS,
): string[] {
  return allAcceptances(registers)
    .filter((a) => !(a.reviewBy > today))
    .map((a) => `${a.id} expired on ${a.reviewBy}`)
    .sort();
}

/** Acceptances whose finding the sweep no longer produces, for the registers that can be re-run. */
export function staleAcceptances(
  registers: readonly AcceptanceRegister[] = ACCEPTANCE_REGISTERS,
): string[] {
  return registers
    .flatMap((r) => (r.rederivation.kind === "rederived_here" ? r.rederivation.stale() : []))
    .sort();
}

/**
 * A cited re-derivation resolved against the file it names, or the reason it does not resolve.
 *
 * W301 moved the body to `@/quality/citations`: this had the best of four independent error
 * vocabularies, so it became the shared one. Re-exported under the name its callers already use.
 */
export { resolveCitation } from "./citations";

/**
 * Every module that HOLDS acceptances, read off the tree.
 *
 * TWO PATTERNS, UNION, because either alone misses a real register: W288's acceptances are not
 * named with a date in their type the way W274's are, and W285's dispositions are not called
 * `ACCEPTED_*` at all. A detector keyed on one shape is the failure W276, W284 and W279 each
 * recorded — a scan shaped like the code it expects cannot see code written differently.
 *
 * AND THE DATE PATTERN IS AN ASSIGNMENT, NOT A DECLARATION. The first draft matched the bare word
 * and found this module, which names `reviewBy` in a type and holds no acceptance at all. The fix
 * is to separate holding from naming — `reviewBy: "2027-..."` is a register, `reviewBy: string` is
 * a type — rather than to add a self-exemption, which is the one thing a census must never grant
 * itself. It also drops `audit-gate.ts`, which reads the allowlist rather than holding one, without
 * anybody having to write that down as an exception.
 *
 * KNOWN BOUND: a register whose dates are computed rather than written as literals is invisible
 * here, and the remedy is the usual one — the detector grows a second pattern and says so, rather
 * than the register growing an exemption.
 *
 * Rooted, and the walk is the shared one: a register added under a tree that is not this one has to
 * be findable, or W267's census gets a remedy sentence instead of a proof.
 */
export function acceptanceCarryingModules(root: string): string[] {
  const found: string[] = [];
  for (const file of sourceModules(root)) {
    // COMMENTS SUBTRACTED FIRST, and the docstring above is why: it quotes the very assignment
    // this scan looks for, so a raw read finds this module. W237's fix, twelfth instance — narrow
    // the scan to code rather than reword a comment that is saying the right thing (W198). W295
    // added the literal blanking for the same reason one layer over: a review date inside a
    // FIXTURE string is not an acceptance, and W295's witness plants exactly that.
    const text = prepareForScan(readFileSync(file, "utf8"));
    const assignsDate = /\breviewBy:\s*["'`]/.test(text);
    const exportsAcceptances = /export const [A-Z_]*ACCEPTED[A-Z_]*\s*[:=]/.test(text);
    if (assignsDate || exportsAcceptances) {
      found.push(path.relative(root, file).split(path.sep).join("/"));
    }
  }
  return found.sort();
}

/**
 * What a clean run of this register does not prove.
 *
 * Two of the seven re-derive their findings by running the sweep; four resolve a citation to an
 * assertion in their own test, which is a claim that the check EXISTS rather than that it passes.
 */
export const ACCEPTANCE_BOUND =
  "The date check is real for every acceptance register in the tree and is the thing this unit fixed: every acceptance in the tree is now compared against a clock, in one place, and a register added tomorrow is caught by the census before anybody has to remember. The RE-DERIVATION is not uniform and is not claimed to be. Some registers are re-swept here and a stale acceptance in any of them fails this suite. Others are cited to an assertion inside their own test file, and a resolved citation says the check is written, not that it is right — W284's central citation resolved to `text.includes(\"/\")` and read as coverage for a quarter. Moving those comparisons out of their test files is W289's remedy and a different unit's work. The rest are `by_review` and can never be re-swept: nothing re-reads a diff, which is why their dates are the whole of their liveness. (W297 removed the totals this sentence carried: it said four cited and one by-review while the register held three and two. The counts live in `ACCEPTANCE_REGISTERS`, where the suite reads them.)";

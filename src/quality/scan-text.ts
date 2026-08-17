// W302: one text-scan discipline — comments, literals, and the order they run in.
//
// FOURTEEN MODULES IN THIS TREE SCAN SOURCE AS TEXT, and every one of them has to answer the same
// two questions before it can look at anything: does a comment count, and does a string literal
// count. Both answers are almost always no, and both were being written out again per scan. By Q23
// there were four comment-strippers — the shared one in `reachability.ts`, a local copy in
// `order-independence.ts`, an inline pair in `composed-copy.ts`'s `bodyOf`, and another inline pair
// in `declaration-tax.ts` — and `blankLiterals` living inside W288's tautology sweep, which is not
// a copy but is an odd home for something six modules import.
//
// THE ORDER IS NOT A DETAIL, and W295 paid for finding that out. Blanking literals over RAW text
// treats a `/` in a prose comment as opening a regex literal; the match then runs to the next `/`
// and swallows whatever is between them. In `register-census.ts` that is an `export function` line,
// and W295's narrowing of `violationReporters` made FOUR REAL REGISTERS disappear from the walk —
// silently, because a register that vanishes from a population reports nothing rather than
// something. Which four changed depending on which transform ran first. So the order is enforced
// here rather than remembered: comments are subtracted BEFORE literals are blanked, always, and the
// test drives the exact comment that hid them.
//
// WHAT THIS DOES NOT DO IS DECIDE FOR THE CALLER. Some scans need literals kept — W294's acceptance
// detector looks for `reviewBy:` followed by a quote, and blanking the quote away would blind it to
// every real register at once — so `blankLiterals` keeps the opening delimiter, and a scan that
// wants literals intact says so. What is removed is the choice being re-implemented, not the
// choice.
//
// FOUNDER GATE (plan §4): nothing crossed. This transforms source text in memory.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { sourceModules } from "./tree-walks";

/**
 * String, template and regex literals with their CONTENTS blanked, same length, same lines.
 *
 * Moved here from W288's tautology sweep, which wrote it first and is not where it belongs: six
 * modules import it and none of them is about tautologies.
 *
 * THE OPENING DELIMITER IS KEPT. W294's detector looks for `reviewBy:` followed by a quote, so
 * blanking the quote away would blind it to every real register while blinding it to fixtures — the
 * fix and the defect at once. Keeping one character preserves "a literal starts here" and removes
 * everything a scan could mistake for code.
 */
export function blankLiterals(code: string): string {
  const LITERAL =
    /`(?:\\.|[^\\`])*`|"(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*'|\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\\/\n[])+\/[gimsuy]*/g;
  return code.replace(LITERAL, (m) => m[0] + m.slice(1).replace(/[^\n]/g, " "));
}

/** What a scan wants to be able to see. Both default to the answer almost every scan wants. */
export interface ScanPrep {
  /** `subtracted` removes comments; `kept` leaves them, for a scan reading prose on purpose. */
  comments?: "subtracted" | "kept";
  /** `blanked` empties literals; `kept` leaves them, for a scan whose subject IS a literal. */
  literals?: "blanked" | "kept";
}

/**
 * Source prepared for a text scan, with the transforms in the one order that works.
 *
 * LINE COUNT is preserved by both transforms, so a hit still reports the line it is on. OFFSETS are
 * preserved by blanking only: `stripComments` deletes a `//` comment rather than padding it, so a
 * caller that subtracts comments and then slices the ORIGINAL text is reading the wrong span. The
 * two promises are different and the test says so, because every scan here uses both transforms.
 */
export function prepareForScan(source: string, prep: ScanPrep = {}): string {
  const { comments = "subtracted", literals = "blanked" } = prep;
  // COMMENTS FIRST, ALWAYS. See `SCAN_ORDER_RULE`; the other order deletes code.
  const decommented = comments === "subtracted" ? stripComments(source) : source;
  return literals === "blanked" ? blankLiterals(decommented) : decommented;
}

/**
 * Why the order is fixed, kept as data because it is the expensive half of this unit.
 *
 * W196's shape: a later unit that wants to reorder these has to delete a stated rule rather than
 * quietly swap two lines.
 */
export const SCAN_ORDER_RULE =
  "Comments are subtracted before literals are blanked. Reversed, the literal scanner reads a `/` in a prose comment as opening a regex, runs the match on to the next `/`, and blanks whatever lies between — which in this tree is an `export function` line. W295 shipped that order into `violationReporters` and four real registers vanished from the walk; a register missing from a population reports nothing rather than something, so nothing failed except a count somewhere else. Which four vanished changed with the order the two transforms ran in, which is the clearest possible sign that the order was never a detail.";

/**
 * What this discipline does not reach.
 *
 * W295's reversion, recorded rather than tidied away: one scan in this tree still reads raw text on
 * purpose, and pretending otherwise would be the more comfortable lie.
 */
export const SCAN_BOUND =
  "One scan is deliberately outside this. `violationReporters` in W291's register reads RAW source, because both narrowings were tried at W295 and both hid real registers — comments-then-literals lost four, literals-then-comments lost a different three. The cause is understood and the fix is not: the reporter walk matches an `export function` signature, and any transform that can consume a signature can consume that one. So it stays raw and its fixtures split the token instead, which is the idiom `register-census.test.ts` uses for the same reason. What this buys is that the choice is made once and recorded, not that every scan in the tree now shares an implementation. A scan added tomorrow that reads raw text without saying why is invisible here, and the register below only knows about modules that ask for the preparation.";

/** A module that prepares text for scanning, and what it asks for. */
export interface ScanSite {
  module: string;
  prep: ScanPrep;
  /** Why this scan wants what it wants — a default nobody argued is a default nobody read. */
  why: string;
}

/**
 * Every module that asks for the shared preparation, declared.
 *
 * Checked against the tree in both directions by `scanSiteDiff`, so a module that starts preparing
 * text cannot do it without saying which answer it wants and why.
 */
export const SCAN_SITES: readonly ScanSite[] = [
  {
    module: "src/compliance/composed-copy.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its subject IS the literal — a prose sentence composed inside a render function — so blanking literals would empty the thing it exists to find. Comments are subtracted because a quoted phrase inside a comment explaining what wording to avoid is not copy, which is the collision W278 recorded at `feeCaveat`.",
  },
  {
    module: "src/quality/declaration-tax.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "A declaration IS a string literal — `\"src/quality/bounds.ts\"` in a register — so blanking literals would make every declaration site disappear and the quarter's baseline read as zero. Comments are subtracted because this tree's notes cite each other's paths constantly, and counting those would inflate the number Q24 is measured against.",
  },
  {
    module: "src/quality/tautology-sweep.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its parser blanks literals itself, one layer down, so that boundaries are found on blanked text while the PARTS are sliced from the real thing — a hit has to quote what the author wrote. Asking for them blanked here would blank them twice and leave nothing to quote.",
  },
  {
    module: "src/quality/order-independence.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "A fold named in prose is not a fold (W168) and a fold quoted inside a fixture is not one either (W295) — both were found the hard way, one per unit, in the same register.",
  },
  {
    module: "src/quality/acceptances.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It looks for `reviewBy:` followed by a quote, which is why `blankLiterals` keeps the opening delimiter: blanking it away would blind the detector to every real acceptance register while blinding it to fixtures.",
  },
];

export interface ScanSiteDiff {
  /** A module that imports the preparation and is not declared. */
  undeclared: string[];
  /** A declared module that has stopped importing it. */
  stale: string[];
}

/**
 * The register against a file list, both directions.
 *
 * Pure and list-in, so it can be handed a module the register does not know and a declared module
 * that has stopped asking — W289's rule about a comparison that can be given a second declared
 * list. `scanSitesInTree` is the rooted caller.
 */
export function scanSiteDiff(
  files: ReadonlyArray<{ module: string; source: string }>,
  declared: readonly ScanSite[] = SCAN_SITES,
): ScanSiteDiff {
  const importing = files
    .filter((f) => /\bprepareForScan\b/.test(prepareForScan(f.source)))
    .map((f) => f.module);
  const names = new Set(declared.map((s) => s.module));
  return {
    undeclared: importing.filter((m) => !names.has(m)).sort(),
    stale: [...names].filter((m) => !importing.includes(m)).sort(),
  };
}

/** Every module under `root/src`, as text — the walk both sweeps below share. */
function modulesWithSource(root: string): Array<{ module: string; source: string }> {
  return sourceModules(root).map((file) => ({
    module: path.relative(root, file).split(path.sep).join("/"),
    source: readFileSync(file, "utf8"),
  }));
}

/**
 * The register against the tree.
 *
 * This module's own file is excluded, and the exclusion is stated: it DEFINES `prepareForScan`
 * rather than asking for it, so counting it would make the register describe its own declaration.
 * That is the one exclusion W201 allows — the one somebody writes down.
 */
export function scanSitesInTree(root: string, declared: readonly ScanSite[] = SCAN_SITES): ScanSiteDiff {
  return scanSiteDiff(
    modulesWithSource(root).filter((f) => f.module !== "src/quality/scan-text.ts"),
    declared,
  );
}

/**
 * Every module in the tree that still writes its own comment-stripper or literal-blanker.
 *
 * The check that keeps "the copies are retired" true past this unit: a module that writes the pair
 * again arrives failing, which is the only reason the consolidation is worth anything.
 */
export function preparationCopies(root: string): { strippers: string[]; blankers: string[] } {
  const strippers: string[] = [];
  const blankers: string[] = [];
  for (const { module, source } of modulesWithSource(root)) {
    // LITERALS BLANKED, and the first draft kept them — so this sweep matched its own regex
    // literals and reported this module as a second comment-stripper. A stripper DEFINED in code is
    // code; a stripper NAMED inside a regex is the scan looking at itself. Third instance of the
    // collision in this session, in the module written about it, and the narrowing is the fix
    // rather than an exemption.
    const code = prepareForScan(source);
    if (/function stripComments\b/.test(code)) strippers.push(module);
    if (/function blankLiterals\b/.test(code)) blankers.push(module);
  }
  return { strippers: strippers.sort(), blankers: blankers.sort() };
}

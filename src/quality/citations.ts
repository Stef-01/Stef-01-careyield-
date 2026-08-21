// W301: the citation resolver, written once.
//
// THIS TREE INVENTED A CITATION FORMAT AND THEN IMPLEMENTED RESOLVING IT FOUR TIMES. `<file> :: <text>`
// is how a register points at the proof of something it claims — W258's rule is that a citation
// nobody resolves reads as coverage, and the answer everywhere has been to resolve it. Four
// registers did that independently: W294's acceptances, W292's negative probes, W267's census
// content-proofs and W258's own decision register.
//
// AND THEY DISAGREED ABOUT WHAT A FAILURE IS. One reported three distinguishable causes — malformed
// pair, missing file, missing assertion. One reported two and folded malformed into missing. Two
// resolved inline inside a `toContain`, so a failure named neither the cause nor the citation. A
// format that seven registers depend on had no shared parser, so the next register would have
// written a fifth.
//
// THE WINNER WAS ALREADY WRITTEN, which is the whole reason this is a small unit: W294's
// `resolveCitation` had the best error vocabulary of the four. It moved here unchanged in
// behaviour, and the other three call it now.
//
// WHY A REGISTER AND NOT JUST A FUNCTION. Deleting three implementations does not stop a fourth
// arriving; nothing about a shared helper makes the next author find it. So the separator itself is
// swept: a file that splits `" :: "` and does not import this module has to be declared, with the
// reason. There are two such files today and NEITHER is a citation — they split a composite ID,
// `module :: operator :: line` and `module :: function`, which happens to use the same separator.
// That distinction is the thing a sweep for the separator alone would get wrong, so it is written
// down rather than left to whoever reads the next hit.
//
// W298'S FINDING SAID FIVE AND IT WAS FOUR. The fifth was `mutation-sampling.test.ts`, counted
// because it splits the separator — but it splits an id, not a citation, which the finding's own
// sentence said and its count did not. Corrected in W298's register rather than quietly here: a
// hardening finding that overstates by one is a hardening finding somebody stops trusting.
//
// WHAT THIS DOES NOT PROVE is `CITATION_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads source files and returns strings.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { typescriptFiles } from "./tree-walks";

/** The separator, in one place, so a register cannot half-agree with the format. */
export const CITATION_SEPARATOR = " :: ";

export interface ParsedCitation {
  file: string;
  assertion: string;
}

/**
 * Split a citation, or say why it is not one.
 *
 * Exported separately from `resolveCitation` because two callers want the PARTS — W292 checks a
 * second string against the same file — and re-splitting is how the two halves drift.
 */
export function parseCitation(citation: string): ParsedCitation | string {
  const [file, ...rest] = citation.split(CITATION_SEPARATOR);
  const assertion = rest.join(CITATION_SEPARATOR);
  if (!file || !assertion) return `${citation}: not a <file>${CITATION_SEPARATOR}<assertion> citation`;
  return { file, assertion };
}

/**
 * `true`, or the reason the citation does not resolve.
 *
 * THREE CAUSES, KEPT DISTINCT, and that is the whole of what this unit consolidates: "the file is
 * gone", "the assertion was renamed" and "somebody wrote the citation wrong" are three different
 * repairs, and a caller that folds them reports a puzzle instead of a fix.
 */
export function resolveCitation(root: string, citation: string): true | string {
  const parsed = parseCitation(citation);
  if (typeof parsed === "string") return parsed;
  let text: string;
  try {
    text = readFileSync(path.join(root, parsed.file), "utf8");
  } catch {
    return `${citation}: names a file that does not exist`;
  }
  return text.includes(parsed.assertion) ? true : `${citation}: the file does not contain that assertion`;
}

/**
 * Whether `module::export` names something this tree really exports.
 *
 * SHARED BECAUSE IT WAS ABOUT TO BE WRITTEN A THIRD TIME. W376's gate and W389's each held their
 * own copy — the same six lines, resolving a `module::name` pair against the tree — and W394 was
 * one paste away from a third, which W331's CR-7 reports as a name several modules export and
 * nobody owns. It lives here because that is what this module already does: `resolveCitation` resolves
 * `file :: assertion` and this resolves `module::export`, the same question about the other half
 * of the tree.
 */
export function resolvesInTree(root: string, derivation: string): boolean {
  const [file, name] = derivation.split("::");
  if (!file || !name) return false;
  const full = path.join(root, file);
  if (!existsSync(full)) return false;
  return new RegExp(`(?:export )?(?:function|const) ${name}\\b`).test(readFileSync(full, "utf8"));
}

/** Every citation in a list that does not resolve, with its reason. */
export function unresolved(root: string, citations: readonly string[]): string[] {
  return citations
    .map((citation) => resolveCitation(root, citation))
    .filter((result): result is string => result !== true)
    .sort();
}

/**
 * Files that split the citation separator for something that is NOT a citation.
 *
 * The escape hatch, so it is enumerated and argued. Both entries split a composite identifier that
 * happens to use the same separator; neither reads a file, so neither can use the resolver. A third
 * is a decision somebody writes down rather than a kind somebody reaches for.
 */
export const SEPARATOR_NOT_A_CITATION: Readonly<Record<string, string>> = {
  "src/quality/mutation-sampling.test.ts":
    "Splits a mutant id — `module :: operator :: line-of-code` — to read the module and the operator back out for assertions about the survivor register. Three parts rather than two, and nothing is resolved against a file.",
  "src/quality/quarter-mutants.test.ts":
    "Splits a mutant id for the same reason and in the same shape as `mutation-sampling.test.ts` above — reading the module and the operator back out to assert that a named survivor points at a file that exists and an operator W296 has. Three parts, and the right-hand one is a line of code rather than a name to resolve.",
  "src/quality/horizon-directions.ts":
    "Splits a `shown_loud` citation — `file :: test title` — to resolve the file and look for the title in it. Two parts rather than three, and the right-hand side is a sentence rather than a name to resolve against an export, which is what keeps it out of W258's citation shape.",
  "src/quality/quarter-mutants-q29.test.ts":
    "Splits a mutant id for the same reason and in the same shape as `quarter-mutants-q28.test.ts` below — reading the module back out to assert that a closed survivor points at a module the population holds. Three parts, and the right-hand one is a line of code rather than a name to resolve. This quarter's survivor list is empty and its CLOSED list is not, so the split runs over the five the run closed.",
  "src/quality/quarter-mutants-q28.test.ts":
    "Splits a mutant id for the same reason and in the same shape as `quarter-mutants-q27.test.ts` below — reading the module and the operator back out to assert that a closed survivor points at a module the population holds and an operator W296 has. Three parts, and the right-hand one is a line of code rather than a name to resolve. Unlike Q27's, this list is NOT empty: four mutants survived the first run and the split runs over all four.",
  "src/quality/quarter-mutants-q27.test.ts":
    "Splits a mutant id for the same reason and in the same shape as `quarter-mutants-q26.test.ts` below — reading the module back out to assert that a named survivor points at one the population holds. Three parts, and the right-hand one is a line of code rather than a name to resolve. Q27's list is empty, so the split runs over nothing today and the row is here because the code that would do it is.",
  "src/quality/quarter-mutants-q26.test.ts":
    "Splits a mutant id for the same reason and in the same shape as `quarter-mutants.test.ts` above — reading the module and the operator back out to assert that a named survivor points at a module the population holds and an operator W296 has. Three parts, and the right-hand one is a line of code rather than a name to resolve.",
  "src/quality/order-regressions.test.ts":
    "Splits an order-regression site — `module :: function` — to group regressions by module. The right-hand side is a function name, not text to be found in a file.",
};

export interface SeparatorDiff {
  /** A file that splits the separator, imports no resolver, and is not declared. */
  undeclared: string[];
  /** A declared file that no longer splits the separator. */
  stale: string[];
}

/**
 * Both directions over the separator, W102's shape.
 *
 * WHY THIS EXISTS AT ALL: deleting three implementations does not stop a fourth arriving, and
 * nothing about a shared helper makes the next author find it. The sweep is what makes the
 * consolidation hold — a register that resolves its own citations inline fails here until it either
 * uses the resolver or says why it cannot.
 */
export function separatorDiff(
  root: string,
  declared: Readonly<Record<string, string>> = SEPARATOR_NOT_A_CITATION,
): SeparatorDiff {
  const splitters: string[] = [];
  for (const file of typescriptFiles(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (rel === "src/quality/citations.ts" || rel === "src/quality/citations.test.ts") continue;
    const text = readFileSync(file, "utf8");
    // The literal separator inside a `split(` call. A register that MENTIONS the format in prose is
    // not one that parses it — the collision this tree records in every text scan it writes.
    if (!/\.split\(\s*["'] :: ["']\s*\)/.test(text)) continue;
    if (text.includes('from "./citations"') || text.includes('from "@/quality/citations"')) continue;
    splitters.push(rel);
  }
  return {
    undeclared: splitters.filter((f) => !(f in declared)).sort(),
    stale: Object.keys(declared).filter((f) => !splitters.includes(f)).sort(),
  };
}

/** What a green `separatorDiff` does not prove. */
export const CITATION_BOUND =
  "The sweep reads a `.split(\" :: \")` call. A register that parses the format with an index, a " +
  "regex or a destructuring helper is invisible to it, and would be a further implementation this " +
  "does not see — the same class of bound W267 states about `readdirSync`. When such a parse " +
  "arrives the detector grows a scan and says so, rather than the register growing an exemption. " +
  "What it does hold is the shape every resolver consolidated here was written in.";

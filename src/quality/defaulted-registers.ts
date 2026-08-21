// W355: a default that turns a wrong call into a plausible answer.
//
// A DEFAULTED PARAMETER IS A PROMISE THAT THE FUNCTION CAN BE ASKED A DIFFERENT QUESTION. That is
// the whole reason this tree has them: W296 found that a comparison welded to its module's own
// constants can only ever be asserted over the real tree, so `expect(diff(ROOT)).toEqual([])` reads
// as a driven check and is a claim about one input. The remedy — export the comparison taking the
// declared list — is now everywhere, and the promise it makes is that somebody can hand it another.
//
// A PROMISE NOBODY COLLECTS IS THE DEFECT, and it is quiet in the direction Q28 is about. A
// parameter no call ever supplies has had exactly one value for its whole life; the signature says
// otherwise, and a reader auditing the register sees a drivable comparison. W343 recorded the
// sharper version of the same thing one quarter earlier: `quarterModules(root, first, last)` took
// two loose numbers, the natural call handed it an object, every comparison went false and the
// population became the whole tree. Nothing threw. A default is the same shape with the mistake
// moved to the CALLER — omit the argument and you get a plausible answer about the wrong input.
//
// THE POPULATION IS EVERY EXPORTED FUNCTION THAT TAKES A `root` AND DEFAULTS A REGISTER OR A
// DERIVATION. The `root` is what says it reads the tree; the default is what it compares against.
// A hundred and six of them today, and every one is supplied with a different value somewhere —
// which is a result rather than a formality, and it is why the defect arm below is empty and stays
// checked. What is NOT true of all of them is that their own suite does the supplying: `DRIVEN_AT_W355`
// names the ones driven from somewhere else, with the files that do it, RE-DERIVED on every run so
// a citation cannot rot into a sentence.
//
// WHAT THIS DOES NOT PROVE is `DEFAULT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the tree's own signatures and call sites.

import { readFileSync } from "node:fs";
import path from "node:path";
import { sourceModules, typescriptFiles } from "./tree-walks";

/** One parameter that has a register or a derivation for a default. */
export interface DefaultedParameter {
  /** The declaring module, as the tree spells it. */
  module: string;
  /** The exported function. */
  fn: string;
  /** Which argument it is, counting from one. */
  position: number;
  /** The default's own text, normalised — so a rename is visible rather than silent. */
  fallback: string;
}

const normalise = (text: string): string => text.replace(/\s+/g, " ").trim();

/** Split on the commas that are not inside brackets — a type annotation has its own. */
export function topLevelParts(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]!;
    if ("([{<".includes(c)) depth += 1;
    else if (")]}>".includes(c)) depth -= 1;
    else if (c === "," && depth === 0) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out.filter((part) => part.trim() !== "");
}

/** The text between the bracket at `from` and its partner. */
function inside(source: string, from: number): string {
  let depth = 0;
  for (let i = from; i < source.length; i += 1) {
    if ("([{".includes(source[i]!)) depth += 1;
    else if (")]}".includes(source[i]!)) {
      depth -= 1;
      if (depth === 0) return source.slice(from + 1, i);
    }
  }
  return "";
}

/** A default worth watching: a register by name, or a derivation over the tree. */
const WATCHED_DEFAULT = /^[A-Z_][A-Z0-9_]*$|^[a-zA-Z_$][\w$.]*\(/;

/**
 * Every defaulted register or derivation on a function that reads the tree.
 *
 * THE `root` IS THE FILTER and it is doing real work: without it the population is two hundred and
 * fifty-three defaults, most of them a policy object or an empty array on a function that answers
 * about its arguments alone. A default only tells a caller the wrong thing about the TREE when the
 * function is about the tree, and `root: string` is how this repository says so.
 */
export function defaultedParameters(root: string): DefaultedParameter[] {
  const out: DefaultedParameter[] = [];
  for (const full of sourceModules(root)) {
    const rel = full.slice(root.length + 1);
    const source = readFileSync(full, "utf8");
    const declarations = /export function (\w+)\(/g;
    let match: RegExpExecArray | null;
    while ((match = declarations.exec(source)) !== null) {
      const params = inside(source, match.index + match[0].length - 1);
      if (!/\broot\s*:\s*string/.test(params)) continue;
      topLevelParts(params).forEach((part, index) => {
        const at = part.indexOf("=");
        if (at === -1) return;
        const fallback = normalise(part.slice(at + 1));
        if (!WATCHED_DEFAULT.test(fallback)) return;
        out.push({ module: rel, fn: match![1]!, position: index + 1, fallback });
      });
    }
  }
  return out.sort((a, b) => id(a).localeCompare(id(b)));
}

/** `module::fn::position` — the key everything here is compared on. */
export function id(param: DefaultedParameter): string {
  return `${param.module}::${param.fn}::${param.position}`;
}

/** What each call supplies at one position, in one file. */
export function suppliedAt(source: string, fn: string, position: number): string[] {
  const out: string[] = [];
  const calls = new RegExp(`\\b${fn}\\(`, "g");
  let match: RegExpExecArray | null;
  while ((match = calls.exec(source)) !== null) {
    // A method call on something else is a different function that happens to share a name.
    if (/[.\w]/.test(source[match.index - 1] ?? "")) continue;
    // AND THE DECLARATION IS NOT A CALL. `thingDefects(root: string, declared = THINGS)` reads at
    // position two as `declared: number[] = THINGS`, which is not the default's text, so every
    // parameter in this population looked driven by the module that declares it. The planted probe
    // found it: a register nothing calls came back reported as driven from elsewhere.
    if (/\b(?:function|const|let|var)\s+$/.test(source.slice(Math.max(0, match.index - 20), match.index))) continue;
    const args = inside(source, match.index + match[0].length - 1);
    if (args.trim() === "") continue;
    const parts = topLevelParts(args);
    if (parts.length >= position) out.push(normalise(parts[position - 1]!));
  }
  return out;
}

/**
 * The files that hand this parameter something OTHER than its default.
 *
 * OTHER, NOT MERELY PRESENT, and the distinction is this check's own failure direction: a call
 * writing `diff(root, THE_REGISTER)` supplies the argument and drives nothing, so a rule that
 * counted arguments would be satisfied by the one call shape that proves least.
 */
export function drivenBy(root: string, param: DefaultedParameter): string[] {
  const out: string[] = [];
  for (const full of typescriptFiles(root)) {
    const rel = full.slice(root.length + 1);
    const source = readFileSync(full, "utf8");
    if (suppliedAt(source, param.fn, param.position).some((given) => given !== param.fallback)) {
      out.push(rel);
    }
  }
  return out.sort();
}

/** The suite that sits beside a module, by this tree's convention. */
export const siblingSuiteOf = (module: string): string => module.replace(/\.ts$/, ".test.ts");

/** A parameter whose own suite never drives it, and the files that do. */
export interface DrivenElsewhere {
  /** `module::fn::position`. */
  parameter: string;
  /** Files supplying a different value. Re-derived every run; a stale citation fails. */
  drivenBy: readonly string[];
}

export interface DefaultDefect {
  parameter: string;
  what: string;
}

/**
 * The parameters driven from somewhere other than the module's own suite.
 *
 * A RECORD RATHER THAN AN EXCUSE. Nothing here argues that being driven elsewhere is fine; it says
 * where, and the check re-derives the where. Most of these are supplied by another function in the
 * same module — which means an assertion reaches the non-default path transitively and no test ever
 * writes the argument down. That is a weaker position than the eighty-one whose own suite hands
 * them a value, and naming it is the point: `DEFAULT_BOUND` says what it is not.
 */
export const DRIVEN_AT_W355: readonly DrivenElsewhere[] = [
  { parameter: "src/founder/outstanding.ts::gatesBlockingNothing::2", drivenBy: ["src/quality/founder-page-facts.test.ts"] },
  { parameter: "src/founder/outstanding.ts::outstandingRulings::2", drivenBy: ["src/founder/outstanding.ts"] },
  { parameter: "src/quality/assertion-vocabulary.ts::presenceDefects::2", drivenBy: ["src/quality/exemption-reach.test.ts", "src/quality/exemption-reach.ts", "src/quality/hardening-q27.test.ts"] },
  { parameter: "src/quality/blocked-surface.ts::blockedSurfaceViolations::2", drivenBy: ["src/quality/manifest.ts"] },
  { parameter: "src/quality/close-gate.ts::breaksOnClose::5", drivenBy: ["src/quality/close-gate.ts"] },
  { parameter: "src/quality/declaration-tax.ts::homeDiff::2", drivenBy: ["src/quality/author-tax.test.ts", "src/quality/latent-findings.ts", "src/quality/manifest.ts"] },
  { parameter: "src/quality/page-suite.ts::pageSuiteCoverage::2", drivenBy: ["src/quality/page-suite.ts"] },
  { parameter: "src/quality/page-suite.ts::pageSuiteViolations::2", drivenBy: ["src/quality/manifest.ts"] },
  { parameter: "src/quality/pins.ts::duplicateDiff::2", drivenBy: ["src/quality/manifest.ts"] },
  { parameter: "src/quality/private-copies.ts::privateCopies::2", drivenBy: ["src/quality/private-copies.ts", "src/quality/superset.ts"] },
  { parameter: "src/quality/prose-numbers.ts::claimDefects::3", drivenBy: ["src/quality/claim-classes.ts"] },
  { parameter: "src/quality/quarter-mutants.ts::quarterModules::2", drivenBy: ["src/quality/blind-spots.ts", "src/quality/controls.ts", "src/quality/defaulted-registers.ts", "src/quality/hardening-q26.test.ts", "src/quality/hardening-q26.ts", "src/quality/horizon-directions.ts", "src/quality/quarter-mutants-q26.test.ts", "src/quality/quarter-mutants-q26.ts", "src/quality/quarter-mutants-q27.test.ts", "src/quality/quarter-mutants-q27.ts", "src/quality/quarter-mutants-q28.test.ts", "src/quality/quarter-mutants-q28.ts", "src/quality/quarter-mutants-q29.test.ts", "src/quality/quarter-mutants-q29.ts", "src/quality/superset.test.ts", "src/quality/superset.ts"] },
  { parameter: "src/quality/quarter-mutants.ts::quarterMutants::2", drivenBy: ["src/quality/quarter-mutants-q26.test.ts", "src/quality/quarter-mutants-q27.test.ts", "src/quality/quarter-mutants-q27.ts", "src/quality/quarter-mutants-q28.test.ts", "src/quality/quarter-mutants-q28.ts", "src/quality/quarter-mutants-q29.test.ts", "src/quality/quarter-mutants-q29.ts"] },
  { parameter: "src/quality/quarter-mutants.ts::sampledShare::2", drivenBy: ["src/quality/quarter-mutants-q26.test.ts", "src/quality/quarter-mutants-q27.test.ts", "src/quality/quarter-mutants-q28.test.ts", "src/quality/quarter-mutants-q29.test.ts"] },
  { parameter: "src/quality/review-w279.ts::fallibleDiff::2", drivenBy: ["src/quality/manifest.ts"] },
  { parameter: "src/quality/self-ending.ts::allEndings::2", drivenBy: ["src/quality/self-ending.ts"] },
  { parameter: "src/quality/unit-headers.ts::headerSubjectDefects::3", drivenBy: ["src/quality/claim-classes.ts"] },
];

/**
 * Where the tree and this register disagree, in three directions.
 *
 * The first is the finding the unit exists for and it is EMPTY today — every defaulted register in
 * this tree is handed a different value somewhere. The second and third keep the record of where
 * from rotting, in both directions, because a citation nobody re-resolves is a sentence.
 */
export function defaultDefects(
  root: string,
  declared: readonly DrivenElsewhere[] = DRIVEN_AT_W355,
  params: readonly DefaultedParameter[] = defaultedParameters(root),
): DefaultDefect[] {
  const out: DefaultDefect[] = [];
  const byParameter = new Map(declared.map((d) => [d.parameter, d]));
  const seen = new Set<string>();

  for (const param of params) {
    const key = id(param);
    seen.add(key);
    const files = drivenBy(root, param);
    if (files.length === 0) {
      out.push({ parameter: key, what: "defaults a register and no call anywhere supplies another" });
      continue;
    }
    const ownSuite = files.includes(siblingSuiteOf(param.module));
    const row = byParameter.get(key);
    if (ownSuite) {
      if (row !== undefined) {
        out.push({ parameter: key, what: "is recorded as driven elsewhere and its own suite drives it" });
      }
      continue;
    }
    if (row === undefined) {
      out.push({ parameter: key, what: "is driven only from outside its own suite and nothing records where" });
      continue;
    }
    if (normalise(row.drivenBy.join(",")) !== normalise(files.join(","))) {
      out.push({ parameter: key, what: `is recorded as driven by ${row.drivenBy.join(", ")} and is driven by ${files.join(", ")}` });
    }
  }
  for (const row of declared) {
    if (!seen.has(row.parameter)) {
      out.push({ parameter: row.parameter, what: "is recorded here and the tree holds no such defaulted parameter" });
    }
  }
  return out.sort((a, b) => `${a.parameter}${a.what}`.localeCompare(`${b.parameter}${b.what}`));
}

/** What this register does not prove. */
export const DEFAULT_BOUND =
  "IT READS CALL SITES, NOT BEHAVIOUR. A parameter counts as driven when some call hands it text " +
  "that is not the default's text, which says an argument was written and not that the answer " +
  "moved: a call passing a value equal to the default by a different name drives nothing and is " +
  "counted here. What would settle it is running the function both ways and requiring the results " +
  "to differ, which needs every one of these to be callable with a constructed input and is a " +
  "harness rather than a scan. THE `root` FILTER IS A CONVENTION. A function that reads the tree " +
  "through something other than a `root` parameter is outside the population entirely, and so is " +
  "every defaulted policy object on a function that answers about its arguments alone — most of " +
  "the defaults in this tree, deliberately. AND BEING DRIVEN FROM ANOTHER MODULE IS NOT THE SAME " +
  "AS BEING DRIVEN: the rows below are mostly supplied by a sibling function in the declaring " +
  "module, so an assertion reaches the non-default path without any test ever writing the argument " +
  "down. That is weaker than a suite that hands it a value, and this register records the " +
  "difference rather than closing it.";

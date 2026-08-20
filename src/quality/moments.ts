// W378: the moment register — for every check in the census, when it runs.
//
// A CHECK IS A COMPARISON OVER A POPULATION AT A MOMENT, and this tree had written down two of the
// three. W267 says what each register walks; Q29 said what each is over. Nothing said WHEN any of
// them answers — and Q28's hardening pass found the cost of that in one sentence: two checks failed
// toward green on `main` in one day, both because they read a ledger row's status and could only go
// wrong AT THE CLOSE, which is the one commit whose suite is easiest not to re-run.
//
// THE MOMENT IS DERIVED, NOT DECLARED, which is the gate's own wording and the only version worth
// having. A row saying "per test" is a word; a row checked against where the module's exports are
// actually CALLED is a claim the build can lose. The call sites are read with comments subtracted
// and literals blanked, in that order — W375 lost an afternoon to each of those and W376 found the
// same trap in a third register, so it is not a precaution here, it is the house rule.
//
// FIVE MOMENTS, and the ones that matter are the rare ones. Most of this tree answers PER TEST,
// inside an `it(...)`, which is the moment a normal suite gives. The exceptions are where the
// failures live: `run_teardown` sees a whole run's residue and is never reached by a run that was
// killed; `run_setup` is the first moment of a run and the only one an interrupted predecessor's
// mess can be cleared at; `file_load` answers once when a module is imported, before any test has
// arranged anything; and `gate_stage` is outside vitest altogether, in a script the gate runs.
//
// A MEMBER WHOSE MOMENT NOTHING CAN NAME IS THE FINDING. If no test file, no harness hook and no
// gate script calls any export of a census member, then the register walks, the comparison works,
// and nothing ever asks it — which is invisible in a green run and is exactly what this quarter is
// about.
//
// WHAT THIS DOES NOT PROVE is `MOMENT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own source text.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { enclosingTest } from "./tautology-sweep";
import { pageSpecFiles, testModules } from "./tree-walks";

/** The harness hook, which is outside `src/` and therefore outside every walk. */
export const HARNESS = "vitest.global-setup.ts";

/** The gate stages that run outside vitest entirely. */
export const GATE_SCRIPTS = ["scripts/audit-gate.mts"];

/** When a check answers. */
export type Moment =
  /** Once, when a module is imported — before any test has arranged anything. */
  | "file_load"
  /** Inside an `it(...)`. The moment a normal suite gives, and most of this tree. */
  | "per_test"
  /** The first moment of a run, before any worker starts. */
  | "run_setup"
  /** After every worker has finished — the only moment that sees a whole run. */
  | "run_teardown"
  /** Outside vitest: a script or a spec the gate runs as its own stage. */
  | "gate_stage";

/** Every name a module exports. */
export function exportsOf(root: string, module: string): string[] {
  let source: string;
  try {
    source = readFileSync(path.join(root, module), "utf8");
  } catch {
    return [];
  }
  const code = prepareForScan(source);
  return [...code.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map((m) => m[1]!).sort();
}

/**
 * Every test module's text, prepared once per tree.
 *
 * W378 READ THE SUITE ONCE PER CENSUS MEMBER BEFORE THIS: every test module re-read for every
 * member, which cost more than a minute of a run that was already the longest in the tree and put
 * the reporter channel over the line W347 measured. The answer does not depend on which member is being asked, so it is computed
 * once — and the cache is keyed by ROOT because every probe in this quarter plants a fresh tree and
 * a cache that ignored that would answer about the wrong one, which is W282's rule arriving as a
 * performance change.
 */
const prepared = new Map<string, { rel: string; blanked: string; kept: string }[]>();

function testSources(root: string): { rel: string; blanked: string; kept: string }[] {
  const held = prepared.get(root);
  if (held !== undefined) return held;
  const files = testModules(root).map((full) => {
    const rel = path.relative(root, full).split(path.sep).join("/");
    const source = readFileSync(full, "utf8");
    return {
      rel,
      blanked: blankImports(prepareForScan(source)),
      kept: prepareForScan(source, { literals: "kept" }),
    };
  });
  prepared.set(root, files);
  return files;
}

/** One place a census member's export is called, and the moment that place answers at. */
export interface MomentSite {
  file: string;
  moment: Moment;
  /** The export that was called there — so a site can be read rather than trusted. */
  via: string;
}

/**
 * Import statements blanked, newlines kept.
 *
 * AN IMPORT NAMES WHAT A FILE MAY REACH, NOT WHEN IT REACHES IT, and counting one made every
 * importing suite look as though it answered at file load. The first version skipped a LINE that
 * began with `import`, which is most of them and not the ones that matter: this tree writes its
 * long imports across several lines, so `SELF_SCANNING` sits alone on line thirty of a statement
 * that began on line twenty-eight. A statement is the unit, not a line.
 */
export const blankImports = (code: string): string =>
  code.replace(/^(?:import\b[^;]*;|export\s*(?:\{[^}]*\}|\*)\s*from[^;]*;)/gm, (m) =>
    m.replace(/[^\n]/g, " "),
  );

/**
 * The offset a line starts at.
 *
 * THE TWO TRANSFORMS DISAGREE ABOUT OFFSETS AND AGREE ABOUT LINES, which is stated in
 * `prepareForScan`'s own doc comment and is what makes this function necessary. Matching happens on
 * blanked text — a call named inside a string is a mention — but `enclosingTest` needs the quotes
 * that blanking removes, so it reads comment-stripped text instead, and the two are bridged by the
 * line number rather than by the index.
 */
const offsetOfLine = (code: string, line: number): number => {
  const lines = code.split("\n");
  let offset = 0;
  for (let i = 0; i < line && i < lines.length; i += 1) offset += lines[i]!.length + 1;
  return offset;
};

/** The function a line sits inside, by walking top-level declarations from the top. */
function enclosingFunction(lines: readonly string[], index: number): string {
  let fn = "<top>";
  for (let i = 0; i <= index; i += 1) {
    const m = /^(?:export )?(?:function|const) (\w+)/.exec(lines[i]!);
    if (m) fn = m[1]!;
  }
  return fn;
}

/**
 * Every moment at which this module's exports are called.
 *
 * The call sites are the answer and the module's own source is not consulted: a register can say
 * anything about itself, and what decides when it answers is where somebody else runs it.
 */
export function momentsOf(root: string, module: string): MomentSite[] {
  const out: MomentSite[] = [];

  // A CENSUS MEMBER THAT IS ITSELF A `.test.ts` EXPORTS NOTHING, and its check is welded inside it
  // — W289's class, and thirty-one of the eighty-two. Its moment is read from its own assertions
  // rather than from a caller, because there is no caller and never can be.
  if (module.endsWith(".test.ts")) {
    const code = prepareForScan(readFileSync(path.join(root, module), "utf8"));
    for (const m of code.matchAll(/\bexpect\s*\(/g)) {
      const moment = enclosingTest(code, m.index) === "(outside a test)" ? "file_load" : "per_test";
      out.push({ file: module, moment, via: "expect" });
    }
    return out;
  }

  const names = exportsOf(root, module).filter((n) => n !== "default");
  if (names.length === 0) return out;
  // TWO SPELLINGS, AND THE DIFFERENCE IS THE POINT. A function is CALLED, so it needs its bracket.
  // A register exported as a constant is READ rather than invoked, and reading it is exactly when
  // that check answers — requiring a bracket made thirty-one members look as though nothing ever
  // asked them. But a bare reference is only safe for a name nothing else would spell: this tree's
  // registers are SCREAMING_CASE, and `defaulted-registers.ts` exports `id`, which matched every
  // `id` in every e2e spec until the two spellings were separated.
  const shouted = names.filter((n) => /^[A-Z][A-Z0-9_]*$/.test(n));
  const called = names.filter((n) => !/^[A-Z][A-Z0-9_]*$/.test(n));
  const alternatives = [
    ...(shouted.length > 0 ? [`\\b(?:${shouted.join("|")})\\b`] : []),
    ...(called.length > 0 ? [`\\b(?:${called.join("|")})\\s*\\(`] : []),
  ];
  const pattern = new RegExp(`(${alternatives.join("|")})`, "g");

  const scan = (file: string, decide: (code: string, index: number, lines: readonly string[], line: number) => Moment) => {
    let source: string;
    try {
      source = readFileSync(path.join(root, file), "utf8");
    } catch {
      return;
    }
    const code = blankImports(prepareForScan(source));
    const lines = code.split("\n");
    for (const m of code.matchAll(pattern)) {
      const line = code.slice(0, m.index).split("\n").length - 1;
      // AN IMPORT IS NOT A CALL SITE. It names what a file may reach, not when the file reaches it,
      // and counting it made every importer look as though it answered at file load.
      out.push({ file, moment: decide(code, m.index, lines, line), via: m[1]!.replace(/[\s(]+$/, "") });
    }
  };

  for (const { rel, blanked, kept } of testSources(root)) {
    if (rel === module) continue;
    for (const m of blanked.matchAll(pattern)) {
      const line = blanked.slice(0, m.index).split("\n").length - 1;
      const moment = enclosingTest(kept, offsetOfLine(kept, line)) === "(outside a test)" ? "file_load" : "per_test";
      out.push({ file: rel, moment, via: m[1]!.replace(/[\s(]+$/, "") });
    }
  }
  // THE HARNESS HAS HELPERS, and a call inside one answers at whatever moment reaches the helper.
  // `reclaimableCopies` is called from `sweepTreeCopies`, which `setup` and `teardown` both call —
  // reading only the enclosing function put it at file load, which is the one moment it is not.
  const harnessSource = (() => {
    try {
      return blankImports(prepareForScan(readFileSync(path.join(root, HARNESS), "utf8")));
    } catch {
      return "";
    }
  })();
  const reachedFrom = (fn: string): Moment[] => {
    if (fn === "setup") return ["run_setup"];
    if (fn === "teardown") return ["run_teardown"];
    const lines = harnessSource.split("\n");
    const found = new Set<Moment>();
    for (const m of harnessSource.matchAll(new RegExp(`\\b${fn}\\s*\\(`, "g"))) {
      const line = harnessSource.slice(0, m.index).split("\n").length - 1;
      const holder = enclosingFunction(lines, line);
      if (holder === "setup") found.add("run_setup");
      if (holder === "teardown") found.add("run_teardown");
    }
    return found.size > 0 ? [...found] : ["file_load"];
  };
  {
    const lines = harnessSource.split("\n");
    for (const m of harnessSource.matchAll(pattern)) {
      const line = harnessSource.slice(0, m.index).split("\n").length - 1;
      const via = m[1]!.replace(/[\s(]+$/, "");
      for (const moment of reachedFrom(enclosingFunction(lines, line))) out.push({ file: HARNESS, moment, via });
    }
  }
  for (const file of [...GATE_SCRIPTS, ...pageSpecFiles(root)]) scan(file, () => "gate_stage");
  return out;
}

/** The distinct moments a member answers at, sorted. */
export const momentsAt = (sites: readonly MomentSite[]): Moment[] =>
  [...new Set(sites.map((s) => s.moment))].sort();

/**
 * The two shapes a vitest suite can give a check.
 *
 * A JUDGEMENT, AND THE REGISTER SAYS SO — but a narrow one: these are not a list of members, they
 * are the only two arrangements a `.test.ts` has available. Either something at the top of the file
 * derives an answer when the module loads and the assertions about it run inside `it(...)`, or
 * everything happens inside the tests. Fifty-two of the census take the first shape and
 * twenty-nine the second, and neither is interesting: what is interesting is a member answering at
 * a moment NO suite can give, which is what the rows below hold.
 */
export const ORDINARY_SHAPES: readonly (readonly Moment[])[] = [["per_test"], ["file_load", "per_test"]];

/** Whether a set of moments is one a suite could have produced. */
export const suiteShaped = (at: readonly Moment[]): boolean =>
  ORDINARY_SHAPES.some((shape) => shape.join("+") === [...at].sort().join("+"));

/** A census member that answers at a moment no suite gives. */
export interface UnusualMoment {
  /** The census member, by file. */
  file: string;
  moments: readonly Moment[];
  why: string;
}

export interface MomentDefect {
  file: string;
  what: string;
}

/**
 * Every census member that answers outside its own suite, with why.
 *
 * ONE TODAY, and one is the honest number rather than a thin register: the population is members
 * whose moment a suite cannot give, and this tree runs exactly one of its census outside vitest.
 * The value is in the arm rather than the length — a second row arriving means a check has started
 * answering at a moment its suite does not control, which is this quarter's whole subject.
 */
export const MOMENTS_AT_W378: readonly UnusualMoment[] = [
  {
    file: "src/compliance/surfaces.ts",
    moments: ["file_load", "gate_stage", "per_test"],
    why: "THE ONLY CENSUS MEMBER THE GATE RUNS OUTSIDE VITEST. `discoverSurfaces` is called by the e2e specs, which `pnpm verify` runs as its own stage after the build — so this module answers again, in a browser run, about a tree that has already been compiled. That is a different moment from its suite's and it is the one that can disagree: a route the specs walk is a route the build produced, and a route the register derives is one the source declares. Nothing compares the two answers, which is what makes the extra moment worth writing down rather than shrugging at.",
  },
];

/**
 * Where the moment register and the tree disagree, in five directions.
 *
 * The first is the gate's own clause: a census member nothing anywhere runs has no moment at all,
 * and a register that walks, compares and is never asked is invisible in a green run.
 */
export function momentDefects(
  root: string,
  census: readonly { file: string }[],
  declared: readonly UnusualMoment[] = MOMENTS_AT_W378,
): MomentDefect[] {
  const byFile = new Map(declared.map((d) => [d.file, d]));
  const out: MomentDefect[] = [];

  for (const { file } of census) {
    const at = momentsAt(momentsOf(root, file));
    const row = byFile.get(file);
    if (at.length === 0) {
      out.push({ file, what: "walks the tree and nothing anywhere runs it, so it answers at no moment" });
      continue;
    }
    const key = at.join("+");
    if (suiteShaped(at)) {
      if (row !== undefined) out.push({ file, what: "is recorded as answering outside its suite and does not" });
      continue;
    }
    if (row === undefined) {
      out.push({ file, what: `answers at ${key}, which no suite gives, and nothing says why` });
      continue;
    }
    if ([...row.moments].sort().join("+") !== key) {
      out.push({ file, what: `is recorded as answering at ${[...row.moments].sort().join("+")} and answers at ${key}` });
    }
    if (row.why.length < 120) {
      out.push({ file, what: "answers outside its suite and is recorded without an argument" });
    }
  }
  const members = new Set(census.map((c) => c.file));
  for (const { file } of declared) {
    if (!members.has(file)) out.push({ file, what: "is recorded here and the census does not hold it" });
  }
  return out.sort((a, b) => `${a.file}${a.what}`.localeCompare(`${b.file}${b.what}`));
}

/** What this register does not prove. */
export const MOMENT_BOUND =
  "IT READS WHERE AN EXPORT IS CALLED, NOT WHICH EXPORT IS THE CHECK. A census member exports its " +
  "walk, its comparison and often a helper, and a call to any of them counts as the module " +
  "answering — so a register whose COMPARISON is never run while its walk is called from a test " +
  "reads as answering per test here. THE MOMENT IS THE CALL SITE'S, not the assertion's: a check " +
  "called inside an `it(...)` whose result nothing asserts on has the same moment as one that is " +
  "asserted, because what this derives is when the code runs rather than when a claim is made " +
  "about it. AND `file_load` IS THE COARSEST OF THE FIVE — `enclosingTest` reads the last `it(` " +
  "opened before an index rather than the block a call really sits in, so a call after a suite's " +
  "last test is attributed to that test rather than to the file. What would settle both is a " +
  "parse rather than a scan, which is the instrument this tree has refused four times and should " +
  "keep refusing until a finding needs it.";

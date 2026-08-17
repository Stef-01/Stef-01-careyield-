// W275: the rendered surface enters the verify gate.
//
// `pnpm verify` has been `typecheck && test && build && audit:gate` for the whole build. Four
// stages, none of which opens a page. The page suite — thirty-six specs covering every console
// route, every public surface, the a11y sweep and W192's public-copy sweep — was `pnpm e2e`, run
// when somebody remembered.
//
// AND THE COST OF THAT IS ON THE RECORD, TWICE, IN THE LAST TEN UNITS. Q21's finding 5 recorded
// `public-sweep.spec.ts` red on `/finder` and deliberately did not decide it; W274 found the
// failure had been sitting there since W227 — **forty-seven units** — because nothing in the gate
// ran it. A suite outside the gate does not stay green; it stays UNKNOWN, and then somebody
// discovers it is red and cannot tell which of forty-seven units did it.
//
// IT WAS NEVER TOO SLOW, WHICH IS THE PART WORTH MEASURING RATHER THAN ASSUMING. The whole suite
// is 4m48s on this container, of which ~45s is the production build it drives. Verify goes from
// about two minutes to about seven. For a loop that fires hourly and lands one unit a firing,
// seven minutes is not the constraint — and the alternative has already cost one session to
// diagnose a forty-seven-unit-old failure.
//
// SO THE GATE RUNS ALL OF IT, AND THE REGISTER IS WHAT KEEPS THAT TRUE. The unit's gate offers a
// choice — run the page suite, OR state in a checked register exactly which specs are excluded and
// why. Both are here, and the second is the reason the first survives: an exclusion is now
// something somebody writes down with a reason, rather than a `--grep` nobody notices.
//
// FOUR WAYS A SPEC CAN BE SILENTLY DROPPED, AND ALL FOUR ARE CHECKED. This matters more than the
// script edit, because the script edit is one line anybody can undo:
//
//   1. The verify script stops chaining the suite. Read from `package.json`, not asserted.
//   2. The e2e script grows a filter — `--grep`, a spec path, a `--project`. A gate that runs
//      "the page suite" while the script names one file is the shape this tree keeps finding.
//   3. The Playwright config grows `testIgnore`, `grep` or `grepInvert`, which excludes specs
//      without touching either script.
//   4. A spec file is added and nothing notices. The register is checked against the tree in both
//      directions, so a new spec is covered the moment it lands.
//
// EXCLUSIONS TODAY: NONE. `EXCLUDED_SPECS` is empty and the test asserts it, which is deliberate —
// an empty register that nobody asserts is empty is indistinguishable from one nobody maintains.
//
// KNOWN BOUND, stated: this checks that the suite is RUN, not that any spec asserts anything worth
// asserting. A spec that navigates to a page and asserts nothing satisfies every check here. That
// is W284's question — which routes the suite actually opens — and it is answered one register
// over rather than restated here.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads `package.json`, the Playwright config and
// the names of spec files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { pageSpecFiles } from "./tree-walks";

/** The npm script the gate must chain, and the one that must stay unfiltered. */
export const E2E_SCRIPT = "e2e";
export const VERIFY_SCRIPT = "verify";

/**
 * Specs the gate deliberately does not run, each with the reason.
 *
 * Empty, and asserted empty. The register exists so that the first exclusion has to be an argument
 * somebody writes rather than a flag somebody adds.
 */
export const EXCLUDED_SPECS: Readonly<Record<string, string>> = {};

/** Why the whole suite is in the gate rather than a fast subset of it. */
export const WHY_ALL_OF_IT =
  "A subset is a register nobody declared: whoever picks it picks by what is fast today, and the " +
  "specs left out are exactly the ones nobody is watching. `public-sweep.spec.ts` was red for " +
  "forty-seven units for that reason. The whole suite is 4m48s, which is cheaper than one session " +
  "spent bisecting a failure of unknown age.";

export interface SuiteFilter {
  /** Where the filter was found — a script name or the Playwright config. */
  source: string;
  /** The filtering token itself, so the failure names what to remove. */
  token: string;
}

/** The scripts block of `package.json`, read rather than assumed. */
export function scriptsOf(packageJson: string): Record<string, string> {
  const parsed = JSON.parse(packageJson) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

/**
 * Does the verify gate chain the page suite? Derived from the script, not declared.
 *
 * The trailing guard is not decoration, and W275's own test found it: `\bpnpm e2e\b` MATCHES
 * `pnpm e2e:debug`, because a word boundary sits happily before a colon. A gate chaining a
 * headed debug variant would have satisfied the check that exists to prove the suite runs —
 * the near-miss shape this unit is about, in the function asserting it cannot happen.
 */
export function verifyRunsPageSuite(packageJson: string): boolean {
  const verify = scriptsOf(packageJson)[VERIFY_SCRIPT] ?? "";
  return new RegExp(`\\bpnpm ${E2E_SCRIPT}(?![\\w:-])`).test(verify);
}

/**
 * Anything that would narrow the suite to less than all of it.
 *
 * Both the script and the config, because they are two independent ways to exclude a spec and a
 * check that read only one would be satisfied while the other quietly dropped half the suite.
 */
export function suiteFilters(packageJson: string, playwrightConfig: string): SuiteFilter[] {
  const found: SuiteFilter[] = [];
  // Both scripts: a filter is as effective appended to the verify chain as it is inside the e2e
  // script, and a scan that read only one would be satisfied while the gate ran four specs.
  const scripts = scriptsOf(packageJson);
  for (const name of [E2E_SCRIPT, VERIFY_SCRIPT]) {
    const script = scripts[name] ?? "";
    for (const token of ["--grep", "--project", "--shard", ".spec.ts"]) {
      if (script.includes(token)) found.push({ source: `package.json#scripts.${name}`, token });
    }
  }
  // Comments are subtracted first, and W173's rule applies: this file's own prose names every one
  // of these tokens, so a scan over raw text would report the config for quoting them.
  const code = playwrightConfig.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const token of ["testIgnore", "grepInvert", "grep:"]) {
    if (code.includes(token)) found.push({ source: "playwright.config.ts", token });
  }
  return found;
}

export interface PageSuiteCoverage {
  /** Specs in the tree that the gate runs. */
  run: string[];
  /** Specs excluded with a declared reason. */
  excluded: string[];
  /** Declared exclusions naming a spec that is not in the tree. */
  stale: string[];
  /** Exclusions declared with no reason worth the name. */
  unreasoned: string[];
}

/**
 * Every spec in the tree, against the register — both directions, W102's shape.
 *
 * A spec added and not excluded is RUN, which is the safe default and the opposite of how the
 * suite behaved before this unit: membership used to be whatever the script happened to match.
 */
export function pageSuiteCoverage(root: string): PageSuiteCoverage {
  const specs = pageSpecFiles(root);
  const declared = Object.keys(EXCLUDED_SPECS);
  return {
    run: specs.filter((s) => !(s in EXCLUDED_SPECS)),
    excluded: specs.filter((s) => s in EXCLUDED_SPECS).sort(),
    stale: declared.filter((s) => !specs.includes(s)).sort(),
    unreasoned: declared.filter((s) => (EXCLUDED_SPECS[s] ?? "").trim().length < 40).sort(),
  };
}

/** Everything wrong with the gate's coverage of the rendered surface, as one list. */
export function pageSuiteViolations(root: string): string[] {
  const pkg = readFileSync(path.join(root, "package.json"), "utf8");
  const config = readFileSync(path.join(root, "playwright.config.ts"), "utf8");
  const coverage = pageSuiteCoverage(root);
  const out: string[] = [];
  if (!verifyRunsPageSuite(pkg)) out.push(`${VERIFY_SCRIPT} does not chain \`pnpm ${E2E_SCRIPT}\``);
  if (coverage.run.length === 0) out.push("the gate runs no spec at all");
  for (const filter of suiteFilters(pkg, config)) {
    out.push(`${filter.source} narrows the suite with \`${filter.token}\``);
  }
  for (const spec of coverage.stale) out.push(`${spec} is excluded and does not exist`);
  for (const spec of coverage.unreasoned) out.push(`${spec} is excluded without a reason`);
  return out.sort();
}

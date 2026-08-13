// W275 verify gate: "`pnpm verify` runs the page suite or states in a checked register exactly
// which specs it excludes and why; a deliberately broken page fails the gate, proved by breaking
// one."
//
// Both halves are here — the gate runs all of it, and the register says so in a form that fails
// when it stops being true. The third clause is a mutation and lives in the unit's record: a
// heading removed from the console dashboard turns `dashboard.spec.ts` red, which is now a verify
// failure rather than something nobody would run.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  E2E_SCRIPT,
  EXCLUDED_SPECS,
  VERIFY_SCRIPT,
  WHY_ALL_OF_IT,
  pageSuiteCoverage,
  pageSuiteViolations,
  scriptsOf,
  suiteFilters,
  verifyRunsPageSuite,
} from "./page-suite";
import { pageSpecFiles } from "./tree-walks";

const ROOT = path.resolve(__dirname, "../..");
const PKG = readFileSync(path.join(ROOT, "package.json"), "utf8");
const CONFIG = readFileSync(path.join(ROOT, "playwright.config.ts"), "utf8");

describe("W275 the rendered surface is in the gate", () => {
  it("chains the page suite from the verify script itself", () => {
    // Read from `package.json` rather than asserted in prose. The one-line edit this unit makes is
    // also the one-line edit somebody could undo, so the check is on the artefact.
    expect(verifyRunsPageSuite(PKG), "`pnpm verify` no longer runs the page suite").toBe(true);
    const verify = scriptsOf(PKG)[VERIFY_SCRIPT] ?? "";
    expect(verify).toContain("pnpm typecheck");
    expect(verify).toContain("pnpm audit:gate");
  });

  it("runs every spec in the tree, with none excluded", () => {
    const coverage = pageSuiteCoverage(ROOT);
    expect(coverage.excluded, "a spec is excluded from the gate").toEqual([]);
    expect(coverage.stale).toEqual([]);
    expect(coverage.unreasoned).toEqual([]);
    // Non-vacuity, and it is the assertion that matters: "nothing excluded" over an empty suite is
    // the same sentence as "nothing excluded" over thirty-four specs.
    expect(coverage.run.length, "the walk found no specs, so nothing above means anything").toBeGreaterThan(30);
    expect(coverage.run).toContain("e2e/public-sweep.spec.ts");
    expect(coverage.run).toContain("e2e/a11y.spec.ts");
  });

  it("refuses nothing overall", () => {
    expect(pageSuiteViolations(ROOT)).toEqual([]);
  });

  it("says why the whole suite rather than a fast subset", () => {
    expect(WHY_ALL_OF_IT).toMatch(/forty-seven units/);
    expect(EXCLUDED_SPECS).toEqual({});
  });
});

describe("W275 the four ways a spec can be dropped without anybody editing the register", () => {
  it("notices a verify script that stopped chaining the suite", () => {
    expect(verifyRunsPageSuite('{"scripts":{"verify":"pnpm typecheck && pnpm test"}}')).toBe(false);
    expect(verifyRunsPageSuite(`{"scripts":{"verify":"pnpm test && pnpm ${E2E_SCRIPT}"}}`)).toBe(true);
    // A script MENTIONING the word is not a script running it — `e2e:debug` must not satisfy this.
    expect(verifyRunsPageSuite('{"scripts":{"verify":"pnpm e2e:debug"}}')).toBe(false);
  });

  it("notices a filter added to the e2e script", () => {
    const withGrep = `{"scripts":{"${E2E_SCRIPT}":"playwright test --grep @fast"}}`;
    expect(suiteFilters(withGrep, "")).toContainEqual({
      source: `package.json#scripts.${E2E_SCRIPT}`,
      token: "--grep",
    });
    const withOneSpec = `{"scripts":{"${E2E_SCRIPT}":"playwright test e2e/landing.spec.ts"}}`;
    expect(suiteFilters(withOneSpec, "").map((f) => f.token)).toContain(".spec.ts");
  });

  it("notices a filter added to the Playwright config", () => {
    expect(suiteFilters(PKG, 'export default { testIgnore: "**/slow.spec.ts" };').map((f) => f.token)).toEqual([
      "testIgnore",
    ]);
    expect(suiteFilters(PKG, "export default { grepInvert: /@slow/ };").map((f) => f.token)).toEqual([
      "grepInvert",
    ]);
  });

  it("subtracts comments before scanning the config, and proves the subtraction is real", () => {
    // W173's rule, and this file needs it: the config's own comments could name `testIgnore` while
    // the config sets nothing, and a raw scan would report the tree for describing the ban. The
    // guard is that the SAME text fires when it is code and not when it is a comment.
    const asComment = "// never add testIgnore here\nexport default {};";
    const asCode = 'export default { testIgnore: "x" };';
    expect(suiteFilters(PKG, asComment), "a comment was read as a filter").toEqual([]);
    expect(suiteFilters(PKG, asCode).length, "the subtraction removed the code too").toBe(1);
    expect(suiteFilters(PKG, "/* testIgnore */\nexport default {};")).toEqual([]);
  });

  it("notices a spec arriving, because the walk takes a root", () => {
    // W282's rule. The register is checked against the tree, so a spec added tomorrow is RUN by
    // default and covered by this test the moment it lands — the safe direction, and the opposite
    // of how membership worked when it was whatever the script happened to match.
    const specs = pageSpecFiles(ROOT);
    expect(specs.length).toBeGreaterThan(30);
    expect(specs.every((s) => s.startsWith("e2e/") && s.endsWith(".spec.ts"))).toBe(true);
    expect(pageSpecFiles(path.join(ROOT, "src")), "a tree with no e2e directory reads as no specs").toEqual([]);
  });
});

describe("W275 the config the gate depends on", () => {
  it("points the suite at the whole e2e directory", () => {
    expect(CONFIG).toMatch(/testDir:\s*"e2e"/);
  });

  it("drives a production build rather than a dev server", () => {
    // What the gate is actually asserting about: the specs run against `next build && next start`,
    // so a page that only works in dev fails here. Worth pinning, because moving the webServer to
    // `next dev` would keep every spec green and stop the gate meaning what it says.
    expect(CONFIG).toMatch(/next build/);
    expect(CONFIG).toMatch(/next start/);
  });
});

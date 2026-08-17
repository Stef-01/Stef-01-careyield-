// W298 verify gate: "code-review, security-review and simplify run over the quarter's diff; every
// finding recorded with a disposition and a date, and the accepted ones carry a review date."
//
// THE FINDINGS ARE RE-DERIVED HERE RATHER THAN QUOTED. Each of the three is a claim about the tree
// — a predicate with no root, a count that moves, a citation format implemented five times — and
// each is checked against the tree, so a finding that gets fixed goes STALE and fails rather than
// sitting in the register describing code that has changed. That is the half of a review record
// that usually rots, and W258's rule applies to a finding exactly as it does to a citation.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FINDINGS,
  HARDENING_BOUND,
  NOT_REVIEWED,
  QUARTER,
  REVIEWED_UNITS,
  SELF_REVIEWED,
  unaccountedUnits,
  undisposed,
} from "./hardening-q23";
import { knownUnits } from "./unit-headers";
import { separatorDiff } from "./citations";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("W298 every finding is disposed, with a date and a lens", () => {
  it("disposes all of them", () => {
    expect(undisposed(FINDINGS)).toEqual([]);
    for (const finding of FINDINGS) {
      expect(finding.raisedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(finding.what.length, `${finding.id} says too little to act on`).toBeGreaterThan(200);
    }
  });

  it("runs all three lenses the gate names", () => {
    expect([...new Set(FINDINGS.map((f) => f.lens))].sort()).toEqual([
      "code-review",
      "security-review",
      "simplify",
    ]);
  });

  it("gives every accepted finding a review date in the future", () => {
    // W294's finding, applied to this register on the day it was written: a `reviewBy` that is
    // only shape-checked is decoration. Compared against a real clock rather than a literal.
    const today = new Date().toISOString().slice(0, 10);
    const accepted = FINDINGS.filter((f) => f.disposition.kind === "accepted");
    expect(accepted.length).toBeGreaterThan(0);
    for (const finding of accepted) {
      const reviewBy = (finding.disposition as { reviewBy: string }).reviewBy;
      expect(reviewBy > today, `${finding.id} is accepted past its own review date`).toBe(true);
    }
  });

  it("blames a unit the ledger has, and none outside the quarter", () => {
    const units = knownUnits(LEDGER);
    for (const finding of FINDINGS) {
      const n = Number(finding.unit.slice(1));
      expect(units.has(n), `${finding.id} blames ${finding.unit}, which the ledger does not have`).toBe(true);
      expect(n).toBeGreaterThanOrEqual(QUARTER.first);
      expect(n).toBeLessThanOrEqual(QUARTER.last);
    }
  });

  it("pins the range instead of ending at HEAD, and three units landed under it", () => {
    // W285's lesson, and this pass met the event it exists for: W295, W296 and W297 all landed
    // while this was being written. A range ending at HEAD would have silently claimed them.
    expect(QUARTER.diffHead).toMatch(/^[0-9a-f]{7,40}$/);
    expect(QUARTER.diffBase).toMatch(/^[0-9a-f]{7,40}$/);
    expect(QUARTER.diffHead).not.toBe("HEAD");
  });
});

describe("W298 the quarter is accounted for, in both directions", () => {
  it("leaves no done Q23 unit unread and unnamed", () => {
    expect(unaccountedUnits(LEDGER)).toEqual([]);
  });

  it("reads eleven and names the two it does not, with reasons", () => {
    expect(REVIEWED_UNITS.length).toBeGreaterThan(10);
    expect(Object.keys(NOT_REVIEWED).sort()).toEqual(["W298", "W299"]);
    for (const [unit, why] of Object.entries(NOT_REVIEWED)) {
      expect(why.length, `${unit} is excluded without a reason`).toBeGreaterThan(60);
    }
  });

  it("declares which units the reviewer wrote, rather than claiming independence", () => {
    // The uncomfortable half, and it is checked because a register that hid it would be claiming
    // an independence it does not have. Every self-reviewed unit must also be in the reviewed set.
    expect(Object.keys(SELF_REVIEWED).sort()).toEqual(["W292", "W293", "W296"]);
    for (const unit of Object.keys(SELF_REVIEWED)) {
      expect(REVIEWED_UNITS).toContain(unit);
    }
    // And two of the three findings land on this session's own work, which is the evidence that
    // the overlap was not resolved by going easy on it.
    const own = FINDINGS.filter((f) => f.what.includes("W296") || f.what.includes("W293"));
    expect(own.length).toBeGreaterThan(1);
  });

  it("says what three lenses over a quarter of registers does not prove", () => {
    expect(HARDENING_BOUND).toMatch(/does not/i);
    expect(HARDENING_BOUND).toMatch(/W296/);
  });
});

describe("W298 each finding is re-derived from the tree, so a fixed one goes stale", () => {
  it("CR-1: the lifting predicate still takes no root, and still closes over process.cwd()", () => {
    const bounds = read("src/quality/bounds.ts");
    expect(bounds, "`stillOpen` now takes a root — CR-1 is fixed and stale").toContain(
      "stillOpen: () => boolean",
    );
    expect(bounds, "the module-scope cwd is gone — CR-1 is fixed and stale").toMatch(
      /const ROOT = process\.cwd\(\);/,
    );
    // And the two predicates that read it, which is what makes the finding concrete rather than
    // a remark about a type.
    expect(bounds).toContain("pageSpecFiles(ROOT)");
    expect(bounds).toContain("sourceModules(ROOT)");
  });

  it("CR-2: the four counts that fired are bounds now, not equalities", () => {
    const drives = read("src/quality/assertion-drives.test.ts");
    const spots = read("src/quality/blind-spots.test.ts");
    expect(drives, "a pinned count came back to assertion-drives").not.toMatch(
      /expect\(Object\.keys\(ASSERTION_DRIVES\)\)\.toHaveLength\(/,
    );
    expect(drives).toContain("toBeGreaterThanOrEqual");
    expect(spots, "a pinned count came back to blind-spots").not.toMatch(
      /expect\(ofKind\("demonstrated"\)\)\.toHaveLength\(/,
    );
    // The exhaustiveness identity beside them is what reads the register, and it must survive:
    // restating a count as a bound is only right because something else reads the whole set.
    expect(drives).toContain("TREE_DERIVED_REGISTERS.length");
    expect(spots).toContain("falseBounds()");
  });

  it("SIMP-1: the resolver is in one place, and a fifth cannot arrive quietly", () => {
    // W301 fixed this, so the re-derivation flips: it asserted the four implementations were still
    // there, and now asserts the consolidation holds. A revert puts the finding back rather than
    // leaving the register describing a tree that has moved on.
    expect(separatorDiff(ROOT)).toEqual({ undeclared: [], stale: [] });
    const citations = read("src/quality/citations.ts");
    expect(citations).toContain("export function resolveCitation");
    // The three causes stay distinct — folding them is what made two of the four worst.
    for (const cause of ["not a <file>", "names a file that does not exist", "does not contain that assertion"]) {
      expect(citations).toContain(cause);
    }
    // And the three that used to resolve inline do not any more.
    for (const site of ["src/quality/register-census.test.ts", "src/privacy/adm-y5.test.ts"]) {
      expect(read(site), `${site} resolves a citation inline again`).not.toMatch(
        /\.split\(\s*["'] :: ["']\s*\)/,
      );
    }
  });

  it("SEC-1: the three checked properties still hold", () => {
    // The security lens re-derived, because an accepted finding whose evidence has rotted is the
    // acceptance W294 was written about.
    const sampler = read("src/quality/mutation-sampling.test.ts");
    // An argument ARRAY rather than a shell string — the property, asserted structurally.
    expect(sampler).toContain('pexec("npx", ["vitest", "run"');
    expect(sampler).toContain("mkdtempSync");
    expect(sampler).toContain("rmSync");
    // No shipped module in the quarter spawns anything.
    for (const module of ["bounds", "blind-spots", "acceptances", "empty-list-sweep", "negative-probes"]) {
      expect(read(`src/quality/${module}.ts`), `${module} spawns a process`).not.toContain(
        "child_process",
      );
    }
  });
});

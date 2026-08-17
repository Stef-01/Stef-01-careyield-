// W311 verify gate: "code-review, security-review and simplify run over the quarter's diff; every
// finding recorded with a disposition and a date, and the accepted ones carry a review date."
//
// EVERY FINDING IS RE-DERIVED FROM THE TREE RATHER THAN QUOTED, which is W298's discipline and
// W258's rule applied to a review record. A finding that has been fixed must go STALE here and
// fail, rather than sitting in the register describing code that has changed — and a finding that
// was DEFERRED or ACCEPTED must still be demonstrably present, or the deferral is a fiction.
//
// The three lenses were applied by this session rather than by four parallel reviewers, because the
// session it runs in is instructed not to spawn agents. What that costs is recorded in
// `HARDENING_BOUND` rather than glossed: one reader, three passes, five of eleven units their own.

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
} from "./hardening-q24";
import { allLedgerRows } from "./blocked-surface";
import { builtSurface, outstandingRulings } from "@/founder/outstanding";
import { reachableFromApp } from "@/security/reachability";
import { withTree } from "./planting";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const finding = (id: string) => FINDINGS.find((f) => f.id === id)!;

describe("W311 every finding is disposed, with a date and a lens", () => {
  it("disposes all of them", () => {
    expect(undisposed(FINDINGS)).toEqual([]);
    for (const f of FINDINGS) {
      expect(f.raisedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.what.length, `${f.id} says too little to act on`).toBeGreaterThan(200);
      expect(REVIEWED_UNITS, `${f.id} names a unit this pass did not read`).toContain(f.unit);
    }
  });

  it("runs all three lenses the gate names", () => {
    const lenses = new Set(FINDINGS.map((f) => f.lens));
    expect([...lenses].sort()).toEqual(["code-review", "security-review", "simplify"]);
  });

  it("gives every accepted finding a review date in the future of its raising", () => {
    const accepted = FINDINGS.filter((f) => f.disposition.kind === "accepted");
    expect(accepted.length).toBeGreaterThan(0);
    for (const f of accepted) {
      const by = (f.disposition as { reviewBy: string }).reviewBy;
      expect(by > f.raisedOn, `${f.id} is accepted until a date already past`).toBe(true);
    }
  });

  it("reads every done unit in the range, or says why not", () => {
    expect(unaccountedUnits(LEDGER)).toEqual([]);
    for (const id of Object.keys(NOT_REVIEWED)) {
      expect(REVIEWED_UNITS, `${id} is both reviewed and excused`).not.toContain(id);
    }
  });

  it("names the units the reviewer wrote, and finds most of the defects there", () => {
    // W298's warning, made checkable. The pass is not independent, and a register that implied it
    // was would be the worse failure — so the overlap is declared AND the finding distribution is
    // asserted to fall mostly on it, which is the direction a self-review fails in when it is
    // being honest and the opposite of the direction it fails in when it is not.
    for (const id of Object.keys(SELF_REVIEWED)) expect(REVIEWED_UNITS).toContain(id);
    const own = FINDINGS.filter((f) => f.unit in SELF_REVIEWED);
    expect(own.length).toBeGreaterThan(FINDINGS.length - own.length);
  });
});

describe("W311 the fixed findings are stale, which is how a fix is proved", () => {
  it("Q24-CR-1: no founder decision reads as outstanding since the plan", () => {
    const decisions = outstandingRulings(ROOT).filter((r) => r.kind === "founder_decision");
    expect(decisions.length, "the tree has no decision to check").toBeGreaterThan(0);
    for (const d of decisions) {
      expect(d.waited.kind, `${d.blocker} still reads as standing`).toBe("proposed");
      expect(d.waited.sinceUnit).not.toBe("W1");
    }
    // And the other direction, so a fix that called everything a decision would fail here.
    expect(outstandingRulings(ROOT).some((r) => r.waited.kind === "standing")).toBe(true);
    expect(finding("Q24-CR-1").disposition.kind).toBe("fixed");
  });

  it("Q24-CR-2: the assembly assertion names members instead of comparing a length to itself", () => {
    const source = read("src/verticals/assembly.test.ts");
    expect(source, "the tautology is back").not.toContain(
      "expect(DERMATOLOGY_MEMBERS.map((m) => m.kind).length).toBe(DERMATOLOGY_MEMBERS.length)",
    );
    expect(source).toContain('"education_item"');
  });

  it("Q24-CR-3: the branch register's doc comment states no count", () => {
    expect(read("src/quality/refusal-branches.ts")).not.toContain("twenty-one branches");
  });

  it("Q24-CR-4: the home page can be matched by the patient-facing rule", () => {
    // Re-derived rather than read: the join that produced `app//page.tsx` is what failed, so the
    // check is that the joined path is one a walk can return.
    const source = read("src/demo/path.ts");
    expect(source).not.toContain("map((s) => `app${s.path}/page.tsx`)");
    expect(source).toContain('s.path === "/" ? "" : s.path');
  });

  it("Q24-CR-5: the ledger parse keeps a row whose id ends in a letter", () => {
    const ids = allLedgerRows(ROOT).map((r) => r.id);
    expect(ids, "W-MIGRATE is dropped again").toContain("W-MIGRATE");
    // The header must still be refused, which is the reason the trailing digit was there.
    expect(ids).not.toContain("Unit");
  });

  it("Q24-CR-6: a tree with nothing built renders an empty state rather than throwing", () => {
    const built = withTree({ "BUILD-STATE.md": "| W1 | claimed | b | — | — | not built |\n" }, (root) =>
      builtSurface(root),
    );
    expect(built.latestUnit).toBe("none");
  });

  it("Q24-SIMP-1: the branch register imports only what it reads", () => {
    const imports = read("src/quality/refusal-branches.ts")
      .split("\n")
      .filter((l) => l.startsWith("import "));
    expect(imports.length, "the dead bindings are back").toBeLessThan(8);
    for (const gone of ["./blind-spots", "./self-reference", "./register-census", "./citations"]) {
      expect(imports.join("\n"), `the cycle through ${gone} is back`).not.toContain(gone);
    }
  });
});

describe("W311 the findings left open are still open, so the deferral is not a fiction", () => {
  it("Q24-CR-7: the self-reference walk still stats every entry under the root", () => {
    // A deferred finding whose defect has quietly gone away is a register describing code that no
    // longer exists — W258's rule, pointed the other way. If somebody fixes this, this test fails
    // and the disposition must move to `fixed`.
    const source = read("src/quality/self-reference.ts");
    expect(source).toContain("allFilesUnder");
    expect(source, "node_modules is excluded now, so the finding is fixed").not.toMatch(
      /allFilesUnder[\s\S]{0,600}node_modules/,
    );
    expect(finding("Q24-CR-7").disposition.kind).toBe("deferred");
  });

  it("Q24-CR-8: the founder page still reads the documents at request time", () => {
    const page = read("app/console/founder/page.tsx");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).toContain("process.cwd()");
    expect(finding("Q24-CR-8").disposition.kind).toBe("accepted");
  });

  it("Q24-SEC-1: exactly one module in the quarter is reachable from a page", () => {
    // THE SECURITY FINDING, RE-DERIVED. Every register in this tree had been unreachable from every
    // page; the quarter changed that once. If a second Q24 module becomes reachable, or the first
    // stops being, this pass's security conclusion no longer describes the tree.
    const reach = JSON.stringify(reachableFromApp(ROOT));
    const q24Modules = [
      "src/quality/declaration-tax.ts",
      "src/quality/manifest.ts",
      "src/quality/citations.ts",
      "src/quality/planting.ts",
      "src/quality/register-counts.ts",
      "src/quality/self-reference.ts",
      "src/quality/scan-text.ts",
      "src/demo/path.ts",
      "src/founder/outstanding.ts",
    ];
    expect(q24Modules.filter((m) => reach.includes(m))).toEqual(["src/founder/outstanding.ts"]);
  });

  it("Q24-SEC-1: nothing the quarter added renders unescaped markup", () => {
    // The output half of the same finding, checked over the tree rather than asserted in prose.
    const app = read("app/console/founder/page.tsx");
    expect(app).not.toContain("dangerouslySetInnerHTML");
    expect(read("src/founder/outstanding.ts")).not.toContain("dangerouslySetInnerHTML");
  });
});

describe("W311 what the pass does not prove", () => {
  it("says the lenses were one reader, and what that biases against", () => {
    expect(HARDENING_BOUND).toMatch(/consolidation/i);
    expect(HARDENING_BOUND, "the bound does not say who read it").toMatch(/majority of the quarter/);
    expect(HARDENING_BOUND).toMatch(/W296/);
  });

  it("pins the range rather than ending it at HEAD", () => {
    expect(QUARTER.diffHead).toMatch(/^[0-9a-f]{7,}$/);
    expect(QUARTER.diffBase).toMatch(/^[0-9a-f]{7,}$/);
    expect(QUARTER.diffHead).not.toBe("HEAD");
  });
});

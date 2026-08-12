// W256: the five-year full-system audit, as sweeps that RUN.
//
// The gate says every sweep must be RE-RUN FROM SOURCE rather than carried from AUDIT-Y4, and
// that is a claim about method which a document cannot keep. W206 described its sweeps in prose
// and ran them by hand; the numbers were right on the day and nothing stops them being carried
// forward next year by somebody who trusts the previous audit. So the sweeps live here and
// execute: the document records what they found, and this file is what makes the finding a fact
// about the tree rather than about a reading of it.
//
// THE WHOLE TREE, NOT A DIFF. Every sweep below walks `src/` and `app/` from the root. That is
// W51's method and Y4-1 is the argument for it: the defect lived in Year-1 code that Year 4 never
// touched, and became a live leak because of something Year 3 did somewhere else.
//
// INDEPENDENCE IS DERIVED, NOT ASSERTED. `builder-A` wrote roughly half this tree and half of
// Year 5, and the count comes off the ledger rather than out of a sentence — a reviewer's claim
// about their own independence is the last claim to take on trust.

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { credentialShapedLiterals } from "@/interop/credentials";
import { patientMarkersIn } from "@/api/refusals";
import { API_REFUSAL_COPY } from "@/api/surface";
import { STORE_READS } from "@/tenancy/store-reads";

const ROOT = process.cwd();
/**
 * The audit, normalised for quotation checks.
 *
 * THIRD RECURRENCE IN THIS QUARTER, so it is written down rather than patched again: W245 hit it
 * on a blockquote, W257 on a wrapped inline quotation, and this on backticks. Markdown wraps and
 * decorates, so a sentence quoted from a document is not a substring of the file — checking the
 * raw text fails against a document that does contain the words, which is the worst kind of test
 * because the fix looks like editing the prose.
 */
const AUDIT_RAW = readFileSync(path.join(ROOT, "docs", "AUDIT-Y5.md"), "utf8");
const AUDIT = AUDIT_RAW.replace(/`/g, "").replace(/\s+/g, " ");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/** Every source file under a root, tests included or not. The sweep walks, it does not list. */
function sourceFiles(root: string, opts: { tests: boolean }): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next") continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry)) {
        const isTest = /\.test\.tsx?$/.test(entry) || /\.spec\.tsx?$/.test(entry);
        if (opts.tests || !isTest) out.push(full);
      }
    }
  };
  walk(path.join(ROOT, root));
  return out.sort();
}

const rel = (file: string) => path.relative(ROOT, file).split(path.sep).join("/");

/** Comments stripped, so prose ABOUT a pattern is not counted as the pattern — W198's collision. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("W256 the gate registries, re-derived from source", () => {
  it("finds every SHIPPED_ registry by walking, and only one is non-empty", () => {
    // W206 counted thirteen. Y5 added seven more, which is exactly why this is a walk rather than
    // a number carried forward — a list would still say thirteen and would still read as complete.
    const empty: string[] = [];
    const nonEmpty: string[] = [];
    for (const file of sourceFiles("src", { tests: false })) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/export const (SHIPPED_[A-Z_]+)[^=]*=\s*(\[|\{)/g)) {
        const tail = text.slice(match.index! + match[0].length).trimStart();
        const closer = match[2] === "[" ? "]" : "}";
        (tail.startsWith(closer) ? empty : nonEmpty).push(`${rel(file)}::${match[1]}`);
      }
    }
    expect(empty.length + nonEmpty.length, "the walk found no registries at all").toBeGreaterThan(19);
    // The single legitimate exception, named by AUDIT-Y4 and re-checked here rather than carried.
    expect(nonEmpty).toEqual(["src/registers/escalation.ts::SHIPPED_TRIGGERS"]);
    expect(AUDIT).toContain("src/registers/escalation.ts");
  });

  it("keeps the one non-empty registry free of clinical content", () => {
    // Its triggers are operational — a free-text reply, a complaint, repeated non-attendance —
    // and none carries a condition code or states advice. Re-checked, not carried.
    const source = readFileSync(path.join(ROOT, "src", "registers", "escalation.ts"), "utf8");
    expect(source).toContain("conditionCode: null");
    expect(code(source)).not.toMatch(/conditionCode:\s*"/);
  });
});

describe("W256 the whole-tree sweeps", () => {
  it("has no hardcoded date comparison in shipped source", () => {
    // W205 found one in a test — `reviewBy > "2026-08-11"`, so no copy acceptance could expire.
    // Swept over source and app, both, from the root.
    const hits: string[] = [];
    for (const file of [...sourceFiles("src", { tests: false }), ...sourceFiles("app", { tests: false })]) {
      if (/[<>]=?\s*["']20\d{2}-\d{2}-\d{2}["']/.test(code(readFileSync(file, "utf8")))) {
        hits.push(rel(file));
      }
    }
    expect(hits, `frozen clock in: ${hits.join(", ")}`).toEqual([]);
  });

  it("has no credential-shaped literal anywhere, by W242's own scanner", () => {
    // Composed rather than re-implemented. W254 tripped this scanner with its own fixture, which
    // is the evidence it reaches test files too.
    const hits = [...sourceFiles("src", { tests: true }), ...sourceFiles("app", { tests: true })]
      .flatMap((file) => credentialShapedLiterals(rel(file), readFileSync(file, "utf8")));
    expect(hits.map((h) => `${h.file}: ${h.match}`)).toEqual([]);
  });

  it("has no patient marker in any API refusal, by W255's own scanner", () => {
    for (const [refusal, copy] of Object.entries(API_REFUSAL_COPY)) {
      expect(patientMarkersIn(copy), refusal).toEqual([]);
    }
  });

  it("leaves no focused or skipped test anywhere", () => {
    // A `.only` left in place makes a green run a statement about one file.
    const hits = [...sourceFiles("src", { tests: true }), ...sourceFiles("e2e", { tests: true })]
      .filter((file) => /\b(it|test|describe)\.only\b/.test(code(readFileSync(file, "utf8"))))
      .map(rel);
    expect(hits, `focused tests in: ${hits.join(", ")}`).toEqual([]);
  });

  it("closes the assertion that could not fail, and finds no other unpaired one", () => {
    // Y5-1. A lower bound on a quantity that is non-negative by construction can never fail, so
    // it reads as coverage and checks nothing. Every `toBeGreaterThanOrEqual(0)` in the tree must
    // now be paired with an upper bound in the same test body.
    const unpaired: string[] = [];
    for (const file of sourceFiles("src", { tests: true }).filter((f) => /\.test\.ts$/.test(f))) {
      const text = readFileSync(file, "utf8");
      for (const block of text.split(/\n  it\(|\n  test\(/)) {
        const lows = [...block.matchAll(/expect\(([^)]+?)\)[^;]*?\.toBeGreaterThanOrEqual\(0\)/g)];
        for (const low of lows) {
          const subject = low[1]!.trim();
          const hasUpper = new RegExp(
            `expect\\(\\s*${subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^)]*\\)[^;]*?\\.toBeLessThan`,
          ).test(block);
          if (!hasUpper) unpaired.push(`${rel(file)}: ${subject}`);
        }
      }
    }
    expect(unpaired, `assertions that cannot fail: ${unpaired.join(", ")}`).toEqual([]);
  });
});

describe("W256 what AUDIT-Y4 carried into Year 5", () => {
  it("closes PRIV-3's outstanding half: src/audit/store.ts is now scoped and declared", () => {
    // AUDIT-Y4 said plainly that its sweep "did not reach" this module. W209 did. Checked against
    // W209's register rather than against the previous audit's sentence — which is the whole
    // instruction this unit was given.
    const declared = STORE_READS.filter((r) => r.module === "src/audit/store.ts");
    expect(declared.length, "src/audit/store.ts is still outside W209's register").toBeGreaterThan(0);
    for (const read of declared) {
      expect(
        read.kind === "practice_scoped" || read.reason !== undefined,
        `${read.fn} is neither practice-scoped nor given a reason`,
      ).toBe(true);
    }
    expect(AUDIT).toContain("AUDIT-Y4 said its sweep did not reach");
  });

  it("re-checks the register completeness claim over the registers that exist now", () => {
    // Both-directions registers, named and required to exist. A register that was deleted while
    // its claim stayed in an audit is the failure this checks for.
    for (const register of [
      "src/compliance/surfaces.ts",
      "src/privacy/record-classes.ts",
      "src/quality/order-independence.ts",
      "src/compliance/cdss-boundary.ts",
      "src/privacy/automated-decisions.ts",
      "src/tenancy/store-reads.ts",
      "src/quality/latent-findings.ts",
    ]) {
      expect(() => readFileSync(path.join(ROOT, register), "utf8"), register).not.toThrow();
    }
  });
});

describe("W256 the reviewer's independence, derived from the ledger", () => {
  it("counts this reviewer's own units rather than claiming to be independent", () => {
    // THE HONEST FORM. A reviewer's statement about their own independence is the last claim to
    // take on trust, so the numbers come off the ledger and the document quotes them.
    const done = [...LEDGER.matchAll(/^\| (W\d+) \| done \| (builder-[AB]) \|/gm)].map((m) => ({
      unit: Number(m[1]!.slice(1)),
      by: m[2]!,
    }));
    const mine = done.filter((d) => d.by === "builder-A");
    const y5 = done.filter((d) => d.unit >= 209 && d.unit <= 260);
    const y5Mine = y5.filter((d) => d.by === "builder-A");

    expect(done.length, "the ledger records no completed units").toBeGreaterThan(200);
    // Roughly half, which is what the document says — and it says it as a fraction rather than as
    // the word "independent".
    expect(mine.length / done.length).toBeGreaterThan(0.4);
    expect(mine.length / done.length).toBeLessThan(0.7);
    expect(y5Mine.length / y5.length).toBeGreaterThan(0.4);
    expect(y5Mine.length / y5.length).toBeLessThan(0.7);
    expect(AUDIT).toContain("This audit is not independent");
  });

  it("says which method the lack of independence forces", () => {
    // W206's argument, re-derived rather than carried: self-review is the weakest form, so the
    // method leans on sweeps that execute and on hunting known bug classes.
    expect(AUDIT).toContain("Self-review is the weakest form");
    expect(AUDIT).toContain("src/quality/audit-y5.test.ts");
  });
});

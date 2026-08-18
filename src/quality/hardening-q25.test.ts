// W331 verify gate: "`code-review`, `security-review` and `simplify` over W313–W325; every finding
// disposed with a clock per W318; the pass's own bound stated."
//
// EVERY FINDING IS RE-DERIVED FROM THE TREE, not read back from the record. W258's rule: a fixed
// finding whose fix has been undone, and an open finding whose defect has quietly gone away, are
// both a register describing code that does not exist. So each `fixed` finding is checked by
// driving the thing it fixed, and each `deferred` one by confirming the defect is still there.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { overdueDispositions } from "./hardening-q22";
import {
  FINDINGS,
  NOT_REVIEWED,
  Q25_HARDENING_BOUND,
  QUARTER,
  REVIEWED_UNITS,
  SELF_REVIEWED,
  unaccountedUnits,
  undisposed,
} from "./hardening-q25";
import { prepareForScan } from "./scan-text";
import { tautologiesIn } from "./tautology-sweep";
import { headerSubjectDefects } from "./unit-headers";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const finding = (id: string) => FINDINGS.find((f) => f.id === id)!;

describe("W331 the pass covers the quarter it claims to", () => {
  it("reads every unit in the range, or says why not", () => {
    expect(unaccountedUnits(read("BUILD-STATE.md"))).toEqual([]);
    expect(REVIEWED_UNITS.length + Object.keys(NOT_REVIEWED).length).toBe(QUARTER.last - QUARTER.first + 1);
  });

  it("pins the range rather than ending it at HEAD", () => {
    // W285's lesson: a range ending at HEAD grows every time another session commits, so the
    // record would claim more than was read. Both ends are commits that exist.
    for (const sha of [QUARTER.diffBase, QUARTER.diffHead]) {
      expect(sha, `${sha} is not a commit-shaped string`).toMatch(/^[0-9a-f]{7,40}$/);
    }
  });

  it("names the units the reader wrote, rather than claiming an independence it has not got", () => {
    expect(Object.keys(SELF_REVIEWED).length).toBeGreaterThan(0);
    for (const unit of Object.keys(SELF_REVIEWED)) {
      expect(REVIEWED_UNITS, `${unit} is self-reviewed and not reviewed`).toContain(unit);
    }
  });

  it("disposes every finding, and every disposition carries a clock", () => {
    // W293: evidenced before it is asserted empty. A deferral whose `why` is blank must be found,
    // or the empty list below says only that nothing was looked at.
    const blank = FINDINGS.map((f, i) =>
      i === 0 ? { ...f, disposition: { kind: "deferred" as const, why: "  ", by: "W999" as const } } : f,
    );
    expect(undisposed(blank), "an undisposed finding is not found, so the empty list means nothing").toEqual([
      FINDINGS[0]!.id,
    ]);
    expect(undisposed()).toEqual([]);
    for (const f of FINDINGS) {
      const d = f.disposition;
      if (d.kind === "deferred") expect(d.by, `${f.id} is deferred to nothing`).toMatch(/^W\d+$/);
      if (d.kind === "accepted") expect(d.reviewBy, `${f.id} is accepted forever`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (d.kind === "fixed") expect(d.evidence.length, `${f.id} claims a fix and shows none`).toBeGreaterThan(150);
    }
  });

  it("has no disposition that has already run out", () => {
    // W318's clock, over this register's own findings rather than only over older ones.
    expect(overdueDispositions(read("BUILD-STATE.md"), FINDINGS, "2026-08-18")).toEqual([]);
  });
});

describe("W331 each finding is re-derived, so a fix that came undone fails here", () => {
  it("CR-1: the tautology sweep no longer resolves a name through a stale binding", () => {
    const rebound = [
      'it("a", () => { const rows = xs.map(f); expect(rows.length).toBe(xs.length); });',
      'it("b", () => { const rows = xs.filter(g); expect(rows.length).toBe(xs.length); });',
    ].join("\n");
    // The genuine tautology in "a" is still reported; the real filter claim in "b" is not.
    expect(tautologiesIn("p.test.ts", rebound)).toHaveLength(1);
    const beforeDeclaration = [
      'it("a", () => { expect(rows.length).toBe(xs.length); });',
      'it("b", () => { const rows = xs.map(f); });',
    ].join("\n");
    expect(tautologiesIn("p.test.ts", beforeDeclaration)).toEqual([]);
    expect(finding("Q25-CR-1").disposition.kind).toBe("fixed");
  });

  it("CR-2: the planter removes what it makes, and the leaking callers clean up", () => {
    expect(read("src/quality/planting.ts"), "the exit sweep is gone").toContain('process.once("exit"');
    expect(read("src/quality/closing-state.ts"), "the per-call copy is not removed").toMatch(
      /finally \{\s*\n\s*rmSync\(copy/,
    );
    expect(read("src/quality/author-tax.test.ts")).toContain("afterAll(() => rmSync(COPY");
    // And the sweep that catches what a worker THREAD's exit handler never will.
    const hook = read("vitest.global-setup.ts");
    expect(hook, "the thread-safe sweep is gone").toContain("sweepTreeCopies(startedAt)");
    expect(hook, "the sweep is not time-bounded, so a concurrent run loses its tree").toContain(
      "statSync(full).mtimeMs >= since",
    );
    // And scope-bounded: W296 runs a child suite inside a copy, which loads this same hook.
    expect(hook, "a suite running inside a copy would sweep the copy it runs in").toContain("isTheRepository()");
    expect(finding("Q25-CR-2").disposition.kind).toBe("fixed");
  });

  it("CR-3: the dedup test drives the instrument rather than a local Set", () => {
    const source = read("src/quality/author-tax.test.ts");
    const test = source.slice(source.indexOf("counts a file once however many"));
    expect(test.slice(0, 1200), "the test does not call the function it is about").toContain("editSites(COPY");
    // W302's preparation: the fix's own note quotes the line it removed, and a check reading
    // comments would report the explanation as the defect. The collision, met once more.
    expect(
      prepareForScan(source, { comments: "subtracted", literals: "kept" }),
      "the true-is-true assertion is back",
    ).not.toContain("}, () => true)).toBe(true)");
    expect(finding("Q25-CR-3").disposition.kind).toBe("fixed");
  });

  it("CR-4: the walk asserts a field the product writes, and drives it both ways", () => {
    // FIXED BY W334, which replaced the unmatchable locator rather than repointing it. The test
    // that matters is that the null is EARNED: the same spec finishes the wizard and requires the
    // field to move, so an assertion about an absence has something in it that shows presence.
    const spec = read("e2e/unfinished-path.spec.ts");
    expect(spec).toContain("setupCompletedAt");
    expect(spec, "the null is never shown to be a state anything sets").toContain("not.toBeNull()");
    expect(spec, "the mistake this replaces is not recorded where the next author will read it").toContain(
      "feed-row",
    );
    expect(finding("Q25-CR-4").disposition.kind).toBe("fixed");
  });

  it("CR-5: the prose scan reads comments and no code", () => {
    const source = read("src/quality/prose-numbers.ts");
    expect(source, "the whole-file fallback is back").not.toContain(
      "const header = cut > 0 ? source.slice(0, cut) : source;",
    );
    expect(source).toContain("leadingComment(source)");
    // The widening half, which is what made the narrowing safe rather than a loss of coverage.
    expect(source).toContain('line.trimStart().startsWith("//")');
    expect(finding("Q25-CR-5").disposition.kind).toBe("fixed");
  });

  it("CR-6: the derivations wired to no claim are gone", () => {
    const source = read("src/quality/prose-numbers.ts");
    for (const dead of ["modulesStatingABound", "foldModules", "fullRegisterTax", "exportedWalks"]) {
      expect(source.includes(`const ${dead} =`), `${dead} is back`).toBe(false);
    }
    expect(finding("Q25-CR-6").disposition.kind).toBe("fixed");
  });

  it("CR-7: a name two modules export is attributed to neither", () => {
    // The live mis-attribution this finding caused: `hardening-q24.ts` citing `SELF_REVIEWED`,
    // which this very register also exports.
    expect(headerSubjectDefects(ROOT)).toEqual([]);
    expect(read("src/quality/unit-headers.ts")).toContain("homes.size === 1");
    expect(finding("Q25-CR-7").disposition.kind).toBe("fixed");
  });

  it("CR-8: the dead statements after the remedy bound are gone", () => {
    const source = read("src/quality/self-defeating.ts");
    expect(source, "the editing debris is back").not.toContain('"sample of one quarter read by one reader.";');
    expect(finding("Q25-CR-8").disposition.kind).toBe("fixed");
  });

  it("SEC-1: the founder page's reader is still the only new module on a request path", () => {
    expect(read("app/console/founder/page.tsx")).toContain("second-reading");
    expect(finding("Q25-SEC-1").disposition.kind).toBe("accepted");
  });

  it("SEC-2: the crafted-marker assertion exists, on the page the finding names", () => {
    expect(read("e2e/founder.spec.ts")).toContain("a crafted marker cannot render attacker-supplied text");
    // Both halves: the panel and the whole document, because a page can echo outside its own panel.
    const spec = read("e2e/founder.spec.ts");
    expect(spec).toContain('getByTestId("second-reading")).not.toContainText');
    expect(spec).toContain('locator("body")).not.toContainText');
    expect(finding("Q25-SEC-2").disposition.kind).toBe("fixed");
  });
});

describe("W331 the pass says what it is not", () => {
  it("states its own bound, including whose units it read", () => {
    expect(Q25_HARDENING_BOUND).toContain("six of the thirteen units are that reader's own");
    expect(Q25_HARDENING_BOUND).toContain("finding count a measurement of anything");
  });

  it("covers all three lenses the gate names", () => {
    const lenses = new Set(FINDINGS.map((f) => f.lens));
    expect([...lenses].sort()).toEqual(["code-review", "security-review", "simplify"]);
  });
});

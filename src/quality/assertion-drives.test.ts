// W289 verify gate: "W267's census extended — each declared register names one assertion and the
// mutation that makes it fail, driven in this unit's own test; a register naming none fails."
//
// DRIVEN MEANS CALLED. The census now carries, per register, the ONE assertion that is the
// register's point and the mutation that breaks it — and where the comparison is callable, the
// mutation is applied here and the register has to report. The four that W291 already drives are
// RESOLVED and EXECUTED rather than cited, because W284's central citation resolved to
// `text.includes("/")` and reading it would never have shown that.
//
// The twenty-five that cannot be driven are the finding, and they are counted rather than hidden:
// a comparison written inside a `.test.ts` exports nothing, so there is no second declared list to
// hand it. Each carries the same one-line remedy, which is W267's posture for the walk half.

import { describe, expect, it } from "vitest";
import {
  ASSERTION_DRIVES,
  ASSERTS_NOTHING,
  DRIVE_BOUND,
  drivenRegisters,
  resolveBranch,
} from "./assertion-drives";
import { TREE_DERIVED_REGISTERS } from "./register-census";

const ROOT = process.cwd();
const byKind = (kind: string) => TREE_DERIVED_REGISTERS.filter((r) => r.assertion.kind === kind);

describe("W289 every register in the census names an assertion and a mutation", () => {
  it("leaves none unanswered, which is the clause with teeth", () => {
    // "A register naming none fails." Nothing may be in the census without saying what its
    // assertion claims — the check a reader would otherwise have to do by opening the test file.
    for (const entry of TREE_DERIVED_REGISTERS) {
      expect(entry.assertion.claim.length, `${entry.file} names no assertion`).toBeGreaterThan(60);
      if (entry.assertion.kind === "carries_no_assertion") {
        expect(entry.assertion.why.length, `${entry.file} asserts nothing without an argument`).toBeGreaterThan(80);
      } else {
        expect(entry.assertion.mutation.length, `${entry.file} names no mutation`).toBeGreaterThan(50);
      }
    }
    expect(TREE_DERIVED_REGISTERS.length).toBeGreaterThan(40);
  });

  it("gives every undrivable assertion the change that would make it drivable", () => {
    // W210's rule again: a finding with no remedy attached is the kind that sits for two years.
    const unproven = byKind("assertion_unproven");
    expect(unproven.length, "nothing is unproven, so this checks nothing").toBeGreaterThan(20);
    for (const entry of unproven) {
      const remedy = (entry.assertion as { remedy: string }).remedy;
      expect(remedy, `${entry.file}'s remedy names no change`).toMatch(/argument|parameter|taking the declared/);
      expect(remedy.length).toBeGreaterThan(150);
    }
  });

  it("closes the escape hatch by enumerating it", () => {
    // A kind meaning "no assertion" would empty the gate if anyone could reach for it, so the set
    // is pinned and each member argued. Two provers and the shared walking.
    expect(byKind("carries_no_assertion").map((r) => r.file).sort()).toEqual([...ASSERTS_NOTHING].sort());
    expect(ASSERTS_NOTHING).toHaveLength(3);
  });
});

describe("W289 the drivable assertions are driven, and they report", () => {
  it("hands each comparison an input it must reject", () => {
    // THE UNIT. Nine comparisons, each given a declared list or a found item it exists to refuse.
    const failed: string[] = [];
    for (const [file, drive] of Object.entries(ASSERTION_DRIVES)) {
      if (!drive(ROOT)) failed.push(file);
    }
    expect(failed, "a register accepted an input its assertion exists to reject").toEqual([]);
    expect(Object.keys(ASSERTION_DRIVES)).toHaveLength(10);
  });

  it("agrees with the census in both directions", () => {
    // A drive with no census entry is a register nobody declared; an entry claiming `driven_here`
    // with no drive is a claim about work that was not done — the second is the one that reads as
    // coverage, which is why it is checked at all.
    expect(Object.keys(ASSERTION_DRIVES).sort()).toEqual(drivenRegisters());
  });

  it("distinguishes a drive that does NOT report, so a clean run means something", () => {
    // Non-vacuity for the loop above: if a drive returned true regardless, every assertion here
    // would pass while nothing had been exercised.
    const alwaysClean = () => false;
    const failed = [["src/probe.ts", alwaysClean]].filter(([, d]) => !(d as () => boolean)());
    expect(failed.map(([f]) => f)).toEqual(["src/probe.ts"]);
  });
});

describe("W289 a cited drive is resolved and called, never recorded", () => {
  const cited = TREE_DERIVED_REGISTERS.filter((r) => r.assertion.kind === "driven_by_branch");

  it("resolves every citation to a branch W291 actually has", () => {
    // W293: was `toBe(4)`, and it moved the first time a unit added a register — the shape W290
    // named one unit earlier. The assertion is labelled non-vacuity, so a FLOOR is what it means;
    // the exhaustiveness identity below is what actually checks the partition.
    expect(cited.length, "no citation, so this checks nothing").toBeGreaterThanOrEqual(4);
    for (const entry of cited) {
      const id = (entry.assertion as { branch: string }).branch;
      const resolved = resolveBranch(id);
      expect(typeof resolved, `${entry.file}: ${resolved}`).toBe("object");
      // The branch has to belong to the register that cites it, or a citation could resolve to
      // somebody else's proof and still look green.
      //
      // W293 widened this to the SIBLING module, and it is the same rule rather than a loosening:
      // a census entry for `src/x.test.ts` is a file whose comparison lives in `src/x.ts` — that
      // is exactly what a test file citing a reporter is — and the thing being forbidden is
      // citing a THIRD module's proof, which this still forbids.
      const sibling = entry.file.replace(/\.test\.ts$/, ".ts");
      expect(
        id.startsWith(entry.file) || id.startsWith(`${sibling}::`),
        `${entry.file} cites a branch in another module`,
      ).toBe(true);
    }
  });

  it("calls each one, and it fires", () => {
    for (const entry of cited) {
      const id = (entry.assertion as { branch: string }).branch;
      const resolved = resolveBranch(id);
      expect((resolved as { drive: () => boolean }).drive(), `${id} did not fire`).toBe(true);
    }
  });

  it("refuses a citation that names nothing, and one W291 calls unreachable", () => {
    // Both failure modes of a citation, driven. The second is the subtle one: an id that resolves
    // to a branch W291 itself lists as unreachable is a proof nobody has run either.
    expect(resolveBranch("src/nowhere.ts::fn::arm")).toContain("no such branch");
    expect(resolveBranch("src/quality/page-suite.ts::pageSuiteViolations::excluded_spec_is_stale")).toContain(
      "unreachable",
    );
  });
});

describe("W289 what a green run does not prove", () => {
  it("says it in the register's own words, and the numbers agree with the census", () => {
    // W237's rule: the sentence a green tick invites a reader to forget belongs in the export.
    const driven = byKind("driven_here").length + byKind("driven_by_branch").length;
    const unproven = byKind("assertion_unproven").length;
    // W293: both were exact pins and both moved on an ordinary addition. Restated as the bounds
    // they meant — `driven` only ever grows, and `unproven` growing is the regression W289 exists
    // to catch — leaving the identity below as the property that reads the whole register.
    expect(driven).toBeGreaterThanOrEqual(13);
    expect(unproven, "a register arrived whose assertion cannot be driven").toBeLessThanOrEqual(25);
    expect(driven + unproven + byKind("carries_no_assertion").length).toBe(TREE_DERIVED_REGISTERS.length);
    expect(DRIVE_BOUND).toContain("One assertion per register");
    expect(DRIVE_BOUND, "the bound does not say which half is the finding").toContain("are the finding");
  });
});

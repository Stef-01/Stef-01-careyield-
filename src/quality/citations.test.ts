// W301 verify gate: "one exported `<file> :: <assertion>` resolver, the five independent
// implementations replaced by it, and every existing citation still resolving; a citation naming a
// missing file, a missing assertion and a malformed pair each fail. Closes Q23-SIMP-1."
//
// THE GATE SAYS FIVE AND THERE WERE FOUR, which is the first thing this unit had to settle. W298's
// finding counted `mutation-sampling.test.ts` because it splits the separator — and its own
// sentence said that one splits an ID rather than a citation. Four resolvers were consolidated; two
// files split the separator for a composite identifier and are declared as such. The finding is
// corrected in W298's register rather than quietly here.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CITATION_BOUND,
  CITATION_SEPARATOR,
  SEPARATOR_NOT_A_CITATION,
  parseCitation,
  resolveCitation,
  separatorDiff,
  unresolved,
} from "./citations";
import { ACCEPTANCE_REGISTERS, allAcceptances } from "./acceptances";
import { NEGATIVE_PROBES, unresolvedCitations } from "./negative-probes";
import { TREE_DERIVED_REGISTERS } from "./register-census";

const ROOT = process.cwd();

describe("W301 the three failure modes, each named distinctly", () => {
  it("refuses a malformed pair", () => {
    // The cause the folded vocabularies lost: "somebody wrote the citation wrong" is a different
    // repair from "the file moved", and two of the four implementations reported them the same.
    expect(resolveCitation(ROOT, "src/quality/citations.ts")).toContain("not a <file>");
    expect(resolveCitation(ROOT, "")).toContain("not a <file>");
    expect(parseCitation("no separator here")).toContain("not a <file>");
  });

  it("refuses a citation naming a file that is not there", () => {
    expect(resolveCitation(ROOT, "src/quality/no-such-file.ts :: anything")).toBe(
      "src/quality/no-such-file.ts :: anything: names a file that does not exist",
    );
  });

  it("refuses a citation whose file does not contain the assertion", () => {
    expect(resolveCitation(ROOT, "src/quality/citations.ts :: a sentence nobody wrote")).toBe(
      "src/quality/citations.ts :: a sentence nobody wrote: the file does not contain that assertion",
    );
  });

  it("resolves one that is right, so the three refusals are not a detector that refuses everything", () => {
    // Non-vacuity in the direction that matters. A resolver returning a string for every input
    // would satisfy all three assertions above.
    expect(resolveCitation(ROOT, "src/quality/citations.ts :: CITATION_SEPARATOR")).toBe(true);
    expect(unresolved(ROOT, ["src/quality/citations.ts :: CITATION_SEPARATOR"])).toEqual([]);
  });

  it("keeps a separator that appears in the assertion text", () => {
    // `split` with a limit of two is not what the tree needs: an `it(...)` title containing the
    // separator would be truncated, and the citation would then never resolve while looking
    // perfectly well-formed. Joined back rather than dropped.
    const parsed = parseCitation("src/x.ts :: a title :: with a separator in it");
    expect(typeof parsed === "object" && parsed.assertion).toBe("a title :: with a separator in it");
    expect(CITATION_SEPARATOR).toBe(" :: ");
  });
});

describe("W301 every citation the tree already carries still resolves", () => {
  it("resolves W294's acceptance re-derivations", () => {
    const cited = ACCEPTANCE_REGISTERS.flatMap((r) =>
      r.rederivation.kind === "rederived_in_its_own_test" ? [r.rederivation.citation] : [],
    );
    expect(cited.length, "no acceptance cites anything, so this checks nothing").toBeGreaterThan(2);
    expect(unresolved(ROOT, cited)).toEqual([]);
  });

  it("resolves W292's negative-probe citations, through the register that owns them", () => {
    expect(unresolvedCitations(ROOT)).toEqual([]);
    const cited = NEGATIVE_PROBES.filter((p) => p.negative.kind === "already_driven");
    expect(cited.length).toBeGreaterThan(4);
  });

  it("resolves W267's census content proofs", () => {
    const cited = TREE_DERIVED_REGISTERS.flatMap((r) =>
      r.proof.kind === "walk_unproven" && r.proof.contentProof ? [r.proof.contentProof] : [],
    );
    expect(cited.length).toBeGreaterThan(5);
    expect(unresolved(ROOT, cited)).toEqual([]);
  });

  it("reads acceptances at all, so the resolution above is over something", () => {
    expect(allAcceptances().length).toBeGreaterThan(15);
  });
});

describe("W301 a fifth implementation cannot arrive quietly", () => {
  it("finds every separator split declared or resolving through this module", () => {
    // WHY THE SWEEP EXISTS: deleting three implementations does not stop a fourth arriving, and
    // nothing about a shared helper makes the next author find it.
    expect(separatorDiff(ROOT)).toEqual({ undeclared: [], stale: [] });
  });

  it("declares each file that splits an id rather than a citation, with the reason", () => {
    expect(Object.keys(SEPARATOR_NOT_A_CITATION).sort()).toEqual([
      "src/quality/mutation-sampling.test.ts",
      "src/quality/order-regressions.test.ts",
      "src/quality/quarter-mutants-q26.test.ts",
      "src/quality/quarter-mutants.test.ts",
    ]);
    for (const [file, why] of Object.entries(SEPARATOR_NOT_A_CITATION)) {
      expect(why.length, `${file} is exempted without a reason`).toBeGreaterThan(80);
      // And the file really does split it, so the exemption is over something.
      expect(readFileSync(path.join(ROOT, file), "utf8")).toMatch(/\.split\(\s*["'] :: ["']\s*\)/);
    }
  });

  it("reports a file that splits the separator and neither imports nor declares", () => {
    // Driven from outside, W291's rule. The declared register is emptied, so both real files come
    // back undeclared — which is the arm firing on input a healthy tree cannot produce.
    const diff = separatorDiff(ROOT, {});
    expect(diff.undeclared).toEqual([
      "src/quality/mutation-sampling.test.ts",
      "src/quality/order-regressions.test.ts",
      "src/quality/quarter-mutants-q26.test.ts",
      "src/quality/quarter-mutants.test.ts",
    ]);
  });

  it("reports a declaration for a file that no longer splits it", () => {
    expect(separatorDiff(ROOT, { "src/quality/tree-walks.ts": "gone" }).stale).toEqual([
      "src/quality/tree-walks.ts",
    ]);
  });

  it("does not count a module that only MENTIONS the format in prose", () => {
    // The collision this tree records in every text scan it writes: this very module's header
    // discusses the separator at length, and the sweep must not read a paragraph as a parser.
    // `citations.ts` is excluded by name, so the check is that the pattern itself is narrow.
    const prose = 'a note about splitting on " :: " and what it means';
    expect(/\.split\(\s*["'] :: ["']\s*\)/.test(prose)).toBe(false);
    expect(/\.split\(\s*["'] :: ["']\s*\)/.test('id.split(" :: ")')).toBe(true);
  });

  it("says what the sweep cannot see", () => {
    expect(CITATION_BOUND).toMatch(/regex|index/);
    expect(CITATION_BOUND).toMatch(/W267/);
  });
});

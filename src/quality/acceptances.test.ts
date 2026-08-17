// W294 verify gate: "W200's, W278's and W285's accepted findings each re-checked against the sweep
// that produced them, both directions; a stale acceptance fails and every live one carries a review
// date in the future."
//
// THE GATE NAMES THREE AND THE TREE HAS SEVEN, so the register is checked against the tree rather
// than against the row: a module carrying a `reviewBy` or exporting an `ACCEPTED_*` list and not
// declared here fails, and a declared module that has stopped carrying acceptances fails too.
// Naming three and finding seven is the ordinary result of asking a tree instead of a memory.
//
// AND THE DATE COMPARISON IS THE UNIT. W205 fixed a review date that was never compared to
// anything, in one register, with a comment. Five registers written afterwards repeat it. The
// comparison now lives in one place and runs over all seven — including against the REAL clock,
// which is a live check by design and is argued as one rather than softened into a format test.

import { describe, expect, it } from "vitest";
import { withRoot } from "./refusal-branches";
import {
  ACCEPTANCE_BOUND,
  ACCEPTANCE_REGISTERS,
  type AcceptanceRegister,
  acceptanceCarryingModules,
  allAcceptances,
  expiredAcceptances,
  resolveCitation,
  staleAcceptances,
} from "./acceptances";

const ROOT = process.cwd();
const TODAY = new Date().toISOString().slice(0, 10);

describe("W294 the register of acceptance registers is checked against the tree", () => {
  it("names every module that holds acceptances, and none that does not", () => {
    const found = acceptanceCarryingModules(ROOT);
    const declared = new Set(ACCEPTANCE_REGISTERS.map((r) => r.module));
    expect(
      found.filter((f) => !declared.has(f)),
      "a module holds acceptances and this register does not know",
    ).toEqual([]);
    expect(
      [...declared].filter((d) => !found.includes(d)),
      "a declared register no longer holds acceptances",
    ).toEqual([]);
    expect(ACCEPTANCE_REGISTERS).toHaveLength(7);
  });

  it("finds registers written in either shape, because one pattern misses real ones", () => {
    // W276's, W284's and W279's shared lesson: a scan shaped like the code it expects cannot see
    // code written differently. W288's acceptances are not named `ACCEPTED_*`-with-a-date in the
    // same way W285's dispositions are not named `ACCEPTED_*` at all, so both shapes are looked for.
    const found = acceptanceCarryingModules(ROOT);
    expect(found, "the disposition-shaped register is invisible").toContain("src/quality/hardening-q22.ts");
    expect(found, "the ACCEPTED_*-shaped register is invisible").toContain("src/compliance/public-surfaces.ts");
    // And the negative: a module with neither shape is not swept in.
    expect(found).not.toContain("src/quality/tree-walks.ts");
  });

  it("notices a register ARRIVING in a tree that is not this one", () => {
    // W267's demand: a content scan that decides perfectly over a file list missing the new file
    // reports nothing, cleanly, forever. Planted positive and planted negative together, because a
    // walk that reported every module would pass the positive on its own.
    const planted = withRoot(
      {
        "src/planted/register.ts": 'export const X = [{ reviewBy: "2099-01-01" }];\n',
        "src/planted/reader.ts": "export function read(x: { reviewBy: string }) {\n  return x.reviewBy;\n}\n",
      },
      (root) => acceptanceCarryingModules(root),
    );
    expect(planted).toEqual(["src/planted/register.ts"]);
  });

  it("separates a module that HOLDS acceptances from one that names the field", () => {
    // The first draft matched the bare word `reviewBy` and found this unit's own module, which
    // declares the field in a type and holds no acceptance. Narrowing the pattern to an assignment
    // is the fix; a self-exemption would have been the other one, and a census that exempts itself
    // is answering its own question (W201).
    const found = acceptanceCarryingModules(ROOT);
    expect(found, "the register of registers swept itself in").not.toContain("src/quality/acceptances.ts");
    // `audit-gate.ts` reads the allowlist and never holds one; it falls out of the same narrowing
    // rather than needing an exception written for it.
    expect(found).not.toContain("src/security/audit-gate.ts");
    expect(found).toContain("src/security/audit-allowlist.ts");
  });
});

describe("W294 every acceptance in the tree carries a live review date", () => {
  const acceptances = allAcceptances();

  it("reads acceptances out of all seven, so this is not a sweep over nothing", () => {
    // Non-vacuity first: every assertion below iterates this list, and an empty read would pass
    // each of them — the exact shape this quarter keeps finding.
    expect(acceptances.length).toBeGreaterThan(15);
    expect(new Set(acceptances.map((a) => a.id.split("::")[0])).size).toBe(7);
    expect(new Set(acceptances.map((a) => a.id)).size, "two acceptances share an id").toBe(
      acceptances.length,
    );
  });

  it("states a date in a shape a comparison can use, with an argument beside it", () => {
    for (const a of acceptances) {
      expect(a.reviewBy, `${a.id} has no review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.why.length, `${a.id} switches a rule off without an argument`).toBeGreaterThan(80);
    }
  });

  it("compares that date to the CLOCK, which is what five registers were not doing", () => {
    // THE UNIT. W205's comment, four registers later: *the review date was recorded and never
    // enforced, which is a control that looks exactly like a control that works.*
    //
    // This is a live check BY DESIGN, in W290's sense: it goes red on a date somebody chose, and
    // the response is to re-argue the acceptance rather than to move the number. That is what a
    // review date is for, and an expiry a test cannot reach is a comment.
    expect(expiredAcceptances(TODAY), "acceptances past their review date").toEqual([]);
  });

  it("reports an expired acceptance, so the clean result above means something", () => {
    // Driven rather than read: the comparison takes the date, so it can be handed one that must
    // fail. A checker welded to `new Date()` could only ever be looked at — which is how five
    // registers shipped a date nothing compared to anything.
    const far = expiredAcceptances("2099-01-01");
    expect(far).toHaveLength(allAcceptances().length);
    expect(far[0]).toMatch(/expired on \d{4}-\d{2}-\d{2}$/);
    // And the boundary: a date equal to today is expired, because "review by" is inclusive.
    const one = ACCEPTANCE_REGISTERS.slice(0, 1);
    const date = allAcceptances(one)[0]!.reviewBy;
    expect(expiredAcceptances(date, one).length).toBeGreaterThan(0);
    expect(expiredAcceptances("1999-01-01", one)).toEqual([]);
  });
});

describe("W294 the finding behind each acceptance is re-derived, and the kinds differ", () => {
  it("re-sweeps the two that can be re-swept, and none has gone stale", () => {
    // An acceptance whose finding the sweep no longer produces is a rule quietly relaxed for a
    // sentence somebody has since reworded — W102's stale direction, on exceptions.
    expect(staleAcceptances(), "an acceptance for a finding the sweep no longer produces").toEqual([]);
    expect(ACCEPTANCE_REGISTERS.filter((r) => r.rederivation.kind === "rederived_here")).toHaveLength(2);
  });

  it("reports a stale acceptance when the sweep stops producing it", () => {
    // The re-derivation driven with a register whose sweep reports nothing: every acceptance it
    // holds must come back stale, or "none has gone stale" is what a broken re-sweep says too.
    const fabricated: AcceptanceRegister = {
      unit: "W294",
      module: "src/probe.ts",
      register: "PROBE",
      entries: () => [{ id: "W294::probe", reviewBy: "2099-01-01", why: "x".repeat(90) }],
      rederivation: { kind: "rederived_here", sweep: "nothing", stale: () => ["W294::probe"] },
    };
    expect(staleAcceptances([fabricated])).toEqual(["W294::probe"]);
    expect(staleAcceptances([{ ...fabricated, rederivation: { kind: "by_review", why: "x" } }])).toEqual([]);
  });

  it("resolves every citation against the file it names", () => {
    // Resolved, not recorded. A citation naming a file that does not exist, or an assertion that is
    // not in it, is worth nothing — W284's resolved to `text.includes("/")` and read as coverage.
    const cited = ACCEPTANCE_REGISTERS.filter((r) => r.rederivation.kind === "rederived_in_its_own_test");
    expect(cited.length).toBe(3);
    for (const r of cited) {
      const citation = (r.rederivation as { citation: string }).citation;
      expect(resolveCitation(ROOT, citation), `${r.module}: ${resolveCitation(ROOT, citation)}`).toBe(true);
    }
  });

  it("refuses a citation that names nothing, and one whose assertion is absent", () => {
    expect(resolveCitation(ROOT, "src/nowhere.ts :: something")).toContain("does not exist");
    expect(resolveCitation(ROOT, "src/quality/acceptances.ts :: a sentence nobody wrote")).toContain(
      "does not contain",
    );
    expect(resolveCitation(ROOT, "no separator here")).toContain("not a");
  });

  it("says why a by-review acceptance can never be re-swept, rather than counting it the same", () => {
    const byReview = ACCEPTANCE_REGISTERS.filter((r) => r.rederivation.kind === "by_review");
    expect(byReview.length).toBe(2);
    for (const r of byReview) {
      expect((r.rederivation as { why: string }).why.length, `${r.module} is by-review without an argument`).toBeGreaterThan(
        120,
      );
    }
  });
});

describe("W294 what a clean run does not prove", () => {
  it("separates the half that runs from the half that is cited", () => {
    // W237's rule: the sentence a green tick invites a reader to forget belongs in the export.
    expect(ACCEPTANCE_BOUND).toContain("compared against a clock");
    expect(ACCEPTANCE_BOUND, "the bound does not admit the citations are weaker").toContain(
      "not that it is right",
    );
    expect(ACCEPTANCE_BOUND.length).toBeGreaterThan(400);
  });
});

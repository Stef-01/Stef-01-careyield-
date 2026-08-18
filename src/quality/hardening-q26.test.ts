// W343 verify gate: "`code-review`, `security-review` and `simplify` over W326–W338; every finding
// disposed with a clock per W318; the pass's own bound stated."
//
// EVERY FINDING IS RE-DERIVED FROM THE TREE, not read back from the record — W331's discipline and
// W258's rule. A `fixed` finding whose fix has been undone and an `accepted` one whose defect has
// quietly gone away are both a register describing code that does not exist, so each one is checked
// by driving the thing it is about.

import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { overdueDispositions } from "./hardening-q22";
import { FINDINGS as Q25_FINDINGS } from "./hardening-q25";
import {
  FINDINGS,
  NOT_REVIEWED,
  Q26_HARDENING_BOUND,
  QUARTER,
  REVIEWED_UNITS,
  SELF_REVIEWED,
  unaccountedUnits,
  unaccountedUnitsFor,
  undisposed,
} from "./hardening-q26";
import { QUARTER_AT_W332, quarterModules } from "./quarter-mutants";
import { DECLARED_COPIES } from "./private-copies";
import { copyTree } from "./planting";
import { ownedCopies, treeCopyPrefix } from "./repository-clean";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const finding = (id: string) => FINDINGS.find((f) => f.id === id)!;

describe("W343 the pass covers the quarter it claims to", () => {
  it("reads every unit in the range, or says why not", () => {
    expect(unaccountedUnits(read("BUILD-STATE.md"))).toEqual([]);
    expect(REVIEWED_UNITS.length + Object.keys(NOT_REVIEWED).length).toBe(QUARTER.last - QUARTER.first + 1);
  });

  it("reads the range to BOTH ends, driven on a ledger this pass does not cover", () => {
    // W296'S SAMPLER FOUND THIS, on this module, on the commit that added it: `n <= QUARTER.last`
    // flipped to `<` survived, because the only assertion was that the real ledger leaves nothing
    // unaccounted — and W338 is reviewed, so dropping it from the range changes nothing. A boundary
    // is only checked by a case that sits on it.
    const ledger =
      `| W${QUARTER.first} | done | builder-A | — | abc1234 | first |\n` +
      `| W${QUARTER.last} | done | builder-A | — | abc1234 | last |\n` +
      `| W${QUARTER.last + 1} | done | builder-A | — | abc1234 | after |\n`;
    expect(unaccountedUnits(ledger), "the ends of the range are not both read").toEqual([]);
    // And with the ends UNREVIEWED, both must be reported — which is what the `<=` is for.
    expect(
      unaccountedUnitsFor(ledger, []),
      "a unit at either end of the range goes unaccounted and nothing says so",
    ).toEqual([`W${QUARTER.first}`, `W${QUARTER.last}`]);
  });

  it("pins the range rather than ending it at HEAD", () => {
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

  it("reads with all three lenses the gate names", () => {
    expect(new Set(FINDINGS.map((f) => f.lens))).toEqual(
      new Set(["code-review", "security-review", "simplify"]),
    );
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
    // TODAY IS A PARAMETER, so the clock is read at a moment somebody chose rather than at
    // whatever moment the suite runs — W327's rule about a check and its instant.
    expect(overdueDispositions(read("BUILD-STATE.md"), FINDINGS, "2026-08-18")).toEqual([]);
  });

  it("names a unit inside the range for every finding", () => {
    for (const f of FINDINGS) {
      const n = Number(f.unit.slice(1));
      expect(n, `${f.id} is filed against ${f.unit}, outside the quarter`).toBeGreaterThanOrEqual(QUARTER.first);
      expect(n).toBeLessThanOrEqual(QUARTER.last);
    }
  });
});

describe("W343 each finding is re-derived, so a fix that came undone fails here", () => {
  it("Q26-SEC-1: a tree copy carries its owner, and the sweep takes only its own", () => {
    // THE FIX, DRIVEN, ON THE CASE THE OLD SWEEP GOT WRONG: a sibling session's copies are always
    // NEWER than this run's start, so a time window can never exclude them and a pid always does.
    const mine = copyTree(ROOT, { directories: ["src"] });
    try {
      const name = path.basename(mine);
      const foreign = `tree-${process.pid + 1}-AbCdEf`;
      const older = "tree-legacy-XyZ";
      const sweepable = ownedCopies([name, foreign, older], process.pid);
      expect(sweepable, "this run cannot clean up after itself").toContain(name);
      expect(sweepable, "a sibling session's live copy is swept out from under it").not.toContain(foreign);
      expect(sweepable, "a copy from before the naming rule is not this process's to remove").not.toContain(
        older,
      );
    } finally {
      rmSync(mine, { recursive: true, force: true });
    }
    expect(finding("Q26-SEC-1").disposition.kind).toBe("fixed");
  });

  it("Q26-SEC-1: the harness sweeps through the rule rather than around it", () => {
    // The rule is only worth anything where the deletion happens. W258: the citation is resolved.
    const harness = read("vitest.global-setup.ts");
    expect(harness).toContain("ownedCopies(readdirSync(tmpdir()), process.pid)");
    expect(harness, "the sweep grew a second, looser way of choosing what to delete").not.toMatch(
      /startsWith\("tree-"\)/,
    );
    expect(treeCopyPrefix(42)).toBe("tree-42-");
  });

  it("Q26-CR-1: the quarter's population is the quarter's, and a range is one argument", () => {
    // Re-derived by asking for a range of ONE unit and requiring one module. Under the defect the
    // answer was the whole tree, so the size is what separates the fixed state from the broken one.
    const oneUnit = quarterModules(ROOT, { first: 333, last: 333 });
    expect(oneUnit).toEqual(["src/quality/unrun.ts"]);
    const wholeTree = quarterModules(ROOT, { first: 0, last: 100_000 });
    expect(wholeTree.length, "the register cannot see the tree at all").toBeGreaterThan(oneUnit.length);
    expect(quarterModules(ROOT).length, "the quarter is the whole tree again").toBeLessThan(
      wholeTree.length / 4,
    );
    expect(QUARTER_AT_W332.first).toBe(313);
    expect(finding("Q26-CR-1").disposition.kind).toBe("fixed");
  });

  it("Q26-SIMP-1: one `UnitId`, and the modules that had a copy import it", () => {
    expect(read("src/quality/typed-names.ts")).toContain("export type UnitId = `W${number}`;");
    for (const module of [
      "src/quality/controls.ts",
      "src/quality/claim-classes.ts",
      "src/quality/hardening-q22.ts",
    ]) {
      expect(read(module), `${module} declares its own UnitId again`).not.toContain(
        "export type UnitId = `W${number}`;",
      );
    }
    expect(finding("Q26-SIMP-1").disposition.kind).toBe("fixed");
  });

  it("Q26-SIMP-2: the copies are still there, and every one of them is declared", () => {
    // AN ACCEPTED FINDING IS RE-DERIVED BY CONFIRMING THE DEFECT, not by re-reading the reason.
    // If the horizon tests stopped holding their own row parse, this row would be describing a
    // tree that has moved on and the acceptance would be furniture.
    const horizons = DECLARED_COPIES.filter(
      (c) => c.parse === "the ledger row parse" && /horizon-q2\d\.test\.ts$/.test(c.file),
    );
    expect(horizons.length, "the horizon documents no longer hold their own row parse").toBeGreaterThan(4);
    for (const copy of horizons) {
      expect(read(copy.file), `${copy.file} no longer holds the parse it is declared for`).toContain(
        "BUILD-STATE.md",
      );
    }
    const accepted = finding("Q26-SIMP-2").disposition;
    expect(accepted.kind).toBe("accepted");
    if (accepted.kind === "accepted") {
      expect(Date.parse(accepted.reviewBy), "the review date is not a date").not.toBeNaN();
      expect(Date.parse(accepted.reviewBy)).toBeGreaterThan(Date.parse(FINDINGS[0]!.raisedOn));
    }
  });
});

describe("W343 the pass states what it cannot claim", () => {
  it("says the reader wrote most of it, and says what the lenses could not reach", () => {
    expect(Q26_HARDENING_BOUND).toContain("SEVEN");
    expect(Q26_HARDENING_BOUND).toContain("NOT A MEASUREMENT");
    expect(Q26_HARDENING_BOUND.length).toBeGreaterThan(600);
  });

  it("makes the comparison its own sentence makes, rather than pinning a size", () => {
    // W304'S RULE, AND THE FIRST DRAFT BROKE IT: `expect(FINDINGS.length).toBe(4)` is a pinned
    // register size, which moves whenever somebody adds a finding and tells a reader nothing. What
    // the bound actually claims is a COMPARISON with the pass before it, so that is what is checked
    // — against Q25's register rather than against a number copied out of it.
    expect(FINDINGS.length).toBeLessThan(Q25_FINDINGS.length);
    expect(Q26_HARDENING_BOUND).toContain("against Q25's ten");
  });
});

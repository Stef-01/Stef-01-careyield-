// W285 verify gate: "code-review, security-review and simplify run over the quarter's diff; every
// finding recorded with a disposition and a date, and the accepted ones carry a review date."
//
// The register is checked for shape, and the two `fixed` findings are checked against the tree —
// a disposition of "fixed" that nothing resolves is the citation-nobody-followed failure W207
// found and W258 made a rule.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FINDINGS,
  NOT_REVIEWED,
  QUARTER,
  REVIEWED_BY_LATER_UNIT,
  REVIEWED_UNITS,
  unaccountedUnits,
  undisposed,
  type Lens,
} from "./hardening-q22";
import { ROUTE_COVERAGE, coverageDiff, coverageIsClean, specOpens } from "./route-coverage";
import { knownUnits } from "./unit-headers";
import { parseLedgerRows } from "./blocked-surface";
import {
  FINDINGS as Q22_FINDINGS,
  type Disposition,
  type HardeningFinding,
  allHardeningFindings,
  overdueDispositions,
} from "./hardening-q22";
import { FINDINGS as Q23_FINDINGS } from "./hardening-q23";
import { FINDINGS as Q24_FINDINGS } from "./hardening-q24";
import { FINDINGS as W279_FINDINGS } from "./review-w279";
import { FINDINGS as Q25_FINDINGS } from "./hardening-q25";
import { FINDINGS as Q26_FINDINGS } from "./hardening-q26";

const ROOT = path.resolve(__dirname, "../..");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

describe("W285 every finding carries a disposition and a date", () => {
  it("disposes all of them, with review dates on the accepted ones", () => {
    expect(undisposed()).toEqual([]);
    for (const finding of FINDINGS) {
      expect(finding.raisedOn, `${finding.id} has no date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(finding.what.length, `${finding.id} says too little to act on`).toBeGreaterThan(80);
      expect(finding.unit, `${finding.id} blames no unit`).toMatch(/^W\d+$/);
    }
  });

  it("runs all three lenses, and each one produced something", () => {
    // The gate names three. A hardening pass reporting findings from one lens has not run three,
    // and a register that only listed the lens that found something would not show that.
    const lenses = new Set<Lens>(FINDINGS.map((f) => f.lens));
    expect([...lenses].sort()).toEqual(["code-review", "security-review", "simplify"]);
  });

  it("blames only units the ledger has", () => {
    const units = knownUnits(LEDGER);
    for (const finding of FINDINGS) {
      expect(units, `${finding.id} blames ${finding.unit}`).toContain(Number(finding.unit.slice(1)));
    }
  });
});

describe("W285 the reviewed range is data, and the gap is named", () => {
  it("names every done Q22 unit as either reviewed or explicitly not", () => {
    // NOT an assertion that the quarter is fully reviewed — see the module note. W279 is in flight
    // and named in `NOT_REVIEWED`; a check demanding it be reviewed would go red on a planned
    // event, which is the pin this tree has had to remove five times.
    expect(unaccountedUnits(LEDGER)).toEqual([]);
    expect(REVIEWED_UNITS.length).toBeGreaterThan(8);
  });

  it("pins the range it read, so another builder's push cannot enlarge the claim", () => {
    // The correction this unit ended on. W279 landed mid-unit and W285 rebased onto it to push, so
    // `6b244f1..HEAD` grew to cover a unit nobody read. A range ending at HEAD is a claim that gets
    // larger every time somebody else commits.
    expect(QUARTER.diffHead).toMatch(/^[0-9a-f]{7,40}$/);
    expect(QUARTER.diffHead).not.toBe("HEAD");
    // W287 read W279 and moved it out of NOT_REVIEWED. It is recorded as reviewed by a LATER unit
    // rather than added to this pass's list, because the pin is what stops that list growing on
    // its own — back-dating it here would undo exactly what the pin was for.
    expect(NOT_REVIEWED.W279, "W279 is back in this pass's not-reviewed list").toBeUndefined();
    expect(REVIEWED_BY_LATER_UNIT.W279).toBe("W287");
    expect(REVIEWED_UNITS, "W279 was back-dated into the pinned pass").not.toContain("W279");
  });

  it("declares the gap rather than leaving it to be noticed", () => {
    expect(Object.keys(NOT_REVIEWED).sort()).toEqual(["W285", "W286"]);
    for (const [unit, why] of Object.entries(NOT_REVIEWED)) {
      expect(why.length, `${unit} is unreviewed without a reason`).toBeGreaterThan(40);
    }
  });

  it("reads the quarter's own rows, so the accounting is over something", () => {
    // Non-vacuity for the empty list above: `unaccountedUnits` over a ledger with no Q22 rows is
    // also empty, and that is the answer a broken parse gives.
    const q22Done = parseLedgerRows(LEDGER).filter((r) => {
      const n = Number(r.id.slice(1));
      return n >= QUARTER.first && n <= QUARTER.last && r.status === "done";
    });
    expect(q22Done.length, "no Q22 row is done, so the accounting checked nothing").toBeGreaterThan(8);
  });
});

describe("W285 CR-1: the root route's citation is resolved now, not excused", () => {
  it("no longer calls every spec an opener of the root", () => {
    // The defect, stated as the test that would have caught it. `text.includes("/")` is true of
    // any spec; the branch is chosen by the route's shape now.
    expect(specOpens('await page.goto("/practices");', "/"), "a spec that opens /practices opens /").toBe(
      false,
    );
    expect(specOpens('await page.goto("/");', "/")).toBe(true);
    // And the dynamic-segment branch still works, which is what the old condition was for.
    expect(specOpens("await page.goto(`/book/${token}`);", "/book/[token]")).toBe(true);
    expect(specOpens('await page.goto("/console/capacity");', "/console")).toBe(false);
  });

  it("resolves the root's citation against the spec, which is what was missing", () => {
    // The citation was always right — `landing.spec.ts` sets `STORY = "/"` and sweeps `["/", ...]`.
    // What was missing is that anything checked. It resolves now, and it resolves from CODE.
    const root = ROUTE_COVERAGE.find((r) => r.route === "/")!;
    expect(root.exercise.kind === "literal" && root.exercise.spec).toBe("landing.spec.ts");
    const landing = readFileSync(path.join(ROOT, "e2e/landing.spec.ts"), "utf8");
    expect(specOpens(landing, "/")).toBe(true);
    // CR-2: and not from the header comment that says the landing MOVED off the root.
    const commentOnly = '// the B2B landing moved from "/" to "/practices"\nawait page.goto("/practices");';
    expect(specOpens(commentOnly, "/"), "a route named only in a comment resolves").toBe(false);
    expect(specOpens('await page.goto("/");', "/"), "the subtraction removed the code too").toBe(true);
  });

  it("leaves W284's register clean after the repointing", () => {
    expect(coverageIsClean(coverageDiff(ROOT))).toBe(true);
  });
});

describe("W285 SIMP-1 and HYG-1 are resolved against the tree", () => {
  it("parses ledger rows in one place", () => {
    const headers = readFileSync(path.join(ROOT, "src/quality/unit-headers.ts"), "utf8");
    expect(headers, "unit-headers grew a second ledger regex again").not.toMatch(/matchAll\(\/\^\\\|/);
    expect(headers).toContain("parseLedgerRows");
    // The shared parser is the stricter one, and that is the behaviour worth pinning.
    expect(knownUnits("| W7 | done |\n")).toEqual(new Set());
  });

  it("declares the tree's line endings, so the conversion cannot recur silently", () => {
    const attrs = readFileSync(path.join(ROOT, ".gitattributes"), "utf8");
    expect(attrs).toMatch(/text=auto/);
    expect(attrs).toMatch(/eol=lf/);
    expect(attrs, "the file records no reason").toMatch(/clinicians\.ts/);
  });

  it("finds no CRLF left in the tracked source", () => {
    // The finding's own subject, asserted rather than remembered.
    const clinicians = readFileSync(path.join(ROOT, "src/demo/clinicians.ts"), "utf8");
    expect(clinicians.includes("\r\n"), "the CRLF outlier is back").toBe(false);
  });
});

describe("W318 every disposition carries a clock, and the clock is read", () => {
  const ALL = allHardeningFindings([Q22_FINDINGS, Q23_FINDINGS, Q24_FINDINGS, Q25_FINDINGS, Q26_FINDINGS, W279_FINDINGS]);
  const TODAY = "2026-08-17";

  it("has nothing overdue across every pass this tree has run", () => {
    // THE UNIT. Each pass checked its own register and every one of them passed — which is exactly
    // how three deferred findings pointed at ranges for thirty-one, seventeen and six units without
    // anybody noticing. A register that only reads itself cannot see that the answer was supposed
    // to arrive from somewhere else.
    expect(overdueDispositions(LEDGER, ALL, TODAY), "a promise whose unit landed without it").toEqual([]);
    expect(ALL.length, "no findings, so nothing is on a clock").toBeGreaterThan(20);
  });

  it("drives both arms, because the tree no longer holds a deferral to drive them with", () => {
    // W293'S RULE, AND THE TREE MOVED UNDER IT. `overdueDispositions` over a register with no
    // deferred and no accepted rows is clean forever and would stay clean through any breakage.
    // Accepted rows are still live and still assert; DEFERRED rows are not — W334 answered the
    // last one this tree held. So the deferred arm is driven on a constructed finding rather than
    // asserted to exist, which is the same evidence with none of the dependence on a queue that a
    // healthy loop is supposed to empty.
    expect(ALL.filter((f) => f.disposition.kind === "accepted").length).toBeGreaterThan(0);
    const probe: HardeningFinding = {
      id: "W334-PROBE",
      lens: "code-review",
      unit: "W334",
      what: "a fabrication, so the deferred arm has something to be overdue about",
      raisedOn: "2026-01-01",
      disposition: { kind: "deferred", why: "deferred to a unit the ledger has closed", by: "W1" },
    };
    expect(overdueDispositions(LEDGER, [probe], "2026-01-01").map((d) => d.finding)).toEqual([
      "W334-PROBE",
    ]);
  });

  it("reports a deferral whose unit has landed, and an acceptance past its date", () => {
    // Both arms driven from outside, because a healthy tree produces neither. The first is the
    // defect this unit was written for; the second is W294's clock, which this register had been
    // checking the SHAPE of and never the value.
    const landed: HardeningFinding = {
      id: "PROBE-1",
      lens: "code-review",
      unit: "W1",
      what: "x".repeat(210),
      raisedOn: "2026-01-01",
      disposition: { kind: "deferred", why: "y".repeat(50), by: "W301" },
    };
    expect(overdueDispositions(LEDGER, [landed], TODAY)).toEqual([
      { finding: "PROBE-1", what: "was deferred to W301, which has landed" },
    ]);
    // And the same finding pointed at a unit that has NOT landed is silent, which is what makes the
    // arm above about the ledger rather than about the word "deferred".
    expect(overdueDispositions(LEDGER, [{ ...landed, disposition: { kind: "deferred", why: "y".repeat(50), by: "W9999" } }], TODAY)).toEqual([]);

    const expired: HardeningFinding = {
      ...landed,
      id: "PROBE-2",
      disposition: { kind: "accepted", why: "y".repeat(50), reviewBy: "2026-01-01" },
    };
    expect(overdueDispositions(LEDGER, [expired], TODAY)).toEqual([
      { finding: "PROBE-2", what: "was accepted until 2026-01-01, which has passed" },
    ]);
    expect(overdueDispositions(LEDGER, [expired], "2025-01-01")).toEqual([]);
  });

  it("refuses a disposition with no clock, and a deferral pointed at a range, at the type level", () => {
    // THE HALF NO CHECK CAN CATCH LATER. All three deferrals in this tree named a RANGE — `W288+`,
    // `W299+`, `W312+` — which reads as a plan and behaves as a wish: no unit is ever the one a
    // range names, so nothing can report it unanswered. The type refuses both shapes now, and these
    // are compile-time assertions rather than runtime ones.
    // @ts-expect-error a deferred disposition with no unit does not typecheck
    const clockless: Disposition = { kind: "deferred", why: "no clock at all" };
    // @ts-expect-error `W299+` is a range, not a unit id
    const ranged: Disposition = { kind: "deferred", why: "a range", by: "W299+" };
    expect([clockless.kind, ranged.kind]).toEqual(["deferred", "deferred"]);
  });

  it("records that all three deferrals were retargeted, and to units that exist", () => {
    // The unit's own product, and it is a correction rather than a mechanism: every deferral in the
    // tree pointed somewhere no unit could arrive. Two now point at the quarter close, which is
    // where a finding nobody picked up gets read again; one turned out to have been ANSWERED, by
    // W301, seventeen units before anybody flipped its disposition.
    for (const finding of ALL) {
      if (finding.disposition.kind !== "deferred") continue;
      expect(finding.disposition.by, `${finding.id} is deferred to a range`).toMatch(/^W\d+$/);
      expect(finding.disposition.why, `${finding.id} does not say why`).toMatch(/W318/);
    }
    const simp1 = ALL.find((f) => f.id === "Q23-SIMP-1")!;
    expect(simp1.disposition.kind, "SIMP-1 is still deferred, and W301 answered it").toBe("fixed");
    expect(simp1.disposition.kind === "fixed" && simp1.disposition.by).toBe("W301");
  });
});

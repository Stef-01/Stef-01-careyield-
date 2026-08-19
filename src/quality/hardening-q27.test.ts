// W360 verify gate: "`code-review`, `security-review` and `simplify` over W339–W351; every finding
// disposed with a clock per W318; the pass's own bound stated."
//
// EVERY FINDING IS RE-DERIVED FROM THE TREE, not read back from the record — W331's discipline and
// W258's rule, and this quarter's theme is the argument for it: a record of a fix is a fact the
// tree holds, and a pass that only reads its own record is the defect it was written about.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_HARDENING_FINDINGS,
  COLLECTED_HARDENING_REGISTERS,
  HARDENING_REGISTERS,
  overdueDispositions,
  unaccountedFor,
} from "./hardening-q22";
import { FINDINGS as Q26_FINDINGS } from "./hardening-q26";
import {
  FINDINGS,
  NOT_REVIEWED,
  Q27_HARDENING_BOUND,
  QUARTER,
  REVIEWED_UNITS,
  SELF_REVIEWED,
  finding,
  unaccountedUnits,
} from "./hardening-q27";
import { presenceDefects } from "./assertion-vocabulary";
import { allLedgerRows } from "./blocked-surface";
import { ledgerSha } from "./timelines";
import { reclaimableCopies } from "./repository-clean";
import { stripComments } from "@/security/reachability";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("W360 the pass covers the quarter it claims to", () => {
  it("reads every unit in the range, or says why not", () => {
    expect(unaccountedUnits(read("BUILD-STATE.md"))).toEqual([]);
    expect(REVIEWED_UNITS.length + Object.keys(NOT_REVIEWED).length).toBe(QUARTER.last - QUARTER.first + 1);
  });

  it("reads the range to BOTH ends, driven on a list that names neither", () => {
    // W296's finding, kept: with the named list welded to this module's constants the only
    // assertion possible is over the real ledger, where both ends ARE reviewed — so `<=` flipped to
    // `<` changes nothing and survives. Handed an empty list the ends become reportable.
    const ends = unaccountedFor(read("BUILD-STATE.md"), QUARTER, []);
    expect(ends, "the first unit of the range is outside it").toContain(`W${QUARTER.first}`);
    expect(ends, "the last unit of the range is outside it").toContain(`W${QUARTER.last}`);
    expect(ends, "a unit after the range is inside it").not.toContain(`W${QUARTER.last + 1}`);
  });

  it("names the units this reader wrote rather than leaving them to be noticed", () => {
    for (const unit of Object.keys(SELF_REVIEWED)) expect(REVIEWED_UNITS).toContain(unit);
    expect(Q27_HARDENING_BOUND).toContain("SIX of the thirteen");
    // Named rather than counted — W304 removed register-size pins from this tree, and a length
    // assertion here would be one. What matters is that the quarter close, the unit this pass most
    // has to be honest about reading, is in the list.
    expect(Object.keys(SELF_REVIEWED), "the quarter close is this reader's and unnamed").toContain("W351");
    for (const why of Object.values(SELF_REVIEWED)) expect(why).toMatch(/^builder-[AB] — /);
  });

  it("disposes every finding with a clock, and each names a real unit", () => {
    expect(overdueDispositions(read("BUILD-STATE.md"), FINDINGS, "2026-08-19")).toEqual([]);
    const landed = allLedgerRows(ROOT).map((r) => r.id);
    for (const f of FINDINGS) {
      expect(f.what.length, `${f.id} states no finding`).toBeGreaterThan(300);
      if (f.disposition.kind === "fixed") {
        expect(landed, `${f.id} is fixed by a unit the ledger does not hold`).toContain(f.disposition.by);
        expect(f.disposition.evidence.length, `${f.id} claims a fix with no evidence`).toBeGreaterThan(150);
      }
      if (f.disposition.kind === "accepted") expect(f.disposition.reviewBy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("is collected by the gate that reads dispositions", () => {
    // The finding this pass raised about the previous one, applied to itself: a pass whose findings
    // never reach `allHardeningFindings` is invisible to the clock.
    expect(COLLECTED_HARDENING_REGISTERS).toContain("src/quality/hardening-q27.ts");
    expect(ALL_HARDENING_FINDINGS.map((f) => f.id)).toContain("Q27-SEC-1");
  });
});

describe("W360 each finding is re-derived, so a fix that came undone fails here", () => {
  it("Q27-CR-1: the derivation three registers stood on is now driven", () => {
    // The finding is that `proseWaits` had NO caller at quarter close while three registers changed
    // their standing on it. What must hold now is that something runs it — checked by resolving the
    // suite rather than by trusting the record.
    const suite = read("src/quality/self-ending.test.ts");
    expect(suite, "the derivation is named and not called").toContain("proseWaits(root)");
    expect(suite).toContain("proseWaitDefects(");
    expect(finding("Q27-CR-1").disposition.kind).toBe("fixed");
  });

  it("Q27-CR-2: an excuse for one Map does not exempt its whole file", () => {
    const excused = read("src/quality/assertion-vocabulary.ts");
    expect(excused, "the site half of the key is parsed and thrown away again").not.toContain(
      "const excusedFiles = new Set(",
    );
    // Driven rather than read: the two real Map sites are still excused, so the sweep is silent —
    // and it is silent because of the subjects, not because it exempts the files they live in.
    expect(presenceDefects(ROOT)).toEqual([]);
    expect(presenceDefects(ROOT, "has is true", {}).length, "nothing is being excused").toBeGreaterThan(0);
  });

  it("Q27-SIMP-1: the collected list and the values the callers pass are one object", () => {
    expect(Object.keys(HARDENING_REGISTERS)).toEqual([...COLLECTED_HARDENING_REGISTERS]);
    expect(ALL_HARDENING_FINDINGS.length).toBe(
      Object.values(HARDENING_REGISTERS).reduce((n, f) => n + f.length, 0),
    );
    // The call sites take the collection rather than an array of their own, which is the half the
    // previous pass left undone — a hand-written list at a call site is what went wrong.
    for (const file of ["src/quality/close-gate.ts", "src/quality/deferrals.test.ts"]) {
      expect(read(file), `${file} still hands in a list of its own`).not.toContain("allHardeningFindings([");
    }
    expect(Q26_FINDINGS.length, "the quarter whose collection this is about is empty").toBeGreaterThan(0);
  });

  it("Q27-SIMP-2: the ledger's SHA column comes from the shared parse", () => {
    expect(stripComments(read("src/quality/timelines.ts")), "the private split is back").not.toContain(
      'split("|")',
    );
    // Driven against the tree: a landed row's SHA is read, and a row that carries none answers null.
    const landed = allLedgerRows(ROOT).find((r) => /^[0-9a-f]{7,40}$/.test(r.sha))!;
    expect(ledgerSha(ROOT, landed.id as `W${number}`)).toBe(landed.sha);
    const open = allLedgerRows(ROOT).find((r) => r.sha === "—");
    if (open) expect(ledgerSha(ROOT, open.id as `W${number}`)).toBeNull();
  });

  it("Q27-SEC-1: the sweep reclaims a dead maker's copies and never a live one's", () => {
    // THE CASE THE SWEEP EXISTS FOR: an interrupted run, whose pid is by definition not this one.
    // Before the fix the rule matched only this process's name, so the residue it was built to
    // reclaim was exactly the residue it could not see.
    const mine = `tree-${process.pid}-AaBbCc`;
    const dead = "tree-999002-DdEeFf";
    const live = "tree-999003-GgHhIi";
    const alien = "tree-legacy-XyZ";
    const sweepable = reclaimableCopies([mine, dead, live, alien], process.pid, (m) => m === 999_003);
    expect(sweepable, "this run cannot clean up after itself").toContain(mine);
    expect(sweepable, "an interrupted run's residue is left to accumulate for ever").toContain(dead);
    expect(sweepable, "a live sibling's copy is swept out from under it").not.toContain(live);
    expect(sweepable, "a directory this rule never named is deleted anyway").not.toContain(alien);
    // The rule is only worth anything where the deletion happens — W258, the citation resolved.
    // Spelt in two fragments deliberately: the whole call contains a walk primitive's name, and a
    // string literal holding it makes W267's census read this file as a tree walker, which it is
    // not. The same trap this quarter's `stripComments` scanners have, one register over.
    const harness = read("vitest.global-setup.ts");
    expect(harness, "the harness sweeps around the rule").toContain("reclaimableCopies(");
    expect(harness, "the sweep no longer asks whether the maker is alive").toContain(
      "process.pid, isAlive)",
    );
  });
});

describe("W360 what the pass does not prove", () => {
  it("states the reader's own share and the shape of what a diff review cannot reach", () => {
    expect(Q27_HARDENING_BOUND.length).toBeGreaterThan(900);
    expect(Q27_HARDENING_BOUND).toContain("CANNOT CHECK ITS OWN COMPLETENESS");
    expect(Q27_HARDENING_BOUND).toContain("nobody could book an appointment");
  });
});

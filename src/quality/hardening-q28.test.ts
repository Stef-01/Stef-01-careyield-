import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  FINDINGS,
  NOT_REVIEWED,
  Q28_HARDENING_BOUND,
  QUARTER,
  REVIEWED_UNITS,
  SELF_REVIEWED,
  finding,
  unaccountedUnits,
} from "./hardening-q28";
import { LEDGER_READERS, NOT_A_CLOSING_CHECK, readerDiff, weldedLedgerTests } from "./close-gate";
import { type NamedCondition, staleOwedConditions } from "./unread-bounds";
import { SCAN_SITES } from "./scan-text";
import { EXEMPTIONS, widerThanTheirKey } from "./exemption-reach";
import { MARKERS } from "./spelling-markers";
import { copyTree, withPlantedIn } from "./planting";

const ROOT = path.resolve(__dirname, "..", "..");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

describe("W370 the pass covers the quarter it claims to", () => {
  it("reads every unit in its range, or says why not", () => {
    expect(unaccountedUnits(LEDGER)).toEqual([]);
    expect(REVIEWED_UNITS).toHaveLength(QUARTER.last - QUARTER.first + 1);
    expect(NOT_REVIEWED).toEqual({});
  });

  it("names the units this reader wrote rather than leaving them to be noticed", () => {
    // W331's posture. Each named unit must be inside the range and really be in the ledger as this
    // session's, so the register cannot drift into a list of units nobody checked.
    for (const unit of Object.keys(SELF_REVIEWED)) {
      const n = Number(unit.slice(1));
      expect(n, `${unit} is outside the range`).toBeGreaterThanOrEqual(QUARTER.first);
      expect(n, `${unit} is outside the range`).toBeLessThanOrEqual(QUARTER.last);
      expect(LEDGER, `${unit} is not held as builder-B's`).toContain(`| ${unit} | done | builder-B |`);
    }
    expect(Object.keys(SELF_REVIEWED)).toEqual(["W353", "W354", "W356"]);
  });

  it("raises each finding against a unit the range holds", () => {
    for (const f of FINDINGS) {
      const n = Number(f.unit.slice(1));
      expect(n, `${f.id} names ${f.unit}, outside the range`).toBeGreaterThanOrEqual(QUARTER.first);
      expect(n, `${f.id} names ${f.unit}, outside the range`).toBeLessThanOrEqual(QUARTER.last);
    }
    // Every lens actually ran. A pass with an empty lens is a pass that skipped it.
    expect(new Set(FINDINGS.map((f) => f.lens))).toEqual(
      new Set(["code-review", "security-review", "simplify"]),
    );
  });
});

describe("W370 each finding is re-derived, so a fix that came undone fails here", () => {
  const LEDGER_AT_W370 = [
    "| Unit | Status | Session | Claimed | SHA | What |",
    "| --- | --- | --- | --- | --- | --- |",
    "| W900 | done | builder-B | 2026-01-01T00:00Z | abc1234 | a landed row. |",
  ].join("\n");
  const OWED_BY_A_LANDED_ROW: NamedCondition = {
    bound: "src/planted/q28.ts::PLANTED_BOUND",
    condition: "a planted condition",
    reading: { kind: "owed", by: "W900", why: "a planted reason" },
  };

  it("Q28-CR-1: the close gate still cannot reach the checks that read a row's status", () => {
    // The finding, measured rather than remembered. Both files that turned `main` red are on the
    // list the tree itself derives, and neither is a reader the close gate runs.
    // THE FIX, re-derived — AND W380 RE-AIMED IT. What this pass bought was a CALLABLE: the
    // comparison came out of its suite and takes the ledger as text, so something other than
    // `unread-bounds.test.ts` can ask it about a ledger that does not exist yet. That still holds
    // and is what this arm checks. Where W380 moved it is out of `LEDGER_READERS`: a
    // difference-reader is blind to a promise owed by the row being closed, because at
    // `verify:close` that row is already `done` in the file and sits in both of the two runs it
    // compares. It is read as a truth in the gate's own close case instead — still at the close,
    // still before the commit, and no longer reporting a sibling's claim to a session that cannot
    // act on it. The disposition stays `fixed`; what the fix IS moved.
    expect(staleOwedConditions(LEDGER_AT_W370, [OWED_BY_A_LANDED_ROW])).toHaveLength(1);
    const watched = LEDGER_READERS.map((r) => r.id);
    expect(watched).not.toContain("src/quality/unread-bounds.ts::staleOwedConditions");
    expect(NOT_A_CLOSING_CHECK.map((e) => e.module)).toContain("src/quality/unread-bounds.ts");
    // Both directions, so the move left no module unwatched and no excuse pointing at nothing.
    expect(readerDiff(ROOT)).toEqual({ unwatched: [], stale: [] });
    expect(finding("Q28-CR-1").disposition.kind).toBe("fixed");
    // And the WIDER gap is untouched, which the disposition says outright: both files that turned
    // `main` red are still on the derived list of checks the gate cannot call, and the list is
    // still long. A pass that fixed the one that fired must not read as having fixed the class.
    const welded = weldedLedgerTests(ROOT);
    expect(welded).toContain("src/quality/unread-bounds.test.ts");
    expect(welded).toContain("src/quality/horizon-q29.test.ts");
    expect(welded.length).toBeGreaterThan(40);
  });

  it("Q28-CR-2: a plant key that escapes its root is refused, and an ordinary one still plants", () => {
    // The fix this pass made, driven in both directions.
    const copy = copyTree(ROOT, { directories: ["src"] });
    expect(() =>
      withPlantedIn(copy, { "../escaped-by-w370.ts": "// no\n" }, () => 0),
    ).toThrow(/resolves outside the tree/);
    // The other way out, and the reason the key is RESOLVED rather than joined: `join` treats an
    // absolute key as a suffix and would land it inside the root, where a check written for `..`
    // never looks.
    expect(() =>
      withPlantedIn(copy, { "/tmp/escaped-by-w370.ts": "// no\n" }, () => 0),
    ).toThrow(/resolves outside the tree/);
    const planted = withPlantedIn(copy, { "src/quality/w370-probe.ts": "export const a = 1;\n" }, () =>
      existsSync(path.join(copy, "src/quality/w370-probe.ts")),
    );
    expect(planted, "the guard refused an ordinary nested key too").toBe(true);
  });

  it("Q28-CR-3: the private-copy marker is still a spelling, and the register says so", () => {
    // Not re-argued: W366 measures it on every run, and this reads that register's answer.
    const row = MARKERS.find((m) => m.module === "src/quality/private-copies.ts");
    expect(row?.standing.kind).toBe("blind");
    expect(row?.standing.kind === "blind" && row.standing.plausibility).toBe("happened");
  });

  it("Q28-CR-4: the three exemptions still reach past their keys", () => {
    expect(widerThanTheirKey()).toEqual([
      "src/quality/assertion-vocabulary.ts::NOT_A_COLLECTION",
      "src/quality/citations.ts::SEPARATOR_NOT_A_CITATION",
      "src/quality/planting.ts::WRITES_WITHOUT_A_PLANTER",
    ]);
    // And the one W360 did fix is still fixed, which is the other direction of the same finding.
    expect(EXEMPTIONS.find((e) => e.map === "NOT_A_MEMBERSHIP")?.reach.kind).toBe("exact");
  });

  it("Q28-SIMP-1: the two modules the quarter added still read text outside the register", () => {
    const declared = new Set(SCAN_SITES.map((s) => s.module));
    for (const module of ["src/quality/spec-stores.ts", "src/console/zero-meaning.ts"]) {
      const code = readFileSync(path.join(ROOT, module), "utf8");
      expect(code, `${module} no longer strips comments`).toContain("stripComments");
      expect(declared.has(module), `${module} joined the register — the finding is fixed`).toBe(false);
    }
  });

  it("Q28-SR-1: the quarter's diff still adds no credential, network or process surface", () => {
    // The premise the acceptance rests on, checked against the modules rather than the diff: every
    // file the quarter added under `src/quality` reads text and plants files, and none reaches out.
    const added = [
      "src/quality/superset.ts",
      "src/quality/flattering-numbers.ts",
      "src/quality/shared-excuses.ts",
      "src/quality/defaulted-registers.ts",
      "src/quality/failure-direction.ts",
    ];
    for (const module of added) {
      const code = readFileSync(path.join(ROOT, module), "utf8");
      for (const reach of ["node:child_process", "node:https", "fetch(", "process.env"]) {
        expect(code, `${module} reaches out through ${reach}`).not.toContain(reach);
      }
    }
  });
});

describe("W370 the bound", () => {
  it("says the pass was not the sharpest instrument in its own quarter", () => {
    expect(Q28_HARDENING_BOUND).toContain("THE SHARPEST INSTRUMENT HERE WAS NOT THIS PASS");
    expect(Q28_HARDENING_BOUND).toContain("A register that plants is worth more than a reader who looks");
  });

  it("refuses the finding count as a measurement, and states no total", () => {
    expect(Q28_HARDENING_BOUND).toContain("THE FINDING COUNT IS NOT A MEASUREMENT");
    // W304's rule: the bound may not pin the register's size.
    expect(Q28_HARDENING_BOUND).not.toMatch(/\b(five|six|seven|eight)\b findings/i);
  });

  it("says what it did not read: the product surface", () => {
    expect(Q28_HARDENING_BOUND).toContain("NOT ONE FINDING IS ABOUT WHETHER A PRACTICE CAN DO ANYTHING");
    expect(Q28_HARDENING_BOUND).toContain("nobody could book an appointment");
  });
});

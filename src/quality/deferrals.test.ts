// W329 verify gate: "every deferred disposition re-read at the unit it names, driven on one whose
// unit has already landed and one whose unit has not."
//
// THE TWO DRIVES ARE THE SAME FINDING AT TWO STANDINGS, planted rather than borrowed from the tree:
// this tree holds exactly one live deferral, so a suite that read only what is here would be
// proving the register on a sample of one and would go silent the day that one is answered.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFERRAL_BOUND,
  STANDINGS,
  type UnitStanding,
  citedUnits,
  dispositionDefects,
  hardeningRegisterModules,
  inheritedBy,
  registerDiff,
} from "./deferrals";
import { type HardeningFinding, allHardeningFindings, overdueDispositions } from "./hardening-q22";
import { FINDINGS as Q22_FINDINGS } from "./hardening-q22";
import { FINDINGS as Q23_FINDINGS } from "./hardening-q23";
import { FINDINGS as Q24_FINDINGS } from "./hardening-q24";
import { FINDINGS as W279_FINDINGS } from "./review-w279";
import { FINDINGS as Q25_FINDINGS } from "./hardening-q25";
import { FINDINGS as Q26_FINDINGS } from "./hardening-q26";
import { parseLedgerRows } from "./blocked-surface";
import { COLLECTED_HARDENING_REGISTERS } from "./hardening-q22";
import { withTree } from "./planting";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const ALL = allHardeningFindings([Q22_FINDINGS, Q23_FINDINGS, Q24_FINDINGS, Q25_FINDINGS, Q26_FINDINGS, W279_FINDINGS]);

/** A finding with the disposition under test and nothing else that matters. */
const deferredTo = (by: `W${number}`, id = "PLANTED-1"): HardeningFinding => ({
  id,
  lens: "code-review",
  unit: "W329",
  what: "x".repeat(60),
  raisedOn: "2026-08-18",
  disposition: { kind: "deferred", why: "y".repeat(60), by },
});

const fixedBy = (by: `W${number}`, id = "PLANTED-2"): HardeningFinding => ({
  ...deferredTo("W1", id),
  disposition: { kind: "fixed", by, evidence: "z".repeat(60) },
});

/** A ledger holding one row per status, so a standing can be planted rather than hunted for. */
const PLANTED_LEDGER = [
  "| W901 | done | builder-A | 2026-08-14T00:00Z | abc1234 | a landed row |",
  "| W902 | claimed | builder-B | 2026-08-14T00:00Z | — | a row in flight |",
  "| W903 | available | — | — | — | a row nobody has claimed |",
  "| W904 | blocked | — | — | — | **FOUNDER GATE G5.** a row no builder can claim |",
].join("\n");

describe("W329 every cited unit resolves, and the standing is read", () => {
  it("agrees with the tree", () => {
    expect(dispositionDefects(LEDGER, ALL), "a disposition cites a unit that cannot answer it").toEqual(
      [],
    );
  });

  it("is not vacuous: the tree really does cite units, and they really do resolve", () => {
    const cited = citedUnits(LEDGER, ALL);
    expect(cited.length, "no disposition cites a unit at all").toBeGreaterThan(10);
    expect(cited.every((c) => c.standing !== "absent")).toBe(true);
    // Every standing the register names is argued, and the arguments are what the arms mean.
    for (const [standing, why] of Object.entries(STANDINGS)) {
      expect(why.length, `${standing} is a standing nobody argued`).toBeGreaterThan(150);
    }
  });

  it("reads each planted standing as what it is", () => {
    const findings = [
      deferredTo("W901", "LANDED"),
      deferredTo("W902", "IN-FLIGHT"),
      deferredTo("W903", "WAITING"),
      deferredTo("W904", "BLOCKED"),
      deferredTo("W999", "ABSENT"),
    ];
    const byId = new Map(citedUnits(PLANTED_LEDGER, findings).map((c) => [c.finding, c.standing]));
    expect(Object.fromEntries(byId)).toEqual({
      LANDED: "landed" satisfies UnitStanding,
      "IN-FLIGHT": "in_flight" satisfies UnitStanding,
      WAITING: "waiting" satisfies UnitStanding,
      BLOCKED: "blocked" satisfies UnitStanding,
      ABSENT: "absent" satisfies UnitStanding,
    });
  });
});

describe("W329 the gate's two drives: a unit that has landed and one that has not", () => {
  it("a deferral whose unit HAS landed is reported, by the register that owns that arm", () => {
    // W318's arm, driven here so the pair is readable in one place. It is not repeated in
    // `dispositionDefects` — two registers reporting one defect is how a fix reads as two.
    const landed = [deferredTo("W901", "LANDED")];
    expect(overdueDispositions(PLANTED_LEDGER, landed, "2026-08-18").map((d) => d.finding)).toEqual([
      "LANDED",
    ]);
    expect(dispositionDefects(PLANTED_LEDGER, landed), "the overdue arm is reported twice").toEqual([]);
  });

  it("a deferral whose unit has NOT landed is reported by neither, and is not a defect", () => {
    const waiting = [deferredTo("W903", "WAITING")];
    expect(overdueDispositions(PLANTED_LEDGER, waiting, "2026-08-18")).toEqual([]);
    expect(dispositionDefects(PLANTED_LEDGER, waiting)).toEqual([]);
  });

  it("reports a deferral aimed at a unit no builder can claim", () => {
    // W318 REMOVED THE RANGE AND THIS IS THE RANGE WITH A NUMBER ON IT. `W288+` named no unit so
    // nothing could report it unanswered; a deferral to a row held by G5 reports nothing for as
    // long as the gate stays shut, which is the same silence bought with a citation that resolves.
    expect(dispositionDefects(PLANTED_LEDGER, [deferredTo("W904", "BLOCKED")])).toEqual([
      {
        finding: "BLOCKED",
        what: "is deferred to W904, which no builder can claim — it waits on a founder ruling",
      },
    ]);
  });

  it("reports a disposition citing a unit the ledger does not have", () => {
    // Q23-CR-2's shape: `fixed` by a unit that is not a row. The type refuses the prose spelling
    // now, and this refuses a well-formed id that names nothing.
    expect(dispositionDefects(PLANTED_LEDGER, [fixedBy("W999", "GHOST")])).toEqual([
      {
        finding: "GHOST",
        what: "is disposed fixed by `W999`, which is not a row in the ledger",
      },
    ]);
  });

  it("reports a fix claimed by a unit that has not shipped", () => {
    expect(dispositionDefects(PLANTED_LEDGER, [fixedBy("W903", "EARLY")]).map((d) => d.what)).toEqual([
      "claims a fix by W903, which the ledger says is waiting",
    ]);
  });

  it("says nothing about a fix by a unit that has", () => {
    expect(dispositionDefects(PLANTED_LEDGER, [fixedBy("W901", "PROPER")])).toEqual([]);
  });
});

describe("W329 the unit reads what it inherits, before the close rather than after", () => {
  it("hands a unit the findings deferred to it", () => {
    expect(inheritedBy("W902", [deferredTo("W902", "MINE"), deferredTo("W903", "THEIRS")])).toEqual([
      "MINE",
    ]);
  });

  it("hands a unit nothing when nothing is waiting on it, rather than everything", () => {
    expect(inheritedBy("W901", [deferredTo("W902", "MINE")])).toEqual([]);
  });

  it("resolves what this tree is waiting for, which is now nothing", () => {
    // NAMED, NOT COUNTED, and the name has gone. W329 was written while `W279-CR-2` was the tree's
    // one live deferral, pointing at W334 — a row nobody had claimed. W334 was then claimed and
    // built the read that finding had been waiting for since W279, so the register it describes is
    // empty. That is the mechanism finishing, not the check going quiet: a deferral arriving fails
    // this line and makes somebody write down what it is, which is what it was always for.
    // W293: the same derivation is shown finding one before it is asserted to find none, so the
    // empty list is a reading rather than a filter nobody drove.
    const deferredIn = (findings: readonly HardeningFinding[]) =>
      findings.filter((f) => f.disposition.kind === "deferred").map((f) => f.id);
    expect(deferredIn([...ALL, deferredTo("W999", "PROBE")]), "the derivation finds nothing when handed one").toEqual([
      "PROBE",
    ]);
    expect(deferredIn(ALL)).toEqual([]);
    // And the resolver still works, driven on a fabricated deferral rather than on a live one.
    expect(inheritedBy("W334", [...ALL, deferredTo("W334", "PROBE")])).toEqual(["PROBE"]);
    // `done` rather than `claimed`: the first draft pinned the row's IN-FLIGHT state and went red
    // the moment W334 closed it — a check keyed to a status its own unit was about to change,
    // which is W315's class pointed the other way. What matters durably is that the unit was
    // built, because an empty deferral list means nothing if nobody did the work.
    const row = parseLedgerRows(LEDGER).find((r) => r.id === "W334");
    expect(row?.status, "W334 is not a row anybody built, so the answer above proves nothing").toBe("done");
  });

  it("collects every hardening register the tree holds, both directions", () => {
    // W343 ANSWERING W339'S OWED CONDITION, and the condition was TRUE when it came to be answered:
    // four call sites each wrote `[Q22, Q23, Q24, W279]` by hand while the tree held six registers,
    // so Q25's pass and Q26's own were outside this clock and W318's for two quarters.
    expect(registerDiff(ROOT, [...COLLECTED_HARDENING_REGISTERS])).toEqual({ uncollected: [], stale: [] });
    // Non-vacuity: the arm that matters is the one that fires when a pass forgets to add itself.
    const forgot = registerDiff(ROOT, COLLECTED_HARDENING_REGISTERS.filter((m) => !m.endsWith("q26.ts")));
    expect(forgot.uncollected, "a pass nobody collects is invisible again").toEqual([
      "src/quality/hardening-q26.ts",
    ]);
    expect(registerDiff(ROOT, [...COLLECTED_HARDENING_REGISTERS, "src/quality/hardening-q99.ts"]).stale).toEqual(
      ["src/quality/hardening-q99.ts"],
    );
  });

  it("finds a hardening register that ARRIVES, which is what the collectors have to keep up with", () => {
    const found = withTree(
      {
        "src/quality/hardening-q99.ts": "export const FINDINGS = [];\n",
        "src/quality/hardening-q98.ts": "export const NOTES = [];\n",
      },
      (root) => hardeningRegisterModules(root),
    );
    expect(found, "a pass that records findings is not seen").toContain("src/quality/hardening-q99.ts");
    expect(found, "a module with the name and no findings is counted anyway").not.toContain(
      "src/quality/hardening-q98.ts",
    );
  });

  it("states what it does not cover", () => {
    expect(DEFERRAL_BOUND).toContain("whether the unit is the right one");
    expect(DEFERRAL_BOUND).toContain("in_flight");
    expect(DEFERRAL_BOUND.length).toBeGreaterThan(700);
  });
});

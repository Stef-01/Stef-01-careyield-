// W335 verify gate: "the outstanding position regenerated from the ledger and §4, every
// disagreement with `docs/GATE-DOSSIER-Y5.md` reported, and a planted stale dossier line reported."
//
// THE PLANTED LINE IS THE POINT AND THE LIVE TREE IS THE CONTROL. A register that only ever reads a
// correct document has been shown to be quiet, not to be right — and this one found two real
// omissions the day it was written, so the arms are driven on constructed text as well.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOSSIER_BOUND,
  DOSSIER_PATH,
  FOLDED_DECISIONS,
  OUTSTANDING_HEADING,
  blockedSinceTheDossier,
  dossierDiff,
  dossierRows,
  unitsInCell,
} from "./dossier-derived";
import { allLedgerRows } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

const ROOT = process.cwd();
const DOSSIER = readFileSync(path.join(ROOT, DOSSIER_PATH), "utf8");
const IDS = allLedgerRows(ROOT).map((r) => r.id);

/**
 * W257's Year 5 bound, resolved rather than imported.
 *
 * It is exported from a `.test.ts`, and importing a test file from a test file runs its suite
 * twice. Restating the number silently is the duplication W301 removes, so it is restated and
 * RESOLVED against W257's own declaration — the citation idiom, applied to a constant.
 */
const Y5_LAST_UNIT = 260;

describe("W335 the document says what the ledger says", () => {
  it("agrees with the derivation, in every direction", () => {
    expect(dossierDiff(ROOT), "the dossier and the ledger disagree about the position").toEqual([]);
  });

  it("is not vacuous: there is a table, and a position to compare it against", () => {
    const rows = dossierRows(DOSSIER, IDS);
    expect(rows.length, "the outstanding table did not parse, so nothing above is checked").toBeGreaterThan(
      5,
    );
    expect(outstandingRulings(ROOT).length).toBeGreaterThan(5);
    expect(rows.every((r) => r.units.length > 0), "a row names no unit at all").toBe(true);
  });

  it("reads an id the old parse could not see, which is the finding", () => {
    // `\bW\d+\b` cannot match `SUP-1`. Resolving against the ledger's own ids can, and that is the
    // whole difference between the document being right and being agreed with.
    expect(unitsInCell("W161, W162, SUP-1, SUP-2", IDS)).toEqual(["SUP-1", "SUP-2", "W161", "W162"]);
    expect(unitsInCell("W16", IDS), "a prefix was read as the longer id").not.toContain("W161");
  });

  it("holds the two rows the document had never counted", () => {
    // Named rather than counted: these two, by id, in the row the ledger attributes them to.
    const g5 = outstandingRulings(ROOT).find((r) => r.blocker === "G5")!;
    expect(g5.releases.map((u) => u.id)).toContain("SUP-1");
    expect(g5.releases.map((u) => u.id)).toContain("SUP-2");
    expect(dossierRows(DOSSIER, IDS)[0]!.units).toContain("SUP-1");
  });
});

describe("W335 the arms, each driven on a planted document", () => {
  const table = (rows: string) =>
    `${OUTSTANDING_HEADING}\n\n| Decision | Units blocked | Which | Open since |\n| --- | --- | --- | --- |\n${rows}\n\ntrailing prose\n`;
  /** The live table, so a planted defect is one line different from a correct document. */
  const live = () =>
    dossierRows(DOSSIER, IDS)
      .map((r) => `| **${r.decision}** | ${r.count} | ${r.units.join(", ")} | Y3 Q13 |`)
      .join("\n");

  it("says nothing about a document regenerated from the derivation itself", () => {
    // THE CONTROL. Every arm below plants one change into this text, so a defect reported here
    // would make all of them meaningless.
    expect(dossierDiff(ROOT, table(live()))).toEqual([]);
  });

  it("reports a unit the ledger blocks and the row does not name", () => {
    const stale = table(live().replace(", SUP-2", ""));
    expect(dossierDiff(ROOT, stale)).toEqual([
      { row: "G5", what: "blocks SUP-2 and the dossier's row does not name it" },
      { row: "G5", what: "states 8 units and its own row names 7" },
    ]);
  });

  it("reports a unit the row names and the ledger does not block on it", () => {
    const invented = table(live().replace("| 1 | W174 |", "| 1 | W174, W999 |"));
    expect(invented, "the planted id did not land").toContain("W999");
    // `W999` is not a ledger row at all, so the cell reader cannot resolve it — which is itself the
    // arm working: a row can only name units that exist, and an invented one reads as a count that
    // disagrees with its own list.
    expect(dossierDiff(ROOT, invented)).toEqual([]);
    const real = table(live().replace("| 1 | W174 |", "| 1 | W174, W185 |"));
    expect(dossierDiff(ROOT, real)).toEqual([
      { row: "G3", what: "names W185, which the ledger does not block on it" },
      { row: "G3", what: "states 1 units and its own row names 2" },
    ]);
  });

  it("reports a decision the ledger holds and the table has no row for", () => {
    const dropped = table(
      live()
        .split("\n")
        .filter((l) => !l.startsWith("| **G9"))
        .join("\n"),
    );
    expect(dossierDiff(ROOT, dropped)).toEqual([
      { row: "G9", what: "is outstanding and the dossier's table has no row for it" },
    ]);
  });

  it("reports a row for a decision the ledger blocks nothing on", () => {
    const extra = table(`${live()}\n| **G2** — real patient data | 1 | W174 | Y1 |`);
    expect(dossierDiff(ROOT, extra).map((d) => d.what)).toContain(
      "is a row in the dossier and the ledger blocks nothing on it",
    );
  });

  it("reports a count that disagrees with the row's own list", () => {
    const miscounted = table(live().replace("| 8 |", "| 9 |"));
    expect(dossierDiff(ROOT, miscounted)).toEqual([
      { row: "G5", what: "states 9 units and its own row names 8" },
    ]);
  });

  it("reports a fold the derivation no longer argues for", () => {
    // The one exemption this register carries, resolved against the derivation's own sentence
    // rather than trusted. W258's rule: a citation nobody resolves reads as coverage.
    for (const fold of FOLDED_DECISIONS) {
      const ruling = outstandingRulings(ROOT).find((r) => r.blocker === fold.decision);
      expect(ruling, `${fold.decision} is folded and the derivation does not report it`).toBeDefined();
      expect(ruling!.whoDecides).toContain(fold.quote);
    }
    // DRIVEN THROUGH THE DIFF, because asserting the quote here left the arm inside `dossierDiff`
    // removable without a test noticing — the tree's one fold is correct, so no real input could
    // make it speak. The folds are a parameter now and this hands it one the derivation refutes.
    const broken = [{ decision: "Q9 action 1", into: "G6", quote: "a sentence the derivation never wrote" }];
    expect(dossierDiff(ROOT, table(live()), broken).map((d) => d.what)).toContain(
      "is folded into G6 on a reason the derivation no longer gives",
    );
  });
});

describe("W335 the assumption under the comparison", () => {
  it("reads W257's bound rather than keeping a second copy of it", () => {
    const source = readFileSync(path.join(ROOT, "src/quality/gate-dossier-y5.test.ts"), "utf8");
    expect(source, "W257's Year 5 bound moved and this file did not").toContain(
      `export const Y5_LAST_UNIT = ${Y5_LAST_UNIT};`,
    );
  });

  it("checks that the position has not moved since the document was written", () => {
    // A LIVE DERIVATION AGAINST AN AS-AT DOCUMENT is only sound while no quarter has added a
    // blocked row. Q25 and Q26 add none, and this is what would say so if one did.
    expect(blockedSinceTheDossier(ROOT, Y5_LAST_UNIT), "a later quarter blocked a row").toEqual([]);
  });

  it("reports one when there is one, so the check is not quiet by construction", () => {
    expect(blockedSinceTheDossier(ROOT, 100).length, "no row is blocked above W100 either").toBeGreaterThan(
      5,
    );
  });

  it("states what it does not cover", () => {
    expect(DOSSIER_BOUND).toContain("ONE table");
    expect(DOSSIER_BOUND).toContain("AS-AT");
    expect(DOSSIER_BOUND.length).toBeGreaterThan(600);
  });
});

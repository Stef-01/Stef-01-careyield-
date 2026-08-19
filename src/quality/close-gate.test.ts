// W326 verify gate: "the ledger row a unit will commit is present in the tree its gate runs over,
// run as a step of the close rather than as a check about one, driven on the Q25 close that left
// `main` red after its own gate had passed."
//
// THE Q25 CLOSE IS REPLAYED RATHER THAN DESCRIBED. W324's `pending` arm has since been answered, so
// the arm as it stands cannot fire again — but `classDefects` takes its answer register as a
// parameter, which is W289's remedy paying for itself: the historical answer is handed back to the
// real function over a ledger with W323's row reopened, and the defect that reddened `main` appears
// again, here, on the closed side and not on the open one.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLOSE_GATE_BOUND,
  LEDGER_READERS,
  NOT_A_CLOSING_CHECK,
  type LedgerReader,
  breaksOnClose,
  closeGateDefects,
  ledgerNamingModules,
  readerDiff,
} from "./close-gate";
import { type ClassAnswer, classDefects } from "./claim-classes";
import { PLACEHOLDER_SHA } from "./closing-state";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const ledgerAt = (root: string) => readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");

/** A row put back the way it was before its close — the inverse of `closeRow`, for the replay. */
function reopenRow(ledger: string, unit: string): string {
  return ledger
    .split("\n")
    .map((line) => {
      if (!line.startsWith(`| ${unit} | `)) return line;
      const cells = line.split(" | ");
      cells[1] = "claimed";
      cells[4] = "—";
      return cells.join(" | ");
    })
    .join("\n");
}

describe("W326 every ledger-reading check is watched or excused, both directions", () => {
  it("agrees with the tree", () => {
    expect(readerDiff(ROOT), "a module reads the ledger and no closing check knows").toEqual({
      unwatched: [],
      stale: [],
    });
  });

  it("is not vacuous: the tree really does hold ledger readers, and an empty register reports them", () => {
    // The failure that would make everything below meaningless: a walk finding nothing reports a
    // clean tree and an empty tree the same way.
    expect(ledgerNamingModules(ROOT).length).toBeGreaterThan(10);
    const bare = readerDiff(ROOT, [], []);
    expect(bare.unwatched).toEqual(ledgerNamingModules(ROOT));
    expect(bare.stale).toEqual([]);
  });

  it("reports a declared reader the tree no longer holds", () => {
    const gone = readerDiff(ROOT, [], [{ module: "src/quality/gone.ts", why: "x".repeat(60) }]);
    expect(gone.stale).toEqual(["src/quality/gone.ts"]);
  });

  it("names an export each watched module really has", () => {
    // W258: a citation that does not resolve reads as coverage. A renamed check would leave this
    // register pointing at nothing and the close running one fewer check than it claims.
    for (const reader of LEDGER_READERS) {
      const [module, name] = reader.id.split("::");
      const body = readFileSync(path.join(ROOT, module!), "utf8");
      expect(
        new RegExp(`export (function|const) ${name}\\b`).test(body),
        `${reader.id} names an export ${module} does not have`,
      ).toBe(true);
    }
  });

  it("argues every watched check and every excuse", () => {
    for (const reader of LEDGER_READERS) {
      expect(reader.why.length, `${reader.id} is watched and nobody said what a close does to it`).toBeGreaterThan(
        120,
      );
    }
    for (const excuse of NOT_A_CLOSING_CHECK) {
      expect(excuse.why.length, `${excuse.module} is excused and nobody said why`).toBeGreaterThan(120);
    }
  });
});

describe("W326 the close is run over the tree the row will be committed into", () => {
  // A CONSTRUCTED ROW, NOT THIS UNIT'S OWN. The first draft closed `W326` against the real ledger
  // and every one of these passed — until W326's row was closed, at which point the row was already
  // `done` on both sides and the difference vanished. A test keyed to the unit's own row is the
  // class this unit is about, and `verify:close` could not see it: the assertion is welded in a
  // `.test.ts`, which is the first clause of `CLOSE_GATE_BOUND`. Only the full suite after the
  // close found it, which is the same way the Q25 close was found.
  const PLANTED = "| W999 | claimed | builder-A | 2026-08-14T00:00Z | — | a planted row |";

  it("reports a check whose answer the close changes", () => {
    const flips: LedgerReader = {
      id: "src/planted/flip.ts::flips",
      why: "y".repeat(130),
      run: (root) => (ledgerAt(root).includes("| W999 | done |") ? ["the row closed"] : []),
    };
    expect(breaksOnClose(ROOT, "W999", [flips], PLANTED).map((b) => b.what)).toEqual(["the row closed"]);
  });

  it("does NOT report a check that was already failing, which is the difference that makes it usable", () => {
    // W292'S PAIR, and the arm that decides whether anybody keeps running this. A closing check
    // that reported every pre-existing defect as something the close broke would be noise on its
    // first red tree, and the builder would stop reading it.
    const always: LedgerReader = {
      id: "src/planted/always.ts::always",
      why: "y".repeat(130),
      run: () => ["broken before and after"],
    };
    expect(breaksOnClose(ROOT, "W999", [always], PLANTED)).toEqual([]);
  });

  it("plants the closing ledger where the check can see it, rather than describing it", () => {
    // The gate's own words. A reader is handed a ROOT, and the row it reads has to be the closed
    // one — so the check reads the SHA out of the planted tree and it must be the placeholder.
    const reads: LedgerReader = {
      id: "src/planted/sha.ts::reads",
      why: "y".repeat(130),
      run: (root) => {
        const row = ledgerAt(root).split("\n").find((l) => l.startsWith("| W999 | "))!;
        return row.includes("0000000") ? ["the planted row carries the closing SHA"] : [];
      },
    };
    expect(breaksOnClose(ROOT, "W999", [reads], PLANTED).map((b) => b.what)).toEqual([
      "the planted row carries the closing SHA",
    ]);
  });

  it("replays the Q25 close that left `main` red after a green gate", () => {
    // THE UNIT'S REASON, DRIVEN ON THE REAL FUNCTION. W324 declared W323's class `pending` with an
    // arm that ends itself the day W323's row closes. builder-B closed it; the arm fired; `main`
    // was red for a firing because the close happens after the gate. Handing `classDefects` the
    // historical answer over a ledger with W323 reopened reproduces exactly that, and this check
    // would have said so BEFORE the push.
    const wasPending: ClassAnswer = {
      unit: "W323",
      answer: {
        kind: "pending",
        by: "W323",
        why: "The answer W324 shipped, quoted so the replay drives what actually happened rather than a shape resembling it.",
      },
    };
    const asItWas: LedgerReader = {
      id: "src/quality/claim-classes.ts::classDefects",
      why: "y".repeat(130),
      run: (root) => classDefects(root, [wasPending]).map((d) => `${d.unit} ${d.what}`),
    };
    const before = reopenRow(LEDGER, "W323");
    expect(before, "W323's row did not reopen, so the replay closes an already-closed row").toContain(
      "| W323 | claimed |",
    );
    expect(breaksOnClose(ROOT, "W323", [asItWas], before).map((b) => b.what)).toEqual([
      "W323 waits on W323, which has landed",
    ]);
  });

  it("says nothing about the same close while the row stays open, which is the other half of the replay", () => {
    // Without this the test above shows only that the arm reports SOMEWHERE. What makes it the
    // close's doing is that the open ledger is silent about it.
    const wasPending: ClassAnswer = {
      unit: "W323",
      answer: { kind: "pending", by: "W323", why: "The answer W324 shipped, for the negative half." },
    };
    const open = reopenRow(LEDGER, "W323");
    expect(
      classDefects(ROOT, [wasPending]).filter((d) => d.what.includes("has landed")).length,
      "the live tree already has W323 done, so this reads the real ledger and not the reopened one",
    ).toBe(1);
    expect(open).not.toContain("| W323 | done |");
  });
});

describe("W326 the live tree", () => {
  it("closes the row in flight without breaking anything", () => {
    // THE STEP ITSELF. Run at the close by `pnpm verify:close`; run here so a tree that would break
    // on its own close cannot go green first.
    expect(closeGateDefects(ROOT), "closing the row in flight breaks a check").toEqual([]);
  });

  it("really closes the rows in flight, driven on a ledger of its own", () => {
    // THE MUTATION THAT SURVIVED THE FIRST DRAFT. `closeGateDefects` welded to the real ledger was
    // made to close nothing at all and every test still passed, because the live tree breaks on no
    // close: an empty answer and an empty check are the same green. Driven on a constructed ledger
    // instead of on "a row is in flight", which W315 records as the version that breaks for being
    // true the moment a firing ends.
    const ledger = "| W999 | claimed | builder-A | 2026-08-14T00:00Z | — | a planted row |";
    const flips: LedgerReader = {
      id: "src/planted/inflight.ts::flips",
      why: "y".repeat(130),
      run: (root) => (ledgerAt(root).includes("| W999 | done |") ? ["the planted row closed"] : []),
    };
    expect(closeGateDefects(ROOT, PLACEHOLDER_SHA, [flips], ledger).map((b) => b.what)).toEqual([
      "the planted row closed",
    ]);
    // And nothing in flight is nothing to close — honest rather than convenient, W315's line.
    const settled = "| W999 | done | builder-A | 2026-08-14T00:00Z | abc1234 | a planted row |";
    expect(closeGateDefects(ROOT, PLACEHOLDER_SHA, [flips], settled)).toEqual([]);
  });

  it("states what it does not cover, including the welded checks the Q25 close also broke", () => {
    expect(CLOSE_GATE_BOUND).toContain("welded");
    expect(CLOSE_GATE_BOUND).toContain("W289");
    expect(CLOSE_GATE_BOUND.length).toBeGreaterThan(600);
  });
});

describe("W355 the defaulted register is handed a different value, at home", () => {
  // A default promises the comparison can be asked another question, and a promise nobody collects
  // is a signature that reads as drivable while the only value it ever had is the default. W355
  // found twelve parameters in this tree whose parameter no call anywhere supplied; this is one of them.

  it("takes a placeholder SHA it is given, not only its own", () => {
    const other = closeGateDefects(ROOT, "0000000");
    const own = closeGateDefects(ROOT, PLACEHOLDER_SHA);
    expect(Array.isArray(other)).toBe(true);
    expect(other, "the placeholder SHA is not read at all").not.toBe(own);
  });
});

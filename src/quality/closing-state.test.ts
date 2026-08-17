// W315 verify gate: "the ledger row a unit will commit is present in the tree the gate runs over,
// driven on the three consequences this quarter produced — a lost `[P]` prefix, a bound stale on
// its own close, and a `PENDING` SHA in a committed row."
//
// ALL THREE ARE DRIVEN AS THEY HAPPENED, on planted ledgers rather than on the tree. A healthy tree
// produces none of them by construction — that is what being fixed means — so a suite that only
// asserted the live tree is clean would prove that the defects are gone and nothing about whether
// the check would notice them coming back.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLOSING_BOUND,
  CLOSING_CHECKS,
  PLACEHOLDER_SHA,
  closeRow,
  boundsStaleOnClose,
  closingDefects,
  unitsInFlight,
} from "./closing-state";
import { copyTree, withPlantedIn, withTree } from "./planting";
import { type StatedBound, staleBounds } from "./bounds";

const ROOT = process.cwd();
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const check = (id: string) => CLOSING_CHECKS.find((c) => c.id === id)!;

/** A tree holding just enough for the checks: a ledger and a plan. */
function tree(ledger: string, plan: string = PLAN) {
  return { "BUILD-STATE.md": ledger, "docs/FIVE-YEAR-PLAN.md": plan };
}

describe("W315 the row is closed before the checks read it", () => {
  it("closes a claimed row into a done row with a SHA", () => {
    const before = "| W999 | claimed | builder-B | 2026-08-17T00:00Z | — | [P] a planned thing |";
    const after = closeRow(before, "W999", "abc1234");
    expect(after).toBe("| W999 | done | builder-B | 2026-08-17T00:00Z | abc1234 | [P] a planned thing |");
  });

  it("touches no row but the one named", () => {
    // The close is a rewrite of the ledger, and a rewrite that moved a neighbouring row would make
    // every check below read a tree the commit will not contain.
    const closed = closeRow(LEDGER, "W315");
    const changed = LEDGER.split("\n").filter((line, i) => line !== closed.split("\n")[i]);
    expect(changed).toHaveLength(1);
    expect(changed[0]).toContain("| W315 |");
  });

  it("finds every row in flight, not just one", () => {
    // THE FIRST DRAFT'S DEFECT. It returned the single claimed row and null when there were two —
    // which is the ORDINARY state here, because overlapping sessions are how this tree is built. It
    // reported nothing on its first run against a live tree with two claims.
    const two = [
      "| W900 | claimed | builder-A | 2026-08-17T00:00Z | — | one |",
      "| W901 | claimed | builder-B | 2026-08-17T00:00Z | — | another |",
      "| W902 | done | builder-B | 2026-08-17T00:00Z | abc1234 | finished |",
    ].join("\n");
    expect(unitsInFlight(two)).toEqual(["W900", "W901"]);
    expect(unitsInFlight("| W902 | done | b | t | abc1234 | finished |")).toEqual([]);
  });
});

describe("W315 the three consequences, each driven as it happened", () => {
  it("reports a PENDING SHA in a row that is being committed", () => {
    // W310 AND EVERY UNIT BEFORE IT. A row cannot carry its own commit's hash, so the habit was to
    // write `PENDING` and fill it afterwards — leaving a commit whose ledger fails W168. Nobody saw
    // it for three hundred units because the gate ran before the row was written.
    const pending = "| W999 | done | builder-B | 2026-08-17T00:00Z | PENDING | [P] a planned thing |";
    expect(check("sha-shape").run(pending, ROOT, "W999")).toEqual([
      'W999 closes with no SHA to point at (cell: "PENDING")',
    ]);
    // And the em-dash a claimed row carries, which is the same defect spelled differently.
    const dash = "| W999 | done | builder-B | 2026-08-17T00:00Z | — | [P] a planned thing |";
    expect(check("sha-shape").run(dash, ROOT, "W999")).toHaveLength(1);
    // The positive control: a real hash passes, so the check is reading the cell.
    const real = "| W999 | done | builder-B | 2026-08-17T00:00Z | 7ee754b | [P] a planned thing |";
    expect(check("sha-shape").run(real, ROOT, "W999")).toEqual([]);
  });

  it("reports a note that dropped the `[P]` prefix its plan line carries", () => {
    // W304, EXACTLY. Its plan line begins `[P] Counts as properties…` and the note written at close
    // began `Counts as properties…`. `horizon-q24` caught it a firing later; this catches it now.
    const plan = "- **W999** [P] A planned thing → verify: something.\n";
    const dropped = "| W999 | done | builder-B | 2026-08-17T00:00Z | abc1234 | A planned thing → verify: something. |";
    const kept = "| W999 | done | builder-B | 2026-08-17T00:00Z | abc1234 | [P] A planned thing → verify: something. and more |";
    const found = withTree(tree(dropped, plan), (root) => check("plan-agreement").run(dropped, root, "W999"));
    expect(found).toEqual(["W999 reads differently in the ledger than in the plan"]);
    const clean = withTree(tree(kept, plan), (root) => check("plan-agreement").run(kept, root, "W999"));
    expect(clean).toEqual([]);
  });

  it("reports a bound that its own close makes stale", () => {
    // W308's TAX_BOUND, REPRODUCED. Its predicate read the ledger for `W308 | done` being ABSENT,
    // so it was true while the gate ran and false the instant the row closed — the bound went stale
    // in the commit that shipped it, and its own suite could not have seen it.
    //
    // A DISCRIMINATING PAIR over the same predicate: the row claimed, then the row closed. Nothing
    // else differs, so a `staleBounds` that reported both or neither would fail here. `staleBounds`
    // takes its register as a parameter — W306's remedy — which is the only reason this is
    // constructible at all.
    const ledgerReading: StatedBound = {
      module: "src/planted/x.ts",
      name: "PLANTED_BOUND",
      unit: "W999",
      text: "a sentence whose remedy is W999 landing",
      lifting: {
        kind: "remedy",
        remedy: "W999 landing",
        reads: "the ledger, for W999's row still being open",
        stillOpen: (root: string) =>
          !/^\| W999 \| done \|/m.test(readFileSync(path.join(root, "BUILD-STATE.md"), "utf8")),
        lifted: { kind: "never_derived", why: "x".repeat(210) },
      },
      numbers: [],
    };
    const claimed = "| W999 | claimed | builder-B | 2026-08-17T00:00Z | — | a planned thing |\n";
    const closed = closeRow(claimed, "W999", "abc1234");

    const whileClaimed = withTree(tree(claimed), (root) => staleBounds(root, [ledgerReading]));
    expect(whileClaimed, "the bound reads stale before its row closes").toEqual([]);

    const onceClosed = withTree(tree(closed), (root) => staleBounds(root, [ledgerReading]));
    expect(onceClosed.map((d) => d.bound), "closing the row does not make the bound stale").toEqual([
      "src/planted/x.ts::PLANTED_BOUND",
    ]);

    // AND THROUGH THE CHECK ITSELF, over the real root, with the constructed bound handed in. The
    // pair above proves the predicate flips; this proves the check PLANTS the closing ledger — a
    // mutation that stopped planting it survived the pair, because no real bound reads a row.
    expect(boundsStaleOnClose(closeRow(LEDGER, "W315", "abc1234"), ROOT, "W315", [ledgerReading])).toEqual(
      [],
    );
    const withRow = `${LEDGER}\n| W999 | done | builder-B | 2026-08-17T00:00Z | abc1234 | a planned thing |`;
    expect(boundsStaleOnClose(withRow, ROOT, "W315", [ledgerReading])).toHaveLength(1);
  });

  it("has no such bound in the tree today, and the arm exists for the next one", () => {
    // The live half. W311 retired the last ledger-reading predicate, so the real register produces
    // nothing here — which is why the arm above is constructed rather than measured.
    const closingAll = LEDGER.split("\n")
      .map((line) =>
        / \| claimed \| /.test(line) ? closeRow(line, line.split(" | ")[0]!.slice(2), "abc1234") : line,
      )
      .join("\n");
    expect(check("bounds-not-stale").run(closingAll, ROOT, "W315")).toEqual([]);
  });

  it("argues every check, naming the defect it would have caught", () => {
    for (const c of CLOSING_CHECKS) {
      expect(c.why.length, `${c.id} is not argued`).toBeGreaterThan(150);
      expect(c.why, `${c.id} names no unit it would have caught`).toMatch(/W\d+/);
    }
    expect(CLOSING_CHECKS.map((c) => c.id).sort()).toEqual([
      "bounds-not-stale",
      "plan-agreement",
      "sha-shape",
    ]);
  });
});

describe("W315 the tree's own closing state", () => {
  it("has nothing that would break when the units in flight close", () => {
    // The live check, and the one that runs every firing from here on. It is not the unit's proof —
    // the planted arms above are — but it is the reason the unit exists.
    expect(closingDefects(ROOT)).toEqual([]);
  });

  it("reports nothing when nothing is in flight, rather than inventing a unit", () => {
    const finished = "| W902 | done | builder-B | 2026-08-17T00:00Z | abc1234 | finished |\n";
    expect(withTree(tree(finished), (root) => closingDefects(root))).toEqual([]);
  });

  it("reports a defect for the row in flight when there is one", () => {
    // NON-VACUITY FOR THE EMPTINESS ABOVE, on a CLAIMED ROW PLANTED into a copy of the real tree.
    //
    // The first version read the live ledger and required a row to be in flight — which broke
    // within one firing, the moment this unit and its sibling both closed and nothing was claimed.
    // That is the module's own documented ordinary state, asserted against by its own test: a test
    // that depends on the tree being mid-firing passes only while somebody is watching it.
    //
    // A copy of the repository rather than a constructed root, because `bounds-not-stale` runs real
    // predicates and needs a real tree.
    const copy = copyTree(ROOT);
    const claimed = `${LEDGER}\n| W999 | claimed | builder-B | 2026-08-17T00:00Z | — | a note the plan does not state |`;
    const found = withPlantedIn(copy, { "BUILD-STATE.md": claimed }, () => closingDefects(copy, "notasha"));
    expect(found.length, "a bad SHA closes cleanly, so nothing is being checked").toBeGreaterThan(0);
    expect(found.join(" "), "the planted row in flight is not reported").toContain("W999");
  });

  it("uses a placeholder that is shaped like a hash and is not one", () => {
    expect(PLACEHOLDER_SHA).toMatch(/^[0-9a-f]{7,40}$/);
    expect(LEDGER, "the placeholder is a real SHA in this ledger").not.toContain(`| ${PLACEHOLDER_SHA} |`);
  });
});

describe("W315 what the closing state does not prove", () => {
  it("says the SHA cannot be verified, and why that is circular", () => {
    expect(CLOSING_BOUND).toMatch(/circular/);
    expect(CLOSING_BOUND).toMatch(/placeholder/);
  });

  it("says a fourth welded check would be invisible to it", () => {
    // The bound's most useful half: these three were reimplemented over ledger text because the
    // originals live in `.test.ts` files and export nothing, so a fifth written the same way is
    // not covered. W289's remedy, restated where the gap is.
    expect(CLOSING_BOUND).toMatch(/W289/);
    expect(CLOSING_BOUND).toMatch(/export nothing/);
  });
});

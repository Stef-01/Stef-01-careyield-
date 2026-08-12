// W257: the five-year gate dossier's arithmetic, checked against the ledger it was derived from.
//
// ROW BY ROW, WHICH IS W207'S SHAPE AND W207'S LESSON. Its first version asserted that the
// document "names every blocked unit somewhere", and deleting an entire table row left the
// assertion green — because the unit was still mentioned in the surrounding prose. A dossier is
// read as a table by whoever is deciding, so the table is what has to be checked, cell by cell.
//
// And every figure comes from `BUILD-STATE.md` and the plan's §4 rather than from another
// dossier, because a document that quotes the documents it summarises agrees with itself.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (...parts: string[]) => readFileSync(path.join(ROOT, ...parts), "utf8");
const DOSSIER = read("docs", "GATE-DOSSIER-Y5.md");
const LEDGER = read("BUILD-STATE.md");
const PLAN = read("docs", "FIVE-YEAR-PLAN.md");

/**
 * Whitespace-flattened, for claims that span a line break.
 *
 * W245 hit this on a blockquote and it recurs here on an inline quotation: markdown wraps, so a
 * sentence quoted mid-paragraph is not a substring of the file. Checking the raw text would have
 * failed against a document that does contain the words.
 */
const flat = (text: string) => text.replace(/\s+/g, " ");
const DOSSIER_FLAT = flat(DOSSIER);

/**
 * The last unit of Year 5, and the reason this constant exists at all.
 *
 * W210'S LATENT-FINDING REGISTER CAUGHT THIS UNIT. DOSSIER-1 was recorded at W208 and says: a
 * gate dossier prices the decisions outstanding AT A POINT IN TIME, and a test that reads the live
 * ledger goes red the moment the next year is planned — W207's did, when W208 appended five
 * blocked Year-5 rows. The document had not become wrong; the check had. My first version of this
 * file read the whole ledger, so W260's Y6 expansion would have done it again.
 *
 * The finding is recognised by the NAME of the bound, because a grep cannot detect the semantics.
 * That creates a trap this comment has to step around: naming the token DOSSIER-1 looks for, in
 * prose, SATISFIES ITS DETECTOR WITHOUT A BOUND EXISTING. A break confirmed it — renaming the
 * constant below still passed, because these lines matched instead. So the token is not written
 * out here, and the detector is left checking the code. W198's collision, in the one place where
 * it would have made a latent-finding register vacuous about the file explaining itself to it.
 */
export const Y5_LAST_UNIT = 260;

interface LedgerRow {
  id: string;
  status: string;
  note: string;
}

const ledgerRows = (): LedgerRow[] =>
  [...LEDGER.matchAll(/^\| (W\d+) \| (\w+) \|(.*)$/gm)]
    .map((m) => ({ id: m[1]!, status: m[2]!, note: m[3]! }))
    .filter((row) => Number(row.id.slice(1)) <= Y5_LAST_UNIT);

/** Unit ids the ledger blocks on a given gate, as the ledger itself attributes them. */
const blockedOn = (gate: string): string[] =>
  ledgerRows()
    .filter((r) => r.status === "blocked" && new RegExp(`FOUNDER GATE ${gate}\\b`).test(r.note))
    .map((r) => r.id);

/** Every gate the plan's §4 defines, read off the plan. */
const definedGates = (): string[] =>
  [...PLAN.matchAll(/^- \*\*(G\d+)\*\*/gm)].map((m) => m[1]!);

/** One table in the dossier, as rows of trimmed cells. Tables are separated by a blank line. */
function tableAfter(heading: string): string[][] {
  const from = DOSSIER.indexOf(heading);
  expect(from, `no heading ${heading}`).toBeGreaterThan(-1);
  const lines = DOSSIER.slice(from).split("\n");
  const rows: string[][] = [];
  let started = false;
  for (const line of lines) {
    if (line.startsWith("|")) {
      started = true;
      const cells = line.split("|").map((c) => c.trim()).filter((c) => c !== "");
      if (!/^-+$/.test(cells[0] ?? "")) rows.push(cells);
    } else if (started && line.trim() === "") break;
  }
  return rows.slice(1); // drop the header row
}

/** Unit ids named in a table cell. */
const unitsIn = (cell: string): string[] => [...cell.matchAll(/\bW\d+\b/g)].map((m) => m[0]).sort();

describe("W257 the ledger is the source, and it has something to say", () => {
  it("is bounded to Year 5, so a later year's rows cannot rewrite this document", () => {
    // DOSSIER-1, W210's register, caught the unbounded version of this file. W207 went red when
    // W208 planned Year 5; without the bound, W260 would do it again to this one.
    const all = [...LEDGER.matchAll(/^\| (W\d+) \|/gm)].map((m) => Number(m[1]!.slice(1)));
    expect(Math.max(...all), "the ledger has passed Year 5").toBeLessThanOrEqual(Y5_LAST_UNIT);
    expect(ledgerRows().every((r) => Number(r.id.slice(1)) <= Y5_LAST_UNIT)).toBe(true);
  });

  it("finds blocked rows to count, so the tables are not over nothing", () => {
    const blocked = ledgerRows().filter((r) => r.status === "blocked");
    expect(blocked.length, "the ledger blocks nothing, so this dossier prices nothing").toBe(16);
    expect(DOSSIER_FLAT).toContain("Sixteen ledger rows are blocked");
  });

  it("attributes every blocked row to a gate or to the one named decision", () => {
    // No blocked row may be outside the dossier's account of them — the direction that would make
    // the document quietly incomplete rather than wrong.
    for (const row of ledgerRows().filter((r) => r.status === "blocked")) {
      const attributed = /FOUNDER GATE G\d+|FOUNDER DECISION/.test(row.note);
      expect(attributed, `${row.id} is blocked on nothing this dossier can price`).toBe(true);
    }
  });
});

describe("W257 the finding: four gates block no unit", () => {
  it("names exactly the gates the ledger never blocks on", () => {
    // THE HEADLINE, checked against the ledger rather than asserted. If a unit is ever blocked on
    // G1, G2, G4 or G7, this row stops being true and the document must be rewritten.
    const rows = tableAfter("## The finding, stated first");
    const listed = rows.map((r) => r[0]!.match(/G\d+/)![0]);
    const neverBlocked = definedGates().filter(
      (g) => g !== "G0" && blockedOn(g).length === 0,
    );
    expect(listed.sort()).toEqual(neverBlocked.sort());
    for (const row of rows) {
      expect(row[1], `${row[0]} claims a non-zero count`).toBe("**0**");
      expect(row[2]!.length, `${row[0]} says nothing about what it gates`).toBeGreaterThan(60);
    }
  });

  it("says that blocking nothing is not costing nothing", () => {
    expect(DOSSIER_FLAT).toContain("A gate that blocks nothing is not a gate that costs nothing");
  });
});

describe("W257 every outstanding decision, row by row", () => {
  it("names in each row exactly the units the ledger attributes to that decision", () => {
    // W207'S LESSON. Its first version asked whether the document mentioned each unit anywhere,
    // and deleting a whole row left that green. Each row is checked on its own terms instead.
    const rows = tableAfter("## Everything still outstanding");
    expect(rows.map((r) => r[0]!.match(/\*\*(.+?)\*\*/)![1])).toEqual([
      "G5",
      "G6",
      "G8",
      "G9",
      "G10",
      "G3",
      "Q17 action 1",
    ]);
    for (const row of rows) {
      const label = row[0]!.match(/\*\*(.+?)\*\*/)![1]!;
      const claimed = Number(row[1]);
      const named = unitsIn(row[2]!);
      expect(named.length, `${label} names a different number of units than it counts`).toBe(claimed);
      if (/^G\d+$/.test(label)) {
        expect(named, `${label}'s units disagree with the ledger`).toEqual(blockedOn(label).sort());
      }
    }
  });

  it("accounts for every blocked row exactly once across the table", () => {
    // Both directions: no blocked unit missing, and none counted twice.
    const rows = tableAfter("## Everything still outstanding");
    const named = rows.flatMap((r) => unitsIn(r[2]!));
    const blocked = ledgerRows().filter((r) => r.status === "blocked").map((r) => r.id);
    expect(named.sort()).toEqual(blocked.sort());
    expect(new Set(named).size, "a unit is priced under two decisions").toBe(named.length);
  });

  it("counts G5 as the largest blocker and says it grew", () => {
    // W207 recorded four; Y5's two vertical-content units joined it. The claim is checked rather
    // than carried, because "it grew" is the kind of sentence that stops being true silently.
    expect(blockedOn("G5")).toHaveLength(6);
    expect(blockedOn("G5")).toContain("W249");
    expect(blockedOn("G5")).toContain("W251");
    expect(DOSSIER_FLAT).toContain("from four units at W207");
  });
});

describe("W257 three gates proposed, none answered", () => {
  it("matches the plan on which gates are proposed and never ruled", () => {
    const rows = tableAfter("## Three gates have been PROPOSED");
    expect(rows.map((r) => r[0]!.match(/G\d+/)![0])).toEqual(["G8", "G9", "G10"]);
    for (const row of rows) {
      const gate = row[0]!.match(/G\d+/)![0]!;
      // The plan still says PROPOSED / awaiting ratification for each.
      expect(PLAN, `${gate} is no longer proposed in the plan`).toMatch(
        new RegExp(`\\*\\*${gate}\\*\\* — \\*\\*PROPOSED at (W\\d+)`),
      );
      const proposedAt = PLAN.match(new RegExp(`\\*\\*${gate}\\*\\* — \\*\\*PROPOSED at (W\\d+)`))![1];
      expect(row[1], `${gate}'s proposal unit disagrees with the plan`).toBe(proposedAt);
      expect(unitsIn(row[3]!), `${gate}'s units disagree with the ledger`).toEqual(
        blockedOn(gate).sort(),
      );
      expect(row[4], `${gate} is recorded as answered`).toBe("no");
    }
  });

  it("states the pattern rather than leaving it to be noticed", () => {
    expect(DOSSIER_FLAT).toContain(
      "The loop has proposed a gate roughly once a year for three years and none has been ruled on",
    );
    expect(DOSSIER).toContain("The mechanism is working; the answering is not.");
  });

  it("carries W245's double-blocking, so ratifying one is not read as releasing an exchange", () => {
    expect(DOSSIER_FLAT).toContain("releases no exchange with anybody");
    expect(DOSSIER).toContain("**G1 is the gate under the other two**");
    // And G1 really does block nothing in the ledger, which is what makes that sentence bite.
    expect(blockedOn("G1")).toEqual([]);
  });
});

describe("W257 the document decides nothing", () => {
  it("says so, and quotes the plan's own instruction", () => {
    expect(flat(PLAN)).toContain("the loop must not decide this itself");
    expect(DOSSIER_FLAT).toContain("the loop must not decide this itself");
    expect(DOSSIER_FLAT).toContain("No decision here is one the loop may take");
  });

  it("refuses to rank the outstanding decisions", () => {
    // The two orders that fall out of the tables disagree, and choosing between them is a founder's
    // call rather than a document's — W207 found the same and this does not quietly improve on it.
    expect(DOSSIER_FLAT).toContain("It does not rank the outstanding");
    expect(DOSSIER).toContain("disagree");
  });

  it("re-prices nothing a quarter dossier settled", () => {
    expect(DOSSIER).toContain("docs/GATE-DOSSIER-Y4.md");
    expect(DOSSIER).toContain("It does not re-price");
    expect(DOSSIER).toContain("It does not propose an eleventh gate");
  });
});

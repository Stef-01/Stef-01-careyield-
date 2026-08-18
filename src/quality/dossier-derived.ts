// W335: the gate dossier, derived rather than written.
//
// `docs/GATE-DOSSIER-Y5.md` prices every decision still outstanding, and W257 built it with a
// row-by-row test — W207's shape, adopted because W207's first version asserted the document "names
// every blocked unit somewhere" and stayed green when a whole row was deleted. That test is good and
// it is still there. What it cannot do is notice that IT AND THE DOCUMENT SHARE A PARSE.
//
// THE DOSSIER SAYS SIXTEEN AND THE LEDGER HOLDS EIGHTEEN. `gate-dossier-y5.test.ts` keeps its own
// `^\| (W\d+) \|` regex and its own `\bW\d+\b` cell reader — the parse W310 found dropping `SUP-1`
// and `SUP-2`, two rows blocked on G5 since W89. W310 fixed `allLedgerRows` and every register that
// calls it; this file was not one, because it had its own copy. So the document says G5 blocks six
// units, the test agrees, and both are wrong by the same two rows for the same reason. That is the
// duplication W301 spent a unit removing, and this is what it costs: a check and its subject
// agreeing with each other instead of with the tree.
//
// SO THE POSITION IS REGENERATED FROM THE DERIVATION EVERY OTHER REGISTER USES. `outstandingRulings`
// reads `allLedgerRows` and the plan's §4; this compares what it produces against what the document
// states, in four directions — a decision the document omits, a unit its row omits, a unit its row
// invents, and a count that disagrees with the row's own list.
//
// ONE FOLD IS DECLARED AND CHECKED. The derivation reports `Q9 action 1` and `G6` separately and
// says in its own text that they are THE SAME RULING; the dossier folds them into one row. That is
// right, so the fold is written down here and resolved against the derivation's own sentence — an
// exemption that would go stale silently if it were a filter.
//
// WHAT THIS DOES NOT PROVE is `DOSSIER_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the ledger, the plan and one document.

import { readFileSync } from "node:fs";
import path from "node:path";
import { allLedgerRows } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

export const DOSSIER_PATH = "docs/GATE-DOSSIER-Y5.md";

/** The table this register regenerates. */
export const OUTSTANDING_HEADING = "## Everything still outstanding, by units released";

/**
 * Decisions the dossier folds into another row, with the derivation's own words for why.
 *
 * `quote` must appear in the folded decision's `whoDecides`, so the fold is resolved against the
 * derivation rather than asserted here — W258's rule. A fold whose reason the derivation has
 * stopped giving is reported like any other disagreement.
 *
 * TAKEN AS A PARAMETER BY `dossierDiff`, which a mutation is the reason for: welded to this
 * constant, the arm that checks the quote survived being removed entirely, because the tree's one
 * fold is correct and no test could hand it a broken one. W289's remedy, on an exemption list.
 */
export const FOLDED_DECISIONS: readonly { decision: string; into: string; quote: string }[] = [
  {
    decision: "Q9 action 1",
    into: "G6",
    quote: "THE SAME RULING as G6",
  },
];

/** One row of the outstanding table, as the document states it. */
export interface DossierRow {
  /** The decision cell, trimmed of markdown emphasis. */
  decision: string;
  /** The units-blocked cell, as written. */
  count: string;
  /** The ids the "Which" cell names, resolved against the ledger's own ids. */
  units: string[];
}

/** Every id the ledger holds, so a cell is read against real rows rather than a guessed shape. */
function ledgerIds(root: string): string[] {
  return allLedgerRows(root).map((r) => r.id);
}

/** The ids a cell names — matched against known ids, which is how `SUP-1` is seen at all. */
export function unitsInCell(cell: string, known: readonly string[]): string[] {
  return known.filter((id) => new RegExp(`(^|[^\\w-])${id}([^\\w-]|$)`).test(cell)).sort();
}

/** The outstanding table, parsed. */
export function dossierRows(
  text: string,
  known: readonly string[],
  heading: string = OUTSTANDING_HEADING,
): DossierRow[] {
  const from = text.indexOf(heading);
  if (from === -1) return [];
  const rows: DossierRow[] = [];
  let started = false;
  for (const line of text.slice(from).split("\n")) {
    if (line.startsWith("|")) {
      started = true;
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c !== "");
      if (/^-+$/.test(cells[0] ?? "")) continue;
      rows.push({
        decision: (cells[0] ?? "").replace(/\*/g, "").trim(),
        count: cells[1] ?? "",
        units: unitsInCell(cells[2] ?? "", known),
      });
    } else if (started && line.trim() === "") break;
  }
  return rows.slice(1);
}

export interface DossierDefect {
  row: string;
  what: string;
}

/** Which derived decision a dossier row is about, allowing for the declared fold. */
const rowFor = (
  rows: readonly DossierRow[],
  decision: string,
  folds: readonly { decision: string; into: string; quote: string }[] = FOLDED_DECISIONS,
): DossierRow | undefined => {
  const folded = folds.find((f) => f.decision === decision);
  const wanted = folded ? folded.into : decision;
  return rows.find((r) => r.decision.startsWith(wanted));
};

/**
 * The document against the derivation, in four directions.
 *
 * The derivation is LIVE and the document is as-at Year 5, which is only sound because no ruling
 * has landed and no quarter since has added a blocked row — a claim this register checks rather
 * than assumes, in `blockedSinceTheDossier`.
 */
export function dossierDiff(
  root: string,
  text: string = readFileSync(path.join(root, DOSSIER_PATH), "utf8"),
  folds: readonly { decision: string; into: string; quote: string }[] = FOLDED_DECISIONS,
): DossierDefect[] {
  const known = ledgerIds(root);
  const rows = dossierRows(text, known);
  const out: DossierDefect[] = [];

  for (const ruling of outstandingRulings(root)) {
    const folded = folds.find((f) => f.decision === ruling.blocker);
    if (folded && !ruling.whoDecides.includes(folded.quote)) {
      out.push({
        row: ruling.blocker,
        what: `is folded into ${folded.into} on a reason the derivation no longer gives`,
      });
    }
    const row = rowFor(rows, ruling.blocker, folds);
    if (row === undefined) {
      out.push({ row: ruling.blocker, what: "is outstanding and the dossier's table has no row for it" });
      continue;
    }
    if (folded) continue;
    const derived = ruling.releases.map((u) => u.id).sort();
    for (const id of derived) {
      if (!row.units.includes(id)) {
        out.push({ row: ruling.blocker, what: `blocks ${id} and the dossier's row does not name it` });
      }
    }
    for (const id of row.units) {
      if (!derived.includes(id)) {
        out.push({ row: ruling.blocker, what: `names ${id}, which the ledger does not block on it` });
      }
    }
    if (row.count !== String(row.units.length)) {
      out.push({
        row: ruling.blocker,
        what: `states ${row.count} units and its own row names ${row.units.length}`,
      });
    }
  }

  const derivedDecisions = new Set(
    outstandingRulings(root).map((r) => folds.find((f) => f.decision === r.blocker)?.into ?? r.blocker),
  );
  for (const row of rows) {
    if (![...derivedDecisions].some((d) => row.decision.startsWith(d))) {
      out.push({ row: row.decision, what: "is a row in the dossier and the ledger blocks nothing on it" });
    }
  }
  return out.sort((a, b) => `${a.row}${a.what}`.localeCompare(`${b.row}${b.what}`));
}

/**
 * Blocked rows that arrived after the dossier was written.
 *
 * THE ASSUMPTION UNDER THE WHOLE COMPARISON, checked. A live derivation may be diffed against an
 * as-at document only while the position has not moved; the moment a quarter adds a blocked row,
 * this register would report the document stale for describing the year it describes.
 */
export function blockedSinceTheDossier(root: string, lastUnit: number): string[] {
  return allLedgerRows(root)
    .filter((r) => r.status === "blocked")
    .filter((r) => {
      const n = /^W(\d+)$/.exec(r.id);
      return n !== null && Number(n[1]) > lastUnit;
    })
    .map((r) => r.id)
    .sort();
}

/**
 * Whether a row naming an id the ledger does not hold still goes unreported.
 *
 * `DOSSIER_BOUND`'s own predicate, exported because W297 requires a bound to carry one and W289
 * requires it to be callable. It reads the CELL READER rather than the document: `unitsInCell`
 * resolves against known rows, so a token outside that list is not seen as a unit at all. Empty
 * means the blind spot is still there — which is what the sentence says — and when somebody writes
 * the id-shaped-token check this stops being empty and the bound goes stale.
 *
 * IT TAKES NO TREE AND MUST NOT. W306 drives every predicate against a bare root and a full one,
 * and the first draft read the dossier off disk: on an empty tree it threw `ENOENT` through a bound
 * predicate, which is Q24-CR-7's shape exactly, one quarter after that finding was fixed.
 */
export function dossierDiffFor(root: string): DossierDefect[] {
  void root;
  const known = ["W174"];
  return unitsInCell("W174, W999", known).includes("W999")
    ? [{ row: "-", what: "an id the ledger does not hold is reported after all" }]
    : [];
}

/** What a green comparison does not prove. */
export const DOSSIER_BOUND =
  "It regenerates ONE table — the outstanding position, decision by decision and unit by unit. " +
  "The dossier's prose is where its argument lives: that four gates block nothing and are the four " +
  "that matter, that three proposals in three years have gone unanswered, that two of them are " +
  "double-blocked so neither answer moves a byte. None of that is derived here and none of it " +
  "could be — they are readings of the position rather than the position, and W257's own test is " +
  "what holds the individual sentences down. SECOND, THE DERIVATION IS LIVE AND THE DOCUMENT IS " +
  "AS-AT, which is sound only while the position has not moved; `blockedSinceTheDossier` checks " +
  "that and would report a Q26 blocked row rather than let the document read stale. THIRD, IT " +
  "CANNOT TELL A RIGHT ATTRIBUTION FROM A WRONG ONE. A row blocked on the wrong gate resolves " +
  "perfectly and prices the wrong decision, which is the limit W310's bound states about blockers " +
  "and the reason that one is `inherent` rather than waiting on a remedy. FOURTH, AND FOUND BY " +
  "DRIVING IT: a cell naming an id the ledger does not hold is INVISIBLE here. The reader resolves " +
  "against real rows — which is how `SUP-1` is seen at all, and the whole reason the shape-matching " +
  "version was wrong — so an invented `W999` in a row is not reported as a phantom, only as a count " +
  "that disagrees with its own list. A row that both invented a unit and adjusted its own count to " +
  "match would pass. THAT ONE HAS A REMEDY AND THIS SENTENCE OWES IT: reporting a token that is " +
  "id-shaped and resolves to no row is a check somebody can write, beside the resolving reader " +
  "rather than instead of it, and until it exists this bound stays open. W297's register found the " +
  "mis-typing before a reader did — the no-remedy kind reached parity with the remedy-bearing one " +
  "and its ratio guard fired, which is W311's warning arriving from the other side.";

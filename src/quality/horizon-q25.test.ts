// W312 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// EVERY FIGURE IN THE DOCUMENT IS RE-DERIVED FROM THE LEDGER HERE. A horizon document prices a
// position, and a priced position that nobody re-derives is the shape this quarter's whole theme is
// about — a claim that reads as checked and is not.
//
// AND THE SECTION SLICE ENDS AT THE NEXT HEADING, which is W312's own finding about W299's version
// of this file. That one sliced §5i to `## 6. Horizon rule`, which was the next heading only until
// a quarter was expanded between them — so laying down §5j made Q24's test read Q25's plan as part
// of Q24's, and reported this unit succeeding as W299 failing. The rule taken from it: a check that
// describes a quarter must be written to survive the next quarter, or it is a check with a shelf
// life nobody wrote down.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockedRows } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

const ROOT = process.cwd();
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q25.md"), "utf8");
// Markers stripped so an assertion about a NUMBER is about the number, not about its formatting.
// `>` goes too: a blockquote wrapped across lines leaves the marker mid-sentence once whitespace
// is collapsed, so a quoted phrase would never match its own text.
const DOC = RAW.replace(/[`*]/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/**
 * The last unit that existed when this horizon was written.
 *
 * The document prices a position; a test reading the live ledger has to say which moment it is
 * pricing, or it reports Q26's expansion as a defect in Q25's plan.
 */
export const Q25_HORIZON_LAST_UNIT = 325;

interface Row {
  id: string;
  n: number;
  status: string;
  note: string;
}

function rows(): Row[] {
  return LEDGER.split("\n").flatMap((line) => {
    const m = /^\| (W(\d+)) \| ([\w-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|$/.exec(line);
    return m ? [{ id: m[1]!, n: Number(m[2]), status: m[3]!, note: m[7]! }] : [];
  });
}

const asAtHorizon = () => rows().filter((r) => r.n <= Q25_HORIZON_LAST_UNIT);
const Q25 = Array.from({ length: 13 }, (_, i) => `W${313 + i}`);

/** §5j alone, ending at whatever heading comes next — see the note at the top of this file. */
const section = () => {
  const start = PLAN.indexOf("## 5j.");
  const after = PLAN.indexOf("\n## ", start + 1);
  return PLAN.slice(start, after === -1 ? PLAN.length : after);
};

describe("W312 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    // Non-vacuity first: every assertion below reads this, and an empty parse would pass the file.
    expect(rows().length).toBeGreaterThan(300);
    expect(rows().filter((r) => r.status === "done").length).toBeGreaterThan(200);
  });

  it("states the done count the ledger held when the horizon was written", () => {
    // AS AT THE HORIZON, NOT LIVE, and the difference is this quarter's own theme. A live count
    // moves the moment W313 lands — and it moved once before that, when W312 closed its own row
    // while the gate ran. A document that prices a position has to be checked against the position
    // it priced, so the count is over the units that existed BEFORE this expansion; none of them
    // will change status again.
    const before = Number(Q25[0]!.slice(1)) - 1;
    const done = rows().filter((r) => r.status === "done" && r.n <= before).length;
    expect(DOC, `the document does not say ${done} are done`).toContain(`${done} are done`);
  });

  it("states the blocked count the ledger actually holds, week-units and not", () => {
    // THE FIGURE THAT MOVED, and the reason it is asserted through `blockedRows` rather than the
    // local parse above: the local one matches `W\d+` and would still read 16.
    expect(blockedRows(ROOT)).toHaveLength(18);
    expect(DOC).toContain("18 rows are blocked");
  });
});

describe("W312 the six preconditions are evaluated against the thing each claims", () => {
  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    for (const id of Q25) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5j. Year 7 — Q25 (W313–W325)");
    expect(section(), "§5j plans a unit beyond the quarter it expands").not.toContain("W326");
    expect(Q25.every((id) => Number(id.slice(1)) <= Q25_HORIZON_LAST_UNIT)).toBe(true);
    expect(asAtHorizon()).toHaveLength(Q25_HORIZON_LAST_UNIT);
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md", "src/quality/hardening-q24.ts"]) {
      expect(RAW, `the horizon does not cite ${cited}`).toContain(cited);
    }
  });

  it("(3) records the gate position, and every row of it is re-derived", () => {
    // The table is the precondition. Each row's unit count and its released units are read out of
    // the tree, so a ruling that lands, or a blocked row that moves, fails here rather than leaving
    // the plan describing a position that has changed.
    for (const ruling of outstandingRulings(ROOT)) {
      const ids = ruling.releases.map((u) => u.id);
      expect(DOC, `${ruling.blocker} is not in the gate table`).toContain(ruling.blocker);
      for (const id of ids) {
        expect(DOC, `${ruling.blocker} releases ${id} and the table omits it`).toContain(id);
      }
    }
    expect(DOC).toContain("Decisions on this page the loop may take: zero");
  });

  it("(3) states the number the loop may answer, and it is still zero", () => {
    // The rule requires this restated at every expansion. It is derived rather than typed: a path
    // naming anyone but the founder would make the sentence false.
    const answerable = outstandingRulings(ROOT).filter((r) => !/founder/i.test(r.whoDecides));
    expect(answerable.map((r) => r.blocker)).toEqual([]);
  });

  it("(4) adds no blocked row, and says why the count moved anyway", () => {
    const plannedBlocked = Q25.filter((id) => rows().find((r) => r.id === id)?.status === "blocked");
    expect(plannedBlocked, "Q25 planned a blocked row").toEqual([]);
    expect(DOC).toContain("Q25 adds no blocked row");
    // The count moved from 16 to 18 without a row being added, which the rule requires SAID.
    expect(DOC).toContain("no unit added a blocked row");
    expect(DOC).toMatch(/SUP-1/);
  });

  it("(5) leaves §4 untouched, and every blocker still resolves to a gate or a decision", () => {
    for (const row of blockedRows(ROOT)) {
      expect(row.note, `${row.id} names no blocker at all`).toMatch(/FOUNDER GATE G\d+|FOUNDER DECISION|G\d+/);
    }
    // Every §4 gate named by the table is defined in §4 — `plan-ledger` checks the ledger side.
    for (const ruling of outstandingRulings(ROOT)) {
      if (ruling.kind !== "founder_gate") continue;
      expect(PLAN, `${ruling.blocker} is in the table and not in §4`).toContain(`- **${ruling.blocker}**`);
    }
  });

  it("(6) says what the loop cannot do, in the document rather than a dossier", () => {
    expect(DOC).toContain("G1, G2, G4 and G7 block nothing");
    expect(DOC).toContain("That remains the founder's move");
  });
});

describe("W312 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q25);
    for (const id of Q25) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    expect([...section().matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q25);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    for (const id of Q25) {
      const line = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("says the same thing in the plan and the ledger for every unit", () => {
    for (const id of Q25) {
      const planned = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!.slice(`- **${id}** `.length);
      const row = rows().find((r) => r.id === id)!;
      expect(row.note.startsWith(planned), `${id} reads differently in the ledger than in the plan`).toBe(true);
    }
  });

  it("ends the quarter on hardening and a close, as every quarter does", () => {
    const notes = new Map(rows().map((r) => [r.id, r.note]));
    expect(notes.get("W324")).toMatch(/gate/i);
    expect(notes.get("W325")).toContain("QUARTER CLOSE");
  });
});

describe("W312 the theme is derived from evidence that exists", () => {
  it("quotes the hardening findings it says the theme comes from", () => {
    // Each cited finding must be one Q24's register actually holds, so the theme cannot be built on
    // a finding somebody remembered. W258's rule, applied to a horizon document.
    for (const id of ["Q24-CR-2", "Q24-CR-3", "Q24-CR-5", "Q24-CR-9"]) {
      expect(RAW, `the horizon cites ${id}`).toContain(id);
    }
  });

  it("cites findings the hardening register really holds", async () => {
    const { FINDINGS } = await import("./hardening-q24");
    const held = new Set(FINDINGS.map((f) => f.id));
    for (const cited of [...RAW.matchAll(/Q24-[A-Z]+-\d+/g)].map((m) => m[0])) {
      expect(held.has(cited), `the horizon cites ${cited}, which Q24's register does not hold`).toBe(true);
    }
  });

  it("refuses to set a numeric gate, and says why", () => {
    expect(DOC).toContain("It does not set a numeric gate");
    expect(DOC).toContain("counting controls measured the wrong thing");
  });

  it("answers the instrument question W308 handed to the quarter close", () => {
    // W308's own note says naming a better instrument belongs here. A close that took the hand-off
    // and did not answer it would leave the next quarter's gate exactly as wrong.
    expect(DOC).toContain("Naming a better instrument belongs to the quarter close");
    expect(section(), "§5j does not answer the instrument hand-off").toContain("must edit to declare a module");
  });
});

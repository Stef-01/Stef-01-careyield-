// W325 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// EVERY FIGURE IN THE DOCUMENT IS RE-DERIVED FROM THE LEDGER HERE, for the reason W312 wrote at the
// top of Q25's version: a horizon document prices a position, and a priced position nobody
// re-derives is a claim that reads as checked and is not.
//
// AND THE WAIT FIGURES ARE DERIVED AS-AT, WHICH IS THIS QUARTER'S OWN THEME ARRIVING IN ITS OWN
// TEST. `outstandingRulings` counts units built since a gate was proposed, LIVE — so the number
// grows every firing, and a document that wrote it down is out of date by the next unit. Q25's
// horizon says 293 where the live figure is now 306, and nothing reported it, because Q25's test
// asserted which units a gate releases and not how long it had waited. Counting only over the units
// that existed when this document was written makes the sentence true on the day it was written and
// true afterwards, which is what an as-at figure is for.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockedRows } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

const ROOT = process.cwd();
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q26.md"), "utf8");
// Markers stripped so an assertion about a NUMBER is about the number, not about its formatting.
const DOC = RAW.replace(/[`*]/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/**
 * The last unit that existed when this horizon was written.
 *
 * The document prices a position; a test reading the live ledger has to say which moment it is
 * pricing, or it reports Q27's expansion as a defect in Q26's plan.
 */
export const Q26_HORIZON_LAST_UNIT = 325;

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

const asAtHorizon = () => rows().filter((r) => r.n <= Q26_HORIZON_LAST_UNIT);
const Q26 = Array.from({ length: 13 }, (_, i) => `W${326 + i}`);

/** §5k alone, ending at whatever heading comes next — W312's rule about a slice with a shelf life. */
const section = () => {
  const start = PLAN.indexOf("## 5k.");
  const after = PLAN.indexOf("\n## ", start + 1);
  return PLAN.slice(start, after === -1 ? PLAN.length : after);
};

/**
 * The gate table, parsed into rows.
 *
 * The blocker is the bolded name in the first cell — `**G5** — clinical pathway content sign-off`
 * gives `G5`, and `**Q9 action 1** — the Ahpra ask` gives `Q9 action 1`, which is the id
 * `outstandingRulings` uses for a decision that is not a numbered gate.
 */
function gateTable(): Map<string, { count: string; which: string[]; waited: string }> {
  const out = new Map<string, { count: string; which: string[]; waited: string }>();
  for (const line of RAW.split("\n")) {
    const m = /^\| \*\*([^*]+)\*\*[^|]*\| ([^|]+)\| ([^|]+)\| ([^|]+)\|$/.exec(line);
    if (!m) continue;
    out.set(m[1]!.trim(), {
      count: m[2]!.trim(),
      which: m[3]!.trim().split(",").map((s) => s.trim()),
      waited: m[4]!.trim(),
    });
  }
  return out;
}

/**
 * Units built between a gate's origin and this horizon — the wait, frozen at the moment priced.
 *
 * THE CLOSING ROW COUNTS AS DONE WHETHER IT IS OR NOT, for the same reason the done count does:
 * the document prices the position *once this close lands*, and a figure that answers 306 while
 * the gate runs and 307 a commit later is a control that cannot reach the moment it describes.
 * Both derivations in this file were written the other way first, and both broke on the close.
 */
const waitedAsAt = (origin: string): number =>
  asAtHorizon().filter(
    (r) => r.n > Number(origin.slice(1)) && (r.status === "done" || r.n === Q26_HORIZON_LAST_UNIT),
  ).length;

describe("W325 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    // Non-vacuity first: every assertion below reads this, and an empty parse would pass the file.
    expect(rows().length).toBeGreaterThan(300);
    expect(rows().filter((r) => r.status === "done").length).toBeGreaterThan(200);
  });

  it("states the done count the ledger held when the horizon was written", () => {
    // AS AT THE HORIZON, NOT LIVE — and counting THIS row as done either way, which is the whole
    // quarter in one line. The document says "308 are done once this close lands". The first draft
    // wrote `done + 1` because the row still said `claimed` while the gate ran; the close then made
    // it 308 and the assertion asked for 309. A control that answers differently before and after
    // the event it describes is the defect Q26 is named after, and it was in this test.
    const before = Number(Q26[0]!.slice(1)) - 1;
    const done = rows().filter(
      (r) => r.n <= before && (r.status === "done" || r.n === Q26_HORIZON_LAST_UNIT),
    ).length;
    expect(DOC, `the document does not say ${done} are done`).toContain(`${done} are done`);
  });

  it("states the ledger size before and after this expansion", () => {
    expect(asAtHorizon()).toHaveLength(Q26_HORIZON_LAST_UNIT);
    expect(DOC).toContain(`${Q26_HORIZON_LAST_UNIT} week-units`);
    expect(DOC).toContain(`${Q26_HORIZON_LAST_UNIT + Q26.length} after it`);
    expect(rows()).toHaveLength(Q26_HORIZON_LAST_UNIT + Q26.length);
  });

  it("states the blocked count the ledger actually holds, week-units and not", () => {
    // Asserted through `blockedRows` rather than the local parse above: the local one matches
    // `W\d+` and would read 16, which is the omission W310 found.
    //
    // AND THIS ONE IS LIVE ON PURPOSE, WHICH IS WORTH SAYING BECAUSE IT LOOKS LIKE THE PINNED
    // COUNT W304 REMOVED. Every horizon since Q22 carries this line and none of them says what
    // moves it: only a founder ruling unblocks a row, and a ruling is exactly the event at which
    // every horizon's gate table must be re-read. So the failure is the alarm rather than
    // maintenance — but nothing said so until here, and an intention nobody writes down reads as
    // the defect it resembles.
    expect(blockedRows(ROOT)).toHaveLength(18);
    expect(DOC).toContain("18 rows are blocked");
    expect(asAtHorizon().filter((r) => r.status === "blocked")).toHaveLength(16);
  });
});

describe("W325 the six preconditions are evaluated against the thing each claims", () => {
  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    for (const id of Q26) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5k. Year 7 — Q26 (W326–W338)");
    expect(section(), "§5k plans a unit beyond the quarter it expands").not.toContain("W339");
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md", "src/quality/claim-classes.ts"]) {
      expect(RAW, `the horizon does not cite ${cited}`).toContain(cited);
    }
  });

  it("(3) records the gate position, and every row of it is re-derived", () => {
    // READ ROW BY ROW, NOT AS A SUBSTRING OF THE DOCUMENT, and the mutation pass is why. The first
    // draft asked whether the whole document CONTAINED each released unit id; renaming `W203` to
    // `W203x` in the table survived it, because the id is a prefix of the rename and because a
    // unit listed under the wrong gate is still somewhere in the file. A gate table that puts the
    // right units under the wrong ruling is exactly the error this precondition exists to catch.
    const table = gateTable();
    for (const ruling of outstandingRulings(ROOT)) {
      const row = table.get(ruling.blocker);
      expect(row, `${ruling.blocker} is not a row in the gate table`).toBeDefined();
      expect(row!.which, `${ruling.blocker}'s row names the wrong units`).toEqual(
        ruling.releases.map((u) => u.id),
      );
      expect(row!.count, `${ruling.blocker}'s row miscounts what it releases`).toBe(
        String(ruling.releases.length),
      );
    }
    expect([...table.keys()].sort(), "the table holds a ruling the tree does not").toEqual(
      outstandingRulings(ROOT).map((r) => r.blocker).sort(),
    );
    expect(DOC).toContain("Decisions on this page the loop may take: zero");
  });

  it("(3) states how long each ruling has waited, as at this expansion", () => {
    // THE FIGURE Q25'S TEST DID NOT CHECK, and the reason its document is stale today. Derived over
    // the units that existed when this was written, so it stays true rather than drifting — and
    // read out of the ruling's OWN row, so two gates that have waited the same number of units
    // cannot cover for each other.
    const table = gateTable();
    for (const ruling of outstandingRulings(ROOT)) {
      const waited = waitedAsAt(ruling.waited.sinceUnit);
      expect(table.get(ruling.blocker)!.waited, `${ruling.blocker} does not say it waited ${waited}`).toContain(
        `${waited} units`,
      );
    }
  });

  it("(3) states the number the loop may answer, and it is still zero", () => {
    // Derived rather than typed: a path naming anyone but the founder would make the sentence false.
    //
    // AND THE PREDICATE IS DRIVEN BEFORE IT IS TRUSTED, which is W293's evidence rule and not a
    // formality here: "nothing is answerable" is the one claim in this document that cannot be
    // shown by finding something, so a filter that matched nothing at all would report the same
    // zero. Q25's horizon pinned this assertion as unevidenced instead; a fabricated ruling costs
    // two lines and makes the zero mean something.
    const answerable = (rulings: readonly { blocker: string; whoDecides: string }[]) =>
      rulings.filter((r) => !/founder/i.test(r.whoDecides));
    expect(
      answerable([{ blocker: "G-FAKE", whoDecides: "the loop, on its own authority" }]).map((r) => r.blocker),
      "the filter matches nothing, so the zero below is the filter and not the tree",
    ).toEqual(["G-FAKE"]);
    expect(answerable(outstandingRulings(ROOT)).map((r) => r.blocker)).toEqual([]);
  });

  it("(4) adds no blocked row, and the count has not moved", () => {
    // Driven on a row that IS blocked before it is trusted on the thirteen that are not — same
    // reason as (3), and W292's pair: a lookup that silently missed every id would report the
    // quarter clean.
    const plannedBlocked = (ids: readonly string[]) =>
      ids.filter((id) => rows().find((r) => r.id === id)?.status === "blocked");
    expect(plannedBlocked(["W161"]), "the lookup cannot see a blocked row").toEqual(["W161"]);
    expect(plannedBlocked(Q26), "Q26 planned a blocked row").toEqual([]);
    expect(DOC).toContain("Q26 adds no blocked row");
    expect(DOC).toContain("the count has not moved since the last horizon");
  });

  it("(5) leaves §4 untouched, and every blocker still resolves to a gate or a decision", () => {
    for (const row of blockedRows(ROOT)) {
      expect(row.note, `${row.id} names no blocker at all`).toMatch(/FOUNDER GATE G\d+|FOUNDER DECISION|G\d+/);
    }
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

describe("W325 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q26);
    for (const id of Q26) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    expect([...section().matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q26);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    for (const id of Q26) {
      const line = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("says the same thing in the plan and the ledger for every unit", () => {
    for (const id of Q26) {
      const planned = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!.slice(`- **${id}** `.length);
      const row = rows().find((r) => r.id === id)!;
      expect(row.note.startsWith(planned), `${id} reads differently in the ledger than in the plan`).toBe(true);
    }
  });

  it("ends the quarter on a gate and a close, as every quarter does", () => {
    const notes = new Map(rows().map((r) => [r.id, r.note]));
    expect(notes.get("W337")).toMatch(/gate/i);
    expect(notes.get("W338")).toContain("QUARTER CLOSE");
  });
});

describe("W325 the theme is derived from evidence that exists", () => {
  it("names the five Q25 units the theme is read from, and the ledger holds each", () => {
    // Named rather than counted, and resolved against the ledger: a theme built on a unit somebody
    // remembered is the shape W258 is about, in the document that sets a quarter's direction.
    const byId = new Map(rows().map((r) => [r.id, r]));
    for (const id of ["W315", "W318", "W322", "W323", "W324"]) {
      expect(DOC, `the theme cites ${id}`).toContain(id);
      expect(byId.get(id)?.status, `${id} is cited as evidence and is not done`).toBe("done");
    }
  });

  it("names the counter-example, because a shape with no counter-example is a shape nobody tested", () => {
    expect(DOC).toContain("W324's pending arm is the counter-example");
    expect(DOC).toContain("the only Q25 control that did");
  });

  it("refuses to set a numeric gate, and says why", () => {
    expect(DOC).toContain("It does not set a numeric gate");
    expect(DOC).toContain("counting controls measured the wrong thing");
  });

  it("does not claim the quarter it closes failed, because it did not", () => {
    // Q25 met its gate. A close that read as a post-mortem would be describing a different quarter,
    // and W312's close was careful about the same distinction in the other direction.
    expect(DOC).toContain("This close is not a report of a missed gate");
    expect(DOC).toContain("It does not claim Q25 failed");
  });
});

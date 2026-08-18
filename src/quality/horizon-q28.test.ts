// W351 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// EVERY FIGURE IN THE DOCUMENT IS RE-DERIVED FROM THE LEDGER HERE, for W312's reason: a horizon
// prices a position, and a priced position nobody re-derives is a claim that reads as checked and
// is not.
//
// AND THIS ONE PRICES A MOMENT WITH SOMEBODY ELSE'S ROW OPEN IN IT, for the second quarter running.
// W350 — Q27's own gate — was `claimed` in a sibling session while this was written, so the done
// count and every wait figure depend on whether it is counted. It is not: `IN_FLIGHT_AT_EXPANSION`
// names it, so the figures stay what they were on the day rather than moving when a row this
// document did not price closes.
//
// THE EXEMPTION IS NAMED RATHER THAN DERIVED, AND W351 LEARNED THAT THE HARD WAY. Its first draft
// read the in-flight row's LIVE status and required `claimed` — a check answering about the moment
// it runs, inside a document about a moment it does not run in — and W337 landed mid-build and
// falsified it. Naming the row is also Q28's own theme arriving in the test that opens the quarter:
// a status lookup that agrees with whatever it happens to see fails toward looking correct, and a
// named list cannot.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockedRows } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

const ROOT = process.cwd();
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q28.md"), "utf8");
// Markers stripped so an assertion about a NUMBER is about the number, not about its formatting.
const DOC = RAW.replace(/[`*]/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/** The last unit that existed when this horizon was written. */
export const Q28_HORIZON_LAST_UNIT = 351;

/**
 * Rows this document did NOT price as done, by name.
 *
 * W350 is Q27's gate and a sibling session held it while this was written. Named rather than
 * counted, so the figures below describe the moment rather than drifting the day it lands — and
 * named rather than excluded silently, because an exemption nobody can see is one nobody re-reads.
 */
export const IN_FLIGHT_AT_EXPANSION: readonly string[] = ["W350"];

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

const asAtHorizon = () => rows().filter((r) => r.n <= Q28_HORIZON_LAST_UNIT);
const Q28 = Array.from({ length: 13 }, (_, i) => `W${352 + i}`);

/** Done as at this expansion: the closing row counts, and the row somebody else holds does not. */
const doneAsAt = (): Row[] =>
  asAtHorizon().filter(
    (r) =>
      !IN_FLIGHT_AT_EXPANSION.includes(r.id) &&
      (r.status === "done" || r.n === Q28_HORIZON_LAST_UNIT),
  );

/** §5m alone, ending at whatever heading comes next — W312's rule about a slice with a shelf life. */
const section = () => {
  const start = PLAN.indexOf("## 5m.");
  const after = PLAN.indexOf("\n## ", start + 1);
  return PLAN.slice(start, after === -1 ? PLAN.length : after);
};

/** The gate table, parsed into rows — W325's shape, and the reason is its mutation pass. */
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

/** Units built between a gate's origin and this horizon, frozen at the moment priced. */
const waitedAsAt = (origin: string): number =>
  doneAsAt().filter((r) => r.n > Number(origin.slice(1))).length;

describe("W351 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    expect(rows().length).toBeGreaterThan(300);
    expect(rows().filter((r) => r.status === "done").length).toBeGreaterThan(200);
  });

  it("states the done count the ledger held when the horizon was written", () => {
    const done = doneAsAt().length;
    expect(DOC, `the document does not say ${done} are done`).toContain(`${done} are done`);
  });

  it("does not count the row a sibling session was holding", () => {
    // The exemption, driven rather than trusted: without it the figure moves the day W337 lands,
    // and this document would be reporting a position it never priced.
    const counted = asAtHorizon().filter(
      (r) => r.status === "done" || r.n === Q28_HORIZON_LAST_UNIT,
    ).length;
    expect(doneAsAt().length, "the named in-flight row is being counted").toBeLessThan(counted + 1);
    for (const id of IN_FLIGHT_AT_EXPANSION) {
      expect(rows().some((r) => r.id === id), `${id} is named in flight and is not a row`).toBe(true);
      expect(doneAsAt().map((r) => r.id), `${id} is counted as done`).not.toContain(id);
    }
  });

  it("states the ledger size before and after this expansion", () => {
    expect(asAtHorizon()).toHaveLength(Q28_HORIZON_LAST_UNIT);
    expect(DOC).toContain(`${Q28_HORIZON_LAST_UNIT} week-units`);
    expect(DOC).toContain(`${Q28_HORIZON_LAST_UNIT + Q28.length} after it`);
    // W338: SCOPED, NOT TOTAL. This asserted the whole ledger's size, which is true of one
    // quarter and of no quarter after it — the shelf life W312 wrote the rule about, copied
    // forward twice before anybody noticed. What the expansion did is lay down thirteen rows,
    // and that stays true however many quarters follow.
    expect(
      rows().filter((r) => r.n <= Q28_HORIZON_LAST_UNIT + Q28.length),
      "the expansion did not lay down its rows",
    ).toHaveLength(Q28_HORIZON_LAST_UNIT + Q28.length);
  });

  it("states the blocked count the ledger actually holds, week-units and not", () => {
    // LIVE ON PURPOSE, and W325 is where that intention was first written down: only a founder
    // ruling unblocks a row, and a ruling is exactly the event at which every horizon's gate table
    // must be re-read. The failure is the alarm rather than maintenance.
    expect(blockedRows(ROOT)).toHaveLength(18);
    expect(DOC).toContain("18 rows are blocked");
    expect(asAtHorizon().filter((r) => r.status === "blocked")).toHaveLength(16);
  });
});

describe("W351 the six preconditions are evaluated against the thing each claims", () => {
  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    for (const id of Q28) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5m. Year 7 — Q28 (W352–W364)");
    expect(section(), "§5m plans a unit beyond the quarter it expands").not.toContain("W365");
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md", "src/quality/quarter-mutants-q26.ts"]) {
      expect(RAW, `the horizon does not cite ${cited}`).toContain(cited);
    }
  });

  it("(3) records the gate position, row by row", () => {
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
    const table = gateTable();
    for (const ruling of outstandingRulings(ROOT)) {
      const waited = waitedAsAt(ruling.waited.sinceUnit);
      expect(table.get(ruling.blocker)!.waited, `${ruling.blocker} does not say it waited ${waited}`).toContain(
        `${waited} units`,
      );
    }
  });

  it("(3) states the number the loop may answer, and it is still zero", () => {
    const answerable = (rulings: readonly { blocker: string; whoDecides: string }[]) =>
      rulings.filter((r) => !/founder/i.test(r.whoDecides));
    expect(
      answerable([{ blocker: "G-FAKE", whoDecides: "the loop, on its own authority" }]).map((r) => r.blocker),
      "the filter matches nothing, so the zero below is the filter and not the tree",
    ).toEqual(["G-FAKE"]);
    expect(answerable(outstandingRulings(ROOT)).map((r) => r.blocker)).toEqual([]);
  });

  it("(4) adds no blocked row, and the count has not moved", () => {
    const plannedBlocked = (ids: readonly string[]) =>
      ids.filter((id) => rows().find((r) => r.id === id)?.status === "blocked");
    expect(plannedBlocked(["W161"]), "the lookup cannot see a blocked row").toEqual(["W161"]);
    expect(plannedBlocked(Q28), "Q28 planned a blocked row").toEqual([]);
    expect(DOC).toContain("Q28 adds no blocked row");
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

describe("W351 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q28);
    for (const id of Q28) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    expect([...section().matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q28);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    for (const id of Q28) {
      const line = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("says the same thing in the plan and the ledger for every unit", () => {
    for (const id of Q28) {
      const planned = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!.slice(`- **${id}** `.length);
      const row = rows().find((r) => r.id === id)!;
      expect(row.note.startsWith(planned), `${id} reads differently in the ledger than in the plan`).toBe(true);
    }
  });

  it("ends the quarter on a gate and a close, and holds a hardening pass", () => {
    const notes = new Map(rows().map((r) => [r.id, r.note]));
    expect(notes.get("W363")).toMatch(/gate/i);
    expect(notes.get("W364")).toContain("QUARTER CLOSE");
    // Q25 ran none and W331 had to run it a quarter late. A quarter that plans one cannot repeat that.
    expect([...notes.values()].filter((n) => /hardening pass/i.test(n)).length).toBeGreaterThan(0);
  });
});

describe("W351 the theme is derived from evidence that exists", () => {
  it("names the units the theme is read from, and the ledger holds each as done", () => {
    const byId = new Map(rows().map((r) => [r.id, r]));
    for (const id of ["W335", "W340", "W343", "W345", "W346", "W349"]) {
      expect(DOC, `the theme cites ${id}`).toContain(id);
      expect(byId.get(id)?.status, `${id} is cited as evidence and is not done`).toBe("done");
    }
  });

  it("quotes its figures as history, and says which day each was true of", () => {
    // BOTH ARE HISTORY AND THE DOCUMENT NOW SAYS SO, which the first draft got wrong in this
    // quarter's own way. It asserted `sourceModules(ROOT)` still holds 295 — the count W349's
    // mis-call returned — and the tree had already grown to 297 by the time the horizon was
    // written. A figure re-derived against a moving tree is not a stronger claim than a quoted
    // one; it is a claim about a different day wearing the clothes of a check. What is asserted
    // instead is that the number is a real measurement of the tree at some point rather than an
    // invention: the mis-call returns every source module, so the figure must be of that order.
    expect(DOC).toContain("295 source modules on the day");
    // "on the day" is the load-bearing half: the figure is labelled as a measurement of a moment,
    // so a reader is not invited to check it against today's tree. Walking the tree HERE to
    // confirm the order of magnitude was the first draft's idea and it is the same mistake one
    // step out — this file would then be a tree-walking register, owing W267 a census row, to
    // half-check a number the document already says is history.
    expect(DOC).not.toContain("295 source modules today");
    // W340's is history in the same sense — the answer a scan gave before it was fixed.
    expect(DOC).toContain("thirty-five");
    expect(DOC).toContain("seventy-one");
  });

  it("does not price Q27's gate, which a sibling session held while this was written", () => {
    // W338's version of this read the row's LIVE status and W337 landed mid-build and falsified
    // it. The lesson is kept rather than re-learned: what the document claims is that it did not
    // price the verdict, and the row it declined to count is NAMED rather than looked up.
    expect(DOC).toContain("W350");
    expect(DOC).toContain("It does not claim Q27 failed");
    expect(IN_FLIGHT_AT_EXPANSION).toContain("W350");
    expect(doneAsAt().map((r) => r.id), "W350 is counted after all").not.toContain("W350");
  });

  it("refuses to set a numeric gate, and says why", () => {
    expect(DOC).toContain("It does not set a numeric gate");
    expect(DOC).toContain("the instrument rather than the work was wrong");
  });
});

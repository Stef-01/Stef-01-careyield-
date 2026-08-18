// W338 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// EVERY FIGURE IN THE DOCUMENT IS RE-DERIVED FROM THE LEDGER HERE, for W312's reason: a horizon
// prices a position, and a priced position nobody re-derives is a claim that reads as checked and
// is not.
//
// AND THIS ONE PRICES A MOMENT WITH SOMEBODY ELSE'S ROW OPEN IN IT. W337 — Q26's own gate — was
// `claimed` in a sibling session while this was written, so the done count and every wait figure
// depend on whether it is counted. It is not: `IN_FLIGHT_AT_EXPANSION` names it, so the figures
// stay what they were on the day rather than moving when a row this document did not price closes.
// That is Q27's theme in the test that opens the quarter — a fact the tree holds, read rather than
// assumed away.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockedRows } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

const ROOT = process.cwd();
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q27.md"), "utf8");
// Markers stripped so an assertion about a NUMBER is about the number, not about its formatting.
const DOC = RAW.replace(/[`*]/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/** The last unit that existed when this horizon was written. */
export const Q27_HORIZON_LAST_UNIT = 338;

/**
 * Rows this document did NOT price as done, by name.
 *
 * W337 is Q26's gate and a sibling session held it while this was written. Named rather than
 * counted, so the figures below describe the moment rather than drifting the day it lands — and
 * named rather than excluded silently, because an exemption nobody can see is one nobody re-reads.
 */
export const IN_FLIGHT_AT_EXPANSION: readonly string[] = ["W337"];

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

const asAtHorizon = () => rows().filter((r) => r.n <= Q27_HORIZON_LAST_UNIT);
const Q27 = Array.from({ length: 13 }, (_, i) => `W${339 + i}`);

/** Done as at this expansion: the closing row counts, and the row somebody else holds does not. */
const doneAsAt = (): Row[] =>
  asAtHorizon().filter(
    (r) =>
      !IN_FLIGHT_AT_EXPANSION.includes(r.id) &&
      (r.status === "done" || r.n === Q27_HORIZON_LAST_UNIT),
  );

/** §5l alone, ending at whatever heading comes next — W312's rule about a slice with a shelf life. */
const section = () => {
  const start = PLAN.indexOf("## 5l.");
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

describe("W338 the document reads the ledger it claims to read", () => {
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
      (r) => r.status === "done" || r.n === Q27_HORIZON_LAST_UNIT,
    ).length;
    expect(doneAsAt().length, "the named in-flight row is being counted").toBeLessThan(counted + 1);
    for (const id of IN_FLIGHT_AT_EXPANSION) {
      expect(rows().some((r) => r.id === id), `${id} is named in flight and is not a row`).toBe(true);
      expect(doneAsAt().map((r) => r.id), `${id} is counted as done`).not.toContain(id);
    }
  });

  it("states the ledger size before and after this expansion", () => {
    expect(asAtHorizon()).toHaveLength(Q27_HORIZON_LAST_UNIT);
    expect(DOC).toContain(`${Q27_HORIZON_LAST_UNIT} week-units`);
    expect(DOC).toContain(`${Q27_HORIZON_LAST_UNIT + Q27.length} after it`);
    // W338: SCOPED, NOT TOTAL. This asserted the whole ledger's size, which is true of one
    // quarter and of no quarter after it — the shelf life W312 wrote the rule about, copied
    // forward twice before anybody noticed. What the expansion did is lay down thirteen rows,
    // and that stays true however many quarters follow.
    expect(
      rows().filter((r) => r.n <= Q27_HORIZON_LAST_UNIT + Q27.length),
      "the expansion did not lay down its rows",
    ).toHaveLength(Q27_HORIZON_LAST_UNIT + Q27.length);
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

describe("W338 the six preconditions are evaluated against the thing each claims", () => {
  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    for (const id of Q27) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5l. Year 7 — Q27 (W339–W351)");
    expect(section(), "§5l plans a unit beyond the quarter it expands").not.toContain("W352");
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md", "src/quality/hardening-q25.ts"]) {
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
    expect(plannedBlocked(Q27), "Q27 planned a blocked row").toEqual([]);
    expect(DOC).toContain("Q27 adds no blocked row");
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

describe("W338 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q27);
    for (const id of Q27) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    expect([...section().matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q27);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    for (const id of Q27) {
      const line = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("says the same thing in the plan and the ledger for every unit", () => {
    for (const id of Q27) {
      const planned = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!.slice(`- **${id}** `.length);
      const row = rows().find((r) => r.id === id)!;
      expect(row.note.startsWith(planned), `${id} reads differently in the ledger than in the plan`).toBe(true);
    }
  });

  it("ends the quarter on a gate and a close, and holds a hardening pass", () => {
    const notes = new Map(rows().map((r) => [r.id, r.note]));
    expect(notes.get("W350")).toMatch(/gate/i);
    expect(notes.get("W351")).toContain("QUARTER CLOSE");
    // Q25 ran none and W331 had to run it a quarter late. A quarter that plans one cannot repeat that.
    expect([...notes.values()].filter((n) => /hardening pass/i.test(n)).length).toBeGreaterThan(0);
  });
});

describe("W338 the theme is derived from evidence that exists", () => {
  it("names the units the theme is read from, and the ledger holds each as done", () => {
    const byId = new Map(rows().map((r) => [r.id, r]));
    for (const id of ["W328", "W329", "W331", "W333", "W334", "W335"]) {
      expect(DOC, `the theme cites ${id}`).toContain(id);
      expect(byId.get(id)?.status, `${id} is cited as evidence and is not done`).toBe("done");
    }
  });

  it("quotes the figure that made the theme, and the ledger row it came from", () => {
    // W331's `PLANTING_BOUND` finding is the flagship, and a theme built on a number somebody
    // remembered is the shape this whole tree is against. The row itself is the source.
    expect(DOC).toContain("426 copies and 3.6 GB");
    expect(rows().find((r) => r.id === "W331")!.note).toContain("426 copies and 3.6 GB");
  });

  it("does not price Q26's gate, which a sibling session held while this was written", () => {
    // THIS ASSERTION WAS WRONG ON ITS FIRST DRAFT and W337 landed during the build to prove it. It
    // read the row's LIVE status and required `claimed` — a check that answers about the moment it
    // runs, in the document about a moment it does not run in. Q26's own class, one unit after that
    // quarter closed. What the document actually claims is that it did not price the verdict, and
    // the row it declined to count is named in `IN_FLIGHT_AT_EXPANSION` rather than looked up.
    expect(DOC).toContain("W337");
    expect(DOC).toContain("It does not claim Q26 failed");
    expect(IN_FLIGHT_AT_EXPANSION).toContain("W337");
    expect(doneAsAt().map((r) => r.id), "W337 is counted after all").not.toContain("W337");
  });

  it("refuses to set a numeric gate, and says why", () => {
    expect(DOC).toContain("It does not set a numeric gate");
    expect(DOC).toContain("counting controls measured the wrong thing");
  });
});

// W390 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// EVERY FIGURE IN THE DOCUMENT IS RE-DERIVED FROM THE LEDGER HERE, for W312's reason: a horizon
// prices a position, and a priced position nobody re-derives is a claim that reads as checked and
// is not.
//
// AND THIS ONE PRICES A MOMENT WITH A ROW OPEN IN IT, for the second expansion running. W389 was
// held by the other builder while the figures were taken — it had been this builder's, reclaimed
// under W54's staleness rule when a three-hour gate run outlived a ninety-minute window — so
// `IN_FLIGHT_AT_EXPANSION` names it and the done count excludes it. The list is driven both ways
// rather than trusted.
//
// THE CLOSING ROW IS NOT A SIBLING'S, and that distinction is W377's correction carried forward
// rather than rediscovered. Its first version required the live claimed set to BE this unit's own
// row, which held while the unit was in flight and failed the moment it closed — a check reading a
// live status from inside a document about a moment it does not run in. What is asserted here is
// that nobody ELSE held a row except the one the list names.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockedRows, heldByOthers } from "./blocked-surface";
import { outstandingRulings } from "@/founder/outstanding";

const ROOT = process.cwd();
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q31.md"), "utf8");
// Markers stripped so an assertion about a NUMBER is about the number, not about its formatting.
const DOC = RAW.replace(/[`*]/g, "").replace(/^>\s?/gm, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/** The last unit that existed when this horizon was written. */
export const Q31_HORIZON_LAST_UNIT = 390;

/**
 * Rows this document did NOT price as done, by name.
 *
 * W389, held by the other builder while the figures were taken. It is neither done nor abandoned,
 * and pricing it as either would make the done count a guess about somebody else's session — so it
 * is named, excluded, and the document says so in the same words.
 */
export const IN_FLIGHT_AT_EXPANSION: readonly string[] = ["W389"];

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

const asAtHorizon = () => rows().filter((r) => r.n <= Q31_HORIZON_LAST_UNIT);
const Q31 = Array.from({ length: 13 }, (_, i) => `W${391 + i}`);

/** Done as at this expansion: the closing row counts, and a row somebody else holds does not. */
const doneAsAt = (): Row[] =>
  asAtHorizon().filter(
    (r) =>
      !IN_FLIGHT_AT_EXPANSION.includes(r.id) &&
      (r.status === "done" || r.n === Q31_HORIZON_LAST_UNIT),
  );

/** §5p alone, ending at whatever heading comes next — W312's rule about a slice with a shelf life. */
const section = () => {
  const start = PLAN.indexOf("## 5p.");
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

describe("W390 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    expect(rows().length).toBeGreaterThan(300);
    expect(rows().filter((r) => r.status === "done").length).toBeGreaterThan(200);
  });

  it("states the done count the ledger held when the horizon was written", () => {
    const done = doneAsAt().length;
    expect(DOC, `the document does not say ${done} are done`).toContain(`${done} are done`);
  });

  it("names the row that was in flight, and can tell that from naming nothing", () => {
    // THE MECHANISM, DRIVEN BOTH WAYS. A list that names a row and a list that names nothing read
    // identically in a done count unless the count moves when the list does, so the exemption is
    // checked by removing it: the row it names really is claimed, and dropping it really does
    // change the number this document states.
    expect(IN_FLIGHT_AT_EXPANSION, "the expansion priced a moment with nothing open in it").toEqual(["W389"]);
    // `claimed` only: W56 has been `in-progress` since Year 1 with continuation notes, which is a
    // state of the ledger rather than a session holding a row, and pricing it as in flight would
    // exempt a row nobody is working on.
    // W374: THIS REQUIRED THE NAMED ROW TO STILL BE `claimed`, which is the mistake the paragraph
    // below cites W364 for, one line up and pointed at a SIBLING's row instead of this unit's own.
    // A row that was in flight at the expansion is a row somebody held at that moment, and its
    // closing does not un-happen it — so what the ledger must still hold is the ROW, not the
    // status. A name that resolves to nothing is the defect; a name that has since landed is the
    // list working.
    const held = asAtHorizon().filter((r) => r.status === "claimed");
    for (const id of IN_FLIGHT_AT_EXPANSION) {
      const row = asAtHorizon().find((r) => r.id === id);
      expect(row, `${id} is named as in flight and the ledger holds no such row`).toBeDefined();
      expect(
        row?.n,
        `${id} is named as in flight and it is this expansion's own closing row`,
      ).not.toBe(Q31_HORIZON_LAST_UNIT);
    }
    // THE CLOSING ROW IS NOT A SIBLING'S — W364's correction, carried forward rather than
    // rediscovered. Its first version required the claimed set to BE its own row, so it held while
    // the unit was in flight and failed the moment it closed. What is claimed is that nobody ELSE
    // held a row except the one the list names.
    // W379: THE SHARED CALLABLE, not a second copy. This comparison existed twice — here and in
    // Q29's suite — and both copies were welded inside a `.test.ts` where W326's close gate had
    // nothing to call. `heldByOthers` takes the ledger as TEXT, so the gate can ask it about the
    // row as it will be committed, which is the one moment it can go wrong.
    expect(
      heldByOthers(LEDGER, Q31_HORIZON_LAST_UNIT, IN_FLIGHT_AT_EXPANSION),
      "a row was in flight and the list does not name it",
    ).toEqual([]);
    // W293's rule, on the same producer: shown holding one before it is asserted to hold none.
    expect(
      heldByOthers(`${LEDGER}| W1 | claimed | s | t | — | a planted row. |\n`, Q31_HORIZON_LAST_UNIT, IN_FLIGHT_AT_EXPANSION),
      "the derivation finds nothing when handed one",
    ).toEqual(["W1"]);
    // And the exemption is load-bearing: counting W374 as done moves the number the document states.
    const counted = asAtHorizon().filter(
      (r) => r.status === "done" || r.n === Q31_HORIZON_LAST_UNIT || IN_FLIGHT_AT_EXPANSION.includes(r.id),
    );
    expect(counted.length, "naming a row changes nothing, so the exemption is decoration").toBe(
      doneAsAt().length + IN_FLIGHT_AT_EXPANSION.length,
    );
  });

  it("states the ledger size before and after this expansion", () => {
    expect(asAtHorizon()).toHaveLength(Q31_HORIZON_LAST_UNIT);
    expect(DOC).toContain(`${Q31_HORIZON_LAST_UNIT} week-units`);
    expect(DOC).toContain(`${Q31_HORIZON_LAST_UNIT + Q31.length} after it`);
    // W338's correction, kept: what the expansion did is lay down thirteen rows, and that stays
    // true however many quarters follow — a claim about the whole ledger's size does not.
    expect(
      rows().filter((r) => r.n <= Q31_HORIZON_LAST_UNIT + Q31.length),
      "the expansion did not lay down its rows",
    ).toHaveLength(Q31_HORIZON_LAST_UNIT + Q31.length);
  });

  it("states the blocked count the ledger actually holds, week-units and not", () => {
    // LIVE ON PURPOSE, and W325 is where that intention was written down: only a founder ruling
    // unblocks a row, and a ruling is exactly the event at which every horizon's gate table must be
    // re-read. The failure is the alarm rather than maintenance.
    expect(blockedRows(ROOT)).toHaveLength(18);
    expect(DOC).toContain("18 rows are blocked");
    expect(DOC).toContain("sixteen week-units plus SUP-1 and SUP-2");
  });
});

describe("W390 the six preconditions are evaluated against the thing each claims", () => {
  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    for (const id of Q31) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5p. Year 7 — Q31 (W391–W403)");
    expect(section(), "§5p plans a unit beyond the quarter it expands").not.toContain("W404");
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md", "src/quality/hardening-q29.ts"]) {
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
    expect(plannedBlocked(Q31), "Q31 planned a blocked row").toEqual([]);
    expect(DOC).toContain("Q31 adds no blocked row");
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
    expect(DOC).toContain("G1, G2, G4 and G7 still block nothing");
    expect(DOC).toContain("It does not claim the loop can unblock anything");
    expect(DOC).toContain("Eighteen rows wait on a person");
  });
});

describe("W390 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q31);
    for (const id of Q31) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    expect([...section().matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q31);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    for (const id of Q31) {
      const line = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("says the same thing in the plan and the ledger for every unit", () => {
    for (const id of Q31) {
      const planned = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!.slice(`- **${id}** `.length);
      const row = rows().find((r) => r.id === id)!;
      expect(row.note.startsWith(planned), `${id} reads differently in the ledger than in the plan`).toBe(true);
    }
  });

  it("ends the quarter on a gate and a close, and holds a hardening pass", () => {
    const notes = new Map(rows().map((r) => [r.id, r.note]));
    expect(notes.get("W402")).toMatch(/gate/i);
    expect(notes.get("W403")).toContain("QUARTER CLOSE");
    // Q25 ran none and W331 had to run it a quarter late. A quarter that plans one cannot repeat that.
    expect([...notes.values()].filter((n) => /hardening pass/i.test(n)).length).toBeGreaterThan(0);
  });
});

describe("W390 the theme is derived from evidence that exists", () => {
  it("names the units the theme is read from, and the ledger holds each as done", () => {
    const byId = new Map(rows().map((r) => [r.id, r]));
    for (const id of ["W373", "W374", "W375", "W384", "W385", "W387", "W388"]) {
      expect(DOC, `the theme cites ${id}`).toContain(id);
      expect(byId.get(id)?.status, `${id} is cited as evidence and is not done`).toBe("done");
    }
  });

  it("quotes its figures as history, and says which day each was true of", () => {
    // W351's lesson, kept rather than re-learned: a figure re-derived against a moving tree is not
    // a stronger claim than a quoted one, it is a claim about a different day wearing the clothes
    // of a check. Every number the theme section quotes is a measurement somebody took on a stated
    // occasion, and the document says so rather than inviting a reader to check it against today.
    for (const figure of ["narrow four ways and wide one", "three readings", "Four rows"]) {
      expect(DOC.replace(/`/g, ""), `the theme quotes ${figure} and it is not in the document`).toContain(
        figure.replace(/`/g, ""),
      );
    }
    expect(DOC).toContain("as at this expansion");
    // And the document does not claim any of them is live.
    expect(DOC).not.toContain("narrow four ways and wide one today");
  });

  it("prices the row somebody else was holding, rather than guessing at it", () => {
    // The opposite occasion from the last horizon, and the reason the mechanism was kept. A row was
    // open when the figures were taken, so the document names it and the count excludes it —
    // asserted against the ledger so the sentence cannot outlive the fact.
    expect(DOC).toContain("One sibling row was in flight when the figures were taken");
    for (const id of IN_FLIGHT_AT_EXPANSION) {
      expect(DOC, `the document does not name ${id} as in flight`).toContain(id);
    }
  });

  it("refuses to set a numeric gate, and says why", () => {
    expect(DOC).toContain("It does not set a numeric gate");
    expect(DOC).toContain("Six quarters have now refused a number");
  });

  it("states the gate this quarter will be re-read against", () => {
    expect(DOC).toContain("every pattern this document names is measured against a second reading");
    expect(DOC).toContain("W402 re-reads the list");
  });
});

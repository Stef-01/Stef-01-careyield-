// W299 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// "EVALUATED AND RECORDED" IS THE HALF WITH TEETH: a document can say "Met" against every
// requirement and mean nothing, because the word is free. So each of the six is checked against the
// thing it claims — the unit counts against the ledger, the gate table against the blocked rows row
// by row, the no-new-blocked-rows promise against what the expansion actually added, and
// gate-invention against §4.
//
// BOUNDED BY A CONSTANT FROM THE FIRST LINE, for the fourth horizon running, and NOTHING TRANSIENT
// IS PINNED. `HORIZON-Y6.md` was written unbounded and went red on the first expansion after it.
// W286's version then pinned every planned row as `available` — so claiming W291 turned red the
// document that planned it, which W291 had to fix. Both are the same defect: a PLANNED event
// reported as a change to the position the document recorded. This asserts that the thirteen rows
// EXIST and that none of them is blocked, which is what precondition 1 and precondition 4 actually
// claim, and both survive the loop building them.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q24.md"), "utf8");
// Backticks AND emphasis flattened: the document bolds its counts, and a scan that did not subtract
// the markers would be checking the formatting rather than the number.
const DOC = RAW.replace(/[`*]/g, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/**
 * The last unit that existed when this horizon was written.
 *
 * The document prices a position; a test reading the live ledger has to say which moment it is
 * pricing, or it reports Q25's expansion as a defect in Q24's plan. DOSSIER-1's rule.
 */
export const Q24_HORIZON_LAST_UNIT = 312;

interface Row {
  id: string;
  n: number;
  status: string;
  note: string;
}

function rows(): Row[] {
  return LEDGER.split("\n").flatMap((line) => {
    // `[\w-]`, not `\w`: W56 is `in-progress`, and a parser that skipped it miscounts the ledger by
    // one — which is exactly what W273's first run did.
    const m = /^\| (W(\d+)) \| ([\w-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|$/.exec(line);
    return m ? [{ id: m[1]!, n: Number(m[2]), status: m[3]!, note: m[7]! }] : [];
  });
}

const asAtHorizon = () => rows().filter((r) => r.n <= Q24_HORIZON_LAST_UNIT);
const Q24 = Array.from({ length: 13 }, (_, i) => `W${300 + i}`);
/**
 * §5i alone, ending at whatever heading comes next.
 *
 * W312 FIXED THIS AT THE CLOSE IT WAS WRITTEN TO SURVIVE. The slice ran to `## 6. Horizon rule`,
 * which was the next heading only until a quarter was expanded between them — so the moment §5j
 * was laid down this section grew to twenty-six units and the tests below read Q25's plan as part
 * of Q24's. `horizon-q23.test.ts` already scoped its own section for exactly this reason and W291
 * had already fixed the whole-plan form once; this file's comment claims that fix and applies half
 * of it. Ending at the NEXT heading needs no edit at the next expansion.
 */
const section = () => {
  const start = PLAN.indexOf("## 5i.");
  const after = PLAN.indexOf("\n## ", start + 1);
  return PLAN.slice(start, after === -1 ? PLAN.length : after);
};

describe("W299 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    // Non-vacuity first: every assertion below reads this, and an empty parse would pass the file.
    expect(rows().length).toBeGreaterThan(300);
    expect(rows().filter((r) => r.status === "blocked").length).toBeGreaterThan(10);
  });

  it("states the unit counts the ledger actually holds, before and after", () => {
    expect(asAtHorizon()).toHaveLength(Q24_HORIZON_LAST_UNIT);
    expect(DOC).toContain(`The ledger holds ${Q24_HORIZON_LAST_UNIT - 13} units before this expansion`);
    expect(DOC).toContain(`and ${Q24_HORIZON_LAST_UNIT} after it`);
  });

  it("states the blocked count the ledger actually holds", () => {
    const blocked = asAtHorizon().filter((r) => r.status === "blocked").length;
    expect(DOC).toContain(`${blocked} rows are blocked`);
  });
});

describe("W299 the six preconditions are evaluated against the thing each claims", () => {
  /** The rows of the table under one heading, stopping at the next — the document has several. */
  const table = (heading: string) => {
    const from = RAW.indexOf(heading);
    const rest = RAW.slice(from + heading.length);
    const to = rest.indexOf("\n## ");
    return rest
      .slice(0, to === -1 ? undefined : to)
      .split("\n")
      .filter((l) => l.startsWith("| ") && !/^\|[\s-]+\|/.test(l))
      .map((l) => l.split("|").map((c) => c.trim()).slice(1, -1));
  };

  const preconditions = table("## The rule's preconditions").slice(1);

  it("carries a row for each of the six, each with a verdict and an argument", () => {
    expect(preconditions).toHaveLength(6);
    for (const [n, requirement, verdict] of preconditions) {
      expect(n, "a precondition is unnumbered").toMatch(/^[1-6]$/);
      expect(requirement!.length, `precondition ${n} states no requirement`).toBeGreaterThan(20);
      expect(verdict, `precondition ${n} has no verdict`).toMatch(/^\*\*Met/);
      expect(verdict!.length, `precondition ${n} is asserted without an argument`).toBeGreaterThan(60);
    }
  });

  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    // THE ROW EXISTS AND IS NOT BLOCKED, and nothing about its status is pinned — W291's fix to
    // W286's version of this test, applied here from the first line rather than one unit later.
    for (const id of Q24) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5i. Year 6 — Q24 (W300–W312)");
    // SCOPED TO §5i, not to the whole plan. The claim is that THIS expansion planned one quarter,
    // which stays true forever; "the plan mentions no W313" stops being true the moment the next
    // quarter close does its job, and would have reported W312 succeeding as W299 failing.
    expect(section(), "§5i plans a unit beyond the quarter it expands").not.toContain("W313");
    expect(Q24.every((id) => Number(id.slice(1)) <= Q24_HORIZON_LAST_UNIT)).toBe(true);
    expect(asAtHorizon()).toHaveLength(Q24_HORIZON_LAST_UNIT);
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md"]) {
      expect(DOC, `the expansion does not cite ${cited}`).toContain(cited);
      expect(section().includes(cited), `§5i does not cite ${cited}`).toBe(true);
    }
    // And the one it adds, which is where the theme actually comes from.
    expect(DOC).toContain("src/quality/hardening-q23.ts");
  });

  it("(3) names every blocked unit against the gate the ledger says blocks it", () => {
    // Row by row rather than "mentioned somewhere" — W207's finding.
    const byGate = new Map<string, string[]>();
    for (const row of asAtHorizon().filter((r) => r.status === "blocked")) {
      const gate = /\bG(\d+)\b/.exec(row.note)?.[0] ?? "Q17 decision";
      byGate.set(gate, [...(byGate.get(gate) ?? []), row.id]);
    }
    expect(byGate.size).toBeGreaterThan(4);
    for (const [gate, ids] of byGate) {
      const line = RAW.split("\n").find((l) => l.startsWith(`| **${gate}**`));
      expect(line, `the horizon carries no row for ${gate}`).toBeDefined();
      expect(line!, `${gate}'s row has the wrong count`).toContain(`| ${ids.length} |`);
      for (const id of ids) expect(line!, `${gate}'s row does not name ${id}`).toContain(id);
    }
  });

  it("(3) states how many of them the loop may answer, and it is zero", () => {
    expect(DOC).toContain("Decisions on this page the loop may take: zero");
  });

  it("(4) adds no blocked row, which is checkable rather than promised", () => {
    const added = rows().filter((r) => r.n > 299 && r.n <= Q24_HORIZON_LAST_UNIT);
    expect(added).toHaveLength(13);
    expect(added.filter((r) => r.status === "blocked")).toEqual([]);
    expect(DOC).toContain("adds no blocked row");
  });

  it("(5) invents no gate, and every gate a row names is defined in §4", () => {
    for (const row of rows().filter((r) => r.n > 299 && r.n <= Q24_HORIZON_LAST_UNIT)) {
      for (const gate of row.note.match(/\bG\d+\b/g) ?? []) {
        expect(PLAN, `${row.id} names ${gate}, which §4 does not define`).toContain(`**${gate}`);
      }
    }
  });

  it("(6) says what the loop cannot do, in its own section", () => {
    expect(RAW).toContain("## What the loop cannot do, stated plainly");
    expect(DOC).toContain("It cannot answer any of the sixteen");
    // And the part the rule was written for: the four gates that block nothing are what stand
    // between this tree and a patient, said in the plan rather than only in a dossier.
    expect(DOC).toContain("G1, G2, G4 and G7 block nothing");
  });
});

describe("W299 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q24);
    for (const id of Q24) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    expect([...section().matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q24);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    for (const id of Q24) {
      const line = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("says the same thing in the plan and the ledger for every unit", () => {
    // The two drift silently: the plan is read by whoever is choosing what to build and the ledger
    // by whoever is building it, so a quarter described differently in each is worse than one
    // described in neither.
    for (const id of Q24) {
      const planned = section().split("\n").find((l) => l.startsWith(`- **${id}**`))!.slice(`- **${id}** `.length);
      const row = rows().find((r) => r.id === id)!;
      expect(row.note.startsWith(planned), `${id} reads differently in the ledger than in the plan`).toBe(true);
    }
  });

  it("ends the quarter on hardening and a close, as every quarter does", () => {
    expect(PLAN).toContain("- **W311** [P] Q24 hardening");
    expect(PLAN).toContain("- **W312** **QUARTER CLOSE.**");
    expect(rows().length % 13, "the ledger does not end on a whole quarter").toBe(0);
  });
});

describe("W299 the theme is derived from evidence that exists", () => {
  it("quotes the hardening findings it says the theme comes from", () => {
    // W227's rule: a citation to a source nobody can open is a manufactured one. Both findings are
    // named by id and both ids are in the register the document points at.
    const hardening = readFileSync(path.join(ROOT, "src/quality/hardening-q23.ts"), "utf8");
    for (const finding of ["Q23-CR-2", "Q23-SIMP-1", "Q23-CR-1"]) {
      expect(DOC, `the horizon does not name ${finding}`).toContain(finding.replace("Q23-", ""));
      expect(hardening, `${finding} is cited and the register does not have it`).toContain(finding);
    }
  });

  it("names the measurement that is this quarter's own gate", () => {
    // A theme about cost that nothing measures is a mood. W300 records the number and W308
    // re-derives it, and the document says a quarter that did not move it would have failed.
    expect(DOC).toContain("W300 records");
    expect(DOC).toContain("W308 re-derives");
    expect(section()).toContain("re-derives the same number at the end");
  });

  it("refuses to delete a register as a way of paying the tax down", () => {
    // The cheapest way to reduce the number of places a module must be declared is to stop asking
    // one of the questions, and that is the one move this quarter must not make.
    expect(DOC).toContain("It does not delete a register to reduce the tax");
  });
});

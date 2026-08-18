// W273 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// "EVALUATED AND RECORDED" IS THE HALF WITH TEETH, and the trap is obvious once stated: a document
// can say "Met" against every requirement and mean nothing, because the word is free. So each of
// the six is checked against the thing it claims — the unit count against the ledger, the gate
// table against the blocked rows row by row, the blocked-surface promise against what the
// expansion actually added, and requirement 5 against §4.
//
// BOUNDED BY A CONSTANT FROM THE FIRST LINE. `HORIZON-Y6.md` was written unbounded and went red on
// the first expansion after it — this unit's own expansion — for a PLANNED event that said nothing
// about the position. That is DOSSIER-1, which W210 recorded two years ago and W257 was caught by
// mid-build. Writing the same test again without the bound would be the third instance.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q22.md"), "utf8");
// Backticks AND emphasis flattened: the document bolds its counts, and a scan that did not
// subtract the markers would be checking the formatting rather than the number.
const DOC = RAW.replace(/[`*]/g, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/**
 * The last unit that existed when this horizon was written.
 *
 * See the module note. The document prices a position; a test reading the live ledger has to say
 * which moment it is pricing, or it reports Q23's expansion as a defect in Q22's plan.
 */
export const Q22_HORIZON_LAST_UNIT = 286;

interface Row {
  id: string;
  n: number;
  status: string;
  note: string;
}

function rows(): Row[] {
  return LEDGER.split("\n").flatMap((line) => {
    // `[\w-]`, not `\w`: W56 is `in-progress`, and a parser that skipped it would miscount the
    // ledger by one and report the quarter as unfinished — which it did, on this test's first run.
    const m = /^\| (W(\d+)) \| ([\w-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|$/.exec(line);
    return m ? [{ id: m[1]!, n: Number(m[2]), status: m[3]!, note: m[7]! }] : [];
  });
}

const asAtHorizon = () => rows().filter((r) => r.n <= Q22_HORIZON_LAST_UNIT);
const Q22 = Array.from({ length: 13 }, (_, i) => `W${274 + i}`);

describe("W273 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    // Non-vacuity first: every assertion below reads this, and an empty parse would pass the file.
    expect(rows().length).toBeGreaterThan(280);
    expect(rows().filter((r) => r.status === "blocked").length).toBeGreaterThan(10);
  });

  it("states the unit counts the ledger actually holds, before and after", () => {
    const after = asAtHorizon().length;
    expect(DOC).toContain(`The ledger holds 273 units before this expansion and ${after} after it`);
    expect(after).toBe(286);
  });

  it("states the blocked count the ledger actually holds", () => {
    const blocked = rows().filter((r) => r.status === "blocked").length;
    expect(DOC).toContain(`${blocked} rows are blocked`);
  });
});

describe("W273 the six preconditions are evaluated against the thing each claims", () => {
  const table = (heading: string) => {
    const start = RAW.indexOf(heading);
    expect(start, `no section headed ${heading}`).toBeGreaterThan(-1);
    const out: string[][] = [];
    for (const line of RAW.slice(start).split("\n").slice(1)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|")) {
        if (out.length > 0) break;
        continue;
      }
      const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c) || c === "")) continue;
      out.push(cells);
    }
    return out;
  };

  const preconditions = table("## The rule's preconditions").slice(1);

  it("carries a row for each of the six, each with a verdict", () => {
    expect(preconditions).toHaveLength(6);
    for (const [n, requirement, verdict] of preconditions) {
      expect(n, "a precondition is unnumbered").toMatch(/^[1-6]$/);
      expect(requirement!.length, `precondition ${n} states no requirement`).toBeGreaterThan(20);
      expect(verdict, `precondition ${n} has no verdict`).toMatch(/^\*\*Met/);
      expect(verdict!.length, `precondition ${n} is asserted without an argument`).toBeGreaterThan(60);
    }
  });

  it("(1) expands one quarter of thirteen, and no theme beyond it", () => {
    // W282 CORRECTED THE ASSERTION AND KEPT THE PROPERTY. It pinned each row as `| id | available |`,
    // which asserts a STATUS rather than membership — so the first firing to claim a Q22 unit turned
    // this red on a planned event. It is the third instance of that shape in this tree: W260 pinned
    // a `done` count and had to drop it, and DOSSIER-1 is the same finding recorded against a
    // dossier. The property the expansion actually has to hold is that every planned unit EXISTS in
    // the ledger, which is what a session needs in order to claim one.
    const laid = new Set(rows().map((r) => r.id));
    for (const id of Q22) {
      expect(laid, `${id} is planned and not in the ledger`).toContain(id);
    }
    expect(PLAN).toContain("## 5g. Year 6 — Q22 (W274–W286)");
    // The direction that matters: nothing beyond the quarter being expanded.
    // W286 BOUNDED THESE TWO, AND THEY ARE THE THIRD INSTANCE OF THE CLASS Q23 IS ABOUT.
    // Both asserted over the WHOLE plan and the WHOLE ledger: "the plan does not mention W287"
    // and "no row is above 286". Each was true when W273 wrote it and each became false the
    // moment the next quarter expanded — a PLANNED event, reported as a defect in the document
    // that planned it. W273 fixed exactly this in W260's horizon and W274 fixed it again in this
    // file's precondition 4; this is the same failure a third time, in the same family.
    //
    // The requirement is that THIS expansion wrote one quarter, so both now read §5g rather than
    // the whole plan and the ledger as at Q22's own moment.
    const q22Section = PLAN.slice(PLAN.indexOf("## 5g."), PLAN.indexOf("## 5h."));
    expect(q22Section).not.toContain("W287");
    expect(asAtHorizon().every((r) => r.n <= Q22_HORIZON_LAST_UNIT)).toBe(true);
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md"]) {
      expect(DOC, `the expansion does not cite ${cited}`).toContain(cited);
      expect(PLAN, `§5g does not cite ${cited}`).toContain(cited);
    }
    // And the one it adds, which is where the theme actually comes from.
    expect(DOC).toContain("docs/HARDENING-Q21.md");
  });

  it("(3) names every blocked unit against the gate the ledger says blocks it", () => {
    // Row by row rather than "mentioned somewhere" — W207's finding.
    const byGate = new Map<string, string[]>();
    for (const row of rows().filter((r) => r.status === "blocked")) {
      const gate = /\bG(\d+)\b/.exec(row.note)?.[0] ?? "Q17 decision";
      byGate.set(gate, [...(byGate.get(gate) ?? []), row.id]);
    }
    expect(byGate.size).toBeGreaterThan(4);
    for (const [gate, ids] of byGate) {
      const line = RAW.split("\n").find((l) => l.startsWith(`| **${gate}**`));
      expect(line, `the horizon carries no row for ${gate}`).toBeDefined();
      expect(line!, `${gate}'s row has the wrong count`).toContain(`| ${ids.length} |`);
      for (const id of ids) {
        expect(line!, `${gate}'s row does not name ${id}`).toContain(id);
      }
    }
  });

  it("(3) states how many of them the loop may answer, and it is zero", () => {
    // The number the rule exists to keep visible. Written as a word so it cannot be read past.
    expect(DOC).toContain("Decisions on this page the loop may take: zero");
  });

  it("(4) adds no blocked row, which is checkable rather than promised", () => {
    // W274 FIXED THIS TEST, AND THE DEFECT WAS MINE FROM W273. It asserted every added row was
    // still `available` or `claimed` — which is not the requirement and is not even a property of
    // the quarter: builder-B finished W282 an hour later and the check went red on a unit being
    // BUILT. Precondition 4 is about the blocked surface, so that is all this asserts now. It is
    // the same pin-a-transient-value failure W273 fixed in `horizon-y6.test.ts`, committed in the
    // same unit, one file over.
    //
    // Bounded by the constant too, for the reason the constant exists: after Q23 expands, "rows
    // above 273" is twenty-six rows and this quarter's count would read as wrong.
    const added = rows().filter((r) => r.n > 273 && r.n <= Q22_HORIZON_LAST_UNIT);
    expect(added).toHaveLength(13);
    expect(added.filter((r) => r.status === "blocked")).toEqual([]);
    expect(DOC).toContain("adds no blocked row");
  });

  it("(5) invents no gate, and every gate a row names is defined in §4", () => {
    // `plan-ledger` checks this over the whole ledger; here it is checked for what THIS expansion
    // added, so a gate invented by Q22 fails in the unit that invented it.
    for (const row of rows().filter((r) => r.n > 273)) {
      for (const gate of row.note.match(/\bG\d+\b/g) ?? []) {
        expect(PLAN, `${row.id} names ${gate}, which §4 does not define`).toContain(`**${gate}`);
      }
    }
  });

  it("(6) says what the loop cannot do, in its own section", () => {
    expect(RAW).toContain("## What the loop cannot do, stated plainly");
    expect(DOC).toContain("It cannot answer any of the sixteen");
  });
});

describe("W273 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q22);
    for (const id of Q22) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    // The other direction: the plan's Q22 section holds exactly these.
    // Ends at the NEXT §5 extension, not at §6: once Q23 was laid down, slicing to §6 swept its
    // thirteen units into this quarter's section and the both-directions check reported them.
    const section = PLAN.slice(PLAN.indexOf("## 5g."), PLAN.indexOf("## 5h."));
    expect([...section.matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q22);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    // Ends at the NEXT §5 extension, not at §6: once Q23 was laid down, slicing to §6 swept its
    // thirteen units into this quarter's section and the both-directions check reported them.
    const section = PLAN.slice(PLAN.indexOf("## 5g."), PLAN.indexOf("## 5h."));
    for (const id of Q22) {
      const line = section.split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("ends the quarter on hardening and a close, as every quarter does", () => {
    expect(PLAN).toContain("- **W285** [P] Q22 hardening");
    expect(PLAN).toContain("- **W286** **QUARTER CLOSE.**");
    expect(rows().length % 13, "the ledger does not end on a whole quarter").toBe(0);
  });
});

describe("W273 the document refuses what the rule refuses", () => {
  it("plans no quarter beyond the one being expanded", () => {
    expect(DOC).toContain("It does not plan Q23 or Year 7");
    // Scoped to §5g for the same reason: the requirement is that THIS expansion planned no
    // quarter beyond its own, not that the plan never grows one.
    expect(PLAN.slice(PLAN.indexOf("## 5g."), PLAN.indexOf("## 5h."))).not.toContain("Q23 —");
  });

  it("neither ranks the outstanding decisions nor proposes an eleventh gate", () => {
    expect(DOC).toContain("It does not rank the outstanding decisions");
    expect(DOC).toContain("It does not propose an eleventh gate");
    expect(PLAN).not.toContain("**G11");
  });

  it("does not treat a named unit as closing an accepted finding", () => {
    // W275 wires the page suite into the gate; finding 5's acceptance carries a review date and is
    // closed by that review. A plan that named a unit and called an acceptance settled would be
    // the paper trail of a check that never happened.
    expect(DOC).toContain("closed by that review, not by this plan naming a unit");
    expect(readFileSync(path.join(ROOT, "docs/HARDENING-Q21.md"), "utf8")).toContain("2026-11-13");
  });
});

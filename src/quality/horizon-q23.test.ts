// W286 verify gate: "the rule's preconditions evaluated and RECORDED in this plan before any unit
// is written; `plan-ledger` green over the whole ledger."
//
// "EVALUATED AND RECORDED" IS THE HALF WITH TEETH: a document can say "Met" against every
// requirement and mean nothing, because the word is free. So each of the six is checked against
// the thing it claims — the unit counts against the ledger, the gate table against the blocked
// rows row by row, the no-new-blocked-rows promise against what the expansion actually added, and
// gate-invention against §4.
//
// BOUNDED BY A CONSTANT FROM THE FIRST LINE, for the third horizon running. `HORIZON-Y6.md` was
// written unbounded and went red on the first expansion after it — a PLANNED event reported as a
// change to the position it recorded. W273 fixed that and bounded its own; this bounds its own
// too. It is DOSSIER-1, and W279's quarter is about exactly this class of check.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const RAW = readFileSync(path.join(ROOT, "docs/HORIZON-Q23.md"), "utf8");
// Backticks AND emphasis flattened: the document bolds its counts, and a scan that did not
// subtract the markers would be checking the formatting rather than the number.
const DOC = RAW.replace(/[`*]/g, "").replace(/\s+/g, " ");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

/**
 * The last unit that existed when this horizon was written.
 *
 * The document prices a position; a test reading the live ledger has to say which moment it is
 * pricing, or it reports Q24's expansion as a defect in Q23's plan.
 */
export const Q23_HORIZON_LAST_UNIT = 299;

interface Row {
  id: string;
  n: number;
  status: string;
  note: string;
}

function rows(): Row[] {
  return LEDGER.split("\n").flatMap((line) => {
    // `[\w-]`, not `\w`: W56 is `in-progress`, and a parser that skipped it miscounts the ledger
    // by one — which is exactly what W273's first run did.
    const m = /^\| (W(\d+)) \| ([\w-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|$/.exec(line);
    return m ? [{ id: m[1]!, n: Number(m[2]), status: m[3]!, note: m[7]! }] : [];
  });
}

const asAtHorizon = () => rows().filter((r) => r.n <= Q23_HORIZON_LAST_UNIT);
const Q23 = Array.from({ length: 13 }, (_, i) => `W${287 + i}`);

describe("W286 the document reads the ledger it claims to read", () => {
  it("parses the ledger at all", () => {
    // Non-vacuity first: every assertion below reads this, and an empty parse would pass the file.
    expect(rows().length).toBeGreaterThan(290);
    expect(rows().filter((r) => r.status === "blocked").length).toBeGreaterThan(10);
  });

  it("states the unit counts the ledger actually holds, before and after", () => {
    const after = asAtHorizon().length;
    expect(DOC).toContain(`The ledger holds 286 units before this expansion and ${after} after it`);
    expect(after).toBe(299);
  });

  it("states the blocked count the ledger actually holds", () => {
    const blocked = rows().filter((r) => r.status === "blocked").length;
    expect(DOC).toContain(`${blocked} rows are blocked`);
  });
});

describe("W286 the six preconditions are evaluated against the thing each claims", () => {
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
    // THE ROW EXISTS AND IS NOT BLOCKED. It does NOT pin the status, because `available` is the
    // status of a unit nobody has started, and the loop starting one is what this quarter was
    // written to cause: the row moves to `claimed` and then to `done` on schedule. Pinning it made
    // this test go red on W291 the moment it was claimed — the FOURTH instance of a planned event
    // reported as a defect by the document that planned it (W273, W274, W286, this), and the third
    // in a row that was mine. What the precondition actually claims is that the thirteen planned
    // units are IN the ledger and that none of them needs a ruling; both survive the loop building
    // them.
    for (const id of Q23) {
      const row = rows().find((r) => r.id === id);
      expect(row, `${id} is planned and not in the ledger`).toBeDefined();
      expect(row!.status, `${id} was planned as buildable and is now blocked`).not.toBe("blocked");
    }
    expect(PLAN).toContain("## 5h. Year 6 — Q23 (W287–W299)");
    expect(PLAN).not.toContain("W300");
    expect(rows().every((r) => r.n <= Q23_HORIZON_LAST_UNIT)).toBe(true);
  });

  it("(2) cites the two documents the rule names, by path", () => {
    for (const cited of ["docs/AUDIT-Y5.md", "docs/GATE-DOSSIER-Y5.md"]) {
      expect(DOC, `the expansion does not cite ${cited}`).toContain(cited);
      expect(PLAN.includes(cited), `§5h does not cite ${cited}`).toBe(true);
    }
    // And the one it adds, which is where the theme actually comes from.
    expect(DOC).toContain("src/quality/hardening-q22.ts");
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
      for (const id of ids) expect(line!, `${gate}'s row does not name ${id}`).toContain(id);
    }
  });

  it("(3) states how many of them the loop may answer, and it is zero", () => {
    expect(DOC).toContain("Decisions on this page the loop may take: zero");
  });

  it("(4) adds no blocked row, which is checkable rather than promised", () => {
    // Bounded, and asserting only what precondition 4 says — not the row's status, which moves on
    // every firing. W274 had to fix exactly that in W273's version of this test.
    const added = rows().filter((r) => r.n > 286 && r.n <= Q23_HORIZON_LAST_UNIT);
    expect(added).toHaveLength(13);
    expect(added.filter((r) => r.status === "blocked")).toEqual([]);
    expect(DOC).toContain("adds no blocked row");
  });

  it("(5) invents no gate, and every gate a row names is defined in §4", () => {
    for (const row of rows().filter((r) => r.n > 286)) {
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

describe("W286 the quarter table describes the units that were laid down", () => {
  it("lists thirteen units, matching the plan and the ledger in both directions", () => {
    const listed = [...RAW.matchAll(/^\| (W\d+) \| /gm)].map((m) => m[1]!);
    expect(listed).toEqual(Q23);
    for (const id of Q23) {
      expect(PLAN, `${id} is in the horizon and not in the plan`).toContain(`- **${id}** `);
    }
    const section = PLAN.slice(PLAN.indexOf("## 5h."), PLAN.indexOf("## 6. Horizon rule"));
    expect([...section.matchAll(/^- \*\*(W\d+)\*\*/gm)].map((m) => m[1]!)).toEqual(Q23);
  });

  it("gives every planned unit a verify gate, in the plan's own words", () => {
    const section = PLAN.slice(PLAN.indexOf("## 5h."), PLAN.indexOf("## 6. Horizon rule"));
    for (const id of Q23) {
      const line = section.split("\n").find((l) => l.startsWith(`- **${id}**`))!;
      expect(line, `${id} states no verify gate`).toContain("→ verify:");
    }
  });

  it("ends the quarter on hardening and a close, as every quarter does", () => {
    expect(PLAN).toContain("- **W298** [P] Q23 hardening");
    expect(PLAN).toContain("- **W299** **QUARTER CLOSE.**");
    expect(rows().length % 13, "the ledger does not end on a whole quarter").toBe(0);
  });
});

describe("W286 the theme is derived from evidence that exists", () => {
  it("names six instances, and each names a unit the ledger holds", () => {
    // THE RULE'S REQUIREMENT 2 WITH ITS TEETH IN. A theme "derived from" a document is a claim,
    // and the cheapest way to make it false is to cite units that do not exist.
    const cited = [...RAW.matchAll(/^- \*\*(W\d+)(?:\/CR-1)?/gm)].map((m) => m[1]!);
    expect(cited.length).toBeGreaterThanOrEqual(5);
    const known = new Set(rows().map((r) => r.id));
    for (const id of cited) expect(known.has(id), `the theme cites ${id}, which is not a row`).toBe(true);
  });

  it("takes its theme from a register that says what it says", () => {
    // Resolved rather than believed — W284's rule, and the reason it is worth applying to a
    // document that cites source: the hardening register really does record CR-1 as vacuous.
    const hardening = readFileSync(path.join(ROOT, "src/quality/hardening-q22.ts"), "utf8");
    expect(hardening).toContain("true of every spec ever written");
    expect(DOC).toContain("true of every spec ever written");
  });

  it("closes the gap that register declared rather than carrying it", () => {
    // Q22's hardening says W279 landed after its reviewed range and is NOT reviewed. A quarter
    // that recorded a gap and then planned around it would be the shape W210 exists against.
    expect(readFileSync(path.join(ROOT, "src/quality/hardening-q22.ts"), "utf8")).toContain("W279");
    expect(PLAN).toContain("- **W287** W279 reviewed");
  });
});

describe("W286 the document refuses what the rule refuses", () => {
  it("plans no quarter beyond the one being expanded", () => {
    expect(DOC).toContain("It does not plan Q24 or Year 7");
    expect(PLAN).not.toContain("Q24 —");
  });

  it("neither ranks the outstanding decisions nor proposes an eleventh gate", () => {
    expect(DOC).toContain("It does not rank the outstanding decisions");
    expect(DOC).toContain("It does not propose an eleventh gate");
    expect(PLAN).not.toContain("**G11");
  });

  it("does not claim the previous quarter's theme failed", () => {
    // Q22 succeeded AND produced a sharper finding than the one it aimed at. A horizon that read
    // its own evidence as a failure would be picking the wrong lesson from a good quarter.
    expect(DOC).toContain("It does not claim Q22's theme failed");
    expect(DOC).toContain("The theme succeeded");
  });
});

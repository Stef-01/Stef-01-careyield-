// W260 verify gate: "next-horizon plan written from the W256 audit and the W257 dossier; §6's
// expansion rule states what succeeds it now the five-year arc is spent; `plan-ledger` green over
// the whole ledger."
//
// W207's shape, and W207's shape for W207's reason. Its first version asserted that its document
// "names every blocked unit somewhere", which stayed green when a whole row was deleted because
// the unit was still mentioned in the prose. So every count and every unit id in `HORIZON-Y6.md`
// is asserted against the LEDGER'S OWN attribution, row by row — and the zero-blocking gates are
// asserted to be exactly the gates the ledger never names, in both directions.
//
// THE DOCUMENT IS MEANT TO GO RED. A horizon document is a statement about a position, and when
// the position changes the right outcome is a build failure that sends somebody back to re-derive
// it. That is W258's review-date mechanism applied to a plan: ratify a gate, and this fails until
// the horizon is re-read. It is not a document to keep green by editing the number.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const HORIZON = readFileSync(path.join(ROOT, "docs/HORIZON-Y6.md"), "utf8");
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

const LEDGER_ROW = /^\| (W\d+) \| ([\w-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|\s*$/;

interface Row {
  id: string;
  n: number;
  status: string;
  note: string;
}

function rows(): Row[] {
  return LEDGER.split("\n").flatMap((line) => {
    const m = LEDGER_ROW.exec(line);
    return m ? [{ id: m[1]!, n: Number(m[1]!.slice(1)), status: m[2]!, note: m[6]! }] : [];
  });
}

/** Which gate each blocked row names, read off the ledger's own note. */
function blockedByGate(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const row of rows()) {
    if (row.status !== "blocked") continue;
    for (const match of new Set([...row.note.matchAll(/FOUNDER GATE (G\d+)/g)].map((m) => m[1]!))) {
      out.set(match, [...(out.get(match) ?? []), row.id]);
    }
  }
  return out;
}

function gateLines(): string[] {
  const section = PLAN.slice(PLAN.indexOf("## 4. Founder gates"), PLAN.indexOf("\n## 5. Year 1"));
  return section.split("\n").filter((l) => /^- \*\*G\d+\*\*/.test(l));
}

function definedGates(): string[] {
  return gateLines().map((l) => /^- \*\*(G\d+)\*\*/.exec(l)![1]!).sort();
}

/**
 * The gates still outstanding — §4's own `CLEARED` marker decides, not a list here.
 *
 * G0 was cleared in Year 1 and blocks nothing, so a claim about "gates that block nothing" would
 * otherwise have to carry it and would read as though the repository existing were still a
 * founder's decision. Reading the marker rather than excluding G0 by name means the day a second
 * gate is cleared, this narrows on its own and the horizon goes red until somebody re-derives it —
 * which is the whole behaviour a horizon document should have.
 */
function outstandingGates(): string[] {
  return gateLines()
    .filter((l) => !/\bCLEARED\b/.test(l))
    .map((l) => /^- \*\*(G\d+)\*\*/.exec(l)![1]!)
    .sort();
}

const Q21 = Array.from({ length: 13 }, (_, i) => `W${261 + i}`);

describe("W260 the horizon is derived from the ledger, row by row", () => {
  it("parses the ledger at all", () => {
    // Non-vacuity first: every assertion below reads these, so an empty parse would pass the file.
    expect(rows().length).toBeGreaterThan(270);
    expect(blockedByGate().size).toBeGreaterThan(4);
    expect(definedGates().length).toBeGreaterThan(8);
  });

  it("states the unit and blocked counts the ledger actually holds", () => {
    // The counts pinned here are the ones that MEAN something changed: how many units exist, and
    // how many are blocked. The first version also pinned `done`, and that was wrong — `done`
    // moves on every firing, so the document would have gone red once an hour and said nothing
    // about the position. A pin whose signal is noise gets edited rather than read, which is the
    // failure mode of every stale document this tree has replaced with a register.
    const all = rows();
    expect(HORIZON).toContain(`The ledger holds **${all.length} units**`);
    const blocked = all.filter((r) => r.status === "blocked");
    expect(HORIZON).toContain(`**${blocked.length} are blocked**`);
  });

  it("names every blocked unit against the gate the ledger says blocks it", () => {
    // Row by row, not "mentioned somewhere". W207's finding: a table row can be deleted while the
    // unit survives in the prose, and a document that only checks prose stays green through it.
    for (const [gate, ids] of blockedByGate()) {
      const row = HORIZON.split("\n").find((l) => l.startsWith(`| **${gate}**`));
      expect(row, `the horizon does not carry a row for ${gate}`).toBeDefined();
      expect(row, `${gate} is priced at the wrong unit count`).toContain(`| ${ids.length} |`);
      for (const id of ids) {
        expect(row, `${gate} blocks ${id} and the horizon does not say so`).toContain(id);
      }
    }
  });

  it("claims exactly the gates that block nothing, in both directions", () => {
    // The dossier's finding, re-derived here rather than copied from it. Both directions: a gate
    // the ledger never names must appear in the claim, and a gate that blocks something must not.
    const blocking = new Set(blockedByGate().keys());
    const idle = outstandingGates().filter((g) => !blocking.has(g));
    expect(idle.length, "every gate blocks something, so the claim is empty").toBeGreaterThan(2);
    // The CLEARED filter is proved to do something, so "outstanding" is not just "defined".
    expect(definedGates().length, "nothing is cleared, so the filter is untested").toBeGreaterThan(
      outstandingGates().length,
    );
    expect(outstandingGates(), "a cleared gate is being priced as outstanding").not.toContain("G0");
    const claim = /\*\*((?:G\d+(?:, )?)+) and (G\d+) block nothing\.\*\*/.exec(HORIZON);
    expect(claim, "the horizon no longer states which gates block nothing").not.toBeNull();
    const claimed = [...claim![1]!.split(", "), claim![2]!].sort();
    expect(claimed, "the horizon's idle-gate claim disagrees with the ledger").toEqual(idle.sort());
  });

  it("says the loop may answer none of them", () => {
    // The sentence the rule now requires at every expansion. Pinned so it cannot be softened into
    // a summary of progress.
    expect(HORIZON).toContain("Decisions on this page the loop may take: zero.");
  });
});

describe("W260 the quarter is laid into both files and needs no ruling", () => {
  it("plans thirteen units, and lays every one into the ledger", () => {
    const planned = [...PLAN.matchAll(/^- \*\*(W\d+)\*\* /gm)].map((m) => m[1]!);
    const byId = new Map(rows().map((r) => [r.id, r]));
    expect(Q21.filter((id) => planned.includes(id))).toEqual(Q21);
    for (const id of Q21) {
      expect(byId.get(id), `${id} is planned and not in the ledger`).toBeDefined();
      expect(HORIZON, `${id} is planned and not in the horizon`).toContain(`| ${id} |`);
    }
    expect(Math.max(...rows().map((r) => r.n)) % 13, "the ledger does not end on a whole quarter").toBe(0);
  });

  it("blocks none of them, which is the quarter's own constraint", () => {
    // "No unit in Q21 may add a blocked row" is stated in §5f, and a paragraph is not a control —
    // so it is checked here until W263 makes it a standing one.
    const byId = new Map(rows().map((r) => [r.id, r]));
    const blocked = Q21.filter((id) => byId.get(id)!.status === "blocked");
    expect(blocked, "Q21 grew the blocked surface").toEqual([]);
  });

  it("cites both source documents by path, and no third", () => {
    // The rule's second clause: derived from the last audit and the last gate dossier, never from
    // a theme written earlier. Citing them is checkable; whether the quarter follows from them is
    // a judgement, and a scan pretending to make it would be the failure W153 refused.
    expect(HORIZON).toContain("docs/AUDIT-Y5.md");
    expect(HORIZON).toContain("docs/GATE-DOSSIER-Y5.md");
    expect(PLAN).toContain("docs/HORIZON-Y6.md");
  });
});

describe("W260 the expansion rule has a stated successor", () => {
  it("supersedes the five-year rule rather than editing it", () => {
    const heading = "## 6. Horizon rule (supersedes the five-year expansion rule, W260)";
    expect(PLAN).toContain(heading);
    const section = PLAN.slice(PLAN.indexOf(heading));
    // Six numbered clauses, each a rule rather than a sentiment.
    const clauses = [...section.matchAll(/^\d\. \*\*/gm)];
    expect(clauses.length, "the successor rule has fewer clauses than it claims").toBe(6);
    expect(section).toContain("One quarter at a time, never a year.");
    expect(section).toContain("The gate position is re-read and RECORDED at every expansion");
  });

  it("keeps the five-year themes as a record rather than deleting them", () => {
    // The themes are the record of what was planned; §5's rows are the record of what was built,
    // and W208's finding lives in the disagreement between them. Deleting them would delete the
    // evidence for the rule that replaced them.
    expect(PLAN).toContain("### The five-year themes as written in Year 1 (historical)");
    expect(PLAN).toContain("learned ranking second");
  });

  it("argues from the tree's own record rather than from a preference", () => {
    const section = PLAN.slice(PLAN.indexOf("## 6. Horizon rule"));
    // The two defects the rule exists to fix, each named with the unit that evidences it.
    expect(section).toContain("W217");
    expect(section).toContain("W208");
    expect(section).toContain("GATE-DOSSIER-Y5.md");
  });
});

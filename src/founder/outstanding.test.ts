// W310 verify gate: "a rendered page derived from the ledger and §4 rather than written, naming
// each outstanding gate, the units it releases, and how long it has waited; no clinical claim, and
// the copy passes the advice linter."
//
// "DERIVED RATHER THAN WRITTEN" IS THE CLAUSE WITH TEETH and it is the one a green suite is worst
// at. A page holding a hand-written list of gates passes every other clause on the day it is
// written: it names the gates, it names the units, it states a wait. It fails silently on the
// firing after. So the derivation is proved by CHANGING THE SOURCES in a copied tree — a gate that
// is not in this plan, a unit this ledger does not block — and requiring the output to move.

import { readFileSync, rmSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FOUNDER_BOUND,
  FOUNDER_COPY,
  builtSurface,
  founderDiff,
  outstandingRulings,
  parseGates,
  renderedUnits,
  waitedFor,
} from "./outstanding";
import { blockedRows, blockersIn, parseLedgerRows } from "@/quality/blocked-surface";
import { lintEducationCopy } from "@/education/advice-lint";
import { copyTree, withPlantedIn, withTree } from "@/quality/planting";

const ROOT = process.cwd();

/** A plan holding one gate this tree has never had, proposed by a unit that exists. */
const PLANTED_PLAN = [
  "## 4. Founder gates (the loop NEVER crosses these; it builds to them and flags)",
  "",
  "- **G0** — ~~a cleared gate~~ CLEARED 2026-08-08: done.",
  "- **G1** — a standing gate the plan was written with",
  "- **G99** — **PROPOSED at W104, awaiting founder ratification.** A gate no tree has.",
  "",
  "## 5. Year 1 weekly ledger (W1–W52)",
  "- **W1** Scaffold → verify: CI green.",
].join("\n");

describe("W310 the page is derived from the two documents, not written", () => {
  it("reads gates out of §4, including which are cleared and which were proposed", () => {
    const gates = parseGates(PLANTED_PLAN);
    expect(gates.map((g) => [g.id, g.status, g.proposedAt])).toEqual([
      ["G0", "cleared", null],
      ["G1", "standing", null],
      ["G99", "proposed", "W104"],
    ]);
  });

  it("stops at §4, so a gate token in the ledger section is not a gate", () => {
    // The negative for the parse above. §5 quotes gate names constantly — every blocked row names
    // one — and a parse that ran past the section boundary would invent gates out of prose.
    const withLedgerProse = `${PLANTED_PLAN}\n- **G7** — a line below the ledger heading\n`;
    expect(parseGates(withLedgerProse).map((g) => g.id)).toEqual(["G0", "G1", "G99"]);
  });

  it("MOVES when the plan moves, which is the whole claim", () => {
    // THE UNIT. A hand-written page passes every other test in this file on the day it is written.
    // This one plants a different §4 into a copy of the tree and requires the wait to change: the
    // gate's origin is read from the plan, so a gate proposed later has waited less.
    // W332: removed, in W331's idiom. This file made two copies of the repository per run and
    // removed neither — two sites W331's sweep of the same defect did not reach.
    const copy = copyTree(ROOT);
    let early: ReturnType<typeof parseGates>;
    try {
      early = withPlantedIn(copy, { "docs/FIVE-YEAR-PLAN.md": PLANTED_PLAN }, () =>
        parseGates(PLANTED_PLAN),
      );
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
    const late = PLANTED_PLAN.replace("PROPOSED at W104", "PROPOSED at W300");
    const rows = parseLedgerRows(
      ["| W1 | done | b | 2026-08-08T07:05Z | abc1234 | a row |", "| W104 | done | b | 2026-08-10T08:40Z | def5678 | a row |", "| W300 | done | b | 2026-08-17T10:10Z | 9012abc | a row |"].join("\n"),
    );
    const waitedEarly = waitedFor(early.find((g) => g.id === "G99")!, rows);
    const waitedLate = waitedFor(parseGates(late).find((g) => g.id === "G99")!, rows);
    expect(waitedEarly.sinceUnit).toBe("W104");
    expect(waitedLate.sinceUnit).toBe("W300");
    expect(waitedEarly.unitsSince).toBeGreaterThan(waitedLate.unitsSince);
    expect(waitedEarly.sinceAt).toBe("2026-08-10T08:40Z");
  });

  it("counts units BUILT since, not the distance to the last row in the file", () => {
    // The first draft subtracted from the highest id in the ledger, which is W312 — a unit nobody
    // has built, sitting there because the quarter is planned ahead. That reported a wait longer
    // than the build. A planned row must not count.
    const rows = parseLedgerRows(
      [
        "| W1 | done | b | 2026-08-08T07:05Z | abc1234 | a row |",
        "| W2 | done | b | 2026-08-08T08:05Z | abc1235 | a row |",
        "| W3 | available | — | — | — | not built |",
        "| W4 | blocked | — | — | — | not built |",
      ].join("\n"),
    );
    expect(waitedFor(null, rows).unitsSince).toBe(1);
  });

  it("holds no gate list and no blocked count of its own", () => {
    // The property that makes the page unable to go stale, checked as text: a literal `G5` or a
    // number of blocked units written into this module is the defect the whole unit is about.
    const source = readFileSync("src/founder/outstanding.ts", "utf8");
    expect(source).not.toMatch(/"G\d+"/);
    expect(Object.values(FOUNDER_COPY).join(" ")).not.toMatch(/\bG\d+\b/);
  });
});


describe("W310 every outstanding ruling, its units, and its wait", () => {
  it("names every blocker the ledger blocks on, and none it does not", () => {
    expect(founderDiff(ROOT)).toEqual({
      undescribed: [],
      clearedButBlocking: [],
      unrendered: [],
      phantom: [],
    });
  });

  it("renders every blocked row, including the two that were not week-units", () => {
    // W310'S FINDING. The ledger parse matched `W\d+`, so `SUP-1` and `SUP-2` — blocked on G5 since
    // W89 — had never been counted by the blocked-surface budget, named by a release path, or shown
    // to anybody. A page that omits a row is worse than no page: a reader cannot see the gap.
    const rendered = new Set(outstandingRulings(ROOT).flatMap((r) => r.releases.map((u) => u.id)));
    for (const row of blockedRows(ROOT)) {
      expect(rendered.has(row.id), `${row.id} is blocked and the page does not show it`).toBe(true);
    }
    expect([...rendered]).toContain("SUP-1");
    expect([...rendered]).toContain("SUP-2");
  });

  it("gives every ruling a wait, a decider, and the units it buys", () => {
    const rulings = outstandingRulings(ROOT);
    expect(rulings.length).toBeGreaterThan(0);
    for (const ruling of rulings) {
      expect(ruling.releases.length, `${ruling.blocker} releases nothing`).toBeGreaterThan(0);
      expect(ruling.waited.unitsSince, `${ruling.blocker} has waited no units`).toBeGreaterThan(0);
      expect(ruling.waited.sinceAt, `${ruling.blocker} has no date`).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(ruling.whoDecides.length).toBeGreaterThan(40);
      // W263's rule, rendered: no release path may name a builder as the decider.
      expect(ruling.whoDecides, `${ruling.blocker} names a builder as decider`).not.toMatch(
        /\bbuilder-[AB]\b|\bthe loop decides\b/,
      );
    }
  });

  it("gives every gate its own sentence from §4 rather than one written here", () => {
    const plan = readFileSync("docs/FIVE-YEAR-PLAN.md", "utf8");
    for (const ruling of outstandingRulings(ROOT)) {
      if (!ruling.gateText) continue;
      expect(plan, `${ruling.blocker}'s sentence is not §4's`).toContain(ruling.gateText);
    }
  });

  it("dates a founder DECISION from when it was reached, not from the plan", () => {
    // Q24'S REVIEW FOUND THIS. A decision is not a §4 gate, so it fell to the `?? "W1"` branch and
    // rendered as *outstanding since the plan was written* — sorting above three gates that really
    // have waited longer, and telling a reader that a question raised at W217 had been open since
    // W1. The wait now runs from the last unit BUILT before the row it blocks, which is when the
    // quarter reached that boundary; the blocked row itself carries no date, having never been
    // built. Both directions: a decision must not read as standing, and a standing gate must.
    const rulings = outstandingRulings(ROOT);
    const decisions = rulings.filter((r) => r.kind === "founder_decision");
    expect(decisions.length).toBeGreaterThan(0);
    for (const decision of decisions) {
      expect(decision.waited.kind, `${decision.blocker} reads as standing`).toBe("proposed");
      expect(decision.waited.sinceUnit, `${decision.blocker} dates from W1`).not.toBe("W1");
      expect(decision.waited.sinceAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
    const standing = rulings.filter((r) => r.waited.kind === "standing");
    expect(standing.length, "no gate reads as standing any more").toBeGreaterThan(0);
    for (const gate of standing) expect(gate.waited.sinceUnit).toBe("W1");
  });

  it("reports an empty state rather than throwing when nothing is built", () => {
    // `weeks.reduce(..., weeks[0]!)` over an empty array returned `undefined` and the page threw
    // on `last.id`. A root with no done week-unit is not a tree this repository will ever have,
    // which is exactly why nothing would have caught it.
    const built = withTree({ "BUILD-STATE.md": "| W1 | claimed | b | — | — | not built |\n" }, (root) =>
      builtSurface(root),
    );
    expect(built).toEqual({ done: 0, blocked: 0, latestUnit: "none", latestAt: "" });
  });

  it("sorts the longest wait first, so the page leads with the oldest question", () => {
    const waits = outstandingRulings(ROOT).map((r) => r.waited.unitsSince);
    expect([...waits].sort((a, b) => b - a)).toEqual(waits);
  });

  it("reports what exists from the ledger, both halves", () => {
    const built = builtSurface(ROOT);
    expect(built.done).toBeGreaterThan(0);
    expect(built.blocked).toBe(blockedRows(ROOT).length);
    expect(built.latestUnit).toMatch(/^W\d+$/);
  });
});

describe("W310 the three ways a rendered page goes wrong", () => {
  it("reports a blocker with no sentence behind it", () => {
    const paths = [
      { blocker: "G404", kind: "founder_gate" as const, whoDecides: "x", releases: ["W161"] },
    ];
    expect(founderDiff(ROOT, paths).undescribed).toEqual(["G404"]);
  });

  it("reports a blocked row no release path names, which the page would omit in silence", () => {
    // The arm that matters, driven on an EMPTY path register: every blocked row becomes invisible.
    const unrendered = founderDiff(ROOT, []).unrendered;
    expect(unrendered.length).toBe(blockedRows(ROOT).length);
    expect(unrendered).toContain("SUP-1");
  });

  it("renders every blocked row the ledger holds, and nothing else — W319's round trip", () => {
    // BOTH DIRECTIONS OVER THE SAME PAIR OF SETS, which is what makes this a round trip rather
    // than two half-checks. `renderedUnits` reads the same call the page maps into rows, so a page
    // that started rendering a list somebody kept beside it would fail here.
    const rendered = new Set(renderedUnits(ROOT));
    const blocked = new Set(blockedRows(ROOT).map((r) => r.id));
    expect([...blocked].filter((id) => !rendered.has(id)), "blocked and not on the page").toEqual([]);
    expect([...rendered].filter((id) => !blocked.has(id)), "on the page and not blocked").toEqual([]);
    expect(rendered.size).toBe(blocked.size);
    expect(rendered.size).toBeGreaterThan(10);
  });

  it("counts a unit once however many rulings would release it", () => {
    // W202 IS BLOCKED ON G9 AND G1 BOTH, and the shape generalises: a unit can wait on more than
    // one ruling, so two release paths can name it. Without the dedup, `renderedUnits` returns it
    // twice and the round-trip size comparison above passes on a page listing a duplicate. No two
    // paths share a unit in the tree today, which is exactly why this is constructed — a mutation
    // removing the dedup survived every other assertion in this file.
    const paths = [
      { blocker: "G5", kind: "founder_gate" as const, whoDecides: "The founder.", releases: ["W161"] },
      { blocker: "G6", kind: "founder_gate" as const, whoDecides: "The founder.", releases: ["W161"] },
    ];
    expect(renderedUnits(ROOT, paths)).toEqual(["W161"]);
  });

  it("reports a unit the page renders that the ledger does not block", () => {
    // W319'S ARM, and the one `unrendered` cannot reach. A release path naming a unit that is
    // finished, renamed or unblocked makes the page promise work a ruling would not release —
    // the page overstating the prize, which is the same defect as omitting a row pointed the
    // other way. Driven on a constructed path, because the real register has no such row.
    const paths = [
      {
        blocker: "G5",
        kind: "founder_gate" as const,
        whoDecides: "The founder.",
        releases: ["W161", "W1"],
      },
    ];
    const diff = founderDiff(ROOT, paths);
    expect(diff.phantom, "W1 is done and the page would show it as waiting").toEqual(["W1"]);
    // And the healthy direction on the same call, so a `phantom` that reported everything passes
    // neither: W161 really is blocked on G5 and must not be reported.
    expect(diff.phantom).not.toContain("W161");
  });

  it("reports a gate already cleared that still holds blocked rows", () => {
    // Driven by planting a plan in which the gate the tree blocks on the most is CLEARED. Nothing
    // in a healthy tree produces this arm, and it is the one where the page would tell a founder
    // something is waiting on a ruling they have already made.
    const blocker = blockersIn(blockedRows(ROOT)[0]!.note)[0]!;
    const plan = [
      "## 4. Founder gates",
      "",
      `- **${blocker}** — ~~a gate that was answered~~ CLEARED 2026-08-17: ruled.`,
      "",
      "## 5. Year 1 weekly ledger",
    ].join("\n");
    const copy = copyTree(ROOT);
    let found: string[];
    try {
      found = withPlantedIn(copy, { "docs/FIVE-YEAR-PLAN.md": plan }, () =>
        founderDiff(copy).clearedButBlocking,
      );
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
    expect(found).toContain(blocker);
  });
});

describe("W310 the copy makes no clinical claim", () => {
  it("passes the advice linter, every sentence of it", () => {
    // THE GATE'S LAST CLAUSE. W200 lints this surface too, by declaration; this drives the linter
    // directly so the clause is proved here rather than by a register somewhere else agreeing to.
    for (const [key, text] of Object.entries(FOUNDER_COPY)) {
      expect(lintEducationCopy(text), `FOUNDER_COPY.${key} advises`).toEqual([]);
    }
  });

  it("is non-vacuous: the linter it passes does reject advice", () => {
    // Silence proves the copy only if the linter was running. W295's shape, on a copy check.
    expect(
      lintEducationCopy("You should book an urgent review of this overdue patient.").length,
    ).toBeGreaterThan(0);
  });

  it("says it is about build status and mentions no patient or practice", () => {
    const all = Object.values(FOUNDER_COPY).join(" ");
    expect(all).toMatch(/build status/i);
    expect(all).not.toMatch(/\bpatient(s)?\b(?!\s+data)/i);
  });

  it("says what a green page does not prove", () => {
    expect(FOUNDER_BOUND).toMatch(/blocker is the right blocker/);
    expect(FOUNDER_BOUND).toMatch(/founderDiff/);
  });
});


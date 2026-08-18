// W293 verify gate: "every empty-list assertion in the suite paired with evidence its source is
// non-empty, or accepted with a reason; the check is proved on a list that is empty by construction."
//
// THE PROOF ON A LIST EMPTY BY CONSTRUCTION IS THE GATE'S OWN WORDS AND IT IS A PAIR. Two test
// files are constructed that differ in one line: in the first the filtered list is literally `[]`
// so the assertion cannot fail, and in the second the same filter runs over a collection the file
// first shows holding something. The sweep must report the first and stay quiet about the second —
// a sweep that reported both would satisfy the gate's sentence and mean nothing.
//
// This file deliberately does NOT import `tree-walks`: it reads the tree through
// `empty-list-sweep`'s own exports, so it stays out of W267's census and the register keeps one
// planting file instead of two.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GATE_PINNED_EMPTY,
  UNEVIDENCED_AT_W293,
  classify,
  describeSweep,
  emptyListDiff,
  sourcesOf,
  sweepText,
} from "./empty-list-sweep";

const ROOT = process.cwd();

/** A test file whose filtered list is empty because its source is. The defect, in eight lines. */
const EMPTY_BY_CONSTRUCTION = `
import { flagged } from "@/w293/probe";

it("reports nothing bad", () => {
  const rows: string[] = [];
  expect(rows.filter((r) => flagged(r))).toEqual([]);
});
`;

/** The same assertion over a source the file first shows holding something. */
const EVIDENCED = `
import { collect, flagged } from "@/w293/probe";

it("reports nothing bad", () => {
  const rows = collect();
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.filter((r) => flagged(r))).toEqual([]);
});
`;

const unevidencedIds = (file: string, source: string): string[] => {
  const sweep = sweepText(file, source);
  return sweep.empty.filter((e) => !e.sources.some((s) => sweep.evidenced.has(s))).map((e) => e.text);
};

describe("W293 the check, proved on a list that is empty by construction", () => {
  it("reports the assertion whose source cannot fill", () => {
    // The gate's sentence, executed on a constructed file rather than on the tree — so the shape
    // is proved even on the day the tree happens to contain none of it.
    expect(unevidencedIds("src/w293-probe.test.ts", EMPTY_BY_CONSTRUCTION)).toEqual([
      "expect(rows.filter((r) => flagged(r))).toEqual([])",
    ]);
  });

  it("stays quiet when the same assertion has a witness one line above", () => {
    // The other direction, and it is what makes the line above mean something: a sweep reporting
    // every `toEqual([])` would pass the first assertion and be worthless.
    expect(unevidencedIds("src/w293-probe.test.ts", EVIDENCED)).toEqual([]);
    // And the assertion really is there to be reported, so the quiet is a decision not an absence.
    expect(sweepText("src/w293-probe.test.ts", EVIDENCED).empty).toHaveLength(1);
  });

  it("does not treat an empty array literal as evidence of anything", () => {
    // THE BUG THIS SWEEP SHIPPED FOR AN HOUR, pinned so it cannot come back. `]` is a
    // non-whitespace character, so a `/^\\[\\s*\\S/` test on the expected value matched `[]` — and
    // every `toEqual([])` in the tree evidenced ITSELF. The sweep reported 531 of 531 clean and
    // was measuring nothing. Found by auditing what it called evidenced, not by reading it.
    const selfEvidencing = `
it("t", () => {
  const rows = build();
  expect(rows).toEqual([]);
});
`;
    expect(unevidencedIds("src/w293-probe.test.ts", selfEvidencing)).toEqual([
      "expect(rows).toEqual([])",
    ]);
  });

  it("counts `toHaveLength(0)` as the same claim, because it is", () => {
    const byLength = `
it("t", () => {
  const rows = build();
  expect(rows).toHaveLength(0);
});
`;
    expect(unevidencedIds("src/w293-probe.test.ts", byLength)).toEqual([
      "expect(rows).toHaveLength(0)",
    ]);
  });
});

describe("W293 the source is a (producer, field) pair, not a token", () => {
  it("reads the four spellings of one source as one source", () => {
    // Each of these is `record().clinicians` written differently, and a detector keying on the
    // leading token calls them four different things and reports all four unevidenced.
    const bound = new Map([
      ["clinicians", "record.clinicians"],
      ["diff", "censusDiff"],
    ]);
    expect(sourcesOf("record().clinicians", bound)).toEqual(["record.clinicians"]);
    expect(sourcesOf("clinicians", bound)).toEqual(["record.clinicians"]);
    expect(sourcesOf("diff.undeclared", bound)).toEqual(["censusDiff.undeclared"]);
    expect(sourcesOf("censusDiff(found).undeclared", new Map())).toEqual([
      "censusDiff.undeclared",
      "found.undeclared",
    ]);
  });

  it("keeps the field, because a sibling field is not evidence", () => {
    // `expect(r.errors).toEqual([])` is not evidenced by `expect(r.warnings).toContain(...)`: the
    // object held something, the LIST never did. Dropping the field halves the finding count.
    const sibling = `
it("t", () => {
  const r = lint(text);
  expect(r.warnings).toContain("careful");
  expect(r.errors).toEqual([]);
});
`;
    expect(unevidencedIds("src/w293-probe.test.ts", sibling)).toEqual([
      'expect(r.errors).toEqual([])',
    ]);
  });

  it("does not read `.length` as a field, because it is the same collection counted", () => {
    const counted = `
it("t", () => {
  expect(lintCopy(bad).length).toBeGreaterThan(0);
  expect(lintCopy(good)).toEqual([]);
});
`;
    expect(unevidencedIds("src/w293-probe.test.ts", counted)).toEqual([]);
  });

  it("does not read a field out of an arrow body as the collection's field", () => {
    // `lintLandingCopy(bad).map((v) => v.rule)` ends in `.rule`, which is a field of each ELEMENT.
    // Reading it as the collection's field hid five real proofs of the compliance linter.
    expect(sourcesOf("lintLandingCopy(bad).map((v) => v.rule)", new Map())).toEqual([
      "bad",
      "lintLandingCopy",
      "map",
      "rule",
    ]);
  });

  it("does not read a name out of a string literal as a source", () => {
    // `credentials.test.ts` says `expect(SOURCE).toContain("SHIPPED_CREDENTIALS: readonly never[]")`
    // three lines under the assertion about the register itself. A sentence ABOUT a thing is not
    // the thing — the recurring collision, and `blankLiterals` is W288's remedy for it.
    expect(sourcesOf('expect(SOURCE).toContain("SHIPPED_CREDENTIALS")', new Map())).not.toContain(
      "SHIPPED_CREDENTIALS",
    );
  });
});

describe("W293 the tree, classified in both directions", () => {
  const CLASSIFIED = classify(ROOT);

  it("pins the unevidenced by name, and nothing has arrived or been fixed unrecorded", () => {
    expect(emptyListDiff(ROOT)).toEqual({ newlyUnevidenced: [], nowEvidenced: [] });
  });

  it("swept the whole suite, not a corner of it", () => {
    expect(CLASSIFIED.length).toBeGreaterThan(500);
    expect(new Set(CLASSIFIED.map((c) => c.file)).size).toBeGreaterThan(150);
  });

  it("finds every class populated, so no arm is decoration", () => {
    // Non-vacuity per class. A classifier that answered `same_file` for everything would pass the
    // door above, because the door only reads the `none` arm.
    for (const kind of ["same_file", "imported_elsewhere", "gate_pinned_empty", "none"] as const) {
      expect(CLASSIFIED.filter((c) => c.evidence === kind).length, `${kind} is empty`).toBeGreaterThan(20);
    }
  });

  it("accepts a gate-pinned register only when the subject is the bare constant", () => {
    // Both directions on the one accepted class. A derived answer OVER an empty register is the
    // vacuity rather than the gate, so it must not inherit the acceptance.
    expect(GATE_PINNED_EMPTY.test("SHIPPED_PATHWAYS")).toBe(true);
    expect(GATE_PINNED_EMPTY.test("ENABLED_COUPLINGS")).toBe(true);
    expect(GATE_PINNED_EMPTY.test("SHIPPED_PATHWAYS.filter")).toBe(false);
    expect(GATE_PINNED_EMPTY.test("shippedEvidence")).toBe(false);
    const gated = CLASSIFIED.filter((c) => c.evidence === "gate_pinned_empty");
    for (const hit of gated) {
      expect(hit.sources, `${hit.id} was accepted on more than its own constant`).toHaveLength(1);
    }
  });

  it("carries the debt as rows that resolve to real files and real tests", () => {
    // A pinned list nobody can resolve is a list that rots into fiction. Each row names a file the
    // sweep still reads and a test that still exists.
    expect(UNEVIDENCED_AT_W293.length).toBeGreaterThan(100);
    const live = new Set(CLASSIFIED.map((c) => c.id));
    for (const row of UNEVIDENCED_AT_W293) {
      expect(live, `${row} names an assertion the sweep no longer finds`).toContain(row);
    }
  });

  it("fixed the two the sweep found in a control, rather than pinning them", () => {
    // W293's own worked example, and the reason the debt list is not simply "everything it found".
    // The G5 rehearsal asserts that it does not seed W127's registry — a founder-gate control —
    // and nothing in the tree had ever shown that registry holding anything, so a getter returning
    // `[]` under all conditions satisfied it forever. A witness was added beside the claim.
    const registry = CLASSIFIED.filter(
      (c) =>
        c.file === "src/quality/g5-rehearsal.test.ts" &&
        c.sources.some((s) => s.startsWith("getPathway")),
    );
    expect(registry.length, "the registry assertions are gone").toBeGreaterThan(1);
    for (const hit of registry) {
      expect(hit.evidence, `${hit.id} lost its witness`).toBe("same_file");
    }
  });
});

describe("W293 the reporter's arms, driven from outside", () => {
  it("reports an assertion that arrives with no evidence", () => {
    expect(emptyListDiff(ROOT, []).newlyUnevidenced.length).toBeGreaterThan(100);
  });

  it("reports a pinned row that has gained evidence", () => {
    const invented = [...UNEVIDENCED_AT_W293, "src/gone.test.ts :: a test :: nothing"];
    expect(emptyListDiff(ROOT, invented).nowEvidenced).toEqual([
      "src/gone.test.ts :: a test :: nothing",
    ]);
  });
});

describe("W293 the header states no number that could go stale", () => {
  const HEADER = (() => {
    const source = readFileSync(path.join(__dirname, "empty-list-sweep.ts"), "utf8");
    return source.slice(0, source.indexOf("import "));
  })();

  it("carries no bare count at all, which is the rule the first draft broke", () => {
    // THE DEFECT THIS PINS, and it was shipped in this module for an hour. The header quoted the
    // sweep's numbers from while it was broken — a near-clean tree and a handful of exceptions —
    // and those sentences survived the fix that changed the answer by two orders of magnitude.
    // A green suite says nothing about prose, so the rule is structural: a run of three or more
    // digits is a measurement, and a measurement belongs in `describeSweep`. Unit ids are the one
    // exception and they are spelled with a leading `W`.
    const counts = [...HEADER.matchAll(/(.?)(\d{3,})/g)].filter(([, before]) => before !== "W");
    expect(counts.map((m) => m[2]), "a count in the header is a pin nobody re-derives").toEqual([]);
  });

  it("still cites units, so the rule did not simply delete the header's references", () => {
    // Non-vacuity for the line above: a header with no digits at all would pass it trivially.
    expect(HEADER).toMatch(/W267/);
    expect(HEADER).toMatch(/W29\d/);
  });

  it("does not describe an acceptance kind the code does not have", () => {
    // The second false claim in the same header: it described a `cross_file` acceptance kind with
    // resolved citations. No such kind was ever written. Checked against the code rather than by
    // rereading, because rereading is what missed it.
    const source = readFileSync(path.join(__dirname, "empty-list-sweep.ts"), "utf8");
    for (const kind of ["same_file", "imported_elsewhere", "gate_pinned_empty", "none"]) {
      expect(source, `${kind} is not in the EvidenceKind union`).toContain(`"${kind}"`);
    }
    expect(source, "the header names a kind the union does not have").not.toContain("cross_file");
  });

  it("reports its own measurement instead of asserting one", () => {
    const census = describeSweep(ROOT);
    // The census counts ASSERTIONS and the pin holds IDS, and they differ: an id is
    // `file :: test :: sources` with no line number, so two assertions in one test over the same
    // sources share a row. Deliberate — a pin that moved when somebody added a blank line is the
    // shape W290 spent a unit on — and asserted here so the two cannot silently diverge.
    const ids = new Set(classify(ROOT).filter((c) => c.evidence === "none").map((c) => c.id));
    expect(ids.size).toBe(UNEVIDENCED_AT_W293.length);
    expect(census.unevidenced).toBeGreaterThanOrEqual(ids.size);
    expect(census.sameFile + census.importedElsewhere + census.gatePinnedEmpty + census.unevidenced).toBe(
      census.total,
    );
    expect(census.total).toBeGreaterThan(500);
  });
});

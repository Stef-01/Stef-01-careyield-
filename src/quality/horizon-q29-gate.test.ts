// W376 verify gate: "every population `docs/HORIZON-Q29.md` names is derived, and is shown both
// including a planted member and excluding a planted non-member; a population named and not shown
// both ways fails."
//
// THE WORD "BOTH" IS THE WHOLE TEST. Either half alone is free — a derivation returning everything
// includes every member, one returning nothing excludes every non-member — so the readings below
// are asserted as a PAIR, and a probe that answers the same way twice is a defect rather than a
// demonstration.

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  HORIZON_Q29,
  POPULATIONS_AT_W376,
  QUARTER_GATE_BOUND,
  type QuarterPopulation,
  quarterDefects,
  resolvesInTree,
  unitsInHorizon,
} from "./horizon-q29-gate";

const ROOT = process.cwd();
const NAMED = unitsInHorizon(ROOT);
const only = (unit: string, rows: readonly QuarterPopulation[]) =>
  quarterDefects(ROOT, rows).filter((d) => d.unit === unit);
const rowFor = (unit: string) => POPULATIONS_AT_W376.find((r) => r.unit === unit)!;

describe("W376 every population the quarter's horizon names is re-read, both ways", () => {
  it("passes, over the quarter as it stands", () => {
    expect(quarterDefects(ROOT)).toEqual([]);
  });

  it("derives the units from the document rather than transcribing them", () => {
    expect(NAMED.length).toBeGreaterThan(10);
    expect(POPULATIONS_AT_W376.map((r) => r.unit).sort()).toEqual([...NAMED].sort());
    // Evidence that an empty result above is a finding: with nothing declared, every unit reports.
    expect(quarterDefects(ROOT, []).length).toBeGreaterThan(10);
    expect(quarterDefects(ROOT, []).length).toBe(NAMED.length);
    expect(NAMED).toContain("W376");
  });

  it("reports a unit the horizon names that nothing re-reads", () => {
    expect(only("W369", POPULATIONS_AT_W376.filter((r) => r.unit !== "W369"))).toEqual([
      { unit: "W369", what: "is named by the quarter's horizon and nothing re-reads its population" },
    ]);
  });

  it("reports a row for a unit the horizon does not name", () => {
    const orphan: QuarterPopulation[] = [
      { unit: "W999", standing: { kind: "not_a_population", why: "y".repeat(130) } },
    ];
    expect(only("W999", orphan)).toEqual([
      { unit: "W999", what: "is re-read here and the quarter's horizon does not name it" },
    ]);
  });

  it("reports a derivation this tree does not export, so a citation cannot rot into a name", () => {
    const wrong = POPULATIONS_AT_W376.map((r) =>
      r.unit === "W369"
        ? { ...r, standing: { ...(r.standing as { kind: "population" } & object), derivation: "src/gone.ts::gone" } }
        : r,
    ) as QuarterPopulation[];
    expect(only("W369", wrong)).toEqual([
      { unit: "W369", what: "names a derivation this tree does not export: src/gone.ts::gone" },
    ]);
    expect(resolvesInTree(ROOT, "src/quality/empty-populations.ts::emptyRegisters")).toBe(true);
    expect(resolvesInTree(ROOT, "src/quality/empty-populations.ts::neverExported")).toBe(false);
  });

  it("reports a derivation that misses a planted member, which is the narrow half", () => {
    const blind = POPULATIONS_AT_W376.map((r) =>
      r.unit === "W369"
        ? { ...r, standing: { ...(rowFor("W369").standing as object), probe: () => ({ memberSeen: false, nonMemberSeen: false }) } }
        : r,
    ) as QuarterPopulation[];
    expect(only("W369", blind)).toEqual([
      { unit: "W369", what: "misses a planted member of its own population: a register exported with no members" },
    ]);
  });

  it("reports a derivation that takes a planted non-member, which is the wide half", () => {
    const greedy = POPULATIONS_AT_W376.map((r) =>
      r.unit === "W369"
        ? { ...r, standing: { ...(rowFor("W369").standing as object), probe: () => ({ memberSeen: true, nonMemberSeen: true }) } }
        : r,
    ) as QuarterPopulation[];
    expect(only("W369", greedy)).toEqual([
      {
        unit: "W369",
        what: "takes a planted non-member into its population: a register exported with one",
      },
    ]);
  });

  it("reports a unit recorded as not landed whose module has arrived", () => {
    const landed = POPULATIONS_AT_W376.map((r) =>
      r.unit === "W374"
        ? { ...r, standing: { kind: "not_landed" as const, module: "src/quality/empty-populations.ts" } }
        : r,
    );
    expect(only("W374", landed)).toEqual([
      {
        unit: "W374",
        what: "is recorded as not landed and src/quality/empty-populations.ts is in the tree",
      },
    ]);
  });

  it("reports a unit excused from the gate without an argument", () => {
    const bare = POPULATIONS_AT_W376.map((r) =>
      r.unit === "W370" ? { ...r, standing: { kind: "not_a_population" as const, why: "no set" } } : r,
    );
    expect(only("W370", bare)).toEqual([
      { unit: "W370", what: "is excused from the gate without an argument" },
    ]);
  });
});

describe("W376 each reading really is two readings", () => {
  it("runs every derivation both ways, and no probe answers the same twice", () => {
    // THE GATE'S OWN SENTENCE, asserted per row rather than in aggregate: a probe that returns
    // `true, true` or `false, false` has demonstrated nothing, and the pair is what makes it
    // evidence. This is also the non-vacuity of the whole file — if the probes were stubs, every
    // arm above would still pass and nothing would have been run.
    const probed = POPULATIONS_AT_W376.filter((r) => r.standing.kind === "population");
    expect(probed.length, "no unit is probed, so the gate re-reads nothing").toBeGreaterThan(7);
    for (const row of probed) {
      const standing = row.standing as { probe: (root: string) => { memberSeen: boolean; nonMemberSeen: boolean } };
      const reading = standing.probe(ROOT);
      expect(reading.memberSeen, `${row.unit} does not see a member of its own population`).toBe(true);
      expect(reading.nonMemberSeen, `${row.unit} takes a non-member into its population`).toBe(false);
    }
  });

  it("names what was planted on each side, so a reading that flips can be read", () => {
    for (const row of POPULATIONS_AT_W376) {
      if (row.standing.kind !== "population") continue;
      expect(row.standing.member.length, `${row.unit} does not say what belongs`).toBeGreaterThan(15);
      expect(row.standing.nonMember.length, `${row.unit} does not say what does not`).toBeGreaterThan(15);
    }
  });
});

describe("W376 the gate says what it is and what it is not", () => {
  it("uses all three standings, so none is a class nobody reached for", () => {
    expect(new Set(POPULATIONS_AT_W376.map((r) => r.standing.kind))).toEqual(
      new Set(["population", "not_a_population", "not_landed"]),
    );
    // `not_landed` is derived from the tree rather than read off a ledger row that moves while
    // this runs — W351's trap, which W364 walked into anyway.
    const waiting = POPULATIONS_AT_W376.filter((r) => r.standing.kind === "not_landed");
    for (const row of waiting) {
      const module = (row.standing as { module: string }).module;
      expect(existsSync(path.join(ROOT, module)), `${row.unit}'s module has landed`).toBe(false);
    }
  });

  it("names the horizon it re-reads, and the gate that horizon set", () => {
    const document = readFileSync(path.join(ROOT, HORIZON_Q29), "utf8");
    expect(document, "the horizon no longer states the gate this unit re-reads").toContain(
      "including a\nplanted member and excluding a planted non-member",
    );
    expect(document).toContain("W376 re-reads the list");
  });

  it("states what a green gate does not cover", () => {
    expect(QUARTER_GATE_BOUND.length).toBeGreaterThan(600);
    expect(QUARTER_GATE_BOUND).toContain("A READING IS TWO PLANTED FILES, NOT A POPULATION");
    expect(QUARTER_GATE_BOUND).toContain("`not_a_population` IS A JUDGEMENT");
  });
});

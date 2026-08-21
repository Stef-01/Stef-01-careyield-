// W389: "The moments re-read — this quarter's gate → verify: every moment `docs/HORIZON-Q30.md`
// names is derived, and is shown both catching a failure that happens at that moment and staying
// silent about one that happens at another; a moment named and not shown both ways fails."

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  HORIZON_Q30,
  MOMENTS_AT_W389,
  Q30_GATE_BOUND,
  type QuarterMoment,
  quarterDefects,
  resolvesInTree,
  unitsInHorizon,
} from "./horizon-q30-gate";
import { asUnitId } from "./typed-names";

const ROOT = path.resolve(__dirname, "..", "..");

describe("W389 the quarter's moments, re-read against the tree", () => {
  it("passes, over the tree as it stands", () => {
    // THE GATE. Every unit the horizon names is re-read, and every moment row is run both ways.
    expect(quarterDefects(ROOT)).toEqual([]);
  });

  it("reads the population out of the document rather than transcribing it", () => {
    const named = unitsInHorizon(ROOT);
    expect(named.length).toBeGreaterThan(10);
    expect(named).toContain("W378");
    expect(named).toContain("W390");
    // Both directions against the register, so neither list can drift from the other.
    expect(MOMENTS_AT_W389.map((m) => m.unit as string).sort()).toEqual(named);
  });

  it("reports a unit the horizon names and this register does not hold", () => {
    const short = MOMENTS_AT_W389.filter((m) => (m.unit as string) !== "W382");
    expect(quarterDefects(ROOT, short)).toEqual([
      { unit: "W382", what: "is named by the quarter's horizon and nothing re-reads its moment" },
    ]);
  });

  it("reports a unit this register re-reads that the horizon does not name", () => {
    const extra: QuarterMoment = {
      unit: asUnitId("W900"),
      standing: { kind: "not_a_moment", why: "w".repeat(130) },
    };
    expect(quarterDefects(ROOT, [...MOMENTS_AT_W389, extra])).toEqual([
      { unit: "W900", what: "is re-read here and the quarter's horizon does not name it" },
    ]);
  });

  it("reports an excuse with no argument, which is what keeps the class from being a bin", () => {
    const thin = MOMENTS_AT_W389.map((m) =>
      (m.unit as string) === "W383" ? { ...m, standing: { kind: "not_a_moment" as const, why: "short" } } : m,
    );
    expect(quarterDefects(ROOT, thin)).toEqual([
      { unit: "W383", what: "is excused from the gate without an argument" },
    ]);
  });

  it("reports a not-landed row whose module has since arrived", () => {
    const landed = MOMENTS_AT_W389.map((m) =>
      (m.unit as string) === "W390"
        ? { ...m, standing: { kind: "not_landed" as const, module: "src/quality/moments.ts" } }
        : m,
    );
    expect(quarterDefects(ROOT, landed)).toEqual([
      { unit: "W390", what: "is recorded as not landed and src/quality/moments.ts is in the tree" },
    ]);
  });

  it("reports a derivation this tree does not export", () => {
    const gone = MOMENTS_AT_W389.map((m) =>
      m.standing.kind === "moment" && (m.unit as string) === "W379"
        ? { ...m, standing: { ...m.standing, derivation: "src/quality/welded-comparisons.ts::goneAway" } }
        : m,
    );
    expect(quarterDefects(ROOT, gone)).toEqual([
      {
        unit: "W379",
        what: "names a derivation this tree does not export: src/quality/welded-comparisons.ts::goneAway",
      },
    ]);
    // And the resolver really resolves, so the arm above is not passing on a broken helper.
    expect(resolvesInTree(ROOT, "src/quality/welded-comparisons.ts::readsTheLiveLedger")).toBe(true);
    expect(resolvesInTree(ROOT, "src/quality/welded-comparisons.ts::goneAway")).toBe(false);
    expect(resolvesInTree(ROOT, "src/planted/nothing.ts::x")).toBe(false);
  });
});

describe("W389 both halves of the gate's sentence really fire", () => {
  it("reports a check that misses the failure at its own moment", () => {
    // W293's rule at the grain that matters here: the gate above is an empty list, so each half of
    // the sentence is shown reporting on a probe built to fail it.
    const blind = MOMENTS_AT_W389.map((m) =>
      m.standing.kind === "moment" && (m.unit as string) === "W380"
        ? { ...m, standing: { ...m.standing, probe: () => ({ caughtHere: false, caughtElsewhere: false }) } }
        : m,
    );
    expect(quarterDefects(ROOT, blind).map((d) => d.what)).toEqual([
      "misses a failure at the moment it watches: a suite reading a row's STATUS, whose answer a close can turn",
    ]);
  });

  it("reports a check that answers the same at a moment it does not watch", () => {
    // THE HALF THIS QUARTER ADDED. A check reporting everywhere satisfies the first clause and has
    // no moment at all, which is exactly the failure a one-sided gate would call a pass.
    const everywhere = MOMENTS_AT_W389.map((m) =>
      m.standing.kind === "moment" && (m.unit as string) === "W380"
        ? { ...m, standing: { ...m.standing, probe: () => ({ caughtHere: true, caughtElsewhere: true }) } }
        : m,
    );
    expect(quarterDefects(ROOT, everywhere).map((d) => d.what)).toEqual([
      "reports a failure at a moment it does not watch: a suite naming the ledger and reading no status, which a close leaves alone",
    ]);
  });

  it("holds a moment row for most of the quarter rather than excusing its way to green", () => {
    // The cheapest way to pass this gate is to call everything `not_a_moment`. The quarter is
    // mostly moments and the register has to look like that.
    const moments = MOMENTS_AT_W389.filter((m) => m.standing.kind === "moment");
    expect(moments.length).toBeGreaterThan(MOMENTS_AT_W389.length / 2);
    // Every moment row says WHEN in words, which is the thing the quarter set out to write down.
    for (const row of MOMENTS_AT_W389) {
      if (row.standing.kind !== "moment") continue;
      expect(row.standing.when.length, `${row.unit} does not say when it answers`).toBeGreaterThan(40);
      expect(row.standing.here.length, `${row.unit} does not say what it planted`).toBeGreaterThan(30);
      expect(row.standing.elsewhere.length, `${row.unit} does not say what it planted elsewhere`).toBeGreaterThan(30);
    }
  });
});

describe("W389 the bound", () => {
  it("says a planted input is not a moment, which is this gate's sharpest limit", () => {
    expect(Q30_GATE_BOUND).toContain("a MOMENT cannot");
    expect(Q30_GATE_BOUND).toContain("evidence that a derivation");
  });

  it("names the one probe that runs at a real moment rather than claiming they all do", () => {
    expect(Q30_GATE_BOUND).toContain("W380");
  });

  it("is what the document asked for, quoted from the document", () => {
    // The gate's sentence is read out of the horizon rather than restated here, so a document that
    // changed its mind about the gate fails this rather than being quietly outvoted by a register.
    const horizon = readFileSync(path.join(ROOT, HORIZON_Q30), "utf8");
    expect(horizon).toContain("catching a failure at that moment and staying silent about one at another");
    expect(horizon).toContain("W389 re-reads the\nlist");
  });
});

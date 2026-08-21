// W394: "The name conventions a register rests on, enumerated → verify: every register whose
// derivation turns on a NAME — `ROOT`, `COPY`, `eligible`, a `*_AT_W<n>` suffix — carries the
// convention it rests on and what a file spelling it otherwise would cost; one is driven by
// planting the other spelling."

import { describe, expect, it } from "vitest";
import path from "node:path";
import { resolvesInTree } from "./citations";
import {
  CONVENTIONS_AT_W394,
  CONVENTION_BOUND,
  type NameConvention,
  conventionDefects,
  conventionSites,
} from "./name-conventions";

const ROOT = path.resolve(__dirname, "..", "..");

describe("W394 every declared convention resolves, spells itself and states its cost", () => {
  it("passes, over the tree as it stands", () => {
    expect(conventionDefects(ROOT)).toEqual([]);
  });

  it("reports a derivation this tree does not hold", () => {
    const gone: NameConvention[] = [
      { ...CONVENTIONS_AT_W394[1]!, derivation: "src/quality/decision-moments.ts::goneAway" },
    ];
    expect(conventionDefects(ROOT, gone)).toEqual([
      { derivation: "src/quality/decision-moments.ts::goneAway", what: "names something this tree does not hold" },
    ]);
    expect(resolvesInTree(ROOT, "src/quality/shared-state.ts::repositoryWrites")).toBe(true);
    expect(resolvesInTree(ROOT, "src/planted/nothing.ts::x")).toBe(false);
  });

  it("reports a row whose module no longer spells the convention it rests on", () => {
    // THE ARM THAT MATTERS. A derivation rewritten to key on something else leaves this row
    // describing a cost the tree no longer pays, and nothing else in the tree would notice.
    const moved: NameConvention[] = [{ ...CONVENTIONS_AT_W394[0]!, rests: "REPO_ROOT_CONSTANT" }];
    expect(conventionDefects(ROOT, moved)).toEqual([
      {
        derivation: "src/quality/shared-state.ts::repositoryWrites",
        what: "is recorded as resting on REPO_ROOT_CONSTANT and no longer spells it",
      },
    ]);
  });

  it("reports a convention recorded without a cost", () => {
    const thin: NameConvention[] = [{ ...CONVENTIONS_AT_W394[0]!, costs: "short" }];
    expect(conventionDefects(ROOT, thin).map((d) => d.what)).toContain(
      "rests on a convention and does not say what it costs",
    );
  });

  it("reports an admission the quoted module does not make", () => {
    const invented: NameConvention[] = [
      { ...CONVENTIONS_AT_W394[1]!, cost: { kind: "admitted", quote: "a sentence nobody in this tree wrote down" } },
    ];
    expect(conventionDefects(ROOT, invented)).toEqual([
      { derivation: "src/quality/decision-moments.ts::decisions", what: "quotes an admission its module does not make" },
    ]);
  });
});

describe("W394 the cost of the other spelling, planted rather than argued", () => {
  it("shows the repository-write scan seeing ROOT and missing the same write named otherwise", () => {
    // THE ONE MEASURED ROW, and both halves are the measurement. Two planted suites write the SAME
    // repository path and clash; renaming their root constant changes nothing about where they
    // write and everything about whether W385 can see it. A probe that only showed the miss would
    // be consistent with a scan that finds nothing at all.
    const row = CONVENTIONS_AT_W394.find((c) => c.rests === "ROOT")!;
    expect(row.cost.kind).toBe("measured");
    if (row.cost.kind !== "measured") throw new Error("the ROOT row stopped being measured");
    const missed = row.cost.probe(ROOT);
    expect(missed.sawTheConvention, "the scan cannot see its own convention").toBe(true);
    expect(missed.sawTheOtherSpelling, "the scan sees the other spelling, so there is no cost").toBe(false);
  });

  it("reports a probe whose derivation has learned the other spelling", () => {
    // The direction that fires when somebody FIXES one of these. A cost recorded as still being
    // paid, on a derivation that has stopped paying it, is the stale half of every register here.
    const fixed: NameConvention[] = [
      {
        ...CONVENTIONS_AT_W394[0]!,
        cost: { kind: "measured", probe: () => ({ sawTheConvention: true, sawTheOtherSpelling: true }) },
      },
    ];
    expect(conventionDefects(ROOT, fixed)).toEqual([
      {
        derivation: "src/quality/shared-state.ts::repositoryWrites",
        what: "is recorded as missing the other spelling and finds it",
      },
    ]);
    // And a probe that cannot see the convention at all is reported rather than read as a cost.
    const blind: NameConvention[] = [
      {
        ...CONVENTIONS_AT_W394[0]!,
        cost: { kind: "measured", probe: () => ({ sawTheConvention: false, sawTheOtherSpelling: false }) },
      },
    ];
    expect(conventionDefects(ROOT, blind).map((d) => d.what)).toEqual([
      "cannot see its own convention, so the probe proves nothing",
    ]);
  });
});

describe("W394 the second direction: another register resting on the same habit", () => {
  it("finds the module this register names, and is not the whole tree", () => {
    const keyedToRoot = conventionSites(ROOT, "ROOT");
    expect(keyedToRoot).toContain("src/quality/shared-state.ts");
    // Narrower than the tree, which is what makes it a derivation rather than a file listing.
    expect(keyedToRoot.length).toBeLessThan(40);
    // And it really discriminates: a name nothing keys on comes back empty.
    expect(conventionSites(ROOT, "NO_REGISTER_KEYS_ON_THIS")).toEqual([]);
  });
});

describe("W394 the bound", () => {
  it("says the population is hand-read, and why deriving it is the problem again", () => {
    expect(CONVENTION_BOUND).toContain("THE POPULATION IS HAND-READ");
    expect(CONVENTION_BOUND).toContain("the problem itself in another form");
  });

  it("says most costs are argued rather than measured, and counts honestly", () => {
    expect(CONVENTION_BOUND).toContain("A COST IS MOSTLY ARGUED");
    const measured = CONVENTIONS_AT_W394.filter((c) => c.cost.kind === "measured");
    expect(measured).toHaveLength(1);
    expect(CONVENTIONS_AT_W394.length).toBeGreaterThan(measured.length);
  });

  it("says the costs do not all run the same way", () => {
    expect(CONVENTION_BOUND).toContain("MANUFACTURES");
  });
});

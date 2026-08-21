import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  MARKERS,
  blindMarkers,
  censusDefects,
  drivenDefects,
  reachableBlindness,
  untriedMarkers,
  SPELLING_BOUND,
  type Marker,
} from "./spelling-markers";
import { SCAN_SITES } from "./scan-text";
import { privateCopies } from "./private-copies";
import { copyTree, withPlantedIn } from "./planting";

const ROOT = path.resolve(__dirname, "..", "..");

describe("W366 the text-scanning registers, against a second spelling of their own subject", () => {
  it("covers every scan site, and names no module that has stopped scanning", () => {
    expect(censusDefects()).toEqual([]);
    // W293: the check has a population. Both directions really do fire.
    expect(MARKERS.length).toBe(SCAN_SITES.length);
    expect(censusDefects(MARKERS.slice(1))).toHaveLength(1);
    expect(
      censusDefects([...MARKERS, { module: "src/quality/gone.ts" } as Marker]),
    ).toHaveLength(1);
  });

  it("agrees with what the registers actually do, in both directions", () => {
    // The whole unit. Every driven row plants a control and a variant and is checked against both.
    expect(drivenDefects(ROOT)).toEqual([]);
  });

  it("argues every untried row rather than leaving it blank", () => {
    for (const marker of MARKERS) {
      if (marker.standing.kind !== "untried") continue;
      expect(marker.standing.why.length, `${marker.module} is untried and unargued`).toBeGreaterThan(150);
    }
  });

  it("names the markers nobody has tried a second spelling against", () => {
    // W290: a NAMED list moves deliberately, a count moves by accident. Adding a scan site without
    // trying a spelling against it has to appear here, by name, in a diff somebody reads.
    expect(untriedMarkers()).toEqual([
      "src/compliance/composed-copy.ts",
      "src/quality/self-ending.ts",
      "src/quality/self-reference.ts",
      "src/quality/shared-excuses.ts",
      "src/quality/tautology-sweep.ts",
    ]);
  });

  it("names the markers a second spelling gets past", () => {
    expect(blindMarkers()).toEqual([
      "src/console/rendered-zeros.ts",
      "src/quality/acceptances.ts",
      "src/quality/cited-checks.ts",
      "src/quality/decision-moments.ts",
      "src/quality/declaration-tax.ts",
      "src/quality/derivable-lists.ts",
      "src/quality/exemption-reach.ts",
      "src/quality/hook-reach.ts",
      "src/quality/import-cycles.ts",
      "src/quality/moments.ts",
      "src/quality/mutation-sampling.ts",
      "src/quality/name-conventions.ts",
      "src/quality/order-independence.ts",
      "src/quality/patterns.ts",
      "src/quality/private-copies.ts",
      "src/quality/run-residue.ts",
      "src/quality/runtime-population.ts",
      "src/quality/shared-state.ts",
      "src/quality/typed-names.ts",
    ]);
    // The distinction the unit turns on: some of those are spellings the formatter rewrites before
    // they could reach a commit, and the rest are ordinary code. W375 added the plainest of the
    // second kind — `rm` from `fs/promises` is what the rest of Node has moved to.
    expect(reachableBlindness()).toEqual([
      "src/console/rendered-zeros.ts",
      "src/quality/cited-checks.ts",
      "src/quality/decision-moments.ts",
      "src/quality/declaration-tax.ts",
      "src/quality/derivable-lists.ts",
      "src/quality/exemption-reach.ts",
      "src/quality/hook-reach.ts",
      "src/quality/import-cycles.ts",
      "src/quality/moments.ts",
      "src/quality/mutation-sampling.ts",
      "src/quality/name-conventions.ts",
      "src/quality/order-independence.ts",
      "src/quality/patterns.ts",
      "src/quality/private-copies.ts",
      "src/quality/run-residue.ts",
      "src/quality/runtime-population.ts",
      "src/quality/shared-state.ts",
    ]);
  });
});

describe("W366 the case: W360's ledger parse, driven", () => {
  it("finds the parse spelled with a regex and misses it spelled with startsWith", () => {
    // W344 wrote this copy and `privateCopies` — built one quarter earlier, for exactly this — did
    // not report it. W360 found it by hand and fixed the COPY; the marker is unchanged, so this is
    // what the register does today, measured rather than argued.
    const copy = copyTree(ROOT);
    const F = "src/quality/spelling-probe.ts";
    const saw = (body: string) =>
      withPlantedIn(copy, { [F]: body }, () => privateCopies(copy).some((c) => c.file === F));

    const canonical = saw('const ledger = "BUILD-STATE.md";\nconst row = /^\\|/;\nexport const parse = [ledger, row];\n');
    const variant = saw('const ledger = "BUILD-STATE.md";\nexport function rows(line: string) {\n  return line.startsWith("|");\n}\n');

    expect(canonical, "the control does not fire, so the miss below measures nothing").toBe(true);
    expect(variant, "the register has been widened and this row is stale").toBe(false);
  });

  it("is the row this register declares, so the finding cannot drift from the measurement", () => {
    const row = MARKERS.find((m) => m.module === "src/quality/private-copies.ts");
    expect(row?.standing.kind).toBe("blind");
    expect(row?.standing.kind === "blind" && row.standing.plausibility).toBe("happened");
    // `happened` is the one plausibility that is checkable, and only this row carries it.
    expect(
      MARKERS.filter((m) => m.standing.kind === "blind" && m.standing.plausibility === "happened"),
    ).toHaveLength(1);
  });
});

describe("W366 the rule, driven", () => {
  it("reports a control that does not fire, because a reading without one measures nothing", () => {
    const row: Marker = {
      module: "src/quality/private-copies.ts",
      matches: "x",
      standing: {
        kind: "blind",
        looksLike: "y",
        plausibility: "idiomatic",
        probe: () => ({ control: false, variant: false }),
      },
    };
    expect(drivenDefects(ROOT, [row])[0]?.what).toContain("control plant is not found");
  });

  it("reports a `caught` row whose variant is missed", () => {
    const row: Marker = {
      module: "src/quality/x.ts",
      matches: "x",
      standing: { kind: "caught", looksLike: "y", probe: () => ({ control: true, variant: false }) },
    };
    expect(drivenDefects(ROOT, [row])[0]?.what).toContain("second spelling is missed");
  });

  it("reports a `blind` row the tree has outgrown, which is the other direction", () => {
    const row: Marker = {
      module: "src/quality/x.ts",
      matches: "x",
      standing: {
        kind: "blind",
        looksLike: "y",
        plausibility: "idiomatic",
        probe: () => ({ control: true, variant: true }),
      },
    };
    expect(drivenDefects(ROOT, [row])[0]?.what).toContain("marker has been widened");
  });

  it("leaves an untried row undriven rather than guessing at it", () => {
    const row: Marker = {
      module: "src/quality/x.ts",
      matches: "x",
      standing: { kind: "untried", why: "y" },
    };
    expect(drivenDefects(ROOT, [row])).toEqual([]);
  });
});

describe("W366 the bound", () => {
  it("says the variant is one spelling and not every spelling", () => {
    expect(SPELLING_BOUND).toContain("ONE SPELLING, NOT EVERY SPELLING");
    expect(SPELLING_BOUND).toContain("generator over spellings");
  });

  it("says which of its three judgements is not derived", () => {
    expect(SPELLING_BOUND).toContain("`plausibility` IS A JUDGEMENT");
    expect(SPELLING_BOUND).toContain("formatter's configuration");
  });
});

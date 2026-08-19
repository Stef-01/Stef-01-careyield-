import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  EXEMPTIONS,
  REACH_BOUND,
  appliedExemptions,
  reachCensusDefects,
  reachDefects,
  coarserThanItsSubject,
  untriedExemptions,
  widerThanTheirKey,
  type Exemption,
} from "./exemption-reach";
import { copyTree, withPlantedIn } from "./planting";
import { presenceDefects } from "./assertion-vocabulary";
import { planterDiff } from "./planting";

const ROOT = path.resolve(__dirname, "..", "..");

describe("W368 the exemptions this tree applies, and how far each reaches", () => {
  it("covers every applied exemption, and names none the tree has stopped applying", () => {
    expect(reachCensusDefects(ROOT)).toEqual([]);
    // W293: both directions really do fire, on the same producer.
    expect(reachCensusDefects(ROOT, EXEMPTIONS.slice(1))).toHaveLength(1);
    expect(
      reachCensusDefects(ROOT, [
        ...EXEMPTIONS,
        { module: "src/quality/gone.ts", map: "GONE" } as Exemption,
      ]),
    ).toHaveLength(1);
  });

  it("derives the population from the tree rather than listing it", () => {
    const applied = appliedExemptions(ROOT);
    expect(applied).toContain("src/quality/planting.ts::WRITES_WITHOUT_A_PLANTER");
    expect(applied.length).toBe(EXEMPTIONS.length);
    // The scan notices one arriving: the idiom is a detector's defaulted parameter, and a module
    // that grows one joins the population without anybody remembering to add it here.
    const copy = copyTree(ROOT);
    const grown = withPlantedIn(
      copy,
      {
        "src/quality/reach-probe.ts":
          "export const PLANTED_EXCUSE: Readonly<Record<string, string>> = {};\n" +
          "export function check(\n  root: string,\n" +
          "  excused: Readonly<Record<string, string>> = PLANTED_EXCUSE,\n" +
          "): string[] {\n  return [root, ...Object.keys(excused)];\n}\n",
      },
      () => appliedExemptions(copy),
    );
    expect(grown).toContain("src/quality/reach-probe.ts::PLANTED_EXCUSE");
  });

  it("reads a register name with DIGITS in it, which the first draft did not", () => {
    // W368's own mutation check, and the bug it found first: the scan spelled the register name
    // `[A-Z][A-Z_]*`, so `W295_EXCUSED` — the control this register's blind-spot probe plants —
    // never matched and the probe reported that nothing had been demonstrated. A population scan
    // that misses a name for how the name is written is W366's subject, arriving here.
    const copy = copyTree(ROOT);
    const seen = withPlantedIn(
      copy,
      {
        "src/quality/reach-probe.ts":
          "export const W295_EXCUSED: Readonly<Record<string, string>> = {};\n" +
          "export function check(\n  root: string,\n" +
          "  excused: Readonly<Record<string, string>> = W295_EXCUSED,\n" +
          "): string[] {\n  return [root, ...Object.keys(excused)];\n}\n",
      },
      () => appliedExemptions(copy),
    );
    expect(seen).toContain("src/quality/reach-probe.ts::W295_EXCUSED");
  });

  it("agrees with what the detectors actually do, in both directions", () => {
    // The whole unit. Every driven row plants a pair and is checked against both readings.
    expect(reachDefects(ROOT)).toEqual([]);
  });

  it("argues every untried row rather than leaving it blank", () => {
    for (const exemption of EXEMPTIONS) {
      if (exemption.reach.kind !== "untried") continue;
      expect(
        exemption.reach.why.length,
        `${exemption.map} is untried and unargued`,
      ).toBeGreaterThan(150);
    }
  });

  it("names the exemptions that silence more than they name", () => {
    // W290: a NAMED list, because a count moves by accident.
    expect(widerThanTheirKey()).toEqual([
      "src/quality/assertion-vocabulary.ts::NOT_A_COLLECTION",
      "src/quality/citations.ts::SEPARATOR_NOT_A_CITATION",
      "src/quality/planting.ts::WRITES_WITHOUT_A_PLANTER",
    ]);
    expect(untriedExemptions()).toEqual([
      "src/quality/page-suite.ts::EXCLUDED_SPECS",
      "src/quality/pins.ts::DUPLICATE_PINS",
      "src/quality/review-w279.ts::FALLIBLE_READS",
      "src/quality/self-ending.ts::DECLARED_PROSE_WAITS",
      "src/quality/self-ending.ts::WAIT_FIXTURES",
    ]);
  });
});

describe("W368 the case: W360's file-wide presence exemption, driven", () => {
  it("silences the claim its key names and leaves the one beside it reported", () => {
    // W360's finding, re-driven rather than taken on trust. The key is `file :: subject`; before
    // that unit only the file half survived the parse, so an excuse naming ONE Map silenced every
    // non-canonical presence claim in the file. Two claims about different subjects are planted
    // here and only the named one goes quiet — which is the fix, measured.
    const copy = copyTree(ROOT);
    const F = "src/quality/reach-probe.test.ts";
    const sites = withPlantedIn(
      copy,
      {
        [F]:
          'import { describe, expect, it } from "vitest";\n' +
          'describe("probe", () => {\n' +
          '  it("named", () => {\n    expect(alpha.has(1)).toBe(true);\n  });\n' +
          '  it("sibling", () => {\n    expect(beta.has(2)).toBe(true);\n  });\n' +
          "});\n" +
          "declare const alpha: Set<number>;\ndeclare const beta: Set<number>;\n",
      },
      () =>
        presenceDefects(copy, "toContain", { [`${F} :: alpha`]: "the probe's named site" })
          .map((d) => d.site)
          .filter((s) => s.includes("reach-probe")),
    );
    expect(sites, "the sibling was silenced too, so the key's second half is being dropped again").toEqual([
      `${F} :: sibling`,
    ]);
  });

  it("is the row this register declares, so the finding cannot drift from the measurement", () => {
    const row = EXEMPTIONS.find((e) => e.map === "NOT_A_MEMBERSHIP");
    expect(row?.reach.kind).toBe("exact");
    // And it is the ONLY exact row: the other four driven rows are wider, which is why the class
    // was worth sweeping after W360 fixed the instance.
    expect(EXEMPTIONS.filter((e) => e.reach.kind === "exact")).toHaveLength(1);
  });
});

describe("W368 the coarse-grain probe, driven both ways", () => {
  // W368's own mutation check found this: the helper's two readings were never discriminated, so a
  // version returning constants passed the whole suite. A probe nothing can contradict is the
  // excuse W356 is about, arriving in the machinery instead of in a reason string.
  const WRITES =
    'import { writeFileSync } from "node:fs";\n' +
    'export const named = () => writeFileSync("a", "b");\n' +
    'export const sibling = () => writeFileSync("c", "d");\n';

  it("reads `sibling` false when the detector CAN tell two instances apart", () => {
    // The same helper, pointed at a site-grained detector: two claims in one file come back as two
    // entries, so nothing inherits and the reading says so. This is the arm the file-grained rows
    // cannot produce, and without it `sibling` was a constant.
    const F = "src/quality/reach-probe.test.ts";
    const reading = coarserThanItsSubject(
      ROOT,
      {
        [F]:
          'import { describe, expect, it } from "vitest";\n' +
          'describe("probe", () => {\n' +
          '  it("named", () => {\n    expect(alpha.has(1)).toBe(true);\n  });\n' +
          '  it("sibling", () => {\n    expect(beta.has(2)).toBe(true);\n  });\n' +
          "});\n" +
          "declare const alpha: Set<number>;\ndeclare const beta: Set<number>;\n",
      },
      (copy) => presenceDefects(copy, "toContain", {}).map((d) => d.site),
      F,
    );
    expect(reading.sibling, "two separately reportable claims read as one inherited").toBe(false);
  });

  it("reads `named` false when the exemption does not apply", () => {
    // The control arm. A detector that never consults the exemption leaves the planted site
    // reported, so `named` is derived from the run rather than assumed by the helper.
    const reading = coarserThanItsSubject(
      ROOT,
      { "src/quality/reach-probe.ts": WRITES },
      // The exemption is DROPPED on the way in, which is what a detector that ignores its own
      // excuse register looks like from outside.
      (copy) => planterDiff(copy, {}).undeclared,
      "src/quality/reach-probe.ts",
    );
    expect(reading.named, "an exemption for another file silenced the planted one").toBe(false);
  });
});

describe("W368 the rule, driven", () => {
  const row = (reach: Exemption["reach"]): Exemption => ({
    module: "src/quality/x.ts",
    map: "X",
    detector: "src/quality/x.ts::check",
    key: "k",
    subject: "s",
    reach,
  });

  it("reports an exemption that did not apply, because a reading without a control measures nothing", () => {
    const defects = reachDefects(ROOT, [
      row({ kind: "exact", probe: () => ({ named: false, sibling: false }) }),
    ]);
    expect(defects[0]?.what).toContain("did not apply");
  });

  it("reports an `exact` row whose sibling is silenced too", () => {
    const defects = reachDefects(ROOT, [
      row({ kind: "exact", probe: () => ({ named: true, sibling: true }) }),
    ]);
    expect(defects[0]?.what).toContain("sibling under the same key is silenced too");
  });

  it("reports a `wider` row the tree has narrowed, which is the other direction", () => {
    const defects = reachDefects(ROOT, [
      row({ kind: "wider", inherits: "y", probe: () => ({ named: true, sibling: false }) }),
    ]);
    expect(defects[0]?.what).toContain("reach has been narrowed");
  });

  it("leaves an untried row undriven rather than guessing at it", () => {
    expect(reachDefects(ROOT, [row({ kind: "untried", why: "y" })])).toEqual([]);
  });
});

describe("W368 the bound", () => {
  it("says the population is one idiom and not every exemption", () => {
    expect(REACH_BOUND).toContain("ONE IDIOM, NOT EVERY EXEMPTION");
  });

  it("says `wider` is measured on one pair, and says how far it does not reach", () => {
    expect(REACH_BOUND).toContain("MEASURED " + "ON ONE PAIR");
    expect(REACH_BOUND).toContain("says nothing about how far");
  });

  it("refuses to read `wider` as `wrong`, which is the limit that matters", () => {
    expect(REACH_BOUND).toContain("`wider` IS NOT `WRONG`");
    expect(REACH_BOUND).toContain("the reach being invisible");
  });
});

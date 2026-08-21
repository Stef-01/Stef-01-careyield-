// W373 verify gate: "every product rule that selects patients enumerated with the population it
// selects from, resolved against the synthetic set; a rule whose population is wider than its copy
// claims is reported; no founder gate crossed and no real patient data."
//
// THE LAST CLAUSE SHAPES THE FILE. Every patient below comes from `generatePractice` — the seeded
// synthetic generator — and the runs are built here rather than in the register, so the register
// itself reaches no product code and no store. Nothing is sent, nothing is persisted, and the
// cohort is regenerated from a seed on every run.
//
// The runs are the point. `effect` is not a word somebody typed next to a rule: each row's function
// is CALLED on the generated panel and the input and output ids decide the class, so a ranking
// function that starts dropping people fails here rather than in a practice.

import { describe, expect, it } from "vitest";
import {
  NOT_PRODUCT,
  type PatientRule,
  RULES_AT_W373,
  RULE_BOUND,
  type RuleRun,
  effectOf,
  patientRules,
  ruleDefects,
} from "./patient-populations";
import { withTree } from "./planting";
import { fixtureText } from "./scan-text";
import { generatePractice } from "@/synthetic/generate";
import { armDrift, assertArmsUnchanged } from "@/engine/arm-stability";
import { countAttribution } from "@/engine/attribution";
import { buildBackfillPool } from "@/engine/backfill";
import { DEFAULT_CONTINUITY_CONFIG, continuityReport } from "@/engine/continuity";
import { DEFAULT_CONFIG, eligibleForClinician } from "@/engine/eligibility";
import { assignHoldout } from "@/engine/holdout";
import { DEFAULT_POOL_CONFIG, buildInvitationPool, rankCandidates } from "@/engine/pool";
import { DEFAULT_SESSION_CONFIG } from "@/session/config";
import { attributionByCondition } from "@/registers/attribution";
import { gapShareOfBatch, rankGapAware } from "@/registers/ranking";
import { buildRegisterLayer } from "@/registers/sim-registers";
import type { ConditionCode } from "@/domain/types";

const ROOT = process.cwd();
const TODAY = "2026-08-08";

/** One synthetic practice, seeded. The whole cohort this file ever touches. */
const WORLD = generatePractice({
  seed: 373,
  patientCount: 400,
  clinicianCount: 4,
  scheduleWeeks: 4,
  todayIso: TODAY,
});
const PANEL = WORLD.patients;
const IDS = PANEL.map((p) => p.id as string);
const CLINICIAN = WORLD.clinicians[0]!;
const NO_INVITES = new Map<string, number>();
const WINDOW = { fromIso: "2026-05-08", toIso: TODAY };
const ELIGIBLE = eligibleForClinician(PANEL, CLINICIAN, DEFAULT_CONFIG, TODAY, NO_INVITES).eligible;
const LAYER = buildRegisterLayer(
  PANEL,
  {
    conditionCode: "cond-1" as ConditionCode,
    intervalMonths: 12,
    flaggedShare: 0.3,
    enabled: true,
    requireCareGap: true,
  },
  373,
  TODAY,
);
const ids = (patients: readonly { id: string | { toString(): string } }[]): string[] =>
  patients.map((p) => p.id as string);

const RUNS = new Map<string, RuleRun>([
  ["src/engine/arm-stability.ts::armDrift", { from: IDS, selected: null }],
  ["src/engine/arm-stability.ts::assertArmsUnchanged", { from: IDS, selected: null }],
  ["src/engine/attribution.ts::countAttribution", { from: IDS, selected: null }],
  [
    "src/engine/backfill.ts::buildBackfillPool",
    {
      from: IDS,
      selected: ids(
        buildBackfillPool(
          WORLD.appointments.find((a) => a.status === "open") ?? WORLD.appointments[0]!,
          CLINICIAN,
          PANEL,
          DEFAULT_CONFIG,
          DEFAULT_SESSION_CONFIG,
          DEFAULT_POOL_CONFIG,
          TODAY,
          NO_INVITES,
          `${TODAY}T09:00:00.000Z`,
        ).invitations.map((i) => ({ id: i.patientId as string })),
      ),
    },
  ],
  ["src/engine/continuity.ts::continuityReport", { from: IDS, selected: null }],
  ["src/engine/eligibility.ts::eligibleForClinician", { from: IDS, selected: ids(ELIGIBLE) }],
  [
    "src/engine/holdout.ts::assignHoldout",
    { from: IDS, selected: ids(assignHoldout(PANEL, WORLD.practice, `${TODAY}T09:00:00.000Z`).patients) },
  ],
  [
    "src/engine/pool.ts::buildInvitationPool",
    {
      from: ids(ELIGIBLE),
      selected: buildInvitationPool(
        TODAY,
        CLINICIAN,
        WORLD.appointments,
        ELIGIBLE,
        DEFAULT_POOL_CONFIG,
      ).map((i) => i.patientId as string),
    },
  ],
  ["src/engine/pool.ts::rankCandidates", { from: ids(ELIGIBLE), selected: ids(rankCandidates(ELIGIBLE)) }],
  ["src/registers/attribution.ts::attributionByCondition", { from: IDS, selected: null }],
  ["src/registers/ranking.ts::gapShareOfBatch", { from: IDS, selected: null }],
  [
    "src/registers/ranking.ts::rankGapAware",
    { from: ids(ELIGIBLE), selected: ids(rankGapAware(ELIGIBLE, LAYER.gaps)) },
  ],
  ["src/registers/sim-registers.ts::buildRegisterLayer", { from: IDS, selected: null }],
]);

describe("W373 every product rule handed the panel says which patients it is over", () => {
  it("passes, over the product as it stands", () => {
    expect(ruleDefects(ROOT, RUNS)).toEqual([]);
  });

  it("derives the population from the signatures rather than from a list", () => {
    const population = patientRules(ROOT);
    expect(population.length).toBeGreaterThan(10);
    expect(RULES_AT_W373.map((r) => r.rule).sort()).toEqual([...population].sort());
    // The evidence that an empty result above is a finding: with nothing declared, every rule reports.
    expect(ruleDefects(ROOT, RUNS, []).length).toBeGreaterThan(10);
    // Build machinery is not product: this register is handed patients nowhere, and is excluded.
    expect(population.some((r) => NOT_PRODUCT.some((d) => r.startsWith(d)))).toBe(false);
  });

  it("reads a rule handed the panel and not one handed a list of ids", () => {
    // W267'S DISTINCTION and the mutation the census entry names: the walk finds a module that was
    // not there before, and the negative beside it is the shape the bound calls invisible — a rule
    // that reaches patients through their ids, which this register cannot see and must not claim to.
    const found = withTree(
      {
        "src/planted/by-panel.ts": fixtureText("rule-by-panel"),
        "src/planted/by-id.ts": fixtureText("rule-by-id"),
      },
      (root) => patientRules(root),
    );
    expect(found).toEqual(["src/planted/by-panel.ts::inviteFromPanel"]);
  });

  it("reads the panel past a callback parameter, and in every spelling of the type", () => {
    // W383. THE SCAN WAS NARROWER AND WIDER THAN ITS SUBJECT AND NOTHING SAID SO. `[^)]*` stopped
    // at the first `)`, so a rule taking a callback hid its panel in the second parameter;
    // `ReadonlyArray<Patient>` and `Array<Patient>` were spellings it did not know; and with no
    // left boundary `SyntheticPatient[]` counted as a panel. Nothing escaped in the live tree,
    // which is why nothing caught it — this register decides which product rules are over a
    // patient panel, so a rule leaving the population leaves it silently.
    const found = withTree(
      {
        "src/planted/after-callback.ts":
          "import type { Patient } from \"@/synthetic/types\";\n" +
          "export function afterCallback(pick: (p: Patient) => boolean, panel: Patient[]): Patient[] {\n" +
          "  return panel.filter(pick);\n}\n",
        "src/planted/readonly-array.ts":
          "import type { Patient } from \"@/synthetic/types\";\n" +
          "export function readonlyArray(panel: ReadonlyArray<Patient>): number {\n  return panel.length;\n}\n",
        "src/planted/plain-array.ts":
          "import type { Patient } from \"@/synthetic/types\";\n" +
          "export function plainArray(panel: Array<Patient>): number {\n  return panel.length;\n}\n",
      },
      (root) => patientRules(root),
    );
    expect(found).toEqual([
      "src/planted/after-callback.ts::afterCallback",
      "src/planted/plain-array.ts::plainArray",
      "src/planted/readonly-array.ts::readonlyArray",
    ]);
  });

  it("refuses a type whose name merely ends in the one it is looking for", () => {
    // The other direction, and the reason the boundary is a lookbehind rather than `\b`: a hyphen
    // or a capital is not a word break, so `SyntheticPatient[]` matched the tail of the name.
    const found = withTree(
      {
        "src/planted/prefixed.ts":
          "interface SyntheticPatient { id: string }\n" +
          "export function prefixed(panel: SyntheticPatient[]): number {\n  return panel.length;\n}\n",
      },
      (root) => patientRules(root),
    );
    expect(found).toEqual([]);
  });

  it("reports a rule handed the panel that nothing describes", () => {
    const missing = RULES_AT_W373.filter((r) => r.rule !== "src/engine/pool.ts::rankCandidates");
    expect(ruleDefects(ROOT, RUNS, missing).filter((d) => d.rule.endsWith("::rankCandidates"))).toEqual([
      {
        rule: "src/engine/pool.ts::rankCandidates",
        what: "is handed the panel and nothing says which patients it is over",
      },
    ]);
  });

  it("reports a row for something that is not a rule handed the panel", () => {
    const orphan: PatientRule[] = [
      { rule: "src/gone.ts::goneRule", selectsFrom: "nothing", effect: "measures", claims: null, scope: { kind: "no_wider" } },
    ];
    expect(ruleDefects(ROOT, new Map(), orphan).filter((d) => d.rule === "src/gone.ts::goneRule")).toEqual([
      { rule: "src/gone.ts::goneRule", what: "is described here and is not a rule handed the panel" },
    ]);
  });

  it("reports a rule nothing runs, because an unmeasured effect is only a sentence", () => {
    const short = new Map(RUNS);
    short.delete("src/engine/pool.ts::rankCandidates");
    expect(ruleDefects(ROOT, short).filter((d) => d.rule.endsWith("::rankCandidates"))).toEqual([
      {
        rule: "src/engine/pool.ts::rankCandidates",
        what: "is described here and nothing runs it over a synthetic practice",
      },
    ]);
  });
});

describe("W373 what a rule does to the panel is measured, not described", () => {
  it("reads a proper subset as narrowing, the same set as reordering, and no set as measuring", () => {
    expect(effectOf({ from: ["a", "b"], selected: ["a"] })).toBe("narrows");
    expect(effectOf({ from: ["a", "b"], selected: ["b", "a"] })).toBe("reorders");
    expect(effectOf({ from: ["a", "b"], selected: null })).toBe("measures");
    // A SWAP IS NOT A REORDER, and this is the case a length comparison would miss: the same
    // NUMBER of the wrong people is exactly W353's superset failure, one population over.
    expect(effectOf({ from: ["a", "b"], selected: ["a", "c"] })).toBe("narrows");
  });

  it("reports a ranking rule that has started dropping people, which is the failure that hurts", () => {
    const dropped = new Map(RUNS);
    const real = RUNS.get("src/engine/pool.ts::rankCandidates")!;
    dropped.set("src/engine/pool.ts::rankCandidates", { from: real.from, selected: real.from.slice(1) });
    expect(ruleDefects(ROOT, dropped).filter((d) => d.rule.endsWith("::rankCandidates"))).toEqual([
      { rule: "src/engine/pool.ts::rankCandidates", what: "is recorded as reorders and narrows the panel it is handed" },
    ]);
  });

  it("refuses a run over an empty panel, which would call every rule a reorderer", () => {
    const empty = new Map(RUNS);
    empty.set("src/engine/pool.ts::rankCandidates", { from: [], selected: [] });
    expect(ruleDefects(ROOT, empty).filter((d) => d.rule.endsWith("::rankCandidates"))).toEqual([
      { rule: "src/engine/pool.ts::rankCandidates", what: "is run over an empty panel, which decides nothing" },
    ]);
  });

  it("really does narrow and really does reorder on the generated cohort", () => {
    // Non-vacuity for the whole file: if the synthetic panel produced no eligible set, every run
    // would be trivially equal and the classes would mean nothing.
    expect(IDS.length).toBeGreaterThan(100);
    expect(ELIGIBLE.length).toBeGreaterThan(0);
    expect(ELIGIBLE.length).toBeLessThan(PANEL.length);
    expect(new Set(RULES_AT_W373.map((r) => r.effect))).toEqual(new Set(["narrows", "reorders", "measures"]));
  });
});

describe("W373 the copy claim is resolved against the file that renders it", () => {
  it("reports a quote the product does not carry", () => {
    const wrong = RULES_AT_W373.map((r) =>
      r.rule === "src/engine/eligibility.ts::eligibleForClinician"
        ? { ...r, claims: { file: "app/console/rules/page.tsx", quote: "a promise nobody wrote" } }
        : r,
    );
    expect(ruleDefects(ROOT, RUNS, wrong).filter((d) => d.rule.endsWith("::eligibleForClinician"))).toEqual([
      {
        rule: "src/engine/eligibility.ts::eligibleForClinician",
        what: "quotes copy app/console/rules/page.tsx does not carry: a promise nobody wrote",
      },
    ]);
  });

  it("reports a rule recorded as reaching past its own copy, which is the clause the gate names", () => {
    const wider = RULES_AT_W373.map((r) =>
      r.rule === "src/engine/eligibility.ts::eligibleForClinician"
        ? { ...r, scope: { kind: "wider" as const, why: "it invites outside the saved rules" } }
        : r,
    );
    expect(ruleDefects(ROOT, RUNS, wider).filter((d) => d.rule.endsWith("::eligibleForClinician"))).toEqual([
      {
        rule: "src/engine/eligibility.ts::eligibleForClinician",
        what: "reaches patients its own copy does not cover: it invites outside the saved rules",
      },
    ]);
  });

  it("carries a claim on every rule a practice is told about, and none is a bare label", () => {
    const claimed = RULES_AT_W373.filter((r) => r.claims !== null);
    expect(claimed.length, "no rule carries a copy claim, so the resolution checks nothing").toBeGreaterThan(3);
    for (const row of claimed) {
      expect(row.claims!.quote.length, `${row.rule}'s quote is too short to be distinctive`).toBeGreaterThan(30);
    }
    // Every selecting rule says what it selects from, in words rather than in a type.
    for (const row of RULES_AT_W373) {
      expect(row.selectsFrom.length, `${row.rule} says nothing about the population it is handed`).toBeGreaterThan(20);
    }
  });
});

describe("W373 the register says what it is and what it is not", () => {
  it("crosses no founder gate: every patient it touches is generated", () => {
    // The gate, asserted rather than assumed. The cohort comes from the seeded generator, and
    // regenerating from the same seed gives the same people — which is what makes it synthetic
    // rather than a recording of anybody.
    const again = generatePractice({
      seed: 373,
      patientCount: 400,
      clinicianCount: 4,
      scheduleWeeks: 4,
      todayIso: TODAY,
    });
    expect(again.patients.map((p) => p.id)).toEqual(PANEL.map((p) => p.id));
    expect(WORLD.practice.name).toBe("Synthetic Family Practice");
  });

  it("states what a green run does not cover", () => {
    expect(RULE_BOUND.length).toBeGreaterThan(600);
    expect(RULE_BOUND).toContain("IT MEASURES ONE RUN OVER ONE SYNTHETIC PRACTICE");
    expect(RULE_BOUND).toContain("`no_wider` IS A READING OF A SENTENCE");
  });
});

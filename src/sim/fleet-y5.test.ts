// W269 verify gate: "the run exercises capacity, interop and the API; budgets stated in the test
// body, W48's shape, with the checker exercised on a violating fake first."
//
// THE ORDERING IS PART OF THE GATE AND THIS FILE OBEYS IT LITERALLY. The fake comes first, and
// not for tidiness: a fleet run that meets every budget is indistinguishable from a checker that
// cannot fail, and the run takes long enough that nobody re-reads the checker afterwards. So the
// checker is shown breaking on every violation it can report BEFORE a single real practice is
// generated — and the fake is built to break all eight at once, so a branch that stopped working
// cannot hide behind the seven that still do.
//
// The budgets are stated here rather than imported, W48's shape, because a budget is an argument
// somebody should have to disagree with in a diff.

import { describe, expect, it } from "vitest";
import {
  DEFAULT_Y5_FLEET_BUDGETS,
  REFUSED_Y5_FLEET_SHAPES,
  type Y5FleetBudgets,
  type Y5FleetResult,
  type Y5PracticeStat,
  checkY5FleetBudgets,
  namesAnotherPractice,
  runY5Fleet,
} from "./fleet-y5";
import { API_ENDPOINTS } from "@/api/surface";
import { getConsole } from "@/console/store";

/**
 * The budgets this run is held to.
 *
 * Stated in the test body so they are arguable: 50 practices of 800 patients is a fleet a real
 * deployment would recognise, and a quarter of a second per practice per surface is what a page
 * load can spend without a human noticing.
 */
const BUDGETS: Y5FleetBudgets = {
  maxTotalWallMs: 60_000,
  maxP95CapacityMs: 250,
  maxP95InteropMs: 250,
  maxP95ApiMs: 150,
  maxColdStartMs: 12_000,
  forecastShare: { min: 0.6, max: 0.95 },
  openSlotRefusalShare: { min: 0.01, max: 0.4 },
};

const CONFIG = {
  practices: 50,
  baseSeed: 26_900,
  patientCount: 800,
  clinicianCount: 10,
  scheduleWeeks: 8,
  // One practice in five has a diary too short for a forecast. Without them the forecast share
  // is exactly 1.000 and its budget cannot detect the defect it exists for — see the note on
  // `thinPracticeEvery`. The first version of this run had none, and measured exactly that.
  thinPracticeEvery: 5,
  todayIso: "2026-08-10",
};

const stat = (over: Partial<Y5PracticeStat> = {}): Y5PracticeStat => ({
  seed: 1,
  practiceId: "prac-1",
  capacityMs: 1,
  interopMs: 1,
  apiMs: 1,
  thinDiary: false,
  historiesAsked: 10,
  forecastsGiven: 8,
  appointmentsOffered: 100,
  openSlotRefusals: 10,
  endpointsAsked: 3,
  endpointRefusals: 0,
  crossPracticeAnswers: 0,
  ...over,
});

describe("W269 the checker, exercised on a violating fake before anything real runs", () => {
  it("reports every violation it can report, in words", () => {
    // All nine at once. A branch that stopped working cannot hide behind the others.
    const fake: Y5FleetResult = {
      config: { ...CONFIG, practices: 1 },
      runs: [
        stat({ capacityMs: 900, interopMs: 900, apiMs: 900, endpointRefusals: 2, crossPracticeAnswers: 1 }),
      ],
      totalWallMs: 120_000,
      coldStartMs: 30_000,
      forecastShare: 1.0,
      openSlotRefusalShare: 0.9,
    };
    const violations = checkY5FleetBudgets(fake, BUDGETS);
    expect(violations.some((v) => v.includes("total wall"))).toBe(true);
    expect(violations.some((v) => v.includes("p95 capacity"))).toBe(true);
    expect(violations.some((v) => v.includes("p95 interop"))).toBe(true);
    expect(violations.some((v) => v.includes("p95 api"))).toBe(true);
    expect(violations.some((v) => v.includes("forecast share"))).toBe(true);
    expect(violations.some((v) => v.includes("open-slot refusal share"))).toBe(true);
    expect(violations.some((v) => v.includes("refuse to read under load"))).toBe(true);
    expect(violations.some((v) => v.includes("naming another practice"))).toBe(true);
    expect(violations.some((v) => v.includes("cold start"))).toBe(true);
    expect(violations).toHaveLength(9);
  });

  it("catches a share that COLLAPSED, not only one that grew", () => {
    // Both ends are defects and they are different defects. A forecast share at zero means the
    // product has stopped answering where it legitimately can.
    const collapsed: Y5FleetResult = {
      config: { ...CONFIG, practices: 1 },
      runs: [stat()],
      totalWallMs: 10,
      coldStartMs: 10,
      forecastShare: 0,
      openSlotRefusalShare: 0,
    };
    const violations = checkY5FleetBudgets(collapsed, BUDGETS);
    expect(violations.some((v) => v.includes("forecast share"))).toBe(true);
    expect(violations.some((v) => v.includes("open-slot refusal share"))).toBe(true);
    expect(violations).toHaveLength(2);
  });

  it("says nothing when nothing is wrong", () => {
    // The other half of non-vacuity: a checker that always complained would make the real run's
    // clean result meaningless too.
    const clean: Y5FleetResult = {
      config: { ...CONFIG, practices: 1 },
      runs: [stat()],
      totalWallMs: 10,
      coldStartMs: 10,
      forecastShare: 0.8,
      openSlotRefusalShare: 0.1,
    };
    expect(checkY5FleetBudgets(clean, BUDGETS)).toEqual([]);
  });

  it("does not read prac-1 out of prac-10", () => {
    // A substring match would report a leak on every tenth practice and be believed.
    expect(namesAnotherPractice(JSON.stringify({ id: "prac-10" }), "prac-1")).toBe(true);
    expect(namesAnotherPractice(JSON.stringify({ id: "prac-1" }), "prac-10")).toBe(true);
    expect(namesAnotherPractice(JSON.stringify({ id: "prac-1", also: "prac-1" }), "prac-1")).toBe(
      false,
    );
    expect(namesAnotherPractice(JSON.stringify({ nothing: true }), "prac-1")).toBe(false);
  });

  it("ships the same budgets it defends", () => {
    // The exported default and the stated one agree, so a reader arguing with the number here is
    // arguing with the one the product carries.
    expect(BUDGETS).toEqual(DEFAULT_Y5_FLEET_BUDGETS);
  });
});

describe("W269 the fleet run", () => {
  const result = runY5Fleet(CONFIG);
  const violations = checkY5FleetBudgets(result, BUDGETS);

  it("meets every budget", { timeout: 300_000 }, () => {
    expect(violations, violations.join("; ")).toEqual([]);
    expect(result.runs).toHaveLength(CONFIG.practices);
  });

  it("exercises capacity — histories asked and ranges given", () => {
    // Named in the gate. A stage that ran zero units of work would satisfy every latency budget.
    const asked = result.runs.reduce((a, r) => a + r.historiesAsked, 0);
    const given = result.runs.reduce((a, r) => a + r.forecastsGiven, 0);
    expect(asked).toBeGreaterThan(CONFIG.practices * 5);
    expect(given).toBeGreaterThan(0);
    expect(given).toBeLessThanOrEqual(asked);
  });

  it("contains practices the product must refuse, and refuses exactly those", () => {
    // THE ASSERTION THE FIRST VERSION OF THIS UNIT WAS MISSING. Without thin practices the share
    // was exactly 1.000 — inside its envelope, with the refusal branch never executed once — and
    // no erosion of the four-week floor could ever have moved it. Now the share sits STRICTLY
    // inside both ends, so it can move in either direction and be seen.
    const thin = result.runs.filter((r) => r.thinDiary);
    const full = result.runs.filter((r) => !r.thinDiary);
    expect(thin.length).toBeGreaterThan(5);
    expect(full.length).toBeGreaterThan(thin.length);
    expect(thin.every((r) => r.forecastsGiven === 0), "a thin diary produced a forecast").toBe(true);
    expect(
      full.every((r) => r.forecastsGiven === r.historiesAsked),
      "a full diary was refused a forecast",
    ).toBe(true);
    expect(result.forecastShare).toBeGreaterThan(BUDGETS.forecastShare.min);
    expect(result.forecastShare).toBeLessThan(BUDGETS.forecastShare.max);
  });

  it("exercises interop — every record converted, open slots refused", () => {
    const offered = result.runs.reduce((a, r) => a + r.appointmentsOffered, 0);
    const refused = result.runs.reduce((a, r) => a + r.openSlotRefusals, 0);
    expect(offered).toBeGreaterThan(CONFIG.practices * 100);
    // Non-vacuity in both directions: some refuse and some do not, so the mapping is being read.
    expect(refused).toBeGreaterThan(0);
    expect(refused).toBeLessThan(offered);
  });

  it("exercises the API — every declared endpoint, for every practice", () => {
    const asked = result.runs.reduce((a, r) => a + r.endpointsAsked, 0);
    expect(asked).toBe(CONFIG.practices * API_ENDPOINTS.length);
    expect(API_ENDPOINTS.length).toBeGreaterThan(2);
    expect(result.runs.every((r) => r.endpointRefusals === 0)).toBe(true);
  });

  it("answers no practice with another practice's data, fifty times over", () => {
    // Y4-1's condition — more than one practice real at once — held for the whole run.
    expect(result.runs.reduce((a, r) => a + r.crossPracticeAnswers, 0)).toBe(0);
    expect(new Set(result.runs.map((r) => r.practiceId)).size).toBe(CONFIG.practices);
  });

  it("times the three surfaces separately", () => {
    // A capacity regression hiding behind fast interop is what an aggregate cannot show.
    //
    // W256's sweep caught the first version of this: it asserted each stage was `>= 0`, which a
    // duration always is — three assertions that could not fail, checking that the fields existed
    // rather than that they were measured separately. What distinguishes three timers from one
    // number copied into three fields is that the totals DIFFER, so that is what is asserted.
    const totalOf = (pick: (r: typeof result.runs[number]) => number) =>
      result.runs.reduce((a, r) => a + pick(r), 0);
    const capacity = totalOf((r) => r.capacityMs);
    const interop = totalOf((r) => r.interopMs);
    const api = totalOf((r) => r.apiMs);
    expect(new Set([capacity, interop, api]).size, "the three stages share one timer").toBe(3);
    // And the API stage is the cheapest by a wide margin — three reads against fifty thousand
    // record conversions — so a stage that had swallowed another's work would show here.
    expect(api).toBeLessThan(capacity);
    expect(api).toBeLessThan(interop);
    expect(capacity + interop + api).toBeLessThanOrEqual(result.totalWallMs);
  });

  it("measures the cold start where a percentile cannot", () => {
    // THE RUN'S FINDING. The first endpoint read pays for `getSimResult()` memoising a whole
    // simulation; every read after it is sub-millisecond. Over fifty practices the p95 is under a
    // millisecond and passes any budget anybody would write, so the outlier is measured on its own
    // rather than smeared. Making it smaller is another unit's work — this one stops it doubling.
    const steadyState = result.runs.map((r) => r.apiMs).sort((a, b) => a - b);
    const median = steadyState[Math.floor(steadyState.length / 2)]!;
    expect(result.coldStartMs, "the cold start was not paid where it is measured").toBeGreaterThan(
      100,
    );
    expect(result.coldStartMs).toBeGreaterThan(median * 100);
    expect(result.coldStartMs).toBeLessThan(BUDGETS.maxColdStartMs);
    // And it is genuinely once per process: no practice in the fleet paid it again.
    expect(Math.max(...steadyState)).toBeLessThan(result.coldStartMs / 10);
  });

  it("leaves the console store as it found it", () => {
    // Fifty synthetic practices left behind would change the state every other suite runs
    // against, and would do it invisibly — a fuller store makes most reads succeed.
    expect(getConsole().practices).toEqual([]);
  });
});

describe("W269 what the run refuses is written down", () => {
  it("names the nine shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_Y5_FLEET_SHAPES).sort()).toEqual([
      "a_fleet_with_nothing_to_refuse",
      "a_share_with_only_a_ceiling",
      "an_allowance_for_cross_practice_answers",
      "asserting_inside_the_run",
      "carrying_the_cost_envelope_over",
      "checking_the_envelope_stamp_alone",
      "hiding_the_cold_start_in_a_percentile",
      "leaving_the_console_store_seeded",
      "timing_the_three_stages_together",
    ]);
    for (const [name, why] of Object.entries(REFUSED_Y5_FLEET_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_Y5_FLEET_SHAPES.carrying_the_cost_envelope_over).toContain("W48");
    expect(REFUSED_Y5_FLEET_SHAPES.an_allowance_for_cross_practice_answers).toContain("Y4-1");
    // The one this unit found in its own first version, kept in its own words.
    expect(REFUSED_Y5_FLEET_SHAPES.a_fleet_with_nothing_to_refuse).toContain("1.000");
  });
});

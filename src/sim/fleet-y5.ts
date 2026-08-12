// W269: the synthetic fleet at five years — W48's budgets re-derived over the Y5 surfaces.
//
// W48 ran 100 synthetic practices through the W12 loop and measured two classes of thing: wall
// clock per practice-week, and message volume against the W21 economics envelope. Both budgets
// were about the rail that SENDS. Y5 built three surfaces that send nothing — capacity
// forecasting, FHIR interop and the platform API — and none of them has ever been run at fleet
// scale. This runs them, and the re-derivation is not "the same budgets over more code": the cost
// budget has to be re-derived too, because there is no cost.
//
// SO WHAT REPLACES THE COST ENVELOPE IS THE REFUSAL RATE, and that is the unit's argument. W48
// asked "are we sending more than we priced". These surfaces produce no sends, so the analogous
// question — the one where scale makes a defect cheap to miss — is ARE WE ASSERTING MORE THAN THE
// RECORD SUPPORTS. Two shares carry it:
//
//   * `forecastShare`: how many session histories yield a forecast rather than a refusal. W223
//     refuses a range over fewer than four recorded weeks, and a change that eroded that floor
//     would not fail a unit test written around a fixture with plenty of history — it would show
//     up here, as a share that jumped.
//   * `openSlotRefusalShare`: how many appointments refuse FHIR export because an open slot is not
//     an appointment. W236 maps `open` to null on purpose, and the failure it prevents is a diary
//     hole leaving the practice as a clinical record. A mapping change would collapse this share.
//
// A share is a budget in exactly W48's sense: an explicit input, checked by a function that
// returns violations in words, with a floor AND a ceiling — because both directions are defects.
// A forecast share that COLLAPSED would mean the product had stopped answering where it can, and
// that is a different bug from the one above, not a safer one.
//
// AND THE RUN FOUND SOMETHING A p95 CANNOT SEE. The first read of the `capacity` endpoint costs
// about 5.6 SECONDS and every read after it costs 0.7ms, because `getSimResult()` memoises a full
// `runSim(DEFAULT_SIM_CONFIG)` at module scope and that endpoint is what triggers it. Over fifty
// practices the p95 is 0.9ms — comfortably inside any budget anybody would write — while one call
// took five and a half seconds. So the cold start is measured as its own figure with its own
// budget, rather than smeared across a percentile that is structurally incapable of showing it.
// In a deployment this is the first request after a boot, and pinning it here is the difference
// between a known cost and a cost that doubles unnoticed. Making it smaller is a different unit's
// work; measuring it is this one's.
//
// THE THIRD MEASURE IS NOT AN ENVELOPE, BECAUSE ITS ONLY ACCEPTABLE VALUE IS ZERO. Y4-1 was a
// cross-tenant read that existed for two years while every test passed, and the condition that
// made it live was W166 making two practices real. This process holds fifty at once and asks each
// endpoint for each of them, so a response naming a practice other than the one asked for is a
// violation with no allowance to sit inside.
//
// FOUNDER GATE (plan §4): synthetic throughout. The practices come from W12's generator, the
// console store is reset before the run and reset after it, and nothing here contacts anything —
// the interop stage converts records to FHIR in memory and the disclosure ledger stays empty
// because G1 is unratified.

import { onboardPractice, practiceRecord, resetConsole } from "@/console/store";
import { historyFor, sessionsFrom } from "@/capacity/model";
import { MIN_RECORDED_WEEKS, forecast } from "@/capacity/forecast";
import {
  toFhirAppointment,
  toFhirOrganization,
  toFhirPatient,
  toFhirPractitioner,
} from "@/interop/fhir";
import { API_ENDPOINTS, type ReadContext } from "@/api/surface";
import { readSafely } from "@/api/refusals";
import { generatePractice, type SyntheticPractice } from "@/synthetic/generate";
import type { PracticeId } from "@/domain/types";
import { percentile } from "./fleet";

export interface Y5FleetConfig {
  practices: number;
  baseSeed: number;
  patientCount: number;
  clinicianCount: number;
  /** Weeks of schedule per practice. Four or more give the capacity floor something to clear. */
  scheduleWeeks: number;
  /**
   * Every Nth practice gets a diary too short for a forecast.
   *
   * NOT DECORATION — the budget below is unmeasurable without it. A fleet where every practice
   * has a full diary produces a forecast share of exactly 1.000, and the defect that budget
   * exists to catch is the floor ERODING, which cannot push a share above one. The envelope
   * would then be satisfied at its own ceiling by a run in which the refusal branch never
   * executed. So the fleet contains practices the product must refuse, and the share is the
   * measure of whether it still does.
   */
  thinPracticeEvery: number;
  /** Anchor date. Passed in, never read from a clock — W12's rule, inherited. */
  todayIso: string;
}

export interface Y5PracticeStat {
  seed: number;
  practiceId: string;
  capacityMs: number;
  interopMs: number;
  apiMs: number;
  /** True when this practice's diary is deliberately too short for a forecast. */
  thinDiary: boolean;
  /** Session histories asked for, and how many yielded a range rather than a refusal. */
  historiesAsked: number;
  forecastsGiven: number;
  /** Appointments offered for FHIR export, and how many were refused as open slots. */
  appointmentsOffered: number;
  openSlotRefusals: number;
  /** Endpoints asked, and how many refused. A refusal here is a defect, not a policy. */
  endpointsAsked: number;
  endpointRefusals: number;
  /** Responses naming a practice other than the one asked for. Only zero is acceptable. */
  crossPracticeAnswers: number;
}

export interface Y5FleetResult {
  config: Y5FleetConfig;
  runs: Y5PracticeStat[];
  /**
   * What the FIRST endpoint read costs, before any practice is measured.
   *
   * Its own figure because it is a per-process cost, not a per-practice one, and because a
   * percentile over fifty practices cannot show a single outlier however large it is.
   */
  coldStartMs: number;
  totalWallMs: number;
  forecastShare: number;
  openSlotRefusalShare: number;
}

export interface Y5FleetBudgets {
  /** Whole-fleet wall clock. */
  maxTotalWallMs: number;
  /** p95 of per-practice capacity work: sessions derived, histories read, forecasts given. */
  maxP95CapacityMs: number;
  /** p95 of per-practice interop work: every record converted to FHIR. */
  maxP95InteropMs: number;
  /** p95 of per-practice API work: every declared endpoint dispatched, in steady state. */
  maxP95ApiMs: number;
  /** What the first endpoint read may cost. Pinned so a known cost cannot double unnoticed. */
  maxColdStartMs: number;
  /** Share of histories that yield a forecast. Both ends are defects — see the module note. */
  forecastShare: { min: number; max: number };
  /** Share of appointments refused for FHIR export because an open slot is not an appointment. */
  openSlotRefusalShare: { min: number; max: number };
}

/**
 * The budgets this tree runs against.
 *
 * Latency numbers are per practice rather than per practice-week, because these surfaces are not
 * weekly: a forecast is asked when somebody opens the page and an export when somebody sends one.
 * The shares are stated where a reader can argue with them — W48's shape, and the reason the
 * checker returns sentences instead of a boolean.
 */
export const DEFAULT_Y5_FLEET_BUDGETS: Y5FleetBudgets = {
  maxTotalWallMs: 60_000,
  maxP95CapacityMs: 250,
  maxP95InteropMs: 250,
  maxP95ApiMs: 150,
  // Measured at ~5.6s: `getSimResult()` memoises a whole simulation run and the capacity endpoint
  // is what triggers it. Headroom for a slower machine, and no more — the number is here to be
  // argued with, not to be satisfied.
  maxColdStartMs: 12_000,
  forecastShare: { min: 0.6, max: 0.95 },
  openSlotRefusalShare: { min: 0.01, max: 0.4 },
};

/** Everything one practice's Y5 surfaces do, timed stage by stage. */
function runPractice(
  data: SyntheticPractice,
  seed: number,
  thinDiary: boolean,
): Y5PracticeStat {
  const practiceId = data.practice.id;

  // ---- capacity ------------------------------------------------------------------------
  const capacityStart = performance.now();
  const recorded = sessionsFrom(data.appointments, practiceId);
  // Every (clinician, weekday) the diary actually holds, asked in a stable order. Derived from
  // the recorded sessions rather than from the clinician list, because a clinician with no
  // sessions has no history to ask for and would inflate the refusal share with a non-event.
  const keys = [
    ...new Set(recorded.map((r) => `${r.session.clinicianId}::${r.session.weekday}`)),
  ].sort();
  let historiesAsked = 0;
  let forecastsGiven = 0;
  for (const key of keys) {
    const [clinicianId, weekday] = key.split("::");
    historiesAsked += 1;
    const history = historyFor(recorded, clinicianId!, Number(weekday));
    if (!history.ok) continue;
    const offered = history.pattern.weeks.reduce((a, w) => a + w.offerable, 0);
    if (forecast(history.pattern, offered).ok) forecastsGiven += 1;
  }
  const capacityMs = performance.now() - capacityStart;

  // ---- interop -------------------------------------------------------------------------
  const interopStart = performance.now();
  toFhirOrganization(data.practice);
  for (const clinician of data.clinicians) toFhirPractitioner(clinician);
  for (const patient of data.patients) toFhirPatient(patient);
  let openSlotRefusals = 0;
  for (const appointment of data.appointments) {
    if (!toFhirAppointment(appointment).ok) openSlotRefusals += 1;
  }
  const interopMs = performance.now() - interopStart;

  // ---- platform API --------------------------------------------------------------------
  const apiStart = performance.now();
  const ctx: ReadContext = { practiceId: practiceId as PracticeId };
  let endpointRefusals = 0;
  let crossPracticeAnswers = 0;
  for (const endpoint of API_ENDPOINTS) {
    const outcome = readSafely(endpoint, ctx);
    if (!outcome.ok) {
      endpointRefusals += 1;
      continue;
    }
    if (outcome.body.practiceId !== practiceId) crossPracticeAnswers += 1;
    // Y4-1's shape: the leak was a payload carrying another practice's rows while the envelope
    // looked right, so the whole serialised body is searched rather than the stamp alone.
    if (namesAnotherPractice(JSON.stringify(outcome.body), practiceId)) crossPracticeAnswers += 1;
  }
  const apiMs = performance.now() - apiStart;

  return {
    seed,
    practiceId,
    thinDiary,
    capacityMs,
    interopMs,
    apiMs,
    historiesAsked,
    forecastsGiven,
    appointmentsOffered: data.appointments.length,
    openSlotRefusals,
    endpointsAsked: API_ENDPOINTS.length,
    endpointRefusals,
    crossPracticeAnswers,
  };
}

/**
 * Does this payload name a practice that is not the one it answers for?
 *
 * Word-bounded, because `prac-1` is a prefix of `prac-10` and a substring search would report a
 * leak on every tenth practice and be believed.
 */
export function namesAnotherPractice(payload: string, practiceId: string): boolean {
  const named = new Set(payload.match(/\bprac-\d+\b/g) ?? []);
  named.delete(practiceId);
  return named.size > 0;
}

/**
 * Run the fleet.
 *
 * The console store is reset before and after: the API stage reads it, and a fleet run that left
 * fifty synthetic practices behind would be a load test that changed the state every other suite
 * runs against.
 */
export function runY5Fleet(config: Y5FleetConfig): Y5FleetResult {
  resetConsole();
  const t0 = performance.now();
  const runs: Y5PracticeStat[] = [];

  // Pay the cold start where it can be seen. A practice id nothing has onboarded is deliberate:
  // this warms the memoised sim without putting anything in the console store, so the fleet's own
  // practices are all measured in steady state.
  const coldStart = performance.now();
  for (const endpoint of API_ENDPOINTS) readSafely(endpoint, { practiceId: "prac-warmup" as PracticeId });
  const coldStartMs = performance.now() - coldStart;

  try {
    for (let i = 0; i < config.practices; i += 1) {
      const seed = config.baseSeed + i;
      // A thin practice has fewer recorded weeks than W223's floor, so its histories must refuse.
      const thin = config.thinPracticeEvery > 0 && (i + 1) % config.thinPracticeEvery === 0;
      const data = generatePractice({
        seed,
        patientCount: config.patientCount,
        clinicianCount: config.clinicianCount,
        scheduleWeeks: thin ? MIN_RECORDED_WEEKS - 1 : config.scheduleWeeks,
        todayIso: config.todayIso,
      });
      // The console store mints its own ids, so the generated practice is re-identified to the
      // one the API will answer for. Onboarding is what makes a practice real to W166.
      const owner = `owner-${seed}@demo.practice.example`;
      const refusals = onboardPractice(
        { name: `Fleet Practice ${seed}`, timezone: "Australia/Sydney", holdoutPercent: 10 },
        config.todayIso,
        owner,
      );
      if (Object.keys(refusals).length > 0) {
        throw new Error(`practice ${seed} was refused: ${JSON.stringify(refusals)}`);
      }
      const record = practiceRecord(`prac-${i + 1}` as PracticeId);
      if (!record) throw new Error(`practice ${seed} did not land in the console store`);

      const reIdentified: SyntheticPractice = {
        ...data,
        practice: { ...data.practice, id: record.practice.id },
        appointments: data.appointments.map((a) => ({ ...a, practiceId: record.practice.id })),
      };
      runs.push(runPractice(reIdentified, seed, thin));
    }
  } finally {
    resetConsole();
  }

  const totalWallMs = performance.now() - t0;
  const historiesAsked = runs.reduce((a, r) => a + r.historiesAsked, 0);
  const forecastsGiven = runs.reduce((a, r) => a + r.forecastsGiven, 0);
  const appointmentsOffered = runs.reduce((a, r) => a + r.appointmentsOffered, 0);
  const openSlotRefusals = runs.reduce((a, r) => a + r.openSlotRefusals, 0);

  return {
    config,
    runs,
    coldStartMs,
    totalWallMs,
    forecastShare: historiesAsked === 0 ? 0 : forecastsGiven / historiesAsked,
    openSlotRefusalShare: appointmentsOffered === 0 ? 0 : openSlotRefusals / appointmentsOffered,
  };
}

/**
 * Every budget violation, in words.
 *
 * W48's shape exactly: sentences a reader can act on rather than a boolean, and every violation
 * reported rather than the first — a run that broke three budgets and reported one would be fixed
 * three times.
 */
export function checkY5FleetBudgets(
  result: Y5FleetResult,
  budgets: Y5FleetBudgets,
): string[] {
  const violations: string[] = [];

  if (result.totalWallMs > budgets.maxTotalWallMs) {
    violations.push(`total wall ${Math.round(result.totalWallMs)}ms > ${budgets.maxTotalWallMs}ms`);
  }

  const p95 = (pick: (r: Y5PracticeStat) => number) =>
    percentile(result.runs.map(pick).sort((a, b) => a - b), 95);

  if (result.coldStartMs > budgets.maxColdStartMs) {
    violations.push(
      `cold start ${Math.round(result.coldStartMs)}ms > ${budgets.maxColdStartMs}ms: the first endpoint read pays for a memoised simulation run`,
    );
  }

  const stages: Array<[string, number, number]> = [
    ["capacity", p95((r) => r.capacityMs), budgets.maxP95CapacityMs],
    ["interop", p95((r) => r.interopMs), budgets.maxP95InteropMs],
    ["api", p95((r) => r.apiMs), budgets.maxP95ApiMs],
  ];
  for (const [name, measured, allowed] of stages) {
    if (measured > allowed) {
      violations.push(`p95 ${name} ${measured.toFixed(1)}ms > ${allowed}ms`);
    }
  }

  const shares: Array<[string, number, { min: number; max: number }, string]> = [
    [
      "forecast share",
      result.forecastShare,
      budgets.forecastShare,
      "the capacity floor is asserting where the record is thin, or has stopped answering where it can",
    ],
    [
      "open-slot refusal share",
      result.openSlotRefusalShare,
      budgets.openSlotRefusalShare,
      "an open slot may be exporting as an appointment, or every appointment has stopped exporting",
    ],
  ];
  for (const [name, measured, envelope, why] of shares) {
    if (measured < envelope.min || measured > envelope.max) {
      violations.push(
        `${name} ${measured.toFixed(3)} outside ${envelope.min}–${envelope.max}: ${why}`,
      );
    }
  }

  const refusing = result.runs.filter((r) => r.endpointRefusals > 0).length;
  if (refusing > 0) {
    violations.push(`${refusing} practice(s) had an endpoint refuse to read under load`);
  }

  const leaking = result.runs.filter((r) => r.crossPracticeAnswers > 0).length;
  if (leaking > 0) {
    violations.push(`${leaking} practice(s) received an answer naming another practice`);
  }

  return violations;
}

/**
 * Ways of writing this run that would measure less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly weakening the run.
 */
export const REFUSED_Y5_FLEET_SHAPES: Readonly<Record<string, string>> = {
  carrying_the_cost_envelope_over:
    "Re-using W48's sends-per-practice-week budget. These surfaces send nothing, so the budget would pass at zero forever and read as a cost control that was still working. The re-derivation had to find what scale makes cheap to miss HERE, which is asserting more than the record supports.",
  a_share_with_only_a_ceiling:
    "Bounding the forecast share from above alone. A share that collapsed would mean the product had stopped answering where it legitimately can, which is a different defect from over-asserting and not a safer one. Both ends, on both shares.",
  a_fleet_with_nothing_to_refuse:
    "Generating every practice with a full diary. The first version of this run did, and its forecast share came out at exactly 1.000 — which SATISFIED the envelope while the refusal branch never executed once, and could never have detected the floor eroding, because erosion cannot push a share above one. `thinPracticeEvery` puts practices in the fleet that the product must refuse, and the share becomes a measurement instead of a ceiling.",
  an_allowance_for_cross_practice_answers:
    "Giving the cross-practice count an envelope like the others. Its only acceptable value is zero: Y4-1 sat for two years as a cross-tenant read while every test passed, and the condition that made it live was two practices being real at once — which is the state this run is in fifty times over.",
  checking_the_envelope_stamp_alone:
    "Comparing `body.practiceId` and stopping. Y4-1's shape was a payload carrying another practice's rows while the envelope looked correct, so the whole serialised body is searched — and word-bounded, because `prac-1` is a prefix of `prac-10` and a substring match would report a leak on every tenth practice.",
  timing_the_three_stages_together:
    "One wall figure per practice. A capacity regression hiding behind fast interop is exactly what an aggregate cannot show, and the three surfaces are separately owned — the p95s are per stage so a violation names the surface that caused it.",
  leaving_the_console_store_seeded:
    "Onboarding fifty practices and not clearing up. The API stage reads the console store, so a run that left its practices behind would change the state every other suite runs against — and it would do it invisibly, since a fuller store makes most reads succeed.",
  hiding_the_cold_start_in_a_percentile:
    "Letting the first endpoint read sit inside the per-practice p95. It costs about 5.6 seconds against a steady state of 0.7ms, so a p95 over fifty practices reports 0.9ms and passes — a percentile cannot show a single outlier however large, and this one is the first request after every boot. Measured as its own figure with its own budget.",
  asserting_inside_the_run:
    "Throwing on a budget breach where it is measured. The run reports numbers and the checker turns them into sentences, which is W48's split — a run that asserted would stop at the first violation and report one problem where there were three.",
};

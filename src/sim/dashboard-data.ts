// W14: dashboard data — the deterministic W12 sim, shaped for the incrementality
// dashboard. The sim is the console's data source until real (gated) practice data
// exists; one cached run serves every request because the seed fixes the world.

import { countAttribution, type AttributionResult } from "@/engine/attribution";
import { DEFAULT_SIM_CONFIG, runSim, type SimResult } from "./harness";

export interface WeeklyPoint {
  /** 1-based week number. */
  week: number;
  weekStartIso: string;
  invitePer1000: number;
  holdoutPer1000: number;
  incrementalPer1000: number;
}

export interface DashboardData {
  attribution: AttributionResult;
  weekly: WeeklyPoint[];
  totals: SimResult["totals"];
  optOutRatePct: number;
  patientCount: number;
  weeks: number;
}

function isoDaysFrom(anchor: string, days: number): string {
  const d = new Date(`${anchor}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildDashboardData(result: SimResult): DashboardData {
  const { config } = result;
  const weekly: WeeklyPoint[] = [];
  for (let w = 0; w < config.weeks; w++) {
    // Same day-span the sim used for week w: anchor+7w+1 .. anchor+7w+7.
    const attr = countAttribution(
      { ...result.practice },
      result.patients,
      result.appointments,
      { fromIso: isoDaysFrom(config.todayIso, w * 7 + 1), toIso: isoDaysFrom(config.todayIso, w * 7 + 7) },
    );
    weekly.push({
      week: w + 1,
      weekStartIso: isoDaysFrom(config.todayIso, w * 7 + 1),
      invitePer1000: attr.inviteArm.attendedPer1000,
      holdoutPer1000: attr.holdoutArm.attendedPer1000,
      incrementalPer1000: attr.incrementalPer1000 ?? 0,
    });
  }
  return {
    attribution: result.attribution,
    weekly,
    totals: result.totals,
    optOutRatePct:
      result.totals.invitationsSent === 0
        ? 0
        : (result.totals.optedOut / result.totals.invitationsSent) * 100,
    patientCount: config.patientCount,
    weeks: config.weeks,
  };
}

let cached: DashboardData | null = null;

/** Deterministic, so computed once per server process. */
export function getDashboardData(): DashboardData {
  cached ??= buildDashboardData(runSim(DEFAULT_SIM_CONFIG));
  return cached;
}

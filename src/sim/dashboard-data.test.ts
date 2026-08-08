import { describe, expect, it } from "vitest";
import { DEFAULT_SIM_CONFIG, runSim } from "./harness";
import { buildDashboardData, getDashboardData } from "./dashboard-data";

describe("W14 dashboard data", () => {
  const result = runSim({ ...DEFAULT_SIM_CONFIG, weeks: 6 });
  const data = buildDashboardData(result);

  it("produces one point per simulated week", () => {
    expect(data.weekly.map((p) => p.week)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("weekly per-arm rates sum back to the overall attribution counts", () => {
    const perThousandToCount = (per1000: number, patients: number) =>
      Math.round((per1000 * patients) / 1000);
    const inviteSum = data.weekly.reduce(
      (n, p) => n + perThousandToCount(p.invitePer1000, result.attribution.inviteArm.patients),
      0,
    );
    const holdoutSum = data.weekly.reduce(
      (n, p) => n + perThousandToCount(p.holdoutPer1000, result.attribution.holdoutArm.patients),
      0,
    );
    expect(inviteSum).toBe(result.attribution.inviteArm.attended);
    expect(holdoutSum).toBe(result.attribution.holdoutArm.attended);
  });

  it("weekly incremental is exactly the arm-rate difference", () => {
    for (const p of data.weekly) {
      expect(p.incrementalPer1000).toBeCloseTo(p.invitePer1000 - p.holdoutPer1000, 10);
    }
  });

  it("opt-out rate is a percentage of sent invitations", () => {
    expect(data.optOutRatePct).toBeCloseTo(
      (result.totals.optedOut / result.totals.invitationsSent) * 100,
      10,
    );
  });

  it("the cached accessor returns one stable instance", () => {
    expect(getDashboardData()).toBe(getDashboardData());
  });
});

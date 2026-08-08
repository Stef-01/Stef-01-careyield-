import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "@/engine/eligibility";
import {
  getConsole,
  onboardPractice,
  resetConsole,
  updateRules,
  validateOnboarding,
} from "@/console/store";

const NOW = "2026-08-08T18:00:00Z";

const VALID_ONBOARDING = { name: "Demo Family Practice", timezone: "Australia/Sydney", holdoutPercent: 10 };
const OWNER = "manager@demo.practice.example";

beforeEach(() => {
  resetConsole();
});

describe("onboarding", () => {
  it("creates the practice with holdout stored as a rate", () => {
    expect(onboardPractice(VALID_ONBOARDING, NOW, OWNER)).toEqual({});
    const state = getConsole();
    expect(state.practice).toMatchObject({
      name: "Demo Family Practice",
      timezone: "Australia/Sydney",
      holdoutRate: 0.1,
    });
    expect(state.auditEvents).toHaveLength(1);
    expect(state.auditEvents[0]?.kind).toBe("config_changed");
  });

  it("rejects bad input without touching state", () => {
    const errors = validateOnboarding({ name: "x", timezone: "nowhere", holdoutPercent: 90 });
    expect(Object.keys(errors).sort()).toEqual(["holdoutPercent", "name", "timezone"]);
    expect(onboardPractice({ ...VALID_ONBOARDING, holdoutPercent: 90 }, NOW, OWNER)).toHaveProperty("holdoutPercent");
    expect(getConsole().practice).toBeNull();
  });
});

describe("rules config", () => {
  it("requires an onboarded practice", () => {
    expect(updateRules({ ...DEFAULT_CONFIG, minDaysSinceLastVisit: 200 }, NOW, OWNER)).toHaveProperty("form");
  });

  it("bumps the version and audits the exact change", () => {
    onboardPractice(VALID_ONBOARDING, NOW, OWNER);
    const errors = updateRules({ ...DEFAULT_CONFIG, minDaysSinceLastVisit: 240, chronicCareOnly: true }, NOW, OWNER);
    expect(errors).toEqual({});
    const state = getConsole();
    expect(state.rulesVersion).toBe(2);
    expect(state.rulesConfig.minDaysSinceLastVisit).toBe(240);
    const audit = state.auditEvents.at(-1);
    expect(audit?.subjectId).toBe("rules-v2");
    expect(audit?.detail).toContain("minDaysSinceLastVisit: 180 -> 240");
    expect(audit?.detail).toContain("chronicCareOnly: false -> true");
  });

  it("does not bump the version for a no-op save", () => {
    onboardPractice(VALID_ONBOARDING, NOW, OWNER);
    expect(updateRules({ ...DEFAULT_CONFIG }, NOW, OWNER)).toEqual({});
    expect(getConsole().rulesVersion).toBe(1);
    expect(getConsole().auditEvents).toHaveLength(1); // onboarding only
  });

  it("rejects out-of-range numbers", () => {
    onboardPractice(VALID_ONBOARDING, NOW, OWNER);
    expect(updateRules({ ...DEFAULT_CONFIG, minDaysSinceLastVisit: -1 }, NOW, OWNER)).toHaveProperty("minDaysSinceLastVisit");
    expect(updateRules({ ...DEFAULT_CONFIG, maxInvitesPerQuarter: 99 }, NOW, OWNER)).toHaveProperty("maxInvitesPerQuarter");
    expect(updateRules({ ...DEFAULT_CONFIG, futureBookingBlockDays: 3.5 }, NOW, OWNER)).toHaveProperty("futureBookingBlockDays");
    expect(getConsole().rulesVersion).toBe(1);
  });
});

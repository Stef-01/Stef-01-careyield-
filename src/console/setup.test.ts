import { beforeEach, describe, expect, it } from "vitest";
import {
  completeSetup,
  getConsole,
  onboardPractice,
  resetConsole,
  saveClinicians,
  saveSessionConfig,
  setupReadiness,
  updateRules,
  validateClinicians,
} from "@/console/store";
import { DEFAULT_SESSION_CONFIG, validateSessionConfig } from "@/session/config";
import type { AppointmentType } from "@/domain/types";
import { DEFAULT_CONFIG } from "@/engine/eligibility";
import { isSetupStep, nextStep, SETUP_STEPS, stepIndex } from "@/console/setup-steps";

const NOW = "2026-08-09T04:30:00Z";
const OWNER = "owner@demo.practice.example";
const OUTSIDER = "stranger@elsewhere.example";
const PRACTICE = { name: "Demo Family Practice", timezone: "Australia/Sydney", holdoutPercent: 10 };

const ROSTER = [
  { displayName: "Dr Amara Lee", participating: true },
  { displayName: "Dr Sam Okafor", participating: false },
];

beforeEach(() => {
  resetConsole();
  onboardPractice(PRACTICE, NOW, OWNER);
});

describe("W41 step definitions", () => {
  it("five ordered steps ending at review", () => {
    expect(SETUP_STEPS).toHaveLength(5);
    expect(SETUP_STEPS.at(-1)!.slug).toBe("review");
    expect(nextStep("review")).toBeNull();
    expect(nextStep("practice")).toBe("clinicians");
    expect(stepIndex("sessions")).toBe(2);
  });

  it("recognises only real steps", () => {
    expect(isSetupStep("clinicians")).toBe(true);
    expect(isSetupStep("nonsense")).toBe(false);
  });
});

describe("W41 clinician roster", () => {
  it("saves a roster and assigns stable ids", () => {
    expect(saveClinicians(ROSTER, NOW, OWNER)).toEqual({});
    const { clinicians } = getConsole();
    expect(clinicians.map((c) => c.id)).toEqual(["clin-1", "clin-2"]);
    expect(clinicians[0]).toMatchObject({ displayName: "Dr Amara Lee", participating: true });
  });

  it("requires at least one participating clinician", () => {
    const errors = validateClinicians([{ displayName: "Dr Solo", participating: false }]);
    expect(errors.clinicians).toMatch(/participating/i);
    expect(saveClinicians([{ displayName: "Dr Solo", participating: false }], NOW, OWNER)).toHaveProperty(
      "clinicians",
    );
    expect(getConsole().clinicians).toHaveLength(0);
  });

  it("rejects an empty roster, short names and duplicates", () => {
    expect(validateClinicians([])).toHaveProperty("clinicians");
    expect(validateClinicians([{ displayName: "X", participating: true }])).toHaveProperty("clinician-0");
    expect(
      validateClinicians([
        { displayName: "Dr Lee", participating: true },
        { displayName: "  dr lee ", participating: true },
      ]).clinicians,
    ).toMatch(/unique/i);
  });

  it("refuses a caller without the grant", () => {
    expect(saveClinicians(ROSTER, NOW, OUTSIDER)).toHaveProperty("form");
    expect(getConsole().clinicians).toHaveLength(0);
  });

  it("drops allowlisted clinicians that no longer exist", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    saveSessionConfig(
      { ...DEFAULT_SESSION_CONFIG, participatingClinicianIds: ["clin-1", "clin-2"] },
      NOW,
      OWNER,
    );
    // Roster shrinks to one — the stale id must not survive in session config.
    saveClinicians([ROSTER[0]!], NOW, OWNER);
    expect(getConsole().sessionConfig.participatingClinicianIds).toEqual(["clin-1"]);
  });

  it("falls back to 'all' when the allowlist empties out", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    saveSessionConfig({ ...DEFAULT_SESSION_CONFIG, participatingClinicianIds: ["clin-2"] }, NOW, OWNER);
    saveClinicians([{ displayName: "Dr New Person", participating: true }], NOW, OWNER);
    expect(getConsole().sessionConfig.participatingClinicianIds).toBe("all");
  });
});

describe("W41 session config validation", () => {
  it("accepts the default config", () => {
    expect(validateSessionConfig(DEFAULT_SESSION_CONFIG)).toEqual({});
  });

  it("rejects an out-of-range protected fraction", () => {
    for (const fraction of [-0.1, 1.5, Number.NaN]) {
      expect(
        validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, protectedCapacityFraction: fraction }),
      ).toHaveProperty("protectedCapacityFraction");
    }
  });

  it("rejects an inverted or non-integer window", () => {
    expect(
      validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, schedulingWindow: { startHour: 17, endHour: 9 } }),
    ).toHaveProperty("endHour");
    expect(
      validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, schedulingWindow: { startHour: 9, endHour: 9 } }),
    ).toHaveProperty("endHour");
    expect(
      validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, schedulingWindow: { startHour: 8.5, endHour: 17 } }),
    ).toHaveProperty("startHour");
    expect(
      validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, schedulingWindow: { startHour: 0, endHour: 25 } }),
    ).toHaveProperty("endHour");
  });

  it("rejects an empty type list and an empty explicit allowlist", () => {
    expect(validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, fillableTypes: [] })).toHaveProperty(
      "fillableTypes",
    );
    expect(
      validateSessionConfig({ ...DEFAULT_SESSION_CONFIG, participatingClinicianIds: [] }),
    ).toHaveProperty("participatingClinicianIds");
  });

  it("persists a valid config and audits it", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    const config = {
      ...DEFAULT_SESSION_CONFIG,
      fillableTypes: ["standard" as const],
      protectedCapacityFraction: 0.2,
      schedulingWindow: { startHour: 9, endHour: 17 },
    };
    expect(saveSessionConfig(config, NOW, OWNER)).toEqual({});
    expect(getConsole().sessionConfig).toMatchObject(config);
    expect(getConsole().auditEvents.at(-1)?.subjectId).toBe("setup:sessions");
  });

  it("refuses an allowlist naming an unknown clinician", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    expect(
      saveSessionConfig(
        { ...DEFAULT_SESSION_CONFIG, participatingClinicianIds: ["clin-99"] },
        NOW,
        OWNER,
      ),
    ).toHaveProperty("participatingClinicianIds");
  });

  it("stores a copy, not a reference the caller can mutate later", () => {
    const fillableTypes: AppointmentType[] = ["standard"];
    saveSessionConfig({ ...DEFAULT_SESSION_CONFIG, fillableTypes }, NOW, OWNER);
    fillableTypes.push("telehealth");
    expect(getConsole().sessionConfig.fillableTypes).toEqual(["standard"]);
  });
});

describe("W41 readiness and completion", () => {
  it("a fresh practice is not ready until a roster exists", () => {
    const before = setupReadiness();
    expect(before).toMatchObject({ practice: true, clinicians: false, complete: false });
    expect(completeSetup(NOW, OWNER)).toHaveProperty("form");
    expect(getConsole().setupCompletedAt).toBeNull();
  });

  it("completes once every prerequisite is met, and is idempotent", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    updateRules({ ...DEFAULT_CONFIG, minDaysSinceLastVisit: 200 }, NOW, OWNER);
    expect(completeSetup(NOW, OWNER)).toEqual({});
    const completedAt = getConsole().setupCompletedAt;
    expect(completedAt).toBe(NOW);
    expect(setupReadiness().complete).toBe(true);

    expect(completeSetup("2026-08-09T05:00:00Z", OWNER)).toEqual({});
    expect(getConsole().setupCompletedAt).toBe(completedAt); // unchanged
    expect(getConsole().auditEvents.filter((e) => e.subjectId === "setup:complete")).toHaveLength(1);
  });

  it("refuses completion from a caller without the grant", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    expect(completeSetup(NOW, OUTSIDER)).toHaveProperty("form");
    expect(getConsole().setupCompletedAt).toBeNull();
  });

  it("readiness reports each prerequisite independently", () => {
    saveClinicians(ROSTER, NOW, OWNER);
    const readiness = setupReadiness();
    expect(readiness).toMatchObject({ practice: true, clinicians: true, sessions: true, rules: true });
  });
});

// W277 verify gate: "every `practice_scoped` read in W209's register has a test that constructs at
// least two practices; the check is proved by pointing it at a one-practice fixture and watching
// it fail."
//
// Y4-1's lesson, generalised. A test asserting "practice A sees none of practice B's rows" passes
// over an EMPTY SET, which is exactly how a cross-tenant leak survived review for two years. So
// every read below is driven across two practices and asserts BOTH directions — the other
// practice's row is excluded, and this practice's own row is present — and the fixture is required
// to make the two distinguishable before either assertion is believed.
//
// The six here are the six that had never been shown a second tenant. Four are writes on
// `src/console/store.ts`, which is the module Y4-1's leak lived in.

import { beforeEach, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  TWO_TENANT_PROOFS,
  drivesTwoTenants,
  practiceScopedReads,
  tenantCoverage,
  tenantsIn,
} from "./two-tenant";
import {
  acknowledgeSetupStep,
  completeSetup,
  getConsole,
  onboardPractice,
  practiceRecord,
  resetConsole,
  saveClinicians,
  saveSessionConfig,
  setupReadiness,
} from "@/console/store";
import { getInterestState, resetInterestState, statedBy } from "@/capability/store";
import { addReferralDocuments, addReferralEvents, resetReferralRail, sentEventsFor } from "@/referrals/store";
import { DEFAULT_SESSION_CONFIG } from "@/session/config";
import type { ClinicianId, PatientId, PracticeId } from "@/domain/types";

const ROOT = path.resolve(__dirname, "../..");
const NOW = "2026-08-14T04:00:00Z";
const OWNER_A = "owner@a.practice.example";
const OWNER_B = "owner@b.practice.example";

/** Two onboarded practices, ids read back because W166 generates them. */
let A: PracticeId;
let B: PracticeId;

beforeEach(() => {
  resetConsole();
  onboardPractice({ name: "Practice A", timezone: "Australia/Sydney", holdoutPercent: 10 }, NOW, OWNER_A);
  onboardPractice({ name: "Practice B", timezone: "Australia/Perth", holdoutPercent: 20 }, NOW, OWNER_B);
  const practices = getConsole().practices;
  A = practices[0]!.practice.id;
  B = practices[1]!.practice.id;
});

describe("W277 the fixture distinguishes the two practices before anything is asserted", () => {
  it("onboards two, and they are not the same practice", () => {
    // W253's third guard: if the two tenants are indistinguishable, every exclusion below passes
    // for the wrong reason and the suite should say so rather than go green.
    expect(A).not.toBe(B);
    expect(getConsole().practices).toHaveLength(2);
    expect(practiceRecord(A)!.practice.name).not.toBe(practiceRecord(B)!.practice.name);
  });
});

describe("W277 src/console/store.ts — the module Y4-1's leak lived in", () => {
  it("saveClinicians writes to one practice and not the other", () => {
    expect(saveClinicians(A, [{ displayName: "Dr A One", participating: true }], NOW, OWNER_A)).toEqual({});
    expect(practiceRecord(A)!.clinicians.map((c) => c.displayName)).toEqual(["Dr A One"]);
    expect(practiceRecord(B)!.clinicians, "B's roster changed when A saved").toEqual([]);
  });

  it("saveSessionConfig writes to one practice and not the other", () => {
    const changed = { ...DEFAULT_SESSION_CONFIG, protectedCapacityFraction: 0.5 };
    expect(saveSessionConfig(A, changed, NOW, OWNER_A)).toEqual({});
    expect(practiceRecord(A)!.sessionConfig.protectedCapacityFraction).toBe(0.5);
    expect(
      practiceRecord(B)!.sessionConfig.protectedCapacityFraction,
      "B's session config moved when A saved",
    ).toBe(DEFAULT_SESSION_CONFIG.protectedCapacityFraction);
  });

  it("acknowledgeSetupStep advances one practice's setup and not the other's", () => {
    expect(acknowledgeSetupStep(A, "sessions", OWNER_A)).toEqual({});
    expect(practiceRecord(A)!.acknowledgedSteps, "the acknowledgement did not land on A").toContain(
      "sessions",
    );
    expect(practiceRecord(B)!.acknowledgedSteps, "B advanced when A acknowledged").toEqual([]);
  });

  it("completeSetup completes one practice and leaves the other incomplete", () => {
    // Readiness is satisfied for A only, which is the only way to show the write landing on one
    // practice: a refusal writes nothing, and a test of the refusal path would pass over two
    // practices that are both incomplete — the empty-set shape Y4-1 hid behind.
    saveClinicians(A, [{ displayName: "Dr A One", participating: true }], NOW, OWNER_A);
    saveSessionConfig(A, DEFAULT_SESSION_CONFIG, NOW, OWNER_A);
    acknowledgeSetupStep(A, "sessions", OWNER_A);
    acknowledgeSetupStep(A, "rules", OWNER_A);
    expect(setupReadiness(practiceRecord(A)).rules, "A is not ready, so the write below is a refusal").toBe(
      true,
    );

    expect(completeSetup(A, NOW, OWNER_A)).toEqual({});
    expect(practiceRecord(A)!.setupCompletedAt, "A was not completed").toBe(NOW);
    expect(practiceRecord(B)!.setupCompletedAt, "B was completed by A's call").toBeNull();
  });
});

describe("W277 the two reads no test called at all", () => {
  it("statedBy returns one practice's stated interests and not the other's", () => {
    resetInterestState();
    const clinician = "clin-shared" as ClinicianId;
    const state = getInterestState();
    // The same clinician id under two practices, which is the case the practice filter exists for
    // and the one a single-tenant fixture can never produce.
    state.byKey[`${A}::${clinician}::cond-a`] = {
      practiceId: A,
      clinicianId: clinician,
      conditionCode: "cond-a",
    } as (typeof state.byKey)[string];
    state.byKey[`${B}::${clinician}::cond-b`] = {
      practiceId: B,
      clinicianId: clinician,
      conditionCode: "cond-b",
    } as (typeof state.byKey)[string];

    const mine = statedBy(A, clinician);
    expect(mine, "A's own interest is missing, so the exclusion below proves nothing").toHaveLength(1);
    expect(mine[0]!.practiceId).toBe(A);
    expect(statedBy(B, clinician), "B sees A's interest").toHaveLength(1);
    expect(statedBy(B, clinician)[0]!.practiceId).toBe(B);
  });

  it("sentEventsFor returns one practice's referral events and not the other's", () => {
    resetReferralRail();
    const doc = (referralId: string, from: PracticeId) =>
      ({
        referralId,
        fromPracticeId: from,
        toPracticeId: "prac-receiving",
        patientId: "pat-w277" as PatientId,
        createdAt: NOW,
        createdBy: "clin-1",
      }) as unknown as Parameters<typeof addReferralDocuments>[0][number];
    addReferralDocuments([doc("ref-a", A), doc("ref-b", B)]);
    addReferralEvents([
      { practiceId: A, patientId: "pat-w277" as PatientId, referralId: "ref-a", kind: "sent", at: NOW },
      { practiceId: B, patientId: "pat-w277" as PatientId, referralId: "ref-b", kind: "sent", at: NOW },
    ] as unknown as Parameters<typeof addReferralEvents>[0]);

    const mine = sentEventsFor(A);
    expect(mine.map((e) => e.referralId), "A's own event is missing").toEqual(["ref-a"]);
    expect(sentEventsFor(B).map((e) => e.referralId), "B sees A's event").toEqual(["ref-b"]);
  });
});

describe("W277 the check itself, pointed at a one-practice fixture", () => {
  it("reports a single-practice test as single-tenant", () => {
    // The gate's own words. A detector that called everything two-tenant would certify the whole
    // register forever, which is the shape this tree keeps finding behind a green suite.
    const onePractice = 'const PRAC = "prac-a" as PracticeId;\nqueueView(PRAC);\n';
    expect(tenantsIn(onePractice)).toEqual(["prac-a"]);
    expect(drivesTwoTenants(onePractice), "one practice read as two").toBe(false);
    const twoPractices = `${onePractice}const OTHER = "prac-b" as PracticeId;\nqueueView(OTHER);\n`;
    expect(drivesTwoTenants(twoPractices), "two practices read as one").toBe(true);
  });

  it("knows both spellings the tree uses", () => {
    // Found by running it: `registers/store.test.ts` drives `practice-a` and `practice-b`, and a
    // detector that knew only `prac-` reported it as single-tenant. A narrowness only a real tree
    // exposes.
    expect(drivesTwoTenants('"practice-a" "practice-b"')).toBe(true);
    expect(drivesTwoTenants('"prac-1" "prac-2"')).toBe(true);
    expect(drivesTwoTenants('"prac-1" "prac-1"'), "the same practice twice is one tenant").toBe(false);
  });
});

describe("W277 every practice-scoped read has been shown a second tenant", () => {
  const testTexts = (): Map<string, string> => {
    const out = new Map<string, string>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".test.ts")) out.set(full, readFileSync(full, "utf8"));
      }
    };
    walk(path.join(ROOT, "src"));
    return out;
  };

  it("finds reads to check, so the coverage claim is not over nothing", () => {
    expect(practiceScopedReads(ROOT).length).toBeGreaterThan(25);
    expect(testTexts().size).toBeGreaterThan(100);
  });

  it("leaves none single-tenant, and declares no proof for a read W209 has reclassified", () => {
    const coverage = tenantCoverage(ROOT, testTexts());
    expect(coverage.singleTenant, "a practice-scoped read has never seen a second practice").toEqual([]);
    expect(coverage.stale, "a proof is declared for a read that is no longer practice-scoped").toEqual([]);
  });

  it("covers the six this unit found, through the file it declares", () => {
    // Named rather than counted: a count goes green again the day somebody adds an unrelated read,
    // and these six are the finding. Four are writes on the module Y4-1's leak lived in.
    expect(Object.keys(TWO_TENANT_PROOFS).sort()).toEqual([
      "src/capability/store.ts::statedBy",
      "src/console/store.ts::acknowledgeSetupStep",
      "src/console/store.ts::completeSetup",
      "src/console/store.ts::saveClinicians",
      "src/console/store.ts::saveSessionConfig",
      "src/referrals/store.ts::sentEventsFor",
    ]);
    const self = readFileSync(path.join(ROOT, "src/tenancy/two-tenant.test.ts"), "utf8");
    expect(drivesTwoTenants(self), "this file no longer drives two tenants by literal").toBe(true);
    for (const [read, file] of Object.entries(TWO_TENANT_PROOFS)) {
      const fn = read.split("::")[1]!;
      expect(
        readFileSync(path.join(ROOT, file), "utf8"),
        `${read} names a proof file that does not call it`,
      ).toMatch(new RegExp(`\\b${fn}\\s*\\(`));
    }
  });
});

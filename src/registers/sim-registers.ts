// W63 support: the register layer as the sim sees it.
//
// This module exists so the sim harness can turn registers on without the harness learning
// anything about registers beyond "narrow this list, order that one". It derives a synthetic
// PMS condition flag per patient, runs the real W57 → W58 → W59/W61 chain over it, and hands
// back the two functions the pooling step needs.
//
// Two deliberate constraints:
//
//   - The flag is derived from the patient id and the sim seed, NOT drawn from the sim's RNG
//     stream. Adding a draw would shift every subsequent random number and break the byte-
//     stable goldens of every existing unit. Registers-off must be indistinguishable from
//     the sim before this unit existed, and it is: nothing here runs unless enabled.
//
//   - The interval is a FIXTURE citing a placeholder source, because W56's real intervals are
//     blocked on the G5 ruling. The comparison this unit produces is therefore about the
//     MECHANISM — what changes when a register narrows and reorders sending — not about any
//     real condition's cadence. The report says so in as many words.

import type { ConditionCode, Patient, PatientId } from "@/domain/types";
import { detectCareGaps, type CareGap } from "./caregap";
import { narrowToCareGaps } from "./eligibility";
import { loadIntervals, type IntervalCatalogue } from "./intervals";
import { deriveMemberships, type PmsConditionFlag } from "./membership";
import { rankGapAware } from "./ranking";

export interface RegisterSimConfig {
  enabled: boolean;
  conditionCode: ConditionCode;
  /** Cadence of the FIXTURE interval, in months. Not a clinical value (see G5 note above). */
  intervalMonths: number;
  /** Share of the panel the synthetic PMS flags for this condition. */
  flaggedShare: number;
  /** When true, only patients with an open gap may be invited (W59 narrowing). */
  requireCareGap: boolean;
}

export const DEFAULT_REGISTER_SIM: RegisterSimConfig = {
  enabled: false,
  conditionCode: "placeholder_register_a" as ConditionCode,
  intervalMonths: 12,
  flaggedShare: 0.3,
  requireCareGap: true,
};

/** Deterministic, seed-stable, and independent of the sim's RNG stream. */
function flagged(patientId: string, seed: number, share: number): boolean {
  let h = seed >>> 0;
  for (let i = 0; i < patientId.length; i++) {
    h = (Math.imul(h ^ patientId.charCodeAt(i), 0x01000193) >>> 0) || 1;
  }
  return (h % 10_000) / 10_000 < share;
}

export function fixtureCatalogue(config: RegisterSimConfig): IntervalCatalogue {
  return loadIntervals([
    {
      id: `iv-${config.conditionCode}`,
      conditionCode: config.conditionCode,
      name: "Fixture cadence",
      intervalMonths: config.intervalMonths,
      provenance: {
        citation: "Placeholder source for the W63 register simulation — not clinical guidance",
        url: "https://example.org/not-a-guideline",
        publishedOn: "2026-01-01",
        retrievedOn: "2026-08-10",
      },
    },
  ]);
}

export interface RegisterLayer {
  /** Patients on the register, by id. */
  memberIds: ReadonlySet<string>;
  gaps: readonly CareGap[];
  /** Narrow an eligible set to those with an open gap (no-op when requireCareGap is false). */
  narrow: (eligible: Patient[]) => Patient[];
  /** W61 ranking, ready to hand to buildInvitationPool. */
  rank: (eligible: Patient[]) => Patient[];
}

/**
 * Build the register layer for a practice at a point in time. Recomputed per week by the
 * caller, because gaps close as patients attend — that closure is the effect the unit
 * measures.
 */
export function buildRegisterLayer(
  patients: readonly Patient[],
  config: RegisterSimConfig,
  seed: number,
  todayIso: string,
): RegisterLayer {
  const catalogue = fixtureCatalogue(config);
  const flags: PmsConditionFlag[] = patients.map((p) => ({
    patientId: p.id,
    conditionCode: config.conditionCode,
    present: flagged(p.id as string, seed, config.flaggedShare),
  }));

  const memberships = deriveMemberships(
    {
      practiceId: patients[0]?.practiceId ?? ("prac-sim" as Patient["practiceId"]),
      patients,
      conditionFlags: flags,
      confirmations: [],
      enabledConditions: [config.conditionCode],
    },
    `${todayIso}T00:00:00Z`,
  );

  const byId = new Map(patients.map((p) => [p.id as string, p]));
  const gaps = detectCareGaps(
    catalogue,
    memberships.map((m) => ({
      membership: m,
      lastRelevantVisit: byId.get(m.patientId as string)?.lastAttendedAt ?? null,
    })),
    todayIso,
  );

  return {
    memberIds: new Set(memberships.map((m) => m.patientId as string)),
    gaps,
    narrow: (eligible: Patient[]) => (config.requireCareGap ? narrowToCareGaps(eligible, gaps) : eligible),
    rank: (eligible: Patient[]) => rankGapAware(eligible, gaps),
  };
}

/** Patient ids on the register — used by the comparison to report register reach. */
export function registerMemberIds(
  patients: readonly Patient[],
  config: RegisterSimConfig,
  seed: number,
): Set<PatientId> {
  return new Set(
    patients.filter((p) => flagged(p.id as string, seed, config.flaggedShare)).map((p) => p.id),
  );
}

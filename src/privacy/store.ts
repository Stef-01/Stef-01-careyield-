// W33: privacy store (mock, synthetic only — same globalThis posture as the other
// console stores). Holds the practice's retention config, deletion records and the
// suppression list; the patient-touching dataset itself lives in the rail store.

import { getStore } from "@/booking/store";
import {
  applyRetention,
  DEFAULT_RETENTION,
  deletePatient,
  exportPatientData,
  isSuppressed,
  type DeletionRecord,
  type PatientExport,
  type PrivacyDataset,
  type RetentionConfig,
  type SuppressionEntry,
} from "./privacy";

export interface PrivacyState {
  retention: RetentionConfig;
  deletions: DeletionRecord[];
  suppressions: SuppressionEntry[];
}

const globalStore = globalThis as { __careyieldPrivacy?: PrivacyState };

function initial(): PrivacyState {
  return { retention: { ...DEFAULT_RETENTION }, deletions: [], suppressions: [] };
}

export function getPrivacy(): PrivacyState {
  globalStore.__careyieldPrivacy ??= initial();
  return globalStore.__careyieldPrivacy;
}

export function resetPrivacy(): PrivacyState {
  globalStore.__careyieldPrivacy = initial();
  return globalStore.__careyieldPrivacy;
}

function railDataset(): PrivacyDataset {
  const rail = getStore();
  return {
    invitations: rail.state.invitations,
    appointments: rail.state.appointments,
    auditEvents: rail.state.auditEvents,
    outcomes: [], // W15 outcome records are stored de-identified (patient labels, not ids)
  };
}

export function exportForPatient(patientId: string, nowIso: string): PatientExport & { suppressed: boolean } {
  return {
    ...exportPatientData(railDataset(), patientId, nowIso),
    suppressed: isSuppressed(getPrivacy().suppressions, patientId),
  };
}

export function deletePatientEverywhere(patientId: string, nowIso: string): DeletionRecord {
  const rail = getStore();
  const result = deletePatient(railDataset(), patientId, nowIso);
  rail.state = {
    invitations: result.dataset.invitations,
    appointments: result.dataset.appointments,
    auditEvents: result.dataset.auditEvents,
  };
  const privacy = getPrivacy();
  privacy.deletions.push(result.deletion);
  privacy.suppressions.push(result.suppression);
  return result.deletion;
}

export function runRetention(nowIso: string): void {
  const rail = getStore();
  const pruned = applyRetention(railDataset(), getPrivacy().retention, nowIso);
  rail.state = {
    invitations: pruned.invitations,
    appointments: pruned.appointments,
    auditEvents: pruned.auditEvents,
  };
}

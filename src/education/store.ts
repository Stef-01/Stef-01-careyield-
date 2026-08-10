// W151: where the education library and CPD entries live for a running console.
//
// The modules that decide things are pure — W145 orders, W148 matches triggers, W149 folds a
// trail — and this holds what they read. One decision worth stating:
//
//   THE LIBRARY IS NOT PRACTICE-SCOPED; THE CPD TRAIL IS CLINICIAN-SCOPED. Material is content,
//   like a pathway (W127), so per-practice copies would mean N versions of a document with no
//   single answer to what was published. A clinician's reading record is the opposite: it is
//   about one person, and W149 refused any read that returns somebody else's.

import type { EducationItem } from "./curation";
import type { CpdEntry } from "./cpd";
import type { CaseTrigger } from "./triggers";

interface EducationState {
  items: EducationItem[];
  triggers: CaseTrigger[];
  cpd: CpdEntry[];
}

const globalStore = globalThis as { __meherrEducation?: EducationState };

function state(): EducationState {
  globalStore.__meherrEducation ??= { items: [], triggers: [], cpd: [] };
  return globalStore.__meherrEducation;
}

export function resetEducation(): void {
  globalStore.__meherrEducation = { items: [], triggers: [], cpd: [] };
}

export function getLibrary(): readonly EducationItem[] {
  return state().items;
}

export function getTriggers(): readonly CaseTrigger[] {
  return state().triggers;
}

export function addLibraryItems(items: readonly EducationItem[]): void {
  state().items.push(...items);
}

export function addTriggers(triggers: readonly CaseTrigger[]): void {
  state().triggers.push(...triggers);
}

export function addCpdEntries(entries: readonly CpdEntry[]): void {
  state().cpd.push(...entries);
}

/**
 * CPD entries for one clinician.
 *
 * Takes the clinician id as the query, and there is deliberately no sibling returning everyone's
 * — W149's absence, preserved at the storage layer so it cannot be reintroduced by a page that
 * "just needs the list".
 */
export function cpdEntriesFor(clinicianId: string): CpdEntry[] {
  return state().cpd.filter((entry) => entry.clinicianId === clinicianId);
}

/** Every CPD entry, for erasure and reset only. Never for a view. */
export function scrubClinicianCpd(clinicianId: string): number {
  const before = state().cpd.length;
  state().cpd = state().cpd.filter((entry) => entry.clinicianId !== clinicianId);
  return before - state().cpd.length;
}

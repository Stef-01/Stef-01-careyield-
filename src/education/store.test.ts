// W151 verify gate (unit half): the storage layer keeps W149's absence.
//
// Q9–Q11 have found the same class of bug five times: a fold over a collection that is correct
// for one row and wrong for two, or right only because the fixture happened to be ordered
// conveniently. So every scoping assertion here uses TWO clinicians and runs BOTH orders.

import { beforeEach, describe, expect, it } from "vitest";
import * as storeModule from "./store";
import {
  addCpdEntries,
  addLibraryItems,
  addTriggers,
  cpdEntriesFor,
  getLibrary,
  getTriggers,
  resetEducation,
  scrubClinicianCpd,
} from "./store";
import { recordCpdEntry, trailFor, type CpdEntry } from "./cpd";
import type { EducationItem } from "./curation";

const item = (itemId: string, conditionCode: string): EducationItem => ({
  itemId,
  conditionCode,
  title: `Placeholder material ${itemId}.`,
  sourceRef: `src-${itemId}`,
  relevantFactCodes: [],
});

function entry(entryId: string, clinicianId: string, at: string): CpdEntry {
  const result = recordCpdEntry(
    {
      entryId, clinicianId, kind: "opened", itemId: "item-a",
      sourceRef: "src-item-a", itemTitle: "Placeholder material item-a.", at,
    },
    [],
  );
  if (!result.ok) throw new Error(`fixture rejected: ${result.errors.join(", ")}`);
  return result.entry;
}

const MINE_EARLY = entry("e1", "clin-1", "2026-03-01");
const THEIRS = entry("e2", "clin-2", "2026-03-02");
const MINE_LATE = entry("e3", "clin-1", "2026-03-03");
const BOTH = [MINE_EARLY, THEIRS, MINE_LATE];

beforeEach(() => {
  resetEducation();
});

describe("W151 the CPD trail stays the clinician's", () => {
  it("exports no read that returns anybody else's entries", () => {
    // W149 tested this over its own module. The storage layer is where it would be reintroduced,
    // by a page that "just needs the list" — so the absence is asserted where the list lives.
    for (const name of Object.keys(storeModule)) {
      expect(name, `"${name}" reads as a cross-clinician view`).not.toMatch(
        /allCpd|everyCpd|practice|team|everyone|byPractice|compliance|outstanding|whoHas|unread/i,
      );
    }
  });

  it("returns only the queried clinician's entries, in either insertion order", () => {
    for (const order of [BOTH, [...BOTH].reverse()]) {
      resetEducation();
      addCpdEntries(order);
      expect(cpdEntriesFor("clin-1").map((e) => e.entryId).sort()).toEqual(["e1", "e3"]);
      expect(cpdEntriesFor("clin-2").map((e) => e.entryId)).toEqual(["e2"]);
      expect(JSON.stringify(cpdEntriesFor("clin-1"))).not.toContain("clin-2");
    }
  });

  it("gives a clinician with no entries an empty list rather than everyone's", () => {
    addCpdEntries(BOTH);
    expect(cpdEntriesFor("clin-nobody")).toEqual([]);
  });

  it("hands W149 a trail that is already scoped, so the fold cannot widen it", () => {
    addCpdEntries(BOTH);
    const trail = trailFor(cpdEntriesFor("clin-1"), "clin-1");
    expect(trail.entries.map((e) => e.entryId)).toEqual(["e1", "e3"]);
  });

  it("scrubs one clinician's entries and leaves the other's, in either order", () => {
    for (const order of [BOTH, [...BOTH].reverse()]) {
      resetEducation();
      addCpdEntries(order);
      expect(scrubClinicianCpd("clin-1")).toBe(2);
      expect(cpdEntriesFor("clin-2").map((e) => e.entryId)).toEqual(["e2"]);
      expect(cpdEntriesFor("clin-1")).toEqual([]);
    }
  });
});

describe("W151 the library is content, not practice data", () => {
  it("holds one library rather than a copy per practice", () => {
    // A per-practice copy would mean N versions of a document with no single answer to what was
    // published — the reason W127 declined to scope the pathway catalogue either.
    for (const name of Object.keys(storeModule)) {
      expect(name, `"${name}" scopes the library`).not.toMatch(/libraryFor|itemsFor|triggersFor/);
    }
    addLibraryItems([item("item-a", "placeholder_register_a")]);
    expect(getLibrary().map((i) => i.itemId)).toEqual(["item-a"]);
  });

  it("ships empty, and a reset returns it to empty", () => {
    expect(getLibrary()).toEqual([]);
    expect(getTriggers()).toEqual([]);
    addLibraryItems([item("item-a", "placeholder_register_a")]);
    addTriggers([
      { conditionCode: "placeholder_register_a", factCode: "fact_a", requires: "recorded_present", rationale: "Placeholder." },
    ]);
    addCpdEntries([MINE_EARLY]);
    resetEducation();
    expect(getLibrary()).toEqual([]);
    expect(getTriggers()).toEqual([]);
    expect(cpdEntriesFor("clin-1")).toEqual([]);
  });
});

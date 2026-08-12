// W232: the Q18 dossier's arithmetic, checked against the tree it was derived from.
//
// A dossier is read by a founder deciding what to schedule, and its value is entirely in the
// numbers being current. "Up to 24 more messages" is true on the day it is written and becomes a
// lie silently — somebody changes a pool constant, and nobody re-reads the document.
//
// So these are not tests of the prose. Every figure in the dossier is re-derived from SOURCE
// rather than from the Q18 units' own documents, which is the distinction W207 had to make: a
// dossier that quotes the modules it prices is a dossier that agrees with itself.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_POOL_CONFIG, batchSize } from "@/engine/pool";
import { ENABLED_COUPLINGS, MIN_REASON_LENGTH, REFUSED_COUPLINGS } from "@/capacity/coupling";
import { REFUSED_OPENING_FIELDS } from "@/capacity/opening";
import { DEFAULT_GUARDRAILS } from "@/guardrails/monitors";
import { RECORD_CLASSES } from "@/privacy/record-classes";
import { driftReport } from "@/capacity/drift";
import type { RecordedWeek, SessionPattern } from "@/capacity/model";

const ROOT = process.cwd();
const DOSSIER = readFileSync(path.join(ROOT, "docs", "DOSSIER-Q18.md"), "utf8");
const CAPACITY = path.join(ROOT, "src", "capacity");

const capacityModules = () =>
  readdirSync(CAPACITY)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => `src/capacity/${file}`)
    .sort();

const week = (dateIso: string, filled: number): RecordedWeek => ({
  dateIso,
  filled,
  offerable: 10,
  released: 0,
});

const drifted = (): SessionPattern => {
  const fills = [5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0];
  const weeks = fills.map((filled, index) =>
    week(new Date(Date.UTC(2026, 0, 1 + index * 7)).toISOString().slice(0, 10), filled),
  );
  return {
    practiceId: "prac-1",
    clinicianId: "cli-0",
    weekday: 4,
    weeks,
    basis: { recordedWeeks: weeks.length, fromIso: weeks[0]!.dateIso, toIso: weeks.at(-1)!.dateIso },
  };
};

describe("W232 the headline arithmetic comes from the pool, not from Q18", () => {
  it("re-derives the message count six extra slots authorises", () => {
    // THE FINDING. A practice acting on a forecast changes how many people are contacted with no
    // Q18 code path involved, because the batch is sized from the diary. Derived here rather
    // than quoted, so a change to the pool constants fails this document.
    expect(DEFAULT_POOL_CONFIG.expectedResponseRate).toBe(0.25);
    expect(DEFAULT_POOL_CONFIG.maxInvitesPerSession).toBe(40);
    expect(batchSize(6, DEFAULT_POOL_CONFIG)).toBe(24);
    expect(DOSSIER).toContain("up to 24 more messages");
    expect(DOSSIER).toContain("`0.25`");
    expect(DOSSIER).toContain("`40`");
  });

  it("states the cap, because the effect is real AND bounded", () => {
    // A dossier that reported the increase without the ceiling would be arguing rather than
    // pricing. The cap is what stops the finding being alarming as well as true.
    expect(batchSize(1_000, DEFAULT_POOL_CONFIG)).toBe(DEFAULT_POOL_CONFIG.maxInvitesPerSession);
    expect(DOSSIER).toContain("capped at 40 per");
  });

  it("names the guardrails that are the only brake, with their real thresholds", () => {
    expect(DEFAULT_GUARDRAILS.maxOptOutRatePct).toBe(2);
    expect(DEFAULT_GUARDRAILS.maxGeneratedDnaRatePct).toBe(10);
    expect(DOSSIER).toContain("opt-out rate above 2%");
    expect(DOSSIER).toContain("generated-DNA rate above 10%");
  });
});

describe("W232 the coupling's state is re-derived, not quoted", () => {
  it("checks that it really is off and really is unwired", () => {
    // W231 claims both. A dossier repeating a module's claim about itself has checked nothing.
    //
    // Scoped to PRODUCT code across `src/` and `app/`, recursively. Tests and registries are
    // excluded deliberately: `cdss-boundary.test.ts` imports every declared module by design and
    // this file imports it to check it, and counting either as "wired" would make the claim
    // unstateable. The first draft scanned one directory level and only `src/`, which would have
    // missed a page importing it — the surface a coupling would actually be wired from.
    expect(ENABLED_COUPLINGS).toEqual([]);
    const importers: string[] = [];
    const walk = (dir: string, rel: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const relPath = `${rel}/${entry.name}`;
        if (entry.isDirectory()) {
          if (relPath === "src/capacity") continue;
          walk(full, relPath);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) continue;
        if (readFileSync(full, "utf8").includes("@/capacity/coupling")) importers.push(relPath);
      }
    };
    walk(path.join(ROOT, "src"), "src");
    walk(path.join(ROOT, "app"), "app");
    expect(importers, "product code outside src/capacity/ imports the coupling").toEqual([]);
    expect(DOSSIER).toContain("`ENABLED_COUPLINGS` is empty and nothing outside");
  });

  it("counts the refused couplings rather than asserting there are some", () => {
    expect(Object.keys(REFUSED_COUPLINGS)).toHaveLength(6);
    expect(DOSSIER).toContain("Six ways of doing it wrong are refused by name");
    expect(DOSSIER).toContain("refuses six ways of getting this wrong");
  });

  it("carries the enablement reason's real minimum length", () => {
    expect(MIN_REASON_LENGTH).toBe(40);
    expect(DOSSIER).toContain("at least 40 characters long");
  });
});

describe("W232 the drift finding is pinned against the list it corrected", () => {
  it("names the practice's own action among the causes to check", () => {
    // The only code change in this unit, and the reason it is checked here rather than only in
    // W228's own file: the dossier claims the line exists, so removing it must fail the dossier
    // too. A finding recorded in a document nobody re-derives is PRIV-3's failure.
    const report = driftReport(drifted());
    expect(report.verdict).toBe("drifted");
    expect(report.wouldSettleIt.join(" ")).toContain("opened more slots");
    expect(DOSSIER).toContain("It did not name the one cause a reader of this page is");
  });

  it("says the change is a completion of an existing list, not a new position", () => {
    // W207's discipline: a dossier prices decisions, it does not take them. One line added to a
    // list is the most a dossier may do, and saying so is what keeps that boundary readable.
    expect(DOSSIER).toContain("the only code change in\nthis unit");
  });
});

describe("W232 what the dossier says is sound, is sound", () => {
  it("re-derives the Q18 privacy classification count", () => {
    const declared = RECORD_CLASSES.filter((c) => c.module.startsWith("src/capacity/"));
    expect(declared.map((c) => c.module).sort()).toEqual(capacityModules());
    expect(declared.every((c) => c.handling === "no_patient_identity")).toBe(true);
    expect(DOSSIER).toContain("by type rather than by scrubbing");
    expect(DOSSIER).toContain("invariant under erasure");
  });

  it("re-derives the recommendation's refused fields", () => {
    expect(Object.keys(REFUSED_OPENING_FIELDS).length).toBeGreaterThan(3);
    expect(DOSSIER).toContain("`REFUSED_OPENING_FIELDS` states why each is refused");
  });
});

describe("W232 the asks are asks, and the non-asks are marked", () => {
  it("carries G9 forward rather than re-pricing it", () => {
    // W207's rule about not re-arguing a settled position, applied to a quarter dossier.
    expect(DOSSIER).toContain("unchanged and carried from `docs/GATE-DOSSIER-Y4.md`");
    expect(DOSSIER).toContain("It does not re-price G9");
  });

  it("names the capacity-page holdout as an option without proposing it", () => {
    // The difference between pricing a decision and making one. An ask that smuggled in a
    // proposal would be the loop deciding something it is not allowed to decide.
    expect(DOSSIER).toContain("naming it here is not proposing it");
    expect(DOSSIER).toContain("It does not\npropose a capacity-page holdout arm");
  });

  it("states what each ask releases, including the ones that release nothing", () => {
    // W207's shape. "Releases: nothing" is the useful half — it stops a cheap decision being
    // scheduled behind an expensive one because both looked like asks.
    const releases = DOSSIER.match(/\*Releases: [^*]+\*/g) ?? [];
    expect(releases.length).toBe(4);
    expect(releases.filter((line) => line.includes("nothing")).length).toBeGreaterThan(1);
  });
});

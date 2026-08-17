// W258 verify gate: "W201's decision register re-derived against everything Y5 added, not assumed
// to have survived; the published notice regenerated from it."
//
// "Not assumed to have survived" is the clause with teeth, and W200's gate is where its shape came
// from: four of its properties survived on their own construction and the fifth had quietly stopped
// being enforced anywhere, and no amount of re-reading would have told them apart. So a
// re-derivation that reported "all held" would be the failure, not the pass — and the assertions
// below check that each entry names a real Y5 subject, cites an assertion that exists, and that the
// repaired ones are pinned at the modules that exposed them.

import { readFileSync } from "node:fs";
import path from "node:path";
import { unresolved } from "@/quality/citations";
import { describe, expect, it } from "vitest";
import * as mod from "./adm-y5";
import { ADM_REDERIVATIONS, Y5_FIRST_UNIT, rederivationSummary, reviewedAgainst } from "./adm-y5";
import { Y5_FIRST_UNIT as RAIL_Y5_FIRST_UNIT } from "@/compliance/rail-y5";
import {
  AUTOMATED_DECISIONS,
  DETECTOR_SCANS,
  NOTICE_REVISION,
  PERSON_REFERENCE_TERMS,
  declaredModules,
  pageCopy,
} from "./automated-decisions";
import { RECORD_CLASSES } from "./record-classes";
import { ACCEPTED_FINDINGS, sweepSurface, unaccepted } from "@/compliance/public-surfaces";

const ROOT = process.cwd();

describe("W258 the re-derivation has a subject, and it is Y5", () => {
  it("names a Y5 surface and a checkable assertion for every claim", () => {
    expect(ADM_REDERIVATIONS.length).toBeGreaterThan(4);
    for (const entry of ADM_REDERIVATIONS) {
      expect(entry.claim.length, "a claim stated in a phrase").toBeGreaterThan(40);
      expect(entry.y5Surface.length, `${entry.claim} names no Y5 surface`).toBeGreaterThan(80);
      expect(entry.finding.length, `${entry.claim} is asserted, not re-derived`).toBeGreaterThan(200);
      expect(entry.assertedBy, `${entry.claim} names no test`).toMatch(/\.test\.ts ::/);
    }
  });

  it("cites tests that exist, and assertions that exist inside them", () => {
    // A re-derivation citing a test nobody wrote reads as coverage. Both halves are checked: the
    // file, and the `it(...)` name after the `::`.
    // W301: resolved through the shared resolver. The inline version reported a `toContain`
    // failure that named neither the citation nor which half of it was wrong.
    expect(unresolved(ROOT, ADM_REDERIVATIONS.map((e) => e.assertedBy))).toEqual([]);
    expect(ADM_REDERIVATIONS.length, "no re-derivation is cited, so this checks nothing").toBeGreaterThan(0);
  });

  it("does not report that everything held", () => {
    // THE POINT OF THE GATE. W200's re-derivation found four properties intact and one that had
    // quietly stopped being enforced, and a document saying "still holds" against each would have
    // been indistinguishable from one that had checked. A re-derivation with nothing repaired in it
    // is a re-derivation to be suspicious of, so the suite refuses one.
    const repaired = ADM_REDERIVATIONS.filter((r) => r.outcome === "repaired");
    expect(repaired.length, "nothing was repaired; re-read rather than re-checked?").toBeGreaterThan(0);
    expect(ADM_REDERIVATIONS.filter((r) => r.outcome === "held").length).toBeGreaterThan(0);
    expect(rederivationSummary().repaired).toBe(repaired.length);
  });

  it("keeps one definition of where Y5 starts", () => {
    // W259 declared it first. Two constants naming the same boundary are two things to keep in
    // step, and the one that drifts is always the copy — so they are asserted equal here.
    expect(Y5_FIRST_UNIT).toBe(RAIL_Y5_FIRST_UNIT);
  });
});

describe("W258 the detector's reach is the thing that was re-derived", () => {
  it("reads W106's reviewed classification rather than a fourth pattern", () => {
    // The join, asserted from this side too. W106 answers "does this module hold patient identity"
    // by a person having read it; W201 answered it by regex. Every module the reviewed register
    // marks `stored` or `derived` must now be classified by the register that publishes the notice.
    const holds = RECORD_CLASSES.filter((c) => c.handling !== "no_patient_identity").map((c) => c.module);
    expect(holds.length, "no module holds patient records, so this proves nothing").toBeGreaterThan(8);
    const classified = new Set(declaredModules());
    for (const module of holds) {
      expect(classified, `W106 says ${module} holds patient records and W201 does not classify it`).toContain(
        module,
      );
    }
  });

  it("pins the four modules the re-derivation found, by name", () => {
    // Named rather than counted: a count goes green again the day somebody adds an unrelated
    // module, and these four are the finding.
    const classified = new Set(declaredModules());
    for (const module of [
      "src/privacy/state.ts",
      "src/outcomes/dashboard.ts",
      "src/interest/store.ts",
      "src/reporting/report.ts",
    ]) {
      expect(classified, `${module} has fallen out of the register again`).toContain(module);
    }
  });

  it("counts the scans from the list rather than from a sentence", () => {
    expect(rederivationSummary().scans).toBe(DETECTOR_SCANS.length);
    expect(rederivationSummary().decisions).toBe(AUTOMATED_DECISIONS.length);
    expect(rederivationSummary().modules).toBe(declaredModules().length);
  });
});

describe("W258 the notice is regenerated from the register", () => {
  it("was reviewed against the register as it stands", () => {
    expect(reviewedAgainst()).toBe(NOTICE_REVISION);
    expect(NOTICE_REVISION.decisionsAtReview).toBe(AUTOMATED_DECISIONS.length);
    expect(NOTICE_REVISION.modulesAtReview).toBe(declaredModules().length);
    // W262: this pinned the literal `"W258"`, and the two controls then contradicted each other.
    // W201's test says "re-read the notice and MOVE the date" when the classified set changes;
    // this said the date must still be the one W258 set. The next author's only options were to
    // leave a stale review record or to edit this pin — and editing a pin to make a stated review
    // date true again is precisely the bump the control exists to prevent. So it now checks the
    // record names a REAL unit rather than a fixed one, which keeps the force (the counts beside
    // it must still match the register) without forbidding the move it demands.
    expect(NOTICE_REVISION.reviewedAt, "the review record names no unit").toMatch(/^W\d+$/);
    expect(
      readFileSync(path.join(process.cwd(), "BUILD-STATE.md"), "utf8"),
      `${NOTICE_REVISION.reviewedAt} is not a unit the ledger has`,
    ).toContain(`| ${NOTICE_REVISION.reviewedAt} |`);
  });

  it("hands the sweep the WHOLE notice, including the prose the page used to own", () => {
    // Non-vacuity for the move: the sweep is only worth running over text it actually receives.
    const copy = pageCopy();
    expect(copy).toContain("How Meherr uses automated decision-making");
    expect(copy).toContain("Last reviewed");
    expect(copy).toContain("10 December 2026");
    expect(unaccepted(sweepSurface("/privacy/automated-decisions", "patient_notice", copy), ACCEPTED_FINDINGS)).toEqual(
      [],
    );
  });

  it("would still catch a claim in the part that was just added", () => {
    // The scan is proved to fire on the NEW text specifically, not merely on the page as a whole.
    // A clean sweep over text nobody could fail is the vacuous version of this check.
    const planted = `${pageCopy()}\nRated 5/5 by our patients.`;
    expect(
      unaccepted(sweepSurface("/privacy/automated-decisions", "patient_notice", planted), ACCEPTED_FINDINGS).length,
    ).toBeGreaterThan(0);
  });
});

describe("W258 this module is itself accounted for", () => {
  it("holds nothing the register would have to classify, and says so", () => {
    // Asserted rather than inferred. "The register does not mention this module" and "nobody
    // checked this module" look identical from outside, which is the reason `NOT_A_DECISION`
    // exists at all — so the three things that would make this file classifiable are each denied.
    const source = readFileSync(path.join(ROOT, "src/privacy/adm-y5.ts"), "utf8");
    for (const term of Object.keys(PERSON_REFERENCE_TERMS)) {
      expect(source, `this module names ${term} and must be classified`).not.toMatch(
        new RegExp(`\\b${term}\\b`),
      );
    }
    expect(source).not.toMatch(/^export type [A-Za-z]*(Reason|Refusal|Exclusion|Verdict)\b/m);
    expect(RECORD_CLASSES.map((c) => c.module)).not.toContain("src/privacy/adm-y5.ts");
    expect(declaredModules()).not.toContain("src/privacy/adm-y5.ts");
  });

  it("computes nothing about anybody", () => {
    expect(Object.keys(mod).filter((n) => /patient|candidate|person/i.test(n))).toEqual([]);
  });
});

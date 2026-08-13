// W283 verify gate: "the predicate observes what the ranker returns for constructed inputs rather
// than matching a comparison in its source; rewording the comparison no longer silences the
// finding."
//
// The second clause is the one worth writing as an assertion rather than as a claim, so it is:
// `REFERENCE_CLINICAL_RANKER` orders on the clinical attribute and contains no
// `a.chronicCare !== b.chronicCare`, and the two facts are checked in the same test.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rankCandidates } from "@/engine/pool";
import { rankGapAware } from "@/registers/ranking";
import { LATENT_FINDINGS } from "./latent-findings";
import { FINDING_ANCHORS, deadAnchors } from "./latent-y5";
import {
  REFERENCE_BLIND_RANKER,
  REFERENCE_CLINICAL_RANKER,
  WHAT_A_FALSE_MEANS,
  clinicalAttributeOutranksEveryOtherKey,
  observesClinicalAttribute,
  probeDiscriminates,
  tiedPanel,
  type Ranker,
} from "./ranker-behaviour";
import type { Patient } from "@/domain/types";

/** The predicate W283 removed, kept here as the thing being compared against. */
const OLD_SOURCE_PREDICATE = /a\.chronicCare !== b\.chronicCare/;

describe("W283 the probe answers about behaviour, in both directions", () => {
  it("reports the live ranker as ordering on the clinical attribute", () => {
    expect(observesClinicalAttribute(rankCandidates)).toBe(true);
    expect(clinicalAttributeOutranksEveryOtherKey(rankCandidates)).toBe(true);
  });

  it("reports a ranker that cannot read the attribute as not ordering on it", () => {
    // Non-vacuity. A probe that answered `true` for everything would certify MATCH-1 as live
    // forever, which is the same nothing as one that answered `false` for everything.
    expect(observesClinicalAttribute(REFERENCE_BLIND_RANKER)).toBe(false);
    expect(clinicalAttributeOutranksEveryOtherKey(REFERENCE_BLIND_RANKER)).toBe(false);
  });

  it("separates 'reads the attribute' from 'the attribute decides'", () => {
    // Two different claims, and MATCH-1 rests on the weaker one. A ranker consulting `chronicCare`
    // only after the overdue key still orders patients by how unwell they are, which is what the
    // published notice denies — so the finding's conjunct must not require dominance.
    const overdueFirstThenClinical: Ranker = (eligible) =>
      [...eligible].sort((a, b) => {
        const aSeen = a.lastAttendedAt ?? "9999-12-31";
        const bSeen = b.lastAttendedAt ?? "9999-12-31";
        if (aSeen !== bSeen) return aSeen < bSeen ? -1 : 1;
        if (a.chronicCare !== b.chronicCare) return a.chronicCare ? -1 : 1;
        return a.id < b.id ? -1 : 1;
      });
    expect(observesClinicalAttribute(overdueFirstThenClinical)).toBe(true);
    expect(clinicalAttributeOutranksEveryOtherKey(overdueFirstThenClinical)).toBe(false);
  });
});

describe("W283 rewording the comparison no longer silences the finding", () => {
  it("is silenced by a rewording under the old predicate and not under the new one", () => {
    // The unit, in one test. `REFERENCE_CLINICAL_RANKER` orders chronic-care patients first by any
    // measure of what it DOES, and the regex MATCH-1 used to run reports it as not ordering on the
    // attribute at all — because it extracts a helper and destructures the field, which are two of
    // the three refactors W268 predicted would kill the anchor.
    expect(OLD_SOURCE_PREDICATE.test(REFERENCE_CLINICAL_RANKER.toString())).toBe(false);
    expect(observesClinicalAttribute(REFERENCE_CLINICAL_RANKER)).toBe(true);
    expect(clinicalAttributeOutranksEveryOtherKey(REFERENCE_CLINICAL_RANKER)).toBe(true);
  });

  it("is a real predicate rather than a strawman, checked without pinning the live tree", () => {
    // Guards the test above against being a statement about a regex nobody could ever satisfy —
    // and pinned to the SPELLING AS IT WAS, not to `src/engine/pool.ts` as it is. Running this
    // against the live ranker was the first draft, and the mutation for this unit caught it: a
    // rewording turned it red, which is the false alarm W283 exists to remove, reintroduced by
    // the file removing it.
    const preW283Spelling = "if (a.chronicCare !== b.chronicCare) return a.chronicCare ? -1 : 1;";
    expect(OLD_SOURCE_PREDICATE.test(preW283Spelling)).toBe(true);
  });

  it("sees a second ranker the file-anchored predicate could never have seen", () => {
    // `rankGapAware` partitions on care gaps and delegates each side to `rankCandidates`, so it
    // orders on the clinical attribute too — in a different file. The old predicate read exactly
    // one path, `src/engine/pool.ts`, and a probe that takes a ranker can be pointed anywhere.
    const gapless: Ranker = (eligible) => rankGapAware(eligible, []);
    expect(observesClinicalAttribute(gapless)).toBe(true);
    expect(clinicalAttributeOutranksEveryOtherKey(gapless)).toBe(true);
  });
});

describe("W283 the probe refuses to answer over a fixture that proves nothing", () => {
  it("refuses a panel that is not tied on every other field", () => {
    // W252's rule: the guard lives inside the checker. An untied panel means a moved order could
    // be the other field's doing, and a boolean returned in that state is a statement about a
    // fixture rather than about a ranker.
    const untied: Patient[] = tiedPanel(2).map((p, i) => ({
      ...p,
      lastAttendedAt: i === 0 ? "2019-01-01" : "2026-01-01",
    }));
    expect(() => observesClinicalAttribute(REFERENCE_BLIND_RANKER, untied)).toThrow(/not tied/);
  });

  it("refuses a panel too small to have an order", () => {
    expect(() => observesClinicalAttribute(rankCandidates, tiedPanel(1))).toThrow(/fewer than two/);
  });

  it("refuses a ranker that does not return a permutation of its input", () => {
    // The load-bearing one. A ranker returning nothing gives an identical order for every flip and
    // would be certified as ignoring the attribute — a clean `false` over an empty list.
    const dropsEveryone: Ranker = () => [];
    expect(() => observesClinicalAttribute(dropsEveryone)).toThrow(/permutation/);
    const inventsOne: Ranker = (eligible) => [...eligible, { ...eligible[0]!, id: eligible[0]!.id }];
    expect(() => observesClinicalAttribute(inventsOne)).toThrow(/permutation/);
  });

  it("is not fooled by a ranker that returns its input untouched", () => {
    // `clinicalAttributeOutranksEveryOtherKey` runs both input orders for this reason — W280's
    // lesson. A no-op ranker hands back whichever patient the fixture listed first, and a
    // one-order check would read that as the clinical attribute deciding.
    const noOp: Ranker = (eligible) => [...eligible];
    expect(clinicalAttributeOutranksEveryOtherKey(noOp)).toBe(false);
    expect(observesClinicalAttribute(noOp)).toBe(false);
  });
});

describe("W283 MATCH-1 is anchored to the probe rather than to a file's text", () => {
  it("carries an anchor that discriminates, and no anchor is dead", () => {
    expect(probeDiscriminates()).toBe(true);
    const match1 = FINDING_ANCHORS.find((a) => a.id === "MATCH-1");
    expect(match1, "MATCH-1 lost its anchor").toBeDefined();
    expect(match1!.holds()).toBe(true);
    expect(match1!.claim).toMatch(/probe/);
    expect(deadAnchors()).toEqual([]);
  });

  it("leaves the finding open and unfired, for the reason it was always unfired", () => {
    // The ordering half is true and stays true; the liveness half is what keeps MATCH-1 latent.
    // Swapping the predicate must not change that answer — a re-anchoring that also flipped the
    // finding would be a different unit, and one only the founder can authorise.
    const match1 = LATENT_FINDINGS.find((f) => f.id === "MATCH-1")!;
    expect(match1.status).toBe("open");
    expect(match1.trigger()).toBe(false);
    expect(observesClinicalAttribute(rankCandidates), "the ordering half is still true").toBe(true);
  });

  it("says what a false answer does not mean", () => {
    expect(WHAT_A_FALSE_MEANS).toMatch(/does NOT mean/);
    expect(WHAT_A_FALSE_MEANS).toMatch(/total tiebreak/);
  });

  it("reads no source file to decide whether the ranker orders on the attribute", () => {
    // The gate's first clause, asserted rather than trusted: the module opens nothing. A probe
    // that quietly grepped a file would pass every test above and reintroduce the exact defect
    // this unit removed — and this is the one assertion that has to be made about the module's
    // text, because "does not do X" is not observable from its return values.
    const self = readFileSync(path.join(__dirname, "ranker-behaviour.ts"), "utf8");
    expect(self, "the behavioural probe grew a source read").not.toMatch(/node:fs|readFileSync/);
    // Non-vacuity: the same scan finds the reads in the module that still has them, so a scan
    // matching nothing anywhere cannot pass this by being broken.
    expect(readFileSync(path.join(__dirname, "latent-y5.ts"), "utf8")).toMatch(/readFileSync/);
  });
});

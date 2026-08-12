// W225 verify gate: no patient id can enter the recommendation type; asserted as an ABSENCE, not
// a filter.
//
// An absence needs a different kind of test from a behaviour, and one assertion is not enough for
// this one: the object's own keys (a field), every exported signature (a parameter), and the
// module namespace (a function). `openingFor(patient)` would pass a keys check and
// `{ patients: [] }` would pass a signature check.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./opening";
import {
  OPENING_REFUSAL_COPY,
  REFUSED_OPENING_FIELDS,
  recommendOpening,
  renderOpening,
} from "./opening";
import type { SessionPattern } from "./model";

const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/opening.ts"), "utf8");

const pattern = (weeks: Array<[filled: number, offerable: number]>): SessionPattern => ({
  practiceId: "prac-1",
  clinicianId: "clin-1",
  weekday: 4,
  weeks: weeks.map(([filled, offerable], i) => ({
    dateIso: `2026-05-${String(7 + i * 7).padStart(2, "0")}`,
    filled,
    offerable,
    released: 0,
  })),
  basis: { recordedWeeks: weeks.length, fromIso: "2026-05-07", toIso: "2026-07-30" },
});

/** Eight recorded Thursdays, all offering 8, filling between 4 and 8 — enough to score. */
const HISTORY = pattern([
  [4, 8],
  [6, 8],
  [8, 8],
  [5, 8],
  [7, 8],
  [6, 8],
  [4, 8],
  [7, 8],
]);

const ok = (p: SessionPattern, slots: number) => {
  const result = recommendOpening(p, slots);
  if (!result.ok) throw new Error(`refused: ${result.errors.join(", ")}`);
  return result.opening;
};

describe("W225 nobody can be named in a suggestion about a diary", () => {
  it("has no field for a person, on the object's own keys", () => {
    expect(Object.keys(ok(HISTORY, 8)).sort()).toEqual([
      "clinicianId",
      "forecast",
      "largestRecordedOffering",
      "practiceId",
      "score",
      "slots",
      "weekday",
    ]);
  });

  it("takes nobody in any exported signature", () => {
    // A parameter, rather than a field. `recommendOpening(pattern, slots, patients)` would pass
    // the keys check above and still be the thing this unit refuses.
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      const params = match[2]!.replace(/\s+/g, " ");
      expect(params, `${match[1]} takes a person`).not.toMatch(
        /\bpatient|\bcandidate|\bperson\b|\binvite/i,
      );
    }
  });

  it("exports no function that reads as being about people", () => {
    // A third surface: `openingFor(patient)` passes both checks above if it is never called.
    const named = Object.keys(mod).filter((name) =>
      /patient|candidate|invite|who|person/i.test(name),
    );
    expect(named).toEqual([]);
  });

  it("states a reason for every field it refuses, including the pseudonym", () => {
    // W221's finding: a pseudonym is still a person, and `candidateRef` hid a whole module from
    // the ADM register for a quarter. Refused here by name as well as by type.
    expect(Object.keys(REFUSED_OPENING_FIELDS).sort()).toEqual([
      "candidateRef",
      "patients",
      "reason",
      "urgency",
    ]);
    for (const [field, why] of Object.entries(REFUSED_OPENING_FIELDS)) {
      expect(why.length, `${field} is refused without a reason`).toBeGreaterThan(80);
    }
  });

  it("says nothing about any patient in the sentence it renders", () => {
    // Eighth instance of the pattern W198 named: the first version of this scan matched the
    // clause DOING the refusing — "nothing about any patient". So the refusal is subtracted
    // first, and the subtraction is asserted to be real before the remainder is scanned, which
    // is W173's method rather than an exemption.
    const rendered = renderOpening(recommendOpening(HISTORY, 8));
    const refusal = "It is your diary; this says what the record shows, and nothing about any patient.";
    expect(rendered, "the refusal clause has changed").toContain(refusal);
    const claims = rendered.replace(refusal, "");
    expect(claims.length, "the subtraction removed everything").toBeGreaterThan(80);
    expect(claims).not.toMatch(/\bpatient|\bcandidate|invite|who to/i);
  });
});

describe("W225 the record does not speak about sessions it has never seen", () => {
  it("refuses more slots than any recorded week ever offered", () => {
    // Scaling the smaller weeks up is where a forecast quietly becomes a promise, and the
    // arithmetic for it is trivially available — which is why the refusal is explicit.
    const beyond = recommendOpening(HISTORY, 12);
    expect(beyond.ok).toBe(false);
    if (beyond.ok) return;
    expect(beyond.errors).toContain("beyond_any_recorded_offering");
  });

  it("allows exactly the largest recorded offering, so the boundary is not off by one", () => {
    expect(recommendOpening(HISTORY, 8).ok).toBe(true);
    expect(recommendOpening(HISTORY, 9).ok).toBe(false);
    expect(ok(HISTORY, 8).largestRecordedOffering).toBe(8);
  });

  it("carries the largest recorded offering so the reader can see the bound", () => {
    expect(renderOpening(recommendOpening(HISTORY, 8))).toContain("ever offered is 8");
  });
});

describe("W225 the score travels with the range, never behind it", () => {
  it("cannot be constructed without a score", () => {
    // W224's rule, enforced by the type: `score` is required, so a suggestion that showed the
    // range and left the accuracy behind does not compile.
    const opening = ok(HISTORY, 8);
    expect(opening.score.weeksScored).toBeGreaterThan(0);
    expect(opening.forecast.low).toBeLessThanOrEqual(opening.forecast.high);
  });

  it("refuses outright when the forecaster has never been scored", () => {
    // An unproven forecaster making suggestions is the failure this composition exists to
    // prevent. Five weeks forecasts but cannot yet be scored.
    const unproven = recommendOpening(pattern([[4, 8], [6, 8], [8, 8], [5, 8]]), 8);
    expect(unproven.ok).toBe(false);
    if (unproven.ok) return;
    expect(unproven.errors).toContain("forecaster_never_scored");
  });

  it("renders coverage and width in the same sentence, never coverage alone", () => {
    // W224's finding: a forecaster saying "none to all of them" has perfect coverage and has told
    // nobody anything. The two numbers are emitted together or not at all.
    const rendered = renderOpening(recommendOpening(HISTORY, 8));
    expect(rendered).toMatch(/covered what happened \d+ times/);
    expect(rendered).toMatch(/average width of \d+%/);
  });

  it("returns every refusal rather than the first", () => {
    const both = recommendOpening(pattern([[4, 8], [6, 8]]), 20);
    expect(both.ok).toBe(false);
    if (both.ok) return;
    expect([...both.errors].sort()).toEqual([
      "beyond_any_recorded_offering",
      "forecaster_never_scored",
      "no_range_for_this_session",
    ]);
  });

  it("renders a refusal as sentences, never as a blank", () => {
    const rendered = renderOpening(recommendOpening(HISTORY, 99));
    expect(rendered).toBe(OPENING_REFUSAL_COPY.beyond_any_recorded_offering);
    expect(rendered.length).toBeGreaterThan(80);
  });
});

describe("W225 it composes rather than recomputes", () => {
  it("imports the range and the score instead of deriving either", () => {
    // Two implementations of the same arithmetic drift, and the drift is invisible because nobody
    // opens both files (W177's lesson about duplicated caveats, applied to numbers).
    expect(SOURCE).toMatch(/import \{ backtest/);
    expect(SOURCE).toMatch(/import \{ forecast/);
    expect(SOURCE, "a rate is being computed here").not.toMatch(/filled \/ |\* slotsOffered/);
  });

  it("is a suggestion about a diary, and says whose decision it is", () => {
    expect(renderOpening(recommendOpening(HISTORY, 8))).toMatch(/It is your diary/);
  });
});

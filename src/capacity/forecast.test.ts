// W223 verify gate: every forecast carries its basis and its uncertainty, and refuses below a
// floor of recorded weeks rather than emitting a confident number over thin data.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./forecast";
import { FORECAST_REFUSAL_COPY, MIN_RECORDED_WEEKS, forecast, renderForecast } from "./forecast";
import type { SessionPattern } from "./model";

const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/forecast.ts"), "utf8");

/** A pattern from explicit (filled, offerable) pairs, so every fixture's rates are readable. */
const pattern = (weeks: Array<[filled: number, offerable: number]>): SessionPattern => ({
  practiceId: "prac-1",
  clinicianId: "clin-1",
  weekday: 4,
  weeks: weeks.map(([filled, offerable], i) => ({
    dateIso: `2026-06-${String(4 + i * 7).padStart(2, "0")}`,
    filled,
    offerable,
    released: 0,
  })),
  basis: { recordedWeeks: weeks.length, fromIso: "2026-06-04", toIso: "2026-07-30" },
});

/** Rates 0.5, 0.75, 1.0, 0.625 — a genuine spread, so an interval is a real interval. */
const SPREAD = pattern([
  [4, 8],
  [6, 8],
  [8, 8],
  [5, 8],
]);

const ok = (p: SessionPattern, slots: number) => {
  const result = forecast(p, slots);
  if (!result.ok) throw new Error(`refused: ${result.errors.join(", ")}`);
  return result.forecast;
};

describe("W223 a forecast is a range, and a point estimate is not representable", () => {
  it("gives the observed range applied to the slots offered", () => {
    // Lowest recorded rate 0.5, highest 1.0, over six slots: 3 to 6.
    const f = ok(SPREAD, 6);
    expect([f.low, f.high]).toEqual([3, 6]);
    expect(f.slotsOffered).toBe(6);
  });

  it("has no field a console could render as a single answer", () => {
    // THE structural guarantee. A reader given "5.2" plans around 5.2; given "3 to 6" they plan
    // around not knowing. Asserted on the object's own keys, not on the names of exports, because
    // `mostLikely` would pass a name check on the module.
    expect(Object.keys(ok(SPREAD, 6)).sort()).toEqual(["basis", "high", "low", "slotsOffered"]);
    expect(SOURCE, "a point estimate has appeared").not.toMatch(
      /\b(expected|mean|average|midpoint|mostLikely|pointEstimate)\b\s*[:=]/,
    );
  });

  it("widens rather than narrows when rounding", () => {
    // Rates 1/3 and 2/3 over 5 slots: 1.67 and 3.33 → 1 to 4, not 2 to 3. A forecast wrong in the
    // narrow direction has told a practice it knows something it does not.
    const f = ok(pattern([[1, 3], [2, 3], [1, 3], [2, 3]]), 5);
    expect([f.low, f.high]).toEqual([1, 4]);
  });

  it("never promises more than were offered, or fewer than none", () => {
    const f = ok(pattern([[8, 8], [8, 8], [8, 8], [8, 8]]), 3);
    expect(f.high).toBe(3);
    const empty = ok(pattern([[0, 8], [0, 8], [0, 8], [0, 8]]), 3);
    expect(empty.low).toBe(0);
  });

  it("reports a narrow interval as narrow rather than inventing width", () => {
    // Four identical weeks give low === high. Widening would be inventing uncertainty, which is
    // the same sin as inventing precision and harder to notice — the basis is what protects the
    // reader, so it must be there.
    const f = ok(pattern([[4, 8], [4, 8], [4, 8], [4, 8]]), 8);
    expect(f.low).toBe(f.high);
    expect(f.basis.recordedWeeks).toBe(4);
    expect(f.basis.observedRates).toEqual([0.5, 0.5, 0.5, 0.5]);
  });
});

describe("W223 it refuses thin data rather than being confident over it", () => {
  it("refuses below the floor of recorded weeks", () => {
    const thin = forecast(pattern([[4, 8], [6, 8], [8, 8]]), 6);
    expect(thin.ok).toBe(false);
    if (thin.ok) return;
    expect(thin.errors).toContain("too_few_recorded_weeks");
  });

  it("clears the floor at exactly the floor, so the boundary is not off by one", () => {
    // A floor tested only from far below passes with an off-by-one that fires only on real data —
    // W215's note about checking a floor from both sides.
    expect(forecast(pattern(Array(MIN_RECORDED_WEEKS).fill([4, 8])), 6).ok).toBe(true);
    expect(forecast(pattern(Array(MIN_RECORDED_WEEKS - 1).fill([4, 8])), 6).ok).toBe(false);
  });

  it("counts only weeks that carry a rate towards the floor", () => {
    // A week with no offerable slot has no denominator — W222's refusal, inherited rather than
    // re-decided. Four weeks of which one is empty is three weeks of evidence, not four.
    const withEmpty = forecast(pattern([[4, 8], [6, 8], [8, 8], [0, 0]]), 6);
    expect(withEmpty.ok).toBe(false);
    if (withEmpty.ok) return;
    expect(withEmpty.errors).toContain("too_few_recorded_weeks");
  });

  it("refuses a forecast for no slots, and does not call it zero", () => {
    const none = forecast(SPREAD, 0);
    expect(none.ok).toBe(false);
    if (none.ok) return;
    expect(none.errors).toContain("no_slots_offered");
    expect(FORECAST_REFUSAL_COPY.no_slots_offered).toMatch(/not a forecast of zero/);
  });

  it("returns every refusal rather than the first", () => {
    const both = forecast(pattern([[4, 8]]), 0);
    expect(both.ok).toBe(false);
    if (both.ok) return;
    expect([...both.errors].sort()).toEqual(["no_slots_offered", "too_few_recorded_weeks"]);
  });

  it("takes no floor parameter, so nobody can lower it after seeing the history", () => {
    // W222 refused a default fill rate on this reasoning and W196 refused a per-report
    // aggregation floor before it. Checked on the SIGNATURES.
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      const params = match[2]!.replace(/\s+/g, " ");
      expect(params, `${match[1]} takes a floor`).not.toMatch(/floor|minWeeks|minimum|options|config/i);
    }
    expect(Object.keys(mod)).not.toContain("DEFAULT_FORECAST_CONFIG");
  });
});

describe("W223 the figure is not readable without its basis", () => {
  it("carries the weeks, the period and the rates the range came from", () => {
    const f = ok(SPREAD, 6);
    expect(f.basis.recordedWeeks).toBe(4);
    expect(f.basis.fromIso).toBe("2026-06-04");
    expect(f.basis.toIso).toBe("2026-07-30");
    expect(f.basis.floor).toBe(MIN_RECORDED_WEEKS);
    // The reader can re-derive the interval from these rather than believe it.
    expect(Math.min(...f.basis.observedRates)).toBe(0.5);
    expect(Math.max(...f.basis.observedRates)).toBe(1);
  });

  it("renders the range with its basis and claims nothing about the future", () => {
    const rendered = renderForecast(forecast(SPREAD, 6));
    expect(rendered).toContain("3 to 6");
    expect(rendered).toContain("4 recorded weeks");
    expect(rendered).toContain("2026-06-04");
    expect(rendered).toMatch(/not a prediction/);
    // "will fill" is a promise; "filled in the weeks on record" is a fact. One word apart.
    expect(rendered, "the copy promises the future").not.toMatch(/\bwill\b|\bexpect|\bshould\b/i);
  });

  it("renders a refusal as a sentence, never as a blank or a zero", () => {
    const rendered = renderForecast(forecast(pattern([[4, 8]]), 6));
    expect(rendered).toBe(FORECAST_REFUSAL_COPY.too_few_recorded_weeks);
    expect(rendered).not.toMatch(/\b0\b/);
    expect(rendered.length).toBeGreaterThan(60);
  });
});

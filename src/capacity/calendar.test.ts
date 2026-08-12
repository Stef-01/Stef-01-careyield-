// W227 verify gate: nothing seasonal is inferred from the practice's own history; the calendar is
// data with provenance, W56's shape.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./calendar";
import {
  CALENDAR_REJECTION_COPY,
  REFUSED_SEASONALITY,
  SHIPPED_HOLIDAYS,
  holidayOn,
  rejectionsFor,
  type PublicHoliday,
} from "./calendar";

const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/calendar.ts"), "utf8");

const sourced = (over: Partial<PublicHoliday> = {}): PublicHoliday => ({
  dateIso: "2026-06-08",
  name: "King's Birthday",
  jurisdiction: "VIC",
  provenance: {
    citation: "Example jurisdiction gazette, public holiday declaration",
    url: "https://example.invalid/gazette/2026",
    publishedOn: "2025-11-03",
    retrievedOn: "2026-01-15",
  },
  ...over,
});

describe("W227 seasonality is never inferred from the practice's own history", () => {
  it("cannot see a recorded week: the history is not in scope", () => {
    // THE structural guarantee. Not "nobody wrote the regression" — the module does not import
    // the type that would let it. Asserted on the imports, because a reader checking the
    // functions would have to notice an absence rather than a presence.
    expect(SOURCE, "the recorded history is in scope here").not.toMatch(
      /from "\.\/model"|SessionPattern|RecordedWeek|from "\.\/backtest"/,
    );
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      const params = match[2]!.replace(/\s+/g, " ");
      expect(params, `${match[1]} takes recorded history`).not.toMatch(/pattern|weeks|history|filled/i);
    }
  });

  it("exports nothing that reads as a learned adjustment", () => {
    const named = Object.keys(mod).filter((name) =>
      /factor|seasonal(?!ity)|adjust|multiplier|trend|fit|smooth/i.test(name),
    );
    expect(named).toEqual([]);
  });

  it("states a reason for each seasonal adjustment it refuses", () => {
    // The tempting ones by name, so a later unit has to DELETE a stated refusal rather than
    // quietly add a function — W196's shape.
    expect(Object.keys(REFUSED_SEASONALITY).sort()).toEqual([
      "monthly_factor_from_history",
      "school_term_effect",
      "trend_extrapolation",
      "weather_or_flu_season",
    ]);
    for (const [id, why] of Object.entries(REFUSED_SEASONALITY)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(100);
    }
  });
});

describe("W227 the calendar is data with a source", () => {
  it("accepts a fully sourced entry", () => {
    // Non-vacuity first: the validator must pass something, or every refusal below is trivially
    // satisfied by a validator that refuses everything.
    expect(rejectionsFor(sourced())).toEqual([]);
  });

  it("refuses an entry with no provenance at all", () => {
    expect(rejectionsFor(sourced({ provenance: undefined as never }))).toEqual(["provenance_missing"]);
    expect(rejectionsFor(sourced({ provenance: { ...sourced().provenance, citation: " " } }))).toEqual([
      "provenance_missing",
    ]);
  });

  it("refuses a citation nobody can follow or date", () => {
    expect(rejectionsFor(sourced({ provenance: { ...sourced().provenance, url: "" } }))).toContain(
      "provenance_url_missing",
    );
    expect(
      rejectionsFor(sourced({ provenance: { ...sourced().provenance, publishedOn: "soon" } })),
    ).toContain("provenance_dates_missing_or_unreadable");
  });

  it("refuses a source recorded as read before it was published", () => {
    // Not pedantry: a gazette entry amended later is a different fact from the one that was read,
    // and these two dates are the only way a reader can tell which one this row is.
    const backwards = rejectionsFor(
      sourced({ provenance: { ...sourced().provenance, publishedOn: "2026-05-01", retrievedOn: "2026-01-15" } }),
    );
    expect(backwards).toContain("retrieved_before_published");
  });

  it("refuses a holiday that does not say which jurisdiction declared it", () => {
    // "The King's Birthday" is a different date in most Australian states. A calendar that did
    // not say which one it meant would be wrong in most of them.
    expect(rejectionsFor(sourced({ jurisdiction: "" }))).toContain("jurisdiction_missing");
  });

  it("returns every reason rather than the first", () => {
    const bad = rejectionsFor(sourced({ dateIso: "nope", name: " ", jurisdiction: " " }));
    expect(bad.length).toBeGreaterThan(2);
  });

  it("explains every refusal it can give", () => {
    for (const [reason, copy] of Object.entries(CALENDAR_REJECTION_COPY)) {
      expect(copy.length, `${reason} has no explanation`).toBeGreaterThan(50);
    }
  });
});

describe("W227 the shipped calendar is empty, and the reason is not a gate", () => {
  it("ships nothing", () => {
    expect(SHIPPED_HOLIDAYS).toEqual([]);
  });

  it("says why in the module, because the reason differs from W56's", () => {
    // W56 ships empty because clinical content needs G5. No gate covers a public holiday: this is
    // empty because the loop cannot verify a gazette, and plausible dates with plausible
    // citations would be a MANUFACTURED source — worse than no source at all.
    expect(SOURCE).toMatch(/cannot verify a gazette/);
    expect(SOURCE).toMatch(/worse wrong than absent/);
  });
});

describe("W227 not a holiday and no calendar are different facts", () => {
  it("distinguishes them, because they are opposite for a practice", () => {
    // W170's rule in a place that looks too simple to need it. `false` would render "your state
    // has no calendar loaded" identically to "that Monday is an ordinary day".
    const calendar = [sourced()];
    expect(holidayOn(calendar, "VIC", "2026-06-08")).toEqual({ known: true, holiday: calendar[0] });
    expect(holidayOn(calendar, "VIC", "2026-06-09")).toEqual({ known: true, holiday: null });
    expect(holidayOn(calendar, "NSW", "2026-06-08")).toEqual({ known: false });
    expect(holidayOn([], "VIC", "2026-06-08")).toEqual({ known: false });
  });

  it("takes the calendar explicitly, so no answer arrives without one", () => {
    // A caller cannot get a reading out of the shipped calendar by accident, and cannot get one
    // without saying which calendar it came from.
    for (const match of SOURCE.matchAll(/^export function holidayOn\s*\(([^)]*)\)/gms)) {
      expect(match[1]!.replace(/\s+/g, " ")).toMatch(/calendar: readonly PublicHoliday\[\]/);
    }
    expect(holidayOn(SHIPPED_HOLIDAYS, "VIC", "2026-06-08")).toEqual({ known: false });
  });
});

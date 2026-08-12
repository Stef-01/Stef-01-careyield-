// W234: Q18 hardening — the review skills' findings, each pinned so the fix cannot be undone.
//
// A hardening week's output is not "we looked". It is a test per finding, because a fix without
// one is a fix somebody deletes in six months while simplifying. Every case below names what was
// wrong, and each fails if the module goes back to what it did.
//
// Seven findings came out of the code review. Five were real and are fixed here. Two are
// recorded as CHECKED AND NOT DEFECTS, with the reason, because a hardening unit that quietly
// drops the findings it disagreed with is a hardening unit nobody can audit — and this tree's own
// rule is not to take another reviewer at face value in either direction.
//
// The security review found nothing on this surface. That is reported in the ledger rather than
// asserted here, because "no vulnerability" is not a property a test can hold.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CAPACITY_SURFACE_COPY, lintCapacityCopy } from "./copy-lint";
import { COUPLING_REFUSAL_COPY, coupledInvitationVolume, type CouplingEnablement } from "./coupling";
import { CAPACITY_EFFECT_WITHHELD_COPY, capacityEffect } from "./attribution";
import { backtest, renderScore } from "./backtest";
import { driftReport, renderDrift } from "./drift";
import { holidayOn, rejectionsFor, type PublicHoliday } from "./calendar";
import { MIN_RECORDED_WEEKS } from "./forecast";
import { DEFAULT_POOL_CONFIG } from "@/engine/pool";
import type { RecordedUtilisation, RecordedWeek, SessionPattern } from "./model";

const week = (dateIso: string, filled: number, offerable = 10): RecordedWeek => ({
  dateIso,
  filled,
  offerable,
  released: 0,
});

const pattern = (fills: number[], offerable = 10): SessionPattern => {
  const weeks = fills.map((filled, index) =>
    week(new Date(Date.UTC(2026, 0, 1 + index * 7)).toISOString().slice(0, 10), filled, offerable),
  );
  return {
    practiceId: "prac-1",
    clinicianId: "cli-0",
    weekday: 4,
    weeks,
    basis: { recordedWeeks: weeks.length, fromIso: weeks[0]!.dateIso, toIso: weeks.at(-1)!.dateIso },
  };
};

/**
 * A real enablement, typed rather than cast.
 *
 * My first draft wrote `enabledAtIso`/`enabledBy` and reached the right shape with `as
 * CouplingEnablement` — which compiled, threw at runtime, and would have made the guard below
 * pass for the wrong reason. A cast in a fixture is a fixture that stops checking the type it
 * claims to be, which is the same error W177 made with an empty one.
 */
const ENABLED: CouplingEnablement[] = [
  {
    practiceId: "prac-1",
    decidedBy: "manager@demo.practice.example",
    decidedAtIso: "2026-03-01",
    reason: "We want fewer messages on sessions the record shows fill without them anyway.",
    evidence: { weeksScored: 4, covered: 4, meanWidthOfSlots: 0.1 },
  },
];

describe("W234 finding 1: the module that ACTS was less careful than the one that informs", () => {
  const steady = pattern([6, 6, 6, 6, 6, 6, 6, 6]);

  it("refuses to size a batch for more slots than any recorded week offered", () => {
    // THE MOST SEVERE FINDING. `recommendOpening` — read-only — has refused
    // `beyond_any_recorded_offering` since W225. `coupledInvitationVolume`, which WITHHOLDS
    // INVITATIONS, extrapolated instead: a ten-slot record at lowest fill 6/10 with twelve slots
    // opened sized the batch from a rate the record never observed, and halved the messages.
    const result = coupledInvitationVolume(steady, 12, DEFAULT_POOL_CONFIG, ENABLED);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toContain("beyond_any_recorded_offering");
    expect(COUPLING_REFUSAL_COPY.beyond_any_recorded_offering).toContain("never observed here");
  });

  it("still answers within the record, so the guard is not a blanket refusal", () => {
    // A refusal that fired everywhere would pass the test above and disable the unit.
    const result = coupledInvitationVolume(steady, 10, DEFAULT_POOL_CONFIG, ENABLED);
    expect(result.ok, "the guard refuses a session the record does cover").toBe(true);
  });
});

describe("W234 finding 2: the drift monitor fabricated an alarming number", () => {
  it("computes recent coverage instead of hard-coding it to zero", () => {
    // Mine, from W228, and the worst kind: the module whose entire argument is that it does not
    // manufacture verdicts printed "0 inside the range" for weeks that were all inside it,
    // because the `cannot_determine` branch returned a literal 0 and the renderer prints it.
    const thin = pattern([5, 5, 5, 5, 5, 5]);
    const report = driftReport(thin);
    expect(report.verdict).toBe("cannot_determine");
    expect(report.recent.weeks).toBe(2);
    expect(report.recent.covered, "a fabricated zero").toBe(2);
    expect(renderDrift(report)).toContain("Recent 2 scored week(s): 2 inside the range");
  });

  it("still reports a real miss in that branch rather than flattering it", () => {
    // The other direction, because a hard-coded `covered = weeks` would pass the test above.
    const oneMiss = pattern([5, 5, 5, 5, 9, 5]);
    const report = driftReport(oneMiss);
    expect(report.verdict).toBe("cannot_determine");
    expect(report.recent.covered).toBeLessThan(report.recent.weeks);
  });
});

describe("W234 finding 3: a calendar answered for a year it holds nothing about", () => {
  const vic2026: PublicHoliday[] = [
    {
      dateIso: "2026-12-25",
      name: "Christmas Day",
      jurisdiction: "VIC",
      provenance: {
        citation: "Victorian Government Gazette, public holidays 2026 (placeholder fixture)",
        url: "https://example.invalid/gazette-2026",
        publishedOn: "2025-11-01",
        retrievedOn: "2026-01-05",
      },
    } as PublicHoliday,
  ];

  it("says it does not know about a year the calendar does not cover", () => {
    // A 2026 calendar answered `{ known: true, holiday: null }` for 2027-12-25 — a confident
    // "not a public holiday" for a year it has never seen, collapsing the two facts W227 made
    // the type three-valued to keep apart.
    expect(holidayOn(vic2026, "VIC", "2027-12-25")).toEqual({ known: false });
  });

  it("still answers within the year it covers, both ways", () => {
    // Non-vacuity for the guard: a coverage check that refused everything would pass above.
    expect(holidayOn(vic2026, "VIC", "2026-12-25")).toEqual({
      known: true,
      holiday: vic2026[0],
    });
    expect(holidayOn(vic2026, "VIC", "2026-06-01")).toEqual({ known: true, holiday: null });
  });

  it("still knows nothing about a jurisdiction it holds nothing for", () => {
    expect(holidayOn(vic2026, "NSW", "2026-12-25")).toEqual({ known: false });
  });
});

describe("W234 finding 4: a duplicated row could clear the arm floor", () => {
  const recorded: RecordedUtilisation[] = [
    {
      session: { practiceId: "prac-1", clinicianId: "cli-0", dateIso: "2026-03-05", weekday: 4, slots: 10 },
      filled: 8,
      open: 2,
      released: 0,
    },
  ];
  const duplicated = {
    practiceId: "prac-1",
    allocation: "randomised_before_the_session" as const,
    assignments: Array.from({ length: MIN_RECORDED_WEEKS * 2 }, () => ({
      clinicianId: "cli-0",
      dateIso: "2026-03-05",
      arm: "extra_slots_opened" as const,
      assignedAtIso: "2026-03-01",
    })),
  };

  it("refuses a trial that assigns the same session more than once", () => {
    // One recorded session copied eight times would add its `filled` eight times and count as
    // eight sessions — a floor cleared by duplicating a row rather than by running a trial.
    // Dormant today (`SHIPPED_SESSION_ARMS` is empty) and fixed anyway, because a correctness
    // gap left because it is currently unreachable is PRIV-3's shape.
    const result = capacityEffect(duplicated, recorded);
    expect(result.claimed).toBe(false);
    expect(!result.claimed && result.withheld).toContain("session_assigned_more_than_once");
    expect(CAPACITY_EFFECT_WITHHELD_COPY.session_assigned_more_than_once).toContain(
      "without that many sessions actually having been run",
    );
  });

  it("does not refuse a trial whose rows are distinct", () => {
    const distinct = {
      ...duplicated,
      assignments: duplicated.assignments.map((a, index) => ({
        ...a,
        dateIso: `2026-03-${String(5 + index).padStart(2, "0")}`,
      })),
    };
    const result = capacityEffect(distinct, recorded);
    expect(!result.claimed && result.withheld).not.toContain("session_assigned_more_than_once");
  });
});

describe("W234 finding 5: the surface told a practice the opposite of W232's finding", () => {
  it("no longer claims the figures are disconnected from how many invitations go out", () => {
    // Mine, from W226, and disproved by my own W232 dossier four units later: the batch is sized
    // from the diary, so opening slots after reading the page raises how many people are
    // messaged. The old sentence was reassuring AND wrong, which is the worst combination.
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).not.toMatch(/not connected to how many/);
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).toContain("Meherr does not act on these figures");
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).toContain("more people are messaged");
  });

  it("keeps the distinction between what the software does and what the practice does", () => {
    expect(CAPACITY_SURFACE_COPY.notWiredToAnything).toContain("Acting on them yourself does");
    expect(lintCapacityCopy(CAPACITY_SURFACE_COPY.notWiredToAnything)).toEqual([]);
  });
});

describe("W234 finding 6: a score stated a period longer than it scored", () => {
  it("stamps the first SCORED week, not the first scorable one", () => {
    // Mine, from W224, and locked in by my own test — I pinned the period I had written rather
    // than the period scoring covered. W205's failure: a true number under a false period.
    const result = backtest(pattern([5, 5, 5, 5, 5, 5]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.basis.fromIso).toBe("2026-01-29");
    expect(result.score.weeksScored).toBe(2);
    expect(renderScore(result)).toContain("Scored over 2026-01-29 to 2026-02-05");
  });
});

describe("W234 checked and NOT defects, recorded rather than dropped", () => {
  it("calendar `rejectionsFor` does guard the provenance dereference", () => {
    // The review reported `p.citation`, `p.url` etc. as unguarded after a `!p` check. Reading it:
    // `if (!p || p.citation.trim() === "") { ...; return out; }` short-circuits, so `p.citation`
    // is only reached when `p` exists, and every later dereference is after that early return.
    // The finding is wrong on its own terms and is recorded here rather than silently dropped.
    const source = readFileSync(path.join(process.cwd(), "src/capacity/calendar.ts"), "utf8");
    expect(source).toContain('if (!p || p.citation.trim() === "")');
    const noProvenance = { dateIso: "2026-12-25", name: "X", jurisdiction: "VIC" } as PublicHoliday;
    expect(() => rejectionsFor(noProvenance)).not.toThrow();
    expect(rejectionsFor(noProvenance)).toContain("provenance_missing");
  });

  it("records that `name` and `jurisdiction` are typed, so the residual is untyped input only", () => {
    // The half of that finding which IS true: `holiday.name.trim()` runs before any guard, so a
    // row arriving from JSON without a name would throw rather than be refused. `PublicHoliday`
    // types both as `string`, and nothing in the tree loads this from JSON — `SHIPPED_HOLIDAYS`
    // is a literal. Named rather than fixed, because widening a loader for input that cannot
    // arrive is speculative work, and W227's gate is that values come from a gazette by hand.
    const source = readFileSync(path.join(process.cwd(), "src/capacity/calendar.ts"), "utf8");
    expect(source).toMatch(/name:\s*string;/);
    expect(source).toMatch(/jurisdiction:\s*string;/);
  });
});

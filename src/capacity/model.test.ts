// W222 verify gate: "over the synthetic practice; a session with no recorded history yields no
// forecast rather than a default."
//
// The refusal is the unit, so it is tested three ways, because "no default" fails in three
// different places. It can fail at the SIGNATURE (a fallback parameter somebody passes), at the
// RETURN (a zero or an average standing in for an absence), and at the MODULE (an export that
// forecasts at all, which would make the refusal moot one file over). Only the first is visible
// in review.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as capacityModel from "./model";
import {
  HISTORY_REFUSAL_COPY,
  historyFor,
  sessionsFrom,
  utilisationRate,
  type RecordedUtilisation,
} from "./model";
import type { Appointment, AppointmentId, ClinicianId, PracticeId } from "@/domain/types";
import { generatePractice } from "@/synthetic/generate";

const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/model.ts"), "utf8");

const P = "prac-1" as PracticeId;
let seq = 0;
const appt = (
  clinicianId: string,
  startsAt: string,
  status: Appointment["status"],
  practiceId: string = P,
): Appointment => ({
  id: `apt-${seq++}` as AppointmentId,
  practiceId: practiceId as PracticeId,
  clinicianId: clinicianId as ClinicianId,
  startsAt,
  status,
  patientId: null,
  generatedByInvitation: false,
});

/** Two Thursdays for cli-0, one Friday, and another practice's Thursday. */
const RAIL: Appointment[] = [
  appt("cli-0", "2026-06-04T09:00:00Z", "attended"),
  appt("cli-0", "2026-06-04T09:30:00Z", "open"),
  appt("cli-0", "2026-06-04T10:00:00Z", "cancelled"),
  appt("cli-0", "2026-06-11T09:00:00Z", "booked"),
  appt("cli-0", "2026-06-11T09:30:00Z", "dna"),
  appt("cli-0", "2026-06-05T09:00:00Z", "open"),
  appt("cli-1", "2026-06-04T09:00:00Z", "attended", "prac-2"),
];

describe("W222 sessions and their recorded dispositions", () => {
  it("groups one clinician's slots on one date into one session", () => {
    const sessions = sessionsFrom(RAIL, P);
    const thursday = sessions.find((s) => s.session.dateIso === "2026-06-04")!;
    expect(thursday.session.clinicianId).toBe("cli-0");
    expect(thursday.session.slots).toBe(3);
    expect(thursday.session.weekday).toBe(4);
  });

  it("counts a cancelled slot as released — neither filled nor empty", () => {
    // The fold that is available in both directions depending on what you want the number to
    // say. Counting it empty punishes a session for a patient cancelling; counting it filled
    // credits a visit that never happened. The record cannot tell, so neither is claimed.
    const thursday = sessionsFrom(RAIL, P).find((s) => s.session.dateIso === "2026-06-04")!;
    expect(thursday.filled).toBe(1);
    expect(thursday.open).toBe(1);
    expect(thursday.released).toBe(1);
  });

  it("accounts for every slot exactly once, so none can be dropped from a denominator", () => {
    // A disposition going missing would remove a slot from the denominator and the rate would
    // improve. Checked as an identity over the whole rail rather than on one fixture.
    for (const entry of sessionsFrom(RAIL, P)) {
      expect(entry.filled + entry.open + entry.released, entry.session.dateIso).toBe(
        entry.session.slots,
      );
    }
  });

  it("takes the practice as the query rather than filtering afterwards", () => {
    // W209's finding: the practice-scoped read is the read, not a filter somebody can delete.
    const mine = sessionsFrom(RAIL, P);
    expect(mine.every((s) => s.session.practiceId === P)).toBe(true);
    expect(sessionsFrom(RAIL, "prac-2").map((s) => s.session.clinicianId)).toEqual(["cli-1"]);
  });

  it("returns sessions in a fixed order, so the result is a value not a rendering", () => {
    const forwards = sessionsFrom(RAIL, P).map((s) => `${s.session.dateIso}/${s.session.clinicianId}`);
    const backwards = sessionsFrom([...RAIL].reverse(), P).map(
      (s) => `${s.session.dateIso}/${s.session.clinicianId}`,
    );
    expect(backwards).toEqual(forwards);
  });
});

describe("W222 a rate over zero slots is not zero per cent", () => {
  it("refuses rather than emitting 0 when nothing was offerable", () => {
    // W196's zero argument, applied to a rate: a session that does not exist would otherwise sit
    // in a list beside a session nobody booked, reading identically.
    const allReleased: RecordedUtilisation = {
      session: { practiceId: P, clinicianId: "cli-0", dateIso: "2026-06-18", weekday: 4, slots: 2 },
      filled: 0,
      open: 0,
      released: 2,
    };
    const rate = utilisationRate(allReleased);
    expect(rate.known).toBe(false);
    expect(!rate.known && rate.refusal).toBe("no_slots_recorded");
  });

  it("excludes released slots from BOTH sides of the rate", () => {
    // Thursday: 1 filled, 1 open, 1 released → 1 of 2 offerable, not 1 of 3.
    const thursday = sessionsFrom(RAIL, P).find((s) => s.session.dateIso === "2026-06-04")!;
    const rate = utilisationRate(thursday);
    expect(rate.known && rate.basis).toEqual({ filled: 1, offerable: 2 });
    expect(rate.known && rate.filledOfOfferable).toBe(0.5);
  });

  it("reports a genuinely empty session as 0 of N, which is a measurement", () => {
    // The distinction the refusal exists to protect: this one IS zero per cent, and it must not
    // be refused. A refusal that swallowed real zeroes would be as wrong as a default.
    const empty: RecordedUtilisation = {
      session: { practiceId: P, clinicianId: "cli-0", dateIso: "2026-06-18", weekday: 4, slots: 2 },
      filled: 0,
      open: 2,
      released: 0,
    };
    const rate = utilisationRate(empty);
    expect(rate.known).toBe(true);
    expect(rate.known && rate.filledOfOfferable).toBe(0);
  });
});

describe("W222 no recorded history yields no forecast, and no default", () => {
  it("refuses a clinician-weekday nobody has records for", () => {
    const result = historyFor(sessionsFrom(RAIL, P), "cli-0", 1); // Monday: nothing recorded
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.refusals).toEqual(["no_recorded_history"]);
    expect(result.wouldSettleIt.length).toBeGreaterThan(0);
  });

  it("says the absence is not a prediction of an empty diary", () => {
    // The specific misreading. "No history" and "we expect nothing" are opposite claims, and the
    // second is the one a reader supplies for themselves when the first is left unsaid.
    expect(HISTORY_REFUSAL_COPY.no_recorded_history).toContain("not a prediction");
    expect(HISTORY_REFUSAL_COPY.no_recorded_history).toContain("absence of a history");
    expect(HISTORY_REFUSAL_COPY.no_recorded_history).toContain("no number is offered");
  });

  it("refuses when sessions exist but none had an offerable slot", () => {
    const released = [
      appt("cli-9", "2026-06-04T09:00:00Z", "cancelled"),
      appt("cli-9", "2026-06-11T09:00:00Z", "cancelled"),
    ];
    const result = historyFor(sessionsFrom(released, P), "cli-9", 4);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.refusals).toEqual(["no_session_with_offerable_slots"]);
  });

  it("takes no assumed rate, fallback or options object in any signature", () => {
    // The gate as a SIGNATURE property. A default passed at a call site is a default chosen
    // after somebody has seen the data — W196 refused a floor parameter for the same reason,
    // and the reason it is checked here rather than reviewed is that it reads as a courtesy.
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      const params = match[2]!.replace(/\s+/g, " ");
      expect(params, `${match[1]} accepts a default`).not.toMatch(
        /default|assume|fallback|options|config|=\s*0\.\d|baseline/i,
      );
    }
  });

  it("exports nothing that forecasts, averages or predicts", () => {
    // The refusal would be moot if this module handed W223 a number to trust. Every recorded
    // week is carried individually; deriving anything from them is the next unit's job and its
    // caveats belong there.
    for (const name of Object.keys(capacityModel)) {
      expect(name, `"${name}" reads as a forecast`).not.toMatch(
        /forecast|predict|average|mean|typical|expected|estimate|projec|smooth/i,
      );
    }
  });

  it("carries every recorded week individually, oldest first, with its basis", () => {
    const result = historyFor(sessionsFrom(RAIL, P), "cli-0", 4);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pattern.weeks.map((w) => w.dateIso)).toEqual(["2026-06-04", "2026-06-11"]);
    expect(result.pattern.basis).toEqual({
      recordedWeeks: 2,
      fromIso: "2026-06-04",
      toIso: "2026-06-11",
    });
  });

  it("names no condition, symptom or clinical judgement anywhere", () => {
    // Founder gate (plan §4). A slot is a slot; these counts are about a diary. The moment a
    // capacity model reads a reason for an appointment it has become a triage input.
    const vocabulary = [...Object.keys(capacityModel), ...Object.values(HISTORY_REFUSAL_COPY)].join(" ");
    expect(vocabulary).not.toMatch(
      /diabet|renal|cardio|derm|symptom|severit|urgen|priorit|diagnos|condition/i,
    );
  });
});

describe("W222 over the synthetic practice", () => {
  const synthetic = generatePractice({
    seed: 7,
    patientCount: 800,
    clinicianCount: 4,
    scheduleWeeks: 4,
    todayIso: "2026-08-08",
  });

  it("derives sessions from the generated schedule", () => {
    const sessions = sessionsFrom(synthetic.appointments, synthetic.practice.id);
    expect(sessions.length).toBeGreaterThan(4);
    for (const entry of sessions) {
      expect(entry.filled + entry.open + entry.released).toBe(entry.session.slots);
      expect(entry.session.practiceId).toBe(synthetic.practice.id);
    }
  });

  it("refuses every weekday the generated schedule never used", () => {
    // Non-vacuity for the refusal, over real generated data rather than a fixture: whichever
    // weekdays the generator skipped must refuse, and at least one must have a history — a
    // module that refused everything would pass the refusal tests above.
    const sessions = sessionsFrom(synthetic.appointments, synthetic.practice.id);
    const clinicianId = sessions[0]!.session.clinicianId;
    const used = new Set(
      sessions.filter((s) => s.session.clinicianId === clinicianId).map((s) => s.session.weekday),
    );
    expect(used.size).toBeGreaterThan(0);
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const result = historyFor(sessions, clinicianId, weekday);
      expect(result.ok, `weekday ${weekday}`).toBe(used.has(weekday));
    }
  });

  it("holds no patient identity, because there is nowhere to put one", () => {
    // The generated rail carries patientIds on booked slots; the model counts them and keeps
    // none. Checked over real data rather than by reading the type.
    const json = JSON.stringify(sessionsFrom(synthetic.appointments, synthetic.practice.id));
    expect(json).not.toMatch(/\bpat-\d+\b/);
    expect(json).not.toContain("patientId");
  });
});

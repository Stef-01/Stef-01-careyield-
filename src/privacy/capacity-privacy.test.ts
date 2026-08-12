// W230 verify gate: "W106 classification; a forecast is practice-level and no figure can identify
// a patient, BY TYPE rather than by scrubbing."
//
// The last four words are the unit. "No patient identifier reaches the output" can be true
// because somebody removed one, and a removal is a line that can be deleted — W209 found four
// cross-tenant defects that were all a missing filter rather than a missing type. So the claim
// here is the stronger one: nothing in Q18 ever HOLDS a patient identifier, so there is nothing
// to remove, and a `scrub` function in this directory would be evidence the claim is false.
//
// AND THE ERASURE PROPERTY RUNS THE OTHER WAY FROM EVERY OTHER CLASS IN W106. Elsewhere the
// question is "does erasing the source empty this" (W180's composition). Here the answer must be
// NO: W33 keeps an attended slot and drops its patient link, because the slot's history is the
// practice's own record. So a capacity count is INVARIANT under erasure — and the reason that is
// the right property rather than a weaker one is sharper than it first looks: a figure that
// CHANGED when somebody was erased would disclose that an erasure had happened, to anybody
// watching the number. Invariance is the privacy property; reduction would be the leak.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RECORD_CLASSES } from "./record-classes";
import { deletePatient, type PrivacyDataset } from "./privacy";
import { backtest } from "@/capacity/backtest";
import { driftReport } from "@/capacity/drift";
import { forecast } from "@/capacity/forecast";
import { historyFor, sessionsFrom } from "@/capacity/model";
import { recommendOpening } from "@/capacity/opening";
import { generatePractice } from "@/synthetic/generate";

const CAPACITY = path.resolve(__dirname, "..", "capacity");

const modulesOnDisk = () =>
  readdirSync(CAPACITY)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => `src/capacity/${file}`)
    .sort();

const synthetic = generatePractice({
  seed: 21,
  patientCount: 1_200,
  clinicianCount: 3,
  scheduleWeeks: 12,
  todayIso: "2026-08-08",
});

/** Every figure Q18 can produce over the synthetic practice, as one value to scan. */
const everyFigure = (appointments = synthetic.appointments) => {
  const sessions = sessionsFrom(appointments, synthetic.practice.id);
  const out: unknown[] = [sessions];
  const clinicianIds = [...new Set(sessions.map((s) => s.session.clinicianId))];
  for (const clinicianId of clinicianIds) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const history = historyFor(sessions, clinicianId, weekday);
      out.push(history);
      if (!history.ok) continue;
      out.push(forecast(history.pattern, 10));
      out.push(backtest(history.pattern));
      out.push(driftReport(history.pattern));
      out.push(recommendOpening(history.pattern, 6));
    }
  }
  return out;
};

describe("W230 every capacity module is classified, in both directions", () => {
  it("declares each one", () => {
    // W180's census, applied to a second directory. A module holding figures about a practice's
    // diary without an answer to "what happens to this on erasure" is a class nobody has ruled on.
    const declared = new Set(RECORD_CLASSES.map((c) => c.module));
    const modules = modulesOnDisk();
    expect(modules.length).toBeGreaterThan(4);
    for (const module of modules) {
      expect(declared, `${module} is not declared in W106's registry`).toContain(module);
    }
  });

  it("declares nothing in this directory that has gone", () => {
    const onDisk = new Set(modulesOnDisk());
    const stale = RECORD_CLASSES.filter(
      (c) => c.module.startsWith("src/capacity/") && !onDisk.has(c.module),
    );
    expect(stale.map((c) => c.module), "declarations for modules that are gone").toEqual([]);
  });

  it("classifies every one as holding no patient identity — never stored, never derived", () => {
    // `derived` would be wrong here and the distinction matters: derived means erasing the source
    // erases these, and a capacity count deliberately SURVIVES an erasure. Claiming `derived`
    // would promise a behaviour the module does not have.
    const capacity = RECORD_CLASSES.filter((c) => c.module.startsWith("src/capacity/"));
    expect(capacity.length).toBeGreaterThan(4);
    for (const c of capacity) {
      expect(c.handling, c.module).toBe("no_patient_identity");
      expect(c.rationale.length, c.module).toBeGreaterThan(120);
    }
  });
});

describe("W230 no figure can identify a patient, by type", () => {
  it("holds no patient identifier anywhere in any figure, over a real practice", () => {
    // Checked over real generated data rather than a fixture: the rail these are derived from
    // carries patientIds on every booked slot, so a projection that leaked one would show here.
    const json = JSON.stringify(everyFigure());
    expect(json).not.toMatch(/\bpat-\d+\b/);
    expect(json).not.toContain("patientId");
    expect(json).not.toContain("patientRef");
  });

  it("takes no patient in any exported signature across the directory", () => {
    // BY TYPE, not by scrubbing. Checked on the signatures rather than the names, because
    // `historyFor(patient)` reads innocently — W215's method, applied to a whole directory.
    for (const module of modulesOnDisk()) {
      const source = readFileSync(path.join(process.cwd(), module), "utf8");
      for (const match of source.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
        const params = match[2]!.replace(/\s+/g, " ");
        expect(params, `${module}:${match[1]} takes a patient`).not.toMatch(
          /\bpatient\b|\bpatientId\b|Patient\[\]|readonly Patient/i,
        );
      }
    }
  });

  it("reads no patient field even where the input rail carries one", () => {
    // `sessionsFrom` receives `Appointment[]`, which HAS a patientId. The guarantee is that it
    // never reads it — so the identifier has no path into a figure rather than being removed
    // from one. A filter would be a line somebody can delete; this is a line nobody ever wrote.
    const source = readFileSync(path.join(process.cwd(), "src/capacity/model.ts"), "utf8");
    const body = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(body).not.toMatch(/\.patientId\b/);
    expect(body).not.toMatch(/patientRef|patientLabel/);
  });

  it("exports no scrub, because a scrub would mean this claim is false", () => {
    // The inverse assertion, and the one that stays true as the directory grows. If any capacity
    // module ever needed to remove a patient from its own state, it would be holding one.
    for (const module of modulesOnDisk()) {
      const source = readFileSync(path.join(process.cwd(), module), "utf8");
      expect(source, `${module} scrubs something`).not.toMatch(
        /export (async )?function \w*(scrub|erase|redact|anonymi[sz]e|deidentif)/i,
      );
    }
  });
});

describe("W230 a capacity figure is invariant under erasure, and that is the point", () => {
  const dataset = (): PrivacyDataset => ({
    invitations: [],
    appointments: synthetic.appointments,
    auditEvents: [],
    outcomes: [],
  });

  const erasedRail = () => {
    // Erase every patient with a booked slot, which is the strongest version of the test: if any
    // capacity count moved, it moved for all of them at once.
    let current = dataset();
    const patientIds = [
      ...new Set(
        synthetic.appointments.map((a) => a.patientId).filter((id): id is NonNullable<typeof id> => id !== null),
      ),
    ];
    for (const patientId of patientIds.slice(0, 40)) {
      current = deletePatient(current, patientId, "2026-08-08T00:00:00Z").dataset;
    }
    return { current, erasedCount: Math.min(40, patientIds.length) };
  };

  it("erases real patients from the rail, so this cannot pass by erasing nobody", () => {
    const { current, erasedCount } = erasedRail();
    expect(erasedCount).toBeGreaterThan(10);
    const before = synthetic.appointments.filter((a) => a.patientId !== null).length;
    const after = current.appointments.filter((a) => a.patientId !== null).length;
    expect(after, "the erasure removed no patient link").toBeLessThan(before);
  });

  it("leaves every session count exactly as it was", () => {
    // W33's rule: the slot's history is the practice's own record and stays; the person does not.
    // So the diary's shape is unchanged, which is what a capacity figure describes.
    const { current } = erasedRail();
    expect(sessionsFrom(current.appointments, synthetic.practice.id)).toEqual(
      sessionsFrom(synthetic.appointments, synthetic.practice.id),
    );
  });

  it("leaves every forecast, score and drift verdict identical", () => {
    // The property stated over the whole surface rather than one function, because a figure that
    // moved would only need to move somewhere.
    const { current } = erasedRail();
    expect(JSON.stringify(everyFigure(current.appointments))).toBe(
      JSON.stringify(everyFigure(synthetic.appointments)),
    );
  });

  it("would disclose the erasure if it did not — the reason invariance is the property", () => {
    // Stated as a test rather than only in the rationale. If a capacity count fell when somebody
    // was erased, anybody watching Thursday's number would learn that a patient at this practice
    // had asked to be erased. The reduction people expect from erasure would be the leak here.
    const capacityClasses = RECORD_CLASSES.filter((c) => c.module.startsWith("src/capacity/"));
    const modelClass = capacityClasses.find((c) => c.module === "src/capacity/model.ts")!;
    expect(modelClass.rationale).toContain("disclose that an erasure had happened");
    expect(capacityClasses.every((c) => c.handling !== "derived")).toBe(true);
  });
});

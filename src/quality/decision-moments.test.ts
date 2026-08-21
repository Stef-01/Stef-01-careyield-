// W387 verify gate: every patient-selecting rule carries the moment its decision is taken and what
// it is handed, and the one rule deciding at its own moment on somebody else's guard is reported —
// then MEASURED on the synthetic cohort, by guarding on one day and pooling on a later one.
//
// FOUNDER GATE (plan §4): every patient here comes from `generatePractice`, seeded. Nothing is
// sent, no real record is read, and the one edited field is edited on a generated patient.

import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  DECISION_BOUND,
  STALE_AT_W387,
  decisions,
  momentDiff,
  parametersOf,
  staleGuards,
  type Decision,
} from "./decision-moments";
import { patientRules } from "./patient-populations";
import { fixtureText } from "./scan-text";
import { withTree } from "./planting";
import { generatePractice } from "@/synthetic/generate";
import { DEFAULT_CONFIG, eligibleForClinician } from "@/engine/eligibility";
import { DEFAULT_POOL_CONFIG, buildInvitationPool } from "@/engine/pool";
import { buildBackfillPool } from "@/engine/backfill";
import { DEFAULT_SESSION_CONFIG } from "@/session/config";
import { isoDaysFrom } from "@/lib/dates";

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * One synthetic practice, seeded. The whole cohort this file ever touches.
 *
 * SMALL ON PURPOSE. The drive needs a clinician with open slots and a patient the guard admits, not
 * a load test — W48's fleet run is where a big cohort belongs. A gate that goes red with every
 * assertion green is W347's class, and the lever it named is main-thread pressure, so a register
 * generating a second four-hundred-patient world beside W373's is paying for nothing.
 */
const WORLD = generatePractice({
  seed: 387,
  patientCount: 120,
  clinicianCount: 4,
  scheduleWeeks: 4,
  todayIso: "2026-08-10",
});
const CLINICIAN = WORLD.clinicians[0]!;
const NO_INVITES = new Map<string, number>();

/** A session date this clinician has open slots on, and the day the guard would have run. */
const POOL_DAY = [...new Set(
  WORLD.appointments
    .filter((a) => a.clinicianId === CLINICIAN.id && a.status === "open")
    .map((a) => a.startsAt.slice(0, 10)),
)].sort()[0]!;
const GUARD_DAY = isoDaysFrom(POOL_DAY, -6);

const guardedOn = (day: string, panel = WORLD.patients) =>
  eligibleForClinician(panel, CLINICIAN, DEFAULT_CONFIG, day, NO_INVITES).eligible;

/**
 * The panel with one generated patient's future booking moved.
 *
 * SYNTHETIC AND EDITED ON PURPOSE. The booking lands just outside the block window on the guard's
 * day and just inside it on the pool's, which is the ordinary thing a date does as it approaches.
 * Constructing it rather than hunting for one in the cohort is what makes the drive deterministic.
 */
const SLIPPING = (() => {
  const victim = guardedOn(GUARD_DAY)[0]!;
  const booking = isoDaysFrom(GUARD_DAY, DEFAULT_CONFIG.futureBookingBlockDays + 3);
  const moved = { ...victim, futureBookingAt: booking };
  return { id: victim.id as string, panel: WORLD.patients.map((p) => (p.id === victim.id ? moved : p)) };
})();

describe("W387 the population", () => {
  it("carries a row for every patient-selecting rule W373 finds, and none it does not", () => {
    const rows = decisions(ROOT);
    // Guard against a vacuous pass: a walk returning nothing satisfies every assertion below.
    expect(rows.length).toBeGreaterThan(10);
    expect(rows.map((r) => r.rule)).toEqual([...patientRules(ROOT)].sort());
  });

  it("reads a moment where the rule names one, and nothing where it does not", () => {
    const at = (rule: string) => decisions(ROOT).find((r) => r.rule === rule)!;
    expect(at("src/engine/eligibility.ts::eligibleForClinician").decidesAt).toBe("todayIso");
    expect(at("src/engine/pool.ts::buildInvitationPool").decidesAt).toBe("sessionDate");
    expect(at("src/engine/holdout.ts::assignHoldout").decidesAt).toBe("atIso");
    // A pure ordering names no date, which is what makes it safe: it is at no instant of its own.
    expect(at("src/engine/pool.ts::rankCandidates").decidesAt).toBeNull();
    expect(at("src/registers/ranking.ts::rankGapAware").decidesAt).toBeNull();
  });

  it("separates the panel from a set somebody already guarded, and a pair of snapshots from both", () => {
    const reads = (rule: string) => decisions(ROOT).find((r) => r.rule === rule)!.reads;
    expect(reads("src/engine/eligibility.ts::eligibleForClinician")).toBe("the_whole_panel");
    expect(reads("src/engine/pool.ts::buildInvitationPool")).toBe("an_already_guarded_set");
    expect(reads("src/engine/arm-stability.ts::armDrift")).toBe("a_pair_of_snapshots");
    // `buildBackfillPool` is the contrast and the first draft reported it: it takes
    // `pool: PoolConfig` — a configuration, not a panel — and calls the guard itself.
    expect(reads("src/engine/backfill.ts::buildBackfillPool")).toBe("the_whole_panel");
  });

  it("reads a parameter list a doc comment splits, and takes the type with the name", () => {
    const params = parametersOf(fixtureText("moment-probe-signature"), "decide");
    expect(params.map((p) => p.name)).toEqual(["eligible", "config", "sessionDate"]);
    expect(params.find((p) => p.name === "eligible")!.type).toBe("Patient[]");
    expect(parametersOf(fixtureText("moment-probe-signature"), "missing")).toEqual([]);
  });
});

describe("W387 the rule", () => {
  it("names the rule deciding at its own moment on somebody else's guard, and only that one", () => {
    expect(staleGuards(ROOT)).toEqual(["src/engine/pool.ts::buildInvitationPool"]);
    expect(momentDiff(ROOT)).toEqual({ undeclared: [], stale: [] });
  });

  it("reports a rule that grows a moment of its own over a guarded set", () => {
    // `rankCandidates` takes the guarded set and no date. Give it one and it joins the report,
    // which is the change a ranking layer is most likely to make.
    const grown: Decision[] = decisions(ROOT).map((d) =>
      d.rule === "src/engine/pool.ts::rankCandidates" ? { ...d, decidesAt: "todayIso" } : d,
    );
    expect(momentDiff(ROOT, STALE_AT_W387, grown).undeclared).toEqual([
      "src/engine/pool.ts::rankCandidates",
    ]);
  });

  it("reports a row for a rule that has started guarding at its own moment", () => {
    const fixed: Decision[] = decisions(ROOT).map((d) =>
      d.rule === "src/engine/pool.ts::buildInvitationPool" ? { ...d, reads: "the_whole_panel" as const } : d,
    );
    expect(momentDiff(ROOT, STALE_AT_W387, fixed).stale).toEqual([
      "src/engine/pool.ts::buildInvitationPool",
    ]);
  });

  it("argues each row, and each names a rule this product holds", () => {
    for (const row of STALE_AT_W387) {
      expect(patientRules(ROOT), `${row.rule} is not a patient rule`).toContain(row.rule);
      expect(row.costs.length, `${row.rule} is declared without an argument`).toBeGreaterThan(300);
    }
  });
});

describe("W387 every defaulted register here is handed a different value, at home", () => {
  // W355's rule: a parameter that defaults to a register has to be driven with something else, in
  // the suite that owns it, or the default is the only value anybody has ever seen.
  it("takes a rule list it is given, not only W373's", () => {
    const only = decisions(ROOT, ["src/engine/pool.ts::buildInvitationPool"]);
    expect(only.map((d) => d.rule)).toEqual(["src/engine/pool.ts::buildInvitationPool"]);
    expect(only[0]!.decidesAt).toBe("sessionDate");
  });

  it("takes a row list it is given, not only the tree's", () => {
    const rows: Decision[] = [
      { rule: "src/engine/probe.ts::decide", decidesAt: "atIso", reads: "an_already_guarded_set" },
      { rule: "src/engine/probe.ts::report", decidesAt: null, reads: "an_already_guarded_set" },
    ];
    expect(staleGuards(ROOT, rows)).toEqual(["src/engine/probe.ts::decide"]);
  });

  it("takes a declared list it is given, not only its own", () => {
    const rows = decisions(ROOT);
    expect(momentDiff(ROOT, [], rows).undeclared).toEqual(["src/engine/pool.ts::buildInvitationPool"]);
  });
});

describe("W387 a rule arriving joins without anybody editing the register", () => {
  const PROBE = "src/engine/moment-probe.ts";
  // The bodies are handed in rather than the fixture NAMES: `fixtureText(name)` behind a parameter
  // is a call W307's citation check cannot resolve, and an uncited block is one nothing keeps in
  // step with its loader.
  const planted = (body: string) => withTree({ [PROBE]: body }, (tree) => staleGuards(tree));

  it("reports a planted rule that decides at its own date about a guarded set", () => {
    expect(planted(fixtureText("moment-probe-guarded"))).toContain(`${PROBE}::probeDecide`);
  });

  it("does not see a moment taken from a config object, which is what the bound says", () => {
    // The register's own blind spot, driven rather than asserted. The same decision at the same
    // instant, with the date inside a config instead of a parameter of its own, reads here as
    // naming no moment — so the rule is invisible and `DECISION_BOUND` says so.
    expect(planted(fixtureText("moment-probe-in-a-config"))).not.toContain(`${PROBE}::probeDecide`);
    // And the control fires, or the silence above measures nothing.
    expect(planted(fixtureText("moment-probe-guarded"))).toContain(`${PROBE}::probeDecide`);
  });

  it("does not report the same rule once it is handed the panel it guards", () => {
    // The control and the variant differ in the NAME OF ONE PARAMETER, which is the whole of the
    // distinction and is what `DECISION_BOUND` says out loud.
    expect(planted(fixtureText("moment-probe-panel"))).not.toContain(`${PROBE}::probeDecide`);
  });
});

describe("W387 the gap, measured on the synthetic cohort", () => {
  it("has a patient the guard admits on one day and refuses six days later", () => {
    // The control. Without this the pool assertion below measures nothing: it would be reporting
    // that a rule invites somebody the guard still allows.
    expect(guardedOn(GUARD_DAY, SLIPPING.panel).map((p) => p.id as string)).toContain(SLIPPING.id);
    expect(guardedOn(POOL_DAY, SLIPPING.panel).map((p) => p.id as string)).not.toContain(SLIPPING.id);
  });

  it("invites that patient anyway, because the pool decides at its own date on the older guard", () => {
    // THE FINDING. `buildInvitationPool` is handed the set as it stood on the guard's day and
    // stamps its batch with the session's, and the two are not the same day.
    const asGuarded = guardedOn(GUARD_DAY, SLIPPING.panel);
    const pool = buildInvitationPool(
      POOL_DAY,
      CLINICIAN,
      WORLD.appointments,
      asGuarded,
      DEFAULT_POOL_CONFIG,
      // The ranking seam, used to put the patient in front rather than to hope the default does.
      // A PERMUTATION OF WHAT IT IS HANDED, which is the seam's own contract and is what makes this
      // a reading rather than an injection: a first draft prepended the patient from a closure, so
      // the batch held them however the pool had filtered, and a pool that re-guarded still passed.
      (eligible) =>
        [...eligible].sort((a, b) =>
          (a.id as string) === SLIPPING.id ? -1 : (b.id as string) === SLIPPING.id ? 1 : 0,
        ),
    );
    expect(pool.length, "no batch was built, so the assertion below measures nothing").toBeGreaterThan(0);
    expect(pool.map((i) => i.patientId as string)).toContain(SLIPPING.id);
  });

  it("does not invite them through the rule that guards at its own moment, which is the contrast", () => {
    // `buildBackfillPool` takes the PANEL and calls `eligibleForClinician` itself with the date it
    // was given. Same cohort, same patient, same day — and the guard is the day's own.
    const freed = WORLD.appointments.find(
      (a) => a.clinicianId === CLINICIAN.id && a.startsAt.slice(0, 10) === POOL_DAY,
    )!;
    const result = buildBackfillPool(
      { ...freed, status: "open" },
      CLINICIAN,
      SLIPPING.panel,
      DEFAULT_CONFIG,
      DEFAULT_SESSION_CONFIG,
      DEFAULT_POOL_CONFIG,
      POOL_DAY,
      NO_INVITES,
      POOL_DAY,
    );
    expect(result.invitations.map((i) => i.patientId as string)).not.toContain(SLIPPING.id);
  });

  it("crosses no founder gate: every patient is generated and nothing is sent", () => {
    // W373's rule, kept here: the cohort is the seeded generator's and the only edited field is a
    // date on a generated patient. No message is rendered and no store is written.
    expect(WORLD.patients.length).toBe(120);
    expect(SLIPPING.panel.length).toBe(WORLD.patients.length);
    expect(SLIPPING.panel.filter((p) => p.id === SLIPPING.id)).toHaveLength(1);
  });
});

describe("W387 the bound", () => {
  it("says which halves are names and which question it does not ask", () => {
    expect(DECISION_BOUND.length).toBeGreaterThan(600);
    expect(DECISION_BOUND).toContain("A MOMENT IS FOUND BY THE NAME OF A PARAMETER");
    expect(DECISION_BOUND).toContain("THE GUARD ITSELF IS NOT READ");
  });
});

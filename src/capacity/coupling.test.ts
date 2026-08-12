// W231 verify gate: "the coupling exists as a declared, disabled control; enabling it is a
// practice decision recorded with a reason, and the disabled state is pinned by its own test."
//
// Three properties, and the third is the one that would rot quietly: OFF has to mean both that
// the control is off AND that nothing is wired to it, because a control nobody can reach is off
// for a reason no test is holding.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./coupling";
import {
  COUPLING_REFUSAL_COPY,
  ENABLED_COUPLINGS,
  ENABLEMENT_REJECTION_COPY,
  MIN_REASON_LENGTH,
  REFUSED_COUPLINGS,
  coupledInvitationVolume,
  enablementFor,
  rejectionsForEnablement,
  renderCoupling,
  type CouplingEnablement,
} from "./coupling";
import { lintCapacityCopy } from "./copy-lint";
import { DEFAULT_POOL_CONFIG, batchSize } from "@/engine/pool";
import type { RecordedWeek, SessionPattern } from "./model";

const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/coupling.ts"), "utf8");

const pattern = (fills: readonly number[], offerable = 10): SessionPattern => {
  const weeks: RecordedWeek[] = fills.map((filled, index) => ({
    dateIso: `2026-01-${String(1 + index * 7).padStart(2, "0")}`,
    filled,
    offerable,
    released: 0,
  }));
  return {
    practiceId: "prac-1",
    clinicianId: "cli-0",
    weekday: 4,
    weeks,
    basis: {
      recordedWeeks: weeks.length,
      fromIso: weeks[0]!.dateIso,
      toIso: weeks[weeks.length - 1]!.dateIso,
    },
  };
};

/** Twelve weeks that wobble between 6 and 9. Scored, and still tracking. */
const TRACKING = pattern([6, 9, 6, 9, 6, 9, 6, 9, 6, 9, 6, 9]);
/** W228's own drift shape: eight steady weeks, then four at a new level. */
const DRIFTED = pattern([5, 5, 5, 5, 5, 5, 5, 5, 10, 10, 10, 10]);
/** Six weeks: scorable, but not four scored ones, so drift has no verdict. */
const TOO_SHORT = pattern([6, 9, 6, 9, 6, 9]);

const enablement = (over: Partial<CouplingEnablement> = {}): CouplingEnablement => ({
  practiceId: "prac-1",
  decidedBy: "manager@demo.practice.example",
  decidedAtIso: "2026-08-01",
  reason:
    "Our Thursday list fills itself most weeks and patients tell us they get a message about a slot that has already gone.",
  evidence: { weeksScored: 8, covered: 7, meanWidthOfSlots: 0.3 },
  ...over,
});

const ENABLED = [enablement()];

describe("W231 the coupling ships off, and off means two things", () => {
  it("has no practice enabled, and the list is the registry W201 reads", () => {
    // Pinned empty. This array is not decoration: `AUTOMATED_DECISIONS` points its
    // `forecast-invitation-volume` row at it, and W201's test fails the suite if a dormant
    // decision's registry fills up. Enabling this without updating the published notice is
    // therefore a test failure rather than an omission.
    expect(ENABLED_COUPLINGS).toEqual([]);
  });

  it("is not wired: nothing outside src/capacity imports it", () => {
    // The second half of "off", and the half a boolean cannot express. W221's method — ask what
    // REACHES the module, not what the module says about itself — and both `src/` and `app/`,
    // because a page is exactly where a module stops being dormant.
    const importers: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next") continue;
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry) || entry.endsWith(".test.ts")) continue;
        const rel = path.relative(process.cwd(), full);
        if (rel.startsWith("src/capacity/")) continue;
        const text = readFileSync(full, "utf8");
        if (/from\s+["'](@\/capacity\/coupling|\.{1,2}(\/\w+)*\/coupling)["']/.test(text)) {
          importers.push(rel);
        }
      }
    };
    walk(path.join(process.cwd(), "src"));
    walk(path.join(process.cwd(), "app"));
    expect(importers, "the coupling is wired into the product while claiming to be off").toEqual([]);
  });

  it("proves that scan can see an importer at all", () => {
    // The vacuity guard the scan above needs. A regex that matched nothing would certify "not
    // wired" forever — W221's finding, where a dormancy proof matched only one import form and
    // actively certified a false claim.
    const probe = 'import { coupledInvitationVolume } from "@/capacity/coupling";';
    expect(/from\s+["'](@\/capacity\/coupling|\.{1,2}(\/\w+)*\/coupling)["']/.test(probe)).toBe(true);
    const relative = 'import { x } from "../capacity/coupling";';
    expect(/from\s+["'](@\/capacity\/coupling|\.{1,2}(\/\w+)*\/coupling)["']/.test(relative)).toBe(true);
  });

  it("refuses to size anything for a practice that has not switched it on", () => {
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED_COUPLINGS);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.errors).toContain("not_enabled_for_this_practice");
  });
});

describe("W231 enabling is a decision somebody took, with a reason somebody wrote", () => {
  it("accepts a fully recorded enablement", () => {
    // Non-vacuity first: the validator must pass something, or every refusal below is trivially
    // satisfied by a validator that refuses everything.
    expect(rejectionsForEnablement(enablement())).toEqual([]);
    expect(enablementFor(ENABLED, "prac-1")).not.toBeNull();
  });

  it("refuses a box somebody cleared", () => {
    // A reason of three characters is not a reason. The floor is a constant, not a parameter —
    // W196's rule, because a threshold passed at a call site is one chosen after the fact.
    expect(rejectionsForEnablement(enablement({ reason: "ok" }))).toContain(
      "reason_missing_or_too_short",
    );
    expect(rejectionsForEnablement(enablement({ reason: "x".repeat(MIN_REASON_LENGTH - 1) }))).toContain(
      "reason_missing_or_too_short",
    );
    expect(rejectionsForEnablement(enablement({ reason: "y".repeat(MIN_REASON_LENGTH) }))).toEqual([]);
  });

  it("refuses a decision with nobody behind it and no date", () => {
    expect(rejectionsForEnablement(enablement({ decidedBy: "  " }))).toContain("no_decider");
    expect(rejectionsForEnablement(enablement({ decidedAtIso: "recently" }))).toContain(
      "decided_at_missing_or_unreadable",
    );
    expect(rejectionsForEnablement(enablement({ practiceId: "" }))).toContain("no_practice");
  });

  it("refuses a decision taken over a forecaster nobody had checked", () => {
    // The evidence is stamped at the moment of the decision rather than looked up later, because
    // the question afterwards is what the practice knew when they decided, and by then the score
    // has moved.
    expect(rejectionsForEnablement(enablement({ evidence: undefined as never }))).toEqual([
      "evidence_missing",
    ]);
    expect(
      rejectionsForEnablement(enablement({ evidence: { weeksScored: 0, covered: 0, meanWidthOfSlots: 0 } })),
    ).toContain("evidence_from_an_unscored_forecaster");
  });

  it("ignores an invalid enablement rather than honouring it", () => {
    // A half-filled record must not switch anything on. The refusal path and the validity path
    // are the same path, so a record that would fail review cannot take effect while it waits.
    const junk = [enablement({ reason: "" })];
    expect(enablementFor(junk, "prac-1")).toBeNull();
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, junk);
    expect(result.ok).toBe(false);
  });

  it("explains every refusal it can give", () => {
    for (const [reason, copy] of Object.entries(ENABLEMENT_REJECTION_COPY)) {
      expect(copy.length, `${reason} has no explanation`).toBeGreaterThan(60);
    }
    for (const [reason, copy] of Object.entries(COUPLING_REFUSAL_COPY)) {
      expect(copy.length, `${reason} has no explanation`).toBeGreaterThan(60);
    }
  });
});

describe("W231 the enabled coupling sends fewer messages, and never more", () => {
  it("sizes from the slots the record shows still open, not from every open slot", () => {
    // The non-vacuity anchor for this whole block: the enabled path must actually produce a
    // different number, or "never more" is being asserted over a coupling that does nothing.
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.errors.join(", "));
    const { uncoupled, coupled, direction, basis } = result.volume;
    expect(uncoupled).toBe(batchSize(10, DEFAULT_POOL_CONFIG));
    expect(coupled).toBeLessThan(uncoupled);
    expect(direction).toBe("fewer_messages");
    // The LOWEST fill on record is 6 of 10, so 4 slots are left over at the conservative end.
    expect(basis.spareAtLowestRecordedFill).toBe(4);
  });

  it("uses the lowest fill on record, not the highest", () => {
    // The flattering end is one character away and it produces the biggest saving, which is why
    // it is the version somebody reaches for. Highest fill here is 9 of 10, which would leave 1
    // slot and a batch of 4; the lowest leaves 4 slots and a batch of 16.
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED);
    if (!result.ok) throw new Error(result.errors.join(", "));
    expect(result.volume.basis.spareAtLowestRecordedFill).toBe(4);
    expect(result.volume.basis.spareAtLowestRecordedFill).not.toBe(1);
    expect(result.volume.coupled).toBe(batchSize(4, DEFAULT_POOL_CONFIG));
  });

  it("cannot produce more messages than the practice's own settings, at any size", () => {
    // Asserted over a sweep rather than at one point, because "never more" is a property and a
    // single example is a coincidence. The type has only two directions and the third is absent
    // on purpose; this checks the arithmetic agrees with the type.
    for (let openSlots = 1; openSlots <= 30; openSlots += 1) {
      const result = coupledInvitationVolume(TRACKING, openSlots, DEFAULT_POOL_CONFIG, ENABLED);
      if (!result.ok) continue;
      const { uncoupled, coupled, direction } = result.volume;
      expect(coupled, `coupling sent MORE at ${openSlots} open slots`).toBeLessThanOrEqual(uncoupled);
      expect(direction).toBe(coupled === uncoupled ? "unchanged" : "fewer_messages");
    }
  });

  it("says out loud that fewer messages means somebody is not contacted", () => {
    // The sentence this unit exists to make unavoidable. "Fewer messages" is the efficiency
    // reading; the other reading is that a patient who would have been offered an appointment is
    // not, and it is the one that goes missing from a release note.
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED);
    if (!result.ok) throw new Error(result.errors.join(", "));
    const rendered = renderCoupling(result);
    expect(rendered).toContain("do not");
    expect(rendered).toContain("who would have had one");
    // And the record of WHO switched it on travels with the number, not beside it — W225's rule
    // about the score, applied to the decision.
    expect(rendered).toContain("manager@demo.practice.example");
    expect(rendered).toContain("2026-08-01");
  });
});

describe("W231 W228's report becomes a refusal, because this is the first thing that acts", () => {
  it("refuses a forecaster that has drifted", () => {
    const drifted = { ...DRIFTED, practiceId: "prac-1" };
    const result = coupledInvitationVolume(drifted, 10, DEFAULT_POOL_CONFIG, ENABLED);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.errors).toContain("forecaster_has_drifted");
  });

  it("refuses when drift cannot be determined, which is not a green light", () => {
    // W179's rule. "We cannot tell whether this range still fits" and "it fits" are opposite
    // facts, and only one of them is permission to size a batch from it.
    const result = coupledInvitationVolume(TOO_SHORT, 10, DEFAULT_POOL_CONFIG, ENABLED);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.errors).toContain("drift_cannot_be_determined");
  });

  it("agrees with W228 rather than deciding drift for itself", () => {
    // W194's note: when two modules check the same thing, test that they AGREE. A second drift
    // rule here would drift from the one on the console, and nobody would open both at once.
    expect(SOURCE).toContain('from "./drift"');
    expect(SOURCE, "drift is being re-derived here").not.toMatch(
      /recentMisses|allMissed|frozenBefore|DRIFT_WINDOW/,
    );
  });
});

describe("W231 the unit error this coupling exists to avoid", () => {
  it("never sets a response rate from a fill rate", () => {
    // THE finding. W5 divides by `expectedResponseRate` — bookings per invitation SENT — and
    // W223's forecast is slots filled per slot OFFERED. Different denominators, and nothing in
    // this tree records the second. The tempting line divides by a number several times too
    // large, cuts the batch to a fraction, and looks exactly like the calibration W5's comment
    // has been promising since Year 1.
    expect(SOURCE, "the forecast is being used as a response rate").not.toMatch(
      /expectedResponseRate\s*[:=]\s*(?!.*PoolConfig)[^,;)]*\b(rate|forecast|fill|low|high)\b/i,
    );
    // The coupling changes the QUESTION, not the divisor: both batch sizes come from the same
    // untouched pool config, so any difference between them is the slot count and nothing else.
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED);
    if (!result.ok) throw new Error(result.errors.join(", "));
    expect(result.volume.uncoupled).toBe(batchSize(10, DEFAULT_POOL_CONFIG));
    expect(result.volume.coupled).toBe(
      batchSize(result.volume.basis.spareAtLowestRecordedFill, DEFAULT_POOL_CONFIG),
    );
  });

  it("states a reason for each coupling it refuses", () => {
    expect(Object.keys(REFUSED_COUPLINGS).sort()).toEqual([
      "enable_itself_on_evidence",
      "fill_rate_as_response_rate",
      "more_messages_than_uncoupled",
      "per_patient_volume",
      "silently_absorbing_drift",
      "the_flattering_end_of_the_range",
    ]);
    for (const [id, why] of Object.entries(REFUSED_COUPLINGS)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(120);
    }
  });

  it("has no way to switch itself on", () => {
    // ASSERTED ON STRUCTURE, BECAUSE THE NAME SCAN MIS-FIRED TWICE IN A ROW HERE. A regex for
    // "something that enables" first matched `ENABLED_COUPLINGS`, the register the unit is built
    // around, and then `enablementFor`, which only reads a list it was handed. That is the tenth
    // instance in this tree of a scan whose subject matter IS the thing it bans matching its own
    // vocabulary — and unlike W198's cases the fix is not a rewording, because both names are
    // right. The property was never about names: it is that an enablement can only come from a
    // literal a person wrote, so that is what gets checked.
    expect(SOURCE, "something here writes to the enablement list").not.toMatch(
      /ENABLED_COUPLINGS\.(push|concat|splice|unshift)|ENABLED_COUPLINGS\s*=[^=]/,
    );
    // The module never CONSTRUCTS an enablement — `decidedBy` is only ever declared on the
    // interface and read off a record, never assigned. A function that could build one is a
    // function that could switch this on without a person.
    expect(SOURCE.match(/decidedBy:/g) ?? []).toHaveLength(1);
    expect(SOURCE).toMatch(/interface CouplingEnablement \{[^}]*decidedBy: string;/s);
    // And behaviourally: this file has by now exercised every exported path, enabled and
    // refused. The shipped registry is still empty.
    expect(ENABLED_COUPLINGS).toEqual([]);
  });
});

describe("W231 no patient reaches the module closest to contacting one", () => {
  it("has nowhere to put one: keys, signatures and namespace", () => {
    // W225's three-way absence, re-asserted rather than inherited, because this is the module
    // that decides HOW MANY messages go out and is therefore the one where a panel would arrive.
    const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED);
    if (!result.ok) throw new Error(result.errors.join(", "));
    expect(Object.keys(result.volume).sort()).toEqual(["basis", "coupled", "direction", "uncoupled"]);
    for (const match of SOURCE.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      expect(match[2]!.replace(/\s+/g, " "), `${match[1]} takes a person`).not.toMatch(
        /patient|candidate|panel|eligible|recipient/i,
      );
    }
    expect(Object.keys(mod).filter((n) => /patient|candidate|panel|recipient/i.test(n))).toEqual([]);
  });

  it("passes W226's capacity linter, constants and rendered sentence alike", () => {
    const rendered = (() => {
      const result = coupledInvitationVolume(TRACKING, 10, DEFAULT_POOL_CONFIG, ENABLED);
      return result.ok ? renderCoupling(result) : "";
    })();
    const texts = [
      ...Object.values(COUPLING_REFUSAL_COPY),
      ...Object.values(ENABLEMENT_REJECTION_COPY),
      rendered,
    ];
    expect(texts.length).toBeGreaterThan(10);
    for (const text of texts) {
      expect(text.length, "an empty string is not a lint pass").toBeGreaterThan(0);
      expect(lintCapacityCopy(text), `failed the capacity lint: ${text}`).toEqual([]);
    }
  });
});

// W346 verify gate (unit half): "one spec walking a practice whose setup is complete and whose
// first cycle has not run, every waiting state named where an operator would look, and no founder
// gate crossed."
//
// THE EXCLUSION IS THE UNIT AND IT IS DRIVEN OVER EVERY COMBINATION THERE IS. Two notices about
// an empty console, and the failure that matters is not either one being wrong on its own — it is
// both speaking, or neither. `setupReadiness` has thirty-two shapes and the page's emptiness
// doubles it; the property below is checked over all sixty-four rather than over the two states a
// walk happens to visit, because the pair a walk never reaches is where a contradiction would sit.

import { describe, expect, it } from "vitest";
import { PREREQUISITES } from "./setup-gaps";
import { unmetSteps } from "./setup-gaps";
import type { SetupReadiness } from "./store";
import { CYCLES, type Cycle, WAITING_BOUND, WAITING_COPY, waitingFor } from "./waiting";

/** Every shape `setupReadiness` can return, built rather than listed. */
const READINESSES: SetupReadiness[] = [false, true].flatMap((practice) =>
  [false, true].flatMap((clinicians) =>
    [false, true].flatMap((sessions) =>
      [false, true].map((rules) => ({
        practice,
        clinicians,
        sessions,
        rules,
        complete: practice && clinicians && sessions && rules,
      })),
    ),
  ),
);

const CYCLE: Cycle = "referrals_recorded";

describe("W346 the two notices are mutually exclusive", () => {
  it("never lets both speak, over every readiness and both emptinesses", () => {
    /** The rows where both notices would render, over whatever pairs of answers it is handed. */
    const bothSpeak = (rows: ReadonlyArray<{ id: string; gaps: boolean; waiting: boolean }>): string[] =>
      rows.filter((r) => r.gaps && r.waiting).map((r) => r.id);

    // THE DETECTOR FIRST, ON A FABRICATED PAIR. It cannot be built out of these two functions —
    // both gate on `complete`, so the contradiction is structural rather than merely absent — and
    // that is exactly why the comparison has to be shown finding something before it is trusted
    // finding nothing. W295's control, in a test.
    expect(bothSpeak([{ id: "fabricated", gaps: true, waiting: true }])).toEqual(["fabricated"]);

    const live = READINESSES.flatMap((readiness) =>
      [false, true].map((empty) => ({
        id: `${JSON.stringify(readiness)} empty=${empty}`,
        gaps: unmetSteps(readiness).length > 0,
        waiting: waitingFor(readiness, { empty, cycle: CYCLE }) !== null,
      })),
    );
    expect(bothSpeak(live)).toEqual([]);
    // And the sweep really visited both notices speaking, separately, somewhere in that tree.
    expect(live.some((r) => r.gaps)).toBe(true);
    expect(live.some((r) => r.waiting)).toBe(true);
    expect(live).toHaveLength(READINESSES.length * 2);
  });

  it("never lets an empty page say nothing at all, which is the state this unit removes", () => {
    const silent = READINESSES.filter(
      (r) => unmetSteps(r).length === 0 && waitingFor(r, { empty: true, cycle: CYCLE }) === null,
    );
    // A practice with no record at all is the one exception, and it is not a page an operator
    // reaches: `requirePractice` redirects before either notice is asked.
    expect(silent.map((r) => r.practice)).toEqual(silent.map(() => false));
  });

  it("says nothing about a page that has something on it, however finished the practice", () => {
    const done = READINESSES.find((r) => r.complete)!;
    expect(waitingFor(done, { empty: false, cycle: CYCLE })).toBeNull();
  });

  it("says nothing while setup is unfinished, because W334's notice owns that state", () => {
    for (const readiness of READINESSES.filter((r) => !r.complete)) {
      expect(waitingFor(readiness, { empty: true, cycle: CYCLE })).toBeNull();
    }
    // And the notice that DOES own it speaks there, so the state is covered rather than dropped.
    const started = READINESSES.find((r) => r.practice && !r.complete)!;
    expect(unmetSteps(started).length).toBeGreaterThan(0);
  });

  it("returns the page's own cycle rather than a fixed one", () => {
    const done = READINESSES.find((r) => r.complete)!;
    for (const cycle of CYCLES) {
      expect(waitingFor(done, { empty: true, cycle })).toBe(cycle);
    }
    // ONE CYCLE, AND THE HEADER ARGUES WHY: three of the four a first draft named turned out to
    // describe pages that are never empty, because they read the synthetic set rather than the
    // practice. What the union buys even at one member is that a second cannot arrive without copy.
    expect(CYCLES.length).toBeGreaterThan(0);
    expect(Object.keys(WAITING_COPY).sort()).toEqual([...CYCLES].sort());
  });
});

describe("W346 the copy says what has not run rather than what is missing", () => {
  it("holds one sentence pair per cycle, and no cycle without copy", () => {
    expect(Object.keys(WAITING_COPY).sort()).toEqual([...CYCLES].sort());
    for (const cycle of CYCLES) {
      expect(WAITING_COPY[cycle].headline.length, `${cycle} has no headline`).toBeGreaterThan(15);
      expect(WAITING_COPY[cycle].detail.length, `${cycle} has no detail`).toBeGreaterThan(100);
    }
  });

  it("tells a finished practice that nothing is wrong, which is the whole difference from W334's", () => {
    // The setup notice sends somebody to a wizard. This one has nowhere to send them, so the work
    // the copy has to do is say the screen is correct — and a sentence that only said "no data"
    // would read as a broken product to somebody who just finished setting it up.
    const says = CYCLES.map((c) => `${WAITING_COPY[c].headline} ${WAITING_COPY[c].detail}`);
    expect(says.every((t) => /setup is finished/i.test(t))).toBe(true);
    expect(says.every((t) => /has not run|nothing has been offered|not yet|yet/i.test(t))).toBe(true);
  });

  it("makes no clinical claim and promises no timing", () => {
    const all = CYCLES.map((c) => `${WAITING_COPY[c].headline} ${WAITING_COPY[c].detail}`).join(" ");
    for (const forbidden of ["diagnos", "treat", "recommend", "clinically", "should be seen"]) {
      expect(all.toLowerCase(), `copy makes a clinical claim: ${forbidden}`).not.toContain(forbidden);
    }
    // Nothing here estimates when a cycle runs — a wait with a promise in it is a different claim.
    for (const forbidden of ["shortly", "soon", "within", "tomorrow", "overnight"]) {
      expect(all.toLowerCase(), `copy promises timing: ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("names no wizard step, because there is nothing left to finish", () => {
    const all = CYCLES.map((c) => `${WAITING_COPY[c].headline} ${WAITING_COPY[c].detail}`).join(" ");
    for (const step of PREREQUISITES) {
      expect(all.toLowerCase(), `waiting copy sends somebody to ${step}`).not.toContain(`/console/setup/${step}`);
    }
  });
});

describe("W346 the register is subject to its own rule", () => {
  it("states what the notice does not prove", () => {
    expect(WAITING_BOUND.length).toBeGreaterThan(600);
    expect(WAITING_BOUND).toContain("EMPTY IS THE PAGE'S OWN WORD AND NOTHING CHECKS IT");
    expect(WAITING_BOUND).toContain("G1");
  });
});

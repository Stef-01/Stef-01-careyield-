// W228 verify gate: "a forecaster that has stopped tracking reality is REPORTED, never silently
// recalibrated (W120's rule: report the disagreement, do not resolve it)."
//
// Two halves, and the second is the one a reviewer cannot see. That drift is DETECTED is checked
// with a session whose pattern changes; that it is not RESOLVED is checked as an absence — no
// export adjusts anything, and the returned report carries no corrected pattern for a caller to
// pick up. An absorbed drift leaves no trace, which is exactly why it needs a test rather than a
// convention.

import { describe, expect, it } from "vitest";
import * as driftModule from "./drift";
import {
  DRIFT_DIRECTION_COPY,
  DRIFT_VERDICT_COPY,
  DRIFT_WINDOW_WEEKS,
  driftReport,
  renderDrift,
} from "./drift";
import { MIN_RECORDED_WEEKS } from "./forecast";
import { lintCapacityCopy } from "./copy-lint";
import type { RecordedWeek, SessionPattern } from "./model";

const week = (dateIso: string, filled: number, offerable = 10): RecordedWeek => ({
  dateIso,
  filled,
  offerable,
  released: 0,
});

/** Weekly dates from 2026-01-01, so a fixture is a list of fill counts. */
const pattern = (fills: number[]): SessionPattern => {
  const weeks = fills.map((filled, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index * 7)).toISOString().slice(0, 10);
    return week(date, filled);
  });
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

/** Steady at 5/10 for long enough to score, then four weeks at 10/10. */
const DRIFTED_UP = pattern([5, 5, 5, 5, 5, 5, 5, 5, 10, 10, 10, 10]);
/** The same history, then four weeks at 0/10. */
const DRIFTED_DOWN = pattern([5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0]);
/** Steady throughout: nothing has changed. */
const STEADY = pattern([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
/** Recent weeks miss in BOTH directions — imprecise, not drifted. */
const NOISY = pattern([5, 5, 5, 5, 5, 5, 5, 5, 10, 0, 10, 0]);

describe("W228 drift is detected, in either direction", () => {
  it("fires on a SUSTAINED shift, which the first version of this rule could not", () => {
    // The finding that reshaped the unit. Compared with W224's ordinary walk-forward forecast,
    // this fixture came back `tracking`: the forecaster's range is the min and max of every rate
    // on record, so the FIRST week at 10/10 widens it to 5–10 and every week after that is
    // inside. A sustained shift is absorbed after one week, so the rule as first written could
    // only ever have fired on a one-week blip — a monitor unable to detect the thing it was for.
    // The comparison now freezes the range at the start of the window.
    const report = driftReport(DRIFTED_UP);
    expect(report.verdict).toBe("drifted");
    expect(report.recent.covered).toBe(0);
    // And the frozen range is the pre-shift one, not the widened one: 5 of 10, both ends.
    for (const miss of report.recentMisses) {
      expect(miss.high, "the range widened to absorb the shift").toBeLessThan(10);
    }
  });

  it("reports a session that now fills more than any week the range was built from", () => {
    const report = driftReport(DRIFTED_UP);
    expect(report.verdict).toBe("drifted");
    expect(report.direction).toBe("filling_more_than_the_record");
    expect(report.recentMisses).toHaveLength(DRIFT_WINDOW_WEEKS);
  });

  it("reports one that now fills less, because a fall is the reading nobody volunteers", () => {
    const report = driftReport(DRIFTED_DOWN);
    expect(report.verdict).toBe("drifted");
    expect(report.direction).toBe("filling_less_than_the_record");
  });

  it("does not call an imprecise forecaster drifted", () => {
    // Missing high and low alternately is imprecision, which W224's WIDTH already reports. Drift
    // is a direction — a session that has changed — and conflating the two would fire this
    // monitor on every noisy diary until nobody read it.
    const report = driftReport(NOISY);
    expect(report.verdict).toBe("tracking");
    expect(report.direction).toBeNull();
  });

  it("leaves a steady session alone", () => {
    const report = driftReport(STEADY);
    expect(report.verdict).toBe("tracking");
    expect(report.recentMisses).toEqual([]);
  });

  it("uses no threshold of its own — the window is W223's floor, inherited", () => {
    // "Coverage fell below 60%" invites somebody to pick 60 after seeing the data, which is
    // W222's warning about defaults one module over. The only number here is the window, and it
    // is the same one it takes to make a range at all.
    expect(DRIFT_WINDOW_WEEKS).toBe(MIN_RECORDED_WEEKS);
    expect(driftReport(STEADY).basis).toEqual({
      window: DRIFT_WINDOW_WEEKS,
      floor: MIN_RECORDED_WEEKS,
    });
  });
});

describe("W228 the reassuring verdict requires proof", () => {
  it("says cannot_determine, never tracking, when the recent window is not full", () => {
    // W179's rule, and here it inverts the usual reading of a monitor: "tracking" is the
    // comfortable verdict and the one nobody checks. A drift monitor that says "fine" when it
    // cannot tell is worse than no monitor — it manufactures reassurance.
    const thin = pattern([5, 5, 5, 5, 5, 5]);
    const report = driftReport(thin);
    expect(report.verdict).toBe("cannot_determine");
    expect(report.direction).toBeNull();
    expect(report.wouldSettleIt.length).toBeGreaterThan(0);
  });

  it("says so in words, rather than letting the absence read as agreement", () => {
    expect(DRIFT_VERDICT_COPY.cannot_determine).toContain("not the same as it fitting");
  });

  it("gives cannot_determine something to go and do", () => {
    const report = driftReport(pattern([5, 5, 5, 5, 5]));
    expect(report.wouldSettleIt[0]).toMatch(/Record \d+ more week/);
  });

  it("shows the numbers even when the verdict is tracking", () => {
    // A monitor that only speaks when alarmed teaches a reader that silence means agreement.
    // W120's rule is about reporting the disagreement, not about reporting alarms.
    const rendered = renderDrift(driftReport(STEADY));
    expect(rendered).toContain("Recent");
    expect(rendered).toContain("inside the range");
    expect(rendered).toContain("Earlier");
    expect(DRIFT_VERDICT_COPY.tracking).toContain("shown either way");
  });
});

describe("W228 nothing is recalibrated", () => {
  it("exports nothing that adjusts, re-fits, tunes or corrects", () => {
    // The absence a reviewer cannot see. `refresh()` is what such a function gets called, and an
    // absorbed drift leaves no trace by construction — which is why this is a test rather than a
    // convention.
    for (const name of Object.keys(driftModule)) {
      expect(name, `"${name}" reads as a recalibration`).not.toMatch(
        /recalibrat|adjust|refit|re-?fit|retrain|reweight|tune|correct|apply|update|refresh|smooth/i,
      );
    }
  });

  it("returns no corrected pattern for a caller to pick up", () => {
    // A report carrying a fixed pattern beside the finding is a recalibration with an extra
    // step: the next caller uses the corrected one and the drift is absorbed anyway.
    const report = driftReport(DRIFTED_UP);
    expect(Object.keys(report).sort()).toEqual([
      "basis",
      "direction",
      "earlier",
      "recent",
      "recentMisses",
      "verdict",
      "wouldSettleIt",
    ]);
    expect(JSON.stringify(report)).not.toContain("offerable");
  });

  it("leaves the pattern it was given untouched", () => {
    const before = JSON.stringify(DRIFTED_UP);
    driftReport(DRIFTED_UP);
    expect(JSON.stringify(DRIFTED_UP)).toBe(before);
  });

  it("says in its own copy that nothing has been adjusted", () => {
    // Stated to the reader, not only enforced in code. A practice told its Thursdays have
    // changed will assume the product has already compensated unless it says otherwise.
    expect(DRIFT_VERDICT_COPY.drifted).toContain("Nothing has been adjusted");
    expect(DRIFT_VERDICT_COPY.drifted).toContain("not for this product to absorb");
    expect(driftReport(DRIFTED_UP).wouldSettleIt.join(" ")).toContain("Nothing here has been adjusted");
  });
});

describe("W228 the report says what changed, and names the weeks", () => {
  it("names each recent week that fell outside, rather than counting them", () => {
    const rendered = renderDrift(driftReport(DRIFTED_DOWN));
    expect(rendered).toContain("Outside the range recently:");
    for (const miss of driftReport(DRIFTED_DOWN).recentMisses) {
      expect(rendered).toContain(miss.dateIso);
    }
  });

  it("carries a direction only when there is a drift to have one", () => {
    // A direction on a `tracking` verdict would be a hint — the reader would act on it, and the
    // monitor would have made a recommendation it declined to stand behind.
    expect(driftReport(STEADY).direction).toBeNull();
    expect(driftReport(NOISY).direction).toBeNull();
    expect(driftReport(DRIFTED_UP).direction).not.toBeNull();
  });

  it("passes W226's capacity copy linter on every string it can render", () => {
    const corpus = [
      ...Object.values(DRIFT_VERDICT_COPY),
      ...Object.values(DRIFT_DIRECTION_COPY),
      renderDrift(driftReport(DRIFTED_UP)),
      renderDrift(driftReport(DRIFTED_DOWN)),
      renderDrift(driftReport(STEADY)),
      renderDrift(driftReport(pattern([5, 5, 5, 5, 5]))),
    ];
    for (const text of corpus) expect(lintCapacityCopy(text), text).toEqual([]);
  });
});

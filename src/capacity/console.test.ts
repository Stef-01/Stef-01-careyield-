// W229 verify gate (unit half): the two emptinesses are kept apart, and a session the record
// cannot answer for still appears. The e2e half is `e2e/capacity.spec.ts` — this decides WHICH
// reading a row gets, that one checks all of them survive onto a page as distinguishable things.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./console";
import {
  CAPACITY_CONSOLE_COPY,
  NO_DIARY_WOULD_SETTLE_IT,
  capacityConsoleView,
  renderReading,
  type SessionRow,
} from "./console";
import { lintCapacityCopy } from "./copy-lint";
import { MIN_RECORDED_WEEKS } from "./forecast";
import type { RecordedUtilisation } from "./model";

// Read once, and asserted non-empty, so a scan that finds nothing because the path moved fails
// loudly rather than certifying a clean result over an empty string — W221's finding.
const SOURCE = readFileSync(path.join(process.cwd(), "src/capacity/console.ts"), "utf8");
const readFileSyncOnce = () => {
  expect(SOURCE.length, "console.ts read back too short to scan").toBeGreaterThan(1000);
  return SOURCE;
};

const ISO = (week: number) => {
  const day = 5 + week * 7; // Thursdays in a 2026 month-agnostic run; only ordering matters.
  return `2026-${String(1 + Math.floor(day / 28)).padStart(2, "0")}-${String((day % 28) + 1).padStart(2, "0")}`;
};

/** A session with `weeks` recorded weeks, each offering `offerable` slots and filling `filled`. */
const session = (
  clinicianId: string,
  weekday: number,
  weeks: Array<{ filled: number; offerable: number }>,
): RecordedUtilisation[] =>
  weeks.map((week, index) => ({
    session: {
      practiceId: "prac-1",
      clinicianId,
      dateIso: ISO(index),
      weekday,
      slots: week.offerable,
    },
    filled: week.filled,
    open: week.offerable - week.filled,
    released: 0,
  }));

/**
 * Eight weeks that always leave a slot open. Enough to clear W223's floor and be scored.
 *
 * THE FILL RATE VARIES ON PURPOSE, and the first version of this fixture did not. Eight identical
 * weeks at 8/10 give `low === high === 8`, so the forecast interval is a point — and a mutation
 * that swapped the spare endpoints changed nothing and every assertion still passed. W219 hit the
 * same shape. Alternating 6 and 9 makes the interval real, and the guard below pins that.
 */
const HAS_SPARE = session(
  "cli-spare",
  4,
  Array.from({ length: 8 }, (_, index) => ({ filled: index % 2 === 0 ? 6 : 9, offerable: 10 })),
);

/** Eight weeks that filled everything. The "no capacity" reading, and not an absence. */
const NO_SPARE = session(
  "cli-full",
  4,
  Array.from({ length: 8 }, () => ({ filled: 10, offerable: 10 })),
);

/** Two weeks: recorded, but under W223's floor. The "no data" reading at row level. */
const TOO_FEW = session("cli-new", 4, [
  { filled: 4, offerable: 10 },
  { filled: 6, offerable: 10 },
]);

const ALL_THREE = [...HAS_SPARE, ...NO_SPARE, ...TOO_FEW];

const rowFor = (rows: readonly SessionRow[], clinicianId: string): SessionRow => {
  const found = rows.find((row) => row.clinicianId === clinicianId);
  if (!found) throw new Error(`no row for ${clinicianId} — the fixture is not exercising this test`);
  return found;
};

const sessionsView = (recorded: readonly RecordedUtilisation[]) => {
  const view = capacityConsoleView(recorded);
  if (view.state !== "sessions") throw new Error(`expected rows, got ${view.state}`);
  return view;
};

describe("W229 the fixture reaches every reading", () => {
  it("produces one of each, or every test below passes over nothing", () => {
    // The vacuity guard first. Three fixtures were built to land on three different readings;
    // if any of them silently collapsed onto another, the distinguishing tests would still pass
    // and would be checking nothing. W200's lesson, asserted before it can bite.
    const view = sessionsView(ALL_THREE);
    expect(view.counts).toEqual({ spare: 1, noneSpare: 1, cannotSay: 1 });
    expect(TOO_FEW.length).toBeLessThan(MIN_RECORDED_WEEKS);
  });

  it("gives the spare fixture a range with two ends, not a point", () => {
    // The second vacuity guard, and it was earned: with a flat 8/10 fixture `low === high`, so
    // the spare interval collapsed and a mutation swapping its endpoints passed everything.
    const reading = rowFor(sessionsView(HAS_SPARE).rows, "cli-spare").reading;
    if (reading.kind !== "spare_slots_recorded") throw new Error("fixture no longer has spare");
    expect(reading.opening.forecast.low).toBeLessThan(reading.opening.forecast.high);
    expect(reading.spare.fewest).toBeLessThan(reading.spare.most);
  });
});

describe("W229 no data and no capacity are different facts", () => {
  it("gives them different kinds, not one blank", () => {
    // THE unit. A session with nothing left over and a session the record cannot speak about are
    // the two ways this page goes blank, and they lead a practice somewhere opposite: one means
    // the diary is full, the other means nobody has written anything down.
    const view = sessionsView(ALL_THREE);
    expect(rowFor(view.rows, "cli-full").reading.kind).toBe("no_spare_slots_recorded");
    expect(rowFor(view.rows, "cli-new").reading.kind).toBe("record_cannot_say");
    expect(rowFor(view.rows, "cli-spare").reading.kind).toBe("spare_slots_recorded");
  });

  it("renders them as different sentences, sharing no wording that could be mistaken", () => {
    const view = sessionsView(ALL_THREE);
    const full = renderReading(rowFor(view.rows, "cli-full").reading);
    const unknown = renderReading(rowFor(view.rows, "cli-new").reading);

    expect(full).toContain("none were still open");
    expect(full).toContain("offered and taken");
    expect(unknown).toContain("cannot answer");
    // And neither may be read as the other. A "no capacity" row must not claim ignorance, and a
    // "no data" row must not claim a full diary — which is the mis-reading in each direction.
    expect(full).not.toMatch(/cannot|not enough|no history|nothing is recorded/i);
    expect(unknown).not.toMatch(/filled every|none were still open|nothing left over/i);
  });

  it("says which emptiness the whole page is, when there is no diary at all", () => {
    const view = capacityConsoleView([]);
    expect(view.state).toBe("no_diary_recorded");
    if (view.state !== "no_diary_recorded") throw new Error("unreachable");
    // The sentence that IS this unit, pinned so a later edit cannot smooth it into "no capacity
    // to show". The page-level blank is the absence of a diary, and it says so in as many words.
    expect(view.copy).toContain("absence of a diary");
    expect(view.copy).toContain("nothing left in it");
    expect(view.wouldSettleIt).toEqual(NO_DIARY_WOULD_SETTLE_IT);
    expect(view.wouldSettleIt.length).toBeGreaterThan(0);
  });

  it("does not use the no-diary sentence for a session that is simply full", () => {
    // The specific merge this unit exists to prevent: one 'nothing to show' box serving both.
    const view = sessionsView(NO_SPARE);
    const rendered = renderReading(view.rows[0]!.reading);
    expect(rendered).not.toContain("absence of a diary");
    expect(rendered).not.toContain(CAPACITY_CONSOLE_COPY.noDiaryRecorded);
  });
});

describe("W229 rows come from the diary, never from the answers", () => {
  it("keeps a session the record cannot answer for", () => {
    // The failure that would survive every other test in this file: build the list by asking the
    // forecaster what it can speak about, and the sessions it cannot speak about vanish. A
    // vanished session is indistinguishable from one that does not exist.
    const view = sessionsView(ALL_THREE);
    expect(view.rows.map((row) => row.clinicianId)).toEqual(["cli-full", "cli-new", "cli-spare"]);
  });

  it("keeps a diary made ENTIRELY of sessions it cannot answer for", () => {
    // The sharp version. Filtering by answerability turns this into the page-level no-diary
    // state, which would tell a practice that has recorded two weeks that it has recorded
    // nothing — the exact confusion the unit is gated on, arriving by a side door.
    const view = capacityConsoleView(TOO_FEW);
    expect(view.state).toBe("sessions");
    if (view.state !== "sessions") throw new Error("unreachable");
    expect(view.counts).toEqual({ spare: 0, noneSpare: 0, cannotSay: 1 });
  });

  it("carries the recorded-week count on every row, whatever the reading", () => {
    const view = sessionsView(ALL_THREE);
    expect(rowFor(view.rows, "cli-spare").recordedWeeks).toBe(8);
    expect(rowFor(view.rows, "cli-full").recordedWeeks).toBe(8);
  });

  it("orders rows by weekday then clinician, so the page is a value", () => {
    const scrambled = [...ALL_THREE].reverse();
    expect(capacityConsoleView(scrambled)).toEqual(capacityConsoleView(ALL_THREE));
  });
});

describe("W229 a refusal always travels with what would settle it", () => {
  it("names both the reason and the fix", () => {
    const view = sessionsView(TOO_FEW);
    const reading = view.rows[0]!.reading;
    if (reading.kind !== "record_cannot_say") throw new Error("fixture no longer refuses");
    expect(reading.because.length).toBeGreaterThan(0);
    expect(reading.wouldSettleIt.length).toBeGreaterThan(0);
    for (const why of reading.because) expect(why.length).toBeGreaterThan(50);
    for (const step of reading.wouldSettleIt) expect(step.length).toBeGreaterThan(20);
  });

  it("reuses W222's and W225's own refusal copy rather than restating it", () => {
    // A second wording of a refusal is a second thing to keep true, and the first time the two
    // differed nobody would notice. W177's rule about duplicated caveats.
    const view = sessionsView(TOO_FEW);
    const reading = view.rows[0]!.reading;
    if (reading.kind !== "record_cannot_say") throw new Error("fixture no longer refuses");
    const source = readFileSyncOnce();
    for (const why of reading.because) {
      expect(source, "a refusal sentence is written out here instead of imported").not.toContain(
        why.slice(0, 40),
      );
    }
  });
});

describe("W229 nothing here derives a second estimate", () => {
  it("subtracts from W223's range and reverses the endpoints", () => {
    // Slots left over is `offered - filled`, and filled is an interval, so the FEWEST left over
    // corresponds to the record's HIGHEST fill. Writing them the other way round would put the
    // reassuring number under the alarming label, and both would still be in range.
    const view = sessionsView(HAS_SPARE);
    const reading = view.rows[0]!.reading;
    if (reading.kind !== "spare_slots_recorded") throw new Error("fixture no longer has spare");
    const { opening, spare } = reading;
    expect(spare.fewest).toBe(opening.slots - opening.forecast.high);
    expect(spare.most).toBe(opening.slots - opening.forecast.low);
    expect(spare.fewest).toBeLessThanOrEqual(spare.most);
  });

  it("computes no rate of its own", () => {
    // W225's test, inherited: a second forecaster on the page would be one with no score against
    // it, and a division here is how that starts.
    const source = readFileSyncOnce();
    expect(source, "a rate is being derived on the console").not.toMatch(
      /\bfilled\s*\/\s*(offerable|slots)|\brate\s*=|Math\.round\([^)]*\/\s/,
    );
  });

  it("carries the score onto every answerable row, because W225 made it required", () => {
    const view = sessionsView(ALL_THREE);
    for (const row of view.rows) {
      if (row.reading.kind === "record_cannot_say") continue;
      expect(row.reading.opening.score.weeksScored).toBeGreaterThan(0);
    }
  });
});

describe("W229 the counts are shown whatever they are", () => {
  it("reports all three, including the zeros", () => {
    // W228's rule, one module over: a page that only speaks when alarmed teaches a reader that
    // silence means agreement. The counts are also what separates the two emptinesses at a
    // glance, before any row is read.
    const view = sessionsView(HAS_SPARE);
    expect(view.counts).toEqual({ spare: 1, noneSpare: 0, cannotSay: 0 });
    expect(Object.keys(view.counts).sort()).toEqual(["cannotSay", "noneSpare", "spare"]);
  });

  it("counts every row exactly once", () => {
    const view = sessionsView(ALL_THREE);
    const { spare, noneSpare, cannotSay } = view.counts;
    expect(spare + noneSpare + cannotSay).toBe(view.rows.length);
  });
});

describe("W229 the copy is safe on a capacity surface", () => {
  it("passes W226's linter, every sentence and every rendered row", () => {
    // The rendered sentences too, not only the constants: a template composes fragments that are
    // each innocent, and the sentence a practice reads is the composition (W226's finding).
    const texts = [
      ...Object.values(CAPACITY_CONSOLE_COPY),
      ...NO_DIARY_WOULD_SETTLE_IT,
      ...sessionsView(ALL_THREE).rows.map((row) => renderReading(row.reading)),
    ];
    expect(texts.length).toBeGreaterThan(8);
    for (const text of texts) {
      expect(lintCapacityCopy(text), `failed the capacity lint: ${text}`).toEqual([]);
    }
  });

  it("never calls uptake demand, which is the mis-wording this page invites", () => {
    // W226's `no-demand-claim` argued for in the one place it is most tempting: a session that
    // filled every slot is exactly where somebody writes "demand exceeds capacity". The linter
    // above already forbids it; this pins that the FULL row's own sentence is the tempting one,
    // so the rule cannot be quietly narrowed to somewhere it never fires.
    const full = renderReading(sessionsView(NO_SPARE).rows[0]!.reading);
    expect(lintCapacityCopy(`${full} Demand exceeds capacity here.`).map((v) => v.rule)).toContain(
      "no-demand-claim",
    );
    expect(full).toContain("says nothing about anybody who was not offered one");
  });
});

describe("W229 the console decides nothing about a patient", () => {
  it("has nowhere to put one: keys, signatures and namespace", () => {
    // W225's three-way absence, inherited rather than re-argued, because this module is where a
    // list of who to invite would arrive if it ever did — a page is where somebody asks "and who
    // should we call?".
    const view = sessionsView(ALL_THREE);
    for (const row of view.rows) {
      expect(Object.keys(row).sort()).toEqual(["clinicianId", "reading", "recordedWeeks", "weekday"]);
    }
    const source = readFileSyncOnce();
    for (const match of source.matchAll(/^export function (\w+)\s*\(([^)]*)\)/gms)) {
      expect(match[2]!.replace(/\s+/g, " "), `${match[1]} takes a person`).not.toMatch(
        /patient|candidate|person|invite/i,
      );
    }
    expect(Object.keys(mod).filter((name) => /patient|candidate|invite|who/i.test(name))).toEqual([]);
  });
});


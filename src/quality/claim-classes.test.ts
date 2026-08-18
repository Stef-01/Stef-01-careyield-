// W324 verify gate: "every class named in `docs/HORIZON-Q25.md` either driven by a check that
// exists or declared unprovable with its reason; a class named and neither driven nor declared
// fails."
//
// THE LIVE ASSERTION IS ONE LINE and everything else here is about whether that line can fail. A
// gate over a document is the easiest thing in this tree to write vacuously: parse nothing, match
// nothing, report nothing, stay green forever. So each arm is driven — a class added to the
// document with no answer, an answer for a class the document dropped, a check renamed out from
// under its answer, a check that has gone silent, a deferral whose unit landed, and an argument
// quoting a sentence the horizon does not hold.

import { describe, expect, it } from "vitest";
import {
  CLAIM_CLASS_BOUND,
  CLASS_ANSWERS,
  type ClassAnswer,
  type HorizonClass,
  classDefects,
  classesInHorizon,
  declareAnswer,
} from "./claim-classes";

const ROOT = process.cwd();

/** The document's classes, as the live tree holds them. */
const found = (): HorizonClass[] => classesInHorizon(ROOT);

/** An answer known to stand, for tests that need a healthy neighbour beside a broken one. */
const healthy = (): ClassAnswer => CLASS_ANSWERS.find((a) => a.unit === "W316")!;

describe("W324 Q25's gate: every claim class the horizon names is answered", () => {
  it("passes, over the document and the checks the tree actually holds", () => {
    expect(classDefects(ROOT)).toEqual([]);
  });

  it("reads the classes from the document rather than from a list here", () => {
    // The unit table is the only one whose rows open with a unit id: the requirement table opens
    // with a digit and the gate-position table with a gate. If that stops being true this reports
    // rows nobody planned, which is a defect and not a silence.
    const units = found().map((c) => c.unit);
    expect(units).toEqual(["W313", "W314", "W315", "W316", "W317", "W318", "W319", "W320", "W321", "W322", "W323", "W324", "W325"]);
    expect(found().every((c) => c.what.length > 20), "a class read with no text to it").toBe(true);
  });

  it("answers every class the document names, and names no class the document does not", () => {
    expect(CLASS_ANSWERS.map((a) => a.unit).sort()).toEqual(found().map((c) => c.unit).sort());
  });

  it("reports a class the horizon names and nothing answers", () => {
    const arriving = [...found(), { unit: "W399", what: "a class planned into the horizon by a later quarter" }];
    expect(classDefects(ROOT, CLASS_ANSWERS, arriving)).toEqual([
      { unit: "W399", what: "is named in the horizon and answered nowhere" },
    ]);
  });

  it("reports an answer the horizon no longer names, which is the other direction", () => {
    const dropped = found().filter((c) => c.unit !== "W316");
    expect(classDefects(ROOT, CLASS_ANSWERS, dropped)).toEqual([
      { unit: "W316", what: "is answered here and the horizon names no such class" },
    ]);
  });

  it("reports an answer naming a check its module does not export", () => {
    const renamed: ClassAnswer[] = [{ unit: "W316", answer: { ...healthy().answer, check: "sweepTautologiesOnce" } as never }];
    expect(classDefects(ROOT, renamed, [{ unit: "W316", what: "x" }])).toEqual([
      { unit: "W316", what: "names `sweepTautologiesOnce`, which `src/quality/tautology-sweep.ts` does not export" },
    ]);
  });

  it("reports a check that exists and has gone silent, which is the class this quarter is named after", () => {
    // THE PROPERTY WORTH THE WHOLE UNIT. A register that still typechecks, still exports, still
    // runs and reports nothing is green everywhere else in this tree. Here it is a failure.
    const silent: ClassAnswer[] = [
      { unit: "W316", answer: { ...(healthy().answer as { kind: "driven" }), reports: () => false } as never },
    ];
    expect(classDefects(ROOT, silent, [{ unit: "W316", what: "x" }])).toEqual([
      { unit: "W316", what: "drives `tautologiesIn` with an input it should report, and it says nothing" },
    ]);
  });

  it("ends a deferral the day its unit lands", () => {
    // W318's clock, applied to this gate: the pending arm is an excuse with an expiry, and the
    // ledger is what expires it. `W1` is done, so a class waiting on it is a class waiting on
    // nothing.
    const stale: ClassAnswer[] = [
      { unit: "W316", answer: { kind: "pending", by: "W1", why: "x".repeat(80) } },
    ];
    expect(classDefects(ROOT, stale, [{ unit: "W316", what: "x" }])).toEqual([
      { unit: "W316", what: "waits on W1, which has landed" },
    ]);
  });

  it("reports an argument quoting a sentence the horizon does not hold", () => {
    const invented: ClassAnswer[] = [
      {
        unit: "W316",
        answer: { kind: "not_a_claim_class", why: "x".repeat(80), cites: "this quarter sets a numeric gate" },
      },
    ];
    expect(classDefects(ROOT, invented, [{ unit: "W316", what: "x" }])).toEqual([
      { unit: "W316", what: "argues from a sentence the horizon does not contain" },
    ]);
  });

  it("refuses an argument that argues nothing, at the point it is declared", () => {
    expect(() =>
      declareAnswer({ unit: "W316", answer: { kind: "not_a_claim_class", why: "product work", cites: "x" } }),
    ).toThrow("fewer words than the argument needs");
    expect(() =>
      declareAnswer({ unit: "W316", answer: { kind: "unprovable", why: "y".repeat(80), cites: "  " } }),
    ).toThrow("quotes none of it");
  });

  it("drives every check it names, and every one of them speaks", () => {
    // Named individually rather than counted, so a class losing its driven answer reads here as
    // the class it is rather than as a total that moved.
    const driven = CLASS_ANSWERS.filter((a) => a.answer.kind === "driven");
    for (const { unit, answer } of driven) {
      if (answer.kind !== "driven") continue;
      expect(answer.reports(ROOT), `${unit}: ${answer.check} says nothing when driven on ${answer.how}`).toBe(true);
    }
    expect(driven.map((d) => d.unit)).toEqual(["W313", "W314", "W315", "W316", "W317", "W318", "W319", "W320", "W323"]);
  });

  it("says what it does not prove, including the gap its own fabrications leave", () => {
    expect(CLAIM_CLASS_BOUND).toContain("the input is a fabrication");
    expect(CLAIM_CLASS_BOUND.length).toBeGreaterThan(400);
  });
});

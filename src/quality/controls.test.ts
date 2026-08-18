// W337 verify gate: "every control named in `docs/HORIZON-Q26.md` either runs at the event it
// concerns or declares the instant it answers at with what that instant cannot see; a control
// named and neither tied nor declared fails."
//
// THE LIVE ASSERTION IS ONE LINE and the rest of this file is about whether it can fail. A gate
// over a planning document is the easiest thing in this tree to write vacuously: parse nothing,
// resolve nothing, report nothing, stay green through a quarter of controls going quiet.

import { describe, expect, it } from "vitest";
import { CONTROLS } from "./instant";
import {
  CONTROL_ANSWERS,
  CONTROL_BOUND,
  type ControlAnswer,
  type HorizonControl,
  controlDefects,
  controlsInHorizon,
  declareAnswer,
  unstableControls,
} from "./controls";

const ROOT = process.cwd();
const found = (): HorizonControl[] => controlsInHorizon(ROOT);
const tiedProbe = (): ControlAnswer => CONTROL_ANSWERS.find((a) => a.unit === "W336")!;

describe("W337 Q26's gate: every control the horizon names is tied or declared", () => {
  it("passes, over the document and the controls the tree actually holds", () => {
    expect(controlDefects(ROOT)).toEqual([]);
  });

  it("reads the controls from the document rather than from a list here", () => {
    expect(found().map((c) => c.unit)).toEqual([
      "W326", "W327", "W328", "W329", "W330", "W331", "W332", "W333", "W334", "W335", "W336", "W337", "W338",
    ]);
    expect(found().every((c) => c.what.length > 20), "a control read with no text to it").toBe(true);
  });

  it("answers every control the document names, and names none it does not", () => {
    expect(CONTROL_ANSWERS.map((a) => a.unit).sort()).toEqual(found().map((c) => c.unit).sort());
  });

  it("reports a control the horizon names and nothing answers", () => {
    const arriving = [...found(), { unit: "W399" as const, what: "a control planned by a later quarter" }];
    expect(controlDefects(ROOT, CONTROL_ANSWERS, arriving)).toEqual([
      { unit: "W399", what: "is named in the horizon and answered nowhere" },
    ]);
  });

  it("reports an answer the horizon no longer names, which is the other direction", () => {
    const dropped = found().filter((c) => c.unit !== "W336");
    expect(controlDefects(ROOT, CONTROL_ANSWERS, dropped)).toEqual([
      { unit: "W336", what: "is answered here and the horizon names no such control" },
    ]);
  });

  it("reports a tie naming a control its module does not export", () => {
    const renamed: ControlAnswer[] = [
      { unit: "W336", answer: { ...(tiedProbe().answer as { kind: "tied" }), control: "emptyFormsInOnce" } as never },
    ];
    expect(controlDefects(ROOT, renamed, [{ unit: "W336", what: "x" }])).toEqual([
      {
        unit: "W336",
        what: "names `emptyFormsInOnce`, which `src/quality/assertion-vocabulary.ts` does not export",
      },
    ]);
  });

  it("reports a control that is silent when its event arrives, which is the class this quarter is named after", () => {
    // THE PROPERTY WORTH THE WHOLE UNIT. A control still exported, still called, still returning —
    // and saying nothing at the moment it is about — is green everywhere else in this tree.
    const silent: ControlAnswer[] = [
      { unit: "W336", answer: { ...(tiedProbe().answer as { kind: "tied" }), fires: () => false } as never },
    ];
    expect(controlDefects(ROOT, silent, [{ unit: "W336", what: "x" }])).toEqual([
      {
        unit: "W336",
        what: "is tied to an assertion arriving that spells emptiness a second way and says nothing when that event arrives",
      },
    ]);
  });

  it("resolves a declared instant against W327's register, and refuses one it does not hold", () => {
    const invented: ControlAnswer[] = [
      { unit: "W336", answer: { kind: "declares_its_instant", id: "src/nowhere.ts::fn" } },
    ];
    expect(controlDefects(ROOT, invented, [{ unit: "W336", what: "x" }])).toEqual([
      {
        unit: "W336",
        what: "declares its instant as `src/nowhere.ts::fn`, which W327's register does not hold",
      },
    ]);
  });

  it("requires a declared instant to say what it cannot see", () => {
    // The half that makes the fallback worth having: an instant declared with no blind spot is a
    // sentence about when the control runs and nothing about what running then costs.
    const control = CONTROLS.find((c) => c.id === "src/quality/tree-walks.ts::sourceModules")!;
    expect(control.instant.length).toBeGreaterThan(10);
    expect(control.cannotSee.length).toBeGreaterThan(40);
  });

  it("ends a pending answer the day its unit lands", () => {
    // W324'S ARM, INHERITED, AND NO LIVE ANSWER USES IT — which is itself the finding. It fired in
    // this unit's first drive, on W332, which a sibling session closed mid-build; and the second
    // pending answer was removed rather than kept, because a gate that expires on ANOTHER
    // session's close is reporting somebody else's event as its own, which `closing-state.ts` says
    // in as many words it must not. The arm stays, driven on a fabricated answer.
    const stale: ControlAnswer[] = [{ unit: "W336", answer: { kind: "pending", by: "W1", why: "x".repeat(80) } }];
    expect(controlDefects(ROOT, stale, [{ unit: "W336", what: "x" }])).toEqual([
      { unit: "W336", what: "waits on W1, which has landed" },
    ]);
  });

  it("reports an argument quoting a sentence the horizon does not hold", () => {
    const invented: ControlAnswer[] = [
      {
        unit: "W336",
        answer: { kind: "not_a_control", why: "x".repeat(80), cites: "this quarter sets a numeric gate" },
      },
    ];
    expect(controlDefects(ROOT, invented, [{ unit: "W336", what: "x" }])).toEqual([
      { unit: "W336", what: "argues from a sentence the horizon does not contain" },
    ]);
  });

  it("refuses an argument that argues nothing, at the point it is declared", () => {
    expect(() =>
      declareAnswer({ unit: "W336", answer: { kind: "not_a_control", why: "product work", cites: "x" } }),
    ).toThrow("fewer words than the argument needs");
    expect(() =>
      declareAnswer({ unit: "W336", answer: { kind: "not_a_control", why: "y".repeat(80), cites: "  " } }),
    ).toThrow("quotes none of it");
  });

  it("drives every tie it names, and every one of them speaks", () => {
    const tied = CONTROL_ANSWERS.filter((a) => a.answer.kind === "tied");
    for (const { unit, answer } of tied) {
      if (answer.kind !== "tied") continue;
      expect(answer.fires(ROOT), `${unit}: ${answer.control} is silent at ${answer.event}`).toBe(true);
    }
    // Named rather than counted, so a control losing its tie reads as the control it is.
    expect(tied.map((t) => t.unit)).toEqual([
      "W326", "W328", "W329", "W330", "W331", "W332", "W333", "W335", "W336",
    ]);
  });

  it("agrees with W327 about which controls are instant-dependent", () => {
    // The two gates read the same tree from different ends; a control W327 finds unstable and this
    // one calls tied would be two registers disagreeing about the same fact.
    expect(unstableControls(ROOT)).toEqual([]);
  });

  it("says what a fabricated event does not prove", () => {
    expect(CONTROL_BOUND).toContain("the event handed to it is");
    expect(CONTROL_BOUND).toContain("whether anything calls it after");
  });
});

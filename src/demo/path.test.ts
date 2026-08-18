// W309 verify gate: "one spec that walks a practice from seeded data to a rendered console answer,
// with every founder gate held — no real patient, no live send, no production credential — and the
// path's refusals rendered where a gate stops it."
//
// THE SPEC AND THIS FILE PROVE DIFFERENT HALVES AND NEITHER IS ENOUGH. `demo-path.spec.ts` walks a
// running browser and reads the refusals off the screen, which is the only thing that shows a
// component call actually renders. This checks the register against the whole tree — every route
// the app serves, not only the ones the walk visits — because a refusal on a page nobody walks is
// exactly the one nobody would notice, and a gate named to a patient is a defect the walk can only
// catch on the route it happens to open.
//
// AND THE GATES ARE RESOLVED TO §4 RATHER THAN SPELLED. A register naming "G3" and a plan defining
// G3 differently is the citation failure W258 is about, one document over.

import { describe, expect, it } from "vitest";
import { SETUP_GAP_BOUND, SETUP_GAP_COPY, PREREQUISITES, unmetSteps } from "@/console/setup-gaps";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEMO_PATH,
  GATE_REFUSAL_COPY,
  type GateId,
  PATH_BOUND,
  type PathStep,
  gateStops,
  pathDefects,
  syntheticOnlyDefects,
  REFUSAL_PATH,
  refusalDefects, UNFINISHED_PATH, unfinishedDefects } from "./path";
import { sweepSurface } from "@/compliance/public-surfaces";
import { withTree } from "@/quality/planting";

const ROOT = process.cwd();
const PLAN = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("W309 the path is a walk this tree actually serves", () => {
  it("names a page for every step, and an answer the page renders", () => {
    // Both halves of a step: the file exists, and the marker the walk looks for is in it. A step
    // whose marker nothing renders would pass every check here and fail in a browser, which is the
    // split W267 drew between a scanner and a walk.
    for (const step of DEMO_PATH) {
      expect(() => read(step.page), `${step.route} names a page the tree does not have`).not.toThrow();
      // The quoted marker rather than a `data-testid=` spelling: `/book/[token]` passes its
      // marker down through a `Panel` prop, and a check pinned to one spelling would have forced
      // that page's shape rather than reading it. What the marker RENDERS is the e2e spec's half.
      expect(read(step.page), `${step.route} names no ${step.answer}`).toContain(`"${step.answer}"`);
      expect(step.does.length, `${step.route} does not say what it demonstrates`).toBeGreaterThan(60);
    }
    expect(DEMO_PATH.length, "the path is not a walk").toBeGreaterThan(3);
  });

  it("starts at the seed and ends at the answer, which is what makes it a path", () => {
    // Order is the claim: a set of screens is a menu, and the unit is a walk from seeded data to a
    // rendered console answer.
    expect(DEMO_PATH[0]!.route).toBe("/demo");
    expect(DEMO_PATH.at(-1)!.route).toBe("/console/dashboard");
  });
});

describe("W309 every gate that stops the path is named where it stops", () => {
  it("agrees with the tree in both directions", () => {
    // THE UNIT. The second direction sweeps every route the app serves, so a refusal rendered on a
    // page no step declares fails as loudly as a step whose page renders none.
    expect(pathDefects(ROOT), "a step with no refusal, or a refusal with no step").toEqual([]);
    expect(gateStops().length, "no step meets a gate").toBeGreaterThan(3);
  });

  it("resolves every gate to plan §4, so the register cannot invent one", () => {
    for (const stop of gateStops()) {
      expect(PLAN, `${stop.stoppedBy.gate} is not defined in §4`).toContain(`- **${stop.stoppedBy.gate}**`);
      expect(stop.stoppedBy.what.length, `${stop.route} does not say what the gate stops`).toBeGreaterThan(80);
      expect(GATE_REFUSAL_COPY[stop.stoppedBy.gate].length).toBeGreaterThan(80);
    }
  });

  it("reports a step whose page renders no refusal, and a refusal no step declares", () => {
    // Driven from both ends. The first arm is a conversion half-done; the second is a screen that
    // has grown a gate the register has forgotten, which reads as covered and is worse.
    const invented: PathStep[] = [
      { ...DEMO_PATH[1]!, stoppedBy: { gate: "G2", what: "x".repeat(90), renderedOn: DEMO_PATH[1]!.page } },
    ];
    expect(pathDefects(ROOT, invented).map((d) => d.what)).toContain(
      "is stopped by G2 and app/console/page.tsx renders no refusal",
    );
    // And with the register empty, every refusal the tree renders is undeclared — which is the
    // arm that would be silent if the sweep only read the pages the register already names.
    const orphaned = pathDefects(ROOT, []).map((d) => d.what);
    expect(orphaned.filter((w) => w.includes("which no step declares")).length).toBeGreaterThan(3);
  });

  it("reports a refusal that renders elsewhere without an argument", () => {
    const unexplained: PathStep[] = [
      { ...DEMO_PATH[3]!, stoppedBy: { ...DEMO_PATH[3]!.stoppedBy!, whyElsewhere: undefined } },
    ];
    expect(pathDefects(ROOT, unexplained).map((d) => d.what)).toContain(
      "renders its refusal on app/demo/page.tsx without saying why",
    );
    // And the real one carries the argument, because moving a refusal off its own page is the kind
    // of decision that looks like an oversight a quarter later.
    expect(DEMO_PATH[3]!.stoppedBy!.whyElsewhere!.length).toBeGreaterThan(200);
  });

  it("refuses to name a gate to a patient, which is the reason one refusal moved", () => {
    // Driven on a constructed tree rather than asserted: the real tree has no such page, so a check
    // that only read this one would pass forever whatever the rule said.
    const found = withTree(
      {
        "app/book/[token]/page.tsx": '<GateRefusal gate="G1" />\n',
        "app/console/dashboard/page.tsx": '<GateRefusal gate="G4" />\n',
      },
      (root) =>
        pathDefects(
          root,
          DEMO_PATH.filter((s) => s.route === "/console/dashboard"),
        ).map((d) => d.what),
    );
    expect(found).toContain("is patient-facing and names G1 to that audience");
    expect(found, "the operator page was reported too").not.toContain(
      "is patient-facing and names G4 to that audience",
    );
  });
});

describe("W309 the founder gates are held along the whole path", () => {
  it("holds all three the gate names: no real patient, no live send, no production credential", () => {
    expect(syntheticOnlyDefects(ROOT), "a page on the demo path crosses a gate").toEqual([]);
  });

  it("reports a page that reaches a sender and one that reads a credential", () => {
    // Both driven, because the two failures have nothing in common except which gate they cross.
    const sending = withTree({ "app/x/page.tsx": "const s = sendSms(msg);\n" }, (root) =>
      syntheticOnlyDefects(root, [{ ...DEMO_PATH[0]!, page: "app/x/page.tsx" }]),
    );
    expect(sending.map((d) => d.what)).toEqual(["reaches a sender from a page on the demo path"]);
    const credential = withTree({ "app/x/page.tsx": "const k = process.env.TWILIO_AUTH_TOKEN;\n" }, (root) =>
      syntheticOnlyDefects(root, [{ ...DEMO_PATH[0]!, page: "app/x/page.tsx" }]),
    );
    expect(credential.map((d) => d.what)).toEqual(["reads a credential from the environment"]);
  });

  it("leaves a page that composes a message without sending it alone", () => {
    // The near-miss, and it is the whole outreach screen: composing the exact wording is the
    // product, and a check that could not tell composing from sending would have to be switched
    // off on the one page the gate is about.
    const composing = withTree(
      { "app/x/page.tsx": "const text = renderNudge(recipient);\nreturn <Preview text={text} />;\n" },
      (root) => syntheticOnlyDefects(root, [{ ...DEMO_PATH[0]!, page: "app/x/page.tsx" }]),
    );
    expect(composing).toEqual([]);
  });
});

describe("W309 the refusal copy is written once and passes the linter", () => {
  it("says what the product does instead, not only what it does not do", () => {
    for (const [gate, copy] of Object.entries(GATE_REFUSAL_COPY)) {
      expect(copy, `${gate} names no decision-maker`).toMatch(/founder/i);
      expect(copy.split(". ").length, `${gate} does not say what happens instead`).toBeGreaterThan(1);
    }
  });

  it("passes the surface linter for the audiences it renders to", () => {
    // The copy lands on `/demo` (professional) and inside the console (operator). It is swept as
    // both rather than as neither: W274's register is what decides an audience in this tree, and
    // this copy is new prose on an already-swept page.
    for (const [gate, copy] of Object.entries(GATE_REFUSAL_COPY)) {
      expect(sweepSurface("/demo", "professional", copy), `${gate} fails the professional sweep`).toEqual(
        [],
      );
      // And swept as PATIENT copy too, which is the stricter instrument and the one that would
      // matter if a gate refusal ever landed on a patient screen by accident. It does not today —
      // `pathDefects` refuses that — but copy this tree writes should survive the harder sweep.
      expect(sweepSurface("/demo", "patient", copy), `${gate} fails the patient sweep`).toEqual([]);
    }
  });

  it("is not restated by the pages that render it", () => {
    // W301's finding applied to copy: one sentence, one place. The pages that used to write their
    // own version of it now name a gate and nothing else.
    for (const stop of gateStops()) {
      const source = read(stop.stoppedBy.renderedOn);
      expect(source, `${stop.stoppedBy.renderedOn} restates the refusal`).not.toContain(
        GATE_REFUSAL_COPY[stop.stoppedBy.gate as GateId].slice(0, 40),
      );
    }
  });

  it("says what a green walk does not prove", () => {
    expect(PATH_BOUND).toMatch(/does NOT mean/);
    expect(PATH_BOUND).toContain("Routes off the path");
    expect(PATH_BOUND.length).toBeGreaterThan(400);
  });
});

describe("W321 the refusal walk, and every marker resolved to the page that renders it", () => {
  it("resolves every declined step to a marker its page really renders", () => {
    expect(refusalDefects(ROOT)).toEqual([]);
    expect(REFUSAL_PATH.length).toBeGreaterThan(3);
  });

  it("argues every refusal, because a refusal nobody explains gets removed as clutter", () => {
    for (const step of REFUSAL_PATH) {
      expect(step.why.length, `${step.marker} is not argued`).toBeGreaterThan(120);
      expect(step.declines.length, `${step.marker} does not say what is declined`).toBeGreaterThan(30);
      expect(step.route).toMatch(/^\//);
    }
  });

  it("reports a step whose marker no page renders", () => {
    // Driven from outside on a constructed step, because the real register resolves. The arm is the
    // whole value: a step claiming a refusal is visible when it is not reads as coverage — W258's
    // rule, applied to a walk rather than a citation.
    const bogus = [
      {
        route: "/console/ops",
        page: "app/console/ops/page.tsx",
        declines: "something the page says nothing about at all, at any point",
        marker: "no-such-marker",
        why: "x".repeat(130),
      },
    ];
    expect(refusalDefects(ROOT, bogus)).toEqual([
      { step: "/console/ops :: no-such-marker", what: "declines something app/console/ops/page.tsx renders no marker for" },
    ]);
  });

  it("reports a step naming a page the tree does not have", () => {
    const gone = [
      { route: "/x", page: "app/gone/page.tsx", declines: "x".repeat(40), marker: "silence", why: "x".repeat(130) },
    ];
    expect(refusalDefects(ROOT, gone)[0]!.what).toContain("names a page the tree does not have");
  });

  it("finds both marker spellings, which is most of them", () => {
    // `data-testid="silence"` and ``data-testid={`silence-${cause}`}`` are both real, and a check
    // that knew only the first would report every per-item refusal as unrendered.
    const perItem = REFUSAL_PATH.filter((s) => s.marker.endsWith("-"));
    expect(perItem.length, "no per-item marker is declared, so the second spelling is untested").toBeGreaterThan(0);
    expect(refusalDefects(ROOT, perItem)).toEqual([]);
  });

  it("declines something at more than one route, so the walk is a walk", () => {
    expect(new Set(REFUSAL_PATH.map((s) => s.route)).size).toBeGreaterThan(2);
  });
});

describe("W334 the third walk: a practice that started and did not finish", () => {
  it("names pages that exist and render the notice", () => {
    expect(unfinishedDefects(ROOT)).toEqual([]);
  });

  it("reports a page that renders no notice, which is the arm that rots first", () => {
    const invented = [
      { ...UNFINISHED_PATH[0]!, page: "app/console/signin/page.tsx", route: "/console/signin" },
    ];
    expect(unfinishedDefects(ROOT, invented)).toEqual([
      {
        step: "/console/signin :: clinicians",
        what: "is in the walk and app/console/signin/page.tsx renders no setup notice",
      },
    ]);
  });

  it("reports a page the tree does not have", () => {
    const gone = [{ ...UNFINISHED_PATH[0]!, page: "app/console/gone/page.tsx" }];
    expect(unfinishedDefects(ROOT, gone)).toEqual([
      {
        step: "/console/dashboard :: clinicians",
        what: "names a page the tree does not have: app/console/gone/page.tsx",
      },
    ]);
  });

  it("reports a step the wizard does not check, which is the quiet direction", () => {
    // A walk describing a prerequisite `setupReadiness` has dropped would keep passing while
    // telling an operator to finish something the wizard no longer asks for.
    const stale = [{ ...UNFINISHED_PATH[0]!, unmet: "billing" as never }];
    expect(unfinishedDefects(ROOT, stale).map((d) => d.what)).toContain(
      "names billing, which the wizard does not check",
    );
  });

  it("covers every step the wizard checks, so no prerequisite is unnamed anywhere", () => {
    // The walk is named rather than derived, so THIS is what stops it going out of date: a fourth
    // prerequisite added to the wizard fails here until some page in the walk names it.
    const named = new Set(UNFINISHED_PATH.map((s) => s.unmet));
    expect([...named].sort()).toEqual([...PREREQUISITES].sort());
  });

  it("crosses no founder gate: the walk reads screens and writes nothing to anybody", () => {
    // The same claim W309 and W321 make, re-derived over this walk's pages rather than assumed
    // from theirs — every page it names is one the synthetic-data check already covers.
    expect(syntheticOnlyDefects(ROOT)).toEqual([]);
    for (const step of UNFINISHED_PATH) {
      expect(step.route.startsWith("/console/"), `${step.route} is not a console route`).toBe(true);
    }
  });
});

describe("W334 the copy an operator is given", () => {
  it("names the consequence, not only the field", () => {
    for (const step of PREREQUISITES) {
      const copy = SETUP_GAP_COPY[step];
      expect(copy.headline.length, `${step} has no headline`).toBeGreaterThan(10);
      expect(copy.detail.length, `${step} says what is unfinished and not what it stops`).toBeGreaterThan(120);
      expect(copy.href, `${step} does not say where to finish it`).toMatch(/^\/console\/setup\//);
    }
  });

  it("says nothing when the setup is complete, and everything unmet when it is not", () => {
    expect(unmetSteps({ practice: true, clinicians: true, sessions: true, rules: true, complete: true })).toEqual([]);
    // Complete wins even if a flag is stale: the wizard's own completion is the authority.
    expect(unmetSteps({ practice: true, clinicians: false, sessions: true, rules: true, complete: true })).toEqual([]);
    expect(
      unmetSteps({ practice: true, clinicians: false, sessions: false, rules: false, complete: false }),
    ).toEqual(["clinicians", "sessions", "rules"]);
  });

  it("lists them in the wizard's order, because that is where the reader is going", () => {
    const some = unmetSteps({ practice: true, clinicians: false, sessions: true, rules: false, complete: false });
    expect(some).toEqual(["clinicians", "rules"]);
  });

  it("says what the notice cannot know", () => {
    expect(SETUP_GAP_BOUND).toContain("a page nobody put in the walk is not checked");
    expect(SETUP_GAP_BOUND).toContain("has decided not to participate");
  });
});

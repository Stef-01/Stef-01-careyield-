// W279 verify gate: "for each route, 'nothing yet', 'nothing arrived' and 'could not load' are
// separate states with separate copy, both directions against a declared register; a route
// rendering one where another is true fails."
//
// SEPARATE COPY IS THE CLAUSE WITH TEETH and it is checked pairwise on all three fields, because
// three states sharing a sentence have collapsed into one however the register is spelled — the
// defect W179 split the appointment feed's zero to fix, and the reason it is worth doing again for
// the console generally.
//
// THE LAST CLAUSE IS NOT FULLY CHECKABLE HERE AND THE FILE SAYS SO RATHER THAN PRETENDING. A
// source detector for "does this page have an empty-state branch" was written and measured, and it
// disagreed with the hand classification in both directions — so it was dropped rather than tuned
// until it agreed, which would have been fitting the check to the answer. What survives is
// mechanical: the route list is checked against W271's register both ways, every route carries an
// argument, and the three vocabularies differ pairwise. `RUNTIME_BOUND` states the rest.

import { describe, expect, it } from "vitest";
import {
  ALL_ZERO_STATES,
  CONSOLE_ZERO_STATES,
  REFUSED_ZERO_SHAPES,
  RUNTIME_BOUND,
  ZERO_STATE_COPY,
  type ZeroState,
} from "./zero-states";
import { ROUTE_CLASSES } from "@/security/page-reach";
import { SILENCE_COPY } from "@/ops/silence";

describe("W279 three states, and three different things to read", () => {
  it("gives every state copy, keyed by the union", () => {
    // W304: the count is gone — the identity above already pins the set exactly, and a fourth
    // state is meant to fail here by having no copy rather than by changing a number.
    expect(Object.keys(ZERO_STATE_COPY).sort()).toEqual([...ALL_ZERO_STATES].sort());
  });

  it("differs pairwise on headline, detail AND action", () => {
    // THE CLAUSE THE GATE NAMES. Three names over one sentence is one state wearing three hats.
    for (const field of ["headline", "detail", "action"] as const) {
      const values = ALL_ZERO_STATES.map((s) => ZERO_STATE_COPY[s][field]);
      expect(new Set(values).size, `two states share a ${field}`).toBe(3);
    }
  });

  it("says something different enough to act on differently", () => {
    // Distinctness by string comparison is satisfied by a full stop moved. The actions are the
    // field an operator acts from, so they are required to share almost no wording.
    const actions = ALL_ZERO_STATES.map((s) => ZERO_STATE_COPY[s].action.toLowerCase());
    for (const action of actions) expect(action.length).toBeGreaterThan(40);
    const words = (text: string) => new Set(text.split(/\W+/).filter((w) => w.length > 4));
    for (let i = 0; i < actions.length; i += 1) {
      for (let j = i + 1; j < actions.length; j += 1) {
        const shared = [...words(actions[i]!)].filter((w) => words(actions[j]!).has(w));
        expect(shared.length, `two actions share too much wording: ${shared.join(", ")}`).toBeLessThan(3);
      }
    }
  });

  it("reuses W179's shape rather than inventing a second one", () => {
    // The console's zero and the feed's zero are the same question at different scales, and two
    // copy shapes would be two things to keep true.
    const feed = Object.values(SILENCE_COPY)[0]!;
    for (const state of ALL_ZERO_STATES) {
      expect(Object.keys(ZERO_STATE_COPY[state]).sort()).toEqual(Object.keys(feed).sort());
    }
  });

  it("keeps the two meanings that look identical genuinely opposite", () => {
    // W179's argument, restated where it can fail: "nothing happened" and "nothing reached us"
    // must not point the reader at the same next step.
    expect(ZERO_STATE_COPY.nothing_yet.action.toLowerCase()).toContain("nothing needs fixing");
    expect(ZERO_STATE_COPY.nothing_arrived.action.toLowerCase()).toContain("connected");
    expect(ZERO_STATE_COPY.could_not_load.detail.toLowerCase()).toContain(
      "nothing on this page is a fact",
    );
  });
});

describe("W279 every console route is declared, both directions", () => {
  const consoleRoutes = ROUTE_CLASSES.find((c) => c.id === "console")!.routes;

  it("covers exactly the routes W271 calls console", () => {
    // Against W271's register rather than a list here, so a console route added tomorrow arrives
    // undeclared and this fails.
    // W304: the count that sat here was redundant beside this identity — it named a number the
    // line above already fixes, and moved whenever a console route was added.
    expect(CONSOLE_ZERO_STATES.map((r) => r.route).sort()).toEqual([...consoleRoutes].sort());
  });

  it("declares routes with NO zero rather than omitting them", () => {
    // W51's rule. "Nothing to declare" and "nobody declared it" are indistinguishable from
    // outside, and sign-in is the clearest case of a route that still has to be here.
    const none = CONSOLE_ZERO_STATES.filter((r) => r.states.length === 0).map((r) => r.route);
    expect(none).toContain("/console/signin");
    expect(none.length).toBeGreaterThan(3);
    // Non-vacuity in the other direction: most routes DO have a zero.
    expect(CONSOLE_ZERO_STATES.filter((r) => r.states.length > 0).length).toBeGreaterThan(15);
  });

  it("argues every route, including the ones with nothing", () => {
    for (const entry of CONSOLE_ZERO_STATES) {
      expect(entry.why.length, `${entry.route} is declared without a reason`).toBeGreaterThan(60);
      expect(new Set(entry.states).size, `${entry.route} lists a state twice`).toBe(entry.states.length);
      for (const state of entry.states) {
        expect(ALL_ZERO_STATES, `${entry.route} names an unknown state`).toContain(state);
      }
    }
  });

  it("declares could_not_load nowhere, and says why", () => {
    // The honest reading rather than an oversight: the state has nowhere to arise, so declaring it
    // would be a control that does not exist.
    //
    // W287 NARROWED THE REASON. This comment said "no console read can fail", and that is true of
    // twenty-six of the twenty-seven — `/console/interest` reads a file on disk. The conclusion
    // survives and its argument changes: the state stays declared nowhere because the one route
    // that can reach it has a store that cannot tell the page which zero it is holding. The
    // refusal is required to carry the exception, so nobody can quote the universal again.
    const declaring = CONSOLE_ZERO_STATES.filter((r) => r.states.includes("could_not_load"));
    expect(declaring).toEqual([]);
    expect(REFUSED_ZERO_SHAPES.declaring_could_not_load_everywhere).toContain("cannot throw");
    expect(
      REFUSED_ZERO_SHAPES.declaring_could_not_load_everywhere,
      "the refusal states the universal W287 disproved",
    ).toContain("/console/interest");
    // And the state still exists with copy, so the day a read CAN fail there is a sentence for it.
    expect(ZERO_STATE_COPY.could_not_load.headline.length).toBeGreaterThan(10);
  });
});

describe("W279 the structural check was attempted, measured, and abandoned", () => {
  it("records the detector that could not be made to agree", () => {
    // WORTH KEEPING RATHER THAN QUIETLY DROPPING. A source scan for empty-state branches was
    // written to check that a route declaring a zero has somewhere to put it. The first version
    // looked for `length === 0` and missed seven routes. A broader one found nineteen and
    // disagreed in BOTH directions — claiming `/console/setup/[step]` renders a zero, and denying
    // that `/console/ops` does, when ops is where W179's silence notice lives, delegated to a
    // component. Every widening moved the disagreement instead of removing it.
    //
    // Tuning it further would have been fitting the detector to the answer, which is not evidence
    // for the answer. The refusal is recorded so a later unit re-proposing it knows it was tried.
    expect(REFUSED_ZERO_SHAPES.a_detector_tuned_until_it_agrees).toContain("both directions");
    expect(REFUSED_ZERO_SHAPES.a_detector_tuned_until_it_agrees).toContain("/console/ops");
    expect(RUNTIME_BOUND).toContain("sharper regex");
  });

  it("keeps the classification checkable where it genuinely is", () => {
    // What survives is not nothing: the route list is mechanical, checked against W271's register
    // in both directions, so a console route added tomorrow arrives undeclared and fails.
    const consoleRoutes = ROUTE_CLASSES.find((c) => c.id === "console")!.routes;
    expect(CONSOLE_ZERO_STATES.map((r) => r.route).sort()).toEqual([...consoleRoutes].sort());
  });
});

describe("W279 what it cannot check is on the module", () => {
  it("states the runtime bound rather than letting the structural half read as the whole", () => {
    // W237's rule, and W278's fixture bound one unit earlier: the sentence somebody would
    // otherwise quote has to be the one that says what was not proved.
    expect(RUNTIME_BOUND).toContain("does not prove");
    expect(RUNTIME_BOUND).toContain("remedy");
    expect(RUNTIME_BOUND.length).toBeGreaterThan(200);
  });

  it("names the six shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_ZERO_SHAPES).sort()).toEqual([
      "a_detector_tuned_until_it_agrees",
      "a_route_declared_without_a_reason",
      "claiming_the_runtime_is_checked",
      "declaring_could_not_load_everywhere",
      "omitting_routes_with_no_zero",
      "three_names_one_sentence",
    ]);
    for (const [name, why] of Object.entries(REFUSED_ZERO_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_ZERO_SHAPES.three_names_one_sentence).toContain("W179");
  });
});

/** Used above; declared here so the union stays honest if a state is added. */
void (ALL_ZERO_STATES satisfies readonly ZeroState[]);

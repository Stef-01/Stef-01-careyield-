// W210 verify gate: PRIV-3's two-year history is the fixture, a finding whose trigger is now true
// fails the suite, and a finding with no stated trigger is refused.

import { describe, expect, it } from "vitest";
import { getStore, resetStore } from "@/booking/store";
import {
  LATENT_FINDINGS,
  type LatentFinding,
  declareFinding,
  fired,
  modulesWithNoUnitHeader,
} from "./latent-findings";

const finding = (id: string): LatentFinding => {
  const found = LATENT_FINDINGS.find((f) => f.id === id);
  if (!found) throw new Error(`${id} is not in the register`);
  return found;
};

describe("W210 a latent finding fails the build on the day it goes live", () => {
  it("has nothing open that has already fired", () => {
    // THE WHOLE UNIT. An open finding whose predicate is true is a defect that has become live
    // and that somebody wrote down in advance — the most avoidable kind this tree has.
    expect(
      fired().map((f) => `${f.id} has gone live: ${f.triggerStatement}`),
    ).toEqual([]);
  });

  it("evaluates every trigger against the tree, not against a stored answer", () => {
    // Non-vacuity: `fired()` filters on `status === "open"`, so a register of nothing but closed
    // findings would pass the test above while checking nothing at all.
    const open = LATENT_FINDINGS.filter((f) => f.status === "open");
    expect(open.length).toBeGreaterThan(1);
    for (const f of open) expect(typeof f.trigger(), `${f.id}`).toBe("boolean");
  });

  it("refuses a finding that states no trigger", () => {
    // Runtime, not types: `triggerStatement: ""` typechecks perfectly.
    const bare = {
      id: "TEST-1",
      what: "something",
      recordedBy: "W210",
      triggerStatement: "",
      trigger: () => false,
      status: "open" as const,
    };
    expect(() => declareFinding(bare)).toThrow(/must state what would make it live/);
    expect(() => declareFinding({ ...bare, triggerStatement: "when it breaks" })).toThrow();
    // And accepts one that does.
    expect(
      declareFinding({
        ...bare,
        triggerStatement: "When the seeded rail holds sessions for more than one practice at once.",
      }).id,
    ).toBe("TEST-1");
  });

  it("gives every finding a distinct id, a defect and the unit that recorded it", () => {
    const ids = LATENT_FINDINGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of LATENT_FINDINGS) {
      expect(f.what.length, `${f.id} describes no defect`).toBeGreaterThan(80);
      expect(f.recordedBy, `${f.id} names no unit`).toMatch(/^W\d+$/);
      if (f.status === "closed") expect(f.closedBy, `${f.id} is closed by nobody`).toMatch(/^W\d+$/);
    }
  });
});

describe("W210 PRIV-3 is the fixture, because it is the one that got out", () => {
  it("keeps PRIV-3 in the register with its trigger still true", () => {
    // The proof the mechanism works. PRIV-3's trigger fired at W166 and the finding stayed open
    // for forty-three more units — so the register's value is not that it records the trigger
    // (the ledger row already did, in bold) but that a suite can run it.
    const priv3 = finding("PRIV-3");
    expect(priv3.trigger(), "PRIV-3's condition is what W166 made true").toBe(true);
    expect(priv3.status).toBe("closed");
    expect(priv3.closedBy).toBe("W209");
  });

  it("would have failed the build at W166 rather than at the Y4 audit", () => {
    // The counterfactual, run rather than asserted: PRIV-3 as it stood the day before W209 closed
    // it — same predicate, status still open — is exactly what `fired()` exists to catch.
    const asItStood: LatentFinding = { ...finding("PRIV-3"), status: "open", closedBy: undefined };
    expect(fired([asItStood]).map((f) => f.id)).toEqual(["PRIV-3"]);
  });

  it("names what staying open cost, so the register is not filed as bookkeeping", () => {
    expect(finding("PRIV-3").what).toMatch(/structurally unobservable/);
  });
});

describe("W210 the triggers are real predicates over this tree", () => {
  it("reads the seeded rail for TENANCY-1 rather than trusting W209's note", () => {
    // W209 recorded `sessionAppointmentType` as sound only while the rail seeds one practice.
    // That is a claim about the fixture, so the trigger reads the fixture.
    expect(finding("TENANCY-1").trigger()).toBe(false);
    expect(finding("TENANCY-1").recordedBy).toBe("W209");
  });

  it("finds no header-less module at all, because W281 closed CENSUS-1", () => {
    // Was `toBe(HEADERLESS_AT_W210)` — eleven, tolerated forever. W281 headered all eleven and
    // retired the pin, so the floor is zero and needs no constant. The trigger is kept and
    // re-shaped to `> 0`: W280's rule, that a closed finding whose condition was deleted is
    // indistinguishable from one that was never real.
    expect(modulesWithNoUnitHeader()).toEqual([]);
    expect(finding("CENSUS-1").trigger()).toBe(false);
    expect(finding("CENSUS-1").status).toBe("closed");
    expect(finding("CENSUS-1").closedBy).toBe("W281");
  });

  it("no longer touches the synthetic rail, because the trigger that did is closed", () => {
    // W221 recorded this as a CONTRACT: TENANCY-1's trigger had to reset the global rail to read a
    // pristine seed, and an exported predicate with an undocumented effect on shared state is the
    // shape that becomes a defect when somebody composes it — so the effect was specified rather
    // than left to be discovered.
    //
    // W280 CLOSED TENANCY-1, AND `fired()` ONLY EVALUATES OPEN FINDINGS, so the side effect is
    // gone. The assertion inverts rather than being deleted: "the effect stopped happening" and
    // "somebody removed the test" are indistinguishable otherwise, and the trigger itself is
    // still in the register — it is the condition the finding was recorded against, and only its
    // STATUS changed.
    resetStore();
    getStore().state.appointments.push({ ...getStore().state.appointments[0]!, id: "apt-mut" as never });
    fired();
    expect(
      getStore().state.appointments.some((a) => a.id === "apt-mut"),
      "fired() reset the rail, so an open finding is reading it again",
    ).toBe(true);
    // And the trigger it belonged to is still there, still doing what it did.
    expect(finding("TENANCY-1").status).toBe("closed");
    expect(typeof finding("TENANCY-1").trigger).toBe("function");
  });

  it("checks DOSSIER-1 against the dossier tests that exist", () => {
    expect(finding("DOSSIER-1").trigger()).toBe(false);
  });
});

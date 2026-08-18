// W330 verify gate: "every declaration whose truth depends on a future event names that event,
// W324's `pending` arm generalised, and a planted declaration whose event has passed reported."
//
// THE LIVE ASSERTIONS ARE THREE LINES and the rest of this file is about whether they can fail. A
// register of things being waited on is the easiest kind in this tree to write vacuously: collect
// nothing, evaluate nothing, report nothing, stay green while every wait in the tree outlives what
// it was waiting for. So each arm is driven with a declaration whose event has already happened.

import { describe, expect, it } from "vitest";
import {
  ENDING_BOUND,
  ENDING_REGISTERS,
  type EndingRegister,
  WAIT_DISCRIMINANTS,
  WAIT_FIXTURES,
  allEndings,
  eventInWords,
  endedDeclarations,
  endingDiff,
  hasEnded,
  unreadableEndings,
  waitingModules,
} from "./self-ending";

const ROOT = process.cwd();

/** A register of exactly the declarations a test hands it. */
const register = (entries: Parameters<typeof one>[0][]): EndingRegister[] => [
  { unit: "W330", module: "src/quality/self-ending.ts", register: "PROBE", entries: () => entries, rechecked: { kind: "ended_here" } },
];

function one(e: { id: string; what: string; ending: Parameters<typeof hasEnded>[1] }) {
  return e;
}

describe("W330 nothing waits on something that has already happened", () => {
  it("holds no declaration whose event has passed", () => {
    expect(endedDeclarations(ROOT)).toEqual([]);
  });

  it("names an event for every wait, and every event is one something could read", () => {
    // The vacuity that matters most. An event nothing can evaluate returns false forever, which
    // reads exactly like a wait that is still waiting — W318's `W299+` for seventeen units.
    expect(unreadableEndings(ROOT)).toEqual([]);
  });

  it("knows every module that spells a wait, and names none that has stopped", () => {
    expect(endingDiff(ROOT)).toEqual({ unregistered: [], stale: [] });
  });

  it("collects waits from every register that holds one, not just the deferrals", () => {
    const kinds = new Set(allEndings(ROOT).map((e) => e.ending.kind));
    // W336: `unit_lands` LEFT THE LIVE SET when the tree's last two deferrals were answered, which
    // is the register reporting an outcome rather than going quiet. The kind is still built and
    // still driven — the tests below hand it fabricated waits — so what this line pins is the set
    // the TREE holds, and it will grow again the day somebody defers something.
    expect([...kinds].sort()).toEqual(["gate_ruled", "remedy_built", "unobservable"]);
    expect(allEndings(ROOT).length).toBeGreaterThan(0);
    expect(new Set(allEndings(ROOT).map((e) => e.id)).size, "two waits share an id").toBe(
      allEndings(ROOT).length,
    );
  });

  it("reports a deferral whose unit has landed", () => {
    // W1 is done, so this is a declaration waiting for something that happened years ago.
    const found = endedDeclarations(
      ROOT,
      register([one({ id: "P::1", what: "a probe", ending: { kind: "unit_lands", unit: "W1" } })]),
    );
    expect(found).toEqual(["P::1 waited on W1 landing, which has happened: a probe"]);
  });

  it("says nothing about a deferral whose unit has not landed", () => {
    // The other half, and without it the arm above would pass on a predicate that is always true.
    expect(
      endedDeclarations(
        ROOT,
        register([one({ id: "P::2", what: "a probe", ending: { kind: "unit_lands", unit: "W99999" } })]),
      ),
    ).toEqual([]);
  });

  it("reports an event nothing could ever read, rather than reading it as still waiting", () => {
    const probes = register([
      one({ id: "P::3", what: "a probe", ending: { kind: "unit_lands", unit: "W99999" } }),
      one({ id: "P::4", what: "a probe", ending: { kind: "gate_ruled", gate: "G404" } }),
    ]);
    expect(unreadableEndings(ROOT, probes)).toEqual([
      "P::3 waits on W99999, which the ledger does not hold",
      "P::4 waits on G404, which section 4 does not define",
    ]);
    // And they read as UNENDED, which is the point: false forever looks like patience.
    expect(endedDeclarations(ROOT, probes)).toEqual([]);
  });

  it("holds a wait nothing can observe as unobservable, rather than as a check that says false", () => {
    const why = "y".repeat(80);
    expect(hasEnded(ROOT, { kind: "unobservable", why })).toBe(false);
    expect(unreadableEndings(ROOT, register([one({ id: "P::5", what: "x", ending: { kind: "unobservable", why } })]))).toEqual([]);
    expect(eventInWords({ kind: "unobservable", why })).toBe("something this tree cannot observe");
  });

  it("ends a remedy bound when its remedy is built", () => {
    const built = { kind: "remedy_built" as const, reads: "x", built: () => true };
    const open = { kind: "remedy_built" as const, reads: "x", built: () => false };
    expect(hasEnded(ROOT, built)).toBe(true);
    expect(hasEnded(ROOT, open)).toBe(false);
    expect(endedDeclarations(ROOT, register([one({ id: "P::6", what: "a bound", ending: built })]))).toEqual([
      "P::6 waited on a remedy for x, which has happened: a bound",
    ]);
  });

  it("reads a founder gate as ended only when section 4 strikes it through", () => {
    // G1 blocks nothing and is not cleared; a cleared gate is the founder's act and never this
    // loop's, so this arm is driven on the plan as it stands rather than on a planted one.
    expect(hasEnded(ROOT, { kind: "gate_ruled", gate: "G5" })).toBe(false);
  });

  it("reports a module that spells a wait and is in no register", () => {
    const withoutOne = ENDING_REGISTERS.filter((r) => r.module !== "src/quality/hardening-q22.ts");
    expect(endingDiff(ROOT, withoutOne).unregistered).toEqual(["src/quality/hardening-q22.ts"]);
    // And the fixtures are what keep that list to real waits: every module here builds a
    // wait-shaped probe to drive a check, and each arrived in the list by being written.
    expect(Object.keys(WAIT_FIXTURES).length).toBeGreaterThan(1);
  });

  it("does not report a register whose module has answered everything it was waiting on", () => {
    // `hardening-q24.ts` spells no wait today, because W330 fixed the deferral it held. That is the
    // outcome, not a defect: a register goes stale when its MODULE is gone, and a fixture goes
    // stale when the thing it excuses is gone. One rule for both reported the success as a failure.
    expect(ENDING_REGISTERS.map((r) => r.module)).toContain("src/quality/hardening-q24.ts");
    expect(waitingModules(ROOT)).not.toContain("src/quality/hardening-q24.ts");
    expect(endingDiff(ROOT).stale).toEqual([]);
  });

  it("reports a register, or a fixture, for a module that has stopped spelling one", () => {
    const invented: EndingRegister[] = [
      ...ENDING_REGISTERS,
      { unit: "W330", module: "src/quality/gone.ts", register: "X", entries: () => [], rechecked: { kind: "ended_here" } },
    ];
    expect(endingDiff(ROOT, invented).stale).toEqual(["src/quality/gone.ts"]);
    expect(endingDiff(ROOT, ENDING_REGISTERS, { "src/quality/also-gone.ts": "x" }).stale).toEqual([
      "src/quality/also-gone.ts",
    ]);
  });

  it("tells a wait being CONSTRUCTED from one being read", () => {
    // The discriminator the derivation rests on. A register that compares against `"deferred"` is
    // reading somebody else's wait; only a register that builds one is waiting.
    expect(WAIT_DISCRIMINANTS.test('  disposition: { kind: "deferred", why: "x", by: "W1" },')).toBe(true);
    expect(WAIT_DISCRIMINANTS.test('  if (d.kind === "deferred") return true;')).toBe(false);
    // And a longer discriminant is a different word, which is why this module does not match itself.
    expect(WAIT_DISCRIMINANTS.test('  ending: { kind: "remedy_built", reads: "x" },')).toBe(false);
    expect(waitingModules(ROOT)).not.toContain("src/quality/self-ending.ts");
  });

  it("argues every fixture it excuses, at a length somebody can check", () => {
    for (const [module, why] of Object.entries(WAIT_FIXTURES)) {
      expect(why.length, `${module} is excused without an argument`).toBeGreaterThan(150);
      expect(waitingModules(ROOT), `${module} no longer spells a wait`).toContain(module);
    }
  });

  it("says which register also checks each wait, rather than hiding the overlap", () => {
    for (const r of ENDING_REGISTERS) {
      if (r.rechecked.kind !== "ended_there_too") continue;
      expect(r.rechecked.why.length, `${r.module} does not say what reading it twice adds`).toBeGreaterThan(60);
    }
  });

  it("says what it cannot find", () => {
    expect(ENDING_BOUND).toContain("A wait written as prose is");
    expect(ENDING_BOUND).toContain("W299+");
  });
});

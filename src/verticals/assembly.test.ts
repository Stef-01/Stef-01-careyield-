// W250: the rules that are about EVERY vertical, tested where they belong.
//
// W248 built the census that stops a third vertical being a copy of the first — and put it in
// `womens-health.test.ts`. That was the wrong home and the third vertical is what makes it
// obvious: a rule about all verticals, asserted in the test file of ONE of them, disappears the
// day that one is deleted or renamed, and the next author writing `respiratory.test.ts` either
// duplicates the census or relies on a sibling file they have no reason to read. It lives with
// the machinery now.
//
// AND THE THIRD VERTICAL FOUND A REAL DEFECT IN THE SECOND'S WORK. `gatesFor` deduplicated
// `waitsOn` STRINGS while calling itself a gate list; dermatology's five members, blocked by one
// founder gate and two authoring acts, produced five "gates". W248's own test asserted
// `gates.length < members.length` and passed — because women's health happened to word two members
// identically. A test that certified a deduplication on the one fixture where it coincidentally
// happened. The gate is a declared value now, and the assertions below are about grouping rather
// than about being shorter than something.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_BLOCKING_GATES,
  blockedCountByGate,
  gatesFor,
  shippedEvidence,
  type DeclaredMember,
} from "./assembly";
import { DERMATOLOGY_MEMBERS, DERMATOLOGY_SPEC } from "./dermatology";
import { RESPIRATORY_MEMBERS, RESPIRATORY_SPEC } from "./respiratory";
import { WOMENS_HEALTH_MEMBERS, WOMENS_HEALTH_SPEC } from "./womens-health";

const DIR = path.join(process.cwd(), "src/verticals");

/** The machinery, as opposed to the declarations. Named so the census cannot silently narrow. */
const MACHINERY = new Set([
  "assembly.ts",
  "model.ts",
  "completeness.ts",
  "consistency.ts",
  "binding.ts",
  "store.ts",
  // W252: a scale harness, not a vertical. The census caught it on the first run, which is the
  // census working — a new file in this directory is a declaration until somebody says otherwise.
  "scale.ts",
]);

function verticalModules(): string[] {
  return readdirSync(DIR).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".types.ts") && !MACHINERY.has(f),
  );
}

const ALL_MEMBERS: readonly DeclaredMember[] = [
  ...DERMATOLOGY_MEMBERS,
  ...WOMENS_HEALTH_MEMBERS,
  ...RESPIRATORY_MEMBERS,
];

const ALL_SPECS = [DERMATOLOGY_SPEC, WOMENS_HEALTH_SPEC, RESPIRATORY_SPEC];

describe("W250 every vertical goes through the shared door", () => {
  it("finds all three declarations, and no machinery among them", () => {
    // Vacuity guard for the census itself. A filter that excluded everything would certify the
    // rule forever, which is the shape W221 found in a dormancy proof.
    const modules = verticalModules();
    expect(modules.sort()).toEqual(["dermatology.ts", "respiratory.ts", "womens-health.ts"]);
  });

  it("lets no vertical call W157's model or W158's report itself", () => {
    // THE census, now living with the machinery rather than inside one vertical's test — where it
    // would have vanished with that vertical and been invisible to whoever wrote the next one.
    for (const file of verticalModules()) {
      const text = readFileSync(path.join(DIR, file), "utf8");
      expect(text, `${file} calls W157's model directly`).not.toContain("usableVertical(");
      expect(text, `${file} calls W158's report directly`).not.toContain("assessCompleteness(");
      expect(text, `${file} reads a registry directly`).not.toContain("SHIPPED_INTERVALS");
      expect(text, `${file} reads a registry directly`).not.toContain("SHIPPED_WORKSPACE");
    }
  });

  it("keeps one evidence reader for all of them", () => {
    const assembly = readFileSync(path.join(DIR, "assembly.ts"), "utf8");
    expect(assembly).toContain("usableVertical(");
    expect(assembly).toContain("assessCompleteness(");
    const evidence = shippedEvidence();
    expect(evidence.pathways).toEqual([]);
    expect(evidence.educationItems).toEqual([]);
    expect(evidence.intervals.intervals).toEqual([]);
  });

  it("gives every vertical a distinct identity and distinct refs", () => {
    const ids = ALL_SPECS.map((s) => s.verticalId);
    expect(new Set(ids).size).toBe(ids.length);
    const refs = ALL_MEMBERS.map((m) => m.ref);
    expect(new Set(refs).size, "two verticals share a member ref").toBe(refs.length);
  });
});

describe("W250 the gate list deduplicates gates, not prose", () => {
  it("returns ONE gate for dermatology, which returned five", () => {
    // The finding, pinned at the fixture that exposed it. Five members, one founder gate and two
    // authoring acts — and the prose version returned five because the three G5 sentences were
    // worded differently.
    expect(DERMATOLOGY_MEMBERS).toHaveLength(5);
    expect(gatesFor(DERMATOLOGY_MEMBERS)).toEqual(["G5"]);
  });

  it("groups the same gate across DIFFERENT verticals, which prose never could", () => {
    // The question three verticals make worth asking: which single ruling unblocks the most? G5 is
    // seven distinct `waitsOn` strings across the tree and one decision.
    const distinctProse = new Set(ALL_MEMBERS.map((m) => m.waitsOn)).size;
    expect(distinctProse, "the prose happens to collapse, so this proves nothing").toBeGreaterThan(6);
    expect(gatesFor(ALL_MEMBERS)).toEqual(["G5"]);
  });

  it("counts how many members each gate blocks, worst first", () => {
    const blockers = blockedCountByGate(ALL_MEMBERS);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]!.gate).toBe("G5");
    expect(blockers[0]!.count).toBe(ALL_MEMBERS.filter((m) => m.gate === "G5").length);
    expect(blockers[0]!.count).toBeGreaterThan(6);
  });

  it("excludes members no founder gate blocks", () => {
    // A member waiting on an author is waiting on somebody, but not on a founder. Including it
    // would tell a founder they had a decision to take where they do not.
    const authors = ALL_MEMBERS.filter((m) => m.gate === "none");
    expect(authors.length, "no ungated member in the fixture, so this proves nothing").toBeGreaterThan(2);
    expect(gatesFor(authors)).toEqual([]);
    expect(blockedCountByGate(authors)).toEqual([]);
  });

  it("is order-independent and ranked, over a fixture with MORE THAN ONE gate", () => {
    // W167's property — and the first version of this test was VACUOUS. Every vertical member in
    // the tree waits on G5, so the rollup returned a single row, the sort was unreachable, and
    // reversing the input could not change an answer. Removing the sort entirely passed it.
    // A property tested over a set of one is a property nobody tested.
    const mixed: DeclaredMember[] = [
      ...ALL_MEMBERS,
      { kind: "content", ref: "x-1", gate: "G9", waitsOn: "G9 — disclosure to a commissioning body." },
      { kind: "content", ref: "x-2", gate: "G9", waitsOn: "G9 — disclosure to a commissioning body." },
      { kind: "content", ref: "x-3", gate: "G1", waitsOn: "G1 — real credentials for a live system." },
    ];
    const ranked = blockedCountByGate(mixed);
    expect(ranked.length, "the fixture still has one gate").toBeGreaterThan(2);
    expect(ranked.map((r) => r.gate)).toEqual(["G5", "G9", "G1"]);
    expect(blockedCountByGate([...mixed].reverse())).toEqual(ranked);
  });

  it("names only gates plan §4 defines", () => {
    // W242's rule: a gate named in code and undefined in the plan is a blocker nobody can act on.
    // The union is the plan's list rather than the gates that happen to block a member today.
    const plan = readFileSync(path.join(process.cwd(), "docs/FIVE-YEAR-PLAN.md"), "utf8");
    const gates = ALL_BLOCKING_GATES.filter((g) => g !== "none");
    expect(gates.length).toBeGreaterThan(5);
    for (const gate of gates) {
      expect(plan, `${gate} is in the union but not defined in plan §4`).toMatch(
        new RegExp(`\\*\\*${gate}\\*\\*\\s*—`),
      );
    }
  });

  it("keeps the prose beside the value rather than instead of it", () => {
    // The sentence is what a reader needs; the value is what a register needs. Neither replaces
    // the other — W227's rule about a reading that must not be inferred.
    for (const member of ALL_MEMBERS) {
      expect(Object.keys(member).sort()).toEqual(["gate", "kind", "ref", "waitsOn"]);
      expect(member.waitsOn.length, `${member.ref} has no sentence`).toBeGreaterThan(40);
      if (member.gate === "G5") {
        expect(member.waitsOn, `${member.ref} names a gate its value does not`).toContain("G5");
      }
    }
  });

  it("agrees with the prose in both directions", () => {
    // The value and the sentence are two statements about one fact, so W194's rule applies: test
    // that they AGREE. A member whose sentence mentions G5 while its value says `none` would be
    // the drift this pair invites.
    for (const member of ALL_MEMBERS) {
      expect(member.waitsOn.includes("G5"), `${member.ref} value and prose disagree`).toBe(
        member.gate === "G5",
      );
    }
  });
});

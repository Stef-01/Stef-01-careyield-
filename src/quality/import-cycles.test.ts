// W381 verify gate: "every import cycle in `src/` derived, each classified by whether a value
// crosses it; a cycle whose symptom is `undefined` at module-eval is reported, and W367's own case
// is driven both ways."
//
// THE LAST CLAUSE IS THE ONE THAT COST A UNIT. W367's cycle did not fail to compile and did not
// throw at import: one side evaluated first and saw `undefined` where a bound's text should have
// been, and the symptom surfaced three frames away. So the two shapes are PLANTED and RUN here —
// the same two modules importing each other, reading the crossing value at module-evaluation time
// in one pair and inside a function in the other — and the difference is watched rather than
// argued.
//
// The planted modules are `.mjs` so node will load them from a temp directory without a compile
// step, and they live in `scan-fixtures.fixtures` because a cycle written as a string literal in
// this file would be read by every scan in the tree that walks test modules.

import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  CYCLES_AT_W381,
  CYCLE_BOUND,
  type DeclaredCycle,
  cycleDefects,
  cyclicComponents,
  holesIn,
  moduleGraph,
  resolveImport,
  runtimeMembers,
  valueGraph,
} from "./import-cycles";
import { fixtureText } from "./scan-text";
import { probeDirPrefix } from "./repository-clean";

const ROOT = process.cwd();
const GRAPH = moduleGraph(ROOT);
const COMPONENTS = cyclicComponents(ROOT, GRAPH);
const key = (members: readonly string[]) => [...members].sort().join(" + ");
const only = (id: string, rows: readonly DeclaredCycle[]) =>
  cycleDefects(ROOT, rows).filter((d) => d.cycle === id);

/** Plant a two-module cycle in a throwaway directory and import one side of it. */
/** The two planted pairs, cited literally so W307's both-directions check can see them. */
const AT_EVAL = { a: fixtureText("cycle-read-at-eval-a"), b: fixtureText("cycle-read-at-eval-b") };
const IN_A_FUNCTION = {
  a: fixtureText("cycle-read-in-a-function-a"),
  b: fixtureText("cycle-read-in-a-function-b"),
};

async function loadModule(pair: { a: string; b: string }, entry: "a" | "b"): Promise<Record<string, unknown>> {
  const dir = mkdtempSync(path.join(tmpdir(), probeDirPrefix(process.pid)));
  try {
    writeFileSync(path.join(dir, "a.mjs"), pair.a);
    writeFileSync(path.join(dir, "b.mjs"), pair.b);
    return (await import(pathToFileURL(path.join(dir, `${entry}.mjs`)).href)) as Record<string, unknown>;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("W381 every import cycle in this tree is derived and classified", () => {
  it("passes, over the tree as it stands", () => {
    // The same call on a tree nobody has classified reports every cycle it holds, so an empty
    // answer here is a finding rather than a reader that never speaks.
    expect(cycleDefects(ROOT, []).length).toBeGreaterThan(1);
    expect(cycleDefects(ROOT)).toEqual([]);
  });

  it("derives the components rather than listing them", () => {
    expect(COMPONENTS.length).toBeGreaterThan(1);
    expect(CYCLES_AT_W381.map((c) => key(c.members)).sort()).toEqual(COMPONENTS.map(key).sort());
    // Evidence that an empty result above is a finding: with nothing declared, every cycle reports.
    expect(cycleDefects(ROOT, []).length).toBe(COMPONENTS.length);
    // A component is a knot, not a loop: this tree holds thousands of elementary cycles and a
    // handful of components, which is the difference between a number and a fact.
    expect(COMPONENTS[0]!.length).toBeGreaterThan(20);
  });

  it("reports a cycle nothing classifies", () => {
    const id = key(COMPONENTS[0]!);
    expect(only(id, CYCLES_AT_W381.filter((c) => key(c.members) !== id))).toEqual([
      { cycle: id, what: "is an import cycle and nothing says whether a value crosses it" },
    ]);
  });

  it("reports a row for something that is not a cycle in this tree", () => {
    const orphan: DeclaredCycle[] = [
      { members: ["src/gone.ts", "src/also-gone.ts"], standing: { kind: "type_only" } },
    ];
    expect(only("src/also-gone.ts + src/gone.ts", orphan)).toEqual([
      { cycle: "src/also-gone.ts + src/gone.ts", what: "is recorded here and is not a cycle in this tree" },
    ]);
  });

  it("reports a cycle recorded as type-only whose members still cycle at runtime", () => {
    const id = key(COMPONENTS[0]!);
    const wrong = CYCLES_AT_W381.map((c) =>
      key(c.members) === id ? { ...c, standing: { kind: "type_only" as const } } : c,
    );
    expect(only(id, wrong)[0]!.what).toContain("is recorded as type-only and");
  });

  it("reports a cycle recorded as carrying a value that types alone hold together", () => {
    const typeOnly = CYCLES_AT_W381.find((c) => c.standing.kind === "type_only")!;
    const id = key(typeOnly.members);
    const wrong = CYCLES_AT_W381.map((c) =>
      key(c.members) === id ? { ...c, standing: { kind: "deferred" as const, why: "y".repeat(130) } } : c,
    );
    expect(only(id, wrong)).toEqual([
      { cycle: id, what: "is recorded as carrying a value and every edge holding it together is a type" },
    ]);
  });

  it("reports a cycle recorded as reading a value while the graph evaluates", () => {
    const id = key(COMPONENTS[0]!);
    const found = CYCLES_AT_W381.map((c) =>
      key(c.members) === id
        ? { ...c, standing: { kind: "evaluated" as const, why: "bounds.ts reads a bound at its top level" } }
        : c,
    );
    expect(only(id, found)).toEqual([
      {
        cycle: id,
        what: "reads a value while the graph is still evaluating: bounds.ts reads a bound at its top level",
      },
    ]);
  });

  it("reports a cycle carrying a value that nobody argued", () => {
    const id = key(COMPONENTS[0]!);
    const bare = CYCLES_AT_W381.map((c) =>
      key(c.members) === id ? { ...c, standing: { kind: "deferred" as const, why: "it is fine" } } : c,
    );
    expect(only(id, bare)).toEqual([
      { cycle: id, what: "carries a value across a cycle and is recorded without an argument" },
    ]);
  });
});

describe("W381 a type edge is not a runtime edge, which is what W367's fix looks like", () => {
  it("drops the members a type import alone holds inside a cycle", () => {
    const structural = COMPONENTS[0]!;
    const atRuntime = runtimeMembers(structural, GRAPH);
    expect(atRuntime.length, "nothing is in this cycle at runtime, so the classes mean nothing").toBeGreaterThan(20);
    expect(atRuntime.length, "types hold nobody in, so this checks nothing").toBeLessThan(structural.length);
    // W367's two: still named in the source cycle, leaves once types are erased.
    expect(structural).toContain("src/quality/subject-and-walk.ts");
    expect(atRuntime).not.toContain("src/quality/subject-and-walk.ts");
  });

  it("finds a whole component that only types hold together", () => {
    const typeOnly = CYCLES_AT_W381.filter((c) => c.standing.kind === "type_only");
    expect(typeOnly.length, "no cycle is type-only, so the class is a bin").toBeGreaterThan(0);
    for (const row of typeOnly) {
      expect(runtimeMembers(row.members, GRAPH), `${key(row.members)} still cycles at runtime`).toEqual([]);
    }
    // And the value graph really is smaller, so the distinction is doing work.
    const edges = (g: Map<string, { to: string; value: boolean }[]>) => [...g.values()].flat().length;
    expect(edges(valueGraph(GRAPH))).toBeLessThan(edges(GRAPH));
  });

  it("resolves an import the way the bundler does, and refuses one it cannot", () => {
    const held = new Set(["src/quality/bounds.ts", "src/a/b.ts"]);
    expect(resolveImport("src/quality/pins.ts", "./bounds", held)).toBe("src/quality/bounds.ts");
    expect(resolveImport("src/quality/pins.ts", "@/quality/bounds", held)).toBe("src/quality/bounds.ts");
    expect(resolveImport("src/a/c.ts", "./b", held)).toBe("src/a/b.ts");
    expect(resolveImport("src/quality/pins.ts", "node:fs", held)).toBe(null);
    expect(resolveImport("src/quality/pins.ts", "./nowhere", held)).toBe(null);
  });
});

describe("W381 W367's case, driven both ways", () => {
  it("leaves a hole when the crossing value is read while the graph evaluates", async () => {
    // THE UNIT. Entered at `a`, `b` has not finished when `a` reads `FROM_B`; entered at `b`, the
    // other side is the one holding the hole. Either way one of them is `undefined` and neither
    // module threw — which is exactly what W367 met and spent half a unit finding.
    const fromA = await loadModule(AT_EVAL, "a");
    // Entered at `a`: `b` evaluates first and reads `NAME_A` before `a` has assigned it, so the
    // hole is on `b`'s side — re-exported here so one namespace shows both.
    expect(holesIn(fromA.READS_A, "READS_A")).toEqual(["READS_A.text"]);
    // And the value `a` read from `b` is intact, which is what makes it a HOLE rather than a
    // failure: one direction of the same cycle is fine and the other is silently empty.
    expect(holesIn(fromA.READS_B, "READS_B")).toEqual([]);
    const fromB = await loadModule(AT_EVAL, "b");
    // Entered at `b` the hole moves to the other side, which is the whole point: nothing about the
    // source decides it. W367 was green entered one way and red entered the other.
    expect(holesIn(fromB.READS_A, "READS_A")).toEqual([]);
  });

  it("leaves none when the crossing value is read inside a function", async () => {
    // THE OTHER WAY. Same two modules, same cycle, and the binding is resolved when the function is
    // called — which is after every module has finished evaluating. This is why the tree's own
    // twenty-seven-module knot is not a defect.
    const fromA = await loadModule(IN_A_FUNCTION, "a");
    const readsB = fromA.readsB as () => { text: string };
    expect(holesIn(readsB(), "readsB()")).toEqual([]);
    const fromB = await loadModule(IN_A_FUNCTION, "b");
    const readsA = fromB.readsA as () => { text: string };
    expect(holesIn(readsA(), "readsA()")).toEqual([]);
  });

  it("walks into a value rather than checking the binding, which is where W367's hole was", () => {
    // `STATED_BOUNDS` was an array; the hole was a `text` field several levels inside it.
    expect(holesIn({ rows: [{ text: undefined }] }, "STATED_BOUNDS")).toEqual(["STATED_BOUNDS.rows[0].text"]);
    expect(holesIn({ rows: [{ text: "there" }] }, "STATED_BOUNDS")).toEqual([]);
    // And it survives a cycle in the data rather than looping forever.
    const looped: Record<string, unknown> = { name: "x" };
    looped.self = looped;
    expect(holesIn(looped, "looped")).toEqual([]);
  });
});

describe("W381 the register says what it is and what it is not", () => {
  it("states what a green run does not cover", () => {
    expect(CYCLE_BOUND.length).toBeGreaterThan(600);
    expect(CYCLE_BOUND).toContain("IT READS IMPORTS, NOT EVALUATION");
    expect(CYCLE_BOUND).toContain("`deferred` IS AN ARGUMENT ABOUT WHERE A NAME IS READ");
  });
});

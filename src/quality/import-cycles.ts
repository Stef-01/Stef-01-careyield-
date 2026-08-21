// W381: module-evaluation order as a correctness condition.
//
// W367 SPENT HALF A UNIT ON A `TypeError` THREE FRAMES FROM ITS CAUSE. A new register imported
// `STATED_BOUNDS`; `bounds.ts` imports every bound from the module that owns it, including that
// one's; and the cycle closed. Nothing failed to compile and nothing threw at import — one side
// simply evaluated first and saw `undefined` where a bound's text should have been. The symptom
// appeared later, in a helper, as `Cannot read properties of undefined`.
//
// THE PART WORTH WRITING DOWN IS THAT IT WAS ORDER-DEPENDENT. Entered through `bounds.ts` the same
// code was green; entered through the new module it was red. A suite that happened to import them
// the other way round would have shipped the defect and a suite that did not would have caught it,
// and which one you get depends on which test file vitest loads first.
//
// SO THE POPULATION IS THE STRONGLY CONNECTED COMPONENT, not the elementary cycle. This tree holds
// four and a half thousand elementary cycles and three components, which is the difference between
// a number nobody can read and a fact: `src/quality` has one large knot around `manifest.ts`,
// `bounds.ts` and `blind-spots.ts`, the hardening passes cite each other in a second, and
// `interop/disclosure-ledger.ts` and `privacy/record-classes.ts` make a third.
//
// A CYCLE IS NOT A DEFECT AND SAYING SO IS THE POINT. A type-only edge is erased before anything
// runs. A value edge read inside a FUNCTION is resolved when the function is called, which is after
// every module has finished evaluating. Only a value read at module-evaluation time can see a hole,
// and that is what the runtime probe in this register's suite looks for: each component is entered
// at every one of its members in turn, with the module registry reset between, and every exported
// value is walked for an `undefined` that should not be there.
//
// WHAT THIS DOES NOT PROVE is `CYCLE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own imports.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/** One import edge: where it points, and whether a VALUE crosses it. */
export interface Edge {
  to: string;
  /** False for `import type`, and for a clause whose every specifier is `type`-prefixed. */
  value: boolean;
}

/** Resolve an import specifier to a file this tree holds, or null. */
export function resolveImport(from: string, spec: string, held: ReadonlySet<string>): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = `src/${spec.slice(2)}`;
  else if (spec.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  else return null;
  for (const candidate of [`${base}.ts`, `${base}/index.ts`]) if (held.has(candidate)) return candidate;
  return null;
}

/** Every module's imports, with type-only edges marked. */
export function moduleGraph(root: string): Map<string, Edge[]> {
  const files = sourceModules(root).map((f) => path.relative(root, f).split(path.sep).join("/"));
  const held = new Set(files);
  const graph = new Map<string, Edge[]>();
  for (const file of files) {
    const code = prepareForScan(readFileSync(path.join(root, file), "utf8"), { literals: "kept" });
    const edges = new Map<string, boolean>();
    for (const m of code.matchAll(/^import\s+(type\s+)?([\s\S]*?)from\s+"([^"]+)";/gm)) {
      const to = resolveImport(file, m[3]!, held);
      if (to === null || to === file) continue;
      const clause = m[2]!;
      const specifiers = clause.includes("{")
        ? [...clause.matchAll(/[{,]\s*([^,}]+)/g)].map((s) => s[1]!.trim())
        : [clause.trim()];
      const carriesValue = !m[1] && specifiers.some((s) => s !== "" && !s.startsWith("type "));
      edges.set(to, (edges.get(to) ?? false) || carriesValue);
    }
    graph.set(file, [...edges].map(([to, value]) => ({ to, value })));
  }
  return graph;
}

/**
 * Every strongly connected component with more than one module, sorted.
 *
 * Tarjan's, iterative because this tree's graph is deep enough that the recursive form is a stack
 * overflow waiting for one more import.
 */
export function cyclicComponents(root: string, graph: Map<string, Edge[]> = moduleGraph(root)): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const found: string[][] = [];
  let counter = 0;

  for (const start of [...graph.keys()].sort()) {
    if (index.has(start)) continue;
    const work: { node: string; next: number }[] = [{ node: start, next: 0 }];
    index.set(start, counter);
    low.set(start, counter);
    counter += 1;
    stack.push(start);
    onStack.add(start);
    while (work.length > 0) {
      const frame = work[work.length - 1]!;
      const edges = graph.get(frame.node) ?? [];
      if (frame.next < edges.length) {
        const to = edges[frame.next]!.to;
        frame.next += 1;
        if (!index.has(to)) {
          index.set(to, counter);
          low.set(to, counter);
          counter += 1;
          stack.push(to);
          onStack.add(to);
          work.push({ node: to, next: 0 });
        } else if (onStack.has(to)) {
          low.set(frame.node, Math.min(low.get(frame.node)!, index.get(to)!));
        }
        continue;
      }
      work.pop();
      const parent = work[work.length - 1];
      if (parent) low.set(parent.node, Math.min(low.get(parent.node)!, low.get(frame.node)!));
      if (low.get(frame.node) === index.get(frame.node)) {
        const component: string[] = [];
        for (;;) {
          const popped = stack.pop()!;
          onStack.delete(popped);
          component.push(popped);
          if (popped === frame.node) break;
        }
        if (component.length > 1) found.push(component.sort());
      }
    }
  }
  return found.sort((a, b) => b.length - a.length || a[0]!.localeCompare(b[0]!));
}

/** The same graph with the type-only edges dropped — what actually exists when the code runs. */
export const valueGraph = (graph: Map<string, Edge[]>): Map<string, Edge[]> =>
  new Map([...graph].map(([from, edges]) => [from, edges.filter((e) => e.value)]));

/**
 * The members of a structural component that are still in a cycle once types are erased.
 *
 * THE DIFFERENCE IS THE INTERESTING PART. A module can sit inside a cycle a reader can see in the
 * source and be a leaf when the code runs, because the edge holding it there is `import type`.
 * W367's fix is exactly that shape: `subject-and-walk.ts` still names `Population` and is no longer
 * in any cycle that can produce an `undefined`.
 */
export function runtimeMembers(component: readonly string[], graph: Map<string, Edge[]>): string[] {
  const inside = new Set(component);
  const runtime = cyclicComponents("", valueGraph(graph)).filter((c) => c.some((m) => inside.has(m)));
  return [...new Set(runtime.flat().filter((m) => inside.has(m)))].sort();
}

/**
 * Every `undefined` reachable from a value, by path.
 *
 * W367'S SYMPTOM WAS NOT AN UNDEFINED EXPORT. `STATED_BOUNDS` was an array; the hole was a `text`
 * field several levels inside it. A check that looked only at the module's own bindings would have
 * called that tree healthy, which is why this walks.
 */
export function holesIn(value: unknown, at = "", depth = 0, seen = new Set<unknown>()): string[] {
  if (depth > 6 || (typeof value === "object" && value !== null && seen.has(value))) return [];
  if (typeof value === "object" && value !== null) seen.add(value);
  if (Array.isArray(value)) {
    return value.flatMap((item, i) =>
      item === undefined ? [`${at}[${i}]`] : holesIn(item, `${at}[${i}]`, depth + 1, seen),
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      item === undefined ? [`${at}.${key}`] : holesIn(item, `${at}.${key}`, depth + 1, seen),
    );
  }
  return [];
}

/** How a component stands against evaluation order. */
export type Standing =
  /** No value crosses it: every edge inside is `import type`, erased before anything runs. */
  | { kind: "type_only" }
  /** Values cross, and nothing reads one at module-evaluation time. Argued, and probed. */
  | { kind: "deferred"; why: string }
  /** THE FINDING: a value crosses and is read while the graph is still being evaluated. */
  | { kind: "evaluated"; why: string };

export interface DeclaredCycle {
  /** The component's members, as the tree spells them. */
  members: readonly string[];
  standing: Standing;
}

export interface CycleDefect {
  cycle: string;
  what: string;
}

/**
 * Every import cycle this tree holds, classified.
 *
 * THREE COMPONENTS, and their SIZES are the finding rather than their count. The largest holds
 * nearly every register in `src/quality`, which is what makes W367's mistake easy to repeat: any
 * new register importing one of them from inside is already in the knot.
 */
export const CYCLES_AT_W381: readonly DeclaredCycle[] = [
  {
    members: [
      "src/quality/assertion-drives.ts",
      "src/quality/blind-spots.ts",
      "src/quality/bounds.ts",
      "src/quality/claim-classes.ts",
      "src/quality/close-gate.ts",
      "src/quality/close-sensitivity.ts",
      "src/quality/closing-state.ts",
      "src/quality/controls.ts",
      "src/quality/declaration-tax.ts",
      "src/quality/empty-populations.ts",
      "src/quality/escape-hatches.ts",
      "src/quality/failure-direction.ts",
      "src/quality/horizon-directions.ts",
      "src/quality/horizon-q29-gate.ts",
      "src/quality/horizon-q30-gate.ts",
      "src/quality/instant.ts",
      "src/quality/latent-findings.ts",
      "src/quality/latent-y5.ts",
      "src/quality/manifest.ts",
      "src/quality/negative-probes.ts",
      "src/quality/populations.ts",
      "src/quality/prose-numbers.ts",
      "src/quality/refusal-branches.ts",
      "src/quality/register-census.ts",
      "src/quality/self-ending.ts",
      "src/quality/self-reference.ts",
      "src/quality/shared-excuses.ts",
      "src/quality/spelling-markers.ts",
      "src/quality/subject-and-walk.ts",
      "src/quality/superset.ts",
      "src/quality/unread-bounds.ts",
      "src/quality/unrun.ts",
      "src/quality/welded-comparisons.ts",
    ],
    standing: {
      kind: "deferred",
      why: "THE KNOT, and it is most of `src/quality`. `manifest.ts` declares every register, `bounds.ts` imports every stated bound from the module that owns it, and `blind-spots.ts` imports those bounds back to say what each cannot see — so almost anything joining the tree as a register is inside this the moment it states a bound. What keeps it working is that the values crossing it are read inside FUNCTIONS: `bounds.ts` is the one module that reads them while evaluating, and it is the one W367's cycle broke. Four of these are here through a type edge alone and are leaves once types are erased, which is what W367's fix looks like from outside. W389's gate joined it the same way one unit later, and for the same one-line reason: it states a bound. W380 JOINED IT AND THE REGISTER SAID SO IN BOTH DIRECTIONS: `close-sensitivity.ts` states a bound, so `bounds.ts` imports it and the knot took it in on the day it landed — reported once as a cycle nothing classifies and once as a recorded cycle the tree no longer holds. It reads its own crossing values inside functions like the rest, so the argument above covers it rather than being widened for it.",
    },
  },
  {
    members: [
      "src/quality/hardening-q22.ts",
      "src/quality/hardening-q23.ts",
      "src/quality/hardening-q24.ts",
      "src/quality/hardening-q25.ts",
      "src/quality/hardening-q26.ts",
      "src/quality/hardening-q27.ts",
      "src/quality/hardening-q28.ts",
      "src/quality/hardening-q29.ts",
      "src/quality/review-w279.ts",
    ],
    standing: {
      kind: "deferred",
      why: "EACH QUARTER'S PASS CITES THE ONE BEFORE IT AND W322'S PASS CITES THE ONES AFTER, because a finding is re-derived rather than restated and the re-derivation reaches for whichever pass holds the evidence. Every value crossing it is read inside a function — a pass exports its findings as a constant and its neighbours call `finding(id)` — so nothing is read while the graph is still evaluating. Half of these are held in by type edges only. W383 joined it on the day it landed, for the reason every pass does: `hardening-q22.ts` collects each quarter's findings into `HARDENING_REGISTERS` so one clock can read them all, and each pass imports that module back for the finding type and the shared `unaccountedFor`.",
    },
  },
  {
    members: ["src/interop/disclosure-ledger.ts", "src/privacy/record-classes.ts"],
    standing: { kind: "type_only" },
  },
];

/**
 * Where the cycle register and the tree disagree, in four directions.
 *
 * The classification is checked against the graph rather than believed: a component declared
 * `type_only` whose edges carry a value fails, which is the direction that matters — a type import
 * becoming a value import is a one-word edit nobody reads as dangerous.
 */
export function cycleDefects(
  root: string,
  declared: readonly DeclaredCycle[] = CYCLES_AT_W381,
): CycleDefect[] {
  const graph = moduleGraph(root);
  const components = cyclicComponents(root, graph);
  const key = (members: readonly string[]) => [...members].sort().join(" + ");
  const byKey = new Map(declared.map((d) => [key(d.members), d]));
  const out: CycleDefect[] = [];

  for (const component of components) {
    const id = key(component);
    const row = byKey.get(id);
    if (row === undefined) {
      out.push({ cycle: id, what: "is an import cycle and nothing says whether a value crosses it" });
      continue;
    }
    const atRuntime = runtimeMembers(component, graph);
    if (row.standing.kind === "type_only" && atRuntime.length > 0) {
      out.push({ cycle: id, what: `is recorded as type-only and ${atRuntime.length} of its members still cycle at runtime` });
      continue;
    }
    if (row.standing.kind !== "type_only" && atRuntime.length === 0) {
      out.push({ cycle: id, what: "is recorded as carrying a value and every edge holding it together is a type" });
      continue;
    }
    if (row.standing.kind === "evaluated") {
      out.push({ cycle: id, what: `reads a value while the graph is still evaluating: ${row.standing.why}` });
      continue;
    }
    if (row.standing.kind === "deferred" && row.standing.why.length < 120) {
      out.push({ cycle: id, what: "carries a value across a cycle and is recorded without an argument" });
    }
  }
  const live = new Set(components.map(key));
  for (const { members } of declared) {
    if (!live.has(key(members))) out.push({ cycle: key(members), what: "is recorded here and is not a cycle in this tree" });
  }
  return out.sort((a, b) => `${a.cycle}${a.what}`.localeCompare(`${b.cycle}${b.what}`));
}

/** What this register does not prove. */
export const CYCLE_BOUND =
  "IT READS IMPORTS, NOT EVALUATION. Which module in a component evaluates first is decided by " +
  "whoever imports it first, and that is the test file vitest happens to load — so the classes " +
  "here describe what COULD go wrong rather than what did, and the runtime probe that looks for a " +
  "hole runs one entry order per member rather than every interleaving. THE POPULATION IS `src/`: " +
  "a cycle closed through a `.test.ts`, through the vitest harness, or through `app/` is outside " +
  "it entirely, and the harness is exactly where W328 put a module to keep it out of a census. AND " +
  "`deferred` IS AN ARGUMENT ABOUT WHERE A NAME IS READ, which nothing here derives: a value used " +
  "only inside a function body is safe and a value used in a top-level initialiser is not, and " +
  "telling those apart in text needs a parse rather than a scan. What the probe checks instead is " +
  "the SYMPTOM — an `undefined` reachable from an export — which catches the shape W367 hit and " +
  "would miss a hole that is written over before anything reads it.";

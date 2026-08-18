// W340 verify gate: "every exported derivation counted by the modules that call it, the
// single-reader ones named rather than counted, and a fact the product computes and no surface asks
// for reported."
//
// THE LIVE ASSERTION IS ONE LINE and the rest of this file is about whether it can fail. A reader
// count is the easiest thing in this tree to get quietly wrong in the flattering direction: count a
// mention as a call and every fact has a reader. That mistake was made while writing this unit — the
// first derivation reported thirty-five unasked facts because prose naming a function counted as
// asking for it — so the pair that separates a mention from an import is driven here on a
// constructed tree rather than argued in a comment.

import { describe, expect, it } from "vitest";
import { withTree } from "./planting";
import {
  type Fact,
  UNASKED_AT_W340,
  UNASKED_BOUND,
  type UnaskedFact,
  askingReaders,
  namedImports,
  servedFacts,
  singleReaderFacts,
  unaskedDefects,
  unaskedFacts,
} from "./unasked-facts";

const ROOT = process.cwd();
/** Derived once: the walk is the expensive half and every arm below asks the same question of it. */
const FACTS = servedFacts(ROOT);
const UNASKED = unaskedFacts(ROOT, FACTS);

/** A tree with one page, so `reachableFromApp` has somewhere to start. */
const PAGE = 'import { asked } from "@/planted/facts";\nexport default function P() { return asked(); }\n';
/** §4 as `parseGates` reads it, so the gate arm resolves against a document rather than a list. */
const PLAN = "## 4. Gates\n\n- **G3** — live SMS to real patients\n- **G6** — network/directory public launch\n\n## 5. Units\n";

describe("W340 the facts the product computes and no surface asks for", () => {
  it("passes, over the tree the app actually serves", () => {
    expect(unaskedDefects(ROOT, UNASKED_AT_W340, UNASKED)).toEqual([]);
  });

  it("counts every served derivation by the files that import it", () => {
    const facts = FACTS;
    expect(facts.length).toBeGreaterThan(200);
    expect(facts.every((f) => /^src\/[^:]+\.ts::[A-Za-z0-9_]+$/.test(f.id))).toBe(true);
    // Non-vacuity from the other end: something in this tree really is read by many files.
    expect(Math.max(...facts.map((f) => f.readers.length))).toBeGreaterThan(5);
  });

  it("names the single-reader facts rather than counting them", () => {
    const named = singleReaderFacts(ROOT, FACTS);
    expect(named.length).toBeGreaterThan(20);
    expect(named.every((id) => id.includes("::"))).toBe(true);
    // A named fact and an unasked one are different populations, which is the point of the class.
    const unasked = new Set(UNASKED);
    expect(named.filter((id) => unasked.has(id))).toEqual([]);
  });
});

describe("W340 a reader is an import, not a mention", () => {
  const planted = <T,>(probe: (root: string) => T): T =>
    withTree(
      {
        "app/page.tsx": PAGE,
        "src/planted/facts.ts":
          "export function asked(): number {\n  return 1;\n}\nexport function mentionedOnly(): number {\n  return 2;\n}\n",
        // The witness: it NAMES `mentionedOnly` in a comment and in a string, and imports nothing.
        "src/planted/talks-about-it.ts":
          '// mentionedOnly is the shape this module is about.\nexport const NOTE = "mentionedOnly";\n',
        // The control: it imports the other name, which is what asking looks like.
        "src/planted/imports-it.ts":
          'import { asked } from "./facts";\nexport const USED = asked();\n',
      },
      probe,
    );

  it("does not count a file that only names the export", () => {
    const unasked = planted((root) => unaskedFacts(root));
    expect(unasked).toEqual(["src/planted/facts.ts::mentionedOnly"]);
  });

  it("counts the file that imports it, which is the control", () => {
    const facts = planted((root) => servedFacts(root));
    const asked = facts.find((f) => f.id === "src/planted/facts.ts::asked")!;
    expect(askingReaders(asked).sort()).toEqual(["app/page.tsx", "src/planted/imports-it.ts"]);
  });

  it("reads a re-export as a reader, because something downstream reaches through it", () => {
    expect(namedImports('export { asked } from "./facts";\n')).toEqual([
      { specifier: "./facts", names: ["asked"] },
    ]);
    expect(namedImports('import type { A as B, C } from "@/x";\n')).toEqual([
      { specifier: "@/x", names: ["A", "C"] },
    ]);
  });

  it("does not call a fact unasked when its own module uses it", () => {
    const unasked = withTree(
      {
        "app/page.tsx": PAGE,
        "src/planted/facts.ts":
          "export function helper(): number {\n  return 1;\n}\nexport function asked(): number {\n  return helper();\n}\n",
      },
      (root) => unaskedFacts(root),
    );
    expect(unasked).toEqual([]);
  });

  it("does not count a suite as a surface asking for the fact", () => {
    const unasked = withTree(
      {
        "app/page.tsx": PAGE,
        "src/planted/facts.ts":
          "export function asked(): number {\n  return 1;\n}\nexport function onlyTested(): number {\n  return 2;\n}\n",
        "src/planted/facts.test.ts": 'import { onlyTested } from "./facts";\nit("t", () => { onlyTested(); });\n',
      },
      (root) => unaskedFacts(root),
    );
    expect(unasked).toEqual(["src/planted/facts.ts::onlyTested"]);
  });
});

describe("W340 the register against the tree, in three directions", () => {
  it("reports a fact the product computes that nothing declares", () => {
    const arriving = [...UNASKED, "src/planted/new.ts::somethingNobodyReads"];
    expect(unaskedDefects(ROOT, UNASKED_AT_W340, arriving)).toEqual([
      {
        id: "src/planted/new.ts::somethingNobodyReads",
        what: "is a fact the product computes and no surface asks for",
      },
    ]);
  });

  it("reports a declaration for a fact something reads now, which is the other direction", () => {
    const wired = UNASKED.filter((id) => id !== "src/spine/spine.ts::anchorOf");
    expect(unaskedDefects(ROOT, UNASKED_AT_W340, wired)).toEqual([
      { id: "src/spine/spine.ts::anchorOf", what: "is declared unasked and something reads it now" },
    ]);
  });

  it("reports a row waiting on a gate the plan does not define", () => {
    const defects = withTree({ "docs/FIVE-YEAR-PLAN.md": PLAN }, (root) =>
      unaskedDefects(
        root,
        [{ id: "src/planted/x.ts::y", why: { kind: "behind_a_gate", gate: "G99" } }],
        ["src/planted/x.ts::y"],
      ),
    );
    expect(defects).toEqual([
      { id: "src/planted/x.ts::y", what: "waits on G99 and the plan defines no such gate" },
    ]);
  });

  it("says nothing about a row waiting on a gate it does define, so the arm is not a blanket refusal", () => {
    const defects = withTree({ "docs/FIVE-YEAR-PLAN.md": PLAN }, (root) =>
      unaskedDefects(
        root,
        [{ id: "src/planted/x.ts::y", why: { kind: "behind_a_gate", gate: "G6" } }],
        ["src/planted/x.ts::y"],
      ),
    );
    expect(defects).toEqual([]);
  });
});

describe("W340 what the seventy-one are", () => {
  it("waits on no founder ruling at all, which is the finding", () => {
    const gatedIn = (rows: readonly UnaskedFact[]) => rows.filter((f) => f.why.kind === "behind_a_gate");
    const pretend: UnaskedFact = { id: "src/planted/x.ts::y", why: { kind: "behind_a_gate", gate: "G6" } };
    expect(gatedIn([...UNASKED_AT_W340, pretend])).toEqual([pretend]);
    expect(gatedIn(UNASKED_AT_W340)).toEqual([]);
    expect(UNASKED_AT_W340.length).toBeGreaterThan(50);
  });

  it("gives every row a sentence, and every reason a real one", () => {
    const shortIn = (rows: readonly UnaskedFact[]) =>
      rows.filter((f) => {
        const why = f.why;
        const text = why.kind === "no_surface_asks" ? why.where : why.kind === "behind_a_gate" ? why.gate : why.what;
        return text.length < 30;
      });
    const terse: UnaskedFact = { id: "src/planted/x.ts::y", why: { kind: "no_surface_asks", where: "no screen" } };
    expect(shortIn([...UNASKED_AT_W340, terse])).toEqual([terse]);
    expect(shortIn(UNASKED_AT_W340)).toEqual([]);
    expect(new Set(UNASKED_AT_W340.map((f) => f.why.kind))).toEqual(
      new Set(["no_surface_asks", "not_a_derived_fact"]),
    );
  });

  it("records each fact once, so a second reading cannot hide behind a first", () => {
    const repeated = (rows: readonly UnaskedFact[]): string[] => {
      const ids = rows.map((r) => r.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    };
    const first = UNASKED_AT_W340[0]!;
    expect(repeated([...UNASKED_AT_W340, first])).toEqual([first.id]);
    expect(repeated(UNASKED_AT_W340)).toEqual([]);
  });

  it("holds the eight refusal explainers the product can say and no page shows", () => {
    const explainers = UNASKED_AT_W340.map((f) => f.id).filter((id) => /::(explain|render)[A-Z]/.test(id));
    expect(explainers.length).toBeGreaterThanOrEqual(8);
  });
});

describe("W340 the register is subject to its own rule", () => {
  it("states what a reader count does not prove", () => {
    expect(UNASKED_BOUND.length).toBeGreaterThan(600);
    expect(UNASKED_BOUND).toContain("A READER IS AN IMPORT");
    expect(UNASKED_BOUND).toContain("judgement");
  });
});

/** Kept honest by the type: a `Fact` is an id and its readers, nothing else. */
const _shape: Fact = { id: "a::b", readers: [] };
void _shape;

// W396 verify gate: one source-derived population re-derived by LOADING the modules, the two
// readings shown disagreeing about a planted instance before they are shown agreeing about the tree.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DIVERGENCE_AT_W396,
  RUNTIME_BOUND,
  divergenceDefects,
  divergences,
  typeNames,
  type Reading,
} from "./runtime-population";
import { exportsOf } from "./cited-checks";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { copyTree } from "./planting";
import { afterAll } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const ROOT = path.resolve(__dirname, "..", "..");

/** A copy of the tree to plant into, because the probe below must survive an awaited import. */
const COPY = copyTree(ROOT, { directories: [] });
mkdirSync(path.join(COPY, "src"), { recursive: true });
afterAll(() => rmSync(COPY, { recursive: true, force: true }));

/** Both readings of one module: the tree's own source reading, and an `import()`. */
async function read(root: string, module: string): Promise<Reading> {
  const namespace = (await import(
    /* @vite-ignore */ path.join(root, module)
  )) as Record<string, unknown>;
  return {
    module,
    source: exportsOf(root, module),
    types: typeNames(readFileSync(path.join(root, module), "utf8")),
    runtime: Object.keys(namespace),
  };
}

const readings: Reading[] = [];
for (const { file } of TREE_DERIVED_REGISTERS) {
  if (file.endsWith(".test.ts")) continue;
  readings.push(await read(ROOT, file));
}

describe("W396 the two readings", () => {
  it("really are two: one walks text, the other loads the module", () => {
    // Guard against a vacuous pass: nothing below means anything if either side is empty.
    expect(readings.length).toBeGreaterThan(40);
    expect(readings.every((r) => r.runtime.length > 0)).toBe(true);
    expect(readings.some((r) => r.source.length > 0)).toBe(true);
  });

  it("excludes types by construction, because they are gone at runtime by design", () => {
    // Without this the register would hold four hundred rows that mean nothing, and the finding
    // would be buried in them. The exclusion is itself a reading of the source, which the bound says.
    expect(
      typeNames(
        "export interface A { x: number }\nexport type B = A;\nexport const c = 1;\n",
      ),
    ).toEqual(["A", "B"]);
    // A comment discussing a type is not a declaration of one. A BLOCK comment, because the match
    // is anchored to the start of a line and a `//` prefix could never have matched anyway — the
    // first version of this probe used one and left the subtraction undriven.
    expect(
      typeNames("/*\nexport type Ghost = 1;\n*/\nexport type Real = 2;\n"),
    ).toEqual(["Real"]);
    const withTypes = readings.find((r) => r.types.length > 3);
    expect(
      withTypes,
      "no module in the census exports a type, so the exclusion is untested",
    ).toBeDefined();
    for (const name of withTypes!.types)
      expect(divergences([withTypes!]).map((d) => d.name)).not.toContain(name);
  });
});

describe("W396 what the tree loads versus what the tree says", () => {
  it("agrees except where the register declares a reason", () => {
    expect(divergenceDefects(divergences(readings))).toEqual([]);
  });

  it("finds real exports the shared source scan cannot see, and they are not one or two", () => {
    const found = divergences(readings);
    // EVERY DIVERGENCE RUNS ONE WAY. Nothing in this census is claimed by the source reading and
    // missing at runtime; all of it is the module exporting something the scan never saw.
    expect(found.every((d) => d.side === "runtime_only")).toBe(true);
    // AND THE OTHER DIRECTION IS DRIVEN ON A HAND-BUILT READING, because the tree holds no instance
    // and the reason is structural: `exportsOf` and `typeNames` match the same two kinds, so a name
    // the first calls a type is always one the second removes, and a `function`, `const` or `class`
    // absent at runtime is not something valid TypeScript produces. The arm is defence against
    // those two patterns DRIFTING apart, which does happen, so it is kept and driven rather than
    // removed as unreachable.
    expect(
      divergences([
        { module: "m.ts", source: ["gone"], types: [], runtime: [] },
      ]),
    ).toEqual([{ module: "m.ts", name: "gone", side: "source_only" }]);
    expect(found.length).toBeGreaterThan(20);
    // THE SHARPEST INSTANCE. `unit-headers.ts` exports thirteen values and the prepared text shows
    // one of them, so W388 — which asks whether a cited test names an export of its subject — is
    // asking that question of a list with a single name in it.
    const headers = found.filter(
      (d) => d.module === "src/quality/unit-headers.ts",
    );
    expect(headers.length).toBeGreaterThan(10);
    expect(headers.map((d) => d.name)).toContain("headerUnit");
  });

  it("separates a re-export from a name the scan lost, because the remedies differ", () => {
    // A re-export is the declaration pattern doing what it says: `export { x } from "./y"` declares
    // nothing, and widening the pattern is a choice somebody makes. A name lost to the scan is a
    // defect in a reading sixty registers share, and it is fixed once for all of them.
    const kinds = new Map(
      DIVERGENCE_AT_W396.map((d) => [`${d.module}::${d.name}`, d.cause.kind]),
    );
    expect(
      kinds.get("src/quality/register-census.ts::TREE_DERIVED_REGISTERS"),
    ).toBe("re_exported");
    expect(kinds.get("src/quality/unit-headers.ts::headerUnit")).toBe(
      "lost_to_the_scan",
    );
  });
});

describe("W396 the readings, driven on a planted module", () => {
  it("disagrees about a planted instance, then agrees once the name is declared", async () => {
    // THE GATE'S OWN PROBE, and it uses the divergence this unit can CONTROL. A re-export declares
    // nothing, so the source pattern — which reads declarations — cannot see it while the module
    // namespace has it; the same module declaring the name directly is seen by both. The pair
    // differs in how one name arrives and in nothing else.
    //
    // NOT THE SCAN-LOSS DIVERGENCE, which is the larger finding and is measured over the real tree
    // above rather than planted: the declaration block that loses twelve names prepares correctly
    // in isolation, so there is no small module that reproduces it, and planting a probe that
    // "reproduces" it by some other route would be a probe about something else.
    //
    // TWO PATHS RATHER THAN ONE PLANTED TWICE, because a module namespace is cached by URL: the
    // second `import()` of one path returns the first body. The shared planter cannot be used
    // either — it removes what it wrote in a `finally`, which runs before an awaited import
    // resolves, so the file is gone by the time the loader looks for it.
    writeFileSync(
      path.join(COPY, "src/w396-source.ts"),
      "export const shared = 1;\n",
    );
    const seen = async (file: string, body: string) => {
      writeFileSync(path.join(COPY, file), body);
      return divergences([await read(COPY, file)]).map((d) => d.name);
    };

    // Disagreeing: the module has `shared` and the source reading sees no declaration of it.
    expect(
      await seen(
        "src/w396-reexport.ts",
        'export { shared } from "./w396-source";\nexport const own = 2;\n',
      ),
    ).toEqual(["shared"]);
    // Agreeing: the same two names, both declared where the pattern can read them.
    expect(
      await seen(
        "src/w396-declared.ts",
        "export const shared = 1;\nexport const own = 2;\n",
      ),
    ).toEqual([]);
  });

  it("reports a divergence nothing classifies, and a declaration the readings agree about", () => {
    const found = [
      { module: "src/x.ts", name: "gone", side: "runtime_only" as const },
    ];
    expect(divergenceDefects(found, [])).toEqual([
      {
        site: "src/x.ts::gone",
        what: "is runtime_only and nothing says why the two readings differ",
      },
    ]);
    expect(
      divergenceDefects(
        [],
        [
          {
            module: "src/x.ts",
            name: "gone",
            cause: { kind: "re_exported", from: "./y" },
          },
        ],
      ),
    ).toEqual([
      {
        site: "src/x.ts::gone",
        what: "is declared here and the two readings agree about it",
      },
    ]);
  });

  it("reports a scan excuse that does not say what the scan lost", () => {
    const found = [
      { module: "src/x.ts", name: "gone", side: "runtime_only" as const },
    ];
    expect(
      divergenceDefects(found, [
        {
          module: "src/x.ts",
          name: "gone",
          cause: { kind: "lost_to_the_scan", why: "the scan" },
        },
      ]),
    ).toEqual([
      {
        site: "src/x.ts::gone",
        what: "is put down to the scan without saying what the scan lost",
      },
    ]);
  });
});

describe("W396 the bound", () => {
  it("says the reading that would report a cycle is the one that cannot run on it", () => {
    expect(RUNTIME_BOUND).toContain("import time");
    expect(RUNTIME_BOUND).toContain("W381");
  });
});

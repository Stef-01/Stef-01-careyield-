// W355 verify gate: "every exported function with a defaulted register or range parameter
// enumerated, each either argued safe or reported; a planted call omitting the argument must be
// distinguishable from one supplying it."
//
// THE LIVE ASSERTION IS ONE LINE AND IT IS EMPTY, which is the state this register has to be able
// to tell from a register that never worked. So the finding arm is driven on a planted tree where a
// defaulted register really is unsupplied, the "supplied with the default itself" case is driven
// separately because it is the one call shape that proves least, and the population is shown to be
// a proper subset of the tree's defaults rather than all of them.

import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOUND,
  DRIVEN_AT_W355,
  type DefaultedParameter,
  type DrivenElsewhere,
  defaultDefects,
  defaultedParameters,
  drivenBy,
  id,
  siblingSuiteOf,
  suppliedAt,
  topLevelParts,
} from "./defaulted-registers";
import { withTree } from "./planting";

const ROOT = process.cwd();
const PARAMS = defaultedParameters(ROOT);

describe("W355 every defaulted register is driven, in three directions", () => {
  it("passes, over the tree as it stands", () => {
    expect(defaultDefects(ROOT)).toEqual([]);
  });

  it("enumerates the defaults that are about the TREE, and not every default there is", () => {
    expect(PARAMS.length).toBeGreaterThan(100);
    for (const param of PARAMS) {
      expect(param.module).toMatch(/^src\/.+\.ts$/);
      expect(param.position).toBeGreaterThan(1);
    }
    // A proper subset: the tree has two and a half times as many defaults as this, and the ones it
    // leaves out are policy objects and empty arrays on functions that answer about their own
    // arguments. A population that took all of them would be arguing about `= []`.
    expect(PARAMS.some((p) => p.fallback === "[]"), "an empty-array default is in the population").toBe(false);
  });

  it("reports a defaulted register that no call anywhere supplies", () => {
    // THE FINDING ARM, and the tree has nothing in it — so it is driven on a tree that does.
    const found = withTree(
      {
        "src/planted/thing.ts":
          "export const THINGS = [1];\n" +
          "export function thingDefects(root: string, declared: number[] = THINGS): number[] {\n" +
          "  void root;\n  return declared;\n}\n",
      },
      (root) => defaultDefects(root, [], defaultedParameters(root)),
    );
    expect(found).toEqual([
      {
        parameter: "src/planted/thing.ts::thingDefects::2",
        what: "defaults a register and no call anywhere supplies another",
      },
    ]);
  });

  it("is not satisfied by a call that hands the default back, which proves least of all", () => {
    const source =
      "export const THINGS = [1];\n" +
      "export function thingDefects(root: string, declared: number[] = THINGS): number[] {\n" +
      "  void root;\n  return declared;\n}\n";
    const echoed = withTree(
      {
        "src/planted/thing.ts": source,
        "src/planted/thing.test.ts": 'it("t", () => { thingDefects(ROOT, THINGS); });\n',
      },
      (root) => defaultDefects(root, [], defaultedParameters(root)).map((d) => d.what),
    );
    expect(echoed, "passing the default back was read as driving the parameter").toEqual([
      "defaults a register and no call anywhere supplies another",
    ]);

    const real = withTree(
      {
        "src/planted/thing.ts": source,
        "src/planted/thing.test.ts": 'it("t", () => { thingDefects(ROOT, [2]); });\n',
      },
      (root) => defaultDefects(root, [], defaultedParameters(root)),
    );
    expect(real, "a call handing it a different value did not count").toEqual([]);
  });

  it("reports a parameter driven only from elsewhere that nothing records", () => {
    const found = withTree(
      {
        "src/planted/thing.ts":
          "export const THINGS = [1];\n" +
          "export function thingDefects(root: string, declared: number[] = THINGS): number[] {\n" +
          "  void root;\n  return declared;\n}\n",
        "src/planted/other.ts": "export const other = thingDefects(ROOT, [2]);\n",
      },
      (root) => defaultDefects(root, [], defaultedParameters(root)),
    );
    expect(found).toEqual([
      {
        parameter: "src/planted/thing.ts::thingDefects::2",
        what: "is driven only from outside its own suite and nothing records where",
      },
    ]);
  });

  it("reports a record whose files the tree no longer agrees with, and one for a parameter that has gone", () => {
    const first = DRIVEN_AT_W355[0]!;
    const wrong: DrivenElsewhere[] = [{ parameter: first.parameter, drivenBy: ["src/nowhere.ts"] }];
    const drifted = defaultDefects(ROOT, wrong, PARAMS).filter((d) => d.parameter === first.parameter);
    expect(drifted).toHaveLength(1);
    expect(drifted[0]!.what).toContain("is recorded as driven by src/nowhere.ts");

    const gone: DrivenElsewhere[] = [{ parameter: "src/gone.ts::gone::2", drivenBy: ["src/x.ts"] }];
    expect(defaultDefects(ROOT, gone, [])).toEqual([
      {
        parameter: "src/gone.ts::gone::2",
        what: "is recorded here and the tree holds no such defaulted parameter",
      },
    ]);
  });

  it("reports a record for a parameter its own suite has since started driving", () => {
    const mine: DefaultedParameter[] = [
      { module: "src/quality/defaulted-registers.ts", fn: "defaultDefects", position: 2, fallback: "DRIVEN_AT_W355" },
    ];
    const stale: DrivenElsewhere[] = [
      { parameter: "src/quality/defaulted-registers.ts::defaultDefects::2", drivenBy: ["src/x.ts"] },
    ];
    expect(defaultDefects(ROOT, stale, mine)).toEqual([
      {
        parameter: "src/quality/defaulted-registers.ts::defaultDefects::2",
        what: "is recorded as driven elsewhere and its own suite drives it",
      },
    ]);
  });
});

describe("W355 the reading of a signature and of a call", () => {
  it("splits on the commas a call has, not the ones a type annotation has", () => {
    expect(topLevelParts("root: string, folds: { a: string; b: string }[] = FOLDS")).toHaveLength(2);
    expect(topLevelParts("root, readFileSync(path.join(root, DOSSIER), 'utf8'), FOLDS")).toHaveLength(3);
  });

  it("does not read a method call as the function it shares a name with", () => {
    expect(suppliedAt("const x = rows.map(a, b);\n", "map", 2), "a method call was read as the export").toEqual(
      [],
    );
    expect(suppliedAt("const x = map(a, b);\n", "map", 2)).toEqual(["b"]);
  });

  it("names the suite a module's own drive would live in", () => {
    expect(siblingSuiteOf("src/quality/pins.ts")).toBe("src/quality/pins.test.ts");
  });
});

describe("W355 the record of where, re-derived rather than believed", () => {
  it("agrees with the tree for every row it holds", () => {
    for (const row of DRIVEN_AT_W355) {
      const [module, fn, position] = row.parameter.split("::");
      const param = PARAMS.find((p) => id(p) === row.parameter);
      expect(param, `${row.parameter} is recorded and the tree has no such parameter`).toBeDefined();
      expect(module).toMatch(/^src\//);
      expect(fn).toMatch(/^\w+$/);
      expect(Number(position)).toBeGreaterThan(1);
      expect(row.drivenBy.length, `${row.parameter} is recorded as driven by nothing`).toBeGreaterThan(0);
      expect(row.drivenBy, `${row.parameter} names its own suite and is recorded as driven elsewhere`).not.toContain(
        siblingSuiteOf(param!.module),
      );
      expect(drivenBy(ROOT, param!)).toEqual([...row.drivenBy]);
    }
  });

  it("is a minority of the population, so the eighty-odd others really are driven at home", () => {
    // The property worth having: most defaulted registers ARE handed a value by the suite that owns
    // them. A register where the exception list was most of the population would be describing a
    // convention nobody follows.
    expect(DRIVEN_AT_W355.length).toBeLessThan(PARAMS.length / 2);
    expect(DRIVEN_AT_W355.length).toBeGreaterThan(0);
  });

  it("states what a green register does not cover", () => {
    expect(DEFAULT_BOUND.length).toBeGreaterThan(600);
    expect(DEFAULT_BOUND).toContain("IT READS CALL SITES, NOT BEHAVIOUR");
    expect(DEFAULT_BOUND).toContain("BEING DRIVEN FROM ANOTHER MODULE IS NOT THE SAME");
  });
});

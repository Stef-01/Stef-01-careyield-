// W342: the register is driven on constructed trees, and both of its arms are shown firing.
//
// The live tree is clean on both — every declared name resolves and every unit field is typed —
// which is exactly the state where a register proves nothing unless it can be made to speak. Each
// arm below is handed an input a healthy tree cannot produce.

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PLANTED_NAMES,
  TYPED_NAME_BOUND,
  asUnitId,
  isUnitId,
  kindOf,
  looseTwins,
  nameDefects,
  nameSites,
  resolveName,
  unitFieldTypings,
  type FieldTyping,
} from "./typed-names";
import { withTree } from "./planting";

const ROOT = path.resolve(__dirname, "../..");

/** A register module, written as this tree writes one: data at the top level. */
const register = (body: string) => `// W342: a planted register.\nexport const ROWS = [\n${body}\n];\n`;

describe("W342 the live tree", () => {
  it("resolves every name its registers declare, and every fabrication is still a fabrication", () => {
    expect(nameDefects(ROOT)).toEqual([]);
  });

  it("reads a population worth resolving", () => {
    // W279's rule: silence is only evidence when the detector was running. The count is a floor,
    // not a pin — it moves with ordinary work and a floor still fails if the scan stops finding.
    const sites = nameSites(ROOT);
    expect(sites.length).toBeGreaterThan(500);
    expect(new Set(sites.map((s) => s.kind))).toEqual(new Set(["unit", "module", "export"]));
  });

  it("types every unit-naming field the way the tree types its twin", () => {
    const sites = nameSites(ROOT);
    expect(looseTwins(unitFieldTypings(ROOT, sites), sites)).toEqual([]);
  });

  it("argues every fabrication it excuses", () => {
    for (const row of PLANTED_NAMES) {
      expect(row.why.length, `${row.value} is excused without a reason`).toBeGreaterThan(80);
    }
  });
});

describe("W342 what a name is", () => {
  it("reads a unit, a module and an export, and nothing else", () => {
    expect(kindOf("W318")).toBe("unit");
    expect(kindOf("src/quality/bounds.ts")).toBe("module");
    expect(kindOf("src/quality/close-gate.ts::weldedLedgerTests")).toBe("export");
    expect(kindOf("a sentence about W318 and src/quality/bounds.ts")).toBeNull();
    expect(kindOf("SUP-1")).toBeNull();
  });

  it("keeps the three causes of a broken name apart", () => {
    expect(resolveName(ROOT, "unit", "W99999")).toContain("the ledger holds no such row");
    expect(resolveName(ROOT, "module", "src/nowhere.ts")).toContain("names a file that does not exist");
    expect(resolveName(ROOT, "export", "src/quality/bounds.ts::noSuchExport")).toContain(
      "does not contain that export",
    );
    expect(resolveName(ROOT, "unit", "W318")).toBe(true);
  });

  it("narrows a parsed string, or throws naming the value", () => {
    expect(isUnitId("W318")).toBe(true);
    expect(isUnitId("SUP-1")).toBe(false);
    expect(asUnitId("W318")).toBe("W318");
    expect(() => asUnitId("SUP-1")).toThrow("SUP-1: not a unit id");
  });
});

describe("W342 a planted name is reported", () => {
  it("reports a register naming a module the tree does not hold", () => {
    const defects = withTree(
      { "src/planted/w342.ts": register(`  { module: "src/planted/absent-forever.ts" },`) },
      (root) => nameDefects(root, undefined, []),
    );
    expect(defects.map((d) => `${d.kind} ${d.value}`)).toEqual([
      "unresolved src/planted/absent-forever.ts",
    ]);
  });

  it("reports a register naming a unit no ledger row holds", () => {
    const defects = withTree({ "src/planted/w342.ts": register(`  { unit: "W99999" },`) }, (root) => nameDefects(root, undefined, []));
    expect(defects.map((d) => `${d.kind} ${d.value}`)).toEqual(["unresolved W99999"]);
  });

  it("says nothing about a name that resolves, which is the half that makes the other half mean something", () => {
    const defects = withTree(
      {
        "src/planted/real.ts": "export const resolveName = 1;\n",
        "src/planted/w342.ts": register(
          `  { module: "src/planted/real.ts", check: "src/planted/real.ts::resolveName" },`,
        ),
      },
      (root) => nameDefects(root, undefined, []),
    );
    expect(defects).toEqual([]);
  });

  it("refuses a name that is only MENTIONED, in a comment or inside a sentence", () => {
    const defects = withTree(
      {
        "src/planted/w342.ts":
          "// W342: src/planted/absent-forever.ts is named here and nowhere else.\n" +
          `export const WHY = "a note about W99999 and src/planted/absent-forever.ts, in prose";\n`,
      },
      (root) => nameDefects(root, undefined, []),
    );
    expect(defects).toEqual([]);
  });

  it("refuses a name handed to a CALL, which is how every probe in this tree fabricates one", () => {
    // THE NARROWING, DRIVEN BOTH WAYS. The same value, in data and in an argument: the register
    // must report the first and must not report the second, or the narrowing is either useless or
    // a hole. Nine real fabrications in this tree depend on the second half.
    const inData = withTree(
      { "src/planted/w342.ts": register(`  { module: "src/planted/absent-forever.ts" },`) },
      (root) => nameDefects(root, undefined, []),
    );
    const inACall = withTree(
      {
        "src/planted/w342.ts":
          "export const probe = () => check({ module: \"src/planted/absent-forever.ts\" });\n" +
          "function check(x: { module: string }) { return x; }\n",
      },
      (root) => nameDefects(root, undefined, []),
    );
    expect(inData.map((d) => d.value)).toEqual(["src/planted/absent-forever.ts"]);
    expect(inACall).toEqual([]);
  });
});

describe("W342 the fabrications are checked in both directions", () => {
  it("reports a fabrication the tree has started holding for real", () => {
    const defects = withTree(
      {
        "src/planted/real.ts": "export const here = 1;\n",
        "src/planted/w342.ts": register(`  { module: "src/planted/real.ts" },`),
      },
      (root) => nameDefects(root, undefined, [{ value: "src/planted/real.ts", why: "x".repeat(90) }]),
    );
    expect(defects.map((d) => `${d.kind} ${d.value}`)).toEqual(["planted_but_real src/planted/real.ts"]);
  });

  it("reports a fabrication no register carries any more", () => {
    const defects = withTree(
      {
        "src/planted/real.ts": "export const here = 1;\n",
        "src/planted/w342.ts": register(`  { module: "src/planted/real.ts" },`),
      },
      (root) => nameDefects(root, undefined, [{ value: "W4242", why: "x".repeat(90) }]),
    );
    expect(defects.map((d) => `${d.kind} ${d.value}`)).toEqual(["planted_but_absent W4242"]);
  });
});

describe("W342 a field typed loosely beside a twin typed strictly", () => {
  const sites = [
    { module: "src/planted/loose.ts", field: "unit", kind: "unit" as const, value: "W318" },
    { module: "src/planted/strict.ts", field: "unit", kind: "unit" as const, value: "W319" },
  ];

  it("reports the loose one and names where the strict twin lives", () => {
    const typings: FieldTyping[] = [
      { module: "src/planted/strict.ts", field: "unit", type: "UnitId" },
      { module: "src/planted/loose.ts", field: "unit", type: "string" },
    ];
    expect(looseTwins(typings, sites)).toEqual([
      { module: "src/planted/loose.ts", field: "unit", twin: "src/planted/strict.ts" },
    ]);
  });

  it("says nothing when the tree types the field loosely everywhere, because then there is no twin", () => {
    // W329's finding is a DISAGREEMENT, not a preference. A field nobody has ever typed strictly is
    // a decision somebody has to make; a field typed both ways is a fix somebody has already found.
    const typings: FieldTyping[] = [
      { module: "src/planted/strict.ts", field: "unit", type: "string" },
      { module: "src/planted/loose.ts", field: "unit", type: "string" },
    ];
    expect(looseTwins(typings, sites)).toEqual([]);
  });

  it("says nothing about a field whose own data holds no unit id", () => {
    // The scoping arm, and the first draft did not have it: `by` is a hardening disposition's unit
    // in one register and a clinician in another, and a field name is not a kind.
    const typings: FieldTyping[] = [
      { module: "src/planted/strict.ts", field: "unit", type: "UnitId" },
      { module: "src/planted/elsewhere.ts", field: "unit", type: "string" },
    ];
    expect(looseTwins(typings, sites)).toEqual([]);
  });

  it("reads the tree's own declarations, and finds the type it was given", () => {
    const typings = unitFieldTypings(ROOT);
    const strict = typings.filter((t) => t.type === "UnitId");
    expect(strict.length, "no unit field is typed strictly, so the comparison is over nothing").toBeGreaterThan(4);
  });

  it("reads UNIT fields, and not every field a name site happens to carry", () => {
    // W362'S SURVIVOR. `nameSites` classifies each site `unit`, `module` or `export`, and the
    // filter that keeps the unit ones flipped to its inverse without a test noticing: the wider set
    // is a SUPERSET — it shares `by`, `id` and `value` with the unit fields — so `looseTwins` still
    // returned nothing and the strict count still cleared its floor. The wrong answer was bigger
    // than the right one and every assertion over it passed, which is W353's shape exactly.
    //
    // What separates them is a field only the OTHER kinds carry. `module` is one: no register puts
    // a `W`-number behind it, and the inverted filter reports its declarations by the hundred.
    const sites = nameSites(ROOT);
    const unitFields = new Set(sites.filter((s) => s.kind === "unit").map((s) => s.field));
    expect(unitFields, "the tree stopped carrying unit ids in a field named `unit`").toContain("unit");
    expect(unitFields, "`module` now carries unit ids, so this control is no longer a control").not.toContain(
      "module",
    );
    expect(
      unitFieldTypings(ROOT, sites).map((t) => t.field),
      "a field the tree never shows carrying a unit id was typed as one",
    ).not.toContain("module");
  });
});

describe("W342 the bound", () => {
  it("states the two things the population misses", () => {
    expect(TYPED_NAME_BOUND).toContain("template literal");
    expect(TYPED_NAME_BOUND).toContain("argument");
    expect(TYPED_NAME_BOUND.length).toBeGreaterThan(400);
  });

  it("is true: a name assembled from parts is invisible to it", () => {
    // The bound's own non-vacuity. A sentence saying "this cannot see X" that nobody has watched
    // fail to see X is W339's finding, and this one is watched.
    const defects = withTree(
      {
        "src/planted/w342.ts":
          "const dir = \"src/planted\";\n" +
          "export const ROWS = [{ module: `${dir}/absent-forever.ts` }];\n",
      },
      (root) => nameDefects(root, undefined, []),
    );
    expect(defects).toEqual([]);
  });
});

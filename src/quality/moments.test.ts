// W378 verify gate: "every census member carries the moment it answers at — file load, per test,
// run setup, run teardown, or the gate's own hook — derived from the harness rather than declared;
// a member whose moment nothing can name fails."
//
// DERIVED FROM THE HARNESS is the clause that shapes this file. The moment is read from where a
// module's exports are CALLED, never from the module's own description of itself, so the arms below
// plant a caller rather than a subject: the same subject module, asked from inside an `it(...)` in
// one tree and from the top of a file in another, must come back with different moments.
//
// The planted sources live in `scan-fixtures.fixtures`. A caller written as a string literal here
// would be read by this register's own scan of `testModules`, which is W295's rule and the trap
// W375 and W376 each hit once.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  GATE_SCRIPTS,
  HARNESS,
  MOMENTS_AT_W378,
  MOMENT_BOUND,
  ORDINARY_SHAPES,
  suiteShaped,
  type UnusualMoment,
  blankImports,
  exportsOf,
  momentDefects,
  momentsAt,
  momentsOf,
} from "./moments";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { withTree } from "./planting";
import { fixtureText, prepareForScan } from "./scan-text";

const ROOT = process.cwd();
const CENSUS = TREE_DERIVED_REGISTERS.map((e) => ({ file: e.file }));
const only = (file: string, rows: readonly UnusualMoment[]) =>
  momentDefects(ROOT, CENSUS, rows).filter((d) => d.file === file);
/** The same subject module, with one caller planted at the moment under test. */
const asked = (callerText: string, at: string) =>
  withTree({ "src/planted/subject.ts": fixtureText("moment-subject-module"), [at]: callerText }, (tree) =>
    momentsAt(momentsOf(tree, "src/planted/subject.ts")),
  );
const PER_TEST_CALLER = fixtureText("moment-caller-per-test");
const FILE_LOAD_CALLER = fixtureText("moment-caller-file-load");

describe("W378 every census member answers at a moment, and the moment is derived", () => {
  it("passes, over the census as it stands", () => {
    expect(momentDefects(ROOT, CENSUS)).toEqual([]);
  });

  it("names a moment for every member, which is the clause the gate turns on", () => {
    expect(CENSUS.length).toBeGreaterThan(50);
    const silentIn = (files: readonly { file: string }[]) =>
      files.filter((c) => momentsOf(ROOT, c.file).length === 0).map((c) => c.file);
    // The same reader, on a module the tree does not hold: an empty answer below is a finding
    // rather than a reader that never speaks.
    expect(silentIn([{ file: "src/quality/no-such-module.ts" }])).toEqual(["src/quality/no-such-module.ts"]);
    expect(silentIn(CENSUS), "a census member walks the tree and nothing anywhere runs it").toEqual([]);
    // Evidence that the emptiness above is a finding: a module nothing calls really does come back
    // with no moment, so the green result is about this tree rather than about the reader.
    expect(asked(PER_TEST_CALLER, "src/planted/unrelated.ts")).toEqual([]);
  });

  it("reports a census member nothing anywhere runs, which is the arm the gate turns on", () => {
    // The subject is planted alone: no test file, no harness hook and no gate script reaches it, so
    // it walks, compares, and is never asked. That is invisible in a green run and is what this
    // quarter is about.
    const reported = withTree({ "src/planted/subject.ts": fixtureText("moment-subject-module") }, (tree) =>
      momentDefects(tree, [{ file: "src/planted/subject.ts" }], []),
    );
    expect(reported).toEqual([
      {
        file: "src/planted/subject.ts",
        what: "walks the tree and nothing anywhere runs it, so it answers at no moment",
      },
    ]);
  });

  it("reads a call inside a test as one moment and a call at the top of a file as another", () => {
    // THE UNIT. The subject module is byte-identical in both trees; only the caller moves.
    expect(asked(PER_TEST_CALLER, "src/planted/asks.test.ts")).toEqual(["per_test"]);
    expect(asked(FILE_LOAD_CALLER, "src/planted/asks.test.ts")).toEqual(["file_load"]);
    // The ordinary pair is both of those in one file, which is seventy-seven of the eighty-two and
    // is shown against the tree rather than a plant.
    expect(suiteShaped(momentsAt(momentsOf(ROOT, "src/quality/pins.ts")))).toBe(true);
  });

  it("reports a member answering outside its suite that nothing argues", () => {
    expect(only("src/compliance/surfaces.ts", [])).toEqual([
      {
        file: "src/compliance/surfaces.ts",
        what: "answers at file_load+gate_stage+per_test, which no suite gives, and nothing says why",
      },
    ]);
  });

  it("reports a row whose moments the tree has moved past", () => {
    const stale = MOMENTS_AT_W378.map((r) =>
      r.file === "src/compliance/surfaces.ts" ? { ...r, moments: ["per_test" as const] } : r,
    );
    expect(only("src/compliance/surfaces.ts", stale)).toEqual([
      {
        file: "src/compliance/surfaces.ts",
        what: "is recorded as answering at per_test and answers at file_load+gate_stage+per_test",
      },
    ]);
  });

  it("reports a row for a member that answers inside its suite after all", () => {
    const extra: UnusualMoment[] = [
      ...MOMENTS_AT_W378,
      { file: "src/quality/pins.ts", moments: ["per_test"], why: "y".repeat(130) },
    ];
    expect(only("src/quality/pins.ts", extra)).toEqual([
      { file: "src/quality/pins.ts", what: "is recorded as answering outside its suite and does not" },
    ]);
  });

  it("reports a row for something the census does not hold", () => {
    const orphan: UnusualMoment[] = [{ file: "src/gone.ts", moments: ["per_test"], why: "y".repeat(130) }];
    expect(only("src/gone.ts", orphan)).toEqual([
      { file: "src/gone.ts", what: "is recorded here and the census does not hold it" },
    ]);
  });

  it("reports a member answering outside its suite that is recorded without an argument", () => {
    const bare = MOMENTS_AT_W378.map((r) =>
      r.file === "src/compliance/surfaces.ts" ? { ...r, why: "the gate runs it" } : r,
    );
    expect(only("src/compliance/surfaces.ts", bare)).toEqual([
      {
        file: "src/compliance/surfaces.ts",
        what: "answers outside its suite and is recorded without an argument",
      },
    ]);
  });
});

describe("W378 the scan reads a call site and not a name", () => {
  it("does not read an import as a call, because it says what a file may reach and not when", () => {
    // THE SKIP EARNS ITS PLACE ON THE SHOUTED SPELLING. A function needs its bracket, so an import
    // naming one never matched; a register constant is taken bare, and `self-reference.test.ts`
    // imports `SELF_SCANNING` at its top. Counting that line made every importer look as though it
    // answered at file load — which is the moment the import happens and not the moment the check
    // does.
    const source = readFileSync(path.join(ROOT, "src/quality/self-reference.test.ts"), "utf8");
    expect(source, "the suite stopped importing the register this checks").toContain("SELF_SCANNING");
    const sites = momentsOf(ROOT, "src/quality/self-reference.ts").filter(
      (site) => site.file === "src/quality/self-reference.test.ts" && site.via === "SELF_SCANNING",
    );
    expect(sites.length, "nothing in that suite reaches it, so this checks nothing").toBeGreaterThan(0);
    // The import is written across several lines, so the name sits alone on one of them — which is
    // exactly the shape a per-line skip walked past.
    expect(source, "the import is no longer the multi-line shape this checks").toMatch(/import \{[^}]*\n\s*SELF_SCANNING,/);
    expect(sites.every((site) => site.moment === "per_test" || site.moment === "file_load")).toBe(true);
    // The count is what the skip changes: with the import counted there is one more site than the
    // suite has real uses of the name.
    // Counted against the text the scan actually reads: `blankImports` removes the whole import
    // STATEMENT, so the name on its own line inside one is gone and every remaining occurrence is a
    // use. A per-line filter cannot express that, which is the bug this replaced.
    const uses = blankImports(prepareForScan(source)).split("\n").filter((l) => /\bSELF_SCANNING\b/.test(l)).length;
    expect(uses, "the register is no longer used in that suite").toBeGreaterThan(3);
    expect(sites.length, "an import is being counted as a use again").toBe(uses);
  });

  it("finds the harness's own two moments, which no suite can give", () => {
    // `repository-clean.ts` is NOT a census member — W328 argued it is harness plumbing rather than
    // a tree-walking register — so the census can never reach `run_setup` or `run_teardown`. The
    // reader can, and that is the difference between the five moments the type names and the three
    // this quarter's census can show.
    const at = momentsAt(momentsOf(ROOT, "src/quality/repository-clean.ts").filter((s) => s.file === HARNESS));
    expect(at).toEqual(["run_setup", "run_teardown"]);
    expect(CENSUS.map((c) => c.file)).not.toContain("src/quality/repository-clean.ts");
  });

  it("requires a bracket for a function and takes a register constant bare", () => {
    // `defaulted-registers.ts` exports `id`, which matched every `id` in every e2e spec until the
    // two spellings were separated. A function is called; a SCREAMING register is read.
    expect(exportsOf(ROOT, "src/quality/defaulted-registers.ts")).toContain("id");
    const gateFor = (module: string) => momentsOf(ROOT, module).filter((s) => s.moment === "gate_stage");
    // The same reader on the one member that really does answer at a gate stage, so the empty
    // answer below is about `id` rather than about the filter.
    expect(gateFor("src/compliance/surfaces.ts").length).toBeGreaterThan(0);
    expect(gateFor("src/quality/defaulted-registers.ts"), "a bare lowercase export is matched again").toEqual([]);
    // And a register constant IS found without one, which is what made thirty-one members visible.
    const shouted = momentsOf(ROOT, "src/quality/self-reference.ts");
    expect(shouted.map((s) => s.via)).toContain("SELF_SCANNING");
  });

  it("knows the gate stages it reads, and they are outside vitest", () => {
    expect(GATE_SCRIPTS.length).toBeGreaterThan(0);
    for (const script of GATE_SCRIPTS) {
      expect(readFileSync(path.join(ROOT, script), "utf8").length, `${script} is named and absent`).toBeGreaterThan(0);
    }
  });
});

describe("W378 the register says what it is and what it is not", () => {
  it("holds what a suite cannot give, and both suite shapes are really used", () => {
    // The two ordinary shapes are not a list somebody chose: each is used by a large part of the
    // census, and a register naming a shape nothing takes would describe a tree that is not this one.
    const shapes = CENSUS.map((c) => momentsAt(momentsOf(ROOT, c.file)));
    for (const shape of ORDINARY_SHAPES) {
      const taking = shapes.filter((at) => at.join("+") === [...shape].sort().join("+")).length;
      expect(taking, `no census member answers at ${shape.join("+")}`).toBeGreaterThan(10);
    }
    expect(MOMENTS_AT_W378.length, "nothing answers outside its suite, so the arm is untested").toBeGreaterThan(0);
    expect(MOMENTS_AT_W378.length, "the exception has become the rule").toBeLessThan(CENSUS.length / 4);
    // NOT `toBe(MOMENTS_AT_W378.length)`, which is W317's shape: empty the register and both sides
    // go to zero together. The population is named instead.
    expect(shapes.filter((at) => !suiteShaped(at)).length).toBeGreaterThan(0);
    expect(
      CENSUS.filter((c) => !suiteShaped(momentsAt(momentsOf(ROOT, c.file)))).map((c) => c.file),
    ).toEqual(["src/compliance/surfaces.ts"]);
  });

  it("states what a green run does not cover", () => {
    expect(MOMENT_BOUND.length).toBeGreaterThan(600);
    expect(MOMENT_BOUND).toContain("IT READS WHERE AN EXPORT IS CALLED, NOT WHICH EXPORT IS THE CHECK");
    expect(MOMENT_BOUND).toContain("`file_load` IS THE COARSEST OF THE FIVE");
  });
});

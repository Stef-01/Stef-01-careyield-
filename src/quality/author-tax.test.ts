// W313 verify gate: "the tax measured as the files an AUTHOR must edit to declare a module rather
// than the registers that report it undeclared, both instruments run over the same planted shapes,
// and the disagreement between them recorded as the reason W308's gate read the wrong way."
//
// W308 HANDED THIS UNIT ITS OWN INSTRUMENT AS A DEFECT. Its note says the gate was the wrong
// instrument rather than the work wrong, and that naming a better one belongs to the quarter close;
// W312 named it and this builds it. What makes it a unit rather than an arithmetic change is that
// the better instrument had to be shown DISAGREEING with the old one, over the same population, in
// both directions — because an instrument that only ever reads lower is a discount, not a measure.

import { rmSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import {
  AUTHOR_TAX_AT_W313,
  MOVED_SINCE_W308,
  type ModuleShape,
  taxDiff,
  DECLARATION_HOMES,
  INSTRUMENT_NOTES,
  MOVED_SINCE_W313,
  SHAPES,
  SHAPE_BODIES,
  TAX_AT_W308,
  bothInstruments,
  demandingRegisters,
  editSites,
  homeDiff,
} from "./declaration-tax";
import { copyTree, withPlantedIn, withTree } from "./planting";

const ROOT = process.cwd();
// One copy for the whole file: every measurement below plants into it and removes what it planted.
const COPY = copyTree(ROOT);

// W331: the contract `copyTree` states — the caller removes it, and `afterAll` is the usual place.
// This file did not, and neither did three others; the build box was holding hundreds of copies.
// `copyTree` now sweeps at process exit as a backstop, and the backstop is not the plan.
afterAll(() => rmSync(COPY, { recursive: true, force: true }));
const PLANTED = "src/planted/w313-probe.ts";
const withShape = <T,>(shape: (typeof SHAPES)[number], probe: () => T): T =>
  withPlantedIn(COPY, { [PLANTED]: SHAPE_BODIES[shape] }, probe);

describe("W313 the instrument measures files, and the register that costs none", () => {
  it("knows a home for every register that levies a declaration, and none it does not", () => {
    expect(homeDiff(COPY)).toEqual({ unhomed: [], stale: [], missing: [] });
  });

  it("counts the files an author opens, not the registers that report", () => {
    // The unit, at its smallest. `copy-y6` reports once and costs two files; if the instrument were
    // counting registers under another name, these would be equal.
    const files = withShape("plain", () => editSites(COPY, PLANTED));
    const reports = withShape("plain", () => demandingRegisters(COPY, PLANTED));
    expect(reports).toEqual(["src/compliance/copy-y6.ts"]);
    expect(files).toEqual(["src/compliance/cdss-boundary.test.ts", "src/compliance/cdss-boundary.ts"]);
  });

  it("charges one edit for the registers that share a file", () => {
    // THE CONSOLIDATION, MEASURED. The census, the branches and the manifest's own row all report a
    // full register and all live in `manifest.ts` — three reports, one edit. This is the property
    // W300's instrument cannot express and the reason W308 read a successful quarter as a failure.
    const reports = withShape("a_full_register", () => demandingRegisters(COPY, PLANTED));
    const files = withShape("a_full_register", () => editSites(COPY, PLANTED));
    const shared = ["src/quality/register-census.ts", "src/quality/refusal-branches.ts", "src/quality/manifest.ts"];
    for (const register of shared) expect(reports, `${register} does not report`).toContain(register);
    expect(files.filter((f) => f === "src/quality/manifest.ts")).toHaveLength(1);
    expect(files.length).toBeLessThan(reports.length);
  });

  it("charges nothing for a register that is satisfied by writing the module itself", () => {
    // `unit-headers` reports a module with no `// W<n>` header and there is no register to add a
    // line to — the remedy is the module's own first line. A file instrument must report zero for
    // it, and a register instrument must still report it, which is the disagreement at its purest.
    const home = DECLARATION_HOMES.find((h) => h.register === "src/quality/unit-headers.ts")!;
    expect(home.files).toEqual([]);
    expect(home.why.length).toBeGreaterThan(120);
  });
});

describe("W313 both instruments, over the same planted shapes", () => {
  it("runs them over one population and matches both frozen records", () => {
    // THE GATE. Same copy, same plants, same run — and each number checked against the record that
    // owns it. Neither figure is stored twice: `TAX_AT_W308` owns the register count and
    // `AUTHOR_TAX_AT_W313` owns the file count.
    // W317 ROUTED BOTH THROUGH THE MOVEMENT-AWARE DIFF. W313 wrote `reporting` as a bare equality
    // against `TAX_AT_W308` while giving `editing` a movement path — an asymmetry that made one of
    // the two frozen records unmovable, which is Q24-CR-9's shape in the unit that replaced Q24's
    // instrument. Both go through `taxDiff` now, so declaring a movement works for either.
    const rows = bothInstruments(COPY);
    const reporting = Object.fromEntries(rows.map((r) => [r.shape, r.reporting])) as Record<ModuleShape, number>;
    const editing = Object.fromEntries(rows.map((r) => [r.shape, r.editing])) as Record<ModuleShape, number>;
    expect(taxDiff(reporting, TAX_AT_W308, MOVED_SINCE_W308)).toEqual({ unaccounted: [], stale: [] });
    expect(taxDiff(editing, AUTHOR_TAX_AT_W313, MOVED_SINCE_W313)).toEqual({ unaccounted: [], stale: [] });
  });

  it("disagrees in BOTH directions, which is what makes it a measure and not a discount", () => {
    // An instrument that always reads lower than the one it replaces is a rebate somebody chose.
    // These cross: the cheapest shape costs MORE in files than in registers, and the most expensive
    // costs less. That cannot be produced by scaling and is the argument for keeping both.
    const rows = bothInstruments(COPY);
    expect(rows.some((r) => r.editing > r.reporting), "no shape costs more to edit").toBe(true);
    expect(rows.some((r) => r.editing < r.reporting), "no shape costs less to edit").toBe(true);
    expect(rows.some((r) => r.editing === r.reporting), "no shape agrees").toBe(true);
  });

  it("argues every shape, including the ones where the instruments agree", () => {
    for (const shape of SHAPES) {
      expect(INSTRUMENT_NOTES[shape], `${shape} has no argument`).toBeDefined();
      expect(INSTRUMENT_NOTES[shape].length, `${shape} is argued too thinly`).toBeGreaterThan(150);
    }
  });

  it("says plainly why W308's gate read the wrong way", () => {
    // The gate's last clause. The record has to NAME the misreading rather than quietly replace it.
    const full = INSTRUMENT_NOTES.a_full_register;
    expect(full).toMatch(/W305/);
    expect(full).toMatch(/W308 reported a quarter of consolidation as a failure/);
    expect(INSTRUMENT_NOTES.plain, "the plain shape's surprise is not recorded").toMatch(/EDITING COSTS MORE/);
  });
});

describe("W313 the file instrument is not vacuous", () => {
  it("reports nothing when nothing is planted", () => {
    // Silence proves the measurement only if the probes were running — W295's shape.
    expect(editSites(COPY, PLANTED)).toEqual([]);
    expect(withShape("a_full_register", () => editSites(COPY, PLANTED)).length).toBeGreaterThan(0);
  });

  it("reports a register with no home rather than charging zero for it", () => {
    // Driven from outside on a home register with a row removed. A missing home is indistinguishable
    // from a free register unless something says so, and "free" is the answer that flatters.
    const without = DECLARATION_HOMES.filter((h) => h.register !== "src/quality/bounds.ts");
    expect(homeDiff(COPY, without).unhomed).toContain("src/quality/bounds.ts");
  });

  it("reports a home naming a file the tree does not hold", () => {
    const bogus = [
      ...DECLARATION_HOMES,
      { register: "src/quality/bounds.ts", files: ["src/quality/gone.ts"], why: "x" },
    ];
    expect(homeDiff(COPY, bogus).missing).toEqual(["src/quality/gone.ts"]);
  });

  it("reports a home for a register the probe population does not have", () => {
    const bogus = [...DECLARATION_HOMES, { register: "src/quality/not-a-register.ts", files: [], why: "x" }];
    expect(homeDiff(COPY, bogus).stale).toEqual(["src/quality/not-a-register.ts"]);
  });

  it("counts a file once however many registers send an author to it", () => {
    // W331: THIS TEST USED TO ASSERT THAT `Set` DEDUPLICATES. It built a local set from a local
    // list and checked the set had one entry — true of every JavaScript that has ever run, and
    // `editSites`, the function whose deduplication is the unit's whole claim, was never called.
    // The claim is about the instrument, so the instrument is what is driven: two registers whose
    // declaration homes name the SAME file, both reporting a planted module, counted once.
    const shared = "src/quality/manifest.ts";
    const homes = DECLARATION_HOMES.filter((h) => h.files.includes(shared));
    expect(homes.length, "no two registers share a declaration file, so nothing is being deduped").toBeGreaterThan(1);
    const sites = withShape("a_full_register", () => editSites(COPY, PLANTED));
    expect(sites.filter((f) => f === shared), `${shared} is counted once per register that names it`).toEqual([
      shared,
    ]);
  });
});

describe("W313 what the better instrument still does not measure", () => {
  it("is honest that a file is not a unit of work either", () => {
    const home = DECLARATION_HOMES.find((h) => h.register === "src/quality/register-census.ts")!;
    expect(home.why).toMatch(/W305/);
    // A census entry is four sentences and a manifest row for a bare module is three lines, and
    // both count as one file. The instrument is better, not right, and the tree says so.
    // W331: the line here used to be `expect(withTree({...}, () => true)).toBe(true)` — the only
    // executable assertion in the test, and it asserts that `true` is `true`. What the sentence
    // above it claims is checkable: a census entry and a bare manifest row both count as one file,
    // so the two shapes cost the same by this instrument and differently by any honest reading.
    const bare = withShape("plain", () => editSites(COPY, PLANTED)).length;
    const full = withShape("a_full_register", () => editSites(COPY, PLANTED)).length;
    expect(full, "the instrument cannot tell a full register from a bare module at all").toBeGreaterThan(bare);
    expect(bare, "a bare module costs nothing, so there is no instrument here").toBeGreaterThan(0);
  });
});

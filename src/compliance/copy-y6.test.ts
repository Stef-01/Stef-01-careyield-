// W270 verify gate: "membership read from each module's own header against a Y6 constant; nothing
// carried from the Y4 register, and the both-directions census still green."
//
// "Nothing carried" is the clause with teeth. A re-derivation that reported "the header rule still
// works, all nine Y6 modules were swept in automatically" would be true and would be the failure
// W200's own gate was written against — four properties survived on their own construction and the
// fifth had quietly stopped being enforced, and no amount of re-reading told them apart. So this
// checks the half that was NOT working: the floor, which is a ceiling on the past, and which had
// no door.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  COPY_SURFACE_FLOOR,
  FLOOR_RATIONALE,
  PRE_FLOOR_COPY_SURFACES,
  Y6_FIRST_UNIT,
  YEAR_BANDS,
  copySurfaceMembers,
  coverageByBand,
  modulesWithUnits,
} from "./copy-y6";
import { ACCEPTED_COPY_FINDINGS, OPERATOR_COPY_SURFACES, Y4_FIRST_UNIT } from "./cdss-boundary";
import { Y5_FIRST_UNIT } from "./rail-y5";

const ROOT = path.resolve(__dirname, "../..");

describe("W270 the boundary is read from the tree, and the bands are contiguous", () => {
  it("parses modules and their units at all", () => {
    const modules = modulesWithUnits(ROOT);
    expect(modules.length).toBeGreaterThan(200);
    expect(modules.filter((m) => m.unit !== null).length).toBeGreaterThan(200);
  });

  it("gives Y6 a boundary that continues the years rather than inventing one", () => {
    // Two constants naming adjacent boundaries are two things to keep in step, so they are checked
    // against each other rather than each against a memory.
    expect(Y6_FIRST_UNIT).toBe(261);
    const y5 = YEAR_BANDS.find((b) => b.id === "Y5")!;
    expect(y5.firstUnit).toBe(Y5_FIRST_UNIT);
    expect(y5.lastUnit + 1).toBe(Y6_FIRST_UNIT);
    for (let i = 1; i < YEAR_BANDS.length; i++) {
      expect(YEAR_BANDS[i]!.firstUnit, `${YEAR_BANDS[i]!.id} does not follow ${YEAR_BANDS[i - 1]!.id}`).toBe(
        YEAR_BANDS[i - 1]!.lastUnit + 1,
      );
    }
  });

  it("finds Y6 modules already in the surface, which is the header rule working", () => {
    // The half that did NOT need fixing, counted rather than assumed. Q21's modules were compelled
    // into the declared surface as they landed, without anybody remembering — W259 argued this
    // mechanism and this is the count behind the argument.
    const y6 = modulesWithUnits(ROOT).filter((m) => m.unit !== null && m.unit >= Y6_FIRST_UNIT);
    expect(y6.length, "no Y6 module exists yet, so this proves nothing").toBeGreaterThan(5);
    const declared = new Set(OPERATOR_COPY_SURFACES.map((s) => s.module));
    for (const m of y6) {
      expect(declared, `${m.module} is a Y6 module and undeclared`).toContain(m.module);
    }
  });
});

describe("W270 the floor is a floor with a door, not a wall", () => {
  it("states why it is where it is, as an argument rather than a number", () => {
    expect(COPY_SURFACE_FLOOR).toBe(Y4_FIRST_UNIT);
    expect(FLOOR_RATIONALE.length, "the floor is a number nobody argued for").toBeGreaterThan(200);
    expect(FLOOR_RATIONALE, "the rationale does not say what a backward sweep would cost").toMatch(
      /machinery|collision|false/i,
    );
  });

  it("admits a pre-floor module, which the old rule could not", () => {
    // THE FINDING. Membership was `unit >= Y4_FIRST_UNIT`, so this register could not be extended
    // to where the copy is even deliberately: it would report a pre-floor entry as a module that
    // is not one. Every door entry is below the floor and every one is in the declared surface.
    expect(PRE_FLOOR_COPY_SURFACES.length).toBeGreaterThan(3);
    const units = new Map(modulesWithUnits(ROOT).map((m) => [m.module, m.unit]));
    const declared = new Set(OPERATOR_COPY_SURFACES.map((s) => s.module));
    for (const module of PRE_FLOOR_COPY_SURFACES) {
      const unit = units.get(module);
      expect(unit, `${module} has no unit header`).not.toBeNull();
      expect(unit!, `${module} is not below the floor, so the door is not what admitted it`).toBeLessThan(
        COPY_SURFACE_FLOOR,
      );
      expect(declared, `${module} went through the door and was never declared`).toContain(module);
    }
    expect(copySurfaceMembers(ROOT)).toEqual(
      [...OPERATOR_COPY_SURFACES.map((s) => s.module)].sort(),
    );
  });

  it("leaves the years below the floor uncovered, and says so in numbers", () => {
    // The bound, reported rather than hidden. A register that covers a third of the tree while
    // being checked "in both directions" reads as complete, and the direction it is complete in is
    // the one it defined for itself.
    const coverage = coverageByBand(ROOT, copySurfaceMembers(ROOT));
    const byBand = new Map(coverage.map((c) => [c.band, c]));
    for (const band of ["Y1", "Y2", "Y3"]) {
      const row = byBand.get(band)!;
      expect(row.modules, `${band} has no modules`).toBeGreaterThan(20);
      expect(row.covered, `${band} is now fully covered; the floor moved without its argument`).toBeLessThan(
        row.modules,
      );
    }
    for (const band of ["Y4", "Y5", "Y6"]) {
      const row = byBand.get(band)!;
      expect(row.covered, `${band} is above the floor and not fully covered`).toBe(row.modules);
    }
  });
});

describe("W270 the four that went through the door", () => {
  it("declares each with the copy an operator actually reads", () => {
    for (const module of PRE_FLOOR_COPY_SURFACES) {
      const surface = OPERATOR_COPY_SURFACES.find((s) => s.module === module)!;
      expect(surface.operatorCopy.length, `${module} went through the door declaring no copy`).toBeGreaterThan(0);
      expect(surface.notCopy.length, `${module} says nothing about its other strings`).toBeGreaterThan(60);
    }
  });

  it("accepts each flagged string per surface, with a reason and a date", () => {
    // Not a rule being loosened: each acceptance names one module, one export, one rule and one
    // matched string, and argues the surface. A blanket exemption is what W200 refused.
    const door = new Set(PRE_FLOOR_COPY_SURFACES);
    const mine = ACCEPTED_COPY_FINDINGS.filter((a) => door.has(a.module));
    expect(mine.length, "the door admitted four surfaces and accepted nothing").toBeGreaterThan(3);
    for (const accepted of mine) {
      expect(accepted.why.length, `${accepted.module}#${accepted.exportName} accepted without an argument`).toBeGreaterThan(150);
      expect(accepted.reviewBy, `${accepted.module} accepted with no review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(accepted.reviewBy), `${accepted.module}'s review date is in the past`).toBeGreaterThan(
        Date.parse("2026-08-14"),
      );
    }
  });

  it("found no violation, which is the honest result and not the point", () => {
    // Every flagged string read defensibly on the same argument W200 already accepted for
    // SILENCE_COPY: the same words mean different things on different surfaces. The finding is not
    // what the copy said — it is that for four years there was no way to look at it.
    const door = new Set(PRE_FLOOR_COPY_SURFACES);
    for (const accepted of ACCEPTED_COPY_FINDINGS.filter((a) => door.has(a.module))) {
      expect(accepted.why, `${accepted.module} is accepted without naming the surface argument`).toMatch(
        /surface|role|practice|patient|request/i,
      );
    }
    // And the copy is real text rather than an empty export, so the acceptances are about something.
    const results = readFileSync(path.join(ROOT, "src/console/results-copy.ts"), "utf8");
    expect(results).toContain("Your results");
  });
});

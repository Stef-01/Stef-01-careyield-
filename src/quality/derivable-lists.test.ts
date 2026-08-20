import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  DERIVABLE_BOUND,
  LISTED_REGISTERS,
  type ListedRegister,
  checkerDefects,
  handListedRegisters,
  listCensusDefects,
  optInDerivations,
  undeclaredTextReaders,
  weldedDerivations,
} from "./derivable-lists";
import { SCAN_SITES } from "./scan-text";
import { copyTree, withPlantedIn } from "./planting";

const ROOT = path.resolve(__dirname, "..", "..");
const DECLARED_SCAN_SITES = SCAN_SITES.map((s) => s.module);

describe("W372 the hand-listed registers, against what the tree could derive", () => {
  it("covers every one, and names none the tree no longer holds", () => {
    expect(listCensusDefects(ROOT)).toEqual([]);
    // W293: both directions fire, on the same producer.
    expect(listCensusDefects(ROOT, LISTED_REGISTERS.slice(1))).toHaveLength(1);
    expect(
      listCensusDefects(ROOT, [...LISTED_REGISTERS, { id: "src/quality/gone.ts::GONE" } as ListedRegister]),
    ).toHaveLength(1);
  });

  it("derives the population rather than listing it", () => {
    const found = handListedRegisters(ROOT);
    expect(found).toContain("src/quality/bounds.ts::STATED_BOUNDS");
    expect(found.length).toBe(LISTED_REGISTERS.length);
    // And it notices one arriving, which is what makes the census above worth anything.
    const copy = copyTree(ROOT, { directories: ["src"] });
    const grown = withPlantedIn(
      copy,
      {
        "src/quality/list-probe.ts":
          "interface Row {\n  module: string;\n}\n" +
          'export const PLANTED_LIST: readonly Row[] = [\n  { module: "src/quality/a.ts" },\n];\n',
      },
      () => handListedRegisters(copy),
    );
    expect(grown).toContain("src/quality/list-probe.ts::PLANTED_LIST");
  });

  it("resolves every checker it cites, so a rename fails here", () => {
    expect(checkerDefects(ROOT)).toEqual([]);
    // Both arms of the resolution really do fire.
    const callable: ListedRegister = {
      id: "src/quality/bounds.ts::STATED_BOUNDS",
      membership: { kind: "derived", by: { kind: "callable", name: "src/quality/bounds.ts::gone" } },
    };
    expect(checkerDefects(ROOT, [callable])[0]?.what).toContain("does not export");
    const welded: ListedRegister = {
      id: "src/quality/bounds.ts::STATED_BOUNDS",
      membership: { kind: "derived", by: { kind: "welded", file: "src/quality/pins.test.ts" } },
    };
    expect(checkerDefects(ROOT, [welded])[0]?.what).toContain("does not name STATED_BOUNDS");
  });

  it("argues every row that says a derivation would be wrong", () => {
    for (const entry of LISTED_REGISTERS) {
      if (entry.membership.kind !== "not_derivable") continue;
      expect(entry.membership.why.length, `${entry.id} is unargued`).toBeGreaterThan(200);
    }
  });

  it("names the registers checked against a derivation of who opted in", () => {
    // THE FINDING. W290: a NAMED list, because a count moves by accident.
    expect(optInDerivations()).toEqual([
      "src/quality/exemption-reach.ts::EXEMPTIONS",
      "src/quality/scan-text.ts::SCAN_SITES",
      "src/quality/spelling-markers.ts::MARKERS",
    ]);
    for (const entry of LISTED_REGISTERS) {
      if (entry.membership.kind !== "derived_from_the_opt_in") continue;
      expect(entry.membership.misses.length, `${entry.id} does not say what it misses`).toBeGreaterThan(200);
    }
  });

  it("counts a welded checker as welded whichever kind of derivation it belongs to", () => {
    // Every opt-in row happens to cite a callable today, so the arm that carries them into the
    // welded list is exercised by nothing in the tree. W372's own mutation check found it, and a
    // branch nothing drives is a branch that can be wrong for a quarter — which is the argument
    // this register makes about lists.
    const optInWelded: ListedRegister = {
      id: "src/quality/scan-text.ts::SCAN_SITES",
      membership: {
        kind: "derived_from_the_opt_in",
        by: { kind: "welded", file: "src/quality/scan-text.test.ts" },
        misses: "a planted reason",
      },
    };
    expect(weldedDerivations([optInWelded])).toEqual(["src/quality/scan-text.ts::SCAN_SITES"]);
    const optInCallable: ListedRegister = {
      id: "src/quality/scan-text.ts::SCAN_SITES",
      membership: {
        kind: "derived_from_the_opt_in",
        by: { kind: "callable", name: "src/quality/scan-text.ts::scanSiteDiff" },
        misses: "a planted reason",
      },
    };
    expect(weldedDerivations([optInCallable])).toEqual([]);
  });

  it("names the registers whose comparison nothing outside a test can run", () => {
    // W370's Q28-CR-1 one level up: a check welded inside a `.test.ts` is a check the close gate
    // cannot call. These are the hand-listed registers in that position.
    expect(weldedDerivations()).toEqual([
      "src/compliance/cdss-boundary.ts::ACCEPTED_COPY_FINDINGS",
      "src/compliance/cdss-boundary.ts::OPERATOR_COPY_SURFACES",
      "src/compliance/composed-copy.ts::ACCEPTED_COMPOSED_FINDINGS",
      "src/compliance/composed-copy.ts::COMPOSED_COPY_SITES",
      "src/directory/disclosure.ts::CLINICIAN_RECORD_CLASSES",
      "src/privacy/access-y5.ts::ACCESS_PATHS",
      "src/privacy/automated-decisions.ts::AUTOMATED_DECISIONS",
      "src/privacy/erasure-y5.ts::ERASURE_PATHS",
      "src/privacy/record-classes.ts::RECORD_CLASSES",
      "src/quality/acceptances.ts::ACCEPTANCE_REGISTERS",
      "src/quality/declaration-tax.ts::EDIT_SITES_AT_W308",
      "src/quality/tautology-sweep.ts::ACCEPTED_TAUTOLOGIES",
      "src/quality/unit-headers.ts::ADOPTED_MODULES",
      "src/security/page-reach.ts::DORMANT_MODULES",
      "src/tenancy/store-reads.ts::STORE_READS",
    ]);
  });
});

describe("W372 W370's Q28-SIMP-1, discharged as a measurement", () => {
  it("names every module reading source text outside the register whose subject that is", () => {
    expect(undeclaredTextReaders(ROOT, DECLARED_SCAN_SITES)).toEqual([
      "src/console/zero-meaning.ts",
      "src/quality/assertion-vocabulary.ts",
      "src/quality/close-gate.ts",
      "src/quality/empty-list-sweep.ts",
      "src/quality/founder-page-facts.ts",
      "src/quality/mutation-sampling.ts",
      "src/quality/register-census.ts",
      "src/quality/register-counts.ts",
      "src/quality/self-defeating.ts",
      "src/quality/spec-stores.ts",
      "src/quality/unasked-facts.ts",
    ]);
  });

  it("disagrees with the hand count that raised it, which is the unit's own subject", () => {
    // W370 RAISED THIS AS `fourteen modules`, counted by hand off a `grep`. The derivation says
    // eleven: the hand count included the two `.test.ts` neighbours a file listing turns up and the
    // home of the preparation itself, none of which is a module scanning outside the register. A
    // finding raised from a list and a finding raised from a derivation are different findings, and
    // this unit exists because the difference is invisible from either one alone.
    expect(undeclaredTextReaders(ROOT, DECLARED_SCAN_SITES).length).toBe(11);
    expect(undeclaredTextReaders(ROOT, DECLARED_SCAN_SITES).length).toBeLessThan(14);
  });

  it("subtracts the modules it is told are declared, which is what makes it a difference", () => {
    // The `declared` parameter, driven: no module in `SCAN_SITES` calls `stripComments` directly
    // today — they all go through the shared preparation — so nothing in the tree exercises this
    // subtraction, and a version that ignored it would answer identically. Handed one of the
    // eleven, it must drop out.
    const all = undeclaredTextReaders(ROOT, DECLARED_SCAN_SITES);
    const withOneDeclared = undeclaredTextReaders(ROOT, [
      ...DECLARED_SCAN_SITES,
      "src/quality/register-census.ts",
    ]);
    expect(all).toContain("src/quality/register-census.ts");
    expect(withOneDeclared).not.toContain("src/quality/register-census.ts");
    expect(withOneDeclared).toHaveLength(all.length - 1);
  });

  it("is derived from the behaviour, so a module that starts doing it joins without an edit", () => {
    const copy = copyTree(ROOT, { directories: ["src"] });
    const grown = withPlantedIn(
      copy,
      {
        "src/quality/text-probe.ts":
          'import { stripComments } from "./scan-text";\n' +
          "export const read = (source: string): string => stripComments(source);\n",
      },
      () => undeclaredTextReaders(copy, DECLARED_SCAN_SITES),
    );
    expect(grown).toContain("src/quality/text-probe.ts");
    // And the home of the preparation is not one of them, which is the arm that would otherwise
    // report the remedy as the defect.
    expect(grown).not.toContain("src/quality/scan-text.ts");
  });
});

describe("W372 the bound", () => {
  it("says the population is one shape of list and not every list", () => {
    expect(DERIVABLE_BOUND).toContain("ONE SHAPE OF LIST, NOT EVERY LIST");
  });

  it("says `derived` resolves a name and does not prove a comparison runs", () => {
    expect(DERIVABLE_BOUND).toContain("NOT A PROOF THAT IT WORKS");
    expect(DERIVABLE_BOUND).toContain("compares the list against itself");
  });

  it("names its one unchecked judgement", () => {
    expect(DERIVABLE_BOUND).toContain("`not_derivable` IS THE ONE JUDGEMENT HERE");
  });
});

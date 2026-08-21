// W383: "Q29's hardening pass → verify: `code-review`, `security-review` and `simplify` over
// W365–W377; every finding disposed with a clock per W318; the pass's own bound stated."
//
// EVERY FINDING IS RE-DERIVED RATHER THAN REMEMBERED. A record of what was once true is a record
// that goes quietly wrong; each arm below asks the tree the question the finding asked.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FINDINGS,
  NOT_REVIEWED,
  Q29_HARDENING_BOUND,
  QUARTER,
  REVIEWED_UNITS,
  SELF_REVIEWED,
  finding,
  unaccountedUnits,
} from "./hardening-q29";
import { CLAIMS, proseClaims } from "./prose-numbers";
import { patientRules } from "./patient-populations";
import { withRoot } from "./refusal-branches";
import { withTree } from "./planting";
import { copyMaker, reclaimableCopies, TEMP_PREFIXES } from "./repository-clean";

const ROOT = path.resolve(__dirname, "..", "..");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

describe("W383 the pass covers the quarter it claims to", () => {
  it("reads every unit in its range, or says why not", () => {
    expect(unaccountedUnits(LEDGER)).toEqual([]);
    expect(REVIEWED_UNITS).toHaveLength(QUARTER.last - QUARTER.first + 1);
    expect(NOT_REVIEWED).toEqual({});
  });

  it("names the units this reader wrote rather than leaving them to be noticed", () => {
    for (const unit of Object.keys(SELF_REVIEWED)) {
      const n = Number(unit.slice(1));
      expect(n, `${unit} is outside the range`).toBeGreaterThanOrEqual(QUARTER.first);
      expect(n, `${unit} is outside the range`).toBeLessThanOrEqual(QUARTER.last);
      expect(LEDGER, `${unit} is not held as builder-B's`).toContain(`| ${unit} | done | builder-B |`);
    }
    expect(Object.keys(SELF_REVIEWED)).toEqual(["W366", "W368", "W370", "W372", "W374"]);
  });

  it("raises each finding against a unit the range holds, with every lens run", () => {
    for (const f of FINDINGS) {
      const n = Number(f.unit.slice(1));
      expect(n, `${f.id} names ${f.unit}, outside the range`).toBeGreaterThanOrEqual(QUARTER.first);
      expect(n, `${f.id} names ${f.unit}, outside the range`).toBeLessThanOrEqual(QUARTER.last);
    }
    // A pass with an empty lens is a pass that skipped it.
    expect(new Set(FINDINGS.map((f) => f.lens))).toEqual(
      new Set(["code-review", "security-review", "simplify"]),
    );
  });

  it("puts a clock on every disposition, which is W318's rule", () => {
    for (const f of FINDINGS) {
      if (f.disposition.kind === "accepted") {
        expect(f.disposition.reviewBy, `${f.id} is accepted with no review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(f.disposition.reviewBy).getTime(), `${f.id}'s review date is before it was raised`)
          .toBeGreaterThan(new Date(f.raisedOn).getTime());
      } else {
        expect(f.disposition.kind, `${f.id} is disposed as nothing`).toBe("fixed");
      }
    }
  });
});

describe("W383 each finding is re-derived, so a fix that came undone fails here", () => {
  it("Q29-CR-1: a hyphenated compound is read whole, and the four rows say what their modules say", () => {
    // THE FIX, MEASURED. `twenty-seven routes` entered the register as SEVEN ROUTES because `\b`
    // matches at the hyphen and the compound was not in the hand-typed map. The tens are crossed
    // with the units now, so the miss cannot come back one spelling at a time.
    const read = withRoot(
      {
        "src/planted/q29-cr1.ts":
          "// W1: twenty-seven routes and seventy-eight files.\n" +
          'import path from "node:path";\nexport const a = path;\n',
      },
      (root) => proseClaims(root).map((c) => `${c.text}=${c.number}`).sort(),
    );
    expect(read).toEqual(["seventy-eight files=78", "twenty-seven routes=27"]);
    // And the four rows that were live and wrong hold the corrected text. Each is asserted by the
    // number it states, so a row edited back to its tail fails here and not only in W314's own arm.
    const text = (module: string): string[] =>
      CLAIMS.filter((c) => c.module === module).map((c) => c.text);
    expect(text("src/quality/tree-walks.ts")).toContain("twenty-seven files");
    expect(text("src/quality/review-w279.ts")).toContain("twenty-seven routes");
    expect(text("src/quality/hardening-q23.ts")).toContain("THIRTY-NINE FILES");
    expect(text("src/quality/hardening-q24.ts")).toContain("SEVENTY-EIGHT FILES");
    expect(finding("Q29-CR-1").disposition.kind).toBe("fixed");
  });

  it("Q29-CR-2: the panel is found past a callback and in every spelling, and a longer name is not one", () => {
    const found = withTree(
      {
        "src/planted/q29-behind.ts":
          'import type { Patient } from "@/synthetic/types";\n' +
          "export function behind(pick: (p: Patient) => boolean, panel: Patient[]): Patient[] {\n" +
          "  return panel.filter(pick);\n}\n",
        "src/planted/q29-readonly.ts":
          'import type { Patient } from "@/synthetic/types";\n' +
          "export function readonlyPanel(panel: ReadonlyArray<Patient>): number {\n  return panel.length;\n}\n",
        "src/planted/q29-prefixed.ts":
          "interface SyntheticPatient { id: string }\n" +
          "export function prefixed(panel: SyntheticPatient[]): number {\n  return panel.length;\n}\n",
      },
      (root) => patientRules(root),
    );
    // Both directions in one planted tree: two found, and the one whose type merely ENDS in the
    // word refused. A scan that widened without the boundary would report three.
    expect(found).toEqual(["src/planted/q29-behind.ts::behind", "src/planted/q29-readonly.ts::readonlyPanel"]);
    expect(finding("Q29-CR-2").disposition.kind).toBe("fixed");
  });

  it("Q29-SIMP-1: the scan order lives where its rule can reach it", () => {
    // The composition is named rather than spelled out. Asserted against the module's text because
    // that is what the finding is ABOUT — where the two swappable lines are written.
    const source = readFileSync(path.join(ROOT, "src/quality/mutation-sampling.ts"), "utf8");
    expect(source).toContain("prepareForScan(source)");
    expect(source, "the hand-written composition is back").not.toContain("blankLiterals(code)");
    expect(finding("Q29-SIMP-1").disposition.kind).toBe("fixed");
  });

  it("Q29-SR-1: the sweep still removes only names this tree writes, and the vocabulary is still three", () => {
    // The finding is ACCEPTED, so what this re-derives is its PREMISE rather than a fix. Two things
    // have to stay true for the acceptance to hold: the gate is a name test, and the vocabulary has
    // not quietly grown a prefix nobody weighed.
    expect(copyMaker("tree-1234-abc"), "a name this tree writes is claimed").toBe(1234);
    expect(copyMaker("someone-elses-dir"), "a name this tree does not write is refused").toBeNull();
    expect(copyMaker("tree-abc-1234"), "a directory with no pid is refused").toBeNull();
    // THE ONE THAT MATTERS, and the mutation check is why it is here. A first draft of this arm
    // asserted only the two negatives above, and both of them survive a `copyMaker` widened to
    // `-<digits>-` anywhere in the name — neither has a pid in it, so neither can tell a prefix
    // test from no prefix test at all. The premise SR-1 rests on is that the PREFIX is checked, so
    // the case has to be a foreign name that does carry a pid.
    expect(copyMaker("someone-elses-99-cache"), "a foreign name carrying a pid is refused").toBeNull();
    expect(copyMaker("pytest-of-root-42-x"), "and one that looks like another tool's").toBeNull();
    // Dead makers are reclaimable and live ones are not, which is the other half of the gate.
    const dead = (maker: number): boolean => maker === 999;
    expect(reclaimableCopies(["plant-999-a", "plant-1000-b", "unrelated"], 7, dead)).toEqual(["plant-1000-b"]);
    expect([...TEMP_PREFIXES].sort()).toEqual(["plant", "probe", "tree"]);
    const disposition = finding("Q29-SR-1").disposition;
    expect(disposition.kind).toBe("accepted");
  });
});

describe("W383 the bound", () => {
  it("states what a green pass does not prove", () => {
    expect(Q29_HARDENING_BOUND).toContain("CANNOT CHECK ITS OWN COMPLETENESS");
    expect(Q29_HARDENING_BOUND).toContain("ONE READER");
  });

  it("says which of the reader's own units it read, and does not round the proportion away", () => {
    // The bound claims the proportion is worse than last quarter's. Derived, not typed.
    expect(Object.keys(SELF_REVIEWED).length / REVIEWED_UNITS.length).toBeGreaterThan(3 / 13);
  });

  it("names the security lens's object rather than reporting a clean quarter", () => {
    expect(FINDINGS.filter((f) => f.lens === "security-review")).toHaveLength(1);
    expect(Q29_HARDENING_BOUND).toContain("ONE OBJECT");
  });
});

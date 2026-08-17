// W281 verify gate: "a module with no `// W<n>` header fails the suite rather than being counted;
// `HEADERLESS_AT_W210` retired or re-derived, and the finding closed in W210's register."
//
// The door is asserted against the real tree AND proved by planting the three things it exists to
// notice into a copy of it — W282's shape, because a check that has never seen its condition
// arrive is a check nobody has tested.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ADOPTED_MODULES,
  HEADER_CITATION_BOUND,
  HEADER_RULE,
  adoptedModuleNames,
  headerNamesUnknown,
  headerCensus,
  headerUnit,
  headerViolations,
  knownUnits,
  misplacedUnit,
} from "./unit-headers";
import { LATENT_FINDINGS, modulesWithNoUnitHeader } from "./latent-findings";
import { FINDING_ANCHORS, deadAnchors } from "./latent-y5";
import { OPERATOR_COPY_SURFACES } from "@/compliance/cdss-boundary";
import { withPlantedIn } from "./planting";
import { RECORD_CLASSES } from "@/privacy/record-classes";

const ROOT = path.resolve(__dirname, "../..");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");

let COPY: string;

beforeAll(() => {
  COPY = mkdtempSync(path.join(tmpdir(), "w281-"));
  cpSync(path.join(ROOT, "src"), path.join(COPY, "src"), { recursive: true });
});

afterAll(() => {
  rmSync(COPY, { recursive: true, force: true });
});

/**
 * Plant into the copy for the duration of the probe, and remove it whatever happens.
 *
 * W303 REPLACED AN UNSCOPED `plant()` HERE. It wrote the file and returned; the caller removed it
 * on the line after the assertions, so a FAILING assertion skipped the cleanup and left the probe
 * in the copied tree for every later test in this file — one real failure becoming a cascade of
 * unrelated ones. The scope is the fix: there is no way to plant here without a `finally`.
 */
function planted<T>(relPath: string, contents: string, probe: () => T): T {
  return withPlantedIn(COPY, { [relPath]: contents }, probe);
}

describe("W281 the door, against this tree", () => {
  it("refuses nothing, which is the whole claim", () => {
    expect(headerViolations(ROOT, LEDGER)).toEqual([]);
  });

  it("is a door over something, not an empty list", () => {
    // Non-vacuity, and it earns its place: every assertion above is `toEqual([])`, which is what a
    // walk returning nothing also produces. The census must have seen the tree.
    const census = headerCensus(ROOT, LEDGER);
    expect(census.missing.length + census.misplaced.length + census.unknownUnit.length).toBe(0);
    expect(knownUnits(LEDGER).size).toBeGreaterThan(280);
    expect(modulesWithNoUnitHeader().length).toBe(0);
  });

  it("states the rule rather than only enforcing it", () => {
    expect(HEADER_RULE).toMatch(/FIRST line/);
    expect(HEADER_RULE).toMatch(/BUILD_UNIT/);
  });
});

describe("W281 each half of the door, proved by planting what it exists to notice", () => {
  it("catches a module with no header at all", () => {
    const census = planted("src/quality/w281-probe-none.ts", "export const NOTHING = 1;\n", () =>
      headerCensus(COPY, LEDGER),
    );
    expect(census.missing).toContain("src/quality/w281-probe-none.ts");
    expect(headerCensus(COPY, LEDGER).missing).toEqual([]);
  });

  it("catches a module whose unit is recorded where the census cannot read it", () => {
    // The half W281 added, and the reason it is a separate list: three of CENSUS-1's eleven were
    // in exactly this state — `domain/types.ts` opened with "// Meherr core domain model (W2)."
    // and was counted as having no unit. Reporting it as `missing` would say "undocumented" about
    // a module that documented itself.
    const census = planted(
      "src/quality/w281-probe-late.ts",
      "// Meherr core domain model (W2).\nexport const X = 1;\n",
      () => headerCensus(COPY, LEDGER),
    );
    expect(census.misplaced).toContainEqual({ module: "src/quality/w281-probe-late.ts", unit: 2 });
    expect(census.missing, "a misplaced unit was reported as no unit").toEqual([]);
  });

  it("catches a header naming a unit the ledger does not have", () => {
    // A header is a MEMBERSHIP CLAIM: W200's census covers `unit >= COPY_SURFACE_FLOOR`, so the
    // number decides whether the copy linter ever reads the module. `// W999` satisfies a
    // header-shaped check and names nothing.
    const census = planted(
      "src/quality/w281-probe-unknown.ts",
      "// W999: a unit that never happened.\nexport const X = 1;\n",
      () => headerCensus(COPY, LEDGER),
    );
    expect(census.unknownUnit).toContainEqual({ module: "src/quality/w281-probe-unknown.ts", unit: 999 });
    expect(census.missing).toEqual([]);
  });

  it("leaves the copied tree clean once the probes are gone", () => {
    // The guard on the three above: each asserts an absence AFTER planting, so a census that
    // returned everything would satisfy `toContain` and prove nothing.
    expect(headerViolations(COPY, LEDGER)).toEqual([]);
  });
});

describe("W281 the parts, driven directly", () => {
  it("reads a unit only from the header position", () => {
    expect(headerUnit("// W42: a thing.\n")).toBe(42);
    expect(headerUnit("// Meherr core domain model (W2).\n")).toBeNull();
    expect(headerUnit("export const BUILD_UNIT = \"W1\";\n")).toBeNull();
    expect(headerUnit("\n// W42: a thing.\n"), "a header on the second line is not a header").toBeNull();
  });

  it("looks for a misplaced unit only when there is no header", () => {
    expect(misplacedUnit("// Meherr core domain model (W2).\n")).toBe(2);
    expect(misplacedUnit("export const BUILD_UNIT = \"W1\";\n")).toBe(1);
    expect(misplacedUnit("export const NOTHING = 1;\n")).toBeNull();
    // A module with a proper header is not searched for a second opinion — otherwise every module
    // citing another unit in its comments would be reported as misplaced.
    expect(misplacedUnit("// W42: a thing, following W26's rule.\n")).toBeNull();
  });

  it("reads the ledger's unit ids rather than a range", () => {
    const units = knownUnits(LEDGER);
    expect(units.has(1)).toBe(true);
    expect(units.has(281)).toBe(true);
    expect(units.has(999), "the ledger cannot have a unit it never planned").toBe(false);
    // W285 composed this onto W263's row parser, which is STRICTER than the regex it replaced: a
    // full six-column row, not any line starting `| W<n> |`. Asserted rather than assumed, because
    // that is a behaviour change and the looser version would have counted a half-written row.
    const row = "| W7 | done | builder-B | 2026-01-01T00:00Z | abc1234 | a note. |";
    expect(knownUnits(`${row}\n| not a row |\n`)).toEqual(new Set([7]));
    expect(knownUnits("| W7 | done |\n"), "a malformed row is not a unit").toEqual(new Set());
  });
});

describe("W281 adoption is declared, because a header names an owner and not an age", () => {
  it("declares four, each carrying the adopting unit's header", () => {
    // Both directions: the register says W281 adopted them, and the module's own first line has to
    // agree. A register claiming an adoption the tree does not show is the citation-nobody-resolved
    // failure W207 found and W258 made a rule.
    // W304: a floor, so the loop below cannot pass over an empty register.
    expect(ADOPTED_MODULES.length, "no module is adopted").toBeGreaterThanOrEqual(4);
    for (const adopted of ADOPTED_MODULES) {
      const text = readFileSync(path.join(ROOT, adopted.module), "utf8");
      expect(headerUnit(text), `${adopted.module} does not carry the unit that adopted it`).toBe(
        Number(adopted.adoptedBy.slice(1)),
      );
      expect(adopted.provenance.length, "an adoption with no evidence is an assertion").toBeGreaterThan(20);
    }
  });

  it("keeps the subtraction load-bearing, by naming what it subtracts", () => {
    // THE ASSERTION THAT STOPS THE SUBTRACTION BEING QUIETLY DROPPED, and the reason it exists:
    // `src/interest/store.ts` is `stored` in W106 and carries a W281 header, so W265's "did Year 5
    // add a stored class" derivation reads it as a Year-5 arrival. It is four years old and
    // unchanged; it had simply become legible. Without this, somebody deletes the subtraction, the
    // suite goes red, and the obvious repair is to change the header back.
    const adopted = adoptedModuleNames();
    expect(adopted.has("src/interest/store.ts")).toBe(true);
    const stored = RECORD_CLASSES.find((c) => c.module === "src/interest/store.ts");
    expect(stored?.handling, "the module this subtraction exists for is no longer stored").toBe("stored");
  });

  it("claims adoption only for modules that exist", () => {
    for (const adopted of ADOPTED_MODULES) {
      expect(existsSync(path.join(ROOT, adopted.module)), `${adopted.module} is adopted and gone`).toBe(true);
    }
  });
});

describe("W281 CENSUS-1 is closed, and closing it moved what it said", () => {
  it("is closed by this unit with its trigger kept", () => {
    const census1 = LATENT_FINDINGS.find((f) => f.id === "CENSUS-1")!;
    expect(census1.status).toBe("closed");
    expect(census1.closedBy).toBe("W281");
    // W280's rule. A closed finding whose condition was deleted is indistinguishable from one that
    // was never real, so the predicate stays and answers false.
    expect(census1.trigger()).toBe(false);
    expect(census1.what, "the finding does not record what closing it found").toMatch(/731 strings/);
  });

  it("keeps an anchor that survived the fix", () => {
    // The interesting failure this unit had to avoid: CENSUS-1's old anchor was "the header-less
    // walk returns modules", which went FALSE the moment every module got a header. An anchor
    // pointed at the symptom dies when the symptom is cured.
    const anchor = FINDING_ANCHORS.find((a) => a.id === "CENSUS-1")!;
    expect(anchor.holds()).toBe(true);
    expect(anchor.claim).toMatch(/observable at the door/);
    expect(deadAnchors()).toEqual([]);
  });

  it("brings the copy the finding said did not exist into W200's surface", () => {
    // CENSUS-1 said the eleven were "all Year-1 infrastructure that holds no operator copy, which
    // is why this is latent rather than live". This is the assertion that sentence was false.
    const declared = new Set(OPERATOR_COPY_SURFACES.map((s) => s.module));
    for (const module of [
      "src/demo/clinicians.ts",
      "src/demo/care-archetypes.ts",
      "src/interest/types.ts",
      "src/interest/store.ts",
    ]) {
      expect(declared, `${module} was headered and not declared`).toContain(module);
    }
    const directory = OPERATOR_COPY_SURFACES.find((s) => s.module === "src/demo/clinicians.ts")!;
    expect(directory.operatorCopy).toEqual(["clinicians"]);
  });
});

describe("W298 a header cites no name the tree does not have", () => {
  it("resolves every backticked identifier in every module header", () => {
    // THE DOOR. Two headers in this quarter named an export that had been renamed or turned into a
    // function, and both survived every gate — a green suite says nothing about prose.
    expect(headerNamesUnknown(ROOT)).toEqual([]);
  });

  it("reports a header that names a constant nothing exports", () => {
    // Planted, because a door pinned empty over a healthy tree proves nothing about the door. The
    // name is assembled from fragments so THIS file does not contain the token — the collision
    // that hid both real findings on the detector's first run, and W153's remedy for it.
    const ghost = ["W298", "GHOST", "CONSTANT"].join("_");
    const planted = path.join(COPY, "src/quality/w298-probe-header.ts");
    mkdirSync(path.dirname(planted), { recursive: true });
    writeFileSync(planted, `// W281: a probe whose header names \`${ghost}\`.\nimport path from "node:path";\nexport const value = path;\n`, "utf8");
    expect(headerNamesUnknown(COPY, [planted])).toEqual([
      `src/quality/w298-probe-header.ts::${ghost}`,
    ]);
    rmSync(planted, { force: true });
  });

  it("stays quiet when the name it cites really is exported", () => {
    // The other direction, and it earns its place: a detector reporting every backticked name
    // would report most of this tree's headers and the door would be deleted within a week.
    const real = path.join(COPY, "src/quality/w298-probe-real.ts");
    mkdirSync(path.dirname(real), { recursive: true });
    writeFileSync(real, '// W281: a probe whose header names `HEADER_RULE`.\nimport path from "node:path";\nexport const value = path;\n', "utf8");
    expect(headerNamesUnknown(COPY, [real])).toEqual([]);
    rmSync(real, { force: true });
  });

  it("does not report an un-underscored word, which is English in this tree's prose", () => {
    // Found by mutation: dropping the underscore requirement changed no answer over this tree, so
    // the narrowing was a decision nobody could observe — the shape W267 recorded about its own
    // default roots. A PAIR now drives it, and the first attempt at this probe failed twice over:
    // `TODO` and `HEAD` appear elsewhere in the tree, so they resolve for the wrong reason, and a
    // token written literally here lands in the copied tree and resolves against this very file.
    // Both tokens are invented and assembled from fragments.
    const plain = ["ZORB", "LAT"].join("");
    const underscored = ["ZORB", "LAT", "_GONE"].join("");
    const probe = path.join(COPY, "src/quality/w298-probe-english.ts");
    mkdirSync(path.dirname(probe), { recursive: true });
    writeFileSync(
      probe,
      `// W281: a probe whose header says \`${plain}\` and \`${underscored}\`.\nimport path from "node:path";\nexport const value = path;\n`,
      "utf8",
    );
    // The underscored one is reported and the plain one is not, from the same header in one call.
    expect(headerNamesUnknown(COPY, [probe])).toEqual([
      `src/quality/w298-probe-english.ts::${underscored}`,
    ]);
    rmSync(probe, { force: true });
  });

  it("says what resolving a name does not prove", () => {
    expect(HEADER_CITATION_BOUND).toMatch(/not/);
    expect(HEADER_CITATION_BOUND).toMatch(/W293/);
  });
});

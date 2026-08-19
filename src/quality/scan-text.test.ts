// W302 verify gate: "a single exported scan-preparation with comment stripping and literal
// blanking, the four copies retired, and W295's reversion recorded as its stated bound — proved on
// the prose comment whose `/` hid four real registers."
//
// THE LAST CLAUSE IS THE ONE WITH TEETH AND IT IS DRIVEN WITH THE REAL TEXT. W295's reversion is
// not a story: the comment that caused it is still in `register-census.ts`, and the two orders are
// run over it here. Comments-first keeps the `export function` line; literals-first eats it. That
// is the whole argument for fixing the order, and it is executed rather than described.
//
// THE COPIES ARE COUNTED FROM THE TREE, not asserted. A second comment-stripper arriving in a
// module fails the sweep below, which is the only way "retired" stays true past this unit.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SCAN_BOUND,
  SCAN_ORDER_RULE,
  SCAN_SITES,
  blankLiterals,
  prepareForScan,
  preparationCopies,
  scanSiteDiff,
  scanSitesInTree,
  orderingLosses,
} from "./scan-text";
import { stripComments } from "@/security/reachability";
import type { ScanSite } from "./scan-text";

const ROOT = process.cwd();

describe("W302 one preparation, in the one order that works", () => {
  it("subtracts comments and blanks literals by default", () => {
    const source = '// a note\nexport const X = "a sentence";\n';
    const prepared = prepareForScan(source);
    expect(prepared, "the comment survived").not.toContain("a note");
    expect(prepared, "the literal survived").not.toContain("a sentence");
    // The opening delimiter is kept, which is what W294's `reviewBy:`-plus-quote detector needs.
    expect(prepared).toContain('X = "');
  });

  it("keeps what the caller asks to keep", () => {
    const source = '// a note\nexport const X = "a sentence";\n';
    expect(prepareForScan(source, { literals: "kept" })).toContain("a sentence");
    expect(prepareForScan(source, { comments: "kept" })).toContain("a note");
  });

  it("preserves line count, and blanking preserves offsets — which are different promises", () => {
    // Every caller reports a line number from the prepared text; several also slice the ORIGINAL
    // for what they quote, which needs offsets. Blanking keeps both. Comment SUBTRACTION keeps only
    // the line count — `stripComments` deletes a `//` comment rather than padding it — so a caller
    // that slices the original after subtracting comments is reading the wrong span. Stated here
    // rather than assumed, because the two transforms make different promises and every scan in
    // this tree uses both.
    const source = '// a note\n/* a\n block */\nexport const X = "a b";\nconst Y = 1;\n';
    expect(prepareForScan(source).split("\n")).toHaveLength(source.split("\n").length);
    expect(blankLiterals(source).length, "blanking moved an offset").toBe(source.length);
    expect(prepareForScan(source).length, "subtraction is claimed to keep offsets, and does not").toBeLessThan(
      source.length,
    );
  });
});

describe("W302 the order is the finding, driven on the text that caused it", () => {
  it("keeps the export lines that the other order eats, on a real file", () => {
    // THE UNIT, run over the tree's own text rather than a reconstruction, and over a witness that
    // is LOOKED UP rather than named. W302 named `register-census.ts` — the file whose prose
    // comments cost W295 four registers — and W305 moved its entries into the manifest, taking the
    // prose with them. A named witness would have gone vacuous at that moment with the test still
    // green, so a tree where NO file exhibits the loss now fails here instead.
    const losses = orderingLosses(ROOT);
    expect(losses.length, "no file in this tree loses an export to the wrong order any more").toBeGreaterThan(0);
    const worst = losses[0]!;
    for (const name of worst.lost) {
      expect(worst.commentsFirst, `${worst.file}: the right order lost ${name}`).toContain(name);
      expect(worst.literalsFirst, `${worst.file}: the wrong order kept ${name}`).not.toContain(name);
    }
    // And the loss is silent: the wrong order still returns a plausible list, which is why nothing
    // failed when W295 shipped it except a count in another register.
    expect(
      worst.literalsFirst.length + worst.lost.length,
      "the wrong order returned nothing, so the loss is not silent",
    ).toBeGreaterThan(0);
  });

  it("states the rule as data, so reordering means deleting an argument", () => {
    expect(SCAN_ORDER_RULE).toContain("Comments are subtracted before literals are blanked");
    expect(SCAN_ORDER_RULE, "the rule does not say what it cost to learn").toContain("W295");
    expect(SCAN_ORDER_RULE.length).toBeGreaterThan(300);
  });
});

describe("W302 the copies are retired, and stay retired", () => {
  it("leaves one comment-stripper and one literal-blanker in the tree", () => {
    // Counted from the tree rather than claimed. A module that writes its own pair — the shape
    // `order-independence.ts`, `composed-copy.ts` and `declaration-tax.ts` each had — arrives
    // failing here.
    expect(preparationCopies(ROOT)).toEqual({
      strippers: ["src/security/reachability.ts"],
      blankers: ["src/quality/scan-text.ts"],
    });
  });

  it("finds no inline comment-subtraction left where a copy used to be", () => {
    // The three that were inline rather than named. Each is now a `prepareForScan` call, and the
    // regex pair they used would read as a fourth stripper nobody could find by name.
    for (const module of [
      "src/quality/order-independence.ts",
      "src/compliance/composed-copy.ts",
      "src/quality/declaration-tax.ts",
    ]) {
      const code = prepareForScan(readFileSync(path.join(ROOT, module), "utf8"), { literals: "kept" });
      expect(code, `${module} still subtracts comments inline`).not.toMatch(/replace\(\/\\\/\\\*/);
      expect(code, `${module} does not use the shared preparation`).toContain("prepareForScan(");
    }
  });
});

describe("W302 the sites that ask for it are declared, both directions", () => {
  it("agrees with the tree", () => {
    expect(scanSitesInTree(ROOT)).toEqual({ undeclared: [], stale: [] });
    expect(SCAN_SITES.length).toBeGreaterThan(3);
  });

  it("reports a module that asks for it and says nothing", () => {
    // Driven: the diff takes both sides, so it can be handed a module the register does not know
    // and a declared module that has stopped asking.
    const planted = [{ module: "src/planted.ts", source: "prepareForScan(x);\n" }];
    expect(scanSiteDiff(planted, []).undeclared).toEqual(["src/planted.ts"]);
    expect(scanSiteDiff([], SCAN_SITES.slice(0, 1)).stale).toEqual([SCAN_SITES[0]!.module]);
  });

  it("does not count a module that only names it in a comment", () => {
    // The collision, in the register about the collision. `scanSiteDiff` prepares the text it reads
    // with the very preparation it is looking for, which is the tidiest possible statement of the
    // rule and the reason this file is excluded from its own sweep above.
    const planted = [{ module: "src/planted.ts", source: "// a note about prepareForScan\n" }];
    expect(scanSiteDiff(planted, []).undeclared).toEqual([]);
  });

  it("makes every site say why it wants what it wants", () => {
    for (const site of SCAN_SITES) {
      expect(site.why.length, `${site.module} asks without saying why`).toBeGreaterThan(120);
    }
    // Both answers are in use, or the option is a setting nobody chose.
    const kept = SCAN_SITES.filter((s) => s.prep.literals === "kept");
    expect(kept.length, "no site keeps literals, so the option is decoration").toBeGreaterThan(0);
    expect(SCAN_SITES.length - kept.length).toBeGreaterThan(0);
  });
});

describe("W302 the reversion is recorded rather than tidied away", () => {
  it("names the scan that stays raw, and why the fix is not available", () => {
    expect(SCAN_BOUND).toContain("violationReporters");
    expect(SCAN_BOUND, "the bound does not admit the discipline is not universal").toContain(
      "reads RAW source",
    );
    expect(SCAN_BOUND.length).toBeGreaterThan(400);
  });

  it("leaves that scan raw, so the bound describes the tree", () => {
    // A bound naming a scan that has since been narrowed is W297's stale-bound class, one register
    // over. This is the cheap check that keeps it honest.
    const source = readFileSync(path.join(ROOT, "src/quality/refusal-branches.ts"), "utf8");
    expect(source, "the raw-text scan was narrowed and the bound not updated").toContain(
      'const text = readFileSync(full, "utf8");',
    );
    const walk = source.slice(source.indexOf("export function violationReporters"));
    expect(walk.slice(0, 1400), "the walk now prepares its text, and the bound still says it does not").not.toContain(
      "prepareForScan(",
    );
  });
});

describe("W355 the defaulted register is handed a different value, at home", () => {
  // A default promises the comparison can be asked another question, and a promise nobody collects
  // is a signature that reads as drivable while the only value it ever had is the default. W355
  // found twelve parameters in this tree whose parameter no call anywhere supplied; this is one of them.

  it("takes a declared site list it is given, not only its own", () => {
    // One producer, asked twice — so the empty list below is evidenced by the same expression
    // having been shown full, which is W293's rule and the reason this is a helper.
    const undeclaredGiven = (declared: readonly ScanSite[] | undefined): string[] =>
      (declared === undefined ? scanSitesInTree(ROOT) : scanSitesInTree(ROOT, declared)).undeclared;
    expect(undeclaredGiven([]), "an empty declared list reported no undeclared site").toContain(
      SCAN_SITES[0]!.module,
    );
    expect(undeclaredGiven(undefined), "the tree disagrees with its own declared sites").toEqual([]);
  });
});

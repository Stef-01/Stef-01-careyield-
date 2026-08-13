// W272 verify gate: "every finding recorded with a disposition and a date, and the accepted ones
// carry a review date."
//
// A HARDENING DOCUMENT IS THE EASIEST THING IN THIS TREE TO WRITE FALSELY, because nothing it says
// is executable and every sentence in it is about code somewhere else. So the claims are checked
// against the tree rather than read: the fix it describes is required to be in the module it names,
// the modules it reviews are required to be the modules the quarter actually added, and the
// dispositions table is parsed row by row rather than eyeballed.
//
// W207's rule, inherited: a table is pinned CELL BY CELL. "The document mentions W266 somewhere" is
// satisfied by a document that has stopped being true.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REFUSED_SCOPING_SHAPES, consoleExportFor } from "@/privacy/console-export";
import { DEFAULT_Y5_FLEET_BUDGETS } from "@/sim/fleet-y5";
import { STORE_READS } from "@/tenancy/store-reads";
import { SEED_PRACTICE_ID } from "@/booking/store";

const ROOT = process.cwd();
const RAW = readFileSync(path.join(ROOT, "docs", "HARDENING-Q21.md"), "utf8");
/** Backticks and whitespace flattened — the normaliser this tree has needed four times now. */
const DOC = RAW.replace(/`/g, "").replace(/\s+/g, " ");

/** The rows of the markdown table that follows a heading, as trimmed cells. */
function tableAfter(heading: string): string[][] {
  const start = RAW.indexOf(heading);
  expect(start, `no section headed ${heading}`).toBeGreaterThan(-1);
  const rows: string[][] = [];
  for (const line of RAW.slice(start).split("\n").slice(1)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (rows.length > 0) break;
      continue;
    }
    const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c) || c === "")) continue;
    rows.push(cells);
  }
  return rows;
}

describe("W272 every finding has a disposition and a date", () => {
  const rows = tableAfter("## Dispositions").slice(1);

  it("records five findings, each with a severity, a disposition and a date", () => {
    expect(rows).toHaveLength(5);
    for (const [id, severity, disposition, date] of rows) {
      expect(["high", "medium", "low"], `${id} has an unknown severity`).toContain(severity);
      expect(disposition!.length, `${id} has no disposition`).toBeGreaterThan(5);
      expect(date, `${id} has no date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("gives every ACCEPTED finding a review date, and every fixed one none", () => {
    // THE CLAUSE THE GATE NAMES. An accepted finding with no review date is one nobody looks at
    // again — W210's rule, which exists because a recorded finding sat for two years.
    let accepted = 0;
    for (const [id, , disposition, , reviewDate] of rows) {
      if (disposition!.startsWith("accepted")) {
        accepted += 1;
        expect(reviewDate, `${id} is accepted with no review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        expect(reviewDate, `${id} is fixed but carries a review date`).toBe("—");
      }
    }
    // Non-vacuity: if nothing were accepted, the rule above would have checked nothing.
    expect(accepted, "no finding is accepted, so the review-date rule is untested").toBe(2);
  });

  it("dates every review AFTER the finding it reviews", () => {
    for (const [id, , disposition, date, reviewDate] of rows) {
      if (!disposition!.startsWith("accepted")) continue;
      expect(reviewDate! > date!, `${id}'s review date is not after its finding`).toBe(true);
    }
  });
});

describe("W272 the review table describes the quarter that happened", () => {
  const rows = tableAfter("## Modules reviewed").slice(1);

  it("reviews a module per row, each naming the unit that built it", () => {
    expect(rows.length).toBeGreaterThanOrEqual(11);
    for (const [module, unit, verdict] of rows) {
      expect(unit, `${module} names no unit`).toMatch(/^W\d+(\/W\d+)?$/);
      expect(verdict!.length, `${module} has no verdict`).toBeGreaterThan(10);
    }
  });

  it("names files that exist", () => {
    for (const [module] of rows) {
      const file = module!.replace(/`/g, "").split(" ")[0]!;
      expect(() => readFileSync(path.join(ROOT, file), "utf8"), `${file} does not exist`).not.toThrow();
    }
  });

  it("marks exactly one module as carrying the finding", () => {
    const flagged = rows.filter(([, , verdict]) => verdict!.includes("FINDING"));
    expect(flagged).toHaveLength(1);
    expect(flagged[0]![0]).toContain("src/privacy/store.ts");
  });
});

describe("W272 finding 1's fix is in the tree, not only in the document", () => {
  it("ships the scoped export the document says it ships", () => {
    expect(DOC).toContain("consoleExportFor(patientId, practiceId, now)");
    // W288 removed `expect(typeof consoleExportFor).toBe("function")` from here. The import is
    // static, so tsc fails before this file runs if the export goes or stops being a function —
    // the line was a runtime check of something the compiler already refuses to let through, and
    // it sat next to the assertion that does the work.
    expect(consoleExportFor.length, "the fix does not take a practice").toBe(3);
  });

  it("leaves the unscoped export unscoped, as the document claims", () => {
    // The document's argument is that the product-level answer must NOT take a practice, so a
    // future change that quietly scoped it would make this section false.
    const entry = STORE_READS.find(
      (r) => r.module === "src/privacy/store.ts" && r.fn === "exportForPatient",
    );
    expect(entry?.kind).toBe("patient_keyed");
    expect(entry?.reason).toContain("W272");
  });

  it("registers the fix as practice-scoped", () => {
    const entry = STORE_READS.find((r) => r.fn === "consoleExportFor");
    expect(entry, "the fix is not in W209's register").toBeDefined();
    expect(entry!.kind).toBe("practice_scoped");
    expect(entry!.module).toBe("src/privacy/console-export.ts");
  });

  it("has the page asking the scoped question", () => {
    const page = readFileSync(path.join(ROOT, "app", "console", "privacy", "page.tsx"), "utf8");
    expect(page).toContain("consoleExportFor");
    expect(page, "the page still renders the unscoped export").not.toMatch(
      /exportForPatient\s*\(/,
    );
  });

  it("states the four decisions the fix makes, and the module refuses their opposites", () => {
    for (const phrase of [
      "Party, not author",
      "held is re-derived",
      "count of what was withheld is not reported",
      "filter over the product's answer, not a second derivation",
    ]) {
      expect(DOC, `the document does not state: ${phrase}`).toContain(phrase);
    }
    for (const refusal of [
      "scoping_by_author",
      "carrying_held_across",
      "counting_what_was_withheld",
      "re_reading_every_store_with_a_practice",
    ]) {
      expect(Object.keys(REFUSED_SCOPING_SHAPES)).toContain(refusal);
    }
  });
});

describe("W272 finding 4's fix is in the tree too", () => {
  it("points the seeded rail at the practice the console mints first", () => {
    // The finding was that these were different practices, so the assertion is that they are the
    // same one — checked against the store rather than against the document.
    expect(SEED_PRACTICE_ID).toBe("prac-1");
    expect(DOC).toContain("belonged to a practice no session can ever act for");
  });
});

describe("W272 findings 2 and 3 are checked against the code too", () => {
  it("quotes the fleet budget that finding 3 pins", () => {
    expect(DOC).toContain("maxColdStartMs: 12_000");
    expect(DEFAULT_Y5_FLEET_BUDGETS.maxColdStartMs).toBe(12_000);
  });

  it("describes finding 2's share as one with a floor, which it now has", () => {
    expect(DOC).toContain("exactly 1.000");
    expect(DEFAULT_Y5_FLEET_BUDGETS.forecastShare.min).toBeGreaterThan(0);
    expect(DEFAULT_Y5_FLEET_BUDGETS.forecastShare.max).toBeLessThan(1);
  });

  it("records the pre-existing red e2e, and says it gates nothing", () => {
    // The systemic half of finding 5: `pnpm verify` does not run Playwright, so a red e2e has been
    // invisible to every unit this quarter. Checked against package.json rather than asserted.
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.verify, "verify now runs e2e, so this finding is stale").not.toContain(
      "playwright",
    );
    expect(DOC).toContain("does not run Playwright");
    expect(DOC).toContain("Confirmed pre-existing");
  });

  it("says what the review could not do", () => {
    // Every hardening document in this tree states its bound. A review whose limits are not
    // written down reads as a review with none.
    expect(DOC).toContain("without sub-agents");
    expect(DOC).toContain("no live system and no real record");
  });
});

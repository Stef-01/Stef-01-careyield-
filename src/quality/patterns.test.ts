// W391 verify gate: every population this tree defines with a named pattern is derived, carrying
// the pattern's own text and the sentence saying what it enumerates — and a population nothing else
// could read is named as such rather than left to look like the others.

import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  PATTERNS_AT_W391,
  PATTERN_BOUND,
  literalEnd,
  patternDefects,
  patternSites,
  patternsIn,
  type DeclaredPattern,
} from "./patterns";
import { TREE_DERIVED_REGISTERS } from "./register-census";

const ROOT = path.resolve(__dirname, "..", "..");
const MEMBERS = TREE_DERIVED_REGISTERS.map((r) => r.file);

/** A module that really holds patterns, so a probe over it is a probe over real text. */
const REAL = "src/quality/typed-names.ts";
const rowsFor = (module: string) =>
  PATTERNS_AT_W391.filter((p) => p.module === module);

describe("W391 the scanner", () => {
  it("reads a literal whose character class contains a slash, to the end", () => {
    const code = "const MODULE_PATH = /^(src|app)\\/[\\w./-]+\\.(ts|tsx)$/;\n";
    const open = code.indexOf("/^");
    expect(code.slice(open, literalEnd(code, open))).toBe(
      "/^(src|app)\\/[\\w./-]+\\.(ts|tsx)$/",
    );
  });

  it("is why this register is not itself built out of a pattern", () => {
    // THE FINDING THAT OPENED THE QUARTER, kept as an assertion rather than a sentence. Reading a
    // regex WITH a regex ends the match at the first unescaped-looking slash, which inside `[...]`
    // is an ordinary character — so the reading truncates and the population it defines is a
    // prefix of the real one. Four of this tree's own patterns came back cut in half this way.
    const code = "const MODULE_PATH = /^(src|app)\\/[\\w./-]+\\.(ts|tsx)$/;\n";
    const byPattern = /const \w+ = (\/(?:[^/\\\n]|\\.)*\/)/.exec(code)![1]!;
    expect(byPattern).toBe("/^(src|app)\\/[\\w./");
    const open = code.indexOf("/^");
    expect(code.slice(open, literalEnd(code, open)).length).toBeGreaterThan(
      byPattern.length,
    );
  });

  it("keeps the flags, and stops at a newline rather than running on", () => {
    const flagged = "const G = /ab/gm;\n";
    const open = flagged.indexOf("/ab");
    expect(flagged.slice(open, literalEnd(flagged, open))).toBe("/ab/gm");
    expect(literalEnd("const X = /never closed\n", 10)).toBe(-1);
  });

  it("takes a named module-level pattern and not a division or an inline one", () => {
    const found = patternsIn(
      "m.ts",
      [
        "const A = /x/;",
        "export const B: RegExp = /y/g;",
        "const half = total / 2;",
        "if (/inline/.test(s)) return;",
        "  const INDENTED = /z/;",
      ].join("\n"),
    );
    // The indented one is out because the match is anchored to the line: a pattern declared inside
    // a function is not a register's population, and `PATTERN_BOUND` says so in its own words.
    expect(found.map((f) => f.name)).toEqual(["A", "B"]);
    expect(found.map((f) => f.source)).toEqual(["/x/", "/y/g"]);
  });

  it("does not see a pattern inside a comment, because comments are subtracted first", () => {
    // A BLOCK COMMENT AND NOT A LINE ONE, which is the arm the subtraction really buys. The match is
    // anchored to the start of a line, so `// const GHOST = /x/;` could never have matched anyway —
    // a probe written that way leaves the preparation undriven, and breaking it caught exactly that.
    const found = patternsIn(
      "m.ts",
      "/*\nconst GHOST = /x/;\n*/\nconst REAL = /y/;\n",
    );
    expect(found.map((f) => f.name)).toEqual(["REAL"]);
  });
});

describe("W391 the population", () => {
  it("is the named patterns W267's census members hold, and it is not empty", () => {
    const found = patternSites(ROOT, MEMBERS);
    // Guard against a vacuous pass: an empty walk satisfies every assertion below.
    expect(found.length).toBeGreaterThan(25);
    expect(found.every((f) => f.source.startsWith("/"))).toBe(true);
    // The four that a regex-based reading truncated, back whole and ending where they should.
    const truncated = [
      "TWO_PART",
      "SUBJECT_KEY",
      "MODULE_PATH",
      "EXPORT_CITATION",
    ];
    for (const name of truncated) {
      const site = found.find((f) => f.name === name);
      expect(site, name).toBeDefined();
      expect(
        site!.source.endsWith("/") || /\/[gimsuy]+$/.test(site!.source),
        name,
      ).toBe(true);
    }
  });

  it("declares one row per pattern the tree holds, and nothing it does not", () => {
    const found = patternSites(ROOT, MEMBERS);
    expect(
      PATTERNS_AT_W391.map((p) => `${p.module}::${p.name}`).sort(),
    ).toEqual(found.map((f) => `${f.module}::${f.name}`).sort());
  });
});

describe("W391 the rule", () => {
  it("is silent over the tree as it stands", () => {
    expect(patternDefects(ROOT, MEMBERS)).toEqual([]);
  });

  it("reports a pattern nothing says anything about", () => {
    const out = patternDefects(ROOT, [REAL], []);
    expect(out.map((d) => d.site)).toEqual([
      `${REAL}::EXPORT_CITATION`,
      `${REAL}::MODULE_PATH`,
      `${REAL}::UNIT`,
    ]);
    expect(out[0]!.what).toContain("nothing says what it claims to enumerate");
  });

  it("reports a pattern whose text has moved by one character", () => {
    // THE DIRECTION THIS UNIT IS FOR. `/^W\d+$/` losing its anchor is still a pattern named `UNIT`
    // and still a population — a different one, silently, with the row above it saying the old thing.
    const rows = rowsFor(REAL).map((p) =>
      p.name === "UNIT" ? { ...p, source: "/^W\\d+/" } : p,
    );
    const out = patternDefects(ROOT, [REAL], rows);
    expect(out).toHaveLength(1);
    expect(out[0]!.site).toBe(`${REAL}::UNIT`);
    expect(out[0]!.what).toContain(
      "is declared as /^W\\d+/ and the tree holds",
    );
  });

  it("reports a row that says what it enumerates in too few words to hold against it", () => {
    const rows = rowsFor(REAL).map((p) =>
      p.name === "UNIT" ? { ...p, claims: "a unit id" } : p,
    );
    const out = patternDefects(ROOT, [REAL], rows);
    expect(out.map((d) => d.what)).toEqual([
      "is declared without a sentence a reader could hold against it",
    ]);
  });

  it("reports a row that says nothing else could read it and does not say why", () => {
    const rows = rowsFor(REAL).map((p) =>
      p.name === "UNIT"
        ? { ...p, reading: { kind: "only_this" as const, why: "it just is" } }
        : p,
    );
    const out = patternDefects(ROOT, [REAL], rows);
    expect(out.map((d) => d.what)).toEqual([
      "says nothing else could read it, and does not say why",
    ]);
  });

  it("reports a second reading this tree does not export, and accepts one it does", () => {
    const reading = (by: string) => ({
      kind: "second_reading" as const,
      by,
      why: "x".repeat(130),
    });
    const swap = (by: string): DeclaredPattern[] =>
      rowsFor(REAL).map((p) =>
        p.name === "UNIT" ? { ...p, reading: reading(by) } : p,
      );

    const absent = patternDefects(
      ROOT,
      [REAL],
      swap("src/quality/typed-names.ts::noSuchExport"),
    );
    expect(absent.map((d) => d.what)).toEqual([
      "names a second reading this tree does not export: src/quality/typed-names.ts::noSuchExport",
    ]);
    // The control: the same row naming an export that is really there is not reported. A file that
    // does not exist and an export that does not is the same answer, and both are checked.
    expect(
      patternDefects(
        ROOT,
        [REAL],
        swap("src/quality/typed-names.ts::resolveName"),
      ),
    ).toEqual([]);
    expect(
      patternDefects(
        ROOT,
        [REAL],
        swap("src/quality/gone.ts::resolveName"),
      ).map((d) => d.what),
    ).toHaveLength(1);
  });

  it("reports a declared pattern the tree no longer holds", () => {
    const rows = [
      ...rowsFor(REAL),
      { ...rowsFor(REAL)[0]!, name: "DELETED_LAST_WEEK" },
    ];
    const out = patternDefects(ROOT, [REAL], rows);
    expect(out.map((d) => d.site)).toEqual([`${REAL}::DELETED_LAST_WEEK`]);
    expect(out[0]!.what).toBe(
      "is declared here and the tree holds no such pattern",
    );
  });
});

describe("W391 what the register found", () => {
  it("names the patterns nothing else in this tree could read, and they are most of them", () => {
    const alone = PATTERNS_AT_W391.filter(
      (p) => p.reading.kind === "only_this",
    );
    // THE ANSWER THE QUARTER OPENS ON. Most of this tree's populations are defined by a pattern
    // that is also the only reading of them, so a pattern matching the wrong thing has no second
    // instrument to disagree with it — Q29-CR-2's shape, counted rather than argued. The comparison
    // below is the figure; a fraction retyped here would be a number nobody re-derives, which is
    // the class W314's register exists for and one this unit had already got wrong once.
    expect(alone.length).toBeGreaterThan(PATTERNS_AT_W391.length / 2);
    expect(alone.length).toBeLessThan(PATTERNS_AT_W391.length);
  });

  it("holds the one pair whose two patterns are written character for character the same", () => {
    const count = PATTERNS_AT_W391.filter((p) => p.name === "COUNT");
    expect(count).toHaveLength(2);
    expect(count[0]!.source).toBe(count[1]!.source);
    // Both name the other as the second reading, which is the only place in this register where a
    // population really has two instruments — and two copies is its own way of going wrong.
    for (const row of count) expect(row.reading.kind).toBe("second_reading");
  });

  it("states what it cannot see, and the sentence names an inline pattern and a built one", () => {
    expect(PATTERN_BOUND).toContain("new RegExp");
    expect(PATTERN_BOUND).toContain("W267");
  });
});

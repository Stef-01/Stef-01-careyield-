// W341: the register is driven on constructed trees, because the tree it ships against is clean.
//
// Every arm here that matters plants a copy and requires it reported. A register whose only proof
// is "it says the repository is fine" is W279's finding and this tree keeps re-learning it.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DECLARED_COPIES,
  SHARED_PARSES,
  copyDefects,
  markersOf,
  privateCopies,
  PRIVATE_COPY_BOUND,
  type DeclaredCopy,
} from "./private-copies";
import { parseCitation, type ParsedCitation } from "./citations";
import { fixtureText } from "./scan-text";
import { withTree } from "./planting";
import { filesUnder } from "./tree-walks";

const ROOT = path.resolve(__dirname, "../..");

/** The sites this unit converted. Absent from the register is the assertion. */
const CONVERTED_BY_W341: readonly string[] = [
  "src/compliance/copy-y6.ts",
  "src/quality/gate-dossier-y5.test.ts",
  "src/quality/latent-findings.ts",
  "src/quality/order-independence.ts",
  "src/quality/refusal-branches.ts",
  "src/quality/self-reference.ts",
  "src/quality/unread-bounds.test.ts",
];

describe("W341 the shared parses are declared, and the citations resolve", () => {
  it("names a home that exists and markers that are not empty", () => {
    for (const parse of SHARED_PARSES) {
      expect(markersOf(parse).length, `${parse.name} has no markers`).toBeGreaterThan(0);
      for (const home of parse.home) {
        expect(existsSync(path.join(ROOT, home)), `${parse.name}: ${home} does not exist`).toBe(true);
      }
    }
  });

  it("resolves every `shared` citation to a file that exports what it names", () => {
    // W258: a citation is resolved, not recorded — and split by W301's shared parser rather than
    // by a fifth copy of the separator, which is this unit's own subject one layer down.
    for (const parse of SHARED_PARSES) {
      const parsed = parseCitation(parse.shared);
      expect(typeof parsed, `${parse.name}: ${parse.shared}`).not.toBe("string");
      const { file, assertion } = parsed as ParsedCitation;
      expect(existsSync(path.join(ROOT, file)), `${parse.name}: ${file} does not exist`).toBe(true);
      const text = readFileSync(path.join(ROOT, file), "utf8");
      for (const name of assertion.split(", ")) {
        expect(text, `${file} does not export ${name}`).toContain(`export function ${name}`);
      }
    }
  });

  it("argues every cost and every standing, at length", () => {
    for (const parse of SHARED_PARSES) {
      expect(parse.cost.length, `${parse.name} states no cost`).toBeGreaterThan(200);
    }
    for (const row of DECLARED_COPIES) {
      const argument = row.standing.kind === "unconverted" ? row.standing.cost : row.standing.why;
      expect(argument.length, `${row.file} :: ${row.parse} is unargued`).toBeGreaterThan(100);
    }
  });
});

describe("W341 the live tree", () => {
  it("declares every private copy it holds, in both directions", () => {
    expect(copyDefects(ROOT)).toEqual([]);
  });

  it("holds the copies this table says it holds, and no others", () => {
    const sites = privateCopies(ROOT);
    expect(sites.length, "the register and the tree disagree about how many copies there are").toBe(
      DECLARED_COPIES.length,
    );
  });

  it("does not report itself, which is the trap this shape falls into", () => {
    // The markers live in the fixtures file for exactly this reason; a module holding its own
    // detectors in its own text is the largest copy in the tree by its own measure.
    const files = privateCopies(ROOT).map((c) => c.file);
    expect(files).not.toContain("src/quality/private-copies.ts");
  });

  it("reports no copy in the files this unit converted", () => {
    const files = new Set(privateCopies(ROOT).map((c) => c.file));
    for (const converted of CONVERTED_BY_W341) {
      expect(existsSync(path.join(ROOT, converted)), `${converted} has moved`).toBe(true);
      expect(files.has(converted), `${converted} holds a copy again`).toBe(false);
    }
  });
});

describe("W341 a planted copy is reported", () => {
  it("reports a module holding its own tree recursion", () => {
    const found = withTree({ "src/planted/w341-walk.ts": fixtureText("private-tree-recursion") }, (root) =>
      privateCopies(root),
    );
    expect(found.map((c) => `${c.file} ${c.parse}`)).toEqual([
      "src/planted/w341-walk.ts the tree recursion",
    ]);
  });

  it("reports a module holding its own ledger row parse", () => {
    const found = withTree({ "src/planted/w341-rows.ts": fixtureText("private-ledger-parse") }, (root) =>
      privateCopies(root),
    );
    expect(found.map((c) => `${c.file} ${c.parse}`)).toEqual([
      "src/planted/w341-rows.ts the ledger row parse",
    ]);
  });

  it("refuses a module that only NAMES both parses, in prose", () => {
    // The negative half. Comments are subtracted first, so a module explaining what a copy looks
    // like is not one — the distinction W168 wrote and every scan here has had to make since.
    const found = withTree({ "src/planted/w341-prose.ts": fixtureText("a-parse-named-in-prose") }, (root) =>
      privateCopies(root),
    );
    expect(found).toEqual([]);
  });

  it("reports the planted copy as undeclared, which is what fails a build", () => {
    const defects = withTree(
      { "src/planted/w341-walk.ts": fixtureText("private-tree-recursion") },
      (root) => copyDefects(root),
    );
    expect(defects.map((d) => d.kind)).toContain("undeclared");
    expect(defects.filter((d) => d.kind === "undeclared").map((d) => d.file)).toEqual([
      "src/planted/w341-walk.ts",
    ]);
  });
});

describe("W341 a declaration that has gone wrong", () => {
  const declaredOn = (rows: readonly DeclaredCopy[]) =>
    withTree({ "src/planted/w341-walk.ts": fixtureText("private-tree-recursion") }, (root) =>
      copyDefects(root, SHARED_PARSES, rows),
    );

  it("reports a declaration for a file that holds no copy", () => {
    const defects = declaredOn([
      { file: "src/planted/w341-walk.ts", parse: "the tree recursion", standing: { kind: "unconverted", cost: "x" } },
      { file: "src/planted/absent.ts", parse: "the tree recursion", standing: { kind: "unconverted", cost: "x" } },
    ]);
    expect(defects.map((d) => `${d.kind} ${d.file}`)).toEqual(["stale src/planted/absent.ts"]);
  });

  it("reports the shared parse declared as a copy of itself", () => {
    const defects = declaredOn([
      { file: "src/planted/w341-walk.ts", parse: "the tree recursion", standing: { kind: "unconverted", cost: "x" } },
      { file: "src/quality/tree-walks.ts", parse: "the tree recursion", standing: { kind: "unconverted", cost: "x" } },
    ]);
    expect(defects.map((d) => `${d.kind} ${d.file}`)).toEqual(["declares_a_home src/quality/tree-walks.ts"]);
  });

  it("reports a declaration against a parse nobody publishes", () => {
    const defects = declaredOn([
      { file: "src/planted/w341-walk.ts", parse: "the tree recursion", standing: { kind: "unconverted", cost: "x" } },
      { file: "src/planted/other.ts", parse: "the parse of no parses", standing: { kind: "unconverted", cost: "x" } },
    ]);
    expect(defects.map((d) => `${d.kind} ${d.parse}`)).toEqual(["unknown_parse the parse of no parses"]);
  });
});

describe("W341 the recursion is shared now, not just its answers", () => {
  it("returns a file no shared answer would return", () => {
    // The unit's structural remedy, driven: `self-reference.ts` needed the walk WITHOUT the
    // extension filter — the fixture extension is the one no walk matches — and had to copy the
    // recursion to get it. `filesUnder` is that walk, exported.
    const found = withTree(
      { "src/planted/w341-thing.fixtures": "text\n", "src/planted/w341-thing.ts": "export const a = 1;\n" },
      (root) => filesUnder(path.join(root, "src")).map((f) => path.relative(root, f).split(path.sep).join("/")),
    );
    expect(found).toContain("src/planted/w341-thing.fixtures");
  });

  it("skips the directories the tree's one list names, and survives an unreadable path", () => {
    const found = withTree(
      { "src/planted/keep.ts": "export const a = 1;\n", "node_modules/pkg/index.ts": "export const b = 2;\n" },
      (root) => filesUnder(root).map((f) => path.relative(root, f).split(path.sep).join("/")),
    );
    expect(found).toContain("src/planted/keep.ts");
    expect(found).not.toContain("node_modules/pkg/index.ts");
    expect(filesUnder(path.join(ROOT, "no", "such", "directory"))).toEqual([]);
  });
});

describe("W341 the bound", () => {
  it("states what this register cannot see, and names the parses it does not read", () => {
    expect(PRIVATE_COPY_BOUND).toContain("scripts/");
    expect(PRIVATE_COPY_BOUND).toContain("preparationCopies");
    expect(PRIVATE_COPY_BOUND.length).toBeGreaterThan(400);
  });

  it("is true: a copy planted outside `src/` is invisible to it", () => {
    // The bound's own non-vacuity. A sentence saying "this cannot see X" that nobody has watched
    // fail to see X is W339's finding one unit earlier.
    const found = withTree({ "scripts/w341-walk.ts": fixtureText("private-tree-recursion") }, (root) =>
      privateCopies(root),
    );
    expect(found).toEqual([]);
  });
});

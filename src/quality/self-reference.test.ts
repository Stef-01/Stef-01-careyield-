// W307 verify gate: "one stated rule for a detector that must not match its own fixtures, applied
// to every scan in the tree, with the fixture-splitting idiom replaced by the rule; each scan proved
// to see a planted real instance and refuse its own quoted one."
//
// BOTH HALVES OF EVERY PROBE, ALWAYS, because each half alone is passed by a different broken scan.
// A detector that stopped deciding reports nothing and satisfies "does not report its own fixture"
// in silence — which is the failure W295 shipped when it narrowed three scans and four real
// registers disappeared. A detector that reports everything satisfies "sees a planted instance".
// The pair is the only thing that distinguishes a working scan from either.
//
// AND THE FIXTURES FOR THIS FILE'S OWN PROBES COME FROM THE FIXTURE FILE, which is the rule
// applying to itself rather than the register taking an exemption: `splitSites` reads test files
// too, so a split written here would be reported by the sweep this file exists to prove.

import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  FIXTURES_FILE,
  SELF_REFERENCE_RULE,
  fixtureBlocks,
  fixtureCitations,
  fixtureDiff,
  fixtureText,
  fixtureToken,
} from "./scan-text";
import {
  MECHANISM,
  SELF_REFERENCE_BOUND,
  SELF_SCANNING,
  SPLIT_EXCEPTIONS,
  fixtureFiles,
  holderDiff,
  selfScanDefects,
  splitDiff,
  splitSites,
} from "./self-reference";
import { withTree } from "./planting";

const ROOT = process.cwd();

describe("W307 the rule is stated, and the fixture file is cited in both directions", () => {
  it("states the rule, the alternatives it refuses, and why each is worse", () => {
    // W196's shape: the two idioms this replaces were both TRIED here, so the rule records what
    // they cost rather than asserting a preference. A later unit reaching for one has to delete a
    // sentence naming the evidence against it.
    expect(SELF_REFERENCE_RULE).toContain("HID FOUR REAL REGISTERS");
    expect(SELF_REFERENCE_RULE).toContain(FIXTURES_FILE);
    expect(SELF_REFERENCE_RULE.length).toBeGreaterThan(800);
  });

  it("loads every block somebody cites, and cites every block it holds", () => {
    // THE HALF THAT MATTERS IS `unloaded`. This file is outside every walk in the tree, so a block
    // left behind after its last caller went away is text no check would ever read again — the
    // dead-citation failure W258 is about, in the one place nothing else can see.
    expect(fixtureDiff(ROOT), "a fixture nobody loads, or a citation nothing answers").toEqual({
      unloaded: [],
      missing: [],
    });
    expect(fixtureCitations(ROOT).length, "nothing cites a fixture").toBeGreaterThan(8);
  });

  it("reports a block nobody loads and a citation the file cannot answer", () => {
    // Driven from both ends, because the two arms have opposite remedies: delete the block, or
    // write it.
    expect(fixtureDiff(ROOT, []).unloaded.length, "an empty citation list left every block loaded").toBeGreaterThan(
      8,
    );
    expect(fixtureDiff(ROOT, ["a-fixture-nobody-wrote"])).toEqual({
      unloaded: expect.arrayContaining(["ast-pass-module"]),
      missing: ["a-fixture-nobody-wrote"],
    });
  });

  it("parses blocks out of a file it is handed, rather than only the one beside it", () => {
    // W267's rule applied to the parser: a reader welded to one path can be read and never run.
    const parsed = withTree({ "f.fixtures": "=== a ===\nfirst\n\n=== b ===\nsecond\nthird\n" }, (root) =>
      fixtureBlocks(path.join(root, "f.fixtures")),
    );
    expect(parsed).toEqual({ a: "first\n", b: "second\nthird\n" });
  });

  it("throws by name for a fixture that is not there, rather than returning nothing", () => {
    // An undefined would flow into a planted file as the string "undefined" and the probe would
    // fail somewhere else entirely, which is the diagnosis cost W284 records.
    //
    // THE NAME IS A CONSTANT rather than an argument written in place, because `fixtureCitations`
    // scans test files for exactly that call shape and would read this probe as a citation the
    // file cannot answer. Naming it is ordinary code, which is the remedy W289 used for the same
    // collision one register over — not every case of this needs a fixture.
    const absent = "no-such-fixture";
    expect(() => fixtureText(absent)).toThrow(/no fixture named no-such-fixture/);
  });

  it("holds ONE file no walk reads, and says so about a second", () => {
    // The mechanism is an absence — an extension missing from every walk's filter — so what makes
    // it safe is that there is exactly one such file and its contents are all cited. A second one
    // is a second invisible surface, and it would arrive silently.
    expect(fixtureFiles(ROOT)).toEqual([FIXTURES_FILE]);
    expect(SELF_REFERENCE_BOUND).toContain("no scan reads");
    expect(SELF_REFERENCE_BOUND.length).toBeGreaterThan(400);
  });

  it("finds a second such file if one arrives, so the count above is not a coincidence", () => {
    const found = withTree({ "src/quality/other.fixtures": "=== x ===\ny\n" }, (root) => fixtureFiles(root));
    expect(found).toEqual(["src/quality/other.fixtures"]);
  });
});

describe("W307 every scan sees a planted instance and does not report its own fixture", () => {
  it("drives both halves for every detector whose fixture moved", () => {
    // THE UNIT.
    expect(selfScanDefects(ROOT), "a scan that cannot see one, or that sees itself").toEqual([]);
    expect(SELF_SCANNING.length, "no detector is covered").toBeGreaterThan(5);
  });

  it("argues each one, and names the modules the fixture came out of", () => {
    for (const scan of SELF_SCANNING) {
      expect(scan.why.length, `${scan.detector} moved its fixture without a reason`).toBeGreaterThan(150);
      expect(scan.holders.length, `${scan.detector} names no holder`).toBeGreaterThan(0);
      expect(scan.marker.length, `${scan.detector} has no marker`).toBeGreaterThan(3);
    }
  });

  it("reports a detector that cannot see a planted instance, and one that reports its own fixture", () => {
    // Both arms driven separately, because a register reporting only the first would pass forever
    // over a scan that had gone blind in the other direction.
    const blind = SELF_SCANNING.map((s) => ({ ...s, sees: () => [] }));
    expect(selfScanDefects(ROOT, blind).map((d) => d.what.split(" ")[0])).toEqual(
      SELF_SCANNING.map(() => "misses"),
    );
    const everything = SELF_SCANNING.map((s) => ({ ...s, sees: () => [s.marker] }));
    expect(everything.length).toBeGreaterThan(5);
    expect(
      selfScanDefects(ROOT, everything).every((d) => d.what.startsWith("reports its own fixture")),
      "a scan reporting its own fixture went unreported",
    ).toBe(true);
    expect(selfScanDefects(ROOT, everything)).toHaveLength(SELF_SCANNING.length);
  });

  it("keeps the probes and the conversions in step, both directions", () => {
    expect(holderDiff(ROOT), "a holder stopped loading its fixture, or nothing covers one").toEqual({
      notLoading: [],
      uncovered: [],
    });
    for (const [module, why] of Object.entries(MECHANISM)) {
      expect(why.length, `${module} is excluded without an argument`).toBeGreaterThan(60);
    }
  });

  it("reports a holder that stopped loading, and a module loading one nothing covers", () => {
    const moved = SELF_SCANNING.map((s) => ({ ...s, holders: ["src/quality/gone.ts"] }));
    expect(holderDiff(ROOT, moved).notLoading).toEqual(["src/quality/gone.ts"]);
    expect(holderDiff(ROOT, []).uncovered.length, "no scan declared and nothing came back").toBeGreaterThan(
      4,
    );
  });
});

describe("W307 the idiom the rule replaces is swept out of the tree", () => {
  it("finds only the splits somebody argued", () => {
    expect(splitDiff(ROOT), "a literal assembled from fragments with no argument for it").toEqual({
      unargued: [],
      stale: [],
    });
    // Non-vacuity: the sweep still finds the argued ones, so "nothing unargued" is not "nothing
    // found". W288's rule, and the four are the two shapes the sweep can see.
    expect(splitSites(ROOT).length).toBe(SPLIT_EXCEPTIONS.length);
    expect(splitSites(ROOT).length).toBeGreaterThan(3);
  });

  it("argues every exception, and refuses the two kinds separately", () => {
    // The two arguments are different claims: a PATTERN is a control's own rule and a
    // credential-shaped FIXTURE must stay inside the surface W242 sweeps. Both are recorded,
    // because "we left this one" with no reason is how an exception register becomes a list.
    for (const exception of SPLIT_EXCEPTIONS) {
      expect(exception.why.length, `${exception.module} is excepted without a reason`).toBeGreaterThan(150);
    }
    expect(SPLIT_EXCEPTIONS.some((e) => e.why.includes("W242")), "the credential case is not argued").toBe(
      true,
    );
  });

  it("sees a split arriving, in both of the shapes this tree wrote", () => {
    // The planted split comes from the fixture file for the reason the register exists: written
    // here it would be found by the sweep in THIS file and the probe would prove nothing.
    const inline = withTree({ "src/planted/split-join.ts": fixtureText("a-split-join") }, (root) =>
      splitSites(root),
    );
    expect(inline).toEqual(["src/planted/split-join.ts"]);
    const table = withTree(
      {
        // OUT OF THE SURFACE for the second time in this test: the joined-table body is itself a
        // joined table, so written here it makes `splitSites` report the file proving it works.
        "src/planted/parts.ts": fixtureText("a-joined-table"),
        // The near-miss for this shape, and it is why the table alone is not the pattern: an array
        // of pairs is the ordinary test-table idiom, used by eighteen modules in this tree.
        "src/planted/a-table.ts": 'export const ROWS = [\n  ["one", "half"],\n  ["two", "halves"],\n];\n',
      },
      (root) => splitSites(root),
    );
    expect(table, "the joined-fragment shape is invisible, or a plain table is read as one").toEqual([
      "src/planted/parts.ts",
    ]);
  });

  it("leaves a module that joins values rather than literals alone", () => {
    // W292's negative, and it is the near-miss that matters: `.join("")` over computed values is
    // ordinary code — three shipped modules do it — so a sweep matching the call rather than the
    // ARRAY OF LITERALS would report the message signer and the interest store as evasions.
    const found = withTree(
      {
        "src/planted/ordinary.ts": 'export const all = parts.map((p) => p.name).join("");\n',
        "src/planted/one-literal.ts": 'export const x = ["only"].join("");\n',
      },
      (root) => splitSites(root),
    );
    expect(found, "an ordinary join was read as a split fixture").toEqual([]);
  });

  it("reports an argued split that is gone, so a fixed module does not keep its exception", () => {
    expect(splitDiff(ROOT, [...SPLIT_EXCEPTIONS, { module: "src/gone.ts", why: "x" }]).stale).toEqual([
      "src/gone.ts",
    ]);
    expect(splitDiff(ROOT, []).unargued).toEqual(splitSites(ROOT));
  });
});

describe("W307 the fixture file is readable on its own terms", () => {
  it("names every block once, in a shape a person can edit", () => {
    const text = readFileSync(path.join(ROOT, FIXTURES_FILE), "utf8");
    const headers = [...text.matchAll(/^=== ([a-z0-9-]+) ===$/gm)].map((m) => m[1]!);
    expect(new Set(headers).size, "a fixture name is used twice").toBe(headers.length);
    expect(Object.keys(fixtureBlocks(path.join(ROOT, FIXTURES_FILE))).sort()).toEqual([...headers].sort());
    // And it explains itself at the top, because it is the one file no tooling here will ever
    // report on.
    expect(text.split("=== ")[0], "the fixture file does not say what it is").toContain("W307");
  });

  it("returns a token trimmed and a body with its newline, which are different jobs", () => {
    // THE VALUE IS NOT WRITTEN HERE. It is a model endpoint, and W153's scanner reads test files —
    // the first version of this assertion quoted it and made this file an undeclared instruction
    // sink, which is the sixteenth instance of the class and the one this unit is about.
    const host = fixtureToken("openai-endpoint-host");
    expect(host, "a token came back with its newline").not.toMatch(/\n/);
    expect(fixtureText("openai-endpoint-host")).toBe(`${host}\n`);
    // A body planted as a file has to end in a newline or the last line of a fixture and the first
    // line of nothing become the same line.
    for (const [name, body] of Object.entries(fixtureBlocks(path.join(ROOT, FIXTURES_FILE)))) {
      expect(body.endsWith("\n"), `${name} would be planted without a trailing newline`).toBe(true);
    }
  });

  it("is not read by any walk in this tree, which is the whole mechanism", () => {
    // Driven rather than asserted from the extension list: a walk that grew a `.fixtures` case
    // would make every fixture visible again, silently, and every probe above would start failing
    // for a reason nobody would connect to this.
    const seen = withTree(
      { "src/quality/probe.fixtures": "=== x ===\nexport const y = 1;\n" },
      (root) => {
        const walks = [
          ...splitSites(root),
          ...fixtureCitations(root),
        ];
        return walks;
      },
    );
    expect(seen, "a walk read the fixture file").toEqual([]);
  });
});

describe("W307 the fixture file cannot be edited into something nothing checks", () => {
  it("fails when a block is added and nobody loads it", () => {
    // The file is invisible to every register in the tree, so the citation check is the only thing
    // standing between it and a place to park text. Driven on a real copy.
    const added = withTree(
      { [FIXTURES_FILE]: readFileSync(path.join(ROOT, FIXTURES_FILE), "utf8") },
      (root) => {
        const file = path.join(root, FIXTURES_FILE);
        writeFileSync(file, `${readFileSync(file, "utf8")}\n=== parked-text ===\nsomething nobody reads\n`, "utf8");
        return fixtureDiff(root, fixtureCitations(ROOT));
      },
    );
    expect(added.unloaded, "a block was parked in the file and nothing noticed").toEqual(["parked-text"]);
  });
});

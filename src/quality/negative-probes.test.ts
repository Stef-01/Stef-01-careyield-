// W292 verify gate: "every `mutated_tree` proof in W267's census gains a case where the planted
// file must NOT be reported; a detector that reports everything passes today and fails here."
//
// THE SECOND HALF IS DRIVEN RATHER THAN ASSERTED. Every pair below is run twice: once against the
// real detector, which must report the positive and refuse the negative, and once against a
// detector built to report everything the pair plants. The second run must fail the pair while
// passing its positive — which is the gate's sentence, executed. Without it, "a detector that
// reports everything would fail here" is a claim about code nobody wrote.

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  EXEMPT_PHRASE,
  NEGATIVE_PROBES,
  discriminates,
  negativeDiff,
  unresolvedCitations,
  type PairResult,
} from "./negative-probes";
import { TREE_DERIVED_REGISTERS, walkProven } from "./register-census";
import { copySurfaceMembers } from "@/compliance/copy-y6";
import { discoverSurfaces } from "@/compliance/surfaces";
import { discoverFoldSites } from "./order-independence";
import { INSTRUCTION_SINK_MARKERS, findInstructionSinks } from "@/security/instruction-sinks";
import { reachableFromApp } from "@/security/reachability";
import { DORMANT_MODULES, diffReach } from "@/security/page-reach";
import { coverageDiff, type RouteCoverage } from "./route-coverage";
import * as walks from "./tree-walks";

const ROOT = process.cwd();

/** One side of a pair: the files it plants, and the string that proves the detector saw it. */
interface Side {
  files: Record<string, string>;
  token: string;
}

interface Pair {
  /** The census entry this discriminates, by the file it names. */
  register: string;
  /** Everything the detector reports, as one string, so a pair can be asked of any return shape. */
  sees: (root: string) => string;
  positive: Side;
  negative: Side;
}

const HEADER = "// W999: a W292 probe.\n";

const PAIRS: readonly Pair[] = [
  {
    register: "src/compliance/copy-y6.ts",
    sees: (root) => copySurfaceMembers(root).join("\n"),
    positive: {
      files: { "src/w292-pos-y6.ts": `${HEADER}export const value = 1;\n` },
      token: "w292-pos-y6.ts",
    },
    negative: {
      files: { "src/w292-neg-y6.ts": "// W1: a W292 probe below the copy-surface floor.\nexport const value = 1;\n" },
      token: "w292-neg-y6.ts",
    },
  },
  {
    register: "src/compliance/surfaces.ts",
    sees: (root) => discoverSurfaces(path.join(root, "app")).map((s) => s.path).join("\n"),
    positive: {
      files: { "app/w292-pos-route/page.tsx": "export default function Probe() {\n  return null;\n}\n" },
      token: "/w292-pos-route",
    },
    negative: {
      files: { "app/w292-neg-route/helper.tsx": "export function Helper() {\n  return null;\n}\n" },
      token: "/w292-neg-route",
    },
  },
  {
    register: "src/quality/order-independence.ts",
    sees: (root) => discoverFoldSites(root).map((f) => f.module).join("\n"),
    positive: {
      files: {
        "src/w292-pos-fold.ts": `${HEADER}export const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);\n`,
      },
      token: "w292-pos-fold.ts",
    },
    negative: {
      files: {
        "src/w292-neg-fold.ts": `${HEADER}export const doubled = (xs: number[]) => xs.filter((x) => x > 0).map((x) => x * 2);\n`,
      },
      token: "w292-neg-fold.ts",
    },
  },
  {
    register: "src/security/instruction-sinks.ts",
    sees: (root) => findInstructionSinks(root, ["src", "app"]).map((h) => h.file).join("\n"),
    positive: {
      files: { "src/w292-pos-sink.ts": `${HEADER}export const url = ${JSON.stringify(INSTRUCTION_SINK_MARKERS[0])};\n` },
      token: "w292-pos-sink.ts",
    },
    negative: {
      files: { "src/w292-neg-sink.ts": `${HEADER}export const url = "https://example.test/health";\n` },
      token: "w292-neg-sink.ts",
    },
  },
  {
    register: "src/security/reachability.ts",
    sees: (root) => reachableFromApp(root).files.join("\n"),
    positive: {
      files: {
        "src/w292-pos-reached.ts": `${HEADER}export const value = 1;\n`,
        "app/w292-pos-reach/page.tsx":
          'import { value } from "@/w292-pos-reached";\n\nexport default function Probe() {\n  return value;\n}\n',
      },
      token: "src/w292-pos-reached.ts",
    },
    negative: {
      files: { "src/w292-neg-unreached.ts": `${HEADER}export const value = 1;\n` },
      token: "src/w292-neg-unreached.ts",
    },
  },
  {
    register: "src/security/page-reach.ts",
    sees: (root) => diffReach(root).wokenDormant.map((w) => `${w.route} ${w.module}`).join("\n"),
    positive: {
      files: {
        "app/w292-pos-reach2/page.tsx": `import * as dormant from "@/${DORMANT_MODULES[0]!.module.replace(/^src\//, "").replace(/\.ts$/, "")}";\n\nexport default function Probe() {\n  void dormant;\n  return null;\n}\n`,
      },
      token: "/w292-pos-reach2",
    },
    negative: {
      files: { "app/w292-neg-reach/page.tsx": "export default function Probe() {\n  return null;\n}\n" },
      token: "/w292-neg-reach",
    },
  },
  {
    register: "src/quality/tree-walks.ts",
    sees: (root) => walks.sourceModules(root).join("\n"),
    positive: {
      files: { "src/w292-pos-source.ts": `${HEADER}export const value = 1;\n` },
      token: "w292-pos-source.ts",
    },
    negative: {
      files: { "src/w292-neg-source.test.ts": `${HEADER}export const value = 1;\n` },
      token: "w292-neg-source.test.ts",
    },
  },
  {
    register: "src/domain/schema-consistency.test.ts",
    sees: (root) => walks.migrationSql(root),
    positive: {
      files: { "supabase/migrations/9999_w292_pos.sql": "create table w292_pos_table (id text primary key);\n" },
      token: "w292_pos_table",
    },
    negative: {
      files: { "supabase/migrations/9999_w292_neg.md": "# not a migration\n\ncreate table w292_neg_table (id text);\n" },
      token: "w292_neg_table",
    },
  },
  {
    register: "src/lib/source-hygiene.test.ts",
    sees: (root) => walks.textFiles(root).join("\n"),
    positive: { files: { "src/w292-pos-text.md": "# probe\n" }, token: "w292-pos-text.md" },
    negative: { files: { "src/w292-neg-text.png": "not really an image\n" }, token: "w292-neg-text.png" },
  },
  {
    register: "src/lib/stores.test.ts",
    sees: (root) => walks.exportedResetters(root).join("\n"),
    positive: {
      files: { "src/w292-pos-reset.ts": `${HEADER}export function resetW292Pos() {}\n` },
      token: "resetW292Pos",
    },
    negative: {
      files: {
        "src/w292-neg-reset.ts": `${HEADER}function resetW292Neg() {}\nexport const use = () => resetW292Neg();\n`,
      },
      token: "resetW292Neg",
    },
  },
  {
    register: "src/privacy/record-classes.test.ts",
    sees: (root) => walks.storeModules(root).join("\n"),
    positive: {
      files: {
        "src/w292-pos-store.ts": `${HEADER}const store = globalThis as { __w292?: number };\nexport const read = () => store.__w292;\n`,
      },
      token: "w292-pos-store.ts",
    },
    negative: {
      files: {
        "src/w292-neg-store.ts": `${HEADER}export const present = typeof globalThis !== "undefined";\n`,
      },
      token: "w292-neg-store.ts",
    },
  },
  {
    register: "src/quality/latent-y5.ts",
    sees: (root) => walks.dossierTestFiles(root).join("\n"),
    positive: {
      files: { "src/quality/gate-dossier-w292-pos.test.ts": `${HEADER}export const value = 1;\n` },
      token: "gate-dossier-w292-pos.test.ts",
    },
    negative: {
      files: { "src/quality/gate-dossier-w292-neg.ts": `${HEADER}export const value = 1;\n` },
      token: "gate-dossier-w292-neg.ts",
    },
  },
  {
    register: "src/quality/page-suite.ts",
    sees: (root) => walks.pageSpecFiles(root).join("\n"),
    positive: {
      files: { "e2e/w292-pos.spec.ts": "// a W292 probe spec.\nexport const value = 1;\n" },
      token: "w292-pos.spec.ts",
    },
    negative: {
      files: { "e2e/w292-neg-helper.ts": "// a W292 probe helper.\nexport const value = 1;\n" },
      token: "w292-neg-helper.ts",
    },
  },
  {
    register: "src/quality/latent-findings.ts",
    sees: (root) => walks.modulesWithNoUnitHeader(root).join("\n"),
    positive: {
      files: { "src/w292-pos-headerless.ts": "export const value = 1;\n" },
      token: "w292-pos-headerless.ts",
    },
    negative: {
      files: { "src/w292-neg-headered.ts": `${HEADER}export const value = 1;\n` },
      token: "w292-neg-headered.ts",
    },
  },
  {
    register: "src/verticals/assembly.test.ts",
    sees: (root) => walks.verticalModules(root, new Set<string>()).join("\n"),
    positive: {
      files: { "src/verticals/w292-pos-vertical.ts": `${HEADER}export const value = 1;\n` },
      token: "w292-pos-vertical.ts",
    },
    negative: {
      files: { "src/verticals/w292-neg-vertical.types.ts": `${HEADER}export type Value = number;\n` },
      token: "w292-neg-vertical.types.ts",
    },
  },
];

/**
 * The one pair whose negative is not a file.
 *
 * `coverageDiff`'s question is a difference against a REGISTER, so the discriminating negative is
 * the same planted route with a register that declares it — a detector that skipped the lookup
 * would report all twenty-seven served routes as undeclared. Kept out of the table rather than
 * bent into it, and accounted for by name in the door below.
 */
const DRIVEN_SEPARATELY = ["src/quality/route-coverage.ts"];

let COPY = "";

beforeAll(() => {
  COPY = mkdtempSync(path.join(tmpdir(), "w292-"));
  for (const dir of ["src", "app", "e2e", "supabase"]) {
    cpSync(path.join(ROOT, dir), path.join(COPY, dir), { recursive: true });
  }
});

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

function withPlanted<T>(files: Record<string, string>, probe: () => T): T {
  const written: string[] = [];
  try {
    for (const [rel, contents] of Object.entries(files)) {
      const full = path.join(COPY, rel);
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, contents, "utf8");
      written.push(full);
    }
    return probe();
  } finally {
    for (const full of written) rmSync(full, { force: true });
  }
}

/**
 * Plant both sides at once and ask the detector one question.
 *
 * Both at once rather than in turn, because that is the shape of the failure: the detector is given
 * two files that differ in one property and has to answer differently about them in a single pass.
 */
function runPair(pair: Pair, sees: (root: string) => string): PairResult {
  return withPlanted({ ...pair.positive.files, ...pair.negative.files }, () => {
    const reported = sees(COPY);
    return {
      reportsPositive: reported.includes(pair.positive.token),
      reportsNegative: reported.includes(pair.negative.token),
    };
  });
}

/** A detector that reports everything the pair planted — paths and contents alike. */
function reportsEverything(pair: Pair): (root: string) => string {
  const sides = [pair.positive.files, pair.negative.files];
  return () => sides.flatMap((f) => [...Object.keys(f), ...Object.values(f)]).join("\n");
}

describe("W292 every proved walk has a negative, and the register says which kind", () => {
  it("covers every `mutated_tree` entry, in both directions", () => {
    expect(negativeDiff()).toEqual({ unprobed: [], stale: [], unsupportedExemption: [] });
    expect(NEGATIVE_PROBES).toHaveLength(walkProven().length);
    expect(new Set(NEGATIVE_PROBES.map((p) => p.register)).size).toBe(NEGATIVE_PROBES.length);
  });

  it("drives here exactly the ones it says it drives here", () => {
    // The door between the register and this file. A probe declared `driven_here` with no pair in
    // the table is the register claiming work that is not done, and it is the likelier direction:
    // writing the sentence is cheaper than writing the fixture.
    const declared = NEGATIVE_PROBES.filter((p) => p.negative.kind === "driven_here").map((p) => p.register);
    const driven = [...PAIRS.map((p) => p.register), ...DRIVEN_SEPARATELY];
    expect(driven.sort()).toEqual([...declared].sort());
    expect(PAIRS.length).toBeGreaterThan(14);
  });

  it("makes each declared negative argue what a broad detector would do with it", () => {
    for (const probe of NEGATIVE_PROBES) {
      if (probe.negative.kind !== "driven_here") continue;
      expect(probe.negative.plants.length, `${probe.register} does not say what it plants`).toBeGreaterThan(20);
      expect(
        probe.negative.aBroadDetectorWouldReportIt.length,
        `${probe.register} does not say what a broad detector would get wrong`,
      ).toBeGreaterThan(150);
    }
  });

  it("resolves every citation to a test that still plants its negative", () => {
    // W258's rule, both halves. The `it(...)` title proves the test exists; the planted string
    // proves it is still the test that plants a NEGATIVE, which is the thing being cited.
    expect(unresolvedCitations(ROOT)).toEqual([]);
    const cited = NEGATIVE_PROBES.filter((p) => p.negative.kind === "already_driven");
    expect(cited.length, "no citation is made, so resolving them checks nothing").toBeGreaterThan(4);
  });

  it("reports a citation whose test has lost its negative", () => {
    // The other direction on the resolver, so a clean result is a fact rather than a shape.
    const broken = [
      {
        register: "src/quality/pins.ts",
        negative: {
          kind: "already_driven" as const,
          citation: "src/quality/pins.test.ts :: does not report a constant that is not pin-shaped",
          plants: "A_CONSTANT_THAT_IS_NOT_THERE",
        },
      },
      {
        register: "src/quality/pins.ts",
        negative: {
          kind: "already_driven" as const,
          citation: "src/quality/no-such-file.test.ts :: nothing",
          plants: "x",
        },
      },
    ];
    // W301 unified the vocabulary: "no such file" was this register's private wording for what
    // three other registers called something else, and the shared resolver's phrasing wins. The
    // `plants` half stays this register's own, because no other register asks that question.
    expect(unresolvedCitations(ROOT, broken)).toEqual([
      "src/quality/no-such-file.test.ts :: nothing: names a file that does not exist",
      "src/quality/pins.test.ts :: does not report a constant that is not pin-shaped — the test no longer plants `A_CONSTANT_THAT_IS_NOT_THERE`",
    ]);
  });

  it("grants the no-detector exemption only where the census itself says so", () => {
    // The arm that keeps the exemption from being an opt-out. Both directions: the two real ones
    // are supported by what the census says about them, and an entry that says nothing of the kind
    // cannot be exempted by writing the exemption here.
    const exempt = NEGATIVE_PROBES.filter((p) => p.negative.kind === "no_detector_of_its_own");
    expect(exempt.map((p) => p.register).sort()).toEqual([
      "src/quality/negative-probes.test.ts",
      "src/quality/page-suite.test.ts",
      "src/quality/register-census.test.ts",
    ]);
    for (const probe of exempt) {
      const entry = TREE_DERIVED_REGISTERS.find((r) => r.file === probe.register)!;
      expect(`${entry.derives} ${entry.checkedAgainst}`).toContain(EXEMPT_PHRASE);
    }
    const invented = negativeDiff(
      [{ file: "src/x.ts", derives: "d", checkedAgainst: "c", proof: { kind: "mutated_tree", mutation: "m" }, assertion: { kind: "carries_no_assertion" as const, claim: "a constructed register", why: "a fixture" }, }],
      [{ register: "src/x.ts", negative: { kind: "no_detector_of_its_own", why: "because" } }],
    );
    expect(invented.unsupportedExemption).toEqual(["src/x.ts"]);
  });
});

describe("W292 each pair, asked of the real detector", () => {
  for (const pair of PAIRS) {
    it(`${pair.register} reports the positive and refuses the negative`, () => {
      const result = runPair(pair, pair.sees);
      expect(result.reportsPositive, `${pair.register} did not see ${pair.positive.token} arrive`).toBe(true);
      expect(result.reportsNegative, `${pair.register} reported ${pair.negative.token}`).toBe(false);
      expect(discriminates(result)).toBe(true);
    });
  }

  it("leaves the copy in the tree's own shape", () => {
    // Every probe cleans up in a `finally`. Checked on a walk that spans the whole copy, because a
    // file left behind by one pair is a silent positive for the next.
    expect(walks.textFiles(COPY).map((f) => path.basename(f)).filter((f) => f.includes("w292-"))).toEqual([]);
    expect(walks.textFiles(ROOT).some((f) => f.includes("w292-pos") || f.includes("w292-neg"))).toBe(false);
  });
});

describe("W292 the same pairs, asked of a detector that reports everything", () => {
  it("passes every positive and fails every pair", () => {
    // THE GATE'S OWN SENTENCE, EXECUTED. `reportsEverything` is derived from each pair's own
    // fixture rather than from its tokens, so a pair whose token does not actually appear in what
    // it plants fails here rather than passing quietly.
    const failures: string[] = [];
    for (const pair of PAIRS) {
      const result = runPair(pair, reportsEverything(pair));
      expect(result.reportsPositive, `${pair.register}'s positive token is not in what it plants`).toBe(true);
      if (discriminates(result)) failures.push(pair.register);
    }
    expect(failures, "a pair a report-everything detector passes is not a pair").toEqual([]);
  });

  it("is a check the real detectors survive, which is what makes the line above mean something", () => {
    // Non-vacuity in the direction that matters: if `discriminates` were simply false for every
    // input, the assertion above would pass over a table of nonsense.
    const real = PAIRS.map((pair) => discriminates(runPair(pair, pair.sees)));
    expect(real.filter(Boolean)).toHaveLength(PAIRS.length);
  });
});

describe("W292 the route register's negative, which is a register rather than a file", () => {
  const ROUTE = "/w292-cov-probe";
  const FILES = { "app/w292-cov-probe/page.tsx": "export default function Probe() {\n  return null;\n}\n" };

  it("reports the new route as undeclared, and refuses it once the register declares it", () => {
    // One planted route, two registers, two answers. A `coverageDiff` that skipped the lookup would
    // report it both times — and would report all twenty-seven of the tree's served routes with it.
    const undeclared = withPlanted(FILES, () => coverageDiff(COPY).undeclared);
    expect(undeclared, "the coverage register did not see a new route").toContain(ROUTE);

    const declared: RouteCoverage[] = [
      { route: ROUTE, exercise: { kind: "refused", why: "a W292 probe, which no spec opens" } },
    ];
    const withRegister = withPlanted(FILES, () => coverageDiff(COPY, declared).undeclared);
    expect(withRegister, "a declared route was still reported undeclared").not.toContain(ROUTE);
  });

  it("leaves the probe route gone", () => {
    expect(coverageDiff(COPY).undeclared).toEqual([]);
  });
});

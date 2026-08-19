// W359 verify gate: "the stores each e2e spec's premise depends on enumerated and reset by it
// rather than by file order; a planted spec reading another's residue is reported; W346's
// suite-only failure driven as the case."
//
// THE LIVE ASSERTION IS ONE LINE and everything else is about whether it can fail. A register
// saying every spec resets what it reads is trivially green on a suite where the derivation
// returns nothing, so the walk is driven on a planted tree, the dependence rule is driven on the
// store-to-store edge that makes the naive answer a superset, and W346's own pre-fix spec is
// reconstructed and required to be reported.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  RESET_REGISTRY,
  RESIDUE_AT_W359,
  RESIDUE_BOUND,
  type SpecStore,
  mockResets,
  residueDefects,
  routeStores,
  specGaps,
  specMocks,
  specRoutes,
} from "./spec-stores";
import { withTree } from "./planting";

const ROOT = process.cwd();

describe("W359 every spec resets the stores its premise reads, in three directions", () => {
  it("passes, over the suite as it stands", () => {
    expect(residueDefects(ROOT)).toEqual([]);
  });

  it("reports a spec that reads a store nothing puts back", () => {
    // THE PLANTED RESIDUE CASE. A spec that visits a page reading a store and posts no reset is
    // answering about whatever ran before it, and that is what must be reported.
    const found = withTree(
      {
        "app/console/thing/page.tsx": 'import { readThing } from "@/thing/store";\nexport default function P() { return readThing(); }\n',
        "src/thing/store.ts": "export function readThing(): number {\n  return 1;\n}\n",
        "e2e/reader.spec.ts": 'test("walks", async ({ page }) => {\n  await page.goto("/console/thing");\n});\n',
      },
      (root) => residueDefects(root, [], ["e2e/reader.spec.ts"]),
    );
    expect(found).toEqual([
      {
        spec: "e2e/reader.spec.ts",
        store: "src/thing/store.ts",
        what: "reads a store it does not reset and nothing says why",
      },
    ]);
  });

  it("stays quiet once the same spec resets it, which is what makes the report mean anything", () => {
    const found = withTree(
      {
        "app/console/thing/page.tsx": 'import { readThing } from "@/thing/store";\nexport default function P() { return readThing(); }\n',
        "app/api/mock/thing/route.ts": 'import { resetThing } from "@/thing/store";\nexport async function POST() { return resetThing(); }\n',
        "src/thing/store.ts": "export function readThing(): number {\n  return 1;\n}\nexport function resetThing(): void {}\n",
        "e2e/reader.spec.ts":
          'test.beforeEach(async ({ request }) => {\n  await request.post("/api/mock/thing");\n});\n' +
          'test("walks", async ({ page }) => {\n  await page.goto("/console/thing");\n});\n',
      },
      (root) => residueDefects(root, [], ["e2e/reader.spec.ts"]),
    );
    expect(found).toEqual([]);
  });

  it("reports an argument for a gap the spec has since closed, which is the arm that reads as coverage", () => {
    const argued: SpecStore[] = [
      { spec: "e2e/ops.spec.ts", store: "src/ops/store.ts", why: "y".repeat(120) },
    ];
    expect(residueDefects(ROOT, argued, ["e2e/ops.spec.ts"])).toEqual([
      {
        spec: "e2e/ops.spec.ts",
        store: "src/ops/store.ts",
        what: "is argued here and the spec resets it, or no longer reads it",
      },
    ]);
  });

  it("reports an argument for a spec the suite no longer holds", () => {
    const argued: SpecStore[] = [
      { spec: "e2e/gone.spec.ts", store: "src/ops/store.ts", why: "y".repeat(120) },
    ];
    expect(residueDefects(ROOT, argued, [])).toEqual([
      {
        spec: "e2e/gone.spec.ts",
        store: "src/ops/store.ts",
        what: "is argued here and the suite no longer holds that spec",
      },
    ]);
  });
});

describe("W359 W346's failure, reconstructed", () => {
  // THE CASE THE UNIT COMES FROM. `waiting-path.spec.ts` passed alone and failed in the full suite
  // because it walked pages rendering the referral rail and reset only the console. It resets the
  // rail now, so the register is silent on it — which proves nothing on its own. This rebuilds the
  // spec as it stood BEFORE the fix and requires the register to name exactly what was missing.
  const live = readFileSync(path.join(ROOT, "e2e/waiting-path.spec.ts"), "utf8");

  it("is silent on the spec as it stands, and names the rail on the spec as it stood", () => {
    expect(specGaps(ROOT, "e2e/waiting-path.spec.ts")).toEqual([]);
    expect(specMocks(live), "the fix this reconstructs is not in the file").toContain("referrals");

    const beforeTheFix = live.replaceAll('  await request.post("/api/mock/referrals");\n', "");
    expect(
      specMocks(beforeTheFix),
      "the reconstruction still posts the reset it is supposed to be missing",
    ).not.toContain("referrals");

    // Resolved against THIS tree's pages and mock routes rather than a planted pair: the question
    // is what that spec, as it stood, would have been reported for against the product it walked.
    const reset = specMocks(beforeTheFix).flatMap((name) => mockResets(ROOT, name));
    const gaps = specRoutes(ROOT, beforeTheFix)
      .flatMap((route) => routeStores(ROOT, route))
      .filter((store) => !reset.includes(store));
    expect(gaps, "W346's missing reset is not what this register would have reported").toContain(
      "src/referrals/store.ts",
    );

    // AND THE ROUTES ONLY EXIST BECAUSE THE IMPORTED REGISTER IS READ. This spec calls
    // `goto(step.route)` over `WAITING_PATH`; reading literals alone returns the sign-in and setup
    // pages and would have found nothing, which is the half of `specRoutes` this case pays for.
    expect(specRoutes(ROOT, beforeTheFix)).toContain("/console/referrals");
    expect(beforeTheFix, "the routes are literals after all, so the register read is not load-bearing")
      .not.toContain('goto("/console/referrals")');
  });
});

describe("W359 the dependence is the page's own, not the store graph's", () => {
  it("does not attribute a store's neighbours to a page that reads it", () => {
    // THE SUPERSET W353 NAMED. `complaints/store.ts` imports `booking/store.ts` in the real tree,
    // and a closure that walks THROUGH a store reports every console page as depending on nearly
    // all of them — thirty gaps instead of eight, none of them worth reading.
    const found = withTree(
      {
        "app/console/near/page.tsx": 'import { readA } from "@/a/store";\nexport default function P() { return readA(); }\n',
        "src/a/store.ts": 'import { readB } from "@/b/store";\nexport function readA(): number {\n  return readB();\n}\n',
        "src/b/store.ts": "export function readB(): number {\n  return 1;\n}\n",
      },
      (root) => routeStores(root, "/console/near"),
    );
    expect(found).toEqual(["src/a/store.ts"]);
  });

  it("does not walk THROUGH W51's reset registry into every store it clears", () => {
    // A page importing it CLEARS every store. The registry's own path is not store-shaped, so what
    // the skip actually buys is the traversal: without it the walk passes through the barrel and
    // attributes every store in the tree to the demo launcher — the one page whose job is a clean
    // slate — making it the worst offender in the register. The planted barrel therefore IMPORTS a
    // store, which is the only arrangement where the skip can be told from its absence.
    const found = withTree(
      {
        "app/demo/page.tsx": 'import { resetAll } from "@/lib/stores";\nexport default function P() { return resetAll(); }\n',
        "src/lib/stores.ts": 'import { resetThing } from "@/thing/store";\nexport function resetAll(): void {\n  resetThing();\n}\n',
        "src/thing/store.ts": "export function resetThing(): void {}\n",
      },
      (root) => routeStores(root, "/demo"),
    );
    expect(found, "the walk passed through the reset registry and claimed what it clears").toEqual([]);
    expect(RESET_REGISTRY).toBe("src/lib/stores.ts");
  });

  it("reads a reset off a route's imports, and does not call a reader one", () => {
    const found = withTree(
      {
        "app/api/mock/thing/route.ts":
          'import { resetThing } from "@/thing/store";\nimport { peek } from "@/other/store";\n' +
          "export async function POST() { return resetThing(); }\nexport async function GET() { return peek(); }\n",
        "src/thing/store.ts": "export function resetThing(): void {}\n",
        "src/other/store.ts": "export function peek(): number {\n  return 1;\n}\n",
      },
      (root) => mockResets(root, "thing"),
    );
    expect(found, "a store a route only READS was counted as one it puts back").toEqual([
      "src/thing/store.ts",
    ]);
  });
});

describe("W359 the register says what it is and what it is not", () => {
  it("argues every row it holds", () => {
    for (const { spec, store, why } of RESIDUE_AT_W359) {
      expect(why.length, `${spec}::${store} is excused without an argument`).toBeGreaterThan(120);
      expect(spec).toMatch(/^e2e\/.+\.spec\.ts$/);
      expect(store).toMatch(/^src\/.+\/store\.ts$/);
    }
    // Named rather than counted: a duplicated pair is reported as the pair, and the assertion does
    // not compare a frozen register against its own length, which is W317's shape. Driven to a
    // duplicate first, because an empty list nobody has seen fill is a check nobody has seen work.
    const duplicated = (rows: readonly SpecStore[]): string[] => {
      const keys = rows.map((r) => `${r.spec}::${r.store}`);
      return keys.filter((key, i) => keys.indexOf(key) !== i);
    };
    const first = RESIDUE_AT_W359[0]!;
    expect(duplicated([...RESIDUE_AT_W359, first]), "the duplicate check cannot see a duplicate").toEqual([
      `${first.spec}::${first.store}`,
    ]);
    expect(
      duplicated(RESIDUE_AT_W359),
      "the same spec and store are argued twice, so one of the arguments is unread",
    ).toEqual([]);
  });

  it("states what a green run does not cover", () => {
    expect(RESIDUE_BOUND.length).toBeGreaterThan(600);
    expect(RESIDUE_BOUND).toContain("READS `goto` AND THE REGISTERS A SPEC ITERATES");
    expect(RESIDUE_BOUND).toContain("residue which AGREES");
  });
});

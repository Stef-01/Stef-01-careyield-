// W358 verify gate: "every e2e spec whose setup claims a state asserts that state before walking;
// W346's day-two premise driven as the case; a spec that walks a state it never established is
// reported."
//
// THE LIVE ASSERTION IS ONE LINE and the rest is about whether it can fail. A register saying a
// suite checks its premises is the easiest claim here to write vacuously: nothing about a list of
// sentences requires a spec to have changed. So the staging derivation is driven on constructed
// sources — a helper that saves against one that only navigates — and the `asserted` claim is
// resolved against each file rather than trusted.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  PREMISES_AT_W358,
  PREMISE_BOUND,
  PREMISE_HELPER,
  type SpecPremise,
  assertsItsPremise,
  premiseDefects,
  stagedSpecs,
  stagesAPremise,
} from "./spec-premises";
import { withTree } from "./planting";

const ROOT = process.cwd();
const STAGED = stagedSpecs(ROOT);

describe("W358 every spec that stages a premise is tracked, in three directions", () => {
  it("passes, over the suite as it stands", () => {
    expect(premiseDefects(ROOT)).toEqual([]);
  });

  it("derives the population from each helper's shape rather than from a list", () => {
    expect(STAGED.length).toBeGreaterThan(15);
    // AND NAMES A SPEC THAT MUST BE OUTSIDE IT. A detector returning every spec would satisfy a
    // floor and a path shape both, which is the failure direction Q28 is about: over-including
    // reads exactly like working. `landing.spec.ts` visits a public page and stages nothing, so
    // its presence here would mean the helper test above is measuring nothing.
    expect(STAGED, "the staging detector claimed a spec that stages nothing").not.toContain(
      "e2e/landing.spec.ts",
    );
    for (const spec of STAGED) expect(spec).toMatch(/^e2e\/.+\.spec\.ts$/);
  });

  it("walks a tree it was handed, and reports the staging spec in it and not the other", () => {
    // W267'S PROOF, and the reason it is here rather than on the constructed strings above: those
    // drive `stagesAPremise`, which is the membership rule. They say nothing about whether the
    // WALK finds a file at all — a `stagedSpecs` that returned nothing would pass every one of
    // them, and the register would report no defects forever while reading an empty population.
    const found = withTree(
      {
        "e2e/stages.spec.ts":
          'async function onboard(page) {\n  await page.getByLabel("Practice name").fill("X");\n' +
          '  await page.getByLabel("Holdout share (%)").fill("10");\n' +
          '  await page.getByRole("button", { name: "Create practice" }).click();\n}\n',
        "e2e/navigates.spec.ts":
          'async function open(page) {\n  await page.goto("/console");\n' +
          '  await page.getByRole("link", { name: "Capacity" }).click();\n}\n',
      },
      (root) => stagedSpecs(root),
    );
    expect(found).toEqual(["e2e/stages.spec.ts"]);
  });

  it("tells a helper that SAVES from one that only navigates, which is the whole distinction", () => {
    // `waitForURL` is the assertion for arrival. What it cannot check is that data landed, so a
    // helper that fills and saves is staging something and one that only clicks through is not.
    const saves = [
      'async function onboard(page) {',
      '  await page.getByLabel("Practice name").fill("X");',
      '  await page.getByLabel("Holdout share (%)").fill("10");',
      '  await page.getByRole("button", { name: "Create practice" }).click();',
      '  await page.waitForURL(/\\/console$/);',
      "}",
    ].join("\n");
    const navigates = [
      "async function open(page) {",
      '  await page.goto("/console");',
      '  await page.getByRole("link", { name: "Capacity" }).click();',
      '  await page.waitForURL(/\\/console\\/capacity$/);',
      "}",
    ].join("\n");
    // AND THE PAIR THAT ISOLATES THE SAVE, which the first two do not: this one fills exactly as
    // many fields and never commits them, so only the button tells them apart. Without it the
    // `saves` half of the rule could be deleted and every test here would still pass — the live
    // tree happens to hold no fills-without-save helper, so nothing else would notice.
    const fillsWithoutSaving = [
      "async function filter(page) {",
      '  await page.getByLabel("From").fill("2026-01-01");',
      '  await page.getByLabel("To").fill("2026-06-30");',
      '  await page.getByRole("button", { name: "Apply filter" }).click();',
      "}",
    ].join("\n");
    expect(stagesAPremise(saves), "a helper that fills and saves was read as staging nothing").toBe(true);
    expect(stagesAPremise(navigates), "a helper that only navigates was read as staging a premise").toBe(false);
    expect(
      stagesAPremise(fillsWithoutSaving),
      "a helper that fills without committing was read as staging a premise",
    ).toBe(false);
  });

  it("reads a premise check through the store, and does not accept a page assertion for one", () => {
    expect(assertsItsPremise('await expectPremise(request, { named: "X" });')).toBe(true);
    expect(assertsItsPremise('const s = await request.get("/api/mock/console");')).toBe(true);
    // The failure this unit is about: the setup drove the UI, so asking the UI is the same door.
    expect(
      assertsItsPremise('await expect(page.getByTestId("practice-name")).toBeVisible();'),
      "a page assertion was accepted as a premise check",
    ).toBe(false);
  });

  it("reports a spec that stages a premise and nothing tracks", () => {
    const arriving = [...STAGED, "e2e/planted.spec.ts"];
    expect(premiseDefects(ROOT, PREMISES_AT_W358, arriving)).toEqual([
      {
        spec: "e2e/planted.spec.ts",
        what: "stages a premise through the browser and nothing says whether it checks it",
      },
    ]);
  });

  it("reports a tracked spec that no longer stages one, which is the other direction", () => {
    const gone = STAGED.filter((s) => s !== "e2e/outreach.spec.ts");
    expect(premiseDefects(ROOT, PREMISES_AT_W358, gone)).toEqual([
      { spec: "e2e/outreach.spec.ts", what: "is tracked here and no longer stages a premise" },
    ]);
  });

  it("reports a row claiming to assert a premise whose file reads nothing back", () => {
    // The arm that keeps a row from recording a habit the file has lost. `landing.spec.ts` stages
    // nothing and reads nothing, so a row claiming it asserts is claiming both halves falsely —
    // the staging arm reports it too, and the pair is what the sort order makes legible.
    const lying: SpecPremise[] = [
      { spec: "e2e/landing.spec.ts", standing: { kind: "asserted", how: "y".repeat(80) } },
    ];
    expect(premiseDefects(ROOT, lying, ["e2e/landing.spec.ts"])).toEqual([
      { spec: "e2e/landing.spec.ts", what: "is declared to assert its premise and reads nothing back" },
    ]);
  });

  it("says nothing about a DECLARED row that reads nothing back, because that is its claim", () => {
    const argued: SpecPremise[] = [
      { spec: "e2e/landing.spec.ts", standing: { kind: "declared", why: "y".repeat(80) } },
    ];
    expect(premiseDefects(ROOT, argued, ["e2e/landing.spec.ts"])).toEqual([]);
  });
});

describe("W358 the suite really does read its premises back", () => {
  it("routes every staged spec through one helper rather than nine copies", () => {
    expect(readFileSync(path.join(ROOT, PREMISE_HELPER), "utf8")).toContain("export async function expectPremise");
    const throughHelper = STAGED.filter((spec) =>
      /expectPremise\s*\(/.test(readFileSync(path.join(ROOT, spec), "utf8")),
    );
    // Nine were changed by this unit; the rest read back in their own words, which is why the
    // register accepts either and this assertion is a floor rather than an equality.
    expect(throughHelper.length).toBeGreaterThan(8);
  });

  it("gives every row an argument, and holds W346's case by name", () => {
    for (const { spec, standing } of PREMISES_AT_W358) {
      const text = standing.kind === "asserted" ? standing.how : standing.why;
      expect(text.length, `${spec} is recorded without an argument`).toBeGreaterThan(80);
    }
    const w346 = PREMISES_AT_W358.find((p) => p.spec === "e2e/waiting-path.spec.ts")!;
    expect(w346.standing.kind).toBe("asserted");
    expect((w346.standing as { how: string }).how).toContain("setupCompletedAt");
  });

  it("states what the register does not prove", () => {
    expect(PREMISE_BOUND.length).toBeGreaterThan(600);
    expect(PREMISE_BOUND).toContain("NOT THAT EVERY WALK IN IT DOES");
    expect(PREMISE_BOUND).toContain("intermittently");
  });
});

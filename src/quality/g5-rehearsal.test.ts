// W264 verify gate: "W119's two-person workflow driven end to end on synthetic content,
// including the refusals; `SHIPPED_PATHWAYS` stays empty and a test asserts it."
//
// TWO CLAUSES, TWO KINDS OF ASSERTION, AND THEY PULL AGAINST EACH OTHER. "Driven end to end"
// means the walk reaches the far side of the gate and mints a `UsablePathway`; "`SHIPPED_PATHWAYS`
// stays empty" means nothing in the product has been through it. Both hold at once because the
// workflow is a pure function and the catalogue is a value, so the assertions here are split the
// same way: the walk is checked against its declared stages, and the shipped registers are
// checked to be untouched by it — before, after, and in the console's registry beside them.
//
// "INCLUDING THE REFUSALS" IS THE LARGER HALF. Nine refusals encode nine decisions about what a
// sign-off has to be, so every one is arranged and driven, and the comparison is against
// `PATHWAY_REFUSAL_COPY`'s own keys in both directions rather than against a list written here.
//
// The last thing this file checks is the fixture rather than the code: W121's clinical-vocabulary
// linter runs over the synthetic criteria, because content that read like a real pathway would
// be the G5 act itself sitting in the tree with a sign-off recorded against it.

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ALL_SIGN_OFF_STAGES,
  REFUSED_G5_REHEARSAL_SHAPES,
  SYNTHETIC_CRITERIA,
  SYNTHETIC_PATHWAY_ID,
  WHAT_THIS_DOES_NOT_PROVE,
  driveEveryRefusal,
  rehearseSignOff,
  signOffStagesReached,
} from "./g5-rehearsal";
import { PATHWAY_REFUSAL_COPY, SHIPPED_ATTESTATIONS } from "@/pathways/approval";
import { SHIPPED_PATHWAYS } from "@/pathways/versioning";
import {
  addPathwayAttestations,
  addPathwayEvents,
  getPathwayAttestations,
  getPathwayEvents,
  resetPathwayRegistry,
} from "@/pathways/registry";
import { lintEscalationText } from "@/registers/escalation";

const ROOT = process.cwd();
const SOURCE = readFileSync(path.join(ROOT, "src", "quality", "g5-rehearsal.ts"), "utf8");

beforeEach(() => {
  resetPathwayRegistry();
});

describe("W264 the walk reaches every stage, and a skip is visible", () => {
  it("records every declared stage, in order, with nothing missing or invented", () => {
    const rehearsal = rehearseSignOff();
    expect(
      rehearsal.walked,
      rehearsal.walked ? "" : `stopped at ${rehearsal.stoppedAt}: ${rehearsal.why}`,
    ).toBe(true);
    expect(signOffStagesReached(rehearsal)).toEqual([...ALL_SIGN_OFF_STAGES]);
  });

  it("gives every stage something it actually observed", () => {
    // A stage whose `observed` is empty is a stage somebody added to the list rather than to the
    // walk, and the check above would then be counting names.
    for (const stage of rehearseSignOff().stages) {
      expect(stage.observed.length, `${stage.stage} observed nothing`).toBeGreaterThan(10);
      expect(stage.observed, `${stage.stage} observed a placeholder`).not.toMatch(
        /^(ok|done|true|pass)$/i,
      );
    }
  });

  it("refuses for a DIFFERENT reason at each of the two gate stages", () => {
    // Non-vacuity for the walk's middle. If both refusal stages said the same thing, the trace
    // would be showing that the gate refuses rather than that the walk moved through it — and a
    // version stuck at "not_reviewed" would pass a check that only asked for a refusal.
    const stages = rehearseSignOff().stages;
    const unsigned = stages.find((s) => s.stage === "unsigned_version_refused")!;
    const halfSigned = stages.find((s) => s.stage === "sign_off_still_missing")!;
    expect(unsigned.observed).toContain("not_reviewed");
    expect(halfSigned.observed).toContain("not_signed_off");
    expect(unsigned.observed).not.toEqual(halfSigned.observed);
  });

  it("names three different people across drafting, review and sign-off", () => {
    // The two stages exist to ask different questions, and one person answering both has
    // collapsed them back into one whatever the record says.
    const stages = rehearseSignOff().stages;
    const review = stages.find((s) => s.stage === "specialist_review_recorded")!;
    const signOff = stages.find((s) => s.stage === "founder_sign_off_recorded")!;
    const usable = stages.find((s) => s.stage === "version_became_usable")!;
    const emails = new Set(
      [review.observed, signOff.observed, usable.observed]
        .flatMap((o) => o.match(/[\w.]+@[\w.]+/g) ?? [])
        .map((e) => e.toLowerCase()),
    );
    expect(emails.size, "the walk used fewer than three distinct people").toBeGreaterThanOrEqual(3);
  });

  it("hands the branded version to W120, which is what sign-off is for", () => {
    const evaluated = rehearseSignOff().stages.find((s) => s.stage === "usable_version_evaluated")!;
    // The facts are arranged to meet the criteria, so a verdict of anything else would mean the
    // brand travelled but the content did not.
    expect(evaluated.observed).toContain("criteria_met");
  });
});

describe("W264 nothing in the product was signed", () => {
  it("leaves both shipped registers empty — the gate's own words", () => {
    rehearseSignOff();
    expect(SHIPPED_PATHWAYS, "a pathway shipped").toEqual([]);
    expect(SHIPPED_ATTESTATIONS, "an attestation shipped").toEqual([]);
  });

  it("never reaches the registry the console reads", () => {
    // W127's registry seeds from the shipped registers and is what the sign-off dashboard shows,
    // so a rehearsal that seeded it would put a signed-looking pathway on a real surface.
    const rehearsal = rehearseSignOff();
    expect(getPathwayEvents()).toHaveLength(0);
    expect(getPathwayAttestations()).toHaveLength(0);
    const stage = rehearsal.stages.find((s) => s.stage === "registry_untouched")!;
    expect(stage.observed).toContain("events 0 to 0");
    expect(stage.observed).toContain("attestations 0 to 0");
  });

  it("can hold an event and an attestation at all, which is what makes those zeros a fact", () => {
    // W293 FOUND THE TWO ZEROS ABOVE UNEVIDENCED, and they were the only two in the tree. The
    // claim they make is that the rehearsal does not reach W127's registry — a control — and
    // nothing anywhere had ever shown that registry holding anything, so a getter that returned
    // `[]` under all conditions would have satisfied both of them forever.
    //
    // Seeded through the same door setup and the mock seed route use, with the rehearsal's own
    // synthetic content, and `beforeEach` clears it before the next test. The shipped registers
    // are not touched: seeding the in-memory registry is not shipping a pathway, which is the
    // distinction the describe above this one is about.
    const at = "2026-08-17T00:00Z";
    const versionHash = "w293-witness-hash";
    addPathwayEvents([
      { pathwayId: SYNTHETIC_PATHWAY_ID, kind: "version_drafted", versionHash, at, byEmail: "builder@example.test", criteria: SYNTHETIC_CRITERIA },
    ]);
    addPathwayAttestations([
      {
        pathwayId: SYNTHETIC_PATHWAY_ID,
        versionHash,
        kind: "specialist_review",
        byEmail: "reviewer@example.test",
        at,
        finding: "Synthetic rehearsal content; nothing here was reviewed clinically.",
      },
    ]);
    expect(getPathwayEvents()).toHaveLength(1);
    expect(getPathwayAttestations()).toHaveLength(1);
  });

  it("hands no branded value back to a caller", () => {
    // `UsablePathway` is the type G5 exists to withhold. A module that returns one is a source of
    // it reachable by an import from anywhere, so the walk uses it and drops it.
    expect(SOURCE).not.toMatch(/as (unknown as )?UsablePathway/);
    expect(SOURCE).not.toMatch(/\bpathway:\s*UsablePathway/);
    expect(SOURCE).not.toMatch(/export\s+(const|function|type|interface)\s+\w*[Uu]sable/);
  });

  it("is imported by nothing the product ships", () => {
    // The one route by which synthetic pathway content could reach a page. Checked by walking
    // the tree rather than by trusting the module note.
    const importers: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next") continue;
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry) && !/\.(test|spec)\.tsx?$/.test(entry)) {
          if (/["']@?[./\w-]*g5-rehearsal["']/.test(readFileSync(full, "utf8"))) {
            importers.push(path.relative(ROOT, full));
          }
        }
      }
    };
    for (const root of ["src", "app"]) walk(path.join(ROOT, root));
    expect(importers, "a shipped module imports the rehearsal").toEqual([]);
  });
});

describe("W264 every refusal is driven, not just the first", () => {
  const drives = driveEveryRefusal();

  it("covers exactly the refusals the workflow declares, both directions", () => {
    // Against `PATHWAY_REFUSAL_COPY`'s keys rather than a list written here: the copy map is
    // typed `Record<PathwayRefusal, string>`, so it cannot drift from the union.
    expect(Object.keys(drives).sort()).toEqual(Object.keys(PATHWAY_REFUSAL_COPY).sort());
    expect(Object.keys(drives)).toHaveLength(9);
  });

  it("gets the refusal each scenario claims to arrange", () => {
    // The drives record what the workflow SAID; the comparison lives here. A scenario that stops
    // arranging what its name claims surfaces as the wrong refusal instead of as a pass.
    for (const [reason, drive] of Object.entries(drives)) {
      expect(drive.observed, `${reason}: ${drive.scenario}`).toBe(reason);
    }
  });

  it("explains every scenario rather than naming it", () => {
    for (const [reason, drive] of Object.entries(drives)) {
      expect(drive.scenario.length, `${reason} is driven without an explanation`).toBeGreaterThan(40);
      expect(drive.scenario, `${reason} restates its own key`).not.toContain(reason);
    }
  });

  it("arranges nine distinct scenarios, not one scenario nine times", () => {
    const scenarios = new Set(Object.values(drives).map((d) => d.scenario));
    expect(scenarios.size).toBe(9);
  });
});

describe("W264 the content signed off means nothing", () => {
  const criteria = [
    ...SYNTHETIC_CRITERIA.inclusion,
    ...SYNTHETIC_CRITERIA.exclusion,
    ...SYNTHETIC_CRITERIA.escalation,
  ];

  it("carries a criterion on every list, so the walk signs a whole document", () => {
    expect(SYNTHETIC_CRITERIA.inclusion.length).toBeGreaterThan(0);
    expect(SYNTHETIC_CRITERIA.exclusion.length).toBeGreaterThan(0);
    expect(SYNTHETIC_CRITERIA.escalation.length).toBeGreaterThan(0);
  });

  it("names only codes that correspond to nothing", () => {
    for (const c of criteria) {
      expect(c.factCode, "a fact code is not marked synthetic").toMatch(/^synthetic\.fact\./);
    }
    expect(SYNTHETIC_PATHWAY_ID).toMatch(/^synthetic\./);
  });

  it("passes W121's clinical-vocabulary linter, rather than being assumed harmless", () => {
    // The fixture is the dangerous part of a G5 rehearsal: content that read like a real pathway
    // would be the act the gate withholds, performed by a builder with no standing to perform it.
    for (const c of criteria) {
      expect(lintEscalationText(c.rationale), `${c.factCode} carries clinical language`).toEqual([]);
    }
    expect(lintEscalationText(SYNTHETIC_PATHWAY_ID)).toEqual([]);
  });

  it("proves the linter would object to content that DID read clinically", () => {
    // Non-vacuity for the check above: a linter that passed everything would make it decoration.
    expect(lintEscalationText("Patients with uncontrolled results should be seen urgently.")).not.toEqual(
      [],
    );
  });

  it("says in each rationale that it stands for nothing", () => {
    for (const c of criteria) {
      expect(c.rationale.toLowerCase(), `${c.factCode} reads as real content`).toContain("nothing");
    }
  });
});

describe("W264 what it does not prove is on the module", () => {
  it("says the mechanism was never the obstacle", () => {
    expect(WHAT_THIS_DOES_NOT_PROVE).toHaveLength(3);
    expect(WHAT_THIS_DOES_NOT_PROVE[0]).toContain("qualified");
    expect(WHAT_THIS_DOES_NOT_PROVE[2]).toContain("W161");
    for (const line of WHAT_THIS_DOES_NOT_PROVE) {
      expect(line.length).toBeGreaterThan(80);
    }
  });

  it("names the six shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_G5_REHEARSAL_SHAPES).sort()).toEqual([
      "asserting_no_usable_pathway_can_exist",
      "asserting_the_refusals_inside_the_drive",
      "exporting_the_usable_pathway",
      "seeding_the_registry",
      "stopping_at_the_first_refusal",
      "writing_plausible_clinical_criteria",
    ]);
    for (const [name, why] of Object.entries(REFUSED_G5_REHEARSAL_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_G5_REHEARSAL_SHAPES.asserting_no_usable_pathway_can_exist).toContain("W56");
  });

  it("reads no clock and contacts nothing", () => {
    expect(SOURCE).not.toMatch(/new Date\(\)|Date\.now\(\)|\bfetch\(/);
  });
});

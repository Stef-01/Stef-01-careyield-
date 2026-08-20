// W200 verify gate: the five rail properties are re-derived and enforced, and the declared copy
// surface is checked against the tree in both directions.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EDUCATION_COPY_MODULES, lintEducationCopy } from "@/education/advice-lint";
import {
  ACCEPTED_COPY_FINDINGS,
  type CopyFinding,
  OPERATOR_COPY_SURFACES,
  RAIL_PROPERTIES,
  Y4_FIRST_UNIT,
  copyTexts,
  lintOperatorCopy,
  unacceptedCopy,
} from "./cdss-boundary";
import { copySurfaceMembers } from "./copy-y6";

const SRC = path.join(__dirname, "..");

/**
 * Every Y4 module, read off the tree.
 *
 * Membership comes from each module's own `// W<n>` header rather than a list here, so this
 * cannot agree with the register by construction — which is the failure W102 exists against.
 */
function y4Modules(): string[] {
  // W270 REPLACED THE BODY AND KEPT THE NAME'S JOB. Membership was `unit >= Y4_FIRST_UNIT`, which
  // is a starting point for future modules AND a ceiling on the past: a pre-floor module could not
  // be added to this register even deliberately, because this function would then report it as a
  // module that is not one. A control that cannot be extended to where the copy is, is a wall
  // rather than a floor. `copySurfaceMembers` is the same rule plus a declared door.
  return copySurfaceMembers(path.join(SRC, ".."));
}

/**
 * The namespaces, statically written because vite cannot resolve a computed import path.
 *
 * A hand-written map is exactly the thing this unit found wrong with W150's registry, so it is
 * checked against `y4Modules()` below and a Y4 module added tomorrow fails here until it is added.
 */
const NAMESPACES: Record<string, () => Promise<Record<string, unknown>>> = {
  "src/capacity/opening.ts": () => import("@/capacity/opening"),
  "src/capacity/calendar.ts": () => import("@/capacity/calendar"),
  "src/capacity/attribution.ts": () => import("@/capacity/attribution"),
  "src/interop/conformance.ts": () => import("@/interop/conformance"),
  "src/verticals/assembly.ts": () => import("@/verticals/assembly"),
  "src/verticals/respiratory.ts": () => import("@/verticals/respiratory"),
  "src/verticals/womens-health.ts": () => import("@/verticals/womens-health"),
  "src/interop/credentials.ts": () => import("@/interop/credentials"),
  "src/interop/exchange-state.ts": () => import("@/interop/exchange-state"),
  "src/interop/disclosure-ledger.ts": () => import("@/interop/disclosure-ledger"),
  "src/interop/fhir.ts": () => import("@/interop/fhir"),
  "src/interop/terminology.ts": () => import("@/interop/terminology"),
  "src/api/surface.ts": () => import("@/api/surface"),
  "src/api/refusals.ts": () => import("@/api/refusals"),
  "src/api/scopes.ts": () => import("@/api/scopes"),
  "src/interop/console.ts": () => import("@/interop/console"),
  "src/interop/consent-to-disclose.ts": () => import("@/interop/consent-to-disclose"),
  "src/capacity/console.ts": () => import("@/capacity/console"),
  "src/capacity/coupling.ts": () => import("@/capacity/coupling"),
  "src/capacity/forecast.ts": () => import("@/capacity/forecast"),
  "src/compliance/cdss-boundary.ts": () => import("./cdss-boundary"),
  "src/compliance/rail-y5.ts": () => import("./rail-y5"),
  "src/compliance/composed-copy.ts": () => import("./composed-copy"),
  "src/compliance/copy-y6.ts": () => import("./copy-y6"),
  "src/console/zero-states.ts": () => import("@/console/zero-states"),
  "src/console/results-copy.ts": () => import("@/console/results-copy"),
  "src/pathways/approval.ts": () => import("@/pathways/approval"),
  "src/registers/escalation.ts": () => import("@/registers/escalation"),
  "src/audit/usefulness.ts": () => import("@/audit/usefulness"),
  "src/quality/gate-readiness.ts": () => import("@/quality/gate-readiness"),
  "src/quality/g1-rehearsal.ts": () => import("@/quality/g1-rehearsal"),
  "src/quality/g5-rehearsal.ts": () => import("@/quality/g5-rehearsal"),
  "src/security/page-reach.ts": () => import("@/security/page-reach"),
  "src/sim/fleet-y5.ts": () => import("@/sim/fleet-y5"),
  "src/compliance/public-surfaces.ts": () => import("@/compliance/public-surfaces"),
  "src/directory/copy-lint.ts": () => import("@/directory/copy-lint"),
  "src/directory/correction.ts": () => import("@/directory/correction"),
  "src/directory/disclosure.ts": () => import("@/directory/disclosure"),
  "src/directory/fees.ts": () => import("@/directory/fees"),
  "src/directory/membership.ts": () => import("@/directory/membership"),
  "src/directory/profile.ts": () => import("@/directory/profile"),
  "src/directory/render.ts": () => import("@/directory/render"),
  "src/directory/search.ts": () => import("@/directory/search"),
  "src/engine/arm-stability.ts": () => import("@/engine/arm-stability"),
  "src/matching/match.ts": () => import("@/matching/match"),
  "src/ops/silence.ts": () => import("@/ops/silence"),
  "src/outcomes/agreement.ts": () => import("@/outcomes/agreement"),
  "src/outcomes/audit-export.ts": () => import("@/outcomes/audit-export"),
  "src/outcomes/attribution-v2.ts": () => import("@/outcomes/attribution-v2"),
  "src/outcomes/dashboard.ts": () => import("@/outcomes/dashboard"),
  "src/outcomes/escalation-monitor.ts": () => import("@/outcomes/escalation-monitor"),
  "src/outcomes/model.ts": () => import("@/outcomes/model"),
  "src/outcomes/response-graph.ts": () => import("@/outcomes/response-graph"),
  "src/outcomes/time-to-escalation.ts": () => import("@/outcomes/time-to-escalation"),
  "src/privacy/console-export.ts": () => import("@/privacy/console-export"),
  "src/privacy/automated-decisions.ts": () => import("@/privacy/automated-decisions"),
  "src/quality/latent-findings.ts": () => import("@/quality/latent-findings"),
  "src/quality/latent-y5.ts": () => import("@/quality/latent-y5"),
  "src/quality/ranker-behaviour.ts": () => import("@/quality/ranker-behaviour"),
  "src/quality/unit-headers.ts": () => import("@/quality/unit-headers"),
  "src/quality/page-suite.ts": () => import("@/quality/page-suite"),
  "src/quality/hardening-q22.ts": () => import("@/quality/hardening-q22"),
  "src/quality/review-w279.ts": () => import("@/quality/review-w279"),
  "src/quality/pins.ts": () => import("@/quality/pins"),
  "src/quality/negative-probes.ts": () => import("@/quality/negative-probes"),
  "src/quality/empty-list-sweep.ts": () => import("@/quality/empty-list-sweep"),
  "src/quality/mutation-sampling.ts": () => import("@/quality/mutation-sampling"),
  "src/quality/hardening-q23.ts": () => import("@/quality/hardening-q23"),
  "src/quality/citations.ts": () => import("@/quality/citations"),
  "src/quality/planting.ts": () => import("@/quality/planting"),
  "src/quality/self-defeating.ts": () => import("@/quality/self-defeating"),
  "src/quality/closing-state.ts": () => import("@/quality/closing-state"),
  "src/quality/close-gate.ts": () => import("@/quality/close-gate"),
  "src/quality/instant.ts": () => import("@/quality/instant"),
  "src/quality/deferrals.ts": () => import("@/quality/deferrals"),
  "src/quality/quarter-mutants.ts": () => import("@/quality/quarter-mutants"),
  "src/quality/dossier-derived.ts": () => import("@/quality/dossier-derived"),
  "src/quality/unread-bounds.ts": () => import("@/quality/unread-bounds"),
  "src/quality/private-copies.ts": () => import("@/quality/private-copies"),
  "src/quality/typed-names.ts": () => import("@/quality/typed-names"),
  "src/quality/hardening-q26.ts": () => import("@/quality/hardening-q26"),
  "src/quality/timelines.ts": () => import("@/quality/timelines"),
  "src/quality/horizon-claims.ts": () => import("@/quality/horizon-claims"),
  "src/quality/failure-direction.ts": () => import("@/quality/failure-direction"),
  "src/quality/flattering-numbers.ts": () => import("@/quality/flattering-numbers"),
  "src/quality/quarter-mutants-q28.ts": () => import("@/quality/quarter-mutants-q28"),
  "src/quality/close-sensitivity.ts": () => import("@/quality/close-sensitivity"),
  "src/quality/welded-comparisons.ts": () => import("@/quality/welded-comparisons"),
  "src/quality/derivable-lists.ts": () => import("@/quality/derivable-lists"),
  "src/quality/hardening-q28.ts": () => import("@/quality/hardening-q28"),
  "src/quality/exemption-reach.ts": () => import("@/quality/exemption-reach"),
  "src/quality/spelling-markers.ts": () => import("@/quality/spelling-markers"),
  "src/quality/shared-excuses.ts": () => import("@/quality/shared-excuses"),
  "src/quality/superset.ts": () => import("@/quality/superset"),
  "src/quality/assertion-vocabulary.ts": () => import("@/quality/assertion-vocabulary"),
  "src/quality/hardening-q24.ts": () => import("@/quality/hardening-q24"),
  "src/founder/outstanding.ts": () => import("@/founder/outstanding"),
  "src/quality/manifest.ts": () => import("@/quality/manifest"),
  "src/quality/register-counts.ts": () => import("@/quality/register-counts"),
  "src/demo/clinicians.ts": () => import("@/demo/clinicians"),
  "src/demo/care-archetypes.ts": () => import("@/demo/care-archetypes"),
  "src/interest/types.ts": () => import("@/interest/types"),
  "src/interest/store.ts": () => import("@/interest/store"),
  "src/quality/tree-walks.ts": () => import("@/quality/tree-walks"),
  "src/quality/blocked-surface.ts": () => import("@/quality/blocked-surface"),
  "src/quality/route-coverage.ts": () => import("@/quality/route-coverage"),
  "src/quality/refusal-branches.ts": () => import("@/quality/refusal-branches"),
  "src/quality/tautology-sweep.ts": () => import("@/quality/tautology-sweep"),
  "src/quality/assertion-drives.ts": () => import("@/quality/assertion-drives"),
  "src/quality/acceptances.ts": () => import("@/quality/acceptances"),
  "src/quality/blind-spots.ts": () => import("@/quality/blind-spots"),
  "src/quality/bounds.ts": () => import("@/quality/bounds"),
  "src/quality/declaration-tax.ts": () => import("@/quality/declaration-tax"),
  "src/quality/scan-text.ts": () => import("@/quality/scan-text"),
  "src/console/gates.ts": () => import("@/console/gates"),
  "src/demo/path.ts": () => import("@/demo/path"),
  "src/founder/second-reading.ts": () => import("@/founder/second-reading"),
  "src/quality/claim-classes.ts": () => import("@/quality/claim-classes"),
  "src/quality/repository-clean.ts": () => import("@/quality/repository-clean"),
  "src/quality/self-ending.ts": () => import("@/quality/self-ending"),
  "src/quality/unrun.ts": () => import("@/quality/unrun"),
  "src/quality/controls.ts": () => import("@/quality/controls"),
  "src/quality/escape-hatches.ts": () => import("@/quality/escape-hatches"),
  "src/quality/unasked-facts.ts": () => import("@/quality/unasked-facts"),
  "src/quality/founder-page-facts.ts": () => import("@/quality/founder-page-facts"),
  "src/console/waiting.ts": () => import("@/console/waiting"),
  "src/quality/quarter-mutants-q26.ts": () => import("@/quality/quarter-mutants-q26"),
  "src/quality/unapplied-remedies.ts": () => import("@/quality/unapplied-remedies"),
  "src/quality/spec-premises.ts": () => import("@/quality/spec-premises"),
  "src/quality/spec-stores.ts": () => import("@/quality/spec-stores"),
  "src/console/zero-meaning.ts": () => import("@/console/zero-meaning"),
  "src/quality/defaulted-registers.ts": () => import("@/quality/defaulted-registers"),
  "src/quality/quarter-mutants-q27.ts": () => import("@/quality/quarter-mutants-q27"),
  "src/quality/horizon-directions.ts": () => import("@/quality/horizon-directions"),
  "src/quality/populations.ts": () => import("@/quality/populations"),
  "src/quality/horizon-q29-gate.ts": () => import("@/quality/horizon-q29-gate"),
  "src/console/rendered-zeros.ts": () => import("@/console/rendered-zeros"),
  "src/quality/hook-reach.ts": () => import("@/quality/hook-reach"),
  "src/quality/import-cycles.ts": () => import("@/quality/import-cycles"),
  "src/quality/moments.ts": () => import("@/quality/moments"),
  "src/quality/run-residue.ts": () => import("@/quality/run-residue"),
  "src/quality/patient-populations.ts": () => import("@/quality/patient-populations"),
  "src/quality/reached-pages.ts": () => import("@/quality/reached-pages"),
  "src/quality/empty-populations.ts": () => import("@/quality/empty-populations"),
  "src/quality/subject-and-walk.ts": () => import("@/quality/subject-and-walk"),
  "src/quality/hardening-q27.ts": () => import("@/quality/hardening-q27"),
  "src/quality/hardening-q25.ts": () => import("@/quality/hardening-q25"),
  "src/console/setup-gaps.ts": () => import("@/console/setup-gaps"),
  "src/quality/prose-numbers.ts": () => import("@/quality/prose-numbers"),
  "src/quality/self-reference.ts": () => import("@/quality/self-reference"),
  "src/quality/register-census.ts": () => import("@/quality/register-census"),
  "src/quality/order-independence.ts": () => import("@/quality/order-independence"),
  "src/quality/order-regressions.ts": () => import("@/quality/order-regressions"),
  "src/reporting/model.ts": () => import("@/reporting/model"),
  "src/reporting/report.ts": () => import("@/reporting/report"),
  "src/reporting/retention.ts": () => import("@/reporting/retention"),
  "src/reporting/suppression.ts": () => import("@/reporting/suppression"),
  "src/matching/explain.ts": () => import("@/matching/explain"),
  "src/outcomes/counterfactual.ts": () => import("@/outcomes/counterfactual"),
  "src/outcomes/graph-privacy.ts": () => import("@/outcomes/graph-privacy"),
  "src/capacity/backtest.ts": () => import("@/capacity/backtest"),
  "src/capacity/copy-lint.ts": () => import("@/capacity/copy-lint"),
  "src/capacity/drift.ts": () => import("@/capacity/drift"),
  "src/interop/ereferral.ts": () => import("@/interop/ereferral"),
  "src/capacity/model.ts": () => import("@/capacity/model"),
  "src/outcomes/response-console.ts": () => import("@/outcomes/response-console"),
  "src/outcomes/response.ts": () => import("@/outcomes/response"),
  "src/tenancy/fixture-coherence.ts": () => import("@/tenancy/fixture-coherence"),
  "src/tenancy/store-reads.ts": () => import("@/tenancy/store-reads"),
  "src/tenancy/two-tenant.ts": () => import("@/tenancy/two-tenant"),
  "src/verticals/binding.ts": () => import("@/verticals/binding"),
  "src/verticals/completeness.ts": () => import("@/verticals/completeness"),
  "src/verticals/consistency.ts": () => import("@/verticals/consistency"),
  "src/verticals/dermatology.ts": () => import("@/verticals/dermatology"),
  "src/privacy/adm-y5.ts": () => import("@/privacy/adm-y5"),
  "src/privacy/access-y5.ts": () => import("@/privacy/access-y5"),
  "src/privacy/erasure-y5.ts": () => import("@/privacy/erasure-y5"),
  "src/verticals/model.ts": () => import("@/verticals/model"),
  "src/verticals/scale.ts": () => import("@/verticals/scale"),
  "src/verticals/store.ts": () => import("@/verticals/store"),
};

async function allFindings(): Promise<CopyFinding[]> {
  const out: CopyFinding[] = [];
  for (const surface of OPERATOR_COPY_SURFACES) {
    const load = NAMESPACES[surface.module];
    if (!load) throw new Error(`${surface.module} has no namespace loader`);
    out.push(...lintOperatorCopy(surface, await load()));
  }
  return out;
}

describe("W200 the four rail properties plus the fifth, re-derived", () => {
  it("carries all five, each with a Y4 re-derivation and a test that enforces it", () => {
    expect(RAIL_PROPERTIES.map((p) => p.id).sort()).toEqual([
      "informs-never-advises",
      "never-concludes-from-silence",
      "never-decides-care-transferred",
      "never-selects-a-clinician",
      "writes-no-clinical-text",
    ]);
    for (const property of RAIL_PROPERTIES) {
      expect(property.statement.length, `${property.id} states nothing`).toBeGreaterThan(80);
      expect(property.establishedBy.length, `${property.id} cites no unit`).toBeGreaterThan(0);
      // The gate's word is RE-DERIVED. A one-line "still true" is the thing it forbids.
      expect(property.y4Rederivation.length, `${property.id} is asserted, not re-derived`).toBeGreaterThan(200);
      expect(property.enforcedBy, `${property.id} names no test`).toMatch(/\.test\.ts/);
    }
  });

  it("names a Y4 unit in every re-derivation, so none of them is about the old tree", () => {
    for (const property of RAIL_PROPERTIES) {
      const units = [...property.y4Rederivation.matchAll(/\bW(\d+)\b/g)].map((m) => Number(m[1]));
      expect(units.length, `${property.id} cites no unit at all`).toBeGreaterThan(0);
      expect(
        units.some((u) => u >= Y4_FIRST_UNIT),
        `${property.id} re-derives against no Y4 unit`,
      ).toBe(true);
    }
  });
});

describe("W200 the declared copy surface is checked against the tree", () => {
  it("declares every Y4 module, and declares no module that is not one", () => {
    // Both directions. A missing module is an unlinted surface; a stale entry is a register that
    // has stopped describing the tree, and W102's rule is that both fail.
    expect(OPERATOR_COPY_SURFACES.map((s) => s.module).sort()).toEqual(y4Modules());
    expect(y4Modules().length).toBeGreaterThan(20);
  });

  it("declares each module once", () => {
    // Named separately because the set comparison above reports a duplicate as a length mismatch
    // and buries which module it was. Two parallel builders declared `reporting/report.ts` in the
    // same merge window — W205 and W201 — and the diff took longer to read than the fix.
    const declared = OPERATOR_COPY_SURFACES.map((s) => s.module);
    const twice = declared.filter((m, i) => declared.indexOf(m) !== i);
    expect(twice, "declared twice").toEqual([]);
  });

  it("has a namespace loader for every declared module", () => {
    expect(Object.keys(NAMESPACES).sort()).toEqual(y4Modules());
  });

  it("says why the rest of a module is not operator copy, especially when nothing is", () => {
    for (const surface of OPERATOR_COPY_SURFACES) {
      expect(surface.notCopy.length, `${surface.module} declares no reason`).toBeGreaterThan(60);
    }
  });

  it("names only exports that exist, and only exports with text in them", async () => {
    // The vacuity guard. `SILENCE_COPY` is a record of OBJECTS, and the first version of
    // `lintOperatorCopy` walked one level and returned zero texts for it — a clean result over
    // nothing. A lint that reaches no string cannot fail.
    for (const surface of OPERATOR_COPY_SURFACES) {
      const namespace = await NAMESPACES[surface.module]!();
      for (const exportName of surface.operatorCopy) {
        expect(namespace, `${surface.module} has no export ${exportName}`).toHaveProperty(exportName);
        expect(
          copyTexts(namespace[exportName]).length,
          `${surface.module}#${exportName} yields no text to lint`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("reaches copy outside src/education/, which is the gap this unit found", () => {
    // W150's declared surface is six education files. The point of this register is that it is
    // not those six, so the disjointness is asserted rather than assumed.
    for (const declared of EDUCATION_COPY_MODULES) {
      expect(OPERATOR_COPY_SURFACES.map((s) => s.module)).not.toContain(declared);
    }
    const linted = OPERATOR_COPY_SURFACES.filter((s) => s.operatorCopy.length > 0);
    expect(linted.length, "nothing outside education is actually linted").toBeGreaterThan(10);
  });
});

describe("W200 the product informs and never advises, across everything Y4 added", () => {
  it("finds no unaccepted advice in any operator copy Y4 added", async () => {
    const unaccepted = unacceptedCopy(await allFindings());
    expect(
      unaccepted.map((f) => `${f.module}#${f.exportName}: ${f.rule} on "${f.match}"`),
    ).toEqual([]);
  });

  it("still fires on advice, so the clean result means something", () => {
    // Non-vacuous: the rules that returned nothing above do catch the sentence they exist for.
    expect(lintEducationCopy("You should review this patient against the new criteria.").map((v) => v.rule))
      .toContain("no-clinician-instruction");
    expect(lintEducationCopy("Consider a follow-up for this patient.").map((v) => v.rule))
      .toContain("no-soft-recommendation");
    expect(lintEducationCopy("This patient needs a review.").map((v) => v.rule))
      .toContain("no-patient-directed-claim");
  });

  it("accepts by module, export, rule and matched string, and every acceptance is live", async () => {
    // Both directions again. An acceptance that no longer matches anything is a rule quietly
    // relaxed for a sentence somebody has since deleted or reworded.
    const findings = await allFindings();
    for (const accepted of ACCEPTED_COPY_FINDINGS) {
      expect(
        findings.some(
          (f) =>
            f.module === accepted.module &&
            f.exportName === accepted.exportName &&
            f.rule === accepted.rule &&
            f.match.toLowerCase() === accepted.match.toLowerCase(),
        ),
        `${accepted.module}#${accepted.exportName} no longer produces ${accepted.rule} on "${accepted.match}"`,
      ).toBe(true);
      expect(accepted.why.length, `${accepted.module} is accepted without an argument`).toBeGreaterThan(150);
      expect(accepted.reviewBy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // W205: compared against the CLOCK, not a frozen date. It was `> "2026-08-11"`, so every
      // acceptance passed forever — the review date was recorded and never enforced, which is a
      // control that looks exactly like a control that works. `src/security/audit-gate.ts` uses
      // a real clock for the same reason: an expiry a test cannot reach is a comment.
      const today = new Date().toISOString().slice(0, 10);
      expect(
        accepted.reviewBy > today,
        `${accepted.module}'s copy acceptance expired on ${accepted.reviewBy} and needs re-reviewing`,
      ).toBe(true);
    }
    expect(ACCEPTED_COPY_FINDINGS.length, "an acceptance list nobody had to write").toBeGreaterThan(0);
  });

  it("keeps the acceptances narrow — no rule is switched off anywhere", () => {
    // The failure mode this shape exists against: accepting a RULE rather than a string. Two
    // acceptances of the same rule in different modules are fine; a wildcard is not.
    for (const accepted of ACCEPTED_COPY_FINDINGS) {
      expect(accepted.match.trim().length, "an empty match accepts everything").toBeGreaterThan(0);
      expect(accepted.match, "a wildcard acceptance").not.toMatch(/^[*.]+$/);
      // The accepted string really is what the rule matches, not a paraphrase of it.
      expect(
        lintEducationCopy(accepted.match).map((v) => v.rule),
        `"${accepted.match}" does not itself trip ${accepted.rule}`,
      ).toContain(accepted.rule);
    }
  });
});

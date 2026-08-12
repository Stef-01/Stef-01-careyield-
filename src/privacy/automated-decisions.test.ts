// W201 verify gate: the ADM page enumerates every decision the tree makes, checked against the
// source rather than written from memory.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OPERATOR_COPY_SURFACES } from "@/compliance/cdss-boundary";
import { reachableFromApp } from "@/security/reachability";
import { RECORD_CLASSES } from "./record-classes";
import { ACCEPTED_FINDINGS, sweepSurface, unaccepted } from "@/compliance/public-surfaces";
import {
  AUTOMATED_DECISIONS,
  DETECTOR_SCANS,
  HUMAN_CONTROLS,
  INFORMATION_USED,
  NEVER_AUTOMATED,
  NOTICE_HEADING,
  NOTICE_REVISION,
  NOTICE_STANDING_PARAGRAPH,
  NOT_A_DECISION,
  PERSON_REFERENCE_TERMS,
  declaredModules,
  pageCopy,
  reviewedLine,
} from "./automated-decisions";

const SRC = path.join(__dirname, "..");
const PAGE = path.join(SRC, "..", "app", "privacy", "automated-decisions", "page.tsx");
const ADM_PATH = "/privacy/automated-decisions";

function sourceFiles(): Array<{ module: string; text: string }> {
  const out: Array<{ module: string; text: string }> = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        out.push({
          module: `src/${path.relative(SRC, full).split(path.sep).join("/")}`,
          text: readFileSync(full, "utf8"),
        });
      }
    }
  };
  walk(SRC);
  return out;
}

/**
 * Modules that could be taking a decision about a patient.
 *
 * The union of the scans declared in `DETECTOR_SCANS`, because none is sound alone — see the
 * module note. Each declares a module only it reaches, and the test below proves it by checking
 * the other scans miss that module, so the stated bound is a fact rather than a sentence.
 */
function patientTouchingModules(): string[] {
  // W258's third scan, and it is not a regex. W106 already answers "does this module hold patient
  // identity" by a reviewed human classification, so a module it marks `stored` or `derived` is a
  // candidate here whatever its own text spells. Composed rather than restated: the two privacy
  // registers can no longer hide something from each other, which is what they had been doing.
  const holdsPatientRecords = new Set(
    RECORD_CLASSES.filter((c) => c.handling !== "no_patient_identity").map((c) => c.module),
  );
  // Built from the declared register rather than written here, so adding a pseudonym for a
  // person is an edit to `PERSON_REFERENCE_TERMS` and not to a literal buried in a test.
  // Escaped, because this file invites future editors to add terms: `patient.ref` would
  // otherwise over-match and a term ending in punctuation would silently never match.
  const namesAPatient = new RegExp(
    Object.keys(PERSON_REFERENCE_TERMS)
      .map((term) => `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
      .join("|"),
  );
  const decidesAnOutcome = /^export type [A-Za-z]*(Reason|Refusal|Exclusion|Verdict)\b/m;
  return sourceFiles()
    .filter(({ module, text }) => {
      // This register and its own machinery are excluded by PATH, which is the only exclusion
      // here and is stated rather than pattern-matched: a register that declared itself would be
      // answering its own question.
      if (module === "src/privacy/automated-decisions.ts") return false;
      return namesAPatient.test(text) || decidesAnOutcome.test(text) || holdsPatientRecords.has(module);
    })
    .map((f) => f.module)
    .sort();
}

describe("W201 every decision the tree makes is accounted for", () => {
  it("finds the decision sites with a detector that is not vacuous", () => {
    const found = patientTouchingModules();
    expect(found.length).toBeGreaterThan(50);
    // Both halves of the detector earn their place. Drop either and a real decision goes missing.
    expect(found, "the identifier scan is what finds the escalation router").toContain(
      "src/registers/escalation.ts",
    );
    expect(found, "the outcome-union scan is what finds the eligibility engine").toContain(
      "src/engine/eligibility.ts",
    );
  });

  it("states its own bound honestly, with every declared scan load-bearing", () => {
    // W258. W221 wrote "three scans" in the block whose job is stating the bound and enumerated
    // two. A prose number beside a list can be wrong, so the count is read off the list — and the
    // list is checked by making each entry prove it: the module a scan claims to find alone must
    // be MISSED by every other scan. A scan carried after it stopped earning its place fails here.
    const found = patientTouchingModules();
    expect(DETECTOR_SCANS.length).toBe(3);
    expect(new Set(DETECTOR_SCANS.map((s) => s.id)).size).toBe(DETECTOR_SCANS.length);

    const text = (module: string) =>
      sourceFiles().find((f) => f.module === module)?.text ?? "";
    const scanHits: Record<string, (module: string) => boolean> = {
      "names-a-person": (m) =>
        new RegExp(Object.keys(PERSON_REFERENCE_TERMS).map((t) => `\\b${t}\\b`).join("|")).test(text(m)),
      "decides-an-outcome": (m) =>
        /^export type [A-Za-z]*(Reason|Refusal|Exclusion|Verdict)\b/m.test(text(m)),
      "holds-patient-records": (m) =>
        RECORD_CLASSES.some((c) => c.module === m && c.handling !== "no_patient_identity"),
    };
    expect(Object.keys(scanHits).sort()).toEqual(DETECTOR_SCANS.map((s) => s.id).sort());

    for (const scan of DETECTOR_SCANS) {
      const target = scan.onlyThisScanFinds;
      expect(found, `${scan.id} names a module the detector does not reach`).toContain(target);
      expect(scanHits[scan.id]!(target), `${scan.id} does not find its own example`).toBe(true);
      for (const other of DETECTOR_SCANS.filter((s) => s.id !== scan.id)) {
        expect(
          scanHits[other.id]!(target),
          `${target} is also found by ${other.id}, so ${scan.id} is not proved necessary by it`,
        ).toBe(false);
      }
      expect(scan.whyTheOthersMissIt.length, `${scan.id} says nothing`).toBeGreaterThan(60);
    }
  });

  it("sees a module whose patient identity arrives through an import", () => {
    // THE W258 FINDING, pinned at the module that exposed it. Both original scans read a module's
    // own text; `src/privacy/state.ts` holds the suppression list — the thing that makes "opt-out
    // is permanent" true, which this notice publishes — inside a type declared next door. It named
    // no patient identifier, exported no outcome union, and was invisible to this register for
    // three years from four files away. Nothing about its text changed; the detector did.
    const found = patientTouchingModules();
    for (const module of [
      "src/privacy/state.ts",
      "src/interest/store.ts",
      "src/outcomes/dashboard.ts",
      "src/reporting/report.ts",
    ]) {
      expect(found, `${module} is invisible to the detector again`).toContain(module);
    }
    // And the verdict this page discloses is now credited to both modules that reach it.
    const verdict = AUTOMATED_DECISIONS.find((d) => d.id === "referral-outcome-verdict");
    expect(verdict!.decidedBy).toContain("src/outcomes/dashboard.ts");
  });

  it("classifies every one of them, exactly once, in both directions", () => {
    // W102's shape. A module that starts deciding something about a patient fails here until
    // somebody says whether the published statement has to mention it.
    expect(declaredModules()).toEqual(patientTouchingModules());
  });

  it("declares no module twice and none that has left the tree", () => {
    const declared = declaredModules();
    expect(new Set(declared).size, "a module is declared twice").toBe(declared.length);
    for (const module of declared) {
      expect(existsSync(path.join(SRC, "..", module)), `${module} is declared and does not exist`).toBe(true);
    }
  });

  it("gives a reason for every module it rules out", () => {
    for (const [module, why] of Object.entries(NOT_A_DECISION)) {
      expect(why.length, `${module} is ruled out without a reason`).toBeGreaterThan(40);
    }
  });
});

describe("W201 the status of each decision is read from the tree, not asserted", () => {
  it("checks every content registry against what it actually holds", async () => {
    // The heart of the unit. "Built but not in use" is a claim in a published legal notice, and
    // the thing that makes it true is an empty registry — so the test imports the registry and
    // looks. A gate opening without this page changing fails here.
    for (const decision of AUTOMATED_DECISIONS) {
      if (!decision.registry) {
        // W221's gap. A decision claiming to be dormant with NO content registry was skipped
        // entirely, so "built, not in use" was an unverified sentence in a published notice —
        // exactly the shape this unit exists to end.
        //
        // The first version of this proof asked "does anything import it", matching only
        // `from "@/x"`. The review skill found it certifying `intervention-response-link` as
        // dormant while three modules import it RELATIVELY, and found that the scan never left
        // `src/` — so a route in `app/`, which is precisely where a module becomes in use, was
        // invisible. Both are fixed by asking the right question instead: **is it REACHABLE FROM
        // A PAGE?** A module imported only by other dormant modules is still dormant, which is
        // what "no page in the product shows it yet" actually claims. W107 already walks that
        // graph transitively over `app/` including `.tsx`, so it is composed rather than restated.
        if (decision.status !== "built_not_in_use") continue;
        const reachable = new Set(reachableFromApp(path.join(SRC, "..")).files);
        const live = decision.decidedBy.filter((m) => reachable.has(m));
        expect(live, `${decision.id} says it is not in use, but a page reaches it`).toEqual([]);
        continue;
      }
      const specifier = `@/${decision.registry.module.replace(/^src\//, "").replace(/\.ts$/, "")}`;
      const namespace = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
      const held = namespace[decision.registry.exportName];
      expect(Array.isArray(held), `${decision.registry.exportName} is not a registry`).toBe(true);
      const count = (held as unknown[]).length;
      if (decision.status === "built_not_in_use") {
        expect(count, `${decision.id} claims to be dormant but its registry has filled up`).toBe(0);
      } else {
        expect(count, `${decision.id} claims to be live over an empty registry`).toBeGreaterThan(0);
      }
    }
  });

  it("has at least one of each status, so neither branch is untested", () => {
    const statuses = AUTOMATED_DECISIONS.map((d) => d.status);
    expect(statuses).toContain("in_use");
    expect(statuses).toContain("built_not_in_use");
    // Both branches of the check above run against a real registry rather than skipping.
    expect(AUTOMATED_DECISIONS.filter((d) => d.registry && d.status === "in_use").length).toBeGreaterThan(0);
    expect(AUTOMATED_DECISIONS.filter((d) => d.registry && d.status === "built_not_in_use").length).toBeGreaterThan(0);
  });

  it("discloses the holdout arm, which three years of this page did not", () => {
    // Named, because the finding is the unit. A decision that withholds an offer of an
    // appointment from a specific person is the one an ADM notice most has to carry.
    const holdout = AUTOMATED_DECISIONS.find((d) => d.id === "holdout-arm");
    expect(holdout, "the holdout arm is not disclosed").toBeDefined();
    expect(holdout!.decidedBy).toContain("src/engine/holdout.ts");
    expect(holdout!.status).toBe("in_use");
    expect(AUTOMATED_DECISIONS[0]!.id, "the undisclosed one is not buried").toBe("holdout-arm");
  });
});

describe("W201 the page is the register, and the copy answers to the sweep", () => {
  it("renders from the register rather than restating it", () => {
    const page = readFileSync(PAGE, "utf8");
    // Each list must MAP over its register. Asserting the import alone was the first version and
    // it passed with the list replaced by `[].map` — the import survived, the page rendered
    // nothing, and a mutation check is the only reason that is not still true.
    for (const register of ["AUTOMATED_DECISIONS", "NEVER_AUTOMATED", "INFORMATION_USED", "HUMAN_CONTROLS"]) {
      expect(page, `the page does not render ${register}`).toContain(`{${register}.map(`);
    }
    // A hardcoded copy of a decision is the exact drift this unit exists to end, so the page must
    // not contain the text — it must map over it.
    for (const decision of AUTOMATED_DECISIONS) {
      expect(page, `${decision.id} is hardcoded into the page`).not.toContain(decision.what);
    }
    for (const line of [...NEVER_AUTOMATED, ...HUMAN_CONTROLS, ...INFORMATION_USED]) {
      expect(page, "a list item is hardcoded into the page").not.toContain(line);
    }
  });

  it("renders its own heading, standing paragraph and review date from the register", () => {
    // W258. The page was "deliberately thin: it is layout" and still wrote three pieces of prose
    // itself — which meant they were the only text on a published patient notice `pageCopy()`
    // never handed to the sweep. A layout file's prose is prose nobody lints.
    const page = readFileSync(PAGE, "utf8");
    expect(page).toContain("{NOTICE_HEADING}");
    expect(page).toContain("{NOTICE_STANDING_PARAGRAPH}");
    expect(page).toContain("{reviewedLine()}");
    expect(page, "the heading is hardcoded again").not.toContain(NOTICE_HEADING);
    expect(page, "the review date is hardcoded again").not.toContain(NOTICE_REVISION.reviewedOn);
    // And the sweep now reaches all three, which is the point of moving them.
    for (const text of [NOTICE_HEADING, NOTICE_STANDING_PARAGRAPH, reviewedLine()]) {
      expect(pageCopy(), "the sweep still cannot see the notice's own prose").toContain(text);
    }
  });

  it("fails the build when the register moves under a stated review date", () => {
    // A review date on a legal notice claims somebody looked at this WHEN THE SOFTWARE LOOKED LIKE
    // THIS. The page carried `Last reviewed 11 August 2026` as a literal, so it stayed true-looking
    // through every change beneath it — W102's instruction-in-a-comment, one level up from where
    // W201 replaced it. The date now travels with counts taken at the review, pinned here: add a
    // decision or rule out a module and this fails until somebody re-reads the notice and moves it.
    expect(NOTICE_REVISION.decisionsAtReview, "a decision changed; re-read the notice and move the date").toBe(
      AUTOMATED_DECISIONS.length,
    );
    expect(NOTICE_REVISION.modulesAtReview, "the classified set changed; re-read the notice and move the date").toBe(
      declaredModules().length,
    );
    expect(NOTICE_REVISION.reviewedAt).toMatch(/^W\d+$/);
    expect(reviewedLine()).toContain(NOTICE_REVISION.reviewedOn);
  });

  it("passes W192's public sweep with nothing new accepted", () => {
    // Pulled forward from e2e: this is the text that will be published, so it is linted here
    // rather than after the browser renders it. The acceptances are W192's existing ones — this
    // unit adds none, which is the bar for a page that just grew five sections.
    const findings = sweepSurface(ADM_PATH, "patient_notice", pageCopy());
    expect(unaccepted(findings, ACCEPTED_FINDINGS)).toEqual([]);
  });

  it("is the check W200's register says covers this module", () => {
    // W194's method note: when two registers describe the same module, test that they AGREE.
    // W200 declares this module's copy as answering to the patient_notice sweep rather than to
    // the advice rules, and points here. If somebody moves it back under the advice rules, the
    // two registers disagree and this fails — which a per-register test could never notice.
    const surface = OPERATOR_COPY_SURFACES.find((s) => s.module === "src/privacy/automated-decisions.ts");
    expect(surface, "W200's register has lost this module").toBeDefined();
    expect(surface!.operatorCopy, "W200 now lints this copy too; one of the two is wrong").toEqual([]);
    expect(surface!.notCopy).toContain("patient_notice");
  });

  it("still catches a claim, so the clean sweep means something", () => {
    // Non-vacuous: the sweep does fire on this page's audience when the copy earns it.
    const findings = sweepSurface(ADM_PATH, "patient_notice", "Rated 5/5 by our patients.");
    expect(unaccepted(findings, ACCEPTED_FINDINGS).length).toBeGreaterThan(0);
  });

  it("writes every decision to the patient it is about", () => {
    for (const decision of AUTOMATED_DECISIONS) {
      expect(decision.title.length, `${decision.id} has no title`).toBeGreaterThan(15);
      expect(decision.what.length, `${decision.id} is described in a phrase`).toBeGreaterThan(120);
      expect(decision.decidedBy.length, `${decision.id} names no module`).toBeGreaterThan(0);
    }
    expect(new Set(AUTOMATED_DECISIONS.map((d) => d.id)).size).toBe(AUTOMATED_DECISIONS.length);
    // The Year 2 page listed seven. Fewer than that now would mean the refresh lost something.
    expect(AUTOMATED_DECISIONS.length).toBeGreaterThan(7);
  });
});

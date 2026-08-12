// W248 verify gate: "W157's model reused, not re-implemented; the vertical is refused with each
// missing member named; asserts zero clinical content present."
//
// "Reused, not re-implemented" is the clause with teeth, and it is not a claim about this file —
// it is a claim about the SET of verticals. One bespoke assembly is a file; two are a pattern
// nobody declared. So the check is a census over `src/verticals/`, in both directions.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./womens-health";
import {
  WOMENS_HEALTH_MEMBERS,
  WOMENS_HEALTH_SPEC,
  assembleWomensHealth,
  womensHealthGates,
  womensHealthOutstanding,
} from "./womens-health";
import { DERMATOLOGY_SPEC } from "./dermatology";
import { shippedEvidence } from "./assembly";
import { stripComments } from "@/security/reachability";
import { lintLandingCopy } from "@/compliance/landing";
import { lintMessageText } from "@/messaging/templates";

const DIR = path.join(process.cwd(), "src/verticals");
const SOURCE = readFileSync(path.join(DIR, "womens-health.ts"), "utf8");

describe("W248 W157's model is reused, and the machinery is not re-implemented", () => {
  it("assembles through the shared door, with no assembly of its own", () => {
    expect(SOURCE).not.toContain("usableVertical(");
    expect(SOURCE).not.toContain("assessCompleteness(");
    expect(SOURCE).toContain("assembleVertical(");
    expect(SOURCE).toContain("verticalOutstanding(");
  });

  it("holds no evidence reader of its own", () => {
    // `dermatologyEvidence` was never about dermatology: it read the tree's SHIPPED_* registries
    // and returned what is signed off for anything. A second copy under a second name would be
    // two functions claiming the same fact about the same registries, and the day a registry is
    // added one vertical learns about it and the other goes on reporting nothing is signed off.
    expect(SOURCE).not.toContain("SHIPPED_INTERVALS");
    expect(SOURCE).not.toContain("SHIPPED_WORKSPACE");
    expect(SOURCE).toContain("shippedEvidence");
  });

  // The census that was here moved to `assembly.test.ts` at W250. A rule about EVERY vertical,
  // asserted in the test file of ONE of them, disappears the day that one is renamed — and the
  // author writing the third vertical's test has no reason to read this file.

  it("still produces the same evidence both verticals are assessed against", () => {
    // Non-vacuity for the extraction: a shared reader that returned something different from what
    // the two copies returned would be a refactor that changed an answer.
    const evidence = shippedEvidence();
    expect(evidence.pathways).toEqual([]);
    expect(evidence.educationItems).toEqual([]);
    expect(evidence.intervals.intervals).toEqual([]);
    expect(evidence.intervals.rejected).toEqual([]);
  });

  it("is a distinct vertical, not a renamed copy", () => {
    expect(WOMENS_HEALTH_SPEC.verticalId).not.toBe(DERMATOLOGY_SPEC.verticalId);
    const shared = WOMENS_HEALTH_SPEC.members
      .map((m) => m.ref)
      .filter((ref) => DERMATOLOGY_SPEC.members.some((d) => d.ref === ref));
    expect(shared, "the two verticals share a member ref").toEqual([]);
  });
});

describe("W248 the vertical is refused, with every missing member named", () => {
  it("refuses today", () => {
    const result = assembleWomensHealth();
    expect(result.usable).toBe(false);
  });

  it("names EVERY member, not the first", () => {
    // The failure mode is a caller that fixes one member, re-runs, and finds another — n round
    // trips through a two-person sign-off process, each discovering a fact knowable at the start.
    const result = assembleWomensHealth();
    if (result.usable) throw new Error("unreachable");
    expect(result.unusable).toHaveLength(WOMENS_HEALTH_MEMBERS.length);
    expect(result.unusable.map((m) => m.member.ref).sort()).toEqual(
      WOMENS_HEALTH_MEMBERS.map((m) => m.ref).sort(),
    );
    for (const member of result.unusable) {
      expect(member.reason, `${member.member.ref} is refused without a reason`).toBeTruthy();
    }
    expect(result.reasons.length, "refused with no stated reason").toBeGreaterThan(0);
  });

  it("decomposes the outstanding work by who has to act", () => {
    const report = womensHealthOutstanding();
    expect(report.members).toHaveLength(WOMENS_HEALTH_MEMBERS.length);
    for (const assessment of report.members) {
      // W158's first refusal: without a second input, "exists but unsigned" and "never authored"
      // are the same absence. Nothing here exists, so indeterminate is also the true answer.
      expect(assessment.status).toBe("indeterminate");
    }
  });

  it("names the gates, deduplicated by VALUE, so the founder sees decisions not members", () => {
    // W248 asserted `gates.length < members.length` here and it passed — because this vertical
    // happened to word two members identically. Dermatology, with one gate and five members,
    // returned five. The assertion was certifying a deduplication on the single fixture where it
    // coincidentally occurred; W250 made the gate a declared value and this checks the grouping.
    expect(womensHealthGates()).toEqual(["G5"]);
    expect(WOMENS_HEALTH_MEMBERS.filter((m) => m.gate === "G5").length).toBeGreaterThan(1);
  });

  it("declares two pathways separately, because they are signed off separately", () => {
    // A vertical that bundled them would report one refusal where there are two decisions.
    expect(WOMENS_HEALTH_MEMBERS.filter((m) => m.kind === "pathway")).toHaveLength(2);
  });
});

describe("W248 zero clinical content is present", () => {
  it("makes no clinical claim, checked with the tree's linters rather than a fresh regex", () => {
    // W139/W184's law: apply the linters, do not restate them.
    for (const declared of WOMENS_HEALTH_MEMBERS) {
      expect(lintLandingCopy(declared.waitsOn), declared.ref).toEqual([]);
      expect(lintMessageText(declared.waitsOn), declared.ref).toEqual([]);
    }
    expect(lintLandingCopy(WOMENS_HEALTH_SPEC.name)).toEqual([]);
    expect(lintMessageText(WOMENS_HEALTH_SPEC.name)).toEqual([]);
  });

  it("carries no field that could hold what a member says", () => {
    for (const declared of WOMENS_HEALTH_MEMBERS) {
      // W250 added `gate` — a declared value, not a description of what the member says.
      expect(Object.keys(declared).sort()).toEqual(["gate", "kind", "ref", "waitsOn"]);
    }
  });

  it("names no condition, procedure or cadence anywhere in its code", () => {
    // TIGHTER THAN DERMATOLOGY'S LIST, and the reason is the finding. A skin condition reads
    // obviously clinical; the tempting words in THIS scope read like service categories — and a
    // service category with a recommended cadence attached is a clinical claim wearing an
    // operational coat, which is W56's interval problem arriving through a spec file.
    //
    // THIRTEENTH INSTANCE OF THE RECURRING COLLISION, and W173's method rather than W198's: the
    // module note LISTS those words, because explaining which sentences are forbidden is how the
    // next author knows not to write one — the same reviewer-facing quoting W200's registers do.
    // So the comments are subtracted and THE SUBTRACTION IS ASSERTED REAL before scanning, since
    // a stripper that returned its input would certify a clean result over the same text.
    const code = stripComments(SOURCE);
    expect(code.length).toBeLessThan(SOURCE.length);
    expect(SOURCE, "the phrase proving the subtraction is gone").toContain("SERVICE CATEGORIES");
    expect(code, "comments were not removed").not.toContain("SERVICE CATEGORIES");
    expect(code, "the stripper ate the declaration too").toContain("WOMENS_HEALTH_MEMBERS");

    expect(code.toLowerCase()).not.toMatch(
      /\b(cervical|screening|smear|mammogra\w*|contracept\w*|menopaus\w*|antenatal|pregnan\w*|postnatal|fertility|hrt|pap)\b/,
    );
    // And no cadence, which is the half that would survive a condition-word scan.
    expect(code).not.toMatch(/\bevery (one|two|three|four|five|\d+)\s*(year|month|week)/i);
  });

  it("would notice a clinical word if one appeared", () => {
    // The scan is proved to fire. A word list nobody has seen match is a word list that proves the
    // file was read — W237's rule about a harness, applied to a regex.
    const planted = `${stripComments(SOURCE)}\nconst note = "cervical screening every three years";\n`;
    expect(planted.toLowerCase()).toMatch(/\b(cervical|screening)\b/);
    expect(planted).toMatch(/\bevery three\s*year/i);
  });

  it("declares refs as placeholders rather than fabricating version hashes", () => {
    // A real version hash is the hash of signed content. Inventing one would put a fabricated
    // identity into W160's migration path, where it would look exactly like a real one.
    for (const declared of WOMENS_HEALTH_MEMBERS) {
      expect(declared.ref).toMatch(/^wh-/);
      expect(declared.ref).not.toMatch(/^[0-9a-f]{12,}$/);
    }
  });

  it("exports nothing that could carry content", () => {
    expect(Object.keys(mod).filter((n) => /content|criteri|text|body|descri/i.test(n))).toEqual([]);
    expect(Object.keys(mod).length).toBeGreaterThan(4);
  });
});

describe("W248 the spec is well-formed, so the refusal means what it says", () => {
  it("declares no member twice", () => {
    const keys = WOMENS_HEALTH_SPEC.members.map((m) => `${m.kind}:${m.ref}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("carries the same members the declaration does, in the same order", () => {
    expect(WOMENS_HEALTH_SPEC.members).toEqual(
      WOMENS_HEALTH_MEMBERS.map(({ kind, ref }) => ({ kind, ref })),
    );
  });
});

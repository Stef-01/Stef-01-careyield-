// W238 verify gate: "every code carries provenance; an unbound code is refused rather than
// guessed, and the refusal names the code."
//
// THE FIXTURES BIND NOTHING REAL, ON PURPOSE. Every binding below uses a shape-valid but
// meaningless concept id — `123456`, `1234-5` — never an actual SNOMED or LOINC code. A test that
// wrote `reg-diabetes → 73211009` would be making the clinical assertion the module refuses to
// ship, in a file nobody reviews as clinical content, and the next person to need a binding would
// copy it out of the test. The shape checks are about SHAPE, and a meaningless code exercises them
// exactly as well as a real one.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as terminology from "./terminology";
import {
  ALL_SYSTEMS,
  BINDING_REJECTION_COPY,
  REFUSED_BINDING_STRATEGIES,
  SHIPPED_BINDINGS,
  SYSTEM_URI,
  codingFor,
  rejectionsForBinding,
  type BindingRejection,
  type Coding,
  type TerminologyBinding,
} from "./terminology";

const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/terminology.ts"), "utf8");

/** A binding that passes every check. Shape-valid, provenanced, and deliberately meaningless. */
const complete = (over: Partial<TerminologyBinding> = {}): TerminologyBinding => ({
  localCode: "local-placeholder",
  system: "snomed-ct-au",
  code: "123456",
  display: "Placeholder concept (synthetic fixture, not a real binding)",
  provenance: {
    release: "SNOMED CT-AU synthetic release (fixture)",
    citation: "Synthetic fixture — no release was consulted",
    url: "https://example.invalid/no-release",
    retrievedOn: "2026-08-13",
    boundBy: "fixture@demo.practice.example",
  },
  ...over,
});

const withProvenance = (
  over: Partial<TerminologyBinding["provenance"]>,
): TerminologyBinding => complete({ provenance: { ...complete().provenance, ...over } });

describe("W238 the catalogue ships empty, and that is the gate", () => {
  it("ships no bindings at all", () => {
    // A binding says two things are the same condition, in a document somebody makes decisions
    // from. W56's shape: the loader enforces the gate and the values do not, so zero entries is
    // zero clinical assertions and an empty catalogue cannot breach G5. Pinned so values cannot
    // arrive without the ruling that lets them.
    expect(SHIPPED_BINDINGS).toEqual([]);
  });

  it("refuses every code by default, because the default catalogue is the empty one", () => {
    // The consequence of the line above, stated where it bites: nothing in this tree can obtain a
    // coding today, and the failure is a refusal rather than a plausible-looking document.
    const result = codingFor("local-anything");
    expect(result.bound).toBe(false);
    expect(!result.bound && result.refusal).toBe("no_binding_for_code");
  });

  it("names two terminologies and gives each its published URI", () => {
    expect(ALL_SYSTEMS.sort()).toEqual(["loinc", "snomed-ct-au"]);
    expect(SYSTEM_URI["snomed-ct-au"]).toBe("http://snomed.info/sct");
    expect(SYSTEM_URI.loinc).toBe("http://loinc.org");
    // Unlike W235's `example.invalid`, which is unresolvable BECAUSE a local code system has no
    // published identity. These two do have one, so a placeholder here would be the manufactured
    // source W227 refused.
    for (const uri of Object.values(SYSTEM_URI)) {
      expect(uri, uri).not.toContain("example.invalid");
    }
  });
});

describe("W238 every code carries provenance", () => {
  it("passes a complete binding", () => {
    // Non-vacuity for everything below: a validator that refused everything would pass every
    // rejection test on this page and make the unit a wall.
    expect(rejectionsForBinding(complete())).toEqual([]);
  });

  it("refuses a binding missing any part of its provenance, one reason per part", () => {
    // Provenance is not decoration here. A binding without a RELEASE cannot be re-checked, and
    // SNOMED concepts are inactivated and LOINC codes deprecated between releases — so a binding
    // recorded once keeps working forever and nobody can tell which ones need looking at again.
    expect(rejectionsForBinding(withProvenance({ release: "  " }))).toEqual(["release_missing"]);
    expect(rejectionsForBinding(withProvenance({ citation: "" }))).toEqual(["citation_missing"]);
    expect(rejectionsForBinding(withProvenance({ url: "" }))).toEqual(["url_missing"]);
    expect(rejectionsForBinding(withProvenance({ retrievedOn: "13/08/2026" }))).toEqual([
      "retrieved_date_missing_or_unreadable",
    ]);
    // A binding is a clinical assertion, and W119's rule is that an assertion has somebody behind
    // it. "The system says so" is not somebody.
    expect(rejectionsForBinding(withProvenance({ boundBy: "" }))).toEqual(["binder_missing"]);
  });

  it("refuses a binding with no provenance object at all, naming every missing part", () => {
    // A row arriving without the whole block must not throw past the loader and must not be
    // refused with one vague reason — the person filling the catalogue needs the list.
    const bare = { localCode: "local-x", system: "loinc", code: "1234-5", display: "X" } as
      unknown as TerminologyBinding;
    expect(rejectionsForBinding(bare).sort()).toEqual([
      "binder_missing",
      "citation_missing",
      "release_missing",
      "retrieved_date_missing_or_unreadable",
      "url_missing",
    ]);
  });

  it("refuses a binding missing its local code, concept id or display term", () => {
    expect(rejectionsForBinding(complete({ localCode: " " }))).toEqual(["local_code_missing"]);
    expect(rejectionsForBinding(complete({ code: "" }))).toEqual(["code_missing"]);
    // A coding sent without a display makes the receiving system supply its own; a coding sent
    // with the LOCAL catalogue's wording says the release means something it may not.
    expect(rejectionsForBinding(complete({ display: "" }))).toEqual(["display_missing"]);
  });

  it("checks the concept id is SHAPED like one in the system it claims", () => {
    // THE MISLABEL THIS UNIT EXISTS FOR, caught at the loader. `reg-diabetes` under
    // `http://snomed.info/sct` is a local key wearing a terminology's name: the receiving practice
    // resolves it against the wrong catalogue and gets nothing, or gets a real concept that
    // happens to collide. Neither end sees an error.
    expect(rejectionsForBinding(complete({ code: "reg-diabetes" }))).toEqual([
      "code_shape_wrong_for_system",
    ]);
    // And each system's own shape, both ways round, so the check is per-system rather than
    // "contains a digit".
    expect(rejectionsForBinding(complete({ system: "loinc", code: "1234-5" }))).toEqual([]);
    expect(rejectionsForBinding(complete({ system: "loinc", code: "123456" }))).toEqual([
      "code_shape_wrong_for_system",
    ]);
    expect(rejectionsForBinding(complete({ system: "snomed-ct-au", code: "1234-5" }))).toEqual([
      "code_shape_wrong_for_system",
    ]);
  });

  it("reports every reason at once rather than the first", () => {
    // A reviewer fixing one field at a time, four times, is a reviewer who gives up and pastes
    // something plausible in.
    const broken = complete({ localCode: "", code: "", display: "" });
    expect(rejectionsForBinding({ ...broken, provenance: { ...broken.provenance, url: "" } })
      .sort()).toEqual(["code_missing", "display_missing", "local_code_missing", "url_missing"]);
  });

  it("writes copy for every rejection, and declares no copy for a rejection that does not exist", () => {
    // Both directions, W106's rule: a new member of the union fails the suite until somebody
    // writes the sentence, and a deleted one cannot leave stale copy behind.
    const declared = Object.keys(BINDING_REJECTION_COPY).sort();
    const fired = new Set<BindingRejection>([
      ...rejectionsForBinding(complete({ localCode: "", code: "", display: "" })),
      ...rejectionsForBinding(complete({ code: "reg-diabetes" })),
      ...rejectionsForBinding({
        ...complete(),
        provenance: undefined as unknown as TerminologyBinding["provenance"],
      }),
    ]);
    expect([...fired].sort(), "a declared rejection no branch can produce").toEqual(declared);
    for (const reason of declared) {
      expect(BINDING_REJECTION_COPY[reason as BindingRejection].length, reason).toBeGreaterThan(30);
    }
  });
});

describe("W238 an unbound code is refused rather than guessed, and the refusal names it", () => {
  it("refuses an unbound code and puts the code in both the field and the sentence", () => {
    // THE ASSERTION THE UNIT EXISTS FOR. "Some codes could not be bound" is a sentence somebody
    // dismisses; "reg-ckd-stage-3 has no binding" is one they act on.
    const result = codingFor("reg-ckd-stage-3", []);
    expect(result.bound).toBe(false);
    if (result.bound) return;
    expect(result.refusal).toBe("no_binding_for_code");
    expect(result.localCode).toBe("reg-ckd-stage-3");
    expect(result.copy, "the refusal does not name the code").toContain("reg-ckd-stage-3");
    expect(result.copy).toContain("Nothing has been guessed");
    expect(result.copy).toContain("no nearest match has been substituted");
  });

  it("refuses a binding that exists but fails its own checks, and says which checks", () => {
    // Distinct from the above, because the fix is different: an absent binding needs somebody with
    // the release open, a rejected one needs a field corrected. A single refusal would send both
    // to the wrong place.
    const result = codingFor("local-placeholder", [complete({ code: "reg-diabetes" })]);
    expect(result.bound).toBe(false);
    if (result.bound) return;
    expect(result.refusal).toBe("binding_rejected");
    expect(result.rejections).toEqual(["code_shape_wrong_for_system"]);
    expect(result.localCode).toBe("local-placeholder");
    expect(result.copy).toContain("local-placeholder");
    expect(result.copy).toContain(BINDING_REJECTION_COPY.code_shape_wrong_for_system);
  });

  it("binds a code that passes, carrying the system URI, the display and the release", () => {
    // Non-vacuity for the two refusals: a `codingFor` that refused everything would pass both
    // tests above and would also be useless. And the RELEASE travels with the code and the
    // display rather than being left behind in the catalogue — a coding whose release has to be
    // looked up separately is a coding nobody re-checks.
    const result = codingFor("local-placeholder", [complete()]);
    expect(result.bound).toBe(true);
    if (!result.bound) return;
    expect(result.coding.system).toBe(SYSTEM_URI["snomed-ct-au"]);
    expect(result.coding.code).toBe("123456");
    expect(result.coding.display).toBe(complete().display);
    expect(result.coding.release).toBe(complete().provenance.release);
  });

  it("emits the system's URI, never the local catalogue's key, as `system`", () => {
    const result = codingFor("local-placeholder", [complete()]);
    expect(result.bound && result.coding.system).not.toContain("local");
    expect(result.bound && result.coding.system).toMatch(/^https?:\/\//);
  });
});

describe("W238 there is exactly one way to obtain a coding", () => {
  it("cannot be written as an object literal", () => {
    // The brand IS the unit. Without it a caller writes
    // `{ system: SYSTEM_URI["snomed-ct-au"], code: "reg-diabetes" }` — a local key under a
    // terminology's name, which no type error and no test would catch, and which the receiving
    // practice resolves against the wrong catalogue. W211's and W236's pattern.
    // @ts-expect-error — the brand is not constructible outside this module.
    const forged: Coding = {
      system: SYSTEM_URI["snomed-ct-au"],
      code: "reg-diabetes",
      display: "Diabetes",
      release: "",
    };
    void forged;
  });

  it("forges the brand in exactly one place in the module", () => {
    // The @ts-expect-error above proves a CALLER cannot write one. This proves the module has not
    // grown a second producer — a helper that casts a guessed coding is one line, compiles, and
    // makes the brand decorative. One cast, and it is in `codingFor`.
    const casts = SOURCE.match(/as Coding\b/g) ?? [];
    expect(casts.length, "a second producer of Coding appeared").toBe(1);
    const [, tail] = SOURCE.split("export function codingFor");
    expect(tail ?? "", "the cast is not inside codingFor").toContain("as Coding");
  });

  it("exports nothing that reads as a guesser", () => {
    // Names are not proof, but a `nearestCoding` export would be the first symptom, and this is
    // the file where somebody adds one to be helpful.
    for (const name of Object.keys(terminology)) {
      expect(name, `${name} sounds like a lookup that guesses`).not.toMatch(
        /nearest|fuzzy|closest|guess|approximate|infer/i,
      );
    }
  });

  it("names the five ways of faking a binding it refuses, each with its reason", () => {
    // Data rather than a comment — W196's `REFUSED_FIGURES` shape — so a later unit has to DELETE
    // a stated refusal rather than quietly add a helper. Every one is one line of code and every
    // one produces a document nobody can tell is wrong.
    expect(Object.keys(REFUSED_BINDING_STRATEGIES).sort()).toEqual([
      "cached_binding_without_release",
      "inferred_from_fact_codes",
      "local_code_under_terminology_uri",
      "nearest_display_match",
      "parent_concept_fallback",
    ]);
    for (const [name, why] of Object.entries(REFUSED_BINDING_STRATEGIES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    // The one that is G7's line rather than a data-quality point: deriving a condition from the
    // recorded fact codes is reading facts to conclude a condition.
    expect(REFUSED_BINDING_STRATEGIES.inferred_from_fact_codes).toContain("G7");
  });
});

describe("W238 the module binds codes and sends nothing", () => {
  it("takes no endpoint, credential or terminology server", () => {
    // G9 is unratified and there is no terminology service in this tree. A binding is read from a
    // release by a person and written down; it is not looked up at runtime, because a lookup is a
    // network call this tree has no gate for and an answer nobody recorded a provenance for.
    expect(SOURCE).not.toMatch(/fetch\(|axios|process\.env|Authorization|apiKey/);
  });
});

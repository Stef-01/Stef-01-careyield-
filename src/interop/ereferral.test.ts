// W236 verify gate: "W131's structured referral rendered to the profile; no clinical text is
// authored, generated or edited by this tree (G7's fourth property re-derived at the boundary)."
//
// The second half is the unit, and it is checked the only way that means anything: over a REAL
// rendered profile, string by string. Every string must be a declared vocabulary member, a
// declared code, an identifier copied from the input, or text a clinician wrote. There is no
// fifth category, so a composed sentence — the thing a receiving system would most like to get —
// fails without anybody having to think of the particular sentence somebody might write.
//
// Reading the renderer instead would prove nothing. It is short and obviously innocent today;
// the failure this unit guards against arrives in six months as a helpful line in a template.

import { describe, expect, it } from "vitest";
import {
  PROFILE_REFUSAL_COPY,
  PROFILE_VOCABULARY,
  REASON_CODES,
  REFUSED_PROFILE_CONTENT,
  REQUEST_CODES,
  UNMAPPED_REFERRAL_FIELDS,
  ereferralProfile,
  profileStrings,
} from "./ereferral";
import { FHIR_VERSION, LOCAL_SYSTEM } from "./fhir";
import { buildReferral, type ReferralDocument } from "@/referrals/document";
import { lintMessageText } from "@/messaging/templates";

const NARRATIVE_TEXT =
  "Mrs N has asked to be seen closer to home and is happy with a local procedure list.";

const build = (over: Partial<Parameters<typeof buildReferral>[0]> = {}): ReferralDocument => {
  const result = buildReferral(
    {
      referralId: "ref-1",
      fromPracticeId: "prac-1",
      toPracticeId: "prac-2",
      patientId: "pat-9",
      createdAt: "2026-04-02",
      createdBy: "clin-3",
      reason: "extended_scope",
      request: "procedure",
      conditionCode: null,
      recordedFactCodes: ["fact-hba1c", "fact-egfr"],
      narrative: null,
      ...over,
    },
    "2026-08-11",
  );
  if (!result.ok) throw new Error(`fixture refused: ${result.errors.join(", ")}`);
  return result.document;
};

const withNarrative = () =>
  build({
    narrative: { text: NARRATIVE_TEXT, authoredBy: "clin-3", authoredAt: "2026-04-02" },
  });

const rendered = (document: ReferralDocument) => {
  const result = ereferralProfile(document, true);
  if (!result.ok) throw new Error(`profile refused: ${result.errors.join(", ")}`);
  return result.profile;
};

/** Everything this tree is allowed to have originated, enumerated. */
const declaredStrings = (document: ReferralDocument): Set<string> =>
  new Set<string>([
    ...Object.values(PROFILE_VOCABULARY),
    ...Object.values(REASON_CODES),
    ...Object.values(REQUEST_CODES),
    FHIR_VERSION,
    `${LOCAL_SYSTEM}/referral-reason`,
    `${LOCAL_SYSTEM}/referral-request`,
    // Identifiers copied from the input, and the references built from them.
    document.referralId,
    document.patientId,
    document.createdBy,
    document.createdAt,
    `Patient/${document.patientId}`,
    `Practitioner/${document.createdBy}`,
    ...document.recordedFactCodes,
    // The unmapped register: reviewer-facing prose about the profile, not about a patient.
    ...UNMAPPED_REFERRAL_FIELDS.flatMap((f) => [f.domainField, f.why, f.wouldBecome]),
  ]);

describe("W236 the referral renders to the profile", () => {
  it("carries the referral's identity, coded reason and coded request", () => {
    const profile = rendered(build());
    expect(profile.fhirVersion).toBe(FHIR_VERSION);
    expect(profile.resourceType).toBe("ServiceRequest");
    expect(profile.id).toBe("ref-1");
    expect(profile.reasonCode).toEqual({
      system: `${LOCAL_SYSTEM}/referral-reason`,
      code: "extended-scope-gp",
    });
    expect(profile.requestCode.code).toBe("procedure");
    expect(profile.subject.reference).toBe("Patient/pat-9");
    expect(profile.requester.reference).toBe("Practitioner/clin-3");
  });

  it("references the recorded facts by code and says nothing about them", () => {
    // W120's rule at the boundary where somebody else acts on it: the codes travel, and what
    // they show is not this tree's sentence to write.
    const profile = rendered(build());
    expect(profile.supportingInfoCodes).toEqual(["fact-hba1c", "fact-egfr"]);
    expect(profile.factCodesNote).toContain("does not describe what they mean");
  });

  it("names the fields it does not carry, and what their absence would wrongly say", () => {
    // W235's rule inherited. "Dropped" is abstract; the `wouldBecome` column is the sentence
    // that stops somebody adding an extension to be helpful.
    expect(UNMAPPED_REFERRAL_FIELDS.map((f) => f.domainField).sort()).toEqual([
      "conditionCode",
      "toPracticeId",
    ]);
    for (const field of UNMAPPED_REFERRAL_FIELDS) {
      expect(field.wouldBecome.length, field.domainField).toBeGreaterThan(40);
    }
  });

  it("refuses to render a referral that never passed its own rules", () => {
    // A profile built from an invalid referral looks valid to whoever receives it.
    const result = ereferralProfile(build(), false);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toContain("referral_not_valid");
    expect(PROFILE_REFUSAL_COPY.referral_not_valid).toContain("look like a valid one");
  });
});

describe("W236 G7's fourth property, re-derived at the boundary", () => {
  it("originates no string outside its declared vocabulary, over a real profile", () => {
    // THE ASSERTION THIS UNIT EXISTS FOR. Checked over a rendered document rather than by reading
    // the renderer, because the renderer is obviously innocent today and the failure arrives
    // later as a helpful line in a template.
    const document = withNarrative();
    const allowed = declaredStrings(document);
    allowed.add(NARRATIVE_TEXT);
    allowed.add(document.narrative!.authoredBy);
    allowed.add(document.narrative!.authoredAt);
    for (const value of profileStrings(rendered(document))) {
      expect(allowed, `"${value}" was composed by this tree`).toContain(value);
    }
  });

  it("passes the clinician's words through byte for byte", () => {
    // Not trimmed, not sentence-cased, not summarised. An edited narrative is no longer the thing
    // the attribution vouches for, and the edit is invisible to both ends.
    const profile = rendered(withNarrative());
    expect("text" in profile.note && profile.note.text).toBe(NARRATIVE_TEXT);
    expect("text" in profile.note && profile.note.authoredBy).toBe("clin-3");
  });

  it("renders an absent narrative as a NAMED absence, never a placeholder", () => {
    // The distinction a receiving system must be able to make: the GP wrote nothing, versus this
    // system does not send narratives. A placeholder destroys both readings at once.
    const profile = rendered(build());
    expect("absent" in profile.note).toBe(true);
    expect("absent" in profile.note && profile.note.absent).toContain("does not compose one");
    expect(JSON.stringify(profile.note)).not.toMatch(/nil stated|see attached|N\/A/i);
  });

  it("refuses an unattributed narrative at the boundary as well as at the source", () => {
    // W131 already refuses it. Re-checked here because attribution is the only reason a free-text
    // block is acceptable in this document at all, and a boundary that trusted its input would be
    // a boundary that stops being one.
    const forged: ReferralDocument = {
      ...build(),
      narrative: { text: NARRATIVE_TEXT, authoredBy: "  ", authoredAt: "2026-04-02" },
    };
    const result = ereferralProfile(forged, true);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toContain("narrative_unattributed");
  });

  it("names the five ways of filling this profile it refuses", () => {
    // Data rather than a comment, so a later unit deletes a stated refusal rather than quietly
    // adding a helper. Every one is something a receiving system would be glad to get.
    expect(Object.keys(REFUSED_PROFILE_CONTENT).sort()).toEqual([
      "clinical_impression",
      "composed_clinical_summary",
      "edited_narrative",
      "narrative_placeholder",
      "templated_reason_prose",
    ]);
    expect(REFUSED_PROFILE_CONTENT.composed_clinical_summary).toContain(
      "under the referring GP's name",
    );
  });

  it("keeps the reason coded rather than phrased", () => {
    // A template is authoring with the author's name left blank. Every reason and request value
    // is a code token — no spaces, no sentence — so a phrase cannot arrive through this table.
    for (const code of [...Object.values(REASON_CODES), ...Object.values(REQUEST_CODES)]) {
      expect(code, code).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("carries no clinical vocabulary in anything the tree itself wrote", () => {
    // The clinician's own words are exempt by design — they are the one field this product does
    // not govern the wording of. Everything else goes through W6's shared linter.
    const authored = [
      ...Object.values(PROFILE_VOCABULARY),
      ...UNMAPPED_REFERRAL_FIELDS.map((f) => f.wouldBecome),
    ];
    for (const text of authored) {
      expect(lintMessageText(text), text).toEqual([]);
    }
  });
});

describe("W236 the boundary sends nothing", () => {
  it("takes no recipient, endpoint or transport", () => {
    // G9 is unratified and W202/W203 own delivery. `toPracticeId` is in the unmapped register
    // for exactly this reason: a profile that knew its destination is one configuration change
    // from being sent — G1 and G3's shape.
    // @ts-expect-error — there is no recipient parameter and no options object to grow one.
    void (() => ereferralProfile(build(), true, { recipient: "prac-2" }));
    expect(JSON.stringify(rendered(build()))).not.toContain("prac-2");
  });
});

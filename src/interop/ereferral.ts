// W236: W131's structured referral, rendered to an e-referral profile — and the one thing the
// boundary must not do.
//
// G7's fourth rail property is "the product writes no clinical text". Every unit that has
// re-derived it so far did so on a surface Meherr controls, where the temptation is mild. THIS
// boundary is where the pressure actually lives, and it is a specific, ordinary pressure:
//
//   AN INTEROP PROFILE HAS REQUIRED FIELDS, AND A RECEIVING SYSTEM WANTS PROSE. A ServiceRequest
//   that arrives with codes and no readable summary looks empty to a triage clerk, and the
//   obvious fix is to compose one — "Referral for extended-scope procedure; recorded facts:
//   HbA1c, eGFR" — from data the product already holds. That sentence is clinical text about a
//   patient, written by software, and it would arrive at another practice under the referring
//   GP's name. Nobody would call it authoring. It is authoring.
//
// SO THE PROPERTY IS RE-DERIVED MECHANICALLY RATHER THAN PROMISED. Every string this module puts
// in a profile is either (a) a member of a DECLARED vocabulary — the code tables below, which a
// reviewer reads in one place — or (b) byte-identical to something a clinician wrote. There is
// no third source, and `profileStrings` exists so a test can check that over a real document
// rather than by reading the renderer. A composed sentence is neither, so it fails.
//
// THE NARRATIVE IS PASSED THROUGH OR ABSENT. Never templated, never summarised, never truncated,
// never "cleaned up". W131 already requires attribution on it — that field is the only reason a
// free-text block is acceptable at all — so the profile carries the author and the time with the
// text, and an absent narrative is rendered as a NAMED ABSENCE rather than filled. W205's rule
// about a caveat that only appears on the incomplete case cuts the other way here: the receiving
// system must be able to tell "the GP wrote nothing" from "this system does not send narratives".
//
// UNMAPPED FIELDS ARE NAMED, W235's rule inherited rather than restated. A referral field with no
// home in the profile is listed with what a naive reader would wrongly conclude from its absence,
// because "dropped" is abstract and "arrives as a referral with no recorded facts behind it" is
// the sentence that stops somebody adding an extension to be helpful.
//
// FOUNDER GATE: this module renders a document; it sends nothing. There is no endpoint, no
// transport and no recipient parameter — W202/W203 own delivery and G9 is unratified. The
// profile is a value a test can look at, which is the only thing it is.

import { FHIR_VERSION, LOCAL_SYSTEM, type UnmappedField } from "./fhir";
import type { ClinicianNarrative, ReferralDocument } from "@/referrals/document";

/**
 * The profile's declared vocabulary — every string this module may originate.
 *
 * A closed list, because "what else could we put in the document" is a question that should
 * require editing this file. W196's `REFUSED_FIGURES` shape applied to prose: the set of strings
 * the tree is allowed to author is enumerable, and everything else must have come from a person.
 */
export const PROFILE_VOCABULARY = {
  resourceType: "ServiceRequest",
  status: "active",
  intent: "order",
  narrativeAbsent:
    "No narrative was written by the referring clinician. This system does not compose one, so its absence means the clinician wrote none — not that the referral was sent without it.",
  factCodesNote:
    "Recorded fact codes are referenced, not restated. This system sends the codes the practice recorded; it does not describe what they mean or what they show.",
} as const;

/** The reason and request vocabularies, as coded values rather than sentences. */
export const REASON_CODES: Readonly<Record<string, string>> = {
  extended_scope: "extended-scope-gp",
  second_opinion: "second-opinion",
  procedure_access: "procedure-access",
  shared_care: "shared-care",
};

export const REQUEST_CODES: Readonly<Record<string, string>> = {
  procedure: "procedure",
  assessment: "assessment",
  ongoing_management: "ongoing-management",
};

/**
 * Referral fields with no home in this profile, and the lie each absence would tell.
 *
 * W235's `UnmappedField` reused rather than re-declared, so a reviewer meets one shape.
 */
export const UNMAPPED_REFERRAL_FIELDS: readonly UnmappedField[] = [
  {
    domainField: "conditionCode",
    why: "A register/condition code is the practice's own catalogue key, and W238 is where codes are bound to SNOMED CT-AU with provenance. Sending an unbound local code as though it were a terminology code is the mislabel W227 refused for calendars.",
    wouldBecome:
      "Arrives as a referral about a named condition, in a coding system the receiving practice will resolve against the wrong catalogue.",
  },
  {
    domainField: "toPracticeId",
    why: "The receiving practice is the destination, not content. Delivery is W202/W203's and G9 is unratified, so a profile that carried a recipient would be one configuration change from being sent.",
    wouldBecome:
      "Arrives as a document that already knows where it is going, which is the shape of a transport this tree has not built.",
  },
];

export type ProfileRefusal =
  /** The document itself was never valid, so there is nothing to render. */
  | "referral_not_valid"
  /** A narrative without an author. W131 refuses it; the boundary refuses it again. */
  | "narrative_unattributed";

export const PROFILE_REFUSAL_COPY: Record<ProfileRefusal, string> = {
  referral_not_valid:
    "This referral did not pass its own rules, so there is no document to render. A profile built from an invalid referral would look like a valid one to whoever receives it.",
  narrative_unattributed:
    "The narrative has no recorded author. Attribution is the only reason free text is acceptable in this document at all, so an unattributed narrative is refused here as well as at the source.",
};

/**
 * Ways of filling this profile that are refused, each with its reason.
 *
 * Data rather than a comment, so a later unit has to DELETE a stated refusal rather than quietly
 * add a helper. Every one of these is something a receiving system would be glad to get.
 */
export const REFUSED_PROFILE_CONTENT: Readonly<Record<string, string>> = {
  composed_clinical_summary:
    "Building a readable summary from the reason, request and recorded fact codes. It is the first thing anybody would add, because a ServiceRequest with no prose looks empty to whoever opens it — and it is clinical text about a patient, written by software, arriving under the referring GP's name. G7's fourth property is exactly this sentence.",
  templated_reason_prose:
    "Turning `reason` into a phrase like \"referred for a second opinion regarding...\". A template is authoring with the author's name left blank; the code is the referral's reason and the receiving system can render it however it renders codes.",
  clinical_impression:
    "Any field carrying what the facts suggest. The recorded facts are referenced by code precisely so that nothing in this tree says what they show — W120's rule, at the one boundary where somebody else would act on it.",
  edited_narrative:
    "Trimming, summarising, spell-correcting or reformatting the clinician's own words. An edited narrative is no longer the thing the attribution vouches for, and the edit is invisible to both ends.",
  narrative_placeholder:
    "Filling an absent narrative with 'see attached' or 'nil stated'. A placeholder is a sentence this tree wrote in a field reserved for a person, and it destroys the distinction between a clinician who wrote nothing and a system that sends nothing.",
};

export interface EReferralProfile {
  fhirVersion: string;
  resourceType: string;
  id: string;
  status: string;
  intent: string;
  /** Coded, never prose. */
  reasonCode: { system: string; code: string };
  requestCode: { system: string; code: string };
  subject: { reference: string };
  requester: { reference: string };
  authoredOn: string;
  /** Fact codes, referenced. The note says they are references, and says nothing about them. */
  supportingInfoCodes: readonly string[];
  factCodesNote: string;
  /**
   * The clinician's own words, or a named absence.
   *
   * `text` is byte-identical to what they wrote. There is no path in this module that produces a
   * `text` value not present in the input — see the module note and `profileStrings`.
   */
  note: { text: string; authoredBy: string; authoredAt: string } | { absent: string };
  unmapped: readonly UnmappedField[];
}

export type ProfileResult =
  | { ok: true; profile: EReferralProfile }
  | { ok: false; errors: ProfileRefusal[] };

/**
 * Render one referral to the profile.
 *
 * Takes a `ReferralDocument`, which W131 only issues through `buildReferral` — so an invalid
 * referral cannot reach here except by being constructed by hand, and `valid` is required rather
 * than inferred so that a caller cannot pass an unchecked object and get a document that looks
 * checked.
 */
export function ereferralProfile(
  document: ReferralDocument,
  valid: boolean,
): ProfileResult {
  const errors: ProfileRefusal[] = [];
  if (!valid) errors.push("referral_not_valid");
  if (document.narrative && document.narrative.authoredBy.trim() === "") {
    errors.push("narrative_unattributed");
  }
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    profile: {
      fhirVersion: FHIR_VERSION,
      resourceType: PROFILE_VOCABULARY.resourceType,
      id: document.referralId,
      status: PROFILE_VOCABULARY.status,
      intent: PROFILE_VOCABULARY.intent,
      reasonCode: {
        system: `${LOCAL_SYSTEM}/referral-reason`,
        code: REASON_CODES[document.reason] ?? document.reason,
      },
      requestCode: {
        system: `${LOCAL_SYSTEM}/referral-request`,
        code: REQUEST_CODES[document.request] ?? document.request,
      },
      subject: { reference: `Patient/${document.patientId}` },
      requester: { reference: `Practitioner/${document.createdBy}` },
      authoredOn: document.createdAt,
      supportingInfoCodes: [...document.recordedFactCodes],
      factCodesNote: PROFILE_VOCABULARY.factCodesNote,
      note: noteFrom(document.narrative),
      unmapped: UNMAPPED_REFERRAL_FIELDS,
    },
  };
}

/** Verbatim, or a named absence. There is deliberately no third branch. */
function noteFrom(narrative: ClinicianNarrative | null): EReferralProfile["note"] {
  if (!narrative) return { absent: PROFILE_VOCABULARY.narrativeAbsent };
  return {
    text: narrative.text,
    authoredBy: narrative.authoredBy,
    authoredAt: narrative.authoredAt,
  };
}

/**
 * Every string in a profile, flattened.
 *
 * Exists so G7's fourth property can be checked over a REAL document rather than by reading the
 * renderer: each of these must be a declared vocabulary member, a declared code, an identifier
 * copied from the input, or text a clinician wrote. A composed sentence is none of those.
 */
export function profileStrings(profile: EReferralProfile): string[] {
  const out: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(profile);
  return out;
}

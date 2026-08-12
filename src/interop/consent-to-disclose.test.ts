// W243 verify gate: "a disclosure without a recorded patient consent is refused BY TYPE; silence
// is never consent (W135), and no timeout grants it (W134)."
//
// The type half is checked with `@ts-expect-error` AND with a structural pin, because the brand
// only proves a caller cannot forge one — the failure that actually happens is a second producer
// inside the module.
//
// The no-timeout half is checked as a PROPERTY over swept dates rather than as one example, and
// the property is the narrow one: no elapsed time AFTER THE LAST RECORDED ACT moves a verdict
// towards `given`. The wide version — "the verdict never improves with time" — is false, because
// replaying a past date against a consent recorded later legitimately goes from `not_recorded` to
// `given`. A test asserting the wide version would pass here and would be forbidding the wrong
// thing; the sweep below pins the narrow one and a separate case pins that replay still works.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as consentModule from "./consent-to-disclose";
import {
  CONSENT_VERDICT_COPY,
  OUT_OF_SCOPE_HERE,
  REFUSED_CONSENT_SOURCES,
  SCOPE_MISMATCH_COPY,
  authoriseDisclosure,
  consentDecision,
  type AuthorisedDisclosure,
  type ConsentAct,
  type ConsentScope,
  type ConsentVerdict,
} from "./consent-to-disclose";
import { renderDisclosure, type Disclosure } from "./disclosure-ledger";
import { foldIsOrderIndependent } from "@/quality/order-independence";
import type { PatientId, PracticeId } from "@/domain/types";

const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/consent-to-disclose.ts"), "utf8");

const PRACTICE = "prac-1" as PracticeId;
const PATIENT = "pat-1" as PatientId;

const WANT: ConsentScope = {
  practiceId: PRACTICE,
  recipientClass: "phn_or_commissioner",
  kind: "reporting_summary",
  coversFromIso: "2026-04-01",
  coversToIso: "2026-06-30",
};

/**
 * A recorded consent, TYPED rather than cast.
 *
 * W234's lesson: a fixture that reaches its shape with `as ConsentAct` stops checking the type it
 * claims to be, compiles with the wrong field names, and makes a guard pass for the wrong reason.
 * The overrides are named individually so nothing here can drift from the union.
 */
const given = (
  over: {
    patientId?: PatientId;
    practiceId?: PracticeId;
    atIso?: string;
    expiresAtIso?: string | null;
    scope?: Partial<ConsentScope>;
  } = {},
): ConsentAct => ({
  act: "given",
  patientId: over.patientId ?? PATIENT,
  practiceId: over.practiceId ?? PRACTICE,
  atIso: over.atIso ?? "2026-03-01",
  recordedBy: "reception@demo.practice.example",
  channel: "signed_form",
  expiresAtIso: over.expiresAtIso === undefined ? null : over.expiresAtIso,
  scope: { ...WANT, ...(over.scope ?? {}) },
});

const withdrawn = (atIso: string): ConsentAct => ({
  act: "withdrawn",
  patientId: PATIENT,
  practiceId: PRACTICE,
  atIso,
  recordedBy: "reception@demo.practice.example",
  reason: "Patient asked us to stop sharing their information.",
});

/** W239's row, which deliberately carries no patient. Used to check the subjects stay out of it. */
const disclosure: Disclosure = {
  practiceId: PRACTICE,
  recipientClass: "phn_or_commissioner",
  recipientName: "Demo PHN (synthetic)",
  kind: "reporting_summary",
  periodFromIso: "2026-04-01",
  periodToIso: "2026-06-30",
  disclosedAtIso: "2026-07-05",
  disclosedBy: "manager@demo.practice.example",
  acknowledgement: "not_recorded",
  payload: { held: false, why: "The ledger is in fact-of-sending-only mode." },
};

const verdictAt = (acts: readonly ConsentAct[], asAtIso: string): ConsentVerdict =>
  consentDecision(PATIENT, WANT, acts, asAtIso).verdict;

describe("W243 silence is never consent", () => {
  it("reports nothing recorded as nothing recorded, and reads nothing into it", () => {
    const decision = consentDecision(PATIENT, WANT, [], "2026-07-05");
    expect(decision.verdict).toBe("not_recorded");
    expect(decision.restsOn).toBeNull();
    expect(decision.copy).toContain("an absent answer is not agreement");
  });

  it("does not let another patient's consent answer for this one", () => {
    // The simplest form of the failure this unit is about: a consent record exists, it is just not
    // this patient's.
    const other = given({ patientId: "pat-2" as PatientId });
    expect(verdictAt([other], "2026-07-05")).toBe("not_recorded");
  });

  it("does not let a consent given to another practice travel", () => {
    // Filtered before scope matching, so it reads as silence rather than as an out-of-scope
    // consent this practice could argue about. A patient's agreement with one practice is not a
    // fact about another.
    const elsewhere = given({ practiceId: "prac-2" as PracticeId });
    expect(verdictAt([elsewhere], "2026-07-05")).toBe("not_recorded");
  });
});

describe("W243 no timeout grants it", () => {
  // My first version of this asserted the sweep is never `given` at any point, and the expiring
  // fixture failed it — correctly, because that consent IS given at the moment it is recorded and
  // stops later. The failure was in the property, not the code: what W134 forbids is time moving a
  // verdict TOWARDS `given`, so the checkable form is that, holding the acts fixed and sweeping
  // forward from the last one, `given` is monotone non-increasing and the far future never
  // authorises. Both are asserted below.
  const fixtures: Array<[string, ConsentAct[]]> = [
    ["nothing recorded at all", []],
    ["a withdrawal", [given(), withdrawn("2026-03-02")]],
    ["a consent that expired", [given({ expiresAtIso: "2026-05-01" })]],
    ["a consent for a different recipient", [given({ scope: { recipientClass: "payer_or_insurer" } })]],
    ["a consent for a different kind", [given({ scope: { kind: "ereferral_document" } })]],
    ["a consent whose period stops short", [given({ scope: { coversToIso: "2026-05-31" } })]],
  ];

  it.each(fixtures)("never ripens into consent: %s", (_label, acts) => {
    // Sweep forward from the last recorded act to five years out. Nothing about the passage of
    // time may move a verdict towards `given` — not an expiry passing, not a withdrawal ageing,
    // not a consent request going unanswered for years.
    const latest = acts.map((a) => a.atIso).sort().at(-1) ?? "2026-01-01";
    const sweep = [latest, "2026-06-30", "2026-07-05", "2027-01-01", "2029-01-01", "2031-06-30"]
      .filter((d) => d >= latest)
      .sort();
    expect(sweep.length).toBeGreaterThan(2);

    let lost: string | null = null;
    for (const asAt of sweep) {
      const verdict = verdictAt(acts, asAt);
      if (verdict !== "given") lost ??= asAt;
      else expect(lost, `consent came back at ${asAt} after being ${lost && verdictAt(acts, lost)} at ${lost}`).toBeNull();
    }
    // And the far future authorises nothing, which is the sentence W134 actually writes: no
    // elapsed time turns silence, a withdrawal, an expiry or a wrong scope into agreement.
    expect(verdictAt(acts, sweep.at(-1)!), "five years of waiting produced a consent").not.toBe(
      "given",
    );
  });

  it("still answers a REPLAYED date honestly, which is why the rule is the narrow one", () => {
    // The case that makes the wide "never improves with time" version false, and it is a real
    // question: was this authorised on the day it was sent? Before the consent was recorded the
    // honest answer is `not_recorded`, and after it, `given`. Pinned so a later unit does not
    // "fix" the sweep above into something that forbids this.
    const acts = [given({ atIso: "2026-05-01" })];
    expect(verdictAt(acts, "2026-04-01")).toBe("not_recorded");
    expect(verdictAt(acts, "2026-05-02")).toBe("given");
  });

  it("expiry is the safe direction and still runs, so the sweep is not a wall", () => {
    // Non-vacuity for the whole describe: time DOES move a verdict, away from `given`.
    const acts = [given({ expiresAtIso: "2026-08-01" })];
    expect(verdictAt(acts, "2026-07-05")).toBe("given");
    expect(verdictAt(acts, "2026-08-02")).toBe("expired");
  });

  it("distinguishes expired from never given, because they are different instructions", () => {
    expect(CONSENT_VERDICT_COPY.expired).toContain("not a refusal and it is not silence");
    expect(CONSENT_VERDICT_COPY.expired).toContain("Ask them again");
    expect(CONSENT_VERDICT_COPY.expired).not.toBe(CONSENT_VERDICT_COPY.not_recorded);
  });

  it("requires the moment to be asked about rather than defaulting to now", () => {
    // "Is this authorised" and "was this authorised when it was sent" are different questions, and
    // a default would answer the first when somebody asked the second.
    // @ts-expect-error — `asAtIso` is required.
    void (() => consentDecision(PATIENT, WANT, []));
  });
});

describe("W243 a consent is read narrowly and a withdrawal broadly", () => {
  it("refuses a consent naming a different recipient class, and says so", () => {
    // THE FAILURE THIS UNIT IS FOR. A consent record exists, every "is there a consent" check
    // passes, and the patient agreed to their new practice rather than to a commissioner.
    const decision = consentDecision(
      PATIENT,
      WANT,
      [given({ scope: { recipientClass: "another_practice" } })],
      "2026-07-05",
    );
    expect(decision.verdict).toBe("out_of_scope");
    expect(decision.mismatches).toEqual(["different_recipient_class"]);
    expect(decision.restsOn, "the verdict does not say what it rests on").not.toBeNull();
    expect(SCOPE_MISMATCH_COPY.different_recipient_class).toContain("commissioner");
  });

  it("names every dimension that did not match rather than the first", () => {
    const decision = consentDecision(
      PATIENT,
      WANT,
      [
        given({
          scope: {
            recipientClass: "payer_or_insurer",
            kind: "fhir_resource_bundle",
            coversToIso: "2026-04-30",
          },
        }),
      ],
      "2026-07-05",
    );
    expect([...decision.mismatches].sort()).toEqual([
      "different_kind",
      "different_recipient_class",
      "period_not_covered",
    ]);
  });

  it("requires the consent to cover the WHOLE period, not to overlap it", () => {
    // A consent covering half the period is a consent to half a disclosure, and there is no such
    // disclosure — this one either goes or it does not. W205's shape: a real record under a period
    // it does not cover reads as complete.
    expect(verdictAt([given({ scope: { coversFromIso: "2026-05-01" } })], "2026-07-05")).toBe(
      "out_of_scope",
    );
    expect(verdictAt([given({ scope: { coversToIso: "2026-06-29" } })], "2026-07-05")).toBe(
      "out_of_scope",
    );
    // Non-vacuity: an exactly-covering and a wider consent both pass.
    expect(verdictAt([given()], "2026-07-05")).toBe("given");
    expect(
      verdictAt([given({ scope: { coversFromIso: "2026-01-01", coversToIso: "2026-12-31" } })], "2026-07-05"),
    ).toBe("given");
  });

  it("withdraws everything for the patient, not only the scope the withdrawal names", () => {
    // A withdrawal has no scope field to narrow it. A patient who says "stop sharing my records"
    // must not stay consented for the three scopes they did not think to mention.
    const acts = [
      given(),
      given({ atIso: "2026-03-05", scope: { kind: "ereferral_document" } }),
      withdrawn("2026-03-10"),
    ];
    expect(verdictAt(acts, "2026-07-05")).toBe("withdrawn");
    expect(
      consentDecision(PATIENT, { ...WANT, kind: "ereferral_document" }, acts, "2026-07-05").verdict,
    ).toBe("withdrawn");
    expect(SOURCE).not.toMatch(/act: "withdrawn";[^}]*scope/);
  });

  it("W167 a consent and a withdrawal on the same day resolve to withdrawn, either way round", () => {
    // FOUND BY W167'S FOLD REGISTER, not by me. `atIso` is date-only, so a patient who agreed in
    // the morning and withdrew in the afternoon is indistinguishable from the reverse; the sort is
    // stable, so the answer would have fallen back to whatever order the caller's array was in —
    // a store's order deciding whether a record is disclosed. Resolving towards the withdrawal is
    // this module's own narrow/broad rule rather than a coin-toss made consistent, and W188
    // resolves a same-day join and leave the same way.
    const sameDay = [given({ atIso: "2026-04-01" }), withdrawn("2026-04-01")];
    const fold = (acts: readonly ConsentAct[]) => verdictAt(acts, "2026-07-05");
    const stability = foldIsOrderIndependent(fold, sameDay);
    expect(stability.stable, "the tie is decided by the caller's array order").toBe(true);
    expect(stability.forward).toBe("withdrawn");
    // Non-vacuity for the tie-break: on DIFFERENT days the later act still wins, both ways.
    expect(fold([given({ atIso: "2026-04-02" }), withdrawn("2026-04-01")])).toBe("given");
    expect(fold([given({ atIso: "2026-04-01" }), withdrawn("2026-04-02")])).toBe("withdrawn");
  });

  it("lets a patient change their mind back, because refusing to would override them", () => {
    const acts = [given(), withdrawn("2026-03-10"), given({ atIso: "2026-04-02" })];
    expect(verdictAt(acts, "2026-07-05")).toBe("given");
  });

  it("does not resurrect an older matching consent behind a newer narrower one", () => {
    // The patient's most recent statement is their statement. Searching the history for any act
    // that matches is how a superseded consent authorises a disclosure the patient has since
    // narrowed.
    const acts = [
      given({ atIso: "2026-03-01" }),
      given({ atIso: "2026-04-01", scope: { recipientClass: "another_practice" } }),
    ];
    expect(verdictAt(acts, "2026-07-05")).toBe("out_of_scope");
  });

  it("writes copy for every verdict and every mismatch", () => {
    for (const [name, copy] of Object.entries(CONSENT_VERDICT_COPY)) {
      expect(copy.length, name).toBeGreaterThan(60);
    }
    for (const [name, copy] of Object.entries(SCOPE_MISMATCH_COPY)) {
      expect(copy.length, name).toBeGreaterThan(60);
    }
  });
});

describe("W243 a disclosure without recorded consent is refused BY TYPE", () => {
  it("cannot be written as an object literal", () => {
    // @ts-expect-error — the brand is not constructible outside this module.
    const forged: AuthorisedDisclosure = { disclosure, subjects: [PATIENT], restsOn: [] };
    void forged;
  });

  it("mints the brand in exactly one place", () => {
    // The `@ts-expect-error` only proves a CALLER cannot forge one. This proves the module has not
    // grown a second producer — a convenience that authorises without checking is one line, and it
    // makes the brand decorative.
    expect((SOURCE.match(/as AuthorisedDisclosure\b/g) ?? []).length).toBe(1);
    const [, tail] = SOURCE.split("export function authoriseDisclosure");
    expect(tail ?? "").toContain("as AuthorisedDisclosure");
  });

  it("refuses the whole disclosure when any one subject has not consented", () => {
    // ALL SUBJECTS OR NONE. Quietly dropping the unconsented ones sends a different disclosure
    // from the one the operator asked for, it looks complete at both ends, and nobody finds out.
    const subjects = [PATIENT, "pat-2" as PatientId, "pat-3" as PatientId];
    const acts = [given(), given({ patientId: "pat-2" as PatientId })];
    const result = authoriseDisclosure(disclosure, subjects, acts, "2026-07-05");
    expect(result.authorised).toBe(false);
    if (result.authorised) return;
    expect(result.refusals.map((r) => r.patientId)).toEqual(["pat-3"]);
    expect(result.copy, "the refusal does not name the patient to ask").toContain("pat-3");
    expect(result.copy).toContain("1 of 3");
  });

  it("authorises when every subject has consented, so the refusal is not a wall", () => {
    const subjects = [PATIENT, "pat-2" as PatientId];
    const acts = [given(), given({ patientId: "pat-2" as PatientId })];
    const result = authoriseDisclosure(disclosure, subjects, acts, "2026-07-05");
    expect(result.authorised).toBe(true);
    if (!result.authorised) return;
    expect(result.authorisation.subjects).toEqual(subjects);
    expect(result.authorisation.restsOn.map((d) => d.verdict)).toEqual(["given", "given"]);
    // The authorisation carries THE disclosure, so it cannot be held and re-pointed.
    expect(result.authorisation.disclosure).toBe(disclosure);
  });

  it("refuses an empty subject list rather than authorising vacuously", () => {
    // `every()` over nothing is true, which is how an empty list becomes a general authorisation.
    const result = authoriseDisclosure(disclosure, [], [], "2026-07-05");
    expect(result.authorised).toBe(false);
    expect(!result.authorised && result.copy).toContain("nobody having been asked");
  });

  it("has no exported way to authorise without the acts", () => {
    // A `mayDisclose(disclosure)` that read a store would be the shape W239 refused for its
    // ledger, one module along: permission from an absence.
    for (const name of Object.keys(consentModule)) {
      expect(name, `${name} reads as a permission that consults nothing`).not.toMatch(
        /^may|^can|^is(Allowed|Permitted)|assume|presum/i,
      );
    }
  });
});

describe("W243 the subjects stay out of W239's ledger row", () => {
  it("does not put a patient on a disclosure row", () => {
    // W239's `fact_of_sending_only` mode holds no patient identifier, and its record class rests
    // on that. This unit needs the patients, so the AUTHORISATION holds them and the row does not.
    const result = authoriseDisclosure(disclosure, [PATIENT], [given()], "2026-07-05");
    expect(result.authorised).toBe(true);
    if (!result.authorised) return;
    expect(JSON.stringify(result.authorisation.disclosure)).not.toContain(PATIENT);
    expect(renderDisclosure(result.authorisation.disclosure)).not.toContain(PATIENT);
  });

  it("exports nothing that writes a subject into a disclosure", () => {
    expect(SOURCE).not.toMatch(/subjects\s*:\s*\[?[^\]]*\]?\s*\}\s*as Disclosure/);
    expect(SOURCE).not.toContain("patientId: disclosure");
  });
});

describe("W243 nothing manufactures a consent", () => {
  it("names every way of manufacturing one it refuses, each with its reason", () => {
    // The count lived in this title and had to be bumped when W247 added the eighth. Named in the
    // list and not in the prose now, so the register is the only place the number lives.
    expect(Object.keys(REFUSED_CONSENT_SOURCES).sort()).toEqual([
      "a_prior_disclosure_as_precedent",
      "a_scope_that_does_not_describe_the_disclosure",
      "a_timeout_that_ripens",
      "an_opt_out_window",
      "broad_consent_at_registration",
      "reusing_sms_consent",
      "silence_after_a_request",
      "the_practice_consenting_for_the_patient",
    ]);
    for (const [name, why] of Object.entries(REFUSED_CONSENT_SOURCES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
  });

  it("does not read the SMS consent that is already in this tree", () => {
    // Listed first among the refusals because it is not hypothetical: `patient.smsConsent` exists
    // in `src/engine/eligibility.ts` and reusing it here is one line. Agreeing to a text about an
    // appointment is not agreeing that your record goes to a commissioner, and afterwards the two
    // would be indistinguishable in the ledger.
    expect(SOURCE).not.toMatch(/smsConsent[^`]/);
    expect(REFUSED_CONSENT_SOURCES.reusing_sms_consent).toContain("ONE LINE");
  });

  it("says what it does not do, and who owns each", () => {
    expect(Object.keys(OUT_OF_SCOPE_HERE).sort()).toEqual([
      "disclosures_with_no_patient_subject",
      "storing_consents",
      "withdrawing_a_disclosure_already_made",
    ]);
    // The aggregate question is NAMED and not answered — answering it in code would be the answer,
    // and nothing here exempts a disclosure from consent.
    expect(OUT_OF_SCOPE_HERE.disclosures_with_no_patient_subject).toContain("not entitled to answer");
    expect(SOURCE).not.toMatch(/aggregat\w+\s*\)?\s*(\?|&&|\|\|)|if \(.*deIdentified/);
  });

  it("keeps no consent and no store", () => {
    // Recorded consents are statements by real patients. G9 is unratified, nothing has ever been
    // disclosed, and the acts are parameters — W202 owns the store and W202 is blocked.
    expect(SOURCE).not.toMatch(/globalThis as \{/);
    expect(SOURCE).not.toMatch(/SHIPPED_CONSENTS|const .*: ConsentAct\[\] = \[\s*\{/);
  });
});

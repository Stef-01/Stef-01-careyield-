// W247 verify gate: "security-review skill over every new boundary; the disclosure ledger's own
// W106 classification."
//
// A hardening week's tests are not the ones that were written while building. These pin what the
// REVIEW found, so a finding that was fixed once cannot come back quietly — W128's lesson about a
// guard that compensated for a bug nobody had tested.
//
// HOW THE REVIEW WAS RUN, stated because the method is part of the deliverable. The
// security-review skill's methodology was applied directly across the eight Q19 boundary modules
// rather than fanned out to sub-agents, because this session forbids the agent tool; the
// substance — repository context, comparative analysis against the tree's existing controls, then
// per-module vulnerability assessment on the >80%-confidence bar — is what produced the two
// findings below. Both are recorded in `docs/HARDENING-Q19.md` with what changed.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as consentModule from "@/interop/consent-to-disclose";
import {
  authoriseDisclosure,
  scopeOfDisclosure,
  type ConsentAct,
} from "@/interop/consent-to-disclose";
import {
  DISCLOSURE_LEDGER_RECORD_CLASS,
  MODE_CONSEQUENCES,
  PAYLOAD_MODE,
  currentConsequence,
  renderDisclosure,
  type Disclosure,
} from "@/interop/disclosure-ledger";
import { RECORD_CLASSES, storedClasses } from "@/privacy/record-classes";
import type { PatientId, PracticeId } from "@/domain/types";

const CONSENT_SOURCE = readFileSync(
  path.join(process.cwd(), "src/interop/consent-to-disclose.ts"),
  "utf8",
);
const DOSSIER = readFileSync(path.join(process.cwd(), "docs/HARDENING-Q19.md"), "utf8");

const PATIENT = "pat-1" as PatientId;

const disclosure = (over: Partial<Disclosure> = {}): Disclosure => ({
  practiceId: "prac-1",
  recipientClass: "another_practice",
  recipientName: "Riverside Medical",
  kind: "ereferral_document",
  periodFromIso: "2026-04-01",
  periodToIso: "2026-06-30",
  disclosedAtIso: "2026-07-05T09:00:00+10:00",
  disclosedBy: "manager@demo.practice.example",
  acknowledgement: "not_recorded",
  payload: { held: false, why: "Fact-of-sending-only mode." },
  ...over,
});

const consentFor = (d: Disclosure): ConsentAct => ({
  patientId: PATIENT,
  practiceId: "prac-1" as PracticeId,
  atIso: "2026-03-01",
  recordedBy: "gp@demo.practice.example",
  act: "given",
  channel: "signed_form",
  scope: scopeOfDisclosure(d),
  expiresAtIso: null,
});

describe("W247 FINDING 1: the consent scope is read off the disclosure, never handed in beside it", () => {
  it("cannot be given a scope that disagrees with what is being sent", () => {
    // THE finding. `authoriseDisclosure` took a `want` parameter and never checked it described
    // the disclosure it was authorising, so a scope built from a template or a previous send
    // produced a genuine brand-carrying authorisation for a recipient, kind or period nobody had
    // agreed to — carrying a consent record, which is what made it look checked. That is the
    // sentence the module's own note calls unrepresentable; it was representable, one argument
    // away. The parameter is gone, so the disagreement has nowhere to live.
    // Scoped to THIS function. `consentDecision` legitimately takes a scope — it is the
    // lower-level answer about one patient against one scope, and a caller showing a patient what
    // they are being asked to agree to needs exactly that. The finding was never "a scope
    // parameter exists"; it was that the AUTHORISER took one it never checked.
    const params = CONSENT_SOURCE.split("export function authoriseDisclosure")[1]!.split(")")[0]!;
    expect(params).not.toContain("ConsentScope");
    expect(params).toContain("disclosure: Disclosure");
  });

  it("derives every dimension of the scope from the disclosure", () => {
    // The two types carry the same four dimensions, which is why the scope was derivable all along
    // and why passing it separately was never a capability — only a way to disagree.
    const d = disclosure();
    expect(scopeOfDisclosure(d)).toEqual({
      practiceId: d.practiceId,
      recipientClass: d.recipientClass,
      kind: d.kind,
      coversFromIso: d.periodFromIso,
      coversToIso: d.periodToIso,
    });
  });

  it("refuses a consent given for a DIFFERENT recipient, kind or period", () => {
    // The exploit, run four ways. Before the fix each of these authorised: the consent was checked
    // against the caller's scope and the authorisation carried the caller's disclosure.
    const target = disclosure({ recipientClass: "payer_or_insurer" });
    for (const consented of [
      disclosure(),
      disclosure({ kind: "fhir_resource_bundle" }),
      disclosure({ periodFromIso: "2026-01-01", periodToIso: "2026-03-31" }),
      disclosure({ practiceId: "prac-2" }),
    ]) {
      const result = authoriseDisclosure(target, [PATIENT], [consentFor(consented)], "2026-07-05");
      expect(result.authorised, `a consent for another scope authorised a payer disclosure`).toBe(
        false,
      );
    }
  });

  it("still authorises when the consent is genuinely for THIS disclosure", () => {
    // Non-vacuity: a fix that refused everything would pass every assertion above.
    const target = disclosure({ recipientClass: "payer_or_insurer" });
    const result = authoriseDisclosure(target, [PATIENT], [consentFor(target)], "2026-07-05");
    expect(result.authorised).toBe(true);
    if (!result.authorised) throw new Error("unreachable");
    expect(result.authorisation.disclosure).toBe(target);
  });
});

describe("W247 FINDING 2: the refusal copy names patients, and must not travel", () => {
  it("names them, which is the deliberate behaviour", () => {
    // Not a defect: W243 argues it, and "ask these three people" is the actionable sentence for a
    // practice that already holds those identities. Pinned so the argument stays visible.
    const result = authoriseDisclosure(disclosure(), [PATIENT], [], "2026-07-05");
    expect(result.authorised).toBe(false);
    if (result.authorised) throw new Error("unreachable");
    expect(result.copy).toContain(PATIENT);
  });

  it("never reaches a ledger row or anything rendered from one", () => {
    // The hardening half. The copy is the one string in Q19 that carries patient identifiers by
    // design, and nothing structurally stopped it being placed on a disclosure row — where W239's
    // whole record class rests on rows holding no patient. Asserted on the rendered row, because
    // that is the artefact a reader sees.
    const d = disclosure();
    expect(JSON.stringify(d)).not.toContain(PATIENT);
    expect(renderDisclosure(d)).not.toContain(PATIENT);
    // And the ledger's own row TYPE has nowhere to put it. Asserted on the interface rather than
    // on an instance, which the first version got wrong: adding `subjects?: readonly string[]` to
    // `Disclosure` left every key check passing, because an absent optional field is absent from
    // `Object.keys`. A type-level hole is invisible to an instance-level scan.
    const LEDGER_SOURCE = readFileSync(
      path.join(process.cwd(), "src/interop/disclosure-ledger.ts"),
      "utf8",
    );
    const rowType = LEDGER_SOURCE.split("export interface Disclosure {")[1]!.split("\n}")[0]!;
    expect(rowType.length, "the Disclosure interface moved").toBeGreaterThan(100);
    expect(rowType, "the ledger row grew a place to put a patient").not.toMatch(
      /subject|patient|copy|refusal/i,
    );
    expect(Object.keys(d)).not.toContain("subjects");
  });

  it("keeps the subjects on the authorisation, which is not a ledger row", () => {
    const target = disclosure();
    const result = authoriseDisclosure(target, [PATIENT], [consentFor(target)], "2026-07-05");
    if (!result.authorised) throw new Error("unreachable");
    expect(result.authorisation.subjects).toEqual([PATIENT]);
    expect(JSON.stringify(result.authorisation.disclosure)).not.toContain(PATIENT);
  });
});

describe("W247 the disclosure ledger's own W106 classification, re-derived", () => {
  it("re-derives it from the mode rather than re-reading the entry", () => {
    // The gate names this specifically, and RE-DERIVE is the word — W221's rule. Re-reading the
    // register would confirm the register agrees with itself. This recomputes what the
    // classification OUGHT to be from the shipped payload mode and requires the register to match.
    const oughtToBe = MODE_CONSEQUENCES[PAYLOAD_MODE].w106Handling;
    const declared = RECORD_CLASSES.find((c) => c.module === "src/interop/disclosure-ledger.ts");
    expect(declared, "the ledger is not classified at all").toBeDefined();
    expect(declared!.handling).toBe(oughtToBe);
    expect(DISCLOSURE_LEDGER_RECORD_CLASS.handling).toBe(oughtToBe);
  });

  it("agrees with what the ledger actually holds, field by field", () => {
    // The classification claims a row holds no patient identity. Checked against a real row rather
    // than against the sentence: `no_patient_identity` is exactly the claim that is true when
    // written and false the first time somebody adds a field.
    expect(currentConsequence().holdsFigures).toBe(false);
    const keys = Object.keys(disclosure());
    for (const key of keys) {
      expect(key, `${key} could hold a patient`).not.toMatch(/patient|subject|person|candidate/i);
    }
    // The one thing a row DOES name is a person at the practice, which is what makes it a record
    // about staff rather than about patients — and the reason it is not simply "holds nothing".
    expect(keys).toContain("disclosedBy");
    expect(RECORD_CLASSES.find((c) => c.module === "src/interop/disclosure-ledger.ts")!.rationale)
      .toContain("a person at the practice");
  });

  it("is out of the erasure list, and would be in it under the other answer", () => {
    // Both directions, so the classification is a consequence of the mode rather than a coincidence
    // that happens to hold today.
    const inList = storedClasses().some((c) => c.module === "src/interop/disclosure-ledger.ts");
    expect(inList).toBe(false);
    expect(MODE_CONSEQUENCES.figures_included.w106Handling).toBe("stored");
  });
});

describe("W247 the review is recorded, with what it found and what it did not", () => {
  it("covers every Q19 boundary module by name", () => {
    // A hardening dossier that reviewed whatever somebody remembered covers whatever somebody
    // remembered — W200's finding about a declared surface. The list is checked against the tree.
    const modules = [
      "conformance",
      "consent-to-disclose",
      "credentials",
      "disclosure-ledger",
      "ereferral",
      "exchange-state",
      "fhir",
      "terminology",
    ];
    for (const name of modules) {
      expect(DOSSIER, `${name} was not reviewed`).toContain(`src/interop/${name}.ts`);
    }
  });

  it("records the findings and says which were rejected", () => {
    expect(DOSSIER).toContain("FINDING 1");
    expect(DOSSIER).toContain("FINDING 2");
    expect(DOSSIER).toContain("Considered and not raised");
    expect(DOSSIER.toLowerCase()).toContain("zero criticals");
  });

  it("says how the review was run, including what it could not do", () => {
    // The method is part of the deliverable, and so is its bound: a review that hid how it was run
    // is a review nobody can weigh.
    expect(DOSSIER).toContain("without sub-agents");
    expect(DOSSIER).toContain("no live system");
  });

  it("has no exported way to authorise that skips the acts", () => {
    // Re-derived rather than inherited from W243, because the signature changed this week and a
    // property that survived the change untested is a property nobody checked.
    for (const name of Object.keys(consentModule)) {
      expect(name, `${name} reads as a permission that consults nothing`).not.toMatch(
        /^may|^can|^is(Allowed|Permitted)|assume|presum/i,
      );
    }
    const params = CONSENT_SOURCE.split("export function authoriseDisclosure")[1]!.split(")")[0]!;
    expect(params).toContain("acts: readonly ConsentAct[]");
    expect(params).toContain("asAtIso: string");
  });
});

// W245: the Q19 dossier's arithmetic, checked against the tree it was derived from.
//
// A gate dossier is read by a founder deciding whether to ratify something, and its value is
// entirely in the facts being current. "The payer slot is blocked twice" is true on the day it is
// written and becomes a lie silently — somebody rules on G1, edits one register, and nobody
// re-reads the document.
//
// So these are not tests of the prose. Every count is re-derived from SOURCE rather than from the
// Q19 units' own documents, which is W207's distinction: a dossier that quotes the modules it
// prices is a dossier that agrees with itself.
//
// ONE ASSERTION HERE IS AN ABSENCE, AND IT IS THE POINT OF THE UNIT. `ConsentScope` has no
// `recipientName`, which is the gap between G10's wording and W243's granularity that cost 1
// describes. Pinning the absence means that closing the gap FAILS THIS DOCUMENT — the dossier
// cannot quietly go on describing a cost that has been paid.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CREDENTIAL_SLOTS, SHIPPED_CREDENTIALS, loadCredential } from "@/interop/credentials";
import { SHIPPED_DISCLOSURES } from "@/interop/disclosure-ledger";
import { SHIPPED_BINDINGS } from "@/interop/terminology";
import { REFUSED_MAPPINGS } from "@/interop/fhir";
import { REFUSED_CONSENT_SOURCES } from "@/interop/consent-to-disclose";

const ROOT = process.cwd();
const read = (...parts: string[]) => readFileSync(path.join(ROOT, ...parts), "utf8");

const DOSSIER = read("docs", "DOSSIER-Q19.md");
const PLAN = read("docs", "FIVE-YEAR-PLAN.md");
/**
 * Whitespace-flattened, with blockquote markers stripped first.
 *
 * A markdown document wraps, so a quoted claim spans lines — and the gate's wording is quoted as a
 * BLOCKQUOTE, so flattening alone leaves a `>` in the middle of the sentence. That is what made
 * the first version of the wording check fail against a document that did contain the wording.
 */
const flat = (text: string) => text.replace(/^\s*>\s?/gm, "").replace(/\s+/g, " ");
const DOSSIER_FLAT = flat(DOSSIER);
const PLAN_FLAT = flat(PLAN);
const LEDGER = read("BUILD-STATE.md");
const CONSENT_SOURCE = read("src", "interop", "consent-to-disclose.ts");
const LEDGER_SOURCE = read("src", "interop", "disclosure-ledger.ts");

/** Ledger rows, as `| Wn | status | ... |`. Read off the file so the dossier cannot drift. */
const ledgerRows = (): Array<{ id: string; status: string; body: string }> =>
  [...LEDGER.matchAll(/^\| (W\d+) \| (\w+) \|(.*)$/gm)].map((m) => ({
    id: m[1]!,
    status: m[2]!,
    body: m[3]!,
  }));

describe("W245 the finding: ratifying G10 turns nothing on", () => {
  it("blocks the payer credential slot on TWO gates, not one", () => {
    // THE DOSSIER'S HEADLINE CLAIM. If somebody rules on G1 and drops it from this list, the
    // sentence "G10 is necessary and not sufficient" stops being true and this fails.
    const payer = CREDENTIAL_SLOTS.find((s) => s.kind === "payer_api");
    expect(payer, "the payer slot is gone from the register").toBeDefined();
    expect(payer!.blockedBy).toEqual(["G1", "G10"]);
    expect(DOSSIER_FLAT).toContain('`blockedBy: ["G1", "G10"]`');
    // And the LOADER reports both, so the claim does not rest on the register alone.
    const refusal = loadCredential("payer_api", "irrelevant");
    expect(refusal.loaded).toBe(false);
    expect(!refusal.loaded && refusal.blockedBy).toEqual(["G1", "G10"]);
  });

  it("names exactly two units blocked on G10, and they are W240 and W241", () => {
    const onG10 = ledgerRows().filter((r) => r.body.includes("FOUNDER GATE G10"));
    expect(onG10.map((r) => r.id)).toEqual(["W240", "W241"]);
    for (const row of onG10) expect(row.status, `${row.id}`).toBe("blocked");
    expect(DOSSIER).toContain("**W240**");
    expect(DOSSIER).toContain("**W241**");
  });

  it("shows the e-referral slot double-blocked too, which is why ask 4 exists", () => {
    const ereferral = CREDENTIAL_SLOTS.find((s) => s.kind === "ereferral_gateway");
    expect(ereferral!.blockedBy).toEqual(["G1", "G9"]);
    const doubleBlocked = CREDENTIAL_SLOTS.filter((s) => s.blockedBy.length > 1);
    expect(doubleBlocked.map((s) => s.kind).sort()).toEqual(["ereferral_gateway", "payer_api"]);
  });

  it("carries G10's wording from the plan rather than a paraphrase of it", () => {
    // A paraphrase of a gate somebody is being asked to ratify is a second version of the gate.
    const quoted =
      "no patient-linked data is exchanged with any payer or insurer until the founder has signed off the counterparty, the direction of flow, the minimum data set, and the patient's own consent to that specific exchange";
    expect(PLAN_FLAT.toLowerCase()).toContain(quoted);
    expect(DOSSIER_FLAT.toLowerCase()).toContain(quoted);
  });
});

describe("W245 cost 1: the consent model is one level coarser than the gate's wording", () => {
  it("names the recipient CLASS and not the counterparty", () => {
    // THE ASSERTION THAT IS AN ABSENCE. `Disclosure` carries `recipientName`; `ConsentScope` does
    // not, so a patient consenting to `payer_or_insurer` has consented to every payer. Pinned so
    // that CLOSING the gap fails this document rather than leaving it describing a paid cost.
    const scope = CONSENT_SOURCE.match(/export interface ConsentScope \{[\s\S]*?\n\}/)![0];
    expect(scope).toContain("recipientClass");
    expect(scope, "ConsentScope gained a counterparty — rewrite cost 1 in DOSSIER-Q19.md").not.toContain(
      "recipientName",
    );
    // And the other half of the comparison, so the claim is a contrast rather than an assertion.
    expect(LEDGER_SOURCE.match(/export interface Disclosure \{[\s\S]*?\n\}/)![0]).toContain(
      "recipientName",
    );
    expect(DOSSIER_FLAT).toContain("has agreed it may go to *any* payer");
  });

  it("declares payer_or_insurer as one of four recipient classes", () => {
    // Sliced to the next export rather than to the next `;` — the doc comments contain
    // semicolons, and a non-greedy match stopped inside one and reported two of the four values.
    const union = LEDGER_SOURCE.slice(
      LEDGER_SOURCE.indexOf("export type RecipientClass"),
      LEDGER_SOURCE.indexOf("export type DisclosureKind"),
    );
    const values = [...union.matchAll(/^\s*\| "([a-z_]+)"/gm)].map((m) => m[1]!);
    expect(values.sort()).toEqual([
      "another_practice",
      "payer_or_insurer",
      "phn_or_commissioner",
      "the_practice_itself",
    ]);
    expect(DOSSIER_FLAT).toContain("one of four");
  });
});

describe("W245 what is already sound, re-derived rather than quoted", () => {
  it("holds no credential, and the loader refuses a well-formed one anyway", () => {
    // The dossier's claim is that emptiness is a CONSEQUENCE rather than the control. Checked by
    // handing the loader a credential that would otherwise pass.
    expect(SHIPPED_CREDENTIALS).toEqual([]);
    const result = loadCredential("payer_api", "a-perfectly-well-formed-looking-secret-value");
    expect(result.loaded).toBe(false);
    expect(!result.loaded && result.refusal).toBe("gate_not_ratified");
    // And nothing about the value comes back — the refusal is about the gate.
    expect(JSON.stringify(result)).not.toContain("well-formed-looking");
  });

  it("has disclosed nothing and bound no codes", () => {
    expect(SHIPPED_DISCLOSURES).toEqual([]);
    expect(SHIPPED_BINDINGS).toEqual([]);
  });

  it("still refuses to export the holdout arm and the holdout rate", () => {
    // Cost 3 is a cost already paid, and it is only paid while these refusals exist.
    // NOT via `REFUSED_MAPPINGS` — that register holds the named strategies, and the two fields
    // live in the per-resource unmapped registers. My first version asserted the wrong export and
    // failed, which is the register telling me where the refusal actually is.
    const fhir = readFileSync(path.join(ROOT, "src", "interop", "fhir.ts"), "utf8");
    const refusedFields = fhir.match(/domainField: "holdout(Rate)?"/g);
    expect(refusedFields?.length, "a holdout field left the refused register").toBe(2);
    expect(Object.keys(REFUSED_MAPPINGS).length).toBeGreaterThan(0);
    expect(DOSSIER_FLAT).toContain("`holdout` and `holdoutRate`");
  });

  it("still names, in the dossier, however many ways of manufacturing a consent there are", () => {
    // The count was a literal 7 here and the word "seven" in the dossier, and W247 added an eighth
    // — the point-in-time-document-against-a-moving-target class W208 named, arriving in a Q19
    // dossier one week after it was written. Derived from the register now, in both places, so
    // the next unit to add a refusal updates the prose and nothing else.
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const count = Object.keys(REFUSED_CONSENT_SOURCES).length;
    expect(count).toBeGreaterThan(6);
    expect(DOSSIER_FLAT, `the dossier does not say ${words[count]}`).toContain(
      `${words[count]} named routes`,
    );
  });

  it("has no transport anywhere in the interop surface", () => {
    // The dossier says so flatly; a sweep is the only honest basis for saying it flatly.
    const dir = path.join(ROOT, "src", "interop");
    const modules = [
      "conformance.ts",
      "consent-to-disclose.ts",
      "credentials.ts",
      "disclosure-ledger.ts",
      "ereferral.ts",
      "fhir.ts",
      "terminology.ts",
    ];
    for (const file of modules) {
      const source = readFileSync(path.join(dir, file), "utf8");
      expect(source, `${file} reaches the network`).not.toMatch(
        /\bfetch\(|new XMLHttpRequest|require\("https?"\)|from "node:https?"/,
      );
    }
  });
});

describe("W245 the document is a decision aid, not a decision", () => {
  it("does not decide G10, and says the plan's instruction out loud", () => {
    expect(PLAN).toContain("the loop must not decide this itself");
    expect(DOSSIER_FLAT).toContain("the loop must not decide this itself");
    expect(DOSSIER).toContain("It does not decide G10");
  });

  it("asks four things, each priced with what it releases", () => {
    const asks = DOSSIER.slice(DOSSIER.indexOf("## What is asked"), DOSSIER.indexOf("## What this dossier"));
    const numbered = [...asks.matchAll(/^\d\. \*\*/gm)];
    expect(numbered).toHaveLength(4);
    // Every ask states what it releases, so none of them is a question without a consequence.
    expect([...asks.matchAll(/\*Releases:/g)]).toHaveLength(4);
  });

  it("prices G10 against gates the plan actually defines", () => {
    for (const gate of ["G1", "G2", "G9", "G10"]) {
      expect(PLAN, `${gate} is priced here and not defined in the plan`).toMatch(
        new RegExp(`- \\*\\*${gate}\\*\\*`),
      );
      expect(DOSSIER).toContain(gate);
    }
  });
});

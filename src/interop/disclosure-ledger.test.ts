// W239 verify gate: "what left, to whom and when; W204's unresolved question — whether the log
// holds the FIGURES or only the fact of sending — is named in the module and left to the founder,
// with the model built so either answer is a one-line change."
//
// The one-line change is the easy half to claim and the hard half to prove. What makes it real is
// that everything downstream of the switch is DERIVED, so these tests exercise both answers
// without editing the shipped constant — and assert that the privacy register moves with it.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./disclosure-ledger";
import {
  DISCLOSURE_LEDGER_RECORD_CLASS,
  DISCLOSURE_REJECTION_COPY,
  MODE_CONSEQUENCES,
  OPEN_QUESTION,
  PAYLOAD_MODE,
  REFUSED_LEDGER_BEHAVIOURS,
  SHIPPED_DISCLOSURES,
  currentConsequence,
  rejectionsForDisclosure,
  renderDisclosure,
  type Disclosure,
  type DisclosurePayloadMode,
} from "./disclosure-ledger";
import { PROPOSED_DISCLOSURE_LOG } from "@/reporting/retention";
import { RECORD_CLASSES, storedClasses } from "@/privacy/record-classes";

const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/disclosure-ledger.ts"), "utf8");

const row = (over: Partial<Disclosure> = {}): Disclosure => ({
  practiceId: "prac-1",
  recipientClass: "phn_or_commissioner",
  recipientName: "Example Primary Health Network",
  kind: "reporting_summary",
  periodFromIso: "2026-04-01",
  periodToIso: "2026-06-30",
  disclosedAtIso: "2026-07-05T09:00:00+10:00",
  disclosedBy: "manager@demo.practice.example",
  acknowledgement: "not_recorded",
  payload: { held: false, why: "The ledger is in fact-of-sending-only mode (W204's open question)." },
  ...over,
});

const withFigures = (over: Partial<Disclosure> = {}): Disclosure =>
  row({ payload: { held: true, figures: { invitationsSent: 120, attended: 31 } }, ...over });

describe("W239 nothing has been disclosed, and the ledger says so", () => {
  it("ships an empty ledger", () => {
    // G9 is unratified, W202 and W203 are blocked, and there is no transport in this tree. The
    // model exists ahead of them for W204's reason: the record of what left must not be designed
    // in a hurry by whoever ships the first send.
    expect(SHIPPED_DISCLOSURES).toEqual([]);
  });

  it("holds no transport, no recipient allowlist and no permission function", () => {
    // The ledger is evidence, never authority. A ledger consulted for permission makes a GAP in
    // it into an authorisation — the absence of a record would grant what the presence of one is
    // supposed to evidence.
    expect(SOURCE).not.toMatch(/\bfetch\(|axios|https?:\/\//);
    expect(
      Object.keys(mod).filter((n) => /mayDisclose|allowed|permit|authorise|authorize|send/i.test(n)),
    ).toEqual([]);
    expect(Object.keys(mod).length).toBeGreaterThan(8);
  });
});

describe("W239 W204's question is carried, not answered", () => {
  it("quotes it verbatim from the module that raised it", () => {
    // Word for word rather than summarised: a paraphrase of a question somebody still has to
    // answer is a second version of the question, and the two drift. Asserted against W204's own
    // export, so a change there fails here rather than leaving two texts disagreeing.
    expect(OPEN_QUESTION.question).toBe(PROPOSED_DISCLOSURE_LOG.openQuestion);
    expect(OPEN_QUESTION.raisedBy).toContain("W204");
  });

  it("leaves it unanswered", () => {
    expect(OPEN_QUESTION.answeredBy).toBeNull();
    // And the shipped default is the conservative reading, which is not the same as the answer.
    expect(PAYLOAD_MODE).toBe("fact_of_sending_only");
  });

  it("describes BOTH answers, so the founder chooses between two described things", () => {
    // The unchosen row is not dead code — it is the other half of the question. A register with
    // only the chosen answer in it turns the decision into approving a sentence.
    expect(Object.keys(MODE_CONSEQUENCES).sort()).toEqual([
      "fact_of_sending_only",
      "figures_included",
    ]);
    for (const [mode, consequence] of Object.entries(MODE_CONSEQUENCES)) {
      expect(consequence.answers.length, `${mode} answers nothing`).toBeGreaterThan(2);
      expect(consequence.erasureObligation.length, `${mode} states no erasure cost`).toBeGreaterThan(150);
    }
    // The two differ where it matters, or the "choice" is not one.
    expect(MODE_CONSEQUENCES.fact_of_sending_only.holdsFigures).toBe(false);
    expect(MODE_CONSEQUENCES.figures_included.holdsFigures).toBe(true);
    expect(MODE_CONSEQUENCES.fact_of_sending_only.cannotAnswer.length).toBeGreaterThan(0);
    expect(MODE_CONSEQUENCES.figures_included.cannotAnswer).toEqual([]);
  });

  it("names the cost of the expensive answer as W204's own refusal, one level up", () => {
    // The part a one-line switch hides: turning this on re-creates exactly the second lasting
    // copy W204 refused to make for reports, wearing an accountability argument.
    const cost = MODE_CONSEQUENCES.figures_included.erasureObligation;
    expect(cost).toContain("W204");
    expect(cost).toContain("W51");
    expect(cost).toContain("second lasting copy");
  });
});

describe("W239 the consequences are derived from the switch, never restated", () => {
  it("hands W106 a record class built from the mode", () => {
    // THE property that makes the one-line change honest. `record-classes.ts` imports this rather
    // than writing "stored" of its own, so answering W204's question moves the privacy register
    // in the same commit and cannot fail to.
    expect(DISCLOSURE_LEDGER_RECORD_CLASS.handling).toBe(currentConsequence().w106Handling);
    expect(DISCLOSURE_LEDGER_RECORD_CLASS.rationale).toContain(PAYLOAD_MODE);
    expect(DISCLOSURE_LEDGER_RECORD_CLASS.rationale).toContain(
      currentConsequence().erasureObligation,
    );
  });

  it("puts the ledger in W106's erasure list only when it holds figures", () => {
    // THE consequence, checked in both directions from this side, so W106's pinned list of
    // classes an erasure must reach fails loudly on a flip rather than drifting. Found by the
    // first draft making both modes `stored`, which broke that list and — worse — erased the
    // distinction the founder is being asked to weigh.
    expect(MODE_CONSEQUENCES.fact_of_sending_only.w106Handling).toBe("no_patient_identity");
    expect(MODE_CONSEQUENCES.figures_included.w106Handling).toBe("stored");
    const inErasureList = storedClasses().some(
      (c) => c.module === "src/interop/disclosure-ledger.ts",
    );
    expect(inErasureList).toBe(currentConsequence().holdsFigures);
    // The guard that `storedClasses()` is returning anything at all.
    expect(storedClasses().length).toBeGreaterThan(3);
  });

  it("is the entry W106's registry actually carries", () => {
    // Both directions. A derived export nobody imported would be a mechanism that looks like one.
    const declared = RECORD_CLASSES.find((c) => c.module === "src/interop/disclosure-ledger.ts");
    expect(declared, "the ledger is not declared in W106's registry").toBeDefined();
    expect(declared!.handling).toBe(DISCLOSURE_LEDGER_RECORD_CLASS.handling);
    expect(declared!.rationale).toBe(DISCLOSURE_LEDGER_RECORD_CLASS.rationale);
  });

  it("writes the handling exactly once in the source", () => {
    // The failure this arrangement prevents is a second hand-written "stored" that agrees today
    // and disagrees the first time the mode changes — invisibly, because nothing announces it.
    // Counted against the declared modes rather than against a literal 2, so adding a third
    // answer to W204's question does not turn this into a number somebody bumps. And matched on
    // the VALUE form (trailing comma) rather than the type annotation in `ModeConsequence`,
    // which is a declaration and not a second source of truth.
    const handlings = SOURCE.match(/^\s*w106Handling: "\w+",$/gm) ?? [];
    expect(handlings.length).toBe(Object.keys(MODE_CONSEQUENCES).length);
    expect(SOURCE).not.toMatch(/^\s*handling: "\w+",$/m);
    expect(SOURCE).toContain("handling: currentConsequence().w106Handling");
  });
});

describe("W239 a row disagreeing with the mode is refused, in both directions", () => {
  it("accepts a well-formed row in the shipped mode", () => {
    // Non-vacuity first: the validator must pass something, or every refusal below is trivially
    // satisfied by one that refuses everything.
    expect(rejectionsForDisclosure(row())).toEqual([]);
  });

  it("refuses figures while the ledger is declared not to hold them", () => {
    expect(rejectionsForDisclosure(withFigures())).toEqual([
      "figures_held_against_the_declared_mode",
    ]);
  });

  it("refuses a row with NO figures once the ledger is declared to hold them", () => {
    // The other direction, and the reason the mode is passed explicitly: a test can exercise the
    // founder's other answer without editing the shipped constant. A one-way check would let a
    // half-populated ledger pass as complete under the expensive mode.
    const asFigures: DisclosurePayloadMode = "figures_included";
    expect(rejectionsForDisclosure(withFigures(), asFigures)).toEqual([]);
    expect(rejectionsForDisclosure(row(), asFigures)).toEqual([
      "figures_held_against_the_declared_mode",
    ]);
  });

  it("refuses absent figures with no stated reason", () => {
    // Absent because the mode does not hold them, and absent because there were none, are
    // different facts. A blank renders them the same.
    expect(rejectionsForDisclosure(row({ payload: { held: false, why: "  " } }))).toContain(
      "figures_absent_without_a_stated_reason",
    );
  });

  it("refuses a row nobody can be asked about", () => {
    expect(rejectionsForDisclosure(row({ disclosedBy: " " }))).toContain("no_author");
    expect(rejectionsForDisclosure(row({ practiceId: "" }))).toContain("no_practice");
    expect(rejectionsForDisclosure(row({ recipientName: " " }))).toContain("no_recipient_named");
    expect(rejectionsForDisclosure(row({ disclosedAtIso: "last July" }))).toContain(
      "disclosed_at_missing_or_unreadable",
    );
  });

  it("refuses a period that runs backwards or is unreadable", () => {
    // W205's finding: a true count under a false period is invisible.
    expect(
      rejectionsForDisclosure(row({ periodFromIso: "2026-06-30", periodToIso: "2026-04-01" })),
    ).toContain("period_ends_before_it_starts");
    expect(rejectionsForDisclosure(row({ periodToIso: "soon" }))).toContain(
      "period_missing_or_unreadable",
    );
  });

  it("returns every reason rather than the first", () => {
    const bad = rejectionsForDisclosure(row({ practiceId: "", disclosedBy: "", recipientName: "" }));
    expect(bad.length).toBeGreaterThan(2);
  });

  it("explains every refusal it can give", () => {
    for (const [reason, copy] of Object.entries(DISCLOSURE_REJECTION_COPY)) {
      expect(copy.length, `${reason} has no explanation`).toBeGreaterThan(60);
    }
  });
});

describe("W239 what left is recorded, not what succeeded", () => {
  it("has no delivered default: acknowledgement is required and three-valued", () => {
    // W170's rule, and the harmful reading here is the reassuring one. A ledger showing everything
    // as delivered because nothing was recorded is worse than one showing nothing.
    expect(SOURCE).toMatch(/acknowledgement: Acknowledgement;/);
    expect(SOURCE).not.toMatch(/acknowledgement\?:|acknowledgement: Acknowledgement = /);
    expect(SOURCE).toContain('"acknowledged" | "rejected_by_recipient" | "not_recorded"');
  });

  it("renders an unacknowledged row as unacknowledged, never as delivered", () => {
    const unknown = renderDisclosure(row());
    expect(unknown).toContain("No acknowledgement was recorded");
    expect(unknown).toContain("not the same as delivered");
    expect(unknown).not.toMatch(/\bdelivered\.|was delivered\b/);
  });

  it("records a rejected disclosure as one that still left", () => {
    // Data that left the building and was rejected still left the building, and the first question
    // after a dispute is about the disclosure rather than about the acknowledgement.
    const rejected = renderDisclosure(row({ acknowledgement: "rejected_by_recipient" }));
    expect(rejected).toContain("It still left");
    expect(rejectionsForDisclosure(row({ acknowledgement: "rejected_by_recipient" }))).toEqual([]);
  });

  it("says on every row whether the figures are held, and why not when they are not", () => {
    expect(renderDisclosure(row())).toContain("The figures are not held:");
    expect(renderDisclosure(withFigures())).toContain("held on this row");
  });

  it("names what left, to whom and when, in one sentence", () => {
    const rendered = renderDisclosure(row());
    expect(rendered).toContain("prac-1");
    expect(rendered).toContain("Example Primary Health Network");
    expect(rendered).toContain("2026-07-05");
    expect(rendered).toContain("2026-04-01 to 2026-06-30");
    expect(rendered).toContain("manager@demo.practice.example");
  });
});

describe("W239 what the ledger refuses to become", () => {
  it("states a reason for each refused behaviour", () => {
    expect(Object.keys(REFUSED_LEDGER_BEHAVIOURS).sort()).toEqual([
      "a_delivered_default",
      "deriving_the_record_class_by_hand",
      "free_text_recipients",
      "recording_only_successful_sends",
      "the_ledger_as_permission",
      "upgrading_the_payload_quietly",
    ]);
    for (const [id, why] of Object.entries(REFUSED_LEDGER_BEHAVIOURS)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(150);
    }
  });

  it("keeps the recipient a declared class rather than a spelling", () => {
    // "What have we sent to payers" has an answer only if 'payer' is a value rather than a string
    // somebody typed. The type carries the class; the name is the free text beside it.
    expect(SOURCE).toMatch(/export type RecipientClass =/);
    expect(SOURCE).toContain('"payer_or_insurer"');
    expect(SOURCE).not.toMatch(/recipientClass: string/);
  });
});

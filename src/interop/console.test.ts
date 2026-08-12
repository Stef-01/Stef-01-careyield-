// W246 verify gate (unit half): "shows what was exchanged and, more importantly, what was not."
//
// The e2e half checks the distinctions survive onto a page. These check the view-model, and the
// one that carries the unit is the composition test: `stateFromLedgerRow` is the inverse of W244's
// `ledgerDisposition`, driven in BOTH directions, because two modules describing the same event
// drift unless something checks that they agree (W194).
//
// The populated branch is exercised over synthetic rows even though nothing in this tree can reach
// it. W220 shipped a console whose empty branch never rendered because the data was always full;
// the mirror of that mistake is a page with only an empty state, correct today and untested for
// the day somebody ratifies G9.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  INTEROP_CONSOLE_COPY,
  REFUSED_CONSOLE_BEHAVIOURS,
  WHAT_THIS_PAGE_CANNOT_SHOW,
  agreesWithLedger,
  blockedPaths,
  exchangeRow,
  interopConsoleView,
  nothingCanBeSent,
  stateFromLedgerRow,
  type RecordedExchangeState,
} from "./console";
import { CREDENTIAL_SLOTS } from "./credentials";
import { SHIPPED_DISCLOSURES, type Acknowledgement, type Disclosure } from "./disclosure-ledger";
import { ledgerDisposition, type ExchangeState } from "./exchange-state";
import { lintMessageText } from "@/messaging/templates";

const RECORDED: RecordedExchangeState[] = [
  "sent_no_response",
  "rejected_by_recipient",
  "acknowledged",
];

const row = (over: Partial<Disclosure> = {}): Disclosure => ({
  practiceId: "prac-1",
  recipientClass: "phn_or_commissioner",
  recipientName: "Demo PHN (synthetic)",
  kind: "reporting_summary",
  periodFromIso: "2026-04-01",
  periodToIso: "2026-06-30",
  disclosedAtIso: "2026-07-05",
  disclosedBy: "manager@demo.practice.example",
  acknowledgement: "not_recorded",
  payload: { held: false, why: "The ledger is in fact-of-sending-only mode." },
  ...over,
});

describe("W246 nothing has been exchanged, and the page says which nothing", () => {
  it("ships an empty ledger, so every practice reaches the empty branch", () => {
    expect(SHIPPED_DISCLOSURES).toEqual([]);
    const view = interopConsoleView("prac-1");
    expect(view.state).toBe("nothing_ever_attempted");
  });

  it("says nothing was ATTEMPTED rather than that nothing was exchanged", () => {
    // THE ASSERTION THE UNIT EXISTS FOR. "0 exchanges" reads as tried-and-got-nowhere, or as
    // nothing-needed-to-go. The truth is a third thing and it is the one a reader will not supply.
    const view = interopConsoleView("prac-1");
    if (view.state !== "nothing_ever_attempted") throw new Error("wrong branch");
    expect(view.copy).toContain("nothing has been attempted");
    expect(view.copy).toContain("not the same as having tried");
    expect(view.copy).toContain("no connection to any other system");
  });

  it("derives the blockers from W242's register rather than listing them", () => {
    // A hand-written list would say what somebody remembered on the day the page was built and go
    // on saying it after a gate was ratified — W102's failure on a surface a practice reads.
    const view = interopConsoleView("prac-1");
    if (view.state !== "nothing_ever_attempted") throw new Error("wrong branch");
    expect(view.blocked).toHaveLength(CREDENTIAL_SLOTS.length);
    expect(view.blocked.flatMap((b) => b.blockedBy)).toContain("G10");
    // Both blockers on a double-blocked slot, not the first — W242's own rule.
    const payer = view.blocked.find((b) => b.what.includes("payer"));
    expect(payer?.blockedBy).toEqual(["G1", "G10"]);
  });

  it("re-derives 'nothing can be sent' from the register, not from a sentence", () => {
    expect(nothingCanBeSent()).toBe(true);
    // Non-vacuity: unblock one slot and it stops being true, so this is a reading rather than a
    // constant wearing a function's clothes.
    const unblocked = CREDENTIAL_SLOTS.map((s, i) => (i === 0 ? { ...s, blockedBy: [] } : s));
    expect(nothingCanBeSent([], unblocked)).toBe(false);
  });

  it("states the bound on the page: what left is not what was attempted", () => {
    // W239 records what LEFT and W244 requires that an exchange which never left produce NO ROW.
    // Both are right, and together they mean this page cannot show a failure to send. A reader who
    // thinks it is complete reads no rows as no problems.
    const view = interopConsoleView("prac-1");
    expect(view.cannotShow).toBe(WHAT_THIS_PAGE_CANNOT_SHOW);
    expect(WHAT_THIS_PAGE_CANNOT_SHOW[0]).toContain("never sent");
    expect(WHAT_THIS_PAGE_CANNOT_SHOW[0]).toContain(
      "An empty list means nothing left; it does not mean nothing failed.",
    );
    expect(WHAT_THIS_PAGE_CANNOT_SHOW).toHaveLength(3);
  });
});

describe("W246 the populated branch, built and tested though nothing can reach it", () => {
  it("scopes to the practice as the QUERY, not afterwards", () => {
    // W123's rule and W209's finding. Another practice's rows must not be in the list at all.
    const view = interopConsoleView("prac-1", [row(), row({ practiceId: "prac-2" })]);
    if (view.state !== "exchanges_recorded") throw new Error("wrong branch");
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]!.disclosure.practiceId).toBe("prac-1");
  });

  it("counts all four states, including the two that are zero", () => {
    // W228's rule: a page that speaks only when alarmed teaches a reader that silence means
    // agreement. `not_attempted` is always zero here and is shown anyway, because a missing count
    // is the shape a reader fills in themselves.
    const view = interopConsoleView("prac-1", [
      row({ acknowledgement: "acknowledged" }),
      row({ acknowledgement: "acknowledged" }),
      row({ acknowledgement: "not_recorded" }),
    ]);
    if (view.state !== "exchanges_recorded") throw new Error("wrong branch");
    const expected: Record<ExchangeState, number> = {
      not_attempted: 0,
      sent_no_response: 1,
      rejected_by_recipient: 0,
      acknowledged: 2,
    };
    expect(view.counts).toEqual(expected);
    expect(Object.keys(view.counts)).toHaveLength(4);
  });

  it("gives every row a state sentence and a retry verdict", () => {
    for (const [ack, state] of [
      ["acknowledged", "acknowledged"],
      ["rejected_by_recipient", "rejected_by_recipient"],
      ["not_recorded", "sent_no_response"],
    ] as Array<[Acknowledgement, RecordedExchangeState]>) {
      const built = exchangeRow(row({ acknowledgement: ack }));
      expect(built.state, ack).toBe(state);
      expect(built.stateCopy.length, ack).toBeGreaterThan(40);
      expect(built.retryCopy.length, ack).toBeGreaterThan(40);
    }
  });

  it("marks the one row that needs a person, and never marks it safe", () => {
    // `sent_no_response` may already have arrived. It is the whole reason W244 refused a single
    // `unknown`, and the whole reason this page has no button.
    const built = exchangeRow(row({ acknowledgement: "not_recorded" }));
    expect(built.retry).toBe("retry_may_duplicate");
    expect(built.retryCopy).toContain("second copy");
    expect(built.retryCopy).toContain("will not decide it");
    // And the two that ARE safe are not marked as needing one, so the flag discriminates.
    expect(exchangeRow(row({ acknowledgement: "rejected_by_recipient" })).retry).toBe(
      "safe_to_retry",
    );
    expect(exchangeRow(row({ acknowledgement: "acknowledged" })).retry).toBe("nothing_to_retry");
  });

  it("uses W239's own sentence for the row rather than writing a second one", () => {
    const built = exchangeRow(row());
    expect(built.line).toContain("Demo PHN (synthetic)");
    expect(built.line).toContain("No acknowledgement was recorded");
    expect(built.line).toContain("not the same as delivered");
  });
});

describe("W246 the console and W244 agree about the same event", () => {
  it("inverts `ledgerDisposition` for every state a row can hold", () => {
    // W194's rule, driven BOTH ways. If W244 ever remaps an acknowledgement, this fails here
    // rather than showing a row under a state the ledger does not mean.
    for (const state of RECORDED) {
      expect(agreesWithLedger(state), state).toBe(true);
      const disposition = ledgerDisposition(state);
      expect(disposition.record, state).toBe(true);
      if (!disposition.record) continue;
      expect(stateFromLedgerRow(disposition.acknowledgement), state).toBe(state);
    }
  });

  it("has no row for the state W244 says must not produce one", () => {
    // `not_attempted` produces no ledger row, so `RecordedExchangeState` excludes it by type. The
    // exclusion is the model rather than a filter, which is what makes the stated bound honest.
    const disposition = ledgerDisposition("not_attempted");
    expect(disposition.record).toBe(false);
    // @ts-expect-error — a row cannot be in a state that produces no row.
    const impossible: RecordedExchangeState = "not_attempted";
    void impossible;
  });

  it("covers every acknowledgement W239 declares, so a new one cannot slip through", () => {
    const declared = readAcknowledgements().sort();
    expect(declared).toEqual(["acknowledged", "not_recorded", "rejected_by_recipient"]);
    for (const ack of declared as Acknowledgement[]) {
      expect(RECORDED, ack).toContain(stateFromLedgerRow(ack));
    }
  });
});

describe("W246 the page shows a verdict and offers no control", () => {
  it("names the six behaviours it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_CONSOLE_BEHAVIOURS).sort()).toEqual([
      "a_delivered_column",
      "a_hand_written_blocker_list",
      "a_retry_control",
      "a_success_rate",
      "a_zero_where_nothing_was_attempted",
      "naming_the_patients",
    ]);
    for (const [name, why] of Object.entries(REFUSED_CONSOLE_BEHAVIOURS)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_CONSOLE_BEHAVIOURS.a_retry_control).toContain("SECOND copy");
  });

  it("exports nothing that sends, retries or reports a rate", () => {
    const source = readSource();
    expect(source).not.toMatch(/export function (send|retry|resend|deliver|dispatch)/);
    expect(source).not.toMatch(/successRate|deliveryRate|percentDelivered/);
    expect(source).not.toMatch(/\bfetch\(|node:https?/);
  });

  it("passes W6's linter on every sentence a practice reads", () => {
    for (const [name, text] of Object.entries(INTEROP_CONSOLE_COPY)) {
      expect(lintMessageText(text), name).toEqual([]);
    }
    for (const text of WHAT_THIS_PAGE_CANNOT_SHOW) {
      expect(lintMessageText(text), text.slice(0, 40)).toEqual([]);
    }
  });

  it("is ABSENT from W201's register because it names nobody, and that is the reason", () => {
    // I declared it there first and the detector called it undeclared-in-reverse — the same
    // over-declaration W226 made. The detector is right: W201 reaches modules that name a person
    // or export a decision-outcome union, and this module does neither, because W239's row holds
    // no patient identity. Recorded as a stated absence rather than a silent one, since a reader
    // asking "why is the interop console not in the ADM register" deserves the answer here.
    const source = readSource();
    for (const term of ["PatientId", "patientId", "candidateRef"]) {
      expect(source, `${term} reached the interop console`).not.toContain(term);
    }
    expect(readSourceOf("../privacy/automated-decisions.ts")).not.toContain(
      '"src/interop/console.ts"',
    );
  });

  it("says the ledger holds nobody, so the page cannot name patients", () => {
    expect(INTEROP_CONSOLE_COPY.ledgerHoldsNoPatient).toContain("do not hold anybody's name");
    const built = exchangeRow(row());
    expect(JSON.stringify(built)).not.toMatch(/patientId|"pat-/);
  });
});

// Read off the source so a new acknowledgement in W239 fails this suite rather than arriving
// silently — the same both-directions shape W106 and W167 use.
function readSourceOf(file: string): string {
  return readFileSync(path.join(process.cwd(), "src", "interop", file), "utf8");
}

function readSource(): string {
  return readSourceOf("console.ts");
}

function readAcknowledgements(): string[] {
  const source = readSourceOf("disclosure-ledger.ts");
  const union = source.slice(
    source.indexOf("export type Acknowledgement"),
    source.indexOf("export interface Disclosure"),
  );
  return [...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]!);
}

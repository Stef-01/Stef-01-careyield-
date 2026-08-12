// W244 verify gate: "a failed or unacknowledged exchange is `unknown`, never 'delivered' —
// W170's rule applied at the one boundary where the tree cannot see the other side."
//
// The gate says `unknown` never becomes `delivered`. This file also checks the half the gate
// leaves implicit and that turns out to matter more: `unknown` must not be ONE state either,
// because the two things it hides point opposite ways on the retry decision.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as mod from "./exchange-state";
import {
  EXCHANGE_STATE_COPY,
  OUTCOME_MAPPING,
  REFUSED_READINGS,
  RETRY_VERDICT_COPY,
  ledgerDisposition,
  retryVerdict,
  stateFor,
  type ExchangeState,
  type TransportOutcome,
} from "./exchange-state";
import { rejectionsForDisclosure, type Disclosure } from "./disclosure-ledger";
import { stripComments } from "@/security/reachability";

const SOURCE = readFileSync(path.join(process.cwd(), "src/interop/exchange-state.ts"), "utf8");

const ALL_OUTCOMES = Object.keys(OUTCOME_MAPPING) as TransportOutcome[];
const ALL_STATES: ExchangeState[] = [
  "not_attempted",
  "sent_no_response",
  "rejected_by_recipient",
  "acknowledged",
];

describe("W244 nothing is ever reported as delivered that was not acknowledged", () => {
  it("reaches `acknowledged` from exactly one transport outcome", () => {
    // THE gate. Only the receiving system's own acknowledgement counts; everything else — every
    // failure, every silence, every 2xx — lands somewhere that is not delivery.
    const acknowledging = ALL_OUTCOMES.filter((o) => stateFor(o) === "acknowledged");
    expect(acknowledging).toEqual(["application_ack"]);
  });

  it("does not read a 2xx as an acknowledgement", () => {
    // The mapping most likely to be written the other way. A 200 means something accepted the
    // bytes — a load balancer, a gateway, a queue. It reports delivery of documents dropped one
    // hop short and is indistinguishable from working until somebody asks.
    expect(stateFor("http_2xx_no_application_ack")).toBe("sent_no_response");
    expect(OUTCOME_MAPPING.http_2xx_no_application_ack.why).toContain("load balancer");
  });

  it("does not read a timeout as a failure", () => {
    // A timeout is the absence of an answer, not an answer of no. The chain timeout → failed →
    // retry is where duplicate clinical documents come from.
    expect(stateFor("timeout_before_response")).toBe("sent_no_response");
    expect(stateFor("timeout_before_response")).not.toBe("rejected_by_recipient");
    expect(stateFor("timeout_before_response")).not.toBe("not_attempted");
  });

  it("has no boolean anywhere: namespace, signatures, or returned keys", () => {
    // Two values cannot carry four states, every caller reaches for the convenient one, and the
    // state that gets lost is always the ambiguous one — the only state that needed a person.
    // W225's three-way absence, applied to a verdict rather than to a field.
    expect(
      Object.keys(mod).filter((n) => /delivered|isDelivered|\bok\b|success|failed/i.test(n)),
    ).toEqual([]);
    const code = stripComments(SOURCE);
    expect(code.length).toBeLessThan(SOURCE.length);
    expect(SOURCE, "the phrase proving the subtraction is gone").toContain("THERE IS NO BOOLEAN");
    expect(code, "comments were not removed").not.toContain("THERE IS NO BOOLEAN");
    expect(code).not.toMatch(/\)\s*:\s*boolean/);
    for (const state of ALL_STATES) {
      const disposition = ledgerDisposition(state);
      for (const key of Object.keys(disposition)) {
        expect(key, "a boolean-shaped key on a verdict").not.toMatch(/delivered|success|failed/i);
      }
    }
  });
});

describe("W244 `unknown` is two states, and they point opposite ways", () => {
  it("keeps nothing-left and heard-nothing-back apart", () => {
    // The finding. Both are "we do not know whether it arrived" in ordinary speech, and they are
    // opposite on the only decision this boundary raises.
    expect(stateFor("connection_refused")).toBe("not_attempted");
    expect(stateFor("http_5xx")).toBe("sent_no_response");
    expect(retryVerdict("not_attempted")).toBe("safe_to_retry");
    expect(retryVerdict("sent_no_response")).toBe("retry_may_duplicate");
  });

  it("refuses a retry that could duplicate, rather than delaying one", () => {
    // `retry_may_duplicate` is a refusal, not a slow yes. Whether a second copy is acceptable is a
    // question about the recipient's system, and it is not answerable from here.
    expect(RETRY_VERDICT_COPY.retry_may_duplicate).toContain("second copy");
    expect(RETRY_VERDICT_COPY.retry_may_duplicate).toContain("will not decide it");
    expect(
      Object.keys(mod).filter((n) => /retryAfter|backoff|schedule|requeue|resend/i.test(n)),
    ).toEqual([]);
  });

  it("gives every state a retry verdict, and only acknowledged has nothing outstanding", () => {
    for (const state of ALL_STATES) {
      expect(RETRY_VERDICT_COPY[retryVerdict(state)], `${state} has no verdict copy`).toBeTruthy();
    }
    expect(ALL_STATES.filter((s) => retryVerdict(s) === "nothing_to_retry")).toEqual([
      "acknowledged",
    ]);
    expect(ALL_STATES.filter((s) => retryVerdict(s) === "retry_may_duplicate")).toEqual([
      "sent_no_response",
    ]);
  });
});

describe("W244 ambiguity resolves to the unsafe-to-retry reading", () => {
  it("never resolves an ambiguous outcome to nothing-left", () => {
    // The convenient reading is the one that drains a queue, and it is the unrecoverable mistake
    // of the two. Asserted over every ambiguous row rather than at one example.
    const ambiguous = ALL_OUTCOMES.filter((o) => OUTCOME_MAPPING[o].ambiguous);
    expect(ambiguous.length).toBeGreaterThan(2);
    for (const outcome of ambiguous) {
      expect(stateFor(outcome), `${outcome} resolved the convenient way`).not.toBe("not_attempted");
      expect(retryVerdict(stateFor(outcome)), `${outcome} allows an automatic retry`).not.toBe(
        "safe_to_retry",
      );
    }
  });

  it("marks as unambiguous only the outcomes where nothing could have been transmitted", () => {
    // The other direction, and the one a one-way check would miss: calling an outcome unambiguous
    // is what licenses the safe reading, so the set has to be exactly the pre-transmission
    // failures plus the recipient's own two answers.
    const unambiguous = ALL_OUTCOMES.filter((o) => !OUTCOME_MAPPING[o].ambiguous).sort();
    expect(unambiguous).toEqual([
      "application_ack",
      "application_nack",
      "connection_refused",
      "dns_failure",
      "http_4xx",
      "tls_failure",
    ]);
  });

  it("argues every row rather than restating it", () => {
    expect(ALL_OUTCOMES.length).toBe(10);
    for (const outcome of ALL_OUTCOMES) {
      expect(
        OUTCOME_MAPPING[outcome].why.length,
        `${outcome} is mapped without an argument`,
      ).toBeGreaterThan(80);
    }
    for (const [state, copy] of Object.entries(EXCHANGE_STATE_COPY)) {
      expect(copy.length, `${state} has no explanation`).toBeGreaterThan(80);
    }
  });
});

describe("W244 the ledger and the exchange model agree", () => {
  it("records no disclosure for an exchange that never left", () => {
    // Something the ledger cannot say on its own. A row describing a disclosure that did not
    // happen is worse than a missing one — it is the register itself being wrong, in the register
    // whose whole value is being trusted after a dispute.
    const disposition = ledgerDisposition("not_attempted");
    expect(disposition.record).toBe(false);
    if (disposition.record) throw new Error("unreachable");
    expect(disposition.why).toContain("did not happen");
  });

  it("records a row for everything that DID leave, including the silence", () => {
    for (const state of ALL_STATES.filter((s) => s !== "not_attempted")) {
      const disposition = ledgerDisposition(state);
      expect(disposition.record, `${state} produced no ledger row`).toBe(true);
    }
  });

  it("maps heard-nothing-back to the ledger's not_recorded, never to acknowledged", () => {
    // W194's rule: when two modules describe the same event, test that they AGREE. The ledger's
    // own field is coarser, and the coarsening must not be the flattering one.
    const disposition = ledgerDisposition("sent_no_response");
    if (!disposition.record) throw new Error("unreachable");
    expect(disposition.acknowledgement).toBe("not_recorded");
    expect(ledgerDisposition("rejected_by_recipient")).toEqual({
      record: true,
      acknowledgement: "rejected_by_recipient",
    });
    expect(ledgerDisposition("acknowledged")).toEqual({
      record: true,
      acknowledgement: "acknowledged",
    });
  });

  it("produces a ledger row W239's own validator accepts", () => {
    // Non-vacuity for the composition: the mapped acknowledgement must be a value the ledger
    // actually takes, or the two modules agree only in this file.
    for (const state of ALL_STATES.filter((s) => s !== "not_attempted")) {
      const disposition = ledgerDisposition(state);
      if (!disposition.record) throw new Error("unreachable");
      const row: Disclosure = {
        practiceId: "prac-1",
        recipientClass: "another_practice",
        recipientName: "Riverside Medical",
        kind: "ereferral_document",
        periodFromIso: "2026-04-01",
        periodToIso: "2026-06-30",
        disclosedAtIso: "2026-07-05T09:00:00+10:00",
        disclosedBy: "manager@demo.practice.example",
        acknowledgement: disposition.acknowledgement,
        payload: { held: false, why: "The ledger is in fact-of-sending-only mode." },
      };
      expect(rejectionsForDisclosure(row), `${state} produced a row the ledger refuses`).toEqual([]);
    }
  });
});

describe("W244 what the boundary refuses to read", () => {
  it("states a reason for each refused reading", () => {
    expect(Object.keys(REFUSED_READINGS).sort()).toEqual([
      "a_delivered_boolean",
      "a_ledger_row_for_an_unattempted_send",
      "a_single_unknown_state",
      "automatic_retry_on_ambiguity",
      "resolving_ambiguity_the_convenient_way",
      "timeout_as_failure",
      "treating_2xx_as_acknowledgement",
    ]);
    for (const [id, why] of Object.entries(REFUSED_READINGS)) {
      expect(why.length, `${id} is refused without a reason`).toBeGreaterThan(150);
    }
  });

  it("has no transport of its own", () => {
    // G1 blocks every credential (W242), so no exchange has ever happened. This models a boundary
    // that does not yet exist, which is the right time to argue about ambiguous failures.
    const code = stripComments(SOURCE);
    expect(code).not.toMatch(/\bfetch\(|axios|XMLHttpRequest|node:https?|https?:\/\//);
    expect(code).not.toMatch(/\basync\b|\bawait\b|Promise</);
  });
});

// W244: what happened at the boundary — where "we do not know" splits in two, and the halves
// point opposite ways.
//
// W170's rule has run through this tree for two years: an absence is not a zero, and `not_recorded`
// is a first-class verdict. Everywhere it has been applied so far, the absence was in OUR OWN
// records and the fix was to go and record something. This is the one boundary where the missing
// fact is on somebody else's side and nobody here can look.
//
// SO "UNKNOWN" IS NOT ONE STATE. It is two, and they are opposite with respect to the only
// decision anybody makes here — whether to send again.
//
//   NOTHING LEFT. The connection was refused, DNS failed, TLS failed. No bytes reached the other
//   system, so nothing happened there and sending again costs nothing.
//
//   SOMETHING LEFT AND WE HEARD NOTHING BACK. A timeout, a reset mid-request, a 5xx. The request
//   may have been fully processed before the silence. SENDING AGAIN MAY PUT A SECOND COPY OF A
//   CLINICAL DOCUMENT INTO ANOTHER PRACTICE'S SYSTEM.
//
// Collapse those into one `unknown` and every caller gets the retry decision wrong in one
// direction or the other: a duplicated referral in someone else's record, or a patient waiting on
// care that was never actually requested. That is why this module exists and why `unknown` is not
// one of its values.
//
// WHEN THE TRANSPORT OUTCOME IS AMBIGUOUS, IT RESOLVES TO THE UNSAFE-TO-RETRY READING. A reset
// mid-request might mean nothing arrived, and might mean everything did. Reading it as "nothing
// left" produces an automatic retry; reading it as "we do not know" produces a person looking at
// it. The second is the recoverable mistake, so ambiguity resolves that way — deliberately, and
// stated, because the flattering reading is also the one that clears a queue.
//
// A 2xx IS NOT AN ACKNOWLEDGEMENT, and this is the mapping most likely to be written the other
// way. HTTP 200 means something at the far end accepted the bytes — which may be a load balancer,
// a gateway, or a queue. An acknowledgement is the RECEIVING CLINICAL SYSTEM saying it has the
// document. Treating the first as the second is how a product reports delivery of things that
// were dropped one hop short, and it is indistinguishable from working until somebody asks.
//
// AND A TIMEOUT IS NOT A FAILURE. The tempting chain is timeout → failed → retry, and each arrow
// is wrong: a timeout is the absence of an answer, not an answer of "no". A request that timed out
// may be committed at the other end right now.
//
// THERE IS NO BOOLEAN. No `delivered`, no `isDelivered`, no `ok` — because any of them collapses
// four states into two and every caller would reach for it. A test asserts it on the namespace,
// on the exported signatures and on the returned objects' own keys, which is W225's three-way
// absence applied to a verdict rather than to a field.
//
// COMPOSED WITH W239 RATHER THAN RESTATED. The disclosure ledger has its own three-valued
// acknowledgement, and two modules describing the same event will drift unless something checks
// they agree — W194's rule. `ledgerDisposition` maps a state to what the ledger should hold, and
// it says something the ledger could not say on its own: a `not_attempted` exchange must produce
// NO LEDGER ROW, because a row for something that never left is a false record of a disclosure.
//
// FOUNDER GATE (plan §4): there is no transport. G1 blocks every credential (W242), so no exchange
// has ever happened and these states describe a boundary that does not yet exist. That is the
// right time to model them: the classification of an ambiguous failure is not a thing to decide
// while a queue is backing up.

import type { Acknowledgement } from "./disclosure-ledger";

/**
 * What is known about one exchange.
 *
 * Four values, and the missing fifth is `unknown` — see the module note. The two that would
 * collapse into it point opposite ways on the only question anybody asks here.
 */
export type ExchangeState =
  /** No bytes reached the other system. Nothing happened there. */
  | "not_attempted"
  /** It left, and nothing came back. It may have been fully processed. */
  | "sent_no_response"
  /** The recipient's own system refused it. It did not take effect. */
  | "rejected_by_recipient"
  /** The receiving system said it has the document. Not a 2xx — see the module note. */
  | "acknowledged";

export const EXCHANGE_STATE_COPY: Record<ExchangeState, string> = {
  not_attempted:
    "Nothing left this practice. The connection was never established, so the other system saw nothing and there is nothing there to undo.",
  sent_no_response:
    "This left the practice and nothing came back. It may have arrived and been processed, or it may not — from here the two look identical, and nobody here can tell them apart. It is not a failure and it is not a delivery.",
  rejected_by_recipient:
    "The receiving system refused it and said so. It did not take effect there, so the record is unchanged at the other end.",
  acknowledged:
    "The receiving system confirmed it has this. That is the system itself answering, not a web server accepting the bytes.",
};

/**
 * What the transport reported. Deliberately finer-grained than `ExchangeState`.
 *
 * Kept separate because the mapping between them is where the judgement lives, and a judgement
 * inside a switch statement is a judgement nobody reviews.
 */
export type TransportOutcome =
  | "connection_refused"
  | "dns_failure"
  | "tls_failure"
  | "timeout_before_response"
  | "connection_reset_mid_request"
  | "http_2xx_no_application_ack"
  | "http_4xx"
  | "http_5xx"
  | "application_ack"
  | "application_nack";

export interface OutcomeMapping {
  state: ExchangeState;
  /** Why this outcome means that state. The argument, not a restatement. */
  why: string;
  /** Whether the raw outcome leaves genuine doubt about what happened at the far end. */
  ambiguous: boolean;
}

/**
 * The mapping, as declared data.
 *
 * A table rather than a switch, because every row here is an argument somebody could disagree
 * with, and an argument buried in control flow is one nobody reads. Two rows in particular are
 * written the other way in most implementations — see `http_2xx_no_application_ack` and
 * `timeout_before_response`.
 */
export const OUTCOME_MAPPING: Readonly<Record<TransportOutcome, OutcomeMapping>> = {
  connection_refused: {
    state: "not_attempted",
    why: "The far end refused the connection, so no request was ever transmitted. Nothing exists at the other end to duplicate.",
    ambiguous: false,
  },
  dns_failure: {
    state: "not_attempted",
    why: "The host was never resolved, so no connection was opened and no bytes were transmitted to anything. Worth stating separately from a refused connection rather than folding the two together: a DNS failure usually means a configuration error on this side, where a refusal usually means the far end is down, and the operator action differs even though the exchange state does not.",
    ambiguous: false,
  },
  tls_failure: {
    state: "not_attempted",
    why: "The handshake failed before any request body was transmitted. This is the one place a failure genuinely means nothing left.",
    ambiguous: false,
  },
  timeout_before_response: {
    state: "sent_no_response",
    why: "A TIMEOUT IS NOT A FAILURE. The request was transmitted and no answer came back; it may be committed at the other end right now. The tempting chain is timeout to failed to retry, and every arrow in it is wrong.",
    ambiguous: true,
  },
  connection_reset_mid_request: {
    state: "sent_no_response",
    why: "Genuinely ambiguous: the reset may have arrived before or after the far end read the body. It resolves to the unsafe-to-retry reading on purpose — the mistake that produces a person looking at it is recoverable, and the one that produces an automatic retry is not.",
    ambiguous: true,
  },
  http_2xx_no_application_ack: {
    state: "sent_no_response",
    why: "A 2xx IS NOT AN ACKNOWLEDGEMENT. It means something at the far end accepted the bytes, which may be a load balancer, a gateway or a queue. An acknowledgement is the receiving clinical system saying it holds the document. Treating the first as the second reports delivery of things dropped one hop short, and it is indistinguishable from working until somebody asks.",
    ambiguous: true,
  },
  http_4xx: {
    state: "rejected_by_recipient",
    why: "The recipient refused the request and said so. It did not take effect, so the record at the other end is unchanged.",
    ambiguous: false,
  },
  http_5xx: {
    state: "sent_no_response",
    why: "The far end errored, which says nothing about whether it processed the request first. A 500 after a successful write is an ordinary shape.",
    ambiguous: true,
  },
  application_ack: {
    state: "acknowledged",
    why: "The receiving system itself confirmed it holds the document. This is the only outcome that produces an acknowledgement.",
    ambiguous: false,
  },
  application_nack: {
    state: "rejected_by_recipient",
    why: "The receiving system itself refused it, with its own reason. It did not take effect.",
    ambiguous: false,
  },
};

/** What one transport outcome means. */
export function stateFor(outcome: TransportOutcome): ExchangeState {
  return OUTCOME_MAPPING[outcome].state;
}

/**
 * Whether sending again is safe.
 *
 * Three values, and `retry_may_duplicate` is a refusal rather than a slow yes: no code path in
 * this tree turns it into an automatic retry, because the thing that would be duplicated is a
 * clinical document in another practice's system.
 */
export type RetryVerdict = "safe_to_retry" | "retry_may_duplicate" | "nothing_to_retry";

export const RETRY_VERDICT_COPY: Record<RetryVerdict, string> = {
  safe_to_retry:
    "Nothing took effect at the other end, so sending again cannot produce a second copy of anything.",
  retry_may_duplicate:
    "This may already have arrived. Sending again could put a second copy of the same document into the receiving system, and from here there is no way to tell whether it would. Somebody has to check with the recipient; this product will not decide it.",
  nothing_to_retry: "The recipient has confirmed it holds this. There is nothing outstanding.",
};

export function retryVerdict(state: ExchangeState): RetryVerdict {
  switch (state) {
    case "not_attempted":
      return "safe_to_retry";
    case "rejected_by_recipient":
      // It did not take effect, so a corrected document can be sent without duplicating anything.
      return "safe_to_retry";
    case "sent_no_response":
      return "retry_may_duplicate";
    case "acknowledged":
      return "nothing_to_retry";
  }
}

export type LedgerDisposition =
  | { record: false; why: string }
  | { record: true; acknowledgement: Acknowledgement };

/**
 * What W239's ledger should hold for an exchange in this state.
 *
 * Composed rather than restated — W194's rule, because two modules describing the same event drift
 * unless something checks they agree. It also says something the ledger cannot say on its own: an
 * exchange that never left produces NO ROW, because a disclosure row for something that was never
 * disclosed is a false record in the one place that exists to be trusted after a dispute.
 */
export function ledgerDisposition(state: ExchangeState): LedgerDisposition {
  if (state === "not_attempted") {
    return {
      record: false,
      why: "Nothing left the practice, so there was no disclosure. A ledger row here would be a record of something that did not happen, in the register whose whole value is being trusted after a dispute.",
    };
  }
  if (state === "acknowledged") return { record: true, acknowledgement: "acknowledged" };
  if (state === "rejected_by_recipient") {
    return { record: true, acknowledgement: "rejected_by_recipient" };
  }
  // Sent, no response: it LEFT, so the ledger records it, and records that nothing came back.
  return { record: true, acknowledgement: "not_recorded" };
}

/**
 * Readings this module refuses, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly rewriting a mapping row.
 */
export const REFUSED_READINGS: Readonly<Record<string, string>> = {
  a_single_unknown_state:
    "Collapsing 'nothing left' and 'it left and we heard nothing' into one `unknown`. They are opposite on the only question this boundary raises — whether to send again — so a caller handed one value gets it wrong in one direction or the other: a duplicated clinical document in somebody else's record, or a patient waiting on care that was never requested.",
  a_delivered_boolean:
    "Any `delivered`, `isDelivered`, `ok` or `success` returning a boolean. Two values cannot carry four states, every caller reaches for the convenient one, and the state that gets lost is always the ambiguous one — which is the only state that needed a person.",
  treating_2xx_as_acknowledgement:
    "Reading HTTP 200 as the recipient confirming receipt. A 2xx means something accepted the bytes, and that something may be a load balancer, a gateway or a queue. It reports delivery of documents dropped one hop short, and looks exactly like working until somebody asks what happened to a referral.",
  timeout_as_failure:
    "Mapping a timeout to failed. A timeout is the absence of an answer, not an answer of no, and the request may be committed at the far end right now. The chain timeout to failed to retry is where duplicate clinical documents come from.",
  resolving_ambiguity_the_convenient_way:
    "Reading an ambiguous outcome as 'nothing left' so the queue can drain. That is the reading that produces an automatic retry, and it is the unrecoverable mistake of the two; ambiguity resolves to the reading that produces a person looking at it.",
  automatic_retry_on_ambiguity:
    "Turning `retry_may_duplicate` into a retry with a delay. It is a refusal, not a slow yes. Whether a second copy is acceptable is a question about the recipient's system and their record, and it is not answerable from here.",
  a_ledger_row_for_an_unattempted_send:
    "Recording a disclosure for an exchange that never left. W239's ledger exists to be trusted after a dispute, and a row describing a disclosure that did not happen is worse than a missing one — it is the register itself being wrong.",
};

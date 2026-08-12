// W246: what was exchanged, and — the harder half — what was not.
//
// Everything Q19 built stops before a byte leaves. `SHIPPED_DISCLOSURES` is empty, every
// credential slot is blocked, and `loadCredential` refuses before it looks at the value. So this
// page has nothing to show, and THAT IS THE DESIGN PROBLEM RATHER THAN A REASON NOT TO BUILD IT.
//
// A PAGE OF ZEROS IS THE MOST DANGEROUS PAGE IN THIS TREE. "0 exchanges" reads as *we tried and
// nothing came of it*, or as *nothing needed to go*. The truth is a third thing: nothing has ever
// been ATTEMPTED, because there is no transport, no credential and no ratified gate. W179 split a
// zero into "nothing happened" and "nothing arrived" and made the reassuring reading require
// proof; here the reassuring reading is not even one of the two. So the empty state is not a
// table with zeros in it — it is a statement of what stands between this practice and an
// exchange, derived from W242's slots rather than written into this file.
//
// AND THE LEDGER CANNOT ANSWER THE QUESTION THIS PAGE IS NAMED FOR. W239 records what LEFT, and
// W244 is explicit that a `not_attempted` exchange must produce NO LEDGER ROW — a row for
// something that never left would be a false record of a disclosure. Both are right, and together
// they mean A CONSOLE BUILT ON THE LEDGER CAN NEVER SHOW WHAT DID NOT LEAVE. That is a structural
// bound on "what was not exchanged", not an oversight, and `WHAT_THIS_PAGE_CANNOT_SHOW` states it
// on the page rather than in a comment — because a reader who believes this page is complete will
// read an absence of rows as an absence of failures.
//
// THE POPULATED BRANCH IS BUILT AND TESTED EVEN THOUGH NOTHING CAN REACH IT. W220 shipped a
// response console whose e2e failed because every offer had a response, so the "nothing recorded"
// line never rendered — which revealed the page had no positive branch at all. The mirror of that
// mistake is a page with only an empty state: correct today, untested for the day it fills, and
// written in a hurry by whoever ratifies G9. So `exchanges_recorded` exists, and its tests pass
// synthetic rows through it.
//
// FOUR COUNTS, ALWAYS ALL FOUR, INCLUDING THE ZEROS — W228's rule that a page speaking only when
// alarmed teaches a reader that silence means agreement. And never a dash: W197's rule, inherited
// from W229's capacity console, because a blank cell is read as the meaning that needs no
// explanation.
//
// NO CONTROL, AND HERE THAT IS NOT A STYLE CHOICE. A retry button on this page would be the most
// dangerous control in this product: one click on a `sent_no_response` row may put a second copy
// of a clinical document into another practice's system, and W244 says in as many words that this
// product will not decide it. The retry verdict is SHOWN, so a person can act; there is nothing
// to press.
//
// FOUNDER GATE (plan §4): no transport, no recipient, no send and no retry. The page renders an
// empty ledger because the ledger is empty, and it says which gates keep it that way.

import {
  CREDENTIAL_SLOTS,
  SHIPPED_CREDENTIALS,
  type CredentialSlot,
} from "./credentials";
import {
  SHIPPED_DISCLOSURES,
  renderDisclosure,
  type Acknowledgement,
  type Disclosure,
} from "./disclosure-ledger";
import {
  EXCHANGE_STATE_COPY,
  RETRY_VERDICT_COPY,
  ledgerDisposition,
  retryVerdict,
  type ExchangeState,
  type RetryVerdict,
} from "./exchange-state";

/**
 * The states a LEDGER ROW can carry.
 *
 * `not_attempted` is excluded by construction rather than by filtering: W244 requires that such an
 * exchange produce no row, so a row in this state cannot exist. Writing it as a type rather than a
 * runtime check is what makes `WHAT_THIS_PAGE_CANNOT_SHOW` a statement about the model instead of
 * a caveat somebody added.
 */
export type RecordedExchangeState = Exclude<ExchangeState, "not_attempted">;

/**
 * The inverse of W244's `ledgerDisposition`, over the rows that can exist.
 *
 * Composed rather than restated — W194's rule — and a test drives it in BOTH directions against
 * `ledgerDisposition`, because two modules describing the same event drift unless something checks
 * that they agree. The one that matters is `not_recorded`: it maps back to `sent_no_response`,
 * which is the state that may already have arrived.
 */
export function stateFromLedgerRow(acknowledgement: Acknowledgement): RecordedExchangeState {
  switch (acknowledgement) {
    case "acknowledged":
      return "acknowledged";
    case "rejected_by_recipient":
      return "rejected_by_recipient";
    case "not_recorded":
      return "sent_no_response";
  }
}

export interface ExchangeRow {
  disclosure: Disclosure;
  state: RecordedExchangeState;
  /** What the state means, in W244's words. Never rewritten here. */
  stateCopy: string;
  retry: RetryVerdict;
  retryCopy: string;
  /** W239's own sentence for the row, so the two surfaces cannot describe it differently. */
  line: string;
}

export function exchangeRow(disclosure: Disclosure): ExchangeRow {
  const state = stateFromLedgerRow(disclosure.acknowledgement);
  const retry = retryVerdict(state);
  return {
    disclosure,
    state,
    stateCopy: EXCHANGE_STATE_COPY[state],
    retry,
    retryCopy: RETRY_VERDICT_COPY[retry],
    line: renderDisclosure(disclosure),
  };
}

/** A path to an exchange that does not exist yet, and every gate standing in it. */
export interface BlockedPath {
  what: string;
  blockedBy: readonly string[];
}

/**
 * What stands between this practice and an exchange, DERIVED from W242's register.
 *
 * Not a list in this file. A hand-written one would say what somebody remembered on the day the
 * page was built, and would go on saying it after a gate was ratified — which is the failure W102
 * exists against, arriving on a surface a practice reads.
 */
export function blockedPaths(slots: readonly CredentialSlot[] = CREDENTIAL_SLOTS): BlockedPath[] {
  return slots
    .filter((slot) => slot.blockedBy.length > 0)
    .map((slot) => ({ what: slot.system, blockedBy: slot.blockedBy }));
}

export const INTEROP_CONSOLE_COPY = {
  whatThisIs:
    "Everything this practice has sent to another system, and what happened to each one. A row appears here when something left the practice — not when it was successfully received, because data that left and was refused still left.",
  nothingEverAttempted:
    "Nothing has ever been sent from this practice, and nothing has been attempted. That is not the same as having tried and got nowhere: there is no connection to any other system in this product, so nothing has ever had the chance to go wrong. The list below is what would have to be decided before anything could be sent at all.",
  countsAlwaysShown:
    "All four outcomes are listed every time, including the ones at zero. A page that speaks only when something has gone wrong teaches you that silence means everything is fine.",
  sentNoResponseIsNotDelivered:
    "“Left, nothing came back” is not a delivery and it is not a failure. From here the two look identical, and nobody at this practice can tell them apart.",
  noRetryControl:
    "There is nothing here to press. Sending something again when it may already have arrived can put a second copy of a clinical document into another practice's records, and this product will not make that decision for you — it tells you which rows carry that risk so you can ask the recipient.",
  ledgerHoldsNoPatient:
    "These rows say what left, to whom and when. They do not hold anybody's name or record, so this page cannot tell you which patients were in a disclosure.",
} as const;

/**
 * The bound, stated ON THE PAGE.
 *
 * W239's ledger records what left; W244 requires that an exchange which never left produce no row.
 * Both are right and the consequence is that this page cannot show a failure to send. A reader who
 * believes it is complete would read no rows as no problems, which is the reading the whole
 * console exists to prevent.
 */
export const WHAT_THIS_PAGE_CANNOT_SHOW: readonly string[] = [
  "Anything that was never sent. A message that could not leave — no connection, no answer from the other end before it started — leaves no record here at all, because this list is built from what left the practice. An empty list means nothing left; it does not mean nothing failed.",
  "Whether the other practice acted on what it received. An acknowledgement means their system has the document, not that anybody has read it.",
  "Who was in a disclosure. The record deliberately holds no patient identity, so this page cannot answer that and neither can anybody reading it later.",
];

export type InteropConsoleView =
  | {
      state: "nothing_ever_attempted";
      copy: string;
      blocked: readonly BlockedPath[];
      cannotShow: readonly string[];
    }
  | {
      state: "exchanges_recorded";
      rows: readonly ExchangeRow[];
      /** All four, always — including `not_attempted`, which is always zero and says so. */
      counts: Readonly<Record<ExchangeState, number>>;
      cannotShow: readonly string[];
    };

/**
 * The view for one practice.
 *
 * PRACTICE-SCOPED AS THE QUERY, not as a filter applied afterwards — W123's rule and W209's
 * finding. The empty branch is reached when this practice has no rows, which today is every
 * practice, and it does not say "no exchanges": it says nothing was attempted, and why.
 */
export function interopConsoleView(
  practiceId: string,
  disclosures: readonly Disclosure[] = SHIPPED_DISCLOSURES,
  slots: readonly CredentialSlot[] = CREDENTIAL_SLOTS,
): InteropConsoleView {
  const mine = disclosures.filter((d) => d.practiceId === practiceId);
  if (mine.length === 0) {
    return {
      state: "nothing_ever_attempted",
      copy: INTEROP_CONSOLE_COPY.nothingEverAttempted,
      blocked: blockedPaths(slots),
      cannotShow: WHAT_THIS_PAGE_CANNOT_SHOW,
    };
  }
  const rows = mine.map(exchangeRow);
  const counts: Record<ExchangeState, number> = {
    // Always present and always zero on this surface — see `RecordedExchangeState`. Rendered
    // rather than omitted, because a missing count is the shape a reader fills in themselves.
    not_attempted: 0,
    sent_no_response: 0,
    rejected_by_recipient: 0,
    acknowledged: 0,
  };
  for (const row of rows) counts[row.state] += 1;
  return { state: "exchanges_recorded", rows, counts, cannotShow: WHAT_THIS_PAGE_CANNOT_SHOW };
}

/**
 * Whether this tree could send anything at all, as a fact rather than a claim.
 *
 * Reads the credential register rather than asserting a sentence, so the page's central statement
 * moves the day a gate is ratified instead of being corrected by whoever notices.
 */
export function nothingCanBeSent(
  credentials: readonly unknown[] = SHIPPED_CREDENTIALS,
  slots: readonly CredentialSlot[] = CREDENTIAL_SLOTS,
): boolean {
  return credentials.length === 0 && slots.every((slot) => slot.blockedBy.length > 0);
}

/**
 * Behaviours this console must never take on, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly adding a button.
 */
export const REFUSED_CONSOLE_BEHAVIOURS: Readonly<Record<string, string>> = {
  a_retry_control:
    "A button that sends something again. It would be the most dangerous control in this product: on a row that left and got no answer, one click may put a SECOND copy of a clinical document into another practice's records, and from here nobody can tell whether it would. W244 states that this product will not decide it, so the verdict is shown and there is nothing to press.",
  a_delivered_column:
    "A column, badge or icon reading delivered/failed. Two values cannot carry four states, and the state that gets lost is always `sent_no_response` — the only one that needed a person. It is also the state a practice most wants to read as delivered.",
  a_zero_where_nothing_was_attempted:
    "Rendering '0 exchanges' when nothing has ever been tried. A zero is a measurement, and this is the absence of one: it invites a reader to conclude that sending was attempted and produced nothing, which is the opposite of true and the more reassuring of the two.",
  a_success_rate:
    "Any percentage over these rows. A rate needs a denominator of attempts, and the attempts that never left leave no row here — so every rate this page could compute would be over the survivors of a filter it cannot see.",
  naming_the_patients:
    "Adding who was in a disclosure. W239's row deliberately holds no patient identity, and that is what its record class rests on; a console that joined the subjects back in would recreate the lasting copy the ledger was shaped to avoid.",
  a_hand_written_blocker_list:
    "Writing the gates into this page. It would say what somebody remembered on the day it was built and go on saying it after a gate was ratified — W102's failure, on a surface a practice reads.",
};

/** Compose-check helper: what W244 says the ledger should hold for a row in this state. */
export function agreesWithLedger(state: RecordedExchangeState): boolean {
  const disposition = ledgerDisposition(state);
  return disposition.record && stateFromLedgerRow(disposition.acknowledgement) === state;
}

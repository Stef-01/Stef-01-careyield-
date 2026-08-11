// W220: the response graph as a practice reads it.
//
// The view-model, not the page. The page is JSX and a test can only assert that text appeared on
// it; what has to be right here is which of four different silences a reader is looking at, and
// that is a decision worth making somewhere it can be checked by value.
//
// FOUR SILENCES, AND THIS SURFACE CAN SHOW ALL FOUR AT ONCE. W179's rule is that a zero is not a
// fact until it says which zero it is, and the response graph has more zeros than any surface
// this tree has built:
//
//   1. A KIND WAS NEVER PERFORMED. Positive knowledge: the declared kinds are enumerated, and
//      this one produced no interventions. "We never sent any reminders" is a fact about the
//      product, not about the practice, and it is emphatically not a response rate of zero.
//
//   2. A KIND WAS PERFORMED AND NOTHING WAS RECORDED AGAINST IT. Also positive knowledge on one
//      side and silence on the other: offers went out, and the record holds nothing about what
//      happened next. W211 spent a whole unit refusing to call this "no response".
//
//   3. A CELL WAS WITHHELD. Measured, and not shown, because it describes too few people (W218).
//      A reader who cannot tell this from (2) will assume (2), because it needs no explanation.
//
//   4. THERE IS NO GRAPH AT ALL. And here the page genuinely does not know: a period with no
//      interventions is equally consistent with a quiet practice and with a rail that recorded
//      nothing. W179's load-bearing rule applies exactly — THE REASSURING READING REQUIRES
//      PROOF — so this resolves to `cannot_determine` and says what would settle it, rather than
//      to "nothing happened", which is the comfortable reading and the one nobody would check.
//
// The one case where the page CAN tell is worth having: answers recorded against interventions
// that are not in the graph is a recording gap on the intervention side, and that is a different
// sentence from "quiet". It is reachable — `eventsFromSim` and `interventionsFromSim` read the
// same log through different filters — so it is modelled rather than folded into (4).
//
// NO SEND CONTROL, AND THE PAGE SAYS SO. G9 is unratified: these counts describe a practice, and
// whether they may go to a third-party organisation is not a decision this loop takes. W199 took
// the same posture and stated the absence, because an absence nobody points at reads as a feature
// somebody forgot.

import { disclosableGraph, type DisclosableGraph } from "./graph-privacy";
import type { ResponseGraph } from "./response-graph";

export type EmptyReading =
  /**
   * No interventions recorded, and no way to tell a quiet period from an unrecorded one.
   *
   * W179's third value, and the reason this is not called `nothing_happened`.
   */
  | "cannot_determine"
  /** Answers are recorded against interventions the graph does not hold: a recording gap. */
  | "answers_without_interventions";

export const RESPONSE_CONSOLE_COPY = {
  intro:
    "What was recorded after each thing Meherr did. Every number here counts facts somebody wrote down; none of it says whether any care was right, and none of it is about one person.",
  notSent:
    "Nothing on this page has been sent to anybody. Meherr does not share these counts with any outside organisation, and there is no control here that would.",
  neverPerformed:
    "Meherr did not do this at all in this period, so there is nothing to count. This is not a rate of zero.",
  nothingRecorded:
    "These went out and the record holds nothing about what happened next. That is a statement about the record, not about the people it concerns, and it is not counted as anybody declining.",
  /**
   * The positive form, which has to be said out loud.
   *
   * W205's rule: a caveat that appears only on the incomplete case makes its PRESENCE the signal.
   * A reader who never sees a "nothing recorded" line cannot tell "everything was answered" from
   * "this page does not track that", and the second is the reading that needs no explanation.
   */
  allRecorded:
    "Every one of these has something recorded against it in this period. Nothing here is waiting on an answer that never arrived.",
  withheld:
    "Some counts are withheld because they describe too few people to publish without identifying them. A withheld count was measured — it is not missing and it is not a zero.",
} as const;

export const EMPTY_READING_COPY: Record<EmptyReading, string> = {
  cannot_determine:
    "Nothing is recorded for this period, and this page cannot tell you whether that means Meherr did nothing or means nothing reached the record. Those lead to different actions, so it will not guess.",
  answers_without_interventions:
    "The record holds answers to things this page cannot see — bookings and opt-outs against offers it has no record of sending. That is a gap on the sending side, not a quiet period.",
};

export const EMPTY_WOULD_SETTLE_IT: Record<EmptyReading, readonly string[]> = {
  cannot_determine: [
    "Check the practice-software feed on the admin ops page: a feed that has not been read recently explains a silent period.",
    "Check whether sending is paused for this practice, or halted for everybody.",
    "If both are healthy and the period really was quiet, nothing here needs doing.",
  ],
  answers_without_interventions: [
    "Check whether offers are being recorded when they are sent, not only when they are answered.",
  ],
};

export type ResponseConsoleView =
  | { state: "graph"; disclosable: DisclosableGraph; withheldCellCount: number }
  | { state: "empty"; reading: EmptyReading; copy: string; wouldSettleIt: readonly string[] };

/**
 * What the page shows.
 *
 * Takes the graph result rather than building one, so the page's data source is visible at the
 * page and this stays a decision about rendering. `eventCount` is the second input the empty
 * reading needs: without it, "no interventions" and "no interventions but plenty of answers"
 * are the same input and the page would tell a practice its week was quiet while its rail was
 * dropping every offer it sent.
 */
export function responseConsoleView(
  graph: ResponseGraph | null,
  eventCount: number,
): ResponseConsoleView {
  if (graph === null) {
    const reading: EmptyReading =
      eventCount > 0 ? "answers_without_interventions" : "cannot_determine";
    return {
      state: "empty",
      reading,
      copy: EMPTY_READING_COPY[reading],
      wouldSettleIt: EMPTY_WOULD_SETTLE_IT[reading],
    };
  }
  const disclosable = disclosableGraph(graph);
  const withheldCellCount = disclosable.kinds.reduce(
    (sum, kind) => sum + kind.cells.filter((cell) => cell.suppression !== null).length,
    0,
  );
  return { state: "graph", disclosable, withheldCellCount };
}

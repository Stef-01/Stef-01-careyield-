// W346: what an operator is told when setup is FINISHED and the console is still empty.
//
// THE SAME EMPTY SCREEN MEANS THREE DIFFERENT THINGS AND THE CONSOLE COULD TELL APART ONE. W334
// gave the first: setup is unfinished, and `<SetupGaps>` names the step. The second is what a
// practice sees the morning after they finish the wizard — every setting saved, every screen still
// blank, because nothing has RUN yet. The third is a practice that has been running for a fortnight
// and genuinely had nothing to show. Until this unit the second and third were the same sentence:
// *Nothing here yet*, which reads to somebody who has just spent twenty minutes on setup like the
// product did not take.
//
// THE TWO NOTICES ARE MUTUALLY EXCLUSIVE, AND THAT IS THE WHOLE DESIGN. `waitingFor` returns null
// while setup is unfinished, because W334's notice owns that state and a page showing both would be
// telling an operator to go and finish a wizard AND to wait for a cycle that cannot start until
// they do. It returns null when the page's own subject is not empty, because a page with something
// on it is not waiting for anything. So for any page that asks: at most one notice ever speaks, and
// when the page is empty exactly one does. `waitingDefects` in `src/demo/path.ts` checks the pages
// render it and `src/console/waiting.test.ts` drives the exclusion over every combination there is.
//
// THE PAGE SAYS WHAT IT IS EMPTY OF, and it has to. Whether a register is empty is a question about
// registers, whether an outreach queue is empty is a question about invitations, and a module that
// tried to answer both would be re-deriving four pages' worth of state to tell them something each
// already knows. W334 made the same trade for the same reason and `SETUP_GAP_BOUND` argues it; the
// cost is the same too, and it is stated below rather than discovered.
//
// WHAT THIS IS NOT is a progress bar. Nothing here estimates when a cycle will run, and nothing
// claims one is imminent: a practice that finished setup on a Friday and reads this on Saturday is
// being told what has not happened, not promised that it will.
//
// WHAT THIS DOES NOT PROVE is `WAITING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Synthetic practices, no patient data, nothing sent.

import type { SetupReadiness } from "./store";

/**
 * The thing a finished practice's console is waiting for.
 *
 * ONE, AND THE COUNT IS THE FINDING RATHER THAN A CORNER CUT. A first draft had four — a
 * practice-system read, the register run, the first offer, the first completed appointment — and
 * every one of them was wrong about this product. Driving a real practice through the whole wizard
 * and then looking at the console is what settled it: registers, outreach and capacity all come
 * back FULL, because they are computed from the synthetic set this tree ships rather than from
 * anything the practice has done, and `/console/capacity` names its own empty state in its own
 * words when it has one. `/console/dashboard` reads the simulator and is never empty at all.
 *
 * WHAT IS ACTUALLY EMPTY ON DAY TWO IS THE REFERRAL RECORD, in two places. That is the honest
 * answer and it is smaller than the guess — which is the point of having walked it rather than
 * reasoned about it, and the second time in two units that a premise about what a page shows was
 * wrong until something drove it. `WAITING_ELSEWHERE` in `src/demo/path.ts` carries the pages that
 * are empty and say so themselves, so a walk over two routes cannot read as a claim about a
 * console with twenty.
 */
export type Cycle = "referrals_recorded";

/** Typed as a union so a second fails the build until its copy exists. */
export const CYCLES: readonly Cycle[] = ["referrals_recorded"];

export interface WaitingCopy {
  /** What has not happened, in the operator's words rather than the job's. */
  headline: string;
  /** Why this page is empty because of it, and what will change when it runs. */
  detail: string;
}

/**
 * One sentence per cycle, naming what has not run rather than what is missing.
 *
 * W179'S RULE, ONE STATE FURTHER ON. The setup notice says *finish this step*; there is nothing to
 * finish here, so the copy's job is to say the console is correct and the wait is expected. Saying
 * *no data* to somebody who has just finished setup is the sentence that makes a working product
 * look broken.
 */
export const WAITING_COPY: Readonly<Record<Cycle, WaitingCopy>> = {
  referrals_recorded: {
    headline: "No referral has been recorded yet",
    detail:
      "Setup is finished and nothing is wrong. This practice has not written a referral or received one since it was set up, so there is nothing here to show and nothing yet to follow up. These screens fill in as referrals are recorded.",
  },
};



/** What a page knows about its own emptiness. */
export interface Subject {
  /** True when this page has nothing to show. Asked of the page, which is the only thing that knows. */
  empty: boolean;
  /** The cycle this page's contents are downstream of. */
  cycle: Cycle;
}

/**
 * The one thing this page is waiting for, or null when it is not waiting.
 *
 * BOTH NULLS ARE LOAD-BEARING and neither is a guard against bad input. Unfinished setup belongs to
 * W334's notice — a page that showed both would be asking an operator to wait for something that
 * cannot start until they go and finish a wizard, which is worse than saying nothing. A page with
 * contents is not waiting: an outreach queue holding one invitation is answering, and a notice
 * beside it saying nothing has been offered would be contradicting the table under it.
 */
export function waitingFor(readiness: SetupReadiness, subject: Subject): Cycle | null {
  if (!readiness.complete) return null;
  return subject.empty ? subject.cycle : null;
}

/** What this does not prove. */
export const WAITING_BOUND =
  "EMPTY IS THE PAGE'S OWN WORD AND NOTHING CHECKS IT. A page that computes its rows and then " +
  "passes `empty: false` while rendering none says it is not waiting and shows nothing, which is " +
  "the state this unit exists to remove, arriving through the one door the register cannot watch. " +
  "The trade is W334's and the reason is the same: whether a register is empty is a question about " +
  "registers, and a module answering it for four pages would re-derive what each of them has " +
  "already worked out. WHAT IS CHECKED IS THE PAIR — no page can show both notices and an empty " +
  "page shows one — which is a property of these two functions rather than of any page, and " +
  "`waitingDefects` reads the pages for the marker rather than for the answer. THE CYCLE IS A " +
  "DECLARATION TOO: a page naming `pms_read` when its emptiness is really downstream of the " +
  "register run tells an operator to wait for the wrong thing, and nothing derives which cycle a " +
  "page's contents come from — it is a reading of what the page renders, made by whoever wired it " +
  "up. And none of this knows whether a cycle will EVER run: a practice whose practice-system " +
  "connection was never configured waits on the same sentence as one whose first read is due " +
  "tonight, because the thing that would tell them apart is a live connection, which G1 gates.";

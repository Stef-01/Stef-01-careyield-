// W279: a zero on a console page means three different things, and the page has to pick one.
//
// W179 established this for the appointment feed and its argument is the whole unit: a zero that
// means "nothing happened" and a zero that means "nothing reached us" are OPPOSITE INSTRUCTIONS to
// the person reading them. One says the week was quiet; the other says the connection is broken
// and the figures are not about the practice at all. `SILENCE_COPY` split the feed's zero into
// seven causes with different copy and a different action for each.
//
// EVERY OTHER CONSOLE PAGE STILL HAS ONE ZERO. Eighteen of the twenty-seven render an empty state
// and each writes its own sentence — "Nothing recorded yet", "No registers are available yet",
// "Nothing to show yet". Read as a class rather than one at a time, those are all the FIRST
// meaning, and none of the eighteen can say the second or the third. A page that cannot say "we
// could not load this" renders "nothing yet" when the read failed, which is W179's defect
// everywhere W179 did not reach.
//
// So the three states get one vocabulary, and the vocabulary is the deliverable:
//
//   * `nothing_yet` — the practice has not done the thing. Nothing is wrong. The action is
//     usually to go and do it.
//   * `nothing_arrived` — the practice may well have done it; nothing has reached us. The action
//     is to check a connection, and reading it as quiet would be a mistake about the practice.
//   * `could_not_load` — this read failed. The action is to try again or tell somebody, and the
//     one thing nobody should do is conclude anything about the practice from it.
//
// SEPARATE COPY IS THE PROPERTY, NOT SEPARATE NAMES. Three states with the same sentence have
// collapsed back into one however the register is spelled, so the headline, the detail and the
// action are all required to differ pairwise — checked, because "we will word them differently"
// is the promise every register in this tree has had to replace with a test.
//
// WHAT THIS UNIT DOES NOT DO, stated rather than left to be discovered: it does not prove a page
// renders the RIGHT state at runtime, and it does not prove a page has a branch to put one in.
// The first needs a read that can be made to fail on demand, and W287 found that one console read
// CAN — `/console/interest` reads a file on disk, and the claim that used to stand here was that
// none could. The
// second was ATTEMPTED AND ABANDONED, which is worth recording rather than quietly dropping — see
// `a_detector_tuned_until_it_agrees` below. `RUNTIME_BOUND` says what is left unproved.
//
// FOUNDER GATE (plan §4): operator copy only. No page here addresses a patient.

import type { CauseCopy } from "@/ops/silence";

/** The three meanings a zero can have. Named because a zero cannot say which it is. */
export type ZeroState = "nothing_yet" | "nothing_arrived" | "could_not_load";

export const ALL_ZERO_STATES: readonly ZeroState[] = [
  "nothing_yet",
  "nothing_arrived",
  "could_not_load",
];

/**
 * One vocabulary for all three, reusing W179's `CauseCopy` rather than a second shape.
 *
 * Typed `Record<ZeroState, …>` so a fourth state added to the union fails the build until its copy
 * exists — W179's device, and the reason its seven causes have never drifted.
 */
export const ZERO_STATE_COPY: Readonly<Record<ZeroState, CauseCopy>> = {
  nothing_yet: {
    headline: "Nothing here yet",
    detail:
      "This practice has not recorded anything of this kind. That is an ordinary state for a practice that has just started, and it is a statement about the record rather than about the care.",
    action: "Nothing needs fixing. This fills in as the practice works.",
  },
  nothing_arrived: {
    headline: "Nothing has reached us",
    detail:
      "The practice may well have recorded something; none of it has arrived here. Read this as a gap in what we hold rather than as a quiet period, because the two look identical on this page and mean opposite things.",
    action: "Check that the practice software is still connected before reading anything into this.",
  },
  could_not_load: {
    headline: "We could not load this",
    detail:
      "The read failed. Nothing on this page is a fact about the practice right now, including the parts that look like figures, and we would rather say so than show a zero that means something else.",
    action: "Try again, and tell us if it keeps happening. Do not conclude anything from what is on screen.",
  },
};

export interface RouteZeroStates {
  /** As `discoverSurfaces` spells it. */
  route: string;
  /** The states this route can be in. Empty when it has no data surface at all. */
  states: readonly ZeroState[];
  /** Why these and not the others — required, including for a route with none. */
  why: string;
}

/**
 * Every console route, and which zeros it can show.
 *
 * All twenty-seven, so a route with no data surface is DECLARED to have none rather than being
 * absent — W51's rule, and the distinction this tree keeps finding: "there is nothing to declare"
 * and "nobody declared it" are indistinguishable from outside.
 *
 * `could_not_load` is absent everywhere today and that is the honest reading rather than an
 * oversight: every console read is an in-memory store call that cannot fail, so the state has
 * nowhere to arise until W275's gate or a real database makes a read fallible. Declaring it on
 * eighteen pages that cannot reach it would be the paper trail of a control that does not exist.
 */
export const CONSOLE_ZERO_STATES: readonly RouteZeroStates[] = [
  { route: "/console", states: [], why: "A landing page for the console: navigation and the practice's own name. It lists nothing, so there is no zero to interpret." },
  { route: "/console/capability", states: ["nothing_yet", "nothing_arrived"], why: "Capability records are stated by clinicians. Empty means nobody has stated one — or that a clinician's statements have not reached us, which is a different message." },
  { route: "/console/capacity", states: ["nothing_yet", "nothing_arrived"], why: "Recorded sessions come from the appointment rail, so both W179 meanings apply here for the same reason they apply to the feed." },
  { route: "/console/case-mix", states: ["nothing_yet", "nothing_arrived"], why: "Case mix is derived from recorded appointments. A practice with no attended appointments and a practice whose appointments have not arrived read the same and are not." },
  { route: "/console/complaints", states: ["nothing_yet"], why: "Complaints are entered by practice staff on this console. There is no feed to fail, so an empty list means exactly one thing." },
  { route: "/console/credentials", states: ["nothing_yet"], why: "Credentials are recorded here by the practice. Nothing arrives from elsewhere, so the only zero is the one the practice can act on." },
  { route: "/console/dashboard", states: ["nothing_yet", "nothing_arrived"], why: "The dashboard reads the rail, which is W179's own subject. Its silence causes are the sharper version of these two and the page defers to them." },
  { route: "/console/education", states: ["nothing_yet"], why: "Education items are curated content. Empty means none has been curated for this practice; there is no external source to have failed." },
  { route: "/console/interest", states: ["nothing_yet"], why: "W287 CORRECTED THIS ARGUMENT. It read 'signups arrive from the public form, so empty means nobody has signed up' — a sentence about where the DATA comes from, when the zero is about where the READ goes. This is the ONE console route whose read reaches disk: `.data/interest-signups.jsonl`, absent-file-returns-empty and unparseable-lines-dropped-silently. `could_not_load` is genuinely reachable here and is still not declared, because `listInterestSignups` cannot yet tell the page which zero it is holding. Declared instead in W287's `FALLIBLE_READS`, with the remedy." },
  { route: "/console/interop", states: ["nothing_yet"], why: "Nothing has ever been disclosed, because G1 is unratified. The zero is a gate holding rather than a missing feed, and W246 makes the page say so." },
  { route: "/console/onboarding", states: [], why: "A form. It collects rather than lists, so it has no empty state to misread." },
  { route: "/console/ops", states: ["nothing_yet", "nothing_arrived"], why: "The ops page is where W179's feed silence is read, so it is the one route where all of this was already true." },
  { route: "/console/outcomes", states: ["nothing_yet", "nothing_arrived"], why: "Outcomes are derived from referral events. A referral rail that has recorded nothing and one whose events have not arrived are opposite instructions." },
  { route: "/console/outreach", states: ["nothing_yet"], why: "Outreach is computed from the practice's own rules against its own rail. Empty means nobody is eligible today, which W12's simulation states directly." },
  { route: "/console/pathways", states: ["nothing_yet"], why: "Zero signed pathways, and W127's whole point is that the page SAYS SO rather than rendering an empty table — the zero is a founder gate holding, not an absence." },
  { route: "/console/privacy", states: ["nothing_yet"], why: "An export for a patient identifier the practice holds nothing about. W272 scoped it, and the zero means this practice holds nothing rather than nobody does." },
  { route: "/console/referrals", states: ["nothing_yet", "nothing_arrived"], why: "The GP-to-GP rail has two sides, so a referral this practice never sent and one that never reached us are different facts about a handover." },
  { route: "/console/registers", states: ["nothing_yet"], why: "Register content ships with the product. Empty means none is available, which is a statement about what is shipped rather than about the practice." },
  { route: "/console/reporting", states: ["nothing_yet"], why: "Reports are rendered on demand from live rails, so an empty report is an empty rail. W204 keeps no stored report to have gone missing." },
  { route: "/console/responses", states: ["nothing_yet", "nothing_arrived"], why: "The response graph is built from messages nothing has ever sent, and from events that would arrive from outside. Both zeros are reachable and mean different things." },
  { route: "/console/results", states: ["nothing_yet", "nothing_arrived"], why: "Results compare the practice's own figures against its held-back group, both drawn from the rail." },
  { route: "/console/roi", states: [], why: "A calculator over numbers the reader types in. It holds nothing, so it cannot be empty in the sense this register is about." },
  { route: "/console/rules", states: [], why: "The practice's own settings, which always exist because onboarding creates them. There is no empty state." },
  { route: "/console/setup/[step]", states: [], why: "A guided form, one step at a time. Each step collects an answer rather than listing anything, so there is no zero for a reader to misinterpret — the emptiness a source scan finds here is a field with nothing typed in it yet, which is a different thing entirely." },
  { route: "/console/signin", states: [], why: "Sign-in. It has no data surface at all, which is the clearest case of a route this register still has to declare rather than omit." },
  { route: "/console/usefulness", states: ["nothing_yet", "nothing_arrived"], why: "Usefulness is recorded per attended appointment, so it inherits the rail's two zeros." },
  { route: "/console/verticals", states: ["nothing_yet"], why: "W164's two zero states, which are the reason this register exists: nothing assembled yet is WORK, and assembled-but-unsigned is a founder gate. Neither is a feed failure." },
];

/**
 * What this unit cannot check, stated rather than left to be found.
 *
 * W237's rule, and the same shape as W278's fixture bound one unit earlier: a green register over
 * the half that is checkable reads as a green register over the whole thing to anybody who does
 * not look for the sentence saying otherwise.
 */
export const RUNTIME_BOUND =
  "This proves the vocabulary and the classification, not the rendering. It does not prove a page shows the RIGHT state when a read fails — that needs a read that can be made to fail on demand. W287 CORRECTED THE CLAIM THAT USED TO STAND HERE: this said every console read is an in-memory store call that cannot throw, and that is true of twenty-six of the twenty-seven. `/console/interest` reads a JSONL file on disk, so `could_not_load` IS reachable on one route — it is still declared on none, because the store cannot tell the page which zero it is holding, and W287's `FALLIBLE_READS` carries the route and the remedy. It does not prove a page has a branch to put a declared state in either: a source detector for that was written, measured, and found to disagree with the hand classification in BOTH directions, because this tree writes emptiness as `length === 0`, as a ternary over an array, as a `??`, and as a delegated component. What IS proved: the three vocabularies differ pairwise on every field, all twenty-seven console routes are classified with an argument each, and the route list is checked against W271's register in both directions. The remedy for both gaps is the same — a store that can be made to fail and a rendered page to read — and it arrives with W275's gate and a real database rather than with a sharper regex.";

/**
 * Ways of writing this that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly collapsing the states again.
 */
export const REFUSED_ZERO_SHAPES: Readonly<Record<string, string>> = {
  three_names_one_sentence:
    "Declaring three states and giving them near-identical copy. They would have collapsed back into one however the register is spelled, which is the exact defect W179 split the feed's zero to fix. Headline, detail AND action must differ pairwise, and it is checked rather than promised.",
  declaring_could_not_load_everywhere:
    "Giving all eighteen listing pages a `could_not_load` state because a read might fail one day. Twenty-six of the twenty-seven console reads are in-memory store calls that cannot throw, so the state has nowhere to arise on them — and a control declared on eighteen pages that cannot reach it is the paper trail of a control that does not exist. W287 FOUND THE TWENTY-SEVENTH: `/console/interest` reads a file on disk. The refusal still holds and its reason narrows rather than breaks — the state stays declared nowhere, because the one route that could reach it has a store that cannot report the difference, which is a remedy in W287's `FALLIBLE_READS` rather than a declaration here.",
  omitting_routes_with_no_zero:
    "Listing only the eighteen routes that render an empty state. A route absent from the register and a route with nothing to declare are indistinguishable from outside, which is W51's finding and the reason all twenty-seven are here — including sign-in, which is the clearest case.",
  claiming_the_runtime_is_checked:
    "Reading a green register as proof that a page shows the right zero when a read fails. Nothing here makes a read fail; nothing in this tree can. `RUNTIME_BOUND` says so on the module, because that is the sentence somebody would otherwise quote.",
  a_detector_tuned_until_it_agrees:
    "Adjusting a source scan for empty-state branches until it matched this register's hand classification. The first version found `length === 0` and missed seven routes; a broader one found nineteen and disagreed in both directions — it claimed `/console/setup/[step]` renders a zero and denied that `/console/ops` does, when ops is where W179's silence notice lives, delegated to a component. Every widening moved the disagreement rather than removing it, because emptiness here is written four different ways. A detector tuned until it agrees with the answer is not evidence for the answer, so the check was dropped and the gap is in `RUNTIME_BOUND`.",
  a_route_declared_without_a_reason:
    "Recording which states a route has and not why. The interesting half is the argument — `/console/pathways` shows a zero because a founder gate is holding, and `/console/capacity` shows one because a feed may not have arrived, and those are different sentences for a reader even though both lists are empty.",
};

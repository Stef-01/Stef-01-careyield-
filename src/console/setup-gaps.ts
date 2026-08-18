// W334: what an operator is told when their own setup is why the console is empty.
//
// THE PRODUCT HAS ALWAYS BEEN ABLE TO SAY *NOTHING HERE YET*. W179 gave the ops feed seven causes
// for silence and W211 gave the console three zero-states, and both exist because a zero that does
// not say WHICH nothing is a number an operator cannot act on. Neither vocabulary has a cause for
// the commonest reason a new practice's console is empty: THEY HAVE NOT FINISHED SETTING IT UP.
//
// `setupReadiness` has known which step is unmet since the wizard was built, and until now exactly
// one surface asked it — the wizard itself. So a practice that started setup, skipped the roster,
// and went looking at the dashboard was told *Nothing here yet*, which is true, unhelpful, and
// indistinguishable from a practice that finished setup and has genuinely had a quiet fortnight.
// The operator who most needs to be told something is the one told least.
//
// WHAT THIS IS NOT is a nag. The notice names the unfinished step and links to it; it does not
// block a page, hide its content, or repeat itself once the step is done. A practice that has
// chosen to leave a step unfinished is not doing anything wrong — it is a state the product
// supports, and the point is that the console SAYS SO where the consequence shows up rather than
// leaving somebody to infer it from an empty table.
//
// WHAT THIS DOES NOT PROVE is `SETUP_GAP_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Synthetic practices, no patient data, nothing sent.

import type { SetupReadiness } from "./store";

/**
 * A prerequisite the wizard checks, in the order the wizard asks for it.
 *
 * NOT `SetupStep`, and not `SETUP_STEPS` — `src/console/setup-steps.ts` owns those and means
 * something else by them: the five SCREENS the wizard shows. These are the three things
 * `setupReadiness` can find unmet, which is a different set with a different size, and W320's
 * ownership register reported the collision the moment both names existed.
 */
export type Prerequisite = "clinicians" | "sessions" | "rules";

/** In wizard order. Typed as a union so a fourth fails the build until its copy exists. */
export const PREREQUISITES: readonly Prerequisite[] = ["clinicians", "sessions", "rules"];

export interface GapCopy {
  /** What is unfinished, in the operator's words rather than the field's. */
  headline: string;
  /** What the console cannot do until it is done — the CONSEQUENCE, which is why they are reading. */
  detail: string;
  /** Where to finish it. */
  href: string;
}

/**
 * One sentence per unfinished step, saying what it stops rather than what it is.
 *
 * W179'S RULE APPLIED: the copy names the consequence, because *sessions are incomplete* tells an
 * operator staring at an empty capacity page nothing they did not already know. What they need is
 * that the page is empty BECAUSE of it, and where to go.
 */
export const SETUP_GAP_COPY: Readonly<Record<Prerequisite, GapCopy>> = {
  clinicians: {
    headline: "No participating clinician yet",
    detail:
      "Nobody has been added to the roster, or nobody on it is marked as participating. Until then this practice has no appointments to read and nothing to offer anybody, so every screen that counts patients will be empty.",
    href: "/console/setup/clinicians",
  },
  sessions: {
    headline: "Session settings are unfinished",
    detail:
      "The wizard has not been told which appointment types can be filled or how far ahead to look. Capacity is worked out from those, so the figures stay blank rather than being computed from a guess.",
    href: "/console/setup/sessions",
  },
  rules: {
    headline: "Eligibility rules are unfinished",
    detail:
      "Nothing yet says who this practice considers due. No patient is eligible under rules that have not been set, so registers and outreach have nobody to show — which is a different thing from having looked and found nobody.",
    href: "/console/setup/rules",
  },
};

/**
 * The steps a practice has not finished, in wizard order.
 *
 * ORDER IS THE WIZARD'S, not severity's, because the operator is going to go and do them and the
 * wizard is where they will do it. A list sorted by how badly each one hurts would send somebody to
 * step three and leave them to discover step one on arrival.
 */
export function unmetSteps(readiness: SetupReadiness): Prerequisite[] {
  if (readiness.complete) return [];
  return PREREQUISITES.filter((step) => !readiness[step]);
}

/** What this does not prove. */
export const SETUP_GAP_BOUND =
  "The notice is rendered where a page ASKS for it, so a console surface whose author did not " +
  "pass the readiness in shows nothing however unfinished the setup is. That is a deliberate " +
  "trade and it is the reason the walk in `src/demo/path.ts` names its pages rather than " +
  "deriving them: putting the notice in the shared shell would have covered every route at once, " +
  "including the wizard itself, which would then be telling a practice mid-setup that its setup " +
  "is unfinished on the very screen where they are finishing it. What the register checks is that " +
  "the pages the walk names render it; a page nobody put in the walk is not checked and not " +
  "covered, and the honest reading of a green walk is that those pages do it, not that the " +
  "console does. Nor does the copy know WHY a step is unfinished — a practice that has decided " +
  "not to participate reads the same sentence as a practice that has not got round to it, and " +
  "the " +
  "product has nowhere to record the difference.";

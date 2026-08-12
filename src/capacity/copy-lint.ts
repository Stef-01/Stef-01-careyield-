// W226: the sentences a capacity recommendation may say, and a linter that reaches all of them.
//
// W225 built the recommendation and got its own wording right. This unit exists because getting
// one module's wording right is not the same as the surface being safe — Q18 now has five modules
// emitting operator-facing strings, W229's console will add a sixth, and the sentence that ruins
// this feature will be written by whoever is closest to a deadline.
//
// THE FIVE RULES THIS MODULE OWNS. Each is a sentence a capacity surface is tempted to write and
// that nothing else in the tree forbids. The shared clinical, urgency and benefit vocabulary is
// reached through `lintMessageText` rather than copied — W150's seam, so a rule added to W6
// arrives here the same day.
//
//   NO FUTURE PROMISE. W223 wrote the distinction into its own renderer: "between four and six
//   filled" is a fact about recorded weeks; "four to six will fill" is a promise, and the
//   difference is one word. A forecast that promises has stopped carrying its uncertainty
//   however carefully the range was computed.
//
//   NO OPENING INSTRUCTION. "Open six slots on Thursday" is an instruction to a practice about
//   its own diary. The record can say what filled; deciding to open a session is the practice's,
//   and a product that instructs has taken part in a decision it will not be accountable for.
//
//   NO PATIENT-VOLUME CLAIM. Slots are not people. "Six slots" and "six patients" differ by the
//   entire distance W225 built its type to keep — and the copy is where the two get quietly
//   swapped, because on a page they read the same.
//
//   NO DEMAND CLAIM, and this is the one worth arguing for. A fill rate measures UPTAKE OF WHAT
//   WAS OFFERED. It does not measure demand, need or a backlog: a session that filled every week
//   might have turned people away and a session that never filled might have been offered at a
//   time nobody could attend. Calling uptake "demand" makes a claim about people out of a fact
//   about a diary, and it is the most natural mis-wording available here.
//
//   NO PERFORMANCE JUDGEMENT. "Under-utilised" is a verdict on a practice, not a count of its
//   slots. W15 owns whether care was worthwhile and a clinician records it; a capacity figure
//   grading a practice is the same overreach in an operational costume.
//
// AND THE REACH IS A REGISTRY, NOT A HABIT. A linter applied wherever somebody remembered covers
// whatever somebody remembered, so `CAPACITY_COPY_MODULES` is declared and the test reads
// `src/capacity/` in both directions — a module exporting operator copy without a declaration
// fails, and a declaration for a module that no longer exports any fails too. W102's census,
// W150's application, and the pattern that has caught something in this tree five times.

import { lintMessageText } from "@/messaging/templates";

export interface CapacityCopyViolation {
  rule: string;
  match: string;
}

const CAPACITY_PATTERNS: Array<{ rule: string; pattern: RegExp }> = [
  {
    rule: "no-future-promise",
    pattern:
      /\b(will|should|are going to|is going to|are likely to|is likely to) (fill|book|be filled|be booked|attend)\b|\byou (will|can expect|should expect)\b|\bexpect(ed)? to (fill|book)\b/i,
  },
  {
    rule: "no-opening-instruction",
    pattern:
      /\byou (should|must|need to|ought to|will want to) open\b|\bwe recommend\b|\b(open|add) (these|the) (extra )?slots\b|\brecommended (number of|opening)\b/i,
  },
  {
    rule: "no-patient-volume-claim",
    pattern:
      /\b\d+ (patients|people) (will|would|could) (be|get) (invited|offered|booked)\b|\bwho to invite\b|\bthese (patients|people)\b|\bslots?[^.]{0,20}\bfor (these|those) (patients|people)\b/i,
  },
  {
    rule: "no-demand-claim",
    pattern: /\b(unmet )?demand\b|\bbacklog\b|\bwaiting list\b|\bneed for appointments\b|\bpatient need\b/i,
  },
  {
    rule: "no-performance-judgement",
    pattern:
      /\bunder-?utili[sz]ed\b|\bunder-?performing\b|\bpoorly (attended|used)\b|\bwasted (slots|capacity)\b|\binefficien\w*\b|\bmissed opportunit\w*\b/i,
  },
];

export const CAPACITY_COPY_RULES: readonly string[] = CAPACITY_PATTERNS.map((p) => p.rule);

export const CAPACITY_RULE_COPY: Record<string, string> = {
  "no-future-promise":
    "This says what will happen. The record says what did happen, and a range that promises has stopped carrying the uncertainty it was built to carry.",
  "no-opening-instruction":
    "This tells a practice what to do with its own diary. The record can say what filled; opening a session is the practice's decision and the product must not take part in it.",
  "no-patient-volume-claim":
    "This turns slots into people. That is the distance W225 built a type to keep, and on a page the two read the same.",
  "no-demand-claim":
    "A fill rate measures uptake of what was offered, not demand or need. A session that filled every week may have turned people away; one that never filled may have been offered when nobody could come.",
  "no-performance-judgement":
    "This grades a practice. A capacity figure counts slots; whether the care was worthwhile is W15's question and a clinician answers it.",
};

/**
 * Lint one piece of capacity copy.
 *
 * Delegates the shared vocabulary and owns only the patterns above. Every violation is returned,
 * not the first — a caller shown one rule fixes one rule and ships the rest.
 */
export function lintCapacityCopy(text: string): CapacityCopyViolation[] {
  const violations: CapacityCopyViolation[] = [];
  for (const violation of lintMessageText(text)) violations.push(violation);
  for (const { rule, pattern } of CAPACITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) violations.push({ rule, match: match[0] });
  }
  return violations;
}

/** Throws rather than returning findings — W6's posture: a list nobody reads is not a gate. */
export function renderCompliantCapacityCopy(text: string): string {
  const violations = lintCapacityCopy(text);
  if (violations.length > 0) {
    throw new Error(
      `capacity copy failed the lint: ${violations.map((v) => `${v.rule} ("${v.match}")`).join(", ")}`,
    );
  }
  return text;
}

/**
 * The declared capacity copy sources — modules exporting `*_COPY`, which is what an operator reads.
 *
 * `copy-lint.test.ts` checks this against `src/capacity/` and fails in BOTH directions. The
 * second direction is the one that matters: a declaration outliving the copy it described reads
 * as coverage nobody has.
 *
 * REVIEWER-FACING REGISTERS ARE DELIBERATELY OUT OF SCOPE, and the first draft of this test got
 * it wrong. `REFUSED_OPENING_FIELDS` states what a recommendation may never say, so it QUOTES the
 * forbidden phrasing — "a list of who to invite" — and linting it as operator copy flagged the
 * register for naming the thing it exists to forbid. The split is W200's, between copy a
 * practice reads and prose a reviewer reads, and the test now asserts the register still contains
 * that phrase rather than that it is clean of it.
 */
export const CAPACITY_COPY_MODULES: readonly string[] = [
  "src/capacity/backtest.ts",
  "src/capacity/calendar.ts",
  "src/capacity/console.ts",
  "src/capacity/copy-lint.ts",
  "src/capacity/drift.ts",
  "src/capacity/forecast.ts",
  "src/capacity/model.ts",
  "src/capacity/opening.ts",
];

/**
 * The sentences a capacity surface says about itself, rather than about any figure.
 *
 * Here rather than in W229's page for the reason W177 gives about duplicated caveats: two
 * renderings of one caveat drift, and the drift is invisible because nobody opens both at once.
 */
export const CAPACITY_SURFACE_COPY = {
  whatThisIs:
    "What your own diary recorded: how many of the slots you opened were taken, week by week, for each clinician and each day of the week.",
  whatThisIsNot:
    "This is not a measure of how many appointments anybody needs. It counts what was taken out of what was offered, so a session that filled every week may still have turned people away, and one that never filled may have been offered at a time nobody could come.",
  itIsYourDiary:
    "Opening a session is your decision. This says what the record shows and nothing about any patient.",
  notWiredToAnything:
    "Nothing here changes what Meherr sends. These figures are read by you and are not connected to how many invitations go out.",
} as const;

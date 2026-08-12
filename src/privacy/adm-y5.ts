// W258: W201's decision register, re-derived against everything Y5 added.
//
// W201 replaced a page of prose with a register the tree checks. W221 re-derived it against Y4 and
// found the matcher missing. This does Y5 — thirty-seven new modules across the response graph, the
// capacity forecaster, the interop rail, the platform API and two verticals — and the gate's word
// is RE-DERIVED rather than re-checked, because the difference is the entire value of the exercise:
// a green suite proves the register agrees with the DETECTOR, and says nothing about whether the
// detector can still see the tree. Both times this has been re-derived, the detector was the thing
// that was wrong.
//
// WHAT Y5 DID NOT BREAK, and why that is not the boring half. Every Y5 module that tripped the
// detector was classified in the commit that added it — W253's API, W254's scopes, W255's refusal
// semantics, W235's FHIR mapping, W243's consent check, the whole capacity family. Nobody had to
// remember: the detector runs over the tree at test time and both directions are checked, so the
// register acquired thirteen Y5 entries by failing thirteen builds. That is W201's design working
// exactly as intended for a year, and it is the reason this re-derivation is about the DETECTOR's
// reach rather than about the register's contents.
//
// WHAT IT DID BREAK. The two original scans both read a module's own text — the identifiers it
// spells and the unions it exports — and **a module that holds patient identity inside an IMPORTED
// TYPE spells neither**. Four modules were invisible: `privacy/state.ts` (the suppression list,
// which is what makes "opt-out is permanent" true — a sentence this notice PUBLISHES),
// `outcomes/dashboard.ts` (which derives the referral verdict this notice discloses, so the
// register credited one module with a decision that two take), `interest/store.ts` and
// `reporting/report.ts`. Three predate Y5. That is not a mark against the re-derivation; it is the
// reason the gate says re-derive: a carried-forward "still holds" finds nothing that was already
// wrong when it was written down.
//
// AND THE FIX IS A JOIN RATHER THAN A FOURTH REGEX. W106's record classes already answer "does this
// module hold patient identity", by a reviewed human classification instead of a pattern. Reading
// it as the third scan means the two privacy registers can no longer hide something from each
// other — which is exactly what W221 said had happened between this register and W213's
// projection. The same sentence, one register over, found by the same method a year later.
//
// FOUNDER GATE (plan §4): nothing here touches a patient or a gate. It is a record of arguments
// about a published notice — no patient identifier, no outcome union, no record class — so W201's
// detector does not reach it and it is correctly absent from that register. A test asserts the
// absence rather than leaving it to be inferred, because "the register does not mention it" and
// "nobody checked" look identical from outside, which is the whole reason `NOT_A_DECISION` exists.

import {
  AUTOMATED_DECISIONS,
  DETECTOR_SCANS,
  NOTICE_REVISION,
  declaredModules,
} from "./automated-decisions";

/** The first unit of Y5. Y5 is W209–W260. Kept in step with `rail-y5.ts` by a test. */
export const Y5_FIRST_UNIT = 209;

export interface AdmRederivation {
  /** What the register claims. One of its standing properties, not one of its rows. */
  claim: string;
  /** What Y5 added that could have broken it. Named, so the re-derivation has a subject. */
  y5Surface: string;
  /** What actually happened — including "it broke", where it did. */
  finding: string;
  /** The assertion that enforces it now. A re-derivation nobody checked is a claim. */
  assertedBy: string;
  /** Whether Y5 left this claim intact, or this unit had to repair it. */
  outcome: "held" | "repaired";
}

export const ADM_REDERIVATIONS: readonly AdmRederivation[] = [
  {
    claim: "Every module that could be taking a decision about a patient is classified, one way or the other.",
    y5Surface:
      "Thirty-seven new modules: Q17's response graph and matcher, Q18's capacity family, Q19's interop rail and consent check, Q20's platform API and two verticals. Each is a fresh chance for a decision to arrive unclassified.",
    finding:
      "HELD, and without anybody remembering. Every Y5 module that trips the detector was classified in the commit that added it, because the detector runs over the tree at test time and both directions are checked — the register acquired its Y5 entries by failing thirteen builds. A hand-kept list would have covered the modules somebody remembered, which is what it did before W201.",
    assertedBy:
      "src/privacy/automated-decisions.test.ts :: classifies every one of them, exactly once, in both directions",
    outcome: "held",
  },
  {
    claim: "The detector can see every module that touches a patient.",
    y5Surface:
      "Y5 named its outcome unions in shapes the suffix scan does not match — `ScopeKind` (W209), `ExchangeState` (W244), `SessionReading` (W229), `Acknowledgement` (W239) — and moved patient identity across two new boundaries, the FHIR mapping and the platform API.",
    finding:
      "REPAIRED, and the hole was older and simpler than any of that. Both original scans read a module's OWN TEXT, so a module holding patient identity inside an imported type spells neither an identifier nor an outcome union. `src/privacy/state.ts` holds the suppression list — the thing that makes this notice's own \"opt-out is permanent\" true — four files from this register and invisible to it. So were `outcomes/dashboard.ts`, `interest/store.ts` and `reporting/report.ts`. The third scan reads W106's reviewed classification rather than a fourth pattern, so the two privacy registers cannot hide something from each other any more.",
    assertedBy:
      "src/privacy/automated-decisions.test.ts :: sees a module whose patient identity arrives through an import",
    outcome: "repaired",
  },
  {
    claim: "The register credits every module that takes a decision, not just the first one found.",
    y5Surface:
      "Nothing in Y5 — which is the point. The gap was already there and no amount of adding Y5 modules would have surfaced it.",
    finding:
      "REPAIRED. `referral-outcome-verdict` named `outcomes/model.ts` alone; `outcomes/dashboard.ts` applies that verdict to the referral rail and produces one per referral. The notice said one module decided it and two do — invisible because a `decidedBy` list is only ever checked against the detector's output, and the detector could not see the second module either.",
    assertedBy:
      "src/privacy/automated-decisions.test.ts :: sees a module whose patient identity arrives through an import",
    outcome: "repaired",
  },
  {
    claim: "\"Built, not in use\" is a fact about the tree rather than a sentence in a notice.",
    y5Surface:
      "Y5 added two dormant decisions to a published legal notice — W231's capacity coupling, behind an empty `ENABLED_COUPLINGS`, and the matcher, built and reaching no page. Both are claims that something is NOT happening to anybody.",
    finding:
      "HELD. Each dormant decision either points at a content registry the test imports and counts, or is proved unreachable from any page by W107's transitive walk. A gate opening without this notice changing fails the suite, which is the only version of that promise worth publishing.",
    assertedBy:
      "src/privacy/automated-decisions.test.ts :: checks every content registry against what it actually holds",
    outcome: "held",
  },
  {
    claim: "The never-automated list still describes the product.",
    y5Surface:
      "The headline of Y5 collided with it head-on. §6 planned Q17 as \"matching optimisation (deterministic eligibility first, learned ranking second)\", and this notice says: no ordering of patients by need or by how unwell they are. A learned ranker over patients is that sentence.",
    finding:
      "HELD, and by a decision rather than by luck. W217 was scheduled `blocked` from day one on a founder ruling the loop must not take, because shipping it would require changing a published notice rather than a config. Q17 delivered the response graph and the deterministic matcher instead, and W259 re-derived the five rail properties against them.",
    assertedBy: "src/compliance/rail-y5.test.ts :: the matcher cannot see a clinician",
    outcome: "held",
  },
  {
    claim: "Everything the notice publishes is linted by the sweep that governs patient-facing copy.",
    y5Surface:
      "Nothing in Y5 touched the page, and that is how the gap survived: a page nobody edits is a page nobody re-reads.",
    finding:
      "REPAIRED. The page was \"deliberately thin: it is layout\" and still wrote three pieces of prose itself — the heading, the standing paragraph and `Last reviewed 11 August 2026`. `pageCopy()` is assembled from the four registers, so those three were the only text on this notice no sweep ever read, and the review date stayed true-looking through every change beneath it. All three are in the register now, and the date travels with counts the suite pins.",
    assertedBy:
      "src/privacy/automated-decisions.test.ts :: fails the build when the register moves under a stated review date",
    outcome: "repaired",
  },
];

/** What the re-derivation cost, as counts rather than as an impression. */
export function rederivationSummary(): {
  claims: number;
  repaired: number;
  scans: number;
  decisions: number;
  modules: number;
} {
  return {
    claims: ADM_REDERIVATIONS.length,
    repaired: ADM_REDERIVATIONS.filter((r) => r.outcome === "repaired").length,
    scans: DETECTOR_SCANS.length,
    decisions: AUTOMATED_DECISIONS.length,
    modules: declaredModules().length,
  };
}

/** The counts the notice's own review date was taken against, for a reader comparing the two. */
export function reviewedAgainst(): typeof NOTICE_REVISION {
  return NOTICE_REVISION;
}

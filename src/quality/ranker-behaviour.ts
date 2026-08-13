// W283: the ranker's ordering read from behaviour, not from source.
//
// MATCH-1 is the finding in this tree with the highest cost of being wrong: `rankCandidates`
// orders the live invitation pool by `chronicCare`, and W201's PUBLISHED ADM notice says, in its
// *never automated* list, "No ordering of patients by need or by how unwell they are". A legal
// notice and running code disagree. It is latent only because W214's matcher is not a live path,
// and resolving it is the founder's call, not the loop's.
//
// So the one thing that must never happen is the finding going QUIET while the contradiction
// stands. Until this unit it could, and W268 said so in its own words when it anchored the
// finding:
//
//   "Reword that comparison — a helper, a destructure, a rename — and the first conjunct goes
//    false while the ranker orders on the same attribute and the published notice still denies it.
//    The finding would go quiet without the contradiction moving at all."
//
// The predicate was `/a\.chronicCare !== b\.chronicCare/.test(poolSource)`. That is not a claim
// about ordering; it is a claim about how somebody spelled a comparison in one file. Three
// ordinary refactors silence it — extracting a `clinicalWeight` helper, destructuring the
// comparands, renaming the field — and none of them changes who gets invited. The anchor W268
// added catches the day it dies, which is worth a great deal, but the fix is to stop reading
// source at all.
//
// WHAT THIS PROBE ASKS INSTEAD: does the order the ranker RETURNS depend on `chronicCare`? Rank a
// panel that is tied on every other field, flip the attribute on one patient, rank again, and see
// whether the order moved. No source is read, so no rewording can silence it: the only thing that
// can make it false is the ranker ceasing to order on the attribute, which is the event the
// finding wants to hear about.
//
// AND IT IS EXACT, WHICH IS WORTH STATING BECAUSE MOST DETECTORS IN THIS TREE ARE NOT. A ranker is
// a total order over patients with distinct ids, so `id` breaks every remaining tie. Any ranker
// that consults `chronicCare` strictly BELOW `id` therefore never consults it at all — there is no
// tie left to break — and its output genuinely does not depend on the attribute. So "the flip
// moves the order" and "the attribute affects who gets invited" are the same proposition here,
// not a proxy for one another. That is the difference between this and the regex it replaces.
//
// THE SECOND THING THE OLD PREDICATE COULD NOT SEE: it read ONE FILE. `rankGapAware` in
// `src/registers/ranking.ts` partitions on care gaps and then delegates to `rankCandidates` for
// each side, so it orders on the clinical attribute too — and a file-anchored regex would report
// nothing if the comparison moved there. A behavioural probe takes a ranker, so it can be pointed
// at any of them, and the test points it at both.
//
// FOUNDER GATE (plan §4): synthetic only. Four constructed patients with no attributes beyond the
// domain type, no generator, no fixture file, no real person.

import type { ClinicianId, Patient, PatientId, PracticeId } from "@/domain/types";

/** Any function that orders an eligible set. `rankCandidates` and `rankGapAware` are both this. */
export type Ranker = (eligible: Patient[]) => Patient[];

/** What a `false` from this probe does and does not mean, so nobody reads it as more than it is. */
export const WHAT_A_FALSE_MEANS =
  "False means the returned order does not depend on `chronicCare` for a panel tied on every " +
  "other field — which, because `id` is a total tiebreak, means it does not depend on it at all. " +
  "It does NOT mean the ranker is fair, that no other clinical attribute is read, or that the " +
  "published notice is satisfied: `chronicCare` is the one attribute MATCH-1 names.";

/** One patient, varied only by id. Every field is fixed so the panel ties on all of them. */
const TEMPLATE: Omit<Patient, "id"> = {
  practiceId: "prac-w283" as PracticeId,
  usualClinicianId: "clin-w283" as ClinicianId,
  smsConsent: true,
  optedOut: false,
  lastAttendedAt: "2025-01-01",
  futureBookingAt: null,
  activeRecall: false,
  chronicCare: false,
  holdout: false,
};

/**
 * A panel tied on every field but `id`.
 *
 * Tied on purpose: if the patients differed on anything the ranker reads, a moved order after a
 * flip could be that other field's doing and the probe would be a statement about the fixture —
 * the failure W253 named and W277 generalised.
 */
export function tiedPanel(size = 4): Patient[] {
  return Array.from({ length: size }, (_, i) => ({ ...TEMPLATE, id: `pat-w283-${i}` as PatientId }));
}

function fieldsThatDiffer(a: Patient, b: Patient): string[] {
  return (Object.keys(a) as (keyof Patient)[]).filter((k) => a[k] !== b[k]).sort();
}

/**
 * The panel really is tied, checked rather than assumed.
 *
 * Inside the probe rather than in a test, W252's rule: a guard a caller can forget to run is a
 * guard that will be forgotten, and this one decides whether the answer means anything.
 */
function requireTiedPanel(panel: readonly Patient[]): void {
  if (panel.length < 2) {
    throw new Error("W283: fewer than two patients cannot show an order, so the probe would answer over nothing");
  }
  const first = panel[0]!;
  for (const other of panel.slice(1)) {
    const differing = fieldsThatDiffer(first, other);
    if (differing.length !== 1 || differing[0] !== "id") {
      throw new Error(
        `W283: the panel is not tied — patients differ in ${differing.join(", ")}, so a moved order proves nothing about \`chronicCare\``,
      );
    }
  }
}

/**
 * The ids a ranker returns, refusing an answer from a ranker that did not return a permutation.
 *
 * Load-bearing rather than defensive. A ranker returning `[]` gives an identical empty order for
 * every flip, so it would be certified as not reading the attribute — a clean answer over nothing,
 * which is the exact shape this tree keeps finding behind a green suite.
 */
function orderOf(rank: Ranker, given: readonly Patient[]): string[] {
  const returned = rank(given.map((p) => ({ ...p })));
  const got = returned.map((p) => String(p.id)).sort();
  const want = given.map((p) => String(p.id)).sort();
  if (got.join("|") !== want.join("|")) {
    throw new Error(
      "W283: the ranker did not return a permutation of its input, so nothing can be concluded from its order",
    );
  }
  return returned.map((p) => String(p.id));
}

/**
 * Does this ranker's output depend on `chronicCare`? The behavioural form of MATCH-1's first half.
 *
 * One patient is flipped at a time rather than the whole panel at once. A whole-panel complement
 * can be silenced by a ranker that happens to be symmetric under it; a single flip cannot, and
 * asking it of every patient in turn means a ranker must be blind to the attribute for ALL of them
 * to come back false.
 */
export function observesClinicalAttribute(rank: Ranker, panel: readonly Patient[] = tiedPanel()): boolean {
  requireTiedPanel(panel);
  const baseline = orderOf(rank, panel).join("|");
  return panel.some((_, i) => {
    const flipped = panel.map((p, j) => (j === i ? { ...p, chronicCare: !p.chronicCare } : { ...p }));
    return orderOf(rank, flipped).join("|") !== baseline;
  });
}

/**
 * Does the clinical attribute OUTRANK every other key — chronic first even when it should be last?
 *
 * The stronger claim, and the one W216's dossier makes in words: not merely that the attribute is
 * read, but that it decides. The chronic patient is given the worse value of every other ordering
 * key the live ranker uses, so if it still comes first, nothing but `chronicCare` put it there.
 */
export function clinicalAttributeOutranksEveryOtherKey(rank: Ranker): boolean {
  const chronic: Patient = {
    ...TEMPLATE,
    id: "pat-w283-z" as PatientId, // loses the id tiebreak
    chronicCare: true,
    lastAttendedAt: "2026-06-01", // recent: loses the overdue key too
  };
  const plain: Patient = {
    ...TEMPLATE,
    id: "pat-w283-a" as PatientId,
    chronicCare: false,
    lastAttendedAt: "2019-01-01",
  };
  if (!(plain.id < chronic.id) || !(plain.lastAttendedAt! < chronic.lastAttendedAt!)) {
    throw new Error("W283: the fixture does not disadvantage the chronic patient, so coming first would prove nothing");
  }
  // Both input orders. A ranker that returns its input untouched would otherwise be reported as
  // ordering on the attribute purely because the fixture handed it the chronic patient first —
  // W280's lesson, one register over.
  return (
    orderOf(rank, [chronic, plain])[0] === String(chronic.id) &&
    orderOf(rank, [plain, chronic])[0] === String(chronic.id)
  );
}

/**
 * A ranker that orders on the clinical attribute, SPELLED DIFFERENTLY from the live one.
 *
 * This is the unit's argument made executable: it contains no `a.chronicCare !== b.chronicCare`,
 * so the predicate W283 replaced reports it as not ordering on the attribute, and it demonstrably
 * does. The test asserts both halves of that sentence.
 */
export const REFERENCE_CLINICAL_RANKER: Ranker = (eligible) => {
  const clinicalWeight = ({ chronicCare }: Patient): number => (chronicCare ? 0 : 1);
  return [...eligible].sort((a, b) => clinicalWeight(a) - clinicalWeight(b) || (a.id < b.id ? -1 : 1));
};

/** A ranker that cannot read the attribute at all — the other direction the probe must get right. */
export const REFERENCE_BLIND_RANKER: Ranker = (eligible) =>
  [...eligible].sort((a, b) => (a.id < b.id ? -1 : 1));

/**
 * Can the probe still tell the two apart? MATCH-1's anchor, in W268's sense.
 *
 * An anchor asks whether a predicate is still ABLE to observe its condition. For a behavioural
 * probe that is not a claim about source but about the probe itself: point it at a ranker known to
 * order on the attribute and at one known not to, and require different answers. A degenerate
 * fixture, a broken flip or a guard that started throwing all fail here, and `deadAnchors()` names
 * MATCH-1 on the firing that breaks it rather than a quarter later.
 */
export function probeDiscriminates(): boolean {
  return observesClinicalAttribute(REFERENCE_CLINICAL_RANKER) && !observesClinicalAttribute(REFERENCE_BLIND_RANKER);
}

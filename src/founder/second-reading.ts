// W322: what has changed since the founder last read this page.
//
// W310'S PAGE ANSWERS "WHAT IS WAITING" AND NOT "WHAT IS NEW", and for the reader it is built for
// that is the harder half. Somebody who looked a month ago comes back to the same eighteen blocked
// rows and the same five gates and has no way to tell whether anything moved — the page is honest
// and static, which is exactly how a status page stops being read.
//
// NOTHING IS STORED, AND THAT IS THE DESIGN RATHER THAN A LIMITATION. A stored snapshot of the page
// is a second copy of the ledger that can disagree with it, which is the class this tree spends
// most of its registers on. A reading is a single unit id — the last one the reader saw — and
// everything else is DERIVED from the ledger at render time. Two readers with different markers get
// different answers off the same document, and there is nothing to migrate, reconcile or back up.
//
// A FIRST VISIT IS NOT AN EMPTY DIFF. With no marker there is nothing to compare against, and
// rendering an empty list would say "nothing has changed" to somebody who has never looked — the
// could_not_load-versus-empty distinction W279 spent a unit on, arriving on a different page. The
// two states carry different sentences and the type refuses to conflate them.
//
// WHAT THIS DOES NOT PROVE is `SECOND_READING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the build ledger.

import { allLedgerRows, blockersIn, type LedgerRow } from "@/quality/blocked-surface";

/** The marker a reader carries: the last unit they saw, or nothing at all. */
export type Reading = { lastUnit: string } | null;

/** A row that moved, with the blocker it names when it has one. */
export interface Movement {
  id: string;
  /** The blocker the row names, for a row that is waiting on a ruling. */
  blocker: string | null;
}

export type SecondReading =
  /**
   * No marker. The page says so instead of rendering an empty diff, because a reader who has never
   * looked and a reader for whom nothing moved need opposite sentences.
   */
  | { kind: "first_reading" }
  /** A marker naming a unit this ledger does not have — a link from somewhere the ledger has moved past. */
  | { kind: "unknown_unit"; lastUnit: string }
  | {
      kind: "since";
      lastUnit: string;
      /** Week-units that reached `done` after the marker. */
      built: Movement[];
      /** Rows that became blocked after the marker — the surface growing. */
      blocked: Movement[];
      /** True when the ledger has moved and none of it is visible on this page. */
      quiet: boolean;
    };

const unitNumber = (id: string): number | null => (/^W\d+$/.test(id) ? Number(id.slice(1)) : null);

/**
 * Everything the ledger says has happened since the reader's marker.
 *
 * ORDERING IS BY UNIT NUMBER, NOT BY TIMESTAMP. A row's `at` column is the moment it was CLAIMED,
 * and two sessions building in parallel close out of order — W305 landed between W309's verify and
 * its push. The unit number is the ledger's own sequence and the only one that does not depend on
 * which session finished first.
 */
export function sinceReading(root: string, reading: Reading): SecondReading {
  if (reading === null) return { kind: "first_reading" };
  const rows = allLedgerRows(root);
  const marker = unitNumber(reading.lastUnit);
  if (marker === null || !rows.some((r) => r.id === reading.lastUnit)) {
    return { kind: "unknown_unit", lastUnit: reading.lastUnit };
  }
  const after = (r: LedgerRow) => {
    const n = unitNumber(r.id);
    return n !== null && n > marker;
  };
  const movement = (r: LedgerRow): Movement => ({ id: r.id, blocker: blockersIn(r.note)[0] ?? null });
  const built = rows.filter((r) => r.status === "done" && after(r)).map(movement);
  const blocked = rows.filter((r) => r.status === "blocked" && after(r)).map(movement);
  return {
    kind: "since",
    lastUnit: reading.lastUnit,
    built,
    blocked,
    quiet: built.length === 0 && blocked.length === 0,
  };
}

/** The four sentences, one per state, because three of them would be the empty-diff mistake again. */
export const SECOND_READING_COPY = {
  heading: "Since you last looked",
  firstReading:
    "This is the first reading on this link, so there is nothing to compare against yet. What follows is the whole picture rather than the change.",
  unknownUnit:
    "The link names a unit this ledger does not have. Rather than show a change measured from nothing, the page says so — the whole picture is below.",
  quiet:
    "Nothing has reached this page since that unit. The build has been elsewhere, which is a different statement from nothing having happened.",
  builtHeading: "Built since",
  blockedHeading: "Started waiting since",
} as const;

/** What this does not prove. */
export const SECOND_READING_BOUND =
  "The comparison is a unit NUMBER against the ledger, so what it reports is what the ledger says " +
  "moved — not what a reader would call a change. A row rewritten in place moves nothing here: a " +
  "blocked row whose blocker was swapped for a different gate, or a done row whose note was " +
  "corrected, both read as unchanged, because the marker records where the reader stopped and not " +
  "what they saw. Making that visible needs a record of the rendered page, which is the stored " +
  "snapshot this deliberately does not keep. And a reader whose marker is older than the oldest " +
  "week-unit gets everything, correctly, with no way to tell that from a genuinely busy quarter.";

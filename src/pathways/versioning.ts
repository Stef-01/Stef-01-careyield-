// W118: a pathway as versioned data.
//
// A pathway says which patients a scope of care covers, which it excludes, and what should be
// escalated. It is clinical content, so under G5 nothing here ships with any: this unit builds
// the MECHANISM and pins the catalogue empty, the pattern W55/W56/W60/W68 established. Loading
// real pathways is a data change made after the ruling, not a code change made before it.
//
// The unit's claim is that a published version is immutable, that editing produces a new
// version, and that any version can be replayed. All three are one design decision: **versions
// are not stored, they are DERIVED from an append-only event log** (the W10 spine, the same
// reasoning W93 used for referrals). That matters more here than anywhere else in the tree,
// because of what a pathway is for. If a clinician acted under version 3 in March, the
// question an audit asks in September is "what did version 3 say" — and a mutable row can only
// ever answer what it says now. A store that lets you edit history cannot be trusted to
// reconstruct a clinical decision, and reconstructing clinical decisions is the entire reason
// this content is versioned rather than simply edited.
//
// So immutability is not a rule this module enforces. It is a property of the representation:
//
//   * THERE IS NO MUTATION FUNCTION. Nothing here takes a version and returns a changed one.
//     You cannot call what does not exist, and a test asserts the export list (W80/W94/W111).
//   * A VERSION'S IDENTITY IS ITS CONTENT. `versionHash` is computed from the criteria, so an
//     "edit" is a different hash and therefore a different version, in the same way W67 keyed
//     template approval to content rather than to a version counter that can be forgotten.
//   * EVENTS THAT CANNOT APPLY ARE REJECTED WITH A REASON, never skipped. A replay that
//     discards input is not a replay (W93).
//
// The criteria themselves are carried OPAQUELY. This module hashes and versions them and never
// looks inside: evaluating criteria is W120, and escalation semantics are W121. Keeping the
// container ignorant of the content is what lets the content stay gated while the machinery
// ships.
//
// Withdrawal of a published version is W128 and deliberately absent here.

import { createHash } from "node:crypto";

/**
 * One criterion, expressed against a fact the record ALREADY HOLDS.
 *
 * `factCode` is opaque — a PMS condition flag, a practice confirmation, a recorded result
 * category. It is never a symptom expression, because deriving a pathway from symptoms is the
 * G7 boundary; W120 enforces that at evaluation, and the shape here gives it nowhere to hide:
 * there is no free-text expression field and no threshold to compute against.
 */
export interface PathwayCriterion {
  factCode: string;
  requires: "present" | "absent";
  /** Why this criterion is here. A criterion nobody can explain is one nobody can review. */
  rationale: string;
}

export interface PathwayCriteria {
  inclusion: readonly PathwayCriterion[];
  exclusion: readonly PathwayCriterion[];
  escalation: readonly PathwayCriterion[];
}

export type PathwayEventKind = "version_drafted" | "version_published";

export interface PathwayEvent {
  pathwayId: string;
  kind: PathwayEventKind;
  /** The version this event concerns, identified by its content hash. */
  versionHash: string;
  at: string;
  byEmail: string;
  /** Carried on `version_drafted` only — the content the hash is of. */
  criteria?: PathwayCriteria;
}

/** `published` is in force; `superseded` was in force and has been replaced. */
export type PathwayVersionState = "draft" | "published" | "superseded";

export interface PathwayVersion {
  pathwayId: string;
  versionHash: string;
  /** 1-based, in draft order. A label for humans — identity is the hash. */
  ordinal: number;
  criteria: PathwayCriteria;
  state: PathwayVersionState;
  draftedAt: string;
  draftedBy: string;
  publishedAt: string | null;
  publishedBy: string | null;
  /** When a later version took over. Null while in force or still a draft. */
  supersededAt: string | null;
}

export type PathwayRejection =
  | "unknown_version" // published without ever being drafted
  | "duplicate_draft" // this exact content is already a version
  | "already_published" // a version is published once
  | "hash_mismatch" // the event's hash is not the hash of its criteria
  | "missing_criteria"; // a draft with nothing in it

export interface PathwayHistory {
  pathwayId: string;
  /** Every version, in draft order. */
  versions: PathwayVersion[];
  applied: PathwayEvent[];
  rejected: Array<{ event: PathwayEvent; reason: PathwayRejection }>;
}

/**
 * The content hash.
 *
 * Criteria are serialised in the order they were authored rather than sorted. Reordering
 * inclusion criteria does not change what a pathway means, so this produces a new version for
 * a change that arguably is not one — which is the conservative direction. Treating two
 * differently-ordered documents as the same version would mean an audit could be shown a
 * document that is not byte-for-byte what the author approved.
 */
export function versionHash(criteria: PathwayCriteria): string {
  const canonical = JSON.stringify({
    inclusion: criteria.inclusion.map(canonicalCriterion),
    exclusion: criteria.exclusion.map(canonicalCriterion),
    escalation: criteria.escalation.map(canonicalCriterion),
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

function canonicalCriterion(c: PathwayCriterion): [string, string, string] {
  // A tuple, not an object: key order in a literal is not something to depend on for a hash
  // that has to be stable across refactors.
  return [c.factCode, c.requires, c.rationale];
}

function isEmpty(criteria: PathwayCriteria): boolean {
  return (
    criteria.inclusion.length === 0 &&
    criteria.exclusion.length === 0 &&
    criteria.escalation.length === 0
  );
}

/**
 * Replay one pathway's events into its version history.
 *
 * Events are applied in recorded order after a stable sort by time. Publishing a version
 * supersedes whichever version was in force, so at most one is published at any instant —
 * asserted by `pathwayAt`, which is the function an audit actually calls.
 */
export function replayPathway(
  events: readonly PathwayEvent[],
  pathwayId: string,
): PathwayHistory {
  const mine = events
    .filter((e) => e.pathwayId === pathwayId)
    .slice()
    .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));

  const versions: PathwayVersion[] = [];
  const byHash = new Map<string, PathwayVersion>();
  const applied: PathwayEvent[] = [];
  const rejected: PathwayHistory["rejected"] = [];
  let inForce: PathwayVersion | null = null;

  for (const event of mine) {
    const reject = (reason: PathwayRejection) => rejected.push({ event, reason });

    if (event.kind === "version_drafted") {
      if (!event.criteria || isEmpty(event.criteria)) {
        reject("missing_criteria");
        continue;
      }
      // The hash is recomputed, never trusted: an event whose hash does not describe its own
      // criteria would let a version be published under an identity it does not have.
      if (versionHash(event.criteria) !== event.versionHash) {
        reject("hash_mismatch");
        continue;
      }
      if (byHash.has(event.versionHash)) {
        // Identical content is the SAME version. Re-drafting it is not a new one, which is
        // the point of hashing the content rather than counting edits.
        reject("duplicate_draft");
        continue;
      }

      const version: PathwayVersion = {
        pathwayId,
        versionHash: event.versionHash,
        ordinal: versions.length + 1,
        criteria: event.criteria,
        state: "draft",
        draftedAt: event.at,
        draftedBy: event.byEmail,
        publishedAt: null,
        publishedBy: null,
        supersededAt: null,
      };
      versions.push(version);
      byHash.set(version.versionHash, version);
      applied.push(event);
      continue;
    }

    const target = byHash.get(event.versionHash);
    if (!target) {
      reject("unknown_version");
      continue;
    }
    if (target.state !== "draft") {
      reject("already_published");
      continue;
    }

    if (inForce) {
      inForce.state = "superseded";
      inForce.supersededAt = event.at;
    }
    target.state = "published";
    target.publishedAt = event.at;
    target.publishedBy = event.byEmail;
    inForce = target;
    applied.push(event);
  }

  return { pathwayId, versions, applied, rejected };
}

/**
 * The version in force at an instant — the question an audit asks.
 *
 * Null when nothing was published yet, which is a real answer and not an error: "no pathway
 * was in force" is exactly what should be reported for a decision made before one existed.
 */
export function pathwayAt(
  events: readonly PathwayEvent[],
  pathwayId: string,
  atIso: string,
): PathwayVersion | null {
  // Asked of the replay's own state rather than recomputed from publication dates. The first
  // version of this picked "the one published most recently at or before `atIso`" and then
  // discarded it if it had been superseded by then — which returned NULL for two versions
  // published at the same instant, when the second is plainly in force. A mutation check
  // found it: removing the supersession guard changed no test, because the guard was
  // compensating for the wrong selection rather than expressing the rule.
  //
  // The rule is one line: a version is in force at an instant if it was published by then and
  // not yet superseded. It is also exactly the invariant the tests assert, so the two can no
  // longer drift.
  const inForce = replayPathway(events, pathwayId).versions.filter(
    (v) =>
      v.publishedAt !== null &&
      v.publishedAt <= atIso &&
      (v.supersededAt === null || v.supersededAt > atIso),
  );
  // Replay guarantees at most one; taking the last is a belt-and-braces tie-break rather than
  // a claim that more than one is possible.
  return inForce[inForce.length - 1] ?? null;
}

/** The version in force now, if any. */
export function currentPathway(
  events: readonly PathwayEvent[],
  pathwayId: string,
): PathwayVersion | null {
  return replayPathway(events, pathwayId).versions.find((v) => v.state === "published") ?? null;
}

/**
 * The shipped catalogue. **EMPTY pending the G5 ruling** — a test pins this, so clinical
 * content cannot arrive by the back door. See the module note.
 */
export const SHIPPED_PATHWAYS: readonly PathwayEvent[] = [];

export const PATHWAY_REJECTION_COPY: Record<PathwayRejection, string> = {
  unknown_version: "That version was never drafted, so there is nothing to publish.",
  duplicate_draft: "This is the same content as an existing version, so it is that version.",
  already_published: "That version has already been published. Draft a new one instead.",
  hash_mismatch: "The version identifier does not match its content, so it was not applied.",
  missing_criteria: "A pathway version with no criteria at all was not recorded.",
};

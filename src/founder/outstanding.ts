// W310: what is waiting on the founder, derived rather than written.
//
// THE LOOP HAS PROPOSED A GATE ROUGHLY ONCE A YEAR FOR THREE YEARS AND NONE HAS BEEN RULED ON.
// `GATE-DOSSIER-Y5.md` said it plainly and W263 built the budget that stops the blocked surface
// growing quietly. Both are addressed to a builder. Neither is addressed to the person who can
// actually answer, and there has never been anywhere for that person to look — the facts are
// spread across §4 of the plan, eighteen rows of a ledger, and a release register in `src/quality`.
//
// SO THIS DERIVES THE PAGE INSTEAD OF SOMEBODY WRITING IT. A written status page is a page that
// goes stale on the next firing and nobody notices, which is the failure this quarter keeps
// finding — three module headers this session alone stated numbers the code disagreed with. Every
// figure here is read at render time from `BUILD-STATE.md` and `FIVE-YEAR-PLAN.md`. There is no
// list of gates in this file. There is no count of blocked units in this file.
//
// WHAT "HOW LONG IT HAS WAITED" MEANS, BECAUSE THE OBVIOUS ANSWER IS THE WRONG ONE. Calendar days
// are close to meaningless here: this tree builds a simulated year of units in a day, so G8 in
// calendar terms has waited a week and in the terms that matter has waited more than two hundred
// units. Both are reported, and the unit distance is the one the page leads with — a gate proposed
// at W104 and unanswered at W310 has had two hundred and six chances to be answered.
//
// THE PROPOSING UNIT IS READ OUT OF §4 ITSELF. `G8 — PROPOSED at W104` names its own origin, so
// the wait is derived from the ledger row for W104 rather than from a date somebody typed twice. A
// gate §4 does not mark PROPOSED is a STANDING gate — one the plan was written with — and its wait
// runs from W1, which is the honest reading: it has been outstanding since there was a plan.
//
// WHAT THIS DOES NOT DO IS DECIDE ANYTHING, and the page says so where a reader will see it. Every
// release path names whose ruling it is and none of them names a builder — W263's rule, rendered.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the plan and the ledger. No practice, no
// patient and no clinical content appears anywhere in it, which `founderCopy` is linted for.

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  allLedgerRows,
  RELEASE_PATHS,
  type ReleasePath,
  blockersIn,
  type LedgerRow,
} from "@/quality/blocked-surface";

/** A gate as §4 of the plan defines it. */
export interface Gate {
  id: string;
  /** The sentence §4 gives it, with the leading `— ` removed. */
  text: string;
  /** `cleared` is struck through in §4; `proposed` names the unit that proposed it. */
  status: "cleared" | "proposed" | "standing";
  /** The unit §4 says proposed it, for a `proposed` gate. */
  proposedAt: string | null;
}

const GATE_LINE = /^- \*\*(G\d+)\*\* — (.*)$/;

/** Every gate §4 defines, in the order §4 gives them. */
export function parseGates(plan: string): Gate[] {
  const section = plan.split("\n## 5.")[0] ?? plan;
  return section.split("\n").flatMap((line) => {
    const m = GATE_LINE.exec(line.trim());
    if (!m) return [];
    const text = m[2]!;
    const proposed = /PROPOSED at (W\d+)/.exec(text);
    return [
      {
        id: m[1]!,
        text,
        status: text.includes("CLEARED") ? ("cleared" as const) : proposed ? ("proposed" as const) : ("standing" as const),
        proposedAt: proposed ? proposed[1]! : null,
      },
    ];
  });
}

/** How long a ruling has been outstanding, in the two units that mean anything here. */
export interface Waited {
  /** The unit it has waited since — the proposing unit, or W1 for a standing gate. */
  sinceUnit: string;
  /** That unit's ledger timestamp, as the ledger writes it. */
  sinceAt: string;
  /** Units built since. The figure the page leads with. */
  unitsSince: number;
  /** Whether the wait runs from a proposal or from the plan itself. */
  kind: "proposed" | "standing";
}

/**
 * Week-units BUILT since a given one.
 *
 * COUNTED, NOT SUBTRACTED, and the first draft got this wrong. Taking the highest id in the ledger
 * and subtracting measured against W312 — a unit nobody has built, sitting in the ledger because
 * the quarter is planned ahead. That reported a wait longer than the build. What a founder is owed
 * is the number of firings that have happened and not answered this, so `done` rows are counted.
 */
function doneSince(rows: readonly LedgerRow[], origin: string): number {
  const from = Number(origin.slice(1));
  return rows.filter((r) => {
    if (r.status !== "done" || !/^W\d+$/.test(r.id)) return false;
    return Number(r.id.slice(1)) > from;
  }).length;
}

/**
 * How long a ruling has waited.
 *
 * `origin` IS PASSED RATHER THAN DEFAULTED TO W1, and Q24's review is why. The first draft took
 * `gate?.proposedAt ?? "W1"`, which is right for a standing GATE and wrong for a founder DECISION:
 * `Q9 action 1` and `Q17 action 1` are not §4 gates, so they fell to the null branch and rendered
 * as *outstanding since the plan was written* — sorting above three gates that really have waited
 * longer, and telling the reader a decision raised at W217 had been open since W1.
 */
export function waitedFor(gate: Gate | null, rows: readonly LedgerRow[], origin = gate?.proposedAt ?? "W1"): Waited {
  const row = rows.find((r) => r.id === origin);
  return {
    sinceUnit: origin,
    sinceAt: row?.at ?? "",
    unitsSince: doneSince(rows, origin),
    kind: origin === "W1" ? "standing" : "proposed",
  };
}

/**
 * Where a blocker's wait starts.
 *
 * A gate says so in §4. A DECISION says nothing anywhere, so it is taken from the earliest unit it
 * blocks — the unit that reached the boundary and had to schedule itself blocked, which is the
 * moment the question became outstanding. Derived from the release path rather than typed.
 */
function originOf(gate: Gate | null, releases: readonly string[], rows: readonly LedgerRow[]): string {
  if (gate?.proposedAt) return gate.proposedAt;
  if (gate) return "W1";
  const weeks = releases.filter((id) => /^W\d+$/.test(id)).map((id) => Number(id.slice(1)));
  if (weeks.length === 0) return "W1";
  // The blocked unit itself carries no date — a row nobody built has no timestamp — so the wait
  // runs from the last unit BUILT before it, which is when the quarter reached that boundary and
  // somebody had to schedule the row blocked. A lower bound on the wait, and a real date.
  const reached = Math.min(...weeks);
  const before = rows
    .filter((r) => r.status === "done" && /^W\d+$/.test(r.id) && Number(r.id.slice(1)) < reached)
    .map((r) => Number(r.id.slice(1)));
  return before.length > 0 ? `W${Math.max(...before)}` : "W1";
}

/** One outstanding ruling, with everything a reader needs to answer it. */
export interface Outstanding {
  blocker: string;
  kind: ReleasePath["kind"];
  whoDecides: string;
  /** §4's sentence, or null for a decision §4 does not define as a gate. */
  gateText: string | null;
  releases: Array<{ id: string; note: string }>;
  waited: Waited;
}

/** Everything waiting on a ruling, worst wait first. */
export function outstandingRulings(root: string, paths: readonly ReleasePath[] = RELEASE_PATHS): Outstanding[] {
  const rows = allLedgerRows(root);
  const gates = parseGates(readFileSync(path.join(root, "docs/FIVE-YEAR-PLAN.md"), "utf8"));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return paths
    .map((p) => {
      const gate = gates.find((g) => g.id === p.blocker) ?? null;
      return {
        blocker: p.blocker,
        kind: p.kind,
        whoDecides: p.whoDecides,
        gateText: gate?.text ?? null,
        releases: p.releases.map((id) => ({ id, note: byId.get(id)?.note ?? "" })),
        waited: waitedFor(gate, rows, originOf(gate, p.releases, rows)),
      };
    })
    .sort((a, b) => b.waited.unitsSince - a.waited.unitsSince || a.blocker.localeCompare(b.blocker));
}

/** What exists, as the ledger reports it — no figure in this file, all of it read. */
export interface Built {
  done: number;
  blocked: number;
  latestUnit: string;
  latestAt: string;
}

export function builtSurface(root: string): Built {
  const rows = allLedgerRows(root);
  const done = rows.filter((r) => r.status === "done");
  // `weeks[0]!` was a non-null assertion over a possibly empty array: a root with no done week-unit
  // returned `undefined` and the page threw on `last.id` rather than rendering an empty state.
  const weeks = done.filter((r) => /^W\d+$/.test(r.id));
  const last = weeks.reduce<LedgerRow | null>(
    (best, r) => (best === null || Number(r.id.slice(1)) > Number(best.id.slice(1)) ? r : best),
    null,
  );
  return {
    done: done.length,
    blocked: rows.filter((r) => r.status === "blocked").length,
    latestUnit: last?.id ?? "none",
    latestAt: last?.at ?? "",
  };
}

export interface FounderDiff {
  /** A blocker the page would render with no sentence from §4 behind it. */
  undescribed: string[];
  /** A gate §4 marks CLEARED that still holds blocked rows — the page claiming a wait that ended. */
  clearedButBlocking: string[];
  /** A blocked row whose blocker no release path names, so the page would not show it at all. */
  unrendered: string[];
}

/**
 * The page against the two documents it renders, in every direction it can be wrong.
 *
 * W263 ALREADY CHECKS PATHS AGAINST THE LEDGER and this does not repeat it. What it adds is the
 * three ways a RENDERED page goes wrong that a register cannot: a blocker with no sentence to show,
 * a gate whose answer has already arrived while rows still wait on it, and — the one that matters —
 * a blocked row no release path names, which this page would silently omit. A founder reading a
 * page that is missing a row cannot know it is missing.
 */
export function founderDiff(root: string, paths: readonly ReleasePath[] = RELEASE_PATHS): FounderDiff {
  const rows = allLedgerRows(root);
  const gates = parseGates(readFileSync(path.join(root, "docs/FIVE-YEAR-PLAN.md"), "utf8"));
  const gateById = new Map(gates.map((g) => [g.id, g]));
  const named = new Set(paths.map((p) => p.blocker));
  const blockedBy = new Map<string, string[]>();
  for (const row of rows.filter((r) => r.status === "blocked")) {
    for (const blocker of blockersIn(row.note)) {
      blockedBy.set(blocker, [...(blockedBy.get(blocker) ?? []), row.id]);
    }
  }
  return {
    undescribed: paths
      .filter((p) => p.kind === "founder_gate" && !gateById.has(p.blocker))
      .map((p) => p.blocker)
      .sort(),
    clearedButBlocking: [...blockedBy.keys()]
      .filter((b) => gateById.get(b)?.status === "cleared")
      .sort(),
    // DEDUPED, because a row may name more than one blocker — W202 is blocked on G9 and G1 both,
    // and a page omits a ROW once however many rulings it waits on.
    unrendered: [
      ...new Set(
        [...blockedBy.entries()].filter(([blocker]) => !named.has(blocker)).flatMap(([, ids]) => ids),
      ),
    ].sort(),
  };
}

/**
 * Every sentence the page writes for itself, so the copy linters have something to read.
 *
 * The rest of the page is quotation — §4's sentences and the ledger's notes, rendered as they are
 * written. These are the words this unit ADDS, and they are the ones that could make a claim.
 */
export const FOUNDER_COPY = {
  title: "What is waiting on you",
  intro:
    "Every figure on this page is read from the build ledger and section 4 of the plan when the page loads. Nothing here is typed by hand, so nothing here can go stale without the check failing.",
  builtHeading: "What exists",
  blockedHeading: "What is waiting",
  releasesHeading: "What this ruling releases",
  noDecider:
    "The build loop does not answer any of these. Each one names who decides, and none of them names a builder.",
  waitStanding: "Outstanding since the plan was written.",
  waitProposed: "Proposed by the unit named, and unanswered since.",
  noClinical:
    "This page describes build status. It holds no practice data, no patient data, and nothing about anyone's care.",
} as const;

/** What a green page does not prove. */
export const FOUNDER_BOUND =
  "This renders what the ledger and the plan SAY, which is not the same as what is true. A unit " +
  "blocked on a gate it need not be blocked on renders here exactly like a unit that must be, so " +
  "nothing checks that a blocker is the right blocker — `founderDiff` reports a row no path names " +
  "and a gate already cleared, and neither is a judgement about whether the block is warranted. " +
  "Nor does the wait figure mean elapsed effort: units built since a proposal is a count of " +
  "firings, and a quarter that built nothing near a gate moves it exactly as much as a quarter " +
  "that built around it constantly. What it is good for is the direction: the figure rises until " +
  "somebody rules, and nothing else moves it.";

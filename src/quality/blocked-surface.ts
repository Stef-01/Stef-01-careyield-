// W263: the blocked surface — how big it is, and what would release each part of it.
//
// W260's horizon rule has a clause this unit exists to make real: *an expansion may not grow the
// blocked surface without saying so — a new blocked row must name the ruling that would release it
// and the units released with it.* A clause in a plan is a promise. This is the check.
//
// WHY THE SURFACE NEEDS A BUDGET AT ALL. Sixteen rows are blocked, and every one of them was added
// by a firing that was doing its job: a unit reached a boundary no existing gate covered, or needed
// content behind G5, and the honest move was to schedule it blocked rather than half-build it.
// Nothing in that is wrong. What is wrong is that the count can only go up, quietly, one correct
// decision at a time — and the number nobody is watching is the one that says how much of this
// product is waiting on somebody who has not been asked. `GATE-DOSSIER-Y5.md` put it plainly:
// the loop has proposed a gate roughly once a year for three years and none has been ruled on;
// **the mechanism is working, the answering is not.** A budget makes the growth visible on the
// firing that causes it instead of at the next year-close.
//
// WHAT A RELEASE PATH IS, AND WHY IT IS PINNED RATHER THAN DERIVED. Grouping blocked rows by the
// gate they name is one line of code, and a purely derived grouping would absorb a new blocked row
// silently and report nothing — which is the failure the horizon rule is about. So the release set
// is DECLARED and checked against the ledger in both directions: a row blocked on G5 that the G5
// path does not list fails, and a path listing a unit the ledger does not block fails. Adding a
// blocked row is then a deliberate act that makes somebody write down what a ruling buys.
//
// AND IT FOUND A ROW NOTHING WAS CHECKING. W208's `plan-ledger.test.ts` verifies that every gate a
// blocked row names is defined in §4 — by iterating `FOUNDER GATE (G\d+)` matches in the row. W217
// is blocked on the Q17 learned-ranking DECISION, which is not a gate and names no such token, so
// that loop body never runs for it and its blocker was checked by nothing. It is the one blocked
// row in the tree whose answer could require changing a published legal notice rather than a
// config, which makes it the last one that should have been invisible. `Blocker` here is a union
// of gate and decision for that reason.
//
// THE LOOP MAY ANSWER NONE OF THEM, and every release path says whose the ruling is. That is
// W260's clause 3 as data rather than prose: the horizon has to restate at every expansion how
// many of the outstanding decisions the loop may take, and the answer has been zero for five
// years. A path that named a builder as the decider would be the loop deciding it may proceed.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the ledger and counts rows.

import { readFileSync } from "node:fs";
import path from "node:path";

const LEDGER_ROW = /^\| (W\d+) \| ([\w-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|\s*$/;

export interface LedgerRow {
  id: string;
  status: string;
  note: string;
}

export function ledgerRows(root: string): LedgerRow[] {
  return readFileSync(path.join(root, "BUILD-STATE.md"), "utf8")
    .split("\n")
    .flatMap((line) => {
      const m = LEDGER_ROW.exec(line);
      return m ? [{ id: m[1]!, status: m[2]!, note: m[6]! }] : [];
    });
}

export function blockedRows(root: string): LedgerRow[] {
  return ledgerRows(root).filter((r) => r.status === "blocked");
}

/**
 * The blockers a row names, as the ledger spells them.
 *
 * Two kinds, and the second is the one nothing was checking: a founder GATE is `FOUNDER GATE Gn`,
 * and a founder DECISION is a named question with no gate behind it. W217 is the only one today
 * and it is the one whose answer could require changing a published notice.
 */
export function blockersIn(note: string): string[] {
  const gates = [...note.matchAll(/FOUNDER GATE (G\d+)/g)].map((m) => m[1]!);
  const decisions = [...note.matchAll(/FOUNDER DECISION — (Q\d+ action \d+)/g)].map((m) => m[1]!);
  return [...new Set([...gates, ...decisions])].sort();
}

export interface ReleasePath {
  /** The blocker exactly as a blocked row names it. */
  blocker: string;
  kind: "founder_gate" | "founder_decision";
  /** Whose ruling it is. Never a builder — see the module note. */
  whoDecides: string;
  /** The units this ruling releases. Checked against the ledger in both directions. */
  releases: readonly string[];
}

/**
 * The budget: how many rows the blocked surface holds.
 *
 * Pinned rather than derived, because the whole point is that growth is visible on the firing that
 * causes it. A new blocked row fails here until somebody moves this number, and moving it means
 * having written its release path.
 */
export const BLOCKED_AT_W263 = 16;

export const RELEASE_PATHS: readonly ReleasePath[] = [
  {
    blocker: "G3",
    kind: "founder_gate",
    whoDecides: "The founder, on whether live SMS may go to a real patient. Double-blocked: G1 and G2 sit under it, so ratifying G3 alone sends nothing.",
    releases: ["W174"],
  },
  {
    blocker: "G5",
    kind: "founder_gate",
    whoDecides: "The founder, on clinical pathway content Meherr publishes. The largest single blocker for three years, and it has grown — Y5's two vertical-content units joined it when W248 and W250 built the assembly and left the content where it belongs.",
    releases: ["W161", "W162", "W163", "W186", "W249", "W251"],
  },
  {
    blocker: "G6",
    kind: "founder_gate",
    whoDecides: "The founder, on launching the public directory, via the Ahpra review ask recorded in the Q9 dossier.",
    releases: ["W133", "W185"],
  },
  {
    blocker: "G8",
    kind: "founder_gate",
    whoDecides: "The founder. PROPOSED at W104 and never answered — third-party model processing.",
    releases: ["W146", "W147"],
  },
  {
    blocker: "G9",
    kind: "founder_gate",
    whoDecides: "The founder. PROPOSED at W156 and never answered — third-party organisational reporting. Double-blocked: the e-referral gateway slot is blocked by G1 as well, so ratifying G9 releases the units to be BUILT and moves no data.",
    releases: ["W202", "W203"],
  },
  {
    blocker: "G10",
    kind: "founder_gate",
    whoDecides: "The founder. PROPOSED at W208 and never answered — payer and insurer data flows. Double-blocked by G1 in the same way as G9.",
    releases: ["W240", "W241"],
  },
  {
    // W263 FOUND THIS BY CHECKING BOTH DIRECTIONS. W133's row names its blocker TWICE — once as
    // `FOUNDER GATE G6` and once as `FOUNDER DECISION — Q9 action 1` — because the Q9 dossier's
    // ask IS the G6 ruling, written when the gate did not yet have a number. One ruling, two
    // names, and a register that grouped by name alone would report seventeen blocker-slots over
    // sixteen rows and price the directory decision twice. Declared as an alias rather than
    // deduplicated quietly, so the next reader learns the row says it twice.
    blocker: "Q9 action 1",
    kind: "founder_decision",
    whoDecides: "The founder, and it is THE SAME RULING as G6 above: the Ahpra review ask recorded in the Q9 dossier is what G6 became when the gate was numbered. W133's row names both, so both are described here and neither is a second decision.",
    releases: ["W133"],
  },
  {
    blocker: "Q17 action 1",
    kind: "founder_decision",
    whoDecides: "The founder, on whether patients may be ordered by anything a model learns. Not a gate, which is why nothing was checking it: the answer could require changing W201's published ADM notice rather than a config, since its never-automated list says the product orders nobody by need.",
    releases: ["W217"],
  },
];

/**
 * Violations in words, W48's shape.
 *
 * Both directions on the release sets, because both are real: a blocked row no path lists is a
 * unit waiting on nothing anybody wrote down, and a path listing a unit the ledger does not block
 * is a register describing work that has moved — the half W102 exists against.
 */
export function blockedSurfaceViolations(
  root: string,
  budget: number = BLOCKED_AT_W263,
  paths: readonly ReleasePath[] = RELEASE_PATHS,
): string[] {
  const violations: string[] = [];
  const blocked = blockedRows(root);

  if (blocked.length > budget) {
    violations.push(
      `the blocked surface grew to ${blocked.length} rows (budget ${budget}) — a new blocked row must name the ruling that releases it and the units released with it, and this number must move with it`,
    );
  } else if (blocked.length < budget) {
    violations.push(
      `the blocked surface fell to ${blocked.length} rows (budget ${budget}) — something was released and the budget still describes the old world`,
    );
  }

  const byBlocker = new Map(paths.map((p) => [p.blocker, p]));
  const claimed = new Map<string, string[]>();
  for (const row of blocked) {
    const blockers = blockersIn(row.note);
    if (blockers.length === 0) {
      violations.push(`${row.id} is blocked and names no founder gate or decision`);
      continue;
    }
    for (const blocker of blockers) {
      const path_ = byBlocker.get(blocker);
      if (!path_) {
        violations.push(`${row.id} waits on ${blocker}, which no release path describes`);
        continue;
      }
      if (!path_.releases.includes(row.id)) {
        violations.push(`${blocker} blocks ${row.id} and its release path does not list it`);
      }
      claimed.set(blocker, [...(claimed.get(blocker) ?? []), row.id]);
    }
  }

  for (const path_ of paths) {
    for (const unit of path_.releases) {
      if (!(claimed.get(path_.blocker) ?? []).includes(unit)) {
        violations.push(`${path_.blocker} claims to release ${unit}, which the ledger does not block on it`);
      }
    }
    if (path_.whoDecides.trim() === "") {
      violations.push(`${path_.blocker} states no ruling owner`);
    }
  }

  return violations;
}

/** How many of these the loop may answer. Zero, and the horizon rule requires it restated. */
export function answerableByTheLoop(paths: readonly ReleasePath[] = RELEASE_PATHS): ReleasePath[] {
  return paths.filter((p) => /\bbuilder|\bthe loop\b/i.test(p.whoDecides));
}

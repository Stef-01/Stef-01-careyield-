// W315: the gate that ran before the row, and the three defects that cost.
//
// EVERY UNIT IN THIS TREE VERIFIES A STATE IT DOES NOT COMMIT. `pnpm verify` runs while the unit's
// ledger row still says `claimed`; the row is closed afterwards, in the same commit or the next
// one. So every check keyed to a ledger row is blind to the one event that always happens: the row
// closing. The gap is not hypothetical and it is not rare — Q24 produced three separate defects
// through it, in one session, and each was found by something other than the gate.
//
//   THE LOST `[P]`. W304's row was rewritten at close and dropped the `[P]` prefix its plan line
//   carries. `horizon-q24` compares the plan line to the ledger note and would have said so — a
//   firing later, when the next unit ran the suite over a tree where the row was already closed.
//
//   THE BOUND STALE ON ITS OWN CLOSE. W308's `TAX_BOUND.stillOpen` read the ledger for `W308 | done`
//   being absent. It was absent while W308's gate ran and present the moment its row closed, so the
//   bound went stale in the same commit that shipped it and its suite never saw it.
//
//   THE `PENDING` SHA. A row cannot carry its own commit's hash, so every unit wrote `PENDING` and
//   filled it in afterwards — leaving an intermediate commit that fails W168's *every done unit has
//   a SHA to point at*. Nobody noticed for three hundred units because the gate ran before the row.
//
// SO THIS RUNS THE ROW-DEPENDENT CHECKS OVER THE LEDGER AS IT WILL BE COMMITTED. `closeRow` applies
// the close to the ledger TEXT, and each check takes that text — which is what makes them drivable
// at all. The three above were welded inside `.test.ts` files, exporting nothing, which is W289's
// finding and the reason this unit could not simply call them.
//
// WHAT IT CANNOT DO IS KNOW THE COMMIT HASH. A row's SHA is the hash of the commit containing the
// row, which does not exist until the row is written — genuinely circular, not an oversight. The
// checks are given a well-formed placeholder, so what they verify is that the row's SHAPE survives
// closing; whether the hash resolves is W168's business at review time, and `CLOSING_BOUND` says so.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the ledger, the plan and the tree's own
// bounds, and plants a rewritten ledger into a temporary copy.

import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { parseLedgerRows } from "./blocked-surface";
import { STATED_BOUNDS, type StatedBound, staleBounds } from "./bounds";
import { copyTree, withPlantedIn } from "./planting";

/** A well-formed hash that is not any real commit — see the note about circularity above. */
export const PLACEHOLDER_SHA = "0000000";

/**
 * The ledger with one unit's row closed: status `done`, session and time kept, SHA filled.
 *
 * Text in, text out. A version taking the parsed rows would have to render them back, and a
 * renderer that disagrees with the ledger's own formatting is a second source of truth about what
 * a row looks like.
 */
export function closeRow(ledger: string, unit: string, sha: string = PLACEHOLDER_SHA): string {
  return ledger
    .split("\n")
    .map((line) => {
      if (!line.startsWith(`| ${unit} | `)) return line;
      const cells = line.split(" | ");
      if (cells.length < 6) return line;
      cells[1] = "done";
      cells[4] = sha;
      return cells.join(" | ");
    })
    .join("\n");
}

/**
 * The units being built — every row that says `claimed`.
 *
 * PLURAL, AND THE FIRST DRAFT GOT THIS WRONG. It returned the single claimed row and null when
 * there was more than one, which reads as careful and is the opposite: overlapping sessions are
 * normal in this tree — the ledger is the lock precisely because two builders claim at once — so
 * the ordinary case returned null and the check silently did nothing. It found nothing on its own
 * first run for exactly that reason, while a sibling session held a claim.
 *
 * Empty when nothing is in flight, which is honest: between firings there is no closing state.
 */
export function unitsInFlight(ledger: string): string[] {
  return parseLedgerRows(ledger)
    .filter((r) => r.status === "claimed")
    .map((r) => r.id)
    .sort();
}

/** One check that reads a ledger row, run against the ledger as it will be committed. */
export interface ClosingCheck {
  id: string;
  /** Which of the three defects it would have caught, and how it reads the row. */
  why: string;
  /** Defects, given the closing ledger, the root, and the unit whose row was just closed. */
  run: (ledger: string, root: string, unit: string) => string[];
}

/** Every `- **W<n>** ...` line the plan states, by unit. */
function plannedLines(plan: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of plan.matchAll(/^- \*\*(W\d+)\*\* (.*)$/gm)) out.set(m[1]!, m[2]!);
  return out;
}

/** The SHA cell of a row, read from the text — the row parse keeps the time column, not this one. */
function shaOf(ledger: string, unit: string): string {
  const line = ledger.split("\n").find((l) => l.startsWith(`| ${unit} | `));
  return line ? (line.split(" | ")[4] ?? "").trim() : "";
}

/**
 * THE CHECKS ARE ABOUT THE ROW BEING CLOSED, not about the ledger.
 *
 * The first draft ran them over every row and reported two hundred defects on the first run —
 * historical notes that were rewritten with their outcomes and legitimately no longer start with
 * their plan line, and `W-MIGRATE`, whose SHA cell reads `(initial commit)` because it predates
 * the repository. Every one of those is a real difference and none of them is THIS unit's subject.
 * A check that reports two hundred true things nobody will act on is a check somebody turns off.
 *
 * `bounds-not-stale` is the exception and is global on purpose: closing one row can invalidate a
 * bound stated anywhere, which is precisely what happened to W308.
 */
export const CLOSING_CHECKS: readonly ClosingCheck[] = [
  {
    id: "sha-shape",
    why: "W168 requires every done row to carry a SHA somebody can follow. A row closed with `PENDING`, or with the column left as an em-dash, passes every check that runs before the close and fails the moment the row exists. This is the defect that shipped in every unit of Q24 and was invisible for three hundred units.",
    run: (ledger, _root, unit) => {
      const sha = shaOf(ledger, unit);
      return /^[0-9a-f]{7,40}\b/.test(sha) ? [] : [`${unit} closes with no SHA to point at (cell: "${sha}")`];
    },
  },
  {
    id: "plan-agreement",
    why: "The plan states each unit's line and the ledger note must begin with it, so the two documents cannot drift. W304's close rewrote its note and dropped the `[P]` prefix the plan carries — a difference invisible until a LATER firing ran the suite over the closed row, which is exactly the delay this unit removes.",
    run: (ledger, root, unit) => {
      const planned = plannedLines(readFileSync(path.join(root, "docs/FIVE-YEAR-PLAN.md"), "utf8")).get(unit);
      if (planned === undefined) return [];
      const row = parseLedgerRows(ledger).find((r) => r.id === unit);
      if (row === undefined || row.note.startsWith(planned)) return [];
      return [`${unit} reads differently in the ledger than in the plan`];
    },
  },
  {
    id: "bounds-not-stale",
    why: "A stated bound whose `stillOpen` reads the ledger answers differently once the row it reads is closed. W308's `TAX_BOUND` waited on `W308 | done` and went stale in the commit that shipped it. GLOBAL rather than scoped to the closing row, because closing one row can invalidate a bound stated anywhere — which is the whole shape of what happened.",
    run: (ledger, root, unit) => boundsStaleOnClose(ledger, root, unit),
  },
];

/**
 * Bounds that the closing ledger makes stale, with the register as a PARAMETER.
 *
 * W289'S REMEDY, AND THE MUTATION CHECK IS WHY IT IS HERE. Written inline against `STATED_BOUNDS`,
 * the arm survived a mutation that stopped planting the closing ledger at all — because no bound in
 * the tree reads a ledger row today, so reading the wrong ledger produced the same empty answer.
 * Taking the register lets a constructed ledger-reading bound be handed in, which is the only way
 * to show that the ledger PLANTED here is the one the predicates see.
 */
export function boundsStaleOnClose(
  ledger: string,
  root: string,
  unit: string,
  bounds: readonly StatedBound[] = STATED_BOUNDS,
): string[] {
  // W331: removed here rather than left to the process sweep. This copies the WHOLE tree per call
  // and `closeGateDefects` calls it once per unit in flight, so a long run would hold several
  // hundred megabytes it has finished with. The sweep in `copyTree` is the backstop, not the plan.
  const copy = copyTree(root);
  try {
    return withPlantedIn(copy, { "BUILD-STATE.md": ledger }, () =>
      staleBounds(copy, bounds).map((d) => `${unit} closing makes ${d.bound} stale: ${d.what}`),
    );
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

/**
 * What would break if the unit in flight closed its row now.
 *
 * THE WHOLE UNIT, in one call. Empty when nothing is in flight, which is honest rather than
 * convenient: between firings there is no closing state, and inventing one would mean choosing a
 * unit to pretend about.
 */
export function closingDefects(root: string, sha: string = PLACEHOLDER_SHA): string[] {
  const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
  // ONE AT A TIME rather than all at once: a sibling session's row closing is not this session's
  // event, and closing both together would let one builder's defect read as the other's.
  return unitsInFlight(ledger)
    .flatMap((unit) =>
      CLOSING_CHECKS.flatMap((check) => check.run(closeRow(ledger, unit, sha), root, unit)),
    )
    .sort();
}

/** What a green closing state does not prove. */
export const CLOSING_BOUND =
  "This runs the checks that read a ledger ROW against the row as it will be committed. It cannot " +
  "verify the SHA, because a row carries the hash of the commit that contains it and that hash " +
  "does not exist until the row is written — the circularity is real and the checks are handed a " +
  "well-formed placeholder, so what is proved is that the row's SHAPE survives closing. Nor does " +
  "it reach the checks that live inside `.test.ts` files and export nothing: `CLOSING_CHECKS` " +
  "reimplements them over ledger text precisely because they could not be called, which " +
  "means a fourth row-dependent check written the same welded way is invisible here. The remedy " +
  "is W289's, unchanged: export the comparison from a module that takes its inputs. And it says " +
  "nothing about a row closed by a DIFFERENT session while this unit is being built — that is the " +
  "rebase, and the ledger is the lock rather than this.";

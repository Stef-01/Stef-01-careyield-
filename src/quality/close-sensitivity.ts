// W380 — THE CLOSE IS THE MOMENT NOBODY RE-RUNS.
//
// A check whose answer depends on a ledger row's STATUS can only be wrong once that status changes,
// and the status changes in the close commit — the one commit whose suite is easiest not to re-run,
// because the work is done and the gate was green ten minutes ago. This tree has paid for that
// three times in one quarter. W363's close stranded a promise `unread-bounds` was holding; W364's
// close left two `horizon-q29` assertions requiring the live claimed set to BE its own row; W377's
// left one requiring a sibling's row to still be `claimed`. All three went red on `main`.
//
// W326 BUILT THE GATE FOR EXACTLY THIS AND STATED A LIMIT: it reaches the checks that are CALLABLE,
// and a comparison welded inside a `.test.ts` exports nothing to call. W379 measured that limit —
// every file it holds, naming the ones whose comparison is inherent — and moved one out. This unit closes the
// limit rather than shrinking it, and by a different route: YOU DO NOT NEED THE CHECK TO BE
// CALLABLE IF YOU CAN RUN ITS SUITE. `suitesThatFlip` plants the ledger a close would produce into
// a copied tree and runs each suite twice — once before, once after. A suite that passes on one and
// fails on the other is a check the close breaks, whether or not anything can call it.
//
// THE COST IS TWO SUITE RUNS PER FILE and that is the whole reason it was not done sooner. It is
// about two seconds each here, which is affordable for the twenty-one suites that read a row's
// status and would not be for all three hundred.
//
// THE POPULATION IS DERIVED TWICE OVER: `weldedLedgerTests` finds the files naming a ledger
// primitive, and `readsARowStatus` narrows that to the ones whose answer could turn on a status.
// Neither is a list somebody keeps.
//
// WHAT IT CANNOT SEE is `CLOSE_SENSITIVITY_BOUND`, below.
//
// FOUNDER GATE (plan §4): nothing crossed. It plants a fabricated ledger into a copied tree.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import path from "node:path";
import { weldedLedgerTests } from "./close-gate";
import { closeRow } from "./closing-state";
import { withPlantedInAsync } from "./planting";

const execFileAsync = promisify(execFile);

/** Why a suite is in the population, in the tree's words. */
export interface CloseSensitive {
  /** The `.test.ts`, repo-relative. */
  suite: string;
  /** What about a row's status its answer could turn on. */
  reads: string;
}

const STATUS_MARKERS = ['.status', 'status ===', 'status !==', '"claimed"', '"done"'] as const;

/**
 * Whether a test file's answer could turn on a ledger row's STATUS.
 *
 * The narrowing that makes this unit affordable. `weldedLedgerTests` finds every file naming a
 * ledger primitive; most of them read a row's NOTE or its SHA, and a close changes neither.
 */
export function readsARowStatus(root: string, file: string): boolean {
  const code = readFileSync(path.join(root, file), "utf8");
  return STATUS_MARKERS.some((marker) => code.includes(marker));
}

/**
 * This module's own suite, which the harness must not run.
 *
 * W349's RECURSION, THIRD REGISTER RUNNING, and worse here than in either of the others. The
 * mutation sweep declared it about a harness whose population contains a harness and paid a slow
 * run for it; this one does not terminate. `close-sensitivity.test.ts` reads a row's status, so it
 * joins the derived population, so the harness runs it, so it runs the harness. The first live run
 * of this unit spawned a hundred vitest processes and left 15 GB of tree copies in `/tmp` before it
 * was stopped by hand — W331's finding, arriving as a consequence rather than as a sweep.
 *
 * NAMED RATHER THAN FILTERED QUIETLY, which is the difference between an exclusion and a blind
 * spot: `runnableSuites` subtracts exactly this one, `censusDefects` still requires a row for it,
 * and the suite asserts the subtraction really removes something.
 */
export const RUNS_THE_HARNESS = "src/quality/close-sensitivity.test.ts";

/** The suites the close could turn, derived from the tree rather than listed. */
export function statusReadingSuites(root: string): string[] {
  return weldedLedgerTests(root).filter((file) => readsARowStatus(root, file));
}

/** The suites this harness can actually run: the population, minus itself. */
export function runnableSuites(root: string): string[] {
  return statusReadingSuites(root).filter((suite) => suite !== RUNS_THE_HARNESS);
}

export const SENSITIVE_SUITES: readonly CloseSensitive[] = [
  { suite: "src/founder/second-reading.test.ts", reads: "the rows that have changed since the founder last read the page, which a close is one way of changing" },
  { suite: "src/quality/close-sensitivity.test.ts", reads: "this register's own suite: it closes each row in flight and asks which suites turn, so a status is the thing it varies" },
  { suite: "src/quality/dossier-q19.test.ts", reads: "the quarter dossier's done count, which every close moves" },
  { suite: "src/quality/latent-y5.test.ts", reads: "the units a latent finding is anchored to, and whether each has landed" },
  { suite: "src/quality/ledger-integrity.test.ts", reads: "the ledger's own shape, including which statuses a row may carry" },
  { suite: "src/founder/outstanding.test.ts", reads: "the blocked rows, which a close does not move — the status is read to separate them from the rest" },
  { suite: "src/quality/claim-classes.test.ts", reads: "W324's `pending` arm, which waits on the unit it names LANDING" },
  { suite: "src/quality/close-gate.test.ts", reads: "the gate's own subject: what closing a row does to every registered reader" },
  { suite: "src/quality/controls.test.ts", reads: "W337's gate, which inherits W324's `pending` arm and so reads the status of the unit each in-flight answer waits on" },
  { suite: "src/quality/deferrals.test.ts", reads: "W329's clock: a deferral aimed at a unit that has landed" },
  { suite: "src/quality/gate-dossier-q17.test.ts", reads: "the dossier's done count, which every close moves" },
  { suite: "src/quality/gate-dossier-y5.test.ts", reads: "the same done count one gate on, read against the Y5 dossier rather than the Q17 one" },
  { suite: "src/quality/hardening-q22.test.ts", reads: "W318's clock, which fires when a deferral's unit lands" },
  { suite: "src/quality/horizon-q22.test.ts", reads: "the quarter's done count and the rows it prices" },
  { suite: "src/quality/horizon-q23.test.ts", reads: "the quarter's done count and the rows it prices, one quarter on" },
  { suite: "src/quality/horizon-q24.test.ts", reads: "the quarter's done count and the rows it prices, as every horizon suite does" },
  { suite: "src/quality/horizon-q25.test.ts", reads: "the quarter's done count and the rows it prices, as every horizon suite does" },
  { suite: "src/quality/horizon-q26.test.ts", reads: "the quarter's done count and the rows it prices, as every horizon suite does" },
  { suite: "src/quality/horizon-q27.test.ts", reads: "the quarter's done count and the rows it prices, as every horizon suite does" },
  { suite: "src/quality/horizon-q28.test.ts", reads: "the quarter's done count and the rows it prices, as every horizon suite does" },
  { suite: "src/quality/horizon-q29.test.ts", reads: "the same, and its in-flight assertion is one of the three that broke — W364's, fixed by W365 and lifted by W379" },
  { suite: "src/quality/horizon-q30.test.ts", reads: "the same, and its in-flight assertion is another — W377's, fixed by W374 and lifted by W379" },
  { suite: "src/quality/horizon-y6.test.ts", reads: "the year's done count, which is the same shape a quarter horizon reads over a longer range" },
  { suite: "src/quality/plan-ledger.test.ts", reads: "whether every plan row has a ledger row and what state it is in" },
  { suite: "src/quality/unit-headers.test.ts", reads: "the units the ledger holds, which a close does not add to — the status separates the landed from the rest" },
  { suite: "src/quality/unread-bounds.test.ts", reads: "W339's clock, and the third of the three that broke — lifted to `staleOwedConditions` by W370" },
];

export interface SensitivityDefect {
  suite: string;
  what: string;
}

/** Every status-reading suite the table misses, and every row the derivation no longer holds. */
export function censusDefects(
  root: string,
  declared: readonly CloseSensitive[] = SENSITIVE_SUITES,
): SensitivityDefect[] {
  const named = new Set(declared.map((s) => s.suite));
  const found = new Set(statusReadingSuites(root));
  const defects: SensitivityDefect[] = [];
  for (const suite of found) {
    if (!named.has(suite)) defects.push({ suite, what: "reads a row's status and no row says what it turns on" });
  }
  for (const suite of named) {
    if (!found.has(suite)) defects.push({ suite, what: "is declared and no longer reads a row's status" });
  }
  return defects.sort((a, b) => a.suite.localeCompare(b.suite));
}

/**
 * Whether a suite passes against a given ledger, in a copied tree.
 *
 * ASYNC, AND THE MUTATION HARNESS IS THE PRECEDENT. Run synchronously this blocks its vitest worker
 * for the whole sweep, and the worker's reporter RPC times out — the first complete run of this
 * unit passed all twelve tests and still exited non-zero for that reason. Awaiting the subprocess
 * yields the event loop between suites, which is what `runMutants` does and for the same reason.
 */
export async function greenAgainst(copy: string, ledger: string, suite: string): Promise<boolean> {
  return withPlantedInAsync(copy, { "BUILD-STATE.md": ledger }, async () => {
    try {
      await execFileAsync("npx", ["vitest", "run", suite], { cwd: copy, maxBuffer: 1 << 28 });
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * The suites that answer differently before and after a close. THE UNIT.
 *
 * W326's limit closed by a different route: a comparison welded inside a `.test.ts` exports nothing
 * to call, and it does not need to — the SUITE runs, and running it against both ledgers says
 * whether the close turns it. A suite that fails BEFORE is not reported: it was already broken, and
 * calling that a close-sensitivity would be the flattering direction W354 is about.
 */
export async function suitesThatFlip(
  copy: string,
  ledger: string,
  suites: readonly string[],
  unit: string,
): Promise<string[]> {
  const closed = closeRow(ledger, unit);
  const flipped: string[] = [];
  for (const suite of suites) {
    if (!(await greenAgainst(copy, ledger, suite))) continue;
    if (!(await greenAgainst(copy, closed, suite))) flipped.push(suite);
  }
  return flipped.sort();
}

export const CLOSE_SENSITIVITY_BOUND =
  "IT CLOSES W326's LIMIT AND BUYS A DIFFERENT ONE. The gate could not reach a comparison welded " +
  "inside a `.test.ts`; running the suite reaches every one of them, and costs two suite runs per " +
  "file instead of one function call. That is affordable for the suites whose answer could turn on " +
  "a status and is not affordable for the whole tree, so the narrowing is doing real " +
  "work and `readsARowStatus` is a TEXT SCAN: a suite reaching a status through a helper this scan " +
  "does not name is outside the population, and the same widening would be needed to find it. " +
  "SECOND, IT CANNOT RUN ITSELF, and that exclusion is permanent: this register's suite reads a " +
  "row's status, so it joins its own population, and running it would not terminate. " +
  "`RUNS_THE_HARNESS` names it rather than filtering it quietly — W349's recursion in a third " +
  "register, and the same admission each time. THIRD, IT CLOSES ONE ROW. A close that breaks a check only when two rows close together — a " +
  "sibling's and this session's — is invisible here, and W315's rule is why the harness works one " +
  "unit at a time: closing both would let one builder's defect read as the other's. THIRD, A " +
  "SUITE THAT WAS ALREADY RED IS SKIPPED RATHER THAN REPORTED, which is right and means this says " +
  "nothing about a tree that is not green before the close. AND IT IS A PASS/FAIL READING, NOT AN " +
  "ATTRIBUTION: it says a close turns this suite, never which assertion inside it, so the reader " +
  "who has to fix one still has to find it.";

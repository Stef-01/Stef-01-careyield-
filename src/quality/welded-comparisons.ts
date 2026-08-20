// W379 — A COMPARISON WELDED INSIDE A TEST FILE, AND THE ONES THAT CAN BE MOVED OUT.
//
// W370's Q28-CR-1 found a class: a check that reads a ledger row's STATUS can only go wrong at the
// close, and the close is the one commit whose suite is easiest not to re-run. W326's gate exists
// for exactly that and runs W326's `LEDGER_READERS` — so a comparison welded inside a `.test.ts` exports
// nothing for it to call. `weldedLedgerTests` derives that list and it is long.
//
// THE NUMBER W370 CITED IS WIDER THAN THE CLAIM IT SUPPORTED, and finding that out is most of this
// unit. That derivation is `a file naming a ledger primitive`, which is not the same as `a file
// holding a welded comparison`: eleven of the fifty-two name a primitive and compare nothing
// against the live ledger. Three of those PLANT a fabricated ledger to drive an already-callable
// check — the pattern the close gate wants, counted as the defect. A population that answers a
// wider question than the sentence it is quoted for is W367's subject, and W370's own pass is where
// it happened.
//
// SO THE CLASSES ARE THREE. `not_a_comparison` is derived rather than argued — the file does not
// read the live ledger, and `readsTheLiveLedger` says so on every run. `movable` names the change
// that would lift the comparison into something the gate can call. `inherent` says why a comparison
// cannot leave a test, and it is the class to watch, because it is the one that cannot be checked.
//
// ONE IS MOVED, and it is the one that broke twice. Every quarter close asserts that nobody ELSE
// held a row when the expansion priced the quarter; that comparison existed twice, welded in Q29's
// and Q30's horizon suites, and both copies were wrong at a close in ways that reached `main` —
// W364 required the claimed set to BE its own row, W377 required a sibling's row to still be
// `claimed`. It is now `blocked-surface.ts::heldByOthers`, takes the ledger as TEXT, is called by
// both suites, and is registered in W326's `LEDGER_READERS` so the close runs it BEFORE the commit.
//
// WHAT IT CANNOT SEE is `WELDED_BOUND`, below.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own test files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { weldedLedgerTests } from "./close-gate";
import type { UnitId } from "./typed-names";

/** How a welded ledger check stands. */
export type Standing =
  /**
   * The file names a ledger primitive and compares nothing against the LIVE ledger.
   *
   * Derived, not argued: `readsTheLiveLedger` is false for it. `why` says which of the two shapes
   * it is — a fabricated ledger planted to drive a callable, or a primitive named in passing.
   */
  | { kind: "not_a_comparison"; why: string }
  /** The comparison could be a function the close gate calls. `change` is what would move it. */
  | { kind: "movable"; change: string }
  /** It cannot leave a test. The class to watch, because nothing can check the claim. */
  | { kind: "inherent"; why: string }
  /** W379 moved it. `to` is `module::export` and is resolved. */
  | { kind: "moved"; to: string; by: UnitId };

export interface WeldedCheck {
  /** The `.test.ts`, repo-relative. */
  file: string;
  standing: Standing;
}

/**
 * Whether a test file compares something against the LIVE ledger.
 *
 * The distinction this unit turns on. Reading `BUILD-STATE.md` off the repository root is a
 * comparison against the tree as it stands; planting one into a copied tree is DRIVING a callable,
 * which is the opposite thing and was counted as the same.
 */
export function readsTheLiveLedger(root: string, file: string): boolean {
  const code = readFileSync(path.join(root, file), "utf8");
  return [
    'path.join(ROOT, "BUILD-STATE.md")',
    "allLedgerRows(ROOT)",
    "blockedRows(ROOT)",
    "parseLedgerRows(readLedger())",
    "parseLedgerRows(LEDGER)",
  ].some((marker) => code.includes(marker));
}

const movable = (change: string): Standing => ({ kind: "movable", change });
const planted = (): Standing => ({
  kind: "not_a_comparison",
  why: "Plants a fabricated ledger into a copied tree to DRIVE an already-callable check, which is the pattern the close gate wants rather than the one it cannot reach. It is in the population because the derivation reads a primitive's NAME.",
});
const passing = (): Standing => ({
  kind: "not_a_comparison",
  why: "Names a ledger primitive without comparing anything against the live ledger — a path in a fixture, a probe body, or an import used for a type. In the population because the derivation reads the name.",
});

const LIFT =
  "lift the comparison into a function taking the ledger TEXT and call it from the suite, so the close gate can ask it about the row as it will be committed";

export const WELDED_CHECKS: readonly WeldedCheck[] = [
  { file: "src/directory/dossier-claims.test.ts", standing: movable(LIFT) },
  { file: "src/founder/outstanding.test.ts", standing: movable(LIFT) },
  { file: "src/founder/second-reading.test.ts", standing: passing() },
  { file: "src/privacy/adm-y5.test.ts", standing: passing() },
  { file: "src/quality/audit-y5.test.ts", standing: movable(LIFT) },
  { file: "src/quality/blocked-surface.test.ts", standing: movable(LIFT) },
  { file: "src/quality/bounds.test.ts", standing: movable(LIFT) },
  { file: "src/quality/claim-classes.test.ts", standing: movable(LIFT) },
  {
    file: "src/quality/close-gate.test.ts",
    standing: {
      kind: "inherent",
      why: "IT IS THE GATE'S OWN SUITE. What it compares is what CLOSING a row does to every registered reader, which means running the readers against a ledger it writes — so the comparison is the harness rather than a check the harness could call. Lifting it would produce a function whose only caller is the thing being tested, which is the tautology W316 exists against.",
    },
  },
  {
    file: "src/quality/closing-state.test.ts",
    standing: {
      kind: "inherent",
      why: "W315's harness, and the same argument one level down: it constructs the tree a close would produce and asserts the construction is faithful. A callable version would be a second implementation of the thing it checks, which is the private copy W341 forbids rather than a check the gate could run.",
    },
  },
  { file: "src/quality/controls.test.ts", standing: movable(LIFT) },
  { file: "src/quality/declaration-tax.test.ts", standing: movable(LIFT) },
  { file: "src/quality/deferrals.test.ts", standing: movable(LIFT) },
  { file: "src/quality/dossier-derived.test.ts", standing: movable(LIFT) },
  { file: "src/quality/dossier-q19.test.ts", standing: passing() },
  { file: "src/quality/gate-dossier-q17.test.ts", standing: movable(LIFT) },
  { file: "src/quality/gate-dossier-y4.test.ts", standing: movable(LIFT) },
  { file: "src/quality/gate-dossier-y5.test.ts", standing: movable(LIFT) },
  { file: "src/quality/gate-readiness.test.ts", standing: movable(LIFT) },
  { file: "src/quality/hardening-q22.test.ts", standing: movable(LIFT) },
  { file: "src/quality/hardening-q23.test.ts", standing: movable(LIFT) },
  { file: "src/quality/hardening-q24.test.ts", standing: movable(LIFT) },
  { file: "src/quality/hardening-q25.test.ts", standing: passing() },
  { file: "src/quality/hardening-q26.test.ts", standing: passing() },
  { file: "src/quality/hardening-q27.test.ts", standing: movable(LIFT) },
  { file: "src/quality/hardening-q28.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q22.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q23.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q24.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q25.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q26.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q27.test.ts", standing: movable(LIFT) },
  { file: "src/quality/horizon-q28.test.ts", standing: movable(LIFT) },
  {
    file: "src/quality/horizon-q29.test.ts",
    standing: { kind: "moved", to: "src/quality/blocked-surface.ts::heldByOthers", by: "W379" },
  },
  {
    file: "src/quality/horizon-q30.test.ts",
    standing: { kind: "moved", to: "src/quality/blocked-surface.ts::heldByOthers", by: "W379" },
  },
  { file: "src/quality/horizon-y6.test.ts", standing: movable(LIFT) },
  { file: "src/quality/latent-y5.test.ts", standing: passing() },
  { file: "src/quality/ledger-integrity.test.ts", standing: passing() },
  { file: "src/quality/pins.test.ts", standing: movable(LIFT) },
  { file: "src/quality/plan-ledger.test.ts", standing: movable(LIFT) },
  { file: "src/quality/planting.test.ts", standing: passing() },
  { file: "src/quality/quarter-mutants-q26.test.ts", standing: movable(LIFT) },
  { file: "src/quality/quarter-mutants-q27.test.ts", standing: movable(LIFT) },
  { file: "src/quality/quarter-mutants-q28.test.ts", standing: movable(LIFT) },
  { file: "src/quality/quarter-mutants.test.ts", standing: movable(LIFT) },
  { file: "src/quality/review-w279.test.ts", standing: movable(LIFT) },
  { file: "src/quality/self-defeating.test.ts", standing: movable(LIFT) },
  { file: "src/quality/self-ending.test.ts", standing: planted() },
  { file: "src/quality/spelling-markers.test.ts", standing: passing() },
  { file: "src/quality/timelines.test.ts", standing: planted() },
  {
    file: "src/quality/welded-comparisons.test.ts",
    standing: {
      kind: "inherent",
      why: "THIS REGISTER'S OWN SUITE, and it is in the population for the reason the register is about: it reads the live ledger to drive `heldByOthers` — the function this unit LIFTED — against the tree as it stands. A callable version would be a check over the check that moved the comparison out, which is the tautology W316 exists against; what it compares is whether the move happened, and the move is the thing a reader is here to see.",
    },
  },
  { file: "src/quality/unit-headers.test.ts", standing: movable(LIFT) },
  { file: "src/quality/unread-bounds.test.ts", standing: movable(LIFT) },
];

export interface WeldedDefect {
  file: string;
  what: string;
}

/** Every welded test the table misses, and every row naming one the derivation no longer holds. */
export function weldedCensusDefects(
  root: string,
  checks: readonly WeldedCheck[] = WELDED_CHECKS,
): WeldedDefect[] {
  const declared = new Set(checks.map((c) => c.file));
  const found = new Set(weldedLedgerTests(root));
  const defects: WeldedDefect[] = [];
  for (const file of found) {
    if (!declared.has(file)) defects.push({ file, what: "holds a welded ledger check and no row classifies it" });
  }
  for (const file of declared) {
    if (!found.has(file)) defects.push({ file, what: "is classified and no longer holds a welded ledger check" });
  }
  return defects.sort((a, b) => a.file.localeCompare(b.file));
}

/**
 * Every row whose class the tree contradicts, in both directions.
 *
 * `not_a_comparison` is the only class a derivation can settle, and it settles it BOTH ways: a row
 * claiming it while the file reads the live ledger is a comparison hiding behind an excuse, and a
 * row claiming any other class while the file reads no live ledger is a comparison nobody has.
 */
export function weldedClassDefects(
  root: string,
  checks: readonly WeldedCheck[] = WELDED_CHECKS,
): WeldedDefect[] {
  const defects: WeldedDefect[] = [];
  for (const check of checks) {
    const live = readsTheLiveLedger(root, check.file);
    if (check.standing.kind === "not_a_comparison" && live) {
      defects.push({ file: check.file, what: "is classified as comparing nothing and reads the live ledger" });
    }
    if (check.standing.kind !== "not_a_comparison" && !live) {
      defects.push({ file: check.file, what: "is classified as holding a comparison and reads no live ledger" });
    }
  }
  return defects;
}

/** The files this unit moved a comparison out of, by name. */
export function movedOut(checks: readonly WeldedCheck[] = WELDED_CHECKS): string[] {
  return checks.filter((c) => c.standing.kind === "moved").map((c) => c.file).sort();
}

/** The files whose comparison cannot leave a test. The class to watch. */
export function inherentlyWelded(checks: readonly WeldedCheck[] = WELDED_CHECKS): string[] {
  return checks.filter((c) => c.standing.kind === "inherent").map((c) => c.file).sort();
}

/** The files in the population that compare nothing against the live ledger. */
export function notComparisons(checks: readonly WeldedCheck[] = WELDED_CHECKS): string[] {
  return checks.filter((c) => c.standing.kind === "not_a_comparison").map((c) => c.file).sort();
}

export const WELDED_BOUND =
  "`movable` IS A JUDGEMENT AND THE LARGEST CLASS, which is the honest shape of this register and " +
  "its weakest part. Every row so classified carries the same change — lift the comparison into a " +
  "function taking the ledger text — and nothing here has run that change on it, so what the class " +
  "really says is that this reader saw no reason it could not be done. A row that turns out to be " +
  "`inherent` on the day somebody tries is not a defect this register can report. SECOND, THE " +
  "POPULATION IS STILL A NAME SCAN. It is `weldedLedgerTests`, which finds a file NAMING a ledger " +
  "primitive; `readsTheLiveLedger` narrows that to the files comparing something, and both are " +
  "text. A suite that reached the ledger through a helper this scan does not name is outside the " +
  "population entirely, and the same widening would be needed to find it. THIRD, MOVING A " +
  "COMPARISON OUT IS NOT RUNNING IT AT THE CLOSE. `heldByOthers` is callable and registered, and " +
  "those are two separate facts: a lifted function nobody adds to W326's `LEDGER_READERS` is a comparison " +
  "in a nicer place, which is why this register reports the move and W326's own census reports the " +
  "registration.";

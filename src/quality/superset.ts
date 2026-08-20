// W353: the superset failure — a derivation whose wrong answer is bigger than its right one.
//
// A SELECTOR'S JOB IS TO NARROW. `quarterModules` takes the tree and returns a quarter's modules;
// `unitsInCell` takes a cell and returns the ids it names; `privateCopies` takes the tree and
// returns the files holding a copy. Each is handed a population and a rule, and each answers with a
// subset. So there are two ways for one to be wrong, and they are not symmetrical: it can return
// TOO FEW, which shows up as a register that has gone quiet and which W352 has just finished
// classifying the whole census by — or it can return TOO MANY, which shows up as a bigger, busier,
// more thorough-looking answer that nobody questions.
//
// W349 FOUND ONE AND W343 FIXED THE SHAPE OF IT. `quarterModules(root, first, last)` in its
// two-number form dropped its arguments when handed the range OBJECT the module exports; every
// comparison went false, nothing threw, and the function returned the whole repository instead of a
// quarter. W343 made that particular call a type error. IT DID NOT MAKE THE BEHAVIOUR SAFE, and
// this unit's driven case is the proof: handed `{ first: NaN, last: NaN }` — a range that
// typechecks and means nothing — the same function returned every module under `src/` where the
// quarter has a handful. A comparison against a number that is not one is false in both
// directions, so a filter built on `<` and `>` keeps everything.
//
// SO THE REGISTER ASKS ONE QUESTION OF EACH SELECTOR: handed a population it cannot understand,
// does it NARROW, or does it REFUSE, or does it WIDEN? Widening is the defect. Narrowing to nothing
// is honest — an empty answer is visibly empty. Refusing is better still where the input is a
// mistake rather than a state, which is the shape W342 gave `asUnitId` at its parse boundary.
//
// THE MEASUREMENT IS A COMPARISON, NOT A GUESS. Each row calls its selector twice — once honestly
// and once with the degenerate input — and the sizes decide. Nothing here reads the selector's
// source or trusts a sentence about it.
//
// AND EVERY ROW TAKES A ROOT, which is W282's rule about deriving through a shared walk arriving
// one level out: a table that closed over `process.cwd()` could only ever measure this repository,
// and a measurement that cannot be pointed anywhere else is one nobody can show working. Pointed
// at a copied tree with a module planted in it, the honest answer moves — and moves only for the
// arrival whose header names a unit the quarter holds, beside one whose header does not.
//
// WHAT THIS DOES NOT PROVE is `SUPERSET_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It calls this tree's own derivations.

/** What a selector does when it is handed a population it cannot understand. */
export type Widening =
  /** It returns no more than the honest answer. An empty answer is visibly empty. */
  | "narrows"
  /** It throws. The best answer where the input is a mistake rather than a state. */
  | "refuses"
  /** It returns MORE than the honest answer — the failure that reads as a bigger, better answer. */
  | "widens";

/** One exported derivation that takes a population and returns a subset of it. */
export interface Selector {
  /** `<file>::<export>` — W342's citation form, resolved against the tree by this unit's test. */
  name: string;
  /** The population it narrows, in the tree's words. */
  what: string;
  /** The size of the honest answer, against the tree at `root`. */
  honest: (root: string) => number;
  /** The size of the answer when the input means nothing — or `"refuses"` when it throws. */
  degenerate: (root: string) => number | "refuses";
  /** What this tree requires of it. */
  expected: Widening;
  why: string;
}

/** What the selector actually does, measured by calling it. */
export function behaviourOf(selector: Selector, root: string): Widening {
  let degenerate: number | "refuses";
  try {
    degenerate = selector.degenerate(root);
  } catch {
    return "refuses";
  }
  if (degenerate === "refuses") return "refuses";
  return degenerate > selector.honest(root) ? "widens" : "narrows";
}

export interface SupersetDefect {
  selector: string;
  what: string;
}

/**
 * Every selector whose behaviour disagrees with what this tree requires of it.
 *
 * ONE DIRECTION AND BOTH ANSWERS. A selector declared to refuse and merely narrowing is reported
 * too: the difference matters at a parse boundary, where a mistake should stop rather than produce
 * an empty answer somebody reads as a fact about the tree.
 */
export function supersetDefects(root: string, selectors: readonly Selector[] = SELECTORS): SupersetDefect[] {
  return selectors
    .flatMap((selector) => {
      const actual = behaviourOf(selector, root);
      return actual === selector.expected
        ? []
        : [{ selector: selector.name, what: `is declared \`${selector.expected}\` and \`${actual}\`` }];
    })
    .sort((a, b) => a.selector.localeCompare(b.selector));
}

/**
 * Census members no selector declares — the bound's first clause, derived rather than asserted.
 *
 * A REGISTER THAT WALKS A TREE HAS A POPULATION, so W267's census is the honest denominator here:
 * every module in it takes something and narrows it, and the rows below cover the ones somebody
 * sat down and wrote a degenerate input for. Test files are left out because their population is
 * whatever the register they drive was handed.
 */
export function undeclaredPopulations(
  census: readonly TreeDerivedRegister[] = TREE_DERIVED_REGISTERS,
  selectors: readonly Selector[] = SELECTORS,
): string[] {
  const declared = new Set(selectors.map((selector) => selector.name.split("::")[0]!));
  return census
    .map((entry) => entry.file)
    .filter((file) => !file.endsWith(".test.ts") && !declared.has(file))
    .sort();
}

/** The selectors that would widen. The list this register exists to keep empty. */
export function wideningSelectors(root: string, selectors: readonly Selector[] = SELECTORS): string[] {
  return selectors
    .filter((s) => behaviourOf(s, root) === "widens")
    .map((s) => s.name)
    .sort();
}

export const SUPERSET_BOUND =
  "THE POPULATION IS DECLARED, and it is the register's own weakest part: this tree exports many " +
  "derivations that take a population, and the rows below are the ones somebody sat down and wrote " +
  "a degenerate input for. A selector nobody declared can widen unwatched, which is the class W267 " +
  "states about a walk and has the same remedy — the list grows and says so. SECOND, ONE " +
  "DEGENERATE INPUT IS NOT ALL OF THEM. A range of `NaN` is what broke `quarterModules`; a range " +
  "of the wrong TYPE no longer typechecks and a reversed range narrows correctly, so the row " +
  "checks the input that was reachable rather than every input that could exist. A selector that " +
  "narrows on the declared input and widens on some other one reads clean here. THIRD, SIZE IS " +
  "THE MEASURE. A selector returning the same NUMBER of the wrong things is invisible to this — " +
  "the comparison is a count, not a set, and a register comparing sets would need to know the " +
  "right answer, which is the thing the selector was asked for.";

// ---------------------------------------------------------------------------------------------
// The rows. Imports live down here because the register CALLS its subjects rather than reading
// their source — the census is the module that reads them, and this one runs them.
// ---------------------------------------------------------------------------------------------

import { allLedgerRows, parseLedgerRows } from "./blocked-surface";
import { unitsInCell } from "./dossier-derived";
import { boldClaims } from "./horizon-claims";
import { TREE_DERIVED_REGISTERS } from "./manifest";
import type { TreeDerivedRegister } from "./register-census";
import { SHARED_PARSES, privateCopies } from "./private-copies";
import { QUARTER_AT_W332, quarterModules } from "./quarter-mutants";
import { claimCommit } from "./timelines";
import { sourceModules } from "./tree-walks";
import { directions } from "./failure-direction";
import { nameSites } from "./typed-names";

/**
 * A log holding one unit's claim, for the selector below.
 *
 * W374: constructed rather than read, because the tree the sweep runs in has no git history and a
 * row whose honest reading comes back empty there is a row that cannot narrow.
 */
const CLAIM_LOG = [
  { sha: "0000001", at: "2026-08-18T10:00:00+00:00", subject: "W352: claim — which way each register fails" },
  { sha: "0000002", at: "2026-08-18T12:00:00+00:00", subject: "W352: which way each register fails" },
];

export const SELECTORS: readonly Selector[] = [
  {
    name: "src/quality/quarter-mutants.ts::quarterModules",
    what: "the modules a quarter added, out of every module under `src/`",
    honest: (root) => quarterModules(root, QUARTER_AT_W332).length,
    degenerate: (root) => quarterModules(root, { first: Number.NaN, last: Number.NaN }).length,
    expected: "refuses",
    why:
      "THE ONE THIS UNIT IS ABOUT. W349 found it returning the whole repository when its arguments were dropped, and W343 recorded the finding and made that call a type error — and the behaviour was untouched: a range of `NaN` typechecks, every comparison against it is false, and the filter keeps everything. It refuses now, because a range whose ends are not numbers is a mistake at a boundary rather than a state of the tree, which is the same call `asUnitId` makes about a unit id read out of a document.",
  },
  {
    name: "src/quality/dossier-derived.ts::unitsInCell",
    what: "the ids a dossier cell names, out of the ids the ledger holds",
    honest: (root) => unitsInCell("W174, SUP-1", allLedgerRows(root).map((r) => r.id)).length,
    degenerate: (root) => unitsInCell("W174, SUP-1", []).length,
    expected: "narrows",
    why:
      "Handed no known ids it can match nothing, and returns nothing. The empty answer is honest and visible — and it is why W342 had to add `unknownIdsInCell` beside it, because a cell naming an id the ledger does not hold was reported by nobody rather than reported wrongly.",
  },
  {
    name: "src/quality/tree-walks.ts::sourceModules",
    what: "every non-test module, out of the files under a root",
    honest: (root) => sourceModules(root).length,
    degenerate: (root) => sourceModules(`${root}/nonexistent-for-w353`).length,
    expected: "narrows",
    why:
      "A root that does not exist returns nothing: `filesUnder` catches the read and answers with an empty list. That is the right direction for a walk — a tree nobody can read is not a tree full of files — and every register built on it inherits the answer.",
  },
  {
    name: "src/quality/blocked-surface.ts::parseLedgerRows",
    what: "the ledger's rows, out of the text it is handed",
    honest: (root) => parseLedgerRows("| W1 | done | b | at | sha | note |\n").length,
    degenerate: (root) => parseLedgerRows("a document with no table in it at all\n").length,
    expected: "narrows",
    why:
      "Text with no rows in it parses to no rows. The failure this leaves open is the opposite one and W338 states it: a row whose shape has changed is SKIPPED rather than reported, which is why `ledger-integrity.test.ts` keeps its own regex and may not share this parse.",
  },
  {
    name: "src/quality/private-copies.ts::privateCopies",
    what: "the modules holding a private copy, out of every module under `src/`",
    honest: (root) => privateCopies(root, SHARED_PARSES).length,
    degenerate: (root) => privateCopies(root, []).length,
    expected: "narrows",
    why:
      "Handed no parses to look for it finds no copies. The register's `every` over the markers is what makes this true: an empty marker list would match everything, and the parses are the outer loop rather than the inner one.",
  },
  {
    name: "src/quality/failure-direction.ts::directions",
    what: "a direction per census member, out of the census",
    honest: (root) => directions(TREE_DERIVED_REGISTERS).length,
    degenerate: (root) => directions([]).length,
    expected: "narrows",
    why:
      "An empty census classifies nothing. W352's register is a map rather than a filter, so widening would mean inventing rows — but the row is here because the ARGUED table is a second population, and an argued row for a register the census does not hold is reported rather than added.",
  },
  {
    name: "src/quality/typed-names.ts::nameSites",
    what: "the names a register's data declares, out of the tree's TypeScript",
    honest: (root) => nameSites(root).length,
    degenerate: (root) => nameSites(`${root}/nonexistent-for-w353`).length,
    expected: "narrows",
    why:
      "It walks through `typescriptFiles`, so a root with nothing under it yields no sites. The interesting half is the narrowing it does deliberately — paren depth zero — which W352's quarter would call a way of returning FEWER things, and the bound of that narrowing is stated where it is made.",
  },
  {
    name: "src/quality/horizon-claims.ts::boldClaims",
    what: "the claims a horizon emphasises, out of its text",
    honest: (root) => boldClaims("a document with **one claim** in it").length,
    degenerate: (root) => boldClaims("a document with no emphasis at all").length,
    expected: "narrows",
    why:
      "Text with no emphasis makes no claims. This is the row whose degenerate input is the bound: a document that stopped using bold would report nothing rather than reporting everything, and W350's register would read as a document with nothing left to check.",
  },
  {
    name: "src/quality/timelines.ts::claimCommit",
    what: "the commit that opened a unit's work, out of the log",
    // W374: THE HONEST INPUT IS A FABRICATED LOG, NOT THE AMBIENT ONE. This row used to read
    // `GIT_LOG(root)`, which is empty in a copied tree because `copyTree` does not copy `.git` — so
    // its honest reading was zero there, equal to its degenerate reading, and `behaviourOf` calls
    // equal "narrows". The row agreed with itself in the one place the mutation sweep runs, and
    // W374's sweep is what found it. A selector whose honest input depends on the ambient tree is a
    // selector that measures nothing where it is measured.
    honest: () => (claimCommit(CLAIM_LOG, "W352") === null ? 0 : 1),
    degenerate: () => (claimCommit([], "W352") === null ? 0 : 1),
    expected: "narrows",
    why:
      "An empty log opens no window, and `workWindow` then answers `null` rather than guessing one — which is the state W344's register calls `unreadable` and reports as itself rather than folding into a verdict.",
  },
];

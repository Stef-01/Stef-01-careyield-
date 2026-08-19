// W357: a remedy written and never applied.
//
// THIS TREE IS GOOD AT WRITING DOWN WHAT WOULD FIX A THING. A survivor recorded `uncaught` carries
// a `remedy` field, and the four in the tree when this unit ran were specific enough to build from:
// stand a fixture on the window's edge, render a report with an empty count table, re-derive a rate
// from the patients rather than from the same expression, drive the arm a second time with a row
// that has not landed. Not one of them had been built. The oldest had been sitting in the register
// since W296.
//
// AND ONE OF THEM CAME BACK WHILE IT SAT THERE. W332 recorded `claim-classes.ts`'s `pending`
// lookup, wrote the remedy into the register, and left it for W331 — whose hardening pass over that
// quarter did not apply it. W337 then wrote `controls.ts` from the same pattern and the hole
// arrived with it, which W349 found seventeen units later and fixed THERE while the original stood.
// **A recorded remedy reads exactly like a solved problem**, and a register full of them reads like
// a tree that knows what it is doing.
//
// SO THE STANDING IS DRIVEN RATHER THAN DECLARED. A row saying a remedy was applied has to prove
// it: the mutant is re-applied to a copied tree and its suite must FAIL. That is the only claim
// here that cannot be satisfied by writing a sentence, and it is the whole point of the unit — the
// failure mode this register exists against is a row that says `applied` because somebody wrote
// `applied`.
//
// THE POPULATION IS EVERY `uncaught` SURVIVOR IN THE THREE REGISTERS, derived rather than listed,
// so a survivor recorded tomorrow with a remedy nobody builds is reported the day after. It is
// empty today because this unit emptied it, which is the one state the check cannot distinguish
// from a register that never worked — `UNAPPLIED_BOUND` says so, and the driven arm over the four
// historical rows is what keeps the file honest in the meantime.
//
// FOUNDER GATE (plan §4): nothing crossed. Mutants are applied inside a copied tree.

import { readFileSync } from "node:fs";
import path from "node:path";
import { SURVIVORS_AT_W296, type Survivor, allMutants, applyMutant, mutantId } from "./mutation-sampling";
import { SURVIVORS_AT_W332 } from "./quarter-mutants";
import { SURVIVORS_AT_W349 } from "./quarter-mutants-q26";
import type { UnitId } from "./typed-names";
import { CITATION_SEPARATOR } from "./citations";

/** The registers that can record a remedy, in the order the quarters wrote them. */
export const REMEDY_REGISTERS: ReadonlyArray<{ unit: UnitId; survivors: readonly Survivor[] }> = [
  { unit: "W296", survivors: SURVIVORS_AT_W296 },
  { unit: "W332", survivors: SURVIVORS_AT_W332 },
  { unit: "W349", survivors: SURVIVORS_AT_W349 },
];

export interface NamedRemedy {
  /** The survivor's id — `module :: operator :: line`. */
  id: string;
  /** The unit whose register holds it. */
  register: UnitId;
  /** What the register says would catch it. */
  remedy: string;
}

/** Every remedy the survivor registers name, derived from the registers themselves. */
export function namedRemedies(
  registers: ReadonlyArray<{ unit: UnitId; survivors: readonly Survivor[] }> = REMEDY_REGISTERS,
): NamedRemedy[] {
  return registers
    .flatMap(({ unit, survivors }) =>
      survivors.flatMap((s) =>
        s.reason.kind === "uncaught" ? [{ id: s.id, register: unit, remedy: s.reason.remedy }] : [],
      ),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Where a named remedy stands. */
export type Standing =
  /**
   * Built. The mutant is re-applied and its suite must fail — the one claim here that a sentence
   * cannot satisfy.
   */
  | { kind: "applied"; by: UnitId; how: string }
  /** Not built, with the unit that owes it and why it has not been. */
  | { kind: "open"; owed: UnitId; why: string };

export interface RemedyRow {
  id: string;
  standing: Standing;
}

/**
 * Where each remedy the tree has ever named stands, as at W357.
 *
 * FOUR ROWS AND ALL FOUR SAY `applied`, which this unit did rather than found. Each is checked by
 * re-applying its mutant and requiring the suite to go red, so the rows cannot be true by assertion
 * — and the `open` arm is kept, driven on a constructed row, because a register with one arm is a
 * register that cannot report the thing it is named after.
 */
export const REMEDIES_AT_W357: readonly RemedyRow[] = [
  {
    id: 'src/capability/experience.ts :: lte-to-lt :: return date >= window.fromIso && date <= window.toIso;',
    standing: {
      kind: "applied",
      by: "W357",
      how: "`experience.test.ts` now stands a fixture appointment on the window's last day and another on its first, and requires both to be counted. W296 wrote this remedy and nothing built it; the module's only importer is its own suite, so narrowing either comparison by a day was invisible everywhere.",
    },
  },
  {
    id: "src/pathways/simulation.ts :: eq-to-neq :: if (rows.length === 0) return [];",
    standing: {
      kind: "applied",
      by: "W357",
      how: "`simulation.test.ts` renders an empty cohort's report and requires all three count-table headings to be ABSENT, then renders a populated one and requires the first heading present. The pair is what separates the guard from its inverse: one case alone passes whichever way the comparison runs.",
    },
  },
  {
    id: "src/synthetic/generate.ts :: neq-to-eq :: futureBookingRate: rate((p) => p.futureBookingAt !== null),",
    standing: {
      kind: "applied",
      by: "W357",
      how: "`generate.test.ts` re-derives every reported rate from the returned patients rather than from the same expression, and asserts that a rate and its complement are different numbers so the equalities separate the predicate from its inverse. Ten files import this generator and the calibration bands passed either way.",
    },
  },
  {
    id: 'src/quality/self-ending.ts :: eq-to-neq :: if (comment === undefined) continue;',
    standing: {
      kind: "open",
      owed: "W358",
      why: "ARRIVED WHILE THIS UNIT WAS BEING BUILT, which is the only reason the register ships with an open row at all — and a better one than the four historical ones, because it shows the bookkeeping catching something rather than recording something already known. W350 added `proseWaits` after W349's sweep ran; the next run found two mutants its suite does not notice. Owed to W358, whose subject is a walk asserting the state it claims: `proseWaits` has no fixture standing on the comment/code discriminant this guard is, which is that unit's shape exactly.",
    },
  },
  {
    id: 'src/quality/self-ending.ts :: eq-to-neq :: if (status.get(unit) === "done") continue;',
    standing: {
      kind: "open",
      owed: "W358",
      why: "The same arrival and the same owner. The guard drops a prose wait whose unit has landed and every fixture names an open one, so the correct lookup and its inverse look alike — the one-case shape W332 recorded in `claim-classes.ts`, W349 found recurring in `controls.ts`, and this unit applied in both. Recording it here rather than fixing it is a deliberate line: it is another builder's just-landed code and the pair that separates it belongs beside their register, not bolted on from outside.",
    },
  },
  {
    id: "src/quality/claim-classes.ts :: eq-to-neq :: const row = parseLedgerRows(ledger).find((r) => r.id === answer.by);",
    standing: {
      kind: "applied",
      by: "W357",
      how: "`claim-classes.test.ts` now drives the `pending` arm a second time with a `by` naming a row that has NOT landed and requires silence. This is the original of the hole W349 fixed in `controls.ts`: W332 wrote the remedy, left it for W331, W331 did not apply it, and W337 copied the pattern into a second module with the gap attached.",
    },
  },
];

export interface RemedyDefect {
  id: string;
  what: string;
}

/**
 * The register against the survivor registers, in both directions.
 *
 * WHETHER A REMEDY WAS BUILT IS NOT CHECKED HERE — it is checked by driving the mutant, which needs
 * a copied tree and a subprocess and therefore lives in the suite. What this resolves is the
 * bookkeeping either side of it: a remedy the tree names and nothing tracks, and a row tracking a
 * remedy no register names any more.
 */
export function remedyDefects(
  root: string,
  rows: readonly RemedyRow[] = REMEDIES_AT_W357,
  named: readonly NamedRemedy[] = namedRemedies(),
): RemedyDefect[] {
  void root;
  const out: RemedyDefect[] = [];
  const tracked = new Set(rows.map((r) => r.id));
  const namedIds = new Set(named.map((n) => n.id));

  for (const { id, register } of named) {
    if (!tracked.has(id)) {
      out.push({ id, what: `is a remedy ${register} named and nothing says whether it was built` });
    }
  }
  for (const { id, standing } of rows) {
    if (standing.kind === "open" && !namedIds.has(id)) {
      out.push({ id, what: "is tracked as an open remedy and no register names it" });
    }
  }
  return out.sort((a, b) => `${a.id}${a.what}`.localeCompare(`${b.id}${b.what}`));
}

/** A mutant's source and the mutated text, for a row whose remedy claims to kill it. */
export interface Mutation {
  module: string;
  suite: string;
  original: string;
  mutated: string;
}

/**
 * Rebuild the mutation a row's id describes, so the claim can be driven.
 *
 * THE ID IS THE ONLY HANDLE and it is a derived string — `module :: operator :: line-of-code` — so
 * this looks the mutant back up rather than storing offsets that would rot the moment a line moved.
 * A row whose id no longer matches any mutation site returns null, which the suite reports: an
 * `applied` claim about a line that has been edited away is not evidence of anything.
 */
export function mutationFor(root: string, id: string): Mutation | null {
  const module = id.split(CITATION_SEPARATOR)[0]!;
  const source = readFileSync(path.join(root, module), "utf8");
  for (const mutant of allMutants(root)) {
    if (mutant.module !== module) continue;
    if (mutantId(mutant, source) !== id) continue;
    return {
      module,
      suite: mutant.suite,
      original: source,
      mutated: applyMutant(source, mutant),
    };
  }
  return null;
}

/** What this register does not prove. */
export const UNAPPLIED_BOUND =
  "THE POPULATION IS `uncaught` SURVIVORS AND NOTHING ELSE. This tree names remedies in several " +
  "other shapes — a bound's `remedy` field, which W297 already resolves through `stillOpen`; a " +
  "deferral's disposition, which W318 gave a clock; a condition `owed` to a unit, which W339 " +
  "resolves against the ledger; and prose in a blind spot's `whyNotPlantable`, which nothing " +
  "resolves at all. Only the last is uncovered, and it is uncovered still: a sentence saying what " +
  "would make a bound plantable is not a field, and this register would have to read English to " +
  "find it. AND THE REGISTER IS EMPTY OF OPEN ROWS BECAUSE THIS UNIT EMPTIED IT, which is the one " +
  "state a reader cannot tell from a register that never worked — the driven arm over the four " +
  "historical rows is what stands in for that, and it proves the mutants die rather than that the " +
  "bookkeeping would notice a fifth. A ROW SAYING `applied` PROVES ONE MUTANT DIES, not that the " +
  "remedy the register described is what killed it: a suite that got stricter for an unrelated " +
  "reason satisfies this check, and only reading the diff tells them apart. Finally, a remedy is " +
  "only as good as the survivor that named it — an `equivalent` or `unreached` survivor carries no " +
  "remedy field at all, so a mutant misfiled into one of those kinds leaves this register with " +
  "nothing to track and no way to know it should have had something.";

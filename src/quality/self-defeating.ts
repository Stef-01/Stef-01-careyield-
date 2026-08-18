// W317: a remedy that reproduces the defect it fixes.
//
// TWICE IN ONE QUARTER, BY TWO DIFFERENT AUTHORS, EACH IMMEDIATELY AFTER WRITING ABOUT THE DEFECT.
// Q24's hardening recorded both and neither is carelessness — that is what makes them worth a unit.
//
//   Q24-CR-5. W310 found that the ledger parse matched `^\| (W\d+) \|` and silently dropped two
//   BLOCKED ROWS. Its fix widened the pattern and required a TRAILING DIGIT so the table header
//   would still be rejected — silently dropping `W-MIGRATE`. The remedy for a silent omission was
//   a smaller silent omission, written in the same hour, by the session that had just described it.
//
//   Q24-CR-9. W304 removed the class of assertion that pins a live count to a literal, because
//   ordinary work moves it and the edit is indistinguishable from maintenance. W308, four units
//   later, asserted that a LIVE measurement equals a FROZEN record — and writing Q24's hardening
//   record moved it. The remedy for a pinned count was a pinned count.
//
// SO WHAT IS THE RULE? A fix is an instance of the class it fixes when the fix's own mechanism has
// the defect's DEFINING PROPERTY — not its subject, not its shape, its property. A silent omission
// is defined by *drops something without saying so*; a trailing-digit requirement drops something
// without saying so. A pinned count is defined by *a value ordinary work moves, whose edit reads as
// maintenance*; an equality against a frozen record is a value ordinary work moves. The subject
// changed both times and the property did not, which is exactly why the author could not see it:
// they were checking whether they had fixed the INSTANCE.
//
// THE DETECTOR IS NOT THE RULE AND CANNOT BE. "Does this mechanism have that property" is a
// judgement over arbitrary code. What is mechanical is ONE shape the rule catches, chosen because
// the quarter produced two of them: a live derivation asserted EQUAL to a frozen `*_AT_W<n>`
// record. Every register in this tree that freezes a measurement also builds a way to record
// movement against it — and a bare equality beside that mechanism makes the mechanism unreachable,
// because declaring a movement satisfies the diff and still fails the equality. The remedy is
// defeated by the line next to it.
//
// WHAT THIS DOES NOT PROVE is `REMEDY_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the text of the tree's own test files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { blankLiterals } from "./scan-text";
import { testModules } from "./tree-walks";
import { assertionsIn, enclosingTest } from "./tautology-sweep";
import type { UnitId } from "./typed-names";

/**
 * The rule, stated so a reviewer can apply it to a fix this detector cannot read.
 *
 * Deliberately a SENTENCE rather than a predicate: the mechanical half below covers one shape, and
 * a rule narrowed to what a scan can see would have missed Q24-CR-5 entirely.
 */
export const REMEDY_RULE =
  "A fix is an instance of the class it fixes when the fix's own mechanism has the defect's " +
  "DEFINING PROPERTY — not the same subject and not the same shape, the same property. Ask what " +
  "makes the defect a defect, in one clause, and then ask whether the remedy satisfies that " +
  "clause. A silent omission is *drops something without saying so*, and a trailing-digit " +
  "requirement drops something without saying so. A pinned count is *a value ordinary work moves, " +
  "whose edit reads as maintenance*, and an equality against a frozen record is a value ordinary " +
  "work moves. Both authors checked whether they had fixed the INSTANCE, which is the question " +
  "that cannot see this, and both were writing about the defect at the time.";

/** An assertion comparing something live to a frozen `*_AT_W<n>` record. */
export interface FrozenEquality {
  file: string;
  test: string;
  /** The frozen record the expected side names. */
  record: string;
  text: string;
}

const FROZEN_NAME = /\b([A-Z][A-Z0-9_]*_AT_W\d+)\b/;
const EQUALITY = ["toBe", "toEqual", "toStrictEqual"];

/**
 * Every assertion whose EXPECTED side is a frozen record, compared by equality.
 *
 * Not every one is a defect, which is why the register below argues each rather than the sweep
 * excluding shapes. A frozen record is a historical measurement: comparing a live value to it with
 * equality says *the tree has not moved since*, and the tree always moves.
 */
export function frozenEqualities(root: string): FrozenEquality[] {
  const out: FrozenEquality[] = [];
  for (const file of testModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = stripComments(readFileSync(file, "utf8"));
    for (const a of assertionsIn(code)) {
      if (a.negated || !EQUALITY.includes(a.matcher)) continue;
      const named = FROZEN_NAME.exec(blankLiterals(a.expected));
      if (!named) continue;
      out.push({ file: rel, test: enclosingTest(code, a.index), record: named[1]!, text: a.text });
    }
  }
  return out;
}

/** `file :: test :: record`. No line number — W290's rule. */
export function equalityId(hit: FrozenEquality): string {
  return `${hit.file} :: ${hit.test} :: ${hit.record}`;
}

/** A frozen-record equality kept on purpose. */
export interface ArguedEquality {
  id: string;
  why: string;
}

/**
 * The equalities that are not the defect, each argued.
 *
 * WHAT MAKES ONE ACCEPTABLE IS THAT IT IS A NAMED LIST, and this is the rule applied rather than an
 * exemption invented. The defect's defining property is *a value ordinary work moves, whose edit
 * reads as maintenance* — and the second clause is what a named list fails. A count is satisfied by
 * retyping a digit; a list of names cannot be satisfied without writing down what arrived, so the
 * edit is a decision somebody made rather than a number somebody reconciled. W304 drew the same
 * line from the other side: *a NAMED list moves deliberately, a COUNT moves by accident.*
 *
 * Every entry here is a list. Every instance this unit converted was a number.
 */
export const ARGUED_EQUALITIES: readonly ArguedEquality[] = [
  {
    id: "src/quality/empty-list-sweep.test.ts :: reports its own measurement instead of asserting one :: UNEVIDENCED_AT_W293",
    why: "A NAMED LIST, not a number, and the distinction is the rule's own clause. A count is satisfied by retyping a digit, which is why its edit reads as maintenance; this list cannot be satisfied without WRITING what arrived — the file, the test and the source that produced an unevidenced empty-list assertion. W290 classified it `live_by_design` for the same reason: the event that moves it is one somebody has to look at.",
  },
  {
    id: "src/quality/mutation-sampling.test.ts :: names the modules it cannot sample, rather than leaving them out quietly :: UNTESTED_AT_W296",
    why: "The same shape: a module arriving with no sibling suite is named here or the build stops, and naming it is a decision rather than a digit. W296's whole argument is that a module the sampler cannot reach must be visible, so an equality is the control.",
  },
  {
    id: "src/quality/quarter-mutants.test.ts :: catches every mutant but the ones this register names :: SURVIVORS_AT_W332",
    why: "The same shape as W296's row below and right for the same reason: a NAMED LIST of surviving mutants, each with a kind and an argument. A new survivor over the quarter's modules cannot be absorbed by editing a total — it has to be described, and describing it means reading the change nothing noticed. That is exactly what the frozen-number shape allows and this does not.",
  },
  {
    id: "src/quality/mutation-sampling.test.ts :: catches all but the survivors this register names :: SURVIVORS_AT_W296",
    why: "A named list of surviving mutants, each with a kind and an argument. A new survivor cannot be absorbed by editing a total — it has to be described — which is precisely what the frozen-number shape allows and this does not.",
  },
  {
    id: "src/quality/pins.test.ts :: is the blocked surface and the unproven set, both of which really do fire :: UNPROVEN_AT_W290",
    why: "W267's unproven walks, by name. A register arriving unproven is W267's own event and stopping the build for it is the control rather than the noise — W290 says so in the classification this assertion checks.",
  },
  {
    id: "src/quality/pins.test.ts :: is the blocked surface and the unproven set, both of which really do fire :: UNTESTED_AT_W296",
    why: "The same list read from W290's side, asserting that the pin it classifies `live_by_design` really is live. Both sides are named lists and neither can be satisfied by a number.",
  },
];

export interface EqualityDiff {
  /** A live value measured against a frozen record with nothing arguing for it. */
  unargued: string[];
  /** An argued equality the sweep no longer finds. */
  stale: string[];
}

/** Both directions, W102's shape. */
export function equalityDiff(
  root: string,
  argued: readonly ArguedEquality[] = ARGUED_EQUALITIES,
): EqualityDiff {
  const found = frozenEqualities(root).map(equalityId);
  const ids = new Set(argued.map((a) => a.id));
  return {
    unargued: found.filter((id) => !ids.has(id)).sort(),
    stale: [...ids].filter((id) => !found.includes(id)).sort(),
  };
}

/** A remedy this tree shipped that carried the defect it was fixing. */
export interface SelfDefeating {
  id: string;
  /** The unit whose fix it was. */
  unit: UnitId;
  /** The defining property, in one clause — the thing the rule asks for. */
  property: string;
  defect: string;
  remedy: string;
  /** How the tree shows it is fixed now, so a fixed instance goes stale rather than sitting here. */
  rederived: string;
}

export const SELF_DEFEATING: readonly SelfDefeating[] = [
  {
    id: "Q24-CR-5",
    unit: "W310",
    property: "drops something without saying so",
    defect:
      "The ledger parse every register shared matched `^\\| (W\\d+) \\|`, so `SUP-1` and `SUP-2` — two BLOCKED rows — were invisible to the blocked-surface budget, to every release path, and to the founder's page. They had been invisible for two years.",
    remedy:
      "W310 widened the id and required a TRAILING DIGIT so the table's own header would still be rejected, which silently dropped `W-MIGRATE`. The requirement was not even necessary: `Unit` is not all-caps, so the header fails to match anyway. W311 removed it.",
    rederived:
      "`allLedgerRows` returns `W-MIGRATE` and does not return `Unit`, which is asserted in W311's register. If the trailing digit comes back, that assertion fails and this row's remedy is live again.",
  },
  {
    id: "Q24-CR-9",
    unit: "W308",
    property: "a value ordinary work moves, whose edit reads as maintenance",
    defect:
      "W304 removed the class of assertion that pins a declared register's size to a literal: the register has N entries because N things were declared, so a legitimate addition fails the check and the edit that follows is indistinguishable from maintenance.",
    remedy:
      "W308's re-measurement asserted that a live count EQUALS a frozen figure. Writing Q24's hardening record moved it — a finding that merely discusses a module counts as a file naming it — and W311 converted that one to a floor. This unit found the same shape twice more, in the same file and in W313's.",
    rederived:
      "`equalityDiff` reports every live-versus-frozen equality the tree still holds, and its `unargued` arm must be empty. The two instances this unit found are converted rather than accepted; the two remaining are record-versus-record and argued.",
  },
];

/** What a green sweep does not prove. */
export const REMEDY_BOUND =
  "The RULE is a sentence and the sweep is a lone shape. `equalityDiff` reads assertions comparing " +
  "a live value to a frozen `*_AT_W<n>` record, which is the shape Q24 produced more than once — " +
  "and it would not have caught Q24-CR-5 at all, because a trailing-digit requirement in a regex " +
  "has nothing in common with an assertion except the property the rule names. Nothing here reads " +
  "a fix and asks whether it carries its own defect; that is a judgement over arbitrary code and " +
  "this unit does not pretend otherwise. AND THE SWEEP CANNOT SEE MORE THAN `assertionsIn` " +
  "RETURNS, which is not proven exhaustive: while W317 was being written, an assertion plainly " +
  "present in a test file was not returned by that parse, and the shape responsible was not " +
  "reproducible in a planted fixture. Every sweep built on it — W288's tautologies, W293's empty " +
  "lists, W304's register counts — inherits the same ceiling and none of them says so. What the " +
  "sweep buys is that a recurring shape stops recurring; what the rule buys is that a reviewer has " +
  "the question written down.";

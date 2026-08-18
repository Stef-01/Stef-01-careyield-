// W324: Q25's gate — every claim class the horizon names, answered by a check that reports or
// argued away in the document's own words.
//
// THE QUARTER SET ITSELF A GATE THAT IS NOT A NUMBER, on purpose. Q24's was a number, the number
// went the wrong way, and its close says the instrument rather than the work was wrong. So
// `docs/HORIZON-Q25.md` says instead: *every claim class named in this document is either driven or
// declared unprovable with its reason*, and W324 re-reads the list rather than a total.
//
// RE-READING IS THE WHOLE JOB, AND IT IS NOT THE SAME AS RE-RUNNING THE SUITE. Every unit of this
// quarter is green; that is not the question. The question is whether the class each unit was
// written to make checkable is checkable NOW — whether the check still exists, and whether it
// still REPORTS. A register that returns an empty list because it can no longer see its subject is
// the exact failure Q25 was called after: a claim that reads as checked and is not.
//
// SO EVERY ANSWER IS DRIVEN RATHER THAN CITED. `reports()` hands each check the smallest input that
// should make it speak, and the answer counts only if the check speaks. A rename, a narrowed
// pattern, a scan that stops reaching its surface — each turns a green register into a silent one,
// and each fails here.
//
// AND NOT EVERY ROW IS A CLAIM CLASS. The horizon plans product work under the founder gates as
// well, and says so in the sentence this register quotes back at it. An answer that argues a row
// away carries the phrase from the document that argues it, checked against the document — so the
// argument cannot outlive the sentence it rests on, and cannot be a matter of opinion here.
//
// WHAT THIS DOES NOT PROVE is `CLAIM_CLASS_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads a planning document and drives registers.

import { readFileSync } from "node:fs";
import path from "node:path";
import { refusalDefects } from "@/demo/path";
import { founderDiff } from "@/founder/outstanding";
import { sinceReading } from "@/founder/second-reading";
import { parseLedgerRows } from "./blocked-surface";
import { CLOSING_CHECKS } from "./closing-state";
import { TAX_AT_W300, taxDiff } from "./declaration-tax";
import { overdueDispositions } from "./hardening-q22";
import { claimDefects } from "./prose-numbers";
import { vocabularyDefects } from "./assertion-vocabulary";
import { equalityDiff } from "./self-defeating";
import { tautologiesIn } from "./tautology-sweep";
import { headerSubjectDefects } from "./unit-headers";
import type { UnitId } from "./typed-names";

/** The document this unit re-reads. */
export const HORIZON = "docs/HORIZON-Q25.md";

/** A unit id, as the ledger spells it. W318's type, used here for the same reason. */
// W342: the type lives in `typed-names.ts` now — it had been written three times.
export type { UnitId };

/** A row of the horizon's unit table: the class, as the document names it. */
export interface HorizonClass {
  unit: string;
  /** The `What` cell, verbatim. */
  what: string;
}

/**
 * The classes the horizon names, read from its unit table.
 *
 * DERIVED RATHER THAN LISTED, because a hand-copied list of the classes a document names is the
 * kind of second copy this quarter exists to stop. The gate table above it starts its rows with a
 * gate id and the requirement table with a digit, so the unit table is the only one this matches.
 */
export function classesInHorizon(root: string): HorizonClass[] {
  const doc = readFileSync(path.join(root, HORIZON), "utf8");
  return [...doc.matchAll(/^\| (W\d+) \| (.+?) \|$/gm)].map((m) => ({ unit: m[1]!, what: m[2]!.trim() }));
}

/** The document with its markers stripped, so a quoted phrase is matched as text and not as markup. */
function horizonText(root: string): string {
  return readFileSync(path.join(root, HORIZON), "utf8")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * How a class is answered.
 *
 * `driven` is the only arm that proves anything on its own. The other three are arguments, and each
 * carries what makes it checkable: a phrase from the horizon, or a unit whose landing ends it.
 */
export type Answer =
  | {
      kind: "driven";
      /** The module holding the check, relative to the root. */
      module: string;
      /** The exported name. Checked against the module, so a rename fails here. */
      check: string;
      /** What the smallest speaking input is, for a reader who wants to know what was driven. */
      how: string;
      /** True when the check REPORTS, given that input. A false answer is a silent register. */
      reports: (root: string) => boolean;
    }
  | { kind: "unprovable"; why: string; cites: string }
  | { kind: "pending"; by: UnitId; why: string }
  | { kind: "not_a_claim_class"; why: string; cites: string };

export interface ClassAnswer {
  unit: string;
  answer: Answer;
}

/**
 * Declare an answer, refusing one that argues nothing.
 *
 * A runtime refusal rather than a type, for W210's reason: `why: ""` typechecks, and an argument
 * that is an empty sentence is exactly what a gate phrased as *declared with its reason* is for.
 */
export function declareAnswer(answer: ClassAnswer): ClassAnswer {
  const a = answer.answer;
  if (a.kind !== "driven" && a.why.trim().length < 80) {
    throw new Error(`${answer.unit} is argued away in fewer words than the argument needs`);
  }
  if ((a.kind === "unprovable" || a.kind === "not_a_claim_class") && a.cites.trim().length === 0) {
    throw new Error(`${answer.unit} argues from the horizon and quotes none of it`);
  }
  return answer;
}

const PLANTED_MODULE = "src/planted/w324-probe.ts";

/**
 * Every class, answered.
 *
 * THE DRIVES ARE DELIBERATELY THE CHEAPEST INPUT THAT SPEAKS, not the register's ordinary entry
 * point. Several of these walk the whole tree when called the usual way, and a gate that costs a
 * tree walk per class is a gate somebody moves out of the suite. Where a check takes its subject as
 * a parameter, the subject handed in is a fabrication; where it does not, the smallest real call is
 * used. Either way what is asserted is the same thing: it SPOKE.
 */
export const CLASS_ANSWERS: readonly ClassAnswer[] = [
  declareAnswer({
    unit: "W313",
    answer: {
      kind: "driven",
      module: "src/quality/declaration-tax.ts",
      check: "taxDiff",
      how: "a live measurement one higher than the frozen baseline, with no movement declared for it",
      reports: () => taxDiff({ ...TAX_AT_W300, plain: TAX_AT_W300.plain + 1 }, TAX_AT_W300, []).unaccounted.length > 0,
    },
  }),
  declareAnswer({
    unit: "W314",
    answer: {
      kind: "driven",
      module: "src/quality/prose-numbers.ts",
      check: "claimDefects",
      how: "one fabricated prose claim against an empty declaration list",
      reports: (root) =>
        claimDefects(root, [], [{ module: PLANTED_MODULE, where: "header", text: "four harnesses", number: 4 }])
          .length > 0,
    },
  }),
  declareAnswer({
    unit: "W315",
    answer: {
      kind: "driven",
      module: "src/quality/closing-state.ts",
      check: "CLOSING_CHECKS",
      how: "a closing row whose SHA cell reads PENDING, which is the defect every unit of Q24 shipped",
      reports: (root) => {
        const check = CLOSING_CHECKS.find((c) => c.id === "sha-shape");
        const row = "| W900 | done | builder-A | 2026-01-01T00:00Z | PENDING | a row that closes on nothing |";
        return check !== undefined && check.run(row, root, "W900").length > 0;
      },
    },
  }),
  declareAnswer({
    unit: "W316",
    answer: {
      kind: "driven",
      module: "src/quality/tautology-sweep.ts",
      check: "tautologiesIn",
      how: "the length of a mapped list against the length of the list it was mapped from",
      reports: () => tautologiesIn(PLANTED_MODULE, "expect(xs.map(f).length).toBe(xs.length);\n").length > 0,
    },
  }),
  declareAnswer({
    unit: "W317",
    answer: {
      kind: "driven",
      module: "src/quality/self-defeating.ts",
      check: "equalityDiff",
      how: "an argued equality naming a test the suite does not hold",
      reports: (root) =>
        equalityDiff(root, [{ id: `${PLANTED_MODULE} :: nothing :: nothing`, why: "x".repeat(80) }]).stale.length > 0,
    },
  }),
  declareAnswer({
    unit: "W318",
    answer: {
      kind: "driven",
      module: "src/quality/hardening-q22.ts",
      check: "overdueDispositions",
      how: "a finding deferred to a unit the handed-in ledger already closes",
      reports: () =>
        overdueDispositions("| W900 | done | builder-A | 2026-01-01T00:00Z | abc1234 | landed |", [
          {
            id: "W324-PROBE",
            lens: "code-review",
            unit: "W324",
            what: "a fabrication, handed in so the clock has something to run out on",
            raisedOn: "2026-01-01",
            disposition: { kind: "deferred", why: "deferred to a unit that has landed", by: "W900" },
          },
        ], "2026-01-01").length > 0,
    },
  }),
  declareAnswer({
    unit: "W319",
    answer: {
      kind: "driven",
      module: "src/founder/outstanding.ts",
      check: "founderDiff",
      how: "the live ledger against an empty set of release paths, so every blocked row is one nothing renders",
      reports: (root) => founderDiff(root, []).unrendered.length > 0,
    },
  }),
  declareAnswer({
    unit: "W320",
    answer: {
      kind: "driven",
      module: "src/quality/unit-headers.ts",
      check: "headerSubjectDefects",
      how: "a declared citation against no files at all, so the declaration is one the tree cannot hold",
      reports: (root) => headerSubjectDefects(root, [`${PLANTED_MODULE}::NOTHING_BOUND`], []).length > 0,
    },
  }),
  declareAnswer({
    unit: "W321",
    answer: {
      kind: "not_a_claim_class",
      why:
        "The demo path's second scenario is product work under the founder gates, not a claim this tree makes about itself. The horizon plans it as an extension of W309, and its check is a walk of pages rather than a reading of claims — so answering it here would be counting a unit rather than re-reading a class.",
      cites: "W321 and W322 extend them by exactly as much as can be extended without a ruling",
    },
  }),
  declareAnswer({
    unit: "W322",
    answer: {
      kind: "not_a_claim_class",
      why:
        "The founder's page reading a second time is product work under the same sentence, for the same reason. What it derives is what the ledger says moved, which is a statement about the build rather than a statement this tree makes about its own checks.",
      cites: "W321 and W322 extend them by exactly as much as can be extended without a ruling",
    },
  }),
  declareAnswer({
    unit: "W323",
    answer: {
      kind: "driven",
      module: "src/quality/assertion-vocabulary.ts",
      check: "vocabularyDefects",
      // WRITTEN AS `pending` AND EXPIRED ONE FIRING LATER, in the tree rather than in a test. The
      // arm said the answer must become a driven one the day the ledger closed W323's row; a
      // sibling session closed it, and this gate went red on the next pull for exactly that reason.
      // Recorded here because a clock that has been seen running is worth more than one argued.
      how: "the live suite against a canonical spelling that is not the one this tree chose, so every site is a site in the wrong form",
      reports: (root) => vocabularyDefects(root, "count >= 1").length > 0,
    },
  }),
  declareAnswer({
    unit: "W324",
    answer: {
      kind: "not_a_claim_class",
      why:
        "This register. A gate that answered itself would be the tautology class W316 was written for, in the one place it would be hardest to see — and the horizon names this row as the re-reading rather than as one of the things re-read.",
      cites: "W324 re-reads the list rather than a total",
    },
  }),
  declareAnswer({
    unit: "W325",
    answer: {
      kind: "not_a_claim_class",
      why:
        "The quarter close expands the next quarter under the horizon rule. It states a position and plans work; it makes no claim about this tree's checks, and the rule it runs under is checked by its own horizon test rather than here.",
      cites: "W325 expands it when it arrives",
    },
  }),
];

/** One line per way the gate fails, for a class the horizon names or an answer that outlived it. */
export interface ClassDefect {
  unit: string;
  what: string;
}

/**
 * The gate: every class named, answered; every answer, still standing.
 *
 * BOTH DIRECTIONS, because a register that only checks the classes it was given cannot notice one
 * arriving, and one that only checks its own list cannot notice one leaving. The third direction is
 * the one this quarter adds: an answer that names a check is only an answer while the check speaks.
 */
export function classDefects(
  root: string,
  declared: readonly ClassAnswer[] = CLASS_ANSWERS,
  found: readonly HorizonClass[] = classesInHorizon(root),
): ClassDefect[] {
  const out: ClassDefect[] = [];
  const answered = new Map(declared.map((d) => [d.unit, d.answer]));
  const named = new Set(found.map((c) => c.unit));

  for (const cls of found) {
    if (!answered.has(cls.unit)) out.push({ unit: cls.unit, what: "is named in the horizon and answered nowhere" });
  }

  for (const { unit, answer } of declared) {
    if (!named.has(unit)) {
      out.push({ unit, what: "is answered here and the horizon names no such class" });
      continue;
    }
    if (answer.kind === "driven") {
      const module = path.join(root, answer.module);
      const body = readFileSync(module, "utf8");
      if (!new RegExp(`export (function|const|interface|type) ${answer.check}\\b`).test(body)) {
        out.push({ unit, what: `names \`${answer.check}\`, which \`${answer.module}\` does not export` });
      } else if (!answer.reports(root)) {
        out.push({ unit, what: `drives \`${answer.check}\` with an input it should report, and it says nothing` });
      }
    }
    if (answer.kind === "pending") {
      const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
      const row = parseLedgerRows(ledger).find((r) => r.id === answer.by);
      if (row?.status === "done") out.push({ unit, what: `waits on ${answer.by}, which has landed` });
    }
    if (answer.kind === "unprovable" || answer.kind === "not_a_claim_class") {
      // ONE ARM, NOT TWO. The draft also asked whether this module's source held the phrase, which
      // it does by construction — `cites` IS a literal in this file — so the check was true for
      // every input it could ever be given. W316's class, written into W324's own gate.
      const quoted = answer.cites.replace(/[`*]/g, "").replace(/\s+/g, " ").trim();
      if (!horizonText(root).includes(quoted)) {
        out.push({ unit, what: "argues from a sentence the horizon does not contain" });
      }
    }
  }

  return out.sort((a, b) => `${a.unit}${a.what}`.localeCompare(`${b.unit}${b.what}`));
}

/** What this gate does not prove. */
export const CLAIM_CLASS_BOUND =
  "A driven answer proves the check speaks when handed an input built to make it speak. It does " +
  "not prove the check would speak about the tree — the input is a fabrication, and a register " +
  "narrowed until only fabrications reach it passes here exactly as a register in good health " +
  "does. That gap is covered where each register lives, by the planted probes its own suite runs, " +
  "and this gate deliberately does not repeat them: re-running every suite is what the suite is " +
  "for. So where a register goes quiet with its own suite still running, this gate is the SECOND " +
  "failure and not the first — narrowing the vocabulary W316 reads fails W316 here and fails it " +
  "there, and there is where a reader should look. What is added is the reading BETWEEN a " +
  "document and the checks: a register deleted along with its suite takes its own alarm with it, " +
  "and the class the horizon planned then goes unanswered with nothing else in this tree to say " +
  "so. Nor does this read the arguments: a row argued away carries a phrase from the horizon and " +
  "the phrase is checked, but whether the sentence ARGUES what the answer says it argues is a " +
  "judgement no check makes, and a horizon rewritten to suit an answer would satisfy this gate.";

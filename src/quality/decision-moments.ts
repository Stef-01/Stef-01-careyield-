// W387: the product's moments — when a rule decides about a patient.
//
// Q30 HAS BEEN ASKING WHEN A CHECK RUNS. W378 read the moment out of the harness for every check in
// the census; W382 asked whether a hook's failure can reach the moment it is wired to; W385 found
// what a run shares between its files. This asks the same question of the thing being built, where
// being wrong stops being a build defect: WHEN is a decision about a patient taken, and when was
// the state it was taken on last looked at?
//
// A GUARD IS A MOMENT, NOT A PROPERTY. `evaluateEligibility` refuses a patient who opted out, who
// has a booking inside the block window, who was seen too recently, who has had too many invites
// this quarter. Every one of those is a statement about a DATE — it takes `todayIso` and answers
// for that day and no other. Run it on Monday and the answer is Monday's.
//
// SO A RULE HANDED AN ALREADY-GUARDED SET, THAT THEN NAMES A MOMENT OF ITS OWN, IS DECIDING AT ONE
// MOMENT ON A GUARD TAKEN AT ANOTHER. `buildInvitationPool(sessionDate, clinician, openAppointments,
// eligible, config)` is exactly that shape and it is the only one in this tree: `eligible` was
// filtered by somebody else at some date this function cannot see, and `sessionDate` is a different
// date it uses to size and stamp the batch. The simulation calls the guard once per week and pools
// per session date, so the gap is up to six days — long enough for a patient's future booking to
// come inside the block window, which is the case the suite drives on the synthetic cohort.
//
// THE OTHER PRE-GUARDED RULES NAME NO MOMENT AND ARE FINE FOR THAT REASON. `rankCandidates`,
// `rankGapAware` and `gapShareOfBatch` are handed a filtered set and reorder or measure it. They
// take no date, so they cannot decide at a different one from their caller; they inherit the
// caller's moment, whatever it is, which is the property this register is looking for.
//
// WHAT THIS DOES NOT PROVE is `DECISION_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): ABSOLUTE AND CENTRAL HERE. Every patient this register's suite touches
// comes from `generatePractice`, seeded and deterministic. No real record is read, no message is
// sent, and the runs are handed in by the suite rather than imported, so this module reaches no
// product code at all.
//
// NOTHING IS IMPORTED THAT REACHES `bounds.ts`, per W367.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { patientRules } from "./patient-populations";

/** What a rule is handed to decide about. */
export type Input =
  /** The panel, unfiltered. The rule applies its own guard or applies none. */
  | "the_whole_panel"
  /** A set somebody else already filtered — the guard ran before this call, at its own moment. */
  | "an_already_guarded_set"
  /** Two readings of the same panel, compared. */
  | "a_pair_of_snapshots";

/** One patient-selecting rule, with when it decides and what it decides about. */
export interface Decision {
  /** `module::function`, as W373's population spells it. */
  rule: string;
  /**
   * The parameter that says when the decision is taken, or null when the rule names no moment.
   *
   * A rule with no moment of its own inherits its caller's, which is what makes the pure orderings
   * safe: they cannot be at a different instant from the guard, because they are at no instant.
   */
  decidesAt: string | null;
  reads: Input;
}

/** Parameter names this tree gives a moment. Each is an ISO date or datetime the caller chooses. */
const MOMENT_NAMES = /^(?:todayIso|nowIso|atIso|sentAtIso|sessionDate|asOfIso|window)$/;

/**
 * Parameter names this tree gives a set somebody else has already filtered.
 *
 * READ WITH THE TYPE AND NOT ALONE, which the first draft got wrong: `buildBackfillPool` takes
 * `pool: PoolConfig` — a configuration — and the name alone put it in the report beside the rule
 * this unit is actually about. It is the contrast case rather than an instance: it takes the whole
 * panel and calls `eligibleForClinician` itself, at its own `todayIso`, which is the shape that
 * cannot have this defect.
 */
const GUARDED_NAMES = /^(?:eligible|candidates|batch|shortlist)$/;

/** One parameter, as written. */
export interface Parameter {
  name: string;
  /** Everything after the colon, trimmed. Empty when the parameter is untyped. */
  type: string;
}

/** The parameter list of `fn` in `source`, comments subtracted so a doc block cannot split it. */
export function parametersOf(source: string, fn: string): Parameter[] {
  const code = prepareForScan(source, { comments: "subtracted", literals: "kept" });
  const opened = new RegExp(String.raw`^export function ${fn}\s*\(`, "m").exec(code);
  if (opened === null) return [];
  let depth = 0;
  let i = opened.index + opened[0].length - 1;
  let last = i + 1;
  const names: string[] = [];
  for (; i < code.length; i += 1) {
    const c = code[i]!;
    if ("({[<".includes(c)) depth += 1;
    else if (")}]>".includes(c)) {
      depth -= 1;
      if (depth === 0) break;
    } else if (c === "," && depth === 1) {
      names.push(code.slice(last, i));
      last = i + 1;
    }
  }
  names.push(code.slice(last, i));
  return names
    .map((p) => {
      const at = p.indexOf(":");
      const name = (at === -1 ? p : p.slice(0, at)).trim();
      return { name, type: at === -1 ? "" : p.slice(at + 1).trim() };
    })
    .filter((p) => /^[A-Za-z_$][\w$]*$/.test(p.name));
}

/**
 * Every patient-selecting rule, with the moment it decides at and what it is handed.
 *
 * THE POPULATION IS W373'S, NOT A SECOND LIST. That register derives every exported function
 * outside the build machinery whose parameters name a collection of `Patient`, so a rule arriving
 * joins both without anybody editing either — and the two cannot drift apart into disagreeing
 * about which functions decide about patients.
 */
export function decisions(root: string, rules: readonly string[] = patientRules(root)): Decision[] {
  return rules
    .map((rule) => {
      const [rel, fn] = rule.split("::");
      const source = readFileSync(path.join(root, rel!), "utf8");
      const params = parametersOf(source, fn!);
      // THE NAME AND THE TYPE TOGETHER. A parameter is a guarded PANEL only if it holds patients;
      // `pool: PoolConfig` is a configuration and reading the name alone put it in the report.
      const holdsPatients = (p: Parameter) => /\bPatient\b/.test(p.type);
      const guarded = params.some((p) => GUARDED_NAMES.test(p.name) && holdsPatients(p));
      const named = params.map((p) => p.name);
      // `before`/`after` is a comparison of two readings rather than a selection from one.
      const snapshots = named.includes("before") && named.includes("after");
      return {
        rule,
        decidesAt: params.find((p) => MOMENT_NAMES.test(p.name))?.name ?? null,
        reads: snapshots
          ? ("a_pair_of_snapshots" as const)
          : guarded
            ? ("an_already_guarded_set" as const)
            : ("the_whole_panel" as const),
      };
    })
    .sort((a, b) => a.rule.localeCompare(b.rule));
}

/**
 * Every rule deciding at a moment of its own about a set somebody else guarded at another.
 *
 * THE RULE IS THE WHOLE UNIT AND IT IS NARROW ON PURPOSE. A rule handed the panel applies its own
 * guard at its own moment, so its decision and its guard are the same instant by construction. A
 * rule handed a filtered set and naming no date inherits whatever instant its caller was at. Only
 * the two together — a filtered set AND a date of this rule's own — put a decision at an instant
 * the guard did not answer for, and that gap is measured on the synthetic cohort rather than
 * argued: the suite guards on one day, pools on a later one, and names the patient invited whom
 * the guard would now refuse.
 */
export function staleGuards(root: string, rows: readonly Decision[] = decisions(root)): string[] {
  return rows
    .filter((d) => d.reads === "an_already_guarded_set" && d.decidesAt !== null)
    .map((d) => d.rule)
    .sort();
}

/** A rule deciding on a guard taken at another moment, with what the gap costs a patient. */
export interface StaleGuard {
  rule: string;
  /** The parameter naming the decision's own moment. */
  decidesAt: string;
  /** What can change between the guard and the decision, and who it reaches. */
  costs: string;
}

/**
 * The rules this product decides with on a guard somebody else took, each argued.
 *
 * A NAMED LIST AND NOT A COUNT, which is W290's rule: a second rule of this shape has to arrive in
 * a diff somebody reads, and a rule that starts re-guarding has to leave.
 */
export const STALE_AT_W387: readonly StaleGuard[] = [
  {
    rule: "src/engine/pool.ts::buildInvitationPool",
    decidesAt: "sessionDate",
    costs:
      "`eligible` was filtered by `eligibleForClinician` at a `todayIso` this function never sees, and `sessionDate` is a different day it uses to size and stamp the batch. In the simulation the guard runs once per week and the pool runs per session date, so the two are up to six days apart. Every exclusion `evaluateEligibility` applies is a statement about a DATE — a future booking comes inside the block window as the day approaches, an invite cap turns over, a recall opens — so a patient the guard admitted on Monday can be one it would refuse on Friday, and the pool invites them anyway. What it costs is a message to somebody the product's own rule says should not get one, which is the class §4's gates exist for and the reason this is a product row rather than a build row. The remedy is a decision that re-reads its guard at its own moment, which is a change to the calling shape rather than to this function, and it is not built.",
  },
];

export interface MomentDiff {
  /** A rule deciding on a guard taken elsewhere that no row names. */
  undeclared: string[];
  /** A row for a rule that has started re-guarding, or that the tree no longer holds. */
  stale: string[];
}

/** Both directions, so a second stale guard cannot arrive quietly and a fixed one cannot stay. */
export function momentDiff(
  root: string,
  declared: readonly StaleGuard[] = STALE_AT_W387,
  rows: readonly Decision[] = decisions(root),
): MomentDiff {
  const found = new Set(staleGuards(root, rows));
  const named = new Set(declared.map((d) => d.rule));
  return {
    undeclared: [...found].filter((r) => !named.has(r)).sort(),
    stale: [...named].filter((r) => !found.has(r)).sort(),
  };
}

export const DECISION_BOUND =
  "A MOMENT IS FOUND BY THE NAME OF A PARAMETER. `todayIso`, `sessionDate`, `atIso` — this tree " +
  "names its dates consistently and this register reads that habit, not the types. A rule taking " +
  "its instant inside a config object, or from a clock instead of a caller, names no moment here " +
  "and reads as inheriting whatever its caller was at. It runs the other way too: a parameter " +
  "called `window` is counted as a moment and is really a pair of them. SECOND, IT ASKS WHETHER " +
  "THE MOMENTS DIFFER AND NOT WHETHER THE GAP MATTERS. `sessionDate` and the guard's `todayIso` " +
  "are the same day in a caller that pools on the day it guards, and this register cannot see a " +
  "caller at all — it reads signatures. What the suite measures is that the gap CAN open on the " +
  "synthetic cohort and what it costs when it does, which is a demonstration rather than a claim " +
  "about production, where nothing runs. THIRD, `an_already_guarded_set` IS A NAME AND A TYPE AND " +
  "STILL NOT A DERIVATION. `eligible` is what this tree calls a filtered panel; a rule taking " +
  "such a set under another name is outside the population, and a rule whose `eligible` really " +
  "holds an unfiltered panel is inside it wrongly. FOURTH, THE GUARD ITSELF IS NOT READ. Nothing here " +
  "opens `evaluateEligibility` to ask which of its exclusions depend on the date it is handed; " +
  "the row below says they do, a person wrote that sentence, and the suite drives just the " +
  "future-booking window. The remedy is the guard read rather than described.";

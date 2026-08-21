// W373: the product's populations — which patients a rule is over.
//
// Q29 HAS SPENT ITS UNITS ON THE BUILD'S POPULATIONS and this is the same question asked of the
// thing being built. W365 recorded what each check walks; W367 read each bound against its walk;
// W369 asked what an empty set means. Underneath all three is one shape — a rule is handed a
// population and answers with a subset — and the product is full of them. This register is over
// the rules handed PATIENTS, because that is where being wrong stops being a build defect.
//
// THE POPULATION IS DERIVED FROM THE SIGNATURES: every exported function outside the build
// machinery whose parameters name a collection of `Patient`. A rule arriving joins whether or not
// anybody adds a row, which is the only shape that survives the product growing.
//
// AND WHAT EACH ONE DOES IS MEASURED, NOT DESCRIBED. Every row carries a run over a synthetic
// practice, and the run's input and output ids decide the class: NARROWS when the answer is a
// proper subset, REORDERS when it is the same set in some order, MEASURES when no patient set comes
// back at all. A row saying `reorders` for a function that has started dropping people fails here,
// which is the failure a ranking layer is most likely to have — `buildInvitationPool` even says so
// in its own comment, that whatever ranks must be a PERMUTATION, because ordering is not the place
// to add or remove a recipient. Nothing in this tree checked that until now.
//
// THE COPY IS THE OTHER HALF. `app/console/rules/page.tsx` tells a practice "Patients outside these
// rules are never invited", which is a claim about a population rather than about a form. A row
// carrying such a claim resolves the quote against the file that renders it — a claim nobody
// resolved is worth what W258 says it is worth — and says whether the rule's reach is `no_wider`
// than the sentence or `wider`, which is the finding.
//
// WHAT IT FOUND is below in the rows: the two ranking functions are the ones a practice would be
// hurt by silently, and both are now measured against the panel they are handed rather than trusted.
//
// WHAT THIS DOES NOT PROVE is `RULE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): ABSOLUTE AND CENTRAL HERE. Every patient this register touches comes from
// `generatePractice`, the synthetic generator, seeded and deterministic. No real patient record is
// read, no message is sent, and no rule is run against anything but the generated cohort. The runs
// are handed in by the suite rather than imported, so this module reaches no product code at all.
//
// NOTHING IS IMPORTED THAT REACHES `bounds.ts`, per W367.

import { readFileSync } from "node:fs";
import path from "node:path";
import { sourceModules } from "./tree-walks";

/** Directories whose functions are build machinery rather than product rules. */
export const NOT_PRODUCT = ["src/quality/", "src/sim/", "src/synthetic/", "src/demo/"];

/**
 * A signature's parameter list, up to the parenthesis that closes it.
 *
 * W383: `[^)]*` STOPPED AT THE FIRST `)`, WHICH IS NOT THE END OF A PARAMETER LIST. A rule taking a
 * callback — `(pick: (p: Patient) => boolean, panel: Patient[])` — or an object with a function in
 * it truncated to `pick: (p: Patient`, and the panel in the SECOND parameter went unseen. Reading to
 * the parenthesis before the return type or the body reaches the whole list.
 */
const SIGNATURE = /^export function (\w+)\(([\s\S]*?)\)\s*(?::|\{)/gm;

/**
 * A parameter typed as a collection of patients, in every spelling this tree can write it.
 *
 * W383, AND IT WAS WRONG IN BOTH DIRECTIONS. `Patient\s*\[\]` had no left boundary, so
 * `SyntheticPatient[]` counted as a patient panel; and it knew one spelling, so
 * `ReadonlyArray<Patient>` and `Array<Patient>` did not count at all. Neither error costs anything
 * today — no product rule in this tree is written either way, which is why nothing caught it — and
 * that is exactly the state this register must not be in. It decides which product rules are over a
 * patient panel, so a rule that escapes the population escapes SILENTLY: nothing else in the tree
 * would report it missing. W366 is the unit that named this class and landed in the same quarter.
 */
const PANEL = /(?<![A-Za-z])(?:readonly\s+)?(?:Patient\s*\[\]|(?:Readonly)?Array\s*<\s*Patient\s*>)/;

/**
 * Every product rule handed a collection of patients.
 *
 * Read from the signature, because that is what "is over" means before anything runs: a function
 * given `Patient[]` has the panel in its hands whatever it does with it.
 */
export function patientRules(root: string): string[] {
  const out: string[] = [];
  for (const file of sourceModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (NOT_PRODUCT.some((d) => rel.startsWith(d))) continue;
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(SIGNATURE)) {
      if (PANEL.test(m[2]!)) out.push(`${rel}::${m[1]!}`);
    }
  }
  return out.sort();
}

/** What one rule did when it was run over a synthetic practice. */
export interface RuleRun {
  /** Patient ids handed in. */
  from: readonly string[];
  /** Patient ids that came back, or null when the rule answers with no patient set. */
  selected: readonly string[] | null;
}

/** What a rule does to the population it is handed, decided by running it. */
export type Effect =
  /** Answers with a proper subset: a selection rule. */
  | "narrows"
  /** Answers with the same set, in some order. Ordering is not the place to add or remove anybody. */
  | "reorders"
  /** Answers with no patient set at all — a count, a report, a check. */
  | "measures";

/** How the rule's reach stands against what the product's copy tells a practice. */
export type Scope =
  /** The copy names a population at least as wide as the rule's. */
  | { kind: "no_wider" }
  /** THE FINDING: the rule reaches people the sentence does not cover. */
  | { kind: "wider"; why: string };

export interface PatientRule {
  /** `module::export`, as `patientRules` spells it. */
  rule: string;
  /** The population it is handed, in the product's own terms. */
  selectsFrom: string;
  effect: Effect;
  /** A sentence the product shows a practice about who this reaches, resolved against its file. */
  claims: { file: string; quote: string } | null;
  scope: Scope;
}

export interface RuleDefect {
  rule: string;
  what: string;
}

/** What a run over the synthetic practice says the rule did. */
export function effectOf(run: RuleRun): Effect {
  if (run.selected === null) return "measures";
  const from = new Set(run.from);
  const selected = new Set(run.selected);
  if (selected.size === from.size && [...selected].every((id) => from.has(id))) return "reorders";
  return "narrows";
}

/**
 * Every product rule handed patients, with what it does to them.
 *
 * `selectsFrom` and the copy quote are a person's words; `effect` is not — it is re-derived from a
 * run on every build, so a row cannot describe a rule the code has stopped being.
 */
export const RULES_AT_W373: readonly PatientRule[] = [
  {
    rule: "src/engine/arm-stability.ts::armDrift",
    selectsFrom: "two snapshots of the same panel, before and after an assignment",
    effect: "measures",
    claims: {
      file: "src/console/results-copy.ts",
      quote: "a share of your patients is picked at random and never messaged",
    },
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/arm-stability.ts::assertArmsUnchanged",
    selectsFrom: "two snapshots of the same panel, before and after an operation that must not move anybody",
    effect: "measures",
    claims: null,
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/attribution.ts::countAttribution",
    selectsFrom: "the whole panel, with the appointments in a measurement window",
    effect: "measures",
    claims: {
      file: "src/console/results-copy.ts",
      quote: "Appointments your practice would not have had if Meherr had never sent a message.",
    },
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/backfill.ts::buildBackfillPool",
    selectsFrom: "the whole panel, for one freed slot",
    effect: "narrows",
    claims: {
      file: "app/console/rules/page.tsx",
      quote: "Patients outside these rules are never invited.",
    },
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/continuity.ts::continuityReport",
    selectsFrom: "the whole panel, with the appointments in a window",
    effect: "measures",
    claims: null,
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/eligibility.ts::eligibleForClinician",
    selectsFrom: "the whole panel, for one clinician with availability",
    effect: "narrows",
    claims: {
      file: "app/console/rules/page.tsx",
      quote: "Patients outside these rules are never invited.",
    },
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/holdout.ts::assignHoldout",
    selectsFrom: "the whole panel, to stamp each person with the arm they are already in",
    effect: "reorders",
    claims: {
      file: "src/console/results-copy.ts",
      quote: "a share of your patients is picked at random and never messaged",
    },
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/pool.ts::buildInvitationPool",
    selectsFrom: "the eligible set for one clinician's session",
    effect: "narrows",
    claims: {
      file: "app/console/rules/page.tsx",
      quote: "Patients outside these rules are never invited.",
    },
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/engine/pool.ts::rankCandidates",
    selectsFrom: "the eligible set for one session, already narrowed by the practice's saved rules",
    effect: "reorders",
    claims: null,
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/registers/attribution.ts::attributionByCondition",
    selectsFrom: "the whole panel, split by register membership",
    effect: "measures",
    claims: null,
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/registers/ranking.ts::gapShareOfBatch",
    selectsFrom: "one batch of invitations, against the open care gaps",
    effect: "measures",
    claims: null,
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/registers/ranking.ts::rankGapAware",
    selectsFrom: "the eligible set, against the open care gaps",
    effect: "reorders",
    claims: null,
    scope: { kind: "no_wider" },
  },
  {
    rule: "src/registers/sim-registers.ts::buildRegisterLayer",
    selectsFrom: "the whole panel, to decide who is on a register",
    effect: "measures",
    claims: null,
    scope: { kind: "no_wider" },
  },
];

/**
 * Where the register, the tree and the runs disagree, in five directions.
 *
 * The runs are HANDED IN and every declared rule must have one: a row whose effect nobody measured
 * is a sentence, and a sentence about which patients a rule is over is the thing this unit exists
 * to stop trusting.
 */
export function ruleDefects(
  root: string,
  runs: ReadonlyMap<string, RuleRun>,
  declared: readonly PatientRule[] = RULES_AT_W373,
): RuleDefect[] {
  const population = patientRules(root);
  const byRule = new Map(declared.map((d) => [d.rule, d]));
  const out: RuleDefect[] = [];

  for (const rule of population) {
    const row = byRule.get(rule);
    if (row === undefined) {
      out.push({ rule, what: "is handed the panel and nothing says which patients it is over" });
      continue;
    }
    const run = runs.get(rule);
    if (run === undefined) {
      out.push({ rule, what: "is described here and nothing runs it over a synthetic practice" });
    } else {
      if (run.from.length === 0) {
        out.push({ rule, what: "is run over an empty panel, which decides nothing" });
      } else if (effectOf(run) !== row.effect) {
        out.push({ rule, what: `is recorded as ${row.effect} and ${effectOf(run)} the panel it is handed` });
      }
    }
    if (row.claims !== null) {
      const source = readFileSync(path.join(root, row.claims.file), "utf8");
      if (!source.includes(row.claims.quote)) {
        out.push({ rule, what: `quotes copy ${row.claims.file} does not carry: ${row.claims.quote}` });
      }
    }
    if (row.scope.kind === "wider") {
      out.push({ rule, what: `reaches patients its own copy does not cover: ${row.scope.why}` });
    }
  }
  for (const { rule } of declared) {
    if (!population.includes(rule)) out.push({ rule, what: "is described here and is not a rule handed the panel" });
  }
  for (const rule of runs.keys()) {
    if (!population.includes(rule)) out.push({ rule, what: "is run here and is not a rule handed the panel" });
  }
  return out.sort((a, b) => `${a.rule}${a.what}`.localeCompare(`${b.rule}${b.what}`));
}

/** What this register does not prove. */
export const RULE_BOUND =
  "IT MEASURES ONE RUN OVER ONE SYNTHETIC PRACTICE. `narrows`, `reorders` and `measures` are what " +
  "each rule did on the cohort the suite generated, with the arguments the suite chose — a rule " +
  "that reorders on this panel and drops somebody on a differently-shaped one passes here, and " +
  "the generator's calibration is a set of rates somebody picked rather than a distribution taken " +
  "from anywhere. THE POPULATION IS SIGNATURES: a rule reaching patients through a store, an id " +
  "list or a query rather than through a `Patient[]` parameter is outside it entirely, which is " +
  "most of the console. AND `no_wider` IS A READING OF A SENTENCE, not a derivation — the quote " +
  "is resolved against the file that renders it, so the words are really shown to a practice, but " +
  "whether a rule's reach is inside what those words promise is a person's judgement and nothing " +
  "here can check it. Settling that means deriving a population from copy, which is a different " +
  "instrument than this one.";

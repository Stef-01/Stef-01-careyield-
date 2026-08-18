// W293: `toEqual([])` over a list nothing could have put anything into.
//
// This tree asserts an empty list in hundreds of places. Every one of them is a control — no undeclared route,
// no unaccepted finding, no reporter without a branch — and every one of them passes for two
// completely different reasons that look identical from a green suite:
//
//   THE LIST IS EMPTY BECAUSE THE TREE IS CLEAN, which is the claim, or
//   THE LIST IS EMPTY BECAUSE NOTHING COULD EVER HAVE BEEN IN IT — the walk found no files, the
//   filter had no candidates, the reporter was handed nothing to report on.
//
// W267 proved the walks. W292 proved the walks discriminate. W289 proved the assertions can fail.
// This is the fourth question and it is the cheapest one to get wrong, because unlike those three
// it needs no new machinery to go wrong — an author writes `expect(diff.undeclared).toEqual([])`
// over a diff whose input was empty, the suite goes green, and nothing anywhere says otherwise.
//
// THE EVIDENCE IS A NON-EMPTY SIBLING. An empty-list assertion is evidenced when the same source
// is driven to a non-empty answer somewhere: `expect(found.size).toBeGreaterThanOrEqual(7)` beside
// `expect([...found].filter(...)).toEqual([])`. That pairing is already this tree's habit for most
// of the suite, which is the finding underneath the finding — the discipline exists and is widely
// followed, so the assertions that lack it are a readable list rather than a rewrite.
//
// TWO SCOPES, AND THE SPLIT IS DELIBERATE. A file-local source — `named`, `findings`, `importers` —
// is one file's variable, and three files each having their own `findings` makes tree-wide matching
// meaningless, so a local is evidenced in its own file only. An IMPORTED producer is the tree's:
// `lintCapacityCopy` driven to a violation in the linter's own test is the same function asserted
// clean over good copy two directories away, and demanding the proof be redone in every caller
// would be asking for duplication rather than for evidence. Which scope applied is reported per
// hit, because "proved beside the claim" and "proved somewhere" are different strengths.
//
// NO COUNTS APPEAR IN THIS HEADER, and that rule is enforced by a test rather than remembered.
// The first draft of it quoted the figures the sweep produced WHILE IT WAS BROKEN, and those
// sentences outlived the fix by two orders of magnitude, because prose is not re-derived when code
// is. The measurement lives in `describeSweep(root)` now, computed on every call; a reader who
// wants a number runs it. The rule is checked, not remembered: no run of three or more digits may
// appear in this header unless a `W` precedes it.
//
// THE SOURCE IS A (PRODUCER, FIELD) PAIR, NOT A TOKEN, and getting that wrong is most of the work.
// The same source is spelled four ways in this tree — `record().clinicians`, a destructured
// `const { clinicians } = record()`, a `const diff = censusDiff(...)` then `diff.undeclared`, and
// the inline `censusDiff(found).undeclared` — and a detector keying on the leading token reports
// all four as unevidenced. Those are SPELLINGS of one source, so they are normalised rather than
// excused: each subject reduces to the producer that made it and the field read off it.
//
// AND THE FIELD IS LOAD-BEARING. `expect(r.errors).toEqual([])` is not evidenced by
// `expect(r.warnings).toContain(...)`: the object was non-empty, the LIST never was. Dropping the
// field halves the finding count and every one of the dropped hits is real, which is why the pair
// is the unit rather than the producer.
//
// WHAT THIS CANNOT SEE, measured rather than conceded:
//
//   NO INPUT-LEVEL PROOF ACROSS FILES. An imported producer is credited tree-wide, so a linter
//   driven to a violation anywhere evidences every clean-copy assertion about it everywhere. That
//   is the intended reading — the question is whether the list CAN fill — but it does mean a
//   caller passing an input that could never produce a hit is not distinguished from one that
//   could. Nothing here rules that out.
//
//   ANY-SOURCE. A subject with several sources is evidenced if ANY of them is shown non-empty.
//   `[...found].filter((f) => !declared.has(f))` is evidenced by `found` alone, which is right;
//   a subject where the evidenced source is the irrelevant one would pass, which is not. Nothing
//   here rules that out.
//
//   IT DOES NOT READ THE INPUT. "Non-empty somewhere in this file" is not "non-empty in THIS call".
//   A register driven non-empty by a planted fixture and asserted empty over the real tree is
//   evidenced here, and that is the intended reading — the question is whether the list CAN fill,
//   not whether it did.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the text of the tree's own test files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { testModules } from "./tree-walks";
import { assertionsIn, enclosingTest } from "./tautology-sweep";
import { blankLiterals } from "./scan-text";

/** An assertion that a list is empty, and the source it was read from. */
export interface EmptyAssertion {
  file: string;
  line: number;
  text: string;
  /** The `(producer, field)` pairs the subject could have been filled from. */
  sources: string[];
  test: string;
}

/**
 * Names that are never a source: language and host built-ins, and `expect` itself.
 *
 * Kept short deliberately. A long list is a detector tuned until it agrees, and a name wrongly
 * counted as a source only ever makes the sweep STRICTER — it looks for evidence about a thing
 * nobody asserts, so the hit is reported rather than hidden.
 */
const NOT_A_SOURCE = new Set([
  "new", "typeof", "await", "const", "let", "of", "in", "true", "false", "null", "undefined",
  "void", "return", "this", "Array", "Object", "Set", "Map", "JSON", "String", "Number",
  "Boolean", "Math", "Promise", "expect",
]);

/** The leading identifier of an expression — the producer, when there is one. */
function producer(expression: string): string | null {
  return /^([A-Za-z_$][\w$]*)/.exec(expression.trim())?.[1] ?? null;
}

/**
 * Every name in an expression that could be a source. Arrow parameters are not sources.
 *
 * STRING CONTENTS ARE BLANKED FIRST, and this tree's own habit is why. `credentials.test.ts` reads
 * `expect(SOURCE).toContain("SHIPPED_CREDENTIALS: readonly never[]")` three lines under
 * `expect(SHIPPED_CREDENTIALS).toEqual([])` — a register PINNED EMPTY, evidenced by a sentence
 * ABOUT it. Found by auditing what the sweep called evidenced rather than by reading the code, and
 * it is the fifteenth instance of the collision this tree keeps recording: a scan that matches the
 * text discussing the thing. `blankLiterals` is W288's, and applying it here is its whole point.
 */
function namesIn(raw: string): string[] {
  const expression = blankLiterals(raw);
  const params = new Set<string>();
  for (const m of expression.matchAll(/(?:\(([^()]*)\)|([A-Za-z_$][\w$]*))\s*=>/g)) {
    for (const part of (m[1] ?? m[2] ?? "").split(",")) {
      const name = part.trim().replace(/:.*$/, "").trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) params.add(name);
    }
  }
  const out = new Set<string>();
  for (const m of expression.matchAll(/[A-Za-z_$][\w$]*/g)) {
    if (!params.has(m[0]) && !NOT_A_SOURCE.has(m[0])) out.add(m[0]);
  }
  return [...out];
}

/**
 * How each local name in a file was produced.
 *
 * Two forms, because both are how this tree spells the same thing: `const diff = censusDiff(...)`
 * binds `diff` to the producer `censusDiff`, and `const { clinicians } = record()` binds
 * `clinicians` to the FIELD `clinicians` of the producer `record`. Without the second, a
 * destructured witness and a `record().clinicians` assertion look like different sources.
 */
function bindings(code: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of code.matchAll(/\b(?:const|let)\s+\{([^}]*)\}\s*=\s*(?:await\s+)?([^;\n]+)/g)) {
    const from = producer(m[2]!);
    if (!from) continue;
    for (const part of m[1]!.split(",")) {
      const name = part.trim().split(/\s*:\s*/).pop()?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) out.set(name, `${from}.${name}`);
    }
  }
  for (const m of code.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:await\s+)?([^;\n]+)/g)) {
    if (out.has(m[1]!)) continue;
    const from = producer(m[2]!);
    // A local bound to a function — `const shapesOf = (src) => …` — is its own producer: the name
    // in the assertion IS the reporter being driven, and resolving it lands on the arrow's text.
    if (from && from !== m[1] && !/^\(|=>/.test(m[2]!.trim())) out.set(m[1]!, from);
  }
  return out;
}

/**
 * The field a subject reads off its collection — only when the access is the OUTERMOST one.
 *
 * `lintLandingCopy(text).map((v) => v.rule)` ends in `.rule`, and a regex anchored at the end reads
 * that as the collection's field when it is a field of each ELEMENT, inside the arrow. That split
 * `expect(lintLandingCopy(bad).map((v) => v.rule)).toEqual([...])` from the clean-copy assertion it
 * is the proof for, and hid five real proofs of the compliance linter behind an apparent gap.
 */
function trailingField(expression: string): string | null {
  const m = /\.([A-Za-z_$][\w$]*)\s*$/.exec(expression);
  if (!m) return null;
  let depth = 0;
  for (let i = 0; i < m.index; i++) {
    const ch = expression[i]!;
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
  }
  return depth === 0 ? m[1]! : null;
}

/**
 * The `(producer, field)` pairs a subject could have been filled from.
 *
 * Both halves are normalised so that the four spellings of one source agree. A subject reading a
 * field off something qualifies every one of its sources with that field; a subject that is a bare
 * value or a call does not.
 */
export function sourcesOf(subject: string, bound: Map<string, string>): string[] {
  // `.length` and `.size` are not fields, they are the same collection counted. Qualifying by them
  // splits `expect(lintX(bad).length).toBeGreaterThan(0)` from `expect(lintX(good)).toEqual([])`
  // and loses the proof — the linter driven to a violation IS the evidence for the clean case.
  const trailing = trailingField(blankLiterals(subject));
  const field = trailing === "length" || trailing === "size" ? null : trailing;
  const out = new Set<string>();
  for (const name of namesIn(subject)) {
    // The field is what is READ, not what produced it: `diff.undeclared` has one source, `diff`.
    if (name === field) continue;
    const via = bound.get(name);
    // `via` already carries its own field when the binding was a destructure, and that field is
    // the one being read — so it is used as-is rather than qualified a second time.
    if (via?.includes(".")) out.add(via);
    else {
      const root = via && !new RegExp(`${name}\\s*\\(`).test(subject) ? via : name;
      out.add(field ? `${root}.${field}` : root);
    }
  }
  return [...out].sort();
}

/** Matchers that require their subject to hold something. */
function requiresSomething(matcher: string, expected: string, negated: boolean, subject = ""): boolean {
  if (negated) {
    if (matcher === "toHaveLength" && expected === "0") return true;
    return ["toEqual", "toStrictEqual"].includes(matcher) && expected === "[]";
  }
  if (["toContain", "toContainEqual", "toMatchObject"].includes(matcher)) return true;
  if (matcher === "toHaveLength") return expected !== "0";
  // `expect.arrayContaining([...])` over a non-empty list is a non-emptiness claim wearing a
  // matcher this tree uses for order-independence. Five real proofs of the compliance linter were
  // invisible without it, which is what reading the residue rather than the count is for.
  if (["toEqual", "toStrictEqual", "toMatchObject"].includes(matcher)) {
    if (/^expect\s*\.\s*arrayContaining\s*\(\s*\[\s*[^\s\]]/.test(expected)) return true;
  }
  // `expect(xs.some(...)).toBe(true)` says at least one element matched — the same claim spelled
  // as a predicate.
  if (matcher === "toBe" && expected === "true" && /\.(some|includes)\s*\(/.test(blankLiterals(subject))) {
    return true;
  }
  // A COUNT COMPARED AGAINST A FLOOR. The bound is read off the EXPECTED value and the count off
  // the SUBJECT — an earlier version tested the subject's shape against the expected string and so
  // never fired at all, which is how `expect(rows.length).toBeGreaterThan(0)`, the single most
  // common witness in this tree, counted as no evidence. `toBeGreaterThan(-1)` and
  // `toBeGreaterThanOrEqual(0)` are excluded by arithmetic rather than by name: they are W288's
  // tautologies, and a bound a count cannot break is not evidence of anything.
  const n = /^-?\d+$/.test(expected) ? Number(expected) : null;
  if (n !== null && /\.(length|size)\s*$/.test(blankLiterals(subject))) {
    if (matcher === "toBeGreaterThan") return n >= 0;
    if (matcher === "toBeGreaterThanOrEqual") return n >= 1;
    if (["toBe", "toEqual", "toStrictEqual"].includes(matcher)) return n >= 1;
  }
  if (["toEqual", "toStrictEqual"].includes(matcher)) return /^\[\s*[^\s\]]/.test(expected);
  return false;
}

function isEmptyList(matcher: string, expected: string, negated: boolean): boolean {
  if (negated) return false;
  if (["toEqual", "toStrictEqual"].includes(matcher)) return expected === "[]";
  return matcher === "toHaveLength" && expected === "0";
}

export interface FileSweep {
  empty: EmptyAssertion[];
  /** Every `(producer, field)` this file drives to a non-empty answer somewhere. */
  evidenced: Set<string>;
  /** Names this file imports. A local `named` is one file's variable; an import is the tree's. */
  imported: Set<string>;
}

/** Every name a file imports, by binding — named, default and namespace alike. */
export function importedNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const m of code.matchAll(/import\s+([^;]*?)\s+from\s*["'][^"']+["']/g)) {
    const clause = m[1]!;
    for (const named of clause.matchAll(/\{([^}]*)\}/g)) {
      for (const part of named[1]!.split(",")) {
        const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
        if (name) names.add(name);
      }
    }
    for (const part of clause.replace(/\{[^}]*\}/g, "").replace(/\*\s+as\s+/, "").split(",")) {
      const name = part.trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return names;
}

/**
 * Read one test file's text.
 *
 * Text-in and pure, so every arm can be driven with a constructed file rather than only with
 * whatever the tree happens to contain — W291's rule, and the reason the planted proofs below can
 * exist at all.
 */
export function sweepText(file: string, source: string): FileSweep {
  const code = stripComments(source);
  const bound = bindings(code);
  const empty: EmptyAssertion[] = [];
  const evidenced = new Set<string>();
  for (const a of assertionsIn(code)) {
    const sources = sourcesOf(a.subject, bound);
    if (requiresSomething(a.matcher, a.expected, a.negated, a.subject)) {
      for (const s of sources) evidenced.add(s);
    }
    if (isEmptyList(a.matcher, a.expected, a.negated)) {
      empty.push({
        file,
        line: code.slice(0, a.index).split("\n").length,
        text: a.text,
        sources,
        test: enclosingTest(code, a.index),
      });
    }
  }
  return { empty, evidenced, imported: importedNames(code) };
}

/** Every empty-list assertion under `root/src`, in file order. */
export function sweepEmptyLists(root: string): EmptyAssertion[] {
  return testModules(root).flatMap(
    (file) => sweepText(path.relative(root, file).split(path.sep).join("/"), readFileSync(file, "utf8")).empty,
  );
}

/** Every empty-list assertion whose source this file never shows holding anything. */
export function unevidencedIn(file: string, source: string): EmptyAssertion[] {
  const { empty, evidenced } = sweepText(file, source);
  return empty.filter((e) => !e.sources.some((s) => evidenced.has(s)));
}

export function unevidencedEmptyLists(root: string): EmptyAssertion[] {
  return testModules(root).flatMap((file) =>
    unevidencedIn(path.relative(root, file).split(path.sep).join("/"), readFileSync(file, "utf8")),
  );
}

/**
 * A register a founder gate requires to be EMPTY, and which therefore cannot be shown filling.
 *
 * The one accepted class, and it needs one argument rather than thirty-three. `SHIPPED_PATHWAYS`,
 * `SHIPPED_CREDENTIALS`, `ENABLED_COUPLINGS` and the rest are pinned empty BECAUSE a gate is
 * closed: asking for evidence that one of them can hold something is asking for the gate to be
 * crossed in a test. The emptiness is the claim, not a side effect of nothing having happened —
 * which is the exact distinction this sweep exists to draw, arriving from the other side.
 *
 * Matched on the subject being a single bare constant of this shape, so a hit reading
 * `SHIPPED_X.filter(...)` or `f(SHIPPED_X)` is NOT accepted: those are derived answers, and a
 * derived answer over an empty input is the vacuity, not the gate.
 */
export const GATE_PINNED_EMPTY = /^(SHIPPED|ENABLED|CAPTURED|DECLARED)_[A-Z0-9_]+$/;

/**
 * Every empty-list assertion in the tree whose source is never shown holding anything.
 *
 * TWO SCOPES, AND THE SPLIT IS THE POINT. A source that is a file-local — `named`, `findings`,
 * `importers` — is one file's variable, and three files each having a different `findings` makes
 * tree-wide matching meaningless. A source that is IMPORTED is the tree's: `lintCapacityCopy`
 * driven to a violation in the linter's own test is the same function as the one asserted clean
 * over good copy two directories away, and demanding the proof be re-done in each caller's file
 * would be asking for duplication rather than for evidence.
 *
 * So: locals are evidenced in their own file, imports anywhere. Which of the two applied is
 * reported per hit rather than merged, because "proved next to the claim" and "proved somewhere
 * in the tree" are different strengths and a reader should be able to tell them apart.
 */
export function evidenceReport(root: string): {
  hits: Array<EmptyAssertion & { evidence: "same_file" | "imported_elsewhere" | null }>;
} {
  const files = testModules(root).map((file) => {
    const rel = path.relative(root, file).split(path.sep).join("/");
    return { rel, sweep: sweepText(rel, readFileSync(file, "utf8")) };
  });
  const global = new Set<string>();
  for (const f of files) for (const e of f.sweep.evidenced) global.add(e);

  const hits = files.flatMap(({ sweep }) =>
    sweep.empty.map((e) => {
      const sameFile = e.sources.some((s) => sweep.evidenced.has(s));
      const viaImport = e.sources.some(
        (s) => sweep.imported.has(s.split(".")[0]!) && global.has(s),
      );
      return { ...e, evidence: sameFile ? ("same_file" as const) : viaImport ? ("imported_elsewhere" as const) : null };
    }),
  );
  return { hits };
}

export type EvidenceKind = "same_file" | "imported_elsewhere" | "gate_pinned_empty" | "none";

export interface ClassifiedEmpty extends EmptyAssertion {
  evidence: EvidenceKind;
  /** `file :: test :: sources`. No line number: a pin that moves when somebody adds a blank line
   *  is a pin whose signal is noise, which is W290's whole subject one unit back. */
  id: string;
}

/** Every empty-list assertion in the tree, with how — or whether — its source is shown to fill. */
export function classify(root: string): ClassifiedEmpty[] {
  return evidenceReport(root).hits.map((h) => {
    const gate = h.sources.length === 1 && GATE_PINNED_EMPTY.test(h.sources[0]!);
    return {
      ...h,
      evidence: h.evidence ?? (gate ? "gate_pinned_empty" : "none"),
      id: `${h.file} :: ${h.test} :: ${h.sources.join("+")}`,
    };
  });
}

/**
 * The empty-list assertions nothing in this tree shows able to fill, BY NAME.
 *
 * A NAME LIST RATHER THAN A COUNT, which is W290's rule and the reason it exists: a count here
 * would be edited by whoever next made the suite red, and the edit would look like maintenance.
 * Named, the two events that move it are both deliberate — an assertion arriving with no evidence
 * fails as an addition, and one that gains a witness fails as stale until somebody deletes the row.
 *
 * THIS IS A DEBT LIST AND IT IS WRITTEN DOWN AS ONE. 129 of the tree's 531 empty-list assertions
 * are in it. They are not defects individually — most are almost certainly fine — but not one of
 * them has anything anywhere saying so, which is precisely the state a control cannot be trusted
 * in. What this unit buys is that the number cannot grow silently; discharging it is the work of
 * the units after this one, one file at a time, and each discharge is a row deleted here.
 *
 * A row is discharged two ways, and both are legitimate: a witness is added beside the assertion
 * (the g5-rehearsal registry, fixed in this unit, is the worked example), or the sweep learns a
 * proof shape it could not read — five of those were found by auditing this list rather than
 * trusting it, and each one discharged rows in bulk.
 */
export const UNEVIDENCED_AT_W293: readonly string[] = [
  "src/audit/store.test.ts :: refuses a write against another practice's visit :: getAudit.outcomes",
  "src/audit/store.test.ts :: seeds three pending visits and no outcomes :: getAudit.outcomes",
  "src/capability/routing-sim.test.ts :: generates a comparison report from the run :: checkInvariants",
  "src/capacity/attribution.test.ts :: exports nothing that reads as one of them :: named",
  "src/capacity/calendar.test.ts :: exports nothing that reads as a learned adjustment :: named",
  "src/capacity/copy-lint.test.ts :: declares nothing that has stopped exporting copy :: CAPACITY_COPY_MODULES",
  "src/capacity/coupling.test.ts :: is not wired: nothing outside src/capacity imports it :: importers",
  "src/capacity/opening.test.ts :: exports no function that reads as being about people :: named",
  "src/collateral/collateral.test.ts :: no asset copy states a bare number — figures come only from the register :: literalNumbersIn+text",
  "src/compliance/cdss-boundary.test.ts :: declares each module once :: twice",
  "src/compliance/surfaces.test.ts :: an empty dossier maps nothing :: parseCensus",
  "src/console/zero-states.test.ts :: declares could_not_load nowhere, and says why :: declaring",
  "src/credentials/scope.test.ts :: carries the permissions it was given, and nothing is inferred from the scope :: ok.permits+scopeStatement.permits+statement.permits",
  "src/credentials/vault.test.ts :: no surface reaches the vault outside an authenticated console path :: misplaced",
  "src/directory/dossier-claims.test.ts :: holds: no page consumes a directory module :: walk",
  "src/directory/membership.test.ts :: imports nothing from the referral rail, so it could not derive one if asked :: imports",
  "src/education/cpd.test.ts :: a clinician with no entries gets an empty trail rather than everyone's :: trailFor.entries",
  "src/education/provenance.test.ts :: a draft produces no source at all :: sourcesFromContent",
  "src/education/store.test.ts :: ships empty, and a reset returns it to empty :: getTriggers",
  "src/engine/holdout.test.ts :: audit trail records every arm change once, and a re-run is silent :: assignHoldout.auditEvents",
  "src/guardrails/condition-monitors.test.ts :: does not raise a rate alarm on too few invitations :: byCondition.alerts+evaluateConditionGuardrails.alerts",
  "src/guardrails/condition-monitors.test.ts :: fires for the breaching register and not the healthy one :: byCondition.alerts+conditionCode.alerts+evaluateConditionGuardrails.alerts+find.alerts",
  "src/interop/disclosure-ledger.test.ts :: describes BOTH answers, so the founder chooses between two described things :: MODE_CONSEQUENCES.cannotAnswer+figures_included.cannotAnswer",
  "src/lib/source-hygiene.test.ts :: contains no NUL byte in any text source :: files",
  "src/lib/stores.test.ts :: registers every reset function the source tree exports :: missing",
  "src/lib/stores.test.ts :: registers nothing that no longer exists :: stale",
  "src/messaging/send-path.test.ts :: no page, route or engine module holds an SMS adapter :: wiredOutsideTheSimulator",
  "src/ops/switches.test.ts :: pure updates never mutate the input :: Object.pausedPracticeIds",
  "src/outcomes/attribution-v2.test.ts :: exports no per-patient, per-clinician or ranking function :: named",
  "src/outcomes/model.test.ts :: returns not_recorded when nothing has been written down at all :: outcomeOf.evidence",
  "src/outcomes/response-graph.test.ts :: keeps unanswered interventions out of the edges entirely :: buildResponseGraph.edges+built.edges",
  "src/outcomes/response.test.ts :: answers not_recorded when every candidate event was refused :: responseState.responses",
  "src/outcomes/response.test.ts :: answers not_recorded when nothing is recorded, with what would settle it :: responseState.responses",
  "src/outcomes/response.test.ts :: carries no responses when the verdict is not_recorded, and none when it is not :: responseState.responses",
  "src/pathways/audit.test.ts :: an empty trail replays to nothing, not to a default :: EMPTY_AUDIT_LOG.versions+replayAudit.versions",
  "src/pathways/escalation.test.ts :: does not apply a rule written against a different version, and says which problem it is :: routeEscalations.routed",
  "src/pathways/escalation.test.ts :: empty does NOT mean escalation is off — every fired escalation comes back unrouted :: routeEscalations.routed",
  "src/pathways/escalation.test.ts :: ignores a rule belonging to another pathway :: routeEscalations.routed",
  "src/pathways/escalation.test.ts :: routes nothing when no escalation fired :: routeEscalations.routed",
  "src/pathways/escalation.test.ts :: routes nothing when no escalation fired :: routeEscalations.unrouted",
  "src/pathways/evaluation.test.ts :: has no exported function that returns a pathway :: filter+returnsPathway",
  "src/pathways/simulation.test.ts :: a pathway whose facts are always recorded is always determinable :: simulatePathway.undeterminedBy",
  "src/privacy/access-y5.test.ts :: accounts for everything W106 says is held or derived :: accessCoverage.stale",
  "src/privacy/access-y5.test.ts :: accounts for everything W106 says is held or derived :: accessCoverage.unaccounted",
  "src/privacy/access-y5.test.ts :: exports the class erasure deliberately keeps, which is not a disagreement :: accessErasureDisagreements.disclosedNotErased",
  "src/privacy/access-y5.test.ts :: finds no store erased without being disclosed, or disclosed without being erased :: accessErasureDisagreements.disclosedNotErased",
  "src/privacy/automated-decisions.test.ts :: checks every content registry against what it actually holds :: live",
  "src/privacy/automated-decisions.test.ts :: is the check W200's register says covers this module :: surface.operatorCopy",
  "src/privacy/capacity-privacy.test.ts :: declares nothing in this directory that has gone :: RECORD_CLASSES+map+module",
  "src/privacy/console-export.test.ts :: becomes true on referrals alone :: consoleExportFor.invitations",
  "src/privacy/console-export.test.ts :: is FALSE for a practice holding nothing, even though the product holds plenty :: consoleExportFor.invitations",
  "src/privacy/erasure-y5.test.ts :: covers W106's stored classes and declares none it no longer stores :: erasureCoverage.stale",
  "src/privacy/erasure-y5.test.ts :: covers W106's stored classes and declares none it no longer stores :: erasureCoverage.unreached",
  "src/privacy/privacy.test.ts :: prunes terminal records past their window; active offers are never pruned :: applyRetention.outcomes",
  "src/privacy/privacy.test.ts :: reports held=false honestly for an unknown identifier :: exportPatientData.invitations",
  "src/privacy/record-classes.test.ts :: declares every store module in src/ :: missing",
  "src/privacy/record-classes.test.ts :: declares nothing that no longer exists :: stale",
  "src/quality/audit-y5.test.ts :: closes the assertion that could not fail, and finds no other unpaired one :: unpaired",
  "src/quality/audit-y5.test.ts :: has no credential-shaped literal anywhere, by W242's own scanner :: hits+map",
  "src/quality/audit-y5.test.ts :: has no hardcoded date comparison in shipped source :: hits",
  "src/quality/audit-y5.test.ts :: leaves no focused or skipped test anywhere :: hits",
  "src/quality/author-tax.test.ts :: charges nothing for a register that is satisfied by writing the module itself :: home.files",
  "src/quality/closing-state.test.ts :: reports a bound that its own close makes stale :: whileClaimed",
  "src/quality/closing-state.test.ts :: reports a note that dropped the `[P]` prefix its plan line carries :: clean",
  "src/quality/dossier-q18.test.ts :: checks that it really is off and really is unwired :: importers",
  "src/quality/g5-rehearsal.test.ts :: is imported by nothing the product ships :: importers",
  "src/quality/gate-readiness.test.ts :: opens every path, and finds a file at each :: missing",
  "src/quality/horizon-q25.test.ts :: (3) states the number the loop may answer, and it is still zero :: answerable+blocker+map",
  "src/quality/horizon-q25.test.ts :: (4) adds no blocked row, and says why the count moved anyway :: plannedBlocked",
  "src/quality/horizon-y6.test.ts :: blocks none of them, which is the quarter's own constraint :: blocked",
  "src/quality/latent-findings.test.ts :: finds no header-less module at all, because W281 closed CENSUS-1 :: modulesWithNoUnitHeader",
  "src/quality/latent-y5.test.ts :: anchors every open finding, and anchors nothing that is not one :: anchorCoverage.orphaned",
  "src/quality/latent-y5.test.ts :: anchors every open finding, and anchors nothing that is not one :: anchorCoverage.unanchored",
  "src/quality/latent-y5.test.ts :: finds no anchor that has gone false :: deadAnchors+map",
  "src/quality/ledger-integrity.test.ts :: gives every done unit a commit SHA to point at :: map+missing",
  "src/quality/ledger-integrity.test.ts :: has no duplicate unit id — the failure this file was written for :: duplicated+id+lines+map",
  "src/quality/ledger-integrity.test.ts :: has no gaps: every unit from W1 to the last one exists :: Math+filter+has+keys+map+present",
  "src/quality/ledger-integrity.test.ts :: leaves no unit both unowned and finished :: id+map+orphaned",
  "src/quality/ledger-integrity.test.ts :: makes every blocked unit name what the founder has to decide :: id+map+unexplained",
  "src/quality/ledger-integrity.test.ts :: uses only the statuses the protocol defines :: map+strange",
  "src/quality/negative-probes.test.ts :: leaves the probe route gone :: COPY.undeclared+coverageDiff.undeclared",
  "src/quality/negative-probes.test.ts :: passes every positive and fails every pair :: failures",
  "src/quality/page-suite.test.ts :: runs every spec in the tree, with none excluded :: pageSuiteCoverage.excluded",
  "src/quality/page-suite.test.ts :: runs every spec in the tree, with none excluded :: pageSuiteCoverage.stale",
  "src/quality/page-suite.test.ts :: runs every spec in the tree, with none excluded :: pageSuiteCoverage.unreasoned",
  "src/quality/plan-ledger.test.ts :: keeps a blocked row pointing at a gate the plan still defines :: dangling",
  "src/quality/ranker-behaviour.test.ts :: carries an anchor that discriminates, and no anchor is dead :: deadAnchors",
  "src/quality/register-census.test.ts :: W271's route reach notices a page that reaches a dormant module :: coverageDiff.unclassified",
  "src/quality/register-census.test.ts :: W271's route reach notices a page that reaches a dormant module :: coverageDiff.wokenDormant",
  "src/quality/route-coverage.test.ts :: refuses nothing, and says so by having no refusal :: ROUTE_COVERAGE+exercise+filter+kind",
  "src/quality/tautology-sweep.test.ts :: re-derives every acceptance from the file rather than trusting the reason :: brokenAcceptances+process",
  "src/quality/unit-headers.test.ts :: keeps an anchor that survived the fix :: deadAnchors",
  "src/referrals/document.test.ts :: accepts every valid shape :: FIXTURES.recordedFactCodes+adviceOnly.recordedFactCodes",
  "src/referrals/leakage.test.ts :: ignores another practice's events :: replay.applied",
  "src/referrals/leakage.test.ts :: reaches the same verdict whichever order the rows arrive in :: replayReferral.rejected",
  "src/referrals/leakage.test.ts :: still completes a same-day written-booked-completed chain in either order :: replayReferral.rejected",
  "src/referrals/report.test.ts :: ignores another practice's barrier records :: buildLeakageReport.barriers",
  "src/referrals/scoping.test.ts :: triages nothing that no longer exists :: stale",
  "src/registers/eligibility.test.ts :: never returns a patient absent from the base set, even if that patient has a gap :: withCareGapFilter",
  "src/registers/escalation.test.ts :: every shipped trigger passes the advice linter :: lintTriggers",
  "src/registers/intervals.test.ts :: is empty until the G5 ruling lands :: guidelineIntervals.intervals",
  "src/registers/intervals.test.ts :: is empty until the G5 ruling lands :: guidelineIntervals.rejected",
  "src/registers/multi-sim.test.ts :: generates a report from the run :: checkInvariants",
  "src/security/audit-gate.test.ts :: blocks a malformed advisory instead of throwing past the gate :: blocking.paths+evaluateAudit.paths",
  "src/security/instruction-sinks.test.ts :: does not match its own marker list, so the scan has no self-exclusion to hide in :: findInstructionSinks",
  "src/security/instruction-sinks.test.ts :: scans test files too :: findInstructionSinks",
  "src/sim/backfill.test.ts :: a zero rate disables the path completely (goldens stay stable) :: runSim.backfillLatenciesMs",
  "src/sim/harness.test.ts :: invariants hold :: checkInvariants",
  "src/sim/harness.test.ts :: no invitation is ever left dangling: every offer reaches a terminal or booked state :: open",
  "src/tenancy/fixture-coherence.test.ts :: reads the stores rather than their source :: get+seededPractices",
  "src/tenancy/rollout.test.ts :: a site's own value beats the group default :: build.defaulted+planRollout.defaulted",
  "src/tenancy/staff.test.ts :: nobody is Meherr staff by default :: MEHERR_STAFF",
  "src/tenancy/store-reads.test.ts :: checks that every patient_keyed function takes NO practice :: scoped",
  "src/tenancy/store-reads.test.ts :: checks that every practice_scoped function really takes a practice :: lying",
  "src/tenancy/store-reads.test.ts :: declares every exported store function :: undeclared",
  "src/tenancy/store-reads.test.ts :: declares nothing that no longer exists :: stale",
  "src/tenancy/store-reads.test.ts :: records that PRIV-3's remaining risk was closed rather than re-worded :: STORE_READS+filter+includes+reason",
  "src/tenancy/store-reads.test.ts :: requires a written reason for everything that is not practice_scoped :: STORE_READS",
  "src/tenancy/two-tenant.test.ts :: leaves none single-tenant, and declares no proof for a read W209 has reclassified :: tenantCoverage.singleTenant",
  "src/tenancy/two-tenant.test.ts :: leaves none single-tenant, and declares no proof for a read W209 has reclassified :: tenantCoverage.stale",
  "src/tenancy/two-tenant.test.ts :: saveClinicians writes to one practice and not the other :: B.clinicians+practiceRecord.clinicians",
  "src/verticals/assembly.test.ts :: keeps one evidence reader for all of them :: shippedEvidence.educationItems",
  "src/verticals/assembly.test.ts :: keeps one evidence reader for all of them :: shippedEvidence.intervals",
  "src/verticals/assembly.test.ts :: keeps one evidence reader for all of them :: shippedEvidence.pathways",
  "src/verticals/consistency.test.ts :: reports a missing member before comparing members that are not all there :: usableVertical.contradictions",
  "src/verticals/dermatology.test.ts :: reports no contradictions, because members must exist before they can disagree :: assembleDermatology.contradictions",
  "src/verticals/model.test.ts :: takes the interval CATALOGUE rather than a bare array :: EVIDENCE.rejected+intervals.rejected",
  "src/verticals/scale.test.ts :: generates no interval member, because an interval carries a cadence :: evidence.intervals+fixture.intervals",
  "src/verticals/scale.test.ts :: generates no interval member, because an interval carries a cadence :: filter+fixture+kind+syntheticVerticals.members",
  "src/verticals/scale.test.ts :: gives the same answers whichever order the population arrives in :: fixture+orderDependence",
  "src/verticals/womens-health.test.ts :: is a distinct vertical, not a renamed copy :: WOMENS_HEALTH_SPEC",
  "src/verticals/womens-health.test.ts :: still produces the same evidence both verticals are assessed against :: intervals.rejected+shippedEvidence.rejected",
  "src/verticals/womens-health.test.ts :: still produces the same evidence both verticals are assessed against :: shippedEvidence.educationItems",
  "src/verticals/womens-health.test.ts :: still produces the same evidence both verticals are assessed against :: shippedEvidence.intervals",
  "src/verticals/womens-health.test.ts :: still produces the same evidence both verticals are assessed against :: shippedEvidence.pathways",
];

export interface EmptyListDiff {
  /** An empty-list assertion with no evidence that the pin does not already carry. The defect. */
  newlyUnevidenced: string[];
  /** A pinned row that now has evidence, or has gone. Progress, and it must be recorded. */
  nowEvidenced: string[];
}

/**
 * Both directions against the pin, W102's shape.
 *
 * Takes the pin as an argument — W291's rule: a reporter whose arms cannot be reached from outside
 * cannot be shown firing.
 */
export function emptyListDiff(
  root: string,
  pinned: readonly string[] = UNEVIDENCED_AT_W293,
): EmptyListDiff {
  const unevidenced = new Set(classify(root).filter((c) => c.evidence === "none").map((c) => c.id));
  const pin = new Set(pinned);
  return {
    newlyUnevidenced: [...unevidenced].filter((id) => !pin.has(id)).sort(),
    nowEvidenced: [...pin].filter((id) => !unevidenced.has(id)).sort(),
  };
}

export interface SweepCensus {
  total: number;
  sameFile: number;
  importedElsewhere: number;
  gatePinnedEmpty: number;
  unevidenced: number;
}

/**
 * The sweep's own measurement, computed rather than written down.
 *
 * Exists because the alternative failed in this very module: the header quoted the numbers the
 * sweep reported while it was broken, and the sentences outlived the fix. A count in prose is a
 * pin nobody re-derives — W290's subject, arriving as documentation rather than as an assertion.
 */
export function describeSweep(root: string): SweepCensus {
  const all = classify(root);
  const of = (kind: EvidenceKind) => all.filter((c) => c.evidence === kind).length;
  return {
    total: all.length,
    sameFile: of("same_file"),
    importedElsewhere: of("imported_elsewhere"),
    gatePinnedEmpty: of("gate_pinned_empty"),
    unevidenced: of("none"),
  };
}

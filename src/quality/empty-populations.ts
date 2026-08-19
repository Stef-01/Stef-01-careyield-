// W369: the empty population — a check whose subject the tree no longer has.
//
// AN EMPTY REGISTER LOOKS THE SAME WHETHER IT IS A CLAIM OR A CORPSE. W118's `SHIPPED_PATHWAYS` is
// empty because a founder gate holds it shut, and that emptiness is the deliverable. A register left
// behind by a mechanism nobody reads any more is also empty, and reads identically: no members, a
// green test asserting no members, and nothing in between to tell the two apart. This register
// resolves the difference to something in the module rather than to the reader's memory.
//
// IT IS THE OTHER SIDE OF W293. That unit swept empty-list ASSERTIONS and accepted one class
// wholesale — `GATE_PINNED_EMPTY`, a regular expression over the identifier — with the argument,
// written once, that asking for evidence such a register can fill is asking for the gate to be
// crossed in a test. The argument is right. What it does not do is resolve: a register named to
// match the pattern is excused by its NAME, which is the marker-is-a-spelling defect W366 spent a
// unit on. Here every one of them is resolved to a quote its own module makes, so the excuse costs
// a sentence somebody has to write and a machine can check.
//
// WHAT IT FOUND, both fixed rather than recorded: `MOVED_SINCE_W313` in W300's module said what it
// held and never why it was empty, while its own sibling above it argued the case; and
// `SURVIVORS_AT_W362` described W296's four kinds without saying that the run had happened, so an
// empty survivors register and a harness nobody started were indistinguishable. Both now carry the
// sentence, and both quotes are resolved below.
//
// THE POPULATION IS DERIVED, not listed: every `export const NAME … = []` across `typescriptFiles`.
// A register arriving empty joins it whether or not anybody adds a row, which is the only shape
// that survives the tree growing. The derivation is wider than the grep this unit began with, and
// the difference is one member: W153's `DECLARED_INSTRUCTION_SINKS` is declared `ReadonlyArray<…>`
// rather than `readonly …[]`, so a hand search shaped by the common spelling walked past it while
// the walk here did not.
//
// WHAT THIS DOES NOT PROVE is `EMPTY_BOUND`, exported below and read by W297's register.
//
// NOTHING IS IMPORTED THAT REACHES `bounds.ts`, for the reason W367 discovered the hard way: that
// module imports each bound from its owner, so anything importing back completes a cycle whose
// symptom is `undefined` rather than a build error. `flatten` comes from W367's leaf and the walk
// from W226's, neither of which imports a value.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own source text. The gates are the
// subject of many rows and none of them is approached — a row quotes the sentence naming a gate,
// which is the opposite of crossing it.

import { readFileSync } from "node:fs";
import path from "node:path";
import { flatten } from "./subject-and-walk";
import { typescriptFiles } from "./tree-walks";

/**
 * A doc comment's words, with the shape of a doc comment taken off.
 *
 * `flatten` collapses whitespace, which is not enough here: a wrapped sentence in a block comment
 * carries a `*` at the start of every continued line, so the words either side of a line break come
 * out with a bullet between them. Where an author let a sentence wrap is not part of what it says,
 * and neither is the marker the language needs to keep the comment open.
 */
export const prose = (text: string): string =>
  flatten(
    text
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, ""))
      .join("\n"),
  );

/** A register this tree exports with no members. */
export interface EmptyRegister {
  /** The file, as the tree spells it. */
  module: string;
  name: string;
}

/**
 * The empty registers one file declares.
 *
 * Line-anchored on purpose: a declaration is a top-level `export const`, and a mention of one
 * inside a comment or a string is a citation rather than a register.
 */
export function emptyRegistersIn(module: string, source: string): EmptyRegister[] {
  const out: EmptyRegister[] = [];
  for (const line of source.split("\n")) {
    const m = /^export const ([A-Z][A-Z0-9_]*)(?:\s*:[^=]+)? = \[\];/.exec(line);
    if (m) out.push({ module, name: m[1]! });
  }
  return out;
}

/** Every empty register in the tree — the population this is over, derived rather than declared. */
export function emptyRegisters(root: string): EmptyRegister[] {
  return typescriptFiles(root)
    .flatMap((file) => emptyRegistersIn(path.relative(root, file), readFileSync(file, "utf8")))
    .sort((a, b) => `${a.module}::${a.name}`.localeCompare(`${b.module}::${b.name}`));
}

/** Why a register has no members. */
export type Emptiness =
  /** Members are impossible or forbidden here — a gate, a ruling, or a type with no inhabitant. */
  | { kind: "by_design"; quote: string }
  /** It had members, or a run looked for them, and they were resolved. */
  | { kind: "because_fixed"; quote: string }
  /** THE FINDING: nothing separates it from a mechanism nobody reads any more. */
  | { kind: "broken"; why: string };

export interface DeclaredEmpty {
  module: string;
  name: string;
  emptiness: Emptiness;
}

export interface EmptyDefect {
  register: string;
  what: string;
}

/**
 * Every empty register, with the sentence its own module makes about being empty.
 *
 * THE QUOTE IS THE WHOLE MECHANISM. A row reading `{ kind: "by_design" }` is a label and costs
 * nothing; a row carrying words that must still be in the module is a claim the tree can lose. The
 * quotes are stored flattened-comparable rather than verbatim, because where a doc comment wraps is
 * not part of what it says — W367's rule, one register over.
 */
export const EMPTY_AT_W369: readonly DeclaredEmpty[] = [
  { module: "src/api/scopes.ts", name: "SHIPPED_TOKENS", emptiness: { kind: "by_design", quote: "`never[]`, so there is no shape a value could take here" } },
  { module: "src/capacity/attribution.ts", name: "SHIPPED_SESSION_ARMS", emptiness: { kind: "by_design", quote: "It is empty because nobody has run one, and the honest consequence is that this product cannot today say whether opening slots helps" } },
  { module: "src/capacity/calendar.ts", name: "SHIPPED_HOLIDAYS", emptiness: { kind: "by_design", quote: "Plausible dates with plausible citations would be a manufactured source, which is worse than no source at all" } },
  { module: "src/capacity/coupling.ts", name: "ENABLED_COUPLINGS", emptiness: { kind: "by_design", quote: "A practice enabling the coupling therefore fails the suite until the notice is updated, which is the mechanism rather than the promise" } },
  { module: "src/credentials/scope.ts", name: "SHIPPED_SCOPE_STATEMENTS", emptiness: { kind: "by_design", quote: "the founder signs clinical content off (G5)" } },
  { module: "src/directory/membership.ts", name: "SHIPPED_MEMBERSHIPS", emptiness: { kind: "by_design", quote: "A network with members is a published network, and publishing needs the Ahpra advertising review G6 names" } },
  { module: "src/directory/profile.ts", name: "SHIPPED_DIRECTORY_PROFILES", emptiness: { kind: "by_design", quote: "The model can exist before that review; the content cannot" } },
  { module: "src/education/triggers.ts", name: "SHIPPED_TRIGGERS", emptiness: { kind: "by_design", quote: "a test pins the emptiness so triggers cannot arrive by the back door" } },
  { module: "src/interop/conformance.ts", name: "CAPTURED_FIXTURES", emptiness: { kind: "by_design", quote: "The whole value of a captured fixture is that another system produced it, so one we wrote and labelled \"captured\" is worth less than nothing" } },
  { module: "src/interop/credentials.ts", name: "SHIPPED_CREDENTIALS", emptiness: { kind: "by_design", quote: "The control is `loadCredential`, which refuses regardless of what this holds" } },
  { module: "src/interop/disclosure-ledger.ts", name: "SHIPPED_DISCLOSURES", emptiness: { kind: "by_design", quote: "G9 is unratified, W202 and W203 are blocked, and there is no transport in this tree" } },
  { module: "src/interop/terminology.ts", name: "SHIPPED_BINDINGS", emptiness: { kind: "by_design", quote: "A binding is a clinical assertion (see the module note), so the catalogue is gated" } },
  { module: "src/outcomes/graph-privacy.ts", name: "SHIPPED_DISCLOSABLE_GRAPHS", emptiness: { kind: "by_design", quote: "a non-empty registry would be the first thing in the tree that had been cleared for disclosure. G9 is unratified" } },
  { module: "src/outcomes/response-graph.ts", name: "SHIPPED_RESPONSE_GRAPHS", emptiness: { kind: "by_design", quote: "A response graph over anything but the simulation would need real interventions, and there are none" } },
  { module: "src/pathways/approval.ts", name: "SHIPPED_ATTESTATIONS", emptiness: { kind: "by_design", quote: "no pathway has been reviewed or signed off, so nothing is usable" } },
  { module: "src/pathways/binding.ts", name: "SHIPPED_BINDINGS", emptiness: { kind: "by_design", quote: "shipping empty makes pathways undeliverable rather than universally deliverable, which is the right way round for an undecided question" } },
  { module: "src/pathways/escalation.ts", name: "SHIPPED_ESCALATION_RULES", emptiness: { kind: "by_design", quote: "every escalation a pathway flags comes back `unrouted`. The mechanism is live and visibly undecided" } },
  { module: "src/pathways/versioning.ts", name: "SHIPPED_PATHWAYS", emptiness: { kind: "by_design", quote: "**EMPTY pending the G5 ruling** — a test pins this, so clinical content cannot arrive by the back door" } },
  { module: "src/quality/declaration-tax.ts", name: "MOVED_SINCE_W308", emptiness: { kind: "by_design", quote: "a record with no way to account for a later movement gets edited instead of extended" } },
  // The first of the two this unit found. Fixed in the module, per W357, and quoted here so the
  // fix cannot quietly come undone.
  { module: "src/quality/declaration-tax.ts", name: "MOVED_SINCE_W313", emptiness: { kind: "by_design", quote: "W369 found this one saying nothing about its own emptiness while its sibling above argued the case properly" } },
  { module: "src/quality/horizon-q29.test.ts", name: "IN_FLIGHT_AT_EXPANSION", emptiness: { kind: "by_design", quote: "EMPTY, AND THE EMPTINESS IS A FACT ABOUT THE MOMENT rather than a field nobody filled" } },
  // The second. A run happened and found nothing left, which is not the same as no run.
  { module: "src/quality/quarter-mutants-q27.ts", name: "SURVIVORS_AT_W362", emptiness: { kind: "because_fixed", quote: "The survivor W362 did find was fixed in `typed-names.test.ts` rather than recorded here, per W357" } },
  { module: "src/quality/register-counts.ts", name: "RATCHETS", emptiness: { kind: "because_fixed", quote: "the two this unit found were rewritten in place instead" } },
  { module: "src/registers/authoring.ts", name: "SHIPPED_WORKSPACE", emptiness: { kind: "by_design", quote: "no clinical content exists in this tree, so nothing is signed off and nothing is usable" } },
  { module: "src/registers/intervals.ts", name: "SHIPPED_INTERVALS", emptiness: { kind: "by_design", quote: "Empty until the G5 ruling lands — a test asserts it, so this cannot fill up by accident" } },
  { module: "src/registers/safety-rails.ts", name: "SHIPPED_SAFETY_RULES", emptiness: { kind: "by_design", quote: "EMPTY pending the G5 ruling — a test pins this, so clinical content cannot arrive by the back door" } },
  { module: "src/reporting/model.ts", name: "SHIPPED_DISCLOSURES", emptiness: { kind: "by_design", quote: "The model can exist before the ruling; the disclosure cannot" } },
  // Declared `ReadonlyArray<…>` rather than `readonly …[]`, which is why the grep this unit
  // started from missed it and the register's own walk did not.
  { module: "src/security/instruction-sinks.ts", name: "DECLARED_INSTRUCTION_SINKS", emptiness: { kind: "by_design", quote: "Empty, and it stays empty until G8 is ratified. This is the audit-allowlist shape (W53): an exception is a written decision with a reason, or it is not an exception" } },
  { module: "src/tenancy/staff.ts", name: "MEHERR_STAFF", emptiness: { kind: "by_design", quote: "adding an entry is a founder decision, made in a commit, not something a unit does in passing" } },
];

/**
 * Where the register and the tree disagree, in four directions.
 *
 * The first is the unit's subject: an empty register nobody has said anything about is exactly the
 * one that cannot be told from a dead mechanism, so it is a defect rather than a silence.
 */
export function emptyPopulationDefects(
  root: string,
  declared: readonly DeclaredEmpty[] = EMPTY_AT_W369,
): EmptyDefect[] {
  const population = emptyRegisters(root);
  const byId = new Map(declared.map((d) => [`${d.module}::${d.name}`, d]));
  const out: EmptyDefect[] = [];
  const sourceOf = new Map<string, string>();

  for (const { module, name } of population) {
    const id = `${module}::${name}`;
    const row = byId.get(id);
    if (row === undefined) {
      out.push({ register: id, what: "is empty and nothing in the tree says whether that is a claim or a leftover" });
      continue;
    }
    if (row.emptiness.kind === "broken") {
      out.push({ register: id, what: `is empty and nothing distinguishes it from a dead one: ${row.emptiness.why}` });
      continue;
    }
    const file = path.join(root, module);
    sourceOf.set(module, sourceOf.get(module) ?? prose(readFileSync(file, "utf8")));
    if (!sourceOf.get(module)!.includes(flatten(row.emptiness.quote))) {
      out.push({ register: id, what: `quotes an argument its module does not make: ${row.emptiness.quote}` });
    }
  }

  const live = new Set(population.map((p) => `${p.module}::${p.name}`));
  for (const { module, name } of declared) {
    const id = `${module}::${name}`;
    if (!live.has(id)) out.push({ register: id, what: "is declared empty and the tree has no such empty register" });
  }
  return out.sort((a, b) => `${a.register}${a.what}`.localeCompare(`${b.register}${b.what}`));
}

/** What this register does not prove. */
export const EMPTY_BOUND =
  "IT RESOLVES THE SENTENCE, NOT THE FACT THE SENTENCE ASSERTS. A quote saying a founder gate " +
  "holds a register shut proves somebody wrote that down and that it is still written down; " +
  "whether the gate is real, still closed, or the reason this particular list has no members is " +
  "outside anything here. THE POPULATION IS EMPTY ARRAY LITERALS, so a register emptied at " +
  "runtime, built by a function that happens to return nothing, or spelled across lines is " +
  "invisible to it — the walk reads a declaration, not a value. THE WALK IS `src/`, so a register " +
  "shipping empty in `app/`, in `e2e/` or in `scripts/` is outside the population entirely. AND AN ARGUED REGISTER CAN STILL " +
  "BE DEAD: `by_design` says members are forbidden, not that anything reads the list, so a " +
  "mechanism whose last consumer was deleted passes here with its sentence intact. Settling that " +
  "means asking who reads an empty register and driving them on a member, which is the question " +
  "one level in and is not this unit's.";

// W372 — A REGISTER WHOSE MEMBERS ARE LISTED WHERE THEY COULD BE DERIVED.
//
// A hand-listed register is a claim about the tree written down by hand. It is not wrong to write
// one — somebody has to say which modules are exempt, which parses are shared, which routes are
// dormant — but a list nothing compares against the tree is a claim that can only be true on the
// day it was typed. This enumerates every one of them and says which kind it is.
//
// THE POPULATION IS DERIVED, which a register about hand-listing had better manage: every exported
// `readonly T[]` in this tree whose entries name a module path. That is the shape of a register
// ABOUT the tree, as opposed to a table of copy or of product rules, and it is the shape whose
// membership a derivation could in principle produce.
//
// THREE KINDS AND ONE OF THEM IS THE FINDING. Most are `derived`: something compares the list
// against a walk of the tree, in both directions, so a member arriving joins it and a member
// leaving fails. A few are `not_derivable` and say why — a frozen historical record is the clearest
// case, because a record somebody edits to match the tree is not a record. AND SOME ARE DERIVED
// FROM THE OPT-IN: the comparison runs against the modules that DECLARED themselves rather than
// against the modules that do the thing, so a module doing it another way is outside the list and
// outside the derivation that checks the list, and both stay green.
//
// W370's Q28-SIMP-1 IS THE FIRST INSTANCE AND THIS UNIT IS WHERE IT WAS OWED. `SCAN_SITES` names
// every module that asks the shared text preparation and `scanSiteDiff` checks it both ways —
// against the modules that CALL `prepareForScan`. The modules that read source text with
// `stripComments` instead are invisible to both, and `undeclaredTextReaders` names them. THE
// DERIVATION DISAGREES WITH THE FINDING THAT ASKED FOR IT: W370 raised this as a hand count off a
// file listing, and a hand count and a derivation are different findings — which is the whole
// argument of this unit, arriving in its own first sentence. The same shape appears twice more in
// registers this reader built, recorded here rather than discovered later.
//
// WHAT IT CANNOT SEE is `DERIVABLE_BOUND`, below.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own source text.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/** How the tree checks a hand-listed register, if it does. */
export type Checker =
  /** A function anything can call. `name` is `module::export` and is resolved. */
  | { kind: "callable"; name: string }
  /** The comparison is welded inside a `.test.ts`. `file` is resolved and must name the register. */
  | { kind: "welded"; file: string };

/** How a register's membership stands against the tree. */
export type Membership =
  /** Something compares the list against a walk of the tree, both ways. */
  | { kind: "derived"; by: Checker }
  /**
   * THE FINDING: the comparison runs against the modules that DECLARED themselves.
   *
   * `misses` names what does the same thing another way and is outside both the list and the
   * derivation that checks it.
   */
  | { kind: "derived_from_the_opt_in"; by: Checker; misses: string }
  /** Nothing compares it. `derivation` is what would. */
  | { kind: "unchecked"; derivation: string }
  /** A derivation would be wrong, not merely absent. */
  | { kind: "not_derivable"; why: string };

/** One hand-listed register. */
export interface ListedRegister {
  /** `module::NAME`, as the population scan spells it. */
  id: string;
  membership: Membership;
}

// The key may open the entry on its own line or sit inline after the brace. The first draft
// required the line to START with it, which missed every register written `{ module: "x", ... }`
// on one line — a population scan narrowed by how its subject is formatted, which is W366's
// subject and was caught here by a plant that used the other spelling.
const NAMES_A_MODULE = /(?:^\s*|\{\s*)(?:module|file|register|detector|bound|home):\s*"[^"]*\.tsx?"/m;

/**
 * Every exported list in this tree whose entries name a module path.
 *
 * DERIVED, because a register about hand-listed registers that kept its own hand-listed population
 * would be the joke it sounds like. Literals are KEPT: the module paths inside the entries are the
 * subject, and blanking them would empty the thing this looks for.
 */
export function handListedRegisters(root: string): string[] {
  const found: string[] = [];
  for (const file of sourceModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = prepareForScan(readFileSync(file, "utf8"), { literals: "kept" });
    // THE NEWLINE AFTER THE BRACKET IS LOAD-BEARING. Without it an EMPTY register written
    // `= [];` on one line has no `\n];` of its own, so the non-greedy body ran forward to the next
    // array's terminator and swallowed every declaration in between — the empty register was
    // reported and the real one after it was invisible. W374 planted an empty register beside a
    // real one and this scan reported exactly the wrong one of the two.
    for (const m of code.matchAll(/export const ([A-Z][A-Z0-9_]*): readonly [^=]+= \[\n([\s\S]*?)\n\];/g)) {
      if (NAMES_A_MODULE.test(m[2]!)) found.push(`${rel}::${m[1]}`);
    }
  }
  return found.sort();
}

const callable = (name: string): Membership => ({ kind: "derived", by: { kind: "callable", name } });
const welded = (file: string): Membership => ({ kind: "derived", by: { kind: "welded", file } });

export const LISTED_REGISTERS: readonly ListedRegister[] = [
  {
    id: "src/quality/horizon-q29-gate.ts::POPULATIONS_AT_W376",
    membership: {
      kind: "derived",
      by: { kind: "callable", name: "src/quality/horizon-q29-gate.ts::unitsInHorizon" },
    },
  },
  {
    id: "src/collateral/figures.ts::FIGURES",
    membership: {
      kind: "not_derivable",
      why: "The figures a founder puts in front of an investor: a market size, an adoption rate, a saving per practice. They are claims about the WORLD rather than about this tree, so no walk of this repository could produce the list — and the register beside them, `NEEDS_FOUNDER_VERIFICATION`, is the mechanism that fits, because what these need is a person checking a source rather than a derivation checking a file.",
    },
  },
  { id: "src/compliance/composed-copy.ts::COMPOSED_COPY_SITES", membership: welded("src/compliance/composed-copy.test.ts") },
  { id: "src/privacy/automated-decisions.ts::AUTOMATED_DECISIONS", membership: welded("src/privacy/automated-decisions.test.ts") },
  { id: "src/quality/empty-populations.ts::EMPTY_AT_W369", membership: callable("src/quality/empty-populations.ts::emptyPopulationDefects") },
  { id: "src/compliance/cdss-boundary.ts::OPERATOR_COPY_SURFACES", membership: welded("src/compliance/cdss-boundary.test.ts") },
  { id: "src/compliance/cdss-boundary.ts::ACCEPTED_COPY_FINDINGS", membership: welded("src/compliance/cdss-boundary.test.ts") },
  { id: "src/compliance/composed-copy.ts::ACCEPTED_COMPOSED_FINDINGS", membership: welded("src/compliance/composed-copy.test.ts") },
  { id: "src/directory/disclosure.ts::CLINICIAN_RECORD_CLASSES", membership: welded("src/directory/disclosure.test.ts") },
  { id: "src/privacy/access-y5.ts::ACCESS_PATHS", membership: welded("src/privacy/access-y5.test.ts") },
  { id: "src/privacy/erasure-y5.ts::ERASURE_PATHS", membership: welded("src/privacy/erasure-y5.test.ts") },
  { id: "src/privacy/record-classes.ts::RECORD_CLASSES", membership: welded("src/privacy/record-classes.test.ts") },
  { id: "src/quality/acceptances.ts::ACCEPTANCE_REGISTERS", membership: welded("src/quality/acceptances.test.ts") },
  { id: "src/quality/bounds.ts::STATED_BOUNDS", membership: callable("src/quality/bounds.ts::unresolvedBounds") },
  { id: "src/quality/claim-classes.ts::CLASS_ANSWERS", membership: callable("src/quality/claim-classes.ts::classDefects") },
  { id: "src/quality/close-gate.ts::NOT_A_CLOSING_CHECK", membership: callable("src/quality/close-gate.ts::readerDiff") },
  { id: "src/quality/controls.ts::CONTROL_ANSWERS", membership: callable("src/quality/controls.ts::controlDefects") },
  { id: "src/quality/declaration-tax.ts::EDIT_SITES_AT_W308", membership: welded("src/quality/declaration-tax.test.ts") },
  { id: "src/quality/declaration-tax.ts::DEMANDS", membership: callable("src/quality/declaration-tax.ts::taxDiff") },
  { id: "src/quality/declaration-tax.ts::DECLARATION_HOMES", membership: callable("src/quality/declaration-tax.ts::homeDiff") },
  {
    id: "src/quality/exemption-reach.ts::EXEMPTIONS",
    membership: {
      kind: "derived_from_the_opt_in",
      by: { kind: "callable", name: "src/quality/exemption-reach.ts::appliedExemptions" },
      misses:
        "an exemption that is not spelled as a detector's defaulted `Readonly<Record<string, string>>` parameter — welded inside a function, keyed by a typed record, or held as a skip list in an array. `REACH_BOUND` says so in its first clause; what this register adds is that saying so does not make the census mean more than it does, because the derivation the census is checked against reads the same idiom the list does.",
    },
  },
  { id: "src/quality/failure-direction.ts::ARGUED_DIRECTIONS", membership: callable("src/quality/failure-direction.ts::directionDefects") },
  { id: "src/quality/manifest.ts::MANIFEST", membership: callable("src/quality/manifest.ts::manifestDiff") },
  { id: "src/quality/negative-probes.ts::NEGATIVE_PROBES", membership: callable("src/quality/negative-probes.ts::negativeDiff") },
  { id: "src/quality/order-independence.ts::FOLD_SITES", membership: callable("src/quality/order-independence.ts::diffFoldRegister") },
  { id: "src/quality/patient-populations.ts::RULES_AT_W373", membership: callable("src/quality/patient-populations.ts::ruleDefects") },
  { id: "src/quality/pins.ts::PINS", membership: callable("src/quality/pins.ts::pinDiff") },
  { id: "src/quality/populations.ts::POPULATIONS", membership: callable("src/quality/populations.ts::populationDefects") },
  { id: "src/quality/private-copies.ts::DECLARED_COPIES", membership: callable("src/quality/private-copies.ts::copyDefects") },
  { id: "src/quality/prose-numbers.ts::CLAIMS", membership: callable("src/quality/prose-numbers.ts::claimDefects") },
  { id: "src/quality/quarter-mutants-q28.ts::EXCLUDED_AT_W374", membership: callable("src/quality/quarter-mutants-q28.ts::populationDefects") },
  {
    id: "src/quality/quarter-mutants-q28.ts::CLOSED_BY_W374",
    membership: {
      kind: "not_derivable",
      why: "The mutants a run found and closed. It is a RECORD OF AN EVENT — a sweep that happened once, over a tree that has since changed — and no walk of the tree today could reproduce it: the whole point of three of its four rows is that the line they name is still there and now has an assertion over it, and of the fourth that the line is gone. Deriving it would mean re-running the sweep, which is the thing the record exists to save.",
    },
  },
  { id: "src/quality/quarter-mutants-q26.ts::EXCLUDED_AT_W349", membership: callable("src/quality/quarter-mutants-q26.ts::populationDefects") },
  { id: "src/quality/quarter-mutants-q27.ts::EXCLUDED_AT_W362", membership: callable("src/quality/quarter-mutants-q27.ts::populationDefects") },
  { id: "src/quality/quarter-mutants-q27.ts::UNMUTATED_AT_W362", membership: callable("src/quality/quarter-mutants-q27.ts::populationDefects") },
  {
    id: "src/quality/scan-text.ts::SCAN_SITES",
    membership: {
      kind: "derived_from_the_opt_in",
      by: { kind: "callable", name: "src/quality/scan-text.ts::scanSiteDiff" },
      misses:
        "every module that reads source text with `stripComments` instead of asking for the shared preparation. `scanSiteDiff` compares the list against the modules that CALL `prepareForScan`, so the two agree exactly and neither has ever seen the others: they take one preparation without declaring which they want or arguing that literals do not matter to them. THIS IS W370's Q28-SIMP-1, owed to this unit and discharged here as a measurement rather than a sentence — `undeclaredTextReaders` returns them by name.",
    },
  },
  { id: "src/quality/self-ending.ts::ENDING_REGISTERS", membership: callable("src/quality/self-ending.ts::endingDiff") },
  { id: "src/quality/self-reference.ts::SPLIT_EXCEPTIONS", membership: callable("src/quality/self-reference.ts::splitDiff") },
  {
    id: "src/quality/spelling-markers.ts::MARKERS",
    membership: {
      kind: "derived_from_the_opt_in",
      by: { kind: "callable", name: "src/quality/spelling-markers.ts::censusDefects" },
      misses:
        "the same modules `SCAN_SITES` misses, inherited rather than acquired: this register takes ITS population from that one, so a module reading text outside the shared preparation is outside this census too and no second spelling is ever tried against its marker. `SPELLING_BOUND`'s third clause names `register-census.ts` as one such module by hand — which is the right sentence and the wrong instrument, because a hand-named instance is not a derivation.",
    },
  },
  { id: "src/quality/tautology-sweep.ts::ACCEPTED_TAUTOLOGIES", membership: welded("src/quality/tautology-sweep.test.ts") },
  { id: "src/quality/unit-headers.ts::ADOPTED_MODULES", membership: welded("src/quality/unit-headers.test.ts") },
  { id: "src/quality/unrun.ts::UNRUN_MODULES", membership: callable("src/quality/unrun.ts::unrunDefects") },
  {
    id: "src/referrals/scoping.ts::REFERRAL_SCOPING",
    membership: {
      kind: "not_derivable",
      why: "Which fields a referral may carry for each scope: a PRODUCT rule and a compliance boundary, decided by a person reading the TGA line and the privacy position, not a fact about this repository. A derivation could tell you which fields the code touches, which is the opposite direction — the register exists to constrain the code rather than to describe it, and deriving it from the code would make it agree with whatever the code does.",
    },
  },
  { id: "src/security/page-reach.ts::DORMANT_MODULES", membership: welded("src/security/page-reach.test.ts") },
  { id: "src/tenancy/fixture-coherence.ts::SEEDED_STORES", membership: callable("src/tenancy/fixture-coherence.ts::coherenceViolations") },
  { id: "src/tenancy/store-reads.ts::STORE_READS", membership: welded("src/tenancy/store-reads.test.ts") },
];

/** What is wrong with the register, in the tree's words. */
export interface ListDefect {
  id: string;
  what: string;
}

/** Every hand-listed register the table misses, and every row naming one the tree no longer holds. */
export function listCensusDefects(
  root: string,
  listed: readonly ListedRegister[] = LISTED_REGISTERS,
): ListDefect[] {
  const declared = new Set(listed.map((l) => l.id));
  const found = new Set(handListedRegisters(root));
  const defects: ListDefect[] = [];
  for (const id of found) {
    if (!declared.has(id)) defects.push({ id, what: "is a hand-listed register and no row says whether the tree could derive it" });
  }
  for (const id of declared) {
    if (!found.has(id)) defects.push({ id, what: "is declared and the tree no longer holds it as a hand-listed register" });
  }
  return defects.sort((a, b) => a.id.localeCompare(b.id));
}

/** Every row whose checker the tree does not hold. */
export function checkerDefects(
  root: string,
  listed: readonly ListedRegister[] = LISTED_REGISTERS,
): ListDefect[] {
  const defects: ListDefect[] = [];
  for (const entry of listed) {
    const membership = entry.membership;
    if (membership.kind === "unchecked" || membership.kind === "not_derivable") continue;
    const checker = membership.by;
    if (checker.kind === "callable") {
      const [file, name] = checker.name.split("::");
      const full = path.join(root, file!);
      const source = readFileSync(full, "utf8");
      if (!new RegExp(`export function ${name}\\(`).test(source)) {
        defects.push({ id: entry.id, what: `cites ${checker.name}, which the module does not export` });
      }
      continue;
    }
    const register = entry.id.split("::")[1]!;
    const source = readFileSync(path.join(root, checker.file), "utf8");
    if (!source.includes(register)) {
      defects.push({ id: entry.id, what: `cites ${checker.file}, which does not name ${register}` });
    }
  }
  return defects;
}

/** The registers checked against a derivation of who declared themselves. The finding. */
export function optInDerivations(listed: readonly ListedRegister[] = LISTED_REGISTERS): string[] {
  return listed.filter((l) => l.membership.kind === "derived_from_the_opt_in").map((l) => l.id).sort();
}

/** The registers checked only inside a `.test.ts`, so nothing outside can run the comparison. */
export function weldedDerivations(listed: readonly ListedRegister[] = LISTED_REGISTERS): string[] {
  return listed
    .filter((l) => (l.membership.kind === "derived" || l.membership.kind === "derived_from_the_opt_in") && l.membership.by.kind === "welded")
    .map((l) => l.id)
    .sort();
}

/**
 * W370's Q28-SIMP-1, discharged as a measurement.
 *
 * Every module that reads source text and is outside `SCAN_SITES` — the register whose whole
 * subject is modules that read source text. Derived from the BEHAVIOUR rather than from the call
 * that opts in, which is the difference the finding is about.
 */
export function undeclaredTextReaders(root: string, declared: readonly string[]): string[] {
  const found: string[] = [];
  for (const file of sourceModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (declared.includes(rel)) continue;
    const raw = readFileSync(file, "utf8");
    const code = prepareForScan(raw, { literals: "blanked" });
    // The HOME of the shared preparation is not a module scanning outside it: `prepareForScan`
    // calls `stripComments` on the way to answering, and a register that reported its own home
    // would be reporting the remedy as the defect.
    if (/export function (?:stripComments|prepareForScan)/.test(code)) continue;
    if (/\bstripComments\s*\(/.test(code)) found.push(rel);
  }
  return found.sort();
}

export const DERIVABLE_BOUND =
  "THE POPULATION IS ONE SHAPE OF LIST, NOT EVERY LIST. This finds an exported `readonly T[]` whose " +
  "entries name a module path, which is what a register ABOUT this tree looks like. A hand-listed " +
  "register keyed by something else — a route, a unit id, a store name, a record class — is " +
  "outside the scan entirely, and there are more of those than of these. SECOND, `derived` IS A " +
  "CLAIM ABOUT WHAT A CHECKER IS FOR, NOT A PROOF THAT IT WORKS. Each row's checker is resolved — " +
  "a callable that the module must export, a test file that must name the register — and neither " +
  "resolution says the comparison runs in BOTH directions or that it walks the tree at all. A " +
  "register whose diff compares the list against itself would resolve exactly as well, which is " +
  "the failure this quarter's theme would call a population that is narrower than its claim. The " +
  "remedy is a checker resolved by what it WALKS rather than by its name, and the predicate beside " +
  "this sentence goes false when somebody writes it. " +
  "THIRD, `not_derivable` IS THE ONE JUDGEMENT HERE AND IT IS NOT CHECKABLE. That a founder's " +
  "figures are about the world, that a frozen record must stay frozen, that a product rule " +
  "constrains the code rather than describing it — each is an argument a reader has to agree with, " +
  "and nothing fails if a later unit makes one of them derivable and nobody notices.";

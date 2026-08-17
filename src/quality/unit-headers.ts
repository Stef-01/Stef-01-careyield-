// W281: every module carries its unit header, checked at the door.
//
// CENSUS-1, recorded by W210, closed here. W200's copy surface decides which modules it must cover
// by reading each module's `// W<n>` header, so a module with NO header is invisible to it — not
// declared, not linted, and not reported as missing. The finding was filed as latent on the
// grounds that the eleven such modules were "all Year-1 infrastructure that holds no operator
// copy", and the check was a COUNT: fire when a twelfth appears.
//
// A COUNT WAS THE WRONG SHAPE, for the reason this tree has now recorded four times. `count > 11`
// tolerates eleven forever and says nothing about which eleven. It cannot notice one leaving and
// another arriving. And it made the eleven feel accounted for when what had actually happened is
// that nobody had looked at them since W210. The door is `missing.length === 0`, which needs no
// pin and cannot drift.
//
// WHAT LOOKING FOUND, AND IT IS NOT WHAT THE FINDING SAID. The eleven are four different problems:
//
//   THREE HAD RECORDED THEIR UNIT AND WERE COUNTED AS HAVING NOT. `domain/types.ts` opened with
//   "// Meherr core domain model (W2)." — the unit is RIGHT THERE, at the end of the line, where a
//   `^// W\d+` detector cannot see it. `lib/dates.ts` says "(W26 consolidation)" on its second
//   line. `lib/version.ts` records its unit as a VALUE, `export const BUILD_UNIT = "W1"`. A
//   detector that reports "no unit" for a file whose first line says `(W2)` is measuring
//   FORMATTING, not provenance — which is W283's finding one register over, arrived at from the
//   opposite direction: there a behavioural claim was pinned to text, here textual provenance was
//   pinned to a position.
//
//   TWO HAD A DESCRIPTIVE COMMENT AND NO UNIT (`lib/secret.ts`, `synthetic/rng.ts`) and two had no
//   comment at all (`lib/mock-guard.ts`, `lib/demo-guard.ts`). All four came from numbered units —
//   W13, W3, W13, W37 — recoverable from the commit that added them, so nothing was invented.
//
//   AND FOUR WERE WRITTEN OUTSIDE THE UNIT LOOP ENTIRELY. `demo/clinicians.ts`,
//   `demo/care-archetypes.ts`, `interest/store.ts` and `interest/types.ts` were added on
//   2026-08-09 by commits carrying no unit number — founder-side work, interleaved between W51 and
//   W65. They had no header because there was no unit to name. That is the class the convention
//   cannot reach on its own, and it is the one that mattered.
//
// BECAUSE `src/demo/clinicians.ts` IS 731 STRINGS OF PATIENT-FACING PROSE. CENSUS-1's own words
// were that the header-less modules "hold no operator copy, which is why this is latent rather
// than live". That sentence is false, and this is the module that falsifies it: the largest body
// of rendered copy in the tree, in the census's blind spot for a year. Adopted into W200's
// declared surface at W281, linted for the first time, three findings recorded with arguments.
//
// THE DOOR CHECKS THREE THINGS, because a header is a MEMBERSHIP CLAIM and not just a label.
// W200's census covers `unit >= COPY_SURFACE_FLOOR`, so the number a module writes about itself
// decides whether the copy linter ever reads it:
//
//   1. `missing` — no `// W<n>` first line. The original finding.
//   2. `misplaced` — a unit recorded somewhere in the preamble but not in the header position.
//      Reported SEPARATELY from `missing`, because they are different repairs and lumping them is
//      exactly what made three documented modules read as undocumented.
//   3. `unknownUnit` — a header naming a unit the ledger does not have. `// W999` is a header.
//
// A HEADER NAMES THE OWNING UNIT, WHICH IS NOT THE SAME AS THE MODULE'S AGE — and W281 learned
// that from its own verify run rather than by reasoning. Stamping the four loop-external modules
// `// W281` is honest about who owns them and makes every unit-keyed register read them as NEW.
// One register reads age in the unsafe direction: W265's erasure re-derivation asks "did Year 5
// add a `stored` class", and `interest/store.ts` — written in 2026, adopted at W281 — answered
// yes. Nothing about the module had changed. So adoption is DECLARED, in `ADOPTED_MODULES` below,
// and a derivation about when a module ARRIVED subtracts it. Derivations about coverage do not:
// there the adoption header pulls an old module INTO the copy census, which is the entire point.
//
// KNOWN BOUND, stated because it is the one thing the door cannot check: a NEW module can stamp
// itself with a real but early unit — `// W2` on a module written today — and sit below the copy
// floor without lying in any way this file can detect. Catching that needs the commit that added
// the file, which is git history rather than the tree, and every other register here derives from
// the tree. It is recorded rather than papered over, and it is a smaller hole than the one closed:
// under-claiming a unit takes a deliberate wrong number, where before it took forgetting.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads module headers and the ledger's unit ids.

import { readFileSync } from "node:fs";
import path from "node:path";
import { parseLedgerRows } from "./blocked-surface";
import { sourceModules, typescriptFiles } from "./tree-walks";

/** The shape, in one sentence, so the rule is quotable rather than only enforced. */
export const HEADER_RULE =
  "Every module under `src/` opens with `// W<n>`, naming the unit that owns it, as the FIRST " +
  "line. Not `(W<n>)` at the end of a sentence and not a `BUILD_UNIT` value — W200's census reads " +
  "the header position, so a unit recorded anywhere else is a unit the copy linter never sees.";

/** The unit a module's header claims, or `null` if it has no header. */
export function headerUnit(text: string): number | null {
  const match = /^\/\/ W(\d+)\b/.exec(text.split("\n")[0] ?? "");
  return match ? Number(match[1]) : null;
}

/**
 * A unit recorded in the preamble but NOT in the header position.
 *
 * The three modules W281 found: `(W2).` at the end of line one, `(W26 consolidation)` on line two,
 * and `BUILD_UNIT = "W1"` as a value. Only consulted when `headerUnit` is null — a module with a
 * proper header is not searched for a second opinion.
 */
export function misplacedUnit(text: string): number | null {
  if (headerUnit(text) !== null) return null;
  const preamble = text.split("\n").slice(0, 6).join("\n");
  const match = /\bW(\d+)\b/.exec(preamble);
  return match ? Number(match[1]) : null;
}

/**
 * The unit ids the ledger has, read from the ledger.
 *
 * Derived rather than bounded by a maximum: `n <= 286` would need editing every quarter, and a
 * range check would accept a gap. The ledger is the list of units that exist, so it is the list.
 */
export function knownUnits(ledger: string): Set<number> {
  // W285 SIMPLIFY: this had its own `/^\| W(\d+) \|/gm`, a second ledger-row regex in a tree that
  // already had one — W263's `blocked-surface.ts` has parsed rows since Q20. Two spellings of the
  // same parse is the duplication W282's header names: "one bespoke copy is a file, two are a
  // pattern nobody declared, and the third gets written by copying whichever of the two its author
  // found first." Composed now, and the row shape lives in one place.
  return new Set(parseLedgerRows(ledger).map((row) => Number(row.id.slice(1))));
}

export interface HeaderCensus {
  /** Modules with no `// W<n>` first line. The list this unit exists to keep empty. */
  missing: string[];
  /** Modules whose unit is recorded, but somewhere the census cannot read it. */
  misplaced: Array<{ module: string; unit: number }>;
  /** Modules whose header names a unit the ledger does not have. */
  unknownUnit: Array<{ module: string; unit: number }>;
}

/** Every module's header, checked against the tree and the ledger. */
export function headerCensus(root: string, ledger: string): HeaderCensus {
  const units = knownUnits(ledger);
  const census: HeaderCensus = { missing: [], misplaced: [], unknownUnit: [] };
  for (const file of sourceModules(root)) {
    const text = readFileSync(file, "utf8");
    const module = path.relative(root, file).split(path.sep).join("/");
    const unit = headerUnit(text);
    if (unit === null) {
      const elsewhere = misplacedUnit(text);
      if (elsewhere === null) census.missing.push(module);
      else census.misplaced.push({ module, unit: elsewhere });
    } else if (!units.has(unit)) {
      census.unknownUnit.push({ module, unit });
    }
  }
  census.missing.sort();
  census.misplaced.sort((a, b) => a.module.localeCompare(b.module));
  census.unknownUnit.sort((a, b) => a.module.localeCompare(b.module));
  return census;
}

/** Everything the door refuses, as one list, so a caller cannot check two thirds of it. */
export function headerViolations(root: string, ledger: string): string[] {
  const census = headerCensus(root, ledger);
  return [
    ...census.missing.map((m) => `${m}: no \`// W<n>\` header`),
    ...census.misplaced.map((m) => `${m.module}: unit W${m.unit} recorded outside the header position`),
    ...census.unknownUnit.map((m) => `${m.module}: header names W${m.unit}, which the ledger does not have`),
  ].sort();
}

export interface AdoptedModule {
  module: string;
  /** The unit whose header it now carries. */
  adoptedBy: string;
  /** When it was actually written, from the commit that added it. */
  writtenAt: string;
  /** The commit subject, which is the evidence that no unit wrote it. */
  provenance: string;
}

/**
 * Modules whose header names the unit that ADOPTED them, not the unit that wrote them.
 *
 * Four, all from 2026-08-09, all from commits carrying no unit number — founder-side work
 * interleaved between W51 and W65. They are the class the header convention cannot reach on its
 * own, because there was no unit to name.
 *
 * Declared rather than inferred: "this header is an adoption" is a claim somebody has to make, and
 * a register that guessed it from a date would be re-deriving git history from the tree.
 */
export const ADOPTED_MODULES: readonly AdoptedModule[] = [
  {
    module: "src/demo/clinicians.ts",
    adoptedBy: "W281",
    writtenAt: "2026-08-09",
    provenance: "Build voice-first clinician finder",
  },
  {
    module: "src/demo/care-archetypes.ts",
    adoptedBy: "W281",
    writtenAt: "2026-08-09",
    provenance: "Overhaul patient and clinician demo flows",
  },
  {
    module: "src/interest/store.ts",
    adoptedBy: "W281",
    writtenAt: "2026-08-09",
    provenance: "Reframe CareYield around Blacktown PMOS community",
  },
  {
    module: "src/interest/types.ts",
    adoptedBy: "W281",
    writtenAt: "2026-08-09",
    provenance: "Reframe CareYield around Blacktown PMOS community",
  },
];

/**
 * Modules whose header unit must not be read as the unit they arrived in.
 *
 * For a derivation asking "what did year N add". A derivation asking "what does the copy census
 * cover" wants the opposite and should not call this.
 */
export function adoptedModuleNames(): Set<string> {
  return new Set(ADOPTED_MODULES.map((m) => m.module));
}

/**
 * W298: every backticked `SCREAMING_CASE` name a module's header claims, that the tree does not have.
 *
 * THE DEFECT IS A HEADER DESCRIBING A DESIGN THE MODULE NO LONGER HAS, and this quarter shipped it
 * three times. W293's header quoted the figures its own sweep produced while it was broken; W296's
 * described the STRIDE it was built with after the selection was replaced by a hash, naming a
 * sampling constant that no longer exists; W264's names a refusal-drive MAP that became a
 * function. (Neither name is written here: this doc would then contain the tokens the scan looks
 * for, and the scan reads the whole tree — the fifteenth instance of that collision, and it hid
 * both findings on the first run of this very function.) Every one passed every gate, because a green suite says nothing about prose.
 *
 * A NAME IS THE CHECKABLE PART OF A SENTENCE. Whether a paragraph still describes the code is not
 * mechanically decidable, but whether the identifiers it cites EXIST is — and in all three cases
 * the stale paragraph named something gone. That is the cheap half of the problem and this closes
 * it; the expensive half stays open and `HEADER_CITATION_BOUND` says so.
 *
 * Underscored names only: `HEAD`, `TODO` and `README` are English in this tree's prose, and a
 * detector that reported them would be a chore rather than a control.
 */
export function headerNamesUnknown(root: string, files: readonly string[] = sourceModules(root)): string[] {
  const whole = typescriptFiles(root)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const out: string[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const cut = source.indexOf("\nimport ");
    const header = cut > 0 ? source.slice(0, cut) : "";
    if (!header) continue;
    const rest = whole.replace(header, "");
    for (const match of header.matchAll(/`([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)`/g)) {
      const name = match[1]!;
      if (!new RegExp(`\\b${name}\\b`).test(rest)) {
        out.push(`${path.relative(root, file).split(path.sep).join("/")}::${name}`);
      }
    }
  }
  return [...new Set(out)].sort();
}

/** What a green `headerNamesUnknown` does not prove. */
export const HEADER_CITATION_BOUND =
  "This resolves the NAMES a header cites, not its claims. A header describing the wrong algorithm " +
  "in correct identifiers passes, and that is the larger half: W293's stale header named nothing " +
  "that had gone, it quoted numbers that had changed. Nothing mechanical closes that; what closed " +
  "it there was a rule against stating counts in a header at all, and rules of that shape have to " +
  "be found a class at a time.";

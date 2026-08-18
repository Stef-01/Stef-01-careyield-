// W342: a field that names a unit, a module or an export — typed, and resolved.
//
// W329 FOUND A CITATION NOBODY HAD RESOLVED, in a field typed `string` beside a twin W318 had
// already typed `UnitId`. Two halves, and this unit is about both:
//
//   · A NAME IS DATA ABOUT THE TREE. `unit: "W318"` is a claim that this repository holds a row
//     W318; `module: "src/quality/bounds.ts"` is a claim that the file is there; `check:
//     "src/quality/close-gate.ts::weldedLedgerTests"` is a claim that the export exists. Nothing
//     had ever checked the second and third kinds outside the handful of registers that resolve
//     their own citations, and a register naming a module that has moved reads as coverage.
//   · A TYPE IS NOT A RESOLUTION, AND A RESOLUTION IS NOT A TYPE. `UnitId` stops `W299+` from
//     compiling and says nothing about whether the tree holds W299; `controls.ts` carries a
//     fabricated `by: "W900"` that the type accepts and the ledger has never heard of. The two
//     checks answer different questions and this register runs both, which is why the loose-typing
//     arm is not "the resolution would have caught it anyway".
//
// THE POPULATION IS THE DATA, NOT THE PROSE AND NOT THE PROBES. Every name-shaped string literal
// in the tree, at PAREN DEPTH ZERO — inside an exported register's declaration rather than inside
// a call. That narrowing is the whole reason this register can say anything: the tree holds 1674
// name-shaped literals and 132 of them are unresolvable ON PURPOSE, because a probe hands a
// detector `src/gone.ts` to watch it report a module that is not there. Restricted to declared
// data the population is 981 and the unresolvable set is nine, each a fabricated finding or
// control declared at top level, each argued in `PLANTED_NAMES`.
//
// A SENTENCE MENTIONING A UNIT IS NOT A CITATION. Comments are subtracted before the scan and the
// value must match a name shape END TO END: `"W318"` is a citation, and a two-hundred-word
// argument containing "W318 typed the deferred arm" is prose. That is the same distinction W168
// made about folds and W288 about assertions, and it is why this register does not need an
// exemption for every register that explains itself.
//
// WHAT IT CANNOT SEE is `TYPED_NAME_BOUND`, below.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own source text and ledger.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { allLedgerRows } from "./blocked-surface";
import { prepareForScan } from "./scan-text";
import { typescriptFiles } from "./tree-walks";

/**
 * The tree's unit id, in one place.
 *
 * W318 typed the first field, W329 asked why the twin beside it was a `string`, and by W342 the
 * type itself had been written three times — `hardening-q22.ts`, `controls.ts`, `claim-classes.ts`
 * — which is W341's finding in the type system rather than in a parse. One definition, imported.
 */
export type UnitId = `W${number}`;

/** A string is a unit id when it is shaped like one. The type's runtime half. */
export function isUnitId(value: string): value is UnitId {
  return UNIT.test(value);
}

/**
 * A `string` read out of a document, narrowed — or a throw naming the value that failed.
 *
 * THE BOUNDARY IS WHERE THE TYPE STOPS BEING FREE. `UnitId` costs nothing at a literal, where the
 * compiler checks it; at a parse it is a claim about text somebody wrote in a markdown table, and
 * a cast there buys the appearance of the type with none of the check. This is the narrowing that
 * pays for it, and `controlsInHorizon` is where W342 found the cast that was standing in for one.
 */
export function asUnitId(value: string): UnitId {
  if (!isUnitId(value)) throw new Error(`${value}: not a unit id`);
  return value;
}

/** What a name-shaped value claims about this tree. */
export type NameKind = "unit" | "module" | "export";

/** A ledger row id: a week-unit, or one of the other rows W310 made visible. */
const UNIT = /^W\d+$/;
/** A repo-relative path to a file this tree holds. */
const MODULE_PATH = /^(src|app|e2e|scripts|docs|supabase)\/[\w./-]+\.(ts|tsx|md|sql|mts)$/;
/** The tight citation spelling: `<file>::<export>`, optionally reaching a member. */
const EXPORT_CITATION = /^[\w./-]+\.tsx?::[A-Za-z_][\w.]*$/;

/** The shape a value has, or `null` when the value names nothing. */
export function kindOf(value: string): NameKind | null {
  if (UNIT.test(value)) return "unit";
  if (MODULE_PATH.test(value)) return "module";
  if (EXPORT_CITATION.test(value)) return "export";
  return null;
}

/** One field of one register, carrying one name. */
export interface NameSite {
  /** Repo-relative, posix separators. */
  module: string;
  /** The field the value sits behind, as the source writes it. */
  field: string;
  kind: NameKind;
  value: string;
}

/**
 * A predicate for "this offset is not inside a call".
 *
 * THE NARROWING, AND IT IS THE UNIT'S ONE PIECE OF MACHINERY. A register's data is written at
 * `export const X = [{ field: "value" }]` — no parenthesis open. A probe's fabricated name is an
 * argument: `withTree({ "src/gone.ts": ... })`, `resolveName(root, "src/nowhere.ts")`, or a value
 * inside a `probe: () => ...` body. Counting parentheses separates the two without a list of
 * exempted files, which is the alternative this tree refuses: an excluded file is a place to hide
 * something.
 */
function outsideCalls(code: string): (offset: number) => boolean {
  const depth = new Int32Array(code.length + 1);
  let open = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === "(") open++;
    else if (c === ")") open = Math.max(0, open - 1);
    depth[i] = open;
  }
  return (offset) => depth[offset] === 0;
}

/** Every name a register's declared data carries, under `root`. */
export function nameSites(root: string): NameSite[] {
  const found: NameSite[] = [];
  for (const full of typescriptFiles(root)) {
    const module = path.relative(root, full).split(path.sep).join("/");
    // Literals KEPT — the literal IS the subject. Comments subtracted — see the module note.
    const code = prepareForScan(readFileSync(full, "utf8"), { literals: "kept" });
    const outside = outsideCalls(code);
    for (const match of code.matchAll(/(\w+): "([^"\n]+)"/g)) {
      if (match.index === undefined || !outside(match.index)) continue;
      const [, field, value] = match;
      const kind = kindOf(value!);
      if (kind === null) continue;
      found.push({ module, field: field!, kind, value: value! });
    }
  }
  return found.sort((a, b) =>
    `${a.module}${a.field}${a.value}`.localeCompare(`${b.module}${b.field}${b.value}`),
  );
}

/** `true`, or the reason the name does not resolve. Three causes, kept distinct — W301's rule. */
export function resolveName(root: string, kind: NameKind, value: string): true | string {
  if (kind === "unit") {
    // A TREE WITH NO LEDGER IS AN ANSWER, NOT A THROW. The first draft let `allLedgerRows` throw
    // `ENOENT` through a resolver, which is Q24-CR-7's shape — the defect W339 found one unit
    // earlier in a bound predicate, arriving here the moment this ran against a constructed tree.
    let rows;
    try {
      rows = allLedgerRows(root);
    } catch {
      return `${value}: this tree holds no ledger to resolve it against`;
    }
    return rows.some((row) => row.id === value) ? true : `${value}: the ledger holds no such row`;
  }
  if (kind === "module") {
    return existsSync(path.join(root, value)) ? true : `${value}: names a file that does not exist`;
  }
  const [file, member] = value.split("::");
  if (!existsSync(path.join(root, file!))) return `${value}: names a file that does not exist`;
  // The export, not the member reached through it: `SWEEP_BOUND.stillOpen` resolves when the
  // module exports `SWEEP_BOUND`, because a property is not something a text scan can promise.
  const exported = member!.split(".")[0]!;
  return readFileSync(path.join(root, file!), "utf8").includes(exported)
    ? true
    : `${value}: the file does not contain that export`;
}

/** A name a register declares BECAUSE it is not there — a fabrication a probe hands to a check. */
export interface PlantedName {
  value: string;
  why: string;
}

/**
 * The nine, each argued.
 *
 * Every one is a fabricated input declared at top level so a probe can hand it to a detector and
 * watch the detector speak. They are not defects and they are not exemptions either: the register
 * checks them in both directions, so a fabrication that starts resolving — somebody creating
 * `src/planted/moves.ts` for real — fails here rather than quietly becoming a real citation.
 */
export const PLANTED_NAMES: readonly PlantedName[] = [
  {
    value: "W9999",
    why: "W289's drive hands a register a unit id no ledger will ever hold, so the arm that reports an unresolvable unit can be shown firing. A four-digit unit is out of this plan's reach by construction.",
  },
  {
    value: "W900",
    why: "W326's overdue-clock probe: a finding deferred to a unit that the handed-in ledger already closes. The value must NOT be a real row or the clock it drives could never run out.",
  },
  {
    value: "src/w289-probe.ts",
    why: "The module a W289 drive claims to be about. It is never written to disk — the drive hands the name to a comparison and requires the comparison to report it as absent.",
  },
  {
    value: "src/planted/moves.ts::moves",
    why: "W327's control probe: a declared control that says it moves, so the register can be shown reporting one that stands still. The file is planted inside a constructed tree, never here.",
  },
  {
    value: "src/planted/unreachable.ts::unreachable",
    why: "The twin of the row above, for the branch that cannot be reached. Same reason: the citation names a file that exists only inside a temporary tree.",
  },
  {
    value: "src/planted/newcomer.ts",
    why: "W305's manifest probe: a module arriving that the manifest has never heard of. If this file existed, the probe would be testing a module the manifest legitimately holds.",
  },
  {
    value: "src/w292-neg-unreached.ts",
    why: "W292's negative half — the file a discriminating pair plants to show the detector staying silent. Planted into a copied tree by the test that names it.",
  },
  {
    value: "src/w292-pos-reached.ts",
    why: "W292's positive half, and the pair is the point: one file the detector must report and one it must not, neither of them living in this tree.",
  },
  {
    value: "src/planted/w333.ts",
    why: "W333's unreached-module probe: a module no test imports, planted so the register can report it. A real file here would be a module the unit suite genuinely never runs.",
  },
];

export interface NameDefect {
  kind: "unresolved" | "planted_but_real" | "planted_but_absent";
  module: string;
  field: string;
  value: string;
  why: string;
}

/**
 * Every declared name against the tree, and every fabrication against the tree, both directions.
 *
 * THE SECOND DIRECTION IS THE ONE THAT ROTS. A list of "names that are supposed to be broken" is
 * exactly the list nobody re-reads, so a fabrication that has quietly become a real file — or one
 * whose probe has been deleted — is reported here rather than left as furniture.
 */
export function nameDefects(
  root: string,
  sites?: readonly NameSite[],
  planted: readonly PlantedName[] = PLANTED_NAMES,
): NameDefect[] {
  const found = sites ?? nameSites(root);
  const fabricated = new Map(planted.map((p) => [p.value, p.why]));
  const seen = new Set<string>();
  const defects: NameDefect[] = [];

  for (const site of found) {
    const resolution = resolveName(root, site.kind, site.value);
    if (fabricated.has(site.value)) {
      seen.add(site.value);
      if (resolution === true) {
        defects.push({
          kind: "planted_but_real",
          module: site.module,
          field: site.field,
          value: site.value,
          why: "declared as a fabrication and the tree now holds it, so the probe it drives proves nothing",
        });
      }
      continue;
    }
    if (resolution !== true) {
      defects.push({
        kind: "unresolved",
        module: site.module,
        field: site.field,
        value: site.value,
        why: resolution,
      });
    }
  }
  for (const row of planted) {
    if (!seen.has(row.value)) {
      defects.push({
        kind: "planted_but_absent",
        module: "—",
        field: "—",
        value: row.value,
        why: "declared as a fabrication and no register carries it any more",
      });
    }
  }
  return defects.sort((a, b) =>
    `${a.module}${a.field}${a.value}`.localeCompare(`${b.module}${b.field}${b.value}`),
  );
}

/** One field declaration, as the source writes its type. */
export interface FieldTyping {
  module: string;
  field: string;
  /** The type as written. `string` is the loose one; `UnitId` and the literal template are strict. */
  type: string;
}

/** A type that says the value is a unit id rather than any string at all. */
export function isStrict(type: string): boolean {
  return type === "UnitId" || type.replace(/\s/g, "") === "`W${number}`";
}

/**
 * Every declaration of a field the tree's DATA shows carrying unit ids, with the type it is given.
 *
 * The field names are DERIVED from the values rather than listed: whatever a register actually
 * puts a `W`-number behind is a unit field, and this then reads how that field is typed wherever
 * it is declared. A list would have gone stale the first time somebody named a field `raisedBy`.
 */
export function unitFieldTypings(root: string, sites?: readonly NameSite[]): FieldTyping[] {
  const found = sites ?? nameSites(root);
  const fields = new Set(found.filter((s) => s.kind === "unit").map((s) => s.field));
  const typings: FieldTyping[] = [];
  for (const full of typescriptFiles(root)) {
    const module = path.relative(root, full).split(path.sep).join("/");
    const code = prepareForScan(readFileSync(full, "utf8"), { literals: "kept" });
    for (const field of fields) {
      // A DECLARATION, not an assignment: `field: Type;` inside an interface or a union arm, where
      // the type is a type and not an expression. An assignment ends in a comma and its right side
      // is a value, which is why the terminator matters.
      const declaration = new RegExp(`\\b${field}\\??: ([A-Za-z_][\\w.\\[\\]<>|" ]*|\`[^\`]+\`)\\s*[;}]`, "g");
      for (const match of code.matchAll(declaration)) {
        typings.push({ module, field, type: match[1]!.trim() });
      }
    }
  }
  return typings.sort((a, b) => `${a.module}${a.field}${a.type}`.localeCompare(`${b.module}${b.field}${b.type}`));
}

export interface LooseTwin {
  module: string;
  field: string;
  /** Where the same field name is typed strictly, so the comparison is over something. */
  twin: string;
}

/**
 * A unit-naming field typed `string` where the tree types the same field strictly elsewhere.
 *
 * W329'S FINDING, GENERALISED. The comparison is per FIELD NAME rather than per kind, because that
 * is the version somebody can act on: `by` is a `UnitId` in three registers and a `string` in a
 * fourth is a one-line fix, while "the tree types unit ids loosely somewhere" is a mood.
 */
export function looseTwins(
  typings: readonly FieldTyping[],
  sites: readonly NameSite[],
): LooseTwin[] {
  const strictHomes = new Map<string, string>();
  for (const typing of typings) {
    if (isStrict(typing.type) && !strictHomes.has(typing.field)) {
      strictHomes.set(typing.field, typing.module);
    }
  }
  // SCOPED BY THE DATA, and the first draft was not — which reported `pathways/audit.ts` because a
  // clinical audit entry has a `by` and so does a hardening disposition. A field name is not a
  // kind: what makes a declaration a unit field is that THIS module puts unit ids behind it.
  const carriesUnits = new Set(
    sites.filter((s) => s.kind === "unit").map((s) => `${s.module} ${s.field}`),
  );
  return typings
    .filter(
      (t) => t.type === "string" && strictHomes.has(t.field) && carriesUnits.has(`${t.module} ${t.field}`),
    )
    .map((t) => ({ module: t.module, field: t.field, twin: strictHomes.get(t.field)! }))
    .sort((a, b) => `${a.module}${a.field}`.localeCompare(`${b.module}${b.field}`));
}

export const TYPED_NAME_BOUND =
  "The population is a STRING LITERAL written behind a field name, at paren depth zero. A name " +
  "assembled from parts, read out of a document, or handed in as an argument is invisible here — " +
  "and the last of those is deliberate, because an argument is how a probe hands a detector a " +
  "fabrication. The cost is real and this sentence is the whole of what states it: a register " +
  "that builds its citations with a template literal is unchecked, and `escape-hatches.ts` and " +
  "`self-ending.ts` both do exactly that. The typing arm compares a field name against the same " +
  "field name, so a unit id behind a field nothing else in the tree declares is reported by " +
  "nobody, however loosely it is typed. And resolving a name is not reading it: `module` values " +
  "are checked for a file that exists, never for a file that says what the register claims — that " +
  "is W258's job for the citations it covers and nothing does it for the rest. Nine names are " +
  "excused here as fabrications a probe needs, and this sentence stops describing the register on " +
  "the day the fabrications this register excuses go to none.";

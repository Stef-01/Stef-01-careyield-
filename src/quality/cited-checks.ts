// W388: a citation resolved but never run, everywhere else.
//
// W371 BUILT THIS FOR ONE REGISTER AND IT FOUND SOMETHING IMMEDIATELY. Q29's horizon directions
// cite a test for each check they call `shown_loud`; W371 required each citation to resolve to
// something runnable AND to be called, and the `readEvidence` row turned out to cite a test that
// drives `openVault`. Both live in `vault.test.ts` and the title resolved, so every check this tree
// had was satisfied by a row pointing at the wrong assertion. W258's rule is that a citation nobody
// resolves reads as coverage; the sharper version is that a citation nobody RUNS reads as coverage
// too, and resolving it does not tell them apart.
//
// SO THE POPULATION IS EVERY TWO-PART CITATION IN THE TREE, and getting that right was most of the
// unit. There are 247 strings carrying the separator and they are not all citations: 145 of them
// are three-part IDS — `<file> :: <assertion> :: <subject>` — whose third field is a source
// expression or a pin name, and which RECORD A FINDING rather than claim a check is shown. That is
// W301's `SEPARATOR_NOT_A_CITATION` distinction one level out, and a sweep that took the separator
// as its population would have reported a hundred and thirty-five non-events.
//
// THE SUBJECT IS THE HARD HALF AND IT IS NOT UNIFORM. Each citing register spells its rows its own
// way, so there is no single expression that reads them all — three readings were tried and each
// was wrong for a register shaped differently. What works is STRUCTURAL and outward: from the
// citation, walk the enclosing object literals from the inside out until one carries a `module`,
// `register`, `file` or `check` key naming a module. That attributes most of them; the rest carry
// no module key at all and are declared below, one subject each.
//
// WHAT THIS DOES NOT PROVE is `CITED_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own source text.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseCitation } from "./citations";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/** A citation found in a register, with where it sits so a subject can be read around it. */
export interface FoundCitation {
  /** The module holding the citation, repo-relative. */
  citing: string;
  /** The citation itself, `<file> :: <assertion>`. */
  citation: string;
  /** Offset into the citing module's prepared text, so the enclosing rows can be walked. */
  at: number;
}

/**
 * A citation is TWO parts. A third field makes it an id.
 *
 * `empty-list-sweep.ts` and `self-defeating.ts` write `<file> :: <assertion> :: <subject>`, where
 * the third field is the source expression or the pin the row is about. Those rows record a finding
 * — this list is unevidenced, this register defeats itself — rather than claiming a check is shown
 * somewhere, so requiring them to drive something would be requiring a finding to prove itself.
 */
const TWO_PART = /"((?:[\w./-]+)\.(?:test|spec)\.ts :: [^"]*)"/g;

/** Every two-part citation a register holds. */
export function citationsInTree(root: string): FoundCitation[] {
  const out: FoundCitation[] = [];
  for (const file of sourceModules(root)) {
    const citing = path.relative(root, file).split(path.sep).join("/");
    // THIS MODULE IS EXCLUDED BY NAME, which `citations.ts` does for its own sweep and for the same
    // reason: the declarations below QUOTE every citation they dispose of, so a register reading
    // its own source would report each of them a second time, attributed to itself. An excluded
    // file is a place to hide something, so the exclusion is one file, spelled here, and the
    // suite plants a citation into a copy of this module to show the rest of the walk still runs.
    if (citing === "src/quality/cited-checks.ts") continue;
    const code = prepareForScan(readFileSync(file, "utf8"), { comments: "subtracted", literals: "kept" });
    for (const m of code.matchAll(TWO_PART)) {
      const citation = m[1]!;
      if (citation.split(" :: ").length !== 2) continue;
      out.push({ citing, citation, at: m.index! });
    }
  }
  return out.sort((a, b) => `${a.citing}${a.citation}`.localeCompare(`${b.citing}${b.citation}`));
}

/**
 * Every `{ … }` enclosing an offset, innermost first.
 *
 * OUTWARD IS THE WHOLE TRICK. A probe row is `{ register, negative: { kind, citation, plants } }`,
 * and the citation's innermost object is the inner one, which carries no subject at all. Reading
 * only that found a subject for none of them; walking out until a key appears finds most.
 */
export function enclosingObjects(code: string, at: number): string[] {
  const out: string[] = [];
  let depth = 0;
  for (let i = at; i >= 0; i -= 1) {
    const c = code[i]!;
    if (c === "}") depth += 1;
    else if (c === "{") {
      if (depth > 0) {
        depth -= 1;
        continue;
      }
      let inner = 0;
      let j = i;
      for (; j < code.length; j += 1) {
        const k = code[j]!;
        if (k === "{") inner += 1;
        else if (k === "}") {
          inner -= 1;
          if (inner === 0) break;
        }
      }
      out.push(code.slice(i, j + 1));
    }
  }
  return out;
}

/** The keys this tree uses to say which module a row is about. */
const SUBJECT_KEY = /\b(?:module|register|file|check|bound|rule|subject)\s*:\s*"(src\/[\w./-]+\.ts)/;

/** The module a citation's row is about, read from the rows around it, or null. */
export function subjectOf(code: string, at: number): string | null {
  for (const object of enclosingObjects(code, at)) {
    const key = SUBJECT_KEY.exec(object);
    if (key) return key[1]!;
  }
  return null;
}

/** What a string carrying the separator turned out to be, when no row named a module. */
export type Subject =
  /** A citation, about this module. Read off the row by a person because nothing keys it. */
  | { kind: "module"; module: string }
  /** Not a citation: the separator, used for something else. W301's distinction, at a new grain. */
  | { kind: "not_a_citation"; why: string }
  /** A citation about a DOCUMENT rather than a module, so there is no export to run. */
  | { kind: "no_module"; why: string };

/** A citation whose row carries no module key, with what a person read off it. */
export interface DeclaredSubject {
  citation: string;
  subject: Subject;
}

/** A citation that resolves, names its subject, and points at a test running none of it. */
export interface UnrunCitation {
  citation: string;
  /** The change that would make it callable — the unit's own requirement. */
  remedy: string;
}

/** Every export a module offers, by name. */
export function exportsOf(root: string, module: string): string[] {
  const full = path.join(root, module);
  if (!existsSync(full)) return [];
  const code = prepareForScan(readFileSync(full, "utf8"), { comments: "subtracted", literals: "blanked" });
  return [...code.matchAll(/^export (?:async )?(?:function|const|class|interface|type) (\w+)/gm)].map(
    (m) => m[1]!,
  );
}

/** The `(` of the nearest `it`, `test` or `describe` opening at or before `at`. */
function openingBefore(code: string, at: number): number {
  for (let i = at; i > 0; i -= 1) {
    if (code[i] !== "(") continue;
    if (/\b(?:it|test|describe)\s*$/.test(code.slice(Math.max(0, i - 12), i))) return i;
  }
  return -1;
}

/**
 * The body of the `it(` or `describe(` whose title carries `assertion`, or null.
 *
 * The title is matched by CONTAINMENT rather than equality, which is how every citation in this
 * tree is written and how `resolveCitation` reads them: a citation quotes enough of a title to
 * find it, not the whole of it.
 */
export function testBody(root: string, file: string, assertion: string): string | null {
  const full = path.join(root, file);
  if (!existsSync(full)) return null;
  const code = prepareForScan(readFileSync(full, "utf8"), { comments: "subtracted", literals: "kept" });
  const at = code.indexOf(assertion);
  if (at === -1) return null;
  // THE BLOCK MAY BE A `describe` AND OFTEN IS. W167's rows cite the group title rather than the
  // assertion inside it — `W167 two withdrawals at the same instant pick the same one` is a
  // `describe` — and a reading that assumed `it(` walked BACKWARDS to an earlier test and read the
  // wrong body, which is this register's own subject arriving in its own derivation.
  const open = openingBefore(code, at);
  if (open === -1) return null;
  let depth = 0;
  let i = open;
  for (; i < code.length; i += 1) {
    const c = code[i]!;
    if ("({[".includes(c)) depth += 1;
    else if (")}]".includes(c)) {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return code.slice(open, i);
}

export interface CitationDefect {
  citing: string;
  citation: string;
  what: string;
}

/**
 * Every citation that resolves and names nothing the test it points at runs.
 *
 * THE CHECK IS W371'S AND THE POPULATION IS THE TREE'S. A citation resolves when the file holds the
 * title; it is RUN when the body of that test names something the subject module exports. The gap
 * between the two is where `readEvidence` sat for a quarter, pointing at a test that drives a
 * different function in the same file.
 */
export function uncalledCitations(
  root: string,
  declared: readonly DeclaredSubject[] = SUBJECTS_AT_W388,
  found: readonly FoundCitation[] = citationsInTree(root),
  declaredUnrun: readonly UnrunCitation[] = UNRUN_AT_W388,
): CitationDefect[] {
  const byCitation = new Map(declared.map((d) => [d.citation, d]));
  const unrun = new Set(declaredUnrun.map((u) => u.citation));
  const prepared = new Map<string, string>();
  const out: CitationDefect[] = [];

  for (const { citing, citation, at } of found) {
    const parsed = parseCitation(citation);
    if (typeof parsed === "string") {
      out.push({ citing, citation, what: "is not a citation this tree can parse" });
      continue;
    }
    if (!prepared.has(citing)) {
      prepared.set(
        citing,
        prepareForScan(readFileSync(path.join(root, citing), "utf8"), {
          comments: "subtracted",
          literals: "kept",
        }),
      );
    }
    const row = byCitation.get(citation);
    if (row !== undefined && row.subject.kind !== "module") continue;
    const subject =
      row !== undefined && row.subject.kind === "module"
        ? row.subject.module
        : subjectOf(prepared.get(citing)!, at);
    if (subject === null) {
      out.push({ citing, citation, what: "sits in no row naming a module and nothing declares its subject" });
      continue;
    }
    const body = testBody(root, parsed.file, parsed.assertion);
    if (body === null) {
      out.push({ citing, citation, what: "resolves to no test whose body this can read" });
      continue;
    }
    // THE ROW IS ABOUT THE TEST FILE ITSELF, which W267's census does for a member that IS a suite.
    // The assertion cited lives in the module the row names, so there is no second thing to run.
    if (subject === parsed.file) continue;
    const names = exportsOf(root, subject);
    if (names.length === 0) {
      out.push({ citing, citation, what: `names ${subject}, which exports nothing to run` });
      continue;
    }
    if (!names.some((name) => new RegExp(String.raw`\b${name}\b`).test(body))) {
      if (unrun.has(citation)) continue;
      out.push({ citing, citation, what: `points at a test that runs nothing ${subject} exports` });
    }
  }
  for (const { citation } of declaredUnrun) {
    if (!found.some((f) => f.citation === citation)) {
      out.push({ citing: "-", citation, what: "is declared unrun here and the tree holds no such citation" });
    }
  }

  for (const { citation } of declared) {
    if (!found.some((f) => f.citation === citation)) {
      out.push({ citing: "-", citation, what: "is declared here and the tree holds no such citation" });
    }
  }
  return out.sort((a, b) => `${a.citing}${a.citation}`.localeCompare(`${b.citing}${b.citation}`));
}

/**
 * Every citation whose row names no module, with what a person read off it.
 *
 * TWO OF THE THREE DISPOSITIONS ARE NOT `module`, AND THAT IS THE FINDING IN THIS LIST. Three of
 * these strings are not citations at all — they key an exception map by `<file> :: <expression>`,
 * where the second field is a VARIABLE rather than a test title — which is W301's
 * `SEPARATOR_NOT_A_CITATION` distinction arriving at a grain W301 did not reach. Two more are
 * citations about a DOCUMENT, and W371 already recorded both with the change that would make them
 * callable; they are repeated here as dispositions rather than re-argued.
 */
export const SUBJECTS_AT_W388: readonly DeclaredSubject[] = [
  {
    citation: "src/compliance/rail-y5.test.ts :: an absence produces a declared reason, never an inference",
    subject: { kind: "module", module: "src/compliance/rail-y5.ts" },
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: has every Y5 module inside the declared copy surface, by the same detector",
    subject: { kind: "module", module: "src/compliance/rail-y5.ts" },
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: produces no acceptance and no transfer anywhere in the matcher",
    subject: { kind: "module", module: "src/compliance/rail-y5.ts" },
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: the matcher cannot see a clinician, and order does not follow figures",
    subject: { kind: "module", module: "src/compliance/rail-y5.ts" },
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: has no field for prose and passes W6's linter on every reason",
    subject: { kind: "module", module: "src/compliance/rail-y5.ts" },
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: the matcher cannot see a clinician",
    subject: { kind: "module", module: "src/compliance/rail-y5.ts" },
  },
  {
    citation: "src/privacy/automated-decisions.test.ts :: checks every content registry against what it actually holds",
    subject: { kind: "module", module: "src/privacy/automated-decisions.ts" },
  },
  {
    citation: "src/privacy/automated-decisions.test.ts :: classifies every one of them, exactly once, in both directions",
    subject: { kind: "module", module: "src/privacy/automated-decisions.ts" },
  },
  {
    citation: "src/privacy/automated-decisions.test.ts :: fails the build when the register moves under a stated review date",
    subject: { kind: "module", module: "src/privacy/automated-decisions.ts" },
  },
  {
    citation: "src/privacy/automated-decisions.test.ts :: sees a module whose patient identity arrives through an import",
    subject: { kind: "module", module: "src/privacy/automated-decisions.ts" },
  },
  {
    citation: "src/api/scopes.test.ts :: grants a console session every scope, in one place and with the reason",
    subject: {
      kind: "not_a_citation",
      why: "A key of W288's `NOT_A_COLLECTION`, and the second field is the EXPRESSION the exception is about — `grantedScopes` — rather than a title. The map keys a file plus a variable, which happens to use the citation separator; the row claims no check is shown anywhere and asking it to drive one would be asking an exception to prove itself.",
    },
  },
  {
    citation: "src/compliance/public-surfaces.test.ts :: measured",
    subject: {
      kind: "not_a_citation",
      why: "A key of W288's `NOT_A_MEMBERSHIP`, and `measured` is a local Map in the cited test rather than an assertion title. Same shape and same reason as the scopes row above: file plus expression, not file plus title.",
    },
  },
  {
    citation: "src/quality/route-coverage.test.ts :: specs",
    subject: {
      kind: "not_a_citation",
      why: "The other key of `NOT_A_MEMBERSHIP`, where `specs` is the Map `specTexts(root)` returns. Three of these in one register is what made the class worth naming rather than exempting one at a time.",
    },
  },
  {
    citation: "src/quality/hardening-q25.test.ts :: CR-2: the planter removes what it makes, and the leaking callers clean up",
    subject: { kind: "module", module: "src/quality/hardening-q25.ts" },
  },
  {
    citation: "src/quality/horizon-claims.test.ts :: the document was written before the quarter it plans",
    subject: { kind: "module", module: "src/quality/horizon-claims.ts" },
  },
  {
    citation: "src/credentials/vault.test.ts :: a grant cannot read another practice's document, and is not told it exists",
    subject: { kind: "module", module: "src/credentials/vault.ts" },
  },
  {
    citation: "src/quality/claim-classes.test.ts :: reports a class the horizon names and nothing answers",
    subject: { kind: "module", module: "src/quality/claim-classes.ts" },
  },
  {
    citation: "src/quality/controls.test.ts :: reports a control the horizon names and nothing answers",
    subject: { kind: "module", module: "src/quality/controls.ts" },
  },
  {
    citation: "src/quality/horizon-q28.test.ts :: refuses to set a numeric gate, and says why",
    subject: {
      kind: "no_module",
      why: "The cited behaviour is a REFUSAL TO WRITE A NUMBER — a quarter gate declining to set a threshold and saying why — asserted about the document rather than computed from it. W371 recorded the same citation in `UNRUNNABLE_CITATIONS` with the change that would settle it: exporting the reading as a function over the document's text. It is a disposition here rather than a second argument, because two registers arguing one citation is how they drift.",
    },
  },
  {
    citation: "src/quality/plan-ledger.test.ts :: would notice a gate that the plan does not define",
    subject: {
      kind: "no_module",
      why: "There is no `plan-ledger.ts` at all: the comparison is written inline in the suite, which reads the plan and the ledger and asserts about them in one breath. W371's `UNRUNNABLE_CITATIONS` carries the remedy — move the comparison into a module taking the ledger's rows as an argument — and this row records the same fact rather than restating it.",
    },
  },
  {
    citation: "src/quality/quarter-mutants-q26.test.ts :: reports an excusal whose own claim the tree contradicts, which is the arm that matters",
    subject: { kind: "module", module: "src/quality/quarter-mutants-q26.ts" },
  },
  {
    citation: "src/registers/intervals.test.ts :: reports every refusal — a dropped interval is never silent",
    subject: { kind: "module", module: "src/registers/intervals.ts" },
  },
];

/**
 * Every citation that resolves and points at a test running nothing its subject exports.
 *
 * THIRTEEN, AND THEY ARE ONE CLASS WEARING THREE FACES. A citation is supposed to say *the check I
 * claim is shown HERE*, and each of these points at a test that asserts about the subject's SOURCE
 * TEXT, or about a constant the subject exports, rather than at one that runs it. That is not
 * nothing — a property asserted over source is a real check — but it is a different claim from the
 * one a citation makes, and W371 found the shape by meeting its worst case: a row citing a test
 * that drives a different function in the same file.
 *
 * NAMED RATHER THAN FIXED, which is what this unit asked for. Two repairs are available and they
 * are different sizes: repointing a citation at a test that does call the subject is an edit, and
 * exporting a property as a function over the source is a unit. Each row says which.
 */
export const UNRUN_AT_W388: readonly UnrunCitation[] = [
  {
    citation: "src/compliance/rail-y5.test.ts :: an absence produces a declared reason, never an inference",
    remedy:
      "The test reads the matcher's SOURCE and asserts the property over its text, so nothing in `rail-y5.ts` runs. Exporting the property as a function over the source — the same move W371 named for the horizon gate — would make it callable and would let W289 drive it too.",
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: has no field for prose and passes W6's linter on every reason",
    remedy:
      "Same shape: the closed-vocabulary property is asserted over the matcher's text and over W6's linter, and `rail-y5.ts`'s own exports are not called. Export the reading.",
  },
  {
    citation: "src/compliance/rail-y5.test.ts :: produces no acceptance and no transfer anywhere in the matcher",
    remedy:
      "Same shape again, and the three together are why the row is a class rather than an accident: Y5's properties are all asserted over source. One export taking the source would answer all three.",
  },
  {
    citation: "src/compliance/cdss-boundary.test.ts :: no longer produces ${accepted.rule}",
    remedy:
      "The citation quotes a TEMPLATE — the assertion's message is built at run time — so the string in the register can never match a title exactly and resolves only because the template's literal half is in the file. Repointing it at the enclosing test's own title is an edit, and is the smaller of the two repairs available anywhere in this list.",
  },
  {
    citation: "src/quality/hardening-q23.test.ts :: SEC-1: the three checked properties still hold",
    remedy:
      "An acceptance cites the test that shows a hardening finding still holds, and the hardening register's export is its `FINDINGS` list, which the test asserts ABOUT rather than calls. Repointing would not help — there is nothing to call — so the change is to give the quarter's findings a reading over the tree, which is what `overdueDispositions` already does for their clocks and nothing does for their properties.",
  },
  {
    citation: "src/quality/hardening-q24.test.ts :: Q24-SEC-1: exactly one module in the quarter is reachable from a page",
    remedy:
      "Same as the Q23 row: an acceptance citing a test that asserts about a quarter's `FINDINGS` list rather than calling anything, so there is nothing to repoint the citation AT. The change is the same one — a reading of a quarter's findings over the tree, exported, of the kind `overdueDispositions` already gives their clocks.",
  },
  {
    citation: "src/quality/hardening-q25.test.ts :: SEC-1: the founder page's reader is still the only new module on a request path",
    remedy:
      "Same as the Q23 row, for Q25's security finding: the test asserts over the findings list and calls no export. Same change, and the fact that it is the same for four quarters running is what makes it a property of how hardening registers are shaped rather than four separate oversights.",
  },
  {
    citation: "src/quality/hardening-q28.test.ts :: Q28-CR-4: the three exemptions still reach past their keys",
    remedy:
      "Same as the Q23 row, and the fourth of them, which is why this is the largest group in this list. A change that exported one reading over a quarter's findings would clear all four at once, and until somebody writes it the honest statement is that these acceptances are shown by assertions over a list rather than by anything running.",
  },
  {
    citation: "src/quality/horizon-claims.test.ts :: the document was written before the quarter it plans",
    remedy:
      "The claim is about a DOCUMENT's dates and is asserted over the document, so `horizon-claims.ts` exports nothing the test reaches. W371 recorded the same shape twice in `UNRUNNABLE_CITATIONS`; the change is the same one — a reading over the document's text, exported.",
  },
  {
    citation: "src/quality/citations.test.ts :: does not count a module that only MENTIONS the format in prose",
    remedy:
      "THE CLEAREST ONE, AND IT IS W371'S FINDING EXACTLY. The negative probe for `citations.ts` cites a test whose body asserts a REGEX against two string literals — it runs no part of `citations.ts` at all, and the module is excluded from its own sweep by name, so the test cannot call it. Repointing at a test that drives `separatorDiff` over a planted tree is an edit, and it is the repair this row wants.",
  },
  {
    citation: "src/quality/refusal-branches.test.ts :: notices a reporter ARRIVING, and a renderer arriving beside it",
    remedy:
      "The negative plants a reporter and asserts the census reports it, which runs the CENSUS rather than `refusal-branches.ts`. Repointing at the test that calls its own detector is an edit.",
  },
  {
    citation: "src/quality/self-reference.test.ts :: leaves a module that joins values rather than literals alone",
    remedy:
      "The negative asserts about a planted module's text without calling `self-reference.ts`'s detector by name — it goes through the shared planting harness, which is a real drive this reading cannot see. The honest change is the one in this register's own bound: read a call THROUGH a harness, rather than requiring the export to be named.",
  },
  {
    citation: "src/quality/unit-headers.test.ts :: catches a module whose unit is recorded where the census cannot read it",
    remedy:
      "Same as the row above: driven through the planting harness rather than by naming `unit-headers.ts`'s export. Two of these is what makes the bound's third clause worth stating — this register reads NAMING, not calling, and a drive through a harness is invisible to it.",
  },
];

export const CITED_BOUND =
  "A CITATION IS RUN WHEN THE TEST IT POINTS AT NAMES AN EXPORT OF ITS SUBJECT, and naming is not " +
  "calling. A body mentioning an export inside a comparison, an import list or a string satisfies " +
  "this and should not; a body that reaches the subject THROUGH a shared harness does not satisfy " +
  "it and should. Two of the declared rows are the second kind, and the remedy is a call read " +
  "through a harness — follow what a planter calls, instead of asking whether the export was " +
  "spelled. Requiring a call expression instead of a name would trade the first error for more of " +
  "the second, because this tree drives checks through harnesses as often as it calls them. " +
  "SECOND, THE SUBJECT IS READ FROM THE ROWS AROUND THE CITATION. Walking outward for a `module`, " +
  "`register`, `file` or `check` key reads how this tree happens to write registers, not what a " +
  "citation means; a register keying its rows another way gets no subject and is declared instead, " +
  "which is a person's reading rather than a derivation. THIRD, IT SEES A SINGLE BLOCK PER " +
  "CITATION. The title is matched by containment and the nearest preceding `it`, `test` or " +
  "`describe` is taken as its opening, so a citation quoting a phrase that appears in a group " +
  "title and again in an assertion below it reads whichever comes first. FOURTH, A THREE-PART ID " +
  "IS OUT OF THE POPULATION BY DEFINITION, and that is a judgement about what those rows are for: " +
  "`empty-list-sweep.ts` and `self-defeating.ts` record findings rather than claim a check is " +
  "shown, so nothing here asks them to drive anything. A register that started writing real " +
  "citations in three parts would be invisible to this. FIFTH, THIS MODULE IS EXCLUDED FROM ITS " +
  "OWN WALK BY NAME, because the declarations here quote every citation they dispose of; an " +
  "excluded file is a place to hide something, and what stands against that is the suite planting " +
  "a register into a copy and requiring the rest of the walk to report it.";

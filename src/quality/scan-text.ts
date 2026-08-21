// W302: one text-scan discipline — comments, literals, and the order they run in.
//
// FOURTEEN MODULES IN THIS TREE SCAN SOURCE AS TEXT, and every one of them has to answer the same
// two questions before it can look at anything: does a comment count, and does a string literal
// count. Both answers are almost always no, and both were being written out again per scan. By Q23
// there were four comment-strippers — the shared one in `reachability.ts`, a local copy in
// `order-independence.ts`, an inline pair in `composed-copy.ts`'s `bodyOf`, and another inline pair
// in `declaration-tax.ts` — and `blankLiterals` living inside W288's tautology sweep, which is not
// a copy but is an odd home for something six modules import.
//
// THE ORDER IS NOT A DETAIL, and W295 paid for finding that out. Blanking literals over RAW text
// treats a `/` in a prose comment as opening a regex literal; the match then runs to the next `/`
// and swallows whatever is between them. In `register-census.ts` that is an `export function` line,
// and W295's narrowing of `violationReporters` made FOUR REAL REGISTERS disappear from the walk —
// silently, because a register that vanishes from a population reports nothing rather than
// something. Which four changed depending on which transform ran first. So the order is enforced
// here rather than remembered: comments are subtracted BEFORE literals are blanked, always, and the
// test drives the exact comment that hid them.
//
// WHAT THIS DOES NOT DO IS DECIDE FOR THE CALLER. Some scans need literals kept — W294's acceptance
// detector looks for `reviewBy:` followed by a quote, and blanking the quote away would blind it to
// every real register at once — so `blankLiterals` keeps the opening delimiter, and a scan that
// wants literals intact says so. What is removed is the choice being re-implemented, not the
// choice.
//
// W307: AND THE OTHER HALF OF THE SAME PROBLEM — A DETECTOR THAT MATCHES ITS OWN FIXTURES.
//
// A scan looking for a shape has to write that shape down somewhere to prove it can see one, and
// the moment it writes it down inside a file the scan reads, the scan finds itself. This tree hit
// that at W237, W256, W288, W294, W295, W300, W302 and W306 — every time discovered by a red run,
// every time fixed the same way and never once written down: split the token across an array and
// join it back. That idiom appears in eight first-party modules, is invisible to a reader, and
// re-breaks silently the day somebody tidies one of them into a single literal.
//
// THE RULE IS THAT THE FIXTURE LEAVES THE SURFACE, and `scan-fixtures.fixtures` is where it goes:
// an extension no walk in this tree matches, so its contents are unreachable to every scan while
// staying plain text a person can read. That is strictly better than the two alternatives already
// tried here. Narrowing the scan was tried at W295 and HID FOUR REAL REGISTERS. Splitting the token
// works but says nothing, so each site re-derives the reason in a comment or does not explain
// itself at all.
//
// WHAT THIS DOES NOT PROVE is `SCAN_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This transforms source text in memory.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripComments } from "@/security/reachability";
import { sourceModules, typescriptFiles } from "./tree-walks";

/**
 * String, template and regex literals with their CONTENTS blanked, same length, same lines.
 *
 * Moved here from W288's tautology sweep, which wrote it first and is not where it belongs: six
 * modules import it and none of them is about tautologies.
 *
 * THE OPENING DELIMITER IS KEPT. W294's detector looks for `reviewBy:` followed by a quote, so
 * blanking the quote away would blind it to every real register while blinding it to fixtures — the
 * fix and the defect at once. Keeping one character preserves "a literal starts here" and removes
 * everything a scan could mistake for code.
 */
export function blankLiterals(code: string): string {
  const LITERAL =
    /`(?:\\.|[^\\`])*`|"(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*'|\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\\/\n[])+\/[gimsuy]*/g;
  return code.replace(LITERAL, (m) => m[0] + m.slice(1).replace(/[^\n]/g, " "));
}

/** What a scan wants to be able to see. Both default to the answer almost every scan wants. */
export interface ScanPrep {
  /** `subtracted` removes comments; `kept` leaves them, for a scan reading prose on purpose. */
  comments?: "subtracted" | "kept";
  /** `blanked` empties literals; `kept` leaves them, for a scan whose subject IS a literal. */
  literals?: "blanked" | "kept";
}

/**
 * Source prepared for a text scan, with the transforms in the one order that works.
 *
 * LINE COUNT is preserved by both transforms, so a hit still reports the line it is on. OFFSETS are
 * preserved by blanking only: `stripComments` deletes a `//` comment rather than padding it, so a
 * caller that subtracts comments and then slices the ORIGINAL text is reading the wrong span. The
 * two promises are different and the test says so, because every scan here uses both transforms.
 */
export function prepareForScan(source: string, prep: ScanPrep = {}): string {
  const { comments = "subtracted", literals = "blanked" } = prep;
  // COMMENTS FIRST, ALWAYS. See `SCAN_ORDER_RULE`; the other order deletes code.
  const decommented = comments === "subtracted" ? stripComments(source) : source;
  return literals === "blanked" ? blankLiterals(decommented) : decommented;
}

/**
 * Why the order is fixed, kept as data because it is the expensive half of this unit.
 *
 * W196's shape: a later unit that wants to reorder these has to delete a stated rule rather than
 * quietly swap two lines.
 */
export interface OrderingLoss {
  file: string;
  /** Exported functions the right order keeps and the wrong order eats. */
  lost: string[];
  commentsFirst: string[];
  literalsFirst: string[];
}

/**
 * Every file whose exported signatures the WRONG order would eat, derived rather than named.
 *
 * W302 drove its finding against `register-census.ts` by name — the file whose prose comments cost
 * W295 four registers. W305 moved that file's entries into the manifest and took the prose with
 * them, so the named witness would have gone quietly vacuous while the test kept passing: exactly
 * the failure this quarter keeps turning up. The walk lives here rather than in the test file
 * because W289's remedy says so — a walk inside a `.test.ts` exports nothing and cannot be pointed
 * at a tree that differs from this one.
 */
export function orderingLosses(root: string): OrderingLoss[] {
  const exported = (text: string) => [...text.matchAll(/export function (\w+)/g)].map((m) => m[1]!);
  const out: OrderingLoss[] = [];
  for (const file of sourceModules(root)) {
    const text = readFileSync(file, "utf8");
    const commentsFirst = exported(prepareForScan(text));
    const literalsFirst = exported(stripComments(blankLiterals(text)));
    const lost = commentsFirst.filter((n) => !literalsFirst.includes(n));
    if (lost.length > 0) {
      out.push({ file: path.relative(root, file).split(path.sep).join("/"), lost, commentsFirst, literalsFirst });
    }
  }
  return out.sort((a, b) => b.lost.length - a.lost.length || a.file.localeCompare(b.file));
}

export const SCAN_ORDER_RULE =
  "Comments are subtracted before literals are blanked. Reversed, the literal scanner reads a `/` in a prose comment as opening a regex, runs the match on to the next `/`, and blanks whatever lies between — which in this tree is an `export function` line. W295 shipped that order into `violationReporters` and four real registers vanished from the walk; a register missing from a population reports nothing rather than something, so nothing failed except a count somewhere else. Which four vanished changed with the order the two transforms ran in, which is the clearest possible sign that the order was never a detail.";

/**
 * What this discipline does not reach.
 *
 * W295's reversion, recorded rather than tidied away: one scan in this tree still reads raw text on
 * purpose, and pretending otherwise would be the more comfortable lie.
 */
export const SCAN_BOUND =
  "One scan is deliberately outside this. `violationReporters` in W291's register reads RAW source, because both narrowings were tried at W295 and both hid real registers — comments-then-literals lost four, literals-then-comments lost a different three. The cause is understood and the fix is not: the reporter walk matches an `export function` signature, and any transform that can consume a signature can consume that one. So it stays raw, and W307 took its fixtures OUT of the surface it reads rather than narrowing it — which is the rule `register-census.test.ts` follows now too. What this buys is that the choice is made once and recorded, not that every scan in the tree now shares an implementation. A scan added tomorrow that reads raw text without saying why is invisible here, and the register below only knows about modules that ask for the preparation. " +
  "AND THE COMMENT STRIPPER IS NOT LITERAL-AWARE, which W336 found by writing a string that " +
  "contained a line-comment marker: `stripComments` removed the rest of that line, leaving an " +
  "unbalanced quote, and `blankLiterals` then swallowed everything after it — so a `reviewBy` on " +
  "a later line vanished and W294's acceptance register reported a module that plainly holds one " +
  "as holding none. The failure is SILENT and it is not rare: 52 modules under `src/` have a line " +
  "the stripper leaves with an odd number of quotes, and every scanner built on this preparation " +
  "is blind from that point in those files to the end. The order rule is not the cause and " +
  "reversing it would not help; the fix is a single pass that tracks whether it is inside a " +
  "literal, which is a unit rather than a patch, and until somebody writes it a scan reporting " +
  "nothing about the back half of a module may be reporting nothing at all.";

/** A module that prepares text for scanning, and what it asks for. */
export interface ScanSite {
  module: string;
  prep: ScanPrep;
  /** Why this scan wants what it wants — a default nobody argued is a default nobody read. */
  why: string;
}

/**
 * Every module that asks for the shared preparation, declared.
 *
 * Checked against the tree in both directions by `scanSiteDiff`, so a module that starts preparing
 * text cannot do it without saying which answer it wants and why.
 */
export const SCAN_SITES: readonly ScanSite[] = [
  {
    module: "src/quality/mutation-sampling.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "W349's mutation sites, and the defaults are what it wants for the reason this tree keeps rediscovering: a module explaining `===` in prose is not a module comparing with it, and a `===` inside a string literal is not an operator either. It arrived in this register at W383 rather than at W349, and how is the point — it had been doing exactly this by hand, `stripComments` on one line and `blankLiterals` on the next, which is the right order written where `SCAN_ORDER_RULE` could not reach it. Declaring the site is what calling the named composition buys. Its OFFSETS are into the comment-stripped text with literals intact, which is a second string it still derives itself.",
  },
  {
    module: "src/compliance/composed-copy.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its subject IS the literal — a prose sentence composed inside a render function — so blanking literals would empty the thing it exists to find. Comments are subtracted because a quoted phrase inside a comment explaining what wording to avoid is not copy, which is the collision W278 recorded at `feeCaveat`.",
  },
  {
    module: "src/console/rendered-zeros.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "The words it looks for ARE literals. It asks whether the arm of a conditional a reader gets when a list is empty puts anything readable on the screen, and the readable things are the text between tags and the copy constant a page interpolates — blanking either would leave every empty state on this console looking exactly like silence. Comments are subtracted because this tree explains its pages in prose beside them, and a `//` note describing an empty state is a description rather than one.",
  },
  {
    module: "src/quality/cited-checks.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "A citation IS a literal, so blanking would erase the whole population. Comments are subtracted for the reason `citations.ts` records about itself: this tree discusses the citation format at length in prose beside the rows that use it, and a paragraph naming `<file> :: <assertion>` is a description rather than a citation. The same preparation reads the cited test's body, where the assertion titles are literals too.",
  },
  {
    module: "src/quality/decision-moments.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Comments MUST go: this tree writes a doc block INSIDE a parameter list — `buildInvitationPool` explains its ranking seam there — and a comma in that prose split the list before the preparation was used. Literals stay because nothing here reads one and blanking them would cost a pass over every product module for no answer; the scan reads parameter names and types, which survive either way, so `kept` is the cheaper of two readings that agree.",
  },
  {
    module: "src/quality/shared-state.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "The path a write targets IS a literal — `path.join(ROOT, \"src/planted\")` — and blanking it would leave every write in this suite pointing at nowhere. Comments go because this tree writes about `src/planted` in prose beside the code that creates it, and a sentence naming a path is not a write to it: `repository-clean.test.ts` opens with a header describing exactly the write this register looks for.",
  },
  {
    module: "src/quality/hook-reach.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It finds a hook by its call and then reads the BODY by balancing brackets from the opening paren, so it needs the transform that preserves offsets — blanking does, subtracting comments does not move a line but does move every offset after it, which is why the two are applied in that order and the offsets are taken from the result. A brace inside a string would close a hook early; the call names the reading is actually about survive blanking untouched. The one place it steps outside this preparation is `tempPrefixes`, which reads the PREFIX a module hands `mkdtempSync` — a string, and blanking would leave every module looking as though it built nothing — so that reading keeps its literals and is the same shape W381 has for the same reason.",
  },
  {
    module: "src/quality/import-cycles.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its subject IS the import statement, and the specifier it points at is a STRING — blanking literals would erase every edge in the graph. Comments are subtracted because this tree's headers quote import lines while explaining cycles, and a quoted example would become an edge nobody wrote.",
  },
  {
    module: "src/quality/moments.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It reads CALL SITES, and both transforms earn their place. Literals are blanked because a call named inside a string is a mention rather than a use. Comments are subtracted because this tree explains itself with backticked names in prose, and blanking literals over prose takes the first backtick as an unterminated template. The one place it steps outside this preparation is `enclosingTest`, which needs the quotes blanking removes, so that reading is done on comment-stripped text and bridged to this one by LINE — the two transforms agree about lines and disagree about offsets, which `prepareForScan` says of itself.",
  },
  {
    module: "src/quality/run-residue.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It reads CALL SITES, and both transforms earn their place for a different reason. Literals are blanked because `withPlantedIn`'s refusal message names `copyTree(root)` inside a string, which a call-shaped scan read as a call. Comments are subtracted because this harness explains itself with backticked names in prose, and blanking literals over prose takes the first backtick as an unterminated template — which blanked the rest of the file and made the sweep look as though nothing called it.",
  },
  {
    module: "src/quality/declaration-tax.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "A declaration IS a string literal — `\"src/quality/bounds.ts\"` in a register — so blanking literals would make every declaration site disappear and the quarter's baseline read as zero. Comments are subtracted because this tree's notes cite each other's paths constantly, and counting those would inflate the number Q24 is measured against.",
  },
  {
    module: "src/quality/flattering-numbers.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It scans for a function SIGNATURE — `export function x(...): number` — so both subtractions are load-bearing and for the same reason: this register's own note quotes the shape it looks for, and its suite plants the shape inside a string, so a scan that read either would be counting itself. W307's rule, arriving at a signature instead of a phrase.",
  },
  {
    module: "src/quality/shared-excuses.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its subject IS the literal — the sentence a register gives as its reason — so blanking would empty the population entirely. Comments are subtracted for the reason this unit is about: this tree's notes quote each other's excuses at length, and a sentence QUOTED in a note is somebody discussing an excuse rather than a second entry giving one, which would have read as sharing where there is none.",
  },
  {
    module: "src/quality/self-ending.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "The marker IS a literal — `kind: \"deferred\"` is how this tree spells a wait — so blanking literals would erase every declaration and leave the derivation reporting nothing at all, which is the silent-register failure the register itself is about. Comments are subtracted because this module's own notes quote the discriminants they look for, at length.",
  },
  {
    module: "src/quality/planting.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "The sweep asks whether a module CALLS `writeFileSync`, and `blind-spots.ts` hands planted trees probe bodies that contain that call as text — so the raw form reported the register that quotes the write rather than the module that performs it. Comments go for the same reason and one more: this file's own notes discuss the call it looks for. The exemption beside it deliberately reads the RAW source instead, because a real import is a string literal and blanking would erase every import there is.",
  },
  {
    module: "src/quality/tautology-sweep.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its parser blanks literals itself, one layer down, so that boundaries are found on blanked text while the PARTS are sliced from the real thing — a hit has to quote what the author wrote. Asking for them blanked here would blank them twice and leave nothing to quote.",
  },
  {
    module: "src/quality/unit-headers.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "W320 reads a module's `export const NAME` lines to learn what it OWNS, and an export named inside a string is not an export — `declaration-tax.ts` carries a planted register body quoting `export const PLANTED_BOUND`, which the first run of this scan reported as a real bound whose header never mentions it. Comments are subtracted for the ordinary reason and because this module's own prose quotes the shapes it looks for.",
  },
  {
    module: "src/quality/self-reference.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "W307's sweep looks for a literal assembled from fragments, so the literal IS the subject and blanking it would empty the thing it finds. Comments are subtracted for the reason that register's own third answer names: a split quoted in a note explaining the idiom is not a split, and a register whose prose names its own pattern reports itself — which W167 and W295 both shipped.",
  },
  {
    module: "src/quality/order-independence.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "A fold named in prose is not a fold (W168) and a fold quoted inside a fixture is not one either (W295) — both were found the hard way, one per unit, in the same register.",
  },
  {
    module: "src/quality/typed-names.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "The subject IS the literal — `unit: \"W318\"` is the citation — so blanking literals would empty the population entirely. Comments are subtracted for the reason this register's own note gives at length: a sentence mentioning W318 is prose, and a register whose notes cite units constantly would otherwise report itself as the tree's largest citation.",
  },
  {
    module: "src/quality/private-copies.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "The subject is a ROW REGEX and a `readdirSync` call, both of which live inside literals — blanked, a private copy of the ledger parse is indistinguishable from a module that never touches the ledger, and this register would report a clean tree while every copy it exists to find sat in it. Comments are subtracted because a module explaining what a copy looks like is not one, and the two modules whose notes describe these parses at length are `tree-walks.ts` and this one.",
  },
  {
    module: "src/quality/derivable-lists.ts",
    prep: { comments: "subtracted", literals: "kept" },
    why: "Its subject IS the literal — a module PATH inside a register's entry, `\"src/quality/bounds.ts\"` — so blanking literals would empty the population entirely and this register would report a tree with no hand-listed registers in it. Comments are subtracted because this module's own notes quote register names and module paths at length, and counting those would have it reporting itself. THE IRONY IS THE UNIT'S OWN SUBJECT: this row is the opt-in whose narrowness `derived_from_the_opt_in` is about, and declaring it here does not widen `SCAN_SITES` by one module — it only means this scanner is inside the register rather than among the eleven that are not.",
  },
  {
    module: "src/quality/exemption-reach.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It looks for a detector's PARAMETER — `Readonly<Record<string, string>> = SOME_REGISTER,` — so the subject is a type annotation rather than a value, and literals are blanked because this module's own probe bodies carry that exact declaration as planted TEXT: the first scan over a copied tree with the plant in it would have counted the string the probe writes as well as the module the probe wrote it into. Comments are subtracted for the ordinary reason and one more — this file's header quotes the idiom it looks for, at length.",
  },
  {
    module: "src/quality/acceptances.ts",
    prep: { comments: "subtracted", literals: "blanked" },
    why: "It looks for `reviewBy:` followed by a quote, which is why `blankLiterals` keeps the opening delimiter: blanking it away would blind the detector to every real acceptance register while blinding it to fixtures.",
  },
];

export interface ScanSiteDiff {
  /** A module that imports the preparation and is not declared. */
  undeclared: string[];
  /** A declared module that has stopped importing it. */
  stale: string[];
}

/**
 * The register against a file list, both directions.
 *
 * Pure and list-in, so it can be handed a module the register does not know and a declared module
 * that has stopped asking — W289's rule about a comparison that can be given a second declared
 * list. `scanSitesInTree` is the rooted caller.
 */
export function scanSiteDiff(
  files: ReadonlyArray<{ module: string; source: string }>,
  declared: readonly ScanSite[] = SCAN_SITES,
): ScanSiteDiff {
  const importing = files
    .filter((f) => /\bprepareForScan\b/.test(prepareForScan(f.source)))
    .map((f) => f.module);
  const names = new Set(declared.map((s) => s.module));
  return {
    undeclared: importing.filter((m) => !names.has(m)).sort(),
    stale: [...names].filter((m) => !importing.includes(m)).sort(),
  };
}

/** Every module under `root/src`, as text — the walk both sweeps below share. */
function modulesWithSource(root: string): Array<{ module: string; source: string }> {
  return sourceModules(root).map((file) => ({
    module: path.relative(root, file).split(path.sep).join("/"),
    source: readFileSync(file, "utf8"),
  }));
}

/**
 * The register against the tree.
 *
 * This module's own file is excluded, and the exclusion is stated: it DEFINES `prepareForScan`
 * rather than asking for it, so counting it would make the register describe its own declaration.
 * That is the one exclusion W201 allows — the one somebody writes down.
 */
export function scanSitesInTree(root: string, declared: readonly ScanSite[] = SCAN_SITES): ScanSiteDiff {
  return scanSiteDiff(
    modulesWithSource(root).filter((f) => f.module !== "src/quality/scan-text.ts"),
    declared,
  );
}

/**
 * Every module in the tree that still writes its own comment-stripper or literal-blanker.
 *
 * The check that keeps "the copies are retired" true past this unit: a module that writes the pair
 * again arrives failing, which is the only reason the consolidation is worth anything.
 */
export function preparationCopies(root: string): { strippers: string[]; blankers: string[] } {
  const strippers: string[] = [];
  const blankers: string[] = [];
  for (const { module, source } of modulesWithSource(root)) {
    // LITERALS BLANKED, and the first draft kept them — so this sweep matched its own regex
    // literals and reported this module as a second comment-stripper. A stripper DEFINED in code is
    // code; a stripper NAMED inside a regex is the scan looking at itself. Third instance of the
    // collision in this session, in the module written about it, and the narrowing is the fix
    // rather than an exemption.
    const code = prepareForScan(source);
    if (/function stripComments\b/.test(code)) strippers.push(module);
    if (/function blankLiterals\b/.test(code)) blankers.push(module);
  }
  return { strippers: strippers.sort(), blankers: blankers.sort() };
}

// ---------------------------------------------------------------------------------------------
// W307: fixtures that live outside the surface their detector reads.
// ---------------------------------------------------------------------------------------------

/**
 * The rule, stated once, because it had been solved eight times without ever being written down.
 *
 * The alternatives are not hypothetical — both were tried in this tree and both are recorded above.
 */
export const SELF_REFERENCE_RULE =
  "Text a detector must not find in the surface it reads does not belong in that surface. It goes " +
  "in `src/quality/scan-fixtures.fixtures`, whose extension no walk here matches, and comes back " +
  "through `fixtureText` or `fixtureToken`. NOT by narrowing the scan: W295 narrowed three of them " +
  "so they would stop matching their own fixtures and HID FOUR REAL REGISTERS, because a register " +
  "that drops out of a population reports nothing rather than something. And NOT by splitting the " +
  "token across an array, which works but explains nothing at the site, has to be re-derived by " +
  "every reader, and comes apart the day somebody tidies it into one literal — a failure that " +
  "surfaces as the detector reporting its own module, which reads like a defect in the tree rather " +
  "than in the fixture. The exception is a detection PATTERN rather than a fixture: a regex that " +
  "matches secrets has to be readable beside the code that uses it, so those are declared and " +
  "argued instead of moved. And PROSE that merely quotes a pattern gets neither treatment: a " +
  "sentence describing what a detector looks for does not have to spell it, which is the answer " +
  "for the register that reported its own explanation.";

/** Where the fixtures live, repo-relative. Named once so the citation check and the walks agree. */
export const FIXTURES_FILE = "src/quality/scan-fixtures.fixtures";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * The fixture file parsed into named blocks.
 *
 * Takes a path rather than reading a fixed one, so the parser can be driven over a constructed
 * file — W267's rule, and this module would otherwise be the register that exempts itself from it.
 */
export function fixtureBlocks(file: string): Record<string, string> {
  const text = readFileSync(file, "utf8");
  const blocks: Record<string, string> = {};
  let name: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (name !== null) blocks[name] = `${lines.join("\n").replace(/\n+$/, "")}\n`;
    lines = [];
  };
  for (const line of text.split("\n")) {
    const header = /^=== ([a-z0-9-]+) ===$/.exec(line);
    if (header) {
      flush();
      name = header[1]!;
      continue;
    }
    if (name !== null) lines.push(line);
  }
  flush();
  return blocks;
}

let cached: Record<string, string> | null = null;

/** A fixture's text, with one trailing newline — a planted file's whole body. */
export function fixtureText(name: string): string {
  cached ??= fixtureBlocks(path.join(HERE, path.basename(FIXTURES_FILE)));
  const block = cached[name];
  if (block === undefined) throw new Error(`no fixture named ${name} in ${FIXTURES_FILE}`);
  return block;
}

/** The same, trimmed — a single token to be composed into a larger string. */
export function fixtureToken(name: string): string {
  return fixtureText(name).trim();
}

/** Every fixture name cited by first-party source, wherever it is loaded from. */
export function fixtureCitations(root: string): string[] {
  const cited = new Set<string>();
  for (const file of typescriptFiles(root)) {
    const text = stripComments(readFileSync(file, "utf8"));
    for (const m of text.matchAll(/fixture(?:Text|Token)\(\s*"([a-z0-9-]+)"\s*\)/g)) {
      cited.add(m[1]!);
    }
  }
  return [...cited].sort();
}

export interface FixtureDiff {
  /** A fixture nobody loads. Dead text in a file no test would ever fail over. */
  unloaded: string[];
  /** A citation for a fixture the file does not have. The throw, caught before it happens. */
  missing: string[];
}

/**
 * Both directions, W102's shape, and W258's rule applied to a fixture.
 *
 * The direction that matters is `unloaded`: this file is outside every walk in the tree, so a block
 * left here after its last caller went away is text no check would ever read again.
 */
export function fixtureDiff(root: string, declared?: readonly string[]): FixtureDiff {
  const have = Object.keys(fixtureBlocks(path.join(root, FIXTURES_FILE)));
  const cited = declared ?? fixtureCitations(root);
  return {
    unloaded: have.filter((n) => !cited.includes(n)).sort(),
    missing: cited.filter((n) => !have.includes(n)).sort(),
  };
}

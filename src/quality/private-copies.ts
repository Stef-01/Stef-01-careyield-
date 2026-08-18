// W341: the private copy of a shared parse.
//
// W335 found a founder-facing document and its own test disagreeing with the tree by the same two
// rows, for the same reason: `gate-dossier-y5.test.ts` kept its own row regex, so when W310 fixed
// `allLedgerRows` to see `SUP-1` and `SUP-2` the fix reached every caller of the shared parse and
// none of the copies. The document said G5 blocks six, its test agreed, and both were wrong. That
// is the cost of a private copy stated exactly: **a check and its subject agreeing with each other
// instead of with the tree.**
//
// THE COPY IS NOT THE DEFECT. A copy is a place a fix does not reach, which makes it a defect the
// day somebody fixes the shared one — so the thing worth registering is not "duplication" in the
// abstract but the SITES, by name, each with what it would cost if the shared parse moved and this
// one did not. W301 counted duplication and the count moved by accident; W290's rule applies here
// as everywhere: a named list moves deliberately.
//
// TWO PARSES, BECAUSE TWO ARE THE ONES THIS TREE HAS ALREADY PAID FOR.
//   - The TREE RECURSION. W282 moved seven private walks into `tree-walks.ts` so each could be
//     given a root and shown a file arriving; W327 then found three different answers to what "the
//     tree" is and exported `EXCLUDED_DIRECTORIES` so there would be one. Both fixes shared the
//     ANSWERS — `sourceModules`, `typescriptFiles`, `testModules` — and left the WALK private, so
//     the next module with a question those seven do not answer writes the recursion again. It is
//     the cheapest thing in the world to write, which is W282's own sentence about why this keeps
//     happening.
//   - The LEDGER ROW PARSE. `parseLedgerRows` is the shared one and the tree's registers call it.
//     The copies read the ledger and match the row shape themselves, and the row shape is not a
//     constant of nature: W310 changed what a row IS.
//
// WHAT THIS REGISTER DOES NOT DO. It does not delete copies. Some sites ask a different question
// and a de-duplication that quietly changes what a register counts is worse than the copy — the
// reason `discoverFoldSites` kept its own name filter through this unit's conversion. So each site
// is either converted, or DECLARED with the standing it actually has: a different question, or an
// unconverted copy with the cost written down. An undeclared copy fails.
//
// SELF-REFERENCE. The markers a copy carries live in `scan-fixtures.fixtures`, not here — this
// module would otherwise be the largest copy in the tree, matching both of its own detectors and
// reporting itself. W307's rule, applied the way `assertion-drives.ts` applies it. Comments are
// subtracted before the scan and LITERALS ARE KEPT: a row regex blanked is a row regex invisible,
// which is the one narrowing that would blind this register to every real site at once.
//
// WHAT IT CANNOT SEE is `PRIVATE_COPY_BOUND`, below: two parses, one directory, and the spellings
// a text scan reads.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the text of this repository's own modules.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fixtureText, prepareForScan } from "./scan-text";
import { typescriptFiles } from "./tree-walks";

/** A parse or walk the tree publishes once, with what a private copy of it looks like. */
export interface SharedParse {
  /** The question, in the tree's words. */
  name: string;
  /** Where the shared answer lives — W258's citation form, resolved by this unit's test. */
  shared: string;
  /** The files that ARE the shared parse. A home is never a copy of itself. */
  home: readonly string[];
  /**
   * The fixture BLOCK TEXT whose non-empty lines are the markers a copy carries, ALL of them.
   *
   * Loaded with a literal `fixtureText("...")` call rather than by a name this module resolves
   * later: W307's citation register reads the call, so a fixture reached through a variable is a
   * fixture nobody can see is loaded — dead text in a file no test would fail over.
   */
  markers: string;
  /** What a divergent copy has cost this tree, with the unit that paid it. */
  cost: string;
}

export const SHARED_PARSES: readonly SharedParse[] = [
  {
    name: "the tree recursion",
    shared:
      "src/quality/tree-walks.ts :: sourceModules, typescriptFiles, testModules, textFiles, pageSpecFiles",
    home: ["src/quality/tree-walks.ts"],
    markers: fixtureText("tree-recursion-markers"),
    cost:
      "W327: three walks over the tree meant three different trees, because two of them kept their " +
      "own skip list and one had none — the walk with no list answered about dependencies. A " +
      "private recursion also tends to weld itself to the process working directory or a " +
      "module-level constant, which is W282's finding: a walk that cannot be pointed at another " +
      "tree can never be shown noticing a file arrive, and that is the one event it exists to catch.",
  },
  {
    name: "the ledger row parse",
    shared: "src/quality/blocked-surface.ts :: parseLedgerRows, allLedgerRows",
    home: ["src/quality/blocked-surface.ts"],
    markers: fixtureText("ledger-row-markers"),
    cost:
      "W310 changed what a ledger row is — SUP-1 and SUP-2 are blocked rows and the old parse " +
      "matched week-units only, so nothing had ever seen them. The fix reached every caller of the " +
      "shared parse and no copy. W335 then found the gate dossier and its own test both two rows " +
      "short, agreeing with each other and not with the ledger.",
  },
];

/** The markers of a parse: every non-empty line of its fixture block, all of which must appear. */
export function markersOf(parse: SharedParse): string[] {
  return parse.markers
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** A module holding its own copy of a shared parse. */
export interface PrivateCopy {
  /** Repo-relative, posix separators. */
  file: string;
  /** The shared parse it copies, by name. */
  parse: string;
}

/**
 * Every module under `root/src` holding its own copy of one of these parses.
 *
 * Rooted, and derived through the tree's own shared walk rather than a fresh recursion — a
 * register about private copies that opened with one would be the joke it sounds like.
 */
export function privateCopies(
  root: string,
  parses: readonly SharedParse[] = SHARED_PARSES,
): PrivateCopy[] {
  const found: PrivateCopy[] = [];
  for (const full of typescriptFiles(root)) {
    const file = path.relative(root, full).split(path.sep).join("/");
    // Comments subtracted, literals KEPT — see the module note.
    const code = prepareForScan(readFileSync(full, "utf8"), { literals: "kept" });
    for (const parse of parses) {
      if (parse.home.includes(file)) continue;
      if (markersOf(parse).every((marker) => code.includes(marker))) {
        found.push({ file, parse: parse.name });
      }
    }
  }
  return found.sort((a, b) => `${a.file}${a.parse}`.localeCompare(`${b.file}${b.parse}`));
}

/** Why a site still holds its own copy. Both arms are arguments; neither is an exemption. */
export type CopyStanding =
  /** The markers match and the module asks about something else — another table, another tree. */
  | { kind: "different_question"; why: string }
  /** The same question, still copied. The cost of the divergence, stated by whoever leaves it. */
  | { kind: "unconverted"; cost: string };

export interface DeclaredCopy {
  file: string;
  /** The parse's `name`, resolved against `SHARED_PARSES` by this unit's test. */
  parse: string;
  standing: CopyStanding;
}

export interface CopyDefect {
  kind: "undeclared" | "stale" | "declares_a_home" | "unknown_parse";
  file: string;
  parse: string;
  why: string;
}

/**
 * Every site, with the standing it actually has.
 *
 * THE SHAPE OF THIS TABLE IS THE FINDING. Seven of the ledger copies are the SAME six-column regex
 * in seven quarter documents, each written by copying the previous quarter's test — the pattern
 * `tree-walks.ts` describes in its own note, running one register over. And most of the walks that
 * cannot be converted want the same two things the shared answers do not return: files under
 * `app/`, and `.tsx` under `src/`. That is not an argument for exemptions, it is the specification
 * for the next two answers `tree-walks.ts` should export, and this is where it became visible.
 */
export const DECLARED_COPIES: readonly DeclaredCopy[] = [
  // ---- the ledger row parse -------------------------------------------------------------------
  {
    file: "src/quality/audit-y5.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted",
      cost:
        "Matches done rows together with the builder column, which the shared row does not carry. " +
        "If a column is added or moves, this match finds nothing and reports no rows rather than a " +
        "changed shape, which is the failure mode a copy has and its home does not.",
    },
  },
  {
    file: "src/quality/claim-classes.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "different_question",
      why:
        "A two-column table in a plan document, not the ledger's six-column row. The markers match " +
        "because the module also reads the ledger, through the shared parse.",
    },
  },
  {
    file: "src/quality/closing-state.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "different_question",
      why:
        "The row it matches is one this test wrote into a constructed tree a line earlier. A " +
        "fixture asserted against itself is not a parse of this repository's ledger.",
    },
  },
  {
    file: "src/quality/controls.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "different_question",
      why:
        "The same two-column plan table as `claim-classes.ts`, and the same reason: this module " +
        "reads the ledger itself through `allLedgerRows`.",
    },
  },
  {
    file: "src/quality/dossier-q19.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted",
      cost:
        "A three-capture row parse over the ledger text. It takes id, status and the rest of the " +
        "line, which is `parseLedgerRows` minus the timestamp column and plus a habit of reading " +
        "the remainder as prose.",
    },
  },
  {
    file: "src/quality/gate-dossier-q17.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted",
      cost:
        "Counts blocked rows with its own filter on week-unit ids, which is `blockedRows` with " +
        "W310's correction removed: `SUP-1` and `SUP-2` are blocked and this count cannot see them.",
    },
  },
  {
    file: "src/quality/gate-dossier-y4.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted",
      cost:
        "Matches blocked rows on any id-shaped token, which is W310's fix made a second time by " +
        "hand. Two copies of one correction stay in step until somebody changes what an id may be.",
    },
  },
  {
    file: "src/quality/gate-readiness.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted",
      cost:
        "Blocked rows again, with the rest of the line taken as the note. The shared parse returns " +
        "the note column proper, so a conversion here changes what the blockers are read out of — " +
        "a behaviour change this unit refuses to smuggle in under a de-duplication.",
    },
  },
  ...[
    ["horizon-q22", "Q22"],
    ["horizon-q23", "Q23"],
    ["horizon-q24", "Q24"],
    ["horizon-q25", "Q25"],
    ["horizon-q26", "Q26"],
    ["horizon-q27", "Q27"],
    ["horizon-q28", "Q28"],
  ].map(([file, quarter]) => ({
    file: `src/quality/${file}.test.ts`,
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted" as const,
      cost:
        `${quarter}'s horizon test holds the six-column row regex character for character, and it ` +
        "is there because the quarter before it had one: W351 wrote Q28's by copying Q27's, which "  +
        "W338 had copied from Q26's. Eight " +
        "copies of one parse in eight documents is `tree-walks.ts`'s own sentence about how the " +
        "third copy gets written, and the day the ledger grows a column all eight go quiet " +
        "together while the shared parse is fixed once.",
    },
  })),
  {
    file: "src/quality/horizon-y6.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "unconverted",
      cost:
        "The oldest of the seven, and the one the six quarter tests were copied from. Same cost: a " +
        "row it cannot match is a row it does not report.",
    },
  },
  {
    file: "src/quality/ledger-integrity.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "different_question",
      why:
        "It checks the row SHAPE, so reading the ledger through the parse would make it vacuous: " +
        "the shared parse SKIPS a malformed row, and a check built on it would report nothing " +
        "wrong with a ledger it could no longer read. A checker of a parse may not share it.",
    },
  },
  {
    file: "src/quality/plan-ledger.test.ts",
    parse: "the ledger row parse",
    standing: {
      kind: "different_question",
      why:
        "The same reason as `ledger-integrity.test.ts`, and this file uses the shared parse " +
        "everywhere else — the private regex is the one place it must not.",
    },
  },
  // ---- the tree recursion ---------------------------------------------------------------------
  {
    file: "src/api/surface.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "Walks `app/api` for route handlers. No shared answer returns anything under `app/`, which " +
        "is the missing answer this table exists to make visible rather than an argument for a copy.",
    },
  },
  {
    file: "src/capacity/coupling.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "Walks `src` and `app` for `.ts` and `.tsx`. The `src` half is `sourceModules` with `.tsx` " +
        "added; the shared walks return neither `app/` nor `.tsx`, so half of this copy has a home " +
        "and half of it does not.",
    },
  },
  {
    file: "src/compliance/surfaces.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "The route walk. Its recursion carries the routing rule — a `(group)` folder contributes no " +
        "path segment and a `_private` folder is not routable — so the descent IS the answer rather " +
        "than a way of reaching files.",
    },
  },
  {
    file: "src/credentials/vault.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "Walks `app/` for the pages that could render a credential, which no shared answer returns. " +
        "The `app` tree is the missing answer this table names three more times below.",
    },
  },
  {
    file: "src/directory/dossier-claims.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "Walks `app/` for the pages that import the dossier, and reads `.tsx` while it is there — " +
        "the two things no shared answer returns, in one walk. Converting it would need both.",
    },
  },
  {
    file: "src/interop/credentials.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "Takes the name of a root and joins it to the process working directory, so the walk can be " +
        "pointed at `src` or `app` and at no other tree. W282's defect exactly: a walk nobody can " +
        "hand a constructed tree cannot be shown noticing a file arrive.",
    },
  },
  {
    file: "src/messaging/send-path.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`sourceModules` with `.tsx` added, which is the second missing answer. Until it exists the " +
        "conversion would drop every component from a sweep for send calls, which is worse than the " +
        "copy.",
    },
  },
  {
    file: "src/privacy/automated-decisions.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`sourceModules` exactly, welded to this file's own directory. It can only ever be run " +
        "against the repository it lives in, so nothing can show it reporting a module that arrives.",
    },
  },
  {
    file: "src/privacy/erasure-y5.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "The same copy as `automated-decisions.test.ts`, welded the same way, in the same directory " +
        "— which is the third-copy rule `tree-walks.ts` states, observed inside one area of one tree.",
    },
  },
  {
    file: "src/quality/audit-y5.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "Walks `src` and `app` with tests optional. Two of the three variations it offers are " +
        "`sourceModules` and `testModules`; the third is the `app/` answer nobody has written.",
    },
  },
  {
    file: "src/quality/dossier-q18.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`src` and `app` again, with its own relative-path bookkeeping beside it, so a module moving " +
        "between the two trees changes what this walk calls it and nothing else in the tree agrees.",
    },
  },
  {
    file: "src/quality/g5-rehearsal.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`src` and `app`, for a rehearsal that must read every surface a real G5 review would. The " +
        "`app` half has no home; the `src` half is `sourceModules`.",
    },
  },
  {
    file: "src/quality/register-census.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "The walk that finds walks. It reads `src`, `app` and `scripts`, and `.tsx` and `.mts` — the " +
        "population the shared answers exclude by design — and a census that could only see what " +
        "the shared walks return would be measuring its own reach.",
    },
  },
  {
    file: "src/reporting/retention.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`sourceModules` restricted to one directory, written as a fresh recursion because filtering " +
        "the shared answer by prefix did not occur to anyone with a `readdirSync` to hand.",
    },
  },
  {
    file: "src/security/instruction-sinks.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`src` and `app` with `.tsx`, and its own skip list of three entries beside the tree's six. " +
        "W327's finding, still true in this file: what this walk calls the tree is not what " +
        "`tree-walks.ts` calls the tree.",
    },
  },
  {
    file: "src/security/page-reach.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "`allAreas` lists the top-level directories under `src` and never descends. It matches the " +
        "markers because it asks whether an entry is a directory, which is a register of areas " +
        "rather than a walk over files.",
    },
  },
  {
    file: "src/security/reachability.ts",
    parse: "the tree recursion",
    standing: {
      kind: "different_question",
      why:
        "Walks `app/` for entry points and then follows imports rather than the filesystem. The " +
        "recursion here is the reachability graph's seed, not a file list.",
    },
  },
  {
    file: "src/tenancy/two-tenant.test.ts",
    parse: "the tree recursion",
    standing: {
      kind: "unconverted",
      cost:
        "`testModules` exactly, welded to a module-level root. W290 wrote that walk because four of " +
        "the tree's pinned constants live in test files; this copy answers the same question and " +
        "cannot be pointed anywhere.",
    },
  },
];

/**
 * The sites, against the declarations, in both directions.
 *
 * BOTH DIRECTIONS BECAUSE ONE OF THEM IS THE WHOLE POINT: a declaration for a copy that has been
 * converted is a register describing code that has moved, which is how a table becomes fiction
 * (W267's `stale`, and W335's dossier is what fiction costs).
 */
export function copyDefects(
  root: string,
  parses: readonly SharedParse[] = SHARED_PARSES,
  declared: readonly DeclaredCopy[] = DECLARED_COPIES,
): CopyDefect[] {
  const actual = privateCopies(root, parses);
  const key = (c: { file: string; parse: string }) => `${c.file} ${c.parse}`;
  const declaredKeys = new Set(declared.map(key));
  const actualKeys = new Set(actual.map(key));
  const names = new Set(parses.map((p) => p.name));
  const defects: CopyDefect[] = [];

  for (const copy of actual) {
    if (!declaredKeys.has(key(copy))) {
      defects.push({
        kind: "undeclared",
        file: copy.file,
        parse: copy.parse,
        why: "holds its own copy of a parse this tree shares, and says nothing about why",
      });
    }
  }
  for (const row of declared) {
    if (!names.has(row.parse)) {
      defects.push({
        kind: "unknown_parse",
        file: row.file,
        parse: row.parse,
        why: "declared against a parse this register does not publish",
      });
      continue;
    }
    const home = parses.find((p) => p.name === row.parse)?.home ?? [];
    if (home.includes(row.file)) {
      defects.push({
        kind: "declares_a_home",
        file: row.file,
        parse: row.parse,
        why: "the shared parse itself, declared as a copy of itself",
      });
      continue;
    }
    if (!actualKeys.has(key(row))) {
      defects.push({
        kind: "stale",
        file: row.file,
        parse: row.parse,
        why: "declared as a copy and holds none — converted, moved or renamed",
      });
    }
  }
  return defects.sort((a, b) =>
    `${a.file}${a.parse}${a.kind}`.localeCompare(`${b.file}${b.parse}${b.kind}`),
  );
}

export const PRIVATE_COPY_BOUND =
  "This register reads TEXT, and only under `src/`. A copy of either parse written in `scripts/`, " +
  "in `e2e/`, or in a `.mts` file is invisible to it, and so is a walk spelled with `glob` or " +
  "`fs.opendir` — `register-census.ts` states the same bound about the same spelling, and this " +
  "sentence inherits it rather than restating it. It reads only the two parses named above, and " +
  "the tree shares more than those: a private copy of `prepareForScan`, `fixtureText` or " +
  "`withTree` is a defect nothing here reports. `preparationCopies` in `scan-text.ts` reads the " +
  "comment-stripper and the literal-blanker, which is why they are not repeated here; the others " +
  "stay unread until a unit reads a third shared parse, and until that happens this sentence is " +
  "the whole of what says so.";

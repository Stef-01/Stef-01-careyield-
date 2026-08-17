// W288: the tautology sweep — assertions whose expected value is entailed by their own expression.
//
// Q23's theme, stated in `HORIZON-Q23.md`: *a check that cannot fail is indistinguishable from a
// check that passes.* Six instances in ten units, and every one was found by driving something.
// This unit asks the question in the other direction — not "does this check fire?" but "COULD it?"
// — and asks it mechanically, over every test file in the tree.
//
// WHAT COUNTS AS A TAUTOLOGY HERE, AND THE DEFINITION IS DELIBERATELY NARROW. An assertion is
// tautological when its expected value follows from the ASSERTION'S OWN TEXT, whatever the tree
// does. `expect(true).toBe(true)` is one. `expect(rate).toBeGreaterThanOrEqual(0)` is not — a rate
// is a division and a division can go negative; that one is W256's, and it is policed by a pairing
// rule rather than by refusing the shape. The narrowness is the point: a sweep that flagged every
// assertion it found weak would produce a list nobody reads, and the way that list gets cleared is
// by deleting real tests.
//
// GENERAL ENTAILMENT IS UNDECIDABLE, SO THIS IS A LIST OF SHAPES, NOT A PROVER. Three shapes, each
// decidable from the text of the assertion and each with an argument for why the expected value
// cannot be otherwise. A fourth shape is a fourth entry here, argued; it is not a cleverer regex.
//
// THE HARD PART WAS WHAT NOT TO FLAG, and it is where the first draft would have done damage. Ten
// sites in this tree read `expect(f(x)).toEqual(f(x))` — two calls, compared. Textually that is
// the same expression on both sides and the obvious rule flags all ten. They are REAL: the two
// evaluations are separate calls, and a function reading `Date.now()`, a module-level counter or a
// random salt fails them. Their expected value is entailed only if you already know the function
// is pure, which is the thing being asserted. So the same-text shape fires only when the
// expression contains no call, and the ten are checked to stay unflagged — a planted negative at
// tree scale, which is the shape W292 generalises next.
//
// EVERY HIT IS FIXED OR ACCEPTED, AND THE ACCEPTANCE IS CHECKED RATHER THAN ASSERTED. Four sites
// are `expect(true).toBe(true)` closing a test whose real assertion is a `@ts-expect-error` —
// tsc fails on the error AND on an unused expect-error, so those tests are enforced by the
// compiler and the runtime line is a formality. That is a good reason, and a reason in prose rots.
// So each acceptance names the condition that makes it true and the condition is re-derived from
// the file: an accepted site whose test loses its `@ts-expect-error` stops being accepted.
//
// KNOWN BOUND, stated rather than filed quietly: this reads text, so a tautology that needs a
// TYPE to see — a locally-declared const whose initialiser fixes its type, a constant imported
// from another module and compared against its own value — is invisible here. `SWEEP_BOUND` says
// so and names the change that would lift it. Same class of bound as W267's `readdirSync(`
// detector, and the same remedy posture: when one arrives, the sweep grows a pass and says so,
// rather than the register growing an exemption.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the tree's own test files as text.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { testModules } from "./tree-walks";

/** The shapes this sweep can decide. Three, each argued in `SHAPE_ARGUMENTS`. */
export type TautologyShape =
  | "both_sides_the_same_constant"
  | "typeof_of_an_imported_binding"
  | "lower_bound_a_count_cannot_break";

export interface Tautology {
  /** Repo-relative, posix separators. */
  file: string;
  /** 1-indexed, so the hit can be opened. */
  line: number;
  /** The assertion as written, whitespace collapsed. */
  text: string;
  shape: TautologyShape;
  /** The `it(...)` title the assertion sits in, which is how an acceptance is keyed. */
  test: string;
}

/** Why each shape's expected value follows from the assertion's own text. */
export const SHAPE_ARGUMENTS: Readonly<Record<TautologyShape, string>> = {
  both_sides_the_same_constant:
    "The subject and the expected value are the same text and neither contains a call, so both sides evaluate to the same value in every possible tree. `expect(true).toBe(true)` and `expect(X.length).toBe(X.length)` are the same assertion about nothing. The no-call condition is what separates this from the determinism idiom, where two calls are compared and either can differ.",
  typeof_of_an_imported_binding:
    "`typeof` of a statically imported binding is fixed by the import: if the export disappears or changes kind, tsc fails before any test runs, and if it does not, the assertion cannot. It is a runtime check of something the compiler already refuses to let through.",
  lower_bound_a_count_cannot_break:
    "A `.length` or a `.size` is a count, and a count is never negative — so `toBeGreaterThanOrEqual(0)` and `toBeGreaterThan(-1)` over one hold in every tree. This is Y5-1's shape, which the Year 5 audit found three times and W256 closed by requiring an upper bound in the same test; that rule polices one matcher against one number, and this refuses the shape wherever the subject is a count.",
};

/** An assertion lifted out of a test file, with enough context to classify it. */
/**
 * One `expect(...)...matcher(...)`, in parts.
 *
 * Exported at W293, which sweeps the same files for a different shape and needs the same parse.
 * A second copy of this parser would be a second set of wrapping bugs to find.
 */
export interface Assertion {
  subject: string;
  negated: boolean;
  matcher: string;
  expected: string;
  index: number;
  text: string;
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Scan from an opening bracket to its match, returning the index just past the closer. */
function endOfGroup(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

/** The first top-level argument: vitest's second argument is the failure message, not the subject. */
function firstArgument(args: string): string {
  let depth = 0;
  for (let i = 0; i < args.length; i++) {
    const ch = args[i]!;
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    else if (ch === "," && depth === 0) return args.slice(0, i);
  }
  return args;
}

/**
 * Strings, template literals and regexes with their CONTENTS blanked, same length, same lines.
 *
 * THE ELEVENTH INSTANCE OF THIS TREE'S RECURRING COLLISION, and the first draft walked into it: a
 * scan for assertion-shaped text finds the assertion-shaped text in its own test file, where the
 * probes are quoted strings. W237 hit it with an endpoint scan matching the note explaining why no
 * endpoint exists, and the fix there is the fix here — narrow the scan to code constructs rather
 * than exempt the file, because a self-exemption is the one thing a sweep must never grant itself.
 *
 * Blanking rather than deleting keeps every offset and every newline, so a hit still reports the
 * line it is on and the text it quotes is the real text — the parts are sliced from the original.
 * Regexes are consumed by the same pass so that a quote inside a character class — `/["']/` is in
 * this tree — cannot open a string that swallows the next assertion.
 */
export function blankLiterals(code: string): string {
  const LITERAL =
    /`(?:\\.|[^\\`])*`|"(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*'|\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\\/\n[])+\/[gimsuy]*/g;
  return code.replace(LITERAL, (m) => m.replace(/[^\n]/g, " "));
}

/**
 * Every `expect(...)...matcher(...)` in the text, with its parts.
 *
 * Bracket-matched rather than line-matched: assertions in this tree wrap, and a line-oriented scan
 * silently drops the wrapped ones — the arriving-file failure at the granularity of one statement.
 * Boundaries are found on the blanked text and the parts are sliced from the real one, so a paren
 * inside a string cannot move a boundary and a hit still quotes what the author wrote.
 */
export function assertionsIn(code: string): Assertion[] {
  const scan = blankLiterals(code);
  const out: Assertion[] = [];
  for (const match of scan.matchAll(/\bexpect\s*\(/g)) {
    const open = match.index + match[0].length - 1;
    const afterSubject = endOfGroup(scan, open);
    const chain = /^((?:\.\w+)*)\.(\w+)\s*\(/.exec(scan.slice(afterSubject));
    if (!chain) continue;
    const matcherOpen = afterSubject + chain[0].length - 1;
    const end = endOfGroup(scan, matcherOpen);
    const args = code.slice(open + 1, afterSubject - 1);
    out.push({
      subject: collapse(args.slice(0, firstArgument(scan.slice(open + 1, afterSubject - 1)).length)),
      negated: chain[1]!.includes(".not"),
      matcher: chain[2]!,
      expected: collapse(code.slice(matcherOpen + 1, end - 1)),
      index: match.index,
      text: collapse(code.slice(match.index, end)),
    });
  }
  return out;
}

/** Every name the file imports statically, by binding — default, named and namespace alike. */
function importedNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const m of code.matchAll(/import\s+([^;]*?)\s+from\s*["'][^"']+["']/g)) {
    const clause = m[1]!;
    for (const named of clause.matchAll(/\{([^}]*)\}/g)) {
      for (const part of named[1]!.split(",")) {
        const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
        if (name) names.add(name);
      }
    }
    const bare = clause.replace(/\{[^}]*\}/g, "").replace(/\*\s+as\s+/, "").split(",");
    for (const part of bare) {
      const name = part.trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return names;
}

/** A subject that ends in a count. `indexOf(...)` and a bare identifier deliberately do not. */
const COUNT = /\.(?:length|size)$/;

/**
 * The title of the `it(...)` or `test(...)` the offset sits inside, or the file's own name.
 *
 * Exported at W293, which reports hits by test rather than by line for the same reason W288 does.
 * A second copy would also be a second declared fold site for one last-element read.
 */
export function enclosingTest(code: string, index: number): string {
  const before = code.slice(0, index);
  const opens = [...before.matchAll(/\b(?:it|test)\s*\(\s*(["'`])((?:[^\\]|\\.)*?)\1/g)];
  return opens.length > 0 ? collapse(opens[opens.length - 1]![2]!) : "(outside a test)";
}

/**
 * Classify every assertion in one test file's text.
 *
 * Pure and text-in, so each shape can be driven with a constructed assertion rather than only with
 * whatever the tree happens to contain — W291's rule about a healthy tree producing none of the
 * inputs a register exists to report.
 */
export function tautologiesIn(file: string, source: string): Tautology[] {
  // Comments are subtracted first: a commented-out assertion is not an assertion, and this tree's
  // notes quote the shapes they warn about. `stripComments` keeps the newlines, so lines still map.
  const code = stripComments(source);
  const imported = importedNames(code);
  const out: Tautology[] = [];
  for (const a of assertionsIn(code)) {
    const shape = ((): TautologyShape | null => {
      if (
        !a.negated &&
        ["toBe", "toEqual", "toStrictEqual"].includes(a.matcher) &&
        a.subject === a.expected &&
        // THE GUARD. A call on either side is a second evaluation that can differ, which is what
        // the determinism idiom is for. Without this the sweep flags ten real assertions.
        !a.subject.includes("(")
      ) {
        return "both_sides_the_same_constant";
      }
      const typeofName = /^typeof\s+([A-Za-z_$][\w$]*)$/.exec(a.subject)?.[1];
      if (typeofName && imported.has(typeofName)) return "typeof_of_an_imported_binding";
      if (
        !a.negated &&
        COUNT.test(a.subject) &&
        ((a.matcher === "toBeGreaterThanOrEqual" && a.expected === "0") ||
          (a.matcher === "toBeGreaterThan" && a.expected === "-1"))
      ) {
        return "lower_bound_a_count_cannot_break";
      }
      return null;
    })();
    if (!shape) continue;
    out.push({
      file,
      line: code.slice(0, a.index).split("\n").length,
      text: a.text,
      shape,
      test: enclosingTest(code, a.index),
    });
  }
  return out;
}

/** Every tautological assertion under `root/src`, in file order. */
export function sweepTautologies(root: string): Tautology[] {
  return testModules(root).flatMap((file) =>
    tautologiesIn(path.relative(root, file).split(path.sep).join("/"), readFileSync(file, "utf8")),
  );
}

/**
 * A hit left in the tree on purpose, with the condition that makes leaving it right.
 *
 * `condition` is a NAMED check re-derived from the file, not a sentence. There is one condition
 * today because there is one reason today; a second reason means a second named check and a second
 * arm in `brokenAcceptances`, not a condition language nobody can read.
 */
export interface AcceptedTautology {
  file: string;
  /** The `it(...)` title, which survives edits above it in a way a line number does not. */
  test: string;
  condition: "the test's real assertion is a @ts-expect-error";
  why: string;
  /**
   * ISO date. Past this, somebody looks again — and W294 made that sentence true.
   *
   * Added at W294, which found that five of the tree's seven acceptance registers checked a review
   * date's SHAPE and never compared it to a clock. This register had no date at all, on the
   * argument that its condition is machine-checked; a machine-checked condition says the reason is
   * still literally true, not that it is still the right reason.
   */
  reviewBy: string;
}

export const ACCEPTED_TAUTOLOGIES: readonly AcceptedTautology[] = [
  {
    file: "src/referrals/acceptance.test.ts",
    test: "has no overload taking a status, a referral id, or anything else",
    condition: "the test's real assertion is a @ts-expect-error",
    reviewBy: "2027-02-14",
    why: "W133's obligations API is checked at COMPILE time — two `@ts-expect-error` lines say the function has no overload taking a status or a bare id. tsc errors on the call if the overload appears AND on the expect-error if it does not, so the test is enforced in both directions by the compiler. The runtime line closes a body vitest would otherwise report as an empty test.",
  },
  {
    file: "src/credentials/vault.test.ts",
    test: "does not typecheck without a grant",
    condition: "the test's real assertion is a @ts-expect-error",
    reviewBy: "2027-02-14",
    why: "W109's whole mechanism is that a route skipping the grant does not fail review, it fails to COMPILE: the grant is branded with a unique symbol the module never exports, so no literal satisfies it. Three `@ts-expect-error` lines are the assertion; nothing about it is observable at runtime, which is the property.",
  },
  {
    file: "src/education/curation.test.ts",
    test: "takes no count, threshold or cutoff — and no overload adds one",
    condition: "the test's real assertion is a @ts-expect-error",
    reviewBy: "2027-02-14",
    why: "The claim is about a signature that does NOT exist — `curate` takes items and a context and nothing else. An absent overload has no runtime trace, so the only place to assert it is the compiler.",
  },
  {
    file: "src/pathways/evaluation.test.ts",
    test: "requires a pathway as an argument — evaluation cannot start from facts alone",
    condition: "the test's real assertion is a @ts-expect-error",
    reviewBy: "2027-02-14",
    why: "The direction is the posture: evaluation cannot start from facts alone, so there is no overload taking facts on their own. Same shape as the three above — a statement about what will not typecheck.",
  },
];

const id = (t: { file: string; test: string }) => `${t.file}::${t.test}`;

/** Tautologies with no acceptance — the list this unit exists to keep empty. */
export function unacceptedTautologies(root: string): Tautology[] {
  const accepted = new Set(ACCEPTED_TAUTOLOGIES.map(id));
  return sweepTautologies(root).filter((t) => !accepted.has(id(t)));
}

/**
 * Acceptances that have stopped being true, in both directions.
 *
 * An acceptance whose test no longer carries a `@ts-expect-error` is a reason that has rotted, and
 * an acceptance for a hit that is gone is a register describing a tree that has moved. Both are
 * the failure W102 was written against, at the granularity of a reason rather than a route.
 */
export function brokenAcceptances(root: string): string[] {
  const hits = sweepTautologies(root);
  const broken: string[] = [];
  for (const entry of ACCEPTED_TAUTOLOGIES) {
    const hit = hits.find((t) => id(t) === id(entry));
    if (!hit) {
      broken.push(`${id(entry)}: accepted, but the sweep no longer finds it`);
      continue;
    }
    // Raw text, NOT the comment-stripped code: `@ts-expect-error` IS a comment, and the condition
    // is about what the compiler reads rather than what the sweep does.
    const source = readFileSync(path.join(root, entry.file), "utf8");
    const start = source.indexOf(entry.test);
    // `indexOf` returning -1 for the closing marker would make `slice(start, -1)` read to the end
    // of the file but ONE character short, which is a wrong answer wearing a plausible shape. The
    // rest of the file is the honest fallback and is stated rather than arrived at.
    const close = source.indexOf("\n  });", start);
    const body = start < 0 ? "" : source.slice(start, close < 0 ? undefined : close);
    if (!body.includes("@ts-expect-error")) {
      broken.push(`${id(entry)}: accepted for a @ts-expect-error the test no longer has`);
    }
  }
  return broken.sort();
}

/**
 * Shapes this sweep deliberately does NOT flag, each with the argument.
 *
 * Data rather than a comment — W196's shape — because these are the entries a later unit is most
 * likely to "fix" by widening the detector, and widening any of them turns real tests into hits.
 */
export const NOT_A_TAUTOLOGY: Readonly<Record<string, string>> = {
  comparing_two_calls_of_the_same_function:
    "`expect(templateHash(TEXT)).toBe(templateHash(TEXT))` and nine more like it. Textually identical on both sides, and REAL: they are two separate evaluations, and a function reading the clock, a module counter or a random salt fails them. Entailed only if you already know the function is pure, which is the assertion. Flagging these would delete this tree's determinism checks.",
  a_lower_bound_on_a_rate:
    "`expect(rate).toBeGreaterThanOrEqual(0)` where the subject is a division rather than a count. Nothing in the text says a rate cannot go negative — a subtraction in the numerator is exactly how it would — so this is weak rather than vacuous. W256 already polices it, by requiring an upper bound in the same test.",
  an_index_compared_against_minus_one:
    "`expect(start).toBeGreaterThan(-1)` on an `indexOf`. -1 is the MISS value, so the assertion is 'the heading exists' and it fails whenever it does not. The count shape is keyed on the subject being a `.length` or a `.size` for exactly this reason: the matcher alone cannot tell the two apart.",
  a_non_emptiness_claim:
    "`expect(xs.length).toBeGreaterThan(0)` — a claim about the tree that a wrong tree breaks. Eighty-odd sites, and the near-miss against the count shape is one character of the expected value.",
  typeof_of_a_local_binding:
    "`expect(typeof code).toBe('string')` where `code` is declared in the same test. Equally entailed by the type, and not flagged: resolving a local declaration's type is a type-checker's job, and a text sweep guessing at it would be a detector tuned toward its author's answer — W279's refusal. Named in `SWEEP_BOUND` rather than half-implemented.",
};

/**
 * What a clean sweep does not prove, in the sweep's own words.
 *
 * The sentence a green tick invites a reader to forget, which is why W237 made its own version
 * exported data rather than a comment.
 */
export const SWEEP_BOUND =
  "This reads text. A tautology that needs a TYPE to see it is invisible here: a local const whose initialiser fixes its type, a constant compared against a value imported from the module under test, a generic that collapses to a literal. Three shapes are decided, not all of them. The change that lifts it is a pass over the TypeScript AST with the checker attached, which can ask what an expression's type is rather than what its text looks like — a different tool from this one, and worth its own unit if a hit is ever found that way. Until then a clean sweep means 'none of the three shapes', which is what it says. And the literal-blanking that keeps the scan out of quoted probes is a lexer approximation, not a parser: `a / b / c` can be consumed as a regex, and a mis-blank hides assertions rather than inventing them. The canary is the four accepted hits, which sit in four different files and are asserted to still be found — wholesale hiding fails that before it can read as a clean tree.";

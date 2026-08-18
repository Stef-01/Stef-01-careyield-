// W323: one way to say a list is non-empty.
//
// THE TREE SAYS IT THREE WAYS AND MEANT ONE THING BY ALL OF THEM. Measured from the suite with
// W288's parser rather than by eye: `expect(xs.length).toBeGreaterThan(0)` in one hundred and
// fifty-two places, `expect(xs).not.toEqual([])` in five, `expect(cells).not.toHaveLength(0)` in
// three. Nobody chose that spread; each site was written by whoever was there, and every one of
// them is the same sentence — THIS COLLECTION HAS AT LEAST ONE THING IN IT.
//
// WHY IT MATTERS IS NOT TIDINESS, and this register would not be worth a unit if it were. This
// tree's sweeps read assertions: W288 looks for tautologies, W293 for empty-list claims nothing
// evidences, W304 for pinned counts, W317 for frozen equalities. Every one of them keys on the
// SUBJECT ending in a count — `COUNT = /\.(?:length|size)$/` in `tautology-sweep.ts` is the shared
// definition. A spelling that hides the count inside the matcher is invisible to all of them at
// once. `expect(cells).not.toHaveLength(0)` is a claim about a length that no sweep in this tree
// can see is about a length. The vocabulary is not a style question; it is what the instruments
// can read.
//
// SO THE CANONICAL FORM IS THE ONE THAT PUTS THE COUNT IN THE SUBJECT, which is also the form
// W323 measured at one hundred and fifty-two sites against eight. Converting the other way would
// have been a hundred and fifty edits of churn to reach a form the tree's own scanners cannot
// see.
//
// AND THE NEAR MISSES ARE DECLARED BESIDE THE FORMS, because the first draft of this scan got one
// wrong. It read `expect(flagged.every((f) => f.verdict.reason.length > 0)).toBe(true)` as a
// non-emptiness claim, on the strength of `.length >` appearing in the subject. That says every
// ELEMENT has a non-empty field, which is true of an empty list — the opposite direction. Two of
// those are in the tree and both would have been converted into a claim they do not make. They
// are `NOT_THIS_CLAIM` below, planted and required to be refused.
//
// WHAT THIS DOES NOT PROVE is `VOCABULARY_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the text of the tree's own test files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { testModules } from "./tree-walks";
import { type Assertion, assertionsIn, enclosingTest } from "./tautology-sweep";

/** A spelling of *this collection has at least one thing in it*. */
export interface NonEmptyForm {
  id: string;
  /**
   * One line in this spelling.
   *
   * PLANTED RATHER THAN FOUND, on purpose. Four of the six forms below appear nowhere in the tree
   * today, and a form the sweep cannot demonstrate on is a form it will not recognise when
   * somebody writes it next quarter. Declaring a spelling and never running the scan over it is
   * the vacuity W295 exists about.
   */
  planted: string;
  /** Why it is the SAME claim: at least one, and nothing more than that. */
  why: string;
}

/** The one form the tree keeps. */
export const CANONICAL = "count > 0";

export const NON_EMPTY_FORMS: readonly NonEmptyForm[] = [
  {
    id: CANONICAL,
    planted: "expect(xs.length).toBeGreaterThan(0);",
    why: "The count is in the SUBJECT, which is the only place this tree's other sweeps look for it — `tautology-sweep`, `empty-list-sweep`, `self-defeating` and W304's register all key on a subject ending `.length` or `.size`. That is what makes it canonical rather than its being the majority, though it is also the majority: one hundred and fifty-two sites against eight.",
  },
  {
    id: "count >= 1",
    planted: "expect(xs.length).toBeGreaterThanOrEqual(1);",
    why: "Arithmetically identical over integers — at least one and nothing more. It reads as a floor, which is the shape W304 asks for when the number is a real minimum, and that is exactly why it should not be spelled this way when the number is just *some*: a reader cannot tell whether the 1 is meaningful.",
  },
  {
    id: "count not 0",
    planted: "expect(xs.length).not.toBe(0);",
    why: "The same claim by negation. A count cannot be negative, so *not zero* is *at least one*. It appears nowhere in the tree and is declared because it is the spelling somebody reaches for when converting away from `toEqual([])` — the halfway house between the two forms below and the canonical one.",
  },
  {
    id: "count truthy",
    planted: "expect(xs.length).toBeTruthy();",
    why: "The same claim through JavaScript's coercion, and the one form that is weaker for a reason worth writing down: `toBeTruthy` passes for a subject that is not a number at all, so a typo turning `.length` into a method reference still passes. It is recognised so it can be reported, not so it can be used.",
  },
  {
    id: "not toHaveLength(0)",
    planted: "expect(xs).not.toHaveLength(0);",
    why: "The claim with the count moved from the subject into the matcher. THIS IS THE FORM THAT COSTS SOMETHING: the assertion is about a length and no sweep in this tree can tell, because every one of them reads the subject. Three sites, all converted by this unit.",
  },
  {
    id: "not equal []",
    planted: "expect(xs).not.toEqual([]);",
    why: "The claim with the count gone entirely — it says *not this exact value* and relies on the reader knowing the only other empty value is the one meant. Five sites, all converted. It is also the form that silently changes meaning if the subject stops being an array: a `Set` is never equal to `[]`, so the assertion passes whatever the set holds.",
  },
];

/** A shape that looks like the claim and is not it. */
export interface NearMiss {
  planted: string;
  why: string;
}

/**
 * The shapes that must NOT be counted, each planted and required to be refused.
 *
 * W292's discriminating pairs. A sweep proved only on its positives is a sweep that has not been
 * shown to be about anything, and the second entry here is not hypothetical: it is what the first
 * draft of `formOf` actually did.
 */
export const NOT_THIS_CLAIM: readonly NearMiss[] = [
  {
    planted: "expect(xs.length).toBeGreaterThan(8);",
    why: "A FLOOR, which says more than *at least one*. W304's remedy for a pinned count is exactly this shape, so a scan that swallowed it would report the tree's deliberate minimums as vocabulary drift and the conversion would destroy the number somebody chose.",
  },
  {
    planted: "expect(flagged.every((f) => f.reason.length > 0)).toBe(true);",
    why: "EVERY ELEMENT'S FIELD is non-empty — which is vacuously TRUE of an empty list, so it is not merely a different claim, it is one that points the opposite way. The first draft of this scan matched it on `.length >` appearing in the subject; the tree holds two, in `provenance.test.ts` and `intervals.test.ts`, and both would have been rewritten into a sentence they do not say. What refuses it now is the MATCHER, not the subject — no form pairs `toBe` with `true` — which is worth writing down because the subject rule is what a reader assumes is doing the work here, and it is not.",
  },
  {
    planted: "expect(xs.length).toBe(0);",
    why: "The opposite claim, in the canonical form's own subject shape. W293 is the register built on it — an empty-list assertion that nothing evidences — so a scan that swallowed this one would hand W323 every site W293 exists to watch, and the conversion would turn each *this found nothing* into *this found something*. A scan that cannot tell empty from not-empty is not reading the assertion at all.",
  },
  {
    planted: "expect(xs).toEqual([]);",
    why: "The opposite claim in the un-negated spelling of the form above it — the pair most likely to be confused by a scan that forgets to read `negated`, because the subject, the matcher and the expected value are all identical and one boolean separates *this list is empty* from *this list is not*. The tree makes the empty claim in dozens of places and every one of them would be rewritten backwards.",
  },
  {
    planted: "expect(byLength.get(xs.length)).toBeTruthy();",
    why: "A subject that CONTAINS a count without being one — the claim is that a lookup found an entry, not that anything is non-empty. It is here because it is the only near miss that discriminates `COUNT` being anchored to the end of the subject: without the anchor this reads as `count truthy`, and a mutation removing that anchor survived every other probe in this file.",
  },
  {
    planted: "expect(xs.length).toBeLessThan(3);",
    why: "A ceiling on the same count. Same subject and same shape as the canonical form, and it PERMITS ZERO — so a scan that keyed on the subject ending in `.length` and left the matcher unread would convert a ceiling into a floor and reverse the assertion. It is the reason `formOf` reads matcher and expected value together rather than either alone.",
  },
];

const COUNT = /\.(?:length|size)$/;
const ZERO_EQUALITY = ["toBe", "toEqual", "toStrictEqual"];

/**
 * Which spelling an assertion is, or `null` for anything that is not this claim.
 *
 * The subject is required to END in a count for the four count-forms, rather than merely to
 * contain one: `byLength.get(xs.length)` contains a count and claims a lookup succeeded. The
 * matcher and the expected value are read with it, because subject alone cannot tell a floor from
 * a ceiling and matcher alone cannot tell a count from a lookup.
 */
export function formOf(a: Assertion): string | null {
  const counted = COUNT.test(a.subject);
  if (counted && !a.negated && a.matcher === "toBeGreaterThan" && a.expected === "0") return CANONICAL;
  if (counted && !a.negated && a.matcher === "toBeGreaterThanOrEqual" && a.expected === "1") {
    return "count >= 1";
  }
  if (counted && a.negated && ZERO_EQUALITY.includes(a.matcher) && a.expected === "0") return "count not 0";
  if (counted && !a.negated && a.matcher === "toBeTruthy" && a.expected === "") return "count truthy";
  if (a.negated && a.matcher === "toHaveLength" && a.expected === "0") return "not toHaveLength(0)";
  if (a.negated && ["toEqual", "toStrictEqual"].includes(a.matcher) && /^\[\s*\]$/.test(a.expected)) {
    return "not equal []";
  }
  return null;
}

/** Every non-emptiness spelling in a snippet — the plantable half, needing no tree. */
export function formsIn(code: string): string[] {
  return assertionsIn(code)
    .map(formOf)
    .filter((f): f is string => f !== null);
}

/** A non-emptiness claim, located. */
export interface NonEmptyClaim {
  file: string;
  test: string;
  form: string;
  text: string;
}

/** Every non-emptiness claim in every `*.test.ts` under `src/`. */
export function nonEmptyClaims(root: string): NonEmptyClaim[] {
  const out: NonEmptyClaim[] = [];
  for (const file of testModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = stripComments(readFileSync(file, "utf8"));
    for (const a of assertionsIn(code)) {
      const form = formOf(a);
      if (form) out.push({ file: rel, test: enclosingTest(code, a.index), form, text: a.text });
    }
  }
  return out;
}

/** A claim spelled some way other than the canonical one. */
export interface VocabularyDefect {
  /** `file :: test` — W290's rule, no line number. */
  site: string;
  what: string;
}

/**
 * Every non-emptiness claim not spelled the canonical way.
 *
 * ONE DIRECTION AND NOT TWO, which is a departure from W102's shape and is deliberate. The other
 * direction for a register is *a declared thing the tree no longer holds*, and here that would be
 * a declared FORM with no live occurrence — but four of the six have no live occurrence by design,
 * because a vocabulary register exists to recognise the spellings the tree does not use yet. The
 * both-directions job is done by `NON_EMPTY_FORMS` being planted instead: a form nobody can
 * demonstrate fails in the suite beside this.
 */
export function vocabularyDefects(
  root: string,
  canonical: string = CANONICAL,
): VocabularyDefect[] {
  return nonEmptyClaims(root)
    .filter((c) => c.form !== canonical)
    .map((c) => ({
      site: `${c.file} :: ${c.test}`,
      what: `says a list is non-empty as \`${c.form}\`, and this tree says it as \`${canonical}\``,
    }))
    .sort((a, b) => `${a.site}${a.what}`.localeCompare(`${b.site}${b.what}`));
}

/**
 * The spellings of the OPPOSITE claim — *this list is empty* — that the tree still holds.
 *
 * Not part of the sweep and not converted by this unit. It exists because `VOCABULARY_BOUND` says
 * the tree writes several claims several ways and this unit normalised one, and W297 requires a
 * bound to carry a predicate that can be seen saying false. This is that predicate's derivation:
 * when a later unit gives emptiness one spelling too, the sentence stops being true and says so.
 */
export function emptinessSpellings(root: string): string[] {
  const found = new Set<string>();
  for (const file of testModules(root)) {
    for (const a of assertionsIn(stripComments(readFileSync(file, "utf8")))) {
      if (a.negated) continue;
      if (COUNT.test(a.subject) && ZERO_EQUALITY.includes(a.matcher) && a.expected === "0") {
        found.add("count is 0");
      } else if (a.matcher === "toHaveLength" && a.expected === "0") {
        found.add("toHaveLength(0)");
      } else if (["toEqual", "toStrictEqual"].includes(a.matcher) && /^\[\s*\]$/.test(a.expected)) {
        found.add("equal []");
      }
    }
  }
  return [...found].sort();
}

/** What a green sweep does not prove. */
export const VOCABULARY_BOUND =
  "This covers ONE claim — a collection has at least one element — in the spellings " +
  "`NON_EMPTY_FORMS` declares. A spelling nobody has thought of yet is invisible, which is the " +
  "class of bound W267 states about `readdirSync` and has the same remedy: the register grows and " +
  "says so. THE HARDER LIMIT IS THAT THE TREE HAS MANY SUCH CLAIMS AND THIS UNIT NORMALISED ONE. " +
  "A list is empty, a value is present, a function throws, a string contains a marker — each is " +
  "written several ways in this suite and none of them is checked here. Choosing one spelling per " +
  "claim is a unit each, and nothing in this module makes the next one cheaper except the shape. " +
  "AND THE CANONICAL FORM WAS CHOSEN FOR THE SCANNERS, NOT FOR THE READER: its failure output is " +
  "`expected +0 to be greater than +0`, which names neither the list nor what was wanted, so the " +
  "assertion is only as legible as the message beside it — and nothing here requires a message. " +
  "That is a second unit and this bound is where it is written down rather than a defect this one " +
  "quietly fixed.";

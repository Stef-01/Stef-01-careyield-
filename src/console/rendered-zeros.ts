// W384: what a page RENDERS, not what it computes.
//
// W361 FOUND A CONSOLE'S ZEROES BY THE NAME OF THE EXPRESSION THAT PRODUCES THEM — `.length`,
// `.size`, `.total`, a `count`-suffixed field — and its own bound says what that costs: *a page
// that renders a number some other way is outside the population entirely*. The live case was
// `/console/referrals`, whose day-two emptiness is not a number at all. It is a LIST that renders
// no rows, beside a paragraph that says no other practice has referred a patient here. The most
// important zero on the page was invisible to the register built to find zeroes.
//
// THE CONDITION HAS BEEN RE-AIMED THREE TIMES AND EACH AIM WAS A GUESS AT WHICH UNIT WOULD WANT
// THE WORK. W361 owed it to W363, W364 re-pointed it at W371 on the grounds that a link graph was
// what it wanted — and it was not, because reachability is not what a page renders its zero AS.
// W377 stopped guessing and wrote the derivation into the plan instead. This is that derivation.
//
// SO THE READING IS STRUCTURAL. A list render is `X.map(`; the question is what the reader sees
// when `X` is empty, and the answer is in the MARKUP AROUND IT rather than in what `X` is called.
// A list sitting in one arm of a conditional whose other arm renders words has an empty state: the
// page speaks. A list with no such arm renders nothing at all, and the reader is looking at a
// heading above whitespace. Nine of those on this console, declared below with what each shows
// instead — which is the finding, and none of them would have been in W361's population.
//
// THE TREE WRITES TWO IDIOMS AND BOTH ARE READ. The ternary — `{xs.length === 0 ? <p/> : <ul/>}` —
// is linked structurally, so no name is needed. The pair of `&&` blocks — `{xs.length > 0 && <ul/>}`
// beside `{xs.length === 0 && <p/>}` — is linked by NOTHING except the subject they both test, so
// there the name is the only evidence there is and this reads it.
//
// WHAT THIS DOES NOT PROVE is `RENDERED_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Page source and operator copy; no patient is addressed
// and no clinical claim is made or read.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "@/quality/scan-text";
import { filesUnder } from "@/quality/tree-walks";
import { zeroSites } from "@/console/zero-meaning";

/** How the reader meets a zero on the screen. */
export type RenderedAs =
  /** A digit. W361's population, folded in so this one is a superset rather than a rival. */
  | "number"
  /** A list whose emptiness the page answers in words. */
  | "empty_state"
  /** A list that renders nothing and says nothing. The class this register exists to name. */
  | "silent";

export interface RenderedZero {
  /** The route, as `/console/…`. */
  route: string;
  /** The expression whose emptiness the reader would meet — its own text, so a rename is visible. */
  subject: string;
  renderedAs: RenderedAs;
}

/** Words on a screen: a run of letters between tags, or an interpolated copy constant. */
const TEXT_RUN = />[^<>{}]*[A-Za-z]{3,}/;
const COPY_NAME = /\{\s*[A-Z][A-Z0-9_]*(?:\.[\w$]+|\[[^\]]*\])+/;

/** Whether an arm of a conditional puts words in front of the reader. */
export const speaks = (arm: string): boolean => TEXT_RUN.test(arm) || COPY_NAME.test(arm);

/** The part of a page file that is MARKUP, from its first `return (` onward — W361's cut. */
function markupOf(source: string): string {
  const at = source.indexOf("return (");
  return at === -1 ? "" : source.slice(at);
}

/**
 * Every brace block in the markup, NESTED ONES INCLUDED, as offsets into it.
 *
 * W361's `interpolations` skipped past each block it found, which is right for a scan that reads
 * one expression per interpolation and wrong for this one: the conditional that answers a list's
 * emptiness is usually the block the list sits INSIDE, and a walk that never descends can never
 * find it.
 */
export function blockSpans(source: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== "{" || source[i - 1] === "=") continue;
    let depth = 0;
    let j = i;
    for (; j < source.length; j += 1) {
      if (source[j] === "{") depth += 1;
      else if (source[j] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth === 0) out.push([i + 1, j]);
  }
  return out;
}

/** The top-level `?` and `:` of a block, or null when it is not a conditional. */
export function ternary(block: string): { q: number; c: number } | null {
  let depth = 0;
  let q = -1;
  let c = -1;
  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i]!;
    if ("({[".includes(ch)) depth += 1;
    else if (")}]".includes(ch)) depth -= 1;
    // `?.` is optional chaining, not a conditional.
    else if (ch === "?" && depth === 0 && q === -1 && block[i + 1] !== ".") q = i;
    else if (ch === ":" && depth === 0 && q !== -1 && c === -1) c = i;
  }
  return q === -1 || c === -1 ? null : { q, c };
}

/** The balanced extent of a call whose opening paren is at `open`. */
function callEnd(source: string, open: number): number {
  let depth = 0;
  let i = open;
  for (; i < source.length; i += 1) {
    const c = source[i]!;
    if ("({[".includes(c)) depth += 1;
    else if (")}]".includes(c)) {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return i;
}

/** A list this page renders rows from: the subject, and where its `.map(` sits in the markup. */
interface ListRender {
  subject: string;
  at: number;
}

/**
 * Every list a page renders ROWS from, with the three kinds that are not one.
 *
 * A `.map` whose result is `join`ed builds a STRING — `/console/founder` writes one — and a string
 * has no rows to be absent. A subject rooted at a parameter another `.map` binds is a detail of a
 * row already on the screen, so its emptiness is the outer list's question rather than its own. A
 * subject rooted at a module constant cannot be empty on any run, and a register that argued about
 * `SETUP_STEPS` being empty would be arguing about nothing.
 */
export function listRenders(whole: string, markup: string): ListRender[] {
  const bound = new Set<string>();
  for (const m of markup.matchAll(/\.map\(\s*\(?\s*\{?\s*([A-Za-z_$][\w$]*)/g)) bound.add(m[1]!);
  for (const m of markup.matchAll(/\.map\(\s*\(\s*\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(",")) bound.add(part.trim().split(":")[0]!.trim());
  }

  const out: ListRender[] = [];
  const seen = new Set<string>();
  for (const m of markup.matchAll(/([A-Za-z_$][\w$.]*)\.map\(/g)) {
    const subject = m[1]!;
    const root = subject.split(".")[0]!;
    if (bound.has(root)) continue;
    if (/^[A-Z][A-Z0-9_]*$/.test(root)) continue;
    if (new RegExp(String.raw`const ${root}\s*(?::[^=]+)?=\s*\[`).test(whole)) continue;
    if (/^\s*\.join\(/.test(markup.slice(callEnd(markup, m.index! + m[0].length - 1) + 1))) continue;
    if (seen.has(subject)) continue;
    seen.add(subject);
    out.push({ subject, at: m.index! });
  }
  return out;
}

/**
 * Whether the page answers this list's emptiness in words.
 *
 * TWO READINGS, BECAUSE THE TREE WRITES TWO IDIOMS AND ONLY ONE OF THEM IS STRUCTURAL. In a
 * ternary the two arms are siblings in one block, so the list's own position says which arm the
 * reader gets when it is empty and no name is needed — which is the whole point of reading what is
 * rendered instead of what it is called. In a pair of `&&` blocks there is no structural link at
 * all: `{xs.length > 0 && <ul/>}` and `{xs.length === 0 && <p/>}` are separate interpolations that
 * happen to test the same thing, and the subject's NAME is the only evidence that they are about
 * each other. Reading only the first would report six lists this console does answer.
 */
export function answered(markup: string, spans: ReadonlyArray<[number, number]>, list: ListRender): boolean {
  for (const [start, end] of spans) {
    if (list.at < start || list.at >= end) continue;
    const block = markup.slice(start, end);
    const t = ternary(block);
    if (t === null) continue;
    const here = list.at - start;
    const sibling = here > t.c ? block.slice(t.q + 1, t.c) : here > t.q ? block.slice(t.c + 1) : "";
    if (sibling !== "" && speaks(sibling)) return true;
  }

  const escaped = list.subject.replace(/[.]/g, "\\.");
  const emptyIsTrue = new RegExp(String.raw`(?:${escaped}\.length\s*===\s*0|!\s*${escaped}\.length)`);
  for (const [start, end] of spans) {
    const block = markup.slice(start, end);
    if (!emptyIsTrue.test(block)) continue;
    const t = ternary(block);
    if (t === null ? speaks(block) : speaks(block.slice(t.q + 1, t.c))) return true;
  }
  return false;
}

/** Every console page, as its route and its source. */
export function consolePages(root: string): Array<{ route: string; source: string }> {
  const out: Array<{ route: string; source: string }> = [];
  for (const full of filesUnder(path.join(root, "app/console"))) {
    if (!full.endsWith("page.tsx")) continue;
    const rel = full.slice(root.length + 1).split(path.sep).join("/");
    out.push({
      route: `/${rel.slice("app/".length, -"/page.tsx".length)}`,
      // LITERALS KEPT, COMMENTS SUBTRACTED. The words this register looks for ARE literals —
      // the text between tags and the copy constants a page interpolates — so blanking them would
      // leave every empty state looking like silence. Comments go because this tree explains its
      // pages in prose beside them, and a `//` note describing an empty state is not one.
      source: prepareForScan(readFileSync(full, "utf8"), { comments: "subtracted", literals: "kept" }),
    });
  }
  return out;
}

/** Every zero a reader can meet on this console, and how the page renders it. */
export function renderedZeros(root: string): RenderedZero[] {
  const out: RenderedZero[] = zeroSites(root).map((s) => ({
    route: s.route,
    subject: s.expression,
    renderedAs: "number" as const,
  }));
  for (const { route, source } of consolePages(root)) {
    const markup = markupOf(source);
    const spans = blockSpans(markup);
    for (const list of listRenders(source, markup)) {
      out.push({
        route,
        subject: list.subject,
        renderedAs: answered(markup, spans, list) ? "empty_state" : "silent",
      });
    }
  }
  return out.sort((a, b) => `${a.route}${a.subject}`.localeCompare(`${b.route}${b.subject}`));
}

/** `route :: subject` for every list that renders nothing and says nothing. */
export function silentZeros(root: string): string[] {
  return renderedZeros(root)
    .filter((z) => z.renderedAs === "silent")
    .map((z) => `${z.route} :: ${z.subject}`);
}

/**
 * Every zero W361's population cannot hold, which is the gap its bound named.
 *
 * The check that makes this unit's claim measured rather than asserted: a register that widened the
 * population without widening the ANSWER would look exactly like one that closed the gap.
 */
export function beyondNamedCounts(root: string): string[] {
  const named = new Set(zeroSites(root).map((s) => `${s.route} :: ${s.expression}`));
  return renderedZeros(root)
    .filter((z) => z.renderedAs !== "number")
    .map((z) => `${z.route} :: ${z.subject}`)
    .filter((key) => !named.has(key));
}

/** A list that renders nothing when it is empty, with what the reader gets instead. */
export interface SilentList {
  route: string;
  subject: string;
  /** What is on the screen in its place, and whether that is enough. */
  what: string;
}

/**
 * The silent zeros this console holds, each argued.
 *
 * A NAMED LIST AND NOT A COUNT, which is W290's rule and the reason it is worth having: a page
 * that grows a tenth silent list has to arrive in a diff somebody reads, and a page that gains an
 * empty state has to leave one. Every row here says what the reader sees instead, because "the
 * list is empty and the page says nothing" is not the same finding in a table with column headings
 * as it is in a section with a heading and then whitespace.
 */
export const SILENT_AT_W384: readonly SilentList[] = [
  {
    route: "/console/dashboard",
    subject: "data.weekly",
    what: "A table body. The reader gets the column headings — Invite / 1,000, Holdout / 1,000, Incremental — above nothing, which names what WOULD be there without saying why it is not. The headings are the difference between this and a blank section, and they are not an answer: a practice whose weekly rows have not been computed yet and one whose trial has produced no weeks read identically.",
  },
  {
    route: "/console/founder",
    subject: "rulings",
    what: "An ordered list of rulings the founder has made. The paragraph above it does answer a zero — `loopAnswers.length === 0 ? noDecider : loopAnswersSome` — but about a DIFFERENT subject, so nothing on the page speaks to this one. In practice the two move together and the page reads correctly; the register cannot see that, and neither can a reader who meets the empty list first.",
  },
  {
    route: "/console/founder",
    subject: "unblocking",
    what: "The gates a ruling would unblock, inside a section whose own heading and intro copy already say that nothing is blocked. The words are there and they are an ANCESTOR rather than a sibling arm, which is the shape this derivation cannot read: it asks what the other branch of a conditional renders, and there is no conditional here at all.",
  },
  {
    route: "/console/interop",
    subject: "view.cannotShow",
    what: "The limits of the page, under the heading `What this page cannot tell you`. It is built by the view rather than read from a practice and it has never been empty; if it were, the heading would be a question with no answer. Same shape as `unblocking` above — a heading is not a sibling arm.",
  },
  {
    route: "/console/ops",
    subject: "reading.causes",
    what: "The causes of a silence, rendered inside the arm that W179 built for exactly this: `reading.kind === \"none\"` IS the zero state, and this list is its content rather than a zero of its own. The sibling arm speaks, and it is the arm the reader gets when there is something to show — which is the opposite of what this check looks for, so the structural reading passes it over.",
  },
  {
    route: "/console/outreach",
    subject: "withheldReasons",
    what: "A definition list of why messages were withheld, under a paragraph that says nothing is withheld without a reason on this list. Empty means nothing was withheld, which is good news the page does not deliver: the paragraph is about the RULE and the reader has to infer the state from an absence.",
  },
  {
    route: "/console/reporting",
    subject: "report.disclosure.published",
    what: "The figures a report published, in a list under the heading `Figures`. Empty means nothing cleared the disclosure threshold — a real finding about small numbers — and the page renders it as an absence beside a heading.",
  },
  {
    route: "/console/reporting",
    subject: "report.disclosure.suppressed",
    what: "The figures suppressed for being too small, rendered into the same list as the published ones. Empty is the ordinary case for a practice with enough of everything, and it is indistinguishable here from a report that has not been computed.",
  },
];

export interface SilentDiff {
  /** A list that renders nothing, says nothing, and nobody declared. */
  undeclared: string[];
  /** A declaration for a list that now speaks, or that the console no longer renders. */
  stale: string[];
}

/** Both directions, so a silent zero cannot arrive quietly and a fixed one cannot stay declared. */
export function silentDiff(root: string, declared: readonly SilentList[] = SILENT_AT_W384): SilentDiff {
  const found = new Set(silentZeros(root));
  const names = new Set(declared.map((d) => `${d.route} :: ${d.subject}`));
  return {
    undeclared: [...found].filter((k) => !names.has(k)).sort(),
    stale: [...names].filter((k) => !found.has(k)).sort(),
  };
}

export const RENDERED_BOUND =
  "A SIBLING ARM IS NOT THE ONLY PLACE WORDS CAN BE. This reads the conditional a list sits in and " +
  "the `&&` block that tests the same subject, and it reads nothing above either — so a section " +
  "whose HEADING answers the emptiness reads as silent here, which several of the declared rows are. " +
  "Widening it to ancestors is not a fix: every page has an `<h1>`, and a rule that counted one " +
  "would call every list answered. What would settle it is a reading of whether the words are " +
  "ABOUT the subject, which is a question about meaning rather than about markup. SECOND, IT ASKS " +
  "WHETHER THE PAGE SPEAKS AND NOT WHETHER IT IS RIGHT. An empty state saying `Nothing yet` when " +
  "the truth is that a cycle has not run passes here and is exactly the confusion W361 exists to " +
  "name; the registers are about different halves and neither checks the other's. THIRD, THE " +
  "POPULATION IS A LIST RENDER AND A COUNT, so a zero rendered as a chart, a progress bar, a " +
  "disabled control or an empty form is in neither register. FOURTH, THE EXCLUSIONS ARE " +
  "STRUCTURAL AND ONE OF THEM IS A GUESS: a subject rooted at a module constant cannot be empty, " +
  "a subject rooted at another `map`'s parameter belongs to its row — both derived — but a `map` " +
  "ending in `join` is taken as a string on the strength of that one call, and a helper that " +
  "joined somewhere else would be read as rendering rows.";

// W278: the copy W200 cannot see.
//
// W200's own header states the bound this unit closes: *"this register reaches EXPORTED copy.
// Prose composed inline inside a render function — `search.ts`'s 'Ordered by …' is the clearest
// case — is not reachable by export name, and each entry's `notCopy` is where that has to be said
// out loud until a later unit lints rendered output against fixtures."* That later unit is this
// one, and the bound has been stated for seventy-eight units.
//
// The gap is exact rather than vague. `orderingBasis()` composes the sentence a patient reads
// under a list of clinicians — *"This is not a ranking and not a recommendation"* — and W200 lints
// `ORDERING`, the array it is built from, because that is the export. The sentence itself is
// inside the function body, so no register that iterates exported VALUES has ever seen it.
//
// EIGHTEEN FUNCTIONS COMPOSE PROSE THIS WAY, and they are found rather than listed: a function is
// composing when its body holds a literal of five or more words. That detector is the whole reason
// this register cannot quietly go stale — a nineteenth arrives failing, exactly as W200's own
// header-derived membership works, and a hand-kept list of eighteen covers the eighteen somebody
// remembered.
//
// TWO CHECKS, AND THE SECOND IS BOUNDED, WHICH IS STATED RATHER THAN GLOSSED:
//
//   1. EVERY prose literal in EVERY composing function is linted. Mechanical, complete, and it is
//      what catches "a string added to a render function and to no export" on the day it lands.
//   2. A SUBSET is driven with real inputs and the RENDERED output linted — literals plus the data
//      interpolated between them. Five of the eighteen, because those five have inputs that can be
//      constructed honestly. The other thirteen take assembled reports, graphs and audit exports,
//      and a fabricated `AgreementReport` would be a fixture testing my idea of one. `FIXTURE_BOUND`
//      says so, and the remedy is the module's own test fixtures, which is a different unit's work.
//
// Check 1 is the one with teeth and check 2 is the one that proves interpolation does not smuggle
// anything past it — a render that reads `Ranked by ${basis}` has no offending literal at all.
//
// FOUNDER GATE (plan §4): nothing here renders a patient. The fixtures are refusal paths and
// declared vocabulary, which is what these functions say when they have nothing to report.

import { readFileSync } from "node:fs";
import path from "node:path";
import { OPERATOR_COPY_SURFACES } from "./cdss-boundary";
import { prepareForScan } from "@/quality/scan-text";

/**
 * A literal that reads like a sentence: five or more space-separated words.
 *
 * Words rather than characters, because the thing being separated from copy is an identifier —
 * `"acceptingNewPatients"` is long and `"clinicians taking new patients first"` is prose, and only
 * a word count tells them apart.
 */
const PROSE_LITERAL = /["'`][^"'`\n]*?(?:[A-Za-z]+ ){4,}[^"'`\n]*?["'`]/g;

const COMPOSING_SIGNATURE = /^export function ([A-Za-z0-9_]+)\([^)]*\):\s*string(?:\[\])?\b/;

export interface ComposingFunction {
  module: string;
  fn: string;
}

/** The body of a top-level function, from its signature to the next line starting at column 0. */
function bodyOf(lines: readonly string[], start: number): string {
  let end = start + 1;
  while (end < lines.length && !/^\}/.test(lines[end]!)) end += 1;
  // Comments stripped so prose ABOUT a sentence is not counted as the sentence — W198's collision,
  // which every scan in this tree has had to subtract. W302 retired the inline pair that used to
  // sit here: literals are KEPT, because a literal is exactly what this scan is looking for.
  return prepareForScan(lines.slice(start, end).join("\n"), { literals: "kept" });
}

/**
 * Every function in a declared copy surface that composes prose inside its body.
 *
 * Found from the tree rather than declared, so the register below is checked against it in both
 * directions and a nineteenth arrives failing.
 */
export function composingFunctions(root: string): ComposingFunction[] {
  const out: ComposingFunction[] = [];
  for (const surface of OPERATOR_COPY_SURFACES) {
    const lines = readFileSync(path.join(root, surface.module), "utf8").split("\n");
    lines.forEach((line, index) => {
      const match = COMPOSING_SIGNATURE.exec(line);
      if (!match) return;
      const body = bodyOf(lines, index);
      PROSE_LITERAL.lastIndex = 0;
      if (PROSE_LITERAL.test(body)) out.push({ module: surface.module, fn: match[1]! });
    });
  }
  return out.sort((a, b) => `${a.module}::${a.fn}`.localeCompare(`${b.module}::${b.fn}`));
}

/** Every prose literal inside one composing function, as text to lint. */
export function proseLiteralsIn(root: string, site: ComposingFunction): string[] {
  const lines = readFileSync(path.join(root, site.module), "utf8").split("\n");
  const index = lines.findIndex((line) => COMPOSING_SIGNATURE.exec(line)?.[1] === site.fn);
  if (index === -1) return [];
  const body = bodyOf(lines, index);
  PROSE_LITERAL.lastIndex = 0;
  return [...body.matchAll(PROSE_LITERAL)].map((m) => m[0].slice(1, -1));
}

export interface ComposedSite {
  module: string;
  fn: string;
  /** What it composes, and for whom. A site nobody can describe is one nobody classified. */
  composes: string;
}

/**
 * The eighteen, declared.
 *
 * Declared as well as detected because "which of these is operator copy" is a claim somebody has
 * to make: the detector finds functions that hold sentences, and a sentence in a function is not
 * automatically something a practice reads. Both directions against `composingFunctions`.
 */
export const COMPOSED_COPY_SITES: readonly ComposedSite[] = [
  { module: "src/capacity/backtest.ts", fn: "renderScore", composes: "What a backtest scored, for a practice manager reading whether the forecast held up." },
  { module: "src/capacity/console.ts", fn: "renderReading", composes: "One session's recorded reading, including the sessions the record cannot answer for." },
  { module: "src/capacity/copy-lint.ts", fn: "renderCompliantCapacityCopy", composes: "The reference wording capacity copy is linted against — copy about copy, and read by whoever writes the next surface." },
  { module: "src/capacity/coupling.ts", fn: "renderCoupling", composes: "What a coupling between capacity and outreach would do, on a page describing a switch nobody has flipped." },
  { module: "src/capacity/forecast.ts", fn: "renderForecast", composes: "A range and its basis, or the refusal — the sentence W223 exists to keep in the past tense." },
  { module: "src/capacity/opening.ts", fn: "renderOpening", composes: "A suggested session opening, or every refusal that stopped one." },
  { module: "src/directory/fees.ts", fn: "feeCaveat", composes: "The caveat under a fee, worded to say what a fee is not without using the words the linter bans." },
  { module: "src/directory/search.ts", fn: "orderingBasis", composes: "The sentence under a list of clinicians saying the order is not a ranking. W200's own named example." },
  { module: "src/interop/disclosure-ledger.ts", fn: "renderDisclosure", composes: "What left the practice, for whoever has to answer what was disclosed and when." },
  { module: "src/outcomes/agreement.ts", fn: "renderAgreementReport", composes: "Specialist-agreement sampling, phrased as a statement about reviewed cases rather than about care." },
  { module: "src/outcomes/attribution-v2.ts", fn: "renderAttributionV2", composes: "What can and cannot be attributed, which is mostly a list of what the record does not support." },
  { module: "src/outcomes/audit-export.ts", fn: "renderAuditExport", composes: "The audit export a practice hands to somebody else, so its wording travels furthest of any here." },
  { module: "src/outcomes/dashboard.ts", fn: "describeAsk", composes: "What a settlement is waiting on, in words rather than an event code." },
  { module: "src/outcomes/response-graph.ts", fn: "renderResponseGraph", composes: "The response graph as prose, over a rail on which nothing has ever been sent." },
  { module: "src/outcomes/time-to-escalation.ts", fn: "renderTimeToEscalation", composes: "Time-to-escalation figures with their basis, or the refusal to give one." },
  { module: "src/quality/declaration-tax.ts", fn: "consolidationDefects", composes: "One line per way W305's consolidation claim fails for a module — the manifest not holding its declaration, or a file the manifest replaced still holding one. Developer-facing, and it names the file rather than describing it, because the remedy is to move the declaration." },
  { module: "src/quality/blind-spots.ts", fn: "falseBounds", composes: "One line per register that reports the shape its stated bound says it cannot see, which means the sentence is false. Developer-facing; the line names the register, because the remedy is to rewrite that register's bound rather than to change anything the register does." },
  { module: "src/quality/blind-spots.ts", fn: "deadProbes", composes: "One line per demonstration whose positive control went unseen — a planted tree the detector could not read, so the silence beside it proved nothing. Developer-facing, and phrased to distinguish it from a false bound, because the two failures have opposite remedies." },
  { module: "src/quality/tautology-sweep.ts", fn: "brokenAcceptances", composes: "One line per acceptance that has stopped being true — a hit the sweep no longer finds, or a test that has lost the `@ts-expect-error` its acceptance rests on. Developer-facing; the sentence names which of the two happened, because the remedies are opposite (delete the acceptance, or restore the compile-time assertion)." },
  { module: "src/quality/page-suite.ts", fn: "pageSuiteViolations", composes: "One line per way the gate has stopped covering the rendered surface — a verify script that no longer chains the suite, a filter in a script or the config, an exclusion with no reason. Developer-facing; the sentences exist so the failure names what to remove." },
  { module: "src/quality/unit-headers.ts", fn: "headerViolations", composes: "One line per module the header door refuses, naming the module and the unit it claims. Developer-facing throughout; it is here because W278's detector finds composing functions rather than being told about them, and a register that exempted the ones nobody renders would be back to a hand-kept list." },
  { module: "src/reporting/report.ts", fn: "renderPracticeReport", composes: "The practice report — the surface a PHN would read if G9 were ever ratified." },
  { module: "src/verticals/completeness.ts", fn: "renderCompletenessReport", composes: "What stands between a vertical and shipping, decomposed by the act outstanding and who must do it." },
  { module: "src/verticals/scale.ts", fn: "orderDependence", composes: "Whether a vertical's assembly depends on the order its members arrived in." },
];

/**
 * Why the rendered half covers five of eighteen, stated rather than left to be noticed.
 *
 * W237's rule: the thing a check does NOT reach is written on the check, because a green result
 * over five is read as a green result over eighteen by anybody who does not count.
 */
export const FIXTURE_BOUND =
  "Five sites are driven with real inputs. The rest take assembled reports, response graphs and audit exports, and constructing one by hand would produce a fixture that tests this author's idea of an `AgreementReport` rather than the one the tree builds — which is the fabricated-fixture failure W234 recorded. Every site is still covered by the literal sweep, which is the check with teeth; what the undriven ones lack is the interpolation half. The remedy is to reach the modules' own test fixtures rather than to invent new ones, and that is a different unit's work. (W288 removed the totals this sentence used to carry. It counted the register in words, the test pinned the phrase rather than comparing it to the register's length, and the sentence was wrong within two units of being written while the suite stayed green. The total lives in `COMPOSED_COPY_SITES`, where the suite reads it.)";

export interface AcceptedComposedFinding {
  module: string;
  fn: string;
  rule: string;
  /** The exact matched string. Per-match, so an acceptance cannot cover a second occurrence. */
  match: string;
  why: string;
  reviewBy: string;
}

/**
 * Advice-rule findings in composed copy that are accepted rather than reworded.
 *
 * W200's shape exactly — per module, per site, per rule, per matched string, with a date — and for
 * W200's reason: the same words mean different things on different surfaces, so the rule stays
 * sharp and the exception is narrow. Checked in BOTH directions by the test: an acceptance for a
 * finding the sweep no longer produces is stale, and a stale acceptance reads as coverage while
 * quietly permitting something else.
 */
export const ACCEPTED_COMPOSED_FINDINGS: readonly AcceptedComposedFinding[] = [
  {
    module: "src/verticals/completeness.ts",
    fn: "renderCompletenessReport",
    rule: "no-benefit-claims",
    match: "specialist",
    why: "\"Knowing a pathway is not usable does not say whether a specialist has looked.\" The rule bans `specialist` because on a patient-facing or public surface it is a claim about somebody's standing — Ahpra restricts the title, and the venture brief's own law is that it never appears next to a niche scope. Here it names a ROLE IN W119'S SIGN-OFF WORKFLOW, on a report addressed to whoever is assembling a vertical: G5 requires a specialist review and then a founder sign-off, and the report is saying which of the two has not happened. There is no clinician being described and no reader who could take it as a credential. Rewording it to \"reviewer\" would make the report ambiguous about which of the two stages is outstanding, which is the one thing it exists to say.",
    reviewBy: "2027-02-14",
  },
];

/** Findings with no acceptance. The list this unit exists to keep empty. */
export function unacceptedComposed(
  findings: readonly { module: string; fn: string; rule: string; match: string }[],
  accepted: readonly AcceptedComposedFinding[] = ACCEPTED_COMPOSED_FINDINGS,
): typeof findings {
  return findings.filter(
    (f) =>
      !accepted.some(
        (a) => a.module === f.module && a.fn === f.fn && a.rule === f.rule && a.match === f.match,
      ),
  );
}

/**
 * Ways of writing this that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly narrowing the sweep.
 */
export const REFUSED_COMPOSED_SHAPES: Readonly<Record<string, string>> = {
  a_hand_kept_list:
    "Declaring the eighteen and checking nothing against the tree. W200 found exactly this wrong with W150's registry — a hand-kept list of nine modules covers the nine modules somebody remembered — and the fix there was to read membership off the tree. The detector finds composing functions; the register says which are copy; neither is trusted alone.",
  counting_characters_instead_of_words:
    "Treating a long literal as prose. `\"acceptingNewPatients\"` is nineteen characters of identifier and `\"clinicians taking new patients first\"` is prose, and only a word count separates them. Five words, because four admits key names written as sentences.",
  scanning_the_comments_too:
    "Linting a function's body without subtracting its comments. Every scan in this tree has had to: the prose most likely to quote a banned construction is the paragraph explaining why the construction is banned, which is W198's collision and has now recurred nine times.",
  fixtures_invented_to_reach_a_number:
    "Fabricating an `AgreementReport` so all eighteen have a rendered check. It would test this author's idea of the type rather than the one the tree builds, and a green run over invented inputs reads exactly like a green run over real ones. Five real fixtures and a stated bound beats eighteen invented ones.",
  the_literal_sweep_alone:
    "Linting the literals and stopping. A render that reads `Ranked by ${basis}` contains no offending literal at all — the offence appears only once the pieces are joined, which is why five of them are actually called.",
  an_acceptance_without_a_date:
    "Accepting a finding and moving on. W210's rule: a recorded exception with no review date is one nobody looks at again, and this tree has the receipt — a finding sat for two years. Every acceptance carries a date and the test checks it is in the future of the finding.",
  claiming_w200_is_now_complete:
    "Reading this as closing W200's bound entirely. It closes the bound for functions RETURNING copy in declared copy surfaces. Prose composed inside a React component's JSX is still unreachable by either register, and that is the next boundary rather than this one.",
};

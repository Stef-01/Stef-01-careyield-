// W361: the console says which of its zeroes is a measurement.
//
// A NUMBER ON A CONSOLE PAGE IS A CLAIM, AND A ZERO IS THREE DIFFERENT CLAIMS WEARING ONE FACE.
// `0 would be invited` can mean the simulation ran over the practice's whole list and nobody was
// eligible — a measurement, and a finding somebody should act on. It can mean the cycle that fills
// the list has not run yet, so the number is about the calendar rather than the practice. Or it
// can mean nobody has been asked at all, so there is nothing to count and never was. Those are
// three different next actions, and the digit is identical in all three.
//
// W279 SPLIT THE OTHER AXIS AND SAID SO. Its three states — `nothing_yet`, `nothing_arrived`,
// `could_not_load` — are about whether an empty read is REAL: did the practice do nothing, or did
// nothing reach us, or did the read fail. That is a question about the pipe. This is a question
// about the number: given that the read worked and the answer really is zero, is the zero a
// finding? A page can be right about W279's axis and still tell a reader the wrong thing.
//
// W346 BUILT THE MECHANISM FOR ONE OF THE THREE and stopped there, correctly: `<Waiting>` says a
// cycle has not run, on the two pages whose day-two zero is a wait. What was missing is the
// question asked of every rendered count rather than of two pages — which is how W346's own
// finding was found, and it is the shape this quarter keeps producing.
//
// THE POPULATION IS DERIVED FROM THE PAGES, not listed: every count a console page renders into
// its own markup. A site that arrives with a new page joins without anybody editing this file, and
// a row whose expression the page no longer renders fails — because a classification of a number
// nobody shows is a sentence about a screen that does not exist.
//
// WHAT THIS DOES NOT PROVE is `ZERO_MEANING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Operator copy and page source; no patient is addressed
// and no clinical claim is made or read.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { filesUnder } from "@/quality/tree-walks";
import { WAITING_PATH } from "@/demo/path";

/** The component W346 built to say a cycle has not run. */
export const WAITING_NOTICE = "<Waiting";

/** How a page says it in its own words instead — W346's `WAITING_ELSEWHERE`, as a phrase. */
export const NOT_RUN_PHRASE = /not (?:yet )?(?:been )?(?:run|counted|computed)|has not (?:run|happened)|first cycle/i;

/** A count a console page renders into its markup. */
export interface ZeroSite {
  /** The route, as `discoverSurfaces` spells it. */
  route: string;
  /** The expression the page interpolates — its own text, so a rename is visible. */
  expression: string;
}

/**
 * Every count a console page renders.
 *
 * READ OUT OF THE MARKUP RATHER THAN OFF THE MODEL, which is the only place the question can be
 * asked: a model that computes fifty figures and renders three has three zeroes a reader can
 * misread. The shape is an interpolation whose expression ends in a counting name — `.length`,
 * `.size`, `.total`, or a `count`-suffixed field — because that is what this tree writes when it
 * puts a number on a screen, and `ZERO_MEANING_BOUND` says what that misses.
 */
export function zeroSites(root: string): ZeroSite[] {
  const out: ZeroSite[] = [];
  for (const full of filesUnder(path.join(root, "app/console"))) {
    if (!full.endsWith("page.tsx")) continue;
    const rel = full.slice(root.length + 1);
    const route = `/${rel.slice("app/".length, -"/page.tsx".length)}`;
    const source = markupOf(stripComments(readFileSync(full, "utf8")));
    const seen = new Set<string>();
    for (const chunk of interpolations(source)) {
      for (const match of chunk.matchAll(COUNTING_NAME)) {
        const expression = match[1]!;
        if (!isRendered(chunk, match.index!, expression)) continue;
        if (seen.has(expression)) continue;
        seen.add(expression);
        out.push({ route, expression });
      }
    }
  }
  return out.sort((a, b) => `${a.route}${a.expression}`.localeCompare(`${b.route}${b.expression}`));
}

/** What this tree calls a number when it renders one. */
const COUNTING_NAME = /\b([A-Za-z_$][\w$.]*(?:\.length|[Cc]ount|\.size|\.total))\b/g;

const COMPARISON = /^\s*(?:===|!==|==|!=|>=|<=|>|<)/;

/**
 * The part of a page file that is MARKUP, from its first `return (` onward.
 *
 * A brace is not a JSX interpolation just because it is a brace. `import { readCount } from …` and
 * `const { counts } = row` both matched before this narrowing, which put a function name and a
 * destructuring into the population as though a reader could see them. Cutting at the first
 * `return (` keeps every helper component's markup — those render too — and drops the imports and
 * the derivations above it, which is a position this scan can read rather than a guess about what
 * a brace means.
 */
function markupOf(source: string): string {
  const at = source.indexOf("return (");
  return at === -1 ? "" : source.slice(at);
}

/**
 * Whether this occurrence of a count is ON THE SCREEN or only deciding what goes there.
 *
 * THE DISTINCTION IS THE POPULATION. `{entries.length === 0 ? "Nothing yet" : <List/>}` reads a
 * count and renders no number; the reader never sees a zero and there is nothing to misinterpret.
 * `{counted ? counts.memberCount : NOT_RUN_COPY}` renders one. Taking every count in every
 * interpolation gave more than twice as many sites as the console renders numbers, and a register
 * of arguments about non-events is a register nobody reads — the superset W353 named, arriving as
 * prose rather than as a wrong answer.
 */
function isRendered(chunk: string, at: number, expression: string): boolean {
  const after = chunk.slice(at + expression.length);
  const before = chunk.slice(0, at);
  if (COMPARISON.test(after)) return false;
  if (/(?:===|!==|==|!=|>=|<=|>|<)\s*$/.test(before)) return false;
  return true;
}

/**
 * Every interpolation a page's markup RENDERS, brace-matched rather than pattern-matched.
 *
 * IT HAS TO BE BRACE-MATCHED, and W361 learned that from its own first fix: the registers page put
 * its count behind a ternary and the bare-`{expr}` scan stopped seeing it, so the register reported
 * the row stale rather than the page changed. A count inside a conditional is still a count on a
 * screen. An ATTRIBUTE is not — `defaultValue={assumptions.gpCount}` puts a number in a form field
 * the reader typed it into — so an interpolation preceded by `=` is skipped, which is a position
 * this scan can read rather than a judgement about markup.
 */
function interpolations(source: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== "{") continue;
    if (source[i - 1] === "=") continue;
    let depth = 0;
    let j = i;
    for (; j < source.length; j += 1) {
      if (source[j] === "{") depth += 1;
      else if (source[j] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) continue;
    out.push(source.slice(i + 1, j));
    i = j;
  }
  return out;
}

/**
 * What a zero at this site would mean.
 *
 * FOUR KINDS, AND THE FOURTH IS THE ONE THAT KEEPS THE OTHER THREE HONEST. A count that is not a
 * statement about the practice at all — a module constant, a number the reader typed in, a detail
 * of a row already on the screen — is not a zero anybody reads as a finding, and folding it into
 * `measured` would make that class mean nothing.
 */
export type ZeroMeaning =
  /** The rail answered and the answer is none. A finding, and the reader should act on it. */
  | { kind: "measured"; how: string }
  /** Zero because a cycle has not run. The page must say so — W346's notice is the mechanism. */
  | { kind: "waiting"; how: string }
  /** Zero because nobody has been asked. About what has not been started, not what was found. */
  | { kind: "unasked"; how: string }
  /** Not a claim about the practice. Argued, so the class cannot become a bin. */
  | { kind: "not_a_finding"; why: string };

export interface ZeroClaim {
  route: string;
  expression: string;
  meaning: ZeroMeaning;
}

export interface ZeroDefect {
  site: string;
  what: string;
}

/**
 * Every count this console renders, and what a zero there would mean.
 *
 * ONE ROW PER SITE rather than per page: `/console/outreach` renders two, and they are opposite
 * halves of one simulation — "would be invited" and "would not be" cannot share a sentence about
 * what their zeroes mean, because a zero in the first is a practice with nobody eligible and a
 * zero in the second is a practice withholding from nobody.
 */
export const ZERO_CLAIMS: readonly ZeroClaim[] = [
  {
    route: "/console/complaints",
    expression: "open.length",
    meaning: {
      kind: "measured",
      how: "Complaints are entered on this console by practice staff, so the store holds every one there has ever been and nothing arrives from elsewhere. Zero open is a measurement over a complete population: there are none outstanding. It is the clearest `measured` on the console and it is here as the reference case for the class.",
    },
  },
  {
    route: "/console/education",
    expression: "curation.ordered.length",
    meaning: {
      kind: "not_a_finding",
      why: "A DENOMINATOR, rendered as `{position} of {total}` beside one item in a list the reader is already looking at. It cannot be zero while the element it sits inside is rendered — there is no position in an empty list — so there is no zero here for anybody to interpret.",
    },
  },
  {
    route: "/console/founder",
    expression: "shape.weekUnits.length",
    meaning: {
      kind: "measured",
      how: "The blocked surface split by row kind, derived from the ledger W347 reads. Zero week-units blocked is a measurement over the whole ledger and a real finding for the one reader this page has: nothing is waiting on a founder ruling. The page renders the ids beside the count, so the zero comes with its own evidence.",
    },
  },
  {
    route: "/console/founder",
    expression: "shape.otherRows.length",
    meaning: {
      kind: "measured",
      how: "The same derivation for the rows that are not week-units — the halves W347 exists to keep apart. Zero here is a measurement with the same standing as its twin, and it is a separate row because the two counts are about different populations and could move independently.",
    },
  },
  {
    route: "/console/founder",
    expression: "ruling.releases.length",
    meaning: {
      kind: "measured",
      how: "How many release paths a ruling would unblock, derived from `RELEASE_PATHS`. Zero means the gate blocks nothing that is waiting — which is exactly the finding W347 built the section for, and the page states it in words beside the figure rather than leaving the digit to argue.",
    },
  },
  {
    route: "/console/interest",
    expression: "signups.length",
    meaning: {
      kind: "unasked",
      how: "Unique registrations from the public interest form. Zero means nobody has registered, and until the form has been PUT anywhere that is a statement about reach rather than about demand — the practice has asked nobody. This is the one route whose read can also fail, which is W279's axis and W287's correction: `could_not_load` is about whether the zero is real, and this row is about what a real zero means.",
    },
  },
  {
    route: "/console/ops",
    expression: "queue.outstanding.length",
    meaning: {
      kind: "measured",
      how: "Offers made and not yet answered, over the rail this practice sends on. Zero is a measurement — nothing is outstanding — and the page renders the silence causes beside it, so a reader who needs W179's other question has it on the same screen.",
    },
  },
  {
    route: "/console/outcomes",
    expression: "summary.total",
    meaning: {
      kind: "waiting",
      how: "The referral count this page's whole summary is over, and W346's day-two case: on a practice that finished setup this week the rail is empty because no cycle has run, not because the practice refers nobody. `/console/outcomes` is in `WAITING_PATH` and the page renders the notice, which is what makes this zero legible rather than damning.",
    },
  },
  {
    route: "/console/outcomes",
    expression: "outcome.evidence.length",
    meaning: {
      kind: "not_a_finding",
      why: "Events behind one outcome row, rendered inside that row. The page already writes `No event` for the zero case in the same expression, so the digit never appears as a bare zero — and a row with no evidence is a fact about one referral rather than about the practice.",
    },
  },
  {
    route: "/console/outreach",
    expression: "plan.send.length",
    meaning: {
      kind: "measured",
      how: "W12's simulation ran over the practice's own list against its own rules, and this is who it would invite. Zero is a measurement and an important one: nobody is eligible today. It is not a wait — the simulation answers on a practice that has just finished setup, which is what makes `/console/outreach` a `nothing_yet` route in W279's register and not a `WAITING_PATH` one here.",
    },
  },
  {
    route: "/console/outreach",
    expression: "plan.withheld.length",
    meaning: {
      kind: "measured",
      how: "The other half of the same run: who the rules held back and why. Zero withheld is a measurement about the RULES rather than about the patients — nothing was excluded — and reading it as 'nothing to do' would be the opposite of what it says.",
    },
  },
  {
    route: "/console/pathways",
    expression: "signedCount",
    meaning: {
      kind: "unasked",
      how: "Pathway versions signed off. Zero is not a measurement of quality and not a wait for a cycle: nothing has been signed because signing needs a clinician to be asked, and W127's whole point is that the page SAYS this rather than rendering an empty table. The denominator beside it is what stops the zero reading as 'no pathways exist'.",
    },
  },
  {
    route: "/console/pathways",
    expression: "rows.length",
    meaning: {
      kind: "not_a_finding",
      why: "The denominator in `{signedCount} of {rows.length}`. Pathway versions ship with the product, so this is a statement about what is installed rather than about the practice, and it is not zero in any tree that has a register to show. It is here because the count IS rendered and W361's rule is that every rendered count is classified, including the ones that are not findings.",
    },
  },
  {
    route: "/console/pathways",
    expression: "row.version.criteria.inclusion.length",
    meaning: {
      kind: "not_a_finding",
      why: "Criteria counts inside one pathway row — rendered as counts precisely so the criteria themselves are not, which is the founder gate this page is built around. Zero inclusion criteria is a fact about one version's content, on a row the reader is already reading, and the practice cannot act on it.",
    },
  },
  {
    route: "/console/pathways",
    expression: "row.version.criteria.exclusion.length",
    meaning: {
      kind: "not_a_finding",
      why: "The same, for exclusion criteria. Named separately rather than folded in, because three counts sharing one excuse is how the second and third stop being read — and these three are the tree's own example of a gate rendered as arithmetic.",
    },
  },
  {
    route: "/console/pathways",
    expression: "row.version.criteria.escalation.length",
    meaning: {
      kind: "not_a_finding",
      why: "The same, for escalation criteria — and the one of the three where a zero would be worth somebody's attention clinically, which is exactly why it is NOT this register's business: a judgement about whether a pathway needs an escalation rule is clinical content, and W361 classifies what a number means to an operator.",
    },
  },
  {
    route: "/console/referrals",
    expression: "returned.count",
    meaning: {
      kind: "not_a_finding",
      why: "How many return reports were filed on one date for one referral, rendered only inside the amber notice that fires when there is more than one. The branch cannot render a zero, and the number is a fact about a single handover rather than about the practice. The page's own waiting zero is the referral list, which `<Waiting>` covers and which this scan does not reach because the list renders rows rather than a count.",
    },
  },
  {
    route: "/console/registers",
    expression: "counts.memberCount",
    meaning: {
      kind: "waiting",
      how: "How many patients are on one condition register. On a practice that finished setup this week this is zero because the register has not been RUN over the practice's list, not because nobody has the condition — the reading a clinician would take from it is the opposite of the truth. AND THE STORE CANNOT EVEN ANSWER: `seedCounts` has one caller in this tree and it is the e2e mock route, so `registersFor` returned the constant `NO_COUNTS` for every real practice and the page rendered it as a bold numeral. W361 made the store say whether anybody had ever asked, and the page now writes `Not counted yet` where it used to write a zero.",
    },
  },
  {
    route: "/console/registers",
    expression: "counts.gapCount",
    meaning: {
      kind: "waiting",
      how: "How many of those members are due by schedule. Same derivation, same wait, and the same misreading available: zero gaps on a register nobody has run reads as a practice with nothing outstanding. Recorded separately because a register CAN legitimately have members and no gaps, and that is a measurement — the two counts do not share a zero, and only the second of them will ever be one once a run exists.",
    },
  },
  {
    route: "/console/responses",
    expression: "kind.total",
    meaning: {
      kind: "measured",
      how: "Messages of one kind recorded in the period, and the page renders `null` rather than a digit when the total is withheld — which is the distinction that makes the zero a measurement: a suppressed total says so in words, so a rendered zero really is none. W196's floor is what makes the difference visible.",
    },
  },
  {
    route: "/console/dashboard",
    meaning: {
      kind: "not_a_finding",
      why: "How many synthetic patients the incrementality simulation ran over, rendered beside how many weeks it simulated. It is a statement about the SIMULATION's size, not about the practice — and this page's whole subject is a model rather than a rail, which is why W279's register gives `/console/dashboard` its zeros through the feed it reads rather than through this figure. A zero here would mean somebody configured a run with no patients.",
    },
    expression: "data.patientCount",
  },
  {
    route: "/console/responses",
    meaning: {
      kind: "measured",
      how: "One cell of the response table, rendered only when `cell.suppression === null` — the page writes `withheld` in its place otherwise. That branch is what makes the zero a measurement rather than a floor artefact: a suppressed cell says so in words, so a rendered zero really is none of that kind in the period. W196's floor is the mechanism and this is the count it protects.",
    },
    expression: "cell.count",
  },
  {
    route: "/console/results",
    meaning: {
      kind: "measured",
      how: "How many people opted out, rendered as a tile with its own denominator beside it — `N% of M messages`. Zero opt-outs over a real denominator is a measurement and a good one; zero over a zero denominator is the rail being empty, which the tile beside it shows. The denominator is what stops the tile reading as a claim about acceptance when nothing has been sent.",
    },
    expression: "r.optOut.count",
  },
  {
    route: "/console/setup/[step]",
    expression: "SETUP_STEPS.length",
    meaning: {
      kind: "not_a_finding",
      why: "A module constant, rendered as the denominator of `step N of M`. It cannot be zero while the tree has a setup wizard, and it says how long the wizard is rather than anything about the practice walking it.",
    },
  },
  {
    route: "/console/usefulness",
    expression: "pending.length",
    meaning: {
      kind: "measured",
      how: "Visits left to audit, rendered in the confirmation after one is saved. Zero means the queue is empty and the reader has finished — a measurement, and the one on this console whose zero is good news. It is reachable only after a save, which is why the count reads as progress rather than as an empty state.",
    },
  },
  {
    route: "/console/verticals",
    expression: "rows.length",
    meaning: {
      kind: "not_a_finding",
      why: "The denominator in `{shippable} of {rows.length} vertical(s) can be used`. Verticals ship with the product, so the figure is about what is installed rather than about the practice, and the numerator beside it is the one carrying the finding.",
    },
  },
  {
    route: "/console/verticals",
    expression: "row.count",
    meaning: {
      kind: "not_a_finding",
      why: "How many of one kind of outstanding item a vertical needs, rendered inside the list of what is outstanding. The branch only renders when the list is non-empty, so the zero is unreachable, and the number is a fact about one vertical's assembly rather than about the practice.",
    },
  },
];

/**
 * Where the register and the console disagree, in four directions.
 *
 * The last two are the cross-check with W346: a page claiming a zero is a WAIT must say so, and a
 * page W346 already put on the waiting path must have a wait among its counts. Either one alone
 * would let this register and W346's drift apart while both stayed green.
 */
export function zeroDefects(
  root: string,
  declared: readonly ZeroClaim[] = ZERO_CLAIMS,
  sites: readonly ZeroSite[] = zeroSites(root),
): ZeroDefect[] {
  const out: ZeroDefect[] = [];
  const key = (s: { route: string; expression: string }) => `${s.route} :: ${s.expression}`;
  const declaredKeys = new Set(declared.map(key));
  const siteKeys = new Set(sites.map(key));

  for (const site of sites) {
    if (!declaredKeys.has(key(site))) {
      out.push({ site: key(site), what: "renders a count and nothing says what a zero there would mean" });
    }
  }
  for (const claim of declared) {
    if (!siteKeys.has(key(claim))) {
      out.push({ site: key(claim), what: "is classified here and the page no longer renders it" });
    }
  }
  for (const claim of declared) {
    if (claim.meaning.kind !== "waiting") continue;
    const page = path.join(root, "app", claim.route.slice(1), "page.tsx");
    let source: string;
    try {
      source = readFileSync(page, "utf8");
    } catch {
      continue;
    }
    // TWO WAYS TO SAY IT, because the tree has two. `<Waiting>` is W346's shared notice, on the
    // pages whose wait is a named cycle; `WAITING_ELSEWHERE` records that other pages say it in
    // their own words, and this is the phrase-shaped half of that. A page saying neither is
    // rendering a number it has no basis for, which is the whole finding.
    const named = source.includes(WAITING_NOTICE) || NOT_RUN_PHRASE.test(source);
    if (!named) {
      out.push({ site: key(claim), what: "is called a wait and the page says nothing about a cycle" });
    }
  }
  // W346's routes, from the other side. Demanding a WAITING row on each would be wrong: a page can
  // tell its wait through a list rather than a count, and `/console/referrals` does exactly that —
  // its empty rail renders rows, so this scan sees only a per-referral detail there. What must hold
  // is the direction that would mislead: on a route W346 says is waiting on day two, no count may
  // be called a measurement, because a measurement is the reading that page exists to prevent.
  const waitingRoutes = new Set(WAITING_PATH.map((step) => step.route));
  for (const claim of declared) {
    if (claim.meaning.kind === "measured" && waitingRoutes.has(claim.route)) {
      out.push({
        site: key(claim),
        what: "is called a measurement on a route W346 says is waiting for its first cycle",
      });
    }
  }
  return out.sort((a, b) => `${a.site}${a.what}`.localeCompare(`${b.site}${b.what}`));
}

/** What this register does not prove. */
export const ZERO_MEANING_BOUND =
  "IT FINDS A COUNT BY THE NAME OF THE EXPRESSION THAT PRODUCES IT — `.length`, `.size`, " +
  "`.total`, a `count`-suffixed field — so a page that renders a number some other way is outside " +
  "the population entirely. `/console/referrals` is the live case and it is the awkward one: its " +
  "waiting zero is a LIST that renders rows, so the page's most important zero is invisible here " +
  "and is covered only because W346's own register holds the route. The remedy is a reading of " +
  "what a component renders rather than of what an expression is called, which is a judgement " +
  "about markup rather than a resolution of a name. THE CLASSIFICATION IS ARGUED, NOT DERIVED. " +
  "Nothing here computes whether a zero is a measurement; the rows say so and the checks resolve " +
  "the two things a source can answer — that the count is still rendered, and that a page calling " +
  "its zero a wait says so on the screen. A row that calls a wait a measurement passes, and the " +
  "only thing standing against it is that somebody wrote a sentence and somebody else can read " +
  "it. AND `not_a_finding` IS THE CLASS TO WATCH: it holds the most rows, every one of them for a " +
  "reason a reader could argue with, and the honest test of it is not this register's checks but " +
  "whether the next unit that renders a count reaches for it.";

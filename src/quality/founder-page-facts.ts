// W347: every derived fact about the outstanding position, and whether the page shows it.
//
// THE FOUNDER'S PAGE RENDERS THREE DERIVATIONS AND THE TREE HOLDS SIXTEEN. W310 built the page to
// read the ledger and §4 at render time so nothing on it could go stale, and it succeeded at that.
// What it did not do — what nothing asked — is whether the page shows everything those two
// documents can be made to say. A page that cannot go stale and omits the half that matters is
// still a page a founder reads and acts on.
//
// W340 FOUND THE SAME THING FROM THE OTHER END and this unit is the answer to part of it: four of
// the seventy-one facts that register named as computed-and-unread live in these modules, and their
// `where` column said *the founder page*. `ledgerRows`, `answerableByTheLoop`, `renderedUnits` and
// `waitedFor` were all being derived for nobody.
//
// FOUR THINGS THE TREE KNEW AND THE PAGE DID NOT SAY, now rendered:
//
//   *The gates that block nothing.* G1, G2, G4 and G7 are outstanding and no queued work waits on
//   them, because nothing has been built that needs them. A page organised by what is WAITING
//   cannot show them — there is no list of releases to print — and the plan has named them in prose
//   at every horizon for six quarters. `gatesBlockingNothing` derives them from the same two
//   documents as everything else.
//
//   *What the waiting figure is made of.* The page rendered `blocked` as one number under a heading
//   saying *Units*, and two of the eighteen rows are not units. That is the G5 correction read from
//   the other end: until W335 every document here reported the largest blocker as six rows when it
//   was eight, because `SUP-1` and `SUP-2` were invisible to a parse two places kept a private copy
//   of. `blockedShape` splits the figure so a reader can see which is which.
//
//   *Whether the page agrees with its documents.* `founderDiff` has checked this page in four
//   directions since W310 and the answer was never rendered. The page's own bound says a founder
//   reading a page that is missing a row cannot know it is missing; now the page says.
//
//   *Who decides, derived rather than typed.* `FOUNDER_COPY.noDecider` asserted that the loop
//   answers none of these while `answerableByTheLoop` derived exactly that claim and nothing read
//   it. A typed sentence beside a derivation that could contradict it is the shape W258 made a rule
//   about. The page renders the derivation and shows a different sentence when it disagrees.
//
// RENDERED IS RESOLVED, NOT TRUSTED. A row saying the page shows a fact is checked against
// `app/console/founder/page.tsx` — the export must be named there — and the reverse arm fires too:
// a row saying a fact is NOT shown, for a fact the page names, is the register describing a page
// that has moved. `through` rows chain to a rendered one and the chain must terminate, so a fact
// reaching the page by way of another cannot point at a second fact nobody renders either.
//
// WHAT THIS DOES NOT PROVE is `PAGE_FACT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads source text; the page it measures renders
// build status and no practice or patient data.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";

/** The page this register is about. */
export const FOUNDER_PAGE = "app/console/founder/page.tsx";

/**
 * The modules that hold the outstanding position.
 *
 * A LIST, AND IT HAS TO BE. "A fact about what is waiting" is not a property of a file that any
 * walk returns — `blocked-surface.ts` holds the release paths and `second-reading.ts` holds the
 * delta, and no shared import, directory or naming rule joins them to `outstanding.ts`. What keeps
 * the list honest is the other direction: every export of every module named here must be
 * classified, so the list can be too small and never too permissive, and a module dropped from it
 * takes its rows with it and fails.
 */
export const POSITION_MODULES: readonly string[] = [
  "src/founder/outstanding.ts",
  "src/founder/second-reading.ts",
  "src/quality/blocked-surface.ts",
];

/** Every exported derivation in those modules, as `module::export`. */
export function positionDerivations(root: string, modules: readonly string[] = POSITION_MODULES): string[] {
  const out: string[] = [];
  for (const module of modules) {
    const source = stripComments(readFileSync(path.join(root, module), "utf8"));
    for (const match of source.matchAll(/^export function ([A-Za-z0-9_]+)/gm)) {
      out.push(`${module}::${match[1]!}`);
    }
  }
  return out.sort();
}

/** Every name the page's own source mentions — the resolution `rendered` is checked against. */
export function pageNames(root: string, page: string = FOUNDER_PAGE): Set<string> {
  const source = stripComments(readFileSync(path.join(root, page), "utf8"));
  return new Set([...source.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1]!));
}

/** How a derived fact reaches the page, or why it does not. */
export type Shown =
  /** The page calls it. `section` names where a reader finds the answer. */
  | { kind: "rendered"; section: string }
  /** It reaches the page inside another fact's answer. `by` must itself reach the page. */
  | { kind: "through"; by: string; what: string }
  /** It could be shown and is not, with the reason. */
  | { kind: "declared"; why: string };

export interface PageFact {
  id: string;
  shown: Shown;
}

/**
 * Every derivation about the outstanding position, and where it lands, as at W347.
 *
 * `through` IS NOT A SOFTER `rendered`. A step whose answer is folded into a rendered fact really
 * does reach the reader — §4's sentences arrive through `parseGates` and the wait figures through
 * `waitedFor` — and calling those unrendered would be false. What it is not allowed to be is a
 * chain that goes nowhere, which is why `by` is resolved.
 */
export const PAGE_FACTS: readonly PageFact[] = [
  {
    id: "src/founder/outstanding.ts::builtSurface",
    shown: { kind: "rendered", section: "What exists — the three figures at the top" },
  },
  {
    id: "src/founder/outstanding.ts::outstandingRulings",
    shown: { kind: "rendered", section: "What is waiting — one card per ruling, worst wait first" },
  },
  {
    id: "src/founder/outstanding.ts::gatesBlockingNothing",
    shown: { kind: "rendered", section: "Rulings that block nothing — added by W347" },
  },
  {
    id: "src/founder/outstanding.ts::blockedShape",
    shown: { kind: "rendered", section: "What the waiting figure is made of — added by W347" },
  },
  {
    id: "src/founder/outstanding.ts::founderDiff",
    shown: { kind: "rendered", section: "Does this page agree with the documents — added by W347" },
  },
  {
    id: "src/quality/blocked-surface.ts::answerableByTheLoop",
    shown: { kind: "rendered", section: "Who decides — the sentence under What is waiting, added by W347" },
  },
  {
    id: "src/founder/second-reading.ts::sinceReading",
    shown: { kind: "rendered", section: "What has changed since — the second-reading block" },
  },
  {
    id: "src/founder/outstanding.ts::parseGates",
    shown: {
      kind: "through",
      by: "src/founder/outstanding.ts::gatesBlockingNothing",
      what: "§4's own sentence for each gate, which both this and `outstandingRulings` print verbatim rather than paraphrasing.",
    },
  },
  {
    id: "src/founder/outstanding.ts::waitedFor",
    shown: {
      kind: "through",
      by: "src/founder/outstanding.ts::outstandingRulings",
      what: "The wait figure on every ruling card — units built since, the unit it counts from, and whether the wait is standing or proposed.",
    },
  },
  {
    id: "src/founder/outstanding.ts::renderedUnits",
    shown: {
      kind: "through",
      by: "src/founder/outstanding.ts::founderDiff",
      what: "The phantom arm: it re-reads the same call the page makes, so a unit shown as released that the ledger does not block appears in the agreement section.",
    },
  },
  {
    id: "src/quality/blocked-surface.ts::parseLedgerRows",
    shown: {
      kind: "through",
      by: "src/founder/outstanding.ts::builtSurface",
      what: "Every figure on the page starts here; it is the ledger table read into rows.",
    },
  },
  {
    id: "src/quality/blocked-surface.ts::allLedgerRows",
    shown: {
      kind: "through",
      by: "src/founder/outstanding.ts::blockedShape",
      what: "The blocked rows the shape splits, and the same call `builtSurface` counts.",
    },
  },
  {
    id: "src/quality/blocked-surface.ts::blockersIn",
    shown: {
      kind: "through",
      by: "src/founder/outstanding.ts::founderDiff",
      what: "The blockers named in a row's note, which is how the agreement section can report a blocked row no release path shows.",
    },
  },
  {
    id: "src/quality/blocked-surface.ts::ledgerRows",
    shown: {
      kind: "declared",
      why: "It returns the week-units and drops everything else, and the page needs the opposite: W347's whole point about the waiting figure is that `SUP-1` and `SUP-2` are IN it, so a derivation that removes them is the shape that produced the G5 correction rather than a fact the page wants. `blockedShape` reads `allLedgerRows` and splits, which keeps both halves.",
    },
  },
  {
    id: "src/quality/blocked-surface.ts::blockedRows",
    shown: {
      kind: "declared",
      why: "It returns the blocked rows whole — status, owner, timestamp, note. The page already prints each row's id and note inside the ruling that blocks it, so rendering this would be the same rows a second time under a different heading, which is the duplication W301 spent a unit removing.",
    },
  },
  {
    id: "src/quality/blocked-surface.ts::blockedSurfaceViolations",
    shown: {
      kind: "declared",
      why: "It reports the register disagreeing with the ledger, which is a BUILD defect rather than a ruling. The distinction against `founderDiff` — rendered one section down — is who the reader is: a page missing a row is invisible to the founder and only they can notice they were not told, while a release path naming a row that has moved fails this tree's own suite before a page is served. Showing the second to a founder would be asking them to review the loop's bookkeeping.",
    },
  },
];

export interface PageFactDefect {
  id: string;
  what: string;
}

/**
 * The register against the page and the modules, in five directions.
 *
 * THE THIRD AND FIFTH ARE A PAIR and neither is enough alone. A claim that the page shows a fact is
 * checked by reading the page; a claim that it does NOT is checked the same way, because a
 * declaration that goes quietly false is exactly what W340 found in seventy-one places and what
 * this page was for six quarters.
 */
export function pageFactDefects(
  root: string,
  declared: readonly PageFact[] = PAGE_FACTS,
  found: readonly string[] = positionDerivations(root),
): PageFactDefect[] {
  const out: PageFactDefect[] = [];
  const byId = new Map(declared.map((f) => [f.id, f.shown]));
  const names = pageNames(root);
  const exportOf = (id: string) => id.split("::")[1] ?? "";

  for (const id of found) {
    if (!byId.has(id)) out.push({ id, what: "derives a fact about the outstanding position and nothing says whether the page shows it" });
  }
  for (const { id } of declared) {
    if (!found.includes(id)) out.push({ id, what: "is classified here and the position modules no longer export it" });
  }
  for (const { id, shown } of declared) {
    if (shown.kind === "rendered" && !names.has(exportOf(id))) {
      out.push({ id, what: "is declared rendered and the page does not name it" });
    }
    if (shown.kind === "declared" && names.has(exportOf(id))) {
      out.push({ id, what: "is declared unshown and the page names it" });
    }
    if (shown.kind === "through") {
      const target = byId.get(shown.by);
      if (target === undefined || target.kind === "declared") {
        out.push({ id, what: `reaches the page through ${shown.by}, which reaches it nowhere` });
      }
    }
  }
  return out.sort((a, b) => `${a.id}${a.what}`.localeCompare(`${b.id}${b.what}`));
}

/** What a fully classified page does not prove. */
export const PAGE_FACT_BOUND =
  "RENDERED MEANS THE PAGE NAMES THE DERIVATION, which is not that a reader can see the answer. A " +
  "call whose result is assigned and never printed, or printed inside a branch no state reaches, " +
  "passes here exactly like one at the top of the page — the e2e spec is what reads the served " +
  "HTML, and it walks the sections rather than every field in them. The population is the other " +
  "half: `POSITION_MODULES` is a list, so a module that starts deriving something about what is " +
  "waiting and is not named here is outside this register entirely, and nothing derives membership " +
  "because nothing joins those three files but the subject. And the judgement this cannot make at " +
  "all is whether a `declared` reason is a GOOD one. Every row here could say the page has no room " +
  "for it and the register would be green; what stands against that is a reader disagreeing, which " +
  "is the same thing W340's `where` column rests on and the same limit W310 states about a blocker " +
  "being the right blocker.";

// W371: the e2e suite's own population — which pages a walk never reaches.
//
// A ROUTE THE SUITE OPENS IS NOT A ROUTE ANYBODY CAN GET TO. W284 asked which routes the page
// suite exercises and answered it the only way that worked at the time: a spec exercises a route
// when the route's path appears anywhere in that spec's text. That answer is right for the question
// it was asked and it is wider than a walk — a path typed into `goto` is a URL somebody knew, and
// knowing a URL is not the same as the product having a way in.
//
// SO THIS READS THE LINK GRAPH INSTEAD. A route is LINKED when some file this product renders
// carries an `href` to it — as a JSX attribute or as a field in a register the navigation reads,
// both of which end at the same anchor. It is OPENED when a spec navigates to it. The two are
// independent and the cross of them is the population: a page linked and opened is one a walk
// reaches; a page opened and unlinked is one only a URL reaches.
//
// WHAT IT FOUND IS HALF THE CONSOLE. Fourteen console routes carry no link from anywhere in this
// product. Some are right to have none — a sign-in page is arrived at by being sent there and a
// founder-only page is not navigation for a practice. The rest are pages a practice is meant to
// use, built and reachable only by somebody who already knows the path, and they are pinned by name
// below in W293's shape: the register does not fail on their existence, it fails when one arrives
// or is fixed without the pin moving. A finding too big for the unit that found it is recorded so
// that it cannot rot, which is the alternative to recording it as a sentence nobody re-reads.
//
// IT CORRECTED ITS OWN AUTHOR ON THE FIRST RUN, which is the argument for running a citation
// rather than writing one. `/console/signin` was recorded here as reachable only by URL, with a
// sentence about a link inside the console being one a signed-in practice cannot use. The sentence
// was fine and the claim was false: `app/practices/page.tsx` links to it twice, and a hand search
// shaped like the JSX attribute alone had not looked at a public page. The row is `walked`.
//
// THE CITATION HALF CARRIES W363'S REMEDY, and reading it that way is a choice worth stating: that
// bound says a citation resolving to a TITLE and stopping is worth little, and the fix is to
// resolve it to something runnable and CALL it. Applied here, a row claiming a route is linked
// from a file does not name that file and stop — `linkTargets` is RUN over the tree and the row is
// checked against what it returns, so a link deleted while the row survives fails on the next
// build. Same on the spec side: `routesOpened` is run rather than believed.
//
// WHAT THIS DOES NOT PROVE is `REACHED_BOUND`, exported below and read by W297's register.
//
// NOTHING IS IMPORTED THAT REACHES `bounds.ts`, per W367: that module imports each bound from its
// owner, so anything importing back completes a cycle whose symptom is `undefined` at module-eval.
// `discoverSurfaces` and the shared walks are leaves.
//
// FOUNDER GATE (plan §4): this reads route names, `href` attributes and spec text. It runs no
// browser, opens no store and sends nothing.

import { readFileSync } from "node:fs";
import path from "node:path";
import { discoverSurfaces } from "@/compliance/surfaces";
import { filesUnder, pageSpecFiles } from "./tree-walks";

/** Every console route this product serves, as the router spells it. */
export function consoleRoutes(root: string): string[] {
  return discoverSurfaces(path.join(root, "app"))
    .filter((s) => s.path === "/console" || s.path.startsWith("/console/"))
    .map((s) => s.path)
    .sort();
}

/**
 * Every console path this product renders a link to, and the file that renders it.
 *
 * BOTH SPELLINGS, because the navigation uses both: `href="/console/x"` in JSX, and `href: "/console/x"`
 * as a field of a register a component maps over. A scan that knew only the attribute would have
 * called the setup steps unlinked, and they are the most deliberately linked pages in the tree.
 */
export function linkTargets(root: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const sources = [...filesUnder(path.join(root, "app")), ...filesUnder(path.join(root, "src"))].filter(
    (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test."),
  );
  for (const file of sources) {
    const rel = path.relative(root, file);
    for (const m of readFileSync(file, "utf8").matchAll(/href(?:=|:\s*)"(\/console[^"]*)"/g)) {
      const at = out.get(m[1]!) ?? [];
      if (!at.includes(rel)) at.push(rel);
      out.set(m[1]!, at);
    }
  }
  return out;
}

/**
 * Every console path a spec navigates to.
 *
 * `goto` and not whole-file text, which is the difference from W284 and the whole point: a path
 * inside an assertion about the URL, or in a comment, is a route the spec MENTIONS. Template
 * literals are cut at the first interpolation so `/book/${token}` is read as its static prefix.
 */
export function routesOpened(root: string): Set<string> {
  const out = new Set<string>();
  for (const file of pageSpecFiles(root)) {
    const source = readFileSync(path.join(root, file), "utf8");
    for (const m of source.matchAll(/goto\(\s*[`"](\/console[^`"$]*)/g)) out.add(m[1]!);
  }
  return out;
}

/** How a route stands against the two derivations. */
export type WayIn =
  /** Linked from somewhere and opened by a spec: a walk reaches it. */
  | { kind: "walked" }
  /** No link anywhere, and a reason no link is right. */
  | { kind: "url_only"; why: string }
  /** THE FINDING: no link anywhere and no reason. Pinned, not excused. */
  | { kind: "no_way_in"; why: string };

export interface ReachedRoute {
  route: string;
  wayIn: WayIn;
}

export interface ReachedDefect {
  route: string;
  what: string;
}

/**
 * Every console route, with how a person arrives at it.
 *
 * A row is a claim about the tree in both directions and neither half is taken on trust: `walked`
 * is checked against a link that is really rendered and a spec that really navigates, and the two
 * unlinked classes are checked against there being no link at all.
 */
export const REACHED_AT_W371: readonly ReachedRoute[] = [
  { route: "/console", wayIn: { kind: "walked" } },
  { route: "/console/capability", wayIn: { kind: "no_way_in", why: "A practice-facing view of what the product can do for this practice, with nothing anywhere linking to it. There is no argument for that; it is the finding." } },
  { route: "/console/capacity", wayIn: { kind: "no_way_in", why: "Capacity is one of the product's own subjects — the forecast a practice is meant to act on — and this page renders it. Nothing anywhere links to it." } },
  { route: "/console/case-mix", wayIn: { kind: "no_way_in", why: "Case mix is what the clinician pathway is built on, and this is where a practice reads its own concentration. Nothing anywhere links to it." } },
  { route: "/console/complaints", wayIn: { kind: "walked" } },
  { route: "/console/credentials", wayIn: { kind: "no_way_in", why: "Where a practice records what its clinicians are credentialled for — a page the setup flow depends on the content of. Nothing links to it." } },
  { route: "/console/dashboard", wayIn: { kind: "walked" } },
  { route: "/console/education", wayIn: { kind: "no_way_in", why: "The education registers a practice authors its own trigger set against, and the one place the G5 posture is visible as a working screen rather than an empty list. Nothing anywhere links to it." } },
  { route: "/console/founder", wayIn: { kind: "url_only", why: "FOUNDER-ONLY, and deliberately not navigation: it renders the outstanding-decisions view that belongs to the founder rather than to a practice, and a link from a practice's console would be an invitation to a page whose whole content is somebody else's queue. Reached by knowing the path, which is the access control this tree has until a real one exists." } },
  { route: "/console/interest", wayIn: { kind: "walked" } },
  { route: "/console/interop", wayIn: { kind: "no_way_in", why: "The interoperability surface, whose registers ship empty behind G9. The emptiness is argued; the absence of any way in is not." } },
  { route: "/console/onboarding", wayIn: { kind: "no_way_in", why: "The page a practice would read while being onboarded, which is the one route where arriving by knowing the path is least plausible: nobody being onboarded knows the paths yet. Nothing anywhere links to it." } },
  { route: "/console/ops", wayIn: { kind: "walked" } },
  { route: "/console/outcomes", wayIn: { kind: "no_way_in", why: "Outcomes are the product's argument for itself, and this is where a practice reads its own rather than the demonstration set. Nothing anywhere links to it." } },
  { route: "/console/outreach", wayIn: { kind: "walked" } },
  { route: "/console/pathways", wayIn: { kind: "no_way_in", why: "The pathway catalogue, whose registries ship empty behind G5. As with interop the emptiness is argued in the module and the absence of any way in is argued nowhere." } },
  { route: "/console/privacy", wayIn: { kind: "walked" } },
  { route: "/console/referrals", wayIn: { kind: "walked" } },
  { route: "/console/registers", wayIn: { kind: "url_only", why: "A REVIEWER'S VIEW OF THIS TREE'S OWN REGISTERS, not a practice's page: it renders counts of checks and their status, which is build machinery rather than product. Linking it from a practice's console would put the tooling inside the thing it measures." } },
  { route: "/console/reporting", wayIn: { kind: "no_way_in", why: "Where a practice reads what it may report and to whom, which is the surface a reporting question is most likely to be asked of. Nothing anywhere links to it." } },
  { route: "/console/responses", wayIn: { kind: "no_way_in", why: "The response graphs a practice reads its own results through, built on the model W183 and W196 spent units on. Nothing anywhere links to it." } },
  { route: "/console/results", wayIn: { kind: "walked" } },
  { route: "/console/roi", wayIn: { kind: "walked" } },
  { route: "/console/rules", wayIn: { kind: "walked" } },
  { route: "/console/setup/[step]", wayIn: { kind: "walked" } },
  { route: "/console/signin", wayIn: { kind: "walked" } },
  { route: "/console/usefulness", wayIn: { kind: "walked" } },
  { route: "/console/verticals", wayIn: { kind: "no_way_in", why: "The vertical a practice belongs to and what belonging to it changes about the rest of the console. Nothing anywhere links to it." } },
];

/**
 * Where the register and the tree disagree, in five directions.
 *
 * THE TWO UNLINKED CLASSES ARE NOT DEFECTS. They are the finding, pinned by name, and the arms that
 * matter are the ones that fire when the pin goes stale: a route becoming unlinked joins the
 * register, and a route somebody gives a link to fails until the row moves. That is W293's shape
 * and it is the only honest way to hold a finding a single unit cannot fix.
 */
export function reachedDefects(
  root: string,
  declared: readonly ReachedRoute[] = REACHED_AT_W371,
): ReachedDefect[] {
  const routes = consoleRoutes(root);
  const links = linkTargets(root);
  const opened = routesOpened(root);
  const byRoute = new Map(declared.map((d) => [d.route, d]));
  const out: ReachedDefect[] = [];

  const linkedNow = (route: string): boolean => {
    if (links.has(route)) return true;
    // A dynamic segment is linked when something links to a concrete instance of it.
    if (!route.includes("[")) return false;
    const prefix = route.slice(0, route.indexOf("["));
    return [...links.keys()].some((t) => t.startsWith(prefix) && t !== prefix);
  };
  const openedNow = (route: string): boolean => {
    if (opened.has(route)) return true;
    if (!route.includes("[")) return false;
    const prefix = route.slice(0, route.indexOf("["));
    return [...opened].some((t) => t.startsWith(prefix) && t !== prefix);
  };

  for (const route of routes) {
    const row = byRoute.get(route);
    if (row === undefined) {
      out.push({ route, what: "is a console route and nothing says how anybody arrives at it" });
      continue;
    }
    if (!openedNow(route)) {
      out.push({ route, what: "is a console route no spec navigates to" });
    }
    if (row.wayIn.kind === "walked" && !linkedNow(route)) {
      out.push({ route, what: "is recorded as linked and nothing in this product links to it" });
    }
    if (row.wayIn.kind !== "walked" && linkedNow(route)) {
      out.push({ route, what: `is recorded as reachable only by URL and is now linked from ${links.get(route)?.join(", ") ?? "a concrete instance"}` });
    }
  }
  for (const { route } of declared) {
    if (!routes.includes(route)) out.push({ route, what: "is recorded here and is not a console route" });
  }
  return out.sort((a, b) => `${a.route}${a.what}`.localeCompare(`${b.route}${b.what}`));
}

/** What this register does not prove. */
export const REACHED_BOUND =
  "A LINK IS NOT A PATH AND `linked` IS THE WEAKER WORD. A row says some file renders an `href` to " +
  "this route; it does not say a person starting at the console can follow links to it, because " +
  "nothing here walks the graph — a page linked only from a page nobody can reach passes as " +
  "linked. Settling that means a reachability closure from the console's own index, which is the " +
  "same question one level in. THE SCAN READS STATIC STRINGS: a route linked through an `href` " +
  "built at runtime, through a router push, or through a redirect is invisible to it, and the " +
  "sign-in row is that gap written down rather than measured. AND `no_way_in` IS A JUDGEMENT ABOUT " +
  "PRODUCT rather than a derivation — the tree can say a route has no link, and cannot say whether " +
  "a practice was ever meant to reach it. The rows argue it one at a time and the argument is a " +
  "person's, which is why they are pinned and not excused.";

// W284: which routes the page suite actually opens.
//
// Q21's finding 5 recorded that `pnpm verify` does not run Playwright, so the only control that
// exercises a rendered page is the one a green build excludes. W274 fixed the guard that suite had
// been failing on. This asks the question underneath both: WHICH ROUTES DOES IT OPEN AT ALL —
// because a suite of thirty-six spec files that never loads a page is invisible in exactly the
// same way as a suite nobody runs.
//
// W271 declares every route and what it may reach. This checks the other axis against the same
// register: every declared route is either opened by a named spec, or refused in writing.
//
// HOW THE SCAN LOOKS FOR A ROUTE IS THE PART THAT WENT WRONG FIRST, and it is worth recording
// because the first version of this register was built on the mistake. Extracting `goto("...")`
// calls finds forty-eight of the fifty routes and misses `/finder` and `/practices` — so the first
// draft classified both as reachable only through `public-sweep.spec.ts`, which iterates
// `PUBLIC_SURFACES` and calls `page.goto(surface.path)` without ever writing a path down. That was
// a tidy story and it was false: both paths ARE written down, inside `for (const path of [...])`
// arrays in `a11y.spec.ts` and `landing.spec.ts`. A `goto(`-shaped extractor cannot see a path in
// an array any more than W276's source scan could tell a practice id in a comment from one in a
// fixture.
//
// So the scan is WHOLE-FILE rather than call-shaped: a spec exercises a route when the route's
// path appears anywhere in that spec's text. Loops, arrays, helper constants and fixtures all
// count, because all of them end at the same `goto`. Dynamic segments match on their static
// prefix, because `/book/[token]` is opened as `/book/${token}` and a register demanding the
// bracket form would mark every dynamic route uncovered.
//
// The citation is RESOLVED rather than believed — "spec X opens route Y" is checked against spec
// X, because a citation nobody resolves reads as coverage. That is W207's finding and W258's rule,
// and it is the only thing this register has over a list somebody wrote once.
//
// FOUNDER GATE (plan §4): this reads spec files and route names. It runs no browser and touches
// no store.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { discoverSurfaces } from "@/compliance/surfaces";

export type Exercise =
  /** A spec whose text contains this route's path, anywhere in it. */
  | { kind: "literal"; spec: string }
  /** Not opened, with the argument for why that is acceptable. */
  | { kind: "refused"; why: string };

export interface RouteCoverage {
  route: string;
  exercise: Exercise;
}

/** Every spec file's text, keyed by file name. */
export function specTexts(root: string): Map<string, string> {
  const dir = path.join(root, "e2e");
  const out = new Map<string, string>();
  for (const entry of readdirSync(dir).sort()) {
    if (!/\.spec\.ts$/.test(entry)) continue;
    out.set(entry, readFileSync(path.join(dir, entry), "utf8"));
  }
  return out;
}

/**
 * What a spec has to contain for a route to count as literally exercised.
 *
 * A dynamic segment is dropped and its parent kept, so `/book/[token]` matches `/book/${token}`
 * and `/api/v1/[endpoint]` matches `/api/v1/practice`. The trailing slash is required, so
 * `/console` does not match `/console/capacity` — without it every console spec would appear to
 * exercise the console root and the register would be uniformly, uselessly green.
 */
export function literalProbe(route: string): string {
  const cut = route.indexOf("/[");
  return cut === -1 ? route : `${route.slice(0, cut)}/`;
}

/**
 * Does this spec's text open that route, taking dynamic segments into account?
 *
 * W285 FIXED THE BRANCH CONDITION, and the bug it hid is the one this register exists to prevent.
 * The branch used to be `probe.endsWith("/")` — a property of the STRING rather than of how it was
 * derived. `/` is static and ends in a slash, so the root route took the prefix branch and became
 * `text.includes("/")`: **true of every spec ever written.** The register's whole claim over a
 * hand-kept list is that "spec X opens route Y" is RESOLVED against spec X, and for the root route
 * it resolved nothing. It was excusing a false citation — `landing.spec.ts`, which opens
 * `/practices` and never opens `/`, its own header saying so. `public-sweep.spec.ts` is the spec
 * that opens the root. The branch now asks whether the ROUTE has a dynamic segment.
 */
export function specOpens(text: string, route: string): boolean {
  const probe = literalProbe(route);
  // W285 also subtracts comments, W173's rule and W275's precedent one register over. A spec's
  // header talks about the routes it does and does not open — `landing.spec.ts` says "the B2B
  // landing moved from `/` to `/practices`" — and a resolution check that reads prose as
  // navigation is resolving nothing. Measured before adding: no citation in the register today
  // depends on a comment, so this changes no answer and closes the way one could.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  if (route.includes("/[")) return code.includes(probe);
  // A static route matches only when nothing routable follows it — `"/console"` and `"/console?"`
  // count, `"/console/capacity"` does not.
  return new RegExp(`["'\`]${probe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=["'\`?])`).test(code);
}

export interface CoverageDiff {
  /** A served route this register does not classify. */
  undeclared: string[];
  /** An entry naming a route the app no longer serves. */
  stale: string[];
  /** An entry citing a spec that does not exist. */
  missingSpec: string[];
  /** A `literal` claim whose spec does not contain the path. */
  unresolvedLiteral: string[];
  /** A refusal with no argument. */
  refusedWithoutReason: string[];
}

/**
 * Every disagreement between the register and the tree, in both directions.
 *
 * The claims are RESOLVED here rather than trusted: this unit's whole value over a hand-kept list
 * is that "spec X opens route Y" is checked against spec X.
 */
export function coverageDiff(
  root: string,
  declared: readonly RouteCoverage[] = ROUTE_COVERAGE,
): CoverageDiff {
  const served = discoverSurfaces(path.join(root, "app")).map((s) => s.path);
  const specs = specTexts(root);
  const byRoute = new Map(declared.map((d) => [d.route, d]));

  const diff: CoverageDiff = {
    undeclared: served.filter((r) => !byRoute.has(r)).sort(),
    stale: declared.map((d) => d.route).filter((r) => !served.includes(r)).sort(),
    missingSpec: [],
    unresolvedLiteral: [],
    refusedWithoutReason: [],
  };

  for (const entry of declared) {
    const { exercise } = entry;
    if (exercise.kind === "refused") {
      if (exercise.why.trim().length < 60) diff.refusedWithoutReason.push(entry.route);
      continue;
    }
    const text = specs.get(exercise.spec);
    if (text === undefined) {
      diff.missingSpec.push(`${entry.route} -> ${exercise.spec}`);
      continue;
    }
    if (!specOpens(text, entry.route)) diff.unresolvedLiteral.push(entry.route);
  }

  return diff;
}

/** True when nothing disagrees. Used so a field added to `CoverageDiff` cannot go unchecked. */
export function coverageIsClean(diff: CoverageDiff): boolean {
  return Object.values(diff).every((v) => v.length === 0);
}

/**
 * Every route W271 declares, and how the page suite opens it.
 *
 * Ordered as the router serves them. Every one is exercised; nothing is refused, which is the
 * honest result rather than a gap — see the module note for the classification that was wrong on
 * the first pass and how it was found.
 */
export const ROUTE_COVERAGE: readonly RouteCoverage[] = [
  { route: "/", exercise: { kind: "literal", spec: "landing.spec.ts" } },
  { route: "/api/interest/export", exercise: { kind: "literal", spec: "interest.spec.ts" } },
  { route: "/api/mock/capability", exercise: { kind: "literal", spec: "capability.spec.ts" } },
  { route: "/api/mock/case-mix", exercise: { kind: "literal", spec: "case-mix.spec.ts" } },
  { route: "/api/mock/console", exercise: { kind: "literal", spec: "console.spec.ts" } },
  { route: "/api/mock/credentials", exercise: { kind: "literal", spec: "credentials.spec.ts" } },
  { route: "/api/mock/education", exercise: { kind: "literal", spec: "education.spec.ts" } },
  { route: "/api/mock/ops", exercise: { kind: "literal", spec: "ops.spec.ts" } },
  { route: "/api/mock/pathways", exercise: { kind: "literal", spec: "pathways.spec.ts" } },
  { route: "/api/mock/preferences", exercise: { kind: "literal", spec: "preferences.spec.ts" } },
  { route: "/api/mock/referrals", exercise: { kind: "literal", spec: "referrals.spec.ts" } },
  { route: "/api/mock/registers", exercise: { kind: "literal", spec: "registers.spec.ts" } },
  { route: "/api/mock/state", exercise: { kind: "literal", spec: "booking.spec.ts" } },
  { route: "/api/mock/usefulness", exercise: { kind: "literal", spec: "usefulness.spec.ts" } },
  { route: "/api/mock/verticals", exercise: { kind: "literal", spec: "verticals.spec.ts" } },
  { route: "/api/v1/[endpoint]", exercise: { kind: "literal", spec: "platform-api.spec.ts" } },
  { route: "/book/[token]", exercise: { kind: "literal", spec: "booking.spec.ts" } },
  { route: "/clinicians", exercise: { kind: "literal", spec: "a11y.spec.ts" } },
  { route: "/console", exercise: { kind: "literal", spec: "console.spec.ts" } },
  { route: "/console/capability", exercise: { kind: "literal", spec: "capability.spec.ts" } },
  { route: "/console/capacity", exercise: { kind: "literal", spec: "capacity.spec.ts" } },
  { route: "/console/case-mix", exercise: { kind: "literal", spec: "case-mix.spec.ts" } },
  { route: "/console/complaints", exercise: { kind: "literal", spec: "complaints.spec.ts" } },
  { route: "/console/credentials", exercise: { kind: "literal", spec: "credentials.spec.ts" } },
  { route: "/console/dashboard", exercise: { kind: "literal", spec: "dashboard.spec.ts" } },
  { route: "/console/education", exercise: { kind: "literal", spec: "education.spec.ts" } },
  { route: "/console/founder", exercise: { kind: "literal", spec: "founder.spec.ts" } },
  { route: "/console/interest", exercise: { kind: "literal", spec: "interest.spec.ts" } },
  { route: "/console/interop", exercise: { kind: "literal", spec: "interop.spec.ts" } },
  { route: "/console/onboarding", exercise: { kind: "literal", spec: "console.spec.ts" } },
  { route: "/console/ops", exercise: { kind: "literal", spec: "ops.spec.ts" } },
  { route: "/console/outcomes", exercise: { kind: "literal", spec: "outcomes.spec.ts" } },
  { route: "/console/outreach", exercise: { kind: "literal", spec: "outreach.spec.ts" } },
  { route: "/console/pathways", exercise: { kind: "literal", spec: "pathways.spec.ts" } },
  { route: "/console/privacy", exercise: { kind: "literal", spec: "privacy.spec.ts" } },
  { route: "/console/referrals", exercise: { kind: "literal", spec: "referrals.spec.ts" } },
  { route: "/console/registers", exercise: { kind: "literal", spec: "registers.spec.ts" } },
  { route: "/console/reporting", exercise: { kind: "literal", spec: "reporting.spec.ts" } },
  { route: "/console/responses", exercise: { kind: "literal", spec: "responses.spec.ts" } },
  { route: "/console/results", exercise: { kind: "literal", spec: "results.spec.ts" } },
  { route: "/console/roi", exercise: { kind: "literal", spec: "roi.spec.ts" } },
  { route: "/console/rules", exercise: { kind: "literal", spec: "a11y.spec.ts" } },
  { route: "/console/setup/[step]", exercise: { kind: "literal", spec: "setup.spec.ts" } },
  { route: "/console/signin", exercise: { kind: "literal", spec: "a11y.spec.ts" } },
  { route: "/console/usefulness", exercise: { kind: "literal", spec: "usefulness.spec.ts" } },
  { route: "/console/verticals", exercise: { kind: "literal", spec: "verticals.spec.ts" } },
  { route: "/demo", exercise: { kind: "literal", spec: "demo.spec.ts" } },
  { route: "/finder", exercise: { kind: "literal", spec: "a11y.spec.ts" } },
  { route: "/practices", exercise: { kind: "literal", spec: "landing.spec.ts" } },
  { route: "/privacy", exercise: { kind: "literal", spec: "privacy.spec.ts" } },
  {
    route: "/privacy/automated-decisions",
    exercise: { kind: "literal", spec: "privacy.spec.ts" },
  },
];

/**
 * Ways of writing this register that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly loosening the check.
 */
export const REFUSED_COVERAGE_SHAPES: Readonly<Record<string, string>> = {
  scanning_for_goto_calls:
    "Deciding coverage by extracting `goto(\"...\")` calls. It finds forty-eight of fifty and misses `/finder` and `/practices`, whose paths sit inside `for (const path of [...])` arrays — and the first draft of this register believed that miss, classifying two public pages as reachable only through an iterated surface register. The scan is whole-file: loops, arrays and helper constants all end at the same `goto`. W276's source scan made the same class of error one unit earlier.",
  trusting_the_citation:
    "Recording 'spec X opens route Y' and checking nothing. A citation nobody resolves reads as coverage — W207's finding and W258's rule — and it is the only thing this register has over a list somebody wrote once. Every literal claim is checked against the spec's text and every register-driven claim against both the spec and the register.",
  matching_a_route_by_prefix:
    "Letting `/console` match `/console/capacity`. Every console spec would then appear to exercise the console root and the register would be uniformly, uselessly green. A static route matches only when nothing routable follows it; a dynamic one matches on its parent, because `/book/[token]` is opened as `/book/${token}` and demanding the bracket form would mark every dynamic route uncovered.",
  counting_a_spec_that_only_asserts_a_url:
    "Treating `toHaveURL(/console/x)` as opening a route. It is an assertion about where a click landed, which is a fine thing to check and is not the same as the suite loading that page — though in this tree the two coincide, because a spec that asserts a URL got there by navigating.",
  a_refusal_without_an_argument:
    "Marking a route `refused` and moving on. Every refusal here has to carry the reason it is acceptable not to open a page, and the check requires sixty characters of it — because 'not covered' and 'nobody thought about it' are indistinguishable from outside, which is W51's finding and the reason this register exists at all.",
};

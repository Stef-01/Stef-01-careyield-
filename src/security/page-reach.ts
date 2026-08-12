// W271: every route, and what it can reach.
//
// W107 walks `app/` transitively and answers one question: can a request-serving path reach a
// build-time-only npm package. That question is answered over the WHOLE of `app/` at once, and
// the aggregate cannot answer the question this unit is about. "The app reaches `messaging`" is
// true and uninteresting; "THE PUBLIC FINDER PAGE reaches `messaging`" would be a defect, and the
// union of every route's imports cannot tell the two apart. So the walk is re-run per route, from
// that route's own file plus the layout chain that wraps it, and each route's reach is checked
// against a declared surface in both directions.
//
// THE SURFACE IS DECLARED BY CLASS, NOT BY ROUTE, AND THAT IS THE DESIGN DECISION. Fifty routes
// times forty areas is a matrix nobody maintains and everybody rubber-stamps; a week after it is
// written it is a list of what the tree happened to do rather than a statement of what it may do.
// Routes divide into seven kinds with genuinely different rules — a public page, a patient's
// token page, the practice console, the mock seeders, the platform API, the interest export and
// the demo — and the rule that matters is a property of the kind. Adding a console page inherits
// the console's allowance and its requirement; adding a class is a decision somebody writes down.
//
// EACH CLASS CARRIES BOTH DIRECTIONS OF RULE, because they fail differently:
//
//   * `mayReach` is a CLOSED allowance. An area outside it fails, so a public page that starts
//     importing the messaging rail fails on the day of the import rather than on the day somebody
//     reads the diff. This is W107's posture — allow-list, not deny-list — for the same reason:
//     a deny-list is silent about whatever was invented after it was written.
//   * `mustReach` is a REQUIREMENT. Every console route reaches `session` and `tenancy`, and that
//     is not a coincidence to be observed but the practice-scoping spine W166 and W209 built: a
//     console page that stopped going through it would be reading somebody else's practice, and
//     an allowance can only ever notice the imports that ARRIVE.
//
// A `mayReach` ENTRY NO ROUTE USES IS ALSO A FAILURE, which is W102's lesson applied to areas
// rather than to routes. The unmapped direction is the one everybody expects; the stale direction
// is the one nobody catches, and it is what turns a register from incomplete into misleading — an
// allowance that still permits `credentials` after the last page stopped importing it reads as a
// decision somebody made, when it is a decision nobody has revisited.
//
// AND A ROUTE REACHING A DORMANT MODULE FAILS. `DORMANT_MODULES` is file-level rather than area
// level because the modules that matter here sit inside areas that are otherwise perfectly
// reachable: `src/report/weekly.ts` is in `report`, which the console does reach. W107 already
// refuses the PACKAGE — and W107's own founding defect was a page importing three plain numbers
// from the module that pulls `docx` in, which the package check catches only because the import
// is static. Naming the module catches it one step earlier and says which route did it.

import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { discoverSurfaces, type Surface } from "@/compliance/surfaces";
import { reachableFrom } from "./reachability";

export type RouteClassId =
  | "public"
  | "patient_token"
  | "console"
  | "mock_seed"
  | "platform_api"
  | "operator_export"
  | "demo";

export interface RouteClass {
  id: RouteClassId;
  /** What kind of surface this is and what its rule is FOR. */
  why: string;
  /** The routes in it, as `discoverSurfaces` spells them. Checked against the tree both ways. */
  routes: readonly string[];
  /**
   * Areas every route in the class must reach.
   *
   * A requirement rather than a measurement: setting it to whatever the routes happen to reach
   * would make it break on any refactor and mean nothing when it did not.
   */
  mustReach: readonly string[];
  /** The closed allowance. An area outside it fails; an entry no route uses fails too. */
  mayReach: readonly string[];
}

export const ROUTE_CLASSES: readonly RouteClass[] = [
  {
    id: "public",
    why: "Served to anyone, with no session and no practice. The allowance is the shortest in the tree and that is the point — a public page has no business reaching the booking spine, the messaging rail, a register or a credential, and `/clinicians` reaches no first-party module at all. `demo` is in the allowance because the finder renders the synthetic demonstration set, which is the only patient-shaped data a public page may name.",
    routes: [
      "/",
      "/clinicians",
      "/finder",
      "/practices",
      "/privacy",
      "/privacy/automated-decisions",
    ],
    mustReach: [],
    mayReach: ["compliance", "demo", "interest", "lib", "privacy", "security"],
  },
  {
    id: "patient_token",
    why: "The one route a patient opens from a link. It must go through `booking`, which is where the token is validated and where the appointment it names is resolved — a token page that reached the console stores instead would be answering from practice state rather than from the token.",
    routes: ["/book/[token]"],
    mustReach: ["booking"],
    mayReach: ["booking", "domain", "engine", "lib", "messaging"],
  },
  {
    id: "console",
    why: "The practice-facing product. Every route must reach `session` and `tenancy` — W166 makes membership the grant and W209 makes the practice come from the session rather than from the request, so a console page outside that spine is one reading a practice it was told about. The allowance is wide because the console is most of the product; what it excludes is what matters: the public directory, the document generators and the quality harnesses.",
    routes: [
      "/console",
      "/console/capability",
      "/console/capacity",
      "/console/case-mix",
      "/console/complaints",
      "/console/credentials",
      "/console/dashboard",
      "/console/education",
      "/console/interest",
      "/console/interop",
      "/console/onboarding",
      "/console/ops",
      "/console/outcomes",
      "/console/outreach",
      "/console/pathways",
      "/console/privacy",
      "/console/referrals",
      "/console/registers",
      "/console/reporting",
      "/console/responses",
      "/console/results",
      "/console/roi",
      "/console/rules",
      "/console/setup/[step]",
      "/console/signin",
      "/console/usefulness",
      "/console/verticals",
    ],
    mustReach: ["console", "session", "tenancy"],
    mayReach: [
      "audit",
      "booking",
      "capability",
      "capacity",
      "complaints",
      "console",
      "credentials",
      "domain",
      "economics",
      "education",
      "engine",
      "guardrails",
      "interest",
      "interop",
      "lib",
      "messaging",
      "ops",
      "outcomes",
      "pathways",
      "pms",
      "privacy",
      "referrals",
      "registers",
      "report",
      "reporting",
      "security",
      "session",
      "sim",
      "spine",
      "synthetic",
      "tenancy",
      "verticals",
    ],
  },
  {
    id: "mock_seed",
    why: "Routes that load synthetic fixtures into the in-memory stores so a console has something to show. They require nothing, deliberately: each seeds one area and reaching the others would mean a seeder had grown into a second way of writing product state.",
    routes: [
      "/api/mock/capability",
      "/api/mock/case-mix",
      "/api/mock/console",
      "/api/mock/credentials",
      "/api/mock/education",
      "/api/mock/ops",
      "/api/mock/pathways",
      "/api/mock/preferences",
      "/api/mock/referrals",
      "/api/mock/registers",
      "/api/mock/state",
      "/api/mock/usefulness",
      "/api/mock/verticals",
    ],
    mustReach: [],
    mayReach: [
      "audit",
      "booking",
      "capability",
      "complaints",
      "console",
      "credentials",
      "domain",
      "education",
      "engine",
      "guardrails",
      "lib",
      "messaging",
      "ops",
      "pathways",
      "pms",
      "privacy",
      "referrals",
      "registers",
      "session",
      "sim",
      "spine",
      "synthetic",
      "tenancy",
      "verticals",
    ],
  },
  {
    id: "platform_api",
    why: "W253's single dispatcher. It must reach `api` — there is one route file and every endpoint goes through it, so an endpoint written anywhere else has nowhere to be served from — and `console` and `tenancy`, because the practice it answers for comes from the session rather than from the caller.",
    routes: ["/api/v1/[endpoint]"],
    mustReach: ["api", "console", "tenancy"],
    mayReach: [
      "api",
      "booking",
      "capacity",
      "console",
      "domain",
      "engine",
      "interop",
      "lib",
      "messaging",
      "ops",
      "privacy",
      "registers",
      "session",
      "sim",
      "spine",
      "synthetic",
      "tenancy",
    ],
  },
  {
    id: "operator_export",
    why: "The one route that hands a file back. It must reach `security` and `tenancy`: the export is authorised before it is produced and scoped to one practice, and an export route that stopped reaching either would be the shape of a cross-tenant leak rather than a missing feature.",
    routes: ["/api/interest/export"],
    mustReach: ["security", "tenancy"],
    mayReach: ["console", "interest", "lib", "security", "tenancy"],
  },
  {
    id: "demo",
    why: "The founder-facing walkthrough, which reaches nearly everything on purpose — it exists to show the product working end to end on synthetic data. Its own class rather than an exception inside another, so its width is a stated property of one route instead of a hole in the console's allowance.",
    routes: ["/demo"],
    mustReach: [],
    mayReach: [
      "audit",
      "booking",
      "capability",
      "complaints",
      "console",
      "credentials",
      "domain",
      "education",
      "engine",
      "guardrails",
      "lib",
      "messaging",
      "ops",
      "pathways",
      "pms",
      "privacy",
      "referrals",
      "registers",
      "session",
      "sim",
      "spine",
      "synthetic",
      "tenancy",
      "verticals",
    ],
  },
];

export interface DormantModule {
  /** Repo-relative, as the walk spells it. */
  module: string;
  whyDormant: string;
  /** What would legitimately make it reachable, so the entry can be retired rather than deleted. */
  whatWouldMakeItLive: string;
}

/**
 * Modules no route may reach.
 *
 * FILE-LEVEL, because each of these sits in an area the product otherwise reaches perfectly
 * legitimately — the class allowances cannot express "the console may reach `report` but not
 * `report/weekly.ts`", and that is exactly the distinction W107's founding defect turned on.
 */
export const DORMANT_MODULES: readonly DormantModule[] = [
  {
    module: "src/collateral/deck.ts",
    whyDormant:
      "It imports `pptxgenjs` at module scope, and the audit allowlist accepts two `image-size` advisories on the argument that `pptxgenjs` is absent from the deployed app. Reaching this module is what would make that acceptance false.",
    whatWouldMakeItLive:
      "Nothing that should happen. If a deck ever needs generating from a request, it belongs behind a build step or a job, not behind a route — and the allowlist entry has to be re-argued first.",
  },
  {
    module: "src/collateral/one-pager.ts",
    whyDormant:
      "The same argument as the deck, and here because a rule that only covers the file you were caught on is not a rule — W107 said so about `docx` and the point applies to the sibling module.",
    whatWouldMakeItLive: "The same answer as the deck: a build step or a job, never a route.",
  },
  {
    module: "src/report/weekly.ts",
    whyDormant:
      "It imports `docx` at module scope. This is W107's founding defect itself: `app/console/results/page.tsx` imported three plain numbers from it, so a server component was loading a document library to read a constant. The constant moved; the module stayed.",
    whatWouldMakeItLive:
      "A route that genuinely needs to produce a Word document on request, which would need the document generation moved off the request path first.",
  },
  {
    module: "src/quality/g1-rehearsal.ts",
    whyDormant:
      "W262's harness drives W242's credential loader end to end. It is a reviewer's instrument, and a page reaching it would put the credential path behind a request — the opposite of what a rehearsal against an unratified gate is for.",
    whatWouldMakeItLive:
      "Nothing. On the day G1 is ratified the rehearsal is superseded by the real path, not promoted to it.",
  },
  {
    module: "src/quality/g5-rehearsal.ts",
    whyDormant:
      "W264's harness signs off synthetic pathway content and mints a `UsablePathway` to prove the workflow runs. The content means nothing and no operator may ever see it — W264 pins the same rule with its own importer walk, and this register is where it belongs once the question is asked of every route rather than of every module.",
    whatWouldMakeItLive:
      "Nothing. When G5 is ratified, real content goes through `SHIPPED_PATHWAYS` and the rehearsal stays a harness.",
  },
];

/**
 * The files a request to this route can start from: the route's own file, plus every layout
 * between `app/` and it.
 *
 * The layout chain is part of the reach because a layout wraps the page in the response — a
 * secret imported by `app/console/layout.tsx` is as served as one imported by the page itself.
 */
export function routeEntryFiles(appDir: string, surface: Surface): string[] {
  const entries = [surface.file];
  let dir = dirname(surface.file);
  for (;;) {
    for (const candidate of ["layout.tsx", "layout.ts"]) {
      const full = join(dir, candidate);
      if (existsFile(full)) entries.push(full);
    }
    if (dir === appDir || dir.length <= appDir.length) break;
    dir = dirname(dir);
  }
  return entries;
}

function existsFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

export interface RouteReach {
  route: string;
  /** Top-level `src/` directories the route reaches, sorted. */
  areas: string[];
  /** Every first-party file it reaches, repo-relative. */
  files: string[];
}

/** What one route can reach. */
export function reachOfRoute(root: string, surface: Surface): RouteReach {
  const appDir = join(root, "app");
  const { files } = reachableFrom(root, routeEntryFiles(appDir, surface));
  const src = files.filter((f) => f.startsWith("src/"));
  return {
    route: surface.path,
    areas: [...new Set(src.map((f) => f.split("/")[1]!))].sort(),
    files: src,
  };
}

/** What every route can reach, in route order. */
export function reachByRoute(root: string): RouteReach[] {
  return discoverSurfaces(join(root, "app")).map((s) => reachOfRoute(root, s));
}

export interface ReachDiff {
  /** Served routes no class claims. */
  unclassified: string[];
  /** Routes a class names that are not served. */
  stale: string[];
  /** Routes more than one class claims. */
  doubleClaimed: string[];
  /** A route reaching an area outside its class's allowance. */
  outsideAllowance: Array<{ route: string; area: string; classId: RouteClassId }>;
  /** A route not reaching an area its class requires. */
  missingRequired: Array<{ route: string; area: string; classId: RouteClassId }>;
  /** An allowance entry no route in the class uses — W102's stale direction, for areas. */
  unusedAllowance: Array<{ classId: RouteClassId; area: string }>;
  /** A route reaching a module declared dormant. */
  wokenDormant: Array<{ route: string; module: string }>;
}

/** Every disagreement between the declared surface and the tree, in both directions. */
export function diffReach(root: string): ReachDiff {
  const reach = reachByRoute(root);
  const byRoute = new Map(reach.map((r) => [r.route, r]));
  const served = new Set(byRoute.keys());

  const claimedBy = new Map<string, RouteClassId[]>();
  for (const cls of ROUTE_CLASSES) {
    for (const route of cls.routes) {
      claimedBy.set(route, [...(claimedBy.get(route) ?? []), cls.id]);
    }
  }

  const diff: ReachDiff = {
    unclassified: [...served].filter((r) => !claimedBy.has(r)).sort(),
    stale: [...claimedBy.keys()].filter((r) => !served.has(r)).sort(),
    doubleClaimed: [...claimedBy.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([route]) => route)
      .sort(),
    outsideAllowance: [],
    missingRequired: [],
    unusedAllowance: [],
    wokenDormant: [],
  };

  const dormant = new Set(DORMANT_MODULES.map((d) => d.module));

  for (const cls of ROUTE_CLASSES) {
    const allowed = new Set(cls.mayReach);
    const used = new Set<string>();
    for (const route of cls.routes) {
      const r = byRoute.get(route);
      if (!r) continue; // Already reported as stale; reporting it twice helps nobody.
      for (const area of r.areas) {
        used.add(area);
        if (!allowed.has(area)) diff.outsideAllowance.push({ route, area, classId: cls.id });
      }
      for (const area of cls.mustReach) {
        if (!r.areas.includes(area)) diff.missingRequired.push({ route, area, classId: cls.id });
      }
    }
    for (const area of cls.mayReach) {
      if (!used.has(area)) diff.unusedAllowance.push({ classId: cls.id, area });
    }
  }

  for (const r of reach) {
    for (const file of r.files) {
      if (dormant.has(file)) diff.wokenDormant.push({ route: r.route, module: file });
    }
  }

  return diff;
}

/** True when nothing disagrees. Used by the test so a new field cannot be forgotten. */
export function reachIsClean(diff: ReachDiff): boolean {
  return Object.values(diff).every((v) => v.length === 0);
}

/** Every top-level area under `src/`, so the register can be checked against real directories. */
export function allAreas(root: string): string[] {
  return readdirSync(join(root, "src"))
    .filter((e) => statSync(join(root, "src", e)).isDirectory())
    .sort();
}

/**
 * Ways of writing this register that would prove less than they appear to, each refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather
 * than quietly widening the surface.
 */
export const REFUSED_REACH_SHAPES: Readonly<Record<string, string>> = {
  one_row_per_route:
    "Declaring what each of the fifty routes reaches, individually. Fifty rows times forty areas is a matrix nobody maintains and everybody rubber-stamps, and within a week it records what the tree happens to do rather than what it may do. The rule that matters belongs to the KIND of route, so adding a console page inherits the console's rule and adding a class is a decision somebody writes down.",
  a_deny_list_instead_of_an_allowance:
    "Listing the areas each class must NOT reach. A deny-list is silent about whatever was invented after it was written, so the first page to import a brand-new area passes — which is W107's argument for an allow-list, at a different granularity.",
  the_allowance_as_a_measurement:
    "Setting `mustReach` to whatever the routes currently reach. It would then break on any refactor and mean nothing when it did, which is the failure mode of every register that records the tree instead of stating a rule. `mustReach` carries only the properties that would be defects to lose; `mayReach` is the closed allowance and is measured.",
  ignoring_the_stale_direction:
    "Failing on an area outside the allowance and saying nothing about an allowance entry no route uses. That is the direction nobody catches and the one that makes a register misleading rather than merely incomplete — an allowance still permitting `credentials` after the last page stopped importing it reads as a decision, when it is a decision nobody has revisited. W102 learned this about routes; areas are the same shape.",
  dormancy_by_area:
    "Expressing the dormant modules as forbidden areas. Every one of them sits in an area the product reaches legitimately — `src/report/weekly.ts` is in `report`, which the console does reach — so an area-level rule cannot say it, and W107's founding defect was precisely one file inside a reachable area.",
  the_aggregate_walk:
    "Reusing W107's whole-of-`app/` result. 'The app reaches the messaging rail' is true and uninteresting; 'the public finder page reaches the messaging rail' would be a defect, and the union of every route's imports cannot tell the two apart.",
  skipping_the_layout_chain:
    "Walking only the route's own file. A layout wraps the page in the response, so a module imported by `app/console/layout.tsx` is as served as one imported by the page — a reach check that missed it would certify a route by the half of its graph that happens to be in one file.",
};

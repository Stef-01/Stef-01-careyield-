// W271 verify gate: "W107's transitive walk over `app/` checked against a declared surface in
// both directions; a page reaching a dormant module fails."
//
// BOTH DIRECTIONS IS SIX CHECKS, NOT TWO, because the declared surface has two halves and each
// has a stale side. Routes: a served route no class claims, and a class naming a route that is
// not served. Areas: a route reaching outside its class's allowance, and an allowance entry no
// route uses. Requirements: a route not reaching what its class requires. And the dormant
// register on top of all of it.
//
// The whole diff is asserted as one object rather than field by field, so a field added to
// `ReachDiff` tomorrow cannot be silently unchecked — the one way a both-directions test goes
// quietly one-directional.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DORMANT_MODULES,
  REFUSED_REACH_SHAPES,
  ROUTE_CLASSES,
  allAreas,
  diffReach,
  reachByRoute,
  reachIsClean,
  reachOfRoute,
  routeEntryFiles,
} from "./page-reach";
import { discoverSurfaces } from "@/compliance/surfaces";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");
const reach = reachByRoute(ROOT);
const byRoute = new Map(reach.map((r) => [r.route, r]));

describe("W271 the walk is real before anything is concluded from it", () => {
  it("reaches every served route and finds imports in them", () => {
    // A resolver bug returning nothing would satisfy every allowance below, so the shape of the
    // walk is pinned before its result is trusted.
    const surfaces = discoverSurfaces(APP);
    expect(reach).toHaveLength(surfaces.length);
    expect(surfaces.length).toBeGreaterThan(40);
    // Most routes reach something; a handful legitimately reach nothing.
    expect(reach.filter((r) => r.areas.length > 0).length).toBeGreaterThan(40);
  });

  it("traverses transitively rather than reading one file's imports", () => {
    // `src/console/store.ts` is only reachable through `@/` chains, never imported by a route
    // file directly — the same probe W107's own test uses.
    const dashboard = byRoute.get("/console/dashboard")!;
    expect(dashboard.files).toContain("src/console/store.ts");
    expect(dashboard.areas.length).toBeGreaterThan(5);
  });

  it("counts the layout chain as part of a route's reach", () => {
    // A layout wraps the page in the response. Checked structurally, because a route whose
    // layouts happened to import nothing would make an assertion about the result vacuous.
    const clinicians = discoverSurfaces(APP).find((s) => s.path === "/clinicians")!;
    const entries = routeEntryFiles(APP, clinicians);
    expect(entries.some((e) => e.endsWith("clinicians/layout.tsx"))).toBe(true);
    expect(entries.some((e) => e.endsWith(`app${path.sep}layout.tsx`))).toBe(true);
    expect(entries[0]).toBe(clinicians.file);
  });

  it("separates routes rather than answering with the aggregate", () => {
    // The whole reason for this unit: the union cannot tell a public page from the console.
    const finder = byRoute.get("/finder")!;
    const consoleRoot = byRoute.get("/console")!;
    expect(finder.areas).not.toContain("messaging");
    expect(consoleRoot.areas).toContain("messaging");
  });
});

describe("W271 the declared surface agrees with the tree, in both directions", () => {
  it("has nothing to report at all", () => {
    // Asserted as one object so a field added to `ReachDiff` cannot go unchecked.
    const diff = diffReach(ROOT);
    expect(diff).toEqual({
      unclassified: [],
      stale: [],
      doubleClaimed: [],
      outsideAllowance: [],
      missingRequired: [],
      unusedAllowance: [],
      wokenDormant: [],
    });
    expect(reachIsClean(diff)).toBe(true);
  });

  it("classifies every served route exactly once", () => {
    const served = discoverSurfaces(APP).map((s) => s.path).sort();
    const claimed = ROUTE_CLASSES.flatMap((c) => c.routes).sort();
    expect(claimed).toEqual(served);
    expect(new Set(claimed).size).toBe(claimed.length);
  });

  it("names only areas that are real directories", () => {
    // An allowance naming an area that does not exist would permit nothing and read as a rule.
    const areas = new Set(allAreas(ROOT));
    for (const cls of ROUTE_CLASSES) {
      for (const area of [...cls.mayReach, ...cls.mustReach]) {
        expect(areas.has(area), `${cls.id} names ${area}, which is not a directory under src/`).toBe(
          true,
        );
      }
      // A requirement outside the allowance is a rule that can never be satisfied.
      for (const area of cls.mustReach) {
        expect(cls.mayReach, `${cls.id} requires ${area} without allowing it`).toContain(area);
      }
    }
  });

  it("keeps every allowance sorted and free of duplicates", () => {
    for (const cls of ROUTE_CLASSES) {
      expect([...cls.mayReach].sort(), `${cls.id}'s allowance is unsorted`).toEqual([
        ...cls.mayReach,
      ]);
      expect(new Set(cls.mayReach).size, `${cls.id} lists an area twice`).toBe(cls.mayReach.length);
    }
  });
});

describe("W271 the requirements are requirements, not measurements", () => {
  it("states a positive rule for the classes where losing one would be a defect", () => {
    // Four of the seven carry one. A register where every `mustReach` were empty would be an
    // allowance with a second name.
    const withRequirements = ROUTE_CLASSES.filter((c) => c.mustReach.length > 0);
    expect(withRequirements.map((c) => c.id).sort()).toEqual([
      "console",
      // W310. Its rule is the narrowest in the register and the reason it exists: the founder page
      // must reach `founder`, because a page under `/console` that stopped reaching the derivation
      // and started holding its own list would satisfy every other check here.
      "founder",
      "operator_export",
      "patient_token",
      "platform_api",
    ]);
  });

  it("requires the practice-scoping spine of every console route", () => {
    // W166 makes membership the grant and W209 makes the practice come from the session. This is
    // the assertion an allowance cannot make: it can only notice imports that ARRIVE.
    const consoleClass = ROUTE_CLASSES.find((c) => c.id === "console")!;
    expect(consoleClass.mustReach).toEqual(["console", "session", "tenancy"]);
    expect(consoleClass.routes.length).toBeGreaterThan(20);
    for (const route of consoleClass.routes) {
      const r = byRoute.get(route)!;
      expect(r.areas, `${route} is outside the practice-scoping spine`).toEqual(
        expect.arrayContaining(["session", "tenancy"]),
      );
    }
  });

  it("keeps the public allowance short, and shorter than the console's", () => {
    const pub = ROUTE_CLASSES.find((c) => c.id === "public")!;
    const con = ROUTE_CLASSES.find((c) => c.id === "console")!;
    expect(pub.mayReach.length).toBeLessThan(8);
    expect(pub.mayReach.length * 3).toBeLessThan(con.mayReach.length);
    // The areas a public page must never reach, named so the shortness is not the only guard.
    for (const forbidden of ["booking", "messaging", "referrals", "credentials", "tenancy"]) {
      expect(pub.mayReach, `a public page may reach ${forbidden}`).not.toContain(forbidden);
      for (const route of pub.routes) {
        expect(byRoute.get(route)!.areas, `${route} reaches ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("explains every class rather than naming it", () => {
    // W304: a floor. The loop below is what reads every class; the total moved whenever a route
    // class was added, which is ordinary work.
    expect(ROUTE_CLASSES.length, "no route class is declared").toBeGreaterThanOrEqual(7);
    for (const cls of ROUTE_CLASSES) {
      expect(cls.why.length, `${cls.id} is declared without a reason`).toBeGreaterThan(120);
      expect(cls.routes.length, `${cls.id} claims no route`).toBeGreaterThan(0);
    }
  });
});

describe("W271 a route reaching a dormant module fails", () => {
  it("reaches none of them today", () => {
    const reachedAnywhere = new Set(reach.flatMap((r) => r.files));
    for (const entry of DORMANT_MODULES) {
      expect(
        reachedAnywhere.has(entry.module),
        `${entry.module} is declared dormant and a route reaches it`,
      ).toBe(false);
    }
  });

  it("names modules that exist and are not already dead code", () => {
    // A dormant register pointing at deleted files would pass forever and guard nothing.
    for (const entry of DORMANT_MODULES) {
      const source = readFileSync(path.join(ROOT, entry.module), "utf8");
      expect(source.length, `${entry.module} is empty`).toBeGreaterThan(100);
      expect(entry.whyDormant.length, `${entry.module} is dormant without a reason`).toBeGreaterThan(
        80,
      );
      expect(
        entry.whatWouldMakeItLive.length,
        `${entry.module} has no route back to being live`,
      ).toBeGreaterThan(40);
    }
    expect(DORMANT_MODULES.length).toBeGreaterThanOrEqual(5);
  });

  it("would fire if a route did reach one", () => {
    // Non-vacuity for the check above, without touching the tree: the same comparison run
    // against a module every console route DOES reach must report it.
    const live = "src/console/store.ts";
    const reachedAnywhere = new Set(reach.flatMap((r) => r.files));
    expect(reachedAnywhere).toContain(live);
    const woken = reach.filter((r) => r.files.includes(live)).map((r) => r.route);
    expect(woken.length).toBeGreaterThan(10);
  });

  it("keeps the build-time document generators off every request path", () => {
    // W107 refuses the PACKAGE; this names the module, which says WHICH route did it and catches
    // the case W107 was founded on — a page importing three plain numbers from a `docx` carrier.
    const carriers = DORMANT_MODULES.map((d) => d.module).filter(
      (m) => m.startsWith("src/collateral/") || m === "src/report/weekly.ts",
    );
    expect(carriers).toHaveLength(3);
    for (const carrier of carriers) {
      const source = readFileSync(path.join(ROOT, carrier), "utf8");
      expect(source, `${carrier} no longer carries a build-time package`).toMatch(
        /from "(docx|pptxgenjs)"/,
      );
    }
  });
});

describe("W271 what the register refuses is written down", () => {
  it("names the seven shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_REACH_SHAPES).sort()).toEqual([
      "a_deny_list_instead_of_an_allowance",
      "dormancy_by_area",
      "ignoring_the_stale_direction",
      "one_row_per_route",
      "skipping_the_layout_chain",
      "the_aggregate_walk",
      "the_allowance_as_a_measurement",
    ]);
    for (const [name, why] of Object.entries(REFUSED_REACH_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_REACH_SHAPES.ignoring_the_stale_direction).toContain("W102");
  });

  it("answers per route through the exported walk rather than a private one", () => {
    // `reachOfRoute` is the unit of the register; `reachByRoute` and `diffReach` are built on it,
    // so a caller can ask about one route without re-deriving anything.
    const surface = discoverSurfaces(APP).find((s) => s.path === "/finder")!;
    expect(reachOfRoute(ROOT, surface)).toEqual(byRoute.get("/finder"));
  });
});

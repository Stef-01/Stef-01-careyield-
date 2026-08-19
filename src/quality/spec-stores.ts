// W359: two specs sharing a store.
//
// A SPEC'S PREMISE IS NOT ONLY WHAT IT WROTE — IT IS ALSO WHAT NOBODY ELSE LEFT BEHIND. The mock
// stores this suite runs against are process-wide and the specs run in one process, so a page that
// renders a store's contents renders whatever the last spec to touch it left there. A spec that
// resets what it reads is answering about itself. A spec that does not is answering about the file
// that happened to run before it, and the answer changes when somebody renames a file.
//
// W346 IS THE CASE, and it is mine. `waiting-path.spec.ts` passed on its own and failed in the full
// suite, because it walked pages that render the referral rail and reset only the console. The fix
// was one line. What made it worth a unit is that the failure was LOUD BY LUCK: the residue
// happened to contradict an assertion. Residue that merely AGREES with what a spec expects is the
// same defect passing, and there is nothing in a green run that distinguishes them — W358 built the
// readback for the premise a spec stages, and this is the other half, the premise it inherits.
//
// THE DEPENDENCE IS DERIVED, NOT LISTED. For each route a spec visits, the walk from that page
// stops at the first store module rather than passing through it: `complaints/store.ts` imports
// `booking/store.ts`, and a closure that traverses stores reports every console page as depending
// on nearly all of them. That is the superset failure W353 named — a wrong answer bigger than the
// right one — and it is the difference between eight gaps worth reading and thirty nobody would.
//
// `src/lib/stores.ts` IS NOT A DEPENDENCE, AND THE WALK DOES NOT PASS THROUGH IT. It is W51's
// reset registry: a page importing it is a page that CLEARS every store, which is the opposite of
// reading one. Its own path is not store-shaped, so what the skip buys is the traversal — without
// it the walk goes through the barrel into every store the barrel resets, and the demo launcher,
// the one page whose whole job is a clean slate, becomes the worst offender in the register.
//
// WHAT THIS DOES NOT PROVE is `RESIDUE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Synthetic stores behind `assertMockRoutesEnabled`.

import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveFirstParty, stripComments } from "@/security/reachability";
import { pageSpecFiles } from "./tree-walks";

/** W51's registry of resetters. A page importing it clears stores; it does not read one. */
export const RESET_REGISTRY = "src/lib/stores.ts";

const isStore = (rel: string): boolean => /^src\/.+\/store\.ts$/.test(rel);

/**
 * The stores a page reads, walking from the page and STOPPING at each store.
 *
 * Stores import each other — `complaints/store.ts` reads bookings — so a closure that passes
 * through one attributes its neighbours' contents to every page that reaches it. Stopping is what
 * makes the answer the page's own dependence rather than the store graph's transitive hull.
 */
export function routeStores(root: string, route: string): string[] {
  const entry = path.join(root, "app", route.replace(/^\//, ""), "page.tsx");
  const found = new Set<string>();
  const seen = new Set([entry]);
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    let source: string;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const match of stripComments(source).matchAll(/from\s*"([^"]+)"/g)) {
      const resolved = resolveFirstParty(match[1]!, file, root);
      if (resolved === null) continue;
      const rel = resolved.slice(root.length + 1);
      if (rel === RESET_REGISTRY) continue;
      if (isStore(rel)) {
        found.add(rel);
        continue;
      }
      if (!seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
  }
  return [...found].sort();
}

/**
 * The stores a `/api/mock/<name>` POST puts back.
 *
 * Read off the route's IMPORTS rather than its closure: a route that imports `resetX` from a store
 * clears it, and one that imports a reader from the same store does not. `/api/mock/console` is the
 * bundle — console, privacy, complaints, registers and the capability graph's interest state ride
 * along with it — and that bundling is exactly why a spec cannot be assumed to reset what it reads.
 */
export function mockResets(root: string, name: string): string[] {
  const file = path.join(root, "app/api/mock", name, "route.ts");
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const found = new Set<string>();
  for (const match of stripComments(source).matchAll(/import\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
    if (!/\breset[A-Z]/.test(match[1]!)) continue;
    const resolved = resolveFirstParty(match[2]!, file, root);
    if (resolved === null) continue;
    const rel = resolved.slice(root.length + 1);
    if (isStore(rel)) found.add(rel);
  }
  return [...found].sort();
}

/**
 * The routes a spec drives the browser to.
 *
 * TWO SPELLINGS, BECAUSE THE CASE THIS UNIT COMES FROM USES THE SECOND. Most specs write
 * `goto("/console/x")`. The path specs — W346's among them — iterate a register they import and
 * call `goto(step.route)`, so the routes they visit appear nowhere in the spec's own text. Reading
 * only the literals would have made this register silent on exactly the failure it exists for.
 *
 * The imported half is SCOPED TO THE CONSTANT the spec names: `demo/path.ts` exports five path
 * registers, and a spec that imports a single register walks that register. Taking every route
 * would give `waiting-path.spec.ts` the whole demo path — the superset W353 named, arriving by a
 * different door than the store graph did.
 */
export function specRoutes(root: string, source: string): string[] {
  const code = stripComments(source);
  const found = new Set([...code.matchAll(/goto\("([^"]+)"/g)].map((m) => m[1]!.split("?")[0]!));
  for (const imported of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*"(\.\.\/src\/[^"]+)"/g)) {
    const module = path.join(root, imported[2]!.replace(/^\.\.\//, "") + ".ts");
    let registers: string;
    try {
      registers = stripComments(readFileSync(module, "utf8"));
    } catch {
      continue;
    }
    for (const raw of imported[1]!.split(",")) {
      const name = raw.trim().split(/\s+as\s+/)[0]!.trim();
      if (!/^[A-Za-z_$][\w$]*$/.test(name)) continue;
      const at = registers.indexOf(`export const ${name}`);
      if (at === -1) continue;
      const next = registers.indexOf("\nexport ", at + 1);
      const body = registers.slice(at, next === -1 ? registers.length : next);
      for (const route of body.matchAll(/\broute:\s*"([^"]+)"/g)) found.add(route[1]!.split("?")[0]!);
    }
  }
  return [...found].sort();
}

/** The mock routes a spec POSTs to, which is how a spec puts a store back. */
export function specMocks(source: string): string[] {
  return [...new Set([...stripComments(source).matchAll(/post\("\/api\/mock\/([a-z-]+)/g)].map((m) => m[1]!))].sort();
}

/** Every store a spec reads and does not put back itself. */
export function specGaps(root: string, spec: string): string[] {
  const source = readFileSync(path.join(root, spec), "utf8");
  const reset = new Set(specMocks(source).flatMap((name) => mockResets(root, name)));
  return specRoutes(root, source)
    .flatMap((route) => routeStores(root, route))
    .filter((store, i, all) => all.indexOf(store) === i && !reset.has(store))
    .sort();
}

/** Why a spec is allowed to read a store it does not reset. */
export interface SpecStore {
  spec: string;
  store: string;
  why: string;
}

export interface ResidueDefect {
  spec: string;
  store: string;
  what: string;
}

/**
 * The gaps this suite really has, each argued.
 *
 * A ROW IS AN ARGUMENT, NOT AN EXEMPTION. Every one of these says what makes the spec's answer
 * independent of what ran before it — a launcher that clears every store itself, or an assertion
 * about a refusal that no contents could change. The three gaps that had no such argument were
 * fixed in this unit rather than written down.
 */
export const RESIDUE_AT_W359: readonly SpecStore[] = [
  {
    spec: "e2e/demo.spec.ts",
    store: "src/booking/store.ts",
    why: "The demo launcher IS the reset. `/demo` calls every resetter in W51's `STORE_RESETTERS` when it starts a run, so this spec's premise is established by the page it walks rather than by a mock POST — and a mock reset call before it would be resetting a store the page is about to reset again. The dependence is real and the order-independence is real too; what makes this a row rather than a fix is that the mechanism is the product's, not the suite's.",
  },
  {
    spec: "e2e/demo.spec.ts",
    store: "src/console/store.ts",
    why: "The same launcher and the same registry entry, for the console. Named per store rather than per spec because a store LEAVING the launcher's registry is the event this row exists to catch, and a single spec-level excuse would survive it.",
  },
  {
    spec: "e2e/demo.spec.ts",
    store: "src/ops/store.ts",
    why: "The same launcher again, for the operations store. Third of three rather than folded in, for the reason above: `STORE_RESETTERS` is checked by `stores.test.ts` against the tree's own `reset*` exports, so the argument holds only while the store is in it.",
  },
  {
    spec: "e2e/demo-path.spec.ts",
    store: "src/booking/store.ts",
    why: "The demo path walks the same launcher, so the same argument holds: the run it asserts about begins with every store cleared by `/demo` itself. Recorded separately from `demo.spec.ts` because two specs sharing an argument is how one of them keeps an excuse it has stopped earning.",
  },
  {
    spec: "e2e/demo-path.spec.ts",
    store: "src/console/store.ts",
    why: "The same, for the console store. The spec walks the launcher and then the console it produced, and the launcher's reset is what makes the second half about the first rather than about whatever ran before.",
  },
  {
    spec: "e2e/demo-path.spec.ts",
    store: "src/ops/store.ts",
    why: "The same, for the operations store, on the same launcher. Named for the same reason: the argument is about a registry entry, and a registry entry can go.",
  },
  {
    spec: "e2e/demo-path.spec.ts",
    store: "src/complaints/store.ts",
    why: "The same launcher, for the complaints store — which `demo.spec.ts` does not reach because the path this spec walks goes one screen further, through the complaint the demo records. The launcher clears it on the same registry pass, and the row exists separately because the two specs really do read different sets and an argument copied across them would stop being checked.",
  },
  {
    spec: "e2e/interest.spec.ts",
    store: "src/interest/store.ts",
    why: "NO RESET EXISTS. `src/interest/store.ts` is file-backed rather than in-memory and exports no `reset*` at all, so no mock route can put it back and no spec can ask for it. What makes this safe is what the spec asserts: every walk here is about the page REFUSING — a signed-out visit redirecting, an export returning 403, the operator page rendering `interest-refused` — and a refusal is a property of the gate rather than of the contents behind it. No residue any other spec could leave changes a refusal.",
  },
  {
    spec: "e2e/public-sweep.spec.ts",
    store: "src/interest/store.ts",
    why: "The same store, unresettable for the same reason, in a spec that never renders its contents either: the sweep visits the public pages and asserts what they must NOT say. An assertion that a page carries no clinical claim and no testimonial is about the page's copy, and a signup another spec left on disk cannot put words on it.",
  },
];

/**
 * Where the register and the suite disagree, in three directions.
 *
 * The second is the one that reads as coverage: a row arguing for a gap the spec has since closed
 * is an excuse for work that was done, and it survives every green run.
 */
export function residueDefects(
  root: string,
  declared: readonly SpecStore[] = RESIDUE_AT_W359,
  specs: readonly string[] = pageSpecFiles(root),
): ResidueDefect[] {
  const out: ResidueDefect[] = [];
  const declaredFor = new Set(declared.map((d) => `${d.spec}::${d.store}`));
  const live = new Map(specs.map((spec) => [spec, specGaps(root, spec)]));

  for (const [spec, gaps] of live) {
    for (const store of gaps) {
      if (!declaredFor.has(`${spec}::${store}`)) {
        out.push({ spec, store, what: "reads a store it does not reset and nothing says why" });
      }
    }
  }
  for (const { spec, store } of declared) {
    const gaps = live.get(spec);
    if (gaps === undefined) {
      out.push({ spec, store, what: "is argued here and the suite no longer holds that spec" });
      continue;
    }
    if (!gaps.includes(store)) {
      out.push({ spec, store, what: "is argued here and the spec resets it, or no longer reads it" });
    }
  }
  return out.sort((a, b) => `${a.spec}${a.store}${a.what}`.localeCompare(`${b.spec}${b.store}${b.what}`));
}

/** What this register does not prove. */
export const RESIDUE_BOUND =
  "IT READS `goto` AND THE REGISTERS A SPEC ITERATES, so a page a spec reaches BY CLICKING A LINK " +
  "is not in its dependence set. Every spec here opens the console with `goto` and several walk on " +
  "by clicking through the nav, so the routes this misses are the ones a link leads to — a real " +
  "gap, and the remedy is a derivation of the link graph rather than of route strings, which is a " +
  "reading of what a link renders as rather than a resolution of a name. THE DEPENDENCE IS AN IMPORT, NOT A READ: a page that imports a store and " +
  "renders none of its contents on the path a spec walks is counted, which makes the register " +
  "conservative in the safe direction and means a clean row is not evidence the page uses the " +
  "store. AND A RESET IS TAKEN AT ITS WORD. `mockResets` reports that a route imports a `reset*` " +
  "from a store, not that its POST calls it on every path — `/api/mock/referrals` returns early " +
  "when asked for an empty rail, after resetting, and nothing here would notice a route that " +
  "returned early BEFORE. What no arrangement of this register can prove is the one thing the " +
  "suite would most like: that residue which AGREES with what a spec expects is absent. A store " +
  "reset to a seeded state is still a state somebody chose, and this checks only that the spec " +
  "chose it.";

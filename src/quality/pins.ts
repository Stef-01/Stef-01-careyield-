// W290: pinned constants that move on a planned event, swept and bounded.
//
// SIX TIMES THIS TREE HAS PINNED A NUMBER THAT AN ORDINARY FIRING MOVES, and each time the same
// thing happened: the build went red on a planned event, somebody edited the number, and the check
// taught nobody anything. W260 pinned how many units were `done` and the very next commit made it
// 243. W273 pinned every Q22 row as `available` and the first firing to CLAIM one turned it red.
// W274 fixed its own predecessor's version of that, one file over, in the same unit. W282 hit the
// quarter-close variant. W287 found three more in W291 — `toBe(6)`, `toBe(21)`,
// `toHaveLength(19)` — that moved the moment a reporter was added.
//
// THE SENTENCE THE TREE KEEPS WRITING IS "a pin whose signal is noise gets edited rather than
// read", and this unit is the sweep that stops it being rediscovered a seventh time.
//
// AND THE FIRST THING THE SWEEP FOUND IS THAT THE UNIT'S OWN FRAMING IS WRONG. The row asks for
// pins "checked to be bounded rather than live", as though live were the defect. `BLOCKED_AT_W263`
// is live — sixteen blocked rows, and a seventeenth fails the build — and it is RIGHT. Its
// docstring says why: *"a new blocked row fails here until somebody moves this number, and moving
// it means having written its release path."* A new founder-gate blocker is not an ordinary event.
// It is a decision arriving, and stopping the build is the control working.
//
// So the property is not live-versus-bounded. It is: **WHAT EVENT MOVES THIS PIN, AND DOES THAT
// EVENT DESERVE TO STOP THE BUILD?** Three answers, and each pin has to pick one and argue it:
//
//   * `range_bound` — it caps a document's scope, so ordinary growth happens OUTSIDE it. The four
//     `*_LAST_UNIT` pins are this: DOSSIER-1's remedy, a point-in-time document saying which
//     moment it prices so a later quarter is not reported as a defect in an earlier plan.
//   * `floor` — a lower bound. Growth is above it and never moves it. The year-boundary constants.
//   * `live_by_design` — an ordinary-looking event DOES move it, and stopping the build is the
//     point. It must name the event and argue that a person should be interrupted by it. Two
//     qualify: `BLOCKED_AT_W263`, whose argument is its own, and `UNPROVEN_AT_W290` — which this
//     unit created, by replacing a bad pin with a good one (see below).
//
// A pin that fits none of the three is the defect: it moves on routine work and nobody decided
// that it should.
//
// WHAT THE SWEEP CANNOT SEE, MEASURED RATHER THAN CONCEDED. It finds NAMED constants matching the
// tree's pin conventions. Five of the six historical instances were bare numeric literals inside
// test files — `expect(walkProven().length).toBe(17)` has no constant to find — so this sweep
// would have caught **none of them**. `HISTORY` below records each one and whether a named-constant
// sweep would have reported it, because "we swept for pins" and "we swept for the pins that have
// names" are different claims and only one of them is true here.
//
// WHICH IS WHY THE SEVENTH INSTANCE, FOUND WHILE WRITING THIS, WAS FIXED RATHER THAN BUMPED. The
// census asserted `walkProven().length` and its comment had been amended by five consecutive units
// explaining why the number moved — every movement a register arriving ALREADY PROVED, the outcome
// W282 was aiming for, reported as a failure each time. It is `UNPROVEN_AT_W290` now: a list of
// NAMES that a proved arrival does not touch and an unproven one does.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads constant declarations.

import { readFileSync } from "node:fs";
import path from "node:path";
import { typescriptFiles } from "./tree-walks";

/**
 * The naming conventions this tree uses for a pin.
 *
 * Conventions rather than a guess at intent: `_AT_W<n>` records a measurement taken at a unit,
 * `_LAST_UNIT` and `_FIRST_UNIT` bound a range, `_SURFACE_FLOOR` is W270's. A number with none of
 * these in its name is invisible here, which is the bound stated above.
 */
export const PIN_NAME = /^[A-Z][A-Z0-9_]*(_AT_W\d+|_LAST_UNIT|_FIRST_UNIT|_SURFACE_FLOOR)$/;

export type PinClassification =
  | { kind: "range_bound"; why: string }
  | { kind: "floor"; why: string }
  | { kind: "live_by_design"; movedBy: string; whyStopping: string };

export interface DeclaredPin {
  /** Repo-relative module the pin is exported from. */
  module: string;
  name: string;
  classification: PinClassification;
}

export interface FoundPin {
  module: string;
  name: string;
}

/** Every pin-named exported constant in the tree, tests included. */
export function pinsInTree(root: string): FoundPin[] {
  const found: FoundPin[] = [];
  for (const file of typescriptFiles(root)) {
    const module = path.relative(root, file).split(path.sep).join("/");
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/^export const ([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=/gm)) {
      const name = match[1]!;
      if (PIN_NAME.test(name)) found.push({ module, name });
    }
  }
  return found.sort((a, b) => `${a.module}::${a.name}`.localeCompare(`${b.module}::${b.name}`));
}

export const PINS: readonly DeclaredPin[] = [
  {
    module: "src/compliance/cdss-boundary.ts",
    name: "Y4_FIRST_UNIT",
    classification: {
      kind: "floor",
      why: "The first unit of Y4. Membership in W200's copy surface is `unit >= this`, so every module added after it is INSIDE the check and none of them moves the number. W270 separated the floor's two jobs and kept this one as the year boundary.",
    },
  },
  {
    module: "src/compliance/copy-y6.ts",
    name: "Y6_FIRST_UNIT",
    classification: {
      kind: "floor",
      why: "The first unit of Y6, used to band the copy surface by year. A lower bound: units arrive above it and it never moves.",
    },
  },
  {
    module: "src/compliance/copy-y6.ts",
    name: "COPY_SURFACE_FLOOR",
    classification: {
      kind: "floor",
      why: "W270's separation of two questions that shared one constant: `Y4_FIRST_UNIT` answers which year a module is from, and this answers whether the copy register must cover it. Same value, different jobs, and a floor either way — W281's four adopted modules came in above it rather than moving it.",
    },
  },
  {
    module: "src/compliance/rail-y5.ts",
    name: "Y5_FIRST_UNIT",
    classification: {
      kind: "floor",
      why: "The first unit of Y5, the canonical copy. Growth is above it. It is also declared in `src/privacy/adm-y5.ts`, which is a duplicate the tree keeps deliberately and checks — see `DUPLICATE_PINS`.",
    },
  },
  {
    module: "src/privacy/adm-y5.ts",
    name: "Y5_FIRST_UNIT",
    classification: {
      kind: "floor",
      why: "The privacy register's copy of the Y5 boundary, kept in step with `compliance/rail-y5.ts` by an assertion in `adm-y5.test.ts` rather than by hoping. A floor, and duplicated on purpose so the privacy registers do not import the compliance ones for a number.",
    },
  },
  {
    module: "src/quality/gate-dossier-y5.test.ts",
    name: "Y5_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "Caps the Y5 dossier's arithmetic at W260 so Y6's units are outside its scope. W208's finding: a point-in-time document pinned against a LIVE ledger goes red on a planned expansion, and the document had not become wrong — the check had.",
    },
  },
  {
    module: "src/quality/horizon-q22.test.ts",
    name: "Q22_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "Says which moment Q22's expansion priced, so Q23's expansion is not reported as a defect in Q22's plan. Added by W282 after the quarter-close test pinned a row STATUS and went red on the first firing to claim one.",
    },
  },
  {
    module: "src/quality/horizon-q23.test.ts",
    name: "Q23_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "The same bound for Q23, carried forward by W286 rather than rediscovered — which is the convention working.",
    },
  },
  {
    module: "src/quality/horizon-y6.test.ts",
    name: "Y6_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "Bounds what W260 recorded to W273, so every later expansion is outside it. Named in W210's register as DOSSIER-1's shape.",
    },
  },
  {
    module: "src/quality/empty-list-sweep.ts",
    name: "UNEVIDENCED_AT_W293",
    classification: {
      kind: "live_by_design",
      movedBy:
        "An empty-list assertion arriving with no evidence its source can fill, or one of the 131 named rows gaining a witness and going stale.",
      whyStopping:
        "Both events are decisions and neither is ordinary work. An arrival means somebody has written a control that passes over a list nothing could have filled — the defect the whole unit is about — and the build stopping is the only moment anybody will look at it. A row going stale means the debt shrank, and it has to be deleted deliberately rather than drifting out, because a list that quietly loses rows cannot be read as a measure of anything. It is a NAME list rather than a count for W290's own reason: a count here would be edited by whoever next made the suite red, and the edit would look like maintenance.",
    },
  },
  {
    module: "src/quality/register-census.ts",
    name: "UNPROVEN_AT_W290",
    classification: {
      kind: "live_by_design",
      movedBy:
        "A register arriving whose walk has never been shown a file, or an existing one losing its proof.",
      whyStopping:
        "This pin is what W290 REPLACED a bad one with, so it is worth saying why the replacement is the good shape. The census used to assert `walkProven().length`, and five consecutive units amended that assertion's comment to explain why the number had moved — every movement a register arriving ALREADY PROVED, which is the outcome W282 was aiming for, reported as a failure each time. Naming the unproven set instead inverts which events are quiet: a proved arrival does not touch it, and an unproven one does. That second event is precisely what W267 exists to catch, so interrupting somebody for it is the control rather than the noise.",
    },
  },
  {
    module: "src/quality/blocked-surface.ts",
    name: "BLOCKED_AT_W263",
    classification: {
      kind: "live_by_design",
      movedBy: "A seventeenth blocked ledger row — a unit hitting a founder gate that has no release path written yet.",
      whyStopping:
        "This is the one pin in the tree that SHOULD stop a build, and its own docstring makes the argument better than a classification can: a new blocked row fails here until somebody moves the number, and moving it means having written the release path. A new founder-gate blocker is not ordinary work; it is a decision arriving, and the whole value of the blocked surface is that its growth is visible on the firing that causes it rather than at an audit two quarters later. Derived instead of pinned, it would grow silently — which is what it did for the three years before W263.",
    },
  },
];

export interface PinDiff {
  /** A pin in the tree that nothing classifies. */
  undeclared: string[];
  /** A classification for a pin the tree no longer exports. */
  stale: string[];
  /** A `live_by_design` pin that does not argue for interrupting somebody. */
  liveWithoutArgument: string[];
  /** A classification with no reason worth the name. */
  unargued: string[];
}

const key = (p: { module: string; name: string }): string => `${p.module}::${p.name}`;

/** Both directions, W102's shape, plus the argument each classification owes. */
export function pinDiff(root: string, declared: readonly DeclaredPin[] = PINS): PinDiff {
  const found = pinsInTree(root).map(key);
  const declaredKeys = declared.map(key);
  const unargued: string[] = [];
  const liveWithoutArgument: string[] = [];
  for (const pin of declared) {
    const c = pin.classification;
    if (c.kind === "live_by_design") {
      if (c.movedBy.trim().length < 20 || c.whyStopping.trim().length < 80) {
        liveWithoutArgument.push(key(pin));
      }
    } else if (c.why.trim().length < 60) {
      unargued.push(key(pin));
    }
  }
  return {
    undeclared: found.filter((f) => !declaredKeys.includes(f)).sort(),
    stale: declaredKeys.filter((d) => !found.includes(d)).sort(),
    liveWithoutArgument: liveWithoutArgument.sort(),
    unargued: unargued.sort(),
  };
}

/**
 * Pin names exported from more than one module, and the file that reconciles them.
 *
 * Duplication is not banned, because `Y5_FIRST_UNIT` is duplicated on purpose so the privacy
 * registers need not import the compliance ones for a number. What IS required is that somebody
 * has tied the copies together — a declaration nobody resolves reads as coverage (W207, W258), so
 * the reconciling file is named here and required to import both.
 */
export const DUPLICATE_PINS: Readonly<Record<string, string>> = {
  Y5_FIRST_UNIT: "src/privacy/adm-y5.test.ts",
};

/** Duplicated pin names the register does not reconcile, and reconcilers that do not resolve. */
export interface DuplicateDiff {
  /** A pin name exported from two modules that `DUPLICATE_PINS` does not reconcile. */
  unreconciled: string[];
  /** A named reconciler that does not exist, or does not reach every declaration it reconciles. */
  unresolved: string[];
}

export function duplicateDiff(
  root: string,
  declared: Readonly<Record<string, string>> = DUPLICATE_PINS,
): DuplicateDiff {
  const byName = new Map<string, string[]>();
  for (const pin of pinsInTree(root)) {
    byName.set(pin.name, [...(byName.get(pin.name) ?? []), pin.module]);
  }
  const duplicated = [...byName.entries()].filter(([, modules]) => modules.length > 1);
  const unresolved: string[] = [];
  for (const [name, reconciler] of Object.entries(declared)) {
    const modules = byName.get(name) ?? [];
    let text: string;
    try {
      text = readFileSync(path.join(root, reconciler), "utf8");
    } catch {
      unresolved.push(`${name}: ${reconciler} does not exist`);
      continue;
    }
    // The reconciler must reach BOTH declarations, which is the only thing that makes it one.
    const reaches = modules.filter((m) => text.includes(m.replace(/^src\//, "@/").replace(/\.ts$/, "")) || text.includes("./" + path.basename(m, ".ts")));
    if (reaches.length < modules.length) unresolved.push(`${name}: ${reconciler} does not import all ${modules.length} declarations`);
  }
  return {
    unreconciled: duplicated.map(([name]) => name).filter((n) => !(n in declared)).sort(),
    unresolved: unresolved.sort(),
  };
}

export interface HistoricPin {
  unit: string;
  what: string;
  /** Would a sweep for NAMED pin constants have reported it? The honest answer, per instance. */
  namedConstant: boolean;
}

/**
 * The six instances, and whether this sweep would have caught each.
 *
 * Measured rather than conceded. One of six — and saying so is the difference between "we swept
 * for pins" and "we swept for the pins that have names", which are different claims.
 */
export const HISTORY: readonly HistoricPin[] = [
  {
    unit: "W260",
    what: "The Y6 horizon document pinned how many units were `done`. The next commit made it one more, and the document had not become wrong.",
    namedConstant: false,
  },
  {
    unit: "W273",
    what: "The quarter-close test asserted every added Q22 row was still `available`. The first firing to CLAIM one turned it red — a status, not a property of the expansion.",
    namedConstant: false,
  },
  {
    unit: "W274",
    what: "Fixed W273's version of the same defect one file over, in the same quarter, and hit it again on a unit that was mid-build.",
    namedConstant: false,
  },
  {
    unit: "W282",
    what: "The Q22 horizon test pinned row status again; corrected to assert that every planned unit EXISTS, which is what a session needs in order to claim one.",
    namedConstant: false,
  },
  {
    unit: "W285",
    what: "`walkProven().length` and the composed-copy site count, both bare literals, both moved by an ordinary register addition.",
    namedConstant: false,
  },
  {
    unit: "W287",
    what: "Three in W291 — the reporter count, the branch count and the driven count — all moved by adding one violation reporter. Restated as the properties they meant: the census sees reporters, ids are unique, everything is driven but the two declared undrivable.",
    namedConstant: false,
  },
];

/** What a green sweep here does not prove. */
export const SWEEP_BOUND =
  "This finds constants whose NAMES follow the tree's pin conventions. Every one of the six " +
  "recorded instances was a bare numeric literal inside a test — `toBe(6)`, `toHaveLength(19)` — " +
  "so a named-constant sweep would have caught none of them, which `HISTORY` records per " +
  "instance rather than as a caveat. What this does buy: the ten pins that DO have names now " +
  "each carry an argument for what moves them, the one that is live by design says why " +
  "interrupting somebody is right, and a new pin-named constant cannot arrive unclassified. " +
  "Catching the literals needs an assertion-level detector over expected values, which is W288's " +
  "tautology sweep grown a second question and belongs in its own unit.";

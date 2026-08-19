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
// is live — eighteen blocked rows, and a nineteenth fails the build — and it is RIGHT. Its
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
// WHAT THIS DOES NOT PROVE is `SWEEP_BOUND`, exported below and read by W297's register.
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
    module: "src/quality/declaration-tax.ts",
    name: "AUTHOR_TAX_AT_W313",
    classification: {
      kind: "floor",
      why: "W313's instrument, frozen the way W300's and W308's are and for the same reason: a later unit that moves it adds a row to `MOVED_SINCE_W313` rather than editing the record, because a record somebody edits to match the tree is not a record. This is the file-count half; the two beside it are the register-count halves.",
    },
  },
  {
    module: "src/quality/declaration-tax.ts",
    name: "TAX_AT_W300",
    classification: {
      kind: "floor",
      why: "A FROZEN MEASUREMENT, which is the one shape of pinned number this tree wants: W300 records what a module cost when Q24 opened and W308 re-derives the live figure against it. A baseline that moved with the tree would destroy the comparison it exists for, so this one is supposed to be stale — the opposite of every other pin here, and the reason it is classified rather than left to be read as a live count.",
    },
  },
  {
    module: "src/quality/declaration-tax.ts",
    name: "TAX_AT_W308",
    classification: {
      kind: "floor",
      why: "THE SECOND FROZEN MEASUREMENT, and the pair is the point: W300 recorded what a module cost when Q24 opened, this records what it costs at the close, and the difference is the quarter's result. It is checked against the live figure by its own test — so unlike the baseline beside it, this one is supposed to be TRUE today and a shape that moves after it adds a row to `MOVED_SINCE_W308` rather than editing this.",
    },
  },
  {
    module: "src/quality/declaration-tax.ts",
    name: "EDIT_SITES_AT_W308",
    classification: {
      kind: "floor",
      why: "The other number W308 recorded — the files an author edits, per module added this quarter — and each entry is re-derived from `namingSites` by its own test rather than trusted. It is a record of a measurement rather than a size somebody pinned, which is the distinction W304 drew: what would be wrong here is a count of registers, and this counts files against a module named beside it.",
    },
  },
  {
    module: "src/quality/quarter-mutants.ts",
    name: "QUARTER_AT_W332",
    classification: {
      kind: "range_bound",
      why: "The quarter this unit measured, bounding its own population from the first line — the same shape every horizon test uses. It is a pair of ledger row ids rather than a count, and the suite resolves both ends against the ledger, so a mistyped range fails rather than silently measuring a different quarter.",
    },
  },
  {
    module: "src/quality/quarter-mutants.ts",
    name: "SURVIVORS_AT_W332",
    classification: {
      kind: "live_by_design",
      movedBy: "a mutant surviving that did not before, or a suite improving until one is caught",
      whyStopping:
        "A NAMED LIST of the mutants the quarter's own suites did not catch, each with its kind and its argument, so neither direction can be satisfied by retyping a digit — which is the property W304 draws the line on. A new survivor is a change nothing in this tree noticed and it has to be READ before it can be written down; a survivor leaving means somebody's test got better and the register should say so. Both are events worth stopping a build for, which is what the class is for.",
    },
  },
  {
    module: "src/quality/horizon-q28.test.ts",
    name: "Q28_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "The last unit the ledger held when Q28's horizon was written, which is what makes every figure in that document a claim about a MOMENT rather than a live count. It is a floor with a ceiling: rows above it are the expansion's own and are excluded on purpose, so the document says what it said on the day. `Q27_HORIZON_LAST_UNIT`'s classification, one quarter on.",
    },
  },
  {
    module: "src/quality/horizon-directions.ts",
    name: "CHECKS_AT_W363",
    classification: {
      kind: "live_by_design",
      movedBy: "the quarter's horizon naming a check it did not name before, or dropping one",
      whyStopping:
        "A NAMED ROW PER TOKEN the document quotes, each either citing W352's settled direction or a test that drives the check to report — and the citation is resolved on every run, so a row cannot rot into a sentence. A token arriving means somebody edited a horizon that is supposed to be frozen the moment its quarter began, which is worth stopping for on its own; a token leaving means the same edit in the other direction. Neither can be satisfied by retyping a digit: the population is derived from the document and compared against the rows both ways.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q27.ts",
    name: "QUARTER_AT_W362",
    classification: {
      kind: "range_bound",
      why:
        "Q27's first and last unit, fixed by the horizon that laid the quarter out and resolved against the ledger by this module's own suite. A quarter does not grow.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q27.ts",
    name: "EXCLUDED_AT_W362",
    classification: {
      kind: "live_by_design",
      movedBy: "a module the quarter added becoming reachable, or a new one arriving that the harness cannot run",
      whyStopping:
        "A NAMED ROW PER MODULE, each saying WHY the sweep cannot reach it and each resolved against the tree — a `runs_the_sweep` row must name the suite `siblingSuite` really finds, and a `no_sibling_suite` row fails the moment one appears. An exclusion arriving is a module nobody is measuring; an exclusion leaving is a module somebody made measurable. Both change what the survivor list below means, and a reader who cannot tell an empty list from an unrun one is the failure this quarter is named after.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q27.ts",
    name: "UNMUTATED_AT_W362",
    classification: {
      kind: "live_by_design",
      movedBy: "a module in the population growing a line one of W296's five operators matches",
      whyStopping:
        "A module the operators find NOTHING to change in gets no verdict, and in a survivor count it reads exactly like a module that was cleared. The row names it and argues what it holds instead — three early returns and two constants, none of them an equality, a boolean join, a comparison or an arithmetic operator. A module leaving this list has grown a branch the sweep can now measure, which is worth a build stopping for because it changes what the empty survivor list covers.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q27.ts",
    name: "SURVIVORS_AT_W362",
    classification: {
      kind: "live_by_design",
      movedBy: "a mutant surviving the quarter's suites, or a declared survivor being caught",
      whyStopping:
        "EMPTY, AND THE EMPTINESS IS THE CLAIM. Sixty-odd mutants ran and one survived; the remedy was applied in the same unit rather than recorded, because W357 showed what recorded remedies are worth — four written into survivor registers and never built, the oldest since W296. A survivor arriving is a hole somebody has to read; a declared one being caught means the register describes a suite that has moved. Neither can be satisfied by retyping a digit: the list is named rows and the run below re-derives it.",
    },
  },
  {
    module: "src/quality/defaulted-registers.ts",
    name: "DRIVEN_AT_W355",
    classification: {
      kind: "live_by_design",
      movedBy: "a defaulted register starting or stopping being driven from its own module's suite",
      whyStopping:
        "A NAMED ROW PER PARAMETER, each carrying the files that drive it and each re-derived on every run — so neither direction can be satisfied by retyping a digit and a row cannot rot into a sentence. A parameter joining is one whose own suite stopped handing it a value, which is the state W296 found and W306's rule exists against; a parameter leaving means somebody wrote the drive at home, which is work worth noticing. The arm that reports a parameter driven NOWHERE is separate and takes no row at all: twelve of those existed when this unit ran and all twelve were closed, and a thirteenth is a signature promising something nobody has ever collected.",
    },
  },
  {
    module: "src/quality/spec-stores.ts",
    name: "RESIDUE_AT_W359",
    classification: {
      kind: "live_by_design",
      movedBy: "a spec beginning to read a store it does not reset, or one of these gaps being closed",
      whyStopping:
        "A NAMED ROW PER SPEC AND STORE, each arguing what makes that spec's answer independent of what ran before it — a launcher that clears every store itself, or an assertion about a refusal no contents could change. A gap arriving is a spec whose result depends on file order, which is the defect W346 shipped and this unit exists to stop; a gap closing means the argument is now an excuse for work that was done, and it survives every green run unless something says so. Neither direction can be satisfied by retyping a digit: the population is derived from each spec's routes and resets on every run and the rows are compared against it three ways.",
    },
  },
  {
    module: "src/quality/spec-premises.ts",
    name: "PREMISES_AT_W358",
    classification: {
      kind: "live_by_design",
      movedBy: "a spec starting or stopping staging a premise through the browser",
      whyStopping:
        "A NAMED ROW PER SPEC, each saying how that file reads its premise back or why it does not, and each `asserted` row resolved against the file rather than believed. A spec arriving is a walk somebody wrote on a state nothing checked — the defect this unit exists for — and a spec leaving the population means its setup stopped staging, which changes what the row is about. Neither direction can be satisfied by retyping a digit, because there is no digit: the population is derived from each helper's shape on every run and the rows are compared against it both ways.",
    },
  },
  {
    module: "src/quality/unapplied-remedies.ts",
    name: "REMEDIES_AT_W357",
    classification: {
      kind: "live_by_design",
      movedBy: "a survivor recorded `uncaught` with a remedy nobody has built, or one of these being un-applied",
      whyStopping:
        "A NAMED ROW PER REMEDY, each proved by re-applying its mutant and requiring the suite to go red — so neither direction can be satisfied by retyping a digit, and the `applied` half cannot be satisfied by writing the word either, which is W304's line taken one step further. A remedy arriving is a hole somebody described and did not close, and W349 is the receipt for what that costs: W332 recorded one, left it for W331, and W337 copied the pattern into a second module with the gap attached. A remedy leaving means somebody unbuilt it. Both are worth stopping a build for.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q26.ts",
    name: "QUARTER_AT_W349",
    classification: {
      kind: "range_bound",
      why: "The quarter this unit swept, bounding its own population from the first line — `QUARTER_AT_W332`'s shape and its argument, one quarter on. It is a pair of ledger row ids rather than a count, and the suite resolves both ends against the ledger, so a mistyped range fails rather than silently measuring a different quarter.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q26.ts",
    name: "EXCLUDED_AT_W349",
    classification: {
      kind: "live_by_design",
      movedBy: "a module the quarter added gaining or losing a sibling suite, or a suite becoming a mutation run",
      whyStopping:
        "A NAMED ROW PER MODULE THE SWEEP CANNOT REACH, each resolved against the tree: the self-referential one must name a suite that really runs the sweep, and the suiteless one must really have no sibling. Neither direction can be satisfied by retyping a digit, which is W304's line. A module joining the excluded set is a module the sweep stopped measuring, and it has to be READ before its row can be written; a module leaving means somebody gave it a suite, which is the event this register exists to notice rather than tolerate.",
    },
  },
  {
    module: "src/quality/quarter-mutants-q26.ts",
    name: "SURVIVORS_AT_W349",
    classification: {
      kind: "live_by_design",
      movedBy: "a mutant surviving that did not before, or a suite improving until one is caught",
      whyStopping:
        "`SURVIVORS_AT_W332`'s class, one quarter on and for its reasons: a named list of the mutants the quarter's own suites did not catch, each with its kind and its argument. A new survivor is a change nothing in this tree noticed; a survivor leaving means somebody's test got better and the register should say so. W349 is itself the case for the second half — the run found three and one was the hole W332 recorded in another module and nobody closed.",
    },
  },
  {
    module: "src/quality/unasked-facts.ts",
    name: "UNASKED_AT_W340",
    classification: {
      kind: "live_by_design",
      movedBy: "a derivation arriving on the served surface with no reader, or one of these gaining a surface that asks",
      whyStopping:
        "A NAMED ROW PER FACT, each carrying the screen that would ask for it, checked against the import graph in both directions — so neither direction can be satisfied by retyping a digit, which is the property W304 draws the line on. A fact arriving is a computation added to a request-serving module that nothing reads, and it has to be READ before its row can be written. A fact leaving is somebody having built the surface, which is the event this register exists to celebrate rather than to tolerate. Both are worth stopping a build for.",
    },
  },
  {
    module: "src/quality/escape-hatches.ts",
    name: "REVIEWED_AT_W345",
    classification: {
      kind: "live_by_design",
      movedBy: "a hatch arriving in any of the three registers, or one of these being converted",
      whyStopping:
        "A NAMED ROW PER HATCH with the verdict that re-read it, checked against the derived population in both directions, so neither can be satisfied by retyping a digit — the property W304 draws the line on. A hatch arriving is a declaration that a check cannot be made to fail, and this tree's whole finding about them is that nobody goes back: it has to be READ before it can be written down. A hatch leaving means somebody converted it and the row recording the conversion has to say which way. Both are events worth stopping a build for.",
    },
  },
  {
    module: "src/quality/horizon-q27.test.ts",
    name: "Q27_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "The same bound for Q27, carried forward by W338 — the seventh horizon to bound itself from its first line. This one also freezes a moment with somebody else's row open in it: W337 was `claimed` in a sibling session, so the bound alone is not enough and `IN_FLIGHT_AT_EXPANSION` names the row the document did not price.",
    },
  },
  {
    module: "src/quality/horizon-q26.test.ts",
    name: "Q26_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "The same bound for Q26, carried forward by W325 — the sixth horizon to bound itself from its first line. It is what lets a test read the LIVE ledger and still describe the moment its document priced, which is this quarter's own subject: the figures are as-at because the instant a check answers at has to be written down rather than assumed.",
    },
  },
  {
    module: "src/quality/horizon-q25.test.ts",
    name: "Q25_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "The same bound for Q25, carried forward by W312 — the fifth horizon to bound itself from its first line. W312 also had to repair Q24's version, which bounded its unit list correctly and sliced the plan section to a heading that stopped being the next one.",
    },
  },
  {
    module: "src/quality/horizon-q24.test.ts",
    name: "Q24_HORIZON_LAST_UNIT",
    classification: {
      kind: "range_bound",
      why: "The same bound for Q24, carried forward by W299 — the fourth horizon to bound itself from its first line rather than after an expansion went red under it.",
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
    module: "src/quality/mutation-sampling.ts",
    name: "SURVIVORS_AT_W296",
    classification: {
      kind: "live_by_design",
      movedBy:
        "A sampled change to a module going unnoticed by that module's own suite, or a named survivor being caught after somebody improves a test.",
      whyStopping:
        "A new survivor means the suite has a hole a mechanical sample walked straight into, and it is the only direct evidence this tree has that a test would notice anything — stopping the build is the one moment somebody reads it. A survivor going stale means a hole was closed, and the row must be deleted deliberately rather than drifting out, because a list that quietly loses rows cannot be read as a measure. Named rather than counted for W290's own reason: a count moves when the stride moves, and the edit looks like maintenance.",
    },
  },
  {
    module: "src/quality/mutation-sampling.ts",
    name: "UNTESTED_AT_W296",
    classification: {
      kind: "live_by_design",
      movedBy:
        "A module with a mutation site arriving without a sibling test file, or one of the named modules gaining one.",
      whyStopping:
        "A module with no suite of its own contributes no mutants, so it can never produce a survivor and a clean survivor list says nothing whatever about it. That is the vacuity this whole quarter has been about, arriving one level up: the measurement looks complete precisely where it is absent. A module joining the list is a decision somebody should make on purpose, and one leaving it is work worth recording.",
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

// W326: the close inside the gate.
//
// W315 NAMED THE GAP AND THIS UNIT IS THE EVIDENCE THAT NAMING IT WAS NOT ENOUGH. `pnpm verify`
// runs while the unit's row still says `claimed`; the row closes a commit later. W315 built
// `closeRow` and three checks that read the closing text. Then Q25 ended: W323 closed its row,
// W324's `pending` arm fired exactly as it had promised to, and **`main` was red for a firing** —
// because the close happens after the gate and nothing ran the instrument at the close. An
// instrument nobody wires into the moment it describes is a claim about that moment, not a check
// on it. That is Q26's whole subject and this is its first unit.
//
// TWO THINGS ARE DIFFERENT HERE, and both are the gate's own words.
//
//   THE ROW IS PRESENT IN THE TREE THE CHECKS RUN OVER. W315's three checks are REIMPLEMENTATIONS
//   over ledger text, because the originals were welded inside `.test.ts` files and exported
//   nothing. This plants the closing ledger into a COPY of the tree and runs the real, callable
//   checks against it — so what answers is the check itself rather than a second copy of its
//   reasoning, and a check whose behaviour drifts from its reimplementation cannot drift here.
//
//   IT REPORTS WHAT THE CLOSE CHANGES, not what is wrong. Every reader is run twice over the same
//   copied tree, once with the ledger as it stands and once with the row closed, and only the
//   difference is returned. A tree with a pre-existing defect would otherwise report it as
//   something the close broke, which is the reading that makes a closing check noise.
//
// WHAT THE REGISTER COVERS IS DERIVED, NOT LISTED. A module is a ledger reader if it names one of
// the ledger's parse entry points or opens `BUILD-STATE.md` itself; each one is either a watched
// check with a call, or excused in writing. Both directions, W102's shape — because the failure
// mode is a new ledger-reading check nobody added here, which is precisely how W324's arm came to
// be unwatched at the close.
//
// IT RUNS AT TWO MOMENTS, AND BOTH ARE THE POINT. `closeGateDefects` SIMULATES the close, so it is
// meaningful inside `pnpm verify` even though the row is still `claimed` there — that is what makes
// it a gate rather than a post-mortem, and it is the arm that would have caught the Q25 close. And
// `pnpm verify:close` runs the same check again at the actual close, after the row is written and
// before the push, for the cases the simulation's placeholder SHA cannot stand in for.
//
// THE SCRIPT DELEGATES TO VITEST RATHER THAN SHELLING OUT LIKE `audit-gate.mts`. Node's type
// stripping does not resolve this tree's `@/` alias, and the import closure below is full of it —
// W326 measured eighty-one of them using the alias, out of everything this module pulls in. A
// resolver hook would be new machinery for a one-line job. Running the existing, tested assertion
// by name costs nothing and cannot drift from it.
//
// THAT SENTENCE FIRST SAID `four modules`, WHICH WAS A NUMBER NOBODY MEASURED. It was written from
// the two aliased imports visible at the top of this file, and the closure is two orders larger.
// W314's register caught it because "modules" is a countable noun, which is the only reason it was
// not shipped — the quarter after the quarter about numbers in prose.
//
// WHAT THIS DOES NOT PROVE is `CLOSE_GATE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the ledger and plants a rewritten copy of it
// into a temporary tree.

import { readFileSync } from "node:fs";
import path from "node:path";
import { rmSync } from "node:fs";
import { stripComments } from "@/security/reachability";
import { sourceModules, testModules } from "./tree-walks";
import { copyTree, withPlantedIn } from "./planting";
import { PLACEHOLDER_SHA, closeRow, unitsInFlight } from "./closing-state";
import { blockedSurfaceViolations } from "./blocked-surface";
import { staleBounds } from "./bounds";
import { classDefects } from "./claim-classes";
import { FINDINGS as Q25_FINDINGS } from "./hardening-q25";
import { endedDeclarations } from "./self-ending";
import { CLAIMS, claimDefects } from "./prose-numbers";
import { founderDiff } from "@/founder/outstanding";
import { dispositionDefects } from "./deferrals";
import { headerViolations } from "./unit-headers";
import { fired } from "./latent-findings";
import { deadAnchors } from "./latent-y5";
import {
  FINDINGS as Q22_FINDINGS,
  allHardeningFindings,
  overdueDispositions,
  unaccountedUnits,
} from "./hardening-q22";
import { FINDINGS as Q23_FINDINGS } from "./hardening-q23";
import { FINDINGS as Q24_FINDINGS } from "./hardening-q24";
import { FINDINGS as W279_FINDINGS } from "./review-w279";

/** The ledger's parse entry points. A module naming one of these reads the ledger. */
export const LEDGER_PRIMITIVES = [
  "parseLedgerRows",
  "allLedgerRows",
  "blockedRows",
  "BUILD-STATE.md",
] as const;

/**
 * The date `overdueDispositions` is asked about.
 *
 * A LITERAL RATHER THAN `new Date()`, which is W217's rule and matters more here than usual: a
 * closing check that answers differently depending on when it runs is the defect this unit is
 * about, arriving inside the unit about it.
 */
export const CLOSE_GATE_TODAY = "2026-08-18";

const ledgerOf = (root: string) => readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");

/** A check that reads the ledger and can be called from outside. */
export interface LedgerReader {
  /** `module::export`, resolved against the module — a rename fails here. */
  id: string;
  /** What closing a row can do to it, in one sentence a reader can check. */
  why: string;
  run: (root: string) => string[];
}

/**
 * The checks a close is run against.
 *
 * EACH ONE IS A CALL, NOT A DESCRIPTION. W315's checks are reimplementations over ledger text and
 * its bound says so; these are the registers themselves, handed a tree whose `BUILD-STATE.md` is
 * the row as it will be committed.
 */
export const LEDGER_READERS: readonly LedgerReader[] = [
  {
    id: "src/quality/claim-classes.ts::classDefects",
    why: "W324'S GATE, AND THE REASON THIS UNIT EXISTS. Its `pending` arm reads the ledger for the unit it waits on and fails the moment that row says `done`. It did, at the Q25 close, one commit after a green gate.",
    run: (root) => classDefects(root).map((d) => `${d.unit} ${d.what}`),
  },
  {
    id: "src/quality/hardening-q25.ts::FINDINGS",
    why: "W331's pass, whose deferrals point at W334 and W336. It is here as its own reader rather than folded into the aggregate above BECAUSE folding it in would not have named the module: `readerDiff` keys on the module in a reader's id, so a register whose findings are checked through somebody else's reader reads as unwatched — which is how W326 reported this one the day it was written.",
    run: (root) =>
      overdueDispositions(ledgerOf(root), Q25_FINDINGS, CLOSE_GATE_TODAY).map((d) => `${d.finding} ${d.what}`),
  },
  {
    id: "src/quality/self-ending.ts::endedDeclarations",
    why: "W330's register, which is the generalisation of the arm above and of W324's below it: every declaration in this tree that is true only until something happens, read against the event. A close is the event for the whole `unit_lands` half of it, so a row closing is precisely when this can start reporting.",
    run: (root) => endedDeclarations(root),
  },
  {
    id: "src/quality/hardening-q22.ts::overdueDispositions",
    why: "W318's clock. A finding deferred to a unit is overdue the moment that unit's row closes — so the close is exactly the event it watches, and it fired on two findings at the Q25 close.",
    run: (root) =>
      overdueDispositions(
        ledgerOf(root),
        allHardeningFindings([Q22_FINDINGS, Q23_FINDINGS, Q24_FINDINGS, W279_FINDINGS]),
        CLOSE_GATE_TODAY,
      ).map((d) => `${d.finding} ${d.what}`),
  },
  {
    id: "src/quality/deferrals.ts::dispositionDefects",
    why: "W329's standings. Closing a row moves the unit a disposition cites from `in_flight` to `landed`, and a close that renamed or dropped a row would leave a fix or a deferral citing something the ledger no longer has — a citation that resolves at the gate and not a commit later.",
    run: (root) =>
      dispositionDefects(
        ledgerOf(root),
        allHardeningFindings([Q22_FINDINGS, Q23_FINDINGS, Q24_FINDINGS, W279_FINDINGS]),
      ).map((d) => `${d.finding} ${d.what}`),
  },
  {
    id: "src/quality/bounds.ts::staleBounds",
    why: "W308's defect exactly: a bound whose `stillOpen` reads the ledger answers differently once the row it reads is closed, so the bound goes stale in the commit that ships it.",
    run: (root) => staleBounds(root).map((d) => `${d.bound} ${d.what}`),
  },
  {
    id: "src/quality/prose-numbers.ts::claimDefects",
    why: "A `derived` prose claim about the blocked surface is re-derived from the ledger, so a row changing status moves the number a header states.",
    run: (root) => claimDefects(root, CLAIMS).map((d) => `${d.claim} ${d.what}`),
  },
  {
    id: "src/quality/blocked-surface.ts::blockedSurfaceViolations",
    why: "W263's budget counts blocked rows and every release path names units by id. A close that blocked a row, or closed one a path still names, reads here.",
    run: (root) => blockedSurfaceViolations(root),
  },
  {
    id: "src/founder/outstanding.ts::founderDiff",
    why: "W310 and W319: the founder's page derives what is outstanding from the ledger in both directions, so a row closing can leave a release path promising work that has landed.",
    run: (root) =>
      Object.entries(founderDiff(root)).flatMap(([arm, ids]) => (ids as string[]).map((id) => `${arm}: ${id}`)),
  },
  {
    id: "src/quality/unit-headers.ts::headerViolations",
    why: "W281 resolves every module header's unit against the units the ledger holds, so the set it checks against changes with the ledger.",
    run: (root) => headerViolations(root, ledgerOf(root)),
  },
  {
    id: "src/quality/latent-findings.ts::fired",
    why: "A latent finding's trigger is a predicate over the tree, and several read the ledger. A close that made one true would ship a known condition unremarked.",
    run: (root) => {
      void root;
      return fired().map((f) => `${f.id} fired`);
    },
  },
  {
    id: "src/quality/latent-y5.ts::deadAnchors",
    why: "W295's anchors say which assertion would notice a finding coming back. An anchor whose condition is keyed to a ledger row goes dead when the row closes.",
    run: (root) => {
      void root;
      return deadAnchors().map((a) => `${a.id} has no live anchor`);
    },
  },
  {
    id: "src/quality/hardening-q22.ts::unaccountedUnits",
    why: "Each hardening register checks that every unit it names is one the ledger holds. A close does not add a unit, but a close that renamed or dropped one would read here — and the same call covers Q23's and Q24's registers, which is why they are excused below rather than repeated.",
    run: (root) => unaccountedUnits(ledgerOf(root)),
  },
];

/** A module that names a ledger primitive and is not a check a close can break. */
export interface ExcusedReader {
  module: string;
  why: string;
}

/**
 * The ledger-naming modules that are not closing checks, each argued.
 *
 * AN EXCUSE IS A SENTENCE SOMEBODY WROTE, which is the difference between this and a filter. W293's
 * lesson: a narrowing nobody can see is one nobody re-reads.
 */
export const NOT_A_CLOSING_CHECK: readonly ExcusedReader[] = [
  {
    module: "src/quality/closing-state.ts",
    why: "W315's harness, and this module's own dependency. It is the thing being run at the close rather than a check the close can break; watching it here would be the tautology W316 exists for.",
  },
  {
    module: "src/quality/close-gate.ts",
    why: "This module. Same reason as `closing-state.ts` and worth stating separately, because a register that quietly omitted itself is exactly the omission W305's manifest is about.",
  },
  {
    module: "src/quality/planting.ts",
    why: "It COPIES `BUILD-STATE.md` into a constructed tree — `COPIED_FILES` names it because four registers read the ledger — and copying a file is not reading a row. Without this the planted trees below would have no ledger at all.",
  },
  {
    module: "src/quality/assertion-drives.ts",
    why: "W289's drive harness. It plants a ledger to make a register speak, so its ledger is a fixture rather than this tree's, and a close changes nothing it reads.",
  },
  {
    module: "src/quality/declaration-tax.ts",
    why: "W300's probe hands `headerViolations` a ledger to measure what an arriving module owes. The ledger is an input to a measurement about a planted module, not a row this tree will close.",
  },
  {
    module: "src/compliance/cdss-boundary.ts",
    why: "Names the path inside a `notCopy` argument — W200 prose describing what the founder's page derives from the ledger and §4. It opens nothing and parses nothing; the string is there so a reviewer of the copy surface knows what that page is made of.",
  },
  {
    module: "src/quality/self-defeating.ts",
    why: "Names `allLedgerRows` inside a `rederived` sentence recording how Q24-CR-5 is now checked — the ledger parse that silently dropped two blocked rows. W317 quotes the function to say where the fix is asserted; it never calls it, and the sweep it does run reads test files rather than the ledger.",
  },
  {
    module: "src/quality/hardening-q23.ts",
    why: "Exports its own `unaccountedUnits`, which the Q22 entry above already covers for every register: the three are the same function over different finding lists, and running all three would report one defect three times.",
  },
  {
    module: "src/quality/hardening-q24.ts",
    why: "The same, for Q24's register. Named separately rather than folded into the line above, because two registers excused by one sentence is the shape where the second stops being read — and Q24's is the register the Q25 close actually fired against.",
  },
  {
    module: "src/quality/blind-spots.ts",
    why: "W295's witnesses. It names `parseLedgerRows` inside the PLANTED SOURCE of the probe that demonstrates this register's own bound — a string literal it writes into a constructed tree, not a call it makes. The derivation strips comments and not literals, which is deliberate: the ledger's own path only ever appears AS a literal, so blanking them would hide every real reader to hide this one.",
  },
  {
    module: "src/quality/manifest.ts",
    why: "W305's declaration point. It names the ledger inside THIS register's census row — the sentence describing what `ledgerNamingModules` walks — so the mention is a description of this module rather than a read of a row. Excused explicitly because a register that quietly skipped the file describing it is the omission W305 exists to stop.",
  },
  {
    module: "src/founder/second-reading.ts",
    why: "W322's diff of what changed since the founder last looked. Its answer is SUPPOSED to move when a row closes — that is the feature — so reporting the movement as breakage would make the check unusable at exactly the moment it is for.",
  },
];

/** Every first-party source module naming a ledger primitive. */
export function ledgerNamingModules(root: string): string[] {
  const out: string[] = [];
  for (const file of sourceModules(root)) {
    const code = stripComments(readFileSync(file, "utf8"));
    if (LEDGER_PRIMITIVES.some((p) => code.includes(p))) {
      out.push(path.relative(root, file).split(path.sep).join("/"));
    }
  }
  return out.sort();
}

/**
 * The `.test.ts` files that read the ledger with their comparison welded inside them.
 *
 * THE BOUND'S OWN SUBJECT, MEASURED. W315 stated this limit and left it as a sentence; naming the
 * files costs a walk and turns "some checks are unreachable" into a list somebody can shorten. It
 * is also the bound's predicate: when this is empty, every ledger-dependent check is callable and
 * the close reaches all of them.
 */
export function weldedLedgerTests(root: string): string[] {
  const out: string[] = [];
  for (const file of testModules(root)) {
    const code = stripComments(readFileSync(file, "utf8"));
    if (LEDGER_PRIMITIVES.some((p) => code.includes(p))) {
      out.push(path.relative(root, file).split(path.sep).join("/"));
    }
  }
  return out.sort();
}

export interface ReaderDiff {
  /** A module that reads the ledger and is neither watched nor excused. */
  unwatched: string[];
  /** A watched or excused module the tree no longer holds as a ledger reader. */
  stale: string[];
}

/** The register against the tree, both directions — W102's shape. */
export function readerDiff(
  root: string,
  readers: readonly LedgerReader[] = LEDGER_READERS,
  excused: readonly ExcusedReader[] = NOT_A_CLOSING_CHECK,
): ReaderDiff {
  const found = new Set(ledgerNamingModules(root));
  const declared = new Set([...readers.map((r) => r.id.split("::")[0]!), ...excused.map((e) => e.module)]);
  return {
    unwatched: [...found].filter((m) => !declared.has(m)).sort(),
    stale: [...declared].filter((m) => !found.has(m)).sort(),
  };
}

/** A check that reports something after the close and did not before it. */
export interface CloseBreak {
  reader: string;
  what: string;
}

/**
 * What closing `unit`'s row would break.
 *
 * THE TREE IS COPIED ONCE AND THE LEDGER PLANTED TWICE, which is not only speed. Running the
 * "before" against the real root and the "after" against a copy would compare two different trees,
 * and any difference between them — a stray file, a path the copy does not carry — would read as
 * something the close did.
 */
export function breaksOnClose(
  root: string,
  unit: string,
  readers: readonly LedgerReader[] = LEDGER_READERS,
  ledger: string = ledgerOf(root),
  sha: string = PLACEHOLDER_SHA,
): CloseBreak[] {
  const copy = copyTree(root);
  try {
    const run = (text: string): Map<string, Set<string>> => {
      const seen = new Map<string, Set<string>>();
      withPlantedIn(copy, { "BUILD-STATE.md": text }, () => {
        for (const reader of readers) seen.set(reader.id, new Set(reader.run(copy)));
      });
      return seen;
    };
    const before = run(ledger);
    const after = run(closeRow(ledger, unit, sha));
    const out: CloseBreak[] = [];
    for (const [reader, defects] of after) {
      for (const what of defects) {
        if (!before.get(reader)?.has(what)) out.push({ reader, what });
      }
    }
    return out.sort((a, b) => `${a.reader}${a.what}`.localeCompare(`${b.reader}${b.what}`));
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

/**
 * What closing every row in flight would break.
 *
 * ONE UNIT AT A TIME, W315's rule: overlapping sessions are normal and a sibling's row closing is
 * not this session's event, so closing both together would let one builder's defect read as the
 * other's.
 *
 * THE READERS AND THE LEDGER ARE PARAMETERS, W289's remedy, and a mutation is why. Welded to the
 * real ledger, this survived being made to close NOTHING: the live tree breaks on no close, so an
 * empty answer and an empty check are the same green — and this is the call `pnpm verify:close`
 * runs. W315 hit the neighbouring version of this and its note says the fix cannot be "assert a row
 * is in flight", because between firings none is and the assertion breaks for being true.
 */
export function closeGateDefects(
  root: string,
  sha: string = PLACEHOLDER_SHA,
  readers: readonly LedgerReader[] = LEDGER_READERS,
  ledger: string = ledgerOf(root),
): CloseBreak[] {
  return unitsInFlight(ledger).flatMap((unit) => breaksOnClose(root, unit, readers, ledger, sha));
}

/** What a green close gate does not prove. */
export const CLOSE_GATE_BOUND =
  "It reaches the checks that are CALLABLE. A check welded inside a `.test.ts` exports nothing, so " +
  "no register here can run it against a planted ledger — and the Q25 close broke one of those " +
  "too: a horizon test's own done count and wait figures answered differently on either side of " +
  "the close, and only running the whole suite afterwards found them. W289's remedy is unchanged " +
  "and is the only thing that lifts this: export the comparison from a module that takes its " +
  "inputs. Until then the welded ones run at the suite's moment and not at the close's, and " +
  "`weldedLedgerTests` NAMES them rather than leaving the limit as a sentence — a list somebody " +
  "can shorten is a different thing from a caveat nobody can act on. SECOND, IT COMPARES " +
  "TWO RUNS AND NOT TWO TRUTHS: a reader that is nondeterministic, or that reads something outside " +
  "the planted ledger which moved between the two runs, reports a difference the close did not " +
  "cause. Q26's own W327 is about that class and this module is one of its subjects. THIRD, THE " +
  "SHA IS A PLACEHOLDER for W315's reason, which is a real circularity: a row carries the hash of " +
  "the commit containing it, and that commit does not exist while the check runs.";

// W352: which way each register fails — loud, or toward looking correct.
//
// EVERY DEFECT Q27 FOUND FAILED TOWARD LOOKING CORRECT. Not one announced itself. W345's bound was
// false from the day it was written and sat behind an excuse that was false too; W340's first
// derivation said thirty-five where the answer was seventy-one, and the error moved the number
// DOWN — fewer unread facts, a healthier tree; W349's population failed open and returned the whole
// repository rather than a quarter, which reads as a bigger answer rather than an error; W335's
// document and its test agreed on the smaller number. A defect that shouts is a defect somebody
// fixes on the day it arrives. A defect that flatters is one that ships.
//
// SO THE QUESTION THIS REGISTER ASKS IS NOT WHETHER A REGISTER IS CORRECT. It is: IF THIS REGISTER
// STOPPED REPORTING, WOULD ANYTHING NOTICE? That is a fact about the machinery around it rather
// than about its logic, and W267's census already holds both halves of the answer — whether the
// walk has been shown a file arriving, and whether the assertion has been driven to fail.
//
//   · Walk proved AND assertion driven → its silence fails a test. LOUD.
//   · Neither proved → nothing in this tree would notice it going quiet. TOWARD LOOKING CORRECT.
//   · One of the two → the register can go quiet in the half nobody drives, and which half decides
//     the direction. That is a reading, so those rows are ARGUED one at a time rather than derived,
//     and the argument is checked for being written rather than for being right.
//
// THE DERIVATION IS THE POINT AND SO IS ITS LIMIT. Most of the census is settled without anybody's
// opinion — the suite asserts that the derived rows outnumber the argued ones rather than freezing
// either figure here, which is W304's rule about counts in prose; and a
// register the census calls LOUD can still fail in a way its one planted instance does not cover,
// which is the sentence `DIRECTION_BOUND` spends most of its length on.
//
// WHAT THIS DOES NOT PROVE is `DIRECTION_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own census.

import type { TreeDerivedRegister } from "./register-census";

/** Which way a register's failure moves. */
export type Direction =
  /** Its silence fails something: a planted instance goes unreported, or a driven arm stops firing. */
  | "loud"
  /** Nothing here notices. The tree reads clean, and cleaner than it was. */
  | "toward_looking_correct";

/** Whether the walk has been shown a file arriving. */
export function walkProved(entry: TreeDerivedRegister): boolean {
  return entry.proof.kind === "mutated_tree";
}

/** Whether the assertion has been driven to fail — either directly or through W291's branches. */
export function assertionDriven(entry: TreeDerivedRegister): boolean {
  return entry.assertion.kind === "driven_here" || entry.assertion.kind === "driven_by_branch";
}

/**
 * The direction the census settles, or `null` where it does not.
 *
 * BOTH HALVES OR NEITHER IS DERIVABLE; one of each is a judgement. A register whose walk is proved
 * and whose assertion is not can still report a planted file while its comparison has quietly
 * stopped deciding — and whether that is loud depends on what the comparison is for, which is a
 * reading of the register rather than a fact about the census.
 */
export function derivedDirection(entry: TreeDerivedRegister): Direction | null {
  const walk = walkProved(entry);
  const assertion = assertionDriven(entry);
  if (walk && assertion) return "loud";
  if (!walk && !assertion) return "toward_looking_correct";
  return null;
}

/** A direction somebody argued, because the census could not settle it. */
export interface ArguedDirection {
  /** The census member, by file. */
  file: string;
  direction: Direction;
  why: string;
}

/**
 * The thirteen the census leaves open, each argued.
 *
 * THE SHAPE OF THE ARGUMENT IS THE SAME EVERY TIME: which half is undriven, and what a reader would
 * see if that half went quiet. Where the undriven half is the COMPARISON, the answer is almost
 * always `toward_looking_correct` — a comparison that stops deciding returns an empty list, and an
 * empty list is what a healthy tree looks like.
 */
export const ARGUED_DIRECTIONS: readonly ArguedDirection[] = [
  {
    file: "src/security/reachability.ts",
    direction: "toward_looking_correct",
    why: "Its walk is planted against and its comparison — which packages a request-serving path can reach — is not driven from outside. An import graph that stops following edges reports a SMALLER reachable set, so a package that became reachable reads as still unreachable and W107's audit surface shrinks quietly. The direction is the one this quarter is named after: the failure makes the tree look safer than it is.",
  },
  {
    file: "src/security/page-reach.ts",
    direction: "toward_looking_correct",
    why: "The same shape one layer up, and W345 already found the instance: its bound was false from the day it was written and a route added inside a class's directory comes back `unclassified` rather than inheriting anything. A route-reach register that stops classifying reports fewer classified routes, which reads as a smaller surface rather than as a register that has stopped looking.",
  },
  {
    file: "src/domain/schema-consistency.test.ts",
    direction: "toward_looking_correct",
    why: "The migration walk is proved; the consistency comparison between the schema and the domain types is welded inside this file and is not driven. A comparison that stops comparing reports no disagreement, and a schema and a type that have drifted apart then read as agreeing — which is exactly the state the file exists to make impossible.",
  },
  {
    file: "src/lib/source-hygiene.test.ts",
    direction: "toward_looking_correct",
    why: "It requires every source file to be text tooling can read. The walk is planted against; the readability assertion is not driven, and a check that stops opening files reports no unreadable one. The tree then reads as clean text, which is what it reads as when it IS clean text — the two are indistinguishable from outside.",
  },
  {
    file: "src/lib/stores.test.ts",
    direction: "toward_looking_correct",
    why: "W51's completeness test, and its own header records the drift it was written after: four stores had already fallen out of the registry. A completeness comparison that stops comparing reports a complete registry, which is the flattering direction and the one that let the drift happen in the first place.",
  },
  {
    file: "src/privacy/record-classes.test.ts",
    direction: "toward_looking_correct",
    why: "W106's gate is that a NEW record class fails the suite until it is handled. The walk is proved; the enumeration comparison is not driven. If it stopped noticing a class, a new one would arrive unhandled and the suite would stay green — and this is privacy machinery, where the quiet direction is the expensive one.",
  },
  {
    file: "src/tenancy/two-tenant.test.ts",
    direction: "loud",
    why: "The exception among the assertion-unproven rows, and its own header says why: the check is proved by pointing it at a ONE-PRACTICE fixture and watching it fail. That is a discriminating pair written inside the file — the comparison is undriven from `assertion-drives.ts` and demonstrably not undriven — so a comparison that stopped deciding fails against the fixture that exists to make it decide.",
  },
  {
    file: "src/verticals/assembly.test.ts",
    direction: "toward_looking_correct",
    why: "It asserts the rules that are true of EVERY vertical. The walk over the vertical declarations is proved; the per-rule comparisons are not driven from outside, and a rule that stops being applied reports no vertical breaking it. A vertical that arrived non-conforming would read as conforming.",
  },
  {
    file: "src/quality/tree-walks.ts",
    direction: "loud",
    why: "It asserts nothing and EVERYTHING asserts through it. Its walks feed the census's members, so a walk that stopped returning files would empty every population at once and the floors those registers pin — W279's `greaterThan`, W290's named lists — fail immediately. Silence here is the one silence this tree cannot keep.",
  },
  {
    file: "src/quality/register-census.test.ts",
    direction: "toward_looking_correct",
    why: "A prover rather than a register, and the most serious of them: what it proves is every other register's walk. If its planting stopped being a plant — a file placed where the walk would have found something anyway — every census entry would keep reading as proved while nothing had been demonstrated. The failure direction of the file that certifies the others is the direction that matters most.",
  },
  {
    file: "src/quality/page-suite.test.ts",
    direction: "toward_looking_correct",
    why: "The same shape, narrower: it points `pageSpecFiles` at a tree with no `e2e/` and asserts nothing else. A defect in the walk that this planting does not reach leaves the census entry it supports reading as proved.",
  },
  {
    file: "src/quality/private-copies.test.ts",
    direction: "toward_looking_correct",
    why: "A prover for W341's register. If the planted module stopped being a private copy — a marker changing, a fixture drifting — the detector would report nothing, the file would still pass, and the tree would read as holding no undeclared copies of a shared parse.",
  },
  {
    file: "src/quality/hardening-q26.test.ts",
    direction: "toward_looking_correct",
    why: "A prover for W343's ownership rule. A copy made some other way than `copyTree` would leave the pid check looking exercised while the case it exists for goes unread, and the sweep would read as scoped when it is not.",
  },
];

/** Where a register's direction came from. */
export interface RegisterDirection {
  file: string;
  direction: Direction;
  source: "derived" | "argued";
}

/** The direction for one entry, or `null` when nobody has settled it. */
export function directionOf(
  entry: TreeDerivedRegister,
  argued: readonly ArguedDirection[] = ARGUED_DIRECTIONS,
): RegisterDirection | null {
  const derived = derivedDirection(entry);
  if (derived !== null) return { file: entry.file, direction: derived, source: "derived" };
  const row = argued.find((a) => a.file === entry.file);
  return row === null || row === undefined
    ? null
    : { file: entry.file, direction: row.direction, source: "argued" };
}

/** Every census member with its direction — the register's answer, in one list. */
export function directions(
  census: readonly TreeDerivedRegister[],
  argued: readonly ArguedDirection[] = ARGUED_DIRECTIONS,
): RegisterDirection[] {
  return census
    .flatMap((entry) => {
      const found = directionOf(entry, argued);
      return found === null ? [] : [found];
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

export interface DirectionDefect {
  file: string;
  what: string;
}

/**
 * Census members with no direction, arguments the census contradicts, and arguments for nobody.
 *
 * THE CONTRADICTION ARM IS THE ONE WITH TEETH. An argued direction is only allowed where the census
 * leaves the question open; the moment a register's walk and assertion are both proved, the census
 * says LOUD and an argument saying otherwise is somebody's opinion overriding a derivation. This
 * reports that rather than letting the opinion win — which is the failure direction of a register
 * of failure directions, and it would fail toward looking correct.
 */
export function directionDefects(
  census: readonly TreeDerivedRegister[],
  argued: readonly ArguedDirection[] = ARGUED_DIRECTIONS,
): DirectionDefect[] {
  const byFile = new Map(census.map((e) => [e.file, e]));
  const defects: DirectionDefect[] = [];

  for (const entry of census) {
    if (directionOf(entry, argued) === null) {
      defects.push({
        file: entry.file,
        what: "the census cannot settle which way it fails and nobody argued it",
      });
    }
  }
  for (const row of argued) {
    const entry = byFile.get(row.file);
    if (entry === undefined) {
      defects.push({ file: row.file, what: "is argued and the census no longer holds it" });
      continue;
    }
    const derived = derivedDirection(entry);
    if (derived !== null) {
      defects.push({
        file: row.file,
        what: `is argued \`${row.direction}\` and the census derives \`${derived}\``,
      });
    }
  }
  return defects.sort((a, b) => `${a.file}${a.what}`.localeCompare(`${b.file}${b.what}`));
}

/** The registers whose failure is quiet, by name. W290: a named list moves deliberately. */
export function quietRegisters(
  census: readonly TreeDerivedRegister[],
  argued: readonly ArguedDirection[] = ARGUED_DIRECTIONS,
): string[] {
  return directions(census, argued)
    .filter((d) => d.direction === "toward_looking_correct")
    .map((d) => d.file)
    .sort();
}

export const DIRECTION_BOUND =
  "LOUD HERE MEANS ONE PLANTED INSTANCE IS REPORTED, not that every wrong answer is. A register " +
  "whose walk is proved against a planted file and whose assertion is driven against one " +
  "constructed input can still be wrong about everything else in silence — W349's population " +
  "failed open while its census entry read as proved on both halves, which is this bound's own " +
  "counter-example and the reason the sentence is written before somebody quotes the loud list as " +
  "coverage. SECOND, THE DIRECTION IS A PROPERTY OF THE MACHINERY AROUND A REGISTER rather than of " +
  "its logic: what it reports is that this tree would notice the silence, and a register can be " +
  "loud and wrong at the same time. THIRD, THE ARGUED ROWS ARE CHECKED FOR BEING WRITTEN AND NOT " +
  "FOR BEING RIGHT. Nothing here can tell a careful argument from a plausible one, which is the " +
  "same limit W295's blind spots and W297's `inherent` both state — and it is why the derivation " +
  "carries the majority of the census rather than this being a table of adjectives. The ratio is " +
  "checked rather than written down here: a register whose argued rows outnumbered its derived " +
  "ones would be an opinion survey, and the suite asserts which way round it is.";

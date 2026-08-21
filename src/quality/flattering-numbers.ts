// W354: the flattering number — which way an error moves a figure this tree derives.
//
// A COUNT IS BELIEVED. A list gets read; a number gets quoted. So when a derivation that counts
// something is wrong, the thing that decides whether anybody notices is not how wrong it is — it
// is WHICH WAY it is wrong. W340 is the worked example and it is this tree's own: the first
// derivation of unasked facts counted a reader as any file whose TEXT mentioned the export, and it
// reported thirty-five. Prose about a function is not a call, so the rule invented readers, and an
// invented reader turns an unasked fact into an asked one. Resolved through the import graph the
// answer was seventy-one. The wrong rule did not produce noise: it produced a SMALLER number, and
// a smaller number of unasked facts is a tidier repository. Nobody goes looking for the other half.
//
// SO EVERY FIGURE HERE SAYS WHICH WAY IT FAILS, and the answer is measured rather than asserted.
// Each row hands its derivation the population it should see and then the same population with a
// member taken out of its sight, and the sizes decide: SMALLER is `low`, BIGGER is `high`. A row
// may also claim `loud`, and that claim is the only one worth having — it says a second, INDEPENDENT
// read of the same state disagrees with the blinded figure, so a wrong number is contradicted
// rather than quoted. `loud` is checked by making the contradiction happen.
//
// LOW IS NOT ALWAYS THE FLATTERING DIRECTION and the register does not pretend otherwise. A missed
// open complaint lowers `openComplaintCount` and a practice with unrecorded complaints looks clean;
// a missed routing decision RAISES `projectUsualGpShare`, because the share is what is left after
// the moves are subtracted, and continuity looks better than it is. Two derivations, two
// directions, the same flattery — which is why the register classifies the DIRECTION mechanically
// and argues the flattery per row.
//
// THE POPULATION IS DERIVED TWICE OVER. A figure is an exported function whose return type is a
// number, found by a scan rather than a list — and then narrowed to the ones whose body COUNTS
// something, because arithmetic over numbers it was handed has no population to miss a member of
// and no direction to fail in. Both halves are read off the source. A figure the scan finds and no
// row classifies is reported, which is the arm that makes this register a register.
//
// WHAT THIS DOES NOT PROVE is `FIGURE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Every probe runs on values constructed here.

import { readFileSync } from "node:fs";
import path from "node:path";
import { reachableFromApp } from "@/security/reachability";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";
import { type Fact, readerFiles, servedFacts } from "./unasked-facts";

/** Which way an error moves a figure. */
export type ErrorDirection =
  /** A member the derivation cannot see makes the figure SMALLER. */
  | "low"
  /** A member it cannot see makes the figure BIGGER. */
  | "high"
  /** A second, independent read of the same state contradicts the wrong figure. */
  | "loud"
  /**
   * Arithmetic over numbers it was handed: no population, so no member to miss and no direction.
   *
   * THE ESCAPE HATCH, so it is closed: the scan admits these because their bodies mention a
   * length, and W279's rule is that a detector is not tuned until it stops asking. Declared rather
   * than filtered, checked for an argument, and asserted a minority by this unit's suite.
   */
  | "not_a_count";

/** The two calls that settle a figure's direction, plus the contradiction a `loud` row claims. */
export interface FigureProbe {
  /** The figure over the whole population. */
  honest: () => number;
  /** The same figure with one member out of the derivation's sight. */
  blinded: () => number;
  /**
   * Whether a SECOND, independent read of the same state disagrees with the blinded figure.
   *
   * OPTIONAL, AND ITS ABSENCE IS THE CLAIM. A row without one says no other export in this tree
   * recomputes the figure a different way, which is a statement about the repository and is argued
   * in `why` rather than measured — no scan can prove a second door does not exist. What the
   * register refuses to accept is the opposite: a row claiming `loud` must supply this and it must
   * return true, so `loud` is never a word somebody wrote.
   */
  contradicted?: () => boolean;
}

export interface Figure {
  /** `<file>::<export>` — resolved against the tree by this unit's test. */
  name: string;
  what: string;
  direction: ErrorDirection;
  why: string;
  /** Required of every row but a `not_a_count` one, which must not have it. */
  probe?: FigureProbe;
}

/**
 * What the figure actually does, measured by calling it.
 *
 * CONTRADICTION FIRST. A figure whose wrong value is disagreed with by a second door is loud
 * WHICHEVER way it moved — the direction stops mattering once something reports it, and that is
 * the whole point of preferring `loud` to either of the quiet answers.
 */
export function measuredDirection(probe: FigureProbe): ErrorDirection | null {
  if (probe.contradicted?.() === true) return "loud";
  const blinded = probe.blinded();
  const honest = probe.honest();
  if (blinded < honest) return "low";
  if (blinded > honest) return "high";
  return null;
}

export interface FigureDefect {
  figure: string;
  what: string;
}

/**
 * The register, in four directions.
 *
 * A row whose measurement disagrees with its declaration; a row claiming a direction with nothing
 * driving it; a figure the tree derives and no row classifies; and a row for a figure the tree no
 * longer derives.
 */
export function figureDefects(
  root: string,
  figures: readonly Figure[] = FIGURES,
  found: readonly string[] = countingFigures(root),
): FigureDefect[] {
  const out: FigureDefect[] = [];
  const declared = new Set(figures.map((f) => f.name));
  const derived = new Set(found);

  for (const figure of figures) {
    if (figure.direction === "not_a_count") {
      if (figure.probe !== undefined) {
        out.push({ figure: figure.name, what: "is declared `not_a_count` and supplies a probe" });
      }
    } else if (figure.probe === undefined) {
      out.push({ figure: figure.name, what: `is declared \`${figure.direction}\` and nothing drives it` });
    } else if (figure.direction === "loud" && figure.probe.contradicted === undefined) {
      out.push({ figure: figure.name, what: "is declared `loud` and names no second reader" });
    } else {
      const measured = measuredDirection(figure.probe);
      if (measured === null) {
        out.push({ figure: figure.name, what: "is driven by a blinding that moves nothing" });
      } else if (measured !== figure.direction) {
        out.push({
          figure: figure.name,
          what: `is declared \`${figure.direction}\` and measures \`${measured}\``,
        });
      }
    }
    if (!derived.has(figure.name)) {
      out.push({ figure: figure.name, what: "is a row here and the tree derives no such figure" });
    }
  }

  for (const name of found) {
    if (!declared.has(name)) {
      out.push({ figure: name, what: "is a figure the tree derives and no row says which way it fails" });
    }
  }

  return out.sort((a, b) => `${a.figure}${a.what}`.localeCompare(`${b.figure}${b.what}`));
}

/** The figures whose error moves them the flattering way in silence. The list the theme is about. */
export function quietFigures(figures: readonly Figure[] = FIGURES): string[] {
  return figures
    .filter((f) => f.direction === "low" || f.direction === "high")
    .map((f) => f.name)
    .sort();
}

export const FIGURE_BOUND =
  "A FIGURE SPELLED AS THE LENGTH OF A LIST IS INVISIBLE HERE, and that is the larger half of " +
  "this tree. The scan reads a declared return type, so `unaskedFacts(root).length` — the very " +
  "count this register is named after — is not in its population: what W340 returns is a list, " +
  "and the number is taken by its caller. Widening the scan to every `.length` a suite asserts " +
  "would report most of the repository, which is the class `register-census.ts` states about a " +
  "walk spelled a way the scan was not told about, and the remedy is the same one: the scan " +
  "grows and says so. SECOND, A BLINDING IS ONE MISTAKE, NOT ALL OF THEM. Each row hides one " +
  "member from one derivation; a figure that moves down when a member is hidden and up when a " +
  "field is misread reads as `low` here, and the second mistake is not asked about. THIRD, " +
  "`loud` IS ABOUT A CONTRADICTION AND NOT ABOUT A READER. A second door disagreeing proves the " +
  "wrong number CAN be caught, not that anybody looks — no page in this product compares the two, " +
  "and the register says `loud` where the evidence exists to be found rather than where somebody " +
  "is standing there finding it.";

// ---------------------------------------------------------------------------------------------
// The scan. A figure is an exported function returning a number whose body counts something.
// ---------------------------------------------------------------------------------------------

const RETURNS_A_NUMBER = /^\s*:\s*number\b/;
const COUNTS = [".length", ".size", ".filter(", ".reduce("] as const;

/** The index just past the parameter list that opens at `open`, or -1 if it never closes. */
function afterParameters(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "(") depth += 1;
    else if (source[i] === ")") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** The body between the first `{` at or after `from` and its matching `}`. */
function bodyFrom(source: string, from: number): string {
  const open = source.indexOf("{", from);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return "";
}

/**
 * Every exported function under `root` that returns a number, as `<file>::<export>`.
 *
 * COMMENTS SUBTRACTED AND LITERALS BLANKED, W173's order and W307's reason: a signature quoted
 * inside a comment is prose about a function, and one inside a string is a fixture somebody plants
 * — this register's own suite writes both, and a scan that read them would be counting itself.
 */
export function numberReturningExports(root: string): string[] {
  const out: string[] = [];
  for (const file of sourceModules(root)) {
    const source = prepareForScan(readFileSync(file, "utf8"), {
      comments: "subtracted",
      literals: "blanked",
    });
    const module = path.relative(root, file).split(path.sep).join("/");
    for (const match of source.matchAll(/^export function ([A-Za-z0-9_]+)\(/gm)) {
      const end = afterParameters(source, match.index + match[0].length - 1);
      if (end === -1) continue;
      if (!RETURNS_A_NUMBER.test(source.slice(end, end + 24))) continue;
      out.push(`${module}::${match[1]!}`);
    }
  }
  return out.sort();
}

/**
 * W340'S COUNT, RE-TAKEN BY THE RULE THAT PRODUCED THIRTY-FIVE — the worked example, callable.
 *
 * The old rule said a reader was any file whose TEXT contained the export's name. Rebuilt here
 * rather than described, because the direction is the claim and a sentence about a direction is
 * not a measurement: handed these facts, `unaskedFacts` returns FEWER ids than it does over the
 * resolved graph, every time, because every invented reader turns an unasked fact into an asked
 * one and no invented reader can ever do the reverse.
 *
 * The numbers themselves are not pinned. W340 measured thirty-five against seventy-one; this tree
 * has moved since and will move again, and a register that pinned either would be asserting a
 * repository rather than a rule.
 */
export function textScannedFacts(root: string, facts: readonly Fact[] = servedFacts(root)): Fact[] {
  // THE SAME READER POPULATION W340 RESOLVES OVER, taken through its own export rather than
  // re-derived: the claim here is about the RULE, so a narrower population would produce a smaller
  // number for the wrong reason — and a second copy of that population is the private parse W341
  // is about, written by the register whose subject is a count that misleads.
  const files = readerFiles(root, reachableFromApp(root).files).map((module) => ({
    module,
    // RAW, and deliberately: the rule being reproduced read the file as it stood, and the readers
    // it invented were a name inside a probe string and a name inside a fixture. Preparing the text
    // here would be reproducing a better rule than the one that produced the number.
    text: readFileSync(path.join(root, module), "utf8"),
  }));
  return facts.map((fact) => {
    const [module, name] = fact.id.split("::");
    const mentions = new RegExp(`\\b${name}\\b`);
    return {
      id: fact.id,
      readers: files.filter((f) => f.module !== module && mentions.test(f.text)).map((f) => f.module),
    };
  });
}

/**
 * The figures that COUNT — the ones with a population a mistake can lose a member of.
 *
 * The narrowing is derived rather than declared: `estimateRevenuePerVisit` multiplies two numbers
 * it was handed and cannot be wrong in a direction, while `openComplaintCount` filters a list and
 * can only be as complete as the list was.
 */
export function countingFigures(root: string): string[] {
  const out: string[] = [];
  for (const file of sourceModules(root)) {
    const source = prepareForScan(readFileSync(file, "utf8"), {
      comments: "subtracted",
      literals: "blanked",
    });
    const module = path.relative(root, file).split(path.sep).join("/");
    for (const match of source.matchAll(/^export function ([A-Za-z0-9_]+)\(/gm)) {
      const end = afterParameters(source, match.index + match[0].length - 1);
      if (end === -1) continue;
      if (!RETURNS_A_NUMBER.test(source.slice(end, end + 24))) continue;
      const body = bodyFrom(source, end);
      if (!COUNTS.some((token) => body.includes(token))) continue;
      out.push(`${module}::${match[1]!}`);
    }
  }
  return out.sort();
}

// ---------------------------------------------------------------------------------------------
// The rows. Imports live down here because the register CALLS its subjects, product and quality
// alike, and every value below is constructed in this file.
// ---------------------------------------------------------------------------------------------

import { projectUsualGpShare } from "@/capability/continuity-guard";
import { type RoutingDecision, routedShare } from "@/capability/routing";
import { complaintsFor, getComplaints, openComplaintCount, resetComplaints } from "@/complaints/store";
import type { ComplaintRecord } from "@/complaints/workflow";
import type { ClinicianId, PatientId, PracticeId } from "@/domain/types";
import { claimCount } from "@/directory/correction";
import type { DirectoryProfile } from "@/directory/profile";
import type { CpdEntry } from "@/education/cpd";
import { addCpdEntries, cpdEntriesFor, resetEducation, scrubClinicianCpd } from "@/education/store";
import { upcIndex } from "@/engine/continuity";
import {
  eraseInterestSignups,
  interestSignupsFor,
  pruneInterestSignups,
} from "@/interest/store";
import { siteHash } from "./mutation-sampling";
import { withTree } from "./planting";
import { tiedPanel } from "./ranker-behaviour";
import type { CareGap } from "@/registers/caregap";
import { gapShareOfBatch } from "@/registers/ranking";
import { percentile } from "@/sim/fleet";
import type { VerticalEvidence } from "@/verticals/model";
import { evidenceEntries } from "@/verticals/scale";

/**
 * A member built from the fields its derivation reads, and nothing else.
 *
 * NOT THE FABRICATED FIXTURE W234 RECORDED, and the difference is worth stating because the cast
 * looks like one. W234's failure was inventing a whole `AgreementReport` and then testing this
 * author's idea of one. Here the derivation reads two fields off each member — `routed` and
 * `usualClinicianId`, or `patientId`, or `status` — and the probe supplies exactly those, so the
 * cast is the statement that the rest of the record cannot move the figure. It is also SAFE in the
 * direction that matters: if a derivation starts reading a field the probe does not supply, an
 * `undefined` flows in and either the measured direction changes or the blinding stops moving the
 * number, and this register reports both.
 */
const reads = <T>(fields: Partial<T>): T => fields as T;

const PRACTICE = "prac-w354" as PracticeId;
const CLINICIAN = "clin-w354" as ClinicianId;
const EMAIL = "w354@example.test";

/** A routing decision that moved a patient away from their usual GP. */
const moved = (): RoutingDecision => reads<RoutingDecision>({ routed: true, usualClinicianId: CLINICIAN });
const stayed = (): RoutingDecision => reads<RoutingDecision>({ routed: false, usualClinicianId: CLINICIAN });

const BASELINE = { appointments: 10, withUsualGp: 8 };

/** One CPD entry, at a practice and under a clinician id spelled as given. */
const cpd = (clinicianId: string): CpdEntry =>
  reads<CpdEntry>({ entryId: `cpd-${clinicianId}`, practiceId: PRACTICE, clinicianId: clinicianId as ClinicianId });

/** Run a probe over a fresh education store, and leave none of it behind. */
function withCpd<T>(entries: readonly CpdEntry[], probe: () => T): T {
  resetEducation();
  addCpdEntries(entries);
  try {
    return probe();
  } finally {
    resetEducation();
  }
}

/** The same, for the complaints store. */
function withComplaints<T>(records: readonly ComplaintRecord[], probe: () => T): T {
  resetComplaints();
  getComplaints().complaints.push(...records);
  try {
    return probe();
  } finally {
    resetComplaints();
  }
}

const complaint = (practiceId: string): ComplaintRecord =>
  reads<ComplaintRecord>({ practiceId: practiceId as PracticeId, status: "open" });

/** Run a probe over an interest file holding exactly these lines. */
function withSignups<T>(rows: ReadonlyArray<Record<string, unknown>>, probe: (filePath: string) => T): T {
  const lines = rows.map((row) => JSON.stringify(row)).join("\n");
  return withTree({ "interest.jsonl": `${lines}\n` }, (root) => probe(`${root}/interest.jsonl`));
}

const signup = (email: string, createdAt: string): Record<string, unknown> => ({
  id: `sign-${email}-${createdAt}`,
  name: "W354 Probe",
  email,
  interests: ["updates"],
  consentedAt: "2026-01-01T00:00:00.000Z",
  createdAt,
  source: "western-sydney-community-landing",
});

const OLD = "2020-01-01T00:00:00.000Z";

const gapFor = (patientId: string): CareGap => reads<CareGap>({ patientId: patientId as PatientId });

const evidence = (pathways: number): VerticalEvidence =>
  reads<VerticalEvidence>({
    pathways: Array.from({ length: pathways }, () => reads<VerticalEvidence["pathways"][number]>({})),
    content: [],
    educationItems: [],
    intervals: reads<VerticalEvidence["intervals"]>({ intervals: [] }),
  });

export const FIGURES: readonly Figure[] = [
  {
    name: "src/capability/continuity-guard.ts::projectUsualGpShare",
    what: "the share of appointments still with a usual GP after routing moves some of them",
    direction: "high",
    why: "THE CLEAREST FLATTERY IN THE TABLE, and it fails UPWARD. The share is what is LEFT after the moves are subtracted, so a routing decision the guard cannot see is a move that never happened: the projection reports more continuity than the practice will have. A guard that exists to stop routing eroding continuity, reading high exactly when it has lost sight of the routing. Nothing recomputes it from the appointments themselves, so nobody is placed to disagree.",
    probe: {
      honest: () => projectUsualGpShare(BASELINE, [moved(), moved()]),
      blinded: () => projectUsualGpShare(BASELINE, [moved()]),
    },
  },
  {
    name: "src/capability/routing.ts::routedShare",
    what: "the share of decisions that routed away from the usual GP",
    direction: "low",
    why: "The same blind spot, one module over, moving the other way: a routed decision out of sight leaves the numerator and the denominator both smaller, and the ratio falls. Reported as a share of what was seen rather than of what was decided, and the two are the same number only while nothing is missing. There is no second count of decisions to disagree with it.",
    probe: {
      honest: () => routedShare([moved(), moved(), stayed()]),
      blinded: () => routedShare([moved(), stayed()]),
    },
  },
  {
    name: "src/complaints/store.ts::openComplaintCount",
    what: "how many complaints one practice has open",
    direction: "low",
    why: "W206 already fixed the direction that shouted — the count used to include OTHER practices' complaints, so a practice with none was told to review somebody else's. What it left is the quiet direction: a complaint recorded under the wrong practice is not counted for the right one, and a practice with unrecorded complaints reads as a practice with none. `complaintsFor` filters on the same field, so the second door agrees with the first and there is nothing to contradict.",
    probe: {
      honest: () => withComplaints([complaint(PRACTICE), complaint(PRACTICE)], () => openComplaintCount(PRACTICE)),
      blinded: () => withComplaints([complaint(PRACTICE), complaint("prac-elsewhere")], () => openComplaintCount(PRACTICE)),
      contradicted: () =>
        withComplaints([complaint(PRACTICE), complaint("prac-elsewhere")], () => {
          const open = complaintsFor(PRACTICE).filter((c) => c.status === "open").length;
          return open !== openComplaintCount(PRACTICE);
        }),
    },
  },
  {
    name: "src/directory/correction.ts::claimCount",
    what: "how many claims a directory profile makes about a clinician",
    direction: "low",
    why: "Each field the profile fills is a claim somebody may have to correct, so the count is how much of a page is assertable. A field the loader did not read is a claim that is being published and is not being counted — the profile looks more modest than it reads. Nothing else counts a profile's claims, so the figure stands alone.",
    probe: {
      honest: () => claimCount(reads<DirectoryProfile>({ languages: ["en", "ar"], acceptingNewPatients: true })),
      blinded: () => claimCount(reads<DirectoryProfile>({ languages: [], acceptingNewPatients: true })),
    },
  },
  {
    name: "src/education/store.ts::scrubClinicianCpd",
    what: "how many CPD entries an erasure removed",
    direction: "low",
    why: "THE ONE WITH TEETH, because it is an erasure receipt. The figure is the number of records deleted, and an entry filed under a clinician id spelled differently is not deleted and not counted — so the receipt says one where two were owed, and it says it in the confident past tense. `cpdEntriesFor` asks with the same equality, so it answers empty afterwards and agrees: the record that survived is invisible to both doors at once.",
    probe: {
      honest: () => withCpd([cpd("clin-w354"), cpd("clin-w354")], () => scrubClinicianCpd(PRACTICE, CLINICIAN)),
      blinded: () => withCpd([cpd("clin-w354"), cpd("CLIN-W354")], () => scrubClinicianCpd(PRACTICE, CLINICIAN)),
      contradicted: () =>
        withCpd([cpd("clin-w354"), cpd("CLIN-W354")], () => {
          scrubClinicianCpd(PRACTICE, CLINICIAN);
          return cpdEntriesFor(PRACTICE, CLINICIAN).length > 0;
        }),
    },
  },
  {
    name: "src/engine/continuity.ts::upcIndex",
    what: "the usual-provider-of-care index over a patient's visits",
    direction: "high",
    why: "The index is the largest share any one clinician holds, so a visit to somebody ELSE that the record does not hold raises it: fragmented care with missing visits reads as continuous care. It refuses rather than answering on an empty history, which is the honest half — a patient with no visits has no index, and returning zero would have been a number somebody could average.",
    probe: {
      honest: () => upcIndex(["a", "a", "b", "b"]) ?? 0,
      blinded: () => upcIndex(["a", "a", "b"]) ?? 0,
    },
  },
  {
    name: "src/interest/store.ts::eraseInterestSignups",
    what: "how many interest signups an erasure request removed",
    direction: "low",
    why: "The second erasure receipt, and the same shape as the first: the match trims and lower-cases, so a stored address that differs anywhere else is neither erased nor counted. `interestSignupsFor` normalises identically and reports nothing left under that address, so the two doors agree on a record that is still in the file.",
    probe: {
      honest: () =>
        withSignups([signup(EMAIL, OLD), signup(EMAIL, OLD)], (filePath) =>
          eraseInterestSignups(EMAIL, { filePath }),
        ),
      blinded: () =>
        withSignups([signup(EMAIL, OLD), signup(`w354 @example.test`, OLD)], (filePath) =>
          eraseInterestSignups(EMAIL, { filePath }),
        ),
      contradicted: () =>
        withSignups([signup(EMAIL, OLD), signup(`w354 @example.test`, OLD)], (filePath) => {
          eraseInterestSignups(EMAIL, { filePath });
          return interestSignupsFor(EMAIL, { filePath }).length > 0;
        }),
    },
  },
  {
    name: "src/interest/store.ts::pruneInterestSignups",
    what: "how many signups a retention run deleted",
    direction: "low",
    why: "A row whose timestamp will not parse is KEPT, which is the right call — losing data to a parsing bug is worse than keeping it — and the figure it produces is a retention report that says fewer rows were deleted than the policy requires, without saying that any were skipped. The keep is deliberate and the silence is not: nothing recomputes how many rows are past the cutoff, so the run reports a smaller job rather than an incomplete one.",
    probe: {
      honest: () =>
        withSignups([signup(EMAIL, OLD), signup("other@example.test", OLD)], (filePath) =>
          pruneInterestSignups(30, "2026-08-19T00:00:00.000Z", { filePath }),
        ),
      blinded: () =>
        withSignups([signup(EMAIL, OLD), signup("other@example.test", "not-a-date")], (filePath) =>
          pruneInterestSignups(30, "2026-08-19T00:00:00.000Z", { filePath }),
        ),
    },
  },
  {
    name: "src/quality/patterns.ts::literalEnd",
    direction: "not_a_count",
    what: "the index just past the end of a regex literal, used to cut the literal's text out of a module",
    why: "THE THIRD LENGTH THAT IS NOT A COUNT, and it is in the population for the reason W279 keeps: the scan cannot tell an index from a size, and a row saying so is worth more than a filter nobody reads. It walks a string one character at a time and returns a POSITION — the answer is a place in the text, not how much of anything there is, so a wrong value cuts a different literal rather than reporting more or fewer of them. What a wrong value costs is stated where it belongs: the register that calls this reports the cut text as a population whose declared source has moved, which is a build failure rather than a quiet number.",
  },
  {
    name: "src/quality/mutation-sampling.ts::siteHash",
    direction: "not_a_count",
    what: "a hash of a mutation site's text, used to draw the sample by arithmetic",
    why: "IN THE POPULATION BECAUSE THE SCAN CANNOT TELL A LENGTH FROM A COUNT, and declared rather than filtered out — W279's rule that a detector is not tuned until it stops asking. It walks `text.length` to mix a hash, so there is no population and no member to lose sight of: a wrong hash draws a different sample, which is a fact about which mutants run and not a figure anybody reads as bigger or smaller.",
  },
  {
    name: "src/registers/ranking.ts::gapShareOfBatch",
    what: "the share of an invitation batch that has a care gap",
    direction: "low",
    why: "The share is how much of a batch the register believes it has a reason to contact. A gap the register did not derive is a patient counted in the denominator and not the numerator, so the batch reads as less well-targeted than it is — the one row here whose quiet direction is the UNflattering one, and it is still quiet. Nothing recomputes the share from the register membership.",
    probe: {
      honest: () => gapShareOfBatch(tiedPanel(2), [gapFor("pat-w283-0"), gapFor("pat-w283-1")]),
      blinded: () => gapShareOfBatch(tiedPanel(2), [gapFor("pat-w283-0")]),
    },
  },
  {
    name: "src/sim/fleet.ts::percentile",
    direction: "not_a_count",
    what: "the value at a percentile of an already-sorted list",
    why: "The second length that is not a count: `sorted.length` picks an INDEX, and the answer is a member of the list rather than a size of it. A shorter list moves the answer in whichever direction the missing member sat, so there is no direction to declare — which is why it is here with a sentence rather than quietly dropped from the scan.",
  },
  {
    name: "src/verticals/scale.ts::evidenceEntries",
    what: "how many pieces of evidence a vertical is carrying",
    direction: "low",
    why: "The figure feeds a budget check, and that is what makes the direction matter: the check reports a vertical carrying MORE than its budget, so an error upward is caught and an error downward is not. Evidence the assembly did not load reads as evidence that was never added, and the budget passes on a count of what happened to be visible.",
    probe: {
      honest: () => evidenceEntries(evidence(2)),
      blinded: () => evidenceEntries(evidence(1)),
    },
  },
];

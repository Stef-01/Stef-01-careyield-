// W344: when the condition actually held — a finding's timeline, reconstructed rather than assumed.
//
// W328 SPENT A UNIT ON A PREMISE THAT THE RECORD REFUTES. PLANT-1 said something was still writing
// `src/planted/` into the repository AFTER W322 made `withPlantedIn` refuse a root inside the tree,
// and the reasoning was ordinary: the residue was found, W322's refusal exists, therefore something
// gets past it. W328 then read the clock and the premise fell over — the run that left the residue
// was W321's verify, which started at 22:51 and finished at 00:10, and W322's refusal landed at
// 00:05. For all but five minutes of that window the refusal did not exist. Nothing was getting
// past anything.
//
// THAT IS NOT A MISTAKE ABOUT CODE. It is a mistake about ORDER, and this tree makes claims about
// order constantly: *since W89*, *the second quarter running*, *W310 fixed it and the copies kept
// the old answer*, *a state that has held since the wizard was built*. Every one of them is a
// statement about the commit record, and until now every one was written from memory. A wrong one
// does not fail anything: it sends the next reader looking for a defect that was never there, which
// is what W328's first day was spent on.
//
// SO THE RECORD IS THE ANSWER AND THE CLAIM IS THE INPUT. A claim here names a STATE, the commit
// that introduced it, and a unit whose work window it says the state held through. The register
// reads the window out of the ledger and the log — the unit's `claim` commit is where its work
// began, its ledger SHA is where it landed — and computes whether the state was there throughout,
// arrived part way through, or had not arrived at all. A claim that says one and the record says
// another is the defect, and W328's original premise is declared here as exactly that: the version
// that was believed for a day, refuted by the record on every run.
//
// WHY THE `claim` COMMIT IS THE START. The protocol in `BUILD-STATE.md` makes a unit push its claim
// before building, so the first commit of a unit's work is `W<n>: claim — …` and the last is the
// row's SHA. That convention is what makes a window derivable at all, and it is also this
// register's biggest limit: a unit that never pushed a claim has no start, and this says so rather
// than guessing one.
//
// WHAT THIS DOES NOT PROVE is `TIMELINE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own commit log and ledger.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { UnitId } from "./typed-names";

/** One commit, as the record holds it. */
export interface Commit {
  sha: string;
  /** ISO 8601, committer date — the moment it landed on this branch. */
  at: string;
  subject: string;
}

/**
 * The commit log, read once and handed in.
 *
 * INJECTED FOR W289'S REASON, and here the reason is sharper than usual: a register that shells out
 * inside its own comparison can only ever be driven against this repository, and the one thing this
 * register must be able to do is answer about a record that DISAGREES with a claim — which is a
 * record this repository does not have.
 */
export type LogReader = (root: string) => Commit[];

/** The real one. Bounded, because a log is unbounded and a register should say what it read. */
export const GIT_LOG: LogReader = (root) => {
  let raw: string;
  try {
    raw = execFileSync("git", ["log", "--format=%H%x09%cI%x09%s", "-n", "4000"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1 << 26,
    });
  } catch {
    // No git, no work tree, or a copy of the tree without one. A register that cannot read the
    // record says so through `unreadable` below rather than throwing through its caller.
    return [];
  }
  return raw
    .split("\n")
    .filter((line) => line.includes("\t"))
    .map((line) => {
      const [sha, at, ...rest] = line.split("\t");
      return { sha: sha!, at: at!, subject: rest.join("\t") };
    });
};

/** The commit that opened a unit's work: the claim the protocol makes it push before building. */
export function claimCommit(log: readonly Commit[], unit: UnitId): Commit | null {
  const opens = new RegExp(`^${unit}: claim\\b`);
  // THE EARLIEST BY DATE, NOT BY POSITION. The first draft took the last entry in `git log` order,
  // which is the earliest only because that command prints newest first — a fold that reads a
  // property of the CALLER's sort as a property of the record, which is W167's class exactly, and
  // it was found by handing this a constructed log written oldest first. A unit re-claimed after a
  // rebase has two claim commits and the work began at the first of them.
  return log
    .filter((c) => opens.test(c.subject))
    .reduce<Commit | null>((earliest, c) => (earliest === null || c.at < earliest.at ? c : earliest), null);
}

/** The commit a ledger row points at, if the record still holds it. */
export function commitOf(log: readonly Commit[], sha: string): Commit | null {
  return log.find((c) => c.sha.startsWith(sha)) ?? null;
}

/** When a unit's work began and when it landed. */
export interface WorkWindow {
  unit: UnitId;
  /** ISO, the claim commit. */
  from: string;
  /** ISO, the commit the ledger row names. */
  to: string;
}

/**
 * The window a unit's work occupied, from the ledger and the log.
 *
 * `null` when either end is missing, which is a real state and not an error: a unit that never
 * pushed a claim, or a row whose SHA the record no longer holds after a rebase, has no window and
 * nothing here may pretend otherwise.
 */
export function workWindow(root: string, log: readonly Commit[], unit: UnitId): WorkWindow | null {
  const landed = ledgerSha(root, unit);
  if (landed === null) return null;
  const opened = claimCommit(log, unit);
  const landing = commitOf(log, landed);
  if (opened === null || landing === null) return null;
  return { unit, from: opened.at, to: landing.at };
}

/** The SHA column of a unit's ledger row, or null when the row does not carry one. */
export function ledgerSha(root: string, unit: UnitId): string | null {
  const line = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8")
    .split("\n")
    .find((l) => l.startsWith(`| ${unit} | `));
  if (line === undefined) return null;
  const cells = line.split("|").map((c) => c.trim());
  const sha = cells[5] ?? "";
  return /^[0-9a-f]{7,40}$/.test(sha) ? sha : null;
}

/** Where a state stood relative to a window, as the record has it. */
export type Standing = "throughout" | "arrived_during" | "after" | "unreadable";

/** A claim this tree's prose makes about when something held. */
export interface TimelineClaim {
  id: string;
  /** The sentence, quoted from where it is written. */
  says: string;
  /** `<file> :: <what it is written in>` — resolved by this unit's test. */
  where: string;
  /** The state whose arrival the claim turns on, and the commit that introduced it. */
  state: { what: string; sha: string };
  /** The unit whose work window the claim is about. */
  during: UnitId;
  /** What the claim says the record says. Recomputed on every run. */
  standing: Standing;
}

/** Where the record puts a state, relative to a window. */
export function standingOf(window: WorkWindow | null, arrivedAt: string | null): Standing {
  if (window === null || arrivedAt === null) return "unreadable";
  if (arrivedAt <= window.from) return "throughout";
  if (arrivedAt <= window.to) return "arrived_during";
  return "after";
}

export interface TimelineDefect {
  claim: string;
  what: string;
}

/**
 * Every declared claim against the record, and the record against every claim.
 *
 * THE DEFECT IS A DISAGREEMENT, not an absence: a claim saying a state held throughout a unit's
 * work, over a record that has it arriving five minutes before the unit finished, is W328's day.
 */
export function timelineDefects(
  root: string,
  log: readonly Commit[],
  claims: readonly TimelineClaim[],
): TimelineDefect[] {
  const defects: TimelineDefect[] = [];
  for (const claim of claims) {
    const arrival = commitOf(log, claim.state.sha);
    const standing = standingOf(workWindow(root, log, claim.during), arrival?.at ?? null);
    if (standing !== claim.standing) {
      defects.push({
        claim: claim.id,
        what: `says the record reads \`${claim.standing}\` and it reads \`${standing}\``,
      });
    }
  }
  return defects.sort((a, b) => a.claim.localeCompare(b.claim));
}

/**
 * The claims, each resolved against the record on every run.
 *
 * THE FIRST ROW IS THE ONE THIS UNIT EXISTS FOR. It is not a claim the tree believes — it is the
 * one W328 spent a day believing, kept here as the shape a wrong timeline has, with the record's
 * own verdict beside it. Deleting it would leave the register with only claims that agree.
 */
export const TIMELINE_CLAIMS: readonly TimelineClaim[] = [
  {
    id: "PLANT-1",
    says:
      "The run that left the residue was W321's, whose verify ran from 22:51 to 00:09 on a tree that gained W322's refusal only at 00:05 — so nothing had to get past the refusal at all.",
    where: "BUILD-STATE.md :: W328's row — `The premise was a timeline error`",
    state: {
      what: "W322's refusal: `withPlantedIn` rejects a root inside the repository",
      sha: "351f471",
    },
    during: "W321",
    // THE CORRECTION, RE-DERIVED. The premise W328 spent a day on said this state held THROUGHOUT
    // that window; the record says it arrived four minutes before the window closed. The erroneous
    // version is not stored here — a register of claims the tree believes may not hold one it does
    // not — it is handed to this comparison by the test, which is where a refuted claim belongs.
    standing: "arrived_during",
  },
  {
    id: "PLANTING-BOUND-UNREAD",
    says:
      "`PLANTING_BOUND` had said so — *a suite that forgets its `afterAll` leaks a temporary directory, which no register here reads* — and the sentence sat there while four callers forgot.",
    where: "src/quality/hardening-q25.ts :: Q25-CR-2",
    state: { what: "W303's `PLANTING_BOUND`, stating the leak nobody read", sha: "9bc6cf6" },
    during: "W315",
    // The finding's whole force is that the warning EXISTED while the caller was written. If the
    // bound had arrived afterwards the sentence would be hindsight rather than an unread warning,
    // which is a different and much weaker claim.
    standing: "throughout",
  },
  {
    id: "LEDGER-PARSE-FIXED",
    says:
      "W310 fixed `allLedgerRows` and every register calling it; this file had a copy, so the document said G5 blocks six, its test agreed, and both were wrong by the same two rows.",
    where: "src/quality/dossier-derived.ts :: the module note",
    state: { what: "W310's corrected ledger parse, seeing `SUP-1` and `SUP-2`", sha: "4cc99d0" },
    during: "W335",
    // Same shape, and it is the premise W341 built a whole register on: a copy is a place a fix
    // does not reach, which is only true of a fix that had already landed.
    standing: "throughout",
  },
];

export const TIMELINE_BOUND =
  "A WINDOW IS TWO COMMITS AND THE WORK IS NOT ALL OF IT. `from` is the claim the protocol makes a " +
  "unit push before building and `to` is the commit its ledger row names, so a verify that ran " +
  "before the claim was pushed, or after the row was closed, is outside a window this register " +
  "calls the unit's work. It also cannot see a unit that never pushed a claim, or a row whose SHA " +
  "a rebase has rewritten: both come back `unreadable`, which is honest and is not the same as " +
  "false. SECOND, IT RESOLVES THE COMMIT A CLAIM NAMES AND NOT THE STATE THE CLAIM DESCRIBES. " +
  "Whether `351f471` is really where the refusal landed is a reading somebody did once; if the " +
  "state arrived in a different commit the register will confirm a wrong claim precisely. " +
  "THIRD, THE POPULATION IS DECLARED. The tree makes order claims in hundreds of sentences and " +
  "this reads the three somebody wrote down, so a sentence claiming an order and never declared " +
  "here is unread — the same class W267 states about a walk, and the reason the first row is the " +
  "one that was WRONG rather than a sample of ones that were right.";

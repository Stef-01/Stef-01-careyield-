// W343: Q26 hardening — the quarter that asked WHEN a check runs, read for the moments it missed.
//
// Q26'S THEME WAS *WHEN THE CHECK RUNS*: a control that cannot reach its moment is a control about
// something else. So the question a review of it owes is not whether the quarter's registers work
// — the suite says they do and every one of them is driven — but whether the quarter's own
// machinery answers about the thing it names, at the moment it claims to.
//
// TWO OF THE FOUR FINDINGS ARE EXACTLY THAT, AND BOTH ARE IN THE QUARTER'S OWN HARNESS. The
// run-level teardown W328 built to sweep leaked tree copies takes every `/tmp/tree-*` whose mtime
// falls inside this run's window, and its own comment says it leaves a concurrent run's copies
// alone. It does not: a sibling session starting LATER has all of its live copies inside the
// window, and this tree runs two builders at once as a matter of course. A sweep whose ownership
// test is a clock deletes directories it does not own, and the symptom lands in somebody else's
// suite as an `ENOENT` on a path they created themselves.
//
// AND THE OTHER IS A POPULATION THAT FAILS OPEN. `quarterModules(root, first, last)` took two loose
// numbers while the module beside it exports the range as an OBJECT; handed that object every
// comparison silently became false and the function returned EVERY module in the tree rather than
// the quarter's six. Nothing threw. It was found by making the mistake — the natural call is the
// wrong one — and a mutation register built on a population that quietly becomes "everything" is
// the shape this quarter exists to notice.
//
// THE OTHER TWO ARE COPIES, one already retired and one watched. Q26 wrote the third `UnitId` and
// the seventh copy of the ledger row parse. W341 and W342 landed after the quarter and dealt with
// both; the pass records them rather than claiming them, because a finding whose fix arrived on its
// own is still a finding about the quarter.
//
// THE READER WROTE SEVEN OF THE THIRTEEN UNITS, which `SELF_REVIEWED` names rather than hides.
//
// WHAT THIS DOES NOT PROVE is `Q26_HARDENING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads diffs, registers, one console page and one
// spec.

import { parseLedgerRows } from "./blocked-surface";
import { type HardeningFinding, unaccountedFor } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * W285's rule: `diffHead` is pinned rather than left at `HEAD`, because a range ending at HEAD
 * grows every time a sibling session commits and the record would then claim more than was read.
 * This one ends at W338's close — the quarter's last commit — so the Q27 units built since, three
 * of them this reader's own, are deliberately outside it.
 */
export const QUARTER = { first: 326, last: 338, diffBase: "0741005", diffHead: "9d138a5" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W326",
  "W327",
  "W328",
  "W329",
  "W330",
  "W331",
  "W332",
  "W333",
  "W334",
  "W335",
  "W336",
  "W337",
  "W338",
];

/** Units in the range this pass did NOT read, with the reason. Empty, and checked to be. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {};

/**
 * The units this reader wrote, named rather than left for somebody to notice.
 *
 * W331'S POSTURE, and the same limit: what a pass offers against its own work is distance in time
 * and a different question, not independence. Seven of thirteen here, which is worse than Q25's six
 * and is stated in the bound rather than softened.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W326: "builder-B — the close gate.",
  W329: "builder-B — deferral standings.",
  W332: "builder-B — the survivors register re-derived over a quarter's modules.",
  W335: "builder-B — the gate dossier derived.",
  W338: "builder-B — the Q27 expansion.",
  W330: "builder-A, read by builder-B.",
  W337: "builder-A, read by builder-B.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q26-SEC-1",
    lens: "security-review",
    unit: "W328",
    what:
      "The run-level teardown removes every `/tmp/tree-*` whose mtime is at or after the moment this run STARTED, and its own comment claims this leaves a concurrent run's copies alone. It does the opposite of that for the case that matters: a copy made BEFORE this run is excluded, and a sibling session that begins LATER has every one of its live tree copies inside the window. This repository runs two builder sessions at once as a matter of course — the ledger is the lock precisely because overlapping is normal — and both run `pnpm verify`. So one session's teardown deletes the other's working copies mid-suite, and the symptom arrives in the innocent session as an `ENOENT` on a path it created itself, which is the wandering flake W313 chased for a different cause. The blast radius is bounded but not by design: `copyTree` symlinks the real `node_modules` into a copy when a harness needs to run inside it, and `rmSync` unlinks a symlink rather than descending through it. A deletion sweep whose ownership test is a timestamp is one `cpSync` away from being a deletion sweep with no ownership test at all.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W343",
      evidence:
        "Ownership is stated rather than inferred: `copyTree` stamps the maker's pid into the directory name and the teardown removes only `tree-<its own pid>-*`. Worker threads share the process's pid, which is exactly the set a run may remove; a child `npx vitest` has a different one and was already excluded by the `.git` marker; a sibling session is a different process and is now invisible to this sweep. The mtime window stays as a second condition — a pid is reused eventually and a directory older than this run is not this run's. Driven: a copy stamped with another pid survives a sweep that removes this process's own.",
    },
  },
  {
    id: "Q26-CR-1",
    lens: "code-review",
    unit: "W332",
    what:
      "`quarterModules(root, first, last)` took two loose `number` parameters while the module exports the range it means as an OBJECT, `QUARTER_AT_W332`. Handing it that object — the natural call, and the one this reader made without thinking — makes every comparison `unit < first` and `unit > last` false, so nothing is skipped and the function returns EVERY module in the tree instead of the quarter's six. Nothing throws and nothing reports: the population fails OPEN. `quarterMutants` is built on it, so the same slip in the full run would have mutated the whole repository while its report said it was measuring a quarter, and `quarterModulesWithNoSuite` would have named two hundred modules as the quarter's own. A register that answers about a wider tree than it claims is this quarter's theme with the subject changed.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W343",
      evidence:
        "The range is ONE argument with the shape the caller already holds: `quarterModules(root, { first, last })`, defaulting to `QUARTER_AT_W332`. The mistaken call is now the correct one and a loose pair no longer typechecks — W342's remedy at its parse boundary, applied to an argument list. The two callers passing literal ranges were converted. Driven: the register is asked for a one-unit range and returns that unit's module rather than the tree.",
    },
  },
  {
    id: "Q26-SIMP-1",
    lens: "simplify",
    unit: "W327",
    what:
      "`controls.ts` opened with `export type UnitId = \\`W${number}\\`` — the THIRD copy of that type in the tree, after `hardening-q22.ts` and `claim-classes.ts`. Three definitions of one id type is the duplication W301 wrote its consolidation against, in the type system rather than in a parse, and it arrived in a quarter whose own W329 finding was about a field typed loosely beside a twin typed strictly. A type written three times cannot be tightened once.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W342",
      evidence:
        "`typed-names.ts` owns `UnitId` and the three modules re-export or import it. W342 landed before this pass read the quarter, so the finding is recorded rather than claimed — and the register that would notice a fourth copy is the same unit's: a field carrying unit ids typed `string` beside a strict twin is reported by `looseTwins`.",
    },
  },
  {
    id: "Q26-SIMP-2",
    lens: "simplify",
    unit: "W338",
    what:
      "`horizon-q27.test.ts` holds the six-column ledger row regex character for character, and it is there because `horizon-q26.test.ts` held it — which held it because Q25's did. The quarter's last unit made the SEVENTH copy of a parse `blocked-surface.ts` exports, in a document whose whole subject is what the tree already knows. W310 changed what a ledger row is; that fix reached every caller of the shared parse and no copy, and W335's finding one unit earlier in the same quarter was a document and its own test wrong by the same two rows for exactly this reason.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "accepted",
      why:
        "Converting seven quarter documents is a unit, not a review note, and each conversion changes what a frozen document computes — which is the one edit a horizon test must not make casually. What has changed since the quarter is that the copies are no longer invisible: W341 enumerates every one of them in `DECLARED_COPIES` with the cost stated, and a NEW copy arriving now fails rather than joining a pattern nobody declared. That is the property worth having; retiring the seven is worth doing when a unit is holding the horizon documents anyway.",
      reviewBy: "2026-11-30",
    },
  },
];

/** A deferred finding with nothing written in it. The type refuses the rest; this catches the empty. */
export function undisposed(findings: readonly HardeningFinding[] = FINDINGS): string[] {
  return findings
    .filter((f) => f.disposition.kind === "deferred" && f.disposition.why.trim().length === 0)
    .map((f) => f.id)
    .sort();
}

/**
 * Units in the reviewed range that the ledger holds and this pass names nowhere.
 *
 * THE NAMED LIST IS A PARAMETER, and W296's sampler is why: with the list welded to this module's
 * own constants the only assertion possible was over the real ledger, where both ends of the range
 * are reviewed — so `n <= QUARTER.last` flipped to `<` changed nothing and survived. Handed an
 * empty list the range's ends are reportable, and the boundary is checked by a case that sits on it.
 */
export function unaccountedUnitsFor(ledger: string, named: readonly string[]): string[] {
  // W360: the shared derivation. This was its only copy until Q27's pass needed the same question
  // about a different range, which is the moment a private one becomes two.
  return unaccountedFor(ledger, QUARTER, named);
}

/** The same question about this pass's own coverage. */
export function unaccountedUnits(ledger: string): string[] {
  return unaccountedUnitsFor(ledger, [...REVIEWED_UNITS, ...Object.keys(NOT_REVIEWED)]);
}

/** What this pass does not prove. */
export const Q26_HARDENING_BOUND =
  "One quarter read by one reader, and SEVEN of the thirteen units are that reader's own — worse " +
  "than the pass before it, which had six. What a pass offers against its own work is distance in " +
  "time and a different question, never independence, and no arrangement this tree can make " +
  "changes that while the loop has the builders it has. The lenses are uneven and the reason is " +
  "the quarter's content rather than the pass's effort: the security lens had one console notice, " +
  "four pages that render it, one child-process runner and one deletion sweep to read, and its " +
  "single finding is the sweep. The simplify lens found two duplications and did not attempt the " +
  "larger question — whether a quarter that adds eleven registers should have added fewer — " +
  "because that is a judgement about the plan and this pass reads diffs. NOR IS THE FINDING COUNT " +
  "NOT A MEASUREMENT: four here against Q25's ten says how hard the quarter was read at least as " +
  "much as how well it was built, which is why the record carries the findings and not a total. " +
  "And the deepest limit is what a diff review cannot reach at all — every finding here is about " +
  "machinery, because the quarter's product surface is one amber notice, and a pass that read only " +
  "registers would report a tree in perfect health while nobody could book an appointment.";

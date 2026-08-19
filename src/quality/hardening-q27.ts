// W360: Q27 hardening — the quarter that asked what the tree already knew, read for what IT knew
// and did not read.
//
// Q27'S THEME WAS *THE TREE ALREADY KNEW, AND NOTHING READ IT*: six times in one quarter a register
// held the answer, in writing, and no check walked back to look. So the question this pass owes is
// not whether Q27's registers work — the suite says they do — but whether the quarter's own
// machinery repeats the defect it was built to catch.
//
// IT DOES, FOUR TIMES, AND THE SHARPEST IS THE QUARTER'S LAST REGISTER. W350 shipped `proseWaits`
// — the derivation that resolves every `until W<n>` in a comment against the ledger — and at
// quarter close NOTHING CALLED IT. Not a page, not a register, not its own suite. Three registers
// nevertheless changed their standing on its strength in the same quarter: `bounds.ts` retyped
// W330's `ENDING_BOUND` lifting to `inherent` because the remedy had been built, `escape-hatches.ts`
// recorded a hatch closed, and `unread-bounds.ts` recorded the condition as READ. A quarter whose
// theme is an unread answer closed on three registers agreeing that an unrun derivation had settled
// something.
//
// AND TWO OF THE FOUR ARE FIXES FROM THE PREVIOUS PASS THAT STOPPED SHORT. W343 found the hardening
// collection's argument list copied four times and wrong for two quarters, and wrote the list down
// — as module PATHS, checked against the tree. The four call sites kept their own arrays, so
// dropping a whole quarter's findings from the close gate left sixty tests green. W343 also made
// the tree-copy sweep own its directories by pid, which is right for a live run and means the sweep
// can never reclaim the ONE case it exists for: an interrupted run has a different pid. This box
// was holding 182 copies and 2.0 GB of `/tmp` when the pass looked. W331 found 426 and 3.6 GB.
//
// THE FOURTH IS A DETECTOR KEYED TO A SPELLING. W341 built the register that reports private copies
// of shared parses; W344, three units later in the same quarter, wrote the eighth copy of the
// ledger row parse, and the register neither reported nor declared it — its marker for that parse
// is the regex `/^\|` and W344's copy matched with `startsWith`. A detector that recognises how a
// thing is written misses the copy written differently, which is the only kind anybody writes.
//
// THE READER WROTE SIX OF THE THIRTEEN UNITS, which `SELF_REVIEWED` names rather than hides.
//
// WHAT THIS DOES NOT PROVE is `Q27_HARDENING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads diffs, registers, a console page and the
// system temp directory.

import { type HardeningFinding, unaccountedFor } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * W285's rule: `diffHead` is pinned rather than left at `HEAD`, because a range ending at HEAD
 * grows every time a sibling session commits and the record would then claim more than was read.
 * This one runs from the commit before W339's content to W351's close — the quarter's last commit
 * — so the Q28 units built since, four of them this reader's own, are deliberately outside it.
 */
export const QUARTER = { first: 339, last: 351, diffBase: "e352f2e", diffHead: "e5e9ca6" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W339",
  "W340",
  "W341",
  "W342",
  "W343",
  "W344",
  "W345",
  "W346",
  "W347",
  "W348",
  "W349",
  "W350",
  "W351",
];

/** Units in the range this pass did NOT read, with the reason. Empty, and checked to be. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {};

/**
 * The units this reader wrote, named rather than left for somebody to notice.
 *
 * W331'S POSTURE, and the same limit: what a pass offers against its own work is distance in time
 * and a different question, not independence. Six of thirteen here, and the distance is smaller
 * than any pass before it — four of the six were written by this reader within the day.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W340: "builder-A — a derived fact with exactly one reader.",
  W345: "builder-A — the escape hatches re-read.",
  W346: "builder-A — the console's day two.",
  W347: "builder-A — the founder's page.",
  W349: "builder-A — the survivors register over Q26's modules.",
  W351: "builder-A — the quarter close and Q28's expansion.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q27-CR-1",
    lens: "code-review",
    unit: "W350",
    what:
      "`proseWaits` shipped with NO CALLER. Not a page, not a register, not its own suite — at quarter close the name appeared in exactly three places outside the module that defines it, and all three were prose. `bounds.ts` retyped `ENDING_BOUND`'s lifting on the strength of it: the entry says W350 BUILT THE REMEDY THIS ENTRY NAMED, and its predicate went false the moment the export existed, which is a predicate resolving a NAME rather than a behaviour. `escape-hatches.ts` recorded the hatch closed for the same reason. `unread-bounds.ts` recorded the condition as read, citing `self-ending.ts::proseWaits` as the check that reads it. So the quarter whose theme is *the tree already knew and nothing read it* closed with three registers agreeing that a derivation nobody had ever run had settled a question. Both of the derivation's decisions — is this line a COMMENT, and has the unit it names LANDED — were live guards with no fixture standing on either, which W349's mutation sweep then reported as two survivors.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W352",
      evidence:
        "Six tests drive `proseWaits` against a planted ledger in both directions: a comment naming an OPEN unit is reported, a comment naming a unit the ledger holds as `done` is not, and a line of code quoting the same sentence is not a wait. W352 landed after the quarter and before this pass read it, so the finding is recorded rather than claimed — the same posture W343 took for W342's. What the pass adds is the cost: W357 then read a sweep taken before W352 landed and recorded both mutants as open remedies owed to a future unit, and W358's re-run reported them caught. A derivation nobody ran cost two registers a wrong row each, one quarter apart.",
    },
  },
  {
    id: "Q27-CR-2",
    lens: "code-review",
    unit: "W348",
    what:
      "`presenceDefects` parses its excuse keys with the shared citation parser and then throws the site half away: it built a set of FILES and exempted every non-canonical presence claim in any file that had an excuse. The two excuses are about ONE Map each — `measured` in `public-surfaces.test.ts`, `specs` in `route-coverage.test.ts` — and each of their sentences argues about that Map specifically. A `has(...)` assertion planted anywhere else in either file was silent, while the identical assertion in any other file was reported. A register whose keys promise site precision and whose comparison applies file precision reads exactly like the strict one, which is this quarter's theme in the register's own excuse list.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W360",
      evidence:
        "The site half is matched against the claim's own text — the excuse names the SUBJECT, which is what its sentence argues about, so `measured.` or `specs.` must appear in the assertion for the excuse to apply. Driven both ways: a planted `planted.has(...)` in `route-coverage.test.ts` is reported with the excuse in place, and removing the plant returns the sweep to silence with both real Map sites still excused.",
    },
  },
  {
    id: "Q27-SIMP-1",
    lens: "simplify",
    unit: "W343",
    what:
      "The previous pass fixed the copied argument list by writing down the list — and left the copies. `COLLECTED_HARDENING_REGISTERS` names six module PATHS and `registerDiff` checks them against the hardening registers the tree holds, which catches a pass whose findings nobody collects. The four `allHardeningFindings([Q22, Q23, Q24, Q25, Q26, W279])` call sites were untouched, so the names and the values were two lists and only one of them was checked. Removing `Q26_FINDINGS` from the close gate's collection left sixty tests green and `registerDiff` clean: a whole quarter's dispositions could stop being read by the gate that reads them, and the register built to prevent exactly that would agree the tree was fine.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W360",
      evidence:
        "`HARDENING_REGISTERS` maps each module path to its findings array, `COLLECTED_HARDENING_REGISTERS` is its keys, and `ALL_HARDENING_FINDINGS` is the collection over its values — so the check that reads the tree and the value the callers pass are the same object. The four call sites take the collection. Driven: removing a quarter from the map now fails `deferrals.test.ts`'s both-directions arm, where before the same removal at a call site failed nothing.",
    },
  },
  {
    id: "Q27-SIMP-2",
    lens: "simplify",
    unit: "W344",
    what:
      "`timelines.ts`'s `ledgerSha` reads `BUILD-STATE.md`, finds the row with `startsWith(\"| W<n> | \")`, splits it on `|` and takes cell five — the eighth private copy of a parse `blocked-surface.ts` exports, written three units after W341 built the register that reports them. It is neither reported nor declared. W341's markers for that parse are the file name and the regex spelling `/^\\|`, and W344's copy carries neither: a detector keyed to how a parse is WRITTEN cannot see the copy written a different way, which is the only kind anybody writes. The copy also existed for a real reason — the shared row carried `id`, `status`, `note` and `at`, and the SHA column the regex already captured was the one field it did not return.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W360",
      evidence:
        "`LedgerRow` carries `sha`, taken from the group `LEDGER_ROW` already matched, and `ledgerSha` is `allLedgerRows(root).find(...)`. The private parse is gone rather than declared, which is the disposition W341's register prefers and the one that removes the reason for the next copy. `timelines.test.ts` and `blocked-surface.test.ts` pass unchanged.",
    },
  },
  {
    id: "Q27-SEC-1",
    lens: "security-review",
    unit: "W343",
    what:
      "The tree-copy sweep now owns its directories by pid, and that made it unable to reclaim anything. The teardown exists for ONE case: residue from a run that was INTERRUPTED, because a run that finishes removes its own copies at process exit. An interrupted run's copies carry that run's pid, so a sweep matching only `tree-<this process's pid>-` can never see them; what it does match, the in-process exit handler has already removed. This is not theory — the box was holding 182 copies and 2.0 GB of `/tmp` when the pass looked, from a day of sessions where a `pnpm verify` had been killed. W331 found the same thing at 426 copies and 3.6 GB one quarter and a half earlier, and every register that could have noticed watches the REPOSITORY: `repository-clean.ts`'s artefact list is about the working tree, and the temp directory is named nowhere in it. The fix for a sweep that deleted too much shipped a sweep that deletes nothing, and the tree's own residue register cannot see either.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W360",
      evidence:
        "`reclaimableCopies(entries, pid, alive)` takes this process's copies and any copy whose maker is no longer running; liveness is a parameter because a pure function cannot ask, and the harness passes `process.kill(pid, 0)` with `EPERM` read as alive so a reused pid errs toward keeping the directory. The mtime window still applies to this run's OWN copies, where the question is whether our pid was reused, and not to a dead maker's, which is what made the sweep inert. Driven in `hardening-q26.test.ts`, where Q26's own evidence is re-derived through the new rule: a LIVE sibling's copy is still never swept, and a dead maker's now is. Measured on the real thing — the first run after the change took `/tmp` from 2.0 GB to 211 MB.",
    },
  },
];

/** The findings this pass raised, by id, for a suite that re-derives each. */
export function finding(id: string): HardeningFinding {
  const found = FINDINGS.find((f) => f.id === id);
  if (found === undefined) throw new Error(`no finding ${id}`);
  return found;
}

/**
 * Units in this pass's range that it names nowhere.
 *
 * THE SHARED DERIVATION, and this pass is the one that must not copy it: `unaccountedFor` takes
 * the range as an argument precisely so a second pass does not write a second copy, which is
 * `Q27-SIMP-2` with the subject changed.
 */
export function unaccountedUnits(ledger: string): string[] {
  return unaccountedFor(ledger, QUARTER, [...REVIEWED_UNITS, ...Object.keys(NOT_REVIEWED)]);
}

/** What a green pass does not prove. */
export const Q27_HARDENING_BOUND =
  "One quarter read by one reader, and SIX of the thirteen units are that reader's own — with less " +
  "distance than any pass before it, because four of the six were written within the day. What a " +
  "pass offers against its own work is a different question asked later, never independence, and " +
  "asked the same day it is barely even later. THE LENSES ARE UNEVEN AND THE QUARTER IS WHY: the " +
  "security lens had one console page, one notice component and the harness to read, and its " +
  "finding is the harness — as it was last quarter, on the same sweep, in the opposite direction. " +
  "A lens that keeps finding the same object is a lens with one object. THE FINDING COUNT IS NOT A " +
  "MEASUREMENT: five here says how hard the quarter was read at least as much as how well it was " +
  "built, which is why this record carries findings and no total. FOUR OF THE FIVE ARE ABOUT " +
  "REGISTERS READING REGISTERS, and the fifth is about a temporary directory; not one is about " +
  "whether a practice can do anything it could not do before, because the quarter's product " +
  "surface is one waiting notice and one founder page. A pass that read only machinery would " +
  "report a tree in excellent health while nobody could book an appointment. AND THE PASS CANNOT " +
  "CHECK ITS OWN COMPLETENESS: it reports what this reader saw in one range of diff, and the " +
  "defect this quarter is named for — an answer the tree holds that nothing reads — is by " +
  "construction the kind a reader does not notice missing.";

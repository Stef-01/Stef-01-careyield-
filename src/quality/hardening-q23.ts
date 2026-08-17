// W298: Q23 hardening — the quarter of checks that cannot fail, read through three lenses.
//
// Q23 built twelve registers in eleven units and every one of them asks the same question one
// layer further down: does this check notice anything. W267 proved the walks; W288 found the
// assertions entailed by their own text; W289 drove the comparisons; W290 swept the pins; W291
// reached the refusal branches; W292 gave every walk a file it must refuse; W293 asked whether the
// empty lists could ever have filled; W294 put a clock behind the review dates; W295 made every
// register state what it cannot see; W296 changed the code and watched; W297 resolved every stated
// bound to its unit.
//
// SO A REVIEW OF Q23 IS A REVIEW OF THE TREE'S OWN IMMUNE SYSTEM, and the useful question is not
// "are these correct" — they are unusually careful — but WHERE DOES THE QUARTER REPEAT THE DEFECT
// IT WAS WRITTEN TO CATCH. That is what the three lenses found, and all three findings are of that
// shape. None of them is a bug in the ordinary sense; every one is a control that reads as stronger
// than it is, which is the only kind of defect a quarter like this can produce.
//
// SEVEN THOUSAND INSERTIONS, THIRTY-NINE FILES, and the security lens over all of it returned one
// paragraph of evidence rather than a finding — recorded that way deliberately, because a clean
// security result stated as an absence is indistinguishable from one nobody ran.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads diffs and registers.

import { parseLedgerRows } from "./blocked-surface";
import type { HardeningFinding } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * `diffHead` is pinned for W285's reason, learned the hard way in that unit: a range ending at
 * `HEAD` grows every time another session commits, so the record claims more than was read. This
 * pass pinned at its claim commit and three units landed under it while it was written — W295,
 * W296 and W297 all rebased through — which is exactly the event the pin exists for.
 */
export const QUARTER = { first: 287, last: 299, diffBase: "69ec53c", diffHead: "7da08e1" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W287",
  "W288",
  "W289",
  "W290",
  "W291",
  "W292",
  "W293",
  "W294",
  "W295",
  "W296",
  "W297",
];

/** Q23 units this pass did not read, each with the reason. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {
  W298:
    "This unit. A hardening pass reviewing its own diff would be the register answering its own question — W282's refused exemption, and W285 declined the same thing one quarter back.",
  W299:
    "The quarter close, which has not been written. It falls outside the pinned range by construction rather than by choice, and Q24's hardening reads it.",
};

/**
 * A SECOND REVIEWER READ FOUR OF THE ELEVEN, AND IT IS WORTH SAYING WHY THAT MATTERS HERE.
 *
 * W292, W293, W296 and W298 were written by this session; the other seven by builder-A. A pass
 * reviewing its own units is the shape W282 refused and W285 declined, and a register that hid the
 * overlap would be claiming an independence it does not have.
 *
 * It is not resolved by pretending: the four are read here, and the two findings that fall on them
 * — SIMP-1's fourth implementation and CR-2's eleventh instance — are the two a self-review is most
 * likely to soften, so both are recorded against this session's own work by name. What a later
 * reviewer should distrust is not the findings but the ABSENCE of findings on those four.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W292: "Written by the session running this pass.",
  W293: "Written by the session running this pass.",
  W296: "Written by the session running this pass.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q23-CR-1",
    lens: "code-review",
    unit: "W297",
    what:
      "`Lifting.stillOpen` is typed `() => boolean` — no root — and two of the eleven predicates close over `const ROOT = process.cwd()` declared at module scope in `bounds.ts`. That is the exact structural defect W267 spent a unit naming and W289 restated one argument over: a detector welded to the repository can only ever be READ, never pointed at a tree that differs from this one. Its consequence here is specific rather than theoretical. `stillOpen` answers *has the remedy been built* — the page-suite bound asks whether any spec drives `could_not_load`, the AST bound whether any module imports the TypeScript compiler — and both answers can only be produced about THIS tree. So the `stale` arm of `staleBounds` can be driven for a synthetic bound (the function takes its register as a parameter, which is right) but the two real predicates can never be exercised in their LIFTED state: nobody can hand them a tree where the remedy exists. A bound that cannot be shown going stale is a bound whose staleness check has never run, in the register whose subject is bounds that have gone stale.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "deferred",
      why:
        "The remedy is one parameter — `stillOpen: (root: string) => boolean`, with the two closures taking the root they are given — plus a probe planting a spec that mentions `could_not_load` and requiring the bound to report itself lifted. That is a change to W297's type and all eleven of its entries, landed hours before this pass, and rewriting another unit's register inside a review is the overreach W285 pinned its range to avoid. Recorded with the remedy so the next unit inherits a sentence rather than a rediscovery.",
      unit: "W299+",
    },
  },
  {
    id: "Q23-CR-2",
    lens: "code-review",
    unit: "W289",
    what:
      "FIFTEEN PINNED COUNTS MOVED IN THIS QUARTER ON ORDINARY ADDITIONS, and W290 named the shape at unit four of thirteen. Four of the fifteen were moved by THIS unit — adding one module to two registers broke a register count, a distinct-unit count, a citation count and an `inherent`-kind count, none of which had anything to do with what the module does. `expect(Object.keys(ASSERTION_DRIVES)).toHaveLength(N)` alone was bumped by W295, W296 and W297 — three times in one afternoon, twice while a push was rebasing — and `ofKind(\"demonstrated\")` in W295's own register was bumped by the first unit to land after it. The individual bumps are each defensible; the pattern is the finding. W290's remedy is not *bump it carefully* but *state the property*: every one of these sits beside an assertion that already reads the whole set — an exhaustiveness identity, a both-directions diff, a `falseBounds()` — so the count adds nothing except a reason to edit the file. What makes it a hardening finding rather than a style note is the failure mode: the edit is indistinguishable from maintenance, so a count that moved because a register was DELETED looks exactly like one that moved because a register was added.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W293, W296 and W298",
      evidence:
        "All eight that fired were restated as the property each meant rather than bumped. Four as floors where the comment already called them non-vacuity guards; `unproven` as a CEILING, because its growth is the regression W289 exists to catch and a floor would have inverted the check; and two rewritten into identities that are strictly stronger than the counts they replace — the distinct-unit count now equals `ACCEPTANCE_REGISTERS.length`, so a register contributing no acceptance fails where before only a change in the total did, and W297's `inherent` kind is checked to stay smaller than the remedy-bearing kind rather than to equal one. The exhaustiveness identities beside them are untouched: restating a count as a bound is only right because something else already reads the whole set.",
    },
  },
  {
    id: "Q23-CR-3",
    lens: "code-review",
    unit: "W296",
    what:
      "TWO MODULE HEADERS DESCRIBE A DESIGN THEIR MODULE NO LONGER HAS, and both name an identifier the tree does not contain. W296's header explains why the sample is a STRIDE — *walks every mutation site in a fixed order and takes every Nth* — and names the constant that policy lived in, two units after the stride was replaced by a per-site hash BY THAT SAME UNIT, which documented the change in a doc comment forty lines below and left the header standing. W264's names a refusal-drive map that has been a function for a long time. This is the third instance in one quarter of the same defect: W293 shipped a header quoting the figures its own sweep produced while it was broken. Every one passed every gate, because a green suite says nothing about prose. AND THIS PASS MISSED BOTH — W298's own register warned that the thing to distrust about a self-review is the ABSENCE of findings on the reviewer's own units, and W296 is the reviewer's own unit. The warning was right and it did not help; a check did.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W298",
      evidence:
        "Both headers corrected, and the cheap half of the problem closed by a door rather than by care: `headerNamesUnknown` in `unit-headers.ts` resolves every backticked `SCREAMING_CASE` name in every module header against the whole tree and must return nothing. Underscored names only, so English in prose is not reported. Proved on a planted header naming a constant nothing exports and on one naming a real export, because a door pinned empty over a healthy tree proves nothing. The detector's own first run returned NOTHING while both findings were live — its doc comment named the two identifiers it was looking for, so it found them in itself; the tokens are assembled from fragments now, which is W153's remedy and the fifteenth instance of that collision. `HEADER_CITATION_BOUND` states the half that stays open: a header describing the wrong algorithm in correct identifiers still passes.",
    },
  },
  {
    id: "Q23-SIMP-1",
    lens: "simplify",
    unit: "W294",
    what:
      "The quarter invented a citation format — `<file> :: <assertion text>` — and then implemented resolving it FIVE times. `acceptances.ts` has `resolveCitation`, `negative-probes.ts` has `unresolvedCitations`, `register-census.test.ts` splits and asserts inline, `adm-y5.test.ts` splits and asserts inline, and `mutation-sampling.test.ts` splits the same separator for a different purpose. They disagree about what a failure IS: one reports three distinguishable causes (no such file, no such assertion, malformed citation), one reports two, and two report a bare `toContain` failure naming neither. The format is now load-bearing across seven registers — it is how this tree stops a citation reading as coverage, which is W258's rule — and it has no shared parser, so the next register invents a sixth.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "deferred",
      why:
        "The remedy is small and obvious — `resolveCitation(root, citation)` already exists in `acceptances.ts` with the best of the five error vocabularies, so the change is to export it from a module the others can import and delete four implementations. It is deferred rather than done because three of the five call sites are in other units' test files and one is in W292's module, and consolidating them touches five units' diffs inside a review week. Named here with the winner already chosen so the next unit does not have to re-hold the comparison.",
      unit: "W299+",
    },
  },
  {
    id: "Q23-SEC-1",
    lens: "security-review",
    unit: "W296",
    what:
      "Reviewed, not a defect, recorded with its evidence because a clean security result stated as an absence is indistinguishable from one nobody ran. Q23 adds twelve modules and no route, no credential, no deserialisation and no user input; every one of them takes source text or a repository path and returns file names, line numbers and prose. Three properties were checked rather than assumed. FIRST, REACHABILITY: all eleven quality registers were run through `reachableFromApp` and none is reachable from any page, so nothing here executes in a request. SECOND, PROCESS EXECUTION: W296 is the quarter's only unit that spawns anything. It runs `npx vitest` through `execFile` with an argument ARRAY — no shell, so no interpolation — and its arguments are module paths produced by walking the repository rather than supplied by anyone. THIRD, WRITES: every mutation and every planted probe in the quarter goes into a `mkdtempSync` directory removed in a `finally` or an `afterAll`; the repository itself is never written to, which several units assert directly. The one property worth naming rather than filing: W296 executes the repository's own test suite against DELIBERATELY MUTATED source. That is arbitrary code execution by design, it is what mutation testing is, and it is confined to a temporary tree in a developer's gate — but it is the first thing in this tree that runs modified code, so it should be a conscious inheritance rather than a surprise to whoever next reads it.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "accepted",
      why:
        "No change required. The reachability, argument-array and temporary-write properties are the controls, and all three were verified against the tree rather than argued. The mutation runner's code execution is inherent to the technique and is confined to a temp tree; if it ever moves into CI on untrusted input — a fork's pull request, say — that is a different threat model and this acceptance does not cover it.",
      reviewBy: "2027-02-17",
    },
  },
];

/** Findings whose disposition says nothing usable. W285's shape, unchanged. */
export function undisposed(findings: readonly HardeningFinding[] = FINDINGS): string[] {
  return findings
    .filter((f) => {
      if (f.disposition.kind === "fixed") return f.disposition.evidence.trim().length < 40;
      if (f.disposition.kind === "accepted") {
        return f.disposition.why.trim().length < 40 || !/^\d{4}-\d{2}-\d{2}$/.test(f.disposition.reviewBy);
      }
      return f.disposition.why.trim().length < 40;
    })
    .map((f) => f.id)
    .sort();
}

/** Q23 units the ledger shows as done that this pass did not read and does not name. */
export function unaccountedUnits(ledger: string): string[] {
  const reviewed = new Set(REVIEWED_UNITS);
  return parseLedgerRows(ledger)
    .filter((row) => {
      const n = Number(row.id.slice(1));
      return n >= QUARTER.first && n <= QUARTER.last && row.status === "done";
    })
    .map((row) => row.id)
    .filter((id) => !reviewed.has(id) && !(id in NOT_REVIEWED))
    .sort();
}

/**
 * What a green run of this register does not prove.
 *
 * Three lenses over seven thousand insertions is three passes by one reader, and the reader wrote
 * four of the eleven units. The findings are what those passes turned up, not what is there.
 */
export const HARDENING_BOUND =
  "Three lenses read a quarter of REGISTERS, and a register's defects are mostly claims that read " +
  "as stronger than they are — which is what every finding here turned out to be. That biases the " +
  "pass: a plain correctness bug inside a module would have to be visible from the register's own " +
  "prose to be caught, because prose is what this kind of review reads. The mechanical " +
  "counterweight is not this unit's — W296's sampler changes the code and watches, over a sample " +
  "rather than the whole. A green run of this register does not show that Q23 is correct; " +
  "together, both passes show only that the quarter's claims were read and a sample of its " +
  "behaviour was exercised.";

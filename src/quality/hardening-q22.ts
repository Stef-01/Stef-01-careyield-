// W285: Q22 hardening — the quarter's diff read through three lenses, with every finding disposed.
//
// The quarter is W274–W286 and the diff read is `6b244f1..3dcaf6b`: 51 files, 4,334 insertions, ten
// units landed by two builders. Read for correctness, for security, and for what could be simpler.
//
// THREE FINDINGS AND ONE CLEAN RESULT, and the clean result is stated with its evidence rather
// than as an absence, because "we looked and found nothing" and "we did not look" produce the same
// empty list.
//
// CR-1 IS THE ONE WORTH THE UNIT. W284 built a register saying which spec opens which route, and
// its whole claim over a hand-kept list is in its own words: *"the claims are RESOLVED here rather
// than trusted — 'spec X opens route Y' is checked against spec X."* For one route it resolved
// nothing. `specOpens` chose its branch on `probe.endsWith("/")`, a property of the string rather
// than of how it was derived; `/` is a static route that ends in a slash, so the root took the
// prefix branch and the check became `text.includes("/")` — **true of every spec ever written.**
//
// A CLAIM I WROTE AND THEN CORRECTED, recorded because the correction is the more useful half. The
// first version of this finding said the vacuity was excusing a FALSE citation: `landing.spec.ts`
// was declared as exercising `/`, and grepping its `goto(` calls showed `/practices` and a `STORY`
// constant, with its own header saying the B2B landing moved off the root. All true, and the
// conclusion was wrong — `STORY` is `"/"` four lines down, and the spec also sweeps `["/", ...]`.
// The citation was correct all along. The defect is exactly and only that nothing was checking it:
// any spec in the tree could have been named for `/` and passed. Which is worth more than the
// wrong version, because a vacuous check that happens to sit over a true claim is the shape this
// tree keeps finding, and it stays vacuous until the claim stops being true.
//
// CR-2 CAME OUT OF FIXING CR-1. With the root route resolving properly, `landing.spec.ts` matched
// on the `"/"` inside its own header comment — a resolution check reading prose as navigation.
// Measured before touching it: no citation in the register depends on a comment today, so the
// subtraction changes no answer and closes the way one could.
//
// HYG-1 IS MINE, AND IT IS THE KIND OF THING ONLY A DIFF REVIEW FINDS. W281 added a comment header
// to eleven modules with a script that read and rewrote each file in text mode. Python's universal
// newlines converted `src/demo/clinicians.ts` — **the only CRLF file in the repository**, written
// outside the unit loop in a different editor — to LF, rewriting all 526 lines. The commit reads
// as "+16 lines of header"; `git diff --ignore-all-space` says so, and plain `git diff` says 1,068.
// The outcome is right and reverting would reintroduce the sole outlier, so it is accepted — with
// the invariant now DECLARED in `.gitattributes` so the next one is a no-op instead of a surprise.
//
// SIMP-1 IS ALSO MINE. `knownUnits` in W281 parsed ledger rows with its own regex while W263's
// `blocked-surface.ts` had been parsing them since Q20. Composed now.
//
// WHAT THE SECURITY LENS FOUND: nothing new, and here is what was checked. The quarter's one
// security-relevant change is W280's, and it CLOSES a cross-tenant read — `sessionAppointmentType`
// now takes the practice into the query. Its scoping is real rather than decorative: the only
// caller is `app/book/[token]/page.tsx`, where the invitation comes from a SIGNED token resolved
// against the store, so the practice id travels with the same trusted record as the clinician id
// and is never attacker-supplied. Nine modules that read files from disk landed this quarter; none
// of them is reachable from `app/`, checked with W201's own `reachableFromApp` rather than by
// reading imports. No new route, no new credential, no new deserialisation.
//
// THE REVIEWED RANGE IS DATA, NOT A CLAIM ABOUT THE QUARTER. W279 landed while this unit was
// being written, after the reviewed range ended, so it is NOT reviewed and this register says so
// by name. It deliberately does NOT assert "every Q22 unit is reviewed": that would go red the
// moment W279 lands, which is the pin-a-transient-value failure this tree has recorded five times.
// A register that reports the gap is useful; one that fails on a planned event gets edited.
//
// FOUNDER GATE (plan §4): nothing crossed. Every fix is to check machinery; no product behaviour
// changed, and the one citation repointed is a test-coverage claim.

import { parseLedgerRows } from "./blocked-surface";

/** The lens a finding came from. The gate names three; each one produced something. */
export type Lens = "code-review" | "security-review" | "simplify";

export type Disposition =
  | { kind: "fixed"; by: string; evidence: string }
  | { kind: "accepted"; why: string; reviewBy: string }
  | { kind: "deferred"; why: string; unit: string };

export interface HardeningFinding {
  id: string;
  lens: Lens;
  /** The unit whose diff introduced it. Named, because "somewhere in the quarter" is not a finding. */
  unit: string;
  what: string;
  /** ISO date the finding was raised. */
  raisedOn: string;
  disposition: Disposition;
}

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * `diffHead` is pinned rather than left as HEAD, and finding out why is the last thing this unit
 * learned. The review was taken over `6b244f1..3dcaf6b`. While it was being written builder-A
 * landed W279, and this unit's push rebased on top of it — so `6b244f1..HEAD` silently GREW to
 * include a unit nobody here read. A range ending at HEAD is a claim that gets larger every time
 * somebody else commits, which is the opposite of what a review record is for.
 */
export const QUARTER = { first: 274, last: 286, diffBase: "6b244f1", diffHead: "3dcaf6b" } as const;

/**
 * The units whose diffs were actually read.
 *
 * Listed rather than derived from the quarter's range, because those are different facts and
 * conflating them is how a hardening week comes to claim more than it did.
 */
export const REVIEWED_UNITS: readonly string[] = [
  "W274",
  "W275",
  "W276",
  "W277",
  "W278",
  "W280",
  "W281",
  "W282",
  "W283",
  "W284",
];

/** Q22 units this pass did not read, each with the reason. Kept honest rather than kept empty. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {
  W279: "Landed by builder-A while this unit was being written, AFTER the reviewed range ended at `3dcaf6b`. Its diff was never read here. It is named because the alternative is silence: this unit rebased onto W279 to push, so an unpinned `6b244f1..HEAD` would now cover it and the register would be claiming a review that did not happen. The quarter close (W286) is where it gets read.",
  W285: "This unit. A hardening pass reviewing its own diff would be the register answering its own question, which is the exemption W282 refused for the census.",
  W286: "The quarter close, not yet written. It inherits W279 as well as itself, which is stated here so the next unit does not have to rediscover the gap.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "CR-1",
    lens: "code-review",
    unit: "W284",
    what:
      "`specOpens` chose its matching branch on `probe.endsWith(\"/\")` — a property of the probe string rather than of how it was derived. `/` is a static route that ends in a slash, so the root took the dynamic-segment prefix branch and the check collapsed to `text.includes(\"/\")`, true of every spec in the tree. The register's stated value is that a citation is RESOLVED against the spec it names, and for the root route it resolved nothing: any spec could have been named for `/` and passed. THE CITATION ITSELF WAS CORRECT — this finding first claimed `landing.spec.ts` never opens the root, on the evidence of its `goto(` calls and its own header saying the B2B landing moved off `/`; `STORY` is `\"/\"` four lines further down and the spec also sweeps `[\"/\", ...]`. The correction is kept because it is the point: a vacuous check sitting over a true claim stays vacuous until the claim stops being true, and nothing would have said so.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "fixed",
      by: "W285",
      evidence:
        "The branch asks whether the ROUTE contains a dynamic segment. The citation is unchanged, because it was right. Proved by mutation: restoring `probe.endsWith(\"/\")` makes a spec that opens only `/practices` read as opening `/`, and `hardening-q22.test.ts` fails on it.",
    },
  },
  {
    id: "HYG-1",
    lens: "code-review",
    unit: "W281",
    what:
      "W281 headered eleven modules with a script that read and rewrote each file in text mode. `src/demo/clinicians.ts` was the only CRLF file in the repository — written outside the unit loop, in a different editor — and Python's universal newlines silently converted all 526 lines to LF. The commit presents as a sixteen-line header addition and `git diff` reports 1,068 changed lines; `git blame` for the tree's largest body of patient-facing prose now points at a comment change.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "accepted",
      why: "The outcome is correct — that file was the sole CRLF outlier and the tree is LF everywhere else — and reverting would reintroduce it as the one file out of step. What was wrong is that it happened undeclared, so the invariant is declared instead: `.gitattributes` sets `* text=auto eol=lf`, which makes the next accidental conversion a no-op rather than a 526-line diff hidden inside a comment change. The blame reflow is real, one-time, and not worth a second rewrite to undo.",
      reviewBy: "2027-02-14",
    },
  },
  {
    id: "CR-2",
    lens: "code-review",
    unit: "W284",
    what:
      "Found while fixing CR-1, which is the only way it could have been found: with the root route resolving properly, `landing.spec.ts` still read as opening `/` — on the `\"/\"` inside its own header comment. A spec's header is where it explains which routes it does and does not open, so a resolution check that reads comments as navigation can confirm a citation from prose describing the opposite.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "fixed",
      by: "W285",
      evidence:
        "`specOpens` subtracts block and line comments before matching, W173's rule and W275's precedent in `suiteFilters`. Measured before adding rather than assumed useful: zero citations in the register resolve only via a comment today, so no answer changed. The subtraction is proved real — a route named only in a comment must not resolve, and one in code must.",
    },
  },
  {
    id: "SIMP-1",
    lens: "simplify",
    unit: "W281",
    what:
      "`knownUnits` parsed ledger rows with its own `/^\\| W(\\d+) \\|/gm` while W263's `blocked-surface.ts` had exported a row parser since Q20. Two spellings of one parse, and the looser of the two counted a half-written row as a unit.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "fixed",
      by: "W285",
      evidence:
        "`blocked-surface.ts` gained `parseLedgerRows(text)`, `ledgerRows(root)` composes it, and `knownUnits` uses it. The stricter shape is a behaviour change and is asserted rather than assumed: a malformed row is now no unit at all.",
    },
  },
  {
    id: "SEC-1",
    lens: "security-review",
    unit: "W280",
    what:
      "Reviewed, not a defect, and recorded because a clean security result stated as an absence is indistinguishable from one nobody ran. The quarter's only security-relevant change is W280's practice-scoping of `sessionAppointmentType`, which CLOSES a cross-tenant read. Checked that the scoping is real rather than decorative: the sole caller is `app/book/[token]/page.tsx`, where the invitation is resolved from a SIGNED token against the store, so the practice id travels with the same trusted record as the clinician id and is never attacker-supplied. Also checked that none of the quarter's nine new file-reading modules is reachable from `app/`, using W201's `reachableFromApp` rather than by reading imports. No new route, credential, or deserialisation landed.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "accepted",
      why: "No change required. Recorded so the quarter carries evidence of what the security lens actually examined.",
      reviewBy: "2027-02-14",
    },
  },
];

/** Findings with no disposition worth the name. The list this register exists to keep empty. */
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

/** Q22 units the ledger shows as done that this pass did not read and does not name. */
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

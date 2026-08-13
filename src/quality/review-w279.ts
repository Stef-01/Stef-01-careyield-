// W287: W279 reviewed — the unit Q22's hardening declared out of range.
//
// W285 read `6b244f1..3dcaf6b` and pinned that range because W279 landed mid-pass and W285's push
// rebased onto it. Leaving `HEAD` unpinned would have made the register claim a review that never
// happened, so W279 went into `NOT_REVIEWED` by name. This is the unit that reads it, and the
// hardening register's not-reviewed list is shortened by exactly this one.
//
// A REVIEW THAT FINDS NOTHING IN A CAREFULLY BUILT UNIT IS THE LIKELIEST OUTCOME AND THE LEAST
// USEFUL ONE, so it is worth saying what this found and how. W279 is a good module: three states
// with one vocabulary, twenty-seven routes each argued, a structural detector attempted and
// ABANDONED with the reason recorded rather than tuned until it agreed, and a `RUNTIME_BOUND`
// saying what a green register does not prove. Most of a review of it is confirmation.
//
// AND THEN ONE CLAIM IS FALSE, AND IT IS THE LOAD-BEARING ONE. W279 declares `could_not_load` on
// no route, and the argument for that appears four times — in the module header, in
// `RUNTIME_BOUND`, in `REFUSED_ZERO_SHAPES.declaring_could_not_load_everywhere`, and in a test
// comment. Every version of it is a UNIVERSAL: *"every console read is an in-memory store call
// that cannot throw"*, so the state has nowhere to arise.
//
// It is not universal. `/console/interest` reads `.data/interest-signups.jsonl` — a file on disk,
// outside the repository, appended to by a PUBLIC form. `readRows` returns `[]` when the file is
// absent and silently drops any line that fails `JSON.parse`, so a truncated append, a partial
// write, or a missing volume renders "nobody has signed up" to whoever is reading. That is exactly
// the substitution W179 split the feed's zero to prevent and exactly the one W279 was written to
// stop — in the register that stops it.
//
// AND THE ROUTE IT HAPPENS ON IS THE ONE THE REGISTER ARGUES HARDEST ABOUT. W279's `why` for
// `/console/interest` reads *"Interest signups arrive from the public form. Empty means nobody has
// signed up, which is a fact about the form rather than a connection."* The sentence is about
// where the DATA comes from. The zero is about where the READ goes. Those are different ends of
// the pipe, and the classification followed the wrong one.
//
// MEASURED, NOT ARGUED, AND THE MEASUREMENT IS THE FIX. `fallibleConsoleReads` walks each console
// page's own import closure — `reachableFrom`, W271's extraction, the same walker W201 uses — and
// asks which of them reach `node:fs`. Exactly one does. So the register can carry the fact rather
// than the adjective: this route's read is FALLIBLE, checked against the import graph in both
// directions, and the day somebody moves another store to disk the check names it.
//
// WHY THE STATE IS STILL NOT DECLARED ON THE ROUTE, which is the interesting half. Adding
// `could_not_load` to `/console/interest` would satisfy the letter of the finding and violate
// W279's own refusal: `listInterestSignups()` returns `[]` whether the file is missing, corrupt or
// genuinely empty, so the PAGE cannot tell which and could not render the state if it were
// declared. A control declared where it cannot arise is the paper trail of a control that does not
// exist — W279's words, and they are right. The remedy is a store that reports the difference, and
// it is named here rather than performed, because performing it is product work in a review unit.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads import graphs and copy registers.

import { readFileSync } from "node:fs";
import path from "node:path";
import { reachableFrom } from "@/security/reachability";
import { CONSOLE_ZERO_STATES } from "@/console/zero-states";
import type { HardeningFinding } from "./hardening-q22";

/** The unit under review, and the commit whose diff was read. Pinned, W285's lesson. */
export const REVIEWED = { unit: "W279", commit: "7692d44" } as const;

/**
 * Console routes whose read can fail, declared with the remedy.
 *
 * Checked against `fallibleConsoleReads` in both directions rather than trusted: a declaration
 * nobody resolves reads as coverage, and a route that becomes fallible without being declared is
 * the exact event this exists to catch.
 */
export const FALLIBLE_READS: Readonly<Record<string, string>> = {
  "/console/interest":
    "Reads `.data/interest-signups.jsonl` through `readRows`, which returns `[]` for a missing file and silently drops any line that fails `JSON.parse`. A truncated append or an unmounted volume renders as `nothing_yet`. REMEDY: `listInterestSignups` returns a result that distinguishes 'no file', 'unparseable rows dropped' and 'no signups', and the page renders `could_not_load` for the first two. Until it does, the state is deliberately NOT declared on the route — W279's own refusal, and it is right: a control declared where the page cannot reach it is a paper trail.",
};

/**
 * Console routes whose own import closure reaches `node:fs`.
 *
 * Per-route rather than app-wide, which is the whole point: `reachableFromApp` answers "can the app
 * touch the filesystem" — trivially yes — and cannot answer "can THIS page's read fail". W271
 * extracted `reachableFrom` for exactly this distinction.
 */
export function fallibleConsoleReads(root: string): string[] {
  const out: string[] = [];
  for (const route of CONSOLE_ZERO_STATES) {
    const page = path.join(root, "app", route.route.replace(/^\//, ""), "page.tsx");
    let closure: readonly string[];
    try {
      closure = reachableFrom(root, [page]).files;
    } catch {
      continue; // no page file — the route is served some other way; not this check's subject
    }
    const touchesDisk = closure.some((file) => {
      let source: string;
      try {
        source = readFileSync(path.join(root, file), "utf8");
      } catch {
        return false;
      }
      return /from "node:fs"|require\("node:fs"\)/.test(source);
    });
    if (touchesDisk) out.push(route.route);
  }
  return out.sort();
}

export interface FallibleDiff {
  /** A route whose read reaches disk and which the register does not declare. */
  undeclared: string[];
  /** A declared route whose read no longer reaches disk. */
  stale: string[];
  /** A declaration with no remedy worth the name. */
  withoutRemedy: string[];
}

/**
 * Both directions, W102's shape.
 *
 * Takes the register as an argument — `coverageDiff`'s shape one module over, and W291's rule
 * rather than a preference: a reporter whose branches cannot be reached from outside cannot be
 * shown firing, and a refusal arm nobody has ever driven is the shape this tree keeps finding.
 */
export function fallibleDiff(
  root: string,
  declaredReads: Readonly<Record<string, string>> = FALLIBLE_READS,
): FallibleDiff {
  const derived = fallibleConsoleReads(root);
  const declared = Object.keys(declaredReads);
  return {
    undeclared: derived.filter((r) => !(r in declaredReads)).sort(),
    stale: declared.filter((r) => !derived.includes(r)).sort(),
    withoutRemedy: declared.filter((r) => !(declaredReads[r] ?? "").includes("REMEDY:")).sort(),
  };
}

/** What this review read, and what it did not. */
export const REVIEW_SCOPE =
  "The whole of W279's diff — `src/console/zero-states.ts` and `src/console/zero-states.test.ts`, " +
  "331 insertions across four files, the other two being its copy-surface registration. Read for " +
  "correctness, for security and for what could be simpler. It does NOT re-review the modules " +
  "W279 composes (`@/ops/silence`, W271's route register); those are other units' diffs and " +
  "claiming them would be the overreach W285 pinned its range to avoid.";

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "W279-CR-1",
    lens: "code-review",
    unit: "W279",
    what:
      "The register declares `could_not_load` on no route, and argues it four times over — module header, `RUNTIME_BOUND`, `REFUSED_ZERO_SHAPES.declaring_could_not_load_everywhere`, and a test comment — with the same UNIVERSAL: every console read is an in-memory store call that cannot fail, so the state has nowhere to arise. It is not universal. `/console/interest` reads `.data/interest-signups.jsonl`, a file on disk outside the repository appended to by a public form; `readRows` returns `[]` for a missing file and silently drops any line failing `JSON.parse`. A truncated append or an unmounted volume renders 'nobody has signed up' — the exact substitution W179 split the feed's zero to prevent, in the register written to prevent it everywhere else. The route's own `why` argues from where the DATA comes ('signups arrive from the public form') rather than from where the READ goes, which is how the classification followed the wrong end of the pipe. Measured rather than argued: of the twenty-seven console routes, exactly one has an import closure reaching `node:fs`.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "fixed",
      by: "W287",
      evidence:
        "The four false universals are corrected to name the exception. `/console/interest`'s `why` now argues from the read. `FALLIBLE_READS` declares the route with its remedy and is checked against each console page's own import closure in both directions, so a store moved to disk is named rather than assumed in-memory. The state is deliberately still NOT declared on the route — see W279-CR-2.",
    },
  },
  {
    id: "W279-CR-2",
    lens: "code-review",
    unit: "W279",
    what:
      "The consequence of CR-1, and it is a product change rather than a register change: `listInterestSignups()` returns `[]` whether the file is missing, partly unparseable or genuinely empty, so `/console/interest` CANNOT render `could_not_load` even now that it is known to be reachable. Declaring the state on the route would satisfy the letter of CR-1 and violate W279's own refusal — a control declared where the page cannot reach it is the paper trail of a control that does not exist.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "deferred",
      why: "The remedy is a store that distinguishes 'no file', 'rows dropped' and 'no signups', plus a page branch to render it — product work, and W287 is a review unit. Deferring is the honest call rather than declaring a state the page cannot show. The remedy is written into `FALLIBLE_READS` so the next unit inherits it as a sentence rather than rediscovering the finding.",
      unit: "W288+",
    },
  },
  {
    id: "W279-SIMP-1",
    lens: "simplify",
    unit: "W279",
    what:
      "`ZERO_STATE_COPY` is typed `Record<ZeroState, CauseCopy>` while `REFUSED_ZERO_SHAPES` forty lines below it is `Readonly<Record<string, string>>`. The mutable one is the register a caller could reassign, and the module's own argument for the `Record<union, …>` shape — a fourth state fails the build until its copy exists — survives `Readonly` unchanged.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "fixed",
      by: "W287",
      evidence: "Typed `Readonly<Record<ZeroState, CauseCopy>>`; the union-keyed build failure it was written for is unaffected, which the existing test still proves.",
    },
  },
  {
    id: "W279-SEC-1",
    lens: "security-review",
    unit: "W279",
    what:
      "Reviewed, not a defect, recorded with its evidence because a clean security result stated as an absence is indistinguishable from one nobody ran. W279's diff adds one data module and its test: no route, no credential, no deserialisation, no user input, and every string in it is operator copy already declared in W200's surface and passing the advice linter. The one place the review touched live behaviour is the read behind `/console/interest`, and what is wrong there is legibility rather than exposure — `readRows` drops unparseable lines silently, which loses data quietly instead of leaking it. Worth noting beside it: that path is the tree's only store holding real contact details, and W265 already dispositions its erasure on a different subject.",
    raisedOn: "2026-08-14",
    disposition: {
      kind: "accepted",
      why: "No change required by this review. The silent row-dropping is recorded under CR-2's remedy rather than as a separate security finding, because its consequence is a misleading zero rather than an exposure.",
      reviewBy: "2027-02-14",
    },
  },
];

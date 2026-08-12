// W268: the latent-finding register at five years — re-derived from source, not from its record.
//
// W210's mechanism is that a recorded finding carries a PREDICATE the suite runs, so the day the
// finding goes live the build fails rather than an audit finding the damage two years later. It
// works: the audit records W210's register firing on W257 mid-build, for the exact failure it was
// recorded against.
//
// THE GATE'S WORDS ARE "RE-EVALUATED FROM SOURCE RATHER THAN FROM ITS OWN RECORD", and the reason
// that phrasing matters is a failure mode the mechanism cannot see in itself. **A predicate is a
// proxy for a condition, and a proxy can stop pointing at the thing.** Rename a field, move a
// directory, reword a comparison, and the predicate returns `false` — not because the condition
// became untrue but because the predicate can no longer observe it. `fired()` returns an empty
// list either way. **A silently unfirable predicate is worse than a fired finding**, because a
// fired finding is a build failure and this is a green suite reporting a check that no longer runs.
//
// So every open finding carries an ANCHOR here: a claim about the tree that must hold for its
// predicate to be ABLE to return true, evaluated from source. A dead anchor is the failure this
// unit exists to catch.
//
// AND RE-DERIVING FOUND ONE, IN THE FINDING THAT MATTERS MOST. MATCH-1 records that the live
// ranker orders patients on a clinical attribute while W201's published ADM notice says it never
// does — a contradiction between running code and a legal notice, latent only because W214's
// matcher is not in use. Its predicate answers "is the matcher live?" with a scan for
// `from "@/matching/match"` across `src/`. **That is both of the defects W221 already found and
// fixed in W201's dormancy proof, one register over:**
//
//   IT MATCHES ONE SPELLING. A relative import — `from "../matching/match"` — is invisible to it.
//   W221 found exactly this: "the first version of this proof asked *does anything import it*,
//   matching only `from "@/x"`, and it certified `intervention-response-link` as dormant while
//   three modules import it RELATIVELY."
//
//   IT NEVER LEAVES `src/`. `sourceFiles()` walks `SRC`, so a PAGE importing the matcher does not
//   fire it — and a page is precisely where a module becomes live. W221's other half, verbatim:
//   "the scan never left `src/`, so a route in `app/`, which is precisely where a module becomes
//   in use, was invisible."
//
// Two registers were answering one question — *is the matcher live?* — in two ways, and the one
// that had been fixed was not the one guarding the notice. So MATCH-1's liveness half now composes
// `reachableFromApp`, which is what W201 does for the same module, and the answer is a property of
// the import graph rather than of how somebody happened to spell a path.
//
// WHAT DID NOT NEED FIXING, said plainly because a re-derivation reporting only good news is the
// one to distrust — and this one reports both. TENANCY-1, DOSSIER-1 and CENSUS-1 are all still
// anchored: their predicates read things that exist and would still see the condition arrive.
// CENSUS-1's pinned count of eleven header-less modules is unchanged after a year and forty
// modules, which is W200's header convention holding rather than nobody looking.
//
// KNOWN BOUND, inherited and restated rather than quietly dropped: W210's register is hand-kept,
// because there is no mechanical detector for "a comment that files something for later". This
// unit does not fix that and does not pretend to — it checks that the findings which ARE recorded
// can still fire, which is a different and smaller claim than that every latent finding is
// recorded.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads source files and evaluates predicates that
// were already being evaluated.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { resetStore } from "@/booking/store";
import { LATENT_FINDINGS, modulesWithNoUnitHeader, type LatentFinding } from "./latent-findings";

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");

export interface FindingAnchor {
  /** The finding this anchors. Checked against `LATENT_FINDINGS` in both directions. */
  id: string;
  /** What must be true of the tree for that finding's predicate to be ABLE to return true. */
  claim: string;
  /** Evaluated from source. False means the finding has stopped being detectable. */
  holds: () => boolean;
  /** What a dead anchor would mean, so the failure is legible when it arrives. */
  ifDead: string;
}

export const FINDING_ANCHORS: readonly FindingAnchor[] = [
  {
    id: "TENANCY-1",
    claim: "The seeded rail holds appointments, so counting distinct practices across them is a count over something.",
    holds: () => resetStore().state.appointments.length > 0,
    ifDead:
      "The predicate counts distinct `practiceId` values across the seeded rail's appointments. Over an empty rail that count is zero, the finding reads as not-live forever, and the read it guards keeps matching a clinician id with no practice in the query.",
  },
  {
    id: "DOSSIER-1",
    claim: "Gate-dossier test files exist and at least one reads the live ledger, so the scan has a subject.",
    holds: () => {
      const files = readdirSync(path.join(SRC, "quality")).filter((n) =>
        /^gate-dossier-.*\.test\.ts$/.test(n),
      );
      return (
        files.length > 0 &&
        files.some((n) => readFileSync(path.join(SRC, "quality", n), "utf8").includes("BUILD-STATE.md"))
      );
    },
    ifDead:
      "The predicate is a `.some()` over files matching `gate-dossier-*.test.ts`. Rename the convention and it iterates an empty list, which is `false` — a clean answer over nothing, which is the shape this tree keeps finding behind a green suite.",
  },
  {
    id: "MATCH-1",
    claim: "`src/engine/pool.ts` still contains the comparison the predicate reads, so its first conjunct can be true.",
    holds: () =>
      /a\.chronicCare !== b\.chronicCare/.test(readFileSync(path.join(SRC, "engine", "pool.ts"), "utf8")),
    ifDead:
      "The predicate is `stillOrdersOnCondition && live`. Reword that comparison — a helper, a destructure, a rename — and the first conjunct goes false while the ranker orders on the same attribute and the published notice still denies it. The finding would go quiet without the contradiction moving at all.",
  },
  {
    id: "CENSUS-1",
    claim: "The header-less walk returns modules, so a count greater than the pin is reachable.",
    holds: () => modulesWithNoUnitHeader().length > 0,
    ifDead:
      "The predicate is `count > HEADERLESS_AT_W210`. A walk that returned nothing — a moved directory, a changed extension filter — makes it `0 > 11`, permanently false, and a module could then ship with no header and escape W200's census exactly as the finding describes.",
  },
];

/** Open findings with no anchor, and anchors for findings that do not exist. Both are failures. */
export function anchorCoverage(
  findings: readonly LatentFinding[] = LATENT_FINDINGS,
  anchors: readonly FindingAnchor[] = FINDING_ANCHORS,
): { unanchored: string[]; orphaned: string[] } {
  const anchored = new Set(anchors.map((a) => a.id));
  const open = findings.filter((f) => f.status === "open").map((f) => f.id);
  const known = new Set(findings.map((f) => f.id));
  return {
    unanchored: open.filter((id) => !anchored.has(id)).sort(),
    orphaned: anchors.map((a) => a.id).filter((id) => !known.has(id)).sort(),
  };
}

/**
 * Anchors that have gone false — findings whose predicates can no longer observe their condition.
 *
 * The list this unit exists to keep empty, and the reason it is separate from `fired()`: a fired
 * finding is a build failure that names itself, and a dead anchor is a green suite reporting a
 * check that no longer runs.
 */
export function deadAnchors(anchors: readonly FindingAnchor[] = FINDING_ANCHORS): FindingAnchor[] {
  return anchors.filter((a) => !a.holds());
}

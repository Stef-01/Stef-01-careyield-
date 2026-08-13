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

import { readFileSync } from "node:fs";
import path from "node:path";
import { resetStore } from "@/booking/store";
import { LATENT_FINDINGS, modulesWithNoUnitHeader, type LatentFinding } from "./latent-findings";
import { probeDiscriminates } from "./ranker-behaviour";
import { dossierTestFiles, sourceModules } from "./tree-walks";

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
      // W282 gave this walk a root. It was `readdirSync(path.join(SRC, "quality"))` closed over
      // the repository, so the anchor could not be shown a dossier test arriving — an anchor that
      // cannot be pointed at another tree has the defect it exists to detect.
      const files = dossierTestFiles(ROOT);
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
    // W283 REPLACED THIS ANCHOR, AND THE OLD ONE'S `ifDead` IS WHY — it is quoted almost verbatim
    // in the unit that acted on it. The claim used to be that `src/engine/pool.ts` still contained
    // the comparison, because the predicate matched that comparison's text. Now the predicate
    // reads behaviour, so the thing that must hold is not a fact about a file: it is that the
    // PROBE can still tell a clinical ranker from a blind one. That is a smaller and far more
    // durable claim, and it is the one that actually guards the notice.
    claim: "The behavioural probe still discriminates: it fires on a reference clinical ranker and not on a blind one.",
    holds: () => probeDiscriminates(),
    ifDead:
      "The predicate is `observesClinicalAttribute(rankCandidates) && live`. If the probe stops discriminating — a degenerate panel, a flip that no longer flips, a guard that throws on everything — the first conjunct answers the same way for every ranker, and MATCH-1 goes quiet while a published legal notice and the live ranker still contradict each other.",
  },
  {
    id: "CENSUS-1",
    // W281 CLOSED THE FINDING AND HAD TO RE-POINT THIS ANCHOR, which is worth recording because
    // the old one went false at the moment of the fix. It claimed "the header-less walk returns
    // modules, so a count greater than the pin is reachable" — true while eleven modules lacked
    // headers, and FALSE the instant they all had one. An anchor that dies when its finding is
    // resolved is an anchor pointed at the symptom. This one is pointed at the walk's ability to
    // see: as long as the module walk returns modules, a header-less one arriving is observable.
    claim: "The module walk returns modules, so a header-less one arriving is observable at the door.",
    holds: () => sourceModules(ROOT).length > 0,
    ifDead:
      "The predicate is `modulesWithNoUnitHeader().length > 0` and W281's door asserts the same list is empty every run. A walk that returned nothing — a moved directory, a changed extension filter — makes both of them read clean forever, and a module could then ship with no header and escape W200's census exactly as the finding described. Empty is the answer this pair gives when it is working and when it is broken, which is why the anchor asks whether the walk has a subject at all.",
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

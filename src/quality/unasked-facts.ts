// W340: a derived fact with exactly one reader, and the ones with none.
//
// THIS TREE IS MOSTLY DERIVATIONS. Four hundred and ten exported functions live in the modules a
// route can reach — a hundred and twenty-nine of them when this ran — and each turns state into a
// fact. What nothing
// asks is how many things read each fact — and a derivation's reader count is the difference
// between a product feature and a computation nobody has ever seen the output of.
//
// READERS ARE RESOLVED, NOT SCANNED. The first derivation of this counted a reader as a file whose
// text contains the export's name, and it reported thirty-five unasked facts. That count was wrong
// in the direction that flatters: `readEvidence` had a "reader" because `blind-spots.ts` NAMES it
// inside a probe string, and `guidelineIntervals` had one because a fixture in `empty-list-sweep.ts`
// mentions it. Prose about a function is not a call. A reader here is a file that IMPORTS the name
// FROM the module — resolved through W165's specifier rules, which is why W340 exported
// `resolveFirstParty` rather than writing a second copy of them. Resolved, the number is
// seventy-one.
//
// AND USED-IN-ITS-OWN-MODULE IS NOT UNASKED. `openVault` is imported by nothing and called by
// `storeEvidence` three lines down; the fact is computed and something does ask for it. So the
// population subtracts an export whose own module uses it, which took the population from four
// hundred and ten to three hundred and thirteen and is the difference between a register about
// facts and a register about export lists.
//
// THE FINDING IS THAT NOT ONE OF THE SEVENTY-ONE IS WAITING ON A FOUNDER RULING. The `behind_a_gate`
// arm exists and is checked — a row using it must name a gate `docs/FIVE-YEAR-PLAN.md` §4 defines,
// driven below on a constructed row — and no row in this tree uses it. Every one of these is a
// screen somebody could build on synthetic data today. Eight of them are refusal EXPLAINERS —
// `explainEvidenceRejection`, `explainRefusal`, `explainVerdict`, `explainReferralRejection`,
// `explainReturnRejection` and the three capacity renderers — so the product can say why it refused
// every one of those things and no page in it has ever shown a reader the sentence. W334's
// `<SetupGaps>` is the shape of the answer and it took a unit for one of them.
//
// TEN ARE NOT DERIVED FACTS AT ALL, and they are declared rather than filtered out. The population
// is exported functions, so a store write and a guard land in it, and narrowing the scan until it
// stops asking is the detector W279 refused to tune. `not_a_derived_fact` says which and why.
//
// THE SINGLE-READER HALF IS DERIVED AND NOT PINNED. `singleReaderFacts` NAMES them rather than
// counting them, which is the gate's word and W304's rule; what it does not do is freeze the list,
// because a derivation gaining a second reader is ordinary work and a list that moved on ordinary
// work is the pinned count W304 spent a unit removing. The transition that matters — one reader to
// none — lands in the register above, which does fail.
//
// WHAT THIS DOES NOT PROVE is `UNASKED_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads source text and a planning document.

import { readFileSync } from "node:fs";
import path from "node:path";
import { parseGates } from "@/founder/outstanding";
import { reachableFromApp, resolveFirstParty, stripComments } from "@/security/reachability";
import { pageSpecFiles, sourceModules, typescriptFiles } from "./tree-walks";

/** `<module>::<export>` — the identity a reader count is about. */
export type FactId = string;

export interface Fact {
  id: FactId;
  /** Files that IMPORT the name from its module, tests included, repo-relative. */
  readers: string[];
}

/**
 * Every named import in a file, as `{ specifier, names }`.
 *
 * `export { a } from "./b"` counts, because a re-export is a reader: something downstream reaches
 * the fact through it, and treating the seam as invisible would attribute the reading to nobody.
 */
export function namedImports(code: string): Array<{ specifier: string; names: string[] }> {
  const out: Array<{ specifier: string; names: string[] }> = [];
  for (const m of code.matchAll(/(?:import|export)\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const names = m[1]!
      .split(",")
      .map((part) => part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]!.trim())
      .filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
    out.push({ specifier: m[2]!, names });
  }
  return out;
}

const rel = (root: string, file: string) => path.relative(root, file).split(path.sep).join("/");

/**
 * Every file that could read a fact.
 *
 * NO WALK OF ITS OWN, and that is deliberate in the unit that measures reach. `typescriptFiles`
 * gives the tree's modules and its suites, `pageSpecFiles` gives the specs, and the pages come out
 * of the reachability walk this register already runs — `reachableFrom` returns the entry files it
 * started from alongside what they reach, so the `app/` half is already in hand and a second
 * recursion over it would be the private copy W341 is about, written by the register that would
 * have reported it.
 */
function readerFiles(root: string, served: readonly string[]): string[] {
  return [
    ...typescriptFiles(root).map((f) => rel(root, f)),
    ...pageSpecFiles(root),
    ...served.filter((f) => !f.startsWith("src/")),
  ];
}

/**
 * Every exported function in a module a route reaches, with the files that import it.
 *
 * SERVED IS `reachableFromApp`'S ANSWER rather than a directory guess. "The product computes it" has
 * to mean the module is on a request-serving path, and W271's walk is the tree's only derivation of
 * that — a register that read `src/quality` out by name would be classifying by folder.
 */
export function servedFacts(root: string): Fact[] {
  const reached = reachableFromApp(root).files;
  const served = new Set(reached.filter((f) => f.startsWith("src/")));
  const readers = new Map<FactId, string[]>();
  for (const relFile of readerFiles(root, reached)) {
    const file = path.join(root, relFile);
    const code = stripComments(readFileSync(file, "utf8"));
    for (const { specifier, names } of namedImports(code)) {
      const target = resolveFirstParty(specifier, file, root);
      if (target === null) continue;
      for (const name of names) {
        const id = `${rel(root, target)}::${name}`;
        readers.set(id, [...(readers.get(id) ?? []), relFile]);
      }
    }
  }
  const out: Fact[] = [];
  for (const file of sourceModules(root)) {
    const module = rel(root, file);
    if (!served.has(module)) continue;
    const source = stripComments(readFileSync(file, "utf8"));
    for (const match of source.matchAll(/^export function ([A-Za-z0-9_]+)/gm)) {
      const name = match[1]!;
      // Its own module using it is a reader the import graph cannot see, and the fact IS asked for.
      const elsewhere = source.replace(new RegExp(`^export function ${name}\\b`, "m"), "");
      if (new RegExp(`\\b${name}\\b`).test(elsewhere)) continue;
      const id = `${module}::${name}`;
      out.push({ id, readers: (readers.get(id) ?? []).filter((f) => f !== module).sort() });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

const isTest = (file: string) => file.endsWith(".test.ts") || file.endsWith(".spec.ts");

/** The readers that are not a suite — the ones that make a fact something the product asks for. */
export function askingReaders(fact: Fact): string[] {
  return fact.readers.filter((f) => !isTest(f));
}

/**
 * Facts with exactly one asking reader, NAMED.
 *
 * Named rather than counted, and derived rather than declared. One reader is not a defect: most of
 * this tree is a chain of single-purpose derivations and freezing the list would fail on every
 * refactor that gave one a second caller. What it is, is the step before none.
 */
export function singleReaderFacts(root: string, facts: readonly Fact[] = servedFacts(root)): FactId[] {
  return facts.filter((f) => askingReaders(f).length === 1).map((f) => f.id);
}

/** Facts the product computes that nothing but a suite ever asks for. */
export function unaskedFacts(root: string, facts: readonly Fact[] = servedFacts(root)): FactId[] {
  return facts.filter((f) => askingReaders(f).length === 0).map((f) => f.id);
}

/** Why a fact on the served surface has no reader asking for it. */
export type UnaskedReason =
  /** A surface could ask today and none does. `where` names the screen that would. */
  | { kind: "no_surface_asks"; where: string }
  /** No surface can ask until a founder gate is ruled on. `gate` must be one §4 defines. */
  | { kind: "behind_a_gate"; gate: string }
  /** Not a derived fact: a store write or a guard, in the population because the population is exports. */
  | { kind: "not_a_derived_fact"; what: string };

export interface UnaskedFact {
  id: FactId;
  why: UnaskedReason;
}

/**
 * Every unasked fact on the served surface, as at W340.
 *
 * ONE ROW PER FACT AND EACH CARRIES ITS OWN SENTENCE, because the sentence is the whole value: a
 * list of seventy-one identifiers says the product computes things nobody reads, and the `where`
 * column says what somebody would build. The rows are checked against the tree in both directions,
 * so a fact arriving here is a computation added with no reader and a fact leaving is somebody
 * wiring one up — both events worth stopping a build for, which is W290's test for the class.
 */
export const UNASKED_AT_W340: readonly UnaskedFact[] = [
  { id: "src/api/refusals.ts::patientMarkersIn", why: { kind: "no_surface_asks", where: "an API refusal body is built from it and no route renders the markers it found" } },
  { id: "src/api/scopes.ts::endpointsFor", why: { kind: "no_surface_asks", where: "the console's API screen lists scopes and never the endpoints a scope opens" } },
  { id: "src/capability/interest.ts::interestsFor", why: { kind: "no_surface_asks", where: "the capability screen shows what a clinician can do and not what they said they are interested in" } },
  { id: "src/capability/provenance.ts::flagStaleProfiles", why: { kind: "no_surface_asks", where: "no screen shows which capability profiles have gone stale or which competence is still usable" } },
  { id: "src/capability/provenance.ts::usableCompetence", why: { kind: "no_surface_asks", where: "no screen shows which capability profiles have gone stale or which competence is still usable" } },
  { id: "src/capability/store.ts::statedBy", why: { kind: "no_surface_asks", where: "the capability screen reads competence through its own store door and never asks which clinicians a practice has stated an interest for" } },
  { id: "src/capacity/backtest.ts::renderScore", why: { kind: "no_surface_asks", where: "the capacity screen renders the model and not the backtest's own score or its refusal" } },
  { id: "src/capacity/copy-lint.ts::renderCompliantCapacityCopy", why: { kind: "no_surface_asks", where: "the compliant rendering is built and the screen renders the raw text through a different path" } },
  { id: "src/capacity/forecast.ts::renderForecast", why: { kind: "no_surface_asks", where: "the capacity screen renders the model and not the forecast's refusal copy" } },
  { id: "src/capacity/opening.ts::renderOpening", why: { kind: "no_surface_asks", where: "the capacity screen renders the model and not the opening's refusal copy" } },
  { id: "src/compliance/party-to-care.ts::lintPartyToCare", why: { kind: "no_surface_asks", where: "the linter runs in a suite and no authoring surface shows an author what it found" } },
  { id: "src/credentials/attestation.ts::reattestationSubmission", why: { kind: "no_surface_asks", where: "the credentials screen shows the lifecycle and never offers the re-attestation it can build" } },
  { id: "src/credentials/vault.ts::openVault", why: { kind: "not_a_derived_fact", what: "a guard rather than a derivation: it turns a membership into a grant or refuses one" } },
  { id: "src/credentials/vault.ts::storeEvidence", why: { kind: "not_a_derived_fact", what: "a store write: it files an evidence document and returns whether it was accepted" } },
  { id: "src/credentials/vault.ts::readEvidence", why: { kind: "no_surface_asks", where: "there is no evidence screen: the vault can be read, listed per credential and per clinician, and explain a rejection, and nothing renders any of it" } },
  { id: "src/credentials/vault.ts::listEvidence", why: { kind: "no_surface_asks", where: "there is no evidence screen: the vault can be read, listed per credential and per clinician, and explain a rejection, and nothing renders any of it" } },
  { id: "src/credentials/vault.ts::listEvidenceForClinician", why: { kind: "no_surface_asks", where: "there is no evidence screen: the vault can be read, listed per credential and per clinician, and explain a rejection, and nothing renders any of it" } },
  { id: "src/credentials/vault.ts::explainEvidenceRejection", why: { kind: "no_surface_asks", where: "there is no evidence screen: the vault can be read, listed per credential and per clinician, and explain a rejection, and nothing renders any of it" } },
  { id: "src/credentials/verification.ts::verifiedProvenance", why: { kind: "no_surface_asks", where: "the credentials screen shows a state and never who verified it, nor why a transition was refused" } },
  { id: "src/credentials/verification.ts::explainRefusal", why: { kind: "no_surface_asks", where: "the credentials screen shows a state and never who verified it, nor why a transition was refused" } },
  { id: "src/demo/clinicians.ts::cliniciansMatchingArchetype", why: { kind: "no_surface_asks", where: "the demo finder matches on its own path and never asks which clinicians fit an archetype" } },
  { id: "src/education/cpd.ts::renderCpdExport", why: { kind: "no_surface_asks", where: "the education screen shows the trail and offers no export of it" } },
  { id: "src/education/provenance.ts::unrenderableItems", why: { kind: "no_surface_asks", where: "no screen tells an operator which education items cannot be rendered, or why" } },
  { id: "src/education/store.ts::addTriggers", why: { kind: "not_a_derived_fact", what: "a store write: it appends case triggers and returns nothing" } },
  { id: "src/education/store.ts::scrubClinicianCpd", why: { kind: "not_a_derived_fact", what: "a store write: erasure, returning how many rows it removed" } },
  { id: "src/engine/backfill.ts::isLateCancellation", why: { kind: "no_surface_asks", where: "the backfill runs and no surface distinguishes a late cancellation from any other" } },
  { id: "src/interest/store.ts::interestSignupsFor", why: { kind: "no_surface_asks", where: "the interest register is written by the public form and read by nothing an operator opens" } },
  { id: "src/interest/store.ts::eraseInterestSignups", why: { kind: "not_a_derived_fact", what: "a store write: erasure by email, returning how many rows it removed" } },
  { id: "src/interest/store.ts::pruneInterestSignups", why: { kind: "not_a_derived_fact", what: "a store write: retention pruning against a cutoff" } },
  { id: "src/interop/console.ts::agreesWithLedger", why: { kind: "no_surface_asks", where: "the interop screen shows exchange state and never whether it agrees with the ledger" } },
  { id: "src/interop/credentials.ts::credentialShapedLiterals", why: { kind: "no_surface_asks", where: "the scan for credential-shaped literals runs in a suite and no surface reports it" } },
  { id: "src/interop/disclosure-ledger.ts::rejectionsForDisclosure", why: { kind: "no_surface_asks", where: "the disclosure screen shows what was disclosed and never why a disclosure would be rejected" } },
  { id: "src/interop/exchange-state.ts::stateFor", why: { kind: "no_surface_asks", where: "the mapping from a transport outcome to a state is applied by the store and never shown" } },
  { id: "src/outcomes/graph-privacy.ts::renderDisclosableGraph", why: { kind: "no_surface_asks", where: "the outcomes screen renders the graph and not its disclosable form" } },
  { id: "src/outcomes/response-graph.ts::renderResponseGraph", why: { kind: "no_surface_asks", where: "the outcomes screen shows response counts and never the graph rendering" } },
  { id: "src/pathways/approval.ts::assertUsable", why: { kind: "not_a_derived_fact", what: "a guard: it throws rather than returning a fact" } },
  { id: "src/pathways/evaluation.ts::explainVerdict", why: { kind: "no_surface_asks", where: "the pathway screen shows a verdict's outcome and never the sentence explaining it" } },
  { id: "src/pathways/versioning.ts::currentPathway", why: { kind: "no_surface_asks", where: "no screen resolves which pathway version is current from the event stream" } },
  { id: "src/pms/resilience.ts::sendablePractices", why: { kind: "no_surface_asks", where: "the ops screen shows fleet reads and never which practices are sendable" } },
  { id: "src/privacy/automated-decisions.ts::pageCopy", why: { kind: "no_surface_asks", where: "the page composes its own copy and this derivation of it exists for the compliance sweep" } },
  { id: "src/quality/blocked-surface.ts::ledgerRows", why: { kind: "no_surface_asks", where: "the founder page renders the blocked rows and never asks for the raw ledger rows — W347 wired up the other half of this sentence, which is the transition this register exists to notice" } },
  { id: "src/referrals/acceptance.ts::acceptedReferral", why: { kind: "no_surface_asks", where: "the referrals screen shows a status and never the accepted referral it resolves to, nor the obligations that follow" } },
  { id: "src/referrals/acceptance.ts::obligationsFor", why: { kind: "no_surface_asks", where: "the referrals screen shows a status and never the accepted referral it resolves to, nor the obligations that follow" } },
  { id: "src/referrals/barriers.ts::recordBarrier", why: { kind: "not_a_derived_fact", what: "a store write: it records a barrier somebody entered" } },
  { id: "src/referrals/barriers.ts::barriersFor", why: { kind: "no_surface_asks", where: "the referrals screen records barriers and never lists a practice's own" } },
  { id: "src/referrals/document.ts::explainReferralRejection", why: { kind: "no_surface_asks", where: "the referrals screen refuses a document and never renders the reason" } },
  { id: "src/referrals/return-report.ts::ongoingCareAfter", why: { kind: "no_surface_asks", where: "the referrals screen shows a return report and never who holds ongoing care, nor the completion event, nor a rejection's reason" } },
  { id: "src/referrals/return-report.ts::completionEvent", why: { kind: "no_surface_asks", where: "the referrals screen shows a return report and never who holds ongoing care, nor the completion event, nor a rejection's reason" } },
  { id: "src/referrals/return-report.ts::explainReturnRejection", why: { kind: "no_surface_asks", where: "the referrals screen shows a return report and never who holds ongoing care, nor the completion event, nor a rejection's reason" } },
  { id: "src/registers/attribution.ts::attributionByCondition", why: { kind: "no_surface_asks", where: "the registers screen shows attribution overall and never by condition" } },
  { id: "src/registers/authoring.ts::reject", why: { kind: "not_a_derived_fact", what: "a state transition on a content record" } },
  { id: "src/registers/authoring.ts::amend", why: { kind: "not_a_derived_fact", what: "a state transition on a content record" } },
  { id: "src/registers/caregap.ts::gapCountsByCondition", why: { kind: "no_surface_asks", where: "the registers screen shows gaps and never their counts by condition, and scopes them on a different path" } },
  { id: "src/registers/caregap.ts::scopeGapsToPractice", why: { kind: "no_surface_asks", where: "the registers screen shows gaps and never their counts by condition, and scopes them on a different path" } },
  { id: "src/registers/eligibility.ts::withCareGapFilter", why: { kind: "no_surface_asks", where: "eligibility is rendered without the care-gap filter this composes" } },
  { id: "src/registers/intervals.ts::guidelineIntervals", why: { kind: "no_surface_asks", where: "the guideline catalogue is loaded by a different path and no screen shows which sources it cites" } },
  { id: "src/registers/intervals.ts::citedSources", why: { kind: "no_surface_asks", where: "the guideline catalogue is loaded by a different path and no screen shows which sources it cites" } },
  { id: "src/registers/membership.ts::reconcileMemberships", why: { kind: "no_surface_asks", where: "the registers screen lists members through the store and never reconciles, nor explains one patient's membership" } },
  { id: "src/registers/membership.ts::currentMembers", why: { kind: "no_surface_asks", where: "the registers screen lists members through the store and never reconciles, nor explains one patient's membership" } },
  { id: "src/registers/membership.ts::explain", why: { kind: "no_surface_asks", where: "the registers screen lists members through the store and never reconciles, nor explains one patient's membership" } },
  { id: "src/registers/ranking.ts::gapShareOfBatch", why: { kind: "no_surface_asks", where: "the invitation screen ranks a batch and never shows what share of it has a gap" } },
  { id: "src/registers/recalls.ts::reconcileWithRecalls", why: { kind: "no_surface_asks", where: "no screen reconciles register gaps against the practice's own recalls, nor shows why any were suppressed" } },
  { id: "src/registers/recalls.ts::suppressionCounts", why: { kind: "no_surface_asks", where: "no screen reconciles register gaps against the practice's own recalls, nor shows why any were suppressed" } },
  { id: "src/security/untrusted.ts::matchDeclared", why: { kind: "no_surface_asks", where: "untrusted text is matched against a declared set in a suite and no route uses this door" } },
  { id: "src/sim/harness.ts::renderReport", why: { kind: "no_surface_asks", where: "the simulator writes its result and the report rendering is called by nothing" } },
  { id: "src/spine/spine.ts::anchorOf", why: { kind: "no_surface_asks", where: "the audit trail is verified through a sibling and no surface anchors a log or checks one against an anchor" } },
  { id: "src/spine/spine.ts::verifyLogAgainst", why: { kind: "no_surface_asks", where: "the audit trail is verified through a sibling and no surface anchors a log or checks one against an anchor" } },
  { id: "src/synthetic/generate.ts::practiceStats", why: { kind: "no_surface_asks", where: "the synthetic set is generated and no screen shows the practice statistics it can compute" } },
  { id: "src/tenancy/tenancy.ts::scopeToPractice", why: { kind: "no_surface_asks", where: "scoping runs through the store reads and this door is open for nobody" } },
  { id: "src/verticals/completeness.ts::renderCompletenessReport", why: { kind: "no_surface_asks", where: "the verticals screen shows assembly and never the completeness report it can render" } },
];

export interface UnaskedDefect {
  id: FactId;
  what: string;
}

/**
 * The register against the tree, in three directions.
 *
 * The third is the one that keeps `behind_a_gate` from becoming the easy answer: a row pleading a
 * founder ruling must name a gate the plan actually defines, resolved through `parseGates` rather
 * than pattern-matched, so `G99` fails and so does a gate somebody retired.
 */
export function unaskedDefects(
  root: string,
  declared: readonly UnaskedFact[] = UNASKED_AT_W340,
  found: readonly FactId[] = unaskedFacts(root),
): UnaskedDefect[] {
  const out: UnaskedDefect[] = [];
  const byId = new Map(declared.map((d) => [d.id, d.why]));
  for (const id of found) {
    if (!byId.has(id)) out.push({ id, what: "is a fact the product computes and no surface asks for" });
  }
  for (const { id } of declared) {
    if (!found.includes(id)) out.push({ id, what: "is declared unasked and something reads it now" });
  }
  // The plan is read only when a row asks for it. A register whose every call opens a document it
  // usually has no question for cannot be driven in a constructed tree, and W289's rejection arm
  // hands this one a tree with no `docs/` at all — which is how the eager version was found.
  const waiting = declared.filter((d) => d.why.kind === "behind_a_gate");
  if (waiting.length > 0) {
    const gates = new Set(parseGates(readFileSync(path.join(root, "docs/FIVE-YEAR-PLAN.md"), "utf8")).map((g) => g.id));
    for (const { id, why } of waiting) {
      if (why.kind === "behind_a_gate" && !gates.has(why.gate)) {
        out.push({ id, what: `waits on ${why.gate} and the plan defines no such gate` });
      }
    }
  }
  return out.sort((a, b) => `${a.id}${a.what}`.localeCompare(`${b.id}${b.what}`));
}

/** What a reader count does not prove. */
export const UNASKED_BOUND =
  "A READER IS AN IMPORT, AND THAT IS NARROWER THAN A CALLER. A fact reached through a namespace " +
  "import, a dynamic `import()` or a re-export this parse does not read is asked for by somebody " +
  "this register cannot see, and it would be reported unasked — the same class W295 states about " +
  "the reachability walk it borrows, arriving one level up. The population inherits that walk " +
  "wholesale: a module no route reaches is outside this register entirely, so a derivation nobody " +
  "asks for in a module nobody serves is invisible here, which is the larger half of the tree. AND " +
  "AN IMPORT IS NOT A CALL EITHER, in the other direction: a file that imports a fact and never " +
  "invokes it counts as asking, so the register understates. What it cannot do at all is say " +
  "whether a fact SHOULD be asked for. `no_surface_asks` names a screen somebody would build and " +
  "that is a judgement about the product, made by a reader and recorded here; nothing derives it, " +
  "and a row whose `where` names a screen that would be a bad idea reads exactly like one that " +
  "would not. The gate arm is the only part of the reason that resolves, and it resolves that a " +
  "named gate EXISTS rather than that it is the right gate — W310's limit about blockers, in a " +
  "second register.";

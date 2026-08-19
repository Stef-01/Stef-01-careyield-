// W358: the premise a walk never checked.
//
// A SPEC'S SETUP CLAIMS A STATE AND `waitForURL` DOES NOT CHECK IT. Eighteen of this suite's specs
// stage a premise through the browser — sign in, fill a wizard, click save, wait for `/console` —
// and then every test in the file walks a practice it believes exists with a member it believes was
// written. Waiting for a URL proves the browser ARRIVED. It says nothing about whether the data
// landed, and a step that silently does not save leaves the whole file walking a state it never
// established. It passes, too: an empty console for a practice that does not exist renders exactly
// like an empty console for a practice with nothing in it yet.
//
// W346 IS THE CASE THIS COMES FROM. Its walk is about a practice that finished setup and is
// waiting, and on the screen that is indistinguishable from one that never finished — so the spec
// reads `setupCompletedAt` back through the mock API before walking on it. Nine of the eighteen did
// nothing of the kind. They do now, through `e2e/premise.ts`: ONE readback rather than nine copies,
// because nine copies of one assertion is the shape W341 spent a unit removing.
//
// ASSERTED THROUGH A DIFFERENT DOOR, which is the whole design. The setup drove the UI, so asking
// the UI whether the setup worked is asking the same door twice — a page that failed to save is the
// thing being checked for. The readback goes through `/api/mock/console`, which reads the store.
//
// WHAT THIS DOES NOT PROVE is `PREMISE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Synthetic practices in a mock console.

import { readFileSync } from "node:fs";
import path from "node:path";
import { pageSpecFiles } from "./tree-walks";

/** The shared readback every staged spec asserts through. */
export const PREMISE_HELPER = "e2e/premise.ts";

/**
 * A spec whose setup stages a premise through the browser.
 *
 * DERIVED FROM THE HELPER'S SHAPE rather than from a list. A file-level async function that fills
 * two or more fields and clicks a SAVE-shaped button is one that claims data was stored — which is
 * the claim `waitForURL` cannot check. A helper that only navigates is not staging anything: its
 * premise is arrival, and waiting for the URL is exactly the assertion for it.
 */
export function stagesAPremise(source: string): boolean {
  for (const match of source.matchAll(/^(?:async function (\w+)|const (\w+) = async)/gm)) {
    const body = source.slice(match.index!, match.index! + 2500);
    const fills = (body.match(/\.fill\(/g) ?? []).length;
    const saves = /getByRole\("button", \{ name: "(?:Save|Create|Finish|Record|Add|Submit)/.test(body);
    if (fills >= 2 && saves) return true;
  }
  return false;
}

/** True when the file reads its premise back through the store rather than through the page. */
export function assertsItsPremise(source: string): boolean {
  return /expectPremise\s*\(/.test(source) || /request\.get\("\/api\/mock\//.test(source);
}

/** Every spec that stages a premise, in file order. */
export function stagedSpecs(root: string): string[] {
  return pageSpecFiles(root).filter((spec) =>
    stagesAPremise(readFileSync(path.join(root, spec), "utf8")),
  );
}

/** How a staged spec stands. */
export type PremiseStanding =
  /** It reads its premise back. `how` names what the readback establishes. */
  | { kind: "asserted"; how: string }
  /** It stages something and deliberately does not check it, with the reason. */
  | { kind: "declared"; why: string };

export interface SpecPremise {
  spec: string;
  standing: PremiseStanding;
}

/**
 * Every staged spec and where its premise stands, as at W358.
 *
 * NINE ROWS WERE ADDED BY THIS UNIT AND NINE WERE ALREADY TRUE, which is the honest split: the
 * suite had the habit in half its files and no rule about it. The `declared` arm is kept and driven
 * on a constructed row rather than used — a register whose second arm is unreachable cannot report
 * the case it is named after — and if a spec ever has a good reason not to check its premise, this
 * is where the reason goes.
 */
export const PREMISES_AT_W358: readonly SpecPremise[] = [
  { spec: "e2e/a11y.spec.ts", standing: { kind: "asserted", how: "Reads the console back before sweeping every route for violations, so a sweep over a practice that was never created cannot report a clean tree." } },
  { spec: "e2e/capacity.spec.ts", standing: { kind: "asserted", how: "W358 added the readback: the practice it types and the member it signs in as must both come back from the store before any capacity figure is read." } },
  { spec: "e2e/case-mix.spec.ts", standing: { kind: "asserted", how: "Reads the console back to confirm the clinician link its walk depends on, which is the premise its case-mix assertions rest on." } },
  { spec: "e2e/interest.spec.ts", standing: { kind: "asserted", how: "W358 added the readback. The spec's subject is a REFUSAL, which renders the same whether or not a practice exists — the one shape where a missing premise is completely invisible." } },
  { spec: "e2e/interop.spec.ts", standing: { kind: "asserted", how: "W358 added the readback: the practice must be in the store before the exchange screens are read, since an empty interop page is also what a missing practice renders." } },
  { spec: "e2e/ops.spec.ts", standing: { kind: "asserted", how: "Reads the console back before walking the ops feed, whose silence causes are exactly what a missing practice would also produce." } },
  { spec: "e2e/outcomes.spec.ts", standing: { kind: "asserted", how: "W358 added the readback. The spec asserts a zero state that says the rail is empty, which is indistinguishable from the zero state of a practice that was never created." } },
  { spec: "e2e/outreach.spec.ts", standing: { kind: "asserted", how: "W358 added the readback before the outreach plan is read, for the same reason: nothing to send and nobody to send it for render alike." } },
  { spec: "e2e/party-to-care.spec.ts", standing: { kind: "asserted", how: "Reads the console back before linting the rendered copy, so a lint over a page that rendered nothing cannot pass as clean copy." } },
  { spec: "e2e/platform-api.spec.ts", standing: { kind: "asserted", how: "W358 added the readback. It creates two practices and switches between them, so a first that did not save would make every scoping assertion in the file vacuous." } },
  { spec: "e2e/registers.spec.ts", standing: { kind: "asserted", how: "Reads the console back after seeding, which is the premise its register assertions are about." } },
  { spec: "e2e/reporting.spec.ts", standing: { kind: "asserted", how: "W358 added the readback before the figures are read, since a figure with no practice behind it is suppressed exactly as a small one is." } },
  { spec: "e2e/responses.spec.ts", standing: { kind: "asserted", how: "W358 added the readback. Its subject is the difference between nothing-recorded and never-performed, and a missing practice produces a third zero that looks like both." } },
  { spec: "e2e/setup.spec.ts", standing: { kind: "asserted", how: "Reads `setupCompletedAt` and the roster back at the end of the timed sitting, which is the assertion this whole class was generalised from." } },
  { spec: "e2e/two-practice.spec.ts", standing: { kind: "asserted", how: "W358 added the readback. Two practices under one owner is the premise its tenancy assertions rest on, and one that failed to save would make them all pass over a single practice." } },
  { spec: "e2e/unfinished-path.spec.ts", standing: { kind: "asserted", how: "Reads the console back to confirm the setup was left OPEN, which is the premise of W334's whole walk and the opposite of W346's." } },
  { spec: "e2e/usefulness.spec.ts", standing: { kind: "asserted", how: "Reads the console back for the membership its non-member refusal test depends on, so the refusal is about a role rather than about an absent practice." } },
  { spec: "e2e/waiting-path.spec.ts", standing: { kind: "asserted", how: "W346's own assertion, and the case this unit generalised: `setupCompletedAt` must be non-null, because a finished practice and an unfinished one render the same empty screens." } },
];

export interface PremiseDefect {
  spec: string;
  what: string;
}

/**
 * The register against the suite, in three directions.
 *
 * THE THIRD IS THE ONE THAT KEEPS A ROW HONEST. A spec claiming to assert its premise must actually
 * read it back — otherwise the row records a habit the file has lost, which is the shape W340 found
 * seventy-one times and W357 found four.
 */
export function premiseDefects(
  root: string,
  declared: readonly SpecPremise[] = PREMISES_AT_W358,
  staged: readonly string[] = stagedSpecs(root),
): PremiseDefect[] {
  const out: PremiseDefect[] = [];
  const bySpec = new Map(declared.map((d) => [d.spec, d.standing]));

  for (const spec of staged) {
    if (!bySpec.has(spec)) {
      out.push({ spec, what: "stages a premise through the browser and nothing says whether it checks it" });
    }
  }
  for (const { spec } of declared) {
    if (!staged.includes(spec)) {
      out.push({ spec, what: "is tracked here and no longer stages a premise" });
    }
  }
  for (const { spec, standing } of declared) {
    if (standing.kind !== "asserted") continue;
    const full = path.join(root, spec);
    if (!assertsItsPremise(readFileSync(full, "utf8"))) {
      out.push({ spec, what: "is declared to assert its premise and reads nothing back" });
    }
  }
  return out.sort((a, b) => `${a.spec}${a.what}`.localeCompare(`${b.spec}${b.what}`));
}

/** What this register does not prove. */
export const PREMISE_BOUND =
  "IT CHECKS THAT A FILE READS ITS PREMISE BACK, NOT THAT EVERY WALK IN IT DOES. The nine specs " +
  "this unit changed assert their premise in one dedicated test, W346's own shape, rather than " +
  "before each of the calls their helpers make — threading the readback through every " +
  "call site would have touched every test in nine files to check a helper that either works for " +
  "all of them or none. That is a real gap and it has a real shape: a helper that saves " +
  "intermittently passes the dedicated test and fails a later walk, and this register would call " +
  "the file asserted. STAGING IS DERIVED FROM A HELPER'S SHAPE — two fills and a save-shaped " +
  "button — so a setup that stages state some other way is outside the population entirely, and " +
  "a spec that seeds through `request.post` alone is deliberately outside it because that call " +
  "either throws or works. THE READBACK IS ONLY AS GOOD AS WHAT IT ASKS FOR: `expectPremise` " +
  "checks that a practice with the typed name and a membership for the signed-in email are in the " +
  "store, and a spec whose premise is really about something else gets a green assertion about " +
  "the wrong subject. And nothing here checks the reasons: the `declared` arm takes any sentence, " +
  "and is empty today only because every staged spec was made to read back rather than argued out.";

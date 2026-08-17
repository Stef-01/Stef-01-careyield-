// W295: what a green suite does not prove, declared per register — and demonstrated.
//
// EVERY REGISTER IN THIS TREE IS A DETECTOR, AND EVERY DETECTOR HAS A SHAPE IT CANNOT SEE. W267's
// census says so about itself — *a walker written with `glob`, `fs.opendir` or a shell-out would be
// invisible here* — and several other modules carry a similar sentence in a comment. Nothing has
// ever checked one. A stated bound is a claim about the register's FALSE NEGATIVES, and a claim
// nobody checks is the thing this quarter keeps finding.
//
// A BOUND IS A CLAIM ABOUT A FALSE NEGATIVE, AND A FALSE NEGATIVE CAN BE PLANTED. So each bound
// here carries a WITNESS: an input with exactly the property the bound describes, planted in a
// constructed tree, which the register must stay SILENT about. Silence demonstrates the bound.
// Noise refutes it.
//
// AND THAT IS WHAT MAKES "A BOUND THAT RESTATES THE REGISTER'S JOB FAILS" MECHANICAL RATHER THAN A
// JUDGEMENT. If a bound restated what the register is for, its witness would be exactly the input
// the register exists to report — so planting it would produce a hit, and the bound is reported
// false. No vocabulary heuristic, no overlap score, nothing tuned until it agrees with the answer,
// which is what W279 refused a quarter earlier. The discriminator is the plant.
//
// WHAT THIS IS NOT. W289 asks whether a register's assertion can FAIL — the true-positive
// machinery. This asks what the register cannot SEE, which is the other error and the one a green
// run is silent about by construction. W292 plants a negative to show a detector is not too broad;
// this plants a negative the detector is ADMITTED to miss, and requires the admission to be true.
//
// SOME ARE DEMONSTRATED AND MOST ARE NOT, and the split is W289's structural one: a
// register whose detector is not callable from outside cannot be given a witness. Each undemonstrated
// entry says so and states its bound anyway, because a bound nobody wrote down is worse than one
// nobody has planted.
//
// FOUNDER GATE (plan §4): nothing crossed. Constructed trees in a temporary directory.

import { discoverSurfaces } from "@/compliance/surfaces";
import { copySurfaceMembers } from "@/compliance/copy-y6";
import { findInstructionSinks } from "@/security/instruction-sinks";
import { TREE_DERIVED_REGISTERS, treeWalkingFiles } from "./register-census";
import { discoverFoldSites } from "./order-independence";
import { headerViolations } from "./unit-headers";
import { pageSuiteViolations } from "./page-suite";
import { pinsInTree } from "./pins";
import { sweepTautologies } from "./tautology-sweep";
import { acceptanceCarryingModules } from "./acceptances";
import { violationReporters, withRoot } from "./refusal-branches";
import { mutantsIn } from "./mutation-sampling";

/** How a register's stated bound has been shown to be true. */
export type Blindness =
  /**
   * A witness with the bound's property is planted and the register must stay silent.
   *
   * `probe` plants the witness AND A POSITIVE CONTROL in the same constructed tree, and reports
   * what the register saw of each. The control is not optional and is the difference between a
   * demonstration and a vacuity: silence about a witness proves the bound only if the detector was
   * running at all, and a planted tree the detector cannot read is silent about everything.
   * `witnessSeen` true refutes the bound; `controlSeen` false means nothing was demonstrated.
   */
  | {
      kind: "demonstrated";
      bound: string;
      witness: string;
      control: string;
      probe: () => { witnessSeen: boolean; controlSeen: boolean };
    }
  /** The detector is not callable from outside, so no witness can be handed to it. */
  | { kind: "undemonstrated"; bound: string; whyNotPlantable: string };

/** Same sentence for the same defect — W267's posture for its unproven walks. */
const NOT_CALLABLE =
  "The detector and its comparison both live inside this register's own `.test.ts`, which exports nothing, so there is no way to hand it a witness from here. W289's remedy applies unchanged: export the scan from a module taking a root, and the bound below becomes a two-line plant.";

const LEDGER_ROW = "| W1 | done | builder-A | 2026-08-14T00:00Z | abc1234 | a row |";

export const BLIND_SPOTS: Readonly<Record<string, Blindness>> = {
  // ── Demonstrated: the detector takes a root, so a witness can be put in front of it ─────────
  "src/quality/mutation-sampling.ts": {
    kind: "demonstrated",
    bound:
      "Five textual operators — `===`, `!==`, `&&`, `>=`, `<=`. A module whose decisions are spelled with `>`, `<`, `||`, `??`, a ternary or an early return has NO mutation site at all, so it is sampled zero times and can never produce a survivor. Silence about such a module is silence rather than coverage, which is the distinction the whole register exists for.",
    witness: "a module whose only decision is `a > b`, which none of the five operators reaches",
    control: "the same decision written `a >= b`, which the sampler must find",
    probe: () => ({
      witnessSeen:
        mutantsIn("src/planted/gt.ts", "export const f = (a: number, b: number) => a > b;\n", "src/planted/gt.test.ts")
          .length > 0,
      controlSeen:
        mutantsIn("src/planted/gte.ts", "export const f = (a: number, b: number) => a >= b;\n", "src/planted/gte.test.ts")
          .length > 0,
    }),
  },

  "src/quality/register-census.ts": {
    kind: "demonstrated",
    bound:
      "Walking is detected as a call to `readdirSync(`. A walker written with `glob`, `fs.opendir`, `readdir` from `fs/promises` or a shell-out is invisible, and the census reports clean over it.",
    witness: "a module that walks the tree with `opendirSync` and never calls `readdirSync`",
    control: "the same walk written with `readdirSync`, which the census must report",
    probe: () =>
      withRoot(
        {
          "src/planted/opendir-walker.ts":
            'import { opendirSync } from "node:fs";\nexport const walk = () => opendirSync("src");\n',
          "src/planted/readdir-walker.ts":
            'import { readdirSync } from "node:fs";\nexport const walk = () => readdirSync("src");\n',
        },
        (root) => {
          const found = treeWalkingFiles(root, ["src"]);
          return {
            witnessSeen: found.includes("src/planted/opendir-walker.ts"),
            controlSeen: found.includes("src/planted/readdir-walker.ts"),
          };
        },
      ),
  },

  "src/security/instruction-sinks.ts": {
    kind: "demonstrated",
    bound:
      "Markers are matched as literal substrings, so an endpoint assembled from parts at runtime is invisible. This tree writes exactly that shape on purpose in two places, to keep its own probes out of the scan — which is the same construction an author could reach for to route around the control.",
    witness: "a module naming a model endpoint by joining two halves of the string",
    control: "the same endpoint written as one literal, which the scanner must report",
    probe: () =>
      withRoot(
        {
          "src/planted/split-endpoint.ts":
            'export const host = ["api.open", "ai.com"].join("");\nexport const call = () => fetch(`https://${host}/v1`);\n',
          "src/planted/whole-endpoint.ts": `export const host = "${["api.open", "ai.com"].join("")}";\n`,
        },
        (root) => {
          const hits = findInstructionSinks(root, ["src"]);
          return {
            witnessSeen: hits.some((h) => h.file.includes("split-endpoint")),
            controlSeen: hits.some((h) => h.file.includes("whole-endpoint")),
          };
        },
      ),
  },

  "src/quality/order-independence.ts": {
    kind: "demonstrated",
    bound:
      "A fold is detected as `.reduce(`, `.at(-1)` or a last-index read. The same order-dependence written as a `for` loop accumulating into a variable is invisible, and a `for` loop is the more ordinary way to write it.",
    witness: "a module folding a list to one answer with a `for` loop and a mutable accumulator",
    control: "the same fold written with `.reduce(`, which the register must report",
    probe: () =>
      withRoot(
        {
          "src/planted/loop-fold.ts":
            "export function latest(rows: readonly { at: string }[]) {\n  let best = rows[0];\n  for (const row of rows) if (row.at >= best!.at) best = row;\n  return best;\n}\n",
          "src/planted/reduce-fold.ts":
            "export function latest(rows: readonly { at: string }[]) {\n  return rows." +
            "reduce((a, b) => (b.at >= a.at ? b : a));\n}\n",
        },
        (root) => {
          const found = discoverFoldSites(root).map((f) => f.module);
          return {
            witnessSeen: found.some((m) => m.includes("loop-fold")),
            controlSeen: found.some((m) => m.includes("reduce-fold")),
          };
        },
      ),
  },

  "src/compliance/surfaces.ts": {
    kind: "demonstrated",
    bound:
      "Routes are read from the App Router's file conventions. A path served by a middleware rewrite, a catch-all handled in code, or a redirect configured in `next.config` is a surface the app serves and this census cannot see.",
    witness: "a `middleware.ts` rewriting a path the file tree does not contain",
    control: "an ordinary `page.tsx`, which the census must report as a route",
    probe: () =>
      withRoot(
        {
          "app/middleware.ts":
            'export function middleware() {\n  return Response.redirect("/w295-planted-route");\n}\n',
          "app/w295-control/page.tsx": "export default function Page() {\n  return null;\n}\n",
        },
        (root) => {
          const paths = discoverSurfaces(`${root}/app`).map((s) => s.path);
          return {
            witnessSeen: paths.some((p) => p.includes("w295-planted")),
            controlSeen: paths.some((p) => p.includes("w295-control")),
          };
        },
      ),
  },

  "src/compliance/copy-y6.ts": {
    kind: "demonstrated",
    bound:
      "Membership is read from each module's own `// W<n>` header. A module with no header has no unit, so it is not a member and not a non-member — it simply falls out, and the copy surface never has to cover it.",
    witness: "a module holding operator copy and carrying no unit header at all",
    control: "the same module carrying a Y6 unit header, which membership must report",
    probe: () =>
      withRoot(
        {
          "src/planted/headerless.ts": 'export const COPY = { title: "A sentence a practice reads." };\n',
          "src/planted/headered.ts":
            '// W295: a planted module with a header.\nexport const COPY = { title: "A sentence a practice reads." };\n',
        },
        (root) => {
          const members = copySurfaceMembers(root);
          return {
            witnessSeen: members.some((m) => m.includes("headerless")),
            controlSeen: members.some((m) => m.includes("headered")),
          };
        },
      ),
  },

  "src/quality/unit-headers.ts": {
    kind: "demonstrated",
    bound:
      "The header is checked for POSITION and for naming a unit the ledger has. Nothing checks that the unit it names is the unit that wrote the module, so a file copied from another and left with the original's header passes.",
    witness: "a module whose header names a real ledger unit that did not write it",
    control: "a module with no header at all, which the register must report",
    probe: () =>
      withRoot(
        {
          "src/planted/wrong-unit.ts":
            "// W1: a header naming a unit that never touched this file.\nexport const x = 1;\n",
          "src/planted/no-header.ts": "export const x = 1;\n",
        },
        (root) => {
          const violations = headerViolations(root, LEDGER_ROW).join("\n");
          return {
            witnessSeen: violations.includes("wrong-unit"),
            controlSeen: violations.includes("no-header"),
          };
        },
      ),
  },

  "src/quality/page-suite.ts": {
    kind: "demonstrated",
    bound:
      "The gate is checked to RUN every spec: chained from verify, unfiltered, none excluded. Whether a spec asserts anything is a different question, and a spec that opens a page and asserts nothing satisfies every check here.",
    witness: "a spec file that navigates and makes no assertion",
    control: "a verify script that does not chain the suite, which the gate must report",
    probe: () => {
      const spec = 'test("opens the page", async ({ page }) => {\n  await page.goto("/");\n});\n';
      const config = "export default {};\n";
      const witnessSeen = withRoot(
        {
          "package.json": JSON.stringify({ scripts: { verify: "pnpm e2e", e2e: "playwright test" } }),
          "playwright.config.ts": config,
          "e2e/silent.spec.ts": spec,
        },
        (root) => pageSuiteViolations(root).length > 0,
      );
      const controlSeen = withRoot(
        {
          "package.json": JSON.stringify({ scripts: { verify: "pnpm typecheck", e2e: "playwright test" } }),
          "playwright.config.ts": config,
          "e2e/silent.spec.ts": spec,
        },
        (root) => pageSuiteViolations(root).length > 0,
      );
      return { witnessSeen, controlSeen };
    },
  },

  "src/quality/pins.ts": {
    kind: "demonstrated",
    bound:
      "A pin is found by its NAME — `*_AT_W<n>` or `*_LAST_UNIT`. A constant that pins a snapshot under any other name is exactly as brittle and entirely invisible, and naming is the one part of the convention nothing enforces.",
    witness: "a constant pinning a count under a name the convention does not cover",
    control: "the same count named `*_AT_W<n>`, which the sweep must report",
    probe: () =>
      withRoot(
        {
          "src/planted/unconventional-pin.ts": "export const REGISTERS_WHEN_WRITTEN = 44;\n",
          "src/planted/conventional-pin.ts": "export const REGISTERS_AT_W295 = 44;\n",
        },
        (root) => {
          const found = pinsInTree(root).map((p) => p.module);
          return {
            witnessSeen: found.some((m) => m.includes("unconventional-pin")),
            controlSeen: found.some((m) => m.includes("conventional-pin")),
          };
        },
      ),
  },

  "src/quality/tautology-sweep.ts": {
    kind: "demonstrated",
    bound:
      "Three shapes are decided from the assertion's own text. A tautology that needs a TYPE to see — `typeof` of a locally declared const, a literal type compared against its own value — is invisible, and `SWEEP_BOUND` names the AST pass that would lift it.",
    witness: "a test asserting `typeof` of a local const, which the type already fixes",
    control: "`expect(true).toBe(true)` in the same tree, which the sweep must report",
    probe: () =>
      withRoot(
        {
          "src/planted/typed.test.ts":
            'it("a test", () => {\n  const code = "abc";\n  expect(typeof code).toBe("string");\n});\n',
          "src/planted/plain.test.ts": 'it("a test", () => {\n  expect(true).toBe(true);\n});\n',
        },
        (root) => {
          const hits = sweepTautologies(root).map((t) => t.file);
          return {
            witnessSeen: hits.some((f) => f.includes("typed")),
            controlSeen: hits.some((f) => f.includes("plain")),
          };
        },
      ),
  },

  "src/quality/acceptances.ts": {
    kind: "demonstrated",
    bound:
      "A register is found by an assigned literal date or an `ACCEPTED_*` export. One whose dates are computed — read from a constant, a config or a helper — holds acceptances nothing here will ever ask about.",
    witness: "a register assigning its review date from a named constant rather than a literal",
    control: "the same register assigning a literal date, which the detector must report",
    probe: () =>
      withRoot(
        {
          "src/planted/computed-dates.ts":
            'const NEXT = "2099-01-01";\nexport const EXCEPTIONS = [{ rule: "no-advice", reviewBy: NEXT }];\n',
          "src/planted/literal-dates.ts":
            'export const EXCEPTIONS = [{ rule: "no-advice", reviewBy: "2099-01-01" }];\n',
        },
        (root) => {
          const found = acceptanceCarryingModules(root);
          return {
            witnessSeen: found.some((m) => m.includes("computed-dates")),
            controlSeen: found.some((m) => m.includes("literal-dates")),
          };
        },
      ),
  },

  "src/quality/refusal-branches.ts": {
    kind: "demonstrated",
    bound:
      "A violation reporter is found by its NAME ending `Violations` or `Diff`. A function with exactly the same job called `problems`, `check`, `assess` or `audit` has refusal arms nobody here will ever drive, and the name is the one part of the convention nothing enforces. (The first draft of this sentence claimed a boolean RETURN type was also invisible; the plant refuted it in one run — the type filter only excludes prose, so a boolean reporter is seen. The mechanism catching its own author's wrong sentence is what the witness is for.)",
    witness: "a reporter with the right shape and a name the convention does not cover",
    control: "the same reporter returning a list, which the walk must report",
    probe: () =>
      withRoot(
        {
          // The token is split so this fixture is not itself read as a reporter by the very walk it
          // is a witness for — `register-census.test.ts` splits `readdirSync(` for the same reason.
          "src/planted/misnamed-reporter.ts":
            ["export function planted", "Problems(\n  input: readonly string[],\n): string[] {\n  return [...input];\n}\n"].join(""),
          "src/planted/list-reporter.ts":
            ["export function planted", "Diff(\n  input: readonly string[],\n): string[] {\n  return [...input];\n}\n"].join(""),
        },
        (root) => {
          const found = violationReporters(root).map((r) => `${r.module}::${r.fn}`);
          return {
            witnessSeen: found.some((f) => f.includes("misnamed-reporter")),
            controlSeen: found.some((f) => f.includes("list-reporter")),
          };
        },
      ),
  },

  // ── Stated, unplanted: the detector is not callable from outside ───────────────────────────
  "src/quality/blind-spots.ts": {
    kind: "undemonstrated",
    bound:
      "It plants witnesses and reads what other registers report, so its own blind spot is a bound that is true for the WRONG REASON — a witness the register misses because it was malformed rather than because of the shape the sentence names. The positive control beside each witness narrows that and does not close it, and `BLIND_SPOT_BOUND` says so at length.",
    whyNotPlantable:
      "A witness for this register would be a bound that is false in a way its own plant cannot observe, which is the definition of what the plant cannot observe. Stating it is the whole of what can be done from inside, and refusing to state it would be the register exempting itself from the question it asks of everything else (W201).",
  },
  "src/quality/bounds.ts": {
    kind: "undemonstrated",
    bound:
      "It resolves a bound's unit, remedy and numbers against the sentence and the tree, so it cannot see whether the sentence is a FAIR description of the limit. A bound naming a real remedy for half of what the remedy would fix resolves cleanly here and understates the limit anyway — which is the shape `BOUNDS_BOUND` names and hands to a reader.",
    whyNotPlantable:
      "A witness would be a bound that resolves and is unfair, and unfairness is a judgement about prose rather than a property a plant can carry. Fabricating one would be writing the answer into the fixture, which is the detector W279 refused to tune. Stating it is what can be done from inside, and the quarterly hardening pass is where a reader looks.",
  },
  "src/security/reachability.ts": {
    kind: "undemonstrated",
    bound:
      "Reach follows STATIC imports. A module pulled in by a dynamic `import()` inside a function body, or by a string path assembled at runtime, is reachable from a request and unreachable from this walk — which is the one direction that matters, because it is how a dormant module wakes up unnoticed.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/route-coverage.ts": {
    kind: "undemonstrated",
    bound:
      "A spec opens a route when its text contains the path as a literal. A spec navigating with a computed path — a base URL joined to a fragment, or a path read from a fixture — covers the route and is invisible here, so the route reads as uncovered rather than as covered by something unreadable.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/security/page-reach.ts": {
    kind: "undemonstrated",
    bound:
      "Route classes are matched by path. A route added inside an existing class's directory inherits that class's allowance without anybody deciding it should, so the register cannot tell a considered membership from an accidental one.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/latent-y5.ts": {
    kind: "undemonstrated",
    bound:
      "An anchor's `holds()` is a predicate somebody wrote about the tree. Nothing checks the predicate is the RIGHT claim for its finding, so an anchor that holds for an unrelated reason keeps a finding alive while proving nothing about it.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/latent-findings.ts": {
    kind: "undemonstrated",
    bound:
      "A finding fires when its trigger returns true. A latent defect nobody wrote a finding for is not in the register at all, and the register is the only thing that would have told anybody to look.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/tree-walks.ts": {
    kind: "undemonstrated",
    bound:
      "It holds the walks and no declared list, so its blind spot is the union of its callers': a file the shared recursion skips — anything under `node_modules`, `.next`, `test-results`, `playwright-report` or `reports` — is invisible to every register built on it at once.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/empty-list-sweep.ts": {
    kind: "undemonstrated",
    bound:
      "A witness is recognised by the shapes W293 enumerated. An assertion whose non-emptiness is established three lines earlier, in a helper, or by a fixture's own construction has a witness the sweep cannot read, so it reports a real assertion as unevidenced.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/register-census.test.ts": {
    kind: "undemonstrated",
    bound:
      "It plants files in front of other registers' walks and asserts nothing of its own, so its blind spot is that a walk it does not plant against is unproved and looks exactly like one that is.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/page-suite.test.ts": {
    kind: "undemonstrated",
    bound:
      "Same shape: it proves `pageSpecFiles` against a tree with no `e2e/` and asserts nothing else, so a spec discovery bug that survives both roots is invisible to it.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/negative-probes.test.ts": {
    kind: "undemonstrated",
    bound:
      "It resolves citations by reading a test's text, so a citation that names a real `it(...)` whose negative has been weakened rather than deleted still resolves.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/api/surface.test.ts": {
    kind: "undemonstrated",
    bound:
      "Dispatch is read from source. An endpoint reachable through a re-export chain, or one registered at runtime, is served and is not in this scan.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/capacity/copy-lint.test.ts": {
    kind: "undemonstrated",
    bound:
      "It lints declared exports. Copy composed inside a render function was W200's stated bound and W278's unit; capacity's own composed strings are covered only where W278's register lists them.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/capacity/coupling.test.ts": {
    kind: "undemonstrated",
    bound:
      "`ENABLED_COUPLINGS` is pinned empty, so what the check proves is that nobody added a NAMED coupling. A capacity signal reaching a patient-facing decision through a shared store, rather than through a declared coupling, is not what this list describes.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/credentials/vault.test.ts": {
    kind: "undemonstrated",
    bound:
      "The grant is enforced by the type system, so this proves nothing about a caller that reaches the store directly rather than through `readEvidence` — the brand protects the API, not the data.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/directory/dossier-claims.test.ts": {
    kind: "undemonstrated",
    bound:
      "It checks that each claim the dossier makes is true of the tree. A control the dossier fails to mention is not a claim, so completeness of the dossier is outside what this can see.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/domain/schema-consistency.test.ts": {
    kind: "undemonstrated",
    bound:
      "Field names are compared. A field present in both with a different MEANING — a date that is a capture time on one side and an event time on the other — is consistent here and wrong everywhere else.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/education/advice-lint.test.ts": {
    kind: "undemonstrated",
    bound:
      "The rules match phrases. Advice given by structure rather than by phrase — an ordering, a highlight, a default — is advice this linter has no way to read, and W217's open question is exactly that.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/interop/credentials.test.ts": {
    kind: "undemonstrated",
    bound:
      "`SHIPPED_CREDENTIALS` pinned empty proves nothing has been shipped under G1. A credential held outside the register, in an environment variable or a deployment secret, is not something this file can see.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/lib/source-hygiene.test.ts": {
    kind: "undemonstrated",
    bound:
      "It checks files tooling must read as text. A file that parses cleanly and encodes something unreadable — a homoglyph in an identifier, a bidirectional control character inside a string — passes every rule here.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/lib/stores.test.ts": {
    kind: "undemonstrated",
    bound:
      "Stores are found by an `export function reset*` convention. A module holding state without a resetter is not a store by this rule and is exactly the module erasure would miss.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/messaging/send-path.test.ts": {
    kind: "undemonstrated",
    bound:
      "It proves no module calls a live transport. A send path assembled at deploy time, or a transport reached through a generic HTTP client, is not named here — the control is over this tree's source, never over what runs.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/privacy/automated-decisions.test.ts": {
    kind: "undemonstrated",
    bound:
      "A decision is declared or argued into `NOT_A_DECISION`. A decision made by a ranking nobody classified as one — W217's question — is in neither list, which is why that question is open rather than answered.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/privacy/erasure-y5.test.ts": {
    kind: "undemonstrated",
    bound:
      "It checks the sweep and the launcher reach the same resetters. Whether a resetter actually erases everything its store holds is the store's own claim, and nothing here re-derives it.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/privacy/capacity-privacy.test.ts": {
    kind: "undemonstrated",
    bound:
      "Records are checked against their declared classes. A field added to a record without changing its class is covered by the old classification, which is the classification's whole weakness.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/privacy/outcomes-privacy.test.ts": {
    kind: "undemonstrated",
    bound:
      "Same bound, plus one of its own: erasure is composed rather than remembered, so a record reachable only through a derived view is erased by whatever the view is built from and by nothing here.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/privacy/record-classes.test.ts": {
    kind: "undemonstrated",
    bound:
      "It checks every record the product HOLDS is classified. A record the product derives at read time is not held and is deliberately outside the register — W266's argument — which means a derivation that starts persisting its result is invisible until somebody notices.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/audit-y5.test.ts": {
    kind: "undemonstrated",
    bound:
      "Every sweep in it re-runs a finding the audit already made. A defect the audit did not look for is not swept, and a year's audit is a reading rather than an enumeration.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/dossier-q18.test.ts": {
    kind: "undemonstrated",
    bound:
      "It pins the dossier's claims row by row against the tree. A control the tree has and the dossier omits is not a row, so the check cannot report an incomplete dossier.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/quality/g5-rehearsal.test.ts": {
    kind: "undemonstrated",
    bound:
      "It proves nothing the product ships imports the rehearsal. Content copied out of it into a shipped module is not an import and is exactly the route the gate exists to close.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/referrals/scoping.test.ts": {
    kind: "undemonstrated",
    bound:
      "Reads are checked to be practice-scoped where W140's triage names them. A read added without a triage entry is unscoped and untriaged, and the register's own both-directions check is what covers that — not this file.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/reporting/retention.test.ts": {
    kind: "undemonstrated",
    bound:
      "It checks the report has a class with a stated life. Whether anything enforces that life at runtime is a different claim and is not made here.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/tenancy/two-tenant.test.ts": {
    kind: "undemonstrated",
    bound:
      "It requires a two-tenant test for every `practice_scoped` read. Two tenants prove the read discriminates; they do not prove it discriminates on the right field, and W280's defect passed a two-tenant test for a quarter.",
    whyNotPlantable: NOT_CALLABLE,
  },

  "src/verticals/assembly.test.ts": {
    kind: "undemonstrated",
    bound:
      "It refuses a vertical that re-implements the shared assembly. A vertical that calls the shared assembly and then adjusts the result afterwards has not re-implemented anything and is outside what W250's census reads.",
    whyNotPlantable: NOT_CALLABLE,
  },
};

/** Bounds whose witness the register DID report, which means the bound is false. */
export function falseBounds(spots: Readonly<Record<string, Blindness>> = BLIND_SPOTS): string[] {
  return Object.entries(spots)
    .filter(([, b]) => b.kind === "demonstrated" && b.probe().witnessSeen)
    .map(([file]) => `${file}: the register reports its own stated blind spot, so the bound is false`)
    .sort();
}

/**
 * Demonstrations whose POSITIVE CONTROL went unseen — a planted tree the detector could not read.
 *
 * The check that makes silence mean something. Without it, a witness that failed to plant, a root
 * the detector never descends into, or a scan pointed at the wrong directory would all look
 * exactly like a demonstrated bound, which is the vacuity this quarter exists to find.
 */
export function deadProbes(spots: Readonly<Record<string, Blindness>> = BLIND_SPOTS): string[] {
  return Object.entries(spots)
    .filter(([, b]) => b.kind === "demonstrated" && !b.probe().controlSeen)
    .map(([file]) => `${file}: the control went unseen, so the detector was not running at all`)
    .sort();
}

export interface BoundDiff {
  /** A census register with no stated bound. */
  unstated: string[];
  /** A bound for a register the census no longer has. */
  stale: string[];
}

/** The register of bounds against the census of registers, both directions. */
export function boundDiff(
  spots: Readonly<Record<string, Blindness>> = BLIND_SPOTS,
  registers: readonly { file: string }[] = TREE_DERIVED_REGISTERS,
): BoundDiff {
  const declared = new Set(Object.keys(spots));
  const census = new Set(registers.map((r) => r.file));
  return {
    unstated: registers.map((r) => r.file).filter((f) => !declared.has(f)).sort(),
    stale: [...declared].filter((f) => !census.has(f)).sort(),
  };
}

/**
 * What this register does not prove about itself, which is the question it asks of everything else.
 *
 * Refusing to answer it here would be the register exempting itself, and W201's rule is that the
 * one exclusion a register allows is the one it states.
 */
export const BLIND_SPOT_BOUND =
  "A demonstrated bound proves that ONE witness went unseen. It does not enumerate the register's blind spots, and it cannot: a detector's false negatives are not a finite list anybody can write down. What the demonstrations buy is that the sentences they plant against are true rather than plausible, and — because a bound restating the register's job would produce a hit rather than silence — that none of them is a sentence describing what the register already does. The rest are stated and unplanted, which is strictly better than unstated and strictly worse than planted, and each says which it is; the split is counted in the register rather than written into this sentence, because W288 found the same totals-in-prose wrong two units after they were typed. This register is subject to its own rule and its bound is this paragraph: nothing here plants a witness against `falseBounds` itself except the fabricated one in its test, so a bound that is true for the wrong reason — a witness the register misses because it was malformed rather than because of the shape the sentence names — would read as a demonstration. The remedy is the one the tree already uses: each witness is written to be otherwise ordinary, and the positive control sits beside it in the test.";

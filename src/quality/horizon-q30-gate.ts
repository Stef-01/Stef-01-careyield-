// W389: the moments re-read — Q30's gate.
//
// THE QUARTER'S OWN SENTENCE, TURNED INTO A CHECK. `docs/HORIZON-Q30.md` says a check is a
// comparison over a population at a MOMENT, that this tree had written down two of the three, and
// that Q30 would establish the third: for every unit, when its check runs, DERIVED from the harness
// rather than declared, and shown both catching a failure that happens at that moment and staying
// silent about one that happens at another. The gate is that every moment the document names is
// shown both ways, and this module is what re-reads it.
//
// WHY BOTH DIRECTIONS AND NOT A COUNT. Q24's gate was a number and the number measured the wrong
// thing; every gate since has been a shape. Here the shape is forced by the subject: a moment
// register that reported everything would satisfy "catches a failure at that moment" and be
// useless, and one that reported nothing would satisfy "stays silent about one at another" and be
// worse. Only the pair says the derivation is about a moment at all.
//
// THE SILENT HALF IS THE HALF THAT WAS MISSING. Q29's gate planted a member and a non-member of a
// POPULATION; this one plants a failure at the moment a check watches and a failure at a different
// moment, and demands the check tell them apart. A check that answers the same at every moment has
// no moment, whatever its register says — and that is the reading the quarter exists to make
// possible.
//
// WHAT THIS DOES NOT PROVE is `Q30_GATE_BOUND`, exported below and read by W297's register.
//
// NOTHING IS IMPORTED THAT REACHES `bounds.ts` AT EVALUATION, per W367 and W381: the derivations
// this gate resolves are named as TEXT and checked against the tree, and the probes below build
// their own inputs rather than reading another register's constants.
//
// FOUNDER GATE (plan §4): nothing crossed. Every probe plants into a constructed tree.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { withTree } from "./planting";
import { fixtureText } from "./scan-text";
import { type UnitId, asUnitId } from "./typed-names";
import { momentDefects } from "./moments";
import { readsTheLiveLedger } from "./welded-comparisons";
import { readsARowStatus } from "./close-sensitivity";
import { reclaimsOf } from "./hook-reach";
import { orderDependent } from "./shared-state";
import { staleGuards } from "./decision-moments";
import { cyclicComponents } from "./import-cycles";
import { speaks } from "@/console/rendered-zeros";
import { uncalledCitations } from "./cited-checks";
import { resolvesInTree } from "./citations";

export const HORIZON_Q30 = "docs/HORIZON-Q30.md";

/**
 * What a moment probe reports.
 *
 * TWO READINGS OF ONE DERIVATION, and the pair is the gate. `caughtHere` plants the failure the
 * check exists for AT the moment it watches; `caughtElsewhere` plants a failure of the same shape
 * at a moment it does not. A check with a moment reports the first and not the second.
 */
export interface Reading {
  /** The failure planted at the moment this check watches. A check that misses it has no teeth. */
  caughtHere: boolean;
  /** The same shape at a moment it does not watch. A check that reports it has no moment. */
  caughtElsewhere: boolean;
}

/** How a unit the horizon names stands against the quarter's gate. */
export type Standing =
  /** It established a moment, and the derivation is run both ways here. */
  | {
      kind: "moment";
      /** `module::export`, resolved against the tree before it is run. */
      derivation: string;
      /** When this check answers, in words — the thing the quarter set out to write down. */
      when: string;
      /** What was planted as failing AT that moment, so a reading that flips is readable. */
      here: string;
      /** What was planted as failing at another. */
      elsewhere: string;
      probe: (root: string) => Reading;
    }
  /** Its subject is not a moment. Argued, so the class is not a bin. */
  | { kind: "not_a_moment"; why: string }
  /** The document names it and the tree has no module for it yet. Derived, not read off a status. */
  | { kind: "not_landed"; module: string };

export interface QuarterMoment {
  /** W342's type rather than a template literal: the tree types this field strictly everywhere. */
  unit: UnitId;
  standing: Standing;
}

export interface QuarterDefect {
  unit: string;
  what: string;
}

/** Every unit the horizon's own table names. Read from the document, not transcribed. */
export function unitsInHorizon(root: string): string[] {
  const document = readFileSync(path.join(root, HORIZON_Q30), "utf8");
  const found = new Set<string>();
  for (const m of document.matchAll(/^\| (W\d+) \|/gm)) found.add(m[1]!);
  return [...found].sort();
}

/** Whether `module::export` names something this tree really exports. */
/**
 * Where the quarter's gate and the tree disagree, in six directions.
 *
 * The two that matter are the halves of the gate's own sentence: a derivation that cannot see a
 * failure at its own moment is not watching that moment, and one that reports a failure at another
 * moment is not watching a moment at all. The other four keep the register honest against the
 * document — a unit named and not re-read, a unit re-read that the document does not name, an
 * excuse with no argument, and a `not_landed` row whose module has since arrived.
 */
export function quarterDefects(
  root: string,
  declared: readonly QuarterMoment[] = MOMENTS_AT_W389,
): QuarterDefect[] {
  const named = unitsInHorizon(root);
  const byUnit = new Map(declared.map((d) => [d.unit as string, d]));
  const out: QuarterDefect[] = [];

  for (const unit of named) {
    const row = byUnit.get(unit);
    if (row === undefined) {
      out.push({ unit, what: "is named by the quarter's horizon and nothing re-reads its moment" });
      continue;
    }
    const standing = row.standing;
    if (standing.kind === "not_a_moment") {
      if (standing.why.length < 120) {
        out.push({ unit, what: "is excused from the gate without an argument" });
      }
      continue;
    }
    if (standing.kind === "not_landed") {
      if (existsSync(path.join(root, standing.module))) {
        out.push({ unit, what: `is recorded as not landed and ${standing.module} is in the tree` });
      }
      continue;
    }
    if (!resolvesInTree(root, standing.derivation)) {
      out.push({ unit, what: `names a derivation this tree does not export: ${standing.derivation}` });
      continue;
    }
    const reading = standing.probe(root);
    if (!reading.caughtHere) {
      out.push({ unit, what: `misses a failure at the moment it watches: ${standing.here}` });
    }
    if (reading.caughtElsewhere) {
      out.push({ unit, what: `reports a failure at a moment it does not watch: ${standing.elsewhere}` });
    }
  }
  for (const { unit } of declared) {
    if (!named.includes(unit)) out.push({ unit, what: "is re-read here and the quarter's horizon does not name it" });
  }
  return out.sort((a, b) => `${a.unit}${a.what}`.localeCompare(`${b.unit}${b.what}`));
}

export const MOMENTS_AT_W389: readonly QuarterMoment[] = [
  {
    unit: asUnitId("W378"),
    standing: {
      kind: "moment",
      derivation: "src/quality/moments.ts::momentDefects",
      when: "at every moment a census member is CALLED, derived from the call sites in the tree rather than from a declaration",
      here: "a census member nothing in the tree runs, which answers at no moment at all",
      elsewhere: "a census member its own suite runs, which is the ordinary moment and must not be reported",
      probe: (root) =>
        withTree(
          {
            "src/planted/w389-idle.ts": "export const idle = (): number => 1;\n",
            "src/planted/w389-run.ts": "export const run = (): number => 2;\n",
            "src/planted/w389-run.test.ts":
              'import { describe, expect, it } from "vitest";\n' +
              'import { run } from "./w389-run";\n' +
              'describe("p", () => {\n  it("x", () => {\n    expect(run()).toBe(2);\n  });\n});\n',
          },
          (planted) => {
            const census = [{ file: "src/planted/w389-idle.ts" }, { file: "src/planted/w389-run.ts" }];
            const found = momentDefects(planted, census, []).map((d) => `${d.file} ${d.what}`);
            return {
              caughtHere: found.some((f) => f.startsWith("src/planted/w389-idle.ts") && f.includes("no moment")),
              caughtElsewhere: found.some((f) => f.startsWith("src/planted/w389-run.ts")),
            };
          },
        ),
    },
  },
  {
    unit: asUnitId("W379"),
    standing: {
      kind: "moment",
      derivation: "src/quality/welded-comparisons.ts::readsTheLiveLedger",
      when: "only while its own suite runs — a comparison welded inside a `.test.ts` answers then and at no other time",
      here: "a test reading the LIVE ledger, whose answer therefore depends on the moment the suite runs at",
      elsewhere: "a test building its own ledger text, which answers the same whenever it runs",
      probe: (root) =>
        withTree(
          {
            "src/planted/w389-live.test.ts": fixtureText("w389-live-ledger"),
            "src/planted/w389-planted.test.ts": fixtureText("w389-planted-ledger"),
          },
          (planted) => ({
            caughtHere: readsTheLiveLedger(planted, "src/planted/w389-live.test.ts"),
            caughtElsewhere: readsTheLiveLedger(planted, "src/planted/w389-planted.test.ts"),
          }),
        ),
    },
  },
  {
    unit: asUnitId("W380"),
    standing: {
      kind: "moment",
      derivation: "src/quality/close-sensitivity.ts::readsARowStatus",
      when: "at a CLOSE — the one commit whose suite is easiest not to re-run, and the only event that moves a row's status",
      here: "a suite reading a row's STATUS, whose answer a close can turn",
      elsewhere: "a suite naming the ledger and reading no status, which a close leaves alone",
      probe: (root) =>
        withTree(
          {
            "src/planted/w389-status.test.ts": fixtureText("w389-reads-status"),
            "src/planted/w389-nostatus.test.ts": fixtureText("w389-names-no-status"),
          },
          (planted) => ({
            caughtHere: readsARowStatus(planted, "src/planted/w389-status.test.ts"),
            caughtElsewhere: readsARowStatus(planted, "src/planted/w389-nostatus.test.ts"),
          }),
        ),
    },
  },
  {
    unit: asUnitId("W382"),
    standing: {
      kind: "moment",
      derivation: "src/quality/hook-reach.ts::reclaimsOf",
      when: "when the hook fires — and the question is whether what it reclaims outlives the process the hook belongs to",
      here: "a hook body that removes from the FILESYSTEM, which outlives the run and so needs a hook that fires at the right one",
      elsewhere: "a hook body that resets an in-memory store, which the process ending would have cleared anyway",
      probe: (root) => {
        void root;
        return {
          caughtHere: reclaimsOf('rmSync(dir, { recursive: true, force: true });') === "outside_the_process",
          caughtElsewhere: reclaimsOf("store.clear();") === "outside_the_process",
        };
      },
    },
  },
  {
    unit: asUnitId("W385"),
    standing: {
      kind: "moment",
      derivation: "src/quality/shared-state.ts::orderDependent",
      when: "once per FILE or once per RUN — the two moments a suite's state can be scoped to, and the clash is between them",
      here: "two test files writing the same repository path, whose answers depend on which ran first",
      elsewhere: "two test files writing different paths, which cannot see each other whatever the order",
      probe: (root) => {
        void root;
        const write = (p: string): string =>
          'import { writeFileSync } from "node:fs";\nimport path from "node:path";\n' +
          `const ROOT = process.cwd();\nexport const go = () => writeFileSync(path.join(ROOT, "${p}"), "x");\n`;
        const clash = orderDependent(root, [
          { module: "src/planted/w389-a.test.ts", source: write("shared.json") },
          { module: "src/planted/w389-b.test.ts", source: write("shared.json") },
        ]);
        const apart = orderDependent(root, [
          { module: "src/planted/w389-a.test.ts", source: write("only-a.json") },
          { module: "src/planted/w389-b.test.ts", source: write("only-b.json") },
        ]);
        return { caughtHere: clash.length > 0, caughtElsewhere: apart.length > 0 };
      },
    },
  },
  {
    unit: asUnitId("W387"),
    standing: {
      kind: "moment",
      derivation: "src/quality/decision-moments.ts::staleGuards",
      when: "when a rule DECIDES about a patient, against the moment the set it was handed was guarded",
      here: "a rule taking an already-guarded set AND naming its own instant, so the guard can be older than the decision",
      elsewhere: "a rule taking the same set and naming no instant, which cannot be at a different one from its caller",
      probe: (root) => {
        void root;
        const found = staleGuards(root, [
          { rule: "src/planted/w389.ts::later", decidesAt: "at", reads: "an_already_guarded_set" },
          { rule: "src/planted/w389.ts::pure", decidesAt: null, reads: "an_already_guarded_set" },
        ]);
        return {
          caughtHere: found.includes("src/planted/w389.ts::later"),
          caughtElsewhere: found.includes("src/planted/w389.ts::pure"),
        };
      },
    },
  },
  {
    unit: asUnitId("W381"),
    standing: {
      kind: "moment",
      derivation: "src/quality/import-cycles.ts::cyclicComponents",
      when: "while the module graph EVALUATES — the one moment in this tree that happens before any test does, and the only one a cycle can be wrong at",
      here: "two modules importing each other, which the evaluation order has to resolve one way and therefore can resolve wrongly",
      elsewhere: "the same two modules with the import going one way only, where no order exists to get wrong",
      probe: (root) => {
        void root;
        const cyclic = new Map([
          ["src/planted/w389-a.ts", [{ to: "src/planted/w389-b.ts", value: true }]],
          ["src/planted/w389-b.ts", [{ to: "src/planted/w389-a.ts", value: true }]],
        ]);
        const acyclic = new Map([
          ["src/planted/w389-a.ts", [{ to: "src/planted/w389-b.ts", value: true }]],
          ["src/planted/w389-b.ts", []],
        ]);
        const holds = (graph: Map<string, { to: string; value: boolean }[]>): boolean =>
          cyclicComponents(root, graph).some((c) => c.includes("src/planted/w389-a.ts"));
        return { caughtHere: holds(cyclic), caughtElsewhere: holds(acyclic) };
      },
    },
  },
  {
    unit: asUnitId("W384"),
    standing: {
      kind: "moment",
      derivation: "src/console/rendered-zeros.ts::speaks",
      when: "at RENDER — the moment a page puts something in front of a person, which is a different moment from the one it computed the number at",
      here: "an arm of a conditional that renders WORDS, which a reader sees and an expression-name walk cannot",
      elsewhere: "an arm that renders nothing, which is silence and must not be read as a page speaking",
      probe: (root) => {
        void root;
        return {
          caughtHere: speaks("<p>No referrals yet</p>"),
          caughtElsewhere: speaks("null"),
        };
      },
    },
  },
  {
    unit: asUnitId("W388"),
    standing: {
      kind: "moment",
      derivation: "src/quality/cited-checks.ts::uncalledCitations",
      when: "when the cited test RUNS — and the finding is a citation that resolves to something real and is never run at all, so its moment never arrives",
      here: "a citation naming a subject the cited test does not call, which therefore answers at no moment",
      elsewhere: "a citation whose cited test calls its subject, which answers whenever that test does",
      probe: (root) =>
        withTree(
          {
            "src/planted/w389-subject.ts": "export const checked = (): number => 1;\n",
            "src/planted/w389-runs.test.ts":
              'import { describe, expect, it } from "vitest";\n' +
              'import { checked } from "./w389-subject";\n' +
              'describe("p", () => {\n  it("calls it", () => {\n    expect(checked()).toBe(1);\n  });\n});\n',
            "src/planted/w389-idle.test.ts":
              'import { describe, expect, it } from "vitest";\n' +
              'describe("p", () => {\n  it("names it and calls nothing", () => {\n    expect(1).toBe(1);\n  });\n});\n',
            // The CITING module has to exist too: `uncalledCitations` resolves a citation against
            // the file that makes it, not only against the test it points at.
            "src/planted/w389-gate.ts": "export const cites = (): number => 1;\n",
          },
          (planted) => {
            const cite = (test: string, title: string): string =>
              `src/planted/${test} :: ${title}`;
            const run = (citation: string): string[] =>
              uncalledCitations(
                planted,
                [{ citation, subject: { kind: "module", module: "src/planted/w389-subject.ts" } }],
                [{ citing: "src/planted/w389-gate.ts", citation, at: 0 }],
                [],
              ).map((d) => d.citation);
            const idle = cite("w389-idle.test.ts", "names it and calls nothing");
            const runs = cite("w389-runs.test.ts", "calls it");
            return { caughtHere: run(idle).includes(idle), caughtElsewhere: run(runs).includes(runs) };
          },
        ),
    },
  },
  {
    unit: asUnitId("W383"),
    standing: {
      kind: "not_a_moment",
      why: "A HARDENING PASS IS A READING, NOT A CHECK WITH A MOMENT. Q29's pass records what one reader found in one pinned range of diff, and its suite re-derives each finding — so the thing that runs has the moment of any other suite, per test, and nothing about the pass turns on when it answers. What DOES have a moment is each fix the pass made, and every one of them is re-read by the register it landed in rather than here: the compound number-word derivation by W314's own arm, the patient-panel scan by W373's, and the shared scan composition by W302's. A row here would be re-reading those registers a second time under a heading about moments.",
    },
  },
  {
    unit: asUnitId("W386"),
    standing: {
      kind: "not_a_moment",
      why: "A MUTATION SWEEP IS A MEASUREMENT OF A TREE, NOT A CHECK WATCHING AN EVENT. The survivors register runs the quarter's suites against changed lines and records what nothing noticed; its own moment is its suite's, per test, and the sweep would report the same survivors whenever it ran. The one thing in it that IS about a moment belongs to another unit's register: the run is excluded from measuring the previous quarter's sweep because that module's sibling suite spawns a sweep of its own, which is a fact about cost at gate time and is stated in `Q29_MUTANT_BOUND` rather than re-read here.",
    },
  },
  {
    unit: asUnitId("W389"),
    standing: {
      kind: "not_a_moment",
      why: "THIS MODULE, AND THE OMISSION WOULD BE THE ONE W305'S MANIFEST EXISTS FOR. The gate is the thing being run rather than a check a moment can break — it answers when its own suite answers, per test, like every other register — and giving it a moment row would be the tautology W316 is about: a gate that re-read itself would report on the instrument rather than on the quarter. What keeps it honest instead is that it is DERIVED from the document: a unit the horizon names and this register does not hold is reported, in both directions, on every run.",
    },
  },
  {
    unit: asUnitId("W390"),
    standing: { kind: "not_landed", module: "src/quality/horizon-q31.ts" },
  },
];

/** What a green gate does not prove. */
export const Q30_GATE_BOUND =
  "A READING IS TWO PLANTED INPUTS, NOT A MOMENT. Each probe shows a derivation reporting a " +
  "failure shaped like the one at the moment it watches and ignoring one shaped like a failure " +
  "elsewhere, which is the gate's sentence and is far short of the check being right about time: " +
  "both plants are chosen by the same person who wrote the row, so a check whose real moment is " +
  "neither of them passes here twice over. WORSE THAN Q29's VERSION OF THAT CLAUSE, and worth " +
  "saying plainly: a population can be planted whole, and a MOMENT cannot. What these probes " +
  "actually vary is the SHAPE of an input, not the instant a check runs at — nothing here starts " +
  "a process, closes a row or renders a page — so every row below is evidence that a derivation " +
  "distinguishes the two situations, and inference that it therefore distinguishes the two " +
  "moments. The one unit whose probe runs at a real moment is W380's, and it is a suite runner " +
  "rather than anything this gate does. THE POPULATION IS THE DOCUMENT'S TABLE, so a check this " +
  "quarter built that the horizon does not list is outside the gate entirely, and the table lists " +
  "UNITS rather than moments — a unit that established two is re-read on one of them. AND " +
  "`not_a_moment` IS A JUDGEMENT: it says a unit's subject is a reading or a measurement rather " +
  "than an event, which nothing here derives, and the honest test of it is whether the next " +
  "quarter's gate can say why in the same terms.";

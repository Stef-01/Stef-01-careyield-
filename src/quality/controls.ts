// W337: Q26's gate — every control the horizon names, tied to its event or owning its instant.
//
// Q26'S THEME WAS *WHEN THE CHECK RUNS*, and its gate is not a number for the same reason Q25's
// was not: Q24 set a number, the number moved the wrong way, and the quarter's own close said the
// instrument rather than the work was wrong. So `docs/HORIZON-Q26.md` asks instead that every
// control it names either RUNS AT THE EVENT IT CONCERNS or DECLARES THE INSTANT IT ANSWERS AT with
// what that instant cannot see — and W337 re-reads the list rather than totalling it.
//
// THE TWO ANSWERS ARE NOT ALTERNATIVES OF EQUAL WEIGHT. Tying a control to its event is the fix;
// declaring the instant is the honest fallback for a control that cannot be tied, and W327 built
// the register that holds those declarations. What this gate adds is the reading BETWEEN the
// planning document and the two mechanisms: a control tied to nothing and declared nowhere is
// exactly the shape the quarter was called after, and until now nothing would have noticed one.
//
// EVERY TIED ANSWER IS DRIVEN. `fires()` hands the control the event it is about and the answer
// counts only if the control speaks. A control that has quietly stopped watching its moment reads
// identically to one whose moment has not arrived, which is the failure Q26 exists to make
// visible — and the only way to tell them apart is to make the moment arrive.
//
// WHAT THIS DOES NOT PROVE is `CONTROL_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads a planning document and drives registers.

import { readFileSync } from "node:fs";
import path from "node:path";
import { parseLedgerRows } from "./blocked-surface";
import { CLOSING_CHECKS } from "./closing-state";
import { founderDiff } from "@/founder/outstanding";
import { CONTROLS, instantDiff } from "./instant";
import { emptyFormsIn } from "./assertion-vocabulary";
import { type HardeningFinding, overdueDispositions } from "./hardening-q22";
import { inheritedBy } from "./deferrals";
import { quarterModules } from "./quarter-mutants";
import { uncleanMessage } from "./repository-clean";
import { endedDeclarations } from "./self-ending";
import { unrunDefects } from "./unrun";
import { asUnitId, type UnitId } from "./typed-names";

/** The document this unit re-reads. */
export const HORIZON = "docs/HORIZON-Q26.md";

/** A unit id, as the ledger spells it. */
// W342: the type lives in `typed-names.ts` now — it had been written three times.
export type { UnitId };

/** A row of the horizon's unit table: the control, as the document names it. */
export interface HorizonControl {
  unit: UnitId;
  what: string;
}

/**
 * The controls the horizon names, read from its unit table.
 *
 * DERIVED RATHER THAN LISTED, for W324's reason: a hand-copied list of what a document says is the
 * second copy this loop keeps finding. The requirement table's rows open with a digit and the
 * gate-position table's with a gate id, so the unit table is the only one this matches.
 */
export function controlsInHorizon(root: string): HorizonControl[] {
  const doc = readFileSync(path.join(root, HORIZON), "utf8");
  // W342: narrowed rather than cast. The regex already says the id is `W`-shaped; `asUnitId` is
  // what makes the TYPE say it, and it throws on a row this parse should never have matched.
  return [...doc.matchAll(/^\| (W\d+) \| (.+?) \|$/gm)].map((m) => ({
    unit: asUnitId(m[1]!),
    what: m[2]!.trim(),
  }));
}

/** The document with its markers stripped, so a quoted phrase is matched as text and not as markup. */
function horizonText(root: string): string {
  return readFileSync(path.join(root, HORIZON), "utf8").replace(/[`*]/g, "").replace(/\s+/g, " ");
}

/** How a control answers the gate. */
export type Answer =
  | {
      /** It runs at the event it concerns, and the event is made to arrive here. */
      kind: "tied";
      /** The event, in a reader's words. */
      event: string;
      /** The module holding it, checked against the tree so a rename fails. */
      module: string;
      /** The export, likewise. */
      control: string;
      /** True when the control SPEAKS on being handed its event. */
      fires: (root: string) => boolean;
    }
  | {
      /** It answers at a stated instant, declared in W327's register with what that instant misses. */
      kind: "declares_its_instant";
      /** The `module::export` id, resolved against `CONTROLS`. */
      id: string;
    }
  | { kind: "pending"; by: UnitId; why: string }
  | { kind: "not_a_control"; why: string; cites: string };

export interface ControlAnswer {
  unit: UnitId;
  answer: Answer;
}

/**
 * Declare an answer, refusing one that argues nothing.
 *
 * A runtime refusal rather than a type, for W210's reason: `why: ""` typechecks, and an argument
 * that is an empty sentence is what a gate phrased as *declares … with what that instant cannot
 * see* exists to stop.
 */
export function declareAnswer(answer: ControlAnswer): ControlAnswer {
  const a = answer.answer;
  if ((a.kind === "pending" || a.kind === "not_a_control") && a.why.trim().length < 80) {
    throw new Error(`${answer.unit} is argued away in fewer words than the argument needs`);
  }
  if (a.kind === "not_a_control" && a.cites.trim().length === 0) {
    throw new Error(`${answer.unit} argues from the horizon and quotes none of it`);
  }
  return answer;
}

/** A ledger row as a closing gate would meet it, for the controls that answer at a close. */
const CLOSING_ROW = "| W900 | done | builder-A | 2026-01-01T00:00Z | PENDING | a row that closes on nothing |";

/** A finding deferred to a unit the handed-in ledger already closes. */
const OVERDUE: HardeningFinding = {
  id: "W337-PROBE",
  lens: "code-review",
  unit: "W337",
  what: "a fabrication, handed in so a clock has something to run out on",
  raisedOn: "2026-01-01",
  disposition: { kind: "deferred", why: "deferred to a unit that has landed", by: "W900" },
};

const LANDED = "| W900 | done | builder-A | 2026-01-01T00:00Z | abc1234 | landed |";

/** Every control the horizon names, answered. */
export const CONTROL_ANSWERS: readonly ControlAnswer[] = [
  declareAnswer({
    unit: "W326",
    answer: {
      kind: "tied",
      event: "a ledger row closing",
      module: "src/quality/closing-state.ts",
      control: "CLOSING_CHECKS",
      fires: (root) => {
        const check = CLOSING_CHECKS.find((c) => c.id === "sha-shape");
        return check !== undefined && check.run(CLOSING_ROW, root, "W900").length > 0;
      },
    },
  }),
  declareAnswer({
    unit: "W327",
    answer: { kind: "declares_its_instant", id: "src/quality/tree-walks.ts::sourceModules" },
  }),
  declareAnswer({
    unit: "W328",
    answer: {
      kind: "tied",
      event: "the end of a run, after every worker has finished",
      module: "src/quality/repository-clean.ts",
      control: "uncleanMessage",
      fires: (root) => uncleanMessage(root, [{ where: "src", means: "x".repeat(160) }]) !== null,
    },
  }),
  declareAnswer({
    unit: "W329",
    answer: {
      kind: "tied",
      event: "a unit being built, reading what was deferred to it",
      module: "src/quality/deferrals.ts",
      control: "inheritedBy",
      fires: () => inheritedBy("W900", [OVERDUE]).length > 0,
    },
  }),
  declareAnswer({
    unit: "W330",
    answer: {
      kind: "tied",
      event: "the event a declaration waits for, arriving",
      module: "src/quality/self-ending.ts",
      control: "endedDeclarations",
      fires: (root) =>
        endedDeclarations(root, [
          {
            unit: "W337",
            module: "src/quality/controls.ts",
            register: "PROBE",
            entries: () => [
              { id: "W337::PROBE", what: "a fabrication", ending: { kind: "unit_lands", unit: "W1" } },
            ],
            rechecked: { kind: "ended_here" },
          },
        ]).length > 0,
    },
  }),
  declareAnswer({
    unit: "W331",
    answer: {
      kind: "tied",
      event: "a deferral's unit landing, or an acceptance's review date passing",
      module: "src/quality/hardening-q22.ts",
      control: "overdueDispositions",
      fires: () => overdueDispositions(LANDED, [OVERDUE], "2026-01-01").length > 0,
    },
  }),
  declareAnswer({
    unit: "W332",
    answer: {
      kind: "tied",
      event: "a module arriving inside the quarter's range, which is what makes it the quarter's to sample",
      module: "src/quality/quarter-mutants.ts",
      control: "quarterModules",
      // WRITTEN AS `pending` AND EXPIRED BEFORE THIS UNIT'S FIRST FULL RUN. builder-B closed W332
      // while this gate was being written, and the arm reported it on the drive — the second time
      // the mechanism W324 wrote and W330 generalised has fired in the tree rather than in a test.
      fires: (root) => quarterModules(root, { first: 333, last: 333 }).includes("src/quality/unrun.ts"),
    },
  }),
  declareAnswer({
    unit: "W333",
    answer: {
      kind: "tied",
      event: "a module arriving that no test suite can reach",
      module: "src/quality/unrun.ts",
      control: "unrunDefects",
      fires: (root) => unrunDefects(root, []).length > 0,
    },
  }),
  declareAnswer({
    unit: "W334",
    answer: {
      kind: "not_a_control",
      why:
        "The demo path's third scenario is product work under the founder gates, not a control this tree runs over itself. The horizon plans it as an extension of the walks W309 and W321 built, and what it checks is a page saying something to an operator rather than a moment arriving in this repository.",
      cites: "W334 extends them by exactly as much as can be extended without a ruling",
    },
  }),
  declareAnswer({
    unit: "W335",
    answer: {
      kind: "tied",
      event: "a blocked row arriving that no release path names, or a gate §4 clears while rows still wait on it",
      module: "src/founder/outstanding.ts",
      control: "founderDiff",
      // THE GATE READS CONTROLS, NOT UNITS, and that distinction decides this row. W335 is in
      // flight in a sibling session, and the first draft answered it `pending` — which was wrong
      // twice over: the control this row concerns ALREADY RUNS, because the outstanding position
      // has been derived from the ledger and §4 since W319, and what W335 adds is deriving the
      // DOSSIER from it as well. Answering `pending` also made this gate expire on somebody
      // else's close, which `closing-state.ts` says in as many words is not this session's event.
      fires: (root) => founderDiff(root, []).unrendered.length > 0,
    },
  }),
  declareAnswer({
    unit: "W336",
    answer: {
      kind: "tied",
      event: "an assertion arriving that spells emptiness a second way",
      module: "src/quality/assertion-vocabulary.ts",
      control: "emptyFormsIn",
      fires: () => emptyFormsIn("expect(rows).toHaveLength(0);").length > 0,
    },
  }),
  declareAnswer({
    unit: "W337",
    answer: {
      kind: "not_a_control",
      why:
        "This register. A gate that answered itself would be the tautology class W316 was written for, in the one place it would be hardest to see — and the horizon names this row as the re-reading rather than as one of the things re-read.",
      cites: "W337 re-reads the list",
    },
  }),
  declareAnswer({
    unit: "W338",
    answer: {
      kind: "not_a_control",
      why:
        "The quarter close expands the next quarter under the horizon rule. It states a position and plans work; it runs at no event in this repository and watches nothing, and the rule it follows is checked by its own horizon test rather than here.",
      cites: "Quarter close: Q27 expansion under the horizon rule",
    },
  }),
];

/** One line per way the gate fails. */
export interface ControlDefect {
  unit: UnitId;
  what: string;
}

/**
 * The gate: every control named, tied or declared; every answer, still standing.
 *
 * BOTH DIRECTIONS, and the third is the one the quarter adds: an answer that names a control is
 * only an answer while the control still SPEAKS when its event arrives.
 */
export function controlDefects(
  root: string,
  declared: readonly ControlAnswer[] = CONTROL_ANSWERS,
  found: readonly HorizonControl[] = controlsInHorizon(root),
): ControlDefect[] {
  const out: ControlDefect[] = [];
  const answered = new Map(declared.map((d) => [d.unit, d.answer]));
  const named = new Set(found.map((c) => c.unit));

  for (const control of found) {
    if (!answered.has(control.unit)) {
      out.push({ unit: control.unit, what: "is named in the horizon and answered nowhere" });
    }
  }

  for (const { unit, answer } of declared) {
    if (!named.has(unit)) {
      out.push({ unit, what: "is answered here and the horizon names no such control" });
      continue;
    }
    if (answer.kind === "tied") {
      const body = readFileSync(path.join(root, answer.module), "utf8");
      if (!new RegExp(`export (function|const|interface|type) ${answer.control}\\b`).test(body)) {
        out.push({ unit, what: `names \`${answer.control}\`, which \`${answer.module}\` does not export` });
      } else if (!answer.fires(root)) {
        out.push({ unit, what: `is tied to ${answer.event} and says nothing when that event arrives` });
      }
    }
    if (answer.kind === "declares_its_instant") {
      const control = CONTROLS.find((c) => c.id === answer.id);
      if (!control) {
        out.push({ unit, what: `declares its instant as \`${answer.id}\`, which W327's register does not hold` });
      } else if (control.instant.trim().length === 0 || control.cannotSee.trim().length === 0) {
        out.push({ unit, what: `declares an instant that does not say what it cannot see` });
      }
    }
    if (answer.kind === "pending") {
      const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
      const row = parseLedgerRows(ledger).find((r) => r.id === answer.by);
      if (row?.status === "done") out.push({ unit, what: `waits on ${answer.by}, which has landed` });
    }
    if (answer.kind === "not_a_control") {
      const quoted = answer.cites.replace(/[`*]/g, "").replace(/\s+/g, " ").trim();
      if (!horizonText(root).includes(quoted)) {
        out.push({ unit, what: "argues from a sentence the horizon does not contain" });
      }
    }
  }

  return out.sort((a, b) => `${a.unit}${a.what}`.localeCompare(`${b.unit}${b.what}`));
}

/** The instant-dependence W327 measures, re-read here so the two gates cannot drift apart. */
export function unstableControls(root: string): string[] {
  return instantDiff(root).map((i) => i.control).sort();
}

/** What this gate does not prove. */
export const CONTROL_BOUND =
  "A tied answer proves the control speaks when handed the event, and the event handed to it is " +
  "a FABRICATION — a closing row written here, a ledger holding a single done unit, a register " +
  "carrying an invented entry. What it does not prove is that the control is WIRED to the real " +
  "event: " +
  "`uncleanMessage` speaks when it is called with an artefact, and whether anything calls it after " +
  "the last worker exits is a fact about `vitest.global-setup.ts` rather than about the control. " +
  "That wiring is checked where each control lives and this deliberately does not repeat it. The " +
  "declared-instant arm is thinner still: it resolves a control against W327's register and " +
  "requires the register to say what the instant misses, which is a check that the DECLARATION " +
  "exists rather than that it is true — whether a sentence about what a moment cannot see is " +
  "accurate is a judgement no derivation makes. And a control the horizon does not name is " +
  "outside this entirely; the gate reads a planning document, so a control nobody planned is not " +
  "ungoverned here, it is invisible.";

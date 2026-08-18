// W330: every declaration whose truth depends on a future event, and the event that ends it.
//
// W294 DID THIS FOR DATES. An exception with no expiry is a rule that was quietly deleted, so
// `acceptances.ts` collects every `reviewBy` in the tree into one register and fails the build the
// day one passes. Nothing did it for the other half. A declaration can also be conditional on an
// EVENT — *until W334 lands*, *while G5 is unruled*, *until somebody writes the remedy* — and those
// were scattered across several registers, each checking its own and none of them checked together.
//
// THE COST OF THAT IS MEASURED. W318 found three deferrals pointing at ranges nothing evaluates,
// and one of them — Q23-SIMP-1, deferred to `W299+` — had been ANSWERED BY W301 and still read
// `deferred` seventeen units later. The declaration named a moment; no moment ever arrived to read
// it. W324 then wrote the counter-example by accident: a `pending` answer that said *the day the
// ledger closes that row, this becomes a driven answer or the gate fails*. A sibling session closed
// the row, and the next pull ran it red on the firing it named. It is the only declaration in Q25
// tied to an event rather than to a run, and it is the only one that ended when it should have.
//
// SO THE SHAPE IS NOT A FIELD, IT IS A PAIR: something declared, and a predicate that reads whether
// the thing it waits for has happened. A deferral waits on a unit; a blocked row waits on a founder
// ruling; a bound's remedy waits on somebody building it. Different registers, one property, and
// the property is checkable in one place — which is the whole of W294's argument, applied to the
// other half of it.
//
// WHAT THIS DOES NOT PROVE is `ENDING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads registers, the ledger and the plan.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseGates } from "@/founder/outstanding";
import { blockedRows, blockersIn, parseLedgerRows } from "./blocked-surface";
import { STATED_BOUNDS } from "./bounds";
import { CLASS_ANSWERS } from "./claim-classes";
import { FINDINGS as Q24_FINDINGS } from "./hardening-q24";
import { FINDINGS as Q25_FINDINGS } from "./hardening-q25";
import { FINDINGS as Q22_FINDINGS, type HardeningFinding, type UnitId } from "./hardening-q22";
import { FINDINGS as W279_FINDINGS } from "./review-w279";
import { prepareForScan } from "./scan-text";
import { typescriptFiles } from "./tree-walks";

/**
 * What a declaration waits for.
 *
 * Three kinds because the tree has three, and the kind is what makes the wait READABLE: a reader
 * meeting a deferral wants to know which unit, and a reader meeting a blocked row wants to know
 * which gate. A single opaque predicate would end the declaration correctly and tell nobody why.
 */
export type Ending =
  /** The named unit's ledger row says `done`. */
  | { kind: "unit_lands"; unit: UnitId }
  /** Section 4 marks the named gate cleared — a founder ruling, and never this loop's to make. */
  | { kind: "gate_ruled"; gate: string }
  /** A predicate over the tree: the remedy this waits for has been built. */
  | { kind: "remedy_built"; reads: string; built: (root: string) => boolean }
  /**
   * Nothing in this tree could observe the event — the escape hatch, enumerated and argued.
   *
   * `Lifting.inherent`'s shape and for the same reason: an ending nobody can read is exactly the
   * declaration this unit is about, so the way to hold one is to SAY it cannot be read rather than
   * to write a predicate that returns false forever and looks like a check.
   */
  | { kind: "unobservable"; why: string };

/** A declaration that is true only until something happens. */
export interface SelfEnding {
  /** `<unit>::<identity within its register>`, stable across edits above it. */
  id: string;
  /** What is being declared, for whoever meets it after the event. */
  what: string;
  ending: Ending;
}

/** How the register's own entries are checked to still be the thing they describe. */
export type Rechecked =
  /** Ended here, by this module, over the live tree. */
  | { kind: "ended_here" }
  /** Ended by the register that owns it as well; named so the overlap is visible, not hidden. */
  | { kind: "ended_there_too"; check: string; why: string };

export interface EndingRegister {
  /** The unit that wrote the declarations. */
  unit: string;
  module: string;
  /** The export carrying them. */
  register: string;
  entries: () => SelfEnding[];
  rechecked: Rechecked;
}

const deferrals = (unit: string, findings: readonly HardeningFinding[]): SelfEnding[] =>
  findings.flatMap((f) =>
    f.disposition.kind === "deferred"
      ? [
          {
            id: `${unit}::${f.id}`,
            what: `${f.id} is deferred: ${f.disposition.why}`,
            ending: { kind: "unit_lands" as const, unit: f.disposition.by },
          },
        ]
      : [],
  );

/** Every register in this tree holding a declaration that waits for something. */
export const ENDING_REGISTERS: readonly EndingRegister[] = [
  {
    unit: "W318",
    module: "src/quality/hardening-q22.ts",
    register: "FINDINGS",
    entries: () => deferrals("W318", Q22_FINDINGS),
    rechecked: {
      kind: "ended_there_too",
      check: "overdueDispositions",
      why: "W318 reads the same deferrals against the same ledger, and should: a finding's own register is where somebody looking at the finding will be. What is added here is that the deferral is read BESIDE the other things this tree is waiting on, and that a register dropping its own check is visible from outside it.",
    },
  },
  {
    unit: "W331",
    module: "src/quality/hardening-q25.ts",
    register: "FINDINGS",
    entries: () => deferrals("W331", Q25_FINDINGS),
    rechecked: {
      kind: "ended_there_too",
      check: "overdueDispositions",
      why: "Q25's pass, arriving one firing after this register was written and reported by it as unregistered on the first run — which is the both-directions arm doing exactly what it is for. Its two deferrals point at W334 and W336, units of this quarter that have not been built.",
    },
  },
  {
    unit: "W311",
    module: "src/quality/hardening-q24.ts",
    register: "FINDINGS",
    entries: () => deferrals("W311", Q24_FINDINGS),
    rechecked: {
      kind: "ended_there_too",
      check: "overdueDispositions",
      why: "The same reading, for Q24's pass. Its live deferral points at W327, a unit of the quarter now being built, so this is the entry most likely to end in the ordinary course of the loop rather than through anybody noticing.",
    },
  },
  {
    unit: "W279",
    module: "src/quality/review-w279.ts",
    register: "FINDINGS",
    entries: () => deferrals("W279", W279_FINDINGS),
    rechecked: {
      kind: "ended_there_too",
      check: "overdueDispositions",
      why: "The review pass W318 retyped. Its deferral is the one that had gone thirty-one units past a range nothing evaluated, which is why it is in this register rather than trusted to its own.",
    },
  },
  {
    unit: "W324",
    module: "src/quality/claim-classes.ts",
    register: "CLASS_ANSWERS",
    entries: () =>
      CLASS_ANSWERS.flatMap((a) =>
        a.answer.kind === "pending"
          ? [
              {
                id: `W324::${a.unit}`,
                what: `${a.unit}'s claim class is answered by a unit that has not landed: ${a.answer.why}`,
                ending: { kind: "unit_lands" as const, unit: a.answer.by },
              },
            ]
          : [],
      ),
    rechecked: {
      kind: "ended_there_too",
      check: "classDefects",
      why: "The arm this unit generalises. It is empty today because it ended: W323 landed, the gate went red on the next pull, and the answer became a driven one. An empty register here is the mechanism having worked, not a register with nothing in it.",
    },
  },
  {
    unit: "W306",
    module: "src/quality/bounds.ts",
    register: "STATED_BOUNDS",
    entries: () =>
      STATED_BOUNDS.flatMap((b) => {
        const lifting = b.lifting;
        if (lifting.kind !== "remedy") return [];
        return [
          {
            id: `W306::${b.module}::${b.name}`,
            what: `${b.name} states a limit whose remedy is ${lifting.remedy}`,
            ending: {
              kind: "remedy_built" as const,
              reads: lifting.reads,
              built: (root: string) => !lifting.stillOpen(root),
            },
          },
        ];
      }),
    rechecked: {
      kind: "ended_there_too",
      check: "staleBounds",
      why: "W306 already reads these, and the reason to read them again from here is that a bound is the least event-shaped of the four and the easiest to forget is waiting on anything. A remedy that lands makes the sentence beside it false, which is the same failure as a deferral outliving its unit.",
    },
  },
  {
    unit: "W319",
    module: "BUILD-STATE.md",
    register: "blocked rows",
    entries: () => [],
    rechecked: {
      kind: "ended_there_too",
      check: "founderDiff.clearedButBlocking",
      why: "Filled from the ledger rather than from a list, so `entries` is empty and `ledgerEndings` is the derivation. The wait is a founder ruling and this loop can never end it, which is exactly why it belongs in a register of things being waited on.",
    },
  },
];

/** The blocked rows, as declarations waiting on a ruling. Derived, because the ledger moves. */
export function ledgerEndings(root: string): SelfEnding[] {
  const seen = new Map<string, string[]>();
  for (const row of blockedRows(root)) {
    for (const blocker of blockersIn(row.note)) {
      seen.set(blocker, [...(seen.get(blocker) ?? []), row.id]);
    }
  }
  return [...seen.entries()]
    .map(([blocker, units]) => ({
      id: `W319::${blocker}`,
      what: `${units.length === 1 ? "a row" : `${units.length} rows`} wait on ${blocker}: ${units.join(", ")}`,
      // A GATE AND A DECISION END DIFFERENTLY, and only one of them ends readably. Section 4
      // defines the gates and strikes one through when it is cleared, so a gate's ending is a
      // thing this tree can look at. A founder DECISION is recorded in a gate dossier as a
      // question, and nothing marks the day it is answered — so it is held as unobservable and
      // says so, rather than as a gate lookup that returns false for a gate section 4 never had.
      ending: /^G\d+$/.test(blocker)
        ? ({ kind: "gate_ruled", gate: blocker } as const)
        : ({
            kind: "unobservable",
            why: `${blocker} is a founder DECISION rather than a gate. Section 4 defines the gates and strikes through the cleared ones, so a gate's ending is readable from the plan; a decision is a question recorded in a gate dossier and nothing in this tree marks the day it is answered. Making it readable means the dossier carrying an answer field, which is W335's subject and not a widening of this scan.`,
          } as const),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Everything this tree is waiting on, from every register that holds any. */
export function allEndings(
  root: string,
  registers: readonly EndingRegister[] = ENDING_REGISTERS,
): SelfEnding[] {
  return [...registers.flatMap((r) => r.entries()), ...ledgerEndings(root)].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
}

/** Whether the thing a declaration waits for has happened. */
export function hasEnded(root: string, ending: Ending): boolean {
  if (ending.kind === "unit_lands") {
    const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
    return parseLedgerRows(ledger).some((r) => r.id === ending.unit && r.status === "done");
  }
  if (ending.kind === "gate_ruled") {
    const plan = readFileSync(path.join(root, "docs/FIVE-YEAR-PLAN.md"), "utf8");
    const id = ending.gate.replace(/^FOUNDER GATE /, "");
    return parseGates(plan).some((g) => g.id === id && g.status === "cleared");
  }
  if (ending.kind === "unobservable") return false;
  return ending.built(root);
}

/**
 * An ending naming something the tree does not hold, so nothing could ever read it.
 *
 * W318'S FINDING CLASS, GENERALISED. Q23-SIMP-1 was deferred to `W299+` — a range, in a field that
 * took any string — and outlived its answer by seventeen units because no moment could arrive to
 * read it. A predicate that returns false forever is indistinguishable from a wait that is still
 * waiting, which is why an event pointing at nothing is reported here rather than left to be false.
 */
export function unreadableEndings(
  root: string,
  registers: readonly EndingRegister[] = ENDING_REGISTERS,
): string[] {
  const ledger = readFileSync(path.join(root, "BUILD-STATE.md"), "utf8");
  const rows = new Set(parseLedgerRows(ledger).map((r) => r.id));
  const plan = readFileSync(path.join(root, "docs/FIVE-YEAR-PLAN.md"), "utf8");
  const gates = new Set(parseGates(plan).map((g) => g.id));
  return allEndings(root, registers)
    .flatMap((e) => {
      if (e.ending.kind === "unit_lands" && !rows.has(e.ending.unit)) {
        return [`${e.id} waits on ${e.ending.unit}, which the ledger does not hold`];
      }
      if (e.ending.kind === "gate_ruled" && !gates.has(e.ending.gate.replace(/^FOUNDER GATE /, ""))) {
        return [`${e.id} waits on ${e.ending.gate}, which section 4 does not define`];
      }
      return [];
    })
    .sort();
}

/**
 * Every declaration whose event has already happened — the build failure this unit exists for.
 *
 * ONE LINE PER DECLARATION AND NOT A COUNT, because the remedy is per declaration: somebody reads
 * the thing that was waiting, decides whether it still holds, and either rewrites it or removes it.
 */
export function endedDeclarations(
  root: string,
  registers: readonly EndingRegister[] = ENDING_REGISTERS,
): string[] {
  return allEndings(root, registers)
    .filter((e) => hasEnded(root, e.ending))
    .map((e) => `${e.id} waited on ${eventInWords(e.ending)}, which has happened: ${e.what}`)
    .sort();
}

/** The event in a reader's words, for the sentence a failure prints. */
export function eventInWords(ending: Ending): string {
  if (ending.kind === "unit_lands") return `${ending.unit} landing`;
  if (ending.kind === "gate_ruled") return `${ending.gate} being ruled on`;
  if (ending.kind === "unobservable") return "something this tree cannot observe";
  return `a remedy for ${ending.reads}`;
}

/**
 * The discriminants this tree spells a wait with, listed rather than guessed.
 *
 * Three, and the third is why the list is data. `deferred` and `pending` were the obvious pair;
 * running the derivation reported `bounds.ts` as a register holding waits the scan could not see,
 * because W306 spells a wait `lifting: { kind: "remedy" }`. A vocabulary assembled from the two
 * cases in mind would have been wrong on the third, and the register that caught it was this one's
 * own stale arm — which is the argument for both directions in one line.
 *
 * `remedy_built` and the other kinds named in this module do not match: the pattern closes the
 * quote, so a longer discriminant is a different word.
 */
export const WAIT_DISCRIMINANTS = /\bkind:\s*"(?:deferred|pending|remedy)"/;

/** A module constructing a declaration that waits, keyed to whether this register knows about it. */
export function waitingModules(root: string): string[] {
  return typescriptFiles(root)
    .map((f) => ({ rel: path.relative(root, f).split(path.sep).join("/"), source: readFileSync(f, "utf8") }))
    .filter(({ rel }) => !rel.endsWith(".test.ts"))
    // THE RAW SOURCE, DELIBERATELY. The marker is a discriminant in an object literal, so blanking
    // literals would erase every declaration and leave the scan reporting nothing at all. What the
    // shape does instead is separate CONSTRUCTION from comparison: `kind: "deferred"` builds one and
    // `=== "deferred"` reads one, and a register that only reads them is not a register that waits.
    .filter(({ source }) =>
      WAIT_DISCRIMINANTS.test(prepareForScan(source, { comments: "subtracted", literals: "kept" })),
    )
    .map(({ rel }) => rel)
    .sort();
}

/**
 * A module whose only wait is a FIXTURE — a probe built to drive a check, not a thing being waited on.
 *
 * W307'S COLLISION AGAIN, in a register that reads discriminants instead of prose. `W323` builds a
 * bound-shaped probe inside a driver so `liftedDefects` has something to answer about, and the
 * probe carries `kind: "remedy"` because that is what it is imitating. Nothing waits on it and
 * nothing ever ends. Declared rather than pattern-matched away: telling a top-level register from
 * an object built inside a function needs a parser, and an exception a reader can check is worth
 * more than a heuristic that would be wrong about the next one differently.
 *
 * Both directions. An entry here for a module that has stopped constructing a wait is reported by
 * `endingDiff.stale`, so this list can only shrink by somebody removing a fixture.
 */
export const WAIT_FIXTURES: Readonly<Record<string, string>> = {
  "src/quality/blind-spots.ts":
    "Plants a wait spelled as a typed discriminant beside the same wait spelled as a sentence, so W330's own blind spot can be demonstrated rather than asserted. The probe body is a string handed to a constructed tree; the module holds no declaration of its own and nothing in it is waiting. It arrived in this list the moment the blind-spot probe was written, which is the tax the rule charges and the reason the rule is worth having.",
  "src/quality/assertion-drives.ts":
    "Builds a bound-shaped probe with a `remedy` lifting arm so W306's `liftedDefects` has an input to answer about. The probe's `stillOpen` is a constant and its remedy is `a remedy nobody wrote` — it is the shape of a wait, presented to a check, and there is nothing behind it for anybody to be waiting on.",
};

export interface EndingDiff {
  /** A module that constructs a waiting declaration and is in no register here. */
  unregistered: string[];
  /** A register naming a module the tree no longer holds. */
  stale: string[];
}

/** Both directions, so a fifth register of waits cannot arrive quietly or leave quietly. */
export function endingDiff(
  root: string,
  registers: readonly EndingRegister[] = ENDING_REGISTERS,
  fixtures: Readonly<Record<string, string>> = WAIT_FIXTURES,
): EndingDiff {
  const known = new Set(registers.map((r) => r.module));
  const found = waitingModules(root);
  // TWO KINDS OF STALE, AND THEY ARE NOT THE SAME KIND. A register whose module currently spells no
  // wait is a register that has ANSWERED everything it was waiting on — the outcome this unit
  // exists to produce — so it goes stale only when the module itself is gone. A FIXTURE is the
  // opposite: it excuses a module for spelling a wait that is not one, and the day the module stops
  // spelling it the excuse is a claim about nothing. The first draft used one rule for both, and
  // reported `hardening-q24.ts` the moment W330 answered its last deferral.
  return {
    unregistered: found.filter((m) => !known.has(m) && !(m in fixtures)).sort(),
    stale: [
      ...[...known].filter((m) => !m.endsWith(".md")).filter((m) => !existsSync(path.join(root, m))),
      ...Object.keys(fixtures).filter((m) => !found.includes(m)),
    ].sort(),
  };
}

/** What this does not prove. */
export const ENDING_BOUND =
  "The derivation finds a declaration that waits only where the wait is a TYPED discriminant — " +
  "`kind: \"deferred\"` or `kind: \"pending\"` in an object literal. A wait written as prose is " +
  "invisible to it, and prose is how the worst instance of this was written: Q23-SIMP-1 said " +
  "`W299+`, a range, in a field that took any string, and it outlived its answer by most of a " +
  "quarter precisely because nothing could read it. W318 closed that particular door by typing the " +
  "field, so the class is narrower than it was — but a sentence in a header saying a thing holds " +
  "until some unit lands is still a declaration with an event in it and still nothing reads it. " +
  "What would find those is a reading of prose against the ledger, which is W314's machinery " +
  "pointed at a different vocabulary and is a unit rather than a widening of this scan. Nor does " +
  "ending a declaration say what should replace it: this reports that somebody must look, names " +
  "what they are looking at, and stops there, because whether a deferred finding still matters " +
  "after its unit landed is a judgement and not a derivation.";

// W394: the name conventions a register rests on, enumerated.
//
// A DERIVATION THAT KEYS ON A NAME IS KEYED TO A HABIT. This tree derives most of what it knows by
// reading its own source, and several of those derivations turn on an IDENTIFIER rather than on a
// type or a structure: a repository write is one whose path is built from a constant called `ROOT`,
// a guarded panel is a parameter called `eligible`, a register-size constant is one whose name ends
// `_AT_W<n>`. Each of those is a convention this tree chose. None of them is enforced by anything,
// and a file that spells the same thing differently is not reported as wrong — it is not seen.
//
// THAT IS W366'S CLASS AT A DIFFERENT GRAIN, and the difference is worth stating. W366 is about a
// detector keyed to how its SUBJECT is written — a parse spelled `startsWith` instead of `/^\|`.
// This is about a detector keyed to how the CODE AROUND its subject is written: the subject is a
// repository write however the constant is named, and the name is the only thing the scan can see.
// A register in that position cannot report its own blind spot, because the thing it would report
// is the thing it cannot find.
//
// SO EACH ONE CARRIES ITS CONVENTION AND ITS COST. `rests` is the identifier; `costs` says what a
// file spelling it otherwise would get away with, in the words of the register that would have
// caught it. One is DRIVEN rather than argued — the other spelling is planted and the derivation
// is shown missing it — because a cost nobody has measured is a guess about a scan.
//
// WHAT THIS DOES NOT PROVE is `CONVENTION_BOUND`, exported below and read by W297's register.
//
// NOTHING IS IMPORTED THAT REACHES `bounds.ts` AT EVALUATION, per W367 and W381: the derivations
// are named as TEXT and resolved against the tree, and the one probe builds its own input.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own source.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sourceModules } from "./tree-walks";
import { prepareForScan } from "./scan-text";
import { orderDependent } from "./shared-state";

/** How a convention was established as costing something. */
export type Cost =
  /** The other spelling was planted and the derivation missed it. Measured, not argued. */
  | { kind: "measured"; probe: (root: string) => Missed }
  /** Argued from the register's own bound, which already admits the gap in writing. */
  | { kind: "admitted"; quote: string };

/** What a probe found when the other spelling was planted. */
export interface Missed {
  /** The derivation sees the CONVENTIONAL spelling. A probe that misses this proves nothing. */
  sawTheConvention: boolean;
  /** And does not see the same thing spelled otherwise. That is the cost. */
  sawTheOtherSpelling: boolean;
}

export interface NameConvention {
  /** `module::export`, resolved against the tree before anything is claimed about it. */
  derivation: string;
  /** The identifier the derivation turns on, exactly as the code spells it. */
  rests: string;
  /** What a file spelling it otherwise gets away with, in the register's own terms. */
  costs: string;
  cost: Cost;
}

export interface ConventionDefect {
  derivation: string;
  what: string;
}

/** Whether `module::export` names something this tree really exports. */
export function resolvesInTree(root: string, derivation: string): boolean {
  const [file, name] = derivation.split("::");
  if (!file || !name) return false;
  const full = path.join(root, file);
  if (!existsSync(full)) return false;
  return new RegExp(`(?:export )?(?:function|const) ${name}\\b`).test(readFileSync(full, "utf8"));
}

/**
 * Every module whose scanning code spells one of the declared conventions.
 *
 * THE SECOND DIRECTION, and the only one that can grow on its own. A convention is declared here
 * with the ONE derivation this unit read; the same identifier keyed on somewhere else is a second
 * register resting on the same habit, and it arrives without anybody editing this file. Comments
 * are subtracted first — a module explaining that `ROOT` is a convention is not a module keyed to
 * it, which is the collision `prepareForScan` exists for and the one this register would otherwise
 * report against itself.
 */
export function conventionSites(root: string, name: string): string[] {
  const keyed = new RegExp(String.raw`(?:RegExp\(|/[^/\n]*)\\b${name}\\b|["']${name}["']|\\s\*${name}\\s\*`);
  const out: string[] = [];
  for (const file of sourceModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = prepareForScan(readFileSync(file, "utf8"), { literals: "kept" });
    if (keyed.test(code)) out.push(rel);
  }
  return out.sort();
}

/**
 * Where the register and the tree disagree, in four directions.
 *
 * The one that matters is the last: a derivation naming a convention it does not spell has been
 * rewritten, and the row describing its cost is describing something that is no longer there.
 */
export function conventionDefects(
  root: string,
  declared: readonly NameConvention[] = CONVENTIONS_AT_W394,
): ConventionDefect[] {
  const out: ConventionDefect[] = [];
  for (const row of declared) {
    if (!resolvesInTree(root, row.derivation)) {
      out.push({ derivation: row.derivation, what: "names something this tree does not hold" });
      continue;
    }
    if (row.costs.length < 120) {
      out.push({ derivation: row.derivation, what: "rests on a convention and does not say what it costs" });
    }
    const [file] = row.derivation.split("::");
    const code = prepareForScan(readFileSync(path.join(root, file!), "utf8"), { literals: "kept" });
    if (!new RegExp(String.raw`\b${row.rests}\b`).test(code)) {
      out.push({
        derivation: row.derivation,
        what: `is recorded as resting on ${row.rests} and no longer spells it`,
      });
      continue;
    }
    if (row.cost.kind === "measured") {
      const missed = row.cost.probe(root);
      if (!missed.sawTheConvention) {
        out.push({ derivation: row.derivation, what: "cannot see its own convention, so the probe proves nothing" });
      }
      if (missed.sawTheOtherSpelling) {
        out.push({ derivation: row.derivation, what: "is recorded as missing the other spelling and finds it" });
      }
    } else if (!code.includes(row.cost.quote.slice(0, 40))) {
      out.push({ derivation: row.derivation, what: "quotes an admission its module does not make" });
    }
  }
  return out.sort((a, b) => `${a.derivation}${a.what}`.localeCompare(`${b.derivation}${b.what}`));
}

export const CONVENTIONS_AT_W394: readonly NameConvention[] = [
  {
    derivation: "src/quality/shared-state.ts::repositoryWrites",
    rests: "ROOT",
    costs:
      "A test file that writes into the repository is order-dependent with every other file writing the same path, which is what W385 exists to report. This scan finds such a write by matching `path.join(ROOT, \"…\")` — so a suite that calls its own root constant `REPO`, or `repoRoot`, or takes it as a parameter, writes to exactly the same place and is not reported as clashing with anything. It is not reported as unreadable either: it is simply not in the population, and the register's answer looks the same as it would if the file did not exist.",
    cost: {
      kind: "measured",
      probe: (root) => {
        void root;
        const write = (constant: string): string =>
          'import { writeFileSync } from "node:fs";\nimport path from "node:path";\n' +
          `const ${constant} = process.cwd();\n` +
          `export const go = () => writeFileSync(path.join(${constant}, "shared.json"), "x");\n`;
        const clash = (constant: string): number =>
          orderDependent(root, [
            { module: "src/planted/w394-a.test.ts", source: write(constant) },
            { module: "src/planted/w394-b.test.ts", source: write(constant) },
          ]).length;
        return { sawTheConvention: clash("ROOT") > 0, sawTheOtherSpelling: clash("REPO") > 0 };
      },
    },
  },
  {
    derivation: "src/quality/decision-moments.ts::decisions",
    rests: "GUARDED_NAMES",
    costs:
      "W387's register reports a rule that takes an ALREADY-GUARDED set and decides at its own instant, which is a patient being messaged on Friday against a rule that admitted them on Monday. What makes a set guarded is the PARAMETER'S NAME — `eligible`, `candidates`, `batch`, `shortlist` — so a rule taking the same filtered panel as `patients`, `people` or `panel` is outside the population, and the defect it might carry is a message to somebody the product's own rule says should not get one.",
    cost: {
      kind: "admitted",
      quote: "STILL NOT A DERIVATION. `eligible` is what this tree calls a filtered panel",
    },
  },
  {
    derivation: "src/quality/pins.ts::PIN_NAME",
    rests: "_AT_W",
    costs:
      "W290's register classifies every pinned constant in the tree and W304 re-derives it, so a constant holding a register's size is either argued as live-by-design or reported. What makes a constant a pin is its NAME ending `_AT_W<n>` — a figure frozen at a unit — so the same list named `KNOWN_MODULES` or `CURRENT_SITES` is not classified, not reported and not re-derived, and the number in it can be retyped by anybody.",
    cost: {
      kind: "admitted",
      quote: "export const PIN_NAME",
    },
  },
  {
    derivation: "src/quality/spelling-markers.ts::PROBE_FILE",
    rests: "spelling-probe",
    costs:
      "W366's register plants two spellings of a detector's subject and asks whether the detector saw each. It decides that it DID by looking for the planted file's name in the answer — `JSON.stringify(answer).includes(\"spelling-probe\")` — so a detector that reports the planted module under any other key, an id, a line, a normalised path, reads as blind when it is not. The cost runs the other way from the rows above: this convention manufactures findings rather than hiding them, and a `blind` row that is really a reporting-shape mismatch is a sentence about the tree that is not true.",
    cost: {
      kind: "admitted",
      quote: "export const PROBE_FILE",
    },
  },
];

/** What a green register does not prove. */
export const CONVENTION_BOUND =
  "THE POPULATION IS HAND-READ AND THAT IS THE WHOLE WEAKNESS. Four derivations are here because " +
  "one reader went looking for them; a fifth register resting on a fifth habit is not reported " +
  "missing, because deriving `this comparison turns on a NAME rather than on a structure` is the " +
  "problem itself in another form — every scan in this tree matches literals, and a scan that " +
  "found the name-keyed ones would be keyed to how THEY are written. `conventionSites` grows the " +
  "second direction and only for a name already declared: it finds a SECOND register keyed to " +
  "`ROOT`, never a first one keyed to something nobody has named. AND A COST IS MOSTLY ARGUED. " +
  "One row is measured — the other spelling planted, the derivation shown missing it — and three " +
  "quote their own module's admission, which is a register agreeing with itself. What separates " +
  "the two is exactly whether somebody wrote the probe, not whether the gap is real, and the " +
  "three unmeasured costs would each take a planted tree of their own. THE COSTS DO NOT ALL RUN " +
  "THE SAME WAY, which is worth saying because a register of blind spots reads as though they do: " +
  "three of these hide a finding and the fourth MANUFACTURES one, and a `blind` row that is " +
  "really a reporting-shape mismatch is a false sentence about the tree rather than a missing " +
  "true one.";

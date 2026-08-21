// W375: the /tmp residue nothing reads.
//
// EVERY REGISTER THAT COULD HAVE NOTICED WATCHES THE REPOSITORY. W328's `repository-clean.ts` asks
// what a run left in the working tree and answers at the one moment that sees all of it; the system
// temp directory is named nowhere in it. So the residue that actually accumulates — tree copies and
// planted roots under `/tmp` — has been found twice by a person reading a disk and never once by
// this tree: W331 at 426 copies and 3.6 GB, W360 at 182 and 2.0 GB. Both times the finding was that
// a mechanism built to reclaim could not reach the case it was built for.
//
// THE CASE IS ALWAYS THE SAME ONE: A RUN THAT WAS KILLED. A run that finishes cleans up after
// itself several times over — a `finally` per probe, an exit handler per process, a teardown per
// run. None of those is reached by a run that is interrupted, and an interrupted run is not an
// exotic state here: this loop kills `pnpm verify` whenever a session is restarted or a sweep is
// abandoned, and W360's two gigabytes came from a single day of it.
//
// WHAT W375 CHANGED, both fixes rather than records:
//
//   - `withTree`'s directories were named `plant-` with no maker in them. Nothing could reclaim
//     one, ever, because nothing could tell an abandoned root from a live sibling's — the exact
//     distinction W343 gave the tree copies and left these without. They now carry the pid.
//
//   - The sweep ran at TEARDOWN ONLY, which is the hook an interrupted run never reaches. Residue
//     from a killed run therefore sat through the whole of the next run, and through the one after
//     that if it was killed too. It now runs at SETUP as well: a dead maker's directory is
//     reclaimable at any instant, so the earliest moment is the right one.
//
// AND THE REGISTER IS THE THIRD THING, because two fixes in a harness are exactly the shape that
// gets undone by somebody tidying a hook. Every removal site in this tree is derived — an `rmSync`
// under `src/`, plus the harness file, attributed to the function that holds it — and each carries
// what a KILLED run leaves there and what reclaims it afterwards. A site arriving with no row
// fails; a row naming a caller that has stopped calling it fails.
//
// WHAT THIS DOES NOT PROVE is `TEMP_RESIDUE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own source text and the harness.
// It removes nothing itself and touches no directory outside a probe of its own making.

import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/**
 * The harness file, which is outside `src/` and therefore outside every walk.
 *
 * Declared rather than walked, and the argument is the one `vitest.global-setup.ts` makes about
 * itself: it is configuration rather than a module of the product, and a census row for it would
 * describe a hook as a register. Naming it here is the smallest thing that keeps it in a
 * population it belongs to.
 */
export const HARNESS_FILE = "vitest.global-setup.ts";

/** One place this tree removes something it made. */
export interface ReclamationSite {
  /** The file, as the tree spells it. */
  file: string;
  /** The function holding the removal. */
  fn: string;
}

/** The function a line sits inside, by walking declarations from the top. */
function enclosing(lines: readonly string[], index: number): string {
  let fn = "<top>";
  for (let i = 0; i <= index; i += 1) {
    const m = /^(?:export )?(?:function|const) (\w+)/.exec(lines[i]!);
    if (m) fn = m[1]!;
  }
  return fn;
}

/** Every place this tree removes a directory or a file it made. Derived, not listed. */
export function reclamationSites(root: string): ReclamationSite[] {
  const files = [
    ...sourceModules(root).map((f) => path.relative(root, f).split(path.sep).join("/")),
    HARNESS_FILE,
  ];
  const out: ReclamationSite[] = [];
  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(path.join(root, file), "utf8");
    } catch {
      continue;
    }
    // COMMENTS THEN LITERALS, the same order and for the same reason as `callersOf`: a register
    // that plants `rmSync(...)` as a probe string would otherwise be reported as removing something
    // itself, and W366's spelling register is exactly such a planter. Both transforms preserve the
    // line count, which is what `enclosing` walks.
    const lines = prepareForScan(source).split("\n");
    lines.forEach((line, index) => {
      if (!/\brmSync\s*\(/.test(line)) return;
      out.push({ file, fn: enclosing(lines, index) });
    });
  }
  return out
    .filter((s, i) => out.findIndex((o) => o.file === s.file && o.fn === s.fn) === i)
    .sort((a, b) => `${a.file}::${a.fn}`.localeCompare(`${b.file}::${b.fn}`));
}

/**
 * Which named functions in a file call another one.
 *
 * COMMENTS THEN LITERALS, which is `prepareForScan` and its stated order. Two drafts of this got
 * it wrong in two different ways. Reading raw source, `withPlantedIn`'s refusal message — "Plant
 * into `copyTree(root)` instead" — was read as `refuseTheRepository` calling `copyTree`. Blanking
 * literals WITHOUT subtracting comments first was worse: the harness explains itself with backticked
 * names in prose, `blankLiterals` took the first of those as an unterminated template literal, and
 * everything after it went blank — so `sweepTreeCopies` looked like it was called from nowhere at
 * all, which is the shape of a scan that reports a clean tree because it stopped reading.
 */
export function callersOf(source: string, fn: string): string[] {
  const lines = prepareForScan(source).split("\n");
  const out = new Set<string>();
  lines.forEach((line, index) => {
    if (!new RegExp(`\\b${fn}\\s*\\(`).test(line)) return;
    if (/^\s*(\/\/|\*)/.test(line)) return;
    const holder = enclosing(lines, index);
    if (holder !== fn) out.add(holder);
  });
  return [...out].sort();
}

export interface Reclamation {
  /** `file::fn`, as `reclamationSites` spells it. */
  site: string;
  /** The functions that reach it, resolved against the file rather than believed. */
  reachedFrom: readonly string[];
  /** What a run KILLED at that moment leaves behind. The honest half of every row. */
  afterKill: string;
}

export interface ResidueDefect {
  site: string;
  what: string;
}

/**
 * Every place this tree reclaims what it made, with what survives a kill.
 *
 * `reachedFrom` is the part a machine checks: the callers are re-derived from the file on every
 * run, so a hook somebody tidies out of `setup` fails here rather than showing up as a full disk a
 * quarter later.
 */
export const RECLAMATION_AT_W375: readonly Reclamation[] = [
  {
    site: "src/quality/blind-spots.ts::BLIND_SPOTS",
    // `<top>`, because nothing NAMES this site: the removal sits inside a probe closure stored in
    // the record, and `falseBounds` and `deadProbes` reach it as `b.probe()` off a value. A caller
    // list resolved against the file finds none, and saying so is truer than naming the two.
    reachedFrom: ["<top>"],
    afterKill:
      "W388's blind-spot probe copies the tree, because a citation names a real test file and resolves against it — a root holding only the probe reports every citation unresolved and the control never fires. Killed mid-probe the copy survives with the maker's pid in its name, so the next run's setup sweep reclaims it. The `finally` here covers a probe that throws, which is the ordinary case and not the one that filled `/tmp`.",
  },
  {
    site: "src/quality/close-gate.ts::breaksOnClose",
    reachedFrom: ["closeGateDefects"],
    afterKill:
      "The tree copy this check runs the closing ledger against. Killed mid-check it survives with the maker's pid in its name, so the next run's setup sweep reclaims it — which is the whole reason the copy is named that way rather than by the clock.",
  },
  {
    site: "src/quality/closing-state.ts::boundsStaleOnClose",
    reachedFrom: ["CLOSING_CHECKS"],
    afterKill:
      "The same shape one register over: a `copyTree` result removed in a `finally`. A kill leaves it, and it is reclaimed by a later run's sweep on the dead-maker rule rather than by anything this module does.",
  },
  {
    site: "src/quality/instant.ts::instantDiff",
    reachedFrom: [],
    afterKill:
      "A tree copy for the instant-controls comparison, removed in a `finally`. A kill leaves it; the dead-maker sweep reclaims it later. Nothing here is special except that three registers reached for the same harness, which is why the sweep is the harness's job and not each caller's.",
  },
  {
    site: "src/quality/planting.ts::copyTree",
    reachedFrom: [],
    afterKill:
      "EVERY COPY THIS PROCESS MADE. The handler is registered with `process.once(\"exit\")`, which vitest's worker THREADS never fire — the thread ends and the process does not — and no signal fires it either. This is the site that has been found twice by a person reading a disk, and what makes the residue reclaimable at all is the pid in the name rather than this handler.",
  },
  {
    site: "src/quality/planting.ts::withPlantedIn",
    reachedFrom: [],
    afterKill:
      "The files it wrote into a root somebody else owns. A kill leaves them, and NOTHING reclaims them: they are plain files at declared paths rather than a directory carrying a maker, so W328's repository check reports them at the end of the next run instead — which is the right answer, because a file left inside the repository is a state a person has to see rather than one a sweep should silently undo.",
  },
  {
    site: "src/quality/planting.ts::withTree",
    reachedFrom: [],
    afterKill:
      "The throwaway root the probe ran in. A kill leaves it, and until W375 nothing could ever reclaim it — the name carried no maker, so no later run could tell it from a live sibling's. It now carries the pid and the dead-maker sweep takes it.",
  },
  {
    site: "vitest.global-setup.ts::sweepTreeCopies",
    reachedFrom: ["setup", "teardown"],
    afterKill:
      "Nothing: this IS the reclamation, and a kill simply means it does not run. That is why it is reached from `setup` as well as `teardown` — the residue a killed run leaves is reclaimed by the NEXT run before that run does its work, rather than after it finishes and only if it finishes.",
  },
];

/**
 * Where the register and the tree disagree, in four directions.
 *
 * The caller arm is the one this unit is built around: `sweepTreeCopies` reached only `teardown`
 * for a quarter, and the sentence describing it said what it was for rather than when it ran.
 */
export function residueDefects(
  root: string,
  declared: readonly Reclamation[] = RECLAMATION_AT_W375,
): ResidueDefect[] {
  const population = reclamationSites(root);
  const bySite = new Map(declared.map((d) => [d.site, d]));
  const out: ResidueDefect[] = [];

  for (const { file, fn } of population) {
    const site = `${file}::${fn}`;
    const row = bySite.get(site);
    if (row === undefined) {
      out.push({ site, what: "removes something and nothing says what a killed run leaves there" });
      continue;
    }
    if (row.afterKill.length < 120) {
      out.push({ site, what: "is recorded without an argument about what survives a kill" });
    }
    const source = readFileSync(path.join(root, file), "utf8");
    const callers = callersOf(source, fn);
    for (const named of row.reachedFrom) {
      if (named !== "<top>" && !callers.includes(named)) {
        out.push({ site, what: `is recorded as reached from ${named}, which does not call it` });
      }
    }
    for (const caller of callers) {
      if (!row.reachedFrom.includes(caller)) {
        out.push({ site, what: `is reached from ${caller} and the row does not say so` });
      }
    }
  }
  const live = new Set(population.map((s) => `${s.file}::${s.fn}`));
  for (const { site } of declared) {
    if (!live.has(site)) out.push({ site, what: "is recorded here and removes nothing in this tree" });
  }
  return out.sort((a, b) => `${a.site}${a.what}`.localeCompare(`${b.site}${b.what}`));
}

/** What this register does not prove. */
export const TEMP_RESIDUE_BOUND =
  "IT READS WHERE A REMOVAL IS WRITTEN, NOT WHETHER ANYTHING IS LEFT. Nothing here lists a " +
  "directory, measures a disk or opens `/tmp`: a green run says every removal site in this tree " +
  "carries a sentence about what a kill leaves and is reached from the functions its row names, " +
  "which is a claim about the source and not about the box. The residue this unit exists for would " +
  "be invisible to it on a machine holding a hundred abandoned copies. THE POPULATION IS " +
  "`rmSync` — a removal written with `fs/promises`, with `rm`, or by shelling out is outside it " +
  "entirely, which is the same gap W303's planting register names about writes. AND THE SWEEP IT " +
  "DESCRIBES IS NOT DRIVEN HERE: `reclaimableCopies` decides what may go and W360's suite drives " +
  "it, so what this adds is that the decision is now REACHED at a moment an interrupted run's " +
  "successor gets to. That the sweep then runs on a real box, against a real interrupted run's " +
  "residue, is measured by nothing in this tree and was measured by a person on both occasions. " +
  "WHAT WOULD CLOSE THAT is a check that lists the temp directory and reports what it finds, which " +
  "is a different instrument from every register here: they all read source, and the thing that " +
  "accumulates is on a disk.";

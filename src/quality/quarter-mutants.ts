// W332: the quarter's own modules, mutated — all of them, not a sample.
//
// W296 SAMPLES AT ONE IN THIRTY-SEVEN, and that is the right policy for a tree of seventeen hundred
// mutation sites: a full run is a different kind of job and the sample is drawn by arithmetic so
// nobody chooses it. What the policy cannot do is say anything about a QUARTER. Q25 added six
// modules holding sixty-eight mutation sites between them when W332 measured it, and the sampler
// drew ONE. That is not a measurement of anything — the standing register's answer about a whole
// quarter's new work was a single mutant, and it would have read as coverage.
//
// SO THIS RUNS EVERY MUTANT IN EVERY MODULE THE QUARTER ADDED. "Added" is derived rather than
// listed: a module whose header names a unit in the range, which is W281's rule already enforced
// everywhere. Six modules for thirteen units is what W332 found, because most of Q25 EXTENDED
// registers that already existed — and that ratio is itself worth knowing, since a quarter of
// extensions is a quarter whose new code the sampler was already covering through its old suites.
//
// THE REGISTER IS W296'S. `Survivor`, `SurvivorReason` and `samplingReport` are imported rather
// than restated: a survivor is a survivor, the four kinds are the same four, and a second set of
// them would be the duplication W301 spent a unit removing. What is new here is the POPULATION and
// the runner it needs.
//
// AND THE RUNNER TAKES ITS EXECUTOR. W296's note says the runner spawns processes and belongs in
// the test, and that is why its loop is welded inside one — W289's finding, in the module that
// records W289's finding. Injecting the executor costs one parameter and buys the thing the welded
// version cannot have: the loop is driven here on a suite that fails and one that does not, with no
// process spawned, so a planted survivor is reported without a hundred seconds of subprocess.
//
// WHAT THIS DOES NOT PROVE is `QUARTER_MUTANT_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Mutants are applied inside a copied tree.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sourceModules } from "./tree-walks";
import { headerUnit } from "./unit-headers";
import {
  type Mutant,
  type Survivor,
  allMutants,
  applyMutant,
  mutantId,
  sampleMutants,
  siblingSuite,
} from "./mutation-sampling";

/**
 * The quarter this unit measured, as at W332.
 *
 * A RANGE RATHER THAN A LIST OF MODULES, so the derivation stays a derivation: naming the six would
 * make this register a copy of the answer, and the whole reason the population is derived is that
 * Q25's own horizon could not have known which modules the quarter would add.
 */
export const QUARTER_AT_W332 = { first: 313, last: 325 } as const;

/** Every module whose header names a unit in the range — the modules the quarter ADDED. */
export function quarterModules(
  root: string,
  first: number = QUARTER_AT_W332.first,
  last: number = QUARTER_AT_W332.last,
): string[] {
  const out: string[] = [];
  for (const file of sourceModules(root)) {
    const unit = headerUnit(readFileSync(file, "utf8"));
    if (unit === null || unit < first || unit > last) continue;
    out.push(path.relative(root, file).split(path.sep).join("/"));
  }
  return out.sort();
}

/** Every mutant in those modules. Not sampled — that is the unit. */
export function quarterMutants(
  root: string,
  modules: readonly string[] = quarterModules(root),
): Mutant[] {
  const wanted = new Set(modules);
  return allMutants(root).filter((m) => wanted.has(m.module));
}

/**
 * What the standing sampler would have drawn from this population.
 *
 * THE FINDING, MEASURED RATHER THAN ASSERTED. The header says the sampler drew a rounding error
 * over this quarter's work; this is the call that says so, and the suite checks it against the full
 * population, so the sentence cannot drift from the arithmetic the way W293's header did.
 */
export function sampledShare(root: string, modules: readonly string[] = quarterModules(root)): Mutant[] {
  const wanted = new Set(modules);
  const readModule = (module: string) => readFileSync(path.join(root, module), "utf8");
  return sampleMutants(allMutants(root), readModule).filter((m) => wanted.has(m.module));
}

/** A module the quarter added with no sibling suite — nothing can catch anything in it. */
export function quarterModulesWithNoSuite(root: string): string[] {
  return quarterModules(root)
    .filter((m) => siblingSuite(root, m) === null)
    .sort();
}

/** Reading and writing the tree under mutation, injected so the loop can be driven off disk. */
export interface MutantIo {
  read: (file: string) => string;
  write: (file: string, contents: string) => void;
}

/** The real one. Named so the test that drives the loop does not have to write one inline. */
export const FILE_IO: MutantIo = {
  read: (file) => readFileSync(file, "utf8"),
  write: (file, contents) => writeFileSync(file, contents, "utf8"),
};

/**
 * Run each mutant against its own suite, returning the ones that survived.
 *
 * `run` throws when the suite fails, which is what CAUGHT means. BOTH THE RUNNER AND THE IO ARE
 * INJECTED, which is W289's remedy taken one step further than W296 could: its loop is welded
 * inside a test file, so the only way to watch it report a survivor is to spawn a hundred seconds
 * of subprocess. Handed a table and a map, the same loop answers in a millisecond and the planted
 * survivor is a test rather than a run.
 *
 * ASYNC, AND THAT COST A DETOUR WORTH RECORDING. A synchronous version was written so W295's
 * blind-spot probe — which must answer synchronously — could drive this loop directly. It could,
 * and then `execFileSync` in a loop blocked the worker's event loop for three minutes and vitest
 * raised `Timeout calling "onTaskUpdate"`: a suite that passes while the runner reports it cannot
 * be trusted to. The probe demonstrates the BOUND instead — the population clause, over a planted
 * header — which is what a blind spot is supposed to be about, and this stayed async.
 *
 * GROUPED BY MODULE so two sites in one file are never written at once, and the original is
 * restored in a `finally` — W303's rule, and the reason is the same as it was there: a throw part
 * way through leaves the tree mutated for everything after it.
 */
export async function runMutants(
  copy: string,
  mutants: readonly Mutant[],
  run: (suite: string) => Promise<void>,
  io: MutantIo = FILE_IO,
): Promise<string[]> {
  const byModule = new Map<string, Mutant[]>();
  for (const mutant of mutants) {
    byModule.set(mutant.module, [...(byModule.get(mutant.module) ?? []), mutant]);
  }
  const survivors: string[] = [];
  for (const [module, group] of byModule) {
    const file = path.join(copy, module);
    const original = io.read(file);
    try {
      for (const mutant of group) {
        io.write(file, applyMutant(original, mutant));
        let caught = false;
        try {
          await run(mutant.suite);
        } catch {
          caught = true;
        }
        if (!caught) survivors.push(mutantId(mutant, original));
      }
    } finally {
      io.write(file, original);
    }
  }
  return survivors.sort();
}

/**
 * The survivors of the full run over Q25's modules, each with its kind and its argument.
 *
 * W296'S TYPE, W296'S FOUR KINDS. A survivor is a question rather than a verdict — equivalent,
 * unreached, caught elsewhere, or a hole — and which one it is can only be settled by reading.
 */
export const SURVIVORS_AT_W332: readonly Survivor[] = [
  {
    id: 'src/quality/claim-classes.ts :: and-to-or :: return check !== undefined && check.run(row, root, "W900").length > 0;',
    reason: {
      kind: "unreached",
      why: "The guard's FALSE branch cannot be taken while `CLOSING_CHECKS` holds an entry with id `sha-shape`, and it does — so `check` is never undefined and no test can reach the line the mutant changes. Flipped to `||` the expression would throw rather than return false, which is a real difference over a state the tree does not have. The `check` is computed inside `reports` from an imported constant, so it cannot be injected either: reaching it means deleting `sha-shape` from W315's register, at which point W324's own `names an export the module does not have` arm fires first. Left as a guard rather than removed, because the alternative is code that assumes a register's contents.",
    },
  },
  {
    id: "src/quality/claim-classes.ts :: eq-to-neq :: const row = parseLedgerRows(ledger).find((r) => r.id === answer.by);",
    reason: {
      kind: "uncaught",
      remedy:
        "The `pending` arm looks up the row it waits on, and `===` flipped to `!==` returns the FIRST row with a different id — which for this ledger is a row that is also `done`, so the arm reports the same thing and the suite sees nothing. W324's test drives the arm with a `by` naming a unit the ledger has closed, and that single case cannot tell a correct lookup from any lookup that lands on a done row. REMEDY: drive the arm a second time with a `by` naming a row that is NOT done and assert silence — under the mutant that lookup finds some other row that IS done and reports, so the pair separates them. Left for W331, whose hardening pass over W313–W325 is in flight in a sibling session and owns this module's quarter.",
    },
  },
];

/** What a green full run does not prove. */
export const QUARTER_MUTANT_BOUND =
  "It runs W296's five operators, which is not the mutation space: a module can be riddled with " +
  "holes none of the five reaches, and this measures what these five found over one quarter's " +
  "modules. IT ALSO MEASURES ONLY THE MODULES A QUARTER ADDED, and Q25 added six for thirteen " +
  "units — most of its work EXTENDED registers that already existed, and every one of those " +
  "extensions is in a module whose header names an older unit, so it falls outside this population " +
  "and back into W296's sample. A quarter of extensions is therefore measured barely more than " +
  "before, and nothing here says so except this sentence. THE DERIVATION IS THE HEADER, so a " +
  "module whose header names the wrong unit is in the wrong quarter's population and no check can " +
  "tell — W281 resolves the unit against the ledger and says nothing about whether it is the unit " +
  "that wrote the file. AND A CAUGHT MUTANT IS NOT A TESTED LINE: the suite went red, which says " +
  "some assertion noticed, not that the assertion was about the thing that changed.";

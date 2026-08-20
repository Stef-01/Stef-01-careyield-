// W365: the population register — what every check in the census is over.
//
// A CHECK HAS THREE PARTS AND THIS TREE HAD REGISTERS FOR TWO. W267 asks whether the WALK has been
// shown a file arriving. W289 asks whether the ASSERTION has been driven to fail. W352 asks which
// way the whole thing fails when it does. What none of them holds is the POPULATION — the set the
// check is over — and Q28 spent thirteen units finding out that this is where the defects were.
//
// THE COMPARISON WAS RIGHT AND THE POPULATION WAS WRONG, nine times, by two builders. W353 named
// the widening case; W362's sweep over Q27 found its one survivor in exactly that shape. Three
// units in a row built the wrong population first and were caught only by driving it — a store walk
// that went THROUGH store modules, a zero census that counted every interpolation, a drive census
// that counted a function's own declaration as a call to itself. And the narrow direction is
// quieter still: a private-copy register whose marker was a regex SPELLING missed the eighth copy
// of a parse, and an exemption keyed per site was applied per file.
//
// SO THE POPULATION GETS A REGISTER, AND IT IS DERIVED RATHER THAN DESCRIBED. Every census member
// says where its set comes from — a walk this tree shares, its own recursion, or neither — and the
// row is RESOLVED against the module: a row naming `sourceModules` fails if the module does not
// call it, and a module that calls a walk the row does not name fails the other way. That is
// deliberately not an argument about whether the population is RIGHT; it is the smaller claim that
// nobody has to read the module to find out what it is over.
//
// WHAT THIS BUYS IS THE QUARTER'S OTHER TWELVE UNITS. A register of populations is what W366's
// spelling check, W367's narrow-claim check and W369's empty-population check each need to have a
// population of their own, which is the shape W267 established for walks and W289 for assertions.
//
// WHAT THIS DOES NOT PROVE is `POPULATION_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own census and source.

import { readFileSync } from "node:fs";
import path from "node:path";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import type { TreeDerivedRegister } from "./register-census";

/**
 * The walks this tree shares, by the name each is exported under.
 *
 * W282 MOVED THESE INTO ONE MODULE so each could be given a root, and W327 exported the skip list
 * so there would be one answer to what the tree IS. This list is the third thing that follows from
 * that: if the shared walks are the tree's populations, then naming which one a register uses is
 * naming its population.
 */
export const SHARED_WALKS: readonly string[] = [
  "dossierTestFiles",
  "exportedResetters",
  "filesUnder",
  "migrationFiles",
  "migrationSql",
  "modulesWithNoUnitHeader",
  "pageSpecFiles",
  "sourceModules",
  "storeModules",
  "testModules",
  "textFiles",
  "typescriptFiles",
  "verticalModules",
];

/** Where a register's set comes from. */
export type PopulationSource =
  /** One or more of the shared walks, called in the module. Resolved both ways. */
  | { kind: "shared_walk"; walks: readonly string[] }
  /** Its own `readdirSync` recursion, which W341 is the register for. */
  | { kind: "own_recursion" }
  /** Neither: the set is something other than a walk over files. Argued, so the class is not a bin. */
  | { kind: "not_a_walk"; why: string };

export interface Population {
  /** The census member, by file. */
  file: string;
  source: PopulationSource;
}

export interface PopulationDefect {
  file: string;
  what: string;
}

/** Which shared walks a module CALLS — a mention in an import list is not a population. */
export function walksCalled(root: string, file: string): string[] {
  let source: string;
  try {
    source = readFileSync(path.join(root, file), "utf8");
  } catch {
    return [];
  }
  return SHARED_WALKS.filter((walk) => new RegExp(`\\b${walk}\\s*\\(`).test(source)).sort();
}

/** Whether a module walks the tree itself. */
export function recursesItself(root: string, file: string): boolean {
  try {
    return /readdirSync\s*\(/.test(readFileSync(path.join(root, file), "utf8"));
  } catch {
    return false;
  }
}

/**
 * What each census member's population is, and where it comes from.
 *
 * ONE ROW PER MEMBER, DERIVED AND FROZEN. The rows were generated from the tree and are checked
 * back against it on every run, in both directions — which is the only reason a register this size
 * is worth having rather than a comment.
 */
export const POPULATIONS: readonly Population[] = [
  { file: "src/api/surface.test.ts", source: { kind: "own_recursion" } },
  { file: "src/capacity/copy-lint.test.ts", source: { kind: "own_recursion" } },
  { file: "src/capacity/coupling.test.ts", source: { kind: "own_recursion" } },
  { file: "src/compliance/copy-y6.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/compliance/surfaces.ts", source: { kind: "own_recursion" } },
  { file: "src/console/zero-meaning.ts", source: { kind: "shared_walk", walks: ["filesUnder"] } },
  { file: "src/credentials/vault.test.ts", source: { kind: "own_recursion" } },
  { file: "src/directory/dossier-claims.test.ts", source: { kind: "own_recursion" } },
  { file: "src/domain/schema-consistency.test.ts", source: { kind: "shared_walk", walks: ["migrationSql"] } },
  { file: "src/education/advice-lint.test.ts", source: { kind: "own_recursion" } },
  { file: "src/interop/credentials.test.ts", source: { kind: "own_recursion" } },
  { file: "src/lib/source-hygiene.test.ts", source: { kind: "shared_walk", walks: ["textFiles"] } },
  { file: "src/lib/stores.test.ts", source: { kind: "shared_walk", walks: ["exportedResetters"] } },
  { file: "src/messaging/send-path.test.ts", source: { kind: "own_recursion" } },
  { file: "src/privacy/automated-decisions.test.ts", source: { kind: "own_recursion" } },
  { file: "src/privacy/capacity-privacy.test.ts", source: { kind: "own_recursion" } },
  { file: "src/privacy/erasure-y5.test.ts", source: { kind: "own_recursion" } },
  { file: "src/privacy/outcomes-privacy.test.ts", source: { kind: "own_recursion" } },
  { file: "src/privacy/record-classes.test.ts", source: { kind: "shared_walk", walks: ["sourceModules", "storeModules"] } },
  { file: "src/quality/acceptances.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/assertion-vocabulary.ts", source: { kind: "shared_walk", walks: ["testModules"] } },
  { file: "src/quality/audit-y5.test.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/blind-spots.ts", source: { kind: "shared_walk", walks: ["textFiles"] } },
  { file: "src/quality/bounds.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles", "sourceModules"] } },
  { file: "src/quality/citations.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/close-gate.ts", source: { kind: "shared_walk", walks: ["sourceModules", "testModules"] } },
  { file: "src/quality/declaration-tax.ts", source: { kind: "shared_walk", walks: ["sourceModules", "testModules"] } },
  { file: "src/quality/defaulted-registers.ts", source: { kind: "shared_walk", walks: ["sourceModules", "typescriptFiles"] } },
  { file: "src/quality/deferrals.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/dossier-q18.test.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/empty-list-sweep.ts", source: { kind: "shared_walk", walks: ["testModules"] } },
  { file: "src/quality/derivable-lists.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/exemption-reach.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/flattering-numbers.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/g5-rehearsal.test.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/hardening-q26.test.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/patient-populations.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/reached-pages.ts", source: { kind: "shared_walk", walks: ["filesUnder", "pageSpecFiles"] } },
  { file: "src/quality/empty-populations.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/horizon-directions.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/latent-findings.ts", source: { kind: "shared_walk", walks: ["dossierTestFiles", "modulesWithNoUnitHeader", "sourceModules"] } },
  { file: "src/quality/latent-y5.ts", source: { kind: "shared_walk", walks: ["dossierTestFiles", "modulesWithNoUnitHeader", "sourceModules"] } },
  { file: "src/quality/manifest.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/mutation-sampling.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/negative-probes.test.ts", source: { kind: "shared_walk", walks: ["dossierTestFiles", "exportedResetters", "migrationSql", "modulesWithNoUnitHeader", "pageSpecFiles", "sourceModules", "storeModules", "textFiles", "verticalModules"] } },
  { file: "src/quality/order-independence.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/page-suite.test.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles"] } },
  { file: "src/quality/page-suite.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles"] } },
  { file: "src/quality/pins.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/planting.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/private-copies.test.ts", source: { kind: "shared_walk", walks: ["filesUnder"] } },
  { file: "src/quality/private-copies.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/prose-numbers.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles", "sourceModules"] } },
  { file: "src/quality/quarter-mutants.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/refusal-branches.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/register-census.test.ts", source: { kind: "shared_walk", walks: ["dossierTestFiles", "exportedResetters", "migrationSql", "modulesWithNoUnitHeader", "storeModules", "textFiles", "verticalModules"] } },
  { file: "src/quality/register-census.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/register-counts.ts", source: { kind: "shared_walk", walks: ["testModules"] } },
  { file: "src/quality/route-coverage.ts", source: { kind: "own_recursion" } },
  { file: "src/quality/scan-text.ts", source: { kind: "shared_walk", walks: ["sourceModules", "typescriptFiles"] } },
  { file: "src/quality/self-defeating.ts", source: { kind: "shared_walk", walks: ["testModules"] } },
  { file: "src/quality/self-ending.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/self-reference.ts", source: { kind: "shared_walk", walks: ["sourceModules", "typescriptFiles"] } },
  { file: "src/quality/shared-excuses.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/spec-premises.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles"] } },
  { file: "src/quality/spec-stores.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles"] } },
  { file: "src/quality/superset.ts", source: { kind: "shared_walk", walks: ["sourceModules"] } },
  { file: "src/quality/tautology-sweep.ts", source: { kind: "shared_walk", walks: ["testModules"] } },
  { file: "src/quality/tree-walks.ts", source: { kind: "shared_walk", walks: ["dossierTestFiles", "exportedResetters", "filesUnder", "migrationFiles", "migrationSql", "modulesWithNoUnitHeader", "pageSpecFiles", "sourceModules", "storeModules", "testModules", "textFiles", "typescriptFiles", "verticalModules"] } },
  { file: "src/quality/typed-names.ts", source: { kind: "shared_walk", walks: ["typescriptFiles"] } },
  { file: "src/quality/unasked-facts.ts", source: { kind: "shared_walk", walks: ["pageSpecFiles", "sourceModules", "typescriptFiles"] } },
  { file: "src/quality/unit-headers.ts", source: { kind: "shared_walk", walks: ["sourceModules", "typescriptFiles"] } },
  { file: "src/quality/unrun.ts", source: { kind: "shared_walk", walks: ["sourceModules", "typescriptFiles"] } },
  { file: "src/referrals/scoping.test.ts", source: { kind: "own_recursion" } },
  { file: "src/reporting/retention.test.ts", source: { kind: "own_recursion" } },
  { file: "src/security/instruction-sinks.ts", source: { kind: "own_recursion" } },
  { file: "src/security/page-reach.ts", source: { kind: "own_recursion" } },
  { file: "src/security/reachability.ts", source: { kind: "own_recursion" } },
  { file: "src/tenancy/two-tenant.test.ts", source: { kind: "own_recursion" } },
  { file: "src/verticals/assembly.test.ts", source: { kind: "shared_walk", walks: ["verticalModules"] } },
  {
    file: "src/quality/instant.ts",
    source: {
      kind: "not_a_walk",
      why: "ITS POPULATION IS THE WALKS THEMSELVES. W311's register asks which controls read state something other than the control changes, and the shared walks are exactly that kind of state — so it imports eight of them as DATA and calls none. A row claiming it walks would be describing a module that reads the working directory, the installed dependencies and the machine, which is what its own entries say.",
    },
  },
];

/**
 * Where the register and the tree disagree, in four directions.
 *
 * The third is the one this quarter is named after: a module calling a walk the row does not name
 * has a population wider than the register says, and every assertion over it still passes.
 */
export function populationDefects(
  root: string,
  declared: readonly Population[] = POPULATIONS,
  census: readonly TreeDerivedRegister[] = TREE_DERIVED_REGISTERS,
): PopulationDefect[] {
  const out: PopulationDefect[] = [];
  const byFile = new Map(declared.map((p) => [p.file, p.source]));

  for (const entry of census) {
    const source = byFile.get(entry.file);
    if (source === undefined) {
      out.push({ file: entry.file, what: "is in the census and nothing says what it is over" });
      continue;
    }
    const called = walksCalled(root, entry.file);
    if (source.kind === "shared_walk") {
      if (called.join(",") !== [...source.walks].sort().join(",")) {
        out.push({
          file: entry.file,
          what: `is recorded as walking ${source.walks.join(", ") || "nothing"} and calls ${called.join(", ") || "nothing"}`,
        });
      }
      continue;
    }
    if (source.kind === "own_recursion") {
      if (called.length > 0) {
        out.push({ file: entry.file, what: `is recorded as recursing itself and calls ${called.join(", ")}` });
      } else if (!recursesItself(root, entry.file)) {
        out.push({ file: entry.file, what: "is recorded as recursing itself and holds no recursion" });
      }
      continue;
    }
    if (called.length > 0 || recursesItself(root, entry.file)) {
      out.push({ file: entry.file, what: "is recorded as walking nothing and walks the tree" });
    }
  }
  const members = new Set(census.map((e) => e.file));
  for (const { file } of declared) {
    if (!members.has(file)) {
      out.push({ file, what: "has a population here and is not in the census" });
    }
  }
  return out.sort((a, b) => `${a.file}${a.what}`.localeCompare(`${b.file}${b.what}`));
}

/** What this register does not prove. */
export const POPULATION_BOUND =
  "IT SAYS WHERE A SET COMES FROM, NOT WHETHER IT IS THE RIGHT SET. A register walking " +
  "`sourceModules` when its subject is every file the repository holds is recorded here as walking " +
  "`sourceModules` and is wrong about its own subject — that is W367's question, and this register " +
  "is what gives that unit a population to ask it over. A CALL IS READ AS TEXT: a module naming a " +
  "walk it never reaches, behind a branch nothing takes, is recorded as calling it, and one that " +
  "reaches a walk through a helper in another module is not. The remedy is a reachability walk " +
  "rather than a name scan, which the tree already has in `reachableFrom` and which would make this " +
  "register a caller of the thing it measures. AND `own_recursion` IS ONE BUCKET FOR A THIRD OF " +
  "THE CENSUS: what each of those members walks — which directory, with which skip list, filtered how — is not " +
  "recorded here at all, and W341's copy register is the only thing that looks at those " +
  "recursions. A module in that bucket has said only that its population is its own.";

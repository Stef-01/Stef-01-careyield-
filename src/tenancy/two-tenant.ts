// W277: two tenants, or it is not a scoping test.
//
// Y4-1 is the reason this unit exists, and the reason is not the leak — it is HOW the leak survived
// review. Every practice could read every other practice's complaints, and a test asserting
// "practice A sees none of practice B's complaints" **would have passed**, because the writer
// stamped `"prac-console"` on every row and the exclusion was over an empty set. W253 wrote the
// lesson down in one sentence: *exclusion alone is vacuous*, and made its own cross-practice test
// do three things — A excludes B, B INCLUDES B, and the suite fails outright if no endpoint
// distinguishes the two.
//
// That fix was made for one surface. W209's register names **thirty** practice-scoped reads, and
// nothing checked that any of the other twenty-nine had ever been shown a second practice. A read
// scoped correctly and tested against one tenant is a read whose scoping has never been exercised:
// the filter matches everything, the assertion passes, and the test is a statement about a fixture.
//
// SIX HAD NOT BEEN. Measured rather than assumed:
//
//   `src/console/store.ts` — `saveClinicians`, `saveSessionConfig`, `acknowledgeSetupStep` and
//   `completeSetup`, all exercised by `setup.test.ts` against ONE onboarded practice. This is the
//   module Y4-1's leak lived in, which is the part worth saying out loud: the surface that taught
//   this tree the lesson still had four writes that had never seen a second tenant.
//
//   `src/capability/store.ts::statedBy` and `src/referrals/store.ts::sentEventsFor` — no test
//   called them at all, so their practice filter had never run against anything.
//
// All six are covered now, in `two-tenant.test.ts`, each driven across two practices and each
// asserting BOTH directions: the other practice is excluded, and this practice's own row is
// present. W253's third guard is here too — if the two practices are indistinguishable the suite
// says so rather than passing.
//
// THE DETECTOR'S BOUND, AND IT IS THE INTERESTING PART. `tenantsIn` counts distinct practice-id
// LITERALS in a test's text. `setup.test.ts` reports zero, and that is not a false negative — W166
// made practice ids generated, and its own comment says *"ids are generated now, so no literal can
// stand in for it"*. A test that onboards one practice and reads the id back genuinely has one
// tenant, whatever it is called. What the detector cannot see is a test that generates TWO, which
// would read as zero and be reported as a gap. That direction is safe: it over-reports work to do
// rather than certifying work that was not done, and the register's declared entries are where a
// generated-id proof gets recorded when one arrives.
//
// FOUNDER GATE (plan §4): synthetic only. Two synthetic practices, no real patient anywhere.

import { readFileSync } from "node:fs";
import path from "node:path";

/** A practice-scoped read, as W209's register names it. */
export interface ScopedRead {
  module: string;
  fn: string;
}

/**
 * The practice identifiers a test constructs, by literal.
 *
 * Both spellings the tree uses — `prac-a` and `practice-a` — because two conventions exist and a
 * detector that knew only one reported `registers/store.test.ts` as single-tenant when it drives
 * two. Found by running it, which is the only way that kind of narrowness is ever found.
 */
export function tenantsIn(text: string): string[] {
  return [...new Set([...text.matchAll(/"(prac(?:tice)?-[A-Za-z0-9_-]+)"/g)].map((m) => m[1]!))].sort();
}

/** Does this text drive at least two distinct practices? */
export function drivesTwoTenants(text: string): boolean {
  return tenantsIn(text).length >= 2;
}

/** Every practice-scoped read W209's register declares, read from the register itself. */
export function practiceScopedReads(root: string): ScopedRead[] {
  const source = readFileSync(path.join(root, "src/tenancy/store-reads.ts"), "utf8");
  return [...source.matchAll(/\{\s*module:\s*"([^"]+)",\s*fn:\s*"([^"]+)",\s*kind:\s*"([^"]+)"/g)]
    .filter((m) => m[3] === "practice_scoped")
    .map((m) => ({ module: m[1]!, fn: m[2]! }));
}

/**
 * The test file that drives each read across two practices.
 *
 * Declared rather than inferred for the six W277 covered, because "which test proves this" is a
 * claim somebody has to make and a search for callers would happily nominate a file that merely
 * mentions the name. The rest are found by search and required to drive two tenants — the register
 * carries the ones that needed a decision, not the ones that were already fine.
 */
export const TWO_TENANT_PROOFS: Readonly<Record<string, string>> = {
  "src/console/store.ts::saveClinicians": "src/tenancy/two-tenant.test.ts",
  "src/console/store.ts::saveSessionConfig": "src/tenancy/two-tenant.test.ts",
  "src/console/store.ts::acknowledgeSetupStep": "src/tenancy/two-tenant.test.ts",
  "src/console/store.ts::completeSetup": "src/tenancy/two-tenant.test.ts",
  "src/capability/store.ts::statedBy": "src/tenancy/two-tenant.test.ts",
  "src/referrals/store.ts::sentEventsFor": "src/tenancy/two-tenant.test.ts",
};

export interface TenantCoverage {
  /** Reads no test drives across two practices — the list this unit exists to keep empty. */
  singleTenant: string[];
  /** Declared proofs for reads W209 no longer calls practice-scoped. */
  stale: string[];
}

/**
 * Which practice-scoped reads have been shown a second tenant, checked against the tree.
 *
 * A read counts as covered when some test file both CALLS it and drives two practices. The
 * declared proofs above are checked the same way rather than trusted — a citation nobody resolved
 * reads as coverage, which is W207's finding and W258's rule.
 */
export function tenantCoverage(
  root: string,
  testTexts: ReadonlyMap<string, string>,
): TenantCoverage {
  const reads = practiceScopedReads(root);
  const known = new Set(reads.map((r) => `${r.module}::${r.fn}`));
  const singleTenant: string[] = [];
  for (const read of reads) {
    const calls = new RegExp(`\\b${read.fn}\\s*\\(`);
    const covered = [...testTexts].some(([, text]) => calls.test(text) && drivesTwoTenants(text));
    if (!covered) singleTenant.push(`${read.module}::${read.fn}`);
  }
  return {
    singleTenant: singleTenant.sort(),
    stale: Object.keys(TWO_TENANT_PROOFS).filter((k) => !known.has(k)).sort(),
  };
}

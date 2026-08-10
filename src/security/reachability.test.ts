// W107 verify gate: the audit allowlist's safety argument, checked instead of asserted.

import { describe, expect, it } from "vitest";
import { AUDIT_ALLOWLIST } from "./audit-allowlist";
import { reachableFromApp } from "./reachability";

/**
 * Packages that exist to produce documents at build time and must never be reachable from a
 * request-serving path. `pptxgenjs` is the one the allowlist actually argues about; `docx` is
 * here because the review found it already reachable, and a rule that only covers the package
 * you got caught on is not a rule.
 */
const BUILD_TIME_ONLY = ["pptxgenjs", "docx", "adm-zip"];

const reach = () => reachableFromApp(process.cwd());

describe("W107 request-serving paths reach no build-time-only package", () => {
  it("walks a real graph", () => {
    const { files, packages } = reach();
    // Guard against a vacuous pass: a resolver bug that returned nothing would satisfy every
    // assertion below. The tree has ~35 routes, so the reachable set is comfortably large.
    expect(files.length).toBeGreaterThan(50);
    expect(packages).toContain("next");
    expect(packages).toContain("react");
    // And it genuinely traverses — these are only reachable through `@/` chains, not from app/.
    expect(files).toContain("src/console/store.ts");
    expect(files).toContain("src/guardrails/monitors.ts");
  });

  for (const pkg of BUILD_TIME_ONLY) {
    it(`does not reach ${pkg}`, () => {
      const { packages } = reach();
      expect(
        packages,
        `${pkg} is build-time only; something under app/ now imports a module that pulls it in`,
      ).not.toContain(pkg);
    });
  }

  it("every allowlisted module's argument holds", () => {
    // The acceptance for image-size says it is reached "only via pptxgenjs" and is "absent from
    // the deployed app". Neither the vulnerable module nor its carrier may be reachable.
    const { packages } = reach();
    for (const entry of AUDIT_ALLOWLIST) {
      expect(packages, `${entry.module} is allowlisted as unreachable but is reachable`).not.toContain(
        entry.module,
      );
    }
    // Non-vacuous: the allowlist is not empty, so this is checking something.
    expect(AUDIT_ALLOWLIST.length).toBeGreaterThan(0);
  });
});

describe("W107 the check would notice", () => {
  it("reports the packages it did find, so a failure is diagnosable", () => {
    const { packages } = reach();
    // A reachability failure is only actionable if you can see the set. Pin the shape rather
    // than the contents, which change as the app grows.
    expect(Array.isArray(packages)).toBe(true);
    expect(packages).toEqual([...packages].sort());
    expect(new Set(packages).size).toBe(packages.length);
  });
});

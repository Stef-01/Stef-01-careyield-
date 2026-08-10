// W53: accepted-risk dependency advisories (W51 finding A2).
//
// This is the ONLY way to make `pnpm audit:gate` tolerate an advisory. The
// AllowlistEntry type requires a reason and a reviewBy date on every entry, so an
// acceptance cannot be added without stating why it is safe and when it expires —
// past reviewBy the gate starts failing again and the acceptance must be re-argued.
//
// Before adding an entry, try to fix it first: a `pnpm.overrides` bump (as W51 used
// for postcss and sharp) is always preferable to an accepted risk.

import type { AllowlistEntry } from "./audit-gate.ts";

export const AUDIT_ALLOWLIST: readonly AllowlistEntry[] = [
  {
    advisory: "GHSA-w3rx-r6r6-pgpr",
    module: "image-size",
    reason:
      "ICNS parser infinite-loop DoS, reached only via pptxgenjs. No patched release exists " +
      "(advisory's patched range is empty), so there is nothing to bump to. Exposure is nil in " +
      "our usage: pptxgenjs runs at build time to generate our own sales deck from our own " +
      "assets, never parses untrusted input, and is absent from the deployed app. Do not ship " +
      "pptxgenjs into any request-serving path.",
    reviewBy: "2026-11-09",
  },
  {
    advisory: "GHSA-5p2g-fcmc-qvqq",
    module: "image-size",
    reason:
      "JXL/HEIF parser infinite-loop DoS in the same dependency, reached the same way and " +
      "accepted on the same grounds as GHSA-w3rx-r6r6-pgpr: no patched release, build-time only, " +
      "own inputs only, not in the deployed app.",
    reviewBy: "2026-11-09",
  },
];

// W116 hardening: source files must be text that tooling can read as text.
//
// This exists because of a specific, embarrassing failure it now prevents. `vault.ts` shipped
// in W109 with three NUL bytes inside a template literal — the separator in a hash key. It
// compiled, it ran, its tests passed, and the tree-walking registry checks (W51 stores, W106
// record classes) still matched their regexes because Node reads a NUL as a character like
// any other.
//
// What it broke was review. Git classifies a file containing NUL as binary, so `git diff` and
// `git show` print "Binary files differ" and nothing else; ripgrep and grep skip it by
// default. A source file that tooling treats as binary is a file that silently leaves every
// text-based check — including the one a human does before approving a commit. In a repo whose
// whole discipline is that the reasoning lives in the diff, a file with no diff is a hole.
//
// Nothing caught it for two units. So it becomes a test, in the W107 spirit: noticing a
// tendency does not stop it recurring, and a lint does.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// W282: the walk moved to `@/quality/tree-walks` and took a root with it, which is what makes it
// provable — `register-census.test.ts` plants a file in a copied tree and requires it to appear.
import { textFiles } from "@/quality/tree-walks";

const ROOT = path.resolve(__dirname, "../..");

describe("W116 source files are readable as text", () => {
  const files = textFiles(ROOT);

  it("finds a tree to check — the walk itself must not be the thing that passes", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("contains no NUL byte in any text source", () => {
    // A NUL makes git call the file binary, which means it produces no reviewable diff.
    const offenders = files
      .filter((file) => readFileSync(file).includes(0))
      .map((file) => path.relative(ROOT, file));
    expect(
      offenders,
      `these files contain NUL bytes and will show as "Binary files differ" in review: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});

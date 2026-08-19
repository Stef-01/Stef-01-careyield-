// W363 verify gate: "every check `docs/HORIZON-Q28.md` names either declares the direction it
// fails in or is shown failing loudly; a check named and neither declared nor shown fails."
//
// THE LIVE ASSERTION IS ONE LINE and it is green, which is what a quarter's own gate is supposed to
// be by the time somebody re-reads it. Everything else here is about whether it could have been
// anything else: the population is derived from the document rather than listed, every citation is
// resolved against the file it names, and each of the four disagreement arms is driven on an input
// a healthy tree cannot produce.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CHECKS_AT_W363,
  HORIZON,
  HORIZON_DIRECTION_BOUND,
  type NamedCheck,
  type NamedToken,
  horizonDefects,
  horizonTokens,
} from "./horizon-directions";
import { directions } from "./failure-direction";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { withTree } from "./planting";

const ROOT = process.cwd();
const TOKENS = horizonTokens(ROOT);

describe("W363 every check the quarter's horizon names is answered, in four directions", () => {
  it("passes, over the horizon as it stands — which is the gate", () => {
    expect(horizonDefects(ROOT)).toEqual([]);
  });

  it("derives the population from the document rather than from a list", () => {
    expect(TOKENS.length).toBeGreaterThan(15);
    expect(CHECKS_AT_W363.map((c) => c.token).sort()).toEqual(TOKENS.map((t) => t.token).sort());
    // And it really resolves: some tokens name a module this tree holds and some name nothing.
    expect(TOKENS.some((t) => t.module !== null), "nothing resolved, so the register is a word list").toBe(
      true,
    );
    expect(TOKENS.some((t) => t.module === null), "everything resolved, so `not_a_check` is unreachable").toBe(
      true,
    );
  });

  it("reports a name the horizon uses that nothing answers", () => {
    const arriving: NamedToken[] = [...TOKENS, { token: "somethingNew", module: "src/quality/pins.ts" }];
    expect(horizonDefects(ROOT, CHECKS_AT_W363, arriving)).toEqual([
      { token: "somethingNew", what: "is named by the horizon and nothing says which way it fails" },
    ]);
  });

  it("reports an answer for a name the horizon no longer uses", () => {
    const gone: NamedCheck[] = [
      { token: "vanished", standing: { kind: "not_a_check", why: "y".repeat(130) } },
    ];
    expect(horizonDefects(ROOT, gone, [])).toEqual([
      { token: "vanished", what: "is answered here and the horizon no longer names it" },
    ]);
  });

  it("reports a `not_a_check` for a token that resolves to a module, which is the arm that reads as tidy", () => {
    const wrong: NamedCheck[] = [
      { token: "page-reach.ts", standing: { kind: "not_a_check", why: "y".repeat(130) } },
    ];
    const found = horizonDefects(ROOT, wrong, TOKENS.filter((t) => t.token === "page-reach.ts"));
    expect(found).toEqual([
      { token: "page-reach.ts", what: "is called not a check and resolves to src/security/page-reach.ts" },
    ]);
  });

  it("reports a `declared` row W352 does not settle, and one pointing at the wrong module", () => {
    const unsettled: NamedCheck[] = [
      { token: "page-reach.ts", standing: { kind: "declared", via: "src/quality/gone.ts" } },
    ];
    const found = horizonDefects(ROOT, unsettled, TOKENS.filter((t) => t.token === "page-reach.ts"));
    // Sorted by the defect text, which is what the register does — both arms fire on one row.
    expect(found.map((d) => d.what)).toEqual([
      "is declared through src/quality/gone.ts and resolves to src/security/page-reach.ts",
      "is declared through src/quality/gone.ts and W352 does not settle it",
    ]);
  });

  it("reports a citation naming a test that does not exist, which is the arm that reads as coverage", () => {
    const bogus: NamedCheck[] = [
      {
        token: "controls.ts",
        standing: {
          kind: "shown_loud",
          citation: "src/quality/controls.test.ts :: a test nobody ever wrote",
          how: "y".repeat(130),
        },
      },
    ];
    expect(horizonDefects(ROOT, bogus, TOKENS.filter((t) => t.token === "controls.ts"))).toEqual([
      { token: "controls.ts", what: "cites a test the file does not hold: a test nobody ever wrote" },
    ]);
  });

  it("reports a citation naming a file the tree does not hold", () => {
    const bogus: NamedCheck[] = [
      {
        token: "controls.ts",
        standing: {
          kind: "shown_loud",
          citation: "src/quality/never-was.test.ts :: something",
          how: "y".repeat(130),
        },
      },
    ];
    expect(horizonDefects(ROOT, bogus, TOKENS.filter((t) => t.token === "controls.ts"))).toEqual([
      { token: "controls.ts", what: "cites src/quality/never-was.test.ts and the tree holds no such file" },
    ]);
  });
});

describe("W363 the resolution of a name against the tree", () => {
  it("resolves a call by the name in front of its bracket", () => {
    const found = TOKENS.find((t) => t.token.startsWith("quarterModules("));
    expect(found?.module, "the document's own call shape did not resolve").toBe(
      "src/quality/quarter-mutants.ts",
    );
  });

  it("resolves a bare filename and a full path alike, and a value to nothing", () => {
    expect(TOKENS.find((t) => t.token === "page-reach.ts")?.module).toBe("src/security/page-reach.ts");
    expect(TOKENS.find((t) => t.token === "src/quality/quarter-mutants-q26.ts")?.module).toBe(
      "src/quality/quarter-mutants-q26.ts",
    );
    expect(TOKENS.find((t) => t.token === "pending")?.module, "a returned value resolved to a module").toBe(
      null,
    );
  });

  it("does not resolve a name two modules export, because that is not a resolution", () => {
    const found = withTree(
      {
        "src/a/thing.ts": "export const shared = 1;\n",
        "src/b/thing.ts": "export const shared = 2;\n",
        [HORIZON]: "The check `shared` is the one.\n",
      },
      (root) => horizonTokens(root),
    );
    expect(found).toEqual([{ token: "shared", module: null }]);
  });
});

describe("W363 the answers, read against what stands behind them", () => {
  it("cites W352 only where W352 really settles it", () => {
    const settled = new Set(directions(TREE_DERIVED_REGISTERS).map((d) => d.file));
    const declared = CHECKS_AT_W363.filter((c) => c.standing.kind === "declared");
    expect(declared.length, "nothing is declared, so that arm checks nothing").toBeGreaterThan(2);
    for (const check of declared) {
      const via = (check.standing as { via: string }).via;
      expect(settled, `${check.token} is declared through a file W352 does not settle`).toContain(via);
    }
  });

  it("argues every row it cannot derive", () => {
    for (const { token, standing } of CHECKS_AT_W363) {
      if (standing.kind === "declared") continue;
      const text = standing.kind === "not_a_check" ? standing.why : standing.how;
      expect(text.length, `${token} is answered without an argument`).toBeGreaterThan(120);
    }
    // Every kind is used, so none of the three is a class nobody reached for.
    expect(new Set(CHECKS_AT_W363.map((c) => c.standing.kind))).toEqual(
      new Set(["declared", "shown_loud", "not_a_check"]),
    );
  });

  it("names a real horizon, and the gate it is re-reading", () => {
    const document = readFileSync(path.join(ROOT, HORIZON), "utf8");
    expect(document, "the horizon no longer states the gate this register re-reads").toContain(
      "either declares its failure direction or is shown failing",
    );
    expect(document).toContain("W363");
  });

  it("states what a green gate does not cover", () => {
    expect(HORIZON_DIRECTION_BOUND.length).toBeGreaterThan(600);
    expect(HORIZON_DIRECTION_BOUND).toContain("IT READS THE BACKTICKS");
    expect(HORIZON_DIRECTION_BOUND).toContain("RESOLVES A TITLE, NOT A BEHAVIOUR");
  });
});

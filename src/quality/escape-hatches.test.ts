// W345 verify gate: "every `inherent`, `never_derived`, `unobservable` and `undemonstrated`
// declaration re-read against what the tree can observe today, each still-correct one left with its
// argument and each one the tree has outgrown converted."
//
// THE LIVE ASSERTION IS ONE LINE and the rest of this file is about whether it can fail. A register
// of re-readings is the easiest thing in this tree to write vacuously — fifty-five rows saying
// `still_correct` and nothing checking that the hatches they name are the hatches the tree holds
// would be a document, not a check. So every arm is driven to a hit before the clean answer is
// asserted, and the arm that matters — a hatch pleading it cannot be called while its module
// exports a detector taking a root — is driven against a CONSTRUCTED tree rather than against a
// list, which is the only way it says anything after this unit's own five are converted.

import { describe, expect, it } from "vitest";
import { withTree } from "./planting";
import { BLIND_SPOTS } from "./blind-spots";
import {
  HATCH_BOUND,
  type Hatch,
  REVIEWED_AT_W345,
  type Review,
  callableDetectorsBorrowingTheSentence,
  hatchDefects,
  hatchesInTree,
} from "./escape-hatches";

const ROOT = process.cwd();
const found = (): Hatch[] => hatchesInTree(ROOT);

/** A module whose blind spot still borrows the sentence, so a plant at its path is the real shape. */
const BORROWER = "src/quality/latent-y5.ts";
/** One that borrows it and is not the subject of the plant, so the pair separates path from claim. */
const OTHER_BORROWER = "src/quality/latent-findings.ts";

describe("W345 the escape hatches, re-read", () => {
  it("passes, over the hatches the tree actually holds", () => {
    expect(hatchDefects(ROOT)).toEqual([]);
  });

  it("derives the population from the three registers rather than listing it", () => {
    const kinds = new Set(found().map((h) => h.kind));
    // All four reasons are live, so a change that emptied one register would move this.
    expect([...kinds].sort()).toEqual(["inherent", "never_derived", "undemonstrated", "unobservable"]);
    expect(found().length).toBeGreaterThan(50);
    expect(found().every((h) => /^(bounds|blind-spots|self-ending)::/.test(h.id))).toBe(true);
  });

  it("re-reads every hatch the tree holds, and names none it does not", () => {
    const live = new Set(found().map((h) => h.id));
    const claimsLive = REVIEWED_AT_W345.filter(
      (r) => r.verdict.kind === "still_correct" || r.verdict.kind === "misfiled",
    ).map((r) => r.id);
    expect(claimsLive.slice().sort()).toEqual([...live].sort());
  });

  it("records each hatch once, so a second reading cannot hide behind a first", () => {
    const repeated = (rows: readonly Review[]): string[] => {
      const ids = rows.map((r) => r.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    };
    const first = REVIEWED_AT_W345[0]!;
    expect(repeated([...REVIEWED_AT_W345, first])).toEqual([first.id]);
    expect(repeated(REVIEWED_AT_W345)).toEqual([]);
  });

  it("reports a hatch nobody re-read, which is what an arriving one looks like", () => {
    const arriving: Hatch[] = [...found(), { id: "bounds::src/w900.ts::W900_BOUND", kind: "inherent" }];
    expect(hatchDefects(ROOT, REVIEWED_AT_W345, arriving)).toEqual([
      { id: "bounds::src/w900.ts::W900_BOUND", what: "is an escape hatch nobody re-read" },
    ]);
  });

  it("reports a still-correct row for a hatch the tree no longer holds", () => {
    const gone = found().filter((h) => h.id !== "blind-spots::src/quality/latent-y5.ts");
    expect(hatchDefects(ROOT, REVIEWED_AT_W345, gone)).toEqual([
      {
        id: "blind-spots::src/quality/latent-y5.ts",
        what: "is re-read here as a live hatch and the tree no longer holds it",
      },
    ]);
  });

  it("reports a converted row that is somehow still a hatch, which is the other direction", () => {
    // THE ARM ONE DIRECTION WOULD HAVE MISSED. `outgrown` and `refuted` claim this unit TOOK the
    // hatch away; a conversion reverted leaves the row saying so and the tree disagreeing, and a
    // register that only checked "reviewed but gone" would have called all four conversions stale
    // the moment they worked.
    const reverted: Hatch[] = [...found(), { id: "blind-spots::src/quality/tree-walks.ts", kind: "undemonstrated" }];
    expect(hatchDefects(ROOT, REVIEWED_AT_W345, reverted)).toEqual([
      {
        id: "blind-spots::src/quality/tree-walks.ts",
        what: "is recorded here as converted and is still an escape hatch",
      },
    ]);
  });

  it("reports a still-correct verdict on a hatch that has no argument left, over a real review list", () => {
    const shortened: Review[] = REVIEWED_AT_W345.filter((r) => r.id !== "blind-spots::src/quality/latent-y5.ts");
    expect(hatchDefects(ROOT, shortened)).toEqual([
      { id: "blind-spots::src/quality/latent-y5.ts", what: "is an escape hatch nobody re-read" },
    ]);
  });
});

describe("W345 the one reason that is a claim about the tree", () => {
  it("finds a borrowed `NOT_CALLABLE` whose module exports a detector taking a root", () => {
    const seen = withTree(
      {
        // The witness: the sentence says no witness can be handed in, and here is the signature
        // that would take one. The control shares the sentence and has no such export, so what
        // separates them is the claim rather than the path.
        [BORROWER]: 'import path from "node:path";\nexport function scan(\n  root: string,\n): string[] {\n  return [path.join(root, "x")];\n}\n',
        [OTHER_BORROWER]: 'export function fired(rows: readonly string[]): string[] {\n  return [...rows];\n}\n',
      },
      (root) => callableDetectorsBorrowingTheSentence(root),
    );
    expect(seen).toEqual([BORROWER]);
  });

  it("reports it as a defect, and says which claim the tree contradicted", () => {
    const defects = withTree(
      { [BORROWER]: "export function scan(root: string): string[] {\n  return [root];\n}\n" },
      (root) => hatchDefects(root, REVIEWED_AT_W345, []),
    );
    expect(defects).toContainEqual({
      id: `blind-spots::${BORROWER}`,
      what: "says its detector cannot be called from outside, and the module exports one taking a root",
    });
  });

  it("says nothing about a module whose blind spot was converted, however callable it is", () => {
    // `tree-walks.ts` is `demonstrated` since this unit and exports `sourceModules(root)`. The scan
    // reads the register first, so a converted entry drops out of the population rather than being
    // reported forever — which is what made the five findable in the first place.
    expect(BLIND_SPOTS["src/quality/tree-walks.ts"]!.kind).toBe("demonstrated");
    const seen = withTree(
      { "src/quality/tree-walks.ts": "export function sourceModules(root: string): string[] {\n  return [root];\n}\n" },
      (root) => callableDetectorsBorrowingTheSentence(root),
    );
    expect(seen).toEqual([]);
  });

  it("is silent over the tree as it stands, which is the finding this unit closed", () => {
    expect(callableDetectorsBorrowingTheSentence(ROOT)).toEqual([]);
  });
});

describe("W345 the register is subject to its own rule", () => {
  it("states what the re-reading does not prove", () => {
    expect(HATCH_BOUND.length).toBeGreaterThan(600);
    // The bound has to name the half nothing derives: three of the four reasons are judgements.
    expect(HATCH_BOUND).toContain("RECORDS");
    expect(HATCH_BOUND).toContain("NOT_A_SILENCE");
  });
});

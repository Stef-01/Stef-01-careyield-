// W357 verify gate: "every remedy any register names, resolved against the tree for whether it was
// built; W332's `claim-classes.ts` survivor driven as the case that recurred; a remedy recorded as
// though recording it were the fix fails."
//
// THE DRIVEN ARM IS THE UNIT AND IT COSTS FOUR SUBPROCESSES. Everything else here is bookkeeping —
// a remedy named and untracked, a row tracking one no register names — and bookkeeping is exactly
// what this register would be if a row could say `applied` because somebody typed it. So each
// applied row has its mutant re-applied to a copied tree and its suite is required to go RED. A
// remedy that was written down and not built cannot pass that, which is the whole point: it is the
// one claim in this file that a sentence does not satisfy.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  REMEDIES_AT_W357,
  UNAPPLIED_BOUND,
  REMEDY_REGISTERS,
  type RemedyRow,
  mutationFor,
  namedRemedies,
  remedyDefects,
} from "./unapplied-remedies";
import { copyTree } from "./planting";

const pexec = promisify(execFile);
const ROOT = process.cwd();
let COPY = "";

beforeAll(() => {
  COPY = copyTree(ROOT, { withNodeModules: true });
}, 180_000);

afterAll(() => {
  if (COPY) rmSync(COPY, { recursive: true, force: true });
});

/** True when the suite goes red with the mutant in place — which is what "caught" means. */
async function mutantDies(id: string): Promise<boolean> {
  const mutation = mutationFor(ROOT, id);
  if (mutation === null) return false;
  const file = path.join(COPY, mutation.module);
  const original = readFileSync(file, "utf8");
  try {
    writeFileSync(file, mutation.mutated, "utf8");
    await pexec("npx", ["vitest", "run", mutation.suite], { cwd: COPY, maxBuffer: 1 << 28 });
    return false;
  } catch {
    return true;
  } finally {
    writeFileSync(file, original, "utf8");
  }
}

describe("W357 every remedy the tree names is tracked, in both directions", () => {
  it("passes, over the registers as they stand", () => {
    expect(remedyDefects(ROOT)).toEqual([]);
  });

  it("derives the population from the registers rather than listing it", () => {
    // Three registers contribute, and the derivation reads the `uncaught` arm only — the other
    // three survivor kinds carry no remedy field, which `UNAPPLIED_BOUND` says is a limit.
    expect(REMEDY_REGISTERS.map((r) => r.unit)).toEqual(["W296", "W332", "W349"]);
    for (const { id } of namedRemedies()) {
      expect(id, "a remedy id is not a mutant id").toContain(" :: ");
    }
  });

  it("reports a remedy a register names and nothing tracks", () => {
    const arriving = [
      ...namedRemedies(),
      { id: "src/planted/x.ts :: eq-to-neq :: if (a === b) return;", register: "W999" as const, remedy: "y".repeat(80) },
    ];
    expect(remedyDefects(ROOT, REMEDIES_AT_W357, arriving)).toEqual([
      {
        id: "src/planted/x.ts :: eq-to-neq :: if (a === b) return;",
        what: "is a remedy W999 named and nothing says whether it was built",
      },
    ]);
  });

  it("reports an OPEN row no register names, which is the other direction", () => {
    // Asymmetric on purpose: an APPLIED row is expected to outlive the survivor that named it,
    // because applying the remedy is what takes the survivor out of the register. An open one is
    // not — if no register names it any more, the row is describing a mutant nobody measured.
    const stale: RemedyRow[] = [
      { id: "src/planted/gone.ts :: eq-to-neq :: x", standing: { kind: "open", owed: "W999", why: "y".repeat(60) } as const },
    ];
    expect(remedyDefects(ROOT, stale, [])).toEqual([
      { id: "src/planted/gone.ts :: eq-to-neq :: x", what: "is tracked as an open remedy and no register names it" },
    ]);
  });

  it("says nothing about an APPLIED row whose survivor has left the register", () => {
    const applied: RemedyRow[] = [
      { id: "src/planted/gone.ts :: eq-to-neq :: x", standing: { kind: "applied", by: "W999", how: "y".repeat(60) } as const },
    ];
    expect(remedyDefects(ROOT, applied, [])).toEqual([]);
  });

  it("rebuilds the mutation each row describes, so an id that has rotted is visible", () => {
    for (const row of REMEDIES_AT_W357) {
      const mutation = mutationFor(ROOT, row.id);
      expect(mutation, `${row.id} matches no mutation site in the tree`).not.toBeNull();
      expect(mutation!.mutated, `${row.id} rebuilt to an unchanged file`).not.toBe(mutation!.original);
    }
    expect(mutationFor(ROOT, "src/quality/pins.ts :: eq-to-neq :: nothing like this exists")).toBeNull();
  });

  it("gives every row an argument, and says which unit applied it", () => {
    for (const { id, standing } of REMEDIES_AT_W357) {
      const text = standing.kind === "applied" ? standing.how : standing.why;
      expect(text.length, `${id} is recorded without an argument`).toBeGreaterThan(120);
      if (standing.kind === "applied") expect(standing.by).toMatch(/^W\d+$/);
    }
  });

  it("states what the register does not prove", () => {
    expect(UNAPPLIED_BOUND.length).toBeGreaterThan(600);
    expect(UNAPPLIED_BOUND).toContain("A ROW SAYING `applied` PROVES ONE MUTANT DIES");
    expect(UNAPPLIED_BOUND).toContain("whyNotPlantable");
  });
});

describe("W357 an applied remedy kills its mutant", () => {
  it(
    "drives every applied row, and each suite goes red with the mutant in place",
    async () => {
      const applied = REMEDIES_AT_W357.filter((r) => r.standing.kind === "applied");
      expect(applied.length, "nothing is claimed applied, so this test checks nothing").toBeGreaterThan(3);

      const survivorsAmong = async (rows: readonly RemedyRow[]): Promise<string[]> => {
        const out: string[] = [];
        for (const row of rows) if (!(await mutantDies(row.id))) out.push(row.id);
        return out;
      };
      // The detector first, on a row whose mutant is recorded `unreached` and therefore cannot die:
      // without this the clean answer below would be indistinguishable from a harness that reports
      // everything caught. W295's control, in the arm that carries this unit's whole claim.
      const unreached: RemedyRow[] = [
        {
          id: 'src/quality/claim-classes.ts :: and-to-or :: return check !== undefined && check.run(row, root, "W900").length > 0;',
          standing: { kind: "applied", by: "W900", how: "y".repeat(130) },
        },
      ];
      expect(await survivorsAmong(unreached)).toEqual([unreached[0]!.id]);

      expect(
        await survivorsAmong(applied),
        "a remedy is recorded as applied and its mutant still survives",
      ).toEqual([]);
    },
    900_000,
  );


});

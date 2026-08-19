// W263 verify gate: "the blocked-row count is derived from the ledger and pinned; a new blocked
// row fails the suite until it names the ruling that would release it and the units released
// with it."
//
// The pin is one assertion. The half with teeth is that the checker is exercised on a ledger that
// breaks every rule BEFORE it is trusted on the real one — W48's shape, and the reason is that a
// checker only ever run against passing input is a function nobody has seen work, and "no
// violations" from it is not a result.

import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  BLOCKED_AT_W263,
  RELEASE_PATHS,
  answerableByTheLoop,
  blockedRows,
  blockedSurfaceViolations,
  blockersIn,
  ledgerRows,
} from "./blocked-surface";

const ROOT = path.resolve(__dirname, "../..");

/** A throwaway root holding one hand-written ledger, so the checker can be driven off-tree. */
let FAKE = "";
function withLedger<T>(rows: string, probe: (root: string) => T): T {
  writeFileSync(path.join(FAKE, "BUILD-STATE.md"), `| id | status | who | at | sha | note |\n${rows}`, "utf8");
  return probe(FAKE);
}

beforeAll(() => {
  FAKE = mkdtempSync(path.join(tmpdir(), "w263-"));
});
afterAll(() => {
  if (FAKE) rmSync(FAKE, { recursive: true, force: true });
});

describe("W263 the checker is exercised before it is trusted", () => {
  it("names every violation in words, on a ledger that breaks every rule", () => {
    // One row blocked on an undescribed blocker, one blocked naming nothing, and a count under
    // budget — plus, from the real register, a path claiming units this ledger does not block.
    const violations = withLedger(
      "| W900 | blocked | — | — | — | **Blocked. FOUNDER GATE G42.** |\n" +
        "| W901 | blocked | — | — | — | Blocked, and it does not say by what. |\n",
      (root) => blockedSurfaceViolations(root),
    );
    expect(violations.some((v) => v.includes("fell to 2 rows"))).toBe(true);
    expect(violations.some((v) => v.includes("W900 waits on G42, which no release path describes"))).toBe(true);
    expect(violations.some((v) => v.includes("W901 is blocked and names no founder gate or decision"))).toBe(true);
    expect(violations.some((v) => v.includes("claims to release"))).toBe(true);
  });

  it("catches a blocked row added without its release path — the horizon rule's clause", () => {
    // THE UNIT. W260's rule says an expansion may not grow the blocked surface without saying so.
    // This is that sentence as a failure: the real ledger plus one more blocked G5 row.
    const real = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
    const grown = `${real}\n| W902 | blocked | — | — | — | Respiratory content. **Blocked. FOUNDER GATE G5.** |\n`;
    writeFileSync(path.join(FAKE, "BUILD-STATE.md"), grown, "utf8");
    const violations = blockedSurfaceViolations(FAKE);
    expect(violations.some((v) => v.includes(`grew to ${BLOCKED_AT_W263 + 1} rows`))).toBe(true);
    expect(violations.some((v) => v.includes("G5 blocks W902 and its release path does not list it"))).toBe(true);
  });

  it("catches a release that happened and was not recorded", () => {
    // The other direction, and it is the one a register goes stale in: a gate is ratified, rows
    // stop being blocked, and the budget keeps describing the old world.
    const real = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
    const released = real.replace("| W174 | blocked |", "| W174 | available |");
    writeFileSync(path.join(FAKE, "BUILD-STATE.md"), released, "utf8");
    const violations = blockedSurfaceViolations(FAKE);
    expect(violations.some((v) => v.includes(`fell to ${BLOCKED_AT_W263 - 1} rows`))).toBe(true);
    expect(violations.some((v) => v.includes("G3 claims to release W174"))).toBe(true);
  });
});

describe("W263 the real ledger, against the budget", () => {
  it("meets it, with nothing unaccounted in either direction", () => {
    expect(blockedRows(ROOT)).toHaveLength(BLOCKED_AT_W263);
    expect(blockedSurfaceViolations(ROOT)).toEqual([]);
    expect(ledgerRows(ROOT).length, "the ledger did not parse").toBeGreaterThan(250);
  });

  it("accounts for every blocked row exactly once per blocker it names", () => {
    const declared = new Set(RELEASE_PATHS.flatMap((p) => p.releases));
    for (const row of blockedRows(ROOT)) {
      expect(declared, `${row.id} is blocked and no release path names it`).toContain(row.id);
    }
    // W133 is claimed twice ON PURPOSE: its row names one ruling under two names (G6, and the Q9
    // ask G6 became when it was numbered), so both are described and the duplication is declared
    // rather than deduplicated quietly. Everything else must be claimed exactly once.
    const all = RELEASE_PATHS.flatMap((p) => p.releases);
    const twice = all.filter((u, i) => all.indexOf(u) !== i);
    expect(twice, "a unit is claimed by two release paths that are not aliases").toEqual(["W133"]);
    const aliases = RELEASE_PATHS.filter((p) => p.releases.includes("W133"));
    expect(aliases.map((p) => p.blocker).sort()).toEqual(["G6", "Q9 action 1"]);
    expect(
      aliases.some((p) => /same ruling/i.test(p.whoDecides)),
      "W133's two blockers are not declared as one ruling",
    ).toBe(true);
  });

  it("sees the one blocked row that names a decision rather than a gate", () => {
    // THE GAP THIS UNIT FOUND. W208's plan-ledger check iterates `FOUNDER GATE (G\\d+)` matches in
    // each blocked row; W217 has none, so that loop body never runs for it and its blocker was
    // checked by nothing. It is the one row whose answer could require changing a published notice
    // rather than a config, which makes it the last one that should have been invisible.
    const w217 = blockedRows(ROOT).find((r) => r.id === "W217")!;
    expect(blockersIn(w217.note), "W217's blocker is invisible again").toEqual(["Q17 action 1"]);
    expect([...w217.note.matchAll(/FOUNDER GATE (G\d+)/g)], "W217 now names a gate").toEqual([]);
    const path_ = RELEASE_PATHS.find((p) => p.blocker === "Q17 action 1")!;
    expect(path_.kind).toBe("founder_decision");
    expect(path_.releases).toEqual(["W217"]);
  });

  it("names a gate §4 defines, for every gate-kind blocker", () => {
    // Composed with W208's rule rather than restated, and extended to the decision kind it misses.
    const plan = readFileSync(path.join(ROOT, "docs/FIVE-YEAR-PLAN.md"), "utf8");
    const section = plan.slice(plan.indexOf("## 4. Founder gates"), plan.indexOf("\n## 5. Year 1"));
    const defined = new Set([...section.matchAll(/^- \*\*(G\d+)\*\*/gm)].map((m) => m[1]!));
    expect(defined.size).toBeGreaterThan(8);
    for (const p of RELEASE_PATHS.filter((x) => x.kind === "founder_gate")) {
      expect(defined, `${p.blocker} is a blocker §4 does not define`).toContain(p.blocker);
    }
  });
});

describe("W263 the loop may answer none of them", () => {
  it("names a ruling owner for each, and it is never a builder", () => {
    // W260's clause 3 as data rather than prose. A path naming a builder as the decider would be
    // the loop deciding it may proceed, which is the one thing the plan says of every gate.
    expect(answerableByTheLoop()).toEqual([]);
    for (const p of RELEASE_PATHS) {
      expect(p.whoDecides.length, `${p.blocker} states no ruling owner`).toBeGreaterThan(60);
      expect(p.whoDecides, `${p.blocker} does not say whose ruling it is`).toMatch(/founder/i);
    }
  });

  it("would notice a path that handed a ruling to the loop", () => {
    // The rigged control: the check is only worth its green if it fires on the thing it forbids.
    const rigged = [{ ...RELEASE_PATHS[0]!, whoDecides: "The builder, once the tests are green." }];
    expect(answerableByTheLoop(rigged)).toHaveLength(1);
  });

  it("records how many of the outstanding decisions the loop may take, which is zero", () => {
    expect(RELEASE_PATHS.length, "no blocker is described, so this counts nothing").toBeGreaterThan(5);
    expect(answerableByTheLoop()).toEqual([]);
  });
});

describe("W355 the defaulted register is handed a different value, at home", () => {
  // A default promises the comparison can be asked another question, and a promise nobody collects
  // is a signature that reads as drivable while the only value it ever had is the default. W355
  // found twelve parameters in this tree whose parameter no call anywhere supplied; this is one of them.

  it("takes a release-path list it is given, not only its own", () => {
    const none = blockedSurfaceViolations(ROOT, BLOCKED_AT_W263, []);
    const own = blockedSurfaceViolations(ROOT, BLOCKED_AT_W263);
    expect(none, "an empty path list changed nothing").not.toEqual(own);
  });
});

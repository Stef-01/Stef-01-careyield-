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
  UNRUNNABLE_CITATIONS,
  type CitationDrive,
  drivesItsCheck,
  type NamedCheck,
  type NamedToken,
  horizonDefects,
  horizonTokens,
} from "./horizon-directions";
import { directions } from "./failure-direction";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { withTree } from "./planting";
import { existsSync } from "node:fs";
import { classDefects } from "./claim-classes";
import { controlDefects } from "./controls";
import { loadIntervals } from "@/registers/intervals";
import { openVault, readEvidence, resetVault, storeEvidence } from "@/credentials/vault";
import type { Membership } from "@/tenancy/tenancy";

/** The membership set W121's own suite uses, restated here because it is local to that file. */
const VAULT_MEMBERS: readonly Membership[] = [
  { practiceId: "prac-a", email: "owner@a.example", role: "owner" },
  { practiceId: "prac-b", email: "owner@b.example", role: "owner" },
];
import { populationDefects as q26PopulationDefects } from "./quarter-mutants-q26";

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
    expect(HORIZON_DIRECTION_BOUND).toContain("IS RUN AND NOT ONLY RESOLVED");
    expect(HORIZON_DIRECTION_BOUND).toContain("SOME ROWS CANNOT BE RUN AT ALL");
  });
});

describe("W371 every shown_loud citation is resolved to something runnable and CALLED", () => {
  // W363'S OWN BOUND NAMED THIS AS ITS GAP: a row resolved a test title and stopped. Each drive
  // below reaches the export the token names and hands it an input it must reject, and the drive is
  // CALLED here rather than recorded — which is the difference the bound was written about.
  //
  // The drives live in the test rather than in the register on purpose. `bounds.ts` imports that
  // module's bound, so a register importing every check it cites would complete a cycle of exactly
  // the shape W367 spent a unit digging out.
  const DRIVES: readonly CitationDrive[] = [
    {
      // Nothing declared: every class the horizon names must come back unanswered.
      token: "claim-classes.ts",
      drive: () => classDefects(ROOT, []).length > 0,
    },
    {
      token: "controls.ts",
      drive: () => controlDefects(ROOT, []).length > 0,
    },
    {
      // A row missing its cadence is refused at load rather than dropped, and says which row.
      token: "guidelineIntervals",
      drive: () => loadIntervals([{ id: "planted", condition: "x" }]).rejected.length > 0,
    },
    {
      // W18'S BOUNDARY, driven on the export the token names — not on `openVault`, which is what
      // the citation used to point at.
      token: "readEvidence",
      drive: () => {
        resetVault();
        const a = openVault(VAULT_MEMBERS, "owner@a.example", "prac-a");
        const b = openVault(VAULT_MEMBERS, "owner@b.example", "prac-b");
        if (!a.ok || !b.ok) return false;
        const stored = storeEvidence(b.grant, {
          credentialId: "cred-1",
          subjectClinicianId: "clin-1",
          filename: "b.pdf",
          contentType: "application/pdf",
          content: "JVBERi0=",
          uploadedOn: "2026-01-01",
        });
        if (!stored.ok) return false;
        // The refusal, and its control: B's own grant finds exactly what A's cannot.
        return (
          readEvidence(a.grant, stored.summary.ref).found === false &&
          readEvidence(b.grant, stored.summary.ref).found === true
        );
      },
    },
    {
      token: "src/quality/quarter-mutants-q26.ts",
      drive: () => q26PopulationDefects(ROOT, []).length > 0,
    },
  ];

  it("runs every citation that has a runnable form, and every one of them reports", () => {
    expect(drivesItsCheck(CHECKS_AT_W363, DRIVES)).toEqual([]);
    expect(DRIVES.length, "no citation is driven, so this checks nothing").toBeGreaterThan(4);
  });

  it("reports a citation nothing runs, which is the state W363 shipped in", () => {
    // NOT COMPARED AGAINST A MAP OF THE SAME REGISTER, which would be W317's shape: empty the
    // register and both sides go empty together. A floor, the one `what`, and two tokens by name.
    const undriven = drivesItsCheck(CHECKS_AT_W363, [], []);
    expect(undriven.length, "no citation is left undriven, so this checks nothing").toBeGreaterThan(4);
    expect(new Set(undriven.map((d) => d.what))).toEqual(
      new Set(["cites a test and nothing here runs the check it names"]),
    );
    expect(undriven.map((d) => d.token)).toContain("plan-ledger");
    expect(undriven.map((d) => d.token)).toContain("readEvidence");
  });

  it("reports a drive that did not report, so a citation cannot stand on a quiet check", () => {
    const silent: CitationDrive[] = [{ token: "controls.ts", drive: () => false }];
    expect(drivesItsCheck(CHECKS_AT_W363, silent).filter((d) => d.token === "controls.ts")).toEqual([
      { token: "controls.ts", what: "has a drive that did not report, so the citation stands on nothing" },
    ]);
  });

  it("refuses a token that is both driven and excused, because only one of them can be true", () => {
    const both = drivesItsCheck(CHECKS_AT_W363, [{ token: "plan-ledger", drive: () => true }]);
    expect(both.filter((d) => d.token === "plan-ledger")).toEqual([
      { token: "plan-ledger", what: "is both driven here and declared unrunnable, which cannot both be true" },
    ]);
  });

  it("reports a drive and an excusal for something that is not a shown_loud citation", () => {
    expect(drivesItsCheck([], [{ token: "gone", drive: () => true }], [{ token: "also-gone", remedy: "x" }])).toEqual([
      { token: "also-gone", what: "is excused here and is not a shown_loud citation" },
      { token: "gone", what: "is driven here and is not a shown_loud citation" },
    ]);
  });

  it("names the change that would make each unrunnable citation callable", () => {
    expect(UNRUNNABLE_CITATIONS.length, "nothing is excused, so the residue checks nothing").toBeGreaterThan(1);
    for (const { token, remedy } of UNRUNNABLE_CITATIONS) {
      expect(remedy.length, `${token} is excused without a remedy`).toBeGreaterThan(120);
      // The excuse is a fact about the tree: the check really has no module to call.
      expect(existsSync(path.join(ROOT, `src/quality/${token}.ts`)), `${token} has a module after all`).toBe(false);
    }
  });
});

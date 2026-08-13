// W276 verify gate: "both directions over W51's store registry; a store seeded under a practice no
// session can ever act for fails, and the check is proved on a deliberately incoherent seed."
//
// THE LAST CLAUSE DECIDES THE SHAPE OF THIS FILE. A coherence check run only against a healthy
// tree reports nothing, and reporting nothing is what a broken check does too. So the checker is
// pure and takes the fixture as an argument: it is driven against the tree's real stores AND
// against a fabricated one seeded under `prac-demo` — the exact id W272 found — without breaking
// the tree to prove it.
//
// The order is the same as W269's: the failing case first, before a single real store is read.

import { afterAll, describe, expect, it } from "vitest";
import {
  REFUSED_COHERENCE_SHAPES,
  SEEDED_STORES,
  coherenceViolations,
  mintableIds,
  opaqueStores,
  seededPractices,
} from "./fixture-coherence";
import { STORE_RESETTERS, resetAllStores } from "@/lib/stores";
import { getConsole, practiceRecord } from "@/console/store";
import type { PracticeId } from "@/domain/types";

const TODAY = "2026-08-14";

afterAll(() => {
  // This file runs every resetter and onboards two practices. Putting the world back is the
  // courtesy W269 had to learn: a suite that leaves fifty practices behind changes the state
  // every other suite runs against, and does it invisibly.
  resetAllStores();
});

describe("W276 the check is shown failing before it is believed", () => {
  it("reports a store seeded under a practice no session can act for", () => {
    // W272's defect, reconstructed: the booking rail under `prac-demo` while the console mints
    // `prac-1`. This is the case that went unnoticed for five years.
    const violations = coherenceViolations(
      new Map([["resetStore", ["prac-demo"]]]),
      ["prac-1", "prac-2"],
      SEEDED_STORES,
      Object.keys(STORE_RESETTERS),
    );
    expect(violations.incoherent).toEqual([{ resetter: "resetStore", practiceId: "prac-demo" }]);
  });

  it("reports each incoherent id separately, not one per store", () => {
    // A store seeded under two unmintable practices has two problems, and a checker that
    // collapsed them would understate a fixture that had drifted twice.
    const violations = coherenceViolations(
      new Map([["resetStore", ["prac-demo", "practice-old"]]]),
      ["prac-1"],
    );
    expect(violations.incoherent).toHaveLength(2);
  });

  it("says nothing when every seeded id is one the console mints", () => {
    // The other half of non-vacuity: a checker that always complained would make the real result
    // below meaningless too.
    const violations = coherenceViolations(new Map([["resetStore", ["prac-1"]]]), ["prac-1", "prac-2"]);
    expect(violations.incoherent).toEqual([]);
  });

  it("reports a resetter nobody classified, and an entry for a resetter that is gone", () => {
    // Both directions, over a fabricated registry so the assertion is about the checker rather
    // than about today's tree.
    const violations = coherenceViolations(
      new Map(),
      ["prac-1"],
      [
        { resetter: "resetGone", module: "src/gone.ts", readability: { kind: "readable" }, note: "x" },
      ],
      ["resetNew"],
    );
    expect(violations.undeclared).toEqual(["resetNew"]);
    expect(violations.stale).toEqual(["resetGone"]);
  });

  it("reports an opaque store declared without a remedy", () => {
    const violations = coherenceViolations(new Map(), ["prac-1"], [
      {
        resetter: "resetSilent",
        module: "src/silent.ts",
        readability: { kind: "opaque", remedy: "shrug" },
        note: "x",
      },
    ], ["resetSilent"]);
    expect(violations.opaqueWithoutRemedy).toEqual(["resetSilent"]);
  });
});

describe("W276 the tree's own fixture is coherent", () => {
  it("has nothing to report at all", () => {
    const mintable = mintableIds(3, TODAY);
    const violations = coherenceViolations(seededPractices(), mintable);
    expect(violations).toEqual({
      incoherent: [],
      undeclared: [],
      stale: [],
      opaqueWithoutRemedy: [],
    });
  });

  it("obtains the mintable ids by onboarding, not by reading a constant", () => {
    // W272's defect was that the constant and the console disagreed; a check reading the constant
    // would have agreed with the wrong side.
    //
    // THE ID LIST ALONE DOES NOT PROVE THIS — a function returning `["prac-1","prac-2","prac-3"]`
    // from a literal satisfies it perfectly, which is the same shape of weak assertion W269 and
    // W274 each had to strengthen. So the CONSOLE is checked afterwards: the ids exist because
    // three practices were really onboarded, and each id resolves to a record.
    const ids = mintableIds(3, TODAY);
    expect(ids).toEqual(["prac-1", "prac-2", "prac-3"]);
    expect(getConsole().practices).toHaveLength(3);
    for (const id of ids) {
      expect(practiceRecord(id as PracticeId), `${id} was minted without a record`).toBeTruthy();
    }
  });

  it("finds practice identity in the stores that actually seed it", () => {
    // Non-vacuity for the clean result above: if no store seeded a practice at all, every
    // coherence assertion would be checking an empty set.
    const seeded = seededPractices();
    const withPractices = [...seeded.entries()].filter(([, ids]) => ids.length > 0);
    expect(withPractices.map(([name]) => name).sort()).toEqual(["resetAudit", "resetStore"]);
    for (const [, ids] of withPractices) expect(ids).toEqual(["prac-1"]);
  });

  it("reads the stores rather than their source", () => {
    // Two modules carry `"prac-console"` in comments about a defect W206 removed. A source scan
    // reports both as incoherent, and both reports are wrong — so this is checked, not asserted.
    const seeded = seededPractices();
    expect(seeded.get("resetAudit")).not.toContain("prac-console");
    expect(seeded.get("resetComplaints")).toEqual([]);
  });
});

describe("W276 the stores it cannot see into are reported, not called clean", () => {
  it("names every store whose resetter returns nothing", () => {
    const opaque = opaqueStores().map((s) => s.resetter).sort();
    expect(opaque).toEqual([
      "resetEducation",
      "resetLedger",
      "resetPathwayRegistry",
      "resetRateLimits",
      "resetVault",
      "resetVerticals",
    ]);
  });

  it("checks the classification against what the resetters actually return", () => {
    // THE DIRECTION THAT MATTERS. A store declared readable that returns nothing would be reported
    // as holding no practice identity, which is the failure this register exists to refuse — and
    // a store declared opaque that has since started returning state is a remedy already applied
    // and never recorded.
    for (const entry of SEEDED_STORES) {
      const returns = STORE_RESETTERS[entry.resetter]!() !== undefined;
      expect(returns, `${entry.resetter} is declared ${entry.readability.kind}`).toBe(
        entry.readability.kind === "readable",
      );
    }
  });

  it("gives every opaque store the same one-line remedy", () => {
    // W210's rule: a finding recorded without the change that would make it actionable is one
    // that sits for two years. Six stores, one sentence, because it is one gap six times.
    const remedies = new Set(
      opaqueStores().map((s) => (s.readability as { remedy: string }).remedy),
    );
    expect(remedies.size).toBe(1);
    expect([...remedies][0]).toContain("W265");
  });

  it("explains what each store seeds, whether or not it can be read", () => {
    expect(SEEDED_STORES).toHaveLength(Object.keys(STORE_RESETTERS).length);
    for (const entry of SEEDED_STORES) {
      expect(entry.note.length, `${entry.resetter} is classified without a note`).toBeGreaterThan(60);
      expect(entry.module, `${entry.resetter} names no module`).toMatch(/^src\/.*\.ts$/);
    }
  });
});

describe("W276 what the check refuses is written down", () => {
  it("names the five shapes it refuses, each with its reason", () => {
    expect(Object.keys(REFUSED_COHERENCE_SHAPES).sort()).toEqual([
      "a_check_that_cannot_be_shown_failing",
      "comparing_against_a_constant",
      "grepping_the_source_for_practice_ids",
      "one_direction_only",
      "reporting_opaque_stores_as_clean",
    ]);
    for (const [name, why] of Object.entries(REFUSED_COHERENCE_SHAPES)) {
      expect(why.length, `${name} is refused without a reason`).toBeGreaterThan(80);
    }
    expect(REFUSED_COHERENCE_SHAPES.comparing_against_a_constant).toContain("W272");
  });
});

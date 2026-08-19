import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACCESS_PATHS } from "@/privacy/access-y5";
import { reachableFromApp } from "@/security/reachability";
import { BLIND_SPOTS } from "./blind-spots";
import { copyTree, withPlantedIn } from "./planting";
import {
  type Excuse,
  EXCUSE_BOUND,
  excuses,
  variantsOfDeclaredSentences,
  blindnessArms,
  catalogueWritersTakingAPractice,
  copyTablesTakingMoreThanAReason,
  excuseDefects,
  liveCallersOfSyntheticResets,
  sharedExcuses,
  storeReadsGiving,
  unfalsifiableExcuses,
  withheldClassesThatArePersisted,
} from "./shared-excuses";

const ROOT = process.cwd();

/** A copy the probe may edit, removed however the probe ends. */
function inACopy<T>(probe: (copy: string) => T): T {
  const copy = copyTree(ROOT);
  try {
    return probe(copy);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

/** Plant one module of a copied tree, changed the way the falsifier's sentence forbids. */
function withChanged<T>(copy: string, module: string, change: (source: string) => string, probe: () => T): T {
  const source = readFileSync(path.join(copy, module), "utf8");
  return withPlantedIn(copy, { [module]: change(source) }, probe);
}

const named = (name: string): Excuse => {
  const row = excuses().find((excuse) => excuse.name === name);
  expect(row, name).toBeDefined();
  return row as Excuse;
};

describe("W356 the tree's shared excuses", () => {
  it("agrees with the tree in three directions", () => {
    expect(excuseDefects(ROOT)).toEqual([]);
  });

  it("finds a sentence more than one entry stands behind, and says how many", () => {
    const found = sharedExcuses(ROOT);
    expect(found.length).toBeGreaterThan(1);
    const worst = found[0];
    expect(worst?.entries).toBeGreaterThan(2);
    // The population is not a list here: the biggest one is whichever the tree gives most, and
    // asserting its NAME rather than its size is what makes a shrinking register visible.
    expect(excuses().map((excuse) => excuse.text)).toContain(worst?.text);
  });

  it("reads both spellings, because the spelling is not the defect", () => {
    const found = sharedExcuses(ROOT);
    // `NOT_CALLABLE` is named once and referenced; the store-reads sentence is typed out eight times.
    const byReference = found.find((shared) => shared.text.startsWith("The detector and its comparison"));
    const byLiteral = found.find((shared) => shared.text === "Synthetic reset; no live read.");
    expect(byReference?.entries).toBeGreaterThan(byLiteral?.entries ?? 0);
    expect(byLiteral?.entries).toBeGreaterThan(1);
  });

  it("skips the codes a register switches on, which are not sentences", () => {
    const texts = sharedExcuses(ROOT).map((shared) => shared.text);
    expect(texts).not.toContain("attested_before_withdrawal");
    expect(texts.every((text) => text.includes(" "))).toBe(true);
  });

  it("names each sentence once, and says which reading applies", () => {
    expect(new Set(excuses().map((excuse) => excuse.name)).size).toBe(excuses().length);
    expect(new Set(excuses().map((excuse) => excuse.text)).size).toBe(excuses().length);
    for (const excuse of excuses()) {
      expect(excuse.why.length, excuse.name).toBeGreaterThan(120);
      expect(excuse.claim.length, excuse.name).toBeGreaterThan(20);
      if (excuse.falsifier === null) expect(excuse.settledBy?.length ?? 0, excuse.name).toBeGreaterThan(60);
      else expect(excuse.settledBy, excuse.name).toBeUndefined();
    }
  });

  it("has more sentences something can contradict than sentences nothing can", () => {
    const unfalsifiable = unfalsifiableExcuses().length;
    expect(unfalsifiable).toBeGreaterThan(0);
    expect(excuses().length - unfalsifiable).toBeGreaterThan(unfalsifiable);
  });

  it("reports the unfalsifiable ones by name, each with what would settle it", () => {
    const report = unfalsifiableExcuses();
    expect(report.map((row) => row.name)).toContain("the_register_itself");
    for (const row of report) expect(row.settledBy.length, row.name).toBeGreaterThan(60);
  });
});

describe("W356 the falsifiers, driven", () => {
  it("NOT_CALLABLE dies when a module standing behind it exports a detector taking a root", () => {
    const row = named("NOT_CALLABLE");
    // The modules that stand behind it come from the register, not from a name typed here.
    const borrowing = Object.entries(BLIND_SPOTS)
      .filter(([, blindness]) => blindness.kind === "undemonstrated" && blindness.whyNotPlantable === row.text)
      .map(([module]) => module);
    expect(borrowing.length).toBeGreaterThan(2);
    inACopy((copy) => {
      expect(row.falsifier?.(copy, row.text)).toEqual([]);
      // Plant the export its own sentence says the module does not have.
      const victim = borrowing[0] as string;
      withChanged(
        copy,
        victim,
        (source) => `${source}\nexport function plantedDetector(\n  root: string,\n): string[] {\n  return [root];\n}\n`,
        () => {
          expect(row.falsifier?.(copy, row.text)).toContain(victim);
        },
      );
    });
  });

  it("NOT_A_SILENCE dies when `Blindness` grows an arm that demonstrates by noise", () => {
    const row = named("NOT_A_SILENCE");
    inACopy((copy) => {
      expect(blindnessArms(copy)).toEqual(["demonstrated", "undemonstrated"]);
      expect(row.falsifier?.(copy, row.text)).toEqual([]);
      withChanged(
        copy,
        "src/quality/blind-spots.ts",
        (source) =>
          source.replace(
            '| { kind: "undemonstrated"; bound: string; whyNotPlantable: string };',
            '| { kind: "undemonstrated"; bound: string; whyNotPlantable: string }\n  | { kind: "demonstrated_by_noise"; bound: string };',
          ),
        () => {
          expect(blindnessArms(copy)).toContain("demonstrated_by_noise");
          expect(row.falsifier?.(copy, row.text)).toEqual(["demonstrated_by_noise"]);
        },
      );
    });
  });

  it("`Synthetic reset` dies on a caller the app can reach, and not on one it cannot", () => {
    const row = named("synthetic_reset");
    const entries = storeReadsGiving(row.text);
    expect(entries.length).toBeGreaterThan(1);
    // THE NEGATIVE IS ALREADY IN THE TREE: a quality register calls `resetComplaints` in a probe,
    // and it is not a live read because nothing serving a request reaches that register.
    expect(readFileSync(path.join(ROOT, "src/quality/flattering-numbers.ts"), "utf8")).toContain(
      "resetComplaints()",
    );
    expect(liveCallersOfSyntheticResets(ROOT, row.text)).toEqual([]);
    inACopy((copy) => {
      const reachable = reachableFromApp(copy).files.filter(
        (file) => file.startsWith("src/") && !entries.some((entry) => entry.startsWith(`${file}::`)),
      );
      const victim = reachable[0];
      expect(victim, "the app reaches at least one module that is not a store in the register").toBeDefined();
      withChanged(
        copy,
        victim as string,
        (source) => `${source}\nexport function plantedCaller(): void {\n  resetComplaints();\n}\n`,
        () => {
          expect(liveCallersOfSyntheticResets(copy, row.text).join("|")).toContain(victim as string);
        },
      );
    });
  });

  it("`product-level catalogue` dies when a writer's signature takes a practice", () => {
    const row = named("product_catalogue");
    const entries = storeReadsGiving(row.text);
    expect(entries.length).toBeGreaterThan(1);
    inACopy((copy) => {
      expect(catalogueWritersTakingAPractice(copy, row.text)).toEqual([]);
      const [module, fn] = (entries[0] as string).split("::");
      withChanged(
        copy,
        module as string,
        (source) => source.replace(`export function ${fn}(`, `export function ${fn}(practiceId: string, `),
        () => {
          expect(catalogueWritersTakingAPractice(copy, row.text)).toEqual([entries[0]]);
        },
      );
    });
  });

  it("`copy table` dies when a rejection explainer grows a second parameter", () => {
    const row = named("rejection_copy_table");
    inACopy((copy) => {
      expect(copyTablesTakingMoreThanAReason(copy, row.text)).toEqual([]);
      withChanged(
        copy,
        "src/referrals/document.ts",
        (source) =>
          source.replace(
            "export function explainReferralRejection(reason: ReferralRejection): string {",
            "export function explainReferralRejection(reason: ReferralRejection, practiceId: string): string {",
          ),
        () => {
          expect(copyTablesTakingMoreThanAReason(copy, row.text)).toEqual([
            "src/referrals/document.ts::explainReferralRejection",
          ]);
        },
      );
    });
  });

  it("`derived is not held` dies on a withheld module W106 does not call derived", () => {
    const row = named("derived_is_not_held");
    expect(withheldClassesThatArePersisted(row.text)).toEqual([]);
    // The register withholds one module for a DIFFERENT reason, and that module is stored — so
    // handing this falsifier that other sentence is the same question with a known answer.
    const other = ACCESS_PATHS.find(
      (declared) =>
        declared.disposition.kind === "withheld" && declared.disposition.why !== row.text,
    );
    expect(other, "the register withholds something for another reason").toBeDefined();
    const sentence = (other?.disposition as { kind: "withheld"; why: string }).why;
    expect(withheldClassesThatArePersisted(sentence)).toEqual([
      expect.stringContaining(other?.module as string),
    ]);
  });
});

describe("W356 the near-copies, which is the bound's live clause", () => {
  it("names the tree's own variant — a sentence typed a third time with two words changed", () => {
    expect(variantsOfDeclaredSentences(ROOT)).toEqual(["one_quarter_one_reader <- a variant given once"]);
  });

  it("reports a planted variant, and not the sentence it is a variant of", () => {
    const row = named("rejection_copy_table");
    const variant = `${row.text.slice(0, 60)}NOTHING PASSES THROUGH IT AT ALL.`;
    const second = `${row.text.slice(0, 60)}NOR DOES ANYTHING ELSE.`;
    inACopy((copy) => {
      withPlantedIn(
        copy,
        {
          "src/quality/planted-variant.ts": `export const NEARLY = [{ rationale: "${variant}" }];\n`,
          // A SECOND variant of the same sentence: the report names the sentence that has
          // near-copies, not each copy, so two of them must still come back as one entry.
          "src/quality/planted-variant-two.ts": `export const ALSO = [{ rationale: "${second}" }];\n`,
          // The negative: the same sentence spelled EXACTLY, which is a third giving rather than a
          // variant, and must not be reported as one.
          "src/quality/planted-exact.ts": `export const SAME = [{ rationale: "${row.text}" }];\n`,
        },
        () => {
          const found = variantsOfDeclaredSentences(copy);
          expect(found).toContain("rejection_copy_table <- a variant given once");
          expect(found.filter((entry) => entry.startsWith("rejection_copy_table"))).toHaveLength(1);
        },
      );
    });
  });
});

describe("W356 the rule, driven", () => {
  const oneRow = (over: Partial<Excuse>): Excuse => ({
    name: "planted",
    text: "a planted sentence nothing in the tree gives",
    claim: "a planted claim about the tree",
    falsifier: () => [],
    why: "a planted row",
    ...over,
  });

  it("reports a sentence more than one entry gives that no row reads", () => {
    inACopy((copy) => {
      const sentence = "a sentence two entries were given without anybody reading it twice";
      withPlantedIn(
        copy,
        {
          "src/quality/planted-register.ts": `export const PLANTED = [\n  { reason: "${sentence}" },\n  { reason: "${sentence}" },\n];\n`,
        },
        () => {
          expect(sharedExcuses(copy).map((shared) => shared.text)).toContain(sentence);
          const defects = excuseDefects(copy);
          expect(defects.map((defect) => defect.what).join("|")).toContain("no row reads it");
        },
      );
    });
  });

  it("reports a row whose sentence the tree no longer shares", () => {
    const defects = excuseDefects(ROOT, [...excuses(), oneRow({})]);
    expect(defects).toEqual([
      { excuse: "planted", what: "declared shared, and the tree gives it once or not at all" },
    ]);
  });

  it("reports a row that nothing can contradict and that says nothing would settle it", () => {
    const row = named("planted_row");
    const defects = excuseDefects(ROOT, [
      ...excuses().filter((excuse) => excuse.name !== row.name),
      { ...row, falsifier: null, settledBy: "  " },
    ]);
    expect(defects).toEqual([
      { excuse: "planted_row", what: "nothing can contradict it and no row says what would" },
    ]);
  });

  it("reports a sentence the tree contradicts, with the entry that contradicts it", () => {
    const row = named("synthetic_reset");
    const defects = excuseDefects(ROOT, [
      ...excuses().filter((excuse) => excuse.name !== row.name),
      { ...row, falsifier: () => ["src/x/store.ts::resetX <- app/page.tsx"] },
    ]);
    expect(defects).toEqual([
      { excuse: "synthetic_reset", what: "contradicted by src/x/store.ts::resetX <- app/page.tsx" },
    ]);
  });

  it("counts the entries rather than the modules, because thirty in one file is the finding", () => {
    const worst = sharedExcuses(ROOT)[0];
    expect(worst?.modules.length).toBe(1);
    expect(worst?.entries).toBeGreaterThan(worst?.modules.length ?? 0);
  });
});

describe("W356 the bound", () => {
  it("says a sentence given once is invisible, which is most of the tree's reasons", () => {
    expect(EXCUSE_BOUND).toContain("A SENTENCE GIVEN ONCE IS INVISIBLE HERE");
    expect(EXCUSE_BOUND).toContain("the scan grows a normalisation");
  });

  it("says a falsifier settles a clause rather than a sentence, and the register keeps to it", () => {
    expect(EXCUSE_BOUND).toContain("A FALSIFIER SETTLES ONE CLAUSE, NOT A SENTENCE");
    // The claim each row states is the CLAUSE its falsifier reads, never the sentence itself.
    for (const excuse of excuses()) {
      if (excuse.falsifier === null) continue;
      expect(excuse.text, excuse.name).not.toContain(excuse.claim);
      expect(excuse.claim, excuse.name).not.toBe(excuse.text);
    }
  });

  it("keeps its own subjects out of reason position, which is the third clause", () => {
    expect(EXCUSE_BOUND).toContain("THE SCAN READS A FIELD NAME");
    const shared = sharedExcuses(ROOT);
    // The same filter over a module that IS in the population, so silence about this one is a
    // fact about where the sentences live rather than about a filter that finds nothing anywhere.
    expect(shared.filter((row) => row.modules.includes("src/quality/blind-spots.ts")).length)
      .toBeGreaterThan(0);
    expect(shared.filter((row) => row.modules.includes("src/quality/shared-excuses.ts"))).toEqual([]);
  });
});

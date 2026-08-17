// W314 verify gate: "every numeric claim in a module header or doc comment either resolves to
// something derived or is declared unresolvable with its reason; the four stale counts of Q23 and
// Q24 reproduced as planted headers and each one reported."
//
// THE FOUR ARE THE TREE'S OWN, QUOTED FROM WHERE IT RECORDS THEM. `DRIVE_BOUND` says it "said
// thirteen executed while seventeen were, because four registers arrived after it was written";
// W297's header names "the other thirty-three" when thirty-four were and "four are cited" when
// three were; `FIXTURE_BOUND` says it "counted the register in words" and was wrong within two
// units. Each is planted here as the header it would have been, with a derivation that knows the
// true number, and each must be reported — which is the only way to show this register would have
// caught what the tree had to catch by hand.
//
// AND THE CLASSIFICATION IS WHERE THE JUDGEMENT LIVES, so the tests read it rather than trusting
// it: every `open` row argues its own case, every kind argues itself once, and the `derived` rows
// are the only ones with teeth.

import { describe, expect, it } from "vitest";
import {
  CLAIMS,
  CLAIM_NOUNS,
  PROSE_BOUND,
  RESOLUTION_KINDS,
  type DeclaredClaim,
  type ResolutionKind,
  claimDefects,
  proseClaims,
} from "./prose-numbers";
import { withRoot } from "./refusal-branches";

const ROOT = process.cwd();
const kindsOf = (kind: ResolutionKind) => CLAIMS.filter((c) => c.resolution.kind === kind);

describe("W314 every numeric claim in this tree's prose is classified", () => {
  it("agrees with the tree in three directions", () => {
    // THE UNIT. A claim nobody classified, a classification for a sentence that has been rewritten,
    // and a derived claim the tree disagrees with — the third is what this exists for and the first
    // two are what keep it honest as the prose moves.
    expect(claimDefects(ROOT, CLAIMS), "a claim nobody classified, or one the tree has moved past").toEqual(
      [],
    );
    expect(proseClaims(ROOT).length, "the scan found nothing, so the register is vacuous").toBeGreaterThan(
      100,
    );
  });

  it("derives the claims that say what the tree holds, and they are not the rare case", () => {
    // W314 CORRECTED SEVEN OF THESE ON ARRIVAL. `blocked-surface.ts` said sixteen rows were blocked
    // when W310 had made it eighteen; `bounds.ts` said eight modules export a bound when its own
    // register held twenty-two; the census said twenty-six files walk the tree when it holds
    // fifty-four. None was a lie anybody told and every one read as fact.
    expect(kindsOf("derived").length, "nothing is derived, so nothing is checked").toBeGreaterThan(8);
    for (const claim of kindsOf("derived")) {
      const resolution = claim.resolution as { derive: (root: string) => number };
      expect(resolution.derive(ROOT), `${claim.module} derives nothing`).toBeGreaterThan(0);
    }
  });

  it("argues each class once, and each open row on its own", () => {
    for (const [kind, why] of Object.entries(RESOLUTION_KINDS)) {
      expect(why.length, `${kind} is a class nobody argued`).toBeGreaterThan(200);
    }
    for (const claim of kindsOf("open")) {
      const why = (claim.resolution as { why: string }).why;
      expect(why.length, `${claim.module} :: ${claim.text} is open without a reason`).toBeGreaterThan(150);
    }
    // A CEILING RATHER THAN A FLOOR, which is W304's lesson: `open` is the class that goes stale
    // silently, so its growth is the thing to notice. `at_the_unit` may grow freely — history
    // accumulates — and `derived` growing is the register getting stronger.
    expect(kindsOf("open").length, "the unresolved class grew").toBeLessThanOrEqual(5);
    expect(kindsOf("open").length).toBeLessThan(kindsOf("derived").length);
  });

  it("keeps the vocabulary that decides what a claim is, and says it is closed", () => {
    // The vocabulary IS the surface. Scanning every number in every comment finds more than a
    // thousand in the headers alone, and a register of that size is one nobody reads.
    expect(CLAIM_NOUNS.length).toBeGreaterThan(20);
    expect(new Set(CLAIM_NOUNS).size, "a noun is listed twice").toBe(CLAIM_NOUNS.length);
    expect(PROSE_BOUND).toContain("closed vocabulary");
    expect(PROSE_BOUND).toContain("a judgement a program cannot make".toUpperCase().slice(0, 10));
    expect(PROSE_BOUND.length).toBeGreaterThan(500);
  });
});

describe("W314 the four counts that went stale in Q23 and Q24, replanted", () => {
  /** The tree's own record of each: what the sentence said, and what was true. */
  const STALE = [
    { unit: "W289", claim: "thirteen drives", sentence: "thirteen drives were executed and the rest cannot be", said: 13, true_: 17 },
    { unit: "W297", claim: "thirty-three modules", sentence: "the other thirty-three modules carry no bound", said: 33, true_: 34 },
    { unit: "W284", claim: "four registers", sentence: "four registers are cited by the resolver", said: 4, true_: 3 },
    { unit: "W288", claim: "five composed sites", sentence: "five composed sites are driven with real inputs", said: 5, true_: 6 },
  ];

  it("reports every one of them, from the header it would have lived in", () => {
    // Each planted as a real module header in a constructed root — not asserted about this tree,
    // which no longer contains any of them, so a check reading only here would pass on all four
    // forever. The derivation knows the number that was true; the header states the one that was
    // written; the register reports the gap.
    for (const stale of STALE) {
      const module = "src/planted/w314-probe.ts";
      const declared: DeclaredClaim[] = [
        { module, text: stale.claim, resolution: { kind: "derived", derive: () => stale.true_ } },
      ];
      const reported = withRoot(
        { [module]: `// ${stale.unit}: ${stale.sentence}.\nexport const x = 1;\n` },
        (root) => claimDefects(root, declared),
      );
      expect(reported, `${stale.unit}'s stale count went unreported`).toEqual([
        {
          claim: `${module} :: ${stale.claim}`,
          what: `says ${stale.said} and the tree holds ${stale.true_}`,
        },
      ]);
    }
    expect(STALE.length).toBe(4);
  });

  it("stays quiet on the same header once the number is right", () => {
    // The other half, and without it the probe above is satisfied by a register that reports every
    // claim it is given — which is the over-wide sweep W288 shipped and had to narrow.
    for (const stale of STALE) {
      const module = "src/planted/w314-probe.ts";
      const declared: DeclaredClaim[] = [
        { module, text: stale.claim, resolution: { kind: "derived", derive: () => stale.said } },
      ];
      const reported = withRoot(
        { [module]: `// ${stale.unit}: ${stale.sentence}.\nexport const x = 1;\n` },
        (root) => claimDefects(root, declared),
      );
      expect(reported, `${stale.unit}'s correct count was reported anyway`).toEqual([]);
    }
  });

  it("leaves a claim filed as history alone, which is what makes the classes mean anything", () => {
    // The distinction the whole register turns on: the same sentence, classified two ways, checked
    // in one of them. A register that checked both would be asking today's tree to answer a
    // question about a Tuesday.
    const module = "src/planted/w314-probe.ts";
    const reported = withRoot(
      { [module]: "// W289: thirteen drives were executed and the rest cannot be.\nexport const x = 1;\n" },
      (root) => claimDefects(root, [{ module, text: "thirteen drives", resolution: { kind: "at_the_unit" } }]),
    );
    expect(reported).toEqual([]);
  });
});

describe("W314 the scan reads headers and doc comments, and nothing else", () => {
  it("finds a claim in a header and one in a doc comment", () => {
    const found = withRoot(
      {
        "src/planted/head.ts": "// W1: four registers walk this tree.\nimport path from \"node:path\";\nexport const a = path;\n",
        "src/planted/doc.ts": "// W1: a module.\nimport path from \"node:path\";\n\n/** Reads three files. */\nexport const b = path;\n",
      },
      (root) => proseClaims(root).map((c) => `${c.where} ${c.text}`),
    );
    expect(found.sort()).toEqual(["doc three files", "header four registers"]);
  });

  it("does not read a claim out of code, which is where a count is already derived", () => {
    // A number in an expression is not a claim about the tree — it is the tree. Reading them would
    // report every array index and every threshold, and the register would be noise.
    const found = withRoot(
      { "src/planted/code.ts": '// W1: a module.\nimport path from "node:path";\nexport const n = ["four modules", 4];\nexport const p = path;\n' },
      (root) => proseClaims(root).map((c) => c.text),
    );
    expect(found, "a literal in code was read as a claim about the tree").toEqual([]);
  });

  it("takes the number the sentence states, not the first number on the line", () => {
    const found = withRoot(
      { "src/planted/two.ts": "// W1: after twelve units, seven registers walk the tree.\nimport path from \"node:path\";\nexport const a = path;\n" },
      (root) => proseClaims(root).map((c) => `${c.text}=${c.number}`),
    );
    expect(found).toEqual(["seven registers=7"]);
  });
});

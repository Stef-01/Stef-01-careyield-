// W393 verify gate: W314's number reading measured against a second derivation over every
// number-word this tree writes, and a compound the vocabulary has never seen planted to prove it
// does not resolve to the unit on its right.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  MISREAD_AT_W393,
  NUMBER_BOUND,
  NUMBER_WORDS,
  SCALES,
  misreadDefects,
  misreadings,
  runsIn,
  tailAfterScale,
  tokens,
  valueOf,
  wordsInTree,
  type Prose,
} from "./number-words";
import { CLAIMS, proseClaims, proseOf } from "./prose-numbers";
import { sourceModules } from "./tree-walks";

const ROOT = path.resolve(__dirname, "..", "..");

/** The prose W314 reads, read once and handed to both. */
const prose: Prose[] = sourceModules(ROOT).map((file) => {
  const { header, docs } = proseOf(readFileSync(file, "utf8"));
  return {
    module: path.relative(ROOT, file).split(path.sep).join("/"),
    text: `${header}\n${docs}`,
  };
});

describe("W393 the parse", () => {
  it("adds a hyphenated compound rather than looking one up", () => {
    // The whole reason this is a parse. W383's map holds `fifty-two` because somebody derived tens
    // times units; this reads f-i-f-t-y and t-w-o and adds them, so no spelling can be missing.
    expect(valueOf(["fifty", "two"])).toBe(52);
    expect(valueOf(["seventy", "nine"])).toBe(79);
    expect(runsIn("fifty-two sites")[0]!.value).toBe(52);
  });

  it("multiplies on a hundred and banks on a thousand", () => {
    expect(valueOf(["one", "hundred", "fifty", "two"])).toBe(152);
    expect(valueOf(["one", "thousand", "three", "hundred", "fifty"])).toBe(
      1350,
    );
    expect(valueOf(["seven", "thousand", "nine", "hundred"])).toBe(7900);
    expect(valueOf(["sixty", "four", "thousand"])).toBe(64000);
    // A scale with nothing standing in front of it is one of it, which is what the sentence means.
    expect(valueOf(["hundred"])).toBe(100);
  });

  it("joins across `and` only when a scale is already standing", () => {
    // BOTH DIRECTIONS, because either rule alone is wrong on this tree's own sentences. `acceptances.ts`
    // writes "three and two" meaning two numbers; `assertion-vocabulary.ts` writes "one hundred and
    // fifty-two" meaning one. A reader who joined on every `and` would report five where the tree
    // said three, which is a second reading wronger than the first.
    expect(runsIn("three and two").map((r) => r.value)).toEqual([3, 2]);
    expect(runsIn("six and sixty-eight").map((r) => r.value)).toEqual([6, 68]);
    expect(runsIn("one hundred and fifty-two").map((r) => r.value)).toEqual([
      152,
    ]);
    expect(
      runsIn("one thousand three hundred and fifty").map((r) => r.value),
    ).toEqual([1350]);
  });

  it("reads a number split over two lines of one comment, and stops at a full stop", () => {
    // `assertion-vocabulary.ts` really does write this across a line break, so the furniture between
    // the words is `\n// ` and a reader that stopped there would see two numbers.
    expect(
      runsIn("in one hundred and\n// fifty-two of them").map((r) => r.value),
    ).toEqual([152]);
    // Punctuation is not furniture: two sentences are two numbers.
    expect(runsIn("held four. Five arrived").map((r) => r.value)).toEqual([
      4, 5,
    ]);
  });

  it("declines a word that is not a number, including the ones an object answers for", () => {
    // A LOOKUP THAT ANSWERED WHEN IT SHOULD DECLINE, which is this quarter's shape in miniature and
    // was in the first survey's output: `ADDENDS["constructor"]` on a plain object literal returns a
    // function, so the reading reported `constructor` as a number-word this tree writes.
    expect(runsIn("the constructor and the prototype")).toEqual([]);
    expect(runsIn("toString valueOf hasOwnProperty")).toEqual([]);
    expect(tokens("two-and-a-half").map((t) => t.word)).toContain("two");
  });

  it("takes the part of a run a tens-and-units vocabulary could express", () => {
    expect(tailAfterScale(["one", "hundred", "fifty", "two"])).toEqual([
      "fifty",
      "two",
    ]);
    expect(tailAfterScale(["sixty", "four", "thousand"])).toEqual([]);
    expect(tailAfterScale(["fifty", "two"])).toEqual(["fifty", "two"]);
  });
});

describe("W393 every number-word the tree writes", () => {
  it("is derived, and it contains the two W314's vocabulary has no room for", () => {
    const written = wordsInTree(prose);
    // Guard against a vacuous pass: an empty reading satisfies every assertion below.
    expect(written.length).toBeGreaterThan(20);
    expect(written.every((w) => NUMBER_WORDS.includes(w))).toBe(true);
    // THE HALF THAT CANNOT BE FIXED BY ADDING ROWS. W383 derived every compound of tens and units,
    // which reaches ninety-nine and stops. These two are written by this tree's own prose and no
    // vocabulary of tens times units can express a number holding either.
    for (const scale of Object.keys(SCALES)) expect(written).toContain(scale);
  });

  it("finds numbers above that ceiling in this tree's real sentences", () => {
    const scaled = prose.flatMap((p) =>
      runsIn(p.text).filter((r) => r.value > 99),
    );
    expect(scaled.length).toBeGreaterThan(10);
    expect(scaled.map((r) => r.value)).toContain(1350);
  });
});

describe("W393 the two readings, measured against each other", () => {
  it("agrees with W314 except where the register is declared to be wrong", () => {
    expect(misreadDefects(misreadings(proseClaims(ROOT), prose))).toEqual([]);
  });

  it("holds W323's number, which the register has recorded as its tail since it was filed", () => {
    const found = misreadings(proseClaims(ROOT), prose);
    expect(found.map((m) => m.claim)).toEqual(
      MISREAD_AT_W393.map((d) => d.claim),
    );
    const row = found.find((m) =>
      m.claim.startsWith("src/quality/assertion-vocabulary.ts"),
    );
    expect(row).toBeDefined();
    expect(row!.parsed).toBe(152);
    expect(row!.recorded).toBe(52);
    // And W314 really does still hold it that way, read from its own declared list rather than
    // from this module's copy of the number.
    const declared = CLAIMS.find(
      (c) =>
        c.module === "src/quality/assertion-vocabulary.ts" &&
        c.text === "fifty-two sites",
    );
    expect(declared).toBeDefined();
    expect(declared!.resolution.kind).toBe("at_the_unit");
  });

  it("reports a compound the vocabulary has never seen, planted in front of a noun it counts", () => {
    // THE GATE'S OWN PROBE. `CLAIM_RE` has no word above ninety-nine, so `one hundred and forty
    // modules` reaches W314 as `forty modules` — the unit on its right — and this reading must say
    // so. The claim handed in is exactly what W314's scan produces for that sentence.
    const planted: Prose[] = [
      {
        module: "src/planted/probe.ts",
        text: "// It walks one hundred and forty modules today.",
      },
    ];
    const found = misreadings(
      [{ module: "src/planted/probe.ts", text: "forty modules", number: 40 }],
      planted,
    );
    expect(found).toHaveLength(1);
    expect(found[0]!.parsed).toBe(140);
    expect(found[0]!.recorded).toBe(40);
    expect(misreadDefects(found, [])).toHaveLength(1);
  });

  it("does not report the same sentence once the number is one the vocabulary holds", () => {
    // The control, differing in the number and nothing else: `forty modules` with no scale in front
    // of it is a claim both readings agree about, and a register reporting it would report the tree.
    const planted: Prose[] = [
      {
        module: "src/planted/probe.ts",
        text: "// It walks forty modules today.",
      },
    ];
    expect(
      misreadings(
        [{ module: "src/planted/probe.ts", text: "forty modules", number: 40 }],
        planted,
      ),
    ).toEqual([]);
  });

  it("does not attribute a run to a claim that sits somewhere else in the file", () => {
    // The first version reported ten of these: `five` is inside `Fifty-five`, so any claim in the
    // module holding the word `five` was pinned to a paragraph it had nothing to do with. The anchor
    // is the noun that follows the run AND the run's tail being the number recorded.
    const planted: Prose[] = [
      {
        module: "src/planted/probe.ts",
        text: "// One hundred and forty rows arrived.\n// Separately, forty modules are watched.",
      },
    ];
    expect(
      misreadings(
        [{ module: "src/planted/probe.ts", text: "forty modules", number: 40 }],
        planted,
      ),
    ).toEqual([]);
  });

  it("reports a declaration the tree has moved past", () => {
    const gone = [
      {
        claim: "src/gone.ts :: two files",
        parsed: 102,
        recorded: 2,
        disposition: "x".repeat(130),
      },
    ];
    expect(misreadDefects([], gone)).toEqual([
      {
        claim: "src/gone.ts :: two files",
        what: "is declared here and the two readings now agree about it",
      },
    ]);
  });

  it("reports a declaration whose numbers have moved, and one with no argument", () => {
    const found = [
      {
        claim: "src/x.ts :: two files",
        recorded: 2,
        run: "one hundred and two",
        parsed: 102,
      },
    ];
    expect(
      misreadDefects(found, [
        {
          claim: "src/x.ts :: two files",
          parsed: 99,
          recorded: 2,
          disposition: "x".repeat(130),
        },
      ]),
    ).toEqual([
      {
        claim: "src/x.ts :: two files",
        what: "is declared as 99 against 2 and reads 102 against 2",
      },
    ]);
    expect(
      misreadDefects(found, [
        {
          claim: "src/x.ts :: two files",
          parsed: 102,
          recorded: 2,
          disposition: "because",
        },
      ]),
    ).toEqual([
      {
        claim: "src/x.ts :: two files",
        what: "is declared without an argument for leaving it as it is",
      },
    ]);
  });
});

describe("W393 the bound", () => {
  it("says what two readings sharing a blind spot are worth", () => {
    expect(NUMBER_BOUND).toContain("share");
    expect(NUMBER_BOUND).toContain("million");
  });
});

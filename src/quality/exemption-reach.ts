// W368 — AN EXEMPTION KEYED ONE WAY AND APPLIED ANOTHER.
//
// An exemption names a site and silences a check there. Two things can go wrong with that, and
// only one of them is visible in a green suite. The first is the exemption being wrong, which the
// reason column is for. The second is the exemption reaching FURTHER THAN ITS KEY NAMES — and
// nothing reports it, because everything it silences looks exactly like something nobody wrote.
//
// W360 FOUND ONE. `NOT_A_MEMBERSHIP` is keyed `file :: assertion`; `presenceDefects` parsed the
// key, kept the file and threw the assertion away, so an excuse naming ONE Map silenced every
// non-canonical presence claim in that file. A planted `has(...)` in `route-coverage.test.ts` was
// silent while the same claim anywhere else was reported. The fix read the second half. The CLASS
// was never swept, and this unit sweeps it.
//
// THE QUESTION IS NOT WHETHER THE KEY IS PARSED. It is whether the key's grain matches the
// subject's. W303's `WRITES_WITHOUT_A_PLANTER` keys a FILE and its subject is a CALL: the key is read
// whole, nothing is thrown away, and a second write in an excused file still inherits the excuse.
// W336's `NOT_A_COLLECTION` keys a TEST and its subject is an ASSERTION, which is W360's defect one notch
// finer. An exemption is `wider` when a sibling instance under the same key is silenced too, and
// that is measured rather than read off the predicate.
//
// EVERY DRIVEN ROW PLANTS A PAIR. One instance is named by a crafted exemption and must be
// silenced — the control, without which the row measures nothing — and a second instance under the
// SAME KEY must still be reported if the reach is exact. The crafted map is used instead of the
// live one so the probe tests the PREDICATE rather than today's entries.
//
// WHAT IT CANNOT SEE is `REACH_BOUND`, below.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads and plants this repository's own source text.

import { readFileSync } from "node:fs";
import path from "node:path";
import { emptinessSpellings, presenceDefects } from "./assertion-vocabulary";
import { separatorDiff } from "./citations";
import { copyTree, planterDiff, withPlantedIn } from "./planting";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/** The file a probe plants its pair into. */
export const PAIR_FILE = "src/quality/reach-probe.test.ts";

/** What a probe measured. */
export interface Reading {
  /** The named instance is silenced. False means the exemption did not apply at all. */
  named: boolean;
  /** A SECOND instance under the same key is silenced too. True is the finding. */
  sibling: boolean;
}

export type ReachProbe = (root: string) => Reading;

/** How far an exemption reaches, against how far its key names. */
export type Reach =
  /** Driven: a sibling under the same key is still reported. */
  | { kind: "exact"; probe: ReachProbe }
  /** Driven: it is not. `inherits` is what a second entry gets for free. */
  | { kind: "wider"; inherits: string; probe: ReachProbe }
  /** Nobody has planted a pair against it. The row this unit exists to report. */
  | { kind: "untried"; why: string };

/** One exemption a detector applies, and how far it reaches. */
export interface Exemption {
  /** The module holding the map. */
  module: string;
  /** The map's exported name. */
  map: string;
  /** The detector that takes it, `module::export`. */
  detector: string;
  /** What one key NAMES, in the tree's words. */
  key: string;
  /** What the check is ABOUT — the thing a key silences one of. */
  subject: string;
  reach: Reach;
}

/**
 * Every map a detector takes as a defaulted exemption parameter, derived from the tree.
 *
 * The idiom is this tree's own: a detector's last parameter is the register it would otherwise
 * report against, defaulted to the live one so a test can hand it another. That shape is what makes
 * an exemption an exemption here, and it is what this scan reads.
 */
export function appliedExemptions(root: string): string[] {
  const found = new Set<string>();
  for (const file of sourceModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = prepareForScan(readFileSync(file, "utf8"), { literals: "blanked" });
    // W368's own first draft spelled the register name `[A-Z][A-Z_]*`, which excludes DIGITS —
    // so `W295_EXCUSED`, the control this register's own blind-spot probe plants, was invisible and
    // the probe reported that nothing had been demonstrated. A population scan that misses a name
    // for how the name is written is W366's subject, arriving in the register that catalogues it.
    for (const m of code.matchAll(/Readonly<Record<string, string>> = ([A-Z][A-Z0-9_]*)\s*,/g)) {
      found.add(`${rel}::${m[1]}`);
    }
  }
  return [...found].sort();
}

/**
 * Plant a pair, run the detector with a crafted exemption, and report what each site did.
 *
 * SCOPED TO THE PLANTED FILE FIRST. The first draft matched the site names against the whole
 * tree's output, and this tree has a test whose name contains the word the probe was looking for —
 * so the control read as failed while the exemption was working perfectly. A probe that reads
 * somebody else's site is the reading W295 calls no reading.
 */
function pair(
  root: string,
  files: Readonly<Record<string, string>>,
  reported: (root: string) => string[],
  named: string,
  sibling: string,
): Reading {
  const copy = copyTree(root);
  return withPlantedIn(copy, files, () => {
    const sites = reported(copy).filter((s) => s.includes("reach-probe"));
    return { named: !sites.some((s) => s.includes(named)), sibling: !sites.some((s) => s.includes(sibling)) };
  });
}

/**
 * The reading for an exemption whose key is COARSER than its subject.
 *
 * There is no second site to look for, and that IS the finding: the detector answers at the key's
 * grain, so a file holding two instances produces one entry and one exemption necessarily silences
 * both. `named` is the ordinary control — the excused file goes quiet. `sibling` is measured
 * against the unexcused run: if two instances still yield ONE entry, nothing downstream could ever
 * tell them apart, so the second inherits. Reading both from the same call would be one measurement
 * reported twice, which is what the first draft of this probe did.
 */
export function coarserThanItsSubject(
  root: string,
  files: Readonly<Record<string, string>>,
  reported: (root: string, excused: Readonly<Record<string, string>>) => string[],
  file: string,
): Reading {
  const copy = copyTree(root);
  return withPlantedIn(copy, files, () => {
    const excused = reported(copy, { [file]: "the probe's named instance" }).filter((s) => s.includes(file));
    const bare = reported(copy, {}).filter((s) => s.includes(file));
    return { named: excused.length === 0, sibling: bare.length === 1 };
  });
}

/** Two non-canonical presence claims in one file, one of them excused by name. */
const TWO_PRESENCE_CLAIMS =
  'import { describe, expect, it } from "vitest";\n' +
  'describe("probe", () => {\n' +
  '  it("named", () => {\n' +
  "    expect(alpha.has(1)).toBe(true);\n" +
  "  });\n" +
  '  it("sibling", () => {\n' +
  "    expect(beta.has(2)).toBe(true);\n" +
  "  });\n" +
  "});\n" +
  "declare const alpha: Set<number>;\ndeclare const beta: Set<number>;\n";

export const EXEMPTIONS: readonly Exemption[] = [
  {
    module: "src/quality/assertion-vocabulary.ts",
    map: "NOT_A_MEMBERSHIP",
    detector: "src/quality/assertion-vocabulary.ts::presenceDefects",
    key: "a file and the subject the claim is about — `file :: alpha`",
    subject: "one presence claim",
    reach: {
      // W360's own case, re-driven. The fix reads the key's second half and matches it against the
      // assertion's TEXT, so a claim about another subject in the same file is still reported.
      kind: "exact",
      probe: (root) =>
        pair(
          root,
          { [PAIR_FILE]: TWO_PRESENCE_CLAIMS },
          (copy) =>
            presenceDefects(copy, "toContain", { [`${PAIR_FILE} :: alpha`]: "the probe's named site" }).map(
              (d) => d.site,
            ),
          "named",
          "sibling",
        ),
    },
  },
  {
    module: "src/quality/assertion-vocabulary.ts",
    map: "NOT_A_COLLECTION",
    detector: "src/quality/assertion-vocabulary.ts::emptinessSpellings",
    key: "a file and the enclosing TEST — `file :: the test's name`",
    subject: "one emptiness assertion",
    reach: {
      kind: "wider",
      inherits:
        "every further emptiness assertion in the same `it(...)`. A test excused for the one " +
        "assertion nobody could convert silences the next one somebody writes beside it, and the " +
        "next is the ordinary case: assertions arrive in the test that already has one.",
      probe: (root) =>
        pair(
          root,
          {
            [PAIR_FILE]:
              'import { describe, expect, it } from "vitest";\n' +
              'describe("probe", () => {\n' +
              '  it("one test, two spellings", () => {\n' +
              "    expect(named).toHaveLength(0);\n" +
              "    expect(sibling.length).toBe(0);\n" +
              "  });\n" +
              "});\n" +
              "declare const named: number[];\ndeclare const sibling: number[];\n",
          },
          (copy) =>
            emptinessSpellings(copy, {
              [`${PAIR_FILE} :: one test, two spellings`]: "the probe's named site",
            }),
          "named",
          "sibling",
        ),
    },
  },
  {
    module: "src/quality/planting.ts",
    map: "WRITES_WITHOUT_A_PLANTER",
    detector: "src/quality/planting.ts::planterDiff",
    key: "a file",
    subject: "one write call",
    reach: {
      kind: "wider",
      inherits:
        "every further write in the same module. The seventeen entries were each argued for the " +
        "call the unit was looking at, and a module that grows a second, unrelated write is " +
        "covered by the sentence written about the first — which is the one event a register " +
        "about unplanted writes exists to catch.",
      probe: (root) =>
        coarserThanItsSubject(
          root,
          {
            "src/quality/reach-probe.ts":
              'import { writeFileSync } from "node:fs";\n' +
              'export const named = () => writeFileSync("a", "b");\n' +
              'export const sibling = () => writeFileSync("c", "d");\n',
          },
          (copy, excused) => planterDiff(copy, excused).undeclared,
          "src/quality/reach-probe.ts",
        ),
    },
  },
  {
    module: "src/quality/citations.ts",
    map: "SEPARATOR_NOT_A_CITATION",
    detector: "src/quality/citations.ts::separatorDiff",
    key: "a file",
    subject: "one split on the citation separator",
    reach: {
      kind: "wider",
      inherits:
        "every further split on the separator in the same module. The register's own subject is a " +
        "private parse of a citation, and a module excused for the one place it splits for another " +
        "reason silences the place somebody later splits for this one.",
      probe: (root) =>
        coarserThanItsSubject(
          root,
          {
            "src/quality/reach-probe.ts":
              'export const named = (s: string) => s.split(" :: ");\n' +
              'export const sibling = (s: string) => s.split(" :: ");\n',
          },
          (copy, excused) => separatorDiff(copy, excused).undeclared,
          "src/quality/reach-probe.ts",
        ),
    },
  },
  {
    module: "src/quality/self-ending.ts",
    map: "WAIT_FIXTURES",
    detector: "src/quality/self-ending.ts::endingDiff",
    key: "a module",
    subject: "a module that holds a wait fixture",
    reach: {
      kind: "untried",
      why:
        "The key and the subject are the same grain — the check asks whether a MODULE is a fixture " +
        "holder, not how many fixtures it holds — so a pair under one key is not two instances of " +
        "the subject but one. Writing the probe means deciding what a second instance would even " +
        "be, which is a question about that register rather than about this one, and guessing at " +
        "it would produce a reading with no control.",
    },
  },
  {
    module: "src/quality/self-ending.ts",
    map: "DECLARED_PROSE_WAITS",
    detector: "src/quality/self-ending.ts::proseWaitDefects",
    key: "a file and the unit waited on — `file::W56`",
    subject: "one prose sentence waiting on that unit",
    reach: {
      kind: "untried",
      why:
        "The compound key is read whole, so the shape is the one W360 repaired rather than the one " +
        "it left. What is untried is whether TWO sentences in the same file waiting on the same " +
        "unit are one instance or two: the detector derives its key from the sentence it found, so " +
        "a pair may collapse before the exemption is consulted at all. That is a reading about the " +
        "derivation, and it needs a plant this probe does not have.",
    },
  },
  {
    module: "src/quality/pins.ts",
    map: "DUPLICATE_PINS",
    detector: "src/quality/pins.ts::duplicateDiff",
    key: "a pin's name",
    subject: "a name pinned in two registers",
    reach: {
      kind: "untried",
      why:
        "The key IS the subject: a duplicated name is one thing, and the exemption names it. There " +
        "is no sibling to plant under the same key without planting the same name twice, which is " +
        "the subject itself rather than a second instance of it. Recorded as untried rather than " +
        "as exact, because 'no pair exists' is an argument and this register has not driven it.",
    },
  },
  {
    module: "src/quality/page-suite.ts",
    map: "EXCLUDED_SPECS",
    detector: "src/quality/page-suite.ts::pageSuiteCoverage",
    key: "a spec file",
    subject: "one spec file",
    reach: {
      kind: "untried",
      why:
        "The map is EMPTY today, so a probe would be measuring a predicate nothing currently " +
        "exercises. That is not a reason to skip it — an empty exemption is exactly where a wide " +
        "one hides until the first entry — but it does mean the pair has to be planted as specs " +
        "and read through the suite's own walk, which is a fixture rather than a line.",
    },
  },
  {
    module: "src/quality/review-w279.ts",
    map: "FALLIBLE_READS",
    detector: "src/quality/review-w279.ts::fallibleDiff",
    key: "a read site",
    subject: "one fallible read",
    reach: {
      kind: "untried",
      why:
        "The population is derived from a scan whose sites this probe would have to reproduce to " +
        "plant a pair under one key, and reproducing it here is the private copy W341 forbids. " +
        "Sharing the derivation instead is the right move and is a change to that module, which " +
        "is beyond this unit.",
    },
  },
];

/** What is wrong with the register, in the tree's words. */
export interface ReachDefect {
  exemption: string;
  what: string;
}

/** Every applied exemption the table misses, and every row naming one the tree no longer applies. */
export function reachCensusDefects(root: string, exemptions: readonly Exemption[] = EXEMPTIONS): ReachDefect[] {
  const declared = new Set(exemptions.map((e) => `${e.module}::${e.map}`));
  const applied = new Set(appliedExemptions(root));
  const defects: ReachDefect[] = [];
  for (const site of applied) {
    if (!declared.has(site)) defects.push({ exemption: site, what: "is applied as an exemption and no row says how far it reaches" });
  }
  for (const site of declared) {
    if (!applied.has(site)) defects.push({ exemption: site, what: "is declared and no detector takes it as an exemption" });
  }
  return defects.sort((a, b) => a.exemption.localeCompare(b.exemption));
}

/** Every driven row whose declaration the tree contradicts, in both directions. */
export function reachDefects(root: string, exemptions: readonly Exemption[] = EXEMPTIONS): ReachDefect[] {
  const defects: ReachDefect[] = [];
  for (const exemption of exemptions) {
    const reach = exemption.reach;
    if (reach.kind === "untried") continue;
    const reading = reach.probe(root);
    const name = `${exemption.module}::${exemption.map}`;
    if (!reading.named) {
      defects.push({ exemption: name, what: "the named site is still reported, so the exemption did not apply and the reading measures nothing" });
      continue;
    }
    if (reach.kind === "exact" && reading.sibling) {
      defects.push({ exemption: name, what: "declared `exact` and a sibling under the same key is silenced too" });
    }
    if (reach.kind === "wider" && !reading.sibling) {
      defects.push({ exemption: name, what: "declared `wider` and a sibling under the same key is still reported — the reach has been narrowed" });
    }
  }
  return defects;
}

/** The exemptions that silence more than they name, by name. The finding. */
export function widerThanTheirKey(exemptions: readonly Exemption[] = EXEMPTIONS): string[] {
  return exemptions.filter((e) => e.reach.kind === "wider").map((e) => `${e.module}::${e.map}`).sort();
}

/** The exemptions nobody has planted a pair against, by name. */
export function untriedExemptions(exemptions: readonly Exemption[] = EXEMPTIONS): string[] {
  return exemptions.filter((e) => e.reach.kind === "untried").map((e) => `${e.module}::${e.map}`).sort();
}

export const REACH_BOUND =
  "THE POPULATION IS ONE IDIOM, NOT EVERY EXEMPTION. This reads the maps a detector takes as a " +
  "defaulted `Readonly<Record<string, string>>` parameter, which is how this tree spells an " +
  "exemption a test can substitute. An exemption welded inside a function, one keyed by a typed " +
  "record rather than a string map, or one spelled as a skip list in an array is outside the scan " +
  "entirely — and the register that finds them is the same widening W366's bound describes, which " +
  "is why the predicate below reads the scan rather than the table. SECOND, `wider` IS MEASURED " +
  "ON ONE PAIR. The probe plants a second instance under the same key and reads whether it is " +
  "silenced; that says the reach exceeds the key by at least one step, and says nothing about how " +
  "far. An exemption keyed by a file might reach the whole directory and this register would " +
  "report it identically. THIRD, AND IT IS THE LIMIT THAT MATTERS: `wider` IS NOT `WRONG`. Every " +
  "row named by `widerThanTheirKey` reaches past its key and each is defensible — a file-grained " +
  "key is the honest grain when the check is file-grained, and narrowing it costs a " +
  "derivation somebody has to write. What this register refuses is the reach being invisible, " +
  "not the reach existing.";
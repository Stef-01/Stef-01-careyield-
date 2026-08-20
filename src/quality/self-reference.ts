// W307: the self-referential scan, enforced — every detector shown seeing a planted instance and
// not reporting its own fixture.
//
// W302 STATED THE RULE AND THIS DRIVES IT. `SELF_REFERENCE_RULE` says text a detector must not find
// in the surface it reads leaves that surface, and `scan-fixtures.fixtures` is where it goes. A rule
// with no mechanism behind it is a comment: it holds until the next unit writes a fixture inline,
// which is how the tree acquired eight of them.
//
// SO THE MECHANISM IS TWO CHECKS AND ONE REGISTER. Every detector whose fixture moved is driven
// twice — a planted instance it MUST report, and its own fixture it must NOT — because either half
// alone is satisfied by a broken scan. A detector that stopped deciding reports nothing and passes
// the second; one that reports everything passes the first. And the modules holding the fixtures are
// declared, both directions, so a conversion that gets reverted fails here rather than surfacing two
// units later as a scan quietly reporting the module it lives in.
//
// THE IDIOM IT REPLACES IS SWEPT. A string split across an array and joined back is what this tree
// did eight times, and `splitDiff` reports any that remain against a register of ARGUED exceptions —
// because two kinds of split are right and moving them would be worse. A detection PATTERN is one:
// the regex that matches secrets belongs beside the code that uses it, and a control whose rule
// lives in a data file nobody scans is a control nobody can review. A credential-shaped FIXTURE is
// the other: W242 sweeps for those wherever they are, including tests, and moving one into a file no
// sweep reads is precisely the hole the sweep exists to close.
//
// FOUNDER GATE (plan §4): nothing crossed. Constructed trees in a temporary directory.

import { readFileSync } from "node:fs";
import path from "node:path";
import { findInstructionSinks } from "@/security/instruction-sinks";
import { FIXTURES_FILE, fixtureText, fixtureToken, prepareForScan } from "./scan-text";
import { type Plantable, withTree } from "./planting";
import { privateCopies } from "./private-copies";
import { filesUnder, sourceModules, typescriptFiles } from "./tree-walks";
import { appliedExemptions } from "./exemption-reach";
import { momentsOf } from "./moments";
import { reclamationSites } from "./run-residue";
import { patientRules } from "./patient-populations";
import { emptyRegisters } from "./empty-populations";
import { violationReporters } from "./refusal-branches";
import { namingSites } from "./declaration-tax";
import { treeWalkingFiles } from "./register-census";
import { headerNamesUnknown } from "./unit-headers";

/** A detector that reads a surface its own fixtures used to sit in. */
export interface SelfScan {
  /** `module::function`, so two detectors in one module stay distinct. */
  detector: string;
  /** What the detector reports about a root, as identifiers a marker can be looked for in. */
  sees: (root: string) => string[];
  /** A tree holding a real instance of what the detector looks for. */
  plant: Plantable;
  /** The identifying part of that instance — reported for the planted tree, absent from this one. */
  marker: string;
  /**
   * Whether the holders show up in what this detector reports about the real tree.
   *
   * `never` is the strong form and the default answer: the holders are reported ONLY when the
   * fixture is written inline, so their absence is the second half of the gate said directly.
   * `for_other_reasons` is the honest exception — `blind-spots.ts` exports a real violation
   * reporter and `register-census.test.ts` really does walk the tree — and there the marker does
   * the work alone, which is why the marker for those is the fixture's own identifier.
   */
  holdersAppear: "never" | "for_other_reasons";
  /** First-party modules holding the fixture. Checked to still load one. */
  holders: readonly string[];
  /** Why this detector could not simply keep its fixture inline. */
  why: string;
}

export const SELF_SCANNING: readonly SelfScan[] = [
  {
    detector: "src/security/instruction-sinks.ts::findInstructionSinks",
    sees: (root) => findInstructionSinks(root, ["src"]).map((h) => h.file),
    plant: { "src/planted/whole-endpoint.ts": fixtureText("whole-endpoint-module") },
    marker: "planted/whole-endpoint",
    holdersAppear: "never",
    holders: ["src/quality/blind-spots.ts", "src/quality/assertion-drives.ts"],
    why:
      "W153's scanner walks `src/` for model endpoints and both holders plant one as a witness. Written inline, each holder became an undeclared instruction sink — the collision W237 recorded and W289 hit again one unit later.",
  },
  {
    detector: "src/quality/exemption-reach.ts::appliedExemptions",
    sees: (root) => appliedExemptions(root).map((e) => e.split("::")[0]!),
    plant: { "src/planted/w307-exemption.ts": fixtureText("w295-map-exemption") },
    marker: "planted/w307-exemption",
    holdersAppear: "never",
    holders: ["src/quality/blind-spots.ts", "src/quality/spelling-markers.ts"],
    why:
      "W368's scan walks the tree for a detector's defaulted exemption parameter, and both holders plant one — `blind-spots.ts` as the positive control for that register's own blind spot, `spelling-markers.ts` as the pair a second spelling of the parameter is measured against. Written inline, each holder became an exemption the register reported as applied and unmeasured, which W355 caught first: its defaulted-register scan read the same literals as real parameters nobody drives.",
  },
  {
    detector: "src/quality/moments.ts::momentsOf",
    sees: (root) => momentsOf(root, "src/planted/subject.ts").map((site) => site.file),
    plant: {
      "src/planted/subject.ts": fixtureText("moment-subject-module"),
      "src/planted/asks.test.ts": fixtureText("moment-caller-per-test"),
    },
    marker: "planted/asks",
    holdersAppear: "never",
    holders: ["src/quality/blind-spots.ts", "src/quality/moments.test.ts"],
    why:
      "W378's walk reads every test module for calls to a subject's exports, and both holders plant a caller — `blind-spots.ts` as the control for that register's own blind spot, the suite as the proof that a call inside a test and a call at the top of a file are different moments. Written inline, each holder became a caller the register attributed to whatever file held the string.",
  },
  {
    detector: "src/quality/run-residue.ts::reclamationSites",
    sees: (root) => reclamationSites(root).map((s) => `${s.file}::${s.fn}`),
    plant: { "src/planted/sync.ts": fixtureText("removal-by-rmsync") },
    marker: "planted/sync",
    holdersAppear: "never",
    holders: ["src/quality/blind-spots.ts", "src/quality/horizon-q29-gate.ts", "src/quality/run-residue.test.ts"],
    why:
      "W375's walk looks for an `rmSync` call under `src/`, and both holders plant one — `blind-spots.ts` as the control for that register's own blind spot, the suite as the proof that the walk reaches a file nobody told it about. Written inline, each holder became a removal site the register reported against a function that removes nothing.",
  },
  {
    detector: "src/quality/patient-populations.ts::patientRules",
    sees: (root) => patientRules(root),
    plant: { "src/planted/by-panel.ts": fixtureText("rule-by-panel") },
    marker: "planted/by-panel",
    holdersAppear: "never",
    holders: ["src/quality/blind-spots.ts", "src/quality/patient-populations.test.ts"],
    why:
      "W373's walk looks for a function taking a collection of `Patient`, and both holders plant one — `blind-spots.ts` as the control for that register's own blind spot, the suite as the proof that the walk finds a file nobody told it about. Written inline, each holder became a module naming `Patient`, which W201's decision census reads as a module touching a patient: the first draft of this unit put `src/quality/blind-spots.ts` into the published automated-decisions statement.",
  },
  {
    detector: "src/quality/empty-populations.ts::emptyRegisters",
    sees: (root) => emptyRegisters(root).map((r) => `${r.module}::${r.name}`),
    plant: { "src/planted/empty-register.ts": fixtureText("empty-register-module") },
    marker: "planted/empty-register",
    holdersAppear: "never",
    holders: ["src/quality/empty-populations.test.ts"],
    why:
      "W369's walk looks for `export const NAME … = []` across the tree, and its suite has to plant one to prove the walk rather than the reader. Written inline, the example would BE an empty register in this tree — undeclared, and reported by the very check it was written to drive.",
  },
  {
    detector: "src/quality/refusal-branches.ts::violationReporters",
    sees: (root) => violationReporters(root).map((r) => `${r.module}::${r.fn}`),
    plant: { "src/planted/list-reporter.ts": fixtureText("list-reporter") },
    marker: fixtureToken("a-reporter-name"),
    holdersAppear: "for_other_reasons",
    holders: ["src/quality/blind-spots.ts", "src/quality/declaration-tax.ts"],
    why:
      "This is the one scan that reads RAW source on purpose — W295 narrowed it and four real registers disappeared — so a reporter signature written anywhere under `src/` is read as a reporter, quoted or not. Both holders report real reporters of their own, which is why the marker is the fixture's function name and not its module.",
  },
  {
    detector: "src/quality/declaration-tax.ts::namingSites",
    sees: (root) => namingSites(root, fixtureToken("absent-module-path-w289")),
    plant: { "src/planted/names-it.ts": `export const p = "${fixtureToken("absent-module-path-w289")}";\n` },
    marker: "names-it",
    holdersAppear: "never",
    holders: ["src/quality/assertion-drives.ts", "src/quality/declaration-tax.test.ts"],
    why:
      "W300's measurement asks which registers NAME a module path, and its own probe names a path that must have no sites. Written inline, the probe's file is a site and the measurement counts itself.",
  },
  {
    detector: "src/quality/bounds.ts::SWEEP_BOUND.stillOpen",
    sees: (root) =>
      sourceModules(root).filter((f) => /from ["']typescript["']/.test(readFileSync(f, "utf8"))),
    plant: { "src/planted/ast-pass.ts": fixtureText("ast-pass-module") },
    marker: "ast-pass",
    holdersAppear: "never",
    holders: ["src/quality/bounds.ts"],
    why:
      "W306's lifting fixture for the AST bound is an import of the TypeScript compiler, and the predicate walks `src/` — where the register holding the fixture lives. W306 predicted this one before writing it and split the token; the fixture leaving the surface is the version that explains itself.",
  },
  {
    detector: "src/quality/register-census.ts::treeWalkingFiles",
    sees: (root) => treeWalkingFiles(root),
    plant: {
      "src/planted/walks.ts": `import { ${fixtureToken("tree-walk-call-name")} } from "node:fs";\nexport const e = () => ${fixtureToken("tree-walk-call-name")}("src");\n`,
    },
    marker: "planted/walks",
    holdersAppear: "for_other_reasons",
    holders: ["src/quality/populations.test.ts", "src/quality/register-census.test.ts"],
    why:
      "W267's census finds files that walk the tree by the call they make, and its own probes have to make that call in a string. Written inline, the test file counts as a walker. W365 joined for the same reason from the other side: its probes plant modules that IMPORT the shared walks, and the census reads that import as walking too — so a register about populations would have had the widest population in the tree.",
  },
  {
    detector: "src/quality/unit-headers.ts::headerNamesUnknown",
    sees: (root) => headerNamesUnknown(root, typescriptFiles(root)),
    plant: {
      // The import line is load-bearing: W281 takes the header to be everything before the first
      // one, so a probe without an import has no header and the detector answers about nothing.
      "src/planted/bad-header.ts": `// W281: a header naming \`${fixtureToken("unknown-header-constant")}_GONE\`.\nimport path from "node:path";\nexport const value = path;\n`,
    },
    marker: `${fixtureToken("unknown-header-constant")}_GONE`,
    holdersAppear: "never",
    holders: ["src/quality/unit-headers.test.ts"],
    why:
      "W281 reports a header naming a constant the tree does not have, so the probe's token must not exist — and a token written literally in the probe's own file lands in the copied tree and resolves against it, which is the failure W298's comment records finding twice.",
  },
  {
    detector: "src/quality/self-reference.ts::splitSites",
    sees: (root) => splitSites(root),
    plant: { "src/planted/split-join.ts": fixtureText("a-split-join") },
    marker: "planted/split-join",
    holdersAppear: "never",
    holders: ["src/quality/self-reference.test.ts"],
    why:
      "THIS REGISTER'S OWN SWEEP, and it is subject to itself for W201's reason. Its fixture is a split literal, so a probe written inline would make the sweep report the file that proves it works — the register answering its own question with the answer it wants.",
  },
  {
    detector: "src/quality/private-copies.ts::privateCopies",
    sees: (root) => privateCopies(root).map((c) => `${c.file} ${c.parse}`),
    plant: { "src/planted/w341-walk.ts": fixtureText("private-tree-recursion") },
    marker: "planted/w341-walk",
    holdersAppear: "never",
    holders: ["src/quality/private-copies.ts", "src/quality/private-copies.test.ts"],
    why:
      "W341's detector looks for a module holding its own copy of a shared parse, and the markers it looks for ARE such a copy in miniature. Written inline they would make this register the largest private copy in the tree by its own measure — the collision W295 shipped, W298 found twice, and this file exists to stop.",
  },
];

/** A detector that failed one of the two halves. */
export interface SelfScanDefect {
  detector: string;
  what: string;
}

/**
 * Both halves of the gate, per detector: sees a planted instance, does not report its own fixture.
 *
 * NEITHER HALF IS WORTH ANYTHING ALONE, which is the whole reason this is a pair. A scan that
 * stopped deciding reports nothing and passes the second half in silence; a scan that reports
 * everything passes the first. The tree has shipped both failures — W295's narrowing was the first
 * and W288's over-wide sweep was the second.
 */
export function selfScanDefects(root: string, scans: readonly SelfScan[] = SELF_SCANNING): SelfScanDefect[] {
  const out: SelfScanDefect[] = [];
  for (const scan of scans) {
    const planted = withTree(scan.plant, (tree) => scan.sees(tree));
    if (!planted.some((seen) => seen.includes(scan.marker))) {
      out.push({ detector: scan.detector, what: `misses a planted ${scan.marker}` });
    }
    const here = scan.sees(root);
    if (here.some((seen) => seen.includes(scan.marker))) {
      out.push({ detector: scan.detector, what: `reports its own fixture: ${scan.marker}` });
    }
    if (scan.holdersAppear === "never") {
      for (const holder of scan.holders.filter((h) => here.some((seen) => seen.includes(h)))) {
        out.push({ detector: scan.detector, what: `reports the module holding its fixture: ${holder}` });
      }
    }
  }
  return out;
}

/**
 * The modules that load a fixture because they IMPLEMENT the loading, not because a scan reads them.
 *
 * Enumerated with reasons rather than filtered out inline, because an exclusion nobody argued is
 * where the next module quietly goes — W201's rule about the one exclusion a register may hold.
 */
export const MECHANISM: Readonly<Record<string, string>> = {
  "src/quality/scan-text.ts":
    "Defines `fixtureText` and `fixtureToken`; `fixtureToken` calls the other. No detector's fixture lives here.",
  "src/quality/self-reference.ts":
    "This module. It loads every probe's fixture on the probe's behalf, so it is where the fixtures are cited from rather than a module whose own text a scan reads.",
};

export interface HolderDiff {
  /** A declared holder that loads no fixture — a conversion that has been reverted. */
  notLoading: string[];
  /** A module loading a fixture that no scan here covers. */
  uncovered: string[];
}

/** Both directions between the probes and the conversions they describe. */
export function holderDiff(root: string, scans: readonly SelfScan[] = SELF_SCANNING): HolderDiff {
  const declared = new Set(scans.flatMap((s) => s.holders));
  const loading = typescriptFiles(root)
    .filter((f) => /\bfixture(?:Text|Token)\(/.test(readFileSync(f, "utf8")))
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .filter((f) => !(f in MECHANISM));
  return {
    notLoading: [...declared].filter((d) => !loading.includes(d)).sort(),
    uncovered: loading.filter((f) => !declared.has(f)).sort(),
  };
}

/** A module still splitting a literal across an array, with the argument for leaving it that way. */
export interface SplitException {
  module: string;
  why: string;
}

/**
 * The splits that are right, each argued.
 *
 * Both are cases where the text is not a fixture. A PATTERN is a control's own rule and has to be
 * readable beside the code that applies it; moving it into a file nothing scans would make the
 * control unreviewable. A credential-shaped fixture is the sharper one: W242 sweeps for those
 * wherever they appear, tests included, so moving one out of the swept surface is the exact hole
 * the sweep exists to close.
 */
export const SPLIT_EXCEPTIONS: readonly SplitException[] = [
  {
    module: "src/interop/credentials.ts",
    why:
      "The secret-name alternation IS the detector's rule. A reviewer asking what this tree treats as a credential has to be able to read it beside the scan, and a control whose pattern lives in an unscanned data file is a control nobody can check.",
  },
  {
    module: "src/quality/order-independence.ts",
    why:
      "The fold patterns are the same shape: the reduce call, the last-element accessor and the last-index idiom are what W168's detector means by a fold, and the list is the definition rather than a sample of one. (This sentence NAMED those three patterns while it was being written, and W167's register reported this module as a folding one — the fifteenth instance of the class, landing on the unit written to close it. Prose does not have to quote a pattern to describe it, which is the rule's third answer.)",
  },
  {
    module: "src/security/instruction-sinks.ts",
    why:
      "The model-endpoint markers are the scanner's own list, split as a table of parts. Its docstring already refused the alternative this rule refuses — excluding the file by name — for the reason this register exists: an excluded file is a place to hide something.",
  },
  {
    module: "src/api/scopes.test.ts",
    why:
      "A credential-shaped literal, and the one fixture that must NOT leave the surface. W242's sweep reads `src/` and `app/` including tests precisely because a pasted secret goes wherever somebody was working, so a fake one parked in a file no sweep reads would prove the scanner works while demonstrating how to get past it.",
  },
];

// A string literal, and it MUST NOT SPAN LINES. The first draft allowed a newline inside one, so a
// quote early in a file and a quote much later were read as a single literal and the sweep reported
// eighteen ordinary modules — the same over-wide-scan failure W288 shipped, found here by the count.
const STRING = '"(?:[^"\\\\\\n]|\\\\.)*"';
const INLINE_JOIN = new RegExp(`\\[\\s*${STRING}(?:\\s*,\\s*${STRING})+\\s*,?\\s*\\]\\s*\\.join\\(""\\)`);
// The second shape: fragments kept in a constant and joined with a map. THE FIRST DRAFT MATCHED THE
// TABLE ITSELF — an array of `[string, string]` pairs — which is the ordinary test-table idiom and
// eighteen modules use it, so the sweep reported the message templates and the pathway fixtures as
// evasions. The JOIN is what makes a table of fragments a split; the table alone is just a table.
const JOINED_TABLE = /\.map\(\(\w+\)\s*=>\s*\w+\.join\(""\)\)/;

/**
 * First-party modules that still assemble a literal from fragments.
 *
 * TWO SHAPES, because the tree wrote two. The inline join is the common one; the other is
 * `instruction-sinks.ts`, which keeps its fragments in a constant and joins them with a map — a
 * detector matching only the inline form would have reported that module clean and left the
 * register's own exception looking stale.
 */
export function splitSites(root: string): string[] {
  const found = new Set<string>();
  for (const file of typescriptFiles(root)) {
    // W302's preparation, with LITERALS KEPT: the subject of this sweep is a string literal, so
    // blanking them would empty the thing it looks for. Comments are subtracted because a split
    // QUOTED in a note explaining the idiom is not one — which is this register's own third answer,
    // and the failure W167 and W295 each shipped in the register that named its own patterns.
    const text = prepareForScan(readFileSync(file, "utf8"), { literals: "kept" });
    if (!INLINE_JOIN.test(text) && !JOINED_TABLE.test(text)) continue;
    found.add(path.relative(root, file).split(path.sep).join("/"));
  }
  return [...found].sort();
}

export interface SplitDiff {
  /** A split nobody argued. The defect: the idiom coming back without the rule. */
  unargued: string[];
  /** An argued split the sweep no longer finds. Progress, and it has to be recorded. */
  stale: string[];
}

/** Both directions, W102's shape, with the register taken as a parameter so both arms drive. */
export function splitDiff(
  root: string,
  declared: readonly SplitException[] = SPLIT_EXCEPTIONS,
): SplitDiff {
  const found = splitSites(root);
  const argued = declared.map((e) => e.module);
  return {
    unargued: found.filter((f) => !argued.includes(f)).sort(),
    stale: argued.filter((m) => !found.includes(m)).sort(),
  };
}

/**
 * Every file under `dir`, recursively, minus the directories no walk in this tree wants.
 *
 * Q24-CR-7, ANSWERED. This recursed with no exclusions at all, so it walked `node_modules` —
 * sixty-odd thousand entries — and `statSync` sat outside the `try`, where a broken symlink throws
 * through a bound predicate rather than being skipped. Both are fixed here rather than passed on
 * again: W318 retargeted the finding from a range to W325, and W325 retargeted it to this unit
 * because a walk that answers over the installed dependencies is what "which instant" means.
 *
 * IT USES THE SHARED LIST RATHER THAN ONE OF ITS OWN, which is the narrower point. This module
 * deliberately does not build on the tree walks — every one of them filters on an extension list
 * this file's own fixture extension is missing from, and that absence is the mechanism. But what a
 * walk EXCLUDES is a fact about the repository rather than about the walk, so the directory list is
 * imported while the extension filter stays here.
 */
// W341: THE SHARED RECURSION, which this module had to copy because it was private. The argument
// below still holds — the tree WALKS all filter on an extension list this file's fixture extension
// is missing from — but the recursion under them filters nothing, and that is what was wanted. The
// broken-symlink guard this copy carried went home with it.
const allFilesUnder = filesUnder;

/**
 * Files with the fixture extension, anywhere under the root.
 *
 * DELIBERATELY NOT BUILT ON THE TREE WALKS, because every one of them filters on an extension list
 * this file is missing from — that absence is the mechanism, and a sweep for it that inherited the
 * same filter would return nothing forever.
 */
export function fixtureFiles(root: string): string[] {
  return allFilesUnder(root)
    .filter((f) => f.endsWith(".fixtures"))
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .sort();
}

/**
 * What the rule does not buy.
 *
 * The uncomfortable half, and it is the direct cost of the mechanism rather than a caveat about it.
 */
export const SELF_REFERENCE_BOUND =
  `A file no scan reads is a file no scan reads. Everything in ${FIXTURES_FILE} is outside every ` +
  "walk in this tree — including the security ones — so text parked there is unreviewed by the " +
  "controls that read everything else. What holds that down is not the extension but the citation " +
  "check: every block must be loaded by name from first-party source, so nothing can sit there " +
  "unreferenced, and the sweep for a SECOND file with that extension is why the count of them is " +
  "read rather than assumed. The credential fixture is left split for exactly this reason and " +
  "argued in the register. And the split sweep sees two written shapes; a fragment table assembled " +
  "some third way is invisible to it, which is the class of bound W267 states about `readdirSync`.";

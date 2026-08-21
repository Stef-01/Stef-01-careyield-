// W396: a population read from the source text, and the same population read by LOADING it.
//
// EVERY REGISTER IN THIS TREE READS SOURCE. That is the shared premise underneath sixty of them:
// open the file, prepare the text, match a pattern, call the result a population. Q31 is about what
// a pattern cannot see, and this is the one direction where a SECOND INSTRUMENT genuinely exists and
// nobody had used it — the module can be imported, and what it exports at runtime is a fact rather
// than a reading. Two derivations of one population, and the diff between them is the finding.
//
// THE DIFF IS NOT SMALL. `exportsOf` — the reading W388's register uses to decide whether a cited
// test runs its subject — cannot see twelve of the thirteen values `unit-headers.ts` exports, or
// four of the seven in `blind-spots.ts`. The cause is `SCAN_BOUND` in its own words: `blankLiterals`
// loses the rest of a file after an unbalanced backtick, and both modules open with one on their
// fourth line. A citation whose subject is `unit-headers.ts` is being judged against an export list
// that is essentially empty, and no source-reading register could ever have reported that, because
// every one of them reads through the same scan.
//
// TYPES ARE NOT A DIVERGENCE AND ARE EXCLUDED BY CONSTRUCTION. `export interface` and `export type`
// are gone at runtime by design, so counting them would bury the finding under four hundred rows
// that mean nothing. What is left is VALUES: a name the source reading claims and the module does
// not have, or a name the module has and the source reading cannot see.
//
// WHAT THIS DOES NOT PROVE is `RUNTIME_BOUND`, exported below and read by W297's register.
//
// A RUNTIME LEAF, ON PURPOSE. W367's remedy: both readings are handed in rather than imported, so a
// module every bound register reads adds no edge to the `src/quality` knot — and, more to the point,
// a module that IMPORTED the registers it measures would be loading them into its own process and
// measuring something it had changed.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads and loads this repository's own modules.

import { prepareForScan } from "./scan-text";

/** One module read twice: what the source says it exports, and what loading it produces. */
export interface Reading {
  module: string;
  /** Every name the tree's own source reading finds, types included. */
  source: readonly string[];
  /** The names among those that are declared as a type or an interface. */
  types: readonly string[];
  /** The keys the module namespace really has, from an `import()`. */
  runtime: readonly string[];
}

/**
 * The names a module declares as a type or an interface.
 *
 * READ FROM THE RAW TEXT AND NOT THROUGH THE SHARED SCAN, which is the one place in this module
 * where that choice matters: the whole point is to be able to see what the prepared text loses, so
 * a classification built on the prepared text would inherit the loss it is here to measure. Comments
 * are still subtracted, because a comment discussing `export type Foo` is not a declaration.
 */
export function typeNames(source: string): string[] {
  const code = prepareForScan(source, {
    comments: "subtracted",
    literals: "kept",
  });
  return [...code.matchAll(/^export (?:interface|type) (\w+)/gm)].map(
    (m) => m[1]!,
  );
}

/** A name one reading has and the other does not. */
export interface Divergence {
  module: string;
  name: string;
  /** `runtime_only` is the finding: the module really exports it and the source reading cannot see it. */
  side: "source_only" | "runtime_only";
}

/** Where the two readings of one module's exports disagree about a VALUE. */
export function divergences(readings: readonly Reading[]): Divergence[] {
  const out: Divergence[] = [];
  for (const { module, source, types, runtime } of readings) {
    const values = source.filter((name) => !types.includes(name));
    for (const name of values) {
      if (!runtime.includes(name))
        out.push({ module, name, side: "source_only" });
    }
    for (const name of runtime) {
      if (!values.includes(name))
        out.push({ module, name, side: "runtime_only" });
    }
  }
  return out.sort((a, b) =>
    `${a.module}${a.name}`.localeCompare(`${b.module}${b.name}`),
  );
}

/** Why the two readings disagree about this name. */
export type Cause =
  /** The module re-exports it rather than declaring it, and the source pattern reads declarations. */
  | { kind: "re_exported"; from: string }
  /**
   * The source reading never saw the declaration. THE CLASS THIS UNIT EXISTS FOR: the name is
   * declared perfectly ordinarily and the shared scan lost the region it sits in.
   */
  | { kind: "lost_to_the_scan"; why: string };

export interface DeclaredDivergence {
  module: string;
  name: string;
  cause: Cause;
}

export interface DivergenceDefect {
  site: string;
  what: string;
}

/**
 * Where the register and the two readings disagree, in three directions.
 *
 * A divergence nobody classified; a declaration for one the readings now agree about; and a
 * `lost_to_the_scan` row with no argument. The second is the one that closes the finding: the day
 * somebody fixes `blankLiterals` these rows all go stale at once, which is the outcome and must
 * fail rather than pass quietly.
 */
export function divergenceDefects(
  found: readonly Divergence[],
  declared: readonly DeclaredDivergence[] = DIVERGENCE_AT_W396,
): DivergenceDefect[] {
  const byKey = new Map(declared.map((d) => [`${d.module}::${d.name}`, d]));
  const out: DivergenceDefect[] = [];
  for (const hit of found) {
    const key = `${hit.module}::${hit.name}`;
    const row = byKey.get(key);
    if (row === undefined) {
      out.push({
        site: key,
        what: `is ${hit.side} and nothing says why the two readings differ`,
      });
      continue;
    }
    if (row.cause.kind === "lost_to_the_scan" && row.cause.why.length < 100) {
      out.push({
        site: key,
        what: "is put down to the scan without saying what the scan lost",
      });
    }
  }
  for (const row of declared) {
    if (!found.some((h) => h.module === row.module && h.name === row.name)) {
      out.push({
        site: `${row.module}::${row.name}`,
        what: "is declared here and the two readings agree about it",
      });
    }
  }
  return out.sort((a, b) =>
    `${a.site}${a.what}`.localeCompare(`${b.site}${b.what}`),
  );
}

export const DIVERGENCE_AT_W396: readonly DeclaredDivergence[] = [
  {
    module: "src/quality/acceptances.ts",
    name: "resolveCitation",
    cause: { kind: "re_exported", from: "./citations" },
  },
  {
    module: "src/quality/refusal-branches.ts",
    name: "REFUSAL_BRANCHES",
    cause: { kind: "re_exported", from: "./manifest" },
  },
  {
    module: "src/quality/refusal-branches.ts",
    name: "withRoot",
    cause: { kind: "re_exported", from: "./planting" },
  },
  {
    module: "src/quality/register-census.ts",
    name: "TREE_DERIVED_REGISTERS",
    cause: { kind: "re_exported", from: "./manifest" },
  },
  {
    module: "src/quality/blind-spots.ts",
    name: "BLIND_SPOT_BOUND",
    cause: {
      kind: "lost_to_the_scan",
      why: "The same desynchronisation, a thousand lines earlier than the exports it costs: a `witness` string quotes `// W<n>` in backticks, the scan takes it for a template literal, and the four values at the end of the file \u2014 this register's own bound and its two report functions among them \u2014 are invisible to any reading of the prepared text. The register that names what other registers cannot see cannot itself be seen.",
    },
  },
  {
    module: "src/quality/blind-spots.ts",
    name: "boundDiff",
    cause: {
      kind: "lost_to_the_scan",
      why: "The same desynchronisation, a thousand lines earlier than the exports it costs: a `witness` string quotes `// W<n>` in backticks, the scan takes it for a template literal, and the four values at the end of the file \u2014 this register's own bound and its two report functions among them \u2014 are invisible to any reading of the prepared text. The register that names what other registers cannot see cannot itself be seen.",
    },
  },
  {
    module: "src/quality/blind-spots.ts",
    name: "deadProbes",
    cause: {
      kind: "lost_to_the_scan",
      why: "The same desynchronisation, a thousand lines earlier than the exports it costs: a `witness` string quotes `// W<n>` in backticks, the scan takes it for a template literal, and the four values at the end of the file \u2014 this register's own bound and its two report functions among them \u2014 are invisible to any reading of the prepared text. The register that names what other registers cannot see cannot itself be seen.",
    },
  },
  {
    module: "src/quality/blind-spots.ts",
    name: "falseBounds",
    cause: {
      kind: "lost_to_the_scan",
      why: "The same desynchronisation, a thousand lines earlier than the exports it costs: a `witness` string quotes `// W<n>` in backticks, the scan takes it for a template literal, and the four values at the end of the file \u2014 this register's own bound and its two report functions among them \u2014 are invisible to any reading of the prepared text. The register that names what other registers cannot see cannot itself be seen.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "MECHANISM",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "SELF_REFERENCE_BOUND",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "SPLIT_EXCEPTIONS",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "fixtureFiles",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "holderDiff",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "selfScanDefects",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "splitDiff",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "splitSites",
    cause: {
      kind: "lost_to_the_scan",
      why: "A `marker` field built as a real template literal sits beside `holdersAppear` strings that quote code in backticks, and after the first mismatched pair the scan blanks the rest of the file. Eight values go, this module's own bound among them \u2014 and this is the module whose subject IS a scan reading itself, losing its own exports to the scan it shares with everything else.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "ADOPTED_MODULES",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "FOREIGN_CITATIONS",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "HEADER_CITATION_BOUND",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "adoptedModuleNames",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "headerCensus",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "headerNamesUnknown",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "headerSubjectDefects",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "headerUnit",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "headerViolations",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "knownUnits",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "misplacedUnit",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    name: "screamingExports",
    cause: {
      kind: "lost_to_the_scan",
      why: "`HEADER_RULE`, the third export, is a double-quoted sentence QUOTING CODE \u2014 `// W<n>` and `BUILD_UNIT` in backticks, which is how this whole tree writes prose about itself. `blankLiterals` reads the first of those backticks as opening a template literal, loses the closing quote, and never resynchronises: twelve of the thirteen values below it are invisible to every register that reads prepared text. W388 judges a citation by whether the cited test names an export of its subject, and for this module that list is one name long.",
    },
  },
];

export const RUNTIME_BOUND =
  "IT LOADS THE MODULE, SO IT CAN ONLY MEASURE A MODULE THAT LOADS. A file with a side effect at " +
  "import time, one that throws while evaluating, or one sitting in an import cycle whose value " +
  "crosses the cycle is not in this population at all — and W381's register says this tree has " +
  "such cycles. The reading that would report them is the one that cannot run on them. SECOND, " +
  "TYPES ARE EXCLUDED BY CONSTRUCTION AND THE EXCLUSION IS A READING OF THE SOURCE. A name " +
  "declared with a spelling `typeNames` does not match — a type exported from an enum, or one " +
  "re-exported through `export type { X }` — is counted as a value, and its absence at runtime " +
  "reads here as a divergence rather than as the ordinary fact it is. THIRD, IT COMPARES NAMES AND " +
  "NOT VALUES. A module whose export is bound to something other than what the source says is a " +
  "module both readings agree about, which is the deeper version of the same question and is not " +
  "asked here. FOURTH, THE POPULATION IS W267'S CENSUS. A module outside it is read by neither " +
  "instrument, so the count of what the shared scan loses is a floor and never a total.";

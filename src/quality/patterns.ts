// W391: the pattern register — every population defined by a regex, and what it is over.
//
// Q31'S THEME, AND THE FIRST UNIT OF IT. Q29's hardening pass is four findings wearing one shape: a
// pattern stands in for a population, the pattern and the check are the same object, and so a
// pattern that matches the wrong thing reports green. Q29-CR-2 put it exactly — nothing escapes
// `patientRules` today, *which is precisely why nothing caught* that it is narrow four ways and
// wide one. There is no second instrument that would report a miss, because the pattern IS the
// instrument.
//
// SO THIS ENUMERATES THEM. For every register in W267's census, the named patterns it holds, each
// with its own source text and a sentence saying what it claims to enumerate. Pinning the TEXT is
// the mechanism: a regex edited by one character changes the population it defines, and the row
// that says what it enumerates has to be re-read rather than quietly outliving the edit.
//
// AND THE DERIVATION HAD TO STOP USING A PATTERN TO FIND PATTERNS. The first version read
// `const NAME = /.../` with a regex, and it truncated every literal containing a `/` inside a
// character class — `[\w./-]` ends the match early, so four of this tree's own patterns came back
// cut in half. That is the quarter's subject arriving in the unit that opens it, on the first run.
// What replaced it is a SCANNER that walks the literal tracking character classes and escapes,
// which is a parse rather than a match and is the remedy this register recommends everywhere else.
//
// AND THE BOUND'S SECOND CLAUSE WAS DEMONSTRATED BEFORE THE UNIT LANDED. Reading the finished rows
// back against their own literals turned up alternation sizes stated wrongly in the sentences — a
// list described as longer than it is, in more than one row. Nothing here reports that and nothing
// here could: the register checks that a sentence EXISTS, not that it is true, and the gap between
// those is the quarter. The rows are corrected; the way they got in is the subject.
//
// WHAT THIS DOES NOT PROVE is `PATTERN_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own source text.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prepareForScan } from "./scan-text";

/** One named pattern a register holds. */
export interface PatternSite {
  /** Repo-relative module, as the census spells it. */
  module: string;
  /** The constant's name. */
  name: string;
  /** The literal's own text, `/…/flags`, exactly as written. */
  source: string;
}

/**
 * The end of the regex literal beginning at `open`, or -1.
 *
 * A SCANNER AND NOT A PATTERN, which is this unit's own finding applied to itself. Inside `[...]`
 * a `/` is an ordinary character, so `/^[\w./-]+$/` ends at the LAST slash and not the third; a
 * regex reading regexes cannot know that, and the four literals it truncated in this tree are
 * `TWO_PART`, `SUBJECT_KEY`, `MODULE_PATH` and `EXPORT_CITATION`.
 */
export function literalEnd(code: string, open: number): number {
  let inClass = false;
  for (let i = open + 1; i < code.length; i += 1) {
    const c = code[i]!;
    if (c === "\\") {
      i += 1;
      continue;
    }
    if (c === "\n") return -1;
    if (inClass) {
      if (c === "]") inClass = false;
      continue;
    }
    if (c === "[") inClass = true;
    else if (c === "/") {
      let j = i + 1;
      while (j < code.length && /[gimsuy]/.test(code[j]!)) j += 1;
      return j;
    }
  }
  return -1;
}

/** Every named module-level pattern in one module's source. */
export function patternsIn(module: string, source: string): PatternSite[] {
  const code = prepareForScan(source, {
    comments: "subtracted",
    literals: "kept",
  });
  const out: PatternSite[] = [];
  for (const m of code.matchAll(
    /^(?:export )?const ([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*\//gm,
  )) {
    const open = m.index! + m[0].length - 1;
    const end = literalEnd(code, open);
    if (end === -1) continue;
    out.push({ module, name: m[1]!, source: code.slice(open, end) });
  }
  return out;
}

/** Every named pattern the census's registers hold, sorted. */
export function patternSites(
  root: string,
  members: readonly string[],
): PatternSite[] {
  return members
    .flatMap((module) => {
      const full = path.join(root, module);
      return existsSync(full)
        ? patternsIn(module, readFileSync(full, "utf8"))
        : [];
    })
    .sort((a, b) =>
      `${a.module}${a.name}`.localeCompare(`${b.module}${b.name}`),
    );
}

/** Whether anything but this pattern could produce the same population. */
export type Reading =
  /** Another derivation in this tree reads the same set, so the two can be compared. */
  | { kind: "second_reading"; by: string; why: string }
  /** Nothing else could read it, and the row says why rather than leaving it blank. */
  | { kind: "only_this"; why: string };

/** One declared pattern: what it claims to enumerate, and whether anything else could. */
export interface DeclaredPattern {
  module: string;
  name: string;
  /** The literal's text as at this unit. A one-character edit changes the population and fails. */
  source: string;
  /** What the pattern claims to enumerate, in words a reader can hold against the text. */
  claims: string;
  reading: Reading;
}

export interface PatternDefect {
  site: string;
  what: string;
}

/**
 * Where the register and the tree disagree, in five directions.
 *
 * THE THIRD IS THE ONE THIS UNIT IS FOR. A pattern edited by one character is a population changed
 * without anybody saying so, and the row that says what it enumerates goes on saying it. Pinning
 * the source text is what turns that into a build failure rather than a sentence nobody re-reads.
 */
export function patternDefects(
  root: string,
  members: readonly string[],
  declared: readonly DeclaredPattern[] = PATTERNS_AT_W391,
): PatternDefect[] {
  const found = patternSites(root, members);
  const byKey = new Map(declared.map((d) => [`${d.module}::${d.name}`, d]));
  const out: PatternDefect[] = [];

  for (const site of found) {
    const key = `${site.module}::${site.name}`;
    const row = byKey.get(key);
    if (row === undefined) {
      out.push({
        site: key,
        what: "defines a population and nothing says what it claims to enumerate",
      });
      continue;
    }
    if (row.source !== site.source) {
      out.push({
        site: key,
        what: `is declared as ${row.source} and the tree holds ${site.source}`,
      });
    }
    if (row.claims.length < 60) {
      out.push({
        site: key,
        what: "is declared without a sentence a reader could hold against it",
      });
    }
    if (row.reading.kind === "only_this" && row.reading.why.length < 120) {
      out.push({
        site: key,
        what: "says nothing else could read it, and does not say why",
      });
    }
    if (
      row.reading.kind === "second_reading" &&
      !resolves(root, row.reading.by)
    ) {
      out.push({
        site: key,
        what: `names a second reading this tree does not export: ${row.reading.by}`,
      });
    }
  }
  for (const { module, name } of declared) {
    if (!found.some((s) => s.module === module && s.name === name)) {
      out.push({
        site: `${module}::${name}`,
        what: "is declared here and the tree holds no such pattern",
      });
    }
  }
  return out.sort((a, b) =>
    `${a.site}${a.what}`.localeCompare(`${b.site}${b.what}`),
  );
}

/** Whether `module::export` names something this tree really exports. */
function resolves(root: string, ref: string): boolean {
  const [file, name] = ref.split("::");
  if (!file || !name) return false;
  const full = path.join(root, file);
  if (!existsSync(full)) return false;
  return new RegExp(`export (?:function|const) ${name}\\b`).test(
    readFileSync(full, "utf8"),
  );
}

export const PATTERNS_AT_W391: readonly DeclaredPattern[] = [
  {
    module: "src/compliance/surfaces.ts",
    name: "CENSUS_FENCE",
    source: "/```surface-census\\n([\\s\\S]*?)```/",
    claims:
      "The one fenced block in the surfaces document that carries the surface census, and everything between its opening fence and the next.",
    reading: {
      kind: "only_this",
      why: "The census exists only as prose inside a markdown document, so the fence is both the boundary and the only thing that knows where the boundary is. Nothing else in this tree parses that document, and a second fence with the same tag added above the real one would silently become the census.",
    },
  },
  {
    module: "src/console/rendered-zeros.ts",
    name: "COPY_NAME",
    source: "/\\{\\s*[A-Z][A-Z0-9_]*(?:\\.[\\w$]+|\\[[^\\]]*\\])+/",
    claims:
      "An interpolated copy constant in JSX \u2014 a braced expression opening on an ALL-CAPS name and reaching a member or an index.",
    reading: {
      kind: "only_this",
      why: "Copy constants are the tree's own convention rather than a type, so what counts as one is spelled here and nowhere else. A page that inlines its words instead of naming a constant, or names one in lower camel case, renders exactly as much text and is invisible to this pattern and to every check built on it.",
    },
  },
  {
    module: "src/console/rendered-zeros.ts",
    name: "TEXT_RUN",
    source: "/>[^<>{}]*[A-Za-z]{3,}/",
    claims:
      "Words actually shown to a reader: a run of at least three letters sitting between a closing tag and the next brace or angle bracket.",
    reading: {
      kind: "second_reading",
      by: "src/console/zero-meaning.ts::zeroSites",
      why: "W361's register walks the same console pages looking for rendered expressions rather than rendered words, so an arm this pattern calls silent while W361 finds a count in it is a disagreement two derivations can have. It is a weak second reading \u2014 the two populations overlap rather than coincide \u2014 but it is a second instrument on the same pages.",
    },
  },
  {
    module: "src/console/zero-meaning.ts",
    name: "COMPARISON",
    source: "/^\\s*(?:===|!==|==|!=|>=|<=|>|<)/",
    claims:
      "An expression continuing into a comparison operator, which means the count in front of it is being tested rather than shown.",
    reading: {
      kind: "only_this",
      why: "It is a one-token lookahead standing in for a parse of the surrounding expression, and nothing else in this tree parses that expression either. A comparison written across a line break, or one reached through a helper, leaves the count looking rendered when it is only being tested, and no second derivation would report the difference.",
    },
  },
  {
    module: "src/console/zero-meaning.ts",
    name: "COUNTING_NAME",
    source:
      "/\\b([A-Za-z_$][\\w$.]*(?:\\.length|[Cc]ount|\\.size|\\.total))\\b/g",
    claims:
      "What this tree calls a number when it renders one: an identifier path ending in length, count, size or total.",
    reading: {
      kind: "second_reading",
      by: "src/console/rendered-zeros.ts::listRenders",
      why: "W384 finds the same rendered counts structurally \u2014 from the list being mapped rather than from the name of the expression \u2014 so the two derivations reach the same population by different routes and a count named outside this vocabulary can still be found there. That crossing is why W384 was able to close W361's re-aimed bound.",
    },
  },
  {
    module: "src/console/zero-meaning.ts",
    name: "NOT_RUN_PHRASE",
    source:
      "/not (?:yet )?(?:been )?(?:run|counted|computed)|has not (?:run|happened)|first cycle/i",
    claims:
      "A page saying in its own words that a cycle has not run yet, rather than by rendering W346's named waiting component.",
    reading: {
      kind: "only_this",
      why: "The population is a set of English phrasings, and the only thing that decides whether a sentence belongs to it is this alternation. A page that says the cycle is still pending, or has yet to complete, means exactly the same thing to a reader and nothing here or anywhere else in the tree would count it as having said so.",
    },
  },
  {
    module: "src/messaging/send-path.test.ts",
    name: "WIRED",
    source:
      "/new\\s+(?:Twilio|Mock)SmsAdapter\\b|:\\s*SmsAdapter\\b|\\.send\\s*\\(/",
    claims:
      "A module wired to the SMS send path: constructing an adapter, typing something as one, or calling send on anything.",
    reading: {
      kind: "only_this",
      why: "This is the founder gate that keeps live SMS out of the tree, and it is enforced by one pattern over file text with no second instrument behind it. A send reached through an indirection this alternation does not spell would pass the gate silently, which is why the suite drives the pattern against both a wired sample and a harness rather than trusting the sweep alone.",
    },
  },
  {
    module: "src/quality/assertion-vocabulary.ts",
    name: "COUNT",
    source: "/\\.(?:length|size)$/",
    claims:
      "An assertion subject that ends in a count, which is the discriminant separating the canonical non-empty form from its near misses.",
    reading: {
      kind: "second_reading",
      by: "src/quality/tautology-sweep.ts::tautologiesIn",
      why: "W264's sweep holds a pattern with the identical source text and reads the identical population, which makes these two rows the only place in this register where a pattern really can be compared against another reading of the same set. Two copies are also a second way to be wrong: an edit to one and not the other changes one population and leaves the other, and only these rows would say so.",
    },
  },
  {
    module: "src/quality/cited-checks.ts",
    name: "SUBJECT_KEY",
    source:
      '/\\b(?:module|register|file|check|bound|rule|subject)\\s*:\\s*"(src\\/[\\w./-]+\\.ts)/',
    claims:
      "The keys this tree uses to say which module a declared row is about, and the src-relative path each one carries.",
    reading: {
      kind: "only_this",
      why: "The set of key names is a convention nobody declared anywhere else, so a register that says which module it covers under a key outside this list has a subject that this derivation simply does not see. The anchor to a leading src also means a row naming a document or a script is not a subject here even when it plainly is one.",
    },
  },
  {
    module: "src/quality/cited-checks.ts",
    name: "TWO_PART",
    source: '/"((?:[\\w./-]+)\\.(?:test|spec)\\.ts :: [^"]*)"/g',
    claims:
      "Every two-part citation in the tree: a quoted string naming a test file and a check inside it, and nothing with a third field.",
    reading: {
      kind: "only_this",
      why: "Citations are strings this tree writes by hand in a spelling it agreed with itself, and this literal is that agreement. A citation written with a different separator, or built by joining fragments, names a check just as clearly and is not in the population \u2014 which is the same failure this unit hit in its own extractor on the first run.",
    },
  },
  {
    module: "src/quality/defaulted-registers.ts",
    name: "WATCHED_DEFAULT",
    source: "/^[A-Z_][A-Z0-9_]*$|^[a-zA-Z_$][\\w$.]*\\(/",
    claims:
      "A default parameter worth watching: a register named in caps, or a derivation over the tree spelled as a call.",
    reading: {
      kind: "only_this",
      why: "The judgement of which defaults matter is entirely inside this alternation, and it is a naming convention rather than a property of the value. A default that is a lower-case constant holding the same register, or an array literal written inline, is exactly as much a hidden population and this pattern declines to watch it.",
    },
  },
  {
    module: "src/quality/derivable-lists.ts",
    name: "NAMES_A_MODULE",
    source:
      '/(?:^\\s*|\\{\\s*)(?:module|file|register|detector|bound|home):\\s*"[^"]*\\.tsx?"/m',
    claims:
      "A declared row that names a module: one of six key spellings whose value is a path ending in a TypeScript extension.",
    reading: {
      kind: "only_this",
      why: "The comment above the literal records that an earlier version anchored to the start of a line and missed every row written inline, which is this register's own subject arriving in its own scan. What survives is still a list of six key names agreed by convention, and a seventh spelling would enlarge the tree's rows without enlarging this population.",
    },
  },
  {
    module: "src/quality/empty-list-sweep.ts",
    name: "GATE_PINNED_EMPTY",
    source: "/^(SHIPPED|ENABLED|CAPTURED|DECLARED)_[A-Z0-9_]+$/",
    claims:
      "A pinned-empty register whose emptiness is a founder gate: exactly four name prefixes, and nothing derived from them.",
    reading: {
      kind: "only_this",
      why: "The four prefixes are a naming convention that stands in for a property nothing in the tree records structurally, so an empty register that is empty because a gate holds it that way, but is not named with one of these four words, reads as an unevidenced empty list. The doc comment is careful that a derived answer over such a register does not qualify, which is the sharper half of the rule and is also only here.",
    },
  },
  {
    module: "src/quality/flattering-numbers.ts",
    name: "RETURNS_A_NUMBER",
    source: "/^\\s*:\\s*number\\b/",
    claims:
      "A function whose return type is a number, read from the twenty-four characters following its parameter list.",
    reading: {
      kind: "only_this",
      why: "The window is a fixed slice of text standing in for reading the return annotation, so a return type written after a line break, or one that is an alias for a number, falls outside the population and the figure it computes is never examined. Nothing else in this tree reads return types, so the narrowness has no witness other than this row.",
    },
  },
  {
    module: "src/quality/hook-reach.ts",
    name: "IN_PROCESS",
    source:
      "/\\b(?:restoreAllMocks|resetAllMocks|clearAllMocks|unstubAllEnvs|unstubAllGlobals|useRealTimers|useFakeTimers|resetModules)\\s*\\(/",
    claims:
      "A reclaimer that only reaches this process: the eight vitest restore and reset calls, by name.",
    reading: {
      kind: "only_this",
      why: "The list is eight names written out, so a reclaimer added to vitest tomorrow, or one this tree wraps in a helper of its own, is classified by the other arm as reaching outside the process and gets held to a stricter rule than it needs. Whether that is right is a judgement no second derivation makes.",
    },
  },
  {
    module: "src/quality/hook-reach.ts",
    name: "REMOVES",
    source:
      "/\\b(?:rmSync|unlinkSync|rmdirSync)\\s*\\(|\\b(?:rm|unlink)\\s*\\(/",
    claims:
      "A reclaimer that touches the disk: the three synchronous removal calls, or a bare rm or unlink.",
    reading: {
      kind: "only_this",
      why: "It decides which cleanups outlive the process, and it decides it from five call names. A removal reached through a helper this tree wrote, or through a library, removes the same directory and is not in the population, so the hook holding it is not one this register asks to be reachable.",
    },
  },
  {
    module: "src/quality/patient-populations.ts",
    name: "PANEL",
    source:
      "/(?<![A-Za-z])(?:readonly\\s+)?(?:Patient\\s*\\[\\]|(?:Readonly)?Array\\s*<\\s*Patient\\s*>)/",
    claims:
      "A parameter typed as a panel of patients, in either the array spelling or the generic one, and not as part of a longer name.",
    reading: {
      kind: "only_this",
      why: "The module's own doc comment says it plainly: a rule that escapes this population escapes silently, because nothing else in the tree reads which functions take a patient panel. Q29-CR-2 is exactly this pattern being narrow four ways and wide one, and the reason nothing caught it is that there was no second reading to disagree with.",
    },
  },
  {
    module: "src/quality/patient-populations.ts",
    name: "ARROW",
    source: "/^export const (\\w+)\\s*(?::[^=]*)?=\\s*(?:async\\s*)?\\(([\\s\\S]*?)\\)\\s*(?::|=>)/gm",
    claims:
      "Every exported arrow constant's name and its parameter list — the other way this tree writes a function.",
    reading: {
      kind: "only_this",
      why: "W392 added it because the register it serves is about which product rules hold a patient panel, and how a rule is DECLARED has nothing to do with that. The tree writes one product export this way today, so the pattern is carrying almost no weight and the risk is the reverse of the usual one: a second arrow rule would join the population silently and correctly, while a rule written some third way — a method on a class, a default export — is invisible to this and to `SIGNATURE` both, with nothing to disagree.",
    },
  },
  {
    module: "src/quality/patient-populations.ts",
    name: "PATIENT_CONSTRAINT",
    source: "/(?<![A-Za-z])Patient\\s*(?:\\[|\\{|<|\\.|\\[\")/",
    claims:
      "A type-parameter constraint that says the things it constrains are patients — `Patient[]`, `Patient[\"id\"]`, a member of one, or an object type opening on one.",
    reading: {
      kind: "only_this",
      why: "THE PATTERN W392 EXISTS BECAUSE OF, and it is doing the work a type checker would. A generic rule spells its parameter `readonly T[]`, which says nothing; what says the members are patients is the CONSTRAINT, so this decides whether `T` counts. It is deliberately narrow — `scopeToPractice<T extends { practiceId: string }>` filters rows of every kind and must not count — and being narrow is also its whole exposure: a constraint naming a patient in a way not listed here leaves a rule outside the population exactly as `narrowToCareGaps` was, and no second reading would notice. `RULE_BOUND` says so and names the remedy: resolving types rather than matching them.",
    },
  },
  {
    module: "src/quality/patient-populations.ts",
    name: "SIGNATURE",
    source:
      "/^export (?:async )?function (\\w+)\\s*(?:<[^>]*>)?\\(([\\s\\S]*?)\\)\\s*(?::|\\{)/gm",
    claims:
      "Every exported function declaration's name and its whole parameter list — `async` or not, generic or not — read to the parenthesis before the return type or the body.",
    reading: {
      kind: "second_reading",
      by: "src/quality/decision-moments.ts::parametersOf",
      why: "W387 reads one named function's parameter list by scanning to a balanced parenthesis rather than by matching, and returns each parameter's name and type, so pointed at the same function the two produce the same list. The comment above this literal records that an earlier lazy version truncated at the first parenthesis and lost the second parameter, which the scanner cannot do.",
    },
  },
  {
    module: "src/quality/pins.ts",
    name: "PIN_NAME",
    source:
      "/^[A-Z][A-Z0-9_]*(_AT_W\\d+|_LAST_UNIT|_FIRST_UNIT|_SURFACE_FLOOR)$/",
    claims:
      "A frozen number's name: caps, ending in one of four suffixes that mark a pin, a range bound, or W270's floor.",
    reading: {
      kind: "second_reading",
      by: "src/quality/self-defeating.ts::frozenEqualities",
      why: "W332 reads the same names out of assertion text with a pattern of its own, so the pins arm of this population has a second instrument over it. The second reading is partial and the row says so: it covers only the _AT_W suffix, and the three other suffixes this pattern accepts are read here and nowhere else.",
    },
  },
  {
    module: "src/quality/self-defeating.ts",
    name: "FROZEN_NAME",
    source: "/\\b([A-Z][A-Z0-9_]*_AT_W\\d+)\\b/",
    claims:
      "The frozen pin an assertion is about, taken from the expected side of the equality after literals are blanked.",
    reading: {
      kind: "second_reading",
      by: "src/quality/pins.ts::pinsInTree",
      why: "Every name this pattern accepts is also a name W251's walk accepts, since its suffix set contains this one, so the two derivations can be held against each other over the _AT_W pins. What they do with them differs \u2014 one finds the declarations, the other finds the assertions about them \u2014 but the population is comparable, which is rare in this register.",
    },
  },
  {
    module: "src/quality/self-ending.ts",
    name: "WAIT_DISCRIMINANTS",
    source: '/\\bkind:\\s*"(?:deferred|pending|remedy)"/',
    claims:
      "A register still recording a wait: one of three discriminant words in a kind field, with the quote closed so longer words do not match.",
    reading: {
      kind: "only_this",
      why: "Three words stand in for the whole idea of a deferral, and the doc comment is explicit that closing the quote is what keeps remedy_built from matching remedy. That precision cuts both ways: a wait recorded under a fourth word, or under a field not called kind, is a wait this tree is still carrying that this register reports as ended.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    name: "JOINED_TABLE",
    source: '/\\.map\\(\\(\\w+\\)\\s*=>\\s*\\w+\\.join\\(""\\)\\)/',
    claims:
      "A marker split across a table of fragments and joined back \u2014 the map-then-join idiom, as distinct from an ordinary test table.",
    reading: {
      kind: "only_this",
      why: "The comment above it records the narrowing that made it usable: eighteen modules write the table alone, so the join is what makes a table an evasion. That leaves every other way of assembling a string out of pieces outside the population, and a marker built by reduce or by concatenation evades the scan exactly as well and is not reported.",
    },
  },
  {
    module: "src/quality/shared-state.ts",
    name: "ENV_READ",
    source: "/process\\.env\\.[A-Z0-9_]+/",
    claims:
      "Any read of a named environment variable off the process environment, which is state one test file shares with another.",
    reading: {
      kind: "only_this",
      why: "It requires the variable to be spelled in caps directly after process.env, so an indirect read through a destructure or a bracket index reaches the same shared state and is not counted. Since the register's whole purpose is to enumerate what is shared between files, a read it cannot see is a sharing nobody has recorded.",
    },
  },
  {
    module: "src/quality/shared-state.ts",
    name: "ENV_WRITE",
    source:
      "/process\\.env\\.[A-Z0-9_]+\\s*=|delete\\s+process\\.env\\.|stubEnv\\s*\\(/",
    claims:
      "A write to the process environment: an assignment, a delete, or a vitest stub of a variable.",
    reading: {
      kind: "only_this",
      why: "Three spellings stand in for every way a file can change what another file will read. A write performed inside a helper, or through a saved reference to the environment object, is the ordering hazard this register exists to find and it is outside the population \u2014 and being outside it means the module is classified as a reader instead.",
    },
  },
  {
    module: "src/quality/shared-state.ts",
    name: "EXIT_HANDLER",
    source: "/process\\.(?:once|on)\\(\\s*[\"'`]exit/",
    claims:
      "A handler registered against process exit, which W385 measured never fires under this tree's forks pool.",
    reading: {
      kind: "only_this",
      why: "It matches the registration call and its first argument only, so a handler registered from a variable holding the event name, or through a wrapper, is the same never-firing cleanup and is not reported. The finding this pattern carries is a measured one and it would be worth more if a second derivation confirmed the site list.",
    },
  },
  {
    module: "src/quality/shared-state.ts",
    name: "ROOT_STATE_READ",
    source: "/(?:artefactsPresent|uncleanMessage)\\(\\s*ROOT\\b/",
    claims:
      "A read of what the repository holds right now rather than of a copy: two named helpers, called on ROOT.",
    reading: {
      kind: "only_this",
      why: "Two function names and one argument spelling stand in for the whole idea of reading live repository state, so any third helper added later, or either of these two called on a variable that happens to hold the root, reads the same live state without joining the population. The tree's own convention of spelling the root ROOT is the only thing holding this together.",
    },
  },
  {
    module: "src/quality/tautology-sweep.ts",
    name: "COUNT",
    source: "/\\.(?:length|size)$/",
    claims:
      "An assertion subject that ends in a count, deliberately excluding an indexOf call and a bare identifier.",
    reading: {
      kind: "second_reading",
      by: "src/quality/assertion-vocabulary.ts::formOf",
      why: "W299 holds a pattern with the identical source and uses it for the same discriminant, so this population has a real second reading \u2014 and the two copies are themselves a hazard, since an edit to either changes one population and not the other. These two rows are the only pair in this register whose sources are character-for-character the same.",
    },
  },
  {
    module: "src/quality/typed-names.ts",
    name: "EXPORT_CITATION",
    source: "/^[\\w./-]+\\.tsx?::[A-Za-z_][\\w.]*$/",
    claims:
      "The tight citation spelling: a file path, two colons, an export name, optionally reaching a member.",
    reading: {
      kind: "second_reading",
      by: "src/quality/cited-checks.ts::exportsOf",
      why: "W388 lists what a module really exports, so a citation this pattern accepts can be checked against the exports it names rather than only against its own shape. What the second reading does not cover is the opposite direction: a citation written in a spelling this pattern rejects is never handed to it at all.",
    },
  },
  {
    module: "src/quality/typed-names.ts",
    name: "MODULE_PATH",
    source:
      "/^(src|app|e2e|scripts|docs|supabase)\\/[\\w./-]+\\.(ts|tsx|md|sql|mts)$/",
    claims:
      "A repo-relative path to a file this tree holds: one of six top directories, and one of five extensions.",
    reading: {
      kind: "second_reading",
      by: "src/quality/typed-names.ts::resolveName",
      why: "The pattern says a string looks like a module path and the resolver says whether that file exists, so the second reading is the stronger of the two and disagreement between them is visible. It is a second reading of membership only: a real module under a seventh top directory is rejected by the pattern and never reaches the resolver.",
    },
  },
  {
    module: "src/quality/typed-names.ts",
    name: "UNIT",
    source: "/^W\\d+$/",
    claims:
      "A ledger row id: the letter W and digits, anchored at both ends so a sentence mentioning a unit is not one.",
    reading: {
      kind: "only_this",
      why: "It is the tightest pattern in this register and its whole content is the anchoring, which is what keeps prose out. The population it defines is a spelling and not a fact: whether W391 is a row the ledger actually holds is a different question, and this pattern answers a string-shaped one that nothing else in the tree asks.",
    },
  },
  {
    module: "src/security/instruction-sinks.ts",
    name: "SOURCE_EXT",
    source: "/\\.(ts|tsx|mts|cts|js|mjs)$/",
    claims:
      "A file this walk will read as source: six JavaScript and TypeScript extensions, at the end of the name.",
    reading: {
      kind: "second_reading",
      by: "src/security/reachability.ts::resolveFirstParty",
      why: "The reachability resolver decides the same question \u2014 which files in this tree are source \u2014 by trying extensions when it resolves a specifier, so the two lists can be compared and a file type one accepts and the other does not is visible. The lists are maintained separately, which is exactly why comparing them is worth something.",
    },
  },
  {
    module: "src/security/reachability.ts",
    name: "BARE_IMPORT_RE",
    source: "/(?:^|\\n)\\s*import\\s*[\"']([^\"']+)[\"']/g",
    claims:
      "A side-effect import: the import keyword followed straight by a quoted specifier, with no bindings.",
    reading: {
      kind: "second_reading",
      by: "src/quality/import-cycles.ts::moduleGraph",
      why: "W381 builds the import graph over the same tree with a derivation of its own, so the edge set this control depends on has a second reading and a specifier one finds and the other misses is a disagreement somebody could see. This matters more here than elsewhere: the module's own comment says a control proving unreachability must not be able to miss an import.",
    },
  },
  {
    module: "src/security/reachability.ts",
    name: "IMPORT_RE",
    source:
      "/(?:^|\\n)\\s*(?:import|export)\\s[^;=]*?from\\s*[\"']([^\"']+)[\"']/g",
    claims:
      "Every import or re-export naming a module it comes from, and the specifier each one carries.",
    reading: {
      kind: "second_reading",
      by: "src/quality/import-cycles.ts::moduleGraph",
      why: "The same second reading as the bare-import row and for the same reason: W381 walks the tree's imports independently to find cycles, so this population is one of the very few here that two derivations reach. The comment above the literal records three earlier ways it was wrong, including consuming a region and hiding a real import inside it.",
    },
  },
  {
    module: "src/security/reachability.ts",
    name: "SPECIFIER_RE",
    source: "/^[^\\s{}()<>=,;\"']+$/",
    claims:
      "A real module specifier and not junk swept up by the import patterns: no whitespace and no punctuation that a specifier never holds.",
    reading: {
      kind: "only_this",
      why: "It is a filter over the other two patterns rather than a reading of the tree, so its population depends on what they already matched and nothing independent produces it. A specifier holding a character this class excludes would be dropped silently, and the only witness would be the import disappearing from a graph nobody compares against another.",
    },
  },
];

export const PATTERN_BOUND =
  "IT ENUMERATES NAMED PATTERNS AND A POPULATION CAN BE DEFINED WITHOUT ONE. A regex written " +
  "inline at its call site, or built with `new RegExp` from parts, defines a population exactly as " +
  "a named constant does and appears in no answer here — this tree writes both, and `bounds.ts` " +
  "assembles one from fragments on purpose so a scan cannot match itself. What the naming buys is " +
  "that a pattern with a name is one somebody can hold a sentence against; what it costs is every " +
  "pattern without one. SECOND, `claims` IS A SENTENCE AND THE REGISTER ONLY CHECKS THAT IT " +
  "EXISTS. Whether the words describe what the literal matches is a reading nobody has automated, " +
  "and the whole quarter is about the gap between those two — so this register opens the quarter " +
  "by writing the gap down rather than by closing it. THIRD, PINNING THE TEXT CATCHES AN EDIT AND " +
  "NOT A DRIFT. A pattern whose text is unchanged still enumerates something different the day the " +
  "tree starts writing a construct it was never asked about, which is Q29-CR-2 exactly: the regex " +
  "did not move, the tree grew a callback parameter, and the population quietly stopped meaning " +
  "what the row said. FOURTH, THE POPULATION IS W267'S CENSUS. A register that walks the tree " +
  "without a census row holds patterns nobody here reads.";

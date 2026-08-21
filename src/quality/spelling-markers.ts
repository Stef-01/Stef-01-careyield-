// W366 — A MARKER THAT IS A SPELLING.
//
// A register that finds its subject by reading text is keyed to how that subject is WRITTEN, and
// the two are not the same thing. `privateCopies` looks for the ledger row parse and its marker is
// the regex `/^\|`; W344 wrote the eighth copy of that parse with `startsWith` and the register —
// built one quarter earlier, for exactly this — reported a clean tree. W360 found it by hand and
// fixed the COPY. The marker is unchanged, so the register is blind to the next one.
//
// THIS UNIT ASKS THE SAME QUESTION OF EVERY TEXT-SCANNING REGISTER IN THE TREE, and it asks it by
// measurement rather than by reading the regex and forming an opinion. Each row plants two files
// into a copied tree: one spelled the way the register expects, one spelled differently and
// otherwise the same. The control proves the plumbing works; the variant is the answer. A row
// declaring `caught` whose variant is missed fails, and a row declaring `blind` whose variant is
// found fails the other way — the tree outgrowing a finding is as much a defect as acquiring one.
//
// THE POPULATION IS DERIVED, not listed: `SCAN_SITES` in `scan-text.ts` already declares every
// module that prepares source text for scanning, and W302 checks that register against the tree in
// both directions. A module that starts reading text joins this population without anybody
// remembering to add it here.
//
// WHY A BLIND MARKER IS NOT AUTOMATICALLY A DEFECT. Whether blindness matters depends on whether
// the tree could actually acquire the second spelling, which is a different question from whether
// the detector would miss it. `.reduceRight(` is an ordinary fold anybody might write; `unit:"W318"`
// without the space is a thing the formatter rewrites before it reaches a commit. Both are missed;
// only one is a hole. Each blind row states which, and `happened` is reserved for the one this tree
// has actually paid for.
//
// WHAT IT CANNOT SEE is `SPELLING_BOUND`, below.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads and plants this repository's own source text.

import { readFileSync } from "node:fs";
import path from "node:path";
import { acceptanceCarryingModules } from "./acceptances";
import { appliedExemptions } from "./exemption-reach";
import { handListedRegisters } from "./derivable-lists";
import { namingSites } from "./declaration-tax";
import { numberReturningExports } from "./flattering-numbers";
import { discoverFoldSites } from "./order-independence";
import { copyTree, planterDiff, withPlantedIn, withTree as withRoot } from "./planting";
import { hookSites } from "./hook-reach";
import { mutantsIn } from "./mutation-sampling";
import { silentZeros } from "@/console/rendered-zeros";
import { moduleGraph } from "./import-cycles";
import { repositoryWrites } from "./shared-state";
import { parametersOf } from "./decision-moments";
import { citationsInTree } from "./cited-checks";
import { patternSites } from "./patterns";
import { momentsOf } from "./moments";
import { reclamationSites } from "./run-residue";
import { privateCopies } from "./private-copies";
import { SCAN_SITES, fixtureText } from "./scan-text";
import { nameSites } from "./typed-names";
import { headerCensus } from "./unit-headers";

/** The file every probe plants into. One name, so a leak is obvious and a probe cannot collide. */
export const PROBE_FILE = "src/quality/spelling-probe.ts";

/** What a probe measured: whether the register found each of the two plants. */
export interface Reading {
  /** The register found the canonical spelling. False means the probe proves nothing. */
  control: boolean;
  /** The register found the differently-spelled instance. */
  variant: boolean;
}

/** A probe: two plants into a copied tree, and whether the register saw each. */
export type Probe = (root: string) => Reading;

/**
 * Whether the tree could really acquire the second spelling.
 *
 * The distinction this unit turns on. A miss nobody could ever write is a curiosity; a miss
 * somebody already wrote is the reason the register exists.
 */
export type Plausibility =
  /** The tree HAS held this spelling. Named with the unit that wrote it and the one that found it. */
  | "happened"
  /** Ordinary code. Nothing stops it arriving tomorrow. */
  | "idiomatic"
  /** The formatter rewrites it, so it cannot reach a commit in this tree. */
  | "formatter_forbids";

/** How a marker stands against a second spelling of its own subject. */
export type SpellingStanding =
  /** Driven: the register finds the variant. */
  | { kind: "caught"; looksLike: string; probe: Probe }
  /** Driven: the register misses the variant. The finding. */
  | { kind: "blind"; looksLike: string; plausibility: Plausibility; probe: Probe }
  /**
   * Nobody has tried a second spelling against this marker.
   *
   * The row this unit exists to report. `why` is what stopped it, not an excuse for stopping —
   * every one of these is a probe somebody can write.
   */
  | { kind: "untried"; why: string };

/** One text-scanning register, and what a differently-spelled instance would look like to it. */
export interface Marker {
  /** The scan site, as `SCAN_SITES` spells it. The population is derived from those modules. */
  module: string;
  /** The literal text the register keys on, in its own words. */
  matches: string;
  standing: SpellingStanding;
}

/** Plant two files in turn and report whether `find` saw each. */
function twoSpellings(
  root: string,
  canonical: string,
  variant: string,
  find: (root: string) => boolean,
): Reading {
  const copy = copyTree(root);
  const saw = (body: string) => withPlantedIn(copy, { [PROBE_FILE]: body }, () => find(copy));
  return { control: saw(canonical), variant: saw(variant) };
}

/** Whether a register's answer names the planted file. */
const names = (answer: unknown): boolean => JSON.stringify(answer).includes("spelling-probe");

export const MARKERS: readonly Marker[] = [
  {
    module: "src/quality/mutation-sampling.ts",
    matches:
      "the operator TOKENS themselves — `===`, `!==`, `&&`, `>=`, `<=` — found as text in the " +
      "prepared source, which is as keyed to a spelling as a register gets",
    standing: {
      kind: "blind",
      looksLike:
        "`if (a == b)` — loose equality, the same comparison written the other way. There is no `eq-to-neq` operator for it, so a module written with `==` and `!=` yields no mutants at all and reads in every sweep as a module whose every line is already covered.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          "export const same = (a: number, b: number): boolean => a === b;\n",
          "export const same = (a: number, b: number): boolean => a == b;\n",
          (copy) =>
            mutantsIn(PROBE_FILE, readFileSync(path.join(copy, PROBE_FILE), "utf8"), "none").length > 0,
        ),
    },
  },
  {
    module: "src/quality/private-copies.ts",
    matches:
      "every marker line of a parse's fixture block, `code.includes(marker)` — for the ledger row " +
      "parse those lines are `BUILD-STATE.md` and the regex `/^\\|`",
    standing: {
      kind: "blind",
      looksLike:
        "a module that reads `BUILD-STATE.md` and splits its rows with `line.startsWith(\"|\")` " +
        "instead of a `/^\\|` regex — the same parse, one marker short of the conjunction.",
      plausibility: "happened",
      probe: (root) =>
        twoSpellings(
          root,
          'const ledger = "BUILD-STATE.md";\nconst row = /^\\|/;\nexport const parse = [ledger, row];\n',
          'const ledger = "BUILD-STATE.md";\nexport function rows(line: string) {\n  return line.startsWith("|");\n}\n',
          (copy) => names(privateCopies(copy)),
        ),
    },
  },
  {
    module: "src/quality/hook-reach.ts",
    matches: "a hook call at the start of a line, and the body of a function defined beside it that the hook calls by name",
    standing: {
      kind: "blind",
      looksLike:
        "`afterAll(() => cleanUp())` where `cleanUp` calls `wipe` and `wipe` is the one that removes — the same removal one call further away, which this reading does not follow.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          fixtureText("hook-spelling-one-level"),
          fixtureText("hook-spelling-two-levels"),
          (copy) =>
            hookSites(copy).some((site) => site.module === PROBE_FILE && site.reclaims === "outside_the_process"),
        ),
    },
  },
  {
    module: "src/console/rendered-zeros.ts",
    matches:
      "words in the empty arm of a conditional: a run of letters between tags, or an interpolation " +
      "of a SCREAMING_CASE copy constant",
    standing: {
      kind: "blind",
      looksLike:
        "`{rows.length === 0 ? <EmptyState /> : <ul>…</ul>}` — the empty arm renders a COMPONENT, which puts words in front of the reader exactly as a paragraph does and which this scan reads as silence, because a component's own copy lives in another file.",
      plausibility: "idiomatic",
      probe: (root) => {
        // Not `twoSpellings`: that plants into a module under `src/`, and this detector only reads
        // `page.tsx` under `app/console/`. Same shape, planted where it can be seen.
        const copy = copyTree(root);
        const page = "app/console/spelling-probe/page.tsx";
        // BOTH NAMES SPELLED OUT. `fixtureText(name)` behind a parameter is a call W307's citation
        // check cannot resolve, and an uncited block is one nothing keeps in step with its loader.
        const saw = (body: string) =>
          withPlantedIn(copy, { [page]: body }, () =>
            !silentZeros(copy).includes("/console/spelling-probe :: rows"),
          );
        return {
          control: saw(fixtureText("zero-probe-ternary")),
          variant: saw(fixtureText("zero-probe-component-empty")),
        };
      },
    },
  },
  {
    module: "src/quality/cited-checks.ts",
    matches: "a double-quoted string of the form `<file>.test.ts :: <assertion>`, in exactly two parts",
    standing: {
      kind: "blind",
      looksLike:
        "the same citation written with single quotes or in a template literal, which is a citation this tree could write tomorrow and which this scan does not read at all.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          'export const ROWS = [{ module: "src/quality/planting.ts", citation: "src/quality/planting.test.ts :: refuses a root" }];\n',
          "export const ROWS = [{ module: 'src/quality/planting.ts', citation: 'src/quality/planting.test.ts :: refuses a root' }];\n",
          (copy) => citationsInTree(copy).some((c) => c.citing === PROBE_FILE),
        ),
    },
  },
  {
    module: "src/quality/patterns.ts",
    matches: "a regex literal assigned to an ALL-CAPS-or-camel name by a `const` starting its own line",
    standing: {
      kind: "blind",
      looksLike:
        "a group of patterns held together in one object — `const SPELLINGS = { unit: /^W\\d+$/, module: /^src\\// }` — which is ordinary code, defines two populations exactly as two constants would, and reaches this register as nothing at all.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          "export const PROBE_UNIT = /^W\\d+$/;\n",
          "export const PROBE_SPELLINGS = { unit: /^W\\d+$/ };\n",
          (copy) => patternSites(copy, [PROBE_FILE]).length > 0,
        ),
    },
  },
  {
    module: "src/quality/decision-moments.ts",
    matches: "a parameter named `todayIso`, `sessionDate`, `atIso`, `sentAtIso`, `nowIso`, `asOfIso` or `window`",
    standing: {
      kind: "blind",
      looksLike:
        "`decidedOn: string` — a date parameter named for what it is about rather than for its shape, which this tree could write tomorrow and which the register would read as naming no moment at all.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          "export function probeDecide(eligible: Patient[], todayIso: string): Patient[] {\n  return eligible;\n}\n",
          "export function probeDecide(eligible: Patient[], decidedOn: string): Patient[] {\n  return eligible;\n}\n",
          (copy) =>
            parametersOf(readFileSync(path.join(copy, PROBE_FILE), "utf8"), "probeDecide").some((p) =>
              /^(?:todayIso|nowIso|atIso|sentAtIso|sessionDate|asOfIso|window)$/.test(p.name),
            ),
        ),
    },
  },
  {
    module: "src/quality/shared-state.ts",
    matches: "a write call whose target is `path.join(ROOT, \"…\")`, or a name bound to one",
    standing: {
      kind: "blind",
      looksLike:
        "`path.resolve(ROOT, \"src/planted\")` — the other way this tree builds a path, which reaches the same directory and which this scan does not read at all.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          'const p = path.join(ROOT, "src/planted");\nmkdirSync(p, { recursive: true });\n',
          'const p = path.resolve(ROOT, "src/planted");\nmkdirSync(p, { recursive: true });\n',
          (copy) => repositoryWrites(readFileSync(path.join(copy, PROBE_FILE), "utf8")).length > 0,
        ),
    },
  },
  {
    module: "src/quality/import-cycles.ts",
    matches: "a line beginning `import`, up to the `from \"…\";` that ends the statement",
    standing: {
      kind: "blind",
      looksLike:
        "`export { x } from \"./y\"` — a re-export, which is an edge the module graph carries at runtime exactly like an import and which this scan does not read at all.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          'import { thing } from "@/quality/pins";\nexport const uses = () => thing;\n',
          'export { PINS as thing } from "@/quality/pins";\n',
          (copy) => JSON.stringify([...moduleGraph(copy).get(PROBE_FILE) ?? []]).includes("pins"),
        ),
    },
  },
  {
    module: "src/quality/moments.ts",
    matches: "an export name followed by an opening bracket, or a SCREAMING export taken bare",
    standing: {
      kind: "blind",
      looksLike:
        "a call reached through an alias — `import { derives as run }` and then `run(root)` — which is the same module answering at the same moment under a name the scan was never told about.",
      plausibility: "idiomatic",
      // THE SUBJECT AND ITS CALLER ARE DIFFERENT MODULES, so `twoSpellings` cannot be used: it
      // plants a single file, and what varies here is the caller's spelling of the import.
      probe: () => {
        const seen = (caller: string) =>
          withRoot(
            { "src/planted/subject.ts": fixtureText("moment-subject-module"), "src/planted/asks.test.ts": caller },
            (root) => momentsOf(root, "src/planted/subject.ts").length > 0,
          );
        return {
          control: seen(fixtureText("moment-caller-per-test")),
          variant: seen(fixtureText("moment-caller-aliased")),
        };
      },
    },
  },
  {
    module: "src/quality/run-residue.ts",
    matches: "`rmSync` followed by an opening bracket, with comments subtracted and literals blanked first",
    standing: {
      kind: "blind",
      looksLike:
        "`await rm(dir, { recursive: true })` from `fs/promises` — the same removal written with the API the rest of Node has moved to, and the one this tree's own bound names as outside the population.",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          'import { rmSync } from "node:fs";\nexport function clears(d: string): void {\n  rmSync(d, { recursive: true });\n}\n',
          'import { rm } from "node:fs/promises";\nexport async function clears(d: string): Promise<void> {\n  await rm(d, { recursive: true });\n}\n',
          (copy) => names(reclamationSites(copy)),
        ),
    },
  },
  {
    module: "src/quality/acceptances.ts",
    matches: "`reviewBy:` immediately followed by a quote, so the field and its value are one token",
    standing: {
      kind: "blind",
      looksLike: "`reviewBy :` with a space before the colon, or the field quoted as `\"reviewBy\":`",
      plausibility: "formatter_forbids",
      probe: (root) =>
        twoSpellings(
          root,
          'export const A = [{ id: "x", reviewBy: "2027-01-01", why: "y" }];\n',
          'export const A = [{ id: "x", reviewBy : "2027-01-01", why: "y" }];\n',
          (copy) => acceptanceCarryingModules(copy).includes(PROBE_FILE),
        ),
    },
  },
  {
    module: "src/quality/typed-names.ts",
    matches: "`unit: \"W318\"` — the field, a colon, a space, and the quoted citation",
    standing: {
      kind: "blind",
      looksLike: "`unit:\"W318\"` with the space closed up",
      plausibility: "formatter_forbids",
      probe: (root) =>
        twoSpellings(
          root,
          'export const A = [{ unit: "W318" }];\n',
          'export const A = [{ unit:"W318" }];\n',
          (copy) => names(nameSites(copy)),
        ),
    },
  },
  {
    module: "src/quality/order-independence.ts",
    matches: "`.reduce(` — the fold this tree writes",
    standing: {
      kind: "blind",
      looksLike: "`.reduceRight(`, which is the same fold with the same order-dependence",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          "export const f = (a: number[]) => a.reduce((x, y) => x + y, 0);\n",
          "export const f = (a: number[]) => a.reduceRight((x, y) => x + y, 0);\n",
          (copy) => names(discoverFoldSites(copy)),
        ),
    },
  },
  {
    module: "src/quality/declaration-tax.ts",
    matches: "a module path written as one string literal — `\"src/quality/bounds.ts\"`",
    standing: {
      kind: "blind",
      looksLike: 'the same path built from pieces — `"src/quality/" + "bounds.ts"`',
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          'export const D = ["src/quality/bounds.ts"];\n',
          'export const D = ["src/quality/" + "bounds.ts"];\n',
          (copy) => namingSites(copy, "src/quality/bounds.ts").includes(PROBE_FILE),
        ),
    },
  },
  {
    module: "src/quality/flattering-numbers.ts",
    matches: "`): number` on the signature line, read from the text after the parameter list",
    standing: {
      kind: "caught",
      looksLike: "the return type wrapped onto the next line — `export function n():\\n  number`",
      probe: (root) =>
        twoSpellings(
          root,
          "export function n(): number {\n  return 1;\n}\n",
          "export function n():\n  number {\n  return 1;\n}\n",
          (copy) => names(numberReturningExports(copy)),
        ),
    },
  },
  {
    module: "src/quality/planting.ts",
    matches: "a `writeFileSync` call in a module the planter register does not except",
    standing: {
      kind: "caught",
      looksLike: 'the call reached through a namespace import — `import * as fs` then `fs.writeFileSync`',
      probe: (root) =>
        twoSpellings(
          root,
          'import { writeFileSync } from "node:fs";\nexport const w = () => writeFileSync("a", "b");\n',
          'import * as fs from "node:fs";\nexport const w = () => fs.writeFileSync("a", "b");\n',
          (copy) => names(planterDiff(copy)),
        ),
    },
  },
  {
    module: "src/quality/unit-headers.ts",
    matches: "`export const NAME` on one line, which is how W320 learns what a module owns",
    standing: {
      kind: "caught",
      looksLike: "the declaration wrapped — `export const` and the name on the next line",
      probe: (root) =>
        twoSpellings(
          root,
          'export const PLANTED_BOUND = "x";\n',
          'export const\n  PLANTED_BOUND = "x";\n',
          (copy) => names(headerCensus(copy, "BUILD-STATE.md")),
        ),
    },
  },
  {
    module: "src/quality/derivable-lists.ts",
    matches:
      "a register entry's key naming a module path — `module:`, `file:`, `register:`, `detector:`, " +
      "`bound:` or `home:` followed by a quoted `.ts`",
    standing: {
      kind: "blind",
      looksLike:
        "the same entry keyed `path:` — a seventh spelling of the one idea, which the register " +
        "reads by an enumerated list of six",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          fixtureText("w366-module-keyed-register"),
          fixtureText("w366-path-keyed-register"),
          (copy) => handListedRegisters(copy).some((r) => r.includes("spelling-probe")),
        ),
    },
  },
  {
    module: "src/quality/exemption-reach.ts",
    matches:
      "a detector's defaulted exemption parameter — `Readonly<Record<string, string>> = NAME,` — " +
      "with the trailing comma the multi-line signature carries",
    standing: {
      kind: "blind",
      looksLike:
        "the same parameter written LAST on a single-line signature, where there is no trailing " +
        "comma for the scan to anchor on",
      plausibility: "idiomatic",
      probe: (root) =>
        twoSpellings(
          root,
          // W307's rule: spelled inline, these two bodies sat in THIS file as literals and W355's
          // defaulted-register scan read the wrapped one as a real parameter nobody drives.
          fixtureText("w366-exemption-parameter-wrapped"),
          fixtureText("w366-exemption-parameter-inline"),
          (copy) => appliedExemptions(copy).some((e) => e.includes("spelling-probe")),
        ),
    },
  },
  {
    module: "src/compliance/composed-copy.ts",
    matches: "a prose sentence assembled inside a function that renders copy",
    standing: {
      kind: "untried",
      why:
        "The control does not plant. This register's population is functions it has already " +
        "identified as COMPOSING — a plausible sentence in a bare exported function joins nothing, " +
        "so a variant would be measured against an empty control and prove nothing either way. " +
        "What it needs is a plant shaped like a real render site, which is a fixture rather than " +
        "a line: the probe is writable and is not written.",
    },
  },
  {
    module: "src/quality/shared-excuses.ts",
    matches: "the reason sentence itself, as a literal, matched against the other reasons in the tree",
    standing: {
      kind: "untried",
      why:
        "Sharing is the subject, so a single plant cannot be a control: the register reports a " +
        "sentence given TWICE, and one planted file gives it once. The probe has to plant a pair " +
        "and vary the spelling of only the second — writable, two plants instead of one, and not " +
        "written here.",
    },
  },
  {
    module: "src/quality/self-ending.ts",
    matches: "`kind: \"deferred\"` — how this tree spells a wait",
    standing: {
      kind: "untried",
      why:
        "The control does not plant. `allEndings` reads named registers rather than sweeping the " +
        "tree for the marker, so a planted module holding the literal joins no population and the " +
        "control comes back false. Whether that makes it a text marker at all is the question the " +
        "probe would settle, and settling it means planting into an existing register's table " +
        "rather than into a new file.",
    },
  },
  {
    module: "src/quality/tautology-sweep.ts",
    matches: "the assertion forms this tree writes — `expect(x).toEqual(y)` and its siblings",
    standing: {
      kind: "untried",
      why:
        "The subject lives in TEST files and the plant has to be a test the sweep will read " +
        "without vitest collecting it, which is the one plant shape this tree's helpers do not " +
        "already have. The variant is obvious once the control exists — `assert.deepEqual` is the " +
        "same assertion spelled outside the framework.",
    },
  },
  {
    module: "src/quality/self-reference.ts",
    matches: "a literal assembled from fragments — an array of strings with `.join(\"\")`",
    standing: {
      kind: "untried",
      why:
        "The first attempt measured a variant as CAUGHT and the reading did not survive reading: " +
        "the plant carried no join at all, so a true answer meant the probe was measuring " +
        "something other than what it planted. An unexplained control is worth less than no " +
        "control, and this row records that rather than the number it produced.",
    },
  },
];

/** What is wrong with a marker, in the tree's words. */
export interface MarkerDefect {
  module: string;
  what: string;
}

/** Every scan site the markers do not cover, and every marker naming a module that is not one. */
export function censusDefects(
  markers: readonly Marker[] = MARKERS,
  sites: readonly { module: string }[] = SCAN_SITES,
): MarkerDefect[] {
  const declared = new Set(markers.map((m) => m.module));
  const scanning = new Set(sites.map((s) => s.module));
  const defects: MarkerDefect[] = [];
  for (const site of scanning) {
    if (!declared.has(site)) {
      defects.push({ module: site, what: "prepares text for scanning and no marker declares how it matches" });
    }
  }
  for (const marker of markers) {
    if (!scanning.has(marker.module)) {
      defects.push({ module: marker.module, what: "is declared as a marker and no longer prepares text for scanning" });
    }
  }
  return defects.sort((a, b) => a.module.localeCompare(b.module));
}

/**
 * Every driven row whose declaration the tree contradicts, in both directions.
 *
 * A control that does not fire is its own defect: it means the row's `blind` or `caught` was
 * measured against a plant the register never saw, which is the reading W295 calls no reading.
 */
export function drivenDefects(root: string, markers: readonly Marker[] = MARKERS): MarkerDefect[] {
  const defects: MarkerDefect[] = [];
  for (const marker of markers) {
    const standing = marker.standing;
    if (standing.kind === "untried") continue;
    const reading = standing.probe(root);
    if (!reading.control) {
      defects.push({ module: marker.module, what: "the control plant is not found, so the reading measures nothing" });
      continue;
    }
    if (standing.kind === "caught" && !reading.variant) {
      defects.push({ module: marker.module, what: "declared `caught` and the second spelling is missed" });
    }
    if (standing.kind === "blind" && reading.variant) {
      defects.push({ module: marker.module, what: "declared `blind` and the second spelling is found — the marker has been widened" });
    }
  }
  return defects;
}

/** The markers nobody has tried a second spelling against, by name. */
export function untriedMarkers(markers: readonly Marker[] = MARKERS): string[] {
  return markers.filter((m) => m.standing.kind === "untried").map((m) => m.module).sort();
}

/** The markers a second spelling gets past, by name. The finding. */
export function blindMarkers(markers: readonly Marker[] = MARKERS): string[] {
  return markers.filter((m) => m.standing.kind === "blind").map((m) => m.module).sort();
}

/** The blind markers the tree could really acquire — the ones that are holes rather than curiosities. */
export function reachableBlindness(markers: readonly Marker[] = MARKERS): string[] {
  return markers
    .filter((m) => m.standing.kind === "blind" && m.standing.plausibility !== "formatter_forbids")
    .map((m) => m.module)
    .sort();
}

export const SPELLING_BOUND =
  "THE VARIANT IS ONE SPELLING, NOT EVERY SPELLING. Each blind row proves the marker misses THE " +
  "instance the row planted; nothing here says that instance is the closest one, and a marker " +
  "recorded `caught` has survived exactly one alternative. A register could catch the variant this " +
  "unit tried and miss a nearer one, and the row would read as settled. Widening that is a " +
  "generator over spellings rather than a table of them, and the predicate below goes false when " +
  "somebody writes it. SECOND, `plausibility` IS A JUDGEMENT AND THE ONLY ONE HERE. `happened` is " +
  "checkable — a unit wrote the spelling and a unit found it — but `idiomatic` and " +
  "`formatter_forbids` are read off what this tree's formatter does today, and neither is derived " +
  "from the formatter's configuration. A prettier setting could move a row from forbidden to " +
  "ordinary and nothing would notice. THIRD, THE POPULATION IS THE SCAN SITES, which is every " +
  "module that asks the SHARED preparation. A register matching text without it is outside this " +
  "register entirely, and W302 is what makes that set worth trusting. `register-census.ts` is the " +
  "instance: it decides what walks the tree by looking for the directory-read call as raw source, " +
  "never asking for the preparation, and is therefore a marker that is a spelling which this " +
  "register does not cover. Its own bound already says it measures how the walking is spelled; " +
  "nothing here has tried a second spelling against it. THIS SENTENCE DELIBERATELY DOES NOT " +
  "REPRODUCE THAT MARKER, and the first draft did: quoting the call put the literal in this file, " +
  "the raw-source scan could not tell a note about the call from the call, and the register about " +
  "detectors that miss what they are named for was reported as a walker of the tree it never " +
  "walks. W307's rule, arriving in the module that exists to describe it.";

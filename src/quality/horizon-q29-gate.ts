// W376: the populations re-read — this quarter's gate.
//
// Q29'S GATE IS NOT A NUMBER AND NOT A PROMISE. `docs/HORIZON-Q29.md` states it in one sentence:
// every population this document names is derived, and is shown both including a planted member and
// excluding a planted non-member. This unit is that sentence, executed — the population is read out
// of the document, each row resolves to the derivation the unit built, and each derivation is RUN
// twice on a tree that holds a member and a non-member it has never seen.
//
// BOTH DIRECTIONS, BECAUSE ONE OF THEM IS FREE. A derivation that returns everything includes every
// planted member and is worthless; a derivation that returns nothing excludes every non-member and
// is worthless in the other direction. W353 spent a unit on the first and W352 on the second. A
// reading is only evidence when it has both halves, so a probe that answers `true, true` or
// `false, false` fails here rather than counting as a demonstration.
//
// THE POPULATION IS THE DOCUMENT'S OWN TABLE, read rather than transcribed — the same rule W363
// applied to the quarter before, and for the same reason: a gate that re-reads a list somebody
// typed is re-reading the typing. A unit the table names with no row here fails, and a row for a
// unit the table does not name fails.
//
// NOT EVERY UNIT ESTABLISHES A POPULATION, and pretending otherwise would make the class a bin.
// Q28's hardening pass, this gate and the quarter close take checks as their subject rather than
// sets; each says so and says why. And a unit still IN FLIGHT has no module to resolve — that is
// derived from the tree rather than read off the ledger, so a row cannot go stale against a status
// that moves while this runs, which is the trap W351 recorded and W364 walked into anyway.
//
// WHAT THIS DOES NOT PROVE is `QUARTER_GATE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. Every probe plants into a throwaway tree and reads this
// tree's own source. No patient, no message, no credential.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { withTree } from "./planting";
import { fixtureText } from "./scan-text";
import { type UnitId, asUnitId } from "./typed-names";
import { walksCalled } from "./populations";
import { MARKERS, censusDefects } from "./spelling-markers";
import { boundedWalkers } from "./subject-and-walk";
import { appliedExemptions } from "./exemption-reach";
import { emptyRegisters } from "./empty-populations";
import { consoleRoutes } from "./reached-pages";
import { handListedRegisters } from "./derivable-lists";
import { patientRules } from "./patient-populations";
import { reclamationSites } from "./run-residue";

/** The quarter's horizon, as the tree spells it. */
export const HORIZON_Q29 = "docs/HORIZON-Q29.md";

/** What a derivation said when it was handed a member and a non-member it had never seen. */
export interface Reading {
  /** The planted thing that BELONGS. A derivation that misses it is too narrow. */
  memberSeen: boolean;
  /** The planted thing that does not. A derivation that takes it is too wide. */
  nonMemberSeen: boolean;
}

/** How a unit the horizon names stands against the quarter's gate. */
export type Standing =
  /** It established a population, and the derivation is run both ways here. */
  | {
      kind: "population";
      /** `module::export`, resolved against the tree before it is run. */
      derivation: string;
      /** What was planted as belonging, in words, so a reading that flips is readable. */
      member: string;
      /** What was planted as not belonging. */
      nonMember: string;
      probe: (root: string) => Reading;
    }
  /** It takes checks rather than a set as its subject. Argued, so the class is not a bin. */
  | { kind: "not_a_population"; why: string }
  /** The document names it and the tree has no module for it yet. Derived, not read off a status. */
  | { kind: "not_landed"; module: string };

export interface QuarterPopulation {
  /** W342's type rather than a template literal: the tree types this field strictly everywhere. */
  unit: UnitId;
  standing: Standing;
}

export interface QuarterDefect {
  unit: string;
  what: string;
}

/** Every unit the horizon's own table names. Read from the document, not transcribed. */
export function unitsInHorizon(root: string): string[] {
  const document = readFileSync(path.join(root, HORIZON_Q29), "utf8");
  const found = new Set<string>();
  for (const m of document.matchAll(/^\| (W\d+) \|/gm)) found.add(m[1]!);
  return [...found].sort();
}

/** Whether `module::export` names something this tree really exports. */
export function resolvesInTree(root: string, derivation: string): boolean {
  const [file, name] = derivation.split("::");
  if (!file || !name) return false;
  const full = path.join(root, file);
  if (!existsSync(full)) return false;
  return new RegExp(`export (?:function|const) ${name}\\b`).test(readFileSync(full, "utf8"));
}

/**
 * Where the quarter's gate and the tree disagree, in six directions.
 *
 * The two that matter are the halves of the gate's own sentence: a derivation that cannot see a
 * planted member is narrower than the population it claims, and one that takes a planted
 * non-member is wider. Everything else here exists so those two cannot go quiet.
 */
export function quarterDefects(
  root: string,
  declared: readonly QuarterPopulation[] = POPULATIONS_AT_W376,
): QuarterDefect[] {
  const named = unitsInHorizon(root);
  const byUnit = new Map(declared.map((d) => [d.unit as string, d]));
  const out: QuarterDefect[] = [];

  for (const unit of named) {
    const row = byUnit.get(unit);
    if (row === undefined) {
      out.push({ unit, what: "is named by the quarter's horizon and nothing re-reads its population" });
      continue;
    }
    const standing = row.standing;
    if (standing.kind === "not_a_population") {
      if (standing.why.length < 120) {
        out.push({ unit, what: "is excused from the gate without an argument" });
      }
      continue;
    }
    if (standing.kind === "not_landed") {
      if (existsSync(path.join(root, standing.module))) {
        out.push({ unit, what: `is recorded as not landed and ${standing.module} is in the tree` });
      }
      continue;
    }
    if (!resolvesInTree(root, standing.derivation)) {
      out.push({ unit, what: `names a derivation this tree does not export: ${standing.derivation}` });
      continue;
    }
    const reading = standing.probe(root);
    if (!reading.memberSeen) {
      out.push({ unit, what: `misses a planted member of its own population: ${standing.member}` });
    }
    if (reading.nonMemberSeen) {
      out.push({ unit, what: `takes a planted non-member into its population: ${standing.nonMember}` });
    }
  }
  for (const { unit } of declared) {
    if (!named.includes(unit)) out.push({ unit, what: "is re-read here and the quarter's horizon does not name it" });
  }
  return out.sort((a, b) => `${a.unit}${a.what}`.localeCompare(`${b.unit}${b.what}`));
}

/**
 * Every unit the quarter's horizon names, re-read against the gate it set itself.
 *
 * THE PROBES ARE THE REGISTER. A row saying "derived" is a word; a row whose derivation is run on a
 * tree holding a member and a non-member it has never seen is a claim the build can lose. Each
 * plants into a throwaway root — nothing here touches this repository — and the fixtures live in
 * W307's file, because a member planted as a string literal in this module would be a member of
 * several of these populations at once.
 */
export const POPULATIONS_AT_W376: readonly QuarterPopulation[] = [
  {
    unit: asUnitId("W365"),
    standing: {
      kind: "population",
      derivation: "src/quality/populations.ts::walksCalled",
      member: "a module that CALLS one of the shared walks",
      nonMember: "a module that names `Patient` and calls no shared walk at all",
      probe: (root) => {
        void root;
        return withTree(
          {
            "src/planted/walks.ts": fixtureText("q29-member-walk"),
            "src/planted/still.ts": fixtureText("q29-nonmember-walk"),
          },
          (tree) => ({
            memberSeen: walksCalled(tree, "src/planted/walks.ts").includes("sourceModules"),
            nonMemberSeen: walksCalled(tree, "src/planted/still.ts").length > 0,
          }),
        );
      },
    },
  },
  {
    unit: asUnitId("W366"),
    standing: {
      kind: "population",
      derivation: "src/quality/spelling-markers.ts::censusDefects",
      member: "a scan site with no marker saying how it matches, which must be reported",
      nonMember: "the same site with a marker declared, which must not be",
      probe: (root) => {
        void root;
        const site = [{ module: "src/planted/scanner.ts" }];
        const marker = MARKERS.filter((m) => m.module === "src/quality/private-copies.ts").map((m) => ({
          ...m,
          module: "src/planted/scanner.ts",
        }));
        return {
          memberSeen: censusDefects([], site).some((d) => d.module === "src/planted/scanner.ts"),
          nonMemberSeen: censusDefects(marker, site).some((d) => d.module === "src/planted/scanner.ts"),
        };
      },
    },
  },
  {
    unit: asUnitId("W367"),
    standing: {
      kind: "population",
      derivation: "src/quality/subject-and-walk.ts::boundedWalkers",
      member: "a bound whose module calls a shared walk",
      nonMember: "a bound whose module walks nothing",
      probe: (root) => {
        void root;
        const populations = [
          { file: "src/planted/walker.ts", source: { kind: "shared_walk" as const, walks: ["sourceModules"] } },
          { file: "src/planted/still.ts", source: { kind: "not_a_walk" as const, why: "y".repeat(130) } },
        ];
        const bounds = [
          { module: "src/planted/walker.ts", name: "PLANTED_BOUND" },
          { module: "src/planted/still.ts", name: "STILL_BOUND" },
        ];
        const seen = boundedWalkers(bounds, populations).map((b) => b.bound);
        return {
          memberSeen: seen.includes("src/planted/walker.ts::PLANTED_BOUND"),
          nonMemberSeen: seen.includes("src/planted/still.ts::STILL_BOUND"),
        };
      },
    },
  },
  {
    unit: asUnitId("W368"),
    standing: {
      kind: "population",
      derivation: "src/quality/exemption-reach.ts::appliedExemptions",
      member: "a detector taking a defaulted string-map exemption",
      nonMember: "a module with no exemption parameter at all",
      probe: (root) => {
        void root;
        return withTree(
          {
            "src/planted/excusing.ts": fixtureText("q29-member-exemption"),
            "src/planted/still.ts": fixtureText("q29-nonmember-walk"),
          },
          (tree) => {
            const seen = appliedExemptions(tree);
            return {
              memberSeen: seen.some((e) => e.startsWith("src/planted/excusing.ts::")),
              nonMemberSeen: seen.some((e) => e.startsWith("src/planted/still.ts::")),
            };
          },
        );
      },
    },
  },
  {
    unit: asUnitId("W369"),
    standing: {
      kind: "population",
      derivation: "src/quality/empty-populations.ts::emptyRegisters",
      member: "a register exported with no members",
      nonMember: "a register exported with one",
      probe: (root) => {
        void root;
        return withTree({ "src/planted/empty.ts": fixtureText("empty-register-module") }, (tree) => {
          const seen = emptyRegisters(tree).map((r) => r.name);
          return { memberSeen: seen.includes("PLANTED_EMPTY"), nonMemberSeen: seen.includes("PLANTED_FULL") };
        });
      },
    },
  },
  {
    unit: asUnitId("W370"),
    standing: {
      kind: "not_a_population",
      why: "A hardening pass takes CHECKS as its subject rather than a set: its findings are read out of thirteen units by three review skills, and what it establishes is a disposition per finding with a clock. There is no membership to plant into — a finding does not arrive by being written into the tree, it arrives by somebody reading. The gate that applies to it is W318's, and W331's suite re-derives every finding on every run.",
    },
  },
  {
    unit: asUnitId("W371"),
    standing: {
      kind: "population",
      derivation: "src/quality/reached-pages.ts::consoleRoutes",
      member: "a page under `app/console/`",
      nonMember: "a page outside it",
      probe: (root) => {
        void root;
        return withTree(
          {
            "app/console/planted/page.tsx": fixtureText("q29-member-console-page"),
            "app/planted/page.tsx": fixtureText("q29-member-console-page"),
          },
          (tree) => {
            const seen = consoleRoutes(tree);
            return { memberSeen: seen.includes("/console/planted"), nonMemberSeen: seen.includes("/planted") };
          },
        );
      },
    },
  },
  {
    unit: asUnitId("W372"),
    standing: {
      kind: "population",
      derivation: "src/quality/derivable-lists.ts::handListedRegisters",
      member: "a register whose rows name modules",
      nonMember: "a register with no members to name anything",
      probe: (root) => {
        void root;
        return withTree(
          {
            "src/planted/listed.ts": fixtureText("q29-member-hand-list"),
            "src/planted/still.ts": fixtureText("q29-nonmember-walk"),
          },
          (tree) => {
            const seen = handListedRegisters(tree);
            return {
              memberSeen: seen.some((r) => r.startsWith("src/planted/listed.ts::")),
              nonMemberSeen: seen.some((r) => r.startsWith("src/planted/still.ts::")),
            };
          },
        );
      },
    },
  },
  {
    unit: asUnitId("W373"),
    standing: {
      kind: "population",
      derivation: "src/quality/patient-populations.ts::patientRules",
      member: "a rule handed a collection of patients",
      nonMember: "a rule handed their ids instead",
      probe: (root) => {
        void root;
        return withTree(
          {
            "src/planted/by-panel.ts": fixtureText("rule-by-panel"),
            "src/planted/by-id.ts": fixtureText("rule-by-id"),
          },
          (tree) => {
            const seen = patientRules(tree);
            return {
              memberSeen: seen.includes("src/planted/by-panel.ts::inviteFromPanel"),
              nonMemberSeen: seen.includes("src/planted/by-id.ts::inviteByIds"),
            };
          },
        );
      },
    },
  },
  {
    unit: asUnitId("W374"),
    standing: { kind: "not_landed", module: "src/quality/quarter-mutants-q28.ts" },
  },
  {
    unit: asUnitId("W375"),
    standing: {
      kind: "population",
      derivation: "src/quality/run-residue.ts::reclamationSites",
      member: "a removal written with `rmSync`",
      nonMember: "the same removal written with `rm` from `fs/promises`",
      probe: (root) => {
        void root;
        return withTree(
          {
            "src/planted/sync.ts": fixtureText("removal-by-rmsync"),
            "src/planted/promised.ts": fixtureText("removal-by-promise"),
          },
          (tree) => {
            const seen = reclamationSites(tree).map((r) => `${r.file}::${r.fn}`);
            return {
              memberSeen: seen.includes("src/planted/sync.ts::clears"),
              nonMemberSeen: seen.includes("src/planted/promised.ts::clears"),
            };
          },
        );
      },
    },
  },
  {
    unit: asUnitId("W376"),
    standing: {
      kind: "not_a_population",
      why: "THIS UNIT, and it belongs here for the reason W305's manifest carries itself: a gate that quietly omitted itself would be the omission it exists to report. Its subject is the horizon's table of UNITS rather than a set of members — a unit does not arrive by being written into `src/`, it arrives by somebody editing a frozen document, which the both-directions check above already reports.",
    },
  },
  {
    unit: asUnitId("W377"),
    standing: {
      kind: "not_a_population",
      why: "The quarter close writes the NEXT quarter's expansion. What it establishes is a plan and a set of ledger rows, and the gate that applies to it is the horizon rule's own preconditions plus `plan-ledger` over the whole ledger — neither of which is a membership anything can plant into. Q28's close was read the same way by its own quarter gate.",
    },
  },
];

/** What a green gate does not prove. */
export const QUARTER_GATE_BOUND =
  "A READING IS TWO PLANTED FILES, NOT A POPULATION. Each probe shows a derivation taking one " +
  "thing that belongs and refusing one that does not, which is the gate's sentence and is far " +
  "short of the derivation being right: the member and the non-member are chosen by the same " +
  "person who wrote the row, so a derivation wrong in a way neither plant is shaped like passes " +
  "here twice over. THE POPULATION IS THE DOCUMENT'S TABLE, so a check this quarter built and the " +
  "horizon does not list is outside the gate entirely, and the table is a list of UNITS rather " +
  "than of populations — a unit that established two is re-read on one of them. AND " +
  "`not_a_population` IS A JUDGEMENT: it says a unit's subject is checks rather than a set, which " +
  "nothing here derives, and the honest test of it is whether the next quarter's gate can say why " +
  "in the same terms.";

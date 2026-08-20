// W367: the population that is narrower than its own claim.
//
// A BOUND SAYS WHAT A CHECK DOES NOT PROVE AND A WALK DECIDES WHAT IT LOOKS AT, and until W365
// nothing in this tree held both ends of that. W365 recorded the population — which walk each
// census member calls. This one puts the two side by side: for every register that both states a
// bound and walks the tree, the bound must name what its walk leaves out, and the naming is
// RESOLVED against the sentence rather than believed.
//
// THE FIRST INSTRUMENT WAS THE WRONG ONE AND IT IS WORTH RECORDING WHY. A phrase scan over the
// bounds — looking for *outside*, *invisible*, *only* — flagged six of thirty-two as silent. Four
// were the scan's own vocabulary failing: W332's `QUARTER_MUTANT_BOUND` says "IT ALSO MEASURES
// ONLY THE MODULES A QUARTER ADDED", W300's `TAX_BOUND` says "Nor does it reach the sites whose
// comparison lives inside a `.test.ts`", and the scan had neither phrasing. A detector whose
// misses are its own wording is the marker-is-a-spelling defect W366 is about, arriving in the
// unit next door — so
// this register declares and resolves rather than scans, and the scan's four false flags are why.
//
// WHAT IT FOUND is one bound over a walk that never says what the walk misses, and one that says
// it in words no scan would find. Both are below. The tree's discipline is real: thirty of
// thirty-two name their population's edge, which is W237's rule holding for two years.
//
// WHAT THIS DOES NOT PROVE is `SUBJECT_BOUND`, exported below and read by W297's register.
//
// EVERYTHING IS HANDED IN AND NOTHING IS IMPORTED AT RUNTIME, and that is not a style choice.
// `bounds.ts` holds every stated bound and imports each from the module that owns it — including
// this one's — so a module reading W297's `STATED_BOUNDS` back completes a cycle, and the symptom
// is not a build error: one side evaluates first and sees `undefined` where a bound's text should
// be. W367 hit exactly that and the failure was a `TypeError` inside a helper three frames away from
// the cause. Dropping that one import was not enough, because W365's `POPULATIONS` reaches
// `bounds.ts` too — through `register-census.ts` and `manifest.ts` — so entering this file first
// still blanked three bounds' text, and entering through `bounds.ts` first happened to work. A
// register whose correctness depends on which test file loads it first is not correct. So this
// module imports no value at all: `Population` is a type and erases, `bounds` and `populations`
// are parameters, and no import order can reach it.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own bounds and populations.

import type { Population } from "./populations";

/** Whitespace is a formatting accident of a concatenated string, not part of a sentence. */
export const flatten = (text: string): string => text.replace(/\s+/g, " ").trim();

/** How a bound stands against the walk underneath it. */
export type Edge =
  /** The bound names what its walk leaves out. `quote` is resolved against the sentence. */
  | { kind: "named"; quote: string }
  /** The bound's subject and its walk are the same set. Argued, because that is a claim. */
  | { kind: "coincides"; why: string }
  /** THE FINDING: a walk narrower than the claim, with nothing saying so. */
  | { kind: "unsaid"; why: string };

export interface Compared {
  /** `module::BOUND_NAME`, as `bounds.ts` spells it. */
  bound: string;
  /** The walks the module calls, from W365's register. Resolved. */
  walk: readonly string[];
  edge: Edge;
}

export interface SubjectDefect {
  bound: string;
  what: string;
}

/** Every register that both states a bound and walks the tree — the population this is over. */
export function boundedWalkers(
  bounds: readonly { module: string; name: string }[],
  populations: readonly Population[],
): { bound: string; walks: readonly string[] }[] {
  const byFile = new Map(populations.map((p) => [p.file, p.source]));
  return bounds
    .flatMap((b) => {
      const source = byFile.get(b.module);
      if (source === undefined || source.kind === "not_a_walk") return [];
      const walks = source.kind === "shared_walk" ? source.walks : ["own_recursion"];
      return [{ bound: `${b.module}::${b.name}`, walks }];
    })
    .sort((a, b) => a.bound.localeCompare(b.bound));
}

/**
 * Each bound read against the walk underneath it.
 *
 * ONE ROW PER BOUND-OVER-A-WALK, and the quotes are the point: a row saying "it names its edge" is
 * worth nothing, and a row quoting the words that name it can be checked by a machine and read by a
 * person. The quote is stored flattened-comparable rather than verbatim-with-newlines, because a
 * bound is a concatenated string and where its author broke the line is not part of what it says.
 */
export const COMPARED_AT_W367: readonly Compared[] = [
  { bound: "src/console/zero-meaning.ts::ZERO_MEANING_BOUND", walk: ["filesUnder"], edge: { kind: "named", quote: "a page that renders a number some other way is outside the population entirely" } },
  { bound: "src/quality/acceptances.ts::ACCEPTANCE_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "an acceptance register in a test file is outside the walk entirely" } },
  { bound: "src/quality/assertion-vocabulary.ts::VOCABULARY_BOUND", walk: ["testModules"], edge: { kind: "named", quote: "A spelling nobody has thought of yet is invisible" } },
  { bound: "src/quality/blind-spots.ts::BLIND_SPOT_BOUND", walk: ["textFiles"], edge: { kind: "named", quote: "nothing here plants a witness against `falseBounds` itself except the fabricated one in its test" } },
  { bound: "src/quality/bounds.ts::BOUNDS_BOUND", walk: ["pageSpecFiles", "sourceModules"], edge: { kind: "coincides", why: "ITS POPULATION IS EVERY STATED BOUND AND IT WALKS FOR THEM BY NAME. `boundsInTree` looks for the `*_BOUND` convention across the tree and the register compares that against `STATED_BOUNDS` in both directions, so a bound arriving joins the population rather than escaping it. What the sentence says it does not do — check the bound is TRUE — is a claim about depth rather than about which bounds it sees, and depth is not what this register compares." } },
  { bound: "src/quality/citations.ts::CITATION_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A register that parses the format with an index, a regex or a destructuring helper is invisible to it" } },
  { bound: "src/quality/close-gate.ts::CLOSE_GATE_BOUND", walk: ["sourceModules", "testModules"], edge: { kind: "named", quote: "A check welded inside a `.test.ts` exports nothing, so no register here can run it against a planted ledger" } },
  { bound: "src/quality/declaration-tax.ts::TAX_BOUND", walk: ["sourceModules", "testModules"], edge: { kind: "named", quote: "Nor does it reach the sites whose comparison lives inside a `.test.ts`" } },
  { bound: "src/quality/defaulted-registers.ts::DEFAULT_BOUND", walk: ["sourceModules", "typescriptFiles"], edge: { kind: "named", quote: "A function that reads the tree through something other than a `root` parameter is outside the population entirely" } },
  { bound: "src/quality/deferrals.ts::DEFERRAL_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A hardening pass whose findings never reach `allHardeningFindings` was invisible here" } },
  { bound: "src/quality/empty-populations.ts::EMPTY_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "a register shipping empty in `app/`, in `e2e/` or in `scripts/` is outside the population entirely" } },
  { bound: "src/quality/derivable-lists.ts::DERIVABLE_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "A hand-listed register keyed by something else — a route, a unit id, a store name, a record class — is outside the scan entirely" } },
  { bound: "src/quality/exemption-reach.ts::REACH_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "An exemption welded inside a function, one keyed by a typed record rather than a string map, or one spelled as a skip list in an array is outside the scan entirely" } },
  { bound: "src/quality/flattering-numbers.ts::FIGURE_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "A FIGURE SPELLED AS THE LENGTH OF A LIST IS INVISIBLE HERE" } },
  { bound: "src/quality/horizon-directions.ts::HORIZON_DIRECTION_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A check the horizon discusses in words without quoting it is outside the population entirely" } },
  { bound: "src/quality/manifest.ts::MANIFEST_BOUND", walk: ["own_recursion"], edge: { kind: "named", quote: "It does not reach TEST FILES" } },
  { bound: "src/quality/moments.ts::MOMENT_BOUND", walk: ["pageSpecFiles", "testModules"], edge: { kind: "named", quote: "a register whose COMPARISON is never run while its walk is called from a test reads as answering per test here" } },
  { bound: "src/quality/patient-populations.ts::RULE_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "a rule reaching patients through a store, an id list or a query rather than through a `Patient[]` parameter is outside it entirely" } },
  { bound: "src/quality/pins.ts::SWEEP_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "a named-constant sweep would have caught none of them" } },
  { bound: "src/quality/planting.ts::PLANTING_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A plant written with `fs/promises`, an `appendFileSync` or a shell-out is invisible to it" } },
  { bound: "src/quality/private-copies.ts::PRIVATE_COPY_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A copy of either parse written in `scripts/`, in `e2e/`, or in a `.mts` file is invisible to it" } },
  { bound: "src/quality/prose-numbers.ts::PROSE_BOUND", walk: ["pageSpecFiles", "sourceModules"], edge: { kind: "named", quote: "A claim phrased any other way is invisible to it" } },
  { bound: "src/quality/quarter-mutants.ts::QUARTER_MUTANT_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "IT ALSO MEASURES ONLY THE MODULES A QUARTER ADDED" } },
  { bound: "src/quality/reached-pages.ts::REACHED_BOUND", walk: ["filesUnder", "pageSpecFiles"], edge: { kind: "named", quote: "a route linked through an `href` built at runtime, through a router push, or through a redirect is invisible to it" } },
  { bound: "src/quality/register-counts.ts::COUNT_BOUND", walk: ["testModules"], edge: { kind: "named", quote: "A register size pinned to a constant, to an arithmetic expression or to another register's length is invisible to it" } },
  { bound: "src/quality/run-residue.ts::TEMP_RESIDUE_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "a removal written with `fs/promises`, with `rm`, or by shelling out is outside it entirely" } },
  { bound: "src/quality/scan-text.ts::SCAN_BOUND", walk: ["sourceModules", "typescriptFiles"], edge: { kind: "named", quote: "One scan is deliberately outside this" } },
  { bound: "src/quality/self-defeating.ts::REMEDY_BOUND", walk: ["testModules"], edge: { kind: "named", quote: "AND THE SWEEP CANNOT SEE MORE THAN `assertionsIn` RETURNS" } },
  { bound: "src/quality/self-ending.ts::ENDING_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A wait written as prose is invisible to it" } },
  { bound: "src/quality/self-reference.ts::SELF_REFERENCE_BOUND", walk: ["sourceModules", "typescriptFiles"], edge: { kind: "named", quote: "is outside every walk in this tree" } },
  { bound: "src/quality/shared-excuses.ts::EXCUSE_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "A SENTENCE GIVEN ONCE IS INVISIBLE HERE" } },
  { bound: "src/quality/spec-premises.ts::PREMISE_BOUND", walk: ["pageSpecFiles"], edge: { kind: "named", quote: "a setup that stages state some other way is outside the population entirely" } },
  { bound: "src/quality/spec-stores.ts::RESIDUE_BOUND", walk: ["pageSpecFiles"], edge: { kind: "named", quote: "the routes this misses are the ones a link leads to" } },
  { bound: "src/quality/superset.ts::SUPERSET_BOUND", walk: ["sourceModules"], edge: { kind: "named", quote: "A selector returning the same NUMBER of the wrong things is invisible to this" } },
  { bound: "src/quality/tautology-sweep.ts::SWEEP_BOUND", walk: ["testModules"], edge: { kind: "named", quote: "A tautology that needs a TYPE to see it is invisible here" } },
  { bound: "src/quality/typed-names.ts::TYPED_NAME_BOUND", walk: ["typescriptFiles"], edge: { kind: "named", quote: "A name assembled from parts, read out of a document, or handed in as an argument is invisible here" } },
  { bound: "src/quality/unasked-facts.ts::UNASKED_BOUND", walk: ["pageSpecFiles", "sourceModules", "typescriptFiles"], edge: { kind: "named", quote: "A READER IS AN IMPORT, AND THAT IS NARROWER THAN A CALLER" } },
  { bound: "src/quality/unit-headers.ts::HEADER_CITATION_BOUND", walk: ["sourceModules", "typescriptFiles"], edge: { kind: "named", quote: "the ownership arm cannot tell a wrong citation from an unattributed but correct citation" } },
  { bound: "src/quality/unrun.ts::UNRUN_BOUND", walk: ["sourceModules", "typescriptFiles"], edge: { kind: "named", quote: "a require, a path built at runtime, or a dynamic import written with a relative specifier is invisible" } },
];

/**
 * Where the comparison and the tree disagree, in four directions.
 *
 * The first is the gate's own last clause: a bound over a walk with no row has never been compared,
 * and that is indistinguishable from one whose subject and walk agree unless something says so.
 */
export function subjectDefects(
  root: string,
  bounds: readonly { module: string; name: string; text: string }[],
  populations: readonly Population[],
  declared: readonly Compared[] = COMPARED_AT_W367,
): SubjectDefect[] {
  void root;
  const out: SubjectDefect[] = [];
  const population = boundedWalkers(bounds, populations);
  const byBound = new Map(declared.map((c) => [c.bound, c]));
  const textOf = new Map(bounds.map((b) => [`${b.module}::${b.name}`, flatten(b.text)]));

  for (const { bound, walks } of population) {
    const row = byBound.get(bound);
    if (row === undefined) {
      out.push({ bound, what: "states a bound over a walk and nothing has compared the two" });
      continue;
    }
    if (flatten(row.walk.join(",")) !== flatten([...walks].join(","))) {
      out.push({ bound, what: `is compared against ${row.walk.join(", ")} and walks ${walks.join(", ")}` });
    }
    if (row.edge.kind === "named" && !(textOf.get(bound) ?? "").includes(flatten(row.edge.quote))) {
      out.push({ bound, what: `quotes an edge the bound does not say: ${row.edge.quote}` });
    }
    if (row.edge.kind === "unsaid") {
      out.push({ bound, what: "walks narrower than it claims and the bound does not say so" });
    }
  }
  const compared = new Set(population.map((p) => p.bound));
  for (const { bound } of declared) {
    if (!compared.has(bound)) {
      out.push({ bound, what: "is compared here and is not a bound over a walk" });
    }
  }
  return out.sort((a, b) => `${a.bound}${a.what}`.localeCompare(`${b.bound}${b.what}`));
}

/** What this register does not prove. */
export const SUBJECT_BOUND =
  "IT CHECKS THAT A BOUND NAMES AN EDGE, NOT THAT THE EDGE IS THE RIGHT ONE. A bound naming a " +
  "narrowness its walk does not have, or naming one gap while a second sits unmentioned, passes " +
  "here with a quote that resolves — the quote proves somebody wrote the sentence, not that they " +
  "read the walk. Settling that means deriving what a walk misses from the walk itself, which is " +
  "the population question one level in and is what `WALK_SCOPE` would have to become. THE " +
  "POPULATION IS BOUNDS OVER WALKS, so a register with no bound is outside it — most of the tree " +
  "— and so is a bound whose module reads the tree without calling one of the shared walks, which " +
  "W365's `not_a_walk` class holds and this one does not read. AND `coincides` IS A JUDGEMENT: it " +
  "says a subject and a walk are the same set, which nothing here derives; it holds one row, and " +
  "the honest test of it is whether the next register that claims it can say why in the same " +
  "terms.";

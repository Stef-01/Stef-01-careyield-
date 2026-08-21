// W383: Q29's hardening pass — `code-review`, `security-review` and `simplify` over W365–W377.
//
// THE QUARTER BUILT INSTRUMENTS ABOUT POPULATIONS AND SPELLINGS, and the pass found the quarter's
// own lesson unapplied twice. W366 named the class in the clearest possible terms — a detector that
// finds its subject by literal text is keyed to how that text is WRITTEN — and landed on the second
// day of the quarter. Two registers built in the same quarter, and one built long before it, are
// keyed to a spelling in exactly that way. That is not a criticism of W366; it is what a unit that
// names a class is FOR, and the measure of the quarter is whether anything went and looked.
//
// WHAT THE READING FOUND, in one sentence each. `prose-numbers` did not merely miss a hyphenated
// compound — it READ THE TAIL as though it were the whole number, so four live rows recorded a
// count off by a factor of three to ten and every one of them was filed as history, where nothing
// re-derives. `patientRules` decides which product rules are handed a patient panel, and its
// signature scan stopped at the first `)` while its type pattern knew one spelling and had no left
// boundary — narrow four ways and wide one, with nothing in the tree that would report a rule
// leaving the population. `mutantsIn` spelled out the scan-order composition by hand at the one
// site the stated ordering rule cannot reach.
//
// THE SECURITY LENS HAS ONE OBJECT AND IT IS THE HARNESS, for the fourth quarter running — but the
// object changed. Q28's was a plant key that escapes its root; this quarter's is the only code in
// the tree that removes a directory it did not make.
//
// FOUNDER GATE (plan §4): nothing crossed. `patientRules` reads signatures as text and imports no
// product code; every patient any suite here touches comes from the seeded synthetic generator.
//
// WHAT THIS DOES NOT PROVE is `Q29_HARDENING_BOUND`, exported below and read by W297's register.

import { type HardeningFinding, unaccountedFor } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * W285's rule, kept. The range runs from the commit before W365's landing to W374's — which is the
 * LAST Q29 unit to land rather than the highest-numbered: W374 was claimed early and landed after
 * W377's quarter close, so a range ending at W377 would have left a unit of this quarter outside a
 * pass named for it. Pinned rather than `HEAD`, so the record cannot grow when a sibling commits.
 */
export const QUARTER = { first: 365, last: 377, diffBase: "d52f4f7", diffHead: "11fafca" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W365",
  "W366",
  "W367",
  "W368",
  "W369",
  "W370",
  "W371",
  "W372",
  "W373",
  "W374",
  "W375",
  "W376",
  "W377",
];

/** Units in the range this pass did NOT read, with the reason. Empty, and checked to be. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {};

/**
 * The units this reader wrote, named rather than left for somebody to notice.
 *
 * W331'S POSTURE, AND THE PROPORTION IS WORSE THAN LAST QUARTER'S. Five of thirteen are this
 * reader's, against three of thirteen at Q28 — and a finding below is against a register this
 * reader built two units before the pass. What that buys is not independence; it is
 * distance in time and a different question. What it costs is recorded in the bound.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W366: "builder-B — the marker that is a spelling.",
  W368: "builder-B — an exemption keyed one way and applied another.",
  W370: "builder-B — Q28's hardening pass.",
  W372: "builder-B — a register listed where it could be derived.",
  W374: "builder-B — the survivors register over Q28.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q29-CR-1",
    lens: "code-review",
    unit: "W366",
    what:
      "THE REGISTER THAT GUARDS AGAINST STALE NUMBERS WAS READING THE WRONG NUMBER, AND IT WAS NOT A MISS. W314 holds every count this tree writes in prose and classifies each; its number vocabulary was a hand-typed map that grew one entry at a time as somebody hit a compound — twenty-one, twenty-two, twenty-five, twenty-six, thirty-three, thirty-four, thirty-six, thirty-seven, fifty-two, fifty-four, sixty-eight. A compound nobody had typed in did not fail to match: `\\b` matches at the hyphen, so the scan took the UNIT ON THE RIGHT as the whole number. Four rows in the register were live and wrong when this pass read them — `tree-walks.ts` recorded as claiming `seven files` where its header says twenty-seven, `review-w279.ts` as `seven routes` against twenty-seven, `hardening-q23.ts` as `NINE FILES` against thirty-nine, `hardening-q24.ts` as `EIGHT FILES` against seventy-eight. Every one was classified `at_the_unit`, which is history and is never re-derived, so no arm of the suite could ever have contradicted them. A register that misreads its subject and reports green is the failure-toward-looking-correct that Q28 was named for, arriving in the register whose whole subject is numbers that rot.",
    raisedOn: "2026-08-21",
    disposition: {
      kind: "fixed",
      by: "W383",
      evidence:
        "The compounds are DERIVED — tens crossed with units — so no compound this tree can write is absent and none can be read as its tail, and the alternation is ordered longest-first so a compound cannot lose to its own prefix. The four rows are corrected to what their modules actually say. Driven in `prose-numbers.test.ts` in both directions: a planted header claiming twenty-seven routes, seventy-eight files and ninety-nine registers reads as 27, 78 and 99, and a planted header claiming twenty routes and nine files still reads as 20 and 9 — so crossing the tens with the units added to the vocabulary rather than replacing it. The register's own arm, which compares what the tree says against what is classified, is what fails if the derivation is reverted to a list.",
    },
  },
  {
    id: "Q29-CR-2",
    lens: "code-review",
    unit: "W373",
    what:
      "THE REGISTER THAT DECIDES WHICH PRODUCT RULES HOLD A PATIENT PANEL WAS NARROW FOUR WAYS AND WIDE ONE. `patientRules` reads a signature with `/^export function (\\w+)\\(([^)]*)\\)/` and tests the captured parameters against `/(?:readonly\\s+)?Patient\\s*\\[\\]/`. `[^)]*` stops at the FIRST `)`, so a rule taking a callback — `(pick: (p: Patient) => boolean, panel: Patient[])` — or an object parameter containing a function type truncates before its panel and is not counted. The type pattern knows one spelling, so `ReadonlyArray<Patient>` and `Array<Patient>` are not counted either. And with no left boundary, `SyntheticPatient[]` IS counted. Nothing escapes today, which is precisely why nothing caught it: the register's job is to say which rules are over a patient panel, and there is no second instrument that would report one missing — a rule written with a callback parameter simply would not appear, and the population would look complete. This is W366's class in a unit that landed seven days after it.",
    raisedOn: "2026-08-21",
    disposition: {
      kind: "fixed",
      by: "W383",
      evidence:
        "The signature reads to the parenthesis that closes the list rather than the first one in it, and the panel pattern takes all three spellings behind a lookbehind that refuses a longer identifier ending in the same word. Driven in `patient-populations.test.ts` in both directions on planted modules: a rule whose panel sits behind a callback parameter is found, `ReadonlyArray<Patient>` and `Array<Patient>` are found, and `SyntheticPatient[]` is refused. The live population is unchanged, which the register's own arm against `RULES_AT_W373` asserts on every run.",
    },
  },
  {
    id: "Q29-SIMP-1",
    lens: "simplify",
    unit: "W374",
    what:
      "THE SCAN-ORDER RULE PROTECTS EVERY SITE EXCEPT THE ONE THAT WROTE IT OUT BY HAND. `scan-text.ts` exports `prepareForScan`, whose entire content is subtract comments then blank literals, and `SCAN_ORDER_RULE` beside it states as data why that order is fixed and what the other order eats — W196's shape, so a later unit has to delete a stated rule rather than quietly swap two lines. `mutantsIn` in `mutation-sampling.ts` spells the composition out itself: `stripComments(source)` on one line, `blankLiterals(code)` on the next. The order is right. What is wrong is where it is written — the two lines a reader would swap are the two lines the rule cannot see, at a module that `undeclaredTextReaders` already names as reading source text without declaring itself a scan site.",
    raisedOn: "2026-08-21",
    disposition: {
      kind: "fixed",
      by: "W383",
      evidence:
        "`mutantsIn` calls `prepareForScan(source)`. `code` is still bound from `stripComments` separately and deliberately: the mutation OFFSETS are into comment-stripped text with literals INTACT, which is a different string from the one matched against, and collapsing them would move every mutation site. The module's own suite passes unchanged, which is the point — this changes where the rule lives, not what the scan sees. AND MOVING IT FOUND SOMETHING NOBODY WAS LOOKING FOR, which is the best argument in this record for the instrument the bound asks for: declaring the site put the module into W366's population, and W366 immediately reported a blind spot with a driven probe — `mutantsIn` keys on the operator TOKENS, there is no operator for loose equality, so a module written with `==` and `!=` yields no mutants at all and reads in every sweep as a module already covered. That row is in `MARKERS` with its probe rather than restated here, because a register that plants is where a finding of that shape belongs.",
    },
  },
  {
    id: "Q29-SR-1",
    lens: "security-review",
    unit: "W375",
    what:
      "THE ONE PLACE THIS TREE REMOVES SOMETHING IT DID NOT MAKE. `sweepTreeCopies` reclaims temporary trees left by interrupted runs, and for a directory whose maker process is DEAD it removes unconditionally — no age window, by design, because W360 found that applying this run's window to a dead maker's copy made the sweep unable to reclaim anything at all. What stands between that and an unrelated directory is one name test: `copyMaker` requires `^(tree|plant|probe)-<digits>-`, and the pid must belong to no live process. The gate is real and correctly placed. The observation is that its vocabulary is three ordinary English words in a directory the operating system shares with every other program, so the guard rests on nobody else having written `tree-<pid>-` into the same place with that pid since dead.",
    raisedOn: "2026-08-21",
    disposition: {
      kind: "accepted",
      why:
        "CLASSIFIED AS A COLLISION HAZARD RATHER THAN A VULNERABILITY, and the distinction is the same one `Q28-SR-1` drew. There is no untrusted input anywhere near this: the prefixes are literals in this repository, the pid is this process's own, and liveness is read from the operating system — so there is no attacker and no exploit path, only the chance that a stranger's directory happens to be named like ours in a shared temporary directory. Accepted rather than fixed because the remedy is a rename and `TEMP_PREFIXES` is read from prose, registers and fixture names across the tree, which is W344's class — a change worth making deliberately in a unit of its own rather than as a tail on a review pass. What makes accepting it safe is that it is now written down: the sweep's whole safety is one regex over three common words, and a fourth prefix added without thinking about that widens it. The re-read is for whether a prefix has been added or the tree has started running where its temporary directory is shared.",
      reviewBy: "2026-11-21",
    },
  },
];

/** The findings this pass raised, by id, for a suite that re-derives each. */
export function finding(id: string): HardeningFinding {
  const found = FINDINGS.find((f) => f.id === id);
  if (found === undefined) throw new Error(`no finding ${id}`);
  return found;
}

/**
 * Units in this pass's range that it names nowhere.
 *
 * THE SHARED DERIVATION, not a fifth copy — `Q27-SIMP-2`'s remedy, used rather than re-derived.
 */
export function unaccountedUnits(ledger: string): string[] {
  return unaccountedFor(ledger, QUARTER, [...REVIEWED_UNITS, ...Object.keys(NOT_REVIEWED)]);
}

/** What a green pass does not prove. */
export const Q29_HARDENING_BOUND =
  "ONE QUARTER READ BY ONE READER, AND FIVE OF THE THIRTEEN UNITS ARE THAT READER'S OWN — a worse " +
  "proportion than last quarter's, and one finding below is against a register this reader built " +
  "two units before the pass. That is distance in time and a different question, never " +
  "independence. THE PASS FOUND ITS OWN QUARTER'S LESSON UNAPPLIED, WHICH IS THE ONLY REASON IT " +
  "FOUND ANYTHING: W366 named the marker-is-a-spelling class on the second day, and both " +
  "code-review findings below are that exact class in registers built beside it. A quarter that " +
  "names a class and does not sweep for it has bought a sentence rather than a check, and what " +
  "would settle this properly is not a reader — it is a register that plants a second spelling " +
  "against every text-keyed detector, which is W366's own instrument pointed at more than the " +
  "sites it was born holding. THE COUNT IS NOT A MEASUREMENT: what is recorded here says how hard " +
  "this range was read at least as much as how well it was built, which is why the record carries " +
  "findings and no total. THE SECURITY LENS STILL HAS ONE OBJECT AND IT IS STILL THE HARNESS, for " +
  "the fourth quarter running, and its finding is accepted rather than fixed — a lens that keeps " +
  "returning the same object is a lens with one object, not a tree with one weakness. NOT ONE " +
  "FINDING IS ABOUT WHETHER A PRACTICE CAN DO ANYTHING IT COULD NOT DO BEFORE: the quarter added " +
  "one console derivation and twelve quality registers, so a pass reading it reads machinery, and " +
  "a tree in excellent machine health where nobody can book an appointment is the failure this " +
  "sentence exists to keep visible. AND THE PASS CANNOT CHECK ITS OWN COMPLETENESS — it reports " +
  "what one reader saw in one pinned range, and a detector blind to a spelling is by construction " +
  "the kind of thing a reader reading the same words does not notice.";

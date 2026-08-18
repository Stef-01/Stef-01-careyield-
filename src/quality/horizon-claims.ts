// W350: Q27's gate — every claim the horizon makes, read by something or declared unread.
//
// THREE QUARTERS HAVE NOW SET A GATE THAT IS NOT A NUMBER. Q24 set one — a count of controls — the
// number moved the wrong way, and that quarter's own note says the instrument rather than the work
// was wrong. Q25 asked whether every claim it made was CHECKED, Q26 whether every control it named
// could reach its moment, and Q27 asks the question its theme forces: this document says the tree
// already knows things and nothing reads them, so the gate is whether the document's own claims are
// read by anything.
//
// THE POPULATION IS THE DOCUMENT'S EMPHASIS. Every `**bolded**` span in `docs/HORIZON-Q27.md` is a
// claim its author chose to make loudly, which is a population somebody else can re-derive and
// argue with — unlike "the important claims", which would be whichever ones the reader of this
// register found. Forty-two spans and thirty-eight distinct claims, classified the way W339 reads a
// bound's conditions: read by a named check, or
// declared unread with the reason, or not a claim about the tree at all.
//
// THE THIRD ARM IS NOT AN ESCAPE HATCH AND THE ROWS SHOW WHY. A document about a plan says things
// that are true of the PLAN — what it declines to do, what its theme is called — and those are
// decisions rather than facts a check could confirm. What the arm may not hold is a claim about the
// tree that nobody wanted to check, which is why every row carries a sentence and this unit's suite
// requires it.
//
// AND THE GATE READS ITSELF. The document's gate sentence — *every claim this document makes about
// a fact the tree holds is either read by a check that exists or declared unread with its reason* —
// is one of the thirty-eight, and its reading is this register. A gate that could not be applied to
// its own statement would be the class of defect Q27 spent a quarter on.
//
// WHAT THIS DOES NOT PROVE is `HORIZON_CLAIM_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads a planning document and this tree's own checks.

import { readFileSync } from "node:fs";
import path from "node:path";

/** The document this gate reads. */
export const HORIZON_Q27 = "docs/HORIZON-Q27.md";

/**
 * Every emphasised span in the document, whitespace normalised.
 *
 * BOLD IS THE AUTHOR'S OWN MARKING, which is what makes this a derivation rather than a reading:
 * the population is chosen by whoever wrote the document, not by whoever is auditing it, and a
 * claim promoted to bold after this unit lands arrives undeclared and fails.
 */
export function boldClaims(text: string): string[] {
  return [...text.matchAll(/\*\*(.+?)\*\*/gs)].map((m) => m[1]!.replace(/\s+/g, " ").trim());
}

/** How a claim is answered. W339's three arms, one document over. */
export type ClaimReading =
  /** A check that exists reads it. `check` is `<file> :: <assertion>`, resolved by this unit. */
  | { kind: "read_by"; check: string; how: string }
  /** Nothing reads it, and here is why that is the honest state rather than an oversight. */
  | { kind: "unread"; why: string }
  /** It is a claim about the PLAN — an intention, a name, a refusal — and not about the tree. */
  | { kind: "not_about_the_tree"; why: string };

export interface DeclaredClaim {
  /** The claim, exactly as the document emphasises it. */
  claim: string;
  reading: ClaimReading;
}

const readBy = (check: string, how: string): ClaimReading => ({ kind: "read_by", check, how });
const unread = (why: string): ClaimReading => ({ kind: "unread", why });
const aboutThePlan = (why: string): ClaimReading => ({ kind: "not_about_the_tree", why });

/** The horizon test, cited so often it is worth one constant. */
const H = "src/quality/horizon-q27.test.ts";

export const Q27_CLAIMS: readonly DeclaredClaim[] = [
  {
    claim: "before a single Q27 unit is written",
    reading: readBy(
      "src/quality/horizon-claims.test.ts :: the document was written before the quarter it plans",
      "W344's register, used rather than cited: the document's own commit is compared with W339's claim commit, which is where Q27's first unit began. The horizon rule's whole force is that the expansion precedes the work, and until this unit nothing had read the order — the same shape W344 found in PLANT-1.",
    ),
  },
  {
    claim: "Met.",
    reading: readBy(
      `${H} :: (1) expands one quarter of thirteen, and no theme beyond it`,
      "The six requirements each carry a `Met.` and each has its own numbered arm in the horizon suite; the verdicts are checked one at a time rather than as a block, which is why one row here answers for the spelling and the arms answer for the requirements.",
    ),
  },
  {
    claim: "Met, and the growth is zero.",
    reading: readBy(
      `${H} :: (4) adds no blocked row, and the count has not moved`,
      "Requirement 4's verdict, and the only one that carries a figure in it. The arm derives the blocked count from the ledger at the horizon and compares it with the count before, so the `zero` is re-derived rather than restated.",
    ),
  },
  {
    claim: "338 week-units",
    reading: readBy(
      `${H} :: states the ledger size before and after this expansion`,
      "Derived from the ledger's own rows at the moment of writing, and pinned to the expansion rather than to today — a figure that moved with the tree would say nothing about the day the horizon was set.",
    ),
  },
  {
    claim: "351 after it",
    reading: readBy(
      `${H} :: states the ledger size before and after this expansion`,
      "The same arm reads both ends, because the claim is the pair: thirteen units added, which is requirement 1 restated as arithmetic.",
    ),
  },
  {
    claim: "320 are done",
    reading: readBy(
      `${H} :: states the done count the ledger held when the horizon was written`,
      "Counted from the ledger as at the expansion, with the row a sibling session was holding excluded by name — the second arm beside it checks exactly that exclusion.",
    ),
  },
  {
    claim: "18 rows are blocked",
    reading: readBy(
      `${H} :: states the blocked count the ledger actually holds, week-units and not`,
      "The figure W335 corrected: the count includes `SUP-1` and `SUP-2`, which a parse the gate dossier kept a private copy of had dropped. Derived through the shared parse, so the correction cannot come undone quietly.",
    ),
  },
  {
    claim: "G5",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "Every gate row in the position table is compared with the units the ledger blocks on it, in both directions — a gate the table names and the ledger does not block on fails, and so does the reverse.",
    ),
  },
  {
    claim: "G6",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "The same arm and the same both directions, for the public directory gate — the one whose ruling W133 and W185 have waited on since the plan was written.",
    ),
  },
  {
    claim: "G8",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "The same arm, for the model-processing gate proposed at W104 and unanswered for two hundred and seventeen units, which the wait column derives rather than states.",
    ),
  },
  {
    claim: "G9",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "The same arm, for the organisational-reporting gate proposed at W156 — two blocked rows, both of them reporting work the loop finished years ago.",
    ),
  },
  {
    claim: "G10",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "The same arm, for the payer and insurer gate proposed at W208, whose two rows are the newest of the eighteen and still older than a year of building.",
    ),
  },
  {
    claim: "G3",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "The same arm, for the live-SMS gate: the one founder gate the loop is furthest from needing, and the one whose row has waited longest of the single-row gates.",
    ),
  },
  {
    claim: "Q9 action 1",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "A founder DECISION rather than a gate, and the position table holds both kinds; the arm reads them the same way because the ledger names them the same way, which is W310's correction working.",
    ),
  },
  {
    claim: "Q17 action 1",
    reading: readBy(
      `${H} :: (3) records the gate position, row by row`,
      "The second decision, and the one whose answer could change what a patient is shown — read from the ledger's own blocked row rather than from this document's prose.",
    ),
  },
  {
    claim: "G1, G2, G4 and G7 still block nothing",
    reading: readBy(
      "src/founder/outstanding.ts :: gatesBlockingNothing",
      "Derived from §4 and the ledger together rather than stated: the gates the plan defines, minus the gates any blocked row names. The founder page renders the same derivation, so the claim and the page cannot disagree.",
    ),
  },
  {
    claim: "Decisions on this page the loop may take: zero.",
    reading: readBy(
      `${H} :: (3) states the number the loop may answer, and it is still zero`,
      "The number is derived from the blocked rows' blockers — every one resolves to a founder gate or a founder decision, and neither kind is the loop's to answer. Six quarters and the answer has not moved.",
    ),
  },
  {
    claim: "as at this expansion",
    reading: readBy(
      `${H} :: (3) states how long each ruling has waited, as at this expansion`,
      "The wait figures are checked against the ledger AS AT the horizon rather than today, which is the shelf-life rule W312 wrote after W299: a figure derived live in a frozen document is a figure that will be wrong tomorrow.",
    ),
  },
  {
    claim: "G5 reads eight here and read six in every document before W335",
    reading: readBy(
      "src/quality/dossier-derived.ts :: dossierDiff",
      "The first half is derived on every run — the dossier's G5 row against the ledger's own blocked rows, both directions. The second half is history: what six documents said before W335 is not re-derivable, and the register that would have caught it is the one W335 built.",
    ),
  },
  {
    claim: "The tree already knew, and nothing read it.",
    reading: readBy(
      `${H} :: names the units the theme is read from, and the ledger holds each as done`,
      "The theme sentence, and what is checkable about it is its EVIDENCE: the five units it reads from are named, each is a done row in the ledger, and the arm fails if one of them is not. Whether the sentence is the right reading of those five is a judgement.",
    ),
  },
  {
    claim: "W331 found two bounds that had predicted their own failures.",
    reading: readBy(
      "src/quality/hardening-q25.test.ts :: CR-2: the planter removes what it makes, and the leaking callers clean up",
      "The finding is re-derived by that pass's own suite rather than by this document: a fix that came undone fails there, which is what makes the sentence here a citation rather than a memory.",
    ),
  },
  {
    claim: "426 copies and 3.6 GB of `/tmp`",
    reading: unread(
      "A MEASUREMENT OF A MACHINE ON A DAY. Nothing can re-derive it: the directories were swept by the fix the same unit shipped, and re-running the leak to re-measure it would mean removing the fix. It is the class W314 calls `at_the_unit` — history, where the finding is the argument and the register beside it is the check.",
    ),
  },
  {
    claim: "W334 found a fact the product had known since the wizard was built.",
    reading: readBy(
      "src/console/setup-gaps.ts :: unmetSteps",
      "The fact itself is read now, which is the point: four console surfaces ask `setupReadiness` and render the unfinished steps, and `unfinished-path.spec.ts` walks them. What is not re-derivable is `since the wizard was built`, which is a claim about the past.",
    ),
  },
  {
    claim: "exactly one surface ever asked it",
    reading: unread(
      "TRUE WHEN WRITTEN AND FALSE NOW, deliberately: W334 added four callers, which is what the unit was for. A check that this stayed true would be a check that the fix had not happened. The honest reading is that the sentence describes the state the quarter found, and the register that would notice a reader arriving is W340's.",
    ),
  },
  {
    claim: "W335 found a document and its own test sharing a private copy of a parse.",
    reading: readBy(
      "src/quality/private-copies.ts :: copyDefects",
      "W341 generalised it: every module holding its own copy of a shared parse is enumerated and declared, so the specific finding is now an instance of a register rather than a story about one file.",
    ),
  },
  {
    claim: 'W333 found that twelve of sixteen "untested" modules were tested.',
    reading: readBy(
      "src/quality/unrun.ts :: unreachedByUnitSuite",
      "The correction is the derivation: reachability from every test file rather than a sibling-file convention, run on every suite, so the figure cannot drift back to the convention's answer without failing.",
    ),
  },
  {
    claim: "W329 found a citation nobody had ever resolved.",
    reading: readBy(
      "src/quality/typed-names.ts :: nameDefects",
      "W342 generalised this one too: every name a register declares — a unit, a module, an export — is resolved against the tree on every run, so an unresolved citation is a failure rather than a discovery.",
    ),
  },
  {
    claim: "And W331's own fix produced the shape twice more",
    reading: unread(
      "TWO INCIDENTS DURING ONE UNIT'S WORK, and neither leaves a state a check can read: a shared name that moved is now moved, and a sweep that deleted a child's tree is now scoped. What could be read is whether either comes back, and both have registers — W320's ownership map and W343's pid-scoped sweep — but that is not this claim, which is about what happened while somebody was working.",
    ),
  },
  {
    claim: "the tree derives a fact, states it, or computes it, and then nothing reads it",
    reading: aboutThePlan(
      "The theme's own sentence — a reading of five findings rather than a fact about the tree. What the tree can answer is whether each finding is still true, and each row above does that; whether they share a shape is a judgement, and the quarter's units are the argument for it.",
    ),
  },
  {
    claim: "Q27 — what the tree already knows.",
    reading: aboutThePlan(
      "The quarter's name, and a name is a decision rather than a fact: what makes it true or false is the thirteen units under it, each of which takes a fact the tree already derives and gives it a reader. Q24 named a quarter after a number and the number moved the wrong way, which is the receipt for not checking a name.",
    ),
  },
  {
    claim:
      "every claim this document makes about a fact the tree holds is either read by a check that exists or declared unread with its reason",
    reading: readBy(
      "src/quality/horizon-claims.ts :: horizonClaimDefects",
      "THE GATE READING ITSELF. The sentence is one of the claims this register enumerates, and the register is what applies it — a gate that could not be applied to its own statement would be the defect Q27 spent a quarter on.",
    ),
  },
  {
    claim: "It does not plan Q28 or Year 8.",
    reading: readBy(
      `${H} :: (1) expands one quarter of thirteen, and no theme beyond it`,
      "Derived: the document names thirteen units and no unit beyond W351, and the arm fails if a fourteenth appears or a Q28 theme is written.",
    ),
  },
  {
    claim: "It does not set a numeric gate.",
    reading: readBy(
      `${H} :: refuses to set a numeric gate, and says why`,
      "Checked against the gate sentence itself: the gate is a property of every claim rather than a count, and Q24's receipt for the alternative is quoted in the document.",
    ),
  },
  {
    claim: "It does not claim Q26 failed.",
    reading: readBy(
      `${H} :: does not price Q26's gate, which a sibling session held while this was written`,
      "Read from the document's own words rather than from the ledger: W337 held Q26's gate when this was written, and the arm fails if the horizon starts pricing a verdict it did not have.",
    ),
  },
  {
    claim: "It does not propose an eleventh gate.",
    reading: readBy(
      `${H} :: (5) leaves §4 untouched, and every blocker still resolves to a gate or a decision`,
      "Derived from the plan: §4's gate list is unchanged and every blocker a blocked row names resolves into it, so an eleventh gate would have to appear in §4 to exist at all.",
    ),
  },
  {
    claim: "It does not rank the outstanding decisions.",
    reading: unread(
      "A REFUSAL, and what it refuses is a judgement: W257 declined to rank the outstanding rulings because the two orders its own tables produce disagree, and the choice is the founder's. Nothing can check that a document has not ranked something — the absence of an ordering is not a state a derivation can read — and the honest answer is that this is a decision the plan records rather than a fact the tree holds.",
    ),
  },
  {
    claim: "It does not treat a bound that named its own failure as a bad bound.",
    reading: aboutThePlan(
      "A position on how to read the quarter's findings: both bounds were accurate, and the defect was that nothing read them. W339 is the unit that acts on it; this sentence is the reasoning rather than the fact.",
    ),
  },
  {
    claim: "G1, G2, G4 and G7 block nothing, and they are what stand between this tree and a patient.",
    reading: readBy(
      "src/founder/outstanding.ts :: gatesBlockingNothing",
      "The first clause is derived from §4 and the ledger. The second is the founder's position and cannot be derived — no check can say what stands between a repository and a person — which is why the row is read for the half that is a fact and the sentence carries the half that is not.",
    ),
  },
];

export interface ClaimDefect {
  claim: string;
  what: string;
}

/**
 * The document's claims against this register, in both directions, plus the citations.
 *
 * THREE ARMS AND EACH HAS BEEN A REAL FAILURE SOMEWHERE IN THIS TREE: a claim nobody classified
 * (the register goes quiet as the document grows), a declared claim the document no longer makes
 * (the register describes a document that has moved), and a `read_by` naming a check that does not
 * exist (W258's citation rot, which read as coverage for a quarter).
 */
export function horizonClaimDefects(
  root: string,
  text: string = readFileSync(path.join(root, HORIZON_Q27), "utf8"),
  declared: readonly DeclaredClaim[] = Q27_CLAIMS,
): ClaimDefect[] {
  const made = new Set(boldClaims(text));
  const known = new Set(declared.map((d) => d.claim));
  const defects: ClaimDefect[] = [];

  for (const claim of made) {
    if (!known.has(claim)) {
      defects.push({ claim, what: "is emphasised in the horizon and nothing here says whether anything reads it" });
    }
  }
  for (const row of declared) {
    if (!made.has(row.claim)) {
      defects.push({ claim: row.claim, what: "is declared and the document no longer makes it" });
    }
  }
  return defects.sort((a, b) => `${a.claim}${a.what}`.localeCompare(`${b.claim}${b.what}`));
}

/** The claims nothing reads, by name — the figure this gate is actually about. */
export function unreadClaims(declared: readonly DeclaredClaim[] = Q27_CLAIMS): string[] {
  return declared
    .filter((d) => d.reading.kind === "unread")
    .map((d) => d.claim)
    .sort();
}

export const HORIZON_CLAIM_BOUND =
  "THE POPULATION IS THE DOCUMENT'S BOLD, which is an author's marking rather than a claim's " +
  "importance: a claim written plainly is invisible here, and this document makes several — the " +
  "wait figures in the position table, the sentence about what W346 extends. Reading every " +
  "sentence would mean deciding which prose is a claim about the tree, which is a judgement and " +
  "the class this tree has refused three times. SECOND, A `read_by` CITATION IS RESOLVED AND NOT " +
  "READ. It names a check that exists and quotes an assertion the file contains; whether that " +
  "check actually reads the claim is a judgement W284's central citation already got wrong once, " +
  "resolving to `text.includes(\"/\")` and passing for a quarter. THIRD, THE `unread` ARM IS A " +
  "STATEMENT ABOUT TODAY. Four claims sit there and each says why, but nothing here notices the " +
  "day one of them becomes checkable — that is a reader's job, and the review this gate gets is " +
  "the next quarter's expansion.";

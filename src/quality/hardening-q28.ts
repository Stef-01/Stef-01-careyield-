// W370: Q28 hardening — the quarter that asked WHICH WAY IT FAILS, read for which way it fails.
//
// Q28'S THEME WAS THE DIRECTION OF A FAILURE: every unit took a check, a derivation or a
// declaration and established which way its failure moves, and where that direction was *toward
// looking correct*, made it loud instead. So the question this pass owes is not whether Q28's
// registers work — the suite says they do — but which way the quarter's OWN machinery fails.
//
// IT FAILS TOWARD GREEN, AND IT DID SO TWICE ON `main` IN ONE DAY. W363's close left a promise in
// `unread-bounds` aimed at a unit that had just landed; W364's close left two `horizon-q29`
// assertions requiring the live claimed set to equal exactly its own row. Both checks read a
// ledger row's STATUS, so both could only go wrong AT THE CLOSE — and the close is the one commit
// whose suite is easiest not to re-run. W326's close gate exists for exactly that and saw neither,
// because both live welded inside `.test.ts` files. `CLOSE_GATE_BOUND` names that limit and
// `weldedLedgerTests` DERIVES the list; the list holds 55 files — this pass's own suite among them — and nothing fails because
// of it. (The figure was 50 when this pass wrote it; W377 added one and W374 another, which is a
// derived claim doing its job: the number moved and the register said so rather than the prose
// quietly outliving the measurement.) The tree measured the gap on every run of the quarter it cost two reds.
//
// AND TWO OF THE FIVE ARE THE PREVIOUS PASS STOPPING SHORT, in the same shape twice. W360 found a
// detector keyed to a spelling and fixed the COPY, leaving the marker; W366 measured the register
// still blind. W360 found an exemption keyed `file :: assertion` and applied by file, and fixed the
// PARSE, leaving the grain; W368 measured three exemptions still reaching past their keys. A fix to
// the instance reads exactly like a fix to the class from a green suite, which is this quarter's
// theme applied to last quarter's answers.
//
// THE READER WROTE THREE OF THE THIRTEEN UNITS, which `SELF_REVIEWED` names rather than hides.
//
// WHAT THIS DOES NOT PROVE is `Q28_HARDENING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads diffs, registers and this repository's own
// source text.

import { type HardeningFinding, unaccountedFor } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * W285's rule, kept: `diffHead` is pinned rather than left at `HEAD`, because a range ending at
 * HEAD grows every time a sibling session commits and the record would then claim more than was
 * read. This one runs from W351's close — the commit Q27's pass ended at — to W364's close, so the
 * Q29 units built since, two of them this reader's own, are deliberately outside it.
 */
export const QUARTER = { first: 352, last: 364, diffBase: "e5e9ca6", diffHead: "183a323" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W352",
  "W353",
  "W354",
  "W355",
  "W356",
  "W357",
  "W358",
  "W359",
  "W360",
  "W361",
  "W362",
  "W363",
  "W364",
];

/** Units in the range this pass did NOT read, with the reason. Empty, and checked to be. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {};

/**
 * The units this reader wrote, named rather than left for somebody to notice.
 *
 * W331'S POSTURE, and the same limit: what a pass offers against its own work is distance in time
 * and a different question, not independence. Three of thirteen here, and `Q28-CR-3` and `Q28-CR-4`
 * were MEASURED by this reader's later units rather than seen by this pass — which is a better
 * instrument than a re-read and is recorded as such in each disposition.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W353: "builder-B — the superset failure.",
  W354: "builder-B — the flattering number.",
  W356: "builder-B — an excuse nothing can contradict.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q28-CR-1",
    lens: "code-review",
    unit: "W363",
    what:
      "A CHECK THAT READS A ROW'S STATUS CAN ONLY GO WRONG AT THE CLOSE, AND THE CLOSE IS THE ONE COMMIT WHOSE SUITE IS EASIEST NOT TO RE-RUN. W363's close turned `pnpm verify` red on `main`: `unread-bounds` carried an `owed` reading aimed at W363, and W339's borrowed W329 check refuses a promise aimed at a unit that has landed — true only once the row said `done`. W364's close did it again the same day, from the other side: two `horizon-q29` assertions required the live claimed set to equal exactly `[W364]`, which its own close falsified. Neither was caught by `verify:close`. W326's gate simulates the close and runs `LEDGER_READERS`, and both of these checks are welded inside `.test.ts` files, which export nothing to run. THE TREE ALREADY DERIVES THE LIST: `weldedLedgerTests` returns forty-nine files, `CLOSE_GATE_BOUND` names the limit in writing, and the bound's own predicate says the gap is closed when that list is empty. So the measurement existed, ran on every commit of the quarter, and nothing failed — the direction this one moves is toward green, which is exactly what Q28 was named to find.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W370",
      evidence:
        "`staleOwedConditions` lifts W339's clock out of its suite and takes the ledger as TEXT, so it can be asked about a ledger that does not exist yet — which is what the close gate hands it. It is asked at the close, so a close that would strand a promise fails BEFORE the commit rather than after it. WHERE it is asked moved at W380: this pass put it in `LEDGER_READERS`, and a difference-reader is the one shape blind to the case — at `verify:close` the closing row is already `done` in the file, so a promise owed by it appears in both runs compared and reports nothing, while a promise owed by any OTHER claimed row reports on every run to every session in the fleet. It is read as a truth in the close gate's own close case now. The disposition stays `fixed` because the callable is the fix; the register it sat in was the wrong shelf. The other 49 welded files are untouched and deliberately so: this fixes the one that fired, and the list they sit on is the subject of `Q28-SIMP-1`'s sibling problem rather than of this finding. W364's `horizon-q29` arm is not lifted either — it asserts a claim about the moment its own expansion ran, which is history rather than a standing check, and W365 has since rewritten it to survive its own close.",
    },
  },
  {
    id: "Q28-CR-2",
    lens: "code-review",
    unit: "W353",
    what:
      "`withPlantedIn` REFUSES TO PLANT INTO THE REPOSITORY AND CHECKS THE ROOT, NOT THE KEYS. `refuseTheRepository` resolves the root it is handed and throws if it is the repository or inside it — the guard exists because other test workers walk this tree and would read a probe that is about to be deleted. The keys then go through `path.join(root, rel)` with no check at all, so a key containing `..` resolves back out of the root and past the guard, and the `finally` removes whatever it wrote. Nothing in this tree passes such a key; the finding is that the one thing this harness refuses is one relative path away, and Q28 made it load-bearing — the quarter added planting probes to five registers, two of them this reader's, and Q29 has added two more since.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W370",
      evidence:
        "`write` resolves each key against the root and throws when the result is not the root or inside it, naming the key and where it landed. Driven in `hardening-q28.test.ts` in both directions: a `..` key is refused, and an ordinary nested key still plants. The security lens classified this as robustness rather than a vulnerability and the reason is recorded in `Q28-SR-1` — every key in this tree is a literal in this repository's own source, so there is no untrusted input and no attacker.",
    },
  },
  {
    id: "Q28-CR-3",
    lens: "code-review",
    unit: "W360",
    what:
      "W360 FOUND A DETECTOR KEYED TO A SPELLING AND FIXED THE COPY. Its own record says it plainly: W341 built the private-copy register, W344 wrote the eighth copy of the ledger row parse three units later, and the register missed it because its marker for that parse is the regex SPELLING `/^\\|` while W344's copy matched with `startsWith`. The fix made `timelines.ts` call the shared parse. THE MARKER WAS NEVER TOUCHED, so the register is exactly as blind to the ninth copy as it was to the eighth — and `markersOf` requires ALL marker lines to appear, so no second spelling can be added to the fixture without breaking the conjunction. A green private-copy register and a fixed instance look identical from the suite.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "accepted",
      why:
        "MEASURED RATHER THAN ARGUED, by W366: a copied tree carrying a `startsWith` ledger parse is planted beside the canonical spelling, and `privateCopies` finds the control and misses the variant on every run. The row is `blind` with `plausibility: happened` — the only row in that register carrying it, because this is the one spelling the tree has actually paid for. Accepted rather than fixed because the fix is a change to what `SharedParse` MEANS: `markersOf` requires every marker line to appear, so a second spelling cannot join the fixture without breaking the conjunction for every parse that uses it. What made this dangerous was that it was invisible, and it is not invisible now — the register fails in both directions if the blindness changes. The re-read is for whether a ninth copy has arrived.",
      reviewBy: "2026-11-19",
    },
  },
  {
    id: "Q28-CR-4",
    lens: "code-review",
    unit: "W360",
    what:
      "THE SAME PASS FIXED AN EXEMPTION'S PARSE AND LEFT ITS GRAIN. `Q27-CR-2` found `presenceDefects` parsing its excuse keys and throwing the site half away, so an excuse naming one Map silenced every non-canonical presence claim in that file; W360 made it read both halves. What it did not ask is the question one level up — whether a key's GRAIN matches its subject's. It does not, three times over: `NOT_A_COLLECTION` keys a TEST and its subject is an ASSERTION, `WRITES_WITHOUT_A_PLANTER` keys a FILE and its subject is a CALL, `SEPARATOR_NOT_A_CITATION` keys a FILE and its subject is a SPLIT. In each the key is read whole and nothing is thrown away, and a second instance under the same key still inherits an excuse written about the first.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "accepted",
      why:
        "MEASURED BY W368, which plants a pair under one key and reads whether the sibling is silenced, and the answer is that the reach is real. It is accepted rather than fixed because `wider` IS NOT `wrong`: a file-grained key is the honest grain when the check itself is file-grained, and narrowing any of the three costs a derivation somebody has to write. What the register refuses is the reach being INVISIBLE, and it is not invisible any more — each row names what a second entry silently inherits, and a row whose reach changes fails in both directions. The re-read is for whether any of the three has since acquired a finer subject.",
      reviewBy: "2026-11-19",
    },
  },
  {
    id: "Q28-SIMP-1",
    lens: "simplify",
    unit: "W361",
    what:
      "TWO WAYS TO READ SOURCE TEXT, AND THE REGISTER THAT EXISTS TO DECLARE THEM SEES ONE. W302's `SCAN_SITES` names every module that asks the shared `prepareForScan` and says what it wants and why, checked against the tree in both directions — a module that starts preparing text cannot do it without arguing for the answer it takes. Fourteen modules instead call `stripComments` directly and never enter that register at all: they take one preparation without declaring it, and nothing asks whether blanking literals would matter to them. Q28 ADDED TWO OF THE FOURTEEN — `spec-stores.ts` at W359 and `zero-meaning.ts` at W361 — so the quarter grew the population the register cannot see while the register stayed green in both directions.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "fixed",
      by: "W372",
      evidence:
        "`undeclaredTextReaders` derives them from the BEHAVIOUR — a module that calls `stripComments` and is not the home of the shared preparation — rather than from the call that opts in, and names the result. THE DERIVATION DISAGREES WITH THIS FINDING, which is the point of having one: it says eleven, not fourteen. The hand count was taken off a file listing and swept in two `.test.ts` neighbours and `scan-text.ts` itself, none of which is a module scanning outside the register. W372 also records the class this belongs to — `SCAN_SITES` is `derived_from_the_opt_in`, checked against the modules that CALL `prepareForScan`, so list and derivation agree exactly and neither has ever seen the eleven — and finds the same shape in two more registers, both this reader's own.",
    },
  },
  {
    id: "Q28-SR-1",
    lens: "security-review",
    unit: "W353",
    what:
      "THE LENS FOUND ONE OBJECT AND CLASSIFIED IT OUT, AND THAT IS THE FINDING. Q28 added no network call, no credential read, no process spawn and no environment variable: its ninety-eight changed files read this repository's own source text and write planted files into temporary trees. Every `token` the quarter's diff mentions is a backtick in a horizon document, not a secret. The one item with a security shape is `Q28-CR-2` — a plant key that resolves outside its root — and it is classified as robustness rather than a vulnerability because every key in this tree is a string literal in this repository's own source: there is no untrusted input, so there is no attacker and no exploit path. THE LENS HAS ONE OBJECT AND IT IS THE HARNESS, for the third quarter running.",
    raisedOn: "2026-08-19",
    disposition: {
      kind: "accepted",
      why:
        "Nothing to fix that is not already fixed under `Q28-CR-2`. The re-read is not of this finding but of its premise: the moment a planting key comes from anywhere but a literal in this repository — a fixture read from disk, a name derived from a ledger row, a path built from an argument — the classification flips and the guard added at W370 becomes the thing standing between a probe and the working tree.",
      reviewBy: "2026-11-19",
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
 * THE SHARED DERIVATION, not a fourth copy — `Q27-SIMP-2`'s remedy, used rather than re-derived.
 */
export function unaccountedUnits(ledger: string): string[] {
  return unaccountedFor(ledger, QUARTER, [...REVIEWED_UNITS, ...Object.keys(NOT_REVIEWED)]);
}

/** What a green pass does not prove. */
export const Q28_HARDENING_BOUND =
  "One quarter read by one reader, and THREE of the thirteen units are that reader's own. What a " +
  "pass offers against its own work is a different question asked later, never independence. THE " +
  "SHARPEST INSTRUMENT HERE WAS NOT THIS PASS: `Q28-CR-3` and `Q28-CR-4` were MEASURED by units " +
  "built after the quarter closed — W366 planted a second spelling against the private-copy " +
  "marker, W368 planted a sibling under an exemption's key — and this reader saw neither by " +
  "reading the diff. A register that plants is worth more than a reader who looks, and a pass that " +
  "did not notice that about itself would be claiming the wrong instrument. THE LENSES ARE UNEVEN " +
  "AND THE QUARTER IS WHY: the security lens had a harness and no product surface to read, and " +
  "its finding is the harness for the third quarter running — a lens that keeps finding the same " +
  "object is a lens with one object, not a tree with one weakness. THE FINDING COUNT IS NOT A " +
  "MEASUREMENT: what is here says how hard the quarter was read at least as much as how well it " +
  "was built, which is why this record carries findings and no total. NOT ONE FINDING IS ABOUT " +
  "WHETHER A PRACTICE CAN DO ANYTHING IT COULD NOT DO BEFORE, because the quarter's product " +
  "surface is one console page — a pass that read only machinery would report a tree in excellent " +
  "health while nobody could book an appointment. AND THE PASS CANNOT CHECK ITS OWN " +
  "COMPLETENESS: it reports what this reader saw in one range of diff, and the defect this " +
  "quarter is named for — a check that fails toward looking correct — is by construction the kind " +
  "a reader does not notice missing.";

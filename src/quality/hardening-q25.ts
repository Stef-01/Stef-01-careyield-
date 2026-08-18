// W331: Q25 hardening — the quarter that checked its claims, read for the claims it made.
//
// Q25'S THEME WAS *THE CLAIMS, NOT THE CODE*: every unit was to make one class of unchecked claim
// checkable or retire it. So the useful question for a review of it is not whether the registers
// work — the suite says they do, and every one of them is driven — but whether the quarter did to
// ITSELF what it did to the tree. Six of the findings below say it did not, in the same shape each
// time: a check that reads as checking something and checks nothing.
//
// AND THE QUARTER PREDICTED TWO OF THEM IN ITS OWN BOUNDS. `PLANTING_BOUND` (W303) said a suite that
// forgets its `afterAll` leaks a temporary directory and nothing here reads it — four callers had
// forgotten, the build box was holding 426 copies and 3.6 GB of `/tmp`. This is the second quarter
// running in which a stated bound named a way in and something walked through it while the sentence
// sat there unread; W328 found the first. A bound is a claim with no clock on it, and Q26's own
// theme is that a control which cannot reach its moment is a control about something else.
//
// THE MOST DANGEROUS FINDING IS THE ONE THAT ARGUES FOR DELETING A REAL CHECK. W316's sweep read
// its bindings from a flat file-wide map, so a name bound to `map` in one test and rebound to
// `filter` in a later one kept the first binding, and the later test's genuine length assertion was
// reported as a tautology. A false positive from a vacuity sweep is worse than a missed one: acting
// on it removes an assertion that was doing its job.
//
// THE READER WROTE MOST OF THE QUARTER, which `SELF_REVIEWED` names rather than hides. Six of the
// thirteen units are builder-A's and this pass is builder-A's, so what the review had to offer was
// distance in time and a different question, not independence. Where that shows, it is recorded.
//
// WHAT THIS DOES NOT PROVE is `Q25_HARDENING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads diffs, registers and one console page.

import { parseLedgerRows } from "./blocked-surface";
import type { HardeningFinding } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * `diffHead` is pinned rather than left at `HEAD`, which is W285's lesson: a range ending at HEAD
 * grows every time another session commits, so the record would claim more than was read. This one
 * ends at W325's close — the quarter's last commit — and the units built since under Q26 are
 * deliberately outside it, including three of this reader's own.
 */
export const QUARTER = { first: 313, last: 325, diffBase: "7c954c4", diffHead: "aceefe3" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W313",
  "W314",
  "W315",
  "W316",
  "W317",
  "W318",
  "W319",
  "W320",
  "W321",
  "W322",
  "W323",
  "W324",
  "W325",
];

/**
 * Units in the range this pass did not read, each with the reason.
 *
 * Empty, and that is worth stating rather than leaving to be inferred: every unit of the quarter
 * was read. Q24's pass carried two exclusions and Q23's three.
 */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {};

/**
 * Units the reader wrote, so the overlap is visible.
 *
 * A PASS THAT HID THIS WOULD BE CLAIMING AN INDEPENDENCE IT DOES NOT HAVE. Six of thirteen, and
 * the findings are not evenly spread across the two halves: CR-2, CR-3, CR-6 and SEC-2 are all in
 * builder-A's own units, which is what a reader with distance in time finds that the author on the
 * day did not.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W314: "Wrote the prose-number register whose header fallback is CR-5 and whose dead derivations are CR-6.",
  W316: "Wrote the length-preserving sweep whose binding map is CR-1.",
  W318: "Wrote the disposition clock this register's own findings are disposed against.",
  W320: "Wrote the header-ownership resolver whose last-write-wins map is CR-7.",
  W322: "Wrote the founder page's second reading, whose query parameter is SEC-1 and SEC-2.",
  W324: "Wrote the quarter's gate, which this pass is measured beside rather than by.",
};

/**
 * The findings, most severe first.
 *
 * Every one was DRIVEN before it was written down — the sweep run against a constructed input, the
 * leak counted on disk, the locator resolved against the page it names. A hardening pass that
 * reported what a reading suggested would be making exactly the kind of claim this quarter was
 * called after.
 */
export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q25-CR-1",
    lens: "code-review",
    unit: "W316",
    what:
      "`preservingBindings` read a FLAT, FILE-WIDE, LAST-WRITE-WINS map, so an assertion resolved a name against a binding that may have been overwritten, or may not have existed yet. Driven: a name bound to `xs.map(f)` in one test and rebound to `xs.filter(g)` in a later one keeps the first binding, because `filter` is not a preserving operation and so never overwrites — and the later test's `expect(rows.length).toBe(xs.length)`, a REAL claim about a filter, was reported as a vacuous tautology. A false positive from a vacuity sweep is worse than a missed one: acting on it deletes an assertion that was doing its job, and the sweep's whole authority is that its hits are safe to remove.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "Two changes, and neither works alone. Non-preserving rebindings are recorded too, so they can SHADOW an earlier preserving one; and resolution is positional against the assertion's own offset, so a binding declared after an assertion is not in scope for it. Driven three ways: the rebound case reports one hit instead of two, the genuine tautology is still reported, and an assertion standing before its binding reports nothing. No scope analysis, which is what `SWEEP_BOUND` already says.",
    },
  },
  {
    id: "Q25-CR-2",
    lens: "code-review",
    unit: "W315",
    what:
      "`boundsStaleOnClose` copies the WHOLE repository per call and never removes it, against `copyTree`'s stated contract that the caller removes it and `afterAll` is the usual place. Three more callers do the same: `author-tax.test.ts`, `closing-state.test.ts` and `manifest.ts`. Measured rather than reasoned about — the build box was holding 426 `/tmp/tree-*` directories and 3.6 GB, growing by ten per suite run. AND `PLANTING_BOUND` HAD SAID SO: *a suite that forgets its `afterAll` leaks a temporary directory, which no register here reads*. The sentence was right, sat unread through four callers forgetting, and the second quarter running in which a stated bound named a way in and nothing noticed something walking through it.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "`copyTree` now records what it makes and removes it at process exit, so a caller that forgets leaks nothing — W303's argument that a probe left by an interrupted run is made impossible rather than cleaned up, applied one level up. The per-call site removes its copy in a `finally` and the two suites in an `afterAll`, because the sweep frees at exit and a long run should not hold hundreds of megabytes it has finished with. Measured after, and the first measurement was WRONG: eight copies still survived a full verify, because vitest runs its workers as THREADS and an exit handler registered inside one never fires — the thread ends, the process does not. The sweep therefore also runs from the global teardown, which is the one hook guaranteed to execute in the main process after every worker, and it removes only trees created since the run began so a concurrent suite keeps its own. And the sweep then broke W296: its runner starts `npx vitest` as a CHILD process with its cwd inside a tree copy, so the child loaded the same hook and deleted the copy it was running in. The teardown now runs only when the cwd holds a `.git` — the one thing the repository has that no copy of it does. Ten leaked copies per run became zero, checked by counting after a full verify rather than by reasoning about it.",
    },
  },
  {
    id: "Q25-CR-3",
    lens: "code-review",
    unit: "W313",
    what:
      "Two tests in `author-tax.test.ts` asserted nothing about their subject. *Counts a file once however many registers send an author to it* built a local `Set` from a local list and checked the set had one entry — true of every JavaScript that has ever run — while `editSites`, the function whose deduplication is the unit's entire claim, was never called. And *is honest that a file is not a unit of work either* ended on `expect(withTree({...}, () => true)).toBe(true)`, which is the assertion that `true` is `true`. Both sit in a quarter whose subject is claims that read as checked and are not.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "The dedup test now drives `editSites` over the one file three registers really share — `manifest.ts`, found by deriving the sharing rather than assuming it, since the file the test used to name is shared by nobody — and asserts it is counted once. Driven: removing the `Set` from `editSites` fires it. The second test now compares the cost of a bare module against a full register through the instrument, which is what its sentence claims.",
    },
  },
  {
    id: "Q25-CR-4",
    lens: "code-review",
    unit: "W321",
    what:
      "The founder-gate clause of W321's spec — *nothing is sent, and the refusal walk crosses no founder gate* — counts `[data-testid=\"send-row\"]` on `/console/ops`. That testid is rendered only by `/console/outreach`, so the count is zero on any tree, whatever the walk did. The assertion also POSTs `/api/mock/console`, a state reset, immediately before counting. It is the quarter's own founder-gate check, and it cannot fail.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W334",
      evidence:
        "The assertion is replaced with one about a field the product WRITES: the refusal walk must leave `setupCompletedAt` null, and the same spec then finishes the wizard and requires it to be non-null, so the null is a state that was observed rather than a field nothing ever sets. WHAT IT COST TO GET THERE IS THE FINDING'S REAL LESSON, and W334 records it against itself: writing the replacement, I counted `feed-row` on `/console/ops` — a testid that exists nowhere in the tree — and then asserted the ops screen showed `silence`, which the seeded practice never does. Two more absences asserted against locators that could not match, in the test written to avoid exactly that. An absence is only a claim when something in the same test shows the observable can be present.",
    },
  },
  {
    id: "Q25-CR-5",
    lens: "code-review",
    unit: "W314",
    what:
      "`proseClaims` finds the header by cutting at the first `\\nimport `, and falls back to the WHOLE FILE when there is none. Modules with no import — 49 of them — therefore have their entire body scanned as header prose, so a number in a string literal or an identifier reads as a claim the tree's prose makes. The declared negative probe *does not read a claim out of code* passes only because its fixture happens to contain an import line.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "deferred",
      why:
        "The fix is small — a header is the leading comment block, not everything before the first import — but it changes what a tree-wide scan sees across 49 modules at once, and each new claim it surfaces needs classifying by somebody who can argue it. Doing that inside a hardening pass would mean writing 49 judgements at the end of a long firing, which is how the classes this quarter is about get written. W336 applies W323's shape to another claim vocabulary and is the unit already holding this scanner's neighbourhood.",
      by: "W336",
    },
  },
  {
    id: "Q25-CR-6",
    lens: "simplify",
    unit: "W314",
    what:
      "Five tree-walking derivations in `prose-numbers.ts` — `modulesStatingABound`, `foldModules`, `fullRegisterTax`, `exportedWalks`, `textScanningModules` — were wired to no `CLAIMS` row and referenced nowhere. The comment above them says *each answers one question a walk can answer, and is used by the rows below*, which was false for five of them; `noUnusedLocals` is off, so typecheck said nothing. Dead tree-walking code inside the register whose subject is prose that says something the tree does not.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "Removed rather than wired up: a derivation exists to answer a claim and there was no claim. The sentence above them is corrected to say each is used by a row, and says what was removed and why.",
    },
  },
  {
    id: "Q25-CR-7",
    lens: "code-review",
    unit: "W320",
    what:
      "W320's ownership map was built LAST-WRITE-WINS over exported SCREAMING names, so a name more than one module exports resolved to whichever module the walk happened to see last, and a header citing it could be attributed to the wrong owner. Names in that state are not rare — `QUARTER`, `FINDINGS`, `REVIEWED_UNITS` and `SELF_REVIEWED` once per hardening register, `SWEEP_BOUND` and `VOCABULARY_BOUND` by two modules each. AND IT FIRED WHILE THIS FINDING WAS BEING WRITTEN: adding `hardening-q25.ts` moved ownership of `SELF_REVIEWED` off `hardening-q24.ts`, and W311's header was reported for citing its own constant as foreign. The register recording the defect caused the defect, which is the second time this quarter that writing something down was what made it visible.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "A name with more than one owner now has none: the map is name to a SET of homes, and only the names with exactly one home are attributable. Silence on an ambiguous citation is the honest answer, because reporting one owner out of several is a guess. It removed the live mis-attribution and took three entries out of `FOREIGN_CITATIONS` with it — declarations that had been excusing attributions nobody could make, since each cited a name two modules export. The arm that would report the AMBIGUITY as a defect in its own right is not built here: what a header should say when two modules own a name is a design question, and this pass is not the place to settle somebody else's.",
    },
  },
  {
    id: "Q25-CR-8",
    lens: "simplify",
    unit: "W317",
    what:
      "Three no-op string expression statements sat after `REMEDY_BOUND` — editing debris, each a truncated tail of the bound's last sentence. One of them, *sample of one quarter read by one reader*, is a clause that appears nowhere in the bound, so a sentence the register meant to state was lost while its fragment stayed in the file as dead code.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "The three statements are removed. The lost clause is NOT restored: what it was meant to say cannot be recovered from a fragment, and inventing a sentence for somebody else's bound and attributing it to their unit is worse than the bound being shorter than intended.",
    },
  },
  {
    id: "Q25-SEC-1",
    lens: "security-review",
    unit: "W322",
    what:
      "Q25 puts a SECOND module on a request path. Q24-SEC-1 recorded `src/founder/outstanding.ts` becoming reachable from the founder page as the quarter's one structural change with a security consequence; W322 adds `src/founder/second-reading.ts`, which reads `BUILD-STATE.md` from `process.cwd()` on every render, with a query parameter selecting which rows are reported. Derived rather than assumed: `reachableFromApp` returns exactly five first-party modules, and these are two of them. No injection path — the file path is fixed and the parameter only matches row ids by equality, so nothing user-supplied reaches a filesystem call, a query or a template.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "accepted",
      why:
        "The same acceptance as Q24-SEC-1 and inheriting its terms rather than silently extending them: the console is behind sign-in, the documents are the repository's own, and the read is a file read at request time in a build nobody deploys. What is new is that it is now a PATTERN rather than one page — a second reader, and a first user-supplied parameter. If a third arrives, or if any of them starts building a path from input, this stops being an acceptance and becomes a design question about whether the console reads the repository at all.",
      reviewBy: "2027-02-18",
    },
  },
  {
    id: "Q25-SEC-2",
    lens: "security-review",
    unit: "W322",
    what:
      "The founder page's `?since=` marker is not echoed — an unknown marker renders the page's own constant sentence rather than the string from the link — and NOTHING CHECKED THAT. W224 established the property and its assertion for the setup wizard's `?error=` three hundred units ago: a crafted link cannot render attacker-supplied text in the console. W322 added a second console query parameter with no equivalent. The property held on the day it was written, which is exactly the state in which it is easiest to lose: the helpful version of the page, naming the marker it did not recognise, is one edit away.",
    raisedOn: "2026-08-18",
    disposition: {
      kind: "fixed",
      by: "W331",
      evidence:
        "W224's assertion, mirrored onto the founder page: a marker carrying a plausible instruction is passed in the link and neither the reading panel nor the document body may contain it. Driven — making the page render the marker beside its refusal fails the test — so the assertion is a check rather than a restatement of what the page happens to do.",
    },
  },
];

/** Findings with no disposition at all — the arm W294 exists to keep empty. */
export function undisposed(findings: readonly HardeningFinding[] = FINDINGS): string[] {
  return findings
    .filter((f) => f.disposition.kind === "deferred" && f.disposition.why.trim().length === 0)
    .map((f) => f.id)
    .sort();
}

/** Units in the reviewed range that the ledger holds and this pass names nowhere. */
export function unaccountedUnits(ledger: string): string[] {
  const inRange = parseLedgerRows(ledger)
    .map((r) => r.id)
    .filter((id) => {
      const n = Number(id.replace(/^W/, ""));
      return Number.isFinite(n) && n >= QUARTER.first && n <= QUARTER.last;
    });
  const named = new Set([...REVIEWED_UNITS, ...Object.keys(NOT_REVIEWED)]);
  return inRange.filter((id) => !named.has(id)).sort();
}

/** What this pass does not prove. */
export const Q25_HARDENING_BOUND =
  "One quarter read by one reader, and six of the thirteen units are that reader's own. What a " +
  "pass like this can offer against its own work is distance in time and a different question — " +
  "not independence, and the record says which units those are rather than leaving a reader to " +
  "work it out. The lenses are uneven too: the code-review lens read every hunk, the security " +
  "lens had one page and one parameter to look at and says so, and the simplify lens found dead " +
  "code but did not attempt the larger question of whether the quarter's registers should have " +
  "been fewer. Nor is the finding count a measurement of anything: a quarter with more findings " +
  "may have been read harder rather than built worse, and Q24's pass said the same thing about " +
  "its own eleven. What the pass IS good for is the comparison it makes possible — the same " +
  "lenses, over the next quarter, by whoever is holding it.";

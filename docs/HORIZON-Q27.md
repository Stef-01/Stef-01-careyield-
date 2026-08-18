# W338 — Q27 horizon (2026-08-18)

The sixth expansion under the horizon rule §6. Its six requirements are evaluated here, in
writing, **before a single Q27 unit is written**, which is what W338's own verify gate demands.

Every figure is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and
pinned row by row by `src/quality/horizon-q27.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W339–W351. No theme is written for Q28; W351 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below — and the dossier is newly trustworthy, because W335 found it understating the largest blocker. Plus `src/quality/hardening-q25.ts`, which is newer than both and is where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q27 adds no blocked row, and the count has not moved since the last horizon. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **338 week-units** before this expansion and **351 after it**, of which **320 are
done** once this close lands. **18 rows are blocked** — sixteen week-units plus `SUP-1` and
`SUP-2`.

| Waiting on | Units | Which | Waited |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 8 | W161, W162, W163, W186, W249, W251, SUP-1, SUP-2 | 319 units, since the plan |
| **G6** — public directory launch | 2 | W133, W185 | 319 units, since the plan |
| **G8** — third-party model processing | 2 | W146, W147 | 217 units, proposed at W104 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | 168 units, proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | 124 units, proposed at W208 |
| **G3** — live SMS to real patients | 1 | W174 | 319 units, since the plan |
| **Q9 action 1** — the Ahpra advertising review ask | 1 | W133 | 189 units, reached at W132 |
| **Q17 action 1** — may patients be ordered by anything a model learns | 1 | W217 | 116 units, reached at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and six quarters in.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires
it restated at every expansion, and because six quarters of building have not moved it.

The wait figures are **as at this expansion** and derived that way rather than live, so they say
what they said on the day. **G5 reads eight here and read six in every document before W335** —
not because anything was added, but because `SUP-1` and `SUP-2` had been invisible to a parse the
gate dossier and its own test each kept a private copy of. The largest single blocker is a third
larger than the tree has been telling anybody, and that correction is Q27's theme arriving early.

## Where Q27's theme comes from

Q26 asked WHEN a control answers, and the quarter answered it: the close runs inside the gate,
order-dependent checks are enumerated with the instant each reads, a deferral is re-read at the
unit it names, a declaration carries the event that ends it. The gate is W337's to re-read and it
is in flight in a sibling session as this is written; nothing below depends on its verdict, because
what Q27 comes from is not whether Q26 met its gate but what the quarter kept finding on the way.

**The tree already knew, and nothing read it.** Six times, in six different registers.

**W331 found two bounds that had predicted their own failures.** `PLANTING_BOUND` said, in
writing, that a suite forgetting its `afterAll` leaks a temporary directory and *no register reads
it* — and four callers had forgotten, and the build box was holding **426 copies and 3.6 GB of
`/tmp`**. The bound was not wrong, or vague, or out of date. It named the way in, in a sentence
this tree requires every register to write, and then nothing walked back to check whether anybody
had gone through. Q26's row for that unit records it as the *second quarter running* where a stated
bound named a way in and something walked through it; W328 found the first.

**W334 found a fact the product had known since the wizard was built.** `setupReadiness` has
always been able to say which setup step a practice has not finished, and **exactly one surface
ever asked it** — the wizard. Every other screen worked, was empty, and said nothing about why.
The state every practice is in on day one was the state the product said least about, and the
answer was already computed.

**W335 found a document and its own test sharing a private copy of a parse.** W310 fixed the
ledger parse that dropped `SUP-1` and `SUP-2` and fixed every register that CALLED the shared one;
`gate-dossier-y5.test.ts` had its own, so the document said sixteen, the test agreed, and the tree
said eighteen. The correct answer was one import away and had been for a quarter.

**W333 found that twelve of sixteen "untested" modules were tested.** The register asked whether a
module had a SIBLING suite, which is a convention; the question is reachability, and walking from
every test file answers it. The tree had the import graph the whole time.

**W329 found a citation nobody had ever resolved.** `Q23-CR-2` was disposed `fixed` by
`W293, W296 and W298` — three units in prose, in a field typed `string` beside a field W318 had
already typed `UnitId`. One arm of the same type carried a resolvable id and the other did not,
and nothing compared them.

**And W331's own fix produced the shape twice more**: writing a finding caused the finding, because
adding a register moved a shared name and W320's ownership map is last-write-wins; and the exit
sweep it added broke W296 by deleting the tree a child process was running in — *a control
answering about the wrong scope, inside the fix for exactly that class.*

The common shape is not that the checks are missing. It is that **the tree derives a fact, states
it, or computes it, and then nothing reads it** — a bound that names a failure mode, a readiness
value with one caller, a shared parse with a private copy beside it, an import graph nobody walked,
a typed field next to an untyped twin. Every one of these was cheaper to find than to build, and
every one had been true for at least a quarter.

So: **Q27 — what the tree already knows.** Every unit takes a fact this tree has already derived,
already stated or already computed, and makes something read it. The gate follows Q25's and Q26's
shape rather than a number: **every claim this document makes about a fact the tree holds is either
read by a check that exists or declared unread with its reason**, and W350 re-reads the list.

Nothing here needs a ruling; nothing adds a blocked row.

## Q27 — what the tree already knows (W339–W351)

Laid into `docs/FIVE-YEAR-PLAN.md` §5l with matching rows in `BUILD-STATE.md`. Seven are marked
`[P]` and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W339 | Bounds that name a failure nothing reads |
| W340 | A derived fact with exactly one reader |
| W341 | The private copy of a shared parse |
| W342 | Typed citations: a field that names a unit, a module or an export |
| W343 | Q26's hardening pass |
| W344 | When the condition actually held: a finding's timeline |
| W345 | The escape hatches re-read against what the tree can now observe |
| W346 | The console's day two: a practice that finished setup and is waiting |
| W347 | The founder's page says what the tree already knows |
| W348 | One way to say a thing is present |
| W349 | The survivors register over Q26's modules |
| W350 | The claims re-read — this quarter's gate |
| W351 | Quarter close: Q28 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Q28 or Year 8.** Requirement 1, and W208's receipt for the cost of planning
  four years ahead.
- **It does not set a numeric gate.** Q24's was a number, the number moved the wrong way, and that
  quarter's own note says the instrument rather than the work was wrong — counting controls
  measured the wrong thing. Q25 and Q26 refused a number for the same reason and both gates worked.
- **It does not claim Q26 failed.** Q26's gate is W337's to read and it is in flight. What this
  close prices is the quarter's evidence, which stands whichever way that reading goes.
- **It does not propose an eleventh gate.** Q27 crosses none.
- **It does not rank the outstanding decisions.** W257 declined; the two orders that fall out of
  its tables disagree, and it is the founder's call.
- **It does not treat a bound that named its own failure as a bad bound.** Both were accurate. The
  defect is that a sentence this tree requires everywhere is read by people and by nothing else.

## What the loop cannot do, stated plainly

It cannot answer any of the eighteen. Three gates proposed in five years, none ruled on. Six
quarters of work since the last horizon have moved the blocked count only by discovering two rows
that were already there — and this quarter is the one where the document that prices them finally
said eighteen.

And the fact underneath has not changed: **G1, G2, G4 and G7 block nothing, and they are what stand
between this tree and a patient.** Five years and six quarters produced a verified product and no
user. W309's accepting walk, W321's refusing practice, W322's second reading and W334's unfinished
setup are the closest the loop has got on its own; W346 extends them by exactly as much as can be
extended without a ruling — the screen a practice sees on the day after it finishes setting up,
still on synthetic data, still sending nothing to anybody.

That remains the founder's move. The plan says so here, for the sixth quarter running.

# W377 — Q30 horizon (2026-08-20)

The ninth expansion under the horizon rule §6. Its six requirements are evaluated here, in
writing, **before a single Q30 unit is written**, which is what W377's own verify gate demands.

Every figure is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and
pinned row by row by `src/quality/horizon-q30.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W378–W390. No theme is written for Q31; W390 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below, plus `src/quality/hardening-q28.ts` and the Q29 ledger rows, which are newer than both and are where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q30 adds no blocked row, and the count has not moved since the last horizon. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **377 week-units** before this expansion and **390 after it**, of which **359 are
done** as this is written. **18 rows are blocked**, which is the count over every row the ledger
holds rather than over the week-units alone — sixteen week-units plus `SUP-1` and `SUP-2`.

| Waiting on | Rows | Which | Waited |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 8 | W161, W162, W163, W186, W249, W251, SUP-1, SUP-2 | 358 units, since the plan |
| **G3** — live SMS to real patients | 1 | W174 | 358 units, since the plan |
| **G6** — public directory launch | 2 | W133, W185 | 358 units, since the plan |
| **G8** — third-party model processing | 2 | W146, W147 | 256 units, proposed at W104 |
| **Q9 action 1** — the Ahpra advertising review ask | 1 | W133 | 228 units, reached at W132 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | 207 units, proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | 163 units, proposed at W208 |
| **Q17 action 1** — may patients be ordered by anything a model learns | 1 | W217 | 155 units, reached at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and nine quarters in. Since W347 the
founder's own page says so, and since W361 that page no longer renders a stand-in zero as though it
were a count.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires it
restated at every expansion, and because nine quarters of building have not moved it.

The wait figures above are **as at this expansion** and derived that way rather than live, so they
say what they said on the day. **One sibling row was in flight when the figures were taken** —
W374, the survivors register over Q28's modules, held by the other builder — so it is named in
`IN_FLIGHT_AT_EXPANSION` and excluded from the done count rather than silently priced as either.
The last horizon needed no such exemption and kept the mechanism anyway, on the argument that a
list which disappears between the occasions it is needed is one somebody re-invents badly. This
expansion is the occasion.

## Where Q30's theme comes from

Q29 asked what each check is over, and its units landed: every census member carries a population,
the empty registers are argued rather than left to look identical to dead ones, the console's
unreachable half is pinned, the product's own patient rules are measured against a synthetic panel,
and W376 re-read the quarter's own gate and found every population it named shown both ways.

**Q28's hardening pass had already written this quarter's theme in one sentence.** W370's
`hardening-q28.ts`
says it fails toward green, **and it did so twice on `main` in one day**: W363's close left a
promise aimed at a unit that had just landed, and W364's close left two assertions requiring the
live claimed set to equal exactly its own row. Both read a ledger row's STATUS. Both could
therefore only go wrong AT THE CLOSE — and the close is the one commit whose suite is easiest not
to re-run. W326's close gate exists for precisely that event and saw neither, because both live
welded inside `.test.ts` files, which export nothing. The register `weldedLedgerTests` DERIVES that
population; it holds **fifty files**; nothing fails because of it. The tree measured the gap on
every run of the quarter it cost two reds.

**Q29 then hit the same shape from four directions, and none of them was a wrong comparison.**
W375 found the temp-directory sweep wired to `teardown` alone — the hook an interrupted run never
reaches, which is the only case the sweep exists for; residue from a killed run therefore sat
through the whole of the next run, and through the one after if that was killed too, which is how a
day of killed sessions reached two gigabytes. W371 found a citation register whose rows resolved a
test TITLE and ran nothing, and building the runner found a row citing a test that drives a
different function in the same file; two of its rows still cannot be run at all, because their
comparison is welded inside a `.test.ts`. W367 found an import cycle whose symptom is `undefined`
at module-evaluation rather than a build error, so which file the graph is entered through decides
what the register sees. And W376, the quarter's own gate, found a scan reading a name out of a
string literal in a register built to re-read populations.

**A check is a comparison over a population at a MOMENT, and this tree has written down two of the
three.** W267 says what walks; Q29 says what each is over. Nothing says when any of it answers, or
whether the moment it answers at is one the failure it guards against can reach. A green run says
the comparison agreed with the declaration over the right set. It says nothing about whether
anybody was watching at the time it could have gone wrong.

So: **Q30 — when the check runs.** Every unit takes a check in this tree and establishes its
moment: derived from the harness rather than declared, and shown both catching a failure that
happens at that moment and staying silent about one that happens at another. Where the moment
cannot see the failure the check exists for, the unit says so or rewires it. The gate follows Q25's
through Q29's shape rather than a number, because Q24's was a number and the number measured the
wrong thing: the gate is that **every moment this document names is derived, and is shown both
catching a failure at that moment and staying silent about one at another**, and W389 re-reads the
list.

Nothing here needs a ruling; nothing adds a blocked row.

## Q30 — when the check runs (W378–W390)

Laid into `docs/FIVE-YEAR-PLAN.md` §5o with matching rows in `BUILD-STATE.md`. Nine are marked
`[P]` and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W378 | The moment register: for every check in the census, when it runs |
| W379 | A comparison welded inside a test file, and the ones that can be moved out |
| W380 | The close is the moment nobody re-runs |
| W381 | Module-evaluation order as a correctness condition |
| W382 | A hook wired to a moment its case never reaches |
| W383 | Q29's hardening pass, with the review skills |
| W384 | What a page RENDERS, not what it computes |
| W385 | Once per file or once per run |
| W386 | The survivors register over Q29's modules |
| W387 | The product's moments: when a rule decides about a patient |
| W388 | A citation resolved but never run, everywhere else |
| W389 | The moments re-read — this quarter's gate |
| W390 | **QUARTER CLOSE.** Q31 expansion under the horizon rule |

## What this expansion does not do

- **It does not write Q31.** One quarter at a time. W390 expands the next when it arrives, from
  what Q30 finds rather than from what this document guesses.
- **It does not set a numeric gate.** Q24's was a number, the number moved the wrong way, and that
  is recorded in `docs/HORIZON-Q25.md` where the correction was made. Five quarters have now
  refused a number and each gate worked; repeating what works is not novelty for its own sake.
- **It does not touch §4.** Every founder gate is inherited exactly as written.
- **It does not propose an eleventh gate.** Q30 crosses none.
- **It does not claim the loop can unblock anything.** Eighteen rows wait on a person, the longest
  for three hundred and fifty-eight units, and building faster does not shorten that. What the loop
  can do is make sure the wait is visible and correctly counted, which is what W347 and W361 did to
  the founder's own page.

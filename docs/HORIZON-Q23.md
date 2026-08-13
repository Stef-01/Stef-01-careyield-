# W286 — Q23 horizon (2026-08-14)

The second expansion under the horizon rule §6. Its six requirements are evaluated here, in
writing, **before a single Q23 unit is written**, which is what W286's own verify gate demands.

Every count is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and pinned
row by row by `src/quality/horizon-q23.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W287–W299. No theme is written for Q24; W299 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below, plus `src/quality/hardening-q22.ts`, which is newer than both and is where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q23 adds no blocked row; every unit is buildable with no ruling. W263's check enforces it. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **286 units** before this expansion and **299 after it**. **16 rows are blocked,
unchanged from W260's and W273's readings**, and this expansion adds none.

| Waiting on | Units | Which | Outstanding since |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 6 | W161, W162, W163, W186, W249, W251 | plan §4, day one |
| **G6** — public directory launch | 2 | W133, W185 | plan §4, day one |
| **G8** — third-party model processing | 2 | W146, W147 | proposed at W104 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | proposed at W208 |
| **G3** — live SMS to real patients | 1 | W174 | plan §4, day one |
| **Q17 decision** — may patients be ordered by anything a model learns | 1 | W217 | raised at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and two quarters in.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires
it restated at every expansion, and because two quarters of building have not moved it.

## Where Q23's theme comes from

Q22 set out to check the rendered surface, and it did. But the thing the quarter actually
demonstrated is in the hardening register and in six separate unit notes, and it is not about
rendering at all:

> **A check that cannot fail is indistinguishable from a check that passes.**

Six instances, in ten units, found six different ways:

- **W285/CR-1** — W284's route register resolves every citation, except that `specOpens` branched
  on `probe.endsWith("/")`, so the root route's check became `text.includes("/")` — true of every
  spec ever written. The register's central claim was vacuous for one route, and its own author
  did not see it.
- **W274** — a test of mine from W273 asserted every Q22 row was still `available` or `claimed`.
  Not the requirement, and not a property of the quarter: it went red on a unit being *built*.
- **W278** — my comment-subtraction test pointed at a function whose comment has no quotation
  marks, so removing the stripping changed nothing. The line turned out to be load-bearing
  elsewhere; the test guarding it could not fail.
- **W284** — my "finding" was that two routes appear in no literal path. The assertion I wrote to
  *pin* the finding failed, and the finding was wrong.
- **W279** — a detector for empty-state branches disagreed with the hand classification in both
  directions. Tuning it further would have been fitting the check to the answer, so it was dropped
  and recorded.
- **W269, earlier** — a share budget measuring exactly 1.000, satisfying its own envelope with the
  branch it guards never executed.

Every one was found by **driving the check** — breaking the thing and watching, or measuring the
detector — and none by reading. `AUDIT-Y5.md` already recorded the discomfort behind this: *a tree
whose registers catch its own defects makes a self-reviewing auditor look effective, and the two
are not the same thing.* W267 proved each register would notice a file arriving. Nothing has
checked that a register's **assertions** would notice anything.

So: **Q23 — the checks that cannot fail.** Every unit either finds vacuous assertions
mechanically, removes a class of them, or makes a register prove its own claim can fail. Nothing
here needs a ruling; nothing adds a blocked row.

The quarter also picks up the gap Q22's hardening declared rather than hid: **W279 landed after the
reviewed range and is unreviewed.** W287 reviews it, so the gap closes in the quarter that
recorded it rather than being carried.

## Q23 — the checks that cannot fail (W287–W299)

Laid into `docs/FIVE-YEAR-PLAN.md` §5h with matching rows in `BUILD-STATE.md`. Five are marked
`[P]` and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W287 | W279 reviewed: the unit Q22's hardening declared out of range |
| W288 | The tautology sweep: assertions whose subject cannot make them fail |
| W289 | Every register proves one assertion can fail, not just its walk |
| W290 | Pinned constants that move on a planned event, swept and bounded |
| W291 | The branch nobody executed: registers whose refusal path never runs |
| W292 | Detectors checked against a planted negative, not only a planted positive |
| W293 | `toEqual([])` over a list nothing could have put anything into |
| W294 | The acceptance registers, re-derived: every acceptance still live |
| W295 | What a green suite does not prove, declared per register |
| W296 | Mutation sampling: a random assertion deleted, and the suite must fail |
| W297 | The bounds register: every stated `*_BOUND` checked against its unit |
| W298 | Q23 hardening |
| W299 | Quarter close: Q24 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Q24 or Year 7.** Requirement 1, and W208's receipt for the cost of planning
  four years ahead.
- **It does not rank the outstanding decisions.** W257 declined; the two orders that fall out of
  its tables disagree, and it is the founder's call.
- **It does not propose an eleventh gate.** Q23 crosses none.
- **It does not claim Q22's theme failed.** The rendered surface got checked: the page suite is in
  the gate, every route is opened by a named spec, the copy W200 could not see is linted, and two
  cross-tenant defects are closed. The theme succeeded and produced a sharper finding than the one
  it was aimed at, which is what a quarter derived from evidence is supposed to do.

## What the loop cannot do, stated plainly

It cannot answer any of the sixteen. Three gates proposed in five years, none ruled on. Two
quarters of work since the last horizon have moved the blocked count by zero, which is the number
this section exists to keep visible.

What it can do is make its own controls honest, and Q22 produced six reasons to think that is worth
a quarter.

# W390 — Q31 horizon (2026-08-21)

The tenth expansion under the horizon rule §6. Its six requirements are evaluated here, in
writing, **before a single Q31 unit is written**, which is what the rule's own verify gate demands.

Every figure is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and
pinned row by row by `src/quality/horizon-q31.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W391–W403. No theme is written for Q32; W403 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, plus `src/quality/hardening-q29.ts` and the Q30 ledger rows, which are newer than both and are where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q31 adds no blocked row, and the count has not moved since the last horizon. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **390 week-units** before this expansion and **403 after it**, of which **372 are
done** as this is written. **18 rows are blocked**, which is the count over every row the ledger
holds rather than over the week-units alone — sixteen week-units plus `SUP-1` and `SUP-2`.

| Waiting on | Rows | Which | Waited |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 8 | W161, W162, W163, W186, W249, W251, SUP-1, SUP-2 | 371 units, since the plan |
| **G3** — live SMS to real patients | 1 | W174 | 371 units, since the plan |
| **G6** — public directory launch | 2 | W133, W185 | 371 units, since the plan |
| **G8** — third-party model processing | 2 | W146, W147 | 269 units, proposed at W104 |
| **Q9 action 1** — the Ahpra advertising review ask | 1 | W133 | 241 units, reached at W132 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | 220 units, proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | 176 units, proposed at W208 |
| **Q17 action 1** — may patients be ordered by anything a model learns | 1 | W217 | 168 units, reached at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and ten quarters in.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires it
restated at every expansion, and because ten quarters of building have not moved it.

The wait figures above are **as at this expansion** and derived that way rather than live, so they
say what they said on the day. **One sibling row was in flight when the figures were taken** —
W389, the moments re-read, held by the other builder — so it is named in `IN_FLIGHT_AT_EXPANSION`
and excluded from the done count rather than silently priced as either. That mechanism was kept
through the expansions that needed no exemption, on the argument that a list which disappears
between the occasions it is needed is one somebody re-invents badly.

## Where the theme comes from

Q29's hardening pass is four findings and they are one finding wearing four coats.

**Q29-CR-1** — the register that guards against stale numbers was reading the wrong number. W314's
number vocabulary was a hand-typed map, and a compound nobody had typed in did not fail to match:
`\b` matches at the hyphen, so the scan took the unit on the right as the whole number. Four rows
were live and wrong, every one classified `at_the_unit`, which is never re-derived.

**Q29-CR-2** — the register W373 built, deciding which product rules hold a patient panel, was
narrow four ways and wide one. `[^)]*` stops at the first `)`, so a rule taking a callback truncates before its
panel; one type spelling is known, so `ReadonlyArray<Patient>` is not counted; and with no left
boundary `SyntheticPatient[]` is.

**Q29-SIMP-1** — the scan-order rule protects every site except the one that wrote it out by hand,
which W374's own quarter sweep had already named as reading source text undeclared.

**Q29-SR-1** — the guard W375 built against removing something this tree did not make is three
ordinary English words in a directory the operating system shares with every other program.

In every one, A PATTERN IS STANDING IN FOR A POPULATION. The register's subject is whatever a regex
or a name happens to match, the pattern and the check are the same object, and so a pattern that
matches the wrong thing reports green — there is no second instrument that would report a miss.
Q29-CR-2 is the sharpest: nothing escapes today, *which is precisely why nothing caught it*.

Q30 met the same shape without naming it, four more times. W388 tried three readings of what a
citation's subject is and each was wrong for a register spelled differently. W387's first draft read
a parameter's NAME and pulled in `pool: PoolConfig`, a configuration. W384's population was
expression names and missed the zero a page actually renders. W385 finds a repository write by the
binding being called `ROOT`. Every one of those figures is **as at this expansion**.

So: **Q31 — what the pattern cannot see.** Every unit takes a register whose population is defined
by a pattern and measures that pattern against a SECOND, independent reading of the same
population — a different derivation, a planted instance in every spelling the tree writes, or the
thing itself at runtime. The disagreement is the finding. Where the two readings cannot be made
independent, the unit says so.

The gate follows Q25's through Q30's shape rather than a number: the gate is that **every pattern
this document names is measured against a second reading of its own population, and the two are
shown disagreeing about a planted instance before they are shown agreeing about the tree**, and
W402 re-reads the list.

Nothing here needs a ruling; nothing adds a blocked row.

## Q31 — what the pattern cannot see (W391–W403)

Laid into `docs/FIVE-YEAR-PLAN.md` §5p with matching rows in `BUILD-STATE.md`. Nine are marked
`[P]` and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W391 | The pattern register: every population defined by a regex, and what it is over |
| W392 | Q29-CR-2 closed: the patient-rule signature read four ways it is written |
| W393 | A number vocabulary that cannot be outgrown by a compound |
| W394 | The name conventions a register rests on, enumerated |
| W395 | Q30's hardening pass, with the review skills |
| W396 | A population measured against the runtime, not against the source |
| W397 | The survivors register over Q30's modules |
| W398 | Every scan site read in both spellings this tree writes |
| W399 | The product's patterns: what a rule matches that nobody meant |
| W400 | A guard whose vocabulary is shared with the world |
| W401 | Two derivations of one population, and the diff between them |
| W402 | The patterns re-read — this quarter's gate |
| W403 | **QUARTER CLOSE.** Q32 expansion under the horizon rule |

## What this expansion does not do

- **It does not write Q32.** One quarter at a time. W403 expands the next when it arrives, from
  what Q31 finds rather than from what this document guesses.
- **It does not set a numeric gate.** Q24's was a number, the number moved the wrong way, and that
  is recorded in `docs/HORIZON-Q25.md` where the correction was made. Six quarters have now refused
  a number and each gate worked.
- **It does not touch §4.** Every founder gate is inherited exactly as written.
- **It does not propose an eleventh gate.** Q31 crosses none.
- **It does not claim the loop can unblock anything.** Eighteen rows wait on a person, the longest
  for three hundred and seventy-one units, and building faster does not shorten that.
- **It does not claim a second reading is an independent one.** Two derivations written by the same
  hand in the same week share the assumption that matters, and the gate can only ask that they
  disagree about a planted instance — not that they would disagree about the one nobody planted.

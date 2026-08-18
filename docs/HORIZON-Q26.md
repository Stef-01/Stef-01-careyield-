# W325 — Q26 horizon (2026-08-18)

The fifth expansion under the horizon rule §6. Its six requirements are evaluated here, in
writing, **before a single Q26 unit is written**, which is what W325's own verify gate demands.

Every figure is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and
pinned row by row by `src/quality/horizon-q26.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W326–W338. No theme is written for Q27; W338 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below, plus `src/quality/claim-classes.ts` and the Q25 ledger rows, which are newer than both and are where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q26 adds no blocked row, and the count has not moved since the last horizon. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **325 week-units** before this expansion and **338 after it**, of which **308 are
done** once this close lands. **18 rows are blocked**, which is the count over every row the ledger
holds rather than over the week-units alone — sixteen week-units plus `SUP-1` and `SUP-2`.

| Waiting on | Units | Which | Waited |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 8 | W161, W162, W163, W186, W249, W251, SUP-1, SUP-2 | 306 units, since the plan |
| **G6** — public directory launch | 2 | W133, W185 | 306 units, since the plan |
| **G8** — third-party model processing | 2 | W146, W147 | 204 units, proposed at W104 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | 155 units, proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | 111 units, proposed at W208 |
| **G3** — live SMS to real patients | 1 | W174 | 306 units, since the plan |
| **Q9 action 1** — the Ahpra advertising review ask | 1 | W133 | 176 units, reached at W132 |
| **Q17 action 1** — may patients be ordered by anything a model learns | 1 | W217 | 103 units, reached at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and five quarters in.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires
it restated at every expansion, and because five quarters of building have not moved it.

The wait figures above are **as at this expansion** and are re-derived that way rather than live:
counted over the units that existed when the document was written, so they say what they said on
the day. Q25's horizon wrote 293 for the standing gates and the live figure is 306 today, which is
the same sentence going quietly out of date in a document nobody re-reads — the shape Q25 spent a
quarter on, in the document that recorded it.

## Where Q26's theme comes from

Q25 asked that every unchecked claim be made checkable or retired, and by its own gate it
succeeded: **W324 re-read the class list and found every class either driven by a check that
speaks or argued away against the horizon's own words.** Nine are driven now. This close is not a
report of a missed gate.

What the quarter produced *besides* its gate is where Q26 comes from, and it is one shape seen five
times.

**W315 built the instrument for the gap and the gap took another unit anyway.** The quarter's own
finding was that `pnpm verify` runs while the ledger row still says `claimed`, so every check keyed
to a row is blind to the one event that always happens. W315 built `closeRow` and the checks that
read the closed text. Then W323 closed its row, W324's `pending` arm fired exactly as written, and
**`main` was red for the length of a firing** — because the close happens after the gate, and the
instrument built to see that was not run at the close. An instrument nobody wired into the moment
it describes is a claim about a moment, not a check on one.

**W318 found three deferrals pointing at ranges that nothing evaluates**, and one of them —
Q23-SIMP-1, deferred to `W299+` — had been *answered by W301* and still read `deferred` seventeen
units later. The disposition named a moment; no moment ever arrived to read it.

**W322 fixed a plant that wrote into the repository other workers were walking, and the residue
came back.** W321's `pnpm verify` went green while leaving an empty `src/planted/` behind, and
W322's two residue detectors then fired on the next directory run and not on three after it. Both
detectors are correct and both are **order-dependent inside a single run**: they read the
repository at the moment they happen to execute, so they pass whenever they run before whatever
plants. A check on a shared mutable thing answers about an instant, and nothing says which instant.

**W323 found a register making a false claim about its own mechanism**, and nothing in the tree
reads that. The module argued that an anchored subject pattern was what refused a near miss; the
matcher was. It was found by a mutation pass a builder chose to run, and W296's sampler — the one
control that would look — samples on a schedule nobody ties to the module arriving.

**And W324's `pending` arm is the counter-example that names the shape.** It is the one declaration
in the quarter tied to an *event* rather than to a run: *the day the ledger closes that row, this
answer must become a driven one or this gate fails.* It fired on the exact firing it named. It is
the only Q25 control that did, and it is the only one that was written to.

The common shape is not that the checks are wrong. Q25's checks are good and its gate is green. It
is that **a control in this tree answers at the moment a builder happens to run it, and several of
them are about moments the suite never occupies** — the close after the gate, the deferral's
target unit, the instant before another worker writes, the arrival of a module nobody has mutated.
A check that cannot reach its moment is not a weaker check; it is a check about something else.

So: **Q26 — when the check runs.** Every unit either ties a control to the event it is about, or
states which moment it answers at and what that moment cannot see. The gate follows Q25's shape
rather than a number, because Q24's was a number and the number measured the wrong thing: the gate
is that **every control named in this document either runs at the event it concerns or declares
the instant it answers at, with what that instant cannot see**, and W337 re-reads the list.

Nothing here needs a ruling; nothing adds a blocked row.

## Q26 — when the check runs (W326–W338)

Laid into `docs/FIVE-YEAR-PLAN.md` §5k with matching rows in `BUILD-STATE.md`. Six are marked `[P]`
and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W326 | The close inside the gate: the loop runs its own close |
| W327 | Order-dependent checks: which instant a control answers at |
| W328 | The plant that survived W322, found by instrumentation |
| W329 | A deferral answered where it points |
| W330 | Declarations that end themselves, W324's arm generalised |
| W331 | Q25's hardening pass, which the quarter did not run |
| W332 | The survivors register re-derived over the quarter's modules |
| W333 | What a green suite does not run |
| W334 | The demo path's third scenario: a practice set up wrong |
| W335 | The gate dossier derived rather than written |
| W336 | One way to say a thing is absent |
| W337 | The controls re-read — this quarter's gate |
| W338 | Quarter close: Q27 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Q27 or Year 8.** Requirement 1, and W208's receipt for the cost of planning
  four years ahead.
- **It does not set a numeric gate.** Q24's was a number, the number moved the wrong way, and that
  quarter's own note says the instrument rather than the work was wrong — counting controls
  measured the wrong thing. Q25 refused a number for the same reason and its gate worked;
  repeating what worked is not novelty for its own sake.
- **It does not claim Q25 failed.** Q25 met its gate. Nine claim classes are driven, the tautology
  class W288 could not see is closed, every disposition carries a clock, the blocked surface reads
  in both directions, and the demo path has a second scenario. This quarter's theme is what Q25's
  work made visible, not what it got wrong.
- **It does not propose an eleventh gate.** Q26 crosses none.
- **It does not rank the outstanding decisions.** W257 declined; the two orders that fall out of
  its tables disagree, and it is the founder's call.
- **It does not treat `main` going red as a unit's defect.** W323 closed its row correctly and
  W324's arm fired correctly. The red is the two of them meeting at a moment neither could run in,
  which is the theme rather than a fault.

## What the loop cannot do, stated plainly

It cannot answer any of the eighteen. Three gates proposed in five years, none ruled on. Five
quarters of work since the last horizon have moved the blocked count only by discovering two rows
that were already there.

And the fact underneath has not changed: **G1, G2, G4 and G7 block nothing, and they are what stand
between this tree and a patient.** Five years and five quarters produced a verified product and no
user. W309's demo path, W310's founder page, W321's refusing practice and W322's second reading are
the closest the loop has got on its own; W334 extends them by exactly as much as can be extended
without a ruling — a third scenario on synthetic data. None of them sends anything to anybody.

That remains the founder's move. The plan says so here, for the fifth quarter running.

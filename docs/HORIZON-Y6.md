# W260 — Year 6 horizon (2026-08-13)

Written at the close of the five-year arc, from `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`
and from nothing else. It expands **one quarter**, records the gate position, and states what
replaces the expansion rule that wrote the first five years.

Every count below is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and
pinned row by row by `src/quality/horizon-y6.test.ts`. When the gate position changes this document
goes red — which is the signal to re-derive it, not a defect in it.

## The position, stated first

The ledger holds **273 units**, of which **16 are blocked**. Every blocked row waits on G3,
G5, G6, G8, G9, G10 or the Q17 learned-ranking decision:

| Waiting on | Units | Which |
| --- | --- | --- |
| **G5** — clinical pathway content sign-off | 6 | W161, W162, W163, W186, W249, W251 |
| **G6** — public directory launch | 2 | W133, W185 |
| **G8** — third-party model processing (proposed W104) | 2 | W146, W147 |
| **G9** — third-party organisational reporting (proposed W156) | 2 | W202, W203 |
| **G10** — payer and insurer data flows (proposed W208) | 2 | W240, W241 |
| **G3** — live SMS to real patients | 1 | W174 |
| **Q17 decision** — may patients be ordered by anything a model learns | 1 | W217 |

**G1, G2, G4 and G7 block nothing.** They are the four that stand between this tree and a single
real patient being helped, and no unit in five years has ever waited on one — which is precisely
why they are last in any table sorted by units blocked, and why W257 wrote its dossier the other
way round.

**Decisions on this page the loop may take: zero.** That number has been zero for five years. The
horizon rule now requires it to be restated at every expansion rather than once a year in a
document nobody asked for.

## What follows from that, and it is the whole reason this is a quarter and not a year

Five years of the §6 expansion rule produced 260 verified units, roughly 223 modules and about
3,000 tests, and **nothing has been sent to anybody**. That is not a failure of the loop's output.
It is the rule having no opinion about it: the rule reads a theme, produces thirteen units, and the
loop verifies them, and there is no state in which it says *this is now the founder's move*.
Because G1, G2, G4 and G7 block no row, **the loop can never be blocked by the decisions that
matter most**. It will keep going indefinitely, correctly, past the point of usefulness.

`GATE-DOSSIER-Y5.md` puts the sharpest version of it: the loop has proposed a gate roughly once a
year for three years and none has been ruled on — *the mechanism is working; the answering is not*.
And ratifying either proposal on its own moves no data, because G9 and G10 are both double-blocked
by G1, which itself blocks no ledger row. **G1 is the gate under the other two.**

So Q21's theme is the only honest one available to a loop that may answer none of them: **cut the
cost of yes.** Every unit either shortens the day a ruling lands or re-derives a control that made
Year 5 quiet. No unit needs a ruling to start, and no unit may add a blocked row.

## What the audit contributes

`AUDIT-Y5.md` found **one LOW finding in the whole year**, fixed in the same unit, and says why:
*most of this year's findings were caught by the tree rather than by an audit*. W167's fold
register caught a same-day tie in W243; W210's latent-finding register fired on W257 mid-build for
the failure it was recorded against two years earlier; W242's credential scanner caught W254's own
fixture; W200's copy surface and W201's decision register each rejected an over-declaration and
each was right.

It also records the discomfort, and the horizon takes it seriously rather than quoting it: *a tree
whose registers catch its own defects makes a self-reviewing auditor look effective, and the two
are not the same thing.* The registers are now this tree's principal control, and nobody has ever
checked that they would notice. **W267 is that check** — every self-checking register enumerated,
and each one proved to fail by moving the tree under it, which is the mutation discipline the last
two quarters kept finding vacuity with.

The remaining Q21 units follow the same reading: the controls that made Year 5 quiet are worth
re-deriving at the Y6 boundary rather than carrying (W265, W266, W268, W269, W270, W271), on
exactly the argument W200 made when it found a rule that had not weakened and a control that had
not followed the product.

## Q21 — cut the cost of yes (W261–W273)

Laid into `docs/FIVE-YEAR-PLAN.md` §5f with matching rows in `BUILD-STATE.md`. Four are marked
`[P]` and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W261 | Gate-readiness register: what the tree does the day each gate is answered |
| W262 | G1 first-connection rehearsal, with every credential still refused |
| W263 | The blocked-surface budget: a new blocked row must name its release |
| W264 | G5 sign-off rehearsal over synthetic pathway content |
| W265 | Erasure at five years, re-derived against every Y5 record class |
| W266 | What an access request returns, assembled from W106 |
| W267 | The register census: every self-checking register proved to notice |
| W268 | Latent findings at five years, re-evaluated from source |
| W269 | The synthetic fleet at five years |
| W270 | Operator copy at the Y6 boundary |
| W271 | Page reachability at five years |
| W272 | Q21 hardening |
| W273 | Quarter close: Q22 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Year 6.** Writing Q22–Q24 themes now would be the Year-1 error at four years'
  range, and W208 already recorded what that error costs: §6's "learned ranking second", written in
  Year 1, arrived in Year 5 in collision with a legal notice published in Year 4, and W217 has
  never moved.
- **It does not rank the outstanding decisions.** W257 declined to, because the two orders that
  fall out of its tables — by units released and by how long they have waited — disagree. Nothing
  here changes that, and choosing between them is the founder's call.
- **It does not propose an eleventh gate.** Q21 crosses none, so none is needed.
- **It does not re-price any gate.** `GATE-DOSSIER-Y5.md` and the quarter dossiers do that and are
  unchanged.
- **It does not recommend stopping.** The loop should keep building whatever needs no ruling. The
  rule's requirement is that each expansion *state the position*, so "nobody has ruled" is visible
  in the plan rather than only to whoever opens the dossier.

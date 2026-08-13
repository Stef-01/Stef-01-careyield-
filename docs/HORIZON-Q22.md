# W273 — Q22 horizon (2026-08-13)

The first expansion under the horizon rule §6 wrote at W260. That rule has six requirements and
this document exists because requirement 3 says the gate position is **re-read and recorded at
every expansion** — so the preconditions are evaluated here, in writing, **before a single Q22 unit
is written**, which is what W273's own verify gate demands.

Every count is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and pinned
row by row by `src/quality/horizon-q22.test.ts`. When the position changes this document goes red,
which is the signal to re-derive it.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W274–W286. No theme is written for Q23; W286 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below, plus `docs/HARDENING-Q21.md`, which is newer than both and is where this quarter's theme actually comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q22 adds no blocked row; every unit is buildable with no ruling. W263's check enforces it rather than this line promising it. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** The closing section states it in the document's own words rather than leaving it to be inferred from the unit list. |

## The gate position, re-read

The ledger holds **273 units** before this expansion and **286 after it**. **16 rows are blocked,
unchanged from W260's reading**, and this expansion adds none.

| Waiting on | Units | Which | Outstanding since |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 6 | W161, W162, W163, W186, W249, W251 | plan §4, day one |
| **G6** — public directory launch | 2 | W133, W185 | plan §4, day one |
| **G8** — third-party model processing | 2 | W146, W147 | proposed at W104 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | proposed at W208 |
| **G3** — live SMS to real patients | 1 | W174 | plan §4, day one |
| **Q17 decision** — may patients be ordered by anything a model learns | 1 | W217 | raised at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and one quarter in. They remain the four that
stand between this tree and a single real patient being helped.

**Decisions on this page the loop may take: zero.** Unchanged for five years and one quarter. The
rule requires this restated at every expansion and it is restated here.

## Where Q22's theme comes from

`AUDIT-Y5.md` records that most of Year 5's defects were caught by the tree rather than by an
audit, and states the discomfort that follows: *a tree whose registers catch its own defects makes
a self-reviewing auditor look effective, and the two are not the same thing.* Q21 answered the
first half of that — W267 proved each register would notice by moving the tree under it.

**`HARDENING-Q21.md` answered the second half, and not in the direction anybody would have
guessed.** Q21 built eleven units, nine of them registers, rehearsals or sweeps. Those nine reviewed
clean. **The one unit that touched a surface an operator actually sees carried the high-severity
finding**, and two of the other four findings are about the same boundary:

- **Finding 1 (high)** — the access export was rendered unscoped to a practice's staff, disclosing
  another practice's clinician narrative. The unscoped derivation was right; the reader was not.
- **Finding 4 (medium)** — the demo rail belonged to `prac-demo` while the console mints `prac-1`,
  so every practice-scoped page read an empty rail and **the only page showing the seeded data was
  the unscoped one**. The incoherence and the defect held each other up.
- **Finding 5 (medium, accepted)** — `pnpm verify` is typecheck, test, build and audit:gate and
  **does not run Playwright**, so the only control that exercises a rendered page is the one a green
  build excludes. A red e2e has been invisible to every unit this quarter.

Three findings, one boundary. The registers are healthy and **the rendered surface is not checked
the way the modules are**. W200 already says so about itself, in its own header: its known bound is
that prose composed inline inside a render function is not reachable by export name, "until a later
unit lints rendered output against fixtures". That unit has never been written.

So: **Q22 — the rendered surface.** Every unit checks what a person actually sees, or wires an
existing control to reach it. Nothing here needs a ruling; nothing here adds a blocked row.

The quarter also closes three of the four open latent findings W268 re-anchored, because each is a
defect at the same boundary — a read that matches on a clinician id with no practice in the query
(TENANCY-1), a module that can ship with no unit header and escape the copy census (CENSUS-1), and
a ranker whose ordering is watched by reading a source comparison rather than its behaviour
(MATCH-1).

## Q22 — the rendered surface (W274–W286)

Laid into `docs/FIVE-YEAR-PLAN.md` §5g with matching rows in `BUILD-STATE.md`. Five are marked
`[P]` and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W274 | `/finder`'s vacuity guard, decided and recorded |
| W275 | The rendered surface enters the verify gate |
| W276 | Fixture coherence: every seeded store against a practice a session can act for |
| W277 | Two tenants, or it is not a scoping test |
| W278 | Copy composed inside a render function — W200's stated known bound, closed |
| W279 | Every console route's zero state, declared and distinguished |
| W280 | TENANCY-1 closed: the read that matches a clinician with no practice in the query |
| W281 | CENSUS-1 closed: every module carries its unit header, checked at the door |
| W282 | W267's unproven walks: a batch given roots and proved by mutation |
| W283 | MATCH-1 re-anchored: the ranker's ordering read from behaviour, not from source |
| W284 | Route coverage: every declared route exercised by the page suite, or refused in writing |
| W285 | Q22 hardening |
| W286 | Quarter close: Q23 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Q23 or Year 7.** Requirement 1, and W208's receipt for why: a theme written
  four years early arrived in Year 5 colliding with a legal notice published in Year 4.
- **It does not rank the outstanding decisions.** W257 declined, because the two orders that fall
  out of its tables disagree, and nothing since has changed that. It is the founder's call.
- **It does not propose an eleventh gate.** Q22 crosses none.
- **It does not re-price any gate.** The dossiers do that and are unchanged.
- **It does not treat finding 5's acceptance as settled by W275.** W275 wires the page suite into
  the gate; the acceptance in `HARDENING-Q21.md` carries a review date of 2026-11-13 and is closed
  by that review, not by this plan naming a unit.

## What the loop cannot do, stated plainly

It cannot answer any of the sixteen. It has proposed three gates in five years and none has been
ruled on. It can make the day a ruling lands cheaper — that was Q21 — and it can make sure the
thing a person eventually sees is checked as carefully as the modules behind it, which is Q22.

Neither is a substitute for a ruling, and this document is the place that is required to say so.

# W312 — Q25 horizon (2026-08-17)

The fourth expansion under the horizon rule §6. Its six requirements are evaluated here, in
writing, **before a single Q25 unit is written**, which is what W312's own verify gate demands.

Every figure is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and
pinned row by row by `src/quality/horizon-q25.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W313–W325. No theme is written for Q26; W325 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below, plus `src/quality/hardening-q24.ts`, which is newer than both and is where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q25 adds no blocked row. The count DID move since the last horizon, from 16 to 18, and §"The two rows that were always there" says why that is not growth. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **312 week-units** before this expansion and **325 after it**, of which **295 are
done** once this close lands. **18 rows are blocked**, which is the count over every row the ledger holds rather than
over the week-units alone — see below.

| Waiting on | Units | Which | Waited |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 8 | W161, W162, W163, W186, W249, W251, SUP-1, SUP-2 | 293 units, since the plan |
| **G6** — public directory launch | 2 | W133, W185 | 293 units, since the plan |
| **G8** — third-party model processing | 2 | W146, W147 | 191 units, proposed at W104 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | 142 units, proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | 98 units, proposed at W208 |
| **G3** — live SMS to real patients | 1 | W174 | 293 units, since the plan |
| **Q9 action 1** — the Ahpra advertising review ask | 1 | W133 | 163 units, reached at W132 |
| **Q17 action 1** — may patients be ordered by anything a model learns | 1 | W217 | 90 units, reached at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and four quarters in.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires
it restated at every expansion, and because four quarters of building have not moved it.

### The two rows that were always there

The blocked count reads 18 where the last three horizons read 16, and **no unit added a blocked
row**. W310 found that the ledger parse every register shared matched `^\| (W\d+) \|`, so `SUP-1`
and `SUP-2` — cohort-level and named-patient specialist review, blocked on **G5** since W89 — had
never been counted by W263's budget, named by a release path, or shown to anybody.

That is worth stating in a horizon document rather than a commit message, because the budget's
whole premise was that the number only goes up one correct decision at a time. It was right about
the direction and wrong about the number, for two years, and what found it was a page built to show
the founder what they were waiting on. **The largest single blocker is a third larger than the plan
has been saying.**

## Where Q25's theme comes from

Q24 set out to pay down what the control system costs to keep, and its own gate says it missed:
W308 re-ran W300's measurement and the tax had gone **up**, six to seven. The quarter's note is
explicit that the instrument was wrong rather than the work —

> The honest reading is that **the gate was the wrong instrument**, not that the work did not
> happen: counting the registers that report an undeclared module counts controls, and
> consolidating controls without removing any leaves that count where it was or raises it. **Naming
> a better instrument belongs to the quarter close.**

That sentence is addressed to this document, and Q25's first unit answers it. But it is not the
theme, because Q24's hardening found something larger and found it four separate times.

**Q24-CR-2 — a tautology shipped INTO the unit whose subject was assertions that check nothing.**
W304 replaced `toHaveLength(5)` with `expect(xs.map(f).length).toBe(xs.length)`, which is true for
every array that has ever existed, under a comment claiming to check the members by name. W288's
tautology sweep cannot see it: the two sides are not syntactically identical, and recognising them
needs to know that `map` preserves length.

**Q24-CR-3 — the fourth stale count in prose in two quarters.** A doc comment said *twenty-one
branches* over a list of fifty-seven. W293's header quoted figures its own broken sweep produced;
W296's described a stride two units after the stride was replaced; W303's counted four harnesses
where there were five. Every one passed every gate, because **no check in this tree reads a number
in a sentence**. W298 built a door for the cheap half — backticked identifiers in headers resolved
against the tree — and its own bound says it does not read counts and does not read past the
header. Both limits let this one through, and the second stale count in the very same file was
found by a re-derivation rather than by the reading that fixed the first.

**Q24-CR-5 and Q24-CR-9 — two fixes that reproduced the class they were fixing.** W310's remedy for a
silently-dropped ledger row required a trailing digit and silently dropped a different one. W308's
re-measurement asserted a live count EQUALS a frozen figure — the pinned-count class W304 had
removed four units earlier — and writing Q24's hardening record moved it. Neither author was
careless; both had just finished writing about the exact defect they then reproduced.

**And a fifth instance arrived while this document was being written.** W299's own horizon test
asserted `expect(PLAN).not.toContain("W313")` over the whole plan — a claim that holds exactly
until a quarter close does its job, and which reported W312 succeeding as W299 failing. Its section
slice ended at `## 6. Horizon rule`, which was the next heading only until something was expanded
between them. `horizon-q23.test.ts` had already been scoped for this reason and W291 had already
fixed the whole-plan form once; W299's comment claims that fix and applies half of it. So the close
of Q24 could not be written without first repairing the check Q24 wrote to describe itself.

And one process fact, which is not a finding against any unit because it is a property of how the
loop runs: **the verify gate runs before the ledger row is written.** Three consequences landed in
one session — W304's row lost its `[P]` prefix and `horizon-q24` caught it a firing later, W308's
`TAX_BOUND` went stale on its own close without its suite seeing it, and every unit was writing
`PENDING` into the SHA column and leaving an intermediate commit that failed W168. A check keyed to
a ledger row is blind to the unit that closes the row.

The common shape is not *the controls are expensive*. It is that **this tree checks its code and
not the claims it makes about its code** — prose, records, dispositions, the ledger row itself. A
register can be green while the paragraph above it is false, and four quarters of evidence say that
happens roughly once a unit — and that the checks written to describe a quarter can themselves
hold only until the next ordinary event.

So: **Q25 — the claims, not the code.** Every unit makes one class of unchecked claim checkable, or
retires it. The quarter's gate is deliberately **not** a single number this time, because Q24's was,
and the lesson taken from it is that counting controls measured the wrong thing: the gate
is that **every claim class named in this document is either driven or declared unprovable with its
reason**, and W324 re-reads the list rather than a total.

Nothing here needs a ruling; nothing adds a blocked row.

## Q25 — the claims, not the code (W313–W325)

Laid into `docs/FIVE-YEAR-PLAN.md` §5j with matching rows in `BUILD-STATE.md`. Six are marked `[P]`
and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W313 | A better instrument for the declaration tax — what an author edits, not what reports |
| W314 | Numbers in prose, resolved against the tree |
| W315 | The gate that ran before the row: closing the ledger inside the verified state |
| W316 | Length-preserving operations: the tautology class W288 cannot see |
| W317 | A remedy that reproduces its own defect, made visible |
| W318 | Every disposition on a clock, deferrals included |
| W319 | The blocked surface reachable from one place, both directions |
| W320 | Module headers derived from what the module exports |
| W321 | The demo path's second scenario: a practice that refuses |
| W322 | The founder's page, second reading: what changed since last time |
| W323 | Assertion vocabulary: one way to say a list is non-empty |
| W324 | The claim classes re-read — this quarter's gate |
| W325 | Quarter close: Q26 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Q26 or Year 7.** Requirement 1, and W208's receipt for the cost of planning
  four years ahead.
- **It does not set a numeric gate.** Q24's was a number, the number moved the wrong way, and the
  quarter's own note says the instrument rather than the work was wrong. Repeating the shape and
  hoping for a better reading would be the error W260 wrote the horizon rule to stop —
  counting controls measured the wrong thing, and a kinder number would measure it no better.
- **It does not claim Q24 failed.** It missed its stated gate and produced eleven hardening
  findings, eight of them fixed in the quarter that found them, plus the manifest, the citation
  resolver, one scan discipline, one planting harness, and the first page in three years that
  tells the founder what they are holding up. A quarter that names its own instrument as wrong is
  more useful than one that quietly picks a kinder one.
- **It does not propose an eleventh gate.** Q25 crosses none.
- **It does not rank the outstanding decisions.** W257 declined; the two orders that fall out of
  its tables disagree, and it is the founder's call.

## What the loop cannot do, stated plainly

It cannot answer any of the eighteen. Three gates proposed in five years, none ruled on. Four
quarters of work since the last horizon have moved the blocked count only by discovering two rows
that were already there.

And the fact underneath has not changed: **G1, G2, G4 and G7 block nothing, and they are what stand
between this tree and a patient.** Five years and four quarters produced a verified product and no
user. W309's demo path and W310's founder page were the closest the loop could get on its own; W321
and W322 extend them by exactly as much as can be extended without a ruling — a second scenario on
synthetic data, and a page that says what has changed since the founder last looked. Neither sends
anything to anybody.

That remains the founder's move. The plan says so here, for the fourth quarter running.

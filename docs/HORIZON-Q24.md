# W299 — Q24 horizon (2026-08-17)

The third expansion under the horizon rule §6. Its six requirements are evaluated here, in writing,
**before a single Q24 unit is written**, which is what W299's own verify gate demands.

Every count is derived from `BUILD-STATE.md` and the plan's §4 at the moment of writing, and pinned
row by row by `src/quality/horizon-q24.test.ts`.

## The rule's preconditions, evaluated one at a time

| # | Requirement | Evaluated |
| --- | --- | --- |
| 1 | One quarter at a time, never a year | **Met.** Thirteen units, W300–W312. No theme is written for Q25; W312 expands it when it arrives. |
| 2 | Derived from the last audit and the last gate dossier | **Met.** `docs/AUDIT-Y5.md` and `docs/GATE-DOSSIER-Y5.md`, cited below, plus `src/quality/hardening-q23.ts`, which is newer than both and is where the theme comes from. |
| 3 | The gate position re-read and recorded | **Met.** The table below, including the number the loop may answer. |
| 4 | No growth of the blocked surface without saying so | **Met, and the growth is zero.** Q24 adds no blocked row; every unit is buildable with no ruling. W263's check enforces it. |
| 5 | Founder gates inherited, never expanded away | **Met.** §4 is untouched; `plan-ledger` checks that every gate a blocked row names is defined there. |
| 6 | The loop keeps building what needs no ruling, and says what it cannot do | **Met.** Stated in the closing section, in the document's own words. |

## The gate position, re-read

The ledger holds **299 units** before this expansion and **312 after it**. **16 rows are blocked,
unchanged from W260's, W273's and W286's readings**, and this expansion adds none.

| Waiting on | Units | Which | Outstanding since |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 6 | W161, W162, W163, W186, W249, W251 | plan §4, day one |
| **G6** — public directory launch | 2 | W133, W185 | plan §4, day one |
| **G8** — third-party model processing | 2 | W146, W147 | proposed at W104 |
| **G9** — third-party organisational reporting | 2 | W202, W203 | proposed at W156 |
| **G10** — payer and insurer data flows | 2 | W240, W241 | proposed at W208 |
| **G3** — live SMS to real patients | 1 | W174 | plan §4, day one |
| **Q17 decision** — may patients be ordered by anything a model learns | 1 | W217 | raised at W216 |

**G1, G2, G4 and G7 still block nothing**, five years and three quarters in.

**Decisions on this page the loop may take: zero.** Unchanged. Restated because the rule requires
it restated at every expansion, and because three quarters of building have not moved it.

## Where Q24's theme comes from

Q23 set out to find the checks that cannot fail, and it did — twelve registers in eleven units,
each asking one layer further down whether a control notices anything. The quarter's own hardening
pass then read all eleven and produced four findings, none of which is a bug in the ordinary sense.
Two of them are about **what the control system now costs to keep**:

> **Q23-CR-2 — fifteen pinned counts moved in this quarter on ordinary additions.** Four were moved
> by the hardening unit itself, simply by adding one module to two registers.
> `expect(Object.keys(ASSERTION_DRIVES)).toHaveLength(N)` was bumped three times in one afternoon,
> twice while a push was rebasing. *"The individual bumps are each defensible; the pattern is the
> finding … the edit is indistinguishable from maintenance, so a count that moved because a
> register was DELETED looks exactly like one that moved because a register was added."*

> **Q23-SIMP-1 — one citation format, implemented five times.** The quarter invented
> `<file> :: <assertion>` and it is now load-bearing across seven registers, because it is how this
> tree stops a citation reading as coverage. Nobody wrote it once.

And a third fact, which is not in the hardening register because it is not a defect in any one
unit: **adding a single module to `src/` now requires declaring it in six other registers** —
W200's copy surface and its namespace loader, W267's census with a walk proof and an assertion
proof, W278's composed-copy sites, W289's drives, W292's negative probes, W294's acceptances,
W295's blind spots. Every one of those declarations is individually right. Together they are a tax
on writing anything at all, and the tax is paid in the one currency this tree cannot afford: a
builder who gets one of them wrong ships a register nothing watches.

W295 produced the sharpest version of the same problem. Narrowing three text scans to stop them
matching their own fixtures **hid four real registers**, because a `/` in a prose comment reads as
opening a regex. The narrowing was reverted and the fixtures were contorted instead. That is the
right call for one unit and the wrong shape for a tree: the same scan discipline is now written
four different ways, and each copy has its own way of being wrong.

So: **Q24 — the cost of the controls.** The registers stay; what changes is that the tree stops
paying for them twelve times over. Every unit removes a duplicated mechanism, a repeated
declaration or a class of pinned count, and the quarter's own gate is **measured**: W300 records
what adding one module costs today, and W308 re-derives the same measurement at the end. A quarter
that made the tree feel tidier without moving that number would have failed.

Nothing here needs a ruling; nothing adds a blocked row.

### W308 measured it, and the quarter missed its own gate

Re-run unchanged at the end: same plant, same probes, same function. What one new module costs, in
registers that report it undeclared —

| Shape | W300 | W308 |
| --- | --- | --- |
| plain | 1 | 1 |
| walks_the_tree | 3 | 4 |
| states_a_bound | 2 | 3 |
| reports_violations | 2 | 3 |
| a_full_register | 6 | 7 |

**It went up.** Every shape carrying a property some register watches moved by exactly one, because
W305's manifest reports a module it has not heard of and is itself a register that reports; `plain`
carries nothing to be heard about and did not move. The paragraph above said a quarter that failed
to move this number would have failed, and the number moved the wrong way.

What the quarter did instead is real and is a **different number**: an author declaring a full
register now edits one file fewer, because the census row and the refusal branches share a row in
one file. That is re-derived in `consolidationDefects` rather than taken from the note claiming it —
the manifest holds the declaration and the two files it replaced no longer do.

The honest reading is that **the gate was the wrong instrument**, not that the work did not happen:
counting the registers that report an undeclared module counts controls, and consolidating controls
without removing any leaves that count where it was or raises it. Naming a better instrument belongs
to the quarter close. A gate rewritten by the unit it judges is not a gate.

The quarter also carries the two findings Q23's hardening deferred rather than hid: **CR-1**,
where W297's `stillOpen` predicates close over a module-scope `process.cwd()` — W267's structural
defect, inside the quarter that named it, in its last register — and **SIMP-1** above. W301 and
W306 close them, so they are paid off in the quarter after the one that recorded them.

## Q24 — the cost of the controls (W300–W312)

Laid into `docs/FIVE-YEAR-PLAN.md` §5i with matching rows in `BUILD-STATE.md`. Six are marked `[P]`
and can run in parallel with a sibling session.

| Unit | What |
| --- | --- |
| W300 | The declaration tax, measured: what one new module costs today |
| W301 | The citation resolver, written once and the copies retired |
| W302 | One text-scan discipline: comments, literals, and the reversion W295 had to make |
| W303 | One planting harness for every register that plants |
| W304 | Counts as properties: the pinned-count class removed at its source |
| W305 | The register manifest: one declaration point per module |
| W306 | Bounds provable in their lifted state — Q23-CR-1 closed |
| W307 | The self-referential scan, solved once rather than avoided five times |
| W308 | The declaration tax re-measured against W300, which is this quarter's gate |
| W309 | The demo path end to end on synthetic data |
| W310 | The founder's page: what exists, what is blocked, what one ruling releases |
| W311 | Q24 hardening |
| W312 | Quarter close: Q25 expansion under the horizon rule |

## What this document deliberately does not do

- **It does not plan Q25 or Year 7.** Requirement 1, and W208's receipt for the cost of planning
  four years ahead.
- **It does not delete a register to reduce the tax.** The registers caught real defects all
  quarter, including in the units writing them. What is being paid down is the number of PLACES
  each one has to be told about, not the number of questions asked.
- **It does not rank the outstanding decisions.** W257 declined; the two orders that fall out of
  its tables disagree, and it is the founder's call.
- **It does not propose an eleventh gate.** Q24 crosses none.
- **It does not claim Q23's theme failed.** The quarter did what it set out to do and the receipts
  are unusually direct: a bound refuted by its own plant on the first run, a review date nothing
  had compared to a clock in five registers, three stated totals wrong on the day they were read,
  and a citation format that stops a claim reading as coverage. The theme succeeded and produced a
  bill, which is what a quarter derived from evidence is supposed to do.

## What the loop cannot do, stated plainly

It cannot answer any of the sixteen. Three gates proposed in five years, none ruled on. Three
quarters of work since the last horizon have moved the blocked count by zero, which is the number
this section exists to keep visible.

And the fact underneath it has not changed either: **G1, G2, G4 and G7 block nothing, and they are
what stand between this tree and a patient.** Five years produced a verified product and no user.
W309 and W310 are the closest the loop can get on its own — a demo path that runs end to end on
synthetic data, and a page that says what exists, what is blocked, and what a single ruling would
release. Neither sends anything to anybody. That remains the founder's move, and the plan says so
here rather than in a dossier nobody asked for.

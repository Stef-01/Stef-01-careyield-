# W256 — Five-year full-system audit (2026-08-13)

Review of the whole tree at the close of Year 5, run by `builder-A`. Scope is the W51 method:
**the whole tree, not a diff.**

**This audit is not independent, and the number says so rather than the adjective.** Of the
completed units in the ledger, `builder-A` wrote a shade over half, and of Year 5's completed
units, roughly half again. Both figures are read off `BUILD-STATE.md` by this audit's own test
rather than typed here, because a reviewer's claim about their own independence is the last claim
to take on trust. **Self-review is the weakest form**, so the method leans on sweeps that
*execute* and on hunting known bug classes, not on rereading code the author already believes is
correct.

**Every sweep is re-run from source and none is carried from `AUDIT-Y4.md`.** That is the gate's
own instruction, and it is a claim about method that a document cannot keep — so the sweeps live
in `src/quality/audit-y5.test.ts` and run on every build. W206 described its sweeps in prose and
ran them by hand; the numbers were right on the day, and nothing stopped them being carried
forward by somebody who trusted the previous audit.

## Verdict

**Year 5 is sound, with one low-severity finding found and fixed.** Gate green at HEAD:
typecheck, build and `audit:gate` clean, with the full suite passing. No founder gate is
unenforced. **Twenty-one `SHIPPED_*` registries were found by walking the tree** — W206 counted
thirteen, and the seven that arrived in Year 5 are exactly why this is a walk rather than a number
carried forward.

## Finding

### Y5-1 — LOW: an assertion that could not fail — FIXED

`src/capacity/backtest.test.ts` asserted `score.meanWidthOfSlots >= 0` and nothing else about it.
The field is a **mean of non-negative widths**, so that assertion can never fail: it reads as
coverage and checks nothing.

The half that matters is the upper one. `meanWidthOfSlots` is a *fraction of the slots offered*,
and `renderScore` multiplies it by 100 — so a value above 1 would print a forecast range wider
than the whole session, as a percentage over 100, on a page a practice manager reads. The bound
that could catch that was the one missing.

**Fixed** by closing the pair. The sweep now requires every `toBeGreaterThanOrEqual(0)` in the
tree to be paired with an upper bound in the same test body, so this class cannot re-enter
quietly — the other four hits the sweep found are genuine bounds pairs (`[0,1]` rate checks) or
the idiomatic `indexOf(...) > -1` not-found check, and each was assessed rather than filtered out
by a pattern.

This is a small finding and it is the *right size* of finding for a year in which the tree's own
registers caught most things first — see below.

## What AUDIT-Y4 carried into Year 5, re-checked

- **PRIV-3's outstanding half is CLOSED.** `AUDIT-Y4` said its sweep did not reach
  `src/audit/store.ts`. W209 did: the module is declared in the store-reads register, every
  exported read either takes a practice or carries a written reason, and this audit checks that
  against **the register** rather than against last year's sentence.
- **The Ahpra advertising review** and **G9** remain outstanding. `docs/GATE-DOSSIER-Y5.md`
  prices them, along with the finding that four gates block no unit at all and are the four that
  matter.

## Confirmed clean, each re-derived by a sweep that runs

- **Founder gates.** Twenty-one `SHIPPED_*` registries, twenty empty. The one non-empty registry
  is `src/registers/escalation.ts`, whose triggers are operational — a free-text reply, a
  complaint, repeated non-attendance — every one with `conditionCode: null` and none stating
  advice. No G5 content ships.
- **Frozen clocks.** No hardcoded date comparison anywhere in `src/` or `app/`.
- **Credentials.** No credential-shaped literal anywhere in `src/`, `app/` or their tests, by
  W242's own scanner rather than a second one. W254 tripped that scanner with its own fixture
  mid-build, which is the evidence it reaches test files.
- **Error paths.** No patient marker in any API refusal, by W255's own scanner over the whole
  refusal union.
- **Focused tests.** None left anywhere, so a green run is a statement about the whole suite.
- **Registry completeness.** The seven both-directions registers all exist and all fired
  correctly during Year 5 — repeatedly, and against their own author.

## The thing worth recording about Year 5

**Most of this year's findings were caught by the tree rather than by an audit**, and several
were caught against the author in the same firing that wrote the defect. W167's fold register
found a same-day tie in W243 that would have let a store decide whether a record was disclosed.
W210's latent-finding register fired on W257 mid-build for the exact failure it was recorded
against two years earlier. W242's credential scanner caught W254's own fixture. W200's copy
surface and W201's decision register each rejected an over-declaration and each was right.

That is the difference between this audit and W206's. Last year's audit found a HIGH
cross-tenant defect that had been latent since Year 1. This year's found one weak assertion,
because the controls got to everything else first — and the controls got there because each was
built to read the tree rather than a list somebody maintained.

**The corollary is not comfortable and belongs here.** A tree whose registers catch its own
defects makes a self-reviewing auditor look effective, and the two are not the same thing. The
sweeps in this audit are mechanical precisely so that the part which does not depend on the
reviewer's judgement is the part that is doing the work.

## Method

Every sweep walks `src/` and `app/` from the root, tests included where the class can hide in a
test:

- every `SHIPPED_*` registry found by walking and its emptiness re-derived, rather than a count
  carried from the previous audit;
- every date literal used in a comparison, in shipped source;
- credential-shaped literals over the whole tree, via W242's scanner;
- patient markers over every API refusal, via W255's scanner;
- focused and skipped tests;
- unpaired non-negativity assertions across every test file — the sweep that produced Y5-1;
- the previous audit's carried items, re-checked against the registers that were supposed to
  close them rather than against the previous audit.

The finding was confirmed by reading what the field means before asserting a bound on it, and the
fix was confirmed non-vacuous by the sweep that now forbids the class.

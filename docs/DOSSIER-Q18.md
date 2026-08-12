# W232 — what a forecast implies operationally, priced

Q18 built a capacity model (W222), a range (W223), a score (W224), a recommendation (W225), a
copy linter (W226), a calendar (W227), a drift monitor (W228), a console (W229), a privacy pass
(W230) and a coupling that ships off (W231). Every one of those units asked "is this figure
honest?". **None of them asked what happens on the day a practice believes one.** This does.

## The finding, stated first: the coupling ships off, and the effect does not

W231 wired the forecast to invitation volume behind a control that is empty and unimported, and
was right to. But **a practice acting on a forecast changes how many people are contacted whether
or not that control exists**, because the invitation pool is sized from the diary:

```
batchSize(openSlots, config) = min(ceil(openSlots / expectedResponseRate), maxInvitesPerSession)
```

`expectedResponseRate` is `0.25` and `maxInvitesPerSession` is `40` (`DEFAULT_POOL_CONFIG`). So a
practice that reads "if you open 10 slots, 4 to 6 filled in the weeks on record" and opens six
more slots has, by that act alone, authorised **up to 24 more messages** — capped at 40 per
session, and with no code path in Q18 involved at all.

**W231's control governs the software's hand on the dial. The diary is the dial.** "Shipped off"
is an accurate statement about `src/capacity/coupling.ts` and not a statement about what a
forecast does once somebody reads it.

That is not an argument against building the forecast. It is the reason the next three sections
exist, because each of them is a consequence nobody has yet been told about.

## What changes, in the order a practice would notice

**1. More messages, immediately, with the existing guardrails as the only brake.** W16's monitors
are the practice's protection here: opt-out rate above 2%, generated-DNA rate above 10%, any open
complaint. Those are the right instruments and they are *lagging* — they report after the extra
contact has happened. A practice acting on a forecast is spending guardrail headroom it has not
been shown.

**2. The north-star figure absorbs the practice's own reaction.** W9 measures incrementality as
the invited arm's attendance rate above the holdout arm's. **The holdout arm is never messaged**,
so opening slots raises contact in the invited arm only, and the measured increment rises. The
product's figure caused the practice to act, and the action improves the product's headline
number. Nothing in W215's counterfactual is wrong — the holdout is still the only comparator —
but the quantity being measured has quietly changed from "does Meherr help?" to "does Meherr,
plus what a practice does after reading Meherr, help?".

This is worth stating precisely because it is not a bug anybody can point at. Every module
behaves as specified.

**3. The drift monitor cannot tell a practice-caused change from a real one.** W228 fires when
every recent week falls outside the frozen range in the same direction. Open six more slots and
the offerable count rises; unless demand rises with it, the fill *rate* falls, and W228 reports a
session that has "stopped describing itself" — a change the product's own figure caused.

W228's list of what to look at named the session's length, its clinician, the time it runs and
what the practice offers alongside it. **It did not name the one cause a reader of this page is
most likely to have created themselves.** W232 added that line; it is the only code change in
this unit and it is a one-line completion of an existing list, not a new position.

**4. Acting on the forecast and enabling W231's coupling pull in opposite directions.** Opening
slots increases the batch; the coupling reduces it, because it sizes from spare capacity at the
lowest recorded fill. A practice doing both gets an interaction nobody has modelled: the coupling
would shrink the batch on the basis of a fill rate recorded *before* the extra slots existed.
W231's own `REFUSED_COUPLINGS` refuses six ways of getting this wrong; this combination is not
one of them, because it is not something the module does — it is something two decisions do
together.

## What is already sound, so the founder is not asked to re-decide it

- **The coupling only ever sends fewer messages**, and W231 states the risk in those terms rather
  than as an efficiency win: a patient who would have been offered an appointment is not offered
  one. Six ways of doing it wrong are refused by name in `REFUSED_COUPLINGS`.
- **Nothing in Q18 can identify a patient**, by type rather than by scrubbing, and a capacity
  figure is invariant under erasure — W230, where the invariance is the privacy property because
  a figure that *moved* when somebody was erased would disclose the erasure.
- **No figure promises anything.** W226's linter forbids the future tense on every capacity
  surface, and W224 pairs coverage with range width so a forecaster that says "none to all of
  them" cannot present as accurate.
- **The recommendation holds nobody.** W225's `SessionOpening` has no field a person could
  occupy and `REFUSED_OPENING_FIELDS` states why each is refused.

## What is asked

1. **Decide whether a practice acting on a forecast is a disclosed consequence.** W201's register
   discloses decisions the *software* takes. Opening slots is the practice's decision, so it is
   correctly outside that register — but the practice is not currently told that acting on the
   page raises how many patients get messaged. One sentence on the capacity console would settle
   it, and the wording is a founder call because it is the first place this product would say
   "this page changes what we send".
   *Releases: nothing. Costs nothing. Unwritten for as long as nobody asks.*

2. **Rule on whether the north star should be reported with an "acted-on" caveat**, now that a
   practice reading a forecast can move it. The alternative — an arm that sees no capacity page —
   is a second experiment and a much bigger decision; naming it here is not proposing it.
   *Releases: nothing. Changes what W20's weekly report has to say.*

3. **Ratify or reject G9**, unchanged and carried from `docs/GATE-DOSSIER-Y4.md`. A capacity
   figure leaving the practice needs W218's floor, because a session with one offerable slot is a
   fact about one identifiable encounter. Nothing in Q18 discloses anything today.
   *Releases: W202, W203 — or closes them.*

4. **Decide whether W231's coupling may be enabled at all**, which is a live control now rather
   than a proposal: `ENABLED_COUPLINGS` is empty and nothing outside `src/capacity/` imports the
   module, both pinned. A practice enabling it records a reason at least 40 characters long and
   the forecaster's score at that moment is stamped, so the question "what did they know when
   they decided" is answerable later.
   *Releases: nothing. Turning it on is a practice decision the product already records.*

## What this dossier deliberately does not do

It does not re-price G9 — `docs/GATE-DOSSIER-Y4.md` does that and is unchanged. It does not
propose a capacity-page holdout arm; it names the option so that ask 2 is a real choice rather
than a rhetorical one. And it takes no position on whether practices *should* act on forecasts,
which is the question a product built to be read rather than obeyed should leave to them.

## Verification

The arithmetic here is derived from the tree, not from these units' own documents, and pinned by
`src/quality/dossier-q18.test.ts`: the pool constants, the emptiness of `ENABLED_COUPLINGS`, the
count of refused couplings, the number of Q18 modules classified in W106, and the fact that no
module outside `src/capacity/` imports the coupling. The claim about the drift monitor's list is
pinned against the list itself, so if the line W232 added is ever removed this document fails
with it.

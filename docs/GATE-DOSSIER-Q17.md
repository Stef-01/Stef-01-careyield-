# W216 — Q17 dossier: may the product order patients by anything a model learns?

One decision, priced. `docs/GATE-DOSSIER-Y4.md` does the arithmetic across every outstanding
founder decision; this one exists because Q17 raised a new one, and because the thing it raised
turned out to be already true rather than merely proposed.

**Q17 action 1 — may Meherr order patients by anything a model learns?** It has no gate number, for
the same reason Q9 action 1 has none: it is a product decision a build unit reached, not a
category of data leaving the tree. W207 found that the decision open longest had no number and was
therefore invisible to every sweep looking for `FOUNDER GATE G\d`; this one is recorded as
`FOUNDER DECISION — Q17 action 1` so that W168's widened ledger check can see it.

## The finding, stated first: the contradiction is already live

§6 of the plan wrote Q17 in Year 1 as *"matching optimisation (deterministic eligibility first,
learned ranking second)"*. The obvious reading is that a founder must decide whether to permit the
second half. That reading is too comfortable, and W214 is where it broke.

**`rankCandidates` already orders patients on a clinical attribute, in production, today.**
`src/engine/pool.ts` sorts the live invitation pool by `chronicCare` first, then by time since last
visit — a line whose own comment reads *"older date = longer overdue = first"*. It has done so
since W5.

**And W201's published ADM statement says the product does not do that.** Its *never automated*
list, live on `/privacy/automated-decisions`, reads:

> No ordering of patients by need or by how unwell they are, and no list of who is most at risk.
> Meherr decides who has an appointment offered to them, never who most needs one.

Those two statements cannot both be true. This is not a preference, a smell, or a thing to tidy in
a hardening week: **a published privacy notice describes the software inaccurately**, and it is the
document a regulator reads first — the same argument W102 made when it found the earlier version of
this page claiming Meherr did not process diagnoses.

Three things follow, and none of them is the loop's to decide.

**A decision about learned ranking cannot be taken without settling the live ranker first.** If the
answer is "no learned ranking", the notice is still wrong about `rankCandidates`. If the answer is
"yes", the notice needs rewriting anyway and the question becomes how far. There is no ruling that
leaves the current state consistent.

**W214 did not inherit the problem, and that was deliberate.** The new matcher cannot express an
ordering by need: W213's `MatchCandidate` has no field a clinical attribute could occupy, and
`candidateFrom` is a lossy projection that drops `chronicCare`, `activeRecall` and `lastAttendedAt`
before the matcher sees a patient. So the tree now contains one ordering that cannot be clinical
and one that is, and the second is the one in production.

**It is recorded where it will be noticed.** `MATCH-1` in W210's latent-finding register carries a
predicate that fires the day W214's matcher becomes a live path while `rankCandidates` still sorts
on a condition — so the build fails at the moment the two orderings would both be running, rather
than in an audit afterwards.

## What a ruling releases, and what it costs

| | |
|---|---|
| **Blocked units released** | **1** — W217 (learned ranking of patients) |
| **Units already built behind it** | W213's floor and W214's matcher, both shipped and neither dependent on the answer |
| **Cost if the answer is "yes"** | Rewriting a published legal notice; a new disclosure of what is learned and from what; and G7 re-derivation, because a ranking learned from response data is closer to the TGA line than one read from a practice's own flags |
| **Cost if the answer is "no"** | Changing `rankCandidates` so the live pool stops ordering on a clinical attribute, which changes who is invited first at every practice — and re-baselining the sim goldens that measure it |
| **Cost of not answering** | The notice stays inaccurate. That cost is being paid now and grows with every practice that reads it |

## Why this is close to G7 without being it

G7 keeps matching "keyed to clinician attributes, never symptom-based patient triage". A learned
ranker over patients is not symptom-based triage: it would learn from *response* data — who books
when offered — not from anything clinical. So it does not obviously cross G7.

It is close enough to be worth the founder's attention for a different reason. W200's first rail
property is that the product never selects a clinician, and the argument is that *an ordered list
for a clinical purpose is a recommendation about who is better*. Applied to patients, the same
argument says an ordered list of who should be offered care first is a recommendation about who
needs it more — whatever the model was trained on. The distinction between "learned from booking
behaviour" and "a judgement about need" is one the product would have to be able to defend to a
patient who asked why they were forty-second.

## What is asked

1. **Rule on Q17 action 1**: may the product order patients by anything a model learns?
   *Releases: W217.*
2. **Independently of that, settle the live ranker.** `rankCandidates` and the published notice
   disagree today. Either the ordering changes or the notice does. *Releases: nothing; stops a
   published notice being wrong.*

The loop takes no position on either, and W214 deliberately left the live ranker untouched rather
than resolve by implementation something that is a disclosure decision.

## Verification

Every count above is derived from `BUILD-STATE.md` and from the tree, not retyped, and pinned by
`src/quality/gate-dossier-q17.test.ts` in W207's shape — with the year-bound lesson W208 recorded,
so this document is scoped to Q17's rows and cannot be falsified by a later quarter.

The two claims that matter most are pinned against their sources rather than against prose: the
quotation from the ADM notice is checked against `NEVER_AUTOMATED` in
`src/privacy/automated-decisions.ts`, so a change to the published page fails this document; and
the claim about `rankCandidates` is checked against `src/engine/pool.ts`, so the day somebody
removes the clinical sort, the dossier stops being able to assert that it is there.

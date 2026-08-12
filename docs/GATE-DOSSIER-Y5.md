# W257 — Five-year gate dossier: every decision still outstanding, priced

W207 did this at the close of Year 4 and found that the tree's own labelling tracked neither
urgency nor cost. This does it at the close of Year 5, across ten gates and five years of build.
Nothing here re-argues a position a quarter dossier already recorded; where one settled something,
this points at it.

## The finding, stated first: four gates block no unit at all, and they are the four that matter

Sixteen ledger rows are blocked. Every one of them names G3, G5, G6, G8, G9, G10 or the Q17
learned-ranking decision. **G1, G2, G4 and G7 block nothing** — and a founder reading a
units-blocked table would put them last.

They are the four that stand between this tree and a single real patient being helped.

| Gate | Units blocked | What it actually gates |
| --- | --- | --- |
| **G1** — real PMS/booking credentials | **0** | Every connection in the product. W242 declares five credential slots and `loadCredential` refuses all of them; W253's API resolves a practice from a console session because there is no token to resolve one from. |
| **G2** — real patient data | **0** | Every figure in the tree. Each console, forecast, response graph and report describes a synthetic run, and each says so on its own surface. |
| **G4** — pilot go-live | **0** | Whether any of this is used. The pilot agreement and holdout consent design are written (W39, W65) and unsigned. |
| **G7** — TGA-regulated CDSS | **0** | The shape of the product rather than any unit. W200 and W259 re-derive its five properties; nothing is blocked on it because everything was built inside it. |

A gate that blocks nothing is not a gate that costs nothing. It is a gate whose cost is the whole
product being a demonstration — which is the correct posture for a tree with no ratified
credential, and is not a thing to discover by counting rows.

## Three gates have been PROPOSED and none has ever been answered

| Gate | Proposed at | Quarter | Units blocked | Answered? |
| --- | --- | --- | --- | --- |
| **G8** — third-party model processing | W104 | Y2 Q8 | 2 (W146, W147) | no |
| **G9** — third-party organisational reporting | W156 | Y3 Q12 | 2 (W202, W203) | no |
| **G10** — payer and insurer data flows | W208 | Y4 Q16 | 2 (W240, W241) | no |

**The loop has proposed a gate roughly once a year for three years and none has been ruled on.**
That is the pattern this document exists to put in front of somebody. Each proposal was made
because a quarter's work reached a boundary no existing gate covered, each was written to be
buildable behind, and each has since accumulated exactly two blocked units and a quarter dossier
arguing the trade. The mechanism is working; the answering is not.

Two of the three are also **double-blocked**, which W245 established and which changes what
ratifying them buys:

- Ratifying **G10** releases W240 and W241 *to be built* and releases no exchange with anybody,
  because the payer credential slot is blocked by G1 as well.
- Ratifying **G9** releases W202 and W203 to be built; the e-referral gateway slot is blocked by
  G1 as well.

So neither answer, on its own, moves a byte. **G1 is the gate under the other two**, and it blocks
no ledger row.

## Everything still outstanding, by units released

| Decision | Units blocked | Which | Open since |
| --- | --- | --- | --- |
| **G5** — clinical pathway content sign-off | 6 | W161, W162, W163, W186, W249, W251 | Y3 Q13 |
| **G6** — public directory launch | 2 | W133, W185 | Y2, via the Ahpra review ask |
| **G8** — third-party model processing (proposed) | 2 | W146, W147 | Y2 Q8 |
| **G9** — third-party organisational reporting (proposed) | 2 | W202, W203 | Y3 Q12 |
| **G10** — payer and insurer data flows (proposed) | 2 | W240, W241 | Y4 Q16 |
| **G3** — live SMS to real patients | 1 | W174 | Y1 |
| **Q17 action 1** — may patients be ordered by anything a model learns | 1 | W217 | Y5 Q17 |

**G5 has been the largest single blocker for three years and has grown**, from four units at W207
to six now: Y5's two vertical-content units (W249, W251) joined it, because W248 and W250 built
the assembly machinery and left the content where it belongs. That is the machinery working as
designed and it is also G5 costing more each year it stays shut.

**The Q17 decision is the only one that is not a gate**, and it is the only one whose answer could
require changing something already published — W201's ADM notice describes what the software
decides about a patient, and ordering patients by a learned model is not in it. W216 priced it and
took no position.

## What is already settled, so it is not re-asked

- **G0** is cleared. The repository exists and the tree lives in it.
- Every quarter dossier's asks that were about *this tree's* behaviour rather than a founder's
  ruling have been built: W232's capacity-console sentence, W234's five hardening findings, W245's
  cost-1 granularity question (left as a choice rather than fixed quietly).
- **No decision here is one the loop may take.** The plan says so of G10 in as many words — *the
  loop must not decide this itself* — and the same holds for the other nine.

## What this dossier deliberately does not do

It does not re-price G5, G6, G8 or G9 — `docs/GATE-DOSSIER-Y4.md` and the quarter dossiers do
that and are unchanged. It does not propose an eleventh gate. It does not rank the outstanding
decisions by importance, because the two orders that fall out of the tables above — by units
released and by how long they have waited — disagree, and choosing between them is the founder's
call rather than a document's.

## Verification

Every count and every unit id here is derived from `BUILD-STATE.md` and the plan's §4, never from
another dossier, and pinned **row by row** by `src/quality/gate-dossier-y5.test.ts`. That shape is
W207's, and it is W207's for a specific reason: its first version asserted that the document
"names every blocked unit somewhere", which stayed green when a whole row was deleted because the
unit was still mentioned in the prose. Each table row is now asserted against the ledger's own
attribution individually, and the zero-blocked table is asserted to be exactly the gates the
ledger never names.

# W245 — G10 priced: what ratifying it releases, what it costs, and what it does not cover

Q19 built a FHIR mapping (W235), an e-referral profile (W236), a conformance harness (W237), a
terminology binding (W238), a disclosure ledger (W239), a credentials posture (W242) and a
consent-to-disclose model (W243). Two units — **W240** (payer/insurer integration model) and
**W241** (payer claim-status read) — are blocked on a gate that does not exist yet. This prices
it.

G10 as proposed at W208, in the plan's own words:

> *No patient-linked data is exchanged with any payer or insurer until the founder has signed off
> the counterparty, the direction of flow, the minimum data set, and the patient's own consent to
> that specific exchange.*

## The finding, stated first: ratifying G10 turns nothing on

The payer credential slot is blocked **twice**. `CREDENTIAL_SLOTS` records `blockedBy: ["G1",
"G10"]` for `payer_api`, and W242 built the register that way deliberately — *"a register holding
only the first would show the slot opening the day the other was ratified, which is the more
dangerous direction to be wrong in."*

So the honest statement of what a G10 ratification buys is narrower than it sounds:

- **It releases W240 and W241 to be BUILT.** Two ledger rows move from `blocked` to `available`.
- **It releases no exchange with anybody.** A live payer integration needs G1 as well (the
  credential) and G2 as well (real patient data). G10 is necessary and is not sufficient, and it
  is the only one of the three that is not already blocking every other integration in the tree.

A founder asked to ratify G10 should not be asked under the impression that it connects this
product to a payer. It permits the model to be written. **Three gates stand between the model and
a byte leaving the building, and G10 is one of them.**

## What it costs, in the order it would bite

**1. The consent model's granularity is one level coarser than G10's own wording.** This is the
sharpest cost and it was found by reading W243 against the proposed gate rather than against the
ledger row that commissioned it. G10 asks the founder to sign off *the counterparty*, and asks for
*the patient's own consent to that specific exchange*. W243's `ConsentScope` names a
`recipientClass` — one of four — and `payer_or_insurer` is one value. W239's `Disclosure` carries
a `recipientName`; **the consent does not.**

Concretely: under the model as built today, a patient who agrees their claim data may go to a
payer has agreed it may go to *any* payer. Nothing is wrong in W243 — the class is what makes a
ledger answerable in aggregate, which is W239's argument for it — but the gate's wording asks for
a promise the consent model cannot currently make. Ratifying G10 without closing this means
ratifying a gate whose fourth condition is only satisfied at class granularity.

*Cost to close: one required field on `ConsentScope`, one mismatch reason, and the tie-break and
sweep tests re-run. It is small, and it is not something to discover after the first payer
conversation.*

**2. A read is a disclosure, and W241 is a read.** "Claim status" sounds like receiving rather
than sending, which is exactly why it is worth stating: asking a payer about a patient's claim
requires telling the payer which patient is being asked about. Every protection Q19 built for
outbound flow — W243's consent gate, W239's ledger, W236's refusal to compose clinical prose —
applies to W241 in full, and a unit framed as a read invites building it as though none of them do.

**3. A payer has an interest in whether the care happens, and the tree already holds the figure
that would tell it.** This is the difference the plan names between G9 and G10, made concrete:
W201's holdout arm records which patients a practice deliberately does not message, and utilisation
follows from it. That field is **already refused for export** — W235 puts `holdout` and
`holdoutRate` in `REFUSED_MAPPINGS` with a `wouldBecome` column — so this is a cost that has been
paid rather than one being incurred. It is listed here so that the founder knows the refusal exists
before somebody proposes an extension to satisfy a payer's schema.

**4. The vocabulary for payers already exists in three registers, and that is correct rather than
alarming — but it should not be mistaken for readiness.** `payer_or_insurer` is a declared
`RecipientClass` in W239, `payer_api` is a declared slot in W242, and G10 is named in both. Each
was declared *before* the gate on purpose, so a register could see the case it does not yet permit.
The consequence is that ratifying G10 does not require three new registers; it requires filling
slots that are already shaped. That makes the ratification cheaper to act on and easier to act on
by accident.

## What is already sound, so the founder is not asked to re-decide it

- **Nothing can be sent.** `SHIPPED_CREDENTIALS` is empty, and the emptiness is a consequence:
  `loadCredential` returns `gate_not_ratified` for a perfectly well-formed secret, before the value
  is looked at, so filling the list would change nothing.
- **Nothing has been sent.** `SHIPPED_DISCLOSURES` is empty and pinned, and there is no transport,
  recipient allowlist or delivery adapter anywhere in `src/interop/`.
- **Consent cannot be manufactured.** W243 refuses eight named routes, the first being reuse of
  this tree's own `patient.smsConsent`, and no elapsed time moves a verdict towards `given`.
- **The ledger is evidence, never permission.** A gap in it cannot authorise anything, because
  nothing reads it to decide whether to send.
- **No clinical text is composed at any boundary.** G7's fourth property was re-derived at the
  e-referral profile rather than carried forward, over a rendered document string by string.
- **No code is guessed.** W238's catalogue ships empty; an unbound code is refused and the refusal
  names it.

## What is asked

1. **Ratify or reject G10.** *Releases: W240 and W241, to be built. Releases no exchange — the
   payer slot stays blocked by G1, and real patient data stays blocked by G2.*

2. **If ratifying, rule on whether consent must name the counterparty or may name the class.**
   This is cost 1, and it is a real choice rather than a defect to fix quietly: per-counterparty
   consent is what G10's wording says and means a patient re-consents when a practice changes
   payer; per-class consent is what the model does today and is what makes the ledger answerable
   in aggregate. *Releases: nothing. Costs one field on `ConsentScope` and a re-run of W243's
   suite, if the answer is counterparty.*

3. **Confirm that W241's claim-status read is understood as a disclosure**, so that it is built
   behind W243's consent gate rather than beside it. *Releases: nothing. Costs nothing now; costs
   a rebuild if discovered later.*

4. **Ratify or reject G9**, carried unchanged from `docs/GATE-DOSSIER-Y4.md` and `DOSSIER-Q18.md`.
   It is named here only because the e-referral gateway slot is blocked by G1 and G9 the way the
   payer slot is blocked by G1 and G10, and a founder ruling on one double-blocked slot should see
   the other. *Releases: W202, W203 — or closes them.*

## What this dossier deliberately does not do

It does not decide G10. The plan's own instruction on the proposal is explicit — *the loop must
not decide this itself* — and this document exists to make the decision cheaper, not to pre-empt
it. It does not re-price G1, G2 or G9. It does not propose per-counterparty consent; it states the
gap between the gate's wording and the model's granularity and leaves the choice at ask 2. And it
takes no view on whether payer integration is worth building, which is a commercial question this
document has no standing on.

## Verification

Every count and claim here is re-derived from source by `src/quality/dossier-q19.test.ts`, never
from the Q19 units' own documents — W207's distinction, because a dossier that quotes the modules
it prices is a dossier that agrees with itself. Pinned: the two G10-blocked ledger rows; the payer
slot's two blockers and the e-referral slot's two; `payer_or_insurer` as a declared recipient
class; the **absence** of `recipientName` from `ConsentScope`, so that closing cost 1 fails this
document until it is rewritten; the emptiness of the credential, disclosure and terminology
catalogues; the loader refusing a well-formed secret; and `holdout` and `holdoutRate` sitting in
W235's refused mappings.

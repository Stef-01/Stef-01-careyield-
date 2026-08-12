# Q19 hardening — the interop boundary reviewed (W247)

Q19 built eight modules that sit where data would leave this tree. None of them can send anything
— G1 blocks every credential (W242) and G9 blocks every disclosure — so this review is of the
shape of the boundary rather than of a running system. That is the useful time to do it: the
classification of an ambiguous failure and the derivation of a consent scope are not things to
argue about while a queue is backing up.

## How this was run, and what it could not do

The `security-review` skill's methodology was applied directly — repository context, comparative
analysis against the controls the tree already has, then per-module assessment on its
>80%-confidence bar — **without sub-agents**, because this session forbids the agent tool. What is
lost by that is parallel independent passes; what is kept is the method, and the two findings below
came out of it. `code-review`'s reuse-and-simplification lens was applied in the same pass.

The bound worth stating: there is **no live system** to test against, no fixture captured from a
real receiver (W237 says so in its own exports), and no credential to authenticate with. So this
review can find defects in what the tree would send and in how it would reason about the answer.
It cannot find a defect in how a real counterparty behaves.

## Modules reviewed

| Module | Verdict |
| --- | --- |
| `src/interop/fhir.ts` | No finding. The unmapped register is checked against the domain types in both directions; the emitted resources carry no consent state, no research arm and no `Condition`. |
| `src/interop/ereferral.ts` | No finding. Every string in a profile is a declared vocabulary member or byte-identical to a clinician's own words, checked over a rendered document rather than by reading the renderer. |
| `src/interop/conformance.ts` | No finding. Declares what a green run does not prove, which is the property most likely to be missing. |
| `src/interop/terminology.ts` | No finding. Codes carry provenance; an unbound code is refused and the refusal names it. |
| `src/interop/credentials.ts` | No finding. The loader refuses before reading the value, and no refusal echoes it. |
| `src/interop/disclosure-ledger.ts` | No finding. Classification re-derived below. |
| `src/interop/exchange-state.ts` | No finding. No path reports delivery without the recipient's own acknowledgement. |
| `src/interop/consent-to-disclose.ts` | **FINDING 1**, **FINDING 2**. |

## FINDING 1 — a consent could be checked against a scope that did not describe the disclosure

**Severity: high. Fixed in this unit.**

`authoriseDisclosure(disclosure, subjects, want, acts, asAtIso)` checked every subject's consent
against `want` and returned an `AuthorisedDisclosure` carrying `disclosure`. **Nothing compared the
two.**

`ConsentScope` and `Disclosure` carry the same four dimensions — practice, recipient class, kind,
period. So a caller who built `want` from a template, from a previous send, or from a constant
obtained a genuine, brand-carrying authorisation for a disclosure whose recipient, kind or period
nobody had agreed to. It passed every "is there a consent" check, and it carried a consent record,
**which is what made it look checked**. A payer bundle authorised under a consent for a referral to
another practice is exactly the shape G9 and G10 exist to prevent.

The module's own note says an authorisation applied to a different disclosure "is unrepresentable
here, because there is no authorisation that is not of a specific disclosure." The brand does bind
the authorisation to a disclosure. Nothing bound the **consent** to that disclosure, and the gap
was one argument wide.

Every test passed the same `WANT` constant next to a disclosure built to match, so the case was
never exercised.

**Fix: the scope is derived, not passed.** `scopeOfDisclosure(disclosure)` reads all four
dimensions off the disclosure and `authoriseDisclosure` takes four arguments instead of five.
Deriving rather than validating is the deliberate choice — a check somebody can skip by passing the
wrong thing is weaker than having nothing to pass. `REFUSED_CONSENT_SOURCES` gains an eighth entry
naming it, so the mistake is recorded rather than merely repaired.

## FINDING 2 — the refusal copy carries patient identifiers, and nothing stopped it travelling

**Severity: medium. Behaviour kept, control added.**

`AuthorisationRefused.copy` names the patients who have not consented. That is deliberate and W243
argues it: the practice already holds those identities, and "ask these three people" is the
actionable sentence where a count is dismissed. The review does not dispute it.

What was missing is that this is the **only string in Q19 that carries patient identifiers by
design**, and nothing structurally kept it away from a disclosure row — where W239's entire record
class rests on rows holding no patient. The two modules are one import apart and the copy is the
obvious thing to attach to a failed send.

**Fix: asserted rather than changed.** `hardening-q19.test.ts` pins that a rendered ledger row
contains no patient identifier, that the row type has nowhere to put the subjects or the copy, and
that the subjects live on the authorisation instead. The behaviour is right; what it lacked was
something holding it in place.

## The disclosure ledger's own W106 classification, re-derived

The gate names this specifically, and **re-derived** is the word — W221's rule, because re-reading
the register only confirms it agrees with itself.

Recomputed from the shipped `PAYLOAD_MODE`: in `fact_of_sending_only` a row holds a practice, a
recipient, a period, and a person **at the practice** who sent it. No patient identifier, so
`no_patient_identity` is correct and the module is correctly **absent** from the list of classes an
access request and an erasure must reach. Checked field by field against a real row rather than
against the sentence, and checked in the other direction too: under `figures_included` the class
becomes `stored` and the module joins that list. The classification is a consequence of the mode
rather than a coincidence that holds today.

## Considered and not raised

- **`as unknown as` on the branded types.** Eight modules do it; the brand is compile-time only by
  construction and the tree's `@ts-expect-error` test proves a caller cannot forge one. Not a
  defect, and reporting it would be reporting the idiom.
- **`danglingReferences` returns patient-shaped ids in its output.** True, and it is a dev-time
  harness with no production path. Below the bar.
- **`different_practice` looked unreachable** in `consentDecision`, since acts are pre-filtered by
  practice. It is reachable: the filter uses the act's recording practice and the mismatch uses the
  scope's disclosing practice, and those can differ. No change.
- **No rate limiting or transport hardening anywhere.** Out of scope by the review's own exclusions
  and by the absence of a transport.

## Result

**Zero criticals.** Two findings, both closed in this unit — one by removing a parameter, one by
pinning a behaviour that was correct and unheld.

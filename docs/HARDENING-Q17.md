# W221 — Q17 hardening

Q17 built the intervention-response graph, deterministic matching and the counterfactual floor
(W209–W220). This is the quarter's review pass. Both review skills were run; four findings came
from `code-review`, one from the security pass, and one from the unit's own gate — and the gate's
one is the reason the others were worth finding.

## The finding the gate produced: a published notice said something false

W221's gate says W201's ADM register must be **re-derived** against anything Q17 added, not
re-checked. Doing that turned up two things that a re-check would have missed.

**`src/matching/match.ts` was invisible to the register that exists to find it.** W214 decides
which patient is offered which appointment — as direct a per-patient automated decision as this
product contains — and W201's detector could not see it. The cause is worth recording because
**two controls were hiding something from each other**: W213 deliberately stopped the matcher
seeing a `Patient`, giving it a `MatchCandidate` with a `candidateRef` and nowhere to put a
clinical attribute, and that is precisely what makes "position never depends on need" structural.
The same decision took the module out of a detector keyed on `PatientId`. A privacy control
concealed a module from a transparency register.

Fixed by making the person-reference terms declared data — `PERSON_REFERENCE_TERMS`, three terms
each with the reason it counts — so a pseudonym for a person is added in the file whose job is
noticing people, rather than to a literal in a test.

**And `intervention-response-link` claimed "no page in the product shows it yet" when a page
does.** W220 shipped `/console/responses`, which reaches `src/outcomes/response.ts`. The decision
was declared `built_not_in_use`, and that sentence is published on
`/privacy/automated-decisions`. It has been corrected to `in_use` with copy that describes what a
practice can actually see.

That claim was unverifiable when it was written: the status check only ran against decisions with
a **content registry**, and skipped any decision whose dormancy rested on nothing being wired up.
Dormancy is now proved for those too, and the proof is the right question — **is it reachable from
a page?** — composed from W107's existing transitive walk rather than restated. A module imported
only by other dormant modules is still dormant, which is what the sentence actually claims.

## `code-review` findings, all four in W221's own diff

Worth listing because they were all in the fix, not in Q17, and three of them would have shipped a
control that looked green and checked nothing.

1. **The first dormancy proof matched only `from "@/x"`.** It certified
   `intervention-response-link` as dormant while three modules import it *relatively*. Superseded
   by the reachability walk above.
2. **The scan never left `src/` and never read `.tsx`** — so `app/`, the one place a module
   becomes *in use*, was outside it. Same fix.
3. **The bound comment said "the union of three scans" and enumerated two.** The wrong count, in
   the block whose stated job is stating the bound honestly.
4. **`PERSON_REFERENCE_TERMS` keys were interpolated into a `RegExp` unescaped**, in a register
   that explicitly invites future editors to add terms. Escaped.

## Security pass

No new attack surface in Q17. The quarter's modules are pure computation over in-memory synthetic
data: no network, no credentials, no deserialisation, no new external egress, and nothing that
reaches a real patient record. The one new route, `/console/responses`, is behind
`requirePractice()` and a per-practice `authorize(..., "view_dashboard")` check, and carries no
send control because G9 is unratified.

One finding, and it is a disclosure defect rather than a vulnerability:

**`/console/responses` rendered `Practice <id>` beside figures from the shared synthetic practice
and said nowhere that they were synthetic.** `/console/dashboard` labels its own sim figures
"simulated weeks · synthetic patients"; this page did not, so a practice manager saw numbers
attributed to their own practice *by name* that were not their practice's numbers. A true count
under a false frame is what W196 and W205 both refuse, and naming a practice beside it makes it
worse rather than better. Fixed by rendering `RESPONSE_CONSOLE_COPY.syntheticBasis` — kept in the
copy register rather than the page's JSX, so W200's linter reaches it.

## An exported predicate with a side effect

`fired()` in W210's register calls `resetStore()` through TENANCY-1's trigger, because the store
exposes no way to read a pristine seed without resetting the global. Narrow today — nothing outside
that module's test calls it — but an exported predicate with an undocumented effect on shared state
is the shape that becomes a defect the moment somebody composes it, which is what the register is
for. Now specified in the trigger and pinned by a test, so it is a contract rather than a surprise.

## Registers Q17 added, and how each is checked

| Register | Checked |
|---|---|
| `STORE_READS` (W209) | Both directions against every exported store read |
| `LATENT_FINDINGS` (W210) | **Hand-kept by declaration.** No mechanical detector exists for "a comment that files something for later"; the bound is stated in the module |
| `RESPONSE_KINDS` (W211) | `Record` over the kind union — exhaustive by type |
| `SPINE_RESPONSE_KINDS` / `SPINE_NOT_RESPONSES` (W212) | Both directions against the spine kinds the sim emits |
| `MATCH_REASON_COPY` (W213) | `Record` over the reason union — exhaustive by type |
| `REASONS_THIS_MATCHER_PRODUCES` (W214) | Both directions against W213's union |
| `ALL_COMPARATORS` (W215) | One-member union, asserted by value |
| `CELL_SUPPRESSION_COPY` (W218) | `Record` over the reason union — exhaustive by type |
| `REFUSED_SCOPES` (W219) | Exact key set asserted; no tree-derived counterpart exists, and that is stated |
| `RESPONSE_CONSOLE_COPY` / `EMPTY_READING_COPY` (W220) | `Record` over the reading union — exhaustive by type |

## Carried into Q18

- **MATCH-1 stays open.** `rankCandidates` orders the live pool on a clinical attribute and the
  published notice says it does not. Priced in `docs/GATE-DOSSIER-Q17.md`; the founder decides.
- **W201's detector remains a union of heuristics**, now with the bound honestly counted. The next
  pseudonym for a person will hide a module again unless it is added to
  `PERSON_REFERENCE_TERMS` — which is a habit, not a control, and is stated as one.
- **The greedy matcher is not the maximum matching** (W214), stated rather than assumed.

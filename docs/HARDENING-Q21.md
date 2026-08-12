# Q21 hardening — the quarter that built controls, reviewed (W272)

Q21 built almost nothing a practice will ever see. Eleven units, ten new modules, and nine of them
are registers, rehearsals or sweeps: what happens on the day a gate is answered, the first
connection driven while every credential is refused, the two-person sign-off driven on content that
means nothing, every tree-walking register enumerated, every route and what it can reach, the Y5
surfaces run at fleet scale. The one unit that touched what an operator sees — W266, the access
request assembled from W106 — is where the finding is.

That is not a coincidence and it is worth saying at the top: **a quarter of controls reviews
cleanly, and the one change to a real surface carried a high-severity defect.** Controls are
written by someone thinking about failure. Features are written by someone thinking about the
feature.

## How this was run, and what it could not do

The `security-review` skill's methodology was applied directly — repository context, comparative
analysis against the controls the tree already has, then per-module assessment on its
>80%-confidence bar — **without sub-agents**, because this session forbids the agent tool. What is
lost is parallel independent passes; what is kept is the method. `code-review`'s reuse-and-
simplification lens and `simplify` were applied in the same pass over the same diff.

The diff reviewed is `f154356..HEAD` — W261 through W271, 33 files, ~5,500 lines.

The bound worth stating: **there is still no live system and no real record.** Every founder gate
that would produce one is unratified. So this review can find defects in what the tree would do and
in how it reasons about what it holds. It cannot find a defect in how a real practice's data
behaves, because none has ever been here.

## Modules reviewed

| Module | Unit | Verdict |
| --- | --- | --- |
| `src/quality/gate-readiness.ts` | W261 | No finding. Every step resolves to a file that exists, checked both ways. |
| `src/quality/g1-rehearsal.ts` | W262 | No finding. The switch is read before and after the walk and no fixture is credential-shaped. |
| `src/quality/g5-rehearsal.ts` | W264 | No finding. Mints a `UsablePathway` by design; the catalogue stays empty, the registry is untouched, and the brand is never returned. |
| `src/privacy/erasure-y5.ts` | W265 | No finding. Every `stored` class is reached by the scrub, both directions. |
| `src/privacy/access-y5.ts` | W266 | No finding in the register itself. |
| `src/privacy/store.ts` (`exportForPatient`) | W266 | **FINDING 1.** |
| `src/referrals/store.ts` | W265/W266 | No finding. The shared derivation removes the two-copies risk it was extracted to remove. |
| `src/quality/register-census.ts` | W267 | No finding. Subject to itself, and says so. |
| `src/quality/latent-y5.ts` | W268 | No finding. Conditions re-evaluated from source rather than from their own record. |
| `src/sim/fleet-y5.ts` | W269 | No finding. Two defects were found and fixed inside the unit; see below. |
| `src/compliance/copy-y6.ts` | W270 | No finding. The door is additive-only — `door.has(module) || unit >= floor` can widen the register and cannot narrow it. |
| `src/security/page-reach.ts` | W271 | No finding. |

## FINDING 1 — a practice could read another practice's referral narrative

**Severity: high. Category: authorization / data exposure. Fixed in this unit.**

`/console/privacy` renders the access export with `JSON.stringify(exported, null, 2)`, and
`exportForPatient(patientId, nowIso)` is deliberately **not** practice-scoped. W209's `STORE_READS`
registers it as `patient_keyed` with the reason *"the answer to 'what do you hold about me' is
every practice's holding, so this must not take a practice"* — and that reason is correct.

**It is a statement about the subject's entitlement, and the reader on that page is a practice's
staff member.** One function was answering two different questions and only one of them had been
asked.

This was defensible while the payload was booking rows and complaints. **W266 added the GP-to-GP
referral rail to it** — correctly, closing a three-year gap where erasure reached a store access
did not — and `referralsForPatient` is unscoped for the same reason the scrub is. The referral rail
holds every practice's referrals, and a `ReferralDocument` carries `narrative`: free text a GP
wrote, with `createdBy` naming them.

So an operator with `edit_rules` at **one** practice could type any patient identifier into the
export box and read clinical text a GP at a **different** practice wrote about that patient —
including a referral between two practices the reader is not party to at all. Patient identifiers
in this tree are sequential (`pat-1`, `pat-2`, …), so the identifiers are enumerable.

**Nothing tested it, and the reason is the same one Y4-1 had.** W266's test seeds one practice and
asserts each field comes back non-empty, which is exactly right for the question it asks. A
cross-practice defect needs two practices in the fixture, and there was one.

**Fix: split by reader, not by store.** `exportForPatient` is unchanged — it keeps answering the
product's question and keeps its parity with `deletePatientEverywhere`, which is precisely what
W266 and W137 built and what an erasure sweep needs. `consoleExportFor(patientId, practiceId, now)`
adds the console's question, narrowing the product's answer, and the page asks that one.

Four decisions inside the fix, each with a defect behind it:

- **Party, not author, decides a referral.** Both practices are named on it and both are entitled
  to it — scoping to `fromPracticeId` would hide from a receiving practice the document it is
  currently working from.
- **`held` is re-derived from what survived.** Carrying the unscoped value would print "records are
  held" above an empty document — the exact inverse of the defect W266 fixed.
- **The count of what was withheld is not reported.** This is the opposite of the tree's usual rule
  and is deliberate: everywhere else a silently narrowed result is the defect, and here the count
  would disclose that the patient is known to another practice, which is the fact being protected.
  The narrowing is stated on the module and in the copy; the number is not.
- **The narrowing is a filter over the product's answer, not a second derivation.** A store added
  to `exportForPatient` tomorrow arrives as an unscoped field this unit's test fails on, rather
  than as a field nobody remembered to scope. Two derivations of "what is held about this patient"
  is the two-copies defect W266 removed from the referral rail one week earlier.

**Verified by breaking it three ways**: reverting to the unscoped referrals fails four assertions,
scoping by author fails the sent-or-received check, and carrying `held` across fails the
holds-nothing case.

## FINDING 2 — a fleet budget that could not detect the defect it was written for

**Severity: medium. Category: ineffective control. Found and fixed inside W269.**

W269's `forecastShare` budget exists to catch W223's four-week forecast floor eroding. The first
version of the run generated every practice with a full diary, so the share measured **exactly
1.000** — the refusal branch never executed once, and erosion cannot push a share above one. The
envelope was satisfied at its own ceiling by a run structurally incapable of failing.

Recorded here rather than only in the unit because the shape recurs: **a ratio budget whose
measured value sits at an endpoint is usually not a budget.** Fixed by putting practices in the
fleet the product must refuse, so the share sits strictly inside both ends.

## FINDING 3 — a latency budget a percentile could not see

**Severity: low (performance, no security impact). Found in W269. Measured and pinned, not fixed.**

The first read of the platform API's `capacity` endpoint costs **~5.6 seconds**; every subsequent
read costs 0.7ms. `getSimResult()` memoises a whole `runSim(DEFAULT_SIM_CONFIG)` at module scope
and that endpoint triggers it. Across fifty practices the p95 is 0.9ms — inside any budget anybody
would write.

In a deployment this is the first request after a boot. **Not fixed here**, because moving the
simulation off the request path is a change to how the demo data is built and belongs to its own
unit. It is measured as its own figure with its own budget (`maxColdStartMs: 12_000`), so it cannot
double unnoticed.

## FINDING 4 — the demo rail belonged to a practice nobody could sign in as

**Severity: medium. Category: incoherent fixture masking a control. Fixed in this unit.**

Surfaced by finding 1's fix rather than by reading. With the export scoped, `/console/privacy`'s
e2e stopped finding `inv-a` — and the reason was not the fix. `SEED_PRACTICE_ID` was `prac-demo`
while the console mints `prac-1` for the first practice onboarded, so **the seeded booking rail
belonged to a practice no session can ever act for.**

Every practice-scoped console page was therefore reading an empty rail, and **the one page that
showed the seeded data was the privacy export, because it was the only unscoped one.** The
incoherence and the defect were holding each other up: the export looked like it worked, and the
fixture looked like it was wired.

That is why the e2e passed before this unit and could not have caught finding 1. It was asserting
the defective behaviour — that a practice sees rows belonging to another one — and reading it as
the feature working.

**Fix: the seed rail is `prac-1`.** Three references, one of them a literal fallback in the
complaints store. The e2e now asserts the practice sees its OWN records, which is what it was
always meant to say.

## FINDING 5 — a red e2e that gates nothing

**Severity: medium (process). Category: control not wired to the gate. Recorded, not fixed.**

Running the full e2e suite for finding 4 turned up `e2e/public-sweep.spec.ts` failing: `/finder`
renders 162 characters against the spec's 200-character vacuity guard. **Confirmed pre-existing** —
it fails identically on the tree with this unit's changes stashed, so it is not a Q21 regression.

The finding is not the failing assertion. It is that **`pnpm verify` is `typecheck && test && build
&& audit:gate` and does not run Playwright**, so this has been red without gating anything. Every
unit this quarter ran the verify gate and passed. The e2e suite is the only control that exercises
a rendered page, and it is the one control a green build does not include.

**Not fixed here, deliberately.** The remedy is either to change a public surface's copy or to
change the guard that watches it, and `/finder` is a public surface — the class of change G6 and
W192's advertising sweep exist to slow down. Choosing between those two is a decision, not a
tidy-up, and a hardening unit should not make it in passing.

## Dispositions

| # | Severity | Disposition | Date | Review date |
| --- | --- | --- | --- | --- |
| 1 | high | fixed in W272 | 2026-08-13 | — |
| 2 | medium | fixed in W269 | 2026-08-13 | — |
| 3 | low | accepted, measured and pinned | 2026-08-13 | 2027-02-13 |
| 4 | medium | fixed in W272 | 2026-08-13 | — |
| 5 | medium | accepted — pre-existing, out of this unit's scope | 2026-08-13 | 2026-11-13 |

Findings 3 and 5 are the two acceptances, and each carries a review date because an accepted
finding with no date is one nobody looks at again — W210's rule. Finding 5's date is shorter
because a control that gates nothing gets worse the longer it sits.

## What `simplify` found, and why little was changed

The quarter's duplication is real and mostly **already registered**: eleven test files walk the
tree with their own `readdirSync`, and W267's census enumerates every one of them with the one-line
change that would make each provable. That register is the fix; collapsing the walks into a shared
helper now would delete the finding without addressing it.

Two things were changed on this lens rather than left:

- `reachableFrom(root, entries)` was extracted from `reachableFromApp` in W271, so per-route and
  whole-app reachability follow one set of import rules including W165's two fixes.
- `referralIdsForPatient` was extracted from the scrub in W266, so access and erasure share one
  answer to "which referrals are this patient's".

One overlap was left deliberately: W264's importer walk and W271's dormant register both keep the
G5 rehearsal off the product. They are not the same check — W271 asks whether a **route** reaches
it, W264 asks whether **anything** imports it — and the stricter one is worth its few lines.

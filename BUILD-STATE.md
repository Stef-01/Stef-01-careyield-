# CareYield BUILD-STATE — claim ledger + protocol

> Machine-maintained by the careyield-build-loop. One row per week-unit. This file IS the lock.

## Claim protocol (every loop session follows this exactly)

1. `git pull --rebase` the working branch (see **Home resolution** below) so this file is current.
2. Pick ONE unit, in this priority order:
   a. an `in-progress` unit whose continuation notes you can finish;
   b. a `claimed`/`in-progress` unit that the **staleness rule** below says you may reclaim;
   c. the lowest-numbered `available` unit whose dependencies are `done` (units marked `[P]` in the plan are claimable out of order).
3. Claim it: set status `claimed`, your session id (short), and UTC timestamp in this table. **Commit and push this claim edit immediately, before building.**
4. If the push is rejected (another session claimed simultaneously): `git pull --rebase`, pick the *next* eligible unit, repeat. Never fight over a row.
5. Build the unit to its verify gate. Commit work incrementally (green only). **If a unit runs
   long, push something at least every 90 minutes** — a green WIP commit, or a heartbeat edit to
   your own row. That push is what tells other sessions you are alive; without it your row is
   reclaimable after 90 minutes (see the staleness rule).
6. Finish: set status `done` + commit SHA, or `in-progress` + concrete continuation notes (what's left, where, how to verify), or `blocked` + reason (e.g. founder gate). Push with rebase-retry (up to 4 attempts).
7. Parallelisation is expected: overlapping sessions hold different rows. Never edit another session's non-stale claimed row.

## Staleness — when you may reclaim someone else's row (W54)

A flat window cannot tell a slow holder from a dead one. On 2026-08-09 builder-A hit a model
limit mid-claim on W51; because the only rule was "6 hours", its dead row idled *both* routines
for over two hours and two firings found nothing to do. The rule is now **evidence-based**:

| Holder has… | Window | Measured from |
|---|---|---|
| pushed nothing since claiming | **90 minutes** | the claim time |
| pushed a commit / heartbeat | **6 hours** | its last push |
| visibly failed (model limit, dead session) | **none — reclaim now** | — |

Progress, not elapsed time, is the liveness signal: a holder that has pushed something has proven
it is running and keeps the long leash; one that has pushed nothing has proven nothing. Both are
checkable from `git log` alone, so no session needs to ping another.

Two deliberate refusals: a claimed row whose timestamp is **missing or unreadable** is left alone
and flagged (stealing a live claim is worse than an idle row), and a claim timestamped in the
future is never reclaimed on clock skew.

The normative definition is `classifyClaim` in `src/loop/claims.ts`, simulated against this
incident's real timestamps in `src/loop/claims.test.ts`. Change the rule there and here together.

## Fleet — builders run on different models (W54)

W51 §Process: a single-model fleet is a single point of failure. When builder-A exhausted its
model limit, it did not fail loudly — it held a claim and stopped, which is the worst failure
mode for a ledger-locked loop.

- **Run the builders on different models.** One provider limit, one model deprecation or one
  capacity incident must not be able to stop every builder at once.
- **Record the model in the session id** where it helps (`builder-A`, `builder-B`, …) and name
  the model in the session log entry, so a post-mortem can see which model stalled.
- **A builder that hits its limit is `knownDead`** — any other session may reclaim its row
  immediately under the staleness rule; there is nothing to wait for.
- **Routines outlive sessions.** A routine firing into a dead session is wasted, so a fleet of
  two on one model is worth less than a fleet of two on two models.

## Home

This repo — `stef-01/stef-01-careyield-`, branch `main` — is the permanent home (W-MIGRATE
completed 2026-08-08; the tree previously lived in Stefan-Brain `careyield/`, now a pointer).
Session logs still go to Stefan-Brain `wiki/_log/` (non-fatal if unavailable).

## Ledger — Year 1

| Unit | Status | Session | Claimed (UTC) | SHA | Notes |
|---|---|---|---|---|---|
| W-MIGRATE | done | interactive-0808 | 2026-08-08T07:25Z | (initial commit) | tree migrated from Stefan-Brain PR #5 @ 5efe413; CI workflow activated at .github/workflows/ci.yml |
| W1 | done | interactive-0808 | 2026-08-08T07:05Z | 90a044f | CI staged in ci/github-workflow.yml (workflow-push perms absent in vault repo; activates at W-MIGRATE) |
| W2 | done | interactive-0808 | 2026-08-08T07:12Z | 9c2c2f4 | verify adapted (no live postgres): migration + TS registry consistency-tested; live apply deferred to Supabase wiring |
| W3 | done | interactive-0808 | 2026-08-08T07:20Z | 9f53943 | — |
| W4 | done | interactive-0808 | 2026-08-08T07:28Z | 316055b | — |
| W5 | done | interactive-0808 | 2026-08-08T07:36Z | 193737a | — |
| W6 | done | interactive-0808 | 2026-08-08T07:12Z | a1d4f1e | — |
| W7 | done | builder-B | 2026-08-08T08:05Z | 2cf4107 | Playwright e2e added (pnpm e2e; not in CI — runner lacks pre-provisioned browser); mock rail behind /book/[token] |
| W8 | done | builder-A | 2026-08-08T08:54Z | 548c25f | audit kind constraint extended in migration 0002 |
| W9 | done | builder-A | 2026-08-08T17:46Z | de3da79 | definitions doc at docs/ATTRIBUTION.md (v1, doc+code versioned together) |
| W10 | done | builder-A | 2026-08-08T18:16Z | 6e8a365 | spine at src/spine; replay refuses corrupt logs; rail transitions captured by diff |
| W11 | done | builder-B | 2026-08-08T18:40Z | 807ae78 | mock auth (Supabase deferred — no prod credentials gate); design QA via manual checklist at docs/DESIGN-QA.md (impeccable/taste skills unavailable in loop env) |
| W12 | done | builder-A | 2026-08-08T19:16Z | 34c66e5 | report artifact committed at reports/sim-26w.md; sim test regenerates it each run |
| W13 | done | builder-B | 2026-08-08T19:40Z | 9353793 | Q1 security review dossier at docs/SECURITY-REVIEW-Q1.md; 3 findings (1 High server-action authz, 2 Medium) all fixed + regression-tested; code-review sweep clean. Zero criticals |
| W14 | done | builder-A | 2026-08-08T20:16Z | 2717256 | e2e runs in loop env via PW_CHROMIUM_PATH=/opt/pw-browsers/chromium (6/6 green — updates W7 note) |
| W15 | done | builder-B | 2026-08-08T20:40Z | a1f900b | one-tap audit at /console/usefulness; mock store (synthetic); outcome_records/OutcomeRecord from W2 reused; tally feeds later dashboard/guardrails |
| W16 | done | builder-A | 2026-08-08T21:15Z | 1dafcac | monitors pure over metrics; complaint log typed here, full workflow arrives at W43; W19/W20 surface alerts |
| W17 | done | builder-B | 2026-08-08T21:40Z | 14f90c4 | config at src/session/config.ts, honored in sim (gate met); appointmentType added to domain+SQL+generator (deterministic, no RNG shift); e2e now single-worker (global mock stores). Console editing surface deferred (needs clinician roster) |
| W18 | done | builder-A | 2026-08-08T22:16Z | 7e4d39e | authorize() at src/tenancy is the app-layer decision point; RLS policies in migration 0003; manage_members UI + invite flow deferred to W41 onboarding wizard |
| W19 | done | builder-B | 2026-08-08T22:40Z | 680fe91 | ops switches at src/ops honored in sim (kill/pause → 0 sends); /console/ops queue + toggles gated by pause_sending (W18); global kill-switch uses practice pause_sending grant in synthetic phase (CareYield-superadmin role deferred) |
| W20 | done | builder-A | 2026-08-08T23:16Z | e083257 | golden at reports/weekly-w8.md (+docx artifact); revenue = incremental × configurable $/visit, naive shown as contrast only; MBS-accurate rebates arrive at W34 |
| W21 | done | builder-B | 2026-08-08T23:40Z | 65e42cb | model at src/economics/roi.ts (gate: matches brief figures — net $45,029, 4.8x at defaults); living xlsx at reports/roi-calculator.xlsx (formulas + fullCalcOnLoad; LibreOffice recalc unavailable in sandbox → Excel recalcs on open); widget at /console/roi; pricing assumption finalises at W47 |
| W22 | done | builder-A | 2026-08-09T00:17Z | a73278d | /demo presenter page + docs/DEMO.md script; launch action idempotently reseeds all mock stores; e2e drives the full walkthrough |
| W23 | done | builder-B | 2026-08-09T00:40Z | e3c01fb | landing at app/page.tsx; copy as data (src/compliance/landing-copy.ts) lint-gated by src/compliance/landing.ts (B2B twin of W6 linter); design QA in docs/DESIGN-QA.md (taste-skill unavailable in loop env) |
| W24 | done | builder-A | 2026-08-09T01:16Z | 12fec5a | continuity at src/engine/continuity.ts; UPC independent of nominated GP by design; dashboard surfacing joins W42 practice-facing v2 |
| W25 | done | builder-B | 2026-08-09T01:40Z | 7e6bc81 | telehealth message variant in W6 templates (linted); booking page video-appt copy; mock rail ?scenario=telehealth (default seed unchanged); config = W17 fillable "telehealth" type; also fixed pre-existing dashboard.spec race |
| W26 | done | builder-A | 2026-08-09T02:16Z | af5db12 | dossier at docs/HARDENING-Q2.md: 10 findings, 2 criticals fixed (session-config booking bypass; onboard privilege escalation), zero criticals remain; finding #10 (W15 worthwhile+no-action semantics) filed for founder |
| W27 | done | builder-B | 2026-08-09T02:40Z | dca1644 | PmsReadAdapter + reusable contract suite (src/pms/contract.ts); SyntheticPmsAdapter passes it (gate); read-only/credential-free (G1); real BP/Halo adapters reuse the contract at W28. Also fixed 2 cold-cache perf-flakes (W14 unit timeout, dashboard e2e nav timeout) |
| W28 | done | builder-B | 2026-08-09T03:00Z | c4d617b | VendorPmsAdapter (src/pms/vendors.ts) maps BP + Halo raw shapes to W27 contract; both pass contract on recorded fixtures (gate); G1 enforced in constructor (live hosts refused); live HTTP client + field reconciliation = W38/W39 follow-up |
| W29 | done | builder-B | 2026-08-09T03:20Z | da1e0cc | buildBookingLink (src/booking/deeplink.ts): internal/hotdoc/healthengine behind per-practice flags, falls back to internal link with recorded reason; https-only + no-patient-identifier guard enforced in code; link-format tests are the gate. Vendor URL shapes configurable, reconciled at W39; not yet wired into sim (same posture as W28 skeletons — wiring lands at W38) |
| W30 | done | builder-A | 2026-08-09T03:16Z | 322ee34 | fast path behind lateCancellationRate (default 0 — goldens stable); latency budget max<100ms p50<25ms met in sim; PMS cancellation feed wiring joins W32/W36 |
| W31 | done | builder-A | 2026-08-09T02:36Z | e43eea5 | G3 enforced in constructor (twilio.com refused); integration tests use in-process fake API; real Twilio sandbox creds + live wiring = founder gate follow-up (W39 dossier) |
| W32 | done | builder-A | 2026-08-09T03:22Z | d9e6640 | ingest at src/pms/ingest.ts; STOP one-way door upheld at ingestion boundary; consent conflicts flagged not resolved; SQL persistence of identities/provenance joins Supabase wiring |
| W33 | done | builder-A | 2026-08-09T03:38Z | 14209e9 | delete keeps hashed record + suppression (re-ingest can never re-contact); ADM page at /privacy/automated-decisions; policy DRAFT pending counsel; W37 security pass covers the new surface |
| W34 | done | interactive-0809 | 2026-08-09T02:42Z | 0da1194 | revenue-estimation only; verified 1-Jul-2025 rebates pinned in tests |
| W35 | done | interactive-0809 | 2026-08-09T03:15Z | c3d8cfe | composition only — no metric recomputed; synthetic usefulness records stand in until G4 |
| W36 | done | builder-B | 2026-08-09T03:50Z | e4e79e5 | ResilientPmsReader at src/pms/resilience.ts: failure isolation (throw/hang/malformed → degrade, never raise), stale-data guard fails CLOSED past freshness budget, circuit breaker, readFleet isolation. 12 chaos tests are the gate; clock injected. Wiring into the send path lands with W38 |
| W37 | done | builder-A | 2026-08-09T03:51Z | 4dbaf79 | dossier at docs/SECURITY-REVIEW-Q3.md: 1 critical (demo gate) + 2 highs (session expiry, rate limits) fixed; zero criticals; prod deploy checklist items flow to W39. Review conducted manually — skill's diff entry point had no diff (loop commits green to main) |
| W38 | done | builder-B | 2026-08-09T04:05Z | 7993f5b | drift detection at src/pms/drift.ts (per-vendor declared shape; additive change is not drift, removal/retype/null/unknown-enum/missing-collection are) + error taxonomy at src/integration/errors.ts unifying W36/W29/W28/drift failures with severity + blocksSending + operator action. Suite green (gate): 8 drift + 11 taxonomy tests |
| W39 | done | builder-A | 2026-08-09T04:06Z | bd8375b | GATE DOSSIER AT docs/GATE-DOSSIER-Q3.md — FOUNDER ACTION REQUIRED on G1/G2/G3 (credentials + exact activation steps enumerated; all gates remain CLOSED and code-enforced). Grounded in 6-agent code survey + 61-claim adversarial verify; survey also found+fixed a W33 authz gap (export render now takes the stewardship grant) |
| W40 | done | interactive-0809 | 2026-08-09T03:39Z | 7589c38 | docs unit; success criteria pre-registered incl. holdout non-negotiable + stop rules |
| W41 | done | builder-B | 2026-08-09T04:25Z | 596fdce | 5-step wizard at /console/setup/[step]; lands the W17 deferral (clinician roster + persisted SessionConfig + validateSessionConfig) and setupCompletedAt. /console/onboarding left intact (6 redirect sites + 3 specs drive it) — collapsing it into a redirect to the wizard is a clean follow-up, filed for W49/W50. Adversarial review found + fixed 2 defects in my own code: reflected error string in console chrome, and completion attesting to never-reviewed defaults. Timed e2e asserts structure (≤5 steps, real persisted config) + wall-clock ceiling | — REVIEW FIXES @ 16382bf: stable clinician ids (positional ids re-pointed the offering allowlist at a different clinician) + allowlist now fails CLOSED instead of widening to "all" (my own test had blessed the fail-open); both regression-tested
| W42 | done | builder-B | 2026-08-09T04:45Z | f355ca6 | practice-facing /console/results; v1 dashboard untouched (its spec pins jargon verbatim + is DOM-coupled) — consolidating the two views is a W49/W51 follow-up. Reuses W14 chart via optional label/scale props (defaults reproduce v1 byte-identically); palette re-validated both modes per dataviz skill. Copy as data, linted by the W23 compliance linter + a jargon ban asserted on the rendered page. Gate: comprehension checklist in docs/DESIGN-QA.md, each question asserted in e2e. NOTE: a concurrent session wiped this unit's uncommitted files mid-build — shared working dir, commit early |
| W43 | done | builder-A | 2026-08-09T04:35Z | 234a535 | workflow at src/complaints + /console/complaints; opt-out terminal at intake (rail offers close immediately); open complaints banner console home + feed W16 monitor; intake open to all staff, triage/resolve behind pause_sending grant |
| W44 | done | interactive-0809 | 2026-08-09T03:52Z | dfae8bf | FINDING: sim defaults show generated-DNA worse than organic (~ratio>1.25) — calibration owner should review the generated-booking DNA model (W3/W12); real answer comes from pilot holdout |
| W45 | done | builder-A | 2026-08-09T04:56Z | 64bbb7c | golden at reports/case-study-w45.md; de-identification + W23 copy-lint + no-holdout-refusal enforced in code; synthetic marker until G4 |
| W46 | done | builder-B | 2026-08-09T05:20Z | 4336455 | figures register (src/collateral/figures.ts) is the gate: every asset number declared with a checkable source, anti-drift test vs live computation, copy may only cite {{id}} placeholders (bare numbers banned by test). Market sizing / benchmarks / competitor claims NOT shipped — listed in NEEDS_FOUNDER_VERIFICATION and in the register appendix as explicitly not claimed. Assets generated by test (W20 precedent): reports/careyield-{sales-deck.pptx,one-pager.docx,figure-register.md}. pptx validate PASSED; content QA caught 2 real defects (stat card rendering "A"; article error) — fixed + invariant asserted. Pixel visual QA unavailable in sandbox (LibreOffice cannot load the file, no pdftoppm) → geometry bounds test stands in |
| W47 | done | interactive-0809 | 2026-08-09T04:08Z | 2880cbf | agreement is a skeleton for a lawyer, not a contract; pricing encodes the no-fee-splitting posture |
| W48 | done | builder-A | 2026-08-09T05:16Z | 708a6be | 100×(1.5k pat, 4w) fleet: 12.4s total, p95 week 37ms (budget 150), backfill p95 1ms (budget 50), sends 0.74× priced envelope; W26's indexed-rail idea measured unnecessary at this scale; report regenerated per run (gitignored) |
| W49 | done | builder-A | 2026-08-09T05:22Z | bb879e2 | axe (WCAG 2.1 A/AA) e2e over all surfaces, zero violations enforced; contrast sweep stone-400→500 (14 files); manual checklist at docs/A11Y-W49.md; post-G2 re-run required |
| W50 | done | interactive-0809 | 2026-08-09T05:18Z | 23635ae | 8 surfaces mapped, zero unmapped in app/; update-in-same-commit rule established |
| W51 | done | interactive-0809 | 2026-08-09T07:50Z | 1038ab4 | audit at docs/AUDIT-W51.md — 2 findings both FIXED (A1 fire-and-forget send could log unsent-as-sent at G3, guarded fail-closed; A2 pnpm audit never run: 5/7 transitive advisories fixed via overrides, 2 image-size DoS accepted with rationale), 8 controls confirmed clean. Process: add pnpm audit to the gate + builders are a single-model SPOF (see report §Process) |
| W52 | done | interactive-0809 | 2026-08-09T08:05Z | 7c037e8 | YEAR 1 COMPLETE. Y2 Q5–Q8 expanded to §5b + 52 rows; gates inherited (W69 blocked on G5); W51 process findings became W53/W54 |

> Y2–Y5 rows are appended by the expansion rule (plan §6) at W52/W104/W156/W208 or when the backlog runs dry.

> **Year 2 — Condition Yield** (expanded by W52, 2026-08-09; definitions in docs/FIVE-YEAR-PLAN.md §5b).

| W53 | done | builder-B | 2026-08-09T08:47Z | 0be0a57 | `pnpm audit` in the gate + CI via `pnpm verify` (typecheck·test·build·audit:gate). Accepted risks live in src/security/audit-allowlist.ts, where the AllowlistEntry TYPE makes reason+reviewBy mandatory — the compiler enforces "rationale + review date", and past reviewBy the acceptance stops working. Evaluator is a pure function over the audit JSON so the unit's verification is 13 unit tests, not a manual observation; also confirmed end-to-end through the CLI (drop an acceptance → exit 1, restore → exit 0). Fail-closed on unknown severity, malformed advisory, bad date, and unreadable report (no network ⇒ FAIL, not skip). Stale entries warn but never block. Runner is scripts/audit-gate.mts under node 22 type stripping, so it is typechecked like the tree (needed tsconfig allowImportingTsExtensions). Gate doc updated in all 3 sites per W50. NOTE: the 2 image-size acceptances expire 2026-11-09 — the gate will start failing then, by design |
| W54 | claimed | builder-B | 2026-08-09T09:47Z | — | W51 §Process |
| W55 | available | — | — | — | — |
| W56 | available | — | — | — | W55 |
| W57 | available | — | — | — | W55, W56 |
| W58 | available | — | — | — | W57 |
| W59 | available | — | — | — | W58 |
| W60 | available | — | — | — | [P] W55 |
| W61 | available | — | — | — | W59 |
| W62 | available | — | — | — | [P] W56 |
| W63 | available | — | — | — | W59, W61 |
| W64 | available | — | — | — | [P] W63 |
| W65 | available | — | — | — | W53–W64 |
| W66 | available | — | — | — | W65 |
| W67 | available | — | — | — | W66 |
| W68 | available | — | — | — | W66 |
| W69 | blocked | — | — | — | FOUNDER GATE G5 (clinical content sign-off) — workspace may be built, content stays unusable until sign-off; W68 |
| W70 | available | — | — | — | [P] W66 |
| W71 | available | — | — | — | W58 |
| W72 | available | — | — | — | [P] W64 |
| W73 | available | — | — | — | W68 |
| W74 | available | — | — | — | [P] W66 |
| W75 | available | — | — | — | W71, W73 |
| W76 | available | — | — | — | [P] W72 |
| W77 | available | — | — | — | W66–W76 |
| W78 | available | — | — | — | W66–W77 |
| W79 | available | — | — | — | W78 |
| W80 | available | — | — | — | W79 |
| W81 | available | — | — | — | W79 |
| W82 | available | — | — | — | W80, W81 |
| W83 | available | — | — | — | [P] W79 |
| W84 | available | — | — | — | W82 |
| W85 | available | — | — | — | W84 |
| W86 | available | — | — | — | [P] W84 |
| W87 | available | — | — | — | W84, W85 |
| W88 | available | — | — | — | [P] W80 |
| W89 | available | — | — | — | W79 |
| W90 | available | — | — | — | [P] W78 |
| W91 | available | — | — | — | W79–W90 |
| W92 | available | — | — | — | W91 |
| W93 | available | — | — | — | W92 |
| W94 | available | — | — | — | [P] W92 |
| W95 | available | — | — | — | W93 |
| W96 | available | — | — | — | [P] W93 |
| W97 | available | — | — | — | W91 |
| W98 | available | — | — | — | [P] W97 |
| W99 | available | — | — | — | W97 |
| W100 | available | — | — | — | [P] W96 |
| W101 | available | — | — | — | W97 |
| W102 | available | — | — | — | W95, W97 |
| W103 | available | — | — | — | W92–W102 |
| W104 | available | — | — | — | W103 |

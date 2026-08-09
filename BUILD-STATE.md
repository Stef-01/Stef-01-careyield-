# CareYield BUILD-STATE — claim ledger + protocol

> Machine-maintained by the careyield-build-loop. One row per week-unit. This file IS the lock.

## Claim protocol (every loop session follows this exactly)

1. `git pull --rebase` the working branch (see **Home resolution** below) so this file is current.
2. Pick ONE unit, in this priority order:
   a. an `in-progress` unit whose continuation notes you can finish;
   b. a `claimed` unit whose `claimed_at` is **older than 6 hours** (stale — the session died; reclaim it);
   c. the lowest-numbered `available` unit whose dependencies are `done` (units marked `[P]` in the plan are claimable out of order).
3. Claim it: set status `claimed`, your session id (short), and UTC timestamp in this table. **Commit and push this claim edit immediately, before building.**
4. If the push is rejected (another session claimed simultaneously): `git pull --rebase`, pick the *next* eligible unit, repeat. Never fight over a row.
5. Build the unit to its verify gate. Commit work incrementally (green only).
6. Finish: set status `done` + commit SHA, or `in-progress` + concrete continuation notes (what's left, where, how to verify), or `blocked` + reason (e.g. founder gate). Push with rebase-retry (up to 4 attempts).
7. Parallelisation is expected: overlapping sessions hold different rows. Never edit another session's non-stale claimed row.

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
| W28 | available | — | — | — | depends W27 |
| W29 | available | — | — | — | depends W27 |
| W30 | available | — | — | — | depends W27 |
| W31 | done | builder-A | 2026-08-09T02:36Z | e43eea5 | G3 enforced in constructor (twilio.com refused); integration tests use in-process fake API; real Twilio sandbox creds + live wiring = founder gate follow-up (W39 dossier) |
| W32 | available | — | — | — | depends W27 |
| W33 | available | — | — | — | [P] depends W10 |
| W34 | done | interactive-0809 | 2026-08-09T02:42Z | 0da1194 | revenue-estimation only; verified 1-Jul-2025 rebates pinned in tests |
| W35 | available | — | — | — | depends W14, W15, W16 |
| W36 | available | — | — | — | [P] depends W28, W29 |
| W37 | available | — | — | — | depends W27–W33 |
| W38 | available | — | — | — | depends W28, W29, W36 |
| W39 | available | — | — | — | depends W37, W38 |
| W40 | available | — | — | — | depends W35 |
| W41 | available | — | — | — | depends W17, W19 |
| W42 | available | — | — | — | depends W14, W20 |
| W43 | available | — | — | — | [P] depends W16 |
| W44 | available | — | — | — | depends W35 |
| W45 | available | — | — | — | depends W35 |
| W46 | available | — | — | — | [P] no deps |
| W47 | available | — | — | — | [P] no deps |
| W48 | available | — | — | — | depends W38 |
| W49 | available | — | — | — | depends W41, W42 |
| W50 | available | — | — | — | depends W33, W37 |
| W51 | available | — | — | — | depends W40–W50 |
| W52 | available | — | — | — | depends W51 |

> Y2–Y5 rows are appended by the expansion rule (plan §6) at W52/W104/W156/W208 or when the backlog runs dry.

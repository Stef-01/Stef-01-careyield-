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
| W7 | available | — | — | — | depends W5, W6 |
| W8 | available | — | — | — | depends W4 |
| W9 | available | — | — | — | depends W7, W8 |
| W10 | available | — | — | — | depends W2 |
| W11 | available | — | — | — | depends W4 |
| W12 | available | — | — | — | depends W7, W8, W9, W10 |
| W13 | available | — | — | — | depends W1–W12 |
| W14 | available | — | — | — | depends W9, W12 |
| W15 | available | — | — | — | depends W11 |
| W16 | available | — | — | — | depends W12 |
| W17 | available | — | — | — | depends W11 |
| W18 | available | — | — | — | [P] depends W11 |
| W19 | available | — | — | — | depends W11 |
| W20 | available | — | — | — | depends W14 |
| W21 | available | — | — | — | [P] depends W9 |
| W22 | available | — | — | — | depends W12, W14 |
| W23 | available | — | — | — | [P] no deps |
| W24 | available | — | — | — | depends W9 |
| W25 | available | — | — | — | depends W17 |
| W26 | available | — | — | — | depends W14–W25 |
| W27 | available | — | — | — | depends W26 |
| W28 | available | — | — | — | depends W27 |
| W29 | available | — | — | — | depends W27 |
| W30 | available | — | — | — | depends W27 |
| W31 | available | — | — | — | [P] depends W6 |
| W32 | available | — | — | — | depends W27 |
| W33 | available | — | — | — | [P] depends W10 |
| W34 | available | — | — | — | depends W9 |
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

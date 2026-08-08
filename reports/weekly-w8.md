# Synthetic Family Practice — weekly report, week 8

Week beginning 2026-09-27. Synthetic-data phase: every figure below comes from the
simulated practice; the measurement design (holdout arm, intention-to-treat) is the one the
live product uses.

## Incrementality

| Measure | This week | Cumulative |
|---|---|---|
| Invite arm, attended / 1,000 | 50.1 | — |
| Holdout arm, attended / 1,000 | 50.9 | — |
| Incremental / 1,000 | -0.8 | 61.4 |
| Incremental attended appointments | — | 199.7 |

Arms: 3,254 invite / 746 holdout patients.
Definitions: docs/ATTRIBUTION.md v1 — what counts, what never counts.

## Revenue estimate

**$15,977 AUD** cumulative, at the practice's configured
$80 AUD average billing per attended visit, applied to
incremental visits only.

Counting every invitation-generated booking (287 visits)
would claim $22,960 AUD — CareYield does not report that number as
impact, because part of it is displaced organic attendance.

## Guardrails

All guardrails clear: opt-out rate, generated-booking DNA, and complaints are all inside thresholds.

Loop this period: 1,487 invitations sent, 305 booked, 15 opt-outs, 18 DNA on generated bookings.

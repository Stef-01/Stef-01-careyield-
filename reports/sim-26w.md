# CareYield 26-week simulation report (W12)

Deterministic run — seed 20260808, 4000 synthetic patients,
10 clinicians, 26 weeks from 2026-08-08.
Synthetic data only (founder gate G2); SMS via mock adapter only (G3).

## Loop totals

| Metric | Value |
|---|---|
| Sessions pooled | 507 |
| Invitations sent | 2474 |
| Booked | 515 (20.8% of sent) |
| Expired on fill | 1916 |
| Opt-outs | 27 (1.1% of sent) |
| Generated visits attended | 486 |
| Generated DNA | 29 (5.6% of generated bookings) |
| Organic visits (both arms) | 5070 |

## Attribution (definitions: docs/ATTRIBUTION.md v1)

| Arm | Patients | Attended | Per 1,000 |
|---|---|---|---|
| Invite | 3254 | 4563 | 1402.3 |
| Holdout | 746 | 993 | 1331.1 |

- **Incremental attended appointments: 231.6** (71.2 per 1,000 invite-arm patients)
- Naive "generated bookings" count: 486 — contrast figure only; the gap vs incremental is displacement.

## Invariants

All invariants held.

- Holdout arm never invited: pass
- Contact-frequency caps respected: pass
- Event spine verifies + full replay matches: pass
- Every generated visit traces to a booked invitation: pass
- Compliance linter on every send: enforced at render (throws on violation)

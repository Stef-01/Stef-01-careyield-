# Case study: filling unused appointments at a 10-GP metropolitan general practice

> **Synthetic-data rehearsal.** Every figure below comes from the simulated practice; this document is the template a real pilot fills. It is not publishable until founder gate G4 replaces the data.

## Setting

A 10-GP metropolitan general practice ran CareYield for 8 weeks.
Availability messages went only to existing patients of the practice who passed the
practice's own eligibility rules, with a randomised holdout group excluded from all
contact so the effect could be measured rather than assumed.

## What was measured

- **61.4 incremental attended appointments per 1,000 eligible patients** — the
  attendance rate above what the holdout group did on its own.
- 200 incremental attended appointments over the period
  (point estimate; every patient counted in their originally assigned group).
- 1,487 invitations sent, 305 booked
  (20.5% conversion), non-attendance on generated bookings 5.9%.
- 15 opt-outs (1.0% of messages sent). Every opt-out is permanent.

## How the counting stays honest

Counting every booking that followed an invitation would have claimed
287 attended visits. Part of that attendance would have
happened anyway; the holdout comparison removes it. The smaller number above is the
one CareYield reports, because it is the one the practice actually gained.

## What the visits contained

Of the generated visits audited by the practice's GPs, 87.5% were judged
a reasonable use of the appointment. The most common outcomes were routine
follow-up, medicines management, and preventive care — ordinary general practice,
delivered to patients who had drifted off the books.

## Limitations

Point estimates from a single practice over 8 weeks; no confidence
intervals are implied. Attendance figures are counts of appointments, not health
outcomes — this document makes no claims about anyone's health.

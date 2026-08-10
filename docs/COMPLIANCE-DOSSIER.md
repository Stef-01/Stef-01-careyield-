# CareYield Compliance Dossier (W50, v1 — living document)

Every user-facing surface mapped to the four regimes that govern it, with the code that enforces
the posture. Update this document in the same commit as any change to a mapped surface — a
surface without a row here does not ship. Regulatory basis: the venture research
(Stefan-Brain `wiki/entrepreneurship/startups/extended-scope-gp-network-research.md` §5).

## The four regimes

1. **Spam Act 2003** — commercial electronic messages: identification, consent, functional
   unsubscribe.
2. **Privacy Act 1988 / APPs** — health information is sensitive (no small-business exemption);
   APP 3 collection, APP 5 notice, APP 6 use limits, APP 7 direct-marketing limits, APP 11
   security/retention; automated-decision-making transparency in the privacy policy (in force
   10 Dec 2026).
3. **Ahpra advertising guidelines / s 133 National Law** — no clinical claims, no urgency, no
   testimonials/ratings, no title inflation ("specialist"/"surgeon" never near a niche scope),
   accuracy of every credential statement. Platform is itself liable ("a person who advertises").
4. **MBS integrity (PSR posture)** — CareYield generates attendance *opportunities*, never
   billings; only clinically relevant services are billed, by the GP; incrementality + usefulness
   audit is the standing anti-low-value-care evidence.

## Surface map

| Surface | Code | Regimes | Enforced by |
|---|---|---|---|
| Availability SMS | `src/messaging/templates.ts` | 1, 2, 3 | compliance linter (hard send gate: banned clinical/urgency/benefit phrases; required practice ID, STOP, booking link); terminal STOP in `src/messaging/adapter.ts`; contact-frequency caps in eligibility engine |
| Booking page (`app/book`) | `src/booking/*` | 2, 3 | tokenised links (no identity in URL); no clinical content rendered; offer-expiry honesty (no scarcity theatre) |
| Practice console (`app/console`) | `src/console/*`, `src/tenancy/*` | 2 | role-based access, practice isolation (W18 RLS + tests); config changes audit-logged to the event spine |
| Weekly/pilot reports | `src/report/*`, `src/pilot/report.ts` | 4 | naive counts labelled contrast-only (`docs/ATTRIBUTION.md` "never counts"); revenue figures labelled estimation-only (`src/mbs/items.ts` header) |
| Privacy page (`app/privacy`) | W33 | 2 | retention config + delete/export flows; ADM transparency statement (Dec 2026 requirement) shipped ahead of force date |
| Landing page (`app/page.tsx`) | W23 | 3 | B2B copy only (practices, not patients); copy-compliance linter from W23; no outcome claims, no testimonials |
| Complaint/opt-out workflow | W43 (`src/ops`) | 1, 2, 3 | intake → triage → practice notification; Sev-1 pause-first rule (`docs/SUPPORT-RUNBOOK.md`); event-spine replay resolves "STOP not honoured" claims with evidence |
| Sales assets (deck/one-pager) | W46 | 3 | factual credential/figure claims traceable to the research page; no "specialist-equivalent" language anywhere |
| Register console (`app/console/registers`) | W60 (`src/registers/*`) | 2, 3 | enable/disable is keyed by practice id, so one practice cannot change what another sees (isolation unit-tested); scheduling-only copy asserted in e2e ("needs", "at risk", "requires", "should be seen" all banned); register membership is non-inferential by construction — the W55 CHECK constraint and union type admit no symptom-derived source (G7) |

## Standing prohibitions (structural, not policy)

- No patient-facing clinical language: linter blocks "overdue", urgency, deterioration,
  diagnosis, test-result bait, benefit claims, check-up prompting. Tests seed each violation.
- No testimonials or star-ratings on any surface CareYield controls.
- No identifiable clinical data in model training (W33 posture; also contractual in the pilot
  agreement skeleton §6).
- No symptom-based patient triage — matching keys on clinician attributes only (TGA boundary,
  founder gate G7).
- No per-referral money in any direction (`docs/PRICING.md`).

## Review cadence

Quarterly, or immediately on: any new user-facing surface; any change to message templates or
linter rules; TGA CDSS guidance updates (carve-outs expected to narrow); commencement of the
remaining Privacy Act tranche-2 reforms. Each review appends a dated line here.

- 2026-08-09 — v1 established (W50). All eight surfaces mapped; zero unmapped surfaces in `app/`.
- 2026-08-09 — W60 adds the register console (nine surfaces). Its catalogue ships **placeholders
  only**: the real guideline intervals are W56, blocked pending a founder ruling on whether
  transcribed national guidance is G5 clinical content. A test asserts the shipped catalogue
  names no real condition or guideline, so clinical values cannot reach a practice-facing surface
  ahead of that ruling.

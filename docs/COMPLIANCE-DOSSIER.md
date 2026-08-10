# Meherr Compliance Dossier (W50, v1 — living document)

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
4. **MBS integrity (PSR posture)** — Meherr generates attendance *opportunities*, never
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
| Community landing (`app/page.tsx`) | founder commits 3317340, cfa2f1d | 2, 3 | Plain-language PMOS awareness copy and the interest form share this route. The form collects name, email and audience only; the privacy link and synthetic-demo separation remain visible. It does not diagnose, rank clinicians or make a treatment claim. The community interest register row below governs storage and retention limits |
| B2B landing (`app/practices`) | W23 (`src/compliance/landing.ts`) | 3 | Copy lives in the lint-gated `LANDING_COPY` bundle and moved here intact when the finder took `/`; the W23 linter and the a11y sweep both follow it to this URL. This row replaces the stale `app/page.tsx` row — W23's B2B-only guarantee describes `/practices`, and no longer describes `/` |
| Clinician walkthrough (`app/clinicians`) | founder commits 603219f, e083d7a | 2, 3, **G5** | **MAPPED AS PROTOTYPE — G5 question open and escalated.** Clinician-facing, not patient-facing, and carries disclaimers ("demo pathway only — does not determine scope or credentialing"; synthetic case summaries). Every clinical claim links to a primary source and nothing computes a recommendation, which is the lower-risk side of the CDSS line. But the CONTENT is real clinical guidance, which is what G5 governs, and W56's guideline intervals are blocked for exactly that reason — the two cannot both be right, and the founder has been asked to rule on them together. Joined the W49 a11y sweep at W65. Renders condition-specific clinical content ("New PCOS assessment", "Metformin review", "COCP suitability") — the first surface in the tree carrying named conditions and drug classes, which is the territory G5 gates |
| Complaint/opt-out workflow | W43 (`src/ops`) | 1, 2, 3 | intake → triage → practice notification; Sev-1 pause-first rule (`docs/SUPPORT-RUNBOOK.md`); event-spine replay resolves "STOP not honoured" claims with evidence |
| Sales assets (deck/one-pager) | W46 | 3 | factual credential/figure claims traceable to the research page; no "specialist-equivalent" language anywhere |
| Patient contact preferences (`app/book/[token]`) | W74 (`src/messaging/preferences.ts`) | 1, 2, 3 | patient sets their own contact hours and whether to be texted at all; unauthenticated action writes only against the invitation its signed token names, rate-limited like confirmBooking; a channel is never substituted and a send is never delivered outside the stated hours (deferred, or dropped if the offer expires first); conservative default (weekday business hours), never "any time"; copy asserted clinical-claim-free in e2e |
| Clinician finder demo (`app/finder`) | founder commit 3317340 | 2, 3, **G6, G7** | Same component as the root care-finder, served under an explicitly demo-labelled route and title. Everything in the care-finder row applies unchanged, including the open G6/G7 questions and the seven P1 defects in `qa/audit-matching-trust/audit.md`. The route's own title and description say "demo" and "synthetic", which is the control that currently distinguishes it |
| Community interest register (`app/console/interest`) | founder commit 3317340 (`src/interest/*`) | 1, 2 | Collects expressions of interest from a named community. Console-side and session-gated. **Needs before any real use:** this is the first surface that would hold contact details of people who are NOT existing patients of a subscribing practice, so the W33 retention/erasure flows and the APP 5 collection-notice question apply to it and have not yet been assessed — synthetic-only today (G2), which is why it is mapped rather than blocked |
| Demo presenter page (`app/demo`) | W29 | 3 | Presenter-facing walkthrough of the synthetic world; resets every store on launch. Copy is not covered by any linter (see the W51 audit's coverage finding), so it is mapped here as an accepted gap rather than an enforced control |
| Condition-targeted invitations | W66 (`src/messaging/condition-lint.ts`) | 1, 2, 3 | The register selects WHO is messaged and never WHAT they are told: a patient invited off a register and one invited off spare capacity receive byte-identical text (asserted). Leak check is relational — the condition that targeted the message cannot appear by code, display name or any significant word of either — so practice-authored registers are covered without editing the linter. Targeting *tells* ("we noticed", "based on your", recall framing) are banned too, because naming the condition is not the only way to disclose it. W6's rules are applied rather than re-implemented, so this path can never be held to a weaker standard |
| Template approval | W67 (`src/messaging/approval.ts`) | 1, 3 | The practice is the legal sender, so no text reaches a patient without that practice approving that exact wording. Approval is keyed by content hash, so any edit — including whitespace — silently revokes it; `assertSendable` throws rather than returning a boolean, so a caller who forgets to check still cannot send; approval is per practice and withdrawal is immediate |
| Clinical-safety rails | W68 (`src/registers/safety-rails.ts`) | 2, **G5**, G7 | Mechanism only — the rule set ships EMPTY and a test pins it, because deciding what counts as a red flag is clinical authorship (same gate as W56's intervals). Exclusion routes rather than drops: withheld patients are surfaced with the flag and rationale, since a patient silently never contacted is the failure a rail exists to prevent. Rails run ahead of ranking, so protection cannot depend on batch position. Flags are read, never derived (G7) |
| G5 authoring workspace | W69 (`src/registers/authoring.ts`) | **G5** | The gate itself, in code. Unapproved content is unusable — enforced by the type system, not a runtime check: `ApprovedContent` is branded so only `usableContent()` can produce one. Three stages, because a specialist ("is this correct?") and the founder ("do we accept shipping it?") answer different questions. Reviewed-but-unsigned content is still unusable; the author cannot review their own work; any amendment clears both attestations. Ships with zero content signed off |
| Register console (`app/console/registers`) | W60 (`src/registers/*`) | 2, 3 | enable/disable is keyed by practice id, so one practice cannot change what another sees (isolation unit-tested); scheduling-only copy asserted in e2e ("needs", "at risk", "requires", "should be seen" all banned); register membership is non-inferential by construction — the W55 CHECK constraint and union type admit no symptom-derived source (G7) |

## Standing prohibitions (structural, not policy)

- No patient-facing clinical language: linter blocks "overdue", urgency, deterioration,
  diagnosis, test-result bait, benefit claims, check-up prompting. Tests seed each violation.
- No testimonials or star-ratings on any surface Meherr controls.
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
- 2026-08-10 — **Four surfaces landed outside the loop** in founder commit 603219f (voice
  care-finder now served at `/`, clinician walkthrough, practices page). They arrived without
  dossier rows, so this document's prior claim of "zero unmapped surfaces in `app/`" was untrue
  until this entry; the rows above now describe what is actually deployed, and the W23 landing-page
  row is marked stale rather than silently left wrong. **No Meherr control has been applied to
  any of them** — no copy lint, no G6/G7 assessment, no G5 review of the condition/drug content.
  Awaiting the founder's ruling on whether these are design prototypes (in which case: mark
  prototype-only, keep them off any patient-reachable deployment, and the exposures below stay
  theoretical) or a shipping direction (in which case each needs its controls before traffic).
  Recorded by the round-13 check-in; the gate is green (452 tests) — this is a governance gap,
  not a broken build.
- 2026-08-09 — W60 adds the register console (nine surfaces). Its catalogue ships **placeholders
  only**: the real guideline intervals are W56, blocked pending a founder ruling on whether
  transcribed national guidance is G5 clinical content. A test asserts the shipped catalogue
  names no real condition or guideline, so clinical values cannot reach a practice-facing surface
  ahead of that ruling.
- 2026-08-10 — **W77: zero unmapped surfaces restored.** The four Q6 controls (W66 condition-leak
  linter, W67 template approval, W68 safety rails, W69 G5 workspace) are mapped above. The three
  surfaces that landed outside the loop are no longer "UNMAPPED": each now carries an honest row
  saying which controls apply today and which are missing, rather than a placeholder implying the
  question is unanswered. That is the distinction this document has to keep — a surface with no
  controls, described accurately, is mapped; a surface nobody has assessed is not. The stale
  `app/page.tsx` row is replaced by an `app/practices` row, which is where the lint-gated B2B copy
  actually lives now. **Still open and still the founder's:** the G5 ruling covering both W56's
  guideline intervals and the `/clinicians` clinical content, the G6/G7 position on the
  care-finder, and the seven P1 honesty defects in `qa/audit-matching-trust/audit.md`.
  Two further routes arrived in founder commit 3317340 (`app/finder`, `app/console/interest`) and
  are mapped above. The interest register is worth the founder's attention specifically: it is the
  first surface that would hold contact details for people who are **not** patients of a
  subscribing practice, which changes the privacy analysis (collection notice, retention, erasure)
  rather than merely extending it. Synthetic-only today, so the exposure is theoretical.
- 2026-08-10 — **Recurring false positive worth the compliance owner's attention, not a
  unilateral fix.** The W23 `no-ratings` rule (`/\breviews?\b/`) has now blocked correct copy
  three times: "medication review" (W45), the analytics withheld-explainer (W65), and "reviews
  due by the practice's schedule" (W100). In a healthcare product "review" overwhelmingly means
  a *clinical* review, not a customer rating. Each time the copy was reworded and the linter
  left alone, which is the right power balance and the W45 precedent — but three hits is
  evidence the rule is miscalibrated rather than that the copy keeps being wrong. A tighter
  pattern (e.g. requiring a rating context: customer/patient/online/Google reviews, star
  ratings, `n/5`) would keep the protection and stop taxing correct sentences. **Not changed
  here**: loosening a compliance rule is a decision for whoever owns the compliance posture,
  and doing it inside an unrelated unit is exactly how such rules erode.

# CareYield — Five-Year Vibecoded Build Plan (v1, 2026-08-08)

> Canonical build plan. Executed by the `careyield-build-loop` (two offset hourly Claude Routines =
> one firing every 30 minutes, each firing = one build session = one week-unit advanced).
> Venture brief: `Stefan-Brain/wiki/entrepreneurship/startups/careyield.md`.
> Research base: `Stefan-Brain/wiki/entrepreneurship/startups/extended-scope-gp-network-research.md`.

---

## 0. Operating model

- **Unit of work = one plan week.** Each loop firing claims exactly one week-unit from the `BUILD-STATE.md` ledger (unit definitions: §5 below) via the claim protocol in that file, builds it to its verify gate, commits, and records the outcome. Long builds span multiple firings (status `in-progress` + continuation notes); parallel firings claim *different* units — that is the clash-protection design.
- **Verify gate is hard.** A unit is `done` only when its stated verification passes (typecheck + tests + build at minimum). Partial work commits green (behind flags) with continuation notes — never a red main.
- **Karpathy laws apply** (think before coding · simplicity first · surgical changes · goal-driven execution). Minimum code that passes the gate; no speculative flexibility.
- **Synthetic-first, founder-gated production.** The loop NEVER handles real patient data, never sends real SMS, never touches production credentials. Everything builds and proves against the synthetic practice engine. Crossing to real data/messages/pilots requires the founder gates in §4 — the loop builds *up to* each gate and flags it.
- **Home**: `stef-01/stef-01-careyield-`, branch `main` (W-MIGRATE completed 2026-08-08).

## 1. Stack

Next.js (App Router) + TypeScript strict + Tailwind · Supabase (Postgres + RLS + Auth + Edge Functions) · Vercel deploy · pnpm · Vitest + Playwright · SMS via provider-agnostic adapter (mock → Twilio sandbox → G-gated live) · PMS/booking via adapter interfaces (synthetic adapter first; Best Practice/Halo + HotDoc/HealthEngine adapters behind flags) · Claude API for the education/curation engine (Y3+, claude-api skill for integration patterns).

## 2. Skills map (use them; they exist for this)

| Phase of work | Skills |
|---|---|
| Schema, RLS, migrations, query tuning | `supabase`, `supabase-postgres-best-practices`, Supabase MCP |
| UI build & polish | `impeccable`, `taste-skill`, `minimalist-skill`, `redesign-skill`, Figma MCP |
| Dashboards & analytics surfaces | `dataviz` |
| Quality gates on every hardening week | `code-review`, `simplify`, `security-review` |
| Live QA of the running app | `run` |
| Web-session CI bootstrap | `session-start-hook` |
| Sales/pilot assets | `pptx`, `docx`, `xlsx`, `pdf`, `canvas-design`, Canva MCP |
| Demos & practice-facing reports | Artifact publishing |
| Big audit/parallel weeks | Agent fan-out / Workflow orchestration |

## 3. Five-year arc

| Year | Theme | Exit state |
|---|---|---|
| **1** | **Continuity Yield engine, pilot-ready** | Full outbound loop proven on synthetic practices; integration adapters contract-tested; pilot playbook + sales assets done; waiting only on founder gates (credentials, pilot practice) |
| **2** | **Condition Yield** | Care-gap registers (diabetes cycle, CKD intervals, GPCCMP reviews), condition-targeted invitations, per-GP capability graph v1, in-panel routing, referral-leakage detection, multisite tenancy |
| **3** | **Scope Yield foundations** | Credential registry + evidence vault, pathway definition engine (inclusion/exclusion/escalation as versioned data), specialist governance workspace, GP-to-GP referral rails + structured return reports, education engine v1 (case-triggered curation + CPD trail) |
| **4** | **Network launch** | Cardiometabolic + early-CKD vertical assembled (clinical content founder/specialist-gated), outcome auditing + escalation monitoring, dermatology reference vertical, Ahpra-compliant network directory, PHN/health-system reporting, compliance hardening (TGA CDSS boundary, APP/ADM transparency) |
| **5** | **Intelligence & scale** | Intervention-response graph, matching optimisation (deterministic-first), capacity forecasting ("open 6 slots Thursday → 5 fill"), FHIR/e-referral interoperability, payer integrations, expansion verticals, platform APIs |

## 4. Founder gates (the loop NEVER crosses these; it builds to them and flags)

- **G0** — ~~create the dedicated repo~~ CLEARED 2026-08-08: `stef-01/stef-01-careyield-` live, tree migrated.
- **G1** — real PMS/booking API credentials (Halo/Best Practice, HotDoc partner access)
- **G2** — real patient data of any kind (requires privacy impact assessment first; APP 7 posture per brief)
- **G3** — live SMS to real patients (Spam Act consent flows verified; message templates founder-approved)
- **G4** — pilot go-live at a real practice (pilot agreement + holdout consent design signed off)
- **G5** — clinical pathway content sign-off (specialist reviewers engaged; Y3-4)
- **G6** — network/directory public launch (Ahpra advertising review of all profile copy; Y4)
- **G7** — any feature that could constitute TGA-regulated CDSS (default: keep matching keyed to clinician attributes, never symptom-based patient triage)

## 5. Year 1 weekly ledger (W1–W52)

Each unit: **build → verify**. Dependencies are sequential within a quarter unless marked `[P]` (parallel-safe — claimable out of order).

### Q1 — Foundations (W1–W13)
- **W1** Scaffold: Next.js + TS strict + Tailwind + pnpm + Vitest + repo CLAUDE.md build laws + GitHub Actions CI (typecheck/test/build) + session-start hook → verify: CI green.
- **W2** Domain model + Supabase schema v1 (practices, clinicians, patients, panel_membership, appointments, sessions, consents, invitations, bookings, outcomes, audit_events; RLS default-deny) → verify: migrations apply, generated types compile, RLS smoke tests.
- **W3** Synthetic practice engine: generator for a 10-GP practice (~12k patients; realistic visit-interval, DNA ~5%, late-cancel distributions; usual-GP affinity) → verify: seeded stats within spec tolerances (test asserts distributions).
- **W4** Eligibility rules engine (deterministic): recency window, usual-GP mapping, no-future-booking, no-active-recall, consent, contact-frequency caps, excluded groups — rules as versioned config → verify: unit tests incl. every exclusion edge case.
- **W5** Invitation pool builder: per-open-session candidate ranking + minimal-send calculator + offer expiry on fill → verify: property tests (caps never exceeded, ineligible never pooled).
- **W6** Messaging layer: template system + **compliance linter** (banned-phrase rules from Ahpra/Spam Act posture — no clinical claims, no urgency, no "overdue"), SMS adapter interface + mock provider, STOP/opt-out handling → verify: linter blocks seeded violating templates; opt-out is terminal in tests.
- **W7** Booking-link flow: tokenised deep link → booking page (mock rail) → booking recorded → remaining offers expire → verify: Playwright e2e.
- **W8** Holdout engine: eligible→arm assignment (stable hashing, practice-configurable holdout %), exclusion audit trail → verify: assignment-balance statistical test.
- **W9** Attribution v1: incremental-attended-appointment counting vs holdout; written definitions doc (what counts, what never counts) → verify: golden-fixture tests.
- **W10** Event spine: immutable audit log for every invitation/booking/opt-out/config change → verify: full state reconstructable by replay test.
- **W11** Practice console shell: Supabase auth, practice onboarding, rules-config UI (impeccable + taste-skill pass) → verify: e2e + design QA checklist.
- **W12** Simulation harness: run the whole loop over 26 simulated weeks on the synthetic practice; produce results report → verify: sim completes, invariants hold, report artifact generated.
- **W13** Q1 hardening: security-review skill (RLS, auth, tokens), code-review + simplify sweeps, docs pass → verify: zero criticals; findings filed or fixed.

### Q2 — Product (W14–W26)
- **W14** Incrementality dashboard v1 (dataviz skill; holdout vs arm, attended/1,000 eligible north star) → verify: renders from sim data, e2e.
- **W15** Usefulness-audit capture: one-tap GP form (what happened in the visit: med review / investigation / preventive / nothing) + storage → verify: e2e + schema tests.
- **W16** Guardrail monitors: opt-out rate, complaint log, DNA-on-generated-bookings alerting → verify: thresholds trigger in sim.
- **W17** Session config: protected capacity, participating clinicians, fillable appointment types, quiet hours/scheduling windows → verify: config honored in sim run.
- **W18** [P] Multi-tenancy hardening: practice isolation tests, roles (owner/manager/clinician) → verify: cross-tenant access impossible in tests.
- **W19** Admin ops console: invitation queue visibility, kill-switch, per-practice pause → verify: e2e.
- **W20** Weekly practice report generator (docx/pdf skill): incrementality, revenue estimate, guardrails → verify: golden report from sim data.
- **W21** [P] ROI calculator (xlsx skill): the brief's practice-economics model as a living spreadsheet + in-app widget → verify: matches brief figures on brief assumptions.
- **W22** Demo environment: scripted synthetic practice + demo walkthrough doc → verify: demo runs clean end-to-end.
- **W23** [P] Landing page (taste-skill): positioning per brief §Phase 1, zero regulated-advertising exposure (B2B copy only) → verify: design QA + copy compliance check.
- **W24** Usual-GP continuity metrics: share booked with usual GP, continuity index per panel → verify: computed correctly on fixtures.
- **W25** Telehealth invitation variant + config → verify: e2e.
- **W26** Q2 hardening: full review sweep, perf pass, docs → verify: zero criticals.

### Q3 — Integration (W27–W39)
- **W27** PMS adapter interface (read: slots, cancellations, patients, consent flags; contract-test suite any adapter must pass) → verify: synthetic adapter passes contract.
- **W28** Best Practice/Halo adapter skeleton behind flag (no credentials — G1): request/response mapping vs published API docs, recorded-fixture tests → verify: contract tests green on fixtures.
- **W29** HotDoc/HealthEngine booking deep-link adapters behind flags → verify: link-format tests.
- **W30** Late-cancellation fast path: near-real-time backfill invitations → verify: sim latency budget met.
- **W31** [P] Twilio adapter (sandbox only — G3 for live): delivery receipts, retry policy, STOP webhook → verify: sandbox integration tests.
- **W32** Identity & consent ingestion mapping (PMS → platform), consent provenance records → verify: mapping tests.
- **W33** [P] Data-retention + privacy controls: retention config, delete/export flows, ADM-transparency page (Privacy Act Dec 2026 requirement), privacy policy draft → verify: delete/export e2e.
- **W34** MBS context tables: item metadata (23/36/44, GPCCMP 965/967, bulk-billing incentives) for revenue estimation only → verify: revenue estimates match published rebates in tests.
- **W35** Pilot instrumentation: every metric in brief §Pilot wired (referral-to-appointment time, opt-outs, usefulness, DNA, incrementality) → verify: pilot report generates from sim.
- **W36** [P] Multi-PMS resilience: adapter failure isolation, stale-data guards → verify: chaos tests.
- **W37** Security pass 2 (security-review): token lifecycle, webhook auth, rate limits, secrets handling → verify: zero criticals.
- **W38** Integration hardening: contract-test both adapters vs fixture drift, error taxonomy → verify: suite green.
- **W39** Q3 gate dossier: G1–G3 readiness docs (what credentials are needed, exact activation steps) → verify: dossier complete; gates flagged to founder.

### Q4 — Pilot-ready (W40–W52)
- **W40** Pilot playbook: 12-week protocol, randomization SOP, practice onboarding checklist → verify: docs review.
- **W41** Practice onboarding wizard (self-serve config in <30 min) → verify: timed e2e.
- **W42** Incrementality dashboard v2 (practice-facing, plain-English) → verify: design QA + comprehension checklist.
- **W43** [P] Complaint/opt-out workflow: intake, triage, practice notification → verify: e2e.
- **W44** DNA analysis module: generated vs organic booking DNA comparison → verify: fixtures.
- **W45** Case-study generator: pilot data → publishable case study (de-identified) → verify: golden output.
- **W46** [P] Sales deck (pptx skill) + one-pager (docx) from brief + verified research figures → verify: assets produced, figures traceable.
- **W47** [P] Pricing & contract pack: tiered pricing doc, pilot agreement template, support runbook → verify: docs review.
- **W48** Load/perf: 100-practice scale simulation → verify: latency/cost budgets met.
- **W49** Accessibility pass (WCAG on console + booking pages) → verify: automated + manual checklist.
- **W50** Compliance dossier: Spam Act / APP 7 / Ahpra advertising / MBS-integrity posture as a living doc with per-feature mapping → verify: every user-facing surface mapped.
- **W51** Year-1 full-system review: fan-out audit (bugs/security/simplification), fix criticals → verify: audit report + green suite.
- **W52** Y2 expansion: derive Q5–Q8 week-units from §3 themes into this plan + BUILD-STATE (expansion rule, §6) → verify: 52 new units appended with verify gates.

## 6. Years 2–5 — quarterly themes + expansion rule

**Expansion rule:** the last week of each year (W52/W104/W156/W208) — and the first firing of each quarter if the ledger runs dry — expands the next quarter's theme into 13 concrete week-units with verify gates, appended to this plan (§5 extension) with matching rows in `BUILD-STATE.md`. Plans stay accurate because detail is derived just-in-time, informed by everything already built. Founder gates are inherited, never expanded away.

- **Y2 Q5** Care-gap registers: guideline interval tables as data (diabetes annual cycle, KHA CKD monitoring, GPCCMP quarterly reviews); register-driven eligibility. **Q6** Condition-targeted invitation modules + clinical-safety rails (never diagnostic language; G3 templates per condition). **Q7** Capability graph v1: per-GP case-mix + usefulness telemetry → interest/experience profiles; in-panel routing (right GP for the condition inside the practice). **Q8** Referral-leakage detection + group/multisite reporting + Y2 hardening.
- **Y3 Q9** Credential registry: evidence vault, verification workflow, Ahpra register checks, expiry tracking. **Q10** Pathway definition engine: inclusion/exclusion/escalation as versioned data + authoring UI for specialist reviewers (content itself = G5). **Q11** GP-to-GP referral rails: structured referral + return-report documents, escalation tracking. **Q12** Education engine v1: case-triggered curation (Claude API), CPD trail, pre-consult pathway updates — informs the GP, never replaces judgement (G7 boundary).
- **Y4 Q13** Cardiometabolic/early-CKD vertical assembly (pathways populated under G5). **Q14** Outcome auditing + escalation monitoring dashboards; specialist-agreement sampling. **Q15** Dermatology reference vertical + Ahpra-compliant network directory (G6 for launch). **Q16** PHN/health-system reporting pack + fee transparency + TGA/privacy compliance hardening.
- **Y5 Q17** Intervention-response graph + matching optimisation (deterministic eligibility first, learned ranking second). **Q18** Capacity forecasting + session-opening recommendations. **Q19** FHIR/e-referral interoperability + payer/insurer integrations. **Q20** Expansion verticals (women's health, respiratory), platform APIs, five-year review → next-horizon plan.

## 7. Definition of done (every unit)

`pnpm typecheck && pnpm test && pnpm build` green · verify gate stated in the unit passes · BUILD-STATE updated (done + SHA, or in-progress + continuation notes) · commit message references the unit ID · no founder gate crossed · one-line session log in Stefan-Brain `wiki/_log/` (skip-note in commit message if vault unavailable).

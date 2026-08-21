# Meherr — Five-Year Vibecoded Build Plan (v1, 2026-08-08)

> Canonical build plan. Executed by the `careyield-build-loop` (two offset hourly Claude Routines =
> one firing every 30 minutes, each firing = one build session = one week-unit advanced).
> Venture brief: `Stefan-Brain/wiki/entrepreneurship/startups/careyield.md`.
> Research base: `Stefan-Brain/wiki/entrepreneurship/startups/extended-scope-gp-network-research.md`.

---

## 0. Operating model

- **Unit of work = one plan week.** Each loop firing claims exactly one week-unit from the `BUILD-STATE.md` ledger (unit definitions: §5 below) via the claim protocol in that file, builds it to its verify gate, commits, and records the outcome. Long builds span multiple firings (status `in-progress` + continuation notes); parallel firings claim *different* units — that is the clash-protection design.
- **Verify gate is hard.** A unit is `done` only when its stated verification passes (`pnpm verify` — typecheck + tests + build + dependency-audit gate — at minimum). Partial work commits green (behind flags) with continuation notes — never a red main.
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
- **G8** — **PROPOSED at W104, awaiting founder ratification.** Third-party model processing: no patient-derived content, identified or not, is sent to any third-party model API until the founder has signed off the vendor, the data-flow and the retention terms. Proposed because Y3 Q12 is the first time anything would leave this tree to a third party, and no existing gate covers it — G2 governs holding real patient data, G5 governs clinical content, G7 governs CDSS, and none of them says whether de-identified case context may be transmitted to a model vendor at all. W146 and W147 are written to be buildable behind it; **the loop must not decide this itself.**
- **G9** — **PROPOSED at W156, awaiting founder ratification.** Third-party organisational reporting: no practice-identifiable data is disclosed to any third-party organisation until the founder has signed off the recipient, the aggregation level, and the practice's own consent to that specific disclosure. Proposed because Y4 Q16 is the first time anything about a PRACTICE leaves this tree to an external body — one that also commissions services from that practice — and no existing gate covers it: G2 governs holding real patient data, G6 governs public-facing copy, G8 governs model vendors. W202 and W203 are written to be buildable behind it; **the loop must not decide this itself.**
- **G10** — **PROPOSED at W208, awaiting founder ratification.** Payer and insurer data flows: no patient-linked data is exchanged with any payer or insurer until the founder has signed off the counterparty, the direction of flow, the minimum data set, and the patient's own consent to that specific exchange. Proposed because Y5 Q19 connects to payers, and no existing gate covers the relationship — G9 governs disclosure to a body that commissions services from the practice, and a payer differs from that in the way that matters: it has a financial interest in the individual patient's care and in whether that care happens at all. G1 governs credentials, G2 real patient data, G8 model vendors, and none of them says whether patient-linked clinical or claim data may flow to an insurer. W240 and W241 are written to be buildable behind it; **the loop must not decide this itself.**

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

## 5b. Year 2 weekly ledger (W53–W104) — Condition Yield

Expanded by W52 on 2026-08-09 per the §6 rule, from the Y2 themes in §3. Same contract as
§5: each unit is **build → verify**, `[P]` = parallel-safe. Founder gates are inherited, never
expanded away — G2/G3/G4 still gate real data, live SMS and pilots; G5 (clinical content
sign-off) becomes load-bearing here, because condition targeting is where clinical judgement
first enters the product. Two W51 process findings are units in their own right (W53, W54).

### Q5 — Care-gap registers (W53–W65)
- **W53** Add `pnpm audit` (moderate+) to the verify gate + CI, with an allowlist file for
  accepted-risk advisories carrying rationale + review date (W51 finding A2) → verify: gate
  fails on a seeded new advisory, passes with the current allowlist.
- **W54** Loop resilience: shorten the stale-claim window to 90 min when a claim holder is
  unreachable, and document a mixed-model builder fleet (W51 §Process) → verify: ledger doc
  updated + a stale-claim simulation test.
- **W55** Register schema: conditions, guideline intervals, register membership, provenance of
  every interval (source + date) → verify: migration + TS registry consistency test.
- **W56** Guideline interval tables as DATA (diabetes annual cycle of care; KHA-CARI CKD
  monitoring by stage; GPCCMP quarterly review cadence), each row citing its source → verify:
  every interval traceable to a cited source; no interval hardcoded in logic.
- **W57** Register membership engine: derive membership from PMS-ingested condition flags only
  (never inferred from symptoms — G7 boundary) → verify: unit tests incl. explicit non-inference.
- **W58** Care-gap detection: member + interval + last relevant visit → gap, with explicit
  "not a clinical recommendation" typing at the boundary → verify: fixtures per condition.
- **W59** Register-driven eligibility: care-gap as an *additional* eligibility input that can
  only ever narrow, never widen, the W4 rules → verify: property test — no gap makes an
  ineligible patient eligible.
- **W60** [P] Register console: practice sees its registers, intervals and gap counts; can
  disable any register per practice → verify: e2e + isolation test.
- **W61** Gap-aware pool ranking: gaps rank *within* eligibility (never override exclusions)
  → verify: property tests carried over from W5.
- **W62** [P] Register provenance UI: every interval shows its source and last-reviewed date
  → verify: no interval renders without provenance.
- **W63** Simulation: 26-week run with registers enabled vs disabled → verify: sim completes,
  invariants hold, comparative report generated.
- **W64** [P] Register analytics: gap-closure rate by condition, with the same holdout
  discipline as W9 → verify: golden fixtures.
- **W65** Q5 hardening: security-review + code-review sweep, docs → verify: zero criticals.

### Q6 — Condition-targeted invitations (W66–W78)
- **W66** Per-condition message templates + an extended compliance linter: condition context may
  never appear in patient-facing copy (the invitation stays availability-only) → verify: linter
  blocks every seeded condition-leak; existing W6 rules still enforced.
- **W67** Template approval workflow: practice-level written approval recorded per template
  version before any send → verify: unapproved template cannot be sent (fail-closed).
- **W68** Clinical-safety rails: per-condition exclusion sets (red flags that route to the usual
  GP instead of an invitation), authored as data → verify: exclusions honoured ahead of ranking.
- **W69** G5 authoring workspace: specialist reviewers draft/approve condition content;
  everything stays `blocked` until founder sign-off → verify: unapproved content is unusable.
- **W70** [P] Condition-aware guardrails: per-condition opt-out and complaint monitors → verify:
  thresholds trigger per condition in sim.
- **W71** Recall coexistence: never duplicate a practice recall already managing the same gap
  → verify: dedup tests against synthetic recall data.
- **W72** [P] Condition attribution: incrementality per condition cohort → verify: fixtures.
- **W73** Escalation triggers as data (to the usual GP, never to a diagnosis) → verify: trigger
  fixtures; no trigger emits clinical advice.
- **W74** [P] Patient-preference handling: contact-time and channel preferences honoured → verify: e2e.
- **W75** Condition simulation: multi-condition 26-week run → verify: invariants + report.
- **W76** [P] Practice reporting v2: gap closure + condition incrementality in the weekly report
  → verify: golden report.
- **W77** Compliance dossier update for every new surface (W50 living-doc rule) → verify: zero
  unmapped surfaces.
- **W78** Q6 hardening → verify: zero criticals.

### Q7 — Capability graph + in-panel routing (W79–W91)
- **W79** Capability graph schema: per-GP interest / experience / verified-competence as three
  DISTINCT fields (never conflated — venture brief §5) → verify: migration + consistency test.
- **W80** Case-mix telemetry: derive experience from attended-visit condition mix + W15
  usefulness signal → verify: fixtures; no self-reported data promoted to experience.
- **W81** Interest capture: GP states preferred case mix in the console → verify: e2e.
- **W82** Competence threshold: interest may influence ranking ONLY after a competence floor is
  met (brief §5 law) → verify: property test — enthusiasm never outranks the floor.
- **W83** [P] Capability console: GP sees their own profile; practice sees the panel view → verify: e2e + isolation.
- **W84** In-panel routing engine: right GP for the condition *inside the practice* → verify:
  routing fixtures; usual-GP continuity preserved unless the practice opts otherwise.
- **W85** Continuity guardrail: routing may not degrade the W24 usual-GP continuity index below
  a practice-set floor → verify: sim comparison.
- **W86** [P] Routing explainability: every routing decision renders its reason to the practice
  → verify: no unexplained routes.
- **W87** Routing simulation: routed vs unrouted 26 weeks → verify: invariants + report.
- **W88** [P] Capability graph provenance + review dates → verify: stale profiles flagged.
- **W89** Specialist-supervision hooks (design only, G5-gated) → verify: docs + blocked rows.
- **W90** [P] Y2 gate dossier refresh (G2–G5 readiness) → verify: dossier complete.
- **W91** Q7 hardening → verify: zero criticals.

### Q8 — Referral leakage, multisite, Y2 close (W92–W104)
- **W92** Referral capture: referrals written but not completed, from PMS-ingested data → verify: fixtures.
- **W93** Leakage detection: referral → appointment → completion state machine → verify: replay tests.
- **W94** [P] Barrier taxonomy as data (cost, timing, transport, uncertainty) — recorded, never inferred → verify: no inference tests.
- **W95** Leakage outreach: availability-only nudges within the same compliance rails → verify: linter + e2e.
- **W96** [P] Leakage reporting for the practice → verify: golden report.
- **W97** Multisite tenancy: group-level roles, cross-site reporting, per-site isolation → verify: isolation tests at group scale.
- **W98** [P] Group rollout tooling: onboard N sites from one config → verify: timed e2e.
- **W99** Scale simulation: 500-practice projection → verify: latency/cost budgets.
- **W100** [P] Y2 case-study generator update → verify: golden output.
- **W101** Accessibility re-run (post-G2 requirement from W49) → verify: axe zero violations.
- **W102** [P] Y2 compliance dossier + privacy review (ADM transparency now in force) → verify: every surface mapped.
- **W103** Y2 full-system audit (W51 method: whole tree, not a diff) → verify: audit report + green suite.
- **W104** Y3 expansion: derive Q9–Q12 (Scope Yield foundations) into §5c + BUILD-STATE → verify:
  52 new units appended with verify gates; founder gates inherited intact.

## 5c. Year 3 weekly ledger (W105–W156) — Scope Yield foundations

Expanded by W104 on 2026-08-10 per the §6 rule, from the Y3 themes in §6. Same contract:
each unit is **build → verify**, `[P]` = parallel-safe. Founder gates are inherited, never
expanded away.

**What Year 2 leaves on the table, and where it lands here.** Three things are derived from
what was actually built rather than from the theme, because a just-in-time plan that ignores
its own audit findings is not just-in-time:

1. **G5 stops being deferrable in Q10.** W56's guideline intervals and W69's authoring
   workspace have been blocked since Q5, and Q10's pathway engine is the same question at ten
   times the scale. The engine is buildable without the ruling — mechanism ships empty, the
   W68/W69 pattern — but Q10 delivers an empty product without it, so the ruling is scheduled
   as a dependency, not a hope.
2. **The first live quarter will be integration, not features.** W28/W29/W36's send path is
   still unwired, so W74's contact preferences and W95's outreach plans are captured and inert
   (W103 observation 4). Q9 opens with the deferred privacy work rather than new surface, and
   nothing in Y3 assumes a send path exists until G3 opens.
3. **Two dated failures fall inside Q9** and are units, not surprises: the audit allowlist
   expires 2026-11-09 (W107) and APP 1.7 commences 2026-12-10, which is the deadline for
   W105/W106.

**Proposed new gate, for founder ratification — G8: third-party model processing.** Q12 sends
content to the Claude API, which is the first time anything leaves this tree to a third party.
Existing gates do not cover it: G2 governs holding real patient data, G5 governs clinical
content, G7 governs CDSS, and none of them says whether de-identified case context may be
transmitted to a model vendor at all. Proposed wording: *no patient-derived content, identified
or not, is sent to any third-party model API until the founder has signed off the vendor, the
data-flow and the retention terms.* W144, W146 and W147 are written to be buildable behind it;
**the loop must not decide this itself.**

### Q9 — Credential registry + evidence vault (W105–W117)
- **W105** Close PRIV-1: access control for the community interest register — a Meherr-staff role, or move the register out of the practice console → verify: a practice user can neither read nor export it; e2e. **Deadline 2026-12-10 (APP 1.7).**
- **W106** Close PRIV-2: APP 12 export and APP 11 retention cover every Y2 record class (register membership, referrals, barriers, capability) → verify: an access request returns them all, retention prunes them, and the test enumerates the record classes so a NEW class fails the suite until it is handled. **Deadline 2026-12-10.**
- **W107** [P] Dependency allowlist review ahead of the 2026-11-09 expiry → verify: `audit:gate` green with no acceptance past its review date, and no acceptance extended without a fresh rationale.
- **W108** Credential record model: issuer, scope, evidence, verified-by, expiry — provenance required by the type (W79 pattern) → verify: no credential is representable without a verifier and a date.
- **W109** Evidence vault: documents attached to a credential → verify: isolation tests; no route serves an evidence document without authorization; nothing public (G6).
- **W110** [P] Verification workflow: submitted → checked → verified → expired, recording who checked → verify: replay; self-verification refused (the W69 rule).
- **W111** Ahpra register check adapter: read-only lookup, recorded never inferred → verify: live-host refusal in the constructor (G1/G3 shape); fixtures only; instantiated nowhere outside tests.
- **W112** Expiry and re-attestation: W88's void-not-stale rule applied to credentials → verify: an expired credential is ABSENT, never weak evidence; no-stated-expiry does not mean never expires.
- **W113** [P] Credential console: a clinician sees and can correct their own record → verify: e2e + axe zero violations.
- **W114** Scope statements: what a credential permits, as data → verify: the W23/W6 linters reach every scope label; "specialist" cannot appear next to a niche scope (s 133).
- **W115** [P] Credential provenance report for the practice → verify: golden report; states its own coverage; ranks no clinician.
- **W116** Q9 hardening (code-review + security-review + the W103 scoping sweep) → verify: zero criticals.
- **W117** Q9 gate dossier: the G6 position on credential visibility, decided before Q11 routes on it → verify: dossier complete; founder actions named.

### Q10 — Pathway definition engine (W118–W130) — **G5 load-bearing throughout**
- **W118** Pathway as versioned data: inclusion, exclusion and escalation criteria → verify: a published version is immutable; edits create a new version; replay reproduces any version.
- **W119** [P] Pathway authoring workspace, extending W69's three-stage gate to pathways → verify: unapproved pathway unusable by TYPE, not by check; ships with zero pathways signed.
- **W120** Criteria evaluation: evaluate a pathway against RECORDED facts only → verify: export-list test — no function takes symptoms and returns a pathway (G7).
- **W121** Escalation rules as data, shipping empty (W68 posture) → verify: a test pins the shipped rule set at zero.
- **W122** [P] Pathway diffing: what changed between two versions, in clinician-readable form → verify: golden diff; no change is renderable without its author and date.
- **W123** Pathway–capability binding: which clinicians a pathway may be offered under → verify: in-panel only; a foreign practice's capability record is absent (W91/W103).
- **W124** [P] Pathway simulation over synthetic cohorts → verify: determinism; the report asserts no clinical verdict, only distribution.
- **W125** Consent and record-of-decision: what the patient agreed to, recorded never inferred → verify: fixtures; no default consent.
- **W126** [P] Pathway audit trail on the W10 event spine → verify: replay reproduces every state transition.
- **W127** Content sign-off dashboard: which pathways are signed, by whom, when → verify: e2e; zero signed at ship, and the dashboard says so rather than rendering empty.
- **W128** Pathway withdrawal: retiring a published version → verify: withdrawal is immediate and terminal for that version; re-publication is a fresh act (W67 shape).
- **W129** Q10 hardening → verify: zero criticals.
- **W130** [P] Y3 gate dossier refresh, G5 now load-bearing → verify: dossier complete; the G5 ruling's consequences traced through every blocked row.

### Q11 — GP-to-GP referral rails (W131–W143)
- **W131** Structured referral document model → verify: schema fixtures; no free-text clinical field that bypasses the content gate.
- **W132** Return report model: what comes back, structured → verify: a recorded return closes W93's `attended_no_completion` stage on replay.
- **W133** [P] Referral routing to an extended-scope GP, in-network only → verify: never crosses G6; W82's capability floor honoured; foreign records absent.
- **W134** Acceptance protocol: a receiving GP must ACCEPT before becoming a party to the patient's care — the W89 hook-3 line, in code → verify: no patient-linked obligation exists without a recorded acceptance.
- **W135** [P] Referral status tracking wired to W93's state machine → verify: replay; no inference from silence.
- **W136** Loop closure: a completed return report stops W95 outreach for that chain → verify: the outreach plan withholds with a reason, and the reason is the completion.
- **W137** [P] Referral console for both sides → verify: e2e + axe zero violations + cross-practice isolation.
- **W138** Responsibility and indemnity posture, as code and copy → verify: no surface implies Meherr is a party to clinical care (W89).
- **W139** [P] Referral compliance linter → verify: no clinical claim in any referral-adjacent patient-facing copy; W6's rules applied, not re-implemented.
- **W140** Cross-practice referral isolation → verify: the W103 scoping sweep run as this unit's gate, with every hit triaged in writing.
- **W141** [P] Referral analytics for the practice: process, never people → verify: golden report; no patient ranking, coverage stated (W96 shape).
- **W142** Q11 hardening → verify: zero criticals.
- **W143** [P] Q11 gate dossier: the G6/G7 position on GP-to-GP routing → verify: dossier complete.

### Q12 — Education engine v1 (W144–W156) — **behind proposed gate G8**
- **W144** Education engine boundary document, written BEFORE any code (W89 pattern) → verify: doc review; the G5/G7/G8 lines argued rather than asserted, and the incremental path to a regulated clinical service named so a later unit cannot arrive there by extension.
- **W145** Curation over generation: the engine SELECTS from signed-off content and never writes clinical text → verify: export-list test — no generation entry point exists.
- **W146** [P] De-identification gate on anything leaving the tree → verify: fail-closed; no patient identifier can reach an API, asserted at the boundary rather than by convention. **Blocked on G8.**
- **W147** Claude API adapter behind the gate → verify: constructor refuses live endpoints until G8 opens (G1/G3 shape); instantiated nowhere outside tests. **Blocked on G8.**
- **W148** Case-trigger rules as data, over recorded facts only → verify: no symptom inference (G7); rules shipped empty.
- **W149** [P] CPD trail: what a GP read and when, exportable → verify: fixtures; the record belongs to the clinician and is correctable by them.
- **W150** Pre-consult pathway updates: informs the GP, never recommends → verify: a copy linter bans recommendation language on every education surface.
- **W151** [P] Education console → verify: e2e + axe zero violations.
- **W152** Provenance on every item: traceable to signed-off source → verify: an item with no source is unrenderable BY TYPE (W69 branding pattern).
- **W153** [P] Prompt-injection posture for ingested clinical content → verify: security-review; content read from a PMS or a document cannot alter system behaviour.
- **W154** Q12 hardening → verify: zero criticals.
- **W155** Y3 full-system audit (W51 method: whole tree, not a diff) → verify: audit report + green suite.
- **W156** Y4 expansion: derive Q13–Q16 into §5d + BUILD-STATE → verify: 52 new units appended with verify gates; founder gates inherited intact.

## 5d. Year 4 weekly ledger (W157–W208) — Network launch

Expanded by W156 on 2026-08-11 per the §6 rule, from the Y4 themes in §6. Same contract: each
unit is **build → verify**, `[P]` = parallel-safe. Founder gates are inherited, never expanded
away.

**What Year 3 leaves on the table, and where it lands here.** Five things are derived from what was
actually built and from `docs/AUDIT-Y3.md`, because a just-in-time plan that ignores its own audit
is not just-in-time.

1. **G5 is no longer a scheduling problem, it is the product.** Year 3 shipped nine `SHIPPED_*`
   registries, all empty and pinned by tests, plus every mechanism to fill them: W69's authoring
   workspace, W119's two-person sign-off, W152's unrenderable-without-a-source branding. Q13's
   theme is *content*. Unlike Q10 — which could ship an engine and call the emptiness a gate —
   **there is no mechanism gap left to build in front of the ruling.** So Q13 splits explicitly:
   the assembly machinery ships and is exercised against synthetic placeholder verticals, and
   every unit that would author cardiometabolic or CKD content is `blocked` from the outset
   (W161–W163). Q13 delivers an empty vertical without G5, and this plan says so rather than
   discovering it in week eleven.
2. **Nothing has ever been sent, and Q14 is about outcomes.** The send path has been unwired since
   W28/W29/W36; Y3's plan promised nothing would assume it until G3, and nothing did. Outcome
   auditing therefore audits the **recorded rail** — bookings, referrals, returns, escalations —
   and the message-outcome half is `blocked` (W174). A dashboard that measures the effect of
   interventions nobody sent would show zeros and call it monitoring.
3. **The console still cannot represent two practices** (Y2 finding B2, restated as Y3 audit item
   6 and open for two years). It was an annoyance while every surface was single-tenant. Q15's
   directory and Q16's PHN reporting are both inherently cross-practice, so it moves onto the
   critical path and gets an early unit (W166) rather than another audit note.
4. **The order-dependence class is now eight instances** (W123, W129, W137, W142, two caught
   pre-emptively in Q11, and Y3-1/Y3-2). Y3's audit turned it into a stated rule. A rule that
   depends on the next reviewer remembering it is the control this tree has watched fail before,
   so W167 makes it mechanical, in the W102/W140/W150/W153 shape.
5. **One dated failure falls inside Q13** and is a unit, not a surprise: both audit-allowlist
   acceptances carry `reviewBy: 2026-11-09` and `audit:gate` starts failing that morning (W165).

**G8 is still unratified at the close of Year 3.** W146/W147 remain `blocked`, and W153's scanner
fails the day any adapter lands without the ruling. Nothing in Year 4 assumes model processing.

**Proposed new gate, for founder ratification — G9: third-party organisational reporting.** Q16
sends practice-level data to PHNs and health systems, which is the first time anything about a
*practice* leaves Meherr to an external organisation. Existing gates do not cover it: G2 governs
holding real patient data, G6 governs public-facing directory copy, G8 governs model vendors, and
none says whether a practice's own performance data may be transmitted to a funder or health
system at all — a body that also commissions services from that practice. Proposed wording: *no
practice-identifiable data is disclosed to any third-party organisation until the founder has
signed off the recipient, the aggregation level, and the practice's own consent to that specific
disclosure.* W202 and W203 are written to be buildable behind it; **the loop must not decide this
itself.**

### Q13 — Cardiometabolic + early-CKD vertical assembly (W157–W169) — **G5 load-bearing; the content units are blocked from day one**
- **W157** Vertical model: a named bundle of pathways, registers, intervals and education items, versioned as one → verify: a vertical is unusable unless every member is usable — W119/W152's branding COMPOSED, not re-implemented — and a vertical with one unsigned member is refused with the member named.
- **W158** [P] Vertical completeness report: what a vertical would need before it could ship → verify: golden report over a synthetic vertical; states its own coverage; asserts zero real clinical content present.
- **W159** Cross-member consistency: two pathways in one vertical whose criteria disagree → verify: the contradiction is DETECTED and REPORTED, never silently resolved — and the resolver reads the detection (Y3-1's corollary).
- **W160** [P] Vertical versioning and migration: a practice bound to v1 when v2 publishes → verify: the bound practice stays on the version it accepted; no silent upgrade; W128's withdrawal semantics inherited rather than restated.
- **W161** Cardiometabolic pathway content → verify: two-person sign-off recorded per W119. **Blocked on G5.**
- **W162** Early-CKD pathway content → verify: as W161. **Blocked on G5.**
- **W163** [P] Cardiometabolic/CKD interval values — W56's question at vertical scale → verify: every interval carries a citation and a review date. **Blocked on G5.**
- **W164** [P] Vertical console: which verticals exist and what each still needs → verify: e2e + axe zero violations; the zero state SAYS why it is empty rather than rendering a blank grid (W127's rule).
- **W165** [P] Dependency allowlist review before the 2026-11-09 expiry → verify: `audit:gate` green with no acceptance past its review date, and no extension without a fresh rationale recorded against the advisory.
- **W166** Two-practice console: `ConsoleState` holds a set and the hardcoded `prac-console` literal goes → verify: the console renders two practices, and the scoping assertions impossible since Y2 finding B2 now run end-to-end.
- **W167** [P] Order-dependence made mechanical: a shared "two records tying on the sort key, both orders, same answer" property helper, plus a declared register of every module that folds a collection to one answer → verify: the register is checked against the tree, and a new fold site fails the suite until it carries a tie-break test or a written rationale.
- **W168** Q13 hardening (code-review + security-review) → verify: zero criticals.
- **W169** Q13 gate dossier: what G5 now costs, priced → verify: dossier names exactly which units unblock, in what order, and what the product gains on the day the ruling lands.

### Q14 — Outcome auditing + escalation monitoring (W170–W182)
- **W170** Outcome model: what "this went somewhere" means, as a chain of recorded facts → verify: every outcome traces to recorded events; nothing is concluded from silence (W120's three-valued rule inherited).
- **W171** [P] Escalation monitoring over time: W121's unrouted escalations, aged → verify: an unrouted escalation stays visible and ages; the absence of an escalation is never reported as "none needed".
- **W172** Specialist-agreement sampling: did the reviewer agree with the pathway's verdict? → verify: the sample is seeded and reproducible so it cannot be chosen to flatter, and disagreement renders with equal prominence to agreement.
- **W173** [P] Outcome dashboard → verify: e2e + axe zero violations; states its own denominator; ranks no clinician (W83's floor).
- **W174** Message-outcome auditing: did an invitation lead anywhere? → verify: outcomes trace to delivery receipts. **Blocked on G3 — nothing has ever been sent.**
- **W175** Holdout integrity at vertical scale → verify: holdout membership is stable across a vertical version change; a migration cannot move a practice between arms.
- **W176** [P] Time-to-escalation reported, never targeted → verify: no threshold, target or SLA exists anywhere in the module (export-list + copy assertions); the copy states why a target would change clinical behaviour.
- **W177** Practice audit-trail export → verify: golden export that carries its own caveats where it travels away from the product that explains it (W149's pattern).
- **W178** [P] Regression corpus: the eight order-dependence findings as a permanent fixture set → verify: each historical defect has a test that fails against its own pre-fix behaviour, proven by reverting each fix once.
- **W179** Zero-because-nothing-happened is not zero-because-nothing-arrived → verify: a dead feed and a quiet week render as DIFFERENT states, because they lead an operator to opposite actions (W127's lesson, applied to live data).
- **W180** [P] Q14 privacy pass: outcome records against W106's registry → verify: every new record class declared with its handling, and erasure composed rather than remembered.
- **W181** Q14 hardening → verify: zero criticals.
- **W182** Q14 gate dossier: what G3 now costs, priced → verify: names what opens on the day, and what stays shut.

### Q15 — Dermatology reference vertical + network directory (W183–W195) — **G6 load-bearing**
- **W183** Directory profile model: what a public profile may contain → verify: the type admits no rating, no testimonial and no free-text endorsement; a niche scope beside the word "specialist" is unrepresentable rather than linted out.
- **W184** [P] Directory copy linter over every field a profile can emit → verify: W6/W114's rules APPLIED not re-implemented, and the emitting fields are checked against the tree so a new one fails until it is declared.
- **W185** Public directory launch → verify: Ahpra advertising review passed; every profile field traced to a reviewed claim. **Blocked on G6.**
- **W186** Dermatology pathway content → verify: two-person sign-off per W119. **Blocked on G5.**
- **W187** [P] Stating an extended scope without implying a specialty → verify: s 133 compliance asserted on rendered copy; the compile-time guarantee from W183 exercised by a `@ts-expect-error` case.
- **W188** Network membership: who is in the network and on what basis → verify: membership is a recorded practice decision, never inferred from activity (W57's rule); no clinician is ranked.
- **W189** [P] Directory search that does not select a clinician for a patient → verify: results are ordered by declared, checkable attributes only; no symptom input exists (G7); the ordering basis is stated and describes the order actually used (W151's rule).
- **W190** Profile correction rights: a clinician can correct what the directory says about them → verify: every control reduces or corrects a claim; none adds one (W113's rule).
- **W191** [P] Dermatology vertical assembly against W157's model → verify: the vertical is refused while its content is unsigned, with the missing member named.
- **W192** Directory accessibility and copy sweep → verify: axe zero violations on every public surface; no clinical claim on any of them.
- **W193** [P] Q15 privacy pass: a public profile is a disclosure → verify: what leaves the tenancy is enumerated, and a clinician's non-directory data cannot reach a public surface by type.
- **W194** Q15 hardening → verify: zero criticals.
- **W195** Q15 gate dossier: the G6 decision, priced → verify: dossier names what launches, what stays internal, and which Y3 units (W117, W133) unblock with it.

### Q16 — PHN/health-system reporting, fee transparency, compliance hardening (W196–W208) — **proposes G9**
- **W196** Reporting model: what a PHN or health system may be told → verify: every figure traces to a recorded fact; no figure identifies a patient; aggregation floors are declared as data, not chosen per report.
- **W197** [P] Small-cell suppression → verify: a cohort below the declared floor is suppressed rather than rounded, and suppression is stated in the report rather than left as a gap (W145's "named, not omitted" rule).
- **W198** Fee transparency: what a practice charges, stated plainly → verify: no comparison, no ranking, no "value" language; the copy linter reaches every fee field.
- **W199** [P] Reporting console + export → verify: golden report; e2e + axe zero violations; the report states its own coverage and denominator.
- **W200** TGA CDSS boundary re-review at vertical scale → verify: security/compliance review; the four rail properties plus W150's fifth re-derived against everything Y4 added, not assumed to have survived.
- **W201** [P] APP/ADM transparency refresh: the automated-decisions page against what the software now decides → verify: the page enumerates every decision the tree makes, checked against the source rather than written from memory.
- **W202** Practice consent to disclosure: a practice decides what leaves it → verify: fail-closed; no report can be produced for a recipient the practice has not consented to. **Blocked on G9.**
- **W203** PHN/health-system delivery → verify: recipient allowlist; constructor refuses live endpoints until the gate opens (G1/G3 shape). **Blocked on G9.**
- **W204** [P] Retention and deletion for reporting artefacts → verify: a produced report is itself a record class in W106's registry, with a stated life.
- **W205** Q16 hardening → verify: zero criticals.
- **W206** Y4 full-system audit (W51 method: whole tree, not a diff) → verify: audit report + green suite.
- **W207** Y4 gate dossier: G5, G6 and proposed G9 in one place → verify: every outstanding founder decision priced, with the units each unblocks named.
- **W208** Y5 expansion: derive Q17–Q20 into §5e + BUILD-STATE → verify: 52 new units appended with verify gates; founder gates inherited intact.

## 5e. Year 5 weekly ledger (W209–W260) — Intelligence & scale

Expanded by W208 on 2026-08-11 per the §6 rule, from the Y5 themes in §6. Same contract: each
unit is **build → verify**, `[P]` = parallel-safe. Founder gates are inherited, never expanded
away — and §4 now carries a tenth, proposed below.

**What Year 4 leaves on the table, and where it lands here.** Derived from what was actually
built, from `docs/AUDIT-Y4.md` and from `docs/GATE-DOSSIER-Y4.md`, because a just-in-time plan
that ignores its own audit is not just-in-time.

1. **THE HEADLINE OF Y5 COLLIDES WITH A PUBLISHED LEGAL NOTICE, AND THE PLAN SAYS SO NOW RATHER
   THAN IN WEEK NINE.** §6 wrote Q17 in Year 1 as "matching optimisation (deterministic
   eligibility first, learned ranking second)". Since then W201 published the ADM-transparency
   statement, and its *never automated* list says: **"No ordering of patients by need or by how
   unwell they are, and no list of who is most at risk."** A learned ranker over patients is that
   sentence. It is also close to G7's line, which is why W83 refused ranking clinicians and W61
   ranks only on explainable factors. So Q17 delivers the response graph and deterministic
   matching, W216 prices the question, and **W217 is `blocked` from day one on a founder decision
   the loop must not take** — one that would require changing a published notice, not merely a
   config. This is the Q13 lesson applied earlier: a unit that cannot ship is scheduled as
   blocked, not discovered blocked.
2. **The response graph has no responses.** Nothing has ever been sent — G1/G2/G3 unresolved
   since Year 1, W174 still blocked — so an intervention-response graph over sent interventions is
   a graph over zero rows. Same posture as Q14: the structure ships, it is exercised against W12's
   synthetic harness, and every figure states its own basis (W196's rule) so a demo cannot be
   mistaken for evidence.
3. **PRIV-3's sweep is unfinished and its severity has changed.** Y4-1 was a HIGH cross-tenant
   leak — every practice could read every other practice's complaints — created when W166 made two
   practices real and converted a dormant `"prac-console"` literal into a live disclosure. The
   audit did not reach `src/audit/store.ts`. W209 finishes the sweep in week one, on the argument
   §5d used for W166: a cross-practice product puts single-tenant assumptions on the critical path.
4. **A RECORDED FINDING IS NOT A CLOSED ONE, and Y4-1 is the proof.** PRIV-3 recorded half the
   problem in Year 2 and sat `available` for two years. What was never written down is what the
   literal would *do* once multi-practice landed — so nothing announced itself when the modelling
   gap became a disclosure. W210 makes that mechanical: a recorded finding carries the condition
   that would make it live, and the suite fails when the condition becomes true. This is the
   W102/W150/W168 shape applied to findings instead of to code.
5. **Six founder decisions are outstanding at the start of Y5 and four of them wait on gates
   nobody has ruled on** (`docs/GATE-DOSSIER-Y4.md`). Y5 is planned so it does not stall on any of
   them: every unit that needs a ruling is `blocked` in this expansion rather than half-built, and
   the quarter dossiers (W216, W232, W245, W257) re-price rather than re-argue.
6. **The plan runs out at W260.** The five-year arc ends inside Q20, so W260 writes the
   next-horizon plan and renews the expansion rule itself — the one week where the rule has to
   describe its own succession.

**W156 checked the last expansion by hand** and wrote "plan and ledger checked unit-for-unit" in
its commit message. W168 exists because the previous hand-checked ledger property — no gaps, no
duplicates — broke silently the moment nobody was looking. The expansion property is the same
class, so W208 ships `src/quality/plan-ledger.test.ts`: the plan and the ledger must name the same
units in both directions, every planned unit must state a verify gate, and **every gate a blocked
row names must be defined in §4** — which is "founder gates inherited, never expanded away" made
mechanical instead of promised.

**Proposed new gate, for founder ratification — G10: payer and insurer data flows.** Q19 connects
to payers and insurers, and no existing gate covers it. G9 governs disclosure to a third-party
*organisation* that commissions services from the practice; a payer is a different relationship,
because it has a financial interest in the individual patient's care and in whether that care
happens. G1 governs credentials for reading a practice's own systems, G2 real patient data, G8
model vendors — none says whether patient-linked clinical or claim data may flow to an insurer at
all. Proposed wording: *no patient-linked data is exchanged with any payer or insurer until the
founder has signed off the counterparty, the direction of flow, the minimum data set, and the
patient's own consent to that specific exchange.* W240 and W241 are written to be buildable behind
it; **the loop must not decide this itself.** Proposed here on the W104/W156 precedent: the
expansion unit proposes the gate for the year it is expanding.

### Q17 — Intervention-response graph + deterministic matching (W209–W221) — **the learned half is blocked from day one**
- **W209** PRIV-3 completion: finish the practice-scoping sweep Y4-1 started, `src/audit/store.ts` and every remaining unscoped store read → verify: every exported store read either takes a practice or is declared cross-practice with the erasure reason (W106's shape), checked both directions; Y4-1's non-vacuity method reused — unscope the read and watch named tests fail.
- **W210** [P] Latent-finding register: a recorded finding carries the condition that would make it live → verify: PRIV-3's two-year history is the fixture; a finding whose trigger condition is now true fails the suite, and a finding with no stated trigger is refused.
- **W211** [P] Intervention-response model: what a response to an intervention IS, as recorded facts → verify: no response can be constructed without the intervention it answers; an absent response is `not_recorded` and never "no response" (W170's rule inherited, not restated).
- **W212** Response graph over the synthetic harness → verify: golden graph over W12's sim; asserts zero real interventions; every edge states the recorded facts it rests on (W196's basis rule).
- **W213** [P] Matching explainability floor, built BEFORE any optimisation exists → verify: W86's total-explanation posture extended to matching — every decision renders its reason, no fallback branch, adding a reason without copy fails to typecheck.
- **W214** Deterministic matching v2: multi-constraint slot assignment that never orders patients by need → verify: assignment is order-independent (entered in W167's fold register); a patient's position never depends on a clinical attribute, asserted structurally rather than by inspection.
- **W215** [P] Counterfactual accounting: what would have happened without the intervention → verify: the holdout arm is the only comparator; no model-based counterfactual exists as a function; the figure refuses over a cohort below W72's floors.
- **W216** Q17 dossier: the learned-ranking question, priced → verify: names the collision with W201's published ADM statement and with G7, states what a ruling would release and what it would cost, and takes no position; counts pinned by a test in W207's shape.
- **W217** Learned ranking of patients → verify: n/a until ruled. **Blocked. FOUNDER DECISION — Q17 action 1, recorded in docs/GATE-DOSSIER-Q17.md: whether the product may order patients by anything a model learns, which would require changing the published ADM notice.**
- **W218** [P] Response-graph privacy classification → verify: W106's record classes extended in the same commit; the graph holds no patient identity it does not need, and erasure reaches every class it does.
- **W219** Intervention attribution v2 over the response graph → verify: cohort-level only; per-patient effect estimates are refused BY ABSENCE — no function exists, asserted on the module namespace.
- **W220** [P] Q17 console: the response graph as a practice reads it → verify: e2e + axe; no clinical claim; the empty state distinguishes nothing happened from nothing recorded (W179).
- **W221** Q17 hardening → verify: code-review + security-review skills; every new register checked both directions; W201's ADM register re-derived against anything Q17 added.

### Q18 — Capacity forecasting + session-opening recommendations (W222–W234)
- **W222** [P] Capacity model: sessions, slots and recorded utilisation → verify: over the synthetic practice; a session with no recorded history yields no forecast rather than a default.
- **W223** Forecast as a stated interval, never a point — "open 6 slots Thursday → 4 to 6 fill" → verify: every forecast carries its basis and its uncertainty, and refuses below a floor of recorded weeks rather than emitting a confident number over thin data (W196's zero argument).
- **W224** [P] Forecast honesty: every forecast is scored against what actually happened → verify: back-test over the sim; the score is recorded and rendered beside the forecast, so a forecaster that is usually wrong cannot present as one that is usually right.
- **W225** Session-opening recommendation, addressed to the PRACTICE about its own diary → verify: no patient id can enter the recommendation type; asserted as an absence, not a filter.
- **W226** [P] Recommendation copy and refusals → verify: compliance linter; W201's ADM register updated in the same commit, which is the rule W201 made mechanical rather than hopeful.
- **W227** Seasonality and public holidays as declared data with a source → verify: nothing seasonal is inferred from the practice's own history; the calendar is data with provenance, W56's shape.
- **W228** [P] Forecast drift monitor → verify: a forecaster that has stopped tracking reality is REPORTED, never silently recalibrated (W120's rule: report the disagreement, do not resolve it).
- **W229** Capacity console → verify: e2e + axe; empty states distinguish no data from no capacity.
- **W230** [P] Q18 privacy pass → verify: W106 classification; a forecast is practice-level and no figure can identify a patient, by type rather than by scrubbing.
- **W231** Forecast → invitation-volume coupling, shipped explicitly OFF → verify: the coupling exists as a declared, disabled control; enabling it is a practice decision recorded with a reason, and the disabled state is pinned by its own test.
- **W232** [P] Q18 dossier: what a forecast implies operationally, priced → verify: states what changes the day a practice acts on one.
- **W233** Capacity attribution: did opening slots help? → verify: holdout-based only; refuses to answer without an arm rather than answering from the trend.
- **W234** Q18 hardening → verify: review skills; registers both directions; zero criticals.

### Q19 — FHIR/e-referral interoperability + payer integrations (W235–W247) — **proposes G10**
- **W235** [P] FHIR R4 resource mapping as data → verify: round-trip over synthetic records; an unmapped field is NAMED in the output rather than dropped silently.
- **W236** e-referral document profile → verify: W131's structured referral rendered to the profile; no clinical text is authored, generated or edited by this tree (G7's fourth property re-derived at the boundary).
- **W237** [P] Interop conformance harness → verify: contract tests against recorded synthetic fixtures in W27/W28's shape; no live endpoint exists to call.
- **W238** Terminology binding (SNOMED CT-AU, LOINC) as declared data → verify: every code carries provenance; an unbound code is refused rather than guessed, and the refusal names the code.
- **W239** [P] Outbound disclosure ledger → verify: what left, to whom and when; W204's unresolved question — whether the log holds the FIGURES or only the fact of sending — is named in the module and left to the founder, with the model built so either answer is a one-line change.
- **W240** Payer/insurer integration model → verify: n/a until ratified. **Blocked. FOUNDER GATE G10.**
- **W241** Payer claim-status read → verify: n/a until ratified. **Blocked. FOUNDER GATE G10.**
- **W242** [P] Interop credentials posture → verify: no credential in the tree; the loader enforces the gate rather than the values doing it (W56's shape); G1 named as the blocker for anything live.
- **W243** Consent-to-disclose model → verify: a disclosure without a recorded patient consent is refused BY TYPE; silence is never consent (W135), and no timeout grants it (W134).
- **W244** [P] Interop error semantics → verify: a failed or unacknowledged exchange is `unknown`, never "delivered" — W170's rule applied at the one boundary where the tree cannot see the other side.
- **W245** Q19 dossier: G10 priced → verify: what G10 releases, what it costs, and what it does not cover; counts pinned by a test.
- **W246** [P] Interop console → verify: e2e + axe; shows what was exchanged and, more importantly, what was not.
- **W247** Q19 hardening → verify: security-review skill over every new boundary; the disclosure ledger's own W106 classification.

### Q20 — Expansion verticals, platform APIs, five-year review (W248–W260) — **G5 load-bearing for the content units**
- **W248** [P] Women's health vertical assembly, machinery only → verify: W157's model reused, not re-implemented; the vertical is refused with each missing member named; asserts zero clinical content present.
- **W249** Women's health pathway content → verify: two-person sign-off recorded per W119. **Blocked. FOUNDER GATE G5.**
- **W250** [P] Respiratory vertical assembly, machinery only → verify: same machinery; W158's completeness report states exactly which members are missing and who must act.
- **W251** Respiratory pathway content → verify: two-person sign-off recorded per W119. **Blocked. FOUNDER GATE G5.**
- **W252** [P] Vertical scaling: the registers at N verticals → verify: order-independence and a stated time budget over 20 synthetic verticals; the budget is asserted in the test body, W48's shape.
- **W253** Platform API surface, read-only and practice-scoped → verify: every endpoint takes a practice as the QUERY (W123's rule); no endpoint can return cross-practice data, asserted the way Y4-1 should have been.
- **W254** [P] API scope model → verify: scopes are declared data checked against the endpoint census in both directions; no production credential enters the tree.
- **W255** API refusal semantics → verify: no patient data on any error path, asserted over every refusal branch rather than sampled.
- **W256** [P] Five-year full-system audit (W51 method: the whole tree, not a diff) → verify: every sweep re-run from source rather than carried from AUDIT-Y4; independence of the reviewer stated plainly.
- **W257** Five-year gate dossier: every decision still outstanding, priced → verify: counts derived from the ledger and pinned row-by-row by a test, W207's shape, so the document cannot go stale.
- **W258** [P] The ADM register at five years → verify: W201's decision register re-derived against everything Y5 added, not assumed to have survived; the published notice regenerated from it.
- **W259** The G7 boundary at five years → verify: W200's five rail properties re-derived; Q17's matching optimisation tested against them explicitly, since it is the first Y5 work that could have moved the line.
- **W260** **YEAR 5 CLOSE.** Y6 horizon plan + expansion-rule renewal → verify: next-horizon plan written from the W256 audit and the W257 dossier; §6's expansion rule states what succeeds it now the five-year arc is spent; `plan-ledger` green over the whole ledger.

## 5f. Year 6 horizon — Q21 (W261–W273)

Expanded by W260 on 2026-08-13 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md`. **One quarter, not a year** — see `docs/HORIZON-Y6.md` for why, and for
the gate position recorded at this expansion. Same contract: each unit states its own verify gate,
founder gates are inherited, and no unit here needs a ruling to start.

**Q21 — cut the cost of yes.** The dossier's finding decides the theme. Sixteen ledger rows are
blocked; G1, G2, G4 and G7 block *none* of them and are the four that stand between this tree and
a single real patient being helped. The loop cannot answer any of them. What it can do is make each
answer cheap to act on and stop the blocked pile growing — so every unit below either shortens the
day a ruling lands or re-derives a control that made Year 5 quiet. **No unit in Q21 may add a
blocked row**, which is W263's job to enforce rather than this paragraph's to promise.

- **W261** Gate-readiness register: for each outstanding gate, what this tree does on the day it is answered → verify: every step resolves to a module, registry or test that exists in the tree; a gate with no readiness path fails; counts derived from `BUILD-STATE.md` and pinned row-by-row.
- **W262** G1 first-connection rehearsal: credential slot to first practice-scoped read, driven end to end while every credential is still refused → verify: the rehearsal drives W242's loader, W253's dispatcher and W209's scoped reads; `liveConnectionsPermitted()` stays false and the test fails if any step was skipped rather than exercised.
- **W263** [P] The blocked-surface budget → verify: the blocked-row count is derived from the ledger and pinned; a new blocked row fails the suite until it names the ruling that would release it and the units released with it.
- **W264** G5 sign-off rehearsal over synthetic pathway content → verify: W119's two-person workflow driven end to end on synthetic content, including the refusals; `SHIPPED_PATHWAYS` stays empty and a test asserts it.
- **W265** Erasure at five years: W137's scrub re-derived against every record class Y5 added → verify: every `stored` class in W106 is reached by the scrub, checked in both directions; a class added without a scrub path fails.
- **W266** [P] What an access request returns, assembled from W106 rather than from a list → verify: every `stored` and `derived` class is either represented in the export or refused with a written reason; both directions against the register.
- **W267** The register census: every self-checking register in the tree, enumerated → verify: each named register is proved to notice, by a mutation in this unit's own test that moves the tree under it and asserts the register fails.
- **W268** [P] Latent findings at five years: W210's register re-derived → verify: every recorded finding's live-condition re-evaluated from source rather than from its own record; a condition that became true without firing is a failure.
- **W269** The synthetic fleet at five years: W48's budgets re-derived over the Y5 surfaces → verify: the run exercises capacity, interop and the API; budgets stated in the test body, W48's shape, with the checker exercised on a violating fake first.
- **W270** [P] Operator copy at the Y6 boundary: W200's declared surface re-derived → verify: membership read from each module's own header against a Y6 constant; nothing carried from the Y4 register, and the both-directions census still green.
- **W271** Page reachability at five years: every route and what it can reach → verify: W107's transitive walk over `app/` checked against a declared surface in both directions; a page reaching a dormant module fails.
- **W272** Q21 hardening → verify: code-review, security-review and simplify run over the quarter's diff; every finding recorded with a disposition and a date, and the accepted ones carry a review date.
- **W273** **QUARTER CLOSE.** Q22 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5g. Year 6 — Q22 (W274–W286)

Expanded by W273 on 2026-08-13 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from `docs/HARDENING-Q21.md`, which is newer than both and is where
the theme actually comes from. **One quarter, not a year.** See `docs/HORIZON-Q22.md` for the
rule's six preconditions evaluated one at a time, and for the gate position recorded at this
expansion. Same contract: each unit states its own verify gate, founder gates are inherited, and no
unit here needs a ruling to start.

**Q22 — the rendered surface.** Q21 built eleven units, nine of them registers, rehearsals or
sweeps, and those nine reviewed clean. **The one unit that touched a surface an operator actually
sees carried the high-severity finding**, and two of the other four are at the same boundary: a
demo rail belonging to a practice nobody could sign in as, and a verify gate that does not run the
only suite exercising a rendered page. The registers are healthy; **the rendered surface is not
checked the way the modules are** — W200 says so about itself, and the unit it defers to has never
been written. So every unit below checks what a person actually sees, or wires an existing control
to reach it. **Q22 adds no blocked row**, which is W263's job to enforce rather than this
paragraph's to promise.

- **W274** `/finder`'s vacuity guard, decided and recorded → verify: the guard's threshold is derived from what the page actually renders rather than from a round number, the decision between changing the page and changing the guard is written down as data, and `public-sweep` is green.
- **W275** [P] The rendered surface enters the verify gate → verify: `pnpm verify` runs the page suite or states in a checked register exactly which specs it excludes and why; a deliberately broken page fails the gate, proved by breaking one.
- **W276** Fixture coherence: every seeded store against a practice a session can act for → verify: both directions over W51's store registry; a store seeded under a practice no session can ever act for fails, and the check is proved on a deliberately incoherent seed.
- **W277** [P] Two tenants, or it is not a scoping test → verify: every `practice_scoped` read in W209's register has a test that constructs at least two practices; the check is proved by pointing it at a one-practice fixture and watching it fail.
- **W278** Copy composed inside a render function — W200's stated known bound, closed → verify: rendered output linted against fixtures rather than by export name, checked in both directions against a declared surface; a string added to a render function and to no export fails.
- **W279** [P] Every console route's zero state, declared and distinguished → verify: for each route, "nothing yet", "nothing arrived" and "could not load" are separate states with separate copy, both directions against a declared register; a route rendering one where another is true fails.
- **W280** TENANCY-1 closed: the read that matches a clinician with no practice in the query → verify: the read is practice-scoped as the query rather than filtered after, W209's rule; the finding is closed in W210's register with the mutation that would have caught it.
- **W281** [P] CENSUS-1 closed: every module carries its unit header, checked at the door → verify: a module with no `// W<n>` header fails the suite rather than being counted; `HEADERLESS_AT_W210` retired or re-derived, and the finding closed in W210's register.
- **W282** W267's unproven walks: a batch given roots and proved by mutation → verify: at least six registers move from `walk_unproven` to `mutated_tree`, each with its own planted-file proof; the census's own counts move with them in both directions.
- **W283** [P] MATCH-1 re-anchored: the ranker's ordering read from behaviour, not from source → verify: the predicate observes what the ranker returns for constructed inputs rather than matching a comparison in its source; rewording the comparison no longer silences the finding.
- **W284** Route coverage: every declared route exercised by the page suite, or refused in writing → verify: W271's route classes checked against the page suite's own coverage in both directions; a route with neither an exercise nor a written reason fails.
- **W285** [P] Q22 hardening → verify: code-review, security-review and simplify run over the quarter's diff; every finding recorded with a disposition and a date, and the accepted ones carry a review date.
- **W286** **QUARTER CLOSE.** Q23 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5h. Year 6 — Q23 (W287–W299)

Expanded by W286 on 2026-08-14 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from `src/quality/hardening-q22.ts`, which is newer than both and
is where the theme comes from. **One quarter, not a year.** See `docs/HORIZON-Q23.md` for the
rule's six preconditions evaluated one at a time, and for the gate position recorded at this
expansion.

**Q23 — the checks that cannot fail.** Q22 set out to check the rendered surface and did: the page
suite is in the gate, every route is opened by a named spec, the copy W200 could not see is linted,
and two cross-tenant defects are closed. But what the quarter DEMONSTRATED, in six places found six
different ways, is that **a check that cannot fail is indistinguishable from a check that passes** —
a route register whose central claim was vacuous for one route, a pin that went red on a unit being
built, a comment-subtraction test guarding a load-bearing line it could not have caught, a finding
whose own pinning assertion refuted it, a detector tuned toward its author's answer, and a share
budget satisfied with the branch it guards never executed. Every one was found by DRIVING the
check; none by reading it. W267 proved each register would notice a file arriving; nothing has
checked that a register's ASSERTIONS would notice anything. **Q23 adds no blocked row.**

- **W287** W279 reviewed: the unit Q22's hardening declared out of range → verify: `src/console/zero-states.ts` and its test read through the three lenses; every finding disposed with a date, and the hardening register's own "not reviewed" list is shortened by exactly this unit.
- **W288** [P] The tautology sweep: assertions whose subject cannot make them fail → verify: a detector over `src/**/*.test.ts` for assertions whose expected value is entailed by their expression, proved on a planted tautology and on a planted real assertion; every hit fixed or accepted with a reason.
- **W289** Every register proves one ASSERTION can fail, not just its walk → verify: W267's census extended — each declared register names one assertion and the mutation that makes it fail, driven in this unit's own test; a register naming none fails.
- **W290** [P] Pinned constants that move on a planned event, swept and bounded → verify: every `*_AT_W<n>` and `*_LAST_UNIT` constant found from the tree and checked to be bounded rather than live; a pin that would go red on an ordinary expansion fails, and the sweep is proved on a planted live pin.
- **W291** The branch nobody executed: registers whose refusal path never runs → verify: for each register with a refusal or violation branch, a test that reaches it; a branch with no reaching test is listed with the fixture that would reach it.
- **W292** [P] Detectors checked against a planted NEGATIVE, not only a planted positive → verify: every `mutated_tree` proof in W267's census gains a case where the planted file must NOT be reported; a detector that reports everything passes today and fails here.
- **W293** `toEqual([])` over a list nothing could have put anything into → verify: every empty-list assertion in the suite paired with evidence its source is non-empty, or accepted with a reason; the check is proved on a list that is empty by construction.
- **W294** [P] The acceptance registers, re-derived: every acceptance still live → verify: W200's, W278's and W285's accepted findings each re-checked against the sweep that produced them, both directions; a stale acceptance fails and every live one carries a review date in the future.
- **W295** What a green suite does not prove, declared per register → verify: every tree-checked register carries a stated bound, checked to name something the register genuinely cannot see; a bound that restates the register's job fails.
- **W296** [P] Mutation sampling: an assertion deleted, and the suite must fail → verify: a sampled set of assertions removed one at a time in a copied tree, each required to turn its own suite red; survivors are reported by name rather than counted.
- **W297** The bounds register: every stated `*_BOUND` checked against its unit → verify: each declared bound resolved to the unit that stated it and the remedy it names; a bound whose remedy has since been built fails as stale.
- **W298** [P] Q23 hardening → verify: code-review, security-review and simplify run over the quarter's diff; every finding recorded with a disposition and a date, and the accepted ones carry a review date.
- **W299** **QUARTER CLOSE.** Q24 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5i. Year 6 — Q24 (W300–W312)

Expanded by W299 on 2026-08-17 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from `src/quality/hardening-q23.ts`, which is newer than both and
is where the theme comes from. **One quarter, not a year.** See `docs/HORIZON-Q24.md` for the
rule's six preconditions evaluated one at a time, and for the gate position recorded at this
expansion.

**Q24 — the cost of the controls.** Q23 built twelve registers in eleven units and each one caught
real defects, including in the units writing them. Its own hardening pass then produced the bill:
**fifteen pinned counts moved in one quarter on ordinary additions**, one citation format was
**implemented five times**, and adding a single module to `src/` now requires declaring it in
**six** other registers. W295 produced the sharpest version — narrowing three text scans so they
would stop matching their own fixtures HID FOUR REAL REGISTERS, and the narrowing had to be
reverted. The registers stay and the questions they ask stay; what changes is that the tree stops
paying for them twelve times over. The quarter's gate is measured rather than felt: W300 records
what one new module costs today and W308 re-derives the same number at the end. **Q24 adds no
blocked row.**

- **W300** The declaration tax, measured: what one new module costs today → verify: the register-declaration sites derived from the tree rather than listed, a planted module run through every one of them, and the count of places it must be declared recorded as a constant this quarter is measured against.
- **W301** [P] The citation resolver, written once → verify: one exported `<file> :: <assertion>` resolver, the five independent implementations replaced by it, and every existing citation still resolving; a citation naming a missing file, a missing assertion and a malformed pair each fail. Closes Q23-SIMP-1.
- **W302** [P] One text-scan discipline: comments, literals, and the order they run in → verify: a single exported scan-preparation with comment stripping and literal blanking, the four copies retired, and W295's reversion recorded as its stated bound — proved on the prose comment whose `/` hid four real registers.
- **W303** One planting harness for every register that plants → verify: `withRoot`, `withPlanted` and the census tree-copy unified behind one API, every existing plant still planting, and a probe left behind by an interrupted run made impossible rather than cleaned up.
- **W304** [P] Counts as properties: the pinned-count class removed at its source → verify: every register-size assertion in the tree replaced by the property it stood in for or argued as a ratchet, W290's `PINS` register re-derived, and a planted count that would move on an ordinary addition failing.
- **W305** The register manifest: one declaration point per module → verify: a single per-module declaration from which the copy surface, the census, the drives and the blind spots are derived; the six registers agree with it in both directions, and a module declared once is watched by all of them.
- **W306** [P] Bounds provable in their lifted state → verify: `stillOpen` takes a root, both real predicates driven against a constructed tree where the remedy EXISTS and reported stale, and the `stale` arm no longer reachable only with a synthetic bound. Closes Q23-CR-1.
- **W307** [P] The self-referential scan, solved once → verify: one stated rule for a detector that must not match its own fixtures, applied to every scan in the tree, with the fixture-splitting idiom replaced by the rule; each scan proved to see a planted real instance and refuse its own quoted one.
- **W308** The declaration tax re-measured → verify: W300's measurement re-run unchanged over the tree Q24 leaves behind, the number recorded beside the baseline, and a quarter that did not move it saying so rather than claiming otherwise.
- **W309** [P] The demo path end to end on synthetic data → verify: one spec that walks a practice from seeded data to a rendered console answer, with every founder gate held — no real patient, no live send, no production credential — and the path's refusals rendered where a gate stops it.
- **W310** The founder's page: what exists, what is blocked, what one ruling releases → verify: a rendered page derived from the ledger and §4 rather than written, naming each outstanding gate, the units it releases, and how long it has waited; no clinical claim, and the copy passes the advice linter.
- **W311** [P] Q24 hardening → verify: code-review, security-review and simplify run over the quarter's diff; every finding recorded with a disposition and a date, and the accepted ones carry a review date.
- **W312** **QUARTER CLOSE.** Q25 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5j. Year 7 — Q25 (W313–W325)

Expanded by W312 on 2026-08-17 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from `src/quality/hardening-q24.ts`, which is newer than both and
is where the theme comes from. **One quarter, not a year.** See `docs/HORIZON-Q25.md` for the
rule's six preconditions evaluated one at a time, and for the gate position recorded at this
expansion.

**Q25 — the claims, not the code.** Q24 set out to pay down what the controls cost and missed its
own gate: the declaration tax went UP, six to seven, and the quarter's note says the instrument was
wrong rather than the work. Its hardening pass then found the larger thing, four separate times — a
tautology shipped INTO the unit whose subject was assertions that check nothing, the fourth stale
count in prose in two quarters, and two fixes that reproduced the class they were fixing. Add the
process fact none of them is a finding against: **the verify gate runs before the ledger row is
written**, which cost three separate defects in one session. The common shape is that this tree
checks its code and not the CLAIMS it makes about its code — prose, records, dispositions, the
ledger row itself. Every Q25 unit makes one class of unchecked claim checkable or retires it. The
gate is deliberately not a number this time: W324 re-reads the class list, because Q24's gate was a
number and counting controls measured the wrong thing. **Q25 adds no blocked row.**

- **W313** A better instrument for the declaration tax → verify: the tax measured as the files an AUTHOR must edit to declare a module rather than the registers that report it undeclared, both instruments run over the same planted shapes, and the disagreement between them recorded as the reason W308's gate read the wrong way.
- **W314** [P] Numbers in prose, resolved against the tree → verify: every numeric claim in a module header or doc comment either resolves to something derived or is declared unresolvable with its reason; the four stale counts of Q23 and Q24 reproduced as planted headers and each one reported.
- **W315** The gate that ran before the row → verify: the ledger row a unit will commit is present in the tree the gate runs over, driven on the three consequences this quarter produced — a lost `[P]` prefix, a bound stale on its own close, and a `PENDING` SHA in a committed row.
- **W316** [P] Length-preserving operations: the tautology class W288 cannot see → verify: `xs.map(f).length` against `xs.length` reported, the operations that preserve length declared rather than guessed, and a planted assertion over a filter — which does NOT preserve length — refused.
- **W317** [P] A remedy that reproduces its own defect → verify: the two Q24 instances re-derived as a pair, a stated rule for what makes a fix an instance of the class it fixes, and a planted remedy carrying the defect reported.
- **W318** Every disposition on a clock → verify: a deferred finding carries a unit by which it is answered and fails when that unit lands without it, the accepted ones keep W294's review dates, and a disposition with no clock at all refused at the type level.
- **W319** [P] The blocked surface reachable from one place → verify: every blocked row reachable from the founder's page and every rendered row present in the ledger, both directions, driven on a planted row that no release path names.
- **W320** Module headers derived from what the module exports → verify: a header naming an export the module does not have reported, a header omitting the module's own subject reported, and the class W298's citation door leaves open stated with what it still cannot read.
- **W321** [P] The demo path's second scenario: a practice that refuses → verify: one spec walking a practice that declines at each gate the path offers, every refusal rendered where it happens, and no founder gate crossed.
- **W322** The founder's page, second reading → verify: what has changed since a recorded reading, derived from the ledger rather than stored, with a first visit saying so rather than rendering an empty diff.
- **W323** [P] Assertion vocabulary: one way to say a list is non-empty → verify: the ways this tree currently spells the same assertion enumerated from the suite, one form chosen, the rest converted, and a planted variant reported.
- **W324** The claim classes re-read — this quarter's gate → verify: every class named in `docs/HORIZON-Q25.md` either driven by a check that exists or declared unprovable with its reason; a class named and neither driven nor declared fails.
- **W325** **QUARTER CLOSE.** Q26 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5k. Year 7 — Q26 (W326–W338)

Expanded by W325 on 2026-08-18 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from `src/quality/claim-classes.ts` and the Q25 ledger rows, which
are newer than both and are where the theme comes from. **One quarter, not a year.** See
`docs/HORIZON-Q26.md` for the rule's six preconditions evaluated one at a time, and for the gate
position recorded at this expansion.

**Q26 — when the check runs.** Q25 met its gate: every claim class its horizon named is driven by a
check that speaks or argued away against the document's own words. What the quarter produced beside
its gate is one shape seen five times. W315 built the instrument for *the gate runs before the row
is written* and the gap took another unit anyway — W323's close fired W324's `pending` arm and left
`main` red for a firing, because the close happens after the gate and the instrument was not run at
the close. W318 found three deferrals aimed at ranges nothing evaluates, one of them answered
seventeen units earlier and still reading `deferred`. W322 fixed a plant that wrote into the
repository other workers were walking, and the residue came back under a green gate — its two
detectors are correct and **order-dependent inside a single run**. W323 found a register making a
false claim about its own mechanism, which only a mutation pass a builder chose to run would catch.
And W324's `pending` arm is the counter-example: the one declaration tied to an EVENT rather than to
a run, and it fired on the exact firing it named. The common shape is that **a control here answers
at the moment a builder happens to run it, and several are about moments the suite never occupies.**
Every Q26 unit ties a control to the event it concerns, or states which instant it answers at and
what that instant cannot see. The gate is not a number, for the reason Q24's was wrong and Q25's
replacement worked. **Q26 adds no blocked row.**

- **W326** The close inside the gate → verify: the ledger row a unit will commit is present in the tree its gate runs over, run as a step of the close rather than as a check about one, driven on the Q25 close that left `main` red after its own gate had passed.
- **W327** [P] Order-dependent checks: which instant a control answers at → verify: every check whose answer depends on repository state at the moment it runs enumerated, each driven in isolation and inside a full run, and a planted order-dependent check reported.
- **W328** The plant that survived W322 → verify: whatever still writes `src/planted/` into the repository identified by instrumentation and reproduced deliberately, with PLANT-1 disposed on evidence rather than on quiet runs.
- **W329** [P] A deferral answered where it points → verify: every deferred disposition re-read at the unit it names, driven on one whose unit has already landed and one whose unit has not.
- **W330** [P] Declarations that end themselves → verify: every declaration whose truth depends on a future event names that event, W324's `pending` arm generalised, and a planted declaration whose event has passed reported.
- **W331** Q25's hardening pass, which the quarter did not run → verify: `code-review`, `security-review` and `simplify` over W313–W325; every finding disposed with a clock per W318; the pass's own bound stated.
- **W332** [P] The survivors register re-derived over the quarter's modules → verify: W296's sampling run over every module Q25 added, each survivor named with its kind and its argument, and a planted survivor reported.
- **W333** [P] What a green suite does not run → verify: every module with no sibling suite and every branch declared unreachable re-derived and NAMED rather than counted, and a planted unreached branch reported.
- **W334** [P] The demo path's third scenario: a practice set up wrong → verify: one spec walking a practice whose setup is incomplete, every unfinished step named where an operator would look for it, and no founder gate crossed.
- **W335** The gate dossier derived rather than written → verify: the outstanding position regenerated from the ledger and §4, every disagreement with `docs/GATE-DOSSIER-Y5.md` reported, and a planted stale dossier line reported.
- **W336** [P] One way to say a thing is absent → verify: W323's shape applied to the emptiness claim — the spellings enumerated from the suite, one chosen, the rest converted, a planted variant reported, and `VOCABULARY_BOUND`'s predicate shown to have gone false.
- **W337** The controls re-read — this quarter's gate → verify: every control named in `docs/HORIZON-Q26.md` either runs at the event it concerns or declares the instant it answers at with what that instant cannot see; a control named and neither tied nor declared fails.
- **W338** **QUARTER CLOSE.** Q27 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5l. Year 7 — Q27 (W339–W351)

Expanded by W338 on 2026-08-18 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — the dossier newly trustworthy, because W335 found it understating the
largest blocker — and from `src/quality/hardening-q25.ts`, which is newer than both and is where
the theme comes from. **One quarter, not a year.** See `docs/HORIZON-Q27.md` for the rule's six
preconditions evaluated one at a time, and for the gate position recorded at this expansion.

**Q27 — what the tree already knows.** Q26 asked WHEN a control answers and the quarter answered
it. What it kept finding on the way is something else, six times in six registers. W331 found **two
bounds that had predicted their own failures**: `PLANTING_BOUND` said in writing that a suite
forgetting its `afterAll` leaks a temporary directory and *no register reads it*, and four callers
had forgotten — 426 copies and 3.6 GB of `/tmp`. It was the second quarter running where a stated
bound named a way in and something walked through it. W334 found `setupReadiness` able to say which
setup step a practice has not finished since the wizard was built, with **exactly one surface ever
asking it**. W335 found a founder-facing document and its own test each keeping a private copy of a
parse W310 had fixed everywhere it was shared. W333 found twelve of sixteen "untested" modules
tested, because the register asked about a sibling file rather than about reachability. W329 found
a citation nobody had resolved, in a field typed `string` beside a twin W318 had already typed
`UnitId`. The common shape is that **the tree derives a fact, states it or computes it, and nothing
reads it** — and every one of these was cheaper to find than to build and had been true for at
least a quarter. Every Q27 unit takes such a fact and makes something read it. The gate is not a
number, for the reason Q24's was wrong and its two replacements worked. **Q27 adds no blocked row.**

- **W339** Bounds that name a failure nothing reads → verify: every stated bound's sentence read for a condition it names and no register checks, each one either given a check or declared unreadable with its reason, and the two W331 found driven as a pair.
- **W340** [P] A derived fact with exactly one reader → verify: every exported derivation counted by the modules that call it, the single-reader ones named rather than counted, and a fact the product computes and no surface asks for reported.
- **W341** [P] The private copy of a shared parse → verify: every module holding its own copy of a walk or parse the tree shares enumerated, each either using the shared one or declaring why, and a planted private copy reported.
- **W342** [P] Typed citations: a field that names a unit, a module or an export → verify: every register field carrying such a name resolved against the tree, a field typed loosely beside a twin typed strictly reported, and a planted unresolvable field reported.
- **W343** Q26's hardening pass → verify: `code-review`, `security-review` and `simplify` over W326–W338; every finding disposed with a clock per W318; the pass's own bound stated.
- **W344** [P] When the condition actually held → verify: a finding's timeline reconstructed from the ledger and the commit record rather than assumed, driven on W328's premise error, and a claim about when something started reported when the record disagrees.
- **W345** [P] The escape hatches re-read → verify: every `inherent`, `never_derived`, `unobservable` and `undemonstrated` declaration re-read against what the tree can observe today, each still-correct one left with its argument and each one the tree has outgrown converted.
- **W346** [P] The console's day two: a practice that finished setup and is waiting → verify: one spec walking a practice whose setup is complete and whose first cycle has not run, every waiting state named where an operator would look, and no founder gate crossed.
- **W347** [P] The founder's page says what the tree already knows → verify: every derived fact about the outstanding position that the page could show and does not, enumerated and either rendered or declared, with the G5 correction visible.
- **W348** [P] One way to say a thing is present → verify: W323's and W336's shape applied to the presence claim — the spellings enumerated from the suite, one chosen with its argument, the rest converted, and a planted variant reported.
- **W349** The survivors register over Q26's modules → verify: W332's full run over every module Q26 added, each survivor named with its kind and its argument, and the sampler's share of that population measured.
- **W350** The claims re-read — this quarter's gate → verify: every claim `docs/HORIZON-Q27.md` makes about a fact the tree holds either read by a check that exists or declared unread with its reason; a claim named and neither read nor declared fails.
- **W351** **QUARTER CLOSE.** Q28 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5m. Year 7 — Q28 (W352–W364)

Expanded by W351 on 2026-08-18 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from the Q27 ledger rows and `src/quality/quarter-mutants-q26.ts`,
which are newer than both and are where the theme comes from. **One quarter, not a year.** See
`docs/HORIZON-Q28.md` for the rule's six preconditions evaluated one at a time, and for the gate
position recorded at this expansion.

**Q28 — which way it fails.** Q27 asked that every fact the tree already derives be read by
something, and its units landed. What the quarter kept finding on the way is that **every defect it
found failed toward looking correct.** W345 found a bound that had never been true —
`page-reach.ts` claimed a route inherits a class's allowance by living in its directory, and
planting one returns it `unclassified` — sitting behind `NOT_CALLABLE`, a shared excuse that was
itself false, because an unfalsifiable excuse is where a false claim goes to be safe. W340's first
derivation reported **thirty-five unread facts where the answer was seventy-one**, because it
counted a mention as a reader; the error moved the number toward a healthier tree. W349's
population **failed open** — `quarterModules` in the pre-W342 shape dropped its arguments, every
comparison went false, and it returned 295 modules rather than the quarter's eleven, which reads as
a bigger answer rather than an error; W343 had already recorded that exact failure mode. W349 also
found a survivor whose remedy W332 wrote down and nobody applied, so the same hole arrived in a
second module. W335 found a document and its own test sharing a private parse, both saying sixteen
where the tree said eighteen — the smaller number, the one nobody queries. The common shape is that
each check's failure mode was to look correct, and a check that fails loudly is worth less than it
appears if the way it actually breaks is quietly. Every Q28 unit establishes which direction a
check, a derivation or a declaration fails in, and where that direction is toward looking correct,
makes it loud. The gate is not a number, for the reason Q24's was wrong and its three replacements
worked. **Q28 adds no blocked row.**

- **W352** Which way each register fails: for every register in W267's census, the direction its failure moves in — loud, or toward looking correct — derived where it can be and argued where it cannot → verify: every census member classified; a register whose declared direction its own suite contradicts fails; a planted register with no direction reported.
- **W353** [P] The superset failure: a derivation whose wrong answer is bigger than its right one → verify: every exported derivation taking a population enumerated with what it returns when handed nothing it understands; one that widens rather than throws is reported; W349's `quarterModules` mis-call reproduced as the driven case.
- **W354** [P] The flattering number: every figure this tree derives, with the direction an error moves it → verify: each derived count classified as failing high, low or loudly, resolved against the derivation; a count whose error direction nobody declared fails; W340's thirty-five driven as the worked example.
- **W355** [P] A default that hides a mistake: default parameters that turn a wrong call into a plausible answer → verify: every exported function with a defaulted register or range parameter enumerated, each either argued safe or reported; a planted call omitting the argument must be distinguishable from one supplying it.
- **W356** [P] An excuse nothing can contradict: W345's finding generalised past `NOT_CALLABLE` → verify: every shared reason-string in this tree's registers enumerated with whether anything can falsify it; an unfalsifiable excuse used by more than one entry is reported with what would settle it.
- **W357** [P] A remedy written and never applied → verify: every remedy any register names, resolved against the tree for whether it was built; W332's `claim-classes.ts` survivor driven as the case that recurred; a remedy recorded as though recording it were the fix fails.
- **W358** [P] The premise a walk never checked → verify: every e2e spec whose setup claims a state asserts that state before walking; W346's day-two premise driven as the case; a spec that walks a state it never established is reported.
- **W359** [P] Two specs sharing a store → verify: the stores each e2e spec's premise depends on enumerated and reset by it rather than by file order; a planted spec reading another's residue is reported; W346's suite-only failure driven as the case.
- **W360** Q27's hardening pass → verify: `code-review`, `security-review` and `simplify` over W339–W351; every finding disposed with a clock per W318; the pass's own bound stated.
- **W361** [P] The console says which of its zeroes is a measurement → verify: every zero a console page renders classified as measured, waiting or unasked, each resolved against what the page derives it from; a zero rendered with no class reported; no founder gate crossed.
- **W362** The survivors register over Q27's modules → verify: W349's run over every module Q27 added, each survivor named with its kind and its argument, the modules the harness cannot reach declared and resolved, and the sampler's share of that population measured.
- **W363** The failure directions re-read — this quarter's gate → verify: every check `docs/HORIZON-Q28.md` names either declares the direction it fails in or is shown failing loudly; a check named and neither declared nor shown fails.
- **W364** **QUARTER CLOSE.** Q29 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5n. Year 7 — Q29 (W365–W377)

Expanded by W364 on 2026-08-19 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from the Q28 ledger rows and `src/quality/quarter-mutants-q27.ts`,
which are newer than both and are where the theme comes from. **One quarter, not a year.** See
`docs/HORIZON-Q29.md` for the rule's six preconditions evaluated one at a time, and for the gate
position recorded at this expansion.

**Q29 — what the check is over.** Q28 asked which way each check fails, and its units landed. What
the quarter kept finding on the way is that **the comparison was right and the population was
wrong** — nine times, by two builders. W353 named the widening case and it kept happening after it:
W362's mutation run over Q27 found exactly one survivor in sixty-four, and it was that shape one
layer in, an inverted filter giving a WIDER field set that shares `by`, `id` and `value` with the
right one, so every assertion over it passed. Three units in a row built the wrong population first
and were caught only by driving it — W359's store walk went THROUGH store modules and reported
thirty gaps where eight were real, W361's zero census counted every interpolation and got
fifty-nine sites where the console renders twenty-seven, W355's drive census counted a function's
own declaration as a call to itself. The narrow direction is worse because it is silent: W360 found
`private-copies.ts` missing the eighth copy of the ledger parse because its marker is a regex
spelling and `timelines.ts` writes the same parse another way, and `assertion-vocabulary.ts`
keeping only the file from an excuse key of `<file> :: <site>`, so one exemption silences a whole
file. The tree has a census of registers, a register of failure directions, superset probes and a
defaults register — and nothing that holds the POPULATION itself. A green run says the comparison
agreed with the declaration; it says nothing about who was missing. Every Q29 unit establishes what
one check is over: derived rather than listed, resolved against the tree, and shown both including
a planted member and excluding a planted non-member. The gate is not a number, for the reason
Q24's was wrong and its four replacements worked. **Q29 adds no blocked row.**

- **W365** The population register: for every check in W267's census, what it is over and how that set is derived → verify: every census member carries a population with its derivation named and resolved; a member whose population nothing derives fails; a planted register with no population reported.
- **W366** [P] A marker that is a spelling: a detector that misses what it is named for → verify: every register matching its subject by literal text enumerated with what a differently-spelled instance would look like; W360's `timelines.ts` ledger parse driven as the case; a marker no second spelling has been tried against is reported.
- **W367** [P] The population that is narrower than its own claim → verify: every register whose bound states a wider subject than its derivation walks is reported; the gap named in the bound resolved against the walk; a claim and a walk that agree must be distinguishable from one that has never been compared.
- **W368** [P] An exemption keyed one way and applied another → verify: every excuse register whose key is finer than its application enumerated; W360's `presenceDefects` file-wide exemption driven as the case; an exemption that silences more than it names fails.
- **W369** [P] The empty population: a check whose subject the tree no longer has → verify: every derivation that can return an empty set classified as empty-by-design, empty-because-fixed or empty-because-broken, each resolved; an empty result nothing distinguishes from a dead walk is reported.
- **W370** Q28's hardening pass → verify: `code-review`, `security-review` and `simplify` over W352–W364; every finding disposed with a clock per W318; the pass's own bound stated.
- **W371** [P] The e2e suite's own population: which pages a walk never reaches → verify: every console route enumerated against the specs that visit it, resolved through the link graph rather than through route strings; a route no spec reaches is reported; W363's `HORIZON_DIRECTION_BOUND` remedy applied to the citation half.
- **W372** [P] A register whose members are listed where they could be derived → verify: every hand-listed register enumerated with whether the tree can derive its membership; one that can be and is not is reported with the derivation; a list that genuinely cannot be derived says why.
- **W373** [P] The product's populations: which patients a rule is over → verify: every product rule that selects patients enumerated with the population it selects from, resolved against the synthetic set; a rule whose population is wider than its copy claims is reported; no founder gate crossed and no real patient data.
- **W374** The survivors register over Q28's modules → verify: W349's run over every module Q28 added, each survivor named with its kind and its argument, the modules the harness cannot reach declared and resolved, and the sampler's share of that population measured.
- **W375** The /tmp residue nothing reads → verify: the run-level sweep shown reclaiming a copy an interrupted run left, or the gap declared with what would close it; W360's two gigabytes driven as the case; a repository-clean register that watches only the repository says so.
- **W376** The populations re-read — this quarter's gate → verify: every population `docs/HORIZON-Q29.md` names is derived, and is shown both including a planted member and excluding a planted non-member; a population named and not shown both ways fails.
- **W377** **QUARTER CLOSE.** Q30 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5o. Year 7 — Q30 (W378–W390)

Expanded by W377 on 2026-08-20 under the §6 horizon rule, from `docs/AUDIT-Y5.md` and
`docs/GATE-DOSSIER-Y5.md` — and from `src/quality/hardening-q28.ts` and the Q29 ledger rows, which
are newer than both and are where the theme comes from. **One quarter, not a year.** See
`docs/HORIZON-Q30.md` for the rule's six preconditions evaluated one at a time, and for the gate
position recorded at this expansion.

**Q30 — when the check runs.** Q29 asked what each check is over, and its units landed: the
populations are derived, the empty ones argued, the product's own rules measured against a synthetic
panel. What the quarter kept finding on the way is a different property, and Q28's hardening pass
had already named it in one sentence — **it fails toward green, and it did so twice on `main` in one
day**. Both of those checks read a ledger row's STATUS, so both could only go wrong AT THE CLOSE,
and the close is the one commit whose suite is easiest not to re-run. Q29 then hit the same shape
from four directions: W375 found the temp-directory sweep wired to `teardown` alone — the hook an
interrupted run never reaches, which is the only case it exists for; W371 found a citation register
whose rows resolved a test title and ran nothing, and two rows that still cannot be run because
their comparison is welded inside a `.test.ts`; W367 found an import cycle whose symptom is
`undefined` rather than a build error, so which file the graph is entered through decides the
answer; and W376 found a scan reading a string literal in a register that exists to re-read
populations. **A check is not only a comparison over a population. It is a comparison over a
population AT A MOMENT**, and this tree has never written the moment down. W370 derived that fifty
files hold a comparison nothing outside them can drive, measured it on every run of the quarter it
cost two reds, and failed nothing because of it. So every unit below takes a check and establishes
when it runs, whether that moment can see the failure it is for, and whether it can be run from
anywhere else. **Q30 adds no blocked row.**

- **W378** [P] The moment register: for every check in W267's census, when it runs → verify: every census member carries the moment it answers at — file load, per test, run setup, run teardown, or the gate's own hook — derived from the harness rather than declared; a member whose moment nothing can name fails.
- **W379** [P] A comparison welded inside a test file, and the ones that can be moved out → verify: W370's fifty re-derived, each classified as movable or inherent with the change that would move it; one moved as the driven case, and the register shown reporting a comparison that has come back inside a `.test.ts`.
- **W380** The close is the moment nobody re-runs → verify: every check whose answer depends on a ledger row's status enumerated and driven at a simulated close; a check that passes before the close and fails after it is reported, and W326's own welded-check limit is closed or re-argued.
- **W381** [P] Module-evaluation order as a correctness condition → verify: every import cycle in `src/` derived, each classified by whether a value crosses it; a cycle whose symptom is `undefined` at module-eval is reported, and W367's own case is driven both ways.
- **W382** [P] A hook wired to a moment its case never reaches → verify: every process hook and lifecycle callback enumerated with the event it answers to and the failure it exists for; one whose failure cannot reach its moment is reported, with W375's teardown-only sweep as the driven case.
- **W383** Q29's hardening pass → verify: `code-review`, `security-review` and `simplify` over W365–W377; every finding disposed with a clock per W318; the pass's own bound stated.
- **W384** [P] What a page RENDERS, not what it computes → verify: every console page's zero states derived from what the component renders rather than from the expressions it calls; a zero rendered as a list, an empty state or a sentence is in the population, and W361's stated gap — a page that renders a number some other way — is closed against the derivation or re-argued against it.
- **W385** [P] Once per file or once per run → verify: every check that reads shared mutable state enumerated with which it needs; a check that is order-dependent across files is reported, and one is driven by running its file alone and with the suite.
- **W386** The survivors register over Q29's modules → verify: W349's run over every module Q29 added, each survivor named with its kind and its argument, the modules the harness cannot reach declared and resolved, and the sampler's share of that population measured.
- **W387** [P] The product's moments: when a rule decides about a patient → verify: every product rule that selects patients carries the moment its decision is taken and the moment its inputs were read; a rule deciding on state older than its own guard is reported, resolved against the synthetic set.
- **W388** [P] A citation resolved but never run, everywhere else → verify: W371's `drivesItsCheck` shape applied to every citing register in the tree; each citation either resolved to something runnable and CALLED, or named with the change that would make it callable.
- **W389** The moments re-read — this quarter's gate → verify: every moment `docs/HORIZON-Q30.md` names is derived, and is shown both catching a failure that happens at that moment and staying silent about one that happens at another; a moment named and not shown both ways fails.
- **W390** **QUARTER CLOSE.** Q31 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 5p. Year 7 — Q31 (W391–W403)

**Theme: what the pattern cannot see.** Q29's hardening pass is four findings and they are one
finding wearing four coats: a pattern stands in for a population, the pattern and the check are the
same object, and so a pattern that matches the wrong thing reports green. Q29-CR-2 is the sharpest —
nothing escapes the patient-rule signature today, *which is precisely why nothing caught* that it is
narrow four ways and wide one. Q30 met the same shape four more times without naming it. Every unit
here measures a pattern against a SECOND, independent reading of the same population, and the
disagreement is the finding. Recorded in `docs/HORIZON-Q31.md`.

- **W391** [P] The pattern register: every population defined by a regex, and what it is over → verify: every register whose population comes from a pattern is derived, with the pattern's own text and the thing it claims to enumerate; a register whose population nothing else could read is named as such.
- **W392** [P] Q29-CR-2 closed: the patient-rule signature read four ways it is written → verify: a rule taking a callback parameter, one typed `ReadonlyArray<Patient>`, one typed `Array<Patient>` and one named `SyntheticPatient[]` are each planted, and the register's answer about each is shown to be what W373 meant rather than what its regex matched.
- **W393** [P] A number vocabulary that cannot be outgrown by a compound → verify: W314's number reading is measured against a second derivation over every number-word the tree writes; a compound the vocabulary has never seen is planted and must not resolve to the unit on its right.
- **W394** The name conventions a register rests on, enumerated → verify: every register whose derivation turns on a NAME — `ROOT`, `COPY`, `eligible`, a `*_AT_W<n>` suffix — carries the convention it rests on and what a file spelling it otherwise would cost; one is driven by planting the other spelling.
- **W395** Q30's hardening pass → verify: `code-review`, `security-review` and `simplify` over W378–W390; every finding disposed with a clock per W318; the pass's own bound stated.
- **W396** [P] A population measured against the runtime, not against the source → verify: at least one source-derived population is re-derived by LOADING the modules and reading what they export, and the two readings are shown disagreeing about a planted instance before they agree about the tree.
- **W397** The survivors register over Q30's modules → verify: W349's run over every module Q30 added, each survivor named with its kind and its argument, the modules the harness cannot reach declared and resolved, and the sampler's share of that population measured.
- **W398** [P] Every scan site read in both spellings this tree writes → verify: W366's markers extended so each scan site is driven against BOTH spellings the tree actually contains rather than one, and a site whose second spelling nobody can write is argued.
- **W399** [P] The product's patterns: what a rule matches that nobody meant → verify: every product rule whose selection turns on a pattern — a condition code, a template match, a message filter — is measured against a second reading over the synthetic set, and a patient selected by the pattern and not by the intent is reported.
- **W400** [P] A guard whose vocabulary is shared with the world → verify: Q29-SR-1 closed or re-argued — every guard whose test is a name in a namespace this tree does not own is enumerated, with what it would take for a stranger to satisfy it.
- **W401** [P] Two derivations of one population, and the diff between them → verify: a register is chosen whose population two independent walks can produce, both are built, and the diff between them is reported as the finding rather than reconciled away.
- **W402** The patterns re-read — this quarter's gate → verify: every pattern `docs/HORIZON-Q31.md` names is measured against a second reading of its own population, and the two are shown disagreeing about a planted instance before they are shown agreeing about the tree; a pattern named and not shown both ways fails.
- **W403** **QUARTER CLOSE.** Q32 expansion under the horizon rule → verify: the rule's preconditions evaluated and RECORDED in this plan before any unit is written; `plan-ledger` green over the whole ledger.

## 6. Horizon rule (supersedes the five-year expansion rule, W260)

**The five-year arc is spent.** §5's ledger ran W1–W260 and §6's theme lines, written in Year 1,
have nothing left in them. The obvious move — write four more years of themes and keep expanding —
is the one the tree has the receipts against, so it is not the rule.

**Why the old rule cannot simply continue.** It expanded *the next quarter's theme* into thirteen
units, and the themes were written five years ahead. W208 recorded what that cost: §6 wrote Y5 Q17
in Year 1 as "matching optimisation … learned ranking second", and by the time the quarter arrived
a learned ranker over patients collided head-on with a legal notice W201 had published in Year 4 —
so W217 shipped `blocked` from day one and has never moved. The rule's own justification was that
"detail is derived just-in-time"; the *themes* never were. Writing Y6–Y9 themes now would repeat
that at four years' range, with five years of evidence that it does not hold.

**And the rule has a second defect, which five years made visible and no single quarter could.**
It cannot notice that the product is not being used. It reads a theme, produces thirteen units, and
the loop verifies them — and there is no state in which it says *this is now the founder's move*.
`GATE-DOSSIER-Y5.md` states the position: sixteen rows are blocked, **G1, G2, G4 and G7 block none
of them**, and those four are what stand between this tree and a patient. The loop will therefore
never be blocked by the decisions that matter most. Five years of this rule produced 260 verified
units, ~223 modules, 3,000-odd tests, and nothing sent to anybody. That is not a failure of the
loop's output; it is the rule failing to have an opinion about it.

**The horizon rule, which succeeds it:**

1. **One quarter at a time, never a year.** The last week of each quarter — and the first firing
   after the ledger runs dry — expands **thirteen** units into a new §5 extension with matching
   rows in `BUILD-STATE.md`. No theme is written for a quarter that is not being expanded now.
2. **Derived from the last audit and the last gate dossier, never from a theme written earlier.**
   The expansion cites both documents by path, and the quarter's shape has to follow from what they
   say. This is the old rule's stated justification, applied to the theme as well as the detail.
3. **The gate position is re-read and RECORDED at every expansion**, in the horizon document: which
   gates are outstanding, how long each has waited, how many units each releases, and — stated
   plainly — how many of them the loop may answer. That number has been zero for five years and
   the plan should say so every quarter rather than once a year in a dossier nobody asked for.
4. **An expansion may not grow the blocked surface without saying so.** A new blocked row must name
   the ruling that would release it and the units released with it. W263 makes this a check.
5. **Founder gates are inherited, never expanded away** — unchanged from the old rule, and already
   enforced by `src/quality/plan-ledger.test.ts` rather than promised.
6. **The loop keeps building whatever needs no ruling, and says what it cannot do.** The rule is
   not a halt. It is the requirement that every expansion state the position, so that "nobody has
   ruled" is visible in the plan itself and not only to whoever reads the dossier.

The five-year themes below are kept as the record of what was planned and what it cost — §5's
ledger rows are the record of what was actually built, and the two disagree in the places worth
remembering.

### The five-year themes as written in Year 1 (historical)

- **Y2 Q5** Care-gap registers: guideline interval tables as data (diabetes annual cycle, KHA CKD monitoring, GPCCMP quarterly reviews); register-driven eligibility. **Q6** Condition-targeted invitation modules + clinical-safety rails (never diagnostic language; G3 templates per condition). **Q7** Capability graph v1: per-GP case-mix + usefulness telemetry → interest/experience profiles; in-panel routing (right GP for the condition inside the practice). **Q8** Referral-leakage detection + group/multisite reporting + Y2 hardening.
- **Y3 Q9** Credential registry: evidence vault, verification workflow, Ahpra register checks, expiry tracking. **Q10** Pathway definition engine: inclusion/exclusion/escalation as versioned data + authoring UI for specialist reviewers (content itself = G5). **Q11** GP-to-GP referral rails: structured referral + return-report documents, escalation tracking. **Q12** Education engine v1: case-triggered curation (Claude API), CPD trail, pre-consult pathway updates — informs the GP, never replaces judgement (G7 boundary).
- **Y4 Q13** Cardiometabolic/early-CKD vertical assembly (pathways populated under G5). **Q14** Outcome auditing + escalation monitoring dashboards; specialist-agreement sampling. **Q15** Dermatology reference vertical + Ahpra-compliant network directory (G6 for launch). **Q16** PHN/health-system reporting pack + fee transparency + TGA/privacy compliance hardening.
- **Y5 Q17** Intervention-response graph + matching optimisation (deterministic eligibility first, learned ranking second). **Q18** Capacity forecasting + session-opening recommendations. **Q19** FHIR/e-referral interoperability + payer/insurer integrations. **Q20** Expansion verticals (women's health, respiratory), platform APIs, five-year review → next-horizon plan.

## 7. Definition of done (every unit)

`pnpm verify` green (typecheck · test · build · audit:gate) · verify gate stated in the unit passes · BUILD-STATE updated (done + SHA, or in-progress + continuation notes) · commit message references the unit ID · no founder gate crossed · one-line session log in Stefan-Brain `wiki/_log/` (skip-note in commit message if vault unavailable).

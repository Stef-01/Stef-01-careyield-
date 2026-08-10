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

## 6. Years 2–5 — quarterly themes + expansion rule

**Expansion rule:** the last week of each year (W52/W104/W156/W208) — and the first firing of each quarter if the ledger runs dry — expands the next quarter's theme into 13 concrete week-units with verify gates, appended to this plan (§5 extension) with matching rows in `BUILD-STATE.md`. Plans stay accurate because detail is derived just-in-time, informed by everything already built. Founder gates are inherited, never expanded away.

- **Y2 Q5** Care-gap registers: guideline interval tables as data (diabetes annual cycle, KHA CKD monitoring, GPCCMP quarterly reviews); register-driven eligibility. **Q6** Condition-targeted invitation modules + clinical-safety rails (never diagnostic language; G3 templates per condition). **Q7** Capability graph v1: per-GP case-mix + usefulness telemetry → interest/experience profiles; in-panel routing (right GP for the condition inside the practice). **Q8** Referral-leakage detection + group/multisite reporting + Y2 hardening.
- **Y3 Q9** Credential registry: evidence vault, verification workflow, Ahpra register checks, expiry tracking. **Q10** Pathway definition engine: inclusion/exclusion/escalation as versioned data + authoring UI for specialist reviewers (content itself = G5). **Q11** GP-to-GP referral rails: structured referral + return-report documents, escalation tracking. **Q12** Education engine v1: case-triggered curation (Claude API), CPD trail, pre-consult pathway updates — informs the GP, never replaces judgement (G7 boundary).
- **Y4 Q13** Cardiometabolic/early-CKD vertical assembly (pathways populated under G5). **Q14** Outcome auditing + escalation monitoring dashboards; specialist-agreement sampling. **Q15** Dermatology reference vertical + Ahpra-compliant network directory (G6 for launch). **Q16** PHN/health-system reporting pack + fee transparency + TGA/privacy compliance hardening.
- **Y5 Q17** Intervention-response graph + matching optimisation (deterministic eligibility first, learned ranking second). **Q18** Capacity forecasting + session-opening recommendations. **Q19** FHIR/e-referral interoperability + payer/insurer integrations. **Q20** Expansion verticals (women's health, respiratory), platform APIs, five-year review → next-horizon plan.

## 7. Definition of done (every unit)

`pnpm verify` green (typecheck · test · build · audit:gate) · verify gate stated in the unit passes · BUILD-STATE updated (done + SHA, or in-progress + continuation notes) · commit message references the unit ID · no founder gate crossed · one-line session log in Stefan-Brain `wiki/_log/` (skip-note in commit message if vault unavailable).

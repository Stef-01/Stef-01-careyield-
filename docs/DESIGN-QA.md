# Design QA checklist — practice console (W11)

Applies to every console surface (`/console/*`) and the patient booking page (`/book/*`).
Re-run this checklist whenever a console surface is added or restyled; it stands in for the
impeccable/taste-skill pass when those skills aren't installed in the building session
(note which in the ledger row).

## Checklist (W11 pass: 2026-08-08, builder-B — all items checked manually)

### Consistency
- [x] One type scale: page titles `text-2xl font-semibold tracking-tight`, section heads `font-medium`, body `text-sm`.
- [x] One palette: stone neutrals only; amber reserved for validation notes; no ad-hoc colors.
- [x] Shared primitives used (`app/console/ui.tsx`) — no page-local button/input styling.
- [x] Same header on every console page; sign-out always visible when signed in.

### Forms
- [x] Every input has a visible `<label>` (associated — Playwright drives pages via `getByLabel`).
- [x] Numeric constraints mirrored client-side (`min`/`max`/`required`) and enforced server-side (store validation).
- [x] Validation failure shows a visible, non-blaming note and loses no other page state.
- [x] Primary action is a single, obvious button; no competing calls to action.

### Copy (compliance posture — mirrors the W6 linter)
- [x] No clinical claims, urgency, or "overdue" framing on any surface.
- [x] No testimonials, ratings, or "specialist" anywhere.
- [x] Settings explained in plain English (e.g. holdout: "never invited, so incremental impact stays measurable").

### Accessibility (screening level — full WCAG pass is W49)
- [x] Focus states visible on all interactive elements (`focus:ring`).
- [x] Text contrast ≥ 4.5:1 (stone-900/-700/-500 on white/stone-50; checked against WCAG AA table).
- [x] All pages usable keyboard-only (forms are native HTML; no custom widgets).

### States
- [x] Signed-out access to any console page redirects to sign-in (e2e-verified).
- [x] Console with no practice routes to onboarding, not an empty dashboard (e2e-verified).
- [x] Booking page renders a designed state for every invitation status (offer/booked/expired/opted-out/invalid).

## Landing page (W23) — public B2B marketing site (`/`)

Pass 2026-08-09, builder-B — all items checked manually (taste-skill unavailable in loop env).

### Positioning & audience
- [x] Audience is general-practice owners/managers — B2B throughout; no patient-directed copy.
- [x] Positioning per venture brief §Phase 1: measured filling of unused appointment capacity.
- [x] Measurement (holdout, incremental-per-1,000) is a first-class section, not a footnote.

### Copy compliance (regulated-advertising exposure = zero)
- [x] No clinical/therapeutic claims, no condition targeting — enforced by `lintLandingCopy` (src/compliance/landing.ts), gated in CI via the copy bundle test.
- [x] No testimonials or ratings anywhere (CLAUDE.md law 6) — linter-enforced.
- [x] No superlatives, guarantees, urgency, or "specialist" — linter-enforced.
- [x] Footer states the B2B scope explicitly ("Not patient medical advice").

### Design & accessibility
- [x] One type scale and stone palette shared with the console; single primary CTA per section.
- [x] Semantic landmarks (`header`/`nav`/`main`/`footer`), ordered list for the steps, in-page anchors.
- [x] Focus-visible on all links/buttons; text contrast ≥ 4.5:1; responsive (single-column on mobile).
- [x] Public — renders with no auth; CTAs route to /demo and /console/signin (e2e-verified).

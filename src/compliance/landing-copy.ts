// W23: the public landing page's copy, as data so the compliance linter can lint
// exactly what ships (src/compliance/landing.test.ts). Positioning per venture
// brief §Phase 1: sell to practices the measured filling of unused appointment
// capacity. B2B throughout — the audience is practice owners and managers, never
// patients; no therapeutic advertising, no clinical claims, no testimonials.

export const LANDING_COPY = {
  nav: { product: "How it works", measurement: "Measurement", cta: "Practice sign-in" },
  hero: {
    eyebrow: "For general practices",
    heading: "Turn unused appointment capacity into measured continuity of care.",
    sub:
      "CareYield quietly fills your open sessions by inviting established patients back to their " +
      "usual GP — and proves, with a built-in control group, how many of those visits are genuinely " +
      "additional.",
    primaryCta: "See a demo",
    secondaryCta: "Practice sign-in",
  },
  problem: {
    heading: "Empty sessions are lost capacity you can't get back.",
    body:
      "Late cancellations and quiet mid-week sessions leave clinician time unused. Manual recalls " +
      "are slow, hard to target, and impossible to measure. Most tools count every booking they " +
      "touch as their own — which tells you nothing about real impact.",
  },
  steps: [
    {
      title: "Match, within your rules",
      body:
        "You set who is eligible and which sessions may be offered. CareYield ranks only inside " +
        "that boundary — never outside it — and sends a plain, availability-only message.",
    },
    {
      title: "Patients book with their usual GP",
      body:
        "A single tap opens a booking link for a real open slot. When the session fills, the other " +
        "offers close automatically.",
    },
    {
      title: "You see what was incremental",
      body:
        "A held-out control group runs continuously, so every report separates additional visits " +
        "from attendance that would have happened anyway.",
    },
  ],
  measurement: {
    heading: "The number you can defend.",
    body:
      "CareYield reports incremental attended appointments per 1,000 eligible patients, measured " +
      "against a randomised holdout. We never report the raw count of bookings we touched as impact.",
    points: [
      "Randomised holdout arm, on by default",
      "Attended appointments only — no-shows never count",
      "Every message, booking and opt-out on an immutable audit log",
    ],
  },
  compliance: {
    heading: "Built for the rules from day one.",
    body:
      "Availability-only messaging, a compliance check on every template, one-tap opt-out that is " +
      "honoured permanently, and per-practice controls including an instant pause. Your data stays " +
      "isolated to your practice.",
  },
  cta: {
    heading: "Bring your quiet sessions back to life.",
    body: "Book a walkthrough with your practice's own numbers.",
    button: "See a demo",
  },
  footer: {
    tagline: "CareYield — continuity yield for general practice.",
    note: "Business-to-business service for accredited general practices. Not patient medical advice.",
  },
} as const;

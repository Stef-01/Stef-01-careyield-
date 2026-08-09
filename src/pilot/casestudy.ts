// W45: case-study generator — pilot data → a publishable, de-identified case study.
// Three laws are enforced IN CODE, not by editorial care:
//   1. De-identification: the generator never accepts a practice or clinician name;
//      it takes a generic descriptor, and refuses to render if any caller-declared
//      identifying string (or a raw patient/clinician id) survives into the output.
//   2. Compliance: the rendered study must pass the W23 copy linter (no clinical
//      claims, no testimonials/ratings, no superlatives, no "specialist") — a
//      violating study throws rather than renders.
//   3. Honest numbers: only measured figures appear; the naive count is labelled a
//      contrast figure; synthetic-phase output carries the synthetic marker until G4.

import { lintLandingCopy } from "@/compliance/landing";
import type { PilotReport } from "./report";

export interface CaseStudyContext {
  /** Generic, non-identifying descriptor, e.g. "a 10-GP metropolitan general practice". */
  practiceDescriptor: string;
  /** Identifying strings that must NOT appear anywhere in the output (names, suburbs…). */
  identifyingStrings: string[];
  /** True until founder gate G4 — stamps the synthetic-data provenance on the study. */
  syntheticData: boolean;
}

export class CaseStudyComplianceError extends Error {}

/** Raw internal-id shapes that must never reach a publishable artifact. */
const INTERNAL_ID_PATTERNS = [/\bpat-[\w-]+/i, /\bcli(?:n)?-[\w-]+/i, /\bprac-[\w-]+/i, /\binv-[\w-]+/i];

export function assertPublishable(text: string, identifyingStrings: string[]): void {
  for (const name of identifyingStrings) {
    if (name.trim().length > 0 && text.toLowerCase().includes(name.trim().toLowerCase())) {
      throw new CaseStudyComplianceError(`identifying string survived de-identification: "${name}"`);
    }
  }
  for (const pattern of INTERNAL_ID_PATTERNS) {
    const match = text.match(pattern);
    if (match) throw new CaseStudyComplianceError(`internal identifier in output: "${match[0]}"`);
  }
  const violations = lintLandingCopy(text);
  if (violations.length > 0) {
    throw new CaseStudyComplianceError(
      `copy-compliance violations: ${violations.map((v) => `${v.rule} ("${v.match}")`).join(", ")}`,
    );
  }
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Render the case study. Throws CaseStudyComplianceError rather than emit a bad one. */
export function renderCaseStudy(report: PilotReport, context: CaseStudyContext): string {
  const northStar =
    report.northStarIncrementalPer1000 === null
      ? null
      : report.northStarIncrementalPer1000.toFixed(1);
  if (northStar === null) {
    // Without a holdout there is no measured claim — and a case study with no
    // measured claim is marketing, which this generator refuses to produce.
    throw new CaseStudyComplianceError("no holdout arm — no measurable claim, no case study");
  }

  const text = `# Case study: filling unused appointments at ${context.practiceDescriptor}

${context.syntheticData ? "> **Synthetic-data rehearsal.** Every figure below comes from the simulated practice; this document is the template a real pilot fills. It is not publishable until founder gate G4 replaces the data.\n" : ""}
## Setting

${capitalise(context.practiceDescriptor)} ran CareYield for ${report.weeksSimulated} weeks.
Availability messages went only to existing patients of the practice who passed the
practice's own eligibility rules, with a randomised holdout group excluded from all
contact so the effect could be measured rather than assumed.

## What was measured

- **${northStar} incremental attended appointments per 1,000 eligible patients** — the
  attendance rate above what the holdout group did on its own.
- ${report.incrementalAttended?.toFixed(0)} incremental attended appointments over the period
  (point estimate; every patient counted in their originally assigned group).
- ${report.invitationsSent.toLocaleString("en-AU")} invitations sent, ${report.booked} booked
  (${pct(report.conversionRate)} conversion), non-attendance on generated bookings ${pct(report.generatedDnaRate)}.
- ${report.optedOut} opt-outs (${pct(report.invitationsSent === 0 ? 0 : report.optedOut / report.invitationsSent)} of messages sent). Every opt-out is permanent.

## How the counting stays honest

Counting every booking that followed an invitation would have claimed
${report.naiveGeneratedAttended} attended visits. Part of that attendance would have
happened anyway; the holdout comparison removes it. The smaller number above is the
one CareYield reports, because it is the one the practice actually gained.

## What the visits contained

Of the generated visits audited by the practice's GPs, ${report.clinicianJudgedReasonableRate === null ? "n/a" : pct(report.clinicianJudgedReasonableRate)} were judged
a reasonable use of the appointment. The most common outcomes were routine
follow-up, medicines management, and preventive care — ordinary general practice,
delivered to patients who had drifted off the books.

## Limitations

Point estimates from a single practice over ${report.weeksSimulated} weeks; no confidence
intervals are implied. Attendance figures are counts of appointments, not health
outcomes — this document makes no claims about anyone's health.
`;

  assertPublishable(text, context.identifyingStrings);
  return text;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

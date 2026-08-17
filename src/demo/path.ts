// W309: the demo path — seeded practice to rendered console answer, with every gate that stops it
// named on the page where it stops.
//
// THE PRODUCT HAS BEEN WALKABLE SINCE W22 AND THE WALK HAS NEVER SAID WHAT IT IS NOT. The demo runs:
// launch a synthetic practice, see the console, send the invites, book as a patient, read the
// incrementality answer. Every one of those steps is a real screen doing real work on synthetic
// data — and four of the five stop short of what the same screen would do at a live practice,
// because a founder gate has not been ruled on. Until this unit the pages said so in prose, each
// in its own words, none of them naming the gate: "Referral records here are synthetic", "Nothing
// on this page is sent anywhere", "simulated weeks". Ten pages, ten sentences, one fact.
//
// A REFUSAL THAT DOES NOT NAME ITS GATE IS A DISCLAIMER. It reads as a caveat about a demo rather
// than a statement about a decision somebody has to make — which is the difference between "this is
// only a demo" and "this is finished, and G3 is why it does not send". `GATE-DOSSIER-Y5.md` records
// that the loop has proposed a gate roughly once a year for three years and none has been ruled on;
// a product that cannot show a founder where the unruled decisions bite is a product asking them to
// take that on faith.
//
// SO THE PATH IS DATA. Each step names its route, what it demonstrates, the answer a walk should
// find rendered there, and the gate that stops it if one does. `pathDefects` checks it against the
// tree in both directions — a step declared as gate-stopped whose page does not render the refusal
// fails, and a page rendering one that no step declares fails — and `e2e/demo-path.spec.ts` walks
// the routes in order and reads the refusals off the screen. The register cannot drift from the
// product without one of the two going red.
//
// FOUNDER GATE (plan §4): nothing crossed, and the unit is about not crossing them. Every step runs
// on synthetic data; the gates that stop the path are named rather than worked around.

import { readFileSync } from "node:fs";
import path from "node:path";
import { liveConnectionsPermitted } from "@/interop/credentials";
import { discoverSurfaces } from "@/compliance/surfaces";
import { PUBLIC_SURFACES } from "@/compliance/public-surfaces";
import { GATE_REFUSAL_COPY, type GateId } from "@/console/gates";

/** The gate that stops a step, and what it stops there. */
export interface Blocker {
  gate: GateId;
  /** What this step would do differently at a live practice. Reviewer-facing, not rendered. */
  what: string;
  /**
   * The page that renders the refusal — usually the step's own, and deliberately not always.
   *
   * A GATE IS OPERATOR COPY. `/book/[token]` is the most patient-facing surface in the product,
   * reached by somebody who was contacted rather than somebody who went looking, and telling that
   * person the software is waiting on "founder gate G1" is an internal sentence shown to the one
   * audience it means nothing to. So that step's refusal renders on the presenter's page, where the
   * person who can act on the gate is standing. The check enforces the other half: no page this
   * tree declares patient-facing may render one at all.
   */
  renderedOn: string;
  /** Required when the refusal renders somewhere other than the step's own page. */
  whyElsewhere?: string;
}

export interface PathStep {
  /** The URL a walk visits. */
  route: string;
  /** The file that renders it, so the refusal can be re-derived from the tree. */
  page: string;
  /** What the step demonstrates. */
  does: string;
  /**
   * A `data-testid` the page renders when the step has worked.
   *
   * A MARKER RATHER THAN THE COPY. An expected sentence here would be an eleventh copy of the
   * page's own words, and the register would then have to be edited whenever anybody rewrote a
   * heading — the churn W290 swept and W304 removed at its source.
   */
  answer: string;
  stoppedBy: Blocker | null;
}

/**
 * The walk, in order.
 *
 * FIVE STEPS AND FOUR OF THEM MEET A GATE, including the last one. That is the honest shape of this
 * product today and the register exists to keep it visible: the headline answer — did inviting
 * people bring more of them in than not inviting them — is produced from a simulated run, because
 * measuring a real practice is what G4 gates.
 */
export const DEMO_PATH: readonly PathStep[] = [
  {
    route: "/demo",
    page: "app/demo/page.tsx",
    does: "Seeds a synthetic practice, one clinician, one open session and three invited patients, and signs the presenter in.",
    answer: "demo-seeded",
    stoppedBy: {
      gate: "G2",
      what: "At a live practice the recall list would come from the PMS. Here it is generated from a seed, and the same screen would otherwise be reading real patients.",
      renderedOn: "app/demo/page.tsx",
    },
  },
  {
    route: "/console",
    page: "app/console/page.tsx",
    does: "The practice's own console: the seeded practice named, with its holdout share.",
    answer: "console-practice",
    stoppedBy: null,
  },
  {
    route: "/console/outreach",
    page: "app/console/outreach/page.tsx",
    does: "The invite decision: who would be nudged, who is refused and why, with the message composed.",
    answer: "outreach-plan",
    stoppedBy: {
      gate: "G3",
      what: "The nudge is rendered and never handed to a sender. The rail exists and is switched off at the gate rather than at the code path.",
      renderedOn: "app/console/outreach/page.tsx",
    },
  },
  {
    route: "/book/",
    page: "app/book/[token]/page.tsx",
    does: "The patient moment: a tokenised deep link that books a real appointment against the seeded session.",
    answer: "booking-confirmed",
    stoppedBy: {
      gate: "G1",
      what: "The booking is written to this tree's rail. A practice system would need credentials, and the write path is the same shape either way.",
      renderedOn: "app/demo/page.tsx",
      whyElsewhere:
        "W274 declares `/book/[token]` patient-facing and says why: it is reached by somebody who was contacted rather than somebody who went looking. A person following an invitation has no use for the name of a decision inside this company, and the sentence would land as a warning about their own appointment. The presenter's page is where the refusal belongs, because that is where the booking links are handed out and where somebody who can move G1 is looking.",
    },
  },
  {
    route: "/console/dashboard",
    page: "app/console/dashboard/page.tsx",
    does: "The answer: the invited arm against the holdout, with the counterfactual withheld where it cannot be claimed.",
    answer: "incrementality-answer",
    stoppedBy: {
      gate: "G4",
      what: "The weeks are simulated. THE HEADLINE ANSWER IS THE ONE MOST WORTH BEING HONEST ABOUT, and a pilot is what would make it a measurement rather than a demonstration.",
      renderedOn: "app/console/dashboard/page.tsx",
    },
  },
];

/** Every step a gate stops, in path order. */
export function gateStops(steps: readonly PathStep[] = DEMO_PATH): Array<PathStep & { stoppedBy: Blocker }> {
  return steps.filter((s): s is PathStep & { stoppedBy: Blocker } => s.stoppedBy !== null);
}

export interface PathDefect {
  step: string;
  what: string;
}

/** How a page names its refusal. One component, so the check is a search for one call shape. */
const ANY_REFUSAL = /<GateRefusal\s+gate="(G\d+)"\s*\/>/g;

const read = (root: string, rel: string): string | null => {
  try {
    return readFileSync(path.join(root, rel), "utf8");
  } catch {
    return null;
  }
};

/**
 * The register against the tree, both directions, over every route the app serves.
 *
 * THE SECOND DIRECTION IS THE ONE THAT MATTERS. A page rendering a refusal no step declares is a
 * screen telling an operator about a gate this register has forgotten, which is worse than an
 * undeclared step because it reads as covered. So the sweep is over `discoverSurfaces` — W102's
 * walk, already proved against a constructed tree — rather than over the path's own pages, which
 * would only ever find what the register already knows.
 */
export function pathDefects(root: string, steps: readonly PathStep[] = DEMO_PATH): PathDefect[] {
  const out: PathDefect[] = [];
  const declared = new Map<string, Set<string>>();
  for (const step of steps) {
    if (read(root, step.page) === null) {
      out.push({ step: step.route, what: `names a page the tree does not have: ${step.page}` });
    }
    if (!step.stoppedBy) continue;
    const { gate, renderedOn, whyElsewhere } = step.stoppedBy;
    declared.set(renderedOn, (declared.get(renderedOn) ?? new Set()).add(gate));
    const source = read(root, renderedOn);
    if (source === null) {
      out.push({ step: step.route, what: `renders its refusal on a page the tree does not have: ${renderedOn}` });
    } else if (!new RegExp(`<GateRefusal\\s+gate="${gate}"\\s*/>`).test(source)) {
      out.push({ step: step.route, what: `is stopped by ${gate} and ${renderedOn} renders no refusal` });
    }
    if (renderedOn !== step.page && !whyElsewhere) {
      out.push({ step: step.route, what: `renders its refusal on ${renderedOn} without saying why` });
    }
  }

  const patientFacing = new Set(
    PUBLIC_SURFACES.filter((s) => s.audience === "patient").map((s) => `app${s.path}/page.tsx`),
  );
  for (const surface of discoverSurfaces(path.join(root, "app"))) {
    const file = path.relative(root, surface.file).split(path.sep).join("/");
    const source = readFileSync(surface.file, "utf8");
    for (const match of source.matchAll(ANY_REFUSAL)) {
      const gate = match[1]!;
      if (patientFacing.has(file)) {
        out.push({ step: surface.path, what: `is patient-facing and names ${gate} to that audience` });
      } else if (!declared.get(file)?.has(gate)) {
        out.push({ step: surface.path, what: `renders a refusal for ${gate}, which no step declares` });
      }
    }
  }
  return out;
}

/**
 * The claim the whole path rests on, re-derived rather than asserted.
 *
 * Three separate facts, and the gate for this unit names all three: no real patient, no live send,
 * no production credential. The first two are properties of the pages; the third is a function the
 * tree already exports and which returns a type that cannot be true.
 */
export function syntheticOnlyDefects(root: string, steps: readonly PathStep[] = DEMO_PATH): PathDefect[] {
  const out: PathDefect[] = [];
  if (liveConnectionsPermitted() !== false) {
    out.push({ step: "*", what: "live connections are permitted" });
  }
  for (const step of steps) {
    let source: string;
    try {
      source = readFileSync(path.join(root, step.page), "utf8");
    } catch {
      continue;
    }
    // A page on this path may compose a message; it may not hand one to a sender. The check is a
    // CALL or an import, not the vendor's name: the credential probe below reads
    // `process.env.TWILIO_AUTH_TOKEN`, and a bare-name match reported that one twice under two
    // different gates — one defect, two sentences, which is how a register overstates.
    if (/\bsendSms\s*\(|\bsendMessage\s*\(|from ["'][^"']*twilio/i.test(source)) {
      out.push({ step: step.route, what: "reaches a sender from a page on the demo path" });
    }
    if (/process\.env\.[A-Z_]*(?:TWILIO|API_KEY|SECRET|TOKEN)/.test(source)) {
      out.push({ step: step.route, what: "reads a credential from the environment" });
    }
  }
  return out;
}

/**
 * What walking this path does not show.
 *
 * The uncomfortable half, and for this unit it is the whole point rather than a caveat.
 */
export const PATH_BOUND =
  "A green walk here means the screens render and the refusals name their gates. It does NOT mean " +
  "the product works at a practice: every step runs on generated data, and the steps a gate stops " +
  "are stopped in the only way this tree can stop them — by not building the other side. What the " +
  "walk proves about the gated half is that the shape is there and the refusal is honest, not that " +
  "the connection would succeed. The refusal check reads a component call in the page source, so a " +
  "page that renders the component behind a condition nobody meets would pass here and show an " +
  "operator nothing; that is the class of bound W267 states about `readdirSync`, and the e2e spec " +
  "beside this is what closes it for the routes the walk visits. Routes off the path are swept for " +
  "a refusal they should not carry, and never walked.";

export { GATE_REFUSAL_COPY, type GateId } from "@/console/gates";

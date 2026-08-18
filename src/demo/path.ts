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
// WHAT THIS DOES NOT PROVE is `PATH_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed, and the unit is about not crossing them. Every step runs
// on synthetic data; the gates that stop the path are named rather than worked around.

import { readFileSync } from "node:fs";
import { PREREQUISITES, type Prerequisite } from "@/console/setup-gaps";
import { CYCLES, type Cycle } from "@/console/waiting";
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
    // `app${"/"}/page.tsx` is `app//page.tsx`, so the HOME page — the one public surface declared
    // patient-facing that a patient is most likely to land on — could never match this set and the
    // rule below could never fire for it. Q24's review found it.
    PUBLIC_SURFACES.filter((s) => s.audience === "patient").map(
      (s) => `app${s.path === "/" ? "" : s.path}/page.tsx`,
    ),
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
/**
 * A point where the PRACTICE says no, and what the screen must show when it does.
 *
 * W309 walks a practice that accepts everything. That is the demo, and it is half the product:
 * every screen in this tree has a refusal state, most of them were built because a zero rendered
 * as a measurement was the wrong answer, and NOT ONE OF THEM IS ON THE DEMO PATH. A prospect
 * shown only the accepting walk is being shown a product that cannot be declined.
 *
 * `marker` IS A `data-testid`, not the copy — W309's rule, for W290's reason: an expected sentence
 * here would be a second copy of the page's own words, and the register would need editing
 * whenever anybody rewrote a heading.
 */
export interface RefusalStep {
  route: string;
  page: string;
  /** What the practice or the patient declines. */
  declines: string;
  /** The `data-testid` the page renders when the refusal is visible. */
  marker: string;
  /** Why the refusal has to be SHOWN rather than absorbed. */
  why: string;
}

/**
 * The second walk: a practice that declines at every point the product offers one.
 *
 * IN THE ORDER A PRACTICE WOULD MEET THEM, and each step's refusal is rendered where the decision
 * is made rather than summarised somewhere else. The last step is the one that matters most: with
 * nothing sent, the answer screen has to say there is nothing to measure. A dashboard rendering
 * zeros would be reporting a result, and there is none — W179's finding, applied to the walk.
 */
export const REFUSAL_PATH: readonly RefusalStep[] = [
  {
    route: "/console/registers",
    page: "app/console/registers/page.tsx",
    declines: "The practice switches a register off for itself, so nobody in it is considered.",
    marker: "register-",
    why: "W60 gives a practice the switch. A register turned off has to LOOK off on the page that owns it — a switch whose state is only visible in its consequences is one nobody trusts.",
  },
  {
    route: "/console/ops",
    page: "app/console/ops/page.tsx",
    declines: "The practice pauses sending for itself, without touching anybody else's.",
    marker: "sending-status",
    why: "W19's per-practice pause. The status line distinguishes paused-for-this-practice from the global kill switch, because an operator reading one as the other would either escalate nothing or escalate everything.",
  },
  {
    route: "/console/outreach",
    page: "app/console/outreach/page.tsx",
    declines: "With sending paused, the practice sees what WOULD have been sent and that none of it will be.",
    marker: "sending-paused",
    why: "THE STEP THAT WOULD BE EASIEST TO GET WRONG, and the one W321 found MISSING. A paused practice read this page with nothing on it saying its invitations would not go — the plan, the wording, the counts, and no answer to *will this be sent*. Blanking the page instead would have been worse: an empty outreach page reads as *nobody was eligible*, the opposite of *everybody was and you have it switched off*. The plan is still rendered and the sending is what stops.",
  },
  {
    route: "/console/outreach",
    page: "app/console/outreach/page.tsx",
    declines: "A patient has opted out, and is withheld with the reason rather than silently dropped.",
    marker: "withheld-row",
    why: "W6's STOP handling, made visible. A patient removed from a list without a reason beside them is indistinguishable from a patient the rules never reached, and only one of those is somebody's decision.",
  },
  {
    route: "/console/ops",
    page: "app/console/ops/page.tsx",
    declines: "Nothing is outstanding, and the page says WHICH nothing.",
    marker: "silence",
    why: "W179: *no offers outstanding* was true of a quiet week and of a feed that died on Tuesday, and those send an operator opposite ways. The refusal walk ends here because a practice that declined everything produces exactly this screen.",
  },
];

export interface RefusalDefect {
  step: string;
  what: string;
}

/**
 * The refusal walk against the tree — every marker resolved to the page that renders it.
 *
 * W258'S RULE, applied to a walk: a step naming a marker no page renders is a claim that a refusal
 * is visible when it is not, and it reads as coverage. The `marker-` prefixes are matched as
 * prefixes because several are rendered per-item (`register-${code}`, `silence-${cause}`), which
 * is the shape those pages already had.
 */
export function refusalDefects(root: string, steps: readonly RefusalStep[] = REFUSAL_PATH): RefusalDefect[] {
  const out: RefusalDefect[] = [];
  for (const step of steps) {
    const source = read(root, step.page);
    if (source === null) {
      out.push({ step: `${step.route} :: ${step.marker}`, what: `names a page the tree does not have: ${step.page}` });
      continue;
    }
    // TWO SPELLINGS AND BOTH ARE REAL: `data-testid="silence"` for a fixed marker and
    // ``data-testid={`silence-${cause}`}`` for one rendered per item. A check that knew only the
    // first would report every per-item refusal as unrendered, which is most of them.
    const quoted = source.includes(`data-testid="${step.marker}`);
    const templated = source.includes("data-testid={`" + step.marker);
    if (!quoted && !templated) {
      out.push({
        step: `${step.route} :: ${step.marker}`,
        what: `declines something ${step.page} renders no marker for`,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// W334: the third scenario — a practice that started setting up and did not finish.
// ---------------------------------------------------------------------------------------------

/** A page an operator lands on while a setup step is still unfinished. */
export interface UnfinishedStep {
  route: string;
  page: string;
  /** The wizard step that is unmet, as `setupReadiness` names it. */
  unmet: Prerequisite;
  /** What is empty or blank on this page BECAUSE of it. */
  consequence: string;
  /** Why an operator would be on this page rather than in the wizard. */
  why: string;
}

/**
 * The third walk: nothing is refused and nothing is broken — the practice simply is not finished.
 *
 * IT IS THE COMMONEST STATE A NEW PRACTICE IS IN and the one the console said least about. W309's
 * walk is a practice that goes all the way; W321's is a practice that declines at every offer.
 * This one is neither: every screen works, every screen is empty, and until now not one of them
 * said the reason was three fields in a wizard. An operator in that state was being shown *Nothing
 * here yet* — true, and indistinguishable from a practice that finished and had a quiet fortnight.
 *
 * THE PAGES ARE NAMED RATHER THAN DERIVED, and `SETUP_GAP_BOUND` argues why: the notice belongs
 * where the consequence shows up, not on every console route, because the wizard is a console
 * route too and telling somebody mid-setup that their setup is unfinished is not help.
 */
export const UNFINISHED_PATH: readonly UnfinishedStep[] = [
  {
    route: "/console/dashboard",
    page: "app/console/dashboard/page.tsx",
    unmet: "clinicians",
    consequence: "Every figure is computed over appointments, and a practice with no participating clinician has none.",
    why: "The first screen anybody opens. If one page in the console has to say why the product looks empty, it is the one an operator lands on without being sent there.",
  },
  {
    route: "/console/capacity",
    page: "app/console/capacity/page.tsx",
    unmet: "sessions",
    consequence: "Capacity is worked out from the appointment types that can be filled and how far ahead to look, and neither has been set.",
    why: "An operator checking whether there is room to see anybody. A blank capacity page reads as no room rather than as no settings, which is the opposite conclusion.",
  },
  {
    route: "/console/registers",
    page: "app/console/registers/page.tsx",
    unmet: "rules",
    consequence: "Nobody is eligible under rules nobody has set, so every register is empty.",
    why: "Where a practice goes to see who is due. An empty register with no rules behind it is the exact zero W179 refused: it looks like an answer and is the absence of a question.",
  },
  {
    route: "/console/outreach",
    page: "app/console/outreach/page.tsx",
    unmet: "clinicians",
    consequence: "There is nobody to contact on behalf of a practice with no participating clinician.",
    why: "The page where an operator would expect the product to be doing something. Included alongside the dashboard because `clinicians` is the step whose absence is felt in the most places, and a walk naming it once would suggest it bites once.",
  },
];

export interface UnfinishedDefect {
  step: string;
  what: string;
}

/**
 * Every page in the walk renders the notice, and names a step the wizard really checks.
 *
 * TWO DIRECTIONS AND THE SECOND IS THE ONE THAT ROTS. A page that stops rendering the notice is
 * the obvious failure; a step named here that `setupReadiness` no longer has is the quiet one,
 * because the walk would keep passing while describing a prerequisite the wizard had dropped.
 */
export function unfinishedDefects(
  root: string,
  steps: readonly UnfinishedStep[] = UNFINISHED_PATH,
): UnfinishedDefect[] {
  const out: UnfinishedDefect[] = [];
  for (const step of steps) {
    const id = `${step.route} :: ${step.unmet}`;
    if (!PREREQUISITES.includes(step.unmet)) {
      out.push({ step: id, what: `names ${step.unmet}, which the wizard does not check` });
    }
    const source = read(root, step.page);
    if (source === null) {
      out.push({ step: id, what: `names a page the tree does not have: ${step.page}` });
      continue;
    }
    if (!source.includes("<SetupGaps")) {
      out.push({ step: id, what: `is in the walk and ${step.page} renders no setup notice` });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// W346: the fourth scenario — a practice that finished setting up, on the morning after.
// ---------------------------------------------------------------------------------------------

/** A page a finished practice lands on before the first cycle has filled it. */
export interface WaitingStep {
  route: string;
  page: string;
  /** The cycle this page's contents are downstream of. */
  cycle: Cycle;
  /** The expression the page passes as its own emptiness, quoted so a reader can find it. */
  emptyWhen: string;
  /** Why an operator would be on this page on day two. */
  why: string;
}

/**
 * The fourth walk: everything is finished, nothing has run, and every screen is still empty.
 *
 * W309'S WALK GOES ALL THE WAY, W321'S DECLINES AT EVERY OFFER, W334'S NEVER FINISHES. This one is
 * the morning after the wizard — the one state where the product is entirely correct and looks
 * exactly like the one where it is not. Somebody who has just spent twenty minutes on setup and
 * opens a blank register page has no way to tell *the first run has not happened* from *we looked
 * and there is nobody*, and those two conclusions send them to opposite places.
 *
 * TWO PAGES, AND THE PAIR WAS FOUND BY WALKING RATHER THAN BY READING. The first draft of this
 * register named `/console/registers`, `/console/outreach` and `/console/capacity` on the
 * reasonable-sounding argument that a practice with no cycle behind it has no registers, no
 * invitations and no diary. Driving a real practice through the whole wizard and then opening
 * those three showed all of them FULL: they are computed from the synthetic set this tree ships
 * rather than from anything the practice has done. What is actually empty the morning after is the
 * referral record, in two places. `WAITING_ELSEWHERE` below carries the pages that are empty and
 * say so in their own words, so a walk over two routes cannot read as a claim about a console with
 * twenty.
 */
export const WAITING_PATH: readonly WaitingStep[] = [
  {
    route: "/console/referrals",
    page: "app/console/referrals/page.tsx",
    cycle: "referrals_recorded",
    emptyWhen: "sent.length === 0 && received.length === 0",
    why: "The record of what this practice has referred and what has been referred to it. On day two both halves are empty, and an empty referral list reads as a practice that refers nobody rather than as one that has not started — which is the opposite conclusion about how the practice works.",
  },
  {
    route: "/console/outcomes",
    page: "app/console/outcomes/page.tsx",
    cycle: "referrals_recorded",
    emptyWhen: "summary.total === 0",
    why: "What the record says happened to the referrals this practice wrote. It is empty for the same reason and one step further on, and it is named alongside the referral list rather than folded into it because the same absence reaching two screens is what makes it look like a product fault rather than a state.",
  },
];

/** A wait a page names in its OWN words, rather than through `<Waiting>`. */
export interface WaitingElsewhere {
  route: string;
  page: string;
  /** The `data-testid` that page renders for it, resolved against the source. */
  marker: string;
  /** What that page says, and why this notice would be worse. */
  why: string;
}

/**
 * The waits the console names somewhere other than `<Waiting>`.
 *
 * `/console/capacity` IS IN NEITHER LIST AND THAT IS DELIBERATE. It holds a `no_diary_recorded`
 * state with a *what would settle it* list, which is the practice-system wait named better than
 * this unit would name it — but the seeded practice HAS a diary, so the state does not render on
 * day two and a row here asserting it does would be a claim nothing could walk. The honest place
 * for that argument is this paragraph, not a row.
 *
 * WITHOUT THESE ROWS THE WALK WOULD READ AS COVERAGE. Two pages carrying the notice, out of a
 * console with twenty routes, is a claim about two pages — and the gate asks that every waiting
 * state be named where an operator would look, which is a claim about the console. These are the
 * states that are named and not by this unit, resolved against the marker the page really renders
 * so the row cannot outlive the copy it is describing.
 */
export const WAITING_ELSEWHERE: readonly WaitingElsewhere[] = [
  {
    route: "/console/education",
    page: "app/console/education/page.tsx",
    marker: "library-empty",
    why: "It is empty on day two and says so in its own words, naming the library rather than a cycle — which is right, because what fills it is somebody signing off material rather than a run of anything, and G5 is what stands between this practice and that. A notice telling an operator to wait would be describing a wait that no cycle ends.",
  },
  {
    route: "/console/dashboard",
    page: "app/console/dashboard/page.tsx",
    marker: "incrementality-answer",
    why: "It is never empty, and that is the honest reason rather than an oversight: its figures come from this tree's synthetic run rather than from the practice, and the marker it renders says exactly that — simulated weeks over synthetic patients. A notice telling a finished practice to wait for its own first cycle would be describing a screen that is not about them.",
  },
];

export interface WaitingDefect {
  step: string;
  what: string;
}

/**
 * The fourth walk against the tree, in three directions.
 *
 * THE THIRD IS THE ONE THAT KEEPS THE COUNT HONEST. A page in the walk must render the notice; a
 * cycle named must be one `waiting.ts` has; and a page in `WAITING_ELSEWHERE` must still render the
 * marker its row says it does — because a row excusing a page from this notice on the grounds that
 * it says the thing itself is worth exactly as much as that page still saying it.
 */
export function waitingDefects(
  root: string,
  steps: readonly WaitingStep[] = WAITING_PATH,
  elsewhere: readonly WaitingElsewhere[] = WAITING_ELSEWHERE,
): WaitingDefect[] {
  const out: WaitingDefect[] = [];
  for (const step of steps) {
    const id = `${step.route} :: ${step.cycle}`;
    if (!CYCLES.includes(step.cycle)) {
      out.push({ step: id, what: `names ${step.cycle}, which is not a cycle the console shows` });
    }
    const source = read(root, step.page);
    if (source === null) {
      out.push({ step: id, what: `names a page the tree does not have: ${step.page}` });
      continue;
    }
    if (!source.includes("<Waiting")) {
      out.push({ step: id, what: `is in the walk and ${step.page} renders no waiting notice` });
    }
    if (!source.includes(step.emptyWhen)) {
      out.push({ step: id, what: `says the page is empty when \`${step.emptyWhen}\`, and ${step.page} does not say that` });
    }
  }
  for (const row of elsewhere) {
    const id = `${row.route} :: ${row.marker}`;
    const source = read(root, row.page);
    if (source === null) {
      out.push({ step: id, what: `names a page the tree does not have: ${row.page}` });
      continue;
    }
    if (!source.includes(`data-testid="${row.marker}"`)) {
      out.push({ step: id, what: `is excused because ${row.page} names the wait itself, and it renders no ${row.marker}` });
    }
  }
  return out;
}

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

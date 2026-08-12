// W261: what this tree DOES on the day a gate is answered.
//
// W257 priced the outstanding decisions — how many units each releases, how long each has waited,
// and the finding that the four gates blocking no unit are the four that matter. This answers the
// next question, which a founder asks immediately after reading that one: **and then what
// happens?** A gate is not answered into a vacuum; somebody has to change something, and this
// register says what, in the tree's own file names.
//
// EVERY STEP MUST RESOLVE TO SOMETHING THAT EXISTS. That is the gate's central instruction and it
// is the whole difference between this and a plan. A readiness path naming a module nobody has
// written is a path nobody can follow, and it is worse than no path at all because it reads like
// preparation. So every step carries a real path, the test opens it, and a step pointing at a file
// the tree does not have fails the build.
//
// AND A GATE WITH NO PATH FAILS. Both directions against the plan's §4: a gate defined there with
// no readiness entry fails, and an entry for a gate the plan does not define fails too. The Q17
// learned-ranking decision is included even though it is not a gate, because W257 established it
// is the only outstanding item whose answer could require changing something already PUBLISHED.
//
// THIS REGISTER IS DELIBERATELY NOT BOUNDED TO A YEAR, and the contrast with DOSSIER-1 is worth
// stating. W210's finding is about a document that prices a snapshot: its counts go stale the
// moment the next year is planned, so W257 is bounded to Year 5. A readiness PATH does not expire
// when a year is added — a gate answered in Y7 still needs the same files changed — so the counts
// here are DERIVED from the ledger at read time rather than pinned as numbers. A Y6 unit blocked
// on G5 moves both sides together and nothing breaks falsely.
//
// WHAT THIS IS NOT: a recommendation to answer anything, an ordering, or an estimate of effort.
// W257 refused to rank the outstanding decisions because the two orders its tables produce
// disagree, and nothing here quietly supplies one.

/** Where a step lands. Checked against the tree by this unit's test. */
export type StepTarget = "module" | "registry" | "test" | "document";

export interface ReadinessStep {
  /** What somebody does. An instruction, not a description. */
  step: string;
  /** The repo-relative path it lands on. Opened by the test — a missing file fails the build. */
  path: string;
  target: StepTarget;
}

export interface GateReadiness {
  /** The gate, as the plan's §4 names it, or the one non-gate decision W257 identified. */
  gate: string;
  /** What is true the moment it is answered, before anybody does anything. */
  onTheDay: string;
  steps: readonly ReadinessStep[];
  /**
   * Gates that STILL block after this one is answered.
   *
   * W245's double-blocking finding, generalised: ratifying G10 releases no exchange because G1
   * blocks the credential, and a readiness register that omitted this would read as a route to
   * something live.
   */
  stillBlockedBy: readonly string[];
}

export const GATE_READINESS: readonly GateReadiness[] = [
  {
    gate: "G1",
    onTheDay:
      "Nothing changes by itself. Every credential slot is still refused by the loader rather than by the list being empty, so a ratification with no code change leaves the product exactly as it is — which is the posture W242 built on purpose.",
    steps: [
      {
        step: "Make `loadCredential` stop refusing before it looks at the value, and record who ruled and when.",
        path: "src/interop/credentials.ts",
        target: "module",
      },
      {
        step: "Flip `liveConnectionsPermitted` from its constant `false`. It takes no argument so this is an edit somebody reviews, never a deployment setting.",
        path: "src/interop/credentials.ts",
        target: "module",
      },
      {
        step: "Narrow `grantedScopes` from every scope to what a token carries — the line that stops being 'a console session reads its own practice' the day a machine caller exists.",
        path: "src/api/scopes.ts",
        target: "module",
      },
      {
        step: "Point W27's adapter contract at a real PMS instead of the synthetic one, keeping the contract tests as the acceptance.",
        path: "src/pms/adapter.ts",
        target: "module",
      },
    ],
    stillBlockedBy: ["G2"],
  },
  {
    gate: "G2",
    onTheDay:
      "Every figure in the tree stops being about a synthetic run. Nothing in the code distinguishes the two, which is why the privacy machinery has to be exercised before the first record arrives rather than after.",
    steps: [
      {
        step: "Re-derive W106's record classes against the tree, and check every `stored` class is reached by an erasure path.",
        path: "src/privacy/record-classes.ts",
        target: "registry",
      },
      {
        step: "Run the erasure and access paths over the classes W106 declares, not over a list.",
        path: "src/privacy/state.ts",
        target: "module",
      },
      {
        step: "Complete the privacy impact assessment the plan requires before any real record is loaded.",
        path: "docs/COMPLIANCE-DOSSIER.md",
        target: "document",
      },
    ],
    stillBlockedBy: [],
  },
  {
    gate: "G3",
    onTheDay:
      "W174 becomes buildable. Nothing sends: the messaging rail still runs against a mock, and every template still needs the practice's own approval, which an edit of one character withdraws.",
    steps: [
      {
        step: "Replace the mock transport with the real one, keeping the compliance linter between a template and the wire.",
        path: "src/messaging/twilio.ts",
        target: "module",
      },
      {
        step: "Re-run the template approval workflow so no message can be sent under an approval that predates its wording.",
        path: "src/messaging/approval.ts",
        target: "module",
      },
    ],
    stillBlockedBy: ["G1", "G2"],
  },
  {
    gate: "G4",
    onTheDay:
      "The product can be used by a practice for the first time. Everything the pilot needs is written and unsigned, so the readiness path is mostly reading rather than building.",
    steps: [
      {
        step: "Sign the pilot agreement and the holdout consent design, which are drafted and waiting.",
        path: "docs/PILOT-AGREEMENT-TEMPLATE.md",
        target: "document",
      },
      {
        step: "Work the go-live steps in the playbook, which name the guardrails that must be green before the first send.",
        path: "docs/PILOT-PLAYBOOK.md",
        target: "document",
      },
    ],
    stillBlockedBy: ["G1", "G2", "G3"],
  },
  {
    gate: "G5",
    onTheDay:
      "Six blocked units become buildable — the largest single release of any outstanding decision, and it grew from four during Year 5. No content ships until it passes the sign-off workflow, which exists and is exercised on synthetic content.",
    steps: [
      {
        step: "Record a two-person sign-off per pathway version through the approval workflow, which refuses content nobody has signed.",
        path: "src/pathways/approval.ts",
        target: "module",
      },
      {
        step: "Fill `SHIPPED_PATHWAYS`, which is empty and pinned empty by its own test until a signed version exists.",
        path: "src/pathways/versioning.ts",
        target: "registry",
      },
      {
        step: "Run the vertical completeness report, which names every missing member and who must act rather than reporting a percentage.",
        path: "src/verticals/completeness.ts",
        target: "module",
      },
    ],
    stillBlockedBy: [],
  },
  {
    gate: "G6",
    onTheDay:
      "Two blocked units become buildable. The directory still publishes nothing: profiles are empty and pinned, and every string on a public surface still has to pass the advertising sweep.",
    steps: [
      {
        step: "Fill `SHIPPED_DIRECTORY_PROFILES` from what clinicians have declared, never from activity.",
        path: "src/directory/profile.ts",
        target: "registry",
      },
      {
        step: "Re-run the public-surface sweep over every page the launch would expose.",
        path: "src/compliance/public-surfaces.ts",
        target: "registry",
      },
    ],
    stillBlockedBy: [],
  },
  {
    gate: "G7",
    onTheDay:
      "Nothing, and that is the answer rather than an omission. G7 is a line the product was built inside rather than a decision waiting to be taken — which is why it blocks no ledger row. Its readiness path is what happens when somebody PROPOSES a feature that would cross it.",
    steps: [
      {
        step: "Re-derive the five rail properties against whatever the proposal adds, naming the surface that could break each.",
        path: "src/compliance/rail-y5.ts",
        target: "registry",
      },
      {
        step: "Check the proposal against the declared copy surface, so a feature cannot arrive with copy nothing lints.",
        path: "src/compliance/cdss-boundary.ts",
        target: "registry",
      },
      {
        step: "Run the re-derivation's own assertions rather than re-reading the modules.",
        path: "src/compliance/rail-y5.test.ts",
        target: "test",
      },
    ],
    stillBlockedBy: [],
  },
  {
    gate: "G8",
    onTheDay:
      "W146 and W147 become buildable. Nothing calls a model API today and no vendor is declared, so the readiness path starts from an empty allowlist rather than from disconnecting something.",
    steps: [
      {
        step: "Declare the vendor, the data flow and the retention terms in the sink register, which is empty and stays empty until this is ruled.",
        path: "src/security/instruction-sinks.ts",
        target: "registry",
      },
      {
        step: "Build W146's de-identification gate in front of any sink, so patient-derived content cannot reach a vendor un-gated.",
        path: "src/security/untrusted.ts",
        target: "module",
      },
    ],
    stillBlockedBy: ["G2"],
  },
  {
    gate: "G9",
    onTheDay:
      "W202 and W203 become buildable, and nothing is disclosed: there is no transport, no recipient allowlist and no delivery adapter anywhere in the interop surface.",
    steps: [
      {
        step: "Answer W204's open question by setting `PAYLOAD_MODE`, which derives the retention life, the erasure obligation and the W106 record class from that one line.",
        path: "src/interop/disclosure-ledger.ts",
        target: "module",
      },
      {
        step: "Gate every disclosure behind a recorded patient consent that matches the recipient class, the kind, the practice and the whole period.",
        path: "src/interop/consent-to-disclose.ts",
        target: "module",
      },
      {
        step: "Build the delivery adapter W203 owns, which refuses live endpoints until the credential gate opens as well.",
        path: "src/interop/credentials.ts",
        target: "registry",
      },
    ],
    stillBlockedBy: ["G1"],
  },
  {
    gate: "G10",
    onTheDay:
      "W240 and W241 become buildable and NO EXCHANGE IS RELEASED. The payer credential slot is blocked by G1 as well, which W245 established and W257 carried: ratifying this alone does not move a byte.",
    steps: [
      {
        step: "Rule on whether consent must name the counterparty or may name the class — W245's cost 1, which is a choice rather than a defect.",
        path: "src/interop/consent-to-disclose.ts",
        target: "module",
      },
      {
        step: "Fill the payer credential slot, which records BOTH its blockers rather than the first.",
        path: "src/interop/credentials.ts",
        target: "registry",
      },
      {
        step: "Build W241's claim-status read behind the consent gate rather than beside it, because asking a payer about a patient is a disclosure.",
        path: "src/api/surface.ts",
        target: "module",
      },
    ],
    stillBlockedBy: ["G1", "G2"],
  },
  {
    gate: "Q17-action-1",
    onTheDay:
      "W217 becomes buildable, and this is the only outstanding item whose answer could require changing something ALREADY PUBLISHED — the ADM notice describes what the software decides about a patient, and ordering patients by a learned model is not in it.",
    steps: [
      {
        step: "Add the decision to the register the published page renders, which is checked against the source in both directions.",
        path: "src/privacy/automated-decisions.ts",
        target: "registry",
      },
      {
        step: "Re-derive the rail property that says the product never orders people by need, against whatever the ranking reads.",
        path: "src/compliance/rail-y5.ts",
        target: "registry",
      },
      {
        step: "Widen W213's projection, which today has nowhere to put a clinical attribute — the change is to a declared shape rather than a line inside a sort.",
        path: "src/matching/explain.ts",
        target: "module",
      },
    ],
    stillBlockedBy: [],
  },
];

/**
 * Shapes a readiness register must not take, each refused with its reason.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly adding a step nobody can follow.
 */
export const REFUSED_READINESS_SHAPES: Readonly<Record<string, string>> = {
  a_step_with_no_file:
    "A step naming a module, registry or test the tree does not have. It reads like preparation and is worse than no path at all: somebody planning around it believes work exists that nobody has done. Every step is opened by this unit's test.",
  a_path_that_ends_at_a_gate:
    "Describing a gate as releasing something live when another gate still blocks it. W245 found this for G10 and W257 carried it — `stillBlockedBy` exists so a readiness path cannot read as a route to a byte leaving the building.",
  an_ordering:
    "Numbering the gates, or listing them by what they release, in a way that reads as a recommendation. W257 refused to rank them because the two orders its tables produce disagree, and a readiness register is not the place to supply one quietly.",
  an_effort_estimate:
    "Attaching a size to any step. Nothing here has been built, so an estimate would be a number with nothing behind it, and it would be read as a commitment by whoever schedules from this document.",
  a_gate_with_no_entry:
    "Leaving a defined gate out because its answer seems obvious or its path seems empty. G7's path is the interesting case: the answer is that nothing happens on the day, and it is written down as steps for the day somebody PROPOSES crossing it — which is when the question is actually asked.",
  pinning_the_blocked_counts:
    "Freezing the number of units each gate blocks. That is DOSSIER-1's failure and W257 is bounded to Year 5 because of it. A readiness PATH does not expire when a year is added, so the counts here are derived at read time and a new blocked row moves both sides together.",
};

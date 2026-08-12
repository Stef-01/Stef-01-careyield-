// W242: the interop credentials posture — and why "there are none" is the weaker half of it.
//
// Q19 has built a FHIR mapping, an e-referral profile, a conformance harness, a disclosure ledger
// and a terminology binding. Every one of them stops at the point where something would actually
// be sent, and each says so locally. This unit is where the reason is written once: nothing goes
// anywhere because there is no credential, and G1 is the gate that would change that.
//
// "NO CREDENTIAL IN THE TREE" IS TRUE TODAY BECAUSE THE LIST IS EMPTY, AND THAT IS THE VALUES
// DOING IT. W56's shape exists because a guarantee resting on a list being empty lasts exactly
// until somebody adds a row — and adding a row looks like configuration, not like opening a gate.
// So the LOADER refuses. `loadCredential` handed a perfectly well-formed secret for a declared
// slot still returns `gate_not_ratified`, and a test proves that with a credential that would
// otherwise pass every check. Emptiness is then a consequence rather than the mechanism.
//
// THE GATE IS CHECKED BEFORE THE VALUE IS LOOKED AT, and the ordering is the part worth arguing.
// A loader that validated first and gated second would answer "your secret is the wrong shape"
// to somebody holding a secret it was never going to accept — which is a credential oracle, and a
// small one, but it is a free property and giving it away for tidier code would be a poor trade.
// A test asserts the refusal for a MALFORMED credential is still exactly `gate_not_ratified`,
// with nothing about the malformation.
//
// AND NO REFUSAL EVER ECHOES THE VALUE. "sk-live-… is not a valid key" puts the key in whatever
// read the refusal — a log, a console, a bug report. Every refusal here is a constant string, and
// a test hands the loader a distinctive secret and scans the whole result for it. This is the
// ordinary way secrets leak, and it is a defect of the ERROR PATH, which is the path nobody looks
// at until it runs.
//
// THE SECOND CONTROL EXISTS BECAUSE THE FIRST HAS A HOLE. A loader only governs what goes through
// it, and a credential pasted into a module never does. So `credentialShapedLiterals` scans the
// tree for the shapes a real secret takes — a long opaque string assigned to something named like
// a key — and the test runs it over `src/` and `app/`. Defence in depth, and it is the half that
// would actually catch the mistake somebody makes at four in the afternoon.
//
// WHAT IS DECLARED HERE INSTEAD: the SLOTS. Each says what would be needed, for which system, why,
// and which gate blocks it — so the day a founder rules on G1 the question is "fill these four"
// rather than "find out what we need". A slot holds no value and has nowhere to put one.
//
// FOUNDER GATES (plan §4): G1 blocks every slot whose counterparty is a PMS or booking API; G10
// blocks the payer slot as well, and is itself unratified, so that slot is blocked twice and the
// register says so rather than recording the first blocker and stopping.

/** The gate that blocks anything live. Named, and checked against plan §4 by this unit's test. */
export const BLOCKING_GATE = "G1";

export type CredentialKind =
  | "pms_read_api"
  | "booking_write_api"
  | "fhir_exchange"
  | "ereferral_gateway"
  | "payer_api";

export interface CredentialSlot {
  kind: CredentialKind;
  /** The counterparty, as the plan names it. */
  system: string;
  /** What this product would do with it. */
  whyNeeded: string;
  /**
   * Every gate that blocks it, not just the first.
   *
   * The payer slot is blocked by G1 for the credential and by G10 for the data flow, and a
   * register that recorded one blocker would show the slot opening the day the other was ratified.
   */
  blockedBy: readonly string[];
}

/**
 * What would be needed, with no value anywhere near it.
 *
 * Declared so that the day G1 is ruled on the question is "fill these" rather than "work out what
 * we need" — W39's dossier made the same argument about activation steps.
 */
export const CREDENTIAL_SLOTS: readonly CredentialSlot[] = [
  {
    kind: "pms_read_api",
    system: "Best Practice / Halo (W28's adapter skeleton)",
    whyNeeded:
      "Reading a practice's own patients, open slots and cancellations. Today this comes from W27's synthetic adapter, which is why the contract exists.",
    blockedBy: ["G1"],
  },
  {
    kind: "booking_write_api",
    system: "HotDoc partner access",
    whyNeeded:
      "Writing a booking back after a patient accepts an offer. Today the booking rail is W7's in-memory mock.",
    blockedBy: ["G1"],
  },
  {
    kind: "fhir_exchange",
    system: "A receiving system for W235's resources",
    whyNeeded:
      "Sending or receiving FHIR R4 resources. W237's harness proves the bundle is internally consistent and explicitly does not prove any real system accepts it.",
    blockedBy: ["G1"],
  },
  {
    kind: "ereferral_gateway",
    system: "An e-referral transport for W236's profile",
    whyNeeded:
      "Delivering a referral document to the receiving practice. W203's delivery adapter is blocked on G9 as well as this.",
    blockedBy: ["G1", "G9"],
  },
  {
    kind: "payer_api",
    system: "A payer or insurer (W240/W241)",
    whyNeeded:
      "Any payer integration at all. Both units are blocked in the ledger and neither is built.",
    blockedBy: ["G1", "G10"],
  },
];

/**
 * Credentials this tree holds. EMPTY — and the emptiness is a CONSEQUENCE, not the control.
 *
 * `never[]` rather than a credential type, so there is no shape a value could take here even if
 * somebody tried. The control is `loadCredential`, which refuses regardless of what this holds.
 */
export const SHIPPED_CREDENTIALS: readonly never[] = [];

export type CredentialLoadRefusal =
  /** G1 is unratified. Returned FIRST, before the value is looked at — see the module note. */
  | "gate_not_ratified"
  /** The slot is not one this tree declares. Unreachable today; the gate refuses before it. */
  | "unknown_slot";

export const CREDENTIAL_REFUSAL_COPY: Record<CredentialLoadRefusal, string> = {
  gate_not_ratified:
    "No credential can be loaded. Connecting this product to a real practice system is a founder decision that has not been taken, and the refusal is the loader's rather than a consequence of the list being empty — filling the list would change nothing.",
  unknown_slot:
    "That is not a connection this product declares a need for. Adding one means adding it to the register, which is a visible edit rather than a value appearing in a configuration file.",
};

export type CredentialLoadResult =
  | { loaded: true; slot: CredentialSlot }
  | { loaded: false; refusal: CredentialLoadRefusal; blockedBy: readonly string[] };

/**
 * Load a credential for a declared slot. Always refuses.
 *
 * THE GATE IS CHECKED BEFORE THE VALUE, deliberately. A loader that validated first would tell
 * somebody holding a secret whether it was well formed, which is a small credential oracle given
 * away for nothing. The `supplied` parameter is accepted and never read — its presence is what
 * makes the refusal a statement about the GATE rather than about the absence of an argument.
 *
 * No refusal echoes `supplied`. Every message is a constant, and a test scans the whole result
 * for a distinctive secret it passed in.
 */
export function loadCredential(kind: string, supplied?: string): CredentialLoadResult {
  // Before anything else, including before `kind` is resolved. `supplied` is deliberately unused.
  void supplied;
  const blockedBy = CREDENTIAL_SLOTS.find((slot) => slot.kind === kind)?.blockedBy ?? [BLOCKING_GATE];
  return { loaded: false, refusal: "gate_not_ratified", blockedBy };
}

/**
 * Whether a live connection may be attempted. Constant `false`, and it takes no argument.
 *
 * No environment variable, no config flag, no options object. W231's lesson about a control that
 * can be switched by something other than a person: the way this becomes true is an edit to this
 * line, in a commit somebody reviews, after a founder has ruled on G1.
 */
export function liveConnectionsPermitted(): false {
  return false;
}

const SECRET_ASSIGNMENT = new RegExp(
  [
    // A credential-shaped NAME assigned a long opaque literal. Assembled from fragments so this
    // module does not match itself — W153's trick, and the eleventh collision in this tree was
    // exactly this shape one unit ago.
    ["(?:api[_-]?", "key|secret|password|passwd|client[_-]?", "secret|access[_-]?", "token|bearer)"].join(""),
    "\\s*[:=]\\s*[\"'`]([^\"'`\\s]{16,})[\"'`]",
  ].join(""),
  "gi",
);

/** Known vendor key prefixes, which are unambiguous wherever they appear. */
const VENDOR_PREFIX = /\b(sk-live-[A-Za-z0-9]{8,}|AKIA[0-9A-Z]{12,}|ghp_[A-Za-z0-9]{20,})\b/g;

export interface CredentialLiteral {
  file: string;
  match: string;
}

/**
 * Credential-shaped literals in a body of source.
 *
 * The second control, and it exists because the first has a hole: a loader governs only what goes
 * through it, and a secret pasted into a module never does. Pure, so its own test can feed it
 * known-bad input and watch it fire — a scanner nobody has seen catch anything is a scanner that
 * proves the files were read.
 */
export function credentialShapedLiterals(file: string, source: string): CredentialLiteral[] {
  const out: CredentialLiteral[] = [];
  for (const match of source.matchAll(SECRET_ASSIGNMENT)) out.push({ file, match: match[0] });
  for (const match of source.matchAll(VENDOR_PREFIX)) out.push({ file, match: match[0] });
  return out;
}

/**
 * Postures this unit refuses, with the reason each is refused.
 *
 * Data rather than a comment — W196's shape — so a later unit deletes a stated refusal rather than
 * quietly adding a code path.
 */
export const REFUSED_CREDENTIAL_POSTURES: Readonly<Record<string, string>> = {
  emptiness_as_the_control:
    "Relying on `SHIPPED_CREDENTIALS` being empty. A guarantee resting on a list having no rows lasts until somebody adds one, and adding one looks like configuration rather than like opening a gate. W56's shape is that the LOADER refuses, so the emptiness is a consequence and filling the list changes nothing.",
  validating_before_gating:
    "Checking whether the supplied credential is well formed and only then refusing on the gate. That answers 'is my secret the right shape' to somebody holding a secret this product was never going to accept — a credential oracle, small but free to avoid, and giving it away buys nothing but tidier code.",
  echoing_the_value_in_a_refusal:
    "Putting the supplied credential into the refusal so the caller can see what was wrong with it. The refusal then travels into a log, a console or a bug report carrying the secret. It is the ordinary way credentials leak and it is a defect of the ERROR path, which is the path nobody exercises until it runs.",
  an_environment_variable_switch:
    "Letting a live connection be enabled by an environment variable or config flag. G1 is a founder decision, and a decision that can be taken by a deployment setting is one that will be taken by a deployment setting. `liveConnectionsPermitted` takes no argument for that reason.",
  recording_only_the_first_blocker:
    "Listing one gate per slot. The payer slot is blocked by G1 for the credential and by G10 for the data flow; a register holding only the first would show the slot opening the day the other was ratified, which is the more dangerous direction to be wrong in.",
  a_scanner_that_only_reads_this_module:
    "Scanning only the interop directory for credential literals. A pasted secret goes wherever somebody was working, and a scanner aimed at the module that talks about credentials is aimed at the one place a credential is least likely to be.",
};

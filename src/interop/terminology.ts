// W238: local codes bound to SNOMED CT-AU and LOINC — as declared data, with provenance, and
// mostly as an empty catalogue.
//
// W235 left `LOCAL_SYSTEM` pointing at `example.invalid` and said this unit would bind it. W236
// put `conditionCode` in its unmapped register for the same reason. This is that unit, and the
// first thing to settle is what a binding IS, because it does not look like clinical content and
// it is.
//
// "OUR REGISTER CODE `reg-diabetes` MEANS SNOMED 73211009" IS A CLINICAL ASSERTION. It says two
// things are the same condition, in a document that will be read by somebody making decisions
// about a person. Getting it wrong does not produce an error — it produces a referral filed
// under the wrong condition at the receiving practice, and nothing in either system disagrees.
// So the catalogue SHIPS EMPTY and the loader enforces the gate rather than the values doing it,
// which is W56's shape exactly: zero bindings is zero clinical assertions, so an empty catalogue
// cannot breach G5. A test pins the emptiness, so values cannot arrive without the ruling.
//
// THE FAILURE THIS UNIT REALLY GUARDS AGAINST IS NOT AN ABSENT BINDING — IT IS A CONFIDENT ONE.
// An unbound code that refuses is a nuisance somebody fixes. An unbound code emitted under
// `http://snomed.info/sct` is a local key wearing a terminology system's name, and the receiving
// practice resolves it against the wrong catalogue and gets either nothing or, worse, a real
// concept that happens to collide. That is the mislabel W227 refused for calendars, at a
// boundary where somebody acts on the result. So `Coding` is branded: the only way to obtain one
// is `codingFor`, which requires a binding, and there is no literal a caller can write.
//
// A CODE WITHOUT A RELEASE IS A CODE THAT MAY HAVE BEEN RETIRED. SNOMED concepts are inactivated
// between releases and LOINC codes are deprecated; a binding recorded without which release it
// was checked against cannot be re-checked, which makes its provenance decorative. So the
// release is required, and so is the person who checked — a binding is an assertion and W119's
// rule is that an assertion has somebody behind it.
//
// AND NOTHING IS GUESSED. `REFUSED_BINDING_STRATEGIES` names the ways of turning an unbound code
// into a bound-looking one, each of which is available in one line and each of which produces a
// document nobody can tell is wrong. The refusal NAMES THE CODE, because "some codes could not
// be bound" is a sentence somebody dismisses and "reg-ckd-stage-3 has no binding" is one they
// act on.

/** The terminologies this tree may bind to, and nothing else. */
export type TerminologySystem = "snomed-ct-au" | "loinc";

/**
 * The canonical system URIs.
 *
 * Real, resolvable identifiers — unlike W235's `example.invalid`, which is deliberately
 * unresolvable because a local code system has no published identity. These two do.
 */
export const SYSTEM_URI: Readonly<Record<TerminologySystem, string>> = {
  "snomed-ct-au": "http://snomed.info/sct",
  loinc: "http://loinc.org",
};

export const ALL_SYSTEMS = Object.keys(SYSTEM_URI) as TerminologySystem[];

export interface BindingProvenance {
  /** Which release this was checked against. Required — see the module note about retirement. */
  release: string;
  citation: string;
  url: string;
  retrievedOn: string;
  /** Who checked it. A binding is a clinical assertion, and an assertion has somebody behind it. */
  boundBy: string;
}

export interface TerminologyBinding {
  /** The practice-catalogue key this tree already uses. */
  localCode: string;
  system: TerminologySystem;
  /** The concept id. Digits for SNOMED, digits-dash-digit for LOINC — checked, not assumed. */
  code: string;
  /** The display term FROM THE RELEASE, never from the local catalogue. */
  display: string;
  provenance: BindingProvenance;
}

/**
 * PROPOSED FOR NOBODY — nothing ships.
 *
 * Empty, and pinned empty by its own test. A binding is a clinical assertion (see the module
 * note), so the catalogue is gated the way W56 gated interval values and the pathway registries
 * gate content: zero entries is zero assertions.
 */
export const SHIPPED_BINDINGS: readonly TerminologyBinding[] = [];

export type BindingRejection =
  | "local_code_missing"
  | "code_missing"
  | "code_shape_wrong_for_system"
  | "display_missing"
  | "release_missing"
  | "citation_missing"
  | "url_missing"
  | "retrieved_date_missing_or_unreadable"
  | "binder_missing";

export const BINDING_REJECTION_COPY: Record<BindingRejection, string> = {
  local_code_missing: "A binding has to say which local code it binds.",
  code_missing: "A binding has to name the concept it binds to.",
  code_shape_wrong_for_system:
    "The code is not shaped like a concept id in that terminology. A SNOMED concept id is digits; a LOINC code is digits, a dash and a check digit. A code that is neither is a local key being passed off as a terminology one.",
  display_missing:
    "A binding has to carry the display term from the release. A coding sent without one makes the receiving system supply its own, and a coding sent with the LOCAL catalogue's wording says the release means something it may not.",
  release_missing:
    "A binding has to say which release it was checked against. Concepts are inactivated between releases, so a binding without one cannot be re-checked and its provenance is decorative.",
  citation_missing: "A binding has to say where the concept was read.",
  url_missing: "A binding has to carry a resolvable reference to the source it was read in.",
  retrieved_date_missing_or_unreadable:
    "A binding has to say when it was checked, as YYYY-MM-DD.",
  binder_missing:
    "A binding has to name who checked it. This is a clinical assertion and an assertion has somebody behind it.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODE_SHAPE: Readonly<Record<TerminologySystem, RegExp>> = {
  "snomed-ct-au": /^\d{6,18}$/,
  loinc: /^\d{1,5}-\d$/,
};

/**
 * Validate one binding, returning every reason it is refused.
 *
 * The loader enforces the gate rather than the values doing it — W56's shape, and the reason the
 * empty catalogue is safe for somebody to fill later with the release open in front of them.
 */
export function rejectionsForBinding(binding: TerminologyBinding): BindingRejection[] {
  const out: BindingRejection[] = [];
  if (binding.localCode.trim() === "") out.push("local_code_missing");
  if (binding.code.trim() === "") out.push("code_missing");
  else if (!CODE_SHAPE[binding.system].test(binding.code)) out.push("code_shape_wrong_for_system");
  if (binding.display.trim() === "") out.push("display_missing");

  const p = binding.provenance as BindingProvenance | undefined;
  if (!p) {
    return [...out, "release_missing", "citation_missing", "url_missing", "retrieved_date_missing_or_unreadable", "binder_missing"];
  }
  if (p.release.trim() === "") out.push("release_missing");
  if (p.citation.trim() === "") out.push("citation_missing");
  if (p.url.trim() === "") out.push("url_missing");
  if (!ISO_DATE.test(p.retrievedOn)) out.push("retrieved_date_missing_or_unreadable");
  if (p.boundBy.trim() === "") out.push("binder_missing");
  return out;
}

declare const codingBrand: unique symbol;

/**
 * A coding that may leave this tree.
 *
 * Branded, and the brand is the unit. Without it a caller writes
 * `{ system: SYSTEM_URI["snomed-ct-au"], code: "reg-diabetes" }` — a local key under a
 * terminology system's name, which no type error and no test would catch, and which the
 * receiving practice resolves against the wrong catalogue. There is exactly one producer.
 */
export interface Coding {
  readonly [codingBrand]: true;
  readonly system: string;
  readonly code: string;
  readonly display: string;
  /** The release the display and code were read from. Travels with them, never separately. */
  readonly release: string;
}

export type CodingRefusal =
  /** No binding for this local code. The honest answer, and it NAMES the code. */
  | "no_binding_for_code"
  /** A binding exists but does not pass the loader, so it must not be used. */
  | "binding_rejected";

export interface CodingRefused {
  bound: false;
  refusal: CodingRefusal;
  /** The code that could not be bound. "Some codes failed" is dismissed; a name is acted on. */
  localCode: string;
  /** Present when the binding existed and was refused, so a reviewer can fix it. */
  rejections: readonly BindingRejection[];
  copy: string;
}

export type CodingResult = { bound: true; coding: Coding } | CodingRefused;

/**
 * The only way to obtain a `Coding`.
 *
 * Takes the catalogue explicitly rather than reading the shipped one, so a caller cannot get a
 * coding without saying which catalogue it came from — W227's rule about answers that do not
 * say what they rest on.
 */
export function codingFor(
  localCode: string,
  bindings: readonly TerminologyBinding[] = SHIPPED_BINDINGS,
): CodingResult {
  const binding = bindings.find((b) => b.localCode === localCode);
  if (!binding) {
    return {
      bound: false,
      refusal: "no_binding_for_code",
      localCode,
      rejections: [],
      copy: `No terminology binding is recorded for the code "${localCode}", so it is not being sent as a coded concept. Nothing has been guessed and no nearest match has been substituted.`,
    };
  }
  const rejections = rejectionsForBinding(binding);
  if (rejections.length > 0) {
    return {
      bound: false,
      refusal: "binding_rejected",
      localCode,
      rejections,
      copy: `A binding is recorded for the code "${localCode}" but it did not pass its own checks, so it is not being used: ${rejections
        .map((r) => BINDING_REJECTION_COPY[r])
        .join(" ")}`,
    };
  }
  return {
    bound: true,
    coding: {
      system: SYSTEM_URI[binding.system],
      code: binding.code,
      display: binding.display,
      release: binding.provenance.release,
    } as Coding,
  };
}

/**
 * Ways of turning an unbound code into a bound-looking one, each refused with its reason.
 *
 * Data rather than a comment — W196's `REFUSED_FIGURES` shape — so a later unit has to delete a
 * stated refusal rather than quietly add a helper. Every one is one line of code and every one
 * produces a document nobody can tell is wrong.
 */
export const REFUSED_BINDING_STRATEGIES: Readonly<Record<string, string>> = {
  local_code_under_terminology_uri:
    "Emitting the local code with `system` set to SNOMED's or LOINC's URI. It is the shortest way to make a document look coded, and it is a local key wearing a terminology's name: the receiving practice resolves it against the wrong catalogue and gets nothing, or gets a real concept that happens to collide. This is why `Coding` is branded.",
  nearest_display_match:
    "Matching the local catalogue's wording against concept display terms. Display terms are not identifiers, they change between releases, and 'diabetes mellitus type 2' matching a concept whose display happens to contain those words is a coincidence dressed as a lookup.",
  parent_concept_fallback:
    "Falling back to a broader concept when the specific one is not bound. It produces a referral about a more general condition than the practice recorded, which is a clinical change made by a fallback branch.",
  inferred_from_fact_codes:
    "Deriving a condition code from the recorded fact codes that travel with a referral. That is reading facts to conclude a condition, which is the line G7 draws and the reason W120 references facts by code rather than describing them.",
  cached_binding_without_release:
    "Reusing a binding whose release was not recorded. A concept inactivated in a later release keeps working forever, and nobody can tell which bindings need re-checking.",
};

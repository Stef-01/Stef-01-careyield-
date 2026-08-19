// W356: an excuse nothing can contradict — the sentences more than one entry stands behind.
//
// A REGISTER ENTRY THAT CANNOT BE CHECKED IS ASKED TO WRITE A SENTENCE INSTEAD. That is the right
// trade and this tree makes it everywhere: `store-reads.ts` requires a reason for every read it
// cannot verify by signature, `blind-spots.ts` requires one for every bound no witness can be
// handed to, `claim-classes.ts` requires one for every unit it declines to classify. The sentence
// is what a later reader argues with, and for a single entry that works, because the sentence and
// the entry were written together and a reader who doubts one is looking at the other.
//
// IT STOPS WORKING WHEN THE SENTENCE IS SHARED. W345 found the shape: `NOT_CALLABLE` says a
// module exports no detector taking a root, most of one register's entries stand behind it, and NINE
// modules had gained exactly such an export while the sentence went on reading as true. Nobody
// lied. The sentence was correct when it was written, it was correct for most of its entries the
// day it was re-read, and there was no moment at which anybody was looking at an entry and its
// reason at the same time — which is what sharing a sentence costs.
//
// SO THE QUESTION THIS ASKS IS NOT WHETHER AN EXCUSE IS TRUE. It is whether anything in this tree
// COULD SAY IT IS FALSE. A shared sentence with a falsifier is a claim: it fails on the day the
// tree outgrows it, which is the day it stops being true. A shared sentence with no falsifier is
// an excuse in the sense this unit is named for — it will read as true forever, and the only
// event that can end it is a person happening to look.
//
// THE POPULATION IS DERIVED, in both spellings, because the spelling is not the point. A sentence
// NAMED once and referenced thirty times and a sentence TYPED OUT twice are the same defect, and
// the second is worse because nothing about the source shows it is shared at all. Reference sites
// are resolved to the sentence they name, so both land in one currency.
//
// WHAT THIS TREE ALREADY DOES ABOUT SHARED EXCUSES, AND IT IS WORTH SAYING PLAINLY: `store-reads`
// requires the reason to be at least twenty characters long, and nothing anywhere requires it to
// be true.
//
// WHAT THIS DOES NOT PROVE is `EXCUSE_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this tree's own source text.

import { readFileSync } from "node:fs";
import path from "node:path";
import { ACCESS_PATHS } from "@/privacy/access-y5";
import { RECORD_CLASSES } from "@/privacy/record-classes";
import { REFERRAL_SCOPING } from "@/referrals/scoping";
import { reachableFromApp } from "@/security/reachability";
import { STORE_READS } from "@/tenancy/store-reads";
import { NOT_A_SILENCE, NOT_CALLABLE } from "./blind-spots";
import { callableDetectorsBorrowingTheSentence } from "./escape-hatches";
import { prepareForScan } from "./scan-text";
import { sourceModules } from "./tree-walks";

/** A reason-string, and every entry in the tree that stands behind it. */
export interface SharedExcuse {
  /** The sentence itself, whatever it was spelled as at each site. */
  text: string;
  /** Modules holding at least one entry that gives this sentence as its reason. */
  modules: string[];
  /** How many entries give it. Two is the threshold; thirty is `NOT_CALLABLE`. */
  entries: number;
}

/**
 * A declared reading of one shared sentence.
 *
 * THE SENTENCE IS NOT STORED UNDER A REASON FIELD, and that is deliberate rather than incidental:
 * the scan below reads reason-position fields, so a register OF reasons that put its subjects in
 * one would find itself on every row. W307's rule, arriving at a field name.
 */
export interface Excuse {
  /** Short, stable name for the sentence — what to call it in a finding. */
  name: string;
  /** The sentence, matched against the scan by exact text. */
  text: string;
  /** What the sentence claims about the tree, in this register's words. */
  claim: string;
  /**
   * Entries the tree CONTRADICTS today; empty means the sentence still holds.
   *
   * IT IS HANDED ITS OWN SENTENCE rather than closing over a copy of it, so a falsifier cannot
   * come to be asking about a different set of entries than the row it is attached to — which is
   * the drift this whole register is about, arriving one level in.
   *
   * `null` says nothing here can contradict it, and then `settledBy` is required.
   */
  falsifier: ((root: string, text: string) => string[]) | null;
  /** `falsifier: null` only: the check somebody would have to write. */
  settledBy?: string;
  /** Why this reading is the right one. */
  why: string;
}

// ── The scan ───────────────────────────────────────────────────────────────────────────────────

/**
 * The field names this tree spells a reason with.
 *
 * `why` covers `whyNotPlantable`, `whyNotAttributable` and the plain `why` of a dozen registers.
 * `note` is deliberately NOT here: a note is an aside beside a row, and treating one as a reason
 * would fill the population with prose nobody is standing behind.
 */
const REASON_FIELD = "(?:why[A-Za-z]*|reason|excuse|rationale)";

const LITERAL_SITE = new RegExp(
  `(?:^|[\\s{,(])${REASON_FIELD}\\s*:\\s*\\r?\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`,
  "g",
);

const REFERENCE_SITE = new RegExp(
  `(?:^|[\\s{,(])${REASON_FIELD}\\s*:\\s*([A-Z][A-Z0-9_]{3,})\\s*[,}]`,
  "g",
);

const CONSTANT = (name: string) =>
  new RegExp(`const ${name}(?:\\s*:\\s*string)?\\s*=\\s*\\r?\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`);

/** Resolve a referenced constant to the sentence it holds, or `null` if no module declares one. */
function sentenceNamed(name: string, sources: ReadonlyMap<string, string>): string | null {
  for (const text of sources.values()) {
    const hit = text.match(CONSTANT(name));
    if (hit?.[1]) return hit[1];
  }
  return null;
}

function preparedSources(root: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const file of sourceModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    // Literals KEPT: the sentence is the subject. Comments subtracted: this tree's notes quote
    // each other's reasons constantly, and a quoted reason is somebody discussing it, not giving it.
    out.set(rel, prepareForScan(readFileSync(file, "utf8"), { comments: "subtracted", literals: "kept" }));
  }
  return out;
}

/**
 * Every reason-string in the tree that more than one entry gives.
 *
 * A single-word value is skipped: `reason: "attested_before_withdrawal"` is a CODE the tree
 * switches on, not a sentence anybody is standing behind, and counting those would bury the nine
 * real ones under every enum in the repository.
 */
export function sharedExcuses(root: string): SharedExcuse[] {
  const sources = preparedSources(root);
  const seen = new Map<string, { modules: Set<string>; entries: number }>();
  const record = (text: string, module: string) => {
    if (!text.includes(" ")) return;
    const at = seen.get(text) ?? { modules: new Set<string>(), entries: 0 };
    at.modules.add(module);
    at.entries += 1;
    seen.set(text, at);
  };
  for (const [module, text] of sources) {
    for (const hit of text.matchAll(LITERAL_SITE)) record(hit[1] ?? "", module);
    for (const hit of text.matchAll(REFERENCE_SITE)) {
      const sentence = sentenceNamed(hit[1] ?? "", sources);
      if (sentence !== null) record(sentence, module);
    }
  }
  return [...seen]
    .filter(([, at]) => at.entries > 1)
    .map(([text, at]) => ({ text, modules: [...at.modules].sort(), entries: at.entries }))
    .sort((a, b) => b.entries - a.entries || a.text.localeCompare(b.text));
}

// ── The falsifiers ─────────────────────────────────────────────────────────────────────────────

/**
 * Entries in `store-reads.ts` giving this sentence, as `module::fn`.
 *
 * READ FROM THE REGISTER, NOT FROM ITS TEXT. A second parse of the table this scan already found
 * the sentence in is the copy W341 is about — the two would come to disagree about which entries
 * a falsifier is even asking about, and the disagreement would look like the excuse holding.
 */
export function storeReadsGiving(sentence: string): string[] {
  return STORE_READS.filter((read) => read.reason === sentence)
    .map((read) => `${read.module}::${read.fn}`)
    .sort();
}

/** The signature of an exported function, as written, or `null` if the module does not export it. */
export function signatureOf(root: string, module: string, fn: string): string | null {
  const file = path.join(root, module);
  const source = prepareForScan(readFileSync(file, "utf8"), { comments: "subtracted", literals: "blanked" });
  return source.match(new RegExp(`export function ${fn}\\s*\\(([^)]*)\\)\\s*:\\s*([^{]+)\\{`))?.[0] ?? null;
}

/**
 * The `kind` arms `Blindness` declares.
 *
 * `NOT_A_SILENCE` says the missing thing is an arm demonstrating a bound by NOISE. That half of
 * the sentence is a fact about a type declaration, so a third arm ends it.
 */
export function blindnessArms(root: string): string[] {
  const source = readFileSync(path.join(root, "src/quality/blind-spots.ts"), "utf8");
  const declaration = source.slice(source.indexOf("export type Blindness ="));
  const body = declaration.slice(0, declaration.indexOf("\n\n"));
  return [...body.matchAll(/kind:\s*"([a-z_]+)"/g)].map((hit) => hit[1] ?? "").sort();
}

/** Synthetic resets this tree calls from a module the app can reach. */
export function liveCallersOfSyntheticResets(root: string, sentence: string): string[] {
  const reachable = new Set(reachableFromApp(root).files);
  const out: string[] = [];
  for (const entry of storeReadsGiving(sentence)) {
    const [module, fn] = entry.split("::");
    for (const file of sourceModules(root)) {
      const rel = path.relative(root, file).split(path.sep).join("/");
      if (rel === module || !reachable.has(rel)) continue;
      const source = prepareForScan(readFileSync(file, "utf8"), { comments: "subtracted", literals: "blanked" });
      if (new RegExp(`\\b${fn}\\s*\\(`).test(source)) out.push(`${entry} <- ${rel}`);
    }
  }
  return out.sort();
}

/** Catalogue writers whose signature takes a practice after all. */
export function catalogueWritersTakingAPractice(root: string, sentence: string): string[] {
  const out: string[] = [];
  for (const entry of storeReadsGiving(sentence)) {
    const [module, fn] = entry.split("::");
    const signature = signatureOf(root, module ?? "", fn ?? "");
    if (signature === null || /practice/i.test(signature)) out.push(entry);
  }
  return out.sort();
}

/**
 * Modules withheld from a patient's access export on the `derived` sentence that are no longer derived.
 *
 * THE SHARPEST FALSIFIER HERE, and the one with a patient at the end of it: the sentence's whole
 * force is W106's classification, and W106 is a register two imports away.
 */
export function withheldClassesThatArePersisted(sentence: string): string[] {
  const out: string[] = [];
  for (const path of ACCESS_PATHS) {
    if (path.disposition.kind !== "withheld" || path.disposition.why !== sentence) continue;
    const declared = RECORD_CLASSES.find((record) => record.module === path.module);
    if (declared === undefined) out.push(`${path.module} (W106 classifies no record class for it)`);
    else if (declared.handling !== "derived") out.push(`${path.module} (W106 calls it ${declared.handling})`);
  }
  return out.sort();
}

/**
 * Rejection-copy tables that take more than the reason they are keyed by.
 *
 * The sites come from `REFERRAL_SCOPING` by sentence, not from a list here: a pinned pair would
 * go on reading as complete the day a third module borrows the sentence (W290's rule).
 */
export function copyTablesTakingMoreThanAReason(root: string, sentence: string): string[] {
  const out: string[] = [];
  for (const entry of REFERRAL_SCOPING) {
    if (entry.rationale !== sentence) continue;
    const signature = signatureOf(root, entry.module, entry.fn);
    const parameters = signature?.match(/\(([^)]*)\)/)?.[1] ?? "";
    if (signature === null || parameters.includes(",") || !/Rejection\b/.test(parameters)) {
      out.push(`${entry.module}::${entry.fn}`);
    }
  }
  return out.sort();
}

// ── The reading ────────────────────────────────────────────────────────────────────────────────

/**
 * The reading, built on first use rather than on import.
 *
 * SOME ROWS NAME A SENTENCE ANOTHER REGISTER OWNS, and `blind-spots.ts` imports most of this tree,
 * so a module-level array reading those constants is a binding read inside an import cycle — which
 * in ESM is `undefined` rather than an error, and would have left those rows with no text at all
 * depending on which file the suite loaded first. The functions this module imports are safe (a
 * declaration is hoisted); the constants are not, so they are read when somebody asks.
 */
let built: readonly Excuse[] | null = null;

export function excuses(): readonly Excuse[] {
  return (built ??= ROWS());
}

const ROWS = (): readonly Excuse[] => [
  {
    name: "NOT_CALLABLE",
    text: NOT_CALLABLE,
    claim: "the module exports no detector a witness can be handed to",
    falsifier: callableDetectorsBorrowingTheSentence,
    why: "W345's finding and the reason this unit exists. The sentence says something about a module — that nothing in it takes a root — so a scan settles it, and on the day W345 ran the scan nine of the thirty modules standing behind it had grown exactly that export. The falsifier is W345's own function rather than a second copy of the same scan: two derivations of one claim is how a register comes to disagree with itself, and W341 has the rule.",
  },
  {
    name: "NOT_A_SILENCE",
    text: NOT_A_SILENCE,
    claim: "`Blindness` has no arm that demonstrates a bound by noise",
    falsifier: (root) =>
      blindnessArms(root).filter((arm) => arm !== "demonstrated" && arm !== "undemonstrated"),
    why: "W345 wrote that nothing derives this reason, and half of that is still right: whether a bound is about a FALSE POSITIVE is a property of its sentence and no scan reads it. The other half is a fact about a type declaration — the sentence says what is missing is an arm demonstrating by noise — and a third arm on `Blindness` ends the excuse for both entries at once. Declaring the whole sentence unfalsifiable because one clause of it is would be the cheap answer twice over.",
  },
  {
    name: "synthetic_reset",
    text: "Synthetic reset; no live read.",
    claim: "the reset exists for tests and no request-serving path calls it",
    falsifier: liveCallersOfSyntheticResets,
    why: "Eight entries, and the sentence carries the whole of their `store_handle` classification: a raw store accessor with no scoped alternative is only defensible because nothing live reaches it. That is the reachability question this tree already answers, so the falsifier asks it — a reset called from a module `app/` can reach is not synthetic, whatever its name says. Note what it does NOT ask: `resetInterestState` returns the state it just emptied, and a falsifier keyed on the return type would report it. Returning a thing you just made is not reading one.",
  },
  {
    name: "product_catalogue",
    text: "Writes to the product-level catalogue.",
    claim: "the writer takes nothing practice-identifiable",
    falsifier: catalogueWritersTakingAPractice,
    why: "The sentence justifies `no_practice_data`, which is the kind that says the privacy question does not arise. W209 checks that arm mechanically for `practice_scoped` and `patient_keyed` and leaves this one to the prose, so the prose is what gets a check here: the signature either takes a practice or it does not, and a catalogue writer that gains one has stopped being a catalogue writer.",
  },
  {
    name: "rejection_copy_table",
    text: "A copy table keyed by rejection reason. No data of any kind passes through it.",
    claim: "the function takes one rejection reason and returns copy",
    falsifier: copyTablesTakingMoreThanAReason,
    why: "Two functions in two modules, the same sentence typed twice — which is the spelling this register exists to find, because nothing in the source shows the two are joined. The claim is entirely in the signature: one parameter, and its type is a rejection union. A second parameter is the change that would make the sentence false, and it is the change somebody makes without re-reading a comment in another file.",
  },
  {
    name: "derived_is_not_held",
    text: "A `derived` class is recomputed from a source class at read time and persists nothing, so the practice does not HOLD it — exporting it would hand the patient this product's reading of records they are already being given, and a reading is the thing that would be argued with rather than the record. The source class it derives from is in the export, which is what APP 12 is about.",
    claim: "W106 classifies each of these seven modules `derived` rather than stored",
    falsifier: (_root, text) => withheldClassesThatArePersisted(text),
    why: "The one shared excuse here with a patient at the end of it: seven modules are kept OUT of an APP 12 access export on this sentence, so if any of them started persisting, a patient asking what the practice holds would not be told. Its own file makes the case for sharing out loud — `One argument, so it cannot drift between seven copies` — and that is right, and it is also exactly the trade this unit is named for: naming the sentence once stops it drifting and stops anybody reading it beside any particular entry. The falsifier restores the reading: it asks W106, per module, every time the suite runs.",
  },
  {
    name: "planted_row",
    text: "a planted row",
    falsifier: null,
    claim: "nothing — it labels a row this tree fabricates to drive a detector",
    settledBy:
      "Nothing, and that is the correct answer rather than a gap. The row does not exist in the tree; it is built inside a probe so a register has something to see. A check comparing the label to the fixture would be a check on this tree's own test data, which is the shape W316 refuses.",
    why: "Three sites across two registers, and it is the population's honest edge: the scan cannot tell a reason attached to a claim about the tree from a caption on a witness, because both are a `why` beside a row. Declared rather than filtered out, so the distinction is a reading somebody can argue with instead of a silent exclusion in a regex.",
  },
  {
    name: "deferred_to_a_landed_unit",
    text: "deferred to a unit that has landed",
    falsifier: null,
    claim: "nothing — it labels the overdue-deferral fixture in two registers",
    settledBy:
      "Nothing, for the same reason as `planted_row`: the finding it sits on is a fabrication handed in so a clock has something to run out on. The two copies could be one exported constant, which would make the sharing visible without making the sentence checkable.",
    why: "The same sentence in `claim-classes.ts` and `controls.ts`, both on a probe. Worth a row precisely because it LOOKS load-bearing: `deferred` is a real disposition, `by` is a real field, and only reading the surrounding constant shows the finding is invented.",
  },
  {
    name: "one_quarter_one_reader",
    text: "'One quarter read by one reader' — the unit of the sentence rather than a count of anything the tree holds. It stays one however many findings the pass records.",
    falsifier: null,
    claim: "nothing — it reads what a word in a bound's prose is doing",
    settledBy:
      "Nothing mechanical. W314 asks whether a number in prose can go stale, and the answer here is a reading of what the word `one` refers to. What would settle it is a reader disagreeing, which is not a check.",
    why: "Two W314 rows give this sentence, and there is a third site giving a NEARLY identical one — `a count of anything in the tree` against `a count of anything the tree holds`. That divergence is the argument for the whole unit in one line: a sentence typed three times has already stopped being one sentence, and the scan sees two excuses where an author meant one.",
  },
  {
    name: "the_register_itself",
    text: "This register. A gate that answered itself would be the tautology class W316 was written for, in the one place it would be hardest to see — and the horizon names this row as the re-reading rather than as one of the things re-read.",
    falsifier: null,
    claim: "nothing today — but its second clause is about a document and could be read",
    settledBy:
      "Resolving the unit against its quarter's horizon document: the sentence says the horizon names this row as the pass rather than as a subject, and W350's register already parses those documents. That is a real check nobody has written, and it would settle the clause that does the work.",
    why: "The one row here where `null` is a debt rather than a description. Both sites — `claim-classes.ts` and `controls.ts` — are load-bearing declarations that a register excludes itself from its own sweep, which is exactly the exclusion worth checking, and the sentence hands over the thing that would check it. It is unfalsifiable because nobody has written that, not because nothing could.",
  },
];

// ── The gate ───────────────────────────────────────────────────────────────────────────────────

export interface ExcuseDefect {
  excuse: string;
  what: string;
}

/**
 * The register against the tree, in three directions.
 *
 * A shared sentence nobody has read; a row whose sentence the tree no longer shares; and — the
 * arm the unit is for — a sentence the tree contradicts today while every entry giving it reads as fine.
 */
export function excuseDefects(root: string, rows: readonly Excuse[] = excuses()): ExcuseDefect[] {
  const out: ExcuseDefect[] = [];
  const found = sharedExcuses(root);
  const declared = new Set(rows.map((excuse) => excuse.text));
  for (const shared of found) {
    if (!declared.has(shared.text)) {
      out.push({
        excuse: shared.text.slice(0, 60),
        what: `given by ${shared.entries} entries in ${shared.modules.join(", ")} and no row reads it`,
      });
    }
  }
  const sharedNow = new Set(found.map((shared) => shared.text));
  for (const excuse of rows) {
    if (!sharedNow.has(excuse.text)) {
      out.push({ excuse: excuse.name, what: "declared shared, and the tree gives it once or not at all" });
      continue;
    }
    if (excuse.falsifier === null) {
      if ((excuse.settledBy ?? "").trim().length === 0) {
        out.push({ excuse: excuse.name, what: "nothing can contradict it and no row says what would" });
      }
      continue;
    }
    for (const site of excuse.falsifier(root, excuse.text)) {
      out.push({ excuse: excuse.name, what: `contradicted by ${site}` });
    }
  }
  return out.sort((a, b) => `${a.excuse}${a.what}`.localeCompare(`${b.excuse}${b.what}`));
}

/** The report the unit asks for: shared sentences nothing can contradict, with what would settle them. */
export function unfalsifiableExcuses(
  rows: readonly Excuse[] = excuses(),
): Array<{ name: string; settledBy: string }> {
  return rows
    .filter((excuse) => excuse.falsifier === null)
    .map((excuse) => ({ name: excuse.name, settledBy: excuse.settledBy ?? "" }));
}

/**
 * Sentences given ONCE that open the same way as a sentence this register declares shared.
 *
 * THE BOUND'S LAST CLAUSE, READ. Two spellings of one sentence are two excuses to the scan, and
 * the tree holds one: a W314 row explaining the word `one` in a hardening bound, typed a third
 * time with two words changed. This does not normalise — it reports the near-copies of sentences
 * already known to be shared, which is the narrow half nobody has to argue about. A general
 * normalisation would also merge sentences an author meant to differ, and that is the remedy the
 * bound says is still open.
 */
export function variantsOfDeclaredSentences(root: string): string[] {
  const shared = new Set(sharedExcuses(root).map((row) => row.text));
  const opening = (text: string) => text.slice(0, 60);
  const declared = new Map(excuses().map((row) => [opening(row.text), row.name]));
  const out: string[] = [];
  for (const [, source] of preparedSources(root)) {
    for (const hit of source.matchAll(LITERAL_SITE)) {
      const text = hit[1] ?? "";
      if (shared.has(text)) continue;
      const name = declared.get(opening(text));
      if (name !== undefined) out.push(`${name} <- a variant given once`);
    }
  }
  return [...new Set(out)].sort();
}

/** What this register cannot say. */
export const EXCUSE_BOUND =
  "A SENTENCE GIVEN ONCE IS INVISIBLE HERE, and that is most of the tree's reasons. The threshold " +
  "is two entries because sharing is the defect this unit is about — a reason written beside the " +
  "one entry it justifies is read by whoever reads the entry — but a single reason can be just as " +
  "unfalsifiable, and there are hundreds of them. SECOND, A FALSIFIER SETTLES ONE CLAUSE, NOT A " +
  "SENTENCE. `NOT_A_SILENCE` is the worked example in both directions: its clause about " +
  "`Blindness` is a fact about a type and its clause about a bound's polarity is a reading, and a " +
  "row that reports the first is not entitled to the second. Every `falsifier` here is narrower " +
  "than the sentence it is attached to, so a green arm means the checkable clause still holds and " +
  "never that the sentence is true. THIRD, THE SCAN READS A FIELD NAME. A reason spelled under a " +
  "field this register does not list — and this register's own subjects are stored under `text` " +
  "for exactly that reason — is not in the population, so the way to leave an excuse unread is to " +
  "call it something else. FOURTH, TWO SPELLINGS OF ONE SENTENCE ARE TWO EXCUSES. The row named " +
  "`one_quarter_one_reader` says so out loud: a third site gives the same sentence with two words " +
  "changed and the scan reads it as a different one, which understates the sharing rather than " +
  "overstating it. The remedy is that the scan grows a normalisation, and nobody has argued for " +
  "one that would not also merge sentences an author meant to differ.";

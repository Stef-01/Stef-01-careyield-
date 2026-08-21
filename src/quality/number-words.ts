// W393: a second reading of the numbers this tree's prose writes — a parse, not a match.
//
// Q29-CR-1 IS THE CASE AND IT IS NOT CLOSED. W314's register reads a number-word out of prose with
// one regex, and `\b` matches at a hyphen: `twenty-seven` of a thing was read as SEVEN of it and four
// live rows carried a tail as though it were the whole number. W383 fixed the vocabulary — tens
// times units, so no compound this tree can write is absent — and that fix is real. What it cannot
// fix is the shape: the vocabulary can express nothing above ninety-nine, so a number the tree
// writes with `hundred` or `thousand` in it still lands in the register as whichever part of it
// happens to be a word the map knows.
//
// AND THE TREE WRITES THEM. `assertion-vocabulary.ts` says *"measured at one hundred and fifty-two of
// them"*; the register holds `fifty-two sites` and the number 52. That row is `at_the_unit`, where
// nothing is ever re-derived, so the misreading has sat there since W323 with no way to surface —
// which is the same reason Q29-CR-1's four rows sat: history is the class this register never
// checks, and a misread number becomes history the moment somebody files it.
//
// SO THIS READS THE PROSE A SECOND TIME, DIFFERENTLY. Not a wider regex — a token parse. It splits
// the text into words, takes each maximal RUN of number-words, and evaluates the run the way English
// reads it, with `hundred` multiplying and `thousand` flushing. Two derivations over one population,
// and the diff between them is the finding rather than something to reconcile away.
//
// `AND` IS THE JOIN THAT HAD TO BE EARNED. This tree writes *"three and two"* and *"six and
// sixty-eight"* meaning two numbers, and *"one hundred and fifty-two"* meaning one. English only
// spends `and` inside a number after a scale word, so the run joins across `and` only when a
// hundred or a thousand is already standing. Without that rule the second reading is wronger than
// the first, and says so loudly, on this tree's own sentences.
//
// WHAT THIS DOES NOT PROVE is `NUMBER_BOUND`, exported below and read by W297's register.
//
// A RUNTIME LEAF, ON PURPOSE. W367's remedy: the claims and the prose are handed in rather than
// imported, so a module that every bound register reads adds no edge to the `src/quality` knot.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads this repository's own comments.

/** 1–9, the atoms every larger word is built from. */
export const UNITS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

/** 10–19, which English spells out rather than composing. */
export const TEENS: Readonly<Record<string, number>> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

/** 20–90, which compose with a unit across a hyphen. */
export const TENS: Readonly<Record<string, number>> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/** The words that multiply rather than add. This is the half W314's vocabulary has no room for. */
export const SCALES: Readonly<Record<string, number>> = {
  hundred: 100,
  thousand: 1000,
};

/**
 * Units, teens and tens in one map — with NO PROTOTYPE, which is not housekeeping.
 *
 * `ADDENDS["constructor"]` on an ordinary object literal returns a function rather than undefined,
 * and this reading asks that question of every word in the tree's prose. The first survey duly
 * reported `constructor` as a number-word this tree writes. A lookup that answers when it should
 * decline is the same shape as the pattern that matches what nobody meant, arriving in the unit
 * about exactly that, so it is worth the sentence.
 */
const ADDENDS: Readonly<Record<string, number>> = Object.assign(
  Object.create(null),
  UNITS,
  TEENS,
  TENS,
);

const SCALE_OF: Readonly<Record<string, number>> = Object.assign(
  Object.create(null),
  SCALES,
);

/** Every word this reading knows, scales and the connective included. */
export const NUMBER_WORDS: readonly string[] = [
  ...Object.keys(ADDENDS),
  ...Object.keys(SCALES),
].sort();

/** One word of prose, with where it sat. */
export interface Token {
  word: string;
  at: number;
  end: number;
}

/**
 * The prose split into lower-cased words, with offsets.
 *
 * A HYPHEN IS A SEPARATOR HERE, which is the whole reason this reads `fifty-two` correctly without
 * a compound in a map: the parse adds fifty and two because that is what English does, rather than
 * looking up a spelling somebody remembered to type in.
 */
export function tokens(text: string): Token[] {
  return [...text.matchAll(/[A-Za-z]+/g)].map((m) => ({
    word: m[0]!.toLowerCase(),
    at: m.index!,
    end: m.index! + m[0]!.length,
  }));
}

/** A maximal run of number-words, and what it comes to. */
export interface NumberRun {
  /** The words, in order, lower-cased and without the connective. */
  words: string[];
  /** The run exactly as the prose writes it. */
  text: string;
  value: number;
  at: number;
}

/**
 * What a run of number-words comes to, read as English reads it.
 *
 * `hundred` MULTIPLIES WHAT IS STANDING and `thousand` banks it, which is the whole difference
 * between this and a lookup: `one hundred and fifty-two` is 152 by arithmetic rather than by a row
 * somebody added. A run with a scale and nothing in front of it — `hundred rows` — reads as one
 * hundred, because that is what the sentence means.
 */
export function valueOf(words: readonly string[]): number {
  let total = 0;
  let current = 0;
  for (const word of words) {
    const addend = ADDENDS[word];
    if (addend !== undefined) {
      current += addend;
      continue;
    }
    const scale = SCALE_OF[word]!;
    if (scale === 100) current = (current === 0 ? 1 : current) * 100;
    else {
      total += (current === 0 ? 1 : current) * scale;
      current = 0;
    }
  }
  return total + current;
}

/** Only whitespace, hyphens and comment furniture may sit between two words of one number. */
const JOINABLE = /^[\s\-*/]*$/;

/**
 * Every maximal run of number-words in a piece of prose.
 *
 * THE `and` RULE IS THE LOAD-BEARING PART. Joining on every `and` turns *"three and two"* into five
 * and this tree writes that sentence; refusing every `and` loses *"one hundred and fifty-two"* and
 * this tree writes that one too. English spends `and` inside a number only after a scale, so the
 * connective is accepted only while a hundred or a thousand is already standing — which is a rule
 * about the language rather than about the corpus, and it is driven both ways in this unit's suite.
 */
export function runsIn(text: string): NumberRun[] {
  const all = tokens(text);
  const out: NumberRun[] = [];
  let i = 0;
  while (i < all.length) {
    const first = all[i]!;
    if (
      ADDENDS[first.word] === undefined &&
      SCALE_OF[first.word] === undefined
    ) {
      i += 1;
      continue;
    }
    const words: string[] = [first.word];
    let last = first;
    let j = i + 1;
    while (j < all.length) {
      const next = all[j]!;
      if (!JOINABLE.test(text.slice(last.end, next.at))) break;
      const isNumber =
        ADDENDS[next.word] !== undefined || SCALE_OF[next.word] !== undefined;
      if (isNumber) {
        words.push(next.word);
        last = next;
        j += 1;
        continue;
      }
      // `and`, and only while a scale is standing — otherwise it separates two numbers.
      if (next.word !== "and" || valueOf(words) < 100) break;
      const after = all[j + 1];
      if (after === undefined) break;
      if (!JOINABLE.test(text.slice(next.end, after.at))) break;
      if (
        ADDENDS[after.word] === undefined &&
        SCALE_OF[after.word] === undefined
      )
        break;
      words.push(after.word);
      last = after;
      j += 2;
    }
    out.push({
      words,
      text: text.slice(first.at, last.end),
      value: valueOf(words),
      at: first.at,
    });
    i = j;
  }
  return out;
}

/** One module's prose, as W314's own surface spells it. */
export interface Prose {
  module: string;
  text: string;
}

/** A claim W314 recorded, in the shape this reading needs and no more. */
export interface RecordedClaim {
  module: string;
  text: string;
  number: number;
}

/** A number the two readings disagree about. */
export interface Misreading {
  /** `<module> :: <claim text>`, which is W314's own key. */
  claim: string;
  /** What the regex recorded. */
  recorded: number;
  /** The run the parse found around it, and what it comes to. */
  run: string;
  parsed: number;
}

/**
 * Where reading the whole number disagrees with reading the word in front of the noun.
 *
 * The comparison is per claim rather than per run: a run nobody wrote a claim about is a number in
 * a sentence, and W314's population is numbers in front of the things this tree counts. What is
 * reported is the intersection — a claim the register holds whose number is not the number its own
 * sentence states.
 */
/** The part of a run after its last scale word — what a vocabulary of tens and units can express. */
export function tailAfterScale(words: readonly string[]): string[] {
  let last = -1;
  words.forEach((w, i) => {
    if (SCALE_OF[w] !== undefined) last = i;
  });
  return words.slice(last + 1);
}

/**
 * Where a number this tree writes is one W314's vocabulary cannot hold.
 *
 * THE POPULATION IS RUNS WITH A SCALE IN THEM, and that is the gate's own framing rather than a
 * convenience. A vocabulary of tens times units expresses everything up to ninety-nine and nothing
 * above it, so a run containing `hundred` or `thousand` is a compound it has never seen and can
 * never see — whatever the register recorded there, it is not what the sentence says.
 *
 * THE ANCHOR IS THE NOUN AND THE TAIL, both. A first version matched any run in the module holding
 * the claim's word and reported ten rows that were paragraphs away: `five` sits inside `Fifty-five`
 * in a sentence the claim has nothing to do with. What ties a row to a run is that the run is
 * followed by the claim's own noun phrase AND the row's number is the run's tail — the part after
 * the last scale, which is exactly the part a tens-and-units reading can see.
 */
export function misreadings(
  claims: readonly RecordedClaim[],
  prose: readonly Prose[],
): Misreading[] {
  const out: Misreading[] = [];
  for (const { module, text } of prose) {
    const rows = claims.filter((c) => c.module === module);
    for (const run of runsIn(text)) {
      const tail = tailAfterScale(run.words);
      if (tail.length === run.words.length) continue;
      const recorded = valueOf(tail);
      if (recorded === run.value) continue;
      const after = readable(
        text.slice(run.at + run.text.length, run.at + run.text.length + 60),
      );
      const row = rows.find(
        (c) =>
          c.number === recorded &&
          after
            .toLowerCase()
            .startsWith(
              readable(c.text.slice(c.text.indexOf(" ") + 1)).toLowerCase(),
            ),
      );
      if (row === undefined) continue;
      out.push({
        claim: `${module} :: ${row.text}`,
        recorded: row.number,
        run: readable(run.text),
        parsed: run.value,
      });
    }
  }
  return out.sort((a, b) => a.claim.localeCompare(b.claim));
}

/** Prose with its comment furniture taken out, so a number split over two lines reads as one. */
function readable(text: string): string {
  return text
    .replace(/[\s*/]*\/\/[\s*/]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every number-word this tree's prose actually writes, derived rather than assumed. */
export function wordsInTree(prose: readonly Prose[]): string[] {
  const seen = new Set<string>();
  for (const { text } of prose) {
    for (const { word } of tokens(text)) {
      if (ADDENDS[word] !== undefined || SCALE_OF[word] !== undefined)
        seen.add(word);
    }
  }
  return [...seen].sort();
}

/** A disagreement somebody has read, with what it is and what happens to it. */
export interface DeclaredMisreading {
  claim: string;
  /** What the sentence really says. */
  parsed: number;
  /** What W314's register holds today. */
  recorded: number;
  /** What is being done about it, in words. */
  disposition: string;
}

export const MISREAD_AT_W393: readonly DeclaredMisreading[] = [
  {
    claim: "src/quality/assertion-vocabulary.ts :: fifty-two sites",
    parsed: 152,
    recorded: 52,
    disposition:
      "THE SENTENCE IS RIGHT AND THE REGISTER IS WRONG, which is the direction worth saying out loud: W323 really did measure at one hundred and fifty-two of them, and the row beneath it has said fifty-two since the day it was filed. It is `at_the_unit`, so nothing re-derives it and nothing ever would have. NOT REWRITTEN HERE. W334 met this class and wrote its number in digits so the scanner would read it as one thing, and repeating that would make this register report nothing while the class stayed open — the row is the deliverable. Closing it properly means `CLAIM_RE` taking its NUMBER from a run rather than from the word it matched, which is W314 rebuilt rather than patched and is the first remedy `NUMBER_BOUND` names.",
  },
];

export interface MisreadDefect {
  claim: string;
  what: string;
}

/**
 * Where the register and the second reading disagree, in three directions.
 *
 * A misreading nobody declared; a declaration whose numbers have moved; a declaration for a claim
 * the tree reads correctly now. The third is the one that matters most: a row here going stale is
 * somebody having fixed the sentence, and a register that kept it would be recording history in
 * the class it exists to keep out of history.
 */
export function misreadDefects(
  found: readonly Misreading[],
  declared: readonly DeclaredMisreading[] = MISREAD_AT_W393,
): MisreadDefect[] {
  const byClaim = new Map(declared.map((d) => [d.claim, d]));
  const out: MisreadDefect[] = [];
  for (const hit of found) {
    const row = byClaim.get(hit.claim);
    if (row === undefined) {
      out.push({
        claim: hit.claim,
        what: `states ${hit.parsed} and is recorded as ${hit.recorded}, and nothing says so`,
      });
      continue;
    }
    if (row.parsed !== hit.parsed || row.recorded !== hit.recorded) {
      out.push({
        claim: hit.claim,
        what: `is declared as ${row.parsed} against ${row.recorded} and reads ${hit.parsed} against ${hit.recorded}`,
      });
    }
    if (row.disposition.length < 120) {
      out.push({
        claim: hit.claim,
        what: "is declared without an argument for leaving it as it is",
      });
    }
  }
  for (const row of declared) {
    if (!found.some((h) => h.claim === row.claim)) {
      out.push({
        claim: row.claim,
        what: "is declared here and the two readings now agree about it",
      });
    }
  }
  return out.sort((a, b) =>
    `${a.claim}${a.what}`.localeCompare(`${b.claim}${b.what}`),
  );
}

export const NUMBER_BOUND =
  "IT READS THE PROSE AND NOT THE TREE, SO IT SAYS WHICH NUMBER THE SENTENCE STATES AND NEVER " +
  "WHETHER THAT NUMBER IS RIGHT. A claim reading `one hundred and fifty-two sites` when the tree " +
  "holds nine is a claim this reading calls correct, because both readings agree about the words. " +
  "SECOND, THE POPULATION IS W314'S CLAIMS AND NOT EVERY NUMBER IN THE PROSE. A run of " +
  "number-words in front of a noun this tree does not count is invisible to both readings at once, " +
  "which is a blind spot the two derivations SHARE — and two readings that share a blind spot are " +
  "one reading with a second opinion. THIRD, IT STOPS AT A THOUSAND. `million` and `billion` are " +
  "not in the scales, and a comparative sentence about a market size would parse as its own tail; " +
  "the argument for stopping is that this reads engineering prose about a repository, and the " +
  "remedy when that stops being true is a scale word, not a unit. FOURTH, THE `and` RULE IS ABOUT " +
  "ENGLISH AND NOT ABOUT THIS CORPUS. A sentence writing `four hundred and twelve` to mean two " +
  "numbers would be read as one, and no scan can tell the two apart — a person reading the run " +
  "beside its sentence is the only check there is.";

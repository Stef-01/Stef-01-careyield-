// W363: the failure directions re-read — this quarter's gate.
//
// Q28'S GATE IS THAT EVERY CHECK THIS QUARTER'S HORIZON NAMES EITHER DECLARES WHICH WAY IT FAILS
// OR IS SHOWN FAILING LOUDLY. The document is where the quarter argued its theme from, and it
// argued it by naming checks: a class register that returned `unclassified` for a planted route, a
// reader count that called a probe string a reader, a population function that returned the whole
// tree when handed the wrong shape. Every one of those was cited as evidence that a check can fail
// toward looking correct. A quarter that cites a check and never says which way THAT one fails has
// made the argument and skipped the audit.
//
// THE POPULATION IS DERIVED FROM THE DOCUMENT, not listed: every backticked token in
// `docs/HORIZON-Q28.md` that resolves to a module this tree holds or to a name one of them exports.
// A token that resolves to neither is declared as not-a-check with the reason — `SUP-1` is a ledger
// row, `pending` is a value a class register returns — because "there is nothing to declare" and
// "nobody declared it" are indistinguishable from outside, which is W51's rule and this tree's
// oldest one.
//
// TWO STANDINGS, AND THE FIRST IS NOT AVAILABLE TO MOST OF THEM. W352 settled the direction for
// every member of W267's census, so a named check that walks the tree already has an answer and
// this register cites it rather than repeating it. Seven of the ten do not walk the tree — a class
// register, a control register, a guideline parser, a vault, a pair of quarter registers and a
// pair of test files — so W352 says nothing about them, and what stands in its place is a test that drives the
// check to REPORT. The citation is resolved: the file must hold a test with that title.
//
// WHAT THIS DOES NOT PROVE is `HORIZON_DIRECTION_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. It reads a planning document and this tree's own source.

import { readFileSync } from "node:fs";
import path from "node:path";
import { TREE_DERIVED_REGISTERS } from "./register-census";
import { directions } from "./failure-direction";
import { typescriptFiles } from "./tree-walks";

/** The quarter's own horizon, which is what this gate is about. */
export const HORIZON = "docs/HORIZON-Q28.md";

/** A name the horizon puts in backticks. */
export interface NamedToken {
  /** The token as the document writes it. */
  token: string;
  /** The module it resolves to, or null when it resolves to nothing this tree holds. */
  module: string | null;
}

/**
 * Every backticked token in the horizon, resolved against the tree.
 *
 * A CALL IS RESOLVED BY ITS NAME: the document writes `quarterModules(root, 326, 338)` because the
 * shape of the call is the finding, and what that names is the function. Everything before the
 * first bracket is the name to resolve.
 */
export function horizonTokens(root: string): NamedToken[] {
  const document = readFileSync(path.join(root, HORIZON), "utf8");
  const files = typescriptFiles(root).map((f) => f.slice(root.length + 1));
  const out: NamedToken[] = [];
  for (const token of [...new Set([...document.matchAll(/`([^`]+)`/g)].map((m) => m[1]!))].sort()) {
    out.push({ token, module: resolveToken(root, token, files) });
  }
  return out;
}

function resolveToken(root: string, token: string, files: readonly string[]): string | null {
  const name = token.replace(/\(.*$/, "").trim();
  if (name.endsWith(".md") || !/^[\w./-]+$/.test(name)) return null;
  const asFile = files.filter((f) => f === name || f.endsWith(`/${name}`));
  if (asFile.length === 1) return asFile[0]!;
  const declaration = new RegExp(`export (?:function|const|type|interface|class) ${name}\\b`);
  const owners = files.filter((f) => !f.endsWith(".test.ts") && declaration.test(readFileSync(path.join(root, f), "utf8")));
  return owners.length === 1 ? owners[0]! : null;
}

/** How a named check's failure direction is known. */
export type Standing =
  /** W352 settled it, because the check is a member of W267's census. `via` is that file. */
  | { kind: "declared"; via: string }
  /** A test drives it to report. `citation` is `<file> :: <test title>` and is resolved. */
  | { kind: "shown_loud"; citation: string; how: string }
  /** The token names no check — a ledger row, a value, a document. Argued, so the class is not a bin. */
  | { kind: "not_a_check"; why: string };

export interface NamedCheck {
  token: string;
  standing: Standing;
}

export interface HorizonDefect {
  token: string;
  what: string;
}

/**
 * Every name the quarter's horizon uses, and how its failure direction is known.
 *
 * ONE ROW PER TOKEN rather than per module: the document names `claim-classes.ts` and `pending`
 * separately and they are different claims — one is a register, the other is the value that
 * register returned for a planted route. Folding them would lose the second, which is the half the
 * quarter's argument actually rests on.
 */
export const CHECKS_AT_W363: readonly NamedCheck[] = [
  {
    token: "BUILD-STATE.md",
    standing: {
      kind: "not_a_check",
      why: "The ledger. It is the file every check in this tree resolves units against, and it decides nothing itself — a document with no derivation cannot fail in a direction. The checks that READ it are named separately and carry their own rows.",
    },
  },
  {
    token: "NOT_CALLABLE",
    standing: {
      kind: "declared",
      via: "src/quality/blind-spots.ts",
    },
  },
  {
    token: "SUP-1",
    standing: {
      kind: "not_a_check",
      why: "A blocked ledger row id, quoted in the horizon because W310's parse had dropped it and the gate dossier said sixteen where the tree said eighteen. The row is data; the parse that dropped it is `blocked-surface.ts` and the document does not name that, so nothing here is a check to point at.",
    },
  },
  {
    token: "SUP-2",
    standing: {
      kind: "not_a_check",
      why: "The other row the same parse dropped, quoted for the same reason. Named separately in this register because the document names it separately, and a register that silently paired them would be deciding that two ledger rows are one fact.",
    },
  },
  {
    token: "[P]",
    standing: {
      kind: "not_a_check",
      why: "The ledger's parallel-safe marker, quoted where the horizon says which of its units a sibling session may take. It is a flag a human reads and a claim register resolves; the resolution lives in `plan-ledger.test.ts`, which this register names in its own right.",
    },
  },
  {
    token: "claim-classes.ts",
    standing: {
      kind: "shown_loud",
      citation: "src/quality/claim-classes.test.ts :: reports a class the horizon names and nothing answers",
      how: "It is not a census member — it reads a two-column table in a plan document rather than walking the tree — so W352 says nothing about it. What stands instead is its comparison driven from outside on a class the register does not answer, plus the other direction one test below. Both arms report, which is what makes its silence a failure rather than a shrug.",
    },
  },
  {
    token: "controls.ts",
    standing: {
      kind: "shown_loud",
      citation: "src/quality/controls.test.ts :: reports a control the horizon names and nothing answers",
      how: "The same shape as `claim-classes.ts` one quarter on, and the same reason it is not in the census: a plan-document table rather than a tree walk. W349's mutation run found a hole in exactly this module's `pending` lookup and W332 had recorded the same hole in its twin, which is why the driven arm matters more here than the prose does.",
    },
  },
  {
    token: "docs/AUDIT-Y5.md",
    standing: {
      kind: "not_a_check",
      why: "A document the horizon derives from under the expansion rule. It states findings; it computes nothing and has no failure direction. `audit-y5.test.ts` is what holds it to the tree, and the horizon does not name that file.",
    },
  },
  {
    token: "docs/FIVE-YEAR-PLAN.md",
    standing: {
      kind: "not_a_check",
      why: "The plan. Same reading as the audit above: a document, not a derivation. What checks it is `plan-ledger.test.ts`, which the horizon names separately and which carries its own row.",
    },
  },
  {
    token: "docs/GATE-DOSSIER-Y5.md",
    standing: {
      kind: "not_a_check",
      why: "The gate dossier, cited as the other input the expansion rule requires. A document again — and the one W335 found understating the largest blocker, which is a fact about the parse that built it rather than about the file.",
    },
  },
  {
    token: "guidelineIntervals",
    standing: {
      kind: "shown_loud",
      citation: "src/registers/intervals.test.ts :: reports every refusal — a dropped interval is never silent",
      how: "Named in the horizon as a derivation W340's reader count credited with a reader it does not have — a fixture mentioned it. The parser itself is a product derivation rather than a register, so it is not in W267's census; what makes its failure loud is that a refused row is REPORTED rather than dropped, driven here on a duplicate id.",
    },
  },
  {
    token: "page-reach.ts",
    standing: {
      kind: "declared",
      via: "src/security/page-reach.ts",
    },
  },
  {
    token: "pending",
    standing: {
      kind: "not_a_check",
      why: "The class `claim-classes.ts` returns for a claim whose unit has not landed, quoted in the horizon because W332's mutant flipped the lookup that produces it and nothing noticed. It is a value rather than a derivation; the register that produces it carries the row, and the mutant that survived is recorded in `SURVIVORS_AT_W332`.",
    },
  },
  {
    token: "plan-ledger",
    standing: {
      kind: "shown_loud",
      citation: "src/quality/plan-ledger.test.ts :: would notice a gate that the plan does not define",
      how: "A check that lives entirely inside a test file, which is the shape W289 named: the comparison exports nothing, so nothing outside can hand it a different input and W352's census does not hold it. Its own suite drives it on a gate the plan does not define, which is the only arm available and is the one that matters — a blocked row naming an undefined gate is the state the check exists for.",
    },
  },
  {
    token: "quarterModules(root, 326, 338)",
    standing: {
      kind: "declared",
      via: "src/quality/quarter-mutants.ts",
    },
  },
  {
    token: "readEvidence",
    standing: {
      kind: "shown_loud",
      citation: "src/credentials/vault.test.ts :: a grant cannot read another practice's document, and is not told it exists",
      how: "The horizon names it as the second export W340's count credited with a reader that was a probe string. The vault is a product read behind a grant rather than a register, so W352 says nothing about it; what makes a failure loud is that the refusal is the assertion — a read that should be refused and is not fails this test rather than returning something a caller might not look at.",
    },
  },
  {
    token: "src/quality/horizon-q28.test.ts",
    standing: {
      kind: "shown_loud",
      citation: "src/quality/horizon-q28.test.ts :: refuses to set a numeric gate, and says why",
      how: "The horizon's own suite, named in the document because the expansion rule requires the document to be checked rather than asserted. Like `plan-ledger` it is a check welded inside a test file, so the census does not hold it; the cited arm is the one that would fail if a later editor put a number back into the gate, which is precisely the mistake Q24 made and this quarter's gate refuses.",
    },
  },
  {
    token: "src/quality/quarter-mutants-q26.ts",
    standing: {
      kind: "shown_loud",
      citation: "src/quality/quarter-mutants-q26.test.ts :: reports an excusal whose own claim the tree contradicts, which is the arm that matters",
      how: "Not a census member — it reads a population `quarter-mutants.ts` derives rather than walking anything itself, which is why the census holds the walker and not the caller. The cited arm is the one whose silence would matter: an exclusion is a module nobody is measuring, and an exclusion whose stated reason the tree contradicts is a measurement that looks complete.",
    },
  },
  {
    token: "unclassified",
    standing: {
      kind: "not_a_check",
      why: "What W352's own class register returned for a planted route, quoted in the horizon as the quarter's opening example — a check answering with a category instead of refusing. It is a value, not a derivation, and the register that returns it is `route-classes` rather than anything this document names.",
    },
  },
];

/**
 * Where the gate and the tree disagree, in four directions.
 *
 * The third is the one that reads as coverage: a citation naming a test that does not exist is a
 * row saying somebody drove the check, and nothing about a green run contradicts it.
 */
export function horizonDefects(
  root: string,
  declared: readonly NamedCheck[] = CHECKS_AT_W363,
  tokens: readonly NamedToken[] = horizonTokens(root),
): HorizonDefect[] {
  const out: HorizonDefect[] = [];
  const byToken = new Map(declared.map((d) => [d.token, d.standing]));
  const settled = new Set(directions(TREE_DERIVED_REGISTERS).map((d) => d.file));

  for (const { token, module } of tokens) {
    const standing = byToken.get(token);
    if (standing === undefined) {
      out.push({ token, what: "is named by the horizon and nothing says which way it fails" });
      continue;
    }
    if (standing.kind === "not_a_check" && module !== null) {
      out.push({ token, what: `is called not a check and resolves to ${module}` });
      continue;
    }
    if (standing.kind === "declared") {
      if (!settled.has(standing.via)) {
        out.push({ token, what: `is declared through ${standing.via} and W352 does not settle it` });
      }
      if (module !== standing.via) {
        out.push({ token, what: `is declared through ${standing.via} and resolves to ${module ?? "nothing"}` });
      }
      continue;
    }
    if (standing.kind === "shown_loud") {
      const [file, title] = standing.citation.split(" :: ");
      let source: string;
      try {
        source = readFileSync(path.join(root, file!), "utf8");
      } catch {
        out.push({ token, what: `cites ${file} and the tree holds no such file` });
        continue;
      }
      if (!source.includes(title!)) {
        out.push({ token, what: `cites a test the file does not hold: ${title}` });
      }
    }
  }
  for (const { token } of declared) {
    if (!tokens.some((t) => t.token === token)) {
      out.push({ token, what: "is answered here and the horizon no longer names it" });
    }
  }
  return out.sort((a, b) => `${a.token}${a.what}`.localeCompare(`${b.token}${b.what}`));
}

/** What this register does not prove. */
/**
 * How a `shown_loud` citation is RUN.
 *
 * W363 shipped these rows resolving a title in a file and stopping, and said so in its own bound:
 * a citation nobody runs is worth what W258 says it is worth. W371 closes that. The drive is HANDED
 * IN rather than imported, for W367's reason — `bounds.ts` imports this module's bound, so importing
 * a check back would complete a cycle whose symptom is `undefined` at module-eval — and because a
 * register that imported every check it cites would be a second copy of the census.
 */
export interface CitationDrive {
  /** The `shown_loud` token this drives. */
  token: string;
  /** Resolved and CALLED. True when the named check REPORTED on an input it must reject. */
  drive: () => boolean;
}

/**
 * A citation nothing can run, because the check it names has no callable form.
 *
 * EVERY ROW HERE IS W289'S CLASS RATHER THAN A NEW ONE: its whole comparison lives inside a
 * `.test.ts`, which exports nothing, so the citation cannot be resolved to anything a register may
 * call. `remedy` is required — a residue with no named change is how a short exception list becomes
 * a bin.
 */
export interface UnrunnableCitation {
  token: string;
  remedy: string;
}

export const UNRUNNABLE_CITATIONS: readonly UnrunnableCitation[] = [
  {
    token: "plan-ledger",
    remedy:
      "There is no `plan-ledger.ts` at all — the ledger comparison is written inline in `plan-ledger.test.ts`, which reads the plan and the ledger and asserts about them in the same breath. Moving the comparison into a module that takes the ledger's rows as an argument would make it callable, and would also make it drivable by W289, which cannot reach it either.",
  },
  {
    token: "src/quality/horizon-q28.test.ts",
    remedy:
      "The cited behaviour is a REFUSAL TO WRITE A NUMBER — the quarter gate declining to set a numeric threshold and saying why — and it is asserted about the document rather than computed from it. Exporting the reading as a function over the document's text would make it callable; until then the citation names a decision rather than a derivation.",
  },
];

export interface CitationDefect {
  token: string;
  what: string;
}

/**
 * Every `shown_loud` citation resolved to something runnable and CALLED.
 *
 * THIS IS THE HALF W363'S BOUND SAID WAS MISSING, and building it found the thing that kind of gap
 * hides: the `readEvidence` row cited a test that drives `openVault`. Both live in `vault.test.ts`
 * and the title resolved, so every check this tree had was satisfied by a row that pointed at the
 * wrong assertion. The citation now names the test that calls `readEvidence`.
 */
export function drivesItsCheck(
  checks: readonly NamedCheck[],
  drives: readonly CitationDrive[],
  unrunnable: readonly UnrunnableCitation[] = UNRUNNABLE_CITATIONS,
): CitationDefect[] {
  const cited = checks.filter((c) => c.standing.kind === "shown_loud").map((c) => c.token);
  const byToken = new Map(drives.map((d) => [d.token, d]));
  const excused = new Set(unrunnable.map((u) => u.token));
  const out: CitationDefect[] = [];

  for (const token of cited) {
    const drive = byToken.get(token);
    if (drive && excused.has(token)) {
      out.push({ token, what: "is both driven here and declared unrunnable, which cannot both be true" });
      continue;
    }
    if (!drive) {
      if (!excused.has(token)) out.push({ token, what: "cites a test and nothing here runs the check it names" });
      continue;
    }
    if (!drive.drive()) {
      out.push({ token, what: "has a drive that did not report, so the citation stands on nothing" });
    }
  }
  for (const { token } of drives) {
    if (!cited.includes(token)) out.push({ token, what: "is driven here and is not a shown_loud citation" });
  }
  for (const { token } of unrunnable) {
    if (!cited.includes(token)) out.push({ token, what: "is excused here and is not a shown_loud citation" });
  }
  return out.sort((a, b) => `${a.token}${a.what}`.localeCompare(`${b.token}${b.what}`));
}

export const HORIZON_DIRECTION_BOUND =
  "IT READS THE BACKTICKS, which is how this document happens to mark a name and not a rule about " +
  "prose. A check the horizon discusses in words without quoting it is outside the population " +
  "entirely, and the quarter's argument is mostly words — so a clean run here means every check " +
  "the document POINTED AT is answered, not every check it leaned on. The remedy is a reading of " +
  "the prose rather than of its punctuation, which is a judgement rather than a resolution. " +
  "A `shown_loud` ROW IS RUN AND NOT ONLY RESOLVED, since W371: `drivesItsCheck` takes a drive per " +
  "citation, CALLS it, and fails when the named check does not report on an input it must reject. " +
  "What that still does not prove is that the drive and the cited test are the SAME assertion — " +
  "they exercise the same export, and a test asserting something else about it would satisfy both. " +
  "AND SOME ROWS CANNOT BE RUN AT ALL: `plan-ledger` and `horizon-q28.test.ts` keep their whole " +
  "comparison inside a `.test.ts`, which exports nothing, so `UNRUNNABLE_CITATIONS` names them with " +
  "the change that would make them callable — moving a welded comparison out of its `.test.ts`. " +
  "AND `not_a_check` " +
  "IS THE CLASS TO WATCH: it holds most of the rows, every one of them a judgement that a token " +
  "names data rather than a derivation, and the only mechanical thing standing behind it is that " +
  "the token resolves to no module in this tree.";

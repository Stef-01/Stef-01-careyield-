// W216: the Q17 dossier's claims, checked against the sources they were derived from.
//
// W207's shape — a dossier's value is entirely in its counts being current, and it becomes a lie
// silently. Two things are inherited from what came after it.
//
//   THE YEAR BOUND, which W208 turned into a general finding. W207's arithmetic read the LIVE
//   ledger and went red the moment Year 5 was planned: the document had not become wrong, the
//   check had. A point-in-time document pinned against a moving target inherits that bug, so this
//   one is scoped to Q17's own rows from the start.
//
//   THE CLAIMS THAT ARE NOT COUNTS. This dossier's central claim is not arithmetic, it is that a
//   PUBLISHED NOTICE and the LIVE CODE contradict each other. Pinning that as prose would be
//   pinning it to itself, so both halves are checked against their sources: the quotation against
//   W201's register, and the ranker against `src/engine/pool.ts`. Either one changing fails this
//   file, which is the only way a document that exists to report a contradiction can be trusted
//   to still be reporting a real one.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NEVER_AUTOMATED } from "@/privacy/automated-decisions";
import { LATENT_FINDINGS } from "./latent-findings";

const ROOT = path.resolve(__dirname, "../..");
const LEDGER = readFileSync(path.join(ROOT, "BUILD-STATE.md"), "utf8");
const DOSSIER = readFileSync(path.join(ROOT, "docs/GATE-DOSSIER-Q17.md"), "utf8");
const POOL = readFileSync(path.join(ROOT, "src/engine/pool.ts"), "utf8");

/**
 * The dossier as continuous prose: blockquote markers stripped and newlines collapsed.
 *
 * Markdown wraps, so a quotation that is present and correct fails a raw `toContain` on the line
 * break — which would push the next author into reflowing a document to satisfy a test rather
 * than fixing anything. These assertions are about content, so they run over content.
 */
const FLAT = DOSSIER.replace(/^> /gm, "").replace(/\s+/g, " ");

/** Q17 is W209–W221. Bounded from the start — see the module note. */
const Q17_FIRST = 209;
const Q17_LAST = 221;

function blockedInQ17(): string[] {
  return LEDGER.split("\n")
    .filter((line) => /^\| W\d+ \| blocked \|/.test(line))
    .map((line) => line.split("|").map((c) => c.trim())[1]!)
    .filter((id) => {
      const n = Number(id.slice(1));
      return n >= Q17_FIRST && n <= Q17_LAST;
    })
    .sort();
}

describe("W216 the dossier counts what the ledger says, inside its own quarter", () => {
  it("names exactly the Q17 units a ruling would release", () => {
    // One. The dossier's headline is that the decision is cheap in units and expensive in what it
    // reveals, so the count being small is the point rather than an embarrassment.
    expect(blockedInQ17()).toEqual(["W217"]);
    expect(FLAT).toMatch(/\*\*1\*\* — W217/);
  });

  it("finds the row pointing at this document, so the ledger and the dossier agree", () => {
    // W168's widened check accepts an un-numbered decision only when it names the document where
    // the question is written down. This is the other end of that link.
    const row = LEDGER.split("\n").find((line) => line.startsWith("| W217 |"));
    expect(row).toBeDefined();
    expect(row!).toMatch(/FOUNDER DECISION — Q17 action 1/);
    expect(row!).toMatch(/docs\/GATE-DOSSIER-Q17\.md/);
  });

  it("is not falsifiable by a later quarter", () => {
    // The W208 lesson, asserted rather than trusted: Y5 rows outside Q17 exist and are blocked,
    // and this document's arithmetic must not move when they do.
    const allBlocked = LEDGER.split("\n").filter((l) => /^\| W\d+ \| blocked \|/.test(l)).length;
    expect(allBlocked).toBeGreaterThan(blockedInQ17().length);
  });
});

describe("W216 the contradiction it reports is real, on both sides", () => {
  it("quotes the published notice as the notice actually reads", () => {
    // Pinned against W201's register rather than against the page's HTML, because the register is
    // what the page renders. A reworded notice fails here, which is correct: the dossier would
    // then be quoting something nobody publishes.
    const line = NEVER_AUTOMATED.find((s) => s.startsWith("No ordering of patients by need"));
    expect(line, "the ADM notice no longer says this").toBeDefined();
    expect(FLAT).toContain(line!.replace(/\s+/g, " "));
  });

  it("finds the live ranker still ordering on a clinical attribute", () => {
    // The other half. If somebody removes the clinical sort, this fails and the dossier has to be
    // rewritten — which is the outcome the document is asking for.
    expect(POOL, "rankCandidates no longer sorts on chronicCare").toMatch(/a\.chronicCare !== b\.chronicCare/);
    expect(POOL, "the overdue comment is gone").toMatch(/longer overdue/);
    expect(FLAT).toMatch(/older date = longer overdue = first/);
  });

  it("is recorded where a build will notice it, not only in this document", () => {
    // A dossier nobody re-reads is the failure mode. MATCH-1 carries the predicate.
    const match1 = LATENT_FINDINGS.find((f) => f.id === "MATCH-1");
    expect(match1, "MATCH-1 is not in the latent register").toBeDefined();
    expect(match1!.status).toBe("open");
    expect(match1!.recordedBy).toBe("W214");
    expect(match1!.trigger(), "MATCH-1 has fired and nobody noticed").toBe(false);
  });
});

describe("W216 the dossier takes no position", () => {
  it("prices both answers rather than arguing for one", () => {
    expect(DOSSIER).toMatch(/Cost if the answer is "yes"/);
    expect(DOSSIER).toMatch(/Cost if the answer is "no"/);
    expect(DOSSIER).toMatch(/The loop takes no position/);
  });

  it("says what not answering costs, which is the column a dossier usually omits", () => {
    expect(DOSSIER).toMatch(/Cost of not answering/);
  });

  it("distinguishes this decision from G7 rather than folding it in", () => {
    // Both would be wrong: calling it G7 would block it behind a gate that does not cover it, and
    // ignoring G7 would hide the argument that actually applies (W200's first rail property).
    expect(FLAT).toMatch(/does not obviously cross G7/);
    expect(FLAT).toMatch(/W200's first rail property/);
  });
});

// W350 verify gate: "every claim `docs/HORIZON-Q27.md` makes about a fact the tree holds either
// read by a check that exists or declared unread with its reason; a claim named and neither read
// nor declared fails."
//
// THE GATE IS APPLIED TO ITS OWN DOCUMENT, and the arms that matter are driven on a constructed
// one: a horizon that emphasises something nobody classified must fail, and a register describing
// a document that has moved on must fail too.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  HORIZON_CLAIM_BOUND,
  HORIZON_Q27,
  Q27_CLAIMS,
  boldClaims,
  horizonClaimDefects,
  unreadClaims,
} from "./horizon-claims";
import { parseCitation, type ParsedCitation } from "./citations";
import { GIT_LOG, claimCommit, workWindow } from "./timelines";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const DOC = read(HORIZON_Q27);

describe("W350 Q27's gate, over Q27's own horizon", () => {
  it("classifies every claim the document emphasises, in both directions", () => {
    expect(horizonClaimDefects(ROOT)).toEqual([]);
  });

  it("reads a population worth classifying, so the empty list means something", () => {
    // W279: silence is evidence only when the detector was running. A floor rather than a pin.
    expect(boldClaims(DOC).length).toBeGreaterThan(20);
    expect(new Set(Q27_CLAIMS.map((c) => c.reading.kind))).toEqual(
      new Set(["read_by", "unread", "not_about_the_tree"]),
    );
  });

  it("argues every reading, whichever arm it is", () => {
    for (const row of Q27_CLAIMS) {
      const argument = row.reading.kind === "read_by" ? row.reading.how : row.reading.why;
      expect(argument.length, `${row.claim.slice(0, 40)} is unargued`).toBeGreaterThan(100);
    }
  });

  it("resolves every check a `read_by` names, against the file and the assertion", () => {
    // W258: a citation is resolved, not recorded — and W284's central citation resolved to
    // `text.includes("/")` and read as coverage for a quarter, which is why both halves are read.
    for (const row of Q27_CLAIMS) {
      if (row.reading.kind !== "read_by") continue;
      const parsed = parseCitation(row.reading.check);
      expect(typeof parsed, `${row.reading.check} is not a citation`).not.toBe("string");
      const { file, assertion } = parsed as ParsedCitation;
      expect(read(file), `${file} does not contain ${assertion}`).toContain(assertion);
    }
  });

  it("names the claims nothing reads, rather than leaving them in a total", () => {
    // W290's rule: a NAMED list moves deliberately and a count moves by accident. Four today, and
    // each is named in the register rather than counted here.
    expect(unreadClaims().length).toBeGreaterThan(0);
    for (const claim of unreadClaims()) {
      expect(boldClaims(DOC), `${claim} is declared unread and the document does not say it`).toContain(
        claim,
      );
    }
  });
});

describe("W350 the arms, driven on a constructed horizon", () => {
  const planted = (body: string) => `# a planted horizon\n\n${body}\n`;

  it("reports a claim the document emphasises and nobody classified", () => {
    const defects = horizonClaimDefects(ROOT, planted("The tree holds **a claim nobody wrote down**."), []);
    expect(defects).toEqual([
      {
        claim: "a claim nobody wrote down",
        what: "is emphasised in the horizon and nothing here says whether anything reads it",
      },
    ]);
  });

  it("reports a declared claim the document no longer makes", () => {
    const defects = horizonClaimDefects(ROOT, planted("Nothing emphasised here."), [
      { claim: "a claim that has gone", reading: { kind: "unread", why: "x".repeat(120) } },
    ]);
    expect(defects).toEqual([
      { claim: "a claim that has gone", what: "is declared and the document no longer makes it" },
    ]);
  });

  it("says nothing when the document and the register agree", () => {
    const defects = horizonClaimDefects(ROOT, planted("It says **one thing**."), [
      { claim: "one thing", reading: { kind: "unread", why: "x".repeat(120) } },
    ]);
    expect(defects).toEqual([]);
  });

  it("reads a claim that spans lines, because the document wraps at ninety-eight columns", () => {
    // Found by running it: three of the real claims wrap, and a scan that stopped at a newline
    // reported them as two claims neither of which anybody had declared.
    expect(boldClaims("of which **320 are\ndone** once this close lands")).toEqual(["320 are done"]);
  });
});

describe("W350 the claim this gate could not have read before W344", () => {
  it("the document was written before the quarter it plans", () => {
    // THE HORIZON RULE'S WHOLE FORCE is that the expansion precedes the work, and until W344 built
    // a window out of the record nothing in this tree could read an order at all. W338 landed the
    // document; W339 is Q27's first unit and its claim commit is where the quarter began.
    const log = GIT_LOG(ROOT);
    const expansion = workWindow(ROOT, log, "W338");
    const firstUnit = claimCommit(log, "W339");
    expect(expansion, "W338 has no window, so the order cannot be read").not.toBeNull();
    expect(firstUnit, "W339 never pushed a claim, so the quarter has no start").not.toBeNull();
    expect(
      expansion!.to < firstUnit!.at,
      "the horizon landed after the quarter's first unit began, which the rule forbids",
    ).toBe(true);
  });
});

describe("W350 the bound", () => {
  it("states that the population is the document's bold, and that a citation is resolved not read", () => {
    expect(HORIZON_CLAIM_BOUND).toContain("THE POPULATION IS THE DOCUMENT'S BOLD");
    expect(HORIZON_CLAIM_BOUND).toContain("RESOLVED AND NOT");
    expect(HORIZON_CLAIM_BOUND.length).toBeGreaterThan(500);
  });

  it("is true: a claim written plainly is invisible to it", () => {
    // The bound's own non-vacuity, W339's rule. The same sentence, emphasised and not.
    const seen = horizonClaimDefects(ROOT, "The tree holds a plain claim about itself.", []);
    const emphasised = horizonClaimDefects(ROOT, "The tree holds **a plain claim about itself**.", []);
    expect(seen).toEqual([]);
    expect(emphasised.length).toBe(1);
  });
});

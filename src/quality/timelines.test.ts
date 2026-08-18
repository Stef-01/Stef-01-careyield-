// W344 verify gate: "a finding's timeline reconstructed from the ledger and the commit record
// rather than assumed, driven on W328's premise error, and a claim about when something started
// reported when the record disagrees."
//
// THE ARM THAT MATTERS IS DRIVEN ON THE CLAIM THAT WAS WRONG. W328's premise — that something was
// getting past W322's refusal — is handed to this register as the tree believed it for a day, and
// the record must refuse it. A register of claims that all agree proves only that somebody typed
// them carefully.

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GIT_LOG,
  TIMELINE_BOUND,
  TIMELINE_CLAIMS,
  type Commit,
  type TimelineClaim,
  claimCommit,
  commitOf,
  ledgerSha,
  standingOf,
  timelineDefects,
  workWindow,
} from "./timelines";
import { parseCitation, type ParsedCitation } from "./citations";
import { withTree } from "./planting";

const ROOT = path.resolve(__dirname, "../..");
const LOG = GIT_LOG(ROOT);

/** A record somebody constructed, so the comparison can be shown answering about another tree. */
const record = (entries: ReadonlyArray<[string, string, string]>): Commit[] =>
  entries.map(([sha, at, subject]) => ({ sha, at, subject }));

describe("W344 the record is read, not assumed", () => {
  it("reads a log at all, so everything below is over something", () => {
    expect(LOG.length, "no commit record: every standing would be `unreadable`").toBeGreaterThan(100);
    expect(LOG[0]!.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("reconstructs a unit's window from its claim commit and its ledger row", () => {
    // W321 is the window W328's premise turned on, and both ends come from the record rather than
    // from anybody's memory of them.
    const window = workWindow(ROOT, LOG, "W321");
    expect(window, "W321 has no window, so the premise cannot be re-derived at all").not.toBeNull();
    expect(window!.from < window!.to, "a window that ends before it starts").toBe(true);
    expect(claimCommit(LOG, "W321")!.subject).toMatch(/^W321: claim/);
    expect(commitOf(LOG, ledgerSha(ROOT, "W321")!)!.sha).toContain(ledgerSha(ROOT, "W321")!);
  });

  it("says `unreadable` rather than guessing, for a unit with no claim commit and a row with no SHA", () => {
    expect(workWindow(ROOT, LOG, "W9999")).toBeNull();
    expect(ledgerSha(ROOT, "W9999")).toBeNull();
    expect(standingOf(null, "2026-01-01T00:00:00+00:00")).toBe("unreadable");
    expect(standingOf({ unit: "W1", from: "a", to: "b" }, null)).toBe("unreadable");
  });

  it("reads the record out of the tree it is given, not out of this one", () => {
    // W282's rule: a reader welded to this repository can never be shown answering differently.
    // A tree with no `.git` is the extreme case, and it must be quiet rather than loud.
    const found = withTree({ "src/planted/anything.ts": "export const a = 1;\n" }, (root) => GIT_LOG(root));
    expect(found).toEqual([]);
  });
});

describe("W344 W328's premise error, driven", () => {
  const premise: TimelineClaim = {
    ...TIMELINE_CLAIMS.find((c) => c.id === "PLANT-1")!,
    id: "PLANT-1-AS-BELIEVED",
    says: "Something still writes `src/planted/` after W322's refusal, so a writer gets past it.",
    // THE BELIEF: that the refusal was in place for the whole of the run that left the residue.
    standing: "throughout",
  };

  it("reports the claim the record refutes", () => {
    expect(timelineDefects(ROOT, LOG, [premise])).toEqual([
      { claim: "PLANT-1-AS-BELIEVED", what: "says the record reads `throughout` and it reads `arrived_during`" },
    ]);
  });

  it("says nothing about the corrected claim, which is the same sentence with the order read", () => {
    expect(timelineDefects(ROOT, LOG, TIMELINE_CLAIMS.filter((c) => c.id === "PLANT-1"))).toEqual([]);
  });

  it("puts the refusal inside the window rather than before it, which is the whole finding", () => {
    const window = workWindow(ROOT, LOG, "W321")!;
    const refusal = commitOf(LOG, TIMELINE_CLAIMS.find((c) => c.id === "PLANT-1")!.state.sha)!;
    expect(refusal.at > window.from, "the refusal predates the run, so the premise was fine").toBe(true);
    expect(refusal.at < window.to, "the refusal postdates the run entirely").toBe(true);
  });
});

describe("W344 a claim about when something started, over a constructed record", () => {
  const log = record([
    ["aaaaaaa", "2026-01-01T09:00:00+00:00", "W900: claim — a unit"],
    ["bbbbbbb", "2026-01-01T10:00:00+00:00", "W900: the unit"],
    ["ccccccc", "2026-01-01T08:00:00+00:00", "the state, before the window"],
    ["ddddddd", "2026-01-01T09:30:00+00:00", "the state, inside the window"],
    ["eeeeeee", "2026-01-01T11:00:00+00:00", "the state, after the window"],
  ]);
  const ledger = "| W900 | done | builder-B | 2026-01-01T09:00Z | bbbbbbb | a planted unit |\n";
  const claim = (sha: string, standing: TimelineClaim["standing"]): TimelineClaim => ({
    id: `PROBE-${sha}`,
    says: "a planted claim",
    where: "src/quality/timelines.test.ts :: a planted claim",
    state: { what: "a planted state", sha },
    during: "W900",
    standing,
  });

  it("separates the three standings, which is the distinction the register exists to make", () => {
    withTree({ "BUILD-STATE.md": ledger }, (root) => {
      expect(timelineDefects(root, log, [claim("ccccccc", "throughout")])).toEqual([]);
      expect(timelineDefects(root, log, [claim("ddddddd", "arrived_during")])).toEqual([]);
      expect(timelineDefects(root, log, [claim("eeeeeee", "after")])).toEqual([]);
    });
  });

  it("reports each one when the claim and the record disagree", () => {
    withTree({ "BUILD-STATE.md": ledger }, (root) => {
      expect(timelineDefects(root, log, [claim("ccccccc", "arrived_during")]).length).toBe(1);
      expect(timelineDefects(root, log, [claim("ddddddd", "throughout")]).length).toBe(1);
      expect(timelineDefects(root, log, [claim("eeeeeee", "throughout")]).length).toBe(1);
    });
  });

  it("reports a claim naming a commit the record does not hold, rather than passing it", () => {
    withTree({ "BUILD-STATE.md": ledger }, (root) => {
      expect(timelineDefects(root, log, [claim("fffffff", "throughout")])).toEqual([
        { claim: "PROBE-fffffff", what: "says the record reads `throughout` and it reads `unreadable`" },
      ]);
    });
  });

  it("takes the EARLIEST claim commit, so a re-claim after a rebase does not shorten the window", () => {
    const reclaimed = record([
      ["1111111", "2026-01-01T09:00:00+00:00", "W900: claim — a unit"],
      ["2222222", "2026-01-01T09:45:00+00:00", "W900: claim — a unit, re-pushed after a rebase"],
      ["bbbbbbb", "2026-01-01T10:00:00+00:00", "W900: the unit"],
      ["ddddddd", "2026-01-01T09:30:00+00:00", "the state, inside the real window"],
    ]);
    expect(claimCommit(reclaimed, "W900")!.sha).toBe("1111111");
    withTree({ "BUILD-STATE.md": ledger }, (root) => {
      // The state at 09:30 is INSIDE the real window and would read as `throughout` against a
      // window that started at the re-claim.
      expect(timelineDefects(root, reclaimed, [claim("ddddddd", "arrived_during")])).toEqual([]);
    });
  });
});

describe("W344 the claims are argued and resolved", () => {
  it("resolves where every claim is written", () => {
    for (const claim of TIMELINE_CLAIMS) {
      const parsed = parseCitation(claim.where);
      expect(typeof parsed, `${claim.id}: ${claim.where}`).not.toBe("string");
      const { file } = parsed as ParsedCitation;
      expect(() => readFileSync(path.join(ROOT, file), "utf8"), `${claim.id} names ${file}`).not.toThrow();
    }
  });

  it("quotes the sentence it is about, at length", () => {
    for (const claim of TIMELINE_CLAIMS) {
      expect(claim.says.length, `${claim.id} quotes nothing`).toBeGreaterThan(80);
      expect(claim.state.what.length, `${claim.id} does not say what the state is`).toBeGreaterThan(20);
    }
  });

  it("agrees with the record, over every claim the tree currently makes", () => {
    expect(timelineDefects(ROOT, LOG, TIMELINE_CLAIMS)).toEqual([]);
  });
});

describe("W344 the bound", () => {
  it("states what a window is not, and that the population is declared", () => {
    expect(TIMELINE_BOUND).toContain("claim the protocol makes a unit push");
    expect(TIMELINE_BOUND).toContain("THE POPULATION IS DECLARED");
    expect(TIMELINE_BOUND.length).toBeGreaterThan(500);
  });

  it("is true: a verify that ran outside the window is outside what this calls the work", () => {
    // The bound's own non-vacuity. W321's residue-leaving verify ran INSIDE its window, so the
    // register saw it; a run before the claim commit is invisible to the same comparison, and this
    // is the case that shows it.
    const window = workWindow(ROOT, LOG, "W321")!;
    const before = "2026-08-17T20:00:00+00:00";
    expect(before < window.from).toBe(true);
    expect(standingOf(window, before)).toBe("throughout");
  });
});

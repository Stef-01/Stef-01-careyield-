// W322 verify gate: "what has changed since a recorded reading, derived from the ledger rather than
// stored, with a first visit saying so rather than rendering an empty diff."
//
// THE THREE STATES ARE THE UNIT. A first reading, a reading with movement, and a reading with none
// are three different sentences, and collapsing any two is the defect: an empty diff shown to
// somebody who has never looked says "nothing changed" about a period they never saw. That is
// W279's could_not_load-versus-empty distinction, arriving on a page nobody had asked it about.
//
// AND EVERY ANSWER IS DERIVED FROM A PLANTED LEDGER rather than from this repository's, because a
// comparison that can only be run against one document can be read and never driven — W267's rule,
// and the reason `sinceReading` takes a root.

import { describe, expect, it } from "vitest";
import {
  SECOND_READING_BOUND,
  SECOND_READING_COPY,
  sinceReading,
} from "./second-reading";
import { withTree } from "@/quality/planting";

const ROOT = process.cwd();
const row = (id: string, status: string, note = "a note") =>
  `| ${id} | ${status} | builder-A | 2026-08-17T00:00Z | abc1234 | ${note} |`;
const ledger = (...rows: string[]) =>
  `# Build state\n\n| Unit | Status | By | At | Commit | Note |\n| --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`;

describe("W322 the three states a reading can be in", () => {
  it("says a first reading is a first reading, rather than showing an empty diff", () => {
    // THE UNIT. Without this arm the page tells somebody who has never looked that nothing has
    // changed, which is false in the way that matters: they have not seen any of it.
    expect(sinceReading(ROOT, null)).toEqual({ kind: "first_reading" });
    expect(SECOND_READING_COPY.firstReading).toMatch(/nothing to compare/i);
    // And the sentence is NOT the quiet one, which is the collapse this arm exists to prevent.
    expect(SECOND_READING_COPY.firstReading).not.toBe(SECOND_READING_COPY.quiet);
  });

  it("reports what the ledger says moved since the marker", () => {
    const found = withTree(
      {
        "BUILD-STATE.md": ledger(
          row("W1", "done"),
          row("W2", "done"),
          row("W3", "blocked", "waiting on **FOUNDER GATE G5**"),
        ),
      },
      (root) => sinceReading(root, { lastUnit: "W1" }),
    );
    expect(found).toEqual({
      kind: "since",
      lastUnit: "W1",
      built: [{ id: "W2", blocker: null }],
      blocked: [{ id: "W3", blocker: "G5" }],
      quiet: false,
    });
  });

  it("distinguishes a quiet stretch from a first reading, which is the same mistake twice", () => {
    const quiet = withTree(
      { "BUILD-STATE.md": ledger(row("W1", "done"), row("W2", "available")) },
      (root) => sinceReading(root, { lastUnit: "W1" }),
    );
    expect(quiet).toEqual({ kind: "since", lastUnit: "W1", built: [], blocked: [], quiet: true });
    expect(SECOND_READING_COPY.quiet).toMatch(/different statement/i);
  });

  it("refuses a marker the ledger does not have, rather than measuring from nothing", () => {
    // A link from an old mail, or a unit id somebody typed. Measuring from a marker the ledger
    // never had would report the whole ledger as new, which reads as a very busy month.
    const unknown = withTree({ "BUILD-STATE.md": ledger(row("W1", "done")) }, (root) =>
      sinceReading(root, { lastUnit: "W999" }),
    );
    expect(unknown).toEqual({ kind: "unknown_unit", lastUnit: "W999" });
    const nonsense = withTree({ "BUILD-STATE.md": ledger(row("W1", "done")) }, (root) =>
      sinceReading(root, { lastUnit: "not-a-unit" }),
    );
    expect(nonsense).toEqual({ kind: "unknown_unit", lastUnit: "not-a-unit" });
  });

  it("orders by unit number rather than by the timestamp column", () => {
    // Two sessions building in parallel close out of order — W305 landed between W309's verify and
    // its push — so the `at` column is the moment a unit was CLAIMED and not the sequence. A
    // comparison built on it would report a later unit as older than one that finished first.
    const found = withTree(
      {
        "BUILD-STATE.md": ledger(
          `| W10 | done | builder-B | 2026-01-01T00:00Z | aaa | earlier clock, later unit |`,
          `| W9 | done | builder-A | 2026-09-09T00:00Z | bbb | later clock, earlier unit |`,
        ),
      },
      (root) => sinceReading(root, { lastUnit: "W9" }),
    );
    expect(found.kind === "since" && found.built.map((b) => b.id)).toEqual(["W10"]);
  });

  it("works against this tree's own ledger, which is the one the page renders", () => {
    // The planted answers above prove the comparison; this proves it is pointed at something real.
    const real = sinceReading(ROOT, { lastUnit: "W300" });
    expect(real.kind).toBe("since");
    expect(real.kind === "since" && real.built.length, "no unit has landed since W300").toBeGreaterThan(5);
    expect(real.kind === "since" && real.quiet).toBe(false);
  });

  it("says what a marker cannot see", () => {
    expect(SECOND_READING_BOUND).toContain("rewritten in place");
    expect(SECOND_READING_BOUND).toContain("stored snapshot");
    expect(SECOND_READING_BOUND.length).toBeGreaterThan(400);
  });
});

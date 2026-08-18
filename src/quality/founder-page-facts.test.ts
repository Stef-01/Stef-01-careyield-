// W347 verify gate: "every derived fact about the outstanding position that the page could show
// and does not, enumerated and either rendered or declared, with the G5 correction visible."
//
// THE LIVE ASSERTION IS ONE LINE and the rest of this file is about whether it can fail. A register
// saying a page renders a fact is the easiest claim in this tree to write vacuously — nothing about
// a list of sentences requires the page to have changed — so both halves of the rendering claim are
// resolved against the page's own source, and both are driven against a planted page here rather
// than argued. What only a browser can prove is that the rendered call reaches a reader, and that
// is `e2e/founder.spec.ts`, which walks the four sections this unit added.

import { describe, expect, it } from "vitest";
import { withTree } from "./planting";
import { blockedShape, gatesBlockingNothing } from "@/founder/outstanding";
import {
  FOUNDER_PAGE,
  PAGE_FACTS,
  PAGE_FACT_BOUND,
  type PageFact,
  POSITION_MODULES,
  pageFactDefects,
  pageNames,
  positionDerivations,
} from "./founder-page-facts";

const ROOT = process.cwd();
const FOUND = positionDerivations(ROOT);

/** A page naming one derivation and not the other, so both arms have something to disagree with. */
const PLANTED_PAGE = {
  [FOUNDER_PAGE]: 'import { shownFact } from "@/founder/outstanding";\nexport default function P() { return shownFact(); }\n',
};

describe("W347 every fact about the outstanding position is rendered or declared", () => {
  it("passes, over the page the console actually serves", () => {
    expect(pageFactDefects(ROOT, PAGE_FACTS, FOUND)).toEqual([]);
  });

  it("derives the population from the modules rather than listing it", () => {
    expect(FOUND.length).toBeGreaterThan(12);
    expect(FOUND.every((id) => POSITION_MODULES.some((m) => id.startsWith(`${m}::`)))).toBe(true);
    // Every module named contributes, so a module that stopped exporting derivations would show.
    for (const module of POSITION_MODULES) {
      expect(FOUND.some((id) => id.startsWith(`${module}::`)), `${module} contributes nothing`).toBe(true);
    }
  });

  it("reads the page's own source for what it names", () => {
    const names = pageNames(ROOT);
    expect(names).toContain("gatesBlockingNothing");
    expect(names).toContain("blockedShape");
    // A name the page has never held, so the set is not simply everything.
    expect(names.has("blockedSurfaceViolations")).toBe(false);
  });
});

describe("W347 the register against the page and the modules", () => {
  it("reports a derivation nobody classified", () => {
    const arriving = [...FOUND, "src/founder/outstanding.ts::somethingNew"];
    expect(pageFactDefects(ROOT, PAGE_FACTS, arriving)).toEqual([
      {
        id: "src/founder/outstanding.ts::somethingNew",
        what: "derives a fact about the outstanding position and nothing says whether the page shows it",
      },
    ]);
  });

  it("reports a classification for a derivation the modules no longer export", () => {
    const gone = FOUND.filter((id) => id !== "src/founder/outstanding.ts::blockedShape");
    expect(pageFactDefects(ROOT, PAGE_FACTS, gone)).toEqual([
      {
        id: "src/founder/outstanding.ts::blockedShape",
        what: "is classified here and the position modules no longer export it",
      },
    ]);
  });

  it("reports a fact declared rendered that the page does not name", () => {
    const declared: PageFact[] = [
      { id: "src/founder/outstanding.ts::missingFact", shown: { kind: "rendered", section: "somewhere" } },
    ];
    const defects = withTree(PLANTED_PAGE, (root) =>
      pageFactDefects(root, declared, ["src/founder/outstanding.ts::missingFact"]),
    );
    expect(defects).toEqual([
      { id: "src/founder/outstanding.ts::missingFact", what: "is declared rendered and the page does not name it" },
    ]);
  });

  it("says nothing about a fact declared rendered that the page does name, so the arm is not a blanket refusal", () => {
    const declared: PageFact[] = [
      { id: "src/founder/outstanding.ts::shownFact", shown: { kind: "rendered", section: "somewhere" } },
    ];
    const defects = withTree(PLANTED_PAGE, (root) =>
      pageFactDefects(root, declared, ["src/founder/outstanding.ts::shownFact"]),
    );
    expect(defects).toEqual([]);
  });

  it("reports a fact declared UNSHOWN that the page names, which is the other direction", () => {
    // The arm that keeps a `declared` reason from going quietly false. A page that started
    // rendering a fact leaves the argument for not rendering it standing, and nothing else reads it.
    const declared: PageFact[] = [
      { id: "src/founder/outstanding.ts::shownFact", shown: { kind: "declared", why: "the page has no room for it" } },
    ];
    const defects = withTree(PLANTED_PAGE, (root) =>
      pageFactDefects(root, declared, ["src/founder/outstanding.ts::shownFact"]),
    );
    expect(defects).toEqual([
      { id: "src/founder/outstanding.ts::shownFact", what: "is declared unshown and the page names it" },
    ]);
  });

  it("reports a `through` chain that terminates at a fact nothing renders", () => {
    const declared: PageFact[] = [
      { id: "src/founder/outstanding.ts::step", shown: { kind: "through", by: "src/founder/outstanding.ts::hidden", what: "folded in" } },
      { id: "src/founder/outstanding.ts::hidden", shown: { kind: "declared", why: "no room" } },
    ];
    const defects = withTree(PLANTED_PAGE, (root) =>
      pageFactDefects(root, declared, [
        "src/founder/outstanding.ts::step",
        "src/founder/outstanding.ts::hidden",
      ]),
    );
    expect(defects).toEqual([
      {
        id: "src/founder/outstanding.ts::step",
        what: "reaches the page through src/founder/outstanding.ts::hidden, which reaches it nowhere",
      },
    ]);
  });

  it("reports a `through` chain pointing at a fact the register does not hold at all", () => {
    const declared: PageFact[] = [
      { id: "src/founder/outstanding.ts::step", shown: { kind: "through", by: "src/founder/outstanding.ts::absent", what: "folded in" } },
    ];
    const defects = withTree(PLANTED_PAGE, (root) =>
      pageFactDefects(root, declared, ["src/founder/outstanding.ts::step"]),
    );
    expect(defects).toEqual([
      {
        id: "src/founder/outstanding.ts::step",
        what: "reaches the page through src/founder/outstanding.ts::absent, which reaches it nowhere",
      },
    ]);
  });
});

describe("W347 the four the page did not say", () => {
  it("derives the outstanding gates with no row behind them", () => {
    const idle = gatesBlockingNothing(ROOT).map((g) => g.id);
    expect(idle).toEqual(["G1", "G2", "G4", "G7"]);
    // Each carries §4's own sentence, so the page quotes rather than paraphrases.
    expect(gatesBlockingNothing(ROOT).every((g) => g.text.length > 20)).toBe(true);
    // And a cleared gate is not idle work waiting — G0 is answered and must not appear.
    expect(idle).not.toContain("G0");
  });

  it("reports a gate as idle the moment nothing names it, and not before", () => {
    const paths = [{ blocker: "G5", kind: "founder_gate" as const, whoDecides: "the founder", releases: ["W161"] }];
    const withoutG5 = gatesBlockingNothing(ROOT, paths).map((g) => g.id);
    expect(withoutG5).toContain("G3");
    expect(withoutG5).not.toContain("G5");
  });

  it("splits the waiting figure, which is the G5 correction read from the page's end", () => {
    const shape = blockedShape(ROOT);
    // The correction: the figure is not all week-units, and the two that are not are the support
    // rows every document before W335 was blind to.
    expect(shape.otherRows).toEqual(["SUP-1", "SUP-2"]);
    expect(shape.weekUnits.length).toBeGreaterThan(10);
    expect(shape.weekUnits.every((id) => /^W\d+$/.test(id))).toBe(true);
  });
});

describe("W347 the register is subject to its own rule", () => {
  it("states what a fully classified page does not prove", () => {
    expect(PAGE_FACT_BOUND.length).toBeGreaterThan(600);
    expect(PAGE_FACT_BOUND).toContain("RENDERED MEANS THE PAGE NAMES THE DERIVATION");
    expect(PAGE_FACT_BOUND).toContain("judgement");
  });
});

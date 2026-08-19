// W369 verify gate: "every derivation that can return an empty set classified as empty-by-design,
// empty-because-fixed or empty-because-broken, each resolved; an empty result nothing distinguishes
// from a dead walk is reported."
//
// THE RESOLUTION IS THE PART WORTH TESTING. A classification is a word somebody typed, and this
// suite is mostly about the quote underneath it: that it is really in the module, that it survives
// a doc comment wrapping, and that a row whose sentence has been edited away fails here rather than
// keeping its label. The planted modules live in `scan-fixtures.fixtures`, because a module that
// walks the tree for `export const … = []` would otherwise find its own test's examples — W295's
// rule, and W307's file.

import { describe, expect, it } from "vitest";
import {
  EMPTY_AT_W369,
  EMPTY_BOUND,
  type DeclaredEmpty,
  emptyPopulationDefects,
  emptyRegisters,
  emptyRegistersIn,
  prose,
} from "./empty-populations";
import { GATE_PINNED_EMPTY } from "./empty-list-sweep";
import { fixtureText } from "./scan-text";
import { withTree } from "./planting";

const ROOT = process.cwd();
const POPULATION = emptyRegisters(ROOT);
const STAFF: DeclaredEmpty["module"] = "src/tenancy/staff.ts";
const only = (id: string, rows: readonly DeclaredEmpty[]) =>
  emptyPopulationDefects(ROOT, rows).filter((d) => d.register === id);

describe("W369 every empty register in the tree, resolved to the sentence its module makes", () => {
  it("passes, over the tree as it stands", () => {
    expect(emptyPopulationDefects(ROOT)).toEqual([]);
  });

  it("derives the population rather than listing it", () => {
    expect(POPULATION.length).toBeGreaterThan(25);
    expect(EMPTY_AT_W369.map((d) => `${d.module}::${d.name}`).sort()).toEqual(
      POPULATION.map((p) => `${p.module}::${p.name}`).sort(),
    );
  });

  it("reads a declaration and not a mention of one", () => {
    const found = emptyRegistersIn("planted.ts", fixtureText("empty-register-module"));
    // Both spellings, because the one this unit's first grep knew about was the narrower.
    expect(found.map((f) => f.name)).toEqual(["PLANTED_EMPTY", "PLANTED_WIDE"]);
    // A register with a member is not empty, and one nobody exports is not a register.
    expect(emptyRegistersIn("planted.ts", fixtureText("empty-register-mention"))).toEqual([]);
  });

  it("finds a register in a file that was not there before, which is the walk and not the scan", () => {
    // W267'S DISTINCTION, and the mutation the census entry names. The fixture arm above proves the
    // reader; this proves that the reader is pointed at files nobody told it about.
    const found = withTree(
      {
        "src/planted/empty.ts": fixtureText("empty-register-module"),
        // THE NEGATIVE, planted beside it: a file whose every empty register is a mention rather
        // than a declaration. A walk that found this one would report most of the tree.
        "src/planted/mention.ts": fixtureText("empty-register-mention"),
      },
      (root) => emptyRegisters(root),
    );
    expect(found).toEqual([
      { module: "src/planted/empty.ts", name: "PLANTED_EMPTY" },
      { module: "src/planted/empty.ts", name: "PLANTED_WIDE" },
    ]);
  });

  it("reports an empty register nothing has said anything about, which is the unit's subject", () => {
    // The same call the green assertion above makes, on a tree nobody has classified: it is the
    // evidence that an empty result there is a finding rather than a reader that never speaks.
    expect(emptyPopulationDefects(ROOT, []).length).toBeGreaterThan(25);
    const undeclared = emptyPopulationDefects(ROOT, []);
    expect(undeclared.length).toBe(POPULATION.length);
    expect(undeclared.every((d) => d.what.startsWith("is empty and nothing in the tree says"))).toBe(true);
  });

  it("reports a register recorded as broken, which is the class the gate names", () => {
    const rows: DeclaredEmpty[] = [
      { module: STAFF, name: "MEHERR_STAFF", emptiness: { kind: "broken", why: "nobody has read this in a year" } },
    ];
    expect(only("src/tenancy/staff.ts::MEHERR_STAFF", rows)).toEqual([
      {
        register: "src/tenancy/staff.ts::MEHERR_STAFF",
        what: "is empty and nothing distinguishes it from a dead one: nobody has read this in a year",
      },
    ]);
  });

  it("reports a quote the module does not make, which is how a resolved row goes stale", () => {
    const rows: DeclaredEmpty[] = [
      { module: STAFF, name: "MEHERR_STAFF", emptiness: { kind: "by_design", quote: "a sentence nobody wrote here" } },
    ];
    expect(only("src/tenancy/staff.ts::MEHERR_STAFF", rows)).toEqual([
      {
        register: "src/tenancy/staff.ts::MEHERR_STAFF",
        what: "quotes an argument its module does not make: a sentence nobody wrote here",
      },
    ]);
  });

  it("reports a row for an empty register the tree no longer has", () => {
    const rows: DeclaredEmpty[] = [
      { module: "src/gone.ts", name: "GONE_REGISTER", emptiness: { kind: "by_design", quote: "anything" } },
    ];
    expect(only("src/gone.ts::GONE_REGISTER", rows)).toEqual([
      { register: "src/gone.ts::GONE_REGISTER", what: "is declared empty and the tree has no such empty register" },
    ]);
  });
});

describe("W369 the quote survives the shape of a doc comment", () => {
  it("takes the continuation markers off, which is what makes a wrapped sentence resolvable", () => {
    expect(prose(" * a sentence that\n * wrapped")).toBe("a sentence that wrapped");
    // Not a blanket strip: a `*` that is not a continuation marker is part of the words.
    expect(prose("two * three")).toBe("two * three");
    // And the reason it is needed: most of these arguments really do wrap.
    const wrapped = EMPTY_AT_W369.filter((d) => d.emptiness.kind !== "broken" && d.emptiness.quote.length > 80);
    expect(wrapped.length, "no quote is long enough to have wrapped, so this buys nothing").toBeGreaterThan(5);
  });

  it("every quote really is in the module it is recorded against", () => {
    const quoted = EMPTY_AT_W369.filter((d) => d.emptiness.kind !== "broken");
    expect(quoted.length, "nothing carries a quote, so the resolution checks nothing").toBeGreaterThan(25);
    for (const d of quoted) {
      const quote = (d.emptiness as { quote: string }).quote;
      expect(quote.length, `${d.name}'s quote is too short to be distinctive`).toBeGreaterThan(25);
    }
    // Resolved against the tree by the register itself, above; here the shape of the rows.
    expect(emptyPopulationDefects(ROOT).filter((x) => x.what.startsWith("quotes"))).toEqual([]);
  });
});

describe("W369 what W293 excuses by name, this resolves to a fact", () => {
  it("resolves every register W293's pattern would wave through", () => {
    const pinned = POPULATION.filter((p) => GATE_PINNED_EMPTY.test(p.name));
    expect(pinned.length, "the pattern matches nothing, so there is no excuse to resolve").toBeGreaterThan(15);
    const byId = new Map(EMPTY_AT_W369.map((d) => [`${d.module}::${d.name}`, d]));
    for (const p of pinned) {
      const row = byId.get(`${p.module}::${p.name}`);
      expect(row?.emptiness.kind, `${p.name} is excused by its name and resolved by nothing`).not.toBe(undefined);
      expect(row!.emptiness.kind, `${p.name} is excused by its name and argued nowhere`).not.toBe("broken");
    }
  });

  it("holds registers the pattern does not match, so the two populations are not the same list", () => {
    const unmatched = POPULATION.filter((p) => !GATE_PINNED_EMPTY.test(p.name));
    expect(unmatched.map((p) => p.name).sort()).toContain("MEHERR_STAFF");
    expect(unmatched.length, "every empty register matches the pattern, so this register adds nothing").toBeGreaterThan(
      4,
    );
  });
});

describe("W369 the register says what it is and what it is not", () => {
  it("holds the two findings this unit fixed, in the modules rather than in a note", () => {
    // Both were empty registers whose modules described what they HELD and never why they were
    // empty — the exact shape a dead mechanism leaves behind. Fixed in the module per W357, and the
    // quotes above are what stops either fix quietly coming undone.
    const moved = EMPTY_AT_W369.find((d) => d.name === "MOVED_SINCE_W313")!;
    expect((moved.emptiness as { quote: string }).quote).toContain("saying nothing about its own emptiness");
    const survivors = EMPTY_AT_W369.find((d) => d.name === "SURVIVORS_AT_W362")!;
    expect(survivors.emptiness.kind).toBe("because_fixed");
    expect((survivors.emptiness as { quote: string }).quote).toContain("W362");
  });

  it("keeps because_fixed rare and broken empty, because a class nobody uses is a class nobody checks", () => {
    expect(EMPTY_AT_W369.filter((d) => d.emptiness.kind === "because_fixed").length).toBeGreaterThan(1);
    expect(EMPTY_AT_W369.filter((d) => d.emptiness.kind === "broken")).toEqual([]);
  });

  it("states what a resolved sentence does not cover", () => {
    expect(EMPTY_BOUND.length).toBeGreaterThan(600);
    expect(EMPTY_BOUND).toContain("IT RESOLVES THE SENTENCE, NOT THE FACT THE SENTENCE ASSERTS");
    expect(EMPTY_BOUND).toContain("AN ARGUED REGISTER CAN STILL BE DEAD");
  });
});

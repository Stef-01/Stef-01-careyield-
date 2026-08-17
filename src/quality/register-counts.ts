// W304: a register's SIZE is not a property, and this stops the tree asserting it.
//
// W290 named the shape at Q23's fourth unit: a pin that ordinary work moves goes red on a planned
// event, somebody edits the number, and the check teaches nobody anything. W298 counted the damage
// over one quarter — fifteen pinned counts moved on ordinary additions, four of them moved by the
// hardening unit itself just by adding one module to two registers, and one bumped three times in
// a single afternoon, twice while a push was mid-rebase.
//
// EVERY ONE OF THOSE WAS THE SAME ASSERTION. `expect(SOME_REGISTER).toHaveLength(N)` — the size of a
// declared register, checked against a literal. It is not a property of anything: the register has
// N entries because N things were declared, and the day a legitimate addition arrives the assertion
// fails for a reason that is not a defect. The edit that follows is indistinguishable from
// maintenance, which is the actual harm — a count that moved because a register was DELETED looks
// exactly like one that moved because a register was added.
//
// AND MOST OF THEM SAT BESIDE THE PROPERTY THEY STOOD IN FOR, which is the finding this unit turned
// up rather than the one it went looking for. `CONSOLE_ZERO_STATES` was pinned at twenty-seven ON
// THE LINE AFTER an identity against W271's route register. `ASSERTS_NOTHING` at three, on the line
// after an identity against the census. `HISTORY` at six, on the line before its six units are
// named. In each case the real check was already written and the count added nothing but a reason
// to edit the file.
//
// THE OTHER SHAPES, EACH REWRITTEN AS WHAT IT MEANT:
//
//   NON-VACUITY GUARDS — a count in front of a `for` loop, there so the loop cannot pass over an
//   empty register. A floor says that and does not move.
//
//   ACCEPTANCE REGISTERS — `ACCEPTED_TAUTOLOGIES`, `ACCEPTED_COMPOSED_FINDINGS`. These take a
//   CEILING rather than a floor, and getting that backwards would have been worse than the count:
//   an acceptance is a rule switched off, so its growth is the regression, and a floor would have
//   let the register fill up quietly.
//
//   CLOSED SETS — `SETUP_STEPS` at five, `ALL_ZERO_STATES` at three, the FHIR status mapping at
//   four. Replaced by the NAMES, which is strictly stronger: the count passed a step renamed, a
//   status remapped, or two changes that cancelled out.
//
// ONE EXACT COUNT SURVIVES AND IT IS NOT A PIN. `dossier-q18.test.ts` asserted six refused
// couplings beside a dossier that publishes the word "six" twice. That is an identity between a
// register and prose, not a size assertion — so the number is DERIVED from the register now and the
// dossier's own words are checked against it, which means adding a refusal fails the prose instead
// of silently disagreeing with it.
//
// WHAT THIS CANNOT SEE: a size asserted against something other than an integer literal — a
// constant, an arithmetic expression, another register's length — and a size asserted through a
// helper this sweep does not recognise as a register. The class of bound W267 states about
// `readdirSync`, with the same remedy when one arrives.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the text of the tree's own test files.

import { readFileSync } from "node:fs";
import path from "node:path";
import { stripComments } from "@/security/reachability";
import { blankLiterals } from "./scan-text";
import { testModules } from "./tree-walks";
import { assertionsIn, enclosingTest } from "./tautology-sweep";

export interface RegisterCount {
  file: string;
  test: string;
  /** The declared register whose size was asserted. */
  register: string;
  text: string;
}

/** `file :: test :: register`. No line number — W290's rule, and this unit's whole subject. */
export function countId(hit: RegisterCount): string {
  return `${hit.file} :: ${hit.test} :: ${hit.register}`;
}

/** Names a file imports. A register is imported; a local is a fixture this unit does not judge. */
function importedNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const m of code.matchAll(/import\s+([^;]*?)\s+from/g)) {
    for (const n of (m[1] ?? "").matchAll(/[A-Za-z_$][\w$]*/g)) names.add(n[0]);
  }
  return names;
}

/**
 * Every assertion pinning a declared register's SIZE to an integer.
 *
 * TWO NARROWINGS, AND BOTH ARE THE UNIT. The subject must be rooted in an imported SCREAMING_CASE
 * constant — a register — rather than a call over a fixture: `expect(outcomesFor(A)).toHaveLength(1)`
 * is a claim about BEHAVIOUR under a constructed scenario and is exactly right, while
 * `expect(CONSOLE_ZERO_STATES).toHaveLength(27)` is a claim about how many things somebody declared.
 * AT W304 the second kind was a small minority of the tree's exact-count size assertions and the
 * rest were the first — a sweep that could not tell them apart would have reported all of them, and
 * been deleted. The proportions are dated on purpose: they are what this unit found, not a property
 * of the tree, and ordinary work moves them.
 */
export function registerSizeAssertions(root: string): RegisterCount[] {
  const out: RegisterCount[] = [];
  for (const file of testModules(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const code = stripComments(readFileSync(file, "utf8"));
    const imported = importedNames(code);
    for (const a of assertionsIn(code)) {
      // A NEGATED size is the REMEDY, not the defect. `expect(REG).not.toHaveLength(0)` is the
      // non-vacuity floor this unit rewrote fifteen counts into; a sweep that reported it would be
      // arguing with its own advice.
      if (a.negated) continue;
      if (!/^\d+$/.test(a.expected)) continue;
      const subject = blankLiterals(a.subject);
      const isSize =
        a.matcher === "toHaveLength" ||
        (/\.(length|size)\s*$/.test(subject) && ["toBe", "toEqual", "toStrictEqual"].includes(a.matcher));
      if (!isSize) continue;
      const names = [...subject.matchAll(/[A-Za-z_$][\w$]*/g)].map((m) => m[0]);
      // No minimum length. The first draft required four characters and would have missed `IDS` —
      // an arbitrary floor on a sweep whose failure mode is missing pins, which is the wrong
      // direction to be arbitrary in.
      const register = names.find((n) => imported.has(n) && /^[A-Z][A-Z0-9_]+$/.test(n));
      if (!register) continue;
      // A call taking an argument is a scenario, not a register read. `Object.keys(REG)` and
      // `new Set(REG…)` are register reads spelled with a call, so they are kept.
      const collapsed = subject.replace(/\(\s*\)/g, "()").replace(/=>/g, "");
      if (/\([^)]*[A-Za-z_$][^)]*\)/.test(collapsed) && !/^(Object\.keys|Object\.values|new Set)/.test(subject.trim())) {
        continue;
      }
      out.push({ file: rel, test: enclosingTest(code, a.index), register, text: a.text });
    }
  }
  return out;
}

/** A register size left asserted on purpose, as a ratchet rather than a pin. */
export interface Ratchet {
  id: string;
  direction: "floor" | "ceiling";
  why: string;
}

/**
 * Sizes still pinned exactly, each argued.
 *
 * EMPTY, and it is meant to stay that way — but the mechanism exists because "no exceptions today"
 * and "no exceptions possible" are different claims, and a register with no way to record one gets
 * bypassed rather than extended. A ceiling on an acceptance register would be the likeliest first
 * entry; the two this unit found were rewritten in place instead, because a ceiling written as an
 * assertion beside the register reads better than a row in a list somewhere else.
 */
export const RATCHETS: readonly Ratchet[] = [];

export interface CountDiff {
  /** A register size pinned to a literal that nothing here argues for. */
  unargued: string[];
  /** A declared ratchet the sweep no longer finds. */
  stale: string[];
}

/** Both directions, W102's shape. Takes the register so both arms can be driven from outside. */
export function countDiff(
  root: string,
  declared: readonly Ratchet[] = RATCHETS,
): CountDiff {
  const found = registerSizeAssertions(root).map(countId);
  const ids = new Set(declared.map((r) => r.id));
  return {
    unargued: found.filter((id) => !ids.has(id)).sort(),
    stale: [...ids].filter((id) => !found.includes(id)).sort(),
  };
}

/** What a green `countDiff` does not prove. */
export const COUNT_BOUND =
  "The sweep reads a size asserted against an INTEGER LITERAL. A register size pinned to a " +
  "constant, to an arithmetic expression or to another register's length is invisible to it, and " +
  "so is a size read through a helper it does not recognise as a register — the class of bound " +
  "W267 states about `readdirSync`, with the same remedy when such a pin arrives. It also says " +
  "nothing about counts in PROSE: several module headers this session stated a number the code " +
  "disagreed with, and no sweep over assertions can read a paragraph.";

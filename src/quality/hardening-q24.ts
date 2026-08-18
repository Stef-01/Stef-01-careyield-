// W311: Q24 hardening — the quarter that measured its own tax, read through three lenses.
//
// Q24 SET ITSELF A NUMBER AS A GATE. W300 measured what one new module costs before anything
// watches it; W301 through W307 spent the quarter trying to bring it down — one citation resolver,
// one text-scan discipline, one planting harness, one declaration point per module, one rule for a
// detector that must not match its own fixtures; W308 re-measured. The answer was that the tax went
// UP, from six to seven, and the quarter recorded that rather than explaining it away.
//
// SO A REVIEW OF Q24 IS A REVIEW OF SEVEN CONSOLIDATIONS, and the question worth asking is not
// whether they work — the suite says they do — but WHAT EACH ONE LEFT BEHIND. Six of the eleven
// findings are of that exact shape: a consolidation that moved something and did not finish
// moving, or that fixed an omission by shipping a smaller one. None is a defect in what the
// quarter built. Every one is in the seam where it stopped.
//
// AND THE QUARTER PUT A QUALITY MODULE ON A REQUEST PATH FOR THE FIRST TIME. Every register this
// tree has ever written has been unreachable from every page — `reachableFromApp` returns nothing
// for all of them, and Q23's security lens checked exactly that. W310's founder page reaches
// `src/founder/outstanding.ts`, which reaches `blocked-surface.ts`. That is the one structural
// change in the quarter with a security consequence, and it is recorded as a decision with a
// review date rather than as a clean result.
//
// SEVEN THOUSAND NINE HUNDRED INSERTIONS ACROSS SEVENTY-EIGHT FILES, and the reader wrote five of
// the eleven units — which `SELF_REVIEWED` names, because a pass that hid the overlap would be
// claiming an independence it does not have.
//
// WHAT THIS DOES NOT PROVE is `HARDENING_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads diffs and registers.

import { parseLedgerRows } from "./blocked-surface";
import type { HardeningFinding } from "./hardening-q22";

/**
 * The quarter, and the EXACT range of diff that was read.
 *
 * `diffHead` is pinned at this unit's claim commit, which is W285's lesson and W298's: a range
 * ending at `HEAD` grows every time another session commits, so the record claims more than was
 * read. Q23's pass had three units land under it while it was written; this one had none, because
 * builder-A had finished W309 before the claim went in.
 */
export const QUARTER = { first: 300, last: 312, diffBase: "752d5aa", diffHead: "2805910" } as const;

/** The units whose diffs were actually read. Listed rather than derived from the range. */
export const REVIEWED_UNITS: readonly string[] = [
  "W300",
  "W301",
  "W302",
  "W303",
  "W304",
  "W305",
  "W306",
  "W307",
  "W308",
  "W309",
  "W310",
];

/** Q24 units this pass did not read, each with the reason. */
export const NOT_REVIEWED: Readonly<Record<string, string>> = {
  W311:
    "This unit. A hardening pass reviewing its own diff would be the register answering its own question — W282's refused exemption, declined the same way at W285 and W298.",
  W312:
    "The quarter close, which has not been written. It falls outside the pinned range by construction rather than by choice, and Q25's hardening reads it.",
};

/**
 * FIVE OF THE ELEVEN WERE WRITTEN BY THE SESSION RUNNING THIS PASS.
 *
 * W301, W303, W304, W305 and W310 are this session's; W300, W302, W306, W307, W308 and W309 are
 * builder-A's. W298 said the thing to distrust about a self-review is not the findings but the
 * ABSENCE of findings on the reviewer's own units — and then missed two defects in its own work,
 * which is the strongest evidence for its own warning that exists.
 *
 * It is not resolved by pretending. Seven of this quarter's eleven findings fall on the reviewer's own
 * units and are recorded by name, including the two most embarrassing: a tautology shipped by W304
 * INTO the unit whose subject was assertions that check nothing, and W310 fixing a silent omission
 * by introducing a smaller one. What a later reader should distrust is the four findings that fall
 * on builder-A's units, only one of which is deferred — since a reviewer is gentlest with work they must
 * not break and harshest with their own.
 */
export const SELF_REVIEWED: Readonly<Record<string, string>> = {
  W301: "Written by the session running this pass.",
  W303: "Written by the session running this pass.",
  W304: "Written by the session running this pass.",
  W305: "Written by the session running this pass.",
  W310: "Written by the session running this pass.",
};

export const FINDINGS: readonly HardeningFinding[] = [
  {
    id: "Q24-CR-1",
    lens: "code-review",
    unit: "W310",
    what:
      "THE FOUNDER'S PAGE TOLD THE FOUNDER THE WRONG THING ABOUT ITS OLDEST QUESTIONS. `waitedFor` took `gate?.proposedAt ?? \"W1\"`, which is right for a standing §4 gate and wrong for a founder DECISION — and the two decisions in the blocked surface are not §4 gates, so both fell to the null branch and rendered as *outstanding since the plan was written*. The consequence is exactly the one the page exists to prevent: `Q17 action 1` was raised at W217 and displayed a wait of 292 units, sorting above three gates that really have waited longer, on a page whose whole purpose is to show which ruling has waited longest. A page that is wrong about its own ordering is worse than no page, because the reader has no way to see it.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "A decision's wait now runs from the last unit BUILT before the earliest row it blocks — the moment the quarter reached that boundary and somebody had to schedule the row blocked. The blocked row itself carries no timestamp, having never been built, which is why the naive fix of reading its own date does not work and is why the derivation goes through the ledger. `Q9 action 1` reads 162 units since W132 and `Q17 action 1` reads 89 since W216; the three standing gates still read W1, which the same test asserts in both directions so a fix that made everything a decision would fail.",
    },
  },
  {
    id: "Q24-CR-2",
    lens: "code-review",
    unit: "W304",
    what:
      "W304 REPLACED A COUNT WITH A TAUTOLOGY, in the unit whose entire subject was assertions that check nothing. `expect(DERMATOLOGY_MEMBERS.map((m) => m.kind).length).toBe(DERMATOLOGY_MEMBERS.length)` is true for every array that has ever existed — `map` preserves length — and the comment above it claimed to check the members BY NAME. So the rewrite was strictly weaker than the `toHaveLength(5)` it replaced: the count would at least have failed if a member were deleted. W288's tautology sweep did not catch it and could not: the two sides are not syntactically identical, and a sweep that resolved `map(f).length` to `.length` would need to know that `map` is length-preserving. That is the finding's real content — the class of tautology this tree can detect is narrower than the class it can write, and the gap is exactly wide enough for a well-intentioned rewrite to fall through.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "The five member kinds are named, which is what the comment said all along, and the names were read out of the fixture rather than guessed — the first attempt invented five plausible ones and the suite rejected all of them, which is the same defect as the finding one level down. `TAUTOLOGY_BOUND` is not amended: W288's sweep still cannot see this shape, and saying so is more useful than widening it to one hard-coded case.",
    },
  },
  {
    id: "Q24-CR-3",
    lens: "code-review",
    unit: "W305",
    what:
      "A DOC COMMENT SAID *SIX REGISTERS, TWENTY-ONE BRANCHES* ABOVE A LIST HOLDING FIFTY-SEVEN BRANCHES ACROSS NINETEEN MODULES. W305 moved `REFUSAL_BRANCHES` into the manifest and left the sentence describing it standing. This is the FOURTH instance of the same class in two quarters — W293's header quoted figures its own broken sweep produced, W296's header described a stride two units after the stride was replaced, W303's header counted four harnesses where there were five — and the third of those was found by this reviewer, in this reviewer's own work, again. W298 built `headerNamesUnknown` to close the cheap half of the class: it resolves backticked SCREAMING_CASE names in module headers against the tree. It does not read counts in prose, and it only reads the header block, not doc comments deeper in the file. Both limits are stated in `HEADER_CITATION_BOUND` and both let this one through.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "Neither sentence states a count now — and there were TWO, which the first pass at this fix did not notice: the doc comment above the register and a line in the module header sixty lines earlier, both stating the same stale pair. It was the re-derivation in this unit's own test that caught the second, not the reading. The rest of both sentences, which describe how the inputs are constructed, is true and kept. The class is NOT closed and this pass does not claim it is — a count in prose remains undetectable by anything in the tree, and the honest remedy learned across four instances is not a wider sweep but the habit W293 and W304 arrived at independently: name the things or state a bound, never a total.",
    },
  },
  {
    id: "Q24-CR-4",
    lens: "code-review",
    unit: "W309",
    what:
      "THE COMPLIANCE RULE COULD NEVER FIRE ON THE HOME PAGE. `demo/path.ts` builds the set of patient-facing page files as `` `app${s.path}/page.tsx` ``, which for the `/` surface produces `app//page.tsx` — a path no walk ever returns. `/` is declared `audience: \"patient\"` in W192's register and is the public surface a patient is most likely to land on, so the one page the rule most needs to cover was the one page it could not match. The rule itself is right and the register is right; the join between them had a hole in it that no test could see, because a rule that matches nothing is silent in exactly the same way as a rule that finds nothing wrong.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "`s.path === \"/\" ? \"\" : s.path`, so the home page joins to `app/page.tsx` and the rule reaches it. The whole suite is green with the rule now covering a surface it never covered, which also says the home page does not name a gate — the thing the rule was written to check and had never actually checked.",
    },
  },
  {
    id: "Q24-CR-5",
    lens: "code-review",
    unit: "W310",
    what:
      "W310 FIXED A SILENT OMISSION BY SHIPPING A SMALLER SILENT OMISSION. Its finding was that the ledger parse matched `^\\| (W\\d+) \\|`, so `SUP-1` and `SUP-2` — blocked rows — were invisible to every register in the tree. Its fix widened the id to `[A-Z][A-Z0-9-]*[0-9]`, requiring a TRAILING DIGIT so the table's own header row would still be rejected. That silently drops `W-MIGRATE`, a done row, and would silently drop any future blocked row whose id does not end in a digit — which is the identical failure mode, one size down, introduced by the fix for it. The trailing digit was not even necessary: `Unit` is not all-caps, so the id group stops at `U` and the header fails to match at the next separator anyway.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "The trailing-digit requirement is gone and the header is still rejected, which the suite confirms by the row counts staying consistent across every register that reads the ledger. Worth keeping in view: the fix and the defect were written in the same hour by the same session, and what caught it was a second reader over the same diff rather than any check.",
    },
  },
  {
    id: "Q24-CR-6",
    lens: "code-review",
    unit: "W310",
    what:
      "`builtSurface` threw rather than rendering an empty state on a tree with no built unit. `weeks.reduce((best, r) => ..., weeks[0]!)` over an empty array returns `undefined`, and `last.id` on the next line throws — so a root whose ledger holds no done week-unit 500s the founder page instead of saying nothing has been built. The non-null assertion is the whole defect: it asserts a property of THIS repository into a function that takes a root precisely so it can be pointed at trees that differ from this one, which is the argument W267 and W289 each spent a unit making.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "The reduce seeds `null` and the caller reads `last?.id ?? \"none\"`. Driven on a planted tree holding a single claimed row, which is the arm no real repository can produce.",
    },
  },
  {
    id: "Q24-SIMP-1",
    lens: "simplify",
    unit: "W305",
    what:
      "TWENTY-SIX OF THIRTY-TWO IMPORT BINDINGS IN `refusal-branches.ts` WERE DEAD, and they were load-bearing for nothing except the module graph. W305 moved `REFUSAL_BRANCHES` into the manifest and left every import the branch drives had used — `boundDiff`, `censusDiff`, `negativeDiff`, `splitDiff`, fourteen statements' worth — so the module still pulled in `blind-spots`, `register-census`, `self-reference`, `citations`, `empty-list-sweep` and eight more, keeping live import cycles alive to satisfy bindings nothing read. `withTree` was imported twice on one line. The cost is not the lines: it is that the cycles W305's own header explains at length were still there after the change that should have removed them, so the next reader inherits a graph that looks necessary and is not.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "Four import statements remain — `node:fs`, `node:path`, `coverageDiff`, and `withTree as withRoot` for W303's re-export — plus the manifest. The cycles through `blind-spots` and `self-reference` are gone rather than tolerated. The suite is green, which is the whole check: a binding that was actually read would have failed to compile.",
    },
  },
  {
    id: "Q24-CR-9",
    lens: "code-review",
    unit: "W308",
    what:
      "W308 RE-INTRODUCED THE PINNED-COUNT CLASS W304 REMOVED, four units after it was removed, and this pass tripped over it while writing its own record. `EDIT_SITES_AT_W308` stores `files` — the number of files somebody had to edit to declare each module — and its test asserted `namingSites(root, module).length` EQUALS that figure. But `namingSites` returns the files that NAME the module, which is a superset of the files that declare it: it grows whenever anything mentions the path. Writing a hardening finding that discusses `self-reference.ts` moved the figure from eight to nine, and the suite went red for a reason that has nothing to do with declaring anything. That is W290's shape exactly — a pin ordinary work moves, whose edit is indistinguishable from maintenance — in the register whose own bound says the number is only good for comparison with itself.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "fixed",
      by: "W311",
      evidence:
        "The assertion is a FLOOR. Declarations are not deleted, so the recorded figure is a genuine lower bound and the frozen record stays frozen — which is the property W308 built it for. What the floor gives up is the ability to notice a declaration site DISAPPEARING, and that is the right trade here: `consolidationDefects` on the line above already checks the module against the manifest in both directions, so a declaration going missing fails there rather than in a count.",
    },
  },
  {
    id: "Q24-CR-7",
    lens: "code-review",
    unit: "W307",
    what:
      "`allFilesUnder` in `self-reference.ts` walks the entire root — `node_modules` included, some sixty-four thousand entries — with `statSync` outside its `try`, and `SELF_REFERENCE_BOUND.stillOpen` calls it. Two consequences, neither triggered today: a broken symlink anywhere under the root throws through a bound predicate rather than being skipped, and any dependency that ships a file matching the fixture extension flips the predicate and reddens the suite for a reason that has nothing to do with this tree. It is the same class as the reachability walks that exclude `node_modules` by convention, applied to a module that did not inherit the convention.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "deferred",
      why:
        "Deferred rather than fixed because the remedy is a decision about `self-reference.ts`'s walk that belongs to whoever owns that unit, and it is builder-A's: the choice between excluding `node_modules` by name (which W168's own note calls a place to hide something) and scoping the walk to the first-party roots the rest of the tree uses. Named with the two consequences separated so the next unit does not have to re-derive which one matters — the symlink is a robustness question and the dependency file is a correctness one. W318 RETARGETED THIS FROM `W312+` TO A UNIT THAT EXISTS: a range is a wish, because no unit is ever the one a range names and nothing can notice it going unanswered. W325 is the quarter close, which is where a finding nobody has picked up gets read again — and this register now fails the moment W325 lands with this still deferred. W325 READ IT AND RETARGETED IT TO W327, WHICH IS THE SECOND RETARGET AND IS ITSELF THE SIGNAL. The finding belongs to Q26's subject rather than to a queue: `allFilesUnder` answers over whatever is under the root AT THE MOMENT IT RUNS, and `node_modules` is not this tree — a dependency shipping one file with the fixture extension flips a bound predicate for a reason that has nothing to do with anything this repository contains. W327 enumerates the checks whose answer depends on the state around them, and this is one, so it is the unit that has to look rather than the next unit that happens to. It is still not fixed here because the choice between excluding `node_modules` by name and scoping to the first-party roots is a design decision W307's author deliberately left open, and a quarter close taking it would be deciding somebody else's unit at the moment they are least able to argue.",
      by: "W327",
    },
  },
  {
    id: "Q24-CR-8",
    lens: "code-review",
    unit: "W310",
    what:
      "The founder page reads `BUILD-STATE.md` and `docs/FIVE-YEAR-PLAN.md` from `process.cwd()` on every request, with no error handling and `force-dynamic` set. Neither file is part of Next's build output, so a deployment shipping only `.next` renders a 500 rather than a degraded page. This is the cost of the property the unit was built for — every figure derived at render time, nothing typed — and the cost is real rather than theoretical the first time this is deployed anywhere.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "accepted",
      why:
        "Accepted for now with a date rather than fixed, because the fix depends on a decision nobody has made: whether this page is a build-time artefact (read the documents at build, ship a static page, lose the always-current property) or a runtime one (ship the documents, keep it). Nothing in this tree deploys yet — there is no deployment target, no build pipeline beyond CI, and G4 gates the first real environment — so choosing now would be choosing without the constraint that decides it. What makes it safe to defer is that the failure is loud and total rather than silent and partial: a missing file is a 500 on one page, not a page rendering a stale status somebody believes.",
      reviewBy: "2027-02-17",
    },
  },
  {
    id: "Q24-SEC-1",
    lens: "security-review",
    unit: "W310",
    what:
      "THE FIRST QUALITY MODULE THIS TREE HAS EVER PUT ON A REQUEST PATH, and the reason this is recorded as a decision rather than as a clean result. Every register written in three years has been unreachable from every page — Q23's security lens ran all eleven of its registers through `reachableFromApp` and got nothing, and that was the finding. Q24 adds nine modules; running the same check, exactly one is reachable: `src/founder/outstanding.ts`, from `/console/founder`, and through it `blocked-surface.ts`. THREE PROPERTIES WERE CHECKED RATHER THAN ASSUMED. First, INPUT: the page takes no parameters, no search params and no body; the two file paths it reads are constants, so there is no traversal surface and nothing user-controlled reaches the filesystem. Second, OUTPUT: everything rendered is a text child of a React element — ledger notes, §4 sentences, decider prose — so it is escaped by construction, and `dangerouslySetInnerHTML` appears nowhere in the tree. Third, SCOPE: the route is session-gated but NOT practice-scoped, which is deliberate and is the part worth a ruling. Any signed-in console user at any practice can read which founder decisions are outstanding, how long each has waited, and which parts of the product are blocked. That is business-internal information about Meherr rather than anything about a practice or a patient — the page holds no tenant state at all, which W271's allowance now enforces rather than intends — and the ledger it renders lives in a repository. It is still a disclosure decision somebody should make on purpose.",
    raisedOn: "2026-08-17",
    disposition: {
      kind: "accepted",
      why:
        "Accepted with a date because the alternative — a role or an allowlist that distinguishes the founder from a practice manager — is a tenancy concept this tree does not have, and inventing one for a single page would put a second authorization model beside W166's membership grant. The narrower reading is that this page belongs behind whatever admin boundary the product eventually grows, and that boundary is a product decision rather than a security fix. What is enforced in the meantime is the part that would actually be dangerous: the route class refuses every module holding practice or patient state, so the page cannot start leaking a tenant even if somebody adds a section to it.",
      reviewBy: "2027-02-17",
    },
  },
];

/** Findings whose disposition says nothing actionable — the shape W292's `undisposed` refuses. */
export function undisposed(findings: readonly HardeningFinding[] = FINDINGS): string[] {
  return findings
    .filter((f) => {
      if (f.disposition.kind === "fixed") return f.disposition.evidence.trim().length < 40;
      if (f.disposition.kind === "accepted") {
        return f.disposition.why.trim().length < 40 || !/^\d{4}-\d{2}-\d{2}$/.test(f.disposition.reviewBy);
      }
      return f.disposition.why.trim().length < 40;
    })
    .map((f) => f.id)
    .sort();
}

/** Q24 units the ledger shows as done that this pass did not read and does not name. */
export function unaccountedUnits(ledger: string): string[] {
  const reviewed = new Set(REVIEWED_UNITS);
  return parseLedgerRows(ledger)
    .filter((row) => {
      const n = Number(row.id.slice(1));
      return n >= QUARTER.first && n <= QUARTER.last && row.status === "done";
    })
    .map((row) => row.id)
    .filter((id) => !reviewed.has(id) && !(id in NOT_REVIEWED))
    .sort();
}

/**
 * What a green run of this register does not prove.
 *
 * Eleven findings from three lenses over a quarter of consolidations, by a reader who wrote five
 * of the eleven units.
 */
export const HARDENING_BOUND =
  "Every lens here read a quarter of CONSOLIDATIONS, and the findings are shaped by that: nearly all " +
  "are seams a move left behind, because a diff review reads what changed and a consolidation is " +
  "mostly change. What that biases against is a defect INSIDE a consolidation that arrived correct " +
  "and stayed correct — nothing here would find a manifest row that quietly describes the wrong " +
  "module, because every row moved and every row reads plausibly. THE LENSES WERE ALSO NOT " +
  "INDEPENDENT REVIEWERS. They were passes by the session that wrote a majority of the quarter's " +
  "units, which " +
  "`SELF_REVIEWED` names; a second reader would be a second session, and no change to any file in " +
  "this tree produces that. The mechanical counterweight is W296's sampler, which changes the code " +
  "and watches, over a sample rather than the whole; the structural counterweight is that a moved " +
  "declaration must still satisfy the register it was moved out of, which is why this quarter's " +
  "moves were provable at all. A green run of this register shows that Q24's claims were read by " +
  "somebody with a stake in them, and nothing more than that.";
  "than that.";

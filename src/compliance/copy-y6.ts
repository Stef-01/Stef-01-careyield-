// W270: the operator-copy surface at the Y6 boundary — and the floor nobody had re-examined.
//
// W200's register decides membership by reading each module's own `// W<n>` header against
// `Y4_FIRST_UNIT`, and that has worked for a year without anybody remembering: every Y5 module was
// compelled into the declared surface as it landed, and so were the nine Y6 modules Q21 has
// written so far. Re-deriving it at the Y6 boundary confirms that half, and the confirmation is
// worth having rather than assuming — W259 argued the mechanism, and this counts it.
//
// WHAT THE RE-DERIVATION FOUND IS THE OTHER HALF: THE FLOOR. `Y4_FIRST_UNIT = 157` is not only a
// starting point for future modules, it is a CEILING ON THE PAST. One hundred and forty-four
// modules sit below it, and a hundred and thirty-eight of them are covered by neither this
// register nor W150's six education files. W200's own finding was that Y4 "added operator-facing
// copy in five other places and none of it was ever linted — not a rule that was weakened, a
// control that did not follow the product". The same sentence applies backwards and nobody had
// said it: **the control was never pointed at Years 1 to 3.**
//
// AND THE OBVIOUS FIX IS THE WRONG ONE, WHICH W200 ALREADY ARGUED. Running the advice rules over
// every string export below the floor produces twenty-four hits, and the great majority are the
// register machinery quoting the words it bans — `LANDING_RULES`, `SCOPE_LABEL_RULES`,
// `MESSAGE_BANNED_RULES`, `RECORD_CLASSES`, `REFERRAL_SCOPING`. That is W198's collision, and W200
// predicted this exact ratio: "running the advice rules over every string export of Y4 flags
// eleven things and eight of them are the register machinery itself". A blanket backward sweep
// would buy an exemption per collision, which is the shape W200 refused. So the floor stays.
//
// WHAT WAS ACTUALLY BROKEN IS THAT THE FLOOR HAD NO DOOR. Membership was *defined* as
// `unit >= Y4_FIRST_UNIT`, so a pre-floor module could not be added to the declared surface even
// deliberately — the register's own both-directions check would reject it as "a module that is not
// one". A control that cannot be extended to where the copy is, is not a floor, it is a wall. So
// membership is now `>= floor` UNION `PRE_FLOOR_COPY_SURFACES`, a list somebody has to add to by
// hand with an argument, one module at a time.
//
// FOUR WENT THROUGH THE DOOR, and reading them is what the sweep was for. Each was flagged, each
// is defensible, and each was defensible for the same reason W200 accepted `SILENCE_COPY`: the
// same words mean different things on different surfaces.
//
//   `src/console/results-copy.ts` (W42) — "Your results" trips `no-diagnosis-or-condition`,
//   because in a patient message that phrase means test results. This is a PRACTICE-facing console
//   page and it means the practice's own performance figures. Genuine operator copy, covered by
//   nothing for four years.
//
//   `src/pathways/approval.ts` (W119) — "specialist reviewer" trips `no-benefit-claims`. It names
//   a role in Meherr's own two-person sign-off, not a scope a clinician claims. Same direction as
//   the acceptance W200 already carries for `REMAINING_CHAIN`.
//
//   `src/registers/escalation.ts` (W73) — "honoured immediately and permanently" trips
//   `no-urgency`. The urgency rule is about pressing a patient toward care; this is a promise about
//   how fast an opt-out takes effect, which is the opposite direction.
//
//   `src/audit/usefulness.ts` (W22) — "action needed", the exact string and the exact argument
//   W200 accepted for `SILENCE_COPY`.
//
// No new violation, then, and that is the honest result: four surfaces nobody had ever looked at,
// all defensible on reading. The finding is not what the copy said. It is that **there was no way
// to look**, and now there is.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads module headers and counts them.

import { readFileSync } from "node:fs";
import path from "node:path";
import { Y4_FIRST_UNIT } from "./cdss-boundary";
import { sourceModules } from "@/quality/tree-walks";

/** The first unit of Y6. Y5 ran W209–W260; Q21 is W261–W273. */
export const Y6_FIRST_UNIT = 261;

/**
 * Where the declared copy surface starts, and it is W200's constant rather than a second one.
 *
 * Named separately because the two roles had been conflated: `Y4_FIRST_UNIT` answers "which year
 * is this module from", and the floor answers "does the copy register have to cover it". They
 * happen to be the same number and they are not the same question — which is why the floor could
 * sit unexamined for three years inside a constant whose name is about something else.
 */
export const COPY_SURFACE_FLOOR = Y4_FIRST_UNIT;

/**
 * Why the floor is where it is, rather than at W1.
 *
 * Required by this unit's test to be an argument rather than a number, because a floor with no
 * stated reason is indistinguishable from a floor nobody chose.
 */
export const FLOOR_RATIONALE =
  "Running the advice rules over every string export below W157 produces twenty-four hits, and the great majority are register machinery quoting the words it bans — the collision W198 named and W200 measured at eight in eleven when it faced the same choice for Y4. A blanket backward sweep buys an exemption per collision and teaches nobody anything, so the floor stays and the door below it is `PRE_FLOOR_COPY_SURFACES`: a module at a time, with the argument for why an operator reads it.";

/**
 * Pre-floor modules deliberately brought into the declared surface.
 *
 * The door W270 added. Membership in `OPERATOR_COPY_SURFACES` is `unit >= COPY_SURFACE_FLOOR`
 * UNION this list, so a Year-1-to-3 surface can be covered without moving the floor and without
 * the register rejecting it as a module that is not one.
 */
export const PRE_FLOOR_COPY_SURFACES: readonly string[] = [
  "src/console/results-copy.ts",
  "src/pathways/approval.ts",
  "src/registers/escalation.ts",
  "src/audit/usefulness.ts",
];

export interface YearBand {
  id: string;
  firstUnit: number;
  lastUnit: number;
}

/** The years, so coverage can be reported per year rather than as one number. */
export const YEAR_BANDS: readonly YearBand[] = [
  { id: "Y1", firstUnit: 1, lastUnit: 52 },
  { id: "Y2", firstUnit: 53, lastUnit: 104 },
  { id: "Y3", firstUnit: 105, lastUnit: 156 },
  { id: "Y4", firstUnit: 157, lastUnit: 208 },
  { id: "Y5", firstUnit: 209, lastUnit: 260 },
  { id: "Y6", firstUnit: Y6_FIRST_UNIT, lastUnit: Number.MAX_SAFE_INTEGER },
];

/** Every non-test module under `root/src`, with the unit its own header claims. */
export function modulesWithUnits(root: string): Array<{ module: string; unit: number | null }> {
  const src = path.join(root, "src");
  // W341: the shared walk. This copy asked the same question `sourceModules` answers and carried
  // no skip list at all, so what it called "the tree" depended on what happened to be lying in it.
  const out = sourceModules(root).map((full) => {
    const header = readFileSync(full, "utf8").split("\n")[0]?.match(/^\/\/ W(\d+)/);
    return {
      module: `src/${path.relative(src, full).split(path.sep).join("/")}`,
      unit: header ? Number(header[1]) : null,
    };
  });
  return out.sort((a, b) => a.module.localeCompare(b.module));
}

/** The modules the copy register must cover: at or above the floor, plus the declared door. */
export function copySurfaceMembers(root: string): string[] {
  const door = new Set(PRE_FLOOR_COPY_SURFACES);
  return modulesWithUnits(root)
    .filter(({ module, unit }) => door.has(module) || (unit !== null && unit >= COPY_SURFACE_FLOOR))
    .map((m) => m.module)
    .sort();
}

export interface BandCoverage {
  band: string;
  modules: number;
  covered: number;
}

/** How much of each year the declared surface reaches. Reported, so the floor stays visible. */
export function coverageByBand(root: string, declared: readonly string[]): BandCoverage[] {
  const declaredSet = new Set(declared);
  return YEAR_BANDS.map((band) => {
    const inBand = modulesWithUnits(root).filter(
      ({ unit }) => unit !== null && unit >= band.firstUnit && unit <= band.lastUnit,
    );
    return {
      band: band.id,
      modules: inBand.length,
      covered: inBand.filter(({ module }) => declaredSet.has(module)).length,
    };
  });
}

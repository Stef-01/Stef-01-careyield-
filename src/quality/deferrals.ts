// W329: a deferral answered where it points.
//
// W318 PUT A CLOCK ON EVERY DISPOSITION AND READ IT IN ONE PLACE. `overdueDispositions` asks whether
// the unit a finding was deferred to has LANDED — and if it has, somebody promised something and
// shipped without it. That arm is right and stays where it is. What it cannot ask is whether the
// unit it names is one that can ever answer.
//
// THREE STANDINGS IT NEVER LOOKED AT, and the tree held two of them while this was written.
//
//   ABSENT. `Q23-CR-2` is disposed `fixed` by `W293, W296 and W298` — three units in prose, in a
//   field typed `string`. W318 made `deferred.by` a `UnitId` so `W299+` would stop compiling; the
//   `fixed` arm kept `string` and nothing ever resolved it. A fix citing a unit the ledger does not
//   have is W258's class exactly: a citation that reads as coverage and resolves to nothing.
//
//   BLOCKED. A finding deferred to a unit that needs a founder ruling is a wish in a new spelling.
//   W318's whole argument was that `W288+` names no unit so nothing can report it unanswered; a
//   deferral to a row that cannot land without G5 is the same sentence with a unit number on it,
//   and it would sit there reporting nothing for as long as the gate stays shut.
//
//   IN FLIGHT. The unit that answers a deferral is being built RIGHT NOW, and nothing says so to
//   the builder. This is not a defect and is not reported as one: it is the moment the deferral was
//   written for, and `inheritedBy` is how a unit finds what is waiting on it before the close rather
//   than from a red suite afterwards. W327 met this from the other side — its builder knew only
//   because they had retargeted the finding themselves one unit earlier.
//
// THE OVERDUE ARM IS NOT REPEATED HERE. W318 owns `deferred` plus `landed` and `accepted` past its
// review date; this classifies the standing and reports the three it does not. Two registers
// reporting one defect is how a fix reads as two, which W322 recorded when PLANT-1's anchor
// asserted the absence of its own condition.
//
// WHAT THIS DOES NOT PROVE is `DEFERRAL_BOUND`, exported below and read by W297's register.
//
// FOUNDER GATE (plan §4): nothing crossed. This reads the ledger and the tree's own findings.

import { parseLedgerRows } from "./blocked-surface";
import type { HardeningFinding } from "./hardening-q22";

/** Where a cited unit stands in the ledger, at the moment this runs. */
export type UnitStanding = "landed" | "in_flight" | "waiting" | "blocked" | "absent";

/**
 * What each standing means for the disposition that cites it.
 *
 * Declared rather than left to the reader, because the whole finding is that four of the five were
 * never distinguished from each other: W318 asked `done` or not, and `not done` was covering a unit
 * being built, a unit nobody has started, a unit no ruling will release, and a unit that is not a
 * unit.
 */
export const STANDINGS: Readonly<Record<UnitStanding, string>> = {
  landed:
    "The ledger says `done`. For a `deferred` finding that is W318's overdue arm and is reported there rather than here. For a `fixed` one it is the ordinary case: the unit that fixed it has shipped.",
  in_flight:
    "The row says `claimed` — the unit that answers this is being built now. NOT A DEFECT, and reporting it as one would fail a builder's tree before they had done the work the deferral is asking for. It is the moment the deferral was written for, which is why `inheritedBy` exists and why nothing here fails on it.",
  waiting:
    "The row exists and is `available`. The deferral is doing its job: it names a unit that can be claimed, and W318's clock will fire the day that row closes with the finding still deferred.",
  blocked:
    "The row exists and cannot be claimed — a founder gate or a founder decision holds it. A deferral aimed here reports nothing for as long as the gate stays shut, which is the defect W318 removed from ranges reappearing with a unit number attached to it.",
  absent:
    "The ledger has no such row. Nothing will ever land under that name, so no clock can ever run out, and the disposition reads as scheduled while being unschedulable. W258's class: a citation that does not resolve.",
};

/** The disposition arms that cite a unit. `accepted` cites a DATE and is not one of them. */
export type CitingArm = Exclude<HardeningFinding["disposition"]["kind"], "accepted">;

/** A disposition's cited unit, resolved against the ledger. */
export interface CitedUnit {
  finding: string;
  /**
   * The arm that cites it.
   *
   * DERIVED FROM `Disposition` RATHER THAN RESTATED, so a fourth arm cannot diverge from it
   * silently — W301's rule about one spelling, applied to a type. It also takes this module out of
   * W330's population, and that is correct rather than convenient: `waitingModules` reads
   * `kind: "deferred"` as a module CONSTRUCTING a wait, and a union in a type annotation is neither
   * a construction nor the comparison its scan excludes. This module reads waits and holds none.
   */
  kind: CitingArm;
  unit: string;
  standing: UnitStanding;
}

/** Every unit a disposition names, with where it stands. */
export function citedUnits(ledger: string, findings: readonly HardeningFinding[]): CitedUnit[] {
  const rows = new Map(parseLedgerRows(ledger).map((r) => [r.id, r.status]));
  const standingOf = (unit: string): UnitStanding => {
    const status = rows.get(unit);
    if (status === undefined) return "absent";
    if (status === "done") return "landed";
    if (status === "claimed" || status === "in-progress") return "in_flight";
    if (status === "blocked") return "blocked";
    return "waiting";
  };
  const out: CitedUnit[] = [];
  for (const finding of findings) {
    const d = finding.disposition;
    if (d.kind === "accepted") continue;
    out.push({ finding: finding.id, kind: d.kind, unit: d.by, standing: standingOf(d.by) });
  }
  return out.sort((a, b) => `${a.finding}${a.unit}`.localeCompare(`${b.finding}${b.unit}`));
}

/**
 * What a unit inherits: the findings deferred to it.
 *
 * THE UNIT'S OWN WORDS, READ AT THE UNIT. A deferral is a promise made to a future builder and
 * nothing delivered it to them — W318's clock tells you afterwards that the promise was broken,
 * which is the wrong end of the same fact.
 */
export function inheritedBy(unit: string, findings: readonly HardeningFinding[]): string[] {
  return findings
    .filter((f) => f.disposition.kind === "deferred" && f.disposition.by === unit)
    .map((f) => f.id)
    .sort();
}

export interface DispositionDefect {
  finding: string;
  what: string;
}

/**
 * The three standings W318 could not see, reported.
 *
 * `landed` is deliberately absent: W318 owns it, and a defect reported twice reads as two.
 */
export function dispositionDefects(
  ledger: string,
  findings: readonly HardeningFinding[],
): DispositionDefect[] {
  const out: DispositionDefect[] = [];
  for (const cited of citedUnits(ledger, findings)) {
    if (cited.standing === "absent") {
      out.push({
        finding: cited.finding,
        what: `is disposed ${cited.kind} by \`${cited.unit}\`, which is not a row in the ledger`,
      });
      continue;
    }
    if (cited.kind === "deferred" && cited.standing === "blocked") {
      out.push({
        finding: cited.finding,
        what: `is deferred to ${cited.unit}, which no builder can claim — it waits on a founder ruling`,
      });
    }
    // W334: `in_flight` is excluded here for the reason this module's own `STANDINGS` gives —
    // *reporting it as one would fail a builder's tree before they had done the work the deferral
    // is asking for*. The sentence was written for the `deferred` arm and the `fixed` arm did not
    // honour it, so the first unit to actually answer a finding deferred to itself was told its
    // fix cited a unit that had not landed. Every such fix is written before its own row closes:
    // the verify gate runs first, which is W315's whole subject. The moment the row DOES close is
    // covered — W326 runs these readers over the closing ledger, so a fix whose unit never lands
    // is caught there rather than being caught here at a moment nobody can be green at.
    if (cited.kind === "fixed" && cited.standing !== "landed" && cited.standing !== "in_flight") {
      out.push({
        finding: cited.finding,
        what: `claims a fix by ${cited.unit}, which the ledger says is ${cited.standing}`,
      });
    }
  }
  return out.sort((a, b) => `${a.finding}${a.what}`.localeCompare(`${b.finding}${b.what}`));
}

/** What a green register does not prove. */
export const DEFERRAL_BOUND =
  "It resolves the unit a disposition NAMES and says where that unit stands. It cannot say whether " +
  "the unit is the right one: a finding about the founder's page deferred to a unit about ledger " +
  "parsing resolves perfectly and will close having answered nothing, and the only reader who can " +
  "tell is somebody who understands both. W310's bound states the same limit about blockers, and " +
  "the reason is the same — a correct citation and a mistaken one are the same text in the same " +
  "field. SECOND, `in_flight` IS SURFACED AND NEVER FAILS, which is a choice with a cost: a builder " +
  "who does not read what their unit inherits gets no signal from here at all, and the alarm comes " +
  "from W318 one commit later at the close. Making it fail would break a tree for work not yet " +
  "done, so what stands between a deferral and a builder who ignores it is `verify:close`, which " +
  "runs W318's arm over the closing ledger. THIRD, IT READS THE REGISTERS IT IS HANDED. A hardening " +
  "pass whose findings never reach `allHardeningFindings` is invisible here, exactly as it is to " +
  "W318, and both inherit that from the same argument list.";

// W281: append-only store for community interest signups.
//
// Machinery, not copy — it holds no rendered string. It is headered for the same reason as the
// other three: the census decides what it must cover by reading headers, so a module without one
// is not "clean", it is INVISIBLE, and an absence of evidence was being read as evidence of
// absence. Signups are real contact details from a public form, which is why the store writes to
// a path outside the repo and no fixture in this tree contains one.
//
// WRITTEN OUTSIDE THE UNIT LOOP, which is why it had no header to move. Its creating commit
// carries no unit number at all — the four modules in this class arrived on 2026-08-09 between
// W51 and W65, from founder-side work rather than from a firing. W281 adopts them: a module the
// loop did not write is still a module the copy census has to see, and for a year it did not.
import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { neutraliseSpreadsheetFormula } from "@/security/untrusted";
import type { InterestReason, InterestSignup } from "./types";

function defaultStorePath(): string {
  const configured = process.env.CAREYIELD_INTEREST_PATH?.trim();
  return configured || path.join(process.cwd(), ".data", "interest-signups.jsonl");
}

/**
 * A read that says which nothing, answering W279-CR-2.
 *
 * `readRows` returned `[]` for a missing file, for a file whose lines will not parse, and for a
 * file with no signups in it — three states an operator would act on differently, rendered
 * identically as *nothing yet*. W279 declined to declare `could_not_load` on the route while the
 * page could not reach it, which was right: a control declared where the page cannot reach it is
 * the paper trail of a control that does not exist. This is the read the declaration was waiting on.
 *
 * A MISSING FILE IS NOT A FAILURE. Nobody has signed up, so the file was never appended to — that
 * is genuinely nothing yet. What is a failure is a file that EXISTS and holds a line this cannot
 * read: a truncated append or an unmounted volume, where the count shown would be lower than the
 * count held and nothing would say so.
 */
export type InterestRead =
  | { kind: "read"; signups: InterestSignup[] }
  | { kind: "unreadable"; signups: InterestSignup[]; dropped: number };

function readRows(filePath: string): InterestRead {
  if (!existsSync(filePath)) return { kind: "read", signups: [] };
  let dropped = 0;
  const signups = readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as InterestSignup];
      } catch {
        dropped += 1;
        return [];
      }
    });
  return dropped > 0 ? { kind: "unreadable", signups, dropped } : { kind: "read", signups };
}

export function saveInterestSignup(
  input: { name: string; email: string; interests: InterestReason[] },
  options: { filePath?: string; now?: Date } = {},
): { created: boolean; signup: InterestSignup } {
  const filePath = options.filePath ?? defaultStorePath();
  const email = input.email.trim().toLowerCase();
  const existing = readRows(filePath).signups.find((signup) => signup.email === email);
  if (existing) return { created: false, signup: existing };

  const createdAt = (options.now ?? new Date()).toISOString();
  const signup: InterestSignup = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    interests: [...new Set(input.interests)],
    consentedAt: createdAt,
    createdAt,
    source: "western-sydney-community-landing",
  };

  mkdirSync(path.dirname(filePath), { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(signup)}\n`, { encoding: "utf8", mode: 0o600 });
  return { created: true, signup };
}

export function listInterestSignups(options: { filePath?: string } = {}): InterestSignup[] {
  return readInterestSignups(options).signups;
}

/**
 * The same read, with what it could not read.
 *
 * Kept beside `listInterestSignups` rather than replacing it: every other caller wants the rows,
 * and a page that has to distinguish an empty file from an unreadable one asks for the result.
 */
export function readInterestSignups(options: { filePath?: string } = {}): InterestRead {
  const result = readRows(options.filePath ?? defaultStorePath());
  const signups = [...result.signups].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return result.kind === "unreadable" ? { ...result, signups } : { kind: "read", signups };
}

/**
 * One CSV cell.
 *
 * W153 finding: quoting alone made this file safe to PARSE and left it unsafe to OPEN. A signup
 * name of `=HYPERLINK("http://evil.invalid","Payroll")` is a valid quoted cell and an executable
 * formula the moment an operator double-clicks the download — the export is served to Meherr
 * staff from `/api/interest/export`, and the text in it was typed by anyone on the internet.
 *
 * Neutralising happens HERE, to every cell, rather than to the fields somebody judged risky. The
 * name is the obvious one today; the next column added would not be, and a guard that covers what
 * was remembered is the failure this tree keeps finding.
 */
function csvCell(value: string): string {
  return `"${neutraliseSpreadsheetFormula(value).replaceAll('"', '""')}"`;
}

export function interestSignupsCsv(options: { filePath?: string } = {}): string {
  const rows = listInterestSignups(options);
  const header = ["created_at", "name", "email", "interests", "source"];
  return [
    header.map(csvCell).join(","),
    ...rows.map((signup) => [
      signup.createdAt,
      signup.name,
      signup.email,
      signup.interests.join(" | "),
      signup.source,
    ].map(csvCell).join(",")),
  ].join("\n");
}

/** Rewrite the whole file. Used only by the erasure/retention paths below. */
function writeAll(rows: readonly InterestSignup[], options: { filePath?: string }): void {
  const filePath = options.filePath ?? defaultStorePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, rows.map((r) => `${JSON.stringify(r)}\n`).join(""), {
    encoding: "utf8",
    mode: 0o600,
  });
}

/**
 * W106: the community interest register under APP 12 and APP 11.
 *
 * This register holds contact details for people who are NOT patients of a subscribing
 * practice, which the Y2 gate dossier flagged as a different collection to everything else in
 * the tree. Different collection, same rights: someone who signed up can ask what is held
 * and can ask for it to be removed, and neither is served by the rail-based flows because
 * this store is file-backed and keyed by email rather than patient id.
 */
export function interestSignupsFor(email: string, options: { filePath?: string } = {}): InterestSignup[] {
  const wanted = email.trim().toLowerCase();
  if (wanted === "") return [];
  return listInterestSignups(options).filter((row) => row.email.trim().toLowerCase() === wanted);
}

/** Remove every signup for an email. Returns how many rows went. */
export function eraseInterestSignups(email: string, options: { filePath?: string } = {}): number {
  const wanted = email.trim().toLowerCase();
  if (wanted === "") return 0;
  const rows = listInterestSignups(options);
  const kept = rows.filter((row) => row.email.trim().toLowerCase() !== wanted);
  if (kept.length === rows.length) return 0;
  writeAll(kept, options);
  return rows.length - kept.length;
}

/**
 * Prune signups older than `retentionDays` (APP 11).
 *
 * Consent to be contacted about a service is not consent to be held indefinitely, and this
 * register has no practice relationship to justify a long tail.
 */
export function pruneInterestSignups(
  retentionDays: number,
  nowIso: string,
  options: { filePath?: string } = {},
): number {
  const rows = listInterestSignups(options);
  const cutoff = new Date(`${nowIso.slice(0, 10)}T00:00:00Z`).getTime() - retentionDays * 86_400_000;
  const kept = rows.filter((row) => {
    const at = Date.parse(row.createdAt);
    // An unreadable date is KEPT, not pruned: deleting a record because its timestamp is
    // malformed would be losing data to a parsing bug.
    return Number.isNaN(at) || at >= cutoff;
  });
  if (kept.length === rows.length) return 0;
  writeAll(kept, options);
  return rows.length - kept.length;
}

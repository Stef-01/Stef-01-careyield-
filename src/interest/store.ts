import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { InterestReason, InterestSignup } from "./types";

function defaultStorePath(): string {
  const configured = process.env.CAREYIELD_INTEREST_PATH?.trim();
  return configured || path.join(process.cwd(), ".data", "interest-signups.jsonl");
}

function readRows(filePath: string): InterestSignup[] {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as InterestSignup];
      } catch {
        return [];
      }
    });
}

export function saveInterestSignup(
  input: { name: string; email: string; interests: InterestReason[] },
  options: { filePath?: string; now?: Date } = {},
): { created: boolean; signup: InterestSignup } {
  const filePath = options.filePath ?? defaultStorePath();
  const email = input.email.trim().toLowerCase();
  const existing = readRows(filePath).find((signup) => signup.email === email);
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
  return readRows(options.filePath ?? defaultStorePath())
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
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

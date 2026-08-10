import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { interestSignupsCsv, listInterestSignups, saveInterestSignup } from "./store";

const dirs: string[] = [];

function tempFile(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "careyield-interest-"));
  dirs.push(dir);
  return path.join(dir, "signups.jsonl");
}

afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("community interest store", () => {
  it("stores a consented signup as retrievable JSONL", () => {
    const filePath = tempFile();
    const result = saveInterestSignup({
      name: "  Asha Rao  ",
      email: " ASHA@example.com ",
      interests: ["I think I might have this"],
    }, { filePath, now: new Date("2026-08-10T00:00:00.000Z") });

    expect(result.created).toBe(true);
    expect(result.signup).toMatchObject({ name: "Asha Rao", email: "asha@example.com" });
    expect(JSON.parse(readFileSync(filePath, "utf8"))).toMatchObject({ consentedAt: "2026-08-10T00:00:00.000Z" });
    expect(listInterestSignups({ filePath })).toHaveLength(1);
  });

  it("does not inflate demand with duplicate emails", () => {
    const filePath = tempFile();
    const input = { name: "Asha Rao", email: "asha@example.com", interests: ["I’m a clinician" as const] };
    expect(saveInterestSignup(input, { filePath }).created).toBe(true);
    expect(saveInterestSignup({ ...input, email: "ASHA@example.com" }, { filePath }).created).toBe(false);
    expect(listInterestSignups({ filePath })).toHaveLength(1);
  });

  it("exports a spreadsheet-ready CSV", () => {
    const filePath = tempFile();
    saveInterestSignup({
      name: "Narayani",
      email: "narayani@example.com",
      interests: ["I think I might have this", "I want to bring a session to my community"],
    }, { filePath, now: new Date("2026-08-10T01:00:00.000Z") });
    const csv = interestSignupsCsv({ filePath });
    expect(csv).toContain('"created_at","name","email","interests","source"');
    expect(csv).toContain("I think I might have this | I want to bring a session to my community");
  });
});

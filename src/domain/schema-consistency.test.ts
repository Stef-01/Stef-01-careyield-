import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DOMAIN_TABLES } from "./types";

// W2 (extended in W18): the TS registry and the FULL migration chain stay consistent.
const dir = path.resolve(__dirname, "../../supabase/migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(dir, f), "utf8"))
  .join("\n");

describe("W2 schema consistency", () => {
  const created = [...sql.matchAll(/create table (\w+)/g)].map((m) => m[1]);

  it("every domain table exists in the migration chain", () => {
    for (const table of DOMAIN_TABLES) expect(created).toContain(table);
  });

  it("the migrations create no tables outside the domain registry", () => {
    for (const table of created) expect(DOMAIN_TABLES).toContain(table);
  });

  it("every table has RLS enabled (default deny)", () => {
    for (const table of DOMAIN_TABLES) {
      expect(sql).toContain(`alter table ${table} enable row level security`);
    }
  });

  it("W18: every domain table carries a membership-scoped RLS policy", () => {
    for (const table of DOMAIN_TABLES) {
      const byMembership = new RegExp(`create policy \\w+ on ${table}\\b`);
      expect(sql, `missing policy for ${table}`).toMatch(byMembership);
    }
  });
});

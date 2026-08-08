import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DOMAIN_TABLES } from "./types";

const sql = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/0001_core.sql"),
  "utf8",
);

describe("W2 schema consistency", () => {
  const created = [...sql.matchAll(/create table (\w+)/g)].map((m) => m[1]);

  it("every domain table exists in the migration", () => {
    for (const table of DOMAIN_TABLES) expect(created).toContain(table);
  });

  it("the migration creates no tables outside the domain registry", () => {
    for (const table of created) expect(DOMAIN_TABLES).toContain(table);
  });

  it("every table has RLS enabled (default deny)", () => {
    for (const table of DOMAIN_TABLES) {
      expect(sql).toContain(`alter table ${table} enable row level security`);
    }
  });
});

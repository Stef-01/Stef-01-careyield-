// W310 verify gate (page half): "a rendered page derived from the ledger and §4 rather than
// written, naming each outstanding gate, the units it releases, and how long it has waited."
//
// The derivation itself is proved in `src/founder/outstanding.test.ts`, against planted documents.
// What only a browser can show is that the derivation reaches the page: a module that computes the
// right answer and a page that renders a hard-coded list look identical from a unit suite. So these
// read the rendered text and require it to agree with what the ledger actually holds.

import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("signed-out access redirects to sign-in", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/console/founder");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test.describe("signed in", () => {
  test.beforeEach(async ({ page, request }) => {
    // The console's own sign-in recipe, copied whole from `verticals.spec.ts`. A shortened version
    // — sign in and go — left the browser on `/console/signin`: the mock console starts empty, so
    // the email belongs to no practice until one is created, and the page under test redirects a
    // signed-out request. The page needs a SESSION and no practice, but getting a session here
    // means walking the flow that issues one.
    await request.post("/api/mock/console");
    await page.goto("/console");
    await page.getByLabel("Work email").fill("manager@demo.practice.example");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByLabel("Practice name").fill("Demo Family Practice");
    await page.getByLabel("Holdout share (%)").fill("10");
    await page.getByRole("button", { name: "Create practice" }).click();
    await page.waitForURL(/\/console$/);
  });

  test("names every gate the ledger is actually blocked on", async ({ page }) => {
    // Read from the ledger here rather than from the module, so the test and the page arrive at
    // the list by different routes. A page rendering a written list fails this the day a row moves.
    const ledger = readFileSync("BUILD-STATE.md", "utf8");
    const blockers = new Set(
      ledger
        .split("\n")
        .filter((l) => / \| blocked \| /.test(l))
        .flatMap((l) => [...l.matchAll(/FOUNDER GATE (G\d+)/g)].map((m) => m[1]!)),
    );
    expect(blockers.size).toBeGreaterThan(2);

    await page.goto("/console/founder");
    await expect(page.getByRole("heading", { name: "What is waiting on you" })).toBeVisible();
    for (const gate of blockers) {
      await expect(page.getByRole("heading", { name: gate, exact: true })).toBeVisible();
    }
  });

  test("shows the units a ruling releases, including the two that are not week-units", async ({ page }) => {
    // W310's finding, rendered: `SUP-1` and `SUP-2` are blocked on G5 and no register had ever
    // seen them, because the ledger parse matched `W<n>` only.
    await page.goto("/console/founder");
    // `.first()` because G5's decider sentence names these two as well — the strictness is real,
    // and matching more than once is the page saying the same thing in both places, not a defect.
    await expect(page.getByText("SUP-1", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("SUP-2", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("W161", { exact: false }).first()).toBeVisible();
    // The rows themselves, not the prose: each release is its own list item.
    const items = page.locator("li", { hasText: /^SUP-[12] / });
    await expect(items).toHaveCount(2);
  });

  test("says how long each ruling has waited, in units built", async ({ page }) => {
    await page.goto("/console/founder");
    await expect(page.getByText(/\d+ units built since W\d+/).first()).toBeVisible();
  });

  test("names who decides and never names a builder", async ({ page }) => {
    await page.goto("/console/founder");
    await expect(page.getByText("Who decides").first()).toBeVisible();
    await expect(page.getByText(/builder-[AB]/)).toHaveCount(0);
  });

  test("makes no clinical claim and shows no practice or patient data", async ({ page }) => {
    await page.goto("/console/founder");
    const body = (await page.locator("main").innerText()).toLowerCase();
    expect(body).toContain("build status");
    // The demo practice this session signed into must not appear: the page is not practice-scoped.
    expect(body).not.toContain("demo family practice");
  });
});

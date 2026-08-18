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

  test("shows every blocked row the ledger holds, reachable from this one page", async ({ page }) => {
    // W319'S GATE, AT THE PAGE. The unit half proves the derivation covers the ledger; only a
    // browser proves the DERIVATION REACHES THE RENDER. The ids are read from the ledger here so
    // the spec and the page arrive at the list by different routes — a page rendering a written
    // list fails this the day a row moves.
    const ledger = readFileSync("BUILD-STATE.md", "utf8");
    const blocked = ledger
      .split("\n")
      .filter((l) => / \| blocked \| /.test(l))
      .map((l) => l.split(" | ")[0]!.slice(2).trim());
    expect(blocked.length).toBeGreaterThan(10);

    await page.goto("/console/founder");
    const body = await page.locator("main").innerText();
    for (const id of blocked) {
      expect(body, `${id} is blocked and the page does not show it`).toContain(id);
    }
    // The two that are not week-units, named because they are the reason the check exists: the
    // ledger parse matched `W<n>` and neither had ever been rendered anywhere.
    expect(blocked).toContain("SUP-1");
    expect(blocked).toContain("SUP-2");
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

  test("W322: a first visit says so, and a marker shows what has moved since", async ({ page }) => {
    // THE THREE STATES, READ OFF THE SCREEN. A unit suite cannot tell a page that renders the
    // right branch from one that renders the same paragraph in every case, because both agree
    // with the module. The first visit is the one that matters: an empty list there tells a reader
    // who has never looked that nothing has changed.
    await page.goto("/console/founder");
    await expect(page.getByTestId("reading-first")).toBeVisible();
    await expect(page.getByTestId("reading-since")).toHaveCount(0);

    // A marker the ledger has: the page names it and lists what landed after it.
    await page.goto("/console/founder?since=W300");
    await expect(page.getByTestId("reading-since")).toContainText("Measured from W300");
    await expect(page.getByTestId("reading-since")).toContainText("W320");
    await expect(page.getByTestId("reading-first")).toHaveCount(0);

    // A marker it does not: refused, rather than measured from nothing and reported as a busy year.
    await page.goto("/console/founder?since=W9999");
    await expect(page.getByTestId("reading-unknown")).toBeVisible();
    await expect(page.getByTestId("reading-since")).toHaveCount(0);
  });

  test("W331: a crafted marker cannot render attacker-supplied text on the founder page", async ({ page }) => {
    // W224'S PROPERTY, WHICH W322 HELD AND NOTHING CHECKED. The setup wizard has carried this
    // assertion since W224 — an unknown error key falls back to the page's own copy rather than
    // echoing the link — and W322 added a second query parameter to the console without one. The
    // page refuses an unknown marker with a CONSTANT sentence, so the string in the link reaches
    // no element; that was true when it was written and only a test keeps it true, because the
    // helpful version of this page ("W9999 is not a unit we know") is one edit away.
    const injected = "Your practice is suspended, call 1800-000-000";
    await page.goto(`/console/founder?since=${encodeURIComponent(injected)}`);
    await expect(page.getByTestId("reading-unknown")).toBeVisible();
    await expect(page.getByTestId("second-reading")).not.toContainText("1800-000-000");
    await expect(page.locator("body")).not.toContainText("1800-000-000");
  });
});

// W60 verify gate (console side): the practice sees its registers, intervals and
// counts, and can switch one off for itself. The per-practice isolation this page
// depends on is unit-tested in src/registers/store.test.ts (the console signs in as
// one practice, so isolation is not observable from the browser).

import { expect, test } from "@playwright/test";

type Page = import("@playwright/test").Page;
type Request = import("@playwright/test").APIRequestContext;

/**
 * Sign in and onboard, then seed the register counts — in that order, because the
 * counts are keyed by practice id and the practice does not exist until onboarding
 * completes. Seeding earlier silently attaches them to nothing.
 */
async function signInOnboardAndSeed(page: Page, request: Request) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill("owner@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);

  await page.goto("/console/onboarding");
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByLabel("Holdout share (%)").fill("10");
  await page.getByRole("button", { name: "Create practice" }).click();
  await page.waitForURL(/\/console$/);

  await request.post("/api/mock/registers");
}

/** Guard against a vacuous pass: every assertion below must run on the real page. */
async function gotoRegisters(page: Page) {
  await page.goto("/console/registers");
  await expect(page).toHaveURL(/\/console\/registers$/);
  await expect(page.getByRole("heading", { name: "Registers" })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  // Resets the console (practice/memberships) and, riding along, the register store.
  await request.post("/api/mock/console");
});

test("signed-out access to the register console redirects to sign-in", async ({ page }) => {
  await page.goto("/console/registers");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("the practice sees its registers, intervals and counts", async ({ page, request }) => {
  await signInOnboardAndSeed(page, request);
  await gotoRegisters(page);

  await expect(page.getByTestId("register-placeholder_register_a")).toBeVisible();
  await expect(page.getByTestId("register-placeholder_register_b")).toBeVisible();

  // Counts seeded for this practice by the mock reset.
  await expect(page.getByTestId("members-placeholder_register_a")).toHaveText("42");
  await expect(page.getByTestId("gaps-placeholder_register_a")).toHaveText("9");

  // Every interval shows its source and when it was last reviewed (the W55 provenance
  // contract, surfaced — W62 builds the full provenance UI on top of this).
  const card = page.getByTestId("register-placeholder_register_a");
  await expect(card).toContainText("every 12 months");
  await expect(card).toContainText("Source:");
  await expect(card).toContainText("reviewed");
});

test("a register can be switched off and back on for this practice", async ({ page, request }) => {
  await signInOnboardAndSeed(page, request);
  await gotoRegisters(page);

  await expect(page.getByTestId("status-placeholder_register_a")).toHaveText("On");

  await page
    .getByTestId("register-placeholder_register_a")
    .getByRole("button", { name: "Turn off for this practice" })
    .click();

  await expect(page.getByTestId("status-placeholder_register_a")).toHaveText("Off");
  // The other register is untouched.
  await expect(page.getByTestId("status-placeholder_register_b")).toHaveText("On");

  // It persisted in the store, not just in the rendered page.
  const after = await (await request.get("/api/mock/registers")).json();
  const disabled = after.forPractice.find(
    (r: { condition: { code: string }; enabled: boolean }) =>
      r.condition.code === "placeholder_register_a",
  );
  expect(disabled.enabled).toBe(false);

  await page
    .getByTestId("register-placeholder_register_a")
    .getByRole("button", { name: "Turn on for this practice" })
    .click();

  await expect(page.getByTestId("status-placeholder_register_a")).toHaveText("On");
});

test("the page makes no clinical claim about any patient", async ({ page, request }) => {
  await signInOnboardAndSeed(page, request);
  await gotoRegisters(page);

  const body = ((await page.textContent("body")) ?? "").toLowerCase();
  // Sanity-check the copy scan is looking at the right page, so this cannot pass
  // vacuously on a redirect.
  expect(body).toContain("example register a");

  // Scheduling language only. The register decides who is offered an appointment,
  // never anything about a patient's care.
  for (const banned of ["needs", "should be seen", "at risk", "overdue for care", "requires"]) {
    expect(body, `register console must not say "${banned}"`).not.toContain(banned);
  }
});

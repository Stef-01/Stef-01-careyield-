// W23 verify gate (page side): the public B2B landing page renders and routes to
// the demo and practice sign-in. Copy compliance is unit-tested in
// src/compliance/landing.test.ts.

import { expect, test } from "@playwright/test";

test("landing page renders the B2B positioning and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /unused appointment capacity into measured continuity/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await expect(page.getByText(/incremental attended appointments per 1,000/i)).toBeVisible();

  // No public content should require auth; it's a marketing page.
  await expect(page).toHaveURL(/\/$/);
});

test("primary CTA goes to the demo; sign-in goes to the console", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Practice sign-in" }).first().click();
  await expect(page).toHaveURL(/\/console\/signin$/);

  await page.goto("/");
  await page.getByRole("link", { name: "See a demo" }).first().click();
  await expect(page).toHaveURL(/\/demo$/);
});

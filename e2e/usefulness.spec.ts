// W15 verify gate: the one-tap usefulness audit — capture, persistence, the
// "worthwhile needs an action" rule, and the auth guard on the page.

import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill("gp@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Land on a signed-in page (no practice yet → onboarding). Must not match the
  // sign-in URL itself, which also contains "/console".
  await page.waitForURL(/\/console(\/onboarding)?$/);
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/usefulness");
});

test("signed-out access to the audit page redirects to sign-in", async ({ page }) => {
  await page.goto("/console/usefulness");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("captures a usefulness audit and persists it", async ({ page, request }) => {
  await signIn(page);
  await page.goto("/console/usefulness");

  const before = await (await request.get("/api/mock/usefulness")).json();
  expect(before.pending).toHaveLength(3);

  // Audit the first pending visit: tap two actions, keep "worthwhile", save.
  const firstCard = page.locator("form").filter({ has: page.getByRole("button", { name: "Save" }) }).first();
  await firstCard.getByText("Medication reviewed").click();
  await firstCard.getByText("Preventive care").click();
  await firstCard.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(/Saved\./)).toBeVisible();
  await expect(page.getByText("Audited so far:")).toBeVisible();

  const after = await (await request.get("/api/mock/usefulness")).json();
  expect(after.pending).toHaveLength(2);
  expect(after.outcomes).toHaveLength(1);
  expect(after.outcomes[0].usefulness.sort()).toEqual(["medication_reviewed", "preventive_care"]);
  expect(after.outcomes[0].clinicianJudgedReasonable).toBe(true);
  expect(after.tally.audited).toBe(1);
  expect(after.tally.reasonablePct).toBe(100);
});

test("marking a visit worthwhile with no action is refused", async ({ page, request }) => {
  await signIn(page);
  await page.goto("/console/usefulness");

  // Submit with "worthwhile" checked (the default) but no action tapped.
  const firstCard = page.locator("form").filter({ has: page.getByRole("button", { name: "Save" }) }).first();
  await firstCard.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(/record at least one thing that happened/)).toBeVisible();
  const after = await (await request.get("/api/mock/usefulness")).json();
  expect(after.outcomes).toHaveLength(0);
});

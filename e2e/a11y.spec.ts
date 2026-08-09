// W49 verify gate (automated half): axe-core WCAG 2.1 A/AA scans over every console
// surface and the patient-facing booking states. Zero violations is the bar — a
// finding is fixed or explicitly ruled, never ignored. The manual half lives in
// docs/A11Y-W49.md.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

interface MockState {
  invitations: Array<{ id: string; status: string; token: string }>;
}

async function expectNoViolations(page: Page, label: string) {
  // Assert the title before scanning. axe's document-title rule takes a single
  // instantaneous reading, so a server action's revalidation swap — the confirm-booking
  // one in particular — can be caught mid-flight and reported as a missing <title> on a
  // page that has one pinned (W49 follow-up). This is the same requirement with a
  // retry, so a genuinely title-less page still fails, and fails more legibly.
  await expect(page, `${label} must have a document title`).toHaveTitle(/.+/);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
  );
  expect(summary, `${label} must have no WCAG A/AA violations`).toEqual([]);
}

test.beforeEach(async ({ page, request }) => {
  await request.post("/api/mock/state");
  await request.post("/api/mock/console");
  await page.goto("/console");
  await page.getByLabel("Work email").fill("manager@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByLabel("Holdout share (%)").fill("10");
  await page.getByRole("button", { name: "Create practice" }).click();
  await page.waitForURL(/\/console$/);
});

test("console surfaces pass WCAG A/AA", async ({ page }) => {
  test.setTimeout(120_000);
  const surfaces = [
    "/console",
    "/console/rules",
    "/console/dashboard",
    "/console/results",
    "/console/usefulness",
    "/console/ops",
    "/console/roi",
    "/console/privacy",
    "/console/complaints",
    "/console/registers", // W60
    "/console/setup/practice",
  ];
  for (const path of surfaces) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoViolations(page, path);
  }
});

test("sign-in and onboarding pass WCAG A/AA", async ({ page }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/console\/signin$/);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveTitle(/Sign in/);
  await expectNoViolations(page, "/console/signin");
});

test("patient booking states pass WCAG A/AA", async ({ page, request }) => {
  const seeded = (await (await request.get("/api/mock/state")).json()) as MockState;
  const token = seeded.invitations[0]!.token;

  await page.goto(`/book/${token}`);
  await expectNoViolations(page, "booking offer page");

  await page.getByRole("button", { name: "Confirm booking" }).click();
  await page.getByRole("heading", { name: "Your appointment is booked" }).waitFor();
  await expectNoViolations(page, "booking confirmation page");

  await page.goto("/book/not-a-token");
  await expectNoViolations(page, "invalid-link page");
});

test("public pages pass WCAG A/AA", async ({ page }) => {
  for (const path of ["/", "/privacy", "/privacy/automated-decisions", "/demo"]) {
    await page.goto(path);
    await expectNoViolations(page, path);
  }
});

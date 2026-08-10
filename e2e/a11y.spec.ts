// W49 verify gate (automated half): axe-core WCAG 2.1 A/AA scans over every console
// surface and the patient-facing booking states. Zero violations is the bar — a
// finding is fixed or explicitly ruled, never ignored. The manual half lives in
// docs/A11Y-W49.md.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Scan the settled page, not a frame of its entrance animation. The care finder's
// `.screen` fades opacity 0→1 over 260ms; caught mid-fade, axe measures the composited
// colour (e.g. --muted #6e706a reads as #73756f, 4.46:1) and reports a contrast
// violation against tokens that pass at rest (4.7:1 and 5.1:1). That made the suite
// pass in isolation and fail under load — a measurement artefact, not a defect.
// prefers-reduced-motion is the app's own escape hatch (globals.css collapses every
// animation to 0.01ms), so this scans a state the product actually ships, and it is
// the state a reduced-motion user sees. It does not relax the zero-violation bar.

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
  await page.emulateMedia({ reducedMotion: "reduce" });
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
  // W113: seed and link, so the credentials page is scanned POPULATED. The unlinked refusal
  // renders one paragraph and no form — scanning that instead would pass while leaving the
  // list, the status chips and the withdraw forms untested.
  await request.post("/api/mock/credentials?linkEmail=manager@demo.practice.example");
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
    "/console/capability", // W83
    "/console/interest",
    "/console/case-mix", // W81
    "/console/outreach", // W95 — landed after the W101 sweep was claimed
    "/console/credentials", // W113
    "/console/setup/practice",
  ];
  for (const path of surfaces) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoViolations(page, path);
  }
});

test("sign-in and onboarding pass WCAG A/AA", async ({ page, request }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/console\/signin$/);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveTitle(/Sign in/);
  await expectNoViolations(page, "/console/signin");

  // W101: this test has been named "and onboarding" since W49 while only ever scanning
  // sign-in. Onboarding is the first authenticated form a practice ever meets, so it is
  // scanned properly now — reaching it needs a signed-in session with NO practice yet.
  await request.post("/api/mock/console");
  await page.goto("/console");
  await page.getByLabel("Work email").fill("manager@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console\/onboarding$/);
  await page.waitForLoadState("networkidle");
  await expectNoViolations(page, "/console/onboarding");
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
  // The public root is the community program; the synthetic finder lives separately.
  // Every public surface remains on the same zero-violation rule.
  for (const path of ["/", "/finder", "/practices", "/clinicians", "/privacy", "/privacy/automated-decisions", "/demo"]) {
    await page.goto(path);
    await expectNoViolations(page, path);
  }
});

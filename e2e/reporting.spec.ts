// W199 verify gate (e2e half): "the report states its own coverage and denominator." The golden
// document is unit-tested in src/reporting/report.test.ts; the axe scan is in a11y.spec.ts.
//
// What e2e adds that the unit tests cannot: the page a practice actually opens is the artefact
// the caveats have to survive on. A module can carry a coverage statement and a page can render
// three numbers without it.

import { expect, test, type Page } from "@playwright/test";

async function signInAsMember(page: Page) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill("manager@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByLabel("Holdout share (%)").fill("10");
  await page.getByRole("button", { name: "Create practice" }).click();
  await page.waitForURL(/\/console$/);
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/console");
});

test("signed-out access redirects to sign-in", async ({ page }) => {
  await page.goto("/console/reporting");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("every figure on the page carries its denominator and its period", async ({ page, request }) => {
  await signInAsMember(page);
  // Seeded ABOVE the floor on purpose. The default rail has three referrals, so every figure is
  // suppressed and the denominator rendering — the thing W196 and W199 both exist for — would
  // never be exercised. A test that only ever sees the withheld path is not testing the page.
  const seeded = await request.post("/api/mock/referrals?reportable=1");
  // Derived from the fixture's own response rather than hardcoded: an earlier draft asserted the
  // number of referrals the knob ADDS, not the number on the rail, and the seed already carried
  // two. A test that recomputes the fixture's arithmetic gets it wrong the day the seed changes.
  const written = ((await seeded.json()) as { sent: unknown[] }).sent.length;
  await page.goto("/console/reporting");

  // W196's whole argument, on the surface a reader actually sees: the bare count is an impression.
  const figures = page.getByTestId("figures");
  await expect(figures).toContainText(`Referrals written: ${written}`);
  await expect(figures).toContainText(`Counted over ${written} recorded fact(s)`);
  await expect(figures).toContainText("2026-04-01 to 2026-06-30");
  await expect(page.getByTestId("coverage-reported")).toContainText("Referrals written");
});

test("the coverage section names what is absent and why, not only what is present", async ({
  page,
  request,
}) => {
  await signInAsMember(page);
  await request.post("/api/mock/referrals?cancelled=1");
  await page.goto("/console/reporting");

  // The three silences, distinguished. A reader who cannot tell absence-of-measurement from
  // absence-of-activity assumes the second, because it needs no explanation.
  const absent = page.getByTestId("coverage-absent");
  await expect(absent).toContainText("the record held nothing to count");
  await expect(absent).toContainText("not because they are withheld");
  await expect(absent).toContainText("not because the answer is zero");
});

test("a withheld figure appears as a named withholding, never as a gap", async ({
  page,
  request,
}) => {
  await signInAsMember(page);
  await request.post("/api/mock/referrals?cancelled=1");
  await page.goto("/console/reporting");

  // The seeded rail has 3 referrals written and 1 with a recorded completion, so the completion
  // figure is below the floor of 5 and is withheld — and the page has to say so rather than
  // rendering an empty row. W145: named, not omitted.
  const withheld = page.getByTestId("withheld-referrals_with_recorded_completion");
  await expect(withheld).toBeVisible();
  await expect(withheld).toContainText("withheld");
  await expect(withheld).toContainText("it is not missing");
  await expect(page.getByTestId("suppression-statement")).toContainText("not a zero");
});

test("the page says nothing has been sent, and offers no control that would", async ({
  page,
  request,
}) => {
  await signInAsMember(page);
  await request.post("/api/mock/referrals?cancelled=1");
  await page.goto("/console/reporting");

  await expect(page.getByTestId("no-disclosure")).toContainText("does not disclose");

  // G9 is unratified, so the absence has to be real and not merely unadvertised. No control on
  // this page may offer to send, share, submit or export the figures anywhere.
  const controls = page.getByRole("button");
  const count = await controls.count();
  for (let i = 0; i < count; i++) {
    await expect(controls.nth(i)).not.toHaveText(/send|share|submit|publish|disclose/i);
  }
  await expect(page.getByRole("link", { name: /send|share|submit|publish|disclose/i })).toHaveCount(0);
});

test("the document on the page carries the caveats, so a copied figure keeps them", async ({
  page,
  request,
}) => {
  await signInAsMember(page);
  await request.post("/api/mock/referrals?cancelled=1");
  await page.goto("/console/reporting");

  const document = page.getByTestId("document");
  await expect(document).toContainText("# Reporting summary");
  await expect(document).toContainText("It is not a measure of care");
  await expect(document).toContainText("## Coverage");
  await expect(document).toContainText("Nothing here has been sent to anybody");
});

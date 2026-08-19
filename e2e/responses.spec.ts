// W220 verify gate (e2e half): "the response graph as a practice reads it — e2e + axe; no
// clinical claim; the empty state distinguishes nothing happened from nothing recorded."
//
// The view-model tests decide WHICH silence a reader is shown; these check that all four survive
// onto the page as four distinguishable things. That is the part a unit test cannot see: a
// correct view-model rendered into one table with a footnote is the failure this unit exists to
// prevent, and it would pass every assertion in the unit file.

import { expect, test, type Page } from "@playwright/test";
import { expectPremise } from "./premise";

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

// W358: THE PREMISE THIS FILE WALKS ON, ASSERTED THROUGH A DIFFERENT DOOR THAN THE ONE THAT WROTE
// IT. Every test below drives the setup above and then reads a console it believes exists. A
// wizard step that silently does not save leaves the whole file walking a practice that is not
// there — and passing, because an empty console for a missing practice renders like an empty
// console for a new one. `waitForURL` proves the browser arrived; this proves the data landed.
test("the setup establishes the state this spec walks on", async ({ page, request }) => {
  await signInAsMember(page);
  await expectPremise(request, { named: "Demo Family Practice", member: "manager@demo.practice.example" });
});

test("signed-out access redirects to sign-in", async ({ page }) => {
  await page.goto("/console/responses");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("the answered counts are on the page with the period they cover", async ({ page }) => {
  await signInAsMember(page);
  await page.goto("/console/responses");

  const offered = page.getByTestId("responses-kind-invitation_offered");
  await expect(offered).toBeVisible();
  // W205's rule reaching a second surface: a count under a heading nobody checks is a count
  // under a period nobody checks. The window is stated where the numbers are.
  await expect(page.getByText("Covering 2026-01-01 to 2026-12-31")).toBeVisible();
  await expect(offered).toContainText("recorded in this period");
});

test("nothing-recorded and never-performed read as different facts, not as two zeros", async ({
  page,
}) => {
  // The unit's headline. The synthetic loop offers invitations and does nothing else, so the
  // page shows one populated kind and three the product never attempted — and a reader must not
  // come away with four failures.
  await signInAsMember(page);
  await page.goto("/console/responses");

  const neverPerformed = page.getByTestId("responses-never-performed");
  await expect(neverPerformed).toBeVisible();
  await expect(neverPerformed).toContainText("not a rate of zero");
  await expect(neverPerformed).toContainText("reminder offered");
  await expect(neverPerformed).toContainText("referral sent");

  // And the other silence, on the kind that WAS performed. Asserted as the CONTRACT rather than
  // as a fixture, because the first version of this test assumed the run would leave some offer
  // unanswered and it does not — every one of the 2,952 offers has something recorded against
  // it. That failure was the useful one: the page had no positive branch, so a reader could not
  // tell "everything was answered" from "this page does not track that" (W205's rule).
  const offered = page.getByTestId("responses-kind-invitation_offered");
  if ((await offered.getByText("nothing recorded against it").count()) > 0) {
    await expect(page.getByTestId("nothing-recorded-note")).toContainText(
      "statement about the record",
    );
    await expect(page.getByTestId("all-recorded-note")).toHaveCount(0);
  } else {
    await expect(page.getByTestId("all-recorded-note")).toContainText(
      "something recorded against it",
    );
    await expect(page.getByTestId("nothing-recorded-note")).toHaveCount(0);
  }
});

test("a withheld count renders as withheld, never as a number or a blank", async ({ page }) => {
  await signInAsMember(page);
  await page.goto("/console/responses");

  // Whether any cell is small depends on the run, so this asserts the CONTRACT rather than a
  // fixture: if the page says anything is withheld it explains why, and if it says nothing is
  // withheld there is no stray "withheld" text either. Both directions, because a note without
  // withheld cells is as wrong as withheld cells without a note.
  const note = page.getByTestId("responses-withheld");
  const withheldCells = page.getByRole("cell", { name: "withheld", exact: true });
  const cellCount = await withheldCells.count();
  if (cellCount > 0) {
    await expect(note).toBeVisible();
    await expect(note).toContainText("was measured");
    await expect(note).toContainText("worked out by subtraction");
  } else {
    await expect(note).toHaveCount(0);
  }
});

test("the page offers no way to send anything, and says so", async ({ page }) => {
  // G9 is unratified. W199's posture: the absence is stated, because an absence nobody points at
  // reads as a feature somebody forgot. Every control on the page is checked, not just the copy.
  await signInAsMember(page);
  await page.goto("/console/responses");

  await expect(page.getByTestId("responses-not-sent")).toContainText(
    "has been sent to anybody",
  );
  const buttons = page.getByRole("button");
  for (let i = 0; i < (await buttons.count()); i += 1) {
    const label = ((await buttons.nth(i).textContent()) ?? "").toLowerCase();
    expect(label, "a control on this page offers to send").not.toMatch(
      /send|share|export|submit|email|publish|download/,
    );
  }
  await expect(page.getByRole("link", { name: /send|share|export|publish/i })).toHaveCount(0);
});

test("the tables are readable without sight: captions, row headers, no bare grid", async ({
  page,
}) => {
  // The axe scan in a11y.spec.ts catches violations; this catches the thing axe passes and a
  // screen-reader user still cannot use — a table of numbers whose rows are not labelled.
  await signInAsMember(page);
  await page.goto("/console/responses");

  const table = page.getByTestId("responses-kind-invitation_offered").locator("table");
  await expect(table.locator("caption")).toHaveText(/What was recorded after/);
  await expect(table.locator('tbody th[scope="row"]').first()).toBeVisible();
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(2);
});

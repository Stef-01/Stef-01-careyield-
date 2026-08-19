// W246 verify gate (e2e half): "shows what was exchanged and, more importantly, what was not."
//
// The view-model tests decide which branch a practice gets. These check the distinction survives
// onto a page — which a view-model test cannot see, because a correct view-model rendered into a
// row of zeros passes every assertion in `console.test.ts` and loses the whole unit.
//
// THE STATE THIS PAGE ACTUALLY SHIPS IN IS THE EMPTY ONE, and that is the state under test.
// Nothing in this tree can produce a disclosure — G9 is unratified, every credential slot is
// blocked, `SHIPPED_DISCLOSURES` is empty — so the page a practice opens is the one that has to
// say, without a zero anywhere on it, that nothing was ATTEMPTED. A page of noughts would read as
// "we tried and nothing came of it", which is the reassuring reading and the false one.

import { expect, test, type Page } from "@playwright/test";
import { expectPremise } from "./premise";

async function signIn(page: Page, email = "manager@demo.practice.example") {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
}

async function createPractice(page: Page, name: string) {
  await page.goto("/console/onboarding");
  await page.getByLabel("Practice name").fill(name);
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
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await expectPremise(request, { named: "Demo Family Practice", member: "manager@demo.practice.example" });
});

test("signed-out access redirects to sign-in", async ({ page }) => {
  await page.goto("/console/interop");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("the empty page says nothing was ATTEMPTED, and shows no zero", async ({ page }) => {
  // THE unit, on the page it actually ships as. A reader must not be able to come away thinking
  // this practice tried to send things and they came to nothing.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/interop");

  const empty = page.getByTestId("interop-nothing-attempted");
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("nothing has been attempted");
  await expect(empty).toContainText("not the same as having tried");
  await expect(empty).toContainText("no connection to any other system");

  // No table and no counts — the two shapes a zero would arrive in.
  await expect(page.getByTestId("interop-table")).toHaveCount(0);
  await expect(page.getByTestId("interop-counts")).toHaveCount(0);

  // And no digit-zero rendered as a figure anywhere in the main region.
  const main = page.locator("main");
  const text = ((await main.textContent()) ?? "").trim();
  expect(text, "a zero reached the page that has never attempted anything").not.toMatch(/\b0\b/);
});

test("the blockers are listed, and a double-blocked path shows BOTH gates", async ({ page }) => {
  // Derived from W242's register rather than written into the page, so this stops being true the
  // day a gate is ratified rather than going on saying what somebody remembered. Both gates,
  // because a list holding only the first would show the path opening when the other was ratified.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/interop");

  const blocked = page.getByTestId("interop-blocked");
  await expect(blocked).toBeVisible();
  await expect(blocked).toContainText("G1");
  await expect(blocked).toContainText("G1 and G10");
  await expect(blocked).toContainText("G1 and G9");
  expect(await blocked.locator("li").count()).toBeGreaterThan(3);
});

test("the page states what it cannot tell you, where the rows would be", async ({ page }) => {
  // The bound, on the page rather than in a comment. This list is built from what LEFT, so a
  // message that never left leaves no row — and a reader who believes it is complete reads no
  // rows as no problems.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/interop");

  const bound = page.getByTestId("interop-cannot-show");
  await expect(bound).toBeVisible();
  await expect(bound).toContainText("An empty list means nothing left; it does not mean nothing failed.");
  await expect(bound).toContainText("not that anybody has read it");
  await expect(bound).toContainText("holds no patient identity");
});

test("no control anywhere: nothing to send, nothing to retry", async ({ page }) => {
  // A retry button here would be the most dangerous control in this product: one click on an
  // unanswered row may put a second copy of a clinical document into another practice's records.
  // The verdict is shown so a person can act; there is nothing to press.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/interop");

  await expect(page.getByTestId("interop-no-retry")).toContainText("nothing here to press");
  await expect(page.getByTestId("interop-no-retry")).toContainText("second copy");

  const buttons = page.locator("main").getByRole("button");
  for (let i = 0; i < (await buttons.count()); i += 1) {
    const label = ((await buttons.nth(i).textContent()) ?? "").toLowerCase();
    expect(label, "a control on this page offers to act").not.toMatch(
      /send|retry|resend|deliver|submit|export|share|publish/,
    );
  }
  await expect(page.locator("main form")).toHaveCount(0);
});

test("the page makes no delivery claim and reports no rate", async ({ page }) => {
  // "Left, nothing came back" is not a delivery and not a failure, and a success rate over these
  // rows would be a rate over the survivors of a filter the page cannot see.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/interop");

  await expect(page.getByTestId("interop-not-delivered")).toContainText("not a delivery");
  await expect(page.getByTestId("interop-not-delivered")).toContainText("not a failure");

  const body = ((await page.locator("main").textContent()) ?? "").toLowerCase();
  expect(body, "the page claims a delivery").not.toMatch(
    /\bdelivered\b|\bsuccess rate\b|\bfailure rate\b|\b\d+% delivered\b/,
  );
});

test("a second practice sees the same page, and never another practice's rows", async ({
  page,
}) => {
  // Practice-scoped as the QUERY. Today both practices reach the empty branch, which is the point
  // worth pinning: the empty state is not a fallback for a missing practice, it is the answer.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await createPractice(page, "Second Site Practice");
  await page.goto("/console");
  await page
    .getByRole("combobox", { name: "Practice" })
    .selectOption({ label: "Second Site Practice" });
  await page.getByRole("button", { name: "Switch" }).click();
  await page.waitForLoadState("networkidle");
  await page.goto("/console/interop");

  await expect(page.getByText("Practice prac-2")).toBeVisible();
  await expect(page.getByTestId("interop-nothing-attempted")).toBeVisible();
  await expect(page.locator("main")).not.toContainText("prac-1");
});

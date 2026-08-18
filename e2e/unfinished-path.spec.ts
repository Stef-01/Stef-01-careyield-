// W334 verify gate: "one spec walking a practice whose setup is incomplete, every unfinished step
// named where an operator would look for it, and no founder gate crossed."
//
// THE THIRD SCENARIO, AND THE QUIETEST. W309's walk is a practice that goes all the way; W321's is
// one that declines at every offer. This one neither completes nor refuses: it starts setting up,
// stops, and goes looking at the console — which is the state every practice is in on day one and
// the one the product said least about. Every screen worked. Every screen was empty. Not one of
// them said the reason was three unfinished fields in a wizard.

import { expect, test } from "@playwright/test";
import { UNFINISHED_PATH } from "../src/demo/path";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
}

/** Step one only: the practice exists, and nothing after it has been done. */
async function startButDoNotFinish(page: import("@playwright/test").Page) {
  await page.goto("/console/setup/practice");
  await page.getByLabel("Practice name").fill("Half Finished Practice");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/clinicians$/);
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/console");
});

test("every unfinished step is named where an operator would look for it", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await startButDoNotFinish(page);

  for (const step of UNFINISHED_PATH) {
    await page.goto(step.route);
    const notice = page.getByTestId("setup-gaps");
    await expect(notice, `${step.route} says nothing about the unfinished setup`).toBeVisible();
    // Not merely present: it has to name THIS page's unmet step, or it is a banner that says
    // "something is unfinished" and sends the reader back to look for it themselves.
    await expect(
      page.getByTestId(`setup-gap-${step.unmet}`),
      `${step.route} does not name ${step.unmet}, whose absence is what empties it`,
    ).toBeVisible();
  }
});

test("the notice names the consequence and where to finish, not just the field", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await startButDoNotFinish(page);
  await page.goto("/console/capacity");

  const sessions = page.getByTestId("setup-gap-sessions");
  await expect(sessions).toContainText("Session settings are unfinished");
  // W179's rule: a zero has to say WHICH nothing. The consequence is the half that does that.
  await expect(sessions).toContainText("Capacity is worked out from");
  await expect(sessions.getByRole("link", { name: "Finish this step" })).toHaveAttribute(
    "href",
    "/console/setup/sessions",
  );
});

test("the notice goes when the step is done, so it is a state and not a decoration", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await startButDoNotFinish(page);
  await page.goto("/console/outreach");
  await expect(page.getByTestId("setup-gap-clinicians")).toBeVisible();

  // Finish exactly one step and watch exactly one line go.
  await page.goto("/console/setup/clinicians");
  await page.getByLabel("Clinician 1").fill("Dr Amara Lee");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/sessions$/);

  await page.goto("/console/outreach");
  await expect(page.getByTestId("setup-gap-clinicians")).toHaveCount(0);
  // And the notice stays, because two steps are still unfinished: one line went, not the panel.
  await expect(page.getByTestId("setup-gaps"), "the whole notice went when one step was done").toBeVisible();
  await expect(page.getByTestId("setup-gap-sessions")).toBeVisible();
});

test("the wizard itself does not tell a practice mid-setup that its setup is unfinished", async ({ page }) => {
  // The reason the notice is rendered by the pages that ask for it rather than by the shell.
  await signIn(page, "owner@demo.practice.example");
  await startButDoNotFinish(page);
  await page.goto("/console/setup/sessions");
  await expect(page.getByTestId("setup-gaps")).toHaveCount(0);
});

test("the walk leaves the setup open, and completes nothing on the practice's behalf", async ({ page, request }) => {
  // W331/CR-4'S LESSON, AND I MADE ITS MISTAKE TWICE WRITING THIS. The first draft counted
  // `[data-testid="feed-row"]` on `/console/ops` and passed — because no such testid exists
  // anywhere in the tree, exactly as `send-row` does not exist on the page W321 counted it on.
  // The second draft asserted the ops screen showed SILENCE, which is not true either: the seeded
  // practice has offers whatever its setup says, so the locator found nothing again. An absence
  // asserted against a locator that cannot match is not an assertion, and two goes at avoiding
  // that produced two more of them. So this asserts a field the product WRITES, and then makes the
  // walk write it, because a null that nothing ever sets is a null that proves nothing.
  await signIn(page, "owner@demo.practice.example");
  await startButDoNotFinish(page);
  const state = await (await request.get("/api/mock/console")).json();
  expect(state.practices[0].setupCompletedAt, "the walk finished a setup it was meant to leave open").toBeNull();
  // Non-vacuous, and this is the half that makes the null above mean something: the SAME endpoint
  // reports a completed setup once the wizard is finished, so a null here is a state that was
  // observed rather than a field nothing ever writes.
  await page.goto("/console/setup/clinicians");
  await page.getByLabel("Clinician 1").fill("Dr Amara Lee");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/sessions$/);
  await page.getByLabel("Protected capacity (%)").fill("20");
  await page.getByLabel("Offer slots from (hour)").fill("9");
  await page.getByLabel("Offer slots until (hour)").fill("17");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/rules$/);
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/review$/);
  await page.getByRole("button", { name: "Finish setup" }).click();
  const after = await (await request.get("/api/mock/console")).json();
  expect(after.practices[0].setupCompletedAt, "the field never moves, so the null proved nothing").not.toBeNull();
});

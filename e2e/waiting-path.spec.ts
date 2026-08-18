// W346 verify gate: "one spec walking a practice whose setup is complete and whose first cycle has
// not run, every waiting state named where an operator would look, and no founder gate crossed."
//
// THE FOURTH SCENARIO, AND THE ONE WHERE THE PRODUCT IS ENTIRELY CORRECT. W309's walk goes all the
// way; W321's declines at every offer; W334's never finishes setting up. This one finishes the
// wizard and stops — which is where every practice is on the morning after — and until this unit
// the console said the same thing to them as to a practice that had been running a fortnight and
// found nobody. Every screen worked. Every screen was empty. Not one of them said the first cycle
// had not run.
//
// WHAT ONLY A BROWSER CAN SHOW is that the exclusion holds in the rendered page. `waiting.test.ts`
// proves the pair over all sixty-four combinations of readiness and emptiness; what it cannot prove
// is that the page passes its own emptiness honestly, or that the two components are wired to the
// same readiness. So each page below is read twice — once for the notice that must be there and
// once for the notice that must not.

import { expect, test } from "@playwright/test";
import { WAITING_PATH, WAITING_ELSEWHERE } from "../src/demo/path";
import { WAITING_COPY } from "../src/console/waiting";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
}

/** The whole wizard, and nothing after it — which is the state this walk is about. */
async function finishSetupAndStop(page: import("@playwright/test").Page) {
  await page.goto("/console/setup/practice");
  await page.getByLabel("Practice name").fill("Day Two Practice");
  await page.getByLabel("Holdout share (%)").fill("10");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/clinicians$/);

  await page.getByLabel("Clinician 1").fill("Dr Amara Lee");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/sessions$/);

  await page.getByLabel("Protected capacity (%)").fill("20");
  await page.getByLabel("Offer slots from (hour)").fill("9");
  await page.getByLabel("Offer slots until (hour)").fill("17");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/rules$/);

  await page.getByLabel("Minimum days since last visit").fill("240");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/review$/);

  await page.getByRole("button", { name: "Finish setup" }).click();
  await page.waitForURL(/\/console$/);
}

// THE WALK IS ABOUT AN EMPTY RECORD, SO THE RECORD HAS TO BE EMPTY. Resetting the console alone
// passed when this spec ran on its own and failed inside the full suite: `referrals.spec.ts` and
// `education.spec.ts` write into stores the console reset does not touch, and a walk about a
// practice's first morning was reading another spec's afternoon. That is W327's class arriving in
// an e2e run — a check that answers about the instant it happens to execute at — and the fix is to
// name every store this walk's premise depends on rather than to rely on file order.
test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/console");
  await request.post("/api/mock/referrals");
});

test("setup really is complete, so the walk is about the state it says it is", async ({ page, request }) => {
  await signIn(page, "owner@demo.practice.example");
  await finishSetupAndStop(page);
  const state = await (await request.get("/api/mock/console")).json();
  expect(state.practices[0].setupCompletedAt, "the walk did not finish setup").not.toBeNull();
});

test("every waiting page names what has not run, in the operator's words", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await finishSetupAndStop(page);

  for (const step of WAITING_PATH) {
    await page.goto(step.route);
    const notice = page.getByTestId("waiting");
    await expect(notice, `${step.route} says nothing about the first cycle`).toBeVisible();
    // Not merely present: it has to name THIS page's cycle, or it is a banner saying something
    // general on four routes — which is the failure W334 had to fix in its own walk.
    await expect(notice).toHaveAttribute("data-cycle", step.cycle);
    await expect(page.getByTestId(`waiting-${step.cycle}`)).toContainText(
      WAITING_COPY[step.cycle].headline,
    );
  }
});

test("no waiting page also tells a finished practice to go and finish setting up", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await finishSetupAndStop(page);

  for (const step of WAITING_PATH) {
    await page.goto(step.route);
    await expect(
      page.getByTestId("setup-gaps"),
      `${step.route} shows both notices to a finished practice`,
    ).toHaveCount(0);
  }
});

test("the notice goes when the setup is not finished, so it is a state and not a decoration", async ({ page }) => {
  // The other side of the exclusion, read from the browser: a practice that stops after step one
  // gets W334's notice and not this one, on the same routes.
  await signIn(page, "owner@demo.practice.example");
  await page.goto("/console/setup/practice");
  await page.getByLabel("Practice name").fill("Half Finished Practice");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/clinicians$/);

  for (const step of WAITING_PATH) {
    await page.goto(step.route);
    await expect(
      page.getByTestId("waiting"),
      `${step.route} tells an unfinished practice to wait for a cycle`,
    ).toHaveCount(0);
  }

  // AND W334'S NOTICE DOES NOT APPEAR ON THESE TWO EITHER, which is correct rather than a hole.
  // The referral rail does not depend on a roster, a session config or an eligibility rule, so
  // sending somebody from it to a wizard would be the nag W334 refused. What that leaves is a page
  // that says nothing to an unfinished practice — exactly what it said before this unit, and the
  // reason `waitingFor` gates on `complete`: *setup is finished and nothing is wrong* is a sentence
  // that has to be true before it is shown. The page W334 does cover still speaks.
  await page.goto("/console/dashboard");
  await expect(page.getByTestId("setup-gaps"), "W334's notice stopped speaking").toBeVisible();
});

test("the pages excused from the notice really do name the wait themselves", async ({ page, request }) => {
  await signIn(page, "owner@demo.practice.example");
  await finishSetupAndStop(page);
  // AFTER the practice exists, and only here. `POST /api/mock/education` reads
  // `console.practices[0]` — it throws on a console that has just been reset and no page has
  // created a practice on yet — so it belongs beside the assertion that needs it rather than in
  // `beforeEach`. `?empty=1` returns before the route seeds a library, which is the state this row
  // is about.
  await request.post("/api/mock/education?empty=1");

  for (const row of WAITING_ELSEWHERE) {
    await page.goto(row.route);
    await expect(
      page.getByTestId(row.marker),
      `${row.route} is excused because it names the wait itself, and it does not`,
    ).toBeVisible();
  }
});

test("the walk crosses no founder gate: nothing is sent and no real patient appears", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await finishSetupAndStop(page);

  for (const step of WAITING_PATH) {
    await page.goto(step.route);
    const body = (await page.locator("body").innerText()).toLowerCase();
    // The notice explains a wait; it must never claim anything was sent, nor make a clinical claim.
    for (const forbidden of ["message sent", "sms sent", "diagnos", "we recommend"]) {
      expect(body, `${step.route} says "${forbidden}" on a practice that has run nothing`).not.toContain(
        forbidden,
      );
    }
  }
});

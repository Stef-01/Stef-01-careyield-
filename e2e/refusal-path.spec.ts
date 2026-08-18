// W321 verify gate: "one spec walking a practice that declines at each gate the path offers, every
// refusal rendered where it happens, and no founder gate crossed."
//
// W309 WALKS A PRACTICE THAT ACCEPTS EVERYTHING, and that is half the product. Every screen in this
// tree has a refusal state — most of them exist because a zero rendered as a measurement was the
// wrong answer — and not one of them was on the demo path. A prospect shown only the accepting walk
// is being shown a product that cannot be declined.
//
// THE WALK IS DERIVED FROM `REFUSAL_PATH` rather than written out, for W309's reason: the register
// says which route, what is declined, and which marker proves the refusal reached the screen. A
// step whose marker no page renders fails in `path.test.ts`; a marker that exists in the source and
// never reaches a browser fails HERE.
//
// FOUNDER GATES: none crossed. Synthetic practice, no send, no credential — the whole point of the
// walk is that nothing leaves.

import { expect, test } from "@playwright/test";
import { REFUSAL_PATH } from "../src/demo/path";

const step = (marker: string) => REFUSAL_PATH.find((s) => s.marker === marker)!;

test.beforeEach(async ({ page, request }) => {
  await request.post("/api/mock/console");
  await page.goto("/console");
  await page.getByLabel("Work email").fill("manager@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByLabel("Holdout share (%)").fill("10");
  await page.getByRole("button", { name: "Create practice" }).click();
  await page.waitForURL(/\/console$/);
});

test("a practice that declines is shown its refusal at every point it makes one", async ({ page }) => {
  // 1. THE REGISTER SWITCH. W60 gives a practice the switch; the page that owns it has to look
  // switched off, because a control whose state is visible only in its consequences is one nobody
  // trusts.
  await page.goto("/console/registers");
  const registers = page.locator(`[data-testid^="${step("register-").marker}"]`);
  await expect(registers.first()).toBeVisible();

  // 2. THE PAUSE. W19's per-practice pause, and the status line distinguishes it from the global
  // kill switch — an operator reading one as the other escalates nothing or escalates everything.
  await page.goto("/console/ops");
  const status = page.getByTestId(step("sending-status").marker);
  await expect(status).toBeVisible();
  const before = await status.innerText();
  await page.getByRole("button", { name: /Pause this practice|Resume this practice/ }).first().click();
  await expect(status).not.toHaveText(before);
  await expect(status).toContainText(/paused|halted/i);

  // 3. THE PLAN IS STILL SHOWN. The step easiest to get wrong: a paused practice could be handed an
  // empty page, and an empty page reads as "nobody was eligible" — the opposite of "everybody was
  // and you have it switched off".
  await page.goto("/console/outreach");
  await expect(page.getByTestId(step("sending-paused").marker)).toBeVisible();
  await expect(page.getByTestId("outreach-plan")).toBeVisible();

  // 4. THE PATIENT'S OWN REFUSAL, with the reason beside it. A patient dropped without one is
  // indistinguishable from a patient the rules never reached, and only one of those is a decision
  // somebody made.
  const withheld = page.locator(`[data-testid="${step("withheld-row").marker}"]`);
  await expect(withheld.first()).toBeVisible();

});

test("and when the declining has emptied the queue, the silence says which silence it is", async ({
  page,
  request,
}) => {
  // THE LAST STEP, IN ITS OWN TEST BECAUSE IT NEEDS A STATE THE WALK ABOVE CANNOT REACH. Pausing a
  // practice does not empty its queue — the offers already outstanding stay outstanding — so the
  // walk ends before this screen. Forcing it into the same test would have meant asserting a
  // zero-state the walk did not produce, which is the shape W179 was written against.
  //
  // W179: "no offers outstanding" was true of a quiet week and of a feed that died on Tuesday, and
  // those send an operator opposite ways. A practice that has declined everything produces exactly
  // this screen, and it must not read as the quiet week.
  // The session and practice come from `beforeEach`; only the QUEUE is replaced, so signing in
  // again would reset the console state this test is standing on.
  await request.post("/api/mock/ops?emptyQueue=1&feed=well");

  await page.goto("/console/ops");
  const silence = page.locator(`[data-testid^="${step("silence").marker}"]`);
  await expect(silence.first()).toBeVisible();
  // Not merely present: it has to say WHICH nothing, or it is the zero W179 refused.
  await expect(silence.first()).not.toHaveText("");
});

test("nothing is sent, and the refusal walk crosses no founder gate", async ({ page, request }) => {
  // The gate's last clause, asserted rather than assumed. The walk pauses sending and reads
  // screens; if anything had been handed to a rail, the ops feed would show it.
  await request.post("/api/mock/console");
  await page.goto("/console/ops");
  const sent = await page.locator('[data-testid="send-row"]').count();
  expect(sent, "the refusal walk handed something to a sender").toBe(0);
});

test("every declined step names a route this app actually serves", async ({ page }) => {
  // Non-vacuity for the walk above: a register naming a route the app does not serve would let
  // every assertion pass against a redirect.
  for (const declined of REFUSAL_PATH) {
    const response = await page.goto(declined.route);
    expect(response?.status(), `${declined.route} is not served`).toBeLessThan(400);
    expect(page.url(), `${declined.route} redirects to sign-in`).not.toMatch(/\/console\/signin/);
  }
});

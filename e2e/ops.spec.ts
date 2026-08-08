// W19 verify gate: admin ops console — invitation queue visibility, kill-switch,
// per-practice pause, and the auth guard.

import { expect, test } from "@playwright/test";

async function signInAndOnboard(page: import("@playwright/test").Page) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill("owner@demo.practice.example");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
  // Onboard so the signed-in user becomes owner (pause_sending grant).
  await page.goto("/console/onboarding");
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByLabel("Holdout share (%)").fill("10");
  await page.getByRole("button", { name: "Create practice" }).click();
  await page.waitForURL(/\/console$/);
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/ops"); // resets ops + booking rail
  await request.post("/api/mock/console"); // resets console (practice/memberships)
});

test("signed-out access to ops redirects to sign-in", async ({ page }) => {
  await page.goto("/console/ops");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("ops shows the invitation queue and toggles the kill-switch and pause", async ({ page, request }) => {
  await signInAndOnboard(page);
  await page.goto("/console/ops");

  // Queue visible from the booking-rail seed (three sent offers).
  await expect(page.getByRole("heading", { name: "Invitation queue" })).toBeVisible();
  await expect(page.getByText("Outstanding offers (3)")).toBeVisible();
  await expect(page.getByTestId("sending-status")).toHaveText(/Sending is active/);

  // Engage the kill switch.
  await page.getByRole("button", { name: "Engage kill switch" }).click();
  await expect(page.getByTestId("sending-status")).toHaveText(/kill switch engaged/);
  let state = await (await request.get("/api/mock/ops")).json();
  expect(state.switches.killSwitch).toBe(true);

  // Release it.
  await page.getByRole("button", { name: "Release kill switch" }).click();
  await expect(page.getByTestId("sending-status")).toHaveText(/Sending is active/);

  // Pause this practice.
  await page.getByRole("button", { name: "Pause this practice" }).click();
  await expect(page.getByTestId("sending-status")).toHaveText(/paused for this practice/);
  state = await (await request.get("/api/mock/ops")).json();
  expect(state.switches.pausedPracticeIds.length).toBe(1);

  // Resume.
  await page.getByRole("button", { name: "Resume this practice" }).click();
  await expect(page.getByTestId("sending-status")).toHaveText(/Sending is active/);
});

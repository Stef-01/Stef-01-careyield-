import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/console");
});

test("REPRO: clinicians step validation error - are typed values lost?", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await page.goto("/console/setup/practice");
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/clinicians$/);

  // Fill all six names; row 3 (index 2) gets the offending single char.
  const names = ["Dr Amara Lee", "Dr Ben Cho", "X", "Dr Dana Ruiz", "Dr Eli Novak", "Dr Fay Ito"];
  for (let i = 0; i < 6; i++) {
    await page.getByLabel(`Clinician ${i + 1}`).fill(names[i]!);
  }
  // Tick every participation box so we can see whether ticks survive.
  const boxes = page.locator('input[name="participating"]');
  for (let i = 0; i < 6; i++) {
    const b = boxes.nth(i);
    if (!(await b.isChecked())) await b.check();
  }

  const beforeVals = await page.locator('input[name="clinicianName"]').evaluateAll(
    (els) => els.map((e) => (e as HTMLInputElement).value),
  );
  const beforeChecks = await boxes.evaluateAll((els) =>
    els.map((e) => (e as HTMLInputElement).checked),
  );
  console.log("BEFORE submit values:", JSON.stringify(beforeVals));
  console.log("BEFORE submit checks:", JSON.stringify(beforeChecks));

  await page.getByRole("button", { name: "Save and continue" }).click();

  // Wait for the error banner to appear (proves the save was refused).
  await expect(page.getByTestId("setup-error")).toBeVisible();
  console.log("URL after submit:", page.url());
  console.log("ERROR TEXT:", await page.getByTestId("setup-error").textContent());

  const afterVals = await page.locator('input[name="clinicianName"]').evaluateAll(
    (els) => els.map((e) => (e as HTMLInputElement).value),
  );
  const afterChecks = await page.locator('input[name="participating"]').evaluateAll((els) =>
    els.map((e) => (e as HTMLInputElement).checked),
  );
  console.log("AFTER submit values:", JSON.stringify(afterVals));
  console.log("AFTER submit checks:", JSON.stringify(afterChecks));
});

test("REPRO: sessions step inverted window - are ticks/values lost?", async ({ page }) => {
  await signIn(page, "owner@demo.practice.example");
  await page.goto("/console/setup/practice");
  await page.getByLabel("Practice name").fill("Demo Family Practice");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/clinicians$/);
  await page.getByLabel("Clinician 1").fill("Dr Amara Lee");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/console\/setup\/sessions$/);

  await page.getByLabel("Protected capacity (%)").fill("42");
  await page.getByLabel("Offer slots from (hour)").fill("17");
  await page.getByLabel("Offer slots until (hour)").fill("9");

  const beforeTypes = await page.locator('input[name="fillableTypes"]').evaluateAll((els) =>
    els.map((e) => (e as HTMLInputElement).checked),
  );
  const beforeCap = await page.getByLabel("Protected capacity (%)").inputValue();
  console.log("BEFORE types:", JSON.stringify(beforeTypes), "cap:", beforeCap);

  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByTestId("setup-error")).toBeVisible();

  const afterTypes = await page.locator('input[name="fillableTypes"]').evaluateAll((els) =>
    els.map((e) => (e as HTMLInputElement).checked),
  );
  const afterCap = await page.getByLabel("Protected capacity (%)").inputValue();
  const afterStart = await page.getByLabel("Offer slots from (hour)").inputValue();
  const afterEnd = await page.getByLabel("Offer slots until (hour)").inputValue();
  console.log("AFTER types:", JSON.stringify(afterTypes), "cap:", afterCap, "start:", afterStart, "end:", afterEnd);
});

// W229 verify gate (e2e half): "empty states distinguish no data from no capacity."
//
// The unit tests decide WHICH reading a session gets. These check the distinction survives onto a
// page — which is the part a view-model test cannot see, because a correct view-model rendered
// into one column of dashes passes every assertion in `console.test.ts` and loses the whole unit.
//
// TWO PRACTICES, BECAUSE THE PAGE-LEVEL EMPTY STATE NEEDS ONE WITHOUT A DIARY. The synthetic run
// belongs to the first practice this console creates, so a second practice reaches the same page
// with nothing recorded — and that is the exact reader this unit is about: somebody looking at a
// blank capacity page, who must not come away thinking the diary is full.

import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email = "manager@demo.practice.example") {
  await page.goto("/console/signin");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/console(\/onboarding)?$/);
}

// Via `/console/onboarding` rather than `/console`, because the onboarding form only renders
// when there is no practice yet — W166's route, and the only way to reach a SECOND one.
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

test("signed-out access redirects to sign-in", async ({ page }) => {
  await page.goto("/console/capacity");
  await expect(page).toHaveURL(/\/console\/signin$/);
});

test("a full session and an unreadable one never render as the same cell", async ({ page }) => {
  // THE unit, on the page. Over the synthetic diary both readings occur, so this asserts the
  // populated case as a contract in both directions: whatever the run produces, a cell that says
  // "none" must carry the full-session sentence and a cell that says "not recorded" must carry a
  // refusal — and the two sentences must not be interchangeable.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/capacity");

  await expect(page.getByTestId("capacity-table")).toBeVisible();

  const noneSpare = page.getByTestId("figure-none-spare");
  const cannotSay = page.getByTestId("figure-cannot-say");
  const noneCount = await noneSpare.count();
  const unknownCount = await cannotSay.count();

  // Vacuity guard: if the run stopped producing full sessions this test would pass over nothing.
  expect(noneCount, "the synthetic diary no longer contains a session that filled every slot")
    .toBeGreaterThan(0);

  const fullRow = page.locator("tr", { has: page.getByTestId("figure-none-spare") }).first();
  await expect(fullRow).toContainText("none were still open at the end of any recorded week");
  await expect(fullRow).toContainText("says nothing about anybody who was not offered one");
  // A full session is a FINDING. It must not claim ignorance — that is the merge this unit exists
  // to prevent, and it is the direction a reader gets wrong first.
  await expect(fullRow).not.toContainText("cannot answer");
  await expect(fullRow).not.toContainText("absence of a diary");

  if (unknownCount > 0) {
    const unknownRow = page.locator("tr", { has: page.getByTestId("figure-cannot-say") }).first();
    await expect(unknownRow).toContainText("cannot answer for this session");
    await expect(unknownRow).not.toContainText("none were still open");
  }
});

test("there is no dash: every cell in the figures column says something", async ({ page }) => {
  // W197's rule reaching a surface. A blank or an em dash is the shape both emptinesses collapse
  // into, and a reader assumes the reading that needs no explanation.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/capacity");

  const cells = page.locator('[data-testid="capacity-table"] tbody tr td:nth-child(3)');
  const count = await cells.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const text = ((await cells.nth(i).textContent()) ?? "").trim();
    expect(text, `row ${i} renders an empty figure`).not.toEqual("");
    expect(text, `row ${i} renders a dash`).not.toMatch(/^[-–—\s]+$/);
  }
});

test("all three counts are shown, including the zeros", async ({ page }) => {
  // W228's rule: a page that speaks only when it has something to flag teaches a reader that
  // silence means agreement. The counts are also the fastest way to tell the two emptinesses
  // apart, before a single row is read.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/capacity");

  const counts = page.getByTestId("capacity-counts");
  await expect(counts).toContainText("slots left over");
  await expect(counts).toContainText("filled every slot offered");
  await expect(counts).toContainText("cannot answer for yet");
  await expect(page.getByTestId("capacity-counts-note")).toContainText("silence means agreement");
});

test("a practice with no diary is told so, and not told its diary is full", async ({ page }) => {
  // The page-level emptiness, on a second practice. The synthetic run belongs to the first, so
  // this one reaches the same page with nothing recorded — the reader this unit is about.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await createPractice(page, "Second Site Practice");
  await page.goto("/console");
  await page.getByRole("combobox", { name: "Practice" }).selectOption({ label: "Second Site Practice" });
  await page.getByRole("button", { name: "Switch" }).click();
  // `waitForURL` is useless here — the switch is a server action that leaves the URL alone, so it
  // resolves instantly and the navigation below races the revalidation.
  await page.waitForLoadState("networkidle");
  await page.goto("/console/capacity");
  await expect(page.getByText("Practice prac-2")).toBeVisible();

  const empty = page.getByTestId("capacity-no-diary");
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("absence of a diary");
  await expect(empty).toContainText("nothing left in it");
  await expect(empty).toContainText("What would settle it");
  // And it is not the other emptiness wearing this box.
  await expect(empty).not.toContainText("filled every slot");
  await expect(page.getByTestId("capacity-table")).toHaveCount(0);
  await expect(page.getByTestId("capacity-counts")).toHaveCount(0);
});

test("the page makes no demand claim and offers no control", async ({ page }) => {
  // W226's `no-demand-claim` on the surface where it is most tempting: a page full of sessions
  // that filled every slot is exactly where somebody writes "demand exceeds capacity". And the
  // absences are stated, because an absence nobody points at reads as a feature somebody forgot.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/capacity");

  await expect(page.getByTestId("capacity-not-demand")).toContainText("turned people away");
  await expect(page.getByTestId("capacity-your-diary")).toContainText("your decision");
  // W234 rewrote this sentence. W232 established that the old wording — "not connected to how
  // many invitations go out" — was reassuring and wrong: the batch is sized from the diary, so
  // acting on this page raises how many people are messaged. The page must now keep the
  // distinction between what the SOFTWARE does and what the PRACTICE does, so the e2e asserts
  // both halves rather than the comfortable half.
  const notWired = page.getByTestId("capacity-not-wired");
  await expect(notWired).toContainText("Meherr does not act on these figures");
  await expect(notWired).toContainText("more people are messaged");
  await expect(notWired).not.toContainText("not connected to how many");

  const body = ((await page.locator("main").textContent()) ?? "").toLowerCase();
  expect(body, "the page makes a claim about demand").not.toMatch(
    /\b(unmet )?demand\b|\bbacklog\b|\bwaiting list\b|\bunder-?utili[sz]ed\b/,
  );

  const buttons = page.locator("main").getByRole("button");
  for (let i = 0; i < (await buttons.count()); i += 1) {
    const label = ((await buttons.nth(i).textContent()) ?? "").toLowerCase();
    expect(label, "a control on this page offers to act").not.toMatch(
      /send|invite|open|share|export|submit|email|publish/,
    );
  }
});

test("the table is readable without sight: caption, row headers, no bare grid", async ({
  page,
}) => {
  // The thing axe passes and a screen-reader user still cannot use — a grid of numbers whose
  // rows are not labelled.
  await signIn(page);
  await createPractice(page, "Demo Family Practice");
  await page.goto("/console/capacity");

  const table = page.getByTestId("capacity-table");
  await expect(table.locator("caption")).toHaveText(/Slots left open at the end of the week/);
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(3);
  await expect(table.locator('tbody th[scope="row"]').first()).toBeVisible();
});

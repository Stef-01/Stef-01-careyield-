// W253 verify gate (e2e half): the practice cannot be named from outside, over real HTTP.
//
// The unit tests assert this against the register and the source. That is not enough on its own,
// because the claim is about what a REQUEST can do, and a request is exactly what a unit test does
// not make. `?practiceId=prac-1` reaching a running server and coming back with prac-2's data is
// the failure, and only a request can prove it does not.
//
// TWO PRACTICES, BOTH POPULATED, WHICH IS THE Y4-1 LESSON. A test proving practice B's session
// cannot see practice A's data passes trivially when A has nothing. So the session switches to
// each in turn and each is asserted to get ITS OWN — exclusion and inclusion, both directions.

import { expect, test, type Page } from "@playwright/test";

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

async function switchTo(page: Page, label: string) {
  await page.goto("/console");
  await page.getByRole("combobox", { name: "Practice" }).selectOption({ label });
  await page.getByRole("button", { name: "Switch" }).click();
  await page.waitForLoadState("networkidle");
}

test.beforeEach(async ({ request }) => {
  await request.post("/api/mock/console");
});

test("an unauthenticated call reads nothing and says nothing about what exists", async ({
  request,
}) => {
  const response = await request.get("/api/v1/practice");
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.refusal).toBe("no_session");
  expect(JSON.stringify(body)).not.toContain("prac-");
  expect(body.message.toLowerCase()).not.toMatch(/does not exist|no such practice/);
});

test("a practice id in the query string changes nothing", async ({ page }) => {
  // THE UNIT, over the wire. Y4-1 with somebody CHOOSING the id rather than nobody supplying one.
  // The reader has no request to read it from, so the answer must be identical either way — and
  // identical to the caller's OWN practice, not to the one they asked for.
  await signIn(page);
  await createPractice(page, "Alpha Family Practice");
  await createPractice(page, "Beta Community Practice");
  await switchTo(page, "Alpha Family Practice");

  const plain = await (await page.request.get("/api/v1/practice")).json();
  expect(plain.practiceId).toBe("prac-1");
  expect(plain.data.name).toBe("Alpha Family Practice");

  for (const attempt of [
    "/api/v1/practice?practiceId=prac-2",
    "/api/v1/practice?practice_id=prac-2",
    "/api/v1/practice?practice=prac-2",
  ]) {
    const body = await (await page.request.get(attempt)).json();
    expect(body, `${attempt} changed the answer`).toEqual(plain);
    expect(JSON.stringify(body), `${attempt} leaked the other practice`).not.toContain("prac-2");
    expect(JSON.stringify(body)).not.toContain("Beta Community Practice");
  }

  // Headers are the other place a caller would try to name one.
  const viaHeader = await (
    await page.request.get("/api/v1/practice", {
      headers: { "x-practice-id": "prac-2", "x-practice": "prac-2" },
    })
  ).json();
  expect(viaHeader).toEqual(plain);
});

test("each session gets its OWN practice, both directions, both populated", async ({ page }) => {
  // The Y4-1 assertion done properly: exclusion is free when the other side is empty, so each
  // practice must be shown to have real data of its own AND to be absent from the other's answer.
  await signIn(page);
  await createPractice(page, "Alpha Family Practice");
  await createPractice(page, "Beta Community Practice");

  await switchTo(page, "Alpha Family Practice");
  const alpha = await (await page.request.get("/api/v1/practice")).json();
  await switchTo(page, "Beta Community Practice");
  const beta = await (await page.request.get("/api/v1/practice")).json();

  expect(alpha.data.name).toBe("Alpha Family Practice");
  expect(beta.data.name).toBe("Beta Community Practice");
  expect(JSON.stringify(alpha)).not.toContain("Beta Community Practice");
  expect(JSON.stringify(beta)).not.toContain("Alpha Family Practice");
  expect(alpha.practiceId).not.toBe(beta.practiceId);
});

test("every endpoint answers for the caller's practice and stamps which one", async ({ page }) => {
  // The envelope carries the practice because a payload gets cached, forwarded and pasted into a
  // ticket — W227's rule, and the reason the cross-practice check has something universal to hold.
  await signIn(page);
  await createPractice(page, "Alpha Family Practice");
  await createPractice(page, "Beta Community Practice");
  await switchTo(page, "Beta Community Practice");

  for (const id of ["practice", "capacity", "interop"]) {
    const response = await page.request.get(`/api/v1/${id}`);
    expect(response.status(), id).toBe(200);
    const body = await response.json();
    expect(body.endpoint, id).toBe(id);
    expect(body.practiceId, id).toBe("prac-2");
    expect(JSON.stringify(body), `${id} leaked the other practice`).not.toContain("prac-1");
  }
});

test("the surface is read-only: every write verb is rejected", async ({ page }) => {
  await signIn(page);
  await createPractice(page, "Alpha Family Practice");

  for (const call of [
    page.request.post("/api/v1/practice", { data: { practiceId: "prac-2" } }),
    page.request.put("/api/v1/practice", { data: {} }),
    page.request.patch("/api/v1/practice", { data: {} }),
    page.request.delete("/api/v1/practice"),
  ]) {
    const response = await call;
    expect(response.status(), `${response.url()} accepted a write`).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  }
});

test("an unknown endpoint is refused without saying what exists", async ({ page }) => {
  await signIn(page);
  await createPractice(page, "Alpha Family Practice");

  const response = await page.request.get("/api/v1/complaints");
  expect(response.status()).toBe(404);
  const body = await response.json();
  expect(body.refusal).toBe("unknown_endpoint");
  expect(JSON.stringify(body)).not.toContain("prac-");
});

test("W255 every refusal branch, driven over HTTP, carries no patient marker", async ({
  page,
  request,
}) => {
  // ASSERTED OVER EVERY BRANCH RATHER THAN SAMPLED. Three of the four are reachable from outside;
  // `read_failed` cannot be provoked over HTTP without a broken endpoint, so it is driven in the
  // unit suite against a throwing fixture whose exception message carries an identifier — and the
  // both-directions census is what ties the two halves together.
  const seen: string[] = [];

  const unauth = await request.get("/api/v1/practice");
  expect(unauth.status()).toBe(401);
  seen.push((await unauth.json()).refusal);

  await signIn(page);
  const noPractice = await page.request.get("/api/v1/practice");
  expect(noPractice.status()).toBe(404);
  seen.push((await noPractice.json()).refusal);

  await createPractice(page, "Alpha Family Practice");
  const unknown = await page.request.get("/api/v1/pat-9");
  expect(unknown.status()).toBe(404);
  seen.push((await unknown.json()).refusal);

  expect(seen.sort()).toEqual(["no_practice", "no_session", "unknown_endpoint"]);

  // Nothing that looks like a patient comes back from any of them — including the one whose
  // REQUEST carried a patient-shaped segment, which is where a reflection would show up.
  for (const response of [unauth, noPractice, unknown]) {
    const body = await response.text();
    expect(body, `${response.url()} echoed a patient marker`).not.toMatch(/pat-\d|patientId|candidateRef/i);
    expect(body).not.toMatch(/at .*\.ts:\d+|Error:|stack/i);
  }
});

test("W255 a refusal never says whether the thing asked for exists", async ({ page }) => {
  // A 404 that reads differently depending on whether a practice exists is how an id becomes
  // enumerable. Both unknown-endpoint answers must be byte-identical.
  await signIn(page);
  await createPractice(page, "Alpha Family Practice");

  const real = await (await page.request.get("/api/v1/nope-one")).text();
  const other = await (await page.request.get("/api/v1/nope-two")).text();
  expect(real).toBe(other);
  expect(real).not.toContain("nope-one");
});

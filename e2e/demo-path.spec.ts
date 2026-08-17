// W309 verify gate: "one spec that walks a practice from seeded data to a rendered console answer,
// with every founder gate held — no real patient, no live send, no production credential — and the
// path's refusals rendered where a gate stops it."
//
// THE WALK IS DERIVED FROM `DEMO_PATH` RATHER THAN WRITTEN OUT. W22's demo spec walks the same
// screens and was hand-written, so it and the product could disagree only by somebody noticing.
// Here the register says which routes, which answer marks the step as having worked, and which gate
// stops it; this spec reads them off the screen. A step added to the register with no refusal on
// the page fails in `path.test.ts`, and a refusal that renders in the source but never reaches a
// browser fails HERE — which is the bound `PATH_BOUND` states, closed for the routes this walks.
//
// THE PATIENT STEP IS THE ONE WORTH READING TWICE. Its refusal is asserted on the presenter's page
// and its ABSENCE is asserted on the patient's, because a gate is an internal decision and the
// person following an invitation is the one audience it means nothing to.

import { expect, test } from "@playwright/test";
import { DEMO_PATH, GATE_REFUSAL_COPY, gateStops } from "../src/demo/path";

const step = (route: string) => DEMO_PATH.find((s) => s.route === route)!;

test("the demo path walks from seeded data to the console answer, with every gate named", async ({
  page,
  context,
}) => {
  // 1. Seeded practice. The button reads "Reset" when an earlier spec left a practice behind —
  // the same idempotent action either way.
  await page.goto("/demo");
  await page.getByRole("button", { name: /Launch demo|Reset demo to the start/ }).click();
  await expect(page).toHaveURL(/\/console$/);

  // 2. The console's own answer: the seeded practice, named.
  await expect(page.getByTestId(step("/console").answer)).toHaveText("Demo Family Practice");
  await expect(page.getByTestId("gate-refusal-G1")).toHaveCount(0);

  // 3. The invite decision, and the gate that stops it being sent.
  await page.goto("/console/outreach");
  await expect(page.getByTestId(step("/console/outreach").answer)).toBeVisible();
  await expect(page.getByTestId("gate-refusal-G3")).toContainText(GATE_REFUSAL_COPY.G3);

  // 4. The presenter's page carries the seeding gate and the booking gate.
  await page.goto("/demo");
  await expect(page.getByTestId(step("/demo").answer)).toBeVisible();
  await expect(page.getByTestId("gate-refusal-G2")).toContainText(GATE_REFUSAL_COPY.G2);
  await expect(page.getByTestId("gate-refusal-G1")).toContainText(GATE_REFUSAL_COPY.G1);

  // 5. The patient moment. A real booking against the seeded session — and NO gate copy, because
  // this is the one screen reached by somebody who was contacted rather than somebody looking.
  const href = await page.getByTestId("booking-link-1").getAttribute("href");
  const patientTab = await context.newPage();
  await patientTab.goto(href!);
  await patientTab.getByRole("button", { name: "Confirm booking" }).click();
  await expect(patientTab.getByTestId(step("/book/").answer)).toBeVisible();
  for (const gate of ["G1", "G2", "G3", "G4"]) {
    await expect(
      patientTab.getByTestId(`gate-refusal-${gate}`),
      `${gate} is named to a patient`,
    ).toHaveCount(0);
  }
  await expect(patientTab.getByText("Founder gate")).toHaveCount(0);

  // 6. The answer the whole path exists to produce, and the gate that makes it a demonstration.
  await page.goto("/console/dashboard");
  await expect(page.getByTestId(step("/console/dashboard").answer)).toContainText("simulated weeks");
  await expect(page.getByTestId("gate-refusal-G4")).toContainText(GATE_REFUSAL_COPY.G4);
});

test("every gate the register says stops the path is rendered somewhere on the walk", async ({ page }) => {
  // The register's own completeness, read off the running product rather than off the source. A
  // gate added to `DEMO_PATH` whose refusal never reaches a browser fails here — the half
  // `path.test.ts` cannot see, because a component call in a file is not a rendered element.
  await page.goto("/demo");
  await page.getByRole("button", { name: /Launch demo|Reset demo to the start/ }).click();

  const seen = new Set<string>();
  for (const route of ["/demo", "/console", "/console/outreach", "/console/dashboard"]) {
    await page.goto(route);
    for (const gate of ["G1", "G2", "G3", "G4"]) {
      if ((await page.getByTestId(`gate-refusal-${gate}`).count()) > 0) seen.add(gate);
    }
  }
  expect([...seen].sort()).toEqual([...new Set(gateStops().map((s) => s.stoppedBy.gate))].sort());
});

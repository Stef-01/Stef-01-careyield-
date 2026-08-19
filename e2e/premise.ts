// W358: what a spec's setup CLAIMS, asserted before the walk leans on it.
//
// EVERY SPEC IN THIS SUITE STAGES A PREMISE AND MOST OF THEM NEVER CHECKED IT. A helper signs in,
// fills a wizard and waits for `/console`, and every test after it walks a practice it believes
// exists with a member it believes was added. `waitForURL` proves the browser ARRIVED; it says
// nothing about whether the data saved. A step that silently does not persist leaves the whole file
// walking a state it never established — and passing, because a page that renders an empty console
// for a practice that does not exist looks exactly like one for a practice with nothing in it.
//
// W346 IS THE CASE THIS COMES FROM. Its walk is about a practice that finished setup and is
// waiting, and the difference between that and a practice that never finished is invisible on the
// screen — so the spec reads `setupCompletedAt` back through the mock API before walking. That is
// the shape generalised here: assert the premise through a DIFFERENT DOOR than the one that wrote
// it, because a UI that failed to save is the thing being checked for.
//
// ONE HELPER RATHER THAN NINE COPIES. The nine specs that needed this all claim the same premise —
// a practice exists, with a member, and the console is on it — and nine copies of one readback is
// the shape W341 spent a unit removing from `src/`. The assertions are narrow on purpose: this says
// the premise HELD, not that the practice is correct in every field, which is each spec's own job.

import { expect, type APIRequestContext } from "@playwright/test";

/** The console state a spec's setup claims to have produced. */
export interface Premise {
  /** How many practice records the setup claims to have created. Defaults to one. */
  practices?: number;
  /** A practice name the setup typed, which must come back from the store. */
  named?: string;
  /** An email the setup signed in as, which must hold a membership. */
  member?: string;
  /** True when the setup walked the wizard to the end rather than stopping inside it. */
  setupComplete?: boolean;
}

/**
 * Read the console back and require the premise to have held.
 *
 * THROUGH THE MOCK API RATHER THAN THROUGH THE PAGE, which is the whole point: the page is what the
 * setup drove, so asking it whether the setup worked is asking the same door twice. A spec whose
 * premise silently failed gets a named failure here instead of a confusing one twenty lines later.
 */
export async function expectPremise(request: APIRequestContext, claim: Premise = {}): Promise<void> {
  const response = await request.get("/api/mock/console");
  expect(response.ok(), "the console mock did not answer, so the premise cannot be checked").toBe(true);
  const state = (await response.json()) as {
    practices: Array<{ practice: { name: string }; setupCompletedAt: string | null }>;
    memberships: Array<{ email: string }>;
  };

  expect(state.practices, "the setup claims a practice and the store holds none").toHaveLength(
    claim.practices ?? 1,
  );
  if (claim.named !== undefined) {
    expect(
      state.practices.map((p) => p.practice.name),
      `the setup typed "${claim.named}" and the store did not keep it`,
    ).toContain(claim.named);
  }
  if (claim.member !== undefined) {
    expect(
      state.memberships.map((m) => m.email),
      `the setup signed in as ${claim.member} and no membership was written`,
    ).toContain(claim.member);
  }
  if (claim.setupComplete !== undefined) {
    const complete = state.practices.every((p) => p.setupCompletedAt !== null);
    expect(complete, "the setup claims the wizard finished and the store says it did not").toBe(
      claim.setupComplete,
    );
  }
}

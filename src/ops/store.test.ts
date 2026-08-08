import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "@/booking/store";
import { applyKillSwitch, applyPracticePause, getOps, queueView, resetOps } from "@/ops/store";

const NOW = "2026-08-08T22:00:00Z";

beforeEach(() => {
  resetOps();
  resetStore();
});

describe("ops store", () => {
  it("starts all-clear with no audit", () => {
    const state = getOps();
    expect(state.switches).toEqual({ killSwitch: false, pausedPracticeIds: [] });
    expect(state.auditEvents).toHaveLength(0);
  });

  it("engaging the kill switch records an audit event once", () => {
    applyKillSwitch(true, NOW);
    expect(getOps().switches.killSwitch).toBe(true);
    expect(getOps().auditEvents).toHaveLength(1);
    applyKillSwitch(true, NOW); // idempotent — no second event
    expect(getOps().auditEvents).toHaveLength(1);
    applyKillSwitch(false, NOW);
    expect(getOps().switches.killSwitch).toBe(false);
    expect(getOps().auditEvents).toHaveLength(2);
  });

  it("pausing a practice is audited and reversible", () => {
    applyPracticePause("prac-demo", true, NOW);
    expect(getOps().switches.pausedPracticeIds).toEqual(["prac-demo"]);
    expect(getOps().auditEvents.at(-1)?.detail).toContain("paused");
    applyPracticePause("prac-demo", false, NOW);
    expect(getOps().switches.pausedPracticeIds).toEqual([]);
  });

  it("derives the invitation queue from the booking rail seed", () => {
    const view = queueView();
    // Seed: three 'sent' invitations, two open slots.
    expect(view.counts.sent).toBe(3);
    expect(view.outstanding).toHaveLength(3);
    expect(view.outstanding.every((o) => o.status === "sent")).toBe(true);
  });
});

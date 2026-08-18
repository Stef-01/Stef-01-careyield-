import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Vitest's 5s default is a poor fit for this suite. Several tests build the full
    // 12k-patient sim, which takes 1–4s idle and more on a loaded box, so they sit right
    // on the line: three separate sessions have each chased the same false failure
    // (dna, fleet, weekly, dashboard-data) and pinned a per-test timeout after the gate
    // went red on an unchanged tree.
    //
    // A timeout is a hang guard, not a performance assertion — the tests that actually
    // budget time (W48's fleet run) assert their own numbers inside the test body, so
    // raising this removes no real check. 30s still catches a genuine hang quickly.
    testTimeout: 30_000,
    // W347: THE REPORTER CHANNEL, NOT A TEST. `Timeout calling "onTaskUpdate"` is a worker failing
    // to reach the MAIN process within birpc's window — every assertion passes and vitest still
    // exits non-zero, because one worker's status update went unanswered while the main thread was
    // busy fanning out four hundred more.
    //
    // MEASURED RATHER THAN GUESSED, and the measurement is why this is here rather than in a unit's
    // own file. On `main` the run took 1117s of test time and exited 0; W347 added twelve seconds
    // and it exited 1 with every one of 4215 tests green. Twelve seconds is not a defect anybody
    // can fix in a unit — the tree had been sitting one unit away from this line and the next one
    // would have crossed it whatever it was. What actually holds the main thread is `W332`'s full
    // mutation run: one worker occupied for roughly 780 seconds spawning a vitest subprocess per
    // mutant, while the pool keeps scheduling the rest.
    //
    // The lever is pool pressure. This box has four cores and vitest defaults to one worker per
    // core minus one; capping it lower leaves the main thread enough room to answer, and costs
    // wall-clock the long-pole suite was going to spend anyway — the run is bounded by the
    // mutation suite, not by parallelism across the other files.
    //
    // A GATE THAT GOES RED WITHOUT A FAILING ASSERTION IS THE WORST KIND, and this tree has been
    // here before: the comment above records three sessions chasing a false timeout before somebody
    // raised `testTimeout`. Same class, one level out.
    maxWorkers: 2,
    // W328: the residue check runs once, after every worker. An assertion inside a test file
    // answers about the instant it executes at, and vitest runs files in parallel, so one that
    // reads the repository passes whenever it happens to run before whatever writes. This is the
    // moment that dominates the run.
    globalSetup: ["./vitest.global-setup.ts"],
  },
});

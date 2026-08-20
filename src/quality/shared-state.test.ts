// W385 verify gate: what this suite actually shares between test files is MEASURED with real child
// runs, every test file touching something shared is enumerated, and two files writing one path
// inside the repository are reported — the clash W385 found between `unread-bounds.test.ts` and
// `repository-clean.test.ts`, and fixed by handing one of them a copy.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SCOPE_GIVEN,
  SHARED_BOUND,
  orderDependent,
  repositoryWrites,
  stateSites,
} from "./shared-state";
import { probeDirPrefix } from "./repository-clean";
import { fixtureText } from "./scan-text";

const ROOT = path.resolve(__dirname, "..", "..");

/** A file as `orderDependent` takes them, so the rule can be driven on sources this tree lacks. */
const file = (module: string, source: string) => ({ module, source });

describe("W385 what the harness shares, measured", () => {
  it("gives each test file a process of its own, so an environment variable does not cross", async () => {
    // THE MEASUREMENT THE WHOLE REGISTER RESTS ON. If files shared a process, every module-level
    // binding in this tree would be shared state and the population would be the suite. They do
    // not: two files report different pids, and a variable one sets is `undefined` in the other.
    const both = await runChild(["shared-child-a-writer", "shared-child-b-reader"]);
    expect(both.aRan, "the writer did not run, so the reading below measures nothing").not.toBe("");
    expect(both.bSaw).toContain("undefined");
    expect(both.bSaw).not.toContain(`pid=${both.aRan}`);
    expect(SCOPE_GIVEN.process_env).toBe("per_file");
    expect(SCOPE_GIVEN.the_module_registry).toBe("per_file");
  }, 120_000);

  it("never runs a process-exit handler a test file registers, whatever the reason given", async () => {
    // W375 recorded this and gave a reason: *vitest runs its workers as THREADS — the thread ends
    // and the process does not*. The conclusion is right and the reason is not. The workers are
    // forked processes with pids of their own — the test above shows two of them — and the handler
    // still never fires, because a worker is torn down rather than allowed to exit.
    const seen = await runChild(["shared-child-exit-handler"]);
    expect(seen.ran, "the child did not run, so the silence below measures nothing").toBe(true);
    expect(seen.exitFired).toBe(false);
    expect(SCOPE_GIVEN.a_process_exit_handler).toBe("never_runs");
  }, 120_000);

  it("leaves the repository as the one thing every file in a run reaches", () => {
    expect(SCOPE_GIVEN.the_repository).toBe("per_run");
    const perRun = Object.entries(SCOPE_GIVEN).filter(([, scope]) => scope === "per_run");
    expect(perRun.map(([kind]) => kind)).toEqual(["the_repository"]);
  });
});

describe("W385 the population", () => {
  it("enumerates every test file that touches something shared, with which thing and which way", () => {
    const sites = stateSites(ROOT);
    // Guard against a vacuous pass: a walk returning nothing satisfies every assertion below.
    expect(sites.length).toBeGreaterThan(5);
    const kinds = new Set(sites.map((s) => s.shared));
    expect(kinds).toContain("process_env");
    expect(kinds).toContain("the_repository");
    expect(kinds).toContain("a_process_exit_handler");
    // Both directions are populated, or `access` is a field nothing reads.
    expect(sites.some((s) => s.access === "reads")).toBe(true);
    expect(sites.some((s) => s.access === "writes")).toBe(true);
  });

  it("names the one file that writes inside the repository, and no file that only reads it", () => {
    // ONE, AND IT WAS TWO THIS MORNING. `repository-clean.test.ts` owns W331's sweep and drives it
    // where the sweep looks; `unread-bounds.test.ts` drove the same check on the same path and now
    // drives it on a copy. A single writer is a file arranging its own fixture rather than a race.
    const writers = stateSites(ROOT)
      .filter((s) => s.shared === "the_repository" && s.access === "writes")
      .map((s) => s.module);
    expect(writers).toEqual(["src/quality/repository-clean.test.ts"]);
    // `unit-headers.test.ts` opens by copying `path.join(ROOT, "src")` somewhere else. That is a
    // read of the repository and counting it was the first thing this derivation got wrong.
    expect(repositoryWrites(readFileSync(path.join(ROOT, "src/quality/unit-headers.test.ts"), "utf8"))).toEqual(
      [],
    );
  });

  it("reads the target of a write, and follows a path bound to a name first", () => {
    expect(repositoryWrites(fixtureText("shared-probe-direct"))).toEqual(["src/planted"]);
    expect(repositoryWrites(fixtureText("shared-probe-aliased"))).toEqual(["src/planted"]);
    // A copy's SOURCE is not its target, and a write into a copy is not a write into the tree.
    expect(repositoryWrites(fixtureText("shared-probe-copy-source"))).toEqual([]);
  });
});

describe("W385 the rule", () => {
  it("is silent over the suite as it stands", () => {
    expect(orderDependent(ROOT)).toEqual([]);
  });

  it("reports two files writing one path, which is the clash W385 found and fixed", () => {
    // The tree as it stood this morning: both files created `src/planted` in the repository, both
    // opened with `expect(artefactsPresent(ROOT)).toEqual([])` as their control, and the pool
    // decided which of them saw the other's directory.
    const clash = orderDependent(ROOT, [
      file("src/quality/repository-clean.test.ts", fixtureText("shared-probe-direct")),
      file("src/quality/unread-bounds.test.ts", fixtureText("shared-probe-aliased")),
    ]);
    expect(clash).toEqual([
      {
        where: "src/planted",
        files: ["src/quality/repository-clean.test.ts", "src/quality/unread-bounds.test.ts"],
      },
    ]);
  });

  it("does not report one file writing a path, which is a fixture rather than a race", () => {
    expect(orderDependent(ROOT, [file("src/a.test.ts", fixtureText("shared-probe-direct"))])).toEqual([]);
  });

  it("does not report two files writing different paths", () => {
    const clash = orderDependent(ROOT, [
      file("src/a.test.ts", fixtureText("shared-probe-direct")),
      file("src/b.test.ts", fixtureText("shared-probe-elsewhere")),
    ]);
    expect(clash).toEqual([]);
  });

  it("does not report two files writing into copies of the tree", () => {
    const clash = orderDependent(ROOT, [
      file("src/a.test.ts", fixtureText("shared-probe-copy-source")),
      file("src/b.test.ts", fixtureText("shared-probe-copy-source")),
    ]);
    expect(clash).toEqual([]);
  });
});

describe("W385 the bound", () => {
  it("says which half is a convention and which race it does not look for", () => {
    expect(SHARED_BOUND.length).toBeGreaterThan(600);
    expect(SHARED_BOUND).toContain("THE REPOSITORY WRITES ARE FOUND BY THE NAME OF A BINDING");
    expect(SHARED_BOUND).toContain("IT SAYS NOTHING " + "ABOUT ORDER WITHIN A FILE");
  });
});

/**
 * A real vitest run over planted files, in a directory of its own.
 *
 * The point is that it is REAL: what one test file can see of another is a fact about the pool
 * vitest is configured with, and a table asserting it would go on asserting it after an upgrade.
 * `detached` so the group can be reaped; the markers are what comes back.
 */
async function runChild(
  fixtures: readonly string[],
): Promise<{ aRan: string; bSaw: string; exitFired: boolean; ran: boolean }> {
  const dir = mkdtempSync(path.join(tmpdir(), probeDirPrefix(process.pid)));
  try {
    const named: Record<string, string> = {
      "shared-child-a-writer": fixtureText("shared-child-a-writer"),
      "shared-child-b-reader": fixtureText("shared-child-b-reader"),
      "shared-child-exit-handler": fixtureText("shared-child-exit-handler"),
    };
    for (const name of fixtures) writeFileSync(path.join(dir, `${name}.test.ts`), named[name]!);
    writeFileSync(
      path.join(dir, "v.config.ts"),
      fixtureText("shared-child-config").replace(/DIR_HERE/g, dir.split(path.sep).join("/")),
    );
    const child = spawn(
      process.execPath,
      [path.join(ROOT, "node_modules", "vitest", "vitest.mjs"), "run", "--config", path.join(dir, "v.config.ts")],
      { cwd: ROOT, detached: true, stdio: "ignore", env: { ...process.env, W385_MARKERS: dir } },
    );
    const code = await new Promise<number>((resolve) => child.on("exit", (c) => resolve(c ?? 1)));
    const read = (name: string) => (existsSync(path.join(dir, name)) ? readFileSync(path.join(dir, name), "utf8") : "");
    return {
      aRan: read("a-ran"),
      bSaw: read("b-saw"),
      exitFired: existsSync(path.join(dir, "exit-fired")),
      ran: code === 0,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

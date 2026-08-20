// W382 verify gate: every hook this tree wires is enumerated with the moment it answers to, and a
// hook that reclaims a disk at a moment an interrupted run skips is reported. W375's teardown-only
// sweep is the driven case, and the two run-level moments are MEASURED by killing a real run
// rather than read from a table.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ENDINGS,
  FIRES_UNDER,
  HOOK_BOUND,
  hookFiles,
  hookSites,
  localBodies,
  reclaimsOf,
  sweptPrefix,
  tempPrefixes,
  unreachedReclaimers,
  type HookSite,
} from "./hook-reach";
import { copyTree, withPlantedIn } from "./planting";
import { probeDirPrefix } from "./repository-clean";
import { fixtureText } from "./scan-text";

const ROOT = path.resolve(__dirname, "..", "..");
const COPY = copyTree(ROOT);
afterAll(() => rmSync(COPY, { recursive: true, force: true }));

const PROBE = "src/quality/hook-probe.test.ts";

/** A hook site by hand, so the rule can be driven on wiring this tree does not hold. */
const site = (module: string, moment: HookSite["moment"], reclaims: HookSite["reclaims"]): HookSite => ({
  module,
  moment,
  line: 1,
  reclaims,
});

describe("W382 the population", () => {
  it("finds the hooks that are actually wired, in every place one can be", () => {
    const sites = hookSites(ROOT);
    // Guard against a vacuous pass: a walk returning nothing satisfies every assertion below.
    expect(sites.length).toBeGreaterThan(90);
    const at = (module: string, moment: string) =>
      sites.some((s) => s.module === module && s.moment === moment);
    // One of each place a hook can live: the run-level pair outside `src/`, the process handler
    // vitest's worker threads never reach, a suite hook, and playwright's own spelling in `e2e/`.
    expect(at("vitest.global-setup.ts", "run_setup")).toBe(true);
    expect(at("vitest.global-setup.ts", "run_teardown")).toBe(true);
    expect(at("src/quality/planting.ts", "process_exit")).toBe(true);
    expect(at("src/quality/pins.test.ts", "suite_after_all")).toBe(true);
    expect(sites.some((s) => s.module.startsWith("e2e/") && s.moment === "per_test_before")).toBe(true);
  });

  it("reads the root config, which is where the moment this unit is about lives", () => {
    const files = hookFiles(ROOT).map((f) => path.relative(ROOT, f));
    expect(files).toContain("vitest.global-setup.ts");
    expect(files.some((f) => f.startsWith(`src${path.sep}`))).toBe(true);
    expect(files.some((f) => f.startsWith(`e2e${path.sep}`))).toBe(true);
  });

  it("separates a hook that removes a path from one that arranges and one that restores state", () => {
    expect(reclaimsOf("(() => { rmSync(dir, { recursive: true }); })")).toBe("outside_the_process");
    expect(reclaimsOf("(async () => { await rm(dir); })")).toBe("outside_the_process");
    expect(reclaimsOf("(() => { vi.restoreAllMocks(); })")).toBe("in_process");
    expect(reclaimsOf("(() => { store = freshStore(); })")).toBe("nothing");
    // `in_process` has no member in this tree and the arm is why: a hook restoring a mock is not a
    // hook leaving a directory, and reading them the same way would put nine files in the report.
    expect(hookSites(ROOT).filter((s) => s.reclaims === "in_process")).toEqual([]);
  });

  it("follows a call to a helper beside it, which is the difference between seeing W375's case and not", () => {
    const code = "function wipe() {\n  rmSync(d, { recursive: true });\n}\nexport function teardown() {\n  wipe();\n}\n";
    const locals = localBodies(code);
    expect([...locals.keys()].sort()).toEqual(["teardown", "wipe"]);
    // The hook's own text names no removal. Without the helper it reads as arranging nothing.
    expect(reclaimsOf(locals.get("teardown")!)).toBe("nothing");
    expect(reclaimsOf(locals.get("teardown")!, locals)).toBe("outside_the_process");
    // And this is not a hypothetical shape: it is how the sweep is spelled in the live config.
    const gs = hookSites(ROOT).filter((s) => s.module === "vitest.global-setup.ts");
    expect(gs.map((s) => s.reclaims)).toEqual(["outside_the_process", "outside_the_process"]);
  });

  it("finds a hook planted into a copied tree, and stops finding it when it goes", () => {
    const planted = withPlantedIn(COPY, { [PROBE]: fixtureText("hook-probe-unswept") }, () =>
      hookSites(COPY).filter((s) => s.module === PROBE),
    );
    expect(planted.map((s) => s.moment)).toEqual(["suite_before_all", "suite_after_all"]);
    expect(planted.map((s) => s.reclaims)).toEqual(["nothing", "outside_the_process"]);
    expect(hookSites(COPY).some((s) => s.module === PROBE)).toBe(false);
  });
});

describe("W382 the moment table, measured rather than believed", () => {
  it("records an ending for every moment, and no moment outside the three", () => {
    for (const [moment, endings] of Object.entries(FIRES_UNDER)) {
      expect(endings.length, `${moment} fires under nothing`).toBeGreaterThan(0);
      for (const e of endings) expect(ENDINGS).toContain(e);
    }
  });

  it("a run that finishes reaches both run-level moments, and one that is killed reaches only the first", async () => {
    // THE TABLE'S TWO LOAD-BEARING ROWS, DRIVEN. Everything this unit reports turns on `teardown`
    // being skipped by a kill and `setup` not being — which is a fact about the harness, not about
    // this tree, and a fact a table can go on asserting long after it stops being true. So it is
    // measured: a real child run, twice, with a marker written from each hook.
    const completed = await runChild("quick");
    expect(completed, "the control did not reach either hook, so the reading below measures nothing").toEqual({
      setup: true,
      teardown: true,
    });
    const interrupted = await runChild("slow");
    expect(interrupted).toEqual({ setup: true, teardown: false });

    // And the table says exactly that.
    expect(FIRES_UNDER.run_setup).toContain("interrupted");
    expect(FIRES_UNDER.run_teardown).not.toContain("interrupted");
    expect(FIRES_UNDER.run_teardown).toContain("completed");
  }, 120_000);
});

describe("W382 the rule", () => {
  it("is silent over the tree as it stands", () => {
    expect(unreachedReclaimers(ROOT)).toEqual([]);
  });

  it("reports the wiring W375 replaced: the sweep in `teardown` and nowhere else", () => {
    // The unit's case, on the live config, with one fact changed — the `setup` half does not
    // reclaim. That is the tree as it stood before W375, and the whole finding is that the hook
    // left is the one an interrupted run skips.
    const live = hookSites(ROOT);
    const before = live.map((s) =>
      s.module === "vitest.global-setup.ts" && s.moment === "run_setup" ? { ...s, reclaims: "nothing" as const } : s,
    );
    const reported = unreachedReclaimers(ROOT, before);
    expect(reported.map((r) => `${r.module}::${r.moment}`)).toEqual(["vitest.global-setup.ts::run_teardown"]);
    expect(reported[0]!.missed).toEqual(["interrupted"]);
    // And with the half W375 added, nothing is reported — the same tree, the same rule.
    expect(unreachedReclaimers(ROOT, live)).toEqual([]);
  });

  it("reports a hand-built temporary directory nothing sweeps, and not the same probe once it is owned", () => {
    // THE REMEDY, DRIVEN. Two plants differing in one expression: the prefix. W382 found nine files
    // spelling the first and rewrote every one of them into the second.
    // Each fixture named by a LITERAL: a citation nobody can read without running the call is the
    // shape W307 refuses, and a helper taking the name is exactly that.
    const seen = (body: string) =>
      withPlantedIn(COPY, { [PROBE]: body }, () =>
        unreachedReclaimers(COPY).filter((r) => r.module === PROBE),
      );
    const unswept = seen(fixtureText("hook-probe-unswept"));
    expect(unswept, "the control does not fire, so the silence below measures nothing").toHaveLength(1);
    expect(unswept[0]!.unswept).toEqual(["w999-"]);
    expect(unswept[0]!.missed).toEqual(["interrupted"]);
    expect(seen(fixtureText("hook-probe-owned"))).toEqual([]);
  });

  it("does not report a hook that reclaims again at a moment nothing skips", () => {
    const both = [
      site("src/quality/x.ts", "run_teardown", "outside_the_process"),
      site("src/quality/x.ts", "run_setup", "outside_the_process"),
    ];
    expect(unreachedReclaimers(ROOT, both)).toEqual([]);
    expect(unreachedReclaimers(ROOT, [both[0]!])).toHaveLength(1);
  });

  it("does not report a hook that reclaims nothing a disk keeps", () => {
    expect(unreachedReclaimers(ROOT, [site("src/quality/x.ts", "suite_after_all", "in_process")])).toEqual([]);
    expect(unreachedReclaimers(ROOT, [site("src/quality/x.ts", "suite_after_all", "nothing")])).toEqual([]);
  });

  it("knows which prefixes the run-level sweep owns, which is the whole of the derived cover", () => {
    expect(sweptPrefix("tree-")).toBe(true);
    expect(sweptPrefix("plant-")).toBe(true);
    expect(sweptPrefix("probe-")).toBe(true);
    expect(sweptPrefix("w300-")).toBe(false);
    expect(sweptPrefix("careyield-interest-")).toBe(false);
  });

  it("reads a module's temporary names from both ways of making one", () => {
    // The literal lives in a fixture: spelled here it would make this file a module that builds an
    // unswept directory, and the register two describes below would report its own suite.
    expect(tempPrefixes(fixtureText("hook-prefix-literal"))).toEqual(["w300-"]);
    expect(tempPrefixes("const c = copyTree(ROOT);")).toEqual(["tree-"]);
    expect(tempPrefixes("withTree({}, (r) => r);")).toEqual(["plant-"]);
    expect(tempPrefixes("const d = mkdtempSync(path.join(tmpdir(), probeDirPrefix(process.pid)));")).toEqual([
      "probe-",
    ]);
    expect(tempPrefixes("export const x = 1;\n")).toEqual([]);
  });

  it("gives no cover to a module that builds no directory of its own", () => {
    // The reading that would have excused W375's case. The global setup makes nothing and removes
    // other runs' directories, so `every prefix it builds is swept` is vacuously true of it — and
    // an implementation resting on that sentence reports nothing at all.
    expect(tempPrefixes(fixtureText("hook-probe-sweeps-others"))).toEqual([]);
    const reported = withPlantedIn(COPY, { [PROBE]: fixtureText("hook-probe-sweeps-others") }, () =>
      unreachedReclaimers(COPY).filter((r) => r.module === PROBE),
    );
    expect(reported).toHaveLength(1);
    // Reported while owning no temporary name at all, which is the reading the vacuous cover gave
    // away: `every name it builds is swept` is true of a module that builds none.
    expect(reported.map((r) => r.unswept.length)).toEqual([0]);
  });
});

describe("W382 every hand-built probe directory in this tree is owned", () => {
  it("leaves no unswept prefix anywhere, which is what the nine renames were for", () => {
    const unswept = hookFiles(ROOT).flatMap((f) => {
      const names = tempPrefixes(existsSync(f) ? readFileSync(f, "utf8") : "");
      return names.filter((p) => !sweptPrefix(p)).map((p) => `${path.relative(ROOT, f)}: ${p}`);
    });
    expect(unswept).toEqual([]);
  });

  it("still builds directories, so the sweep above is not silent for want of a subject", () => {
    const built = hookFiles(ROOT).filter((f) => tempPrefixes(existsSync(f) ? readFileSync(f, "utf8") : "").length > 0);
    expect(built.length).toBeGreaterThan(10);
  });
});

describe("W382 the bound", () => {
  it("says what the table is not, and what a `finally` costs it", () => {
    expect(HOOK_BOUND.length).toBeGreaterThan(600);
    expect(HOOK_BOUND).toContain("THE ENDINGS THIS TABLE NAMES ARE NOT EVERY WAY A RUN CAN END");
    expect(HOOK_BOUND).toContain("a `finally` read as a moment is not built");
    expect(HOOK_BOUND).toContain("exactly ONE level");
  });
});

/**
 * A real vitest run in a directory of its own, either allowed to finish or killed mid-test.
 *
 * The child writes a marker from `setup` and another from `teardown`; what comes back is which
 * markers exist. `detached` so the kill takes the whole process group — killing the npx wrapper
 * alone leaves the run it started to finish, which would report a teardown that a kill did reach.
 */
async function runChild(which: "quick" | "slow"): Promise<{ setup: boolean; teardown: boolean }> {
  const dir = mkdtempSync(path.join(tmpdir(), probeDirPrefix(process.pid)));
  try {
    writeFileSync(path.join(dir, "gs.ts"), fixtureText("hook-child-global-setup"));
    // ONLY THE ONE THIS READING NEEDS. Writing both put the long test into the run that is allowed
    // to finish, and a control nobody keeps is a control. The fixture is named by a LITERAL either
    // way: W307's rule is that a citation has to be readable without running the call.
    const body = which === "quick" ? fixtureText("hook-child-quick-test") : fixtureText("hook-child-slow-test");
    writeFileSync(path.join(dir, `${which}.test.ts`), body);
    writeFileSync(
      path.join(dir, "v.config.ts"),
      fixtureText("hook-child-config").replace(/DIR_HERE/g, dir.split(path.sep).join("/")),
    );
    const child = spawn(
      process.execPath,
      [path.join(ROOT, "node_modules", "vitest", "vitest.mjs"), "run", "--config", path.join(dir, "v.config.ts")],
      { cwd: ROOT, detached: true, stdio: "ignore", env: { ...process.env, W382_MARKERS: dir } },
    );
    const ended = new Promise<void>((resolve) => child.on("exit", () => resolve()));
    if (which === "slow") {
      for (let i = 0; i < 300 && !existsSync(path.join(dir, "setup-ran")); i += 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, 300));
      try {
        process.kill(-child.pid!, "SIGKILL");
      } catch {
        // Already gone; the markers below are still the reading.
      }
    }
    await ended;
    await new Promise((r) => setTimeout(r, 300));
    return {
      setup: existsSync(path.join(dir, "setup-ran")),
      teardown: existsSync(path.join(dir, "teardown-ran")),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

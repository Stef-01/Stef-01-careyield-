import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { DEFAULT_SIM_CONFIG, runSim } from "@/sim/harness";
import {
  buildWeeklyReport,
  DEFAULT_REPORT_OPTIONS,
  renderWeeklyReportDocx,
  renderWeeklyReportMarkdown,
} from "./weekly";

const REPORTS_DIR = path.resolve(__dirname, "../../reports");

// The golden world: 8 deterministic weeks, report for week 8.
const result = runSim({ ...DEFAULT_SIM_CONFIG, weeks: 8 });
const report = buildWeeklyReport(result, DEFAULT_REPORT_OPTIONS);

describe("W20 weekly practice report — golden from sim data", () => {
  it("markdown matches the committed golden byte for byte", () => {
    const goldenPath = path.join(REPORTS_DIR, "weekly-w8.md");
    if (process.env.UPDATE_GOLDEN) {
      mkdirSync(REPORTS_DIR, { recursive: true });
      writeFileSync(goldenPath, renderWeeklyReportMarkdown(report));
    }
    const golden = readFileSync(goldenPath, "utf8");
    expect(renderWeeklyReportMarkdown(report)).toBe(golden);
  });

  it("revenue is estimated on incremental visits only, with the naive claim as contrast", () => {
    const { revenue, cumulative } = report;
    expect(revenue.incrementalEstimateAud).toBe(
      Math.round((cumulative.incrementalAttended ?? 0) * revenue.perVisitAssumptionAud),
    );
    expect(revenue.naiveWouldClaimAud).toBe(
      cumulative.naiveGeneratedAttended * revenue.perVisitAssumptionAud,
    );
    // The whole point: the naive claim overstates the honest estimate.
    expect(revenue.naiveWouldClaimAud).toBeGreaterThan(revenue.incrementalEstimateAud ?? 0);
  });

  it("guardrail alerts flow into the report (healthy world is clear; unhealthy alerts)", () => {
    expect(report.alerts).toEqual([]);
    const noisy = buildWeeklyReport(runSim({ ...DEFAULT_SIM_CONFIG, weeks: 8, optOutRate: 0.06 }), DEFAULT_REPORT_OPTIONS);
    expect(noisy.alerts).toMatchObject([{ monitor: "opt_out_rate", severity: "critical" }]);
    expect(renderWeeklyReportMarkdown(noisy)).toContain("CRITICAL");
  });

  it("a run with no completed weeks refuses to report", () => {
    expect(() => buildWeeklyReport(runSim({ ...DEFAULT_SIM_CONFIG, weeks: 0 }), DEFAULT_REPORT_OPTIONS)).toThrow(
      "no completed weeks",
    );
  });

  it("docx artifact carries the same content", async () => {
    const buffer = await renderWeeklyReportDocx(report);
    mkdirSync(REPORTS_DIR, { recursive: true });
    writeFileSync(path.join(REPORTS_DIR, "weekly-w8.docx"), buffer);
    const xml = new AdmZip(buffer).readAsText("word/document.xml");
    expect(xml).toContain(`weekly report, week 8`);
    expect(xml).toContain("Incrementality");
    expect(xml).toContain("Revenue estimate");
    expect(xml).toContain("applied to incremental visits only");
    expect(xml).toContain("Guardrails");
    expect(xml).toContain("All guardrails clear");
    // The honest-number rules survive the format: naive is contrast, never impact.
    expect(xml).toContain("not reported as impact");
  });
});

// W45 verify gate: golden output — plus the in-code de-identification and
// compliance guarantees the golden alone can't prove.

import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_SIM_CONFIG, runSim } from "@/sim/harness";
import {
  assertPublishable,
  CaseStudyComplianceError,
  renderCaseStudy,
  type CaseStudyContext,
} from "./casestudy";
import { buildPilotReport, syntheticOutcomeRecords } from "./report";

const REPORTS_DIR = path.resolve(__dirname, "../../reports");

const result = runSim({ ...DEFAULT_SIM_CONFIG, weeks: 8 });
const report = buildPilotReport(result, syntheticOutcomeRecords(result, 45));
const CONTEXT: CaseStudyContext = {
  practiceDescriptor: "a 10-GP metropolitan general practice",
  identifyingStrings: ["Synthetic Family Practice", "Dr Synthetic"],
  syntheticData: true,
};

describe("W45 case-study generator", () => {
  it("matches the committed golden byte for byte", () => {
    const goldenPath = path.join(REPORTS_DIR, "case-study-w45.md");
    const rendered = renderCaseStudy(report, CONTEXT);
    if (process.env.UPDATE_GOLDEN) {
      mkdirSync(REPORTS_DIR, { recursive: true });
      writeFileSync(goldenPath, rendered);
    }
    expect(rendered).toBe(readFileSync(goldenPath, "utf8"));
  });

  it("the golden carries the honest-numbers structure and the synthetic marker", () => {
    const text = renderCaseStudy(report, CONTEXT);
    expect(text).toContain("incremental attended appointments per 1,000 patients in the messaged\n  group");
    expect(text).toContain("would have claimed");
    expect(text).toContain("Synthetic-data rehearsal");
    expect(text).toContain("makes no claims about anyone's health");
    expect(text).not.toContain("Synthetic Family Practice"); // de-identified
  });

  it("refuses output containing a declared identifying string", () => {
    expect(() =>
      renderCaseStudy(report, {
        ...CONTEXT,
        practiceDescriptor: "the Synthetic Family Practice team",
      }),
    ).toThrow(CaseStudyComplianceError);
  });

  it("refuses internal identifiers anywhere in the text", () => {
    expect(() => assertPublishable("visit by pat-123 went well", [])).toThrow(/internal identifier/);
    expect(() => assertPublishable("booked via inv-bf-apt-1-0", [])).toThrow(/internal identifier/);
  });

  it("refuses copy-compliance violations (linter is the gate, not editing)", () => {
    expect(() =>
      renderCaseStudy(report, { ...CONTEXT, practiceDescriptor: "the best specialist clinic" }),
    ).toThrow(/copy-compliance/);
    expect(() => assertPublishable("Patients love it — 5/5 stars", [])).toThrow(/copy-compliance/);
  });

  it("refuses to fabricate a case study without a holdout arm", () => {
    expect(() =>
      renderCaseStudy({ ...report, northStarIncrementalPer1000: null }, CONTEXT),
    ).toThrow(/no holdout/);
  });
});

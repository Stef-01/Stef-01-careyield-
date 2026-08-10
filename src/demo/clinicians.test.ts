import { describe, expect, it } from "vitest";
import { clinicians, rankClinicians } from "./clinicians";

describe("demo clinician matching", () => {
  it.each([
    ["a cardiac focused GP", "daniel-okafor"],
    ["someone with renal and kidney experience", "linh-nguyen"],
    ["a GP experienced with dialysis", "aisha-rahman"],
    ["someone who understands adult ADHD", "tom-bennett"],
    ["a calm woman GP", "maya-singh"],
  ])("ranks %s first", (request, expectedId) => {
    expect(rankClinicians(request)[0]!.id).toBe(expectedId);
  });

  it("keeps the full synthetic roster available", () => {
    expect(clinicians).toHaveLength(8);
    expect(new Set(clinicians.map((clinician) => clinician.id)).size).toBe(8);
  });
});

import { describe, expect, it } from "vitest";
import { clinicians, rankClinicians } from "./clinicians";

describe("demo clinician matching", () => {
  it.each([
    ["a cardiac focused GP", "daniel-okafor"],
    ["someone with renal and kidney experience", "linh-nguyen"],
    ["a GP experienced with dialysis", "aisha-rahman"],
    ["someone who understands adult ADHD", "tom-bennett"],
    ["a calm woman GP", "maya-singh"],
    ["a young South Indian woman seeking PCOS and mental health care", "priya-nair"],
  ])("ranks %s first", (request, expectedId) => {
    expect(rankClinicians(request)[0]!.id).toBe(expectedId);
  });

  it("surfaces several distinct PCOS and mental-health matches for the demo use case", () => {
    const ids = rankClinicians(
      "A young South Indian woman with PCOS who needs mental health and cultural support",
    ).slice(0, 4).map((clinician) => clinician.id);

    expect(ids).toEqual(["priya-nair", "maya-singh", "sofia-alvarez", "noah-williams"]);
  });

  it("keeps the full synthetic roster available", () => {
    expect(clinicians).toHaveLength(8);
    expect(new Set(clinicians.map((clinician) => clinician.id)).size).toBe(8);
  });

  it("includes useful billing, travel and access details for every clinician", () => {
    for (const clinician of clinicians) {
      expect(clinician.practicalSignals).toHaveLength(3);
      expect(clinician.practicalSignals[0]).toMatch(/billing|bills/i);

      const travelMinutes = clinician.practicalSignals[1]!.match(/^(\d+) min/);
      expect(travelMinutes).not.toBeNull();
      expect(Number(travelMinutes![1])).toBeLessThanOrEqual(30);
    }

    expect(
      clinicians.filter((clinician) => clinician.practicalSignals[0]!.toLowerCase().includes("bulk")),
    ).toHaveLength(6);
  });
});

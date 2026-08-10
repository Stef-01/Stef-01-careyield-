import { describe, expect, it } from "vitest";
import { clinicians, getPersonalizedMatch, rankClinicians } from "./clinicians";

describe("demo clinician matching", () => {
  it.each([
    ["a cardiac focused GP", "daniel-okafor"],
    ["someone with renal and kidney experience", "linh-nguyen"],
    ["a GP experienced with dialysis", "aisha-rahman"],
    ["someone who understands adult ADHD", "tom-bennett"],
    ["a calm woman GP", "nisha-kapoor"],
    ["a young South Indian woman seeking PCOS and mental health care", "priya-nair"],
  ])("ranks %s first", (request, expectedId) => {
    expect(rankClinicians(request)[0]!.id).toBe(expectedId);
  });

  it("surfaces several distinct PCOS and mental-health matches for the demo use case", () => {
    const ids = rankClinicians(
      "A young South Indian woman with PCOS who needs mental health and cultural support",
    ).slice(0, 4).map((clinician) => clinician.id);

    expect(ids).toEqual(["priya-nair", "anjali-menon", "nisha-kapoor", "maya-singh"]);
  });

  it("keeps the full synthetic roster available", () => {
    expect(clinicians).toHaveLength(15);
    expect(new Set(clinicians.map((clinician) => clinician.id)).size).toBe(15);
  });

  it.each([
    ["Tamil", 2],
    ["Malayalam", 2],
    ["Hindi", 2],
    ["Punjabi", 2],
    ["Spanish", 2],
    ["Arabic", 2],
    ["Vietnamese", 2],
  ])("has multiple women clinicians who speak %s", (language, minimum) => {
    const matches = clinicians.filter((clinician) =>
      clinician.gender === "woman" && clinician.languages.includes(language),
    );

    expect(matches.length).toBeGreaterThanOrEqual(minimum);
  });

  it("only presents language as a match reason when the patient requested it", () => {
    const sofia = clinicians.find((clinician) => clinician.id === "sofia-alvarez")!;

    expect(getPersonalizedMatch(sofia, "I need a woman GP for PCOS and sustainable health").reason)
      .not.toContain("Spanish");
    expect(getPersonalizedMatch(sofia, "I need a Spanish-speaking woman GP for PCOS").reason)
      .toContain("Spanish-speaking");
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
    ).toHaveLength(11);
  });
});

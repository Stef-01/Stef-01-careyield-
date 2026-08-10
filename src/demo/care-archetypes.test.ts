import { describe, expect, it } from "vitest";
import { careArchetypes } from "./care-archetypes";
import { cliniciansMatchingArchetype, rankClinicians } from "./clinicians";

describe("women’s health demo archetypes", () => {
  it("includes ten distinct qualitative journeys", () => {
    expect(careArchetypes).toHaveLength(10);
    expect(new Set(careArchetypes.map((archetype) => archetype.id)).size).toBe(10);
  });

  it.each(careArchetypes)("ranks the intended first match for $title", (archetype) => {
    expect(rankClinicians(archetype.request)[0]!.id).toBe(archetype.expectedFirstMatch);
  });

  it.each(careArchetypes)("offers multiple viable clinicians for $title", (archetype) => {
    const eligible = cliniciansMatchingArchetype(archetype);
    const eligibleIds = new Set(eligible.map((clinician) => clinician.id));
    const rankedAlternatives = rankClinicians(archetype.request)
      .slice(0, 5)
      .filter((clinician) => eligibleIds.has(clinician.id));

    expect(eligible.length).toBeGreaterThanOrEqual(2);
    expect(rankedAlternatives.length).toBeGreaterThanOrEqual(2);
  });

  it("covers language, psychological safety and disability rights explicitly", () => {
    const requests = careArchetypes.map((archetype) => archetype.request.toLowerCase()).join(" ");

    expect(requests).toMatch(/tamil|malayalam/);
    expect(requests).toMatch(/hindi|punjabi/);
    expect(requests).toMatch(/spanish/);
    expect(requests).toMatch(/arabic/);
    expect(requests).toMatch(/vietnamese/);
    expect(requests).toMatch(/anxious|mental health|trauma|overwhelmed/);
    expect(requests).toMatch(/disability rights/);
  });
});

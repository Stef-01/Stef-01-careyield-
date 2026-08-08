import { describe, expect, it } from "vitest";
import { appName, BUILD_UNIT } from "./version";

describe("scaffold smoke", () => {
  it("exports the app name", () => {
    expect(appName()).toBe("CareYield");
  });
  it("tracks the build unit", () => {
    expect(BUILD_UNIT).toMatch(/^W\d+/);
  });
});

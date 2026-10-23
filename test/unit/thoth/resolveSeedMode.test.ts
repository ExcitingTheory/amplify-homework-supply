import { describe, expect, it } from "vitest";
import { resolveThothSeedMode } from "../../../scripts/thoth/resolveSeedMode";

describe("resolveThothSeedMode", () => {
  it("defaults to a snapshot when one exists and live otherwise", () => {
    expect(resolveThothSeedMode(undefined, true)).toBe("snapshot");
    expect(resolveThothSeedMode(undefined, false)).toBe("live");
    expect(resolveThothSeedMode("", false)).toBe("live");
  });

  it("accepts explicit modes and rejects unknown values", () => {
    expect(resolveThothSeedMode("live", true)).toBe("live");
    expect(resolveThothSeedMode("snapshot", false)).toBe("snapshot");
    expect(resolveThothSeedMode("off", false)).toBe("off");
    expect(() => resolveThothSeedMode("auto", true)).toThrow(
      'Invalid SEED_THOTH_MODE "auto"; expected live, snapshot, or off',
    );
  });
});

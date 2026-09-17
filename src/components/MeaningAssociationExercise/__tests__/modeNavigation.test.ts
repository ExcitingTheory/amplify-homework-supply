import { describe, expect, it } from "vitest";

import {
  getAvailableMeaningModes,
  getNextMeaningMode,
  resolveMeaningMode,
} from "../index";

describe("meaning association mode navigation", () => {
  it("orders enabled modes canonically", () => {
    expect(getAvailableMeaningModes(["hard", "learn"])).toEqual([
      "learn",
      "hard",
    ]);
  });

  it("keeps at least one mode available", () => {
    expect(getAvailableMeaningModes([])).toEqual(["learn"]);
  });

  it("normalizes legacy numeric tab indexes", () => {
    expect(resolveMeaningMode(2, ["learn", "hard"])).toBe("hard");
    expect(resolveMeaningMode(1, ["learn", "hard"])).toBe("learn");
  });

  it("advances only through enabled modes", () => {
    const modes = ["learn", "hard"];
    expect(getNextMeaningMode("learn", modes)).toBe("hard");
    expect(getNextMeaningMode("hard", modes)).toBeNull();
  });
});

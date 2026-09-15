import { describe, expect, it } from "vitest";
import { getAsyncContentState } from "../asyncContentState";

describe("getAsyncContentState", () => {
  it("distinguishes loading, errors, empty, and populated states", () => {
    expect(getAsyncContentState({ loaded: false })).toBe("loading");
    expect(getAsyncContentState({ loaded: true, error: "failed" })).toBe(
      "error",
    );
    expect(getAsyncContentState({ loaded: true, items: [] })).toBe(
      "success-empty",
    );
    expect(
      getAsyncContentState({ loaded: true, items: [{ id: "unit" }] }),
    ).toBe("success-with-data");
  });
});

import { describe, expect, it } from "vitest";

import { resolveRetryEnabled } from "./retrySettings";

describe("resolveRetryEnabled", () => {
  it("uses an explicit unit override before the section default", () => {
    expect(resolveRetryEnabled(false, true)).toBe(false);
    expect(resolveRetryEnabled(true, false)).toBe(true);
  });

  it("inherits the section default when the unit has no override", () => {
    expect(resolveRetryEnabled(undefined, false)).toBe(false);
    expect(resolveRetryEnabled(null, true)).toBe(true);
  });

  it("defaults replay to enabled when neither setting is configured", () => {
    expect(resolveRetryEnabled()).toBe(true);
    expect(resolveRetryEnabled(null, null)).toBe(true);
  });
});

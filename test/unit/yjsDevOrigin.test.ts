import { describe, expect, it } from "vitest";
import { isAllowedLocalOrigin } from "../../scripts/yjsDevOrigin";

describe("local WebSocket origins", () => {
  it.each([
    "https://localhost:3000",
    "http://127.0.0.1:6006",
    "https://[::1]:3000",
  ])("accepts %s", (origin) => {
    expect(isAllowedLocalOrigin(origin)).toBe(true);
  });

  it.each(["", "null", "https://localhost.example.com", "https://example.com"])(
    "rejects %s",
    (origin) => {
      expect(isAllowedLocalOrigin(origin)).toBe(false);
    },
  );
});

import { describe, it, expect } from "vitest";
import { maskEmail } from "../maskEmail";

describe("maskEmail", () => {
  it("keeps the first and last characters of the local part and the domain", () => {
    expect(maskEmail("alice@example.com")).toBe("a…e@example.com");
  });

  it("never reveals a full short local part", () => {
    expect(maskEmail("al@example.com")).toBe("a…@example.com");
    expect(maskEmail("a@example.com")).toBe("a…@example.com");
  });

  it("splits on the last @", () => {
    expect(maskEmail('"a@b"@example.com')).toBe('"…"@example.com');
  });

  it("masks a value without an @", () => {
    expect(maskEmail("student-123")).toBe("s…3");
  });

  it("returns empty and domain-only values unchanged", () => {
    expect(maskEmail("")).toBe("");
    expect(maskEmail("@example.com")).toBe("@example.com");
  });
});

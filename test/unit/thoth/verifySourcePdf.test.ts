import { describe, expect, it } from "vitest";
import { assertSourcePdfSha256 } from "../../../scripts/thoth/verifySourcePdf";

describe("assertSourcePdfSha256", () => {
  it("returns the digest when PDF bytes match the expected hash", () => {
    const bytes = new TextEncoder().encode("source PDF bytes");

    expect(
      assertSourcePdfSha256(
        bytes,
        "11898f8cd16147b971fd49d161f9be2dc9b5f068368d5b1cbc0997c040a3966d",
      ),
    ).toBe("11898f8cd16147b971fd49d161f9be2dc9b5f068368d5b1cbc0997c040a3966d");
  });

  it("throws when the bytes do not match the expected hash", () => {
    const bytes = new TextEncoder().encode("modified PDF bytes");

    expect(() => assertSourcePdfSha256(bytes, "0".repeat(64))).toThrow(
      "Source PDF SHA-256 mismatch",
    );
  });

  it("compares expected digests case-insensitively", () => {
    const bytes = new TextEncoder().encode("source PDF bytes");

    expect(
      assertSourcePdfSha256(
        bytes,
        "11898F8CD16147B971FD49D161F9BE2DC9B5F068368D5B1CBC0997C040A3966D",
      ),
    ).toBe("11898f8cd16147b971fd49d161f9be2dc9b5f068368d5b1cbc0997c040a3966d");
  });
});

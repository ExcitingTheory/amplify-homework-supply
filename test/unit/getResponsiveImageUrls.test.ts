import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getCachedUrl
vi.mock("../../src/utils/getCachedUrl", () => ({
  default: vi.fn(),
}));

import {
  getResponsiveImageUrls,
  getImageVariantPath,
} from "../../src/utils/getResponsiveImageUrls";
import getCachedUrl from "../../src/utils/getCachedUrl";

describe("getResponsiveImageUrls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when fileId is missing", async () => {
    const result = await getResponsiveImageUrls(null, "identity-123");
    expect(result).toBeNull();
  });

  it("returns null when identityId is missing", async () => {
    const result = await getResponsiveImageUrls("file-123", null);
    expect(result).toBeNull();
  });

  it("returns null when both params are empty strings", async () => {
    const result = await getResponsiveImageUrls("", "");
    expect(result).toBeNull();
  });

  it("resolves srcSet with all variants when URLs resolve successfully", async () => {
    getCachedUrl.mockImplementation((path) => {
      if (path.includes("/small.webp"))
        return Promise.resolve("https://s3.example.com/small.webp");
      if (path.includes("/medium.webp"))
        return Promise.resolve("https://s3.example.com/medium.webp");
      if (path.includes("/large.webp"))
        return Promise.resolve("https://s3.example.com/large.webp");
      return Promise.resolve(null);
    });

    const result = await getResponsiveImageUrls(
      "file-abc",
      "us-east-1:identity-xyz",
    );

    expect(result).not.toBeNull();
    expect(result.srcSet).toContain("https://s3.example.com/small.webp 320w");
    expect(result.srcSet).toContain("https://s3.example.com/medium.webp 640w");
    expect(result.srcSet).toContain("https://s3.example.com/large.webp 1280w");
    expect(result.sizes).toBe(
      "(max-width: 320px) 320px, (max-width: 640px) 640px, 1280px",
    );
    expect(result.fallbackSrc).toBe("https://s3.example.com/large.webp");
  });

  it("returns partial srcSet when some variants fail", async () => {
    getCachedUrl.mockImplementation((path) => {
      if (path.includes("/small.webp"))
        return Promise.resolve("https://s3.example.com/small.webp");
      if (path.includes("/medium.webp"))
        return Promise.reject(new Error("Not found"));
      if (path.includes("/large.webp"))
        return Promise.resolve("https://s3.example.com/large.webp");
      return Promise.resolve(null);
    });

    const result = await getResponsiveImageUrls(
      "file-abc",
      "us-east-1:identity-xyz",
    );

    expect(result).not.toBeNull();
    expect(result.srcSet).toContain("320w");
    expect(result.srcSet).toContain("1280w");
    expect(result.srcSet).not.toContain("640w");
    expect(result.fallbackSrc).toBe("https://s3.example.com/large.webp");
  });

  it("returns null when all URL resolutions fail", async () => {
    getCachedUrl.mockRejectedValue(new Error("Network error"));

    const result = await getResponsiveImageUrls(
      "file-abc",
      "us-east-1:identity-xyz",
    );
    expect(result).toBeNull();
  });

  it("returns null when all URLs resolve to null/empty", async () => {
    getCachedUrl.mockResolvedValue(null);

    const result = await getResponsiveImageUrls(
      "file-abc",
      "us-east-1:identity-xyz",
    );
    expect(result).toBeNull();
  });

  it("calls getCachedUrl with correct paths", async () => {
    getCachedUrl.mockResolvedValue("https://example.com/file.webp");

    await getResponsiveImageUrls("my-file-id", "us-east-1:my-identity");

    expect(getCachedUrl).toHaveBeenCalledWith(
      "protected/us-east-1:my-identity/my-file-id/small.webp",
    );
    expect(getCachedUrl).toHaveBeenCalledWith(
      "protected/us-east-1:my-identity/my-file-id/medium.webp",
    );
    expect(getCachedUrl).toHaveBeenCalledWith(
      "protected/us-east-1:my-identity/my-file-id/large.webp",
    );
    expect(getCachedUrl).toHaveBeenCalledTimes(3);
  });
});

describe("getImageVariantPath", () => {
  it("generates correct path for thumbnail variant", () => {
    expect(
      getImageVariantPath("file-123", "us-east-1:id-456", "thumbnail"),
    ).toBe("protected/us-east-1:id-456/file-123/thumbnail.webp");
  });

  it("generates correct path for small variant", () => {
    expect(getImageVariantPath("file-123", "us-east-1:id-456", "small")).toBe(
      "protected/us-east-1:id-456/file-123/small.webp",
    );
  });

  it("generates correct path for medium variant", () => {
    expect(getImageVariantPath("file-123", "us-east-1:id-456", "medium")).toBe(
      "protected/us-east-1:id-456/file-123/medium.webp",
    );
  });

  it("generates correct path for large variant", () => {
    expect(getImageVariantPath("file-123", "us-east-1:id-456", "large")).toBe(
      "protected/us-east-1:id-456/file-123/large.webp",
    );
  });
});

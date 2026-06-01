import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";

/**
 * Unit tests for imageProcess Lambda handler.
 * Tests the handler's routing logic by verifying source code patterns.
 * Direct import of the handler isn't possible in test env because
 * pdf-to-img is a Lambda-only runtime dependency.
 */

const handlerSrc = readFileSync(
  "amplify/functions/imageProcess/handler.ts",
  "utf-8",
);

describe("imageProcess handler - source verification", () => {
  describe("extension filtering", () => {
    it("defines IMAGE_MIME_TYPES constant", () => {
      expect(handlerSrc).toMatch(/IMAGE_MIME_TYPES\s*[=:]/);
    });

    it("supports .jpg extension", () => {
      expect(handlerSrc).toContain('".jpg"');
    });

    it("supports .jpeg extension", () => {
      expect(handlerSrc).toContain('".jpeg"');
    });

    it("supports .png extension", () => {
      expect(handlerSrc).toContain('".png"');
    });

    it("supports .gif extension", () => {
      expect(handlerSrc).toContain('".gif"');
    });

    it("supports .webp extension", () => {
      expect(handlerSrc).toContain('".webp"');
    });

    it("supports .avif extension", () => {
      expect(handlerSrc).toContain('".avif"');
    });

    it("supports .tiff extension", () => {
      expect(handlerSrc).toContain('".tiff"');
    });

    it("supports .bmp extension", () => {
      expect(handlerSrc).toContain('".bmp"');
    });

    it("supports .pdf extension for thumbnail generation", () => {
      expect(handlerSrc).toContain('".pdf"');
    });
  });

  describe("variant generation", () => {
    it("generates thumbnail variant (150px)", () => {
      expect(handlerSrc).toMatch(/thumbnail.*150|150.*thumbnail/);
    });

    it("generates small variant (320px)", () => {
      expect(handlerSrc).toMatch(/small.*320|320.*small/);
    });

    it("generates medium variant (640px)", () => {
      expect(handlerSrc).toMatch(/medium.*640|640.*medium/);
    });

    it("generates large variant (1280px)", () => {
      expect(handlerSrc).toMatch(/large.*1280|1280.*large/);
    });
  });

  describe("infinite loop prevention", () => {
    it("checks for already-processed variant paths", () => {
      // Handler should skip files that are already processed variants
      expect(handlerSrc).toMatch(
        /thumbnail\.webp|small\.webp|medium\.webp|large\.webp/,
      );
    });

    it("skips processing of webp variant output files", () => {
      // Should contain logic to skip variant files from being re-processed
      expect(handlerSrc).toMatch(/skip|ignore|already.*process|variant.*path/i);
    });
  });

  describe("event handling", () => {
    it("handles EventBridge S3 events (aws.s3 source)", () => {
      expect(handlerSrc).toContain("aws.s3");
      expect(handlerSrc).toContain("Object Created");
    });

    it("handles GraphQL resolver events (processFileImage)", () => {
      expect(handlerSrc).toContain("processFileImage");
    });

    it("extracts object key from detail.object.key", () => {
      expect(handlerSrc).toMatch(/detail.*object.*key/);
    });
  });

  describe("output format", () => {
    it("outputs WebP format", () => {
      expect(handlerSrc).toMatch(/\.webp|webp\(\)/);
    });

    it("uses sharp for image processing", () => {
      expect(handlerSrc).toContain("import sharp");
    });

    it("outputs to protected/{identityId}/{fileId}/ path", () => {
      expect(handlerSrc).toMatch(
        /protected\/.*identityId.*fileId|protected\/\$\{/,
      );
    });
  });
});

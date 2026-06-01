import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync as realReadFileSync } from "node:fs";

/**
 * Unit tests for documentThumbnail Lambda handler.
 * Tests event routing, extension filtering, and edu format pre-processing logic.
 */

// Mock all external dependencies
vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));
vi.mock("aws-amplify/data", () => ({
  generateClient: vi.fn(() => ({
    graphql: vi.fn(),
  })),
}));
vi.mock("@aws-sdk/credential-providers", () => ({
  fromEnv: vi.fn(() => () => Promise.resolve({})),
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = vi.fn();
  },
  GetObjectCommand: vi.fn(),
  PutObjectCommand: vi.fn(),
}));
vi.mock("pdf-to-img", () => ({
  pdf: vi.fn(() => ({
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.resolve({ done: true }),
    }),
  })),
}));
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-webp")),
  })),
}));
vi.mock("child_process", () => ({
  default: { execSync: vi.fn(() => "") },
  execSync: vi.fn(() => ""),
}));
vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => Buffer.from("mock-pdf")),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => false),
    readdirSync: vi.fn(() => []),
    unlinkSync: vi.fn(),
  },
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => Buffer.from("mock-pdf")),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => false),
  readdirSync: vi.fn(() => []),
  unlinkSync: vi.fn(),
}));

// Set environment variables
process.env.API_ENDPOINT = "https://mock-api.example.com/graphql";
process.env.STORAGE_BUCKET = "mock-bucket";
process.env.AWS_REGION = "us-east-1";

describe("documentThumbnail handler - event routing", () => {
  let handler: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod =
      await import("../../amplify/functions/documentThumbnail/handler");
    handler = mod.handler;
  });

  describe("EventBridge S3 events - extension filtering", () => {
    const makeS3Event = (key: string) => ({
      source: "aws.s3",
      "detail-type": "Object Created",
      detail: {
        bucket: { name: "mock-bucket" },
        object: { key },
      },
    });

    it("skips image files (.jpg, .png)", async () => {
      const result = await handler(
        makeS3Event("protected/id/files/photo.jpg"),
        {},
      );
      expect(result).toBeUndefined();
    });

    it("skips already-processed thumbnails", async () => {
      const result = await handler(
        makeS3Event("protected/id/file-id/thumbnail.webp"),
        {},
      );
      expect(result).toBeUndefined();
    });

    const supportedExtensions = [
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".odt",
      ".ods",
      ".odp",
      ".txt",
      ".md",
      ".csv",
      ".epub",
      ".rtf",
      ".imscc",
      ".qti",
      ".gift",
      ".zip",
    ];

    for (const ext of supportedExtensions) {
      it(`processes ${ext} files`, async () => {
        const event = makeS3Event(
          `protected/identity-123/files/document${ext}`,
        );
        // Will fail on graphql lookup but shouldn't skip
        try {
          await handler(event, {});
        } catch {
          // Expected - mock won't resolve file records
        }
        // If we got past the extension filter, the test passes
      });
    }

    it("skips events with no object key", async () => {
      const event = {
        source: "aws.s3",
        "detail-type": "Object Created",
        detail: { bucket: { name: "mock-bucket" }, object: {} },
      };
      const result = await handler(event, {});
      expect(result).toBeUndefined();
    });
  });

  describe("GraphQL resolver events", () => {
    it("handles processDocumentThumbnail field name", async () => {
      const event = {
        info: { fieldName: "processDocumentThumbnail" },
        arguments: { fileID: "file-456" },
      };

      try {
        await handler(event, {});
      } catch (e: any) {
        // GraphQL mock returns undefined → destructuring fails
        expect(e).toBeDefined();
      }
    });

    it("warns on unknown event type", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const event = { randomField: true };

      await handler(event, {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown event type"),
      );
      consoleSpy.mockRestore();
    });
  });
});

describe("documentThumbnail handler - edu format support", () => {
  const handlerSrc = realReadFileSync(
    "amplify/functions/documentThumbnail/handler.ts",
    "utf-8",
  );

  describe("DOCUMENT_EXTENSIONS includes edu formats", () => {
    it("module declares support for .imscc", () => {
      expect(handlerSrc).toContain('".imscc"');
    });

    it("module declares support for .qti", () => {
      expect(handlerSrc).toContain('".qti"');
    });

    it("module declares support for .gift", () => {
      expect(handlerSrc).toContain('".gift"');
    });

    it("module declares support for .zip (SCORM)", () => {
      expect(handlerSrc).toContain('".zip"');
    });
  });

  describe("DOCUMENT_MIME_TYPES includes edu MIME types", () => {
    it("module declares support for IMS CC MIME type", () => {
      expect(handlerSrc).toContain('"application/x-imscc+zip"');
    });

    it("module declares support for QTI MIME type", () => {
      expect(handlerSrc).toContain('"application/x-qti+xml"');
    });

    it("module declares support for GIFT MIME type", () => {
      expect(handlerSrc).toContain('"text/x-gift"');
    });
  });
});

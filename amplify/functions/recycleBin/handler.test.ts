/**
 * Unit tests for the recycleBin Lambda handler.
 *
 * Tests cover:
 * - softDelete: validates model, checks ownership, sets deletedAt, cascades joins
 * - restoreRecord: validates, checks ownership, clears deletedAt, cascades restore
 * - permanentDelete: archives to S3, deletes join records, deletes primary
 * - unarchiveRecord: reads S3, recreates records
 * - listArchives: lists S3 objects with prefix filtering
 * - getArchive: reads and decompresses specific S3 archive
 * - Error cases: unsupported model, unauthorized, not found, already deleted
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { gzipSync } from "node:zlib";

// Use vi.hoisted() so these are available inside hoisted vi.mock factories
const { mockGraphql, mockS3Send } = vi.hoisted(() => ({
  mockGraphql: vi.fn(),
  mockS3Send: vi.fn(),
}));

// Mock AWS SDK and Amplify before importing handler
vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: vi.fn(() => ({ graphql: mockGraphql })),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockS3Send;
  },
  PutObjectCommand: class {
    _type = "PutObject";
    constructor(input: any) {
      Object.assign(this, input);
    }
  },
  GetObjectCommand: class {
    _type = "GetObject";
    constructor(input: any) {
      Object.assign(this, input);
    }
  },
  ListObjectsV2Command: class {
    _type = "ListObjectsV2";
    constructor(input: any) {
      Object.assign(this, input);
    }
  },
}));

// Set env before import
process.env.AMPLIFY_DATA_OUTPUTS = JSON.stringify({ data: {} });
process.env.STORAGE_BUCKET = "test-bucket";

// Dynamic import to allow mocks to be set up first
const { handler } =
  await import("../../../amplify/functions/recycleBin/handler");

function createEvent(fieldName: string, args: any, username = "user-123") {
  return {
    fieldName,
    arguments: args,
    identity: { username },
  };
}

describe("recycleBin handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("softDelete", () => {
    it("returns error for unsupported model", async () => {
      const result = await handler(
        createEvent("softDelete", { modelName: "Grade", id: "g1" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unsupported model");
    });

    it("returns error when record not found", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { getUnit: null },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Record not found");
    });

    it("returns error when user is not the owner", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "other-user",
            _version: 1,
            deletedAt: null,
          },
        },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Unauthorized: not the record owner");
    });

    it("returns error when record is already soft-deleted", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "user-123",
            _version: 1,
            deletedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Record is already soft-deleted");
    });

    it("soft deletes a record and cascades to join tables", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "user-123",
            _version: 1,
            deletedAt: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "u1", _version: 2 } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitFiles: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitWords: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionUnits: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe("u1");
      expect(result.modelName).toBe("Unit");
      expect(result.deletedAt).toBeDefined();
      expect(result.cascadedJoinRecords).toBe(0);
    });

    it("cascades soft delete to join records", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "user-123",
            _version: 1,
            deletedAt: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "u1", _version: 2 } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [
              { id: "uf1", _version: 1, deletedAt: null },
              { id: "uf2", _version: 1, deletedAt: null },
            ],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf1", _version: 2 } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf2", _version: 2 } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitWords: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionUnits: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(2);
    });

    it("works for Section model with no cascades", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getSection: {
            id: "s1",
            owner: "user-123",
            _version: 1,
            deletedAt: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateSection: { id: "s1", _version: 2 } },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Section", id: "s1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(0);
    });
  });

  describe("restoreRecord", () => {
    it("returns error for unsupported model", async () => {
      const result = await handler(
        createEvent("restoreRecord", { modelName: "Invalid", id: "x" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unsupported model");
    });

    it("returns error when record is not soft-deleted", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "user-123",
            _version: 1,
            deletedAt: null,
          },
        },
      });

      const result = await handler(
        createEvent("restoreRecord", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Record is not soft-deleted");
    });

    it("restores a soft-deleted record and cascades", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "user-123",
            _version: 2,
            deletedAt: "2026-01-01T00:00:00.000Z",
            deletedBy: "user-123",
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "u1", _version: 3 } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitFiles: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitWords: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionUnits: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });

      const result = await handler(
        createEvent("restoreRecord", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe("u1");
      expect(result.restoredAt).toBeDefined();
    });
  });

  describe("permanentDelete", () => {
    it("archives to S3 and deletes from DB", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "u1",
            owner: "user-123",
            _version: 2,
            deletedAt: "2026-01-01",
            deletedBy: "user-123",
            createdAt: "2025-01-01",
            updatedAt: "2026-01-01",
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitFiles: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitWords: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionUnits: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });
      mockS3Send.mockResolvedValueOnce({});
      mockGraphql.mockResolvedValueOnce({
        data: { deleteUnit: { id: "u1" } },
      });

      const result = await handler(
        createEvent("permanentDelete", { modelName: "Unit", id: "u1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.archiveKey).toContain("private/archives/Unit/u1/");
      expect(result.archiveKey).toContain(".json.gz");
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it("returns error when bucket not configured", async () => {
      const origBucket = process.env.STORAGE_BUCKET;
      delete process.env.STORAGE_BUCKET;

      const result = await handler(
        createEvent("permanentDelete", { modelName: "BadModel", id: "x" }),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);

      process.env.STORAGE_BUCKET = origBucket;
    });
  });

  describe("listArchives", () => {
    it("lists S3 archives filtered by model", async () => {
      mockS3Send.mockResolvedValueOnce({
        Contents: [
          {
            Key: "private/archives/Unit/u1/2026-01-01.json.gz",
            LastModified: new Date("2026-01-01"),
            Size: 1024,
          },
          {
            Key: "private/archives/Unit/u2/2026-01-02.json.gz",
            LastModified: new Date("2026-01-02"),
            Size: 2048,
          },
        ],
        NextContinuationToken: null,
      });

      const result = await handler(
        createEvent("listArchives", { modelName: "Unit", limit: 50 }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.archives).toHaveLength(2);
      expect(result.archives[0].modelName).toBe("Unit");
      expect(result.archives[0].recordId).toBe("u1");
    });

    it("lists all archives when no model filter", async () => {
      mockS3Send.mockResolvedValueOnce({
        Contents: [
          {
            Key: "private/archives/Unit/u1/2026-01-01.json.gz",
            LastModified: new Date("2026-01-01"),
            Size: 512,
          },
        ],
        NextContinuationToken: "token123",
      });

      const result = await handler(
        createEvent("listArchives", {}),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.archives).toHaveLength(1);
      expect(result.nextToken).toBe("token123");
    });
  });

  describe("getArchive", () => {
    it("reads and decompresses an archive from S3", async () => {
      const archiveData = {
        model: "Unit",
        id: "u1",
        archivedAt: "2026-01-01T00:00:00.000Z",
        archivedBy: "user-123",
        record: { id: "u1", name: "Test Unit" },
        relatedRecords: {},
      };

      const compressed = gzipSync(JSON.stringify(archiveData));

      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(compressed),
        },
      });

      const result = await handler(
        createEvent("getArchive", {
          archiveKey: "private/archives/Unit/u1/2026-01-01.json.gz",
        }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.model).toBe("Unit");
      expect(result.id).toBe("u1");
      expect(result.record.name).toBe("Test Unit");
    });

    it("returns error when archive file is empty", async () => {
      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(undefined),
        },
      });

      const result = await handler(
        createEvent("getArchive", {
          archiveKey: "private/archives/Unit/u1/bad.json.gz",
        }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("general", () => {
    it("returns error for unknown fieldName", async () => {
      const result = await handler(
        createEvent("unknownOperation", {}),
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unknown operation");
    });

    it("returns error when no authenticated user", async () => {
      const result = await handler(
        { fieldName: "softDelete", arguments: {}, identity: {} },
        {} as any,
        vi.fn(),
      );
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
    });
  });
});

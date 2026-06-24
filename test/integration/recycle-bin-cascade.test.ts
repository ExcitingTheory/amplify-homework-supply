/**
 * Integration tests for recycle bin cascade behavior.
 *
 * Tests verify that the recycleBin Lambda handler correctly cascades
 * soft-delete, restore, and permanent-delete operations to join table records.
 *
 * These tests exercise the full operation handlers with mocked DynamoDB/S3
 * to verify cascade logic works across multiple join tables.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { gzipSync } from "node:zlib";

const { mockGraphql, mockS3Send } = vi.hoisted(() => ({
  mockGraphql: vi.fn(),
  mockS3Send: vi.fn(),
}));

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

process.env.AMPLIFY_DATA_OUTPUTS = JSON.stringify({ data: {} });
process.env.STORAGE_BUCKET = "test-bucket";

const { handler } = await import("../../amplify/functions/recycleBin/handler");

function createEvent(fieldName: string, args: any, username = "instructor-1") {
  return { fieldName, arguments: args, identity: { username } };
}

describe("recycle bin cascade behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("soft delete cascades to all join tables for Unit", () => {
    it("cascades deletedAt to UnitFile, UnitWord, QuestionUnit, UnitDocument", async () => {
      // getUnit
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "unit-abc",
            owner: "instructor-1",
            _version: 3,
            deletedAt: null,
          },
        },
      });

      // updateUnit (set deletedAt)
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "unit-abc", _version: 4 } },
      });

      // UnitFile list: 3 join records
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [
              { id: "uf-1", _version: 1, deletedAt: null },
              { id: "uf-2", _version: 2, deletedAt: null },
              { id: "uf-3", _version: 1, deletedAt: null },
            ],
            nextToken: null,
          },
        },
      });
      // Update each UnitFile
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-1" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-2" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-3" } },
      });

      // UnitWord list: 2 join records
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitWords: {
            items: [
              { id: "uw-1", _version: 1, deletedAt: null },
              { id: "uw-2", _version: 1, deletedAt: null },
            ],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitWord: { id: "uw-1" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitWord: { id: "uw-2" } },
      });

      // QuestionUnit list: 1 join record
      mockGraphql.mockResolvedValueOnce({
        data: {
          listQuestionUnits: {
            items: [{ id: "qu-1", _version: 1, deletedAt: null }],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateQuestionUnit: { id: "qu-1" } },
      });

      // UnitDocument list: empty
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "Unit", id: "unit-abc" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(6); // 3 + 2 + 1 + 0
      // Verify the primary record update was called with deletedAt
      expect(mockGraphql).toHaveBeenCalledTimes(
        1 + // getUnit
          1 + // updateUnit
          1 +
          3 + // listUnitFiles + 3 updates
          1 +
          2 + // listUnitWords + 2 updates
          1 +
          1 + // listQuestionUnits + 1 update
          1, // listUnitDocuments (empty)
      );
    });

    it("skips join records that are already soft-deleted", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "unit-def",
            owner: "instructor-1",
            _version: 1,
            deletedAt: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "unit-def", _version: 2 } },
      });

      // UnitFile has one already-deleted record and one active
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [
              { id: "uf-active", _version: 1, deletedAt: null },
              {
                id: "uf-already-deleted",
                _version: 2,
                deletedAt: "2026-01-01T00:00:00Z",
              },
            ],
            nextToken: null,
          },
        },
      });
      // Only the active one gets updated
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-active" } },
      });

      // Remaining join tables empty
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
        createEvent("softDelete", { modelName: "Unit", id: "unit-def" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      // Only 1 cascade (not 2) because one was already deleted
      expect(result.cascadedJoinRecords).toBe(1);
    });
  });

  describe("soft delete cascades for File model (4 join tables)", () => {
    it("cascades to UnitFile, WordFile, QuestionFile, AssistantChatFile", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getFile: {
            id: "file-1",
            owner: "instructor-1",
            _version: 1,
            deletedAt: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateFile: { id: "file-1", _version: 2 } },
      });

      // UnitFile: 1 record
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [{ id: "uf-1", _version: 1, deletedAt: null }],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-1" } },
      });

      // WordFile: 2 records
      mockGraphql.mockResolvedValueOnce({
        data: {
          listWordFiles: {
            items: [
              { id: "wf-1", _version: 1, deletedAt: null },
              { id: "wf-2", _version: 1, deletedAt: null },
            ],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateWordFile: { id: "wf-1" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateWordFile: { id: "wf-2" } },
      });

      // QuestionFile: empty
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionFiles: { items: [], nextToken: null } },
      });

      // AssistantChatFile: 1 record
      mockGraphql.mockResolvedValueOnce({
        data: {
          listAssistantChatFiles: {
            items: [{ id: "acf-1", _version: 1, deletedAt: null }],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateAssistantChatFile: { id: "acf-1" } },
      });

      const result = await handler(
        createEvent("softDelete", { modelName: "File", id: "file-1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(4); // 1 + 2 + 0 + 1
    });
  });

  describe("restore cascades to join tables", () => {
    it("restores Unit and clears deletedAt on its join records", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "unit-restore",
            owner: "instructor-1",
            _version: 4,
            deletedAt: "2026-06-01T00:00:00Z",
            deletedBy: "instructor-1",
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "unit-restore", _version: 5 } },
      });

      // UnitFile: 2 soft-deleted records
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [
              { id: "uf-1", _version: 2, deletedAt: "2026-06-01T00:00:00Z" },
              { id: "uf-2", _version: 3, deletedAt: "2026-06-01T00:00:00Z" },
            ],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-1" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-2" } },
      });

      // UnitWord: 1 soft-deleted record
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitWords: {
            items: [
              { id: "uw-1", _version: 2, deletedAt: "2026-06-01T00:00:00Z" },
            ],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitWord: { id: "uw-1" } },
      });

      // QuestionUnit, UnitDocument: empty
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionUnits: { items: [], nextToken: null } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });

      const result = await handler(
        createEvent("restoreRecord", { modelName: "Unit", id: "unit-restore" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(3); // 2 + 1
    });

    it("skips join records that are not soft-deleted during restore", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "unit-partial",
            owner: "instructor-1",
            _version: 2,
            deletedAt: "2026-06-01T00:00:00Z",
            deletedBy: "instructor-1",
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "unit-partial", _version: 3 } },
      });

      // UnitFile: 1 deleted, 1 not deleted (shouldn't happen but defensive)
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [
              {
                id: "uf-deleted",
                _version: 2,
                deletedAt: "2026-06-01T00:00:00Z",
              },
              { id: "uf-active", _version: 1, deletedAt: null },
            ],
            nextToken: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-deleted" } },
      });

      // Rest empty
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
        createEvent("restoreRecord", { modelName: "Unit", id: "unit-partial" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(1); // Only the deleted one
    });
  });

  describe("permanent delete cascades: archives + deletes join records", () => {
    it("archives Unit with its join records to S3 then deletes all", async () => {
      // getUnit full
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "unit-perm",
            owner: "instructor-1",
            _version: 5,
            deletedAt: "2026-06-01T00:00:00Z",
            deletedBy: "instructor-1",
            createdAt: "2025-01-01",
            updatedAt: "2026-06-01",
          },
        },
      });

      // List join records for archiving
      // UnitFile: 2 records
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [
              { id: "uf-1", _version: 2, deletedAt: "2026-06-01" },
              { id: "uf-2", _version: 3, deletedAt: "2026-06-01" },
            ],
            nextToken: null,
          },
        },
      });
      // UnitWord: 1 record
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitWords: {
            items: [{ id: "uw-1", _version: 1, deletedAt: "2026-06-01" }],
            nextToken: null,
          },
        },
      });
      // QuestionUnit: empty
      mockGraphql.mockResolvedValueOnce({
        data: { listQuestionUnits: { items: [], nextToken: null } },
      });
      // UnitDocument: empty
      mockGraphql.mockResolvedValueOnce({
        data: { listUnitDocuments: { items: [], nextToken: null } },
      });

      // S3 PutObject for archive
      mockS3Send.mockResolvedValueOnce({});

      // Delete join records (UnitFile x2, UnitWord x1)
      mockGraphql.mockResolvedValueOnce({
        data: { deleteUnitFile: { id: "uf-1" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { deleteUnitFile: { id: "uf-2" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { deleteUnitWord: { id: "uw-1" } },
      });

      // Delete primary record
      mockGraphql.mockResolvedValueOnce({
        data: { deleteUnit: { id: "unit-perm" } },
      });

      const result = await handler(
        createEvent("permanentDelete", { modelName: "Unit", id: "unit-perm" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.archiveKey).toContain("private/archives/Unit/unit-perm/");
      expect(result.relatedRecordCount).toBe(3); // 2 UnitFile + 1 UnitWord
      // Verify S3 was called for archiving
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });
  });

  describe("paginated join record listing", () => {
    it("handles pagination when listing join records during cascade", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: {
          getUnit: {
            id: "unit-paginated",
            owner: "instructor-1",
            _version: 1,
            deletedAt: null,
          },
        },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnit: { id: "unit-paginated", _version: 2 } },
      });

      // UnitFile first page (has nextToken)
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [{ id: "uf-page1", _version: 1, deletedAt: null }],
            nextToken: "page2-token",
          },
        },
      });
      // UnitFile second page
      mockGraphql.mockResolvedValueOnce({
        data: {
          listUnitFiles: {
            items: [{ id: "uf-page2", _version: 1, deletedAt: null }],
            nextToken: null,
          },
        },
      });
      // Update both
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-page1" } },
      });
      mockGraphql.mockResolvedValueOnce({
        data: { updateUnitFile: { id: "uf-page2" } },
      });

      // Remaining join tables empty
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
        createEvent("softDelete", { modelName: "Unit", id: "unit-paginated" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.cascadedJoinRecords).toBe(2); // 1 from page1 + 1 from page2
    });
  });
});

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
import { gunzipSync, gzipSync } from "node:zlib";
import { clearSchemaCache } from "./schemaSelection";
import { introspectionResult } from "./fakeSchema";

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

vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: () => async () => ({}),
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
process.env.API_ENDPOINT = "https://example.appsync-api.us-east-1.amazonaws.com/graphql";
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

/**
 * Answers GraphQL calls by operation: the schema introspection the handler
 * makes, plus whatever the test handles. Unhandled operations fail loudly.
 */
function routeGraphql(handlers: Record<string, (variables: any) => unknown>) {
  mockGraphql.mockImplementation(async ({ query, variables }: any) => {
    if (query.includes("__type")) return { data: introspectionResult(variables.name) };
    const name = /(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? "";
    const handle = handlers[name];
    if (!handle) throw new Error(`Unhandled GraphQL operation: ${name}`);
    return { data: handle(variables) };
  });
}

const archivedPayload = () =>
  JSON.parse(gunzipSync(Buffer.from(mockS3Send.mock.calls[0][0].Body)).toString("utf-8"));

describe("recycleBin handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGraphql.mockReset();
    mockS3Send.mockReset();
    clearSchemaCache();
  });

  describe("configuration", () => {
    it("reports a missing API endpoint instead of failing on every call", async () => {
      const endpoint = process.env.API_ENDPOINT;
      delete process.env.API_ENDPOINT;
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      // A fresh module, since the first call configures once
      vi.resetModules();
      const { handler: fresh } = await import("../../../amplify/functions/recycleBin/handler");
      const result = await fresh(createEvent("softDelete", { modelName: "Unit", id: "u1" }), {} as any, vi.fn());

      expect(result).toEqual({ success: false, message: "API_ENDPOINT is not configured" });
      process.env.API_ENDPOINT = endpoint;
      spy.mockRestore();
    });
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
      routeGraphql({
        GetUnitFull: () => ({
          getUnit: { id: "u1", owner: "user-123", name: "Unit", _version: 2, deletedAt: "2026-01-01" },
        }),
        ListUnitFileByunitID: () => ({ listUnitFiles: { items: [], nextToken: null } }),
        ListUnitWordByunitID: () => ({ listUnitWords: { items: [], nextToken: null } }),
        ListQuestionUnitByunitID: () => ({ listQuestionUnits: { items: [], nextToken: null } }),
        ListUnitDocumentByunitID: () => ({ listUnitDocuments: { items: [], nextToken: null } }),
        DeleteUnit: () => ({ deleteUnit: { id: "u1" } }),
      });
      mockS3Send.mockResolvedValueOnce({});

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

    it("reads every stored field of the record, not a fixed few", async () => {
      routeGraphql({
        GetUnitFull: () => ({ getUnit: { id: "u1", owner: "user-123", _version: 1 } }),
        ListUnitFileByunitID: () => ({ listUnitFiles: { items: [], nextToken: null } }),
        ListUnitWordByunitID: () => ({ listUnitWords: { items: [], nextToken: null } }),
        ListQuestionUnitByunitID: () => ({ listQuestionUnits: { items: [], nextToken: null } }),
        ListUnitDocumentByunitID: () => ({ listUnitDocuments: { items: [], nextToken: null } }),
        DeleteUnit: () => ({ deleteUnit: { id: "u1" } }),
      });
      mockS3Send.mockResolvedValueOnce({});

      await handler(createEvent("permanentDelete", { modelName: "Unit", id: "u1" }), {} as any, vi.fn());

      const read = mockGraphql.mock.calls.map(([arg]) => arg.query as string).find((q) => q.includes("GetUnitFull"))!;
      expect(read).toContain("name");
      expect(read).toContain("tags");
      expect(read).toContain("settings { mode palette { primary } }");
      expect(read).not.toContain("section");
    });

    it("deletes by id only, which is all the delete mutation accepts", async () => {
      routeGraphql({
        GetUnitFull: () => ({ getUnit: { id: "u1", owner: "user-123", _version: 4 } }),
        ListUnitFileByunitID: () => ({
          listUnitFiles: { items: [{ id: "uf1", _version: 3, owner: "user-123" }], nextToken: null },
        }),
        ListUnitWordByunitID: () => ({ listUnitWords: { items: [], nextToken: null } }),
        ListQuestionUnitByunitID: () => ({ listQuestionUnits: { items: [], nextToken: null } }),
        ListUnitDocumentByunitID: () => ({ listUnitDocuments: { items: [], nextToken: null } }),
        DeleteUnitFile: () => ({ deleteUnitFile: { id: "uf1" } }),
        DeleteUnit: () => ({ deleteUnit: { id: "u1" } }),
      });
      mockS3Send.mockResolvedValueOnce({});

      await handler(createEvent("permanentDelete", { modelName: "Unit", id: "u1" }), {} as any, vi.fn());

      const inputs = mockGraphql.mock.calls
        .map(([arg]) => arg)
        .filter((arg) => /mutation Delete/.test(arg.query))
        .map((arg) => arg.variables.input);
      expect(inputs).toEqual([{ id: "uf1" }, { id: "u1" }]);
    });

    it("archives a document with its links and ParsedContent chunks, then removes them all", async () => {
      const chunk = (i: number) => ({
        id: `doc-1-chunk-${i}`,
        owner: "user-123",
        documentID: "doc-1",
        chunkIndex: i,
        chunkCount: 2,
        questionsJSON: [{ prompt: `Q${i}`, answer: "A", page: i + 1 }],
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      const link = { id: "dq1", owner: "user-123", documentID: "doc-1", questionID: "q1", page: 3, sourceText: "snippet", entryKey: "q0" };
      const empty = (key: string) => () => ({ [key]: { items: [], nextToken: null } });
      routeGraphql({
        GetDocumentFull: () => ({ getDocument: { id: "doc-1", owner: "user-123", filename: "a.pdf", _version: 2 } }),
        ListUnitDocumentBydocumentID: empty("listUnitDocuments"),
        ListDocumentWordBydocumentID: empty("listDocumentWords"),
        ListDocumentQuestionBydocumentID: () => ({ listDocumentQuestions: { items: [link], nextToken: null } }),
        ListParsedContentBydocumentID: () => ({ listParsedContents: { items: [chunk(0), chunk(1)], nextToken: null } }),
        DeleteDocumentQuestion: () => ({ deleteDocumentQuestion: { id: "dq1" } }),
        DeleteParsedContent: () => ({ deleteParsedContent: { id: "x" } }),
        DeleteDocument: () => ({ deleteDocument: { id: "doc-1" } }),
      });
      mockS3Send.mockResolvedValueOnce({});

      const result = await handler(
        createEvent("permanentDelete", { modelName: "Document", id: "doc-1" }),
        {} as any,
        vi.fn(),
      );

      expect(result.success).toBe(true);
      expect(result.relatedRecordCount).toBe(3);

      const archive = archivedPayload();
      expect(archive.relatedRecords.ParsedContent.map((c: any) => c.id)).toEqual(["doc-1-chunk-0", "doc-1-chunk-1"]);
      expect(archive.relatedRecords.ParsedContent[1].questionsJSON).toEqual([{ prompt: "Q1", answer: "A", page: 2 }]);
      // The link keeps where the question came from
      expect(archive.relatedRecords.DocumentQuestion[0]).toMatchObject({ page: 3, sourceText: "snippet", entryKey: "q0" });

      const deleted = mockGraphql.mock.calls
        .map(([arg]) => arg)
        .filter((arg) => /mutation Delete/.test(arg.query))
        .map((arg) => arg.variables.input.id);
      expect(deleted).toEqual(["dq1", "doc-1-chunk-0", "doc-1-chunk-1", "doc-1"]);
    });

    it("does not delete anything when the archive cannot be written", async () => {
      routeGraphql({
        GetUnitFull: () => ({ getUnit: { id: "u1", owner: "user-123", _version: 1 } }),
        ListUnitFileByunitID: () => ({ listUnitFiles: { items: [], nextToken: null } }),
        ListUnitWordByunitID: () => ({ listUnitWords: { items: [], nextToken: null } }),
        ListQuestionUnitByunitID: () => ({ listQuestionUnits: { items: [], nextToken: null } }),
        ListUnitDocumentByunitID: () => ({ listUnitDocuments: { items: [], nextToken: null } }),
      });
      mockS3Send.mockRejectedValueOnce(new Error("S3 down"));

      const result = await handler(createEvent("permanentDelete", { modelName: "Unit", id: "u1" }), {} as any, vi.fn());

      expect(result).toMatchObject({ success: false, message: "S3 down" });
      expect(mockGraphql.mock.calls.some(([arg]) => /mutation Delete/.test(arg.query))).toBe(false);
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

  describe("unarchiveRecord", () => {
    const archiveBody = (payload: unknown) => ({
      Body: { transformToByteArray: async () => gzipSync(JSON.stringify(payload)) },
    });

    it("recreates the record, its links and chunks, sending only fields the create mutation accepts", async () => {
      mockS3Send.mockResolvedValueOnce(
        archiveBody({
          model: "Document",
          id: "doc-1",
          record: {
            id: "doc-1",
            owner: "user-123",
            filename: "a.pdf",
            _version: 5,
            _lastChangedAt: 1,
            _deleted: null,
            deletedAt: "2026-01-01",
            deletedBy: "user-123",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
          relatedRecords: {
            DocumentQuestion: [
              { id: "dq1", documentID: "doc-1", questionID: "q1", page: 3, sourceText: "snippet", entryKey: "q0", createdAt: "x", updatedAt: "y", deletedAt: "2026-01-01" },
            ],
            ParsedContent: [
              { id: "doc-1-chunk-0", documentID: "doc-1", chunkIndex: 0, chunkCount: 1, questionsJSON: [{ prompt: "Q", answer: "A", page: 1 }], createdAt: "x", updatedAt: "y" },
            ],
          },
        }),
      );
      routeGraphql({
        GetDocument: () => ({ getDocument: null }),
        CreateDocument: () => ({ createDocument: { id: "doc-1" } }),
        CreateDocumentQuestion: () => ({ createDocumentQuestion: { id: "dq1" } }),
        CreateParsedContent: () => ({ createParsedContent: { id: "doc-1-chunk-0" } }),
      });

      const result = await handler(
        createEvent("unarchiveRecord", { archiveKey: "private/archives/Document/doc-1/x.json.gz" }),
        {} as any,
        vi.fn(),
      );

      expect(result).toMatchObject({ success: true, id: "doc-1", restoredJoinRecords: 2 });

      const created = Object.fromEntries(
        mockGraphql.mock.calls
          .map(([arg]) => arg)
          .filter((arg) => /mutation Create/.test(arg.query))
          .map((arg) => [/mutation (\w+)/.exec(arg.query)![1], arg.variables.input]),
      );
      expect(created.CreateDocument).toEqual({
        id: "doc-1",
        owner: "user-123",
        filename: "a.pdf",
        deletedAt: null,
        deletedBy: null,
      });
      expect(created.CreateDocumentQuestion).toEqual({
        id: "dq1",
        documentID: "doc-1",
        questionID: "q1",
        page: 3,
        sourceText: "snippet",
        entryKey: "q0",
        deletedAt: null,
      });
      expect(created.CreateParsedContent).toEqual({
        id: "doc-1-chunk-0",
        documentID: "doc-1",
        chunkIndex: 0,
        chunkCount: 1,
        questionsJSON: [{ prompt: "Q", answer: "A", page: 1 }],
      });
    });

    it("does not overwrite a record that already exists", async () => {
      mockS3Send.mockResolvedValueOnce(
        archiveBody({ model: "Document", id: "doc-1", record: { id: "doc-1" }, relatedRecords: {} }),
      );
      routeGraphql({ GetDocument: () => ({ getDocument: { id: "doc-1" } }) });

      const result = await handler(
        createEvent("unarchiveRecord", { archiveKey: "k" }),
        {} as any,
        vi.fn(),
      );

      expect(result).toMatchObject({ success: false });
      expect(mockGraphql.mock.calls.some(([arg]) => /mutation Create/.test(arg.query))).toBe(false);
    });
  });

  describe("a file and its document", () => {
    const FILE_JOINS = {
      ListUnitFileByfileID: "listUnitFiles",
      ListWordFileByfileID: "listWordFiles",
      ListQuestionFileByfileID: "listQuestionFiles",
      ListAssistantChatFileByfileID: "listAssistantChatFiles",
    };
    const DOCUMENT_JOINS = {
      ListUnitDocumentBydocumentID: "listUnitDocuments",
      ListDocumentWordBydocumentID: "listDocumentWords",
    };
    const empty = (key: string) => () => ({ [key]: { items: [], nextToken: null } });
    const emptyJoins = (joins: Record<string, string>) =>
      Object.fromEntries(Object.entries(joins).map(([operation, key]) => [operation, empty(key)]));

    const updates = (model: string) =>
      mockGraphql.mock.calls
        .map(([arg]) => arg)
        .filter((arg) => arg.query.includes(`Update${model}DeletedAt`))
        .map((arg) => arg.variables.input);

    const when = "2026-02-01T10:00:00.000Z";
    const doc = (extra: Record<string, unknown> = {}) => ({
      id: "doc-1",
      owner: "user-123",
      _version: 3,
      deletedAt: null,
      ...extra,
    });
    const file = (extra: Record<string, unknown> = {}) => ({
      id: "f1",
      owner: "user-123",
      _version: 2,
      deletedAt: null,
      documentID: "doc-1",
      ...extra,
    });

    describe("soft delete", () => {
      const route = (files: unknown[], document: unknown = doc()) =>
        routeGraphql({
          GetFile: () => ({ getFile: file() }),
          UpdateFileDeletedAt: () => ({ updateFile: { id: "f1" } }),
          GetDocument: () => ({ getDocument: document }),
          UpdateDocumentDeletedAt: () => ({ updateDocument: { id: "doc-1" } }),
          ListFileBydocumentID: () => ({ listFiles: { items: files, nextToken: null } }),
          ...emptyJoins(FILE_JOINS),
          ...emptyJoins(DOCUMENT_JOINS),
          ListDocumentQuestionBydocumentID: () => ({
            listDocumentQuestions: {
              items: [{ id: "dq1", _version: 1, deletedAt: null }],
              nextToken: null,
            },
          }),
          UpdateDocumentQuestionDeletedAt: () => ({ updateDocumentQuestion: { id: "dq1" } }),
        });

      it("deletes the file's document with it, and the document's links, at the same time", async () => {
        route([{ id: "f1", deletedAt: null }]);

        const result = await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ success: true, documentDeleted: true });
        const [fileUpdate] = updates("File");
        const [documentUpdate] = updates("Document");
        expect(documentUpdate).toMatchObject({ id: "doc-1", deletedBy: "user-123", _version: 3 });
        expect(documentUpdate.deletedAt).toBe(fileUpdate.deletedAt);
        expect(updates("DocumentQuestion")).toEqual([
          { id: "dq1", deletedAt: fileUpdate.deletedAt, _version: 1 },
        ]);
      });

      it("keeps the document while another file still uses it", async () => {
        route([
          { id: "f1", deletedAt: null },
          { id: "f2", deletedAt: null },
        ]);

        const result = await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ success: true, documentDeleted: false });
        expect(updates("Document")).toEqual([]);
      });

      it("deletes the document when the other files using it are already deleted", async () => {
        route([
          { id: "f1", deletedAt: null },
          { id: "f2", deletedAt: "2026-01-01T00:00:00.000Z" },
        ]);

        const result = await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ documentDeleted: true });
      });

      it("leaves a document that is already deleted or belongs to someone else", async () => {
        route([{ id: "f1" }], doc({ deletedAt: "2026-01-01T00:00:00.000Z" }));
        expect(
          await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn()),
        ).toMatchObject({ documentDeleted: false });

        mockGraphql.mockReset();
        route([{ id: "f1" }], doc({ owner: "someone-else" }));
        expect(
          await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn()),
        ).toMatchObject({ documentDeleted: false });
        expect(updates("Document")).toEqual([]);
      });

      it("still deletes the file when its document cannot be deleted", async () => {
        route([{ id: "f1", deletedAt: null }]);
        const original = mockGraphql.getMockImplementation()!;
        mockGraphql.mockImplementation(async (arg: any) => {
          if (arg.query.includes("UpdateDocumentDeletedAt")) throw new Error("denied");
          return original(arg);
        });
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ success: true, documentDeleted: false });
        expect(updates("File")).toHaveLength(1);
        spy.mockRestore();
      });

      it("has nothing to do for a file with no document", async () => {
        routeGraphql({
          GetFile: () => ({ getFile: file({ documentID: null }) }),
          UpdateFileDeletedAt: () => ({ updateFile: { id: "f1" } }),
          ...emptyJoins(FILE_JOINS),
        });

        const result = await handler(createEvent("softDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ success: true, documentDeleted: false });
      });
    });

    describe("restore", () => {
      const route = (document: unknown) =>
        routeGraphql({
          GetFile: () => ({ getFile: file({ deletedAt: when }) }),
          UpdateFileDeletedAt: () => ({ updateFile: { id: "f1" } }),
          GetDocument: () => ({ getDocument: document }),
          UpdateDocumentDeletedAt: () => ({ updateDocument: { id: "doc-1" } }),
          ...emptyJoins(FILE_JOINS),
          ...emptyJoins(DOCUMENT_JOINS),
          ListDocumentQuestionBydocumentID: () => ({
            listDocumentQuestions: { items: [{ id: "dq1", _version: 1, deletedAt: when }], nextToken: null },
          }),
          UpdateDocumentQuestionDeletedAt: () => ({ updateDocumentQuestion: { id: "dq1" } }),
        });

      it("brings back the document that was deleted with the file, and its links", async () => {
        route(doc({ deletedAt: when, deletedBy: "user-123" }));

        const result = await handler(createEvent("restoreRecord", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ success: true, documentRestored: true });
        expect(updates("Document")).toEqual([{ id: "doc-1", deletedAt: null, deletedBy: null, _version: 3 }]);
        expect(updates("DocumentQuestion")).toEqual([{ id: "dq1", deletedAt: null, _version: 1 }]);
      });

      it("does not restore a document that was deleted separately, at another time", async () => {
        route(doc({ deletedAt: "2026-03-05T00:00:00.000Z" }));

        const result = await handler(createEvent("restoreRecord", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result).toMatchObject({ success: true, documentRestored: false });
        expect(updates("Document")).toEqual([]);
      });
    });

    describe("permanent delete", () => {
      const route = (files: unknown[], document: unknown = doc({ deletedAt: when })) => {
        routeGraphql({
          GetFileFull: () => ({ getFile: file({ deletedAt: when, name: "a.pdf" }) }),
          GetDocument: () => ({ getDocument: document }),
          GetDocumentFull: () => ({ getDocument: { ...(document as object), filename: "a.pdf" } }),
          ListFileBydocumentID: () => ({ listFiles: { items: files, nextToken: null } }),
          ...emptyJoins(FILE_JOINS),
          ...emptyJoins(DOCUMENT_JOINS),
          ListDocumentQuestionBydocumentID: empty("listDocumentQuestions"),
          ListParsedContentBydocumentID: () => ({
            listParsedContents: {
              items: [{ id: "doc-1-chunk-0", documentID: "doc-1", chunkIndex: 0 }],
              nextToken: null,
            },
          }),
          DeleteFile: () => ({ deleteFile: { id: "f1" } }),
          DeleteParsedContent: () => ({ deleteParsedContent: { id: "doc-1-chunk-0" } }),
          DeleteDocument: () => ({ deleteDocument: { id: "doc-1" } }),
        });
        mockS3Send.mockResolvedValue({});
      };
      const deleted = () =>
        mockGraphql.mock.calls
          .map(([arg]) => arg)
          .filter((arg) => /mutation Delete/.test(arg.query))
          .map((arg) => arg.variables.input.id);

      it("archives and removes the document, and its chunks, with the file", async () => {
        route([]);

        const result = await handler(createEvent("permanentDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result.success).toBe(true);
        expect(result.document).toMatchObject({ id: "doc-1" });
        expect(result.document.archiveKey).toContain("private/archives/Document/doc-1/");
        expect(mockS3Send).toHaveBeenCalledTimes(2);
        expect(deleted()).toEqual(["f1", "doc-1-chunk-0", "doc-1"]);
      });

      it("keeps the document when a live file uses it", async () => {
        route([{ id: "f2", deletedAt: null }]);

        const result = await handler(createEvent("permanentDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result.success).toBe(true);
        expect(result.document).toBeUndefined();
        expect(deleted()).toEqual(["f1"]);
      });

      it("keeps a document that was deleted separately", async () => {
        route([], doc({ deletedAt: "2026-03-05T00:00:00.000Z" }));

        const result = await handler(createEvent("permanentDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result.document).toBeUndefined();
        expect(deleted()).toEqual(["f1"]);
      });

      it("still reports success for the file when the document cannot be archived", async () => {
        route([]);
        mockS3Send.mockReset();
        mockS3Send.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("S3 down"));
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = await handler(createEvent("permanentDelete", { modelName: "File", id: "f1" }), {} as any, vi.fn());

        expect(result.success).toBe(true);
        expect(result.document).toMatchObject({ id: "doc-1", error: "S3 down" });
        expect(deleted()).toEqual(["f1"]);
        spy.mockRestore();
      });
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

import { beforeEach, describe, expect, it, vi } from "vitest";

const models = vi.hoisted(() => ({
  ParsedContent: { get: vi.fn(), list: vi.fn(), update: vi.fn() },
  // No relationship loader, so chunks are found with ParsedContent.list.
  Document: { get: vi.fn() },
  Word: { list: vi.fn(), create: vi.fn() },
  UnitWord: { list: vi.fn(), create: vi.fn() },
  DocumentWord: { list: vi.fn(), create: vi.fn() },
}));

vi.mock("../../src/utils/amplifyClient", () => ({
  getAmplifyClient: () => ({ models }),
}));
vi.mock("../../src/utils/parsedContentModeration", () => ({
  assertParsedContentImportAllowed: vi.fn().mockResolvedValue(undefined),
}));

import {
  getVocabularyImportStatus,
  importVocabularyToUnit,
  updateVocabularyItem,
} from "../../src/utils/vocabularyImportUtils";

const parsed = (overrides: Record<string, unknown> = {}) => ({
  id: "pc-1",
  documentID: "doc-1",
  _version: 3,
  vocabularyJSON: [
    { word: "Path", definition: "A Tree-line", page: 2, pages: [2, 9] },
    { word: "Aleph", definition: "Hebrew letter", context: null, page: 3 },
  ],
  ...overrides,
});

/** The document's stored chunks; `get` finds any one of them by id. */
function givenChunks(...records: Array<Record<string, any> | null>) {
  const live = records.filter((record): record is Record<string, any> => record !== null);
  models.ParsedContent.get.mockImplementation(async ({ id }: { id: string }) => ({
    data: live.find((record) => record.id === id) ?? null,
  }));
  models.ParsedContent.list.mockResolvedValue({ data: live });
}

beforeEach(() => {
  vi.clearAllMocks();
  models.Document.get.mockResolvedValue({ data: { id: "doc-1" } });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  models.Word.list.mockResolvedValue({ data: [] });
  models.Word.create.mockImplementation(async ({ phrase }) => ({
    data: { id: `word-${phrase}`, phrase },
  }));
  models.UnitWord.list.mockResolvedValue({ data: [] });
  models.UnitWord.create.mockResolvedValue({ data: { id: "uw" } });
  models.DocumentWord.list.mockResolvedValue({ data: [] });
  models.DocumentWord.create.mockResolvedValue({ data: { id: "dw" } });
  models.ParsedContent.update.mockResolvedValue({ data: {} });
});

describe("importVocabularyToUnit", () => {
  it("imports typed-array vocabulary, links it, and marks the record imported", async () => {
    givenChunks(parsed());

    const result = await importVocabularyToUnit("pc-1", "unit-1", null, "owner", "identity");

    expect(result).toMatchObject({ success: true, imported: 2, skipped: 0, errors: 0 });
    expect(models.Word.create).toHaveBeenCalledWith(
      expect.objectContaining({ phrase: "Path", definition: "A Tree-line" }),
    );
    expect(models.UnitWord.create).toHaveBeenCalledTimes(2);

    // Each word is linked to its document with where it came from
    expect(models.DocumentWord.create).toHaveBeenCalledTimes(2);
    expect(models.DocumentWord.create).toHaveBeenCalledWith({
      wordID: "word-Path",
      documentID: "doc-1",
      owner: "owner",
      page: 2,
      entryKey: "path",
    });

    const update = models.ParsedContent.update.mock.calls[0][0];
    expect(update).toMatchObject({ id: "pc-1", _version: 3 });
    expect(update.importedAt).toEqual(expect.any(String));
    expect(update).not.toHaveProperty("approved");
  });

  it("still reads legacy JSON-string vocabulary", async () => {
    givenChunks(parsed({ vocabularyJSON: JSON.stringify([{ word: "Old", definition: "d" }]) }));
    const result = await importVocabularyToUnit("pc-1", "unit-1", null, "o", "i");
    expect(result).toMatchObject({ success: true, imported: 1 });
  });

  it("imports only the selected indices and skips words that already exist", async () => {
    givenChunks(parsed());
    models.Word.list.mockResolvedValue({ data: [{ id: "w1", phrase: "Aleph" }] });

    const result = await importVocabularyToUnit("pc-1", "unit-1", [1], "o", "i");

    expect(result).toMatchObject({ imported: 0, skipped: 1 });
    expect(models.Word.create).not.toHaveBeenCalled();
    // An existing word is still linked to this document
    expect(models.DocumentWord.create).toHaveBeenCalledWith(
      expect.objectContaining({ wordID: "w1", documentID: "doc-1", entryKey: "aleph" }),
    );
  });

  it("does not link a word to the document twice", async () => {
    givenChunks(parsed());
    models.DocumentWord.list.mockResolvedValue({
      data: [{ id: "dw-1", documentID: "doc-1", wordID: "word-Path", entryKey: "path" }],
    });

    await importVocabularyToUnit("pc-1", "unit-1", null, "o", "i");

    expect(models.DocumentWord.create).toHaveBeenCalledTimes(1);
    expect(models.DocumentWord.create).toHaveBeenCalledWith(
      expect.objectContaining({ wordID: "word-Aleph" }),
    );
  });

  it("reports an empty or missing record without throwing", async () => {
    givenChunks(parsed({ vocabularyJSON: [] }));
    expect(await importVocabularyToUnit("pc-1", "u", null, "o", "i")).toMatchObject({
      success: true,
      imported: 0,
      message: "No vocabulary items to import",
    });

    givenChunks(null);
    expect(await importVocabularyToUnit("missing", "u", null, "o", "i")).toMatchObject({
      success: false,
    });
  });
});

describe("getVocabularyImportStatus", () => {
  it("derives approval from the import timestamp and returns array items", async () => {
    givenChunks(parsed({ importedAt: "2026-10-25T00:00:00.000Z" }));
    const status = await getVocabularyImportStatus("pc-1");
    expect(status).toMatchObject({
      found: true,
      imported: true,
      approved: true,
      itemCount: 2,
    });
    expect(status.vocabularyItems).toHaveLength(2);
  });

  it("is not approved before import, and reports a missing record", async () => {
    givenChunks(parsed());
    expect(await getVocabularyImportStatus("pc-1")).toMatchObject({
      imported: false,
      approved: false,
    });
    givenChunks(null);
    expect(await getVocabularyImportStatus("nope")).toMatchObject({ found: false });
  });
});

describe("updateVocabularyItem", () => {
  it("writes typed entries with only declared fields and the record version", async () => {
    givenChunks(parsed());

    const ok = await updateVocabularyItem("pc-1", 0, { definition: "Edited", editedBy: "ui" });

    expect(ok).toBe(true);
    expect(models.ParsedContent.update).toHaveBeenCalledWith({
      id: "pc-1",
      _version: 3,
      vocabularyJSON: [
        { word: "Path", definition: "Edited", page: 2, pages: [2, 9] },
        { word: "Aleph", definition: "Hebrew letter", page: 3 },
      ],
    });
  });

  it("rejects an out-of-range index without writing", async () => {
    givenChunks(parsed());
    expect(await updateVocabularyItem("pc-1", 9, { definition: "x" })).toBe(false);
    expect(models.ParsedContent.update).not.toHaveBeenCalled();
  });
});

describe("a document stored as several chunks", () => {
  const chunk0 = (overrides: Record<string, unknown> = {}) => ({
    id: "doc-1-chunk-0",
    documentID: "doc-1",
    _version: 3,
    chunkIndex: 0,
    chunkCount: 2,
    vocabularyJSON: [{ word: "Path", definition: "A line", page: 1 }],
    ...overrides,
  });
  const chunk1 = (overrides: Record<string, unknown> = {}) => ({
    id: "doc-1-chunk-1",
    documentID: "doc-1",
    _version: 8,
    chunkIndex: 1,
    chunkCount: 2,
    vocabularyJSON: [
      { word: "Aleph", definition: "Hebrew letter", page: 5 },
      { word: "Beth", definition: "House", page: 6 },
    ],
    ...overrides,
  });

  it("imports the vocabulary of every chunk and marks only the primary record imported", async () => {
    givenChunks(chunk1(), chunk0());

    const result = await importVocabularyToUnit("doc-1-chunk-1", "unit-1", null, "o", "i");

    expect(result).toMatchObject({ success: true, imported: 3 });
    expect(models.Word.create).toHaveBeenCalledTimes(3);
    expect(models.ParsedContent.update).toHaveBeenCalledTimes(1);
    expect(models.ParsedContent.update.mock.calls[0][0]).toMatchObject({
      id: "doc-1-chunk-0",
      _version: 3,
    });
  });

  it("counts the items of every chunk in the import status", async () => {
    givenChunks(chunk0({ importedAt: "2026-10-25T00:00:00.000Z" }), chunk1());
    expect(await getVocabularyImportStatus("doc-1-chunk-0")).toMatchObject({
      imported: true,
      itemCount: 3,
    });
  });

  it("edits an item by its position in the merged list and writes only the chunk that holds it", async () => {
    givenChunks(chunk0(), chunk1());

    // Merged order: Path (chunk 0), Aleph, Beth (chunk 1).
    const ok = await updateVocabularyItem("doc-1-chunk-0", 2, { definition: "A house" });

    expect(ok).toBe(true);
    expect(models.ParsedContent.update).toHaveBeenCalledTimes(1);
    expect(models.ParsedContent.update).toHaveBeenCalledWith({
      id: "doc-1-chunk-1",
      _version: 8,
      vocabularyJSON: [
        { word: "Aleph", definition: "Hebrew letter", page: 5 },
        { word: "Beth", definition: "A house", page: 6 },
      ],
    });
  });
});


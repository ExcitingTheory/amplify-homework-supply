import { describe, expect, it, vi } from "vitest";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  buildEmbeddingFile,
  buildEmbeddingInfo,
  buildEmbeddingItems,
  embedItems,
  embeddingObjectKey,
} from "../../../amplify/functions/embeddings/embeddingItems";

describe("buildEmbeddingItems", () => {
  it("turns vocabulary and summaries into embeddable text", () => {
    const items = buildEmbeddingItems({
      vocabularyJSON: [
        { word: "Path", definition: "A Tree-line", context: "Kabbalah", page: 3 },
        { word: "Aleph", definition: "Hebrew letter" },
      ],
      summariesJSON: [{ title: "Overview", content: "A summary." }],
    });
    expect(items).toEqual([
      {
        type: "vocabulary",
        page: 3,
        text: "Path - A Tree-line (Kabbalah)",
        sourceId: "Path",
      },
      { type: "vocabulary", page: 0, text: "Aleph - Hebrew letter", sourceId: "Aleph" },
      { type: "summary", page: 0, text: "A summary.", sourceId: "Overview" },
    ]);
  });

  it("accepts typed arrays, JSON strings from older records, and junk", () => {
    const fromString = buildEmbeddingItems({
      vocabularyJSON: JSON.stringify([{ word: "w", definition: "d" }]),
    });
    expect(fromString.map((item) => item.text)).toEqual(["w - d"]);
    expect(buildEmbeddingItems({ vocabularyJSON: "{not json", summariesJSON: null })).toEqual([]);
    expect(buildEmbeddingItems({ vocabularyJSON: [null, 4, "x"] })).toEqual([]);
  });

  it("skips empty summaries and caps item length", () => {
    const items = buildEmbeddingItems({
      summariesJSON: [{ title: "empty", content: "   " }, { title: "big", content: "x".repeat(9000) }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].text).toHaveLength(8000);
  });
});

describe("embedItems", () => {
  it("skips an item that fails to embed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const embed = vi
      .fn<(text: string) => Promise<number[]>>()
      .mockResolvedValueOnce([1, 2])
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([3, 4]);
    const items = ["a", "b", "c"].map((text) => ({
      type: "vocabulary" as const,
      page: 1,
      text,
      sourceId: text,
    }));
    const embedded = await embedItems(items, embed);
    expect(embedded.map((item) => item.sourceId)).toEqual(["a", "c"]);
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});

describe("embedding file and metadata", () => {
  const embedded = [
    { type: "vocabulary" as const, page: 2, text: "one two", sourceId: "a", embedding: [0.1, 0.2] },
    { type: "summary" as const, page: 0, text: "x".repeat(300), sourceId: "b", embedding: [0.3, 0.4] },
  ];

  it("builds the S3 document with truncated previews", () => {
    const file = buildEmbeddingFile(embedded, 123);
    expect(file).toMatchObject({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      generatedAt: 123,
      wordCount: 3,
    });
    expect(file.pages[0]).toEqual({ page: 2, embedding: [0.1, 0.2], text: "one two" });
    expect(file.pages[1].text).toHaveLength(200);
  });

  it("builds File.embedding as an object with exactly the schema's fields", () => {
    expect(buildEmbeddingInfo(embedded, 456)).toEqual({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      version: 456,
      wordCount: 3,
      pageCount: 2,
    });
  });

  it("stores vectors under the owner's private area, keyed by file", () => {
    expect(embeddingObjectKey("us-east-1:abc", "file-1")).toBe(
      "private/us-east-1:abc/embeddings/file/file-1.json",
    );
  });
});

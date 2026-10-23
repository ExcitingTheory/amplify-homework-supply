import { describe, expect, it, vi } from "vitest";
import {
  assertParsedContentImportAllowed,
  getParsedContentModeration,
} from "../../src/utils/parsedContentModeration";

describe("ParsedContent moderation access", () => {
  it("allows imports when the document has no moderation flag", () => {
    expect(
      getParsedContentModeration({
        metadata: JSON.stringify({ analysis: { state: "completed" } }),
      }),
    ).toEqual({ blocked: false, categories: [] });
  });

  it("blocks flagged documents and lists flagged categories", () => {
    expect(
      getParsedContentModeration({
        metadata: {
          analysis: {
            moderation: {
              flagged: true,
              categories: { violence: true, sexual: false },
            },
          },
        },
      }),
    ).toEqual({ blocked: true, categories: ["violence"] });
  });

  it("fails closed when moderation metadata cannot be parsed", () => {
    expect(getParsedContentModeration({ metadata: "{" })).toMatchObject({
      blocked: true,
      categories: [],
      error: expect.stringContaining("invalid"),
    });
  });

  it("rejects imports for flagged or unavailable documents", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        metadata: {
          analysis: { moderation: { flagged: true, categories: { hate: true } } },
        },
      },
    });
    const client = { models: { Document: { get } } };

    await expect(
      assertParsedContentImportAllowed(client, { documentID: "doc-1" }),
    ).rejects.toThrow("flagged for review: hate");
    expect(get).toHaveBeenCalledWith({ id: "doc-1" });

    get.mockResolvedValue({ data: null, errors: [] });
    await expect(
      assertParsedContentImportAllowed(client, { documentID: "doc-1" }),
    ).rejects.toThrow("Unable to verify moderation status");
  });
});

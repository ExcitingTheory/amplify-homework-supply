import { describe, expect, it } from "vitest";
import {
  createResponseBlockId,
  resolveResponseBlockId,
} from "../../src/utils/responseBlockId";

describe("response block IDs", () => {
  it("keeps an ID persisted in Lexical JSON", () => {
    expect(resolveResponseBlockId("persisted-id", "answer", {})).toBe(
      "persisted-id",
    );
  });

  it("derives the same fallback ID for an older serialized block", () => {
    const serialized = { wordIDs: ["word-1"], promptMethod: ["phrase"] };
    expect(resolveResponseBlockId(undefined, "answer", serialized)).toBe(
      resolveResponseBlockId(undefined, "answer", serialized),
    );
    expect(createResponseBlockId()).not.toContain(":");
  });
});

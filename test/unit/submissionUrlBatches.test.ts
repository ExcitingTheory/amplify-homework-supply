import { describe, expect, it, vi } from "vitest";
import {
  getSubmissionUrlsInBatches,
  MAX_SUBMISSION_KEYS_PER_REQUEST,
} from "../../src/utils/submissionUrlBatches";

describe("getSubmissionUrlsInBatches", () => {
  it("combines response maps while keeping each request within the limit", async () => {
    const keys = Array.from({ length: 205 }, (_, index) => `key-${index}`);
    const getBatch = vi.fn(async (batch: string[]) =>
      Object.fromEntries(batch.map((key) => [key, `signed:${key}`])),
    );

    const result = await getSubmissionUrlsInBatches(keys, getBatch);

    expect(getBatch.mock.calls.map(([batch]) => batch.length)).toEqual([
      100,
      100,
      5,
    ]);
    expect(
      getBatch.mock.calls.every(
        ([batch]) => batch.length <= MAX_SUBMISSION_KEYS_PER_REQUEST,
      ),
    ).toBe(true);
    expect(Object.keys(result)).toHaveLength(keys.length);
    expect(result["key-204"]).toBe("signed:key-204");
  });
});

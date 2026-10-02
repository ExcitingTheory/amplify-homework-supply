import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "../fuzzyMatch";

describe("fuzzyMatch", () => {
  it("matches everything for an empty query", () => {
    expect(fuzzyMatch("  ", "Alice Johnson")).toEqual({
      score: 0,
      indices: [],
    });
  });

  it("prefers a contiguous, case-insensitive substring", () => {
    expect(fuzzyMatch("JOHN", "Alice Johnson")).toEqual({
      score: 6,
      indices: [6, 7, 8, 9],
    });
  });

  it("matches characters in order with gaps", () => {
    expect(fuzzyMatch("ajn", "Alice Johnson")?.indices).toEqual([0, 6, 9]);
  });

  it("ranks substring matches ahead of scattered matches", () => {
    const substring = fuzzyMatch("son", "Alice Johnson")!;
    const scattered = fuzzyMatch("asn", "Alice Johnson")!;
    expect(substring.score).toBeLessThan(scattered.score);
  });

  it("ignores spaces in scattered queries", () => {
    expect(fuzzyMatch("a j", "Alice Johnson")?.indices).toEqual([0, 6]);
  });

  it("returns null when characters are missing or out of order", () => {
    expect(fuzzyMatch("xyz", "Alice Johnson")).toBeNull();
    expect(fuzzyMatch("ja", "Alice Johnson")).toBeNull();
  });
});

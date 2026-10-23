import { describe, expect, it, vi } from "vitest";
import { findFirstFilteredRecord } from "../../../scripts/thoth/findFirstFilteredRecord";

describe("Thoth filtered record pagination", () => {
  const record = { id: "matching-record" };

  it("continues across empty and null-only scan pages", async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ data: [], nextToken: "page-2" })
      .mockResolvedValueOnce({ data: [null], nextToken: "page-3" })
      .mockResolvedValueOnce({ data: [null, record], nextToken: "unused" });

    await expect(findFirstFilteredRecord(fetchPage, "Thoth Document")).resolves.toEqual(record);
    expect(fetchPage.mock.calls).toEqual([[undefined], ["page-2"], ["page-3"]]);
  });

  it("stops as soon as a match is found", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [record], nextToken: "unused" });

    await expect(findFirstFilteredRecord(fetchPage, "Thoth ParsedContent")).resolves.toEqual(record);
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  it("returns no match only after exhausting all pages", async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ data: [], nextToken: "page-2" })
      .mockResolvedValueOnce({ data: [], nextToken: null });

    await expect(findFirstFilteredRecord(fetchPage, "Thoth Document")).resolves.toBeUndefined();
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("starts a fresh scan for each polling attempt", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [], nextToken: null });

    await findFirstFilteredRecord(fetchPage, "Thoth Document");
    await findFirstFilteredRecord(fetchPage, "Thoth Document");
    expect(fetchPage.mock.calls).toEqual([[undefined], [undefined]]);
  });

  it("reports GraphQL errors on later pages instead of treating them as no match", async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ data: [], nextToken: "page-2" })
      .mockResolvedValueOnce({ data: [record], errors: [{ message: "Unauthorized" }] });

    await expect(findFirstFilteredRecord(fetchPage, "Thoth ParsedContent"))
      .rejects.toThrow('Failed to fetch Thoth ParsedContent: [{"message":"Unauthorized"}]');
  });

  it("propagates network errors", async () => {
    const fetchPage = vi.fn().mockRejectedValue(new Error("Connection interrupted"));

    await expect(findFirstFilteredRecord(fetchPage, "Thoth Document"))
      .rejects.toThrow("Connection interrupted");
  });

  it("rejects a repeated continuation token instead of looping forever", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [], nextToken: "same-page" });

    await expect(findFirstFilteredRecord(fetchPage, "Thoth Document"))
      .rejects.toThrow("Repeated pagination token while fetching Thoth Document");
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});

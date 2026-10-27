import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { listUnitDocuments } from "../../src/utils/unitDocuments";
import { useUnitDocuments } from "../../src/hooks/useUnitDocuments";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../../src/utils/amplifyClient", () => ({ getAmplifyClient: () => mocks.client }));

const documents: Record<string, any> = {
  d1: { id: "d1", filename: "a.pdf" },
  d2: { id: "d2", filename: "b.pdf" },
  d3: { id: "d3", filename: "gone.pdf", deletedAt: "2026-10-01" },
};

const makeClient = (relation: unknown) => ({
  models: {
    Unit: { get: vi.fn(async () => ({ data: { unitDocuments: relation } })) },
    UnitDocument: { list: vi.fn() },
    Document: { get: vi.fn(async ({ id }: { id: string }) => ({ data: documents[id] ?? null })) },
  },
});

describe("listUnitDocuments", () => {
  it("lists the unit's documents once each, without recycled ones", async () => {
    const relation = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          { documentID: "d1" },
          { documentID: "d1" },
          { documentID: "d3" },
          { documentID: "d2", deletedAt: "2026-10-01" },
        ],
        nextToken: "t",
      })
      .mockResolvedValueOnce({ data: [{ documentID: "d2" }], nextToken: null });
    const client = makeClient(relation);

    expect(await listUnitDocuments(client, "u1")).toEqual([
      { id: "d1", filename: "a.pdf" },
      { id: "d2", filename: "b.pdf" },
    ]);
    expect(relation).toHaveBeenNthCalledWith(2, { limit: 100, nextToken: "t" });
    expect(client.models.Document.get).toHaveBeenCalledTimes(3);
  });

  it("falls back to a filtered list when the client has no relationship loaders", async () => {
    const client = makeClient(undefined);
    client.models.UnitDocument.list.mockResolvedValue({ data: [{ documentID: "d1" }], nextToken: null });

    expect(await listUnitDocuments(client, "u1")).toEqual([{ id: "d1", filename: "a.pdf" }]);
    expect(client.models.UnitDocument.list).toHaveBeenCalledWith({
      filter: { unitID: { eq: "u1" } },
      nextToken: undefined,
    });
  });

  it("names a document with no filename", async () => {
    const client = makeClient([{ documentID: "x" }]);
    client.models.Document.get.mockResolvedValue({ data: { id: "x" } });
    expect(await listUnitDocuments(client, "u1")).toEqual([{ id: "x", filename: "document" }]);
  });
});

describe("useUnitDocuments", () => {
  it("is empty until loaded, then lists the documents", async () => {
    mocks.client = makeClient([{ documentID: "d1" }]);
    const { result } = renderHook(() => useUnitDocuments("u1"));
    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current).toEqual([{ id: "d1", filename: "a.pdf" }]));
  });

  it("stays empty when loading fails", async () => {
    mocks.client = makeClient(undefined);
    mocks.client.models.Unit.get.mockRejectedValue(new Error("offline"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useUnitDocuments("u1"));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(result.current).toEqual([]);
    spy.mockRestore();
  });

  it("does not load while disabled or without a unit", async () => {
    mocks.client = makeClient([]);
    renderHook(() => useUnitDocuments("u1", { enabled: false }));
    renderHook(() => useUnitDocuments(undefined));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.client.models.Unit.get).not.toHaveBeenCalled();
  });
});

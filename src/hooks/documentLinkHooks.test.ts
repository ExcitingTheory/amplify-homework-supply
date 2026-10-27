import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDocumentLinks } from "./useDocumentLinks";
import { useItemSources } from "./useItemSources";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../utils/amplifyClient", () => ({ getAmplifyClient: () => mocks.client }));

const documentWithLinks = (links: any[]) => ({
  id: "doc-1",
  documentQuestions: vi.fn(async () => ({ data: links, nextToken: null })),
  documentWords: vi.fn(async () => ({ data: [], nextToken: null })),
});

describe("useDocumentLinks", () => {
  beforeEach(() => {
    mocks.client = {
      models: {
        Document: {
          get: vi.fn(async () => ({
            data: documentWithLinks([
              { id: "l1", documentID: "doc-1", questionID: "q1", entryKey: "a?" },
              { id: "l2", documentID: "doc-1", questionID: "q2", entryKey: "b?" },
            ]),
          })),
        },
      },
    };
  });

  it("is not loaded until the links arrive, then reports the imported keys", async () => {
    const { result } = renderHook(() => useDocumentLinks("doc-1", "question"));
    expect(result.current.loaded).toBe(false);
    expect(result.current.importedKeys.size).toBe(0);

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect([...result.current.importedKeys].sort()).toEqual(["a?", "b?"]);
  });

  it("keeps the same set when a refresh finds nothing new", async () => {
    const { result } = renderHook(() => useDocumentLinks("doc-1", "question"));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    const keys = result.current.importedKeys;

    act(() => result.current.refresh());
    await waitFor(() => expect(mocks.client.models.Document.get).toHaveBeenCalledTimes(2));
    await act(async () => {});

    expect(result.current.importedKeys).toBe(keys);
  });

  it("picks up links created since the last load after a refresh", async () => {
    const { result } = renderHook(() => useDocumentLinks("doc-1", "question"));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    mocks.client.models.Document.get.mockResolvedValue({
      data: documentWithLinks([{ id: "l3", documentID: "doc-1", questionID: "q3", entryKey: "c?" }]),
    });
    act(() => result.current.refresh());

    await waitFor(() => expect([...result.current.importedKeys]).toEqual(["c?"]));
  });

  it("offers every entry when the links cannot be loaded", async () => {
    mocks.client.models.Document.get.mockRejectedValue(new Error("offline"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useDocumentLinks("doc-1", "question"));

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.importedKeys.size).toBe(0);
    spy.mockRestore();
  });

  it("does not load while disabled", async () => {
    const { result } = renderHook(() => useDocumentLinks("doc-1", "question", { enabled: false }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(result.current.loaded).toBe(false);
    expect(mocks.client.models.Document.get).not.toHaveBeenCalled();
  });
});

describe("useItemSources", () => {
  beforeEach(() => {
    mocks.client = {
      models: {
        Question: {
          get: vi.fn(async () => ({
            data: {
              documentQuestions: vi.fn(async () => ({
                data: [{ id: "l1", documentID: "doc-1", questionID: "q1", page: 3 }],
                nextToken: null,
              })),
            },
          })),
        },
        Document: { get: vi.fn(async () => ({ data: { filename: "notes.pdf" } })) },
      },
    };
  });

  it("does not load until enabled, then loads once", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useItemSources("question", "q1", { enabled }),
      { initialProps: { enabled: false } },
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(result.current).toEqual([]);
    expect(mocks.client.models.Question.get).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]).toMatchObject({ filename: "notes.pdf", page: 3 });

    // Collapsing and expanding again does not fetch again
    rerender({ enabled: false });
    rerender({ enabled: true });
    await act(async () => {});
    expect(mocks.client.models.Question.get).toHaveBeenCalledTimes(1);
  });

  it("returns no sources when loading fails", async () => {
    mocks.client.models.Question.get.mockRejectedValue(new Error("offline"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useItemSources("question", "q1"));
    await waitFor(() => expect(spy).toHaveBeenCalled());

    expect(result.current).toEqual([]);
    spy.mockRestore();
  });
});

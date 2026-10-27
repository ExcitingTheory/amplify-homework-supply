import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDocumentParsedContent } from "./useDocumentParsedContent";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../utils/amplifyClient", () => ({ getAmplifyClient: () => mocks.client }));

const record = (index: number, count: number) => ({
  id: `doc-1-chunk-${index}`,
  documentID: "doc-1",
  chunkIndex: index,
  chunkCount: count,
  _version: 1,
  questionsJSON: [{ prompt: `q${index}`, answer: "a" }],
});

function makeClient(chunks: any[]) {
  const never = () => ({ subscribe: () => ({ unsubscribe: vi.fn() }) });
  return {
    models: {
      Document: { get: vi.fn(async () => ({ data: { id: "doc-1", filename: "a.pdf" } })) },
      ParsedContent: {
        get: vi.fn(async ({ id }: { id: string }) => ({
          data: chunks.find((c) => c.id === id) ?? null,
        })),
        list: vi.fn(async () => ({ data: chunks, nextToken: null })),
        onCreate: vi.fn(never),
        onUpdate: vi.fn(never),
        onDelete: vi.fn(never),
      },
    },
  };
}

describe("useDocumentParsedContent", () => {
  beforeEach(() => {
    mocks.client = makeClient([record(0, 2), record(1, 2)]);
  });

  it("reports loading, then the merged content", async () => {
    const { result } = renderHook(() => useDocumentParsedContent("doc-1"));
    expect(result.current.state).toBe("loading");

    await waitFor(() =>
      expect((result.current.parsedContent?.questionsJSON as any[] | undefined)?.length).toBe(2),
    );
    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.state).toBe("ready");
    expect(result.current.document?.filename).toBe("a.pdf");
  });

  it("does not load while disabled", async () => {
    const { result } = renderHook(() => useDocumentParsedContent("doc-1", { enabled: false }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(result.current.state).toBe("loading");
    expect(mocks.client.models.ParsedContent.get).not.toHaveBeenCalled();
  });

  it("does not show the previous document's content for a new document", async () => {
    const { result, rerender } = renderHook(({ id }) => useDocumentParsedContent(id), {
      initialProps: { id: "doc-1" },
    });
    await waitFor(() => expect(result.current.state).toBe("ready"));

    mocks.client = makeClient([]);
    rerender({ id: "doc-2" });
    expect(result.current.state).toBe("loading");
    expect(result.current.parsedContent).toBeNull();
    await waitFor(() => expect(result.current.state).toBe("empty"));
  });

  it("keeps the same content object across re-renders", async () => {
    const { result, rerender } = renderHook(() => useDocumentParsedContent("doc-1"));
    await waitFor(() =>
      expect((result.current.parsedContent?.questionsJSON as any[] | undefined)?.length).toBe(2),
    );
    const content = result.current.parsedContent;
    rerender();
    expect(result.current.parsedContent).toBe(content);
  });
});

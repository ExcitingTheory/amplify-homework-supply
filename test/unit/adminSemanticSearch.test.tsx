import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const embedMock = vi.fn();
const loadPlatformBundleMock = vi.fn();
const loadInstructorBundleMock = vi.fn();

vi.mock("@/offline/LocalEmbeddingModel", () => ({
  embed: (...args: unknown[]) => embedMock(...args),
}));

vi.mock("@/utils/searchBundles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/searchBundles")>();
  return {
    ...actual,
    loadPlatformBundle: () => loadPlatformBundleMock(),
    loadInstructorBundle: (...args: unknown[]) =>
      loadInstructorBundleMock(...args),
  };
});

import AuthContext from "@/context/authContext";
import type { SearchBundle } from "@/utils/searchBundles";
import {
  mergeSearchResults,
  rankBundleHits,
  resetAdminSearchCache,
  useAdminSemanticSearch,
} from "../../app/[locale]/admin/_components/adminSemanticSearch";

const unit = (axis: number, dims = 4) =>
  Array.from({ length: dims }, (_, i) => (i === axis ? 1 : 0));

function makeBundle(): SearchBundle {
  return {
    version: 1,
    dimensions: 4,
    model: "test",
    index: { strategy: "linear" },
    items: [
      { id: "w-cat", type: "word", title: "cat", embedding: unit(0), meta: {} },
      { id: "w-dog", type: "word", title: "dog", embedding: unit(1), meta: {} },
      {
        id: "f-1-p1",
        type: "file",
        title: "Animals PDF",
        embedding: unit(0),
        meta: { page: 1 },
      },
      {
        id: "f-1-p2",
        type: "file",
        title: "Animals PDF",
        embedding: [0.9, 0.1, 0, 0],
        meta: { page: 2 },
      },
      { id: "q-1", type: "question", title: "Pets?", embedding: unit(0), meta: {} },
    ],
  };
}

describe("rankBundleHits", () => {
  it("keeps only requested types and orders by similarity", () => {
    const hits = rankBundleHits({
      bundle: makeBundle(),
      embedding: unit(0),
      queryText: "feline",
      types: ["word"],
    });
    expect(hits.map((h) => h.id)).toEqual(["w-cat"]);
  });

  it("collapses per-page items to the record id, keeping the best page", () => {
    const hits = rankBundleHits({
      bundle: makeBundle(),
      embedding: unit(0),
      queryText: "feline",
      types: ["file"],
    });
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe("f-1");
  });

  it("searches platform bundles built with an hnsw graph by scanning", () => {
    const bundle = {
      ...makeBundle(),
      index: { strategy: "hnsw", M: 16, efSearch: 50, layers: [], entryPoint: 0, nodeLevels: [] },
    } as unknown as SearchBundle;
    const hits = rankBundleHits({
      bundle,
      embedding: unit(0),
      queryText: "feline",
      types: ["word"],
    });
    expect(hits.map((h) => h.id)).toEqual(["w-cat"]);
  });

  it("supports several types at once", () => {
    const hits = rankBundleHits({
      bundle: makeBundle(),
      embedding: unit(0),
      queryText: "feline",
      types: ["word", "question"],
    });
    expect(hits.map((h) => h.id).sort()).toEqual(["q-1", "w-cat"]);
  });
});

describe("mergeSearchResults", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const hit = (id: string) => ({ id, title: id, score: 1 });

  it("falls back to lexical matches without hits", () => {
    expect(mergeSearchResults(items, null, (i) => i.id === "b")).toEqual([
      { id: "b" },
    ]);
    expect(mergeSearchResults(items, [], (i) => i.id === "c")).toEqual([
      { id: "c" },
    ]);
  });

  it("puts semantic hits first, then remaining lexical matches, without duplicates", () => {
    const merged = mergeSearchResults(
      items,
      [hit("d"), hit("a"), hit("not-in-list")],
      (i) => i.id === "a" || i.id === "b",
    );
    expect(merged.map((i) => i.id)).toEqual(["d", "a", "b"]);
  });
});

describe("useAdminSemanticSearch", () => {
  const wrapper =
    (session: Record<string, unknown> | undefined) =>
    ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ session } as any}>
        {children}
      </AuthContext.Provider>
    );

  beforeEach(() => {
    resetAdminSearchCache();
    embedMock.mockReset().mockResolvedValue({ embedding: unit(0) });
    loadPlatformBundleMock.mockReset().mockResolvedValue(makeBundle());
    loadInstructorBundleMock.mockReset().mockResolvedValue(null);
  });

  it("does nothing for short queries or without a session", async () => {
    const short = renderHook(() => useAdminSemanticSearch("a", "word"), {
      wrapper: wrapper({ identityId: "id-1", groups: ["Admins"] }),
    });
    const anon = renderHook(() => useAdminSemanticSearch("cats", "word"), {
      wrapper: wrapper(undefined),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(short.result.current.hits).toBeNull();
    expect(anon.result.current.hits).toBeNull();
    expect(embedMock).not.toHaveBeenCalled();
  });

  it("admins search the platform bundle", async () => {
    const { result } = renderHook(
      () => useAdminSemanticSearch("feline", "word", { debounceMs: 0 }),
      { wrapper: wrapper({ identityId: "id-1", groups: ["Admins"] }) },
    );
    await waitFor(() => expect(result.current.hits).not.toBeNull());
    expect(result.current.source).toBe("platform");
    expect(result.current.hits?.map((h) => h.id)).toEqual(["w-cat"]);
    expect(loadInstructorBundleMock).not.toHaveBeenCalled();
  });

  it("falls back to the instructor bundle when no platform bundle exists", async () => {
    loadPlatformBundleMock.mockResolvedValue(null);
    loadInstructorBundleMock.mockResolvedValue(makeBundle());
    const { result } = renderHook(
      () => useAdminSemanticSearch("feline", "word", { debounceMs: 0 }),
      { wrapper: wrapper({ identityId: "id-1", groups: ["Admins"] }) },
    );
    await waitFor(() => expect(result.current.hits).not.toBeNull());
    expect(result.current.source).toBe("instructor");
    expect(loadInstructorBundleMock).toHaveBeenCalledWith("id-1");
  });

  it("instructors only ever search their own bundle", async () => {
    loadInstructorBundleMock.mockResolvedValue(makeBundle());
    const { result } = renderHook(
      () => useAdminSemanticSearch("feline", "word", { debounceMs: 0 }),
      { wrapper: wrapper({ identityId: "id-2", groups: ["Instructors"] }) },
    );
    await waitFor(() => expect(result.current.hits).not.toBeNull());
    expect(result.current.source).toBe("instructor");
    expect(loadPlatformBundleMock).not.toHaveBeenCalled();
  });

  it("scope \"own\" never loads the platform bundle, even for admins", async () => {
    loadInstructorBundleMock.mockResolvedValue(makeBundle());
    const { result } = renderHook(
      () =>
        useAdminSemanticSearch("feline", "word", { debounceMs: 0, scope: "own" }),
      { wrapper: wrapper({ identityId: "id-1", groups: ["Admins"] }) },
    );
    await waitFor(() => expect(result.current.hits).not.toBeNull());
    expect(result.current.source).toBe("instructor");
    expect(loadPlatformBundleMock).not.toHaveBeenCalled();
  });

  it("users outside admin roles never load the platform bundle", async () => {
    loadInstructorBundleMock.mockResolvedValue(makeBundle());
    const { result } = renderHook(
      () => useAdminSemanticSearch("feline", "word", { debounceMs: 0 }),
      { wrapper: wrapper({ identityId: "id-3", groups: ["Learners"] }) },
    );
    await waitFor(() => expect(result.current.hits).not.toBeNull());
    expect(loadPlatformBundleMock).not.toHaveBeenCalled();
  });

  it("degrades to no hits when no index exists", async () => {
    loadPlatformBundleMock.mockResolvedValue(null);
    const { result } = renderHook(
      () => useAdminSemanticSearch("feline", "word", { debounceMs: 0 }),
      { wrapper: wrapper({ identityId: "id-1", groups: ["Admins"] }) },
    );
    await waitFor(() => expect(result.current.searching).toBe(false));
    expect(result.current.hits).toBeNull();
    expect(result.current.source).toBe("none");
    expect(embedMock).not.toHaveBeenCalled();
  });

  it("degrades to no hits when the embedding model fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    embedMock.mockRejectedValue(new Error("model download failed"));
    const { result } = renderHook(
      () => useAdminSemanticSearch("feline", "word", { debounceMs: 0 }),
      { wrapper: wrapper({ identityId: "id-1", groups: ["Admins"] }) },
    );
    await waitFor(() => expect(warn).toHaveBeenCalled());
    await waitFor(() => expect(result.current.searching).toBe(false));
    expect(result.current.hits).toBeNull();
    warn.mockRestore();
  });
});

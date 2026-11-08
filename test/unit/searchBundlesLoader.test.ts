import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("aws-amplify/storage", () => ({ downloadData: vi.fn() }));

import {
  learnerSectionIds,
  loadLearnerBundle,
  loadSectionBundle,
  loadUnitBundle,
  mergeBundles,
} from "../../src/utils/searchBundles";

/** Minimal in-memory IndexedDB covering only what the bundle cache uses. */
function installFakeIndexedDB() {
  const data = new Map<string, unknown>();
  (globalThis as any).indexedDB = {
    open() {
      const request: any = {};
      queueMicrotask(() => {
        request.result = {
          createObjectStore() {},
          transaction() {
            return {
              objectStore: () => ({
                get(key: string) {
                  const req: any = {};
                  queueMicrotask(() => {
                    req.result = data.get(key);
                    req.onsuccess?.();
                  });
                  return req;
                },
                put(value: unknown, key: string) {
                  data.set(key, value);
                },
              }),
            };
          },
        };
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
  return data;
}

const bundle = (version: number) => ({
  version,
  dimensions: 4,
  model: "test",
  index: { strategy: "linear" },
  items: [],
});

const jsonResponse = (body: unknown, init: { status?: number; etag?: string } = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: init.etag ? { ETag: init.etag } : {},
  });

describe("scoped bundle loaders", () => {
  let cache: Map<string, any>;
  const fetchMock = vi.fn();

  beforeEach(() => {
    cache = installFakeIndexedDB() as Map<string, any>;
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the unit bundle through the authorized route and caches it with its ETag", async () => {
    fetchMock.mockResolvedValue(jsonResponse(bundle(5), { etag: '"e1"' }));

    const loaded = await loadUnitBundle("unit-1");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/search-bundle?kind=unit&id=unit-1");
    expect(loaded?.version).toBe(5);
    expect(cache.get("unit:unit-1")).toMatchObject({ version: 5, etag: '"e1"' });
  });

  it("revalidates with the cached ETag and reuses the cache on 304", async () => {
    cache.set("unit:unit-1", { ...bundle(5), etag: '"e1"' });
    fetchMock.mockResolvedValue(new Response(null, { status: 304 }));

    const loaded = await loadUnitBundle("unit-1");

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "If-None-Match": '"e1"' });
    expect(loaded?.version).toBe(5);
  });

  it("serves the cache when offline", async () => {
    cache.set("unit:unit-1", { ...bundle(5), etag: '"e1"' });
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect((await loadUnitBundle("unit-1"))?.version).toBe(5);
  });

  it("falls back to the cache when the bundle has not been built (404) or the server errors", async () => {
    cache.set("unit:unit-1", { ...bundle(5) });
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 404 }));
    expect((await loadUnitBundle("unit-1"))?.version).toBe(5);

    fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }));
    expect((await loadUnitBundle("unit-1"))?.version).toBe(5);
  });

  it("does not serve a cached bundle once access is refused", async () => {
    cache.set("unit:unit-1", { ...bundle(5) });
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 403 }));
    expect(await loadUnitBundle("unit-1")).toBeNull();
  });

  it("loads the caller's instructor bundle through the route too", async () => {
    fetchMock.mockResolvedValue(jsonResponse(bundle(9), { etag: '"i1"' }));
    const { loadInstructorBundle } = await import("../../src/utils/searchBundles");
    const loaded = await loadInstructorBundle("us-east-1:abc");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/search-bundle?kind=instructor&id=us-east-1%3Aabc",
    );
    expect(loaded?.version).toBe(9);
    expect(cache.has("instructor:us-east-1:abc")).toBe(true);
  });

  it("loads section bundles from their own route and cache key", async () => {
    fetchMock.mockResolvedValue(jsonResponse(bundle(7), { etag: '"s1"' }));
    await loadSectionBundle("sec 1");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/search-bundle?kind=section&id=sec%201");
    expect(cache.has("section:sec 1")).toBe(true);
  });
});

describe("learner section bundles", () => {
  const item = (id: string) => ({ id, type: "word" as const, title: id, embedding: [1, 0], meta: {} });
  const withItems = (...ids: string[]) => ({ ...bundle(1), items: ids.map(item) });

  it("reads the sections a learner is enrolled in from their groups", () => {
    expect(
      learnerSectionIds([
        "Learners",
        "section-s1-learners",
        "section-s2-learners",
        "section-s3-instructors",
        "Admins",
      ]),
    ).toEqual(["s1", "s2"]);
    expect(learnerSectionIds(undefined)).toEqual([]);
  });

  it("merges bundles without duplicate items", () => {
    const merged = mergeBundles([withItems("a", "b"), null, withItems("b", "c")] as any);
    expect(merged?.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(merged?.index.strategy).toBe("linear");
    expect(mergeBundles([null, withItems()] as any)).toBeNull();
  });

  describe("loadLearnerBundle", () => {
    let cache: Map<string, any>;
    const fetchMock = vi.fn();
    beforeEach(() => {
      cache = installFakeIndexedDB() as Map<string, any>;
      fetchMock.mockReset();
      vi.stubGlobal("fetch", fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it("merges the bundles of every enrolled section, skipping ones that refuse access", async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes("id=s1")) return jsonResponse(withItems("a", "b"), { etag: '"1"' });
        if (url.includes("id=s2")) return jsonResponse(withItems("b", "c"), { etag: '"2"' });
        return jsonResponse({}, { status: 403 }); // left this section
      });

      const merged = await loadLearnerBundle([
        "Learners",
        "section-s1-learners",
        "section-s2-learners",
        "section-s3-learners",
      ]);

      expect(merged?.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("does nothing for learners with no sections", async () => {
      expect(await loadLearnerBundle(["Learners"])).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

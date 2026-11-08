import { describe, it, expect } from "vitest";
import {
  applyItemDelta,
  buildHnswIndex,
  buildIvfIndex,
  dotProduct,
  l2Normalize,
  type BundleItem,
  type HNSWIndex,
  type IVFIndex,
  type SearchBundle,
} from "../rebuildSearchBundle/searchIndex";
import { searchBundle } from "../../../app/api/_shared/serverSearch";

// Deterministic pseudo-random vectors keep the graph/cluster tests repeatable.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function randomVector(next: () => number, dims: number) {
  return l2Normalize(Array.from({ length: dims }, () => next() * 2 - 1));
}

function makeItems(
  count: number,
  dims: number,
  next: () => number,
  prefix = "w",
): BundleItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    type: "word" as const,
    title: `${prefix} ${i}`,
    embedding: randomVector(next, dims),
    meta: {},
  }));
}

function bundleOf(
  items: BundleItem[],
  index: SearchBundle["index"],
): SearchBundle {
  return {
    version: 100,
    dimensions: items[0]?.embedding.length ?? 0,
    model: "test",
    index,
    items,
  };
}

const removeIds = (ids: string[]) => (item: BundleItem) => ids.includes(item.id);

describe("applyItemDelta: linear", () => {
  it("adds, replaces and removes items and bumps the version", () => {
    const next = rng(1);
    const items = makeItems(5, 8, next);
    const replacement = { ...items[1], title: "changed" };
    const added = makeItems(1, 8, next, "new")[0];

    const result = applyItemDelta(bundleOf(items, { strategy: "linear" }), {
      isRemoved: removeIds(["w-1", "w-3"]),
      upserts: [replacement, added],
    });

    expect(result.bundle.items.map((i) => i.id)).toEqual([
      "w-0",
      "w-2",
      "w-4",
      "w-1",
      "new-0",
    ]);
    expect(result.bundle.items.find((i) => i.id === "w-1")?.title).toBe("changed");
    expect(result.bundle.version).toBeGreaterThan(100);
    expect(result.indexAction).toBe("incremental");
    expect(result.removed).toBe(2);
    expect(result.added).toBe(2);
  });

  it("reports no change when nothing matches", () => {
    const bundle = bundleOf(makeItems(3, 8, rng(2)), { strategy: "linear" });
    const result = applyItemDelta(bundle, { isRemoved: () => false, upserts: [] });
    expect(result.indexAction).toBe("unchanged");
    expect(result.bundle).toBe(bundle);
  });
});

describe("applyItemDelta: ivf", () => {
  const dims = 16;

  function ivfBundle(count: number, seed: number) {
    const items = makeItems(count, dims, rng(seed));
    const index = buildIvfIndex(items.map((i) => i.embedding));
    return bundleOf(items, index);
  }

  it("keeps assignments aligned and sends new items to their nearest centroid", () => {
    const bundle = ivfBundle(300, 3);
    const before = bundle.index as IVFIndex;
    const incoming = makeItems(10, dims, rng(99), "new");

    const result = applyItemDelta(bundle, {
      isRemoved: removeIds(["w-0", "w-5", "w-299"]),
      upserts: incoming,
    });
    const after = result.bundle.index as IVFIndex;

    expect(result.indexAction).toBe("incremental");
    expect(after.centroids).toBe(before.centroids);
    expect(result.bundle.items).toHaveLength(307);
    expect(after.assignments).toHaveLength(307);

    // Surviving items keep their cluster; new items land in the closest one.
    expect(after.assignments[0]).toBe(before.assignments[1]);
    incoming.forEach((item, i) => {
      const expected = before.centroids
        .map((c, idx) => ({ idx, score: dotProduct(item.embedding, c) }))
        .sort((a, b) => b.score - a.score)[0].idx;
      expect(after.assignments[297 + i]).toBe(expected);
    });
  });

  it("re-clusters when the cluster count has drifted far from ideal", () => {
    const bundle = ivfBundle(250, 4);
    const result = applyItemDelta(bundle, {
      isRemoved: () => false,
      upserts: makeItems(1200, dims, rng(5), "bulk"),
    });
    const after = result.bundle.index as IVFIndex;
    expect(result.indexAction).toBe("rebuilt");
    expect(after.k).toBe(Math.ceil(Math.sqrt(1450)));
    expect(after.assignments).toHaveLength(1450);
  });

  it("switches linear to ivf when it grows past the threshold", () => {
    const bundle = bundleOf(makeItems(190, dims, rng(6)), { strategy: "linear" });
    const result = applyItemDelta(bundle, {
      isRemoved: () => false,
      upserts: makeItems(30, dims, rng(7), "new"),
    });
    expect(result.indexAction).toBe("rebuilt");
    expect(result.bundle.index.strategy).toBe("ivf");
  });

  it("does not flip back to linear right at the threshold", () => {
    const bundle = ivfBundle(210, 8);
    const near = applyItemDelta(bundle, {
      isRemoved: removeIds(Array.from({ length: 40 }, (_, i) => `w-${i}`)),
      upserts: [],
    });
    expect(near.bundle.items).toHaveLength(170);
    expect(near.bundle.index.strategy).toBe("ivf");
    expect(near.indexAction).toBe("incremental");

    const below = applyItemDelta(near.bundle, {
      isRemoved: removeIds(Array.from({ length: 20 }, (_, i) => `w-${i + 40}`)),
      upserts: [],
    });
    expect(below.bundle.index.strategy).toBe("linear");
  });

  it("rebuilds an index that no longer matches its items", () => {
    const bundle = ivfBundle(300, 9);
    const corrupt = {
      ...bundle,
      index: { ...(bundle.index as IVFIndex), assignments: [0, 1] },
    };
    const result = applyItemDelta(corrupt, {
      isRemoved: () => false,
      upserts: makeItems(1, dims, rng(10), "new"),
    });
    expect(result.indexAction).toBe("rebuilt");
    expect((result.bundle.index as IVFIndex).assignments).toHaveLength(301);
  });
});

describe("applyItemDelta: hnsw", () => {
  const dims = 8;
  const count = 4100;

  function checkGraph(index: HNSWIndex, itemCount: number) {
    expect(index.nodeLevels).toHaveLength(itemCount);
    expect(index.entryPoint).toBeGreaterThanOrEqual(0);
    expect(index.entryPoint).toBeLessThan(itemCount);
    expect(index.nodeLevels[index.entryPoint]).toBe(
      Math.max(...index.nodeLevels),
    );
    expect(index.layers).toHaveLength(Math.max(...index.nodeLevels) + 1);
    index.layers.forEach((layer) => {
      expect(layer).toHaveLength(itemCount);
      layer.forEach((neighbors, node) => {
        expect(neighbors.length).toBeLessThanOrEqual(index.M);
        for (const n of neighbors) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThan(itemCount);
          expect(n).not.toBe(node);
        }
      });
    });
  }

  it("updates the graph in place and still finds the right neighbors", () => {
    const next = rng(11);
    const items = makeItems(count, dims, next);
    const graph = buildHnswIndex(items.map((i) => i.embedding));
    const bundle = bundleOf(items, graph);

    const removedIds = Array.from({ length: 150 }, (_, i) => `w-${i * 25}`);
    const incoming = makeItems(120, dims, next, "new");
    const result = applyItemDelta(bundle, {
      isRemoved: removeIds(removedIds),
      upserts: incoming,
    });

    expect(result.indexAction).toBe("incremental");
    const index = result.bundle.index as HNSWIndex;
    const total = count - removedIds.length + incoming.length;
    expect(result.bundle.items).toHaveLength(total);
    checkGraph(index, total);

    // Every new item is retrievable by its own vector; removed ones never are.
    let foundNew = 0;
    for (const item of incoming) {
      const top = searchBundle(item.embedding, result.bundle as any, 1, -1);
      if (top[0]?.item.id === item.id) foundNew++;
    }
    expect(foundNew / incoming.length).toBeGreaterThanOrEqual(0.95);

    const queryNext = rng(12);
    let agree = 0;
    const trials = 60;
    for (let q = 0; q < trials; q++) {
      const query = randomVector(queryNext, dims);
      const approx = searchBundle(query, result.bundle as any, 1, -1)[0];
      const exact = result.bundle.items
        .map((item) => ({ item, score: dotProduct(query, item.embedding) }))
        .sort((a, b) => b.score - a.score)[0];
      expect(removedIds).not.toContain(approx.item.id);
      if (approx.item.id === exact.item.id) agree++;
    }
    expect(agree / trials).toBeGreaterThanOrEqual(0.9);
  }, 180_000);
});

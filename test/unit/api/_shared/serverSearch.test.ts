/**
 * Tests for server-side search utilities.
 *
 * Validates linear search, IVF search, and hybrid scoring.
 */
import { describe, it, expect } from "vitest";
import {
  searchBundle,
  hybridSearchBundle,
} from "../../../../app/api/_shared/serverSearch";
import type {
  SearchBundle,
  BundleItem,
} from "../../../../app/api/_shared/serverSearch";

// Helper: create a normalized 4D embedding
function makeEmbedding(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0));
  return values.map((v) => v / norm);
}

const ITEM_A: BundleItem = {
  id: "a",
  type: "unit",
  title: "Past Tense Conjugation",
  embedding: makeEmbedding([1, 0, 0, 0]),
  meta: { preview: "Learn about past tense verb conjugation in Japanese" },
};

const ITEM_B: BundleItem = {
  id: "b",
  type: "word",
  title: "Vocabulary: Te-form",
  embedding: makeEmbedding([0, 1, 0, 0]),
  meta: { preview: "The te-form of verbs connects clauses" },
};

const ITEM_C: BundleItem = {
  id: "c",
  type: "question",
  title: "Quiz: Present tense",
  embedding: makeEmbedding([0.7, 0.7, 0, 0]),
  meta: { preview: "Multiple choice quiz on present tense" },
};

function makeLinearBundle(items: BundleItem[]): SearchBundle {
  return {
    version: 1,
    dimensions: 4,
    model: "test",
    index: { strategy: "linear" },
    items,
  };
}

function makeIVFBundle(items: BundleItem[]): SearchBundle {
  // Simple 2-cluster IVF: items split by first dimension
  return {
    version: 1,
    dimensions: 4,
    model: "test",
    index: {
      strategy: "ivf",
      k: 2,
      nProbe: 2,
      centroids: [makeEmbedding([1, 0, 0, 0]), makeEmbedding([0, 1, 0, 0])],
      assignments: items.map((item) =>
        item.embedding[0] > item.embedding[1] ? 0 : 1,
      ),
    },
    items,
  };
}

describe("serverSearch", () => {
  describe("searchBundle (linear)", () => {
    const bundle = makeLinearBundle([ITEM_A, ITEM_B, ITEM_C]);

    it("returns items sorted by score", () => {
      const query = makeEmbedding([1, 0, 0, 0]); // matches ITEM_A
      const results = searchBundle(query, bundle, 5, 0.1);
      expect(results[0].item.id).toBe("a");
      expect(results[0].score).toBeGreaterThan(0.9);
    });

    it("respects topK limit", () => {
      const query = makeEmbedding([0.5, 0.5, 0.5, 0.5]);
      const results = searchBundle(query, bundle, 1, 0.0);
      expect(results).toHaveLength(1);
    });

    it("filters below threshold", () => {
      const query = makeEmbedding([0, 0, 0, 1]); // orthogonal to all items
      const results = searchBundle(query, bundle, 5, 0.5);
      expect(results).toHaveLength(0);
    });

    it("handles empty bundle", () => {
      const empty = makeLinearBundle([]);
      const results = searchBundle(makeEmbedding([1, 0, 0, 0]), empty, 5, 0.1);
      expect(results).toHaveLength(0);
    });
  });

  describe("searchBundle (IVF)", () => {
    const bundle = makeIVFBundle([ITEM_A, ITEM_B, ITEM_C]);

    it("finds items via IVF clusters", () => {
      const query = makeEmbedding([1, 0, 0, 0]);
      const results = searchBundle(query, bundle, 5, 0.1);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe("a");
    });

    it("returns items from probed clusters only", () => {
      const query = makeEmbedding([0, 1, 0, 0]);
      const results = searchBundle(query, bundle, 5, 0.1);
      // With nProbe=2 and 2 clusters, all items are probed
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("searchBundle (HNSW)", () => {
    // Build a simple HNSW index with 3 items, all on layer 0, node 0 is entry on layer 1
    function makeHNSWBundle(items: BundleItem[]): SearchBundle {
      // Layer 0 (base): all nodes connected to each other
      const layer0: number[][] = items.map((_, i) =>
        items.map((_, j) => j).filter((j) => j !== i),
      );
      // Layer 1 (top): only node 0
      const layer1: number[][] = [[]];
      return {
        version: 1,
        dimensions: 4,
        model: "test",
        index: {
          strategy: "hnsw",
          M: 4,
          efSearch: 10,
          layers: [layer0, layer1],
          entryPoint: 0,
          nodeLevels: [1, 0, 0], // node 0 is in layers 0+1, others only layer 0
        },
        items,
      };
    }

    const bundle = makeHNSWBundle([ITEM_A, ITEM_B, ITEM_C]);

    it("finds nearest neighbor via HNSW graph traversal", () => {
      const query = makeEmbedding([1, 0, 0, 0]); // closest to ITEM_A
      const results = searchBundle(query, bundle, 5, 0.1);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe("a");
      expect(results[0].score).toBeGreaterThan(0.9);
    });

    it("returns multiple results sorted by score", () => {
      const query = makeEmbedding([0.7, 0.7, 0, 0]); // between A and B
      const results = searchBundle(query, bundle, 3, 0.0);
      expect(results.length).toBe(3);
      // ITEM_C is [0.7,0.7,0,0] normalized — best match
      expect(results[0].item.id).toBe("c");
    });

    it("respects threshold", () => {
      const query = makeEmbedding([0, 0, 0, 1]); // orthogonal to all
      const results = searchBundle(query, bundle, 5, 0.5);
      expect(results).toHaveLength(0);
    });
  });

  describe("hybridSearchBundle", () => {
    const bundle = makeLinearBundle([ITEM_A, ITEM_B, ITEM_C]);

    it("boosts results with keyword matches", () => {
      // Query embedding matches ITEM_A, keywords match ITEM_A too
      const query = makeEmbedding([1, 0, 0, 0]);
      const results = hybridSearchBundle(
        query,
        "past tense conjugation",
        bundle,
        5,
        0.0,
        0.8,
      );
      expect(results[0].item.id).toBe("a");
    });

    it("falls back to pure semantic when no keywords match", () => {
      const query = makeEmbedding([1, 0, 0, 0]);
      const results = hybridSearchBundle(
        query,
        "xyznonexistent",
        bundle,
        5,
        0.0,
        0.8,
      );
      // Short query terms are filtered out, should still return semantic results
      expect(results.length).toBeGreaterThan(0);
    });

    it("respects alpha weighting", () => {
      // With alpha=1.0, should behave like pure semantic search
      const query = makeEmbedding([1, 0, 0, 0]);
      const semanticResults = searchBundle(query, bundle, 5, 0.0);
      const hybridResults = hybridSearchBundle(
        query,
        "unrelated terms here",
        bundle,
        5,
        0.0,
        1.0,
      );
      // Same top result
      expect(hybridResults[0].item.id).toBe(semanticResults[0].item.id);
    });
  });
});

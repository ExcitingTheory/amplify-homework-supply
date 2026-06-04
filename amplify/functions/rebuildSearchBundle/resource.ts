import { defineFunction, secret } from "@aws-amplify/backend";

/**
 * Rebuild Search Bundle Lambda
 *
 * Assembles role-scoped embedding bundles for efficient client-side search.
 * Triggered by:
 * - Unit publish events
 * - File/word/question content updates
 * - Admin reindex script (scripts/rebuild-search-bundles.ts)
 *
 * Reads per-item embedding files from S3, optionally generates missing embeddings,
 * and writes optimized search bundles with IVF pre-indexing for n > 200 items.
 */
export const rebuildSearchBundleHandler = defineFunction({
  timeoutSeconds: 900,
  memoryMB: 1024,
  resourceGroupName: "data",
  environment: {
    OPENAI_API_KEY: secret("OPENAI_API_KEY"),
  },
});

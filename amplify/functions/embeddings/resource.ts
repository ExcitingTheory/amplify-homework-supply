import { defineFunction } from "@aws-amplify/backend";

/**
 * Embeddings Lambda function resource
 *
 * Handles:
 * - Generate text embeddings (single and batch) using MiniLM 384D
 * - Create embeddings for semantic search (offline-compatible)
 * - Support vector database operations
 *
 * Authorization: All authenticated users (documents they own)
 * Cognito Operations: getUser
 */

export const embeddingsHandler = defineFunction({
  timeoutSeconds: 300,
  memoryMB: 1024,
  resourceGroupName: "data",
});

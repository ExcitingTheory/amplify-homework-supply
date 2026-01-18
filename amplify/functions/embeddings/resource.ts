import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Embeddings Lambda function resource
 * 
 * Handles:
 * - Generate text embeddings (single and batch)
 * - Create embeddings for semantic search
 * - Support vector database operations
 * 
 * Authorization: All authenticated users (documents they own)
 * Cognito Operations: getUser
 */

export const embeddingsHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

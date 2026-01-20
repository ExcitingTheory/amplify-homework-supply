import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Embeddings Lambda function resource
 * 
 * Handles:
 * - Generate text embeddings (single and batch)
 * - Create embeddings for semantic search
 * - Support vector database operations
 * - Asynchronous self-invocation for background processing
 * 
 * Authorization: All authenticated users (documents they own)
 * Cognito Operations: getUser
 * IAM Permissions: lambda:InvokeFunction (self-invocation for async processing)
 */

export const embeddingsHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 3008,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

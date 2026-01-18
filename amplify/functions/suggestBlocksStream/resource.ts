import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Suggest Blocks Stream Lambda function resource
 * 
 * Handles block type suggestions:
 * - Analyze unit structure and learning flow
 * - Suggest next logical block types
 * - Provide pedagogical reasoning for suggestions
 * - Return JSON-formatted recommendations
 * 
 * Authorization: All authenticated users
 * Cognito Operations: getUser
 */

export const suggestBlocksStreamHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 256,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

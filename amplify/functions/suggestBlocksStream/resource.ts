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
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: 'data',  // Must be in data stack - integrated with HTTP API on data stack
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

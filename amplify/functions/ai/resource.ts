import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * AI Lambda function resource
 * 
 * Handles:
 * - Content completion (block continuation)
 * - Block suggestions (next activity recommendations)
 * - Unit prediction (suggest relevant units)
 * 
 * Authorization: All authenticated users (read their own units)
 * Cognito Operations: getUser
 */

export const aiHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 256,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

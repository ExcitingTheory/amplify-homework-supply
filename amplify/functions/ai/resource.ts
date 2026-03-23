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
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: 'data',  // Assign to data stack - used as GraphQL resolver
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    PHOENIX_COLLECTOR_ENDPOINT: secret('PHOENIX_COLLECTOR_ENDPOINT'),
    // Optional: Phoenix authentication
    // PHOENIX_API_KEY: secret('PHOENIX_API_KEY'),
  },

});

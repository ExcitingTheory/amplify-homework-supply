import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Assistant Lambda function resource
 * 
 * Handles:
 * - Create assistant chat threads
 * - Send messages to assistant
 * - Retrieve conversation history
 * - Delete threads
 * 
 * Authorization: All authenticated users (own threads only)
 * Cognito Operations: getUser
 */

export const assistantHandler = defineFunction({
  timeoutSeconds: 120,
  memoryMB: 256,
  resourceGroupName: 'data',  // Assign to data stack - used as GraphQL resolver
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Moderation Lambda function resource
 * 
 * Handles:
 * - Content moderation (check for harmful content)
 * - Filter detection (offensive language)
 * 
 * Authorization: All authenticated users
 * Cognito Operations: getUser
 */

export const moderationHandler = defineFunction({
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data',  // Assign to data stack - used as GraphQL resolver
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },

});

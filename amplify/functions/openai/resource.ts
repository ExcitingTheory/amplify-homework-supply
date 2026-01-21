import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * OpenAI Lambda function resource
 * 
 * Handles:
 * - Text completions (chat, content generation)
 * - Audio generation and transcription
 * - Image generation and analysis
 * - Verification operations
 * 
 * Authorization: All authenticated users
 * Cognito Operations: getUser, listGroupsForUser
 */

export const openaiHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
  resourceGroupName: 'data',  // Assign to data stack - used as GraphQL resolver
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

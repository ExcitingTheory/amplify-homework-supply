import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Content Completion Stream Lambda function resource
 * 
 * Handles streaming content completion:
 * - Complete unit block content based on prompt and context
 * - Pedagog pedagogically sound continuations
 * - Real-time streaming response
 * 
 * Authorization: All authenticated users
 * Cognito Operations: getUser
 */

export const contentCompletionStreamHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 120,
  memoryMB: 256,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
  resourceGroupName: 'data',  // HTTP API is on data stack
});

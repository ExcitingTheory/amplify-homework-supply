import { defineFunction, secret } from "@aws-amplify/backend";

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
  timeoutSeconds: 29,
  memoryMB: 256,
  resourceGroupName: "data", // Must be in data stack - integrated with HTTP API on data stack
  environment: {
    OPENAI_API_KEY: secret("OPENAI_API_KEY"),
  },
});

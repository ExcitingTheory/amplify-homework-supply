import { defineFunction, secret } from "@aws-amplify/backend";

/**
 * Chat Stream Lambda function resource
 *
 * Handles real-time streaming chat with AI tools:
 * - Search content (semantic search)
 * - Create sections (class groups)
 * - Generate unit content (explanations, examples, quizzes, etc.)
 *
 * Features:
 * - Server-side SSE streaming
 * - Tool execution support
 * - Prompt injection detection
 * - Context-aware system prompts
 *
 * Authorization: All authenticated users
 * Cognito Operations: getUser
 */

export const chatStreamHandler = defineFunction({
  timeoutSeconds: 29,
  memoryMB: 512,
  resourceGroupName: "data", // Must be in data stack - integrated with HTTP API on data stack
  environment: {
    OPENAI_API_KEY: secret("OPENAI_API_KEY"),
  },
});

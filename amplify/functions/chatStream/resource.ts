import { defineFunction, secret } from '@aws-amplify/backend';

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
  timeoutSeconds: 300,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

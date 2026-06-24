/**
 * @fileoverview Zod schemas for Chat/AI Assistant mock data
 * 
 * Validates chat message structure following Vercel AI SDK format.
 * 
 * @module schemas/chat
 */

import { z } from 'zod';

/**
 * Text message part
 */
export const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

/**
 * Tool call part (function calling)
 */
export const toolCallPartSchema = z.object({
  type: z.string().regex(/^tool-/), // e.g., 'tool-search_content', 'tool-fetch_webpage'
  toolCallId: z.string(),
  state: z.enum(['call', 'output-available']),
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
});

/**
 * Step start indicator
 */
export const stepStartPartSchema = z.object({
  type: z.literal('step-start'),
  toolCall: z.string(),
  toolCallId: z.string(),
});

/**
 * Message part union
 */
export const messagePartSchema = z.union([
  textPartSchema,
  toolCallPartSchema,
  stepStartPartSchema,
]);

/**
 * Chat message adhering to Vercel AI SDK format
 * 
 * @see {@link https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol}
 */
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(messagePartSchema),
  createdAt: z.string().datetime().optional(),
});

/**
 * Array of chat messages
 */
export const chatMessagesSchema = z.array(chatMessageSchema);

/**
 * SSE stream event types
 */
export const sseEventSchema = z.union([
  z.object({
    type: z.literal('text-delta'),
    textDelta: z.string(),
  }),
  z.object({
    type: z.literal('tool-call'),
    toolCallId: z.string(),
    toolName: z.string(),
  }),
  z.object({
    type: z.literal('tool-result'),
    toolCallId: z.string(),
    result: z.any(),
  }),
  z.object({
    type: z.literal('finish'),
    finishReason: z.enum(['stop', 'length', 'tool-calls', 'content-filter', 'error']),
  }),
]);

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type MessagePart = z.infer<typeof messagePartSchema>;
export type SSEEvent = z.infer<typeof sseEventSchema>;

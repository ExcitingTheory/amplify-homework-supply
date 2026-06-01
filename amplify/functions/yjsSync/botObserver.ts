/**
 * Bot Observer — Server-side observer that responds to bot mentions.
 *
 * This module runs on the Yjs collab server. It observes Y.Array changes
 * in chat threads and triggers OpenAI streaming responses when a bot is
 * mentioned. The response is written directly into the Yjs doc so all
 * connected clients see it in real-time — no client-side relay needed.
 *
 * Security: Only the server writes as the bot. Clients cannot impersonate
 * bots because they never relay the AI response — it comes straight from
 * the server into the shared Y.Doc.
 *
 * Streaming flow:
 * 1. Detect bot mention in new message
 * 2. Insert placeholder message with isStreaming=true
 * 3. Stream tokens from OpenAI, updating the message content progressively
 * 4. On completion, set isStreaming=false and finalize contentJson
 *
 * @module botObserver
 */

import * as Y from "yjs";

// ============================================================================
// Types
// ============================================================================

/** Chat message structure (mirrored from src/yjs/ChatCollaborationProvider) */
export interface ChatMessage {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  /** Serialized Lexical JSON for rich content */
  contentJson?: string | null;
  mentions: string[];
  createdAt: string;
  editedAt: string | null;
  reactions: Record<string, string[]>;
  /** True while the server is streaming a response */
  isStreaming?: boolean;
}

interface TopicData {
  name?: string;
  scope?: string;
}

/** Callback invoked for each streaming chunk */
export type StreamCallback = (chunk: string) => void;

export interface BotConfig {
  /** Generate a complete response (non-streaming fallback) */
  generateResponse: (prompt: string, context?: BotContext) => Promise<string>;
  /**
   * Stream a response token-by-token. Returns the final complete content.
   * The onChunk callback is called for each token as it arrives.
   * If not provided, falls back to generateResponse.
   */
  streamResponse?: (
    prompt: string,
    onChunk: StreamCallback,
    context?: BotContext,
  ) => Promise<string>;
  /** Bot display name (used to derive mention trigger and message authorName) */
  botName?: string;
  /** Bot author ID */
  botAuthorId?: string;
  /**
   * Throttle interval (ms) for updating the Yjs doc during streaming.
   * Lower = more real-time but more network traffic. Default: 100ms.
   */
  streamThrottleMs?: number;
}

/** Combined config supporting both bots in separate Y.Docs */
export interface DualBotConfig {
  kai: BotConfig;
  sage?: BotConfig;
}

export interface BotContext {
  topicName?: string;
  scope?: string;
  recentMessages?: Array<{ author: string; content: string }>;
}

// ============================================================================
// Streaming Throttle Utility
// ============================================================================

/**
 * Creates a throttled updater that batches rapid content updates into
 * periodic Yjs doc writes. This prevents flooding the WebSocket with
 * a Y.update for every single token.
 */
function createStreamThrottle(
  intervalMs: number,
  updateFn: (content: string) => void,
) {
  let pending: string | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  function start() {
    timer = setInterval(() => {
      if (pending !== null) {
        updateFn(pending);
        pending = null;
      }
    }, intervalMs);
  }

  function push(content: string) {
    pending = content;
  }

  function flush() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (pending !== null) {
      updateFn(pending);
      pending = null;
    }
  }

  return { start, push, flush };
}

// ============================================================================
// Observer
// ============================================================================

/**
 * Attach a bot observer to a chat room Y.Doc.
 *
 * Watches all thread arrays for new messages containing a bot mention and
 * streams a response into the same thread. The response is written
 * directly by the server — clients never relay AI content.
 *
 * Each Y.Doc hosts a single bot. The server decides which bot config to
 * attach based on the room namespace:
 * - "chat-*" rooms → Kai (student tutor)
 * - "instructor-chat-*" rooms → Sage (instructor assistant)
 *
 * Accepts either a single BotConfig or a DualBotConfig (uses kai from it).
 */
export function attachBotObserver(
  doc: Y.Doc,
  config: BotConfig | DualBotConfig,
): () => void {
  // Normalize config — extract the single bot config to use for this doc
  const resolvedConfig: BotConfig = "kai" in config ? config.kai : config;

  const {
    generateResponse,
    streamResponse,
    botName = "Kai",
    botAuthorId = "kai-bot",
    streamThrottleMs = 100,
  } = resolvedConfig;

  // Determine which mention this bot responds to based on its name
  const mentionTrigger = `@${botName.toLowerCase()}`;

  const observers: Array<() => void> = [];

  // Track in-flight requests to prevent duplicate responses
  const processingMessages = new Set<string>();

  const topicsMap = doc.getMap<TopicData>("topics");

  const attachThreadObserver = (topicId: string) => {
    const threadArray = doc.getArray<ChatMessage>(`thread-${topicId}`);

    const observer = (event: Y.YArrayEvent<ChatMessage>) => {
      // Only process insertions
      if (event.changes.added.size === 0) return;

      // Get the newly added messages
      const addedMessages: ChatMessage[] = [];
      event.changes.added.forEach((item) => {
        for (const content of item.content.getContent()) {
          addedMessages.push(content as ChatMessage);
        }
      });

      // Check for bot mentions in new messages (ignore bot's own messages)
      for (const message of addedMessages) {
        if (message.authorId === botAuthorId) continue;
        if (!message.mentions?.includes(mentionTrigger)) continue;
        if (processingMessages.has(message.id)) continue;

        processingMessages.add(message.id);

        // Build context from recent messages
        const allMessages = Array.from(threadArray);
        const recentMessages = allMessages
          .slice(-10)
          .map((m) => ({ author: m.authorName, content: m.content }));

        const topic = topicsMap.get(topicId);
        const context: BotContext = {
          topicName: topic?.name,
          scope: topic?.scope,
          recentMessages,
        };

        // Strip bot mention from content to get the prompt
        const prompt = message.content
          .replace(new RegExp(`@${botName}\\b`, "gi"), "")
          .trim();

        if (streamResponse) {
          // ── Streaming path ──────────────────────────────────────────────
          handleStreamingResponse(
            threadArray,
            message,
            prompt,
            context,
            streamResponse,
            botAuthorId,
            botName,
            streamThrottleMs,
          ).finally(() => {
            processingMessages.delete(message.id);
          });
        } else {
          // ── Non-streaming fallback ─────────────────────────────────────
          generateResponse(prompt, context)
            .then((response) => {
              const botMessage: ChatMessage = {
                id: crypto.randomUUID(),
                parentId: message.parentId || message.id,
                authorId: botAuthorId,
                authorName: botName,
                content: response,
                contentJson: null,
                mentions: [],
                createdAt: new Date().toISOString(),
                editedAt: null,
                reactions: {},
                isStreaming: false,
              };
              threadArray.push([botMessage]);
            })
            .catch((error) => {
              console.error(`[${botName}] Failed to generate response:`, error);
              postErrorMessage(threadArray, message, botAuthorId, botName);
            })
            .finally(() => {
              processingMessages.delete(message.id);
            });
        }
      }
    };

    threadArray.observe(observer);
    observers.push(() => threadArray.unobserve(observer));
  };

  // Attach observers for existing topics
  topicsMap.forEach((_, topicId) => {
    attachThreadObserver(topicId);
  });

  // Watch for new topics
  const topicsObserver = (event: Y.YMapEvent<TopicData>) => {
    event.keysChanged.forEach((key) => {
      const change = event.changes.keys.get(key);
      if (change?.action === "add") {
        attachThreadObserver(key);
      }
    });
  };

  topicsMap.observe(topicsObserver);
  observers.push(() => topicsMap.unobserve(topicsObserver));

  // Return cleanup function
  return () => {
    observers.forEach((unobserve) => unobserve());
  };
}

// ============================================================================
// Streaming Response Handler
// ============================================================================

/**
 * Handles a streaming AI response:
 * 1. Inserts a placeholder message with isStreaming=true
 * 2. Streams tokens, throttling updates to the Yjs doc
 * 3. Finalizes the message with isStreaming=false
 */
async function handleStreamingResponse(
  threadArray: Y.Array<ChatMessage>,
  triggerMessage: ChatMessage,
  prompt: string,
  context: BotContext,
  streamFn: (
    prompt: string,
    onChunk: StreamCallback,
    context?: BotContext,
  ) => Promise<string>,
  botAuthorId: string,
  botName: string,
  throttleMs: number,
): Promise<void> {
  const messageId = crypto.randomUUID();

  // 1. Insert placeholder message
  const placeholder: ChatMessage = {
    id: messageId,
    parentId: triggerMessage.parentId || triggerMessage.id,
    authorId: botAuthorId,
    authorName: botName,
    content: "",
    contentJson: null,
    mentions: [],
    createdAt: new Date().toISOString(),
    editedAt: null,
    reactions: {},
    isStreaming: true,
  };
  threadArray.push([placeholder]);

  // Find the index of our message (should be the last one)
  let messageIndex = threadArray.length - 1;

  // Helper to update the message in-place
  const updateMessage = (content: string, isStreaming = true) => {
    // Find current index (it could shift if others post)
    const items = Array.from(threadArray);
    const idx = items.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    messageIndex = idx;

    const updated: ChatMessage = {
      ...items[idx],
      content,
      isStreaming,
    };

    // Use a transaction to atomically replace the message
    threadArray.doc?.transact(() => {
      threadArray.delete(idx, 1);
      threadArray.insert(idx, [updated]);
    });
  };

  // 2. Stream with throttled updates
  let accumulated = "";
  const throttle = createStreamThrottle(throttleMs, (content) => {
    updateMessage(content, true);
  });

  throttle.start();

  try {
    const finalContent = await streamFn(
      prompt,
      (chunk: string) => {
        accumulated += chunk;
        throttle.push(accumulated);
      },
      context,
    );

    // 3. Flush any remaining content and finalize
    throttle.flush();
    updateMessage(finalContent, false);
  } catch (error) {
    console.error(`[${botName}] Streaming error:`, error);
    throttle.flush();

    // If we got partial content, keep it and mark as error
    if (accumulated) {
      updateMessage(accumulated + "\n\n⚠️ Response was interrupted.", false);
    } else {
      // Replace with error message
      updateMessage(
        "Sorry, I couldn't process that request. Please try again.",
        false,
      );
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function postErrorMessage(
  threadArray: Y.Array<ChatMessage>,
  triggerMessage: ChatMessage,
  botAuthorId: string,
  botName: string,
): void {
  const errorMessage: ChatMessage = {
    id: crypto.randomUUID(),
    parentId: triggerMessage.parentId || triggerMessage.id,
    authorId: botAuthorId,
    authorName: botName,
    content: "Sorry, I couldn't process that request. Please try again.",
    contentJson: null,
    mentions: [],
    createdAt: new Date().toISOString(),
    editedAt: null,
    reactions: {},
    isStreaming: false,
  };
  threadArray.push([errorMessage]);
}

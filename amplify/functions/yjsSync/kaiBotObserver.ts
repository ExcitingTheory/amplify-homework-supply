/**
 * Kai Bot Handler — Server-side observer that responds to @kai mentions.
 *
 * This module is designed to run on the Yjs collab server. It observes
 * Y.Array changes in chat threads and triggers OpenAI responses when
 * @kai is mentioned.
 *
 * @module kaiBotObserver
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
  mentions: string[];
  createdAt: string;
  editedAt: string | null;
  reactions: Record<string, string[]>;
}

interface TopicData {
  name?: string;
  scope?: string;
}

export interface KaiBotConfig {
  /** Function to call OpenAI and get a response */
  generateResponse: (prompt: string, context?: BotContext) => Promise<string>;
  /** Bot display name */
  botName?: string;
  /** Bot author ID */
  botAuthorId?: string;
}

export interface BotContext {
  topicName?: string;
  scope?: string;
  recentMessages?: Array<{ author: string; content: string }>;
}

// ============================================================================
// Observer
// ============================================================================

/**
 * Attach the Kai bot observer to a chat room Y.Doc.
 *
 * Watches all thread arrays for new messages containing @kai and
 * posts a response in the same thread.
 */
export function attachKaiBotObserver(
  doc: Y.Doc,
  config: KaiBotConfig,
): () => void {
  const { generateResponse, botName = "Kai", botAuthorId = "kai-bot" } = config;
  const observers: Array<() => void> = [];

  // Watch the topics map for new topics (to attach thread observers)
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

      // Check for @kai mentions in new messages (ignore bot's own messages)
      for (const message of addedMessages) {
        if (message.authorId === botAuthorId) continue;
        if (!message.mentions?.includes("@kai")) continue;

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

        // Strip @kai from content to get the prompt
        const prompt = message.content.replace(/@kai\b/gi, "").trim();

        // Generate and post response (fire and forget)
        generateResponse(prompt, context)
          .then((response) => {
            const botMessage: ChatMessage = {
              id: crypto.randomUUID(),
              parentId: message.parentId || message.id, // Reply in thread
              authorId: botAuthorId,
              authorName: botName,
              content: response,
              mentions: [],
              createdAt: new Date().toISOString(),
              editedAt: null,
              reactions: {},
            };
            threadArray.push([botMessage]);
          })
          .catch((error) => {
            console.error("[KaiBot] Failed to generate response:", error);

            // Post error message
            const errorMessage: ChatMessage = {
              id: crypto.randomUUID(),
              parentId: message.parentId || message.id,
              authorId: botAuthorId,
              authorName: botName,
              content:
                "Sorry, I couldn't process that request. Please try again.",
              mentions: [],
              createdAt: new Date().toISOString(),
              editedAt: null,
              reactions: {},
            };
            threadArray.push([errorMessage]);
          });
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

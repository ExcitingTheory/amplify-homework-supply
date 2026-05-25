/**
 * Tests for the botObserver streaming relay pattern.
 *
 * Verifies that:
 * - Bot mentions trigger bot responses
 * - Streaming updates the message progressively
 * - The placeholder message starts with isStreaming=true
 * - The final message has isStreaming=false
 * - Bot ignores its own messages
 * - Duplicate detection prevents double-responses
 * - Errors are handled gracefully
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { attachBotObserver } from "./botObserver";
import type { BotConfig, DualBotConfig, ChatMessage } from "./botObserver";

// Helper to create a chat message
function createMessage(
  content: string,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    parentId: null,
    authorId: "student-1",
    authorName: "Test Student",
    content,
    contentJson: null,
    mentions: content.includes("@kai") ? ["@kai"] : [],
    createdAt: new Date().toISOString(),
    editedAt: null,
    reactions: {},
    isStreaming: false,
    ...overrides,
  };
}

// Helper to wait for async operations
function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

describe("botObserver", () => {
  let doc: Y.Doc;
  let topicsMap: Y.Map<any>;
  let threadArray: Y.Array<ChatMessage>;
  let cleanup: () => void;

  const TOPIC_ID = "test-topic-1";

  beforeEach(() => {
    doc = new Y.Doc();
    topicsMap = doc.getMap("topics");
    topicsMap.set(TOPIC_ID, { name: "Test Topic", scope: "section" });
    threadArray = doc.getArray(`thread-${TOPIC_ID}`);
  });

  describe("non-streaming (generateResponse)", () => {
    it("responds to @kai mentions", async () => {
      const generateResponse = vi
        .fn()
        .mockResolvedValue("Hello! I can help with that.");

      const config: BotConfig = { generateResponse };
      cleanup = attachBotObserver(doc, config);

      // Add a message mentioning @kai
      threadArray.push([createMessage("@kai explain photosynthesis")]);
      await flushPromises();

      expect(generateResponse).toHaveBeenCalledWith(
        "explain photosynthesis",
        expect.objectContaining({
          topicName: "Test Topic",
          scope: "section",
        }),
      );

      // Bot should have posted a response
      const messages = Array.from(threadArray);
      expect(messages).toHaveLength(2);
      expect(messages[1].authorId).toBe("kai-bot");
      expect(messages[1].content).toBe("Hello! I can help with that.");
      expect(messages[1].isStreaming).toBe(false);

      cleanup();
    });

    it("ignores messages without @kai", async () => {
      const generateResponse = vi.fn().mockResolvedValue("response");
      cleanup = attachBotObserver(doc, { generateResponse });

      threadArray.push([createMessage("regular message without mention")]);
      await flushPromises();

      expect(generateResponse).not.toHaveBeenCalled();
      expect(Array.from(threadArray)).toHaveLength(1);

      cleanup();
    });

    it("ignores its own messages", async () => {
      const generateResponse = vi.fn().mockResolvedValue("response");
      cleanup = attachBotObserver(doc, { generateResponse });

      threadArray.push([
        createMessage("@kai this is from me", { authorId: "kai-bot" }),
      ]);
      await flushPromises();

      expect(generateResponse).not.toHaveBeenCalled();

      cleanup();
    });

    it("posts error message on failure", async () => {
      const generateResponse = vi
        .fn()
        .mockRejectedValue(new Error("API error"));
      cleanup = attachBotObserver(doc, { generateResponse });

      threadArray.push([createMessage("@kai do something")]);
      await flushPromises();

      const messages = Array.from(threadArray);
      expect(messages).toHaveLength(2);
      expect(messages[1].authorId).toBe("kai-bot");
      expect(messages[1].content).toContain("Sorry");
      expect(messages[1].isStreaming).toBe(false);

      cleanup();
    });

    it("replies in thread (parentId set to trigger message id)", async () => {
      const generateResponse = vi.fn().mockResolvedValue("reply");
      cleanup = attachBotObserver(doc, { generateResponse });

      const msg = createMessage("@kai help");
      threadArray.push([msg]);
      await flushPromises();

      const messages = Array.from(threadArray);
      expect(messages[1].parentId).toBe(msg.id);

      cleanup();
    });
  });

  describe("streaming (streamResponse)", () => {
    it("inserts placeholder with isStreaming=true then finalizes", async () => {
      const streamResponse = vi.fn(
        async (prompt: string, onChunk: (chunk: string) => void) => {
          onChunk("Hello");
          onChunk(" world");
          onChunk("!");
          return "Hello world!";
        },
      );

      const config: BotConfig = {
        generateResponse: vi.fn(),
        streamResponse,
        streamThrottleMs: 10,
      };
      cleanup = attachBotObserver(doc, config);

      threadArray.push([createMessage("@kai greet me")]);

      // Wait for streaming to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      const messages = Array.from(threadArray);
      // Should have original + bot response
      expect(messages.length).toBeGreaterThanOrEqual(2);

      // Final bot message should not be streaming
      const botMsg = messages.find(
        (m) => m.authorId === "kai-bot" && !m.isStreaming,
      );
      expect(botMsg).toBeDefined();
      expect(botMsg!.content).toBe("Hello world!");

      cleanup();
    });

    it("handles streaming errors with partial content", async () => {
      const streamResponse = vi.fn(
        async (prompt: string, onChunk: (chunk: string) => void) => {
          onChunk("Partial ");
          onChunk("content");
          throw new Error("Stream interrupted");
        },
      );

      const config: BotConfig = {
        generateResponse: vi.fn(),
        streamResponse,
        streamThrottleMs: 10,
      };
      cleanup = attachBotObserver(doc, config);

      threadArray.push([createMessage("@kai tell me a story")]);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const messages = Array.from(threadArray);
      const botMsg = messages.find((m) => m.authorId === "kai-bot");
      expect(botMsg).toBeDefined();
      expect(botMsg!.content).toContain("Partial content");
      expect(botMsg!.content).toContain("interrupted");
      expect(botMsg!.isStreaming).toBe(false);

      cleanup();
    });

    it("prevents duplicate responses for the same message", async () => {
      let callCount = 0;
      const streamResponse = vi.fn(async (prompt, onChunk) => {
        callCount++;
        onChunk("response");
        return "response";
      });

      const config: BotConfig = {
        generateResponse: vi.fn(),
        streamResponse,
        streamThrottleMs: 10,
      };
      cleanup = attachBotObserver(doc, config);

      // Push the same message twice rapidly
      const msg = createMessage("@kai hello");
      threadArray.push([msg]);
      threadArray.push([msg]); // Duplicate
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should only process once due to dedup
      expect(callCount).toBe(1);

      cleanup();
    });
  });

  describe("topic watching", () => {
    it("observes new topics created after attachment", async () => {
      const generateResponse = vi.fn().mockResolvedValue("new topic response");
      cleanup = attachBotObserver(doc, { generateResponse });

      // Create a new topic AFTER observer is attached
      const newTopicId = "new-topic";
      topicsMap.set(newTopicId, { name: "New Topic", scope: "unit:123" });
      const newThread = doc.getArray<ChatMessage>(`thread-${newTopicId}`);

      newThread.push([createMessage("@kai what is this topic about?")]);
      await flushPromises();

      expect(generateResponse).toHaveBeenCalledWith(
        "what is this topic about?",
        expect.objectContaining({
          topicName: "New Topic",
          scope: "unit:123",
        }),
      );

      cleanup();
    });

    it("provides recent messages as context", async () => {
      const generateResponse = vi.fn().mockResolvedValue("contextual response");
      cleanup = attachBotObserver(doc, { generateResponse });

      // Add some prior messages
      threadArray.push([createMessage("I have a question about biology")]);
      threadArray.push([createMessage("Can someone explain DNA?")]);
      threadArray.push([createMessage("@kai explain DNA replication")]);
      await flushPromises();

      const context = generateResponse.mock.calls[0][1];
      expect(context.recentMessages).toHaveLength(3);
      expect(context.recentMessages[0].content).toBe(
        "I have a question about biology",
      );

      cleanup();
    });
  });

  describe("cleanup", () => {
    it("stops observing after cleanup is called", async () => {
      const generateResponse = vi.fn().mockResolvedValue("response");
      cleanup = attachBotObserver(doc, { generateResponse });
      cleanup();

      threadArray.push([createMessage("@kai should be ignored")]);
      await flushPromises();

      expect(generateResponse).not.toHaveBeenCalled();
    });
  });

  describe("separate docs per bot (sage in its own doc)", () => {
    let sageDoc: Y.Doc;
    let sageTopicsMap: Y.Map<any>;
    let sageThreadArray: Y.Array<ChatMessage>;
    let sageCleanup: () => void;

    beforeEach(() => {
      sageDoc = new Y.Doc();
      sageTopicsMap = sageDoc.getMap("topics");
      sageTopicsMap.set(TOPIC_ID, { name: "Test Topic", scope: "section" });
      sageThreadArray = sageDoc.getArray(`thread-${TOPIC_ID}`);
    });

    it("responds to @sage mentions in its own doc", async () => {
      const sageGenerate = vi
        .fn()
        .mockResolvedValue("Here are your class analytics.");

      const sageConfig: BotConfig = {
        generateResponse: sageGenerate,
        botName: "Sage",
        botAuthorId: "sage-bot",
      };
      sageCleanup = attachBotObserver(sageDoc, sageConfig);

      sageThreadArray.push([
        createMessage("@sage show me student progress", {
          mentions: ["@sage"],
          authorId: "instructor-1",
          authorName: "Ms. Smith",
        }),
      ]);
      await flushPromises();

      expect(sageGenerate).toHaveBeenCalledWith(
        "show me student progress",
        expect.objectContaining({ topicName: "Test Topic" }),
      );

      const messages = Array.from(sageThreadArray);
      expect(messages).toHaveLength(2);
      expect(messages[1].authorId).toBe("sage-bot");
      expect(messages[1].authorName).toBe("Sage");
      expect(messages[1].content).toBe("Here are your class analytics.");

      sageCleanup();
    });

    it("DualBotConfig routes kai from .kai field", async () => {
      const kaiGenerate = vi.fn().mockResolvedValue("Let me help you learn!");
      const sageGenerate = vi.fn().mockResolvedValue("Sage response");

      const dualConfig: DualBotConfig = {
        kai: {
          generateResponse: kaiGenerate,
          botName: "Kai",
          botAuthorId: "kai-bot",
        },
        sage: {
          generateResponse: sageGenerate,
          botName: "Sage",
          botAuthorId: "sage-bot",
        },
      };
      // When DualBotConfig is passed, attachBotObserver uses the .kai field
      cleanup = attachBotObserver(doc, dualConfig);

      threadArray.push([createMessage("@kai what is DNA?")]);
      await flushPromises();

      expect(kaiGenerate).toHaveBeenCalled();
      expect(sageGenerate).not.toHaveBeenCalled();

      const messages = Array.from(threadArray);
      expect(messages[1].authorId).toBe("kai-bot");
      expect(messages[1].authorName).toBe("Kai");

      cleanup();
    });

    it("sage doc ignores sage-bot's own messages", async () => {
      const sageGenerate = vi.fn().mockResolvedValue("response");

      const sageConfig: BotConfig = {
        generateResponse: sageGenerate,
        botName: "Sage",
        botAuthorId: "sage-bot",
      };
      sageCleanup = attachBotObserver(sageDoc, sageConfig);

      sageThreadArray.push([
        createMessage("@sage hello", {
          authorId: "sage-bot",
          mentions: ["@sage"],
        }),
      ]);
      await flushPromises();

      expect(sageGenerate).not.toHaveBeenCalled();

      sageCleanup();
    });

    it("kai doc does not respond to @sage mentions", async () => {
      const kaiGenerate = vi.fn().mockResolvedValue("response");

      const kaiConfig: BotConfig = {
        generateResponse: kaiGenerate,
        botName: "Kai",
        botAuthorId: "kai-bot",
      };
      cleanup = attachBotObserver(doc, kaiConfig);

      threadArray.push([
        createMessage("@sage help me with grades", {
          mentions: ["@sage"],
          authorId: "instructor-1",
        }),
      ]);
      await flushPromises();

      // Kai should NOT respond to @sage
      expect(kaiGenerate).not.toHaveBeenCalled();
      expect(Array.from(threadArray)).toHaveLength(1);

      cleanup();
    });
  });
});

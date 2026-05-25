"use client";

/**
 * KaiBot — Handles @kai mention detection, context building, and AI response posting.
 *
 * When a message containing @kai is detected, this module:
 * 1. Extracts the user's question
 * 2. Builds context from unit/section/dictionary data
 * 3. Calls the AI endpoint (Vercel AI SDK route)
 * 4. Posts the response back into the thread as "Kai"
 *
 * @module CollaborativeChat/KaiBot
 */

import type { ChatCollaborationProvider, ChatMessage } from "./types";
import { extractKaiPrompt, mentionsKai } from "./types";

export interface KaiBotConfig {
  /** API route for chat completions */
  apiEndpoint?: string;
  /** Current unit content for context */
  unitContent?: string;
  /** Dictionary words for context */
  dictionaryWords?: Array<{ word: string; definition: string }>;
  /** Section name for context */
  sectionName?: string;
  /** Unit name for context */
  unitName?: string;
}

const DEFAULT_ENDPOINT = "/api/chat";

/**
 * Build a system prompt for Kai with available context.
 */
function buildSystemPrompt(config: KaiBotConfig): string {
  const parts = [
    "You are Kai, a helpful AI teaching assistant in a collaborative study chat.",
    "Be concise, friendly, and educational. Use simple language appropriate for students.",
    "If you don't know something, say so honestly.",
  ];

  if (config.unitName) {
    parts.push(`\nCurrent unit: "${config.unitName}"`);
  }
  if (config.sectionName) {
    parts.push(`Class section: "${config.sectionName}"`);
  }
  if (config.unitContent) {
    parts.push(`\nUnit content summary:\n${config.unitContent.slice(0, 2000)}`);
  }
  if (config.dictionaryWords && config.dictionaryWords.length > 0) {
    const wordList = config.dictionaryWords
      .slice(0, 20)
      .map((w) => `- ${w.word}: ${w.definition}`)
      .join("\n");
    parts.push(`\nVocabulary words:\n${wordList}`);
  }

  return parts.join("\n");
}

/**
 * Process a message and generate an AI response if @kai is mentioned.
 * Returns the response text, or null if no @kai mention.
 */
export async function processKaiMention(
  message: ChatMessage,
  config: KaiBotConfig,
): Promise<string | null> {
  if (!mentionsKai(message)) return null;

  const prompt = extractKaiPrompt(message.content);
  if (!prompt) return null;

  const endpoint = config.apiEndpoint || DEFAULT_ENDPOINT;
  const systemPrompt = buildSystemPrompt(config);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[KaiBot] API error:", response.status);
      return "Sorry, I encountered an error. Please try again.";
    }

    // Handle streaming response (collect all chunks)
    const reader = response.body?.getReader();
    if (!reader) {
      const json = await response.json();
      return json.content || json.text || "I couldn't generate a response.";
    }

    const decoder = new TextDecoder();
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    // Try to parse as streaming text or JSON
    return result.trim() || "I couldn't generate a response.";
  } catch (error) {
    console.error("[KaiBot] Error:", error);
    return "Sorry, I encountered an error processing your question. Please try again.";
  }
}

/**
 * Hook-compatible handler: watches for @kai messages and posts responses.
 * Call this after a message is sent to check if Kai should respond.
 */
export async function handleKaiResponse(
  provider: ChatCollaborationProvider,
  topicId: string,
  message: ChatMessage,
  config: KaiBotConfig,
): Promise<void> {
  const responseText = await processKaiMention(message, config);
  if (!responseText) return;

  // Post as Kai bot in the same thread (as a reply to the triggering message)
  const threadArray = provider.getThreadArray(topicId);
  const kaiMessage: ChatMessage = {
    id: crypto.randomUUID(),
    parentId: message.id,
    authorId: "kai-bot",
    authorName: "Kai",
    content: responseText,
    mentions: [],
    createdAt: new Date().toISOString(),
    editedAt: null,
    reactions: {},
  };
  threadArray.push([kaiMessage]);
}

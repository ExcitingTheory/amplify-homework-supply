"use server";

/**
 * Chat Server Action
 *
 * Replaces the `client.mutations.chat` Lambda for non-streaming chat.
 * Used by RecordingStudio3 for Fountain screenplay generation.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return createOpenAI({ apiKey });
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Generate a chat completion from a list of messages.
 * Replaces the openai Lambda `chat` mutation.
 */
export async function chatCompletion(params: {
  messages: ChatMessage[];
  model?: string;
}): Promise<string> {
  const openai = getOpenAI();
  const model = params.model || "gpt-4o";

  const { text } = await generateText({
    model: openai(model),
    messages: params.messages,
    temperature: 0.7,
    maxOutputTokens: 4000,
  });

  return text;
}

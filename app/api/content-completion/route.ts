/**
 * Content Completion Route Handler
 *
 * Replaces the contentCompletionStream Lambda with a Next.js Route Handler.
 * Provides inline AI autocomplete for the Lexical editor during authoring.
 *
 * This is the most latency-sensitive AI feature — cold start elimination
 * is critical since suggestions appear while the instructor is typing.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { requireAuth } from "../_shared/auth";

export const maxDuration = 15; // Shorter timeout for autocomplete

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { prompt, context } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const openai = createOpenAI({ apiKey });

    // Build system message
    let systemMessage = `You are an AI assistant helping to create educational content. Complete the given text naturally and pedagogically.`;

    if (context) {
      if (context.unitName) {
        systemMessage += `\n\nCurrent Unit: ${context.unitName}`;
      }
      if (context.lastBlocks) {
        systemMessage += `\n\nRecent context: ${JSON.stringify(context.lastBlocks)}`;
      }
      if (context.language) {
        systemMessage += `\n\nContent language: ${context.language}`;
      }
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemMessage,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxOutputTokens: 500,
      maxRetries: 1,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[ContentCompletion Route] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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
    let systemMessage = `You are an AI assistant helping to create educational content. Complete the given text naturally and pedagogically. Your suggestions should fit within the progression of the course.`;

    if (context) {
      if (context.unit?.name) {
        systemMessage += `\n\nCurrent Unit: ${context.unit.name}`;
        if (context.unit?.description) {
          systemMessage += `\nUnit Description: ${context.unit.description}`;
        }
      }
      if (context.courseOutline && Array.isArray(context.courseOutline)) {
        systemMessage += `\n\nCourse Chapter Outline (for progression context):`;
        for (const entry of context.courseOutline) {
          const marker = entry.unitId === context.unit?.id ? " ← CURRENT" : "";
          systemMessage += `\n  ${entry.number != null ? `${entry.number}. ` : "• "}${entry.name}${marker}`;
          if (entry.summary) {
            systemMessage += `\n    ${entry.summary.split("\n").join("\n    ")}`;
          }
        }
      }
      if (context.draftHeadings && context.draftHeadings.length > 0) {
        systemMessage += `\n\nCurrent draft headings in this unit:`;
        for (const heading of context.draftHeadings) {
          systemMessage += `\n  • ${heading}`;
        }
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

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("[ContentCompletion Route] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

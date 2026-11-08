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
import {
  checkAiRateLimit,
  getClientKey,
  rateLimitResponse,
} from "../_shared/rateLimit";

export const maxDuration = 15; // Shorter timeout for autocomplete

function formatResources(
  label: string,
  entries: unknown,
  fields: string[],
  limit: number,
): string {
  if (!Array.isArray(entries) || entries.length === 0) return "";
  const formatted = entries
    .slice(0, limit)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const safeItem: Record<string, string | string[]> = {};
      for (const field of fields) {
        const value = item[field];
        if (typeof value === "string" && value.trim()) {
          safeItem[field] = value.slice(0, field === "prompt" ? 300 : 500);
        } else if (
          field === "choices" &&
          Array.isArray(value) &&
          value.every((choice) => typeof choice === "string")
        ) {
          safeItem[field] = value.slice(0, 8).map((choice) => choice.slice(0, 160));
        }
      }
      return Object.keys(safeItem).length > 0
        ? `  ${JSON.stringify(safeItem)}`
        : "";
    })
    .filter(Boolean);
  return formatted.length > 0
    ? `\n\nAvailable ${label}:\n${formatted.join("\n")}`
    : "";
}

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authError = await requireAuth();
    if (authError) return authError;

    const rateLimit = checkAiRateLimit(getClientKey(req));
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

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
    let systemMessage = `You are an AI assistant helping an instructor create educational content. Complete the given text naturally and pedagogically, following the course progression. Usually continue with prose. Add an interactive block only when it clearly improves the lesson and the relevant item is available below. Never invent resource references.

Interactive block codes (put each on its own line, with a blank line before and after):
- :::quiz[q1,q2] creates a quiz using the listed question references.
- :::answer[w1,w2]{direction=word-to-definition;prompt=text,audio;input=text,audio,writing} creates a vocabulary answer exercise. Direction can be word-to-definition or definition-to-word; prompt supports text or audio; input supports text, audio, or writing.
- :::meaning[w1,w2] creates a word-to-meaning association exercise.
- :::custom-answer[q1]{direction=question-to-answer;prompt=text;input=text} creates a custom answer exercise using listed questions. Direction can be question-to-answer or answer-to-question; prompt supports text, audio, phrase, definition, or pronunciation; input supports text, audio, or writing. The prompt and input options are comma-separated lists; omit any option to keep the block's default.
- :::word[w1] inserts a standalone vocabulary word card.
- :::playlist[f1,f2] inserts an audio/video playlist from listed media files.
- :::conversation-playlist[f1,f2] inserts a conversation playlist from listed audio files.
- :::file[f1] inserts a generic file metadata card, not an embedded file or PDF.
- :::pdf[f1] embeds a listed PDF in the lesson.
- :::image[f1] inserts a listed image.
- :::youtube[VIDEO_ID] embeds a YouTube video; use only an 11-character video ID present in the user's text.
- :::call-response[q1,q2] creates a call-and-response activity from listed questions that have both a prompt and an answer.

References are temporary, type-specific indices: qN means question, wN means vocabulary word, and fN means file. Use only references from the available lists, and do not write UUIDs or other IDs. Choose only a few relevant items. To introduce or define a listed vocabulary word, insert its :::word card instead of writing the definition as prose; the card already shows the definition. When you add :::word cards, place any :::meaning exercise after them so learners see the words first. Do not insert a block in the middle of a sentence; finish the sentence first.`;

    if (context) {
      if (context.mode === "block-suggestion") {
        systemMessage += "\n\nSuggest the next complete pedagogically appropriate lesson block, not an inline sentence continuation. Return only the block's Markdown, including supported interactive block codes where appropriate. Do not include explanations about the suggestion or wrap the Markdown in a code fence.";
      }
      if (context.unit?.name) {
        systemMessage += `\n\nCurrent Unit: ${context.unit.name}`;
        if (context.unit?.description) {
          systemMessage += `\nUnit Description: ${context.unit.description}`;
        }
      }
      if (context.courseOutline && Array.isArray(context.courseOutline)) {
        systemMessage += `\n\nCourse Chapter Outline (for progression context):`;
        for (const entry of context.courseOutline) {
          const marker = entry.isCurrent ? " ← CURRENT" : "";
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
      const resources = context.resources;
      if (resources && typeof resources === "object") {
        systemMessage += formatResources(
          "vocabulary words (use their wN refs)",
          resources.vocabulary,
          ["ref", "phrase", "pronunciation", "definition"],
          20,
        );
        systemMessage += formatResources(
          "questions (use their qN refs)",
          resources.questions,
          ["ref", "prompt", "choices", "difficulty"],
          12,
        );
        systemMessage += formatResources(
          "unit-attached files (use their fN refs)",
          resources.files,
          ["ref", "name", "description", "summary", "mimeType"],
          12,
        );
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

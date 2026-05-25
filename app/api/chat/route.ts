/**
 * Chat Stream Route Handler
 *
 * Replaces the Lambda-based chatStream function with a Next.js Route Handler.
 * Benefits: No cold start, same-origin, native streaming support.
 *
 * Routes between two bot personas based on user role:
 * - Kai (students): Tutoring, hints, Socratic method. No answer reveals.
 * - Sage (instructors): Content creation, analytics, block insertion.
 *
 * The OpenAI API key is read from environment variables (set in .env.local or
 * deployment environment). For Amplify deployments, set OPENAI_API_KEY in the
 * Amplify environment variables or use AWS SSM via the Amplify backend.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, UIMessage } from "ai";
import { z } from "zod";
import { blockTools } from "../_shared/blockTools";
import { validateAuth } from "../_shared/auth";
import {
  resolvePersona,
  filterToolsByPersona,
  buildPersonaSystemMessage,
  type BotPersona,
} from "../_shared/botPersonas";

export const maxDuration = 30; // seconds (matches Lambda timeout of 29s)

// All available tools — persona filtering happens below
const allChatTools = {
  // Client-side tool — executed in browser with access to DataStore
  search_content: tool({
    description:
      "Search through unit content, class sections, file contents, questions, answers, vocabulary words, and definitions using semantic search.",
    parameters: z.object({
      query: z.string().describe("The search query text"),
      type: z
        .enum(["all", "files", "words", "questions"])
        .optional()
        .describe("Type of content to search"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return"),
    }),
    // No execute — client-side only
  }),

  // Client-side tool — launches practice drill on client
  startPracticeDrill: tool({
    description:
      "Start a practice drill session for the current unit. Opens the practice drill dialog so the student can practice with AI-generated questions.",
    parameters: z.object({
      drillType: z
        .enum([
          "mixed",
          "quiz",
          "answer",
          "meaning-association",
          "custom-answer",
        ])
        .optional()
        .describe("Type of drill to generate. Defaults to mixed."),
      count: z
        .number()
        .optional()
        .describe("Number of questions to generate. Defaults to 10."),
    }),
    // No execute — client-side only
  }),

  // Client-side tool — creates section via DataStore on client
  create_section: tool({
    description:
      "Create a new class section (group of students) with a name and optional description. Can optionally copy gamification settings (leveling curve, XP multipliers, badges) from an existing section.",
    parameters: z.object({
      name: z.string().describe("Name of the section"),
      description: z
        .string()
        .optional()
        .describe("Optional description of the section"),
      copySettingsFromSectionId: z
        .string()
        .optional()
        .describe(
          "Optional section ID to copy gamification settings from (leveling curve, XP multipliers, badge configs)",
        ),
    }),
    // No execute — client-side only
  }),

  copy_gamification_settings: tool({
    description:
      "Copy gamification settings (leveling curve, XP multipliers, badge configs) from one section to another. Use when a teacher wants to reuse their gamification configuration across sections.",
    parameters: z.object({
      sourceSectionId: z
        .string()
        .describe("The section ID to copy settings FROM"),
      targetSectionId: z
        .string()
        .describe("The section ID to copy settings TO"),
    }),
    // No execute — client-side only
  }),

  // Server-side block insertion tools
  ...blockTools,
};

export async function POST(req: Request) {
  try {
    // Verify authentication and get user groups
    const auth = await validateAuth();
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, context, persona: explicitPersona } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[Chat Route] OPENAI_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Resolve persona based on user groups (or explicit override)
    const persona = resolvePersona(
      auth.groups,
      explicitPersona as BotPersona | undefined,
    );

    console.log(
      `[Chat Route] Using persona: ${persona.name} (groups: ${auth.groups?.join(", ") || "none"})`,
    );

    const openai = createOpenAI({ apiKey });

    // Build system message with persona-specific prompt + context
    const systemMessage = buildPersonaSystemMessage(persona, context);

    // Filter tools to only those allowed by this persona
    const tools = filterToolsByPersona(allChatTools, persona);

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemMessage,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools,
      temperature: persona.temperature,
      maxOutputTokens: persona.maxOutputTokens,
      maxRetries: 1,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[Chat Route] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

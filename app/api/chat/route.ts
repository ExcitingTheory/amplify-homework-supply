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

  // Recording Studio 3 script generation tool - produces scriptData JSON for RS3 presets
  create_recording_script: tool({
    description: `Generate a Recording Studio 3 script as structured JSON, stored inside a Word or File model.
- "word": Creates/updates a Word record with phrase and definition tracks. Speaker IDs: phrase_track, definition_track.
- "conversation": Creates a File record (application/json) with a multi-speaker dialogue script.
- "question": Creates a File record (application/json) with prompt and answer tracks. Speaker IDs: prompt_track, answer_track.
The script can be opened in Recording Studio 3 for TTS generation or human recording.`,
    parameters: z.object({
      preset: z
        .enum(["word", "conversation", "question"])
        .describe("The RS3 preset type"),
      title: z.string().describe("Title for the recording script"),
      scene: z
        .string()
        .optional()
        .describe('Scene description (e.g., "INT. CLASSROOM - MORNING")'),
      speakers: z
        .record(
          z.string(),
          z.object({
            name: z.string().describe("Display name of the speaker"),
            voice: z
              .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
              .optional()
              .describe("TTS voice to use (default: alloy)"),
            description: z
              .string()
              .optional()
              .describe(
                'Character description (e.g., "30s, energetic, teacher")',
              ),
          }),
        )
        .describe(
          'Map of speaker IDs to speaker config. For "word" preset use keys "phrase_track" and "definition_track". For "question" preset use "prompt_track" and "answer_track". For "conversation" use any descriptive keys.',
        ),
      dialogue: z
        .array(
          z.object({
            speaker: z
              .string()
              .describe("Speaker ID matching a key in the speakers object"),
            text: z.string().describe("The line of dialogue or text to speak"),
            direction: z
              .string()
              .optional()
              .describe(
                'Acting/delivery direction (e.g., "slowly, with emphasis")',
              ),
            emotion: z
              .string()
              .optional()
              .describe(
                'Emotional tone (e.g., "cheerful", "serious", "questioning")',
              ),
          }),
        )
        .describe("Ordered array of dialogue lines"),
      pronunciation: z
        .string()
        .optional()
        .describe('Phonetic pronunciation for word preset (e.g., "koh-hee")'),
      existingWordId: z
        .string()
        .optional()
        .describe(
          "ID of an existing Word to update with this script (word preset only)",
        ),
      existingFileId: z
        .string()
        .optional()
        .describe(
          "ID of an existing File to update with this script (conversation/question presets only)",
        ),
    }),
    execute: async ({
      preset,
      title,
      scene,
      speakers,
      dialogue,
      pronunciation,
      existingWordId,
      existingFileId,
    }) => {
      const speakerIds = Object.keys(speakers);
      const warnings: string[] = [];

      if (preset === "word") {
        if (!speakerIds.includes("phrase_track"))
          warnings.push('Word preset should include "phrase_track" speaker');
        if (!speakerIds.includes("definition_track"))
          warnings.push(
            'Word preset should include "definition_track" speaker',
          );
      } else if (preset === "question") {
        if (!speakerIds.includes("prompt_track"))
          warnings.push(
            'Question preset should include "prompt_track" speaker',
          );
        if (!speakerIds.includes("answer_track"))
          warnings.push(
            'Question preset should include "answer_track" speaker',
          );
      }

      const unknownSpeakers = dialogue
        .map((d: any) => d.speaker)
        .filter((s: string) => !speakerIds.includes(s));
      if (unknownSpeakers.length > 0) {
        warnings.push(
          `Dialogue references undefined speakers: ${[...new Set(unknownSpeakers)].join(", ")}`,
        );
      }

      const scriptData = {
        metadata: {
          title,
          scene: scene || "",
          date: new Date().toISOString().split("T")[0],
          version: "1.0",
        },
        speakers: Object.fromEntries(
          Object.entries(speakers).map(([id, config]: [string, any]) => [
            id,
            {
              name: config.name,
              voice: config.voice || "alloy",
              description: config.description || "",
            },
          ]),
        ),
        dialogue: dialogue.map((line: any, index: number) => ({
          id: index + 1,
          speaker: line.speaker,
          text: line.text,
          timing: { start: 0, end: 0 },
          direction: line.direction || "",
          emotion: line.emotion || "",
          takes: [],
          activeTakeIndex: 0,
        })),
      };

      const lockedTracks =
        preset === "word"
          ? ["phrase_track", "definition_track"]
          : preset === "question"
            ? ["prompt_track", "answer_track"]
            : [];

      let wordData = undefined;
      if (preset === "word") {
        const phraseLines = dialogue.filter(
          (d: any) => d.speaker === "phrase_track",
        );
        const definitionLines = dialogue.filter(
          (d: any) => d.speaker === "definition_track",
        );
        wordData = {
          phrase: phraseLines.map((d: any) => d.text).join(" "),
          definition: definitionLines.map((d: any) => d.text).join(" "),
          pronunciation: pronunciation || "",
          existingWordId: existingWordId || null,
        };
      }

      let fileData = undefined;
      if (preset === "conversation" || preset === "question") {
        fileData = {
          name: `${title
            .replace(/[^a-zA-Z0-9-_ ]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase()}.json`,
          mimeType: "application/json",
          existingFileId: existingFileId || null,
        };
      }

      return {
        success: true,
        action: "create_recording_script",
        preset,
        scriptData,
        lockedTracks,
        wordData,
        fileData,
        warnings: warnings.length > 0 ? warnings : undefined,
        preview: {
          title,
          preset,
          speakerCount: speakerIds.length,
          speakers: Object.entries(speakers).map(
            ([id, config]: [string, any]) => ({
              id,
              name: config.name,
              voice: config.voice || "alloy",
            }),
          ),
          dialogueCount: dialogue.length,
          dialoguePreview: dialogue.slice(0, 5).map((line: any) => ({
            speaker: speakers[line.speaker]?.name || line.speaker,
            text:
              line.text.length > 80
                ? line.text.substring(0, 80) + "..."
                : line.text,
          })),
          ...(wordData
            ? {
                wordPhrase: wordData.phrase,
                wordDefinition: wordData.definition,
              }
            : {}),
          ...(fileData ? { fileName: fileData.name } : {}),
        },
        message: `Recording script "${title}" ready with ${dialogue.length} lines across ${speakerIds.length} speaker(s)`,
      };
    },
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

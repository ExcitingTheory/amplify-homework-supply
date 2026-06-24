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
import {
  streamText,
  tool,
  convertToModelMessages,
  UIMessage,
  generateText,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { blockTools } from "../_shared/blockTools";
import { validateAuth } from "../_shared/auth";
import {
  resolvePersona,
  filterToolsByPersona,
  buildPersonaSystemMessage,
  resolveAgentConfig,
  type BotPersona,
  type ResolvedAgentConfig,
} from "../_shared/botPersonas";
import { buildAgentTools, type AgentContext } from "../_shared/agentTools";

export const maxDuration = 30; // seconds (matches Lambda timeout of 29s)

// ─── Token Budget Utilities ──────────────────────────────────────────────────

/**
 * Approximate token count using the ~4 chars/token heuristic.
 * Fast and allocation-free — suitable for budget enforcement.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within a token budget.
 * Preserves whole words at the boundary and appends a truncation notice.
 */
function truncateToTokenBudget(text: string, budget: number): string {
  const estimated = estimateTokens(text);
  if (estimated <= budget) return text;

  const charLimit = budget * 4;
  let truncated = text.substring(0, charLimit);
  // Find last space to avoid mid-word cut
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > charLimit * 0.8) {
    truncated = truncated.substring(0, lastSpace);
  }
  return truncated + "\n\n[...truncated to fit token budget]";
}

// ─── Token Usage Tracking ────────────────────────────────────────────────────

/**
 * Persist actual token usage from the LLM response to the AssistantChat record.
 * Accumulates totals across turns for quota enforcement.
 * Uses the active chat record (type=chat) for the user+unit+section.
 */
async function trackTokenUsage(
  ctx: AgentContext,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  },
  stepCount: number,
) {
  try {
    const { getServerClient } = await import("@/utils/amplifyServerClient");
    const client = getServerClient();

    // Find the active chat record for this user + unit
    const filter: Record<string, any> = { type: { eq: "chat" } };
    if (ctx.unitId) filter.unitID = { eq: ctx.unitId };

    const { data: chats } = await (client as any).models.AssistantChat.list({
      filter,
      limit: 1,
    });

    const chat = chats?.find(
      (c: any) => c != null && c.unitID === ctx.unitId && c.type === "chat",
    );

    if (chat) {
      // Accumulate token counts on existing record
      await (client as any).models.AssistantChat.update({
        id: chat.id,
        totalPromptTokens: (chat.totalPromptTokens || 0) + usage.promptTokens,
        totalCompletionTokens:
          (chat.totalCompletionTokens || 0) + usage.completionTokens,
        totalTokens: (chat.totalTokens || 0) + usage.totalTokens,
        turnCount: (chat.turnCount || 0) + 1,
        lastTurnPromptTokens: usage.promptTokens,
        lastTurnCompletionTokens: usage.completionTokens,
        _version: chat._version,
      });
    } else {
      // Create a new chat record with initial token counts
      await (client as any).models.AssistantChat.create({
        type: "chat",
        unitID: ctx.unitId || undefined,
        sectionID: ctx.sectionId || undefined,
        totalPromptTokens: usage.promptTokens,
        totalCompletionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        turnCount: 1,
        lastTurnPromptTokens: usage.promptTokens,
        lastTurnCompletionTokens: usage.completionTokens,
      });
    }
  } catch (error: any) {
    // Non-fatal — don't crash the response for tracking failures
    console.warn("[trackTokenUsage] Failed:", error.message);
  }
}

// ─── Conversation Summarizer ─────────────────────────────────────────────────

/**
 * Summarize a conversation and update the memory record asynchronously.
 * Runs after the final response step via onFinish (non-blocking).
 */
async function summarizeAndUpdateMemory(
  apiKey: string,
  agentCtx: AgentContext,
  messages: any[],
  toolCallCount: number,
) {
  // Only summarize if there were meaningful exchanges (3+ messages)
  if (messages.length < 3) return;
  // Only summarize if user has a unit context
  if (!agentCtx.unitId) return;

  try {
    const openai = createOpenAI({ apiKey });
    const { getServerClient } = await import("@/utils/amplifyServerClient");
    const client = getServerClient();

    // Extract last few messages for summary (avoid token explosion)
    const recentMessages = messages.slice(-10);
    const conversationText = recentMessages
      .map((m: any) => {
        const role = m.role === "user" ? "Student" : "Assistant";
        const text =
          typeof m.content === "string"
            ? m.content
            : m.parts
                ?.filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("") || "";
        return `${role}: ${text.substring(0, 500)}`;
      })
      .join("\n");

    // Generate summary via lightweight model
    const { text: newSummary } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a conversation summarizer for an educational platform. Produce a 2-3 sentence summary of what was discussed, what the student learned or struggled with, and any key takeaways. Be concise and factual.",
      prompt: conversationText,
      maxOutputTokens: 200,
    });

    // Generate embedding for semantic memory recall
    let embedding: number[] | undefined;
    try {
      const embeddingResponse = await fetch(
        "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: newSummary,
            dimensions: 512,
          }),
        },
      );
      if (embeddingResponse.ok) {
        const embResult = await embeddingResponse.json();
        embedding = embResult.data?.[0]?.embedding;
      }
    } catch {
      // Non-fatal — continue without embedding
    }

    // Find existing memory record for this user + unit
    const { data: existing } = await (client as any).models.AssistantChat.list({
      filter: {
        type: { eq: "memory" },
        unitID: { eq: agentCtx.unitId },
      },
      limit: 5,
    });

    const memory = existing?.find(
      (m: any) => m?.unitID === agentCtx.unitId && m?.type === "memory",
    );

    if (memory) {
      // Append to rolling summary (keep last 3 summaries)
      const existingSummary = memory.summary || "";
      const separator = existingSummary ? "\n---\n" : "";
      let combined = existingSummary + separator + newSummary;

      // Trim to last 3 summary blocks
      const blocks = combined.split("\n---\n");
      if (blocks.length > 3) {
        combined = blocks.slice(-3).join("\n---\n");
      }

      const updatePayload: Record<string, any> = {
        id: memory.id,
        summary: combined,
        _version: memory._version,
      };
      if (embedding) {
        updatePayload.embedding = JSON.stringify(embedding);
        updatePayload.embeddingModel = "text-embedding-3-small";
        updatePayload.embeddingDimensions = 512;
      }

      await (client as any).models.AssistantChat.update(updatePayload);
    } else {
      // Create new memory record with summary
      const createPayload: Record<string, any> = {
        type: "memory",
        unitID: agentCtx.unitId,
        sectionID: agentCtx.sectionId || undefined,
        summary: newSummary,
      };
      if (embedding) {
        createPayload.embedding = JSON.stringify(embedding);
        createPayload.embeddingModel = "text-embedding-3-small";
        createPayload.embeddingDimensions = 512;
      }

      await (client as any).models.AssistantChat.create(createPayload);
    }

    console.log(
      `[Chat Route] Memory updated for unit ${agentCtx.unitId} (${toolCallCount} tool calls)`,
    );
  } catch (error) {
    // Non-fatal — don't crash the response
    console.warn("[Chat Route] Memory summarization failed:", error);
  }
}

// All available tools — persona filtering happens below
const allChatTools = {
  // Client-side tool — executed in browser with access to DataStore
  search_content: tool({
    description:
      "Search through unit content, class sections, file contents, questions, answers, vocabulary words, and definitions using semantic search.",
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    }: {
      preset: string;
      title: string;
      scene?: string;
      speakers: Record<
        string,
        { name: string; voice?: string; description?: string }
      >;
      dialogue: Array<{
        speaker: string;
        text: string;
        direction?: string;
        emotion?: string;
      }>;
      pronunciation?: string;
      existingWordId?: string;
      existingFileId?: string;
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

    // Build agent context for server-side tools
    const agentCtx: AgentContext = {
      userId: auth.userId!,
      groups: auth.groups || [],
      identityId: context?.identityId,
      unitId: context?.unit?.id,
      sectionId: context?.sectionId,
      courseOutline: context?.courseOutline,
    };

    // Build system message with persona-specific prompt + context
    let systemMessage = buildPersonaSystemMessage(persona, context);

    // Resolve model config: Section.aiConfig → PlatformSettings → persona defaults
    const agentConfig = await resolveAgentConfig(persona, context?.sectionId);

    // Append section/platform prompt overrides if present
    if (agentConfig.systemPromptAppend) {
      systemMessage += `\n\n${agentConfig.systemPromptAppend}`;
    }

    // Enforce system prompt token budget (only when enforcement is enabled)
    if (agentConfig.enforceTokenBudget) {
      systemMessage = truncateToTokenBudget(
        systemMessage,
        agentConfig.systemPromptBudget,
      );
    }

    // Merge server-side agent tools with client-side tools, then filter by persona
    const agentTools = buildAgentTools(agentCtx, apiKey, {
      toolResultBudget: agentConfig.enforceTokenBudget
        ? agentConfig.toolResultBudget
        : undefined,
    });
    const tools = filterToolsByPersona(
      { ...allChatTools, ...agentTools },
      persona,
    );

    let stepToolCallCount = 0;
    let accumulatedTokens = 0;
    const abortController = new AbortController();

    const result = streamText({
      model: openai(agentConfig.model),
      system: systemMessage,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools,
      stopWhen: stepCountIs(agentConfig.maxSteps),
      temperature: agentConfig.temperature,
      maxOutputTokens: agentConfig.maxOutputTokens,
      maxRetries: 1,
      abortSignal: abortController.signal,
      onStepFinish: ({ toolCalls, usage }) => {
        if (toolCalls?.length) {
          stepToolCallCount += toolCalls.length;
        }
        // Enforce totalTurnBudget across all steps
        if (usage && agentConfig.enforceTokenBudget) {
          accumulatedTokens +=
            ((usage as any).inputTokens || 0) +
            ((usage as any).outputTokens || 0);
          if (accumulatedTokens >= agentConfig.totalTurnBudget) {
            console.warn(
              `[Chat Route] totalTurnBudget exceeded (${accumulatedTokens}/${agentConfig.totalTurnBudget}), aborting.`,
            );
            abortController.abort();
          }
        }
      },
      onFinish: ({ usage, steps }) => {
        // Track token usage for quotas (fire-and-forget)
        if (usage) {
          trackTokenUsage(
            agentCtx,
            {
              promptTokens: (usage as any).inputTokens || 0,
              completionTokens: (usage as any).outputTokens || 0,
              totalTokens:
                ((usage as any).inputTokens || 0) +
                ((usage as any).outputTokens || 0),
            },
            steps?.length || 1,
          ).catch(() => {});
        }

        if (!agentConfig.memoryEnabled) return;
        // Fire-and-forget memory summarization (non-blocking)
        summarizeAndUpdateMemory(
          apiKey,
          agentCtx,
          messages,
          stepToolCallCount,
        ).catch(() => {});
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("[Chat Route] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

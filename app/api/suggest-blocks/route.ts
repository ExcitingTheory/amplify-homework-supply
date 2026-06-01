/**
 * Suggest Blocks Route Handler
 *
 * Replaces the suggestBlocksStream Lambda with a Next.js Route Handler.
 * Analyzes unit structure and suggests pedagogically appropriate next blocks.
 *
 * Uses tool calls to return structured block suggestions that the editor
 * can render as preview cards for instructor approval.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { requireAuth } from "../_shared/auth";

export const maxDuration = 30;

// Block suggestion tools (subset of blockTools adapted for route handler)
const suggestTools = {
  insert_heading: tool({
    description: "Insert a heading block into the lesson.",
    parameters: z.object({
      level: z.enum(["h1", "h2", "h3"]).describe("Heading level"),
      text: z.string().describe("The heading text content"),
      reasoning: z.string().describe("Pedagogical explanation for this block"),
    }),
    execute: async ({ level, text, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "heading",
      blockData: { level, text },
      preview: { level, text },
      reasoning,
      message: `Heading block: "${text}" (${level})`,
    }),
  }),
  insert_paragraph: tool({
    description: "Insert an explanatory paragraph block.",
    parameters: z.object({
      markdown: z.string().describe("Paragraph content in markdown format"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ markdown, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "paragraph",
      blockData: { markdown },
      preview: { text: markdown.substring(0, 100) },
      reasoning,
      message: `Paragraph block: "${markdown.substring(0, 50)}..."`,
    }),
  }),
  insert_quiz: tool({
    description: "Insert a multiple-choice quiz block using Question IDs.",
    parameters: z.object({
      questionIDs: z.array(z.string()).describe("Array of Question model IDs"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ questionIDs, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "quiz",
      blockData: { questionIDs },
      preview: { questionCount: questionIDs.length },
      reasoning,
      message: `Quiz block with ${questionIDs.length} questions`,
    }),
  }),
  insert_answer: tool({
    description: "Insert a vocabulary practice block using Word IDs.",
    parameters: z.object({
      wordIDs: z.array(z.string()).describe("Array of Word model IDs"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ wordIDs, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "answer",
      blockData: { wordIDs },
      preview: { wordCount: wordIDs.length },
      reasoning,
      message: `Answer block with ${wordIDs.length} words`,
    }),
  }),
  insert_meaning_association: tool({
    description:
      "Insert a drag-and-drop word matching block using 2-6 Word IDs.",
    parameters: z.object({
      wordIDs: z
        .array(z.string())
        .min(2)
        .max(6)
        .describe("Array of 2-6 Word model IDs"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ wordIDs, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "meaning-association",
      blockData: { wordIDs },
      preview: { wordCount: wordIDs.length },
      reasoning,
      message: `Meaning association with ${wordIDs.length} words`,
    }),
  }),
  insert_custom_answer: tool({
    description: "Insert an open-ended practice block using Question IDs.",
    parameters: z.object({
      questionIDs: z.array(z.string()).describe("Array of Question model IDs"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ questionIDs, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "custom-answer",
      blockData: { questionIDs },
      preview: { questionCount: questionIDs.length },
      reasoning,
      message: `Custom answer block with ${questionIDs.length} questions`,
    }),
  }),
  insert_markdown: tool({
    description:
      "Insert rich formatted content (lists, tables, emphasis, code, links).",
    parameters: z.object({
      markdown: z.string().describe("Content in markdown format"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ markdown, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "markdown",
      blockData: { markdown },
      preview: { text: markdown.substring(0, 100) },
      reasoning,
      message: `Markdown block: "${markdown.substring(0, 50)}..."`,
    }),
  }),
  insert_playlist: tool({
    description: "Insert an audio/video media playlist block using File IDs.",
    parameters: z.object({
      fileIDs: z.array(z.string()).describe("Array of File model IDs"),
      reasoning: z.string().describe("Pedagogical explanation"),
    }),
    execute: async ({ fileIDs, reasoning }) => ({
      success: true,
      action: "insert_editor_block",
      blockType: "playlist",
      blockData: { fileIDs },
      preview: { fileCount: fileIDs.length },
      reasoning,
      message: `Playlist block with ${fileIDs.length} files`,
    }),
  }),
};

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { unitStructure, currentContext, dictionary, questionBank } = body;

    if (!unitStructure) {
      return new Response(
        JSON.stringify({ error: "unitStructure is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
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

    const systemMessage = `You are an expert educational content designer.

Analyze the provided lesson structure and suggest the next logical blocks that would best serve the pedagogical progression. Call the appropriate insert tools to suggest blocks.

Guidelines:
1. Consider what content already exists
2. Identify gaps in the learning sequence
3. Recommend blocks that build on previous content
4. Call multiple tools to suggest 2-4 blocks in priority order
5. Only use IDs that exist in the provided dictionary (for wordIDs), question bank (for questionIDs), or files list (for fileIDs)`;

    // Build user message with available resources
    let userContent = `Unit Structure:\n${JSON.stringify(unitStructure, null, 2)}\n\nCurrent Context:\n${JSON.stringify(currentContext || {}, null, 2)}`;

    if (dictionary?.length) {
      const wordSummaries = dictionary.slice(0, 50).map((w: any) => ({
        id: w.id,
        word: w.phrase || w.word,
        definition: w.definition,
        phonetic: w.phonetic,
      }));
      userContent += `\n\nAvailable Dictionary Words (${dictionary.length} total, showing first 50):\n${JSON.stringify(wordSummaries, null, 2)}`;
    }

    if (questionBank?.length) {
      const questionSummaries = questionBank.slice(0, 30).map((q: any) => ({
        id: q.id,
        question: q.question,
        type: q.type,
      }));
      userContent += `\n\nAvailable Questions (${questionBank.length} total, showing first 30):\n${JSON.stringify(questionSummaries, null, 2)}`;
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemMessage,
      messages: [{ role: "user", content: userContent }],
      tools: suggestTools,
      toolChoice: "required",
      temperature: 0.7,
      maxOutputTokens: 3000,
      maxRetries: 1,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[SuggestBlocks Route] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Shared block insertion tool definitions for Route Handlers.
 *
 * Mirrors amplify/functions/shared/blockTools.ts for use in app/api/ routes.
 * Each tool returns structured block data for the Lexical editor to insert.
 */

import { tool } from "ai";
import { z } from "zod";

export const insert_heading = tool({
  description:
    "Insert a heading block into the lesson. Use for section titles and subsection headers.",
  parameters: z.object({
    level: z.enum(["h1", "h2", "h3"]).describe("Heading level"),
    text: z.string().describe("The heading text content"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for why this block fits here"),
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
});

export const insert_paragraph = tool({
  description:
    "Insert an explanatory paragraph block. Use for teaching content, explanations, and contextual information.",
  parameters: z.object({
    markdown: z.string().describe("Paragraph content in markdown format"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this content"),
  }),
  execute: async ({ markdown, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "paragraph",
    blockData: { markdown },
    preview: {
      text: markdown.substring(0, 150) + (markdown.length > 150 ? "..." : ""),
    },
    reasoning,
    message: `Paragraph block: ${markdown.substring(0, 80)}...`,
  }),
});

export const insert_markdown = tool({
  description:
    "Insert a rich markdown block. Use for structured content with lists, tables, bold, italic, code, links, etc.",
  parameters: z.object({
    markdown: z
      .string()
      .describe(
        "Full markdown content (supports headings, lists, tables, emphasis, links, code blocks)",
      ),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this content"),
  }),
  execute: async ({ markdown, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "markdown",
    blockData: { markdown },
    preview: {
      text: markdown.substring(0, 200) + (markdown.length > 200 ? "..." : ""),
      lineCount: markdown.split("\n").length,
    },
    reasoning,
    message: `Markdown block (${markdown.split("\n").length} lines)`,
  }),
});

export const insert_quiz = tool({
  description:
    "Insert a quiz block with multiple-choice questions. Use Question IDs from the provided question bank.",
  parameters: z.object({
    questionIDs: z
      .array(z.string())
      .describe(
        "Question model IDs from the question bank to include in the quiz",
      ),
    reasoning: z
      .string()
      .describe(
        "Brief pedagogical explanation for why these questions fit here",
      ),
  }),
  execute: async ({ questionIDs, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "quiz",
    blockData: { questionIDs },
    preview: { questionCount: questionIDs.length, questionIDs },
    reasoning,
    message: `Quiz block with ${questionIDs.length} question(s)`,
  }),
});

export const insert_answer = tool({
  description:
    "Insert a vocabulary answer block where students provide translations or definitions. Use Word IDs from the provided dictionary.",
  parameters: z.object({
    wordIDs: z
      .array(z.string())
      .describe("Word model IDs from the dictionary for vocabulary practice"),
    requestDefinition: z
      .enum(["translation", "definition", "phonetic"])
      .default("translation")
      .describe("What the learner must provide"),
    allowedInput: z
      .array(z.enum(["text", "audio", "image"]))
      .default(["text"])
      .describe("Accepted input types"),
    promptMethod: z
      .array(z.enum(["phrase", "audio", "image"]))
      .default(["phrase"])
      .describe("How the word is shown to the learner"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this exercise"),
  }),
  execute: async ({
    wordIDs,
    requestDefinition,
    allowedInput,
    promptMethod,
    reasoning,
  }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "answer",
    blockData: { wordIDs, requestDefinition, allowedInput, promptMethod },
    preview: {
      wordCount: wordIDs.length,
      mode: requestDefinition,
      inputMethods: allowedInput,
    },
    reasoning,
    message: `Answer block for ${wordIDs.length} word(s) (${requestDefinition})`,
  }),
});

export const insert_custom_answer = tool({
  description:
    "Insert a custom answer block with open-ended questions. Use Question IDs from the provided question bank.",
  parameters: z.object({
    questionIDs: z
      .array(z.string())
      .describe(
        "Question model IDs from the question bank for open-ended practice",
      ),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this exercise"),
  }),
  execute: async ({ questionIDs, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "custom-answer",
    blockData: { questionIDs },
    preview: { questionCount: questionIDs.length, questionIDs },
    reasoning,
    message: `Custom answer block with ${questionIDs.length} question(s)`,
  }),
});

export const insert_meaning_association = tool({
  description:
    "Insert a meaning association (drag-and-drop matching) block. Use 2-6 Word IDs from the provided dictionary.",
  parameters: z.object({
    wordIDs: z
      .array(z.string())
      .describe(
        "Word model IDs from the dictionary for matching exercise (2-6 recommended)",
      ),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this exercise"),
  }),
  execute: async ({ wordIDs, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "meaning-association",
    blockData: { wordIDs },
    preview: { wordCount: wordIDs.length, wordIDs },
    reasoning,
    message: `Meaning association block for ${wordIDs.length} word(s)`,
  }),
});

export const insert_playlist = tool({
  description:
    "Insert a media playlist block with audio/video files. Use File IDs from the provided files list.",
  parameters: z.object({
    fileIDs: z
      .array(z.string())
      .describe(
        "File model IDs for audio/video files to include in the playlist",
      ),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this media content"),
  }),
  execute: async ({ fileIDs, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "playlist",
    blockData: { fileIDs },
    preview: { fileCount: fileIDs.length, fileIDs },
    reasoning,
    message: `Playlist block with ${fileIDs.length} file(s)`,
  }),
});

export const insert_image = tool({
  description: "Insert an image block with alt text.",
  parameters: z.object({
    path: z.string().describe("S3 storage path for the image file"),
    altText: z.string().describe("Accessible alt text describing the image"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this image"),
  }),
  execute: async ({ path, altText, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "image",
    blockData: {
      path,
      altText,
      width: "100%",
      height: "auto",
      showCaption: false,
    },
    preview: { path, altText },
    reasoning,
    message: `Image block: "${altText}"`,
  }),
});

export const insert_excalidraw = tool({
  description:
    "Insert an Excalidraw drawing/whiteboard block for diagrams, flowcharts, or visual explanations.",
  parameters: z.object({
    reasoning: z
      .string()
      .describe(
        "Brief pedagogical explanation for why a drawing/diagram fits here",
      ),
  }),
  execute: async ({ reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "excalidraw",
    blockData: { data: "[]" },
    preview: { description: "Empty whiteboard for diagrams" },
    reasoning,
    message: "Excalidraw whiteboard block (empty canvas)",
  }),
});

export const insert_layout = tool({
  description:
    "Insert a multi-column layout container for side-by-side content.",
  parameters: z.object({
    columns: z.number().min(2).max(4).describe("Number of columns (2-4)"),
    templateColumns: z
      .string()
      .default("1fr 1fr")
      .describe("CSS grid-template-columns value"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for multi-column layout"),
  }),
  execute: async ({ columns, templateColumns, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "layout-container",
    blockData: {
      templateColumns: templateColumns || "1fr ".repeat(columns).trim(),
    },
    preview: {
      columns,
      templateColumns: templateColumns || "1fr ".repeat(columns).trim(),
    },
    reasoning,
    message: `${columns}-column layout block`,
  }),
});

/** All block insertion tools as a single object */
export const blockTools = {
  insert_heading,
  insert_paragraph,
  insert_markdown,
  insert_quiz,
  insert_answer,
  insert_custom_answer,
  insert_meaning_association,
  insert_playlist,
  insert_image,
  insert_excalidraw,
  insert_layout,
};

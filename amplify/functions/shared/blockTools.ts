/**
 * Shared block insertion tool definitions used by both chatStream and suggestBlocksStream handlers.
 *
 * Each tool returns a structured result with:
 * - action: "insert_editor_block"
 * - blockType: The editor block type identifier
 * - blockData: Full data needed to insert the block
 * - preview: Compact data for rendering a preview card
 * - reasoning: Pedagogical justification (from AI)
 * - message: Human-readable summary
 */

import { tool } from "ai";
import { z } from "zod";

export const insert_heading = tool({
  description:
    "Insert a heading block into the lesson. Use for section titles and subsection headers.",
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  inputSchema: z.object({
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
  description:
    "Insert an image block. Provide the file path, alt text, and optional dimensions.",
  inputSchema: z.object({
    path: z.string().describe("S3 storage path for the image file"),
    altText: z.string().describe("Accessible alt text describing the image"),
    width: z
      .string()
      .default("100%")
      .describe("Image width (CSS value, e.g. '100%', '500px')"),
    height: z.string().default("auto").describe("Image height (CSS value)"),
    showCaption: z
      .boolean()
      .default(false)
      .describe("Whether to show a caption below the image"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this image"),
  }),
  execute: async ({
    path,
    altText,
    width,
    height,
    showCaption,
    reasoning,
  }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "image",
    blockData: {
      path,
      altText,
      width: width || "100%",
      height: height || "auto",
      showCaption: showCaption || false,
    },
    preview: {
      path,
      altText,
      dimensions: `${width || "100%"} × ${height || "auto"}`,
    },
    reasoning,
    message: `Image block: "${altText}"`,
  }),
});

export const insert_pdf_viewer = tool({
  description:
    "Insert a PDF viewer block to display a document inline. Use for reference materials, handouts, or readings.",
  inputSchema: z.object({
    path: z.string().describe("S3 storage path for the PDF file"),
    filename: z.string().describe("Display filename for the PDF"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this document"),
  }),
  execute: async ({ path, filename, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "pdf-viewer",
    blockData: { path, filename },
    preview: { filename, path },
    reasoning,
    message: `PDF viewer block: "${filename}"`,
  }),
});

export const insert_table = tool({
  description:
    "Insert a spreadsheet-style table block. Provide rows with cells for structured data.",
  inputSchema: z.object({
    rows: z
      .array(
        z.object({
          cells: z
            .array(
              z.object({
                text: z.string().describe("Cell text content"),
                type: z
                  .enum(["header", "normal"])
                  .default("normal")
                  .describe("Cell type"),
              }),
            )
            .describe("Array of cells in this row"),
        }),
      )
      .describe("Array of row objects containing cells"),
    reasoning: z
      .string()
      .describe("Brief pedagogical explanation for this table"),
  }),
  execute: async ({ rows, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "tablesheet",
    blockData: {
      rows: rows.map((row: any, ri: number) => ({
        id: `row-${Date.now()}-${ri}`,
        height: 40,
        cells: row.cells.map((cell: any, ci: number) => ({
          id: `cell-${Date.now()}-${ri}-${ci}`,
          colSpan: 1,
          type: cell.type || "normal",
          width: null,
          json: JSON.stringify({
            root: {
              children: [
                {
                  children: [{ text: cell.text, type: "text" }],
                  type: "paragraph",
                  direction: "ltr",
                },
              ],
              type: "root",
            },
          }),
        })),
      })),
    },
    preview: {
      rowCount: rows.length,
      colCount: rows[0]?.cells?.length || 0,
      headerRow: rows[0]?.cells?.map((c: any) => c.text),
    },
    reasoning,
    message: `Table block: ${rows.length} rows × ${rows[0]?.cells?.length || 0} columns`,
  }),
});

export const insert_excalidraw = tool({
  description:
    "Insert an Excalidraw drawing/whiteboard block. Use for diagrams, flowcharts, or visual explanations that students can interact with.",
  inputSchema: z.object({
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

export const insert_file_metadata = tool({
  description:
    "Insert a file metadata block that displays file information and parsed content from a Document analysis.",
  inputSchema: z.object({
    fileID: z.string().describe("File model ID to display metadata for"),
    reasoning: z
      .string()
      .describe(
        "Brief pedagogical explanation for including this file reference",
      ),
  }),
  execute: async ({ fileID, reasoning }) => ({
    success: true,
    action: "insert_editor_block",
    blockType: "file-metadata",
    blockData: { fileID },
    preview: { fileID },
    reasoning,
    message: `File metadata block for file ${fileID}`,
  }),
});

export const insert_layout = tool({
  description:
    "Insert a multi-column layout container. Use for side-by-side content like vocabulary paired with images, or text with exercises.",
  inputSchema: z.object({
    columns: z.number().min(2).max(4).describe("Number of columns (2-4)"),
    templateColumns: z
      .string()
      .default("1fr 1fr")
      .describe(
        "CSS grid-template-columns value (e.g. '1fr 1fr', '1fr 2fr', '1fr 1fr 1fr')",
      ),
    reasoning: z
      .string()
      .describe(
        "Brief pedagogical explanation for using a multi-column layout",
      ),
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

/** All block insertion tools as a single object for spreading into tool configs */
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
  insert_pdf_viewer,
  insert_table,
  insert_excalidraw,
  insert_file_metadata,
  insert_layout,
};

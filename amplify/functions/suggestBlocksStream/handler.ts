/**
 * Suggest Blocks Stream HTTP API Handler for Gen 2
 *
 * REST API endpoint for streaming block suggestions:
 * - POST /suggest-blocks - Analyze unit and suggest next block types
 *
 * Features:
 * - Server-side SSE streaming via awslambda.streamifyResponse
 * - AI SDK streamText with tool calls
 * - Pedagogical content analysis
 * - Structured block suggestions via suggest_blocks tool
 * - Learning flow assessment
 *
 * Reference: amplify/backend/function/suggestBlocksStream/
 */

import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { blockTools } from "../shared/blockTools";

let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable not set");
    openaiInstance = createOpenAI({ apiKey });
  }
  return openaiInstance;
}

// Block insertion tools imported from shared module
const tools = blockTools;

/**
 * HTTP API Handler for POST /suggest-blocks
 */
export const handler = awslambda.streamifyResponse(
  async (
    event: any,
    responseStream: awslambda.HttpResponseStream,
    _context: any,
  ) => {
    // Prevent Lambda from waiting for empty event loop (OpenAI SDK keep-alive connections)
    _context.callbackWaitsForEmptyEventLoop = false;
    let streamStarted = false;
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { unitStructure, currentContext, dictionary, questionBank } = body;

      if (!unitStructure) {
        responseStream = awslambda.HttpResponseStream.from(responseStream, {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
        responseStream.write(
          JSON.stringify({ error: "unitStructure is required" }),
        );
        responseStream.end();
        return;
      }

      const openai = await getOpenAI();

      const systemMessage = `You are an expert educational content designer.

Analyze the provided lesson structure and suggest the next logical blocks that would best serve the pedagogical progression. Call the appropriate insert tools to suggest blocks.

Guidelines:
1. Consider what content already exists
2. Identify gaps in the learning sequence
3. Recommend blocks that build on previous content
4. Call multiple tools to suggest 2-4 blocks in priority order
5. Only use IDs that exist in the provided dictionary (for wordIDs), question bank (for questionIDs), or files list (for fileIDs)

Available tools:
- insert_heading — section titles and subsection headers
- insert_paragraph — short explanatory text
- insert_markdown — rich formatted content (lists, tables, emphasis, code, links)
- insert_quiz — multiple choice quiz using Question IDs
- insert_answer — vocabulary practice using Word IDs
- insert_custom_answer — open-ended practice using Question IDs
- insert_meaning_association — drag-and-drop word matching using 2-6 Word IDs
- insert_playlist — audio/video media playlist using File IDs
- insert_image — inline image with alt text
- insert_pdf_viewer — embedded PDF document viewer
- insert_table — structured data table with rows and cells
- insert_excalidraw — interactive drawing/whiteboard/diagram
- insert_file_metadata — file information display block
- insert_layout — multi-column layout container (2-4 columns)

Call 2-4 of these tools with appropriate data. Each tool call represents one suggested block. Include a reasoning field explaining the pedagogical justification.`;

      // Build user message with available resources
      let userContent = `Unit Structure:\n${JSON.stringify(unitStructure, null, 2)}\n\nCurrent Context:\n${JSON.stringify(currentContext || {}, null, 2)}`;

      if (dictionary && dictionary.length > 0) {
        // Send compact word summaries (id, word, definition) to keep token count low
        const wordSummaries = dictionary.slice(0, 50).map((w: any) => ({
          id: w.id,
          word: w.phrase || w.word,
          definition: w.definition,
          phonetic: w.phonetic,
        }));
        userContent += `\n\nAvailable Dictionary Words (${dictionary.length} total, showing first 50):\n${JSON.stringify(wordSummaries, null, 2)}`;
      }

      if (questionBank && questionBank.length > 0) {
        const questionSummaries = questionBank.slice(0, 30).map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
        }));
        userContent += `\n\nAvailable Questions (${questionBank.length} total, showing first 30):\n${JSON.stringify(questionSummaries, null, 2)}`;
      }

      const userMessage = userContent;

      console.log("[SuggestBlocks] Analyzing unit structure");

      console.log("[SuggestBlocks] Starting streamText with model gpt-4o");
      const startTime = Date.now();

      const result = streamText({
        model: openai("gpt-4o"),
        system: systemMessage,
        messages: [{ role: "user", content: userMessage }],
        tools,
        toolChoice: "required",
        temperature: 0.7,
        maxOutputTokens: 3000,
        maxRetries: 1,
      });

      // Stream response chunks as SSE via Lambda response streaming
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        },
      });
      streamStarted = true;

      let chunkCount = 0;
      const uiStream = result.toUIMessageStream();
      for await (const chunk of uiStream) {
        chunkCount++;
        responseStream.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      console.log(
        `[SuggestBlocks] Stream complete: ${chunkCount} chunks in ${Date.now() - startTime}ms`,
      );
      responseStream.end();
    } catch (error) {
      console.error("[SuggestBlocks] Error:", error);
      if (streamStarted) {
        responseStream.write(
          `data: ${JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Internal server error" })}\n\n`,
        );
        responseStream.end();
      } else {
        responseStream = awslambda.HttpResponseStream.from(responseStream, {
          statusCode: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
        responseStream.write(
          JSON.stringify({
            error:
              error instanceof Error ? error.message : "Internal server error",
          }),
        );
        responseStream.end();
      }
    }
  },
);

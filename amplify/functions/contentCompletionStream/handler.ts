/**
 * Content Completion Stream HTTP API Handler for Gen 2
 *
 * REST API endpoint for streaming content completion:
 * - POST /content-completion - Stream content completion for unit blocks
 *
 * Features:
 * - Server-side SSE streaming
 * - Context-aware completions (unit, recent blocks)
 * - Pedagogically sound continuations
 *
 * Reference: amplify/backend/function/contentCompletionStream/
 */

import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable not set");
    console.log(
      "[ContentCompletion] OpenAI API key loaded:",
      apiKey.substring(0, 7) + "..." + apiKey.substring(apiKey.length - 4),
    );
    openaiInstance = createOpenAI({ apiKey });
  }
  return openaiInstance;
}

/**
 * HTTP API Handler for POST /content-completion
 *
 * Streams content completion using OpenAI API
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
      const requestContext = event.requestContext as any;
      console.log("[ContentCompletion] Request received:", {
        path: event.path,
        method: event.httpMethod,
        hasAuth: !!requestContext?.authorizer,
        userId: requestContext?.authorizer?.claims?.sub,
      });

      const body = event.body ? JSON.parse(event.body) : {};
      const { prompt, context } = body;

      if (!prompt) {
        responseStream = awslambda.HttpResponseStream.from(responseStream, {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
        });
        responseStream.write(JSON.stringify({ error: "prompt is required" }));
        responseStream.end();
        return;
      }

      const openai = await getOpenAI();

      // Build system message
      let systemMessage = `You are an AI assistant helping to create educational content in Japanese. Complete the given text naturally and pedagogically.`;

      if (context) {
        if (context.unitName) {
          systemMessage += `\n\nCurrent Unit: ${context.unitName}`;
        }
        if (context.lastBlocks) {
          systemMessage += `\n\nRecent context: ${JSON.stringify(context.lastBlocks)}`;
        }
      }

      console.log(
        "[ContentCompletion] Creating completion for prompt:",
        prompt.substring(0, 50),
      );

      console.log("[ContentCompletion] Starting streamText with model gpt-4o");
      const startTime = Date.now();

      // Use AI SDK's streamText
      const result = streamText({
        model: openai("gpt-4o"),
        system: systemMessage,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        maxOutputTokens: 500,
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
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
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
        `[ContentCompletion] Stream complete: ${chunkCount} chunks in ${Date.now() - startTime}ms`,
      );
      responseStream.end();
    } catch (error) {
      console.error("[ContentCompletion] Error:", error);
      if (streamStarted) {
        responseStream.write(
          `data: ${JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Internal server error" })}\n\n`,
        );
        responseStream.end();
      } else {
        responseStream = awslambda.HttpResponseStream.from(responseStream, {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
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

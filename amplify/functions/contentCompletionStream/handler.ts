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

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');
    const { createOpenAI } = await import('@ai-sdk/openai');
    openaiInstance = createOpenAI({ apiKey });
  }
  return openaiInstance;
}

/**
 * HTTP API Handler for POST /content-completion
 * 
 * Streams content completion using OpenAI API
 */
export const handler: APIGatewayProxyHandlerV2 = async (event): Promise<any> => {
  try {
    const requestContext = event.requestContext as any;
    console.log('[ContentCompletion] Request received:', {
      path: event.rawPath,
      method: event.requestContext?.http?.method,
      hasAuth: !!requestContext?.authorizer,
      userId: requestContext?.authorizer?.jwt?.claims?.sub,
    });
    
    const body = event.body ? JSON.parse(event.body) : {};
    const { prompt, context } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'prompt is required' }),
      };
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

    console.log('[ContentCompletion] Creating completion for prompt:', prompt.substring(0, 50));

    // Use AI SDK's streamText
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemMessage,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    // Stream UI message chunks in SSE format
    const uiStream = result.toUIMessageStream();
    let responseBody = '';

    for await (const chunk of uiStream) {
      responseBody += `data: ${JSON.stringify(chunk)}\n\n`;
    }

    // Return streaming response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error('[ContentCompletion] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};
